import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  evaluateOutcomeGuardrails,
  possibilityOutcomeGuardrails,
} from './possibilityOutcomeGuardrails';

describe('possibility outcome guardrails', () => {
  it('covers every playable nation', () => {
    expect(Object.keys(possibilityOutcomeGuardrails).sort()).toEqual(nations.map((nation) => nation.id).sort());
  });

  it('accepts in-band distributions and reports percentile or survival drift', () => {
    expect(evaluateOutcomeGuardrails({
      korea: { nationalScoreP10: 49, nationalScoreP90: 69, viableRate: 93 },
    })).toEqual([]);
    expect(evaluateOutcomeGuardrails({
      korea: { nationalScoreP10: 20, nationalScoreP90: 95, viableRate: 100 },
    })).toEqual([
      'korea:p10=20 expected 43–55',
      'korea:p90=95 expected 63–75',
      'korea:viable=100% expected 86–99%',
    ]);
  });
});
