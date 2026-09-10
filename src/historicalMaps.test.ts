import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getHistoricalMapPlacement, getHistoricalMapPoint, historicalMapFrames, historicalMapSources, historicalTerritoryPoints } from './historicalMaps';

describe('historical theater maps', () => {
  it('uses dated archive sources for both theaters', () => {
    expect(historicalMapSources.europe.catalogId).toBe('M1753-01');
    expect(historicalMapSources.europe.dateLabel).toContain('1944');
    expect(historicalMapSources.asia.catalogId).toBe('G7400 1943 .W5');
    expect(historicalMapSources.asia.dateLabel).toBe('1943');
  });

  it('calibrates every playable territory to its archive scan', () => {
    territories.forEach((territory) => {
      const theater = territory.theater ?? 'europe';
      expect(historicalTerritoryPoints[theater][territory.id], `${territory.id} is calibrated`).toBeDefined();
      const point = getHistoricalMapPoint(theater, territory);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1200);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(760);
    });
  });

  it('contains a dense global network of historically important cities and fronts', () => {
    const names = new Set(territories.map((territory) => territory.name));
    expect(territories).toHaveLength(219);
    expect(new Set(territories.map((territory) => territory.id)).size).toBe(territories.length);
    expect([...names].some((name) => name.includes('스탈린그라드'))).toBe(true);
    expect([...names].some((name) => name.includes('엘알라메인'))).toBe(true);
    expect([...names].some((name) => name.includes('임팔'))).toBe(true);
    expect([...names].some((name) => name.includes('과달카날'))).toBe(true);
    expect([...names].some((name) => name.includes('신징'))).toBe(true);
    expect([...names].some((name) => name.includes('드네프로페트롭스크'))).toBe(true);
    expect(territories.filter((territory) => ['capital', 'city', 'port', 'fortress'].includes(territory.siteType ?? '')).length).toBeGreaterThanOrEqual(130);
  });

  it('projects Pacific islands into the printed Pacific inset instead of unrelated main-map land', () => {
    const pacificFrame = historicalMapFrames.asia.find((frame) => frame.id === 'pacific-inset')!;
    const ids = ['iwo_jima', 'guam', 'saipan', 'truk', 'wake', 'midway', 'hawaii', 'attu', 'kiska', 'dutch_harbor'];

    ids.forEach((id) => {
      const territory = territories.find((item) => item.id === id)!;
      const placement = getHistoricalMapPlacement('asia', territory);
      expect(placement.frame, id).toBe('pacific-inset');
      expect(placement.x, `${id} x`).toBeGreaterThanOrEqual(pacificFrame.x);
      expect(placement.x, `${id} x`).toBeLessThanOrEqual(pacificFrame.x + pacificFrame.width);
      expect(placement.y, `${id} y`).toBeGreaterThanOrEqual(pacificFrame.y);
      expect(placement.y, `${id} y`).toBeLessThanOrEqual(pacificFrame.y + pacificFrame.height);
    });
  });

  it('preserves real west-east and north-south relationships on the Pacific graticule', () => {
    const point = (id: string) => getHistoricalMapPlacement('asia', territories.find((territory) => territory.id === id)!);

    expect(point('guam').x).toBeLessThan(point('wake').x);
    expect(point('wake').x).toBeLessThan(point('hawaii').x);
    expect(point('attu').x).toBeLessThan(point('kiska').x);
    expect(point('kiska').x).toBeLessThan(point('dutch_harbor').x);
    expect(point('attu').y).toBeLessThan(point('midway').y);
    expect(point('midway').y).toBeLessThan(point('tarawa').y);
    expect(point('japan_home').frame).toBe('main');
  });
});
