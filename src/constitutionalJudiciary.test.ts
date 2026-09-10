import { getCampaignYearForWeek } from './campaignCalendar';
import { describe, expect, it } from 'vitest';
import {
  activateConstitutionalFounding,
  advanceConstitutionalJudiciaryWeek,
  canNominateJudicialOffice,
  createConstitutionalJudiciaryState,
  getConstitutionContradictions,
  getConstitutionDraftProgress,
  isJudicialOfficeConstitutionallyEnabled,
  judicialOffices,
  nominateJudicialCandidate,
  normalizeConstitutionalJudiciaryState,
  ratifyConstitution,
  resolveJudicialNomination,
  selectConstitutionClause,
  type ConstitutionalContext,
  type ConstitutionalJudiciaryState,
} from './constitutionalJudiciary';
import type { CareerRole } from './types';

const topRole: CareerRole = {
  id: 'korea-tier1', nationId: 'korea', title: '국가주석', branch: 'politics', tier: 1, archetype: 'head-of-state', scope: '국가 전체', authority: 95,
  expectation: '헌정 창설', historicalHolderId: 'historical-office', historicalHolderName: '기존 지도부', historicalOffice: '국가원수', historicalBasis: '테스트', coverIdentity: '국가원수', replacementEffect: '사용자가 국가원수를 대체',
};

const context = (week = 0, overrides: Partial<ConstitutionalContext> = {}): ConstitutionalContext => ({
  week, year: getCampaignYearForWeek(week), nationId: 'korea', role: topRole, politicalPower: 200, treasury: 500, stability: 68, legitimacy: 64, institutionalCapacity: 55, publicConfidence: 61, ...overrides,
});

const balancedDraft = [
  'parliamentary-cabinet',
  'civil-liberties-charter',
  'constitutional-court-review',
  'independent-commission',
  'independent-prosecution',
  'sunset-emergency',
  'devolved-regions',
];

function draftConstitution(state: ConstitutionalJudiciaryState) {
  return balancedDraft.reduce((current, clauseId) => selectConstitutionClause(current, clauseId, context())!.state, state);
}

describe('constitutional founding and judicial appointments', () => {
  it('opens the constitutional convention only at the highest office', () => {
    const state = createConstitutionalJudiciaryState('korea');
    const junior = context(0, { role: { ...topRole, tier: 2, title: '법무위원' } });
    expect(activateConstitutionalFounding(state, junior)).toBeNull();
    const result = activateConstitutionalFounding(state, context());
    expect(result?.state.status).toBe('drafting');
    expect(result?.state.authorityReachedWeek).toBe(0);
  });

  it('builds a constitution from seven independent axes and ratifies it', () => {
    let state = activateConstitutionalFounding(createConstitutionalJudiciaryState('korea'), context())!.state;
    state = draftConstitution(state);
    expect(getConstitutionDraftProgress(state)).toBe(7);
    const result = ratifyConstitution(state, 'constituent-assembly', context());
    expect(result).not.toBeNull();
    expect(result!.state.status).toBe('enacted');
    expect(result!.state.enacted?.clauses.prosecution).toBe('independent-prosecution');
    expect(result!.justiceIndependenceDelta).toBeGreaterThan(0);
    expect(result!.governmentFormId).toBe('parliamentary-republic');
  });

  it('surfaces incompatible rights, emergency, review, and appointment clauses', () => {
    const contradictions = getConstitutionContradictions({
      rights: 'civil-liberties-charter',
      emergency: 'permanent-security-directorate',
      review: 'constitutional-court-review',
      appointments: 'leader-appointment',
      territory: 'self-determination-compact',
    });
    expect(contradictions.length).toBeGreaterThanOrEqual(3);
  });

  it('requires a complete draft and a compatible ratification method', () => {
    let state = activateConstitutionalFounding(createConstitutionalJudiciaryState('korea'), context())!.state;
    state = selectConstitutionClause(state, 'parliamentary-cabinet', context())!.state;
    expect(ratifyConstitution(state, 'referendum', context())).toBeNull();
    state = draftConstitution(state);
    expect(ratifyConstitution(state, 'royal-assent', context())).toBeNull();
  });

  it('creates a separate constitutional bench only when the constitution establishes one', () => {
    let state = activateConstitutionalFounding(createConstitutionalJudiciaryState('korea'), context())!.state;
    const supremeCourtDraft = balancedDraft.map((clauseId) => clauseId === 'constitutional-court-review' ? 'supreme-court-review' : clauseId);
    state = supremeCourtDraft.reduce((current, clauseId) => selectConstitutionClause(current, clauseId, context())!.state, state);
    state = ratifyConstitution(state, 'constituent-assembly', context())!.state;
    expect(isJudicialOfficeConstitutionallyEnabled(state, 'constitutional-justice')).toBe(false);
    expect(isJudicialOfficeConstitutionallyEnabled(state, 'supreme-chief')).toBe(true);
  });

  it('keeps presidential and semi-presidential constitutions distinct in the state system', () => {
    for (const [clauseId, expectedForm] of [['presidential-separation', 'presidential-republic'], ['semi-presidential', 'semi-presidential-republic']] as const) {
      let state = activateConstitutionalFounding(createConstitutionalJudiciaryState('korea'), context())!.state;
      const draft = balancedDraft.map((item) => item === 'parliamentary-cabinet' ? clauseId : item);
      state = draft.reduce((current, item) => selectConstitutionClause(current, item, context())!.state, state);
      expect(ratifyConstitution(state, 'referendum', context())?.governmentFormId).toBe(expectedForm);
    }
  });

  it('moves a judicial nominee through vetting, hearing, and confirmation over several weeks', () => {
    let state = createConstitutionalJudiciaryState('korea');
    const office = judicialOffices.find((item) => item.id === 'supreme-chief')!;
    const candidate = state.candidates.find((item) => item.philosophy === 'rights-oriented')!;
    state = nominateJudicialCandidate(state, office.id, candidate.id, context(0))!.state;
    expect(state.activeNomination?.stage).toBe('vetting');
    state = advanceConstitutionalJudiciaryWeek(state, context(2)).state;
    expect(state.activeNomination?.stage).toBe('hearing');
    state = advanceConstitutionalJudiciaryWeek(state, context(3)).state;
    expect(state.activeNomination?.stage).toBe('confirmation');
    state = resolveJudicialNomination(state, 'confirm', context(3))!.state;
    expect(state.activeNomination).toBeNull();
    expect(state.appointments[0].officeId).toBe('supreme-chief');
    expect(state.courtIndependence).toBeGreaterThan(50);
  });

  it('lets a political tier-two office nominate an appellate judge but not the chief justice', () => {
    const juniorContext = context(0, { role: { ...topRole, tier: 2, title: '법무위원' } });
    expect(canNominateJudicialOffice(judicialOffices.find((item) => item.id === 'appellate-chief')!, juniorContext).allowed).toBe(true);
    expect(canNominateJudicialOffice(judicialOffices.find((item) => item.id === 'supreme-chief')!, juniorContext).allowed).toBe(false);
  });

  it('normalizes old saves with a fresh candidate market', () => {
    const restored = normalizeConstitutionalJudiciaryState({ version: 1, nationId: 'korea', courtIndependence: 130, history: [] }, 'korea');
    expect(restored.courtIndependence).toBe(100);
    expect(restored.candidates).toHaveLength(6);
    expect(restored.status).toBe('awaiting-authority');
  });
});
