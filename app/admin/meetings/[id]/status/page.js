import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getMeetingById, getBoardMembers, getAttendanceResponses, getMeetingMinutes, getMeetings } from "@/lib/data";
import { calculateQuorum } from "@/lib/quorum";
import { parseMinutesContent, parseResolutionItems, computeMeetingSequence } from "@/lib/minutes";
import { formatMeetingDateShort } from "@/lib/dates";
import AdminAttendanceEditor from "@/components/AdminAttendanceEditor";
import ProgressNotesEditor from "@/components/ProgressNotesEditor";
import MeetingStartGate from "@/components/MeetingStartGate";
import { adminSetAttendanceAction } from "./actions";
import { autosaveProgressNotes } from "../minutes/actions";

export const dynamic = "force-dynamic";

const PAGE_TITLE = "성원현황 및 회의진행";

export default async function MeetingStatusPage({ params, searchParams }) {
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
        <h1 className="page-title">{PAGE_TITLE}</h1>
        <p className="banner error">존재하지 않는 회의입니다.</p>
      </main>
    );
  }

  const [roster, responses, minutes, meetingsInTerm] = await Promise.all([
    getBoardMembers(meeting.term_id),
    getAttendanceResponses(id),
    getMeetingMinutes(id),
    getMeetings(meeting.term_id),
  ]);
  const seq = computeMeetingSequence(meetingsInTerm).get(meeting.id) ?? "?";

  const responseByMemberId = new Map(responses.map((r) => [r.board_member_id, r]));

  const total = roster.length;
  const presentCount = responses.filter((r) => r.status === "attend" || r.status === "delegate").length;
  const { majorityThreshold, quorumMet } = calculateQuorum(total, presentCount);

  // 안건은 소집 등록 화면의 안내대로 "1) ..." 형식으로 입력된다고 가정하고 항목별로 잘라
  // 아코디언 하나씩에 배정한다. 번호가 없으면 통째로 항목 1개로 취급.
  const { items: agendaItems } = parseResolutionItems(meeting.agenda);

  const savedResolutionText = minutes ? (parseMinutesContent(minutes.content)?.resolutionText ?? "") : "";
  const { items: savedNoteItems, numbered: savedNotesNumbered } = parseResolutionItems(savedResolutionText);
  const progressNotes = agendaItems.map((_, i) => {
    if (savedNotesNumbered) {
      // 각 항목은 저장 시 "제목\n메모" 형태였으므로 첫 줄(제목)을 떼고 메모만 되돌린다.
      const [, ...rest] = (savedNoteItems[i] || "").split("\n");
      return rest.join("\n");
    }
    // 이전 방식(번호 없는 통짜 메모)으로 저장된 경우, 첫 번째 안건에 그대로 이어붙인다.
    return i === 0 ? savedNoteItems[0] || "" : "";
  });

  return (
    <main>
      <Link href="/admin/meetings" className="back-link">
        ← 소집 등록으로
      </Link>
      <h1 className="page-title">{PAGE_TITLE}</h1>

      <p className="meta-pill-row">
        <span className="meta-seq-badge">제{seq}차</span>
        <span className="meta-pill">{formatMeetingDateShort(meeting.meeting_date)}</span>
        <span className={`badge badge-${meeting.status}`}>{meeting.status === "open" ? "진행중" : "마감됨"}</span>
      </p>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      <section className="card">
        <h2>응답 입력/수정</h2>
        <p className="hint">전화 등으로 접수한 응답은 여기서 바로 입력하거나 고칠 수 있습니다. 선택하면 바로 저장됩니다.</p>
        <AdminAttendanceEditor
          meetingId={meeting.id}
          roster={roster}
          responsesByMemberId={Object.fromEntries(responseByMemberId)}
          setAction={adminSetAttendanceAction}
        />
      </section>

      <MeetingStartGate
        quorumMet={quorumMet}
        quorumText={
          quorumMet
            ? `재적 ${total}명 중 ${presentCount}명 참석(위임 포함)으로 정족수를 충족하여 개의를 선언합니다.`
            : `정족수 미충족: 재적 ${total}명 중 ${presentCount}명 참석(위임 포함). 과반수 ${majorityThreshold}명 필요.`
        }
      >
        <h2 className="group-title">안건 및 회의 진행</h2>
        <ProgressNotesEditor
          meetingId={meeting.id}
          agendaItems={agendaItems}
          initialNotes={progressNotes}
          autosaveAction={autosaveProgressNotes}
        />

        <section className="card">
          <h2>회의록</h2>
          <p className="meta-line">
            {!minutes
              ? "아직 작성되지 않았습니다. (성원보고/출석현황/안건 메모는 자동으로 채워집니다)"
              : minutes.status === "final"
                ? "확정됨 — 회의록 화면에서 내용을 확인하고 이의가 없으면 회의를 마감하세요."
                : "초안 저장됨 — 확정해야 회의를 마감할 수 있습니다."}
          </p>
          <Link href={`/admin/meetings/${meeting.id}/minutes`} className="btn btn-secondary">
            {minutes?.status === "final" ? "회의록 보기" : "회의록 작성"}
          </Link>
        </section>
      </MeetingStartGate>
    </main>
  );
}
