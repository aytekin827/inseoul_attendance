import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { employeeId, pinCode, action } = await request.json();

    if (!employeeId || !pinCode || !action) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    // 1. Verify Employee and PIN
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, pin_code')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    if (employee.pin_code !== pinCode) {
      return NextResponse.json({ error: 'Geçersiz PIN kodu' }, { status: 401 });
    }

    // Get current local date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    if (action === 'clock_in') {
      // Check if already working today
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('work_date', today)
        .eq('status', 'working')
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingRecord) {
        return NextResponse.json({ error: 'Zaten giriş yapılmış ve çalışıyor.' }, { status: 400 });
      }

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

      if (insertError) throw insertError;

      return NextResponse.json({ message: 'Giriş işlemi başarıyla tamamlandı', record: newRecord });
    } 
    
    else if (action === 'clock_out') {
      // Find the currently working record
      const { data: activeRecord, error: checkError } = await supabase
        .from('attendance_records')
        .select('id, clock_in')
        .eq('employee_id', employeeId)
        .eq('status', 'working')
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!activeRecord) {
        return NextResponse.json({ error: 'Çıkış yapmak için aktif bir giriş kaydı bulunamadı.' }, { status: 400 });
      }

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

      if (updateError) throw updateError;

      return NextResponse.json({ message: 'Çıkış işlemi başarıyla tamamlandı', record: updatedRecord });
    } 
    
    else {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Attendance API Error:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}
