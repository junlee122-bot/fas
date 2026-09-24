import { careerRoles, nations } from './campaign';
import {
  aggregateCenturySessions,
  CENTURY_PLAYTEST_WEEKS,
  type CenturyEraAggregate,
} from './centuryPlaytest';
import {
  LONG_HORIZON_START_YEAR,
  runLongHorizonSession,
  type LongHorizonProfile,
  type LongHorizonSessionResult,
} from './longHorizonPlaytest';
import {
  classifyKoreaLiberationOutcome,
  koreaLiberationOutcomeLabels,
  type KoreaLiberationOutcome,
  type KoreaLiberationTrack,
} from './koreaExperience';

export const KOREA_CENTURY_PLAYTEST_END_YEAR = 2060;
export const KOREA_CENTURY_PLAYTEST_SESSION_COUNT = 500;

export interface KoreaCenturySessionResult extends LongHorizonSessionResult {
  koreaScenarioId: number;
}

export interface KoreaCenturyFinding {
  priority: 'P0' | 'P1' | 'P2';
  id: string;
  title: string;
  evidence: string;
  funImpact: string;
  recommendation: string;
}

export interface KoreaCenturySegment {
  sessions: number;
  eligibleTransitionRate: number;
  averageLiberationYear: number;
  averageLiberationScore: number;
  averagePartitionRisk: number;
  averageFinalNationalScore: number;
  averageFinalMandate: number;
  averageFinalUnrest: number;
  averageCoupAttempts: number;
  uniqueEndings: number;
}

export interface KoreaCenturyAggregate {
  sessionCount: number;
  weeksPerSession: number;
  totalWeeks: number;
  reached2060Rate: number;
  nationCoverage: number;
  roleCoverage: number;
  tierCoverage: number;
  branchCoverage: number;
  profileCoverage: number;
  averageLiberationYear: number;
  earliestLiberationYear: number;
  latestLiberationYear: number;
  eligibleTransitionRate: number;
  prematureTransitionRate: number;
  fixedTimerTransitionRate: number;
  forcedDeadlineRate: number;
  contestedTransitionRate: number;
  highPartitionRiskRate: number;
  averageLiberationScore: number;
  averagePartitionRisk: number;
  averageTrackScores: Record<KoreaLiberationTrack['id'], number>;
  blockedTrackCounts: Record<KoreaLiberationTrack['id'], number>;
  liberationOutcomes: Record<KoreaLiberationOutcome, number>;
  averageWarYears: number;
  averageNationYears: number;
  averageFinalNationalScore: number;
  averageFinalMandate: number;
  averageFinalUnrest: number;
  coupSessionRate: number;
  successfulCoupSessionRate: number;
  averageCoupAttempts: number;
  averageElections: number;
  outbreakSessionRate: number;
  averageHistoricalCouncilCoverage: number;
  uniqueWorldlineCodes: number;
  uniqueEndings: number;
  endingCollisionRate: number;
  mostCommonEndingShare: number;
  decisionsPerYear: number;
  urgentWeekRate: number;
  quietWeekRate: number;
  interruptionsPerYear: number;
  researchActiveWeekRate: number;
  averageFlashpointDroughtYears: number;
  eraTimeline: CenturyEraAggregate[];
  byProfile: Record<LongHorizonProfile, KoreaCenturySegment>;
  byBranch: Record<string, KoreaCenturySegment>;
  byRole: Record<string, KoreaCenturySegment>;
  worstSessions: Array<{
    koreaScenarioId: number;
    roleId: string;
    profile: LongHorizonProfile;
    score: number;
    reasons: string[];
  }>;
}

export interface KoreaCenturyPlaytestRun {
  generatedAt: string;
  methodology: string;
  sessions: KoreaCenturySessionResult[];
  aggregate: KoreaCenturyAggregate;
  findings: KoreaCenturyFinding[];
}

const profiles: LongHorizonProfile[] = ['guided', 'rushed', 'military', 'state-builder', 'completionist', 'opportunist'];
const koreaNationIndex = nations.findIndex((nation) => nation.id === 'korea');
const koreaRoleIds = careerRoles.filter((role) => role.nationId === 'korea').map((role) => role.id);
const trackIds: KoreaLiberationTrack['id'][] = ['recognition', 'network', 'force', 'return'];
const liberationOutcomes: KoreaLiberationOutcome[] = ['contested-transition', 'negotiated-return', 'coalition-government', 'armed-liberation', 'sovereign-return'];
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const rate = (numerator: number, denominator: number) => round(numerator / Math.max(1, denominator) * 100);

export function getKoreaCenturyEngineSessionId(koreaScenarioId: number) {
  return koreaNationIndex + nations.length * koreaScenarioId;
}

export function runKoreaCenturySession(
  koreaScenarioId: number,
  weeksPlayed = CENTURY_PLAYTEST_WEEKS,
): KoreaCenturySessionResult {
  return {
    ...runLongHorizonSession(getKoreaCenturyEngineSessionId(koreaScenarioId), weeksPlayed),
    koreaScenarioId,
  };
}

function segment(matches: KoreaCenturySessionResult[]): KoreaCenturySegment {
  const eligible = matches.filter((session) => session.koreaLiberationAtTransition?.eligible);
  return {
    sessions: matches.length,
    eligibleTransitionRate: rate(eligible.length, matches.length),
    averageLiberationYear: round(average(matches.map((session) => session.transitionYear))),
    averageLiberationScore: round(average(matches.map((session) => session.koreaLiberationAtTransition?.score ?? 0))),
    averagePartitionRisk: round(average(matches.map((session) => session.koreaLiberationAtTransition?.partitionRisk ?? 100))),
    averageFinalNationalScore: round(average(matches.map((session) => session.finalNationalScore))),
    averageFinalMandate: round(average(matches.map((session) => session.finalMandateScore))),
    averageFinalUnrest: round(average(matches.map((session) => session.finalUnrest))),
    averageCoupAttempts: round(average(matches.map((session) => session.coupAttempts))),
    uniqueEndings: new Set(matches.map((session) => session.finalEndingId)).size,
  };
}

function buildFindings(aggregate: KoreaCenturyAggregate): KoreaCenturyFinding[] {
  const findings: KoreaCenturyFinding[] = [];
  if (aggregate.fixedTimerTransitionRate > 0) {
    findings.push({
      priority: 'P0',
      id: 'scripted-liberation-transition',
      title: '해방 조건과 무관한 고정 주차 국가 전환',
      evidence: `${aggregate.fixedTimerTransitionRate}%가 네 해방 준비축 판정 대신 고정 주차에 국가 운영으로 넘어갔습니다.`,
      funImpact: '충칭에서 쌓은 승인·공작·광복군 선택보다 성향별 타이머가 건국 시점을 결정해 한국 캠페인의 핵심 목표가 무의미해집니다.',
      recommendation: '네 해방 준비축의 최소 조건을 전환 게이트로 사용하고, 준비가 부족하면 분할 위험·과도정부·추가 2년 준비 기간을 실제 결과로 연결하십시오.',
    });
  }
  if (aggregate.forcedDeadlineRate > 15) {
    findings.push({
      priority: 'P1',
      id: 'korea-safety-deadline-transition',
      title: '다섯 경력 중 하나는 준비 미완료 상태에서 국제 안전기한을 맞음',
      evidence: `${aggregate.forcedDeadlineRate}%가 추가 104주의 준비 기간 뒤에도 최소 조건을 충족하지 못해 과도정부로 전환됐으며, 기준 미달의 대부분은 국내정진 계획(${aggregate.blockedTrackCounts.return}회)이었습니다.`,
      funImpact: '아무 행동도 하지 않은 세계선에는 명확한 실패 결과가 필요하지만, 적극적으로 플레이한 사용자까지 국내정진 수치를 발견하지 못하면 불공정하게 느낄 수 있습니다.',
      recommendation: '국내정진 축이 50 미만이면 지도·정보·군사 화면의 관련 행동을 주간 브리핑 최우선 과제로 올리고 안전기한까지 남은 주차를 함께 표시하십시오.',
    });
  }
  if (aggregate.highPartitionRiskRate >= 20) {
    findings.push({
      priority: aggregate.highPartitionRiskRate >= 40 ? 'P0' : 'P1',
      id: 'partition-risk-without-agency',
      title: '분할 위험이 높아도 준비 행동과 전환 결과가 분리됨',
      evidence: `${aggregate.highPartitionRiskRate}%가 전환 시 분할 위험 55 이상이며 평균 위험은 ${aggregate.averagePartitionRisk}입니다. 국내정진 준비 평균은 ${aggregate.averageTrackScores.return}입니다.`,
      funImpact: '한반도 분단과 외세 점령이 플레이어의 승인·연락망·귀환 준비가 아닌 배경 설명처럼 느껴집니다.',
      recommendation: '분할 위험을 화면의 독립 지표로 공개하고 승인·국내망·광복군·귀환 계획의 조합이 점령구역·과도정부·통합정부를 바꾸게 하십시오.',
    });
  }
  const branchScores = Object.values(aggregate.byBranch).map((value) => value.eligibleTransitionRate);
  const branchSpread = Math.max(...branchScores) - Math.min(...branchScores);
  if (branchSpread >= 20) {
    findings.push({
      priority: 'P1',
      id: 'korea-role-path-imbalance',
      title: '정치·군사·정보 보직 사이 해방 성공 경로가 편중됨',
      evidence: `보직 계열별 준비 완료율 격차가 ${branchSpread.toFixed(1)}%p입니다. ${Object.entries(aggregate.byBranch).map(([branch, value]) => `${branch} ${value.eligibleTransitionRate}%`).join(' · ')}.`,
      funImpact: '낮은 직급이나 정보·군사 현장 보직을 고르면 대체역사 역할극이 아니라 불리한 난이도 선택으로 굳어질 수 있습니다.',
      recommendation: '정치는 승인, 군사는 광복군·귀환, 정보는 국내망·분할 억제에 고유 가속을 주되 네 축 모두 동맹·참모로 보완 가능하게 하십시오.',
    });
  }
  if (aggregate.endingCollisionRate >= 50) {
    findings.push({
      priority: 'P1',
      id: 'korea-ending-convergence',
      title: '500개 한국 세계선의 후기 결말이 과도하게 수렴',
      evidence: `고유 결말 ${aggregate.uniqueEndings}개, 고유 세계선 코드 ${aggregate.uniqueWorldlineCodes}개로 결말 충돌률은 ${aggregate.endingCollisionRate}%입니다.`,
      funImpact: '해방 방식·헌정 질서·분할 위험·냉전 노선이 달라도 2060년의 국가 정체성이 같은 문구로 끝날 수 있습니다.',
      recommendation: '해방 결과, 정부 형태, 서울 귀환 시점, 분단 여부, 냉전·산업화·민주화 선택을 한국 결말 서명과 에필로그에 포함하십시오.',
    });
  }
  if (aggregate.averageHistoricalCouncilCoverage < 95) {
    findings.push({
      priority: 'P1',
      id: 'korea-history-event-coverage',
      title: '한국 관련 역사 사건이 장기 세계선에서 누락됨',
      evidence: `국가별 역사 평의회 사건 체험률이 평균 ${aggregate.averageHistoricalCouncilCoverage}%입니다.`,
      funImpact: '임정 통합, 연합국 승인, 해방 행정, 헌정·선거·전쟁과 같은 한국사의 결정 지점이 공백으로 남습니다.',
      recommendation: '전시·해방 직전·귀환·건국·냉전·산업화·민주화·현대의 한국 사건군을 단계 조건과 함께 우선 배치하십시오.',
    });
  }
  if (findings.length === 0) {
    findings.push({
      priority: 'P2',
      id: 'korea-century-baseline-healthy',
      title: '한국 해방·건국·장기 국가 운영의 주요 마찰 임계치를 통과',
      evidence: `준비 완료 전환 ${aggregate.eligibleTransitionRate}%, 고분할 위험 ${aggregate.highPartitionRiskRate}%, 역사 사건 체험 ${aggregate.averageHistoricalCouncilCoverage}%입니다.`,
      funImpact: '직무와 준비 선택이 해방 결과와 2060년 국가 정체성에 계속 남습니다.',
      recommendation: '실제 사용자 플레이에서는 한국 전용 상황판의 문구·클릭 거리·전환 설명과 시대별 사건 체감을 계속 검증하십시오.',
    });
  }
  return findings;
}

export function aggregateKoreaCenturySessions(
  sessions: KoreaCenturySessionResult[],
  weeksPlayed = CENTURY_PLAYTEST_WEEKS,
): KoreaCenturyPlaytestRun {
  sessions = sessions.map((session) => {
    if (!session.koreaLiberationAtTransition) return session;
    const outcome = classifyKoreaLiberationOutcome(session.koreaLiberationAtTransition);
    return {
      ...session,
      koreaLiberationAtTransition: {
        ...session.koreaLiberationAtTransition,
        outcome,
        outcomeLabel: koreaLiberationOutcomeLabels[outcome],
      },
    };
  });
  const century = aggregateCenturySessions(sessions, weeksPlayed);
  const assessments = sessions.flatMap((session) => session.koreaLiberationAtTransition ? [session.koreaLiberationAtTransition] : []);
  const totalWeeks = sessions.reduce((sum, session) => sum + session.weeksPlayed, 0);
  const endingCounts = new Map<string, number>();
  sessions.forEach((session) => endingCounts.set(session.finalEndingId, (endingCounts.get(session.finalEndingId) ?? 0) + 1));
  const averageTrackScores = Object.fromEntries(trackIds.map((id) => [
    id,
    round(average(assessments.map((assessment) => assessment.tracks.find((track) => track.id === id)?.value ?? 0))),
  ])) as KoreaCenturyAggregate['averageTrackScores'];
  const blockedTrackCounts = Object.fromEntries(trackIds.map((id) => [
    id,
    assessments.filter((assessment) => assessment.blockedTrackIds.includes(id)).length,
  ])) as KoreaCenturyAggregate['blockedTrackCounts'];
  const outcomeCounts = Object.fromEntries(liberationOutcomes.map((outcome) => [
    outcome,
    assessments.filter((assessment) => assessment.outcome === outcome).length,
  ])) as KoreaCenturyAggregate['liberationOutcomes'];
  const byProfile = Object.fromEntries(profiles.map((profile) => [
    profile,
    segment(sessions.filter((session) => session.profile === profile)),
  ])) as KoreaCenturyAggregate['byProfile'];
  const branches = ['politics', 'military', 'intelligence'];
  const byBranch = Object.fromEntries(branches.map((branch) => [
    branch,
    segment(sessions.filter((session) => session.roleBranch === branch)),
  ]));
  const byRole = Object.fromEntries(koreaRoleIds.map((roleId) => [
    roleId,
    segment(sessions.filter((session) => session.roleId === roleId)),
  ]));
  const scoreSession = (session: KoreaCenturySessionResult) => {
    const assessment = session.koreaLiberationAtTransition;
    const reasons = [
      !assessment?.eligible ? '준비 미완료 전환' : '',
      (assessment?.partitionRisk ?? 100) >= 55 ? `분할 위험 ${assessment?.partitionRisk ?? 100}` : '',
      session.coupAttempts >= 8 ? `쿠데타 ${session.coupAttempts}회` : '',
      session.finalUnrest >= 65 ? `최종 불안 ${session.finalUnrest}` : '',
      session.flashpointDroughtYears >= 20 ? `세계사 공백 ${session.flashpointDroughtYears}년` : '',
    ].filter(Boolean);
    const score = (!assessment?.eligible ? 40 : 0)
      + Math.max(0, (assessment?.partitionRisk ?? 100) - 35)
      + Math.min(25, session.coupAttempts * 2)
      + Math.max(0, session.finalUnrest - 45) * 0.4
      + Math.min(20, session.flashpointDroughtYears * 0.5);
    return { koreaScenarioId: session.koreaScenarioId, roleId: session.roleId, profile: session.profile, score: round(score), reasons };
  };
  const aggregate: KoreaCenturyAggregate = {
    sessionCount: sessions.length,
    weeksPerSession: weeksPlayed,
    totalWeeks,
    reached2060Rate: rate(sessions.filter((session) => session.endYear >= KOREA_CENTURY_PLAYTEST_END_YEAR).length, sessions.length),
    nationCoverage: new Set(sessions.map((session) => session.nationId)).size,
    roleCoverage: new Set(sessions.map((session) => session.roleId)).size,
    tierCoverage: new Set(sessions.map((session) => session.roleTier)).size,
    branchCoverage: new Set(sessions.map((session) => session.roleBranch)).size,
    profileCoverage: new Set(sessions.map((session) => session.profile)).size,
    averageLiberationYear: round(average(sessions.map((session) => session.transitionYear))),
    earliestLiberationYear: Math.min(...sessions.map((session) => session.transitionYear)),
    latestLiberationYear: Math.max(...sessions.map((session) => session.transitionYear)),
    eligibleTransitionRate: rate(assessments.filter((assessment) => assessment.eligible).length, sessions.length),
    prematureTransitionRate: rate(assessments.filter((assessment) => !assessment.eligible).length, sessions.length),
    fixedTimerTransitionRate: rate(sessions.filter((session) => session.koreaTransitionMode === 'fixed-timer').length, sessions.length),
    forcedDeadlineRate: rate(sessions.filter((session) => session.koreaTransitionMode === 'deadline').length, sessions.length),
    contestedTransitionRate: rate(assessments.filter((assessment) => assessment.outcome === 'contested-transition').length, sessions.length),
    highPartitionRiskRate: rate(assessments.filter((assessment) => assessment.partitionRisk >= 55).length, sessions.length),
    averageLiberationScore: round(average(assessments.map((assessment) => assessment.score))),
    averagePartitionRisk: round(average(assessments.map((assessment) => assessment.partitionRisk))),
    averageTrackScores,
    blockedTrackCounts,
    liberationOutcomes: outcomeCounts,
    averageWarYears: century.aggregate.averageWarYears,
    averageNationYears: century.aggregate.averageNationYears,
    averageFinalNationalScore: round(average(sessions.map((session) => session.finalNationalScore))),
    averageFinalMandate: round(average(sessions.map((session) => session.finalMandateScore))),
    averageFinalUnrest: round(average(sessions.map((session) => session.finalUnrest))),
    coupSessionRate: century.aggregate.coupSessionRate,
    successfulCoupSessionRate: century.aggregate.successfulCoupSessionRate,
    averageCoupAttempts: century.aggregate.averageCoupAttempts,
    averageElections: century.aggregate.averageElections,
    outbreakSessionRate: century.aggregate.outbreakSessionRate,
    averageHistoricalCouncilCoverage: century.aggregate.averageHistoricalCouncilCoverage,
    uniqueWorldlineCodes: century.aggregate.uniqueWorldlineCodes,
    uniqueEndings: century.aggregate.uniqueEndings,
    endingCollisionRate: century.aggregate.endingCollisionRate,
    mostCommonEndingShare: century.aggregate.mostCommonEndingShare,
    decisionsPerYear: century.aggregate.decisionsPerYear,
    urgentWeekRate: century.aggregate.urgentWeekRate,
    quietWeekRate: century.aggregate.quietWeekRate,
    interruptionsPerYear: century.aggregate.interruptionsPerYear,
    researchActiveWeekRate: century.aggregate.researchActiveWeekRate,
    averageFlashpointDroughtYears: century.aggregate.averageFlashpointDroughtYears,
    eraTimeline: century.aggregate.eraTimeline,
    byProfile,
    byBranch,
    byRole,
    worstSessions: sessions.map(scoreSession).sort((left, right) => right.score - left.score).slice(0, 20),
  };
  return {
    generatedAt: new Date().toISOString(),
    methodology: `${sessions.length} deterministic Korea-only campaigns from ${LONG_HORIZON_START_YEAR} to ${KOREA_CENTURY_PLAYTEST_END_YEAR}; ${totalWeeks.toLocaleString('en-US')} weekly transitions across 13 Korean roles, five ranks, three branches and six behavior profiles.`,
    sessions,
    aggregate,
    findings: buildFindings(aggregate),
  };
}

export function runKoreaCenturyPlaytest(
  sessionCount = KOREA_CENTURY_PLAYTEST_SESSION_COUNT,
  weeksPlayed = CENTURY_PLAYTEST_WEEKS,
): KoreaCenturyPlaytestRun {
  return aggregateKoreaCenturySessions(
    Array.from({ length: sessionCount }, (_, koreaScenarioId) => runKoreaCenturySession(koreaScenarioId, weeksPlayed)),
    weeksPlayed,
  );
}
