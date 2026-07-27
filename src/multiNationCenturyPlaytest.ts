import { careerRoles, nations } from './campaign';
import { createCenturyScenarioBlueprint, type CenturyScenarioBlueprint } from './centuryScenario';
import {
  aggregateCenturySessions,
  CENTURY_PLAYTEST_WEEKS,
  type CenturyAggregate,
  type CenturyFinding,
} from './centuryPlaytest';
import {
  LONG_HORIZON_START_YEAR,
  runLongHorizonSession,
  type LongHorizonProfile,
  type LongHorizonSessionResult,
} from './longHorizonPlaytest';

export const MULTI_NATION_CENTURY_END_YEAR = 2060;
export const MULTI_NATION_SESSIONS_PER_NATION = 500;
export const MULTI_NATION_TOTAL_SESSIONS = nations.length * MULTI_NATION_SESSIONS_PER_NATION;

export interface NationCenturySessionResult extends LongHorizonSessionResult {
  nationScenarioId: number;
  scenarioBlueprint: CenturyScenarioBlueprint;
}

export interface NationCenturyResult {
  nationId: string;
  nationName: string;
  sessionCount: number;
  expectedRoleCount: number;
  aggregate: CenturyAggregate;
  findings: CenturyFinding[];
}

export interface MultiNationCenturyFinding {
  priority: 'P0' | 'P1' | 'P2';
  id: string;
  title: string;
  evidence: string;
  recommendation: string;
}

export interface MultiNationCenturyAggregate {
  nationCount: number;
  sessionsPerNation: number;
  totalSessions: number;
  weeksPerSession: number;
  totalWeeks: number;
  reached2060Rate: number;
  roleCoverage: number;
  expectedRoleCoverage: number;
  tierCoverage: number;
  branchCoverage: number;
  profileCoverage: number;
  averageWarYears: number;
  averageNationYears: number;
  averageFinalNationalScore: number;
  averageFinalMandate: number;
  averageFinalUnrest: number;
  averageFinalStructuralUnrestTarget: number;
  averageNationAgendaDecisions: number;
  transitionYearSpread: number;
  transitionArchetypeCoverage: number;
  nationalScoreSpread: number;
  mandateSpread: number;
  unrestSpread: number;
  coupSessionRateSpread: number;
  averageCoupAttempts: number;
  coupAttemptsSpread: number;
  decisionsPerYearSpread: number;
  warDecisionsPerYearSpread: number;
  nationDecisionsPerYearSpread: number;
  averageSuccessfulRuptures: number;
  averageEndingCollisionRate: number;
  uniqueEndingsTotal: number;
  byNation: Record<string, {
    name: string;
    sessions: number;
    roleCoverage: number;
    expectedRoleCount: number;
    tierCoverage: number;
    branchCoverage: number;
    profileCoverage: number;
    reached2060Rate: number;
    averageTransitionYear: number;
    transitionArchetype: string;
    averageWarYears: number;
    averageNationYears: number;
    decisionsPerYear: number;
    warDecisionsPerYear: number;
    nationDecisionsPerYear: number;
    averageNationAgendaDecisions: number;
    interruptionsPerYear: number;
    averageFinalNationalScore: number;
    averageFinalMandate: number;
    averageFinalUnrest: number;
    averageFinalStructuralUnrestTarget: number;
    averageFinalStructuralUnrestFloor: number;
    coupSessionRate: number;
    averageCoupAttempts: number;
    averageSuccessfulRuptures: number;
    successfulCoupSessionRate: number;
    crisisIncidentsByKind: Record<string, number>;
    outbreakSessionRate: number;
    averageHistoricalCouncilCoverage: number;
    uniqueWorldlineCodes: number;
    uniqueEndings: number;
    endingCollisionRate: number;
  }>;
}

export interface MultiNationCenturyRun {
  generatedAt: string;
  methodology: string;
  aggregate: MultiNationCenturyAggregate;
  nations: NationCenturyResult[];
  findings: MultiNationCenturyFinding[];
}

const profiles: LongHorizonProfile[] = ['guided', 'rushed', 'military', 'state-builder', 'completionist', 'opportunist'];
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const rate = (numerator: number, denominator: number) => round(numerator / Math.max(1, denominator) * 100);
const spread = (values: number[]) => values.length > 0 ? round(Math.max(...values) - Math.min(...values)) : 0;

export function getNationCenturyEngineSessionId(nationId: string, nationScenarioId: number) {
  const nationIndex = nations.findIndex((nation) => nation.id === nationId);
  if (nationIndex < 0) throw new Error(`unknown nation: ${nationId}`);
  return nationIndex + nations.length * nationScenarioId;
}

export function runNationCenturySession(
  nationId: string,
  nationScenarioId: number,
  weeksPlayed = CENTURY_PLAYTEST_WEEKS,
): NationCenturySessionResult {
  const nation = nations.find((candidate) => candidate.id === nationId);
  if (!nation) throw new Error(`unknown nation: ${nationId}`);
  const scenarioBlueprint = createCenturyScenarioBlueprint(nation.id, nationScenarioId);
  const session = runLongHorizonSession(
    getNationCenturyEngineSessionId(nationId, nationScenarioId),
    weeksPlayed,
    scenarioBlueprint,
  );
  if (session.nationId !== nationId) throw new Error(`nation routing mismatch: expected ${nationId}, received ${session.nationId}`);
  return { ...session, nationScenarioId, scenarioBlueprint };
}

function buildCrossNationFindings(aggregate: MultiNationCenturyAggregate): MultiNationCenturyFinding[] {
  const findings: MultiNationCenturyFinding[] = [];
  const incompleteRoles = Object.entries(aggregate.byNation).filter(([, result]) =>
    aggregate.sessionsPerNation >= result.expectedRoleCount
    && result.roleCoverage < result.expectedRoleCount,
  );
  if (incompleteRoles.length > 0) findings.push({
    priority: 'P0',
    id: 'nation-role-coverage-gap',
    title: '일부 국가의 실제 보직이 500회 표본에서 누락됨',
    evidence: incompleteRoles.map(([id, result]) => `${id} ${result.roleCoverage}/${result.expectedRoleCount}`).join(' · '),
    recommendation: '국가별 시드 라우팅이 모든 보직을 순환하도록 수정한 뒤 해당 국가를 재실행하십시오.',
  });
  if (aggregate.nationalScoreSpread >= 12) findings.push({
    priority: aggregate.nationalScoreSpread >= 20 ? 'P0' : 'P1',
    id: 'nation-outcome-balance-spread',
    title: '국가 선택만으로 장기 국가성과 격차가 크게 벌어짐',
    evidence: `국가별 최종 국가점수 평균의 최고–최저 격차가 ${aggregate.nationalScoreSpread}점입니다.`,
    recommendation: '초기 불리함은 고유 난이도로 유지하되 외교·산업·독립·정보 등 국가별 회복 경로의 기대값을 보강하십시오.',
  });
  if (aggregate.nationalScoreSpread <= 5) findings.push({
    priority: 'P1',
    id: 'nation-outcome-convergence',
    title: '서로 다른 13개 국가가 2060년에 비슷한 국가성과로 수렴함',
    evidence: `국가별 최종 국가점수 평균의 최고–최저 격차가 ${aggregate.nationalScoreSpread}점에 불과합니다.`,
    recommendation: '국가별 인구·자원·제도·식민지 경험·지역질서가 장기 성장 상한과 실패·회복 경로에 남도록 후기 구조 압력을 분화하십시오.',
  });
  if (aggregate.nationalScoreSpread > 5 && aggregate.nationalScoreSpread < 12) findings.push({
    priority: 'P2',
    id: 'nation-outcome-differentiation-healthy',
    title: '개선됨 · 국가의 구조적 차이가 장기 성과에 남음',
    evidence: `국가별 최종 국가점수 평균의 최고–최저 격차가 ${aggregate.nationalScoreSpread}점으로, 획일 수렴과 회복 불가능 격차 사이에 위치합니다.`,
    recommendation: '현재 국가별 자원·행정·산업·식민지 경험 계수를 유지하며 표본을 확대해 양 끝 국가의 회복 경로를 재검증하십시오.',
  });
  if (aggregate.transitionYearSpread <= 1) findings.push({
    priority: 'P1',
    id: 'nation-transition-timeline-convergence',
    title: '국가 고유의 종전·독립·해방 조건이 전환 연도에 드러나지 않음',
    evidence: `국가별 평균 전쟁→국가운영 전환 연도 격차가 ${aggregate.transitionYearSpread}년에 불과하며, 한국을 제외한 12개 국가는 평균 1944.4년으로 같습니다.`,
    recommendation: '승전국·패전국·망명정부·식민지 독립운동·점령지 자치정부별 전환 조건과 과도정부 경로를 별도로 모델링하십시오.',
  });
  if (aggregate.transitionYearSpread > 1) findings.push({
    priority: 'P2',
    id: 'nation-transition-timeline-differentiated',
    title: '개선됨 · 승전·패전·해방·독립의 전환 시계가 분리됨',
    evidence: `${aggregate.transitionArchetypeCoverage}개 전환 유형이 사용되며 국가별 평균 전환 연도 격차는 ${aggregate.transitionYearSpread}년입니다.`,
    recommendation: '각 전환 유형에서 플레이어가 준비도를 앞당기거나 늦출 수 있는 선택의 기여도를 계속 추적하십시오.',
  });
  if (aggregate.averageFinalUnrest <= 1 && aggregate.unrestSpread <= 1) findings.push({
    priority: 'P0',
    id: 'late-game-unrest-collapse',
    title: '2060년에는 거의 모든 국가의 사회 불안이 0으로 사라짐',
    evidence: `13개 국가 최종 불안 평균은 ${aggregate.averageFinalUnrest}, 국가 간 격차도 ${aggregate.unrestSpread}점입니다.`,
    recommendation: '불안을 일회성 감소값이 아니라 불평등·세대·지역·민족·이념·주거·환경 압력에서 계속 재생되는 구조 지표로 바꾸십시오.',
  });
  if (aggregate.averageFinalUnrest > 1 && aggregate.unrestSpread > 1) findings.push({
    priority: 'P2',
    id: 'late-game-unrest-regenerated',
    title: '개선됨 · 후기 사회 불안이 구조 압력에서 다시 생성됨',
    evidence: `2060년 최종 불안 평균 ${aggregate.averageFinalUnrest}, 구조 목표 평균 ${aggregate.averageFinalStructuralUnrestTarget}, 국가 간 격차 ${aggregate.unrestSpread}점입니다.`,
    recommendation: '불평등·지역·정체성·세대·환경 압력의 국가별 상위 원인을 UI에서 계속 설명하십시오.',
  });
  if (aggregate.averageCoupAttempts > 12 || aggregate.coupAttemptsSpread > 15) findings.push({
    priority: 'P1',
    id: 'nation-political-crisis-spread',
    title: '국가별 정치 위기의 장기 발생 횟수가 과도하게 다름',
    evidence: `118년 경력당 정치 위기는 평균 ${aggregate.averageCoupAttempts}회, 국가별 평균 횟수 격차는 ${aggregate.coupAttemptsSpread}회입니다.`,
    recommendation: '정부 형태와 식민지·망명정부 상태에 맞춰 쿠데타, 지도부 분열, 종주국 탄압, 저항조직 장악 시도의 명칭과 발생식을 분리하십시오.',
  });
  if (aggregate.averageCoupAttempts <= 12 && aggregate.coupAttemptsSpread <= 15) findings.push({
    priority: 'P2',
    id: 'nation-political-crisis-calibrated',
    title: '개선됨 · 118년 정치 위기 발생 속도가 국가 구조에 맞게 분화됨',
    evidence: `경력당 정치 위기는 평균 ${aggregate.averageCoupAttempts}회, 국가별 평균 횟수 격차 ${aggregate.coupAttemptsSpread}회이며 각 국가는 고유 위기 명칭과 재발 간격을 사용합니다.`,
    recommendation: '쿠데타 외에도 지도부 분열·종주국 탄압·망명정부 분열이 실제 UI 기록에 남는지 브라우저 플레이로 점검하십시오.',
  });
  const phaseDensityOutliers = Object.entries(aggregate.byNation).filter(([, result]) =>
    result.warDecisionsPerYear < 6
    || result.warDecisionsPerYear > 26
    || result.nationDecisionsPerYear < 6
    || result.nationDecisionsPerYear > 26
  );
  findings.push({
    priority: phaseDensityOutliers.length > 0 ? 'P1' : 'P2',
    id: 'phase-decision-density',
    title: phaseDensityOutliers.length > 0
      ? '일부 국가의 전시·평시 결정 밀도가 가독 범위를 벗어남'
      : '개선됨 · 전시와 평시 모두 연간 6–26개의 가독 가능한 결정 리듬을 유지함',
    evidence: phaseDensityOutliers.length > 0
      ? phaseDensityOutliers.map(([id, result]) => `${id} 전시 ${result.warDecisionsPerYear} · 평시 ${result.nationDecisionsPerYear}`).join(' · ')
      : `국가별 전시 결정 격차 ${aggregate.warDecisionsPerYearSpread}회, 평시 결정 격차 ${aggregate.nationDecisionsPerYearSpread}회입니다.`,
    recommendation: phaseDensityOutliers.length > 0
      ? '주간 반복 행동을 묶고 빈 단계에는 직무·국가 고유 의제 또는 월간 검토를 공급하십시오.'
      : '새 콘텐츠를 추가할 때 전시·평시를 합산하지 말고 두 단계의 범위를 각각 회귀 검증하십시오.',
  });
  const ruptureOutliers = Object.entries(aggregate.byNation).filter(([, result]) => result.averageSuccessfulRuptures > 2.5);
  findings.push({
    priority: ruptureOutliers.length > 0 ? 'P1' : 'P2',
    id: 'successful-political-rupture-frequency',
    title: ruptureOutliers.length > 0
      ? '한 경력에서 성공한 권력구조 교체가 과도하게 반복됨'
      : '개선됨 · 예방 경험과 제도 학습이 반복적인 체제 전복을 억제함',
    evidence: ruptureOutliers.length > 0
      ? ruptureOutliers.map(([id, result]) => `${id} 평균 ${result.averageSuccessfulRuptures}회`).join(' · ')
      : `전 국가 경력당 성공한 권력구조 교체 평균은 ${aggregate.averageSuccessfulRuptures}회입니다.`,
    recommendation: ruptureOutliers.length > 0
      ? '저지 경험과 체제 단절 뒤의 제도 학습을 다음 대응 성공률·재발 대기기간에 누적하십시오.'
      : '성공적 체제 단절은 드물지만 중대한 사건으로 유지하고 국가별 위기 명칭과 결과 기록을 보존하십시오.',
  });
  if (aggregate.decisionsPerYearSpread >= 20) findings.push({
    priority: 'P1',
    id: 'nation-decision-density-spread',
    title: '국가별 연간 선택 밀도가 다르게 체감됨',
    evidence: `국가별 연간 실질 결정 수 격차가 ${aggregate.decisionsPerYearSpread}회입니다.`,
    recommendation: '사건 수가 적은 국가는 지역·독립·식민지·망명정부 고유 의제와 인물 상호작용을 추가하십시오.',
  });
  if (aggregate.decisionsPerYearSpread <= 1) findings.push({
    priority: 'P1',
    id: 'nation-decision-density-convergence',
    title: '국가가 달라도 장기 선택 리듬이 거의 같음',
    evidence: `국가별 연간 결정 수 격차가 ${aggregate.decisionsPerYearSpread}회에 불과합니다.`,
    recommendation: '대국은 동맹·패권·경제권, 식민지와 저항운동은 독립·탄압·지하조직, 망명정부는 승인·귀환·정통성 중심의 고유 주간 의제를 공급하십시오.',
  });
  if (aggregate.decisionsPerYearSpread > 1 && aggregate.decisionsPerYearSpread < 20) findings.push({
    priority: 'P2',
    id: 'nation-decision-rhythm-differentiated',
    title: '개선됨 · 전쟁 지속기간과 국가 의제 주기가 선택 리듬을 분화함',
    evidence: `국가별 연간 결정 수 격차는 ${aggregate.decisionsPerYearSpread}회입니다. 전환이 늦은 독립전쟁·내전 경력은 주간 전투 결재가 오래 이어지고, 평시 경력에는 국가 의제가 공급됩니다.`,
    recommendation: '다음 계측에서는 전시·평시 결정 밀도를 분리해 각 단계가 연간 6–26회의 가독 가능한 범위에 머무는지 검증하십시오.',
  });
  if (aggregate.averageEndingCollisionRate >= 25) findings.push({
    priority: 'P1',
    id: 'nation-ending-collision',
    title: '선택을 달리해도 일부 국가의 결말 정체성이 여전히 충돌함',
    evidence: `국가별 결말 충돌률 평균은 ${aggregate.averageEndingCollisionRate}%입니다.`,
    recommendation: '최근 결정의 실제 사건·선택·국가 의제·정치 위기 응답을 결말 서명과 결말 설명 양쪽에 더 반영하십시오.',
  });
  if (aggregate.averageEndingCollisionRate < 25) findings.push({
    priority: 'P2',
    id: 'nation-ending-collision-reduced',
    title: '개선됨 · 실제 선택 지문이 결말 중복을 줄임',
    evidence: `국가별 결말 충돌률 평균은 ${aggregate.averageEndingCollisionRate}%이고, 결말은 최근 96개 실제 결정과 국가 의제 이력을 사용합니다.`,
    recommendation: '표본 확대 시 25% 미만을 유지하면서 결말 설명의 가독성을 브라우저에서 검증하십시오.',
  });
  if (findings.length === 0) findings.push({
    priority: 'P2',
    id: 'multi-nation-century-baseline-healthy',
    title: '13개 국가의 장기 엔진 범위가 비교 기준을 통과함',
    evidence: `2060년 완주율 ${aggregate.reached2060Rate}%, 보직 ${aggregate.roleCoverage}/${aggregate.expectedRoleCoverage}, 행동 성향 ${aggregate.profileCoverage}/6을 확인했습니다.`,
    recommendation: '다음 검증에서는 국가별 화면 조작성과 고유 사건 발견률을 실제 브라우저 플레이로 측정하십시오.',
  });
  return findings;
}

export function aggregateMultiNationCenturySessions(
  sessions: NationCenturySessionResult[],
  sessionsPerNation = MULTI_NATION_SESSIONS_PER_NATION,
  weeksPlayed = CENTURY_PLAYTEST_WEEKS,
): MultiNationCenturyRun {
  const nationResults = nations.map((nation) => {
    const nationSessions = sessions.filter((session) => session.nationId === nation.id);
    const run = aggregateCenturySessions(nationSessions, weeksPlayed);
    return {
      nationId: nation.id,
      nationName: nation.shortName,
      sessionCount: nationSessions.length,
      expectedRoleCount: careerRoles.filter((role) => role.nationId === nation.id).length,
      aggregate: run.aggregate,
      findings: run.findings,
    };
  });
  const byNation = Object.fromEntries(nationResults.map((result) => {
    const aggregate = result.aggregate;
    const nationSessions = sessions.filter((session) => session.nationId === result.nationId);
    return [result.nationId, {
      name: result.nationName,
      sessions: result.sessionCount,
      roleCoverage: aggregate.roleCoverage,
      expectedRoleCount: result.expectedRoleCount,
      tierCoverage: aggregate.tierCoverage,
      branchCoverage: aggregate.branchCoverage,
      profileCoverage: aggregate.profileCoverage,
      reached2060Rate: aggregate.reached2060Rate,
      averageTransitionYear: round(LONG_HORIZON_START_YEAR + aggregate.averageWarYears),
      transitionArchetype: nationSessions[0]?.transitionArchetype ?? 'unknown',
      averageWarYears: aggregate.averageWarYears,
      averageNationYears: aggregate.averageNationYears,
      decisionsPerYear: aggregate.decisionsPerYear,
      warDecisionsPerYear: aggregate.warDecisionsPerYear,
      nationDecisionsPerYear: aggregate.nationDecisionsPerYear,
      averageNationAgendaDecisions: round(average(nationSessions.map((session) => session.nationAgendaDecisionCount))),
      interruptionsPerYear: aggregate.interruptionsPerYear,
      averageFinalNationalScore: round(average(nationSessions.map((session) => session.finalNationalScore))),
      averageFinalMandate: round(average(nationSessions.map((session) => session.finalMandateScore))),
      averageFinalUnrest: round(average(nationSessions.map((session) => session.finalUnrest))),
      averageFinalStructuralUnrestTarget: round(average(nationSessions.map((session) => session.finalStructuralUnrestTarget))),
      averageFinalStructuralUnrestFloor: round(average(nationSessions.map((session) => session.finalStructuralUnrestFloor))),
      coupSessionRate: aggregate.coupSessionRate,
      averageCoupAttempts: aggregate.averageCoupAttempts,
      averageSuccessfulRuptures: round(average(nationSessions.map((session) => session.coupSuccesses))),
      successfulCoupSessionRate: aggregate.successfulCoupSessionRate,
      crisisIncidentsByKind: nationSessions.reduce<Record<string, number>>((counts, session) => {
        Object.entries(session.crisisIncidentsByKind ?? {}).forEach(([kind, count]) => {
          counts[kind] = (counts[kind] ?? 0) + count;
        });
        return counts;
      }, {}),
      outbreakSessionRate: aggregate.outbreakSessionRate,
      averageHistoricalCouncilCoverage: aggregate.averageHistoricalCouncilCoverage,
      uniqueWorldlineCodes: aggregate.uniqueWorldlineCodes,
      uniqueEndings: aggregate.uniqueEndings,
      endingCollisionRate: aggregate.endingCollisionRate,
    }];
  })) as MultiNationCenturyAggregate['byNation'];
  const values = Object.values(byNation);
  const aggregate: MultiNationCenturyAggregate = {
    nationCount: nations.length,
    sessionsPerNation,
    totalSessions: sessions.length,
    weeksPerSession: weeksPlayed,
    totalWeeks: sessions.reduce((sum, session) => sum + session.weeksPlayed, 0),
    reached2060Rate: rate(sessions.filter((session) => session.endYear >= MULTI_NATION_CENTURY_END_YEAR).length, sessions.length),
    roleCoverage: new Set(sessions.map((session) => session.roleId)).size,
    expectedRoleCoverage: careerRoles.length,
    tierCoverage: new Set(sessions.map((session) => session.roleTier)).size,
    branchCoverage: new Set(sessions.map((session) => session.roleBranch)).size,
    profileCoverage: new Set(sessions.map((session) => session.profile)).size,
    averageWarYears: round(average(values.map((value) => value.averageWarYears))),
    averageNationYears: round(average(values.map((value) => value.averageNationYears))),
    averageFinalNationalScore: round(average(values.map((value) => value.averageFinalNationalScore))),
    averageFinalMandate: round(average(values.map((value) => value.averageFinalMandate))),
    averageFinalUnrest: round(average(values.map((value) => value.averageFinalUnrest))),
    averageFinalStructuralUnrestTarget: round(average(values.map((value) => value.averageFinalStructuralUnrestTarget))),
    averageNationAgendaDecisions: round(average(values.map((value) => value.averageNationAgendaDecisions))),
    transitionYearSpread: spread(values.map((value) => value.averageTransitionYear)),
    transitionArchetypeCoverage: new Set(values.map((value) => value.transitionArchetype)).size,
    nationalScoreSpread: spread(values.map((value) => value.averageFinalNationalScore)),
    mandateSpread: spread(values.map((value) => value.averageFinalMandate)),
    unrestSpread: spread(values.map((value) => value.averageFinalUnrest)),
    coupSessionRateSpread: spread(values.map((value) => value.coupSessionRate)),
    averageCoupAttempts: round(average(values.map((value) => value.averageCoupAttempts))),
    coupAttemptsSpread: spread(values.map((value) => value.averageCoupAttempts)),
    decisionsPerYearSpread: spread(values.map((value) => value.decisionsPerYear)),
    warDecisionsPerYearSpread: spread(values.map((value) => value.warDecisionsPerYear)),
    nationDecisionsPerYearSpread: spread(values.map((value) => value.nationDecisionsPerYear)),
    averageSuccessfulRuptures: round(average(values.map((value) => value.averageSuccessfulRuptures))),
    averageEndingCollisionRate: round(average(values.map((value) => value.endingCollisionRate))),
    uniqueEndingsTotal: values.reduce((sum, value) => sum + value.uniqueEndings, 0),
    byNation,
  };
  return {
    generatedAt: new Date().toISOString(),
    methodology: `${nations.length} playable nations × ${sessionsPerNation} deterministic careers from ${LONG_HORIZON_START_YEAR} to ${MULTI_NATION_CENTURY_END_YEAR}; ${sessions.length.toLocaleString('en-US')} sessions and ${aggregate.totalWeeks.toLocaleString('en-US')} weekly state transitions across every available role, five ranks, three branches and ${profiles.length} behavior profiles.`,
    aggregate,
    nations: nationResults,
    findings: buildCrossNationFindings(aggregate),
  };
}

export function runMultiNationCenturyPlaytest(
  sessionsPerNation = MULTI_NATION_SESSIONS_PER_NATION,
  weeksPlayed = CENTURY_PLAYTEST_WEEKS,
) {
  const sessions = nations.flatMap((nation) => Array.from(
    { length: sessionsPerNation },
    (_, scenarioId) => runNationCenturySession(nation.id, scenarioId, weeksPlayed),
  ));
  return {
    sessions,
    run: aggregateMultiNationCenturySessions(sessions, sessionsPerNation, weeksPlayed),
  };
}
