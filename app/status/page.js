import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseSessionClient } from "@/lib/supabase-session";
import { getProfileByUserId } from "@/lib/data";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  pending: "승인 대기 중입니다. 관리자 승인 후 이사회 응답 기능을 이용하실 수 있습니다.",
  approved: "승인되었습니다. 이사회 응답 기능을 이용하실 수 있습니다.",
  rejected: "가입 신청이 반려되었습니다. 관리자에게 문의해주세요.",
};

const STATUS_BADGE_TEXT = {
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "반려됨",
};

export default async function StatusPage() {
  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileByUserId(user.id);

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">내 계정 상태</h1>

      <section className="card">
        <p className="meta-line">이메일: {user.email}</p>

        {!profile ? (
          <p className="banner error">계정 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.</p>
        ) : (
          <>
            <p>
              선택한 명부 인물: {profile.board_members?.name} ({profile.board_members?.position})
            </p>
            <p>
              <span className={`badge badge-${profile.approval_status}`}>
                {STATUS_BADGE_TEXT[profile.approval_status] || profile.approval_status}
              </span>
            </p>
            <p className="banner">{STATUS_LABEL[profile.approval_status] || profile.approval_status}</p>
          </>
        )}
      </section>

      <LogoutButton />
    </main>
  );
}
