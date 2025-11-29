import { Lucid, Blockfrost } from "lucid-cardano";

const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

let lucidInstance: Lucid | null = null;

async function initLucidFrontend(): Promise<Lucid> {
  if (lucidInstance) return lucidInstance;

  try {
    console.log("Initializing Lucid in browser...");
    lucidInstance = await Lucid.new(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID),
      "Mainnet"
    );
    console.log("Lucid initialized successfully");
  } catch (error: any) {
    console.error("Lucid init error:", error);
    throw error;
  }

  return lucidInstance;
}

export class WalletService {
  private static instance: WalletService;
  private walletApi: any = null;
  private walletAddress: string | null = null;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  public async connectWallet(): Promise<string> {
    console.log("=== Starting real wallet connection ===");

    // Wait for Eternl to be fully loaded
    let attempts = 0;
    while (attempts < 10) {
      if (window.cardano?.eternl?.enable) {
        break;
      }
      console.log("Waiting for Eternl extension to load...");
      await new Promise(resolve => setTimeout(resolve, 300));
      attempts++;
    }

    if (!window.cardano) {
      throw new Error("No Cardano wallet detected. Please install Eternl extension from https://eternl.io");
    }

    if (!window.cardano.eternl) {
      throw new Error("Eternl wallet not found. Please install the Eternl extension and refresh the page.");
    }

    try {
      console.log("Eternl API object:", window.cardano.eternl);
      console.log("Eternl methods:", Object.keys(window.cardano.eternl));
      
      // Check if already enabled
      if (window.cardano.eternl.isEnabled) {
        const alreadyEnabled = await window.cardano.eternl.isEnabled();
        console.log("Already enabled:", alreadyEnabled);
      }
      
      console.log("Calling enable() - this should trigger Eternl popup");
      
      // Call enable() - this triggers the Eternl browser extension popup
      this.walletApi = await window.cardano.eternl.enable();
      
      console.log("✓ Wallet enabled successfully");

      let addresses = null;
      try {
        addresses = await this.walletApi.getUsedAddresses();
        console.log("Used addresses count:", addresses?.length);
      } catch (e) {
        console.log("Trying unused addresses");
        addresses = await this.walletApi.getUnusedAddresses();
      }

      if (!addresses || addresses.length === 0) {
        const changeAddr = await this.walletApi.getChangeAddress();
        addresses = [changeAddr];
      }

      if (addresses && addresses.length > 0) {
        this.walletAddress = addresses[0];
        console.log("✓ Connected to wallet address:", this.walletAddress?.slice(0, 20) + "...");
        return this.walletAddress;
      }

      throw new Error("No addresses found in wallet");
    } catch (error: any) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  public async getAddress(): Promise<string | null> {
    return this.walletAddress;
  }

  public async executeSwap(toAddress: string, amountLovelace: string): Promise<string | null> {
    if (!this.walletApi) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("=== Starting real transaction ===");
      
      // Initialize Lucid in browser
      let lucid;
      try {
        lucid = await initLucidFrontend();
        lucid.selectWallet(this.walletApi);
      } catch (error: any) {
        console.error("Failed to initialize Lucid:", error?.message || error);
        throw new Error(`Lucid initialization failed: ${error?.message || 'Unknown error'}`);
      }

      console.log("Building transaction...");
      let tx;
      try {
        tx = await lucid
          .newTx()
          .payToAddress(toAddress, { lovelace: BigInt(amountLovelace) })
          .complete();
      } catch (error: any) {
        console.error("Failed to build transaction:", error?.message || error);
        throw new Error(`Transaction build failed: ${error?.message || 'Unknown error'}`);
      }

      const txCBOR = tx.toString();
      console.log("✓ Transaction built");

      // Sign with wallet - Eternl popup appears here
      console.log("Requesting wallet signature...");
      let signedTxCBOR;
      try {
        signedTxCBOR = await this.walletApi.signTx(txCBOR);
        console.log("✓ Transaction signed");
      } catch (error: any) {
        console.error("Failed to sign transaction:", error?.message || error?.info || error);
        throw new Error(`Transaction signing failed: ${error?.info || error?.message || 'User rejected or unknown error'}`);
      }

      // Submit to backend which forwards to Blockfrost
      console.log("Submitting to blockchain...");
      const submitRes = await fetch("/api/cardano/submit-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTxCBOR }),
      });

      if (!submitRes.ok) {
        const error = await submitRes.text();
        throw new Error(`Submission failed: ${error}`);
      }

      const result = await submitRes.json();
      const txHash = result.txHash || result;
      console.log("✓ Transaction submitted:", txHash);
      return txHash;
    } catch (error: any) {
      console.error("Swap error:", error?.message || error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.walletApi !== null && this.walletAddress !== null;
  }
}

declare global {
  interface Window {
    cardano?: {
      eternl?: {
        enable: () => Promise<any>;
        isEnabled: () => Promise<boolean>;
      };
      [key: string]: any;
    };
  }
}
