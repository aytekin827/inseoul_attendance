import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log("[Employees API] GET request received. Fetching active employees...");
    
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error("[Employees API] Supabase error fetching active employees:", error);
      return NextResponse.json({ error: 'Personel listesi alınamadı' }, { status: 500 });
    }

    console.log(`[Employees API] Successfully fetched ${employees?.length || 0} active employees.`);
    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error('[Employees API] Unexpected error in GET /api/employees:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}
