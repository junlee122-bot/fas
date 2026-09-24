import { describe, expect, it } from 'vitest';
import { historicalFlags } from './historicalFlags';
import type { NationId } from './types';

const nationIds: NationId[] = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'];

describe('historical flag records', () => {
  it('covers every playable entity with a flag active in the 1942 context', () => {
    expect(Object.keys(historicalFlags).sort()).toEqual([...nationIds].sort());
    nationIds.forEach((nationId) => {
      const record = historicalFlags[nationId];
      expect(record.validFrom).toBeLessThanOrEqual(1942);
      expect(record.validTo).toBeGreaterThanOrEqual(1942);
      expect(record.sourceUrl).toMatch(/^https:\/\//);
    });
  });

  it('labels non-sovereign Asian selections as historical movements or governments', () => {
    expect(historicalFlags.korea.kind).toBe('government-in-exile');
    expect(historicalFlags.india.kind).toBe('independence-movement');
    expect(historicalFlags.vietnam.kind).toBe('independence-movement');
    expect(historicalFlags.indonesia.kind).toBe('independence-movement');
    expect(historicalFlags.philippines.kind).toBe('wartime');
  });

  it('uses the 48-star configuration for the wartime United States record', () => {
    expect(historicalFlags.usa.name).toContain('48성');
    expect(historicalFlags.usa.period).toBe('1912–1959');
  });
});
