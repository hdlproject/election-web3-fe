import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play, Square, UserPlus, Vote } from "lucide-react";
import { toast } from "sonner";

const mockElectees = [
  { address: "0x1234...5678", id: "CIT-001", age: 35, votes: 234 },
  { address: "0x8765...4321", id: "CIT-002", age: 42, votes: 189 },
  { address: "0xabcd...efgh", id: "CIT-003", age: 38, votes: 156 },
];

export default function Elections() {
  const handleStart = () => toast.success("Election started");
  const handleFinish = () => toast.success("Election finished");

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Election Management</h1>
          <p className="text-muted-foreground mt-1">Manage elections and voting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleStart} className="gap-2">
            <Play className="h-4 w-4" />
            Start Election
          </Button>
          <Button onClick={handleFinish} variant="destructive" className="gap-2">
            <Square className="h-4 w-4" />
            Finish Election
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Election Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="mt-2">Active</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-2xl font-bold mt-1">3</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Votes</p>
              <p className="text-2xl font-bold mt-1">579</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leading Candidate</p>
              <p className="text-lg font-semibold mt-1">0x1234...5678</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Register Candidate
            </CardTitle>
            <CardDescription>Add a new candidate to the election</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Register as Electee</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Register Voter
            </CardTitle>
            <CardDescription>Add a new voter to the election</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Register as Elector</Button>
          </CardContent>
        </Card>
      </div>

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle>Election Candidates</CardTitle>
          <CardDescription>All registered candidates and their vote counts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Citizen ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockElectees.map((electee, index) => {
                const totalVotes = mockElectees.reduce((sum, e) => sum + e.votes, 0);
                const percentage = ((electee.votes / totalVotes) * 100).toFixed(1);
                
                return (
                  <TableRow key={electee.address}>
                    <TableCell className="font-mono">{electee.address}</TableCell>
                    <TableCell>{electee.id}</TableCell>
                    <TableCell>{electee.age}</TableCell>
                    <TableCell className="font-bold">{electee.votes}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12">{percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
