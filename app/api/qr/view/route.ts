import { NextResponse } from 'next/server';
import { generateQRToken, generateQRCodeDataUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('192.168.') || host.includes('127.0.0.1') ? 'http' : 'https');
  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const baseUrl = envBaseUrl ? envBaseUrl.replace(/\/$/, '') : `${proto}://${host}`;

  const now = Date.now();
  const token = generateQRToken();
  const remainingSeconds = 30 - (Math.floor(now / 1000) % 30);

  const landingUrl = `${baseUrl}?token=${token}`;
  const qrDataUrl = await generateQRCodeDataUrl(landingUrl, 380);

  // 순수 HTML 문서 (Next.js 클라이언트 스크립트가 0%인 100% 구형 기기 전용 Kiosk 페이지)
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="refresh" content="${remainingSeconds}">
  <title>Inseoul Attendance QR</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Segoe UI", Roboto, sans-serif;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-orient: vertical;
      -webkit-box-direction: normal;
      -webkit-flex-direction: column;
      flex-direction: column;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 28px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 28px 24px;
      width: 100%;
      max-width: 360px;
      text-align: center;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
      margin-bottom: 20px;
    }
    .qr-box {
      background: #ffffff;
      border: 2px solid #f1f5f9;
      border-radius: 20px;
      padding: 12px;
      margin: 0 auto;
      width: 290px;
      height: 290px;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
    }
    .qr-img {
      width: 100%;
      height: 100%;
      display: block;
      image-rendering: -webkit-optimize-contrast;
    }
    .progress-container {
      margin-top: 20px;
      width: 100%;
    }
    .timer-info {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-pack: justify;
      -webkit-justify-content: space-between;
      justify-content: space-between;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 6px;
    }
    .timer-text {
      color: #2563eb;
      font-family: monospace, sans-serif;
      font-size: 14px;
      font-weight: 700;
    }
    .progress-bg {
      background: #f1f5f9;
      border-radius: 9999px;
      height: 8px;
      width: 100%;
      overflow: hidden;
    }
    .progress-bar {
      background: #2563eb;
      height: 100%;
      border-radius: 9999px;
      width: ${(remainingSeconds / 30) * 100}%;
      -webkit-transition: width 1s linear;
      transition: width 1s linear;
    }
    .footer-badge {
      margin-top: 18px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      font-size: 11px;
      color: #94a3b8;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
    }
    .dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      margin-right: 6px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Inseoul Attendance</div>
    <div class="subtitle">Giriş-Çıkış / 출퇴근 QR 코드</div>

    <div class="qr-box">
      <img src="${qrDataUrl}" alt="QR Code" class="qr-img" />
    </div>

    <div class="progress-container">
      <div class="timer-info">
        <span>Otomatik Yenileme / 자동 갱신</span>
        <span id="timer-text" class="timer-text">${remainingSeconds}s</span>
      </div>
      <div class="progress-bg">
        <div id="timer-bar" class="progress-bar"></div>
      </div>
    </div>

    <div class="footer-badge">
      <span class="dot"></span>
      <span>30초마다 보안 QR이 자동 갱신됩니다</span>
    </div>
  </div>

  <script>
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
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
