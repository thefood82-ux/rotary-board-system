"use client";

export default function CreateMeetingSubmitButton() {
  function handleClick(e) {
    const form = e.currentTarget.form;
    const datetime = form.elements["meeting_datetime"]?.value;
    if (!datetime) return; // 필수 입력 검증은 브라우저 기본 동작에 맡긴다.

    const [datePart, timePart] = datetime.split("T");
    const agenda = (form.elements["agenda"]?.value || "").trim();
    const agendaPreview = agenda ? agenda.split("\n")[0] : "(안건 미입력)";

    const confirmed = confirm(`${datePart} ${timePart} 회의를 등록할까요?\n안건: ${agendaPreview}`);
    if (!confirmed) e.preventDefault();
  }

  return (
    <button type="submit" onClick={handleClick}>
      등록
    </button>
  );
}
