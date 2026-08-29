import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getMeetingById, getBoardMembers, getAttendanceResponses, getMeetingMinutes } from "@/lib/data";
import { buildAttendanceSummary, buildDraftText } from "@/lib/minutes";
import MinutesEditor from "@/components/MinutesEditor";
import { autosaveMinutesContent, finalizeMinutesAction, revertMinutesToDraftAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MeetingMinutesPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = (await searchParams) || {};

  const meeting = await getMeetingById(id);
  if (!meeting) {
    return (
      <main>
        <Link href="/admin/meetings" className="back-link">
          ← 소집 등록으로
        </Link>
        <h1 className="page-title">회의록</h1>
        <p className="banner error">존재하지 않는 회의입니다.</p>
      </main>
    );
  }

  const existing = await getMeetingMinutes(id);

  let content;
  if (existing) {
    content = existing.content || "";
  } else {
    const [roster, responses] = await Promise.all([getBoardMembers(meeting.term_id), getAttendanceResponses(id)]);
    const summary = buildAttendanceSummary(roster, responses);
    content = buildDraftText(meeting, summary);
  }

  const isFinal = existing?.status === "final";

  return (
    <main>
      <Link href={`/admin/meetings/${meeting.id}/status`} className="back-link">
        ← 성원현황으로
      </Link>
      <h1 className="page-title">회의록</h1>

      <p className="meta-line">
        {meeting.meeting_date} {meeting.agenda ? `· ${meeting.agenda}` : ""} ·{" "}
        <span className={`badge badge-${isFinal ? "approved" : "pending"}`}>{isFinal ? "확정" : "초안"}</span>
      </p>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      {!existing && !isFinal && (
        <p className="hint">
          아직 저장된 회의록이 없어 현재 성원현황을 기준으로 초안을 자동 생성했습니다. 자유롭게 수정하면 잠시 후 자동 저장됩니다.
        </p>
      )}

      <section className="card">
        {isFinal ? (
          <>
            <textarea className="minutes-textarea" defaultValue={content} readOnly rows={20} />
            <form action={revertMinutesToDraftAction} style={{ marginTop: "0.9rem" }}>
              <input type="hidden" name="meeting_id" value={meeting.id} />
              <input type="hidden" name="id" value={existing.id} />
              <button type="submit" className="btn-secondary">
                초안으로 되돌리기
              </button>
            </form>
          </>
        ) : (
          <MinutesEditor
            meetingId={meeting.id}
            initialContent={content}
            autosaveAction={autosaveMinutesContent}
            finalizeAction={finalizeMinutesAction}
          />
        )}
      </section>
    </main>
  );
}
