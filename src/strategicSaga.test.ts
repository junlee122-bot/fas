import { describe, expect, it } from 'vitest';
import {
  advanceStrategicSagaWeek,
  chooseSagaApproach,
  commitSagaReserve,
  createStrategicSagaState,
  normalizeStrategicSagaState,
  previewSagaApproach,
  selectSagaOffers,
  startStrategicSaga,
  strategicSagaDefinitions,
  type SagaChampion,
  type StrategicSagaContext,
} from './strategicSaga';
import type { CareerRole } from './types';

const role: CareerRole = {
  id: 'test-minister', nationId: 'korea', title: '국무위원', branch: 'politics', tier: 4, archetype: 'cabinet-minister', scope: '국가 운영', authority: 82, expectation: '장기 국면을 지휘한다', historicalHolderId: 'test-holder', historicalHolderName: '기존 보직자', historicalOffice: '국무위원', historicalBasis: '테스트 보직', coverIdentity: '공직자', replacementEffect: '사용자가 결정을 내린다',
};

const champion: SagaChampion = { id: 'champion', name: '시험 책임자', department: 'science', ability: 86, loyalty: 78 };

const context = (overrides: Partial<StrategicSagaContext> = {}): StrategicSagaContext => ({
  week: 1, year: 1942, phase: 'war', nationId: 'korea', role, politicalPower: 100, treasury: 500, stability: 68, warSupport: 72, enemyPressure: 35, intelNetwork: 66, legitimacy: 64, unrest: 31, education: 70, civilianIndustry: 65, institutionalCapacity: 68, relativeCompetitiveness: 63, relationAverage: 62, publicConfidence: 66, inflation: 4, completedResearch: 4, publicHealthPressure: 2, coalitionSupport: 65, promiseReliability: 72, ...overrides,
});

describe('strategic saga', () => {
  it('offers three era-appropriate situations deterministically', () => {
    const first = selectSagaOffers(context());
    const second = selectSagaOffers(context());
    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first.every((id) => strategicSagaDefinitions.some((definition) => definition.id === id))).toBe(true);
  });

  it('starts a selected situation with a named responsible staff member', () => {
    const state = createStrategicSagaState(context());
    const result = startStrategicSaga(state, state.offers[0], champion, context());
    expect(result.state.active?.champion.name).toBe(champion.name);
    expect(result.state.active?.actIndex).toBe(0);
    expect(result.politicalPowerDelta).toBeLessThan(0);
    expect(result.state.offers).toHaveLength(0);
  });

  it('shows different capability, cost and pressure forecasts for each approach', () => {
    const state = createStrategicSagaState(context());
    const active = startStrategicSaga(state, state.offers[0], champion, context()).state.active!;
    const command = previewSagaApproach(active, 'command', context());
    const coalition = previewSagaApproach(active, 'coalition', context());
    const innovation = previewSagaApproach(active, 'innovation', context());
    expect(new Set([command.politicalCost, coalition.politicalCost, innovation.politicalCost]).size).toBe(3);
    expect(command.weeklyPressure).toBeGreaterThan(coalition.weeklyPressure);
    expect([command.capability, coalition.capability, innovation.capability].every((value) => value > 0)).toBe(true);
  });

  it('does not advance until the player chooses an approach', () => {
    const state = createStrategicSagaState(context());
    const started = startStrategicSaga(state, state.offers[0], champion, context()).state;
    const weekly = advanceStrategicSagaWeek(started, context({ week: 2 }));
    expect(weekly.requiresDecision).toBe(true);
    expect(weekly.state.active?.progress).toBe(started.active?.progress);
  });

  it('advances over several weeks and preserves the choice between acts', () => {
    const state = createStrategicSagaState(context());
    const started = startStrategicSaga(state, state.offers[0], champion, context()).state;
    let working = chooseSagaApproach(started, 'innovation', context()).state;
    const initial = working.active!.progress;
    for (let week = 2; week <= 5; week += 1) working = advanceStrategicSagaWeek(working, context({ week })).state;
    expect(working.active!.progress).toBeGreaterThan(initial);
    expect(working.active!.pressure).toBeGreaterThan(started.active!.pressure);
  });

  it('turns excessive pressure into a recoverable institutional scar', () => {
    const state = createStrategicSagaState(context());
    const started = startStrategicSaga(state, state.offers[0], champion, context()).state;
    const selected = chooseSagaApproach(started, 'command', context()).state;
    const pressured = { ...selected, active: { ...selected.active!, pressure: 99, progress: 25 } };
    const weekly = advanceStrategicSagaWeek(pressured, context({ week: 2, enemyPressure: 90 }));
    expect(weekly.state.active?.setbacks).toBe(1);
    expect(weekly.state.active?.scars.length).toBe(1);
    expect(weekly.state.active?.approachId).toBeNull();
    expect(weekly.requiresDecision).toBe(true);
  });

  it('lets the player trade future pressure for immediate progress', () => {
    const state = createStrategicSagaState(context());
    const started = startStrategicSaga(state, state.offers[0], champion, context()).state;
    const selected = chooseSagaApproach(started, 'coalition', context()).state;
    const result = commitSagaReserve(selected, context());
    expect(result.state.active?.progress).toBe((selected.active?.progress ?? 0) + 12);
    expect(result.state.active?.pressure).toBe((selected.active?.pressure ?? 0) + 5);
    expect(result.treasuryDelta).toBe(-10);
  });

  it('resolves the fourth act into a persistent legacy instead of a binary game over', () => {
    const state = createStrategicSagaState(context());
    const started = startStrategicSaga(state, state.offers[0], champion, context()).state;
    const selected = chooseSagaApproach(started, 'innovation', context()).state;
    const finale = { ...selected, active: { ...selected.active!, actIndex: 3 as const, progress: 99, pressure: 8, momentum: 28 } };
    const weekly = advanceStrategicSagaWeek(finale, context({ week: 40 }));
    expect(weekly.state.active).toBeNull();
    expect(weekly.state.history).toHaveLength(1);
    expect(weekly.state.legacyMarks).toBeGreaterThan(0);
    expect(weekly.state.institutionalMemory.length).toBeGreaterThan(0);
  });

  it('normalizes older saves without a saga payload', () => {
    const fallback = createStrategicSagaState(context());
    expect(normalizeStrategicSagaState(undefined, fallback)).toEqual(fallback);
    const restored = normalizeStrategicSagaState({ ...fallback, offers: ['missing', fallback.offers[0]], legacyMarks: 7 }, fallback);
    expect(restored.offers).toEqual([fallback.offers[0]]);
    expect(restored.legacyMarks).toBe(7);
  });
});
