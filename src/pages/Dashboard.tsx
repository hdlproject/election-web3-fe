import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Vote, Award, Coins, ArrowRight, Sparkles } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { 
      title: "Total Citizens", 
      value: "1,234", 
      icon: Users,
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      title: "Active Elections", 
      value: "3", 
      icon: Vote,
      gradient: "from-purple-500 to-pink-500"
    },
    { 
      title: "Minister Badges", 
      value: "8", 
      icon: Award,
      gradient: "from-amber-500 to-orange-500"
    },
    { 
      title: "Treasury Balance", 
      value: "1.2M", 
      icon: Coins,
      gradient: "from-green-500 to-emerald-500"
    },
  ];

  return (
    <div className="relative">
      {/* Hero Slide */}
      <section className="slide-section bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="slide-content text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-bounce-in">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Web3 Powered Government</span>
          </div>
          <h1 className="hero-title animate-slide-up">
            e-Government
          </h1>
          <p className="hero-subtitle animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Building the Future of Digital Governance
          </p>
          <Button 
            size="lg" 
            className="mt-8 hover-scale animate-fade-in text-lg px-8 py-6 bg-gradient-primary"
            style={{ animationDelay: '0.4s' }}
          >
            Explore Platform
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Stats Slide */}
      <section className="slide-section bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
            Platform at a Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title}
                  className="hover-lift glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden group animate-scale-in text-center"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-20 transition-opacity duration-500`} />
                  <CardHeader className="pb-4">
                    <div className={`mx-auto p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 animate-float`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-5xl font-bold mb-2">{stat.value}</CardTitle>
                    <p className="text-muted-foreground text-lg">{stat.title}</p>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Slide */}
      <section className="slide-section bg-gradient-to-br from-accent/5 via-background to-primary/5">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-8 animate-fade-in">
            Seamless Operations
          </h2>
          <p className="text-2xl text-center text-muted-foreground mb-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Everything you need to manage your digital nation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { title: "Citizen Management", desc: "Register and manage digital identities", gradient: "from-blue-500 to-cyan-500" },
              { title: "Democratic Elections", desc: "Transparent voting on the blockchain", gradient: "from-purple-500 to-pink-500" },
              { title: "NFT Credentials", desc: "Issue minister badges as NFTs", gradient: "from-amber-500 to-orange-500" },
              { title: "Treasury Control", desc: "Mint and manage national currency", gradient: "from-green-500 to-emerald-500" },
            ].map((feature, index) => (
              <Card 
                key={feature.title}
                className="hover-lift glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden group animate-fade-in p-8"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-500`} />
                <h3 className="text-2xl font-bold mb-3 relative z-10">{feature.title}</h3>
                <p className="text-muted-foreground text-lg relative z-10">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
