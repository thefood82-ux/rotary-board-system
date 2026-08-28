import "server-only";
import { pgSelect } from "./supabase-server";

export async function getCurrentTerm() {
  const rows = await pgSelect("terms", { select: "*", is_current: "eq.true", limit: "1" });
  return rows?.[0] ?? null;
}

export async function getBoardMembers(termId) {
  if (!termId) return [];
  return pgSelect("board_members", {
    select: "*",
    term_id: `eq.${termId}`,
    order: "display_order.asc",
  });
}
