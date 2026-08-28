import "server-only";
import { pgInsertOne, pgUpdate, pgDelete } from "./supabase-server";

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
