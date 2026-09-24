import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { nations } from '../src/campaign';
import {
  armsDiplomacyDoctrineLabels,
  runArmsDiplomacyPlaytest,
  type ArmsDiplomacySession,
  type ArmsDiplomacySummary,
  type NationStageArmsAggregate,
} from '../src/armsDiplomacyPlaytest';
import {
  acquisitionRouteLabels,
  getNationArmsProfile,
  strategicStages,
} from '../src/strategicArmsDiplomacy';

const formatNumber = (value: number) => value.toLocaleString('ko-KR');
const percent = (value: number) => `${value.toFixed(1)}%`;

function stageRows(summary: ArmsDiplomacySummary) {
  return summary.byStage.map((stage) => {
    const definition = strategicStages.find((item) => item.id === stage.stageId)!;
    return `| ${definition.shortLabel} | ${formatNumber(stage.sessions)} | ${stage.averageCapabilityGain.toFixed(1)} | ${stage.averageEscalation.toFixed(1)} | ${stage.averageTreatyCompliance.toFixed(1)} | ${percent(stage.viabilityRate)} | ${percent(stage.collapseRate)} |`;
  }).join('\n');
}

function doctrineRows(summary: ArmsDiplomacySummary) {
  return summary.byDoctrine.map((doctrine) => `| ${armsDiplomacyDoctrineLabels[doctrine.doctrine]} | ${formatNumber(doctrine.sessions)} | ${doctrine.averageCapabilityGain.toFixed(1)} | ${doctrine.averageAutonomy.toFixed(1)} | ${doctrine.averageEscalation.toFixed(1)} | ${percent(doctrine.viabilityRate)} |`).join('\n');
}

function nationStageRows(summary: ArmsDiplomacySummary) {
  return summary.byNationStage.map((group) => {
    const nation = nations.find((item) => item.id === group.nationId)!;
    const stage = strategicStages.find((item) => item.id === group.stageId)!;
    return `| ${nation.shortName} | ${stage.shortLabel} | ${formatNumber(group.sessions)} | ${group.uniquePaths} | ${acquisitionRouteLabels[group.dominantRoute]} ${percent(group.dominantRouteRate)} | ${group.averageCapabilityGain.toFixed(1)} | ${group.averageAutonomy.toFixed(1)} | ${group.averageInteroperability.toFixed(1)} | ${group.averageSupplySecurity.toFixed(1)} | ${group.averageEscalation.toFixed(1)} | ${percent(group.viabilityRate)} | ${percent(group.obsoleteLockInRate)} |`;
  }).join('\n');
}

function findings(summary: ArmsDiplomacySummary) {
  return summary.findings.map((finding) => `### ${finding.priority} · ${finding.title}

- 근거: ${finding.evidence}
- 보완 규칙: ${finding.remediation}`).join('\n\n');
}

function createOverview(summary: ArmsDiplomacySummary) {
  return `# IRON DOMINION 국가·시대별 무기체계 × 외교체계 1,000회 시뮬레이션

## 실행 범위

- 국가: ${summary.nationCoverage}개
- 시대 단계: ${summary.stageCoverage}개
- 국가·단계별 반복: ${formatNumber(summary.simulationsPerNationStage)}회
- 전체 세션: ${formatNumber(summary.sessions)}회
- 무기체계 사업 결정: ${formatNumber(summary.totalWeaponProgramUses)}회
- 외교·조달 정책 결정: ${formatNumber(summary.totalDiplomaticPolicyUses)}회
- 총 선택·결과 전이: ${formatNumber(summary.totalDecisions)}회
- 행동 교리: ${summary.doctrineCoverage}종
- 전체 생존 가능 경로: ${percent(summary.viabilityRate)}
- 국가 붕괴: ${percent(summary.collapseRate)}
- 구식체계 고착: ${percent(summary.obsoleteLockInRate)}

## 시대별 결과

| 시대 | 세션 | 전력 증가 | 긴장 | 조약 신뢰 | 생존 | 붕괴 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${stageRows(summary)}

## 플레이 교리별 결과

| 교리 | 세션 | 전력 증가 | 자율성 | 긴장 | 생존 |
| --- | ---: | ---: | ---: | ---: | ---: |
${doctrineRows(summary)}

## 국가 × 시대 65개 셀

| 국가 | 시대 | 반복 | 고유 경로 | 주 조달 | 전력 증가 | 자율 | 상호운용 | 공급 | 긴장 | 생존 | 구식 고착 |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${nationStageRows(summary)}

## 자동 진단

${findings(summary)}

## 방법

${summary.methodology} 국가마다 산업·과학·수입의존·수출역량·제재회복력·상호운용성·전략 자율성과 3개 중점 병과를 다르게 두었습니다. 매 세션은 자립 병기창, 동맹 통합, 비동맹 균형, 독자 억제, 방산 수출, 규범·군축의 여섯 행동 교리 중 하나로 진행됩니다.

## 산출물

- 전체 집계: \`docs/arms-diplomacy-stage-1000-2060-summary.json\`
- 국가별 보고서·집계·압축 원자료: \`docs/arms-diplomacy-stage-1000-2060-nations/<nation-id>/\`
- 역사 조사와 규칙 변환: \`docs/arms-diplomacy-historical-research.md\`
- 재실행기: \`scripts/run-arms-diplomacy-stage-playtest.mjs\`
- 계측 엔진: \`src/armsDiplomacyPlaytest.ts\`
`;
}

function createNationReport(
  nationId: NationStageArmsAggregate['nationId'],
  groups: NationStageArmsAggregate[],
) {
  const nation = nations.find((item) => item.id === nationId)!;
  const profile = getNationArmsProfile(nationId);
  const rows = groups.map((group) => {
    const stage = strategicStages.find((item) => item.id === group.stageId)!;
    return `| ${stage.shortLabel} | ${group.sessions} | ${group.uniquePaths} | ${acquisitionRouteLabels[group.dominantRoute]} ${percent(group.dominantRouteRate)} | ${group.averageCapabilityGain.toFixed(1)} | ${group.averageAutonomy.toFixed(1)} | ${group.averageInteroperability.toFixed(1)} | ${group.averageFiscalStress.toFixed(1)} | ${group.averageSupplySecurity.toFixed(1)} | ${group.averageEscalation.toFixed(1)} | ${percent(group.viabilityRate)} |`;
  }).join('\n');
  return `# ${nation.name} 무기체계 × 외교체계 5,000회 결과

${profile.historicalAnchor}

- 산업 ${profile.industrialBase} · 과학 ${profile.scienceBase} · 수입 의존 ${profile.importDependence}
- 수출 역량 ${profile.exportCapacity} · 제재 회복력 ${profile.sanctionsResilience}
- 초기 상호운용 ${profile.interoperability} · 전략 자율 ${profile.autonomy}
- 중점: ${profile.priorities.join(' · ')}
- 선호 조달: ${profile.preferredRoutes.map((route) => acquisitionRouteLabels[route]).join(' → ')}

| 시대 | 세션 | 고유 경로 | 주 조달 | 전력 증가 | 자율 | 상호운용 | 재정부담 | 공급 | 긴장 | 생존 |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}
`;
}

function validate(summary: ArmsDiplomacySummary, sessions: ArmsDiplomacySession[], iterations: number) {
  const expected = nations.length * strategicStages.length * iterations;
  const ids = new Set(sessions.map((session) => session.id));
  const wrong = nations.flatMap((nation) => strategicStages.flatMap((stage) => {
    const count = sessions.filter((session) => session.nationId === nation.id && session.stageId === stage.id).length;
    return count === iterations ? [] : [`${nation.id}/${stage.id}:${count}`];
  }));
  if (sessions.length !== expected || ids.size !== expected || summary.byNationStage.length !== nations.length * strategicStages.length || wrong.length > 0) {
    throw new Error(`invalid arms-diplomacy matrix: sessions=${sessions.length}/${expected}, ids=${ids.size}, groups=${summary.byNationStage.length}, wrong=${wrong.join(',')}`);
  }
}

const iterations = Number(process.argv[2] ?? 1_000);
const outputRoot = resolve(process.argv[3] ?? 'docs');
const nationRoot = resolve(outputRoot, 'arms-diplomacy-stage-1000-2060-nations');
const { sessions, summary } = runArmsDiplomacyPlaytest(iterations);
validate(summary, sessions, iterations);
mkdirSync(nationRoot, { recursive: true });

nations.forEach((nation) => {
  const nationSessions = sessions.filter((session) => session.nationId === nation.id);
  const groups = summary.byNationStage.filter((group) => group.nationId === nation.id);
  const directory = resolve(nationRoot, nation.id);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, `${nation.id}-${iterations}-per-stage-data.json.gz`), gzipSync(JSON.stringify(nationSessions), { level: 9 }));
  writeFileSync(resolve(directory, `${nation.id}-${iterations}-per-stage-summary.json`), `${JSON.stringify(groups, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(directory, `${nation.id}-${iterations}-per-stage.md`), createNationReport(nation.id, groups), 'utf8');
});

writeFileSync(resolve(outputRoot, 'arms-diplomacy-stage-1000-2060-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
writeFileSync(resolve(outputRoot, 'arms-diplomacy-stage-1000-2060.md'), createOverview(summary), 'utf8');
process.stdout.write(`completed ${formatNumber(summary.sessions)} nation-stage simulations · ${formatNumber(summary.totalDecisions)} decisions\n`);
