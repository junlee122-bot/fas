import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProductionDesk, getProductionDeskInitialSelection, getProductionDeskSelectedLine, type ProductionDeskProps } from './ProductionDesk';

function fixture(): ProductionDeskProps {
  const stocks = { infantryEquipment: 100, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 };
  return {
    nationId: 'britain', week: 8, factories: 8, stockpile: stocks, weeklyGains: stocks,
    production: [
      { id: 'first', name: '첫 생산선', category: '장비', assigned: 1, efficiency: 50, output: 10, icon: 'rifle' },
      { id: 'requested', name: '약속 생산선', category: '장비', assigned: 2, efficiency: 70, output: 20, icon: 'rifle' },
    ], onAdjust: vi.fn(),
  };
}
const detail = (html: string) => html.match(/<article class="capability-detail"[\s\S]*?<\/article>/)?.[0] ?? '';

describe('delivery goal production navigation', () => {
  it('opens the exact non-first line without allocating or approving', () => {
    const props = fixture(); const before = JSON.stringify(props);
    const html = renderToStaticMarkup(<ProductionDesk {...props} initialRequest={{ nationId: 'britain', lineId: 'requested', sequence: 1 }} />);
    expect(detail(html)).toContain('<h3>약속 생산선</h3>');
    expect(detail(html)).not.toContain('<h3>첫 생산선</h3>');
    expect(html).not.toContain('배정 변경 승인');
    expect(props.onAdjust).not.toHaveBeenCalled(); expect(JSON.stringify(props)).toBe(before);
  });

  it.each(['missing', 'nation', 'duplicate'] as const)('does not substitute the first line for a %s request', change => {
    const props = fixture();
    if (change === 'duplicate') props.production.push({ ...props.production[1] });
    const html = renderToStaticMarkup(<ProductionDesk {...props} initialRequest={{ nationId: change === 'nation' ? 'usa' : 'britain', lineId: change === 'missing' ? 'removed' : 'requested' }} />);
    expect(detail(html)).toContain('다른 생산선을 대신 선택하지 않았습니다');
    expect(detail(html)).not.toContain('<h3>');
    expect(detail(html)).not.toContain('공장 1개 회수안');
    expect(props.onAdjust).not.toHaveBeenCalled();
  });

  it('keeps the existing generic entry default while stale selection stays empty', () => {
    const props = fixture();
    expect(getProductionDeskInitialSelection(props)).toBe('first');
    expect(getProductionDeskSelectedLine(props.production, 'requested')).toBe(props.production[1]);
    expect(getProductionDeskSelectedLine(props.production.slice(0, 1), 'requested')).toBeUndefined();
    expect(getProductionDeskSelectedLine(props.production, '')).toBeUndefined();
  });

  it('resets selection and any draft at a new nation or explicit navigation sequence', () => {
    const props = fixture(); const request = { nationId: 'britain', lineId: 'requested', sequence: 1 };
    const first = ProductionDesk({ ...props, initialRequest: request });
    expect(ProductionDesk({ ...props, initialRequest: { ...request } }).key).toBe(first.key);
    expect(ProductionDesk({ ...props, initialRequest: { ...request, sequence: 2 } }).key).not.toBe(first.key);
    expect(ProductionDesk({ ...props, nationId: 'usa', initialRequest: request }).key).not.toBe(first.key);
    expect(ProductionDesk(props).key).not.toBe(first.key);
  });
});
