import europeMapImage from './assets/european-theater-war-department-1944.jpg';
import farEastMapImage from './assets/far-east-milrose-1943.jpg';
import type { TheaterId } from './types';
import { expandedHistoricalMapPoints } from './strategicMapData';

export interface HistoricalMapSource {
  theater: TheaterId;
  image: string;
  title: string;
  dateLabel: string;
  creator: string;
  archive: string;
  catalogId: string;
  sourceUrl: string;
  rightsLabel: string;
  mapNote: string;
  pixelDimensions: string;
  assetProfile: string;
}

export interface HistoricalMapPoint {
  x: number;
  y: number;
}

export type HistoricalMapFrameId = 'main' | 'pacific-inset';

export interface HistoricalMapPlacement extends HistoricalMapPoint {
  frame: HistoricalMapFrameId;
}

export interface HistoricalMapFrame {
  id: HistoricalMapFrameId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GeographicPoint {
  latitude: number;
  longitude: number;
}

// The 1943 Far East scan is a composite sheet. Its Pacific Ocean inset is a
// separate projection, not a continuation of the large Asia map underneath.
// These bounds are calibrated to the inset's printed graticule after the scan
// is fitted to the 1200 x 760 game viewBox.
export const historicalMapFrames: Record<TheaterId, HistoricalMapFrame[]> = {
  europe: [
    { id: 'main', label: '유럽 본도', x: 0, y: 0, width: 1200, height: 760 },
  ],
  asia: [
    { id: 'main', label: '아시아·극동 본도', x: 0, y: 0, width: 1200, height: 760 },
    { id: 'pacific-inset', label: '태평양 작전 부도', x: 796, y: 317, width: 348, height: 231 },
  ],
};

const pacificInsetPlot = {
  x: 804,
  y: 330,
  width: 329,
  height: 211,
  westLongitude: 100,
  eastLongitude: 290,
  northLatitude: 65,
  southLatitude: -60,
};

function normalizePacificLongitude(longitude: number): number {
  return longitude < pacificInsetPlot.westLongitude ? longitude + 360 : longitude;
}

function projectPacificInset({ latitude, longitude }: GeographicPoint): HistoricalMapPoint {
  const normalizedLongitude = normalizePacificLongitude(longitude);
  const longitudeProgress = (normalizedLongitude - pacificInsetPlot.westLongitude)
    / (pacificInsetPlot.eastLongitude - pacificInsetPlot.westLongitude);
  const latitudeProgress = (pacificInsetPlot.northLatitude - latitude)
    / (pacificInsetPlot.northLatitude - pacificInsetPlot.southLatitude);
  return {
    x: pacificInsetPlot.x + longitudeProgress * pacificInsetPlot.width,
    y: pacificInsetPlot.y + latitudeProgress * pacificInsetPlot.height,
  };
}

// Geographic anchors use the actual locations of the islands and ports. They
// replace the former hand-estimated screen coordinates that put several
// Aleutian, Hawaiian and mandated-island sectors over unrelated land.
const pacificInsetGeography: Record<string, GeographicPoint> = {
  iwo_jima: { latitude: 24.754, longitude: 141.29 },
  palau: { latitude: 7.515, longitude: 134.583 },
  guam: { latitude: 13.444, longitude: 144.794 },
  saipan: { latitude: 15.178, longitude: 145.751 },
  truk: { latitude: 7.446, longitude: 151.847 },
  eniwetok: { latitude: 11.342, longitude: 162.327 },
  wake: { latitude: 19.282, longitude: 166.636 },
  kwajalein: { latitude: 8.717, longitude: 167.733 },
  marshalls: { latitude: 7.117, longitude: 171.183 },
  tarawa: { latitude: 1.452, longitude: 172.972 },
  makin: { latitude: 3.383, longitude: 172.983 },
  attu: { latitude: 52.85, longitude: 173.183 },
  kiska: { latitude: 52.104, longitude: -177.613 },
  midway: { latitude: 28.207, longitude: -177.376 },
  dutch_harbor: { latitude: 53.889, longitude: -166.542 },
  hawaii: { latitude: 21.307, longitude: -157.858 },
};

const pacificInsetPoints = Object.fromEntries(
  Object.entries(pacificInsetGeography).map(([id, point]) => [id, projectPacificInset(point)]),
) as Record<string, HistoricalMapPoint>;

export const historicalTerritoryFrames: Record<TheaterId, Record<string, HistoricalMapFrameId>> = {
  europe: {},
  asia: Object.fromEntries(Object.keys(pacificInsetGeography).map((id) => [id, 'pacific-inset'])) as Record<string, HistoricalMapFrameId>,
};

export const historicalMapSources: Record<TheaterId, HistoricalMapSource> = {
  europe: {
    theater: 'europe',
    image: europeMapImage,
    title: 'Map of the European Theater',
    dateLabel: '1944. 3. 20.',
    creator: '미 육군 전쟁부 Army Orientation Course',
    archive: 'Harry S. Truman Library & Museum',
    catalogId: 'M1753-01',
    sourceUrl: 'https://www.trumanlibrary.gov/maps/m1753-01-map-european-theater',
    rightsLabel: 'PUBLIC DOMAIN',
    mapNote: '전전 국경·1939년 국경·철도·하천이 표시된 전시 제작 지도',
    pixelDimensions: '3,856 × 2,915 px',
    assetProfile: 'ARCHIVAL ORIGINAL',
  },
  asia: {
    theater: 'asia',
    image: farEastMapImage,
    title: 'The Far East and Adjoining Areas',
    dateLabel: '1943',
    creator: 'Robert Winslow · Rand McNally / Milrose Publishing Co.',
    archive: 'Library of Congress, Geography and Map Division',
    catalogId: 'G7400 1943 .W5',
    sourceUrl: 'https://www.loc.gov/item/2006636620/',
    rightsLabel: 'FREE TO USE & REUSE',
    mapNote: '철도·도로·지형과 태평양·인도양 작전권 부도가 수록된 전시 제작 지도',
    pixelDimensions: '10,000 × 7,190 px',
    assetProfile: 'ULTRA ARCHIVAL SCAN',
  },
};

// The scans use historical projections rather than a modern web-map projection.
// These points are hand-calibrated against the printed place names on each scan so
// game markers sit on the archive map without redrawing or replacing its geography.
export const historicalTerritoryPoints: Record<TheaterId, Record<string, HistoricalMapPoint>> = {
  europe: {
    britain: { x: 324, y: 354 },
    atlantic: { x: 155, y: 394 },
    channel: { x: 350, y: 415 },
    france: { x: 418, y: 472 },
    lowlands: { x: 454, y: 403 },
    germany: { x: 526, y: 401 },
    denmark: { x: 526, y: 327 },
    norway: { x: 506, y: 211 },
    finland: { x: 671, y: 225 },
    poland: { x: 633, y: 400 },
    baltic: { x: 695, y: 337 },
    moscow: { x: 839, y: 361 },
    ukraine: { x: 756, y: 482 },
    caucasus: { x: 885, y: 606 },
    alps: { x: 514, y: 500 },
    italy: { x: 559, y: 571 },
    balkans: { x: 666, y: 544 },
    anatolia: { x: 781, y: 626 },
    spain: { x: 350, y: 552 },
    morocco: { x: 286, y: 680 },
    algeria: { x: 438, y: 683 },
    tunisia: { x: 522, y: 664 },
    sicily: { x: 565, y: 640 },
    malta: { x: 590, y: 684 },
    libya: { x: 681, y: 699 },
    egypt: { x: 809, y: 699 },
    levant: { x: 842, y: 649 },
    ...expandedHistoricalMapPoints.europe,
  },
  asia: {
    india: { x: 241, y: 397 },
    ceylon: { x: 253, y: 511 },
    assam: { x: 386, y: 394 },
    burma: { x: 435, y: 445 },
    malaya: { x: 464, y: 545 },
    singapore: { x: 481, y: 584 },
    mongolia: { x: 545, y: 225 },
    china_interior: { x: 522, y: 337 },
    yunnan: { x: 468, y: 406 },
    north_china: { x: 607, y: 298 },
    central_china: { x: 607, y: 370 },
    south_china: { x: 597, y: 431 },
    indochina: { x: 520, y: 484 },
    soviet_far_east: { x: 786, y: 137 },
    manchuria: { x: 700, y: 227 },
    korea: { x: 732, y: 298 },
    japan_home: { x: 803, y: 330 },
    philippines: { x: 679, y: 514 },
    dutch_east_indies: { x: 616, y: 659 },
    new_guinea: { x: 860, y: 650 },
    coral_sea: { x: 954, y: 694 },
    solomons: { x: 1032, y: 625 },
    midway: { x: 998, y: 454 },
    hawaii: { x: 1084, y: 467 },
    ...expandedHistoricalMapPoints.asia,
    ...pacificInsetPoints,
  },
};

export function getHistoricalMapPlacement(
  theater: TheaterId,
  territory: { id: string; x: number; y: number },
): HistoricalMapPlacement {
  const point = historicalTerritoryPoints[theater][territory.id] ?? {
    x: territory.x * 12,
    y: territory.y * 7.6,
  };
  return {
    ...point,
    frame: historicalTerritoryFrames[theater][territory.id] ?? 'main',
  };
}

export function getHistoricalMapPoint(
  theater: TheaterId,
  territory: { id: string; x: number; y: number },
): HistoricalMapPoint {
  const { x, y } = getHistoricalMapPlacement(theater, territory);
  return { x, y };
}
