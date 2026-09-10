import { describe, expect, it } from 'vitest';
import { createCampaignDivisions, nations } from './campaign';
import { applyEquipmentToDivision, createEquipmentDevelopment } from './equipment';
import {
  advanceWeaponReadinessWeek,
  assessWeaponCapabilityFamilies,
  createWeaponReadinessState,
  normalizeWeaponReadinessState,
  queueWeaponWorkOrder,
  transitionWeaponReadinessEquipment,
  weaponCapabilityFamilies,
  weaponCategoryOrder,
  type WeaponReadinessWeekContext,
} from './weaponReadiness';

const fielded = {
  infantry: 'infantry-model', artillery: 'artillery-model', armor: 'armor-model', aircraft: 'aircraft-model',
  naval: 'naval-model', logistics: 'logistics-model', systems: 'systems-model', strategic: 'strategic-model',
} as const;

function context(overrides: Partial<WeaponReadinessWeekContext> = {}): WeaponReadinessWeekContext {
  return {
    week: 1,
    fieldedByCategory: fielded,
    equipmentReliability: Object.fromEntries(weaponCategoryOrder.map((category) => [category, 76])),
    equipmentProduction: Object.fromEntries(weaponCategoryOrder.map((category) => [category, 72])),
    equipmentRisk: Object.fromEntries(weaponCategoryOrder.map((category) => [category, 8])),
    productionCoverage: Object.fromEntries(weaponCategoryOrder.map((category) => [category, 70])),
    stockpileCoverage: Object.fromEntries(weaponCategoryOrder.map((category) => [category, 72])),
    assignedModelCount: Object.fromEntries(weaponCategoryOrder.map((category) => [category, 1])),
    operationalTempo: 25,
    supplySecurity: 70,
    emergencyStockpile: 60,
    fuel: 80,
    steel: 90,
    ...overrides,
  };
}

describe('weapon readiness lifecycle', () => {
  it('creates a complete eight-domain readiness room from the fielded arsenal', () => {
    const state = createWeaponReadinessState(fielded);
    expect(Object.keys(state.categories)).toHaveLength(8);
    expect(state.categories.armor.equipmentId).toBe('armor-model');
    expect(state.categories.armor.readinessScore).toBeGreaterThan(40);
    expect(state.priorities.strategic).toBe('standard');
  });

  it('subdivides every arsenal domain into four mission capability families', () => {
    expect(weaponCapabilityFamilies).toHaveLength(32);
    weaponCategoryOrder.forEach((category) => {
      expect(weaponCapabilityFamilies.filter((family) => family.category === category)).toHaveLength(4);
    });
    const state = createWeaponReadinessState(fielded);
    const assessments = assessWeaponCapabilityFamilies('armor', state.categories.armor, { firepower: 84, mobility: 72, protection: 78, range: 62, reliability: 70, production: 65 });
    expect(assessments).toHaveLength(4);
    expect(assessments.every((assessment) => assessment.score >= 0 && assessment.score <= 100)).toBe(true);
    expect(assessments.every((assessment) => assessment.bottleneck.includes('병목'))).toBe(true);
  });

  it('makes sustained combat and mixed models materially harder to support', () => {
    const state = createWeaponReadinessState(fielded);
    const quiet = advanceWeaponReadinessWeek(state, context()).state.categories.armor;
    const combat = advanceWeaponReadinessWeek(state, context({
      operationalTempo: 92,
      fuel: 18,
      assignedModelCount: { armor: 4 },
      equipmentReliability: { armor: 52 },
      stockpileCoverage: { armor: 24 },
    })).state.categories.armor;
    expect(combat.operationalAvailability).toBeLessThan(quiet.operationalAvailability);
    expect(combat.sparePartsDays).toBeLessThan(quiet.sparePartsDays);
    expect(combat.repairBacklog).toBeGreaterThan(quiet.repairBacklog);
  });

  it('lets a critical modernization priority preserve more availability than monitoring', () => {
    const critical = createWeaponReadinessState(fielded);
    critical.priorities.armor = 'critical';
    const monitor = createWeaponReadinessState(fielded);
    monitor.priorities.armor = 'monitor';
    const sameContext = context({ operationalTempo: 70, productionCoverage: { armor: 45 } });
    const criticalResult = advanceWeaponReadinessWeek(critical, sameContext).state.categories.armor;
    const monitorResult = advanceWeaponReadinessWeek(monitor, sameContext).state.categories.armor;
    expect(criticalResult.operationalAvailability).toBeGreaterThanOrEqual(monitorResult.operationalAvailability);
    expect(criticalResult.repairBacklog).toBeLessThanOrEqual(monitorResult.repairBacklog);
  });

  it('completes timed depot work and applies the result only through weekly settlement', () => {
    const initial = createWeaponReadinessState(fielded);
    const queued = queueWeaponWorkOrder(initial, 'armor', 'depot-rebuild', 1)!;
    expect(queued.categories.armor.materialCondition).toBe(initial.categories.armor.materialCondition);
    let state = queued;
    let finalResult = advanceWeaponReadinessWeek(state, context({ week: 2 }));
    state = finalResult.state;
    finalResult = advanceWeaponReadinessWeek(state, context({ week: 3 }));
    state = finalResult.state;
    finalResult = advanceWeaponReadinessWeek(state, context({ week: 4 }));
    expect(finalResult.completedOrders).toHaveLength(1);
    expect(finalResult.state.categories.armor.materialCondition).toBeGreaterThan(initial.categories.armor.materialCondition);
    expect(finalResult.state.categories.armor.repairBacklog).toBeLessThan(initial.categories.armor.repairBacklog);
    expect(finalResult.state.history.at(-1)?.title).toContain('창정비 재생');
  });

  it('migrates old saves and records the conversion shock of a newly fielded model', () => {
    const normalized = normalizeWeaponReadinessState(undefined, fielded);
    const transitioned = transitionWeaponReadinessEquipment(normalized, 'armor', 'next-armor-model', 22);
    expect(transitioned.categories.armor.equipmentId).toBe('next-armor-model');
    expect(transitioned.categories.armor.crewProficiency).toBeLessThan(normalized.categories.armor.crewProficiency);
    expect(transitioned.categories.armor.standardization).toBeLessThan(normalized.categories.armor.standardization);
  });

  it('turns lifecycle readiness into formation strength, organization, and supply', () => {
    const nation = nations.find((candidate) => candidate.id === 'germany')!;
    const division = createCampaignDivisions(nation)[0];
    const healthy = createEquipmentDevelopment('germany');
    const degraded = createEquipmentDevelopment('germany');
    const readinessCategory = division.type === 'armor' ? 'armor' : 'infantry';
    degraded.readiness.categories[readinessCategory] = {
      ...degraded.readiness.categories[readinessCategory],
      readinessScore: 25,
      crewProficiency: 24,
      standardization: 28,
      sparePartsDays: 12,
      ammunitionDays: 10,
    };
    const healthyDivision = applyEquipmentToDivision(division, healthy);
    const degradedDivision = applyEquipmentToDivision(division, degraded);
    expect(healthyDivision.strength).toBeGreaterThan(degradedDivision.strength);
    expect(healthyDivision.organization).toBeGreaterThan(degradedDivision.organization);
    expect(healthyDivision.supply).toBeGreaterThan(degradedDivision.supply);
  });
});
