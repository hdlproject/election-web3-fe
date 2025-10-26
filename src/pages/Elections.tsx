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
      <div className="flex items-center justify-between animate-slide-in-left">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Election Management
          </h1>
          <p className="text-muted-foreground mt-2">Manage elections and voting</p>
        </div>
        <div className="flex gap-3 animate-scale-in">
          <Button onClick={handleStart} className="gap-2 bg-gradient-success hover-glow hover-scale shadow-strong">
            <Play className="h-4 w-4" />
            Start Election
          </Button>
          <Button onClick={handleFinish} variant="destructive" className="gap-2 hover-glow hover-scale shadow-strong">
            <Square className="h-4 w-4" />
            Finish Election
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary animate-float" />
            Current Election Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="animate-fade-in stagger-1">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Badge className="bg-gradient-success animate-pulse-slow shadow-glow">Active</Badge>
            </div>
            <div className="animate-fade-in stagger-2">
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-3xl font-bold mt-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                3
              </p>
            </div>
            <div className="animate-fade-in stagger-3">
              <p className="text-sm text-muted-foreground">Total Votes</p>
              <p className="text-3xl font-bold mt-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                579
              </p>
            </div>
            <div className="animate-fade-in stagger-4">
              <p className="text-sm text-muted-foreground">Leading Candidate</p>
              <p className="text-lg font-semibold mt-1 font-mono text-primary">0x1234...5678</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-primary/50 transition-all">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              Register Candidate
            </CardTitle>
            <CardDescription>Add a new candidate to the election</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Button className="w-full bg-gradient-primary hover-glow hover-scale">Register as Electee</Button>
          </CardContent>
        </Card>

        <Card className="glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-accent/50 transition-all">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:scale-110 transition-transform">
                <Vote className="h-5 w-5 text-accent" />
              </div>
              Register Voter
            </CardTitle>
            <CardDescription>Add a new voter to the election</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Button className="w-full bg-gradient-success hover-glow hover-scale">Register as Elector</Button>
          </CardContent>
        </Card>
      </div>

      {/* Candidates List */}
      <Card className="glass-strong animate-fade-in overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-accent bg-[length:200%_100%] animate-gradient-shift" />
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
                const isLeading = index === 0;
                
                return (
                  <TableRow 
                    key={electee.address}
                    className={`hover:bg-accent/5 transition-all animate-fade-in ${isLeading ? 'bg-primary/5' : ''}`}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <TableCell className="font-mono">{electee.address}</TableCell>
                    <TableCell className="font-semibold">{electee.id}</TableCell>
                    <TableCell>{electee.age}</TableCell>
                    <TableCell className="font-bold text-lg">{electee.votes}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full bg-gradient-primary rounded-full transition-all duration-1000 ease-out ${
                              isLeading ? 'animate-pulse-slow shadow-glow' : ''
                            }`}
                            style={{ 
                              width: `${percentage}%`,
                              animationDelay: `${index * 0.2}s`
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold w-14 text-right">{percentage}%</span>
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
