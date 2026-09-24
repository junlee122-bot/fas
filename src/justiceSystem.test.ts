import { getCampaignYearForWeek } from './campaignCalendar';
import { describe, expect, it } from 'vitest';
import {
  advanceJusticeWeek,
  canUseJusticeOption,
  createJusticeSystemState,
  getAvailableJusticeCaseTemplates,
  getJusticeDecisionOption,
  normalizeJusticeSystemState,
  openJusticeCase,
  resolveJusticeDecision,
  type JusticeContext,
  type JusticeSystemState,
} from './justiceSystem';
import type { CareerRole } from './types';

const role: CareerRole = {
  id: 'justice-test-role',
  nationId: 'britain',
  title: '법무장관',
  branch: 'politics',
  tier: 1,
  archetype: 'cabinet-minister',
  scope: '사법·검찰 결재',
  authority: 88,
  expectation: '법치 수호',
  historicalHolderId: 'test-holder',
  historicalHolderName: '시험 지도부',
  historicalOffice: '법무부',
  historicalBasis: '테스트',
  coverIdentity: '법무장관',
  replacementEffect: '사용자가 법무장관을 대체',
};

const context = (week: number, overrides: Partial<JusticeContext> = {}): JusticeContext => ({
  week,
  year: getCampaignYearForWeek(week),
  phase: 'war',
  nationId: 'britain',
  role,
  politicalPower: 100,
  treasury: 500,
  stability: 72,
  intelNetwork: 68,
  legitimacy: 64,
  unrest: 34,
  institutionalCapacity: 58,
  mediaFreedom: 62,
  pressTrust: 57,
  activeElection: false,
  strategyId: 'reconstruction-state',
  ...overrides,
});

describe('justice system', () => {
  it('starts with a concrete procurement file and jurisdiction decision', () => {
    const state = createJusticeSystemState('britain', 0);
    expect(state.cases).toHaveLength(1);
    expect(state.cases[0].stage).toBe('assessment');
    expect(state.pendingDecision?.kind).toBe('case-opening');
    expect(state.cases[0].evidence).toHaveLength(3);
  });

  it('makes independent prosecution materially different from shelving the case', () => {
    const base = createJusticeSystemState('britain', 0);
    const independent = resolveJusticeDecision(base, 'appoint-independent-prosecutor', context(0));
    const shelved = resolveJusticeDecision(base, 'shelve-allegation', context(0));
    expect(independent).not.toBeNull();
    expect(shelved).not.toBeNull();
    expect(independent!.state.cases[0].stage).toBe('investigation');
    expect(independent!.state.independence).toBeGreaterThan(base.independence);
    expect(shelved!.state.cases[0].stage).toBe('closed');
    expect(shelved!.state.impunity).toBeGreaterThan(independent!.state.impunity);
    expect(shelved!.legitimacyDelta).toBeLessThan(0);
  });

  it('does not finish a case in one week and opens bribery, attack, media, and charging turns in order', () => {
    let state = resolveJusticeDecision(createJusticeSystemState('britain', 0), 'appoint-independent-prosecutor', context(0))!.state;
    expect(advanceJusticeWeek(state, context(1)).state.cases[0].stage).toBe('investigation');

    let result = advanceJusticeWeek(state, context(3));
    expect(result.state.pendingDecision?.kind).toBe('bribe-approach');
    state = resolveJusticeDecision(result.state, 'refuse-and-record-bribe', context(3))!.state;

    result = advanceJusticeWeek(state, context(5));
    expect(result.state.pendingDecision?.kind).toBe('prosecutor-threat');
    state = resolveJusticeDecision(result.state, 'protect-prosecution-team', context(5))!.state;

    result = advanceJusticeWeek(state, context(7));
    expect(result.state.pendingDecision?.kind).toBe('media-leak');
    state = resolveJusticeDecision(result.state, 'evidence-based-briefing', context(7))!.state;

    result = advanceJusticeWeek(state, context(9));
    expect(result.state.pendingDecision?.kind).toBe('charge-route');
  });

  it('turns a secret arrangement into immediate resources and lasting corruption risk', () => {
    let state = resolveJusticeDecision(createJusticeSystemState('britain', 0), 'direct-ministry-investigation', context(0))!.state;
    state = advanceJusticeWeek(state, context(2)).state;
    const result = resolveJusticeDecision(state, 'accept-secret-arrangement', context(2));
    expect(result).not.toBeNull();
    expect(result!.treasuryDelta).toBeGreaterThan(0);
    expect(result!.politicalPowerDelta).toBeGreaterThan(0);
    expect(result!.state.integrity).toBeLessThan(state.integrity);
    expect(result!.state.impunity).toBeGreaterThan(state.impunity);
    expect(result!.publicConfidenceDelta).toBeLessThan(0);
  });

  it('carries a public prosecution through a multi-week trial, verdict, and lawful closure', () => {
    let state = resolveJusticeDecision(createJusticeSystemState('britain', 0), 'appoint-independent-prosecutor', context(0))!.state;
    state = resolveJusticeDecision(advanceJusticeWeek(state, context(3)).state, 'controlled-sting', context(3))!.state;
    state = resolveJusticeDecision(advanceJusticeWeek(state, context(5)).state, 'protect-prosecution-team', context(5))!.state;
    state = resolveJusticeDecision(advanceJusticeWeek(state, context(7)).state, 'evidence-based-briefing', context(7))!.state;
    state = resolveJusticeDecision(advanceJusticeWeek(state, context(9)).state, 'file-public-indictment', context(9))!.state;
    expect(state.cases[0].stage).toBe('pretrial');
    state = advanceJusticeWeek(state, context(13)).state;
    expect(state.pendingDecision?.kind).toBe('trial-procedure');
    state = resolveJusticeDecision(state, 'open-court', context(13))!.state;
    expect(state.cases[0].stage).toBe('trial');
    const verdictWeek = state.cases[0].nextReviewWeek;
    state = advanceJusticeWeek(state, context(verdictWeek)).state;
    expect(state.pendingDecision?.kind).toBe('verdict-response');
    expect(state.cases[0].outcome).toBeTruthy();
    state = resolveJusticeDecision(state, 'respect-verdict', context(verdictWeek))!.state;
    expect(state.cases[0].stage).toBe('closed');
    expect(state.independence).toBeGreaterThan(48);
  });

  it('locks era-specific cases and creates a new official file only when the docket is clear', () => {
    expect(getAvailableJusticeCaseTemplates(1942).some((item) => item.id === 'offshore-minister')).toBe(false);
    expect(getAvailableJusticeCaseTemplates(1980).some((item) => item.id === 'offshore-minister')).toBe(true);
    const busy = createJusticeSystemState('britain', 0);
    expect(openJusticeCase(busy, 'classified-papers', context(0))).toBeNull();
    const cleared: JusticeSystemState = { ...busy, pendingDecision: null };
    const opened = openJusticeCase(cleared, 'classified-papers', context(0));
    expect(opened?.state.cases).toHaveLength(2);
    expect(opened?.state.pendingDecision?.kind).toBe('case-opening');
  });

  it('normalizes old or partial saves without dropping the campaign', () => {
    const fallback = normalizeJusticeSystemState(undefined, 'britain', 10);
    const restored = normalizeJusticeSystemState({ ...fallback, integrity: 120, history: [] }, 'britain', 10);
    expect(restored.integrity).toBe(100);
    expect(restored.cases[0].title).toContain('포탄');
    expect(restored.pendingDecision?.caseId).toBe(restored.cases[0].id);
  });

  it('lets junior roles report wrongdoing but reserves coercive state powers for senior offices', () => {
    const juniorContext = context(0, { role: { ...role, tier: 5, title: '수사기록관' } });
    expect(canUseJusticeOption(getJusticeDecisionOption('refuse-and-record-bribe'), juniorContext).allowed).toBe(true);
    expect(canUseJusticeOption(getJusticeDecisionOption('controlled-sting'), juniorContext).allowed).toBe(false);
    expect(canUseJusticeOption(getJusticeDecisionOption('refer-special-court'), juniorContext).allowed).toBe(false);
    expect(canUseJusticeOption(getJusticeDecisionOption('executive-pardon'), context(0)).allowed).toBe(true);
  });
});
