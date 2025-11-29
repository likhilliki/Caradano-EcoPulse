import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { WalletService } from "@/lib/cardano-wallet";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (address: string) => void;
}

export function WalletModal({ open, onOpenChange, onConnect }: WalletModalProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setStatus('idle');
      setErrorMsg("");
      
      // Debug: Check what wallets are available
      console.log("Modal opened - checking for wallets...");
      console.log("window.cardano exists:", !!window.cardano);
      console.log("Available wallets:", window.cardano ? Object.keys(window.cardano) : "none");
      console.log("Eternl available:", !!window.cardano?.eternl);
      console.log("Running in iframe:", window !== window.top);
      console.log("Window location:", window.location.href);
      
      if (window.cardano?.eternl) {
        console.log("✓ Eternl extension detected");
        console.log("Eternl object:", window.cardano.eternl);
      } else {
        console.warn("⚠ Eternl extension NOT detected");
      }
      
      // Warn if in iframe
      if (window !== window.top) {
        console.warn("⚠ Running in iframe - wallet extensions may not work properly");
        console.warn("Try opening in new tab:", window.location.href);
      }
    }
  }, [open]);

  const connect = async () => {
    setStatus('connecting');
    setErrorMsg("");
    
    try {
      console.log("=== Starting Wallet Connection Process ===");
      
      // Check if running in browser
      if (typeof window === 'undefined') {
        throw new Error("Must be run in a browser environment");
      }

      // Check if Eternl extension is installed
      if (!window.cardano?.eternl) {
        throw new Error("Eternl wallet extension not detected. Please install it from https://eternl.io and refresh this page.");
      }

      console.log("Eternl extension detected, initiating connection...");
      
      // Use WalletService to connect - this will trigger the Eternl popup
      const walletService = WalletService.getInstance();
      const address = await walletService.connectWallet();
      
      console.log("✓ Wallet connected successfully:", address);
      
      setStatus('connected');
      onConnect(address);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Eternl wallet.",
      });

      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setStatus('error');
      
      // Handle different error types
      let msg = "Failed to connect wallet";
      if (error?.message) {
        msg = error.message;
      } else if (error?.info) {
        msg = error.info;
      } else if (error?.code === -3) {
        msg = "Connection rejected by user";
      }
      
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
          <DialogTitle className="text-xl font-heading">Connect Eternl Wallet</DialogTitle>
          <DialogDescription>
            Click below to connect your Eternl wallet extension. The wallet will ask for permission.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button 
            className={`h-16 justify-start gap-4 border-white/10 transition-all group ${
              status === 'error' 
                ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/10' 
                : status === 'connected'
                ? 'border-primary/50 bg-primary/10 hover:bg-primary/10'
                : 'bg-white/5 hover:bg-white/10 hover:border-primary/50'
            }`}
            onClick={connect}
            disabled={status === 'connecting' || status === 'connected'}
            variant="outline"
          >
            <div className="h-10 w-10 rounded-full bg-[#2b2b2b] flex items-center justify-center border border-white/10">
              <div className="w-5 h-5 rounded-sm bg-gradient-to-tr from-pink-500 to-purple-500" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-white group-hover:text-primary transition-colors">Eternl</span>
              <span className="text-xs text-muted-foreground">Web Extension</span>
            </div>
            {status === 'connecting' && <Loader2 className="ml-auto h-5 w-5 animate-spin text-primary" />}
            {status === 'connected' && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
            {status === 'error' && <AlertCircle className="ml-auto h-5 w-5 text-red-500" />}
          </Button>
          
          {status === 'error' && (
            <div className="text-xs text-center text-red-400 bg-red-500/10 p-3 rounded-lg animate-in fade-in">
              {errorMsg}
            </div>
          )}
          
          <div className="text-xs text-center text-muted-foreground">
            Make sure Eternl extension is installed and you accept the connection request.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
