import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateJWT, verifyJWT } from "./auth";
import { submitSignedTransaction } from "./cardano";
import { autoVerifyCurrentAQI, processReward, getUserVerificationStats } from "./agents";

// In-memory user store for JWT auth
const userStore = new Map<string, { id: string; email: string; passwordHash: string }>();

export function authMiddleware(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const decoded = verifyJWT(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid token" });
  }
  (req as any).user = decoded;
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // SIGNUP with JWT (in-memory)
  app.post("/api/auth/signup-jwt", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      if (userStore.has(email)) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const userId = Math.random().toString(36).substr(2, 9);
      const passwordHash = hashPassword(password);
      
      userStore.set(email, { id: userId, email, passwordHash });
      
      const token = generateJWT(userId, email);

      return res.status(200).json({
        success: true,
        token,
        user: { id: userId, email },
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Signup failed" });
    }
  });

  // LOGIN with JWT (in-memory)
  app.post("/api/auth/login-jwt", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = userStore.get(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = generateJWT(user.id, email);

      return res.status(200).json({
        success: true,
        token,
        user: { id: user.id, email: user.email },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUserById((req as any).user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user.id, email: user.email, walletAddress: user.walletAddress } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Store wallet address
  app.post("/api/wallet/connect", authMiddleware, async (req, res) => {
    try {
      const { walletAddress } = req.body;
      await storage.updateWalletAddress((req as any).user.userId, walletAddress);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Save AQI reading
  app.post("/api/aqi/record", authMiddleware, async (req, res) => {
    try {
      const { latitude, longitude, aqi } = req.body;
      const reading = await storage.createAQIReading(
        (req as any).user.userId,
        latitude,
        longitude,
        aqi
      );
      res.json({ success: true, reading });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get user's AQI history
  app.get("/api/aqi/history", authMiddleware, async (req, res) => {
    try {
      const readings = await storage.getAQIReadings((req as any).user.userId);
      res.json({ readings });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Auto-verify hourly AQI data (called by agent)
  app.post("/api/agent/submit", authMiddleware, async (req, res) => {
    try {
      const { latitude, longitude, aqi, location } = req.body;
      const userId = (req as any).user.userId;

      if (!latitude || !longitude || aqi === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Auto-verify with Masumi Agent
      const verification = await autoVerifyCurrentAQI(userId, latitude, longitude, aqi, location || "Current Location");

      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          message: verification.reason,
          score: verification.score,
        });
      }

      // Process reward
      const submission = await storage.createAgentSubmission(userId, latitude, longitude, aqi, "openweathermap");
      await processReward(userId, submission.id, verification.tokensAwarded, verification.score, location || "Current Location", aqi);

      res.json({
        success: true,
        message: verification.reason,
        tokensAwarded: verification.tokensAwarded,
        score: verification.score,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get user's verification stats
  app.get("/api/agent/stats", authMiddleware, async (req, res) => {
    try {
      const stats = await getUserVerificationStats((req as any).user.userId);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get user verification history
  app.get("/api/agent/verifications", authMiddleware, async (req, res) => {
    try {
      const verifications = await storage.getAgentVerifications((req as any).user.userId);
      res.json({ verifications });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get user tokens
  app.get("/api/tokens/balance", authMiddleware, async (req, res) => {
    try {
      const balance = await storage.getUserTokens((req as any).user.userId);
      res.json({ balance });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Submit Cardano transaction
  app.post("/api/cardano/submit-tx", async (req, res) => {
    try {
      const { signedTxCBOR } = req.body;
      if (!signedTxCBOR) {
        return res.status(400).json({ message: "Missing signedTxCBOR" });
      }
      const txHash = await submitSignedTransaction(signedTxCBOR);
      res.json({ success: true, txHash });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
