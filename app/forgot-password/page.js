import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main>
      <Link href="/login" className="back-link">
        ← 로그인으로
      </Link>
      <h1 className="page-title">비밀번호 찾기</h1>

      <section className="card">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
