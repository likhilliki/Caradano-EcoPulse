import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Wind, Coins, Loader2 } from "lucide-react";
import { useState } from "react";
import { WalletService } from "@/lib/cardano-wallet";
import { useToast } from "@/hooks/use-toast";

export function TokenSwap() {
  const [fromAmount, setFromAmount] = useState("100");
  const [isSwapping, setIsSwapping] = useState(false);
  const { toast } = useToast();

  // Mock exchange rate: 10 AIR = 1 ADA
  const exchangeRate = 0.1;
  const toAmount = (parseFloat(fromAmount || "0") * exchangeRate).toFixed(2);

  const handleSwap = async () => {
    setIsSwapping(true);
    
    try {
      const walletService = WalletService.getInstance();
      const lucid = walletService.getLucid();

      if (!lucid) {
        throw new Error("Wallet not connected. Please connect first.");
      }

      toast({
        title: "Building Transaction",
        description: "Constructing transaction with Lucid...",
      });

      // REAL CARDANO TRANSACTION LOGIC (Simplified for Demo)
      // In a real scenario, this would interact with a smart contract.
      // Here we will simulate a "self-send" of 1 Lovelace just to trigger the REAL wallet signature flow.
      const address = await lucid.wallet.address();
      
      const tx = await lucid.newTx()
        .payToAddress(address, { lovelace: BigInt(1000000) }) // Send 1 ADA to self as proof of life
        .complete();

      toast({
        title: "Awaiting Signature",
        description: "Please sign the transaction in your Eternl wallet.",
      });

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      toast({
        title: "Transaction Submitted!",
        description: `Tx Hash: ${txHash.slice(0, 10)}...`,
        variant: "default",
      });

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

        <div className="pt-2">
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
        </div>
      </CardContent>
    </Card>
  );
}
