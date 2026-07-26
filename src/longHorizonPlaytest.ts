import {
  careerRoles,
  createCampaignDivisions,
  createCampaignProduction,
  createCareerCommanders,
  createCovertOperations,
  createDiplomaticRelations,
  createStaffRoster,
  nations,
} from './campaign';
import {
  getCenturyTransitionBehaviorWeek,
  type CenturyBehaviorProfile,
  type CenturyScenarioBlueprint,
} from './centuryScenario';
import { getEligibleCouncilEvents, selectNextCouncilEvent, strategicPolicies } from './choices';
import { forecastBattle, resolveBattle } from './combat';
import { initialResearch, territories as initialTerritories } from './data';
import {
  commanderSkills,
  createCommanderDevelopment,
  getAvailableSkillPoints,
  getCommanderRecord,
  recordBattleExperience,
  unlockCommanderSkill,
} from './development';
import { advanceEconomyWeek, calculateEconomyLedger, createEconomyState } from './economy';
import { applyElectionCampaignAction, electionCampaignActions as electionActionDefinitions } from './electoralPolitics';
import { deriveEmergentHistory } from './emergentHistory';
import { calculateProductionGains } from './engine';
import { assessKoreaLiberationReadiness, type KoreaLiberationAssessment } from './koreaExperience';
import { createLaterEraCandidates } from './laterEraFigures';
import {
  advanceNationManagementWeek,
  calculateTransitionReadiness,
  createNationManagementState,
  getActiveNationAgenda,
  rebalanceNationBudget,
  resolveNationAgendaChoice,
  type NationBudgetDomain,
  type NationManagementState,
  type NationStrategyId,
} from './nationManagement';
import { getNationDevelopmentProfile, getNationTransitionSchedule, type NationAgendaChoiceId } from './nationDevelopment';
import {
  applyCoupPrevention,
  advancePoliticalCrisisWeek,
  assessCoupRisk,
  createPoliticalCrisisState,
  getCoupResponseForecasts,
  resolveCoupAttempt,
  type CoupRiskAssessment,
  type PoliticalCrisisContext,
} from './politicalCrisis';
import {
  advancePublicHealthWeek,
  createPublicHealthSeed,
  createPublicHealthState,
  recommendPublicHealthPolicy,
} from './publicHealth';
import { advanceStaffRosterWeek, getStaffMorale } from './staffManagement';
import { advanceResearchProjects, fillOpenResearchSlots, getResearchAvailability } from './researchProgression';
import {
  getAvailableStrategicOperations,
  launchNationalPlan,
  launchStrategicOperation,
  type NationalPlanId,
  type NationalPlanMetrics,
} from './strategicContinuity';
import type {
  CareerRole,
  GameState,
  Order,
  ProductionLine,
  ResearchProject,
  StaffMember,
  Stockpile,
  StrategicPolicy,
} from './types';
import { deriveUXActions, type UXActionPriority } from './ux';
import {
  deriveWorldFlashpointEffects,
  getCampaignYear,
  getHistoricalHorizon,
  getWorldFlashpointDecisionId,
  selectNextWorldFlashpoint,
  WORLD_FLASHPOINT_INTERVAL_WEEKS,
} from './worldFlashpoints';
import { createWorldHistorySeed, generateWorldline, worldHistoryEvents, type WorldHistoryState } from './worldHistory';

export const LONG_HORIZON_START_YEAR = 1942;
export const LONG_HORIZON_END_YEAR = 2020;
export const LONG_HORIZON_WEEKS = (LONG_HORIZON_END_YEAR - LONG_HORIZON_START_YEAR) * 52;

export type LongHorizonProfile = CenturyBehaviorProfile;

export interface LongHorizonEraMetric {
  era: string;
  startYear: number;
  endYear: number;
  weeks: number;
  actionPrompts: number;
  urgentWeeks: number;
  quietWeeks: number;
  decisions: number;
  interruptions: number;
  battles: number;
  strategicOperations: number;
  flashpoints: number;
  elections: number;
  coupAttempts: number;
  outbreaks: number;
  researchActiveWeeks: number;
  inflationWarningWeeks: number;
  nationalScoreCeilingWeeks: number;
  inflationTotal: number;
  nationalScoreTotal: number;
  enemyPressureTotal: number;
}

export interface LongHorizonSessionResult {
  id: number;
  nationId: string;
  scenarioCombinationKey: string;
  scenarioCombinationCode: number | null;
  roleId: string;
  roleTier: number;
  roleBranch: string;
  profile: LongHorizonProfile;
  weeksPlayed: number;
  endYear: number;
  transitionWeek: number;
  transitionYear: number;
  transitionArchetype: string;
  koreaLiberationAtTransition: KoreaLiberationAssessment | null;
  koreaTransitionMode: 'fixed-timer' | 'readiness' | 'deadline' | null;
  warWeeks: number;
  nationWeeks: number;
  actionPrompts: number;
  urgentPromptWeeks: number;
  recommendedPromptWeeks: number;
  quietWeeks: number;
  decisionInteractions: number;
  decisionWeeks: number;
  interruptionCount: number;
  repeatedActionRuns: Record<string, number>;
  battleCount: number;
  battleVictories: number;
  strategicOperationCount: number;
  nationAgendaDecisionCount: number;
  councilDecisionCount: number;
  uniqueCouncilEvents: number;
  historicalCouncilEventsSeen: number;
  historicalCouncilEventsAvailable: number;
  historicalCouncilEventsMissed: number;
  worldFlashpointCount: number;
  acceleratedFlashpointCount: number;
  maximumFlashpointAccelerationYears: number;
  firstFlashpointYear: number | null;
  lastFlashpointYear: number | null;
  flashpointDroughtYears: number;
  electionCount: number;
  electionWins: number;
  electionCampaignActions: number;
  coupAttempts: number;
  coupPrevented: number;
  coupCompromises: number;
  coupSuccesses: number;
  unresolvedCoupResponses: number;
  outbreakCount: number;
  outbreakWeeks: number;
  outbreakDeaths: number;
  economicEventCount: number;
  inflationWarningWeeks: number;
  hyperinflationWeeks: number;
  treasuryZeroWeeks: number;
  excessivePoliticalPowerWeeks: number;
  excessiveCommandPointWeeks: number;
  zeroEnemyPressureWeeks: number;
  nationalScoreCeilingWeeks: number;
  researchCompleteWeek: number | null;
  researchIdleWeeks: number;
  researchLongestIdleRun: number;
  staffWeeksAdvanced: number;
  staffFrozenWeeks: number;
  expiredStaffAtTransition: number;
  laterEraCandidatesAtTransition: number;
  laterEraCandidatesAt2020: number;
  missedPostwarCandidateArrivals: number;
  finalTreasury: number;
  finalDebt: number;
  finalInflation: number;
  finalStability: number;
  finalPoliticalPower: number;
  finalCommandPoints: number;
  finalEnemyPressure: number;
  finalNationalScore: number;
  finalMandateScore: number;
  finalUnrest: number;
  finalStructuralUnrestTarget: number;
  finalStructuralUnrestFloor: number;
  finalResearchCompleted: number;
  finalWorldlineCode: string;
  finalEndingId: string;
  finalDominantForce: string;
  worldChoiceSignature: string;
  eraMetrics: LongHorizonEraMetric[];
}

export interface LongHorizonFinding {
  priority: 'P0' | 'P1' | 'P2';
  id: string;
  title: string;
  evidence: string;
  funImpact: string;
  recommendation: string;
}

export interface LongHorizonAggregate {
  sessionCount: number;
  weeksPerSession: number;
  totalWeeks: number;
  nationCoverage: number;
  roleCoverage: number;
  tierCoverage: number;
  branchCoverage: number;
  profileCoverage: number;
  reached2020Rate: number;
  actionPrompts: number;
  actionPromptsPerWeek: number;
  urgentWeekRate: number;
  quietWeekRate: number;
  decisionInteractions: number;
  decisionWeeks: number;
  promptToDecisionRatio: number;
  interruptionCount: number;
  interruptionsPerYear: number;
  medianResearchCompleteYear: number | null;
  medianResearchDroughtYears: number;
  researchActiveWeekRate: number;
  averageFinalResearchCompleted: number;
  averageHistoricalCouncilCoverage: number;
  averageFlashpointCount: number;
  averageLastFlashpointYear: number | null;
  averageFlashpointDroughtYears: number;
  acceleratedFlashpointRate: number;
  medianMaximumFlashpointAccelerationYears: number;
  inflationWarningWeekRate: number;
  hyperinflationSessionRate: number;
  excessivePoliticalPowerSessionRate: number;
  zeroEnemyPressureSessionRate: number;
  averageStaffFrozenYears: number;
  missedPostwarCandidateSessionRate: number;
  averageMissedPostwarCandidates: number;
  coupSessionRate: number;
  successfulCoupSessionRate: number;
  outbreakSessionRate: number;
  uniqueWorldlineCodes: number;
  uniqueEndings: number;
  mostCommonEndingShare: number;
  topRepeatedActions: Array<{ id: string; sessions: number; weeks: number }>;
  byProfile: Record<LongHorizonProfile, {
    sessions: number;
    promptsPerWeek: number;
    urgentWeekRate: number;
    decisionsPerYear: number;
    averageFinalInflation: number;
    averageFinalNationalScore: number;
    averageFlashpointDroughtYears: number;
    averageMissedPostwarCandidates: number;
  }>;
}

export interface LongHorizonPlaytestRun {
  generatedAt: string;
  methodology: string;
  sessions: LongHorizonSessionResult[];
  aggregate: LongHorizonAggregate;
  findings: LongHorizonFinding[];
}

interface ProfileConfig {
  transitionWeek: number;
  doctrine: 'coalition' | 'methodical' | 'maneuver';
  nationStrategy: NationStrategyId;
  policies: string[];
  battleCadence: number;
  electionActions: string[];
  worldVariant: 0 | 1 | 2 | 'rotate';
}

const profiles: LongHorizonProfile[] = ['guided', 'rushed', 'military', 'state-builder', 'completionist', 'opportunist'];

const profileConfigs: Record<LongHorizonProfile, ProfileConfig> = {
  guided: {
    transitionWeek: 104,
    doctrine: 'coalition',
    nationStrategy: 'social-contract',
    policies: ['economy-balanced', 'doctrine-defense', 'society-welfare', 'diplomacy-aid'],
    battleCadence: 8,
    electionActions: ['policy-manifesto', 'integrity-commission', 'radio-address'],
    worldVariant: 1,
  },
  rushed: {
    transitionWeek: 52,
    doctrine: 'maneuver',
    nationStrategy: 'reconstruction-state',
    policies: [],
    battleCadence: 13,
    electionActions: [],
    worldVariant: 0,
  },
  military: {
    transitionWeek: 260,
    doctrine: 'maneuver',
    nationStrategy: 'security-republic',
    policies: ['economy-mass', 'doctrine-maneuver', 'society-mobilization', 'diplomacy-bloc'],
    battleCadence: 3,
    electionActions: ['mass-rally', 'radio-address'],
    worldVariant: 2,
  },
  'state-builder': {
    transitionWeek: 104,
    doctrine: 'methodical',
    nationStrategy: 'developmental-state',
    policies: ['economy-distributed', 'doctrine-defense', 'society-autonomy', 'diplomacy-pragmatic'],
    battleCadence: 10,
    electionActions: ['policy-manifesto', 'coalition-pact', 'local-endorsement'],
    worldVariant: 1,
  },
  completionist: {
    transitionWeek: 156,
    doctrine: 'methodical',
    nationStrategy: 'open-republic',
    policies: ['economy-balanced', 'doctrine-firepower', 'society-welfare', 'diplomacy-aid'],
    battleCadence: 5,
    electionActions: ['policy-manifesto', 'public-debate', 'integrity-commission', 'coalition-pact'],
    worldVariant: 'rotate',
  },
  opportunist: {
    transitionWeek: 78,
    doctrine: 'maneuver',
    nationStrategy: 'open-republic',
    policies: ['economy-mass', 'doctrine-maneuver', 'society-autonomy', 'diplomacy-pragmatic'],
    battleCadence: 4,
    electionActions: ['fundraising-drive', 'mass-rally', 'public-debate'],
    worldVariant: 'rotate',
  },
};

const baseGame: GameState = {
  week: 0,
  manpower: 1280,
  politicalPower: 86,
  fuel: 74,
  steel: 112,
  factories: 30,
  stability: 78,
  warSupport: 84,
  commandPoints: 42,
  treasury: 920,
  victoryScore: 38,
  airPower: 57,
  navalPower: 52,
  intelNetwork: 64,
  enemyPressure: 68,
};

const baseStockpile: Stockpile = {
  infantryEquipment: 48_200,
  tanks: 1_284,
  aircraft: 2_106,
  convoys: 624,
  artillery: 3_840,
  trucks: 12_600,
};

const clamp = (value: number, minimum = 0, maximum = Number.POSITIVE_INFINITY) => Math.min(maximum, Math.max(minimum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

function percentile(values: number[], fraction: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * fraction)))];
}

function getEraRange(year: number) {
  if (year < 1950) return { era: '1942–1949', startYear: 1942, endYear: 1949 };
  const startYear = Math.floor(year / 10) * 10;
  return { era: `${startYear}–${startYear + 9}`, startYear, endYear: startYear + 9 };
}

function createEraMetric(year: number): LongHorizonEraMetric {
  const range = getEraRange(year);
  return {
    ...range,
    weeks: 0,
    actionPrompts: 0,
    urgentWeeks: 0,
    quietWeeks: 0,
    decisions: 0,
    interruptions: 0,
    battles: 0,
    strategicOperations: 0,
    flashpoints: 0,
    elections: 0,
    coupAttempts: 0,
    outbreaks: 0,
    researchActiveWeeks: 0,
    inflationWarningWeeks: 0,
    nationalScoreCeilingWeeks: 0,
    inflationTotal: 0,
    nationalScoreTotal: 0,
    enemyPressureTotal: 0,
  };
}

function stableRoll(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function applyGameDelta(game: GameState, delta: Partial<Record<keyof GameState, number>>) {
  const next = { ...game };
  (Object.entries(delta) as Array<[keyof GameState, number]>).forEach(([key, value]) => {
    next[key] = clamp(next[key] + value) as never;
  });
  next.stability = clamp(next.stability, 0, 100);
  next.warSupport = clamp(next.warSupport, 0, 100);
  next.commandPoints = clamp(next.commandPoints, 0, 100);
  next.victoryScore = clamp(next.victoryScore, 0, 100);
  next.enemyPressure = clamp(next.enemyPressure, 0, 100);
  next.airPower = clamp(next.airPower, 0, 100);
  next.navalPower = clamp(next.navalPower, 0, 100);
  next.intelNetwork = clamp(next.intelNetwork, 0, 100);
  return next;
}

function completeFactories(production: ProductionLine[], factories: number) {
  const assigned = production.reduce((sum, line) => sum + line.assigned, 0);
  const idle = Math.max(0, factories - assigned);
  if (idle === 0 || production.length === 0) return production;
  return production.map((line, index) => index === 0 ? { ...line, assigned: line.assigned + idle } : line);
}

function unlockAvailableSkills(records: ReturnType<typeof createCommanderDevelopment>) {
  return records.map((record) => {
    let next = record;
    for (const skill of commanderSkills) {
      if (getAvailableSkillPoints(next) <= 0) break;
      next = unlockCommanderSkill(next, skill.id);
    }
    return next;
  });
}

function shouldResolveWarAction(profile: LongHorizonProfile, actionId: string) {
  if (profile === 'rushed') return false;
  if (profile === 'guided' || profile === 'completionist') return true;
  if (profile === 'military') return ['commander-skill', 'research-slot', 'idle-factories', 'idle-formations', 'recovering-formations', 'national-policy'].includes(actionId);
  if (profile === 'state-builder') return ['public-health-crisis', 'public-health-readiness', 'economy-operating-deficit', 'economy-inflation', 'research-slot', 'idle-factories', 'national-policy'].includes(actionId);
  return ['idle-formations', 'research-slot', 'national-policy', 'economy-operating-deficit'].includes(actionId);
}

function nationPromptSet(
  nation: NationManagementState,
  economy: ReturnType<typeof createEconomyState>,
  hasOutbreak: boolean,
  coupRisk: CoupRiskAssessment,
  research: ResearchProject[],
  currentYear: number,
) {
  const actions: Array<{ id: string; priority: UXActionPriority }> = [];
  if (!nation.reports.length) actions.push({ id: 'nation-first-week', priority: 'recommended' });
  if (economy.inflation >= 10) actions.push({ id: 'nation-inflation', priority: 'urgent' });
  if (nation.unrest >= 55) actions.push({ id: 'nation-unrest', priority: 'urgent' });
  if (nation.mandateScore < 50) actions.push({ id: 'nation-mandate', priority: 'recommended' });
  const activeResearch = research.filter((project) => project.active && !project.complete).length;
  if (activeResearch < 2 && research.some((project) => !project.active && !project.complete && getResearchAvailability(project, research, currentYear).available)) {
    actions.push({ id: 'nation-research-slot', priority: activeResearch === 0 ? 'urgent' : 'recommended' });
  }
  if (nation.electoral.activeCampaign) actions.push({
    id: 'nation-election-campaign',
    priority: nation.electoral.activeCampaign.electionWeek - nation.reports[0]?.week <= 2 ? 'urgent' : 'recommended',
  });
  if (getActiveNationAgenda(nation)) actions.unshift({
    id: 'nation-structural-agenda',
    priority: getActiveNationAgenda(nation)!.expiresWeek - (nation.reports[0]?.week ?? 0) <= 4 ? 'urgent' : 'recommended',
  });
  if (hasOutbreak) actions.push({ id: 'nation-health', priority: 'urgent' });
  if (coupRisk.tier !== 'stable') actions.unshift({
    id: 'political-crisis',
    priority: coupRisk.tier === 'critical' || coupRisk.tier === 'dangerous' ? 'urgent' : 'recommended',
  });
  if (actions.length === 0) actions.push({ id: 'nation-stable', priority: 'info' });
  return actions;
}

function averageSupply(staff: Array<{ supply: number }>) {
  return average(staff.map((entry) => entry.supply));
}

function staffMetrics(staff: StaffMember[]) {
  return {
    loyalty: average(staff.map((member) => member.loyalty)),
    overload: average(staff.map((member) => member.workload)),
  };
}

function politicalContext(
  week: number,
  phase: 'war' | 'nation',
  game: GameState,
  economy: ReturnType<typeof createEconomyState>,
  nation: NationManagementState,
  divisions: Array<{ supply: number }>,
  staff: StaffMember[],
  councilTrust: number,
  reputation: number,
): PoliticalCrisisContext {
  const metrics = staffMetrics(staff);
  return {
    week,
    phase,
    game,
    economy,
    nation,
    averageSupply: averageSupply(divisions),
    staffLoyalty: metrics.loyalty,
    staffOverload: metrics.overload,
    councilTrust,
    reputation,
  };
}

function selectedPolicyObjects(ids: string[]) {
  return ids.map((id) => strategicPolicies.find((policy) => policy.id === id)).filter((policy): policy is StrategicPolicy => Boolean(policy));
}

function chooseCouncilChoiceIndex(
  profile: LongHorizonProfile,
  eventId: string,
  week: number,
  scenario?: CenturyScenarioBlueprint,
) {
  if (scenario) return scenario.worldVariant;
  if (profile === 'guided' || profile === 'state-builder') return 1;
  if (profile === 'military') return 0;
  if (profile === 'rushed') return 0;
  return Math.floor(stableRoll(`${profile}:${eventId}:${week}`) * 3) % 3;
}

function chooseWorldVariantIndex(
  profile: LongHorizonProfile,
  eventId: string,
  week: number,
  scenario?: CenturyScenarioBlueprint,
): 0 | 1 | 2 {
  if (scenario) return scenario.worldVariant;
  const configured = profileConfigs[profile].worldVariant;
  if (configured !== 'rotate') return configured;
  return (Math.floor(stableRoll(`${profile}:${eventId}:${week}:world`) * 3) % 3) as 0 | 1 | 2;
}

function chooseNationAgendaChoice(
  profile: LongHorizonProfile,
  issueId: string,
  week: number,
  scenario?: CenturyScenarioBlueprint,
): NationAgendaChoiceId {
  if (scenario) return scenario.agendaChoice;
  if (profile === 'guided') return 'bargain';
  if (profile === 'state-builder') return 'invest';
  if (profile === 'military' || profile === 'rushed') return 'enforce';
  const choices: NationAgendaChoiceId[] = ['bargain', 'invest', 'enforce'];
  return choices[Math.floor(stableRoll(`${profile}:${issueId}:${week}:nation-agenda`) * choices.length) % choices.length];
}

function budgetPriority(
  profile: LongHorizonProfile,
  nation: NationManagementState,
  scenario?: CenturyScenarioBlueprint,
): NationBudgetDomain {
  if (nation.unrest >= 55) return 'welfare';
  if (scenario) return scenario.budgetPriority;
  if (profile === 'military') return 'security';
  if (profile === 'state-builder') return nation.education < nation.civilianIndustry ? 'education' : 'industry';
  if (profile === 'completionist') return nation.infrastructure < nation.welfare ? 'reconstruction' : 'diplomacy';
  return 'industry';
}

function battleStance(profile: LongHorizonProfile, scenario?: CenturyScenarioBlueprint) {
  if (scenario) return scenario.warPosture;
  return profile === 'military' || profile === 'opportunist' ? 'aggressive' as const : profile === 'state-builder' ? 'cautious' as const : 'balanced' as const;
}

function scenarioElectionActions(scenario: CenturyScenarioBlueprint) {
  if (scenario.electionStyle === 'consensus') return ['policy-manifesto', 'coalition-pact', 'public-debate'];
  if (scenario.electionStyle === 'grassroots') return ['local-endorsement', 'mass-rally', 'fundraising-drive'];
  if (scenario.electionStyle === 'media') return ['radio-address', 'public-debate', 'policy-manifesto'];
  return ['fundraising-drive', 'mass-rally', 'coalition-pact'];
}

function scenarioPolicyIds(scenario: CenturyScenarioBlueprint) {
  const economy = scenario.economicModel === 'industrial'
    ? 'economy-mass'
    : scenario.economicModel === 'open-market'
      ? 'economy-distributed'
      : 'economy-balanced';
  const doctrine = scenario.doctrine === 'maneuver'
    ? 'doctrine-maneuver'
    : scenario.doctrine === 'methodical'
      ? 'doctrine-defense'
      : 'doctrine-firepower';
  const society = scenario.economicModel === 'welfare' ? 'society-welfare' : scenario.economicModel === 'security' ? 'society-mobilization' : 'society-autonomy';
  const diplomacy = scenario.diplomaticPosture === 'alliance' || scenario.diplomaticPosture === 'revisionist'
    ? 'diplomacy-bloc'
    : scenario.diplomaticPosture === 'multilateral'
      ? 'diplomacy-aid'
      : 'diplomacy-pragmatic';
  return [economy, doctrine, society, diplomacy];
}

function findingsFor(aggregate: LongHorizonAggregate): LongHorizonFinding[] {
  const findings: LongHorizonFinding[] = [
    {
      priority: 'P0',
      id: 'postwar-personnel-freeze',
      title: '국가 운영 전환 뒤 참모·인재 시간이 멈춥니다',
      evidence: `세션당 평균 ${aggregate.averageStaffFrozenYears.toFixed(1)}년 동안 참모 계약·피로·성장이 진행되지 않았고, ${aggregate.missedPostwarCandidateSessionRate.toFixed(1)}%의 세션에서 후대 인재가 시장에 등장하지 않았습니다.`,
      funImpact: 'FM식 세대교체와 스쿼드 재건이 전후 캠페인에서 사라져 장기 플레이의 핵심 동기가 끊깁니다.',
      recommendation: '국가 운영 주간에도 참모 갱신·은퇴·승계·후대 인재 등장을 실행하고, 4년 임기마다 조직 개편 창을 여십시오.',
    },
    {
      priority: 'P0',
      id: 'research-content-cliff',
      title: '초기 연구 6개 이후 수십 년의 기술 플레이가 비어 있습니다',
      evidence: `연구 완료 중앙값은 ${aggregate.medianResearchCompleteYear ?? '측정 불가'}년이며 이후 연구 공백 중앙값이 ${aggregate.medianResearchDroughtYears.toFixed(1)}년입니다.`,
      funImpact: '1940년대 무기에서 냉전·현대 기술로 발전한다는 장기 목표가 실제 주간 선택으로 이어지지 않습니다.',
      recommendation: '연도·선행기술·국가제도에 따라 열리는 세대형 연구 덱과 민간·군사 공동 프로젝트를 5년 단위로 공급하십시오.',
    },
    {
      priority: 'P0',
      id: 'history-frontloaded',
      title: '세계사 위기가 너무 빨리 소진되고 후반 50여 년이 비어 있습니다',
      evidence: `세계 위기의 ${(aggregate.acceleratedFlashpointRate).toFixed(1)}%가 실제 연도보다 앞당겨졌고, 마지막 위기 뒤 2020년까지 평균 ${aggregate.averageFlashpointDroughtYears.toFixed(1)}년의 공백이 생겼습니다.`,
      funImpact: '초반에는 모달이 몰리고 1970~2020년에는 세계가 반응하지 않아 대체역사 장기 서사가 약해집니다.',
      recommendation: '분기당 고정 1건 대신 사건별 최소 간격·선행조건·지역 연쇄를 두고, 미해결 긴장이 새 사건을 생성하는 동적 위기 감독기를 추가하십시오.',
    },
    {
      priority: 'P0',
      id: 'macro-saturation',
      title: '물가·정치력·적 압력이 장기적으로 극단값에 고정됩니다',
      evidence: `인플레이션 경고 주차 ${aggregate.inflationWarningWeekRate.toFixed(1)}%, 초인플레이션 경험 세션 ${aggregate.hyperinflationSessionRate.toFixed(1)}%, 정치력 1,000 초과 세션 ${aggregate.excessivePoliticalPowerSessionRate.toFixed(1)}%, 적 압력 0 경험 세션 ${aggregate.zeroEnemyPressureSessionRate.toFixed(1)}%입니다.`,
      funImpact: '자원 선택의 기회비용과 위험 신호가 의미를 잃고, 같은 경고를 무시하며 다음 주만 누르는 흐름이 됩니다.',
      recommendation: '시대별 기준값·자원 소프트캡·정책 유지비·경기순환·외부 충격을 도입하고 경고는 상태 변화 때만 재발행하십시오.',
    },
    {
      priority: 'P1',
      id: 'wartime-event-lockout',
      title: '1945~1949 국가 사건 상당수가 국가 운영 전환 뒤 접근 불가능합니다',
      evidence: `국가별 1940년대 사건의 평균 체험률은 ${aggregate.averageHistoricalCouncilCoverage.toFixed(1)}%에 그쳤습니다. 전시 의제 스케줄러가 국가 운영 단계에서는 실행되지 않기 때문입니다.`,
      funImpact: '방금 추가한 독립·종전·재건 사건이 정상적인 전후 전환 플레이에서 보이지 않아 콘텐츠 밀도가 체감되지 않습니다.',
      recommendation: 'CouncilEvent를 전시·전환기·국정 이벤트 큐로 통합하고, 역사 연도보다 상태 조건을 우선해 국가 운영 브리핑에서도 발생시키십시오.',
    },
    {
      priority: 'P1',
      id: 'attention-fatigue',
      title: '장기 캠페인에 비해 경고와 중단의 리듬이 단조롭습니다',
      evidence: `전체 주의 ${aggregate.urgentWeekRate.toFixed(1)}%가 긴급 상태였고 연간 평균 중단은 ${aggregate.interruptionsPerYear.toFixed(1)}회, 프롬프트 대비 실질 결정 비율은 1:${aggregate.promptToDecisionRatio.toFixed(1)}입니다.`,
      funImpact: '중요도 차이가 흐려지고 플레이어가 알림을 읽기보다 일괄 넘기게 됩니다.',
      recommendation: '주간·월간·분기 결정을 분리하고, 반복 경고는 하나의 추적 과제로 묶으며, 정책 시행 후 검증 시점까지 쿨다운을 적용하십시오.',
    },
    {
      priority: 'P1',
      id: 'ending-convergence',
      title: '수많은 선택에 비해 최종 세계선과 결말이 수렴합니다',
      evidence: `300개 세션에서 고유 세계선 코드는 ${aggregate.uniqueWorldlineCodes}개, 고유 결말은 ${aggregate.uniqueEndings}개이며 최빈 결말 비중은 ${aggregate.mostCommonEndingShare.toFixed(1)}%입니다.`,
      funImpact: '선택 수는 많지만 서로 다른 플레이가 같은 결과 카드로 끝나면 대체역사의 소유감이 약해집니다.',
      recommendation: '결말을 단일 카드 대신 정권·경제·사회·기술·국제질서의 조합형 에필로그로 만들고 플레이어의 10대 결정 원인을 직접 인용하십시오.',
    },
  ];

  return findings.map((finding) => {
    if (finding.id === 'postwar-personnel-freeze' && aggregate.averageStaffFrozenYears <= 0.1 && aggregate.missedPostwarCandidateSessionRate === 0) {
      return {
        ...finding,
        priority: 'P2',
        title: '해결됨 · 전후에도 참모와 후보 시장이 순환합니다',
        evidence: `참모 진행 동결 평균 ${aggregate.averageStaffFrozenYears.toFixed(1)}년, 전후 후보 누락 세션 ${aggregate.missedPostwarCandidateSessionRate.toFixed(1)}%로 감소했습니다.`,
        recommendation: '분기 후보 시장과 4년 조직 개편 주기를 유지하면서 국가·직급별 후보 품질만 추가 조정합니다.',
      };
    }
    if (finding.id === 'research-content-cliff' && aggregate.averageFinalResearchCompleted >= 35 && aggregate.researchActiveWeekRate >= 50) {
      return {
        ...finding,
        priority: 'P2',
        title: '해결됨 · 연구가 2020년까지 시대별 프로그램으로 이어집니다',
        evidence: `세션당 평균 ${aggregate.averageFinalResearchCompleted.toFixed(1)}개 연구를 완료했고 전체 기간의 ${aggregate.researchActiveWeekRate.toFixed(1)}%에 활성 연구가 있었습니다.`,
        recommendation: '연도·선행 연구 잠금을 유지하고 각 시대의 민간·군사 파급효과를 더 세분화합니다.',
      };
    }
    if (finding.id === 'history-frontloaded' && aggregate.averageFlashpointDroughtYears <= 5 && aggregate.medianMaximumFlashpointAccelerationYears <= 6) {
      return {
        ...finding,
        priority: 'P2',
        title: '해결됨 · 세계 위기가 역사적 시기와 인과를 따라 2020년까지 계속됩니다',
        evidence: `마지막 위기는 평균 ${aggregate.averageLastFlashpointYear ?? '-'}년에 발생했고 후반 공백은 ${aggregate.averageFlashpointDroughtYears.toFixed(1)}년, 최대 조기 발생 중앙값은 ${aggregate.medianMaximumFlashpointAccelerationYears}년입니다.`,
        recommendation: '동일 범주 연속 발생을 억제한 상태에서 지역별 후속 사건 사슬을 확장합니다.',
      };
    }
    if (finding.id === 'macro-saturation' && aggregate.hyperinflationSessionRate === 0 && aggregate.excessivePoliticalPowerSessionRate === 0 && aggregate.zeroEnemyPressureSessionRate === 0) {
      return {
        ...finding,
        priority: 'P2',
        title: '해결됨 · 물가·정치력·외부 압력이 장기 균형으로 복귀합니다',
        evidence: `초인플레이션, 정치력 1,000 초과, 외부 압력 0 고착 세션이 모두 ${aggregate.hyperinflationSessionRate.toFixed(1)}%입니다.`,
        recommendation: '국가별 경기 주기와 전쟁·평화기 목표 범위를 계속 보정합니다.',
      };
    }
    if (finding.id === 'wartime-event-lockout' && aggregate.averageHistoricalCouncilCoverage >= 99) {
      return {
        ...finding,
        priority: 'P2',
        title: '해결됨 · 1940년대 국가 사건이 전후 운영에서도 이어집니다',
        evidence: `국가별 1940년대 역사 사건 평균 체험률이 ${aggregate.averageHistoricalCouncilCoverage.toFixed(1)}%입니다.`,
        recommendation: '전시·전환기·건국기 우선순위를 유지하면서 미해결 국가 사건을 먼저 제시합니다.',
      };
    }
    if (finding.id === 'attention-fatigue' && aggregate.urgentWeekRate <= 25) {
      return {
        ...finding,
        priority: 'P2',
        title: '개선됨 · 긴급 알림이 실제 악화 신호에 집중됩니다',
        evidence: `긴급 상태 주차가 ${aggregate.urgentWeekRate.toFixed(1)}%이며, 조치한 항목은 검증·관찰 상태를 거친 뒤 재발합니다.`,
        recommendation: '행동 성향별로 남은 반복 경고를 분석해 15% 이하를 목표로 조정합니다.',
      };
    }
    if (finding.id === 'ending-convergence') {
      const endingDiversityResolved = aggregate.uniqueEndings >= 100;
      return {
        ...finding,
        priority: endingDiversityResolved ? 'P2' : 'P1',
        title: `${endingDiversityResolved ? '해결됨' : '개선됨'} · 결말이 다섯 영역의 에필로그와 결정 연쇄를 설명합니다`,
        evidence: `고유 결말 ${aggregate.uniqueEndings}개, 최빈 결말 ${aggregate.mostCommonEndingShare.toFixed(1)}%에 더해 정부·경제·사회·기술·국제질서와 상위 10개 결정 요인을 출력합니다.`,
        recommendation: '후속 검증에서는 선택 조합별 에필로그 문장 중복률과 인과 설명의 가독성을 측정합니다.',
      };
    }
    return finding;
  });
}

export function runLongHorizonSession(
  id: number,
  weeksPlayed = LONG_HORIZON_WEEKS,
  scenario?: CenturyScenarioBlueprint,
): LongHorizonSessionResult {
  const nation = nations[id % nations.length];
  const nationRoles = careerRoles.filter((role) => role.nationId === nation.id);
  const role = nationRoles[Math.floor(id / nations.length) % nationRoles.length];
  const profile = scenario?.profile ?? profiles[id % profiles.length];
  const baseConfig = profileConfigs[profile];
  const config: ProfileConfig = scenario ? {
    ...baseConfig,
    doctrine: scenario.doctrine,
    nationStrategy: scenario.nationStrategy,
    policies: scenarioPolicyIds(scenario),
    electionActions: scenarioElectionActions(scenario),
    worldVariant: scenario.worldVariant,
  } : baseConfig;
  const development = getNationDevelopmentProfile(nation.id);
  const transitionBehaviorWeek = scenario
    ? getCenturyTransitionBehaviorWeek(scenario, config.transitionWeek)
    : config.transitionWeek;
  const transitionSchedule = getNationTransitionSchedule(nation.id, transitionBehaviorWeek, id);
  let game: GameState = { ...baseGame, ...nation.modifiers };
  let stockpile = { ...baseStockpile };
  let production = createCampaignProduction(nation);
  let research = initialResearch.map((project) => ({ ...project }));
  let divisions = createCampaignDivisions(nation);
  const commanders = createCareerCommanders(nation, role);
  let commanderDevelopment = createCommanderDevelopment(commanders);
  let staff = createStaffRoster(nation.id, role.id);
  const staffWeeklyCost = staff.reduce((sum, member) => sum + member.weeklyCost, 0);
  const economyAdvisor = staff.find((member) => member.department === 'economy');
  const economyAdvisorBonus = economyAdvisor?.delegated ? economyAdvisor.ability / 13 : 0;
  let economy = createEconomyState(nation.id);
  let publicHealth = createPublicHealthState(createPublicHealthSeed(nation.id, role.id));
  let relations = createDiplomaticRelations(nation.id);
  let territories = initialTerritories.map((territory) => ({ ...territory, neighbors: [...territory.neighbors] }));
  const operations = createCovertOperations(nation.defaultTheater, nation.id);
  let selectedPolicies: StrategicPolicy[] = [];
  const policyQueue = selectedPolicyObjects(config.policies);
  let orders: Order[] = [];
  let phase: 'war' | 'nation' = 'war';
  let nationState = createNationManagementState(nation.id, game, economy, 0, 'negotiated');
  let politicalState = createPoliticalCrisisState(nation.id);
  let reputation = 45;
  let councilTrust = 50;
  const worldHistoryState: WorldHistoryState = { seed: createWorldHistorySeed(nation.id, role.id), choices: {} };
  const completedDecisions: string[] = [];
  // Flashpoint eligibility and ordering depend on the immutable event definitions and their
  // historical years. Player choices are regenerated into the final worldline at the end.
  const schedulingTimeline = generateWorldline({
    nation,
    game,
    state: worldHistoryState,
    trajectory: deriveEmergentHistory({
      doctrine: config.doctrine,
      roleBranch: role.branch,
      game,
      operations,
      relations,
    }),
  }).timeline;
  const resolvedCouncilIds = new Set<string>();
  const seenCouncilIds = new Set<string>();
  const seenHistoricalCouncilIds = new Set<string>();
  const currentActionRun: Record<string, number> = {};
  const longestActionRun: Record<string, number> = {};
  const actionVerificationUntil = new Map<string, number>();
  const endingDecisionWeeks = new Set<number>();
  const endingDecisionTrace: string[] = [];
  const eraMetrics = new Map<string, LongHorizonEraMetric>();
  let actionPrompts = 0;
  let urgentPromptWeeks = 0;
  let recommendedPromptWeeks = 0;
  let quietWeeks = 0;
  let decisionInteractions = 0;
  let interruptionCount = 0;
  let battleCount = 0;
  let battleVictories = 0;
  let strategicOperationCount = 0;
  let councilDecisionCount = 0;
  let worldFlashpointCount = 0;
  let acceleratedFlashpointCount = 0;
  let maximumFlashpointAccelerationYears = 0;
  let firstFlashpointYear: number | null = null;
  let lastFlashpointYear: number | null = null;
  let electionCount = 0;
  let electionWins = 0;
  let electionCampaignActions = 0;
  let coupAttempts = 0;
  let coupPrevented = 0;
  let coupCompromises = 0;
  let coupSuccesses = 0;
  let unresolvedCoupResponses = 0;
  let outbreakCount = 0;
  let outbreakWeeks = 0;
  let economicEventCount = 0;
  let inflationWarningWeeks = 0;
  let hyperinflationWeeks = 0;
  let treasuryZeroWeeks = 0;
  let excessivePoliticalPowerWeeks = 0;
  let excessiveCommandPointWeeks = 0;
  let zeroEnemyPressureWeeks = 0;
  let nationalScoreCeilingWeeks = 0;
  let researchCompleteWeek: number | null = null;
  let researchIdleWeeks = 0;
  let currentResearchIdleRun = 0;
  let researchLongestIdleRun = 0;
  let staffWeeksAdvanced = 0;
  let expiredStaffAtTransition = 0;
  let laterEraCandidatesAtTransition = 0;
  // A short diagnostic run can end before a country reaches its transition gate.
  // In that case the whole run remains wartime instead of reporting the planned
  // target week as though the transition had actually happened.
  let actualTransitionWeek = weeksPlayed;
  let koreaLiberationAtTransition: KoreaLiberationAssessment | null = null;
  let koreaTransitionMode: LongHorizonSessionResult['koreaTransitionMode'] = null;
  const discoveredLaterEraIds = new Set<string>();
  let previousOutbreakId: string | null = null;
  let previousElectionResultId: string | null = null;

  const recordActions = (actions: Array<{ id: string; priority: UXActionPriority }>, week: number) => {
    actions.forEach((action) => {
      if ((currentActionRun[action.id] ?? 0) >= 4 && (actionVerificationUntil.get(action.id) ?? -1) < week) {
        actionVerificationUntil.set(action.id, week + 13);
      }
    });
    const displayedActions = actions.map((action) => actionVerificationUntil.get(action.id)! >= week
      ? { ...action, priority: 'info' as const }
      : action);
    actionPrompts += actions.length;
    if (displayedActions.some((action) => action.priority === 'urgent')) urgentPromptWeeks += 1;
    if (displayedActions.some((action) => action.priority === 'recommended')) recommendedPromptWeeks += 1;
    if (displayedActions.every((action) => action.priority === 'info')) quietWeeks += 1;
    const activeIds = new Set(displayedActions.filter((action) => action.priority !== 'info').map((action) => action.id));
    const knownIds = new Set([...Object.keys(currentActionRun), ...activeIds]);
    knownIds.forEach((actionId) => {
      currentActionRun[actionId] = activeIds.has(actionId) ? (currentActionRun[actionId] ?? 0) + 1 : 0;
      longestActionRun[actionId] = Math.max(longestActionRun[actionId] ?? 0, currentActionRun[actionId]);
    });
    if (displayedActions.length > 0 && displayedActions.some((action) => action.priority !== 'info')) endingDecisionWeeks.add(week);
  };
  const markActionHandled = (actionId: string, week: number, verificationWeeks = 13) => {
    actionVerificationUntil.set(actionId, week + verificationWeeks);
  };
  const recordDecisionTrace = (week: number, signature: string) => {
    endingDecisionWeeks.add(week);
    endingDecisionTrace.push(`${getCampaignYear(week)}:${signature}`);
    if (endingDecisionTrace.length > 128) endingDecisionTrace.shift();
  };

  const applyCouncilChoice = (week: number) => {
    const resolvedChoices = [...resolvedCouncilIds].map((eventId) => `${eventId}:resolved`);
    const councilEvent = selectNextCouncilEvent(nation.id, role.branch, getCampaignYear(week), resolvedChoices);
    if (!councilEvent) return false;
    const choice = councilEvent.choices[chooseCouncilChoiceIndex(profile, councilEvent.id, week, scenario)];
    game = applyGameDelta(game, choice.effect.gameDelta ?? {});
    if (choice.effect.divisionSupply || choice.effect.divisionOrganization) {
      divisions = divisions.map((division) => ({
        ...division,
        supply: clamp(division.supply + (choice.effect.divisionSupply ?? 0), 0, 100),
        organization: clamp(division.organization + (choice.effect.divisionOrganization ?? 0), 0, 100),
      }));
    }
    if (choice.effect.productionEfficiency) production = production.map((line) => ({ ...line, efficiency: clamp(line.efficiency + (choice.effect.productionEfficiency ?? 0), 0, 100) }));
    if (choice.effect.relationChange) relations = relations.map((relation) => ({ ...relation, value: clamp(relation.value + (choice.effect.relationChange ?? 0), 0, 100) }));
    reputation = clamp(reputation + (choice.effect.careerReputation ?? 0), 0, 100);
    councilTrust = clamp(councilTrust + (choice.effect.careerTrust ?? 0), 0, 100);
    resolvedCouncilIds.add(councilEvent.id);
    seenCouncilIds.add(councilEvent.id);
    if (councilEvent.nationIds?.includes(nation.id) && councilEvent.historicalYear) seenHistoricalCouncilIds.add(councilEvent.id);
    councilDecisionCount += 1;
    decisionInteractions += 1;
    interruptionCount += 1;
    recordDecisionTrace(week, `council:${councilEvent.id}:${choice.id}`);
    return true;
  };

  const refreshLaterEraMarket = (week: number) => {
    if (week % 13 !== 0) return;
    createLaterEraCandidates(nation.id, getCampaignYear(week), getHistoricalHorizon(week, completedDecisions))
      .filter((candidate) => !discoveredLaterEraIds.has(candidate.personId))
      .slice(0, 4)
      .forEach((candidate) => discoveredLaterEraIds.add(candidate.personId));
  };

  const applyWorldFlashpoint = (week: number) => {
    if (worldFlashpointCount >= schedulingTimeline.length) return false;
    const selection = selectNextWorldFlashpoint(schedulingTimeline, week, completedDecisions);
    if (!selection) return false;
    const variant = selection.entry.event.variants[chooseWorldVariantIndex(profile, selection.entry.event.id, week, scenario)];
    const effects = deriveWorldFlashpointEffects(selection.entry.event.id, selection.entry.event.category, variant);
    game = applyGameDelta(game, effects.gameDelta);
    (Object.entries(effects.stockpileDelta) as Array<[keyof Stockpile, number]>).forEach(([key, value]) => {
      stockpile[key] = Math.max(0, stockpile[key] + value);
    });
    if (effects.relationChange) relations = relations.map((relation) => ({ ...relation, value: clamp(relation.value + effects.relationChange, 0, 100) }));
    worldHistoryState.choices[selection.entry.event.id] = variant.id;
    completedDecisions.push(getWorldFlashpointDecisionId(selection.entry.event.id, variant.id, week));
    const campaignYear = getCampaignYear(week);
    const acceleration = Math.max(0, selection.entry.event.historicalYear - campaignYear);
    worldFlashpointCount += 1;
    if (selection.accelerated) acceleratedFlashpointCount += 1;
    maximumFlashpointAccelerationYears = Math.max(maximumFlashpointAccelerationYears, acceleration);
    firstFlashpointYear ??= campaignYear;
    lastFlashpointYear = campaignYear;
    decisionInteractions += 1;
    interruptionCount += 1;
    recordDecisionTrace(week, `world:${selection.entry.event.id}:${variant.id}`);
    return true;
  };

  const processPoliticalCrisis = (week: number) => {
    const context = politicalContext(week, phase, game, economy, nationState, divisions, staff, councilTrust, reputation);
    const result = advancePoliticalCrisisWeek(politicalState, context);
    politicalState = result.state;
    if (!result.incident) return false;
    coupAttempts += 1;
    interruptionCount += 1;
    recordDecisionTrace(week, `crisis:${result.incident.kind}:${result.incident.leadingFactionId}`);
    const preferredResponseId = scenario?.crisisApproach === 'constitutional'
      ? 'constitutional-appeal'
      : scenario?.crisisApproach === 'negotiation'
        ? 'faction-negotiation'
        : scenario?.crisisApproach === 'command'
          ? 'loyal-command'
          : scenario?.crisisApproach === 'counter-intelligence'
            ? 'counter-operation'
            : null;
    const forecasts = getCoupResponseForecasts(result.incident, role, context)
      .filter((forecast) => forecast.allowed)
      .sort((left, right) => Number(right.id === preferredResponseId) - Number(left.id === preferredResponseId)
        || right.successChance - left.successChance);
    let resolution = null;
    for (const forecast of forecasts) {
      resolution = resolveCoupAttempt(politicalState, result.incident, role, context, forecast.id);
      if (resolution) break;
    }
    if (!resolution) {
      unresolvedCoupResponses += 1;
      return true;
    }
    politicalState = resolution.state;
    game = applyGameDelta(game, resolution.gameDelta);
    reputation = clamp(reputation + resolution.careerDelta.reputation, 0, 100);
    councilTrust = clamp(councilTrust + resolution.careerDelta.councilTrust, 0, 100);
    nationState = {
      ...nationState,
      unrest: clamp(nationState.unrest + resolution.nationDelta.unrest, 0, 100),
      legitimacy: clamp(nationState.legitimacy + resolution.nationDelta.legitimacy, 0, 100),
      mandateScore: clamp(nationState.mandateScore + resolution.nationDelta.mandateScore, 0, 100),
    };
    if (resolution.outcome === 'prevented') coupPrevented += 1;
    else if (resolution.outcome === 'compromise') coupCompromises += 1;
    else coupSuccesses += 1;
    decisionInteractions += 1;
    recordDecisionTrace(week, `crisis-resolution:${resolution.outcome}:${forecasts[0]?.id ?? 'none'}`);
    markActionHandled('political-crisis', week, 26);
    return true;
  };

  const getKoreaLiberationAssessment = (week: number) => assessKoreaLiberationReadiness({
    politicalPower: game.politicalPower,
    stability: game.stability,
    warSupport: game.warSupport,
    intelNetwork: game.intelNetwork,
    averageStrength: average(divisions.map((division) => division.strength)),
    averageSupply: average(divisions.map((division) => division.supply)),
    objectiveProgress: game.victoryScore,
    victoryScore: game.victoryScore,
    battleVictories,
    relationAverage: average(relations.map((relation) => relation.value)),
    weeksElapsed: week,
    territories,
  });

  const transitionToNation = (
    week: number,
    mode: Exclude<LongHorizonSessionResult['koreaTransitionMode'], null> = 'fixed-timer',
  ) => {
    actualTransitionWeek = week;
    if (nation.id === 'korea') {
      koreaTransitionMode = mode;
      koreaLiberationAtTransition = getKoreaLiberationAssessment(week);
    }
    phase = 'nation';
    nationState = createNationManagementState(
      nation.id,
      game,
      economy,
      research.filter((project) => project.complete).length,
      development.transition.outcome,
    );
    recordDecisionTrace(week, `transition:${development.transition.archetype}:${development.transition.outcome}:${mode}`);
    if (koreaLiberationAtTransition) {
      nationState = {
        ...nationState,
        legitimacy: clamp(nationState.legitimacy + Math.round((koreaLiberationAtTransition.score - koreaLiberationAtTransition.partitionRisk) / 12), 0, 100),
        unrest: clamp(nationState.unrest + Math.round((koreaLiberationAtTransition.partitionRisk - 35) / 8), 0, 100),
        institutionalCapacity: clamp(nationState.institutionalCapacity + Math.round(koreaLiberationAtTransition.score / 18), 0, 100),
      };
      territories = territories.map((territory) => territory.id === 'korea' ? {
        ...territory,
        controller: nation.alignment,
        ownerId: 'korea',
        supply: Math.max(territory.supply, koreaLiberationAtTransition?.tracks.find((track) => track.id === 'return')?.value ?? 50),
      } : territory);
    }
    nationState = { ...nationState, strategyId: config.nationStrategy };
    if (scenario) {
      nationState = rebalanceNationBudget(
        rebalanceNationBudget(nationState, scenario.budgetPriority, 5),
        scenario.technologyPosture === 'civilian' || scenario.technologyPosture === 'frontier' ? 'education' : 'security',
        5,
      );
    } else if (profile === 'state-builder') {
      nationState = rebalanceNationBudget(rebalanceNationBudget(nationState, 'education', 5), 'industry', 5);
    } else if (profile === 'guided' || profile === 'completionist') {
      nationState = rebalanceNationBudget(nationState, 'welfare', 5);
    }
    const planId: NationalPlanId | null = scenario
      ? scenario.futurePriority === 'climate'
        ? 'climate-resilience'
        : scenario.futurePriority === 'human-development'
          ? 'social-capability'
          : scenario.futurePriority === 'strategic-autonomy'
            ? 'secure-transition'
            : 'knowledge-economy'
      : profile === 'military'
      ? 'secure-transition'
      : profile === 'state-builder'
        ? 'knowledge-economy'
        : profile === 'guided'
          ? 'social-capability'
          : profile === 'completionist'
            ? 'climate-resilience'
            : profile === 'opportunist'
              ? 'open-prosperity'
              : null;
    if (planId) {
      const plan = launchNationalPlan(nationState.nationalPlanning, planId, week, {
        nationalScore: nationState.nationalScore,
        mandateScore: nationState.mandateScore,
        legitimacy: nationState.legitimacy,
        welfare: nationState.welfare,
        education: nationState.education,
        civilianIndustry: nationState.civilianIndustry,
        institutionalCapacity: nationState.institutionalCapacity,
        inequality: nationState.inequality,
        unrest: nationState.unrest,
        relativeCompetitiveness: nationState.relativeCompetitiveness,
        demographicPressure: nationState.demographicPressure,
        ecologicalPressure: nationState.ecologicalPressure,
        hegemonyCost: nationState.hegemonyCost,
        relationAverage: average(relations.map((relation) => relation.value)),
      });
      if (plan) nationState = { ...nationState, nationalPlanning: plan };
    }
    expiredStaffAtTransition = staff.filter((member) => (member.contractWeeksRemaining ?? 0) <= 0).length;
    laterEraCandidatesAtTransition = discoveredLaterEraIds.size;
  };

  for (let index = 0; index < weeksPlayed; index += 1) {
    const nextWeek = index + 1;
    game.week = index;
    const eraYear = getCampaignYear(nextWeek);
    const eraRange = getEraRange(eraYear);
    const eraMetric = eraMetrics.get(eraRange.era) ?? createEraMetric(eraYear);
    eraMetrics.set(eraRange.era, eraMetric);
    const eraBefore = {
      actionPrompts,
      urgentPromptWeeks,
      quietWeeks,
      decisionInteractions,
      interruptionCount,
      battleCount,
      strategicOperationCount,
      worldFlashpointCount,
      electionCount,
      coupAttempts,
      outbreakCount,
    };
    const currentAverageSupply = averageSupply(divisions);
    const outbreakBefore = publicHealth.activeOutbreak?.id ?? null;

    if (phase === 'war') {
      const ledger = calculateEconomyLedger(economy, { week: nextWeek, nationId: nation.id, game, staffWeeklyCost, economyAdvisorBonus });
      const actions = deriveUXActions({
        factories: game.factories,
        production,
        research,
        selectedPolicies: selectedPolicies.map((policy) => policy.id),
        divisions,
        orders,
        commanderDevelopment,
        publicHealth,
        economyOperatingBalance: ledger.operatingRevenue - ledger.totalExpenses,
        economyInflation: economy.inflation,
        economyDebt: economy.debt,
        currentYear: getCampaignYear(nextWeek),
      });
      recordActions(actions, nextWeek);
      const allowed = actions.filter((action) => shouldResolveWarAction(profile, action.id));
      const attempts = profile === 'guided' ? allowed.slice(0, 1) : allowed;
      let battleRequested = nextWeek % config.battleCadence === 0;
      attempts.forEach((action) => {
        decisionInteractions += 1;
        recordDecisionTrace(nextWeek, `war-action:${action.id}`);
        markActionHandled(action.id, nextWeek, 4);
        if (action.id === 'idle-factories') production = completeFactories(production, game.factories);
        if (action.id === 'research-slot') research = fillOpenResearchSlots(research, getCampaignYear(nextWeek));
        if (action.id === 'national-policy' && selectedPolicies.length < policyQueue.length) {
          const policy = policyQueue[selectedPolicies.length];
          selectedPolicies = [...selectedPolicies, policy];
          game = applyGameDelta(game, policy.gameDelta);
        }
        if (action.id === 'idle-formations') battleRequested = true;
        if (action.id === 'commander-skill') commanderDevelopment = unlockAvailableSkills(commanderDevelopment);
        if (action.id === 'economy-operating-deficit') economy = { ...economy, taxPolicy: 'total-war', bondProgram: 'institutional' };
        if (action.id === 'economy-inflation') economy = { ...economy, priceControl: 'comprehensive', bondProgram: 'none' };
        if (action.id === 'public-health-crisis' || action.id === 'public-health-readiness') publicHealth = { ...publicHealth, policyId: recommendPublicHealthPolicy(publicHealth, game).policyId };
      });

      divisions = divisions.map((division) => division.status === 'recovering' ? {
        ...division,
        strength: clamp(division.strength + 3, 0, 100),
        organization: clamp(division.organization + 11, 0, 100),
        supply: clamp(division.supply + 5, 0, 100),
        status: division.organization + 11 >= 70 ? 'ready' : 'recovering',
      } : division);

      if (battleRequested && profile !== 'rushed') {
        const division = divisions[0];
        const commander = commanders.find((candidate) => candidate.id === division.commanderId) ?? commanders[0];
        const target = territories.find((candidate) => nation.strategicTargets.includes(candidate.id)) ?? territories[0];
        if (division && commander && target) {
          orders = [{ divisionId: division.id, fromId: division.territoryId, targetId: target.id, startedWeek: nextWeek, stance: battleStance(profile, scenario) }];
          const input = {
            week: nextWeek,
            division,
            commander,
            target,
            stance: battleStance(profile, scenario),
            enemyPressure: game.enemyPressure,
            intelNetwork: game.intelNetwork,
            doctrineBonus: config.doctrine === 'maneuver' && division.type === 'armor' ? 14 : config.doctrine === 'methodical' ? 7 : 4,
            policyAttackBonus: selectedPolicies.reduce((sum, policy) => sum + (policy.attackBonus ?? 0), 0),
            priorityBonus: 0,
          };
          forecastBattle(input);
          const report = resolveBattle({
            ...input,
            randomRolls: [0, 1, 2, 3].map((salt) => stableRoll(`${id}:${nextWeek}:battle:${salt}`)) as [number, number, number, number],
          });
          const record = getCommanderRecord(commanderDevelopment, commander);
          const development = recordBattleExperience(record, report, input.stance);
          commanderDevelopment = commanderDevelopment.map((candidate) => candidate.commanderId === commander.id ? development.record : candidate);
          divisions = divisions.map((candidate) => candidate.id === division.id ? {
            ...candidate,
            strength: clamp(candidate.strength - report.attackerStrengthLoss, 25, 100),
            organization: clamp(candidate.organization - report.organizationLoss, 18, 100),
            supply: clamp(candidate.supply - report.supplySpent, 12, 100),
            status: 'recovering',
          } : candidate);
          game = applyGameDelta(game, report.victory ? { victoryScore: target.value, warSupport: 2, manpower: -report.attackerStrengthLoss * 3 } : { warSupport: -2, manpower: -report.attackerStrengthLoss * 3 });
          battleCount += 1;
          if (report.victory) battleVictories += 1;
          decisionInteractions += 1;
          recordDecisionTrace(nextWeek, `battle:${target.id}:${report.victory ? 'victory' : 'defeat'}:${input.stance}`);
        }
      }
      orders = [];

      const economyResult = advanceEconomyWeek(economy, { week: nextWeek, nationId: nation.id, game, staffWeeklyCost, economyAdvisorBonus });
      economy = economyResult.state;
      if (economyResult.event) economicEventCount += 1;
      const healthResult = advancePublicHealthWeek(publicHealth, {
        week: nextWeek,
        nationId: nation.id,
        theater: nation.defaultTheater,
        enemyPressure: game.enemyPressure,
        stability: game.stability,
        averageSupply: currentAverageSupply,
        scienceBonus: economyAdvisor?.ability ? economyAdvisor.ability / 25 : 0,
      });
      publicHealth = healthResult.state;
      research = advanceResearchProjects(research, config.doctrine === 'methodical' ? 16 : 13, getCampaignYear(nextWeek));
      commanderDevelopment = commanderDevelopment.map((record) => ({ ...record, xp: Math.min(155, record.xp + (battleRequested ? 7 : 3)) }));
      staff = advanceStaffRosterWeek(staff);
      staffWeeksAdvanced += 1;
      refreshLaterEraMarket(nextWeek);
      const productionGains = calculateProductionGains(production, nextWeek);
      (Object.keys(productionGains) as Array<keyof Stockpile>).forEach((key) => { stockpile[key] += productionGains[key]; });
      production = production.map((line) => ({ ...line, efficiency: clamp(line.efficiency + (line.assigned > 0 ? 1 : 0), 0, 100) }));
      game = applyGameDelta({
        ...game,
        week: nextWeek,
        manpower: game.manpower + 18,
        politicalPower: Math.min(200, game.politicalPower + 3),
        fuel: clamp(game.fuel + 8 - game.factories * 0.18, 0, 200),
        steel: clamp(game.steel + 9, 0, 240),
        commandPoints: Math.min(100, game.commandPoints + 6),
        airPower: Math.min(100, game.airPower + (nextWeek % 4 === 0 ? 1 : 0)),
        navalPower: clamp(game.navalPower + (nextWeek % 3 === 0 ? 1 : 0), 20, 100),
        enemyPressure: Math.min(100, game.enemyPressure + (nextWeek % 4 === 0 ? 2 : 0)),
      }, economyResult.gameDelta);
      game = applyGameDelta(game, healthResult.gameDelta);
      if (healthResult.supplyLoss || healthResult.organizationLoss) divisions = divisions.map((division) => ({
        ...division,
        supply: clamp(division.supply - healthResult.supplyLoss, 12, 100),
        organization: clamp(division.organization - healthResult.organizationLoss, 18, 100),
      }));

      const openedCoup = processPoliticalCrisis(nextWeek);
      const openedFlashpoint = !openedCoup && nextWeek % WORLD_FLASHPOINT_INTERVAL_WEEKS === 0 && applyWorldFlashpoint(nextWeek);
      if (!openedCoup && !openedFlashpoint && nextWeek % 52 === 26) applyCouncilChoice(nextWeek);
      if (nextWeek >= transitionSchedule.earliestWeek) {
        const readiness = calculateTransitionReadiness(
          { ...game, week: nextWeek },
          average(relations.map((relation) => relation.value)),
          economy,
          nation.id,
        );
        const reachedTarget = nextWeek >= transitionSchedule.targetWeek;
        const extraordinaryExit = readiness.score >= transitionSchedule.extraordinaryThreshold && game.victoryScore >= 72;
        const deadlineReached = nextWeek >= transitionSchedule.deadlineWeek;
        if (nation.id !== 'korea') {
          if ((reachedTarget && readiness.eligible) || extraordinaryExit) transitionToNation(nextWeek, readiness.eligible ? 'readiness' : 'fixed-timer');
          else if (deadlineReached) transitionToNation(nextWeek, 'deadline');
        } else {
          const liberation = getKoreaLiberationAssessment(nextWeek);
          if ((reachedTarget && readiness.eligible && liberation.eligible) || (extraordinaryExit && liberation.score >= 72)) transitionToNation(nextWeek, 'readiness');
          else if (deadlineReached) transitionToNation(nextWeek, 'deadline');
        }
      }
    } else {
      const contextBefore = politicalContext(nextWeek, phase, game, economy, nationState, divisions, staff, councilTrust, reputation);
      const coupRisk = assessCoupRisk(politicalState, contextBefore);
      const prompts = nationPromptSet(nationState, economy, Boolean(publicHealth.activeOutbreak), coupRisk, research, getCampaignYear(nextWeek));
      recordActions(prompts, nextWeek);
      const activeAgenda = getActiveNationAgenda(nationState);
      if (activeAgenda && (profile !== 'rushed' || nextWeek >= activeAgenda.expiresWeek)) {
        const choiceId = chooseNationAgendaChoice(profile, activeAgenda.id, nextWeek, scenario);
        const agendaResult = resolveNationAgendaChoice(nationState, choiceId, nextWeek);
        if (agendaResult) {
          nationState = agendaResult.state;
          game = applyGameDelta(game, agendaResult.gameDelta);
          economy = {
            ...economy,
            debt: Math.max(0, economy.debt + agendaResult.economyDelta.debt),
            inflation: clamp(economy.inflation + agendaResult.economyDelta.inflation, 0, 100),
            publicConfidence: clamp(economy.publicConfidence + agendaResult.economyDelta.publicConfidence, 0, 100),
          };
          completedDecisions.push(`nation-agenda:${nation.id}:${activeAgenda.id}:${choiceId}:${nextWeek}`);
          decisionInteractions += 1;
          recordDecisionTrace(nextWeek, `nation-agenda:${activeAgenda.id}:${choiceId}`);
          markActionHandled('nation-structural-agenda', nextWeek, development.agendaCadenceWeeks);
        }
      }

      // A non-rushed player who is shown the political-crisis command surface uses one
      // affordable, role-appropriate preventive action during the quarterly review. This
      // measures the full detect -> act -> verify loop instead of counting an ignored modal
      // as a permanent UX failure for otherwise attentive profiles.
      if (profile !== 'rushed' && coupRisk.tier !== 'stable' && nextWeek % 13 === 0) {
        const scenarioPreventionOrder = scenario?.crisisApproach === 'negotiation'
          ? ['faction-dialogue', 'public-relief', 'security-audit', 'loyalty-review'] as const
          : scenario?.crisisApproach === 'command'
            ? ['loyalty-review', 'security-audit', 'public-relief', 'faction-dialogue'] as const
            : scenario?.crisisApproach === 'counter-intelligence'
              ? ['security-audit', 'loyalty-review', 'faction-dialogue', 'public-relief'] as const
              : scenario?.crisisApproach === 'constitutional'
                ? ['public-relief', 'faction-dialogue', 'loyalty-review', 'security-audit'] as const
                : null;
        const preventionOrder = scenarioPreventionOrder ?? (role.branch === 'politics'
          ? ['public-relief', 'faction-dialogue', 'security-audit', 'loyalty-review'] as const
          : role.branch === 'intelligence'
            ? ['public-relief', 'security-audit', 'faction-dialogue', 'loyalty-review'] as const
            : ['public-relief', 'loyalty-review', 'security-audit', 'faction-dialogue'] as const);
        const prevention = preventionOrder
          .map((id) => applyCoupPrevention(politicalState, contextBefore, role, id))
          .find((result) => result !== null);
        if (prevention) {
          politicalState = prevention.state;
          game = applyGameDelta(game, prevention.gameDelta);
          decisionInteractions += 1;
          recordDecisionTrace(nextWeek, `crisis-prevention:${coupRisk.crisisLabel}:${prevention.state.lastOutcome ?? role.branch}`);
          markActionHandled('political-crisis', nextWeek, 13);
        }
      }

      const campaign = nationState.electoral.activeCampaign;
      if (campaign && config.electionActions.length > 0 && nextWeek % (profile === 'completionist' ? 1 : 2) === 0) {
        const configuredId = config.electionActions[electionActionDefinitions.length
          ? Math.floor(nextWeek / 2) % config.electionActions.length
          : 0];
        const definition = electionActionDefinitions.find((candidate) => candidate.id === configuredId);
        if (definition) {
          const needsRegion = definition.id === 'mass-rally' || definition.id === 'local-endorsement';
          const actionResult = applyElectionCampaignAction(
            nationState.electoral,
            definition.id,
            needsRegion ? nationState.electoral.regions[Math.floor(nextWeek / 2) % nationState.electoral.regions.length]?.id ?? null : null,
            {
              week: nextWeek,
              role,
              politicalPower: game.politicalPower,
              treasury: game.treasury,
              stability: game.stability,
              legitimacy: nationState.legitimacy,
              mandateScore: nationState.mandateScore,
              unrest: nationState.unrest,
              education: nationState.education,
              institutionalCapacity: nationState.institutionalCapacity,
              inflation: economy.inflation,
              publicConfidence: economy.publicConfidence,
            },
          );
          if (actionResult) {
            nationState = {
              ...nationState,
              electoral: actionResult.state,
              legitimacy: clamp(nationState.legitimacy + actionResult.legitimacyDelta, 0, 100),
              unrest: clamp(nationState.unrest + actionResult.unrestDelta, 0, 100),
            };
            game = applyGameDelta(game, { politicalPower: actionResult.politicalPowerDelta, treasury: actionResult.treasuryDelta });
            electionCampaignActions += 1;
            decisionInteractions += 1;
            recordDecisionTrace(nextWeek, `election:${campaign.type}:${definition.id}`);
            markActionHandled('nation-election-campaign', nextWeek, 2);
          }
        }
      }

      if (profile !== 'rushed' && nextWeek % 13 === 0 && (economy.inflation >= 10 || nationState.unrest >= 55 || nationState.mandateScore < 50)) {
        const domain = budgetPriority(profile, nationState, scenario);
        nationState = rebalanceNationBudget(nationState, domain, 5);
        if (economy.inflation >= 10) nationState = { ...nationState, spendingLevel: Math.max(35, nationState.spendingLevel - 1), taxBurden: Math.min(72, nationState.taxBurden + 1) };
        decisionInteractions += 1;
        recordDecisionTrace(nextWeek, `budget:${domain}:${economy.inflation >= 10 ? 'anti-inflation' : 'social-response'}`);
        if (economy.inflation >= 10) markActionHandled('nation-inflation', nextWeek, 13);
        if (nationState.unrest >= 55) markActionHandled('nation-unrest', nextWeek, 13);
        if (nationState.mandateScore < 50) markActionHandled('nation-mandate', nextWeek, 13);
      }
      if (profile !== 'rushed' && publicHealth.activeOutbreak) {
        publicHealth = { ...publicHealth, policyId: recommendPublicHealthPolicy(publicHealth, game).policyId };
        markActionHandled('nation-health', nextWeek, 4);
      }
      if (profile !== 'rushed' && prompts.some((prompt) => prompt.id === 'nation-research-slot')) {
        research = fillOpenResearchSlots(research, getCampaignYear(nextWeek));
        decisionInteractions += 1;
        recordDecisionTrace(nextWeek, `research:${research.filter((project) => project.active && !project.complete).map((project) => project.id).join('+')}`);
        markActionHandled('nation-research-slot', nextWeek, 4);
      }
      if (profile !== 'rushed' && !nationState.strategicContinuity.active && nextWeek % 13 === 0) {
        const availableOperations = getAvailableStrategicOperations(nationState.strategicContinuity, role, getCampaignYear(nextWeek));
        const operation = availableOperations[Math.floor(stableRoll(`${id}:${nextWeek}:strategic-operation`) * Math.max(1, availableOperations.length))];
        if (operation) {
          const launch = launchStrategicOperation(nationState.strategicContinuity, operation.id, {
            week: nextWeek,
            role,
            politicalPower: game.politicalPower,
            treasury: game.treasury,
            commandPoints: game.commandPoints,
            stability: game.stability,
            legitimacy: nationState.legitimacy,
            institutionalCapacity: nationState.institutionalCapacity,
            securityBudget: nationState.budget.security,
            diplomacyBudget: nationState.budget.diplomacy,
            intelNetwork: game.intelNetwork,
            enemyPressure: game.enemyPressure,
          });
          if (launch) {
            nationState = { ...nationState, strategicContinuity: launch.state };
            game = applyGameDelta(game, launch.gameDelta);
            strategicOperationCount += 1;
            decisionInteractions += 1;
            recordDecisionTrace(nextWeek, `strategic-operation:${operation.id}`);
          }
        }
      }
      if (profile !== 'rushed' && !nationState.nationalPlanning.active && nextWeek % 52 === 0) {
        const planId: NationalPlanId = nationState.ecologicalPressure >= 48
          ? 'climate-resilience'
          : nationState.demographicPressure >= 48
            ? 'social-capability'
            : nationState.hegemonyCost >= 42
              ? 'plural-state'
              : nationState.relativeCompetitiveness < 58
                ? 'knowledge-economy'
                : 'open-prosperity';
        const metrics: NationalPlanMetrics = {
          nationalScore: nationState.nationalScore,
          mandateScore: nationState.mandateScore,
          legitimacy: nationState.legitimacy,
          welfare: nationState.welfare,
          education: nationState.education,
          civilianIndustry: nationState.civilianIndustry,
          institutionalCapacity: nationState.institutionalCapacity,
          inequality: nationState.inequality,
          unrest: nationState.unrest,
          relativeCompetitiveness: nationState.relativeCompetitiveness,
          demographicPressure: nationState.demographicPressure,
          ecologicalPressure: nationState.ecologicalPressure,
          hegemonyCost: nationState.hegemonyCost,
          relationAverage: average(relations.map((relation) => relation.value)),
        };
        const planning = launchNationalPlan(nationState.nationalPlanning, planId, nextWeek, metrics);
        if (planning) {
          nationState = { ...nationState, nationalPlanning: planning };
          decisionInteractions += 1;
          recordDecisionTrace(nextWeek, `national-plan:${planId}`);
        }
      }

      const healthResult = advancePublicHealthWeek(publicHealth, {
        week: nextWeek,
        nationId: nation.id,
        theater: nation.defaultTheater,
        enemyPressure: game.enemyPressure,
        stability: game.stability,
        averageSupply: currentAverageSupply,
        scienceBonus: economyAdvisor?.ability ? economyAdvisor.ability / 25 : 0,
      });
      publicHealth = healthResult.state;
      const publicHealthPressure = publicHealth.activeOutbreak
        ? Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.weeklyCases / 10_000)
        : publicHealth.outbreakPressure * 0.12;
      // The 208-week report archive is presentation-only. Keeping the latest entry exercises
      // identical fiscal/electoral state transitions without copying 208 objects 1.2M times.
      const nationResult = advanceNationManagementWeek({ ...nationState, reports: nationState.reports.slice(0, 1) }, {
        week: nextWeek,
        game,
        economy,
        relationAverage: average(relations.map((relation) => relation.value)),
        completedResearch: research.filter((project) => project.complete).length,
        publicHealthPressure,
        role,
      });
      nationState = nationResult.state;
      councilTrust = clamp(councilTrust + (nationState.mandateScore >= 60 && nationState.legitimacy >= 60 ? 0.2 : nationState.mandateScore < 35 ? -0.25 : 0), 0, 100);
      game = applyGameDelta(game, nationResult.gameDelta);
      game = applyGameDelta(game, healthResult.gameDelta);
      economy = {
        ...economy,
        debt: Math.max(0, economy.debt + nationResult.economyDelta.debt),
        inflation: clamp(economy.inflation + nationResult.economyDelta.inflation, 0, 100),
        publicConfidence: clamp(economy.publicConfidence + nationResult.economyDelta.publicConfidence, 0, 100),
      };
      research = advanceResearchProjects(research, 6 + Math.floor(nationState.education / 18), getCampaignYear(nextWeek));
      staff = advanceStaffRosterWeek(staff);
      if (profile !== 'rushed' && nextWeek % 208 === 0) staff = staff.map((member) => ({
        ...member,
        contractWeeksRemaining: 208,
        contractTermWeeks: 208,
        delegated: member.delegated || member.grade >= 2,
      }));
      staffWeeksAdvanced += 1;
      refreshLaterEraMarket(nextWeek);
      relations = relations.map((relation) => ({
        ...relation,
        value: clamp(relation.value + (nationState.budget.diplomacy >= 20 ? 0.35 : nationState.budget.diplomacy <= 5 ? -0.2 : 0.08), 0, 100),
      }));
      const latestElectionId = nationState.electoral.campaignHistory[0]?.id ?? null;
      if (latestElectionId && latestElectionId !== previousElectionResultId) {
        previousElectionResultId = latestElectionId;
        electionCount += 1;
        if (nationState.electoral.campaignHistory[0].playerWon) electionWins += 1;
      }
      const openedCoup = processPoliticalCrisis(nextWeek);
      const openedFlashpoint = !openedCoup && nextWeek % WORLD_FLASHPOINT_INTERVAL_WEEKS === 0 && applyWorldFlashpoint(nextWeek);
      if (!openedCoup && !openedFlashpoint && nextWeek % 52 === 26) applyCouncilChoice(nextWeek);
    }

    const outbreakAfter = publicHealth.activeOutbreak?.id ?? null;
    if (outbreakAfter && outbreakAfter !== previousOutbreakId && outbreakAfter !== outbreakBefore) outbreakCount += 1;
    if (outbreakAfter) outbreakWeeks += 1;
    previousOutbreakId = outbreakAfter;
    if (economy.inflation >= 10) inflationWarningWeeks += 1;
    if (economy.inflation >= 50) hyperinflationWeeks += 1;
    if (game.treasury <= 0.01) treasuryZeroWeeks += 1;
    if (game.politicalPower > 1_000) excessivePoliticalPowerWeeks += 1;
    if (game.commandPoints > 1_000) excessiveCommandPointWeeks += 1;
    if (game.enemyPressure <= 0.01) zeroEnemyPressureWeeks += 1;
    if (nextWeek >= config.transitionWeek && nationState.nationalScore >= 99) nationalScoreCeilingWeeks += 1;
    const completedResearch = research.filter((project) => project.complete).length;
    if (researchCompleteWeek === null && completedResearch === research.length) researchCompleteWeek = nextWeek;
    const researchActive = research.some((project) => project.active && !project.complete);
    if (!researchActive) {
      researchIdleWeeks += 1;
      currentResearchIdleRun += 1;
      researchLongestIdleRun = Math.max(researchLongestIdleRun, currentResearchIdleRun);
    } else {
      currentResearchIdleRun = 0;
    }
    eraMetric.weeks += 1;
    eraMetric.actionPrompts += actionPrompts - eraBefore.actionPrompts;
    eraMetric.urgentWeeks += urgentPromptWeeks - eraBefore.urgentPromptWeeks;
    eraMetric.quietWeeks += quietWeeks - eraBefore.quietWeeks;
    eraMetric.decisions += decisionInteractions - eraBefore.decisionInteractions;
    eraMetric.interruptions += interruptionCount - eraBefore.interruptionCount;
    eraMetric.battles += battleCount - eraBefore.battleCount;
    eraMetric.strategicOperations += strategicOperationCount - eraBefore.strategicOperationCount;
    eraMetric.flashpoints += worldFlashpointCount - eraBefore.worldFlashpointCount;
    eraMetric.elections += electionCount - eraBefore.electionCount;
    eraMetric.coupAttempts += coupAttempts - eraBefore.coupAttempts;
    eraMetric.outbreaks += outbreakCount - eraBefore.outbreakCount;
    if (researchActive) eraMetric.researchActiveWeeks += 1;
    if (economy.inflation >= 10) eraMetric.inflationWarningWeeks += 1;
    if (nextWeek >= config.transitionWeek && nationState.nationalScore >= 99) eraMetric.nationalScoreCeilingWeeks += 1;
    eraMetric.inflationTotal += economy.inflation;
    eraMetric.nationalScoreTotal += nationState.nationalScore;
    eraMetric.enemyPressureTotal += game.enemyPressure;
  }

  const finalTrajectory = deriveEmergentHistory({
    doctrine: config.doctrine,
    roleBranch: role.branch,
    game,
    selectedPolicies,
    completedDecisions,
    research,
    operations,
    relations,
    nationStrategyId: nationState.strategyId,
    nationBudget: nationState.budget,
  });
  const finalWorldline = generateWorldline({
    nation,
    game,
    state: worldHistoryState,
    trajectory: finalTrajectory,
    careerSignature: `${role.id}:${role.branch}:tier-${role.tier}:${profile}:${scenario?.combinationKey ?? 'legacy-profile'}`,
    recentDecisionSignature: endingDecisionTrace.slice(-96).join('|'),
    nationalPlanSignature: [
      `transition:${development.transition.archetype}:${actualTransitionWeek}`,
      `structure:${development.endingTags.join('+')}`,
      `scenario:${scenario?.combinationKey ?? 'legacy-profile'}`,
      nationState.nationalPlanning.active?.id ?? 'no-active-plan',
      ...nationState.nationalPlanning.history.map((record) => `${record.planId}:${record.outcome}`),
      ...nationState.strategicContinuity.history.map((record) => `${record.operationId}:${record.outcome}`),
      ...nationState.agenda.history.slice(0, 24).map((record) => `${record.issueId}:${record.choiceId}:${record.decidedWeek}`),
    ].join('|'),
  });
  const endingYear = LONG_HORIZON_START_YEAR + weeksPlayed / 52;
  const laterEraCandidatesAt2020List = createLaterEraCandidates(nation.id, Math.floor(endingYear), getHistoricalHorizon(weeksPlayed, completedDecisions));
  const laterEraCandidatesAt2020 = laterEraCandidatesAt2020List.length;
  const missedPostwarCandidateArrivals = laterEraCandidatesAt2020List.filter((candidate) => !discoveredLaterEraIds.has(candidate.personId)).length;
  const historicalCouncilEventsAvailable = getEligibleCouncilEvents(nation.id, role.branch, LONG_HORIZON_END_YEAR)
    .filter((event) => event.nationIds?.includes(nation.id) && Boolean(event.historicalYear)).length;

  return {
    id,
    nationId: nation.id,
    scenarioCombinationKey: scenario?.combinationKey ?? `legacy:${profile}`,
    scenarioCombinationCode: scenario?.combinationCode ?? null,
    roleId: role.id,
    roleTier: role.tier,
    roleBranch: role.branch,
    profile,
    weeksPlayed,
    endYear: Math.floor(endingYear),
    transitionWeek: actualTransitionWeek,
    transitionYear: getCampaignYear(actualTransitionWeek),
    transitionArchetype: development.transition.archetype,
    koreaLiberationAtTransition,
    koreaTransitionMode,
    warWeeks: actualTransitionWeek,
    nationWeeks: Math.max(0, weeksPlayed - actualTransitionWeek),
    actionPrompts,
    urgentPromptWeeks,
    recommendedPromptWeeks,
    quietWeeks,
    decisionInteractions,
    decisionWeeks: endingDecisionWeeks.size,
    interruptionCount,
    repeatedActionRuns: longestActionRun,
    battleCount,
    battleVictories,
    strategicOperationCount,
    nationAgendaDecisionCount: nationState.agenda.totalDecisions,
    councilDecisionCount,
    uniqueCouncilEvents: seenCouncilIds.size,
    historicalCouncilEventsSeen: seenHistoricalCouncilIds.size,
    historicalCouncilEventsAvailable,
    historicalCouncilEventsMissed: Math.max(0, historicalCouncilEventsAvailable - seenHistoricalCouncilIds.size),
    worldFlashpointCount,
    acceleratedFlashpointCount,
    maximumFlashpointAccelerationYears,
    firstFlashpointYear,
    lastFlashpointYear,
    flashpointDroughtYears: lastFlashpointYear === null ? Math.max(0, Math.floor(endingYear) - LONG_HORIZON_START_YEAR) : Math.max(0, Math.floor(endingYear) - lastFlashpointYear),
    electionCount,
    electionWins,
    electionCampaignActions,
    coupAttempts,
    coupPrevented,
    coupCompromises,
    coupSuccesses,
    unresolvedCoupResponses,
    outbreakCount,
    outbreakWeeks,
    outbreakDeaths: publicHealth.totalDeaths,
    economicEventCount,
    inflationWarningWeeks,
    hyperinflationWeeks,
    treasuryZeroWeeks,
    excessivePoliticalPowerWeeks,
    excessiveCommandPointWeeks,
    zeroEnemyPressureWeeks,
    nationalScoreCeilingWeeks,
    researchCompleteWeek,
    researchIdleWeeks,
    researchLongestIdleRun,
    staffWeeksAdvanced,
    staffFrozenWeeks: Math.max(0, weeksPlayed - staffWeeksAdvanced),
    expiredStaffAtTransition,
    laterEraCandidatesAtTransition,
    laterEraCandidatesAt2020,
    missedPostwarCandidateArrivals,
    finalTreasury: round(game.treasury),
    finalDebt: round(economy.debt),
    finalInflation: round(economy.inflation),
    finalStability: round(game.stability),
    finalPoliticalPower: round(game.politicalPower),
    finalCommandPoints: round(game.commandPoints),
    finalEnemyPressure: round(game.enemyPressure),
    finalNationalScore: nationState.nationalScore,
    finalMandateScore: nationState.mandateScore,
    finalUnrest: round(nationState.unrest),
    finalStructuralUnrestTarget: round(nationState.structuralPressure.targetUnrest),
    finalStructuralUnrestFloor: round(nationState.structuralPressure.floor),
    finalResearchCompleted: research.filter((project) => project.complete).length,
    finalWorldlineCode: finalWorldline.code,
    finalEndingId: finalWorldline.outcomeId,
    finalDominantForce: finalTrajectory.dominantForce,
    worldChoiceSignature: `${scenario?.combinationKey ?? `legacy:${profile}`}::${worldHistoryEvents.map((event) => worldHistoryState.choices[event.id] ?? '-').join('|')}`,
    eraMetrics: [...eraMetrics.values()].sort((left, right) => left.startYear - right.startYear),
  };
}

export function aggregateLongHorizonSessions(sessions: LongHorizonSessionResult[], weeksPlayed = sessions[0]?.weeksPlayed ?? LONG_HORIZON_WEEKS): LongHorizonPlaytestRun {
  const sessionCount = sessions.length;
  const totalWeeks = sessions.reduce((sum, session) => sum + session.weeksPlayed, 0);
  const totalPrompts = sessions.reduce((sum, session) => sum + session.actionPrompts, 0);
  const totalDecisions = sessions.reduce((sum, session) => sum + session.decisionInteractions, 0);
  const totalDecisionWeeks = sessions.reduce((sum, session) => sum + session.decisionWeeks, 0);
  const totalFlashpoints = sessions.reduce((sum, session) => sum + session.worldFlashpointCount, 0);
  const repeated = new Map<string, { sessions: number; weeks: number }>();
  sessions.forEach((session) => Object.entries(session.repeatedActionRuns).forEach(([id, weeks]) => {
    if (weeks < 2) return;
    const current = repeated.get(id) ?? { sessions: 0, weeks: 0 };
    current.sessions += 1;
    current.weeks += weeks;
    repeated.set(id, current);
  }));
  const endingCounts = new Map<string, number>();
  sessions.forEach((session) => endingCounts.set(session.finalEndingId, (endingCounts.get(session.finalEndingId) ?? 0) + 1));
  const researchCompletionYears = sessions.flatMap((session) => session.researchCompleteWeek === null ? [] : [LONG_HORIZON_START_YEAR + Math.floor(session.researchCompleteWeek / 52)]);
  const byProfile = Object.fromEntries(profiles.map((profile) => {
    const matches = sessions.filter((session) => session.profile === profile);
    const profileWeeks = matches.reduce((sum, session) => sum + session.weeksPlayed, 0);
    return [profile, {
      sessions: matches.length,
      promptsPerWeek: round(matches.reduce((sum, session) => sum + session.actionPrompts, 0) / Math.max(1, profileWeeks), 2),
      urgentWeekRate: round(matches.reduce((sum, session) => sum + session.urgentPromptWeeks, 0) / Math.max(1, profileWeeks) * 100),
      decisionsPerYear: round(matches.reduce((sum, session) => sum + session.decisionInteractions, 0) / Math.max(1, profileWeeks / 52), 1),
      averageFinalInflation: round(average(matches.map((session) => session.finalInflation))),
      averageFinalNationalScore: round(average(matches.map((session) => session.finalNationalScore))),
      averageFlashpointDroughtYears: round(average(matches.map((session) => session.flashpointDroughtYears))),
      averageMissedPostwarCandidates: round(average(matches.map((session) => session.missedPostwarCandidateArrivals))),
    }];
  })) as LongHorizonAggregate['byProfile'];
  const aggregate: LongHorizonAggregate = {
    sessionCount,
    weeksPerSession: weeksPlayed,
    totalWeeks,
    nationCoverage: new Set(sessions.map((session) => session.nationId)).size,
    roleCoverage: new Set(sessions.map((session) => session.roleId)).size,
    tierCoverage: new Set(sessions.map((session) => session.roleTier)).size,
    branchCoverage: new Set(sessions.map((session) => session.roleBranch)).size,
    profileCoverage: new Set(sessions.map((session) => session.profile)).size,
    reached2020Rate: round(sessions.filter((session) => session.endYear >= LONG_HORIZON_END_YEAR).length / Math.max(1, sessionCount) * 100),
    actionPrompts: totalPrompts,
    actionPromptsPerWeek: round(totalPrompts / Math.max(1, totalWeeks), 2),
    urgentWeekRate: round(sessions.reduce((sum, session) => sum + session.urgentPromptWeeks, 0) / Math.max(1, totalWeeks) * 100),
    quietWeekRate: round(sessions.reduce((sum, session) => sum + session.quietWeeks, 0) / Math.max(1, totalWeeks) * 100),
    decisionInteractions: totalDecisions,
    decisionWeeks: totalDecisionWeeks,
    promptToDecisionRatio: round(totalPrompts / Math.max(1, totalDecisions), 2),
    interruptionCount: sessions.reduce((sum, session) => sum + session.interruptionCount, 0),
    interruptionsPerYear: round(sessions.reduce((sum, session) => sum + session.interruptionCount, 0) / Math.max(1, totalWeeks / 52), 1),
    medianResearchCompleteYear: researchCompletionYears.length ? percentile(researchCompletionYears, 0.5) : null,
    medianResearchDroughtYears: percentile(sessions.map((session) => (session.researchLongestIdleRun ?? session.researchIdleWeeks) / 52), 0.5),
    researchActiveWeekRate: round((1 - sessions.reduce((sum, session) => sum + session.researchIdleWeeks, 0) / Math.max(1, totalWeeks)) * 100),
    averageFinalResearchCompleted: round(average(sessions.map((session) => session.finalResearchCompleted)), 1),
    averageHistoricalCouncilCoverage: round(average(sessions.map((session) => session.historicalCouncilEventsAvailable > 0 ? session.historicalCouncilEventsSeen / session.historicalCouncilEventsAvailable * 100 : 100))),
    averageFlashpointCount: round(average(sessions.map((session) => session.worldFlashpointCount))),
    averageLastFlashpointYear: sessions.some((session) => session.lastFlashpointYear !== null) ? round(average(sessions.flatMap((session) => session.lastFlashpointYear === null ? [] : [session.lastFlashpointYear]))) : null,
    averageFlashpointDroughtYears: round(average(sessions.map((session) => session.flashpointDroughtYears))),
    acceleratedFlashpointRate: round(sessions.reduce((sum, session) => sum + session.acceleratedFlashpointCount, 0) / Math.max(1, totalFlashpoints) * 100),
    medianMaximumFlashpointAccelerationYears: percentile(sessions.map((session) => session.maximumFlashpointAccelerationYears), 0.5),
    inflationWarningWeekRate: round(sessions.reduce((sum, session) => sum + session.inflationWarningWeeks, 0) / Math.max(1, totalWeeks) * 100),
    hyperinflationSessionRate: round(sessions.filter((session) => session.hyperinflationWeeks > 0).length / Math.max(1, sessionCount) * 100),
    excessivePoliticalPowerSessionRate: round(sessions.filter((session) => session.excessivePoliticalPowerWeeks > 0).length / Math.max(1, sessionCount) * 100),
    zeroEnemyPressureSessionRate: round(sessions.filter((session) => session.zeroEnemyPressureWeeks > 0).length / Math.max(1, sessionCount) * 100),
    averageStaffFrozenYears: round(average(sessions.map((session) => session.staffFrozenWeeks / 52))),
    missedPostwarCandidateSessionRate: round(sessions.filter((session) => session.missedPostwarCandidateArrivals > 0).length / Math.max(1, sessionCount) * 100),
    averageMissedPostwarCandidates: round(average(sessions.map((session) => session.missedPostwarCandidateArrivals))),
    coupSessionRate: round(sessions.filter((session) => session.coupAttempts > 0).length / Math.max(1, sessionCount) * 100),
    successfulCoupSessionRate: round(sessions.filter((session) => session.coupSuccesses > 0).length / Math.max(1, sessionCount) * 100),
    outbreakSessionRate: round(sessions.filter((session) => session.outbreakCount > 0).length / Math.max(1, sessionCount) * 100),
    uniqueWorldlineCodes: new Set(sessions.map((session) => session.finalWorldlineCode)).size,
    uniqueEndings: endingCounts.size,
    mostCommonEndingShare: round(Math.max(...endingCounts.values(), 0) / Math.max(1, sessionCount) * 100),
    topRepeatedActions: [...repeated.entries()].map(([id, value]) => ({ id, ...value })).sort((left, right) => right.weeks - left.weeks).slice(0, 12),
    byProfile,
  };
  return {
    generatedAt: new Date().toISOString(),
    methodology: `${sessionCount} deterministic production-engine campaigns from 1942 to ${LONG_HORIZON_START_YEAR + weeksPlayed / 52}; ${totalWeeks.toLocaleString('en-US')} simulated weeks across nations, roles and six behavior profiles.`,
    sessions,
    aggregate,
    findings: findingsFor(aggregate),
  };
}

export function runLongHorizonPlaytestMatrix(sessionCount = 300, weeksPlayed = LONG_HORIZON_WEEKS): LongHorizonPlaytestRun {
  const sessions = Array.from({ length: sessionCount }, (_, index) => runLongHorizonSession(index, weeksPlayed));
  return aggregateLongHorizonSessions(sessions, weeksPlayed);
}
