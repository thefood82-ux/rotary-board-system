"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseSessionClient } from "@/lib/supabase-session";
import { closeMeeting } from "@/lib/mutations";

// 로그인/관리자 권한 검사가 아직 없어 누구나 호출할 수 있는 상태다.
// 인증이 추가되면 이 액션 시작 부분에 requireAdmin() 호출을 넣어야 한다.
// closed_by는 nullable — 세션이 있으면 기록하고, 없어도 마감 자체는 막지 않는다.

export async function closeMeetingAction(formData) {
  const id = formData.get("id");
  if (!id) {
    redirect(`/admin/meetings?error=${encodeURIComponent("잘못된 요청입니다.")}`);
    return;
  }

  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await closeMeeting({ id, closedBy: user?.id ?? null });
  } catch (err) {
    redirect(`/admin/meetings/${id}/status?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath(`/admin/meetings/${id}/status`);
  revalidatePath("/admin/meetings");
  redirect(`/admin/meetings/${id}/status?result=${encodeURIComponent("회의를 마감했습니다.")}`);
}
