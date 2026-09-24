import { describe, expect, it } from 'vitest';
import {
  advanceMonetarySystem,
  buyForeignCurrency,
  createMonetarySystem,
  formatNationalCurrency,
  getExchangeQuote,
  getHistoricalCurrency,
  issueCustomCurrency,
  normalizeMonetarySystem,
  sellForeignCurrency,
} from './currency';
import type { DiplomaticRelation } from './types';

const relations: DiplomaticRelation[] = [
  { id: 'usa', name: '미합중국', code: 'US', value: 88, status: '동맹', color: '#fff' },
  { id: 'germany', name: '독일국', code: 'DE', value: 18, status: '교전국', color: '#fff' },
  { id: 'india', name: '인도', code: 'IN', value: 70, status: '우호', color: '#fff' },
];

describe('historical currency and foreign exchange', () => {
  it('selects each nation’s period currency and documented reform timeline', () => {
    expect(getHistoricalCurrency('germany', 1942).id).toBe('rm');
    expect(getHistoricalCurrency('germany', 1948).id).toBe('dem');
    expect(getHistoricalCurrency('korea', 1942).id).toBe('kjy');
    expect(getHistoricalCurrency('korea', 1953).id).toBe('krh');
    expect(getHistoricalCurrency('korea', 1962).id).toBe('krw');
    expect(getHistoricalCurrency('china', 1949).id).toBe('cny');
  });

  it('automatically changes the currency name at the reform year without changing real treasury value', () => {
    const system = createMonetarySystem('germany', 1942);
    const result = advanceMonetarySystem(system, 'germany', 1948);
    expect(result.state.activeCurrencyId).toBe('dem');
    expect(result.transition?.note).toContain('100 RM');
  });

  it('formats the same real treasury in the player nation’s intuitive nominal currency', () => {
    const british = createMonetarySystem('britain', 1942);
    const german = createMonetarySystem('germany', 1942);
    const metrics = { inflation: 4, publicConfidence: 70 };
    expect(formatNationalCurrency(920, british, 'britain', 1942, metrics)).toContain('£9.2억');
    expect(formatNationalCurrency(920, german, 'germany', 1942, metrics)).toContain('RM 92억');
    expect(formatNationalCurrency(10, british, 'britain', 1942, metrics)).toBe('£1,000만');
  });

  it('approves an allied liquid currency but refuses an enemy closed currency', () => {
    const system = createMonetarySystem('britain', 1942);
    const metrics = { inflation: 5, publicConfidence: 68 };
    expect(getExchangeQuote(system, 'britain', 'usd', 1942, metrics, relations)?.approved).toBe(true);
    expect(getExchangeQuote(system, 'britain', 'rm', 1942, metrics, relations)?.approved).toBe(false);
  });

  it('moves bought foreign currency into reserves and returns treasury value when sold', () => {
    const system = createMonetarySystem('britain', 1942);
    const metrics = { inflation: 5, publicConfidence: 68 };
    const purchase = buyForeignCurrency(system, 'britain', 'usd', 25, 1942, 3, metrics, relations);
    expect(purchase?.treasuryDelta).toBe(-25);
    expect(purchase?.state.foreignReserves.usd).toBeGreaterThan(90);
    const sale = purchase && sellForeignCurrency(purchase.state, 'britain', 'usd', 1, 1942, 4, metrics, relations);
    expect(sale?.treasuryDelta).toBeGreaterThan(20);
    expect(sale?.state.foreignReserves.usd).toBeUndefined();
  });

  it('lets the player name a sovereign currency while making weak new money rejectable', () => {
    const system = issueCustomCurrency(createMonetarySystem('britain', 1942), 'britain', 1942, '자유 크라운', 'F₩', 'state-credit', { inflation: 28, publicConfidence: 30 });
    expect(system.historicalAutoTransition).toBe(false);
    expect(system.customCurrency?.name).toBe('자유 크라운');
    expect(getExchangeQuote(system, 'britain', 'usd', 1942, { inflation: 28, publicConfidence: 30 }, relations)?.approved).toBe(false);
  });

  it('repairs currency state in older or malformed saves', () => {
    const restored = normalizeMonetarySystem({ activeCurrencyId: 'missing', foreignReserves: { usd: 10, fake: 20 } }, 'india', 1942);
    expect(restored.activeCurrencyId).toBe('inr');
    expect(restored.foreignReserves).toEqual({ usd: 10 });
  });
});
