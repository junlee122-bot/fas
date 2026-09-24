import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyBriefingDialog } from './WeeklyBriefingDialog';
import { getNewsMediaEra } from './newsMediaEvolution';
import type { WarEvent } from './types';
import type { WorldWeeklyIssue } from './worldWeeklyEngine';

const callbacks = { onAcknowledge: vi.fn(), onClose: vi.fn(), onJournal: vi.fn(), onNewspaper: vi.fn(), onActions: vi.fn() };
describe('unified weekly briefing', () => {
  it('offers explicit acknowledgment separately from dismissal on the first week', () => {
    const html = renderToStaticMarkup(<WeeklyBriefingDialog {...callbacks} week={0} date="1942년 10월 25일" events={[]} issue={null} actions={[]} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('취임 첫 주입니다');
    expect(html).toContain('브리핑 닫기, 읽음 처리하지 않음');
    expect(html).toContain('확인 완료 · 이번 주 업무로');
    expect(html).not.toContain('weekly-media-disclosure');
    expect(html).not.toContain('editorial-media-art');
    expect(callbacks.onAcknowledge).not.toHaveBeenCalled();
  });
  it('shows current results and pending work without mixing an older week into the summary', () => {
    const events: WarEvent[] = [
      { id: 1, week: 0, title: '오래된 결과', detail: '지난 기록', tone: 'good' },
      { id: 2, week: 1, title: '보급로 단절', detail: '이번 주 공급에 영향', tone: 'bad' },
    ];
    const html = renderToStaticMarkup(<WeeklyBriefingDialog {...callbacks} week={1} date="1942년 11월 1일" events={events} issue={null} actions={[{ id: 'supply', priority: 'urgent', title: '전선 보급 복구', detail: '운송망을 확인하십시오.', label: '확인', tab: 'army' }]} />);
    expect(html).toContain('보급로 단절');
    expect(html).not.toContain('오래된 결과');
    expect(html).toContain('왜 이런 결과가 나왔나');
    expect(html).toContain('긴급 1건');
    expect(html).toContain('전선 보급 복구');
    expect(html).toContain('읽음 처리는 결재·명령을 대신하지 않습니다');
  });

  it('keeps media art optional and collapsed while preserving the issue facts and explicit acknowledgment', () => {
    const issue: WorldWeeklyIssue = {
      id: 'archive-1942', week: 0, edition: 1, dateRange: '1942년 기록', worldlineCode: 'WL-TEST', worldlineTitle: '시험 세계선',
      media: getNewsMediaEra(1942), leadArticleId: 'lead',
      articles: [{ id: 'lead', category: 'intelligence', region: '국제면', headline: '미확인 첩보 원문', summary: '실제 정보망에 따른 평가',
        cause: '관측 자료 부족', consequence: '추가 확인 필요', confidence: 'rumor', priority: 90, tone: 'neutral', signals: [],
        actionTab: 'intelligence', actionLabel: '정보국 확인', sourceEventId: 71 }],
      metrics: { activeFronts: 0, battleCount: 0, territoryChanges: 0, treasuryChange: 0, relationAverage: 50, healthRisk: 0, eventCount: 1, intelligence: 30 },
      changePulse: { headline: '세계 변화', summary: '기록 요약', editorialTone: 'investigative', editorialLabel: '정보 검증', signals: [] },
    };
    const original = structuredClone(issue);
    const localCallbacks = { onAcknowledge: vi.fn(), onClose: vi.fn(), onJournal: vi.fn(), onNewspaper: vi.fn(), onActions: vi.fn() };
    const html = renderToStaticMarkup(<WeeklyBriefingDialog {...localCallbacks} week={6000} date="2060년 현재" events={[]} issue={issue} actions={[]} />);
    expect(html).toContain('<details class="weekly-media-disclosure">');
    expect(html).not.toContain('<details class="weekly-media-disclosure" open');
    expect(html).toContain('보도 매체 소개 · 활판 특별판');
    expect(html).toContain('editorial-media-art--compact');
    expect(html).toContain('data-media-art="press"');
    expect(html).not.toContain('data-media-art="digital"');
    expect(html).toContain('보도 환경 삽화 · 실제 사건 사진 아님');
    expect(html).toContain('<h4>미확인 첩보 원문</h4>');
    expect(html).toContain('실제 정보망에 따른 평가');
    expect(html).toContain('추가 확인 필요');
    expect(html).toContain('확인 완료 · 이번 주 업무로');
    expect(issue).toEqual(original);
    Object.values(localCallbacks).forEach((callback) => expect(callback).not.toHaveBeenCalled());
  });
});
