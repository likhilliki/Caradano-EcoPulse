import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import mapBg from "@assets/generated_images/dark_mode_map_interface_background.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Navigation } from "lucide-react";

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 relative">
        {/* Fullscreen Map Background */}
        <div className="absolute inset-0 bg-[#111]">
          <img 
            src={mapBg} 
            alt="Global Air Quality Map" 
            className="w-full h-full object-cover opacity-60"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/20 pointer-events-none" />
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button size="icon" variant="secondary" className="h-10 w-10 rounded-lg bg-card/80 backdrop-blur-md border border-white/10 shadow-lg hover:bg-card">
            <Plus className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="secondary" className="h-10 w-10 rounded-lg bg-card/80 backdrop-blur-md border border-white/10 shadow-lg hover:bg-card">
            <Minus className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="secondary" className="h-10 w-10 rounded-lg bg-card/80 backdrop-blur-md border border-white/10 shadow-lg hover:bg-card mt-2">
            <Navigation className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Map Markers (Mocked) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="relative group cursor-pointer">
             <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
             <div className="relative h-4 w-4 bg-primary rounded-full border-2 border-white shadow-[0_0_20px_hsl(var(--primary))]" />
             
             {/* Tooltip */}
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-48 animate-in fade-in slide-in-from-bottom-2">
               <Card className="p-3 bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
                 <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Your Location</div>
                 <div className="flex justify-between items-center">
                   <span className="font-bold text-white">AQI 42</span>
                   <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Excellent</Badge>
                 </div>
               </Card>
             </div>
           </div>
        </div>
        
        {/* Random other markers */}
        <div className="absolute top-1/3 left-1/3">
           <div className="h-3 w-3 bg-yellow-500 rounded-full border-2 border-white/50 opacity-80 hover:opacity-100 cursor-pointer shadow-[0_0_10px_orange]" />
        </div>
        <div className="absolute bottom-1/3 right-1/4">
           <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-white/50 opacity-80 hover:opacity-100 cursor-pointer shadow-[0_0_10px_lime]" />
        </div>
      </div>
    </div>
  );
}
