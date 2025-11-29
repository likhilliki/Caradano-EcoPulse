import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { WalletService } from "@/lib/cardano-wallet";
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
      const walletService = WalletService.getInstance();
      const success = await walletService.connectWallet();

      if (success) {
        const address = await walletService.getAddress();
        if (address) {
          setStatus('connected');
          onConnect(address);
          
          toast({
            title: "Wallet Connected",
            description: "Successfully connected to Eternl.",
            variant: "default",
          });

          setTimeout(() => {
            onOpenChange(false);
          }, 1000);
        } else {
           throw new Error("Could not retrieve address");
        }
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : "Failed to connect");
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your Eternl wallet to interact with the Cardano blockchain.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className={`h-16 justify-start gap-4 border-white/10 transition-all group ${
              status === 'error' ? 'border-red-500/50 bg-red-500/10' : 'hover:bg-white/5 hover:border-primary/50'
            }`}
            onClick={connect}
            disabled={status === 'connecting' || status === 'connected'}
          >
            <div className="h-10 w-10 rounded-full bg-[#2b2b2b] flex items-center justify-center border border-white/10">
              {/* Mock Eternal Logo */}
              <div className="w-5 h-5 rounded-sm bg-gradient-to-tr from-pink-500 to-purple-500" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-white group-hover:text-primary transition-colors">Eternl</span>
              <span className="text-xs text-muted-foreground">Browser Extension</span>
            </div>
            {status === 'connecting' && <Loader2 className="ml-auto h-5 w-5 animate-spin text-primary" />}
            {status === 'connected' && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
            {status === 'error' && <AlertCircle className="ml-auto h-5 w-5 text-red-500" />}
          </Button>
          
          {status === 'error' && (
            <div className="text-xs text-center text-red-400 animate-in fade-in">
              {errorMsg}
            </div>
          )}
          
          <div className="text-xs text-center text-muted-foreground mt-2">
            Make sure you have the Eternl wallet extension installed and active.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
