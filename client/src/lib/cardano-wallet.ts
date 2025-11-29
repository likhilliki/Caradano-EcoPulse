import { Lucid, Blockfrost } from "lucid-cardano";

const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

export class WalletService {
  private static instance: WalletService;
  private lucid: Lucid | null = null;
  private walletApi: any = null;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  public async initialize() {
    try {
      // Check for required globals
      if (typeof Buffer === 'undefined') {
        throw new Error("Buffer is not defined. Polyfill missing.");
      }

      this.lucid = await Lucid.new(
        new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID),
        "Mainnet",
      );
      console.log("Lucid initialized successfully");
    } catch (error: any) {
      console.error("Failed to initialize Lucid:", error);
      throw new Error(`Lucid Init Failed: ${error.message || JSON.stringify(error)}`);
    }
  }

  public async connectWallet(): Promise<boolean> {
    // 1. Check if window.cardano exists
    if (!window.cardano) {
      console.warn("window.cardano not found");
      throw new Error("No wallet extension found. Please install Eternl.");
    }

    // 2. Check if Eternl specifically exists
    if (!window.cardano.eternl) {
      console.warn("window.cardano.eternl not found");
      // Fallback: List available wallets for debugging
      const available = Object.keys(window.cardano).filter(k => k !== 'eternl');
      throw new Error(`Eternl not found. Available: ${available.join(', ') || 'None'}`);
    }

    try {
      console.log("Requesting Eternl access...");
      // 3. Enable wallet (CIP-30)
      this.walletApi = await window.cardano.eternl.enable();
      console.log("Eternl access granted");

      if (!this.lucid) {
        console.log("Initializing Lucid...");
        await this.initialize();
      }

      // 4. Select wallet in Lucid
      if (this.lucid) {
        this.lucid.selectWallet(this.walletApi);
        console.log("Wallet selected in Lucid");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      // CIP-30 errors are often objects like { code: -1, info: "User declined" }
      const msg = error.info || error.message || "Unknown connection error";
      throw new Error(`Connection Failed: ${msg}`);
    }
  }

  public async getAddress(): Promise<string | null> {
    if (!this.lucid) return null;
    try {
      return await this.lucid.wallet.address();
    } catch (error) {
      console.error("Failed to get address:", error);
      return null;
    }
  }

  public async getBalance(): Promise<string | null> {
    if (!this.walletApi) return null;
    try {
      const balanceCBOR = await this.walletApi.getBalance();
      return balanceCBOR; 
    } catch (error) {
      console.error("Failed to get balance:", error);
      return null;
    }
  }

  public getLucid(): Lucid | null {
    return this.lucid;
  }
}

// Add window type definition
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
