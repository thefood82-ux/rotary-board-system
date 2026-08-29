"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { closeMeeting, upsertAttendanceResponse } from "@/lib/mutations";

// Server Action은 URL을 알면 누구나 직접 POST할 수 있으므로, UI에서 버튼을 숨겼더라도
// 반드시 서버에서 다시 한번 관리자 권한을 확인한다.

export async function closeMeetingAction(formData) {
  const { user } = await requireAdmin();
  const id = formData.get("id");
  if (!id) {
    redirect(`/admin/meetings?error=${encodeURIComponent("잘못된 요청입니다.")}`);
    return;
  }

  try {
    await closeMeeting({ id, closedBy: user.id });
  } catch (err) {
    redirect(`/admin/meetings/${id}/status?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath(`/admin/meetings/${id}/status`);
  revalidatePath("/admin/meetings");
  redirect(`/admin/meetings/${id}/status?result=${encodeURIComponent("회의를 마감했습니다.")}`);
}

// 전화 등으로 접수한 응답을 관리자가 본인 대신 입력/수정할 때 쓴다 — 미응답 포함 누구든 대상.
// form 제출이 아니라 클라이언트가 직접 호출하는 함수라 리다이렉트 대신 결과 객체를 반환한다.
export async function adminSetAttendanceAction(meetingId, boardMemberId, status, delegateToId) {
  await requireAdmin();

  if (!["attend", "delegate", "absent"].includes(status)) {
    return { ok: false, error: "잘못된 응답입니다." };
  }
  if (status === "delegate" && !delegateToId) {
    return { ok: false, error: "위임 대상을 선택해주세요." };
  }
  if (status === "delegate" && delegateToId === boardMemberId) {
    return { ok: false, error: "본인에게 위임할 수 없습니다." };
  }

  try {
    await upsertAttendanceResponse({ meetingId, boardMemberId, status, delegateToId });
  } catch (err) {
    return { ok: false, error: err.message };
  }

  revalidatePath(`/admin/meetings/${meetingId}/status`);
  revalidatePath(`/admin/meetings/${meetingId}/minutes`);
  return { ok: true };
}
