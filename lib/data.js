import "server-only";
import { pgSelect } from "./supabase-server";

export async function getCurrentTerm() {
  const rows = await pgSelect("terms", { select: "*", is_current: "eq.true", limit: "1" });
  return rows?.[0] ?? null;
}

export async function getTermById(id) {
  if (!id) return null;
  const rows = await pgSelect("terms", { select: "*", id: `eq.${id}`, limit: "1" });
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

// 회원가입 드롭다운용 — 이미 승인된 계정이 있는 이사는 목록에서 제외한다.
export async function getBoardMembersForSignup(termId) {
  if (!termId) return [];
  const [members, approvedProfiles] = await Promise.all([
    getBoardMembers(termId),
    pgSelect("profiles", { select: "board_member_id", approval_status: "eq.approved" }),
  ]);
  const approvedIds = new Set(approvedProfiles.map((p) => p.board_member_id));
  return members.filter((m) => !approvedIds.has(m.id));
}

export async function getPendingProfiles() {
  return pgSelect("profiles", {
    select: "*,board_members(name,position)",
    approval_status: "eq.pending",
    order: "created_at.asc",
  });
}

export async function getProfileByUserId(userId) {
  if (!userId) return null;
  const rows = await pgSelect("profiles", {
    select: "*,board_members(name,position)",
    id: `eq.${userId}`,
    limit: "1",
  });
  return rows?.[0] ?? null;
}

export async function getMeetings(termId) {
  if (!termId) return [];
  return pgSelect("meetings", {
    select: "*",
    term_id: `eq.${termId}`,
    order: "meeting_date.desc",
  });
}

export async function getMeetingById(id) {
  if (!id) return null;
  const rows = await pgSelect("meetings", { select: "*", id: `eq.${id}`, limit: "1" });
  return rows?.[0] ?? null;
}

export async function getAttendanceResponses(meetingId) {
  if (!meetingId) return [];
  return pgSelect("attendance_responses", { select: "*", meeting_id: `eq.${meetingId}` });
}

export async function getMeetingMinutes(meetingId) {
  if (!meetingId) return null;
  const rows = await pgSelect("meeting_minutes", { select: "*", meeting_id: `eq.${meetingId}`, limit: "1" });
  return rows?.[0] ?? null;
}

export async function getMyAttendanceResponse(meetingId, boardMemberId) {
  if (!meetingId || !boardMemberId) return null;
  const rows = await pgSelect("attendance_responses", {
    select: "*",
    meeting_id: `eq.${meetingId}`,
    board_member_id: `eq.${boardMemberId}`,
    limit: "1",
  });
  return rows?.[0] ?? null;
}

// 헤더 배지("김윤태 회장 회기")용 — 별도 필드 없이 board_members.position='회장'에서 가져온다.
export async function getCurrentPresidentName(termId) {
  if (!termId) return null;
  const rows = await pgSelect("board_members", {
    select: "name",
    term_id: `eq.${termId}`,
    position: "eq.회장",
    limit: "1",
  });
  return rows?.[0]?.name ?? null;
}

export async function getLatestAnnouncement() {
  const rows = await pgSelect("announcements", { select: "*", order: "created_at.desc", limit: "1" });
  return rows?.[0] ?? null;
}

export async function getAnnouncements() {
  return pgSelect("announcements", { select: "*", order: "created_at.desc" });
}
