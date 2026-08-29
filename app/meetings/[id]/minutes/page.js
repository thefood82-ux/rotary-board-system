import Link from "next/link";
import { requireApprovedMember } from "@/lib/dal";
import { getMeetingById, getMeetingMinutes, getMeetings, getTermById } from "@/lib/data";
import { computeMeetingSequence, parseMinutesContent, parseAttendanceGroupLine } from "@/lib/minutes";
import { formatMeetingDateShort } from "@/lib/dates";

export const dynamic = "force-dynamic";

function renderAttendanceTable(attendanceDetailText) {
  if (!attendanceDetailText) return null;
  const lines = attendanceDetailText.split("\n");
  const rows = [];
  const extraLines = [];
  for (const line of lines) {
    const parsed = parseAttendanceGroupLine(line);
    if (parsed) rows.push(parsed);
    else if (line.trim()) extraLines.push(line);
  }
  return { rows, extraText: extraLines.join("\n") };
}

function parseResolutionItems(resolutionText) {
  if (!resolutionText) return { items: [], numbered: false };
  const lines = resolutionText.split("\n");
  const itemStart = /^(\d+)\)\s*(.*)$/;
  const numbered = lines.some((l) => itemStart.test(l));
  if (!numbered) return { items: [resolutionText], numbered: false };

  const items = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(itemStart);
    if (m) {
      if (current) items.push(current.join("\n").trim());
      current = [m[2]];
    } else if (current) {
      current.push(line);
    }
  }
  if (current) items.push(current.join("\n").trim());
  return { items, numbered: true };
}

export default async function MeetingMinutesViewPage({ params }) {
  const { profile } = await requireApprovedMember();
  const isAdmin = profile?.role === "admin";
  const { id } = await params;

  const meeting = await getMeetingById(id);
  if (!meeting) {
    return (
      <main>
        <Link href="/" className="back-link">
          ← 홈으로
        </Link>
        <h1 className="page-title">회의록</h1>
        <p className="banner error">존재하지 않는 회의입니다.</p>
      </main>
    );
  }

  const minutes = await getMeetingMinutes(id);

  return (
    <main>
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <h1 className="page-title">회의록</h1>

      {isAdmin && (
        <p className="meta-line">
          <Link href={`/admin/meetings/${id}/minutes`} className="btn btn-secondary">
            {minutes ? "수정하기" : "회의록 작성하기"}
          </Link>
        </p>
      )}

      {!minutes ? (
        <section className="card">
          <p className="empty-state">아직 작성된 회의록이 없습니다.</p>
        </section>
      ) : (
        <MinutesDocument meeting={meeting} minutes={minutes} />
      )}
    </main>
  );
}

async function MinutesDocument({ meeting, minutes }) {
  const [meetingsInTerm, term] = await Promise.all([getMeetings(meeting.term_id), getTermById(meeting.term_id)]);
  const seq = computeMeetingSequence(meetingsInTerm).get(meeting.id) ?? "?";

  const fields = parseMinutesContent(minutes.content);

  if (!fields) {
    // 구분자 태그가 없는 옛 형식 데이터 — 원문 그대로 보여준다.
    return (
      <section className="card">
        <p className="hint">이전 형식으로 저장된 회의록이라 원문을 그대로 표시합니다.</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{minutes.content}</p>
      </section>
    );
  }

  const { rows: attendanceRows, extraText } = renderAttendanceTable(fields.attendanceDetailText) || {};
  const { items: resolutionItems, numbered } = parseResolutionItems(fields.resolutionText);

  return (
    <div className="minutes-doc">
      <div className="minutes-doc-header">
        <p className="eyebrow">ROTARY INTERNATIONAL DIST. 3750</p>
        <h1>제{seq}차 정기이사회 회의록</h1>
      </div>

      <div className="minutes-doc-body">
        <table className="minutes-doc-meta-table">
          <tbody>
            <tr>
              <th>작성자</th>
              <td>{fields.author || "-"}</td>
            </tr>
            <tr>
              <th>회의명</th>
              <td>{fields.meetingTitle || "-"}</td>
            </tr>
            <tr>
              <th>일시</th>
              <td>{formatMeetingDateShort(meeting.meeting_date)}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="minutes-doc-section-title">성원보고</h2>
        <div className="minutes-doc-quorum-box">{fields.quorumReportText || "-"}</div>

        <h2 className="minutes-doc-section-title">출석 및 성원 상세 현황</h2>
        {attendanceRows && attendanceRows.length > 0 ? (
          <table className="minutes-doc-attendance-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>참석</th>
                <th>위임</th>
                <th>불참</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((r, i) => (
                <tr key={i}>
                  <td>
                    {r.groupName}({r.count})
                  </td>
                  <td>{r.attend || "없음"}</td>
                  <td>{r.delegate || "없음"}</td>
                  <td>{r.absent || "없음"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {extraText && <p className="minutes-doc-extra-text">{extraText}</p>}
        {(!attendanceRows || attendanceRows.length === 0) && !extraText && <p className="empty-state">내용 없음</p>}

        <h2 className="minutes-doc-section-title">심의 및 의결 사항</h2>
        {resolutionItems.length === 0 ? (
          <p className="empty-state">내용 없음</p>
        ) : numbered ? (
          <ol className="minutes-doc-resolution-list">
            {resolutionItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        ) : (
          <p style={{ whiteSpace: "pre-wrap" }}>{resolutionItems[0]}</p>
        )}
      </div>
    </div>
  );
}
