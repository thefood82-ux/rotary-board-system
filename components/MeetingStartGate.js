"use client";

import { useState } from "react";

// 정족수 배너 + "회의 시작" 버튼과, 그 아래 안건/회의록 영역(children)을 함께 관리한다.
// "회의 시작"을 눌러야 children(안건 및 회의 진행, 회의록)이 노출된다 — 화면 표시 전용이라
// DB에 따로 기록하지 않는다(새로고침하면 다시 시작 전 상태로 돌아감).
export default function MeetingStartGate({ quorumMet, quorumText, children }) {
  const [started, setStarted] = useState(false);

  return (
    <>
      <div className={`quorum-banner quorum-banner-row ${quorumMet ? "met" : "unmet"}`}>
        <span>{quorumText}</span>
        {!quorumMet ? (
          <p className="hint-warning">정족수가 충족되지 않아 회의를 시작할 수 없습니다.</p>
        ) : started ? (
          <p className="banner success">회의가 시작되었습니다.</p>
        ) : (
          <button type="button" className="btn-gold" onClick={() => setStarted(true)}>
            회의 시작
          </button>
        )}
      </div>

      {started ? (
        children
      ) : (
        <p className="empty-state">회의를 시작하면 안건 및 회의 진행, 회의록 항목이 표시됩니다.</p>
      )}
    </>
  );
}
