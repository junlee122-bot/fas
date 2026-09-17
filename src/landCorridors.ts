import type { GeographicCoordinate } from './territoryGeography';
import { europeanLandCorridors } from './landCorridorsEurope';
import { asianLandCorridors } from './landCorridorsAsia';
import { mediterraneanLandCorridors } from './landCorridorsMediterranean';

const point = (latitude: number, longitude: number): GeographicCoordinate => ({ latitude, longitude });

/**
 * Display-only mainland control points, audited against the game's Natural
 * Earth 1:10m physical vectors. They preserve strategic adjacency, but are NOT
 * surveyed roads/railways, documented 1942 movement, border permissions, or
 * an assertion that travel time in the land engine follows this geometry.
 * https://www.naturalearthdata.com/downloads/10m-physical-vectors/
 * Audit: node scripts/audit-land-route-geography.mjs --compact --all
 */

// Original Korean mainland hints retained without changing their coordinates.
const koreanNorthApproach = [
  point(39.021, 125.753), // Pyongyang
  point(39.62, 125.66), // Anju: inland of Korea Bay
  point(40.086, 124.421), // Sinuiju
  point(40.13, 124.4), // Dandong / Yalu crossing
  point(40.45, 124.07), // Fengcheng
];
const shenyangApproach = [...koreanNorthApproach, point(41.805, 123.432)];
const northernBohai = [
  point(41.1, 121.1), // Jinzhou
  point(40.75, 120.75), // Huludao, inland of Liaodong Bay
  point(40.03, 119.75), // Shanhaiguan
  point(39.63, 118.18), // Tangshan
];
const dalianSouthernApproach = [
  point(41.27, 123.18), point(40.4, 122.35), point(39.5, 122.1),
  point(39.35, 122.15), point(39.1, 121.72), point(39.02, 121.65),
  point(38.98, 121.55), point(38.9, 121.55), point(38.9, 121.628),
];
const koreaToDalian = [...shenyangApproach, ...dalianSouthernApproach];

// Mainland peninsular corridor: do not take a diagonal across the Gulf of Siam.
const bangkok = point(13.752, 100.515);
const thaiMalayPeninsula = [
  point(13.82, 100.06), point(13.54, 99.82), // west of the Bangkok Bight
  point(13.11, 99.94), // Phetchaburi area
  point(12, 99.6), point(11.8, 99.5), // inland of Prachuap's coastal arc
  point(11.4, 99.3), point(10.9, 99.2), point(10.49, 99.05), // Chumphon hinterland
  point(10, 98.9), point(9.5, 98.8), point(9.14, 99.05), // west of Bandon Bay
  point(8.16, 99.68), // Thung Song area
  point(7.6, 99.85), // west of Songkhla lagoon
  point(7, 100.47), // Hat Yai area
  point(6.12, 100.37), // Alor Setar area
  point(4.6, 101.08), // Ipoh area
];
const hanoi = point(21.035, 105.848);
const vientiane = point(17.97, 102.6);
const vientianeToBangkok = [point(17.41, 102.79), point(16.44, 102.84), point(14.98, 102.1), bangkok];
// Inland Mekong-region points deliberately avoid the Vietnamese coastal chord.
const saigonToVientiane = [
  point(11.99, 105.46), // Kampong Cham area
  point(12.49, 106.02), // Kratie area
  point(13.52, 105.97), // Stung Treng area
  point(15.12, 105.78), // Pakse area
  point(16.56, 104.75), // Savannakhet area
  vientiane,
];
const hanoiToGuangzhou = [
  point(21.85, 106.76), // Lang Son
  point(22.82, 108.32), // Nanning
  point(23.48, 111.3), // Wuzhou
  point(23.05, 112.47), // Zhaoqing
];

// Gulf of Sidra/Gabes: inland bands, not a claim about a coastal highway.
const sirteToTripoli = [point(31.1, 16.5), point(31, 15.5), point(31.8, 14.8), point(32.45, 14.2), point(32.7, 13.18)];
const tripoliToTunis = [
  point(32.6, 12.2), point(32.9, 11.4), // south of the Tripolitanian coast
  point(33.4, 10.5), point(33.8, 9.9), // inland of Gabes
  point(34.42, 8.78), // Gafsa area
  point(35.68, 10.1), // Kairouan area
  point(36.803, 10.18), // Tunis
];
const agheilaToSirte = [point(30.1, 18.8), point(30.4, 17.5), point(31, 16.7), point(31.21, 16.59)];

// The Black Sea mainland approach reaches Crimea through the Perekop isthmus.
// Large river crossings remain abstract; no bridge/ferry availability is implied.
const bucharest = point(44.435, 26.098);
const bucharestToCrimea = [
  point(45.43, 28.05), point(45.68, 28.62), point(46.19, 29.15), // Danube hinterland
  point(46.492, 30.708), // Odesa
  point(47.2, 30.91), point(47.56, 31.34), // north of the Dnieper–Bug estuary
  point(46.97, 32), point(46.635, 32.616), // Mykolaiv / Kherson areas
  point(46.36, 33.54), point(46.16, 33.69), // Chaplynka / Perekop
  point(45.71, 34.39), point(44.95, 34.1), // Dzhankoy / Simferopol
];

/** Keys are authored in one direction; the accessor reverses copies safely. */
export const coreLandCorridors: Readonly<Record<string, readonly GeographicCoordinate[]>> = {
  'korea|pyongyang': [point(37.97, 126.56)],
  'korea|sinuiju': koreanNorthApproach.slice(0, 2),
  'korea|manchuria': koreanNorthApproach,
  'korea|harbin': [...shenyangApproach, point(43.867, 125.338)],
  'korea|north_china': [...shenyangApproach, ...northernBohai],
  'korea|tianjin': [...shenyangApproach, ...northernBohai],
  'korea|dalian': koreaToDalian,

  // Baseline audit's 20 longest mainland water chords (Penang island excluded).
  'calcutta|madras': [
    point(22.35, 87.23), point(21.49, 86.93), point(20.3, 85.82), // Kharagpur / Balasore / Bhubaneswar
    point(20.13, 85.1), point(19.7, 84.9), // inland of Chilika lagoon
    point(19.31, 84.79), point(18.32, 83.9), point(18.12, 83.4), // Berhampur / Srikakulam / Vizianagaram
    point(17.8, 83.2), point(17.69, 83), // inland of Visakhapatnam Bay / Anakapalle
    point(16.51, 80.65), point(16.3, 80.44), point(15.5, 80), // Vijayawada / Guntur / Ongole
    point(14.92, 79.98), point(14.44, 79.99), // Kavali / Nellore
    point(14.15, 79.85), point(13.7, 80.02), point(13.59, 80), point(13.4, 80.12), // west of Pulicat lagoon
  ],
  'saigon|south_china': [...saigonToVientiane, hanoi, ...hanoiToGuangzhou],
  'libya|tunisia': [...sirteToTripoli, ...tripoliToTunis, point(37.05, 9.65), point(37.26, 9.7), point(37.28, 9.8)],
  'bangkok|malaya': thaiMalayPeninsula,
  'burma|india': [
    point(17.33, 96.48), point(18.94, 96.43), point(21.98, 96.08), // Bago / Toungoo / Mandalay
    point(22.11, 95.13), point(23.2, 94.3), // Monywa / Kalewa
    point(24.82, 93.94), point(25.9, 93.73), // Imphal / Dimapur
    point(26.14, 91.74), point(26.72, 88.4), point(25.61, 85.14), // Guwahati / Siliguri / Patna
  ],
  'darwin|townsville': [
    point(-12.55, 131.12), point(-12.85, 131.13), // inland of Darwin Harbour
    point(-14.47, 132.27), point(-16.25, 133.37), // Katherine / Daly Waters
    point(-19.65, 134.19), point(-20.73, 139.49), // Tennant Creek / Mount Isa
    point(-20.7, 140.5), point(-20.08, 146.26), // Cloncurry / Charters Towers
  ],
  'indochina|malaya': [vientiane, ...vientianeToBangkok, ...thaiMalayPeninsula],
  'saigon|malaya': [...saigonToVientiane.slice(0, 3), point(14.88, 103.49), point(14.98, 102.1), bangkok, ...thaiMalayPeninsula],
  'busan|dalian': [point(35.87, 128.6), point(36.35, 127.38), point(37.568, 126.998), ...koreaToDalian],
  'burma|malaya': [
    point(17.33, 96.48), point(18, 96.8), point(17.8, 97), point(17.3, 97.05), // north of the Sittaung estuary
    point(16.93, 97.37), point(16.88, 97.64), // Thaton / Hpa-An hinterland
    point(16.55, 98.23), point(16.71, 98.57), point(16.88, 99.13), // Kawkareik / Mae Sot / Tak
    point(15.7, 100.12), bangkok, ...thaiMalayPeninsula,
  ],
  'tripoli|tunis': tripoliToTunis.slice(0, -1),
  'baku|tehran': [
    point(40.4, 49.5), point(39.95, 49.2), point(39.6, 48.98), // inland Absheron / Alat / Salyan
    point(38.75, 48.7), point(38.43, 48.75), // Lankaran / Astara hinterland
    point(37.8, 48.85), point(37.36, 49.12), // Talesh / Masal, inland of the Caspian arc
    point(37.28, 49.59), point(36.27, 50), // Rasht / Qazvin
  ],
  'manchuria|shandong': [...northernBohai, point(39.12, 117.2), point(38.3, 116.84), point(37.45, 116.3)],
  'anatolia|caucasus': [
    point(40.317, 36.554), point(39.75, 39.49), point(39.9, 41.27), // Tokat / Erzincan / Erzurum
    point(40.61, 43.1), point(41.72, 44.79), // Kars / Tbilisi
    point(42.66, 44.64), point(43.02, 44.68), // Kazbegi / Vladikavkaz
  ],
  'baku|stalingrad': [
    point(40.63, 48.64), point(41.36, 48.52), point(42.06, 48), // Shamakhi / Quba / Derbent hinterland
    point(42.98, 47.3), point(43.85, 46.71), point(46.31, 44.27), // Makhachkala / Kizlyar / Elista
  ],
  'el_agheila|kasserine': [...agheilaToSirte, ...sirteToTripoli, ...tripoliToTunis.slice(0, 5)],
  'balkans|crimea': [bucharest, ...bucharestToCrimea],
  'arakan|calcutta': [
    point(20.6, 93.19), point(20.82, 92.37), point(20.86, 92.3), // Mrauk-U / Maungdaw / Teknaf
    point(21.43, 91.98), point(21.76, 92.08), point(22, 92.1), // Cox's Bazar / Chakaria / Lohagara
    point(22.08, 92.08), point(22.3, 91.98), point(22.36, 91.78), // Satkania / Patiya / Chittagong
    point(23.46, 91.18), // Comilla
    point(23.71, 90.41), point(23.16, 89.21), // Dhaka / Jessore
  ],
  'bucharest|crimea': bucharestToCrimea,
  'haiphong|saigon': [hanoi, ...[...saigonToVientiane].reverse()],

  // Reuse the verified Liaodong/Yalu approach for the second Korea Bay chord.
  'pyongyang|dalian': [...shenyangApproach.slice(1), ...dalianSouthernApproach],
};

export const landCorridors: Readonly<Record<string, readonly GeographicCoordinate[]>> = {
  ...coreLandCorridors,
  ...europeanLandCorridors,
  ...asianLandCorridors,
  ...mediterraneanLandCorridors,
};

/** Fresh points prevent rendering consumers from mutating the corridor catalog. */
export function getLandCorridorWaypoints(fromId: string, toId: string): GeographicCoordinate[] {
  if (!fromId || !toId || fromId === toId) return [];
  const direct = landCorridors[`${fromId}|${toId}`];
  const reverse = landCorridors[`${toId}|${fromId}`];
  const points = (direct ?? reverse ?? []).map((item) => ({ ...item }));
  return direct ? points : points.reverse();
}
