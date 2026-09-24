import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WorldWeekly } from './WorldWeekly';
import { getNewsMediaEra } from './newsMediaEvolution';
import { getCampaignWeekForYear } from './campaignCalendar';
import type { WorldWeeklyIssue } from './worldWeeklyEngine';

function createIssue(year: number): WorldWeeklyIssue {
  const week = getCampaignWeekForYear(year);
  return {
    id: `issue-${year}`, week, edition: week + 1, dateRange: `${year}년 주간 기록`,
    worldlineCode: 'WL-TEST', worldlineTitle: '시험 세계선', media: getNewsMediaEra(year), leadArticleId: `lead-${year}`,
    articles: [{
      id: `lead-${year}`, category: 'diplomacy', region: '국제면', headline: `${year}년 실제 기록의 제목`,
      summary: '확인된 게임 상태로 작성한 기사 본문', cause: '관계 지표가 변한 원인', consequence: '다음 주 외교 비용에 영향',
      confidence: 'assessed', priority: 80, tone: 'neutral', signals: [{ label: '관계', value: '52', tone: 'neutral' }],
      actionTab: 'diplomacy', actionLabel: '외교부로 이동', sourceEventId: 301,
    }],
    metrics: { activeFronts: 2, battleCount: 0, territoryChanges: 0, treasuryChange: 3, relationAverage: 52, healthRisk: 0, eventCount: 1, intelligence: 60 },
    changePulse: { headline: '이번 주 실제 변화', summary: '당시 상태를 보존한 요약', editorialTone: 'diplomatic', editorialLabel: '외교 중심 편집', signals: [] },
  };
}

describe('world weekly editorial media integration', () => {
  it('uses the newspaper emblem for the period press without replacing later-era media', () => {
    const header = (year: number) => renderToStaticMarkup(<WorldWeekly issues={[createIssue(year)]} onNavigate={vi.fn()} onClose={vi.fn()} />).match(/<header class="world-weekly-header">[\s\S]*?<\/header>/)?.[0];
    expect(header(1942)).toContain('data-game-icon="newspaper"');
    expect(header(1942)).toContain('context-ink');
    expect(header(2005)).not.toContain('data-game-icon="newspaper"');
  });
  it.each([[1942, 'press'], [1954, 'radio'], [1968, 'television'], [1989, 'television'], [2005, 'digital'], [2016, 'digital'], [2035, 'digital']] as const)('uses the %s issue medium for the introductory art', (year, artId) => {
    const html = renderToStaticMarkup(<WorldWeekly issues={[createIssue(year)]} onNavigate={vi.fn()} onClose={vi.fn()} />);
    expect(html).toContain(`data-media-art="${artId}"`);
    const introduction = html.match(/<section class="weekly-media-introduction"[\s\S]*?<\/section>/)?.[0];
    expect(introduction).toContain('보도 환경 삽화 · 실제 사건 사진 아님');
    expect(introduction).not.toContain(`${year}년 실제 기록의 제목`);
    expect(html).toContain(`<h2>${year}년 실제 기록의 제목</h2>`);
    expect(html).toContain('확인된 게임 상태로 작성한 기사 본문');
    expect(html).toContain('관계 지표가 변한 원인');
    expect(html).toContain('다음 주 외교 비용에 영향');
    expect(html).toContain('분석됨');
    expect(html).toContain('외교부로 이동');
  });

  it('does not modernize the selected archive issue because newer issues exist', () => {
    const archived = createIssue(1942);
    const latest = createIssue(2060);
    const html = renderToStaticMarkup(<WorldWeekly issues={[archived, latest]} onNavigate={vi.fn()} onClose={vi.fn()} />);
    expect(html).toContain('data-media-era="wartime-press"');
    expect(html).toContain('data-media-art="press"');
    expect(html).not.toContain('data-media-art="digital"');
    expect(html).toContain('2060년 주간 기록');
  });

  it('leaves archived facts, navigation and acknowledgment state untouched on render', () => {
    const issue = createIssue(1942);
    const original = structuredClone(issue);
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    renderToStaticMarkup(<WorldWeekly issues={[issue]} onNavigate={onNavigate} onClose={onClose} />);
    expect(issue).toEqual(original);
    expect(issue.articles[0].sourceEventId).toBe(301);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('preserves the empty-archive fallback', () => {
    expect(renderToStaticMarkup(<WorldWeekly issues={[]} onNavigate={vi.fn()} onClose={vi.fn()} />)).toBe('');
  });
});
