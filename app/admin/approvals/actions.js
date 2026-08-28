"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { approveProfile, rejectProfile } from "@/lib/mutations";

// 로그인/관리자 권한 검사가 아직 없어 누구나 호출할 수 있는 상태다.
// 인증이 추가되면 각 액션 시작 부분에 requireAdmin() 호출을 넣어야 한다.

export async function approveProfileAction(formData) {
  const id = formData.get("id");
  if (!id) {
    redirect(`/admin/approvals?error=${encodeURIComponent("잘못된 요청입니다.")}`);
    return;
  }

  try {
    await approveProfile({ id });
  } catch (err) {
    // profiles(board_member_id) partial unique index — 이미 승인된 이사를 또 승인하려 할 때
    const isDuplicate = /duplicate key|23505|idx_profiles_board_member_id_approved/.test(err.message || "");
    const msg = isDuplicate
      ? "이미 승인된 이사입니다. 같은 이사에 대한 다른 신청은 반려해주세요."
      : `승인 처리에 실패했습니다: ${err.message}`;
    redirect(`/admin/approvals?error=${encodeURIComponent(msg)}`);
    return;
  }

  revalidatePath("/admin/approvals");
  redirect(`/admin/approvals?result=${encodeURIComponent("승인했습니다.")}`);
}

export async function rejectProfileAction(formData) {
  const id = formData.get("id");
  if (!id) {
    redirect(`/admin/approvals?error=${encodeURIComponent("잘못된 요청입니다.")}`);
    return;
  }

  try {
    await rejectProfile({ id });
  } catch (err) {
    redirect(`/admin/approvals?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/admin/approvals");
  redirect(`/admin/approvals?result=${encodeURIComponent("반려했습니다.")}`);
}
