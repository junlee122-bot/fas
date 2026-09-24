import { describe, expect, it } from 'vitest';
import { clusterMapPoints, getMapScreenScale, ownsKeyboardInput, screenDeltaToMap, zoomCameraAtPoint } from './mapInteraction';

describe('map interaction contracts', () => {
  it('fits the full overview on a portrait screen without independent axis scaling', () => {
    expect(getMapScreenScale(390, 630, { centerX: 600, centerY: 380, zoom: 1 })).toBeCloseTo(.325);
    expect(screenDeltaToMap(100, 100, { a: 1 / .325, b: 0, c: 0, d: 1 / .325 })).toEqual({ x: 100 / .325, y: 100 / .325 });
  });
  it('uses the meet scale in landscape layouts and applies camera zoom once', () => {
    const camera = { centerX: 600, centerY: 380, zoom: 1 };
    expect(getMapScreenScale(1800, 760, camera)).toBe(1);
    expect(getMapScreenScale(1200, 760, { ...camera, zoom: 3 })).toBe(3);
    expect(getMapScreenScale(390, 630, { ...camera, zoom: 2 })).toBeCloseTo(.65);
  });
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('uses a neutral scale for invalid container size %s', (size) => {
    const camera = { centerX: 600, centerY: 380, zoom: 2 };
    expect(getMapScreenScale(size, 760, camera)).toBe(1);
    expect(getMapScreenScale(1200, size, camera)).toBe(1);
  });
  it('does not propagate invalid zoom through the measured screen scale', () => {
    expect(getMapScreenScale(1200, 760, { centerX: 600, centerY: 380, zoom: Number.NaN })).toBe(1);
    expect(getMapScreenScale(1200, 760, { centerX: 600, centerY: 380, zoom: 0 })).toBe(1);
  });
  it('keeps the pointer anchor fixed during zoom', () => {
    const camera = { centerX: 600, centerY: 380, zoom: 2 };
    const next = zoomCameraAtPoint(camera, { x: 700, y: 430 }, 4);
    expect(next).toEqual({ centerX: 650, centerY: 405, zoom: 4 });
    expect(zoomCameraAtPoint(camera, { x: 600, y: 380 }, 20).zoom).toBe(6);
  });
  it('preserves anchor screen offsets when zooming in and out', () => {
    const camera = { centerX: 600, centerY: 380, zoom: 2 };
    const anchor = { x: 710, y: 290 };
    [1, 3, 6].forEach((zoom) => {
      const next = zoomCameraAtPoint(camera, anchor, zoom);
      expect((anchor.x - next.centerX) * next.zoom).toBeCloseTo((anchor.x - camera.centerX) * camera.zoom);
      expect((anchor.y - next.centerY) * next.zoom).toBeCloseTo((anchor.y - camera.centerY) * camera.zoom);
    });
  });
  it('ignores invalid zoom requests and falls back to centered zoom for invalid anchors', () => {
    const camera = { centerX: 600, centerY: 380, zoom: 2 };
    expect(zoomCameraAtPoint(camera, { x: 700, y: 430 }, Number.NaN)).toEqual(camera);
    expect(zoomCameraAtPoint(camera, { x: Number.NaN, y: 430 }, 4)).toEqual({ ...camera, zoom: 4 });
    const recovered = zoomCameraAtPoint({ centerX: Number.NaN, centerY: Number.POSITIVE_INFINITY, zoom: Number.NaN }, { x: 600, y: 380 }, 2);
    expect(recovered).toEqual({ centerX: 600, centerY: 380, zoom: 2 });
  });
  it('groups close islands but never merges main-map and inset coordinates', () => {
    const points = [{ id: 'guam', x: 881, y: 417, frame: 'pacific-inset' }, { id: 'saipan', x: 883, y: 414, frame: 'pacific-inset' }, { id: 'main', x: 883, y: 414, frame: 'main' }];
    const clusters = clusterMapPoints(points, 2, 'saipan');
    expect(clusters).toHaveLength(2);
    expect(clusters[0].anchor.id).toBe('saipan');
    expect(clusters[0].members.map((point) => point.id)).toEqual(['saipan', 'guam']);
    expect(clusters.flatMap((cluster) => cluster.members)).toHaveLength(points.length);
  });
  it('separates close points when their screen distance becomes sufficient', () => {
    const points = [{ id: 'a', x: 0, y: 0, frame: 'main' }, { id: 'b', x: 10, y: 0, frame: 'main' }];
    expect(clusterMapPoints(points, 1)).toHaveLength(1);
    expect(clusterMapPoints(points, 4)).toHaveLength(2);
  });
  it('bounds cluster radius at its anchor instead of chaining neighboring groups', () => {
    const points = [0, 20, 40].map((x, index) => ({ id: String(index), x, y: 0, frame: 'main' }));
    const clusters = clusterMapPoints(points, 1);
    expect(clusters.map((cluster) => cluster.members.map((point) => point.id))).toEqual([['0', '1'], ['2']]);
    expect(clusterMapPoints([...points].reverse(), 1)).toEqual(clusters);
    expect(points.map((point) => point.id)).toEqual(['0', '1', '2']);
    expect(clusterMapPoints(points, 1, '1')[0].members).toHaveLength(3);
  });
  it('keeps points at the exact radius boundary separate', () => {
    const points = [{ id: 'a', x: 0, y: 0, frame: 'main' }, { id: 'b', x: 14, y: 0, frame: 'main' }];
    expect(clusterMapPoints(points, 2, undefined, 28)).toHaveLength(2);
    expect(clusterMapPoints(points, 1, undefined, 0)).toHaveLength(2);
    expect(clusterMapPoints(points, 1, undefined, -1)).toHaveLength(2);
  });
  it('ignores non-finite positions and uses stable defaults for invalid clustering measurements', () => {
    const points = [
      { id: 'a', x: 0, y: 0, frame: 'main' },
      { id: 'b', x: 10, y: 0, frame: 'main' },
      { id: 'invalid', x: Number.NaN, y: 0, frame: 'main' },
      { id: 'infinite', x: 10, y: Number.POSITIVE_INFINITY, frame: 'main' },
    ];
    const clusters = clusterMapPoints(points, Number.NaN, 'invalid', Number.NaN);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].members.map((point) => point.id)).toEqual(['a', 'b']);
    expect(clusterMapPoints(points, -1)).toEqual(clusters);
    expect(clusterMapPoints([], 1)).toEqual([]);
  });
  it('transforms pointer deltas with inverse rotation/shear without applying translation', () => {
    const inverse = { a: 0, b: -2, c: 3, d: 0, e: 900, f: 500 };
    expect(screenDeltaToMap(10, 20, inverse)).toEqual({ x: 60, y: -20 });
    expect(screenDeltaToMap(0, 0, inverse)).toEqual({ x: 0, y: 0 });
  });
  it('does not corrupt camera movement with non-finite pointer or matrix values', () => {
    const inverse = { a: 1, b: 0, c: 0, d: 1 };
    expect(screenDeltaToMap(Number.NaN, 10, inverse)).toEqual({ x: 0, y: 0 });
    expect(screenDeltaToMap(10, 20, { ...inverse, c: Number.POSITIVE_INFINITY })).toEqual({ x: 0, y: 0 });
    expect(screenDeltaToMap(Number.MAX_VALUE, 20, { ...inverse, a: 2 })).toEqual({ x: 0, y: 0 });
  });
  it('recognizes SVG and nested interactive controls as owners of keyboard input', () => {
    const target = { closest: (selector: string) => selector.includes('[role="button"]') ? {} : null } as unknown as EventTarget;
    expect(ownsKeyboardInput(target)).toBe(true);
    expect(ownsKeyboardInput(null)).toBe(false);
    expect(ownsKeyboardInput({} as EventTarget)).toBe(false);
  });
  it('recognizes inherited editable areas, custom input roles and text-node targets', () => {
    const parent = { closest: (selector: string) => selector.includes('[contenteditable]:not([contenteditable="false"])') ? {} : null };
    expect(ownsKeyboardInput({ parentElement: parent } as unknown as EventTarget)).toBe(true);
    const combobox = { closest: (selector: string) => selector.includes('[role="combobox"]') ? {} : null };
    expect(ownsKeyboardInput(combobox as unknown as EventTarget)).toBe(true);
  });
});
