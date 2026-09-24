import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MapControlCenter } from './MapControlCenter';
import { getDefaultMapRegion, getMapRegionsForTheater } from './mapRegions';

function props(overrides: Partial<ComponentProps<typeof MapControlCenter>> = {}): ComponentProps<typeof MapControlCenter> {
  return {
    activeTheater: 'europe', activeRegion: getDefaultMapRegion('europe'), regions: getMapRegionsForTheater('europe'),
    cities: [{ id: 'normandy', name: '노르망디', region: '서유럽', x: 20, y: 20, controller: 'axis', value: 8, supply: 70, terrain: '평야', neighbors: [] }],
    selectedTerritoryId: 'normandy', territoryCount: 30, cityCount: 12, frontCount: 4, activeContactCount: 2,
    campaignYear: 1944, frontTimeline: [], layer: 'political',
    layerMeta: {
      political: { key: '1', label: '정치·통제', description: '통제 지역을 표시합니다.' },
      supply: { key: '2', label: '보급망', description: '보급 상태를 표시합니다.' },
      weather: { key: '3', label: '기상', description: '기상을 표시합니다.' },
      intelligence: { key: '4', label: '정보 신뢰도', description: '확인과 추정을 구분합니다.' },
      history: { key: '5', label: '캠페인 변화', description: '시작 이후 변화를 표시합니다.' },
    },
    labelMode: 'essential', filtersOpen: false, legendOpen: false, intelOpen: false, focusMode: false,
    onTheaterChange: vi.fn(), onRegionChange: vi.fn(), onCityChange: vi.fn(), onLayerChange: vi.fn(),
    onLabelModeChange: vi.fn(), onToggleFilters: vi.fn(), onToggleLegend: vi.fn(), onToggleIntel: vi.fn(), onToggleFocus: vi.fn(),
    ...overrides,
  };
}

describe('MapControlCenter', () => {
  it('keeps named layer and tool controls in a compact default header', () => {
    const html = renderToStaticMarkup(<MapControlCenter {...props()} />);
    expect(html).toContain('class="map-command-edition"');
    for (const label of ['통제 레이어', '보급 레이어', '기상 레이어', '정보 레이어', '변화 레이어', '지역·도시 찾기', '지도 범례 열기', '전구 정보 패널', '지도 집중 모드 시작']) {
      expect(html).toContain(`aria-label="${label}"`);
    }
    expect(html).toContain('육상 접촉 전선군 2');
    expect(html).toContain('해상 접촉 구역 0');
    expect(html).not.toContain('교전 중');
    expect(html).not.toContain('<section id="map-navigation-drawer"');
    expect(html).not.toContain('<section id="map-legend-panel"');
  });

  it('shows labeled search, scoped destinations and explicit close control', () => {
    const html = renderToStaticMarkup(<MapControlCenter {...props({ filtersOpen: true })} />);
    expect(html).toContain('for="map-destination-query"');
    expect(html).toContain('aria-describedby="map-search-scope map-search-count"');
    expect(html).toContain('for="map-region-search"');
    expect(html).toContain('for="map-city-search"');
    expect(html).toContain('도시는 전체 작전도 안에서 찾습니다.');
    expect(html).toContain('value="normandy" selected=""');
    expect(html).toContain('aria-label="지역·도시 탐색 닫기"');
    expect(html).toContain('aria-label="지도 표식 밀도"');
  });

  it('provides an honest contextual legend while showing only one expanded panel', () => {
    const html = renderToStaticMarkup(<MapControlCenter {...props({ legendOpen: true, layer: 'history' })} />);
    expect(html).toContain('캠페인 이후 변화');
    expect(html).toContain('진행 중인 전투를 뜻하지 않습니다.');
    expect(html).toContain('기록 시기는 전투 발생을 보장하지 않습니다.');
    expect(html).toContain('aria-label="지도 범례 닫기"');
    const both = renderToStaticMarkup(<MapControlCenter {...props({ filtersOpen: true, legendOpen: true })} />);
    expect(both).toContain('<section id="map-navigation-drawer"');
    expect(both).not.toContain('<section id="map-legend-panel"');
  });

  it('disables an empty destination list and exposes the focus exit action', () => {
    const html = renderToStaticMarkup(<MapControlCenter {...props({ filtersOpen: true, cities: [], focusMode: true })} />);
    expect(html).toContain('<select id="map-city-search" disabled=""');
    expect(html).toContain('일치하는 도시·거점 없음');
    expect(html).toContain('aria-label="지도 집중 모드 종료"');
  });
});
