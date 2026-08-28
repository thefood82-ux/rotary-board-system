import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <h1>새송탄로타리클럽 이사회 성원보고·전자결재 시스템</h1>
      <p>
        <Link href="/members">명부 관리</Link>
      </p>
    </main>
  );
}
