import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  aggregateKoreaCenturySessions,
  KOREA_CENTURY_PLAYTEST_END_YEAR,
  KOREA_CENTURY_PLAYTEST_SESSION_COUNT,
  runKoreaCenturySession,
  type KoreaCenturyPlaytestRun,
  type KoreaCenturySessionResult,
} from '../src/koreaCenturyPlaytest';
import { CENTURY_PLAYTEST_WEEKS } from '../src/centuryPlaytest';
import { LONG_HORIZON_START_YEAR } from '../src/longHorizonPlaytest';

const defaultPrefix = 'korea-century-playtest-500-2060';
const formatNumber = (value: number) => value.toLocaleString('ko-KR');
const percent = (value: number) => `${value.toFixed(1)}%`;

function createMarkdown(run: KoreaCenturyPlaytestRun, prefix: string) {
  const { aggregate } = run;
  const trackRows = (Object.entries(aggregate.averageTrackScores) as Array<[string, number]>)
    .map(([track, score]) => `| ${track} | ${score.toFixed(1)} | ${aggregate.blockedTrackCounts[track as keyof typeof aggregate.blockedTrackCounts]}회 |`)
    .join('\n');
  const profileRows = Object.entries(aggregate.byProfile)
    .map(([profile, value]) => `| ${profile} | ${value.sessions} | ${percent(value.eligibleTransitionRate)} | ${value.averageLiberationYear.toFixed(1)} | ${value.averagePartitionRisk.toFixed(1)} | ${value.averageFinalNationalScore.toFixed(1)} | ${value.uniqueEndings} |`)
    .join('\n');
  const branchRows = Object.entries(aggregate.byBranch)
    .map(([branch, value]) => `| ${branch} | ${value.sessions} | ${percent(value.eligibleTransitionRate)} | ${value.averageLiberationScore.toFixed(1)} | ${value.averagePartitionRisk.toFixed(1)} | ${value.averageFinalMandate.toFixed(1)} |`)
    .join('\n');
  const outcomeRows = Object.entries(aggregate.liberationOutcomes)
    .map(([outcome, count]) => `| ${outcome} | ${count}회 | ${percent(count / Math.max(1, aggregate.sessionCount) * 100)} |`)
    .join('\n');
  const findingSections = run.findings
    .map((finding) => `### ${finding.priority} · ${finding.title}\n\n- 관측 근거: ${finding.evidence}\n- 재미 저하: ${finding.funImpact}\n- 개선 방향: ${finding.recommendation}`)
    .join('\n\n');
  const worstRows = aggregate.worstSessions.slice(0, 12)
    .map((session) => `| #${session.koreaScenarioId} | ${session.roleId} | ${session.profile} | ${session.score.toFixed(1)} | ${session.reasons.join(' · ') || '복합 마찰'} |`)
    .join('\n');

  return `# IRON DOMINION 한국·조선 1942–2060 엔진 플레이테스트 ${aggregate.sessionCount}회

## 결론

한국 독립운동으로 시작해 해방·건국·정부 운영을 거쳐 2060년까지 이어지는 ${aggregate.sessionCount}개 별도 경력을 계산했습니다. 단순 시간 진행이 아니라 실제 게임의 전투·외교·정보망·경제·보건·연구·선거·쿠데타·세계사 함수를 연결해 ${formatNumber(aggregate.totalWeeks)}주의 상태 전이를 검증했습니다.

핵심 검증 기준은 국제 승인, 국내 연락망, 광복군 준비, 국내정진 계획이라는 네 축이 실제 해방 시점과 정부 형태·분할 위험에 영향을 주는지입니다.

## 테스트 범위

- 기간: ${LONG_HORIZON_START_YEAR}년 → ${KOREA_CENTURY_PLAYTEST_END_YEAR}년 · 회당 ${formatNumber(aggregate.weeksPerSession)}주
- 총 상태 전이: ${formatNumber(aggregate.totalWeeks)}주
- 한국 실존 보직: ${aggregate.roleCoverage}개 · 직급 ${aggregate.tierCoverage}단계
- 직무 계열: 정치·군사·정보 ${aggregate.branchCoverage}개
- 행동 성향: ${aggregate.profileCoverage}종
- 2060년 완주율: ${percent(aggregate.reached2060Rate)}

## 해방·건국 결과

| 지표 | 결과 |
| --- | ---: |
| 평균 전환 시점 | ${aggregate.averageLiberationYear.toFixed(1)}년 (${aggregate.earliestLiberationYear}–${aggregate.latestLiberationYear}) |
| 네 축 충족 전환 | ${percent(aggregate.eligibleTransitionRate)} |
| 준비 미완료 안전기한 전환 | ${percent(aggregate.prematureTransitionRate)} |
| 고정 타이머 전환 | ${percent(aggregate.fixedTimerTransitionRate)} |
| 2년 안전기한 전환 | ${percent(aggregate.forcedDeadlineRate)} |
| 분할 위험 55 이상 | ${percent(aggregate.highPartitionRiskRate)} |
| 평균 분할 위험 | ${aggregate.averagePartitionRisk.toFixed(1)} |
| 평균 전쟁 단계 | ${aggregate.averageWarYears.toFixed(1)}년 |
| 평균 국가 운영 단계 | ${aggregate.averageNationYears.toFixed(1)}년 |

| 준비 축 | 평균 | 기준 미달 |
| --- | ---: | ---: |
${trackRows}

| 해방·건국 경로 | 횟수 | 비율 |
| --- | ---: | ---: |
${outcomeRows}

## 행동 성향별

| 성향 | 세션 | 준비 완료 전환 | 평균 해방연도 | 분할 위험 | 최종 국가점수 | 고유 결말 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${profileRows}

## 직무 계열별

| 계열 | 세션 | 준비 완료 전환 | 해방 준비도 | 분할 위험 | 최종 국민 위임 |
| --- | ---: | ---: | ---: | ---: | ---: |
${branchRows}

## 장기 국가 운영

- 최종 국가점수: ${aggregate.averageFinalNationalScore.toFixed(1)}
- 최종 국민 위임: ${aggregate.averageFinalMandate.toFixed(1)}
- 최종 불안: ${aggregate.averageFinalUnrest.toFixed(1)}
- 쿠데타 경험 세션: ${percent(aggregate.coupSessionRate)} · 성공한 쿠데타 세션 ${percent(aggregate.successfulCoupSessionRate)}
- 감염병 경험 세션: ${percent(aggregate.outbreakSessionRate)}
- 고유 세계선 코드: ${aggregate.uniqueWorldlineCodes}개
- 고유 결말: ${aggregate.uniqueEndings}개 · 결말 충돌률 ${percent(aggregate.endingCollisionRate)}

## 발견된 불편과 재미 저하 요인

${findingSections}

## 고마찰 경력 표본

| 경력 | 보직 | 성향 | 마찰 점수 | 원인 |
| --- | --- | --- | ---: | --- |
${worstRows}

## 해석상의 제한

- ${aggregate.sessionCount}회는 사람 500명이 화면을 클릭한 결과가 아니라 여섯 행동 성향을 순환시킨 결정론적 엔진 플레이입니다.
- 엔진 상태 전이와 선택 결과를 검증하며, 글자 겹침·클릭 거리·모바일 레이아웃은 별도 브라우저 검증 대상입니다.
- 자동 플레이어가 기능을 사용하지 못한 경우에는 콘텐츠 부재와 자동 의사결정 정책 미지원 가능성을 함께 해석해야 합니다.

## 결과 파일과 재현

- 상세 보고서: \`docs/${prefix}.md\`
- 집계 데이터: \`docs/${prefix}-summary.json\`
- ${aggregate.sessionCount}회 전체 원자료: \`docs/${prefix}-data.json\`
- 실행기: \`scripts/run-korea-century-playtest-2060.ts\`
- 한국 전용 계측기: \`src/koreaCenturyPlaytest.ts\`
`;
}

function writeArtifacts(run: KoreaCenturyPlaytestRun, outputDirectory: string, prefix: string) {
  const output = resolve(outputDirectory);
  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, `${prefix}-data.json`), `${JSON.stringify(run.sessions, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, `${prefix}-summary.json`), `${JSON.stringify({ generatedAt: run.generatedAt, methodology: run.methodology, aggregate: run.aggregate, findings: run.findings }, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, `${prefix}.md`), createMarkdown(run, prefix), 'utf8');
}

function validateSessions(sessions: KoreaCenturySessionResult[], expectedCount: number) {
  const ids = new Set(sessions.map((session) => session.koreaScenarioId));
  const invalid = sessions.filter((session) => (
    session.nationId !== 'korea'
    || session.endYear !== KOREA_CENTURY_PLAYTEST_END_YEAR
    || session.weeksPlayed !== CENTURY_PLAYTEST_WEEKS
    || session.koreaLiberationAtTransition === null
  ));
  const missingIds = Array.from({ length: expectedCount }, (_, id) => id).filter((id) => !ids.has(id));
  if (sessions.length !== expectedCount || ids.size !== expectedCount || invalid.length > 0 || missingIds.length > 0) {
    throw new Error(`invalid Korea merge: sessions=${sessions.length}/${expectedCount}, uniqueIds=${ids.size}, invalid=${invalid.length}, missing=${missingIds.slice(0, 10).join(',') || 'none'}`);
  }
}

const args = process.argv.slice(2);
if (args[0] === '--worker') {
  const start = Number(args[1]);
  const end = Number(args[2]);
  const output = resolve(args[3]);
  const sessions: KoreaCenturySessionResult[] = [];
  for (let scenarioId = start; scenarioId < end; scenarioId += 1) {
    sessions.push(runKoreaCenturySession(scenarioId, CENTURY_PLAYTEST_WEEKS));
    if ((scenarioId - start + 1) % 10 === 0 || scenarioId + 1 === end) {
      process.stdout.write(`Korea worker ${start}-${end}: ${scenarioId - start + 1}/${end - start}\n`);
    }
  }
  writeFileSync(output, JSON.stringify(sessions), 'utf8');
} else if (args[0] === '--merge' || args[0] === '--merge-sample') {
  const outputDirectory = args[1] ?? 'docs';
  const prefix = args[2] ?? defaultPrefix;
  const sessions = args.slice(3)
    .flatMap((path) => JSON.parse(readFileSync(resolve(path), 'utf8')) as KoreaCenturySessionResult[])
    .sort((left, right) => left.koreaScenarioId - right.koreaScenarioId);
  if (args[0] === '--merge') validateSessions(sessions, KOREA_CENTURY_PLAYTEST_SESSION_COUNT);
  writeArtifacts(aggregateKoreaCenturySessions(sessions, CENTURY_PLAYTEST_WEEKS), outputDirectory, prefix);
  process.stdout.write(`merged ${sessions.length} Korea sessions into ${resolve(outputDirectory)}\n`);
} else if (args[0] === '--reanalyze') {
  const dataPath = resolve(args[1]);
  const outputDirectory = args[2] ?? 'docs';
  const prefix = args[3] ?? defaultPrefix;
  const sessions = JSON.parse(readFileSync(dataPath, 'utf8')) as KoreaCenturySessionResult[];
  writeArtifacts(aggregateKoreaCenturySessions(sessions, CENTURY_PLAYTEST_WEEKS), outputDirectory, prefix);
} else {
  const sessionCount = Number(args[0] ?? KOREA_CENTURY_PLAYTEST_SESSION_COUNT);
  const outputDirectory = args[1] ?? 'docs';
  const prefix = args[2] ?? defaultPrefix;
  const sessions = Array.from({ length: sessionCount }, (_, id) => runKoreaCenturySession(id, CENTURY_PLAYTEST_WEEKS));
  writeArtifacts(aggregateKoreaCenturySessions(sessions, CENTURY_PLAYTEST_WEEKS), outputDirectory, prefix);
  process.stdout.write(`completed ${sessionCount} Korea sessions\n`);
}
