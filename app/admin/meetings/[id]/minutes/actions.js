"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser, getSessionProfile, requireAdmin } from "@/lib/dal";
import { getMeetingMinutes, getMeetingById, getBoardMembers, getAttendanceResponses } from "@/lib/data";
import { createMeetingMinutes, updateMeetingMinutesContent, setMeetingMinutesStatus } from "@/lib/mutations";
import { buildAttendanceSummary, assembleMinutesContent } from "@/lib/minutes";
import { formatMeetingDateLong } from "@/lib/dates";

// autosaveMinutesContent는 form 제출이 아니라 클라이언트가 직접 호출하는 함수라 redirect를
// 쓸 수 없다(타이핑 중 화면이 튀는 걸 피하려고) — 그래서 여기서는 리다이렉트하는
// requireAdmin() 대신, 실패 시 에러를 던지기만 하는 이 검사를 쓴다.
async function requireAdminOrThrow() {
  const user = await getSessionUser();
  if (!user) throw new Error("회의록을 저장하려면 먼저 로그인해주세요.");
  const profile = await getSessionProfile(user.id);
  if (!profile || profile.role !== "admin") throw new Error("관리자 권한이 필요합니다.");
  return user;
}

// fields: { author, meetingTitle, quorumReportText, attendanceDetailText, resolutionText }.
// "일시"는 폼에서 받지 않고 항상 meetings.meeting_date에서 새로 읽어 합친다 —
// 요구사항: 일시는 수정 불가, meetings 자체를 고쳐야 바뀌도록.
async function saveFields(meetingId, fields) {
  const user = await requireAdminOrThrow();

  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    throw new Error("존재하지 않는 회의입니다.");
  }

  const content = assembleMinutesContent({
    author: fields.author,
    meetingTitle: fields.meetingTitle,
    meetingDateTimeText: formatMeetingDateLong(meeting.meeting_date),
    quorumReportText: fields.quorumReportText,
    attendanceDetailText: fields.attendanceDetailText,
    resolutionText: fields.resolutionText,
  });

  const existing = await getMeetingMinutes(meetingId);

  if (existing) {
    if (existing.status === "final") {
      throw new Error("확정된 회의록입니다. 초안으로 되돌린 후 수정해주세요.");
    }
    await updateMeetingMinutesContent({ id: existing.id, content });
    return existing.id;
  }

  // attendance_summary는 "작성 시점 스냅샷"이라 최초 생성 시에만 계산해서 넣는다.
  const [roster, responses] = await Promise.all([
    getBoardMembers(meeting.term_id),
    getAttendanceResponses(meetingId),
  ]);
  const attendanceSummary = buildAttendanceSummary(roster, responses);

  const created = await createMeetingMinutes({ meetingId, content, attendanceSummary, createdBy: user.id });
  return created.id;
}

// 타이핑을 멈추면 클라이언트(MinutesEditor)가 디바운스 후 이 함수를 직접 호출한다.
export async function autosaveMinutesContent(meetingId, fields) {
  try {
    await saveFields(meetingId, fields);
  } catch (err) {
    return { ok: false, error: err.message };
  }

  revalidatePath(`/admin/meetings/${meetingId}/status`);
  return { ok: true };
}

export async function finalizeMinutesAction(formData) {
  const meetingId = formData.get("meeting_id");
  const fields = {
    author: (formData.get("author") || "").toString(),
    meetingTitle: (formData.get("meeting_title") || "").toString(),
    quorumReportText: (formData.get("quorum_report_text") || "").toString(),
    attendanceDetailText: (formData.get("attendance_detail_text") || "").toString(),
    resolutionText: (formData.get("resolution_text") || "").toString(),
  };

  try {
    const id = await saveFields(meetingId, fields);
    await setMeetingMinutesStatus({ id, status: "final" });
  } catch (err) {
    redirect(`/admin/meetings/${meetingId}/minutes?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath(`/admin/meetings/${meetingId}/minutes`);
  redirect(`/admin/meetings/${meetingId}/minutes?result=${encodeURIComponent("회의록을 확정했습니다.")}`);
}

export async function revertMinutesToDraftAction(formData) {
  await requireAdmin();
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
