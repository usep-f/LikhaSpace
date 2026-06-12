export interface IPFSUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

function generateMockCID(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = 'Qm';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function uploadToIPFS(data: unknown): Promise<string> {
  const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  const jsonString = JSON.stringify(data);
  const mockCid = generateMockCID();

  if (typeof window !== 'undefined') {
    localStorage.setItem(`ipfs_${mockCid}`, jsonString);
  }

  if (!pinataJwt) {
    console.log('No Pinata JWT found. Saved to local simulated IPFS cache:', mockCid);
    return mockCid;
  }

  try {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: jsonString,
    });
    if (!res.ok) throw new Error(`Pinata error: ${res.statusText}`);
    const body = (await res.json()) as IPFSUploadResponse;
    return body.IpfsHash;
  } catch (err) {
    console.error('Failed to upload to Pinata, falling back to local CID:', err);
    return mockCid;
  }
}

export async function fetchFromIPFS<T>(cid: string): Promise<T | null> {
  if (typeof window !== 'undefined') {
    const localData = localStorage.getItem(`ipfs_${cid}`);
    if (localData) {
      try {
        return JSON.parse(localData) as T;
      } catch (e) {
        console.error('Failed to parse cached IPFS JSON:', e);
      }
    }

    // Call the server API route to fetch from IPFS to avoid CORS in the browser
    try {
      const res = await fetch(`/api/ipfs?cid=${encodeURIComponent(cid)}`);
      if (res.ok) {
        return (await res.json()) as T;
      }
    } catch (err) {
      console.error('Client failed to fetch via /api/ipfs route:', err);
    }
    return null;
  }

  // Server-side direct fetching
  const gateways = [
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`
  ];

  for (const url of gateways) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        return (await res.json()) as T;
      }
    } catch (err) {
      console.warn(`Failed to fetch from gateway ${url}:`, err);
    }
  }

  return null;
}
