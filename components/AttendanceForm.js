"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "attend", label: "참석" },
  { value: "delegate", label: "위임" },
  { value: "absent", label: "불참" },
];

export default function AttendanceForm({
  action,
  meetingId,
  boardMemberId,
  delegateOptions,
  initialStatus,
  initialDelegateToId,
}) {
  const [status, setStatus] = useState(initialStatus || "attend");

  return (
    <form action={action} className="stack-form">
      <input type="hidden" name="meeting_id" value={meetingId} />
      <input type="hidden" name="board_member_id" value={boardMemberId} />

      <div className="radio-group">
        {STATUS_OPTIONS.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name="status"
              value={opt.value}
              checked={status === opt.value}
              onChange={() => setStatus(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {status === "delegate" && (
        <label>
          수임인 (위임받는 이사)
          <select name="delegate_to_id" required defaultValue={initialDelegateToId || ""}>
            <option value="" disabled>
              선택해주세요
            </option>
            {delegateOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.position})
              </option>
            ))}
          </select>
        </label>
      )}

      <button type="submit">응답 저장</button>
    </form>
  );
}
