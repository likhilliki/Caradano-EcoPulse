import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AQI readings storage
export const aqiReadings = pgTable("aqi_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  aqi: integer("aqi").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// ECO tokens storage
export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Verifications table (Masumi Agent verification records)
export const agentVerifications = pgTable("agent_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  aqiReadingId: varchar("aqi_reading_id").notNull().references(() => aqiReadings.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, verified, rejected
  tokensAwarded: integer("tokens_awarded").default(0),
  verificationScore: integer("verification_score"), // 0-100
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Submissions table (track data submissions for verification)
export const agentSubmissions = pgTable("agent_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  aqi: integer("aqi").notNull(),
  source: text("source").notNull(), // "openweathermap", "user_manual", etc
  verificationId: varchar("verification_id").references(() => agentVerifications.id),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string(),
});

export const submitAQISchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
  aqi: z.number().min(0).max(500),
  source: z.string().optional().default("openweathermap"),
});

export type User = typeof users.$inferSelect;
export type AQIReading = typeof aqiReadings.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type AgentVerification = typeof agentVerifications.$inferSelect;
export type AgentSubmission = typeof agentSubmissions.$inferSelect;
