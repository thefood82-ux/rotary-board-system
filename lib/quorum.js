// 요구사항 3-5 / docs/requirements.md 4-7: 위임 = 출석으로 간주, 정족수 = 재적 과반수.
// 과반수 공식은 짝수/홀수 모두에 대해 floor(총원/2)+1 로 통일한다 (22명 기준 12명과 일치).
export function calculateQuorum(totalMembers, attendCount) {
  const majorityThreshold = Math.floor(totalMembers / 2) + 1;
  return {
    majorityThreshold,
    quorumMet: attendCount >= majorityThreshold,
  };
}
