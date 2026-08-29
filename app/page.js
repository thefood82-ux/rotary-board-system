import Link from "next/link";
import { getSessionUser, getSessionProfile } from "@/lib/dal";
import { getCurrentTerm, getMeetings, getLatestAnnouncement, getMeetingIdsWithMinutes } from "@/lib/data";
import { formatMeetingDateShort } from "@/lib/dates";
import { computeMeetingSequence } from "@/lib/minutes";
import InstallAppButton from "@/components/InstallAppButton";

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

function getMinutesViewHref(meeting, user) {
  return user ? `/meetings/${meeting.id}/minutes` : "/login";
}

// 번호 매긴 안건("1. ...\n2. ...")은 첫 항목만 보여주고 "외 N건"으로 줄인다.
// 번호가 없는 일반 텍스트는 첫 줄만 보여준다(나머지는 CSS 한 줄 말줄임으로 자연히 잘림).
function summarizeAgenda(agenda) {
  if (!agenda) return "-";
  const lines = agenda
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const itemRe = /^\d+[.)]\s*(.+)$/;
  const items = lines.map((l) => l.match(itemRe)?.[1]).filter(Boolean);

  if (items.length >= 2) return `${items[0]} 외 ${items.length - 1}건`;
  if (items.length === 1) return items[0];
  return lines[0] || "-";
}

export default async function HomePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const user = await getSessionUser();
  const profile = user ? await getSessionProfile(user.id) : null;
  const isApproved = profile?.approval_status === "approved";
  const isBoardMember = Boolean(profile?.board_member_id);

  const currentTerm = await getCurrentTerm();
  const [meetingsDesc, latestAnnouncement] = await Promise.all([
    currentTerm ? getMeetings(currentTerm.id) : Promise.resolve([]),
    getLatestAnnouncement(),
  ]);
  const meetingIdsWithMinutes = await getMeetingIdsWithMinutes(meetingsDesc.map((m) => m.id));

  // 차수는 컬럼이 아니라 날짜 오름차순 위치로 매 화면에서 계산한다.
  const seqByMeetingId = computeMeetingSequence(meetingsDesc);

  const openMeetings = isApproved && isBoardMember ? meetingsDesc.filter((m) => m.status === "open") : [];

  return (
    <main>
      <h1 className="page-title">새송탄로타리클럽 26-27년도 이사회</h1>

      <InstallAppButton />

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

      {openMeetings.length > 0 && (
        <nav className="home-links">
          <Link href={openMeetings.length === 1 ? `/meetings/${openMeetings[0].id}/respond` : "/status"}>
            내 응답 (진행 중인 회의 {openMeetings.length}건)
          </Link>
        </nav>
      )}

      <section className="card">
        <h2>이사회 소집 목록</h2>
        {meetingsDesc.length === 0 ? (
          <p className="empty-state">등록된 회의가 없습니다.</p>
        ) : (
          <div className="meeting-board">
            {meetingsDesc.map((m) => (
              <div key={m.id} className="meeting-board-item">
                <Link href={getMeetingHref(m, { user, profile })} className="meeting-board-main">
                  <span className="meeting-board-seq">{seqByMeetingId.get(m.id)}차</span>
                  <span className="meeting-board-datetime">{formatMeetingDateShort(m.meeting_date)}</span>
                  <span className="meeting-board-agenda">{summarizeAgenda(m.agenda)}</span>
                </Link>
                {meetingIdsWithMinutes.has(m.id) && (
                  <Link href={getMinutesViewHref(m, user)} className="meeting-board-minutes-link">
                    회의록 보기
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
