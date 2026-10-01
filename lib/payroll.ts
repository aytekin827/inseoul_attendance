import type { AttendanceRecord, Employee } from "@/types";
import { formatTurkeyTime } from "@/lib/time";

export interface DailyPayrollRecord {
  recordId: string;
  workDate: string;             // YYYY-MM-DD
  dayOfWeekKo: string;          // 월, 화, 수, 목, 금, 토, 일
  dayOfWeekTr: string;          // Pzt, Sal, Çar, Per, Cum, Cmt, Paz
  weekKey: string;              // e.g. "2026-W35"
  clockIn: string;              // ISO
  clockInTime: string;          // "HH:mm" (Turkey time)
  clockOut: string | null;      // ISO
  clockOutTime: string;         // "HH:mm" (Turkey time)
  breakMinutes: number;         // 분 (mola)
  workHours: number;            // 실 근무시간 (시간)
  normalHours: number;          // 주 45h 이내 근무시간
  overtimeHours: number;        // 주 45h 초과 근무시간
  isOvertime: boolean;          // 45시간 초과 발생 여부
  overtimeStatus: 'normal' | 'overtime' | 'split'; // 정상(이내) / 초과 / 일부초과
  isHoliday: boolean;           // 공식 국경일 여부
  notes: string;                // 메모 (보정 내역 등)
  yolParasi: number;            // 당일 교통비 (TL)
  hourlyRate: number;           // 적용 시급 (TL)
  basePay: number;              // 당일 기본급 (normalHours * hourlyRate)
  overtimePay: number;          // 당일 연장수당 (overtimeHours * hourlyRate)
  holidayAdditionalPay: number; // 당일 국경일 추가수당
  dailyTotalPay: number;        // 당일 총 합계
}

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  hourlyRate: number;             // 시급
  yolParasiRate: number;          // 1일 교통비 단가
  normalWorkHours: number;        // 주 45시간 이하 근무합계
  overtimeWorkHours: number;      // 주 45시간 초과 근무합계
  totalWorkHours: number;         // 총 근무 시간
  basePay: number;                // 기본급 (normalWorkHours * hourly_rate)
  overtimePay: number;            // 연장 수당 (overtimeWorkHours * hourly_rate)
  weeklyHolidayAllowance: number; // 주휴수당 (Haftalık Tatil Ücreti)
  yolParasi: number;              // 교통비 (일수 * yol_parasi)
  holidayWorkHours: number;       // 국경일 근무시간
  holidayAdditionalPay: number;   // 국경일 추가수당 (평일 근무의 2배수 지급용 추가 1배수 계산)
  totalPay: number;               // 최종 지급액
  workedDaysCount: number;        // 실제 근무 일수
  dailyRecords: DailyPayrollRecord[]; // 일별 상세 내역
}

/**
 * 터키 국경일(Resmi Tatiller) 여부를 판단합니다.
 * 1) 고정 국경일 체크 (MM-DD)
 * 2) 메모란에 'Resmi tatil' 문구 포함 여부 체크 (대소문자 무관)
 */
export function isTurkeyPublicHoliday(dateStr: string, notes: string | null): boolean {
  if (notes && notes.toLowerCase().includes("resmi tatil")) {
    return true;
  }

  const parts = dateStr.split("-"); // YYYY-MM-DD
  if (parts.length >= 3) {
    const mmdd = `${parts[1]}-${parts[2]}`;
    // 터키 공식 고정 국경일 목록
    // 01-01: 신정 (Yılbaşı)
    // 04-23: 어린이날 (Ulusal Egemenlik ve Çocuk Bayramı)
    // 05-01: 노동절 (Emek ve Dayanışma Günü)
    // 05-19: 청소년의날 (Atatürk'ü Anma, Gençlik ve Spor Bayramı)
    // 07-15: 민주주의의날 (Demokrasi ve Milli Birlik Günü)
    // 08-30: 승전기념일 (Zafer Bayramı)
    // 10-29: 공화국선포일 (Cumhuriyet Bayramı)
    const fixedHolidays = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"];
    if (fixedHolidays.includes(mmdd)) {
      return true;
    }
  }

  return false;
}

/**
 * 날짜의 요일을 반환합니다 (KO / TR)
 */
export function getDayOfWeek(dateStr: string): { ko: string; tr: string } {
  const parts = dateStr.split('-');
  if (parts.length < 3) return { ko: '-', tr: '-' };
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(Date.UTC(y, m, d));
  const dayIdx = date.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  
  const koDays = ["일", "월", "화", "수", "목", "금", "토"];
  const trDays = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  
  return {
    ko: koDays[dayIdx] || '-',
    tr: trDays[dayIdx] || '-'
  };
}

/**
 * 날짜의 ISO 주차 키를 구합니다 (예: 2026-W35)
 */
export function getISOWeekKey(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return 'Unknown';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const d = new Date(Date.UTC(year, month, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * 출/퇴근 시간과 휴게시간(분)을 바탕으로 실 근무시간(시간 단위, 소수점 2자리)을 계산합니다.
 */
export function calculateWorkHours(clockIn: string, clockOut: string | null, breakMinutes: number): number {
  if (!clockOut) return 0;
  
  const inTime = new Date(clockIn).getTime();
  const outTime = new Date(clockOut).getTime();
  
  const durationMs = outTime - inTime;
  const durationMinutes = durationMs / (1000 * 60);
  
  // 총 근무 분(분)에서 휴게시간(분)을 뺌 (최소 0 이상)
  const actualWorkMinutes = Math.max(0, durationMinutes - breakMinutes);
  
  return Number((actualWorkMinutes / 60).toFixed(2));
}

/**
 * 주휴수당 계산 로직 (월 단위 약식 계산)
 * - 한 달(4.345주) 기준 주당 평균 근무시간이 15시간 이상일 경우 발생
 * - 법정 수식: (1주 총 근로시간 / 40시간) * 8시간 * 시급
 */
export function calculateWeeklyHolidayAllowance(totalWorkHours: number, hourlyRate: number): number {
  const avgWeeksPerMonth = 4.345;
  const avgWeeklyHours = totalWorkHours / avgWeeksPerMonth;
  
  if (avgWeeklyHours >= 15) {
    // 최대 40시간까지만 비례 인정
    const weeklyHolidayHours = Math.min(avgWeeklyHours, 40) * (8 / 40);
    // 한 달(4.345주) 치 주휴수당 총합 계산
    return Math.floor(weeklyHolidayHours * avgWeeksPerMonth * hourlyRate);
  }
  
  return 0;
}

/**
 * 직원 목록과 한 달 치 근태 기록을 입력받아 급여 정산 요약 리스트 및 일별 상세 내역을 반환합니다.
 */
export function calculateMonthlyPayroll(employees: Employee[], records: AttendanceRecord[]): PayrollSummary[] {
  const summaries: PayrollSummary[] = [];

  employees.forEach(emp => {
    // 해당 직원의 완료된 기록 조회 및 날짜/시간순 오름차순 정렬
    const empRecords = records
      .filter(r => r.employee_id === emp.id && r.status === 'completed')
      .sort((a, b) => {
        if (a.work_date !== b.work_date) {
          return a.work_date.localeCompare(b.work_date);
        }
        return new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime();
      });
    
    const hourlyRate = emp.hourly_rate || 0;
    const yolParasiRate = emp.yol_parasi ?? 100;

    // 주차별 누적 근무시간 추적용 맵
    const weeklyHoursAccumulator: { [weekKey: string]: number } = {};
    const workedDatesSet = new Set<string>();
    const dailyRecords: DailyPayrollRecord[] = [];

    empRecords.forEach(record => {
      const workHours = calculateWorkHours(record.clock_in, record.clock_out, record.break_minutes);
      const weekKey = getISOWeekKey(record.work_date);
      const prevWeekHours = weeklyHoursAccumulator[weekKey] || 0;

      let normalHours = 0;
      let overtimeHours = 0;
      let overtimeStatus: 'normal' | 'overtime' | 'split' = 'normal';

      // 45시간 이내 / 초과 분할 판정
      if (prevWeekHours >= 45) {
        normalHours = 0;
        overtimeHours = workHours;
        overtimeStatus = 'overtime';
      } else if (prevWeekHours + workHours <= 45) {
        normalHours = workHours;
        overtimeHours = 0;
        overtimeStatus = 'normal';
      } else {
        normalHours = Number((45 - prevWeekHours).toFixed(2));
        overtimeHours = Number((workHours - normalHours).toFixed(2));
        overtimeStatus = 'split';
      }

      weeklyHoursAccumulator[weekKey] = prevWeekHours + workHours;

      // 당일 교통비: 하루에 첫 근무 건에만 지급 (중복 합산 방지)
      let dailyYolParasi = 0;
      if (!workedDatesSet.has(record.work_date)) {
        dailyYolParasi = yolParasiRate;
        workedDatesSet.add(record.work_date);
      }

      // 국경일 판정
      const isHoliday = isTurkeyPublicHoliday(record.work_date, record.notes);
      const holidayAdditionalPay = isHoliday ? Math.floor(workHours * hourlyRate) : 0;
      const basePay = Math.floor(normalHours * hourlyRate);
      const overtimePay = Math.floor(overtimeHours * hourlyRate);
      const dailyTotalPay = basePay + overtimePay + holidayAdditionalPay + dailyYolParasi;

      const clockInTime = formatTurkeyTime(record.clock_in);
      const clockOutTime = record.clock_out ? formatTurkeyTime(record.clock_out) : '-';
      const days = getDayOfWeek(record.work_date);

      dailyRecords.push({
        recordId: record.id,
        workDate: record.work_date,
        dayOfWeekKo: days.ko,
        dayOfWeekTr: days.tr,
        weekKey,
        clockIn: record.clock_in,
        clockInTime,
        clockOut: record.clock_out,
        clockOutTime,
        breakMinutes: record.break_minutes || 0,
        workHours,
        normalHours,
        overtimeHours,
        isOvertime: overtimeHours > 0,
        overtimeStatus,
        isHoliday,
        notes: record.notes || '',
        yolParasi: dailyYolParasi,
        hourlyRate,
        basePay,
        overtimePay,
        holidayAdditionalPay,
        dailyTotalPay
      });
    });

    // 전체 근무시간 및 수당 합산
    let normalWorkHours = 0;
    let overtimeWorkHours = 0;
    let holidayWorkHours = 0;

    dailyRecords.forEach(dr => {
      normalWorkHours += dr.normalHours;
      overtimeWorkHours += dr.overtimeHours;
      if (dr.isHoliday) {
        holidayWorkHours += dr.workHours;
      }
    });

    normalWorkHours = Number(normalWorkHours.toFixed(2));
    overtimeWorkHours = Number(overtimeWorkHours.toFixed(2));
    holidayWorkHours = Number(holidayWorkHours.toFixed(2));
    const totalWorkHours = Number((normalWorkHours + overtimeWorkHours).toFixed(2));

    const basePay = Math.floor(normalWorkHours * hourlyRate);
    const overtimePay = Math.floor(overtimeWorkHours * hourlyRate);
    const weeklyHolidayAllowance = calculateWeeklyHolidayAllowance(totalWorkHours, hourlyRate);
    const yolParasi = workedDatesSet.size * yolParasiRate;
    const holidayAdditionalPay = Math.floor(holidayWorkHours * hourlyRate);
    const totalPay = basePay + overtimePay + weeklyHolidayAllowance + yolParasi + holidayAdditionalPay;

    summaries.push({
      employeeId: emp.id,
      employeeName: emp.name,
      hourlyRate,
      yolParasiRate,
      normalWorkHours,
      overtimeWorkHours,
      totalWorkHours,
      basePay,
      overtimePay,
      weeklyHolidayAllowance,
      yolParasi,
      holidayWorkHours,
      holidayAdditionalPay,
      totalPay,
      workedDaysCount: workedDatesSet.size,
      dailyRecords
    });
  });

  return summaries;
}

