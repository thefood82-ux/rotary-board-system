"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteMeetingButton from "./DeleteMeetingButton";
import { formatMeetingDateShort, toDatetimeLocalValue } from "@/lib/dates";

const STATUS_BADGE_TEXT = { open: "진행중", closed: "마감됨" };

export default function MeetingsTable({ meetings, updateAction, deleteAction }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <table>
      <thead>
        <tr>
          <th>일시</th>
          <th>안건</th>
          <th>상태</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {meetings.map((m) =>
          editingId === m.id ? (
            <tr key={m.id}>
              <td colSpan={4}>
                <form action={updateAction} onSubmit={() => setEditingId(null)} className="stack-form stack-form-wide">
                  <input type="hidden" name="id" value={m.id} />
                  <label>
                    날짜/시간
                    <input type="datetime-local" name="meeting_datetime" defaultValue={toDatetimeLocalValue(m.meeting_date)} required />
                  </label>
                  <label>
                    안건
                    <textarea name="agenda" className="minutes-textarea" rows={4} defaultValue={m.agenda || ""} />
                  </label>
                  <div className="row-actions">
                    <button type="submit">저장</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                      취소
                    </button>
                  </div>
                </form>
              </td>
            </tr>
          ) : (
            <tr key={m.id}>
              <td>{formatMeetingDateShort(m.meeting_date)}</td>
              <td>{m.agenda || "-"}</td>
              <td>
                <span className={`badge badge-${m.status}`}>{STATUS_BADGE_TEXT[m.status]}</span>
              </td>
              <td className="row-actions">
                <Link href={`/admin/meetings/${m.id}/status`} className="btn btn-secondary">
                  성원현황
                </Link>
                <Link href={`/meetings/${m.id}/respond`} className="btn btn-secondary">
                  내 응답
                </Link>
                <button type="button" className="btn-secondary" onClick={() => setEditingId(m.id)}>
                  수정
                </button>
                <DeleteMeetingButton meetingId={m.id} agenda={m.agenda} action={deleteAction} />
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}
