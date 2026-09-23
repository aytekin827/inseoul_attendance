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
  const qrDataUrl = await generateQRCodeDataUrl(landingUrl, 360);

  return (
    <>
      {/* 구형 브라우저 및 노스크립트 환경에서도 30초 경계 시간에 맞춰 자동 새로고침 */}
      <head>
        <meta httpEquiv="refresh" content={`${remainingSeconds}`} />
      </head>

      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 select-none">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col items-center text-center">
          
          {/* 타이틀 헤더 */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Inseoul Attendance
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Giriş-Çıkış / 출퇴근 QR 코드
            </p>
          </div>

          {/* QR 코드 카드 영역 */}
          <div className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-inner p-2 relative">
            <img
              src={qrDataUrl}
              alt="Attendance QR Code"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          {/* 남은 시간 프로그레스 바 & 카운트다운 */}
          <div className="w-full mt-5 px-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1.5">
              <span>Otomatik Yenileme / 자동 갱신</span>
              <span id="timer-text" className="text-blue-600 font-mono text-sm">
                {remainingSeconds}s
              </span>
            </div>
            
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                id="timer-bar"
                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${(remainingSeconds / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* 하단 안내 뱃지 */}
          <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Güvenli & Otomatik / 30초 보안 갱신 중</span>
          </div>
        </div>

        {/* 구형 기기(iOS 9) 완벽 호환 ES5 바닐라 JS 카운트다운 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var remaining = ${remainingSeconds};
                var textEl = document.getElementById('timer-text');
                var barEl = document.getElementById('timer-bar');
                
                function update() {
                  if (textEl) {
                    textEl.innerHTML = remaining + 's';
                  }
                  if (barEl) {
                    var pct = (remaining / 30) * 100;
                    if (pct < 0) pct = 0;
                    barEl.style.width = pct + '%';
                  }
                  if (remaining <= 0) {
                    window.location.reload();
                    return;
                  }
                  remaining--;
                  setTimeout(update, 1000);
                }
                
                setTimeout(update, 1000);
              })();
            `,
          }}
        />
      </main>
    </>
  );
}
