import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main>
      <h1 className="page-title">비밀번호 재설정</h1>

      <section className="card">
        <ResetPasswordForm />
      </section>
    </main>
  );
}
