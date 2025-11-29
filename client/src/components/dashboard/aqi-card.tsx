import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Wind, Droplets, Thermometer, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function AQICard() {
  return (
    <Card className="glass-panel border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Real-time Air Quality
        </CardTitle>
        <Activity className="h-4 w-4 text-primary animate-pulse" />
      </CardHeader>
      
      <CardContent>
        <div className="flex items-end gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-6xl font-heading font-bold text-white tracking-tighter text-glow">
              42
            </span>
            <span className="text-primary font-medium mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Excellent
            </span>
          </div>
          <div className="text-xs text-muted-foreground mb-2 font-mono">
            Updated: Just now
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PM2.5</span>
              <span className="font-mono text-white">12 µg/m³</span>
            </div>
            <Progress value={25} className="h-1.5 bg-white/10" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PM10</span>
              <span className="font-mono text-white">28 µg/m³</span>
            </div>
            <Progress value={35} className="h-1.5 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-md">
                <Wind className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Wind</div>
                <div className="text-sm font-bold">12 km/h</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-md">
                <Thermometer className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Temp</div>
                <div className="text-sm font-bold">24°C</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
