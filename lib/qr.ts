import crypto from 'crypto';
import QRCode from 'qrcode';

const SECRET_KEY = process.env.QR_SECRET_KEY || "inseoul_attendance_qr_secret_key_2026";

/**
 * 토큰 생성기: 현재 UTC 시간을 30초 단위로 나누어 암호화 해시 생성
 */
export function generateQRToken(timeOffset = 0) {
  const timeStep = Math.floor((Date.now() + timeOffset) / 30000); // 30초 단위
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(timeStep.toString())
    .digest('hex')
    .slice(0, 16); // 16자리만 사용
}

/**
 * 서버에서 Base64 Data URL (PNG) 형식으로 QR 코드 이미지 생성
 */
export async function generateQRCodeDataUrl(text: string, size = 350): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * 서버에서 SVG 문자열 형식으로 QR 코드 생성
 */
export async function generateQRCodeSvg(text: string, size = 350): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    width: size,
    margin: 2,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

