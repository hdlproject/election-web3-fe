import { useState, useEffect, useCallback } from "react";
import { setAddresses, getReadProvider, getBrowserProvider, citizenship } from "chain-sdk";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import contractAddresses from "chain-sdk/contract_addresses.json";

// Static resolution of contract address (fallback to env)
const CITIZENSHIP_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Citizenship || import.meta.env.VITE_CITIZENSHIP_ADDRESS;
if (CITIZENSHIP_ADDRESS) {
  setAddresses({ Citizenship: CITIZENSHIP_ADDRESS });
}

export default function Citizenship() {
  const [formData, setFormData] = useState({ address: "", id: "", age: "" });
  const [citizens, setCitizens] = useState<{
    address: string;
    id: string;
    age: number;
    role: string;
  }[]>([]);
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
      const president: string = await contract.getPresident();
      const electionAdminRole = await contract.ELECTION_ADMIN();
      // owner (for register permission checks)
      try { const owner = await contract.owner(); setOwnerAddress(owner); } catch {}
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
            } catch {}
          }
          return { address: addr, id, age: Number(age), role };
        } catch {
          return { address: addr, id: "", age: 0, role: "Citizen" };
        }
      }));
      setCitizens(details);
    } catch (e: any) {
      setError(e?.message || "Failed to load citizens");
    } finally {
      setLoading(false);
    }
  }, [rpcUrl]);

  useEffect(() => { fetchCitizens(); }, [fetchCitizens]);

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
      // Check owner permission
      const signer = await browserProvider.getSigner();
      const signerAddr = (await signer.getAddress()).toLowerCase();
      if (ownerAddress && signerAddr !== ownerAddress.toLowerCase()) {
        toast.error("Only contract owner can register citizens");
        setTxPending(false);
        return;
      }
      const tx = await writeContract.registerCitizen(formData.address, formData.id, ageNum);
      await tx.wait();
      toast.success("Citizen registered successfully");
      setFormData({ address: "", id: "", age: "" });
      await fetchCitizens();
    } catch (e: any) {
      const msg = e?.reason || e?.message || "Registration failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setTxPending(false);
    }
  };

  const totalCitizens = citizens.length;
  const presidentCount = citizens.filter(c => c.role === "President").length;
  const electionAdminsCount = citizens.filter(c => c.role === "Election Admin").length;

  return (
    <div className="p-8 space-y-8">
      <div className="animate-slide-in-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Citizenship Management
        </h1>
        <p className="text-muted-foreground mt-2">Register and manage citizens</p>
      </div>

      {error && <div className="text-sm text-red-500 animate-fade-in">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading on-chain citizens...</div>}

      <div className="grid gap-6 lg:grid-cols-3">
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
                <CardDescription>Total Citizens (on-chain)</CardDescription>
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
      </div>

      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register New Citizen
          </CardTitle>
          <CardDescription>Add a new citizen to the blockchain (owner only)</CardDescription>
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
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    <Button variant="outline" size="sm" className="hover-lift hover-glow" disabled>
                      Manage Roles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && citizens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
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
