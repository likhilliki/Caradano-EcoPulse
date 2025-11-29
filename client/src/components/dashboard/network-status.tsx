import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Blocks, Clock, Database, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCardanoStats, type CardanoStats } from "@/lib/blockfrost";

export function NetworkStatus() {
  const [stats, setStats] = useState<CardanoStats | null>(null);

  useEffect(() => {
    fetchCardanoStats().then(setStats);
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchCardanoStats().then(setStats);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="glass-panel border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          Cardano Mainnet Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Blocks className="h-3 w-3" /> Block Height
            </div>
            <div className="font-mono font-bold text-lg text-white">
              {stats ? stats.block.toLocaleString() : "Loading..."}
            </div>
          </div>
          
          <div className="space-y-1">
             <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Epoch
            </div>
            <div className="font-mono font-bold text-lg text-primary">
              {stats ? stats.epoch : "..."}
            </div>
          </div>

          <div className="space-y-1">
             <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="h-3 w-3" /> Slot
            </div>
            <div className="font-mono font-bold text-lg text-white truncate">
              {stats ? stats.slot.toLocaleString() : "..."}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
