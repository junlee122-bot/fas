import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { careerRoles, nations } from '../src/campaign';
import { CENTURY_PLAYTEST_WEEKS } from '../src/centuryPlaytest';
import {
  aggregateMultiNationCenturySessions,
  MULTI_NATION_CENTURY_END_YEAR,
  MULTI_NATION_SESSIONS_PER_NATION,
  MULTI_NATION_TOTAL_SESSIONS,
  runNationCenturySession,
  type MultiNationCenturyRun,
  type NationCenturyResult,
  type NationCenturySessionResult,
} from '../src/multiNationCenturyPlaytest';

const defaultPrefix = 'multi-nation-century-playtest-500-2060';
const formatNumber = (value: number) => value.toLocaleString('ko-KR');
const percent = (value: number) => `${value.toFixed(1)}%`;
const slug = (value: string) => value.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').toLowerCase();

function createOverviewMarkdown(run: MultiNationCenturyRun, prefix: string) {
  const nationRows = Object.entries(run.aggregate.byNation).map(([id, nation]) => `| ${nation.name} (\`${id}\`) | ${nation.sessions} | ${nation.roleCoverage}/${nation.expectedRoleCount} | ${nation.averageTransitionYear.toFixed(1)} | ${nation.decisionsPerYear.toFixed(1)} | ${nation.averageFinalNationalScore.toFixed(1)} | ${nation.averageFinalMandate.toFixed(1)} | ${percent(nation.coupSessionRate)} | ${nation.uniqueEndings} |`).join('\n');
  const findings = run.findings.map((finding) => `### ${finding.priority} · ${finding.title}\n\n- 근거: ${finding.evidence}\n- 개선 방향: ${finding.recommendation}`).join('\n\n');
  return `# IRON DOMINION 전 국가 1942–2060 국가별 500회 플레이테스트

## 범위

- 플레이 진영: ${run.aggregate.nationCount}개
- 국가별 경력: ${run.aggregate.sessionsPerNation}회
- 총 경력: ${formatNumber(run.aggregate.totalSessions)}회
- 총 상태 전이: ${formatNumber(run.aggregate.totalWeeks)}주
- 2060년 완주율: ${percent(run.aggregate.reached2060Rate)}
- 실제 보직: ${run.aggregate.roleCoverage}/${run.aggregate.expectedRoleCoverage}개
- 직급·계열·행동 성향: ${run.aggregate.tierCoverage}단계 · ${run.aggregate.branchCoverage}계열 · ${run.aggregate.profileCoverage}종

## 국가별 결과

| 국가 | 경력 | 보직 | 평균 전환연도 | 연간 결정 | 최종 국가점수 | 국민 위임 | 쿠데타 경험 | 고유 결말 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${nationRows}

## 국가 간 격차

- 최종 국가점수 격차: ${run.aggregate.nationalScoreSpread}점
- 전쟁→국가운영 전환 연도 격차: ${run.aggregate.transitionYearSpread}년
- 국민 위임 격차: ${run.aggregate.mandateSpread}점
- 최종 불안 격차: ${run.aggregate.unrestSpread}점
- 쿠데타 경험률 격차: ${run.aggregate.coupSessionRateSpread}%p
- 연간 결정 밀도 격차: ${run.aggregate.decisionsPerYearSpread}회
- 국가별 고유 결말 합계: ${run.aggregate.uniqueEndingsTotal}개

## 발견된 개선점

${findings}

## 재현

- 전체 보고서: \`docs/${prefix}.md\`
- 전체 집계: \`docs/${prefix}-summary.json\`
- 국가별 원자료·집계·보고서: \`docs/nation-century-500-2060/<nation-id>/\`
- 실행기: \`scripts/run-multi-nation-century-playtest-2060.ts\`
- 계측기: \`src/multiNationCenturyPlaytest.ts\`
`;
}

function createNationMarkdown(result: NationCenturyResult) {
  const aggregate = result.aggregate;
  const profileRows = Object.entries(aggregate.byProfile).map(([profile, value]) => `| ${profile} | ${value.sessions} | ${percent(value.urgentWeekRate)} | ${value.decisionsPerYear.toFixed(1)} | ${value.averageFinalNationalScore.toFixed(1)} | ${value.averageFinalUnrest.toFixed(1)} | ${value.uniqueEndings} |`).join('\n');
  const findings = result.findings.map((finding) => `### ${finding.priority} · ${finding.title}\n\n- 근거: ${finding.evidence}\n- 재미 저하: ${finding.funImpact}\n- 개선 방향: ${finding.recommendation}`).join('\n\n');
  return `# ${result.nationName} 1942–2060 엔진 플레이테스트 ${result.sessionCount}회

- 2060년 완주율: ${percent(aggregate.reached2060Rate)}
- 보직: ${aggregate.roleCoverage}/${result.expectedRoleCount}개
- 직급·계열·행동 성향: ${aggregate.tierCoverage}단계 · ${aggregate.branchCoverage}계열 · ${aggregate.profileCoverage}종
- 평균 전쟁/국가 운영: ${aggregate.averageWarYears.toFixed(1)}년 / ${aggregate.averageNationYears.toFixed(1)}년
- 연간 결정/중단: ${aggregate.decisionsPerYear.toFixed(1)}회 / ${aggregate.interruptionsPerYear.toFixed(1)}회
- 쿠데타 경험/성공 세션: ${percent(aggregate.coupSessionRate)} / ${percent(aggregate.successfulCoupSessionRate)}
- 감염병 경험: ${percent(aggregate.outbreakSessionRate)}
- 고유 세계선/결말: ${aggregate.uniqueWorldlineCodes}개 / ${aggregate.uniqueEndings}개
- 결말 충돌률: ${percent(aggregate.endingCollisionRate)}

| 성향 | 세션 | 긴급 주 | 연간 결정 | 최종 국가점수 | 최종 불안 | 고유 결말 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${profileRows}

## 발견된 개선점

${findings}
`;
}

function writeArtifacts(run: MultiNationCenturyRun, sessions: NationCenturySessionResult[], outputDirectory: string, prefix: string) {
  const output = resolve(outputDirectory);
  const nationRoot = resolve(output, 'nation-century-500-2060');
  mkdirSync(nationRoot, { recursive: true });
  run.nations.forEach((result) => {
    const nationDirectory = resolve(nationRoot, slug(result.nationId));
    const nationSessions = sessions.filter((session) => session.nationId === result.nationId);
    mkdirSync(nationDirectory, { recursive: true });
    writeFileSync(resolve(nationDirectory, `${result.nationId}-500-data.json`), `${JSON.stringify(nationSessions, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(nationDirectory, `${result.nationId}-500-summary.json`), `${JSON.stringify({ generatedAt: run.generatedAt, methodology: run.methodology, nationId: result.nationId, nationName: result.nationName, aggregate: result.aggregate, findings: result.findings }, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(nationDirectory, `${result.nationId}-500.md`), createNationMarkdown(result), 'utf8');
  });
  writeFileSync(resolve(output, `${prefix}-summary.json`), `${JSON.stringify({ generatedAt: run.generatedAt, methodology: run.methodology, aggregate: run.aggregate, findings: run.findings }, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, `${prefix}.md`), createOverviewMarkdown(run, prefix), 'utf8');
}

function validateSessions(sessions: NationCenturySessionResult[]) {
  const keys = new Set(sessions.map((session) => `${session.nationId}:${session.nationScenarioId}`));
  const invalid = sessions.filter((session) => session.endYear !== MULTI_NATION_CENTURY_END_YEAR || session.weeksPlayed !== CENTURY_PLAYTEST_WEEKS);
  const perNation = Object.fromEntries(nations.map((nation) => [nation.id, sessions.filter((session) => session.nationId === nation.id).length]));
  const wrongCounts = Object.entries(perNation).filter(([, count]) => count !== MULTI_NATION_SESSIONS_PER_NATION);
  if (sessions.length !== MULTI_NATION_TOTAL_SESSIONS || keys.size !== MULTI_NATION_TOTAL_SESSIONS || invalid.length > 0 || wrongCounts.length > 0) {
    throw new Error(`invalid multi-nation merge: sessions=${sessions.length}/${MULTI_NATION_TOTAL_SESSIONS}, unique=${keys.size}, invalid=${invalid.length}, counts=${JSON.stringify(wrongCounts)}`);
  }
}

const args = process.argv.slice(2);
if (args[0] === '--worker') {
  const start = Number(args[1]);
  const end = Number(args[2]);
  const output = resolve(args[3]);
  const sessions: NationCenturySessionResult[] = [];
  for (let taskId = start; taskId < end; taskId += 1) {
    const nationIndex = Math.floor(taskId / MULTI_NATION_SESSIONS_PER_NATION);
    const nationScenarioId = taskId % MULTI_NATION_SESSIONS_PER_NATION;
    sessions.push(runNationCenturySession(nations[nationIndex].id, nationScenarioId, CENTURY_PLAYTEST_WEEKS));
    if ((taskId - start + 1) % 25 === 0 || taskId + 1 === end) {
      process.stdout.write(`multi-nation worker ${start}-${end}: ${taskId - start + 1}/${end - start}\n`);
    }
  }
  writeFileSync(output, JSON.stringify(sessions), 'utf8');
} else if (args[0] === '--merge') {
  const outputDirectory = args[1] ?? 'docs';
  const prefix = args[2] ?? defaultPrefix;
  const sessions = args.slice(3).flatMap((path) => JSON.parse(readFileSync(resolve(path), 'utf8')) as NationCenturySessionResult[]);
  validateSessions(sessions);
  const run = aggregateMultiNationCenturySessions(sessions, MULTI_NATION_SESSIONS_PER_NATION, CENTURY_PLAYTEST_WEEKS);
  writeArtifacts(run, sessions, outputDirectory, prefix);
  process.stdout.write(`merged ${sessions.length} sessions across ${nations.length} nations into ${resolve(outputDirectory)}\n`);
} else {
  const sessionsPerNation = Number(args[0] ?? MULTI_NATION_SESSIONS_PER_NATION);
  const outputDirectory = args[1] ?? 'docs';
  const prefix = args[2] ?? defaultPrefix;
  const sessions = nations.flatMap((nation) => Array.from({ length: sessionsPerNation }, (_, scenarioId) => runNationCenturySession(nation.id, scenarioId, CENTURY_PLAYTEST_WEEKS)));
  const run = aggregateMultiNationCenturySessions(sessions, sessionsPerNation, CENTURY_PLAYTEST_WEEKS);
  writeArtifacts(run, sessions, outputDirectory, prefix);
}

if (careerRoles.length === 0) throw new Error('career role catalog is empty');
