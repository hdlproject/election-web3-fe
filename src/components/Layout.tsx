import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Vote,
  Award,
  Coins,
  Wallet as WalletIcon,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWallet, shortenAddress } from "@/hooks/use-wallet";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Citizenship", href: "/citizenship", icon: Users },
  { name: "Elections", href: "/elections", icon: Vote },
  { name: "Minister Badges", href: "/badges", icon: Award },
  { name: "Treasury", href: "/treasury", icon: Coins },
  { name: "Wallet", href: "/wallet", icon: WalletIcon },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // wallet state
  const wallet = useWallet();

  const explorerBase = (import.meta as any)?.env?.VITE_BLOCK_EXPLORER || "";
  const openExplorer = () => {
    if (!wallet.address) return;
    if (!explorerBase) {
      toast.info("No block explorer configured");
      return;
    }
    window.open(
      explorerBase.replace(/\/$/, "") + "/address/" + wallet.address,
      "_blank"
    );
  };

  const copyAddress = async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-sidebar-border sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <button
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-md border border-sidebar-border hover:bg-sidebar-accent/30 active:scale-95 transition"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-sidebar-primary to-accent bg-clip-text text-transparent">
          e-Government
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={wallet.connecting}
              className="gap-2 hover-glow hover-scale"
            >
              <WalletIcon className="h-4 w-4" />
              {wallet.address
                ? shortenAddress(wallet.address)
                : wallet.connecting
                ? "Connecting…"
                : "Connect"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {wallet.address ? (
              <>
                <DropdownMenuItem onClick={copyAddress}>Copy Address</DropdownMenuItem>
                <DropdownMenuItem onClick={openExplorer} disabled={!explorerBase}>View in Explorer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={wallet.disconnect}>Disconnect</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => wallet.connect()}>Connect Wallet</DropdownMenuItem>
            )}
            {wallet.error && <div className="px-2 py-1 text-xs text-red-500">{wallet.error}</div>}
            {wallet.chainId != null && wallet.address && (
              <div className="px-2 py-1 text-[10px] text-muted-foreground">Chain ID: {wallet.chainId}</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden md:block w-64 bg-sidebar border-r border-sidebar-border animate-slide-in-left sticky top-0 h-screen">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border animate-fade-in">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sidebar-primary to-accent bg-clip-text text-transparent">
              e-Government
            </h1>
            <p className="text-sm text-sidebar-foreground/70 mt-1">
              Web3 Platform
            </p>
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
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/20 to-transparent" />
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5 relative z-10 transition-transform",
                      isActive ? "text-sidebar-primary" : "group-hover:scale-110"
                    )}
                  />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-sidebar-border animate-fade-in">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 hover-glow hover-scale bg-gradient-to-r from-sidebar-primary/10 to-transparent hover:from-sidebar-primary/20 hover:to-transparent border-sidebar-primary/30"
                  size="sm"
                  disabled={wallet.connecting}
                >
                  <WalletIcon className="h-4 w-4" />
                  {wallet.address ? shortenAddress(wallet.address, 5) : wallet.connecting ? 'Connecting…' : 'Connect Wallet'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {wallet.address ? (
                  <>
                    <DropdownMenuItem onClick={copyAddress}>Copy Address</DropdownMenuItem>
                    <DropdownMenuItem onClick={openExplorer} disabled={!explorerBase}>View in Explorer</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={wallet.disconnect}>Disconnect</DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => wallet.connect()}>Connect Wallet</DropdownMenuItem>
                )}
                {wallet.error && <div className="px-2 py-1 text-xs text-red-500">{wallet.error}</div>}
                {wallet.chainId != null && wallet.address && (
                  <div className="px-2 py-1 text-[10px] text-muted-foreground">Chain ID: {wallet.chainId}</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] h-full bg-sidebar border-r border-sidebar-border shadow-xl animate-slide-in-left flex flex-col">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-sidebar-accent/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40"
                    )}
                  >
                    <Icon className="h-5 w-5" /> {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-sidebar-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2"
                    disabled={wallet.connecting}
                  >
                    <WalletIcon className="h-4 w-4" /> {wallet.address ? shortenAddress(wallet.address) : wallet.connecting ? 'Connecting…' : 'Connect Wallet'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {wallet.address ? (
                    <>
                      <DropdownMenuItem onClick={copyAddress}>Copy Address</DropdownMenuItem>
                      <DropdownMenuItem onClick={openExplorer} disabled={!explorerBase}>View in Explorer</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={wallet.disconnect}>Disconnect</DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => wallet.connect()}>Connect Wallet</DropdownMenuItem>
                  )}
                  {wallet.error && <div className="px-2 py-1 text-xs text-red-500">{wallet.error}</div>}
                  {wallet.chainId != null && wallet.address && (
                    <div className="px-2 py-1 text-[10px] text-muted-foreground">Chain ID: {wallet.chainId}</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="px-4 pt-6 pb-10 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
