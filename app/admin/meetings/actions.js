"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseSessionClient } from "@/lib/supabase-session";
import { getCurrentTerm } from "@/lib/data";
import { createMeeting } from "@/lib/mutations";

// 로그인/관리자 권한 검사가 아직 없어 누구나 호출할 수 있는 상태다.
// 인증이 추가되면 이 액션 시작 부분에 requireAdmin() 호출을 넣어야 한다.
// (created_by는 NOT NULL FK라 로그인 세션은 필요 — 이는 권한 검사가 아니라 데이터 요구사항)

export async function createMeetingAction(formData) {
  const meetingDate = (formData.get("meeting_date") || "").toString();
  const agenda = (formData.get("agenda") || "").toString().trim();

  if (!meetingDate) {
    redirect(`/admin/meetings?error=${encodeURIComponent("날짜를 입력해주세요.")}`);
    return;
  }

  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/admin/meetings?error=${encodeURIComponent("회의를 등록하려면 먼저 로그인해주세요.")}`);
    return;
  }

  const currentTerm = await getCurrentTerm();
  if (!currentTerm) {
    redirect(
      `/admin/meetings?error=${encodeURIComponent("활성 회기가 없습니다. 먼저 명부 관리에서 회기를 생성해주세요.")}`
    );
    return;
  }

  try {
    await createMeeting({ termId: currentTerm.id, meetingDate, agenda, createdBy: user.id });
  } catch (err) {
    redirect(`/admin/meetings?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/admin/meetings");
  redirect(`/admin/meetings?result=${encodeURIComponent("회의를 등록했습니다.")}`);
}
