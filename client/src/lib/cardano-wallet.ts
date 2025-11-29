const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';

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

  public async connectWallet(): Promise<boolean> {
    if (!window.cardano) {
      throw new Error("No wallet extension found. Please install Eternl.");
    }

    if (!window.cardano.eternl) {
      const available = Object.keys(window.cardano).filter(k => k !== 'eternl');
      throw new Error(`Eternl not found. Available: ${available.join(', ') || 'None'}`);
    }

    try {
      console.log("Requesting Eternl access...");
      this.walletApi = await window.cardano.eternl.enable();
      console.log("Eternl access granted");

      let addresses = null;
      
      try {
        addresses = await this.walletApi.getUsedAddresses();
        console.log("Got used addresses:", addresses?.length);
      } catch (e) {
        console.log("getUsedAddresses failed, trying getUnusedAddresses");
      }

      if (!addresses || (Array.isArray(addresses) && addresses.length === 0)) {
        try {
          addresses = await this.walletApi.getUnusedAddresses();
          console.log("Got unused addresses:", addresses?.length);
        } catch (e) {
          console.log("getUnusedAddresses also failed");
        }
      }

      if (!addresses || (Array.isArray(addresses) && addresses.length === 0)) {
        try {
          console.log("Trying getChangeAddress as fallback...");
          const changeAddr = await this.walletApi.getChangeAddress();
          if (changeAddr) {
            addresses = [changeAddr];
            console.log("Got change address as fallback");
          }
        } catch (e) {
          console.log("getChangeAddress failed");
        }
      }

      if (addresses && addresses.length > 0) {
        this.walletAddress = addresses[0];
        console.log("Wallet connected successfully");
        return true;
      } else {
        throw new Error("No addresses available in wallet.");
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
      return null;
    }

    try {
      let addresses = await this.walletApi.getUsedAddresses();
      if (!addresses || addresses.length === 0) {
        addresses = await this.walletApi.getUnusedAddresses();
      }
      
      if (addresses && addresses.length > 0) {
        this.walletAddress = addresses[0];
        return this.walletAddress;
      }
    } catch (error) {
      console.error("Failed to get address:", error);
    }
    return null;
  }

  // Real transaction flow: Build -> Sign -> Submit
  public async executeSwap(toAddress: string, amountLovelace: string): Promise<string> {
    if (!this.walletApi) {
      throw new Error("Wallet not connected");
    }

    try {
      // 1. Build transaction on backend
      console.log("Building transaction on backend...");
      const buildRes = await fetch("/api/cardano/build-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAddress: this.walletAddress,
          amount: amountLovelace,
        }),
      });

      if (!buildRes.ok) {
        throw new Error(`Build failed: ${await buildRes.text()}`);
      }

      const buildData = await buildRes.json();
      const txCBOR = buildData.txCBOR;

      console.log("Transaction built, requesting signature...");

      // 2. Sign transaction with wallet (CIP-30)
      const signedTxCBOR = await this.walletApi.signTx(txCBOR);
      console.log("Transaction signed by wallet");

      // 3. Submit signed transaction to backend
      console.log("Submitting signed transaction...");
      const submitRes = await fetch("/api/cardano/submit-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTxCBOR }),
      });

      if (!submitRes.ok) {
        throw new Error(`Submit failed: ${await submitRes.text()}`);
      }

      const submitData = await submitRes.json();
      const txHash = submitData.txHash;

      console.log("Transaction submitted:", txHash);
      return txHash;
    } catch (error: any) {
      console.error("Swap failed:", error);
      throw new Error(`Swap Failed: ${error.message}`);
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
