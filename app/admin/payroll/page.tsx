"use client";

import { useState } from "react";
import { Download, Calculator, Calendar } from "lucide-react";

// --- UI 시연을 위한 임시 목업 데이터 ---
const MOCK_PAYROLL_DATA = [
  {
    employeeId: "emp-001",
    employeeName: "Ahmet Yılmaz",
    totalWorkHours: 65.5,
    basePay: 6550,
    weeklyHolidayAllowance: 1310,
    totalPay: 7860
  },
  {
    employeeId: "emp-002",
    employeeName: "Mehmet Demir",
    totalWorkHours: 32.0,
    basePay: 3200,
    weeklyHolidayAllowance: 0,
    totalPay: 3200
  }
];

export default function PayrollPage() {
  const [yearMonth, setYearMonth] = useState("2026-08");
  const [isDownloading, setIsDownloading] = useState(false);

  // 엑셀(CSV) 다운로드 핸들러
  const handleDownloadCSV = () => {
    setIsDownloading(true);
    
    // CSV 헤더
    let csvContent = "Personel Adı,Çalışma Tarihi,Giriş,Çıkış,Mola Süresi (dk),Fiili Çalışma Süresi,Saatlik Ücret,Hesaplanan Tutar\n";
    
    // UI 기능 시연용 임시 텍스트
    csvContent += "Ahmet Yılmaz,2026-08-01,09:00:00,18:00:00,60,8.0,100,800\n";
    csvContent += "Ahmet Yılmaz,2026-08-02,09:00:00,14:00:00,0,5.0,100,500\n";

    // BOM 추가 (한글 깨짐 방지 / UTF-8 지원)
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
              disabled={isDownloading}
              className="flex items-center px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 shadow-sm"
            >
              <Download className="w-5 h-5 mr-2" />
              {isDownloading ? "İndiriliyor..." : "CSV İndir"}
            </button>
          </div>
        </div>

        {/* 직원별 급여 요약 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Personel Bazlı Maaş Özeti ({yearMonth})</h3>
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
                {MOCK_PAYROLL_DATA.map((payroll) => (
                  <tr key={payroll.employeeId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-5 font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {payroll.employeeName.charAt(0)}
                      </div>
                      {payroll.employeeName}
                    </td>
                    <td className="p-5 text-right text-gray-600 font-medium">
                      {payroll.totalWorkHours} saat
                    </td>
                    <td className="p-5 text-right text-gray-600">
                      {payroll.basePay.toLocaleString()} TL
                    </td>
                    <td className="p-5 text-right text-gray-600">
                      {payroll.weeklyHolidayAllowance > 0 
                        ? <span className="text-green-600 font-medium">+{payroll.weeklyHolidayAllowance.toLocaleString()} TL</span>
                        : <span className="text-gray-400">0 TL</span>
                      }
                    </td>
                    <td className="p-5 text-right font-bold text-lg text-blue-600">
                      {payroll.totalPay.toLocaleString()} TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
