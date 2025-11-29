import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { EternlWalletService } from "@/lib/cardano-wallet";
import { useToast } from "@/hooks/use-toast";
import { WalletModal } from "@/components/wallet-modal";

export function WalletImport() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleWalletConnected = (address: string, type: string) => {
    setWalletAddress(address);
    setWalletType(type);
    setIsConnected(true);
    
    // Store wallet info
    localStorage.setItem("connectedWallet", JSON.stringify({ address, type }));
    
    toast({
      title: "Success",
      description: `Connected to ${type} wallet`,
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    localStorage.removeItem("connectedWallet");
    toast({ title: "Disconnected", description: "Wallet disconnected" });
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 16)}...${addr.slice(-16)}`;
  };

  return (
    <>
      <Card className="glass-panel border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your wallet to trade tokens and monitor AQI data on-chain
              </p>
              <Button
                onClick={() => setShowModal(true)}
                className="w-full bg-primary hover:bg-primary/90"
                data-testid="button-connect-wallet"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-black/30 rounded-lg p-4 border border-primary/20">
                <div className="text-xs text-muted-foreground mb-2">Connected Wallet</div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-primary">{walletType}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {walletAddress && shortenAddress(walletAddress)}
                    </p>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="p-2 hover:bg-white/10 rounded transition"
                    data-testid="button-copy-address"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/5"
                  onClick={() => setShowModal(true)}
                  data-testid="button-switch-wallet"
                >
                  <Wallet className="mr-1 h-3 w-3" />
                  Switch Wallet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                  onClick={handleDisconnect}
                  data-testid="button-disconnect-wallet"
                >
                  <LogOut className="mr-1 h-3 w-3" />
                  Disconnect
                </Button>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-green-400 font-semibold">✓ Wallet Connected</p>
                <p className="text-xs text-green-400/70 mt-1">Ready to execute transactions</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <WalletModal
        open={showModal}
        onOpenChange={setShowModal}
        onWalletConnected={handleWalletConnected}
      />
    </>
  );
}
