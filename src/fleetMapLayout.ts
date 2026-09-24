/** Map-space center; width/height remain CSS pixels at every camera zoom. */
export interface FleetMapObstacle { x: number; y: number; width: number; height: number }
export interface FleetMapAnchor { id: string; x: number; y: number }
export interface FleetMapViewport { x: number; y: number; width: number; height: number }
export interface FleetMapChipPlacement {
  id: string;
  /** Screen-pixel offsets from the unchanged geographic anchor. */
  offsetX: number;
  offsetY: number;
}

export const FLEET_MAP_CHIP_SIZE = 40;
const GAP = 6;
const HALF = FLEET_MAP_CHIP_SIZE / 2;
const DIRECTIONS = [
  [1, 0], [Math.SQRT1_2, Math.SQRT1_2], [0, 1], [-Math.SQRT1_2, Math.SQRT1_2],
  [-1, 0], [-Math.SQRT1_2, -Math.SQRT1_2], [0, -1], [Math.SQRT1_2, -Math.SQRT1_2],
] as const;
const validPoint = (point: { x: number; y: number }) => Number.isFinite(point.x) && Number.isFinite(point.y);
const validRect = (rect: FleetMapViewport) => validPoint(rect) && Number.isFinite(rect.width) && Number.isFinite(rect.height)
  && rect.width > 0 && rect.height > 0;

/**
 * Deterministic, render-only chip placement. No game coordinates are changed.
 * Work in CSS pixels so both clearance and hit target size survive zooming.
 * If a physically tiny viewport cannot fit another unobstructed target, omit
 * that chip instead of blocking a city; the full FleetLocationList is retained.
 */
export function layoutFleetMapChips(
  anchors: readonly FleetMapAnchor[],
  obstacles: readonly FleetMapObstacle[] = [],
  symbolScale = 1,
  viewport?: FleetMapViewport,
): FleetMapChipPlacement[] {
  const scale = Number.isFinite(symbolScale) && symbolScale > 0 ? symbolScale : 1;
  const fleetAnchors = anchors.filter(validPoint).map((item) => ({ ...item, x: item.x / scale, y: item.y / scale }))
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const blocked = obstacles.filter(validRect).map((item) => ({ ...item, x: item.x / scale, y: item.y / scale }));
  const bounds = viewport && validRect(viewport) ? {
    left: viewport.x / scale + GAP + HALF, top: viewport.y / scale + GAP + HALF,
    right: (viewport.x + viewport.width) / scale - GAP - HALF,
    bottom: (viewport.y + viewport.height) / scale - GAP - HALF,
  } : undefined;
  const results: FleetMapChipPlacement[] = [];
  const placed: FleetMapObstacle[] = [];

  for (const anchor of fleetAnchors) {
    const clustered = fleetAnchors.some((other) => other.id !== anchor.id
      && Math.abs(other.x - anchor.x) < FLEET_MAP_CHIP_SIZE + GAP
      && Math.abs(other.y - anchor.y) < FLEET_MAP_CHIP_SIZE + GAP);
    const free = (x: number, y: number) => {
      if (bounds && (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom)) return false;
      if (blocked.some((rect) => Math.abs(x - rect.x) < HALF + rect.width / 2 + GAP
        && Math.abs(y - rect.y) < HALF + rect.height / 2 + GAP)) return false;
      if (placed.some((rect) => Math.abs(x - rect.x) < FLEET_MAP_CHIP_SIZE + GAP
        && Math.abs(y - rect.y) < FLEET_MAP_CHIP_SIZE + GAP)) return false;
      // Stacked fleets have a small visible exact-position pin underneath
      // their separate chips, rather than hiding that shared anchor entirely.
      return !clustered || Math.hypot(x - anchor.x, y - anchor.y) >= HALF + 8;
    };
    let chosen: { x: number; y: number } | undefined;
    if (free(anchor.x, anchor.y)) chosen = anchor;
    // Nearby, stable compass slots first; avoid visual label jumping when
    // selection, input order, fuel or navigation status changes.
    for (let ring = 1; !chosen && ring <= 10; ring += 1) {
      const radius = ring * (FLEET_MAP_CHIP_SIZE + GAP + 2);
      for (const [dx, dy] of DIRECTIONS) {
        const x = anchor.x + dx * radius, y = anchor.y + dy * radius;
        if (free(x, y)) { chosen = { x, y }; break; }
      }
    }
    if (!chosen && bounds && bounds.right >= bounds.left && bounds.bottom >= bounds.top) {
      // Finite fallback for dense ports / map edges. Find the closest free
      // grid slot without making click targets smaller or overlapping cities.
      let bestDistance = Infinity;
      for (let y = bounds.top; y <= bounds.bottom; y += FLEET_MAP_CHIP_SIZE + GAP) {
        for (let x = bounds.left; x <= bounds.right; x += FLEET_MAP_CHIP_SIZE + GAP) {
          const distance = (x - anchor.x) ** 2 + (y - anchor.y) ** 2;
          if (distance < bestDistance && free(x, y)) { chosen = { x, y }; bestDistance = distance; }
        }
      }
    }
    if (!chosen) continue;
    placed.push({ ...chosen, width: FLEET_MAP_CHIP_SIZE, height: FLEET_MAP_CHIP_SIZE });
    results.push({ id: anchor.id, offsetX: chosen.x - anchor.x, offsetY: chosen.y - anchor.y });
  }
  return results;
}
