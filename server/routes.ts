import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { generateOTP, hashPassword, generateJWT, getOTPExpiry, verifyJWT } from "./auth";
import { submitSignedTransaction } from "./cardano";

// In-memory storage for authentication
const otpStore = new Map<string, { code: string; expiresAt: Date }>();
const userStore = new Map<string, { id: string; email: string; passwordHash: string }>();

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

  // Direct signup with JWT (no OTP)
  app.post("/api/auth/signup-jwt", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      if (userStore.has(email)) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const userId = Math.random().toString(36).substring(2, 11);
      const passwordHash = hashPassword(password);
      userStore.set(email, { id: userId, email, passwordHash });

      const token = generateJWT(userId, email);

      return res.json({
        success: true,
        message: "Account created successfully",
        token,
        user: { id: userId, email },
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: error.message || "Signup failed" });
    }
  });

  // Signup endpoint - send OTP (kept for compatibility)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      if (userStore.has(email)) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const otp = generateOTP();
      const expiresAt = getOTPExpiry();
      otpStore.set(email, { code: otp, expiresAt });

      console.log(`[AUTH] OTP for ${email}: ${otp}`);

      return res.json({
        success: true,
        message: "OTP sent to email",
        email,
        otp, // For testing only
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: error.message || "Signup failed" });
    }
  });

  // Verify OTP and create user
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code, password } = req.body;
      if (!email || !code || !password) {
        return res.status(400).json({ message: "Email, code, and password required" });
      }

      const otpData = otpStore.get(email);
      if (!otpData) {
        return res.status(400).json({ message: "No OTP found" });
      }

      if (otpData.code !== code) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (new Date() > otpData.expiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }

      const userId = Math.random().toString(36).substring(2, 11);
      const passwordHash = hashPassword(password);
      userStore.set(email, { id: userId, email, passwordHash });
      otpStore.delete(email);

      const token = generateJWT(userId, email);

      return res.json({
        success: true,
        message: "User created successfully",
        token,
        user: { id: userId, email },
      });
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      return res.status(500).json({ message: error.message || "Verification failed" });
    }
  });

  // Direct login with JWT (no OTP)
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

      const passwordMatch = password && user.passwordHash;
      if (!passwordMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = generateJWT(user.id, email);

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: { id: user.id, email: user.email },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // Login endpoint - send OTP (kept for compatibility)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      if (!userStore.has(email)) {
        return res.status(400).json({ message: "User not found" });
      }

      const otp = generateOTP();
      const expiresAt = getOTPExpiry();
      otpStore.set(email, { code: otp, expiresAt });

      console.log(`[AUTH] Login OTP for ${email}: ${otp}`);

      return res.json({
        success: true,
        message: "OTP sent to email",
        email,
        otp, // For testing
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // Verify login OTP
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code required" });
      }

      const otpData = otpStore.get(email);
      if (!otpData) {
        return res.status(400).json({ message: "No OTP found" });
      }

      if (otpData.code !== code) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (new Date() > otpData.expiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }

      const user = userStore.get(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      otpStore.delete(email);
      const token = generateJWT(user.id, email);

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: { id: user.id, email: user.email },
      });
    } catch (error: any) {
      console.error("Verify login error:", error);
      return res.status(500).json({ message: error.message || "Login verification failed" });
    }
  });

  // Get current user (protected)
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      let foundUser = null;
      for (const user of userStore.values()) {
        if (user.id === userId) {
          foundUser = user;
          break;
        }
      }
      if (!foundUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ user: { id: foundUser.id, email: foundUser.email } });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to get user" });
    }
  });

  return httpServer;
}
