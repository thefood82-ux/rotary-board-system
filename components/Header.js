import Link from "next/link";
import { getSessionUser, getSessionProfile } from "@/lib/dal";
import { getCurrentTerm, getCurrentPresidentName } from "@/lib/data";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const [user, currentTerm] = await Promise.all([getSessionUser(), getCurrentTerm()]);
  const presidentName = currentTerm ? await getCurrentPresidentName(currentTerm.id) : null;
  const profile = user ? await getSessionProfile(user.id) : null;
  const isAdmin = profile?.role === "admin";

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

      {user && (
        <div className="site-subnav-inner">
          <nav className="site-subnav">
            {isAdmin && (
              <>
                <Link href="/admin/meetings">이사회 소집 등록</Link>
                <Link href="/admin/attendance">출석명단</Link>
                <Link href="/admin/announcements">공지사항 관리</Link>
              </>
            )}
            <span className="site-subnav-divider" aria-hidden="true" />
            <Link href="/status" className="site-subnav-secondary">
              내 계정 상태
            </Link>
            {isAdmin && (
              <>
                <Link href="/members" className="site-subnav-secondary">
                  명부 관리
                </Link>
                <Link href="/admin/approvals" className="site-subnav-secondary">
                  가입 승인 관리
                </Link>
              </>
            )}
          </nav>
          <LogoutButton className="site-subnav-logout" />
        </div>
      )}
    </header>
  );
}
