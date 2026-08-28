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
