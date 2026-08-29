"use client";

import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 1500;

const STATUS_TEXT = {
  saved: "저장됨",
  pending: "입력 중...",
  saving: "저장 중...",
  error: "저장 실패 — 잠시 후 다시 시도해주세요",
};

// 성원현황 페이지의 "안건 및 회의 진행" — 소집 등록 시 입력한 안건(agendaItems) 하나당
// 아코디언 한 칸씩 배정해 그 자리에서 바로 메모한다. 타이핑을 멈추면 안건 전체를
// "1) 안건\n메모" 형식의 한 텍스트로 합쳐 자동 저장하고, 같은 값이 회의록의
// "심의 및 의결 사항"에도 그대로 반영된다(autosaveAction=autosaveProgressNotes).
export default function ProgressNotesEditor({ meetingId, agendaItems, initialNotes, autosaveAction }) {
  const [notes, setNotes] = useState(initialNotes);
  const [openIndex, setOpenIndex] = useState(-1);
  const [status, setStatus] = useState("saved");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function buildResolutionText(nextNotes) {
    return agendaItems
      .map((title, i) => {
        const note = (nextNotes[i] || "").trim();
        return `${i + 1}) ${title}${note ? `\n${note}` : ""}`;
      })
      .join("\n");
  }

  function handleNoteChange(index, value) {
    const nextNotes = notes.map((n, i) => (i === index ? value : n));
    setNotes(nextNotes);
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const result = await autosaveAction(meetingId, buildResolutionText(nextNotes));
      setStatus(result?.ok ? "saved" : "error");
    }, DEBOUNCE_MS);
  }

  if (agendaItems.length === 0) {
    return (
      <section className="card">
        <p className="empty-state">등록된 안건이 없습니다. 소집 등록 화면에서 안건을 먼저 입력해주세요.</p>
      </section>
    );
  }

  return (
    <div>
      {agendaItems.map((title, i) => {
        const isOpen = openIndex === i;
        // 저장 상태는 전체 메모칸에 공통으로 걸리는 값이라, 내용이 없는 안건에까지 "저장됨"이
        // 뜨면 헷갈린다 — 내용이 있을 때만 저장 상태를 보여주고, 없으면 "내용 없음"으로 고정.
        const hasContent = (notes[i] || "").trim().length > 0;
        return (
          <div key={i} className={`agenda-card ${isOpen ? "open" : ""}`}>
            <button
              type="button"
              className="agenda-card-header"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span className="agenda-card-header-main">
                <span className="agenda-card-header-title">
                  {i + 1}. {title}
                </span>
                <span className={`autosave-status ${hasContent ? `autosave-${status}` : "autosave-empty"}`}>
                  {hasContent ? STATUS_TEXT[status] : "내용 없음"}
                </span>
              </span>
              <span className="agenda-accordion-caret">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="agenda-card-body">
                <textarea
                  className="minutes-textarea"
                  rows={5}
                  value={notes[i] || ""}
                  onChange={(e) => handleNoteChange(i, e.target.value)}
                  placeholder="이 안건에 대한 논의 내용, 결정 사항을 기록하세요."
                />
              </div>
            )}
          </div>
        );
      })}

      <p className="hint">여기 적은 내용은 회의록의 "심의 및 의결 사항"에 자동으로 반영됩니다.</p>
    </div>
  );
}
