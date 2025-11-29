const BLOCKFROST_PROJECT_ID = 'mainnetE41fKvGSavPfZY8GO5dNW4D5d9Ed3vIC';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

export interface CardanoStats {
  epoch: number;
  slot: number;
  block: number;
  price: number; // ADA price in USD (mocked or fetched if available)
}

export async function fetchCardanoStats(): Promise<CardanoStats | null> {
  try {
    // Fetch latest block
    const response = await fetch(`${BLOCKFROST_API_URL}/blocks/latest`, {
      headers: {
        'project_id': BLOCKFROST_PROJECT_ID
      }
    });
    
    if (!response.ok) throw new Error('Blockfrost API failed');
    
    const data = await response.json();
    
    return {
      epoch: data.epoch,
      slot: data.slot,
      block: data.height,
      price: 0.45 // Mock price for now as Blockfrost doesn't give live price in free tier easily without other calls
    };
  } catch (error) {
    console.error("Blockfrost Error:", error);
    return null;
  }
}
