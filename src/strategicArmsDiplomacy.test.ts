import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  applyArmsPolicyReviewToPortfolio,
  applyProcurementToPortfolio,
  applyStrategicPolicyToPortfolio,
  applyStrategicPolicyRelations,
  applyStrategicPolicyReward,
  armsDiplomacyPolicies,
  createArmsPortfolioState,
  getEquipmentProcurementQuote,
  getArmsPolicyReviewedMarker,
  getArmsPolicyReviewMarker,
  getNationArmsProfile,
  getStageDiplomaticPolicies,
  getStageWeaponPrograms,
  getStrategicStage,
  nationArmsProfiles,
  normalizeArmsPortfolioState,
  parseArmsPolicyReviewMarker,
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

  it('compares player-selected routes with sustainment and 1/3/5-year outcomes', () => {
    const portfolio = createArmsPortfolioState('philippines');
    const aid = getEquipmentProcurementQuote('philippines', 1947, 'aircraft', 100, [], 'aid', portfolio);
    const license = getEquipmentProcurementQuote('philippines', 1947, 'aircraft', 100, [], 'license', portfolio);
    expect(aid.treasuryCost).toBeLessThan(license.treasuryCost);
    expect(aid.supplySecurityEffect).toBeLessThan(license.supplySecurityEffect);
    expect(aid.forecast.map((forecast) => forecast.years)).toEqual([1, 3, 5]);
    expect(license.replacementCost).toBeLessThan(license.treasuryCost);
    expect(aid.successChance).toBeGreaterThanOrEqual(24);
    expect(aid.explanation).toContain('현지 정비');
  });

  it('persists aid-to-license localization and repeated-route fatigue', () => {
    const initial = createArmsPortfolioState('korea');
    const aidQuote = getEquipmentProcurementQuote('korea', 1942, 'infantry', 100, [], 'aid', initial);
    const afterAid = applyProcurementToPortfolio(initial, {
      week: 0,
      year: 1942,
      kind: 'adoption',
      title: '원조 소총 체계',
      category: 'infantry',
      quote: aidQuote,
    });
    const licenseQuote = getEquipmentProcurementQuote('korea', 1943, 'infantry', 100, [], 'license', afterAid);
    const repeatedAid = getEquipmentProcurementQuote('korea', 1943, 'infantry', 100, [], 'aid', afterAid);
    expect(licenseQuote.benefits.some((benefit) => benefit.includes('이전 조달 단계'))).toBe(true);
    expect(repeatedAid.multiplier).toBeGreaterThan(aidQuote.multiplier);
    expect(afterAid.routeUses.aid).toBe(1);
    expect(afterAid.history.at(-1)?.summary).toContain('현지화');
    expect(normalizeArmsPortfolioState(afterAid, 'korea').history).toHaveLength(1);
  });

  it('requires maintenance rights after two direct imports and rewards transparent strategic programs', () => {
    const initial = createArmsPortfolioState('philippines');
    const firstQuote = getEquipmentProcurementQuote('philippines', 1950, 'aircraft', 100, [], 'import', initial);
    const first = applyProcurementToPortfolio(initial, { week: 1, year: 1950, kind: 'adoption', title: '직도입 1차', category: 'aircraft', quote: firstQuote });
    const secondQuote = getEquipmentProcurementQuote('philippines', 1951, 'aircraft', 100, [], 'import', first);
    const second = applyProcurementToPortfolio(first, { week: 53, year: 1951, kind: 'adoption', title: '직도입 2차', category: 'aircraft', quote: secondQuote });
    const locked = getEquipmentProcurementQuote('philippines', 1952, 'aircraft', 100, [], 'import', second);
    expect(locked.available).toBe(false);
    expect(locked.unavailableReason).toContain('면허생산');

    const opaque = getEquipmentProcurementQuote('korea', 1970, 'strategic', 120, [], 'indigenous', createArmsPortfolioState('korea'));
    const transparent = getEquipmentProcurementQuote('korea', 1970, 'strategic', 120, [
      'arms-diplomacy-bipolar-npt-safeguards',
    ], 'indigenous', createArmsPortfolioState('korea'));
    expect(opaque.warnings.some((warning) => warning.includes('사전통보'))).toBe(true);
    expect(transparent.benefits.some((benefit) => benefit.includes('핫라인'))).toBe(true);
  });

  it('schedules and resolves actual long-term policy reviews', () => {
    const policy = armsDiplomacyPolicies.find((item) => item.id === 'licensed-mass-production')!;
    const marker = getArmsPolicyReviewMarker(policy, 104);
    const schedule = parseArmsPolicyReviewMarker(marker)!;
    expect(schedule.policyId).toBe(policy.id);
    expect(getArmsPolicyReviewedMarker(schedule)).toBe(`arms-reviewed:104:total-war:${policy.id}`);
    const enacted = applyStrategicPolicyToPortfolio(createArmsPortfolioState('korea'), policy, 0, 1942);
    const review = applyArmsPolicyReviewToPortfolio(enacted, schedule, 104);
    expect(['better', 'matched', 'worse']).toContain(review.status);
    expect(review.state.history.at(-1)?.kind).toBe('review');
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
