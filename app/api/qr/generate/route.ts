import { NextResponse } from 'next/server';
import { generateQRToken } from '@/lib/qr';

export async function GET() {
  const token = generateQRToken();
  // 다음 갱신까지 남은 시간(초)
  const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);
  return NextResponse.json({ token, remainingSeconds });
}
