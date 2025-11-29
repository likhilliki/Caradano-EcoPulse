import { Lucid, Blockfrost } from "lucid-cardano";

const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

export class WalletService {
  private static instance: WalletService;
  private lucid: Lucid | null = null;
  private walletApi: any = null;
  private walletAddress: string | null = null;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  // Lazy initialization of Lucid - only when actually needed
  private async initializeLucid() {
    if (this.lucid) return; // Already initialized

    try {
      console.log("Initializing Lucid (lazy load)...");
      this.lucid = await Lucid.new(
        new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID),
        "Mainnet",
      );
      
      if (this.walletApi) {
        this.lucid.selectWallet(this.walletApi);
      }
      console.log("Lucid initialized successfully");
    } catch (error: any) {
      console.error("Failed to initialize Lucid:", error);
      throw new Error(`Lucid Init: ${error.message || 'Unknown error'}`);
    }
  }

  public async connectWallet(): Promise<boolean> {
    // Check if window.cardano exists
    if (!window.cardano) {
      throw new Error("No wallet extension found. Please install Eternl.");
    }

    // Check if Eternl specifically exists
    if (!window.cardano.eternl) {
      const available = Object.keys(window.cardano).filter(k => k !== 'eternl');
      throw new Error(`Eternl not found. Available: ${available.join(', ') || 'None'}`);
    }

    try {
      console.log("Requesting Eternl access...");
      // Enable wallet (CIP-30)
      this.walletApi = await window.cardano.eternl.enable();
      console.log("Eternl access granted");

      // Get address immediately to verify connection
      const addresses = await this.walletApi.getUsedAddresses();
      if (addresses && addresses.length > 0) {
        this.walletAddress = addresses[0];
        console.log("Wallet connected, address obtained");
        return true;
      } else {
        throw new Error("No addresses found in wallet");
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      const msg = error.info || error.message || "Unknown connection error";
      throw new Error(`Connection Failed: ${msg}`);
    }
  }

  public async getAddress(): Promise<string | null> {
    if (this.walletAddress) return this.walletAddress;

    if (!this.walletApi) {
      console.warn("Wallet not connected");
      return null;
    }

    try {
      const addresses = await this.walletApi.getUsedAddresses();
      if (addresses && addresses.length > 0) {
        this.walletAddress = addresses[0];
        return this.walletAddress;
      }
    } catch (error) {
      console.error("Failed to get address:", error);
    }
    return null;
  }

  // Build and sign transaction - initializes Lucid only when needed
  public async buildAndSignTx(toAddress: string, amount: string): Promise<string | null> {
    if (!this.walletApi) {
      throw new Error("Wallet not connected");
    }

    try {
      // Initialize Lucid now (lazy load)
      await this.initializeLucid();

      if (!this.lucid) {
        throw new Error("Lucid not initialized");
      }

      const tx = await this.lucid.newTx()
        .payToAddress(toAddress, { lovelace: BigInt(amount) })
        .complete();

      // Sign with wallet
      console.log("Requesting wallet signature...");
      const signedTx = await tx.sign().complete();

      // Submit transaction
      console.log("Submitting transaction...");
      const txHash = await signedTx.submit();

      console.log("Transaction submitted:", txHash);
      return txHash;
    } catch (error: any) {
      console.error("Failed to build/sign transaction:", error);
      throw new Error(`Transaction Error: ${error.message || 'Unknown error'}`);
    }
  }

  public getLucid(): Lucid | null {
    return this.lucid;
  }

  public isConnected(): boolean {
    return this.walletApi !== null;
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
