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
import MinutesDocumentView from "@/components/MinutesDocumentView";
import { autosaveMinutesContent, finalizeMinutesAction, revertMinutesToDraftAction } from "./actions";
import { closeMeetingAction } from "../status/actions";

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

  const seq = computeMeetingSequence(meetingsInTerm).get(meeting.id) ?? "?";
  const meetingDateTimeText = formatMeetingDateLong(meeting.meeting_date);

  // 성원보고/출석현황은 회의록이 초안인 동안 항상 성원현황(roster+responses) 기준 최신값을 쓴다 —
  // 저장된 스냅샷이 있어도 무시하고 매번 새로 계산해서, 성원현황에서 체크를 바꾸면 바로 반영되게 한다.
  const summary = buildAttendanceSummary(roster, responses);
  const quorumReportText = buildQuorumReportText(summary);
  const attendanceDetailText = buildAttendanceDetailText(roster, responses);

  let fields;
  if (existing) {
    fields = parseMinutesContent(existing.content) || {
      author: "",
      meetingTitle: "",
      resolutionText: "",
    };
  } else {
    // 작성자 기본값: 로그인한 관리자 본인의 명부 직책+이름 (명부에 없는 사무장 계정이면 빈 값 - 직접 입력).
    const authorDefault = profile.board_members ? `${profile.board_members.position} ${profile.board_members.name}` : "";

    fields = {
      author: authorDefault,
      meetingTitle: buildMeetingTitle(term?.name, seq),
      resolutionText: "",
    };
  }

  const isFinal = existing?.status === "final";

  return (
    <main>
      <Link href={`/admin/meetings/${meeting.id}/status`} className="back-link">
        ← 성원현황 및 회의진행으로
      </Link>
      <h1 className="page-title">회의록</h1>

      <p className="meta-line">
        {formatMeetingDateShort(meeting.meeting_date)} {meeting.agenda ? `· ${meeting.agenda}` : ""} ·{" "}
        <span className={`badge badge-${isFinal ? "approved" : "pending"}`}>{isFinal ? "확정 (읽기 전용)" : "초안 (수정 가능)"}</span>
      </p>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      {!existing && !isFinal && (
        <p className="hint">
          아직 저장된 회의록이 없어 현재 성원현황을 기준으로 초안을 자동 생성했습니다. 자유롭게 수정하면 잠시 후 자동 저장됩니다.
        </p>
      )}

      {isFinal ? (
        <>
          <MinutesDocumentView meeting={meeting} content={existing.content} seq={seq} />

          <div style={{ marginTop: "0.9rem" }}>
            {meeting.status === "closed" && (
              <p className="badge badge-closed">
                마감됨{meeting.closed_at ? ` (${new Date(meeting.closed_at).toLocaleString("ko-KR")})` : ""}
              </p>
            )}

            {meeting.status !== "closed" && <p className="hint">이의가 없으면 회의를 마감하세요.</p>}

            {/* 회의가 이미 마감됐어도 회의록 내용(성원 체크 오류 등)은 고칠 수 있어야 하므로
                "초안으로 되돌리기"는 마감 여부와 무관하게 항상 보여준다. "회의 마감하기"만
                아직 마감 전일 때 보여준다(이미 마감된 회의를 다시 마감할 필요는 없음). */}
            <div className="row-actions">
              {meeting.status !== "closed" && (
                <form action={closeMeetingAction}>
                  <input type="hidden" name="id" value={meeting.id} />
                  <button type="submit" className="btn-danger">
                    회의 마감하기
                  </button>
                </form>
              )}
              <form action={revertMinutesToDraftAction}>
                <input type="hidden" name="meeting_id" value={meeting.id} />
                <input type="hidden" name="id" value={existing.id} />
                <button type="submit" className="btn-secondary">
                  초안으로 되돌리기 (수정하려면 먼저 눌러주세요)
                </button>
              </form>
            </div>
          </div>
        </>
      ) : (
        <MinutesEditor
          meetingId={meeting.id}
          seq={seq}
          initialAuthor={fields.author}
          initialMeetingTitle={fields.meetingTitle}
          meetingDateTimeText={meetingDateTimeText}
          quorumReportText={quorumReportText}
          attendanceDetailText={attendanceDetailText}
          initialResolutionText={fields.resolutionText}
          autosaveAction={autosaveMinutesContent}
          finalizeAction={finalizeMinutesAction}
        />
      )}
    </main>
  );
}
