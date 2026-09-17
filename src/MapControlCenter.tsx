import { useRef, useState } from 'react';
import { CalendarClock, CloudRain, Eye, GitBranch, Info, Layers3, ListFilter, Map, Maximize2, Minimize2, PanelRightOpen, Search, Shield, SlidersHorizontal, Tags, X } from 'lucide-react';
import { filterMapDestinations } from './mapNavigation';
import type { StrategicMapRegionDefinition } from './mapRegions';
import type { MapLabelMode } from './mapPresentation';
import type { StrategicFrontChronologyEntry } from './strategicMapData';
import type { MapLayer, TheaterId, Territory } from './types';

const mapLayerOptions: Array<{ id: MapLayer; label: string; shortcut: string; icon: typeof Map }> = [
  { id: 'political', label: '통제', shortcut: '1', icon: Map },
  { id: 'supply', label: '보급', shortcut: '2', icon: Shield },
  { id: 'weather', label: '기상', shortcut: '3', icon: CloudRain },
  { id: 'intelligence', label: '정보', shortcut: '4', icon: Eye },
  { id: 'history', label: '변화', shortcut: '5', icon: GitBranch },
];

const labelModeOptions: Array<{ id: MapLabelMode; label: string; description: string }> = [
  { id: 'essential', label: '핵심', description: '수도·부대·선택 지역' },
  { id: 'operational', label: '작전', description: '전선과 주요 거점' },
  { id: 'all', label: '전체', description: '확대할수록 지명 추가' },
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
  /** Number of front groups with hostile contacts, not ongoing battles. */
  activeContactCount: number;
  seaContactCount?: number;
  campaignYear: number;
  frontTimeline: StrategicFrontChronologyEntry[];
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
  onOpenArchive?: () => void;
}

export function MapControlCenter({
  activeTheater, activeRegion, regions, cities, selectedTerritoryId,
  territoryCount, cityCount, frontCount, activeContactCount, seaContactCount = 0, campaignYear,
  frontTimeline, layer, layerMeta, labelMode, filtersOpen, legendOpen, intelOpen,
  focusMode, onTheaterChange, onRegionChange, onCityChange, onLayerChange,
  onLabelModeChange, onToggleFilters, onToggleLegend, onToggleIntel, onToggleFocus, onOpenArchive,
}: MapControlCenterProps) {
  const [search, setSearch] = useState('');
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const legendToggleRef = useRef<HTMLButtonElement>(null);
  const destinations = filterMapDestinations(regions, cities, search);
  const visibleFrontCount = frontTimeline.filter((front) => front.visible).length;
  const alternateFrontCount = frontTimeline.filter((front) => front.state === 'diverged-early' || front.state === 'alternate-continuation').length;
  const scheduledFronts = frontTimeline.filter((front) => front.state === 'scheduled');
  const nextFront = scheduledFronts.reduce<StrategicFrontChronologyEntry | undefined>((next, front) => !next || front.startYear < next.startYear ? front : next, undefined);
  const postwarMap = frontTimeline.length > 0 && frontTimeline.every((front) => front.state === 'postwar-legacy');
  const legendVisible = legendOpen && !filtersOpen;
  const selectedCity = destinations.cities.some((city) => city.id === selectedTerritoryId) ? selectedTerritoryId : '';
  const selectedRegion = destinations.regions.some((region) => region.id === activeRegion.id) ? activeRegion.id : '';

  function changeTheater(theater: TheaterId) {
    setSearch('');
    onTheaterChange(theater);
  }

  function closeSearch() {
    onToggleFilters();
    searchToggleRef.current?.focus();
  }

  function closeLegend() {
    onToggleLegend();
    legendToggleRef.current?.focus();
  }

  function chooseDestination(value: string, navigate: (id: string) => void) {
    if (!value) return;
    setSearch('');
    navigate(value);
    closeSearch();
  }

  return (
    <header className="map-command-edition" aria-label="지도 탐색과 표시 설정">
      <div className="map-edition-heading">
        <div className="map-edition-title">
          <div className="map-edition-context"><span><CalendarClock size={14} aria-hidden="true" />{campaignYear}년</span><span>{activeTheater === 'europe' ? '유럽·지중해 전구' : '아시아·태평양 전구'}</span><span className="map-edition-contact" title="육상으로 이어진 적대 거점이 있는 전선군 수입니다. 진행 중인 전투 건수가 아닙니다.">육상 접촉 전선군 {activeContactCount}</span><span title="해역·바다 횡단 연결에 적대 거점이 있는 전선군 수. 육상 전선과 별도로 집계합니다.">해상 접촉 구역 {seaContactCount}</span></div>
          <h1>{activeRegion.name}</h1>
        </div>
        <div className="map-edition-actions" role="group" aria-label="지도 화면 도구">
          {onOpenArchive ? <button type="button" onClick={onOpenArchive} aria-label="역사 지도 사료 열람"><Map size={17} aria-hidden="true" /><span>사료 원본</span></button> : null}
          <button ref={searchToggleRef} type="button" aria-label="지역·도시 찾기" className={filtersOpen ? 'active' : ''} aria-expanded={filtersOpen} aria-controls="map-navigation-drawer" onClick={onToggleFilters}><SlidersHorizontal size={17} aria-hidden="true" /><span>지역 찾기</span></button>
          <button ref={legendToggleRef} type="button" aria-label={legendVisible ? '지도 범례 접기' : '지도 범례 열기'} className={legendVisible ? 'active' : ''} aria-expanded={legendVisible} aria-controls="map-legend-panel" onClick={onToggleLegend}><ListFilter size={17} aria-hidden="true" /><span>범례</span></button>
          <button type="button" aria-label="전구 정보 패널" className={intelOpen ? 'active' : ''} aria-pressed={intelOpen} aria-keyshortcuts="I" title="전구 정보 패널 · I" onClick={onToggleIntel}><PanelRightOpen size={17} aria-hidden="true" /><span>전구 정보</span></button>
          <button type="button" aria-label={focusMode ? '지도 집중 모드 종료' : '지도 집중 모드 시작'} className={focusMode ? 'active' : ''} aria-pressed={focusMode} aria-keyshortcuts="F" title="지도 집중 모드 · F" onClick={onToggleFocus}>{focusMode ? <Minimize2 size={17} aria-hidden="true" /> : <Maximize2 size={17} aria-hidden="true" />}<span>{focusMode ? '집중 종료' : '집중 모드'}</span></button>
        </div>
      </div>

      <nav className="map-edition-layers" aria-label="지도 정보 레이어">
        <div role="group" aria-label="정보 레이어 선택">
          {mapLayerOptions.map((option) => {
            const Icon = option.icon;
            return <button type="button" key={option.id} aria-label={`${option.label} 레이어`} aria-pressed={layer === option.id} aria-keyshortcuts={option.shortcut} title={`${layerMeta[option.id].label} · ${option.shortcut}`} className={layer === option.id ? 'active' : ''} onClick={() => onLayerChange(option.id)}><Icon size={16} aria-hidden="true" /><span>{option.label}</span><kbd aria-hidden="true">{option.shortcut}</kbd></button>;
          })}
        </div>
        <p aria-live="polite"><strong>{layerMeta[layer].label}</strong><span>{layerMeta[layer].description}</span></p>
      </nav>

      {filtersOpen ? (
        <section id="map-navigation-drawer" className="map-edition-drawer" aria-label="지역·도시 탐색" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); closeSearch(); } }}>
          <div className="map-edition-drawer-heading"><h2><Search size={17} aria-hidden="true" />지역·도시 찾기</h2><button type="button" className="map-edition-close" aria-label="지역·도시 탐색 닫기" onClick={closeSearch}><X size={17} aria-hidden="true" /></button></div>
          <div className="map-edition-theaters" role="group" aria-label="전구 선택"><span><Layers3 size={16} aria-hidden="true" />전구</span><button type="button" aria-pressed={activeTheater === 'europe'} className={activeTheater === 'europe' ? 'active' : ''} onClick={() => changeTheater('europe')}>유럽·지중해</button><button type="button" aria-pressed={activeTheater === 'asia'} className={activeTheater === 'asia' ? 'active' : ''} onClick={() => changeTheater('asia')}>아시아·태평양</button></div>
          <div className="map-edition-search">
            <label htmlFor="map-destination-query">지역·도시 이름 검색</label>
            <div><input id="map-destination-query" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="예: 서유럽, 노르망디" aria-describedby="map-search-scope map-search-count" autoComplete="off" />{search ? <button type="button" aria-label="지도 검색어 지우기" onClick={() => setSearch('')}><X size={16} aria-hidden="true" /></button> : null}</div>
            <p id="map-search-scope">작전구는 현재 전구 전체, 도시는 {activeRegion.shortName} 작전도 안에서 찾습니다.</p>
            <p id="map-search-count" role="status">작전구 {destinations.regions.length}개 · 도시·거점 {destinations.cities.length}개{destinations.regions.length + destinations.cities.length === 0 ? ' — 검색어를 바꾸거나 다른 전구를 선택하세요.' : ''}</p>
          </div>
          <div className="map-edition-destinations">
            <label htmlFor="map-region-search"><span>작전구 이동</span><select id="map-region-search" value={selectedRegion} disabled={destinations.regions.length === 0} onChange={(event) => chooseDestination(event.target.value, onRegionChange)}><option value="">{destinations.regions.length ? '작전구를 선택하세요' : '일치하는 작전구 없음'}</option>{destinations.regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
            <label htmlFor="map-city-search"><span>도시·거점으로 이동</span><select id="map-city-search" value={selectedCity} disabled={destinations.cities.length === 0} onChange={(event) => chooseDestination(event.target.value, onCityChange)}><option value="">{destinations.cities.length ? '도시·거점을 선택하세요' : '일치하는 도시·거점 없음'}</option>{destinations.cities.map((city) => <option key={city.id} value={city.id}>{city.name} · {city.region}</option>)}</select></label>
          </div>
          <div className="map-edition-density" role="group" aria-label="지도 표식 밀도" aria-keyshortcuts="L"><span><Tags size={16} aria-hidden="true" />표식 밀도</span><div>{labelModeOptions.map((option) => <button type="button" key={option.id} className={labelMode === option.id ? 'active' : ''} aria-pressed={labelMode === option.id} aria-label={`${option.label} 표식: ${option.description}`} onClick={() => onLabelModeChange(option.id)}><strong>{option.label}</strong><small>{option.description}</small></button>)}</div></div>
          <p className="map-edition-region-summary">현재 작전도: 지역 {territoryCount} · 도시·항구 {cityCount} · 전선군 {frontCount}</p>
        </section>
      ) : null}

      {legendVisible ? (
        <section id="map-legend-panel" className="map-edition-drawer map-edition-legend" aria-label="지도 범례와 기록 안내" onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); closeLegend(); } }}>
          <div className="map-edition-drawer-heading"><h2><Info size={17} aria-hidden="true" />지도 읽는 법</h2><button type="button" className="map-edition-close" aria-label="지도 범례 닫기" onClick={closeLegend}><X size={17} aria-hidden="true" /></button></div>
          <p className="map-edition-legend-description"><strong>{layerMeta[layer].label}</strong> · {layerMeta[layer].description}</p>
          <ul className="map-edition-symbols"><li><i className="allies" />연합국 통제</li><li><i className="axis" />추축국 통제</li><li><i className="neutral" />중립국 통제</li><li><i className="contact" />육상 적 접촉선</li><li><i className="sea-route" />해상 연결·횡단 경로</li><li><i className="route" />선택 지역 연결</li><li><i className="selected" />선택 지역</li>{layer === 'history' ? <li><i className="history" />캠페인 이후 변화</li> : null}</ul>
          <p>적 접촉은 서로 적대하는 통제 지역이 맞닿았다는 뜻이며, 진행 중인 전투를 뜻하지 않습니다.</p>
          <p>해안선·하천·호수는 실제 지리 자료입니다. 색 표식은 거점 통제이며 국가 영토 전체를 뜻하지 않습니다. 육상 연결선과 공세 화살표는 전략적 관계·명령 방향이며 실제 도로·철도·국경선이 아닙니다.</p>
          <p>해상 점선은 이동·거리 계산과 같은 경유점을 연결한 전략 회랑입니다. 함선 표식을 누르면 해당 함대의 실제 위치와 기록된 항로를 봅니다. 옅은 접근선은 도시와 대표 항구의 관계이며 항해 구간이 아닙니다. 정밀 항해도는 아닙니다.</p>
          <p>청록색 해상 연결은 육군의 직접 이동·공세 경로가 아닙니다. 해역 우세와 호송은 해공군 계획에서 확인하며, 상륙 엄호만으로 육군이 이동하거나 점령하지 않습니다.</p>
          <p>휠·확대 버튼으로 확대하고 빈 지도를 끌어 이동합니다. 지역을 선택하면 상세 정보와 가능한 명령을 확인할 수 있습니다.</p>
          <details className="map-edition-chronology"><summary>{campaignYear}년 역사 전선 기록 {postwarMap ? '· 전시 기록 보관' : `· 표시 ${visibleFrontCount}개`}</summary><p>역사 이탈 {alternateFrontCount}개 · 아직 미형성 {scheduledFronts.length}개</p>{nextFront ? <p>다음 기록 시기: {nextFront.name} · {nextFront.startYear}년</p> : null}<p>사료상 전선 시기와 현재 게임의 통제·명령은 다릅니다. 기록 시기는 전투 발생을 보장하지 않습니다.</p></details>
        </section>
      ) : null}
    </header>
  );
}
