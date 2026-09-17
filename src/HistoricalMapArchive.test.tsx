import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HistoricalMapArchive } from './HistoricalMapArchive';
import { MapControlCenter } from './MapControlCenter';
import { getDefaultMapRegion } from './mapRegions';

describe('independent archival reference viewer', () => {
  it.each(['europe', 'asia'] as const)('keeps %s sources distinct from the active campaign and commands', (theater) => {
    const html = renderToStaticMarkup(<HistoricalMapArchive theater={theater} campaignYear={1942} onClose={() => {}} />);
    expect(html).toContain('<dialog');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('캠페인 1942년');
    expect(html).toContain(theater === 'europe' ? '1944. 3. 20.' : '1943');
    expect(html).toContain('현재 게임 상태가 아닙니다.');
    expect(html).toContain('사료 닫고 작전 지도로 돌아가기');
    expect(html).not.toContain('territory-marker');
    expect(html).not.toContain('order-arrow');
    expect(html).toContain('원본 화질 보존');
  });

  it('provides a separate archive entry without making it a tactical layer', () => {
    const noop = () => {};
    const layer = { key: '', label: '거점 통제', description: '현재 캠페인 통제 상태' };
    const html = renderToStaticMarkup(<MapControlCenter activeTheater="europe" activeRegion={getDefaultMapRegion('europe')} regions={[]} cities={[]} selectedTerritoryId="britain" territoryCount={0} cityCount={0} frontCount={0} activeContactCount={0} campaignYear={1942} frontTimeline={[]} layer="political" layerMeta={{ political: layer, supply: layer, weather: layer, intelligence: layer, history: layer }} labelMode="essential" filtersOpen={false} legendOpen intelOpen={false} focusMode={false} onTheaterChange={noop} onRegionChange={noop} onCityChange={noop} onLayerChange={noop} onLabelModeChange={noop} onToggleFilters={noop} onToggleLegend={noop} onToggleIntel={noop} onToggleFocus={noop} onOpenArchive={noop} />);
    expect(html).toContain('aria-label="역사 지도 사료 열람"');
    expect(html).toContain('실제 도로·철도·국경선이 아닙니다.');
    expect(html).toContain('같은 경유점을 연결한 전략 회랑');
    expect(html).toContain('실제 위치와 기록된 항로');
    expect(html).toContain('정밀 항해도는 아닙니다.');
  });
});
