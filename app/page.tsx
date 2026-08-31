"use client";

import { useState, useEffect } from "react";
import { LogIn, LogOut, ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";
import type { Employee } from "@/types";

const translations = {
  tr: {
    title: "Giriş-Çıkış Kaydı",
    subtitle: "Mağaza QR Tarandı",
    langBtn: "Türkçe",
    selectLabel: "Personel Seçimi",
    selectPlaceholder: "personeli seçin",
    pinLabel: "PIN Kodu",
    pinPlaceholder: "****",
    clockInBtn: "Giriş Yap 🟢",
    clockOutBtn: "Çıkış Yap 🔴",
    qrRequiredTitle: "QR Kod Taraması Gerekli",
    qrRequiredDesc: "Lütfen restorandaki tablette gösterilen güncel QR kodunu cep telefonunuzun kamerasıyla taratarak bu sayfaya giriş yapın.",
    qrInvalidTitle: "Geçersiz veya Süresi Dolan QR Kod",
    qrInvalidDesc: "Okuttuğunuz QR kodunun süresi dolmuş veya geçersiz. Lütfen tabletten yeni QR kodunu tekrar okutun.",
    checkingQr: "Güvenli QR kod doğrulanıyor...",
    pleaseSelect: "Lütfen bir personel seçin.",
    enterPin: "Lütfen 4 haneli PIN kodunu girin.",
    successMsg: "İşlem başarıyla tamamlandı.",
    connError: "Sunucu bağlantısı başarısız oldu.",
  },
  ko: {
    title: "출퇴근 기록기",
    subtitle: "매장 실시간 QR 인증 완료",
    langBtn: "한국어",
    selectLabel: "직원 선택",
    selectPlaceholder: "본인의 이름을 선택해주세요",
    pinLabel: "PIN 코드",
    pinPlaceholder: "****",
    clockInBtn: "출근 등록 🟢",
    clockOutBtn: "퇴근 등록 🔴",
    qrRequiredTitle: "실시간 QR 코드 스캔 필요",
    qrRequiredDesc: "대리 출퇴근 방지를 위해 매장 내 태블릿에 표시된 실시간 QR 코드를 스캔하여 접속해 주세요.",
    qrInvalidTitle: "유효하지 않거나 만료된 QR 코드",
    qrInvalidDesc: "스캔하신 QR 코드의 보안 유효 기간이 만료되었습니다. 태블릿의 새로운 QR 코드를 다시 스캔해 주세요.",
    checkingQr: "보안 QR 코드를 검증하고 있습니다...",
    pleaseSelect: "직원을 선택해 주세요.",
    enterPin: "4자리 PIN 코드를 입력해 주세요.",
    successMsg: "출퇴근 처리가 성공적으로 완료되었습니다.",
    connError: "서버 연결에 실패했습니다.",
  }
};

export default function AttendancePage() {
  const [lang, setLang] = useState<"tr" | "ko">("tr");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // QR 검증 상태
  const [checkingQr, setCheckingQr] = useState(true);
  const [isQrVerified, setIsQrVerified] = useState(false);
  const [qrErrorType, setQrErrorType] = useState<"none" | "invalid" | "conn">("none");

  // 성공 안내 화면 상태
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    name: string;
    action: 'clock_in' | 'clock_out';
    time: string;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState("");
  const t = translations[lang];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const trOffsetMs = 3 * 60 * 60 * 1000;
      const trTime = new Date(now.getTime() + trOffsetMs);
      const timeStr = `${String(trTime.getUTCHours()).padStart(2, '0')}:${String(trTime.getUTCMinutes()).padStart(2, '0')}:${String(trTime.getUTCSeconds()).padStart(2, '0')}`;
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem("admin_lang");
    if (savedLang === "ko" || savedLang === "tr") {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    // 1. 직원 목록 가져오기
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) setEmployees(data.employees);
      })
      .catch((err) => console.error(err));

    // 2. URL 토큰 검증 (컴포넌트 마운트 시 1회만 수행)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      setCheckingQr(true);
      fetch("/api/qr/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsQrVerified(true);
            // 토큰이 복사되어 공유되지 않도록 주소창에서 토큰 쿼리 매개변수 제거
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setQrErrorType("invalid");
          }
        })
        .catch(() => {
          setQrErrorType("conn");
        })
        .finally(() => {
          setCheckingQr(false);
        });
    } else {
      setCheckingQr(false);
    }
  }, []);

  // 성공 안내 화면 자동 닫기 및 QR 검증 상태 파기 타이머 (5초)
  useEffect(() => {
    if (!showSuccessScreen) return;

    const timer = setTimeout(() => {
      setIsQrVerified(false);
      setShowSuccessScreen(false);
      setSuccessDetails(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showSuccessScreen]);

  const handleLangToggle = () => {
    const nextLang = lang === "tr" ? "ko" : "tr";
    setLang(nextLang);
    localStorage.setItem("admin_lang", nextLang);
  };

  const handleSuccessClose = () => {
    setIsQrVerified(false);
    setShowSuccessScreen(false);
    setSuccessDetails(null);
  };

  const handleAction = async (action: 'clock_in' | 'clock_out') => {
    if (!selectedEmployeeId) {
      setMessage({ text: t.pleaseSelect, type: "error" });
      return;
    }
    if (pinCode.length !== 4) {
      setMessage({ text: t.enterPin, type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployeeId, pinCode, action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Bir hata oluştu.", type: "error" });
      } else {
        const emp = employees.find(e => e.id === selectedEmployeeId);
        const empName = emp ? emp.name : "";

        // 성공 화면용 현재 터키 시각 포맷팅 (HH:MM:SS)
        const now = new Date();
        const trOffsetMs = 3 * 60 * 60 * 1000;
        const trTime = new Date(now.getTime() + trOffsetMs);
        const timeStr = `${String(trTime.getUTCHours()).padStart(2, '0')}:${String(trTime.getUTCMinutes()).padStart(2, '0')}:${String(trTime.getUTCSeconds()).padStart(2, '0')}`;

        setSuccessDetails({
          name: empName,
          action: action,
          time: timeStr
        });
        setShowSuccessScreen(true);
        setPinCode("");
        setSelectedEmployeeId("");
        setMessage({ text: "", type: "" });
      }
    } catch (error) {
      setMessage({ text: t.connError, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 1. QR 검증 진행중 화면
  if (checkingQr) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 font-semibold">{t.checkingQr}</p>
        </div>
      </div>
    );
  }

  // 2. QR 검증 실패 또는 미스캔 차단 화면
  if (!isQrVerified && !showSuccessScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
          <div className="bg-red-50 p-6 text-center border-b border-red-100 flex flex-col items-center">
            <ShieldAlert className="w-12 h-12 text-red-600 mb-2" />
            <h2 className="text-xl font-bold text-red-800">
              {qrErrorType === "invalid" ? t.qrInvalidTitle : t.qrRequiredTitle}
            </h2>
          </div>
          <div className="p-6 space-y-6 text-center">
            <p className="text-gray-600 leading-relaxed">
              {qrErrorType === "invalid"
                ? t.qrInvalidDesc
                : qrErrorType === "conn"
                  ? t.connError
                  : t.qrRequiredDesc}
            </p>
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLangToggle}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl border border-gray-200"
              >
                🌐 {lang === "tr" ? "Türkçe" : "한국어"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. 출퇴근 성공 안내 화면
  if (showSuccessScreen && successDetails) {
    const isClockIn = successDetails.action === 'clock_in';
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-green-100 p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
              <ShieldCheck className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {lang === 'tr' ? 'İşlem Başarılı' : '처리가 완료되었습니다'}
            </h2>
            <p className="text-gray-500 font-medium">
              {isClockIn
                ? (lang === 'tr' ? 'Giriş kaydınız oluşturuldu.' : '출근 등록이 완료되었습니다.')
                : (lang === 'tr' ? 'Çıkış kaydınız oluşturuldu.' : '퇴근 등록이 완료되었습니다.')}
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">{lang === 'tr' ? 'Personel' : '직원명'}</span>
              <span className="text-gray-800 font-bold">{successDetails.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">{lang === 'tr' ? 'İşlem' : '구분'}</span>
              <span className={`font-bold ${isClockIn ? 'text-green-600' : 'text-red-600'}`}>
                {isClockIn
                  ? (lang === 'tr' ? 'Giriş 🟢' : '출근 🟢')
                  : (lang === 'tr' ? 'Çıkış 🔴' : '퇴근 🔴')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">{lang === 'tr' ? 'Saat' : '기록 시각'}</span>
              <span className="text-gray-800 font-bold">{successDetails.time}</span>
            </div>
          </div>

          <button
            onClick={handleSuccessClose}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-green-100"
          >
            {lang === 'tr' ? 'Tamam (Kapat)' : '확인 (닫기)'}
          </button>
        </div>
      </div>
    );
  }

  // 4. 정상 접속 및 출퇴근 등록 화면
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-50">

        {/* 헤더 및 언어 전환 */}
        <div className="bg-blue-600 p-6 text-center text-white relative">
          <button
            onClick={handleLangToggle}
            className="absolute top-4 right-4 text-[10px] bg-blue-700 hover:bg-blue-800 text-white font-bold px-2 py-1 rounded border border-blue-500 shadow-sm"
          >
            🌐 {lang === "tr" ? "TR" : "KR"}
          </button>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          {/* 실시간 시각 표시 (터키 현지 기준) */}
          {currentTime && (
            <div className="text-2xl font-mono font-bold mt-2 tracking-wider text-green-300 drop-shadow-sm">
              {currentTime}
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5 opacity-80 mt-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.subtitle}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">{t.selectLabel}</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white text-gray-800"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">{t.selectPlaceholder}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">{t.pinLabel}</label>
            <input
              type="password"
              maxLength={4}
              placeholder={t.pinPlaceholder}
              className="w-full p-4 text-center text-3xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              disabled={loading}
              onClick={() => handleAction('clock_in')}
              className="flex flex-col items-center justify-center py-4 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <LogIn className="w-8 h-8 mb-2" />
              <span className="font-bold text-lg">{t.clockInBtn}</span>
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction('clock_out')}
              className="flex flex-col items-center justify-center py-4 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-8 h-8 mb-2" />
              <span className="font-bold text-lg">{t.clockOutBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
