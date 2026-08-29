import { parseAttendanceGroupLine } from "@/lib/minutes";

function parseRows(attendanceDetailText) {
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

// 회의록 초안(MinutesEditor)과 확정본(MinutesDocumentView)이 "출석 및 성원 상세 현황"을
// 똑같은 모양으로 보여주도록 공유하는 렌더러 — attendanceDetailText는 항상 읽기 전용
// (성원현황 페이지 응답에서 자동 계산됨)이라 두 화면 모두 그대로 재사용할 수 있다.
export default function MinutesAttendanceSection({ attendanceDetailText }) {
  const { rows: attendanceRows, extraText } = parseRows(attendanceDetailText) || {};

  return (
    <>
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
    </>
  );
}
