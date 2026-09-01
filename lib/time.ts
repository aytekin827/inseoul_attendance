/**
 * 튀르키예 표준시(UTC+3 / Europe/Istanbul) 전용 날짜 및 시간 처리 유틸리티
 * 튀르키예는 서머타임 없이 연중 일정한 UTC+3 시간대를 유지합니다.
 */

export const TURKEY_TIMEZONE = 'Europe/Istanbul';

/**
 * 튀르키예 기준 시간 문자열 포맷팅 (예: "09:15", "09:15:30")
 */
export function formatTurkeyTime(
  dateInput: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TURKEY_TIMEZONE,
    hour12: false,
    ...options
  }).format(date);
}

/**
 * 튀르키예 기준 "YYYY-MM-DD" 날짜 문자열 반환
 */
export function getTurkeyDateString(dateInput?: Date | string | null): string {
  const date = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TURKEY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * 튀르키예 기준 "HH:mm:ss" 시간 문자열 반환
 */
export function getTurkeyTimeString(dateInput?: Date | string | null): string {
  const date = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TURKEY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * 튀르키예 기준 시간(0-23) 숫자 반환
 */
export function getTurkeyHours(dateInput?: Date | string | null): number {
  const date = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(date.getTime())) return 0;

  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: TURKEY_TIMEZONE,
    hour: 'numeric',
    hour12: false
  }).format(date);

  return parseInt(hourStr, 10);
}

/**
 * HTML <input type="datetime-local"> 용 "YYYY-MM-DDTHH:mm" 형식 문자열 생성 (튀르키예 시간 기준)
 */
export function formatTurkeyDateTimeLocal(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TURKEY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach(p => { map[p.type] = p.value; });

  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

/**
 * HTML <input type="datetime-local"> 에서 입력받은 "YYYY-MM-DDTHH:mm" (튀르키예 시간)을
 * 정확한 UTC ISO 문자열로 변환합니다.
 */
export function parseTurkeyDateTimeLocal(datetimeLocalStr: string): string {
  if (!datetimeLocalStr) return '';
  // 튀르키예는 연중 UTC+3 (+03:00) 고정이므로 ISO 형식에 +03:00을 붙여 표준 파싱
  const withOffset = datetimeLocalStr.length === 16 
    ? `${datetimeLocalStr}:00+03:00` 
    : datetimeLocalStr.includes('+') 
      ? datetimeLocalStr 
      : `${datetimeLocalStr}+03:00`;

  return new Date(withOffset).toISOString();
}
