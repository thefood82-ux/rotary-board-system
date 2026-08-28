"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTerm, createBoardMember, updateBoardMember, deleteBoardMember } from "@/lib/mutations";

// 로그인/관리자 권한 기능이 아직 없어 누구나 호출할 수 있는 상태다.
// 인증이 추가되면 각 액션 시작 부분에 requireAdmin() 호출을 넣어야 한다.

export async function createCurrentTermAction(formData) {
  const name = (formData.get("name") || "").toString().trim();
  if (!name) {
    redirect(`/members?error=${encodeURIComponent("회기 이름을 입력해주세요.")}`);
    return;
  }

  try {
    await createTerm({ name, isCurrent: true });
  } catch (err) {
    redirect(`/members?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/members");
  redirect(`/members?result=${encodeURIComponent(`"${name}" 회기를 생성했습니다.`)}`);
}

export async function addBoardMemberAction(formData) {
  const termId = formData.get("term_id");
  const name = (formData.get("name") || "").toString().trim();
  const position = (formData.get("position") || "").toString().trim();
  const displayOrder = Number(formData.get("display_order") || 0);

  if (!termId || !name || !position) {
    redirect(`/members?error=${encodeURIComponent("이름과 직책을 입력해주세요.")}`);
    return;
  }

  try {
    await createBoardMember({ termId, name, position, displayOrder });
  } catch (err) {
    redirect(`/members?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/members");
  redirect(`/members?result=${encodeURIComponent("이사를 추가했습니다.")}`);
}

export async function updateBoardMemberAction(formData) {
  const id = formData.get("id");
  const name = (formData.get("name") || "").toString().trim();
  const position = (formData.get("position") || "").toString().trim();
  const displayOrder = Number(formData.get("display_order") || 0);

  if (!id || !name || !position) {
    redirect(`/members?error=${encodeURIComponent("이름과 직책을 입력해주세요.")}`);
    return;
  }

  try {
    await updateBoardMember({ id, name, position, displayOrder });
  } catch (err) {
    redirect(`/members?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/members");
  redirect(`/members?result=${encodeURIComponent("이사 정보를 수정했습니다.")}`);
}

export async function deleteBoardMemberAction(formData) {
  const id = formData.get("id");
  if (!id) {
    redirect(`/members?error=${encodeURIComponent("잘못된 요청입니다.")}`);
    return;
  }

  try {
    await deleteBoardMember({ id });
  } catch (err) {
    redirect(`/members?error=${encodeURIComponent(err.message)}`);
    return;
  }

  revalidatePath("/members");
  redirect(`/members?result=${encodeURIComponent("이사를 삭제했습니다.")}`);
}
