import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendTelegramAlert } from '@/lib/telegram';
import { getTurkeyDateString, getTurkeyTimeString, getTurkeyHours } from '@/lib/time';

// GET: 근태 기록 조회
// - ?status=working : 실시간 근무자만 조회 (Canlı Çalışma Panosu 용)
// - ?yearMonth=YYYY-MM : 특정 월의 전체 근태 기록 조회 (월별 근태 목록 및 급여 정산 용)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const yearMonth = searchParams.get('yearMonth');

    console.log(`[Attendance API] GET request received. Filter status=${status}, yearMonth=${yearMonth}`);

    let query = supabase
      .from('attendance_records')
      .select('*, employees(name, hourly_rate)');

    if (status === 'working') {
      query = query.eq('status', 'working');
    } else if (yearMonth) {
      // YYYY-MM 형식의 시작일과 종료일 계산
      const startDate = `${yearMonth}-01`;
      // 해당 월의 마지막 날 계산 (안전하게 다음달 1일 미만으로 하거나 해당 월의 31일 등 범위 지정)
      const [year, month] = yearMonth.split('-').map(Number);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      query = query
        .gte('work_date', startDate)
        .lt('work_date', endDate);
    }

    const { data: records, error } = await query.order('work_date', { ascending: false }).order('clock_in', { ascending: false });

    if (error) {
      console.error("[Attendance API] Supabase error fetching attendance records:", error);
      return NextResponse.json({ error: 'Kayıtlar alınamadı' }, { status: 500 });
    }

    console.log(`[Attendance API] Successfully fetched ${records?.length || 0} records.`);
    return NextResponse.json({ records });
  } catch (err: any) {
    console.error('[Attendance API] Unexpected error in GET:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}

// POST: 출퇴근 등록 (기존 직원용 모바일 등록 로직 유지)
export async function POST(request: Request) {
  let requestData = null;
  try {
    requestData = await request.json();
    console.log("[Attendance API] POST Request Received:", requestData);

    const { employeeId, pinCode, action } = requestData;

    if (!employeeId || !pinCode || !action) {
      console.error("[Attendance API] Validation Failed: Missing fields in request", requestData);
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    // 1. Verify Employee and PIN
    console.log(`[Attendance API] Verifying employee ID: ${employeeId}`);
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, pin_code, name')
      .eq('id', employeeId)
      .single();

    if (empError) {
      console.error("[Attendance API] Supabase error fetching employee:", empError);
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    if (!employee) {
      console.error(`[Attendance API] Employee not found in DB for ID: ${employeeId}`);
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    if (employee.pin_code !== pinCode) {
      console.error(`[Attendance API] PIN Mismatch for Employee ID ${employeeId}. DB expected: ${employee.pin_code}, Request received: ${pinCode}`);
      return NextResponse.json({ error: 'Geçersiz PIN kodu' }, { status: 401 });
    }

    // 터키 시간대(UTC+3) 기준으로 오늘 날짜(YYYY-MM-DD) 및 시각 구하기
    const now = new Date();
    const today = getTurkeyDateString(now);
    const actualTimeStr = getTurkeyTimeString(now);

    if (action === 'clock_in') {
      console.log(`[Attendance API] Checking existing clock-in for Employee ID: ${employeeId} on Date: ${today}`);
      // Check if already working today
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('work_date', today)
        .eq('status', 'working')
        .maybeSingle();

      if (checkError) {
        console.error("[Attendance API] Supabase error checking existing clock-in:", checkError);
        throw checkError;
      }

      if (existingRecord) {
        console.error(`[Attendance API] Clock-in rejected. Employee ID ${employeeId} is already working today.`);
        return NextResponse.json({ error: 'Zaten giriş yapılmış ve çalışıyor.' }, { status: 400 });
      }

      // [보정 규칙] 오전조 출근 9:00: 9시 전에 와서 찍더라도 9시로 기록되도록 처리 (새벽 5시 ~ 아침 9시 사이 대상)
      const hours = getTurkeyHours(now);
      let clockInIso = now.toISOString();
      let notesText = null;
      let isAdjusted = false;

      if (hours >= 5 && hours < 9) {
        // 터키 시간 09:00:00 (UTC+3) 기준으로 정확히 저장
        clockInIso = new Date(`${today}T09:00:00+03:00`).toISOString();
        notesText = `[Giriş 보정] 실제 입력 시각: ${actualTimeStr}`;
        isAdjusted = true;
      }

      console.log(`[Attendance API] Inserting new clock-in record for Employee ID: ${employeeId} at: ${clockInIso}`);
      // Insert new working record
      const { data: newRecord, error: insertError } = await supabase
        .from('attendance_records')
        .insert([{
          employee_id: employeeId,
          work_date: today,
          clock_in: clockInIso,
          status: 'working',
          notes: notesText
        }])
        .select()
        .single();

      if (insertError) {
        console.error("[Attendance API] Supabase error inserting clock-in record:", insertError);
        throw insertError;
      }

      // 텔레그램 알림 발송
      const alertMsg = `🔔 <b>[근태 알림 / Giriş Bildirimi]</b>\n🟢 <b>출근 등록 (Giriş Yapıldı)</b>\n\n• <b>직원명 (Personel):</b> ${employee.name}\n• <b>날짜 (Tarih):</b> ${today}\n• <b>실제 등록 시간 (Gerçek Giriş):</b> ${actualTimeStr}${isAdjusted ? `\n• <b>보정 시간 (Düzeltilen Saat):</b> 09:00:00 (오전조 기준 적용)` : ''}`;
      await sendTelegramAlert(alertMsg);

      console.log("[Attendance API] Clocked in successfully:", newRecord);
      return NextResponse.json({ message: 'Giriş işlemi başarıyla tamamlandı', record: newRecord });
    } 
    
    else if (action === 'clock_out') {
      console.log(`[Attendance API] Finding active clock-in record for Employee ID: ${employeeId}`);
      // Find the currently working record
      const { data: activeRecord, error: checkError } = await supabase
        .from('attendance_records')
        .select('id, clock_in, notes')
        .eq('employee_id', employeeId)
        .eq('status', 'working')
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error("[Attendance API] Supabase error fetching active clock-in for clock-out:", checkError);
        throw checkError;
      }

      if (!activeRecord) {
        console.error(`[Attendance API] Clock-out rejected. No active working record found for Employee ID: ${employeeId}`);
        return NextResponse.json({ error: 'Çıkış yapmak için aktif bir giriş kaydı bulunamadı.' }, { status: 400 });
      }

      // [보정 규칙] 오후조 퇴근 22:00: 22시 전에 일찍 찍더라도 22시로 기록되도록 처리 (오후조 출근은 15:30으로 기입된 직원 즉, 13시 이후 출근 대상)
      const inHours = getTurkeyHours(new Date(activeRecord.clock_in));
      const outHours = getTurkeyHours(now);

      let clockOutIso = now.toISOString();
      let notesText = activeRecord.notes || null;
      let isAdjusted = false;

      if (inHours >= 13) {
        // 저녁 6시 ~ 밤 10시 사이 일찍 퇴근한 경우 22:00으로 보정
        if (outHours >= 18 && outHours < 22) {
          clockOutIso = new Date(`${today}T22:00:00+03:00`).toISOString();
          const adjustmentNote = `[Çıkış 보정] 실제 입력 시각: ${actualTimeStr}`;
          notesText = activeRecord.notes ? `${activeRecord.notes} | ${adjustmentNote}` : adjustmentNote;
          isAdjusted = true;
        }
      }

      console.log(`[Attendance API] Updating clock-out for Attendance Record ID: ${activeRecord.id} at: ${clockOutIso}`);
      // Update record to completed
      const { data: updatedRecord, error: updateError } = await supabase
        .from('attendance_records')
        .update({
          clock_out: clockOutIso,
          status: 'completed',
          notes: notesText
        })
        .eq('id', activeRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error("[Attendance API] Supabase error updating clock-out record:", updateError);
        throw updateError;
      }

      // 텔레그램 알림 발송
      const alertMsg = `🔔 <b>[근태 알림 / Çıkış Bildirimi]</b>\n🔴 <b>퇴근 등록 (Çıkış Yapıldı)</b>\n\n• <b>직원명 (Personel):</b> ${employee.name}\n• <b>날짜 (Tarih):</b> ${today}\n• <b>실제 등록 시간 (Gerçek Çıkış):</b> ${actualTimeStr}${isAdjusted ? `\n• <b>보정 시간 (Düzeltilen Saat):</b> 22:00:00 (오후조 기준 적용)` : ''}`;
      await sendTelegramAlert(alertMsg);

      console.log("[Attendance API] Clocked out successfully:", updatedRecord);
      return NextResponse.json({ message: 'Çıkış işlemi başarıyla tamamlandı', record: updatedRecord });
    } 
    
    else {
      console.error(`[Attendance API] Rejected. Invalid action requested: ${action}`);
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    }

  } catch (err: any) {
    console.error("[Attendance API] Unexpected Crash error:", err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}

// PUT: 근태 기록 정보 수동 수정 (사장님 전용)
export async function PUT(request: Request) {
  try {
    const { id, clockIn, clockOut, breakMinutes, status, notes, workDate } = await request.json();
    console.log("[Attendance API] PUT request received. Updating record ID:", id);

    if (!id || !clockIn || breakMinutes === undefined || !status || !workDate) {
      console.error("[Attendance API] Validation Failed: Missing fields for updating record");
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    const { data: updatedRecord, error } = await supabase
      .from('attendance_records')
      .update({
        work_date: workDate,
        clock_in: clockIn,
        clock_out: clockOut || null,
        break_minutes: breakMinutes,
        status: status,
        notes: notes || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("[Attendance API] Supabase error updating record:", error);
      return NextResponse.json({ error: 'Kayıt güncellenemedi' }, { status: 500 });
    }

    console.log("[Attendance API] Attendance record updated successfully:", updatedRecord);
    return NextResponse.json({ message: 'Kayıt başarıyla güncellendi', record: updatedRecord });
  } catch (err: any) {
    console.error('[Attendance API] Unexpected error in PUT /api/attendance:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluş투' }, { status: 500 });
  }
}
