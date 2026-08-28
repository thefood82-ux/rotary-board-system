import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1 className="page-title">새송탄로타리클럽 26-27년도 이사회</h1>
      <nav className="home-links">
        <Link href="/status">내 계정 상태</Link>
        <Link href="/login">로그인</Link>
        <Link href="/signup">회원가입</Link>
        <Link href="/members">명부 관리</Link>
        <Link href="/admin/approvals">가입 승인 관리</Link>
      </nav>
    </main>
  );
}
