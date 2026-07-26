import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nations } from '../src/campaign';
import {
  aggregatePossibilityMatrixSessions,
  POSSIBILITY_MATRIX_SESSIONS_PER_NATION,
  runPossibilityMatrixSession,
  type PossibilityMatrixRun,
  type PossibilityMatrixSession,
  type PossibilityNationAggregate,
} from '../src/possibilityMatrixPlaytest';

const defaultPrefix = 'possibility-matrix-3000-2060';
const formatNumber = (value: number) => value.toLocaleString('ko-KR');
const percent = (value: number) => `${value.toFixed(1)}%`;

function nationRows(run: PossibilityMatrixRun) {
  return Object.values(run.byNation).map((nation) => `| ${nation.nationName} (\`${nation.nationId}\`) | ${formatNumber(nation.sessions)} | ${formatNumber(nation.uniqueCombinations)} | ${formatNumber(nation.uniqueFuturePaths)} | ${nation.averageTransitionYear.toFixed(1)} | ${nation.averageNationalScore.toFixed(1)} (${nation.nationalScoreP10.toFixed(1)}–${nation.nationalScoreP90.toFixed(1)}) | ${nation.averageUnrest.toFixed(1)} | ${percent(nation.viableRate)} | ${nation.averageCrisisAttempts.toFixed(1)} | ${nation.uniqueEndings} |`).join('\n');
}

function findingMarkdown(run: PossibilityMatrixRun) {
  return run.findings.map((finding) => `### ${finding.priority} · ${finding.title}

- 근거: ${finding.evidence}
- 개선 방향: ${finding.recommendation}`).join('\n\n');
}

function impactRows(nation: PossibilityNationAggregate) {
  return nation.dimensionImpacts.map((impact) => `| ${String(impact.dimension)} | ${impact.variants} | ${impact.transitionYearSpread.toFixed(1)} | ${impact.nationalScoreSpread.toFixed(1)} | ${impact.unrestSpread.toFixed(1)} | ${impact.prosperitySpread.toFixed(1)} | ${impact.sustainabilitySpread.toFixed(1)} | ${impact.crisisAttemptSpread.toFixed(1)} | ${impact.conflictSpread.toFixed(1)} | ${impact.outbreakSpread.toFixed(1)} | ${impact.electionWinRateSpread.toFixed(1)} |`).join('\n');
}

function createOverviewMarkdown(run: PossibilityMatrixRun, prefix: string) {
  return `# IRON DOMINION 국가별 3,000개 가능세계 조합 플레이테스트

## 실행 범위

- 국가: ${Object.keys(run.byNation).length}개
- 국가별 경력: ${formatNumber(run.sessionsPerNation)}회
- 전체 경력: ${formatNumber(run.totalSessions)}회
- 시대 범위: 1942–2060
- 역사·미래 사건 선택: ${formatNumber(run.totalHistoricalEventChoices)}회
- 실제 고유 정책 조합: ${formatNumber(run.uniqueCombinations)}개
- 고유 미래 경로: ${formatNumber(run.uniqueFuturePaths)}개
- 미래 경로 충돌률: ${percent(run.futurePathCollisionRate)}
- 결말 분류 충돌률: ${percent(run.endingCollisionRate)}
- 생존 가능한 국가 경력: ${percent(run.viableRate)}
- 국가 평균 결과 격차: ${run.nationOutcomeSpread.toFixed(1)}점

## 국가별 결과

| 국가 | 경력 | 고유 조합 | 고유 미래 | 평균 전환 연도 | 국가 점수 평균 (10–90분위) | 불안 | 생존 | 위기 시도 | 결말 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${nationRows(run)}

## 발견 및 개선 판단

${findingMarkdown(run)}

## 산출물

- 전체 보고서: \`docs/${prefix}.md\`
- 전체 집계: \`docs/${prefix}-summary.json\`
- 국가별 보고서·집계·압축 원자료: \`docs/${prefix}-nations/<nation-id>/\`
- 재실행기: \`scripts/run-possibility-matrix-3000-2060.ts\`
- 조합·분석 엔진: \`src/possibilityMatrixPlaytest.ts\`
`;
}

function createNationMarkdown(nation: PossibilityNationAggregate) {
  return `# ${nation.nationName} 3,000개 가능세계 조합 결과

- 고유 조합: ${formatNumber(nation.uniqueCombinations)} / ${formatNumber(nation.sessions)}
- 고유 미래 경로: ${formatNumber(nation.uniqueFuturePaths)}
- 미래 경로 충돌률: ${percent(nation.futurePathCollisionRate)}
- 고유 결말 분류: ${formatNumber(nation.uniqueEndings)}
- 생존 가능한 경력: ${percent(nation.viableRate)}
- 전환 연도: 평균 ${nation.averageTransitionYear.toFixed(1)} · 범위 ${nation.transitionYearSpread.toFixed(1)}년
- 국가 점수: 평균 ${nation.averageNationalScore.toFixed(1)} · 10–90분위 ${nation.nationalScoreP10.toFixed(1)}–${nation.nationalScoreP90.toFixed(1)}
- 국민 위임 ${nation.averageMandate.toFixed(1)} · 불안 ${nation.averageUnrest.toFixed(1)}
- 번영 ${nation.averageProsperity.toFixed(1)} · 기술 ${nation.averageTechnology.toFixed(1)} · 권리 ${nation.averageRights.toFixed(1)}
- 안보 ${nation.averageSecurity.toFixed(1)} · 지속가능성 ${nation.averageSustainability.toFixed(1)}
- 정치 위기 평균 ${nation.averageCrisisAttempts.toFixed(1)}회 · 체제 단절 경험 ${percent(nation.successfulRuptureRate)}
- 분쟁 평균 ${nation.averageConflicts.toFixed(1)}회 · 감염병 평균 ${nation.averageOutbreaks.toFixed(1)}회
- 선거 평균 ${nation.averageElections.toFixed(1)}회 · 사용자 진영 승률 ${percent(nation.electionWinRate)}

## 선택 축별 장기 결과 민감도

| 선택 축 | 선택지 | 전환 연도 | 국가 점수 | 불안 | 번영 | 지속가능성 | 위기 | 분쟁 | 감염병 | 선거 승률 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${impactRows(nation)}
`;
}

function validateSessions(sessions: PossibilityMatrixSession[], sessionsPerNation: number) {
  const expected = nations.length * sessionsPerNation;
  const keys = new Set(sessions.map((session) => `${session.nationId}:${session.nationScenarioId}`));
  const combinations = new Set(sessions.map((session) => `${session.nationId}:${session.scenario.combinationKey}`));
  const wrongCounts = nations.flatMap((nation) => {
    const count = sessions.filter((session) => session.nationId === nation.id).length;
    return count === sessionsPerNation ? [] : [`${nation.id}:${count}`];
  });
  if (sessions.length !== expected || keys.size !== expected || combinations.size !== expected || wrongCounts.length > 0) {
    throw new Error(`invalid possibility matrix: sessions=${sessions.length}/${expected}, keys=${keys.size}, combinations=${combinations.size}, counts=${wrongCounts.join(',')}`);
  }
}

function writeArtifacts(
  run: PossibilityMatrixRun,
  sessions: PossibilityMatrixSession[],
  outputDirectory: string,
  prefix: string,
) {
  const output = resolve(outputDirectory);
  const nationRoot = resolve(output, `${prefix}-nations`);
  mkdirSync(nationRoot, { recursive: true });
  Object.values(run.byNation).forEach((nation) => {
    const directory = resolve(nationRoot, nation.nationId);
    const nationSessions = sessions.filter((session) => session.nationId === nation.nationId);
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, `${nation.nationId}-${run.sessionsPerNation}-data.json.gz`), gzipSync(JSON.stringify(nationSessions), { level: 9 }));
    writeFileSync(resolve(directory, `${nation.nationId}-${run.sessionsPerNation}-summary.json`), `${JSON.stringify(nation, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(directory, `${nation.nationId}-${run.sessionsPerNation}.md`), createNationMarkdown(nation), 'utf8');
  });
  writeFileSync(resolve(output, `${prefix}-summary.json`), `${JSON.stringify({
    generatedAt: run.generatedAt,
    methodology: run.methodology,
    sessionsPerNation: run.sessionsPerNation,
    totalSessions: run.totalSessions,
    totalHistoricalEventChoices: run.totalHistoricalEventChoices,
    uniqueCombinations: run.uniqueCombinations,
    uniqueFuturePaths: run.uniqueFuturePaths,
    futurePathCollisionRate: run.futurePathCollisionRate,
    endingCollisionRate: run.endingCollisionRate,
    viableRate: run.viableRate,
    nationOutcomeSpread: run.nationOutcomeSpread,
    byNation: run.byNation,
    findings: run.findings,
  }, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(output, `${prefix}.md`), createOverviewMarkdown(run, prefix), 'utf8');
}

const args = process.argv.slice(2);
if (args[0] === '--worker') {
  const start = Number(args[1]);
  const end = Number(args[2]);
  const output = resolve(args[3]);
  const sessionsPerNation = Number(args[4] ?? POSSIBILITY_MATRIX_SESSIONS_PER_NATION);
  const sessions: PossibilityMatrixSession[] = [];
  for (let taskId = start; taskId < end; taskId += 1) {
    const nationIndex = Math.floor(taskId / sessionsPerNation);
    const nationScenarioId = taskId % sessionsPerNation;
    const nation = nations[nationIndex];
    if (!nation) throw new Error(`worker task ${taskId} exceeds ${nations.length} nations × ${sessionsPerNation} sessions`);
    sessions.push(runPossibilityMatrixSession(nation.id, nationScenarioId));
    if ((taskId - start + 1) % 100 === 0 || taskId + 1 === end) {
      process.stdout.write(`possibility worker ${start}-${end}: ${taskId - start + 1}/${end - start}\n`);
    }
  }
  writeFileSync(output, JSON.stringify(sessions), 'utf8');
} else if (args[0] === '--merge') {
  const outputDirectory = args[1] ?? 'docs';
  const prefix = args[2] ?? defaultPrefix;
  const sessionsPerNation = Number(args[3] ?? POSSIBILITY_MATRIX_SESSIONS_PER_NATION);
  const workerPaths = args.slice(4);
  const sessions = workerPaths.flatMap((path) => JSON.parse(readFileSync(resolve(path), 'utf8')) as PossibilityMatrixSession[]);
  validateSessions(sessions, sessionsPerNation);
  const run = aggregatePossibilityMatrixSessions(sessions, sessionsPerNation);
  writeArtifacts(run, sessions, outputDirectory, prefix);
  process.stdout.write(`merged ${formatNumber(sessions.length)} possibility careers into ${resolve(outputDirectory)}\n`);
} else {
  const sessionsPerNation = Number(args[0] ?? POSSIBILITY_MATRIX_SESSIONS_PER_NATION);
  const outputDirectory = args[1] ?? 'docs';
  const prefix = args[2] ?? defaultPrefix;
  const sessions = nations.flatMap((nation) => Array.from(
    { length: sessionsPerNation },
    (_, scenarioId) => runPossibilityMatrixSession(nation.id, scenarioId),
  ));
  validateSessions(sessions, sessionsPerNation);
  writeArtifacts(aggregatePossibilityMatrixSessions(sessions, sessionsPerNation), sessions, outputDirectory, prefix);
}
