import { calculateQuorum } from "./quorum";

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
  const [start, end] = (termName || "").split("-");
  const yearLabel = start ? `20${start}-${end}` : termName;
  return `새송탄로타리클럽 ${yearLabel}년도 제${seq}차 이사회`;
}

export function buildQuorumReportText(summary) {
  const { total, attendCount, majorityThreshold, quorumMet } = summary;
  return quorumMet
    ? `총 성원 ${total}명 중 참석 ${summary.attendees.length}명, 위임 ${summary.delegators.length}명(총 ${attendCount}명 확인)으로 과반수를 충족하여 성원이 됨에 따라 회장이 개의를 선언함.`
    : `총 성원 ${total}명 중 참석 ${summary.attendees.length}명, 위임 ${summary.delegators.length}명(총 ${attendCount}명 확인)으로 과반수(${majorityThreshold}명)에 미달하여 성원이 되지 못함.`;
}

function namesList(list) {
  if (list.length === 0) return "없음";
  return list
    .map((m) =>
      m.delegateName ? `${m.name}(${m.position}) → ${m.delegateName}(${m.delegatePosition})` : `${m.name}(${m.position})`
    )
    .join(", ");
}

export function buildAttendanceDetailText(roster, responses) {
  const summary = buildAttendanceSummary(roster, responses);
  const byCategory = new Map([
    ["회장단", { attend: [], delegate: [], absent: [] }],
    ["이사", { attend: [], delegate: [], absent: [] }],
    ["분과위원장", { attend: [], delegate: [], absent: [] }],
  ]);

  for (const m of summary.attendees) byCategory.get(categoryOf(m.position)).attend.push(m);
  for (const m of summary.delegators) byCategory.get(categoryOf(m.position)).delegate.push(m);
  for (const m of summary.absentees) byCategory.get(categoryOf(m.position)).absent.push(m);

  const blocks = [];
  for (const [category, groups] of byCategory) {
    if (groups.attend.length === 0 && groups.delegate.length === 0 && groups.absent.length === 0) continue;
    blocks.push(
      [
        `[${category}]`,
        `참석: ${namesList(groups.attend)}`,
        `위임: ${namesList(groups.delegate)}`,
        `불참: ${namesList(groups.absent)}`,
      ].join("\n")
    );
  }
  return blocks.join("\n\n");
}

// meeting_minutes.content는 컬럼을 나누지 않고 이 마커들로 구간을 표시한 하나의 텍스트다.
// assembleMinutesContent가 만든 형식을 parseMinutesContent가 그대로 되읽는다 —
// 이 두 함수가 항상 같은 마커를 쓰는 한 자유 입력(심의 내용 등)에 안전하다.
const MARK = {
  author: "작성자: ",
  title: "회의명: ",
  datetime: "일시: ",
  section1: "\n\n1. 성원보고\n",
  section2: "\n\n2. 출석 및 성원 상세 현황\n",
  section3: "\n\n3. 심의 및 의결 사항\n",
};

export function assembleMinutesContent({
  author,
  meetingTitle,
  meetingDateTimeText,
  quorumReportText,
  attendanceDetailText,
  resolutionText,
}) {
  return (
    `${MARK.author}${author || ""}\n` +
    `${MARK.title}${meetingTitle || ""}\n` +
    `${MARK.datetime}${meetingDateTimeText || ""}` +
    `${MARK.section1}${quorumReportText || ""}` +
    `${MARK.section2}${attendanceDetailText || ""}` +
    `${MARK.section3}${resolutionText || ""}`
  );
}

export function parseMinutesContent(content) {
  if (!content) return null;

  const lines = content.split("\n");
  const authorLine = lines.find((l) => l.startsWith(MARK.author));
  const titleLine = lines.find((l) => l.startsWith(MARK.title));

  const i1 = content.indexOf(MARK.section1);
  const i2 = content.indexOf(MARK.section2);
  const i3 = content.indexOf(MARK.section3);

  return {
    author: authorLine ? authorLine.slice(MARK.author.length) : "",
    meetingTitle: titleLine ? titleLine.slice(MARK.title.length) : "",
    quorumReportText: i1 >= 0 && i2 >= 0 ? content.slice(i1 + MARK.section1.length, i2).trim() : "",
    attendanceDetailText: i2 >= 0 && i3 >= 0 ? content.slice(i2 + MARK.section2.length, i3).trim() : "",
    resolutionText: i3 >= 0 ? content.slice(i3 + MARK.section3.length).trim() : "",
  };
}
