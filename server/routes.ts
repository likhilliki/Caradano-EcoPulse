import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { submitSignedTransaction } from "./cardano";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
