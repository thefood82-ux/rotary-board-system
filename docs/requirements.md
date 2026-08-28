# 새송탄로타리클럽 이사회 성원보고·전자결재 시스템 — 요구사항 정의서

- 프로젝트명(가칭): `rotary-board-system`
- 작성일: 2026-08-28
- 최종 확정일: 2026-08-28
- 상태: **확정 — 아래 "결정 사항" 답변 완료**

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 목적 | 이사회 소집 시 재적 이사 22명의 참석/위임/불참 응답을 온라인으로 받아 정족수를 실시간 집계하고, 회의록에 성원현황을 자동 반영 |
| 기존 시스템과의 관계 | `rotary-accounting-system`(회계)과 **완전 독립** — 별도 GitHub / Supabase / Vercel |
| 기술 스택 | Next.js + Supabase(Postgres, Auth) + Vercel + GitHub (회계 시스템과 동일) |
| 로컬 작업 폴더 | `C:\Users\user253-1\claude-work\rotary-board-system` |

---

## 2. 사용자 역할

| 역할 | 설명 |
|---|---|
| **admin(관리자)** | 총무(임상재). 명부 관리, 가입 승인, 소집 등록, 성원현황 조회 |
| **member(이사)** | 재적 이사 22명. 본인 계정으로 로그인 후 참석/위임/불참 응답만 가능 |

> admin 권한을 회장에게도 부여할지는 **결정 필요 사항 ⑦** 참고.

---

## 3. 기능 요구사항

### 3-1. 재적 이사 명부 관리 (관리자)
- 재적 22명 = 회장·총무·재무·윤리위원장·클럽트레이너·클럽코디네이터·주무사찰·상조회장 각 1명(8명) + 이사 7명 + 위원장 7명
  (상조사찰은 별도 직책이 아니라 상조회장과 같은 의미)
- 관리자가 이름·직책을 **직접 입력/수정** (직책 문자열 자동판별 없음)
- 회기(예: "26-27")마다 명부를 재지정 가능해야 함

### 3-2. 회원가입 및 승인
- 22명이 각자 이메일로 **직접 회원가입** (Supabase Auth 이메일/비밀번호 또는 매직링크)
- 가입 시 본인이 명부의 누구인지 **선택/입력**
- 관리자 승인 전에는 응답 기능(참석/위임/불참) 사용 불가
- 관리자가 "가입 신청 ↔ 명부 인물"을 매칭·승인

### 3-3. 이사회 소집 등록 (관리자)
- 회의 날짜, 안건 등록

### 3-4. 참석 응답 (이사)
- 로그인 후 참석 / 위임 / 불참 중 선택
- 위임 선택 시 **수임인(위임받는 이사) 지정** 필수

### 3-5. 정족수 계산
- 위임 = 출석으로 간주
- 재적 22명 중 **과반수(12명) 이상** 참석+위임 시 정족수 충족

### 3-6. 관리자 "성원현황" 화면
- 실시간 집계 (참석/위임/불참 인원 및 명단)
- 정족수 충족 여부 표시
- 충족 시 "개의 선언" 문구 자동 생성

### 3-7. 회의록 연동
- 회의록에 성원현황(참석/위임/불참 명단, 정족수 충족 여부) 자동 삽입/연동
- 구체적 방식은 **결정 필요 사항 ⑤** 참고 (시스템 내 편집기 vs. 텍스트 생성 후 붙여넣기)

---

## 4. 데이터 모델 (초안)

> 아래는 **초안**이며, "결정 필요 사항" 답변에 따라 컬럼이 바뀔 수 있습니다.
> 실제 `CREATE TABLE`은 회계 시스템과 동일한 원칙대로 **Supabase SQL Editor에서 직접 실행** 후 코드에 반영합니다.

### 4-1. `terms` (회기)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid, PK | |
| name | text | 예: "26-27" |
| is_current | boolean | 현재 활성 회기 여부 |
| created_at | timestamptz | |

### 4-2. `board_members` (재적 이사 명부)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid, PK | |
| term_id | uuid, FK → terms | 회기별로 명부 재지정 |
| name | text | 이사 이름 |
| position | text | 직책 (회장/총무/재무/… /이사/위원장) |
| display_order | int | 명부·성원현황 화면 정렬용 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4-3. `profiles` (가입 계정 ↔ 명부 매칭)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid, PK | Supabase `auth.users.id`와 동일 |
| email | text | |
| role | text | `admin` \| `member` |
| board_member_id | uuid, FK → board_members, nullable | 가입 시 본인이 선택/입력한 명부 인물 |
| approval_status | text | `pending` \| `approved` \| `rejected` |
| approved_by | uuid, nullable | 승인한 관리자 |
| approved_at | timestamptz, nullable | |
| created_at | timestamptz | |

### 4-4. `meetings` (이사회 소집)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid, PK | |
| term_id | uuid, FK → terms | |
| meeting_date | date | |
| agenda | text | 안건 |
| status | text | `open`(응답 접수 중) \| `closed`(마감) — 결정 필요 사항 ④ 참고 |
| created_by | uuid, FK → profiles | |
| created_at | timestamptz | |

### 4-5. `attendance_responses` (참석 응답)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid, PK | |
| meeting_id | uuid, FK → meetings | |
| board_member_id | uuid, FK → board_members | 응답한 이사 본인 |
| status | text | `attend`(참석) \| `delegate`(위임) \| `absent`(불참) |
| delegate_to_id | uuid, FK → board_members, nullable | `status = delegate`일 때만 필수 |
| responded_at | timestamptz | |
| updated_at | timestamptz | |

> UNIQUE(meeting_id, board_member_id) — 이사 1명당 회의 1건에 응답 1개.

### 4-6. `meeting_minutes` (회의록)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid, PK | |
| meeting_id | uuid, FK → meetings, UNIQUE | 회의 1건당 회의록 1개 |
| content | text | 회의록 본문 |
| attendance_summary | jsonb | 작성 시점 성원현황 스냅샷(참석/위임/불참 명단, 정족수 충족 여부) |
| status | text | `draft`(작성 중) \| `final`(확정) |
| created_by | uuid, FK → profiles | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4-7. 정족수 계산 (별도 테이블 없이 조회 시 계산)
```
분모 = board_members 중 해당 term의 재적 인원수 (기본 22)
분자 = attendance_responses 중 status IN ('attend','delegate') 개수
정족수 충족 = 분자 >= ceil(분모 / 2) + (분모가 짝수일 때 과반 = 분모/2 + 1)
```
※ 22명 기준 과반수는 12명으로 이미 확정됨. 재적 인원이 바뀌는 경우를 대비해 공식화.

---

## 5. 화면 목록 (초안)

| 화면 | 대상 | 내용 |
|---|---|---|
| 회원가입/로그인 | 전체 | 이메일 가입, 명부 인물 선택 |
| 가입 승인 관리 | 관리자 | 대기 중 가입 신청 승인/반려 |
| 명부 관리 | 관리자 | 22명 등록/수정, 회기 관리 |
| 이사회 소집 등록 | 관리자 | 날짜, 안건 입력 |
| 내 응답 | 이사 | 참석/위임/불참 선택, 수임인 지정 |
| 성원현황 | 관리자 | 실시간 집계, 정족수 표시, 개의 선언 문구 |
| 회의록 연동 | 관리자 | 성원현황 텍스트 삽입/연동 |

---

## 6. 지켜야 할 개발 원칙 (기존 회계 시스템에서 확립)

1. DB 구조 변경(테이블/컬럼 신설)은 코드 push 전에 **Supabase SQL Editor에서 관리자가 직접 실행**. 자동 실행 금지.
2. 로컬(`localhost`)에서 먼저 확인 → 커밋/push → Vercel 자동 배포.
3. 애매한 부분은 구현 전에 번호를 붙여 먼저 질문.

---

## 7. 결정 사항 (확정, 2026-08-28)

① **회기 교체 방식**: **새 행 추가(이력 보존)**. 회기가 바뀌면 `board_members`에 새 `term_id`로 새 행을 만든다. 과거 회기 명부는 삭제하지 않고 그대로 남긴다. (`accounting-system`의 `pledges`와 동일한 원칙.)

② **가입 시 본인 매칭 방식**: **드롭다운 선택 + 관리자 최종 승인**. 가입자는 현재 회기의 `board_members` 목록에서 본인 이름을 선택하고, 관리자가 승인해야 응답 기능이 열린다.

③ **위임(대리) 규칙**: **제한 없음**. 한 이사가 여러 명의 위임을 동시에 받을 수 있다. `attendance_responses.delegate_to_id`에 UNIQUE 제약을 걸지 않는다.

④ **회의 마감 처리**: **관리자 수동 마감**. 자동 마감 시각 설정 없이, 관리자가 `meetings.status`를 `open → closed`로 직접 전환한다. `closed` 상태에서는 이사의 응답 수정이 잠긴다.

⑤ **회의록 연동 범위**: **시스템 내 저장·편집 기능 포함**. 회의록을 워드/한글에 붙여넣는 텍스트로만 생성하는 것이 아니라, 시스템 안에서 회의록 내용을 직접 작성·저장·수정할 수 있어야 한다. 작성 시점의 성원현황(참석/위임/불참 명단, 정족수 충족 여부)을 스냅샷으로 함께 저장한다 (`meeting_minutes` 테이블, 4-6 참고).

⑥ **소집 알림**: **MVP에서 제외**. 소집 등록 시 자동 이메일 발송 기능은 만들지 않는다. 이사들은 시스템에 직접 로그인해서 확인한다. (이메일 발송 인프라 구축은 추후 별도 논의.)

⑦ **관리자 권한 범위**: **총무(임상재)만 admin (MVP)**. 회장 등 추가 admin 권한 부여는 이번 범위에 포함하지 않는다. 필요 시 이후 확장.

---

## 8. 다음 단계 (결정 사항 확정 후)

1. GitHub 새 저장소 생성
2. Supabase 새 프로젝트 생성
3. 위 데이터 모델을 바탕으로 SQL 작성 → Supabase SQL Editor에서 직접 실행
4. 로컬 개발 → localhost 확인 → 배포
