import type { AirGroup, FleetKind, NavalTaskForce } from './jointOperations';
import type { Territory } from './types';
import { NAVAL_ROUTE_GEOMETRY_VERSION, refineNavalLeg } from './navalCorridors';

export interface NavalWaypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  basin: string;
  territoryId?: string;
}

export type FleetNavigationMode = 'in-port' | 'outbound' | 'on-station' | 'returning' | 'refueling' | 'stranded';
export interface FleetNavigationState {
  version: 1;
  /** Geometry revision is separate from save shape; never reset fuel on migration. */
  routeGeometryVersion?: number;
  faction?: 'allies' | 'axis';
  mode: FleetNavigationMode;
  homePort: NavalWaypoint;
  position: NavalWaypoint;
  destination?: NavalWaypoint;
  route: NavalWaypoint[];
  distanceNm: number;
  traveledNm: number;
  rangeNm: number;
  remainingRangeNm: number;
  cruiseKnots: number;
  departedWeek: number;
  lastProcessedWeek: number;
  refuelWeeks: number;
  /** Per-week movement is shared by ordinary navigation and convoy following. */
  distanceThisWeekNm: number;
  lastMessage: string;
}

export interface FleetTransitForecast {
  allowed: boolean;
  reason: string;
  arrivalWeeks: number;
  distanceNm: number;
  returnDistanceNm: number;
  fuelCost: number;
  route: NavalWaypoint[];
}

// A formation's economical endurance is a balancing parameter, not the range of
// its named flagship. Ingham's official 11 kn / 8,000 nmi figures ground the
// escort baseline: https://www.history.uscg.mil/Browse-by-Topic/Assets/Water/All/Article/2055201/ingham-1936/
export const fleetEnduranceProfiles: Record<FleetKind, { rangeNm: number; cruiseKnots: number }> = {
  carrier: { rangeNm: 10000, cruiseKnots: 16 }, surface: { rangeNm: 8000, cruiseKnots: 14 },
  escort: { rangeNm: 8000, cruiseKnots: 11 }, submarine: { rangeNm: 8500, cruiseKnots: 10 },
  coastal: { rangeNm: 1800, cruiseKnots: 9 }, clandestine: { rangeNm: 1200, cruiseKnots: 7 },
};

const p = (id: string, name: string, latitude: number, longitude: number, basin: string, territoryId?: string): NavalWaypoint =>
  ({ id, name, latitude, longitude, basin, ...(territoryId ? { territoryId } : {}) });

// The explicit ocean graph prevents a single home-port→target great circle
// cutting across Eurasia. Legs are coarse operational corridors, NOT a
// navigational chart, collision model or a historical territorial-waters claim.
const oceans = [
  p('irish', '아일랜드해', 54, -5, 'irish'), p('channel', '영불해협 서부', 49.7, -3, 'channel'),
  p('doverstrait', '도버 해협', 50.8, 1.4, 'doverstrait'), p('westscotland', '스코틀랜드 서방', 58, -8, 'westscotland'),
  p('northscotland', '스코틀랜드 북방', 60, -5, 'northscotland'),
  p('northsea', '북해', 57, 2, 'northsea'), p('norwegian', '노르웨이해', 62, -1, 'norwegian'),
  p('arctic', '바렌츠해', 71, 25, 'arctic'), p('baltic', '발트해', 56, 17, 'baltic'),
  p('biscay', '비스케이만', 46, -9, 'biscay'), p('atlantic', '북대서양', 43, -30, 'atlantic'),
  p('westatlantic', '서대서양', 36, -65, 'westatlantic'), p('gibraltar', '지브롤터 해협', 35.9, -5.7, 'gibraltar'),
  // Open strategic corridors, not a sovereignty, lock-capacity or canal-access model.
  p('usatlantic', '미 동부 외해', 35, -74, 'usatlantic'), p('windward', '윈드워드 해협', 20, -74, 'windward'),
  p('caribbean', '카리브해', 15, -77, 'caribbean'), p('panamaatlantic', '파나마 대서양 접근', 9.5, -79.95, 'panamaatlantic'),
  p('panamapacific', '파나마 태평양 접근', 8.8, -79.5, 'panamapacific'), p('eastpacific', '동태평양 외해', 8, -88, 'eastpacific'),
  p('california', '캘리포니아 외해', 32, -120, 'california'), p('northpacific', '북동태평양 외해', 42, -130, 'northpacific'),
  p('westmed', '서지중해', 38, 4, 'westmed'), p('sicily', '시칠리아 남방', 35, 14, 'sicily'),
  p('eastmed', '동지중해', 34, 28, 'eastmed'), p('aegean', '에게해', 37, 25, 'aegean'),
  p('bosporus', '보스포루스', 41.2, 29.1, 'bosporus'), p('blacksea', '흑해', 43, 34, 'blacksea'),
  p('suez', '수에즈 통로', 30.5, 32.4, 'suez'), p('redsea', '홍해', 20, 38, 'redsea'),
  p('aden', '아덴만', 12, 47, 'aden'), p('arabian', '아라비아해', 15, 63, 'arabian'),
  p('indian', '인도 남방', 5, 78, 'indian'), p('bengal', '벵골만', 12, 87, 'bengal'),
  p('malacca', '말라카 통로', 3, 100, 'malacca'), p('singaporesea', '싱가포르 동방', 1.4, 104.6, 'singaporesea'),
  p('southchina', '남중국해', 13, 114, 'southchina'), p('eastchina', '동중국해', 28, 124, 'eastchina'),
  p('japansea', '대한해협', 34, 130, 'japansea'), p('southjapan', '규슈 남방', 30, 131, 'southjapan'), p('japanpacific', '일본 태평양 연안', 32, 143, 'japanpacific'),
  p('philippine', '필리핀해', 17, 133, 'philippine'), p('sulu', '술루해', 7, 120, 'sulu'),
  p('java', '자바해', -5, 111, 'java'), p('makassar', '마카사르 해협', -3, 118, 'makassar'),
  p('banda', '반다해', -6, 128, 'banda'), p('caroline', '캐롤라인 제도 해역', 5, 145, 'caroline'),
  p('coral', '산호해', -17, 154, 'coral'), p('solomon', '솔로몬해', -7, 156, 'solomon'),
  p('centralpacific', '중부 태평양', 13, 170, 'centralpacific'), p('hawaii', '하와이 서방', 23, -161, 'hawaii'),
  p('aleutian', '알류샨 남방', 49, 177, 'aleutian'), p('guinea', '기니만', 0, 2, 'guinea'),
  p('southatlantic', '남대서양', -20, 0, 'southatlantic'), p('cape', '희망봉 남방', -36, 19, 'cape'),
  p('southindian', '남인도양', -25, 55, 'southindian'),
];
const oceanById = new Map(oceans.map((point) => [point.id, point]));
const oceanRouteCache = new Map<string, readonly NavalWaypoint[]>();
const corridors = [
  ['irish', 'westscotland'], ['westscotland', 'northscotland'], ['northscotland', 'norwegian'],
  ['irish', 'biscay'], ['channel', 'biscay'], ['channel', 'doverstrait'], ['doverstrait', 'northsea'],
  ['northsea', 'norwegian'], ['norwegian', 'arctic'], ['northsea', 'baltic'],
  ['biscay', 'atlantic'], ['atlantic', 'westatlantic'], ['biscay', 'gibraltar'], ['gibraltar', 'westmed'],
  ['westatlantic', 'usatlantic'], ['westatlantic', 'windward'], ['usatlantic', 'windward'],
  ['windward', 'caribbean'], ['caribbean', 'panamaatlantic'], ['panamaatlantic', 'panamapacific'],
  ['panamapacific', 'eastpacific'], ['eastpacific', 'hawaii'], ['eastpacific', 'california'],
  ['california', 'hawaii'], ['california', 'northpacific'], ['northpacific', 'aleutian'], ['northpacific', 'hawaii'],
  ['westmed', 'sicily'], ['sicily', 'eastmed'], ['eastmed', 'aegean'], ['aegean', 'bosporus'],
  ['bosporus', 'blacksea'], ['eastmed', 'suez'], ['suez', 'redsea'], ['redsea', 'aden'],
  ['aden', 'arabian'], ['arabian', 'indian'], ['indian', 'bengal'], ['bengal', 'malacca'],
  ['malacca', 'singaporesea'], ['singaporesea', 'southchina'], ['singaporesea', 'java'],
  ['southchina', 'eastchina'], ['eastchina', 'japansea'], ['japansea', 'southjapan'], ['southjapan', 'japanpacific'],
  ['eastchina', 'philippine'], ['southchina', 'sulu'], ['sulu', 'makassar'],
  ['java', 'makassar'], ['makassar', 'banda'], ['banda', 'coral'], ['banda', 'caroline'],
  ['philippine', 'caroline'], ['japanpacific', 'philippine'], ['japanpacific', 'aleutian'],
  ['caroline', 'solomon'], ['coral', 'solomon'], ['solomon', 'centralpacific'],
  ['caroline', 'centralpacific'], ['centralpacific', 'hawaii'], ['aleutian', 'hawaii'],
  ['biscay', 'guinea'], ['guinea', 'southatlantic'], ['southatlantic', 'cape'],
  ['cape', 'southindian'], ['southindian', 'indian'],
];

type PortSeed = [string, string, number, number, string, ...string[]];
// Broad map regions use a stated coastal anchor, not their inland label's centre.
const portSeeds: PortSeed[] = [
  ['portsmouth', '포츠머스', 50.8, -1.1, 'channel'], ['plymouth', '플리머스', 50.4, -4.2, 'channel'],
  ['scotland', '스캐파플로', 58.9, -3, 'norwegian'], ['iceland', '레이캬비크', 64.1, -21.9, 'norwegian'],
  ['netherlands', '로테르담', 52, 4.1, 'northsea'], ['brittany', '브레스트', 48.4, -4.5, 'biscay'],
  ['marseille', '마르세유', 43.3, 5.4, 'westmed'], ['narvik', '나르비크', 68.4, 17.4, 'arctic'],
  ['greece', '피레우스', 37.9, 23.6, 'aegean'], ['crete', '크레타', 35.5, 24, 'eastmed'],
  ['casablanca', '카사블랑카', 33.6, -7.6, 'biscay'], ['oran', '오랑', 35.7, -.6, 'westmed'],
  ['algiers', '알제', 36.8, 3.1, 'westmed'], ['beirut', '베이루트', 33.9, 35.5, 'eastmed'],
  ['dunkirk', '됭케르크', 51, 2.4, 'doverstrait'], ['archangel', '아르한겔스크', 64.6, 40.5, 'arctic'],
  ['mariupol', '마리우폴', 47.1, 37.6, 'blacksea'], ['nikolaev', '니콜라예프', 46.8, 31.9, 'blacksea'],
  ['basra', '바스라 하구', 29.9, 48.5, 'arabian'], ['madras', '마드라스', 13.1, 80.3, 'bengal'],
  ['osaka_kure', '구레 외항', 33.6, 132.3, 'japansea'], ['hokkaido', '하코다테', 41.8, 140.7, 'japanpacific'],
  ['leyte', '레이테', 11.1, 125, 'philippine'], ['borneo', '발릭파판', -1.3, 116.8, 'makassar'],
  ['celebes', '마카사르', -5.1, 119.4, 'makassar'], ['timor', '딜리', -8.6, 125.6, 'banda'],
  ['hollandia', '홀란디아', -2.5, 140.7, 'caroline'], ['bougainville', '부건빌', -6.2, 155.5, 'solomon'],
  ['darwin', '다윈', -12.5, 130.8, 'banda'], ['brisbane', '브리즈번', -27.4, 153.2, 'coral'],
  ['karachi', '카라치', 24.8, 67, 'arabian'], ['chittagong', '치타공', 22.3, 91.8, 'bengal'],
  ['penang', '페낭', 5.4, 100.3, 'malacca'], ['tianjin', '톈진 하구', 38.9, 117.8, 'eastchina'],
  ['yokosuka', '요코스카', 35.3, 139.7, 'japanpacific'], ['davao', '다바오', 7.1, 125.6, 'philippine'],
  ['kavieng', '캐비엥', -2.6, 150.8, 'caroline'], ['admiralties', '마누스', -2.1, 147.2, 'caroline'],
  ['tulagi', '툴라기', -9.1, 160.2, 'solomon'], ['townsville', '타운즈빌', -19.3, 146.8, 'coral'],
  ['coral_sea', '산호해', -17, 154, 'coral'], ['atlantic', '서부접근로', 53, -15, 'biscay'],
  ['lae', '라에', -6.7, 147, 'solomon'], ['bataan', '바탄 연안', 14.5, 120.5, 'southchina'],
  ['biak', '비아크', -1.2, 136.1, 'caroline'], ['crimea', '크림 남안', 44.5, 34.2, 'blacksea'],
  ['messina', '메시나', 38.2, 15.6, 'sicily'], ['palermo', '팔레르모', 38.1, 13.4, 'westmed'],
  ['east_prussia', '쾨니히스베르크 외항', 54.6, 19.9, 'baltic'], ['arakan', '아키아브', 20.1, 92.9, 'bengal'],
  ['hiroshima', '히로시마·구레 외항', 33.6, 132.3, 'japansea'], ['lingayen', '링가옌만', 16.2, 120.2, 'southchina'],
  ['milne_bay', '밀른만', -10.3, 150.5, 'coral'],
  ['britain', '포츠머스 해군기지', 50.8, -1.1, 'channel', '영국 본토', '포츠머스'],
  ['scapa', '스캐퍼플로', 58.9, -3, 'norwegian', '스캐퍼플로'], ['liverpool', '리버풀', 53.4, -3.1, 'irish', '리버풀', '서부항로'],
  ['belfast', '벨파스트', 54.6, -5.9, 'irish', '북아일랜드'], ['dover', '도버', 51.1, 1.3, 'channel'],
  ['norfolk', '노퍽 외항', 36.96, -76.34, 'usatlantic', '노퍽'], ['noumea', '누메아', -22.3, 166.4, 'coral', '누메아'],
  ['polyarny', '폴랴르니', 69.2, 33.4, 'arctic', '폴랴르니'], ['murmansk', '무르만스크', 69, 33.1, 'arctic'],
  ['caucasus', '노보로시스크 정박지', 44.7, 37.8, 'blacksea', '캅카스 연안'],
  ['brest', '브레스트', 48.4, -4.5, 'biscay', '브레스트'], ['bordeaux', '보르도 외항', 45.6, -1.1, 'biscay', '보르도'],
  ['norway', '트론헤임 정박지', 63.4, 10.4, 'norwegian', '노르웨이'],
  ['truk', '트루크', 7.4, 151.8, 'caroline', '트루크'], ['rabaul', '라바울', -4.2, 152.2, 'solomon', '남태평양'],
  ['fuzhou', '푸저우 연안 수로', 26, 119.6, 'eastchina', '푸젠 내륙수로'],
  ['shanghai', '상하이 연안 연락점', 31.3, 121.7, 'eastchina', '충칭·이창', '충칭·상하이 연락로'],
  ['bombay', '봄베이', 18.9, 72.8, 'arabian', '봄베이'], ['calcutta', '캘커타 하구', 22, 88.2, 'bengal', '캘커타', '인도·중국 연결로'],
  ['douala', '두알라', 4, 9.7, 'guinea', '두알라'], ['taranto', '타란토', 40.4, 17.2, 'sicily', '타란토'],
  ['haiphong', '하이퐁 연안 연락점', 20.8, 106.8, 'southchina', '까오방·통킹만'],
  ['saigon', '메콩 하구 연락점', 10.3, 106.8, 'southchina', '메콩 삼각주'],
  ['batavia', '바타비아', -6.1, 106.8, 'java', '자바해'],
  ['ambon', '암본', -3.7, 128.2, 'banda', '술라웨시·말루쿠'],
  ['mindanao', '민다나오 연락점', 7, 125.7, 'philippine', '비사야·민다나오', '민다나오'],
  ['gibraltar', '지브롤터', 36.1, -5.4, 'gibraltar'], ['morocco', '카사블랑카', 33.6, -7.6, 'biscay'],
  ['algeria', '알제', 36.8, 3.1, 'westmed'], ['tunis', '튀니스', 36.8, 10.3, 'sicily'],
  ['tunisia', '튀니지 연안', 35.8, 10.6, 'sicily'], ['sicily', '시칠리아 남안', 36.7, 15.1, 'sicily'],
  ['malta', '몰타', 35.9, 14.5, 'sicily'], ['libya', '트리폴리', 32.9, 13.2, 'sicily'],
  ['tripoli', '트리폴리', 32.9, 13.2, 'sicily'], ['tobruk', '토브룩', 32.1, 23.9, 'eastmed'],
  ['egypt', '알렉산드리아', 31.2, 29.9, 'eastmed'], ['alexandria', '알렉산드리아', 31.2, 29.9, 'eastmed'],
  ['levant', '베이루트', 33.9, 35.5, 'eastmed'], ['suez', '수에즈', 29.9, 32.5, 'suez'],
  ['italy', '타란토 연안', 40.4, 17.2, 'sicily'], ['naples', '나폴리', 40.8, 14.3, 'sicily'],
  ['anzio', '안치오', 41.4, 12.6, 'westmed'], ['salerno', '살레르노 외항', 40.66, 14.75, 'sicily'],
  ['normandy', '노르망디 연안', 49.4, -0.9, 'channel'], ['cherbourg', '셰르부르', 49.6, -1.6, 'channel'],
  ['calais', '칼레', 51, 1.8, 'channel'], ['antwerp', '앤트워프 하구', 51.4, 3.7, 'northsea'],
  ['denmark', '덴마크 해협', 56.5, 11, 'baltic'], ['hamburg', '함부르크 하구', 53.9, 8.7, 'northsea'],
  ['gdansk', '단치히', 54.4, 18.7, 'baltic'], ['leningrad', '레닌그라드', 60, 29.7, 'baltic'],
  ['sevastopol', '세바스토폴', 44.6, 33.5, 'blacksea'], ['odessa', '오데사', 46.5, 30.8, 'blacksea'],
  ['india', '봄베이 연안', 18.9, 72.8, 'arabian'], ['ceylon', '콜롬보', 6.9, 79.8, 'indian'],
  ['burma', '랑군 하구', 16.6, 96.3, 'bengal'], ['rangoon', '랑군', 16.6, 96.3, 'bengal'],
  ['malaya', '말라야 서안', 4, 100.6, 'malacca'], ['singapore', '싱가포르', 1.3, 103.8, 'singaporesea'],
  ['south_china', '광저우 하구', 22.3, 113.7, 'southchina'], ['hong_kong', '홍콩', 22.3, 114.2, 'southchina'],
  ['indochina', '사이공 하구', 10.3, 106.8, 'southchina'], ['taiwan', '다카오', 22.6, 120.3, 'southchina'],
  ['korea', '부산 연안', 35.1, 129.1, 'japansea'], ['busan', '부산', 35.1, 129.1, 'japansea'],
  ['incheon', '인천', 37.4, 126.5, 'eastchina'], ['wonsan', '원산', 39.2, 127.5, 'japansea'],
  ['japan_home', '요코스카', 35.3, 139.7, 'japanpacific'], ['tokyo', '도쿄만', 35.5, 139.8, 'japanpacific'],
  ['kure', '구레 외항', 33.6, 132.3, 'japansea'], ['sasebo', '사세보', 33.2, 129.7, 'japansea'],
  ['okinawa', '오키나와', 26.2, 127.7, 'eastchina'], ['soviet_far_east', '블라디보스토크', 43.1, 131.9, 'japansea'],
  ['vladivostok', '블라디보스토크', 43.1, 131.9, 'japansea'], ['dalian', '다롄', 38.9, 121.6, 'eastchina'],
  ['qingdao', '칭다오', 36.1, 120.4, 'eastchina'], ['philippines', '마닐라', 14.6, 120.9, 'southchina'],
  ['manila', '마닐라', 14.6, 120.9, 'southchina'], ['cebu', '세부', 10.3, 123.9, 'sulu'],
  ['dutch_east_indies', '바타비아', -6.1, 106.8, 'java'], ['surabaya', '수라바야', -7.2, 112.7, 'java'],
  ['balikpapan', '발릭파판', -1.3, 116.8, 'makassar'], ['sumatra', '수마트라 동안', -2.3, 104.9, 'singaporesea'],
  ['new_guinea', '라에', -6.7, 147, 'solomon'], ['port_moresby', '포트모르즈비', -9.5, 147.1, 'coral'],
  ['solomons', '과달카날', -9.4, 160, 'solomon'], ['guadalcanal', '과달카날', -9.4, 160, 'solomon'],
  ['hawaii', '진주만 외해 접근', 21.2683, -157.9397, 'hawaii', '진주만'], ['midway', '미드웨이', 28.2, -177.4, 'centralpacific'],
  ['iwo_jima', '이오지마', 24.8, 141.3, 'philippine'], ['guam', '괌', 13.4, 144.8, 'caroline'],
  ['saipan', '사이판', 15.2, 145.8, 'caroline'], ['palau', '팔라우', 7.5, 134.6, 'caroline'],
  ['wake', '웨이크', 19.3, 166.6, 'centralpacific'], ['tarawa', '타라와', 1.5, 173, 'centralpacific'],
  ['kwajalein', '콰잘레인', 8.7, 167.7, 'centralpacific'], ['eniwetok', '에니웨토크', 11.3, 162.3, 'centralpacific'],
  ['marshalls', '마셜 제도', 7.1, 171.2, 'centralpacific'], ['makin', '마킨', 3.4, 173, 'centralpacific'],
  ['attu', '애투', 52.9, 173.2, 'aleutian'], ['kiska', '키스카', 52.1, -177.6, 'aleutian'],
  ['dutch_harbor', '더치하버', 53.9, -166.5, 'aleutian'],
];

const portById = new Map<string, NavalWaypoint>();
const portByName = new Map<string, NavalWaypoint>();
const harborControlIds: Record<string, string> = { scapa: 'scotland', polyarny: 'murmansk', brest: 'brittany',
  batavia: 'dutch_east_indies', fuzhou: 'south_china', noumea: 'noumea', norfolk: 'norfolk' };
portSeeds.forEach(([id, name, latitude, longitude, basin, ...aliases]) => {
  const point = p(id, name, latitude, longitude, basin, harborControlIds[id] ?? id);
  portById.set(id, point);
  [name, ...aliases].forEach((alias) => portByName.set(alias, point));
});

export function resolveNavalTerritoryPoint(id: string, territories: readonly Territory[] = []): NavalWaypoint | null {
  const point = portById.get(id) ?? oceanById.get(id);
  if (!point) return null;
  const territory = territories.find((item) => item.id === id);
  return { ...point, ...(territory ? { name: territory.name, territoryId: id } : {}) };
}

const radians = (degrees: number) => degrees * Math.PI / 180;
export function nauticalDistance(a: Pick<NavalWaypoint, 'latitude' | 'longitude'>, b: Pick<NavalWaypoint, 'latitude' | 'longitude'>): number {
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 3440.065 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, q))));
}

export function buildNavalRoute(from: NavalWaypoint, to: NavalWaypoint): NavalWaypoint[] {
  if (!validPoint(from) || !validPoint(to)) return [];
  // IDs can coincide for an ocean hub and its coastal port. Only coordinates
  // identify a zero-length leg; same-basin ports still use a coastal approach.
  if (nauticalDistance(from, to) < 0.01) return [{ ...from }, { ...to }];
  const assemble = (hubs: readonly NavalWaypoint[]) => {
    const anchors = [from, ...hubs, to];
    const result: NavalWaypoint[] = [{ ...from }];
    for (let index = 1; index < anchors.length; index += 1) {
      const leg = refineNavalLeg(anchors[index - 1], anchors[index]);
      for (const point of leg.slice(1)) {
        if (nauticalDistance(result[result.length - 1], point) > 0.00001) result.push({ ...point });
      }
    }
    // Keep the destination's identity even when its coordinates match a hub.
    result[result.length - 1] = { ...to };
    return result;
  };
  if (from.basin === to.basin) return assemble([oceanById.get(from.basin)!]);
  const cacheKey = `${from.basin}:${to.basin}`;
  const cached = oceanRouteCache.get(cacheKey);
  if (cached) return assemble(cached);
  const distances = new Map<string, number>([[from.basin, 0]]);
  const previous = new Map<string, string>();
  const pending = new Set(oceans.map((point) => point.id));
  while (pending.size) {
    const id = [...pending].reduce<string | undefined>((best, item) => best === undefined || (distances.get(item) ?? Infinity) < (distances.get(best) ?? Infinity) ? item : best, undefined);
    if (!id || !Number.isFinite(distances.get(id))) break;
    pending.delete(id);
    if (id === to.basin) break;
    corridors.forEach(([a, b]) => {
      const next = a === id ? b : b === id ? a : null;
      if (!next || !pending.has(next)) return;
      const cost = distances.get(id)! + getNavalRouteDistance(refineNavalLeg(oceanById.get(id)!, oceanById.get(next)!));
      if (cost < (distances.get(next) ?? Infinity)) { distances.set(next, cost); previous.set(next, id); }
    });
  }
  if (!distances.has(to.basin)) return [];
  const ids = [to.basin];
  while (ids[0] !== from.basin) { const previousId = previous.get(ids[0]); if (!previousId) return []; ids.unshift(previousId); }
  const path = ids.map((id) => oceanById.get(id)!);
  oceanRouteCache.set(cacheKey, path);
  return assemble(path);
}

export const getNavalRouteDistance = (route: readonly NavalWaypoint[]) => route.reduce((sum, point, index) => index ? sum + nauticalDistance(route[index - 1], point) : sum, 0);
/** Null means an unmapped endpoint; never silently treat missing geography as zero miles. */
export function getMaritimeRouteDistanceNm(routeIds: readonly string[], territories: readonly Territory[]): number | null {
  const points = routeIds.map((id) => resolveNavalTerritoryPoint(id, territories));
  if (points.length < 1 || points.some((point) => !point)) return null;
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    const route = buildNavalRoute(points[index - 1]!, points[index]!);
    if (!route.length) return null;
    distance += getNavalRouteDistance(route);
  }
  return Math.ceil(distance);
}
const validWeek = (week: number) => Number.isInteger(week) && week >= 0;
const finite = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
function validPoint(value: unknown): value is NavalWaypoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as NavalWaypoint;
  return typeof point.id === 'string' && point.id.length <= 150 && typeof point.name === 'string' && point.name.length <= 200
    && finite(point.latitude, -90, 90) && finite(point.longitude, -180, 180) && oceanById.has(point.basin);
}

export function createFleetNavigation(fleet: Pick<NavalTaskForce, 'location' | 'kind'>): FleetNavigationState | undefined {
  const homePort = portByName.get(fleet.location) ?? portById.get(fleet.location);
  if (!homePort) return undefined;
  const profile = fleetEnduranceProfiles[fleet.kind] ?? fleetEnduranceProfiles.escort;
  return { version: 1, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, mode: 'in-port', homePort: { ...homePort }, position: { ...homePort }, route: [],
    distanceNm: 0, traveledNm: 0, ...profile, remainingRangeNm: profile.rangeNm,
    departedWeek: 0, lastProcessedWeek: -1, refuelWeeks: 0, distanceThisWeekNm: 0,
    lastMessage: '모항 대기 · 급유 완료. 항속거리는 편제별 게임 모델입니다.' };
}

export function normalizeFleetNavigation(value: unknown, fleet: Pick<NavalTaskForce, 'location' | 'kind'>): FleetNavigationState | undefined {
  const fallback = createFleetNavigation(fleet);
  if (!value || typeof value !== 'object') return fallback;
  const nav = value as FleetNavigationState;
  if (nav.version !== 1 || !['in-port', 'outbound', 'on-station', 'returning', 'refueling', 'stranded'].includes(nav.mode)
    || !validPoint(nav.homePort) || !validPoint(nav.position) || (nav.destination !== undefined && !validPoint(nav.destination))
    || !Array.isArray(nav.route) || nav.route.length > 512 || !nav.route.every(validPoint)
    || !finite(nav.distanceNm, 0, 100000) || !finite(nav.traveledNm, 0, nav.distanceNm)
    || !finite(nav.rangeNm, 100, 30000) || !finite(nav.remainingRangeNm, 0, nav.rangeNm)
    || !finite(nav.cruiseKnots, 1, 40) || !validWeek(nav.departedWeek)
    || !Number.isInteger(nav.lastProcessedWeek) || nav.lastProcessedWeek < -1
    || !finite(nav.refuelWeeks, 0, 10) || !finite(nav.distanceThisWeekNm ?? 0, 0, 10000)) return fallback;
  if (['outbound', 'returning'].includes(nav.mode) && (!nav.destination || nav.route.length < 2)) return fallback;
  const restored = { ...nav, homePort: { ...nav.homePort }, position: { ...nav.position }, destination: nav.destination ? { ...nav.destination } : undefined,
    route: nav.route.map((point) => ({ ...point })), distanceThisWeekNm: nav.distanceThisWeekNm ?? 0,
    lastMessage: typeof nav.lastMessage === 'string' ? nav.lastMessage.slice(0, 600) : '항해 기록 복원' };
  return migrateFleetRouteGeometry(restored);
}

const compactNavalRoute = (route: readonly NavalWaypoint[]): NavalWaypoint[] => {
  const points = route.filter((point, index) => index === 0 || nauticalDistance(route[index - 1], point) > .0001)
    .map((point) => ({ ...point }));
  return points.length === 1 ? [points[0], { ...points[0] }] : points;
};

// Earlier saves used these inland representative port labels. Accept only the
// exact ID/coordinate pair, never snap a saved vessel to the new offshore point.
// Their initial local access leg remains a legacy approximation; new voyages
// created from the current port catalogue use the corrected offshore anchors.
const legacyPortAnchors = [
  p('norfolk', '노퍽 구 대표점', 36.9, -76.3, 'usatlantic', 'norfolk'),
  p('hawaii', '진주만 구 대표점', 21.4, -157.9, 'hawaii', 'hawaii'),
];

/** Only catalogued physical points can start a new basin route. */
function knownNavalAnchor(point: NavalWaypoint): NavalWaypoint | undefined {
  const byId = portById.get(point.id) ?? oceanById.get(point.id);
  if (byId && nauticalDistance(point, byId) < .0001) return byId;
  const legacy = legacyPortAnchors.find((anchor) => point.id === anchor.id && nauticalDistance(point, anchor) < .0001);
  if (legacy) return { ...point, basin: legacy.basin };
  let closest: NavalWaypoint | undefined;
  let closestDistance = 2;
  for (const catalog of [portById, oceanById]) {
    for (const candidate of catalog.values()) {
      const distance = nauticalDistance(point, candidate);
      if (distance <= closestDistance) { closest = candidate; closestDistance = distance; }
    }
  }
  return closest;
}

/** Match the same linear geographic legs used by pointAlongRoute, including the date line. */
function nearestRouteSegment(position: NavalWaypoint, route: readonly NavalWaypoint[]) {
  let best: { index: number; point: NavalWaypoint; distance: number } | undefined;
  for (let index = 1; index < route.length; index += 1) {
    const from = route[index - 1], to = route[index];
    const dx = ((to.longitude - from.longitude + 540) % 360) - 180;
    const dy = to.latitude - from.latitude;
    const px = ((position.longitude - from.longitude + 540) % 360) - 180;
    const py = position.latitude - from.latitude;
    const xScale = Math.cos(radians((from.latitude + to.latitude) / 2));
    const squared = (dx * xScale) ** 2 + dy ** 2;
    const fraction = squared ? Math.max(0, Math.min(1, (px * dx * xScale ** 2 + py * dy) / squared)) : 0;
    const point = { ...from, latitude: from.latitude + dy * fraction,
      longitude: ((from.longitude + dx * fraction + 540) % 360) - 180 };
    const distance = nauticalDistance(position, point);
    if (!best || distance < best.distance) best = { index, point, distance };
  }
  return best;
}

/**
 * Legacy points may rejoin a newly rebuilt corridor within two nautical miles.
 * The physical position and already consumed endurance are never rewritten.
 * A point on a removed overland chord cannot inherit that obsolete leg.
 */
function migrateFleetRouteGeometry(nav: FleetNavigationState): FleetNavigationState {
  if (nav.routeGeometryVersion === NAVAL_ROUTE_GEOMETRY_VERSION) return nav;
  // Revision 3 adds American graph alternatives; revision 2's recorded physical
  // legs remain usable. Rebuilding every active voyage to the new shortest path
  // would strand a ship already in the Indian Ocean en route to Hawaii. Keep
  // its full route, progress, position, fuel and weekly budget, including v2 IDs.
  // Pre-v2 saves still use the stricter obsolete-chord migration below.
  if (nav.routeGeometryVersion === 2) return { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION };
  if (nav.mode === 'in-port' || nav.mode === 'refueling') return { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION };
  const destination = nav.destination && knownNavalAnchor(nav.destination);
  const originCandidates = [nav.route[0], nav.homePort].filter((point): point is NavalWaypoint => Boolean(point))
    .map(knownNavalAnchor).filter((point): point is NavalWaypoint => Boolean(point));
  const candidates: NavalWaypoint[][] = [];
  const currentAnchor = knownNavalAnchor(nav.position);
  if (destination && currentAnchor) {
    const route = buildNavalRoute(currentAnchor, destination);
    if (route.length) candidates.push(compactNavalRoute([nav.position, ...route]));
  }
  if (destination) originCandidates.forEach((origin) => {
    const rebuilt = buildNavalRoute(origin, destination);
    const match = nearestRouteSegment(nav.position, rebuilt);
    if (match && match.distance <= 2) candidates.push(compactNavalRoute([nav.position, match.point, ...rebuilt.slice(match.index)]));
  });
  const route = candidates.filter((candidate) => candidate.length > 0 && candidate.length <= 512)
    .sort((a, b) => getNavalRouteDistance(a) - getNavalRouteDistance(b))[0];
  if (!route && nav.mode === 'on-station' && currentAnchor && !nav.destination) {
    return { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, route: [], distanceNm: 0, traveledNm: 0 };
  }
  if (!route) return { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, mode: 'stranded',
    route: [], distanceNm: 0, traveledNm: 0,
    lastMessage: '기존 저장 항로가 새 해상 회랑과 이어지지 않아 현재 위치에서 항해를 중단했습니다. 항로 재검토가 필요합니다. 위치·잔여 항속은 보존됩니다.' };
  return { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, route,
    distanceNm: getNavalRouteDistance(route), traveledNm: 0,
    lastMessage: '새 해상 회랑으로 잔여 항로를 복원했습니다. 현재 위치·사용한 항속·이번 주 이동량은 유지됩니다.' };
}

/** Re-route along the recorded current leg to a known anchor, never to a guessed basin center. */
function routeFromFleetPosition(nav: FleetNavigationState, destination: NavalWaypoint): NavalWaypoint[] {
  const target = knownNavalAnchor(destination);
  if (!target) return [];
  const candidates: NavalWaypoint[][] = [];
  const currentAnchor = knownNavalAnchor(nav.position);
  if (currentAnchor) {
    const route = buildNavalRoute(currentAnchor, target);
    if (route.length) candidates.push(compactNavalRoute([nav.position, ...route]));
  }
  if (nav.routeGeometryVersion === NAVAL_ROUTE_GEOMETRY_VERSION) {
    const match = nearestRouteSegment(nav.position, nav.route);
    if (match && match.distance <= 2) {
      const approaches = [nav.route.slice(match.index), nav.route.slice(0, match.index).reverse()];
      approaches.forEach((approach) => {
        const prefix: NavalWaypoint[] = [nav.position, match.point];
        for (const point of approach) {
          prefix.push(point);
          const anchor = knownNavalAnchor(point);
          if (!anchor) continue;
          const suffix = buildNavalRoute(anchor, target);
          if (suffix.length) candidates.push(compactNavalRoute([...prefix, anchor, ...suffix]));
          break;
        }
      });
    }
  }
  return candidates.filter((route) => route.length > 0 && route.length <= 512)
    .sort((a, b) => getNavalRouteDistance(a) - getNavalRouteDistance(b))[0] ?? [];
}

/** Navigation reservations remain exclusive even if a damaged save loses its assignment. */
export function hasFleetNavigationReservation(fleet: Pick<NavalTaskForce, 'navigation'>): boolean {
  return Boolean(fleet.navigation && fleet.navigation.mode !== 'in-port');
}

export function forecastFleetTransit(fleet: NavalTaskForce, destinationId: string, territories: readonly Territory[], week: number, missionRouteIds: readonly string[] = [], friendlyFaction?: 'allies' | 'axis'): FleetTransitForecast {
  const blocked = (reason: string): FleetTransitForecast => ({ allowed: false, reason, arrivalWeeks: 0, distanceNm: 0, returnDistanceNm: 0, fuelCost: 0, route: [] });
  if (!validWeek(week)) return blocked('올바른 주간 날짜가 필요합니다.');
  const nav = fleet.navigation ?? createFleetNavigation(fleet);
  if (!nav) return blocked('함대 모항 좌표가 확인되지 않아 출항할 수 없습니다.');
  if (nav.mode !== 'in-port' || fleet.status !== 'ready' || fleet.assignmentId) return blocked('항해·배속·귀항·급유 중인 함대는 중복 출항할 수 없습니다.');
  if (fleet.ships < 1 || fleet.readiness < 30 || fleet.organization < 25) return blocked('함정 또는 준비태세가 부족합니다.');
  const home = territories.find((territory) => territory.id === nav.homePort.territoryId);
  const nation = fleet.id.split('-fleet-')[0];
  const faction = friendlyFaction ?? nav.faction ?? (['germany', 'japan', 'italy'].includes(nation) ? 'axis' : 'allies');
  if (home && home.controller !== faction) return blocked('모항이 우호 통제하에 있지 않아 급유·출항할 수 없습니다.');
  const destination = resolveNavalTerritoryPoint(destinationId, territories);
  if (!destination) return blocked('합류점의 해상 좌표가 아직 확인되지 않았습니다.');
  const route = routeFromFleetPosition(nav, destination);
  if (!route.length) return blocked('합류점까지 검증된 해상 회랑이 없습니다.');
  const distanceNm = Math.ceil(getNavalRouteDistance(route));
  const missionDistance = missionRouteIds.length ? getMaritimeRouteDistanceNm([destinationId, ...missionRouteIds.filter((id, index) => index > 0 || id !== destinationId)], territories) : 0;
  if (missionDistance === null) return blocked('전체 임무 항로의 좌표를 확인할 수 없어 왕복 항속을 계산하지 못했습니다.');
  const lastPoint = missionRouteIds.length ? resolveNavalTerritoryPoint(missionRouteIds[missionRouteIds.length - 1], territories)! : destination;
  const returnRoute = buildNavalRoute(lastPoint, nav.homePort);
  if (!returnRoute.length) return blocked('임무 종료점에서 모항까지의 귀항 회랑을 확인할 수 없습니다.');
  const returnDistanceNm = Math.ceil(getNavalRouteDistance(returnRoute));
  const fuelCost = Math.max(1, Math.ceil(distanceNm / 600) + Math.ceil(fleet.ships / 12));
  const arrivalWeeks = Math.max(1, Math.ceil(distanceNm / (nav.cruiseKnots * 24 * 7 * .7)));
  // Include a modest on-station and emergency reserve; planning never spends the return leg.
  const reserve = Math.max(120, nav.rangeNm * .08);
  const allowed = distanceNm + missionDistance + returnDistanceNm + reserve <= nav.remainingRangeNm;
  return { allowed, reason: allowed ? `${nav.homePort.name} 출항 → ${destination.name} · 약 ${distanceNm.toLocaleString()}해리 / ${arrivalWeeks}주. 귀항·비상 예비 항속 포함.`
    : `임무·귀항 ${Math.round(distanceNm + missionDistance + returnDistanceNm).toLocaleString()}해리와 비상 예비 항속이 필요하지만 잔여 항속은 ${Math.round(nav.remainingRangeNm).toLocaleString()}해리입니다.`,
  arrivalWeeks, distanceNm, returnDistanceNm, fuelCost, route };
}

export function dispatchFleetTransit(fleet: NavalTaskForce, destinationId: string, territories: readonly Territory[], week: number, assignmentId: string, friendlyFaction?: 'allies' | 'axis'): NavalTaskForce {
  const forecast = forecastFleetTransit(fleet, destinationId, territories, week, [], friendlyFaction);
  if (!forecast.allowed || !assignmentId) return fleet;
  const nav = fleet.navigation ?? createFleetNavigation(fleet)!;
  return { ...fleet, status: 'assigned', assignmentId, location: `${nav.position.name} 출항`,
    navigation: { ...nav, ...(friendlyFaction ? { faction: friendlyFaction } : {}), routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, mode: 'outbound', destination: forecast.route[forecast.route.length - 1], route: forecast.route,
      distanceNm: forecast.distanceNm, traveledNm: 0, departedWeek: week, lastProcessedWeek: week,
      distanceThisWeekNm: 0, lastMessage: forecast.reason } };
}

export function beginFleetReturn(fleet: NavalTaskForce, week: number, territories: readonly Territory[] = [], friendlyFaction?: 'allies' | 'axis'): NavalTaskForce {
  if (!validWeek(week)) return fleet;
  if (fleet.assignmentId && !['sea-', 'enemy-sea-', 'nav-return-'].some((prefix) => fleet.assignmentId!.startsWith(prefix))) return fleet;
  const originalNav = fleet.navigation ?? createFleetNavigation(fleet);
  if (!originalNav) return { ...fleet, status: 'refit', assignmentId: null };
  const nav = migrateFleetRouteGeometry(originalNav);
  if (['returning', 'refueling'].includes(nav.mode)) return nav === originalNav ? fleet : { ...fleet, navigation: nav };
  const home = territories.find((territory) => territory.id === nav.homePort.territoryId);
  const nation = fleet.id.split('-fleet-')[0];
  const faction = friendlyFaction ?? nav.faction ?? (['germany', 'japan', 'italy'].includes(nation) ? 'axis' : 'allies');
  // A captured home port cannot be used as a magical refueling point.
  const safeHome = !home || home.controller === faction;
  const friendlyPorts = safeHome ? [] : territories.filter((territory) => territory.controller === faction && territory.siteType === 'port')
    .map((territory) => resolveNavalTerritoryPoint(territory.id, territories)).filter((point): point is NavalWaypoint => Boolean(point));
  const candidates = (safeHome ? [nav.homePort] : friendlyPorts)
    .map((destination) => ({ destination, route: routeFromFleetPosition(nav, destination) }))
    .filter((candidate) => candidate.route.length > 0)
    .sort((a, b) => getNavalRouteDistance(a.route) - getNavalRouteDistance(b.route));
  const chosen = candidates[0];
  if (!chosen) return { ...fleet, status: 'assigned', assignmentId: `nav-return-${fleet.id}`, navigation: { ...nav, mode: 'stranded', route: [], distanceNm: 0, traveledNm: 0, lastMessage: '현재 위치에서 이어지는 안전한 귀항 회랑을 확인할 수 없습니다. 항로 재검토가 필요합니다.' } };
  const { destination, route } = chosen;
  const distanceNm = Math.ceil(getNavalRouteDistance(route));
  return { ...fleet, status: 'assigned', assignmentId: `nav-return-${fleet.id}`, location: `${nav.position.name} → ${destination.name} 귀항`,
    navigation: { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, mode: route.length && distanceNm <= nav.remainingRangeNm ? 'returning' : 'stranded',
      homePort: destination, destination, route, distanceNm, traveledNm: 0, departedWeek: week, lastProcessedWeek: week,
      distanceThisWeekNm: nav.lastProcessedWeek === week ? nav.distanceThisWeekNm : 0, lastMessage: route.length && distanceNm <= nav.remainingRangeNm
        ? `${destination.name} 귀항 중 · 도착 후 1주 급유·점검. 다른 임무에 배속할 수 없습니다.` : '귀항 항속이 부족합니다. 구조·보급 지원이 필요합니다.' } };
}

function pointAlongRoute(route: NavalWaypoint[], traveledNm: number): NavalWaypoint {
  let remaining = traveledNm;
  for (let index = 1; index < route.length; index += 1) {
    const from = route[index - 1], to = route[index];
    const distance = nauticalDistance(from, to);
    if (remaining >= distance) { remaining -= distance; continue; }
    const fraction = distance ? remaining / distance : 1;
    const lonDelta = ((to.longitude - from.longitude + 540) % 360) - 180;
    return { id: `transit-${to.id}-${Math.round(fraction * 1000)}`, name: `${to.name} 접근 해역`, basin: fraction < .5 ? from.basin : to.basin,
      latitude: from.latitude + (to.latitude - from.latitude) * fraction,
      longitude: ((from.longitude + lonDelta * fraction + 540) % 360) - 180 };
  }
  return { ...route[route.length - 1] };
}

/** Exactly one logical week; a save loaded late does not skip transit/refueling. */
export function advanceFleetNavigationWeek(fleet: NavalTaskForce, week: number): NavalTaskForce {
  const originalNav = fleet.navigation;
  if (!originalNav || !validWeek(week) || originalNav.lastProcessedWeek >= week || originalNav.mode === 'in-port') return fleet;
  const nav = migrateFleetRouteGeometry(originalNav);
  if (fleet.ships <= 0) return { ...fleet, status: 'refit', assignmentId: null, navigation: { ...nav, mode: 'stranded', lastProcessedWeek: week, lastMessage: '생존 함정이 없어 항해할 수 없습니다.' } };
  if (nav.mode === 'refueling') {
    const refuelWeeks = nav.refuelWeeks + 1;
    return { ...fleet, status: fleet.readiness >= 55 && fleet.organization >= 40 ? 'ready' : 'refit', assignmentId: null,
      location: nav.homePort.name, navigation: { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, mode: 'in-port', position: nav.homePort, destination: undefined,
        route: [], distanceNm: 0, traveledNm: 0, remainingRangeNm: nav.rangeNm, refuelWeeks,
        lastProcessedWeek: week, distanceThisWeekNm: 0, lastMessage: '귀항 후 급유·점검 완료. 손실 함정은 자동 복구되지 않습니다.' } };
  }
  if (nav.mode === 'on-station' || nav.mode === 'stranded') return { ...fleet, navigation: { ...nav, lastProcessedWeek: week, distanceThisWeekNm: 0 } };
  const distance = Math.min(nav.distanceNm - nav.traveledNm, nav.cruiseKnots * 24 * 7 * .7, nav.remainingRangeNm);
  const traveledNm = nav.traveledNm + Math.max(0, distance);
  const arrived = traveledNm >= nav.distanceNm - .01;
  const mode = arrived ? nav.mode === 'returning' ? 'refueling' : 'on-station' : distance <= 0 ? 'stranded' : nav.mode;
  const position = arrived ? nav.destination! : pointAlongRoute(nav.route, traveledNm);
  return { ...fleet, location: mode === 'refueling' ? `${position.name} 급유·점검` : position.name,
    navigation: { ...nav, mode, position, traveledNm, remainingRangeNm: Math.max(0, nav.remainingRangeNm - distance),
      lastProcessedWeek: week, distanceThisWeekNm: distance, refuelWeeks: 0,
      lastMessage: arrived ? mode === 'refueling' ? `${position.name} 도착 · 다음 주 급유 완료.` : `${position.name} 합류 완료. 다음 전투 주기부터 엄호합니다.`
        : mode === 'stranded' ? '항속 소진으로 항해를 중단했습니다.' : `${position.name} 이동 중 · ${Math.ceil(nav.distanceNm - traveledNm).toLocaleString()}해리 남음.` } };
}

/** Convoy progress cannot teleport its escort or consume the same week's movement twice. */
export function syncFleetEscortPosition(fleet: NavalTaskForce, territoryId: string, territories: readonly Territory[], week: number): NavalTaskForce {
  const originalNav = fleet.navigation;
  const destination = resolveNavalTerritoryPoint(territoryId, territories);
  if (!originalNav || originalNav.mode !== 'on-station' || !destination || !validWeek(week) || week < originalNav.lastProcessedWeek) return fleet;
  const nav = migrateFleetRouteGeometry(originalNav);
  if (nav.mode !== 'on-station') return { ...fleet, navigation: nav };
  // A stable territory ID does not imply a stable physical anchor: migrated
  // saves may still end at an older representative port coordinate. Reuse only
  // when both destination metadata and the recorded end agree with the target.
  const sameDestination = nav.destination?.id === destination.id
    && nav.routeGeometryVersion === NAVAL_ROUTE_GEOMETRY_VERSION && nav.route.length >= 2
    && nauticalDistance(nav.destination, destination) < .0001
    && nauticalDistance(nav.route[nav.route.length - 1], destination) < .0001
    && nauticalDistance(pointAlongRoute(nav.route, nav.traveledNm), nav.position) <= 2;
  const route = sameDestination ? nav.route : routeFromFleetPosition(nav, destination);
  if (!route.length) return { ...fleet, navigation: { ...nav, mode: 'stranded', route: [], distanceNm: 0, traveledNm: 0,
    lastMessage: '현재 항로에서 새 선단 위치로 이어지는 회랑을 확인할 수 없습니다. 현재 위치에서 항로를 재검토해야 합니다.' } };
  const distanceNm = getNavalRouteDistance(route);
  const traveledBefore = sameDestination ? Math.min(nav.traveledNm, distanceNm) : 0;
  const remainingDistance = Math.max(0, distanceNm - traveledBefore);
  const used = nav.lastProcessedWeek === week ? nav.distanceThisWeekNm : 0;
  const returnRoute = buildNavalRoute(destination, nav.homePort);
  const returnDistance = returnRoute.length ? getNavalRouteDistance(returnRoute) : Infinity;
  if (remainingDistance + returnDistance + 60 > nav.remainingRangeNm) return beginFleetReturn({ ...fleet, navigation: { ...nav, lastMessage: '귀항 예비 항속 확보를 위해 호위를 종료합니다.' } }, week, territories);
  const distance = Math.min(remainingDistance, Math.max(0, nav.cruiseKnots * 24 * 7 * .7 - used));
  const traveledNm = traveledBefore + distance;
  const position = pointAlongRoute(route, traveledNm);
  return { ...fleet, location: position.name, navigation: { ...nav, routeGeometryVersion: NAVAL_ROUTE_GEOMETRY_VERSION, position, destination, route, distanceNm, traveledNm,
    remainingRangeNm: Math.max(0, nav.remainingRangeNm - distance), lastProcessedWeek: week,
    distanceThisWeekNm: used + distance, lastMessage: traveledNm < distanceNm ? '선단을 추적 중 · 이번 주 항해 거리 한도로 합류가 지연됩니다.' : `${destination.name} 선단 엄호 중 · 귀항 예비 항속 유지.` } };
}

export function getFleetNavigationSummary(fleet: NavalTaskForce) {
  const nav = fleet.navigation ?? createFleetNavigation(fleet);
  const labels: Record<FleetNavigationMode, string> = { 'in-port': '모항 대기', outbound: '합류점 이동', 'on-station': '현장 엄호', returning: '귀항 중', refueling: '급유·점검', stranded: '항해 중단' };
  if (!nav) return { label: '좌표 미확인', homePort: fleet.location, position: fleet.location, destination: '', remainingRangeNm: 0, rangeNm: 0, arrivalWeeks: 0, detail: '함대 모항의 해상 좌표 확인이 필요합니다.' };
  const following = nav.mode === 'on-station' && nav.distanceNm - nav.traveledNm > .01;
  return { label: following ? '선단 추적' : labels[nav.mode], homePort: nav.homePort.name, position: nav.position.name, destination: nav.destination?.name ?? '',
    remainingRangeNm: Math.round(nav.remainingRangeNm), rangeNm: nav.rangeNm,
    arrivalWeeks: ['outbound', 'returning'].includes(nav.mode) || following ? Math.max(1, Math.ceil((nav.distanceNm - nav.traveledNm) / (nav.cruiseKnots * 24 * 7 * .7))) : nav.mode === 'refueling' ? 1 : 0,
    detail: nav.lastMessage };
}

const airBases: Record<string, [number, number]> = {
  '욱스브리지': [51.5, -.5], '북아일랜드': [55, -7], '영국 남부': [51, -.5], '포트모르즈비': [-9.5, 147.2],
  '스탈린그라드': [48.7, 44.5], '모스크바 권역': [55.8, 37.6], '지중해': [37.5, 15.1], '프랑스': [48.9, 2.3],
  '보르도-메리냐크': [44.8, -.7], '라바울': [-4.2, 152.2], '버마': [16.8, 96.2], '쿤밍': [25, 102.7],
  '임팔': [24.8, 93.9], '아삼': [26.2, 91.7], '영국·북아프리카': [51, -.5], '영국': [51, -.5],
  '리비아': [32.9, 13.2], '사르데냐': [39.2, 9.1], '충칭': [29.6, 106.5], '시안': [34.3, 108.9],
  '쿤밍 연락로': [25, 102.7], '비엣박': [22.4, 105.7], '자바': [-6.9, 107.6], '수마트라': [-2.9, 104.7],
  '호주·민다나오': [-12.5, 130.8], '민다나오': [7.1, 125.6],
};
const airBaseTerritoryIds: Record<string, string> = {
  '욱스브리지': 'britain', '북아일랜드': 'belfast', '영국 남부': 'britain', '포트모르즈비': 'port_moresby',
  '스탈린그라드': 'stalingrad', '모스크바 권역': 'moscow', '지중해': 'sicily', '프랑스': 'france',
  '보르도-메리냐크': 'bordeaux', '라바울': 'rabaul', '버마': 'burma', '쿤밍': 'yunnan', '임팔': 'imphal',
  '아삼': 'assam', '영국·북아프리카': 'britain', '영국': 'britain', '리비아': 'libya', '사르데냐': 'sardinia',
  '충칭': 'chongqing', '시안': 'xian', '쿤밍 연락로': 'yunnan', '비엣박': 'indochina', '자바': 'dutch_east_indies',
  '수마트라': 'sumatra', '호주·민다나오': 'darwin', '민다나오': 'mindanao',
};
/** Radius includes outbound/return and time on patrol; not maximum ferry range. */
export function getAirPatrolCoverage(airGroup: AirGroup, routeIds: readonly string[], territories: readonly Territory[]) {
  const radiusNm = ({ maritime: 1100, recon: 550, bomber: 650, fighter: 260, mixed: 380, transport: 600 })[airGroup.kind];
  const pair = airBases[airGroup.base];
  const points = routeIds.map((id) => resolveNavalTerritoryPoint(id, territories)).filter((point): point is NavalWaypoint => Boolean(point));
  const valid = Boolean(pair && points.length === routeIds.length && points.length > 0);
  const distances = valid ? points.map((point) => nauticalDistance({ latitude: pair[0], longitude: pair[1] }, point)) : [];
  const distanceNm = distances.length ? Math.round(Math.max(...distances)) : 0;
  const coverage = distances.length ? distances.filter((distance) => distance <= radiusNm).length / distances.length : 0;
  const allowed = valid && coverage > 0 && airGroup.aircraft > 0 && airGroup.readiness >= 30 && airGroup.serviceability >= 30;
  return { allowed, reason: !valid ? '항공기지 또는 항로 좌표가 확인되지 않았습니다.' : !coverage ? '항로가 초계 반경 밖에 있습니다.'
    : `기지 ${airGroup.base} · 초계 반경 ${radiusNm.toLocaleString()}해리 · 항로 지점 ${Math.round(coverage * 100)}% 엄호 가능. 왕복·현장 초계 시간을 반영한 게임 모델입니다.`,
    coverage, distanceNm, radiusNm, baseName: airGroup.base, baseId: airBaseTerritoryIds[airGroup.base] };
}
