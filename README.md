# Inseoul Attendance (식당 근태 및 급여 관리 시스템 - Türkçe Destekli)

식당 매장에 비치된 고정 QR 코드를 통해 직원들이 스마트폰으로 출퇴근을 기록하고, 사장님이 실시간 근태 확인, 기록 수정, 급여 및 주휴수당 정산을 수행할 수 있는 풀스택 웹 애플리케이션입니다. 
전체 UI 및 API 메시지가 **터키어(Türkçe)**로 로컬라이징되어 제공됩니다.

## 🚀 주요 기능

- **다국어 지원 (터키어 완벽 지원)**
  - UI 화면(직원 화면, 사장님 관리자 대시보드, 정산 화면) 및 서버 API 에러/성공 메시지가 터키어로 구성되어 있습니다.

- **직원용 모바일 출퇴근 페이지**
  - 고정 QR 스캔 후 진입 (모바일 최적화 카드 UI)
  - 직원 목록 선택 및 4자리 숫자 PIN 번호 인증
  - 출근 / 퇴근 버튼 원클릭 기록 및 유효성 검증

- **보안 기능 (관리자 비밀번호 게이트)**
  - 사장님 메뉴 진입 시 관리자 전용 비밀번호 인증 절차를 거칩니다. (기본 비밀번호: `1234`)
  - 관리자 화면 내에서 현재 비밀번호를 인증하고 새로운 비밀번호로 동적 변경이 가능합니다.

- **사장님 관리자 대시보드 (반응형 모바일 지원)**
  - **실시간 근무 보드:** 현재 근무 중인 직원 및 근무 경과 시간 실시간 확인
  - **월별 근태 목록:** 날짜별/직원별 근태 기록 조회 및 관리 (수동 수정 모달 지원)
  - **직원 관리:** 신규 직원 등록, 시급 설정, 기존 직원 정보 수정 및 비활성화 처리
  - **반응형 웹:** 모바일 접속 시 사이드바는 서랍형(Drawer) 햄버거 메뉴로 전환되며, 복잡한 표(Table)는 모바일 전용 카드 리스트 뷰로 최적화되어 렌더링됩니다.

- **급여 정산 및 엑셀 다운로드**
  - 기준 연/월별 직원 총 실근무시간(휴게시간 차감) 및 기본급 연산
  - 주휴수당(주 평균 15시간 이상 근무 시 법정 기준 적용) 자동 합산
  - 클릭 한 번으로 모든 상세 내역을 포함한 터키어 인코딩 적용 CSV(엑셀) 파일 생성 및 내보내기

## 🛠 기술 스택

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Lucide React
- **Backend & Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## 📂 프로젝트 구조

```text
inseoul_attendance/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── auth/route.ts    # 관리자 로그인 인증 및 비밀번호 변경 API
│   │   ├── attendance/route.ts  # 출/퇴근 처리 및 사장님용 근태 이력 조회/수정 API
│   │   └── employees/route.ts   # 사장님용 전체 직원 관리 및 직원용 활성 직원 조회 API
│   ├── admin/
│   │   ├── page.tsx             # 사장님 대시보드 (실시간 근무 보드, 근태 목록, 직원 관리, 비밀번호 변경)
│   │   └── payroll/
│   │       └── page.tsx         # 급여 정산 및 상세 내역 CSV 다운로드 UI
│   ├── layout.tsx               # 공통 레이아웃 (HTML lang="tr" 및 메타데이터 설정)
│   ├── page.tsx                 # 직원용 모바일 출퇴근 메인 화면
│   └── globals.css              # 글로벌 스타일 및 Tailwind 지시어
├── lib/
│   ├── payroll.ts               # 근무 시간 및 주휴수당 등 핵심 비즈니스 로직 연산 유틸
│   └── supabaseClient.ts        # Supabase 연동 클라이언트 인스턴스
├── types/
│   └── index.ts                 # Database 스키마 및 공통 타입 정의 (Employee, AttendanceRecord)
├── .env.local                   # 로컬 환경 변수 (Supabase URL, Key)
└── (설정 파일들: package.json, tailwind.config.js, tsconfig.json 등)
```

## ⚙️ 설정 및 배포 가이드 (Vercel + Supabase)

### 1. 데이터베이스(Supabase) 설정
1. [Supabase](https://supabase.com/) 접속 후 새 프로젝트를 생성합니다.
2. 좌측 메뉴 **SQL Editor**에서 아래 스크립트를 실행해 테이블을 만듭니다.
   ```sql
   -- 1. 직원 테이블 생성
   CREATE TABLE employees (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(50) NOT NULL,
       pin_code VARCHAR(4) NOT NULL,
       hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 10000,
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMPTZ DEFAULT now()
   );

   -- 2. 근태 기록 테이블 생성
   CREATE TABLE attendance_records (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
       work_date DATE NOT NULL DEFAULT CURRENT_DATE,
       clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
       clock_out TIMESTAMPTZ,
       break_minutes INT DEFAULT 0,
       status VARCHAR(20) DEFAULT 'working',
       notes TEXT,
       created_at TIMESTAMPTZ DEFAULT now()
   );

   -- 3. 관리자 설정(비밀번호 등) 테이블 생성 및 기본 비밀번호 '1234' 삽입
   CREATE TABLE admin_settings (
       key VARCHAR(50) PRIMARY KEY,
       value TEXT NOT NULL
   );
   INSERT INTO admin_settings (key, value) VALUES ('admin_password', '1234');
   ```
3. `Project Settings` > `API` 설정에서 **Project URL**과 **anon public key** 값을 복사해 둡니다.

### 2. Vercel 배포
1. 본인의 GitHub 리포지토리를 [Vercel](https://vercel.com/)에 **Import Project** 합니다.
2. 배포 설정 페이지 하단의 **Environment Variables**에 위에서 복사한 값을 추가합니다:
   - Name: `NEXT_PUBLIC_SUPABASE_URL` / Value: (복사한 Project URL)
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` / Value: (복사한 anon key)
3. **[Deploy]** 버튼을 누릅니다. Vercel이 자동으로 프로젝트를 빌드하고 도메인을 할당하여 배포를 완료합니다!
