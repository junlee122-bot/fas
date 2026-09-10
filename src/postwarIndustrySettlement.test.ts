import { describe, expect, it } from 'vitest';
import { createEconomyState } from './economy';
import { advanceNationManagementWeek, createNationManagementState, type NationAdvanceResult } from './nationManagement';
import { advancePostwarIndustryWeek, createPostwarIndustryState, forecastPostwarIndustry, type PostwarIndustryInput } from './postwarIndustry';
import {
  mergePostwarIndustrySettlement, normalizePostwarIndustrySettings, postwarIndustryAllowances,
  postwarMaterialQuotes, purchasePostwarMaterial, reservePostwarIndustryResources,
} from './postwarIndustrySettlement';
import type { GameState, ProductionLine, Stockpile } from './types';

const game: GameState = {
  week: 100, manpower: 1200, politicalPower: 82, fuel: 70, steel: 108,
  factories: 30, stability: 72, warSupport: 78, commandPoints: 48,
  treasury: 100, victoryScore: 66, airPower: 61, navalPower: 56,
  intelNetwork: 64, enemyPressure: 42,
};
const economy = createEconomyState('britain');
const nationalState = createNationManagementState('britain', game, economy, 3, 'victory');
const baseResult = advanceNationManagementWeek(nationalState, {
  week: 101, game, economy, relationAverage: 62, completedResearch: 3, publicHealthPressure: 8,
});
const production: ProductionLine[] = ['rifle', 'sherman', 'spitfire', 'convoy', 'artillery', 'truck'].map((id) => ({
  id, name: id, category: id, assigned: 5, efficiency: 100, output: 100, icon: 'factory',
}));
const stockpile: Stockpile = { infantryEquipment: 1000, tanks: 200, aircraft: 300, convoys: 40, artillery: 100, trucks: 600 };
const industryInput = (base = baseResult): PostwarIndustryInput => ({
  nationId: 'britain', week: base.report.week, game: reservePostwarIndustryResources(game, base),
  production, stockpile, spendingLevel: base.state.spendingLevel,
  securityBudgetPercent: base.state.budget.security, extraTreasuryAllowance: 5,
});
const withGameDelta = (delta: Partial<GameState>): NationAdvanceResult => ({ ...baseResult, gameDelta: { ...baseResult.gameDelta, ...delta } });

describe('postwar industry national settlement adapter', () => {
  it('charges only supplementary cash, preserving already paid security spending, taxes and debt', () => {
    const report = forecastPostwarIndustry(industryInput());
    expect(report.includedBudgetUsed).toBeGreaterThan(0);
    expect(report.additionalTreasuryCost).toBeGreaterThan(0);
    const merged = mergePostwarIndustrySettlement(baseResult, report);
    expect(merged.report.fiscalExpenditure).toBe(baseResult.report.fiscalExpenditure + report.additionalTreasuryCost);
    expect(merged.report.fiscalBalance).toBe(baseResult.report.fiscalBalance - report.additionalTreasuryCost);
    expect(merged.gameDelta.treasury).toBe(baseResult.gameDelta.treasury! - report.additionalTreasuryCost);
    expect(merged.report.fiscalRevenue).toBe(baseResult.report.fiscalRevenue);
    expect(merged.report.debtChange).toBe(baseResult.report.debtChange);
    expect(merged.economyDelta).toEqual(baseResult.economyDelta);
    expect(merged.report.industrySettlement).toEqual({
      week: report.week, nationId: report.nationId,
      additionalTreasuryCost: report.additionalTreasuryCost, includedBudgetUsed: report.includedBudgetUsed,
    });
  });

  it('does not charge included operating/manufacturing costs again when extra authorization is zero', () => {
    const report = forecastPostwarIndustry({ ...industryInput(), extraTreasuryAllowance: 0 });
    expect(report.totalCost).toBeGreaterThan(0);
    expect(report.additionalTreasuryCost).toBe(0);
    const merged = mergePostwarIndustrySettlement(baseResult, report);
    expect(merged.gameDelta.treasury).toBe(baseResult.gameDelta.treasury);
    expect(merged.report.fiscalExpenditure).toBe(baseResult.report.fiscalExpenditure);
    expect(merged.report.fiscalBalance).toBe(baseResult.report.fiscalBalance);
    expect(merged.gameDelta.fuel).toBe((baseResult.gameDelta.fuel ?? 0) - report.fuelUsed);
    expect(merged.gameDelta.steel).toBe((baseResult.gameDelta.steel ?? 0) - report.steelUsed);
  });

  it('replaces this week report once, retains historical reports and leaves all inputs unchanged', () => {
    const oldReport = { ...baseResult.report, week: 99 };
    const base = { ...baseResult, state: { ...baseResult.state, reports: [baseResult.report, oldReport] } };
    const report = forecastPostwarIndustry(industryInput(base));
    const beforeBase = structuredClone(base);
    const beforeIndustry = structuredClone(report);
    const merged = mergePostwarIndustrySettlement(base, report);
    expect(merged.state.reports[0]).toBe(merged.report);
    expect(merged.state.reports.filter((item) => item.week === report.week)).toHaveLength(1);
    expect(merged.state.reports[1]).toEqual(oldReport);
    expect(merged.report.causes).toHaveLength(base.report.causes.length + 1);
    expect(merged.report.effects.some((effect) => effect.includes('자동 차입 없음'))).toBe(true);
    expect(base).toEqual(beforeBase);
    expect(report).toEqual(beforeIndustry);
  });

  it('is idempotent and rejects a report for another country or arrival week', () => {
    const report = forecastPostwarIndustry(industryInput());
    const merged = mergePostwarIndustrySettlement(baseResult, report);
    expect(mergePostwarIndustrySettlement(merged, report)).toBe(merged);
    expect(mergePostwarIndustrySettlement(merged, { ...report, additionalTreasuryCost: 10 })).toBe(merged);
    expect(mergePostwarIndustrySettlement(baseResult, { ...report, nationId: 'korea' })).toBe(baseResult);
    expect(mergePostwarIndustrySettlement(baseResult, { ...report, week: 102 })).toBe(baseResult);
  });

  it('composes the delivery watermark with merge without paying for or crediting a delivery twice', () => {
    const input = industryInput();
    const first = advancePostwarIndustryWeek(createPostwarIndustryState('britain', 100), input);
    const merged = mergePostwarIndustrySettlement(baseResult, first.report!);
    const second = advancePostwarIndustryWeek(first.state, input);
    expect(second.applied).toBe(false);
    expect(Object.values(second.stockpileDelta).every((amount) => amount === 0)).toBe(true);
    expect(mergePostwarIndustrySettlement(merged, second.report!)).toBe(merged);
    for (const key of Object.keys(stockpile) as Array<keyof Stockpile>) {
      expect(stockpile[key] + first.stockpileDelta[key] + second.stockpileDelta[key]).toBe(first.report!.projectedStockpile[key]);
    }
    expect(merged.gameDelta).not.toHaveProperty('stockpile');
  });
});

describe('postwar resource reservation', () => {
  it('reserves base fiscal and public-health spending before any additional contract', () => {
    const base = withGameDelta({ treasury: -75, fuel: -8, steel: 3 });
    const health = { treasury: -23, fuel: -2, steel: -5 };
    const before = structuredClone({ game, base, health });
    const reserved = reservePostwarIndustryResources(game, base, health);
    expect(reserved).toEqual({ factories: 30, treasury: 2, fuel: 60, steel: 106 });
    const report = forecastPostwarIndustry({ ...industryInput(base), game: reserved, extraTreasuryAllowance: 10 });
    expect(report.additionalTreasuryAllowance).toBe(2);
    expect(report.additionalTreasuryCost).toBeLessThanOrEqual(2);
    const merged = mergePostwarIndustrySettlement(base, report);
    expect(game.treasury + merged.gameDelta.treasury! + health.treasury).toBeGreaterThanOrEqual(0);
    expect(game.fuel + merged.gameDelta.fuel! + health.fuel).toBeCloseTo(report.projectedResources.fuel, 10);
    expect(game.steel + merged.gameDelta.steel! + health.steel).toBeCloseTo(report.projectedResources.steel, 10);
    expect({ game, base, health }).toEqual(before);
  });

  it('allows no extra cash when prior commitments exhaust cash and no free resource refills', () => {
    const base = withGameDelta({ treasury: -90, fuel: -80, steel: -200 });
    const reserved = reservePostwarIndustryResources(game, base, { treasury: -30 });
    expect(reserved).toEqual({ factories: 30, treasury: 0, fuel: 0, steel: 0 });
    const report = forecastPostwarIndustry({ ...industryInput(base), game: reserved, extraTreasuryAllowance: 10 });
    expect(report.additionalTreasuryCost).toBe(0);
    expect(Object.values(report.delivered).every((amount) => amount === 0)).toBe(true);
    expect(report.totalCost).toBe(0);
  });

  it('reserves pending national-program and role-pulse expenses as well as base and health commitments', () => {
    const base = withGameDelta({ treasury: -75, fuel: -8, steel: 3 });
    const health = { treasury: -20, fuel: -2, steel: -5 };
    const pending = { treasury: -3, fuel: -4, steel: -6, factories: -1 };
    const before = structuredClone({ base, health, pending });
    const reserved = reservePostwarIndustryResources(game, base, health, pending);
    expect(reserved).toEqual({ factories: 29, treasury: 2, fuel: 56, steel: 100 });
    const report = forecastPostwarIndustry({ ...industryInput(base), game: reserved, extraTreasuryAllowance: 10 });
    const merged = mergePostwarIndustrySettlement(base, report);
    expect(report.additionalTreasuryCost).toBeLessThanOrEqual(2);
    for (const key of ['treasury', 'fuel', 'steel'] as const) {
      const actualRemaining = game[key] + merged.gameDelta[key]! + health[key] + pending[key];
      expect(actualRemaining).toBeGreaterThanOrEqual(0);
      expect(actualRemaining).toBeCloseTo(report.projectedResources[key], 10);
    }
    expect(reservePostwarIndustryResources(game, base, health, { treasury: -8 }).treasury).toBe(0);
    expect({ base, health, pending }).toEqual(before);
  });

  it('does not expand opening-cash authorization with pending income but accepts actual material inflows', () => {
    const reserved = reservePostwarIndustryResources({ ...game, treasury: 3 }, withGameDelta({ treasury: 0 }), {}, {
      treasury: 55, fuel: 12, steel: 16,
    });
    expect(reserved).toEqual({ factories: 30, treasury: 3, fuel: 82, steel: 124 });
    const report = forecastPostwarIndustry({ ...industryInput(), game: reserved, extraTreasuryAllowance: 10 });
    expect(report.additionalTreasuryAllowance).toBe(3);
    expect(report.additionalTreasuryCost).toBeLessThanOrEqual(3);
  });

  it('ignores nonfinite pending/base/health deltas without poisoning otherwise valid balances', () => {
    const reserved = reservePostwarIndustryResources(game, withGameDelta({ treasury: NaN, fuel: Infinity, steel: -Infinity }), {
      treasury: Infinity, fuel: NaN, steel: -Infinity,
    }, { treasury: -Infinity, fuel: -2, steel: NaN, factories: Infinity });
    expect(reserved).toEqual({ factories: 30, treasury: 100, fuel: 68, steel: 108 });
    expect(Object.values(reserved).every((amount) => Number.isFinite(amount) && amount >= 0)).toBe(true);
  });

  it('does not treat unreceived fiscal income as permission to exceed existing cash', () => {
    const reserved = reservePostwarIndustryResources({ ...game, treasury: 3 }, withGameDelta({ treasury: 100 }), { treasury: 20 });
    expect(reserved.treasury).toBe(3);
    const report = forecastPostwarIndustry({ ...industryInput(), game: reserved, extraTreasuryAllowance: 10 });
    expect(report.additionalTreasuryAllowance).toBe(3);
    expect(report.additionalTreasuryCost).toBeLessThanOrEqual(3);
  });

  it('normalizes invalid existing balances to zero without mutating the game', () => {
    const invalid = { ...game, factories: -1, fuel: NaN, steel: Infinity, treasury: -5 };
    expect(reservePostwarIndustryResources(invalid, withGameDelta({ treasury: 0 }))).toEqual({ factories: 0, fuel: 0, steel: 0, treasury: 0 });
    expect(Number.isNaN(invalid.fuel)).toBe(true);
    expect(invalid.treasury).toBe(-5);
  });
});

describe('postwar cash authorization and settings', () => {
  it('defaults old or malformed settings to no extra spending and accepts only explicit allowance options', () => {
    for (const value of [undefined, null, false, 'production', [], { policy: 'unknown', extraTreasuryAllowance: 1000 }, { policy: 'balanced', extraTreasuryAllowance: '10' }]) {
      expect(normalizePostwarIndustrySettings(value)).toEqual({ policy: 'balanced', extraTreasuryAllowance: 0 });
    }
    for (const policy of ['balanced', 'production', 'maintenance'] as const) {
      for (const extraTreasuryAllowance of postwarIndustryAllowances) {
        const value = { policy, extraTreasuryAllowance };
        expect(normalizePostwarIndustrySettings(value)).toEqual(value);
        expect(value).toEqual({ policy, extraTreasuryAllowance });
      }
    }
    for (const extraTreasuryAllowance of [-2, 1, 5.1, NaN, Infinity]) {
      expect(normalizePostwarIndustrySettings({ policy: 'production', extraTreasuryAllowance })).toEqual({ policy: 'production', extraTreasuryAllowance: 0 });
    }
  });

  it('requires actual authorization and enough cash for an immediate material order', () => {
    for (const material of ['fuel', 'steel'] as const) {
      const quote = postwarMaterialQuotes[material];
      expect(purchasePostwarMaterial(game, material, false)).toBeNull();
      expect(purchasePostwarMaterial({ ...game, treasury: quote.cost - 0.01 }, material, true)).toBeNull();
      const purchased = purchasePostwarMaterial({ ...game, treasury: quote.cost }, material, true)!;
      expect(purchased.treasury).toBe(0);
      expect(purchased[material]).toBe(game[material] + quote.quantity);
      expect(purchasePostwarMaterial(purchased, material, true)).toBeNull();
    }
  });

  it('rejects nonfinite cash or material and never changes input or unrelated game fields', () => {
    const before = structuredClone(game);
    for (const material of ['fuel', 'steel'] as const) {
      for (const badValue of [NaN, Infinity, -Infinity]) {
        expect(purchasePostwarMaterial({ ...game, treasury: badValue }, material, true)).toBeNull();
        expect(purchasePostwarMaterial({ ...game, [material]: badValue }, material, true)).toBeNull();
      }
      const purchased = purchasePostwarMaterial(game, material, true)!;
      expect(purchased).not.toBe(game);
      expect(purchased).toEqual({ ...game, treasury: game.treasury - postwarMaterialQuotes[material].cost, [material]: game[material] + 10 });
    }
    expect(game).toEqual(before);
  });

  it('makes a paid raw-material purchase available to the next preview without itself delivering equipment', () => {
    const emptyFuel = { ...game, fuel: 0 };
    const base = withGameDelta({ treasury: 0 });
    const before = forecastPostwarIndustry({ ...industryInput(base), game: reservePostwarIndustryResources(emptyFuel, base) });
    const purchased = purchasePostwarMaterial(emptyFuel, 'fuel', true)!;
    const after = forecastPostwarIndustry({ ...industryInput(base), game: reservePostwarIndustryResources(purchased, base) });
    expect(Object.values(before.delivered).every((amount) => amount === 0)).toBe(true);
    expect(after.delivered.infantryEquipment).toBeGreaterThan(0);
    expect(purchased.treasury).toBe(emptyFuel.treasury - postwarMaterialQuotes.fuel.cost);
    expect(purchased).not.toHaveProperty('stockpile');
    expect(stockpile.infantryEquipment).toBe(1000);
  });
});
