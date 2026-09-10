import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyBriefingDialog } from './WeeklyBriefingDialog';
import type { WarEvent } from './types';

const callbacks = { onAcknowledge: vi.fn(), onClose: vi.fn(), onJournal: vi.fn(), onNewspaper: vi.fn(), onActions: vi.fn() };
describe('unified weekly briefing', () => {
  it('offers explicit acknowledgment separately from dismissal on the first week', () => {
    const html = renderToStaticMarkup(<WeeklyBriefingDialog {...callbacks} week={0} date="1942년 10월 25일" events={[]} issue={null} actions={[]} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('취임 첫 주입니다');
    expect(html).toContain('브리핑 닫기, 읽음 처리하지 않음');
    expect(html).toContain('확인 완료 · 이번 주 업무로');
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
});
