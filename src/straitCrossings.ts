import type { GeographicCoordinate } from './territoryGeography';

const point = (latitude: number, longitude: number): GeographicCoordinate => ({ latitude, longitude });
const asianBank = point(41.026, 29.015); // Üsküdar shore
const europeanBank = point(41.041, 29.003); // Beşiktaş shore
const ankaraApproach = [point(40.19, 31.92), point(40.73, 31.61), point(40.78, 30.4),
  point(40.91, 29.83), point(41.02, 29.13), asianBank];
const thraceApproach = [europeanBank, point(41.09, 28.8), point(41.3, 28.01),
  point(41.67, 26.56), point(42.14, 24.75)];

/** Display-only strategic access, not a surveyed ferry/road service or engine port.
 * No fixed Bosphorus road crossing existed in the 1942 baseline: the first opened
 * in 1973 (KGM history). Calendar passage alone does not build a bridge in-game.
 * https://www.kgm.gov.tr/Sayfalar/KGM/SiteEng/Root/Gdh/GdhHistory.aspx
 */
export const STRAIT_CROSSINGS = {
  'anatolia|balkans': { water: [asianBank, europeanBank], fromAccess: ankaraApproach,
    toAccess: [...thraceApproach, point(42.697, 23.321)] },
  'anatolia|sofia': { water: [asianBank, europeanBank], fromAccess: ankaraApproach,
    toAccess: thraceApproach },
} satisfies Record<string, { water: GeographicCoordinate[]; fromAccess: GeographicCoordinate[]; toAccess: GeographicCoordinate[] }>;

export function getStraitCrossing(from: string, to: string) {
  const catalog: Readonly<Record<string, typeof STRAIT_CROSSINGS['anatolia|sofia']>> = STRAIT_CROSSINGS;
  const forward = Object.hasOwn(catalog, `${from}|${to}`) ? catalog[`${from}|${to}`] : undefined;
  const reverse = Object.hasOwn(catalog, `${to}|${from}`) ? catalog[`${to}|${from}`] : undefined;
  const entry = forward ?? reverse;
  if (!entry) return undefined;
  const copy = (points: readonly GeographicCoordinate[]) => points.map((item) => ({ ...item }));
  return forward ? { water: copy(entry.water), fromAccess: copy(entry.fromAccess), toAccess: copy(entry.toAccess) }
    : { water: copy(entry.water).reverse(), fromAccess: copy(entry.toAccess).reverse(), toAccess: copy(entry.fromAccess).reverse() };
}
