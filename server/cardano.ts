import { Lucid, Blockfrost, TxComplete } from "lucid-cardano";

const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

let lucidInstance: Lucid | null = null;

export async function initLucid(): Promise<Lucid> {
  if (lucidInstance) return lucidInstance;

  lucidInstance = await Lucid.new(
    new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID),
    "Mainnet"
  );

  return lucidInstance;
}

export async function buildSwapTransaction(
  fromAddress: string,
  amount: string
): Promise<string> {
  try {
    const lucid = await initLucid();
    
    // Build a simple transaction: self-send to demonstrate
    const tx = await lucid
      .newTx()
      .payToAddress(fromAddress, { lovelace: BigInt(amount) })
      .complete();

    // Convert transaction to CBOR hex
    return tx.toString();
  } catch (error: any) {
    console.error("Failed to build transaction:", error);
    throw new Error(`Transaction Build Failed: ${error.message}`);
  }
}

export async function submitSignedTransaction(
  signedTxCBOR: string
): Promise<string> {
  try {
    // Submit the signed transaction CBOR to Blockfrost
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
      throw new Error(`Blockfrost Error: ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Failed to submit transaction:", error);
    throw new Error(`Transaction Submit Failed: ${error.message}`);
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
    console.error("Failed to get transaction status:", error);
    throw new Error(`Status Check Failed: ${error.message}`);
  }
}
