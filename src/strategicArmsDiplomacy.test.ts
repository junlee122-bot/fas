import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  applyStrategicPolicyRelations,
  applyStrategicPolicyReward,
  armsDiplomacyPolicies,
  getEquipmentProcurementQuote,
  getNationArmsProfile,
  getStageDiplomaticPolicies,
  getStageWeaponPrograms,
  getStrategicStage,
  nationArmsProfiles,
  strategicStages,
  weaponPrograms,
} from './strategicArmsDiplomacy';

describe('strategic arms and diplomacy model', () => {
  it('covers every playable nation, stage and weapon category', () => {
    expect(Object.keys(nationArmsProfiles)).toHaveLength(nations.length);
    expect(strategicStages).toHaveLength(5);
    expect(weaponPrograms).toHaveLength(40);
    expect(armsDiplomacyPolicies).toHaveLength(30);
    nations.forEach((nation) => {
      const profile = getNationArmsProfile(nation.id);
      expect(profile.historicalAnchor.length).toBeGreaterThan(25);
      expect(profile.priorities).toHaveLength(3);
    });
    strategicStages.forEach((stage) => {
      expect(getStageWeaponPrograms(stage.id)).toHaveLength(8);
      expect(getStageDiplomaticPolicies(stage.id)).toHaveLength(6);
    });
  });

  it('maps the 1942–2060 campaign to explicit strategic stages', () => {
    expect(getStrategicStage(1942).id).toBe('total-war');
    expect(getStrategicStage(1955).id).toBe('reconstruction');
    expect(getStrategicStage(1975).id).toBe('bipolar');
    expect(getStrategicStage(2020).id).toBe('networked');
    expect(getStrategicStage(2060).id).toBe('horizon');
  });

  it('turns national capacity and enacted diplomacy into visible procurement quotes', () => {
    const base = getEquipmentProcurementQuote('korea', 1942, 'infantry', 100);
    const improved = getEquipmentProcurementQuote('korea', 1942, 'infantry', 100, [
      'arms-diplomacy-total-war-licensed-mass-production',
      'arms-diplomacy-total-war-combined-standards',
    ]);
    expect(base.route).toBe('aid');
    expect(improved.treasuryCost).toBeLessThan(base.treasuryCost);
    expect(improved.interoperabilityEffect).toBeGreaterThan(base.interoperabilityEffect);
    expect(base.explanation).toContain('수입의존');
  });

  it('applies policy rewards without mutating or overflowing live game resources', () => {
    const policy = armsDiplomacyPolicies.find((item) => item.id === 'npt-safeguards')!;
    const game = {
      week: 0, manpower: 100, politicalPower: 50, fuel: 20, steel: 20, factories: 10,
      stability: 98, warSupport: 95, commandPoints: 10, treasury: 100, victoryScore: 0,
      airPower: 99, navalPower: 99, intelNetwork: 98, enemyPressure: 20,
    };
    const rewarded = applyStrategicPolicyReward(game, policy);
    expect(rewarded).not.toBe(game);
    expect(rewarded.stability).toBeLessThanOrEqual(100);
    expect(rewarded.airPower).toBeLessThanOrEqual(100);
    expect(game.stability).toBe(98);

    const relations = [{ id: 'usa', value: 95 }, { id: 'ussr', value: 20 }];
    const nextRelations = applyStrategicPolicyRelations(relations, policy);
    expect(nextRelations[0].value).toBe(100);
    expect(nextRelations[1].value).toBeGreaterThan(relations[1].value);
    expect(relations[0].value).toBe(95);
  });
});
