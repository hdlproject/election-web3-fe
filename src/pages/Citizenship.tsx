import { useState, useEffect, useCallback } from "react";
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
  const rpcUrl = import.meta.env.VITE_RPC_URL;

  const fetchCitizens = useCallback(async () => {
    if (!CITIZENSHIP_ADDRESS) {
      setError("Citizenship contract address not configured.");
      return;
    }
    try {
      setLoading(true);
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
        for (const l of addedLogs) { const a = l.args?.[0]; if (a) adminSet.add(a.toLowerCase()); }
        for (const l of removedLogs) { const a = l.args?.[0]; if (a) adminSet.delete(a.toLowerCase()); }
        setElectionAdmins(Array.from(adminSet));
      } catch (e) {
        console.warn("Failed to parse election admin events", e);
      }
    } catch (e: unknown) {
      setError(extractError(e) || "Failed to load citizens");
    } finally {
      setLoading(false);
    }
  }, [rpcUrl, electionContractInput]);

  useEffect(() => { fetchCitizens(); }, [fetchCitizens]);

  const ensureOwner = async (browserProvider: any): Promise<boolean> => {
    if (!ownerAddress) return false;
    try {
      const signer = await browserProvider.getSigner();
      const signerAddr = (await signer.getAddress()).toLowerCase();
      return signerAddr === ownerAddress.toLowerCase();
    } catch (err) { /* signer retrieval failed */ }
    return false;
  };

  const handleRegister = async () => {
    if (!formData.address || !formData.id || !formData.age) {
      toast.error("All fields are required");
      return;
    }
    if (!CITIZENSHIP_ADDRESS) {
      toast.error("Contract address not set");
      return;
    }
    const ageNum = Number(formData.age);
    if (!Number.isInteger(ageNum) || ageNum <= 0) {
      toast.error("Invalid age");
      return;
    }
    try {
      setTxPending(true);
      setError(null);
      const browserProvider = getBrowserProvider();
      const writeContract = await citizenship.write(browserProvider);
      if (!(await ensureOwner(browserProvider))) {
        toast.error("Only contract owner can register citizens");
        setTxPending(false);
        return;
      }
      const tx = await writeContract.registerCitizen(formData.address, formData.id, ageNum);
      await tx.wait();
      toast.success("Citizen registered successfully");
      setFormData({ address: "", id: "", age: "" });
      await fetchCitizens();
    } catch (e: unknown) {
      const msg = extractError(e) || "Registration failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setTxPending(false);
    }
  };

  const handleSetElectionContract = async () => {
    if (!electionContractInput) { toast.error("Provide election contract address"); return; }
    if (!CITIZENSHIP_ADDRESS) { toast.error("Citizenship address missing"); return; }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      if (!(await ensureOwner(browserProvider))) { toast.error("Owner only action"); setTxPending(false); return; }
      const writeContract = await citizenship.write(browserProvider);
      const tx = await writeContract.setElectionContract(electionContractInput);
      await tx.wait();
      toast.success("Election contract linked");
      await fetchCitizens();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Failed to set election contract");
    } finally { setTxPending(false); }
  };

  const handleAddElectionAdmin = async () => {
    if (!adminAddressInput) { toast.error("Provide admin address"); return; }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      if (!(await ensureOwner(browserProvider))) { toast.error("Owner only action"); setTxPending(false); return; }
      const writeContract = await citizenship.write(browserProvider);
      const tx = await writeContract.addElectionAdmin(adminAddressInput);
      await tx.wait();
      toast.success("Election admin added");
      setAdminAddressInput("");
      await fetchCitizens();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Failed to add election admin");
    } finally { setTxPending(false); }
  };

  const handleRemoveElectionAdmin = async (address: string) => {
    if (!address) return;
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      if (!(await ensureOwner(browserProvider))) { toast.error("Owner only action"); setTxPending(false); return; }
      const writeContract = await citizenship.write(browserProvider);
      const tx = await writeContract.removeElectionAdmin(address);
      await tx.wait();
      toast.success("Election admin removed");
      await fetchCitizens();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Failed to remove election admin");
    } finally { setTxPending(false); }
  };

  const totalCitizens = citizens.length;
  const presidentCount = citizens.filter(c => c.role === "President").length;
  const electionAdminsCount = electionAdmins.length; // Use full list including non-citizens

  return (
    <div className="p-8 space-y-8">
      <div className="animate-slide-in-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Citizenship Management
        </h1>
        <p className="text-muted-foreground mt-2">Register citizens, manage election linkage & admins</p>
      </div>

      {error && <div className="text-sm text-red-500 animate-fade-in">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading on-chain data...</div>}

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in stagger-1">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary animate-float" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {totalCitizens}
                </CardTitle>
                <CardDescription>Total Citizens</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in stagger-2">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-accent animate-float" style={{ animationDelay: "0.5s" }} />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {presidentCount}
                </CardTitle>
                <CardDescription>President</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in stagger-3">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-success animate-float" style={{ animationDelay: "1s" }} />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {electionAdminsCount}
                </CardTitle>
                <CardDescription>Election Admins</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="glass hover-lift group overflow-hidden relative animate-scale-in stagger-4">
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

      {/* Set Election Contract (Owner only) */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning via-primary to-warning bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Link Election Contract
          </CardTitle>
          <CardDescription>Set the deployed Election contract address (owner only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="electionContract">Election Contract Address</Label>
            <Input
              id="electionContract"
              placeholder="0x..."
              value={electionContractInput}
              onChange={(e) => setElectionContractInput(e.target.value)}
              disabled={txPending}
              className="hover-lift"
            />
          </div>
          <Button onClick={handleSetElectionContract} disabled={txPending} className="w-full md:w-auto bg-gradient-primary hover-glow hover-scale">
            {txPending ? "Processing..." : "Set Election Contract"}
          </Button>
        </CardContent>
      </Card>

      {/* Register Citizen */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register New Citizen
          </CardTitle>
          <CardDescription>Add a new citizen (owner only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 animate-fade-in stagger-1">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="hover-lift"
                disabled={txPending}
              />
            </div>
            <div className="space-y-2 animate-fade-in stagger-2">
              <Label htmlFor="id">Citizen ID</Label>
              <Input
                id="id"
                placeholder="CIT-XXX"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="hover-lift"
                disabled={txPending}
              />
            </div>
            <div className="space-y-2 animate-fade-in stagger-3">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="18"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="hover-lift"
                disabled={txPending}
              />
            </div>
          </div>
          <Button onClick={handleRegister} disabled={txPending} className="w-full md:w-auto bg-gradient-primary hover-glow hover-scale">
            <UserPlus className="h-4 w-4 mr-2" />
            {txPending ? "Processing..." : "Register Citizen"}
          </Button>
        </CardContent>
      </Card>

      {/* Election Admin Management */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-success bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-success" />
            Manage Election Admins
          </CardTitle>
          <CardDescription>Add or remove election admins (owner only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="adminAddress">Admin Address</Label>
              <Input
                id="adminAddress"
                placeholder="0x..."
                value={adminAddressInput}
                onChange={(e) => setAdminAddressInput(e.target.value)}
                disabled={txPending}
                className="hover-lift"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddElectionAdmin} disabled={txPending} className="bg-gradient-success hover-glow hover-scale w-full md:w-auto">
                {txPending ? "Processing..." : "Add Admin"}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {electionAdmins.map((addr, i) => (
                <TableRow key={addr} className="hover:bg-accent/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <TableCell className="font-mono truncate max-w-[220px]" title={addr}>{addr}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveElectionAdmin(addr)}
                      disabled={txPending}
                      className="hover-glow hover-scale"
                    >
                      <UserMinus className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && electionAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">No election admins found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Registered Citizens */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-success bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Registered Citizens</CardTitle>
          <CardDescription>All citizens (live)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Citizen ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citizens.map((citizen, index) => (
                <TableRow
                  key={citizen.address}
                  className="hover:bg-accent/5 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell className="font-mono truncate max-w-[160px]" title={citizen.address}>{citizen.address}</TableCell>
                  <TableCell className="font-semibold">{citizen.id || "-"}</TableCell>
                  <TableCell>{citizen.age || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={citizen.role === "President" ? "default" : citizen.role === "Election Admin" ? "secondary" : "outline"}
                      className="hover-scale"
                    >
                      {citizen.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && citizens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No citizens found on-chain.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
