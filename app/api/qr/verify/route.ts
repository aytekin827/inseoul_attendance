import { NextResponse } from 'next/server';
import { generateQRToken } from '../generate/route';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token eksik / 토큰 누락' }, { status: 400 });
    }

    // minor clock drift나 네트워크 전송 지연을 감안하여 이전/현재/다음 토큰(±30초 범위)까지 모두 인정
    const currentToken = generateQRToken(0);
    const prevToken = generateQRToken(-30000);
    const nextToken = generateQRToken(30000);

    if (token === currentToken || token === prevToken || token === nextToken) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz veya süresi dolmuş QR kod / 만료되었거나 올바르지 않은 QR 코드' });
  } catch (err) {
    console.error("[QR Verify API] Error:", err);
    return NextResponse.json({ success: false, error: 'Sunucu hatası / 서버 오류' }, { status: 500 });
  }
}
