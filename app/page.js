import Link from "next/link";
import { getSessionUser, getSessionProfile } from "@/lib/dal";
import { getCurrentTerm, getMeetings, getLatestAnnouncement } from "@/lib/data";
import { formatMeetingDateShort } from "@/lib/dates";
import { computeMeetingSequence } from "@/lib/minutes";

export const dynamic = "force-dynamic";

// 로그인 안 됨 -> /login. 승인 전 -> /status. admin -> 성원현황. 재적 이사(비admin) -> 내 응답.
// 사무장/스태프처럼 응답 대상도 admin도 아니면 -> /status.
function getMeetingHref(meeting, { user, profile }) {
  if (!user) return "/login";
  if (profile?.approval_status !== "approved") return "/status";
  if (profile?.role === "admin") return `/admin/meetings/${meeting.id}/status`;
  if (profile?.board_member_id) return `/meetings/${meeting.id}/respond`;
  return "/status";
}

export default async function HomePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const user = await getSessionUser();
  const profile = user ? await getSessionProfile(user.id) : null;
  const isApproved = profile?.approval_status === "approved";
  const isAdmin = profile?.role === "admin";
  const isBoardMember = Boolean(profile?.board_member_id);

  const currentTerm = await getCurrentTerm();
  const [meetingsDesc, latestAnnouncement] = await Promise.all([
    currentTerm ? getMeetings(currentTerm.id) : Promise.resolve([]),
    getLatestAnnouncement(),
  ]);

  // 차수는 컬럼이 아니라 날짜 오름차순 위치로 매 화면에서 계산한다.
  const seqByMeetingId = computeMeetingSequence(meetingsDesc);

  const openMeetings = isApproved && isBoardMember ? meetingsDesc.filter((m) => m.status === "open") : [];

  return (
    <main>
      <h1 className="page-title">새송탄로타리클럽 26-27년도 이사회</h1>

      {sp.error && <p className="banner error">{sp.error}</p>}

      {latestAnnouncement && (
        <div className="announcement-banner">
          <svg className="announcement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11v2a1 1 0 0 0 1 1h2l6 4V6l-6 4H4a1 1 0 0 0-1 1z" />
            <path d="M14 8a4 4 0 0 1 0 8" />
            <path d="M17.5 5a8 8 0 0 1 0 14" />
          </svg>
          <div className="announcement-body">
            <h2>{latestAnnouncement.title}</h2>
            <p>{latestAnnouncement.content}</p>
          </div>
        </div>
      )}

      <nav className="home-links">
        {user && (
          <>
            <Link href="/status">내 계정 상태</Link>
            {openMeetings.length > 0 && (
              <Link href={openMeetings.length === 1 ? `/meetings/${openMeetings[0].id}/respond` : "/status"}>
                내 응답 (진행 중인 회의 {openMeetings.length}건)
              </Link>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <Link href="/members">명부 관리</Link>
            <Link href="/admin/approvals">가입 승인 관리</Link>
            <Link href="/admin/meetings">이사회 소집 등록</Link>
            <Link href="/admin/announcements">공지사항 관리</Link>
          </>
        )}
      </nav>

      <section className="card">
        <h2>이사회 소집 목록</h2>
        {meetingsDesc.length === 0 ? (
          <p className="empty-state">등록된 회의가 없습니다.</p>
        ) : (
          <div className="meeting-board">
            {meetingsDesc.map((m) => (
              <Link key={m.id} href={getMeetingHref(m, { user, profile })} className="meeting-board-item">
                <span className="meeting-board-seq">{seqByMeetingId.get(m.id)}차</span>
                <span className="meeting-board-datetime">{formatMeetingDateShort(m.meeting_date)}</span>
                <span className="meeting-board-agenda">{m.agenda || "-"}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
