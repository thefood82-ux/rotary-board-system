import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }) {
  const sp = (await searchParams) || {};

  return (
    <main className="page">
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
      <h1>로그인</h1>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      <LoginForm />

      <p>
        <Link href="/signup">계정이 없으신가요? 회원가입</Link>
      </p>
    </main>
  );
}
