import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Wallet, Menu, X, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { WalletModal } from "@/components/dashboard/wallet-modal";

export function Navbar() {
  const [location] = useLocation();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const handleConnect = () => {
    if (!connectedAddress) {
      setIsWalletOpen(true);
    }
  };

  const handleWalletConnected = (address: string) => {
    setConnectedAddress(address);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-white">
            Eco<span className="text-primary">Pulse</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            Home
          </Link>
          <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            Dashboard
          </Link>
          <Link href="/map" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Live Map
          </Link>
          
          <Button 
            variant={connectedAddress ? "outline" : "default"}
            className={connectedAddress ? "border-primary/50 text-primary hover:bg-primary/10" : "bg-primary text-primary-foreground hover:bg-primary/90"}
            onClick={handleConnect}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {connectedAddress ? formatAddress(connectedAddress) : "Connect Wallet"}
          </Button>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-card/95 backdrop-blur-xl">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/" className="text-lg font-medium hover:text-primary">
                  Home
                </Link>
                <Link href="/dashboard" className="text-lg font-medium hover:text-primary">
                  Dashboard
                </Link>
                <Button onClick={handleConnect} className="w-full">
                  {connectedAddress ? "Wallet Connected" : "Connect Wallet"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <WalletModal 
        open={isWalletOpen} 
        onOpenChange={setIsWalletOpen} 
        onConnect={handleWalletConnected}
      />
    </nav>
  );
}
