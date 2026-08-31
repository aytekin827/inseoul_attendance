"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, CalendarDays, Edit2, UserPlus, ToggleLeft, ToggleRight, Check, X, RefreshCw, Key, Menu } from "lucide-react";
import type { Employee, AttendanceRecord } from "@/types";

type RecordWithEmployee = AttendanceRecord & {
  employees: {
    name: string;
    hourly_rate: number;
    yol_parasi?: number;
  };
};

const translations = {
  tr: {
    title: "Yönetici Paneli",
    restaurantName: "inseoul Kore Restoran",
    // tabs
    recordsTab: "Aylık Çalışma Kayıtları",
    employeesTab: "Personel Yönetimi",
    changePw: "Şifre Değiştir",
    payrollBtn: "Maaş Hesaplama Ekranı",
    // auth gate
    authTitle: "Yönetici Girişi",
    authSubtitle: "Lütfen yönetici şifresini girin",
    authPlaceholder: "Şifre",
    authError: "Geçersiz şifre!",
    authConnError: "Bağlantı hatası!",
    authLogin: "Giriş Yap",
    // change pw modal
    changePwTitle: "Yönetici Şifresini Değiştir",
    currentPw: "Mevcut Şifre",
    newPw: "Yeni Şifre",
    newPwConfirm: "Yeni Şifre Tekrar",
    pwMismatch: "Yeni şifreler eşleşmiyor!",
    pwSuccess: "Şifre başarıyla güncellendi!",
    cancel: "İptal",
    save: "Kaydet",
    // Monthly Records Tab
    refresh: "Yenile",
    loading: "Yükleniyor...",
    monthlyTitle: "Aylık Çalışma Kayıtları",
    monthlySubtitle: "Geçmiş ve mevcut tüm çalışma logları",
    searchPlaceholder: "İsim ile ara...",
    statusFilterLabel: "Durum Filtresi",
    dateFilterLabel: "Tarih Filtresi",
    allStatus: "Tüm Durumlar",
    working: "Çalışıyor",
    completed: "Tamamlandı",
    noClockOut: "Çıkış Yapılmadı",
    tableDate: "Tarih",
    tableEmpName: "Personel Adı",
    tableClockIn: "Giriş Saati",
    tableClockOut: "Çıkış Saati",
    tableBreak: "Mola (Dk)",
    tableStatus: "Durum",
    tableActions: "Yönetim",
    editBtn: "Düzenle",
    recordNotFound: "Kayıt bulunamadı.",
    notes: "Not",
    // Edit Modal
    editRecordTitle: "Çalışma Kaydını Düzenle",
    employeeLabel: "Personel",
    dateLabel: "Tarih",
    breakLabel: "Mola (dk)",
    clockInLabel: "Giriş Tarihi & Saati",
    clockOutLabel: "Çıkış Tarihi & Saati",
    statusLabel: "Çalışma Durumu",
    notesLabel: "Not",
    // Employee Management Tab
    empTitle: "Personel Yönetimi",
    empSubtitle: "Tüm restoran kadrosunun listesi",
    addEmpBtn: "Yeni Personel Ekle",
    tablePin: "PIN Kodu",
    tableHourlyRate: "Saatlik Ücret",
    tableYolParasi: "Günlük Yol Parası",
    activeBadge: "Aktif",
    passiveBadge: "Pasif",
    noEmployees: "Kayıtlı personel bulunmuyor.",
    // Add Employee Modal
    addEmpTitle: "Yeni Personel Ekle",
    editEmpTitle: "Personel Düzenle",
    empNameLabel: "Personel Adı",
    pinLabel: "PIN Kodu (4 Hane)",
    hourlyRateLabel: "Saatlik Ücret (TL)",
    yolParasiLabel: "Günlük Yol Parası (TL)",
  },
  ko: {
    title: "관리자 패널",
    restaurantName: "인서울 한식당",
    // tabs
    recordsTab: "월별 근태 기록",
    employeesTab: "직원 관리",
    changePw: "비밀번호 변경",
    payrollBtn: "급여 정산 화면",
    // auth gate
    authTitle: "관리자 로그인",
    authSubtitle: "관리자 비밀번호를 입력해주세요",
    authPlaceholder: "비밀번호",
    authError: "비밀번호가 올바르지 않습니다!",
    authConnError: "연결 오류!",
    authLogin: "로그인",
    // change pw modal
    changePwTitle: "관리자 비밀번호 변경",
    currentPw: "현재 비밀번호",
    newPw: "새 비밀번호",
    newPwConfirm: "새 비밀번호 확인",
    pwMismatch: "새 비밀번호가 일치하지 않습니다!",
    pwSuccess: "비밀번호가 성공적으로 변경되었습니다!",
    cancel: "취소",
    save: "저장",
    // Monthly Records Tab
    refresh: "새로고침",
    loading: "로딩 중...",
    monthlyTitle: "월별 근태 기록",
    monthlySubtitle: "과거 및 현재의 모든 근태 기록",
    searchPlaceholder: "이름으로 검색...",
    statusFilterLabel: "상태 필터",
    dateFilterLabel: "날짜 필터",
    allStatus: "모든 상태",
    working: "근무 중",
    completed: "정상 퇴근",
    noClockOut: "퇴근 미입력",
    tableDate: "날짜",
    tableEmpName: "직원 이름",
    tableClockIn: "출근 시간",
    tableClockOut: "퇴근 시간",
    tableBreak: "휴게시간(분)",
    tableStatus: "상태",
    tableActions: "관리",
    editBtn: "수정",
    recordNotFound: "기록이 없습니다.",
    notes: "메모",
    // Edit Modal
    editRecordTitle: "근태 기록 수정",
    employeeLabel: "직원",
    dateLabel: "날짜",
    breakLabel: "휴게시간(분)",
    clockInLabel: "출근 날짜 및 시간",
    clockOutLabel: "퇴근 날짜 및 시간",
    statusLabel: "근무 상태",
    notesLabel: "메모",
    // Employee Management Tab
    empTitle: "직원 관리",
    empSubtitle: "식당 전체 직원 목록",
    addEmpBtn: "신규 직원 추가",
    tablePin: "PIN 코드",
    tableHourlyRate: "시급",
    tableYolParasi: "일일 교통비",
    activeBadge: "활성",
    passiveBadge: "비활성",
    noEmployees: "등록된 직원이 없습니다.",
    // Add Employee Modal
    addEmpTitle: "신규 직원 추가",
    editEmpTitle: "직원 정보 수정",
    empNameLabel: "직원 이름",
    pinLabel: "PIN 코드 (4자리)",
    hourlyRateLabel: "시급 (TL)",
    yolParasiLabel: "일일 교통비 (TL)",
  }
};

export default function AdminDashboard() {
  const [lang, setLang] = useState<"tr" | "ko">("tr");
  const [activeTab, setActiveTab] = useState("records");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  
  // 비밀번호 변경용 states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePwError, setChangePwError] = useState("");
  const [changePwSuccess, setChangePwSuccess] = useState("");

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwError("");
    setChangePwSuccess("");

    if (newPassword !== confirmPassword) {
      setChangePwError(t.pwMismatch);
      return;
    }

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change",
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setChangePwSuccess(t.pwSuccess);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowChangePwModal(false), 1500);
      } else {
        setChangePwError(data.error || "Hata oluştu");
      }
    } catch (err) {
      setChangePwError(t.authConnError);
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-800">{t.title}</h2>
          <button 
            onClick={handleLangToggle}
            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded border border-gray-200 shadow-sm"
          >
            🌐 {lang === "tr" ? "TR" : "KR"}
          </button>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200" 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col justify-between shadow-lg transform transition-transform duration-300 md:relative md:translate-x-0 md:shadow-sm md:z-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:flex'}`}>
        <div>
          <div className="p-6 border-b border-gray-100 bg-blue-600/5 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{t.restaurantName}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={handleLangToggle}
                className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded border border-gray-200 shadow-sm"
              >
                🌐 {lang === "tr" ? "TR" : "KR"}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="space-y-1 p-4">

            <button 
              onClick={() => { setActiveTab("records"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'records' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <CalendarDays className="w-5 h-5 mr-3" />
              {t.recordsTab}
            </button>
            <button 
              onClick={() => { setActiveTab("employees"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'employees' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users className="w-5 h-5 mr-3" />
              {t.employeesTab}
            </button>
            
            <button 
              onClick={() => {
                setShowChangePwModal(true);
                setIsSidebarOpen(false);
                setChangePwError("");
                setChangePwSuccess("");
              }}
              className="w-full flex items-center p-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 mt-4 border-t border-gray-100 pt-4"
            >
              <Key className="w-5 h-5 mr-3 text-gray-400" />
              {t.changePw}
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100 text-center space-y-2">
          <a href="/admin/payroll" className="block w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
            {t.payrollBtn}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">

        {activeTab === "records" && <MonthlyRecords t={t} />}
        {activeTab === "employees" && <EmployeeManagement t={t} />}
      </main>

      {/* Change Password Modal */}
      {showChangePwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h4 className="text-lg font-bold text-gray-800">{t.changePwTitle}</h4>
              <button onClick={() => setShowChangePwModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.currentPw}</label>
                <input 
                  type="password" 
                  required 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.newPw}</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.newPwConfirm}</label>
                <input 
                  type="password" 
                  required 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" 
                />
              </div>
              
              {changePwError && <p className="text-red-500 text-xs font-semibold text-center">{changePwError}</p>}
              {changePwSuccess && <p className="text-green-600 text-xs font-semibold text-center">{changePwSuccess}</p>}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowChangePwModal(false)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



// -------------------------------------------------------------
// 2. Aylık Çalışma Kayıtları (월별 근태 목록)
// -------------------------------------------------------------
function MonthlyRecords({ t }: { t: any }) {
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [records, setRecords] = useState<RecordWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<RecordWithEmployee | null>(null);

  // 필터 및 검색 states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Form states for editing
  const [workDate, setWorkDate] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [status, setStatus] = useState<'working' | 'completed'>('completed');
  const [notes, setNotes] = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?yearMonth=${yearMonth}`);
      const data = await res.json();
      if (data.records) setRecords(data.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openEditModal = (rec: RecordWithEmployee) => {
    setEditingRecord(rec);
    setWorkDate(rec.work_date);
    setClockIn(new Date(rec.clock_in).toISOString().slice(0, 16));
    setClockOut(rec.clock_out ? new Date(rec.clock_out).toISOString().slice(0, 16) : "");
    setBreakMinutes(rec.break_minutes);
    setStatus(rec.status);
    setNotes(rec.notes || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord.id,
          workDate,
          clockIn: new Date(clockIn).toISOString(),
          clockOut: clockOut ? new Date(clockOut).toISOString() : null,
          breakMinutes,
          status,
          notes
        })
      });

      if (res.ok) {
        setEditingRecord(null);
        fetchRecords();
      } else {
        const err = await res.json();
        alert(err.error || "Hata oluştu");
      }
    } catch (err) {
      console.error(err);
      alert("Bağlantı hatası");
    }
  };

  // 클라이언트 단 필터링 적용
  const filteredRecords = records.filter(rec => {
    const matchesName = rec.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'working') {
      matchesStatus = rec.status === 'working';
    } else if (statusFilter === 'completed') {
      matchesStatus = rec.status === 'completed' && !!rec.clock_out;
    } else if (statusFilter === 'no_clock_out') {
      matchesStatus = rec.status === 'completed' && !rec.clock_out;
    }

    const matchesDate = selectedDate ? rec.work_date === selectedDate : true;

    return matchesName && matchesStatus && matchesDate;
  });

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">{t.monthlyTitle}</h3>
          <p className="text-gray-500 text-xs md:text-sm">{t.monthlySubtitle}</p>
        </div>
        <div>
          <input 
            type="month" 
            value={yearMonth}
            onChange={(e) => {
              setYearMonth(e.target.value);
              setSelectedDate(""); // 연/월이 변경되면 일자 필터 초기화
            }}
            className="w-full sm:w-auto p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium text-sm bg-white"
          />
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.searchPlaceholder}</label>
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.statusFilterLabel}</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
          >
            <option value="all">{t.allStatus}</option>
            <option value="working">{t.working}</option>
            <option value="completed">{t.completed}</option>
            <option value="no_clock_out">{t.noClockOut}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">{t.dateFilterLabel}</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableDate}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableEmpName}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableClockIn}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableClockOut}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableBreak}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableStatus}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.notes}</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-center">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">{t.loading}</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">{t.recordNotFound}</td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-gray-800 font-medium">{rec.work_date}</td>
                  <td className="p-4 text-gray-800">{rec.employees?.name}</td>
                  <td className="p-4 text-gray-600">
                    {new Date(rec.clock_in).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-gray-600">
                    {rec.clock_out
                      ? new Date(rec.clock_out).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                      : "-"}
                  </td>
                  <td className="p-4 text-gray-600">{rec.break_minutes} dk</td>
                  <td className="p-4">
                    {rec.status === 'working' ? (
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2.5 py-1 rounded-full">{t.working}</span>
                    ) : rec.clock_out ? (
                      <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2.5 py-1 rounded-full">{t.completed}</span>
                    ) : (
                      <span className="text-red-500 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-full">{t.noClockOut}</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-gray-500 max-w-[150px] truncate" title={rec.notes || ""}>
                    {rec.notes || "-"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {t.editBtn}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">{t.loading}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-8 bg-white border border-gray-100 rounded-xl text-gray-500">{t.recordNotFound}</div>
        ) : (
          filteredRecords.map((rec) => (
            <div key={rec.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">{rec.work_date}</span>
                <span className="font-semibold text-gray-700">{rec.employees?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-50">
                <div>{t.clockInLabel}: <span className="font-medium text-gray-800">{new Date(rec.clock_in).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div>{t.clockOutLabel}: <span className="font-medium text-gray-800">{rec.clock_out ? new Date(rec.clock_out).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : "-"}</span></div>
                <div>{t.breakLabel}: <span className="font-medium text-gray-800">{rec.break_minutes} dk</span></div>
                <div>{t.tableStatus}:{" "}
                  {rec.status === 'working' ? (
                    <span className="text-green-600 font-bold">{t.working}</span>
                  ) : rec.clock_out ? (
                    <span className="text-gray-500 font-medium">{t.completed}</span>
                  ) : (
                    <span className="text-red-500 font-bold">{t.noClockOut}</span>
                  )}
                </div>
              </div>
              {rec.notes && (
                <div className="text-xs bg-gray-50 p-2.5 rounded-lg text-gray-500 italic">
                  {t.notesLabel}: {rec.notes}
                </div>
              )}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => openEditModal(rec)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t.editBtn}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Attendance Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h4 className="text-lg font-bold text-gray-800">{t.editRecordTitle}</h4>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.employeeLabel}</label>
                <input type="text" disabled value={editingRecord.employees?.name} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.dateLabel}</label>
                  <input type="date" required value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.breakLabel}</label>
                  <input type="number" required min={0} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.clockInLabel}</label>
                <input type="datetime-local" required value={clockIn} onChange={(e) => setClockIn(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.clockOutLabel}</label>
                <input type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.statusLabel}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm bg-white">
                  <option value="working">working</option>
                  <option value="completed">completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.notesLabel}</label>
                <textarea value={notes} placeholder="Resmi tatil" onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-xs" rows={2} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. Personel Yönetimi (직원 관리)
// -------------------------------------------------------------
function EmployeeManagement({ t }: { t: any }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [hourlyRate, setHourlyRate] = useState(10000);
  const [yolParasi, setYolParasi] = useState(100);
  const [isActive, setIsActive] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees?all=true");
      const data = await res.json();
      if (data.employees) setEmployees(data.employees);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openAddModal = () => {
    setShowAddModal(true);
    setName("");
    setPinCode("");
    setHourlyRate(10000);
    setYolParasi(100);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setPinCode(emp.pin_code);
    setHourlyRate(Number(emp.hourly_rate));
    setYolParasi(emp.yol_parasi !== undefined ? Number(emp.yol_parasi) : 100);
    setIsActive(emp.is_active);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pinCode, hourlyRate, yolParasi })
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchEmployees();
      } else {
        const err = await res.json();
        alert(err.error || "Hata oluştu");
      }
    } catch (err) {
      console.error(err);
      alert("Bağlantı hatası");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEmployee.id,
          name,
          pinCode,
          hourlyRate,
          yolParasi,
          isActive
        })
      });

      if (res.ok) {
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        const err = await res.json();
        alert(err.error || "Hata oluştu");
      }
    } catch (err) {
      console.error(err);
      alert("Bağlantı hatası");
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">{t.empTitle}</h3>
          <p className="text-gray-500 text-xs md:text-sm">{t.empSubtitle}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <UserPlus className="w-4 h-4" />
          {t.addEmpBtn}
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.empNameLabel}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tablePin}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableHourlyRate}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">{t.tableYolParasi}</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Durum</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">{t.loading}</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">{t.noEmployees}</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-semibold text-gray-800">{emp.name}</td>
                  <td className="p-4 text-gray-600 tracking-wider">****</td>
                  <td className="p-4 text-gray-800 font-medium">{Number(emp.hourly_rate).toLocaleString()} TL</td>
                  <td className="p-4 text-gray-800 font-medium">{Number(emp.yol_parasi ?? 100).toLocaleString()} TL</td>
                  <td className="p-4">
                    {emp.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                        <Check className="w-3.5 h-3.5" />
                        {t.activeBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
                        <X className="w-3.5 h-3.5" />
                        {t.passiveBadge}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => openEditModal(emp)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-4 transition-colors inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {t.editBtn}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">{t.loading}</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 bg-white border border-gray-100 rounded-xl text-gray-500">{t.noEmployees}</div>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800 text-lg">{emp.name}</span>
                {emp.is_active ? (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">{t.activeBadge}</span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">{t.passiveBadge}</span>
                )}
              </div>
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-50 space-y-1">
                <div>{t.tableHourlyRate}: <span className="font-bold text-gray-800">{Number(emp.hourly_rate).toLocaleString()} TL</span></div>
                <div>{t.tableYolParasi}: <span className="font-bold text-gray-800">{Number(emp.yol_parasi ?? 100).toLocaleString()} TL</span></div>
              </div>
              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => openEditModal(emp)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors inline-flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t.editBtn}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h4 className="text-lg font-bold text-gray-800">{t.addEmpTitle}</h4>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.empNameLabel}</label>
                <input type="text" required placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.pinLabel}</label>
                <input type="password" required maxLength={4} placeholder="****" value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 tracking-widest text-center text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.hourlyRateLabel}</label>
                  <input type="number" required min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.yolParasiLabel}</label>
                  <input type="number" required min={0} value={yolParasi} onChange={(e) => setYolParasi(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h4 className="text-lg font-bold text-gray-800">{t.editEmpTitle}</h4>
              <button onClick={() => setEditingEmployee(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.empNameLabel}</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.pinLabel}</label>
                <input type="password" required maxLength={4} value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 tracking-widest text-center text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.hourlyRateLabel}</label>
                  <input type="number" required min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.yolParasiLabel}</label>
                  <input type="number" required min={0} value={yolParasi} onChange={(e) => setYolParasi(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm outline-none" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-b border-gray-50">
                <span className="text-sm font-semibold text-gray-700">Çalışma Durumu</span>
                <button 
                  type="button" 
                  onClick={() => setIsActive(!isActive)}
                  className="text-blue-600 transition-colors"
                >
                  {isActive ? <ToggleRight className="w-12 h-8" /> : <ToggleLeft className="w-12 h-8 text-gray-400" />}
                </button>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingEmployee(null)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
