"use client";

import { useMemo, useState } from "react";
import { ATTENDANCE_GROUP_ORDER, categoryOf } from "@/lib/minutes";

const STATUS_OPTIONS = [
  { value: "attend", label: "참석" },
  { value: "delegate", label: "위임" },
  { value: "absent", label: "불참" },
];

const ROW_STATUS_TEXT = { saved: "저장됨", saving: "저장 중...", error: "저장 실패" };

function statusClass(status) {
  return `status-${status || "none"}`;
}

function emptyTally() {
  return { attend: 0, delegate: 0, absent: 0, noResponse: 0 };
}

// 전화 등으로 접수한 응답을 관리자가 대신 입력/수정 — 선택하는 즉시 저장된다(별도 저장 버튼 없음).
// 회장단/이사/분과위원장 세 그룹으로 나눠 보여주고, 그룹마다 소계를, 맨 아래에 전체 집계를 보여준다.
export default function AdminAttendanceEditor({ meetingId, roster, responsesByMemberId, setAction }) {
  const [rows, setRows] = useState(() => {
    const initial = {};
    for (const m of roster) {
      const r = responsesByMemberId[m.id];
      initial[m.id] = { status: r?.status ?? "", delegateToId: r?.delegate_to_id ?? "", rowStatus: null };
    }
    return initial;
  });

  const grouped = useMemo(() => {
    const byGroup = new Map(ATTENDANCE_GROUP_ORDER.map((g) => [g, []]));
    for (const m of roster) byGroup.get(categoryOf(m.position)).push(m);
    return ATTENDANCE_GROUP_ORDER.map((group) => ({ group, members: byGroup.get(group) }));
  }, [roster]);

  function tallyOf(members) {
    const counts = emptyTally();
    for (const m of members) {
      const status = rows[m.id]?.status;
      if (status === "attend") counts.attend++;
      else if (status === "delegate") counts.delegate++;
      else if (status === "absent") counts.absent++;
      else counts.noResponse++;
    }
    return counts;
  }

  const totalTally = useMemo(() => tallyOf(roster), [rows, roster]);

  function patchRow(id, patch) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function save(id, status, delegateToId) {
    patchRow(id, { rowStatus: "saving" });
    const result = await setAction(meetingId, id, status, delegateToId || null);
    patchRow(id, { rowStatus: result?.ok ? "saved" : "error" });
  }

  function handleStatusChange(id, status) {
    if (status === "delegate") {
      // 위임 대상을 고를 때까지 저장을 보류한다.
      patchRow(id, { status, delegateToId: "", rowStatus: null });
      return;
    }
    patchRow(id, { status, delegateToId: "" });
    save(id, status, null);
  }

  function handleDelegateChange(id, delegateToId) {
    patchRow(id, { delegateToId });
    if (delegateToId) save(id, "delegate", delegateToId);
  }

  return (
    <div>
      {grouped.map(({ group, members }) => {
        const subtotal = tallyOf(members);
        return (
          <div key={group} className="attendance-group">
            <h3 className="attendance-group-title">
              {group} ({members.length}명)
            </h3>
            <table>
              <thead>
                <tr>
                  <th className="attendance-col-no">No</th>
                  <th>이름</th>
                  <th>직책</th>
                  <th>위임 대상</th>
                  <th>응답</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const row = rows[m.id];
                  return (
                    <tr key={m.id}>
                      <td className="attendance-col-no">{i + 1}</td>
                      <td>{m.name}</td>
                      <td>{m.position}</td>
                      <td>
                        {row.status === "delegate" && (
                          <select value={row.delegateToId} onChange={(e) => handleDelegateChange(m.id, e.target.value)}>
                            <option value="" disabled>
                              선택
                            </option>
                            {roster
                              .filter((x) => x.id !== m.id)
                              .map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name}({x.position})
                                </option>
                              ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <div className="attendance-response-cell">
                          <select
                            className={`status-select ${statusClass(row.status)}`}
                            value={row.status}
                            onChange={(e) => handleStatusChange(m.id, e.target.value)}
                          >
                            <option value="">미응답</option>
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          {row.rowStatus && (
                            <span className={`admin-attendance-row-status admin-attendance-row-${row.rowStatus}`}>
                              {ROW_STATUS_TEXT[row.rowStatus]}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="attendance-subtotal-row">
                  <td colSpan={3}>소계</td>
                  <td colSpan={2}>
                    <span className="status-pill status-attend">참석 {subtotal.attend}</span>
                    <span className="status-pill status-delegate">위임 {subtotal.delegate}</span>
                    <span className="status-pill status-absent">불참 {subtotal.absent}</span>
                    <span className="status-pill status-none">미응답 {subtotal.noResponse}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      <p className="attendance-summary-line">
        <span className="status-pill status-attend">참석 {totalTally.attend}명</span>
        <span className="status-pill status-delegate">위임 {totalTally.delegate}명</span>
        <span className="status-pill status-absent">불참 {totalTally.absent}명</span>
        <span className="status-pill status-none">미응답 {totalTally.noResponse}명</span>
        <span className="attendance-summary-total">재적 {roster.length}명</span>
      </p>
    </div>
  );
}
