import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Wind, Coins, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { WalletService } from "@/lib/cardano-wallet";
import { useToast } from "@/hooks/use-toast";

export function TokenSwap() {
  const [fromAmount, setFromAmount] = useState("100");
  const [isSwapping, setIsSwapping] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock exchange rate: 10 AIR = 1 ADA
  const exchangeRate = 0.1;
  const toAmount = (parseFloat(fromAmount || "0") * exchangeRate).toFixed(2);
  // Convert ADA to Lovelace (1 ADA = 1,000,000 lovelace)
  const lovelaceAmount = (parseFloat(toAmount) * 1_000_000).toString();

  const handleSwap = async () => {
    setIsSwapping(true);
    setSuccess(false);
    setTxHash(null);
    
    try {
      const walletService = WalletService.getInstance();

      if (!walletService.isConnected()) {
        throw new Error("Wallet not connected. Please connect first.");
      }

      toast({
        title: "Initiating Swap",
        description: "Building and signing transaction...",
      });

      const address = await walletService.getAddress();
      if (!address) {
        throw new Error("Could not retrieve wallet address");
      }

      // Execute real transaction
      const hash = await walletService.executeSwap(address, lovelaceAmount);
      
      setTxHash(hash);
      setSuccess(true);

      toast({
        title: "Swap Successful!",
        description: `${fromAmount} AIR → ${toAmount} ADA\nTx: ${hash.slice(0, 12)}...`,
        variant: "default",
      });

      // Reset form after 5 seconds
      setTimeout(() => {
        setFromAmount("100");
        setSuccess(false);
        setTxHash(null);
      }, 5000);

    } catch (error) {
      console.error("Swap failed:", error);
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Transaction rejected or failed",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <Card className="glass-panel border-white/5">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Token Exchange
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">From (AirToken)</label>
          <div className="relative">
            <Input 
              type="number" 
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              disabled={isSwapping || success}
              className="bg-black/20 border-white/10 pl-10 font-mono text-lg" 
            />
            <Wind className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Balance: 250.00
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button size="icon" variant="ghost" className="rounded-full hover:bg-white/5">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">To (ADA)</label>
          <div className="relative">
            <Input 
              type="number" 
              value={toAmount}
              readOnly
              className="bg-black/20 border-white/10 pl-10 font-mono text-lg" 
            />
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
          </div>
        </div>

        {success && txHash && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs">
            <p className="text-green-400 font-bold mb-1">Transaction Confirmed</p>
            <p className="text-green-400/80 font-mono break-all">{txHash}</p>
            <p className="text-green-400/60 mt-2">Check Eternl wallet for incoming ADA</p>
          </div>
        )}

        <div className="pt-2">
          {success ? (
            <Button 
              className="w-full bg-green-500/20 text-green-400 hover:bg-green-500/30 font-bold border border-green-500/50"
              disabled
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Transaction Successful
            </Button>
          ) : (
            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              onClick={handleSwap}
              disabled={isSwapping}
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Swap Tokens"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
