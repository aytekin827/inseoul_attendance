"use client";

import { useState, useEffect, useRef } from "react";

export default function QRDisplayPage() {
  const [token, setToken] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchToken = async () => {
    try {
      const res = await fetch(`/api/qr/generate?t=${Date.now()}`);
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        return data.remainingSeconds ?? 30;
      }
    } catch (e) {
      console.error("Token fetch error:", e);
    }
    return 30;
  };

  // 토큰 갱신 주기를 서버의 30초 절대 경계 시간에 일치시킵니다.
  useEffect(() => {
    setBaseUrl(window.location.origin);

    const setupSync = async () => {
      // 1단계: 즉시 첫 번째 토큰을 받아와 남은 시간(초)을 구함
      const remainingSeconds = await fetchToken();

      // 2단계: 남은 시간(초)이 다 흐르면(서버의 30초 경계면) 동기화 구동
      timeoutRef.current = setTimeout(async () => {
        await fetchToken();

        // 3단계: 이후 정확히 30초 간격으로 서버에서 신규 토큰 요청
        intervalRef.current = setInterval(async () => {
          await fetchToken();
        }, 30000);
      }, remainingSeconds * 1000);
    };

    setupSync();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const landingUrl = token && baseUrl ? `${baseUrl}?token=${token}` : "";
  const qrUrl = landingUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(landingUrl)}`
    : "";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* QR 코드 영역 */}
      <div className="w-[320px] h-[320px] bg-white rounded-3xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-xl relative">
        {qrUrl ? (
          <img src={qrUrl} alt="QR Code" className="w-[300px] h-[300px] object-contain" />
        ) : (
          <div className="text-gray-400 text-sm animate-pulse">Loading...</div>
        )}
      </div>
    </div>
  );
}
