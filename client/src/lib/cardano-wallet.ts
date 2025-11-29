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

  // This is called directly from the modal - no simulation
  public async connectWallet(): Promise<string> {
    console.log("=== Starting real wallet connection ===");

    if (!window.cardano) {
      throw new Error("No wallet detected. Install Eternl extension.");
    }

    if (!window.cardano.eternl) {
      throw new Error("Eternl not found. Install Eternl extension.");
    }

    try {
      // This triggers the actual Eternl popup
      console.log("Calling enable() - should trigger Eternl popup");
      this.walletApi = await window.cardano.eternl.enable();
      console.log("Wallet enabled successfully");

      // Get real addresses
      let addresses = null;
      try {
        addresses = await this.walletApi.getUsedAddresses();
        console.log("Used addresses:", addresses?.length);
      } catch (e) {
        console.log("No used addresses, trying unused");
        addresses = await this.walletApi.getUnusedAddresses();
      }

      if (!addresses || addresses.length === 0) {
        const changeAddr = await this.walletApi.getChangeAddress();
        addresses = [changeAddr];
      }

      if (addresses && addresses.length > 0) {
        this.walletAddress = addresses[0];
        console.log("Connected successfully, address:", this.walletAddress?.slice(0, 20) + "...");
        return this.walletAddress;
      }

      throw new Error("No addresses found");
    } catch (error: any) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  public async getAddress(): Promise<string | null> {
    return this.walletAddress;
  }

  // Real swap: builds tx on backend, signs with wallet, submits
  public async executeSwap(toAddress: string, amountLovelace: string): Promise<string | null> {
    if (!this.walletApi) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("=== Starting real swap ===");
      
      // 1. Backend builds the transaction
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
        throw new Error(await buildRes.text());
      }

      const { txCBOR } = await buildRes.json();
      console.log("Got unsigned transaction from backend");

      // 2. Wallet signs - this triggers Eternl popup
      console.log("Requesting wallet signature...");
      const signedTxCBOR = await this.walletApi.signTx(txCBOR);
      console.log("Transaction signed by wallet");

      // 3. Backend submits to Blockfrost
      console.log("Submitting to blockchain...");
      const submitRes = await fetch("/api/cardano/submit-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTxCBOR }),
      });

      if (!submitRes.ok) {
        throw new Error(await submitRes.text());
      }

      const result = await submitRes.json();
      const txHash = result.txHash || result;
      console.log("Transaction submitted:", txHash);
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
