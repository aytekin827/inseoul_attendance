"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Clock, CalendarDays, Edit2, UserPlus, ToggleLeft, ToggleRight, Check, X, RefreshCw, Key } from "lucide-react";
import type { Employee, AttendanceRecord } from "@/types";

type RecordWithEmployee = AttendanceRecord & {
  employees: {
    name: string;
    hourly_rate: number;
  };
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("realtime");
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwError("");
    setChangePwSuccess("");

    if (newPassword !== confirmPassword) {
      setChangePwError("Yeni şifreler eşleşmiyor!");
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
        setChangePwSuccess("Şifre başarıyla güncellendi!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowChangePwModal(false), 1500);
      } else {
        setChangePwError(data.error || "Şifre güncellenemedi.");
      }
    } catch (err) {
      setChangePwError("Bağlantı hatası!");
    }
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm">
        <div>
          <div className="p-6 border-b border-gray-100 bg-blue-600/5">
            <h2 className="text-xl font-bold text-gray-800">Yönetici Paneli</h2>
            <p className="text-xs text-gray-500 mt-1">İnistanbul Restoran</p>
          </div>
          <nav className="space-y-1 p-4">
            <button 
              onClick={() => setActiveTab("realtime")}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'realtime' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Clock className="w-5 h-5 mr-3" />
              Canlı Çalışma Panosu
            </button>
            <button 
              onClick={() => setActiveTab("records")}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'records' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <CalendarDays className="w-5 h-5 mr-3" />
              Aylık Çalışma Kayıtları
            </button>
            <button 
              onClick={() => setActiveTab("employees")}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'employees' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users className="w-5 h-5 mr-3" />
              Personel Yönetimi
            </button>
            
            <button 
              onClick={() => {
                setShowChangePwModal(true);
                setChangePwError("");
                setChangePwSuccess("");
              }}
              className="w-full flex items-center p-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 mt-4 border-t border-gray-100 pt-4"
            >
              <Key className="w-5 h-5 mr-3 text-gray-400" />
              Şifre Değiştir
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100 text-center space-y-2">
          <a href="/admin/payroll" className="block w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Maaş Hesaplama Ekranı
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "realtime" && <RealtimeBoard />}
        {activeTab === "records" && <MonthlyRecords />}
        {activeTab === "employees" && <EmployeeManagement />}
      </main>

      {/* Change Password Modal */}
      {showChangePwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h4 className="text-lg font-bold text-gray-800">Yönetici Şifresini Değiştir</h4>
              <button onClick={() => setShowChangePwModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mevcut Şifre</label>
                <input 
                  type="password" 
                  required 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Yeni Şifre</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Yeni Şifre Tekrar</label>
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
                <button type="button" onClick={() => setShowChangePwModal(false)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors">İptal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Şifreyi Değiştir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 1. Canlı Çalışma Panosu
// -------------------------------------------------------------
function RealtimeBoard() {
  const [records, setRecords] = useState<RecordWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRealtime = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance?status=working");
      const data = await res.json();
      if (data.records) setRecords(data.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealtime();
    // 30 saniyede bir otomatik yenile
    const interval = setInterval(fetchRealtime, 30000);
    return () => clearInterval(interval);
  }, [fetchRealtime]);

  // 경과 시간 계산용 컴포넌트
  const Timer = ({ clockIn }: { clockIn: string }) => {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
      const calc = () => {
        const diffMs = Date.now() - new Date(clockIn).getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setElapsed(`${diffHrs}sa ${diffMins}dk`);
      };
      calc();
      const timer = setInterval(calc, 60000);
      return () => clearInterval(timer);
    }, [clockIn]);

    return <span>{elapsed}</span>;
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Canlı Çalışma Panosu</h3>
          <p className="text-gray-500 text-sm">Şu an aktif çalışan personel durumu</p>
        </div>
        <button onClick={fetchRealtime} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {loading && records.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          Şu an aktif çalışan personel bulunmamaktadır.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec) => (
            <div key={rec.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{rec.employees?.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Giriş: {new Date(rec.clock_in).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Çalışıyor
                </span>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1">Geçen Süre</p>
                <div className="text-3xl font-bold text-blue-600">
                  <Timer clockIn={rec.clock_in} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. Aylık Çalışma Kayıtları (조회 및 수동 수정)
// -------------------------------------------------------------
function MonthlyRecords() {
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [records, setRecords] = useState<RecordWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<RecordWithEmployee | null>(null);

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
    
    // ISO string format 변환
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

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Aylık Çalışma Kayıtları</h3>
          <p className="text-gray-500 text-sm">Geçmiş ve mevcut tüm çalışma logları</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Tarih</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Personel Adı</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Giriş Saati</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Çıkış Saati</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Mola (Dk)</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Durum</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-center">Yönetim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">Yükleniyor...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">Kayıt bulunamadı.</td>
              </tr>
            ) : (
              records.map((rec) => (
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
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2.5 py-1 rounded-full">Çalışıyor</span>
                    ) : rec.clock_out ? (
                      <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2.5 py-1 rounded-full">Tamamlandı</span>
                    ) : (
                      <span className="text-red-500 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-full">Çıkış Yapılmadı</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openEditModal(rec)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Attendance Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h4 className="text-lg font-bold text-gray-800">Çalışma Kaydını Düzenle</h4>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Personel</label>
                <input type="text" disabled value={editingRecord.employees?.name} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tarih</label>
                  <input type="date" required value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mola Süresi (dk)</label>
                  <input type="number" required min={0} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Giriş Tarihi & Saati</label>
                <input type="datetime-local" required value={clockIn} onChange={(e) => setClockIn(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Çıkış Tarihi & Saati</label>
                <input type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Çalışma Durumu</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700">
                  <option value="working">Çalışıyor (working)</option>
                  <option value="completed">Tamamlandı (completed)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Not</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors">İptal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. Personel Yönetimi (생성, 수정, 활성화/비활성화)
// -------------------------------------------------------------
function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [hourlyRate, setHourlyRate] = useState(10000);
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
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setPinCode(emp.pin_code);
    setHourlyRate(Number(emp.hourly_rate));
    setIsActive(emp.is_active);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pinCode, hourlyRate })
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
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h3>
          <p className="text-gray-500 text-sm">Tüm restoran kadrosunun listesi</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Yeni Personel Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Personel Adı</th>
              <th className="p-4 text-sm font-semibold text-gray-600">PIN Kodu</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Saatlik Ücret</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Durum</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">Yönetim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Yükleniyor...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Kayıtlı personel bulunmuyor.</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-semibold text-gray-800">{emp.name}</td>
                  <td className="p-4 text-gray-600 tracking-wider">****</td>
                  <td className="p-4 text-gray-800 font-medium">{Number(emp.hourly_rate).toLocaleString()} TL</td>
                  <td className="p-4">
                    {emp.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                        <Check className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
                        <X className="w-3.5 h-3.5" />
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => openEditModal(emp)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-4 transition-colors inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h4 className="text-lg font-bold text-gray-800">Yeni Personel Ekle</h4>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Personel Adı</label>
                <input type="text" required placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">PIN Kodu (4 Hane)</label>
                <input type="password" required maxLength={4} placeholder="****" value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 tracking-widest text-center" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Saatlik Ücret (TL)</label>
                <input type="number" required min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors">İptal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Kaydet</button>
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
              <h4 className="text-lg font-bold text-gray-800">Personel Düzenle</h4>
              <button onClick={() => setEditingEmployee(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Personel Adı</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">PIN Kodu (4 Hane)</label>
                <input type="password" required maxLength={4} value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 tracking-widest text-center" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Saatlik Ücret (TL)</label>
                <input type="number" required min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700" />
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
                <button type="button" onClick={() => setEditingEmployee(null)} className="flex-1 py-2.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors">İptal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
