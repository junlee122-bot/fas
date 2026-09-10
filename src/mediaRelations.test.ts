import { describe, expect, it } from 'vitest';
import {
  advanceMediaRelationsWeek,
  calculateDisclosureRisk,
  createMediaRelationsState,
  normalizeMediaRelationsState,
  reformMediaLaw,
  requestPressInterview,
  resolveExposureIncident,
  respondToInterview,
  type ExposureIncident,
  type MediaRelationsContext,
  type MediaRelationsState,
} from './mediaRelations';
import { configurePersonalIdentity, createPersonalLifeState, type PersonalLifeState } from './personalLife';
import type { CareerRole } from './types';

const topPoliticalRole: CareerRole = {
  id: 'test-head',
  nationId: 'korea',
  title: '임시정부 주석',
  branch: 'politics',
  tier: 1,
  archetype: 'head-of-state',
  scope: '국가 전체',
  authority: 95,
  expectation: '국가 건설',
  historicalHolderId: 'test',
  historicalHolderName: '대체된 인물',
  historicalOffice: '국가원수',
  historicalBasis: '테스트',
  coverIdentity: '공개 신분',
  replacementEffect: '테스트 세계선',
};

function queerPersonalLife(familyLawId: PersonalLifeState['familyLawId'] = 'restrictive-code') {
  return {
    ...configurePersonalIdentity(createPersonalLifeState('korea'), {
      gender: 'woman',
      orientation: 'gay-lesbian',
      partnerTerm: 'wife',
      boundary: 'exclusive',
    }),
    familyLawId,
  };
}

function context(overrides: Partial<MediaRelationsContext> = {}): MediaRelationsContext {
  return {
    week: 220,
    year: 1946,
    role: topPoliticalRole,
    politicalPower: 120,
    treasury: 500,
    stability: 62,
    legitimacy: 66,
    unrest: 48,
    education: 72,
    institutionalCapacity: 74,
    inflation: 5,
    publicConfidence: 60,
    intelNetwork: 68,
    governmentFormId: 'parliamentary-republic',
    strategyId: 'open-republic',
    activeElection: false,
    personalLife: queerPersonalLife(),
    ...overrides,
  };
}

function exposure(): ExposureIncident {
  return {
    id: 'exposure-test',
    openedWeek: 218,
    updatedWeek: 219,
    stage: 'verification',
    subject: '동성애 정체성',
    instigator: '전국 지지율을 다투는 유력 경쟁 후보',
    motive: '차기 권력 경쟁',
    outlet: { id: 'independent', name: '독립시보 일보', desk: '탐사보도팀', editorialLine: '권력 감시', reach: 70, rigor: 82, independence: 88 },
    evidenceQuality: 75,
    publicAttention: 71,
    privacyViolation: true,
    resolution: null,
  };
}

describe('media relations, interviews, and privacy disclosure', () => {
  it('derives disclosure pressure from office, group rivalry, law, election, and privacy instead of orientation penalties', () => {
    const state = createMediaRelationsState('korea', 200);
    const high = calculateDisclosureRisk(state, context({ activeElection: true, unrest: 72 }));
    const lowerRole = { ...topPoliticalRole, tier: 5 as const, title: '지역 정치조직 실무자' };
    const low = calculateDisclosureRisk(state, context({ role: lowerRole, activeElection: false, unrest: 35, personalLife: queerPersonalLife('marriage-equality') }));

    expect(high.weeklyChance).toBeGreaterThan(low.weeklyChance);
    expect(high.factors.map((factor) => factor.label)).toEqual(['보직·공적 관심', '소속 집단 경쟁', '법·집단 규범', '공개 경계', '정치적 기회']);
    expect(high.likelyInstigator).toContain('경쟁 후보');
  });

  it('does not manufacture an orientation disclosure when the profile is private or heterosexual', () => {
    const state = createMediaRelationsState('korea');
    const privateLife = createPersonalLifeState('korea');
    const heterosexual = configurePersonalIdentity(privateLife, {
      gender: 'woman', orientation: 'heterosexual', partnerTerm: 'auto', boundary: 'exclusive',
    });
    expect(calculateDisclosureRisk(state, context({ personalLife: privateLife })).weeklyChance).toBe(0);
    expect(calculateDisclosureRisk(state, context({ personalLife: heterosexual })).weeklyChance).toBe(0);
  });

  it('lets the player request an interview and shows answer consequences in persistent media state', () => {
    const state = { ...createMediaRelationsState('korea'), lawId: 'plural-press' as const, freedom: 68, access: 60 };
    const scheduled = requestPressInterview(state, 'national-vision', context());
    expect(scheduled?.state.pendingInterview?.initiator).toBe('player');
    expect(scheduled?.politicalPowerDelta).toBe(-2);

    const answered = respondToInterview(scheduled!.state, 'values-first', context());
    expect(answered?.state.pendingInterview).toBeNull();
    expect(answered?.state.interviewsCompleted).toBe(1);
    expect(answered?.state.pressTrust).toBeGreaterThan(state.pressTrust);
    expect(answered?.legitimacyDelta).toBeGreaterThan(0);
  });

  it('blocks independent interview pitches under wartime censorship but still permits later reform', () => {
    const state = { ...createMediaRelationsState('korea'), lawId: 'wartime-censorship' as const, freedom: 12 };
    expect(requestPressInterview(state, 'economy', context())).toBeNull();
    const reformed = reformMediaLaw(state, 'plural-press', context());
    expect(reformed?.state.lawId).toBe('plural-press');
    expect(reformed?.publicConfidenceDelta).toBeGreaterThan(0);
  });

  it('moves an unanswered disclosure through verification and publication over multiple weeks', () => {
    const state: MediaRelationsState = { ...createMediaRelationsState('korea'), activeExposure: { ...exposure(), stage: 'rumor', openedWeek: 219 } };
    const verifying = advanceMediaRelationsWeek(state, context({ week: 220 }));
    expect(verifying.state.activeExposure?.stage).toBe('verification');
    const published = advanceMediaRelationsWeek(verifying.state, context({ week: 221, personalLife: verifying.personalLife }));
    expect(published.state.activeExposure?.stage).toBe('published');
    expect(published.events.some((event) => event.title.includes('보도'))).toBe(true);
  });

  it('makes a self-directed disclosure safer under equality law than under a restrictive code', () => {
    const restrictiveState = { ...createMediaRelationsState('korea'), activeExposure: exposure() };
    const restrictive = resolveExposureIncident(restrictiveState, 'own-terms', context());
    const equalPersonalLife = queerPersonalLife('marriage-equality');
    const equal = resolveExposureIncident(restrictiveState, 'own-terms', context({ personalLife: equalPersonalLife }));
    expect(restrictive?.legitimacyDelta).toBeLessThan(equal!.legitimacyDelta);
    expect(restrictive?.unrestDelta).toBeGreaterThan(equal!.unrestDelta);
    expect(equal?.state.activeExposure?.stage).toBe('resolved');
  });

  it('migrates older saves that have no media state', () => {
    const normalized = normalizeMediaRelationsState(undefined, 'usa', 50);
    expect(normalized.nationId).toBe('usa');
    expect(normalized.lawId).toBe('plural-press');
    expect(normalized.nextInterviewWeek).toBe(53);
  });
});
