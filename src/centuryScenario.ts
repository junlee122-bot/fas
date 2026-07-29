import type { NationAgendaChoiceId } from './nationDevelopment';
import type { NationBudgetDomain, NationStrategyId } from './nationManagement';
import type { NationId } from './types';

export type CenturyBehaviorProfile = 'guided' | 'rushed' | 'military' | 'state-builder' | 'completionist' | 'opportunist';
export type CenturyDoctrine = 'coalition' | 'methodical' | 'maneuver';
export type CenturyTransitionApproach = 'accelerated' | 'readiness' | 'negotiated' | 'protracted';
export type CenturyCrisisApproach = 'constitutional' | 'negotiation' | 'command' | 'counter-intelligence';
export type CenturyEconomicModel = 'reconstruction' | 'welfare' | 'industrial' | 'open-market' | 'security';
export type CenturyDiplomaticPosture = 'alliance' | 'nonaligned' | 'regional' | 'multilateral' | 'revisionist';
export type CenturyTechnologyPosture = 'civilian' | 'military' | 'balanced' | 'frontier';
export type CenturyPublicHealthPosture = 'prevention' | 'adaptive' | 'minimal';
export type CenturyWarPosture = 'aggressive' | 'balanced' | 'cautious';
export type CenturyFuturePriority = 'climate' | 'space' | 'digital' | 'human-development' | 'strategic-autonomy';
export type CenturyElectionStyle = 'consensus' | 'grassroots' | 'media' | 'machine';

export interface CenturyScenarioBlueprint {
  scenarioId: number;
  combinationCode: number;
  combinationKey: string;
  profile: CenturyBehaviorProfile;
  doctrine: CenturyDoctrine;
  nationStrategy: NationStrategyId;
  transitionApproach: CenturyTransitionApproach;
  agendaChoice: NationAgendaChoiceId;
  crisisApproach: CenturyCrisisApproach;
  nationalProgramIndex: 0 | 1 | 2;
  economicModel: CenturyEconomicModel;
  diplomaticPosture: CenturyDiplomaticPosture;
  technologyPosture: CenturyTechnologyPosture;
  publicHealthPosture: CenturyPublicHealthPosture;
  warPosture: CenturyWarPosture;
  futurePriority: CenturyFuturePriority;
  electionStyle: CenturyElectionStyle;
  worldVariant: 0 | 1 | 2;
  budgetPriority: NationBudgetDomain;
}

export const CENTURY_SCENARIO_COMBINATION_CAPACITY = 12_960;

const profiles: CenturyBehaviorProfile[] = ['guided', 'rushed', 'military', 'state-builder', 'completionist', 'opportunist'];
const doctrines: CenturyDoctrine[] = ['coalition', 'methodical', 'maneuver'];
const strategies: NationStrategyId[] = ['reconstruction-state', 'social-contract', 'developmental-state', 'open-republic', 'security-republic'];
const transitionApproaches: CenturyTransitionApproach[] = ['accelerated', 'readiness', 'negotiated', 'protracted'];
const agendaChoices: NationAgendaChoiceId[] = ['bargain', 'invest', 'enforce'];
const crisisApproaches: CenturyCrisisApproach[] = ['constitutional', 'negotiation', 'command', 'counter-intelligence'];
const nationalProgramIndices = [0, 1, 2] as const;
const economicModels: CenturyEconomicModel[] = ['reconstruction', 'welfare', 'industrial', 'open-market', 'security'];
const diplomaticPostures: CenturyDiplomaticPosture[] = ['alliance', 'nonaligned', 'regional', 'multilateral', 'revisionist'];
const technologyPostures: CenturyTechnologyPosture[] = ['civilian', 'military', 'balanced', 'frontier'];
const publicHealthPostures: CenturyPublicHealthPosture[] = ['prevention', 'adaptive', 'minimal'];
const warPostures: CenturyWarPosture[] = ['aggressive', 'balanced', 'cautious'];
const futurePriorities: CenturyFuturePriority[] = ['climate', 'space', 'digital', 'human-development', 'strategic-autonomy'];
const electionStyles: CenturyElectionStyle[] = ['consensus', 'grassroots', 'media', 'machine'];

const budgetByEconomy: Record<CenturyEconomicModel, NationBudgetDomain> = {
  reconstruction: 'reconstruction',
  welfare: 'welfare',
  industrial: 'industry',
  'open-market': 'diplomacy',
  security: 'security',
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function takeDigit<T>(values: readonly T[], cursor: { value: number }) {
  const result = values[cursor.value % values.length];
  cursor.value = Math.floor(cursor.value / values.length);
  return result;
}

function independentPick<T>(values: T[], scenarioId: number, nationId: NationId, salt: string, combinationCode: number) {
  return values[stableHash(`${nationId}:${scenarioId}:${combinationCode}:${salt}`) % values.length];
}

/**
 * The first seven dimensions form a 12,960-cell mixed-radix space. Multiplication by 187 is a
 * bijection modulo 12,960, so every scenario from 0 through 12,959 has a genuinely different
 * policy/leadership combination instead of merely receiving a different random seed.
 */
export function createCenturyScenarioBlueprint(nationId: NationId, scenarioId: number): CenturyScenarioBlueprint {
  if (!Number.isInteger(scenarioId) || scenarioId < 0) throw new Error(`invalid century scenario id: ${scenarioId}`);
  const nationOffset = stableHash(`${nationId}:century-combination`) % CENTURY_SCENARIO_COMBINATION_CAPACITY;
  const combinationCode = (scenarioId * 187 + nationOffset) % CENTURY_SCENARIO_COMBINATION_CAPACITY;
  const cursor = { value: combinationCode };
  const profile = takeDigit(profiles, cursor);
  const doctrine = takeDigit(doctrines, cursor);
  const nationStrategy = takeDigit(strategies, cursor);
  const transitionApproach = takeDigit(transitionApproaches, cursor);
  const agendaChoice = takeDigit(agendaChoices, cursor);
  const crisisApproach = takeDigit(crisisApproaches, cursor);
  const nationalProgramIndex = takeDigit(nationalProgramIndices, cursor);
  const economicModel = independentPick(economicModels, scenarioId, nationId, 'economy', combinationCode);
  const diplomaticPosture = independentPick(diplomaticPostures, scenarioId, nationId, 'diplomacy', combinationCode);
  const technologyPosture = independentPick(technologyPostures, scenarioId, nationId, 'technology', combinationCode);
  const publicHealthPosture = independentPick(publicHealthPostures, scenarioId, nationId, 'health', combinationCode);
  const warPosture = independentPick(warPostures, scenarioId, nationId, 'war', combinationCode);
  const futurePriority = independentPick(futurePriorities, scenarioId, nationId, 'future', combinationCode);
  const electionStyle = independentPick(electionStyles, scenarioId, nationId, 'election', combinationCode);
  const worldVariant = independentPick([0, 1, 2] as const, scenarioId, nationId, 'world', combinationCode);
  const combinationKey = [
    profile,
    doctrine,
    nationStrategy,
    transitionApproach,
    agendaChoice,
    crisisApproach,
    `program-${nationalProgramIndex}`,
    economicModel,
    diplomaticPosture,
    technologyPosture,
    publicHealthPosture,
    warPosture,
    futurePriority,
    electionStyle,
    `world-${worldVariant}`,
  ].join('|');
  return {
    scenarioId,
    combinationCode,
    combinationKey,
    profile,
    doctrine,
    nationStrategy,
    transitionApproach,
    agendaChoice,
    crisisApproach,
    nationalProgramIndex,
    economicModel,
    diplomaticPosture,
    technologyPosture,
    publicHealthPosture,
    warPosture,
    futurePriority,
    electionStyle,
    worldVariant,
    budgetPriority: budgetByEconomy[economicModel],
  };
}

export function getCenturyTransitionBehaviorWeek(
  scenario: CenturyScenarioBlueprint,
  profileDefaultWeek: number,
) {
  if (scenario.transitionApproach === 'accelerated') return 52;
  if (scenario.transitionApproach === 'negotiated') return 156;
  if (scenario.transitionApproach === 'protracted') return 260;
  return profileDefaultWeek;
}
