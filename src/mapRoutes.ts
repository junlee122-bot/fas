import type { Territory } from './types';
import { getStraitCrossing } from './straitCrossings';

export type MapRouteKind = 'land' | 'sea' | 'sea-crossing';
export type MapRouteBasis = 'sea-site' | 'listed-crossing' | 'listed-landmass' | 'legacy-adjacency';

export interface MapRouteClassification {
  kind: MapRouteKind;
  basis: MapRouteBasis;
  label: string;
  requiresSeaTransport: boolean;
}

export interface LandRouteValidation {
  allowed: boolean;
  code: 'allowed' | 'sea-origin' | 'sea-target' | 'sea-crossing' | 'not-adjacent';
  reason: string;
}

/**
 * Route semantics inferred from the existing strategicMapData place/region
 * labels, not new borders or a navigable geographic road network. Membership
 * is deliberately explicit: an unregistered scenario node must not become an
 * island merely because it is a port, a fortress, or has coastal terrain.
 * Landmass follows the displayed city anchor, not the country's name. Thus
 * Copenhagen and George Town require a sea crossing in the 1942 baseline.
 * Singapore retains its explicit Johor causeway connection; bridge damage and
 * future bridge construction are not inferred from the calendar here.
 */
export const MAP_LANDMASS_GROUPS: Readonly<Record<string, readonly string[]>> = {
  'great-britain': ['britain', 'liverpool', 'plymouth', 'portsmouth'],
  // The aggregate Scotland node is anchored at Lyness on Hoy, not Edinburgh.
  // Mainland Britain must not acquire a walking connection to Scapa Flow.
  hoy: ['scotland'],
  ireland: ['belfast'],
  iceland: ['iceland'],
  zealand: ['denmark'],
  penang: ['penang'],
  sicily: ['sicily', 'messina'],
  malta: ['malta'],
  crete: ['crete'],
  ceylon: ['ceylon'],
  honshu: ['japan_home', 'osaka_kure', 'nagoya', 'yokosuka', 'hiroshima'],
  kyushu: ['sasebo'],
  hokkaido: ['hokkaido'],
  okinawa: ['okinawa'],
  taiwan: ['taiwan'],
  luzon: ['philippines', 'lingayen', 'clark', 'bataan'],
  leyte: ['leyte'],
  cebu: ['cebu'],
  mindanao: ['mindanao', 'davao'],
  java: ['dutch_east_indies', 'surabaya'],
  sumatra: ['sumatra'],
  borneo: ['borneo'],
  celebes: ['celebes'],
  timor: ['timor'],
  ambon: ['ambon'],
  biak: ['biak'],
  'new-guinea': ['new_guinea', 'port_moresby', 'lae', 'hollandia', 'milne_bay'],
  'new-britain': ['rabaul'],
  'new-ireland': ['kavieng'],
  admiralties: ['admiralties'],
  bougainville: ['bougainville'],
  guadalcanal: ['solomons'],
  tulagi: ['tulagi'],
  guam: ['guam'],
  saipan: ['saipan'],
  truk: ['truk'],
  palau: ['palau'],
  marshalls: ['marshalls'],
  kwajalein: ['kwajalein'],
  eniwetok: ['eniwetok'],
  tarawa: ['tarawa'],
  makin: ['makin'],
  wake: ['wake'],
  'iwo-jima': ['iwo_jima'],
  midway: ['midway'],
  hawaii: ['hawaii'],
  attu: ['attu'],
  kiska: ['kiska'],
  unalaska: ['dutch_harbor'],
  australia: ['darwin', 'brisbane', 'townsville'],
  // Mainland endpoints adjoining one of the groups above. Other, inland
  // edges remain compatible with the original adjacency graph.
  mainland: [
    'france', 'calais', 'normandy', 'cherbourg', 'brittany', 'bordeaux',
    'germany', 'hamburg', 'norway', 'narvik', 'murmansk',
    'italy', 'naples', 'salerno', 'taranto', 'greece', 'levant',
    'morocco', 'algeria', 'algiers', 'tunisia', 'tunis', 'libya', 'tripoli', 'egypt', 'alexandria',
    'india', 'bombay', 'madras', 'karachi', 'malaya', 'singapore', 'bangkok',
    'south_china', 'indochina', 'saigon', 'shanghai', 'hong_kong',
    'korea', 'busan', 'soviet_far_east',
  ],
};

const landmassByTerritory = new Map(Object.entries(MAP_LANDMASS_GROUPS)
  .flatMap(([landmass, ids]) => ids.map((id) => [id, landmass] as const)));

/** Explicit water shortcuts between otherwise mainland/aggregate nodes. */
export const MAP_WATER_CROSSINGS: readonly (readonly [string, string])[] = [
  ['anatolia', 'balkans'],
  ['anatolia', 'sofia'],
  ['denmark', 'norway'],
  ['spain', 'morocco'],
  ['marseille', 'algeria'],
  ['marseille', 'algiers'],
  ['taranto', 'greece'],
];

const routeKey = (from: string, to: string) => [from, to].sort().join(':');
const waterCrossings = new Set(MAP_WATER_CROSSINGS.map(([from, to]) => routeKey(from, to)));
const legacySeaIds = new Set(['atlantic', 'channel', 'coral_sea']);

export function isSeaTerritory(territory: Pick<Territory, 'id' | 'siteType'>): boolean {
  return territory.siteType === 'sea' || legacySeaIds.has(territory.id);
}

export function getMapLandmassId(territoryId: string): string | undefined {
  return landmassByTerritory.get(territoryId);
}

/** Classification is symmetric; issuing an order also requires adjacency. */
export function classifyMapRoute(from: Territory, to: Territory): MapRouteClassification {
  if (isSeaTerritory(from) || isSeaTerritory(to)) {
    return { kind: 'sea', basis: 'sea-site', label: '해상 작전 연결', requiresSeaTransport: true };
  }
  if (waterCrossings.has(routeKey(from.id, to.id))) {
    return { kind: 'sea-crossing', basis: 'listed-crossing', label: getStraitCrossing(from.id, to.id)
      ? '보스포루스 해협 · 항구 경유 필요' : '해상 수송·상륙 필요', requiresSeaTransport: true };
  }
  const fromLandmass = landmassByTerritory.get(from.id);
  const toLandmass = landmassByTerritory.get(to.id);
  if (fromLandmass && toLandmass) {
    const crossesWater = fromLandmass !== toLandmass;
    return {
      kind: crossesWater ? 'sea-crossing' : 'land',
      basis: 'listed-landmass',
      label: crossesWater ? '해상 수송·상륙 필요' : '육상 연결',
      requiresSeaTransport: crossesWater,
    };
  }
  return { kind: 'land', basis: 'legacy-adjacency', label: '육상 연결', requiresSeaTransport: false };
}

export function validateLandRoute(origin: Territory, target: Territory): LandRouteValidation {
  if (isSeaTerritory(origin)) {
    return { allowed: false, code: 'sea-origin', reason: '해역은 육상부대의 공세 출발지가 아닙니다. 주둔 가능한 육지 거점에서 부대를 선택하세요.' };
  }
  if (isSeaTerritory(target)) {
    return { allowed: false, code: 'sea-target', reason: '해역은 육상 공세로 점령할 수 없습니다. 해공군 작전에서 해역 우세와 수송로를 관리하세요.' };
  }
  if (origin.id === target.id || !origin.neighbors.includes(target.id)) {
    return { allowed: false, code: 'not-adjacent', reason: '출발지와 이어진 거점에만 육상 공세를 내릴 수 있습니다.' };
  }
  if (classifyMapRoute(origin, target).kind === 'sea-crossing') {
    if (getStraitCrossing(origin.id, target.id)) return { allowed: false, code: 'sea-crossing',
      reason: '보스포루스 해협을 건너는 연결입니다. 직접 육상 진입은 불가하며, 내륙 도시에서 바로 승선할 수도 없습니다. 수송은 사용 가능한 연안 항구 사이에서 별도로 계획하세요.' };
    return { allowed: false, code: 'sea-crossing', reason: '바다를 건너는 연결입니다. 육상 공세로 바로 진입할 수 없으며, 해공군의 상륙 엄호도 병력 수송이나 점령을 대신하지 않습니다.' };
  }
  return { allowed: true, code: 'allowed', reason: '연결된 육상 거점입니다.' };
}
