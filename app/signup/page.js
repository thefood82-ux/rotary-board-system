import Link from "next/link";
import { getCurrentTerm, getBoardMembersForSignup } from "@/lib/data";
import { signupAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const currentTerm = await getCurrentTerm();
  const members = currentTerm ? await getBoardMembersForSignup(currentTerm.id) : [];

  return (
    <main className="page">
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
      <h1>회원가입</h1>

      {sp.error && <p className="banner error">{sp.error}</p>}

      {!currentTerm ? (
        <p>아직 활성 회기가 없어 회원가입을 받을 수 없습니다. 관리자에게 문의해주세요.</p>
      ) : members.length === 0 ? (
        <p>가입 가능한 명부 인물이 없습니다. 관리자에게 문의해주세요.</p>
      ) : (
        <form action={signupAction} className="stack-form">
          <label>
            이메일
            <input type="email" name="email" required />
          </label>
          <label>
            비밀번호 (6자 이상)
            <input type="password" name="password" required minLength={6} />
          </label>
          <label>
            본인 이름 선택
            <select name="board_member_id" required defaultValue="">
              <option value="" disabled>
                선택해주세요
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.position})
                </option>
              ))}
            </select>
          </label>
          <button type="submit">가입 신청</button>
        </form>
      )}

      <p>
        <Link href="/login">이미 계정이 있으신가요? 로그인</Link>
      </p>
    </main>
  );
}
