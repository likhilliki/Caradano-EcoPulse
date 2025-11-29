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

    if (!window.cardano) {
      throw new Error("No wallet detected. Install Eternl extension.");
    }

    if (!window.cardano.eternl) {
      throw new Error("Eternl not found. Install Eternl extension.");
    }

    try {
      console.log("Calling enable() - triggering Eternl popup");
      this.walletApi = await window.cardano.eternl.enable();
      console.log("Wallet enabled successfully");

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
      const lucid = await initLucidFrontend();
      lucid.selectWallet(this.walletApi);

      console.log("Building transaction...");
      const tx = await lucid
        .newTx()
        .payToAddress(toAddress, { lovelace: BigInt(amountLovelace) })
        .complete();

      const txCBOR = tx.toString();
      console.log("✓ Transaction built");

      // Sign with wallet - Eternl popup appears here
      console.log("Requesting wallet signature...");
      const signedTxCBOR = await this.walletApi.signTx(txCBOR);
      console.log("✓ Transaction signed");

      // Submit to backend which forwards to Blockfrost
      console.log("Submitting to blockchain...");
      const submitRes = await fetch("/api/cardano/submit-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTxCBOR }),
      });

      if (!submitRes.ok) {
        const error = await submitRes.text();
        throw new Error(error);
      }

      const result = await submitRes.json();
      const txHash = result.txHash || result;
      console.log("✓ Transaction submitted:", txHash);
      return txHash;
    } catch (error: any) {
      console.error("Swap error:", error);
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
