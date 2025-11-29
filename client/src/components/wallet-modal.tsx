import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Wallet2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletConnected: (address: string, walletType: string) => void;
}

export function WalletModal({ open, onOpenChange, onWalletConnected }: WalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const connectEternl = async () => {
    setConnecting("eternl");
    try {
      const cardano = (window as any).cardano;
      if (!cardano || !cardano.eternl) {
        toast({
          title: "Error",
          description: "Eternl wallet not installed. Please install it first.",
          variant: "destructive",
        });
        setConnecting(null);
        return;
      }

      const api = await cardano.eternl.enable();
      const addresses = await api.getUsedAddresses();
      const address = addresses[0] || (await api.getChangeAddress());

      if (address) {
        onWalletConnected(address, "Eternl");
        onOpenChange(false);
        toast({ title: "Success", description: "Connected to Eternl wallet" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect Eternl wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const connectNami = async () => {
    setConnecting("nami");
    try {
      const cardano = (window as any).cardano;
      if (!cardano || !cardano.nami) {
        toast({
          title: "Error",
          description: "Nami wallet not installed. Please install it first.",
          variant: "destructive",
        });
        setConnecting(null);
        return;
      }

      const api = await cardano.nami.enable();
      const addresses = await api.getUsedAddresses();
      const address = addresses[0] || (await api.getChangeAddress());

      if (address) {
        onWalletConnected(address, "Nami");
        onOpenChange(false);
        toast({ title: "Success", description: "Connected to Nami wallet" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect Nami wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const connectMetamask = async () => {
    setConnecting("metamask");
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast({
          title: "Error",
          description: "MetaMask not installed. Please install it first.",
          variant: "destructive",
        });
        setConnecting(null);
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        onWalletConnected(accounts[0], "MetaMask");
        onOpenChange(false);
        toast({ title: "Success", description: "Connected to MetaMask wallet" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect MetaMask wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Connect Wallet</DialogTitle>
          <DialogDescription>Choose your wallet to connect</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          {/* Eternl */}
          <Card className="glass-panel border-white/10 p-4 cursor-pointer hover:bg-white/5 transition">
            <button
              onClick={connectEternl}
              disabled={connecting !== null}
              className="w-full flex items-center justify-between"
              data-testid="button-connect-eternl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Wallet2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Eternl</p>
                  <p className="text-xs text-muted-foreground">Cardano Wallet</p>
                </div>
              </div>
              {connecting === "eternl" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </button>
          </Card>

          {/* Nami */}
          <Card className="glass-panel border-white/10 p-4 cursor-pointer hover:bg-white/5 transition">
            <button
              onClick={connectNami}
              disabled={connecting !== null}
              className="w-full flex items-center justify-between"
              data-testid="button-connect-nami"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Wallet2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Nami</p>
                  <p className="text-xs text-muted-foreground">Cardano Wallet</p>
                </div>
              </div>
              {connecting === "nami" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </button>
          </Card>

          {/* MetaMask */}
          <Card className="glass-panel border-white/10 p-4 cursor-pointer hover:bg-white/5 transition">
            <button
              onClick={connectMetamask}
              disabled={connecting !== null}
              className="w-full flex items-center justify-between"
              data-testid="button-connect-metamask"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <Wallet2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">MetaMask</p>
                  <p className="text-xs text-muted-foreground">EVM Wallet</p>
                </div>
              </div>
              {connecting === "metamask" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </button>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Don't have a wallet? Install one of these browser extensions to get started.
        </p>
      </DialogContent>
    </Dialog>
  );
}
