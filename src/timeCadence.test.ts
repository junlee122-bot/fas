import { describe, expect, it } from 'vitest';
import {
  assessStrategicCadence,
  buildStrategicAdvanceReport,
  createStrategicAdvanceSession,
  getStrategicTimeAdvanceOptions,
  normalizeStrategicAdvanceReport,
  shouldInterruptNationAdvance,
} from './timeCadence';

describe('strategic time cadence', () => {
  it('collects healthy quarterly reviews without cancelling half-year or annual delegation', () => {
    expect(shouldInterruptNationAdvance([])).toBe(false);
    for (const week of [13, 26, 39, 52]) {
      expect(shouldInterruptNationAdvance([
        { id: `civic-review-${week}`, tone: 'neutral' },
        { id: `productivity-boom-${week}`, tone: 'good' },
      ])).toBe(false);
    }
  });

  it('never suppresses bad news, even when its identifier resembles a routine report', () => {
    for (const id of ['labor-crisis-13', 'civic-review-13', 'productivity-boom-26']) {
      expect(shouldInterruptNationAdvance([{ id, tone: 'bad' }])).toBe(true);
    }
  });

  it('preserves new acts, elections, authority changes and unfamiliar decisions', () => {
    for (const id of ['saga-act-cold-war-1', 'socialist-stage-commonwealth-2', 'presidential-britain-400', 'authority-loss-30', 'plan-review-52', 'new-decision-system-12']) {
      expect(shouldInterruptNationAdvance([{ id, tone: 'good' }])).toBe(true);
      expect(shouldInterruptNationAdvance([{ id, tone: 'neutral' }])).toBe(true);
    }
  });

  it('stops for research, public-health crises and explicit player decisions without report events', () => {
    for (const signals of [
      { researchCompleted: true }, { researchUnlocked: true }, { publicHealthCrisis: true },
      { authorityLost: true }, { requiresDecision: true },
    ]) expect(shouldInterruptNationAdvance([], signals)).toBe(true);
    expect(shouldInterruptNationAdvance([{ id: 'civic-review-13', tone: 'neutral' }], { publicHealthCrisis: false })).toBe(false);
  });

  it('recommends monthly checks during crises', () => {
    const options = getStrategicTimeAdvanceOptions({ year: 1962, unrest: 72, activeElection: false, publicHealthPressure: 12, activeStrategicOperation: false, activeNationalPlan: true });
    expect(options.find((item) => item.weeks === 4)?.recommended).toBe(true);
    expect(options.find((item) => item.weeks === 52)?.disabled).toBe(true);
  });

  it('allows annual delegation for stable late-era national plans', () => {
    const options = getStrategicTimeAdvanceOptions({ year: 1988, unrest: 22, activeElection: false, publicHealthPressure: 8, activeStrategicOperation: false, activeNationalPlan: true });
    expect(options.find((item) => item.weeks === 52)).toMatchObject({ disabled: false, recommended: true });
  });

  it('keeps early postwar play at quarterly cadence', () => {
    const options = getStrategicTimeAdvanceOptions({ year: 1945, unrest: 28, activeElection: false, publicHealthPressure: 8, activeStrategicOperation: false, activeNationalPlan: false });
    expect(options.find((item) => item.weeks === 13)?.recommended).toBe(true);
    expect(options.find((item) => item.weeks === 26)?.disabled).toBe(true);
  });

  it('explains why the current command tempo is restricted', () => {
    const assessment = assessStrategicCadence({ year: 1974, unrest: 67, activeElection: true, publicHealthPressure: 18, activeStrategicOperation: true, activeNationalPlan: true });
    expect(assessment).toMatchObject({ tempo: 'crisis', recommendedWeeks: 4, maximumWeeks: 4 });
    expect(assessment.riskSignals).toContain('선거·국민투표 일정 진행 중');
    expect(assessment.stopConditions).toHaveLength(4);
  });

  it('creates an auditable before-and-after report when delegation stops early', () => {
    const assessment = assessStrategicCadence({ year: 1988, unrest: 22, activeElection: false, publicHealthPressure: 8, activeStrategicOperation: false, activeNationalPlan: true });
    const session = createStrategicAdvanceSession(52, {
      week: 2392,
      treasury: 820,
      stability: 72,
      mandate: 64,
      unrest: 22,
      nationalScore: 71,
      publicConfidence: 68,
      inflation: 4.2,
    }, assessment);
    const report = buildStrategicAdvanceReport(session, {
      week: 2405,
      treasury: 854,
      stability: 70,
      mandate: 66,
      unrest: 19,
      nationalScore: 74,
      publicConfidence: 71,
      inflation: 3.8,
    }, '분기 국가계획 중간평가');

    expect(report).toMatchObject({ completed: false, elapsedWeeks: 13, stopReason: '분기 국가계획 중간평가' });
    expect(report.metrics.find((metric) => metric.id === 'treasury')).toMatchObject({ before: 820, after: 854, delta: 34 });
    expect(report.metrics.find((metric) => metric.id === 'unrest')).toMatchObject({ delta: -3, inverse: true });
    expect(normalizeStrategicAdvanceReport(report)).toEqual(report);
    expect(normalizeStrategicAdvanceReport({ id: 'broken' })).toBeNull();
  });
});
