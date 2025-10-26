import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Vote, Award, Coins, TrendingUp, UserCheck } from "lucide-react";

const stats = [
  {
    title: "Total Citizens",
    value: "1,234",
    icon: Users,
    change: "+12%",
    changeType: "positive" as const,
  },
  {
    title: "Active Election",
    value: "Presidential 2024",
    icon: Vote,
    change: "67% turnout",
    changeType: "neutral" as const,
  },
  {
    title: "Ministers",
    value: "8",
    icon: Award,
    change: "2 appointed",
    changeType: "positive" as const,
  },
  {
    title: "Treasury Balance",
    value: "1.2M",
    icon: Coins,
    change: "+5.2%",
    changeType: "positive" as const,
  },
];

const recentActivity = [
  { action: "New citizen registered", user: "0x1234...5678", time: "2 minutes ago" },
  { action: "Vote cast in election", user: "0x8765...4321", time: "5 minutes ago" },
  { action: "Minister appointed", user: "0xabcd...efgh", time: "1 hour ago" },
  { action: "Treasury mint operation", user: "President", time: "2 hours ago" },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div className="animate-slide-in-left">
        <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Overview of your e-government platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className={`glass hover-lift hover-glow transition-all animate-scale-in stagger-${index + 1} overflow-hidden group relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-primary group-hover:animate-float" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className={`text-xs mt-1 font-medium ${
                  stat.changeType === "positive" ? "text-success" : "text-muted-foreground"
                }`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="glass-strong animate-slide-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-slow" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 group hover:bg-accent/5 -mx-2 px-2 py-2 rounded-lg transition-all hover-scale"
              >
                <div className="h-2 w-2 rounded-full bg-gradient-primary mt-2 group-hover:animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
        <Card className="cursor-pointer glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-primary/50 transition-all">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <UserCheck className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <CardTitle className="group-hover:text-primary transition-colors">Register Citizen</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Add new citizen to the system</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer glass hover-lift hover-glow group overflow-hidden relative border-2 border-transparent hover:border-accent/50 transition-all">
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <TrendingUp className="h-8 w-8 text-accent group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <CardTitle className="group-hover:text-accent transition-colors">View Election Results</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Check current election status</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
