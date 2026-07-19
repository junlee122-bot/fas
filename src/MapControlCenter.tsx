import {
  CloudRain,
  Eye,
  Info,
  Layers3,
  ListFilter,
  Map,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  Search,
  Shield,
  SlidersHorizontal,
  Tags,
} from 'lucide-react';
import type { StrategicMapRegionDefinition } from './mapRegions';
import type { MapLabelMode } from './mapPresentation';
import type { MapLayer, TheaterId, Territory } from './types';

const mapLayerOptions: Array<{ id: MapLayer; label: string; shortcut: string; icon: typeof Map }> = [
  { id: 'political', label: '정치', shortcut: '1', icon: Map },
  { id: 'supply', label: '보급', shortcut: '2', icon: Shield },
  { id: 'weather', label: '기상', shortcut: '3', icon: CloudRain },
  { id: 'intelligence', label: '정보', shortcut: '4', icon: Eye },
];

const labelModeOptions: Array<{ id: MapLabelMode; label: string; description: string }> = [
  { id: 'essential', label: '핵심', description: '수도·부대·선택 지역' },
  { id: 'operational', label: '작전', description: '전선과 1급 거점' },
  { id: 'all', label: '전체', description: '확대 단계별 모든 지명' },
];

interface MapControlCenterProps {
  activeTheater: TheaterId;
  activeRegion: StrategicMapRegionDefinition;
  regions: StrategicMapRegionDefinition[];
  cities: Territory[];
  selectedTerritoryId: string;
  territoryCount: number;
  cityCount: number;
  frontCount: number;
  activeContactCount: number;
  layer: MapLayer;
  layerMeta: Record<MapLayer, { key: string; label: string; description: string }>;
  labelMode: MapLabelMode;
  filtersOpen: boolean;
  legendOpen: boolean;
  intelOpen: boolean;
  focusMode: boolean;
  onTheaterChange: (theater: TheaterId) => void;
  onRegionChange: (regionId: string) => void;
  onCityChange: (territoryId: string) => void;
  onLayerChange: (layer: MapLayer) => void;
  onLabelModeChange: (mode: MapLabelMode) => void;
  onToggleFilters: () => void;
  onToggleLegend: () => void;
  onToggleIntel: () => void;
  onToggleFocus: () => void;
}

export function MapControlCenter({
  activeTheater,
  activeRegion,
  regions,
  cities,
  selectedTerritoryId,
  territoryCount,
  cityCount,
  frontCount,
  activeContactCount,
  layer,
  layerMeta,
  labelMode,
  filtersOpen,
  legendOpen,
  intelOpen,
  focusMode,
  onTheaterChange,
  onRegionChange,
  onCityChange,
  onLayerChange,
  onLabelModeChange,
  onToggleFilters,
  onToggleLegend,
  onToggleIntel,
  onToggleFocus,
}: MapControlCenterProps) {
  return (
    <>
      <header className={`map-command-center${filtersOpen ? ' filters-open' : ''}${legendOpen ? ' legend-open' : ''}`}>
        <div className="map-command-summary">
          <div className="map-command-title">
            <span>REGIONAL OPERATIONS MAP</span>
            <div><h1>{activeRegion.name}</h1><em>{activeContactCount}개 교전 중</em></div>
            <p>{activeRegion.subtitle}</p>
          </div>
          <div className="map-command-actions" role="group" aria-label="지도 화면 도구">
            <button type="button" className={filtersOpen ? 'active' : ''} aria-expanded={filtersOpen} aria-controls="map-navigation-drawer" onClick={onToggleFilters}>
              <SlidersHorizontal size={15} /><span>지역·표식</span>
            </button>
            <button type="button" className={legendOpen ? 'active' : ''} aria-expanded={legendOpen} aria-controls="map-legend-panel" onClick={onToggleLegend}>
              <ListFilter size={15} /><span>범례</span>
            </button>
            <button type="button" className={intelOpen ? 'active' : ''} aria-pressed={intelOpen} aria-keyshortcuts="I" title="전구 정보 패널 · I" onClick={onToggleIntel}>
              <PanelRightOpen size={15} /><span>전구 정보</span>
            </button>
            <button type="button" className={focusMode ? 'active' : ''} aria-pressed={focusMode} aria-keyshortcuts="F" title="지도 집중 모드 · F" onClick={onToggleFocus}>
              {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}<span>{focusMode ? '집중 종료' : '집중 모드'}</span>
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div id="map-navigation-drawer" className="map-navigation-drawer">
            <div className="map-navigation-row map-theater-row">
              <span><Layers3 size={13} /> 전구</span>
              <div role="group" aria-label="전구 선택">
                <button type="button" aria-pressed={activeTheater === 'europe'} className={activeTheater === 'europe' ? 'active' : ''} onClick={() => onTheaterChange('europe')}>유럽·지중해</button>
                <button type="button" aria-pressed={activeTheater === 'asia'} className={activeTheater === 'asia' ? 'active' : ''} onClick={() => onTheaterChange('asia')}>아시아·태평양</button>
              </div>
            </div>
            <div className="map-navigation-row map-region-row">
              <span><Map size={13} /> 작전도</span>
              <div role="group" aria-label="지역 작전도 선택">
                {regions.map((region) => (
                  <button type="button" key={region.id} className={activeRegion.id === region.id ? 'active' : ''} aria-pressed={activeRegion.id === region.id} onClick={() => onRegionChange(region.id)} title={region.subtitle}>
                    {region.shortName}
                  </button>
                ))}
              </div>
            </div>
            <div className="map-navigation-row map-search-row">
              <label htmlFor="map-city-search"><Search size={13} /> 도시·거점</label>
              <select id="map-city-search" value={cities.some((territory) => territory.id === selectedTerritoryId) ? selectedTerritoryId : ''} onChange={(event) => event.target.value && onCityChange(event.target.value)}>
                <option value="">당시 지명으로 바로 이동</option>
                {cities.map((territory) => <option key={territory.id} value={territory.id}>{territory.name} · {territory.region}</option>)}
              </select>
            </div>
            <div className="map-navigation-row map-label-row">
              <span><Tags size={13} /> 지도 표식</span>
              <div role="group" aria-label="지도 표식 밀도" aria-keyshortcuts="L">
                {labelModeOptions.map((option) => (
                  <button type="button" key={option.id} className={labelMode === option.id ? 'active' : ''} aria-pressed={labelMode === option.id} title={option.description} onClick={() => onLabelModeChange(option.id)}>
                    <strong>{option.label}</strong><small>{option.description}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="map-density-summary" aria-label="현재 지역 지도 요약">
              <span><strong>{territoryCount}</strong> 작전구</span>
              <span><strong>{cityCount}</strong> 도시·항구</span>
              <span><strong>{frontCount}</strong> 전선군</span>
              <span className={activeContactCount > 0 ? 'danger' : ''}><strong>{activeContactCount}</strong> 교전</span>
            </div>
          </div>
        )}

        {legendOpen && (
          <div id="map-legend-panel" className="map-legend-panel">
            <header><Info size={14} /><strong>지도 읽는 법</strong><span>선택한 항목만 금색으로 강조됩니다.</span></header>
            <div>
              <span><i className="dot allies" /> 연합국</span>
              <span><i className="dot axis" /> 추축국</span>
              <span><i className="dot neutral" /> 중립국</span>
              <span><i className="front-symbol" /> 적 접촉선</span>
              <span><i className="route-symbol" /> 선택 지역 연결</span>
            </div>
            <p>휠로 확대하고 빈 지도를 드래그해 이동합니다. 지역을 선택하면 하단 카드에서 보급·전선 접촉·주둔 전력을 확인할 수 있습니다.</p>
          </div>
        )}
      </header>

      <nav className="map-layer-dock" aria-label="지도 정보 레이어">
        <div role="group" aria-label="정보 레이어 선택">
          {mapLayerOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button type="button" key={option.id} aria-pressed={layer === option.id} aria-keyshortcuts={option.shortcut} title={`${option.label} 레이어 · ${option.shortcut}`} className={layer === option.id ? 'active' : ''} onClick={() => onLayerChange(option.id)}>
                <Icon size={15} /><span>{option.label}</span><kbd>{option.shortcut}</kbd>
              </button>
            );
          })}
        </div>
        <p aria-live="polite"><strong>{layerMeta[layer].key} · {layerMeta[layer].label}</strong><span>{layerMeta[layer].description}</span></p>
      </nav>
    </>
  );
}
