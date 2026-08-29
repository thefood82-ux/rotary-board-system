import "server-only";
import { pgInsertOne, pgUpdate, pgDelete, pgUpsertOne } from "./supabase-server";

export async function createTerm({ name, isCurrent = true }) {
  return pgInsertOne("terms", { name, is_current: isCurrent });
}

export async function createBoardMember({ termId, name, position, displayOrder }) {
  return pgInsertOne("board_members", {
    term_id: termId,
    name,
    position,
    display_order: displayOrder,
  });
}

export async function updateBoardMember({ id, name, position, displayOrder }) {
  return pgUpdate(
    "board_members",
    { id: `eq.${id}` },
    { name, position, display_order: displayOrder, updated_at: new Date().toISOString() }
  );
}

export async function deleteBoardMember({ id }) {
  return pgDelete("board_members", { id: `eq.${id}` });
}

export async function createProfile({ id, email, boardMemberId }) {
  return pgInsertOne("profiles", {
    id,
    email,
    board_member_id: boardMemberId,
    approval_status: "pending",
  });
}

export async function approveProfile({ id, approvedBy }) {
  return pgUpdate(
    "profiles",
    { id: `eq.${id}` },
    { approval_status: "approved", approved_by: approvedBy, approved_at: new Date().toISOString() }
  );
}

export async function rejectProfile({ id }) {
  return pgUpdate("profiles", { id: `eq.${id}` }, { approval_status: "rejected" });
}

export async function createMeeting({ termId, meetingDateTime, agenda, createdBy }) {
  return pgInsertOne("meetings", {
    term_id: termId,
    meeting_date: meetingDateTime,
    agenda: agenda || null,
    created_by: createdBy,
  });
}

// attendance_responses/meeting_minutes는 meetings를 FK로 참조할 뿐 ON DELETE CASCADE가 없어서,
// 회의를 지우려면 딸린 응답·회의록을 먼저 지워야 한다.
export async function deleteMeeting({ id }) {
  await pgDelete("attendance_responses", { meeting_id: `eq.${id}` });
  await pgDelete("meeting_minutes", { meeting_id: `eq.${id}` });
  return pgDelete("meetings", { id: `eq.${id}` });
}

// closed_by는 관리자 인증이 없어 세션이 있을 때만 기록한다 (없으면 null).
export async function closeMeeting({ id, closedBy }) {
  return pgUpdate(
    "meetings",
    { id: `eq.${id}` },
    { status: "closed", closed_by: closedBy ?? null, closed_at: new Date().toISOString() }
  );
}

// attendance_summary는 "작성 시점 스냅샷"(요구사항 4-6)이라 최초 생성 시에만 계산해서 넣고,
// 이후 저장(updateMeetingMinutesContent)에서는 건드리지 않는다.
export async function createMeetingMinutes({ meetingId, content, attendanceSummary, createdBy }) {
  return pgInsertOne("meeting_minutes", {
    meeting_id: meetingId,
    content,
    attendance_summary: attendanceSummary,
    status: "draft",
    created_by: createdBy,
  });
}

export async function updateMeetingMinutesContent({ id, content }) {
  return pgUpdate("meeting_minutes", { id: `eq.${id}` }, { content, updated_at: new Date().toISOString() });
}

export async function setMeetingMinutesStatus({ id, status }) {
  return pgUpdate("meeting_minutes", { id: `eq.${id}` }, { status, updated_at: new Date().toISOString() });
}

// (meeting_id, board_member_id) UNIQUE라 upsert — 이미 응답이 있으면 덮어쓴다.
// delegate_to_id는 위임이 아닐 때 null로 명시해야 이전 위임 값이 남지 않는다.
export async function upsertAttendanceResponse({ meetingId, boardMemberId, status, delegateToId }) {
  return pgUpsertOne(
    "attendance_responses",
    {
      meeting_id: meetingId,
      board_member_id: boardMemberId,
      status,
      delegate_to_id: status === "delegate" ? delegateToId : null,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "meeting_id,board_member_id" }
  );
}

export async function createAnnouncement({ title, content, createdBy }) {
  return pgInsertOne("announcements", { title, content, created_by: createdBy });
}

export async function updateAnnouncement({ id, title, content }) {
  return pgUpdate("announcements", { id: `eq.${id}` }, { title, content, updated_at: new Date().toISOString() });
}

export async function deleteAnnouncement({ id }) {
  return pgDelete("announcements", { id: `eq.${id}` });
}
