import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  aggregateArmsDiplomacySessions,
  armsDiplomacyDoctrines,
  simulateArmsDiplomacySession,
} from './armsDiplomacyPlaytest';
import { strategicStages } from './strategicArmsDiplomacy';

describe('nation-by-stage arms diplomacy playtest', () => {
  it('is deterministic while doctrines and seeds create different paths', () => {
    const first = simulateArmsDiplomacySession('korea', 'reconstruction', 14);
    expect(simulateArmsDiplomacySession('korea', 'reconstruction', 14)).toEqual(first);
    const alternative = simulateArmsDiplomacySession('korea', 'reconstruction', 15);
    expect(alternative.doctrine).not.toBe(first.doctrine);
    expect(alternative.pathSignature).not.toBe(first.pathSignature);
    expect(first.weaponPrograms).toHaveLength(12);
    expect(first.diplomaticPolicies).toHaveLength(4);
  });

  it('covers all 13 nations and five stages without losing behavior profiles', () => {
    const sessions = nations.flatMap((nation) => strategicStages.flatMap((stage) => (
      Array.from({ length: armsDiplomacyDoctrines.length }, (_, iteration) => (
        simulateArmsDiplomacySession(nation.id, stage.id, iteration)
      ))
    )));
    const summary = aggregateArmsDiplomacySessions(sessions, armsDiplomacyDoctrines.length);
    expect(summary.sessions).toBe(nations.length * strategicStages.length * armsDiplomacyDoctrines.length);
    expect(summary.nationCoverage).toBe(nations.length);
    expect(summary.stageCoverage).toBe(strategicStages.length);
    expect(summary.doctrineCoverage).toBe(armsDiplomacyDoctrines.length);
    expect(summary.byNationStage).toHaveLength(nations.length * strategicStages.length);
    expect(summary.totalWeaponProgramUses).toBe(summary.sessions * 12);
    expect(summary.totalDiplomaticPolicyUses).toBe(summary.sessions * 4);
    summary.byNationStage.forEach((group) => {
      expect(group.doctrineCoverage).toBe(armsDiplomacyDoctrines.length);
      expect(group.averageDecisionImpact).toBeGreaterThan(0);
    });
  });
});
