import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Users } from "lucide-react";
import { toast } from "sonner";

const mockCitizens = [
  { address: "0x1234...5678", id: "CIT-001", age: 35, role: "President" },
  { address: "0x8765...4321", id: "CIT-002", age: 28, role: "Election Admin" },
  { address: "0xabcd...efgh", id: "CIT-003", age: 42, role: "Citizen" },
  { address: "0xijkl...mnop", id: "CIT-004", age: 31, role: "Citizen" },
];

export default function Citizenship() {
  const [formData, setFormData] = useState({ address: "", id: "", age: "" });

  const handleRegister = () => {
    toast.success("Citizen registered successfully");
    setFormData({ address: "", id: "", age: "" });
  };

  return (
    <div className="p-8 space-y-8">
      <div className="animate-slide-in-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Citizenship Management
        </h1>
        <p className="text-muted-foreground mt-2">Register and manage citizens</p>
      </div>

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
                  1,234
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
                  1
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
                  3
                </CardTitle>
                <CardDescription>Election Admins</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Register Form */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register New Citizen
          </CardTitle>
          <CardDescription>Add a new citizen to the blockchain</CardDescription>
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
              />
            </div>
          </div>
          <Button onClick={handleRegister} className="w-full md:w-auto bg-gradient-primary hover-glow hover-scale">
            <UserPlus className="h-4 w-4 mr-2" />
            Register Citizen
          </Button>
        </CardContent>
      </Card>

      {/* Citizens List */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-success bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle>Registered Citizens</CardTitle>
          <CardDescription>All citizens in the system</CardDescription>
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
              {mockCitizens.map((citizen, index) => (
                <TableRow 
                  key={citizen.address} 
                  className={`hover:bg-accent/5 transition-colors animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell className="font-mono">{citizen.address}</TableCell>
                  <TableCell className="font-semibold">{citizen.id}</TableCell>
                  <TableCell>{citizen.age}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={citizen.role === "President" ? "default" : "secondary"}
                      className="hover-scale"
                    >
                      {citizen.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="hover-lift hover-glow">
                      Manage Roles
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
