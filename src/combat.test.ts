import { describe, expect, it } from 'vitest';
import { forecastBattle, resolveBattle } from './combat';
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

  it('weakens the same defender as supply is depleted without changing the battle rolls', () => {
    const reports = [100, 40, 0].map((supply) => resolveBattle({ ...baseInput, stance: 'balanced', target: { ...plainTarget, supply } }));
    expect(reports[0].margin).toBeLessThan(reports[1].margin);
    expect(reports[1].margin).toBeLessThan(reports[2].margin);
    expect(reports[0].phases[2].defenderScore).toBeGreaterThan(reports[1].phases[2].defenderScore);
    expect(reports[1].phases[2].defenderScore).toBeGreaterThan(reports[2].phases[2].defenderScore);
  });
});

describe('pre-battle forecast', () => {
  const forecastInput = {
    week: baseInput.week,
    division: baseInput.division,
    commander: baseInput.commander,
    target: baseInput.target,
    enemyPressure: baseInput.enemyPressure,
    intelNetwork: baseInput.intelNetwork,
    doctrineBonus: baseInput.doctrineBonus,
    policyAttackBonus: baseInput.policyAttackBonus,
    priorityBonus: baseInput.priorityBonus,
  };

  it('uses the combat model to show fortified targets as harder objectives', () => {
    const plain = forecastBattle({ ...forecastInput, stance: 'balanced' });
    const fortified = forecastBattle({ ...forecastInput, target: fortifiedTarget, stance: 'balanced' });
    expect(fortified.successChance).toBeLessThanOrEqual(plain.successChance);
    expect(fortified.defenderPower).toBeGreaterThan(plain.defenderPower);
  });

  it('shows the offensive upside and casualty cost of an aggressive stance', () => {
    const cautious = forecastBattle({ ...forecastInput, stance: 'cautious' });
    const aggressive = forecastBattle({ ...forecastInput, stance: 'aggressive' });
    expect(aggressive.successChance).toBeGreaterThanOrEqual(cautious.successChance);
    expect(aggressive.strengthLoss[1]).toBeGreaterThanOrEqual(cautious.strengthLoss[1]);
    expect(aggressive.supplySpent).toBeGreaterThan(cautious.supplySpent);
  });

  it('narrows the reported uncertainty when intelligence improves', () => {
    const lowIntel = forecastBattle({ ...forecastInput, stance: 'balanced', intelNetwork: 35 });
    const highIntel = forecastBattle({ ...forecastInput, stance: 'balanced', intelNetwork: 82 });
    expect(lowIntel.confidence).toBe('low');
    expect(highIntel.confidence).toBe('high');
    expect(highIntel.successRange[1] - highIntel.successRange[0]).toBeLessThan(lowIntel.successRange[1] - lowIntel.successRange[0]);
  });

  it('uses persistent defender supply in the forecast as well as actual resolution', () => {
    const forecasts = [100, 40, 0].map((supply) => forecastBattle({ ...forecastInput, stance: 'balanced', target: { ...plainTarget, supply } }));
    expect(forecasts[0].defenderPower).toBeGreaterThan(forecasts[1].defenderPower);
    expect(forecasts[1].defenderPower).toBeGreaterThan(forecasts[2].defenderPower);
    expect(forecasts[0].expectedMargin).toBeLessThan(forecasts[1].expectedMargin);
    expect(forecasts[1].expectedMargin).toBeLessThan(forecasts[2].expectedMargin);
    expect(forecasts[0].successChance).toBeLessThanOrEqual(forecasts[1].successChance);
    expect(forecasts[1].successChance).toBeLessThanOrEqual(forecasts[2].successChance);
  });
});
