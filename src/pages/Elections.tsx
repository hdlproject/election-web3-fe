import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play, Square, UserPlus, Vote, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useState, useRef } from "react";
import { setAddresses, getReadProvider, getBrowserProvider, election, citizenship } from "chain-sdk";
import contractAddresses from "chain-sdk/contract_addresses.json";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from 'date-fns';

// Resolve contract addresses (fallback to env vars if present)
const ELECTION_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Election || import.meta.env.VITE_ELECTION_ADDRESS;
const CITIZENSHIP_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Citizenship || import.meta.env.VITE_CITIZENSHIP_ADDRESS;
if (ELECTION_ADDRESS) setAddresses({ Election: ELECTION_ADDRESS });
if (CITIZENSHIP_ADDRESS) setAddresses({ Citizenship: CITIZENSHIP_ADDRESS });

// Helper to normalize unknown error values
function extractError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const obj = e as { message?: string; reason?: string };
    return obj.reason || obj.message || JSON.stringify(obj);
  }
  return "Unknown error";
}

interface ElecteeRow {
  address: string;
  id: string;
  age: number;
  votes: number;
}
interface ElectorRow {
  address: string;
  id: string;
  age: number;
  alreadyElected: boolean;
}

export default function Elections() {
  const [electees, setElectees] = useState<ElecteeRow[]>([]);
  const [electors, setElectors] = useState<ElectorRow[]>([]);
  const [status, setStatus] = useState<{ started: boolean; finished: boolean; leader: string; leaderVotes: number }>({ started: false, finished: false, leader: "", leaderVotes: 0 });
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  // New input states for admin-provided addresses
  const [electeeAddressInput, setElecteeAddressInput] = useState<string>("");
  const [electorAddressInput, setElectorAddressInput] = useState<string>("");
  const [voteAddressInput, setVoteAddressInput] = useState<string>(""); // candidate address to vote for
  const [refreshing, setRefreshing] = useState(false); // new
  const [lastUpdated, setLastUpdated] = useState<number | null>(null); // new
  const firstLoadRef = useRef(true); // track initial load without depending on lastUpdated

  const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
  if (!import.meta.env.VITE_RPC_URL) {
    console.warn("[Elections] VITE_RPC_URL not defined; using fallback http://127.0.0.1:8545");
  }

  const refreshElection = useCallback(async (opts?: { showToast?: boolean }) => {
    if (!ELECTION_ADDRESS) {
      setError("Election contract address not configured.");
      return;
    }
    const first = firstLoadRef.current;
    setRefreshing(true);
    if (first) setLoading(true);
    try {
      setError(null);
      const provider = getReadProvider(rpcUrl);
      const readElection = election.read(provider);
      const readCitizenship = citizenship.read(provider);

      // Fetch election status
      try {
        const [started, finished, leader, leaderVotes] = await readElection.getStatus();
        setStatus({ started, finished, leader, leaderVotes: Number(leaderVotes) });
      } catch (e) { console.warn("Failed to fetch status", e); }

      // Fetch electee addresses
      const addresses: string[] = await readElection.getElectees();
      // Parallel fetch detail per electee
      const rows: ElecteeRow[] = await Promise.all(addresses.map(async (addr) => {
        try { const [id, age, voteCount] = await readElection.getElectee(addr); return { address: addr, id, age: Number(age), votes: Number(voteCount) }; } catch { return { address: addr, id: "", age: 0, votes: 0 }; }
      }));
      // Fetch electors
      let electorRows: ElectorRow[] = [];
      try {
        const electorAddresses: string[] = await readElection.getElectors();
        electorRows = await Promise.all(electorAddresses.map(async (addr) => {
          try { const [id, age, alreadyElected] = await readElection.getElector(addr); return { address: addr, id, age: Number(age), alreadyElected }; } catch { return { address: addr, id: "", age: 0, alreadyElected: false }; }
        }));
      } catch (e) { /* ignore electors fetch failure */ }

      // Determine admin (needs citizenship role check)
      try {
        const electionAdminRole = await readCitizenship.ELECTION_ADMIN();
        if (signerAddress) {
          const has = await readCitizenship.hasRole(electionAdminRole, signerAddress);
          setIsAdmin(has);
        }
      } catch {}

      setElectees(rows);
      setElectors(electorRows);
      setLastUpdated(Date.now());
      if (opts?.showToast) toast.success('Election data refreshed');
    } catch (e: unknown) {
      setError(extractError(e) || "Failed to load election data");
    } finally {
      setRefreshing(false);
      if (first) {
        setLoading(false);
        firstLoadRef.current = false;
      }
    }
  }, [rpcUrl, signerAddress]);

  // Capture signer (if wallet connected) & admin role
  const initSigner = useCallback(async () => {
    try {
      const browserProvider = getBrowserProvider();
      const signer = await browserProvider.getSigner();
      const addr = await signer.getAddress();
      setSignerAddress(addr);
    } catch {
      setSignerAddress(null);
    }
  }, []);

  useEffect(() => {
    initSigner();
  }, [initSigner]);

  useEffect(() => {
    refreshElection();
  }, [refreshElection]);

  const handleStart = async () => {
    if (!isAdmin) {
      toast.error("Only election admin can start the election");
      return;
    }
    if (status.started) {
      toast("Election already started");
      return;
    }
    if (electees.length === 0) {
      toast.error("No candidates registered");
      return;
    }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeElection = await election.write(browserProvider);
      const tx = await writeElection.start();
      await tx.wait();
      toast.success("Election started");
      await refreshElection();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Start failed");
    } finally {
      setTxPending(false);
    }
  };

  const handleFinish = async () => {
    if (!isAdmin) {
      toast.error("Only election admin can finish the election");
      return;
    }
    if (!status.started || status.finished) {
      toast("Election not active or already finished");
      return;
    }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeElection = await election.write(browserProvider);
      const tx = await writeElection.finish();
      await tx.wait();
      toast.success("Election finished");
      await refreshElection();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Finish failed");
    } finally {
      setTxPending(false);
    }
  };

  const handleRegisterElectee = async () => {
    if (!isAdmin) {
      toast.error("Only election admin can register candidates");
      return;
    }
    if (status.started) {
      toast.error("Cannot register after start");
      return;
    }
    if (!electeeAddressInput) {
      toast.error("Enter candidate wallet address");
      return;
    }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeElection = await election.write(browserProvider);
      const tx = await writeElection.registerElectee(electeeAddressInput);
      await tx.wait();
      toast.success("Candidate registered");
      setElecteeAddressInput("");
      await refreshElection();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Electee registration failed");
    } finally {
      setTxPending(false);
    }
  };

  const handleRegisterElector = async () => {
    if (!isAdmin) {
      toast.error("Only election admin can register voters");
      return;
    }
    if (status.started) {
      toast.error("Cannot register after start");
      return;
    }
    if (!electorAddressInput) {
      toast.error("Enter voter wallet address");
      return;
    }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeElection = await election.write(browserProvider);
      const tx = await writeElection.registerElector(electorAddressInput);
      await tx.wait();
      toast.success("Voter registered");
      setElectorAddressInput("");
      await refreshElection();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Elector registration failed");
    } finally {
      setTxPending(false);
    }
  };

  const electorRecord = electors.find(e => signerAddress && e.address.toLowerCase() === signerAddress.toLowerCase());

  const handleVote = async () => {
    if (!signerAddress) { toast.error("Connect wallet to vote"); return; }
    if (!status.started || status.finished) { toast.error("Election not active"); return; }
    if (!electorRecord) { toast.error("You are not a registered elector"); return; }
    if (electorRecord.alreadyElected) { toast.error("You have already voted"); return; }
    if (!voteAddressInput) { toast.error("Enter candidate address"); return; }
    const candidate = electees.find(c => c.address.toLowerCase() === voteAddressInput.toLowerCase());
    if (!candidate) { toast.error("Address is not a registered candidate"); return; }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeElection = await election.write(browserProvider);
      const tx = await writeElection.elect(voteAddressInput);
      await tx.wait();
      toast.success("Vote cast successfully");
      setVoteAddressInput("");
      await refreshElection();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Vote failed");
    } finally { setTxPending(false); }
  };

  const totalVotes = electees.reduce((sum, e) => sum + e.votes, 0);
  const statusLabel = status.finished ? "Finished" : status.started ? "Active" : "Not Started";
  const leaderDisplay = status.leader ? `${status.leader.slice(0, 6)}...${status.leader.slice(-4)}` : "-";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Election Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage elections and voting</p>
          {lastUpdated && <p className="text-xs text-muted-foreground mt-1">Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => refreshElection({ showToast: true })} variant="outline" className="gap-2 hover-glow hover-scale flex-1 sm:flex-none" disabled={refreshing || txPending} aria-busy={refreshing}>
            <RefreshCcw className={"h-4 w-4 " + (refreshing ? 'animate-spin' : '')} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handleStart} className="gap-2 bg-gradient-success hover-glow hover-scale shadow-strong flex-1 sm:flex-none" disabled={txPending || status.started || !isAdmin}>
            <Play className="h-4 w-4" /> Start
          </Button>
          <Button onClick={handleFinish} variant="destructive" className="gap-2 hover-glow hover-scale shadow-strong flex-1 sm:flex-none" disabled={txPending || !status.started || status.finished || !isAdmin}>
            <Square className="h-4 w-4" /> Finish
          </Button>
        </div>
      </div>
      {error && <div className="text-sm text-red-500 animate-fade-in">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading election data...</div>}

      {/* Status Card */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary animate-float" />
            Current Election Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="animate-fade-in stagger-1">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Badge className={`${statusLabel === 'Active' ? 'bg-gradient-success animate-pulse-slow shadow-glow' : statusLabel === 'Finished' ? 'bg-secondary' : 'bg-warning/30'} transition-colors`}>{statusLabel}</Badge>
            </div>
            <div className="animate-fade-in stagger-2">
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-3xl font-bold mt-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {electees.length}
              </p>
            </div>
            <div className="animate-fade-in stagger-3">
              <p className="text-sm text-muted-foreground">Total Votes</p>
              <p className="text-3xl font-bold mt-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {totalVotes}
              </p>
            </div>
            <div className="animate-fade-in stagger-4">
              <p className="text-sm text-muted-foreground">Leading Candidate</p>
              <p className="text-lg font-semibold mt-1 font-mono text-primary">{leaderDisplay}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3 animate-fade-in">{/* changed cols to 3 */}
        {/* Register Candidate Card (unchanged except layout) */}
        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-primary/50 transition-all">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              Register Candidate
            </CardTitle>
            <CardDescription>Register any wallet as a candidate (admin only)</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="electeeAddress">Candidate Wallet Address</Label>
              <Input
                id="electeeAddress"
                placeholder="0x..."
                value={electeeAddressInput}
                onChange={(e) => setElecteeAddressInput(e.target.value)}
                disabled={txPending || status.started || !isAdmin}
                className="hover-lift"
              />
            </div>
            <Button onClick={handleRegisterElectee} disabled={txPending || status.started || !isAdmin || !electeeAddressInput} className="w-full bg-gradient-primary hover-glow hover-scale">
              {txPending ? "Processing..." : "Register Electee"}
            </Button>
          </CardContent>
        </Card>

        {/* Register Voter Card (unchanged except layout) */}
        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-accent/50 transition-all">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:scale-110 transition-transform">
                <Vote className="h-5 w-5 text-accent" />
              </div>
              Register Voter
            </CardTitle>
            <CardDescription>Register any wallet as a voter (admin only)</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="electorAddress">Voter Wallet Address</Label>
              <Input
                id="electorAddress"
                placeholder="0x..."
                value={electorAddressInput}
                onChange={(e) => setElectorAddressInput(e.target.value)}
                disabled={txPending || status.started || !isAdmin}
                className="hover-lift"
              />
            </div>
            <Button onClick={handleRegisterElector} disabled={txPending || status.started || !isAdmin || !electorAddressInput} className="w-full bg-gradient-success hover-glow hover-scale">
              {txPending ? "Processing..." : "Register Elector"}
            </Button>
          </CardContent>
        </Card>

        {/* Vote Card */}
        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-success/50 transition-all">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10 group-hover:scale-110 transition-transform">
                <Vote className="h-5 w-5 text-success" />
              </div>
              Cast Vote
            </CardTitle>
            <CardDescription>Electors can vote for any registered candidate</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voteCandidate">Candidate Wallet Address</Label>
              <Input
                id="voteCandidate"
                placeholder="0x..."
                value={voteAddressInput}
                onChange={(e) => setVoteAddressInput(e.target.value)}
                disabled={txPending || !status.started || status.finished || !electorRecord || electorRecord.alreadyElected}
                className="hover-lift"
              />
            </div>
            <Button
              onClick={handleVote}
              disabled={txPending || !status.started || status.finished || !electorRecord || electorRecord.alreadyElected || !voteAddressInput}
              className="w-full bg-gradient-success hover-glow hover-scale"
            >
              {txPending ? "Processing..." : electorRecord?.alreadyElected ? "Already Voted" : !status.started ? "Election Not Started" : "Cast Vote"}
            </Button>
            {electorRecord && !electorRecord.alreadyElected && status.started && !status.finished && (
              <p className="text-xs text-muted-foreground">You can vote only once. Ensure the candidate address is correct.</p>
            )}
            {!electorRecord && status.started && !status.finished && (
              <p className="text-xs text-warning">Register as elector first to vote.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Candidates List */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-accent bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Election Candidates</CardTitle>
          <CardDescription>All registered candidates and their vote counts (live)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Citizen ID</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {electees.map((electee, index) => {
                  const percentage = totalVotes > 0 ? ((electee.votes / totalVotes) * 100).toFixed(1) : "0.0";
                  const isLeader = status.leader && electee.address.toLowerCase() === status.leader.toLowerCase();
                  return (
                    <TableRow
                      key={electee.address}
                      className={`hover:bg-accent/5 transition-all animate-fade-in ${isLeader ? 'bg-primary/5' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <TableCell className="font-mono truncate max-w-[160px]" title={electee.address}>{electee.address}</TableCell>
                      <TableCell className="font-semibold">{electee.id || '-'}</TableCell>
                      <TableCell>{electee.age || '-'}</TableCell>
                      <TableCell className="font-bold text-lg">{electee.votes}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out ${isLeader ? 'animate-pulse-slow shadow-glow' : ''}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-14 text-right">{percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && electees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No candidates registered on-chain.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Electors List (below candidates) */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <CardContent>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Citizen ID</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Voted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {electors.map((elector, index) => (
                  <TableRow
                    key={elector.address}
                    className="hover:bg-accent/5 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <TableCell className="font-mono truncate max-w-[160px]" title={elector.address}>{elector.address}</TableCell>
                    <TableCell className="font-semibold">{elector.id || '-'}</TableCell>
                    <TableCell>{elector.age || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={elector.alreadyElected ? 'secondary' : 'outline'} className={elector.alreadyElected ? 'bg-success/20 text-success hover-scale' : 'hover-scale'}>
                        {elector.alreadyElected ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && electors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No electors registered on-chain.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
