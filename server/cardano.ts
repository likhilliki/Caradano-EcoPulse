import { Lucid, Blockfrost } from "lucid-cardano";

const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

let lucidInstance: Lucid | null = null;

export async function initLucid(): Promise<Lucid> {
  if (lucidInstance) return lucidInstance;

  try {
    lucidInstance = await Lucid.new(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID),
      "Mainnet"
    );
    console.log("Lucid initialized successfully");
  } catch (error) {
    console.error("Failed to init Lucid:", error);
    throw error;
  }

  return lucidInstance;
}

export async function buildSwapTransaction(
  fromAddress: string,
  amount: string
): Promise<string> {
  try {
    const lucid = await initLucid();
    
    console.log("Building transaction...");
    console.log("From:", fromAddress);
    console.log("Amount:", amount, "lovelace");

    const tx = await lucid
      .newTx()
      .payToAddress(fromAddress, { lovelace: BigInt(amount) })
      .complete();

    const cbor = tx.toString();
    console.log("Transaction built successfully, CBOR length:", cbor.length);
    return cbor;
  } catch (error: any) {
    console.error("Failed to build transaction:", error);
    throw new Error(`Build Failed: ${error.message}`);
  }
}

export async function submitSignedTransaction(
  signedTxCBOR: string
): Promise<string> {
  try {
    console.log("Submitting signed transaction...");
    
    const response = await fetch(
      `${BLOCKFROST_API_URL}/tx/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/cbor",
          "project_id": BLOCKFROST_PROJECT_ID,
        },
        body: Buffer.from(signedTxCBOR, "hex"),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Blockfrost error:", error);
      throw new Error(error);
    }

    const result = await response.json();
    console.log("Transaction submitted successfully:", result);
    return result;
  } catch (error: any) {
    console.error("Failed to submit transaction:", error);
    throw new Error(`Submit Failed: ${error.message}`);
  }
}

export async function getTransactionStatus(txHash: string): Promise<any> {
  try {
    const response = await fetch(
      `${BLOCKFROST_API_URL}/txs/${txHash}`,
      {
        headers: {
          "project_id": BLOCKFROST_PROJECT_ID,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Transaction not found");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Failed to get status:", error);
    throw new Error(`Status Failed: ${error.message}`);
  }
}
