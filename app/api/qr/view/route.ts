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
  const qrDataUrl = await generateQRCodeDataUrl(landingUrl, 400);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="refresh" content="${remainingSeconds}">
  <title>Attendance QR</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      overflow: hidden;
    }
    .qr-container {
      width: 320px;
      height: 320px;
      max-width: 90vw;
      max-height: 90vh;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      padding: 10px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #f1f5f9;
    }
    .qr-image {
      width: 100%;
      height: 100%;
      display: block;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  </style>
</head>
<body>
  <div class="qr-container">
    <img src="${qrDataUrl}" alt="QR Code" class="qr-image" />
  </div>

  <script>
    setTimeout(function() {
      window.location.reload();
    }, ${remainingSeconds * 1000});
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
