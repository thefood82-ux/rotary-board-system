import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseSessionClient } from "./supabase-session";
import { getProfileByUserId } from "./data";

// 현재 로그인한 사용자 (없으면 null). 렌더 1회당 한 번만 조회되도록 캐시.
export const getSessionUser = cache(async () => {
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

// 로그인이 안 되어 있으면 /login으로 보낸다.
export const requireUser = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
});

// profiles 행(role, approval_status, board_member_id 등). 렌더 1회당 한 번만 조회.
export const getSessionProfile = cache(async (userId) => {
  if (!userId) return null;
  return getProfileByUserId(userId);
});

// 로그인 + 관리자 승인(approval_status='approved') 이사만 통과.
// /status는 본인이 승인 대기/반려 상태를 직접 확인하는 화면이라 여기서 다시 막지 않는다
// (막으면 승인 대기 중인 사람이 자기 상태조차 못 보는 순환 리다이렉트가 된다).
export const requireApprovedMember = cache(async () => {
  const user = await requireUser();
  const profile = await getSessionProfile(user.id);
  if (!profile || profile.approval_status !== "approved") {
    redirect("/status");
  }
  return { user, profile };
});

// 로그인 + role='admin'만 통과. docs/requirements.md 2장(사용자 역할) 기준.
export const requireAdmin = cache(async () => {
  const user = await requireUser();
  const profile = await getSessionProfile(user.id);
  if (!profile || profile.role !== "admin") {
    redirect(`/status?error=${encodeURIComponent("관리자 권한이 필요한 기능입니다.")}`);
  }
  return { user, profile };
});
