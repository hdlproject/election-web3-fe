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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minister Badge Management</h1>
        <p className="text-muted-foreground mt-1">Appoint and dismiss ministers with NFT badges</p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Active Ministers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{mockMinisters.length}</div>
          <p className="text-sm text-muted-foreground mt-1">Total badges issued</p>
        </CardContent>
      </Card>

      {/* Appoint Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Appoint New Minister
          </CardTitle>
          <CardDescription>Mint a new minister badge NFT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Minister Role</Label>
              <Input
                id="role"
                placeholder="Minister of..."
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleAppoint} className="w-full md:w-auto">
            <Award className="h-4 w-4 mr-2" />
            Appoint Minister
          </Button>
        </CardContent>
      </Card>

      {/* Ministers List */}
      <Card>
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
              {mockMinisters.map((minister) => (
                <TableRow key={minister.tokenId}>
                  <TableCell className="font-mono">{minister.address}</TableCell>
                  <TableCell>
                    <Badge variant="outline">#{minister.tokenId}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{minister.role}</TableCell>
                  <TableCell>{minister.appointedDate}</TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDismiss(minister.address)}
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
