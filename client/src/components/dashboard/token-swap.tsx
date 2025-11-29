import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Wind, Coins } from "lucide-react";
import { useState } from "react";

export function TokenSwap() {
  const [fromAmount, setFromAmount] = useState("100");
  const [isSwapping, setIsSwapping] = useState(false);

  // Mock exchange rate: 10 AIR = 1 ADA
  const exchangeRate = 0.1;
  const toAmount = (parseFloat(fromAmount || "0") * exchangeRate).toFixed(2);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
    }, 2000);
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
            {isSwapping ? "Swapping..." : "Swap Tokens"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
