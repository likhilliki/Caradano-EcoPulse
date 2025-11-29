import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const storage = {
  // Users
  async getUserByEmail(email: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  },

  async getUserById(id: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  },

  async createUser(email: string, passwordHash: string) {
    const result = await db
      .insert(schema.users)
      .values({ email, passwordHash })
      .returning();
    return result[0];
  },

  async updateWalletAddress(userId: string, walletAddress: string) {
    await db
      .update(schema.users)
      .set({ walletAddress })
      .where(eq(schema.users.id, userId));
  },

  // AQI Readings
  async createAQIReading(userId: string, latitude: string, longitude: string, aqi: number) {
    const result = await db
      .insert(schema.aqiReadings)
      .values({ userId, latitude, longitude, aqi })
      .returning();
    return result[0];
  },

  async getAQIReadings(userId: string) {
    return await db
      .select()
      .from(schema.aqiReadings)
      .where(eq(schema.aqiReadings.userId, userId));
  },

  // Tokens
  async createToken(userId: string, amount: number) {
    const result = await db
      .insert(schema.tokens)
      .values({ userId, amount })
      .returning();
    return result[0];
  },

  async getUserTokens(userId: string) {
    const result = await db
      .select()
      .from(schema.tokens)
      .where(eq(schema.tokens.userId, userId));
    return result.reduce((sum, token) => sum + token.amount, 0);
  },
};
