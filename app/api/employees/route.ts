import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET: 직원 목록 조회 (쿼리 스트링 ?all=true 이면 전체 조회, 없으면 활성 직원만 조회)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    
    console.log(`[Employees API] GET request received. Fetching employees (all=${all})...`);

    let query = supabase.from('employees').select('*');
    
    if (!all) {
      query = query.eq('is_active', true);
    }
    
    const { data: employees, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error("[Employees API] Supabase error fetching employees:", error);
      return NextResponse.json({ error: 'Personel listesi alınamadı' }, { status: 500 });
    }

    console.log(`[Employees API] Successfully fetched ${employees?.length || 0} employees.`);
    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error('[Employees API] Unexpected error in GET /api/employees:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}

// POST: 신규 직원 등록
export async function POST(request: Request) {
  try {
    const { name, pinCode, hourlyRate, yolParasi } = await request.json();
    console.log("[Employees API] POST request received. Adding new employee:", { name, hourlyRate, yolParasi });

    if (!name || !pinCode || !hourlyRate) {
      console.error("[Employees API] Validation Failed: Missing fields for new employee");
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    const insertObj: any = {
      name,
      pin_code: pinCode,
      hourly_rate: hourlyRate,
      is_active: true
    };
    if (yolParasi !== undefined) {
      insertObj.yol_parasi = yolParasi;
    }

    let { data: newEmployee, error } = await supabase
      .from('employees')
      .insert([insertObj])
      .select()
      .single();

    // yol_parasi 컬럼이 DB에 없는 경우(42703) 안전하게 빼고 재시도
    if (error && error.code === '42703') {
      console.warn("[Employees API] yol_parasi column is missing. Retrying insert without yol_parasi...");
      delete insertObj.yol_parasi;
      const retryResult = await supabase
        .from('employees')
        .insert([insertObj])
        .select()
        .single();
      newEmployee = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error("[Employees API] Supabase error inserting employee:", error);
      return NextResponse.json({ error: 'Personel eklenemedi' }, { status: 500 });
    }

    console.log("[Employees API] Employee added successfully:", newEmployee);
    return NextResponse.json({ message: 'Personel başarıyla eklendi', employee: newEmployee });
  } catch (err: any) {
    console.error('[Employees API] Unexpected error in POST /api/employees:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}

// PUT: 직원 정보 수정 (정보 변경 및 활성/비활성 처리)
export async function PUT(request: Request) {
  try {
    const { id, name, pinCode, hourlyRate, isActive, yolParasi } = await request.json();
    console.log("[Employees API] PUT request received. Updating employee:", { id, name, hourlyRate, isActive, yolParasi });

    if (!id || !name || !pinCode || hourlyRate === undefined || isActive === undefined) {
      console.error("[Employees API] Validation Failed: Missing fields for updating employee");
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    const updateObj: any = {
      name,
      pin_code: pinCode,
      hourly_rate: hourlyRate,
      is_active: isActive
    };
    if (yolParasi !== undefined) {
      updateObj.yol_parasi = yolParasi;
    }

    let { data: updatedEmployee, error } = await supabase
      .from('employees')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    // yol_parasi 컬럼이 DB에 없는 경우(42703) 안전하게 빼고 재시도
    if (error && error.code === '42703') {
      console.warn("[Employees API] yol_parasi column is missing. Retrying update without yol_parasi...");
      delete updateObj.yol_parasi;
      const retryResult = await supabase
        .from('employees')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();
      updatedEmployee = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error("[Employees API] Supabase error updating employee:", error);
      return NextResponse.json({ error: 'Personel bilgileri güncellenemedi' }, { status: 500 });
    }

    console.log("[Employees API] Employee updated successfully:", updatedEmployee);
    return NextResponse.json({ message: 'Personel başarıyla güncellendi', employee: updatedEmployee });
  } catch (err: any) {
    console.error('[Employees API] Unexpected error in PUT /api/employees:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}
