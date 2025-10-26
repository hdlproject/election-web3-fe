import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Vote, 
  Award, 
  Coins,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Citizenship", href: "/citizenship", icon: Users },
  { name: "Elections", href: "/elections", icon: Vote },
  { name: "Minister Badges", href: "/badges", icon: Award },
  { name: "Treasury", href: "/treasury", icon: Coins },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border animate-slide-in-left sticky top-0 h-screen">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border animate-fade-in">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sidebar-primary to-accent bg-clip-text text-transparent">
              e-Government
            </h1>
            <p className="text-sm text-sidebar-foreground/70 mt-1">Web3 Platform</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all animate-fade-in hover-lift group relative overflow-hidden",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/20 to-transparent" />
                  )}
                  <Icon className={cn(
                    "h-5 w-5 relative z-10 transition-transform",
                    isActive ? "text-sidebar-primary" : "group-hover:scale-110"
                  )} />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border animate-fade-in">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 hover-glow hover-scale bg-gradient-to-r from-sidebar-primary/10 to-transparent hover:from-sidebar-primary/20 hover:to-transparent border-sidebar-primary/30" 
              size="sm"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto animate-fade-in">
        {children}
      </main>
    </div>
  );
}
