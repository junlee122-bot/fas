import { getGeographicMapPlacement } from './geographicMap';
import { projectGeographicPoint } from './geographicProjection';
import { getTerritoryGeography } from './territoryGeography';
import type { HistoricalMapFrameId } from './historicalMaps';
import { clampMapCamera } from './mapPresentation';
import type { MapCamera } from './mapPresentation';
import type { Territory, TheaterId } from './types';

export interface StrategicMapRegionDefinition {
  id: string;
  theater: TheaterId;
  frameId: HistoricalMapFrameId | 'all';
  name: string;
  shortName: string;
  subtitle: string;
  camera: MapCamera;
  overview?: boolean;
  /** Optional semantic membership for a detail view inside a composite sheet. */
  territoryIds?: readonly string[];
  /** Real geographic coverage; membership is independent of archive inset pixels. */
  geographicArea?: { west: number; east: number; north: number; south: number };
}

const mapRegionDefinitions: Omit<StrategicMapRegionDefinition, 'camera'>[] = [
  { id: 'europe-overview', theater: 'europe', frameId: 'all', name: '유럽·지중해 전구 전체', shortName: '전체', subtitle: '북대서양에서 페르시아 회랑까지', overview: true },
  { id: 'north-atlantic', theater: 'europe', frameId: 'main', name: '북대서양·영국 본토', shortName: '북대서양', subtitle: '스캐파플로·서부접근로·북극 수송선' },
  { id: 'western-europe', theater: 'europe', frameId: 'main', name: '서유럽·대서양 방벽', shortName: '서유럽', subtitle: '영불해협·노르망디·저지대·라인란트' },
  { id: 'biscay-iberia', theater: 'europe', frameId: 'main', name: '비스케이만·이베리아 접근로', shortName: '비스케이', subtitle: '브레스트·보르도·서부 지중해 접근로' },
  { id: 'eastern-front-north', theater: 'europe', frameId: 'main', name: '동부전선 북부', shortName: '동부 북부', subtitle: '레닌그라드·르제프·모스크바 방면' },
  { id: 'eastern-front-center', theater: 'europe', frameId: 'main', name: '동부전선 중앙 돌출부', shortName: '동부 중앙', subtitle: '스몰렌스크·르제프·오룔·쿠르스크 철도축' },
  { id: 'eastern-front-south', theater: 'europe', frameId: 'main', name: '동부전선 남부', shortName: '동부 남부', subtitle: '쿠르스크·돈바스·스탈린그라드·캅카스' },
  { id: 'central-mediterranean', theater: 'europe', frameId: 'main', name: '중부유럽·지중해', shortName: '중부·지중해', subtitle: '이탈리아·발칸·시칠리아·에게해' },
  { id: 'italy-adriatic', theater: 'europe', frameId: 'main', name: '이탈리아·아드리아해 작전구', shortName: '이탈리아', subtitle: '시칠리아·칼라브리아·로마·아드리아 유격전' },
  { id: 'africa-middle-east', theater: 'europe', frameId: 'main', name: '북아프리카·중동', shortName: '아프리카·중동', subtitle: '횃불작전 상륙지에서 수에즈·페르시아 회랑까지' },
  { id: 'egypt-levant', theater: 'europe', frameId: 'main', name: '이집트·레반트·페르시아 회랑', shortName: '수에즈·중동', subtitle: '엘알라메인·수에즈·다마스쿠스·바그다드 보급축' },

  { id: 'asia-overview', theater: 'asia', frameId: 'all', name: '아시아·태평양 전구 전체', shortName: '전체', subtitle: '인도양에서 북태평양·솔로몬 제도까지', overview: true },
  { id: 'india-burma', theater: 'asia', frameId: 'main', name: '인도·버마 작전구', shortName: '인도·버마', subtitle: '벵골·임팔·코히마·버마로드·이라와디' },
  { id: 'assam-arakan', theater: 'asia', frameId: 'main', name: '아삼·임팔·아라칸 작전구', shortName: '아삼·아라칸', subtitle: '치타공·디마푸르·코히마·임팔·아키아브' },
  { id: 'china-korea', theater: 'asia', frameId: 'main', name: '중국·만주·한반도', shortName: '중국·한반도', subtitle: '화북·양쯔강·윈난·만주 철도망·조선' },
  { id: 'china-heartland', theater: 'asia', frameId: 'main', name: '중국 중원·양쯔강 작전구', shortName: '중국 중원', subtitle: '정저우·우한·창사·난창·충칭의 전구 경계' },
  { id: 'manchuria-korea-detail', theater: 'asia', frameId: 'main', name: '남만주·조선 철도전구', shortName: '만주·조선', subtitle: '신징·다이렌·신의주·평양·경성·부산' },
  { id: 'southeast-asia', theater: 'asia', frameId: 'main', name: '동남아시아·동인도', shortName: '동남아·동인도', subtitle: '인도차이나·말라야·수마트라·자바·보르네오' },
  { id: 'japan-philippines', theater: 'asia', frameId: 'main', name: '일본 본토·필리핀', shortName: '일본·필리핀', subtitle: '본토 산업축·류큐·루손·비사야·민다나오' },
  { id: 'southwest-pacific', theater: 'asia', frameId: 'main', name: '남서태평양', shortName: '남서태평양', subtitle: '뉴기니·비스마르크·솔로몬·호주 병참선' },
  { id: 'central-north-pacific', theater: 'asia', frameId: 'pacific-inset', name: '중부·북태평양', shortName: '중부·북태평양', subtitle: '태평양 부도 · 길버트·마셜·캐롤라인·마리아나·알류샨' },
  { id: 'marianas-carolines', theater: 'asia', frameId: 'pacific-inset', name: '마리아나·캐롤라인 도서전구', shortName: '마리아나', subtitle: '태평양 부도 · 사이판·괌·트루크·팔라우·마셜 접근로', territoryIds: ['saipan', 'guam', 'truk', 'palau', 'marshalls', 'kwajalein', 'eniwetok'] },
];

export function getMapRegionCamera(region: StrategicMapRegionDefinition): MapCamera {
  if (region.geographicArea) {
    const { west, east, north, south } = region.geographicArea;
    const topLeft = projectGeographicPoint(region.theater, { latitude: north, longitude: west });
    const bottomRight = projectGeographicPoint(region.theater, { latitude: south, longitude: east });
    return clampMapCamera({
      centerX: (topLeft.x + bottomRight.x) / 2,
      centerY: (topLeft.y + bottomRight.y) / 2,
      zoom: Math.min(1200 / (bottomRight.x - topLeft.x + 64), 760 / (bottomRight.y - topLeft.y + 64)),
    });
  }
  return clampMapCamera(region.camera);
}

// Stable region IDs are retained; play-map cameras are derived from degrees.
const regionGeography: Record<string, [number, number, number, number]> = {
  'north-atlantic': [-25, 12, 69, 47],
  'western-europe': [-7, 15, 55, 43],
  'biscay-iberia': [-12, 6, 50, 34],
  'eastern-front-north': [19, 43, 65, 53],
  'eastern-front-center': [25, 42, 59, 49],
  'eastern-front-south': [25, 52, 53, 39],
  'central-mediterranean': [5, 31, 49, 32],
  'italy-adriatic': [7, 21, 47, 35],
  'africa-middle-east': [-10, 56, 39, 24],
  'egypt-levant': [24, 53, 38, 25],
  'india-burma': [66, 101, 33, 5],
  'assam-arakan': [88, 98, 29, 18],
  'china-korea': [94, 134, 51, 18],
  'china-heartland': [102, 120, 37, 23],
  'manchuria-korea-detail': [118, 134, 48, 33],
  'southeast-asia': [94, 123, 24, -10],
  'japan-philippines': [117, 143, 46, 5],
  'southwest-pacific': [128, 170, 2, -29],
  'central-north-pacific': [140, 208, 58, -3],
  'marianas-carolines': [132, 174, 19, 4],
};

// Region lists, initial focus and the reset button share this same valid camera.
export const strategicMapRegions: StrategicMapRegionDefinition[] = mapRegionDefinitions.map((region) => {
  const area = regionGeography[region.id];
  const geographicRegion: StrategicMapRegionDefinition = {
    ...region,
    camera: { centerX: 600, centerY: 380, zoom: 1 },
    ...(region.id === 'manchuria-korea-detail' ? { territoryIds: ['manchuria', 'harbin', 'xinjing', 'dalian', 'korea', 'busan', 'sinuiju', 'pyongyang', 'soviet_far_east'] } : {}),
    frameId: region.overview ? 'all' : 'main',
    subtitle: region.subtitle.replace('태평양 부도 · ', ''),
    ...(area ? { geographicArea: { west: area[0], east: area[1], north: area[2], south: area[3] } } : {}),
  };
  return { ...geographicRegion, camera: getMapRegionCamera(geographicRegion) };
});

export function getDefaultMapRegion(theater: TheaterId): StrategicMapRegionDefinition {
  return strategicMapRegions.find((region) => region.theater === theater && region.overview)
    ?? strategicMapRegions.find((region) => region.theater === theater)
    ?? strategicMapRegions[0];
}

export function getMapRegion(regionId: string | undefined, theater: TheaterId): StrategicMapRegionDefinition {
  return strategicMapRegions.find((region) => region.id === regionId && region.theater === theater)
    ?? getDefaultMapRegion(theater);
}

export function getMapRegionsForTheater(theater: TheaterId): StrategicMapRegionDefinition[] {
  return strategicMapRegions.filter((region) => region.theater === theater);
}

export function getMapRegionForTerritory(
  territories: Territory[],
  territoryId: string,
  theater: TheaterId,
): StrategicMapRegionDefinition {
  const territory = territories.find((candidate) => candidate.id === territoryId);
  if (!territory) return getDefaultMapRegion(theater);
  const point = getGeographicMapPlacement(theater, territory);
  if (!point) return getDefaultMapRegion(theater);
  return getMapRegionsForTheater(theater)
    .filter((candidate) => !candidate.overview && getTerritoriesForMapRegion([territory], candidate).length > 0)
    .sort((a, b) => {
      const specificity = Number(Boolean(b.territoryIds)) - Number(Boolean(a.territoryIds));
      if (specificity) return specificity;
      const normalizedDistance = (candidate: StrategicMapRegionDefinition) => {
        const camera = getMapRegionCamera(candidate);
        return Math.hypot(
          (point.x - camera.centerX) / (600 / camera.zoom),
          (point.y - camera.centerY) / (380 / camera.zoom),
        );
      };
      const distanceDifference = normalizedDistance(a) - normalizedDistance(b);
      if (Math.abs(distanceDifference) > .08) return distanceDifference;
      return b.camera.zoom - a.camera.zoom;
    })[0]
    ?? getDefaultMapRegion(theater);
}

export function getTerritoriesForMapRegion(
  territories: Territory[],
  region: StrategicMapRegionDefinition,
): Territory[] {
  const theaterTerritories = territories.filter((territory) => (territory.theater ?? 'europe') === region.theater);
  if (region.overview) return theaterTerritories;
  const camera = getMapRegionCamera(region);
  const halfWidth = 600 / camera.zoom;
  const halfHeight = 380 / camera.zoom;
  return theaterTerritories.filter((territory) => {
    const point = getGeographicMapPlacement(region.theater, territory);
    if (!point) return false;
    if (region.frameId !== 'all' && point.frame !== region.frameId) return false;
    if (region.territoryIds && !region.territoryIds.includes(territory.id)) return false;
    if (region.geographicArea) {
      const coordinate = getTerritoryGeography(territory.id)!;
      const longitude = region.theater === 'asia' && coordinate.longitude < 60 ? coordinate.longitude + 360 : coordinate.longitude;
      const { west, east, north, south } = region.geographicArea;
      return longitude >= west && longitude <= east && coordinate.latitude <= north && coordinate.latitude >= south;
    }
    return point.x >= camera.centerX - halfWidth
      && point.x <= camera.centerX + halfWidth
      && point.y >= camera.centerY - halfHeight
      && point.y <= camera.centerY + halfHeight;
  });
}
