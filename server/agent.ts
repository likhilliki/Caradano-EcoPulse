import { db } from "./storage";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Masumi Agent System - Autonomous AQI Monitoring & Token Rewards
 * Auto-collects hourly AQI data and awards tokens based on air quality
 */

// Updated token reward system - cleaner air = more tokens
const AGENT_CONFIG = {
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

interface VerificationResult {
  verified: boolean;
  score: number;
  tokensAwarded: number;
  reason: string;
}

/**
 * Calculate tokens based on AQI level (cleaner air = more tokens)
 */
function calculateTokensByAQI(aqi: number): { tokens: number; level: string } {
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
  console.log(`[AGENT] Auto-verifying hourly AQI for user ${userId}: AQI=${aqi} at ${location}`);

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
    `[AGENT] ✓ Auto-verified: AQI=${aqi} (${level}), Tokens=${tokens}, Score=${score}`
  );

  return {
    verified: true,
    score,
    tokensAwarded: tokens,
    reason: `Hourly AQI check: ${level} air quality (${aqi}). +${tokens} ECO tokens awarded!`,
  };
}

/**
 * Process and award tokens for verified submission
 */
export async function processReward(
  userId: string,
  submissionId: string,
  tokensAwarded: number,
  verificationScore: number,
  location: string,
  aqi: number
): Promise<boolean> {
  try {
    console.log(`[AGENT] Processing reward: ${tokensAwarded} tokens for user ${userId}`);

    // Get submission details
    const submission = await db
      .select()
      .from(schema.agentSubmissions)
      .where(eq(schema.agentSubmissions.id, submissionId));

    if (!submission[0]) {
      console.error("[AGENT] Submission not found");
      return false;
    }

    // Create AQI reading
    const reading = await db
      .insert(schema.aqiReadings)
      .values({
        userId,
        latitude: submission[0].latitude,
        longitude: submission[0].longitude,
        aqi: submission[0].aqi,
      })
      .returning();

    // Create verification record
    const verification = await db
      .insert(schema.agentVerifications)
      .values({
        userId,
        aqiReadingId: reading[0].id,
        status: "verified",
        tokensAwarded,
        verificationScore,
        verifiedAt: new Date(),
      })
      .returning();

    // Award tokens
    await db.insert(schema.tokens).values({
      userId,
      amount: tokensAwarded,
    });

    console.log(`[AGENT] ✓ Reward processed: ${tokensAwarded} tokens awarded`);
    return true;
  } catch (error: any) {
    console.error("[AGENT] Reward processing failed:", error);
    return false;
  }
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

/**
 * Batch process pending verifications
 */
export async function processPendingVerifications() {
  console.log("[AGENT] Processing pending verifications...");

  const pending = await db
    .select()
    .from(schema.agentVerifications)
    .where(eq(schema.agentVerifications.status, "pending"));

  console.log(`[AGENT] Found ${pending.length} pending verifications`);

  for (const verification of pending) {
    try {
      await db
        .update(schema.agentVerifications)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(schema.agentVerifications.id, verification.id));

      console.log(`[AGENT] ✓ Verification ${verification.id} processed`);
    } catch (error) {
      console.error(`[AGENT] Failed to process ${verification.id}:`, error);
    }
  }

  console.log("[AGENT] ✓ Batch processing complete");
}
