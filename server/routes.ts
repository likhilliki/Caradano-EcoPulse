import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { generateOTP, hashPassword, verifyPassword, generateJWT, getOTPExpiry, verifyJWT } from "./auth";
import { submitSignedTransaction } from "./cardano";

// Simple in-memory storage
const userStore = new Map<string, { id: string; email: string; passwordHash: string }>();
const otpStore = new Map<string, { code: string; expiresAt: Date }>();

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

  // SIGNUP with JWT
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

  // LOGIN with JWT
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
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    try {
      const userId = (req as any).user.userId;
      for (const user of userStore.values()) {
        if (user.id === userId) {
          res.json({ user: { id: user.id, email: user.email } });
          return;
        }
      }
      res.status(404).json({ message: "User not found" });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // OTP Signup - send OTP
  app.post("/api/auth/signup", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password required" });
        return;
      }

      if (userStore.has(email)) {
        res.status(400).json({ message: "Email already registered" });
        return;
      }

      const otp = generateOTP();
      const expiresAt = getOTPExpiry();
      otpStore.set(email, { code: otp, expiresAt });

      console.log(`[OTP] Signup for ${email}: ${otp}`);

      res.json({
        success: true,
        message: "OTP sent",
        email,
        otp,
      });
    } catch (error) {
      console.error("Signup OTP error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // OTP Verify signup
  app.post("/api/auth/verify-otp", (req, res) => {
    try {
      const { email, code, password } = req.body;
      if (!email || !code || !password) {
        res.status(400).json({ message: "Email, code, and password required" });
        return;
      }

      const otpData = otpStore.get(email);
      if (!otpData) {
        res.status(400).json({ message: "No OTP found" });
        return;
      }

      if (otpData.code !== code) {
        res.status(400).json({ message: "Invalid OTP" });
        return;
      }

      if (new Date() > otpData.expiresAt) {
        res.status(400).json({ message: "OTP expired" });
        return;
      }

      const userId = Math.random().toString(36).substr(2, 9);
      const passwordHash = hashPassword(password);
      userStore.set(email, { id: userId, email, passwordHash });
      otpStore.delete(email);

      const token = generateJWT(userId, email);

      res.json({
        success: true,
        token,
        user: { id: userId, email },
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // OTP Login - send OTP
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ message: "Email required" });
        return;
      }

      if (!userStore.has(email)) {
        res.status(400).json({ message: "User not found" });
        return;
      }

      const otp = generateOTP();
      const expiresAt = getOTPExpiry();
      otpStore.set(email, { code: otp, expiresAt });

      console.log(`[OTP] Login for ${email}: ${otp}`);

      res.json({
        success: true,
        message: "OTP sent",
        email,
        otp,
      });
    } catch (error) {
      console.error("Login OTP error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // OTP Verify login
  app.post("/api/auth/verify-login", (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({ message: "Email and code required" });
        return;
      }

      const otpData = otpStore.get(email);
      if (!otpData) {
        res.status(400).json({ message: "No OTP found" });
        return;
      }

      if (otpData.code !== code) {
        res.status(400).json({ message: "Invalid OTP" });
        return;
      }

      if (new Date() > otpData.expiresAt) {
        res.status(400).json({ message: "OTP expired" });
        return;
      }

      const user = userStore.get(email);
      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }

      otpStore.delete(email);
      const token = generateJWT(user.id, email);

      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email },
      });
    } catch (error) {
      console.error("Verify login error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  return httpServer;
}
