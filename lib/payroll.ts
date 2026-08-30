import type { AttendanceRecord, Employee } from "@/types";

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  totalWorkHours: number;
  basePay: number;
  weeklyHolidayAllowance: number;
  totalPay: number;
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
    const empRecords = records.filter(r => r.employee_id === emp.id && r.status === 'completed');
    
    let totalWorkHours = 0;
    empRecords.forEach(record => {
      totalWorkHours += calculateWorkHours(record.clock_in, record.clock_out, record.break_minutes);
    });

    const basePay = Math.floor(totalWorkHours * emp.hourly_rate);
    const weeklyHolidayAllowance = calculateWeeklyHolidayAllowance(totalWorkHours, emp.hourly_rate);
    const totalPay = basePay + weeklyHolidayAllowance;

    summaries.push({
      employeeId: emp.id,
      employeeName: emp.name,
      totalWorkHours: Number(totalWorkHours.toFixed(2)),
      basePay,
      weeklyHolidayAllowance,
      totalPay
    });
  });

  return summaries;
}
