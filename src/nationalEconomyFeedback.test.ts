import { describe, expect, it } from 'vitest';
import {
  deriveNationalEconomyFeedback,
  NATIONAL_ECONOMY_FEEDBACK_CAPS,
  type NationalEconomyFeedback,
  type NationalEconomyFeedbackContext,
} from './nationalEconomyFeedback';
import type { NationalSimulationSnapshot } from './nationalSimulation';

const context: NationalEconomyFeedbackContext = {
  phase: 'nation',
  game: { stability: 78 },
  economy: { inflation: 3, publicConfidence: 72 },
  nationManagement: { unrest: 20, employment: 76 },
};

function supplies(availability = 70, overrides: Record<string, number> = {}): Pick<NationalSimulationSnapshot, 'goods'> {
  return {
    goods: ['consumer', 'food', 'fuel', 'steel', 'transport', 'medicine'].map((id) => ({
      id, name: id, availability: overrides[id] ?? availability,
      priceIndex: 100, weeklyBalance: 0, status: 'stable', driver: 'test', destination: 'economy',
    })),
  };
}

const deltas = (feedback: NationalEconomyFeedback) => ({ ...feedback.gameDelta, ...feedback.economyDelta, ...feedback.nationDelta });

function apply(context: NationalEconomyFeedbackContext, feedback: NationalEconomyFeedback): NationalEconomyFeedbackContext {
  return {
    ...context,
    game: { stability: context.game.stability + feedback.gameDelta.stability },
    economy: {
      inflation: context.economy.inflation + feedback.economyDelta.inflation,
      publicConfidence: context.economy.publicConfidence + feedback.economyDelta.publicConfidence,
    },
    nationManagement: {
      unrest: context.nationManagement.unrest + feedback.nationDelta.unrest,
      employment: context.nationManagement.employment + feedback.nationDelta.employment,
    },
  };
}

describe('bounded weekly civilian-economy feedback', () => {
  it('is exactly neutral for normal supply and normal state, without fiscal fields', () => {
    const feedback = deriveNationalEconomyFeedback(supplies(), context);
    expect(feedback.status).toBe('balanced');
    expect(feedback.shortagePressure).toBe(0);
    expect(deltas(feedback)).toEqual({ stability: 0, inflation: 0, publicConfidence: 0, unrest: 0, employment: 0 });
    for (const field of ['treasury', 'debt', 'taxPolicy', 'operatingRevenue', 'financingRaised']) {
      expect(deltas(feedback)).not.toHaveProperty(field);
      expect(feedback).not.toHaveProperty(field);
    }
  });

  it('turns real consumer shortages into bounded adverse state changes', () => {
    const mild = deriveNationalEconomyFeedback(supplies(70, { consumer: 49 }), context);
    const severe = deriveNationalEconomyFeedback(supplies(70, { consumer: 15 }), context);
    expect(severe.status).toBe('shortage');
    expect(severe.affectedGoods.map((good) => good.id)).toEqual(['consumer']);
    expect(severe.shortagePressure).toBeGreaterThan(mild.shortagePressure);
    expect(severe.economyDelta.inflation).toBeGreaterThan(mild.economyDelta.inflation);
    expect(severe.economyDelta.publicConfidence).toBeLessThan(mild.economyDelta.publicConfidence);
    expect(severe.gameDelta.stability).toBeLessThan(0);
    expect(severe.nationDelta.unrest).toBeGreaterThan(0);
    expect(severe.nationDelta.employment).toBeLessThan(0);
    const maximum = deltas(deriveNationalEconomyFeedback(supplies(0), context));
    for (const [key, cap] of Object.entries(NATIONAL_ECONOMY_FEEDBACK_CAPS)) {
      expect(Math.abs(maximum[key as keyof typeof maximum])).toBeLessThanOrEqual(cap);
    }
  });

  it('reduces pressure smoothly as supply improves and restores only distressed indicators', () => {
    const shortages = [15, 35, 49, 51.99, 52].map((consumer) => deriveNationalEconomyFeedback(supplies(70, { consumer }), context));
    expect(shortages.map((feedback) => feedback.shortagePressure)).toEqual([...shortages.map((feedback) => feedback.shortagePressure)].sort((a, b) => b - a));
    expect(Math.abs(shortages[3].economyDelta.publicConfidence)).toBeLessThan(0.001);
    expect(deltas(shortages[4])).toEqual({ stability: 0, inflation: 0, publicConfidence: 0, unrest: 0, employment: 0 });
    const damaged: NationalEconomyFeedbackContext = {
      phase: 'nation', game: { stability: 58 },
      economy: { inflation: 9, publicConfidence: 45 }, nationManagement: { unrest: 42, employment: 52 },
    };
    const recovery = deriveNationalEconomyFeedback(supplies(70), damaged);
    expect(recovery.status).toBe('recovering');
    expect(recovery.economyDelta.inflation).toBe(-0.04);
    expect(recovery.economyDelta.publicConfidence).toBe(0.06);
    expect(recovery.gameDelta.stability).toBe(0.03);
    expect(recovery.nationDelta.unrest).toBe(-0.06);
    expect(recovery.nationDelta.employment).toBe(0.04);
  });

  it('does not duplicate direct medical losses or reward unknown supply data', () => {
    expect(deltas(deriveNationalEconomyFeedback(supplies(70, { medicine: 0 }), context))).toEqual(deltas(deriveNationalEconomyFeedback(supplies(70), context)));
    const damaged = { ...context, economy: { inflation: 9, publicConfidence: 45 } };
    expect(deltas(deriveNationalEconomyFeedback({ goods: [] }, damaged))).toEqual({ stability: 0, inflation: 0, publicConfidence: 0, unrest: 0, employment: 0 });
    const malformed = supplies(70, { consumer: Number.NaN });
    expect(deltas(deriveNationalEconomyFeedback(malformed, damaged))).toEqual({ stability: 0, inflation: 0, publicConfidence: 0, unrest: 0, employment: 0 });
  });

  it('cannot infinitely accumulate penalties or recovery bonuses at fixed supply', () => {
    let state = structuredClone(context);
    for (let tick = 0; tick < 2000; tick += 1) state = apply(state, deriveNationalEconomyFeedback(supplies(0), state));
    expect(state.game.stability).toBeGreaterThanOrEqual(52);
    expect(state.economy.inflation).toBeLessThanOrEqual(12);
    expect(state.economy.publicConfidence).toBeGreaterThanOrEqual(42);
    expect(state.nationManagement.unrest).toBeLessThanOrEqual(45);
    expect(state.nationManagement.employment).toBeGreaterThanOrEqual(50);
    expect(Object.values(deltas(deriveNationalEconomyFeedback(supplies(0), state))).every((value) => value === 0)).toBe(true);
    for (let tick = 0; tick < 2000; tick += 1) state = apply(state, deriveNationalEconomyFeedback(supplies(70), state));
    expect(state.game.stability).toBeLessThanOrEqual(70);
    expect(state.economy.inflation).toBeGreaterThanOrEqual(4);
    expect(state.economy.publicConfidence).toBeLessThanOrEqual(60);
    expect(state.nationManagement.unrest).toBeGreaterThanOrEqual(25);
    expect(state.nationManagement.employment).toBeLessThanOrEqual(65);
    expect(deriveNationalEconomyFeedback(supplies(70), state).status).toBe('balanced');
  });

  it('is deterministic, immutable and does not forecast later weeks when previewed repeatedly', () => {
    const snapshot = supplies(70, { consumer: 20 });
    const originalSnapshot = structuredClone(snapshot);
    const originalContext = structuredClone(context);
    const first = deriveNationalEconomyFeedback(snapshot, context);
    for (let preview = 0; preview < 10; preview += 1) expect(deriveNationalEconomyFeedback(snapshot, context)).toEqual(first);
    expect(snapshot).toEqual(originalSnapshot);
    expect(context).toEqual(originalContext);
  });
});
