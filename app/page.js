import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <h1>새송탄로타리클럽 26-27년도 이사회</h1>
      <p>
        <Link href="/members">명부 관리</Link>
      </p>
      <p>
        <Link href="/signup">회원가입</Link>
      </p>
      <p>
        <Link href="/login">로그인</Link>
      </p>
      <p>
        <Link href="/admin/approvals">가입 승인 관리</Link>
      </p>
    </main>
  );
}
