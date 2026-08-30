import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { action, password, currentPassword, newPassword } = await request.json();

    if (action === 'verify') {
      if (!password) {
        return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
      }

      // settings 테이블에서 비밀번호 조회
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password')
        .single();

      if (error || !data) {
        console.error("[Admin Auth API] Error fetching admin password:", error);
        // 테이블이 아직 생성되지 않았다면 안전 장치로 기본 비밀번호 '1234'로 세팅 허용 (락아웃 방지)
        if (error?.code === 'PGRST116' || error?.message?.includes('relation "admin_settings" does not exist')) {
          console.warn("[Admin Auth API] admin_settings table not found. Using default password '1234' as fallback.");
          const isMatch = password === '1234';
          return NextResponse.json({ success: isMatch });
        }
        return NextResponse.json({ error: 'Şifre doğrulanamadı' }, { status: 500 });
      }

      const isMatch = data.value === password;
      return NextResponse.json({ success: isMatch });
    } 
    
    else if (action === 'change') {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
      }

      // 기존 비밀번호 검증
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password')
        .single();

      if (error || !data) {
        console.error("[Admin Auth API] Error fetching admin password for change:", error);
        return NextResponse.json({ error: 'Ayarlar tablosu bulunamadı. Lütfen SQL scriptini çalıştırın.' }, { status: 500 });
      }

      if (data.value !== currentPassword) {
        return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 });
      }

      // 비밀번호 업데이트
      const { error: updateError } = await supabase
        .from('admin_settings')
        .update({ value: newPassword })
        .eq('key', 'admin_password');

      if (updateError) {
        console.error("[Admin Auth API] Error updating admin password:", updateError);
        return NextResponse.json({ error: 'Şifre güncellenemedi' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Şifre başarıyla güncellendi' });
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Auth API] Unexpected error:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu' }, { status: 500 });
  }
}
