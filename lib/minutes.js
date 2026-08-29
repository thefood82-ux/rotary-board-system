import { calculateQuorum } from "./quorum";
import { formatTermYearLabel } from "./dates";

// 회의록 4-6 attendance_summary 스냅샷용 — 요구사항 3-7: 회의록이 아직 없을 때만 계산해서 채운다
// (이미 저장된 회의록의 attendance_summary는 "작성 시점 스냅샷"이라 이후엔 건드리지 않는다).
export function buildAttendanceSummary(roster, responses) {
  const memberById = new Map(roster.map((m) => [m.id, m]));
  const responseByMemberId = new Map(responses.map((r) => [r.board_member_id, r]));

  const attendees = [];
  const delegators = [];
  const absentees = [];
  const noResponse = [];

  for (const member of roster) {
    const response = responseByMemberId.get(member.id);
    const entry = { id: member.id, name: member.name, position: member.position };
    if (!response) {
      noResponse.push(entry);
    } else if (response.status === "attend") {
      attendees.push(entry);
    } else if (response.status === "delegate") {
      const delegate = memberById.get(response.delegate_to_id);
      delegators.push({
        ...entry,
        delegateId: delegate?.id ?? null,
        delegateName: delegate?.name ?? null,
        delegatePosition: delegate?.position ?? null,
      });
    } else {
      absentees.push(entry);
    }
  }

  const total = roster.length;
  const attendCount = attendees.length + delegators.length;
  const { majorityThreshold, quorumMet } = calculateQuorum(total, attendCount);

  return { total, attendCount, majorityThreshold, quorumMet, attendees, delegators, absentees, noResponse };
}

// 요구사항 3-1: 재적 22명 = 회장단 8명(회장/총무/재무/윤리위원장/클럽트레이너/클럽코디네이터/주무사찰/상조회장)
// + 이사 7명 + 분과위원장 7명. 회의록 "출석 및 성원 상세 현황"을 이 세 그룹으로 나눠 보여준다.
const OFFICER_POSITIONS = new Set(["회장", "총무", "재무", "윤리위원장", "클럽트레이너", "클럽코디네이터", "주무사찰", "상조회장"]);
export const ATTENDANCE_GROUP_ORDER = ["회장단", "이사", "분과위원장"];

function categoryOf(position) {
  if (OFFICER_POSITIONS.has(position)) return "회장단";
  if (position === "이사") return "이사";
  return "분과위원장";
}

// 회의 등록 목록(홈 화면 게시판, 회의록 "회의명")에서 공통으로 쓰는 차수 계산.
// 컬럼으로 두지 않고 meeting_date 오름차순 위치로 매번 계산한다.
export function computeMeetingSequence(meetings) {
  const asc = [...meetings].sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
  return new Map(asc.map((m, i) => [m.id, i + 1]));
}

export function buildMeetingTitle(termName, seq) {
  return `새송탄로타리클럽 ${formatTermYearLabel(termName)} 제${seq}차 이사회`;
}

export function buildQuorumReportText(summary) {
  const { total, attendCount, majorityThreshold, quorumMet } = summary;
  return quorumMet
    ? `총 성원 ${total}명 중 참석 ${summary.attendees.length}명, 위임 ${summary.delegators.length}명(총 ${attendCount}명 확인)으로 과반수를 충족하여 성원이 됨에 따라 회장이 개의를 선언함.`
    : `총 성원 ${total}명 중 참석 ${summary.attendees.length}명, 위임 ${summary.delegators.length}명(총 ${attendCount}명 확인)으로 과반수(${majorityThreshold}명)에 미달하여 성원이 되지 못함.`;
}

// "그룹(정원) 참석: 이름, 이름 / 위임: 이름 → 받는사람 / 불참: 이름" 한 줄짜리 그룹 표기 —
// 이미 그룹으로 묶였으니 이름 옆에 직책은 다시 붙이지 않는다.
export function buildAttendanceDetailText(roster, responses) {
  const summary = buildAttendanceSummary(roster, responses);
  const rosterCountByGroup = new Map(ATTENDANCE_GROUP_ORDER.map((g) => [g, 0]));
  for (const m of roster) rosterCountByGroup.set(categoryOf(m.position), rosterCountByGroup.get(categoryOf(m.position)) + 1);

  const byGroup = new Map(ATTENDANCE_GROUP_ORDER.map((g) => [g, { attend: [], delegate: [], absent: [] }]));
  for (const m of summary.attendees) byGroup.get(categoryOf(m.position)).attend.push(m.name);
  for (const m of summary.delegators)
    byGroup.get(categoryOf(m.position)).delegate.push(m.delegateName ? `${m.name} → ${m.delegateName}` : m.name);
  for (const m of summary.absentees) byGroup.get(categoryOf(m.position)).absent.push(m.name);

  const lines = [];
  for (const group of ATTENDANCE_GROUP_ORDER) {
    const g = byGroup.get(group);
    const count = rosterCountByGroup.get(group);
    lines.push(
      `${group}(${count}) 참석: ${g.attend.length ? g.attend.join(", ") : "없음"} / 위임: ${g.delegate.length ? g.delegate.join(", ") : "없음"} / 불참: ${g.absent.length ? g.absent.join(", ") : "없음"}`
    );
  }
  return lines.join("\n");
}

// "그룹(정원) 참석: A, B / 위임: C → D / 불참: E" 형태의 한 줄을 표로 그리기 위해 되읽는다.
// 옛 기록처럼 위임 구간이 아예 없거나(2개 구간만) "배석(...)" 같은 다른 형식의 줄이 섞여 있어도
// 매칭되는 줄만 표로, 나머지는 원문 그대로 보여줄 수 있게 null을 반환한다.
export function parseAttendanceGroupLine(line) {
  const header = line.match(/^(.+?)\((\d+)\)\s*(.*)$/);
  if (!header) return null;
  const [, groupName, countStr, rest] = header;
  const segments = rest.split("/").map((s) => s.trim());
  const result = { groupName, count: Number(countStr), attend: "", delegate: "", absent: "" };
  let matchedAny = false;
  for (const seg of segments) {
    if (seg.startsWith("참석:")) {
      result.attend = seg.slice(3).trim();
      matchedAny = true;
    } else if (seg.startsWith("위임:")) {
      result.delegate = seg.slice(3).trim();
      matchedAny = true;
    } else if (seg.startsWith("불참:")) {
      result.absent = seg.slice(3).trim();
      matchedAny = true;
    }
  }
  return matchedAny ? result : null;
}

// meeting_minutes.content는 컬럼을 나누지 않고 [태그] 줄로 구간을 표시한 하나의 텍스트다.
// [작성자]/[회의명]/[일시]/[성원보고]는 태그와 같은 줄에 값이 오고, [출석현황]/[심의및의결사항]는
// 다음 줄부터 다음 태그 전까지가 값이다. assembleMinutesContent가 만든 형식을
// parseMinutesContent가 그대로 되읽는다.
const TAGS = ["작성자", "회의명", "일시", "성원보고", "출석현황", "심의및의결사항"];
const TAG_LINE_RE = new RegExp(`^\\[(${TAGS.join("|")})\\]`);

export function assembleMinutesContent({
  author,
  meetingTitle,
  meetingDateTimeText,
  quorumReportText,
  attendanceDetailText,
  resolutionText,
}) {
  return [
    `[작성자] ${author || ""}`,
    `[회의명] ${meetingTitle || ""}`,
    `[일시] ${meetingDateTimeText || ""}`,
    `[성원보고] ${quorumReportText || ""}`,
    `[출석현황]\n${attendanceDetailText || ""}`,
    `[심의및의결사항]\n${resolutionText || ""}`,
  ].join("\n");
}

// 태그가 하나도 없으면 null을 반환한다 — 호출부에서 "옛 형식/파싱 불가"로 판단해 원문을 그대로 보여준다.
export function parseMinutesContent(content) {
  if (!content) return null;

  const lines = content.split("\n");
  const sections = {};
  let currentTag = null;
  let buffer = [];

  function flush() {
    if (currentTag) sections[currentTag] = buffer.join("\n").trim();
  }

  for (const line of lines) {
    const m = line.match(TAG_LINE_RE);
    if (m) {
      flush();
      currentTag = m[1];
      buffer = [line.slice(m[0].length).trim()];
    } else if (currentTag) {
      buffer.push(line);
    }
  }
  flush();

  if (Object.keys(sections).length === 0) return null;

  return {
    author: sections["작성자"] || "",
    meetingTitle: sections["회의명"] || "",
    meetingDateTimeText: sections["일시"] || "",
    quorumReportText: sections["성원보고"] || "",
    attendanceDetailText: sections["출석현황"] || "",
    resolutionText: sections["심의및의결사항"] || "",
  };
}
