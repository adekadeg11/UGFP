import { NFTStorage, File } from 'nft.storage';

// Get from environment variables
const NFT_STORAGE_API_KEY = process.env.REACT_APP_NFT_STORAGE_KEY || '<YOUR_NFT_STORAGE_API_KEY>';

if (!NFT_STORAGE_API_KEY) {
  throw new Error('NFT.Storage API key is required in environment variables');
}

const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });

export async function uploadToIPFS(content, setProgress) {
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], 'document.txt');

    let progress = 0;
    const fakeProgress = setInterval(() => {
      progress += 10;
      if (progress >= 90) clearInterval(fakeProgress);
      setProgress?.(progress);
    }, 200);

    const cid = await client.storeBlob(file);
    clearInterval(fakeProgress);
    setProgress?.(100);
    return cid;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error('Failed to upload document to IPFS');
  }
}

export async function downloadFromIPFS(cid, setProgress) {
  try {
    setProgress?.(10);
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document from IPFS: ${cid}`);
    }

    setProgress?.(70);
    const text = await response.text();
    setProgress?.(100);
    return text;
  } catch (error) {
    console.error('IPFS download failed:', error);
    throw new Error('Failed to retrieve document from IPFS');
  }
}