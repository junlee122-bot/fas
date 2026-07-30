import { careerRoles, nations } from './campaign';
import {
  createCenturyScenarioBlueprint,
  type CenturyScenarioBlueprint,
} from './centuryScenario';
import { getNationDevelopmentProfile } from './nationDevelopment';
import { evaluateOutcomeGuardrails } from './possibilityOutcomeGuardrails';
import type { NationId } from './types';
import { worldHistoryEvents, type WorldMetric } from './worldHistory';

export const POSSIBILITY_MATRIX_START_YEAR = 1942;
export const POSSIBILITY_MATRIX_END_YEAR = 2060;
export const POSSIBILITY_MATRIX_SESSIONS_PER_NATION = 3_000;

interface PossibilityState {
  nationalScore: number;
  mandate: number;
  unrest: number;
  prosperity: number;
  technology: number;
  rights: number;
  security: number;
  sustainability: number;
  multipolarity: number;
}

export interface PossibilityEraSnapshot extends PossibilityState {
  era: string;
  startYear: number;
  endYear: number;
  eventChoices: number;
  crisisAttempts: number;
  successfulRuptures: number;
  conflicts: number;
  outbreaks: number;
  elections: number;
  recoveryInterventions: number;
  overextensionCrises: number;
}

export interface PossibilityMatrixSession {
  nationId: NationId;
  nationScenarioId: number;
  roleId: string;
  roleTier: number;
  roleBranch: string;
  scenario: CenturyScenarioBlueprint;
  nationalProgramId: string;
  transitionYear: number;
  eventChoices: number;
  agendaDecisions: number;
  crisisAttempts: number;
  successfulRuptures: number;
  conflicts: number;
  outbreaks: number;
  elections: number;
  electionWins: number;
  recoveryInterventions: number;
  overextensionCrises: number;
  finalNationalScore: number;
  finalMandate: number;
  finalUnrest: number;
  finalProsperity: number;
  finalTechnology: number;
  finalRights: number;
  finalSecurity: number;
  finalSustainability: number;
  worldOrder: string;
  governmentPath: string;
  economicPath: string;
  futurePathCode: string;
  finalEndingId: string;
  viable: boolean;
  eraSnapshots: PossibilityEraSnapshot[];
}

export interface PossibilityDimensionImpact {
  dimension: keyof CenturyScenarioBlueprint;
  variants: number;
  transitionYearSpread: number;
  nationalScoreSpread: number;
  unrestSpread: number;
  prosperitySpread: number;
  sustainabilitySpread: number;
  crisisAttemptSpread: number;
  conflictSpread: number;
  outbreakSpread: number;
  electionWinRateSpread: number;
}

export interface PossibilityNationAggregate {
  nationId: NationId;
  nationName: string;
  sessions: number;
  uniqueCombinations: number;
  uniqueFuturePaths: number;
  uniqueEndings: number;
  futurePathCollisionRate: number;
  endingCollisionRate: number;
  dominantEndingShare: number;
  viableRate: number;
  averageTransitionYear: number;
  transitionYearSpread: number;
  averageNationalScore: number;
  nationalScoreP10: number;
  nationalScoreP90: number;
  averageMandate: number;
  averageUnrest: number;
  averageProsperity: number;
  averageTechnology: number;
  averageRights: number;
  averageSecurity: number;
  averageSustainability: number;
  averageCrisisAttempts: number;
  averageRecoveryInterventions: number;
  averageOverextensionCrises: number;
  successfulRuptureRate: number;
  averageConflicts: number;
  averageOutbreaks: number;
  averageElections: number;
  electionWinRate: number;
  dimensionCoverage: Record<string, number>;
  dimensionImpacts: PossibilityDimensionImpact[];
}

export interface PossibilityMatrixFinding {
  priority: 'P0' | 'P1' | 'P2';
  id: string;
  title: string;
  evidence: string;
  recommendation: string;
}

export interface PossibilityMatrixRun {
  generatedAt: string;
  methodology: string;
  sessionsPerNation: number;
  totalSessions: number;
  totalHistoricalEventChoices: number;
  uniqueCombinations: number;
  uniqueFuturePaths: number;
  futurePathCollisionRate: number;
  endingCollisionRate: number;
  viableRate: number;
  nationOutcomeSpread: number;
  byNation: Record<NationId, PossibilityNationAggregate>;
  findings: PossibilityMatrixFinding[];
}

const eraWindows = [
  ['war-end', 1942, 1949],
  ['reconstruction', 1950, 1959],
  ['early-rivalry', 1960, 1969],
  ['high-rivalry', 1970, 1979],
  ['detente', 1980, 1989],
  ['transformation', 1990, 1999],
  ['connected-world', 2000, 2009],
  ['planetary-transition', 2010, 2019],
  ['synthetic-century-i', 2020, 2029],
  ['synthetic-century-ii', 2030, 2039],
  ['synthetic-century-iii', 2040, 2049],
  ['synthetic-century-iv', 2050, 2060],
] as const;

const dimensions: Array<keyof CenturyScenarioBlueprint> = [
  'profile',
  'doctrine',
  'nationStrategy',
  'transitionApproach',
  'agendaChoice',
  'crisisApproach',
  'nationalProgramIndex',
  'economicModel',
  'diplomaticPosture',
  'technologyPosture',
  'publicHealthPosture',
  'warPosture',
  'futurePriority',
  'electionStyle',
  'worldVariant',
];

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const rate = (numerator: number, denominator: number) => round(numerator / Math.max(1, denominator) * 100);

function stableHash(value: string, seed = 2166136261) {
  let hash = seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableUnit(value: string) {
  return stableHash(value) / 4294967295;
}

function fingerprint(value: string) {
  return `${stableHash(value).toString(36)}${stableHash(value, 2246822519).toString(36)}`;
}

function percentile(values: number[], fraction: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
}

function metricTotal(entries: Array<Partial<Record<WorldMetric, number>>>, metric: WorldMetric) {
  return entries.reduce((sum, entry) => sum + (entry[metric] ?? 0), 0);
}

function economicFit(scenario: CenturyScenarioBlueprint, industrialPotential: number, eraIndex: number) {
  if (scenario.economicModel === 'reconstruction') return eraIndex <= 2 ? 2.4 : .7;
  if (scenario.economicModel === 'industrial') return 1.2 + industrialPotential / 90;
  if (scenario.economicModel === 'open-market') return scenario.diplomaticPosture === 'revisionist' ? .3 : 1.8;
  if (scenario.economicModel === 'welfare') return 1.2;
  return eraIndex <= 4 ? 1.1 : .45;
}

function technologyFit(scenario: CenturyScenarioBlueprint, eraIndex: number) {
  if (scenario.technologyPosture === 'frontier') return eraIndex >= 7 ? 2.5 : 1.2;
  if (scenario.technologyPosture === 'civilian') return 1.65;
  if (scenario.technologyPosture === 'military') return eraIndex <= 5 ? 1.8 : .85;
  return 1.45;
}

function crisisResponsePower(scenario: CenturyScenarioBlueprint) {
  if (scenario.crisisApproach === 'constitutional') return 8 + (scenario.nationStrategy === 'open-republic' ? 4 : 0);
  if (scenario.crisisApproach === 'negotiation') return 9 + (scenario.agendaChoice === 'bargain' ? 4 : 0);
  if (scenario.crisisApproach === 'command') return 10 + (scenario.nationStrategy === 'security-republic' ? 4 : 0);
  return 10 + (scenario.technologyPosture === 'frontier' ? 3 : 0);
}

function getTransitionYear(nationId: NationId, scenario: CenturyScenarioBlueprint) {
  const transition = getNationDevelopmentProfile(nationId).transition;
  const approachDelta = scenario.transitionApproach === 'accelerated'
    ? -1.4
    : scenario.transitionApproach === 'negotiated'
      ? .8
      : scenario.transitionApproach === 'protracted'
        ? 2.2
        : 0;
  const postureDelta = scenario.warPosture === 'aggressive' ? -.35 : scenario.warPosture === 'cautious' ? .35 : 0;
  const variation = (stableUnit(`${nationId}:${scenario.scenarioId}:transition-matrix`) - .5) * 1.2;
  return round(clamp(
    POSSIBILITY_MATRIX_START_YEAR + transition.targetWeek / 52 + approachDelta + postureDelta + variation,
    POSSIBILITY_MATRIX_START_YEAR + transition.earliestWeek / 52,
    POSSIBILITY_MATRIX_START_YEAR + transition.deadlineWeek / 52,
  ), 1);
}

function worldOrderFor(state: PossibilityState, scenario: CenturyScenarioBlueprint) {
  if (scenario.diplomaticPosture === 'nonaligned' && state.multipolarity >= 48) return 'nonaligned-network';
  if (scenario.diplomaticPosture === 'regional') return 'regional-blocs';
  if (scenario.diplomaticPosture === 'multilateral' && state.rights >= 52) return 'institutional-multipolarity';
  if (scenario.diplomaticPosture === 'revisionist' && state.security >= 62) return 'contested-hegemony';
  return state.multipolarity >= 58 ? 'competitive-multipolarity' : state.security >= 68 ? 'bipolar-deterrence' : 'loose-alliance-order';
}

function governmentPathFor(state: PossibilityState, scenario: CenturyScenarioBlueprint, successfulRuptures: number) {
  if (successfulRuptures >= 3) return 'successive-regime-ruptures';
  if (scenario.nationStrategy === 'security-republic' && state.rights < 45) return 'security-state';
  if (scenario.nationStrategy === 'open-republic' && state.rights >= 55) return 'plural-republic';
  if (scenario.nationStrategy === 'social-contract') return 'social-compact';
  if (scenario.nationStrategy === 'developmental-state') return 'developmental-coalition';
  return state.mandate >= 55 ? 'reconstruction-constitution' : 'fragile-executive';
}

function economicPathFor(state: PossibilityState, scenario: CenturyScenarioBlueprint) {
  if (state.prosperity < 35) return 'stagnation-trap';
  if (scenario.economicModel === 'welfare' && state.rights >= 48) return 'welfare-productivity';
  if (scenario.economicModel === 'industrial') return 'industrial-export-state';
  if (scenario.economicModel === 'open-market') return 'open-market-network';
  if (scenario.economicModel === 'security') return 'security-industrial-complex';
  return 'reconstruction-mixed-economy';
}

export function runPossibilityMatrixSession(
  nationId: NationId,
  nationScenarioId: number,
): PossibilityMatrixSession {
  const nation = nations.find((candidate) => candidate.id === nationId);
  if (!nation) throw new Error(`unknown nation: ${nationId}`);
  const roles = careerRoles.filter((role) => role.nationId === nationId);
  const role = roles[nationScenarioId % roles.length];
  const development = getNationDevelopmentProfile(nationId);
  const scenario = createCenturyScenarioBlueprint(nationId, nationScenarioId);
  const nationalProgram = nation.paths[scenario.nationalProgramIndex];
  const structure = development.structure;
  const transitionYear = getTransitionYear(nationId, scenario);
  let state: PossibilityState = {
    nationalScore: clamp(30 + structure.longTermPotential * .28 + structure.administrativeEfficiency * .12),
    mandate: clamp(45 + structure.administrativeEfficiency * .12 - structure.baseUnrest * .3),
    unrest: clamp(structure.baseUnrest + structure.regionalPressure + structure.identityPressure),
    prosperity: clamp(18 + structure.resourceBase * .22 + structure.industrialPotential * .2),
    technology: clamp(15 + structure.industrialPotential * .25),
    rights: scenario.nationStrategy === 'open-republic' ? 55 : scenario.nationStrategy === 'security-republic' ? 32 : 44,
    security: clamp(38 + (nation.modifiers.warSupport ?? 60) * .25),
    sustainability: 24,
    multipolarity: 38,
  };
  if (nationalProgram.tone === 'reform') {
    state.rights = clamp(state.rights + 3);
    state.mandate = clamp(state.mandate + 2);
  } else if (nationalProgram.tone === 'hardline') {
    state.security = clamp(state.security + 4);
    state.unrest = clamp(state.unrest + 2);
  } else {
    state.multipolarity = clamp(state.multipolarity + 4);
    state.prosperity = clamp(state.prosperity + 2);
  }
  let crisisAttempts = 0;
  let successfulRuptures = 0;
  let conflicts = 0;
  let outbreaks = 0;
  let elections = 0;
  let electionWins = 0;
  let recoveryInterventions = 0;
  let overextensionCrises = 0;
  let eventChoices = 0;
  let agendaDecisions = 0;
  const pathFragments: string[] = [];
  const eraSnapshots: PossibilityEraSnapshot[] = [];

  eraWindows.forEach(([era, startYear, endYear], eraIndex) => {
    const years = endYear - startYear + 1;
    const events = worldHistoryEvents.filter((event) => event.historicalYear >= startYear && event.historicalYear <= endYear);
    const selectedVariants = events.map((event) => {
      const adaptiveOffset = stableHash(`${nationId}:${nationScenarioId}:${event.id}:${era}`) % 3;
      const postureOffset = scenario.diplomaticPosture === 'revisionist' && (event.category === 'proxy-war' || event.category === 'world-order') ? 2
        : scenario.publicHealthPosture === 'prevention' && event.category === 'public-health' ? 1
          : scenario.worldVariant;
      return event.variants[(adaptiveOffset + postureOffset) % event.variants.length];
    });
    const metrics = selectedVariants.map((variant) => variant.metricDelta);
    const prosperityPressure = metricTotal(metrics, 'prosperity');
    const rightsPressure = metricTotal(metrics, 'rights');
    const instabilityPressure = metricTotal(metrics, 'instability');
    const deterrencePressure = metricTotal(metrics, 'deterrence');
    const multipolarityPressure = metricTotal(metrics, 'multipolarity');
    const randomShock = (stableUnit(`${nationId}:${nationScenarioId}:${era}:shock`) - .5) * 4;
    const economicGain = economicFit(scenario, structure.industrialPotential, eraIndex)
      + prosperityPressure * .04
      + structure.longTermPotential / 120
      + randomShock * .25;
    const technologyGain = technologyFit(scenario, eraIndex)
      + events.filter((event) => event.category === 'technology' || event.category === 'space').length * .12;
    const rightsGain = scenario.agendaChoice === 'bargain' ? 1.3
      : scenario.agendaChoice === 'invest' ? .75
        : -.9;
    const securityGain = scenario.warPosture === 'aggressive' ? 1.5
      : scenario.warPosture === 'cautious' ? .45
        : .9;
    const climateLoad = eraIndex >= 7 ? (eraIndex - 6) * 1.25 : .2;
    const sustainabilityGain = scenario.futurePriority === 'climate' ? 2.3
      : scenario.technologyPosture === 'frontier' ? 1.1
        : .55;
    const doctrineRights = scenario.doctrine === 'coalition' ? .8 : scenario.doctrine === 'maneuver' ? -.25 : .2;
    const doctrineSecurity = scenario.doctrine === 'maneuver' ? 1.1 : scenario.doctrine === 'methodical' ? .65 : .25;
    const doctrineSustainability = scenario.doctrine === 'methodical' ? .55 : 0;
    // World variants are structural environments rather than cosmetic event rerolls:
    // 0 = securitized blocs, 1 = rights-led internationalism, 2 = frontier technology race.
    const worldRights = scenario.worldVariant === 1 ? 1.5 : scenario.worldVariant === 0 ? -.8 : .25;
    const worldSecurity = scenario.worldVariant === 0 ? 1.5 : scenario.worldVariant === 1 ? .2 : -.45;
    const worldTechnology = scenario.worldVariant === 2 ? 1.5 : scenario.worldVariant === 1 ? .2 : .35;
    const worldProsperity = scenario.worldVariant === 2 ? 1.2 : scenario.worldVariant === 1 ? .65 : .2;
    const worldSustainability = scenario.worldVariant === 1 ? .8 : scenario.worldVariant === 2 ? .25 : -.4;
    const worldUnrest = scenario.worldVariant === 0 ? .8 : scenario.worldVariant === 1 ? -.6 : .25;
    const crisisRights = scenario.crisisApproach === 'constitutional' ? .5 : scenario.crisisApproach === 'command' ? -.35 : .1;
    const crisisSecurity = scenario.crisisApproach === 'command' ? .65 : scenario.crisisApproach === 'counter-intelligence' ? .5 : .1;
    const crisisMandate = scenario.crisisApproach === 'negotiation' ? .45 : scenario.crisisApproach === 'constitutional' ? .3 : -.05;
    const profileProsperity = scenario.profile === 'rushed' ? .75
      : scenario.profile === 'state-builder' ? .6
        : scenario.profile === 'opportunist' ? .4
          : 0;
    const profileTechnology = scenario.profile === 'completionist' ? 1
      : scenario.profile === 'state-builder' ? .25
        : 0;
    const profileRights = scenario.profile === 'guided' ? .35
      : scenario.profile === 'military' ? -.6
        : scenario.profile === 'completionist' ? .15
          : 0;
    const profileSecurity = scenario.profile === 'military' ? 1.05
      : scenario.profile === 'guided' ? .25
        : scenario.profile === 'rushed' ? -.2
          : 0;
    const profileSustainability = scenario.profile === 'completionist' ? .55
      : scenario.profile === 'state-builder' ? .2
        : scenario.profile === 'rushed' ? -.2
          : 0;
    const profileMandate = scenario.profile === 'guided' ? .65
      : scenario.profile === 'state-builder' ? .45
        : scenario.profile === 'rushed' ? -.35
          : scenario.profile === 'opportunist' ? -.2
            : 0;
    const profileUnrest = scenario.profile === 'rushed' ? .8
      : scenario.profile === 'military' ? .55
        : scenario.profile === 'opportunist' ? .45
          : scenario.profile === 'guided' ? -.35
            : 0;
    const profileMultipolarity = scenario.profile === 'opportunist' ? .75
      : scenario.profile === 'guided' ? .2
        : 0;
    const programProsperity = nationalProgram.tone === 'international' ? .8 : nationalProgram.tone === 'hardline' ? .45 : .25;
    const programRights = nationalProgram.tone === 'reform' ? 1.15 : nationalProgram.tone === 'hardline' ? -.8 : .35;
    const programSecurity = nationalProgram.tone === 'hardline' ? 1.25 : nationalProgram.tone === 'international' ? .35 : -.1;
    const programSustainability = nationalProgram.tone === 'reform' ? .35 : nationalProgram.tone === 'hardline' ? -.2 : .25;
    const programMultipolarity = nationalProgram.tone === 'international' ? 1.2 : nationalProgram.tone === 'hardline' ? -.3 : .2;
    const programMandate = nationalProgram.tone === 'reform' ? .55 : nationalProgram.tone === 'hardline' ? -.2 : .35;
    const programUnrest = nationalProgram.tone === 'hardline' ? 1.1 : nationalProgram.tone === 'reform' ? -.65 : -.2;

    state.prosperity = clamp(state.prosperity + (economicGain + worldProsperity + profileProsperity + programProsperity) * years / 8 - instabilityPressure * .025);
    state.technology = clamp(state.technology + (technologyGain + worldTechnology + profileTechnology) * years / 8);
    state.rights = clamp(state.rights + (rightsGain + doctrineRights + worldRights + crisisRights + profileRights + programRights) * years / 9 + rightsPressure * .035 - (scenario.economicModel === 'security' ? .8 : 0));
    state.security = clamp(state.security + (securityGain + doctrineSecurity + worldSecurity + crisisSecurity + profileSecurity + programSecurity) * years / 10 + deterrencePressure * .035 - instabilityPressure * .018);
    state.sustainability = clamp(state.sustainability + (sustainabilityGain + worldSustainability + doctrineSustainability + profileSustainability + programSustainability) * years / 9 - climateLoad);
    state.multipolarity = clamp(state.multipolarity + multipolarityPressure * .04 + profileMultipolarity + programMultipolarity + (scenario.diplomaticPosture === 'multilateral' ? 1.2 : scenario.diplomaticPosture === 'revisionist' ? .6 : .25));

    const inequalityPressure = scenario.economicModel === 'open-market' ? 5 : scenario.economicModel === 'industrial' ? 3 : scenario.economicModel === 'welfare' ? -4 : 1;
    const structuralTarget = structure.baseUnrest
      + structure.regionalPressure
      + structure.identityPressure
      + inequalityPressure
      + instabilityPressure * .035
      + Math.max(0, 45 - state.prosperity) * .22
      + Math.max(0, 38 - state.sustainability) * .12
      + profileUnrest
      + programUnrest
      + worldUnrest
      - Math.max(0, state.rights - 45) * .12
      - (scenario.agendaChoice === 'bargain' ? 3 : scenario.agendaChoice === 'invest' ? 2 : -2);
    state.unrest = clamp(state.unrest * .55 + structuralTarget * .45 + randomShock);

    // Weak states can recover through institutions, bargaining and external cooperation.
    // This is a player-built route rather than a nation-specific handicap.
    const recoveryCapability = (nationalProgram.tone === 'reform' ? 7 : nationalProgram.tone === 'international' ? 6 : 2)
      + (scenario.crisisApproach === 'negotiation' ? 5 : scenario.crisisApproach === 'constitutional' ? 4 : scenario.crisisApproach === 'counter-intelligence' ? 2 : 1)
      + (scenario.agendaChoice === 'bargain' ? 4 : scenario.agendaChoice === 'invest' ? 3 : 0)
      + (scenario.profile === 'state-builder' ? 3 : scenario.profile === 'guided' ? 2 : scenario.profile === 'completionist' ? 1 : 0);
    const recoveryPressure = Math.max(0, state.unrest - 32) * 1.15
      + Math.max(0, 48 - state.mandate) * .8
      + Math.max(0, 50 - state.nationalScore) * .85;
    const recoveryChance = clamp(recoveryPressure + recoveryCapability * 1.25 - 11, 0, 78);
    const recoveryThisEra = recoveryPressure > 0
      && stableUnit(`${nationId}:${nationScenarioId}:${era}:institutional-recovery`) * 100 < recoveryChance
      ? 1
      : 0;
    if (recoveryThisEra) {
      const recoveryStrength = 2.5 + recoveryCapability * .2;
      recoveryInterventions += 1;
      state.unrest = clamp(state.unrest - recoveryStrength);
      state.mandate = clamp(state.mandate + 1.8 + recoveryCapability * .12);
      state.prosperity = clamp(state.prosperity + (nationalProgram.tone === 'international' ? 1.4 : nationalProgram.tone === 'reform' ? .9 : .35));
    }

    // Successful powers accumulate their own failure pressure. Aggressive security,
    // open-market and revisionist routes can overreach even from a strong baseline.
    const overextensionExposure = Math.max(0, state.nationalScore - 60) * .9
      + Math.max(0, state.prosperity - 68) * .5
      + Math.max(0, state.security - 72) * .45
      + (scenario.warPosture === 'aggressive' ? 5 : scenario.warPosture === 'cautious' ? -3 : 0)
      + (scenario.economicModel === 'open-market' ? 4 : scenario.economicModel === 'welfare' ? -3 : 0)
      + (scenario.diplomaticPosture === 'revisionist' ? 4 : scenario.diplomaticPosture === 'multilateral' ? -2 : 0)
      + (nationalProgram.tone === 'hardline' ? 3 : nationalProgram.tone === 'reform' ? -2 : 0);
    const overextensionChance = clamp(overextensionExposure * 1.1 - 6, 0, 65);
    const overextensionThisEra = overextensionExposure > 0
      && stableUnit(`${nationId}:${nationScenarioId}:${era}:overextension`) * 100 < overextensionChance
      ? 1
      : 0;
    if (overextensionThisEra) {
      overextensionCrises += 1;
      state.unrest = clamp(state.unrest + 4.2);
      state.mandate = clamp(state.mandate - 3.2);
      state.rights = clamp(state.rights - (scenario.crisisApproach === 'constitutional' ? .4 : 1.2));
      state.sustainability = clamp(state.sustainability - 1.8);
    }

    const risk = clamp(
      18
      + state.unrest * .72
      + Math.max(0, 60 - state.mandate) * .55
      + instabilityPressure * .12
      + development.crisis.riskBias * 1.2
      - crisisResponsePower(scenario) * .65
      + successfulRuptures * 4,
    );
    // Political rupture remains consequential and generational. A decade can produce at most
    // one full attempt; high pressure raises its probability instead of spawning annual coups.
    const attemptChance = clamp((risk - 34) * 2.1, 0, 82);
    const attemptsThisEra = stableUnit(`${nationId}:${nationScenarioId}:${era}:crisis`) * 100 < attemptChance ? 1 : 0;
    const ruptureChance = clamp(risk - crisisResponsePower(scenario) - state.security * .12, 0, 65);
    const successfulThisEra = Array.from({ length: attemptsThisEra }, (_, index) =>
      stableUnit(`${nationId}:${nationScenarioId}:${era}:rupture:${index}`) * 100 < ruptureChance ? 1 : 0
    ).reduce<number>((sum, value) => sum + value, 0);
    crisisAttempts += attemptsThisEra;
    successfulRuptures += successfulThisEra;

    const proxyEvents = events.filter((event) => event.category === 'proxy-war' || event.category === 'nuclear').length;
    const conflictPressure = proxyEvents * .15
      + (scenario.diplomaticPosture === 'revisionist' ? 1.2 : 0)
      + (scenario.warPosture === 'aggressive' ? .8 : scenario.warPosture === 'cautious' ? -.35 : 0)
      + instabilityPressure * .012;
    const conflictsThisEra = Math.max(0, Math.floor(conflictPressure + stableUnit(`${nationId}:${nationScenarioId}:${era}:conflict`) - .4));
    conflicts += conflictsThisEra;

    const healthEvents = events.filter((event) => event.category === 'public-health').length;
    const healthProtection = scenario.publicHealthPosture === 'prevention' ? 1.35 : scenario.publicHealthPosture === 'adaptive' ? .75 : .05;
    const outbreaksThisEra = Math.max(0, Math.floor(healthEvents * .55 + eraIndex * .06 - healthProtection + stableUnit(`${nationId}:${nationScenarioId}:${era}:health`)));
    outbreaks += outbreaksThisEra;

    const electionInterval = scenario.nationStrategy === 'open-republic' || scenario.nationStrategy === 'social-contract' ? 4
      : scenario.nationStrategy === 'security-republic' ? 8
        : 6;
    const electionsThisEra = Math.floor(years / electionInterval);
    const campaignPower = state.mandate
      + (scenario.electionStyle === 'consensus' ? 6 : scenario.electionStyle === 'grassroots' ? 4 : scenario.electionStyle === 'media' ? 2 : -1)
      - state.unrest * .35;
    const winsThisEra = Array.from({ length: electionsThisEra }, (_, index) =>
      stableUnit(`${nationId}:${nationScenarioId}:${era}:election:${index}`) * 100 < campaignPower ? 1 : 0
    ).reduce<number>((sum, value) => sum + value, 0);
    elections += electionsThisEra;
    electionWins += winsThisEra;

    const agendaCadenceYears = development.agendaCadenceWeeks / 52;
    const agendasThisEra = Math.max(1, Math.round(years / agendaCadenceYears));
    agendaDecisions += agendasThisEra;
    eventChoices += events.length;
    state.mandate = clamp(
      state.mandate
      + (scenario.agendaChoice === 'bargain' ? 2 : scenario.agendaChoice === 'invest' ? 1 : -.8)
      + crisisMandate
      + profileMandate
      + programMandate
      + (winsThisEra - Math.max(0, electionsThisEra - winsThisEra)) * .8
      - successfulThisEra * 8
      - outbreaksThisEra * .7
      + (state.prosperity - 50) * .025,
    );
    const sustainablePenalty = eraIndex >= 8 ? Math.max(0, 45 - state.sustainability) * .12 : 0;
    const targetScore = clamp(
      state.prosperity * .22
      + state.technology * .18
      + state.mandate * .17
      + state.security * .13
      + state.rights * .12
      + state.sustainability * .1
      + structure.longTermPotential * .08
      - state.unrest * .16
      - successfulThisEra * 4
      - conflictsThisEra * 1.1
      - sustainablePenalty,
    );
    state.nationalScore = clamp(state.nationalScore * .52 + targetScore * .48);
    pathFragments.push(`${era}:${nationalProgram.id}:${fingerprint(selectedVariants.map((variant) => variant.id).join('|'))}:${Math.round(state.nationalScore / 5)}:${successfulThisEra}:${recoveryThisEra}:${overextensionThisEra}`);
    eraSnapshots.push({
      ...Object.fromEntries(Object.entries(state).map(([key, value]) => [key, round(value)])) as unknown as PossibilityState,
      era,
      startYear,
      endYear,
      eventChoices: events.length,
      crisisAttempts: attemptsThisEra,
      successfulRuptures: successfulThisEra,
      conflicts: conflictsThisEra,
      outbreaks: outbreaksThisEra,
      elections: electionsThisEra,
      recoveryInterventions: recoveryThisEra,
      overextensionCrises: overextensionThisEra,
    });
  });

  const worldOrder = worldOrderFor(state, scenario);
  const governmentPath = governmentPathFor(state, scenario, successfulRuptures);
  const economicPath = economicPathFor(state, scenario);
  const fragileTransition = ['liberation', 'decolonization', 'civil-settlement'].includes(development.transition.archetype);
  const viabilityThreshold = fragileTransition ? 35 : 39;
  const overextensionBreakdown = overextensionCrises >= 3
    && (state.unrest >= 44 || (state.sustainability < 38 && state.rights < 42));
  const viable = state.nationalScore >= viabilityThreshold
    && state.unrest < (fragileTransition ? 72 : 68)
    && successfulRuptures < (fragileTransition ? 4 : 3)
    && !overextensionBreakdown;
  const stabilityEnding = !viable ? 'systemic-breakdown' : state.unrest <= 24 ? 'durable-settlement' : state.unrest <= 48 ? 'contested-settlement' : 'fragile-settlement';
  const socialSettlement = state.rights >= 68 ? 'rights-entrenched' : state.rights >= 48 ? 'rights-negotiated' : 'rights-restricted';
  const developmentBand = state.prosperity >= 72 && state.technology >= 72 ? 'advanced-abundance' : state.prosperity >= 52 ? 'uneven-development' : 'development-deficit';
  const planetaryBand = state.sustainability >= 60 ? 'planetary-transition' : state.sustainability >= 40 ? 'managed-ecology' : 'ecological-debt';
  const institutionalMemory = recoveryInterventions >= overextensionCrises + 2
    ? 'recovery-state'
    : overextensionCrises >= recoveryInterventions + 2
      ? 'overextended-state'
      : 'contested-adaptation';
  const finalEndingId = [
    worldOrder,
    governmentPath,
    economicPath,
    scenario.futurePriority,
    nationalProgram.id,
    stabilityEnding,
    socialSettlement,
    developmentBand,
    planetaryBand,
    institutionalMemory,
    development.endingTags[(scenario.combinationCode + successfulRuptures) % development.endingTags.length],
  ].join(':');
  const futurePathCode = fingerprint([
    nationId,
    transitionYear,
    ...pathFragments,
    finalEndingId,
  ].join('|'));

  return {
    nationId,
    nationScenarioId,
    roleId: role.id,
    roleTier: role.tier,
    roleBranch: role.branch,
    scenario,
    nationalProgramId: nationalProgram.id,
    transitionYear,
    eventChoices,
    agendaDecisions,
    crisisAttempts,
    successfulRuptures,
    conflicts,
    outbreaks,
    elections,
    electionWins,
    recoveryInterventions,
    overextensionCrises,
    finalNationalScore: round(state.nationalScore),
    finalMandate: round(state.mandate),
    finalUnrest: round(state.unrest),
    finalProsperity: round(state.prosperity),
    finalTechnology: round(state.technology),
    finalRights: round(state.rights),
    finalSecurity: round(state.security),
    finalSustainability: round(state.sustainability),
    worldOrder,
    governmentPath,
    economicPath,
    futurePathCode,
    finalEndingId,
    viable,
    eraSnapshots,
  };
}

function dimensionImpacts(sessions: PossibilityMatrixSession[]): PossibilityDimensionImpact[] {
  return dimensions.map((dimension) => {
    const groups = new Map<string, PossibilityMatrixSession[]>();
    sessions.forEach((session) => {
      const key = String(session.scenario[dimension]);
      const group = groups.get(key);
      if (group) group.push(session);
      else groups.set(key, [session]);
    });
    const values = [...groups.values()];
    const spreadFor = (selector: (session: PossibilityMatrixSession) => number) => {
      const means = values.map((matches) => average(matches.map(selector)));
      return round(Math.max(...means) - Math.min(...means));
    };
    const electionWinRates = values.map((matches) => rate(
      matches.reduce((sum, session) => sum + session.electionWins, 0),
      matches.reduce((sum, session) => sum + session.elections, 0),
    ));
    return {
      dimension,
      variants: groups.size,
      transitionYearSpread: spreadFor((session) => session.transitionYear),
      nationalScoreSpread: spreadFor((session) => session.finalNationalScore),
      unrestSpread: spreadFor((session) => session.finalUnrest),
      prosperitySpread: spreadFor((session) => session.finalProsperity),
      sustainabilitySpread: spreadFor((session) => session.finalSustainability),
      crisisAttemptSpread: spreadFor((session) => session.crisisAttempts),
      conflictSpread: spreadFor((session) => session.conflicts),
      outbreakSpread: spreadFor((session) => session.outbreaks),
      electionWinRateSpread: round(Math.max(...electionWinRates) - Math.min(...electionWinRates)),
    };
  });
}

function aggregateNation(nationId: NationId, sessions: PossibilityMatrixSession[]): PossibilityNationAggregate {
  const nation = nations.find((candidate) => candidate.id === nationId)!;
  const endingCounts = new Map<string, number>();
  sessions.forEach((session) => endingCounts.set(session.finalEndingId, (endingCounts.get(session.finalEndingId) ?? 0) + 1));
  const transitions = sessions.map((session) => session.transitionYear);
  const dimensionCoverage = Object.fromEntries(dimensions.map((dimension) => [
    dimension,
    new Set(sessions.map((session) => String(session.scenario[dimension]))).size,
  ]));
  return {
    nationId,
    nationName: nation.shortName,
    sessions: sessions.length,
    uniqueCombinations: new Set(sessions.map((session) => session.scenario.combinationKey)).size,
    uniqueFuturePaths: new Set(sessions.map((session) => session.futurePathCode)).size,
    uniqueEndings: endingCounts.size,
    futurePathCollisionRate: rate(sessions.length - new Set(sessions.map((session) => session.futurePathCode)).size, sessions.length),
    endingCollisionRate: rate(sessions.length - endingCounts.size, sessions.length),
    dominantEndingShare: rate(Math.max(...endingCounts.values()), sessions.length),
    viableRate: rate(sessions.filter((session) => session.viable).length, sessions.length),
    averageTransitionYear: round(average(transitions)),
    transitionYearSpread: round(Math.max(...transitions) - Math.min(...transitions)),
    averageNationalScore: round(average(sessions.map((session) => session.finalNationalScore))),
    nationalScoreP10: round(percentile(sessions.map((session) => session.finalNationalScore), .1)),
    nationalScoreP90: round(percentile(sessions.map((session) => session.finalNationalScore), .9)),
    averageMandate: round(average(sessions.map((session) => session.finalMandate))),
    averageUnrest: round(average(sessions.map((session) => session.finalUnrest))),
    averageProsperity: round(average(sessions.map((session) => session.finalProsperity))),
    averageTechnology: round(average(sessions.map((session) => session.finalTechnology))),
    averageRights: round(average(sessions.map((session) => session.finalRights))),
    averageSecurity: round(average(sessions.map((session) => session.finalSecurity))),
    averageSustainability: round(average(sessions.map((session) => session.finalSustainability))),
    averageCrisisAttempts: round(average(sessions.map((session) => session.crisisAttempts))),
    averageRecoveryInterventions: round(average(sessions.map((session) => session.recoveryInterventions))),
    averageOverextensionCrises: round(average(sessions.map((session) => session.overextensionCrises))),
    successfulRuptureRate: rate(sessions.filter((session) => session.successfulRuptures > 0).length, sessions.length),
    averageConflicts: round(average(sessions.map((session) => session.conflicts))),
    averageOutbreaks: round(average(sessions.map((session) => session.outbreaks))),
    averageElections: round(average(sessions.map((session) => session.elections))),
    electionWinRate: rate(sessions.reduce((sum, session) => sum + session.electionWins, 0), sessions.reduce((sum, session) => sum + session.elections, 0)),
    dimensionCoverage,
    dimensionImpacts: dimensionImpacts(sessions),
  };
}

function buildFindings(run: Omit<PossibilityMatrixRun, 'findings'>): PossibilityMatrixFinding[] {
  const nationsWithCombinationGaps = Object.values(run.byNation).filter((nation) => nation.uniqueCombinations < run.sessionsPerNation);
  const lowViability = Object.values(run.byNation).filter((nation) => nation.viableRate < 70);
  const highCollision = Object.values(run.byNation).filter((nation) => nation.futurePathCollisionRate > 1);
  const outcomeGuardrailViolations = evaluateOutcomeGuardrails(run.byNation);
  const weakDimensions = Object.values(run.byNation).flatMap((nation) =>
    nation.dimensionImpacts.filter((impact) =>
      Math.max(
        impact.transitionYearSpread,
        impact.nationalScoreSpread,
        impact.unrestSpread,
        impact.prosperitySpread,
        impact.sustainabilitySpread,
        impact.crisisAttemptSpread,
        impact.conflictSpread,
        impact.outbreakSpread,
        impact.electionWinRateSpread,
      ) < 1.5
    )
      .map((impact) => `${nation.nationId}:${String(impact.dimension)}`)
  );
  return [
    {
      priority: nationsWithCombinationGaps.length > 0 ? 'P0' : 'P2',
      id: 'combination-coverage',
      title: nationsWithCombinationGaps.length > 0 ? '국가별 정책 조합이 요청 표본보다 적습니다' : `개선됨 · 모든 국가가 ${run.sessionsPerNation.toLocaleString('ko-KR')}개의 서로 다른 정책 조합을 사용합니다`,
      evidence: nationsWithCombinationGaps.length > 0
        ? nationsWithCombinationGaps.map((nation) => `${nation.nationId} ${nation.uniqueCombinations}/${run.sessionsPerNation}`).join(' · ')
        : `${Object.keys(run.byNation).length}개 국가 모두 조합 중복 0건, 전체 고유 조합 ${run.uniqueCombinations.toLocaleString('ko-KR')}개입니다.`,
      recommendation: nationsWithCombinationGaps.length > 0 ? '혼합 기수 시나리오 공간을 넓히고 조합 중복을 빌드 실패로 처리합니다.' : '12,960개 조합 용량을 보존하고 새 정책 축을 추가할 때 고유성 테스트를 유지합니다.',
    },
    {
      priority: highCollision.length > 0 ? 'P1' : 'P2',
      id: 'future-path-collision',
      title: highCollision.length > 0 ? '서로 다른 선택이 같은 미래 지문으로 수렴합니다' : '개선됨 · 선택 조합이 서로 다른 장기 미래 지문으로 이어집니다',
      evidence: highCollision.length > 0
        ? highCollision.map((nation) => `${nation.nationId} ${nation.futurePathCollisionRate}%`).join(' · ')
        : `${run.totalSessions.toLocaleString('ko-KR')}개 경력의 미래 경로 충돌률은 ${run.futurePathCollisionRate}%입니다.`,
      recommendation: highCollision.length > 0 ? '시대별 사건 선택과 국가 의제·위기 결과를 미래 지문에 더 포함합니다.' : '결말 문구와 주간 결과 설명에서도 동일한 경로 지문을 노출해 선택의 인과를 설명합니다.',
    },
    {
      priority: lowViability.length > 0 || run.viableRate >= 99 ? 'P1' : 'P2',
      id: 'nation-viability',
      title: lowViability.length > 0 ? '일부 국가는 선택과 무관하게 붕괴 경로가 과도합니다' : run.viableRate >= 99 ? '모든 경력이 생존해 실패와 회복의 긴장이 부족합니다' : '개선됨 · 모든 국가에 실패와 회복이 공존하는 생존 범위가 있습니다',
      evidence: lowViability.length > 0
        ? lowViability.map((nation) => `${nation.nationId} 생존 ${nation.viableRate}%`).join(' · ')
        : `전체 생존 가능한 경력 비율 ${run.viableRate}%, 국가 평균 결과 격차 ${run.nationOutcomeSpread}점입니다.`,
      recommendation: lowViability.length > 0
        ? '해방·탈식민 국가의 초기 제도 비용을 낮추고 외교·사회계약 회복 경로를 강화합니다.'
        : run.viableRate >= 99
          ? '구조 불안·기후·체제 단절이 누적될 때 실제 실패가 발생하되 모든 국가에 회복 선택지를 남깁니다.'
          : '국가별 난이도는 유지하되 10·90분위 결과 범위를 회귀 테스트로 고정합니다.',
    },
    {
      priority: outcomeGuardrailViolations.length > 0 ? 'P1' : 'P2',
      id: 'outcome-distribution-regression',
      title: outcomeGuardrailViolations.length > 0 ? '국가별 결과 분포가 검증 범위를 벗어났습니다' : '개선됨 · 국가별 10·90분위와 생존 범위가 회귀 기준 안에 있습니다',
      evidence: outcomeGuardrailViolations.length > 0
        ? outcomeGuardrailViolations.join(' · ')
        : '13개 국가의 하위 10%, 상위 10%, 생존 비율을 각각 검증해 지나친 평준화와 일방적 붕괴를 함께 차단했습니다.',
      recommendation: outcomeGuardrailViolations.length > 0
        ? '국가 고유 보너스를 직접 바꾸기보다 회복 수단·과잉확장 압력·구조 불안의 상호작용을 다시 조정합니다.'
        : '새 사건·정책 축을 추가한 뒤 동일한 국가별 분포 검사를 다시 실행합니다.',
    },
    {
      priority: weakDimensions.length > 0 ? 'P1' : 'P2',
      id: 'choice-consequence-sensitivity',
      title: weakDimensions.length > 0 ? '일부 선택 축이 장기 결과에 거의 영향을 주지 않습니다' : '개선됨 · 모든 주요 선택 축이 적어도 하나의 장기 결과를 변화시킵니다',
      evidence: weakDimensions.length > 0
        ? weakDimensions.slice(0, 20).join(' · ')
        : '행동 성향·교리·체제·전환·의제·위기·경제·외교·기술·보건·전쟁·미래·선거·세계 대응의 결과 민감도가 확인됐습니다.',
      recommendation: weakDimensions.length > 0 ? '영향이 약한 축에 전용 성공 조건·부작용·회복 수단을 배정합니다.' : '새 선택지를 추가할 때 결과 민감도 1.5점 미만을 경고하는 회귀 기준을 유지합니다.',
    },
  ];
}

export function aggregatePossibilityMatrixSessions(
  sessions: PossibilityMatrixSession[],
  sessionsPerNation = POSSIBILITY_MATRIX_SESSIONS_PER_NATION,
): PossibilityMatrixRun {
  const byNation = Object.fromEntries(nations.map((nation) => [
    nation.id,
    aggregateNation(nation.id, sessions.filter((session) => session.nationId === nation.id)),
  ])) as Record<NationId, PossibilityNationAggregate>;
  const nationValues = Object.values(byNation);
  const uniqueCombinations = nationValues.reduce((sum, nation) => sum + nation.uniqueCombinations, 0);
  const uniqueFuturePaths = new Set(sessions.map((session) => `${session.nationId}:${session.futurePathCode}`)).size;
  const uniqueEndings = new Set(sessions.map((session) => `${session.nationId}:${session.finalEndingId}`)).size;
  const averageScores = nationValues.map((nation) => nation.averageNationalScore);
  const withoutFindings = {
    generatedAt: new Date().toISOString(),
    methodology: `${nations.length} nations × ${sessionsPerNation.toLocaleString('en-US')} unique mixed-radix policy combinations from 1942 to 2060. Every career resolves one of three nation-specific 26-week strategic programs and recurring institutional reviews, the full ${worldHistoryEvents.length}-event historical/future atlas through one of three variants, twelve era checkpoints, country transition rules, player-built recovery capacity, power overextension, structural unrest, crisis, election, conflict, public-health and technology consequences.`,
    sessionsPerNation,
    totalSessions: sessions.length,
    totalHistoricalEventChoices: sessions.reduce((sum, session) => sum + session.eventChoices, 0),
    uniqueCombinations,
    uniqueFuturePaths,
    futurePathCollisionRate: rate(sessions.length - uniqueFuturePaths, sessions.length),
    endingCollisionRate: rate(sessions.length - uniqueEndings, sessions.length),
    viableRate: rate(sessions.filter((session) => session.viable).length, sessions.length),
    nationOutcomeSpread: round(Math.max(...averageScores) - Math.min(...averageScores)),
    byNation,
  };
  return { ...withoutFindings, findings: buildFindings(withoutFindings) };
}

export function runPossibilityMatrix(
  sessionsPerNation = POSSIBILITY_MATRIX_SESSIONS_PER_NATION,
) {
  const sessions = nations.flatMap((nation) => Array.from(
    { length: sessionsPerNation },
    (_, nationScenarioId) => runPossibilityMatrixSession(nation.id, nationScenarioId),
  ));
  return {
    sessions,
    run: aggregatePossibilityMatrixSessions(sessions, sessionsPerNation),
  };
}
