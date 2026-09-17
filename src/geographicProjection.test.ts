import { describe, expect, it } from 'vitest';
import {
  geographicBounds,
  getGeographicPlotBounds,
  isGeographicPointInBounds,
  projectGeographicPoint,
  unprojectGeographicPoint,
  unwrapGeographicLongitude,
} from './geographicProjection';

describe('shared physical map projection', () => {
  it.each(['europe', 'asia'] as const)('centers %s and uses one uniform geographic scale', (theater) => {
    const bounds = geographicBounds[theater];
    const center = projectGeographicPoint(theater, {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.west + bounds.east) / 2,
    });
    expect(center.x).toBeCloseTo(600, 8);
    expect(center.y).toBeCloseTo(380, 8);
    const plot = getGeographicPlotBounds(theater);
    expect(plot.x).toBeGreaterThanOrEqual(24);
    expect(plot.y).toBeGreaterThanOrEqual(24);
    expect(plot.x + plot.width).toBeLessThanOrEqual(1176);
    expect(plot.y + plot.height).toBeLessThanOrEqual(736);
  });

  it.each([
    ['europe', 51.5074, -0.1278],
    ['europe', 30.0444, 31.2357],
    ['asia', 37.5665, 126.978],
    ['asia', 21.3069, -157.8583],
    ['asia', -9.4456, 147.1803],
  ] as const)('round-trips %s latitude %s longitude %s without a pixel fit', (theater, latitude, longitude) => {
    const projected = projectGeographicPoint(theater, { latitude, longitude });
    const recovered = unprojectGeographicPoint(theater, projected);
    expect(recovered.latitude).toBeCloseTo(latitude, 9);
    expect(recovered.longitude).toBeCloseTo(longitude, 9);
    expect(isGeographicPointInBounds(theater, { latitude, longitude })).toBe(true);
  });

  it('keeps Pacific routes continuous across 180 degrees', () => {
    expect(unwrapGeographicLongitude('asia', -157.8583)).toBeCloseTo(202.1417);
    const west = projectGeographicPoint('asia', { latitude: 20, longitude: 179.9 });
    const east = projectGeographicPoint('asia', { latitude: 20, longitude: -179.9 });
    expect(east.x).toBeGreaterThan(west.x);
    expect(east.x - west.x).toBeLessThan(2);
  });

  it('does not move an out-of-theater city onto the map edge', () => {
    const outside = { latitude: -50, longitude: 100 };
    expect(isGeographicPointInBounds('asia', outside)).toBe(false);
    expect(projectGeographicPoint('asia', outside).y).toBeGreaterThan(760);
  });

  it('places Seoul west of Tokyo and north of Shanghai', () => {
    const seoul = projectGeographicPoint('asia', { latitude: 37.5665, longitude: 126.978 });
    const tokyo = projectGeographicPoint('asia', { latitude: 35.6762, longitude: 139.6503 });
    const shanghai = projectGeographicPoint('asia', { latitude: 31.2304, longitude: 121.4737 });
    expect(seoul.x).toBeLessThan(tokyo.x);
    expect(seoul.y).toBeLessThan(shanghai.y);
  });

  it('rejects invalid coordinates rather than returning NaN paths', () => {
    expect(() => projectGeographicPoint('asia', { latitude: NaN, longitude: 125 })).toThrow(RangeError);
    expect(() => projectGeographicPoint('asia', { latitude: 30, longitude: Infinity })).toThrow(RangeError);
    expect(isGeographicPointInBounds('asia', { latitude: NaN, longitude: 125 })).toBe(false);
  });
});
