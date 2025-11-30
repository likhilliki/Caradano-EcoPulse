/**
 * Masumi Agent Configuration
 * Centralized config for token rewards, intervals, and agent settings
 */

export const AGENT_CONFIG = {
  // AQI Levels: 0-50 (Good), 51-100 (Moderate), 101-150 (Unhealthy for Sensitive), 151-200 (Unhealthy), 200+ (Very Unhealthy)
  rewards: {
    excellent: 50, // AQI 0-25 (Excellent - cleanest air)
    good: 35, // AQI 26-50 (Good)
    moderate: 20, // AQI 51-100 (Moderate)
    unhealthySensitive: 10, // AQI 101-150 (Unhealthy for Sensitive Groups)
    unhealthy: 5, // AQI 151-200 (Unhealthy)
    veryUnhealthy: 3, // AQI 200+ (Very Unhealthy)
  },
  hourlyCheckInterval: 3600000, // 1 hour in ms (3600000)
  minTimeBetweenVerifications: 3600000, // 1 hour minimum
};

export interface VerificationResult {
  verified: boolean;
  score: number;
  tokensAwarded: number;
  reason: string;
}

export interface AQILevel {
  tokens: number;
  level: string;
}
