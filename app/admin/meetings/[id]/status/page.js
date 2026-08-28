import Link from "next/link";
import { getMeetingById, getBoardMembers, getAttendanceResponses, getMeetingMinutes } from "@/lib/data";
import { calculateQuorum } from "@/lib/quorum";
import { closeMeetingAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { attend: "참석", delegate: "위임", absent: "불참" };

export default async function MeetingStatusPage({ params, searchParams }) {
  const { id } = await params;
  const sp = (await searchParams) || {};

  const meeting = await getMeetingById(id);
  if (!meeting) {
    return (
      <main>
        <Link href="/admin/meetings" className="back-link">
          ← 소집 등록으로
        </Link>
        <h1 className="page-title">성원현황</h1>
        <p className="banner error">존재하지 않는 회의입니다.</p>
      </main>
    );
  }

  const [roster, responses, minutes] = await Promise.all([
    getBoardMembers(meeting.term_id),
    getAttendanceResponses(id),
    getMeetingMinutes(id),
  ]);

  const memberById = new Map(roster.map((m) => [m.id, m]));
  const responseByMemberId = new Map(responses.map((r) => [r.board_member_id, r]));

  const attendees = [];
  const delegators = [];
  const absentees = [];
  const noResponse = [];

  for (const member of roster) {
    const response = responseByMemberId.get(member.id);
    if (!response) {
      noResponse.push(member);
    } else if (response.status === "attend") {
      attendees.push(member);
    } else if (response.status === "delegate") {
      delegators.push({ member, delegate: memberById.get(response.delegate_to_id) });
    } else {
      absentees.push(member);
    }
  }

  const total = roster.length;
  const attendCount = attendees.length + delegators.length;
  const { majorityThreshold, quorumMet } = calculateQuorum(total, attendCount);

  return (
    <main>
      <Link href="/admin/meetings" className="back-link">
        ← 소집 등록으로
      </Link>
      <h1 className="page-title">성원현황</h1>

      <p className="meta-line">
        {meeting.meeting_date} {meeting.agenda ? `· ${meeting.agenda}` : ""} ·{" "}
        <span className={`badge badge-${meeting.status}`}>{meeting.status === "open" ? "진행중" : "마감됨"}</span>
      </p>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      <div className={`quorum-banner ${quorumMet ? "met" : "unmet"}`}>
        {quorumMet
          ? `재적 ${total}명 중 ${attendCount}명 참석(위임 포함)으로 정족수를 충족하여 개의를 선언합니다.`
          : `정족수 미충족: 재적 ${total}명 중 ${attendCount}명 참석(위임 포함). 과반수 ${majorityThreshold}명 필요.`}
      </div>

      <section className="card">
        <h2>회의록</h2>
        <p className="meta-line">
          {!minutes
            ? "아직 작성되지 않았습니다."
            : minutes.status === "final"
              ? "확정됨"
              : "초안 저장됨"}
        </p>
        <Link href={`/admin/meetings/${meeting.id}/minutes`} className="btn btn-secondary">
          회의록 작성
        </Link>
      </section>

      <section className="card">
        <h2>회의 마감</h2>
        {meeting.status === "closed" ? (
          <p className="badge badge-closed">
            마감됨{meeting.closed_at ? ` (${new Date(meeting.closed_at).toLocaleString("ko-KR")})` : ""}
          </p>
        ) : (
          <form action={closeMeetingAction}>
            <input type="hidden" name="id" value={meeting.id} />
            <button type="submit" className="btn-danger">
              회의 마감하기
            </button>
          </form>
        )}
      </section>

      <section className="card">
        <h2>참석 ({attendees.length}명)</h2>
        {attendees.length === 0 ? (
          <p className="empty-state">없음</p>
        ) : (
          <ul>
            {attendees.map((m) => (
              <li key={m.id}>
                {m.name} ({m.position})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>위임 ({delegators.length}명)</h2>
        {delegators.length === 0 ? (
          <p className="empty-state">없음</p>
        ) : (
          <ul>
            {delegators.map(({ member, delegate }) => (
              <li key={member.id}>
                {member.name} ({member.position}) → {delegate ? `${delegate.name} (${delegate.position})` : "알 수 없음"}
                에게 위임
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>불참 ({absentees.length}명)</h2>
        {absentees.length === 0 ? (
          <p className="empty-state">없음</p>
        ) : (
          <ul>
            {absentees.map((m) => (
              <li key={m.id}>
                {m.name} ({m.position})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>미응답 ({noResponse.length}명)</h2>
        {noResponse.length === 0 ? (
          <p className="empty-state">없음</p>
        ) : (
          <ul>
            {noResponse.map((m) => (
              <li key={m.id}>
                {m.name} ({m.position})
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
