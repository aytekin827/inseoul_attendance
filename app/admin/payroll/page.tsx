"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Calculator, Calendar } from "lucide-react";
import { calculateMonthlyPayroll, calculateWorkHours, PayrollSummary } from "@/lib/payroll";
import type { Employee, AttendanceRecord } from "@/types";

type RecordWithEmployee = AttendanceRecord & {
  employees: {
    name: string;
    hourly_rate: number;
  };
};

export default function PayrollPage() {
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  }, []);

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
        setAuthError("Geçersiz şifre!");
      }
    } catch (err) {
      setAuthError("Bağlantı hatası!");
    }
  };


  // 급여 데이터 연산
  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 직원 전체 목록 가져오기 (비활성화 상태여도 이번 달 근무 기록이 있으면 급여를 정산해줘야 함)
      const empRes = await fetch("/api/employees?all=true");
      const empData = await empRes.json();
      const employees: Employee[] = empData.employees || [];

      // 2. 선택한 연/월의 근태 기록 가져오기
      const attRes = await fetch(`/api/attendance?yearMonth=${yearMonth}`);
      const attData = await attRes.json();
      const records: RecordWithEmployee[] = attData.records || [];
      
      setRawRecords(records);

      // 3. 비즈니스 로직(lib/payroll.ts)을 사용해 급여 정산 연산
      const summaries = calculateMonthlyPayroll(employees, records);
      
      // 근무 시간이 0시간보다 큰 직원만 정산 대상에 노출 (불필요한 무직원 제거)
      setPayrollSummaries(summaries.filter(s => s.totalWorkHours > 0));
    } catch (e) {
      console.error("Payroll calculation error:", e);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  // 엑셀(CSV) 다운로드 핸들러 (실제 데이터 반영)
  const handleDownloadCSV = () => {
    if (rawRecords.length === 0) {
      alert("Bu aya ait indirilecek çalışma kaydı bulunmamaktadır.");
      return;
    }

    setIsDownloading(true);
    
    // CSV 헤더 (터키어)
    let csvContent = "Personel Adı,Çalışma Tarihi,Giriş,Çıkış,Mola Süresi (dk),Fiili Çalışma Süresi,Saatlik Ücret,Hesaplanan Tutar\n";
    
    // 개별 근태 기록별 정산 데이터 행 추가
    rawRecords.forEach(rec => {
      const workHours = calculateWorkHours(rec.clock_in, rec.clock_out, rec.break_minutes);
      const hourlyRate = rec.employees?.hourly_rate || 0;
      const basePay = Math.floor(workHours * hourlyRate);

      const empName = rec.employees?.name || "Bilinmeyen Personel";
      const workDate = rec.work_date;
      const clockIn = new Date(rec.clock_in).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const clockOut = rec.clock_out 
        ? new Date(rec.clock_out).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : "-";
      const breakMins = rec.break_minutes;
      
      csvContent += `"${empName}","${workDate}","${clockIn}","${clockOut}",${breakMins},${workHours},${hourlyRate},${basePay}\n`;
    });

    // UTF-8 BOM 추가 (엑셀에서 한글 및 터키어 깨짐 방지)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Maas_Detayi_${yearMonth}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setIsDownloading(false), 500);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Yönetici Girişi</h2>
            <p className="text-sm text-gray-500 mt-1">Lütfen yönetici şifresini girin</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input 
              type="password" 
              placeholder="Şifre" 
              value={authPassword} 
              onChange={(e) => setAuthPassword(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg outline-none" 
            />
            {authError && <p className="text-red-500 text-sm text-center font-medium">{authError}</p>}
            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Giriş Yap</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* 헤더 및 필터 영역 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Maaş Hesaplama ve Yönetim</h2>
              <p className="text-gray-500 text-sm mt-1">Personel bazlı çalışma saatleri ve hafta tatili ücretinin otomatik hesaplanması</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <Calendar className="w-5 h-5 text-gray-500 mr-2" />
              <input 
                type="month" 
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium outline-none"
              />
            </div>
            <button 
              onClick={handleDownloadCSV}
              disabled={isDownloading || loading}
              className="flex items-center px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Download className="w-5 h-5 mr-2" />
              {isDownloading ? "İndiriliyor..." : "CSV İndir"}
            </button>
          </div>
        </div>

        {/* 직원별 급여 요약 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Personel Bazlı Maaş Özeti ({yearMonth})</h3>
            <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full border border-blue-100">
              Fiili Çalışan Personel Sayısı: {payrollSummaries.length}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-5 text-sm font-semibold text-gray-600">Personel Adı</th>
                  <th className="p-5 text-sm font-semibold text-gray-600 text-right">Fiili Çalışma Süresi</th>
                  <th className="p-5 text-sm font-semibold text-gray-600 text-right">Temel Maaş</th>
                  <th className="p-5 text-sm font-semibold text-gray-600 text-right">Hafta Tatili Ücreti</th>
                  <th className="p-5 text-sm font-bold text-gray-800 text-right">Toplam Ödenecek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Hesaplanıyor...</td>
                  </tr>
                ) : payrollSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Bu aya ait çalışma kaydı veya hesaplanacak maaş bulunamadı.</td>
                  </tr>
                ) : (
                  payrollSummaries.map((payroll) => (
                    <tr key={payroll.employeeId} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5 font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                          {payroll.employeeName.charAt(0)}
                        </div>
                        {payroll.employeeName}
                      </td>
                      <td className="p-5 text-right text-gray-600 font-medium font-mono">
                        {payroll.totalWorkHours} saat
                      </td>
                      <td className="p-5 text-right text-gray-600 font-mono">
                        {payroll.basePay.toLocaleString()} TL
                      </td>
                      <td className="p-5 text-right text-gray-600 font-mono">
                        {payroll.weeklyHolidayAllowance > 0 
                          ? <span className="text-green-600 font-semibold">+{payroll.weeklyHolidayAllowance.toLocaleString()} TL</span>
                          : <span className="text-gray-400">0 TL</span>
                        }
                      </td>
                      <td className="p-5 text-right font-bold text-lg text-blue-600 font-mono">
                        {payroll.totalPay.toLocaleString()} TL
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
