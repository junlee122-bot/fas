import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createConstitutionalJudiciaryState } from './constitutionalJudiciary';
import { createDynasticPoliticsState, type NobleGrant } from './dynasticPolitics';
import { assessSovereignPower, createSovereignPowersState, exerciseSovereignPower, sovereignPowerDefinitions, type SovereignPowerContext } from './sovereignPowers';
import { SovereignPowersBoard, confirmSovereignReview, createSovereignReview, presentSovereignLegalBasis, type SovereignPowersBoardProps } from './SovereignPowersBoard';
import type { CareerRole } from './types';

const role: CareerRole = {
  id: 'korea-tier1', nationId: 'korea', title: '국가원수', branch: 'politics', tier: 1, archetype: 'head-of-state', scope: '국가 전체', authority: 95,
  expectation: '헌정 수호', historicalHolderId: 'historical-office', historicalHolderName: '기존 지도부', historicalOffice: '국가원수', historicalBasis: '테스트', coverIdentity: '국가원수', replacementEffect: '사용자가 대체',
};
const grant: NobleGrant = {
  id: 'grant-seoul-duke', recipientId: 'staff-1', recipientName: '김 참의', rankId: 'duke', titleName: '서울 공작', domainId: 'seoul', domainName: '서울', grantedWeek: 0,
  loyaltyAtGrant: 72, influenceAtGrant: 76, hereditary: true, weeklyStipend: 3.2,
};

function context(monarchy = false): SovereignPowerContext {
  const constitution = createConstitutionalJudiciaryState('korea');
  constitution.status = 'enacted';
  constitution.enacted = {
    name: '테스트 헌법', enactedWeek: 0, ratificationMethodId: 'constituent-assembly', amendmentThreshold: '특별다수', publicSupport: 70, contradictions: [],
    clauses: { government: monarchy ? 'constitutional-crown' : 'presidential-separation', rights: 'civil-liberties-charter', review: 'constitutional-court-review', appointments: 'executive-legislative-confirmation', prosecution: 'independent-prosecution', emergency: 'sunset-emergency', territory: 'unitary-local-government' },
  };
  const dynasty = createDynasticPoliticsState('korea');
  dynasty.formId = monarchy ? 'constitutional-monarchy' : 'presidential-republic';
  dynasty.titleGrants = monarchy ? [structuredClone(grant)] : [];
  dynasty.successionSecurity = 42;
  return { week: 0, year: 1942, nationId: 'korea', role: { ...role }, formId: dynasty.formId, constitution, dynasty, politicalPower: 200, treasury: 500, stability: 65, legitimacy: 62, unrest: 28, publicConfidence: 60, institutionalCapacity: 58, mediaFreedom: 65, justiceIndependence: 64 };
}

function props(monarchy = false, overrides: Partial<SovereignPowersBoardProps> = {}): SovereignPowersBoardProps {
  return { state: createSovereignPowersState('korea'), context: context(monarchy), indicators: { justiceIntegrity: 56, pressTrust: 67 }, onExercise: vi.fn(), formatMoney: (value) => `${value} 국고`, ...overrides };
}

describe('sovereign powers command desk', () => {
  it('keeps the quoted actor and week when live context changes', () => {
    const p = props();
    const review = createSovereignReview(p, 'promulgate-law', null).review!;
    const originalActor = p.context.role.title;
    p.context.week = 1;
    p.context.role.title = '새 보직';
    expect(review.week).toBe(0);
    expect(review.actorTitle).toBe(originalActor);
    expect(confirmSovereignReview(review, p, { current: null }).accepted).toBe(false);
    expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('renders one selected power, separates review and execution, and never mutates during rendering', () => {
    const p = props(); const original = JSON.stringify(p);
    const html = renderToStaticMarkup(<SovereignPowersBoard {...p} />);
    expect(html.match(/class="sovereign-desk-detail"/g)).toHaveLength(1);
    expect(html).toContain('비용·영향 검토'); expect(html).not.toContain('권한 행사 확정');
    expect(html).toContain('각 행위의 헌법·관례를 개별 심사'); expect(html).not.toContain('직접 행사권');
    expect(html).toContain('검증 장부'); expect(p.onExercise).not.toHaveBeenCalled(); expect(JSON.stringify(p)).toBe(original);
  });

  it.each(['legislation', 'executive', 'state', 'estates'] as const)('keeps every %s power accessible even in compact mode', (group) => {
    const p = props(true); const html = renderToStaticMarkup(<SovereignPowersBoard {...p} compact initialGroup={group} />);
    for (const definition of sovereignPowerDefinitions.filter((item) => item.group === group)) expect(html).toContain(`value="${definition.id}"`);
    expect(html).not.toContain('나머지'); expect(html.match(/class="sovereign-desk-detail"/g)).toHaveLength(1);
  });

  it('renders the empty ledger directly without exposing an execution button', () => {
    const p = props(); const html = renderToStaticMarkup(<SovereignPowersBoard {...p} compact initialView="ledger" />);
    expect(html).toContain('아직 행사한 권한이 없습니다'); expect(html).not.toContain('비용·영향 검토'); expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('presents constitutional grounds with readable clause names and correct Korean particles', () => {
    const p = props(); const assessment = assessSovereignPower(p.state, 'promulgate-law', p.context);
    expect(presentSovereignLegalBasis(assessment, p.context)).not.toContain('presidential-separation');
    const html = renderToStaticMarkup(<SovereignPowersBoard {...p} />);
    expect(html).not.toContain('presidential-separation');
    expect(assessment.legalBasis).toContain('presidential-separation');
  });

  it('renders pending and resolved records with their actual verification status', () => {
    const p = props(); const result = exerciseSovereignPower(p.state, 'promulgate-law', p.context)!;
    p.state = result.state;
    let html = renderToStaticMarkup(<SovereignPowersBoard {...p} initialView="ledger" />);
    expect(html).toContain(`제${result.verificationWeek + 1}주 검증 대기`); expect(html).toContain('후속 반응은 아직 확정되지 않았습니다');
    p.state.history[0] = { ...p.state.history[0], resolved: true, outcome: '의회에서 효력 확인' };
    html = renderToStaticMarkup(<SovereignPowersBoard {...p} initialView="ledger" />);
    expect(html).toContain('의회에서 효력 확인'); expect(html).not.toContain('후속 반응은 아직 확정되지 않았습니다');
  });

  it.each(sovereignPowerDefinitions.map((item) => [item.id, item.group, !!item.requiresNobleTarget] as const))('previews %s from the existing pure engine, including every affected indicator', (powerId, group, requiresTarget) => {
    const p = props(group === 'estates' || powerId === 'manage-royal-household');
    if (powerId === 'end-emergency') p.state.activeEmergency = { declaredWeek: 0, reviewWeek: 4, renewals: 0, oversight: '테스트' };
    const targetId = requiresTarget ? grant.id : null;
    const before = JSON.stringify(p);
    const reviewed = createSovereignReview(p, powerId, targetId);
    const expected = exerciseSovereignPower(p.state, powerId, p.context, requiresTarget ? p.context.dynasty.titleGrants[0] : null);
    expect(reviewed.review?.result).toEqual(expected);
    expect(reviewed.review).not.toBeNull();
    const rows = reviewed.review!.indicators;
    for (const [key, value] of Object.entries(expected!.impact)) {
      if (value !== 0) expect(rows.some((row) => row.key === key)).toBe(true);
    }
    expect(rows.some((row) => row.key === 'authorityCapital')).toBe(true);
    expect(JSON.stringify(p)).toBe(before); expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('does not silently fall back to the first estate and keeps the selected estate identity', () => {
    const p = props(true);
    p.context.dynasty.titleGrants.push({ ...grant, id: 'grant-busan', titleName: '부산 후작', recipientId: 'staff-2', recipientName: '이 참의', domainName: '부산' });
    expect(createSovereignReview(p, 'estate-administration', null).review).toBeNull();
    expect(createSovereignReview(p, 'estate-administration', 'removed-estate').review).toBeNull();
    const review = createSovereignReview(p, 'estate-administration', 'grant-busan').review!;
    expect(review.targetName).toBe('부산 후작 · 이 참의 · 부산');
    expect(confirmSovereignReview(review, p, { current: null }).accepted).toBe(true);
    expect(p.onExercise).toHaveBeenCalledWith('estate-administration', 'grant-busan');
    const html = renderToStaticMarkup(<SovereignPowersBoard {...props(true)} initialGroup="estates" />);
    expect(html).toContain('작위·영지를 직접 선택하십시오'); expect(html).toContain('disabled=""');
  });

  it('does not pass an unrelated estate target to a national action', () => {
    const p = props(true); expect(createSovereignReview(p, 'promulgate-law', grant.id).review).toBeNull(); expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('supports an empty estate list without granting an unavailable power', () => {
    const p = props(true); p.context.dynasty.titleGrants = [];
    expect(createSovereignReview(p, 'estate-administration', grant.id).review).toBeNull();
    const html = renderToStaticMarkup(<SovereignPowersBoard {...p} initialGroup="estates" />);
    expect(html).toContain('서임된 작위·영지가 없습니다'); expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('allows a target-free regency council without inventing an estate owner', () => {
    const p = props(true); p.context.dynasty.titleGrants = [];
    const review = createSovereignReview(p, 'summon-regency', null).review!;
    expect(review).not.toBeNull(); expect(review.targetName).toBeNull();
  });

  it('spends only through the existing handler, once for the reviewed action', () => {
    const p = props(); const review = createSovereignReview(p, 'promulgate-law', null).review!;
    expect(p.onExercise).not.toHaveBeenCalled();
    const gate = { current: null as string | null };
    expect(confirmSovereignReview(review, p, gate).accepted).toBe(true);
    expect(confirmSovereignReview(review, p, gate).accepted).toBe(false);
    expect(p.onExercise).toHaveBeenCalledTimes(1); expect(p.onExercise).toHaveBeenCalledWith('promulgate-law', null);
    expect(p.context.politicalPower).toBe(200); expect(p.state.history).toHaveLength(0);
  });

  it('waits for actual state reflection even if a second different action is submitted', () => {
    const p = props(); const first = createSovereignReview(p, 'promulgate-law', null).review!;
    const second = createSovereignReview(p, 'address-and-counsel', null).review!;
    const gate = { current: null as string | null };
    expect(confirmSovereignReview(first, p, gate).accepted).toBe(true);
    expect(confirmSovereignReview(second, p, gate).accepted).toBe(false);
    expect(p.onExercise).toHaveBeenCalledTimes(1);
    p.state = first.result.state;
    p.context.politicalPower += first.result.impact.politicalPower;
    expect(confirmSovereignReview(createSovereignReview(p, 'address-and-counsel', null).review!, p, gate).accepted).toBe(true);
    expect(p.onExercise).toHaveBeenCalledTimes(2);
  });

  it('keeps an uncertain dispatch locked when the existing handler throws', () => {
    const p = props(); p.onExercise = vi.fn(() => { throw new Error('uncertain'); });
    const review = createSovereignReview(p, 'promulgate-law', null).review!;
    const gate = { current: null as string | null };
    const first = confirmSovereignReview(review, p, gate);
    expect(first.accepted).toBe(false); expect(first.message).toContain('장부와 잔액');
    expect(confirmSovereignReview(review, p, gate).accepted).toBe(false);
    expect(p.onExercise).toHaveBeenCalledTimes(1);
  });

  it.each(['week', 'nation', 'role', 'constitution', 'target', 'treasury', 'authority', 'busy', 'indicators', 'history'] as const)('rejects a stale %s before dispatch', (field) => {
    const p = props(true); const review = createSovereignReview(p, 'estate-administration', grant.id).review!;
    if (field === 'week') p.context.week += 1;
    if (field === 'nation') p.context.nationId = 'britain';
    if (field === 'role') p.context.role = { ...p.context.role, tier: 3 };
    if (field === 'constitution') p.context.constitution.enacted!.name = '개정 헌법';
    if (field === 'target') p.context.dynasty.titleGrants[0] = { ...grant, recipientName: '다른 소유자' };
    if (field === 'treasury') p.context.treasury -= 1;
    if (field === 'authority') p.state.authorityCapital -= 1;
    if (field === 'busy') p.busy = true;
    if (field === 'indicators') p.indicators!.justiceIntegrity -= 1;
    if (field === 'history') p.state.history.push({ ...review.result.state.history[0], id: 'new-record' });
    expect(confirmSovereignReview(review, p, { current: null }).accepted).toBe(false);
    expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('does not turn highest office into automatic legal permission', () => {
    const p = props(); const review = createSovereignReview(p, 'dissolve-legislature', null).review!;
    expect(review.assessment.status).toBe('ultra-vires');
    expect(confirmSovereignReview(review, p, { current: null }).accepted).toBe(false);
    expect(p.onExercise).not.toHaveBeenCalled();
    expect(confirmSovereignReview(review, p, { current: null }, true).accepted).toBe(true);
    expect(p.onExercise).toHaveBeenCalledTimes(1);
  });

  it('preserves countersignature and reserve-power distinctions and their additional costs', () => {
    const p = props(true);
    const ceremonial = createSovereignReview(p, 'promulgate-law', null).review!;
    const reserve = createSovereignReview(p, 'dismiss-government', null).review!;
    expect(ceremonial.assessment.status).toBe('countersigned'); expect(ceremonial.assessment.politicalCost).toBe(2);
    expect(reserve.assessment.status).toBe('reserve'); expect(reserve.assessment.politicalCost).toBe(18);
    expect(reserve.indicators.find((row) => row.key === 'constitutionalConvention')?.delta).toBe(-8);
    expect(reserve.result.verificationWeek).toBe(3);
  });

  it('caps previewed gains and losses against actual current values', () => {
    const p = props(); p.context.legitimacy = 2; p.context.unrest = 99; p.state.parliamentaryConfidence = 3;
    const rows = createSovereignReview(p, 'dissolve-legislature', null).review!.indicators;
    expect(rows.find((row) => row.key === 'legitimacy')).toMatchObject({ before: 2, after: 0, delta: -2, requestedDelta: -7, tone: 'bad' });
    expect(rows.find((row) => row.key === 'unrest')).toMatchObject({ before: 99, after: 100, delta: 1, requestedDelta: 12, tone: 'bad' });
    expect(rows.find((row) => row.key === 'parliamentaryConfidence')).toMatchObject({ before: 3, after: 0, delta: -3, requestedDelta: -30 });
  });

  it('keeps capped zero changes visible instead of advertising a gain', () => {
    const p = props(); p.context.legitimacy = 100;
    expect(createSovereignReview(p, 'promulgate-law', null).review!.indicators.find((row) => row.key === 'legitimacy')).toMatchObject({ before: 100, after: 100, delta: 0, requestedDelta: 1, tone: 'neutral' });
  });

  it('treats rising unrest, patronage, estate burden and aristocratic pressure as risk, not benefit', () => {
    const p = props(true);
    const estate = createSovereignReview(p, 'estate-administration', grant.id).review!;
    for (const key of ['unrest', 'estateBurden', 'aristocraticLeverage']) expect(estate.indicators.find((row) => row.key === key)?.tone).toBe('bad');
    const patronage = createSovereignReview(p, 'court-patronage', grant.id).review!;
    expect(patronage.indicators.find((row) => row.key === 'patronagePressure')?.tone).toBe('bad');
    expect(estate.indicators.find((row) => row.key === 'treasury')).toMatchObject({ before: 500, after: 504, delta: 4, tone: 'good' });
  });

  it('includes previously hidden judicial, dynasty and media side effects', () => {
    const p = props(true);
    const court = createSovereignReview(p, 'manorial-court', grant.id).review!;
    expect(court.indicators.find((row) => row.key === 'justiceIntegrity')).toMatchObject({ before: 56, after: 52, delta: -4 });
    expect(court.indicators.some((row) => row.key === 'courtIndependence')).toBe(true);
    const claim = createSovereignReview(p, 'press-succession-claim', grant.id).review!;
    expect(claim.indicators.some((row) => row.key === 'successionSecurity')).toBe(true);
    expect(claim.indicators.some((row) => row.key === 'courtUnity')).toBe(true);
    expect(claim.indicators.some((row) => row.key === 'crownAuthority')).toBe(true);
    const speech = createSovereignReview(p, 'address-and-counsel', null).review!;
    expect(speech.indicators.find((row) => row.key === 'pressTrust')).toMatchObject({ before: 67, after: 68, delta: 1 });
  });

  it('does not invent current values when optional indicators are unavailable', () => {
    const p = props(false, { indicators: undefined });
    const row = createSovereignReview(p, 'grant-pardon', null).review!.indicators.find((item) => item.key === 'justiceIntegrity');
    expect(row).toMatchObject({ before: null, after: null, delta: -1 });
  });

  it('accounts for emergency termination bonus and distinguishes review from termination', () => {
    const p = props(); const declaration = createSovereignReview(p, 'declare-emergency', null).review!;
    expect(declaration.result.state.activeEmergency?.reviewWeek).toBe(4);
    expect(declaration.result.verificationWeek).toBe(2);
    p.state = declaration.result.state;
    const ended = createSovereignReview(p, 'end-emergency', null).review!;
    expect(ended.indicators.find((row) => row.key === 'authorityCapital')?.delta).toBe(2);
    expect(ended.result.state.activeEmergency).toBeNull();
  });

  it.each(['politicalPower', 'treasury', 'authorityCapital'] as const)('blocks insufficient %s without any side effect', (field) => {
    const p = props(); if (field === 'authorityCapital') p.state.authorityCapital = 0; else p.context[field] = 0;
    expect(createSovereignReview(p, 'declare-emergency', null).review).toBeNull(); expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('blocks cooldown, busy, unavailable office, lower-tier authority and invalid numerical state', () => {
    const p = props();
    p.state.cooldowns['promulgate-law'] = 4; expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    p.state.cooldowns = {}; p.busy = true; expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    p.busy = false; expect(createSovereignReview(p, 'manage-royal-household', null).review).toBeNull();
    p.context.role.tier = 3; expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    p.context.role.tier = 1; p.context.politicalPower = Number.NaN; expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('uses the existing engine authority for a tier-two countersigning minister', () => {
    const p = props(true); p.context.role.tier = 2;
    expect(createSovereignReview(p, 'promulgate-law', null).review?.assessment.status).toBe('countersigned');
    expect(createSovereignReview(p, 'executive-order', null).review).toBeNull();
    expect(assessSovereignPower(p.state, 'promulgate-law', p.context).allowed).toBe(true);
  });

  it.each(['state', 'role', 'constitution'] as const)('rejects a mismatched %s nation before preview or dispatch', (field) => {
    const p = props();
    if (field === 'state') p.state.nationId = 'britain';
    else p.context[field].nationId = 'britain';
    expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    expect(p.onExercise).not.toHaveBeenCalled();
  });

  it('rejects mismatched government forms in the dynasty context', () => {
    const p = props(); p.context.dynasty.formId = 'crown-state';
    expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    expect(p.onExercise).not.toHaveBeenCalled();
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid campaign week %s', (week) => {
    const p = props(); p.context.week = week;
    expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    expect(p.onExercise).not.toHaveBeenCalled();
  });

  it.each([0, 1.5, 6, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid office tier %s', (tier) => {
    const p = props(); p.context.role.tier = tier as CareerRole['tier'];
    expect(createSovereignReview(p, 'promulgate-law', null).review).toBeNull();
    expect(p.onExercise).not.toHaveBeenCalled();
  });
});
