import type { NavalWaypoint } from './navalNavigation';

export const NAVAL_ROUTE_GEOMETRY_VERSION = 3 as const;

interface CorridorPoint { latitude: number; longitude: number; basin: string }
interface CorridorDefinition { name: string; points: readonly CorridorPoint[] }
type Position = readonly [latitude: number, longitude: number];

const point = (latitude: number, longitude: number, basin: string): CorridorPoint => ({ latitude, longitude, basin });
const passage = (name: string, basin: string, positions: readonly Position[]): CorridorDefinition => ({
  name, points: positions.map(([latitude, longitude]) => point(latitude, longitude, basin)),
});

const vladivostok = passage('금각만·동보스포루스 접근', 'japansea', [
  [43.09, 131.89], [43.08, 131.88], [43.06, 131.9], [43.06, 132.02],
  [42.6, 132.4], [41, 132.2], [38.5, 131.5], [36, 130.5],
]);
const taranto = passage('이오니아해·시칠리아 남방', 'sicily', [[39.4, 17.2], [38.8, 17.6], [37.3, 16.8], [36.2, 15.7]]);
const oresund = [
  point(57, 11.8, 'northsea'), point(56.1, 12.58, 'northsea'), point(56.03, 12.64, 'baltic'),
  point(55.9, 12.67, 'baltic'), point(55.7, 12.69, 'baltic'), point(55.6, 12.75, 'baltic'),
  point(54.8, 13, 'baltic'), point(55, 14, 'baltic'), point(54.8, 15.1, 'baltic'), point(55.3, 15.5, 'baltic'),
];
const windwardApproach = passage('바하마 동방·윈드워드 해협', 'windward', [[25, -72], [21, -72.7], [20.25, -73.6]]);

/**
 * Shared, representative physical corridors. These are not a complete coastal
 * collision model, navigation chart, traffic-separation scheme, or a historical
 * claim about access rights. Main route assembly and distance accounting both
 * consume these same vertices; no visual-only shipping shortcuts belong here.
 *
 * Geographic references:
 * - Natural Earth 1:10m v5.1.2, the locally generated physical basemap, for
 *   sampled land/minor-island checks. Narrow canals are not fully represented.
 *   https://www.naturalearthdata.com/downloads/10m-physical-vectors/
 * - GSI Gazetteer: Osumi Kaikyo near 30°53'N, 130°49'E.
 *   https://web1.gsi.go.jp/common/000238260.pdf
 * - NGA Sailing Directions Pub. 172, sector 13: Persian Gulf/Hormuz geography.
 *   https://msi.nga.mil/api/publications/download?key=16694491%2FSFH00000%2FPub172bk.pdf
 * - NGA Sailing Directions Pub. 140: Dardanelles, Marmara and Bosporus geography.
 *   https://msi.nga.mil/api/publications/download?key=16694492%2FSFH00000%2FPub140bk.pdf&type=view
 * - Panama Canal Authority: original Gatun / Culebra / Pedro Miguel / Miraflores
 *   alignment, not the Agua Clara/Cocoli locks added in 2016.
 *   https://pancanal.com/en/history-of-the-panama-canal/
 *   https://pancanal.com/plan-de-uso-de-suelo/
 * - NOAA Coast Pilot: Chesapeake approach and Pearl Harbor offshore entrance.
 *   https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp3/CPB3_C09_WEB.pdf
 *   https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp10/CPB10_C09_WEB.pdf
 * Modern routeing regulations from those publications are NOT game rules.
 *
 * A waypoint's basin is an existing coarse engine attachment, not sovereignty
 * or precise hydrographic limits. Assignments are canonical and direction-
 * independent; resuming mid-voyage should retain the remaining physical route.
 */
const corridors: Readonly<Record<string, CorridorDefinition>> = {
  'port:norfolk|usatlantic': passage('노퍽·체서피크만·케이프헨리 접근', 'usatlantic', [
    [37, -76.23], [37, -76], [36.97, -75.9], [36.6, -75.6],
  ]),
  'usatlantic|windward': windwardApproach,
  'westatlantic|windward': windwardApproach,
  'windward|caribbean': passage('윈드워드 남구·카리브해', 'caribbean', [[18, -75]]),
  'caribbean|panamaatlantic': passage('콜론·리몬만 외해 접근', 'panamaatlantic', [[10, -79.8]]),
  // This is a representative lock/canal centreline, explicitly exempt from the
  // open-sea land mask: a generalized land dataset cannot resolve these works.
  // It grants no historical belligerent access and models no lock delay or beam.
  'panamaatlantic|panamapacific': { name: '파나마 구 운하·가툰·쿨레브라·미라플로레스', points: [
    ...passage('', 'panamaatlantic', [
      [9.39, -79.92], [9.34, -79.92], [9.31, -79.925], [9.27, -79.922], [9.23, -79.92],
      [9.19, -79.88], [9.15, -79.83], [9.12, -79.77], [9.12, -79.72], [9.12, -79.68],
    ]).points,
    ...passage('', 'panamapacific', [
      [9.1, -79.665], [9.07, -79.66], [9.04, -79.645], [9.015, -79.613],
      [8.997, -79.592], [8.98, -79.587], [8.955, -79.573], [8.93, -79.556], [8.9, -79.535],
    ]).points,
  ] },
  'panamapacific|eastpacific': passage('파나마만·아수에로 남방·동태평양', 'eastpacific', [
    [7.4, -79.2], [6.5, -80.2], [6.5, -82], [7, -84],
  ]),
  'eastpacific|california': passage('멕시코·바하칼리포르니아 서방', 'california', [[14, -100], [20, -108], [22, -112], [28, -117]]),
  'california|northpacific': passage('캘리포니아 서안 외해', 'northpacific', [[37.7, -123]]),
  // Current Pearl Harbor anchor is NOAA's offshore approach coordinate, not an
  // invented deep-water harbor berth; ocean legs skirt Kauai and Oahu.
  'port:hawaii|hawaii': passage('진주만 남방 접근·카우아이 서남방', 'hawaii', [
    [21, -158.3], [20.8, -159], [21.3, -161],
  ]),
  'port:france|channel': passage('르아브르·영불해협 접근', 'channel', [[49.7, -.5], [49.85, -1.1], [49.85, -2.3]]),
  'westmed|sicily': { name: '시칠리아 서방·남방', points: [
    point(38.1, 8.5, 'westmed'), point(37.6, 10.5, 'westmed'), point(37.1, 12.6, 'sicily'), point(36.1, 13, 'sicily'),
  ] },
  'northsea|baltic': { name: '스카게라크·카테가트·외레순', points: [
    point(58, 8, 'northsea'), point(57.9, 10.5, 'northsea'), ...oresund,
  ] },
  'malacca|singaporesea': { name: '말라카·싱가포르 해협', points: [
    point(2.1, 102, 'malacca'), point(1.45, 102.9, 'malacca'), point(1.1, 103.6, 'singaporesea'),
    point(1.16, 103.85, 'singaporesea'), point(1.2, 104.1, 'singaporesea'), point(1.3, 104.35, 'singaporesea'),
  ] },
  'eastmed|suez': passage('포트사이드·수에즈 운하', 'suez', [[31.7, 32.1], [31.35, 32.32], [31.26, 32.31], [30.6, 32.3]]),
  'suez|redsea': { name: '수에즈만·홍해', points: [
    point(29.9, 32.55, 'suez'), point(29.55, 32.65, 'redsea'), point(29.3, 32.8, 'redsea'),
    point(28.7, 33.05, 'redsea'), point(28.2, 33.4, 'redsea'), point(27.8, 33.65, 'redsea'),
    point(27.6, 33.9, 'redsea'), point(27.45, 34.2, 'redsea'), point(27, 34.4, 'redsea'),
  ] },
  'aegean|bosporus': { name: '다르다넬스·마르마라·보스포루스', points: [
    ...passage('', 'aegean', [
      [37.2, 24.95], [37.4, 25.1], [37.6, 25.5], [38, 25.3], [38.8, 25.3], [39.6, 25.7], [39.92, 25.95],
      [40.01, 26.15],
    ]).points,
    ...passage('', 'bosporus', [
      [40.02, 26.25], [40.05, 26.27], [40.1, 26.33], [40.14, 26.39], [40.17, 26.39],
      [40.21, 26.395], [40.24, 26.49], [40.32, 26.6], [40.4, 26.72], [40.5, 26.9],
      [40.65, 27.25], [40.75, 27.8], [40.88, 28.5], [40.96, 28.95],
      [41, 29], [41.01, 29.004], [41.02, 29.001], [41.03, 28.999], [41.04, 29.013], [41.05, 29.033],
      [41.06, 29.043], [41.07, 29.051], [41.08, 29.057], [41.09, 29.061], [41.1, 29.065],
      [41.11, 29.068], [41.12, 29.073], [41.13, 29.08], [41.14, 29.075], [41.15, 29.063],
      [41.16, 29.059], [41.17, 29.071], [41.18, 29.084], [41.19, 29.095],
    ]).points,
  ] },
  'bosporus|blacksea': { name: '보스포루스 북구·흑해', points: [
    point(41.22, 29.13, 'bosporus'), point(41.25, 29.15, 'bosporus'),
    point(41.32, 29.25, 'blacksea'), point(41.5, 29.5, 'blacksea'), point(42, 31, 'blacksea'),
  ] },
  'japansea|southjapan': { name: '규슈 서방·오스미 해협', points: [
    point(33.7, 128.5, 'japansea'), point(32.4, 128.2, 'eastchina'), point(31.2, 129.3, 'eastchina'),
    point(30.88, 130.82, 'southjapan'), point(30.95, 131.4, 'southjapan'),
    point(30.3, 131.4, 'southjapan'), point(29.8, 131.2, 'southjapan'),
  ] },
  'port:wonsan|japansea': passage('원산만·한반도 동방 해상', 'japansea', [
    [39.15, 127.9], [39, 128.5], [38.5, 129.5], [37.2, 130], [35.8, 130],
  ]),
  'port:soviet_far_east|japansea': vladivostok,
  'port:vladivostok|japansea': vladivostok,
  'port:naples|sicily': passage('티레니아해·시칠리아 서방', 'sicily', [[40, 13.2], [38.7, 12.4], [37.5, 11.7], [36.1, 12.5]]),
  'port:salerno|sicily': passage('티레니아해·시칠리아 서방', 'sicily', [
    [39.5, 14.2], [38.5, 13.8], [38.5, 12], [37.5, 11.6], [36.1, 12.5],
  ]),
  'port:taranto|sicily': taranto,
  'port:italy|sicily': taranto,
  'port:messina|sicily': passage('메시나 남방·이오니아해', 'sicily', [
    [38.15, 15.6], [38.1, 15.61], [38, 15.6], [37.85, 15.7], [37.2, 15.7], [36.2, 15.7],
  ]),
  'port:tunis|sicily': passage('튀니스만·시칠리아 남방', 'sicily', [[37.2, 10.7], [37.4, 11.6], [37.1, 12.6], [36.1, 13]]),
  'port:denmark|baltic': { name: '카테가트·외레순', points: oresund },
  'port:leningrad|baltic': passage('핀란드만·발트해', 'baltic', [[60.08, 29.2], [60.08, 28.9], [60, 28.6], [60, 28], [59.8, 26], [59.5, 23], [58.5, 21]]),
  'port:basra|arabian': passage('페르시아만·호르무즈·오만만', 'arabian', [
    [29.4, 49.2], [28.5, 50.5], [27.5, 51.8], [26.6, 53.2], [26.05, 54.3], [26.05, 55.3],
    [26.6, 56.1], [26.55, 56.6], [25.8, 56.9], [25, 58], [23.5, 59.5], [22, 60.5],
  ]),
};

function waypointKey(waypoint: NavalWaypoint): string {
  if (waypoint.id.startsWith('port:')) return waypoint.id;
  return waypoint.territoryId ? `port:${waypoint.id}` : waypoint.id;
}

function valid(point: NavalWaypoint): boolean {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
}

/**
 * Refine an existing physical leg only; this does not invent graph adjacency.
 * Endpoints retain their original object identity and metadata. Uncatalogued
 * valid legs remain unchanged; invalid coordinates fail closed with no route.
 * Stable generated IDs and basin assignments are identical in both directions.
 */
export function refineNavalLeg(from: NavalWaypoint, to: NavalWaypoint): NavalWaypoint[] {
  if (!valid(from) || !valid(to)) return [];
  const forwardKey = `${waypointKey(from)}|${waypointKey(to)}`;
  const reverseKey = `${waypointKey(to)}|${waypointKey(from)}`;
  const key = corridors[forwardKey] ? forwardKey : reverseKey;
  const corridor = corridors[key];
  if (!corridor) return [from, to];
  const intermediates = corridor.points.map((point, index): NavalWaypoint => ({
    ...point,
    id: `corridor-v${NAVAL_ROUTE_GEOMETRY_VERSION}:${key}:${index + 1}`,
    name: `${corridor.name} · ${index + 1}`,
  }));
  return [from, ...(key === forwardKey ? intermediates : intermediates.reverse()), to];
}
