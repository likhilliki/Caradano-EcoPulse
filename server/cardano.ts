const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

export async function submitSignedTransaction(
  signedTxCBOR: string
): Promise<string> {
  try {
    console.log("Submitting signed transaction to Blockfrost...");
    
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

    const text = await response.text();
    console.log("Response status:", response.status);
    console.log("Response:", text);

    if (!response.ok) {
      throw new Error(`Blockfrost Error: ${text}`);
    }

    // Parse response - Blockfrost returns the transaction hash directly
    console.log("Transaction submitted successfully:", text);
    return text;
  } catch (error: any) {
    console.error("Failed to submit transaction:", error);
    throw new Error(`Submit Failed: ${error.message}`);
  }
}
