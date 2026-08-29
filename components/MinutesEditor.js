"use client";

import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 1500;

const STATUS_TEXT = {
  saved: "저장됨",
  pending: "입력 중...",
  saving: "저장 중...",
  error: "저장 실패 — 잠시 후 다시 시도해주세요",
};

export default function MinutesEditor({
  meetingId,
  initialAuthor,
  initialMeetingTitle,
  meetingDateTimeText,
  initialQuorumReportText,
  initialAttendanceDetailText,
  initialResolutionText,
  autosaveAction,
  finalizeAction,
}) {
  const [author, setAuthor] = useState(initialAuthor);
  const [meetingTitle, setMeetingTitle] = useState(initialMeetingTitle);
  const [quorumReportText, setQuorumReportText] = useState(initialQuorumReportText);
  const [attendanceDetailText, setAttendanceDetailText] = useState(initialAttendanceDetailText);
  const [resolutionText, setResolutionText] = useState(initialResolutionText);
  const [status, setStatus] = useState("saved");

  const timerRef = useRef(null);
  const latestRef = useRef({
    author: initialAuthor,
    meetingTitle: initialMeetingTitle,
    quorumReportText: initialQuorumReportText,
    attendanceDetailText: initialAttendanceDetailText,
    resolutionText: initialResolutionText,
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function scheduleSave(patch) {
    latestRef.current = { ...latestRef.current, ...patch };
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      const result = await autosaveAction(meetingId, latestRef.current);
      setStatus(result?.ok ? "saved" : "error");
    }, DEBOUNCE_MS);
  }

  function field(key, setter) {
    return (e) => {
      setter(e.target.value);
      scheduleSave({ [key]: e.target.value });
    };
  }

  return (
    <div>
      <div className={`autosave-status autosave-${status}`}>{STATUS_TEXT[status]}</div>

      <div className="stack-form">
        <label>
          작성자
          <input value={author} onChange={field("author", setAuthor)} />
        </label>
        <label>
          회의명
          <input value={meetingTitle} onChange={field("meetingTitle", setMeetingTitle)} />
        </label>
        <label>
          일시
          <input value={meetingDateTimeText} readOnly />
        </label>
        <label>
          1. 성원보고
          <textarea
            className="minutes-textarea"
            rows={4}
            value={quorumReportText}
            onChange={field("quorumReportText", setQuorumReportText)}
          />
        </label>
        <label>
          2. 출석 및 성원 상세 현황
          <textarea
            className="minutes-textarea"
            rows={10}
            value={attendanceDetailText}
            onChange={field("attendanceDetailText", setAttendanceDetailText)}
          />
        </label>
        <label>
          3. 심의 및 의결 사항
          <textarea
            className="minutes-textarea"
            rows={10}
            value={resolutionText}
            onChange={field("resolutionText", setResolutionText)}
          />
        </label>
      </div>

      <div className="row-actions" style={{ marginTop: "0.9rem" }}>
        <form action={finalizeAction}>
          <input type="hidden" name="meeting_id" value={meetingId} />
          <input type="hidden" name="author" value={author} readOnly />
          <input type="hidden" name="meeting_title" value={meetingTitle} readOnly />
          <input type="hidden" name="quorum_report_text" value={quorumReportText} readOnly />
          <input type="hidden" name="attendance_detail_text" value={attendanceDetailText} readOnly />
          <input type="hidden" name="resolution_text" value={resolutionText} readOnly />
          <button type="submit" className="btn-gold">
            확정
          </button>
        </form>
      </div>
    </div>
  );
}
