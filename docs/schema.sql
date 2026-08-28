-- 새송탄로타리클럽 이사회 성원보고·전자결재 시스템 — 초기 스키마
-- 실행 방법: Supabase 대시보드 > SQL Editor에 붙여넣고 직접 실행 (자동 실행 금지 원칙)
-- 작성 기준: docs/requirements.md 4장(데이터 모델), 7장(결정 사항, 2026-08-28 확정)

-- 1. terms (회기)
create table terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- 예: "26-27"
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. board_members (재적 이사 명부) — 회기마다 새 행 추가(이력 보존, 결정①)
create table board_members (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references terms(id),
  name text not null,
  position text not null,             -- 회장/총무/재무/.../이사/위원장 (자유 텍스트)
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. profiles (가입 계정 ↔ 명부 매칭)
create table profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  board_member_id uuid references board_members(id),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4. meetings (이사회 소집)
create table meetings (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references terms(id),
  meeting_date date not null,
  agenda text,
  status text not null default 'open' check (status in ('open', 'closed')),  -- 결정④: 관리자 수동 마감
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- 5. attendance_responses (참석 응답)
-- 결정③: 위임 수 제한 없음 → delegate_to_id에 UNIQUE 제약 없음 (한 이사가 여러 위임을 받을 수 있음)
create table attendance_responses (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id),
  board_member_id uuid not null references board_members(id),
  status text not null check (status in ('attend', 'delegate', 'absent')),
  delegate_to_id uuid references board_members(id),
  responded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_id, board_member_id)
);

-- status = 'delegate'일 때만 delegate_to_id 필수 (요구사항 3-4)
alter table attendance_responses
  add constraint delegate_to_required_when_delegating
  check (
    (status = 'delegate' and delegate_to_id is not null)
    or (status <> 'delegate' and delegate_to_id is null)
  );

-- 6. meeting_minutes (회의록) — 결정⑤: 시스템 내 저장·편집 기능 포함 (텍스트 생성만이 아님)
create table meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references meetings(id),
  content text,
  attendance_summary jsonb,           -- 작성 시점 성원현황 스냅샷(참석/위임/불참 명단, 정족수 충족 여부)
  status text not null default 'draft' check (status in ('draft', 'final')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 조회 성능용 인덱스
create index idx_board_members_term_id on board_members(term_id);
create index idx_meetings_term_id on meetings(term_id);
create index idx_attendance_responses_meeting_id on attendance_responses(meeting_id);
create index idx_profiles_board_member_id on profiles(board_member_id);
create index idx_meeting_minutes_meeting_id on meeting_minutes(meeting_id);

-- 안전장치 1: 이사 1명당 "승인된" 계정은 1개만 허용
-- (가입 신청 중인 pending 상태는 여러 건 있어도 되지만, approved는 1건만)
create unique index idx_profiles_board_member_id_approved
  on profiles(board_member_id)
  where approval_status = 'approved' and board_member_id is not null;

-- 안전장치 2: 회기(term) 중 "현재 활성"은 항상 1개만 허용
create unique index idx_terms_only_one_current
  on terms(is_current)
  where is_current = true;

-- 2026-08-29: 회의 마감 처리 기록 (요구사항 3-3~3-6, 성원현황 화면 "마감" 버튼용)
alter table meetings
  add column closed_by uuid references profiles(id),
  add column closed_at timestamptz;
