"use client";

import { useState, useEffect } from "react";
import { LogIn, LogOut } from "lucide-react";
import type { Employee } from "@/types";

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    // Fetch active employees on mount
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) setEmployees(data.employees);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleAction = async (action: 'clock_in' | 'clock_out') => {
    if (!selectedEmployeeId) {
      setMessage({ text: "Lütfen bir personel seçin.", type: "error" });
      return;
    }
    if (pinCode.length !== 4) {
      setMessage({ text: "Lütfen 4 haneli PIN kodunu girin.", type: "error" });
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
        setMessage({ text: data.message || "İşlem başarıyla tamamlandı.", type: "success" });
        setPinCode(""); // 초기화
      }
    } catch (error) {
      setMessage({ text: "Sunucu bağlantısı başarısız oldu.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center text-white">
          <h1 className="text-2xl font-bold">Giriş-Çıkış Kaydı</h1>
          <p className="opacity-80 mt-1">Mağaza QR Tarandı</p>
        </div>
        
        <div className="p-6 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Personel Seçimi</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Lütfen adınızı seçin</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">PIN Kodu</label>
            <input 
              type="password" 
              maxLength={4}
              placeholder="****"
              className="w-full p-4 text-center text-3xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))} // 숫자만 입력되도록
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              disabled={loading}
              onClick={() => handleAction('clock_in')}
              className="flex flex-col items-center justify-center py-4 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <LogIn className="w-8 h-8 mb-2" />
              <span className="font-bold text-lg">Giriş Yap 🟢</span>
            </button>
            <button 
              disabled={loading}
              onClick={() => handleAction('clock_out')}
              className="flex flex-col items-center justify-center py-4 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-8 h-8 mb-2" />
              <span className="font-bold text-lg">Çıkış Yap 🔴</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
