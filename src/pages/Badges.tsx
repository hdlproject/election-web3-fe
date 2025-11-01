import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
// Integrate chain-sdk (ensure it's linked/installed)
import { setAddresses, getReadProvider, getBrowserProvider, badge } from "chain-sdk";
import contractAddresses from "chain-sdk/contract_addresses.json";
// Static resolution of badge contract address with env fallback
const BADGE_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Badge || import.meta.env.VITE_BADGE_ADDRESS;
if (BADGE_ADDRESS) {
  setAddresses({ Badge: BADGE_ADDRESS });
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

export default function Badges() {
  // Form state for appointing a minister (role removed)
  const [formData, setFormData] = useState({ address: "", tokenURI: "" });
  // On-chain ministers state (role & appointedDate removed)
  const [ministers, setMinisters] = useState<{
    address: string;
    tokenId: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
  if (!import.meta.env.VITE_RPC_URL) {
    console.warn("[Badges] VITE_RPC_URL not defined; using fallback http://127.0.0.1:8545");
  }

  const refreshMinisters = useCallback(async () => {
    if (!BADGE_ADDRESS) {
      setError("Badge contract address not configured.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const provider = getReadProvider(rpcUrl);
      const code = await provider.getCode(BADGE_ADDRESS);
      if (code === "0x") {
        setError("No contract code at configured Badge address. Verify deployment & network.");
        setLoading(false);
        return;
      }
      const readBadge = badge.read(provider);
      const addrs: string[] = await readBadge.getMinisters();
      const tokenIds = await Promise.all(addrs.map(async (a) => {
        try {
          const id = await readBadge.getMinisterBadgeId(a);
          return id?.toString?.() ?? "0";
        } catch {
          return "0";
        }
      }));
      const rows = addrs.map((addr, i) => ({
        address: addr,
        tokenId: tokenIds[i]
      }));
      setMinisters(rows);
    } catch (e: unknown) {
      setError(extractError(e) || "Failed to load ministers");
    } finally {
      setLoading(false);
    }
  }, [rpcUrl]);

  useEffect(() => {
    refreshMinisters();
  }, [refreshMinisters]);

  const handleAppoint = async () => {
    if (!formData.address || !formData.tokenURI) {
      toast.error("Address and token URI are required");
      return;
    }
    if (!BADGE_ADDRESS) {
      toast.error("Badge contract address not set");
      return;
    }
    const suppliedURI = formData.tokenURI.trim();
    if (!/^ipfs:\/\/|^https?:\/\//i.test(suppliedURI)) {
      toast("Warning: Token URI does not look like ipfs:// or http(s)://; continuing", { className: "text-yellow-600" });
    }
    try {
      setTxPending(true);
      setError(null);
      const browserProvider = getBrowserProvider();
      const writeBadge = await badge.write(browserProvider);
      const tx = await writeBadge.appointMinister(formData.address, suppliedURI);
      await tx.wait();
      toast.success("Minister appointed successfully");
      setFormData({ address: "", tokenURI: "" });
      await refreshMinisters();
    } catch (e: unknown) {
      const msg = extractError(e) || "Appoint failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setTxPending(false);
    }
  };

  const handleDismiss = async (address: string) => {
    if (!BADGE_ADDRESS) {
      toast.error("Badge contract address not set");
      return;
    }
    try {
      setTxPending(true);
      setError(null);
      const browserProvider = getBrowserProvider();
      const writeBadge = await badge.write(browserProvider);
      const tx = await writeBadge.dismissMinister(address);
      await tx.wait();
      toast.success("Minister dismissed");
      await refreshMinisters();
    } catch (e: unknown) {
      const msg = extractError(e) || "Dismiss failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setTxPending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="animate-slide-in-left flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Minister Badge Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Appoint and dismiss ministers with NFT badges
          </p>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-500 animate-fade-in">{error}</div>
      )}
      {loading && (
        <div className="text-sm text-muted-foreground animate-pulse">Loading on-chain data...</div>
      )}

      {/* Stats */}
      <Card className="glass-strong hover-lift hover-glow animate-scale-in overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10 group-hover:scale-110 transition-transform">
              <Award className="h-6 w-6 text-warning animate-float" />
            </div>
            Active Ministers
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {ministers.length}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Total badges issued (on-chain)</p>
        </CardContent>
      </Card>

      {/* Appoint Form (role field removed) */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning via-primary to-warning bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Appoint New Minister
          </CardTitle>
          <CardDescription>Mint a new minister badge NFT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="tokenURI">Token URI (IPFS / URL)</Label>
              <Input
                id="tokenURI"
                placeholder="ipfs://CID or https://..."
                value={formData.tokenURI}
                onChange={(e) => setFormData({ ...formData, tokenURI: e.target.value })}
                className="hover-lift"
                disabled={txPending}
              />
            </div>
          </div>
          <Button onClick={handleAppoint} disabled={txPending} className="w-full md:w-auto bg-gradient-primary hover-glow hover-scale">
            <Award className="h-4 w-4 mr-2" />
            {txPending ? "Processing..." : "Appoint Minister"}
          </Button>
        </CardContent>
      </Card>

      {/* Ministers List */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-warning to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Current Ministers</CardTitle>
          <CardDescription>All ministers with active badges (live)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Badge ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ministers.map((minister, index) => (
                  <TableRow
                    key={minister.address + minister.tokenId}
                    className="hover:bg-accent/5 transition-all animate-fade-in group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <TableCell className="font-mono truncate max-w-[160px]" title={minister.address}>{minister.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="hover-scale bg-warning/10 border-warning text-warning">
                        #{minister.tokenId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDismiss(minister.address)}
                        className="hover-glow hover-scale"
                        disabled={txPending}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && ministers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      No ministers found on-chain.
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
