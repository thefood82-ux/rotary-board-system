const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// meeting_date는 timestamptz라 PostgREST가 UTC로 돌려준다 — 화면에는 항상 한국 시간(KST)
// 기준 날짜/시각으로 보여줘야 하므로, 서버 타임존 설정과 무관하게 Asia/Seoul로 고정 변환한다.
function getKoreaDateParts(isoString) {
  const date = new Date(isoString);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour === "24" ? "00" : parts.hour,
    minute: parts.minute,
  };
}

function weekdayLabel(year, month, day) {
  return WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
}

// "2026.07.02 (목) 17:00" — 목록/성원현황/응답 화면 등 짧은 표기용.
export function formatMeetingDateShort(isoString) {
  if (!isoString) return "";
  const { year, month, day, hour, minute } = getKoreaDateParts(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}.${pad(month)}.${pad(day)} (${weekdayLabel(year, month, day)}) ${hour}:${minute}`;
}

// "2026년 7월 2일(목) 17:00" — 회의록 "일시" 항목용 긴 표기.
export function formatMeetingDateLong(isoString) {
  if (!isoString) return "";
  const { year, month, day, hour, minute } = getKoreaDateParts(isoString);
  return `${year}년 ${month}월 ${day}일(${weekdayLabel(year, month, day)}) ${hour}:${minute}`;
}

// <input type="datetime-local"> 값("2026-07-02T17:00")을 한국 시간대(+09:00) ISO 문자열로 변환.
// 이렇게 명시적으로 오프셋을 붙여야 DB 세션 타임존 설정과 무관하게 항상 KST로 해석된다.
export function toKoreaIsoString(datetimeLocalValue) {
  if (!datetimeLocalValue) return null;
  const withSeconds = datetimeLocalValue.length === 16 ? `${datetimeLocalValue}:00` : datetimeLocalValue;
  return `${withSeconds}+09:00`;
}
