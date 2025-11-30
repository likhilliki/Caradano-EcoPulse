import { db } from "./storage";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Masumi Agent System
 * Autonomous verification and reward distribution
 */

// Agent configuration
const AGENT_CONFIG = {
  baseReward: 10, // Base tokens for valid submission
  cleanAirBonus: 5, // Bonus for clean air (AQI < 50)
  moderateBonus: 3, // Bonus for moderate air (AQI 50-100)
  aqiThreshold: 500, // Max valid AQI
  duplicateCheckRadius: 0.5, // km - check for duplicate submissions nearby
  minTimeBetweenSubmissions: 600000, // 10 minutes in ms
};

interface VerificationResult {
  verified: boolean;
  score: number;
  tokensAwarded: number;
  reason: string;
}

/**
 * Verify AQI data submission using Masumi Agent logic
 */
export async function verifyAQISubmission(
  userId: string,
  latitude: string,
  longitude: string,
  aqi: number,
  source: string = "openweathermap"
): Promise<VerificationResult> {
  console.log(`[AGENT] Verifying submission from user ${userId}: AQI=${aqi}`);

  // 1. Basic validation
  if (aqi < 0 || aqi > AGENT_CONFIG.aqiThreshold) {
    return {
      verified: false,
      score: 0,
      tokensAwarded: 0,
      reason: `Invalid AQI value: ${aqi}. Must be between 0-${AGENT_CONFIG.aqiThreshold}`,
    };
  }

  // 2. Check for duplicate submissions (same location within 10 minutes)
  const recentSubmissions = await db
    .select()
    .from(schema.agentSubmissions)
    .where(eq(schema.agentSubmissions.userId, userId));

  const lastSubmission = recentSubmissions[recentSubmissions.length - 1];
  if (lastSubmission) {
    const timeDiff = Date.now() - (lastSubmission.submittedAt?.getTime() || 0);
    const locationMatch =
      lastSubmission.latitude === latitude && lastSubmission.longitude === longitude;

    if (locationMatch && timeDiff < AGENT_CONFIG.minTimeBetweenSubmissions) {
      return {
        verified: false,
        score: 0,
        tokensAwarded: 0,
        reason: "Duplicate submission too soon. Wait 10 minutes before re-submitting.",
      };
    }
  }

  // 3. Calculate verification score and tokens
  let score = 100; // Start with perfect score
  let tokensAwarded = AGENT_CONFIG.baseReward;

  // Deduct points if AQI looks unusual (very extreme values)
  if (aqi > 300) {
    score -= 10;
  }

  // Add bonus tokens for clean air data (incentivizes monitoring)
  if (aqi < 50) {
    tokensAwarded += AGENT_CONFIG.cleanAirBonus;
  } else if (aqi < 100) {
    tokensAwarded += AGENT_CONFIG.moderateBonus;
  }

  // Data source reputation check
  const approvedSources = ["openweathermap", "user_manual", "sensor_network"];
  if (!approvedSources.includes(source)) {
    score -= 5;
  }

  // 4. Create agent submission record
  const submission = await db
    .insert(schema.agentSubmissions)
    .values({
      userId,
      latitude,
      longitude,
      aqi,
      source,
    })
    .returning();

  console.log(`[AGENT] ✓ Submission verified: Score=${score}, Tokens=${tokensAwarded}`);

  return {
    verified: true,
    score: Math.max(0, score),
    tokensAwarded,
    reason: `AQI data verified by Masumi Agent. Score: ${score}/100`,
  };
}

/**
 * Process and award tokens for verified submission
 */
export async function processReward(
  userId: string,
  submissionId: string,
  tokensAwarded: number,
  verificationScore: number
): Promise<boolean> {
  try {
    console.log(`[AGENT] Processing reward: ${tokensAwarded} tokens for user ${userId}`);

    // Create verification record
    const aqiReading = await db
      .select()
      .from(schema.agentSubmissions)
      .where(eq(schema.agentSubmissions.id, submissionId));

    if (!aqiReading[0]) {
      console.error("[AGENT] Submission not found");
      return false;
    }

    // Create AQI reading
    const reading = await db
      .insert(schema.aqiReadings)
      .values({
        userId,
        latitude: aqiReading[0].latitude,
        longitude: aqiReading[0].longitude,
        aqi: aqiReading[0].aqi,
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
    const tokenResult = await db
      .insert(schema.tokens)
      .values({
        userId,
        amount: tokensAwarded,
      })
      .returning();

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
 * Can be called by a cron job or background task
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
      // Update status to verified
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
