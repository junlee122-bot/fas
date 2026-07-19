import { describe, expect, it } from 'vitest';
import {
  advanceEconomyWeek,
  buyIndustrialStake,
  calculateEconomyLedger,
  createEconomyState,
  getAvailableCompanies,
  getCompanyInvestmentSnapshot,
  normalizeEconomyState,
  sellIndustrialStake,
} from './economy';
import type { GameState } from './types';

const game: GameState = {
  week: 4,
  manpower: 1200,
  politicalPower: 80,
  fuel: 70,
  steel: 100,
  factories: 30,
  stability: 75,
  warSupport: 82,
  commandPoints: 50,
  treasury: 900,
  victoryScore: 40,
  airPower: 60,
  navalPower: 58,
  intelNetwork: 55,
  enemyPressure: 64,
};

const context = { week: 5, nationId: 'britain' as const, game, staffWeeklyCost: 18, economyAdvisorBonus: 10 };

describe('wartime economy', () => {
  it('separates real revenue, debt financing, expenses, and monthly projection', () => {
    const state = createEconomyState('britain');
    const ledger = calculateEconomyLedger(state, context);
    expect(ledger.revenues.some((line) => line.id === 'income-tax')).toBe(true);
    expect(ledger.financingRaised).toBe(24);
    expect(ledger.debtAfter).toBe(state.debt + 24);
    expect(ledger.netTreasuryChange).toBeCloseTo(ledger.operatingRevenue + ledger.financingRaised - ledger.totalExpenses, 5);
    expect(ledger.monthlyProjection).toBeCloseTo(ledger.netTreasuryChange * 4.345, 1);
  });

  it('makes central-bank finance faster but more inflationary than savings bonds', () => {
    const savings = advanceEconomyWeek({ ...createEconomyState('britain'), bondProgram: 'savings' }, context);
    const central = advanceEconomyWeek({ ...createEconomyState('britain'), bondProgram: 'central-bank' }, context);
    expect(central.ledger.financingRaised).toBeGreaterThan(savings.ledger.financingRaised);
    expect(central.state.inflation).toBeGreaterThan(savings.state.inflation);
    expect(central.state.publicConfidence).toBeLessThan(savings.state.publicConfidence);
  });

  it('buys and sells a historical industrial stake with transparent cost and slippage', () => {
    const state = createEconomyState('britain');
    const company = getAvailableCompanies('britain')[0];
    const purchase = buyIndustrialStake(state, company.id, 100);
    expect(purchase?.treasuryDelta).toBe(-100);
    expect(purchase?.state.holdings[0].invested).toBe(100);
    const sale = purchase && sellIndustrialStake(purchase.state, company.id, 1);
    expect(sale?.proceeds).toBeLessThan(100);
    expect(sale?.state.holdings).toHaveLength(0);
  });

  it('summarizes price, risk, dividend, capacity and holding return for the simple investment board', () => {
    const state = createEconomyState('britain');
    const company = getAvailableCompanies('britain')[0];
    const purchase = buyIndustrialStake(state, company.id, 50);
    expect(purchase).not.toBeNull();
    if (!purchase) return;
    const movedState = {
      ...purchase.state,
      previousPrices: { ...purchase.state.previousPrices, [company.id]: company.basePrice },
      marketPrices: { ...purchase.state.marketPrices, [company.id]: company.basePrice * 1.1 },
    };
    const snapshot = getCompanyInvestmentSnapshot(movedState, company, 50);
    expect(snapshot.weeklyChange).toBe(10);
    expect(snapshot.holdingValue).toBe(55);
    expect(snapshot.holdingGain).toBe(5);
    expect(snapshot.holdingReturnRate).toBe(10);
    expect(snapshot.riskLevel).toBeGreaterThanOrEqual(1);
    expect(snapshot.riskLevel).toBeLessThanOrEqual(3);
    expect(snapshot.availableCapacity).toBe(company.maxInvestment - 50);
    expect(snapshot.previewAnnualDividend).toBeGreaterThanOrEqual(0);
  });

  it('keeps only companies available to the restored nation in old or malformed saves', () => {
    const restored = normalizeEconomyState({
      marketPrices: { ford: 120, krupp: 200 },
      holdings: [
        { companyId: 'ford', units: 1, invested: 100, averagePrice: 100 },
        { companyId: 'krupp', units: 1, invested: 100, averagePrice: 100 },
      ],
    }, 'usa');
    expect(restored.marketPrices.ford).toBe(120);
    expect(restored.marketPrices.krupp).toBeUndefined();
    expect(restored.holdings.map((holding) => holding.companyId)).toEqual(['ford']);
  });
});
