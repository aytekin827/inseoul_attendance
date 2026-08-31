import { NextResponse } from 'next/server';
import { generateQRToken } from '@/lib/qr';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = generateQRToken();
  const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);
  
  return new NextResponse(
    JSON.stringify({ token, remainingSeconds }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    }
  );
}
