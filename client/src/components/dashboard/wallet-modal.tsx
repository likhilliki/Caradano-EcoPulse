import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { EternlWalletService } from "@/lib/cardano-wallet";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (address: string) => void;
}

export function WalletModal({ open, onOpenChange, onConnect }: WalletModalProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [balance, setBalance] = useState<{ ada: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setStatus('idle');
      setErrorMsg("");
      setBalance(null);
      setAddress("");
      
      // Log wallet availability
      if (window.cardano?.eternl) {
        console.log("[MODAL] ✓ Eternl detected");
      } else {
        console.log("[MODAL] ✗ Eternl NOT detected");
      }
    }
  }, [open]);

  const connect = async () => {
    setStatus('connecting');
    setErrorMsg("");
    
    try {
      const walletService = EternlWalletService.getInstance();

      // Check if Eternl exists
      if (!walletService.isEternlAvailable()) {
        throw new Error("Eternl wallet not found. Install Eternl browser extension.");
      }

      console.log("[MODAL] Starting real wallet connection...");

      // Connect to wallet - triggers Eternl popup
      const connectedAddress = await walletService.connect();
      setAddress(connectedAddress);

      // Get balance
      const balanceData = await walletService.getAdaBalance();
      setBalance(balanceData);

      // Get network
      const network = await walletService.getNetwork();
      console.log("[MODAL] Network:", network === 1 ? "Mainnet" : "Testnet");

      setStatus('connected');
      onConnect(connectedAddress);
      
      toast({
        title: "Wallet Connected",
        description: `Address: ${connectedAddress.slice(0, 20)}...\nBalance: ${balanceData.ada.toFixed(2)} ADA`,
      });

      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (error: any) {
      console.error("[MODAL] Connection error:", error);
      setStatus('error');
      const msg = error instanceof Error ? error.message : "Unknown error";
      setErrorMsg(msg);
      
      toast({
        title: "Connection Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Connect Eternl Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your Eternl wallet to enable real Cardano transactions
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {status === 'connected' && address && balance ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm text-green-400 font-bold">✓ Connected</p>
                <p className="text-xs text-green-400/80 font-mono break-all">{address}</p>
                <p className="text-sm text-green-400 font-bold mt-2">{balance.ada.toFixed(2)} ADA</p>
                {balance.ada === 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mt-2">
                    <p className="text-xs text-yellow-400">⚠️ Zero balance detected. Send at least 2 ADA to enable transactions.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button 
              className={`h-16 justify-start gap-4 border-white/10 transition-all group ${
                status === 'error' 
                  ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/10' 
                  : 'bg-white/5 hover:bg-white/10 hover:border-primary/50'
              }`}
              onClick={connect}
              disabled={status === 'connecting'}
              variant="outline"
              data-testid="button-connect-eternl"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center border border-white/10">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-white group-hover:text-primary transition-colors">Eternl Wallet</span>
                <span className="text-xs text-muted-foreground">Real CIP-30 Connection</span>
              </div>
              {status === 'connecting' && <Loader2 className="ml-auto h-5 w-5 animate-spin text-primary" />}
              {status === 'connected' && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
              {status === 'error' && <AlertCircle className="ml-auto h-5 w-5 text-red-500" />}
            </Button>
          )}
          
          {status === 'error' && (
            <div className="text-xs text-center text-red-400 bg-red-500/10 p-3 rounded-lg animate-in fade-in">
              {errorMsg}
            </div>
          )}
          
          <div className="text-xs text-center text-muted-foreground space-y-2">
            <p>Make sure Eternl extension is installed.</p>
            <p className="text-primary/80">This connects to REAL Cardano Mainnet</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
