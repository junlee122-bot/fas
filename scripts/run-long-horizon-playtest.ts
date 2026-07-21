import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  aggregateLongHorizonSessions,
  LONG_HORIZON_END_YEAR,
  LONG_HORIZON_START_YEAR,
  LONG_HORIZON_WEEKS,
  runLongHorizonPlaytestMatrix,
  runLongHorizonSession,
  type LongHorizonPlaytestRun,
  type LongHorizonSessionResult,
} from '../src/longHorizonPlaytest';

const formatNumber = (value: number) => value.toLocaleString('ko-KR');
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

function createMarkdown(run: LongHorizonPlaytestRun) {
  const { aggregate, findings, sessions } = run;
  const profileRows = Object.entries(aggregate.byProfile).map(([profile, result]) => (
    `| ${profile} | ${result.sessions} | ${result.promptsPerWeek.toFixed(2)} | ${result.urgentWeekRate.toFixed(1)}% | ${result.decisionsPerYear.toFixed(1)} | ${result.averageFinalInflation.toFixed(1)}% | ${result.averageFlashpointDroughtYears.toFixed(1)}년 | ${result.averageMissedPostwarCandidates.toFixed(1)}명 |`
  )).join('\n');
  const repeatedRows = aggregate.topRepeatedActions.map((action) => (
    `| \`${action.id}\` | ${action.sessions} | ${formatNumber(action.weeks)}주 |`
  )).join('\n');
  const findingSections = findings.map((finding) => `### ${finding.priority} · ${finding.title}

- 근거: ${finding.evidence}
- 재미 저하: ${finding.funImpact}
- 개선 방향: ${finding.recommendation}`).join('\n\n');
  const highestUrgent = [...sessions].sort((left, right) => right.urgentPromptWeeks - left.urgentPromptWeeks).slice(0, 5);
  const mostCoups = [...sessions].sort((left, right) => right.coupAttempts - left.coupAttempts).slice(0, 5);
  const outlierRows = highestUrgent.map((session, index) => {
    const coup = mostCoups[index];
    return `| 긴급경고 | #${session.id} ${session.nationId}/${session.profile} | ${formatNumber(session.urgentPromptWeeks)}주 |\n| 쿠데타 | #${coup.id} ${coup.nationId}/${coup.profile} | ${coup.coupAttempts}회 · 성공 ${coup.coupSuccesses}회 |`;
  }).join('\n');

  return `# IRON DOMINION 1942–2020 장기 엔진 플레이테스트 300회

## 결론

게임은 300개 캠페인 모두 ${LONG_HORIZON_END_YEAR}년까지 계산을 완료했지만, 장기 재미를 지탱하는 시스템은 1940년대 후반부터 빠르게 소진되거나 극단값으로 수렴했습니다. 가장 큰 문제는 전후 참모·인재 시간이 멈추는 것, 초기 연구 6개가 ${aggregate.medianResearchCompleteYear ?? '초기'}년에 끝나는 것, 세계사 위기가 평균 ${aggregate.averageLastFlashpointYear ?? 0}년에 소진되는 것, 그리고 물가·정치력·적 압력이 장기간 고정되는 것입니다.

이 결과는 단순 난수 몬테카를로가 아닙니다. 현재 코드의 경제, 공중보건, 연구, 전투, 국가 운영, 선거, 쿠데타, 참모 계약, 국가 의제, 세계사 분기 함수를 직접 호출해 총 ${formatNumber(aggregate.totalWeeks)}주의 상태 전이를 계산했습니다.

## 테스트 범위

- 캠페인: ${aggregate.sessionCount}회 · 회당 ${formatNumber(aggregate.weeksPerSession)}주
- 시간 범위: ${LONG_HORIZON_START_YEAR}년 → ${LONG_HORIZON_END_YEAR}년
- 총 상태 전이: ${formatNumber(aggregate.totalWeeks)}주
- 국가: ${aggregate.nationCoverage}개
- 실제 선택 가능 보직: ${aggregate.roleCoverage}개
- 직급: ${aggregate.tierCoverage}단계 · 군사/정치/정보 ${aggregate.branchCoverage}개 분야
- 행동 성향: 안내 추종, 빠른 진행, 군사 집중, 국가 건설, 완주형, 기회주의형 ${aggregate.profileCoverage}종
- 완주율: ${formatPercent(aggregate.reached2020Rate)}

## 핵심 지표

| 영역 | 결과 | 해석 |
| --- | ---: | --- |
| 행동 프롬프트 | ${formatNumber(aggregate.actionPrompts)}건 · 주당 ${aggregate.actionPromptsPerWeek.toFixed(2)}건 | 장기적으로 같은 경고가 반복되는지 측정 |
| 긴급 상태 | 전체 주의 ${formatPercent(aggregate.urgentWeekRate)} | 빨간 경고의 희소성과 피로도 |
| 조용한 주 | ${formatPercent(aggregate.quietWeekRate)} | 장기 계획을 세울 여유 |
| 실질 결정 | ${formatNumber(aggregate.decisionInteractions)}회 · ${formatNumber(aggregate.decisionWeeks)}주 | 프롬프트 대비 실제 선택 밀도 1:${aggregate.promptToDecisionRatio.toFixed(2)} |
| 진행 중단 | ${formatNumber(aggregate.interruptionCount)}회 · 연 ${aggregate.interruptionsPerYear.toFixed(1)}회 | 의제·세계위기·쿠데타 모달 부담 |
| 연구 완료 중앙값 | ${aggregate.medianResearchCompleteYear ?? '-'}년 | 이후 연구 공백 중앙값 ${aggregate.medianResearchDroughtYears.toFixed(1)}년 |
| 1940년대 국가사건 체험률 | ${formatPercent(aggregate.averageHistoricalCouncilCoverage)} | 전후 국가 운영 전환으로 놓치는 사건 포함 |
| 세계 위기 | 회당 ${aggregate.averageFlashpointCount.toFixed(1)}건 | 마지막 위기 평균 ${aggregate.averageLastFlashpointYear ?? '-'}년 |
| 세계 위기 조기 발생 | ${formatPercent(aggregate.acceleratedFlashpointRate)} | 최대 조기 발생 중앙값 ${aggregate.medianMaximumFlashpointAccelerationYears}년 |
| 후반 세계사 공백 | 평균 ${aggregate.averageFlashpointDroughtYears.toFixed(1)}년 | 마지막 위기부터 2020년까지 |
| 물가 경고 | 전체 주의 ${formatPercent(aggregate.inflationWarningWeekRate)} | 초인플레이션 경험 세션 ${formatPercent(aggregate.hyperinflationSessionRate)} |
| 정치력 1,000 초과 | ${formatPercent(aggregate.excessivePoliticalPowerSessionRate)} | 자원 상한·지출처 부족 |
| 적 압력 0 경험 | ${formatPercent(aggregate.zeroEnemyPressureSessionRate)} | 외부 도전 소멸 |
| 참모 진행 동결 | 세션당 평균 ${aggregate.averageStaffFrozenYears.toFixed(1)}년 | 국가 운영 단계에서 계약·성장 미진행 |
| 후대 인재 누락 | 세션 ${formatPercent(aggregate.missedPostwarCandidateSessionRate)} · 평균 ${aggregate.averageMissedPostwarCandidates.toFixed(1)}명 | 전후 후보시장 갱신 중단 |
| 쿠데타 경험 | ${formatPercent(aggregate.coupSessionRate)} | 성공 쿠데타 경험 ${formatPercent(aggregate.successfulCoupSessionRate)} |
| 감염병 경험 | ${formatPercent(aggregate.outbreakSessionRate)} | 78년 장기 보건 순환 |
| 고유 세계선 | ${aggregate.uniqueWorldlineCodes}개 | 고유 결말 ${aggregate.uniqueEndings}개 · 최빈 결말 ${formatPercent(aggregate.mostCommonEndingShare)} |

## 플레이 성향별 결과

| 성향 | 세션 | 주당 프롬프트 | 긴급 주 | 연간 결정 | 최종 물가 | 세계사 공백 | 누락 후대인재 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${profileRows}

## 발견된 불편과 재미 저하 요인

${findingSections}

## 가장 오래 반복된 행동

| 행동 | 발생 세션 | 최장 연속주 합계 |
| --- | ---: | ---: |
${repeatedRows}

반복 합계는 각 세션에서 해당 행동이 끊기지 않고 지속된 가장 긴 구간을 합산한 값입니다. 단순 등장 횟수보다 “얼마나 오래 해결되지 않은 숙제처럼 보였는가”를 나타냅니다.

## 극단 세션 표본

| 기준 | 세션 | 결과 |
| --- | --- | ---: |
${outlierRows}

## 권장 개선 순서

1. 국가 운영 주간에도 참모 계약·성장·은퇴·후보시장 세대교체를 실행합니다.
2. 연구를 1940년대–냉전–정보화–현대–가상기술의 연속 세대 트리로 교체합니다.
3. 세계 위기를 분기당 자동 소모하지 않고 조건·지역·이전 결정에 따른 동적 연쇄로 전환합니다.
4. 물가·정치력·지휘점수·적 압력에 시대별 균형점, 유지비와 경기순환을 적용합니다.
5. 1945–1949 국가 사건을 전시 의제뿐 아니라 전후 주간 브리핑에서도 발생시킵니다.
6. 반복 알림을 상태 추적 과제로 합치고 월간 운영·분기 결산·연간 전략 결정을 분리합니다.
7. 결말을 단일 카드가 아니라 정권·사회·경제·기술·국제질서의 조합형 에필로그로 출력합니다.

## 해석상의 제한

- 300회는 사람 300명이 화면을 클릭한 결과가 아니라, 여섯 행동 성향을 순환시킨 결정론적 엔진 캠페인입니다.
- 경제·보건·전투·국가운영·선거·쿠데타·참모·세계사 함수는 실제 게임 코드를 사용했습니다.
- 화면 배치, 마우스 이동거리, 글자 겹침 같은 시각 UX는 이 테스트 범위가 아니며 기존 브라우저 플레이테스트와 함께 해석해야 합니다.
- 전후 주간 보고서의 208주 보관 배열은 계산 결과에 관여하지 않아 러너에서는 최신 보고서만 보존했습니다. 재정·선거·국가 지표 계산은 동일합니다.

## 재현

원시 세션 기록은 \`docs/long-horizon-playtest-300-data.json\`, 집계는 \`docs/long-horizon-playtest-300-summary.json\`에 저장했습니다. 러너는 \`scripts/run-long-horizon-playtest.ts\`, 엔진 연결부는 \`src/longHorizonPlaytest.ts\`입니다.
`;
}

function writeArtifacts(run: LongHorizonPlaytestRun, outputDirectory: string) {
  const output = resolve(outputDirectory);
  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, 'long-horizon-playtest-300-data.json'), `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, 'long-horizon-playtest-300-summary.json'), `${JSON.stringify({
    generatedAt: run.generatedAt,
    methodology: run.methodology,
    aggregate: run.aggregate,
    findings: run.findings,
  }, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, 'long-horizon-playtest-300.md'), createMarkdown(run), 'utf8');
}

const args = process.argv.slice(2);
if (args[0] === '--worker') {
  const start = Number(args[1]);
  const end = Number(args[2]);
  const output = resolve(args[3]);
  const sessions: LongHorizonSessionResult[] = [];
  for (let id = start; id < end; id += 1) {
    sessions.push(runLongHorizonSession(id, LONG_HORIZON_WEEKS));
    if ((id - start + 1) % 5 === 0 || id + 1 === end) process.stdout.write(`worker ${start}-${end}: ${id - start + 1}/${end - start}\n`);
  }
  writeFileSync(output, JSON.stringify(sessions), 'utf8');
} else if (args[0] === '--merge') {
  const outputDirectory = args[1] ?? 'docs';
  const sessions = args.slice(2).flatMap((path) => JSON.parse(readFileSync(resolve(path), 'utf8')) as LongHorizonSessionResult[]).sort((left, right) => left.id - right.id);
  const run = aggregateLongHorizonSessions(sessions, LONG_HORIZON_WEEKS);
  writeArtifacts(run, outputDirectory);
  process.stdout.write(`merged ${sessions.length} sessions into ${resolve(outputDirectory)}\n`);
} else {
  const run = runLongHorizonPlaytestMatrix(300, LONG_HORIZON_WEEKS);
  writeArtifacts(run, args[0] ?? 'docs');
  process.stdout.write(`completed ${run.aggregate.sessionCount} sessions\n`);
}
