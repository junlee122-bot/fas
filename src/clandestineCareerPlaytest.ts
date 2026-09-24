import { getCampaignYearForWeek } from './campaignCalendar';
import {
  advanceClandestineCareerWeek,
  createClandestineCareerState,
  respondToClandestineIncident,
  respondToClandestineMission,
  setClandestinePosture,
} from './clandestineCareer';
import type {
  ClandestineCareerState,
  ClandestineIncidentKind,
  ClandestineIncidentResponse,
  ClandestineMissionDomain,
  ClandestineMissionResponse,
  ClandestinePosture,
  ClandestineWeekContext,
} from './clandestineCareer';
import type { CareerArchetype, CareerBranch, CareerRole, GameState, NationId } from './types';

export const CLANDESTINE_PLAYTEST_START_YEAR = 1942;
export const CLANDESTINE_PLAYTEST_END_YEAR = 2060;
export const CLANDESTINE_PLAYTEST_SESSION_COUNT = 500;
export const CLANDESTINE_PLAYTEST_WEEKS = (CLANDESTINE_PLAYTEST_END_YEAR - CLANDESTINE_PLAYTEST_START_YEAR) * 52;

export type ClandestinePlaytestProfile =
  | 'home-loyalist'
  | 'foreign-asset'
  | 'survivor'
  | 'deceiver'
  | 'defector'
  | 'opportunist';

export interface ClandestinePlaytestEraMetric {
  era: string;
  startYear: number;
  endYear: number;
  weeks: number;
  activeWeeks: number;
  dormantWeeks: number;
  attentionWeeks: number;
  highExposureWeeks: number;
  highStressWeeks: number;
  missionsOffered: number;
  missionResponses: number;
  missionsResolved: number;
  missionsFailed: number;
  incidents: number;
  decisions: number;
}

export interface ClandestinePlaytestSession {
  id: number;
  profile: ClandestinePlaytestProfile;
  homeNationId: NationId;
  handlerNationId: NationId;
  roleId: string;
  roleBranch: CareerBranch;
  roleTier: number;
  weeksPlayed: number;
  activeWeeks: number;
  dormantWeeks: number;
  attentionWeeks: number;
  highExposureWeeks: number;
  highStressWeeks: number;
  missionsOffered: number;
  missionResponses: number;
  missionsResolved: number;
  missionsFailed: number;
  missionSuccessRate: number;
  uniqueMissionCodenames: number;
  uniqueMissionDomains: number;
  longestRepeatedCodenameRun: number;
  incidents: number;
  incidentKinds: Partial<Record<ClandestineIncidentKind, number>>;
  longestDecisionGapWeeks: number;
  finalStatus: ClandestineCareerState['status'];
  finalPosture: ClandestinePosture;
  finalExposure: number;
  finalCoverStrength: number;
  finalHandlerTrust: number;
  finalHomeTrust: number;
  finalStress: number;
  finalExtractionReadiness: number;
  completedMissions: number;
  genuineLeaks: number;
  deceptionReports: number;
  totalEarnings: number;
  controlledByHome: boolean;
  careerArcs: number;
  extractionTransitions: number;
  cutTieTransitions: number;
  longestDormantGapWeeks: number;
  closedWeek: number | null;
  closeReason: 'extracted' | 'cut-ties' | null;
  reached2060Active: boolean;
  responseCounts: Partial<Record<ClandestineMissionResponse, number>>;
  incidentResponseCounts: Partial<Record<ClandestineIncidentResponse, number>>;
  eraMetrics: ClandestinePlaytestEraMetric[];
  frictionReasons: string[];
}

export interface ClandestinePlaytestAggregate {
  sessionCount: number;
  weeksPerSession: number;
  totalWeeks: number;
  nationCoverage: number;
  handlerNationCoverage: number;
  roleCoverage: number;
  branchCoverage: number;
  tierCoverage: number;
  profileCoverage: number;
  activeAt2060Rate: number;
  closedCareerRate: number;
  extractionRate: number;
  cutTiesRate: number;
  controlledDoubleRate: number;
  averageCareerArcs: number;
  multiArcCareerRate: number;
  averageExtractionTransitions: number;
  averageCutTieTransitions: number;
  averageActiveYears: number;
  averageDormantYears: number;
  averageMissions: number;
  missionSuccessRate: number;
  averageUniqueMissionCodenames: number;
  averageUniqueMissionDomains: number;
  averageLongestRepeatedCodenameRun: number;
  averageIncidents: number;
  incidentsPerDecade: number;
  attentionWeekRate: number;
  highExposureWeekRate: number;
  highStressWeekRate: number;
  averageLongestDecisionGapWeeks: number;
  excessiveInterruptionSessionRate: number;
  repetitiveMissionSessionRate: number;
  dormantDecadesSessionRate: number;
  byProfile: Record<ClandestinePlaytestProfile, {
    sessions: number;
    activeAt2060Rate: number;
    averageActiveYears: number;
    averageMissions: number;
    missionSuccessRate: number;
    incidentsPerDecade: number;
    attentionWeekRate: number;
    averageFinalExposure: number;
    averageFinalStress: number;
  }>;
  eraTimeline: Array<{
    era: string;
    startYear: number;
    endYear: number;
    activeCareerRate: number;
    attentionWeekRate: number;
    highExposureWeekRate: number;
    highStressWeekRate: number;
    missionsPerActiveYear: number;
    missionSuccessRate: number;
    incidentsPerActiveDecade: number;
    decisionsPerActiveYear: number;
  }>;
  responseDistribution: Partial<Record<ClandestineMissionResponse, number>>;
  incidentResponseDistribution: Partial<Record<ClandestineIncidentResponse, number>>;
  incidentKindDistribution: Partial<Record<ClandestineIncidentKind, number>>;
  worstSessions: Array<{
    id: number;
    profile: ClandestinePlaytestProfile;
    homeNationId: NationId;
    roleId: string;
    frictionScore: number;
    reasons: string[];
  }>;
}

export interface ClandestinePlaytestFinding {
  priority: 'P0' | 'P1' | 'P2';
  id: string;
  title: string;
  evidence: string;
  funImpact: string;
  recommendation: string;
}

export interface ClandestinePlaytestRun {
  generatedAt: string;
  methodology: string;
  sessions: ClandestinePlaytestSession[];
  aggregate: ClandestinePlaytestAggregate;
  findings: ClandestinePlaytestFinding[];
}

const profiles: ClandestinePlaytestProfile[] = [
  'home-loyalist',
  'foreign-asset',
  'survivor',
  'deceiver',
  'defector',
  'opportunist',
];

const eras = [
  { era: '제2차 세계대전·전후', startYear: 1942, endYear: 1949 },
  { era: '초기 냉전·탈식민', startYear: 1950, endYear: 1969 },
  { era: '데탕트·후기 냉전', startYear: 1970, endYear: 1989 },
  { era: '탈냉전·세계화', startYear: 1990, endYear: 2009 },
  { era: '네트워크 경쟁', startYear: 2010, endYear: 2029 },
  { era: '미래 질서', startYear: 2030, endYear: 2060 },
] as const;

const playtestNationIds: NationId[] = [
  'britain',
  'usa',
  'ussr',
  'germany',
  'japan',
  'china',
  'india',
  'freefrance',
  'italy',
  'korea',
  'vietnam',
  'indonesia',
  'philippines',
];

const playtestRoleTitles: Record<CareerBranch, string> = {
  military: '전구 작전·군수 보직',
  politics: '중앙 정책·외교 보직',
  intelligence: '정보·방첩 보직',
};

const playtestRoleArchetypes: Record<CareerBranch, CareerArchetype> = {
  military: 'theater-command',
  politics: 'cabinet-minister',
  intelligence: 'service-director',
};

const playtestTiers = [2, 3, 4, 5] as const;
const playtestAuthorityByTier: Record<(typeof playtestTiers)[number], number> = {
  2: 74,
  3: 61,
  4: 48,
  5: 36,
};

const playtestRoles: CareerRole[] = playtestNationIds.flatMap((nationId) =>
  (['politics', 'military', 'intelligence'] as CareerBranch[]).flatMap((branch) =>
    playtestTiers.map((tier) => ({
      id: `${nationId}-${branch}-tier${tier}-playtest`,
      nationId,
      title: `${playtestRoleTitles[branch]} TIER ${tier}`,
      branch,
      tier,
      archetype: playtestRoleArchetypes[branch],
      scope: tier === 2 ? '국가기관' : tier === 3 ? '전구·부처' : tier === 4 ? '지역 조직' : '현장 연락망',
      authority: playtestAuthorityByTier[tier],
      expectation: '장기 비밀 커리어 자동 플레이용 실제 권한 등급',
      historicalHolderId: `${nationId}-${branch}-tier${tier}-holder`,
      historicalHolderName: '시대별 실존 보직자',
      historicalOffice: playtestRoleTitles[branch],
      historicalBasis: '게임의 국가·분야·직급별 권한 범위를 재현한 자동 플레이 보직입니다.',
      coverIdentity: branch === 'military' ? '군사 연락관' : branch === 'politics' ? '정책 고문' : '정보 분석관',
      replacementEffect: '시대 진행에 따라 같은 국가 안에서 보직과 접근권이 순환합니다.',
    })),
  ),
);

const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const percent = (numerator: number, denominator: number) => round(numerator / Math.max(1, denominator) * 100);

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function addCount<Key extends string>(record: Partial<Record<Key, number>>, key: Key, amount = 1) {
  record[key] = (record[key] ?? 0) + amount;
}

function getYear(week: number) {
  return getCampaignYearForWeek(week);
}

function getEra(year: number) {
  return eras.find((era) => year >= era.startYear && year <= era.endYear) ?? eras[eras.length - 1];
}

function createEraMetric(year: number): ClandestinePlaytestEraMetric {
  const era = getEra(year);
  return {
    ...era,
    weeks: 0,
    activeWeeks: 0,
    dormantWeeks: 0,
    attentionWeeks: 0,
    highExposureWeeks: 0,
    highStressWeeks: 0,
    missionsOffered: 0,
    missionResponses: 0,
    missionsResolved: 0,
    missionsFailed: 0,
    incidents: 0,
    decisions: 0,
  };
}

function chooseHandlerNation(homeNationId: NationId, id: number) {
  const homeIndex = playtestNationIds.indexOf(homeNationId);
  const offsets = [3, 4, 1, 8, 5, 9, 2, 10, 6, 11, 7, 12];
  const offset = offsets[id % offsets.length] ?? 1;
  return playtestNationIds[(homeIndex + offset) % playtestNationIds.length]!;
}

function choosePosture(
  profile: ClandestinePlaytestProfile,
  state: ClandestineCareerState,
  exposure: number,
  week: number,
  id: number,
): ClandestinePosture {
  if (state.status === 'exfiltration') return 'prepare-exit';
  if (profile === 'home-loyalist' || profile === 'deceiver') return 'controlled-deception';
  if (profile === 'foreign-asset') return exposure >= 76 ? 'prepare-exit' : 'earn-handler-trust';
  if (profile === 'survivor') return exposure >= 42 || state.stress >= 55 ? 'protect-cover' : 'earn-handler-trust';
  if (profile === 'defector') return week >= 104 || exposure >= 48 ? 'prepare-exit' : 'earn-handler-trust';
  const options: ClandestinePosture[] = ['protect-cover', 'earn-handler-trust', 'controlled-deception', 'prepare-exit'];
  return options[stableHash(`${id}:${week}:${state.completedMissions}:posture`) % options.length]!;
}

function chooseMissionResponse(
  profile: ClandestinePlaytestProfile,
  state: ClandestineCareerState,
  exposure: number,
  missionDomain: ClandestineMissionDomain,
  week: number,
  id: number,
): ClandestineMissionResponse {
  if (profile === 'home-loyalist') return 'controlled-double';
  if (profile === 'foreign-asset') return exposure >= 82 ? 'comply-selective' : 'comply-full';
  if (profile === 'survivor') {
    if (exposure >= 74 || state.coverStrength <= 32) return 'refuse';
    return exposure >= 48 ? 'comply-selective' : 'disinform';
  }
  if (profile === 'deceiver') return state.controlledByHome || state.homeTrust >= 55 ? 'controlled-double' : 'disinform';
  if (profile === 'defector') return state.posture === 'prepare-exit' ? 'comply-full' : 'comply-selective';
  const options: ClandestineMissionResponse[] = ['comply-full', 'comply-selective', 'disinform', 'controlled-double', 'refuse'];
  return options[stableHash(`${id}:${week}:${missionDomain}:${state.handlerTrust}`) % options.length]!;
}

function chooseIncidentResponse(
  profile: ClandestinePlaytestProfile,
  state: ClandestineCareerState,
  exposure: number,
  incidentKind: ClandestineIncidentKind,
  week: number,
  id: number,
): ClandestineIncidentResponse {
  if (profile === 'home-loyalist') return 'cooperate-home';
  if (profile === 'foreign-asset') return incidentKind === 'emergency-extraction' || exposure >= 88 ? 'request-extraction' : 'misdirect-investigation';
  if (profile === 'survivor') return exposure >= 92 && state.coverStrength <= 20 ? 'cut-ties' : 'lay-low';
  if (profile === 'deceiver') return incidentKind === 'handler-doubt' ? 'misdirect-investigation' : 'cooperate-home';
  if (profile === 'defector') return 'request-extraction';
  const options: ClandestineIncidentResponse[] = ['lay-low', 'cooperate-home', 'misdirect-investigation', 'request-extraction', 'cut-ties'];
  return options[stableHash(`${id}:${week}:${incidentKind}:${state.stress}`) % options.length]!;
}

function applyGameDelta(game: GameState, delta: Partial<Record<keyof GameState, number>>) {
  const next = { ...game };
  Object.entries(delta).forEach(([key, value]) => {
    if (typeof value !== 'number') return;
    const typedKey = key as keyof GameState;
    next[typedKey] += value;
  });
  next.stability = clamp(next.stability);
  next.warSupport = clamp(next.warSupport);
  next.intelNetwork = clamp(next.intelNetwork);
  next.politicalPower = Math.max(0, next.politicalPower);
  return next;
}

function createPlaytestGame(id: number): GameState {
  return {
    week: 0,
    manpower: 900,
    politicalPower: 80,
    fuel: 90,
    steel: 110,
    factories: 28,
    stability: 52 + id % 31,
    warSupport: 58 + id % 28,
    commandPoints: 40,
    treasury: 900,
    victoryScore: 35,
    airPower: 55,
    navalPower: 52,
    intelNetwork: 48 + id % 37,
    enemyPressure: 55,
  };
}

function getFrictionReasons(session: Omit<ClandestinePlaytestSession, 'frictionReasons'>) {
  const reasons: string[] = [];
  if (session.attentionWeeks / Math.max(1, session.activeWeeks) >= 0.35) reasons.push('세 주 중 한 주 이상 비밀 결재로 진행 중단');
  if (session.highExposureWeeks / Math.max(1, session.activeWeeks) >= 0.3) reasons.push('활동 기간 30% 이상 고노출 상태');
  if (session.highStressWeeks / Math.max(1, session.activeWeeks) >= 0.3) reasons.push('활동 기간 30% 이상 고압박 상태');
  if (session.longestRepeatedCodenameRun >= 6) reasons.push('같은 임무 유형 6회 이상 연속');
  if (session.longestDecisionGapWeeks >= 260 && session.finalStatus !== 'closed') reasons.push('진행 중 5년 이상 선택 공백');
  if (session.longestDormantGapWeeks >= 520) reasons.push('연락 종료 후 10년 이상 새 제안 공백');
  if (session.missionSuccessRate <= 25 && session.missionsResolved + session.missionsFailed >= 10) reasons.push('임무 성공률 25% 이하');
  return reasons;
}

export function runClandestineCareerSession(
  id: number,
  weeksPlayed = CLANDESTINE_PLAYTEST_WEEKS,
): ClandestinePlaytestSession {
  const profile = profiles[id % profiles.length]!;
  const playableRoles = playtestRoles;
  let role = playableRoles[id % playableRoles.length]!;
  const initialRole = role;
  const homeNationId = role.nationId;
  const handlerNationId = chooseHandlerNation(homeNationId, id);
  let currentHomeNationId = homeNationId;
  let currentHandlerNationId = handlerNationId;
  let state = createClandestineCareerState({
    homeNationId,
    handlerNationId,
    week: 0,
    role,
    handlerTrust: 38 + stableHash(`${id}:handler`) % 39,
    coverStrength: 52 + stableHash(`${id}:cover`) % 37,
    weeklyRetainer: 6 + id % 15,
  });
  let game = createPlaytestGame(id);
  let exposure = 10 + stableHash(`${id}:exposure`) % 31;
  let activeWeeks = 0;
  let dormantWeeks = 0;
  let attentionWeeks = 0;
  let highExposureWeeks = 0;
  let highStressWeeks = 0;
  let missionsOffered = state.missions.length;
  let missionResponses = 0;
  let missionsResolved = 0;
  let missionsFailed = 0;
  let incidents = 0;
  let lastDecisionWeek = 0;
  let longestDecisionGapWeeks = 0;
  let closedWeek: number | null = null;
  let closeReason: ClandestinePlaytestSession['closeReason'] = null;
  let nextArcWeek: number | null = null;
  let nextArcHomeNationId: NationId = homeNationId;
  let careerArcs = 1;
  let extractionTransitions = 0;
  let cutTieTransitions = 0;
  let currentDormantGapWeeks = 0;
  let longestDormantGapWeeks = 0;
  const seenMissionIds = new Set(state.missions.map((mission) => mission.id));
  const terminalMissionIds = new Set<string>();
  const seenIncidentIds = new Set<string>();
  const codenames: string[] = [];
  const missionDomains = new Set<ClandestineMissionDomain>();
  const responseCounts: Partial<Record<ClandestineMissionResponse, number>> = {};
  const incidentResponseCounts: Partial<Record<ClandestineIncidentResponse, number>> = {};
  const incidentKinds: Partial<Record<ClandestineIncidentKind, number>> = {};
  const eraMetrics = new Map<string, ClandestinePlaytestEraMetric>();

  for (let week = 0; week < weeksPlayed; week += 1) {
    const year = getYear(week);
    const era = getEra(year);
    const metric = eraMetrics.get(era.era) ?? createEraMetric(year);
    eraMetrics.set(era.era, metric);
    metric.weeks += 1;
    if (week === 0) metric.missionsOffered += state.missions.length;
    game.week = week;
    let attentionThisWeek = false;

    if (state.status === 'closed') {
      if (nextArcWeek === null) {
        const extracted = closeReason === 'extracted';
        nextArcHomeNationId = extracted ? state.handlerNationId : currentHomeNationId;
        const baseCooldown = extracted ? 52 : 104;
        const variableCooldown = extracted ? 104 : 312;
        nextArcWeek = week + baseCooldown + stableHash(`${id}:${week}:${careerArcs}:new-approach`) % variableCooldown;
      }
      if (week < nextArcWeek) {
        dormantWeeks += 1;
        metric.dormantWeeks += 1;
        currentDormantGapWeeks += 1;
        longestDormantGapWeeks = Math.max(longestDormantGapWeeks, currentDormantGapWeeks);
        continue;
      }
      currentHomeNationId = nextArcHomeNationId;
      const sameBranchRoles = playableRoles.filter((candidate) =>
        candidate.nationId === currentHomeNationId
        && candidate.branch === initialRole.branch,
      );
      role = sameBranchRoles[(id + careerArcs) % sameBranchRoles.length] ?? role;
      currentHandlerNationId = chooseHandlerNation(currentHomeNationId, id + careerArcs * 17);
      state = createClandestineCareerState({
        homeNationId: currentHomeNationId,
        handlerNationId: currentHandlerNationId,
        week,
        role,
        handlerTrust: 34 + stableHash(`${id}:${careerArcs}:handler`) % 43,
        coverStrength: 58 + stableHash(`${id}:${careerArcs}:cover`) % 33,
        weeklyRetainer: 6 + (id + careerArcs) % 18,
      });
      exposure = clamp(exposure - (closeReason === 'extracted' ? 55 : 38), 8, 58);
      careerArcs += 1;
      nextArcWeek = null;
      closeReason = null;
      currentDormantGapWeeks = 0;
      state.missions.forEach((mission) => seenMissionIds.add(mission.id));
      missionsOffered += state.missions.length;
      metric.missionsOffered += state.missions.length;
    }

    activeWeeks += 1;
    metric.activeWeeks += 1;
    if (exposure >= 70) {
      highExposureWeeks += 1;
      metric.highExposureWeeks += 1;
    }
    if (state.stress >= 70) {
      highStressWeeks += 1;
      metric.highStressWeeks += 1;
    }

    if (week > 0 && week % 260 === 0) {
      const sameNationRoles = playableRoles.filter((candidate) => candidate.nationId === currentHomeNationId);
      role = sameNationRoles[(id + Math.floor(week / 260)) % sameNationRoles.length] ?? role;
    }

    const context: ClandestineWeekContext = {
      week,
      role,
      intelNetwork: game.intelNetwork,
      stability: game.stability,
      warSupport: game.warSupport,
      campaignPhase: year <= 1946 ? 'war' : 'nation',
      exposure,
    };

    if (week % 13 === 0) {
      const posture = choosePosture(profile, state, exposure, week, id);
      const nextState = setClandestinePosture(state, posture);
      if (nextState.posture !== state.posture) {
        state = nextState;
        lastDecisionWeek = week;
        metric.decisions += 1;
      }
    }

    if (state.incident) {
      attentionThisWeek = true;
      const incident = state.incident;
      if (!seenIncidentIds.has(incident.id)) {
        seenIncidentIds.add(incident.id);
        incidents += 1;
        metric.incidents += 1;
        addCount(incidentKinds, incident.kind);
      }
      const response = chooseIncidentResponse(profile, state, exposure, incident.kind, week, id);
      const resolution = respondToClandestineIncident(state, response, context);
      if (resolution) {
        state = resolution.state;
        exposure = clamp(exposure + resolution.exposureDelta);
        game = applyGameDelta(game, resolution.gameDelta);
        addCount(incidentResponseCounts, response);
        lastDecisionWeek = week;
        metric.decisions += 1;
        if (resolution.transferNationId) {
          closeReason = 'extracted';
          extractionTransitions += 1;
        } else if (response === 'cut-ties') {
          closeReason = 'cut-ties';
          cutTieTransitions += 1;
        }
      }
    }

    const offeredMissions = state.missions.filter((mission) => mission.status === 'offered');
    if (offeredMissions.length > 0) attentionThisWeek = true;
    offeredMissions.forEach((mission) => {
      const response = chooseMissionResponse(profile, state, exposure, mission.domain, week, id);
      const resolution = respondToClandestineMission(state, mission.id, response, context);
      if (!resolution) return;
      state = resolution.state;
      exposure = clamp(exposure + resolution.exposureDelta);
      game = applyGameDelta(game, resolution.gameDelta);
      missionResponses += 1;
      metric.missionResponses += 1;
      metric.decisions += 1;
      addCount(responseCounts, response);
      lastDecisionWeek = week;
    });

    if (state.status !== 'closed') {
      const result = advanceClandestineCareerWeek(state, {
        ...context,
        exposure,
      });
      state = result.state;
      exposure = clamp(exposure + result.exposureDelta);
      game = applyGameDelta(game, result.gameDelta);
      if (result.needsAttention) attentionThisWeek = true;
    }

    state.missions.forEach((mission) => {
      if (!seenMissionIds.has(mission.id)) {
        seenMissionIds.add(mission.id);
        missionsOffered += 1;
        metric.missionsOffered += 1;
      }
      if (!terminalMissionIds.has(mission.id) && (mission.status === 'resolved' || mission.status === 'failed' || mission.status === 'refused')) {
        terminalMissionIds.add(mission.id);
        codenames.push(mission.codename);
        missionDomains.add(mission.domain);
        if (mission.status === 'resolved') {
          missionsResolved += 1;
          metric.missionsResolved += 1;
        } else {
          missionsFailed += 1;
          metric.missionsFailed += 1;
        }
      }
    });

    if (attentionThisWeek) {
      attentionWeeks += 1;
      metric.attentionWeeks += 1;
    }
    longestDecisionGapWeeks = Math.max(longestDecisionGapWeeks, week - lastDecisionWeek);
    if (state.status === 'closed' && closedWeek === null) closedWeek = week;
  }

  let longestRepeatedCodenameRun = 0;
  let currentRun = 0;
  let previousCodename = '';
  codenames.forEach((codename) => {
    currentRun = codename === previousCodename ? currentRun + 1 : 1;
    previousCodename = codename;
    longestRepeatedCodenameRun = Math.max(longestRepeatedCodenameRun, currentRun);
  });

  const sessionWithoutReasons: Omit<ClandestinePlaytestSession, 'frictionReasons'> = {
    id,
    profile,
    homeNationId,
    handlerNationId,
    roleId: initialRole.id,
    roleBranch: initialRole.branch,
    roleTier: initialRole.tier,
    weeksPlayed,
    activeWeeks,
    dormantWeeks,
    attentionWeeks,
    highExposureWeeks,
    highStressWeeks,
    missionsOffered,
    missionResponses,
    missionsResolved,
    missionsFailed,
    missionSuccessRate: percent(missionsResolved, missionsResolved + missionsFailed),
    uniqueMissionCodenames: new Set(codenames).size,
    uniqueMissionDomains: missionDomains.size,
    longestRepeatedCodenameRun,
    incidents,
    incidentKinds,
    longestDecisionGapWeeks,
    finalStatus: state.status,
    finalPosture: state.posture,
    finalExposure: round(exposure),
    finalCoverStrength: round(state.coverStrength),
    finalHandlerTrust: round(state.handlerTrust),
    finalHomeTrust: round(state.homeTrust),
    finalStress: round(state.stress),
    finalExtractionReadiness: round(state.extractionReadiness),
    completedMissions: state.completedMissions,
    genuineLeaks: state.genuineLeaks,
    deceptionReports: state.deceptionReports,
    totalEarnings: state.totalEarnings,
    controlledByHome: state.controlledByHome,
    careerArcs,
    extractionTransitions,
    cutTieTransitions,
    longestDormantGapWeeks,
    closedWeek,
    closeReason,
    reached2060Active: state.status !== 'closed',
    responseCounts,
    incidentResponseCounts,
    eraMetrics: [...eraMetrics.values()],
  };
  return {
    ...sessionWithoutReasons,
    frictionReasons: getFrictionReasons(sessionWithoutReasons),
  };
}

function frictionScore(session: ClandestinePlaytestSession) {
  return session.frictionReasons.length * 20
    + session.attentionWeeks / Math.max(1, session.activeWeeks) * 40
    + session.highExposureWeeks / Math.max(1, session.activeWeeks) * 25
    + session.highStressWeeks / Math.max(1, session.activeWeeks) * 25
    + Math.min(25, session.longestRepeatedCodenameRun * 2)
    + Math.min(30, session.dormantWeeks / 52);
}

export function aggregateClandestineCareerSessions(
  sessions: ClandestinePlaytestSession[],
  weeksPerSession = CLANDESTINE_PLAYTEST_WEEKS,
): ClandestinePlaytestRun {
  const totalWeeks = sessions.length * weeksPerSession;
  const totalActiveWeeks = sessions.reduce((sum, session) => sum + session.activeWeeks, 0);
  const totalTerminalMissions = sessions.reduce((sum, session) => sum + session.missionsResolved + session.missionsFailed, 0);
  const responseDistribution: Partial<Record<ClandestineMissionResponse, number>> = {};
  const incidentResponseDistribution: Partial<Record<ClandestineIncidentResponse, number>> = {};
  const incidentKindDistribution: Partial<Record<ClandestineIncidentKind, number>> = {};
  sessions.forEach((session) => {
    Object.entries(session.responseCounts).forEach(([key, value]) => addCount(responseDistribution, key as ClandestineMissionResponse, value));
    Object.entries(session.incidentResponseCounts).forEach(([key, value]) => addCount(incidentResponseDistribution, key as ClandestineIncidentResponse, value));
    Object.entries(session.incidentKinds).forEach(([key, value]) => addCount(incidentKindDistribution, key as ClandestineIncidentKind, value));
  });

  const byProfile = Object.fromEntries(profiles.map((profile) => {
    const matches = sessions.filter((session) => session.profile === profile);
    const activeProfileWeeks = matches.reduce((sum, session) => sum + session.activeWeeks, 0);
    const terminalMissions = matches.reduce((sum, session) => sum + session.missionsResolved + session.missionsFailed, 0);
    return [profile, {
      sessions: matches.length,
      activeAt2060Rate: percent(matches.filter((session) => session.reached2060Active).length, matches.length),
      averageActiveYears: round(average(matches.map((session) => session.activeWeeks / 52)), 1),
      averageMissions: round(average(matches.map((session) => session.missionsOffered)), 1),
      missionSuccessRate: percent(matches.reduce((sum, session) => sum + session.missionsResolved, 0), terminalMissions),
      incidentsPerDecade: round(matches.reduce((sum, session) => sum + session.incidents, 0) / Math.max(1, activeProfileWeeks / 520), 1),
      attentionWeekRate: percent(matches.reduce((sum, session) => sum + session.attentionWeeks, 0), activeProfileWeeks),
      averageFinalExposure: round(average(matches.map((session) => session.finalExposure)), 1),
      averageFinalStress: round(average(matches.map((session) => session.finalStress)), 1),
    }];
  })) as ClandestinePlaytestAggregate['byProfile'];

  const eraTimeline = eras.map((era) => {
    const matches = sessions.flatMap((session) => session.eraMetrics.filter((metric) => metric.era === era.era));
    const weeks = matches.reduce((sum, metric) => sum + metric.weeks, 0);
    const activeWeeks = matches.reduce((sum, metric) => sum + metric.activeWeeks, 0);
    const terminalMissions = matches.reduce((sum, metric) => sum + metric.missionsResolved + metric.missionsFailed, 0);
    return {
      ...era,
      activeCareerRate: percent(activeWeeks, weeks),
      attentionWeekRate: percent(matches.reduce((sum, metric) => sum + metric.attentionWeeks, 0), activeWeeks),
      highExposureWeekRate: percent(matches.reduce((sum, metric) => sum + metric.highExposureWeeks, 0), activeWeeks),
      highStressWeekRate: percent(matches.reduce((sum, metric) => sum + metric.highStressWeeks, 0), activeWeeks),
      missionsPerActiveYear: round(matches.reduce((sum, metric) => sum + metric.missionsOffered, 0) / Math.max(1, activeWeeks / 52), 1),
      missionSuccessRate: percent(matches.reduce((sum, metric) => sum + metric.missionsResolved, 0), terminalMissions),
      incidentsPerActiveDecade: round(matches.reduce((sum, metric) => sum + metric.incidents, 0) / Math.max(1, activeWeeks / 520), 1),
      decisionsPerActiveYear: round(matches.reduce((sum, metric) => sum + metric.decisions, 0) / Math.max(1, activeWeeks / 52), 1),
    };
  });

  const aggregate: ClandestinePlaytestAggregate = {
    sessionCount: sessions.length,
    weeksPerSession,
    totalWeeks,
    nationCoverage: new Set(sessions.map((session) => session.homeNationId)).size,
    handlerNationCoverage: new Set(sessions.map((session) => session.handlerNationId)).size,
    roleCoverage: new Set(sessions.map((session) => session.roleId)).size,
    branchCoverage: new Set(sessions.map((session) => session.roleBranch)).size,
    tierCoverage: new Set(sessions.map((session) => session.roleTier)).size,
    profileCoverage: new Set(sessions.map((session) => session.profile)).size,
    activeAt2060Rate: percent(sessions.filter((session) => session.reached2060Active).length, sessions.length),
    closedCareerRate: percent(sessions.filter((session) => session.finalStatus === 'closed').length, sessions.length),
    extractionRate: percent(sessions.filter((session) => session.extractionTransitions > 0).length, sessions.length),
    cutTiesRate: percent(sessions.filter((session) => session.cutTieTransitions > 0).length, sessions.length),
    controlledDoubleRate: percent(sessions.filter((session) => session.controlledByHome).length, sessions.length),
    averageCareerArcs: round(average(sessions.map((session) => session.careerArcs)), 1),
    multiArcCareerRate: percent(sessions.filter((session) => session.careerArcs > 1).length, sessions.length),
    averageExtractionTransitions: round(average(sessions.map((session) => session.extractionTransitions)), 1),
    averageCutTieTransitions: round(average(sessions.map((session) => session.cutTieTransitions)), 1),
    averageActiveYears: round(average(sessions.map((session) => session.activeWeeks / 52)), 1),
    averageDormantYears: round(average(sessions.map((session) => session.dormantWeeks / 52)), 1),
    averageMissions: round(average(sessions.map((session) => session.missionsOffered)), 1),
    missionSuccessRate: percent(sessions.reduce((sum, session) => sum + session.missionsResolved, 0), totalTerminalMissions),
    averageUniqueMissionCodenames: round(average(sessions.map((session) => session.uniqueMissionCodenames)), 1),
    averageUniqueMissionDomains: round(average(sessions.map((session) => session.uniqueMissionDomains)), 1),
    averageLongestRepeatedCodenameRun: round(average(sessions.map((session) => session.longestRepeatedCodenameRun)), 1),
    averageIncidents: round(average(sessions.map((session) => session.incidents)), 1),
    incidentsPerDecade: round(sessions.reduce((sum, session) => sum + session.incidents, 0) / Math.max(1, totalActiveWeeks / 520), 1),
    attentionWeekRate: percent(sessions.reduce((sum, session) => sum + session.attentionWeeks, 0), totalActiveWeeks),
    highExposureWeekRate: percent(sessions.reduce((sum, session) => sum + session.highExposureWeeks, 0), totalActiveWeeks),
    highStressWeekRate: percent(sessions.reduce((sum, session) => sum + session.highStressWeeks, 0), totalActiveWeeks),
    averageLongestDecisionGapWeeks: round(average(sessions.map((session) => session.longestDecisionGapWeeks)), 1),
    excessiveInterruptionSessionRate: percent(sessions.filter((session) => session.attentionWeeks / Math.max(1, session.activeWeeks) >= 0.35).length, sessions.length),
    repetitiveMissionSessionRate: percent(sessions.filter((session) => session.longestRepeatedCodenameRun >= 6).length, sessions.length),
    dormantDecadesSessionRate: percent(sessions.filter((session) => session.longestDormantGapWeeks >= 520).length, sessions.length),
    byProfile,
    eraTimeline,
    responseDistribution,
    incidentResponseDistribution,
    incidentKindDistribution,
    worstSessions: [...sessions]
      .sort((left, right) => frictionScore(right) - frictionScore(left))
      .slice(0, 20)
      .map((session) => ({
        id: session.id,
        profile: session.profile,
        homeNationId: session.homeNationId,
        roleId: session.roleId,
        frictionScore: round(frictionScore(session), 1),
        reasons: session.frictionReasons,
      })),
  };

  const findings: ClandestinePlaytestFinding[] = [];
  if (aggregate.dormantDecadesSessionRate >= 10) {
    findings.push({
      priority: 'P0',
      id: 'career-dead-end',
      title: '연락 종료 뒤 별도 커리어가 장기간 정지합니다',
      evidence: `${aggregate.dormantDecadesSessionRate}%의 세션에서 연락 종료 뒤 다음 비밀 경력 제안까지 10년 이상 공백이 발생했고, 평균 누적 휴면 기간은 ${aggregate.averageDormantYears}년입니다.`,
      funImpact: '전향·연락 단절이라는 큰 선택이 새로운 장을 열지 않고 사실상 콘텐츠 종료로 느껴집니다.',
      recommendation: '비밀 경력의 장 종료와 재접촉·보호 프로그램·새 기관 제안을 분리하고, 장기 이력을 보존한 채 다음 장을 시작하게 합니다.',
    });
  }
  if (aggregate.incidentsPerDecade >= 12 || aggregate.excessiveInterruptionSessionRate >= 25) {
    findings.push({
      priority: 'P0',
      id: 'incident-fatigue',
      title: '방첩 위기가 과도하게 반복됩니다',
      evidence: `활동 10년당 방첩 사건 ${aggregate.incidentsPerDecade}건, 과도한 중단 세션 ${aggregate.excessiveInterruptionSessionRate}%입니다.`,
      funImpact: '희소해야 할 위기가 정기 결재처럼 변해 긴장감 대신 피로를 만듭니다.',
      recommendation: '사건 해결 뒤 유예기간과 사건 단계 상승 규칙을 두고, 같은 단서가 연속 사건을 만들지 않게 합니다.',
    });
  }
  if (aggregate.missionSuccessRate <= 35) {
    findings.push({
      priority: 'P1',
      id: 'late-career-difficulty',
      title: '장기 활동에서 임무 성공률이 붕괴합니다',
      evidence: `전체 임무 성공률이 ${aggregate.missionSuccessRate}%이며 후기 시대에도 누적 완료 횟수가 난도를 계속 올립니다.`,
      funImpact: '숙련된 인물이 시간이 지날수록 더 무능해지는 역성장으로 체감됩니다.',
      recommendation: '누적 난도 상한, 숙련 보너스, 실패 회복 구간과 시대별 임무 등급을 분리합니다.',
    });
  }
  if (aggregate.averageUniqueMissionCodenames <= 7 || aggregate.repetitiveMissionSessionRate >= 10) {
    findings.push({
      priority: 'P1',
      id: 'mission-repetition',
      title: '118년 동안 같은 임무군이 반복됩니다',
      evidence: `세션당 고유 암호명 평균 ${aggregate.averageUniqueMissionCodenames}개, 6회 이상 같은 임무 연속 세션 ${aggregate.repetitiveMissionSessionRate}%입니다.`,
      funImpact: '1940년대와 2050년대의 정보전이 같은 요청처럼 보여 시대가 흐르는 감각이 사라집니다.',
      recommendation: '전후·냉전·탈냉전·네트워크 시대별 임무 풀과 시대 전환 장부를 추가합니다.',
    });
  }
  if (aggregate.highExposureWeekRate >= 25 || aggregate.highStressWeekRate >= 25) {
    findings.push({
      priority: 'P1',
      id: 'permanent-red-zone',
      title: '고노출·고압박 상태가 정상 상태가 됩니다',
      evidence: `고노출 주차 ${aggregate.highExposureWeekRate}%, 고스트레스 주차 ${aggregate.highStressWeekRate}%입니다.`,
      funImpact: '위험 수치가 항상 붉으면 새로운 위험의 의미와 대응 우선순위를 구분하기 어렵습니다.',
      recommendation: '휴면·잠복·임무 성공에 실질적인 회복을 부여하고, 위험의 원인과 다음 안전 구간을 화면에 표시합니다.',
    });
  }
  if (findings.length === 0) {
    findings.push({
      priority: 'P2',
      id: 'healthy-baseline',
      title: '장기 비밀 커리어의 주요 피로 임계치를 통과했습니다',
      evidence: `임무 성공률 ${aggregate.missionSuccessRate}%, 10년당 사건 ${aggregate.incidentsPerDecade}건, 중단 주차 ${aggregate.attentionWeekRate}%입니다.`,
      funImpact: '시대 변화와 선택의 긴장이 장기 진행을 막지 않는 범위에 있습니다.',
      recommendation: '시대별 사례와 UI 설명을 계속 확장하되 현재 빈도 상한을 유지합니다.',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    methodology: `${sessions.length} deterministic clandestine-only careers from ${CLANDESTINE_PLAYTEST_START_YEAR} to ${CLANDESTINE_PLAYTEST_END_YEAR}; ${totalWeeks.toLocaleString('en-US')} weekly state transitions across nations, roles, ranks and six behavior profiles.`,
    sessions,
    aggregate,
    findings,
  };
}

export function runClandestineCareerPlaytest(
  sessionCount = CLANDESTINE_PLAYTEST_SESSION_COUNT,
  weeksPlayed = CLANDESTINE_PLAYTEST_WEEKS,
) {
  return aggregateClandestineCareerSessions(
    Array.from({ length: sessionCount }, (_, id) => runClandestineCareerSession(id, weeksPlayed)),
    weeksPlayed,
  );
}
