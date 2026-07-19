import { describe, expect, it } from 'vitest';
import { createCovertOperations, createDiplomaticRelations, getNation } from './campaign';
import { initialResearch, territories } from './data';
import { createEconomyState } from './economy';
import { createPublicHealthState } from './publicHealth';
import type { WarEvent } from './types';
import { generateWorldWeeklyIssue, normalizeWorldWeeklyIssues } from './worldWeeklyEngine';
import type { WorldWeeklyContext } from './worldWeeklyEngine';

function createContext(overrides: Partial<WorldWeeklyContext> = {}): WorldWeeklyContext {
  const economy = createEconomyState('britain');
  economy.lastLedger = {
    week: 4,
    revenues: [],
    financing: [],
    expenses: [],
    operatingRevenue: 92,
    financingRaised: 24,
    totalExpenses: 101,
    netTreasuryChange: 15,
    monthlyProjection: 60,
    debtAfter: 340,
    portfolioValue: 25,
    unrealizedGain: 2,
  };
  const context: WorldWeeklyContext = {
    week: 4,
    nation: getNation('britain'),
    playerFaction: 'allies',
    game: { stability: 72, warSupport: 80, treasury: 940, intelNetwork: 68, enemyPressure: 61 },
    territories,
    events: [],
    battleReports: [],
    relations: createDiplomaticRelations('britain'),
    economy,
    publicHealth: createPublicHealthState(19391),
    research: initialResearch,
    operations: createCovertOperations('europe', 'britain'),
    worldline: {
      code: 'WL-TEST',
      title: '시험 세계선',
      primaryBloc: '대서양 협력권',
      rivalBloc: '대륙 협약권',
      rivalryName: '양대권 경쟁',
    },
  };
  return { ...context, ...overrides };
}

describe('world weekly issue generator', () => {
  it('publishes an opening edition for the seven days leading into the campaign timeline', () => {
    const issue = generateWorldWeeklyIssue(createContext({ week: 0 }));

    expect(issue.id).toBe('world-weekly-britain-0');
    expect(issue.edition).toBe(1);
    expect(issue.dateRange).toBe('1942년 10월 18일 — 1942년 10월 25일');
    expect(issue.worldlineCode).toBe('WL-TEST');
    expect(issue.articles).toHaveLength(6);
  });

  it('publishes one actionable article for every desk from the actual weekly state', () => {
    const issue = generateWorldWeeklyIssue(createContext());

    expect(issue.id).toBe('world-weekly-britain-4');
    expect(issue.edition).toBe(5);
    expect(issue.articles).toHaveLength(6);
    expect(new Set(issue.articles.map((article) => article.category))).toEqual(new Set([
      'front', 'diplomacy', 'economy', 'society', 'science', 'intelligence',
    ]));
    expect(issue.metrics.treasuryChange).toBe(15);
    expect(issue.metrics.activeFronts).toBeGreaterThan(0);
    expect(issue.articles.every((article) => article.cause.length > 0 && article.consequence.length > 0)).toBe(true);
    expect(issue.articles.every((article) => article.actionLabel.length > 0)).toBe(true);
  });

  it('promotes a severe event to page one and preserves its causal trace', () => {
    const event: WarEvent = {
      id: 101,
      week: 4,
      title: '보건 비상 — 항구도시 대유행',
      detail: '주간 환자가 급증해 병상 수용력이 위험선에 도달했습니다.',
      tone: 'bad',
      trace: {
        domain: 'management',
        decision: '비상 방역체계를 가동했습니다.',
        trigger: '전선 이동과 항만 밀집으로 감염 접촉이 늘었습니다.',
        factors: ['병상부하 91%'],
        effects: [{ label: '안정도', value: '-3', tone: 'negative' }],
        ongoing: ['보급과 조직력 손실이 다음 주에도 이어집니다.'],
        nextActions: ['보건 위기실에서 대응 정책을 강화하십시오.'],
        certainty: 'confirmed',
      },
    };
    const issue = generateWorldWeeklyIssue(createContext({ events: [event] }));
    const lead = issue.articles.find((article) => article.id === issue.leadArticleId);

    expect(lead?.sourceEventId).toBe(101);
    expect(lead?.category).toBe('society');
    expect(lead?.cause).toContain('전선 이동');
    expect(lead?.consequence).toContain('다음 주');
    expect(lead?.signals[0]).toMatchObject({ label: '안정도', value: '-3', tone: 'negative' });
  });

  it('is deterministic and keeps a de-duplicated 104-week archive', () => {
    const context = createContext();
    const first = generateWorldWeeklyIssue(context);
    const second = generateWorldWeeklyIssue(context);
    expect(second).toEqual(first);

    const archive = Array.from({ length: 110 }, (_, index) => ({
      ...first,
      id: `world-weekly-britain-${index + 1}`,
      week: index + 1,
      edition: index + 1,
    }));
    const normalized = normalizeWorldWeeklyIssues([archive[3], ...archive, { broken: true }, archive[3]]);

    expect(normalized).toHaveLength(104);
    expect(normalized[0].week).toBe(110);
    expect(new Set(normalized.map((issue) => issue.week)).size).toBe(104);
  });
});
