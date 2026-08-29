import Link from "next/link";
import { requireApprovedMember } from "@/lib/dal";
import { getMeetingById, getMeetingMinutes, getMeetings } from "@/lib/data";
import { computeMeetingSequence } from "@/lib/minutes";
import MinutesDocumentView from "@/components/MinutesDocumentView";

export const dynamic = "force-dynamic";

export default async function MeetingMinutesViewPage({ params }) {
  const { profile } = await requireApprovedMember();
  const isAdmin = profile?.role === "admin";
  const { id } = await params;

  const meeting = await getMeetingById(id);
  if (!meeting) {
    return (
      <main>
        <Link href="/" className="back-link">
          ← 홈으로
        </Link>
        <h1 className="page-title">회의록</h1>
        <p className="banner error">존재하지 않는 회의입니다.</p>
      </main>
    );
  }

  const [minutes, meetingsInTerm] = await Promise.all([getMeetingMinutes(id), getMeetings(meeting.term_id)]);
  const seq = computeMeetingSequence(meetingsInTerm).get(meeting.id) ?? "?";

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">회의록</h1>

      {isAdmin && (
        <p className="meta-line">
          <Link href={`/admin/meetings/${id}/minutes`} className="btn btn-secondary">
            {minutes ? "수정하기" : "회의록 작성하기"}
          </Link>
        </p>
      )}

      {!minutes ? (
        <section className="card">
          <p className="empty-state">아직 작성된 회의록이 없습니다.</p>
        </section>
      ) : (
        <MinutesDocumentView meeting={meeting} content={minutes.content} seq={seq} />
      )}
    </main>
  );
}
