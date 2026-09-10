import { describe, expect, it } from 'vitest';
import { createCampaignDivisions, createCampaignProduction, getNation } from './campaign';
import { createEquipmentDevelopment, equipmentNodes, normalizeEquipmentDevelopment } from './equipment';
import { advancePostwarEquipmentWeek, type PostwarEquipmentContext } from './postwarEquipment';
import { createArmsPortfolioState } from './strategicArmsDiplomacy';
import type { EquipmentCategory, GameState } from './types';
import { queueWeaponWorkOrder } from './weaponReadiness';

const game: GameState = {
  week: 100, manpower: 1200, politicalPower: 0, fuel: 70, steel: 100,
  factories: 30, stability: 68, warSupport: 60, commandPoints: 0,
  treasury: 0, victoryScore: 75, airPower: 55, navalPower: 50,
  intelNetwork: 60, enemyPressure: 20,
};

function context(overrides: Partial<PostwarEquipmentContext> = {}): PostwarEquipmentContext {
  const nation = getNation('britain');
  return {
    week: 101, game: { ...game }, production: createCampaignProduction(nation),
    stockpile: { infantryEquipment: 1500, tanks: 250, aircraft: 400, convoys: 100, artillery: 250, trucks: 400 },
    divisions: createCampaignDivisions(nation), armsPortfolio: createArmsPortfolioState(nation.id),
    researchGain: 12, productionCoverageScale: 1, ...overrides,
  };
}

function researching(category: EquipmentCategory = 'armor', remaining = 30) {
  const state = createEquipmentDevelopment('britain');
  const project = equipmentNodes.find((node) => node.era === 'late-war' && node.category === category && node.nationIds === 'all')!;
  state.activeProjectId = project.id;
  state.progress = project.researchCost - remaining;
  state.readiness.lastAdvancedWeek = 100;
  return { state, project };
}

describe('postwar equipment development and prepaid readiness work', () => {
  it('excludes staged infantry from parts flow without removing actually delivered armor support', () => {
    const state = createEquipmentDevelopment('britain');
    const funded = advancePostwarEquipmentWeek(state, context()).state.readiness.categories;
    const unfunded = advancePostwarEquipmentWeek(state, context({ productionCoverageScale: 0 })).state.readiness.categories;
    const staged = advancePostwarEquipmentWeek(state, context({ productionCoverageByCategory: { infantry: 0 } })).state.readiness.categories;
    expect(staged.infantry).toEqual(unfunded.infantry);
    expect(staged.armor).toEqual(funded.armor);
    expect(staged.infantry).not.toEqual(funded.infantry);
    expect(advancePostwarEquipmentWeek(state, context({ productionCoverageByCategory: { infantry: NaN } })).state.readiness.categories.infantry).toEqual(unfunded.infantry);
  });

  it('advances existing research and low-tempo readiness without requiring prepaid funds again', () => {
    const { state, project } = researching();
    const input = context();
    const original = structuredClone({ state, input });
    const result = advancePostwarEquipmentWeek(state, input);
    expect(result.advanced).toBe(true);
    expect(result.state.activeProjectId).toBe(project.id);
    expect(result.state.progress).toBe(state.progress + 12);
    expect(result.state.readiness.lastAdvancedWeek).toBe(101);
    expect(result.state.readiness.categories.armor.weeksInService).toBe(state.readiness.categories.armor.weeksInService + 1);
    expect(result.completedProject).toBeNull();
    expect(result.gameDelta).toEqual({});
    expect(result.divisions).toBe(input.divisions);
    expect({ state, input }).toEqual(original);
  });

  it('unlocks a completed systems project and gives its existing effect once only', () => {
    const { state, project } = researching('systems', 12);
    const result = advancePostwarEquipmentWeek(state, context());
    expect(result.completedProject?.id).toBe(project.id);
    expect(result.state.unlockedIds.filter((id) => id === project.id)).toHaveLength(1);
    expect(result.state.activeProjectId).toBeNull();
    expect(result.state.progress).toBe(0);
    expect(result.gameDelta).toEqual({ intelNetwork: 6 });
    const repeated = advancePostwarEquipmentWeek(result.state, context());
    expect(repeated.advanced).toBe(false);
    expect(repeated.state).toBe(result.state);
    expect(repeated.completedProject).toBeNull();
    expect(repeated.gameDelta).toEqual({});
    expect(advancePostwarEquipmentWeek(result.state, context({ week: 102 })).gameDelta).toEqual({});
  });

  it('returns logistics supply improvements without mutating or replacing unrelated formation state', () => {
    const { state } = researching('logistics', 2);
    const input = context();
    input.divisions[0].supply = 99;
    input.divisions[1].supply = 50;
    const result = advancePostwarEquipmentWeek(state, input);
    expect(result.divisions[0]).toEqual({ ...input.divisions[0], supply: 100 });
    expect(result.divisions[1]).toEqual({ ...input.divisions[1], supply: 55 });
    expect(input.divisions[0].supply).toBe(99);
    expect(result.gameDelta).toEqual({});
  });

  it('preserves the strategic breakthrough trade-off without any purchase or delivery side effect', () => {
    const { state } = researching('strategic', 1);
    const result = advancePostwarEquipmentWeek(state, context());
    expect(result.completedProject?.category).toBe('strategic');
    expect(result.gameDelta).toEqual({ warSupport: 3, stability: -1 });
    for (const field of ['treasury', 'politicalPower', 'commandPoints', 'fuel', 'steel', 'week']) expect(result.gameDelta).not.toHaveProperty(field);
    expect(result).not.toHaveProperty('stockpile');
    expect(result).not.toHaveProperty('jointForces');
  });

  it('clears nonexistent, already unlocked or prerequisite-invalid active projects without rewards', () => {
    const initial = createEquipmentDevelopment('britain');
    const unavailable = equipmentNodes.find((node) => node.era === 'modern' && node.category === 'armor')!;
    for (const activeProjectId of ['nonexistent-project', initial.unlockedIds[0], unavailable.id]) {
      const state = { ...initial, activeProjectId, progress: 99999 };
      const result = advancePostwarEquipmentWeek(state, context());
      expect(result.completedProject).toBeNull();
      expect(result.state.unlockedIds).toEqual(initial.unlockedIds);
      expect(result.state.activeProjectId).toBeNull();
      expect(result.state.progress).toBe(0);
      expect(result.gameDelta).toEqual({});
      expect(result.blockedProjectReason).toBeTruthy();
    }
  });

  it('progresses and completes a prepaid three-week depot order even when current treasury is zero', () => {
    const initial = createEquipmentDevelopment('britain');
    initial.readiness = queueWeaponWorkOrder(initial.readiness, 'armor', 'depot-rebuild', 100)!;
    initial.readiness.lastAdvancedWeek = 100;
    let state = initial;
    for (const week of [101, 102, 103]) {
      const result = advancePostwarEquipmentWeek(state, context({ week }));
      expect(result.state.readiness.workOrders[0].remainingWeeks).toBe(103 - week);
      expect(result.completedOrders).toHaveLength(week === 103 ? 1 : 0);
      expect(result.gameDelta).not.toHaveProperty('treasury');
      state = result.state;
    }
    expect(state.readiness.workOrders[0].status).toBe('completed');
    expect(state.readiness.history.filter((entry) => entry.id.includes('weapon-order-result'))).toHaveLength(1);
    expect(state.readiness.categories.armor.materialCondition).toBeGreaterThan(initial.readiness.categories.armor.materialCondition);
    expect(advancePostwarEquipmentWeek(state, context({ week: 103 })).completedOrders).toEqual([]);
    expect(advancePostwarEquipmentWeek(state, context({ week: 104 })).completedOrders).toEqual([]);
  });

  it('uses the persisted readiness week marker to stop both research and orders after save restoration', () => {
    const { state } = researching('armor', 60);
    state.readiness = queueWeaponWorkOrder(state.readiness, 'armor', 'depot-rebuild', 100)!;
    const first = advancePostwarEquipmentWeek(state, context());
    const restored = normalizeEquipmentDevelopment(JSON.parse(JSON.stringify(first.state)), 'britain');
    const repeated = advancePostwarEquipmentWeek(restored, context());
    expect(repeated.advanced).toBe(false);
    expect(repeated.state.progress).toBe(first.state.progress);
    expect(repeated.state.readiness.workOrders[0].remainingWeeks).toBe(2);
    const next = advancePostwarEquipmentWeek(repeated.state, context({ week: 102 }));
    expect(next.state.progress).toBe(first.state.progress + 12);
    expect(next.state.readiness.workOrders[0].remainingWeeks).toBe(1);
  });

  it('resumes an old postwar save for one week, without retroactive years of research or repair', () => {
    const { state } = researching('armor', 60);
    state.readiness.lastAdvancedWeek = 20;
    state.readiness = queueWeaponWorkOrder(state.readiness, 'armor', 'depot-rebuild', 20)!;
    const restored = normalizeEquipmentDevelopment(JSON.parse(JSON.stringify(state)), 'britain');
    const result = advancePostwarEquipmentWeek(restored, context({ week: 1001 }));
    expect(result.state.progress).toBe(state.progress + 12);
    expect(result.state.readiness.workOrders[0].remainingWeeks).toBe(2);
    expect(result.completedOrders).toEqual([]);
    expect(result.state.readiness.lastAdvancedWeek).toBe(1001);
  });

  it('scales new production support by actual deliveries, including a fully unfunded week', () => {
    const state = createEquipmentDevelopment('britain');
    const funded = advancePostwarEquipmentWeek(state, context({ productionCoverageScale: 1 }));
    const unfunded = advancePostwarEquipmentWeek(state, context({ productionCoverageScale: 0 }));
    expect(funded.state.readiness.categories.armor.operationalAvailability).toBeGreaterThan(unfunded.state.readiness.categories.armor.operationalAvailability);
    expect(funded.state.readiness.categories.armor.ammunitionDays).toBeGreaterThan(unfunded.state.readiness.categories.armor.ammunitionDays);
    expect(funded.state.readiness.categories.systems.ammunitionDays).toBeGreaterThan(unfunded.state.readiness.categories.systems.ammunitionDays);
    expect(advancePostwarEquipmentWeek(state, context({ productionCoverageScale: Number.NaN })).state).toEqual(unfunded.state);
    expect(advancePostwarEquipmentWeek(state, context({ productionCoverageScale: 100 })).state).toEqual(funded.state);
  });

  it('does not pretend a zero-assigned, zero-output or missing military line is supplying repairs', () => {
    const state = createEquipmentDevelopment('britain');
    const input = context();
    const without = advancePostwarEquipmentWeek(state, { ...input, production: [] }).state.readiness.categories.armor;
    for (const production of [
      input.production.map((line) => ({ ...line, assigned: 0 })),
      input.production.map((line) => ({ ...line, output: 0 })),
      input.production.map((line) => ({ ...line, efficiency: 0 })),
    ]) expect(advancePostwarEquipmentWeek(state, { ...input, production }).state.readiness.categories.armor).toEqual(without);
  });

  it('keeps existing reserves and prepaid work separate from current factory supply', () => {
    const initial = createEquipmentDevelopment('britain');
    initial.readiness = queueWeaponWorkOrder(initial.readiness, 'armor', 'depot-rebuild', 100)!;
    const funded = context({ productionCoverageScale: 0, game: { ...game, fuel: 0, steel: 0 } });
    const withReserves = advancePostwarEquipmentWeek(initial, funded);
    const withoutReserves = advancePostwarEquipmentWeek(initial, { ...funded, stockpile: { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 } });
    expect(withReserves.state.readiness.categories.armor.ammunitionDays).toBeGreaterThan(withoutReserves.state.readiness.categories.armor.ammunitionDays);
    expect(withReserves.state.readiness.workOrders[0].remainingWeeks).toBe(2);
    expect(withReserves.gameDelta).toEqual({});
  });

  it('does not generate new spare parts from nominal manufacturability during a complete supply stop', () => {
    const initial = createEquipmentDevelopment('britain');
    const input = context({
      productionCoverageScale: 0, game: { ...game, fuel: 0, steel: 0 },
      stockpile: { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 },
    });
    input.armsPortfolio.supplySecurity = 0;
    input.armsPortfolio.emergencyStockpile = 0;
    const result = advancePostwarEquipmentWeek(initial, input);
    expect(result.state.readiness.categories.armor.sparePartsDays).toBeLessThanOrEqual(initial.readiness.categories.armor.sparePartsDays);
    expect(result.state.readiness.categories.armor.ammunitionDays).toBeLessThanOrEqual(initial.readiness.categories.armor.ammunitionDays);
  });

  it('ignores invalid research gains and arrival weeks without producing nonfinite state', () => {
    const { state } = researching();
    for (const researchGain of [Number.NaN, Number.POSITIVE_INFINITY, -5]) {
      const result = advancePostwarEquipmentWeek(state, context({ researchGain }));
      expect(result.state.progress).toBe(state.progress);
      expect(result.completedProject).toBeNull();
    }
    for (const week of [100, 99, -1, 100.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = advancePostwarEquipmentWeek(state, context({ week }));
      expect(result.advanced).toBe(false);
      expect(result.state).toBe(state);
    }
  });
});
