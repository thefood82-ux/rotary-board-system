import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getCurrentTerm, getMeetings, getBoardMembers, getAttendanceResponses } from "@/lib/data";
import { computeMeetingSequence } from "@/lib/minutes";
import AttendanceMatrixView from "@/components/AttendanceMatrixView";

export const dynamic = "force-dynamic";

export default async function AttendanceListPage() {
  await requireAdmin();
  const currentTerm = await getCurrentTerm();
  const meetingsDesc = currentTerm ? await getMeetings(currentTerm.id) : [];
  const roster = currentTerm ? await getBoardMembers(currentTerm.id) : [];

  const seqById = computeMeetingSequence(meetingsDesc);
  // 매트릭스는 왼쪽부터 1차, 2차... 순서로 보여야 하므로 차수 오름차순으로 재정렬.
  const meetings = [...meetingsDesc]
    .map((m) => ({ ...m, seq: seqById.get(m.id) ?? "?" }))
    .sort((a, b) => (a.seq === b.seq ? 0 : Number(a.seq) - Number(b.seq)));

  const responsesByMeetingId = new Map(
    await Promise.all(
      meetings.map(async (m) => {
        const responses = await getAttendanceResponses(m.id);
        return [m.id, new Map(responses.map((r) => [r.board_member_id, r]))];
      })
    )
  );

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">출석명단</h1>

      {!currentTerm ? (
        <section className="card">
          <p className="empty-state">아직 활성 회기가 없습니다.</p>
        </section>
      ) : meetings.length === 0 ? (
        <section className="card">
          <p className="empty-state">등록된 회의가 없습니다.</p>
        </section>
      ) : (
        <section className="card">
          <p className="hint">
            회차별 출석 현황과 회원별 참석률을 한눈에 볼 수 있습니다(위임은 출석으로 계산). 맨 아래 "평균" 행은 회차별
            참석률과 전체 평균 참석률입니다.
          </p>
          <AttendanceMatrixView roster={roster} meetings={meetings} responsesByMeetingId={responsesByMeetingId} />
        </section>
      )}
    </main>
  );
}
