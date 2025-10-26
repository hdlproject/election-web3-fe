import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Vote, ArrowRight } from "lucide-react";

export default function Elections() {
  const [elections] = useState([
    { id: 1, title: "Presidential Election 2024", candidates: 5, votes: 1234, status: "Active", endDate: "2024-04-15" },
    { id: 2, title: "Finance Minister Vote", candidates: 3, votes: 892, status: "Active", endDate: "2024-04-20" },
    { id: 3, title: "Policy Referendum", candidates: 2, votes: 567, status: "Completed", endDate: "2024-03-30" },
  ]);

  return (
    <div className="relative">
      {/* Hero Slide */}
      <section className="slide-section bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="slide-content animate-fade-in">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 mb-8 animate-bounce-in">
              <Vote className="h-4 w-4" />
              <span className="text-sm font-medium">Transparent Blockchain Voting</span>
            </div>
            <h1 className="hero-title text-6xl mb-6 animate-slide-up">
              Elections
            </h1>
            <p className="hero-subtitle text-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Democratic decision-making powered by smart contracts
            </p>
          </div>
        </div>
      </section>

      {/* Create Election Slide */}
      <section className="slide-section bg-gradient-to-br from-background via-purple-500/5 to-background">
        <div className="slide-content">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
              Create New Election
            </h2>
            <Card className="glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden animate-scale-in p-8">
              <CardContent className="space-y-6 p-0">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-xl">Election Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Minister of Finance Election" 
                    className="glass h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="duration" className="text-xl">Duration (days)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    placeholder="7" 
                    className="glass h-14 text-lg"
                  />
                </div>
                <Button className="w-full hover-scale bg-gradient-primary h-14 text-lg mt-8">
                  Create Election
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Active Elections Slide */}
      <section className="slide-section bg-gradient-to-br from-pink-500/10 via-background to-purple-500/10">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
            Active Elections
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {elections.map((election, index) => (
              <Card 
                key={election.id}
                className="hover-lift glass-strong border-0 shadow-smooth hover:shadow-glow overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-3xl">{election.title}</CardTitle>
                    <Badge 
                      className={`text-base px-4 py-2 ${
                        election.status === "Active" 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse-slow" 
                          : "bg-secondary"
                      }`}
                    >
                      {election.status}
                    </Badge>
                  </div>
                  <div className="flex gap-8 text-lg text-muted-foreground">
                    <span>Candidates: <strong className="text-foreground">{election.candidates}</strong></span>
                    <span>Votes: <strong className="text-foreground">{election.votes}</strong></span>
                    <span>Ends: <strong className="text-foreground">{election.endDate}</strong></span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
