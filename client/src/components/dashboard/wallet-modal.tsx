import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
}

export function WalletModal({ open, onOpenChange, onConnect }: WalletModalProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');

  useEffect(() => {
    if (open) setStatus('idle');
  }, [open]);

  const connect = () => {
    setStatus('connecting');
    setTimeout(() => {
      setStatus('connected');
      onConnect();
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Connect Wallet</DialogTitle>
          <DialogDescription>
            Select your Cardano wallet to continue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className="h-16 justify-start gap-4 border-white/10 hover:bg-white/5 hover:border-primary/50 transition-all group"
            onClick={connect}
            disabled={status !== 'idle'}
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
          </Button>

          <Button 
            variant="outline" 
            className="h-16 justify-start gap-4 border-white/10 hover:bg-white/5 hover:border-primary/50 transition-all group"
            disabled={status !== 'idle'}
          >
            <div className="h-10 w-10 rounded-full bg-[#2b2b2b] flex items-center justify-center border border-white/10">
              <div className="w-5 h-5 rounded-sm bg-blue-500" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-white group-hover:text-primary transition-colors">Nami</span>
              <span className="text-xs text-muted-foreground">Browser Extension</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
