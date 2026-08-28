import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }) {
  const sp = (await searchParams) || {};

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">로그인</h1>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      <section className="card">
        <LoginForm />
      </section>

      <p>
        <Link href="/signup">계정이 없으신가요? 회원가입</Link>
      </p>
    </main>
  );
}
