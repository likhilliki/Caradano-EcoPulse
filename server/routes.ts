import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateJWT, verifyJWT } from "./auth";
import { submitSignedTransaction } from "./cardano";

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
  // SIGNUP
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hash = hashPassword(password);
      const user = await storage.createUser(email, hash);
      const token = generateJWT(user.id, email);

      res.json({ success: true, token, user: { id: user.id, email: user.email } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // LOGIN
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      if (!verifyPassword(password, user.passwordHash)) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = generateJWT(user.id, email);
      res.json({ success: true, token, user: { id: user.id, email: user.email } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
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
