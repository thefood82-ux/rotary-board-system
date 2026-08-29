"use client";

import { useState } from "react";

export default function AnnouncementList({ announcements, addAction, updateAction, deleteAction }) {
  const [editingId, setEditingId] = useState(null);

  function handleDeleteClick(e, announcement) {
    if (!confirm(`"${announcement.title}" 공지사항을 삭제할까요?`)) {
      e.preventDefault();
    }
  }

  return (
    <section className="card">
      <h2>공지사항 등록</h2>
      <form action={addAction} className="stack-form">
        <label>
          제목
          <input name="title" required />
        </label>
        <label>
          내용
          <textarea name="content" className="minutes-textarea" rows={6} required />
        </label>
        <button type="submit" className="btn-gold">
          등록
        </button>
      </form>

      <h2>등록된 공지사항 ({announcements.length}건)</h2>
      {announcements.length === 0 ? (
        <p className="empty-state">등록된 공지사항이 없습니다.</p>
      ) : (
        <div className="announcement-admin-list">
          {announcements.map((a) =>
            editingId === a.id ? (
              <form
                key={a.id}
                action={updateAction}
                onSubmit={() => setEditingId(null)}
                className="stack-form announcement-admin-item"
              >
                <input type="hidden" name="id" value={a.id} />
                <label>
                  제목
                  <input name="title" defaultValue={a.title} required />
                </label>
                <label>
                  내용
                  <textarea name="content" className="minutes-textarea" rows={6} defaultValue={a.content} required />
                </label>
                <div className="row-actions">
                  <button type="submit">저장</button>
                  <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div key={a.id} className="announcement-admin-item">
                <h3>{a.title}</h3>
                <p className="hint">{new Date(a.created_at).toLocaleString("ko-KR")}</p>
                <p className="announcement-admin-content">{a.content}</p>
                <div className="row-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditingId(a.id)}>
                    수정
                  </button>
                  <form action={deleteAction} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="btn-danger" onClick={(e) => handleDeleteClick(e, a)}>
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
