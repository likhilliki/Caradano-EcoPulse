import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./storage";
import { users, otpCodes } from "../shared/schema";
import { eq } from "drizzle-orm";
import { generateOTP, hashPassword, verifyPassword, generateJWT, getOTPExpiry, verifyJWT } from "./auth";
import { submitSignedTransaction } from "./cardano";

export function authMiddleware(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  const decoded = verifyJWT(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid token" });
  }
  (req as any).user = decoded;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Cardano submit transaction
  app.post("/api/cardano/submit-tx", async (req, res) => {
    try {
      const { signedTxCBOR } = req.body;
      if (!signedTxCBOR) {
        return res.status(400).json({ message: "Missing signedTxCBOR" });
      }
      const txHash = await submitSignedTransaction(signedTxCBOR);
      res.json({ success: true, txHash });
    } catch (error: any) {
      console.error("Submit tx error:", error);
      res.status(500).json({ message: error.message || "Failed to submit transaction" });
    }
  });

  // Signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const otp = generateOTP();
      const expiresAt = getOTPExpiry();

      await db.insert(otpCodes).values({
        email,
        code: otp,
        expiresAt,
      });

      // In production, send OTP via email. For now, log it.
      console.log(`[AUTH] OTP for ${email}: ${otp}`);

      res.json({
        success: true,
        message: "OTP sent to email",
        email,
        otp, // For testing - remove in production
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Verify OTP and create user
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code, password } = req.body;
      if (!email || !code || !password) {
        return res.status(400).json({ message: "Email, code, and password required" });
      }

      const otpRecord = await db
        .select()
        .from(otpCodes)
        .where(eq(otpCodes.email, email))
        .orderBy((t) => t.createdAt)
        .limit(1);

      if (!otpRecord.length) {
        return res.status(400).json({ message: "No OTP found" });
      }

      const otp = otpRecord[0];
      if (otp.code !== code) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (new Date() > otp.expiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }

      const passwordHash = hashPassword(password);
      const newUser = await db
        .insert(users)
        .values({ email, passwordHash, verified: true })
        .returning();

      const token = generateJWT(newUser[0].id, email);

      res.json({
        success: true,
        message: "User created successfully",
        token,
        user: { id: newUser[0].id, email: newUser[0].email },
      });
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      const existingUser = await db.select().from(users).where(eq(users.email, email));

      if (existingUser.length === 0) {
        return res.status(400).json({ message: "User not found" });
      }

      const otp = generateOTP();
      const expiresAt = getOTPExpiry();

      await db.insert(otpCodes).values({
        email,
        code: otp,
        expiresAt,
      });

      console.log(`[AUTH] Login OTP for ${email}: ${otp}`);

      res.json({
        success: true,
        message: "OTP sent to email",
        email,
        otp, // For testing - remove in production
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Verify login OTP
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code required" });
      }

      const otpRecord = await db
        .select()
        .from(otpCodes)
        .where(eq(otpCodes.email, email))
        .orderBy((t) => t.createdAt)
        .limit(1);

      if (!otpRecord.length) {
        return res.status(400).json({ message: "No OTP found" });
      }

      const otp = otpRecord[0];
      if (otp.code !== code) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (new Date() > otp.expiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }

      const user = await db.select().from(users).where(eq(users.email, email));
      if (!user.length) {
        return res.status(400).json({ message: "User not found" });
      }

      const token = generateJWT(user[0].id, email);

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: { id: user[0].id, email: user[0].email },
      });
    } catch (error: any) {
      console.error("Verify login error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user (protected)
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await db.select().from(users).where(eq(users.id, (req as any).user.userId));
      if (!user.length) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user[0].id, email: user[0].email } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
