import Link from "next/link";
import { redirect } from "next/navigation";
import { requireApprovedMember } from "@/lib/dal";
import { getMeetingById, getBoardMembers, getMyAttendanceResponse } from "@/lib/data";
import { formatMeetingDateShort } from "@/lib/dates";
import AttendanceForm from "@/components/AttendanceForm";
import { respondAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { attend: "참석", delegate: "위임", absent: "불참" };

export default async function RespondPage({ params, searchParams }) {
  const { profile } = await requireApprovedMember();
  // 사무장/스태프 계정(board_member_id=null)은 응답 대상이 아니다 — 에러 화면 대신 홈으로.
  if (!profile.board_member_id) {
    redirect(`/?error=${encodeURIComponent("응답 대상이 아닙니다.")}`);
  }
  const { id } = await params;
  const sp = (await searchParams) || {};

  const meeting = await getMeetingById(id);
  if (!meeting) {
    return (
      <main>
        <Link href="/" className="back-link">
          ← 홈으로
        </Link>
        <h1 className="page-title">내 응답</h1>
        <p className="banner error">존재하지 않는 회의입니다.</p>
      </main>
    );
  }

  const [members, myResponse] = await Promise.all([
    getBoardMembers(meeting.term_id),
    getMyAttendanceResponse(id, profile.board_member_id),
  ]);
  const delegateOptions = members.filter((m) => m.id !== profile.board_member_id);

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">내 응답</h1>

      <p className="meta-line">
        {formatMeetingDateShort(meeting.meeting_date)} {meeting.agenda ? `· ${meeting.agenda}` : ""}
      </p>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      <section className="card">
        {meeting.status === "closed" ? (
          <>
            <p className="banner error">마감되어 수정할 수 없습니다.</p>
            {myResponse && (
              <p className="meta-line">
                제출한 응답: <strong>{STATUS_LABEL[myResponse.status]}</strong>
                {myResponse.status === "delegate" &&
                  (() => {
                    const delegate = members.find((m) => m.id === myResponse.delegate_to_id);
                    return delegate ? ` → ${delegate.name} (${delegate.position})` : "";
                  })()}
              </p>
            )}
          </>
        ) : (
          <AttendanceForm
            action={respondAction}
            meetingId={meeting.id}
            boardMemberId={profile.board_member_id}
            delegateOptions={delegateOptions}
            initialStatus={myResponse?.status}
            initialDelegateToId={myResponse?.delegate_to_id}
          />
        )}
      </section>
    </main>
  );
}
