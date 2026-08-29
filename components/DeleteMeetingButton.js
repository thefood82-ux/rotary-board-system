"use client";

export default function DeleteMeetingButton({ meetingId, agenda, action }) {
  function handleClick(e) {
    if (!confirm(`"${agenda || "안건 미입력"}" 회의를 삭제할까요? 응답·회의록이 있으면 함께 삭제됩니다.`)) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} style={{ display: "inline" }}>
      <input type="hidden" name="id" value={meetingId} />
      <button type="submit" className="btn-danger" onClick={handleClick}>
        삭제
      </button>
    </form>
  );
}
