import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET_KEY = process.env.QR_SECRET_KEY || "inseoul_attendance_qr_secret_key_2026";

// 토큰 생성기: 현재 UTC 시간을 30초 단위로 나누어 해시 생성
export function generateQRToken(timeOffset = 0) {
  const timeStep = Math.floor((Date.now() + timeOffset) / 30000); // 30초 단위
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(timeStep.toString())
    .digest('hex')
    .slice(0, 16); // 16자리만 사용
}

export async function GET() {
  const token = generateQRToken();
  // 다음 갱신까지 남은 시간(초)
  const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);
  return NextResponse.json({ token, remainingSeconds });
}
