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
  getPersonalLifeActivityAvailability,
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

  it('allows only one shared personal activity per week, even when switching action types', () => {
    const initial = configuredState();
    const candidate = getPersonalRelationshipCandidates(initial, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    let state = beginPersonalRelationship(initial, candidate, { ...context, week: 199 })!.state;
    let stability = context.stability;
    let treasury = context.treasury;
    let accepted = 0;
    for (let click = 0; click < 10; click += 1) {
      const result = resolvePersonalLifeAction(state, 'spend-time', { ...context, stability, treasury });
      if (!result) continue;
      accepted += 1;
      state = result.state;
      stability += result.stabilityDelta;
      treasury += result.treasuryDelta;
    }
    expect(accepted).toBe(1);
    expect(stability).toBe(69);
    expect(treasury).toBe(894);
    expect(state.lastActivityWeek).toBe(200);
    for (const action of ['discuss-boundaries', 'support-career', 'public-appearance', 'protect-privacy', 'separate'] as const) {
      expect(resolvePersonalLifeAction(state, action, context)).toBeNull();
    }
    expect(formalizePersonalUnion(state, 'private-commitment', 'private', context)).toBeNull();
    expect(getPersonalLifeActivityAvailability(state, 200)).toMatchObject({ allowed: false, remaining: 0, nextAvailableWeek: 201 });
  });

  it('restores the shared budget next week and preserves it across save and reload', () => {
    const initial = configuredState();
    const candidate = getPersonalRelationshipCandidates(initial, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    const courtship = beginPersonalRelationship(initial, candidate, context)!.state;
    const restored = normalizePersonalLifeState(JSON.parse(JSON.stringify(courtship)), 'korea');
    expect(resolvePersonalLifeAction(restored, 'spend-time', context)).toBeNull();
    const weekly = advancePersonalLifeWeek(restored, { week: 201, stability: 68, publicHealthPressure: 0, roleTier: 1 }).state;
    expect(getPersonalLifeActivityAvailability(weekly, 201)).toMatchObject({ allowed: true, remaining: 1 });
    const action = resolvePersonalLifeAction(weekly, 'spend-time', { ...context, week: 201 })!;
    expect(action).not.toBeNull();
    expect(resolvePersonalLifeAction(action.state, 'discuss-boundaries', { ...context, week: 201 })).toBeNull();
  });

  it('migrates old saves using their latest personal activity without blocking unused weeks', () => {
    const initial = configuredState();
    const candidate = getPersonalRelationshipCandidates(initial, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    const legacy: Partial<ReturnType<typeof createPersonalLifeState>> = { ...beginPersonalRelationship(initial, candidate, context)!.state };
    delete legacy.lastActivityWeek;
    const restored = normalizePersonalLifeState(legacy, 'korea');
    expect(restored.lastActivityWeek).toBe(200);
    expect(getPersonalLifeActivityAvailability(restored, 200).allowed).toBe(false);
    expect(getPersonalLifeActivityAvailability(restored, 201).allowed).toBe(true);
    expect(getPersonalLifeActivityAvailability(normalizePersonalLifeState(undefined, 'korea'), 200).allowed).toBe(true);
  });

  it('shares the budget across commitment, family plans and separation without reopening it through profile changes', () => {
    const initial = configuredState();
    const candidate = getPersonalRelationshipCandidates(initial, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    let state = beginPersonalRelationship(initial, candidate, { ...context, week: 199 })!.state;
    state = formalizePersonalUnion(state, 'private-commitment', 'private', context)!.state;
    expect(chooseFamilyPlan(state, 'guardianship', context)).toBeNull();
    state = chooseFamilyPlan(state, 'guardianship', { ...context, week: 201 })!.state;
    expect(chooseFamilyPlan(state, 'no-children', { ...context, week: 201 })).toBeNull();
    expect(resolvePersonalLifeAction(state, 'spend-time', { ...context, week: 201 })).toBeNull();
    expect(chooseFamilyPlan(state, 'guardianship', { ...context, week: 202 })).toBeNull();
    state = resolvePersonalLifeAction(state, 'separate', { ...context, week: 202 })!.state;
    state = configurePersonalIdentity(state, { gender: 'woman', orientation: 'bisexual', partnerTerm: 'auto', boundary: 'negotiated' }, 202);
    expect(beginPersonalRelationship(state, candidate, { ...context, week: 202 })).toBeNull();
    expect(beginPersonalRelationship(state, candidate, { ...context, week: 203 })).not.toBeNull();
  });

  it('does not consume an activity on rejected actions and keeps legislation outside the personal budget', () => {
    const initial = configuredState();
    const candidate = getPersonalRelationshipCandidates(initial, [{ id: 'korea', name: '한국', relationValue: 70 }])[0];
    const courtship = beginPersonalRelationship(initial, candidate, { ...context, week: 199 })!.state;
    expect(resolvePersonalLifeAction(courtship, 'spend-time', { ...context, treasury: 0 })).toBeNull();
    expect(formalizePersonalUnion(courtship, 'marriage', 'public', context)).toBeNull();
    expect(getPersonalLifeActivityAvailability(courtship, 200).allowed).toBe(true);
    const cared = resolvePersonalLifeAction(courtship, 'spend-time', context)!.state;
    const reformed = reformFamilyLaw(cared, 'marriage-equality', context)!.state;
    expect(reformed.familyLawId).toBe('marriage-equality');
    expect(getPersonalLifeActivityAvailability(reformed, 200).allowed).toBe(false);
  });
});
