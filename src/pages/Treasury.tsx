import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, TrendingUp, Flame, Plus, ArrowRight } from "lucide-react";

export default function Treasury() {
  const [transactions] = useState([
    { id: 1, type: "Mint", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", amount: "10,000", time: "2 hours ago" },
    { id: 2, type: "Burn", address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", amount: "5,000", time: "5 hours ago" },
    { id: 3, type: "Mint", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", amount: "25,000", time: "1 day ago" },
  ]);

  return (
    <div className="relative">
      {/* Hero Slide */}
      <section className="slide-section bg-gradient-to-br from-green-500/10 via-background to-emerald-500/10">
        <div className="slide-content animate-fade-in">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 mb-8 animate-bounce-in">
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">Digital Currency Management</span>
            </div>
            <h1 className="hero-title text-6xl mb-6 animate-slide-up">
              Treasury
            </h1>
            <p className="hero-subtitle text-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Control your nation's digital currency supply
            </p>
          </div>
        </div>
      </section>

      {/* Stats Slide */}
      <section className="slide-section bg-gradient-to-br from-background via-green-500/5 to-background">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
            Treasury Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { label: "Total Supply", value: "1.2M", icon: Coins, gradient: "from-green-500 to-emerald-500" },
              { label: "Circulating", value: "980K", icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
              { label: "Burned", value: "45K", icon: Flame, gradient: "from-orange-500 to-red-500" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.label}
                  className="hover-lift glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden group animate-scale-in text-center"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <CardHeader className="pb-4">
                    <div className={`mx-auto p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 animate-float`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-5xl font-bold mb-2">{stat.value}</CardTitle>
                    <p className="text-muted-foreground text-lg">{stat.label}</p>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mint & Burn Slide */}
      <section className="slide-section bg-gradient-to-br from-emerald-500/10 via-background to-green-500/10">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
            Manage Supply
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Mint Tokens */}
            <Card className="glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden animate-fade-in p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  Mint Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <div className="space-y-3">
                  <Label htmlFor="mint-address" className="text-xl">Recipient Address</Label>
                  <Input 
                    id="mint-address" 
                    placeholder="0x..." 
                    className="glass h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="mint-amount" className="text-xl">Amount</Label>
                  <Input 
                    id="mint-amount" 
                    type="number" 
                    placeholder="1000" 
                    className="glass h-14 text-lg"
                  />
                </div>
                <Button className="w-full hover-scale bg-gradient-success h-14 text-lg">
                  Mint Tokens
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Burn Tokens */}
            <Card className="glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden animate-fade-in p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  Burn Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <div className="space-y-3">
                  <Label htmlFor="burn-address" className="text-xl">Holder Address</Label>
                  <Input 
                    id="burn-address" 
                    placeholder="0x..." 
                    className="glass h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="burn-amount" className="text-xl">Amount</Label>
                  <Input 
                    id="burn-amount" 
                    type="number" 
                    placeholder="500" 
                    className="glass h-14 text-lg"
                  />
                </div>
                <Button className="w-full hover-scale bg-gradient-danger h-14 text-lg">
                  Burn Tokens
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Transactions Slide */}
      <section className="slide-section bg-gradient-to-br from-background via-emerald-500/5 to-background">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
            Recent Transactions
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {transactions.map((tx, index) => (
              <Card 
                key={tx.id}
                className="hover-lift glass-strong border-0 shadow-smooth hover:shadow-glow overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${
                        tx.type === "Mint" 
                          ? "bg-gradient-to-br from-green-500 to-emerald-500" 
                          : "bg-gradient-to-br from-orange-500 to-red-500"
                      } animate-float`}>
                        {tx.type === "Mint" ? (
                          <Plus className="h-8 w-8 text-white" />
                        ) : (
                          <Flame className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-2xl mb-2">{tx.type}</CardTitle>
                        <p className="text-lg font-mono text-muted-foreground">{tx.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold mb-1">{tx.amount}</p>
                      <p className="text-sm text-muted-foreground">{tx.time}</p>
                    </div>
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
