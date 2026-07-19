import { describe, expect, it } from 'vitest';
import { getNation } from './campaign';
import { strategicPolicies } from './choices';
import { deriveEmergentHistory } from './emergentHistory';
import { createWorldHistorySeed, generateWorldline, normalizeWorldHistoryState, previewWorldHistoryChoice, worldHistoryEvents } from './worldHistory';
import { historicalExperts } from './historicalExperts';

const game = {
  victoryScore: 68,
  stability: 72,
  warSupport: 79,
  factories: 34,
  intelNetwork: 66,
  enemyPressure: 55,
  airPower: 61,
  navalPower: 58,
};

describe('alternate Earth worldline engine', () => {
  it('provides a large sourced event atlas with three outcomes per event', () => {
    expect(worldHistoryEvents).toHaveLength(180);
    expect(new Set(worldHistoryEvents.map((entry) => entry.id)).size).toBe(worldHistoryEvents.length);
    worldHistoryEvents.forEach((entry) => {
      expect(entry.variants).toHaveLength(3);
      expect(entry.sourceUrl.startsWith('https://')).toBe(true);
      expect(new Set(entry.variants.map((variant) => variant.id)).size).toBe(3);
      entry.historicalActorIds?.forEach((actorId) => expect(historicalExperts.some((expert) => expert.id === actorId), `${entry.id} -> ${actorId}`).toBe(true));
    });
    expect(3n ** BigInt(worldHistoryEvents.length)).toBeGreaterThan(1000n);
    expect(worldHistoryEvents.some((entry) => entry.category === 'public-health')).toBe(true);
    expect(worldHistoryEvents.some((entry) => entry.category === 'intelligence')).toBe(true);
    expect(worldHistoryEvents.some((entry) => entry.era === 'connected-world' && entry.historicalYear >= 2020)).toBe(true);
    ['tripartite-social-pact', 'unclos-common-heritage', 'multistakeholder-internet-governance', 'sendai-resilient-cities', 'healthy-ageing-social-contract', 'renewable-flexibility-supergrid']
      .forEach((eventId) => expect(worldHistoryEvents.some((entry) => entry.id === eventId), eventId).toBe(true));
    expect(worldHistoryEvents.filter((entry) => (entry.historicalActorIds?.length ?? 0) > 0).length).toBeGreaterThanOrEqual(25);
  });

  it('is deterministic for an identical campaign and seed', () => {
    const input = {
      nation: getNation('korea'),
      game,
      state: { seed: 17081945, choices: {} },
    };
    expect(generateWorldline(input)).toEqual(generateWorldline(input));
    expect(generateWorldline(input).timeline).toHaveLength(worldHistoryEvents.length);
    expect(generateWorldline(input).endingCount).toBe(4096);
    expect(generateWorldline(input).ending.anchors).toHaveLength(3);
    expect(generateWorldline(input).intelligenceHistory.length).toBeGreaterThanOrEqual(35);
  });

  it('does not hardcode the cold war as the United States versus the Soviet Union', () => {
    const world = generateWorldline({
      nation: getNation('india'),
      game,
      state: { seed: 551955, choices: {} },
    });
    expect(world.primaryBloc).toContain('인도');
    expect(`${world.primaryBloc} ${world.rivalBloc}`).not.toBe('미국 소련');
    expect(world.thirdPole).not.toBe(world.rivalBloc);
  });

  it('changes the projected world when concrete campaign behavior changes', () => {
    const campaignGame = {
      ...game,
      week: 20,
      manpower: 800,
      politicalPower: 80,
      fuel: 75,
      steel: 95,
      commandPoints: 60,
      treasury: 700,
    };
    const diplomaticTrajectory = deriveEmergentHistory({
      doctrine: 'coalition',
      roleBranch: 'politics',
      game: campaignGame,
      selectedPolicies: strategicPolicies.filter((policy) => ['society-autonomy', 'diplomacy-aid'].includes(policy.id)),
    });
    const militaryTrajectory = deriveEmergentHistory({
      doctrine: 'maneuver',
      roleBranch: 'military',
      game: { ...campaignGame, warSupport: 94, airPower: 82, navalPower: 78 },
      selectedPolicies: strategicPolicies.filter((policy) => ['doctrine-firepower', 'society-mobilization'].includes(policy.id)),
    });
    const shared = { nation: getNation('korea'), game, state: { seed: 17081945, choices: {} } };
    const diplomaticWorld = generateWorldline({ ...shared, trajectory: diplomaticTrajectory });
    const militaryWorld = generateWorldline({ ...shared, trajectory: militaryTrajectory });
    expect(diplomaticWorld.primaryBloc).not.toBe(militaryWorld.primaryBloc);
    expect(diplomaticWorld.metrics).not.toEqual(militaryWorld.metrics);
    expect(diplomaticWorld.timeline.some((entry, index) => entry.variant.id !== militaryWorld.timeline[index].variant.id)).toBe(true);
  });

  it('lets a player force a branch and immediately changes its result', () => {
    const baseInput = {
      nation: getNation('china'),
      game,
      state: { seed: 991962, choices: {} },
    };
    const selected = generateWorldline({
      ...baseInput,
      state: { seed: 991962, choices: { 'missile-crisis': 'exchange', 'atomic-program': 'distributed' } },
    });
    expect(selected.timeline.find((entry) => entry.event.id === 'missile-crisis')?.variant.id).toBe('exchange');
    expect(selected.timeline.find((entry) => entry.event.id === 'missile-crisis')?.isPlayerChoice).toBe(true);
    expect(selected.atomicSponsor).toContain('공동망');
    expect(selected.timeline.filter((entry) => entry.isPlayerChoice)).toHaveLength(2);
  });

  it('migrates saved choices and discards invalid event branches', () => {
    const fallback = createWorldHistorySeed('britain', 'britain-tier2');
    const normalized = normalizeWorldHistoryState({
      seed: 1948,
      choices: { 'atomic-program': 'authority', missing: 'anything', 'korean-war': 'not-real' },
    }, fallback);
    expect(normalized).toEqual({ seed: 1948, choices: { 'atomic-program': 'authority' } });
    expect(normalizeWorldHistoryState(null, fallback).seed).toBe(fallback);
  });

  it('previews how one decision rewrites downstream automatic branches', () => {
    const input = {
      nation: getNation('korea'),
      game,
      state: { seed: 19450815, choices: {} },
    };
    const preview = previewWorldHistoryChoice(input, 'atomic-program', 'distributed');
    expect(preview.changedEvents).toBeGreaterThan(0);
    expect(Object.keys(preview.metricChanges).length).toBeGreaterThan(0);
  });

  it('lets intelligence reforms rename and reshape successor institutions', () => {
    const world = generateWorldline({
      nation: getNation('usa'),
      game,
      state: { seed: 1947, choices: { 'cia-national-security-act': 'transformative' } },
    });
    const cia = world.intelligenceHistory.find((organization) => organization.id === 'cia');
    expect(cia?.displayName).toBe('초국경 전략행동청');
    expect(cia?.variantId).toBe('transformative');
    expect(cia?.appearanceYear).toBe(1946);
  });
});
