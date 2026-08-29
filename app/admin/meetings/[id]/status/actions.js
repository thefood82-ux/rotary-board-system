"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { closeMeeting } from "@/lib/mutations";

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
