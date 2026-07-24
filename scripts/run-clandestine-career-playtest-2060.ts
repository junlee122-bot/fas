import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CLANDESTINE_PLAYTEST_END_YEAR,
  CLANDESTINE_PLAYTEST_SESSION_COUNT,
  CLANDESTINE_PLAYTEST_START_YEAR,
  runClandestineCareerPlaytest,
  type ClandestinePlaytestRun,
} from '../src/clandestineCareerPlaytest';

const formatNumber = (value: number) => value.toLocaleString('ko-KR');
const percent = (value: number) => `${value.toFixed(1)}%`;

function createMarkdown(run: ClandestinePlaytestRun, prefix: string) {
  const { aggregate } = run;
  const eraRows = aggregate.eraTimeline.map((era) => `| ${era.era} | ${percent(era.activeCareerRate)} | ${era.missionsPerActiveYear.toFixed(1)} | ${percent(era.missionSuccessRate)} | ${era.incidentsPerActiveDecade.toFixed(1)} | ${percent(era.attentionWeekRate)} | ${percent(era.highExposureWeekRate)} | ${percent(era.highStressWeekRate)} | ${era.decisionsPerActiveYear.toFixed(1)} |`).join('\n');
  const profileRows = Object.entries(aggregate.byProfile).map(([profile, value]) => `| ${profile} | ${value.sessions} | ${percent(value.activeAt2060Rate)} | ${value.averageActiveYears.toFixed(1)}년 | ${value.averageMissions.toFixed(1)} | ${percent(value.missionSuccessRate)} | ${value.incidentsPerDecade.toFixed(1)} | ${percent(value.attentionWeekRate)} | ${value.averageFinalExposure.toFixed(1)} | ${value.averageFinalStress.toFixed(1)} |`).join('\n');
  const findingSections = run.findings.map((finding) => `### ${finding.priority} · ${finding.title}\n\n- 관측 근거: ${finding.evidence}\n- 재미 영향: ${finding.funImpact}\n- 개선 방향: ${finding.recommendation}`).join('\n\n');
  const worstRows = aggregate.worstSessions.slice(0, 12).map((session) => `| #${session.id} | ${session.homeNationId} | ${session.roleId} | ${session.profile} | ${session.frictionScore.toFixed(1)} | ${session.reasons.join(' · ') || '복합 마찰'} |`).join('\n');

  return `# IRON DOMINION 비밀 커리어 ${CLANDESTINE_PLAYTEST_START_YEAR}–${CLANDESTINE_PLAYTEST_END_YEAR} 자동 플레이 ${aggregate.sessionCount}회

## 결론

외국 포섭 이후의 이중생활만 독립된 커리어로 분리해 ${formatNumber(aggregate.totalWeeks)}주의 상태 전이를 실행했습니다. 본국 충성 이중공작원, 외국 자산, 생존 우선형, 기만 전문가, 전향 준비형, 기회주의형의 여섯 행동 성향이 실제 \`clandestineCareer\` 엔진의 임무·신뢰·위장·노출·방첩·탈출 규칙을 사용했습니다. 탈출·전향이나 연락 단절로 한 비밀 경력이 끝나면 공개 경력을 유지한 채 일정 기간 뒤 다른 국가·기관의 제안을 검토하는 다음 장도 같은 세계선에서 계속 계산했습니다.

## 핵심 지표

| 항목 | 결과 |
| --- | ---: |
| 활동 상태로 2060년 도달 | ${percent(aggregate.activeAt2060Rate)} |
| 2060 시점 비밀 연락선 휴면 | ${percent(aggregate.closedCareerRate)} |
| 외국 탈출·전향 | ${percent(aggregate.extractionRate)} |
| 자발적 연락 단절 | ${percent(aggregate.cutTiesRate)} |
| 통제 이중공작 경험 | ${percent(aggregate.controlledDoubleRate)} |
| 평균 비밀 경력 장 | ${aggregate.averageCareerArcs.toFixed(1)}개 |
| 복수 국가·연락선 경력 | ${percent(aggregate.multiArcCareerRate)} |
| 평균 탈출·전향 전환 | ${aggregate.averageExtractionTransitions.toFixed(1)}회 |
| 평균 자발적 연락 단절 | ${aggregate.averageCutTieTransitions.toFixed(1)}회 |
| 평균 실제 활동 기간 | ${aggregate.averageActiveYears.toFixed(1)}년 |
| 평균 휴면 기간 | ${aggregate.averageDormantYears.toFixed(1)}년 |
| 평균 임무 수 | ${aggregate.averageMissions.toFixed(1)}건 |
| 임무 성공률 | ${percent(aggregate.missionSuccessRate)} |
| 활동 10년당 방첩 사건 | ${aggregate.incidentsPerDecade.toFixed(1)}건 |
| 선택·사건 주의 주차 | ${percent(aggregate.attentionWeekRate)} |
| 고노출 주차 | ${percent(aggregate.highExposureWeekRate)} |
| 고스트레스 주차 | ${percent(aggregate.highStressWeekRate)} |
| 임무 암호명 다양성 | 세션당 ${aggregate.averageUniqueMissionCodenames.toFixed(1)}개 |

## 시대별 흐름

| 시대 | 활동 유지 | 연간 임무 | 성공률 | 10년당 사건 | 주의 주차 | 고노출 | 고압박 | 연간 선택 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${eraRows}

## 플레이 성향별 결과

| 성향 | 세션 | 2060 활동 | 활동 기간 | 임무 | 성공률 | 10년당 사건 | 주의 주차 | 최종 노출 | 최종 압박 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${profileRows}

## 발견한 불편과 재미 저하 요인

${findingSections}

## 마찰이 큰 세션 표본

| 세션 | 본국 | 보직 | 성향 | 마찰 점수 | 원인 |
| --- | --- | --- | --- | ---: | --- |
${worstRows}

## 해석상의 한계

- 500회는 사람 500명이 화면을 클릭한 결과가 아니라, 실제 게임 엔진을 여섯 행동 성향의 결정 규칙으로 반복 실행한 결정론적 자동 플레이입니다.
- 비밀 커리어 외의 전쟁·경제·선거는 핵심 맥락 수치만 유지해 이중생활 루프의 병목을 분리 측정했습니다.
- 탈출·전향이나 연락 단절은 공개 경력의 게임 오버가 아닙니다. \`2060 시점 비밀 연락선 휴면\`은 마지막 주에 활성 핸들러가 없다는 뜻이며, 제안 대기 중인 공개 경력은 계속됩니다.
- 118년을 횡단하는 \`비밀 경력 장\`은 한 사람이 문자 그대로 같은 직무에 머문 수명이 아니라, 동일 세계선에서 역할·조직·후계자를 거쳐 이어지는 플레이어 경력 계보로 해석합니다.
- 화면 배치·글자 겹침·모바일 조작성은 별도 브라우저 검증으로 확인해야 합니다.

## 재실행

- 상세 보고서: \`docs/${prefix}.md\`
- 집계 데이터: \`docs/${prefix}-summary.json\`
- 500회 세션 원자료: \`docs/${prefix}-data.json\`
- 실행기: \`npm run playtest:clandestine -- 500 docs ${prefix}\`
- 실행 래퍼: \`scripts/run-clandestine-career-playtest-2060.mjs\`
- 보고서 생성기: \`scripts/run-clandestine-career-playtest-2060.ts\`
- 계측기: \`src/clandestineCareerPlaytest.ts\`
`;
}

const sessionCount = Number(process.argv[2] ?? CLANDESTINE_PLAYTEST_SESSION_COUNT);
const outputDirectory = resolve(process.argv[3] ?? 'docs');
const prefix = process.argv[4] ?? 'clandestine-career-playtest-500-2060';
const run = runClandestineCareerPlaytest(sessionCount);

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(resolve(outputDirectory, `${prefix}-data.json`), `${JSON.stringify(run.sessions, null, 2)}\n`, 'utf8');
writeFileSync(resolve(outputDirectory, `${prefix}-summary.json`), `${JSON.stringify({
  generatedAt: run.generatedAt,
  methodology: run.methodology,
  aggregate: run.aggregate,
  findings: run.findings,
}, null, 2)}\n`, 'utf8');
writeFileSync(resolve(outputDirectory, `${prefix}.md`), createMarkdown(run, prefix), 'utf8');
process.stdout.write(`completed ${sessionCount} clandestine career sessions into ${outputDirectory}\n`);
