"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser, getSessionProfile, requireAdmin } from "@/lib/dal";
import { getMeetingMinutes, getMeetingById, getBoardMembers, getAttendanceResponses, getMeetings, getTermById } from "@/lib/data";
import { createMeetingMinutes, updateMeetingMinutesContent, setMeetingMinutesStatus } from "@/lib/mutations";
import {
  buildAttendanceSummary,
  buildQuorumReportText,
  buildAttendanceDetailText,
  buildMeetingTitle,
  computeMeetingSequence,
  assembleMinutesContent,
  parseMinutesContent,
} from "@/lib/minutes";
import { formatMeetingDateLong } from "@/lib/dates";

// autosaveMinutesContent는 form 제출이 아니라 클라이언트가 직접 호출하는 함수라 redirect를
// 쓸 수 없다(타이핑 중 화면이 튀는 걸 피하려고) — 그래서 여기서는 리다이렉트하는
// requireAdmin() 대신, 실패 시 에러를 던지기만 하는 이 검사를 쓴다.
async function requireAdminOrThrow() {
  const user = await getSessionUser();
  if (!user) throw new Error("회의록을 저장하려면 먼저 로그인해주세요.");
  const profile = await getSessionProfile(user.id);
  if (!profile || profile.role !== "admin") throw new Error("관리자 권한이 필요합니다.");
  return { user, profile };
}

// 작성자/회의명 기본값 — 회의록 페이지에서 최초 초안을 만들 때와 동일한 규칙.
async function defaultAuthor(profile) {
  return profile.board_members ? `${profile.board_members.position} ${profile.board_members.name}` : "";
}
async function defaultMeetingTitle(meeting) {
  const [meetingsInTerm, term] = await Promise.all([getMeetings(meeting.term_id), getTermById(meeting.term_id)]);
  const seq = computeMeetingSequence(meetingsInTerm).get(meeting.id) ?? "?";
  return buildMeetingTitle(term?.name, seq);
}

// fields: { author?, meetingTitle?, resolutionText? } — 셋 다 선택 항목(부분 패치)이다.
// 호출부가 넘기지 않은 필드는 기존에 저장된 값(없으면 기본값)을 그대로 유지한다 — 성원현황
// 페이지의 "안건 및 회의 진행" 메모칸처럼 resolutionText 하나만 저장할 때 author/meetingTitle이
// 비워지지 않게 하기 위함.
// "일시"는 폼에서 받지 않고 항상 meetings.meeting_date에서 새로 읽어 합친다 —
// 요구사항: 일시는 수정 불가, meetings 자체를 고쳐야 바뀌도록.
// "성원보고"/"출석현황"도 폼에서 받지 않고 매번 현재 성원현황(roster+responses)에서 새로 계산한다 —
// 초안 상태인 동안은 성원현황 체크가 곧바로 회의록에 반영되도록 하기 위함(클라이언트가 보낸 값은 신뢰하지 않음).
async function saveFields(meetingId, fields) {
  const { user, profile } = await requireAdminOrThrow();

  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    throw new Error("존재하지 않는 회의입니다.");
  }

  const [roster, responses, existing] = await Promise.all([
    getBoardMembers(meeting.term_id),
    getAttendanceResponses(meetingId),
    getMeetingMinutes(meetingId),
  ]);
  const attendanceSummary = buildAttendanceSummary(roster, responses);
  const quorumReportText = buildQuorumReportText(attendanceSummary);
  const attendanceDetailText = buildAttendanceDetailText(roster, responses);

  if (existing && existing.status === "final") {
    throw new Error("확정된 회의록입니다. 초안으로 되돌린 후 수정해주세요.");
  }
  const existingParsed = existing ? parseMinutesContent(existing.content) : null;

  const author = "author" in fields ? fields.author : (existingParsed?.author ?? (await defaultAuthor(profile)));
  const meetingTitle =
    "meetingTitle" in fields ? fields.meetingTitle : (existingParsed?.meetingTitle ?? (await defaultMeetingTitle(meeting)));
  const resolutionText = "resolutionText" in fields ? fields.resolutionText : (existingParsed?.resolutionText ?? "");

  const content = assembleMinutesContent({
    author,
    meetingTitle,
    meetingDateTimeText: formatMeetingDateLong(meeting.meeting_date),
    quorumReportText,
    attendanceDetailText,
    resolutionText,
  });

  if (existing) {
    await updateMeetingMinutesContent({ id: existing.id, content });
    return existing.id;
  }

  // attendance_summary 컬럼은 "확정 시점 스냅샷" 용도 — 위에서 이미 계산한 값을 그대로 넣는다.
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

// 성원현황 페이지의 "안건 및 회의 진행" 메모칸 전용 — resolutionText 하나만 부분 저장한다.
// 회의록의 "심의 및 의결 사항"과 같은 값이라, 회의록 작성 화면에 그대로 이어서 보인다.
export async function autosaveProgressNotes(meetingId, resolutionText) {
  try {
    await saveFields(meetingId, { resolutionText });
  } catch (err) {
    return { ok: false, error: err.message };
  }

  revalidatePath(`/admin/meetings/${meetingId}/status`);
  revalidatePath(`/admin/meetings/${meetingId}/minutes`);
  return { ok: true };
}

export async function finalizeMinutesAction(formData) {
  const meetingId = formData.get("meeting_id");
  const fields = {
    author: (formData.get("author") || "").toString(),
    meetingTitle: (formData.get("meeting_title") || "").toString(),
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
