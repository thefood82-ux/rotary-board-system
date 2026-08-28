"use client";

import { useState } from "react";

export default function BoardMemberTable({ termId, members, addAction, updateAction, deleteAction }) {
  const [editingId, setEditingId] = useState(null);

  function handleDeleteClick(e, member) {
    if (!confirm(`"${member.name}" 이사를 명부에서 삭제할까요?`)) {
      e.preventDefault();
    }
  }

  return (
    <section className="card">
      <h2>이사 추가</h2>
      <form action={addAction} className="inline-form">
        <input type="hidden" name="term_id" value={termId} />
        <input name="name" placeholder="이름" required />
        <input name="position" placeholder="직책" required />
        <input name="display_order" type="number" placeholder="정렬순서" defaultValue={members.length} />
        <button type="submit" className="btn-gold">
          추가
        </button>
      </form>

      <h2>재적 이사 명부 ({members.length}명)</h2>
      {members.length === 0 ? (
        <p className="empty-state">등록된 이사가 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>정렬순서</th>
              <th>이름</th>
              <th>직책</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) =>
              editingId === m.id ? (
                <tr key={m.id}>
                  <td colSpan={4}>
                    <form action={updateAction} onSubmit={() => setEditingId(null)} className="inline-form">
                      <input type="hidden" name="id" value={m.id} />
                      <input name="display_order" type="number" defaultValue={m.display_order} />
                      <input name="name" defaultValue={m.name} required />
                      <input name="position" defaultValue={m.position} required />
                      <button type="submit">저장</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={m.id}>
                  <td>{m.display_order}</td>
                  <td>{m.name}</td>
                  <td>{m.position}</td>
                  <td className="row-actions">
                    <button type="button" className="btn-secondary" onClick={() => setEditingId(m.id)}>
                      수정
                    </button>
                    <form action={deleteAction} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="btn-danger" onClick={(e) => handleDeleteClick(e, m)}>
                        삭제
                      </button>
                    </form>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
