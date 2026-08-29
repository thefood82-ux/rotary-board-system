import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getCurrentTerm, getMeetings } from "@/lib/data";
import { formatMeetingDateShort } from "@/lib/dates";
import { createMeetingAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_BADGE_TEXT = { open: "진행중", closed: "마감됨" };

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
          <section className="card">
            <h2>새 회의 등록</h2>
            <p className="meta-line">
              현재 회기: <strong>{currentTerm.name}</strong>
            </p>
            <form action={createMeetingAction} className="stack-form stack-form-wide">
              <label>
                날짜/시간
                <input type="datetime-local" name="meeting_datetime" required />
              </label>
              <label>
                안건
                <textarea
                  name="agenda"
                  className="minutes-textarea"
                  rows={4}
                  placeholder="예: 26-27년도 1차 정기이사회"
                />
              </label>
              <button type="submit">등록</button>
            </form>
          </section>

          <section className="card">
            <h2>등록된 회의 ({meetings.length}건)</h2>
            {meetings.length === 0 ? (
              <p className="empty-state">등록된 회의가 없습니다.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>일시</th>
                    <th>안건</th>
                    <th>상태</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => (
                    <tr key={m.id}>
                      <td>{formatMeetingDateShort(m.meeting_date)}</td>
                      <td>{m.agenda || "-"}</td>
                      <td>
                        <span className={`badge badge-${m.status}`}>{STATUS_BADGE_TEXT[m.status]}</span>
                      </td>
                      <td className="row-actions">
                        <Link href={`/admin/meetings/${m.id}/status`} className="btn btn-secondary">
                          성원현황
                        </Link>
                        <Link href={`/meetings/${m.id}/respond`} className="btn btn-secondary">
                          내 응답
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}
