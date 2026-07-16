import { describe, expect, it } from 'vitest';
import type { WarEvent } from './types';
import { categorizeWarEvent, filterWarEvents } from './journal';

const events: WarEvent[] = [
  { id: 1, week: 1, title: '전선 돌파 — 알제리', detail: '기갑부대가 목표를 확보했습니다.', tone: 'good' },
  { id: 2, week: 2, title: '연구 완료 — 레이더', detail: '전자 기술이 전군에 적용됩니다.', tone: 'good' },
  { id: 3, week: 3, title: '외교 관계 개선', detail: '대사가 새로운 협정을 체결했습니다.', tone: 'neutral' },
];

describe('war journal filtering', () => {
  it('classifies operational, domestic, and diplomatic dispatches', () => {
    expect(events.map(categorizeWarEvent)).toEqual(['operations', 'domestic', 'diplomacy']);
  });

  it('combines category filters with case-insensitive search', () => {
    expect(filterWarEvents(events, 'domestic', '레이더').map((event) => event.id)).toEqual([2]);
    expect(filterWarEvents(events, 'all', '알제리').map((event) => event.id)).toEqual([1]);
  });

  it('returns an empty set when no dispatch matches', () => {
    expect(filterWarEvents(events, 'diplomacy', '기갑')).toHaveLength(0);
  });
});
