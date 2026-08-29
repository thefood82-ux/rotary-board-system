import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getMeetingById, getBoardMembers, getAttendanceResponses, getMeetingMinutes, getMeetings, getTermById } from "@/lib/data";
import {
  buildAttendanceSummary,
  buildQuorumReportText,
  buildAttendanceDetailText,
  buildMeetingTitle,
  computeMeetingSequence,
  parseMinutesContent,
} from "@/lib/minutes";
import { formatMeetingDateShort, formatMeetingDateLong } from "@/lib/dates";
import MinutesEditor from "@/components/MinutesEditor";
import { autosaveMinutesContent, finalizeMinutesAction, revertMinutesToDraftAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MeetingMinutesPage({ params, searchParams }) {
  const { profile } = await requireAdmin();
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
  const [roster, responses, meetingsInTerm, term] = await Promise.all([
    getBoardMembers(meeting.term_id),
    getAttendanceResponses(id),
    getMeetings(meeting.term_id),
    getTermById(meeting.term_id),
  ]);

  const meetingDateTimeText = formatMeetingDateLong(meeting.meeting_date);

  let fields;
  if (existing) {
    fields = parseMinutesContent(existing.content) || {
      author: "",
      meetingTitle: "",
      quorumReportText: "",
      attendanceDetailText: "",
      resolutionText: "",
    };
  } else {
    // 작성자 기본값: 로그인한 관리자 본인의 명부 직책+이름 (명부에 없는 사무장 계정이면 빈 값 - 직접 입력).
    const authorDefault = profile.board_members ? `${profile.board_members.position} ${profile.board_members.name}` : "";
    const seqByMeetingId = computeMeetingSequence(meetingsInTerm);
    const seq = seqByMeetingId.get(meeting.id) ?? 1;
    const summary = buildAttendanceSummary(roster, responses);

    fields = {
      author: authorDefault,
      meetingTitle: buildMeetingTitle(term?.name, seq),
      quorumReportText: buildQuorumReportText(summary),
      attendanceDetailText: buildAttendanceDetailText(roster, responses),
      resolutionText: "",
    };
  }

  const isFinal = existing?.status === "final";

  return (
    <main>
      <Link href={`/admin/meetings/${meeting.id}/status`} className="back-link">
        ← 성원현황으로
      </Link>
      <h1 className="page-title">회의록</h1>

      <p className="meta-line">
        {formatMeetingDateShort(meeting.meeting_date)} {meeting.agenda ? `· ${meeting.agenda}` : ""} ·{" "}
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
            <div className="stack-form">
              <label>
                작성자
                <input value={fields.author} readOnly />
              </label>
              <label>
                회의명
                <input value={fields.meetingTitle} readOnly />
              </label>
              <label>
                일시
                <input value={meetingDateTimeText} readOnly />
              </label>
              <label>
                1. 성원보고
                <textarea className="minutes-textarea" rows={4} defaultValue={fields.quorumReportText} readOnly />
              </label>
              <label>
                2. 출석 및 성원 상세 현황
                <textarea className="minutes-textarea" rows={10} defaultValue={fields.attendanceDetailText} readOnly />
              </label>
              <label>
                3. 심의 및 의결 사항
                <textarea className="minutes-textarea" rows={10} defaultValue={fields.resolutionText} readOnly />
              </label>
            </div>
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
            initialAuthor={fields.author}
            initialMeetingTitle={fields.meetingTitle}
            meetingDateTimeText={meetingDateTimeText}
            initialQuorumReportText={fields.quorumReportText}
            initialAttendanceDetailText={fields.attendanceDetailText}
            initialResolutionText={fields.resolutionText}
            autosaveAction={autosaveMinutesContent}
            finalizeAction={finalizeMinutesAction}
          />
        )}
      </section>
    </main>
  );
}
