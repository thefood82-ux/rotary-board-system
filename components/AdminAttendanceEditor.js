"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "attend", label: "참석" },
  { value: "delegate", label: "위임" },
  { value: "absent", label: "불참" },
];

const ROW_STATUS_TEXT = { saved: "저장됨", saving: "저장 중...", error: "저장 실패" };

// 전화 등으로 접수한 응답을 관리자가 대신 입력/수정 — 선택하는 즉시 저장된다(별도 저장 버튼 없음).
export default function AdminAttendanceEditor({ meetingId, roster, responsesByMemberId, setAction }) {
  const [rows, setRows] = useState(() => {
    const initial = {};
    for (const m of roster) {
      const r = responsesByMemberId[m.id];
      initial[m.id] = { status: r?.status ?? "", delegateToId: r?.delegate_to_id ?? "", rowStatus: null };
    }
    return initial;
  });

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
    <table>
      <thead>
        <tr>
          <th>이름</th>
          <th>직책</th>
          <th>응답</th>
          <th>위임 대상</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {roster.map((m) => {
          const row = rows[m.id];
          return (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.position}</td>
              <td>
                <select value={row.status} onChange={(e) => handleStatusChange(m.id, e.target.value)}>
                  <option value="">미응답</option>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
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
              <td className={`admin-attendance-row-status admin-attendance-row-${row.rowStatus || ""}`}>
                {row.rowStatus ? ROW_STATUS_TEXT[row.rowStatus] : ""}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
