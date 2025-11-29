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
      this.lucid = await Lucid.new(
        new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID),
        "Mainnet",
      );
      console.log("Lucid initialized");
    } catch (error) {
      console.error("Failed to initialize Lucid:", error);
      throw error;
    }
  }

  public async connectWallet(): Promise<boolean> {
    if (!window.cardano || !window.cardano.eternl) {
      console.error("Eternl wallet not found");
      return false;
    }

    try {
      // 1. Enable wallet (CIP-30)
      this.walletApi = await window.cardano.eternl.enable();
      
      if (!this.lucid) {
        await this.initialize();
      }

      // 2. Select wallet in Lucid
      if (this.lucid) {
        this.lucid.selectWallet(this.walletApi);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return false;
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
      // Note: This returns CBOR, would need parsing. 
      // Lucid handles this better internally usually.
      return balanceCBOR; // Simplified for this mock
    } catch (error) {
      console.error("Failed to get balance:", error);
      return null;
    }
  }

  public async submitTx(txCBOR: string): Promise<string> {
     // In a real app, we would submit here.
     // Since we are mocking the swap logic but using real signing:
     // this.lucid?.provider.submitTx(txCBOR)
     return "mock_tx_hash_" + Date.now();
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
