const STATUS_LABEL = { attend: "참", delegate: "위", absent: "불" };

function formatRate(count, total) {
  if (total === 0) return "-";
  return `${Math.round((count / total) * 100)}%`;
}

// 출석부(매트릭스) — 회원이 행, 회차가 열. 맨 오른쪽은 회원별 개별 참석률(위임=출석 간주),
// 맨 아래는 회차별 참석률과 전체 평균 참석률.
export default function AttendanceMatrixView({ roster, meetings, responsesByMeetingId }) {
  const totalMeetings = meetings.length;

  const memberRates = roster.map((m) => {
    let attendCount = 0;
    for (const meeting of meetings) {
      const status = responsesByMeetingId.get(meeting.id)?.get(m.id)?.status;
      if (status === "attend" || status === "delegate") attendCount++;
    }
    return attendCount;
  });

  const meetingAttendCounts = meetings.map((meeting) => {
    const responseByMemberId = responsesByMeetingId.get(meeting.id);
    let attendCount = 0;
    for (const m of roster) {
      const status = responseByMemberId?.get(m.id)?.status;
      if (status === "attend" || status === "delegate") attendCount++;
    }
    return attendCount;
  });

  const overallAttendCount = memberRates.reduce((sum, c) => sum + c, 0);
  const overallSlots = roster.length * totalMeetings;

  return (
    <div className="attendance-matrix-scroll">
      <table className="attendance-matrix">
        <thead>
          <tr>
            <th className="attendance-col-no">No</th>
            <th>이름</th>
            <th>직책</th>
            {meetings.map((meeting) => (
              <th key={meeting.id}>{meeting.seq}차</th>
            ))}
            <th>참석률</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((m, i) => (
            <tr key={m.id}>
              <td className="attendance-col-no">{i + 1}</td>
              <td>{m.name}</td>
              <td>{m.position}</td>
              {meetings.map((meeting) => {
                const status = responsesByMeetingId.get(meeting.id)?.get(m.id)?.status || "";
                return (
                  <td key={meeting.id} className="attendance-matrix-cell">
                    <span className={`status-pill status-${status || "none"}`}>{STATUS_LABEL[status] || "-"}</span>
                  </td>
                );
              })}
              <td className="attendance-matrix-rate">{formatRate(memberRates[i], totalMeetings)}</td>
            </tr>
          ))}
          <tr className="attendance-matrix-average-row">
            <td colSpan={3}>회차별 소계</td>
            {meetings.map((meeting, i) => (
              <td key={meeting.id} className="attendance-matrix-cell">
                {formatRate(meetingAttendCounts[i], roster.length)}
              </td>
            ))}
            <td className="attendance-matrix-cell attendance-matrix-average-total">
              평균 {formatRate(overallAttendCount, overallSlots)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
