import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "@/lib/leaflet-custom.css";
import { Icon } from "leaflet";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Navigation } from "lucide-react";
import { useAirQuality } from "@/hooks/use-air-quality";

// Custom marker icon
const customIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to update map center when position changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { data: aqiData } = useAirQuality();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationError("Could not get your location. Defaulting to London.");
          // Default to London if permission denied
          setPosition([51.505, -0.09]);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation not supported");
      setPosition([51.505, -0.09]);
    }
  }, []);

  if (!position) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Acquiring satellite lock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={true} 
          className="w-full h-full absolute inset-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater center={position} />

          {/* User Location Marker */}
          <Marker position={position} icon={customIcon}>
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">Your Location</h3>
                  <Badge variant={aqiData?.aqi && aqiData.aqi <= 50 ? "default" : "destructive"}>
                    AQI: {aqiData?.aqi || "Loading..."}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lat: {position[0].toFixed(4)}<br/>
                  Long: {position[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Radius Circle showing coverage area */}
          <Circle 
            center={position}
            pathOptions={{ fillColor: 'hsl(140 100% 60%)', color: 'hsl(140 100% 60%)' }}
            radius={2000}
          />
        </MapContainer>

        {/* Overlay UI */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
           <Card className="bg-card/90 backdrop-blur-xl border-primary/20 shadow-2xl">
             <CardContent className="flex items-center gap-4 p-4">
               <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                 <Navigation className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <h4 className="font-bold text-white text-sm">Live Tracking Active</h4>
                 <p className="text-xs text-muted-foreground">
                   {locationError ? locationError : "Monitoring air quality in your zone."}
                 </p>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
