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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your e-government platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs mt-1 ${
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Register Citizen</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Add new citizen to the system</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>View Election Results</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Check current election status</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
