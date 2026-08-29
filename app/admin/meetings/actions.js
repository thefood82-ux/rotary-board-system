"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getCurrentTerm } from "@/lib/data";
import { createMeeting } from "@/lib/mutations";
import { toKoreaIsoString } from "@/lib/dates";

// Server Action은 URL을 알면 누구나 직접 POST할 수 있으므로, UI에서 버튼을 숨겼더라도
// 반드시 서버에서 다시 한번 관리자 권한을 확인한다.

export async function createMeetingAction(formData) {
  const { user } = await requireAdmin();
  const meetingDateTimeLocal = (formData.get("meeting_datetime") || "").toString();
  const agenda = (formData.get("agenda") || "").toString().trim();

  if (!meetingDateTimeLocal) {
    redirect(`/admin/meetings?error=${encodeURIComponent("날짜와 시간을 입력해주세요.")}`);
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
    await createMeeting({
      termId: currentTerm.id,
      meetingDateTime: toKoreaIsoString(meetingDateTimeLocal),
      agenda,
      createdBy: user.id,
    });
  } catch (err) {
    redirect(`/admin/meetings?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/admin/meetings");
  redirect(`/admin/meetings?result=${encodeURIComponent("회의를 등록했습니다.")}`);
}
