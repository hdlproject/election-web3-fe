import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Vote, Award, Coins, TrendingUp, UserCheck, Play, Square, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { setAddresses, getReadProvider, getBrowserProvider, citizenship, election, money } from "chain-sdk";
import contractAddresses from "chain-sdk/contract_addresses.json";

// Resolve & register contract addresses (fallback to env vars)
const ADDR_JSON = contractAddresses as Record<string, string>;
const CITIZENSHIP_ADDRESS: string | undefined = ADDR_JSON.Citizenship || import.meta.env.VITE_CITIZENSHIP_ADDRESS;
const ELECTION_ADDRESS: string | undefined = ADDR_JSON.Election || import.meta.env.VITE_ELECTION_ADDRESS;
const MONEY_ADDRESS: string | undefined = ADDR_JSON.Money || import.meta.env.VITE_MONEY_ADDRESS;
if (CITIZENSHIP_ADDRESS) setAddresses({ Citizenship: CITIZENSHIP_ADDRESS });
if (ELECTION_ADDRESS) setAddresses({ Election: ELECTION_ADDRESS });
if (MONEY_ADDRESS) setAddresses({ Money: MONEY_ADDRESS });

function extractError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") { const o = e as { message?: string; reason?: string }; return o.reason || o.message || JSON.stringify(o); }
  return "Unknown error";
}

interface DashboardStats {
  totalCitizens: number;
  electionStatus: { started: boolean; finished: boolean; leader: string; leaderVotes: number } | null;
  electionAdmins: number;
  tokenSupply: string; // formatted
  president: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isElectionAdmin, setIsElectionAdmin] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({ address: "", id: "", age: "" });
  const [txPending, setTxPending] = useState(false);

  const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
  if (!import.meta.env.VITE_RPC_URL) console.warn("[Dashboard] VITE_RPC_URL not defined; using local fallback");

  const refresh = useCallback(async () => {
    if (!CITIZENSHIP_ADDRESS) { setError("Citizenship contract not configured"); return; }
    try {
      setLoading(true);
      setError(null);
      const provider = getReadProvider(rpcUrl);
      const readCitizenship = citizenship.read(provider);
      const promises: Promise<any>[] = [readCitizenship.getCitizens().catch(() => [])];

      // Election status & related
      let electionStatus: DashboardStats['electionStatus'] = null;
      let electeesCount = 0;
      if (ELECTION_ADDRESS) {
        try {
          const readElection = election.read(provider);
          const statusArr = await readElection.getStatus();
          electionStatus = { started: statusArr[0], finished: statusArr[1], leader: statusArr[2], leaderVotes: Number(statusArr[3]) };
          const electees = await readElection.getElectees().catch(() => []);
          electeesCount = electees.length;
        } catch (e) { /* silent */ }
      }

      // Election admins via events (like Citizenship page)
      let electionAdminsCount = 0;
      try {
        const addedLogs = await readCitizenship.queryFilter(readCitizenship.filters.ElectionAdminAdded(), 0, "latest");
        const removedLogs = await readCitizenship.queryFilter(readCitizenship.filters.ElectionAdminRemoved(), 0, "latest");
        const adminSet = new Set<string>();
        for (const l of addedLogs) { const a = l.args?.[0]; if (a) adminSet.add(a.toLowerCase()); }
        for (const l of removedLogs) { const a = l.args?.[0]; if (a) adminSet.delete(a.toLowerCase()); }
        electionAdminsCount = adminSet.size;
      } catch { /* ignore */ }

      // President
      let president = "";
      try { president = await readCitizenship.getPresident(); } catch { /* ignore */ }

      // Token supply
      let tokenSupply = "0";
      if (MONEY_ADDRESS) {
        try {
          const readMoney = money.read(provider);
            const [supplyBN, decs] = await Promise.all([
              readMoney.totalSupply().catch(() => 0n),
              readMoney.decimals().catch(() => 18)
            ]);
          const { formatUnits } = await import("ethers");
          tokenSupply = formatUnits(supplyBN, Number(decs));
        } catch { /* ignore */ }
      }

      const citizenAddresses: string[] = await promises[0];
      setStats({
        totalCitizens: citizenAddresses.length,
        electionStatus,
        electionAdmins: electionAdminsCount,
        tokenSupply,
        president,
      });
    } catch (e: unknown) {
      setError(extractError(e) || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [rpcUrl]);

  // Initialize signer & role checks
  useEffect(() => {
    (async () => {
      try {
        const bp = getBrowserProvider();
        const signer = await bp.getSigner();
        const addr = await signer.getAddress();
        setSignerAddress(addr);
        // Owner check
        if (CITIZENSHIP_ADDRESS) {
          try {
            const provider = getReadProvider(rpcUrl);
            const readCitizenship = citizenship.read(provider);
            const owner = await readCitizenship.owner();
            setIsOwner(owner.toLowerCase() === addr.toLowerCase());
            // Election admin
            try {
              const role = await readCitizenship.ELECTION_ADMIN();
              const has = await readCitizenship.hasRole(role, addr);
              setIsElectionAdmin(has);
            } catch {/* ignore */}
          } catch {/* ignore */}
        }
      } catch {
        setSignerAddress(null);
      }
    })();
  }, [rpcUrl]);

  useEffect(() => { refresh(); }, [refresh]);

  const registerCitizen = async () => {
    if (!isOwner) { toast.error("Owner only action"); return; }
    if (!registerForm.address || !registerForm.id || !registerForm.age) { toast.error("All fields required"); return; }
    const ageNum = Number(registerForm.age);
    if (!Number.isInteger(ageNum) || ageNum <= 0) { toast.error("Invalid age"); return; }
    try {
      setTxPending(true);
      const bp = getBrowserProvider();
      const writeCitizenship = await citizenship.write(bp);
      const tx = await writeCitizenship.registerCitizen(registerForm.address, registerForm.id, ageNum);
      await tx.wait();
      toast.success("Citizen registered");
      setRegisterForm({ address: "", id: "", age: "" });
      await refresh();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Registration failed");
    } finally { setTxPending(false); }
  };

  const handleStartElection = async () => {
    if (!isElectionAdmin) { toast.error("Admin only"); return; }
    if (!ELECTION_ADDRESS) { toast.error("Election contract missing"); return; }
    if (stats?.electionStatus?.started) { toast("Already started"); return; }
    try {
      setTxPending(true);
      const bp = getBrowserProvider();
      const writeElection = await election.write(bp);
      const tx = await writeElection.start();
      await tx.wait();
      toast.success("Election started");
      await refresh();
    } catch (e: unknown) { toast.error(extractError(e) || "Start failed"); }
    finally { setTxPending(false); }
  };

  const handleFinishElection = async () => {
    if (!isElectionAdmin) { toast.error("Admin only"); return; }
    if (!ELECTION_ADDRESS) { toast.error("Election contract missing"); return; }
    if (!stats?.electionStatus?.started || stats.electionStatus.finished) { toast("Not active"); return; }
    try {
      setTxPending(true);
      const bp = getBrowserProvider();
      const writeElection = await election.write(bp);
      const tx = await writeElection.finish();
      await tx.wait();
      toast.success("Election finished");
      await refresh();
    } catch (e: unknown) { toast.error(extractError(e) || "Finish failed"); }
    finally { setTxPending(false); }
  };

  const statItems = (() => {
    const s = stats;
    return [
      {
        title: "Total Citizens",
        value: s ? s.totalCitizens.toLocaleString() : "-",
        icon: Users,
        change: loading ? "Loading..." : s ? `${s.totalCitizens}` : "-",
        changeType: "neutral" as const,
      },
      {
        title: "Election",
        value: (() => {
          if (!s || !s.electionStatus) return "Not Configured";
            if (s.electionStatus.finished) return "Finished";
            if (s.electionStatus.started) return "Active";
            return "Pending";
        })(),
        icon: Vote,
        change: s?.electionStatus ? (s.electionStatus.started ? `${s.electionStatus.leaderVotes} leader votes` : "Awaiting start") : "-",
        changeType: s?.electionStatus?.started ? "positive" as const : "neutral" as const,
      },
      {
        title: "Election Admins",
        value: s ? s.electionAdmins.toString() : "-",
        icon: Award,
        change: isElectionAdmin ? "You are admin" : "Role based",
        changeType: isElectionAdmin ? "positive" as const : "neutral" as const,
      },
      {
        title: "Token Supply",
        value: s ? (Number(s.tokenSupply) ? Number(s.tokenSupply).toLocaleString() : s.tokenSupply) : "-",
        icon: Coins,
        change: s?.president ? `President ${s.president.slice(0,6)}...` : "No president",
        changeType: s?.president ? "positive" as const : "neutral" as const,
      },
    ];
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="animate-slide-in-left flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Overview of on-chain governance & economy</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" disabled={loading || txPending} onClick={() => refresh()} className="hover-glow hover-scale flex-1 sm:flex-none">Refresh</Button>
        </div>
      </div>
      {error && <div className="text-sm text-red-500 animate-fade-in">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading data from blockchain...</div>}
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`glass hover-lift hover-glow transition-all animate-scale-in stagger-${index + 1} overflow-hidden group relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-primary group-hover:animate-float" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className={`text-xs mt-1 font-medium ${
                  stat.changeType === "positive" ? "text-success" : "text-muted-foreground"
                }`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Quick Actions (Write) */}
      <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-primary/50 transition-all">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              Register Citizen
            </CardTitle>
            <p className="text-xs text-muted-foreground">Owner only quick action</p>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            {!registerOpen && (
              <Button variant="outline" disabled={!isOwner || txPending} className="w-full hover-scale" onClick={() => setRegisterOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Open Form
              </Button>
            )}
            {registerOpen && (
              <div className="space-y-2 animate-fade-in">
                <div className="grid gap-2">
                  <Label className="text-xs">Address</Label>
                  <Input placeholder="0x..." value={registerForm.address} disabled={txPending} onChange={e => setRegisterForm(f => ({ ...f, address: e.target.value }))} className="hover-lift" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Citizen ID</Label>
                  <Input placeholder="CIT-001" value={registerForm.id} disabled={txPending} onChange={e => setRegisterForm(f => ({ ...f, id: e.target.value }))} className="hover-lift" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Age</Label>
                  <Input type="number" placeholder="18" value={registerForm.age} disabled={txPending} onChange={e => setRegisterForm(f => ({ ...f, age: e.target.value }))} className="hover-lift" />
                </div>
                <div className="flex gap-2">
                  <Button disabled={!isOwner || txPending} onClick={registerCitizen} className="flex-1 bg-gradient-primary hover-glow hover-scale">
                    {txPending ? 'Processing...' : 'Register'}
                  </Button>
                  <Button variant="outline" disabled={txPending} onClick={() => { setRegisterOpen(false); setRegisterForm({ address: '', id: '', age: '' }); }} className="hover-scale">Cancel</Button>
                </div>
              </div>
            )}
            {!isOwner && <p className="text-[10px] text-muted-foreground">Connect as owner to enable</p>}
          </CardContent>
        </Card>

        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-success/50 transition-all">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10 group-hover:scale-110 transition-transform">
                <Play className="h-5 w-5 text-success" />
              </div>
              Start Election
            </CardTitle>
            <p className="text-xs text-muted-foreground">Election admin only</p>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <Button disabled={!isElectionAdmin || txPending || stats?.electionStatus?.started} onClick={handleStartElection} className="w-full bg-gradient-success hover-glow hover-scale">
              {txPending ? 'Processing...' : stats?.electionStatus?.started ? 'Already Started' : 'Start Election'}
            </Button>
            {!isElectionAdmin && <p className="text-[10px] text-muted-foreground">Requires admin role</p>}
          </CardContent>
        </Card>

        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-destructive/50 transition-all">
          <div className="absolute inset-0 bg-gradient-danger opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10 group-hover:scale-110 transition-transform">
                <Square className="h-5 w-5 text-destructive" />
              </div>
              Finish Election
            </CardTitle>
            <p className="text-xs text-muted-foreground">Election admin only</p>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <Button disabled={!isElectionAdmin || txPending || !stats?.electionStatus?.started || stats?.electionStatus?.finished} onClick={handleFinishElection} variant="destructive" className="w-full hover-glow hover-scale">
              {txPending ? 'Processing...' : !stats?.electionStatus?.started ? 'Not Started' : stats?.electionStatus?.finished ? 'Finished' : 'Finish Election'}
            </Button>
            {!isElectionAdmin && <p className="text-[10px] text-muted-foreground">Requires admin role</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (lightweight placeholder – could aggregate events) */}
      {/* In a future enhancement we can query a subset of recent events across contracts */}
    </div>
  );
}
