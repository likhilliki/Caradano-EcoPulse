import { Coins, Wind, Activity, Zap } from "lucide-react";

export interface AQIData {
  aqi: number;
  city: string;
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
  };
  timestamp: string;
}

export const MOCK_AQI_HISTORY = [
  { time: "00:00", aqi: 42 },
  { time: "04:00", aqi: 38 },
  { time: "08:00", aqi: 65 },
  { time: "12:00", aqi: 85 },
  { time: "16:00", aqi: 72 },
  { time: "20:00", aqi: 55 },
  { time: "24:00", aqi: 45 },
];

export const MOCK_WALLET_ASSETS = [
  { symbol: "ADA", name: "Cardano", balance: 1450.25, icon: Coins },
  { symbol: "AIR", name: "AirToken", balance: 250.00, icon: Wind },
];

export const MOCK_TRANSACTIONS = [
  { id: "tx1...8a9", type: "MINT", amount: "+50 AIR", date: "2 mins ago", status: "confirmed" },
  { id: "tx2...b3c", type: "SWAP", amount: "-100 AIR -> 25 ADA", date: "2 hrs ago", status: "confirmed" },
  { id: "tx3...d4e", type: "MINT", amount: "+35 AIR", date: "Yesterday", status: "confirmed" },
];

// Simulated Masumi Agent Logic
export const calculateRewards = (aqi: number) => {
  // Lower AQI (cleaner air) = More tokens? Or Higher AQI (more data needed) = More tokens? 
  // Let's say: You get paid for providing data.
  // Base rate + bonus for clean air zones (incentive).
  const baseRate = 10;
  const cleanAirBonus = aqi < 50 ? 5 : 0;
  return baseRate + cleanAirBonus;
};
