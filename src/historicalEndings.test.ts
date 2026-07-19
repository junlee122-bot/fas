import { describe, expect, it } from 'vitest';
import {
  endingHorizonAxes,
  endingOrderAxes,
  endingSettlementAxes,
  filterHistoricalEndings,
  historicalEndings,
  resolveHistoricalEnding,
} from './historicalEndings';
import type { GeneratedWorldEvent, WorldMetric } from './worldHistory';

const metrics = (values: Partial<Record<WorldMetric, number>>): Record<WorldMetric, number> => ({
  deterrence: 50,
  multipolarity: 50,
  decolonization: 50,
  rights: 50,
  prosperity: 50,
  instability: 50,
  ...values,
});

const campaign = {
  victoryScore: 75,
  stability: 70,
  warSupport: 72,
  factories: 36,
  intelNetwork: 68,
  enemyPressure: 42,
  airPower: 64,
  navalPower: 58,
};

const timeline = (...signals: Array<[string, string]>) => signals.map(([eventId, variantId]) => ({
  event: { id: eventId },
  variant: { id: variantId },
})) as GeneratedWorldEvent[];

describe('historically grounded campaign endings', () => {
  it('keeps a 16 × 16 × 16 matrix of individually addressable endings', () => {
    expect(endingOrderAxes).toHaveLength(16);
    expect(endingSettlementAxes).toHaveLength(16);
    expect(endingHorizonAxes).toHaveLength(16);
    expect(historicalEndings).toHaveLength(4096);
    expect(historicalEndings.length).toBe(endingOrderAxes.length * endingSettlementAxes.length * endingHorizonAxes.length);
    expect(new Set(historicalEndings.map((ending) => ending.id)).size).toBe(historicalEndings.length);
    expect(new Set(historicalEndings.map((ending) => ending.title)).size).toBe(historicalEndings.length);
  });

  it('keeps three historical anchors and consequences on every ending', () => {
    historicalEndings.forEach((ending) => {
      expect(ending.summary.length).toBeGreaterThan(80);
      expect(ending.legacy.length).toBeGreaterThan(60);
      expect(ending.warning.length).toBeGreaterThan(60);
      expect(ending.anchors).toHaveLength(3);
      ending.anchors.forEach((anchor) => {
        expect(anchor.sourceLabel.length).toBeGreaterThan(5);
        expect(anchor.sourceUrl.startsWith('https://')).toBe(true);
      });
    });
  }, 15_000);

  it('supports predictable codex filters without generating duplicate results', () => {
    expect(filterHistoricalEndings({ orderId: 'nonaligned-century' })).toHaveLength(endingSettlementAxes.length * endingHorizonAxes.length);
    expect(filterHistoricalEndings({ settlementId: 'developmental-state' })).toHaveLength(endingOrderAxes.length * endingHorizonAxes.length);
    expect(filterHistoricalEndings({ horizonId: 'orbital-commonwealth' })).toHaveLength(endingOrderAxes.length * endingSettlementAxes.length);
    const exactCombination = filterHistoricalEndings({
      orderId: 'rights-covenant',
      settlementId: 'debt-jubilee-commons',
      horizonId: 'health-solidarity',
    });
    expect(exactCombination).toHaveLength(1);
    expect(exactCombination[0].title).toContain('인권헌장');
    expect(filterHistoricalEndings({ query: '천연두' }).length).toBeGreaterThan(100);
  });

  it('resolves different player-made worlds to different named endings', () => {
    const cooperative = resolveHistoricalEnding({
      nationId: 'india',
      metrics: metrics({ rights: 92, multipolarity: 86, decolonization: 88, prosperity: 82, instability: 18, deterrence: 25 }),
      timeline: timeline(['nonaligned-conference', 'nonalignment'], ['monetary-order', 'clearing-union'], ['atoms-for-peace', 'zero-option']),
      trajectory: undefined,
      game: campaign,
      seed: 1955,
    });
    const fractured = resolveHistoricalEnding({
      nationId: 'germany',
      metrics: metrics({ rights: 18, multipolarity: 88, decolonization: 32, prosperity: 24, instability: 94, deterrence: 86 }),
      timeline: timeline(['war-termination', 'negotiated'], ['monetary-order', 'currency-blocs'], ['ai-governance', 'transformative']),
      trajectory: undefined,
      game: { ...campaign, stability: 28, enemyPressure: 94 },
      seed: 1989,
    });
    expect(cooperative.id).not.toBe(fractured.id);
    expect(cooperative.reasons).toHaveLength(3);
    expect(fractured.reasons).toHaveLength(3);
  });

  it('is deterministic for an identical campaign record', () => {
    const input = {
      nationId: 'korea' as const,
      metrics: metrics({ rights: 72, decolonization: 84 }),
      timeline: timeline(['human-rights', 'binding-charter'], ['smallpox-eradication', 'institutional']),
      trajectory: undefined,
      game: campaign,
      seed: 8151945,
    };
    expect(resolveHistoricalEnding(input)).toEqual(resolveHistoricalEnding(input));
  });
});
