import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitSignedTransaction } from "./cardano";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // POST /api/cardano/submit-tx
  // Accepts: { signedTxCBOR: string (signed transaction in CBOR hex from wallet) }
  // Returns: { txHash: string }
  app.post("/api/cardano/submit-tx", async (req, res) => {
    try {
      const { signedTxCBOR } = req.body;

      if (!signedTxCBOR) {
        return res.status(400).json({ 
          message: "Missing signedTxCBOR" 
        });
      }

      const txHash = await submitSignedTransaction(signedTxCBOR);
      
      res.json({ 
        success: true,
        txHash 
      });
    } catch (error: any) {
      console.error("Submit tx error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to submit transaction" 
      });
    }
  });

  return httpServer;
}
