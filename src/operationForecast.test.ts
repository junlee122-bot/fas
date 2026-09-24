import { describe, expect, it } from 'vitest';
import { forecastBattle, resolveBattle } from './combat';
import { advanceOperationWeek, battleTypeProfiles, forecastOperationBattle } from './operations';
import { commanders, initialDivisions, territories } from './data';
import type { BattleStance, BattleType, Order } from './types';

const division = initialDivisions[0];
const commander = commanders.find((item) => item.id === division.commanderId) ?? commanders[0];
const target = territories.find((item) => item.controller === 'axis')!;
const input = { week: 1, division, commander, target, stance: 'balanced' as BattleStance, enemyPressure: 58, intelNetwork: 72, doctrineBonus: 7, policyAttackBonus: 6, priorityBonus: 5 };
const order: Order = { id: 'forecast-fixture', divisionId: division.id, fromId: division.territoryId, targetId: target.id, startedWeek: 0 };
const types = Object.keys(battleTypeProfiles) as BattleType[];

describe('operation forecast parity with the actual weekly loss model', () => {
  it.each(types)('uses actual %s loss distribution for all three stances', (battleType) => {
    for (const stance of ['cautious', 'balanced', 'aggressive'] as const) {
      const context = { ...input, stance };
      const forecast = forecastOperationBattle(context, battleType);
      const reports = [.15, .5, .85].flatMap((r) => [.15, .5, .85].flatMap((a) => [.15, .5, .85].flatMap((e) => [.15, .5, .85].map((x) =>
        advanceOperationWeek({ ...order, battleType }, resolveBattle({ ...context, randomRolls: [r, a, e, x] }), division).report))));
      const range = (values: number[]) => { const sorted = values.sort((a, b) => a - b); return [sorted[Math.floor(sorted.length * .2)], sorted[Math.floor(sorted.length * .8)]]; };
      expect(forecast.strengthLoss).toEqual(range(reports.map((report) => Math.min(division.strength, report.attackerStrengthLoss))));
      expect(forecast.organizationLoss).toEqual(range(reports.map((report) => Math.min(division.organization, report.organizationLoss))));
      expect(forecast.supplySpent).toBe(Math.min(division.supply, reports[0].supplySpent));
      expect(forecast.successChance).toBe(forecastBattle(context).successChance);
    }
  });

  it('never forecasts spending more force or supply than the current division holds', () => {
    const forecast = forecastOperationBattle({ ...input, division: { ...division, strength: 1, organization: 2, supply: 0 } }, 'siege');
    expect(forecast.strengthLoss).toEqual([1, 1]);
    expect(forecast.organizationLoss).toEqual([2, 2]);
    expect(forecast.supplySpent).toBe(0);
  });

  it('does not allocate a new order ID, modify input, or apply any losses during preview', () => {
    const before = JSON.stringify(input);
    for (const battleType of types) forecastOperationBattle(input, battleType);
    expect(JSON.stringify(input)).toBe(before);
  });
});
