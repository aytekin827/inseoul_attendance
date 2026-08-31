import { NextResponse } from 'next/server';
import { generateQRToken } from '@/lib/qr';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token eksik / 토큰 누락' }, { status: 400 });
    }

    // 기기 간 시간 차이 및 네트워크 딜레이를 고려하여 ±60초 범위(총 5개 토큰) 내의 토큰을 모두 유효한 것으로 인정
    const currentToken = generateQRToken(0);
    const prev1Token = generateQRToken(-30000);
    const prev2Token = generateQRToken(-60000);
    const next1Token = generateQRToken(30000);
    const next2Token = generateQRToken(60000);

    if (
      token === currentToken || 
      token === prev1Token || 
      token === prev2Token || 
      token === next1Token || 
      token === next2Token
    ) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz veya süresi dolmuş QR kod / 만료되었거나 올바르지 않은 QR 코드' });
  } catch (err) {
    console.error("[QR Verify API] Error:", err);
    return NextResponse.json({ success: false, error: 'Sunucu hatası / 서버 오류' }, { status: 500 });
  }
}
