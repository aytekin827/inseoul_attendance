"use client";

import { useState } from "react";
import { Users, Clock, CalendarDays } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("realtime");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Yönetici Paneli</h2>
        </div>
        <nav className="space-y-1 px-4">
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {activeTab === "realtime" && <RealtimeBoard />}
        {activeTab === "records" && <MonthlyRecords />}
        {activeTab === "employees" && <EmployeeManagement />}
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// 하위 컴포넌트들
// -------------------------------------------------------------

function RealtimeBoard() {
  return (
    <div className="animate-in fade-in duration-300">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Canlı Çalışma Panosu</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-800">Ahmet Yılmaz</h4>
              <p className="text-sm text-gray-500 mt-1">Giriş: Bugün 09:00</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              Çalışıyor
            </span>
          </div>
          <div className="pt-4 border-t border-gray-50">
            <p className="text-sm text-gray-500 mb-1">Mevcut Çalışma Süresi</p>
            <div className="text-3xl font-bold text-blue-600">
              2sa 30dk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyRecords() {
  return (
    <div className="animate-in fade-in duration-300">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Aylık Çalışma Kayıtları</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Tarih</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Personel Adı</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Giriş Saati</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Çıkış Saati</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Durum</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-center">Yönetim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="p-4 text-gray-800">2026-08-30</td>
              <td className="p-4 font-medium text-gray-800">Ahmet Yılmaz</td>
              <td className="p-4 text-gray-600">09:00</td>
              <td className="p-4 text-gray-600">-</td>
              <td className="p-4">
                <span className="text-red-500 text-sm font-medium bg-red-50 px-2 py-1 rounded-md">Çıkış Yapılmadı</span>
              </td>
              <td className="p-4 text-center">
                <button className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium">Düzenle</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeManagement() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h3>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
          + Yeni Personel Ekle
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Personel Adı</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Saatlik Ücret</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Durum</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">Yönetim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="p-4 font-medium text-gray-800">Ahmet Yılmaz</td>
              <td className="p-4 text-gray-600">100 TL</td>
              <td className="p-4">
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">Aktif</span>
              </td>
              <td className="p-4 text-right">
                <button className="text-gray-500 hover:text-blue-600 text-sm font-medium mr-4 transition-colors">Düzenle</button>
                <button className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors">Pasifleştir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
