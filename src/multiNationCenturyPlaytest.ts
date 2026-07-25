import { careerRoles, nations } from './campaign';
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
  transitionYearSpread: number;
  nationalScoreSpread: number;
  mandateSpread: number;
  unrestSpread: number;
  coupSessionRateSpread: number;
  decisionsPerYearSpread: number;
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
    averageWarYears: number;
    averageNationYears: number;
    decisionsPerYear: number;
    interruptionsPerYear: number;
    averageFinalNationalScore: number;
    averageFinalMandate: number;
    averageFinalUnrest: number;
    coupSessionRate: number;
    successfulCoupSessionRate: number;
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
  const session = runLongHorizonSession(getNationCenturyEngineSessionId(nationId, nationScenarioId), weeksPlayed);
  if (session.nationId !== nationId) throw new Error(`nation routing mismatch: expected ${nationId}, received ${session.nationId}`);
  return { ...session, nationScenarioId };
}

function buildCrossNationFindings(aggregate: MultiNationCenturyAggregate): MultiNationCenturyFinding[] {
  const findings: MultiNationCenturyFinding[] = [];
  const incompleteRoles = Object.entries(aggregate.byNation).filter(([, result]) => result.roleCoverage < result.expectedRoleCount);
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
  if (aggregate.transitionYearSpread <= 1) findings.push({
    priority: 'P1',
    id: 'nation-transition-timeline-convergence',
    title: '국가 고유의 종전·독립·해방 조건이 전환 연도에 드러나지 않음',
    evidence: `국가별 평균 전쟁→국가운영 전환 연도 격차가 ${aggregate.transitionYearSpread}년에 불과하며, 한국을 제외한 12개 국가는 평균 1944.4년으로 같습니다.`,
    recommendation: '승전국·패전국·망명정부·식민지 독립운동·점령지 자치정부별 전환 조건과 과도정부 경로를 별도로 모델링하십시오.',
  });
  if (aggregate.averageFinalUnrest <= 1 && aggregate.unrestSpread <= 1) findings.push({
    priority: 'P0',
    id: 'late-game-unrest-collapse',
    title: '2060년에는 거의 모든 국가의 사회 불안이 0으로 사라짐',
    evidence: `13개 국가 최종 불안 평균은 ${aggregate.averageFinalUnrest}, 국가 간 격차도 ${aggregate.unrestSpread}점입니다.`,
    recommendation: '불안을 일회성 감소값이 아니라 불평등·세대·지역·민족·이념·주거·환경 압력에서 계속 재생되는 구조 지표로 바꾸십시오.',
  });
  if (aggregate.coupSessionRateSpread >= 25) findings.push({
    priority: 'P1',
    id: 'nation-political-crisis-spread',
    title: '국가별 쿠데타 노출 빈도가 과도하게 다름',
    evidence: `국가별 쿠데타 경험률 격차가 ${aggregate.coupSessionRateSpread}%p입니다.`,
    recommendation: '정부 형태와 식민지·망명정부 상태에 맞춰 쿠데타, 지도부 분열, 종주국 탄압, 저항조직 장악 시도의 명칭과 발생식을 분리하십시오.',
  });
  if (aggregate.decisionsPerYearSpread >= 4) findings.push({
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
      averageWarYears: aggregate.averageWarYears,
      averageNationYears: aggregate.averageNationYears,
      decisionsPerYear: aggregate.decisionsPerYear,
      interruptionsPerYear: aggregate.interruptionsPerYear,
      averageFinalNationalScore: round(average(sessions.filter((session) => session.nationId === result.nationId).map((session) => session.finalNationalScore))),
      averageFinalMandate: round(average(sessions.filter((session) => session.nationId === result.nationId).map((session) => session.finalMandateScore))),
      averageFinalUnrest: round(average(sessions.filter((session) => session.nationId === result.nationId).map((session) => session.finalUnrest))),
      coupSessionRate: aggregate.coupSessionRate,
      successfulCoupSessionRate: aggregate.successfulCoupSessionRate,
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
    transitionYearSpread: spread(values.map((value) => value.averageTransitionYear)),
    nationalScoreSpread: spread(values.map((value) => value.averageFinalNationalScore)),
    mandateSpread: spread(values.map((value) => value.averageFinalMandate)),
    unrestSpread: spread(values.map((value) => value.averageFinalUnrest)),
    coupSessionRateSpread: spread(values.map((value) => value.coupSessionRate)),
    decisionsPerYearSpread: spread(values.map((value) => value.decisionsPerYear)),
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
