import type { MapCamera } from './mapPresentation';
import { DEFAULT_MAP_CAMERA, MAX_MAP_ZOOM } from './mapPresentation';

export interface MapScreenPoint { id: string; x: number; y: number; frame: string }
export interface MapPointCluster { id: string; anchor: MapScreenPoint; members: MapScreenPoint[] }

function safeZoom(value: number, fallback = DEFAULT_MAP_CAMERA.zoom): number {
  return Number.isFinite(value) ? Math.max(1, Math.min(MAX_MAP_ZOOM, value)) : fallback;
}

function safeScale(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.max(.001, value) : 1;
}

/** Greedy bounded-radius groups: proximity never joins unrelated sheet frames. */
export function clusterMapPoints(points: MapScreenPoint[], pixelsPerUnit: number, selectedId?: string, radiusPixels = 28): MapPointCluster[] {
  const scale = safeScale(pixelsPerUnit);
  const radius = Number.isFinite(radiusPixels) ? Math.max(0, radiusPixels) : 28;
  const ordered = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || a.id.localeCompare(b.id));
  const groups: MapPointCluster[] = [];
  for (const point of ordered) {
    const group = groups.find((candidate) => candidate.anchor.frame === point.frame
      && Math.hypot(candidate.anchor.x - point.x, candidate.anchor.y - point.y) * scale < radius);
    if (group) group.members.push(point);
    else groups.push({ id: point.id, anchor: point, members: [point] });
  }
  return groups;
}

export function getMapScreenScale(width: number, height: number, camera: MapCamera): number {
  // A hidden/unmeasured container must not create NaN transforms or huge glyphs.
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 1;
  const zoom = safeZoom(camera.zoom);
  return safeScale(Math.min(width / (1200 / zoom), height / (760 / zoom)));
}

export function zoomCameraAtPoint(camera: MapCamera, point: { x: number; y: number }, nextZoom: number): MapCamera {
  const currentZoom = safeZoom(camera.zoom);
  const zoom = safeZoom(nextZoom, currentZoom);
  const currentX = Number.isFinite(camera.centerX) ? camera.centerX : DEFAULT_MAP_CAMERA.centerX;
  const currentY = Number.isFinite(camera.centerY) ? camera.centerY : DEFAULT_MAP_CAMERA.centerY;
  if (zoom === currentZoom) return { zoom, centerX: currentX, centerY: currentY };
  const validAnchor = Number.isFinite(point.x) && Number.isFinite(point.y);
  const anchor = validAnchor ? point : { x: currentX, y: currentY };
  const ratio = currentZoom / zoom;
  const centerX = anchor.x + (currentX - anchor.x) * ratio;
  const centerY = anchor.y + (currentY - anchor.y) * ratio;
  // The caller still clamps the viewport bounds after anchor-preserving zoom.
  return { zoom, centerX: Number.isFinite(centerX) ? centerX : currentX, centerY: Number.isFinite(centerY) ? centerY : currentY };
}

export function screenDeltaToMap(dx: number, dy: number, inverse: { a: number; b: number; c: number; d: number }): { x: number; y: number } {
  if (![dx, dy, inverse.a, inverse.b, inverse.c, inverse.d].every(Number.isFinite)) return { x: 0, y: 0 };
  const x = inverse.a * dx + inverse.c * dy;
  const y = inverse.b * dx + inverse.d * dy;
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : { x: 0, y: 0 };
}

export function ownsKeyboardInput(target: EventTarget | null): boolean {
  const node = target as Element | null;
  const element = typeof node?.closest === 'function' ? node : node?.parentElement;
  return typeof element?.closest === 'function' && !!element.closest('input, textarea, select, button, a[href], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="dialog"], [role="listbox"], [role="tab"], [role="combobox"], [role="textbox"], [role="slider"], [role="spinbutton"]');
}
