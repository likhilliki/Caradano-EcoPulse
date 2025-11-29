import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
    }
  }, [open]);

  const connect = async () => {
    setStatus('connecting');
    setErrorMsg("");
    
    try {
      // Check if Eternl extension exists
      if (!window.cardano || !window.cardano.eternl) {
        throw new Error("Eternl wallet not found. Please install the Eternl extension.");
      }

      // Request wallet access - this triggers the Eternl popup
      console.log("Requesting Eternl wallet access...");
      const walletApi = await window.cardano.eternl.enable();
      console.log("Eternl wallet enabled");

      // Get addresses
      let addresses = null;
      try {
        addresses = await walletApi.getUsedAddresses();
      } catch {
        addresses = await walletApi.getUnusedAddresses();
      }

      if (!addresses || addresses.length === 0) {
        try {
          const changeAddr = await walletApi.getChangeAddress();
          addresses = [changeAddr];
        } catch {
          throw new Error("No addresses found in wallet");
        }
      }

      if (addresses && addresses.length > 0) {
        setStatus('connected');
        onConnect(addresses[0]);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Eternl.",
        });

        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      }
    } catch (error) {
      console.error("Connection error:", error);
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
