"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const translations = {
  tr: {
    title: "İnistanbul Restoran",
    subtitle: "Personel Giriş-Çıkış QR Sistemi",
    instructions: "Lütfen cep telefonunuzun kamerasıyla bu QR kodunu taratarak 출퇴근(giriş-çıkış) sayfasına bağlanın.",
    warning: "Bu QR kod güvenlik nedeniyle her 30 saniyede bir otomatik olarak yenilenir. Ekran görüntüsü veya eski kodlar çalışmayacaktır.",
    refreshBtn: "QR Kodu Yenile",
    nextRefresh: "Yeni kodun üretilmesine kalan süre: {seconds} saniye"
  },
  ko: {
    title: "인서울 식당",
    subtitle: "직원 출퇴근 전용 실시간 QR 시스템",
    instructions: "휴대폰 카메라로 아래 QR 코드를 스캔하여 출퇴근 기록 페이지에 접속해 주세요.",
    warning: "본 QR 코드는 대리 출퇴근 방지를 위해 30초마다 자동으로 갱신됩니다. 촬영한 사진이나 이전 링크는 사용할 수 없습니다.",
    refreshBtn: "QR코드 강제 갱신",
    nextRefresh: "QR코드 갱신까지 남은 시간: {seconds}초"
  }
};

export default function QRDisplayPage() {
  const [lang, setLang] = useState<"tr" | "ko">("tr");
  const [token, setToken] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [baseUrl, setBaseUrl] = useState("");

  const t = translations[lang];

  useEffect(() => {
    setBaseUrl(window.location.origin);
    const savedLang = localStorage.getItem("admin_lang");
    if (savedLang === "ko" || savedLang === "tr") {
      setLang(savedLang);
    }
  }, []);

  const fetchToken = async () => {
    try {
      const res = await fetch("/api/qr/generate");
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setRemaining(data.remainingSeconds || 30);
      }
    } catch (e) {
      console.error("Token fetch error:", e);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  // 1초마다 카운트다운 관리 및 자동 갱신
  useEffect(() => {
    if (remaining <= 0) {
      fetchToken();
      return;
    }

    const timer = setTimeout(() => {
      setRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining]);

  const handleLangToggle = () => {
    const nextLang = lang === "tr" ? "ko" : "tr";
    setLang(nextLang);
    localStorage.setItem("admin_lang", nextLang);
  };

  const landingUrl = token && baseUrl ? `${baseUrl}?token=${token}` : "";
  const qrUrl = landingUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(landingUrl)}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-between p-6">
      
      {/* 상단 헤더 영역 */}
      <header className="w-full max-w-lg flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t.title}</h1>
          <p className="text-xs text-gray-500 font-medium">{t.subtitle}</p>
        </div>
        <button 
          onClick={handleLangToggle}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-2 rounded-xl transition-colors border border-blue-100"
        >
          🌐 {lang === "tr" ? "Türkçe" : "한국어"}
        </button>
      </header>

      {/* 중앙 QR 영역 */}
      <main className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center space-y-6 my-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-gray-600">{t.instructions}</p>
        </div>

        {/* QR 코드 박스 */}
        <div className="w-[300px] h-[300px] bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner relative">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-[280px] h-[280px] object-contain transition-opacity duration-300" />
          ) : (
            <div className="text-gray-400 text-sm animate-pulse">QR 코드 생성 중...</div>
          )}
        </div>

        {/* 실시간 갱신 진행률 표시줄 */}
        <div className="w-full space-y-2">
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(remaining / 30) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs font-semibold text-blue-600">
            {t.nextRefresh.replace("{seconds}", String(remaining))}
          </p>
        </div>
      </main>

      {/* 하단 정보 및 수동 갱신 영역 */}
      <footer className="w-full max-w-lg space-y-4 text-center">
        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
          ⚠️ {t.warning}
        </p>
        <button 
          onClick={fetchToken}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t.refreshBtn}
        </button>
      </footer>

    </div>
  );
}
