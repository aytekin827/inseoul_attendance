import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inseoul Attendance',
  description: '식당 매장 QR 기반 출퇴근 기록 및 사장님 급여 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
