import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inseoul Attendance',
  description: 'Restoran QR tabanlı giriş-çıkış kaydı ve patron maaş yönetim sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
