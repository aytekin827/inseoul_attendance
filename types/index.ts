export interface Employee {
  id: string;
  name: string;
  pin_code: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  status: 'working' | 'completed';
  notes: string | null;
  created_at: string;
}
