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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Citizenship Management</h1>
        <p className="text-muted-foreground mt-1">Register and manage citizens</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-2xl">1,234</CardTitle>
                <CardDescription>Total Citizens</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-2xl">1</CardTitle>
                <CardDescription>President</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-2xl">3</CardTitle>
                <CardDescription>Election Admins</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Register Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Register New Citizen
          </CardTitle>
          <CardDescription>Add a new citizen to the blockchain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
              <Label htmlFor="id">Citizen ID</Label>
              <Input
                id="id"
                placeholder="CIT-XXX"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="18"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleRegister} className="w-full md:w-auto">
            Register Citizen
          </Button>
        </CardContent>
      </Card>

      {/* Citizens List */}
      <Card>
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
              {mockCitizens.map((citizen) => (
                <TableRow key={citizen.address}>
                  <TableCell className="font-mono">{citizen.address}</TableCell>
                  <TableCell>{citizen.id}</TableCell>
                  <TableCell>{citizen.age}</TableCell>
                  <TableCell>
                    <Badge variant={citizen.role === "President" ? "default" : "secondary"}>
                      {citizen.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Manage Roles</Button>
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
