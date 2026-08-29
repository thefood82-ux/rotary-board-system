import Link from "next/link";
import { getSessionUser } from "@/lib/dal";
import { getCurrentTerm, getCurrentPresidentName } from "@/lib/data";

export default async function Header() {
  const [user, currentTerm] = await Promise.all([getSessionUser(), getCurrentTerm()]);
  const presidentName = currentTerm ? await getCurrentPresidentName(currentTerm.id) : null;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <img src="/rotarylogo.png" alt="로타리 로고" className="brand-mark" />
          <span className="brand-text">
            새송탄로타리클럽
            <strong>
              26-27년도 이사회
              {presidentName && <span className="term-badge">{presidentName} 회장 회기</span>}
            </strong>
          </span>
        </Link>

        {!user && (
          <nav className="header-auth-links">
            <Link href="/login">로그인</Link>
            <span aria-hidden="true"> | </span>
            <Link href="/signup">회원가입</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
