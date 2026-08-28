"use client";

import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 1500;

const STATUS_TEXT = {
  saved: "저장됨",
  pending: "입력 중...",
  saving: "저장 중...",
  error: "저장 실패 — 잠시 후 다시 시도해주세요",
};

export default function MinutesEditor({ meetingId, initialContent, autosaveAction, finalizeAction }) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState("saved");
  const timerRef = useRef(null);
  const latestContentRef = useRef(initialContent);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setContent(value);
    latestContentRef.current = value;
    setStatus("pending");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const result = await autosaveAction(meetingId, latestContentRef.current);
      setStatus(result?.ok ? "saved" : "error");
    }, DEBOUNCE_MS);
  }

  return (
    <div>
      <div className={`autosave-status autosave-${status}`}>{STATUS_TEXT[status]}</div>
      <textarea
        name="content"
        className="minutes-textarea"
        value={content}
        onChange={handleChange}
        rows={20}
      />
      <div className="row-actions" style={{ marginTop: "0.9rem" }}>
        <form action={finalizeAction}>
          <input type="hidden" name="meeting_id" value={meetingId} />
          <input type="hidden" name="content" value={content} readOnly />
          <button type="submit" className="btn-gold">
            확정
          </button>
        </form>
      </div>
    </div>
  );
}
