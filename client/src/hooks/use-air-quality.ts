import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_KEY = '83b5ed2103b77dc40c5988080c8080c24ecf6f315adbdd62781398787fcd86b5';

export interface AQIData {
  aqi: number;
  city: {
    name: string;
    url: string;
  };
  dominentpol: string;
  iaqi: {
    co?: { v: number };
    h?: { v: number };
    no2?: { v: number };
    o3?: { v: number };
    p?: { v: number };
    pm10?: { v: number };
    pm25?: { v: number };
    so2?: { v: number };
    t?: { v: number };
    w?: { v: number };
    wg?: { v: number };
  };
  time: {
    s: string;
    tz: string;
    v: number;
  };
}

export function useAirQuality() {
  const [data, setData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAQI = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      // Using AQICN feed API for geolocation
      const response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${API_KEY}`);
      const result = await response.json();

      if (result.status === 'ok') {
        setData(result.data);
        setError(null);
      } else {
        throw new Error(result.data || 'Failed to fetch AQI data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: "Error fetching air quality",
        description: "Could not retrieve data for your location.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchAQI(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Location access denied. Showing demo data.");
          // Fallback to a default location (e.g., San Francisco) if geolocation fails
          // fetchAQI(37.7749, -122.4194); 
          setLoading(false);
          
          toast({
            title: "Location access denied",
            description: "Please enable location services to see local air quality.",
            variant: "default",
          });
        }
      );
    } else {
      setError("Geolocation not supported");
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch: () => {
    if ("geolocation" in navigator) {
       navigator.geolocation.getCurrentPosition(
        (position) => fetchAQI(position.coords.latitude, position.coords.longitude)
       );
    }
  }};
}
