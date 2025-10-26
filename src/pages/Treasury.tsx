import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, TrendingDown, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const mockTransactions = [
  { type: "Mint", address: "0x1234...5678", amount: "10,000", date: "2024-03-15 10:30", hash: "0xabc...def" },
  { type: "Burn", address: "0x8765...4321", amount: "5,000", date: "2024-03-14 14:20", hash: "0x123...456" },
  { type: "Mint", address: "0xabcd...efgh", amount: "25,000", date: "2024-03-13 09:15", hash: "0x789...abc" },
];

export default function Treasury() {
  const [mintData, setMintData] = useState({ address: "", amount: "" });
  const [burnData, setBurnData] = useState({ address: "", amount: "" });

  const handleMint = () => {
    toast.success("Tokens minted successfully");
    setMintData({ address: "", amount: "" });
  };

  const handleBurn = () => {
    toast.success("Tokens burned successfully");
    setBurnData({ address: "", amount: "" });
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between animate-slide-in-left">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-success via-primary to-warning bg-clip-text text-transparent">
            Treasury Management
          </h1>
          <p className="text-muted-foreground mt-2">Manage national currency (ERC20)</p>
        </div>
        <div className="flex gap-3 animate-scale-in">
          <Button variant="outline" className="gap-2 hover-lift hover-glow">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
          <Button variant="outline" className="gap-2 hover-lift hover-glow">
            <Play className="h-4 w-4" />
            Unpause
          </Button>
        </div>
      </div>

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
              1,234,567
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
              10,000,000
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
            <div className="text-3xl font-bold text-success animate-pulse-slow">Active</div>
            <p className="text-sm text-muted-foreground mt-2">Contract is operational</p>
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
              />
            </div>
            <Button onClick={handleMint} className="w-full bg-gradient-success hover-glow hover-scale">
              <TrendingUp className="h-4 w-4 mr-2" />
              Mint Tokens
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
              />
            </div>
            <Button onClick={handleBurn} variant="destructive" className="w-full hover-glow hover-scale">
              <TrendingDown className="h-4 w-4 mr-2" />
              Burn Tokens
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-destructive bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest mint and burn operations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Transaction Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((tx, index) => (
                <TableRow 
                  key={index}
                  className="hover:bg-accent/5 transition-all animate-fade-in group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell>
                    <Badge 
                      variant={tx.type === "Mint" ? "default" : "destructive"}
                      className={`font-semibold hover-scale ${
                        tx.type === "Mint" ? "bg-gradient-success" : "bg-gradient-danger"
                      }`}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{tx.address}</TableCell>
                  <TableCell className="font-bold text-lg">{tx.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                  <TableCell className="font-mono text-muted-foreground group-hover:text-primary transition-colors">
                    {tx.hash}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
