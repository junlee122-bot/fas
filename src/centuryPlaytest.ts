import {
  LONG_HORIZON_START_YEAR,
  runLongHorizonSession,
  type LongHorizonEraMetric,
  type LongHorizonProfile,
  type LongHorizonSessionResult,
} from './longHorizonPlaytest';

export const CENTURY_PLAYTEST_END_YEAR = 2060;
export const CENTURY_PLAYTEST_SESSION_COUNT = 700;
export const CENTURY_PLAYTEST_WEEKS = (CENTURY_PLAYTEST_END_YEAR - LONG_HORIZON_START_YEAR) * 52;

export interface CenturyEraAggregate {
  era: string;
  startYear: number;
  endYear: number;
  weeks: number;
  promptsPerWeek: number;
  urgentWeekRate: number;
  quietWeekRate: number;
  decisionsPerYear: number;
  interruptionsPerYear: number;
  battlesPerYear: number;
  strategicOperationsPerYear: number;
  flashpointsPerDecade: number;
  electionsPerDecade: number;
  coupsPerDecade: number;
  outbreaksPerDecade: number;
  researchActiveWeekRate: number;
  inflationWarningWeekRate: number;
  nationalScoreCeilingWeekRate: number;
  averageInflation: number;
  averageNationalScore: number;
  averageEnemyPressure: number;
}

export interface CenturyFinding {
  priority: 'P0' | 'P1' | 'P2';
  id: string;
  title: string;
  evidence: string;
  funImpact: string;
  recommendation: string;
}

export interface CenturyOutlier {
  id: number;
  nationId: string;
  roleId: string;
  profile: LongHorizonProfile;
  frictionScore: number;
  urgentWeekRate: number;
  interruptionsPerYear: number;
  longestRepeatedActionWeeks: number;
  researchDroughtYears: number;
  flashpointDroughtYears: number;
  reasons: string[];
}

export interface CenturyAggregate {
  sessionCount: number;
  weeksPerSession: number;
  totalWeeks: number;
  reached2060Rate: number;
  nationCoverage: number;
  roleCoverage: number;
  tierCoverage: number;
  branchCoverage: number;
  profileCoverage: number;
  averageWarYears: number;
  averageNationYears: number;
  warPhaseShare: number;
  averageBattles: number;
  averageBattleWinRate: number;
  averageStrategicOperations: number;
  promptsPerWeek: number;
  urgentWeekRate: number;
  quietWeekRate: number;
  decisionWeeksRate: number;
  decisionsPerYear: number;
  interruptionsPerYear: number;
  promptToDecisionRatio: number;
  medianResearchCompleteYear: number | null;
  medianResearchDroughtYears: number;
  researchActiveWeekRate: number;
  averageFinalResearchCompleted: number;
  averageLastFlashpointYear: number | null;
  averageFlashpointDroughtYears: number;
  averageFlashpoints: number;
  averageHistoricalCouncilCoverage: number;
  inflationWarningWeekRate: number;
  hyperinflationSessionRate: number;
  treasuryZeroSessionRate: number;
  nationalScoreCeilingSessionRate: number;
  averageNationalScoreCeilingYears: number;
  excessivePoliticalPowerSessionRate: number;
  zeroEnemyPressureSessionRate: number;
  coupSessionRate: number;
  successfulCoupSessionRate: number;
  averageCoupAttempts: number;
  outbreakSessionRate: number;
  averageOutbreaks: number;
  averageYearsBetweenOutbreaks: number | null;
  averageElections: number;
  averageElectionActionsPerElection: number;
  averageStaffFrozenYears: number;
  missedPostwarCandidateSessionRate: number;
  uniqueWorldlineCodes: number;
  uniqueEndings: number;
  uniqueChoiceSignatures: number;
  endingCollisionRate: number;
  mostCommonEndingShare: number;
  topRepeatedActions: Array<{ id: string; sessions: number; longestRunWeeksTotal: number; averageLongestRunWeeks: number }>;
  eraTimeline: CenturyEraAggregate[];
  byProfile: Record<LongHorizonProfile, {
    sessions: number;
    urgentWeekRate: number;
    quietWeekRate: number;
    decisionsPerYear: number;
    averageFinalInflation: number;
    averageFinalNationalScore: number;
    averageFinalUnrest: number;
    averageFlashpointDroughtYears: number;
    uniqueEndings: number;
  }>;
  outliers: CenturyOutlier[];
}

export interface CenturyPlaytestRun {
  generatedAt: string;
  methodology: string;
  sessions: LongHorizonSessionResult[];
  aggregate: CenturyAggregate;
  findings: CenturyFinding[];
}

const profiles: LongHorizonProfile[] = ['guided', 'rushed', 'military', 'state-builder', 'completionist', 'opportunist'];
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const rate = (numerator: number, denominator: number) => round(numerator / Math.max(1, denominator) * 100);

function percentile(values: number[], fraction: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function mergeEraMetrics(sessions: LongHorizonSessionResult[]): CenturyEraAggregate[] {
  const merged = new Map<string, LongHorizonEraMetric>();
  sessions.flatMap((session) => session.eraMetrics ?? []).forEach((metric) => {
    const current = merged.get(metric.era) ?? { ...metric, weeks: 0, actionPrompts: 0, urgentWeeks: 0, quietWeeks: 0, decisions: 0, interruptions: 0, battles: 0, strategicOperations: 0, flashpoints: 0, elections: 0, coupAttempts: 0, outbreaks: 0, researchActiveWeeks: 0, inflationWarningWeeks: 0, nationalScoreCeilingWeeks: 0, inflationTotal: 0, nationalScoreTotal: 0, enemyPressureTotal: 0 };
    (Object.keys(metric) as Array<keyof LongHorizonEraMetric>).forEach((key) => {
      if (typeof metric[key] === 'number' && !['startYear', 'endYear'].includes(key)) (current[key] as number) += metric[key] as number;
    });
    merged.set(metric.era, current);
  });
  return [...merged.values()].sort((left, right) => left.startYear - right.startYear).map((metric) => {
    const years = metric.weeks / 52;
    return {
      era: metric.era,
      startYear: metric.startYear,
      endYear: metric.endYear,
      weeks: metric.weeks,
      promptsPerWeek: round(metric.actionPrompts / Math.max(1, metric.weeks), 2),
      urgentWeekRate: rate(metric.urgentWeeks, metric.weeks),
      quietWeekRate: rate(metric.quietWeeks, metric.weeks),
      decisionsPerYear: round(metric.decisions / Math.max(1, years), 1),
      interruptionsPerYear: round(metric.interruptions / Math.max(1, years), 1),
      battlesPerYear: round(metric.battles / Math.max(1, years), 1),
      strategicOperationsPerYear: round((metric.strategicOperations ?? 0) / Math.max(1, years), 1),
      flashpointsPerDecade: round(metric.flashpoints / Math.max(1, years) * 10, 1),
      electionsPerDecade: round(metric.elections / Math.max(1, years) * 10, 1),
      coupsPerDecade: round(metric.coupAttempts / Math.max(1, years) * 10, 1),
      outbreaksPerDecade: round(metric.outbreaks / Math.max(1, years) * 10, 1),
      researchActiveWeekRate: rate(metric.researchActiveWeeks, metric.weeks),
      inflationWarningWeekRate: rate(metric.inflationWarningWeeks, metric.weeks),
      nationalScoreCeilingWeekRate: rate(metric.nationalScoreCeilingWeeks, metric.weeks),
      averageInflation: round(metric.inflationTotal / Math.max(1, metric.weeks)),
      averageNationalScore: round(metric.nationalScoreTotal / Math.max(1, metric.weeks)),
      averageEnemyPressure: round(metric.enemyPressureTotal / Math.max(1, metric.weeks)),
    };
  });
}

function buildOutliers(sessions: LongHorizonSessionResult[]): CenturyOutlier[] {
  return sessions.map((session) => {
    const years = session.weeksPlayed / 52;
    const urgentWeekRate = rate(session.urgentPromptWeeks, session.weeksPlayed);
    const interruptionsPerYear = round(session.interruptionCount / Math.max(1, years), 1);
    const longestRepeatedActionWeeks = Math.max(0, ...Object.values(session.repeatedActionRuns));
    const researchDroughtYears = round((session.researchLongestIdleRun ?? session.researchIdleWeeks) / 52, 1);
    const reasons = [
      urgentWeekRate >= 30 ? `긴급 상태 ${urgentWeekRate}%` : '',
      session.flashpointDroughtYears >= 30 ? `세계사 공백 ${session.flashpointDroughtYears}년` : '',
      researchDroughtYears >= 30 ? `연구 공백 ${researchDroughtYears}년` : '',
      session.nationalScoreCeilingWeeks >= 520 ? `국가점수 상한 ${round(session.nationalScoreCeilingWeeks / 52, 1)}년` : '',
      longestRepeatedActionWeeks >= 104 ? `동일 행동 ${longestRepeatedActionWeeks}주 연속` : '',
    ].filter(Boolean);
    const frictionScore = round(urgentWeekRate * .8 + interruptionsPerYear * 1.8 + Math.min(40, longestRepeatedActionWeeks / 13) + Math.min(40, researchDroughtYears * .35) + Math.min(30, session.flashpointDroughtYears * .4));
    return { id: session.id, nationId: session.nationId, roleId: session.roleId, profile: session.profile, frictionScore, urgentWeekRate, interruptionsPerYear, longestRepeatedActionWeeks, researchDroughtYears, flashpointDroughtYears: session.flashpointDroughtYears, reasons };
  }).sort((left, right) => right.frictionScore - left.frictionScore).slice(0, 20);
}

function buildFindings(aggregate: CenturyAggregate): CenturyFinding[] {
  const lateEra = aggregate.eraTimeline.find((era) => era.startYear === 2050) ?? aggregate.eraTimeline.at(-1);
  const earlyEra = aggregate.eraTimeline[0];
  const profileScores = Object.values(aggregate.byProfile).map((profile) => profile.averageFinalNationalScore);
  const profileSpread = Math.max(...profileScores) - Math.min(...profileScores);
  const repeat = aggregate.topRepeatedActions[0];
  const futureContentSustained = (lateEra?.researchActiveWeekRate ?? 0) >= 50 && (lateEra?.flashpointsPerDecade ?? 0) >= 2;
  const lateAgencySustained = (lateEra?.decisionsPerYear ?? 0) >= 4;
  const alertsControlled = aggregate.urgentWeekRate < 25 && (repeat?.averageLongestRunWeeks ?? 0) < 26;
  const saturationControlled = (lateEra?.nationalScoreCeilingWeekRate ?? 0) < 5 && aggregate.nationalScoreCeilingSessionRate < 10;
  return [
    {
      priority: futureContentSustained ? 'P2' : 'P0', id: 'post-2020-content-void', title: futureContentSustained ? '개선됨 · 연구와 세계사 분기가 2060년까지 이어집니다' : '2020년 이후 연구와 세계사 콘텐츠가 사실상 종료됩니다',
      evidence: `연구 공백 중앙값은 ${aggregate.medianResearchDroughtYears.toFixed(1)}년, 마지막 세계 위기 뒤 공백은 평균 ${aggregate.averageFlashpointDroughtYears.toFixed(1)}년입니다. ${lateEra?.era ?? '후기 시대'} 연구 활성 주차는 ${lateEra?.researchActiveWeekRate.toFixed(1) ?? 0}%, 세계 위기는 10년당 ${lateEra?.flashpointsPerDecade.toFixed(1) ?? 0}건입니다.`,
      funImpact: '2060년까지 이어지는 캠페인에서 미래를 기다릴 이유가 사라지고 다음 주 버튼만 반복하게 됩니다.',
      recommendation: '2021–2060 연구 세대와 기후·AI·우주·인구·에너지·신냉전 사건군을 추가하고, 세계 상태에서 후속 위기를 합성하는 감독기를 두십시오.',
    },
    {
      priority: (lateEra?.strategicOperationsPerYear ?? 0) < .5 ? 'P0' : 'P2', id: 'strategic-mode-collapse', title: (lateEra?.strategicOperationsPerYear ?? 0) < .5 ? '전쟁 경력은 초반에 끝나고 장기 캠페인이 단일 국가운영 모드로 수렴합니다' : '평시 전략작전이 직무 정체성을 유지하지만 작전군 다양성은 계속 검증해야 합니다',
      evidence: `평균 전쟁 단계는 ${aggregate.averageWarYears.toFixed(1)}년, 국가운영은 ${aggregate.averageNationYears.toFixed(1)}년입니다. ${earlyEra?.era ?? '초기'} 연간 전투 ${earlyEra?.battlesPerYear.toFixed(1) ?? 0}회, 후기 전투 ${lateEra?.battlesPerYear.toFixed(1) ?? 0}회, 후기 평시 전략작전 ${lateEra?.strategicOperationsPerYear.toFixed(1) ?? 0}회입니다.`,
      funImpact: '군사·정보 직무로 시작해도 장기적으로 같은 내정 루프를 수행해 역할 판타지와 재플레이 차이가 약해집니다.',
      recommendation: '냉전·지역전·평화유지·비밀전·군비경쟁을 국가운영 단계 안의 상시 작전 모드로 만들고 직무별 전용 주간 행동을 유지하십시오.',
    },
    {
      priority: lateAgencySustained ? 'P2' : 'P0', id: 'century-agency-dilution', title: lateAgencySustained ? '개선됨 · 장기 계획과 전략작전이 후기 결정 밀도를 유지합니다' : '118년 동안 실질 결정 밀도가 낮아져 시간 진행이 플레이를 대체합니다',
      evidence: `전체 결정 주차 비중은 ${aggregate.decisionWeeksRate.toFixed(1)}%, 연간 결정은 ${aggregate.decisionsPerYear.toFixed(1)}회이며 프롬프트 ${aggregate.promptToDecisionRatio.toFixed(1)}개당 실질 결정 1회입니다. 후기 연간 결정은 ${lateEra?.decisionsPerYear.toFixed(1) ?? 0}회입니다.`,
      funImpact: '선택의 결과를 기다리는 시간보다 의미 없는 주간 반복이 길어져 플레이어가 장기 목표를 잊게 됩니다.',
      recommendation: '평시에는 월 단위 진행을 기본으로 하고 사건·전쟁 때만 주 단위로 확대하며, 1·5·10년 국가계획과 중간 검증 지점을 제공하십시오.',
    },
    {
      priority: alertsControlled ? 'P2' : aggregate.urgentWeekRate >= 25 || (repeat?.averageLongestRunWeeks ?? 0) >= 52 ? 'P0' : 'P1', id: 'alert-repetition', title: alertsControlled ? '개선됨 · 반복 경고가 검증 대기와 장기 과제로 전환됩니다' : '반복 경고가 장기 과제로 전환되지 않아 주의력을 소모합니다',
      evidence: `긴급 상태 주차 ${aggregate.urgentWeekRate.toFixed(1)}%, 연간 중단 ${aggregate.interruptionsPerYear.toFixed(1)}회입니다.${repeat ? ` 최장 반복 행동은 ${repeat.id}로 해당 세션에서 평균 ${repeat.averageLongestRunWeeks.toFixed(1)}주 연속 노출됐습니다.` : ''}`,
      funImpact: '경고를 읽고 판단하기보다 무시하거나 기계적으로 같은 조치를 누르는 습관을 만듭니다.',
      recommendation: '반복 원인을 하나의 추적 카드로 승격하고 다음 확인 시점까지 숨기며, 자동 위임·조건부 대응 규칙을 제공하십시오.',
    },
    {
      priority: saturationControlled ? 'P2' : (lateEra?.nationalScoreCeilingWeekRate ?? 0) >= 20 ? 'P0' : 'P1', id: 'late-game-saturation', title: saturationControlled ? '개선됨 · 상대 경쟁력과 구조 비용이 국가점수 포화를 억제합니다' : '후기 국가 지표가 상한이나 균형점에 고착됩니다',
      evidence: `${lateEra?.era ?? '후기'} 국가점수 상한 주차 ${lateEra?.nationalScoreCeilingWeekRate.toFixed(1) ?? 0}%, 평균 국가점수 ${lateEra?.averageNationalScore.toFixed(1) ?? 0}, 평균 외부압력 ${lateEra?.averageEnemyPressure.toFixed(1) ?? 0}입니다. 전체 세션 중 국가점수 상한 경험은 ${aggregate.nationalScoreCeilingSessionRate.toFixed(1)}%입니다.`,
      funImpact: '성공한 국가가 더 이상 새로운 위험이나 선택 비용을 만나지 않아 최적화와 성장의 의미가 사라집니다.',
      recommendation: '절대 상한 대신 시대별 상대 경쟁력, 인구구조·환경비용·패권 유지비·제도 노후화를 적용하십시오.',
    },
    {
      priority: aggregate.endingCollisionRate >= 60 ? 'P1' : 'P2', id: 'ending-collision', title: aggregate.endingCollisionRate < 10 ? '개선됨 · 직무·계획·후기 결정이 결말 정체성에 남습니다' : `${aggregate.sessionCount}개의 가능세계가 제한된 결말 조합으로 충돌합니다`,
      evidence: `고유 세계선 ${aggregate.uniqueWorldlineCodes}개, 선택 서명 ${aggregate.uniqueChoiceSignatures}개, 고유 결말 ${aggregate.uniqueEndings}개입니다. 결말 충돌률은 ${aggregate.endingCollisionRate.toFixed(1)}%, 최빈 결말 비중은 ${aggregate.mostCommonEndingShare.toFixed(1)}%입니다.`,
      funImpact: '서로 다른 국가·직무·성향으로 118년을 플레이해도 같은 결말 문구가 나오면 선택의 소유감이 약해집니다.',
      recommendation: '결말 ID와 서술에 국가·직무·지역질서·핵심 인물·후기 20년의 결정 연쇄를 포함하고 문장 중복률을 자동 검사하십시오.',
    },
    {
      priority: profileSpread >= 20 ? 'P1' : 'P2', id: 'profile-polarization', title: profileSpread < 10 ? '개선됨 · 행동 성향별 성과 격차가 역할극을 압도하지 않습니다' : '행동 성향에 따라 장기 성과와 마찰이 과도하게 벌어집니다',
      evidence: `행동 성향별 최종 국가점수 격차는 ${profileSpread.toFixed(1)}점입니다. 가장 높은 성향과 낮은 성향 사이에서 긴급 주차·불안·인플레이션도 함께 갈라집니다.`,
      funImpact: '일부 플레이 방식만 사실상의 정답이 되면 역할극과 대체역사 실험이 벌점처럼 느껴집니다.',
      recommendation: '각 성향에 다른 승리 조건과 회복 수단을 주고, 위험한 선택에도 독자적 보상·서사·단기 우위를 배정하십시오.',
    },
    {
      priority: aggregate.averageElectionActionsPerElection >= 10 ? 'P1' : 'P2', id: 'election-loop-repetition', title: aggregate.averageElectionActionsPerElection < 6 ? '개선됨 · 시대별 선거 문법과 감소효율이 반복 클릭을 억제합니다' : '장기 선거가 동일 캠페인 행동의 반복으로 변합니다',
      evidence: `세션당 평균 선거 ${aggregate.averageElections.toFixed(1)}회, 선거 1회당 캠페인 행동 ${aggregate.averageElectionActionsPerElection.toFixed(1)}회입니다.`,
      funImpact: '세대와 미디어 환경이 바뀌어도 같은 유세 행동을 반복하면 1940년대와 2050년대의 차이가 체감되지 않습니다.',
      recommendation: '시대별 미디어·정당·후보·지역 의제를 교체하고, 반복 클릭 대신 캠페인 전략과 예산 배분을 한 번에 예약하게 하십시오.',
    },
  ];
}

export function aggregateCenturySessions(sessions: LongHorizonSessionResult[], weeksPlayed = CENTURY_PLAYTEST_WEEKS): CenturyPlaytestRun {
  const totalWeeks = sessions.reduce((sum, session) => sum + session.weeksPlayed, 0);
  const years = totalWeeks / 52;
  const totalPrompts = sessions.reduce((sum, session) => sum + session.actionPrompts, 0);
  const totalDecisions = sessions.reduce((sum, session) => sum + session.decisionInteractions, 0);
  const totalBattles = sessions.reduce((sum, session) => sum + session.battleCount, 0);
  const totalStrategicOperations = sessions.reduce((sum, session) => sum + (session.strategicOperationCount ?? 0), 0);
  const totalElections = sessions.reduce((sum, session) => sum + session.electionCount, 0);
  const endingCounts = new Map<string, number>();
  sessions.forEach((session) => endingCounts.set(session.finalEndingId, (endingCounts.get(session.finalEndingId) ?? 0) + 1));
  const repeated = new Map<string, { sessions: number; total: number }>();
  sessions.forEach((session) => Object.entries(session.repeatedActionRuns).forEach(([id, longest]) => {
    if (longest < 2) return;
    const current = repeated.get(id) ?? { sessions: 0, total: 0 };
    current.sessions += 1;
    current.total += longest;
    repeated.set(id, current);
  }));
  const researchCompletionYears = sessions.flatMap((session) => session.researchCompleteWeek === null ? [] : [LONG_HORIZON_START_YEAR + Math.floor(session.researchCompleteWeek / 52)]);
  const eraTimeline = mergeEraMetrics(sessions);
  const byProfile = Object.fromEntries(profiles.map((profile) => {
    const matches = sessions.filter((session) => session.profile === profile);
    const profileWeeks = matches.reduce((sum, session) => sum + session.weeksPlayed, 0);
    return [profile, {
      sessions: matches.length,
      urgentWeekRate: rate(matches.reduce((sum, session) => sum + session.urgentPromptWeeks, 0), profileWeeks),
      quietWeekRate: rate(matches.reduce((sum, session) => sum + session.quietWeeks, 0), profileWeeks),
      decisionsPerYear: round(matches.reduce((sum, session) => sum + session.decisionInteractions, 0) / Math.max(1, profileWeeks / 52), 1),
      averageFinalInflation: round(average(matches.map((session) => session.finalInflation))),
      averageFinalNationalScore: round(average(matches.map((session) => session.finalNationalScore))),
      averageFinalUnrest: round(average(matches.map((session) => session.finalUnrest))),
      averageFlashpointDroughtYears: round(average(matches.map((session) => session.flashpointDroughtYears))),
      uniqueEndings: new Set(matches.map((session) => session.finalEndingId)).size,
    }];
  })) as CenturyAggregate['byProfile'];
  const aggregate: CenturyAggregate = {
    sessionCount: sessions.length,
    weeksPerSession: weeksPlayed,
    totalWeeks,
    reached2060Rate: rate(sessions.filter((session) => session.endYear >= CENTURY_PLAYTEST_END_YEAR).length, sessions.length),
    nationCoverage: new Set(sessions.map((session) => session.nationId)).size,
    roleCoverage: new Set(sessions.map((session) => session.roleId)).size,
    tierCoverage: new Set(sessions.map((session) => session.roleTier)).size,
    branchCoverage: new Set(sessions.map((session) => session.roleBranch)).size,
    profileCoverage: new Set(sessions.map((session) => session.profile)).size,
    averageWarYears: round(average(sessions.map((session) => session.warWeeks / 52))),
    averageNationYears: round(average(sessions.map((session) => session.nationWeeks / 52))),
    warPhaseShare: rate(sessions.reduce((sum, session) => sum + session.warWeeks, 0), totalWeeks),
    averageBattles: round(average(sessions.map((session) => session.battleCount))),
    averageBattleWinRate: rate(sessions.reduce((sum, session) => sum + session.battleVictories, 0), totalBattles),
    averageStrategicOperations: round(totalStrategicOperations / Math.max(1, sessions.length)),
    promptsPerWeek: round(totalPrompts / Math.max(1, totalWeeks), 2),
    urgentWeekRate: rate(sessions.reduce((sum, session) => sum + session.urgentPromptWeeks, 0), totalWeeks),
    quietWeekRate: rate(sessions.reduce((sum, session) => sum + session.quietWeeks, 0), totalWeeks),
    decisionWeeksRate: rate(sessions.reduce((sum, session) => sum + session.decisionWeeks, 0), totalWeeks),
    decisionsPerYear: round(totalDecisions / Math.max(1, years), 1),
    interruptionsPerYear: round(sessions.reduce((sum, session) => sum + session.interruptionCount, 0) / Math.max(1, years), 1),
    promptToDecisionRatio: round(totalPrompts / Math.max(1, totalDecisions), 2),
    medianResearchCompleteYear: researchCompletionYears.length ? percentile(researchCompletionYears, .5) : null,
    medianResearchDroughtYears: round(percentile(sessions.map((session) => (session.researchLongestIdleRun ?? session.researchIdleWeeks) / 52), .5)),
    researchActiveWeekRate: rate(totalWeeks - sessions.reduce((sum, session) => sum + session.researchIdleWeeks, 0), totalWeeks),
    averageFinalResearchCompleted: round(average(sessions.map((session) => session.finalResearchCompleted))),
    averageLastFlashpointYear: sessions.some((session) => session.lastFlashpointYear !== null) ? round(average(sessions.flatMap((session) => session.lastFlashpointYear === null ? [] : [session.lastFlashpointYear]))) : null,
    averageFlashpointDroughtYears: round(average(sessions.map((session) => session.flashpointDroughtYears))),
    averageFlashpoints: round(average(sessions.map((session) => session.worldFlashpointCount))),
    averageHistoricalCouncilCoverage: round(average(sessions.map((session) => session.historicalCouncilEventsAvailable ? session.historicalCouncilEventsSeen / session.historicalCouncilEventsAvailable * 100 : 100))),
    inflationWarningWeekRate: rate(sessions.reduce((sum, session) => sum + session.inflationWarningWeeks, 0), totalWeeks),
    hyperinflationSessionRate: rate(sessions.filter((session) => session.hyperinflationWeeks > 0).length, sessions.length),
    treasuryZeroSessionRate: rate(sessions.filter((session) => session.treasuryZeroWeeks > 0).length, sessions.length),
    nationalScoreCeilingSessionRate: rate(sessions.filter((session) => session.nationalScoreCeilingWeeks > 0).length, sessions.length),
    averageNationalScoreCeilingYears: round(average(sessions.map((session) => session.nationalScoreCeilingWeeks / 52))),
    excessivePoliticalPowerSessionRate: rate(sessions.filter((session) => session.excessivePoliticalPowerWeeks > 0).length, sessions.length),
    zeroEnemyPressureSessionRate: rate(sessions.filter((session) => session.zeroEnemyPressureWeeks > 0).length, sessions.length),
    coupSessionRate: rate(sessions.filter((session) => session.coupAttempts > 0).length, sessions.length),
    successfulCoupSessionRate: rate(sessions.filter((session) => session.coupSuccesses > 0).length, sessions.length),
    averageCoupAttempts: round(average(sessions.map((session) => session.coupAttempts))),
    outbreakSessionRate: rate(sessions.filter((session) => session.outbreakCount > 0).length, sessions.length),
    averageOutbreaks: round(average(sessions.map((session) => session.outbreakCount))),
    averageYearsBetweenOutbreaks: sessions.some((session) => session.outbreakCount > 0) ? round(average(sessions.filter((session) => session.outbreakCount > 0).map((session) => session.weeksPlayed / 52 / session.outbreakCount)), 1) : null,
    averageElections: round(average(sessions.map((session) => session.electionCount))),
    averageElectionActionsPerElection: round(sessions.reduce((sum, session) => sum + session.electionCampaignActions, 0) / Math.max(1, totalElections)),
    averageStaffFrozenYears: round(average(sessions.map((session) => session.staffFrozenWeeks / 52))),
    missedPostwarCandidateSessionRate: rate(sessions.filter((session) => session.missedPostwarCandidateArrivals > 0).length, sessions.length),
    uniqueWorldlineCodes: new Set(sessions.map((session) => session.finalWorldlineCode)).size,
    uniqueEndings: endingCounts.size,
    uniqueChoiceSignatures: new Set(sessions.map((session) => session.worldChoiceSignature)).size,
    endingCollisionRate: rate(sessions.length - endingCounts.size, sessions.length),
    mostCommonEndingShare: rate(Math.max(0, ...endingCounts.values()), sessions.length),
    topRepeatedActions: [...repeated.entries()].map(([id, value]) => ({ id, sessions: value.sessions, longestRunWeeksTotal: value.total, averageLongestRunWeeks: round(value.total / value.sessions, 1) })).sort((left, right) => right.longestRunWeeksTotal - left.longestRunWeeksTotal).slice(0, 15),
    eraTimeline,
    byProfile,
    outliers: buildOutliers(sessions),
  };
  return {
    generatedAt: new Date().toISOString(),
    methodology: `${sessions.length} deterministic production-engine campaigns from 1942 to ${LONG_HORIZON_START_YEAR + weeksPlayed / 52}; ${totalWeeks.toLocaleString('en-US')} weekly state transitions across ${aggregate.nationCoverage} nations, ${aggregate.roleCoverage} roles and six behavior profiles.`,
    sessions,
    aggregate,
    findings: buildFindings(aggregate),
  };
}

export function runCenturyPlaytestMatrix(sessionCount = CENTURY_PLAYTEST_SESSION_COUNT, weeksPlayed = CENTURY_PLAYTEST_WEEKS): CenturyPlaytestRun {
  return aggregateCenturySessions(Array.from({ length: sessionCount }, (_, id) => runLongHorizonSession(id, weeksPlayed)), weeksPlayed);
}
