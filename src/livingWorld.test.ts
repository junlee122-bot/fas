import { describe, expect, it } from 'vitest';
import { reallocateFactory, selectLivingWorldRecords } from './livingWorld';
import type { ProductionLine, WarEvent } from './types';

const lines: ProductionLine[] = [{ id: 'rifle', name: '소총', assigned: 5, efficiency: 80, output: 100, category: '장비', icon: 'R' }];
describe('living world factory orders', () => {
  it('does not show another nation or a previous service as this world settlement', () => {
    const event: WarEvent = { id: 1, nationId: 'britain', title: '민생 공급 결산', detail: '기록', week: 2, tone: 'neutral' };
    expect(selectLivingWorldRecords([event], 'germany').lastSettlement).toBeUndefined();
    expect(selectLivingWorldRecords([{ ...event, nationId: undefined }], 'britain').lastSettlement).toBeUndefined();
    expect(selectLivingWorldRecords([{ ...event, id: 2, title: '국제 경력 이동 — 영국' }, event], 'britain').lastSettlement).toBeUndefined();
    expect(selectLivingWorldRecords([event], 'britain').lastSettlement?.id).toBe(1);
  });
  it('moves real capacity out of a military line and preserves the input', () => {
    const next = reallocateFactory(lines, 8, 'rifle', -1, true)!;
    expect(next[0]).toMatchObject({ assigned: 4, efficiency: 76 });
    expect(lines[0]).toMatchObject({ assigned: 5, efficiency: 80 });
  });
  it('cannot bypass authority, exceed capacity, invent a line or remove an empty factory', () => {
    expect(reallocateFactory(lines, 8, 'rifle', -1, false)).toBeNull();
    expect(reallocateFactory(lines, 5, 'rifle', 1, true)).toBeNull();
    expect(reallocateFactory(lines, 8, 'missing', -1, true)).toBeNull();
    expect(reallocateFactory([{ ...lines[0], assigned: 0 }], 8, 'rifle', -1, true)).toBeNull();
    expect(reallocateFactory(lines, 8, 'rifle', 10, true)).toBeNull();
  });
  it('can correct an overallocated legacy save by withdrawing capacity only', () => {
    expect(reallocateFactory(lines, 4, 'rifle', -1, true)?.[0].assigned).toBe(4);
    expect(reallocateFactory(lines, 4, 'rifle', 1, true)).toBeNull();
  });
});
