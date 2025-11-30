/**
 * Masumi Agent Verifier - AQI Data Verification System
 * Validates air quality submissions and calculates verification scores
 */

import { db } from "../storage";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { AGENT_CONFIG, VerificationResult, AQILevel } from "./agent-config";

/**
 * Calculate tokens based on AQI level (cleaner air = more tokens)
 */
export function calculateTokensByAQI(aqi: number): AQILevel {
  if (aqi <= 25) return { tokens: AGENT_CONFIG.rewards.excellent, level: "Excellent" };
  if (aqi <= 50) return { tokens: AGENT_CONFIG.rewards.good, level: "Good" };
  if (aqi <= 100) return { tokens: AGENT_CONFIG.rewards.moderate, level: "Moderate" };
  if (aqi <= 150) return { tokens: AGENT_CONFIG.rewards.unhealthySensitive, level: "Unhealthy for Sensitive" };
  if (aqi <= 200) return { tokens: AGENT_CONFIG.rewards.unhealthy, level: "Unhealthy" };
  return { tokens: AGENT_CONFIG.rewards.veryUnhealthy, level: "Very Unhealthy" };
}

/**
 * Auto-verify current AQI data (called every hour)
 */
export async function autoVerifyCurrentAQI(
  userId: string,
  latitude: string,
  longitude: string,
  aqi: number,
  location: string
): Promise<VerificationResult> {
  console.log(`[MASUMI-VERIFIER] Auto-verifying hourly AQI for user ${userId}: AQI=${aqi} at ${location}`);

  // 1. Validate AQI
  if (aqi < 0 || aqi > 500) {
    return {
      verified: false,
      score: 0,
      tokensAwarded: 0,
      reason: `Invalid AQI: ${aqi}`,
    };
  }

  // 2. Check if user already has a verification in the last hour
  const lastHour = new Date(Date.now() - AGENT_CONFIG.minTimeBetweenVerifications);
  const recentVerifications = await db
    .select()
    .from(schema.agentVerifications)
    .where(
      and(
        eq(schema.agentVerifications.userId, userId),
        eq(schema.agentVerifications.status, "verified")
      )
    );

  const lastVerif = recentVerifications[recentVerifications.length - 1];
  if (lastVerif && lastVerif.verifiedAt && new Date(lastVerif.verifiedAt) > lastHour) {
    return {
      verified: false,
      score: 90,
      tokensAwarded: 0,
      reason: "Already verified within the last hour",
    };
  }

  // 3. Calculate score and tokens based on AQI
  let score = 100;
  const { tokens, level } = calculateTokensByAQI(aqi);

  // Bonus for consistent monitoring
  if (recentVerifications.length > 0) {
    score = Math.min(100, score + 5);
  }

  console.log(
    `[MASUMI-VERIFIER] ✓ Auto-verified: AQI=${aqi} (${level}), Tokens=${tokens}, Score=${score}`
  );

  return {
    verified: true,
    score,
    tokensAwarded: tokens,
    reason: `Hourly AQI check: ${level} air quality (${aqi}). +${tokens} ECO tokens awarded!`,
  };
}

/**
 * Get user's verification statistics
 */
export async function getUserVerificationStats(userId: string) {
  const verifications = await db
    .select()
    .from(schema.agentVerifications)
    .where(eq(schema.agentVerifications.userId, userId));

  const totalVerified = verifications.filter((v) => v.status === "verified").length;
  const totalTokens = verifications.reduce((sum, v) => sum + (v.tokensAwarded || 0), 0);
  const avgScore =
    verifications.length > 0
      ? Math.round(
          verifications.reduce((sum, v) => sum + (v.verificationScore || 0), 0) /
            verifications.length
        )
      : 0;

  return {
    totalSubmissions: verifications.length,
    verifiedSubmissions: totalVerified,
    totalTokensAwarded: totalTokens,
    averageVerificationScore: avgScore,
  };
}
