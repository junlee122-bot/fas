import { describe, expect, it } from 'vitest';
import {
  getNationDevelopmentProfile,
  getNationTransitionSchedule,
} from './nationDevelopment';

describe('country-specific century development profiles', () => {
  it('uses distinct transition routes instead of one universal postwar timer', () => {
    const britain = getNationDevelopmentProfile('britain');
    const korea = getNationDevelopmentProfile('korea');
    const vietnam = getNationDevelopmentProfile('vietnam');

    expect(britain.transition.archetype).toBe('victor-settlement');
    expect(korea.transition.archetype).toBe('liberation');
    expect(vietnam.transition.archetype).toBe('decolonization');
    expect(new Set([
      britain.transition.targetWeek,
      korea.transition.targetWeek,
      vietnam.transition.targetWeek,
    ]).size).toBe(3);
  });

  it('keeps deterministic session variation inside each country transition window', () => {
    const first = getNationTransitionSchedule('korea', 104, 17);
    const repeated = getNationTransitionSchedule('korea', 104, 17);
    const vietnam = getNationTransitionSchedule('vietnam', 104, 17);

    expect(repeated).toEqual(first);
    expect(first.targetWeek).toBeGreaterThanOrEqual(first.earliestWeek);
    expect(first.targetWeek).toBeLessThanOrEqual(first.deadlineWeek);
    expect(vietnam.targetWeek).not.toBe(first.targetWeek);
  });
});
