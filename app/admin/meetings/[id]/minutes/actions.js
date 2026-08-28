"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseSessionClient } from "@/lib/supabase-session";
import { getMeetingMinutes, getMeetingById, getBoardMembers, getAttendanceResponses } from "@/lib/data";
import { createMeetingMinutes, updateMeetingMinutesContent, setMeetingMinutesStatus } from "@/lib/mutations";
import { buildAttendanceSummary } from "@/lib/minutes";

// 로그인/관리자 권한 검사가 아직 없어 누구나 호출할 수 있는 상태다.
// 인증이 추가되면 각 액션 시작 부분에 requireAdmin() 호출을 넣어야 한다.
// (최초 저장 시 created_by는 NOT NULL FK라 로그인 세션이 필요 — 권한 검사와는 별개)

// 회의록 행이 없으면 새로 만들고(이때만 성원현황 스냅샷 계산), 있으면 content만 갱신한다.
// 반환값: 저장된 meeting_minutes의 id.
async function saveContent(meetingId, content) {
  const existing = await getMeetingMinutes(meetingId);

  if (existing) {
    if (existing.status === "final") {
      throw new Error("확정된 회의록입니다. 초안으로 되돌린 후 수정해주세요.");
    }
    await updateMeetingMinutesContent({ id: existing.id, content });
    return existing.id;
  }

  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("회의록을 저장하려면 먼저 로그인해주세요.");
  }

  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    throw new Error("존재하지 않는 회의입니다.");
  }

  const [roster, responses] = await Promise.all([
    getBoardMembers(meeting.term_id),
    getAttendanceResponses(meetingId),
  ]);
  const attendanceSummary = buildAttendanceSummary(roster, responses);

  const created = await createMeetingMinutes({ meetingId, content, attendanceSummary, createdBy: user.id });
  return created.id;
}

// 타이핑을 멈추면 클라이언트(MinutesEditor)가 디바운스 후 이 함수를 직접 호출한다.
// form 제출이 아니라 일반 함수 호출이라 redirect 대신 결과 객체를 반환한다.
export async function autosaveMinutesContent(meetingId, content) {
  try {
    await saveContent(meetingId, content);
  } catch (err) {
    return { ok: false, error: err.message };
  }

  revalidatePath(`/admin/meetings/${meetingId}/status`);
  return { ok: true };
}

export async function finalizeMinutesAction(formData) {
  const meetingId = formData.get("meeting_id");
  const content = (formData.get("content") || "").toString();

  try {
    const id = await saveContent(meetingId, content);
    await setMeetingMinutesStatus({ id, status: "final" });
  } catch (err) {
    redirect(`/admin/meetings/${meetingId}/minutes?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath(`/admin/meetings/${meetingId}/minutes`);
  redirect(`/admin/meetings/${meetingId}/minutes?result=${encodeURIComponent("회의록을 확정했습니다.")}`);
}

export async function revertMinutesToDraftAction(formData) {
  const meetingId = formData.get("meeting_id");
  const id = formData.get("id");

  try {
    await setMeetingMinutesStatus({ id, status: "draft" });
  } catch (err) {
    redirect(`/admin/meetings/${meetingId}/minutes?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath(`/admin/meetings/${meetingId}/minutes`);
  redirect(`/admin/meetings/${meetingId}/minutes?result=${encodeURIComponent("초안으로 되돌렸습니다.")}`);
}
