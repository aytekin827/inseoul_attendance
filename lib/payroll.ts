import type { AttendanceRecord, Employee } from "@/types";

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
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
 * 날짜의 ISO 주차 키를 구합니다 (예: 2026-W35)
 */
export function getISOWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
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
 * 직원 목록과 한 달 치 근태 기록을 입력받아 급여 정산 요약 리스트를 반환합니다.
 */
export function calculateMonthlyPayroll(employees: Employee[], records: AttendanceRecord[]): PayrollSummary[] {
  const summaries: PayrollSummary[] = [];

  employees.forEach(emp => {
    // 해당 직원의 완료된 기록 조회
    const empRecords = records.filter(r => r.employee_id === emp.id && r.status === 'completed');
    
    // 1. 주차별 근무시간 분할 연산 (주 45시간 이하/초과 구분)
    const weeklyHoursMap: { [weekKey: string]: number } = {};
    let workedDaysCount = new Set<string>(); // 실제 출근일 계산
    let holidayWorkHours = 0; // 국경일 총 근무시간

    empRecords.forEach(record => {
      workedDaysCount.add(record.work_date);
      
      const hours = calculateWorkHours(record.clock_in, record.clock_out, record.break_minutes);
      
      // 주별 합산
      const weekKey = getISOWeekKey(record.work_date);
      weeklyHoursMap[weekKey] = (weeklyHoursMap[weekKey] || 0) + hours;

      // 국경일 근무시간 판정
      if (isTurkeyPublicHoliday(record.work_date, record.notes)) {
        holidayWorkHours += hours;
      }
    });

    let normalWorkHours = 0;
    let overtimeWorkHours = 0;

    Object.values(weeklyHoursMap).forEach(hours => {
      if (hours > 45) {
        normalWorkHours += 45;
        overtimeWorkHours += (hours - 45);
      } else {
        normalWorkHours += hours;
      }
    });

    // 소수점 보정
    normalWorkHours = Number(normalWorkHours.toFixed(2));
    overtimeWorkHours = Number(overtimeWorkHours.toFixed(2));
    const totalWorkHours = Number((normalWorkHours + overtimeWorkHours).toFixed(2));

    // 급여 계산
    const basePay = Math.floor(normalWorkHours * emp.hourly_rate);
    const overtimePay = Math.floor(overtimeWorkHours * emp.hourly_rate);
    
    // 주휴수당 (전체 근무시간 기준 계산)
    const weeklyHolidayAllowance = calculateWeeklyHolidayAllowance(totalWorkHours, emp.hourly_rate);

    // 욜파라 (교통비): 근무한 일수 * 일일 교통비 (직원 설정 교통비가 없으면 기본 100 TL)
    const yolParasiRate = emp.yol_parasi ?? 100;
    const yolParasi = workedDaysCount.size * yolParasiRate;

    // 국경일 추가 수당 (평일 근무의 2배수 급여 지급을 위해 추가 1배수 지급)
    const holidayAdditionalPay = Math.floor(holidayWorkHours * emp.hourly_rate);

    // 최종 급여 총합
    const totalPay = basePay + overtimePay + weeklyHolidayAllowance + yolParasi + holidayAdditionalPay;

    summaries.push({
      employeeId: emp.id,
      employeeName: emp.name,
      normalWorkHours,
      overtimeWorkHours,
      totalWorkHours,
      basePay,
      overtimePay,
      weeklyHolidayAllowance,
      yolParasi,
      holidayWorkHours: Number(holidayWorkHours.toFixed(2)),
      holidayAdditionalPay,
      totalPay,
      workedDaysCount: workedDaysCount.size
    });
  });

  return summaries;
}
