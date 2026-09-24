import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { findSeaTransportRoute, isSeaTransportEndpoint } from './seaTransport';
import { getSeaTransportDestinations } from './seaTransportPlanning';
import type { Territory } from './types';

const uncached = (fromId: string, snapshot: readonly Territory[]) => snapshot.filter((territory) => findSeaTransportRoute(fromId, territory.id, snapshot));

describe('sea transport immutable-snapshot destination cache', () => {
  it('matches uncached route BFS for every live coastal origin in both theaters', () => {
    for (const origin of territories.filter(isSeaTransportEndpoint)) {
      const actual = getSeaTransportDestinations(origin.id, territories);
      expect(actual.map((territory) => territory.id), origin.id).toEqual(uncached(origin.id, territories).map((territory) => territory.id));
    }
  });
  it('reuses frozen result identity for repeated unchanged origin and snapshot queries', () => {
    const first = getSeaTransportDestinations('britain', territories);
    expect(first.length).toBeGreaterThan(0);
    expect(Object.isFrozen(first)).toBe(true);
    expect(getSeaTransportDestinations('britain', territories)).toBe(first);
    expect(getSeaTransportDestinations('liverpool', territories)).not.toBe(first);
    expect(getSeaTransportDestinations('not-a-port', territories)).toEqual([]);
  });
  it('invalidates connectivity when a new territory snapshot closes the departure links', () => {
    const prior = getSeaTransportDestinations('britain', territories);
    const changed = territories.map((territory) => territory.id === 'britain' ? { ...territory, neighbors: [] } : territory);
    const next = getSeaTransportDestinations('britain', changed);
    expect(next).not.toBe(prior);
    expect(next).toEqual(uncached('britain', changed));
    expect(next).toEqual([]);
    expect(getSeaTransportDestinations('britain', territories)).toBe(prior);
  });
  it('returns new current control and supply objects without leaking the preceding week cached state', () => {
    const prior = getSeaTransportDestinations('britain', territories);
    const target = prior.find((territory) => territory.controller === 'axis')!;
    expect(target).toBeDefined();
    const changed = territories.map((territory) => territory.id === target.id ? { ...territory, controller: 'allies' as const, supply: 12 } : territory);
    const next = getSeaTransportDestinations('britain', changed);
    const updated = next.find((territory) => territory.id === target.id)!;
    expect(updated).not.toBe(target);
    expect(updated).toMatchObject({ controller: 'allies', supply: 12 });
    expect(target.controller).toBe('axis');
    expect(next.map((territory) => territory.id)).toEqual(uncached('britain', changed).map((territory) => territory.id));
  });
  it('does not reuse one campaign’s cached destinations after switching to an independently loaded save', () => {
    const prior = getSeaTransportDestinations('truk', territories);
    const loaded = structuredClone(territories);
    const next = getSeaTransportDestinations('truk', loaded);
    expect(next).not.toBe(prior);
    expect(next.map((territory) => territory.id)).toEqual(prior.map((territory) => territory.id));
    next.forEach((territory) => expect(loaded).toContain(territory));
  });
});
