import { describe, expect, it } from 'vitest';
import { careerRoles } from './campaign';
import {
  advancePersonalLifeWeek,
  beginPersonalRelationship,
  canFormalizeUnion,
  chooseFamilyPlan,
  configurePersonalIdentity,
  createPersonalLifeState,
  formalizePersonalUnion,
  getPartnerTerm,
  getPersonalRelationshipCandidates,
  normalizePersonalLifeState,
  reformFamilyLaw,
  resolvePersonalLifeAction,
  type PersonalLifeContext,
} from './personalLife';

const leader = careerRoles.find((role) => role.nationId === 'korea' && role.tier === 1)!;
const context: PersonalLifeContext = {
  week: 200,
  year: 1946,
  politicalPower: 180,
  treasury: 900,
  stability: 68,
  legitimacy: 74,
  education: 72,
  institutionalCapacity: 70,
  role: leader,
};

function configuredState() {
  return configurePersonalIdentity(createPersonalLifeState('korea'), {
    gender: 'woman',
    orientation: 'gay-lesbian',
    partnerTerm: 'auto',
    boundary: 'negotiated',
  });
}

describe('personal life and family-law simulation', () => {
  it('provides 39 unique fictional candidates across all 13 playable nations', () => {
    const state = configurePersonalIdentity(createPersonalLifeState('korea'), {
      gender: 'woman',
      orientation: 'bisexual',
      partnerTerm: 'spouse',
      boundary: 'exclusive',
    });
    const countryIds = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'];
    const candidates = getPersonalRelationshipCandidates(state, countryIds.map((id, index) => ({ id, name: id, relationValue: 45 + index })));
    expect(candidates).toHaveLength(39);
    expect(new Set(candidates.map((candidate) => candidate.id)).size).toBe(39);
    expect(candidates.every((candidate) => candidate.fictionalComposite)).toBe(true);
  });

  it('keeps identity, orientation and partner terminology independent', () => {
    const state = configuredState();
    const candidates = getPersonalRelationshipCandidates(state, [
      { id: 'korea', name: '한국', relationValue: 70 },
      { id: 'britain', name: '영국', relationValue: 55 },
    ]);
    expect(candidates.length).toBe(2);
    expect(candidates.every((candidate) => candidate.gender === 'woman')).toBe(true);
    expect(getPartnerTerm(candidates[0].gender, state.profile.partnerTerm)).toBe('아내');
    expect(candidates.every((candidate) => candidate.fictionalComposite)).toBe(true);
  });

  it('allows a same-gender relationship while keeping legal marriage gated by family law', () => {
    const state = configuredState();
    const candidate = getPersonalRelationshipCandidates(state, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    const courtship = beginPersonalRelationship(state, candidate, context)!;
    expect(courtship.state.activeRelationship?.pairKind).toBe('same-gender');
    expect(canFormalizeUnion(courtship.state, 'marriage').allowed).toBe(false);
    expect(canFormalizeUnion(courtship.state, 'private-commitment').allowed).toBe(true);
  });

  it('can establish marriage equality early in an alternate history when institutions are strong enough', () => {
    const state = configuredState();
    const reformed = reformFamilyLaw(state, 'marriage-equality', context)!;
    const candidate = getPersonalRelationshipCandidates(reformed.state, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    const courtship = beginPersonalRelationship(reformed.state, candidate, context)!.state;
    const marriage = formalizePersonalUnion(courtship, 'marriage', 'public', { ...context, week: 204 })!;
    expect(marriage.state.activeRelationship?.stage).toBe('married');
    expect(marriage.state.activeRelationship?.partnerTerm).toBe('아내');
    expect(marriage.state.activeRelationship?.legalRecognition).toBe('full');
    expect(marriage.unrestDelta).toBe(0);
  });

  it('supports civil partnership, negotiated care, adoption and separation as distinct decisions', () => {
    let state = configuredState();
    state = reformFamilyLaw(state, 'civil-partnerships', context)!.state;
    const candidate = getPersonalRelationshipCandidates(state, [{ id: 'britain', name: '영국', relationValue: 64 }])[0];
    state = beginPersonalRelationship(state, candidate, context)!.state;
    state = resolvePersonalLifeAction(state, 'discuss-boundaries', { ...context, week: 201 })!.state;
    state = formalizePersonalUnion(state, 'civil-partnership', 'private', { ...context, week: 202 })!.state;
    state = chooseFamilyPlan(state, 'adoption', { ...context, week: 203 })!.state;
    expect(state.activeRelationship?.familyPlan).toBe('adoption');
    expect(state.activeRelationship?.dependents).toBe(1);
    expect(resolvePersonalLifeAction(state, 'separate', { ...context, week: 260 })!.state.activeRelationship).toBeNull();
  });

  it('migrates old saves and carries relationship quality into weekly nation simulation', () => {
    const migrated = normalizePersonalLifeState(undefined, 'korea');
    expect(migrated.profile.configured).toBe(false);

    let state = configuredState();
    const candidate = getPersonalRelationshipCandidates(state, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    state = beginPersonalRelationship(state, candidate, context)!.state;
    state = resolvePersonalLifeAction(state, 'spend-time', { ...context, week: 201 })!.state;
    const weekly = advancePersonalLifeWeek(state, { week: 202, stability: 70, publicHealthPressure: 0, roleTier: 1 });
    expect(weekly.state.activeRelationship?.weeksTogether).toBe(1);
    expect(weekly.weeklyCost).toBeGreaterThan(0);
    expect(weekly.note).toContain('아내');
  });
});
