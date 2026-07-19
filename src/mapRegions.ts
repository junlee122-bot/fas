import { getHistoricalMapPoint } from './historicalMaps';
import type { MapCamera } from './mapPresentation';
import type { Territory, TheaterId } from './types';

export interface StrategicMapRegionDefinition {
  id: string;
  theater: TheaterId;
  name: string;
  shortName: string;
  subtitle: string;
  camera: MapCamera;
  overview?: boolean;
}

export const strategicMapRegions: StrategicMapRegionDefinition[] = [
  { id: 'europe-overview', theater: 'europe', name: '유럽·지중해 전구 전체', shortName: '전체', subtitle: '북대서양에서 페르시아 회랑까지', camera: { centerX: 600, centerY: 380, zoom: 1 }, overview: true },
  { id: 'north-atlantic', theater: 'europe', name: '북대서양·영국 본토', shortName: '북대서양', subtitle: '스캐파플로·서부접근로·북극 수송선', camera: { centerX: 345, centerY: 300, zoom: 2 } },
  { id: 'western-europe', theater: 'europe', name: '서유럽·대서양 방벽', shortName: '서유럽', subtitle: '영불해협·노르망디·저지대·라인란트', camera: { centerX: 430, centerY: 430, zoom: 2.2 } },
  { id: 'eastern-front-north', theater: 'europe', name: '동부전선 북부', shortName: '동부 북부', subtitle: '레닌그라드·르제프·모스크바 방면', camera: { centerX: 750, centerY: 345, zoom: 2.1 } },
  { id: 'eastern-front-south', theater: 'europe', name: '동부전선 남부', shortName: '동부 남부', subtitle: '쿠르스크·돈바스·스탈린그라드·캅카스', camera: { centerX: 825, centerY: 520, zoom: 2.05 } },
  { id: 'central-mediterranean', theater: 'europe', name: '중부유럽·지중해', shortName: '중부·지중해', subtitle: '이탈리아·발칸·시칠리아·에게해', camera: { centerX: 620, centerY: 565, zoom: 2.1 } },
  { id: 'africa-middle-east', theater: 'europe', name: '북아프리카·중동', shortName: '아프리카·중동', subtitle: '횃불작전 상륙지에서 수에즈·페르시아 회랑까지', camera: { centerX: 725, centerY: 660, zoom: 1.85 } },

  { id: 'asia-overview', theater: 'asia', name: '아시아·태평양 전구 전체', shortName: '전체', subtitle: '인도양에서 북태평양·솔로몬 제도까지', camera: { centerX: 600, centerY: 380, zoom: 1 }, overview: true },
  { id: 'india-burma', theater: 'asia', name: '인도·버마 작전구', shortName: '인도·버마', subtitle: '벵골·임팔·코히마·버마로드·이라와디', camera: { centerX: 365, centerY: 445, zoom: 2.2 } },
  { id: 'china-korea', theater: 'asia', name: '중국·만주·한반도', shortName: '중국·한반도', subtitle: '화북·양쯔강·윈난·만주 철도망·조선', camera: { centerX: 640, centerY: 325, zoom: 2.2 } },
  { id: 'southeast-asia', theater: 'asia', name: '동남아시아·동인도', shortName: '동남아·동인도', subtitle: '인도차이나·말라야·수마트라·자바·보르네오', camera: { centerX: 590, centerY: 570, zoom: 2.05 } },
  { id: 'japan-philippines', theater: 'asia', name: '일본 본토·필리핀', shortName: '일본·필리핀', subtitle: '본토 산업축·류큐·루손·비사야·민다나오', camera: { centerX: 765, centerY: 420, zoom: 2.1 } },
  { id: 'southwest-pacific', theater: 'asia', name: '남서태평양', shortName: '남서태평양', subtitle: '뉴기니·비스마르크·솔로몬·호주 병참선', camera: { centerX: 875, centerY: 625, zoom: 2 } },
  { id: 'central-north-pacific', theater: 'asia', name: '중부·북태평양', shortName: '중부·북태평양', subtitle: '길버트·마셜·캐롤라인·마리아나·알류샨', camera: { centerX: 980, centerY: 410, zoom: 1.8 } },
];

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

export function getTerritoriesForMapRegion(
  territories: Territory[],
  region: StrategicMapRegionDefinition,
): Territory[] {
  const theaterTerritories = territories.filter((territory) => (territory.theater ?? 'europe') === region.theater);
  if (region.overview) return theaterTerritories;
  const halfWidth = 600 / region.camera.zoom;
  const halfHeight = 380 / region.camera.zoom;
  return theaterTerritories.filter((territory) => {
    const point = getHistoricalMapPoint(region.theater, territory);
    return point.x >= region.camera.centerX - halfWidth
      && point.x <= region.camera.centerX + halfWidth
      && point.y >= region.camera.centerY - halfHeight
      && point.y <= region.camera.centerY + halfHeight;
  });
}
