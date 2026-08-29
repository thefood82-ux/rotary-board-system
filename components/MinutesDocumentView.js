import { parseMinutesContent, parseResolutionItems } from "@/lib/minutes";
import { formatMeetingDateShort } from "@/lib/dates";
import MinutesAttendanceSection from "@/components/MinutesAttendanceSection";

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

        <MinutesAttendanceSection attendanceDetailText={fields.attendanceDetailText} />

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

        <p className="minutes-doc-closing">이 상</p>
      </div>
    </div>
  );
}
