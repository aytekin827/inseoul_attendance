"use client";

import { useState, useEffect, useRef } from "react";

export default function QRDisplayPage() {
  const [token, setToken] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [baseUrl, setBaseUrl] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchToken = async () => {
    try {
      const res = await fetch("/api/qr/generate");
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

  // 1초 단위 로컬 카운트다운 타이머
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  // 토큰 갱신 주기를 서버의 30초 절대 경계 시간(NTP 동기화)에 일치시킵니다.
  useEffect(() => {
    setBaseUrl(window.location.origin);

    const setupSync = async () => {
      // 1단계: 즉시 첫 번째 토큰을 받아와 남은 시간(예: 14초)을 구함
      const remainingSeconds = await fetchToken();
      setRemaining(remainingSeconds);

      // 2단계: 남은 시간(초)이 다 흐르면(서버의 30초 경계면) 동기화 구동
      timeoutRef.current = setTimeout(async () => {
        const nextRemaining = await fetchToken();
        setRemaining(nextRemaining);

        // 3단계: 이후 정확히 30초 간격으로 서버에서 신규 토큰 요청
        intervalRef.current = setInterval(async () => {
          const tickRemaining = await fetchToken();
          setRemaining(tickRemaining);
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
      <div className="flex flex-col items-center space-y-4">
        {/* QR 코드 영역 */}
        <div className="w-[320px] h-[320px] bg-white rounded-3xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-xl relative">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-[300px] h-[300px] object-contain" />
          ) : (
            <div className="text-gray-400 text-sm animate-pulse">Loading...</div>
          )}
        </div>

        {/* 30초 실시간 게이지 바 */}
        <div className="w-[320px]">
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(remaining / 30) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
