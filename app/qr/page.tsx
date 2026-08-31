"use client";

import { useState, useEffect } from "react";

export default function QRDisplayPage() {
  const [token, setToken] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [baseUrl, setBaseUrl] = useState("");

  const fetchToken = async () => {
    try {
      const res = await fetch("/api/qr/generate");
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch (e) {
      console.error("Token fetch error:", e);
    }
  };

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetchToken();

    // 30초 간격으로 서버에 새로운 토큰 요청 및 로컬 카운트다운 리셋
    const fetchInterval = setInterval(() => {
      fetchToken();
      setRemaining(30);
    }, 30000);

    return () => clearInterval(fetchInterval);
  }, []);

  // 1초 단위 로컬 카운트다운 타이머 (서버 시간 오차 문제 해결)
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(countdownTimer);
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
