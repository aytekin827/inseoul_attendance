import { headers } from 'next/headers';
import { generateQRToken, generateQRCodeDataUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QRDisplayPage() {
  const headersList = headers();
  
  // 프로토콜 및 호스트 추출 (Vercel 프록시 및 커스텀 도메인 완벽 지원)
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('192.168.') || host.includes('127.0.0.1') ? 'http' : 'https');
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const baseUrl = envBaseUrl ? envBaseUrl.replace(/\/$/, '') : `${proto}://${host}`;

  // 현재 30초 단위 토큰 및 남은 시간(초) 계산
  const now = Date.now();
  const token = generateQRToken();
  const remainingSeconds = 30 - (Math.floor(now / 1000) % 30);

  // 랜딩 URL 생성 및 서버에서 직접 QR 이미지(Base64 Data URL) 생성
  const landingUrl = `${baseUrl}?token=${token}`;
  const qrDataUrl = await generateQRCodeDataUrl(landingUrl, 400);

  return (
    <>
      {/* 구형 브라우저 및 메타태그 기반 30초 주기 자동 새로고침 */}
      <head>
        <meta httpEquiv="refresh" content={`${remainingSeconds}`} />
      </head>

      <main className="min-h-screen bg-white flex items-center justify-center p-4 select-none">
        <div className="w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] flex items-center justify-center p-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <img
            src={qrDataUrl}
            alt="QR Code"
            className="w-full h-full object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        {/* 백업용 ES5 타이머 (정확한 30초 경계 시점 새로고침) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(function() {
                window.location.reload();
              }, ${remainingSeconds * 1000});
            `,
          }}
        />
      </main>
    </>
  );
}
