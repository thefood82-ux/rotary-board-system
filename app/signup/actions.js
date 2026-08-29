"use server";

import { redirect } from "next/navigation";
import { createAuthUser } from "@/lib/supabase-admin-auth";
import { createProfile } from "@/lib/mutations";

export async function signupAction(formData) {
  const email = (formData.get("email") || "").toString().trim();
  const password = (formData.get("password") || "").toString();
  const boardMemberId = formData.get("board_member_id");

  if (!email || !password || !boardMemberId) {
    redirect(`/signup?error=${encodeURIComponent("이메일, 비밀번호, 본인 이름을 모두 입력해주세요.")}`);
    return;
  }
  if (password.length < 6) {
    redirect(`/signup?error=${encodeURIComponent("비밀번호는 6자 이상이어야 합니다.")}`);
    return;
  }

  let userId;
  try {
    const user = await createAuthUser({ email, password });
    userId = user.id;
  } catch (err) {
    const isDuplicate = /already.*registered|already exists/i.test(err.message || "");
    const msg = isDuplicate ? "이미 가입된 이메일입니다." : `회원가입에 실패했습니다: ${err.message}`;
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
    return;
  }

  // "staff"는 명부에 없는 사무장/스태프용 선택지 — board_member_id는 null로 저장한다.
  const resolvedBoardMemberId = boardMemberId === "staff" ? null : boardMemberId;

  try {
    await createProfile({ id: userId, email, boardMemberId: resolvedBoardMemberId });
  } catch (err) {
    redirect(
      `/signup?error=${encodeURIComponent(`계정은 생성됐지만 명부 매칭에 실패했습니다: ${err.message}`)}`
    );
    return;
  }

  redirect(`/login?result=${encodeURIComponent("회원가입이 완료됐습니다. 로그인 후 관리자 승인을 기다려주세요.")}`);
}
