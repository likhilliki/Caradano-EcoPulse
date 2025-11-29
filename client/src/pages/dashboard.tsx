import { Navbar } from "@/components/layout/navbar";
import { AQICard } from "@/components/dashboard/aqi-card";
import { TokenSwap } from "@/components/dashboard/token-swap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_TRANSACTIONS, MOCK_AQI_HISTORY } from "@/lib/mock-data";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import mapBg from "@assets/generated_images/dark_mode_map_interface_background.png";
import { MapPin, RefreshCw, Share2 } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [isRefresing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span>San Francisco, CA (Zone 4A)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefresing ? "animate-spin" : ""}`} />
              Sync Data
            </Button>
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
              <Share2 className="h-4 w-4 mr-2" />
              Share Report
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Stats & Map */}
          <div className="lg:col-span-8 space-y-6">
            {/* Map Section */}
            <Card className="glass-panel border-white/5 overflow-hidden h-[400px] relative group">
              <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none group-hover:bg-transparent transition-colors" />
              <img 
                src={mapBg} 
                alt="Live Map" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md p-3 rounded-lg border border-primary/20">
                 <div className="text-xs text-muted-foreground uppercase mb-1">Sensor Status</div>
                 <div className="flex items-center gap-2 text-sm font-bold text-primary">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                   Online • Node #8821
                 </div>
              </div>
            </Card>

            {/* History Chart */}
            <Card className="glass-panel border-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  24h AQI History
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_AQI_HISTORY}>
                    <XAxis 
                      dataKey="time" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="aqi" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Wallet */}
          <div className="lg:col-span-4 space-y-6">
            <AQICard />
            <TokenSwap />
            
            <Card className="glass-panel border-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_TRANSACTIONS.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {tx.type === 'MINT' ? 'Rewards Minted' : 'Token Swap'}
                        </span>
                        <span className="text-xs text-muted-foreground">{tx.date}</span>
                      </div>
                      <div className={`text-sm font-mono font-bold ${tx.amount.startsWith('+') ? 'text-primary' : 'text-white'}`}>
                        {tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
