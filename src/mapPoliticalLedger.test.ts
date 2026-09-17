import { describe, expect, it } from 'vitest';
import { createMapPoliticalLedger, normalizeMapPoliticalLedger, recordPoliticalUpdates } from './mapPoliticalLedger';
import type { MapPoliticalLedger, PoliticalChange, PoliticalUpdate } from './mapPoliticalLedger';
import type { Faction, NationId, Territory } from './types';

const territories: Territory[] = [
  { id: 'france', name: '점령 프랑스', region: '서유럽', x: 37, y: 42, controller: 'axis', ownerId: 'germany', value: 9, supply: 89, terrain: '평야', neighbors: ['britain'] },
  { id: 'britain', name: '영국 본토', region: '서유럽', x: 24, y: 25, controller: 'allies', ownerId: 'britain', value: 10, supply: 96, terrain: '도시', neighbors: ['france'] },
  { id: 'unknown', name: '귀속 미확인 거점', region: '참고', x: 1, y: 1, controller: 'neutral', value: 1, supply: 20, terrain: '평야', neighbors: [] },
];
const update = (id: string, week: number, controller: Faction = 'allies', nationId: NationId = 'britain'): PoliticalUpdate => ({
  territoryId: 'france', controller, gameOwnerId: nationId, verifiedControllerNationId: nationId,
  source: { kind: controller === 'axis' ? 'enemy-land' : 'land-combat', id, label: `${id} 확정 결과` }, week,
});
const worldAfter = (ledger: MapPoliticalLedger, input: readonly Territory[] = territories): Territory[] => input.map((territory) => ({
  ...territory, controller: ledger.current[territory.id]?.controller ?? territory.controller,
  ownerId: ledger.current[territory.id]?.gameOwnerId,
}));
const roundtrip = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const receipt = (change: Pick<PoliticalChange, 'source' | 'week' | 'territoryId'>) => JSON.stringify([change.source.kind, change.source.id, change.week, change.territoryId]);
const capturedAndRetaken = () => recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), [update('first-capture', 2), update('recapture', 3, 'axis', 'germany')]);

describe('map political ledger confirmed receipts', () => {
  it('does not turn baseline game attribution into verified national control or legal sovereignty', () => {
    const ledger = createMapPoliticalLedger(territories, 0);
    expect(ledger.baselineKind).toBe('campaign-start');
    expect(ledger.current.france).toEqual({ controller: 'axis', gameOwnerId: 'germany' });
    expect(ledger.current.britain.verifiedControllerNationId).toBeUndefined();
    expect(ledger.current.unknown).toEqual({ controller: 'neutral', gameOwnerId: undefined });
    expect(ledger.changes).toEqual([]);
    expect(ledger.latestByTerritory).toEqual({});
    expect(ledger.seenIds).toEqual([]);
    expect(JSON.stringify(ledger)).not.toMatch(/sovereign|recognition|border/);
  });

  it('records an explicit source once and ignores redelivery after an opposing recapture', () => {
    const first = update('land-order-1:battle-phase-3', 2);
    const captured = recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), [first, first]);
    expect(captured.changes).toHaveLength(1);
    expect(captured.seenIds).toHaveLength(1);
    expect(captured.changes[0]).toMatchObject({ week: 2, source: first.source, before: { controller: 'axis', gameOwnerId: 'germany' }, after: { controller: 'allies', verifiedControllerNationId: 'britain' } });
    const retaken = recordPoliticalUpdates(captured, [update('enemy-plan-2-france', 4, 'axis', 'germany')]);
    expect(recordPoliticalUpdates(retaken, [first])).toBe(retaken);
    expect(retaken.current.france.verifiedControllerNationId).toBe('germany');
  });

  it('retains ordered capture/recapture/capture in one week rather than collapsing to a final diff', () => {
    const ledger = recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), [
      { ...update('sea-landing', 8), source: { kind: 'sea-transport', id: 'sea-landing', label: '아군 상륙 성공' } },
      { ...update('enemy-landing', 8, 'axis', 'germany'), source: { kind: 'enemy-sea', id: 'enemy-landing', label: '적 상륙 성공' } },
      update('land-recapture', 8, 'allies', 'usa'),
    ]);
    expect(ledger.changes.map((change) => change.source.kind)).toEqual(['sea-transport', 'enemy-sea', 'land-combat']);
    expect(ledger.changes.map((change) => change.week)).toEqual([8, 8, 8]);
    expect(ledger.changes[1].before).toEqual(ledger.changes[0].after);
    expect(ledger.changes[2].before).toEqual(ledger.changes[1].after);
    expect(ledger.current.france).toEqual(ledger.changes[2].after);
    expect(normalizeMapPoliticalLedger(roundtrip(ledger), worldAfter(ledger), 8)).toEqual(ledger);
  });

  it('records a same-faction owner change and keeps verified controller distinct from attribution', () => {
    const ledger = recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), [{
      territoryId: 'britain', controller: 'allies', gameOwnerId: 'freefrance', verifiedControllerNationId: 'usa', week: 4,
      source: { kind: 'nation-transition', id: 'transition-4', label: '확정 행정 전환' },
    }]);
    expect(ledger.changes).toHaveLength(1);
    expect(ledger.changes[0].before.controller).toBe(ledger.changes[0].after.controller);
    expect(ledger.current.britain).toMatchObject({ gameOwnerId: 'freefrance', verifiedControllerNationId: 'usa' });
  });

  it('does not record supply-only settlement when no confirmed political receipt is submitted', () => {
    const ledger = createMapPoliticalLedger(territories, 0);
    const resupplied = territories.map((territory) => ({ ...territory, supply: 100 }));
    expect(recordPoliticalUpdates(ledger, [])).toBe(ledger);
    expect(normalizeMapPoliticalLedger(roundtrip(ledger), resupplied, 12)).toEqual(ledger);
    expect(ledger.changes).toEqual([]);
  });

  it('acknowledges a no-change receipt once without adding a political event', () => {
    const first = recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), [update('first', 1)]);
    const secondReceipt = update('same-control-check', 2);
    const confirmed = recordPoliticalUpdates(first, [secondReceipt, secondReceipt]);
    expect(confirmed.changes).toHaveLength(1);
    expect(confirmed.seenIds).toHaveLength(2);
    expect(confirmed.current).toBe(first.current);
    expect(confirmed.latestByTerritory).toBe(first.latestByTerritory);
    expect(normalizeMapPoliticalLedger(roundtrip(confirmed), worldAfter(confirmed), 2)).toEqual(confirmed);
  });

  it('does not mutate engine territories, source updates or the previous ledger', () => {
    const ledger = createMapPoliticalLedger(territories, 0);
    const updates = [update('immutable', 1)];
    const before = structuredClone({ ledger, updates, territories });
    const next = recordPoliticalUpdates(ledger, updates);
    expect({ ledger, updates, territories }).toEqual(before);
    updates[0].source.label = 'external mutation';
    expect(next.changes[0].source.label).toBe('immutable 확정 결과');
    expect(next.latestByTerritory.france.source.label).toBe('immutable 확정 결과');
    expect(next.changes[0].before).not.toBe(ledger.current.france);
  });

  it('rejects unknown targets, invalid nations, fractional/negative weeks and pre-baseline receipts', () => {
    const ledger = createMapPoliticalLedger(territories, 10, 'legacy-load');
    const candidates = [
      { ...update('unknown', 11), territoryId: 'does-not-exist' },
      { ...update('bad-owner', 11), gameOwnerId: 'atlantis' as NationId },
      { ...update('bad-control', 11), verifiedControllerNationId: 'atlantis' as NationId },
      update('past', 9), update('negative', -1), update('fractional', 10.5), update('nan', NaN),
    ];
    expect(recordPoliticalUpdates(ledger, candidates)).toBe(ledger);
  });

  it('preserves the latest receipt when an unseen result arrives from an earlier week', () => {
    const ledger = capturedAndRetaken();
    expect(recordPoliticalUpdates(ledger, [update('late-delivery', 2, 'allies', 'usa')])).toBe(ledger);
    expect(ledger.latestByTerritory.france).toEqual(ledger.changes.at(-1));
  });
});

describe('map political ledger save normalization', () => {
  it.each([undefined, null, false, 42, 'legacy-with-no-ledger', { version: 0 }])('starts a current observation baseline for legacy/missing value %j without fabricating a past', (value) => {
    const present = territories.map((territory) => territory.id === 'france' ? { ...territory, controller: 'allies' as const, ownerId: 'usa' as const } : territory);
    const ledger = normalizeMapPoliticalLedger(value, present, 1777);
    expect(ledger).toMatchObject({ baselineKind: 'legacy-load', startedWeek: 1777, changes: [], seenIds: [], omittedCount: 0 });
    expect(ledger.current.france).toEqual({ controller: 'allies', gameOwnerId: 'usa' });
    expect(ledger.current.france.verifiedControllerNationId).toBeUndefined();
  });

  it('round-trips the confirmed journal and does not alias data from imported JSON', () => {
    const ledger = capturedAndRetaken();
    const raw = roundtrip(ledger);
    const restored = normalizeMapPoliticalLedger(raw, worldAfter(ledger), 4);
    expect(restored).toEqual(ledger);
    raw.changes[0].source.label = 'tampered';
    raw.current.france.controller = 'neutral';
    raw.seenIds.push('tampered');
    raw.latestByTerritory.france.source.label = 'tampered latest';
    raw.latestByTerritory.france.before.controller = 'neutral';
    expect(restored).toEqual(ledger);
  });

  it('adds newly catalogued geography as unverified present attribution without changing existing receipts', () => {
    const ledger = capturedAndRetaken();
    const added: Territory = { ...territories[0], id: 'new-city', name: '신규 거점', controller: 'allies', ownerId: 'china' };
    const restored = normalizeMapPoliticalLedger(roundtrip(ledger), [...worldAfter(ledger), added], 4);
    expect(restored.changes).toEqual(ledger.changes);
    expect(restored.current['new-city']).toEqual({ controller: 'allies', gameOwnerId: 'china' });
    expect(restored.current['new-city'].verifiedControllerNationId).toBeUndefined();
  });

  const corruptions: { name: string; corrupt: (raw: MapPoliticalLedger) => unknown }[] = [
    { name: 'future schema', corrupt: (raw) => ({ ...raw, version: 999 }) },
    { name: 'invalid baseline kind', corrupt: (raw) => ({ ...raw, baselineKind: 'historical-fact' }) },
    { name: 'future baseline week', corrupt: (raw) => ({ ...raw, startedWeek: 5 }) },
    { name: 'missing current', corrupt: (raw) => ({ ...raw, current: null }) },
    { name: 'array current', corrupt: (raw) => ({ ...raw, current: [] }) },
    { name: 'invalid current faction', corrupt: (raw) => ({ ...raw, current: { ...raw.current, france: { ...raw.current.france, controller: 'invaders' } } }) },
    { name: 'invalid current game owner', corrupt: (raw) => ({ ...raw, current: { ...raw.current, france: { ...raw.current.france, gameOwnerId: 'atlantis' } } }) },
    { name: 'invalid current verified nation', corrupt: (raw) => ({ ...raw, current: { ...raw.current, france: { ...raw.current.france, verifiedControllerNationId: 'atlantis' } } }) },
    { name: 'mismatched current faction', corrupt: (raw) => ({ ...raw, current: { ...raw.current, france: { ...raw.current.france, controller: 'neutral' } } }) },
    { name: 'mismatched current owner', corrupt: (raw) => ({ ...raw, current: { ...raw.current, france: { ...raw.current.france, gameOwnerId: 'usa' } } }) },
    { name: 'mismatched journal tail', corrupt: (raw) => ({ ...raw, current: { ...raw.current, france: { ...raw.current.france, verifiedControllerNationId: 'italy' } } }) },
    { name: 'missing history array', corrupt: (raw) => ({ ...raw, changes: null }) },
    { name: 'duplicate history receipt', corrupt: (raw) => ({ ...raw, changes: [raw.changes[0], raw.changes[0], raw.changes[1]] }) },
    { name: 'history not present in seen receipts', corrupt: (raw) => ({ ...raw, seenIds: [] }) },
    { name: 'non-string seen receipt', corrupt: (raw) => ({ ...raw, seenIds: [123] }) },
    { name: 'negative omitted count', corrupt: (raw) => ({ ...raw, omittedCount: -1 }) },
    { name: 'fractional omitted count', corrupt: (raw) => ({ ...raw, omittedCount: .5 }) },
    { name: 'NaN omitted count', corrupt: (raw) => ({ ...raw, omittedCount: NaN }) },
    { name: 'invalid source kind', corrupt: (raw) => { raw.changes[0].source.kind = 'newspaper-text' as PoliticalChange['source']['kind']; return raw; } },
    { name: 'missing source', corrupt: (raw) => ({ ...raw, changes: [{ ...raw.changes[0], source: undefined }, raw.changes[1]] }) },
    { name: 'empty source label', corrupt: (raw) => { raw.changes[0].source.label = ''; return raw; } },
    { name: 'broken per-territory history chain', corrupt: (raw) => { raw.changes[1].before = { controller: 'neutral' }; return raw; } },
    { name: 'no-op historical change', corrupt: (raw) => { raw.changes[0].after = { ...raw.changes[0].before }; return raw; } },
    { name: 'unknown history territory', corrupt: (raw) => { raw.changes[0].territoryId = 'unregistered'; raw.changes[0].id = receipt(raw.changes[0]); raw.seenIds[0] = raw.changes[0].id; return raw; } },
    { name: 'future history week with valid receipt identity', corrupt: (raw) => { raw.changes[1].week = 5; raw.changes[1].id = receipt(raw.changes[1]); raw.seenIds[1] = raw.changes[1].id; return raw; } },
    { name: 'out-of-order history weeks with valid receipt identities', corrupt: (raw) => { raw.changes[1].week = 1; raw.changes[1].id = receipt(raw.changes[1]); raw.seenIds[1] = raw.changes[1].id; return raw; } },
    { name: 'history exceeding bounded storage', corrupt: (raw) => ({ ...raw, changes: Array.from({ length: 513 }, () => raw.changes[0]) }) },
  ];
  it.each(corruptions)('fails closed for $name instead of manufacturing verified control', ({ corrupt }) => {
    const original = capturedAndRetaken();
    const restored = normalizeMapPoliticalLedger(corrupt(roundtrip(original)), worldAfter(original), 4);
    expect(restored).toEqual(createMapPoliticalLedger(worldAfter(original), 4, 'legacy-load'));
    expect(restored.current.france.verifiedControllerNationId).toBeUndefined();
    expect(restored.changes).toEqual([]);
  });

  it.each([NaN, Infinity, -1, 1.5])('fails closed for invalid current week %s', (week) => {
    const ledger = capturedAndRetaken();
    const restored = normalizeMapPoliticalLedger(roundtrip(ledger), worldAfter(ledger), week);
    expect(restored.baselineKind).toBe('legacy-load');
    expect(restored.changes).toEqual([]);
    expect(restored.current.france.verifiedControllerNationId).toBeUndefined();
  });

  it('round-trips every receipt it accepts even at the maximum source identifier boundary', () => {
    const ledger = recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), [update('x'.repeat(500), 1)]);
    expect(normalizeMapPoliticalLedger(roundtrip(ledger), worldAfter(ledger), 1)).toEqual(ledger);
  });

  it('bounds displayed history to 512 but retains receipt identity after trimming and JSON save/load', () => {
    const updates = Array.from({ length: 600 }, (_, index) => update(`operation-${index}`, index + 1,
      index % 2 === 0 ? 'allies' : 'axis', index % 2 === 0 ? 'britain' : 'germany'));
    const ledger = recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), updates);
    expect(ledger.changes).toHaveLength(512);
    expect(ledger.changes[0].week).toBe(89);
    expect(ledger.changes.at(-1)?.week).toBe(600);
    expect(ledger.omittedCount).toBe(88);
    expect(ledger.seenIds).toHaveLength(600);
    const raw = roundtrip(ledger);
    raw.seenIds.push(raw.seenIds[0]); // old duplicate cache entries are normalized safely
    const restored = normalizeMapPoliticalLedger(raw, worldAfter(ledger), 600);
    expect(restored).toEqual(ledger);
    expect(recordPoliticalUpdates(restored, [updates[0], updates[88], updates[599]])).toBe(restored);
    expect(restored.current.france).toMatchObject({ controller: 'axis', verifiedControllerNationId: 'germany' });
  });
});

describe('map political ledger latest receipt provenance', () => {
  const trimmedLedger = (sameWeek = false) => recordPoliticalUpdates(createMapPoliticalLedger(territories, 0), [
    update('old-france-capture', 1),
    ...Array.from({ length: 600 }, (_, index) => ({
      ...update(`britain-operation-${index}`, sameWeek ? 1 : index + 2,
        index % 2 === 0 ? 'axis' : 'allies', index % 2 === 0 ? 'germany' : 'britain'),
      territoryId: 'britain',
    })),
  ]);

  it('does not trust a valid nation enum injected into baseline current state with no receipt', () => {
    const raw = createMapPoliticalLedger(territories, 0);
    raw.current.france.verifiedControllerNationId = 'usa';
    const restored = normalizeMapPoliticalLedger(roundtrip(raw), territories, 10);
    expect(restored).toEqual(createMapPoliticalLedger(territories, 10, 'legacy-load'));
    expect(restored.current.france.verifiedControllerNationId).toBeUndefined();
  });

  it('recovers old v1 saves from their retained final receipts without inventing prior evidence', () => {
    const ledger = capturedAndRetaken();
    const { latestByTerritory: _omitted, ...oldSave } = roundtrip(ledger);
    expect(normalizeMapPoliticalLedger(oldSave, worldAfter(ledger), 4)).toEqual(ledger);
  });

  it('keeps an older unverified baseline compatible when it has no latest receipt map', () => {
    const ledger = createMapPoliticalLedger(territories, 0);
    const { latestByTerritory: _omitted, ...oldSave } = roundtrip(ledger);
    expect(normalizeMapPoliticalLedger(oldSave, territories, 4)).toEqual(ledger);
  });

  it.each([false, true])('preserves old verified control after other territories trim its proof (same week: %s)', (sameWeek) => {
    const ledger = trimmedLedger(sameWeek);
    const week = sameWeek ? 1 : 601;
    expect(ledger.changes).toHaveLength(512);
    expect(ledger.omittedCount).toBe(89);
    expect(ledger.changes.some((change) => change.territoryId === 'france')).toBe(false);
    expect(ledger.latestByTerritory.france).toMatchObject({ week: 1, source: { id: 'old-france-capture' }, after: { verifiedControllerNationId: 'britain' } });
    const restored = normalizeMapPoliticalLedger(roundtrip(ledger), worldAfter(ledger), week);
    expect(restored).toEqual(ledger);
    expect(restored.current.france.verifiedControllerNationId).toBe('britain');
    expect(recordPoliticalUpdates(restored, [update('old-france-capture', 1)])).toBe(restored);
  });

  it('uses an explicit legacy baseline when an old trimmed save no longer contains proof of current control', () => {
    const ledger = trimmedLedger();
    const { latestByTerritory: _omitted, ...oldSave } = roundtrip(ledger);
    const present = worldAfter(ledger);
    expect(normalizeMapPoliticalLedger(oldSave, present, 601)).toEqual(createMapPoliticalLedger(present, 601, 'legacy-load'));
  });

  const corruptions: { name: string; corrupt: (raw: MapPoliticalLedger) => unknown }[] = [
    { name: 'null proof map', corrupt: (raw) => ({ ...raw, latestByTerritory: null }) },
    { name: 'array proof map', corrupt: (raw) => ({ ...raw, latestByTerritory: [] }) },
    { name: 'empty proof map despite retained evidence', corrupt: (raw) => ({ ...raw, latestByTerritory: {} }) },
    { name: 'null final receipt', corrupt: (raw) => ({ ...raw, latestByTerritory: { france: null } }) },
    { name: 'wrong territory key', corrupt: (raw) => ({ ...raw, latestByTerritory: { britain: raw.latestByTerritory.france } }) },
    { name: 'unknown receipt territory', corrupt: (raw) => {
      const change = raw.latestByTerritory.france;
      change.territoryId = 'unregistered'; change.id = receipt(change); raw.seenIds.push(change.id);
      return { ...raw, latestByTerritory: { unregistered: change } };
    } },
    { name: 'missing final before snapshot', corrupt: (raw) => ({ ...raw, latestByTerritory: { france: { ...raw.latestByTerritory.france, before: undefined } } }) },
    { name: 'invalid final before faction', corrupt: (raw) => { raw.latestByTerritory.france.before.controller = 'invented' as Faction; return raw; } },
    { name: 'invalid final after nation', corrupt: (raw) => { raw.latestByTerritory.france.after.verifiedControllerNationId = 'invented' as NationId; return raw; } },
    { name: 'final after differs from current', corrupt: (raw) => { raw.latestByTerritory.france.after.verifiedControllerNationId = 'usa'; return raw; } },
    { name: 'final no-op receipt', corrupt: (raw) => { raw.latestByTerritory.france.before = { ...raw.latestByTerritory.france.after }; return raw; } },
    { name: 'missing final source', corrupt: (raw) => ({ ...raw, latestByTerritory: { france: { ...raw.latestByTerritory.france, source: undefined } } }) },
    { name: 'invalid final source kind', corrupt: (raw) => { raw.latestByTerritory.france.source.kind = 'newspaper-text' as PoliticalChange['source']['kind']; return raw; } },
    { name: 'empty final source identifier', corrupt: (raw) => { raw.latestByTerritory.france.source.id = ''; return raw; } },
    { name: 'empty final source label', corrupt: (raw) => { raw.latestByTerritory.france.source.label = ''; return raw; } },
    { name: 'final source label differs from the retained receipt', corrupt: (raw) => { raw.latestByTerritory.france.source.label = 'different claim'; return raw; } },
    { name: 'final before differs from the retained receipt', corrupt: (raw) => { raw.latestByTerritory.france.before.gameOwnerId = 'usa'; return raw; } },
    { name: 'final identity does not match its source', corrupt: (raw) => { raw.latestByTerritory.france.id = 'forged-id'; return raw; } },
    { name: 'valid final identity is not acknowledged by seen receipts', corrupt: (raw) => {
      raw.latestByTerritory.france.source.id = 'unacknowledged';
      raw.latestByTerritory.france.id = receipt(raw.latestByTerritory.france); return raw;
    } },
    { name: 'stale final receipt instead of the latest change', corrupt: (raw) => { raw.latestByTerritory.france = raw.changes[0]; return raw; } },
    { name: 'negative final week', corrupt: (raw) => { raw.latestByTerritory.france.week = -1; return raw; } },
    { name: 'future final week with an acknowledged identity', corrupt: (raw) => {
      const change = raw.latestByTerritory.france; change.week = 5; change.id = receipt(change); raw.seenIds.push(change.id); return raw;
    } },
    { name: 'reversed receipt acknowledgement order', corrupt: (raw) => { raw.seenIds.reverse(); return raw; } },
  ];
  it.each(corruptions)('fails closed for $name', ({ corrupt }) => {
    const ledger = capturedAndRetaken();
    const present = worldAfter(ledger);
    expect(normalizeMapPoliticalLedger(corrupt(roundtrip(ledger)), present, 4)).toEqual(createMapPoliticalLedger(present, 4, 'legacy-load'));
  });

  it.each(['not-trimmed', 'missing-seen', 'future', 'same-week-order', 'before-baseline', 'short-history'] as const)('rejects inconsistent trimmed proof: %s', (caseName) => {
    const ledger = trimmedLedger(caseName === 'same-week-order');
    const raw = roundtrip(ledger);
    const proof = raw.latestByTerritory.france;
    if (caseName === 'not-trimmed') raw.omittedCount = 0;
    if (caseName === 'missing-seen') raw.seenIds = raw.seenIds.filter((id) => id !== proof.id);
    if (caseName === 'future') {
      proof.week = 602; proof.id = receipt(proof); raw.seenIds[0] = proof.id;
    }
    if (caseName === 'same-week-order') raw.seenIds.push(raw.seenIds.shift()!);
    if (caseName === 'before-baseline') raw.startedWeek = 2;
    if (caseName === 'short-history') raw.changes.shift();
    const present = worldAfter(ledger);
    const week = caseName === 'same-week-order' ? 1 : 601;
    expect(normalizeMapPoliticalLedger(raw, present, week)).toEqual(createMapPoliticalLedger(present, week, 'legacy-load'));
  });
});
