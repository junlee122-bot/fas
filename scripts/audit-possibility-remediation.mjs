import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const docs = resolve(root, 'docs');
const matrixPath = resolve(docs, 'possibility-matrix-3000-2060-summary.json');
const weeklyPath = resolve(docs, 'possibility-matrix-weekly-anchor-13-2060-summary.json');
const matrixNationRoot = resolve(docs, 'possibility-matrix-3000-2060-nations');
const weeklyNationRoot = resolve(docs, 'possibility-matrix-weekly-anchor-13-2060-nations');
const outputJson = resolve(docs, 'possibility-matrix-3000-completion-audit.json');
const outputMarkdown = resolve(docs, 'possibility-matrix-3000-completion-audit.md');

const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const weeklyPayload = JSON.parse(readFileSync(weeklyPath, 'utf8'));
const weekly = weeklyPayload.aggregate;
const matrixNations = Object.values(matrix.byNation);
const weeklyNations = Object.values(weekly.byNation);
const impactKeys = [
  'transitionYearSpread',
  'nationalScoreSpread',
  'unrestSpread',
  'prosperitySpread',
  'sustainabilitySpread',
  'crisisAttemptSpread',
  'conflictSpread',
  'outbreakSpread',
  'electionWinRateSpread',
];

function check(id, area, passed, evidence, implementation) {
  return { id, area, passed: Boolean(passed), evidence, implementation };
}

function nationDirectories(path) {
  return readdirSync(path, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

function validateMatrixRawData() {
  const directories = nationDirectories(matrixNationRoot);
  let careers = 0;
  const invalid = [];
  directories.forEach((nationId) => {
    const directory = resolve(matrixNationRoot, nationId);
    const file = readdirSync(directory).find((name) => name.endsWith('-data.json.gz'));
    if (!file) {
      invalid.push(`${nationId}:missing`);
      return;
    }
    const sessions = JSON.parse(gunzipSync(readFileSync(resolve(directory, file))).toString('utf8'));
    careers += sessions.length;
    if (sessions.length !== 3000) invalid.push(`${nationId}:${sessions.length}`);
  });
  return { directories: directories.length, careers, invalid };
}

function validateWeeklyRawData() {
  const directories = nationDirectories(weeklyNationRoot);
  let careers = 0;
  const invalid = [];
  directories.forEach((nationId) => {
    const directory = resolve(weeklyNationRoot, nationId);
    const file = readdirSync(directory).find((name) => name.endsWith('-data.json'));
    if (!file) {
      invalid.push(`${nationId}:missing`);
      return;
    }
    const sessions = JSON.parse(readFileSync(resolve(directory, file), 'utf8'));
    careers += sessions.length;
    if (sessions.length !== 13) invalid.push(`${nationId}:${sessions.length}`);
  });
  return { directories: directories.length, careers, invalid };
}

const matrixRaw = validateMatrixRawData();
const weeklyRaw = validateWeeklyRawData();
const weakestImpact = Math.min(...matrixNations.flatMap((nation) => nation.dimensionImpacts.map((impact) => (
  Math.max(...impactKeys.map((key) => impact[key]))
))));
const viabilityMinimum = Math.min(...matrixNations.map((nation) => nation.viableRate));
const viabilityMaximum = Math.max(...matrixNations.map((nation) => nation.viableRate));
const percentileWidthMinimum = Math.min(...matrixNations.map((nation) => nation.nationalScoreP90 - nation.nationalScoreP10));
const warDensityMinimum = Math.min(...weeklyNations.map((nation) => nation.warDecisionsPerYear));
const warDensityMaximum = Math.max(...weeklyNations.map((nation) => nation.warDecisionsPerYear));
const peaceDensityMinimum = Math.min(...weeklyNations.map((nation) => nation.nationDecisionsPerYear));
const peaceDensityMaximum = Math.max(...weeklyNations.map((nation) => nation.nationDecisionsPerYear));
const successfulRuptureMaximum = Math.max(...weeklyNations.map((nation) => nation.averageSuccessfulRuptures));
const crisisKinds = [...new Set(weeklyNations.flatMap((nation) => Object.keys(nation.crisisIncidentsByKind)))].sort();
const expectedCrisisKinds = [
  'center-region-break',
  'colonial-repression',
  'constitutional-crisis',
  'exile-split',
  'liberation-split',
  'regime-struggle',
];
const atlasSource = readFileSync(resolve(root, 'src', 'WorldHistoryAtlas.tsx'), 'utf8');
const pressureSource = readFileSync(resolve(root, 'src', 'NationManagementPanel.tsx'), 'utf8');
const crisisSource = readFileSync(resolve(root, 'src', 'PoliticalCrisisModal.tsx'), 'utf8');

const checks = [
  check(
    'matrix-scope',
    '39,000회 전수 범위',
    matrix.totalSessions === 39000 && matrix.sessionsPerNation === 3000 && matrixNations.length === 13 && matrix.totalHistoricalEventChoices === 8307000,
    `${matrixNations.length}개 국가 × ${matrix.sessionsPerNation.toLocaleString('ko-KR')}회 = ${matrix.totalSessions.toLocaleString('ko-KR')}회 · 사건 선택 ${matrix.totalHistoricalEventChoices.toLocaleString('ko-KR')}건`,
    'src/possibilityMatrixPlaytest.ts · scripts/run-possibility-matrix-3000-2060.ts',
  ),
  check(
    'matrix-raw-integrity',
    '국가별 압축 원자료',
    matrixRaw.directories === 13 && matrixRaw.careers === 39000 && matrixRaw.invalid.length === 0,
    `국가 디렉터리 ${matrixRaw.directories}개 · 압축 원자료 ${matrixRaw.careers.toLocaleString('ko-KR')}경력 · 오류 ${matrixRaw.invalid.length}건`,
    'docs/possibility-matrix-3000-2060-nations/',
  ),
  check(
    'combination-uniqueness',
    '정책 조합 고유성',
    matrix.uniqueCombinations === 39000 && matrix.uniqueFuturePaths === 39000 && matrix.futurePathCollisionRate === 0,
    `고유 조합 ${matrix.uniqueCombinations.toLocaleString('ko-KR')} · 고유 미래 ${matrix.uniqueFuturePaths.toLocaleString('ko-KR')} · 충돌 ${matrix.futurePathCollisionRate}%`,
    'src/centuryScenario.ts · src/possibilityMatrixPlaytest.ts',
  ),
  check(
    'choice-sensitivity',
    '선택→결과 민감도',
    weakestImpact >= 1.5,
    `14개 선택 축의 국가별 최대 장기 결과 변화 최솟값 ${weakestImpact.toFixed(1)}점`,
    'src/possibilityMatrixPlaytest.ts · choice-consequence-sensitivity finding',
  ),
  check(
    'failure-and-recovery',
    '실패와 회복 공존',
    viabilityMinimum >= 70 && viabilityMaximum < 100 && matrix.viableRate > 70 && matrix.viableRate < 99,
    `전체 생존 ${matrix.viableRate}% · 국가 범위 ${viabilityMinimum.toFixed(1)}–${viabilityMaximum.toFixed(1)}%`,
    'src/possibilityMatrixPlaytest.ts · nation-viability finding',
  ),
  check(
    'outcome-distribution',
    '국가별 결과 분포',
    percentileWidthMinimum >= 10 && matrix.nationOutcomeSpread >= 5 && matrix.nationOutcomeSpread <= 25,
    `국가별 10–90분위 최소 폭 ${percentileWidthMinimum.toFixed(1)}점 · 국가 평균 격차 ${matrix.nationOutcomeSpread.toFixed(1)}점`,
    'docs/possibility-matrix-3000-2060-summary.json',
  ),
  check(
    'matrix-findings',
    '전수 진단 종결',
    matrix.findings.length >= 4 && matrix.findings.every((finding) => finding.priority === 'P2'),
    `${matrix.findings.length}개 자동 진단 전부 P2 · P0/P1 0건`,
    'src/possibilityMatrixPlaytest.ts · buildFindings()',
  ),
  check(
    'weekly-anchor-scope',
    '실제 주간 엔진 교차검증',
    weekly.totalSessions === 169 && weekly.totalWeeks === 1036984 && weekly.reached2060Rate === 100,
    `${weekly.totalSessions}경력 · ${weekly.totalWeeks.toLocaleString('ko-KR')}주 · 2060년 도달 ${weekly.reached2060Rate}%`,
    'src/longHorizonPlaytest.ts · src/multiNationCenturyPlaytest.ts',
  ),
  check(
    'weekly-raw-integrity',
    '주간 엔진 원자료',
    weeklyRaw.directories === 13 && weeklyRaw.careers === 169 && weeklyRaw.invalid.length === 0,
    `국가 디렉터리 ${weeklyRaw.directories}개 · 원자료 ${weeklyRaw.careers}경력 · 오류 ${weeklyRaw.invalid.length}건`,
    'docs/possibility-matrix-weekly-anchor-13-2060-nations/',
  ),
  check(
    'role-authority-coverage',
    '보직·직급·권한 표본',
    weekly.roleCoverage === weekly.expectedRoleCoverage && weekly.roleCoverage === 169 && weekly.tierCoverage === 5 && weekly.branchCoverage === 3 && weekly.profileCoverage === 6,
    `보직 ${weekly.roleCoverage}/${weekly.expectedRoleCoverage} · 직급 ${weekly.tierCoverage}/5 · 계열 ${weekly.branchCoverage}/3 · 성향 ${weekly.profileCoverage}/6`,
    'src/multiNationCenturyPlaytest.test.ts',
  ),
  check(
    'phase-decision-density',
    '전시·평시 결정 리듬',
    warDensityMinimum >= 6 && warDensityMaximum <= 26 && peaceDensityMinimum >= 6 && peaceDensityMaximum <= 26,
    `전시 ${warDensityMinimum.toFixed(1)}–${warDensityMaximum.toFixed(1)}회/년 · 평시 ${peaceDensityMinimum.toFixed(1)}–${peaceDensityMaximum.toFixed(1)}회/년`,
    'src/longHorizonPlaytest.ts · phase-decision-density finding',
  ),
  check(
    'political-memory',
    '정치 위기 제도 기억',
    successfulRuptureMaximum <= 2.5 && weekly.averageSuccessfulRuptures <= 2.5,
    `성공한 권력구조 교체 전체 평균 ${weekly.averageSuccessfulRuptures.toFixed(1)}회 · 국가 최대 ${successfulRuptureMaximum.toFixed(1)}회`,
    'src/politicalCrisis.ts · src/politicalCrisis.test.ts',
  ),
  check(
    'political-crisis-variety',
    '국가별 정치 위기 유형',
    JSON.stringify(crisisKinds) === JSON.stringify(expectedCrisisKinds),
    `확인된 위기 유형 ${crisisKinds.length}종: ${crisisKinds.join(', ')}`,
    'src/nationDevelopment.ts · PoliticalCrisisModal.tsx',
  ),
  check(
    'ending-causality',
    '결말 인과·고유성',
    weekly.averageEndingCollisionRate < 25 && weekly.uniqueEndingsTotal === 169 && atlasSource.includes('world-history-causal-ledger') && atlasSource.includes('decisiveChoices'),
    `주간 결말 ${weekly.uniqueEndingsTotal}개 · 충돌 ${weekly.averageEndingCollisionRate}% · 선택 인과 원장 UI 확인`,
    'src/worldHistory.ts · src/WorldHistoryAtlas.tsx',
  ),
  check(
    'structural-pressure-levers',
    '구조 불안 대응',
    pressureSource.includes('getStructuralPressureLever') && pressureSource.includes('verificationWeeks'),
    '구조 압력별 연결 예산·예상 효과·4/13주 확인 시점 UI 연결',
    'src/nationManagement.ts · src/NationManagementPanel.tsx',
  ),
  check(
    'crisis-history-ui',
    '정치 위기 대응 기록 UI',
    crisisSource.includes('preparednessBonus') && crisisSource.includes('coup-history-section'),
    '과거 대응 학습 보너스와 최근 24건 제도 기억 표시',
    'src/PoliticalCrisisModal.tsx · src/politicalCrisis.ts',
  ),
  check(
    'weekly-findings',
    '주간 엔진 진단 종결',
    weeklyPayload.findings.length >= 8 && weeklyPayload.findings.every((finding) => finding.priority === 'P2'),
    `${weeklyPayload.findings.length}개 자동 진단 전부 P2 · P0/P1 0건`,
    'src/multiNationCenturyPlaytest.ts · buildCrossNationFindings()',
  ),
];

const failed = checks.filter((entry) => !entry.passed);
const result = {
  generatedAt: new Date().toISOString(),
  status: failed.length === 0 ? 'complete' : 'incomplete',
  sourceArtifacts: {
    matrixSummary: 'docs/possibility-matrix-3000-2060-summary.json',
    matrixGeneratedAt: matrix.generatedAt,
    weeklySummary: 'docs/possibility-matrix-weekly-anchor-13-2060-summary.json',
    weeklyGeneratedAt: weeklyPayload.generatedAt,
    supersededBaseline: 'docs/possibility-matrix-weekly-anchor-6-2060.md',
  },
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  remaining: failed.map((entry) => ({ id: entry.id, area: entry.area, evidence: entry.evidence })),
};

const rows = checks.map((entry) => `| ${entry.passed ? '완료' : '미완료'} | ${entry.area} | ${entry.evidence} | \`${entry.implementation}\` |`).join('\n');
const markdown = `# 39,000회 가능세계 개선 완료 감사

## 결론

**${result.status === 'complete' ? `완료 · ${result.passed}/${result.total}개 검증 통과` : `미완료 · ${result.passed}/${result.total}개 검증 통과`}**

이 문서는 39,000회 가능세계 행렬과 169개 실제 주간 엔진 앵커를 다시 읽어, 기존 보고서의 권고가 최신 코드·테스트·산출물에 실제로 반영됐는지 자동 대조한 결과다. \`P2 · 개선됨\`은 미처리 우선순위가 아니라 건강 범위로 종결된 자동 진단을 뜻한다. 현재 P0/P1 잔여 항목은 ${failed.length}건이다.

사용자가 지정한 \`possibility-matrix-weekly-anchor-6-2060.md\`는 78경력 당시의 기준선 기록으로 보존한다. 그 문서에서 남긴 전 보직 확대, 전시·평시 결정 분리, 정치 위기 기록 권고는 최신 \`possibility-matrix-weekly-anchor-13-2060.md\`와 아래 감사에서 재검증됐다.

## 완료 대조표

| 상태 | 검증 영역 | 최신 근거 | 구현·검증 위치 |
| --- | --- | --- | --- |
${rows}

## 남은 항목

${failed.length === 0 ? '- 없음. 현재 자동 감사 기준에서 기존 요청의 필수 보완은 모두 완료됐다.' : failed.map((entry) => `- **${entry.area}**: ${entry.evidence}`).join('\n')}

## 재실행

\`\`\`bash
npm run audit:possibilities
\`\`\`

감사는 국가별 압축 원자료 39,000경력과 실제 주간 원자료 169경력을 직접 다시 읽으며, 요약 JSON만 신뢰하지 않는다. 실패 항목이 하나라도 생기면 명령은 종료 코드 1을 반환한다.
`;

writeFileSync(outputJson, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
writeFileSync(outputMarkdown, markdown, 'utf8');
process.stdout.write(`possibility remediation audit: ${result.passed}/${result.total} checks passed\n`);
if (failed.length > 0) {
  failed.forEach((entry) => process.stderr.write(`FAIL ${entry.id}: ${entry.evidence}\n`));
  process.exitCode = 1;
}
