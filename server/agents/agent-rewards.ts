/**
 * Masumi Agent Rewards Processor - Token Distribution System
 * Handles reward processing, token distribution, and verification batching
 */

import { db } from "../storage";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

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
    console.log(`[MASUMI-REWARDS] Processing reward: ${tokensAwarded} tokens for user ${userId}`);

    // Get submission details
    const submission = await db
      .select()
      .from(schema.agentSubmissions)
      .where(eq(schema.agentSubmissions.id, submissionId));

    if (!submission[0]) {
      console.error("[MASUMI-REWARDS] Submission not found");
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

    console.log(`[MASUMI-REWARDS] ✓ Reward processed: ${tokensAwarded} tokens awarded`);
    return true;
  } catch (error: any) {
    console.error("[MASUMI-REWARDS] Reward processing failed:", error);
    return false;
  }
}

/**
 * Batch process pending verifications
 */
export async function processPendingVerifications() {
  console.log("[MASUMI-REWARDS] Processing pending verifications...");

  const pending = await db
    .select()
    .from(schema.agentVerifications)
    .where(eq(schema.agentVerifications.status, "pending"));

  console.log(`[MASUMI-REWARDS] Found ${pending.length} pending verifications`);

  for (const verification of pending) {
    try {
      await db
        .update(schema.agentVerifications)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(schema.agentVerifications.id, verification.id));

      console.log(`[MASUMI-REWARDS] ✓ Verification ${verification.id} processed`);
    } catch (error) {
      console.error(`[MASUMI-REWARDS] Failed to process ${verification.id}:`, error);
    }
  }

  console.log("[MASUMI-REWARDS] ✓ Batch processing complete");
}
