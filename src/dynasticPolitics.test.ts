import { describe, expect, it } from 'vitest';
import { careerRoles } from './campaign';
import {
  adoptGovernmentForm,
  arrangeDynasticMarriage,
  createDynasticPoliticsState,
  getDynasticWeeklyEffects,
  getMarriageCandidates,
  grantNobleTitle,
  normalizeDynasticPoliticsState,
  setSuccessionLaw,
  type DynasticActionContext,
} from './dynasticPolitics';

const leader = careerRoles.find((role) => role.nationId === 'britain' && role.tier === 1)!;
const context: DynasticActionContext = {
  week: 80,
  politicalPower: 120,
  treasury: 900,
  stability: 70,
  legitimacy: 72,
  role: leader,
};

describe('dynastic government simulation', () => {
  it('starts as a republic and migrates an old save without dynasty data', () => {
    const state = createDynasticPoliticsState('korea');
    const migrated = normalizeDynasticPoliticsState(undefined, 'korea');
    expect(state.formId).toBe('parliamentary-republic');
    expect(state.houseName).toContain('전주 이씨');
    expect(migrated).toEqual(state);
  });

  it('opens titles and succession only after a paid constitutional transition', () => {
    const state = createDynasticPoliticsState('korea');
    const blockedGrant = grantNobleTitle(state, {
      week: 80, recipientId: 'staff-a', recipientName: '참모 A', loyalty: 80, influence: 66,
      rankId: 'duke', domainId: 'britain', domainName: '영국 본토',
    }, context);
    const transition = adoptGovernmentForm(state, 'constitutional-monarchy', context)!;
    expect(blockedGrant).toBeNull();
    expect(transition.state.formId).toBe('constitutional-monarchy');
    expect(transition.politicalPowerDelta).toBe(-42);
    expect(transition.treasuryDelta).toBe(-120);

    const grant = grantNobleTitle(transition.state, {
      week: 81, recipientId: 'staff-a', recipientName: '참모 A', loyalty: 80, influence: 66,
      rankId: 'duke', domainId: 'britain', domainName: '영국 본토',
    }, { ...context, week: 81 })!;
    expect(grant.state.titleGrants).toHaveLength(1);
    expect(grant.state.titleGrants[0].titleName).toBe('영국 본토 공작');
    expect(grant.state.estateBurden).toBeGreaterThan(0);
    expect(grantNobleTitle(grant.state, {
      week: 82, recipientId: 'staff-b', recipientName: '참모 B', loyalty: 75, influence: 60,
      rankId: 'baron', domainId: 'britain', domainName: '영국 본토',
    }, { ...context, week: 82 })).toBeNull();
  });

  it('turns a foreign relationship into a marriage treaty and safer succession', () => {
    const monarchy = adoptGovernmentForm(createDynasticPoliticsState('korea'), 'constitutional-monarchy', context)!.state;
    const candidate = getMarriageCandidates([{ id: 'italy', name: '이탈리아 왕국' }])[0];
    const result = arrangeDynasticMarriage(monarchy, candidate, 68, { ...context, week: 82 })!;
    expect(result.state.marriages[0].partnerHouse).toContain('사보이');
    expect(result.state.successionSecurity).toBeGreaterThan(monarchy.successionSecurity);
    expect(result.relationDelta?.value).toBeGreaterThan(0);
  });

  it('makes succession law and an overgrown estate system visible in weekly costs and coup risk', () => {
    const monarchy = adoptGovernmentForm(createDynasticPoliticsState('germany'), 'crown-state', context)!.state;
    const lawful = setSuccessionLaw(monarchy, 'absolute-primogeniture', { ...context, week: 82 })!.state;
    const strained = { ...lawful, courtUnity: 28, successionSecurity: 24, estateBurden: 72 };
    const effects = getDynasticWeeklyEffects(strained);
    expect(lawful.successionLawId).toBe('absolute-primogeniture');
    expect(effects.weeklyCost).toBeGreaterThan(0);
    expect(effects.coupRisk).toBeGreaterThan(10);
  });
});
