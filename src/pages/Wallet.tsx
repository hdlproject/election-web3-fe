import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Send, RefreshCcw, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { setAddresses, getReadProvider, getBrowserProvider, money, citizenship } from "chain-sdk";
import contractAddresses from "chain-sdk/contract_addresses.json";
import { formatUnits, parseUnits, isAddress } from "ethers";

// Resolve contract addresses (fallback to env vars)
const MONEY_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Money || import.meta.env.VITE_MONEY_ADDRESS;
const CITIZENSHIP_ADDRESS: string | undefined = (contractAddresses as Record<string, string>).Citizenship || import.meta.env.VITE_CITIZENSHIP_ADDRESS;
if (MONEY_ADDRESS) setAddresses({ Money: MONEY_ADDRESS });
if (CITIZENSHIP_ADDRESS) setAddresses({ Citizenship: CITIZENSHIP_ADDRESS });

function extractError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") { const o = e as { message?: string; reason?: string }; return o.reason || o.message || JSON.stringify(o); }
  return "Unknown error";
}

interface TransferRow {
  direction: "IN" | "OUT";
  other: string; // counterparty address
  amount: string; // formatted
  raw: bigint;
  hash: string;
  date: string;
}

export default function WalletPage() {
  const [signerAddress, setSignerAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [decimals, setDecimals] = useState<number>(18);
  const [paused, setPaused] = useState<boolean>(false);
  const [form, setForm] = useState({ to: "", amount: "" });
  const [isCitizen, setIsCitizen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TransferRow[]>([]);

  const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
  if (!import.meta.env.VITE_RPC_URL) console.warn("[Wallet] VITE_RPC_URL not defined; using local fallback");

  const refreshBalance = useCallback(async () => {
    if (!MONEY_ADDRESS) { setError("Money contract not configured"); return; }
    if (!signerAddress) return;
    try {
      const provider = getReadProvider(rpcUrl);
      const readMoney = money.read(provider);
      const [balBN, pausedFlag, decs] = await Promise.all([
        readMoney.balanceOf(signerAddress),
        readMoney.paused().catch(() => false),
        readMoney.decimals().catch(() => 18)
      ]);
      setDecimals(Number(decs));
      setBalance(formatUnits(balBN, Number(decs)));
      setPaused(Boolean(pausedFlag));
    } catch (e: unknown) {
      setError(extractError(e) || "Failed to fetch balance");
    }
  }, [rpcUrl, signerAddress]);

  const refreshCitizenshipStatus = useCallback(async () => {
    if (!CITIZENSHIP_ADDRESS || !signerAddress) { setIsCitizen(false); return; }
    try {
      const provider = getReadProvider(rpcUrl);
      const readCitizenship = citizenship.read(provider);
      const [id] = await readCitizenship.getCitizen(signerAddress);
      setIsCitizen(Boolean(id && id.length > 0));
    } catch { setIsCitizen(false); }
  }, [rpcUrl, signerAddress]);

  const refreshHistory = useCallback(async () => {
    if (!MONEY_ADDRESS || !signerAddress) return;
    try {
      const provider = getReadProvider(rpcUrl);
      const readMoney = money.read(provider);
      const decs = await readMoney.decimals().catch(() => 18);
      setDecimals(Number(decs));
      // Query sent & received Transfer logs
      const sentLogs = await readMoney.queryFilter(readMoney.filters.Transfer(signerAddress, null), 0, "latest");
      const receivedLogs = await readMoney.queryFilter(readMoney.filters.Transfer(null, signerAddress), 0, "latest");
      const all = [...sentLogs.map(l => ({ l, dir: "OUT" as const })), ...receivedLogs.map(l => ({ l, dir: "IN" as const }))];
      // Deduplicate self-transfers (same tx hash & index)
      const map = new Map<string, { l: typeof sentLogs[number]; dir: "OUT" | "IN" }>();
      for (const entry of all) { map.set(entry.l.transactionHash + ":" + entry.l.index, entry); }
      const merged = Array.from(map.values());
      // Sort newest first
      merged.sort((a, b) => (b.l.blockNumber - a.l.blockNumber) || (b.l.index - a.l.index));
      const limited = merged.slice(0, 30);
      const rows: TransferRow[] = [];
      for (const entry of limited) {
        const ev = entry.l;
        const args: any = ev.args;
        const from: string = args?.[0] || "";
        const to: string = args?.[1] || "";
        const amount: bigint = args?.[2] || 0n;
        const other = entry.dir === "OUT" ? to : from;
        let date = "";
        try { const blk = await provider.getBlock(ev.blockNumber); date = new Date(blk.timestamp * 1000).toISOString().replace("T", " ").slice(0, 16); } catch {}
        rows.push({
          direction: entry.dir,
          other,
          amount: formatUnits(amount, Number(decs)),
          raw: amount,
          hash: ev.transactionHash,
          date
        });
      }
      setHistory(rows);
    } catch (e: unknown) {
      console.warn("Failed history refresh", e);
    }
  }, [rpcUrl, signerAddress]);

  // Initialize signer
  useEffect(() => {
    (async () => {
      try {
        const browserProvider = getBrowserProvider();
        const signer = await browserProvider.getSigner();
        const addr = await signer.getAddress();
        setSignerAddress(addr);
      } catch { setSignerAddress(""); }
    })();
  }, []);

  // Refresh data when signer changes
  useEffect(() => {
    refreshBalance();
    refreshCitizenshipStatus();
    refreshHistory();
  }, [signerAddress, refreshBalance, refreshCitizenshipStatus, refreshHistory]);

  const validateAmount = (val: string): bigint | null => {
    if (!val) return null;
    try { const bn = parseUnits(val, decimals); if (bn <= 0n) return null; return bn; } catch { return null; }
  };

  const handleTransfer = async () => {
    if (!signerAddress) { toast.error("Connect wallet first"); return; }
    if (paused) { toast.error("Contract is paused"); return; }
    if (!isCitizen) { toast.error("You must be a registered citizen to transfer"); return; }
    if (!form.to || !form.amount) { toast.error("Recipient & amount required"); return; }
    if (!isAddress(form.to)) { toast.error("Invalid recipient address"); return; }
    const amt = validateAmount(form.amount);
    if (!amt) { toast.error("Invalid amount"); return; }
    // Pre-check recipient citizenship
    try {
      if (CITIZENSHIP_ADDRESS) {
        const provider = getReadProvider(rpcUrl);
        const readCitizenship = citizenship.read(provider);
        const [id] = await readCitizenship.getCitizen(form.to);
        if (!id || id.length === 0) {
          toast.error("Recipient is not a registered citizen");
          return;
        }
      }
    } catch { toast.error("Failed to verify recipient citizenship"); return; }
    try {
      setTxPending(true);
      setError(null);
      const browserProvider = getBrowserProvider();
      const writeMoney = await money.write(browserProvider);
      const tx = await writeMoney.transfer(form.to, amt);
      await tx.wait();
      toast.success("Transfer successful");
      setForm({ to: "", amount: "" });
      await refreshBalance();
      await refreshHistory();
    } catch (e: unknown) {
      const msg = extractError(e) || "Transfer failed";
      toast.error(msg);
      setError(msg);
    } finally { setTxPending(false); }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-in-left">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Wallet
          </h1>
          <p className="text-muted-foreground mt-2">View balance and transfer Money tokens</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { refreshBalance(); refreshHistory(); }} variant="outline" disabled={loading || txPending} className="gap-2 hover-glow hover-scale">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 animate-fade-in">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading wallet data...</div>}

      {/* Balance & Status */}
      <Card className="glass-strong animate-scale-in overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary animate-float" />
            Account Overview
          </CardTitle>
          <CardDescription>Your current Money token balance & status</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-mono text-xs truncate" title={signerAddress}>{signerAddress || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{balance}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={paused ? 'destructive' : 'secondary'} className={paused ? 'hover-scale' : 'hover-scale animate-pulse-slow'}>
              {paused ? 'Paused' : isCitizen ? 'Active (Citizen)' : 'Not Citizen'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Form */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-success" />
            Transfer Tokens
          </CardTitle>
          <CardDescription>Send Money tokens to another citizen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="to">Recipient Address</Label>
              <Input
                id="to"
                placeholder="0x..."
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                disabled={txPending || paused}
                className="hover-lift"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="100"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                disabled={txPending || paused}
                className="hover-lift"
              />
            </div>
          </div>
          <Button
            onClick={handleTransfer}
            disabled={txPending || paused || !isCitizen}
            className="w-full md:w-auto bg-gradient-success hover-glow hover-scale"
          >
            <Send className="h-4 w-4 mr-2" />
            {txPending ? 'Processing...' : paused ? 'Paused' : !isCitizen ? 'Citizen Required' : 'Send Tokens'}
          </Button>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-accent bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
          <CardDescription>Latest incoming/outgoing Money movements</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date (UTC)</TableHead>
                <TableHead>Tx Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row, i) => (
                <TableRow key={row.hash + i} className="hover:bg-accent/5 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <TableCell>
                    <Badge variant={row.direction === 'IN' ? 'secondary' : 'outline'} className={`flex items-center gap-1 font-semibold ${row.direction === 'IN' ? 'text-success' : 'text-warning'}`}>
                      {row.direction === 'IN' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      {row.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono truncate max-w-[160px]" title={row.other}>{row.other}</TableCell>
                  <TableCell className="font-bold">{row.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{row.date || '-'}</TableCell>
                  <TableCell className="font-mono text-muted-foreground truncate max-w-[140px]" title={row.hash}>{row.hash}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No transfers found for this account.
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
