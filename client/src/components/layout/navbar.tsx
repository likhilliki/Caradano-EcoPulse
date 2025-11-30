import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Wallet, Menu, X, ShieldCheck, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { WalletModal } from "@/components/dashboard/wallet-modal";
import { EternlWalletService } from "@/lib/cardano-wallet";

export function Navbar() {
  const [location, navigate] = useLocation();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if wallet is already connected and if user is authenticated
  useEffect(() => {
    const checkWallet = async () => {
      const walletService = EternlWalletService.getInstance();
      if (walletService.isConnected()) {
        const address = await walletService.getAddress();
        if (address) {
          setConnectedAddress(address);
        }
      }
    };
    
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
    
    checkWallet();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("connectedWallet");
    setIsAuthenticated(false);
    setConnectedAddress(null);
    navigate("/");
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
          {isAuthenticated && (
            <>
              <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
                Dashboard
              </Link>
              <Link href="/map" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Live Map
              </Link>
            </>
          )}
          
          <Button 
            variant={connectedAddress ? "outline" : "default"}
            className={connectedAddress ? "border-primary/50 text-primary hover:bg-primary/10" : "bg-primary text-primary-foreground hover:bg-primary/90"}
            onClick={handleConnect}
            data-testid="button-connect-wallet-nav"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {connectedAddress ? formatAddress(connectedAddress) : "Connect Wallet"}
          </Button>

          {isAuthenticated && (
            <Button
              variant="ghost"
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
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
                {isAuthenticated && (
                  <>
                    <Link href="/dashboard" className="text-lg font-medium hover:text-primary">
                      Dashboard
                    </Link>
                    <Link href="/map" className="text-lg font-medium hover:text-primary">
                      Live Map
                    </Link>
                  </>
                )}
                <Button onClick={handleConnect} className="w-full">
                  {connectedAddress ? "Wallet Connected" : "Connect Wallet"}
                </Button>
                {isAuthenticated && (
                  <Button onClick={handleLogout} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                )}
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
