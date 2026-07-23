import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  aggregateCenturySessions,
  CENTURY_PLAYTEST_END_YEAR,
  CENTURY_PLAYTEST_SESSION_COUNT,
  CENTURY_PLAYTEST_WEEKS,
  type CenturyPlaytestRun,
} from '../src/centuryPlaytest';
import { LONG_HORIZON_START_YEAR, runLongHorizonSession, type LongHorizonSessionResult } from '../src/longHorizonPlaytest';

const prefix = 'long-horizon-playtest-700-2060';
const formatNumber = (value: number) => value.toLocaleString('ko-KR');
const percent = (value: number) => `${value.toFixed(1)}%`;

function createMarkdown(run: CenturyPlaytestRun) {
  const { aggregate } = run;
  const eraRows = aggregate.eraTimeline.map((era) => {
    const fullEraWeeks = aggregate.sessionCount * (era.endYear - era.startYear + 1) * 52;
    const eraLabel = era.weeks < fullEraWeeks / 2 ? `${era.startYear}년 진입 (회당 ${era.weeks / aggregate.sessionCount}주)` : era.era;
    return `| ${eraLabel} | ${era.promptsPerWeek.toFixed(2)} | ${percent(era.urgentWeekRate)} | ${era.decisionsPerYear.toFixed(1)} | ${era.interruptionsPerYear.toFixed(1)} | ${era.battlesPerYear.toFixed(1)} | ${era.flashpointsPerDecade.toFixed(1)} | ${percent(era.researchActiveWeekRate)} | ${percent(era.nationalScoreCeilingWeekRate)} |`;
  }).join('\n');
  const profileRows = Object.entries(aggregate.byProfile).map(([profile, value]) => `| ${profile} | ${value.sessions} | ${percent(value.urgentWeekRate)} | ${percent(value.quietWeekRate)} | ${value.decisionsPerYear.toFixed(1)} | ${value.averageFinalNationalScore.toFixed(1)} | ${value.averageFinalInflation.toFixed(1)}% | ${value.averageFinalUnrest.toFixed(1)} | ${value.uniqueEndings} |`).join('\n');
  const findingSections = run.findings.map((finding) => `### ${finding.priority} · ${finding.title}\n\n- 관측 근거: ${finding.evidence}\n- 재미 저하: ${finding.funImpact}\n- 개선 방향: ${finding.recommendation}`).join('\n\n');
  const repeatedRows = aggregate.topRepeatedActions.map((action) => `| \`${action.id}\` | ${action.sessions} | ${formatNumber(action.longestRunWeeksTotal)}주 | ${action.averageLongestRunWeeks.toFixed(1)}주 |`).join('\n');
  const outlierRows = aggregate.outliers.slice(0, 12).map((session) => `| #${session.id} | ${session.nationId} | ${session.roleId} | ${session.profile} | ${session.frictionScore.toFixed(1)} | ${session.reasons.join(' · ') || '복합 마찰'} |`).join('\n');

  return `# IRON DOMINION 1942–2060 장기 엔진 플레이테스트 700회

## 결론

실제 게임의 경제·보건·연구·전투·국가운영·선거·쿠데타·참모·세계사 함수를 연결해 ${formatNumber(aggregate.totalWeeks)}주의 상태 전이를 계산했습니다. 700개 캠페인은 모두 2060년까지 완주했지만, 장기 재미는 **2020년 이후 콘텐츠 공백**, **군사·정보 직무의 국가운영 모드 수렴**, **주간 단위 반복**, **후기 국가 지표 포화**에서 크게 약해졌습니다.

가장 중요한 결론은 “엔진이 2060년까지 멈추지 않는다”와 “2060년까지 플레이할 이유가 있다”가 다르다는 점입니다. 후기 시대에도 계산은 계속되지만 새로운 연구·세계사·작전 목표가 충분히 공급되지 않으면 시간 진행 자체가 주 행동이 됩니다.

## 테스트 범위

- 캠페인: ${aggregate.sessionCount}회
- 기간: ${LONG_HORIZON_START_YEAR}년 → ${CENTURY_PLAYTEST_END_YEAR}년 · 회당 ${formatNumber(aggregate.weeksPerSession)}주
- 총 상태 전이: ${formatNumber(aggregate.totalWeeks)}주
- 국가: ${aggregate.nationCoverage}개
- 실제 보직: ${aggregate.roleCoverage}개
- 직급: ${aggregate.tierCoverage}단계
- 역할 분야: 군사·정치·정보 ${aggregate.branchCoverage}개
- 행동 성향: ${aggregate.profileCoverage}종
- 2060년 완주율: ${percent(aggregate.reached2060Rate)}

## 핵심 경험 지표

| 영역 | 결과 | 사용자 경험 해석 |
| --- | ---: | --- |
| 전쟁 단계 | 평균 ${aggregate.averageWarYears.toFixed(1)}년 · 전체의 ${percent(aggregate.warPhaseShare)} | 118년 중 극히 짧아 군사 직무 정체성이 사라짐 |
| 국가운영 단계 | 평균 ${aggregate.averageNationYears.toFixed(1)}년 | 대부분의 장기 플레이가 같은 평시 루프로 수렴 |
| 결정 주차 | 전체의 ${percent(aggregate.decisionWeeksRate)} | 나머지 주차는 직접 선택 없이 상태 진행 |
| 실질 결정 | 연 ${aggregate.decisionsPerYear.toFixed(1)}회 | 시대별 목표가 없으면 다음 주 반복으로 체감 |
| 행동 프롬프트 | 주당 ${aggregate.promptsPerWeek.toFixed(2)}건 · 결정 대비 1:${aggregate.promptToDecisionRatio.toFixed(2)} | 안내가 선택보다 많아질 위험 |
| 긴급 상태 | 전체 주차의 ${percent(aggregate.urgentWeekRate)} | 장기 경보 피로 측정 |
| 진행 중단 | 연 ${aggregate.interruptionsPerYear.toFixed(1)}회 | 모달·위기·결재 리듬 |
| 연구 | ${aggregate.medianResearchCompleteYear ?? '-'}년 완료 · 공백 중앙값 ${aggregate.medianResearchDroughtYears.toFixed(1)}년 | 미래 기술 목표 소진 |
| 마지막 세계 위기 | 평균 ${aggregate.averageLastFlashpointYear ?? '-'}년 · 이후 ${aggregate.averageFlashpointDroughtYears.toFixed(1)}년 공백 | 후기 국제질서가 정지 |
| 국가점수 상한 | ${percent(aggregate.nationalScoreCeilingSessionRate)} 세션 · 평균 ${aggregate.averageNationalScoreCeilingYears.toFixed(1)}년 | 성공 이후 성장·위험이 사라짐 |
| 선거 | 세션당 ${aggregate.averageElections.toFixed(1)}회 · 선거당 행동 ${aggregate.averageElectionActionsPerElection.toFixed(1)}회 | 118년간 같은 선거 행동 반복 가능성 |
| 쿠데타 | ${percent(aggregate.coupSessionRate)} 세션 · 평균 ${aggregate.averageCoupAttempts.toFixed(1)}회 | 정치 위기 빈도와 회복성 |
| 감염병 | 세션당 ${aggregate.averageOutbreaks.toFixed(1)}회 · 평균 간격 ${aggregate.averageYearsBetweenOutbreaks?.toFixed(1) ?? '-'}년 | 장기 보건 사건의 희소성 |
| 결말 | 고유 ${aggregate.uniqueEndings}개 · 충돌률 ${percent(aggregate.endingCollisionRate)} | 서로 다른 700개 세계의 결과 중복 |

## 시대별 재미 밀도

| 시대 | 주당 프롬프트 | 긴급 주 | 연간 결정 | 연간 중단 | 연간 전투 | 10년당 세계위기 | 연구 활성 | 국가점수 상한 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${eraRows}

시대별 표는 전체 평균이 감추는 콘텐츠 절벽을 찾기 위한 것입니다. 전투·연구·세계사 사건이 동시에 낮아지는 구간은 새로운 목표 없이 시간만 진행될 가능성이 높습니다. 2060년 행은 완전한 연도 통계가 아니라 각 캠페인이 목표 연도에 진입했는지 확인하는 1주 경계 표본이므로 시대 간 직접 비교에서는 제외합니다.

## 행동 성향별 결과

| 성향 | 세션 | 긴급 주 | 조용한 주 | 연간 결정 | 최종 국가점수 | 최종 물가 | 최종 불안 | 고유 결말 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${profileRows}

## 발견된 불편과 재미 저하 요인

${findingSections}

## 가장 오래 반복된 행동

| 행동 | 발생 세션 | 최장 연속주 합계 | 세션당 평균 최장 구간 |
| --- | ---: | ---: | ---: |
${repeatedRows || '| 없음 | 0 | 0주 | 0주 |'}

같은 행동이 매주 표시된 총횟수가 아니라, 각 세션에서 끊기지 않고 이어진 가장 긴 구간을 합산했습니다. 수치가 높을수록 해결 가능한 과제가 아니라 상시 잡음으로 느껴질 가능성이 큽니다.

## 고마찰 세션 표본

| 세션 | 국가 | 보직 | 성향 | 마찰 점수 | 주요 원인 |
| --- | --- | --- | --- | ---: | --- |
${outlierRows}

## 개선 우선순위

1. **2021–2060 콘텐츠 계층 추가**: 후기 연구·세계 위기·인물 세대·국제질서를 먼저 공급합니다.
2. **평시 군사·정보 작전 유지**: 냉전, 지역전, 군비경쟁, 비밀전, 평화유지 임무를 국가운영 단계에 연결합니다.
3. **가변 시간 단위**: 평시는 월 단위, 전쟁·선거·위기는 주 단위로 전환해 6,136회의 반복 진행을 줄입니다.
4. **장기 목표 계약**: 1·5·10년 목표, 중간 평가, 실패 후 회복 경로를 제공합니다.
5. **경보를 추적 과제로 통합**: 발생→조치→검증→해결 이후 확인 시점까지 재노출하지 않습니다.
6. **후기 경쟁력 모델**: 상한형 국가점수 대신 상대 패권, 제도 노후화, 인구·환경·유지비 압력을 사용합니다.
7. **시대별 선거·정치 문법**: 라디오·TV·인터넷·플랫폼 시대에 맞춰 캠페인 방식과 정당 구조를 교체합니다.
8. **결말 인과 확장**: 국가·직무·지역질서·주요 인물·후기 20년 선택을 결말 ID와 문장에 포함합니다.

## 해석상의 제한

- 700회는 사람 700명이 화면을 클릭한 결과가 아니라, 여섯 행동 성향을 순환시킨 결정론적 엔진 플레이입니다.
- 실제 게임의 상태 전이 함수를 사용했지만 화면 배치, 클릭 거리, 글자 겹침은 별도 브라우저 UX 테스트 대상입니다.
- 자동 플레이어는 새로운 기능을 스스로 발견하지 못합니다. 따라서 낮은 사용률은 콘텐츠 부재와 자동 플레이 정책 미지원 가능성을 함께 검토해야 합니다.
- 시대별 지표는 해당 시대의 모든 세션·주차를 합산한 값입니다.

## 결과 파일과 재현

- 상세 보고서: \`docs/${prefix}.md\`
- 집계 데이터: \`docs/${prefix}-summary.json\`
- 700회 전체 원자료: \`docs/${prefix}-data.json\`
- 실행기: \`scripts/run-century-playtest-2060.ts\`
- 계측·분석기: \`src/centuryPlaytest.ts\`
`;
}

function writeArtifacts(run: CenturyPlaytestRun, outputDirectory: string) {
  const output = resolve(outputDirectory);
  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, `${prefix}-data.json`), `${JSON.stringify(run.sessions, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, `${prefix}-summary.json`), `${JSON.stringify({ generatedAt: run.generatedAt, methodology: run.methodology, aggregate: run.aggregate, findings: run.findings }, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, `${prefix}.md`), createMarkdown(run), 'utf8');
}

function validateSessions(sessions: LongHorizonSessionResult[], expectedCount: number) {
  const ids = new Set(sessions.map((session) => session.id));
  const invalid = sessions.filter((session) =>
    session.endYear !== CENTURY_PLAYTEST_END_YEAR
    || session.weeksPlayed !== CENTURY_PLAYTEST_WEEKS
    || !Array.isArray(session.eraMetrics)
    || session.eraMetrics.length === 0);
  const missingIds = Array.from({ length: expectedCount }, (_, id) => id).filter((id) => !ids.has(id));
  if (sessions.length !== expectedCount || ids.size !== expectedCount || invalid.length > 0 || missingIds.length > 0) {
    throw new Error(`invalid century merge: sessions=${sessions.length}/${expectedCount}, uniqueIds=${ids.size}, invalid=${invalid.length}, missingIds=${missingIds.slice(0, 10).join(',') || 'none'}`);
  }
}

const args = process.argv.slice(2);
if (args[0] === '--worker') {
  const start = Number(args[1]);
  const end = Number(args[2]);
  const output = resolve(args[3]);
  const sessions: LongHorizonSessionResult[] = [];
  for (let id = start; id < end; id += 1) {
    sessions.push(runLongHorizonSession(id, CENTURY_PLAYTEST_WEEKS));
    if ((id - start + 1) % 10 === 0 || id + 1 === end) process.stdout.write(`worker ${start}-${end}: ${id - start + 1}/${end - start}\n`);
  }
  writeFileSync(output, JSON.stringify(sessions), 'utf8');
} else if (args[0] === '--merge') {
  const outputDirectory = args[1] ?? 'docs';
  const sessions = args.slice(2).flatMap((path) => JSON.parse(readFileSync(resolve(path), 'utf8')) as LongHorizonSessionResult[]).sort((left, right) => left.id - right.id);
  validateSessions(sessions, CENTURY_PLAYTEST_SESSION_COUNT);
  const run = aggregateCenturySessions(sessions, CENTURY_PLAYTEST_WEEKS);
  writeArtifacts(run, outputDirectory);
  process.stdout.write(`merged ${sessions.length} sessions into ${resolve(outputDirectory)}\n`);
} else {
  const sessionCount = Number(args[0] ?? CENTURY_PLAYTEST_SESSION_COUNT);
  const outputDirectory = args[1] ?? 'docs';
  const sessions = Array.from({ length: sessionCount }, (_, id) => runLongHorizonSession(id, CENTURY_PLAYTEST_WEEKS));
  writeArtifacts(aggregateCenturySessions(sessions, CENTURY_PLAYTEST_WEEKS), outputDirectory);
  process.stdout.write(`completed ${sessionCount} sessions\n`);
}
