import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, ArrowRight } from "lucide-react";

export default function Citizenship() {
  const [citizens] = useState([
    { id: 1, address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", role: "Citizen", status: "Active" },
    { id: 2, address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", role: "Voter", status: "Active" },
    { id: 3, address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", role: "Minister", status: "Active" },
  ]);

  return (
    <div className="relative">
      {/* Hero Slide */}
      <section className="slide-section bg-gradient-to-br from-blue-500/10 via-background to-cyan-500/10">
        <div className="slide-content animate-fade-in">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 mb-8 animate-bounce-in">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Digital Identity Management</span>
            </div>
            <h1 className="hero-title text-6xl mb-6 animate-slide-up">
              Citizenship
            </h1>
            <p className="hero-subtitle text-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Register and manage digital identities on the blockchain
            </p>
          </div>
        </div>
      </section>

      {/* Registration Slide */}
      <section className="slide-section bg-gradient-to-br from-background via-purple-500/5 to-background">
        <div className="slide-content">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
              Register New Citizen
            </h2>
            <Card className="glass-strong border-0 shadow-strong hover:shadow-glow overflow-hidden animate-scale-in p-8">
              <CardContent className="space-y-6 p-0">
                <div className="space-y-3">
                  <Label htmlFor="address" className="text-xl">Wallet Address</Label>
                  <Input 
                    id="address" 
                    placeholder="0x..." 
                    className="glass h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="role" className="text-xl">Initial Role</Label>
                  <Select defaultValue="citizen">
                    <SelectTrigger className="glass h-14 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="voter">Voter</SelectItem>
                      <SelectItem value="minister">Minister</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full hover-scale bg-gradient-primary h-14 text-lg mt-8">
                  Register Citizen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Citizens List Slide */}
      <section className="slide-section bg-gradient-to-br from-cyan-500/10 via-background to-blue-500/10">
        <div className="slide-content">
          <h2 className="text-5xl font-bold text-center mb-16 animate-fade-in">
            Registered Citizens
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {citizens.map((citizen, index) => (
              <Card 
                key={citizen.id}
                className="hover-lift glass-strong border-0 shadow-smooth hover:shadow-glow overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <CardTitle className="text-2xl font-mono">{citizen.address}</CardTitle>
                      <div className="flex gap-3">
                        <Badge className="text-base px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500">
                          {citizen.role}
                        </Badge>
                        <Badge variant="outline" className="text-base px-4 py-1 text-green-600 border-green-600">
                          {citizen.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-float">
                      <Users className="h-8 w-8 text-white" />
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
