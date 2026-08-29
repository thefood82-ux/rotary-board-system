import Link from "next/link";
import { getSessionUser, getSessionProfile } from "@/lib/dal";
import { getCurrentTerm, getMeetings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const user = await getSessionUser();
  const profile = user ? await getSessionProfile(user.id) : null;
  const isApproved = profile?.approval_status === "approved";
  const isAdmin = profile?.role === "admin";
  // 사무장/스태프 계정(board_member_id=null)은 이사회 응답 대상이 아니다.
  const isBoardMember = Boolean(profile?.board_member_id);

  let openMeetings = [];
  if (isApproved && isBoardMember) {
    const currentTerm = await getCurrentTerm();
    if (currentTerm) {
      const meetings = await getMeetings(currentTerm.id);
      openMeetings = meetings.filter((m) => m.status === "open");
    }
  }

  return (
    <main>
      <h1 className="page-title">새송탄로타리클럽 26-27년도 이사회</h1>

      {sp.error && <p className="banner error">{sp.error}</p>}

      <nav className="home-links">
        {!user && (
          <>
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
          </>
        )}

        {user && (
          <>
            <Link href="/status">내 계정 상태</Link>
            {openMeetings.length > 0 && (
              <Link href={openMeetings.length === 1 ? `/meetings/${openMeetings[0].id}/respond` : "/status"}>
                내 응답 (진행 중인 회의 {openMeetings.length}건)
              </Link>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <Link href="/members">명부 관리</Link>
            <Link href="/admin/approvals">가입 승인 관리</Link>
            <Link href="/admin/meetings">이사회 소집 등록</Link>
          </>
        )}
      </nav>
    </main>
  );
}
