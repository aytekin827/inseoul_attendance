import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json({ error: 'Personel listesi alınamadı' }, { status: 500 });
    }

    // In a real production app, we might want to omit pin_code from this payload, 
    // but we'll include it here for the client-side PIN verification logic as requested in the simple flow.
    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/employees:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}
