"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Calculator, Calendar, ArrowLeft } from "lucide-react";
import { calculateMonthlyPayroll, calculateWorkHours, PayrollSummary } from "@/lib/payroll";
import type { Employee, AttendanceRecord } from "@/types";
import { getTurkeyDateString } from "@/lib/time";
import * as XLSX from "xlsx";

type RecordWithEmployee = AttendanceRecord & {
  employees: {
    name: string;
    hourly_rate: number;
    yol_parasi?: number;
  };
};

const translations = {
  tr: {
    backBtn: "Yönetici Paneline Geri Dön",
    title: "Maaş Hesaplama ve Yönetim",
    subtitle: "Personel bazlı çalışma saatleri, hafta tatili (주휴수당), yol parası ve resmi tatil ücretinin hesaplanması",
    downloadBtn: "Excel İndir",
    downloading: "İndiriliyor...",
    tableTitle: "Personel Bazlı Maaş Özeti",
    activeCount: "Fiili Çalışan Personel Sayısı:",
    calculating: "Hesaplanıyor...",
    noRecords: "Bu aya ait çalışma kaydı veya hesaplanacak maaş bulunamadı.",
    
    // Columns
    colName: "Personel Adı",
    colNormalHours: "Normal Çalışma (≤45sa)",
    colOvertimeHours: "Fazla Mesai (>45sa)",
    colTotalHours: "Toplam Süre",
    colBasePay: "Normal Mesai Ücreti",
    colOvertimePay: "Fazla Mesai Ücreti",
    colHolidayAllowance: "Haftalık Tatil Ücreti",
    colYolParasi: "Yol Parası",
    colHolidayHours: "Resmi Tatil Çalışma",
    colHolidayPay: "Resmi Tatil Ek Ödeme",
    colTotalPay: "Toplam Ödenecek",
    colWorkedDays: "Çalışılan Gün",
    
    // Auth Gate
    authTitle: "Yönetici Girişi",
    authSubtitle: "Lütfen yönetici şifresini girin",
    authPlaceholder: "Şifre",
    authError: "Geçersiz şifre!",
    authConnError: "Bağlantı hatası!",
    authLogin: "Giriş Yap",
  },
  ko: {
    backBtn: "관리자 패널로 돌아가기",
    title: "급여 정산 및 관리",
    subtitle: "직원별 주 45시간 기본/연장근무 분할, 주휴수당, 교통비(욜파라) 및 국경일 2배수 급여 자동 산정",
    downloadBtn: "Excel 다운로드",
    downloading: "다운로드 중...",
    tableTitle: "직원별 급여 정산 요약",
    activeCount: "급여 대상 직원 수:",
    calculating: "계산 중...",
    noRecords: "이번 달 근태 기록 또는 정산할 급여 내역이 없습니다.",
    
    // Columns
    colName: "직원 이름",
    colNormalHours: "기본 근무 (주 45h 이하)",
    colOvertimeHours: "연장 근무 (주 45h 초과)",
    colTotalHours: "총 근무시간",
    colBasePay: "기본급",
    colOvertimePay: "연장 근로 수당",
    colHolidayAllowance: "주휴수당",
    colYolParasi: "교통비 (욜파라)",
    colHolidayHours: "국경일 근무시간",
    colHolidayPay: "국경일 추가 수당 (1배)",
    colTotalPay: "최종 지급액",
    colWorkedDays: "근무 일수",
    
    // Auth Gate
    authTitle: "관리자 로그인",
    authSubtitle: "관리자 비밀번호를 입력해주세요",
    authPlaceholder: "비밀번호",
    authError: "비밀번호가 올바르지 않습니다!",
    authConnError: "연결 오류!",
    authLogin: "로그인",
  }
};

export default function PayrollPage() {
  const [lang, setLang] = useState<"tr" | "ko">("tr");
  const [yearMonth, setYearMonth] = useState(() => {
    return getTurkeyDateString().slice(0, 7);
  });
  
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [rawRecords, setRawRecords] = useState<RecordWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("admin_authenticated") === "true") {
      setIsAuthenticated(true);
    }
    const savedLang = localStorage.getItem("admin_lang");
    if (savedLang === "ko" || savedLang === "tr") {
      setLang(savedLang);
    }
  }, []);

  const handleLangToggle = () => {
    const nextLang = lang === "tr" ? "ko" : "tr";
    setLang(nextLang);
    localStorage.setItem("admin_lang", nextLang);
  };

  const t = translations[lang];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", password: authPassword })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("admin_authenticated", "true");
        setIsAuthenticated(true);
      } else {
        setAuthError(t.authError);
      }
    } catch (err) {
      setAuthError(t.authConnError);
    }
  };

  // 급여 데이터 연산
  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    try {
      const empRes = await fetch("/api/employees?all=true");
      const empData = await empRes.json();
      const employees: Employee[] = empData.employees || [];

      const attRes = await fetch(`/api/attendance?yearMonth=${yearMonth}`);
      const attData = await attRes.json();
      const records: RecordWithEmployee[] = attData.records || [];
      
      setRawRecords(records);

      const summaries = calculateMonthlyPayroll(employees, records);
      // 근무시간이 조금이라도 있는 직원을 요약
      setPayrollSummaries(summaries.filter(s => s.totalWorkHours > 0));
    } catch (e) {
      console.error("Payroll calculation error:", e);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPayrollData();
    }
  }, [loadPayrollData, isAuthenticated]);

  // 엑셀(.xlsx) 다운로드 핸들러
  const handleDownloadExcel = () => {
    if (payrollSummaries.length === 0) {
      alert(t.noRecords);
      return;
    }

    setIsDownloading(true);

    const excelData = payrollSummaries.map(payroll => {
      const hourlyRate = rawRecords.find(r => r.employee_id === payroll.employeeId)?.employees?.hourly_rate || 0;
      
      if (lang === "ko") {
        return {
          "직원 이름": payroll.employeeName,
          "근무 일수": payroll.workedDaysCount,
          "기본 근무시간 (주 45h 이하)": payroll.normalWorkHours,
          "연장 근무시간 (주 45h 초과)": payroll.overtimeWorkHours,
          "총 근무시간": payroll.totalWorkHours,
          "시급 (TL)": hourlyRate,
          "기본급 (TL)": payroll.basePay,
          "연장 근로 수당 (TL)": payroll.overtimePay,
          "주휴수당 (TL)": payroll.weeklyHolidayAllowance,
          "교통비 (TL)": payroll.yolParasi,
          "국경일 근무시간": payroll.holidayWorkHours,
          "국경일 추가 수당 (TL)": payroll.holidayAdditionalPay,
          "최종 지급액 (TL)": payroll.totalPay
        };
      } else {
        return {
          "Personel Adı": payroll.employeeName,
          "Çalışılan Gün": payroll.workedDaysCount,
          "Normal Çalışma (≤45sa)": payroll.normalWorkHours,
          "Fazla Mesai (>45sa)": payroll.overtimeWorkHours,
          "Toplam Süre": payroll.totalWorkHours,
          "Saatlik Ücret (TL)": hourlyRate,
          "Normal Mesai Ücreti (TL)": payroll.basePay,
          "Fazla Mesai Ücreti (TL)": payroll.overtimePay,
          "Haftalık Tatil Ücreti (TL)": payroll.weeklyHolidayAllowance,
          "Yol Parası (TL)": payroll.yolParasi,
          "Resmi Tatil Çalışma": payroll.holidayWorkHours,
          "Resmi Tatil Ek Ödeme (TL)": payroll.holidayAdditionalPay,
          "Toplam Ödenecek (TL)": payroll.totalPay
        };
      }
    });

    try {
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, lang === "ko" ? "급여 정산" : "Maaş Detayı");
      
      const maxLens = Object.keys(excelData[0]).map(key => {
        return Math.max(key.length * 2, ...excelData.map(row => String((row as any)[key]).length));
      });
      worksheet["!cols"] = maxLens.map(len => ({ wch: len + 3 }));

      XLSX.writeFile(workbook, lang === "ko" ? `Geupyeo_Jeongsan_${yearMonth}.xlsx` : `Maas_Detayi_${yearMonth}.xlsx`);
    } catch (error) {
      console.error("Excel generation error:", error);
      alert(lang === "ko" ? "엑셀 파일을 생성하는 중 오류가 발생했습니다." : "Excel dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800">{t.authTitle}</h2>
              <p className="text-xs text-gray-500 mt-1">{t.authSubtitle}</p>
            </div>
            <button 
              onClick={handleLangToggle}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm whitespace-nowrap"
            >
              🌐 {lang === "tr" ? "Türkçe" : "한국어"}
            </button>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input 
              type="password" 
              placeholder={t.authPlaceholder} 
              value={authPassword} 
              onChange={(e) => setAuthPassword(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg outline-none" 
            />
            {authError && <p className="text-red-500 text-sm text-center font-medium">{authError}</p>}
            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">{t.authLogin}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Back Link and Lang Selector */}
        <div className="flex justify-between items-center">
          <a href="/admin" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t.backBtn}
          </a>
          <button 
            onClick={handleLangToggle}
            className="text-xs bg-white hover:bg-gray-50 text-gray-700 font-bold px-3 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            🌐 {lang === "tr" ? "Türkçe" : "한국어"}
          </button>
        </div>

        {/* Header and Filter area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{t.title}</h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <input 
                type="month" 
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium outline-none w-full"
              />
            </div>
            <button 
              onClick={handleDownloadExcel}
              disabled={isDownloading || loading}
              className="flex items-center justify-center px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? t.downloading : t.downloadBtn}
            </button>
          </div>
        </div>

        {/* Summary Table or Card view */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-800">{t.tableTitle} ({yearMonth})</h3>
            <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto">
              {t.activeCount} {payrollSummaries.length}
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-600">{t.colName}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-center">{t.colWorkedDays}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-right">{t.colNormalHours}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-right">{t.colOvertimeHours}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-right">{t.colTotalHours}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-right">{t.colBasePay}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-right">{t.colOvertimePay}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-right">{t.colHolidayAllowance}</th>
                  <th className="p-4 text-xs font-bold text-gray-600 text-right">{t.colYolParasi}</th>
                  <th className="p-4 text-xs font-bold text-orange-600 text-right">{t.colHolidayHours}</th>
                  <th className="p-4 text-xs font-bold text-orange-600 text-right">{t.colHolidayPay}</th>
                  <th className="p-4 text-xs font-bold text-gray-800 text-right">{t.colTotalPay}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-500">{t.calculating}</td>
                  </tr>
                ) : payrollSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-500">{t.noRecords}</td>
                  </tr>
                ) : (
                  payrollSummaries.map((payroll) => (
                    <tr key={payroll.employeeId} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {payroll.employeeName.charAt(0)}
                        </div>
                        {payroll.employeeName}
                      </td>
                      <td className="p-4 text-center text-gray-600 font-semibold">{payroll.workedDaysCount} gün</td>
                      <td className="p-4 text-right text-gray-600 font-medium font-mono">{payroll.normalWorkHours} sa</td>
                      <td className="p-4 text-right text-gray-600 font-medium font-mono">{payroll.overtimeWorkHours} sa</td>
                      <td className="p-4 text-right text-gray-800 font-bold font-mono">{payroll.totalWorkHours} sa</td>
                      <td className="p-4 text-right text-gray-600 font-mono">{payroll.basePay.toLocaleString()} TL</td>
                      <td className="p-4 text-right text-gray-600 font-mono">{payroll.overtimePay.toLocaleString()} TL</td>
                      <td className="p-4 text-right text-gray-600 font-mono">{payroll.weeklyHolidayAllowance.toLocaleString()} TL</td>
                      <td className="p-4 text-right text-gray-600 font-mono">{payroll.yolParasi.toLocaleString()} TL</td>
                      <td className="p-4 text-right text-orange-600 font-semibold font-mono">{payroll.holidayWorkHours} sa</td>
                      <td className="p-4 text-right text-orange-600 font-bold font-mono">
                        {payroll.holidayAdditionalPay > 0 ? `+${payroll.holidayAdditionalPay.toLocaleString()} TL` : "0 TL"}
                      </td>
                      <td className="p-4 text-right font-bold text-base text-blue-600 font-mono bg-blue-50/20">
                        {payroll.totalPay.toLocaleString()} TL
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block lg:hidden p-4 space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">{t.calculating}</div>
            ) : payrollSummaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t.noRecords}</div>
            ) : (
              payrollSummaries.map((payroll) => (
                <div key={payroll.employeeId} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {payroll.employeeName.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800 text-base">{payroll.employeeName}</span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 font-semibold">
                      {payroll.workedDaysCount} {lang === "tr" ? "gün" : "일 근무"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600 pt-2 border-t border-gray-50">
                    <div>{t.colNormalHours}: <span className="font-semibold text-gray-800">{payroll.normalWorkHours} sa</span></div>
                    <div>{t.colOvertimeHours}: <span className="font-semibold text-gray-800">{payroll.overtimeWorkHours} sa</span></div>
                    <div>{t.colBasePay}: <span className="font-semibold text-gray-800">{payroll.basePay.toLocaleString()} TL</span></div>
                    <div>{t.colOvertimePay}: <span className="font-semibold text-gray-800">{payroll.overtimePay.toLocaleString()} TL</span></div>
                    <div>{t.colHolidayAllowance}: <span className="font-semibold text-gray-800">{payroll.weeklyHolidayAllowance.toLocaleString()} TL</span></div>
                    <div>{t.colYolParasi}: <span className="font-semibold text-gray-800">{payroll.yolParasi.toLocaleString()} TL</span></div>
                    
                    {payroll.holidayWorkHours > 0 && (
                      <>
                        <div>{t.colHolidayHours}: <span className="font-semibold text-orange-600">{payroll.holidayWorkHours} sa</span></div>
                        <div>{t.colHolidayPay}: <span className="font-bold text-orange-600">+{payroll.holidayAdditionalPay.toLocaleString()} TL</span></div>
                      </>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-gray-50 flex justify-between items-center text-sm">
                    <span className="text-xs text-gray-400 font-medium">{t.colTotalPay}:</span>
                    <span className="font-bold text-blue-600 text-base">{payroll.totalPay.toLocaleString()} TL</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
