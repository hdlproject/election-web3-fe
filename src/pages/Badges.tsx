import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, ArrowRight } from "lucide-react";

export default function Badges() {
  const [ministers] = useState([
    { id: 1, position: "Minister of Finance", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", gradient: "from-blue-500 to-cyan-500" },
    { id: 2, position: "Minister of Education", address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", gradient: "from-purple-500 to-pink-500" },
    { id: 3, position: "Minister of Health", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", gradient: "from-green-500 to-emerald-500" },
  ]);

  return (
    <div className="relative">
      {/* Hero Slide */}
      <section className="slide-section bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10">
        <div className="slide-content animate-fade-in">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 mb-8 animate-bounce-in">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">NFT-Powered Credentials</span>
            </div>
            <h1 className="hero-title text-6xl mb-6 animate-slide-up">
              Minister Badges
            </h1>
            <p className="hero-subtitle text-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Digital credentials secured on the blockchain
            </p>
          </div>
        </div>
      </section>

      {/* Issue Badge Slide */}
      <section className="slide-section bg-gradient-to-br from-background via-amber-500/5 to-background">
        <div className="slide-content">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
              Issue New Badge
            </h2>
            <Card className="glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden animate-scale-in p-8">
              <CardContent className="space-y-6 p-0">
                <div className="space-y-3">
                  <Label htmlFor="minister" className="text-xl">Minister Address</Label>
                  <Input 
                    id="minister" 
                    placeholder="0x..." 
                    className="glass h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="position" className="text-xl">Position</Label>
                  <Select defaultValue="finance">
                    <SelectTrigger className="glass h-14 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">Minister of Finance</SelectItem>
                      <SelectItem value="justice">Minister of Justice</SelectItem>
                      <SelectItem value="education">Minister of Education</SelectItem>
                      <SelectItem value="health">Minister of Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full hover-scale bg-gradient-primary h-14 text-lg mt-8">
                  Issue Badge
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Current Ministers Slide */}
      <section className="slide-section bg-gradient-to-br from-orange-500/10 via-background to-amber-500/10">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
            Current Ministers
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {ministers.map((minister, index) => (
              <Card 
                key={minister.id}
                className="hover-lift glass-strong border-0 shadow-smooth hover:shadow-glow overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${minister.gradient} animate-float`}>
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl mb-2">{minister.position}</CardTitle>
                        <p className="text-lg font-mono text-muted-foreground">
                          {minister.address}
                        </p>
                      </div>
                    </div>
                    <Badge className="text-base px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500">
                      Active
                    </Badge>
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
