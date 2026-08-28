import { calculateQuorum } from "./quorum";

// 회의록 4-6 attendance_summary 스냅샷 + 초안 텍스트 생성.
// 요구사항 3-7: 회의록이 아직 없을 때만 계산해서 채운다(이미 저장된 회의록은 건드리지 않음).
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

function namesList(list) {
  return list.length === 0 ? "없음" : list.map((m) => `${m.name}(${m.position})`).join(", ");
}

export function buildDraftText(meeting, summary) {
  const { total, attendCount, majorityThreshold, quorumMet, attendees, delegators, absentees, noResponse } = summary;

  const quorumLine = quorumMet
    ? `재적 ${total}명 중 ${attendCount}명 참석(위임 포함)으로 정족수를 충족함.`
    : `재적 ${total}명 중 ${attendCount}명 참석(위임 포함)으로 정족수를 충족하지 못함 (과반수 ${majorityThreshold}명 필요).`;

  const delegateList =
    delegators.length === 0
      ? "없음"
      : delegators
          .map(
            (d) =>
              `${d.name}(${d.position}) → ${d.delegateName ? `${d.delegateName}(${d.delegatePosition})` : "알 수 없음"}`
          )
          .join(", ");

  return [
    "1. 성원현황",
    quorumLine,
    "",
    `- 참석 (${attendees.length}명): ${namesList(attendees)}`,
    `- 위임 (${delegators.length}명): ${delegateList}`,
    `- 불참 (${absentees.length}명): ${namesList(absentees)}`,
    `- 미응답 (${noResponse.length}명): ${namesList(noResponse)}`,
    "",
    "2. 안건",
    meeting.agenda || "(안건 미입력)",
    "",
    "3. 회의 내용",
    "",
  ].join("\n");
}
