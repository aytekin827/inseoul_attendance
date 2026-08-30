import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  let requestData = null;
  try {
    requestData = await request.json();
    console.log("[Attendance API] Request Received:", requestData);

    const { employeeId, pinCode, action } = requestData;

    if (!employeeId || !pinCode || !action) {
      console.error("[Attendance API] Validation Failed: Missing fields in request", requestData);
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    // 1. Verify Employee and PIN
    console.log(`[Attendance API] Verifying employee ID: ${employeeId}`);
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, pin_code')
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

    // Get current local date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

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

      console.log(`[Attendance API] Inserting new clock-in record for Employee ID: ${employeeId}`);
      // Insert new working record
      const { data: newRecord, error: insertError } = await supabase
        .from('attendance_records')
        .insert([{
          employee_id: employeeId,
          work_date: today,
          status: 'working'
        }])
        .select()
        .single();

      if (insertError) {
        console.error("[Attendance API] Supabase error inserting clock-in record:", insertError);
        throw insertError;
      }

      console.log("[Attendance API] Clocked in successfully:", newRecord);
      return NextResponse.json({ message: 'Giriş işlemi başarıyla tamamlandı', record: newRecord });
    } 
    
    else if (action === 'clock_out') {
      console.log(`[Attendance API] Finding active clock-in record for Employee ID: ${employeeId}`);
      // Find the currently working record
      const { data: activeRecord, error: checkError } = await supabase
        .from('attendance_records')
        .select('id, clock_in')
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

      console.log(`[Attendance API] Updating clock-out for Attendance Record ID: ${activeRecord.id}`);
      // Update record to completed
      const { data: updatedRecord, error: updateError } = await supabase
        .from('attendance_records')
        .update({
          clock_out: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', activeRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error("[Attendance API] Supabase error updating clock-out record:", updateError);
        throw updateError;
      }

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
