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
  seq,
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
                <td>
                  <input value={author} onChange={field("author", setAuthor)} placeholder="예: 총무 임상재" />
                </td>
              </tr>
              <tr>
                <th>회의명</th>
                <td>
                  <input value={meetingTitle} onChange={field("meetingTitle", setMeetingTitle)} />
                </td>
              </tr>
              <tr>
                <th>일시</th>
                <td className="minutes-doc-readonly-value">{meetingDateTimeText}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="minutes-doc-section-title">성원보고</h2>
          <div className="minutes-doc-quorum-box">
            <textarea rows={3} value={quorumReportText} onChange={field("quorumReportText", setQuorumReportText)} />
          </div>

          <h2 className="minutes-doc-section-title">출석 및 성원 상세 현황</h2>
          <div className="minutes-doc-editable-box">
            <textarea
              rows={8}
              value={attendanceDetailText}
              onChange={field("attendanceDetailText", setAttendanceDetailText)}
            />
          </div>
          <p className="hint">
            "그룹명(정원) 참석: 이름 / 위임: 이름 → 받는사람 / 불참: 이름" 형식으로 한 줄씩 쓰면 회의록 보기 화면에서 표로
            정리되어 보입니다.
          </p>

          <h2 className="minutes-doc-section-title">심의 및 의결 사항</h2>
          <div className="minutes-doc-editable-box">
            <textarea rows={10} value={resolutionText} onChange={field("resolutionText", setResolutionText)} />
          </div>
          <p className="hint">"1) ...", "2) ..." 형식으로 번호를 붙이면 회의록 보기 화면에서 번호 목록으로 정리되어 보입니다.</p>
        </div>
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
