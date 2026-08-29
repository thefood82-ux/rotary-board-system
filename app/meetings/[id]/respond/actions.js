"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireApprovedMember } from "@/lib/dal";
import { getMeetingById } from "@/lib/data";
import { upsertAttendanceResponse } from "@/lib/mutations";

// board_member_id는 폼에서 받지 않고 항상 로그인 세션의 profile에서 가져온다 —
// 다른 이사인 척 응답하는 걸 막기 위해서다(클라이언트가 보낸 값은 절대 신뢰하지 않음).
export async function respondAction(formData) {
  const { profile } = await requireApprovedMember();
  const meetingId = formData.get("meeting_id");
  const status = (formData.get("status") || "").toString();
  const delegateToId = formData.get("delegate_to_id") || null;

  if (!profile?.board_member_id) {
    redirect(
      `/meetings/${meetingId}/respond?error=${encodeURIComponent("계정에 매칭된 명부 인물이 없습니다. 관리자에게 문의해주세요.")}`
    );
    return;
  }

  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    redirect(`/status?error=${encodeURIComponent("존재하지 않는 회의입니다.")}`);
    return;
  }
  if (meeting.status === "closed") {
    redirect(`/meetings/${meetingId}/respond?error=${encodeURIComponent("마감된 회의는 응답을 수정할 수 없습니다.")}`);
    return;
  }

  if (!["attend", "delegate", "absent"].includes(status)) {
    redirect(`/meetings/${meetingId}/respond?error=${encodeURIComponent("잘못된 응답입니다.")}`);
    return;
  }
  if (status === "delegate" && !delegateToId) {
    redirect(`/meetings/${meetingId}/respond?error=${encodeURIComponent("위임을 선택했다면 수임인을 지정해주세요.")}`);
    return;
  }
  if (status === "delegate" && delegateToId === profile.board_member_id) {
    redirect(`/meetings/${meetingId}/respond?error=${encodeURIComponent("본인에게 위임할 수 없습니다.")}`);
    return;
  }

  try {
    await upsertAttendanceResponse({
      meetingId,
      boardMemberId: profile.board_member_id,
      status,
      delegateToId,
    });
  } catch (err) {
    redirect(`/meetings/${meetingId}/respond?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath(`/meetings/${meetingId}/respond`);
  revalidatePath(`/admin/meetings/${meetingId}/status`);
  redirect(`/meetings/${meetingId}/respond?result=${encodeURIComponent("응답을 저장했습니다.")}`);
}
