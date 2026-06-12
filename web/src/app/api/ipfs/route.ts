import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cid = searchParams.get('cid');

    if (!cid) {
      return NextResponse.json({ error: 'Missing CID parameter' }, { status: 400 });
    }

    const gateways = [
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`
    ];

    for (const url of gateways) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn(`Server failed to fetch from gateway ${url}:`, err);
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch from all IPFS gateways' }, 
      { status: 502 }
    );
  } catch (error: unknown) {
    console.error('Error in /api/ipfs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
