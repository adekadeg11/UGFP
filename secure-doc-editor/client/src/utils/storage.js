const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;
const PINATA_JWT_TOKEN = process.env.REACT_APP_PINATA_JWT_TOKEN;

export async function uploadToIPFS(content, setProgress) {
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob);

    setProgress && setProgress(10);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Pinata upload failed');

    const data = await response.json();
    setProgress && setProgress(100);
    return data.IpfsHash;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw error;
  }
}

export async function downloadFromIPFS(cid, setProgress) {
  try {
    setProgress && setProgress(10);
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    if (!response.ok) throw new Error(`Failed to fetch from IPFS: ${cid}`);
    setProgress && setProgress(70);
    const text = await response.text();
    setProgress && setProgress(100);
    return text;
  } catch (error) {
    console.error('Download from IPFS failed:', error);
    throw error;
  }
}
