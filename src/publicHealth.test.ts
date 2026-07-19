import { describe, expect, it } from 'vitest';
import {
  advancePublicHealthWeek,
  calculateWeeklyOutbreakRisk,
  comparePublicHealthPolicies,
  createPublicHealthState,
  getOutbreakRiskBreakdown,
  normalizePublicHealthState,
  outbreakTemplates,
  recommendPublicHealthPolicy,
} from './publicHealth';
import type { GameState } from './types';

const game: GameState = {
  week: 20,
  manpower: 1200,
  politicalPower: 80,
  fuel: 70,
  steel: 110,
  factories: 30,
  stability: 68,
  warSupport: 75,
  commandPoints: 50,
  treasury: 900,
  victoryScore: 45,
  airPower: 55,
  navalPower: 50,
  intelNetwork: 60,
  enemyPressure: 72,
};

const context = {
  week: 20,
  nationId: 'britain' as const,
  theater: 'europe' as const,
  enemyPressure: game.enemyPressure,
  stability: game.stability,
  averageSupply: 58,
  scienceBonus: 2,
};

function findEmergentOutbreak() {
  for (let seed = 1; seed <= 10_000; seed += 1) {
    const initial = createPublicHealthState(seed);
    const result = advancePublicHealthWeek(initial, context);
    if (result.state.activeOutbreak) return result.state;
  }
  throw new Error('Expected at least one deterministic outbreak seed.');
}

describe('probabilistic public health engine', () => {
  it('reduces the transparent weekly risk with preparedness and surveillance', () => {
    const baseline = createPublicHealthState(1942);
    const unpreparedRisk = calculateWeeklyOutbreakRisk({ ...baseline, preparedness: 8, surveillance: 7 }, context);
    const preparedRisk = calculateWeeklyOutbreakRisk({ ...baseline, preparedness: 92, surveillance: 88 }, context);
    expect(unpreparedRisk).toBeGreaterThan(preparedRisk);
    expect(preparedRisk).toBeGreaterThanOrEqual(0.001);
    expect(unpreparedRisk).toBeLessThanOrEqual(0.045);
  });

  it('explains the risk as auditable positive and protective contributions', () => {
    const state = createPublicHealthState(1942);
    const factors = getOutbreakRiskBreakdown(state, context);
    const rawRisk = factors.reduce((total, factor) => total + factor.contribution, 0);
    expect(factors.some((factor) => factor.id === 'war-pressure' && factor.contribution > 0)).toBe(true);
    expect(factors.some((factor) => factor.id === 'preparedness' && factor.contribution < 0)).toBe(true);
    expect(calculateWeeklyOutbreakRisk(state, context)).toBeCloseTo(Math.max(0.001, Math.min(0.045, rawRisk)), 8);
  });

  it('includes sourced SARS-like and COVID-like counterfactual archetypes', () => {
    const sars = outbreakTemplates.find((template) => template.id === 'sars-like-coronavirus');
    const covid = outbreakTemplates.find((template) => template.id === 'covid-like-coronavirus');
    expect(sars?.alternateHistory).toBe(true);
    expect(covid?.alternateHistory).toBe(true);
    expect(sars?.sourceUrl.startsWith('https://')).toBe(true);
    expect(covid?.sourceUrl.startsWith('https://')).toBe(true);
    expect(outbreakTemplates.some((template) => !template.alternateHistory)).toBe(true);
  });

  it('produces deterministic emergence and progression for the same seed', () => {
    const active = findEmergentOutbreak();
    expect(active.activeOutbreak).not.toBeNull();
    const nextContext = { ...context, week: context.week + 1 };
    expect(advancePublicHealthWeek(active, nextContext)).toEqual(advancePublicHealthWeek(active, nextContext));
  });

  it('makes maximum suppression lower transmission more than sentinel surveillance', () => {
    const active = findEmergentOutbreak();
    const nextContext = { ...context, week: context.week + 1 };
    const sentinel = advancePublicHealthWeek({ ...active, policyId: 'sentinel' }, nextContext);
    const suppression = advancePublicHealthWeek({ ...active, policyId: 'suppression' }, nextContext);
    expect(suppression.state.activeOutbreak?.rEffective).toBeLessThan(sentinel.state.activeOutbreak?.rEffective ?? 0);
    expect(suppression.gameDelta.treasury).toBeLessThan(sentinel.gameDelta.treasury ?? 0);
  });

  it('compares all response postures under identical next-week conditions', () => {
    const active = findEmergentOutbreak();
    const forecasts = comparePublicHealthPolicies(active, { ...context, week: context.week + 1 });
    const sentinel = forecasts.find((forecast) => forecast.policyId === 'sentinel');
    const suppression = forecasts.find((forecast) => forecast.policyId === 'suppression');
    expect(forecasts).toHaveLength(5);
    expect(suppression?.rEffective).toBeLessThan(sentinel?.rEffective ?? 0);
    expect(suppression?.weeklyCases).toBeLessThan(sentinel?.weeklyCases ?? 0);
    expect(suppression?.treasuryCost).toBeGreaterThan(sentinel?.treasuryCost ?? 0);
  });

  it('changes the staff recommendation with the dominant crisis bottleneck', () => {
    const active = findEmergentOutbreak();
    const spreading = {
      ...active,
      publicTrust: 70,
      activeOutbreak: active.activeOutbreak ? { ...active.activeOutbreak, rEffective: 1.9, hospitalLoad: 70 } : null,
    };
    const overloaded = {
      ...active,
      activeOutbreak: active.activeOutbreak ? { ...active.activeOutbreak, rEffective: 1.1, hospitalLoad: 125 } : null,
    };
    expect(recommendPublicHealthPolicy(spreading, game).policyId).toBe('suppression');
    expect(recommendPublicHealthPolicy(overloaded, game).policyId).toBe('medical-surge');
  });

  it('eventually resolves an outbreak and preserves an after-action record', () => {
    let state = { ...findEmergentOutbreak(), policyId: 'suppression' as const };
    let resolved = false;
    for (let week = context.week + 1; week <= context.week + 60; week += 1) {
      const result = advancePublicHealthWeek(state, { ...context, week });
      state = { ...result.state, policyId: 'suppression' };
      if (!state.activeOutbreak) {
        resolved = true;
        break;
      }
    }
    expect(resolved).toBe(true);
    expect(state.history).toHaveLength(1);
    expect(state.history[0].resolvedWeek).toBeGreaterThan(state.history[0].detectedWeek);
  });

  it('migrates a pre-health save into a safe default state', () => {
    const migrated = normalizePublicHealthState(null, 12345);
    expect(migrated.seed).toBe(12345);
    expect(migrated.activeOutbreak).toBeNull();
    expect(migrated.policyId).toBe('sentinel');
    expect(normalizePublicHealthState({ ...migrated, policyId: 'invalid' }, 9).policyId).toBe('sentinel');
  });
});
