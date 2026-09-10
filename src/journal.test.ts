import { describe, expect, it } from 'vitest';
import type { WarEvent } from './types';
import { categorizeWarEvent, createWarEventTrace, filterWarEvents, getJournalComparisonStatus, getWarEventTrace, summarizeJournalComparisons, summarizeJournalProgress } from './journal';

const events: WarEvent[] = [
  { id: 1, week: 1, title: '전선 돌파 — 알제리', detail: '기갑부대가 목표를 확보했습니다.', tone: 'good' },
  { id: 2, week: 2, title: '연구 완료 — 레이더', detail: '전자 기술이 전군에 적용됩니다.', tone: 'good' },
  { id: 3, week: 3, title: '외교 관계 개선', detail: '대사가 새로운 협정을 체결했습니다.', tone: 'neutral' },
];

describe('war journal filtering', () => {
  it('classifies operational, management, and diplomatic dispatches', () => {
    expect(events.map(categorizeWarEvent)).toEqual(['operations', 'management', 'diplomacy']);
  });

  it('combines category filters with case-insensitive search', () => {
    expect(filterWarEvents(events, 'management', '레이더').map((event) => event.id)).toEqual([2]);
    expect(filterWarEvents(events, 'all', '알제리').map((event) => event.id)).toEqual([1]);
  });

  it('returns an empty set when no dispatch matches', () => {
    expect(filterWarEvents(events, 'diplomacy', '기갑')).toHaveLength(0);
  });

  it('explains a result as a decision, calculation, effect, and next action', () => {
    const trace = createWarEventTrace('전선 돌파 — 알제리', '목표를 확보하고 병력 12를 잃었습니다.', 'good');
    expect(trace.domain).toBe('operations');
    expect(trace.decision).toContain('공세 목표');
    expect(trace.factors.length).toBeGreaterThanOrEqual(4);
    expect(trace.effects[0].value).toContain('병력 12');
    expect(trace.ongoing.some((item) => item.includes('손실'))).toBe(true);
    expect(trace.nextActions.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps explicit weekly-resolution math instead of replacing it with inference', () => {
    const event: WarEvent = {
      id: 4,
      week: 4,
      title: '주간 지휘 결산 — 제 5주',
      detail: '재정 +12',
      tone: 'neutral',
      trace: createWarEventTrace('주간 지휘 결산 — 제 5주', '재정 +12', 'neutral', {
        effects: [{ label: '수지', value: '재정 +12', tone: 'positive' }],
        factors: ['54 - 공장 30 - 급여 12 = +12'],
      }),
    };
    expect(getWarEventTrace(event).effects[0]).toEqual({ label: '수지', value: '재정 +12', tone: 'positive' });
    expect(filterWarEvents([event], 'management', '급여 12')).toHaveLength(1);
  });

  it('classifies forecast accuracy in the direction that benefits the player', () => {
    expect(getJournalComparisonStatus(10, 10)).toBe('matched');
    expect(getJournalComparisonStatus(10, 12)).toBe('better');
    expect(getJournalComparisonStatus(10, 8)).toBe('worse');
    expect(getJournalComparisonStatus(2, 1.5, false)).toBe('better');
    expect(getJournalComparisonStatus(2, 2.5, false)).toBe('worse');
  });

  it('preserves, searches, and summarizes expected-versus-actual comparisons', () => {
    const comparisonEvent: WarEvent = {
      id: 5,
      week: 6,
      title: '주간 지휘 결산 — 제 7주',
      detail: '예상치와 확정치를 비교했습니다.',
      tone: 'neutral',
      trace: createWarEventTrace('주간 지휘 결산 — 제 7주', '결산 완료', 'neutral', {
        comparisons: [
          { label: '전시 재정', expected: '+£10M', actual: '+£10M', status: 'matched', explanation: '국채 조달금을 포함했습니다.' },
          { label: '작전 명령', expected: '승산 62%', actual: '패배', status: 'worse', explanation: '주력 교전 난수가 불리했습니다.' },
        ],
      }),
    };
    expect(getWarEventTrace(comparisonEvent).comparisons).toHaveLength(2);
    expect(filterWarEvents([comparisonEvent], 'management', '승산 62')).toHaveLength(1);
    expect(summarizeJournalComparisons([comparisonEvent], 6)).toEqual({ total: 2, matched: 1, better: 0, worse: 1, variance: 0 });
  });

  it('compares weekly outcome balance and extracts urgent follow-up actions', () => {
    const progressEvents: WarEvent[] = [
      { id: 10, week: 4, title: '방어 성공', detail: '전선을 지켰습니다.', tone: 'good' },
      { id: 11, week: 5, title: '보급선 붕괴', detail: '연료가 부족합니다.', tone: 'bad', trace: createWarEventTrace('보급선 붕괴', '연료가 부족합니다.', 'bad', { nextActions: ['연료 수송선을 우선 배정하십시오.'] }) },
      { id: 12, week: 5, title: '연구 완료', detail: '새 장비를 적용합니다.', tone: 'good' },
      { id: 13, week: 5, title: '외교 협상 타결', detail: '통상 협정이 체결되었습니다.', tone: 'good' },
    ];
    const summary = summarizeJournalProgress(progressEvents);
    expect(summary.balance).toBe(1);
    expect(summary.previousBalance).toBe(1);
    expect(summary.trend).toBe('stable');
    expect(summary.priorities).toContain('연료 수송선을 우선 배정하십시오.');
    expect(summary.momentum.at(-1)).toMatchObject({ week: 5, good: 2, bad: 1, balance: 1 });
  });
});
