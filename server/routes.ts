import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { hashPassword, verifyPassword, generateJWT } from "./auth";
import { submitSignedTransaction } from "./cardano";

const users = new Map<string, { id: string; email: string; passwordHash: string }>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // SIGNUP
  app.post("/api/auth/signup-jwt", (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      if (users.has(email)) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const id = Math.random().toString(36).substr(2, 9);
      const hash = hashPassword(password);
      users.set(email, { id, email, passwordHash: hash });

      const token = generateJWT(id, email);
      return res.json({ success: true, token, user: { id, email } });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // LOGIN
  app.post("/api/auth/login-jwt", (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = users.get(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (!verifyPassword(password, user.passwordHash)) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = generateJWT(user.id, email);
      return res.json({ success: true, token, user: { id: user.id, email: user.email } });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // Cardano
  app.post("/api/cardano/submit-tx", async (req, res) => {
    try {
      const { signedTxCBOR } = req.body;
      if (!signedTxCBOR) {
        return res.status(400).json({ message: "Missing signedTxCBOR" });
      }
      const txHash = await submitSignedTransaction(signedTxCBOR);
      return res.json({ success: true, txHash });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
