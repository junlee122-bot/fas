import { describe, expect, it } from 'vitest';
import { resolveBattle } from './combat';
import { commanders, initialDivisions, territories } from './data';

const division = initialDivisions[0];
const commander = commanders.find((item) => item.id === division.commanderId) ?? commanders[0];
const plainTarget = territories.find((territory) => territory.id === 'france') ?? territories[0];
const fortifiedTarget = territories.find((territory) => territory.id === 'malta') ?? territories[0];

const baseInput = {
  week: 3,
  division,
  commander,
  target: plainTarget,
  enemyPressure: 58,
  intelNetwork: 72,
  doctrineBonus: 7,
  policyAttackBonus: 6,
  priorityBonus: 5,
  randomRolls: [.6, .55, .7, .65] as [number, number, number, number],
};

describe('multi-phase battle resolution', () => {
  it('resolves reconnaissance, approach, engagement, and exploitation in order', () => {
    const report = resolveBattle({ ...baseInput, stance: 'balanced' });
    expect(report.phases.map((phase) => phase.id)).toEqual(['reconnaissance', 'approach', 'engagement', 'exploitation']);
    expect(report.summary.length).toBeGreaterThan(20);
    expect(report.attackerStrengthLoss).toBeGreaterThan(0);
    expect(report.supplySpent).toBeGreaterThan(0);
  });

  it('makes an aggressive stance stronger but more costly than a cautious stance', () => {
    const aggressive = resolveBattle({ ...baseInput, stance: 'aggressive' });
    const cautious = resolveBattle({ ...baseInput, stance: 'cautious' });
    expect(aggressive.phases[2].attackerScore).toBeGreaterThan(cautious.phases[2].attackerScore);
    expect(aggressive.attackerStrengthLoss).toBeGreaterThanOrEqual(cautious.attackerStrengthLoss);
    expect(aggressive.supplySpent).toBeGreaterThan(cautious.supplySpent);
  });

  it('makes fortified terrain harder to breach with identical forces and rolls', () => {
    const plain = resolveBattle({ ...baseInput, stance: 'balanced' });
    const fortified = resolveBattle({ ...baseInput, target: fortifiedTarget, stance: 'balanced' });
    expect(fortified.margin).toBeLessThan(plain.margin);
  });

  it('clamps random rolls so reports remain bounded', () => {
    const low = resolveBattle({ ...baseInput, stance: 'balanced', randomRolls: [-1, -1, -1, -1] });
    const clamped = resolveBattle({ ...baseInput, stance: 'balanced', randomRolls: [0, 0, 0, 0] });
    expect(low.phases).toEqual(clamped.phases);
  });
});
