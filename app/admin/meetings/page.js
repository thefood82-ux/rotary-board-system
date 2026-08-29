import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getCurrentTerm, getMeetings } from "@/lib/data";
import { formatTermYearLabel } from "@/lib/dates";
import MeetingsTable from "@/components/MeetingsTable";
import CreateMeetingSubmitButton from "@/components/CreateMeetingSubmitButton";
import { createMeetingAction, updateMeetingAction, deleteMeetingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MeetingsAdminPage({ searchParams }) {
  await requireAdmin();
  const sp = (await searchParams) || {};
  const currentTerm = await getCurrentTerm();
  const meetings = currentTerm ? await getMeetings(currentTerm.id) : [];

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">이사회 소집 등록</h1>

      {sp.result && <p className="banner success">{sp.result}</p>}
      {sp.error && <p className="banner error">{sp.error}</p>}

      {!currentTerm ? (
        <section className="card">
          <p className="empty-state">
            아직 활성 회기가 없습니다. 먼저 <Link href="/members">명부 관리</Link>에서 현재 회기를 생성해주세요.
          </p>
        </section>
      ) : (
        <>
          <div className="minutes-doc">
            <div className="minutes-doc-header">
              <p className="eyebrow">ROTARY INTERNATIONAL DIST. 3750</p>
              <h1>이사회 소집 공고</h1>
            </div>
            <div className="minutes-doc-body">
              <p className="meta-line">
                현재 회기: <strong>{formatTermYearLabel(currentTerm.name)}</strong>
              </p>
              <form action={createMeetingAction} className="stack-form stack-form-wide">
                <label>
                  날짜/시간
                  <input type="datetime-local" name="meeting_datetime" required />
                </label>
                <label>
                  안건
                  <div className="minutes-doc-editable-box">
                    <textarea name="agenda" rows={5} placeholder="예: 1) 안건 하나&#10;2) 안건 둘" />
                  </div>
                </label>
                <CreateMeetingSubmitButton />
              </form>
            </div>
          </div>

          <section className="card">
            <h2>등록된 회의 ({meetings.length}건)</h2>
            {meetings.length === 0 ? (
              <p className="empty-state">등록된 회의가 없습니다.</p>
            ) : (
              <MeetingsTable meetings={meetings} updateAction={updateMeetingAction} deleteAction={deleteMeetingAction} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
