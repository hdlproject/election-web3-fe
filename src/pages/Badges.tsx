import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const mockMinisters = [
  { address: "0x1234...5678", tokenId: "1", role: "Minister of Finance", appointedDate: "2024-01-15" },
  { address: "0x8765...4321", tokenId: "2", role: "Minister of Education", appointedDate: "2024-01-20" },
  { address: "0xabcd...efgh", tokenId: "3", role: "Minister of Health", appointedDate: "2024-02-01" },
];

export default function Badges() {
  const [formData, setFormData] = useState({ address: "", role: "" });

  const handleAppoint = () => {
    toast.success("Minister appointed successfully");
    setFormData({ address: "", role: "" });
  };

  const handleDismiss = (address: string) => {
    toast.success("Minister dismissed");
  };

  return (
    <div className="p-8 space-y-8">
      <div className="animate-slide-in-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Minister Badge Management
        </h1>
        <p className="text-muted-foreground mt-2">Appoint and dismiss ministers with NFT badges</p>
      </div>

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
            {mockMinisters.length}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Total badges issued</p>
        </CardContent>
      </Card>

      {/* Appoint Form */}
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
              />
            </div>
            <div className="space-y-2 animate-fade-in stagger-2">
              <Label htmlFor="role">Minister Role</Label>
              <Input
                id="role"
                placeholder="Minister of..."
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="hover-lift"
              />
            </div>
          </div>
          <Button onClick={handleAppoint} className="w-full md:w-auto bg-gradient-primary hover-glow hover-scale">
            <Award className="h-4 w-4 mr-2" />
            Appoint Minister
          </Button>
        </CardContent>
      </Card>

      {/* Ministers List */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-warning to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Current Ministers</CardTitle>
          <CardDescription>All ministers with active badges</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Badge ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Appointed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMinisters.map((minister, index) => (
                <TableRow 
                  key={minister.tokenId}
                  className="hover:bg-accent/5 transition-all animate-fade-in group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell className="font-mono">{minister.address}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="hover-scale bg-warning/10 border-warning text-warning">
                      #{minister.tokenId}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{minister.role}</TableCell>
                  <TableCell className="text-muted-foreground">{minister.appointedDate}</TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDismiss(minister.address)}
                      className="hover-glow hover-scale"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
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
