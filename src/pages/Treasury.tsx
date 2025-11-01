import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, TrendingDown, Pause, Play, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useState, useRef } from "react";
import { setAddresses, getReadProvider, getBrowserProvider, money, citizenship } from "chain-sdk";
import contractAddresses from "chain-sdk/contract_addresses.json";
import { parseUnits, formatUnits, isAddress } from "ethers";
import { formatDistanceToNow } from 'date-fns';
import type { EventLog, Log } from "ethers";

// Resolve contract addresses (fallback to env if missing)
const MONEY_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Money || import.meta.env.VITE_MONEY_ADDRESS;
const CITIZENSHIP_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Citizenship || import.meta.env.VITE_CITIZENSHIP_ADDRESS;
if (MONEY_ADDRESS) setAddresses({ Money: MONEY_ADDRESS });
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

interface TxRow {
  type: "Mint" | "Burn";
  address: string;
  amountRaw: bigint;
  amountFormatted: string;
  date: string;
  hash: string;
  president: string;
}

export default function Treasury() {
  const [mintData, setMintData] = useState({ address: "", amount: "" });
  const [burnData, setBurnData] = useState({ address: "", amount: "" });
  const [decimals, setDecimals] = useState<number>(18);
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [cap, setCap] = useState<string>("0");
  const [paused, setPaused] = useState<boolean>(false);
  const [presidentAddress, setPresidentAddress] = useState<string>("");
  const [signerAddress, setSignerAddress] = useState<string>("");
  const [isPresident, setIsPresident] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const firstLoadRef = useRef(true); // track initial load

  const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
  if (!import.meta.env.VITE_RPC_URL) {
    console.warn("[Treasury] VITE_RPC_URL not defined; fallback to http://127.0.0.1:8545");
  }

  const refreshData = useCallback(async (opts?: { showToast?: boolean }) => {
    if (!MONEY_ADDRESS) { setError("Money contract address not configured."); return; }
    const first = firstLoadRef.current;
    setRefreshing(true);
    if (first) setLoading(true);
    try {
      setError(null);
      const provider = getReadProvider(rpcUrl);
      const readMoney = money.read(provider);
      // Base values
      try {
        const [supplyBN, capBN, pausedFlag, decs] = await Promise.all([
          readMoney.totalSupply(),
          readMoney.cap(),
          readMoney.paused(),
          readMoney.decimals().catch(() => 18)
        ]);
        const decNum = Number(decs);
        setDecimals(decNum);
        setTotalSupply(formatUnits(supplyBN, decNum));
        setCap(formatUnits(capBN, decNum));
        setPaused(Boolean(pausedFlag));
      } catch (e) { console.warn("Failed to fetch base Money data", e); }
      // President fetch via citizenship
      if (CITIZENSHIP_ADDRESS) {
        try {
          const readCitizenship = citizenship.read(provider);
          const prez = await readCitizenship.getPresident();
          setPresidentAddress(prez);
          if (signerAddress) setIsPresident(prez.toLowerCase() === signerAddress.toLowerCase());
        } catch (e) { console.warn("Failed to fetch president", e); }
      }
      // Events (recent mint & burn)
      try {
        const mintFilter = readMoney.filters.Minted();
        const burnFilter = readMoney.filters.Burned();
        const [mintLogs, burnLogs] = await Promise.all([
          readMoney.queryFilter(mintFilter, 0, "latest"),
          readMoney.queryFilter(burnFilter, 0, "latest")
        ]);
        const allLogs = [...mintLogs.map(l => ({ l, type: "Mint" as const })), ...burnLogs.map(l => ({ l, type: "Burn" as const }))];
        allLogs.sort((a, b) => (b.l.blockNumber - a.l.blockNumber) || (b.l.index - a.l.index));
        const sliced = allLogs.slice(0, 25);
        const provider2 = getReadProvider(rpcUrl);
        const rows: TxRow[] = [];
        const getArgs = (ev: EventLog | Log): readonly unknown[] => ('args' in ev ? (ev as EventLog).args : []);
        for (const entry of sliced) {
          const ev = entry.l; let tsDate = "";
          try { const blk = await provider2.getBlock(ev.blockNumber); tsDate = new Date(blk.timestamp * 1000).toISOString().replace("T", " ").slice(0, 16); } catch (err) { /* block timestamp fetch failed */ }
          const args = getArgs(ev);
          const targetAddr = (args?.[0] as string) || "";
          const amount = (args?.[1] as bigint) ?? 0n;
          const president = (args?.[2] as string) || "";
          rows.push({ type: entry.type, address: targetAddr, amountRaw: amount, amountFormatted: formatUnits(amount, decimals), date: tsDate, hash: ev.transactionHash, president });
        }
        setTransactions(rows);
      } catch (e) { console.warn("Failed to fetch events", e); }
      setLastUpdated(Date.now());
      if (opts?.showToast) toast.success('Treasury data refreshed');
    } catch (e: unknown) {
      setError(extractError(e) || "Failed to refresh treasury data");
    } finally {
      setRefreshing(false);
      if (first) { setLoading(false); firstLoadRef.current = false; }
    }
  }, [rpcUrl, signerAddress, decimals]);

  // Capture signer
  useEffect(() => {
    (async () => {
      try {
        const browserProvider = getBrowserProvider();
        const signer = await browserProvider.getSigner();
        const addr = await signer.getAddress();
        setSignerAddress(addr);
      } catch {
        setSignerAddress("");
      }
    })();
  }, []);

  // Recompute president gating when signer or president changes
  useEffect(() => {
    if (presidentAddress && signerAddress) {
      setIsPresident(presidentAddress.toLowerCase() === signerAddress.toLowerCase());
    }
  }, [presidentAddress, signerAddress]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const validateAmount = (val: string): bigint | null => {
    if (!val) return null;
    try {
      const bn = parseUnits(val, decimals);
      if (bn <= 0n) return null;
      return bn;
    } catch { return null; }
  };

  const handleMint = async () => {
    if (!isPresident) { toast.error("Only president can mint"); return; }
    if (!mintData.address || !mintData.amount) { toast.error("Address & amount required"); return; }
    if (!isAddress(mintData.address)) { toast.error("Invalid recipient address"); return; }
    const amt = validateAmount(mintData.amount);
    if (!amt) { toast.error("Invalid amount"); return; }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeMoney = await money.write(browserProvider);
      const tx = await writeMoney.mint(mintData.address, amt);
      await tx.wait();
      toast.success("Tokens minted");
      setMintData({ address: "", amount: "" });
      await refreshData();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Mint failed");
    } finally { setTxPending(false); }
  };

  const handleBurn = async () => {
    if (!isPresident) { toast.error("Only president can burn"); return; }
    if (!burnData.address || !burnData.amount) { toast.error("Address & amount required"); return; }
    if (!isAddress(burnData.address)) { toast.error("Invalid account address"); return; }
    const amt = validateAmount(burnData.amount);
    if (!amt) { toast.error("Invalid amount"); return; }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeMoney = await money.write(browserProvider);
      const tx = await writeMoney.burn(burnData.address, amt);
      await tx.wait();
      toast.success("Tokens burned");
      setBurnData({ address: "", amount: "" });
      await refreshData();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Burn failed");
    } finally { setTxPending(false); }
  };

  const handlePause = async () => {
    if (!isPresident) { toast.error("Only president can pause"); return; }
    if (paused) { toast("Already paused"); return; }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeMoney = await money.write(browserProvider);
      const tx = await writeMoney.pause();
      await tx.wait();
      toast.success("Contract paused");
      await refreshData();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Pause failed");
    } finally { setTxPending(false); }
  };

  const handleUnpause = async () => {
    if (!isPresident) { toast.error("Only president can unpause"); return; }
    if (!paused) { toast("Already active"); return; }
    try {
      setTxPending(true);
      const browserProvider = getBrowserProvider();
      const writeMoney = await money.write(browserProvider);
      const tx = await writeMoney.unpause();
      await tx.wait();
      toast.success("Contract unpaused");
      await refreshData();
    } catch (e: unknown) {
      toast.error(extractError(e) || "Unpause failed");
    } finally { setTxPending(false); }
  };

  const supplyPretty = Number(totalSupply) ? Number(totalSupply).toLocaleString() : totalSupply;
  const capPretty = Number(cap) ? Number(cap).toLocaleString() : cap;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-in-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Treasury Management</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">View supply stats and administer national currency</p>
          {lastUpdated && <p className="text-xs text-muted-foreground mt-1">Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => refreshData({ showToast: true })} variant="outline" className="gap-2 hover-lift hover-glow flex-1 sm:flex-none" disabled={refreshing || txPending} aria-busy={refreshing}>
            <RefreshCcw className={"h-4 w-4 " + (refreshing ? 'animate-spin' : '')} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handlePause} variant="outline" className="gap-2 hover-lift hover-glow flex-1 sm:flex-none" disabled={txPending || paused || !isPresident}><Pause className="h-4 w-4" /> Pause</Button>
          <Button onClick={handleUnpause} variant="outline" className="gap-2 hover-lift hover-glow flex-1 sm:flex-none" disabled={txPending || !paused || !isPresident}><Play className="h-4 w-4" /> Unpause</Button>
        </div>
      </div>
      {error && <div className="text-sm text-red-500 animate-fade-in">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading treasury data...</div>}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass hover-lift hover-glow group overflow-hidden relative animate-scale-in stagger-1">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                <Coins className="h-6 w-6 text-primary animate-float" />
              </div>
              Total Supply
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {supplyPretty}
            </div>
            <p className="text-sm text-muted-foreground mt-2">National Currency Tokens</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift hover-glow group overflow-hidden relative animate-scale-in stagger-2">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-success/10 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-success animate-float" style={{ animationDelay: "0.5s" }} />
              </div>
              Supply Cap
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {capPretty}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Maximum allowed supply</p>
          </CardContent>
        </Card>

        <Card className="glass hover-lift hover-glow group overflow-hidden relative animate-scale-in stagger-3">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-success/10 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-success animate-float" style={{ animationDelay: "1s" }} />
              </div>
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={`text-3xl font-bold ${paused ? 'text-warning' : 'text-success'} ${paused ? '' : 'animate-pulse-slow'}`}>{paused ? 'Paused' : 'Active'}</div>
            <p className="text-sm text-muted-foreground mt-2">Contract is {paused ? 'paused' : 'operational'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mint & Burn Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-strong animate-slide-up overflow-hidden group hover-lift hover-glow border-2 border-transparent hover:border-success/30">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-success" />
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Mint Tokens
            </CardTitle>
            <CardDescription>Create new tokens (President only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-2 animate-fade-in stagger-1">
              <Label htmlFor="mint-address">Recipient Address</Label>
              <Input
                id="mint-address"
                placeholder="0x..."
                value={mintData.address}
                onChange={(e) => setMintData({ ...mintData, address: e.target.value })}
                className="hover-lift"
                disabled={txPending || !isPresident}
              />
            </div>
            <div className="space-y-2 animate-fade-in stagger-2">
              <Label htmlFor="mint-amount">Amount</Label>
              <Input
                id="mint-amount"
                type="number"
                placeholder="1000"
                value={mintData.amount}
                onChange={(e) => setMintData({ ...mintData, amount: e.target.value })}
                className="hover-lift"
                disabled={txPending || !isPresident}
              />
            </div>
            <Button onClick={handleMint} disabled={txPending || !isPresident} className="w-full bg-gradient-success hover-glow hover-scale">
              <TrendingUp className="h-4 w-4 mr-2" />
              {txPending ? 'Processing...' : 'Mint Tokens'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-strong animate-slide-up overflow-hidden group hover-lift hover-glow border-2 border-transparent hover:border-destructive/30" style={{ animationDelay: "0.1s" }}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-danger" />
          <div className="absolute inset-0 bg-gradient-danger opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Burn Tokens
            </CardTitle>
            <CardDescription>Destroy tokens (President only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-2 animate-fade-in stagger-1">
              <Label htmlFor="burn-address">Account Address</Label>
              <Input
                id="burn-address"
                placeholder="0x..."
                value={burnData.address}
                onChange={(e) => setBurnData({ ...burnData, address: e.target.value })}
                className="hover-lift"
                disabled={txPending || !isPresident}
              />
            </div>
            <div className="space-y-2 animate-fade-in stagger-2">
              <Label htmlFor="burn-amount">Amount</Label>
              <Input
                id="burn-amount"
                type="number"
                placeholder="1000"
                value={burnData.amount}
                onChange={(e) => setBurnData({ ...burnData, amount: e.target.value })}
                className="hover-lift"
                disabled={txPending || !isPresident}
              />
            </div>
            <Button onClick={handleBurn} variant="destructive" disabled={txPending || !isPresident} className="w-full hover-glow hover-scale">
              <TrendingDown className="h-4 w-4 mr-2" />
              {txPending ? 'Processing...' : 'Burn Tokens'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-destructive bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest on-chain mint and burn events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date (UTC)</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>President</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx, index) => (
                  <TableRow
                    key={tx.hash + index}
                    className="hover:bg-accent/5 transition-all animate-fade-in group"
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <TableCell>
                      <Badge
                        variant={tx.type === 'Mint' ? 'default' : 'destructive'}
                        className={`font-semibold hover-scale ${tx.type === 'Mint' ? 'bg-gradient-success' : 'bg-gradient-danger'}`}
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono truncate max-w-[140px]" title={tx.address}>{tx.address}</TableCell>
                    <TableCell className="font-bold text-lg">{tx.amountFormatted}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.date || '-'}</TableCell>
                    <TableCell className="font-mono text-muted-foreground group-hover:text-primary transition-colors truncate max-w-[140px]" title={tx.hash}>{tx.hash}</TableCell>
                    <TableCell className="font-mono truncate max-w-[140px]" title={tx.president}>{tx.president || '-'}</TableCell>
                  </TableRow>
                ))}
                {!loading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      No mint/burn events found.
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
