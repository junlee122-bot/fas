import { describe, expect, it } from 'vitest';
import {
  advanceEnemyStrategyWeek,
  createEnemyStrategyState,
  deriveEnemyIntentReport,
  selectEnemyStrategicTarget,
} from './enemyStrategy';
import type { EnemyStrategyContext } from './enemyStrategy';
import type { Commander, Division, Territory } from './types';

const territories: Territory[] = [
  { id: 'rear', name: '후방', region: '서부', x: 0, y: 0, controller: 'allies', ownerId: 'britain', value: 4, supply: 80, terrain: '평야', neighbors: ['front'] },
  { id: 'front', name: '전선 도시', region: '서부', x: 1, y: 0, controller: 'allies', ownerId: 'britain', value: 8, supply: 46, terrain: '도시', siteType: 'city', neighbors: ['rear', 'enemy-base'] },
  { id: 'capital', name: '전구 수도', region: '남부', x: 1, y: 1, controller: 'allies', ownerId: 'britain', value: 12, supply: 38, terrain: '도시', siteType: 'capital', neighbors: ['enemy-base'] },
  { id: 'enemy-base', name: '적 집결지', region: '국경', x: 2, y: 0, controller: 'axis', ownerId: 'germany', value: 8, supply: 88, terrain: '평야', neighbors: ['front', 'capital'] },
];

const divisions: Division[] = [
  { id: 'division', name: '방어사단', type: 'infantry', strength: 82, organization: 76, experience: 60, supply: 68, territoryId: 'front', commanderId: 'commander', status: 'ready' },
];

const commanders: Commander[] = [
  { id: 'commander', name: '방어 지휘관', rank: '대장', initials: '방', color: '#fff', command: 70, attack: 66, defense: 82, logistics: 71, trait: '방어', specialty: '방어', fatigue: 0, loyalty: 80 },
];

const makeContext = (week: number): EnemyStrategyContext => ({
  week,
  theater: 'europe',
  playerFaction: 'allies',
  enemyFaction: 'axis',
  territories,
  divisions,
  commanders,
  enemyPressure: 72,
  playerVictoryScore: 50,
  playerOrderTargetIds: [],
});

describe('enemy strategic AI', () => {
  it('scores strategic value and exposure instead of only choosing the first weak tile', () => {
    const selected = selectEnemyStrategicTarget(makeContext(1));
    expect(selected?.target.id).toBe('capital');
    expect(selected?.source.id).toBe('enemy-base');
  });

  it('prefers the player nation or its deployed formations over a more valuable allied front', () => {
    const selected = selectEnemyStrategicTarget({ ...makeContext(1), playerNationId: 'usa' });
    expect(selected?.target.id).toBe('front');
  });

  it('forms and telegraphs a multi-week operation before resolving it', () => {
    let state = createEnemyStrategyState();
    const formed = advanceEnemyStrategyWeek(state, makeContext(1), [.2, .5, .5, .5]);
    expect(formed.event?.type).toBe('formed');
    expect(formed.effect).toBeNull();
    expect(formed.state.plan?.stage).toBe('forming');
    state = formed.state;

    const probing = advanceEnemyStrategyWeek(state, makeContext(2), [.2, .5, .5, .5]);
    expect(probing.state.plan?.stage).toBe('probing');
    expect(probing.effect).toBeNull();
    state = probing.state;

    const committed = advanceEnemyStrategyWeek(state, makeContext(3), [.2, .5, .5, .5]);
    expect(committed.state.plan?.stage).toBe('committed');
    expect(committed.event?.type).toBe('stage-change');
    expect(committed.effect).toBeNull();
  });

  it('masks exact intent at low intelligence and reveals it after analysis improves', () => {
    const formed = advanceEnemyStrategyWeek(createEnemyStrategyState(), makeContext(1), [.2]);
    const lowIntel = deriveEnemyIntentReport(formed.state, 12, territories);
    const highIntel = deriveEnemyIntentReport(formed.state, 96, territories);
    expect(lowIntel.targetId).toBeNull();
    expect(lowIntel.targetName).toBe('목표 불명');
    expect(highIntel.targetId).toBe('capital');
    expect(highIntel.sourceName).toBe('적 집결지');
    expect(highIntel.sourceUrl).toContain('history.army.mil');
  });

  it('can only capture after preparation, probing, and committed combat', () => {
    let state = createEnemyStrategyState();
    let result = advanceEnemyStrategyWeek(state, { ...makeContext(1), divisions: [], enemyPressure: 94 }, [.2, 1, 1, 1]);
    state = result.state;
    let resolvedWeek = 0;
    for (let week = 2; week <= 10; week += 1) {
      result = advanceEnemyStrategyWeek(state, { ...makeContext(week), divisions: [], enemyPressure: 94 }, [.2, 1, 1, 1]);
      state = result.state;
      if (result.event?.type === 'resolved') {
        resolvedWeek = week;
        break;
      }
    }
    expect(resolvedWeek).toBeGreaterThanOrEqual(4);
    expect(result.effect?.territoryCaptured).toBe(true);
    expect(state.operationsCompleted).toBe(1);
  });

  it('aborts the plan when the intended target leaves the reachable front', () => {
    const formed = advanceEnemyStrategyWeek(createEnemyStrategyState(), makeContext(1), [.2]);
    const changed = territories.map((territory) => territory.id === 'capital' ? { ...territory, controller: 'axis' as const } : territory);
    const aborted = advanceEnemyStrategyWeek(formed.state, { ...makeContext(2), territories: changed }, [.2]);
    expect(aborted.event?.type).toBe('aborted');
    expect(aborted.state.plan).toBeNull();
  });

  it('keeps 1,000 varied operations multi-week and produces success, repulse, and deception outcomes', () => {
    const outcomes = { success: 0, repulsed: 0, feint: 0 };
    let shortestOperation = Number.POSITIVE_INFINITY;
    let longestOperation = 0;
    const capitalDefense = divisions.map((division) => ({ ...division, territoryId: 'capital', strength: 96, organization: 91, supply: 88 }));

    for (let run = 0; run < 1_000; run += 1) {
      let state = createEnemyStrategyState();
      let resolutionWeek = 0;
      const pressure = 34 + run % 64;
      const defenders = run % 3 === 0 ? capitalDefense : [];
      for (let week = 1; week <= 12; week += 1) {
        const operationRoll = ((run * 37 + 17) % 101) / 100;
        const tempoRoll = ((run * 53 + week * 29) % 101) / 100;
        const combatRoll = ((run * 71 + week * 11) % 101) / 100;
        const result = advanceEnemyStrategyWeek(state, {
          ...makeContext(week),
          divisions: defenders,
          enemyPressure: pressure,
          playerVictoryScore: 28 + run % 65,
        }, [operationRoll, tempoRoll, combatRoll, combatRoll]);
        state = result.state;
        if (result.event?.type !== 'resolved') continue;
        resolutionWeek = week;
        const outcome = result.effect?.territoryCaptured ? 'success' : result.event.title.includes('기만') ? 'feint' : 'repulsed';
        outcomes[outcome] += 1;
        break;
      }
      expect(resolutionWeek).toBeGreaterThan(0);
      shortestOperation = Math.min(shortestOperation, resolutionWeek);
      longestOperation = Math.max(longestOperation, resolutionWeek);
    }

    expect(shortestOperation).toBeGreaterThanOrEqual(4);
    expect(longestOperation).toBeLessThanOrEqual(10);
    expect(outcomes.success).toBeGreaterThan(100);
    expect(outcomes.repulsed).toBeGreaterThan(100);
    expect(outcomes.feint).toBeGreaterThan(50);
  });
});
