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

// approved_by는 관리자 인증이 없어 아직 기록하지 않는다.
// 로그인/권한 기능이 추가되면 승인한 관리자의 profiles.id를 여기에 넣어야 한다.
export async function approveProfile({ id }) {
  return pgUpdate("profiles", { id: `eq.${id}` }, { approval_status: "approved", approved_at: new Date().toISOString() });
}

export async function rejectProfile({ id }) {
  return pgUpdate("profiles", { id: `eq.${id}` }, { approval_status: "rejected" });
}

export async function createMeeting({ termId, meetingDate, agenda, createdBy }) {
  return pgInsertOne("meetings", {
    term_id: termId,
    meeting_date: meetingDate,
    agenda: agenda || null,
    created_by: createdBy,
  });
}

// closed_by는 관리자 인증이 없어 세션이 있을 때만 기록한다 (없으면 null).
export async function closeMeeting({ id, closedBy }) {
  return pgUpdate(
    "meetings",
    { id: `eq.${id}` },
    { status: "closed", closed_by: closedBy ?? null, closed_at: new Date().toISOString() }
  );
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
