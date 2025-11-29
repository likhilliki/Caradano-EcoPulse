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
      console.log("Eternl access granted, wallet API obtained");

      // Try to get any available address
      let addresses = null;
      
      try {
        // First try getUsedAddresses
        addresses = await this.walletApi.getUsedAddresses();
        console.log("Got used addresses:", addresses?.length);
      } catch (e) {
        console.log("getUsedAddresses failed, trying getUnusedAddresses");
      }

      // If no used addresses, try unused
      if (!addresses || (Array.isArray(addresses) && addresses.length === 0)) {
        try {
          addresses = await this.walletApi.getUnusedAddresses();
          console.log("Got unused addresses:", addresses?.length);
        } catch (e) {
          console.log("getUnusedAddresses also failed");
        }
      }

      // If still no addresses, try using getChangeAddress as fallback
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
        console.log("Wallet connected successfully, address:", this.walletAddress?.slice(0, 20) + "...");
        return true;
      } else {
        throw new Error("No addresses available in wallet. Try sending some ADA to this wallet first.");
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

  public isConnected(): boolean {
    return this.walletApi !== null && this.walletAddress !== null;
  }

  public getWalletApi(): any {
    return this.walletApi;
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
