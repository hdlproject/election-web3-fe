import { useState, useEffect, useCallback, useRef } from "react";
import { setAddresses, getReadProvider, getBrowserProvider, citizenship } from "chain-sdk";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Users, Settings, UserCog, UserMinus } from "lucide-react";
import { toast } from "sonner";
import contractAddresses from "chain-sdk/contract_addresses.json";
import { RefreshCcw } from "lucide-react"; // add icon
import { formatDistanceToNow } from 'date-fns';
import type { EventLog, Log, BrowserProvider } from "ethers";

// Static resolution of contract address (fallback to env)
const CITIZENSHIP_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Citizenship || import.meta.env.VITE_CITIZENSHIP_ADDRESS;
if (CITIZENSHIP_ADDRESS) {
  setAddresses({ Citizenship: CITIZENSHIP_ADDRESS });
}

// Helper to normalize unknown error values
function extractError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const obj = e as { message?: string; reason?: string };
    return obj.reason || obj.message || JSON.stringify(obj);
  }
  return "Unknown error";
}

export default function Citizenship() {
  const [formData, setFormData] = useState({ address: "", id: "", age: "" });
  // New form states
  const [electionContractInput, setElectionContractInput] = useState("");
  const [adminAddressInput, setAdminAddressInput] = useState("");
  const [citizens, setCitizens] = useState<{
    address: string;
    id: string;
    age: number;
    role: string;
  }[]>([]);
  const [electionContractAddress, setElectionContractAddress] = useState<string>("");
  const [electionAdmins, setElectionAdmins] = useState<string[]>([]); // may include non-citizens
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false); // track if current signer is owner
  const [refreshing, setRefreshing] = useState(false); // new
  const [lastUpdated, setLastUpdated] = useState<number | null>(null); // new
  const rpcUrl = import.meta.env.VITE_RPC_URL;
  const hasFetchedRef = useRef(false);

  const fetchCitizens = useCallback(async () => {
    // wrapped below by refreshCitizens for unified UX
    if (!CITIZENSHIP_ADDRESS) {
      setError("Citizenship contract address not configured.");
      return;
    }
    try {
      setError(null);
      const provider = getReadProvider(rpcUrl);
      const contract = citizenship.read(provider);
      // Fetch base data
      const addresses: string[] = await contract.getCitizens();
      let president: string = "";
      try { president = await contract.getPresident(); } catch (err) { /* president may not be set yet */ }
      let electionContractAddr: string = "";
      try {
        electionContractAddr = await contract.electionContract();
        setElectionContractAddress(electionContractAddr);
        if (!electionContractInput) setElectionContractInput(electionContractAddr);
      } catch (err) { /* election contract not linked yet */ }
      const electionAdminRole = await contract.ELECTION_ADMIN();
      // owner (for register permission checks)
      try { const owner = await contract.owner(); setOwnerAddress(owner); } catch (err) { /* owner query failed */ }
      // Parallel fetch citizen details
      const details = await Promise.all(addresses.map(async (addr) => {
        try {
          const [id, age] = await contract.getCitizen(addr);
          let role = "Citizen";
          if (president && president.toLowerCase() === addr.toLowerCase()) {
            role = "President";
          } else {
            try {
              const isAdmin = await contract.hasRole(electionAdminRole, addr);
              if (isAdmin) role = "Election Admin";
            } catch (err) { /* role check failed */ }
          }
          return { address: addr, id, age: Number(age), role };
        } catch {
          return { address: addr, id: "", age: 0, role: "Citizen" };
        }
      }));
      setCitizens(details);
      // Derive full election admin list from events (includes admins not registered as citizens)
      try {
        const addedFilter = contract.filters.ElectionAdminAdded();
        const removedFilter = contract.filters.ElectionAdminRemoved();
        const addedLogs = await contract.queryFilter(addedFilter, 0, "latest");
        const removedLogs = await contract.queryFilter(removedFilter, 0, "latest");
        const adminSet = new Set<string>();
        const getArgs = (ev: EventLog | Log): readonly unknown[] => ('args' in ev ? (ev as EventLog).args : []);
        for (const l of addedLogs) { const args = getArgs(l); const a = (args?.[0] as string) || undefined; if (a) adminSet.add(a.toLowerCase()); }
        for (const l of removedLogs) { const args = getArgs(l); const a = (args?.[0] as string) || undefined; if (a) adminSet.delete(a.toLowerCase()); }
        setElectionAdmins(Array.from(adminSet));
      } catch (e) {
        console.warn("Failed to parse election admin events", e);
      }
    } catch (e: unknown) {
      setError(extractError(e) || "Failed to load citizens");
    }
  }, [rpcUrl, electionContractInput]);

  const refreshCitizens = useCallback(async (opts?: { showToast?: boolean }) => {
    if (refreshing) return; // prevent overlap
    const first = !hasFetchedRef.current;
    setRefreshing(true);
    if (first) setLoading(true);
    try {
      await fetchCitizens();
      hasFetchedRef.current = true;
      setLastUpdated(Date.now());
      if (opts?.showToast) toast.success("Citizenship data refreshed");
    } finally {
      setRefreshing(false);
      if (first) setLoading(false);
    }
  }, [fetchCitizens, refreshing]);

  // Single initialization effect
  useEffect(() => {
    if (!hasFetchedRef.current) {
      refreshCitizens();
    }
  }, [refreshCitizens]);

  // Capture signer & derive isOwner after ownerAddress populated
  useEffect(() => {
    (async () => {
      try {
        const bp = getBrowserProvider();
        const signer = await bp.getSigner();
        const addr = await signer.getAddress();
        if (ownerAddress) setIsOwner(ownerAddress.toLowerCase() === addr.toLowerCase());
      } catch { setIsOwner(false); }
    })();
  }, [ownerAddress]);

  // Helper to assert owner via signer in write operations
  const ensureOwner = async (browserProvider: BrowserProvider): Promise<boolean> => {
    if (!ownerAddress) return false;
    try {
      const signer = await browserProvider.getSigner();
      const signerAddr = (await signer.getAddress()).toLowerCase();
      return signerAddr === ownerAddress.toLowerCase();
    } catch { return false; }
  };

  // Action handlers (restored)
  const handleRegister = async () => {
    if (!isOwner) { toast.error("Only contract owner can register citizens"); return; }
    if (!formData.address || !formData.id || !formData.age) { toast.error("All fields are required"); return; }
    if (!CITIZENSHIP_ADDRESS) { toast.error("Contract address not set"); return; }
    const ageNum = Number(formData.age);
    if (!Number.isInteger(ageNum) || ageNum <= 0) { toast.error("Invalid age"); return; }
    try {
      setTxPending(true); setError(null);
      const browserProvider = getBrowserProvider();
      if (!(await ensureOwner(browserProvider))) { toast.error("Only contract owner can register citizens"); setTxPending(false); return; }
      const writeContract = await citizenship.write(browserProvider);
      const tx = await writeContract.registerCitizen(formData.address, formData.id, ageNum);
      await tx.wait();
      toast.success("Citizen registered successfully");
      setFormData({ address: "", id: "", age: "" });
      await refreshCitizens();
    } catch (e: unknown) { toast.error(extractError(e) || "Registration failed"); } finally { setTxPending(false); }
  };

  const handleSetElectionContract = async () => {
    if (!isOwner) { toast.error("Owner only action"); return; }
    if (!electionContractInput) { toast.error("Provide election contract address"); return; }
    if (!CITIZENSHIP_ADDRESS) { toast.error("Citizenship address missing"); return; }
    try {
      setTxPending(true);
      const bp = getBrowserProvider();
      if (!(await ensureOwner(bp))) { toast.error("Owner only action"); setTxPending(false); return; }
      const writeContract = await citizenship.write(bp);
      const tx = await writeContract.setElectionContract(electionContractInput);
      await tx.wait();
      toast.success("Election contract linked");
      await refreshCitizens();
    } catch (e: unknown) { toast.error(extractError(e) || "Failed to set election contract"); } finally { setTxPending(false); }
  };

  const handleAddElectionAdmin = async () => {
    if (!isOwner) { toast.error("Owner only action"); return; }
    if (!adminAddressInput) { toast.error("Provide admin address"); return; }
    try {
      setTxPending(true);
      const bp = getBrowserProvider();
      if (!(await ensureOwner(bp))) { toast.error("Owner only action"); setTxPending(false); return; }
      const writeContract = await citizenship.write(bp);
      const tx = await writeContract.addElectionAdmin(adminAddressInput);
      await tx.wait();
      toast.success("Election admin added");
      setAdminAddressInput("");
      await refreshCitizens();
    } catch (e: unknown) { toast.error(extractError(e) || "Failed to add election admin"); } finally { setTxPending(false); }
  };

  const handleRemoveElectionAdmin = async (address: string) => {
    if (!isOwner) { toast.error("Owner only action"); return; }
    if (!address) return;
    try {
      setTxPending(true);
      const bp = getBrowserProvider();
      if (!(await ensureOwner(bp))) { toast.error("Owner only action"); setTxPending(false); return; }
      const writeContract = await citizenship.write(bp);
      const tx = await writeContract.removeElectionAdmin(address);
      await tx.wait();
      toast.success("Election admin removed");
      await refreshCitizens();
    } catch (e: unknown) { toast.error(extractError(e) || "Failed to remove election admin"); } finally { setTxPending(false); }
  };

  // Derived counts for UI (restored)
  const totalCitizens = citizens.length;
  const presidentCount = citizens.filter(c => c.role === "President").length;
  const electionAdminsCount = electionAdmins.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="animate-slide-in-left flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Citizenship Management</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Register citizens, manage election linkage & admins</p>
          {lastUpdated && <p className="text-xs text-muted-foreground mt-1">Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</p>}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => refreshCitizens({ showToast: true })} disabled={refreshing || txPending} aria-busy={refreshing} className="gap-2 hover-glow hover-scale flex-1 sm:flex-none">
            <RefreshCcw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} /> {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 animate-fade-in">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading on-chain data...</div>}

      <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary animate-float" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{totalCitizens}</CardTitle>
                <CardDescription>Total Citizens</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-accent animate-float" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{presidentCount}</CardTitle>
                <CardDescription>President</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-success animate-float" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{electionAdminsCount}</CardTitle>
                <CardDescription>Election Admins</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning/10 group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6 text-warning animate-float" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Election Contract</CardTitle>
                <CardDescription className="font-mono truncate max-w-[160px]" title={electionContractAddress || 'Not Set'}>{electionContractAddress ? `${electionContractAddress.slice(0,6)}...${electionContractAddress.slice(-4)}` : 'Not Set'}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning via-primary to-warning animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Link Election Contract</CardTitle>
          <CardDescription>Set the deployed Election contract address (owner only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="electionContract">Election Contract Address</Label>
            <Input id="electionContract" placeholder="0x..." value={electionContractInput} onChange={e => setElectionContractInput(e.target.value)} disabled={txPending} className="hover-lift" />
          </div>
          <Button onClick={handleSetElectionContract} disabled={txPending || !isOwner} className="w-full md:w-auto bg-gradient-primary hover-glow hover-scale">
            {txPending ? "Processing..." : isOwner ? "Set Election Contract" : "Owner Only"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Register New Citizen</CardTitle>
          <CardDescription>Add a new citizen (owner only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="address">Wallet Address</Label><Input id="address" placeholder="0x..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} disabled={txPending} className="hover-lift" /></div>
            <div className="space-y-2"><Label htmlFor="id">Citizen ID</Label><Input id="id" placeholder="CIT-XXX" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={txPending} className="hover-lift" /></div>
            <div className="space-y-2"><Label htmlFor="age">Age</Label><Input id="age" type="number" placeholder="18" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} disabled={txPending} className="hover-lift" /></div>
          </div>
          <Button onClick={handleRegister} disabled={txPending || !isOwner} className="w-full md:w-auto bg-gradient-primary hover-glow hover-scale"><UserPlus className="h-4 w-4 mr-2" /> {txPending ? "Processing..." : isOwner ? "Register Citizen" : "Owner Only"}</Button>
        </CardContent>
      </Card>

      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-success animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5 text-success" /> Manage Election Admins</CardTitle>
          <CardDescription>Add or remove election admins (owner only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="adminAddress">Admin Address</Label>
              <Input id="adminAddress" placeholder="0x..." value={adminAddressInput} onChange={e => setAdminAddressInput(e.target.value)} disabled={txPending} className="hover-lift" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddElectionAdmin} disabled={txPending || !isOwner} className="bg-gradient-success hover-glow hover-scale w-full md:w-auto">{txPending ? "Processing..." : isOwner ? "Add Admin" : "Owner Only"}</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Address</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {electionAdmins.map((addr, i) => (
                  <TableRow key={addr} className="hover:bg-accent/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    <TableCell className="font-mono truncate max-w-[220px]" title={addr}>{addr}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveElectionAdmin(addr)} disabled={txPending || !isOwner} className="hover-glow hover-scale"><UserMinus className="h-4 w-4 mr-1" /> Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && electionAdmins.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No election admins found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-success animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Registered Citizens</CardTitle>
          <CardDescription>All citizens (live)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Address</TableHead><TableHead>Citizen ID</TableHead><TableHead>Age</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
            <TableBody>
              {citizens.map((c, i) => (
                <TableRow key={c.address} className="hover:bg-accent/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <TableCell className="font-mono truncate max-w-[160px]" title={c.address}>{c.address}</TableCell>
                  <TableCell className="font-semibold">{c.id || '-'}</TableCell>
                  <TableCell>{c.age || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={c.role === 'President' ? 'default' : c.role === 'Election Admin' ? 'secondary' : 'outline'} className="hover-scale">{c.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && citizens.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No citizens found on-chain.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
