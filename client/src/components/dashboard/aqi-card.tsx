import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Wind, Thermometer, Loader2, MapPin, CloudRain, Droplets } from "lucide-react";
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

  // Helper to convert OWM AQI (1-5) to US AQI (0-500) approximation for display
  const convertAQI = (owmAqi: number) => {
    const map = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 };
    return map[owmAqi as keyof typeof map] || 50;
  };

  const aqiValue = data ? convertAQI(data.aqi) : 42;
  const locationName = data?.weather.location || "Locating...";

  const getStatus = (aqi: number) => {
    if (aqi <= 50) return { text: "Excellent", color: "text-primary", bg: "bg-primary" };
    if (aqi <= 100) return { text: "Good", color: "text-yellow-400", bg: "bg-yellow-400" };
    if (aqi <= 150) return { text: "Moderate", color: "text-orange-400", bg: "bg-orange-400" };
    return { text: "Unhealthy", color: "text-red-500", bg: "bg-red-500" };
  };

  const status = getStatus(aqiValue);

  return (
    <Card className="glass-panel border-primary/20 relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-32 ${status.bg}/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-colors duration-500`} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex flex-col gap-1">
          Real-time Environment
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 normal-case">
            <MapPin className="h-3 w-3" />
            {locationName}
          </span>
        </CardTitle>
        <Activity className={`h-4 w-4 ${status.color} animate-pulse`} />
      </CardHeader>
      
      <CardContent>
        <div className="flex items-end gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-6xl font-heading font-bold text-white tracking-tighter text-glow">
              {aqiValue}
            </span>
            <span className={`${status.color} font-medium mt-1 flex items-center gap-1`}>
              <span className={`h-2 w-2 rounded-full ${status.bg} animate-pulse`} />
              {status.text}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mb-2 font-mono text-right">
             <div className="flex items-center justify-end gap-1 mb-1">
               <CloudRain className="h-3 w-3" />
               {data?.weather.condition || '--'}
             </div>
             Updated: Live
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PM2.5</span>
              <span className="font-mono text-white">{data?.components.pm2_5.toFixed(1) || '--'} µg/m³</span>
            </div>
            <Progress value={Math.min((data?.components.pm2_5 || 0) * 2, 100)} className="h-1.5 bg-white/10" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PM10</span>
              <span className="font-mono text-white">{data?.components.pm10.toFixed(1) || '--'} µg/m³</span>
            </div>
            <Progress value={Math.min((data?.components.pm10 || 0), 100)} className="h-1.5 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-md">
                <Wind className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Wind</div>
                <div className="text-sm font-bold">{data?.weather.wind_speed || '--'} m/s</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-md">
                <Thermometer className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Temp</div>
                <div className="text-sm font-bold">{data?.weather.temp.toFixed(1) || '--'}°C</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
