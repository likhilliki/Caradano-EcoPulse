import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Wind, Thermometer, Loader2, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAirQuality } from "@/hooks/use-air-quality";

export function AQICard() {
  const { data, loading, error } = useAirQuality();

  if (loading) {
    return (
      <Card className="glass-panel border-primary/20 relative overflow-hidden min-h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </Card>
    );
  }

  // If error or no data, we can show a fallback or the error state. 
  // For the prototype, let's keep the mock data as a visual fallback if the API fails, 
  // but if we have data, we use it.
  const displayData = data || {
    aqi: 42,
    city: { name: "San Francisco (Demo)" },
    iaqi: {
      pm25: { v: 12 },
      pm10: { v: 28 },
      w: { v: 12 },
      t: { v: 24 }
    }
  };

  const getStatus = (aqi: number) => {
    if (aqi <= 50) return { text: "Excellent", color: "text-primary", bg: "bg-primary" };
    if (aqi <= 100) return { text: "Good", color: "text-yellow-400", bg: "bg-yellow-400" };
    if (aqi <= 150) return { text: "Moderate", color: "text-orange-400", bg: "bg-orange-400" };
    return { text: "Unhealthy", color: "text-red-500", bg: "bg-red-500" };
  };

  const status = getStatus(displayData.aqi);

  return (
    <Card className="glass-panel border-primary/20 relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-32 ${status.bg}/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-colors duration-500`} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex flex-col gap-1">
          Real-time Air Quality
          {displayData.city && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 normal-case">
              <MapPin className="h-3 w-3" />
              {displayData.city.name}
            </span>
          )}
        </CardTitle>
        <Activity className={`h-4 w-4 ${status.color} animate-pulse`} />
      </CardHeader>
      
      <CardContent>
        <div className="flex items-end gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-6xl font-heading font-bold text-white tracking-tighter text-glow">
              {displayData.aqi}
            </span>
            <span className={`${status.color} font-medium mt-1 flex items-center gap-1`}>
              <span className={`h-2 w-2 rounded-full ${status.bg} animate-pulse`} />
              {status.text}
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
              <span className="font-mono text-white">{displayData.iaqi.pm25?.v || '--'} µg/m³</span>
            </div>
            <Progress value={Math.min((displayData.iaqi.pm25?.v || 0), 100)} className="h-1.5 bg-white/10" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PM10</span>
              <span className="font-mono text-white">{displayData.iaqi.pm10?.v || '--'} µg/m³</span>
            </div>
            <Progress value={Math.min((displayData.iaqi.pm10?.v || 0), 100)} className="h-1.5 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-md">
                <Wind className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Wind</div>
                <div className="text-sm font-bold">{displayData.iaqi.w?.v || '--'} km/h</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-md">
                <Thermometer className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Temp</div>
                <div className="text-sm font-bold">{displayData.iaqi.t?.v || '--'}°C</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
