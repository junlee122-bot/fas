import { describe, expect, it } from 'vitest';
import { advanceOperationWeek, battleTypeProfiles, createOperationOrder, inferBattleType } from './operations';
import type { BattleReport, Division, Territory } from './types';

const origin: Territory = { id: 'rear', name: '출발지', region: '시험', x: 0, y: 0, controller: 'allies', value: 4, supply: 80, terrain: '평야', neighbors: ['target'], siteType: 'region' };
const division: Division = { id: 'division', name: '시험사단', type: 'infantry', strength: 90, organization: 85, experience: 70, supply: 80, territoryId: 'rear', commanderId: 'commander', status: 'ready' };

function target(overrides: Partial<Territory>): Territory {
  return { id: 'target', name: '목표', region: '시험', x: 1, y: 1, controller: 'axis', value: 8, supply: 80, terrain: '평야', neighbors: ['rear'], siteType: 'region', ...overrides };
}

function report(margin = 12): BattleReport {
  const phase = (id: BattleReport['phases'][number]['id'], delta: number): BattleReport['phases'][number] => ({ id, title: id, attackerScore: 70, defenderScore: 70 - delta, delta, tone: delta >= 7 ? 'advantage' : delta <= -7 ? 'setback' : 'contested', narrative: '시험' });
  return {
    id: 'battle-1', week: 1, divisionId: division.id, divisionName: division.name, commanderName: '지휘관', targetId: 'target', targetName: '목표', terrain: '평야', stance: 'balanced', victory: margin >= 0, margin,
    phases: [phase('reconnaissance', margin), phase('approach', margin), phase('engagement', margin), phase('exploitation', margin)],
    attackerStrengthLoss: 10, defenderStrengthLoss: 14, organizationLoss: 18, supplySpent: 12, summary: '주간 교전 결과',
  };
}

describe('multi-week operations', () => {
  it.each([
    [{ siteType: 'fortress', terrain: '요새 도시' }, 'siege'],
    [{ siteType: 'island', terrain: '도서 산악' }, 'amphibious'],
    [{ siteType: 'front', terrain: '산악 정글' }, 'mountain'],
    [{ siteType: 'city', terrain: '공업 도시' }, 'urban'],
  ] as const)('classifies the target into a matching battle type', (overrides, expected) => {
    expect(inferBattleType(origin, target(overrides), division)).toBe(expected);
  });

  it('keeps a fortress assault active after its first successful week', () => {
    const objective = target({ siteType: 'fortress', terrain: '요새 도시' });
    const order = createOperationOrder({ divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 0, stance: 'balanced' }, origin, objective, division);
    const firstWeek = advanceOperationWeek(order, report(20));

    expect(firstWeek.profile.id).toBe('siege');
    expect(firstWeek.outcome).toBe('ongoing');
    expect(firstWeek.report.operationWeek).toBe(1);
    expect(firstWeek.order.operationProgress).toBeGreaterThan(0);
    expect(firstWeek.report.attackerStrengthLoss).toBeLessThan(report(20).attackerStrengthLoss);
  });

  it('cannot complete a long battle before its minimum duration', () => {
    const objective = target({ siteType: 'fortress', terrain: '요새 도시' });
    let order = createOperationOrder({ divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 0 }, origin, objective, division);
    const minimumWeeks = battleTypeProfiles.siege.minimumWeeks;

    for (let week = 1; week < minimumWeeks; week += 1) {
      const result = advanceOperationWeek(order, report(40));
      expect(result.outcome).toBe('ongoing');
      order = result.order;
    }
  });

  it('finishes an operation once duration and progress conditions are both met', () => {
    const objective = target({ siteType: 'city', terrain: '공업 도시' });
    let order = createOperationOrder({ divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 0 }, origin, objective, division);
    let outcome: ReturnType<typeof advanceOperationWeek>['outcome'] = 'ongoing';

    for (let week = 0; week < 7 && outcome === 'ongoing'; week += 1) {
      const result = advanceOperationWeek(order, report(38));
      order = result.order;
      outcome = result.outcome;
    }

    expect(outcome).toBe('victory');
    expect(order.elapsedWeeks).toBeGreaterThanOrEqual(battleTypeProfiles.urban.minimumWeeks);
  });
});
