import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Treasury Management</h1>
          <p className="text-muted-foreground mt-1">Manage national currency (ERC20)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
          <Button variant="outline" className="gap-2">
            <Play className="h-4 w-4" />
            Unpause
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Total Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,234,567</div>
            <p className="text-sm text-muted-foreground mt-1">National Currency Tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Supply Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10,000,000</div>
            <p className="text-sm text-muted-foreground mt-1">Maximum allowed supply</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-warning" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Active</div>
            <p className="text-sm text-muted-foreground mt-1">Contract is operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Mint & Burn Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Mint Tokens
            </CardTitle>
            <CardDescription>Create new tokens (President only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mint-address">Recipient Address</Label>
              <Input
                id="mint-address"
                placeholder="0x..."
                value={mintData.address}
                onChange={(e) => setMintData({ ...mintData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mint-amount">Amount</Label>
              <Input
                id="mint-amount"
                type="number"
                placeholder="1000"
                value={mintData.amount}
                onChange={(e) => setMintData({ ...mintData, amount: e.target.value })}
              />
            </div>
            <Button onClick={handleMint} className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Mint Tokens
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Burn Tokens
            </CardTitle>
            <CardDescription>Destroy tokens (President only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="burn-address">Account Address</Label>
              <Input
                id="burn-address"
                placeholder="0x..."
                value={burnData.address}
                onChange={(e) => setBurnData({ ...burnData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="burn-amount">Amount</Label>
              <Input
                id="burn-amount"
                type="number"
                placeholder="1000"
                value={burnData.amount}
                onChange={(e) => setBurnData({ ...burnData, amount: e.target.value })}
              />
            </div>
            <Button onClick={handleBurn} variant="destructive" className="w-full">
              <TrendingDown className="h-4 w-4 mr-2" />
              Burn Tokens
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
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
                <TableRow key={index}>
                  <TableCell>
                    <span className={`font-medium ${tx.type === "Mint" ? "text-success" : "text-destructive"}`}>
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{tx.address}</TableCell>
                  <TableCell className="font-bold">{tx.amount}</TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{tx.hash}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
