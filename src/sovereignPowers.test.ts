import { describe, expect, it } from 'vitest';
import { createConstitutionalJudiciaryState, type ConstitutionalJudiciaryState } from './constitutionalJudiciary';
import { createDynasticPoliticsState, type DynasticPoliticsState, type NobleGrant } from './dynasticPolitics';
import {
  advanceSovereignPowersWeek,
  assessSovereignPower,
  createSovereignPowersState,
  deriveSovereignOfficeKind,
  exerciseSovereignPower,
  normalizeSovereignPowersState,
  type SovereignPowerContext,
} from './sovereignPowers';
import type { CareerRole } from './types';

const topRole: CareerRole = {
  id: 'korea-tier1', nationId: 'korea', title: '국가원수', branch: 'politics', tier: 1, archetype: 'head-of-state', scope: '국가 전체', authority: 95,
  expectation: '헌정 수호', historicalHolderId: 'historical-office', historicalHolderName: '기존 지도부', historicalOffice: '국가원수', historicalBasis: '테스트', coverIdentity: '국가원수', replacementEffect: '사용자가 대체',
};

const grant: NobleGrant = {
  id: 'grant-seoul-duke', recipientId: 'staff-1', recipientName: '김 참의', rankId: 'duke', titleName: '서울 공작', domainId: 'seoul', domainName: '서울', grantedWeek: 0,
  loyaltyAtGrant: 72, influenceAtGrant: 76, hereditary: true, weeklyStipend: 3.2,
};

function enactedConstitution(government: string, overrides: Partial<Record<'rights' | 'review' | 'appointments' | 'prosecution' | 'emergency' | 'territory', string>> = {}): ConstitutionalJudiciaryState {
  const state = createConstitutionalJudiciaryState('korea');
  return {
    ...state,
    status: 'enacted',
    enacted: {
      name: '테스트 헌법', enactedWeek: 0, ratificationMethodId: 'constituent-assembly', amendmentThreshold: '특별다수', publicSupport: 70, contradictions: [],
      clauses: {
        government,
        rights: overrides.rights ?? 'civil-liberties-charter',
        review: overrides.review ?? 'constitutional-court-review',
        appointments: overrides.appointments ?? 'executive-legislative-confirmation',
        prosecution: overrides.prosecution ?? 'independent-prosecution',
        emergency: overrides.emergency ?? 'sunset-emergency',
        territory: overrides.territory ?? 'unitary-local-government',
      },
    },
  };
}

function dynasty(formId: DynasticPoliticsState['formId'], withGrant = false): DynasticPoliticsState {
  return { ...createDynasticPoliticsState('korea'), formId, titleGrants: withGrant ? [grant] : [], crownAuthority: 60, successionSecurity: 42 };
}

function context(overrides: Partial<SovereignPowerContext> = {}): SovereignPowerContext {
  const constitution = enactedConstitution('presidential-separation');
  return {
    week: 0, year: 1942, nationId: 'korea', role: topRole, formId: 'presidential-republic', constitution, dynasty: dynasty('presidential-republic'), politicalPower: 200, treasury: 500,
    stability: 65, legitimacy: 62, unrest: 28, publicConfidence: 60, institutionalCapacity: 58, mediaFreedom: 65, justiceIndependence: 64,
    ...overrides,
  };
}

describe('historical sovereign and estate powers', () => {
  it('derives materially different offices from the constitution', () => {
    expect(deriveSovereignOfficeKind('presidential-republic', enactedConstitution('presidential-separation'))).toBe('executive-president');
    expect(deriveSovereignOfficeKind('semi-presidential-republic', enactedConstitution('semi-presidential'))).toBe('dual-executive-president');
    expect(deriveSovereignOfficeKind('constitutional-monarchy', enactedConstitution('constitutional-crown'))).toBe('constitutional-monarch');
    expect(deriveSovereignOfficeKind('peoples-commonwealth', enactedConstitution('council-directorate'))).toBe('collective-chair');
  });

  it('treats a presidential veto as express power but unilateral dissolution as constitutional overreach', () => {
    const state = createSovereignPowersState('korea');
    expect(assessSovereignPower(state, 'return-or-veto-law', context()).status).toBe('express');
    const dissolution = assessSovereignPower(state, 'dissolve-legislature', context());
    expect(dissolution.status).toBe('ultra-vires');
    expect(dissolution.projectedImpact.justiceIndependence).toBeLessThan(0);
    expect(dissolution.projectedImpact.legitimacy).toBeLessThan(0);
  });

  it('requires countersignature for ordinary constitutional-monarch acts and marks intervention as reserve power', () => {
    const constitution = enactedConstitution('constitutional-crown');
    const royalContext = context({ formId: 'constitutional-monarchy', constitution, dynasty: dynasty('constitutional-monarchy') });
    const state = createSovereignPowersState('korea');
    expect(assessSovereignPower(state, 'promulgate-law', royalContext).status).toBe('countersigned');
    expect(assessSovereignPower(state, 'dismiss-government', royalContext).status).toBe('reserve');
    expect(assessSovereignPower(state, 'executive-order', royalContext).status).toBe('ultra-vires');
  });

  it('opens estate powers only after a title and domain exist', () => {
    const constitution = enactedConstitution('constitutional-crown');
    const state = createSovereignPowersState('korea');
    const noEstate = context({ formId: 'crown-state', constitution, dynasty: dynasty('crown-state') });
    expect(assessSovereignPower(state, 'upper-house-review', noEstate).allowed).toBe(false);
    const titled = context({ formId: 'crown-state', constitution, dynasty: dynasty('crown-state', true) });
    const review = assessSovereignPower(state, 'upper-house-review', titled, grant);
    expect(review.status).toBe('historic-estate');
    expect(review.allowed).toBe(true);
  });

  it('makes revival of manorial justice an overreach under a civil-liberties constitution', () => {
    const constitution = enactedConstitution('constitutional-crown', { rights: 'civil-liberties-charter' });
    const royalContext = context({ formId: 'crown-state', constitution, dynasty: dynasty('crown-state', true) });
    const assessment = assessSovereignPower(createSovereignPowersState('korea'), 'manorial-court', royalContext, grant);
    expect(assessment.status).toBe('ultra-vires');
    expect(assessment.projectedImpact.justiceIndependence).toBeLessThanOrEqual(-16);
  });

  it('records an exercised reserve power and verifies its consequence several weeks later', () => {
    const constitution = enactedConstitution('constitutional-crown');
    const royalContext = context({ formId: 'constitutional-monarchy', constitution, dynasty: dynasty('constitutional-monarchy') });
    const result = exerciseSovereignPower(createSovereignPowersState('korea'), 'dismiss-government', royalContext);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('reserve');
    expect(result!.state.constitutionalConvention).toBeLessThan(72);
    expect(result!.state.history[0].resolved).toBe(false);
    const advanced = advanceSovereignPowersWeek(result!.state, { ...royalContext, week: result!.verificationWeek });
    expect(advanced.state.history[0].resolved).toBe(true);
    expect(advanced.events.some((event) => event.title.includes('권한 행사 검증'))).toBe(true);
  });

  it('models emergency declaration, review clock, and voluntary termination', () => {
    const state = createSovereignPowersState('korea');
    const declaration = exerciseSovereignPower(state, 'declare-emergency', context());
    expect(declaration?.state.activeEmergency?.reviewWeek).toBe(4);
    expect(assessSovereignPower(declaration!.state, 'declare-emergency', context()).allowed).toBe(false);
    const ended = exerciseSovereignPower(declaration!.state, 'end-emergency', { ...context(), week: 1 });
    expect(ended?.state.activeEmergency).toBeNull();
    expect(ended?.impact.mediaFreedom).toBeGreaterThan(0);
  });

  it('lets a political tier-two minister countersign but not seize a direct executive power', () => {
    const minister = { ...topRole, tier: 2 as const, title: '총리' };
    const constitution = enactedConstitution('constitutional-crown');
    const royalContext = context({ role: minister, formId: 'constitutional-monarchy', constitution, dynasty: dynasty('constitutional-monarchy') });
    const state = createSovereignPowersState('korea');
    expect(assessSovereignPower(state, 'promulgate-law', royalContext).allowed).toBe(true);
    expect(assessSovereignPower(state, 'executive-order', royalContext).allowed).toBe(false);
  });

  it('normalizes old saves without losing the campaign', () => {
    const restored = normalizeSovereignPowersState({ version: 1, nationId: 'korea', authorityCapital: 140, history: [] }, 'korea');
    expect(restored.authorityCapital).toBe(100);
    expect(restored.constitutionalConvention).toBe(72);
    expect(restored.activeEmergency).toBeNull();
  });
});
