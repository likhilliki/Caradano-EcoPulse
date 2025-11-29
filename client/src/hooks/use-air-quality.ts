import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// OpenWeatherMap Key provided by user
const API_KEY = '5584fb6ac244cc84e0dbf23108b800ad'; // Updated to the key provided in the last turn as it's likely the correct OWM key

export interface WeatherData {
  aqi: number; // 1 = Good, 5 = Very Poor
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
  weather: {
    temp: number;
    humidity: number;
    wind_speed: number;
    condition: string;
    location: string;
  };
}

export function useAirQuality() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      
      // 1. Fetch Air Pollution Data
      const pollutionRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      const pollutionJson = await pollutionRes.json();

      // 2. Fetch Current Weather Data
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const weatherJson = await weatherRes.json();

      if (pollutionJson.list && weatherJson.main) {
        setData({
          aqi: pollutionJson.list[0].main.aqi, // 1-5 scale
          components: pollutionJson.list[0].components,
          weather: {
            temp: weatherJson.main.temp,
            humidity: weatherJson.main.humidity,
            wind_speed: weatherJson.wind.speed,
            condition: weatherJson.weather[0].main,
            location: weatherJson.name,
          }
        });
        setError(null);
      } else {
        throw new Error('Invalid API response');
      }

    } catch (err) {
      console.error("API Error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Keep existing data if refresh fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchData(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Location access denied.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported");
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}
