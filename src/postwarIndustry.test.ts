import { describe, expect, it } from 'vitest';
import {
  advancePostwarIndustryWeek, createPostwarIndustryState, forecastPostwarIndustry,
  normalizePostwarIndustryState, POSTWAR_INDUSTRY_SECURITY_SHARE, postwarStockpileKeys, getPostwarProductionLineEquipment,
  type PostwarIndustryInput,
} from './postwarIndustry';
import type { ProductionLine, Stockpile } from './types';

const production: ProductionLine[] = ['rifle', 'sherman', 'spitfire', 'convoy', 'artillery', 'truck'].map((id) => ({
  id, name: id, category: id, assigned: 5, efficiency: 100, output: 100, icon: 'factory',
}));
const stockpile: Stockpile = { infantryEquipment: 1000, tanks: 200, aircraft: 300, convoys: 40, artillery: 100, trucks: 600 };
const input: PostwarIndustryInput = {
  nationId: 'britain', week: 101, production, stockpile,
  game: { factories: 30, fuel: 1000, steel: 1000, treasury: 100 },
  spendingLevel: 100, securityBudgetPercent: 100,
};
const total = (stock: Stockpile) => Object.values(stock).reduce((sum, value) => sum + value, 0);

describe('postwar industrial delivery settlement', () => {
  it('keeps production identity even when all factories are paused', () => {
    const paused = production.map((line) => ({ ...line, assigned: 0 }));
    expect(forecastPostwarIndustry({ ...input, production: paused }).perLine).toHaveLength(0);
    expect(getPostwarProductionLineEquipment(paused)).toHaveLength(6);
    expect(getPostwarProductionLineEquipment(paused).find((line) => line.lineId === 'rifle')?.equipmentKey).toBe('infantryEquipment');
  });
  it('binds known unique IDs without guessing equipment from localized names', () => {
    const renamed = { ...production[0], name: '전차처럼 보이는 이름', assigned: 0 };
    expect(getPostwarProductionLineEquipment([renamed, renamed, { ...renamed, id: 'unknown' }])).toEqual([{ lineId: 'rifle', equipmentKey: 'infantryEquipment' }]);
  });
  it('produces all six stockpile categories only from their actual assigned lines', () => {
    const report = forecastPostwarIndustry(input);
    expect(Object.values(report.potentialDelivery)).toEqual([100, 100, 100, 100, 100, 100]);
    expect(report.delivered).toEqual(report.potentialDelivery);
    expect(report.perLine).toHaveLength(6);
    expect(report.deliveryRatio).toBe(1);
    expect(report.bottlenecks).toEqual([]);
    const lowerEfficiency = forecastPostwarIndustry({ ...input, production: production.map((line) => ({ ...line, efficiency: 50 })) });
    expect(Object.values(lowerEfficiency.delivered)).toEqual([50, 50, 50, 50, 50, 50]);
  });

  it('has no legacy artillery, truck or convoy fallback and charges nothing for inactive lines', () => {
    for (const lines of [[], production.map((line) => ({ ...line, assigned: 0 })), production.map((line) => ({ ...line, efficiency: 0 })), [{ ...production[0], id: 'unknown-line' }]]) {
      const report = forecastPostwarIndustry({ ...input, production: lines });
      expect(total(report.delivered)).toBe(0);
      expect(report.totalCost).toBe(0);
      expect(report.fuelUsed + report.steelUsed).toBe(0);
      expect(report.bottlenecks).toContain('inactive');
    }
    const riflesOnly = forecastPostwarIndustry({ ...input, production: [production[0]] });
    expect(riflesOnly.delivered.infantryEquipment).toBe(100);
    expect(riflesOnly.delivered.artillery + riflesOnly.delivered.trucks + riflesOnly.delivered.convoys).toBe(0);
  });

  it('delivers nothing without fuel, steel, factories or an available budget', () => {
    const variants = [
      { ...input, game: { ...input.game, fuel: 0 } },
      { ...input, game: { ...input.game, steel: 0 } },
      { ...input, game: { ...input.game, factories: 0 } },
      { ...input, spendingLevel: 0 },
      { ...input, securityBudgetPercent: 0 },
    ];
    for (const variant of variants) {
      const report = forecastPostwarIndustry(variant);
      expect(total(report.delivered)).toBe(0);
      expect(report.totalCost).toBe(0);
      expect(report.fuelUsed + report.steelUsed).toBe(0);
      expect(report.projectedResources.treasury).toBe(100);
    }
  });

  it('uses only half the already paid security envelope without charging the treasury twice', () => {
    const report = forecastPostwarIndustry(input);
    expect(report.securityBaseBudget).toBe(78);
    expect(report.industryBudgetShare).toBe(POSTWAR_INDUSTRY_SECURITY_SHARE);
    expect(report.includedIndustryBudget).toBe(39);
    expect(report.includedBudgetUsed).toBe(report.totalCost);
    expect(report.additionalTreasuryCost).toBe(0);
    expect(report.projectedResources.treasury).toBe(input.game.treasury);
    const result = advancePostwarIndustryWeek(createPostwarIndustryState('britain', 100), input);
    expect(result.gameDelta.treasury).toBe(0);
    expect(result.gameDelta).not.toHaveProperty('debt');
  });

  it('scales actual deliveries, material use and operating costs for partial fuel or budget', () => {
    const full = forecastPostwarIndustry(input);
    const fuelLimited = forecastPostwarIndustry({ ...input, game: { ...input.game, fuel: full.fuelRequired / 2 } });
    expect(Object.values(fuelLimited.delivered)).toEqual([50, 50, 50, 50, 50, 50]);
    expect(fuelLimited.operatingCost).toBeCloseTo(full.operatingCost / 2, 6);
    expect(fuelLimited.manufacturingCost).toBeCloseTo(full.manufacturingCost / 2, 6);
    expect(fuelLimited.bottlenecks).toContain('fuel');
    const budgetLimited = forecastPostwarIndustry({ ...input, spendingLevel: 10 });
    expect(total(budgetLimited.delivered)).toBeGreaterThan(0);
    expect(total(budgetLimited.delivered)).toBeLessThan(total(full.delivered));
    expect(budgetLimited.totalCost).toBeLessThanOrEqual(budgetLimited.includedIndustryBudget);
    expect(budgetLimited.bottlenecks).toContain('budget');
  });

  it('limits optional extra expenditure by both explicit allowance and cash without debt', () => {
    const allowed = forecastPostwarIndustry({ ...input, spendingLevel: 0, extraTreasuryAllowance: 5 });
    expect(allowed.additionalTreasuryCost).toBeGreaterThan(0);
    expect(allowed.additionalTreasuryCost).toBeLessThanOrEqual(5);
    expect(allowed.includedBudgetUsed).toBe(0);
    const cashLimited = forecastPostwarIndustry({ ...input, spendingLevel: 0, extraTreasuryAllowance: 1000, game: { ...input.game, treasury: 2 } });
    expect(cashLimited.additionalTreasuryAllowance).toBe(2);
    expect(cashLimited.additionalTreasuryCost).toBeLessThanOrEqual(2);
    expect(cashLimited.projectedResources.treasury).toBeGreaterThanOrEqual(0);
    const noCash = forecastPostwarIndustry({ ...input, spendingLevel: 0, extraTreasuryAllowance: 1000, game: { ...input.game, treasury: 0 } });
    expect(total(noCash.delivered)).toBe(0);
    expect(noCash.additionalTreasuryCost).toBe(0);
  });

  it('keeps forecast, applied deltas, stockpile and resource conservation consistent and immutable', () => {
    const before = structuredClone(input);
    const state = createPostwarIndustryState('britain', 100);
    const result = advancePostwarIndustryWeek(state, input);
    expect(result.applied).toBe(true);
    expect(result.report).toEqual(forecastPostwarIndustry(input));
    for (const key of postwarStockpileKeys) expect(input.stockpile[key] + result.stockpileDelta[key]).toBe(result.report!.projectedStockpile[key]);
    for (const key of ['fuel', 'steel', 'treasury'] as const) expect(input.game[key] + result.gameDelta[key]).toBeCloseTo(result.report!.projectedResources[key], 6);
    expect(result.report!.perLine.reduce((sum, line) => sum + line.manufacturingCost + line.operatingCost, 0)).toBeCloseTo(result.report!.totalCost, 5);
    expect(input).toEqual(before);
    expect(state.lastSettledWeek).toBe(100);
  });

  it('does not round fractional debits above the cash or material actually available', () => {
    const fractional: PostwarIndustryInput = {
      ...input, production: [production[0]], policy: 'production',
      spendingLevel: 0.1000002 / 0.39, extraTreasuryAllowance: 1,
      game: { ...input.game, treasury: 0.4687499 },
    };
    const result = advancePostwarIndustryWeek(createPostwarIndustryState('britain', 100), fractional);
    expect(result.stockpileDelta.infantryEquipment).toBe(125);
    for (const key of ['fuel', 'steel', 'treasury'] as const) {
      expect(fractional.game[key] + result.gameDelta[key]).toBeGreaterThanOrEqual(0);
      expect(fractional.game[key] + result.gameDelta[key]).toBe(result.report!.projectedResources[key]);
    }
    expect(result.report!.additionalTreasuryCost).toBeLessThanOrEqual(fractional.game.treasury);
  });

  it('never settles a week twice or lowers its watermark after inspecting a past week', () => {
    const first = advancePostwarIndustryWeek(createPostwarIndustryState('britain', 100), input);
    const second = advancePostwarIndustryWeek(first.state, { ...input, policy: 'production', extraTreasuryAllowance: 100 });
    expect(second.applied).toBe(false);
    expect(total(second.stockpileDelta)).toBe(0);
    expect(Object.values(second.gameDelta)).toEqual([0, 0, 0]);
    const past = advancePostwarIndustryWeek(first.state, { ...input, week: 90 });
    expect(past.applied).toBe(false);
    expect(past.state.lastSettledWeek).toBe(101);
    expect(advancePostwarIndustryWeek(past.state, input).applied).toBe(false);
  });

  it('starts old saves at the current week and does not catch up skipped years', () => {
    const restored = normalizePostwarIndustryState(undefined, 'britain', 100);
    expect(restored).toEqual(createPostwarIndustryState('britain', 100));
    expect(advancePostwarIndustryWeek(restored, { ...input, week: 100 }).applied).toBe(false);
    const jumped = advancePostwarIndustryWeek(restored, { ...input, week: 1000 });
    expect(jumped.stockpileDelta).toEqual(forecastPostwarIndustry({ ...input, week: 1000 }).delivered);
    expect(total(jumped.stockpileDelta)).toBe(600);
    expect(advancePostwarIndustryWeek(undefined, input).applied).toBe(false);
  });

  it('resets national scope instead of replaying another country delivery', () => {
    const british = advancePostwarIndustryWeek(createPostwarIndustryState('britain', 100), input).state;
    const korean = normalizePostwarIndustryState(british, 'korea', 101);
    expect(korean).toEqual(createPostwarIndustryState('korea', 101));
    const mismatch = advancePostwarIndustryWeek(british, { ...input, nationId: 'korea' });
    expect(mismatch.applied).toBe(false);
    expect(total(mismatch.stockpileDelta)).toBe(0);
    expect(advancePostwarIndustryWeek(korean, { ...input, nationId: 'korea', week: 102 }).applied).toBe(true);
  });

  it('caps overallocated factories, ignores duplicate line IDs and rejects malformed saved reports', () => {
    const overallocated = forecastPostwarIndustry({ ...input, game: { ...input.game, factories: 15 } });
    expect(overallocated.activeFactories).toBe(15);
    expect(total(overallocated.potentialDelivery)).toBe(300);
    expect(overallocated.bottlenecks).toContain('factories');
    expect(forecastPostwarIndustry({ ...input, production: [...production, production[0]] })).toEqual(forecastPostwarIndustry(input));
    expect(normalizePostwarIndustryState({ version: 1, nationId: 'britain', lastSettledWeek: 100, lastReport: {} }, 'britain', 100).lastReport).toBeNull();
    const result = advancePostwarIndustryWeek(createPostwarIndustryState('britain', 100), input);
    expect(normalizePostwarIndustryState(result.state, 'britain', 101)).toEqual(result.state);
  });

  it('offers production speed versus resource-efficient plant preservation without weapon effects', () => {
    const balanced = forecastPostwarIndustry(input);
    const productionFocus = forecastPostwarIndustry({ ...input, policy: 'production' });
    const preservation = forecastPostwarIndustry({ ...input, policy: 'maintenance' });
    expect(total(productionFocus.delivered)).toBeGreaterThan(total(balanced.delivered));
    expect(productionFocus.fuelUsed / total(productionFocus.delivered)).toBeGreaterThan(balanced.fuelUsed / total(balanced.delivered));
    expect(total(preservation.delivered)).toBeLessThan(total(balanced.delivered));
    expect(preservation.steelUsed / total(preservation.delivered)).toBeLessThan(balanced.steelUsed / total(balanced.delivered));
    expect(preservation).not.toHaveProperty('weaponReadiness');
    expect(preservation).not.toHaveProperty('equipmentResearch');
  });
});
