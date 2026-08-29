import { parseMinutesContent, parseAttendanceGroupLine, parseResolutionItems } from "@/lib/minutes";
import { formatMeetingDateShort } from "@/lib/dates";

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

// /meetings/[id]/minutes(공개 보기)와 /admin/meetings/[id]/minutes(확정된 경우)가 똑같은 모습이 되도록
// 공유하는 "공식 문서" 렌더러. meeting_minutes.content 원문을 그대로 받아 여기서 파싱한다.
export default function MinutesDocumentView({ meeting, content, seq }) {
  const fields = parseMinutesContent(content);

  if (!fields) {
    return (
      <section className="card">
        <p className="hint">이전 형식으로 저장된 회의록이라 원문을 그대로 표시합니다.</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{content}</p>
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
