"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Calculator, 
  Calendar, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Clock, 
  Coins, 
  Users, 
  CalendarCheck,
  FileSpreadsheet,
  Edit2,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { calculateMonthlyPayroll, PayrollSummary, DailyPayrollRecord } from "@/lib/payroll";
import type { Employee, AttendanceRecord } from "@/types";
import { 
  getTurkeyDateString, 
  formatTurkeyDateTimeLocal, 
  parseTurkeyDateTimeLocal, 
  formatTurkeyTime 
} from "@/lib/time";
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
    title: "Maaş Hesaplama ve Bordro Yönetimi",
    subtitle: "Toplam çalışma süresi x saatlik ücret, haftalık 45 saati aşan mesailer için %150 (1.5x) zamlı ücret, resmi tatiller için %200 (2x) ücret ve yol parası hesabı",
    downloadBtn: "Excel İndir (Çoklu Sayfa)",
    downloading: "Hazırlanıyor...",
    tableTitle: "Personel Bazlı Maaş Özeti",
    activeCount: "Fiili Çalışan Personel:",
    calculating: "Hesaplanıyor...",
    noRecords: "Bu aya ait tamamlanmış çalışma kaydı veya hesaplanacak maaş bulunamadı.",
    searchPlaceholder: "Personel adı ile filtrele...",
    expandAll: "Tüm Detayları Aç",
    collapseAll: "Tümünü Kapat",
    viewDetails: "Günlük Detay",
    hideDetails: "Detayı Gizle",
    dailyDetailTitle: "Günlük Çalışma ve Mesai Dökümü",
    summarySheetName: "Maaş Özeti",
    grandTotal: "GENEL TOPLAM",
    statsTotalStaff: "Toplam Personel",
    statsTotalHours: "Toplam Çalışma Süresi",
    statsTotalOvertime: "Toplam Fazla Mesai (>45sa)",
    statsTotalPayout: "Toplam Ödenecek Maaş",
    
    // Summary Table Columns
    colName: "Personel Adı",
    colHourlyRate: "Saatlik Ücret",
    colYolParasiRate: "Günlük Yol",
    colWorkedDays: "Çalışılan Gün",
    colNormalHours: "Normal Mesai (≤45sa)",
    colOvertimeHours: "Fazla Mesai (>45sa)",
    colTotalHours: "Toplam Süre",
    colBasePay: "Normal Mesai Ücreti (%100)",
    colOvertimePay: "Fazla Mesai Ücreti (%150)",
    colYolParasi: "Yol Parası",
    colHolidayHours: "Resmi Tatil Çalışma",
    colHolidayPay: "Resmi Tatil Ek Ödeme (+%100)",
    colTotalPay: "Toplam Ödenecek",
    colAction: "Detay",
    
    // Daily Table Columns
    colDate: "Tarih",
    colDay: "Gün",
    colWeek: "Hafta",
    colClockIn: "Giriş Saati",
    colClockOut: "Çıkış Saati",
    colBreak: "Mola (dk)",
    colDailyWorkHours: "Çalışma Süresi",
    colDailyNormal: "≤45sa (%100)",
    colDailyOvertime: ">45sa (%150)",
    colOvertimeStatus: "45sa Durumu",
    colIsHoliday: "Resmi Tatil (%200)",
    colDailyYolParasi: "Yol Parası",
    colNotes: "Not / Düzeltme",
    colDailyTotal: "Günlük Tutar",
    colDailyAction: "Düzenle",
    editRecordBtn: "Düzenle",
    
    // Edit Modal Translations
    editModalTitle: "Çalışma Kaydını ve Saatleri Düzenle",
    editModalSubtitle: "Giriş/çıkış saati veya not güncellendiğinde tüm maaş anında yeniden hesaplanır.",
    empLabel: "Personel Adı",
    dateLabel: "Çalışma Tarihi",
    clockInLabel: "Giriş Tarihi & Saati",
    clockOutLabel: "Çıkış Tarihi & Saati",
    breakLabel: "Mola Süresi (Dakika)",
    statusLabel: "Çalışma Durumu",
    statusWorking: "Çalışıyor (working)",
    statusCompleted: "Tamamlandı (completed)",
    notesLabel: "Not / Düzeltme Açıklaması",
    notesPlaceholder: "Örn: Resmi tatil veya giriş/çıkış saati düzeltildi",
    quickTagHoliday: "+ Resmi Tatil (%200)",
    cancel: "İptal",
    save: "Kaydet ve Maaşı Yeniden Hesapla",
    saving: "Kaydediliyor...",
    saveSuccess: "Kayıt başarıyla güncellendi ve maaş yeniden hesaplandı!",
    rowClickHint: "💡 Saatleri 또는 Notları değiştirmek için satıra veya Düzenle butonuna tıklayın.",
    editPrompt: "Düzenlemek için dokunun",
    
    // Status Badges
    statusNormal: "≤45sa Normal",
    statusOvertime: ">45sa Fazla (%150)",
    statusSplit: "Kısmi Fazla",
    badgeHoliday: "Resmi Tatil (2x)",
    
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
    subtitle: "총 일한 시간 × 시급 기본 체계, 주 45시간 초과 근무 150%(1.5배), 공휴일 근무 200%(2.0배), 일별 교통비(욜파라) 자동 산정",
    downloadBtn: "Excel 다운로드 (전체 요약 + 개인별 시트)",
    downloading: "다운로드 중...",
    tableTitle: "직원별 급여 정산 요약",
    activeCount: "급여 대상 직원 수:",
    calculating: "계산 중...",
    noRecords: "이번 달 근태 기록 또는 정산할 급여 내역이 없습니다.",
    searchPlaceholder: "직원 이름으로 검색...",
    expandAll: "모든 상세내역 펼치기",
    collapseAll: "모두 접기",
    viewDetails: "일별 상세",
    hideDetails: "상세 닫기",
    dailyDetailTitle: "일별 출퇴근 및 근무시간 상세 내역",
    summarySheetName: "급여 요약",
    grandTotal: "총계 (전체 합계)",
    statsTotalStaff: "총 대상 직원",
    statsTotalHours: "총 근무시간",
    statsTotalOvertime: "총 연장근무 (>45h)",
    statsTotalPayout: "총 급여 지급액",
    
    // Summary Table Columns
    colName: "직원 이름",
    colHourlyRate: "시급",
    colYolParasiRate: "1일 교통비",
    colWorkedDays: "근무 일수",
    colNormalHours: "기본 근무 (≤45h)",
    colOvertimeHours: "연장 근무 (>45h)",
    colTotalHours: "총 근무시간",
    colBasePay: "기본급 (100%)",
    colOvertimePay: "연장 수당 (150%)",
    colYolParasi: "교통비 (욜파라)",
    colHolidayHours: "국경일 근무시간",
    colHolidayPay: "국경일 추가 수당 (+100%)",
    colTotalPay: "최종 지급액",
    colAction: "상세",
    
    // Daily Table Columns
    colDate: "일자",
    colDay: "요일",
    colWeek: "주차",
    colClockIn: "출근시간",
    colClockOut: "퇴근시간",
    colBreak: "휴게시간(분)",
    colDailyWorkHours: "실 근무시간",
    colDailyNormal: "45h 이내 (100%)",
    colDailyOvertime: "45h 초과 (150%)",
    colOvertimeStatus: "45h 구분",
    colIsHoliday: "국경일 (200%)",
    colDailyYolParasi: "교통비 (욜파라)",
    colNotes: "Note (메모)",
    colDailyTotal: "당일 급여",
    colDailyAction: "수정",
    editRecordBtn: "수정",
    
    // Edit Modal Translations
    editModalTitle: "출퇴근 시간 및 근태 기록 수정",
    editModalSubtitle: "출퇴근 시간이나 메모를 수정하면 DB에 반영되고 급여가 즉시 자동 재계산됩니다.",
    empLabel: "직원 이름",
    dateLabel: "근무 일자",
    clockInLabel: "출근 일시",
    clockOutLabel: "퇴근 일시",
    breakLabel: "휴게시간 (분 단위)",
    statusLabel: "근무 상태",
    statusWorking: "근무 중 (working)",
    statusCompleted: "정상 완료 (completed)",
    notesLabel: "메모 / 보정 사유",
    notesPlaceholder: "예: 공식 국경일(Resmi tatil) 또는 출퇴근 시간 정정 사유",
    quickTagHoliday: "+ 국경일/공휴일 (Resmi tatil)",
    cancel: "취소",
    save: "저장 및 급여 재계산",
    saving: "저장 중...",
    saveSuccess: "기록이 성공적으로 수정되었으며 급여가 즉시 재계산되었습니다!",
    rowClickHint: "💡 행을 클릭하거나 '수정' 버튼을 누르면 출퇴근 시간과 메모를 수정할 수 있습니다.",
    editPrompt: "수정하려면 터치",
    
    // Status Badges
    statusNormal: "45h 이내",
    statusOvertime: "45h 초과 (150%)",
    statusSplit: "일부 초과(분할)",
    badgeHoliday: "국경일 (200%)",
    
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
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<Set<string>>(new Set());

  // Edit Record Modal States
  const [editingRecord, setEditingRecord] = useState<DailyPayrollRecord | null>(null);
  const [editWorkDate, setEditWorkDate] = useState("");
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editBreakMinutes, setEditBreakMinutes] = useState(0);
  const [editStatus, setEditStatus] = useState<"working" | "completed">("completed");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [editRecordError, setEditRecordError] = useState("");
  const [editRecordSuccess, setEditRecordSuccess] = useState("");

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

  // 근태 기록 수정 모달 열기
  const openEditRecordModal = (record: DailyPayrollRecord) => {
    setEditingRecord(record);
    setEditWorkDate(record.workDate);
    setEditClockIn(formatTurkeyDateTimeLocal(record.clockIn));
    setEditClockOut(record.clockOut ? formatTurkeyDateTimeLocal(record.clockOut) : "");
    setEditBreakMinutes(record.breakMinutes || 0);
    setEditStatus(record.status || "completed");
    setEditNotes(record.notes || "");
    setEditRecordError("");
    setEditRecordSuccess("");
  };

  // 근태 기록 수정 저장
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSavingRecord(true);
    setEditRecordError("");
    setEditRecordSuccess("");

    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord.recordId,
          workDate: editWorkDate,
          clockIn: parseTurkeyDateTimeLocal(editClockIn),
          clockOut: editClockOut ? parseTurkeyDateTimeLocal(editClockOut) : null,
          breakMinutes: editBreakMinutes,
          status: editStatus,
          notes: editNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEditRecordSuccess(t.saveSuccess);
        // 즉시 급여 데이터 재로딩 및 재계산 반영
        await loadPayrollData();
        setTimeout(() => {
          setEditingRecord(null);
          setEditRecordSuccess("");
        }, 700);
      } else {
        setEditRecordError(data.error || (lang === "tr" ? "Kayıt güncellenemedi" : "수정에 실패했습니다"));
      }
    } catch (err) {
      console.error("Attendance update error:", err);
      setEditRecordError(lang === "tr" ? "Bağlantı hatası oluştu" : "서버 연결 오류가 발생했습니다");
    } finally {
      setIsSavingRecord(false);
    }
  };

  // 검색 필터링된 급여 목록
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return payrollSummaries;
    const q = searchQuery.toLowerCase();
    return payrollSummaries.filter(s => s.employeeName.toLowerCase().includes(q));
  }, [payrollSummaries, searchQuery]);

  // 전체 통계 계산
  const overallStats = useMemo(() => {
    const totalStaff = payrollSummaries.length;
    let totalWorkedDays = 0;
    let totalNormalHours = 0;
    let totalOvertimeHours = 0;
    let totalHours = 0;
    let totalBasePay = 0;
    let totalOvertimePay = 0;
    let totalYolParasi = 0;
    let totalHolidayHours = 0;
    let totalHolidayPay = 0;
    let totalPayout = 0;

    payrollSummaries.forEach(s => {
      totalWorkedDays += s.workedDaysCount;
      totalNormalHours += s.normalWorkHours;
      totalOvertimeHours += s.overtimeWorkHours;
      totalHours += s.totalWorkHours;
      totalBasePay += s.basePay;
      totalOvertimePay += s.overtimePay;
      totalYolParasi += s.yolParasi;
      totalHolidayHours += s.holidayWorkHours;
      totalHolidayPay += s.holidayAdditionalPay;
      totalPayout += s.totalPay;
    });

    return {
      totalStaff,
      totalWorkedDays,
      totalNormalHours: Number(totalNormalHours.toFixed(2)),
      totalOvertimeHours: Number(totalOvertimeHours.toFixed(2)),
      totalHours: Number(totalHours.toFixed(2)),
      totalBasePay,
      totalOvertimePay,
      totalYolParasi,
      totalHolidayHours: Number(totalHolidayHours.toFixed(2)),
      totalHolidayPay,
      totalPayout
    };
  }, [payrollSummaries]);

  // 특정 직원 상세 펼치기/접기 토글
  const toggleEmployeeDetails = (employeeId: string) => {
    setExpandedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  // 전체 펼치기 / 전체 접기
  const handleToggleAll = () => {
    if (expandedEmployeeIds.size === filteredSummaries.length && filteredSummaries.length > 0) {
      setExpandedEmployeeIds(new Set());
    } else {
      setExpandedEmployeeIds(new Set(filteredSummaries.map(s => s.employeeId)));
    }
  };

  // ==========================================
  // 다중 시트 Excel(.xlsx) 다운로드 핸들러
  // ==========================================
  const handleDownloadExcel = () => {
    if (payrollSummaries.length === 0) {
      alert(t.noRecords);
      return;
    }

    setIsDownloading(true);

    try {
      const workbook = XLSX.utils.book_new();
      const isKo = lang === "ko";
      const summarySheetName = isKo ? "급여 요약" : "Maaş Özeti";

      // ------------------------------------------
      // 1. 전체 요약 시트 (Summary Sheet)
      // ------------------------------------------
      const summaryHeaders = isKo
        ? [
            "직원 이름",
            "시급 (TL)",
            "1일 교통비 (TL)",
            "근무 일수",
            "기본 근무 (주 45h 이하)",
            "연장 근무 (주 45h 초과)",
            "총 근무시간",
            "기본급 (100% TL)",
            "연장 근로 수당 (150% TL)",
            "교통비 총합 (TL)",
            "국경일 근무시간",
            "국경일 추가 수당 (+100% TL)",
            "최종 지급액 (TL)"
          ]
        : [
            "Personel Adı",
            "Saatlik Ücret (TL)",
            "Günlük Yol (TL)",
            "Çalışılan Gün",
            "Normal Mesai (≤45sa)",
            "Fazla Mesai (>45sa)",
            "Toplam Süre",
            "Normal Mesai Ücreti (%100 TL)",
            "Fazla Mesai Ücreti (%150 TL)",
            "Yol Parası Toplam (TL)",
            "Resmi Tatil Çalışma",
            "Resmi Tatil Ek Ödeme (+%100 TL)",
            "Toplam Ödenecek (TL)"
          ];

      const summaryRows: any[][] = [];
      
      // Title Banner
      summaryRows.push([isKo ? `[inseoul] ${yearMonth} 전체 직원 급여 정산 요약표` : `[inseoul] ${yearMonth} Genel Maaş Bordrosu Özeti`]);
      summaryRows.push([
        isKo 
          ? `[산정 기준] 기본근무: 100% | 연장근무(주 45h 초과): 150% (1.5배) | 공휴일근무: 200% (2배) | 교통비: 근무일수 × 일일 욜파라` 
          : `[Hesaplama Kuralı] Normal: %100 | Fazla Mesai (>45sa): %150 (1.5x) | Resmi Tatil: %200 (2x) | Yol: Çalışılan Gün × Yol Parası`
      ]);
      summaryRows.push([isKo ? `출력일시: ${new Date().toLocaleString('ko-KR')}` : `Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`]);
      summaryRows.push([]); // 빈 줄
      summaryRows.push(summaryHeaders);

      let totalWorkedDays = 0;
      let totalNormalHours = 0;
      let totalOvertimeHours = 0;
      let totalAllHours = 0;
      let totalBasePay = 0;
      let totalOvertimePay = 0;
      let totalYolParasi = 0;
      let totalHolidayHours = 0;
      let totalHolidayPay = 0;
      let totalNetPay = 0;

      payrollSummaries.forEach(payroll => {
        totalWorkedDays += payroll.workedDaysCount;
        totalNormalHours += payroll.normalWorkHours;
        totalOvertimeHours += payroll.overtimeWorkHours;
        totalAllHours += payroll.totalWorkHours;
        totalBasePay += payroll.basePay;
        totalOvertimePay += payroll.overtimePay;
        totalYolParasi += payroll.yolParasi;
        totalHolidayHours += payroll.holidayWorkHours;
        totalHolidayPay += payroll.holidayAdditionalPay;
        totalNetPay += payroll.totalPay;

        summaryRows.push([
          payroll.employeeName,
          payroll.hourlyRate,
          payroll.yolParasiRate,
          payroll.workedDaysCount,
          payroll.normalWorkHours,
          payroll.overtimeWorkHours,
          payroll.totalWorkHours,
          payroll.basePay,
          payroll.overtimePay,
          payroll.yolParasi,
          payroll.holidayWorkHours,
          payroll.holidayAdditionalPay,
          payroll.totalPay
        ]);
      });

      // 요약 시트 총계 행
      summaryRows.push([
        isKo ? "총계 (전체 합계)" : "GENEL TOPLAM",
        "-",
        "-",
        totalWorkedDays,
        Number(totalNormalHours.toFixed(2)),
        Number(totalOvertimeHours.toFixed(2)),
        Number(totalAllHours.toFixed(2)),
        totalBasePay,
        totalOvertimePay,
        totalYolParasi,
        Number(totalHolidayHours.toFixed(2)),
        totalHolidayPay,
        totalNetPay
      ]);

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryRows);
      
      // 열 너비 자동 보정
      const summaryColWidths = summaryHeaders.map((hdr, colIdx) => {
        let maxLen = hdr.length * 2;
        for (let r = 4; r < summaryRows.length; r++) {
          const val = summaryRows[r]?.[colIdx];
          if (val !== undefined && val !== null) {
            maxLen = Math.max(maxLen, String(val).length + 2);
          }
        }
        return { wch: Math.max(maxLen, 12) };
      });
      summaryWorksheet["!cols"] = summaryColWidths;

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, summarySheetName);

      // ------------------------------------------
      // 2. 각 직원별 일별 상세 Sheet (Individual Sheets)
      // ------------------------------------------
      const usedSheetNames = new Set<string>();
      usedSheetNames.add(summarySheetName);

      payrollSummaries.forEach(payroll => {
        // 시트명 안전 처리 (특수문자 제거 및 최대 25자)
        let baseSheetName = payroll.employeeName.replace(/[\\/?*[\]:]/g, '_').trim().slice(0, 25);
        if (!baseSheetName) baseSheetName = `Employee_${payroll.employeeId.slice(0, 6)}`;
        let sheetName = baseSheetName;
        let counter = 1;
        while (usedSheetNames.has(sheetName)) {
          sheetName = `${baseSheetName.slice(0, 22)}_${counter}`;
          counter++;
        }
        usedSheetNames.add(sheetName);

        const empRows: any[][] = [];

        // 상단 직원 프로필 및 요약 배너
        empRows.push([
          isKo 
            ? `[inseoul] ${payroll.employeeName} - ${yearMonth} 근무 및 급여 정산 상세` 
            : `[inseoul] ${payroll.employeeName} - ${yearMonth} Çalışma ve Maaş Detayı`
        ]);
        empRows.push([
          isKo 
            ? `직원명: ${payroll.employeeName} | 시급: ${payroll.hourlyRate} TL | 1일 교통비: ${payroll.yolParasiRate} TL | 총 근무일수: ${payroll.workedDaysCount}일 | 총 근무시간: ${payroll.totalWorkHours}시간`
            : `Personel: ${payroll.employeeName} | Saatlik Ücret: ${payroll.hourlyRate} TL | Günlük Yol: ${payroll.yolParasiRate} TL | Çalışılan Gün: ${payroll.workedDaysCount} gün | Toplam Süre: ${payroll.totalWorkHours} sa`
        ]);
        empRows.push([
          isKo
            ? `기본급(100%): ${payroll.basePay.toLocaleString()} TL | 연장수당(150%): ${payroll.overtimePay.toLocaleString()} TL | 국경일추가(+100%): ${payroll.holidayAdditionalPay.toLocaleString()} TL | 교통비: ${payroll.yolParasi.toLocaleString()} TL | 최종 지급액: ${payroll.totalPay.toLocaleString()} TL`
            : `Normal Mesai (%100): ${payroll.basePay.toLocaleString()} TL | Fazla Mesai (%150): ${payroll.overtimePay.toLocaleString()} TL | Resmi Tatil Ek (+%100): ${payroll.holidayAdditionalPay.toLocaleString()} TL | Yol Parası: ${payroll.yolParasi.toLocaleString()} TL | Toplam Ödenecek: ${payroll.totalPay.toLocaleString()} TL`
        ]);
        empRows.push([]); // 빈 줄

        // 일별 테이블 헤더
        const dailyHeaders = isKo
          ? [
              "날짜",
              "요일",
              "주차",
              "출근시간",
              "퇴근시간",
              "휴게시간(분)",
              "실 근무시간 (시간)",
              "45h 이내 (100%)",
              "45h 초과 (150%)",
              "45h 초과 여부",
              "국경일 여부 (200%)",
              "교통비 (TL)",
              "Note (메모 / 보정)",
              "당일 급여 (TL)"
            ]
          : [
              "Tarih",
              "Gün",
              "Hafta",
              "Giriş Saati",
              "Çıkış Saati",
              "Mola (dk)",
              "Çalışma Süresi (sa)",
              "≤45sa Normal (%100)",
              ">45sa Fazla (%150)",
              "45sa Durumu",
              "Resmi Tatil (%200)",
              "Yol Parası (TL)",
              "Not / Düzeltme",
              "Günlük Tutar (TL)"
            ];
        
        empRows.push(dailyHeaders);

        let empTotalBreak = 0;
        let empTotalWorkHours = 0;
        let empTotalNormalHours = 0;
        let empTotalOvertimeHours = 0;
        let empTotalYolParasi = 0;
        let empTotalDailyPay = 0;

        payroll.dailyRecords.forEach(record => {
          empTotalBreak += record.breakMinutes;
          empTotalWorkHours += record.workHours;
          empTotalNormalHours += record.normalHours;
          empTotalOvertimeHours += record.overtimeHours;
          empTotalYolParasi += record.yolParasi;
          empTotalDailyPay += record.dailyTotalPay;

          let statusStr = "";
          if (record.overtimeStatus === "normal") {
            statusStr = isKo ? "45h 이내" : "Normal (≤45sa)";
          } else if (record.overtimeStatus === "overtime") {
            statusStr = isKo ? "45h 초과 (150%)" : "Fazla Mesai (%150)";
          } else {
            statusStr = isKo ? "일부 초과(분할)" : "Kısmi Fazla";
          }

          const holidayStr = record.isHoliday 
            ? (isKo ? "공휴일 (200%)" : "Resmi Tatil (%200)") 
            : "-";

          empRows.push([
            record.workDate,
            isKo ? record.dayOfWeekKo : record.dayOfWeekTr,
            record.weekKey,
            record.clockInTime,
            record.clockOutTime,
            record.breakMinutes,
            record.workHours,
            record.normalHours,
            record.overtimeHours,
            statusStr,
            holidayStr,
            record.yolParasi,
            record.notes || "",
            record.dailyTotalPay
          ]);
        });

        // 직원별 일별 테이블 총합(합계) 행
        empRows.push([
          isKo ? "합계 (TOPLAM)" : "TOPLAM",
          "-",
          "-",
          "-",
          "-",
          empTotalBreak,
          Number(empTotalWorkHours.toFixed(2)),
          Number(empTotalNormalHours.toFixed(2)),
          Number(empTotalOvertimeHours.toFixed(2)),
          isKo ? `총 ${payroll.workedDaysCount}일 근무` : `${payroll.workedDaysCount} gün çalışma`,
          payroll.holidayWorkHours > 0 ? (isKo ? `공휴일 ${payroll.holidayWorkHours}시간` : `Resmi Tatil ${payroll.holidayWorkHours} sa`) : "-",
          empTotalYolParasi,
          isKo ? `연장 150% / 공휴일 200% 적용 완료` : `Fazla %150 / Tatil %200 dahil`,
          payroll.totalPay
        ]);

        const empWorksheet = XLSX.utils.aoa_to_sheet(empRows);

        // 일별 시트 열 너비 자동 보정
        const empColWidths = dailyHeaders.map((hdr, colIdx) => {
          let maxLen = hdr.length * 2;
          for (let r = 4; r < empRows.length; r++) {
            const val = empRows[r]?.[colIdx];
            if (val !== undefined && val !== null) {
              maxLen = Math.max(maxLen, String(val).length + 2);
            }
          }
          return { wch: Math.max(maxLen, 10) };
        });
        empWorksheet["!cols"] = empColWidths;

        XLSX.utils.book_append_sheet(workbook, empWorksheet, sheetName);
      });

      const fileName = isKo
        ? `inseoul_급여정산_${yearMonth}.xlsx`
        : `inseoul_Maas_Bordrosu_${yearMonth}.xlsx`;

      XLSX.writeFile(workbook, fileName);
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
            className="text-xs bg-white hover:bg-gray-50 text-gray-700 font-bold px-3 py-2 rounded-xl border border-gray-200 shadow-sm transition-colors"
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
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <input 
                type="month" 
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium outline-none w-full cursor-pointer"
              />
            </div>
            <button 
              onClick={handleDownloadExcel}
              disabled={isDownloading || loading || payrollSummaries.length === 0}
              className="flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm text-sm"
              title="전체 요약 및 직원별 개별 시트가 포함된 엑셀 파일을 다운로드합니다."
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {isDownloading ? t.downloading : t.downloadBtn}
            </button>
          </div>
        </div>

        {/* Overall Statistics Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{t.statsTotalStaff}</p>
              <h3 className="text-xl font-bold text-gray-800">{overallStats.totalStaff} <span className="text-xs font-normal text-gray-400">{lang === "tr" ? "kişi" : "명"}</span></h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{t.statsTotalHours}</p>
              <h3 className="text-xl font-bold text-gray-800">{overallStats.totalHours.toLocaleString()} <span className="text-xs font-normal text-gray-400">sa</span></h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{t.statsTotalOvertime}</p>
              <h3 className="text-xl font-bold text-purple-700">{overallStats.totalOvertimeHours.toLocaleString()} <span className="text-xs font-normal text-gray-400">sa</span></h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{t.statsTotalPayout}</p>
              <h3 className="text-xl font-bold text-emerald-600">{overallStats.totalPayout.toLocaleString()} <span className="text-xs font-normal text-gray-400">TL</span></h3>
            </div>
          </div>
        </div>

        {/* Main Payroll Table & Drilldown View */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-800">{t.tableTitle} ({yearMonth})</h3>
              <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full border border-blue-100">
                {t.activeCount} {filteredSummaries.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {filteredSummaries.length > 0 && (
                <button 
                  onClick={handleToggleAll}
                  className="text-xs bg-white hover:bg-gray-50 text-gray-700 font-semibold px-3 py-2 rounded-xl border border-gray-200 shadow-sm transition-colors whitespace-nowrap"
                >
                  {expandedEmployeeIds.size === filteredSummaries.length ? t.collapseAll : t.expandAll}
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left min-w-[1300px]">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-left">{t.colName}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-right">{t.colHourlyRate}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-right">{t.colYolParasiRate}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-center">{t.colWorkedDays}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-right">{t.colNormalHours}</th>
                  <th className="p-3.5 text-xs font-bold text-purple-700 text-right">{t.colOvertimeHours}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-800 text-right">{t.colTotalHours}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-right">{t.colBasePay}</th>
                  <th className="p-3.5 text-xs font-bold text-purple-700 text-right">{t.colOvertimePay}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-right">{t.colYolParasi}</th>
                  <th className="p-3.5 text-xs font-bold text-orange-600 text-right">{t.colHolidayHours}</th>
                  <th className="p-3.5 text-xs font-bold text-orange-600 text-right">{t.colHolidayPay}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-800 text-right">{t.colTotalPay}</th>
                  <th className="p-3.5 text-xs font-bold text-gray-600 text-center">{t.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={14} className="p-12 text-center text-gray-500 font-medium">{t.calculating}</td>
                  </tr>
                ) : filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-12 text-center text-gray-500 font-medium">{t.noRecords}</td>
                  </tr>
                ) : (
                  filteredSummaries.map((payroll) => {
                    const isExpanded = expandedEmployeeIds.has(payroll.employeeId);
                    return (
                      <React.Fragment key={payroll.employeeId}>
                        {/* Summary Row */}
                        <tr 
                          onClick={() => toggleEmployeeDetails(payroll.employeeId)}
                          className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${isExpanded ? "bg-blue-50/20" : ""}`}
                        >
                          <td className="p-3.5 font-bold text-gray-800 text-left">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
                                {payroll.employeeName.charAt(0)}
                              </div>
                              <span className="font-bold text-gray-800">{payroll.employeeName}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right text-gray-600 font-mono">{payroll.hourlyRate} TL</td>
                          <td className="p-3.5 text-right text-gray-600 font-mono">{payroll.yolParasiRate} TL</td>
                          <td className="p-3.5 text-center text-gray-600 font-semibold">{payroll.workedDaysCount} {lang === "tr" ? "gün" : "일"}</td>
                          <td className="p-3.5 text-right text-gray-600 font-medium font-mono">{payroll.normalWorkHours} sa</td>
                          <td className="p-3.5 text-right text-purple-600 font-semibold font-mono">{payroll.overtimeWorkHours > 0 ? `${payroll.overtimeWorkHours} sa` : "0 sa"}</td>
                          <td className="p-3.5 text-right text-gray-800 font-bold font-mono">{payroll.totalWorkHours} sa</td>
                          <td className="p-3.5 text-right text-gray-600 font-mono">{payroll.basePay.toLocaleString()} TL</td>
                          <td className="p-3.5 text-right text-purple-600 font-mono">{payroll.overtimePay.toLocaleString()} TL</td>
                          <td className="p-3.5 text-right text-gray-600 font-mono">{payroll.yolParasi.toLocaleString()} TL</td>
                          <td className="p-3.5 text-right text-orange-600 font-semibold font-mono">{payroll.holidayWorkHours > 0 ? `${payroll.holidayWorkHours} sa` : "0 sa"}</td>
                          <td className="p-3.5 text-right text-orange-600 font-bold font-mono">
                            {payroll.holidayAdditionalPay > 0 ? `+${payroll.holidayAdditionalPay.toLocaleString()} TL` : "0 TL"}
                          </td>
                          <td className="p-3.5 text-right font-bold text-base text-blue-600 font-mono bg-blue-50/30">
                            {payroll.totalPay.toLocaleString()} TL
                          </td>
                          <td className="p-3.5 text-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEmployeeDetails(payroll.employeeId);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                              title={isExpanded ? t.hideDetails : t.viewDetails}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Detailed Daily Breakdown Accordion */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={14} className="p-0 bg-gray-50/80 border-y border-blue-100">
                              <div className="p-5 space-y-3 animate-in fade-in duration-200">
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-bold text-sm text-gray-800">
                                      {payroll.employeeName} - {t.dailyDetailTitle} ({payroll.dailyRecords.length}{lang === "tr" ? " kayıt" : "건"})
                                    </h4>
                                  </div>
                                  <span className="text-xs text-blue-600 font-medium">
                                    {t.rowClickHint}
                                  </span>
                                </div>

                                <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                                  <table className="w-full text-xs text-left min-w-[1200px]">
                                    <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-600">
                                      <tr>
                                        <th className="p-3 font-bold text-left">{t.colDate}</th>
                                        <th className="p-3 font-bold text-center">{t.colDay}</th>
                                        <th className="p-3 font-bold text-center">{t.colWeek}</th>
                                        <th className="p-3 font-bold text-center">{t.colClockIn}</th>
                                        <th className="p-3 font-bold text-center">{t.colClockOut}</th>
                                        <th className="p-3 font-bold text-right">{t.colBreak}</th>
                                        <th className="p-3 font-bold text-right">{t.colDailyWorkHours}</th>
                                        <th className="p-3 font-bold text-right">{t.colDailyNormal}</th>
                                        <th className="p-3 font-bold text-right text-purple-600">{t.colDailyOvertime}</th>
                                        <th className="p-3 font-bold text-center">{t.colOvertimeStatus}</th>
                                        <th className="p-3 font-bold text-center">{t.colIsHoliday}</th>
                                        <th className="p-3 font-bold text-right">{t.colDailyYolParasi}</th>
                                        <th className="p-3 font-bold text-left">{t.colNotes}</th>
                                        <th className="p-3 font-bold text-right">{t.colDailyTotal}</th>
                                        <th className="p-3 font-bold text-center">{t.colDailyAction}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {payroll.dailyRecords.map((record) => (
                                        <tr 
                                          key={record.recordId} 
                                          onClick={() => openEditRecordModal(record)}
                                          className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                                          title={lang === "tr" ? "Düzenlemek için tıklayın" : "출퇴근 및 메모 수정을 위해 클릭하세요"}
                                        >
                                          <td className="p-3 font-semibold text-gray-800 font-mono text-left">{record.workDate}</td>
                                          <td className="p-3 text-center text-gray-600 font-medium">
                                            {lang === "ko" ? record.dayOfWeekKo : record.dayOfWeekTr}
                                          </td>
                                          <td className="p-3 text-center text-gray-500 font-mono text-[11px]">{record.weekKey}</td>
                                          <td className="p-3 text-center text-emerald-700 font-bold font-mono bg-emerald-50/40">{record.clockInTime}</td>
                                          <td className="p-3 text-center text-rose-700 font-bold font-mono bg-rose-50/40">{record.clockOutTime}</td>
                                          <td className="p-3 text-right text-gray-500 font-mono">{record.breakMinutes} dk</td>
                                          <td className="p-3 text-right font-bold text-gray-800 font-mono">{record.workHours} sa</td>
                                          <td className="p-3 text-right text-gray-700 font-mono">{record.normalHours} sa</td>
                                          <td className="p-3 text-right text-purple-600 font-bold font-mono">
                                            {record.overtimeHours > 0 ? `${record.overtimeHours} sa` : "-"}
                                          </td>
                                          <td className="p-3 text-center">
                                            {record.overtimeStatus === "normal" && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                                {t.statusNormal}
                                              </span>
                                            )}
                                            {record.overtimeStatus === "overtime" && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                {t.statusOvertime}
                                              </span>
                                            )}
                                            {record.overtimeStatus === "split" && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                {t.statusSplit}
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3 text-center">
                                            {record.isHoliday ? (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                                {t.badgeHoliday}
                                              </span>
                                            ) : (
                                              <span className="text-gray-300">-</span>
                                            )}
                                          </td>
                                          <td className="p-3 text-right text-gray-700 font-mono">
                                            {record.yolParasi > 0 ? `${record.yolParasi} TL` : "-"}
                                          </td>
                                          <td className="p-3 text-gray-500 max-w-xs truncate text-[11px] text-left" title={record.notes}>
                                            {record.notes || "-"}
                                          </td>
                                          <td className="p-3 text-right font-bold text-blue-600 font-mono bg-blue-50/10">
                                            {record.dailyTotalPay.toLocaleString()} TL
                                          </td>
                                          <td className="p-3 text-center">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditRecordModal(record);
                                              }}
                                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 group-hover:shadow-sm"
                                              title={t.editRecordBtn}
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    {/* Daily Table Footer Total */}
                                    <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-800">
                                      <tr>
                                        <td colSpan={5} className="p-3 text-center">{t.grandTotal}</td>
                                        <td className="p-3 text-right font-mono">
                                          {payroll.dailyRecords.reduce((sum, r) => sum + r.breakMinutes, 0)} dk
                                        </td>
                                        <td className="p-3 text-right font-mono text-gray-900">{payroll.totalWorkHours} sa</td>
                                        <td className="p-3 text-right font-mono">{payroll.normalWorkHours} sa</td>
                                        <td className="p-3 text-right font-mono text-purple-700">{payroll.overtimeWorkHours} sa</td>
                                        <td className="p-3 text-center text-xs text-gray-600">{payroll.workedDaysCount} {lang === "tr" ? "gün" : "일"}</td>
                                        <td className="p-3 text-center text-orange-600">
                                          {payroll.holidayWorkHours > 0 ? `${payroll.holidayWorkHours} sa` : "-"}
                                        </td>
                                        <td className="p-3 text-right font-mono">{payroll.yolParasi.toLocaleString()} TL</td>
                                        <td className="p-3 text-xs text-gray-500 text-left">
                                          {lang === "tr" ? "Fazla mesai %150 / Tatil %200" : "연장 150% / 공휴일 200% 산정"}
                                        </td>
                                        <td className="p-3 text-right text-sm text-blue-600 font-mono bg-blue-50/40">
                                          {payroll.totalPay.toLocaleString()} TL
                                        </td>
                                        <td></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* Table Bottom Grand Total Footer */}
              {filteredSummaries.length > 0 && (
                <tfoot className="bg-gray-100/80 border-t-2 border-gray-200 font-bold text-gray-800 text-xs">
                  <tr>
                    <td className="p-3.5 font-extrabold text-sm text-left">{t.grandTotal}</td>
                    <td className="p-3.5 text-right font-mono">-</td>
                    <td className="p-3.5 text-right font-mono">-</td>
                    <td className="p-3.5 text-center font-bold">{overallStats.totalWorkedDays} {lang === "tr" ? "gün" : "일"}</td>
                    <td className="p-3.5 text-right font-mono">{overallStats.totalNormalHours} sa</td>
                    <td className="p-3.5 text-right text-purple-700 font-mono">{overallStats.totalOvertimeHours} sa</td>
                    <td className="p-3.5 text-right font-mono text-sm">{overallStats.totalHours} sa</td>
                    <td className="p-3.5 text-right font-mono">{overallStats.totalBasePay.toLocaleString()} TL</td>
                    <td className="p-3.5 text-right text-purple-700 font-mono">{overallStats.totalOvertimePay.toLocaleString()} TL</td>
                    <td className="p-3.5 text-right font-mono">{overallStats.totalYolParasi.toLocaleString()} TL</td>
                    <td className="p-3.5 text-right text-orange-600 font-mono">{overallStats.totalHolidayHours} sa</td>
                    <td className="p-3.5 text-right text-orange-600 font-mono">+{overallStats.totalHolidayPay.toLocaleString()} TL</td>
                    <td className="p-3.5 text-right font-extrabold text-base text-blue-700 font-mono bg-blue-100/50">
                      {overallStats.totalPayout.toLocaleString()} TL
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block lg:hidden p-4 space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500 font-medium">{t.calculating}</div>
            ) : filteredSummaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-medium">{t.noRecords}</div>
            ) : (
              filteredSummaries.map((payroll) => {
                const isExpanded = expandedEmployeeIds.has(payroll.employeeId);
                return (
                  <div key={payroll.employeeId} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shadow-sm">
                          {payroll.employeeName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 text-base">{payroll.employeeName}</span>
                          <div className="text-xs text-gray-400">
                            {t.colHourlyRate}: {payroll.hourlyRate} TL | {t.colYolParasiRate}: {payroll.yolParasiRate} TL
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 font-semibold">
                        {payroll.workedDaysCount} {lang === "tr" ? "gün" : "일 근무"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600 pt-2 border-t border-gray-50">
                      <div>{t.colNormalHours}: <span className="font-semibold text-gray-800">{payroll.normalWorkHours} sa</span></div>
                      <div>{t.colOvertimeHours}: <span className="font-semibold text-purple-700">{payroll.overtimeWorkHours} sa</span></div>
                      <div>{t.colTotalHours}: <span className="font-bold text-gray-900">{payroll.totalWorkHours} sa</span></div>
                      <div>{t.colBasePay}: <span className="font-semibold text-gray-800">{payroll.basePay.toLocaleString()} TL</span></div>
                      <div>{t.colOvertimePay}: <span className="font-semibold text-purple-700">{payroll.overtimePay.toLocaleString()} TL</span></div>
                      <div>{t.colYolParasi}: <span className="font-semibold text-gray-800">{payroll.yolParasi.toLocaleString()} TL</span></div>
                      
                      {payroll.holidayWorkHours > 0 && (
                        <>
                          <div>{t.colHolidayHours}: <span className="font-semibold text-orange-600">{payroll.holidayWorkHours} sa</span></div>
                          <div>{t.colHolidayPay}: <span className="font-bold text-orange-600">+{payroll.holidayAdditionalPay.toLocaleString()} TL</span></div>
                        </>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-sm">
                      <span className="text-xs text-gray-400 font-medium">{t.colTotalPay}:</span>
                      <span className="font-extrabold text-blue-600 text-lg">{payroll.totalPay.toLocaleString()} TL</span>
                    </div>

                    {/* Drilldown Toggle Button */}
                    <button
                      onClick={() => toggleEmployeeDetails(payroll.employeeId)}
                      className="w-full mt-2 py-2 px-3 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-gray-200"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                          {t.hideDetails}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                          {t.viewDetails} ({payroll.dailyRecords.length}{lang === "tr" ? " gün" : "일"})
                        </>
                      )}
                    </button>

                    {/* Mobile Daily Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1">
                          <span>{t.dailyDetailTitle}</span>
                          <span className="text-[10px] text-blue-600 font-normal">{t.editPrompt || "수정하려면 터치"}</span>
                        </div>
                        {payroll.dailyRecords.map((record) => (
                          <div 
                            key={record.recordId} 
                            onClick={() => openEditRecordModal(record)}
                            className="p-3 bg-gray-50 hover:bg-blue-50/40 active:bg-blue-100/50 cursor-pointer rounded-xl border border-gray-200/80 text-xs space-y-2 transition-colors shadow-xs"
                          >
                            <div className="flex justify-between items-center font-bold">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-800">{record.workDate} ({lang === "ko" ? record.dayOfWeekKo : record.dayOfWeekTr})</span>
                                <span className="text-[10px] text-gray-400 font-normal">{record.weekKey}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-blue-600 font-mono">{record.dailyTotalPay.toLocaleString()} TL</span>
                                <span className="p-1 bg-white border border-gray-200 text-blue-600 rounded">
                                  <Edit2 className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between text-gray-600 text-[11px]">
                              <span>{t.colClockIn}: <b className="text-emerald-700">{record.clockInTime}</b></span>
                              <span>{t.colClockOut}: <b className="text-rose-700">{record.clockOutTime}</b></span>
                              <span>{t.colDailyWorkHours}: <b>{record.workHours} sa</b></span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {record.overtimeStatus === "normal" && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-semibold">
                                  {t.statusNormal} ({record.normalHours}sa)
                                </span>
                              )}
                              {record.overtimeStatus === "overtime" && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold">
                                  {t.statusOvertime} ({record.overtimeHours}sa)
                                </span>
                              )}
                              {record.overtimeStatus === "split" && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-semibold">
                                  {t.statusSplit} (≤45h: {record.normalHours}sa / &gt;45h: {record.overtimeHours}sa)
                                </span>
                              )}
                              {record.isHoliday && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-orange-100 text-orange-700 font-bold">
                                  {t.badgeHoliday}
                                </span>
                              )}
                              {record.yolParasi > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-medium">
                                  Yol: {record.yolParasi} TL
                                </span>
                              )}
                            </div>
                            {record.notes && (
                              <div className="text-[10px] text-gray-500 bg-white p-1.5 rounded border border-gray-100">
                                <b>Note:</b> {record.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 근태 기록 및 출퇴근 시간 수정 모달 (Edit Attendance Modal) */}
      {/* ======================================================== */}
      {editingRecord && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => !isSavingRecord && setEditingRecord(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  {t.editModalTitle}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{t.editModalSubtitle}</p>
              </div>
              <button 
                onClick={() => setEditingRecord(null)} 
                disabled={isSavingRecord}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Messages */}
            {editRecordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editRecordError}</span>
              </div>
            )}
            {editRecordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{editRecordSuccess}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              
              {/* Employee Name (Read Only) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">{t.empLabel}</label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-bold">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {editingRecord.employeeName.charAt(0)}
                  </div>
                  <span>{editingRecord.employeeName}</span>
                </div>
              </div>

              {/* Date and Break Minutes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{t.dateLabel}</label>
                  <input 
                    type="date" 
                    required 
                    value={editWorkDate} 
                    onChange={(e) => setEditWorkDate(e.target.value)} 
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs font-medium outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{t.breakLabel}</label>
                  <input 
                    type="number" 
                    required 
                    min={0} 
                    step={1}
                    value={editBreakMinutes} 
                    onChange={(e) => setEditBreakMinutes(Number(e.target.value))} 
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-xs font-mono outline-none" 
                  />
                </div>
              </div>

              {/* Clock In & Clock Out Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {t.clockInLabel}
                  </label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={editClockIn} 
                    onChange={(e) => setEditClockIn(e.target.value)} 
                    className="w-full p-2.5 bg-emerald-50/20 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800 text-xs font-mono outline-none" 
                  />
                </div>
                <div>
                  <label className="block font-semibold text-rose-800 mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {t.clockOutLabel}
                  </label>
                  <input 
                    type="datetime-local" 
                    value={editClockOut} 
                    onChange={(e) => setEditClockOut(e.target.value)} 
                    className="w-full p-2.5 bg-rose-50/20 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 text-gray-800 text-xs font-mono outline-none" 
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">{t.statusLabel}</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value as "working" | "completed")} 
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-800 text-xs outline-none bg-white cursor-pointer font-medium"
                >
                  <option value="completed">{t.statusCompleted}</option>
                  <option value="working">{t.statusWorking}</option>
                </select>
              </div>

              {/* Notes with Quick Tag */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-semibold text-gray-700">{t.notesLabel}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditNotes(prev => {
                        const tag = "Resmi tatil";
                        if (!prev) return tag;
                        if (prev.toLowerCase().includes("resmi tatil")) return prev;
                        return `${prev} | ${tag}`;
                      });
                    }}
                    className="text-[10px] font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-0.5 rounded-md border border-orange-200 transition-colors"
                  >
                    {t.quickTagHoliday}
                  </button>
                </div>
                <textarea 
                  value={editNotes} 
                  placeholder={t.notesPlaceholder} 
                  onChange={(e) => setEditNotes(e.target.value)} 
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-800 text-xs outline-none resize-none" 
                  rows={2} 
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditingRecord(null)} 
                  disabled={isSavingRecord}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-xs"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingRecord}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingRecord ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t.saving}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.save}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
