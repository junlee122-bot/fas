import type { NationId } from './types';

export interface OutcomeDistributionSnapshot {
  nationalScoreP10: number;
  nationalScoreP90: number;
  viableRate: number;
}

interface OutcomeBand {
  p10: readonly [number, number];
  p90: readonly [number, number];
  viable: readonly [number, number];
}

export const possibilityOutcomeGuardrails: Record<NationId, OutcomeBand> = {
  britain: { p10: [51, 62], p90: [69, 79], viable: [93, 99] },
  usa: { p10: [53, 64], p90: [71, 82], viable: [90, 99] },
  ussr: { p10: [49, 60], p90: [69, 80], viable: [80, 95] },
  germany: { p10: [47, 58], p90: [67, 78], viable: [78, 93] },
  japan: { p10: [49, 60], p90: [68, 79], viable: [88, 99] },
  china: { p10: [44, 56], p90: [65, 77], viable: [76, 93] },
  india: { p10: [44, 56], p90: [64, 76], viable: [84, 97] },
  freefrance: { p10: [49, 60], p90: [67, 78], viable: [86, 98] },
  italy: { p10: [44, 56], p90: [65, 76], viable: [82, 96] },
  korea: { p10: [43, 55], p90: [63, 75], viable: [86, 99] },
  vietnam: { p10: [41, 53], p90: [61, 73], viable: [78, 94] },
  indonesia: { p10: [44, 56], p90: [63, 75], viable: [82, 97] },
  philippines: { p10: [45, 57], p90: [64, 76], viable: [85, 98] },
};

const outside = (value: number, [minimum, maximum]: readonly [number, number]) =>
  value < minimum || value > maximum;

export function evaluateOutcomeGuardrails(
  byNation: Partial<Record<NationId, OutcomeDistributionSnapshot>>,
) {
  return (Object.entries(byNation) as Array<[NationId, OutcomeDistributionSnapshot]>).flatMap(([nationId, outcome]) => {
    const expected = possibilityOutcomeGuardrails[nationId];
    if (!expected) return [`${nationId}:guardrail-missing`];
    return [
      outside(outcome.nationalScoreP10, expected.p10)
        ? `${nationId}:p10=${outcome.nationalScoreP10} expected ${expected.p10[0]}–${expected.p10[1]}`
        : null,
      outside(outcome.nationalScoreP90, expected.p90)
        ? `${nationId}:p90=${outcome.nationalScoreP90} expected ${expected.p90[0]}–${expected.p90[1]}`
        : null,
      outside(outcome.viableRate, expected.viable)
        ? `${nationId}:viable=${outcome.viableRate}% expected ${expected.viable[0]}–${expected.viable[1]}%`
        : null,
    ].filter((entry): entry is string => entry !== null);
  });
}
