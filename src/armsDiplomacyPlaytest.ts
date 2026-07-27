import { nations } from './campaign';
import {
  acquisitionRouteLabels,
  armsDiplomacyPolicies,
  getNationArmsProfile,
  getStageDiplomaticPolicies,
  getStageWeaponPrograms,
  strategicStages,
  type AcquisitionRoute,
  type ArmsDiplomacyDoctrine,
  type StrategicStageId,
} from './strategicArmsDiplomacy';
import type { EquipmentCategory, NationId } from './types';

export const armsDiplomacyDoctrines: ArmsDiplomacyDoctrine[] = [
  'arsenal',
  'alliance',
  'nonaligned',
  'deterrent',
  'exporter',
  'institutionalist',
];

export const armsDiplomacyDoctrineLabels: Record<ArmsDiplomacyDoctrine, string> = {
  arsenal: '자립 병기창',
  alliance: '동맹 통합',
  nonaligned: '비동맹 균형',
  deterrent: '독자 억제',
  exporter: '방산 수출',
  institutionalist: '규범·군축',
};

export interface ArmsDiplomacySession {
  id: string;
  nationId: NationId;
  stageId: StrategicStageId;
  iteration: number;
  doctrine: ArmsDiplomacyDoctrine;
  decisions: number;
  weaponPrograms: string[];
  diplomaticPolicies: string[];
  routeCounts: Partial<Record<AcquisitionRoute, number>>;
  categoryCounts: Partial<Record<EquipmentCategory, number>>;
  capabilityGain: number;
  finalCapability: number;
  finalAutonomy: number;
  finalInteroperability: number;
  finalRelations: number;
  finalTreasury: number;
  fiscalStress: number;
  finalEscalation: number;
  finalSupplySecurity: number;
  finalProliferation: number;
  finalTreatyCompliance: number;
  exportInfluence: number;
  sanctions: number;
  procurementFailures: number;
  obsoleteLockIn: boolean;
  viable: boolean;
  collapsed: boolean;
  decisionImpact: number;
  pathSignature: string;
}

export interface NationStageArmsAggregate {
  nationId: NationId;
  stageId: StrategicStageId;
  sessions: number;
  doctrineCoverage: number;
  uniquePaths: number;
  dominantPathRate: number;
  dominantRoute: AcquisitionRoute;
  dominantRouteRate: number;
  averageCapabilityGain: number;
  averageFinalCapability: number;
  averageAutonomy: number;
  averageInteroperability: number;
  averageRelations: number;
  averageTreasury: number;
  averageFiscalStress: number;
  averageEscalation: number;
  averageSupplySecurity: number;
  averageProliferation: number;
  averageTreatyCompliance: number;
  averageDecisionImpact: number;
  sanctionsPerSession: number;
  procurementFailureRate: number;
  obsoleteLockInRate: number;
  viabilityRate: number;
  collapseRate: number;
  topPrograms: Array<{ id: string; uses: number }>;
  topPolicies: Array<{ id: string; uses: number }>;
}

export interface ArmsDiplomacyFinding {
  priority: 'P0' | 'P1' | 'P2';
  id: string;
  title: string;
  evidence: string;
  remediation: string;
}

export interface ArmsDiplomacySummary {
  generatedAt: string;
  methodology: string;
  sessions: number;
  simulationsPerNationStage: number;
  nationCoverage: number;
  stageCoverage: number;
  doctrineCoverage: number;
  totalDecisions: number;
  totalWeaponProgramUses: number;
  totalDiplomaticPolicyUses: number;
  averageCapabilityGain: number;
  averageAutonomy: number;
  averageInteroperability: number;
  averageRelations: number;
  averageFiscalStress: number;
  averageEscalation: number;
  averageSupplySecurity: number;
  averageProliferation: number;
  averageTreatyCompliance: number;
  viabilityRate: number;
  collapseRate: number;
  obsoleteLockInRate: number;
  byNationStage: NationStageArmsAggregate[];
  byStage: Array<{
    stageId: StrategicStageId;
    sessions: number;
    averageCapabilityGain: number;
    averageEscalation: number;
    averageTreatyCompliance: number;
    viabilityRate: number;
    collapseRate: number;
  }>;
  byDoctrine: Array<{
    doctrine: ArmsDiplomacyDoctrine;
    sessions: number;
    averageCapabilityGain: number;
    averageAutonomy: number;
    averageEscalation: number;
    viabilityRate: number;
  }>;
  findings: ArmsDiplomacyFinding[];
}

interface MutableState {
  capability: number;
  autonomy: number;
  interoperability: number;
  relations: number;
  treasury: number;
  fiscalStress: number;
  escalation: number;
  supplySecurity: number;
  proliferation: number;
  treatyCompliance: number;
  exportInfluence: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const rate = (count: number, total: number) => round(count / Math.max(1, total) * 100);
const applyDiminishingDelta = (current: number, delta: number) => (
  clamp(current + (delta > 0 ? delta * Math.max(0.18, (112 - current) / 100) : delta))
);

function stableRoll(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 2246822519);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

function weightedChoice<T>(values: Array<{ value: T; weight: number }>, roll: number): T {
  const positive = values.map((entry) => ({ ...entry, weight: Math.max(0.001, entry.weight) }));
  const total = positive.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = roll * total;
  for (const entry of positive) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.value;
  }
  return positive[positive.length - 1].value;
}

const doctrineRouteWeights: Record<ArmsDiplomacyDoctrine, Partial<Record<AcquisitionRoute, number>>> = {
  arsenal: { indigenous: 8, license: 4, joint: 2, import: 1, aid: 1, covert: 1, export: 2 },
  alliance: { joint: 8, aid: 5, license: 5, import: 2, indigenous: 2, covert: 0.5, export: 2 },
  nonaligned: { import: 5, license: 5, indigenous: 4, joint: 3, aid: 2, covert: 2, export: 2 },
  deterrent: { indigenous: 8, covert: 5, license: 2, joint: 1, import: 1, aid: 1, export: 1 },
  exporter: { export: 8, indigenous: 5, license: 4, joint: 3, import: 1, aid: 1, covert: 1 },
  institutionalist: { joint: 7, license: 3, aid: 3, import: 2, indigenous: 2, export: 3, covert: 0.25 },
};

function selectRoute(
  nationId: NationId,
  doctrine: ArmsDiplomacyDoctrine,
  key: string,
): AcquisitionRoute {
  const profile = getNationArmsProfile(nationId);
  const weights = doctrineRouteWeights[doctrine];
  return weightedChoice(
    (Object.keys(acquisitionRouteLabels) as AcquisitionRoute[]).map((route) => ({
      value: route,
      weight: (weights[route] ?? 1)
        * (profile.preferredRoutes.includes(route) ? 1.65 : 1)
        * (route === 'indigenous' ? 0.45 + profile.scienceBase / 125 : 1)
        * (route === 'export' ? 0.35 + profile.exportCapacity / 110 : 1)
        * (route === 'aid' || route === 'import' ? 0.45 + profile.importDependence / 110 : 1),
    })),
    stableRoll(key),
  );
}

function selectCategory(nationId: NationId, doctrine: ArmsDiplomacyDoctrine, key: string): EquipmentCategory {
  const profile = getNationArmsProfile(nationId);
  const categories = getStageWeaponPrograms('total-war').map((program) => program.category);
  return weightedChoice(categories.map((category) => ({
    value: category,
    weight: (profile.priorities.includes(category) ? 3.1 : 1)
      * (doctrine === 'deterrent' && category === 'strategic' ? 3 : 1)
      * (doctrine === 'institutionalist' && (category === 'systems' || category === 'logistics') ? 1.8 : 1)
      * (doctrine === 'exporter' && (category === 'aircraft' || category === 'armor') ? 1.5 : 1),
  })), stableRoll(key));
}

function routeSuccessChance(route: AcquisitionRoute, nationId: NationId, state: MutableState) {
  const profile = getNationArmsProfile(nationId);
  const base: Record<AcquisitionRoute, number> = {
    indigenous: 0.28 + profile.scienceBase / 190 + profile.industrialBase / 390,
    license: 0.46 + profile.industrialBase / 230 + state.relations / 500,
    import: 0.61 + state.relations / 350 - profile.importDependence / 900,
    joint: 0.45 + profile.interoperability / 260 + state.relations / 420,
    aid: 0.56 + state.relations / 310 - profile.autonomy / 1000,
    covert: 0.38 + profile.sanctionsResilience / 330,
    export: 0.42 + profile.exportCapacity / 210 + state.treatyCompliance / 700,
  };
  return clamp(base[route], 0.2, 0.93);
}

function applyWeaponProgram(
  state: MutableState,
  nationId: NationId,
  route: AcquisitionRoute,
  program: ReturnType<typeof getStageWeaponPrograms>[number],
  roll: number,
  repeatedCategoryUses: number,
) {
  const profile = getNationArmsProfile(nationId);
  const success = roll <= routeSuccessChance(route, nationId, state);
  const routeCapability: Record<AcquisitionRoute, number> = {
    indigenous: 1.08, license: 0.96, import: 1.04, joint: 1.02, aid: 0.86, covert: 0.8, export: 0.74,
  };
  const affordability = clamp((profile.industrialBase + profile.scienceBase + state.treasury) / 260, 0.5, 1.15);
  const rawGain = success ? program.capabilityGain * routeCapability[route] * affordability : program.capabilityGain * 0.16;
  const gain = rawGain
    * Math.max(0.16, (112 - state.capability) / 88)
    / (1 + repeatedCategoryUses * 0.52);
  const fiscal = program.industrialLoad * (route === 'aid' ? 0.28 : route === 'import' ? 0.62 : route === 'joint' ? 0.56 : route === 'export' ? 0.35 : 0.72);
  state.capability = clamp(state.capability + gain);
  state.treasury = clamp(state.treasury - fiscal + (route === 'export' ? profile.exportCapacity / 8 : 0), 0, 220);
  state.fiscalStress = clamp(state.fiscalStress + fiscal / 5 - (route === 'export' ? profile.exportCapacity / 20 : 0));
  state.autonomy = applyDiminishingDelta(state.autonomy, route === 'indigenous' ? 4 : route === 'license' ? 2 : route === 'joint' ? -1 : route === 'export' ? 2 : route === 'covert' ? 1 : -4);
  state.interoperability = applyDiminishingDelta(state.interoperability, route === 'joint' ? 5 : route === 'license' ? 3 : route === 'aid' || route === 'import' ? 3 : route === 'covert' ? -4 : 0);
  state.relations = applyDiminishingDelta(state.relations, route === 'joint' || route === 'aid' ? 4 : route === 'import' || route === 'license' || route === 'export' ? 2 : route === 'covert' ? -3 : 0);
  state.supplySecurity = applyDiminishingDelta(state.supplySecurity, route === 'indigenous' ? 4 : route === 'license' ? 3 : route === 'joint' ? 2 : route === 'export' ? 1 : -3);
  state.escalation = clamp(state.escalation + program.escalationRisk / 6.2 + (route === 'covert' ? 5 : program.category === 'strategic' ? 3 : 0));
  state.proliferation = clamp(state.proliferation + (program.category === 'strategic' ? program.escalationRisk / 3 : 0) + (route === 'covert' ? 4 : 0));
  state.exportInfluence = clamp(state.exportInfluence + (route === 'export' ? 7 : 0));
  return success;
}

function applyPolicy(state: MutableState, policyId: string) {
  const item = armsDiplomacyPolicies.find((candidate) => candidate.id === policyId);
  if (!item) return;
  const effects = item.effects;
  state.capability = applyDiminishingDelta(state.capability, effects.capability);
  state.autonomy = applyDiminishingDelta(state.autonomy, effects.autonomy);
  state.interoperability = applyDiminishingDelta(state.interoperability, effects.interoperability);
  state.relations = applyDiminishingDelta(state.relations, effects.relations);
  state.treasury = clamp(state.treasury + effects.treasury / 10, 0, 220);
  state.fiscalStress = clamp(state.fiscalStress + Math.max(0, -effects.treasury) / 28 - Math.max(0, effects.treasury) / 40);
  state.escalation = clamp(state.escalation + effects.escalation);
  state.supplySecurity = applyDiminishingDelta(state.supplySecurity, effects.supplySecurity);
  state.proliferation = clamp(state.proliferation + effects.proliferation);
  state.treatyCompliance = clamp(state.treatyCompliance + effects.treatyCompliance);
  state.exportInfluence = clamp(state.exportInfluence + effects.exportInfluence);
}

function selectPolicy(
  stageId: StrategicStageId,
  doctrine: ArmsDiplomacyDoctrine,
  route: AcquisitionRoute,
  state: MutableState,
  key: string,
  used: Set<string>,
) {
  const available = getStageDiplomaticPolicies(stageId).filter((item) => !used.has(item.id));
  if (available.length === 0) return null;
  return weightedChoice(available.map((item) => ({
    value: item,
    weight: (item.route === route ? 2.7 : 1)
      * (doctrine === 'institutionalist' && (item.effects.treatyCompliance > 0 || item.effects.escalation < 0) ? 2.2 : 1)
      * (doctrine === 'deterrent' && item.effects.capability > 10 ? 2 : 1)
      * (doctrine === 'alliance' && item.effects.interoperability > 8 ? 2 : 1)
      * (doctrine === 'exporter' && item.effects.exportInfluence > 0 ? 2.4 : 1)
      * (doctrine === 'nonaligned' && item.effects.autonomy > 5 ? 2.1 : 1)
      * (state.escalation >= 60 && item.effects.escalation < 0 ? 3.4 : 1)
      * (state.supplySecurity < 45 && item.effects.supplySecurity > 5 ? 2.5 : 1),
  })), stableRoll(key));
}

function countTop(values: string[], limit = 5) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([id, uses]) => ({ id, uses }))
    .sort((left, right) => right.uses - left.uses || left.id.localeCompare(right.id))
    .slice(0, limit);
}

export function simulateArmsDiplomacySession(
  nationId: NationId,
  stageId: StrategicStageId,
  iteration: number,
): ArmsDiplomacySession {
  const profile = getNationArmsProfile(nationId);
  const stageIndex = strategicStages.findIndex((stage) => stage.id === stageId);
  const doctrine = armsDiplomacyDoctrines[iteration % armsDiplomacyDoctrines.length];
  const id = `${nationId}:${stageId}:${iteration}`;
  const initialCapability = clamp(18 + profile.industrialBase * 0.25 + profile.scienceBase * 0.2 - stageIndex * 3);
  const state: MutableState = {
    capability: initialCapability,
    autonomy: profile.autonomy,
    interoperability: profile.interoperability,
    relations: clamp(42 + profile.interoperability / 5),
    treasury: clamp(68 + profile.industrialBase * 0.72, 0, 220),
    fiscalStress: clamp(25 + (70 - profile.industrialBase) / 2),
    escalation: clamp(10 + profile.escalationTolerance / 5 + stageIndex * 2),
    supplySecurity: clamp(72 - profile.importDependence / 2 + profile.sanctionsResilience / 4),
    proliferation: stageIndex >= 2 ? 12 : 4,
    treatyCompliance: doctrine === 'institutionalist' ? 50 : 30,
    exportInfluence: profile.exportCapacity / 3,
  };
  const routeCounts: Partial<Record<AcquisitionRoute, number>> = {};
  const categoryCounts: Partial<Record<EquipmentCategory, number>> = {};
  const weaponPrograms: string[] = [];
  const diplomaticPolicies: string[] = [];
  const usedPolicies = new Set<string>();
  let sanctions = 0;
  let procurementFailures = 0;
  let decisionImpactTotal = 0;
  const turns = 12;

  for (let turn = 0; turn < turns; turn += 1) {
    const before = { ...state };
    const recurringRevenue = 6 + profile.industrialBase / 9 + profile.exportCapacity / 24 - state.fiscalStress / 28;
    state.treasury = clamp(state.treasury + recurringRevenue, 0, 220);
    state.fiscalStress = clamp(state.fiscalStress - 2.4 - profile.industrialBase / 80);
    const route = selectRoute(nationId, doctrine, `${id}:route:${turn}`);
    const category = selectCategory(nationId, doctrine, `${id}:category:${turn}`);
    const program = getStageWeaponPrograms(stageId).find((candidate) => candidate.category === category)!;
    routeCounts[route] = (routeCounts[route] ?? 0) + 1;
    categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
    weaponPrograms.push(program.id);
    const success = applyWeaponProgram(state, nationId, route, program, stableRoll(`${id}:success:${turn}`), (categoryCounts[category] ?? 1) - 1);
    if (!success) procurementFailures += 1;

    if (turn % 3 === 1) {
      const selectedPolicy = selectPolicy(stageId, doctrine, route, state, `${id}:policy:${turn}`, usedPolicies);
      if (selectedPolicy) {
        usedPolicies.add(selectedPolicy.id);
        diplomaticPolicies.push(selectedPolicy.id);
        applyPolicy(state, selectedPolicy.id);
      }
    }

    const sanctionChance = clamp(
      0.015
      + Math.max(0, state.escalation - 55) / 240
      + (route === 'covert' ? 0.16 : 0)
      + (state.proliferation > 60 ? 0.08 : 0)
      - profile.sanctionsResilience / 900,
      0,
      0.42,
    );
    if (stableRoll(`${id}:sanction:${turn}`) < sanctionChance) {
      sanctions += 1;
      state.treasury = clamp(state.treasury - 8);
      state.supplySecurity = clamp(state.supplySecurity - Math.max(3, Math.round(profile.importDependence / 18)));
      state.relations = clamp(state.relations - 5);
    }
    if (state.escalation > 58 && state.treatyCompliance > 48) {
      const verificationBuffer = (state.treatyCompliance - 45) / 4 + state.relations / 65;
      state.escalation = clamp(state.escalation - verificationBuffer);
    }

    decisionImpactTotal += Object.keys(state).reduce((total, key) => (
      total + Math.abs(state[key as keyof MutableState] - before[key as keyof MutableState])
    ), 0);
  }

  const routeOrder = Object.entries(routeCounts).sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0)).map(([route]) => route).slice(0, 2);
  const categoryOrder = Object.entries(categoryCounts).sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0)).map(([category]) => category).slice(0, 2);
  const policyOrder = [...diplomaticPolicies].sort().slice(0, 2);
  const obsoleteLockIn = stageIndex >= 1 && (state.capability < 58 + stageIndex * 4 || state.supplySecurity < 28);
  const collapsed = (state.treasury <= 4 && state.supplySecurity < 25)
    || (state.escalation >= 98 && state.treatyCompliance < 30 && state.relations < 35);
  const viable = !collapsed && state.capability >= 58 + stageIndex * 2 && state.supplySecurity >= 30 && state.treasury >= 12;

  return {
    id,
    nationId,
    stageId,
    iteration,
    doctrine,
    decisions: turns + diplomaticPolicies.length,
    weaponPrograms,
    diplomaticPolicies,
    routeCounts,
    categoryCounts,
    capabilityGain: round(state.capability - initialCapability),
    finalCapability: round(state.capability),
    finalAutonomy: round(state.autonomy),
    finalInteroperability: round(state.interoperability),
    finalRelations: round(state.relations),
    finalTreasury: round(state.treasury),
    fiscalStress: round(state.fiscalStress),
    finalEscalation: round(state.escalation),
    finalSupplySecurity: round(state.supplySecurity),
    finalProliferation: round(state.proliferation),
    finalTreatyCompliance: round(state.treatyCompliance),
    exportInfluence: round(state.exportInfluence),
    sanctions,
    procurementFailures,
    obsoleteLockIn,
    viable,
    collapsed,
    decisionImpact: round(decisionImpactTotal / Math.max(1, turns + diplomaticPolicies.length)),
    pathSignature: `${routeOrder.join('+')}|${categoryOrder.join('+')}|${policyOrder.join('+')}`,
  };
}

function aggregateGroup(sessions: ArmsDiplomacySession[]): NationStageArmsAggregate {
  const paths = countTop(sessions.map((session) => session.pathSignature), sessions.length);
  const routes = countTop(sessions.flatMap((session) => Object.entries(session.routeCounts).flatMap(([route, count]) => Array(count ?? 0).fill(route))), 7);
  const totalRouteUses = routes.reduce((sum, item) => sum + item.uses, 0);
  const dominantRoute = (routes[0]?.id ?? 'indigenous') as AcquisitionRoute;
  return {
    nationId: sessions[0].nationId,
    stageId: sessions[0].stageId,
    sessions: sessions.length,
    doctrineCoverage: new Set(sessions.map((session) => session.doctrine)).size,
    uniquePaths: new Set(sessions.map((session) => session.pathSignature)).size,
    dominantPathRate: rate(paths[0]?.uses ?? 0, sessions.length),
    dominantRoute,
    dominantRouteRate: rate(routes[0]?.uses ?? 0, totalRouteUses),
    averageCapabilityGain: round(average(sessions.map((session) => session.capabilityGain))),
    averageFinalCapability: round(average(sessions.map((session) => session.finalCapability))),
    averageAutonomy: round(average(sessions.map((session) => session.finalAutonomy))),
    averageInteroperability: round(average(sessions.map((session) => session.finalInteroperability))),
    averageRelations: round(average(sessions.map((session) => session.finalRelations))),
    averageTreasury: round(average(sessions.map((session) => session.finalTreasury))),
    averageFiscalStress: round(average(sessions.map((session) => session.fiscalStress))),
    averageEscalation: round(average(sessions.map((session) => session.finalEscalation))),
    averageSupplySecurity: round(average(sessions.map((session) => session.finalSupplySecurity))),
    averageProliferation: round(average(sessions.map((session) => session.finalProliferation))),
    averageTreatyCompliance: round(average(sessions.map((session) => session.finalTreatyCompliance))),
    averageDecisionImpact: round(average(sessions.map((session) => session.decisionImpact))),
    sanctionsPerSession: round(average(sessions.map((session) => session.sanctions)), 2),
    procurementFailureRate: rate(sessions.reduce((sum, session) => sum + session.procurementFailures, 0), sessions.length * 12),
    obsoleteLockInRate: rate(sessions.filter((session) => session.obsoleteLockIn).length, sessions.length),
    viabilityRate: rate(sessions.filter((session) => session.viable).length, sessions.length),
    collapseRate: rate(sessions.filter((session) => session.collapsed).length, sessions.length),
    topPrograms: countTop(sessions.flatMap((session) => session.weaponPrograms)),
    topPolicies: countTop(sessions.flatMap((session) => session.diplomaticPolicies)),
  };
}

function buildFindings(groups: NationStageArmsAggregate[]): ArmsDiplomacyFinding[] {
  const worstCollapse = [...groups].sort((left, right) => right.collapseRate - left.collapseRate)[0];
  const worstViability = [...groups].sort((left, right) => left.viabilityRate - right.viabilityRate)[0];
  const worstLockIn = [...groups].sort((left, right) => right.obsoleteLockInRate - left.obsoleteLockInRate)[0];
  const worstDominance = [...groups].sort((left, right) => right.dominantRouteRate - left.dominantRouteRate)[0];
  const highestEscalation = [...groups].sort((left, right) => right.averageEscalation - left.averageEscalation)[0];
  const lowImpact = [...groups].sort((left, right) => left.averageDecisionImpact - right.averageDecisionImpact)[0];
  return [
    {
      priority: worstCollapse.collapseRate >= 5 ? 'P0' : worstCollapse.collapseRate >= 2 ? 'P1' : 'P2',
      id: 'state-collapse',
      title: worstCollapse.collapseRate < 2 ? '재정·공급 붕괴가 예외적 범위로 억제됨' : '일부 국가·시대에서 조달 충격이 국가 붕괴로 직결됨',
      evidence: `${worstCollapse.nationId}/${worstCollapse.stageId} 붕괴율 ${worstCollapse.collapseRate}%, 평균 재정 ${worstCollapse.averageTreasury}, 공급안보 ${worstCollapse.averageSupplySecurity}.`,
      remediation: '저산업 국가에 원조→면허→독자생산 단계 전환 보너스와 제재 긴급비축을 제공하십시오.',
    },
    {
      priority: worstViability.viabilityRate < 60 ? 'P0' : worstViability.viabilityRate < 80 ? 'P1' : 'P2',
      id: 'small-power-viability',
      title: worstViability.viabilityRate >= 80 ? '중소국도 외교·면허 경로로 경쟁력을 유지함' : '중소국의 생존 가능한 조달 경로가 부족함',
      evidence: `${worstViability.nationId}/${worstViability.stageId} 생존 가능률 ${worstViability.viabilityRate}%, 전력 증가 ${worstViability.averageCapabilityGain}, 실패율 ${worstViability.procurementFailureRate}%.`,
      remediation: '정비권·기술자 교육·부품 현지화가 포함된 소규모 공동개발과 지역 공동비축을 강화하십시오.',
    },
    {
      priority: worstLockIn.obsoleteLockInRate > 20 ? 'P1' : 'P2',
      id: 'obsolete-lock-in',
      title: worstLockIn.obsoleteLockInRate <= 10 ? '잉여장비 의존이 장기 기술고착으로 이어지지 않음' : '값싼 직도입이 후대 규격·정비 고착을 만듦',
      evidence: `${worstLockIn.nationId}/${worstLockIn.stageId} 구식체계 고착 ${worstLockIn.obsoleteLockInRate}%, 상호운용 ${worstLockIn.averageInteroperability}, 공급안보 ${worstLockIn.averageSupplySecurity}.`,
      remediation: '직도입 2회 뒤 현지정비 또는 면허생산을 요구하고 세대교체 비용을 사전에 표시하십시오.',
    },
    {
      priority: worstDominance.dominantRouteRate > 55 ? 'P1' : 'P2',
      id: 'route-dominance',
      title: worstDominance.dominantRouteRate <= 45 ? '독자·면허·공동개발·수입 경로가 경쟁함' : '한 조달 방식이 다른 가능세계를 압도함',
      evidence: `${worstDominance.nationId}/${worstDominance.stageId}에서 ${acquisitionRouteLabels[worstDominance.dominantRoute]} 비중 ${worstDominance.dominantRouteRate}%, 고유 경로 ${worstDominance.uniquePaths}개.`,
      remediation: '반복 조달에 한계효용 감소와 공급국 협상 피로를 적용하고 혼합 규격의 비용과 다변화의 제재 회복력을 함께 조정하십시오.',
    },
    {
      priority: highestEscalation.averageEscalation > 80 ? 'P0' : highestEscalation.averageEscalation > 65 ? 'P1' : 'P2',
      id: 'arms-race-escalation',
      title: highestEscalation.averageEscalation <= 65 ? '군축·핫라인이 군비경쟁의 오판 위험을 상쇄함' : '전략무기 경쟁이 외교적 완충장치보다 빠르게 상승함',
      evidence: `${highestEscalation.nationId}/${highestEscalation.stageId} 평균 긴장 ${highestEscalation.averageEscalation}, 비확산 위험 ${highestEscalation.averageProliferation}, 조약 신뢰 ${highestEscalation.averageTreatyCompliance}.`,
      remediation: '전략무기 사업 단계마다 사전통보·사찰·핫라인 선택을 제시하고 비밀개발의 누적 노출 위험을 높이십시오.',
    },
    {
      priority: lowImpact.averageDecisionImpact < 4 ? 'P1' : 'P2',
      id: 'decision-impact',
      title: lowImpact.averageDecisionImpact >= 4 ? '각 결정이 전력·자율성·외교·공급망에 추적 가능한 변화를 만듦' : '일부 선택의 결과 차이가 체감되기 어려움',
      evidence: `${lowImpact.nationId}/${lowImpact.stageId} 결정당 평균 상태변화 ${lowImpact.averageDecisionImpact}, 지배 경로율 ${lowImpact.dominantPathRate}%.`,
      remediation: '선택 전 1·3·5년 예상치와 사후 원인 추적을 같은 카드에 표시하십시오.',
    },
  ];
}

export function aggregateArmsDiplomacySessions(
  sessions: ArmsDiplomacySession[],
  simulationsPerNationStage: number,
): ArmsDiplomacySummary {
  const groups = nations.flatMap((nation) => strategicStages.map((stage) => {
    const matches = sessions.filter((session) => session.nationId === nation.id && session.stageId === stage.id);
    return matches.length > 0 ? aggregateGroup(matches) : null;
  })).filter((item): item is NationStageArmsAggregate => Boolean(item));
  const byStage = strategicStages.map((stage) => {
    const matches = sessions.filter((session) => session.stageId === stage.id);
    return {
      stageId: stage.id,
      sessions: matches.length,
      averageCapabilityGain: round(average(matches.map((session) => session.capabilityGain))),
      averageEscalation: round(average(matches.map((session) => session.finalEscalation))),
      averageTreatyCompliance: round(average(matches.map((session) => session.finalTreatyCompliance))),
      viabilityRate: rate(matches.filter((session) => session.viable).length, matches.length),
      collapseRate: rate(matches.filter((session) => session.collapsed).length, matches.length),
    };
  });
  const byDoctrine = armsDiplomacyDoctrines.map((doctrine) => {
    const matches = sessions.filter((session) => session.doctrine === doctrine);
    return {
      doctrine,
      sessions: matches.length,
      averageCapabilityGain: round(average(matches.map((session) => session.capabilityGain))),
      averageAutonomy: round(average(matches.map((session) => session.finalAutonomy))),
      averageEscalation: round(average(matches.map((session) => session.finalEscalation))),
      viabilityRate: rate(matches.filter((session) => session.viable).length, matches.length),
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    methodology: `${nations.length}개 국가 × ${strategicStages.length}개 시대 단계 × 단계별 ${simulationsPerNationStage.toLocaleString('en-US')}회 결정론적 시뮬레이션. 각 세션은 12개 무기체계 사업과 4개 외교·조달 정책 결정을 평가합니다.`,
    sessions: sessions.length,
    simulationsPerNationStage,
    nationCoverage: new Set(sessions.map((session) => session.nationId)).size,
    stageCoverage: new Set(sessions.map((session) => session.stageId)).size,
    doctrineCoverage: new Set(sessions.map((session) => session.doctrine)).size,
    totalDecisions: sessions.reduce((sum, session) => sum + session.decisions, 0),
    totalWeaponProgramUses: sessions.reduce((sum, session) => sum + session.weaponPrograms.length, 0),
    totalDiplomaticPolicyUses: sessions.reduce((sum, session) => sum + session.diplomaticPolicies.length, 0),
    averageCapabilityGain: round(average(sessions.map((session) => session.capabilityGain))),
    averageAutonomy: round(average(sessions.map((session) => session.finalAutonomy))),
    averageInteroperability: round(average(sessions.map((session) => session.finalInteroperability))),
    averageRelations: round(average(sessions.map((session) => session.finalRelations))),
    averageFiscalStress: round(average(sessions.map((session) => session.fiscalStress))),
    averageEscalation: round(average(sessions.map((session) => session.finalEscalation))),
    averageSupplySecurity: round(average(sessions.map((session) => session.finalSupplySecurity))),
    averageProliferation: round(average(sessions.map((session) => session.finalProliferation))),
    averageTreatyCompliance: round(average(sessions.map((session) => session.finalTreatyCompliance))),
    viabilityRate: rate(sessions.filter((session) => session.viable).length, sessions.length),
    collapseRate: rate(sessions.filter((session) => session.collapsed).length, sessions.length),
    obsoleteLockInRate: rate(sessions.filter((session) => session.obsoleteLockIn).length, sessions.length),
    byNationStage: groups,
    byStage,
    byDoctrine,
    findings: buildFindings(groups),
  };
}

export function runArmsDiplomacyPlaytest(simulationsPerNationStage = 1_000) {
  const sessions: ArmsDiplomacySession[] = [];
  nations.forEach((nation) => {
    strategicStages.forEach((stage) => {
      for (let iteration = 0; iteration < simulationsPerNationStage; iteration += 1) {
        sessions.push(simulateArmsDiplomacySession(nation.id, stage.id, iteration));
      }
    });
  });
  return {
    sessions,
    summary: aggregateArmsDiplomacySessions(sessions, simulationsPerNationStage),
  };
}
