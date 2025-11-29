import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { buildSwapTransaction, submitSignedTransaction, getTransactionStatus } from "./cardano";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Cardano transaction endpoints
  
  // POST /api/cardano/build-swap
  // Accepts: { fromAddress: string, amount: string (in lovelace) }
  // Returns: { txCBOR: string (unsigned transaction in CBOR hex) }
  app.post("/api/cardano/build-swap", async (req, res) => {
    try {
      const { fromAddress, amount } = req.body;

      if (!fromAddress || !amount) {
        return res.status(400).json({ 
          message: "Missing fromAddress or amount" 
        });
      }

      const txCBOR = await buildSwapTransaction(fromAddress, amount);
      
      res.json({ 
        success: true,
        txCBOR 
      });
    } catch (error: any) {
      console.error("Build swap error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to build transaction" 
      });
    }
  });

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

  // GET /api/cardano/tx-status/:txHash
  // Returns: { confirmed: boolean, block: number, ...blockfrost_data }
  app.get("/api/cardano/tx-status/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      const status = await getTransactionStatus(txHash);
      
      res.json({ 
        success: true,
        ...status 
      });
    } catch (error: any) {
      console.error("Status check error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to get transaction status" 
      });
    }
  });

  return httpServer;
}
