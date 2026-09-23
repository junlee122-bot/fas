import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  MilitaryAccessBoard, MilitaryAccessReviewSubject, MilitaryAccessScope, canRequestMilitaryAccessRebase,
  confirmMilitaryAccessReview, focusMilitaryAccessProposal, formatMilitaryAccessWeek, getMilitaryAccessSites, getMilitaryAccessTiming,
  getVisibleMilitaryAccessAgreements, prepareMilitaryAccessReview,
  type MilitaryAccessBoardProps, type MilitaryAccessReviewSnapshot,
} from './MilitaryAccessBoard';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { createMilitaryAccessState, type MilitaryAccessAction, type MilitaryAccessAgreement } from './militaryAccess';
import type { Territory } from './types';

const home: Territory = {
  id: 'home', name: '자국 항구', ownerId: 'korea', controller: 'allies', x: 0, y: 0, region: '아시아',
  value: 1, supply: 65, terrain: '도시', neighbors: ['host'], siteType: 'port',
};
const host: Territory = { ...home, id: 'host', name: '외국 항구', ownerId: 'usa', neighbors: ['home'] };
const proposal: Extract<MilitaryAccessAction, { kind: 'propose' }> = {
  kind: 'propose', partnerNationId: 'usa', territoryId: 'host', accessKind: 'transit', direction: 'request', durationWeeks: 13,
};

function agreement(overrides: Partial<MilitaryAccessAgreement> = {}): MilitaryAccessAgreement {
  return {
    id: 'access-test', hostNationId: 'usa', beneficiaryNationId: 'korea', proposerNationId: 'korea',
    territoryId: 'host', kind: 'naval-base', durationWeeks: 13, status: 'accepted', proposedWeek: 0,
    responseDueWeek: 2, reason: '상대국 수락 · 국내 발효 확인 필요', ...overrides,
  };
}

function setup(agreements: MilitaryAccessAgreement[] = []): MilitaryAccessBoardProps {
  const territories = structuredClone([home, host, { ...host, id: 'city', name: '외국 내륙 도시', siteType: 'city' as const }]);
  const state = { ...createMilitaryAccessState(4), agreements };
  return {
    state,
    context: {
      state, nationId: 'korea', week: 4, playerFaction: 'allies', territories,
      control: createMapPoliticalLedger(territories, 0),
      relations: [{ id: 'usa', name: '미국', code: 'US', value: 80, status: '협력', color: '#fff' }],
      politicalPower: 100, treasury: 100, stability: 80, canNegotiate: true, canRatify: true,
      approvalSupport: 80, approvalLabel: '국무위원회 지지',
    },
    nationName: '한국', authorityNote: '국가 대표 · 협상 및 발효 권한', formatMoney: (value) => `${value} 국고`,
    onExecute: vi.fn(), onOpenMap: vi.fn(), onRebase: vi.fn(), fleets: [{ id: 'fleet-1', name: '제1함대' }],
  };
}

function prepared(input: MilitaryAccessBoardProps & { formKey?: string }, action: MilitaryAccessAction = proposal) {
  const result = prepareMilitaryAccessReview(input, action);
  expect(result.review, result.reason).not.toBeNull();
  return result.review!;
}

function active(overrides: Partial<MilitaryAccessAgreement> = {}) {
  return agreement({ status: 'active', activatedWeek: 2, expiresWeek: 15, reason: '국내 승인 완료', ...overrides });
}

describe('military access review and confirmation boundary', () => {
  it.each(['request', 'offer'] as const)('snapshots the exact %s parties, site, scope, period, cost and date without executing', (direction) => {
    const p = setup();
    const action = { ...proposal, direction, territoryId: direction === 'request' ? 'host' : 'home' };
    const before = JSON.stringify([p.state, p.context]);
    const review = prepared(p, action);
    expect(review.action).toEqual(action);
    expect(review.action).not.toBe(action);
    expect(review.target).toEqual({
      territoryId: action.territoryId, territoryName: direction === 'request' ? '외국 항구' : '자국 항구',
      hostNationId: direction === 'request' ? 'usa' : 'korea', beneficiaryNationId: direction === 'request' ? 'korea' : 'usa',
      kind: 'transit', durationWeeks: 13,
    });
    expect(review.cost).toEqual({ politicalPower: 4, treasury: 0 });
    expect(review.dueWeek).toBe(6);
    expect(review.summary).toContain('별도 국내 승인');
    const html = renderToStaticMarkup(<MilitaryAccessReviewSubject target={review.target} />);
    expect(html).toContain('aria-label="접근권 집행 검토 대상"');
    expect(html).toContain(review.target.territoryName);
    expect(html).toContain('발효 후 13주 · 영토 이전 없음');
    expect(html).toContain(direction === 'request' ? '미국 → 한국 독립운동' : '한국 독립운동 → 미국');
    expect(JSON.stringify([p.state, p.context])).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it.each(['activate', 'withdraw', 'revoke'] as const)('takes the %s target from the selected saved agreement, not the proposal draft', (kind) => {
    const saved = kind === 'revoke' ? active() : agreement();
    const p = setup([saved]);
    const review = prepared({ ...p, formKey: 'unrelated:offer:home:transit:52' }, { kind, agreementId: saved.id });
    expect(review.target).toEqual({ territoryId: 'host', territoryName: '외국 항구', hostNationId: 'usa', beneficiaryNationId: 'korea', kind: 'naval-base', durationWeeks: 13 });
    expect(review.cost).toEqual(kind === 'activate' ? { politicalPower: 6, treasury: 8 } : { politicalPower: 0, treasury: 0 });
    expect(review.dueWeek).toBe(kind === 'activate' ? 4 : null);
    expect(p.state.agreements[0]).toBe(saved);
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('delivers one explicit confirmation, copies the action, and does not mutate local resources or rights', () => {
    const p = setup();
    const before = JSON.stringify([p.state, p.context]);
    const review = prepared(p);
    const gate = { current: null as string | null };
    expect(confirmMilitaryAccessReview(review, p, gate).accepted).toBe(true);
    expect(confirmMilitaryAccessReview(review, p, gate)).toMatchObject({ accepted: false, message: expect.stringContaining('이미 전달한 안건') });
    expect(p.onExecute).toHaveBeenCalledExactlyOnceWith(proposal);
    expect(vi.mocked(p.onExecute).mock.calls[0][0]).not.toBe(review.action);
    expect(JSON.stringify([p.state, p.context])).toBe(before);
  });

  it.each(['week', 'nation', 'faction', 'territories', 'control', 'relations', 'politicalPower', 'treasury', 'stability', 'canNegotiate', 'canRatify', 'approvalSupport', 'approvalLabel', 'state', 'contextState', 'authorityNote', 'busy', 'formKey'] as const)(
    'rejects a previously reviewed proposal after %s changes', (field) => {
      const p = { ...setup(), formKey: 'request:usa:host:transit:13' };
      const review = prepared(p);
      const changed = { ...p, context: { ...p.context } };
      if (field === 'week') changed.context.week += 1;
      if (field === 'nation') changed.context.nationId = 'china';
      if (field === 'faction') changed.context.playerFaction = 'axis';
      if (field === 'territories') changed.context.territories = p.context.territories.map((site) => ({ ...site, supply: site.supply - 1 }));
      if (field === 'control') changed.context.control = { ...p.context.control, current: {} };
      if (field === 'relations') changed.context.relations = p.context.relations.map((relation) => ({ ...relation, value: relation.value - 1 }));
      if (field === 'politicalPower') changed.context.politicalPower -= 1;
      if (field === 'treasury') changed.context.treasury -= 1;
      if (field === 'stability') changed.context.stability -= 1;
      if (field === 'canNegotiate') changed.context.canNegotiate = false;
      if (field === 'canRatify') changed.context.canRatify = false;
      if (field === 'approvalSupport') changed.context.approvalSupport -= 1;
      if (field === 'approvalLabel') changed.context.approvalLabel = '변경된 승인 기구';
      if (field === 'state') changed.state = { ...p.state, lastAdvancedWeek: 5 };
      if (field === 'contextState') changed.context.state = { ...p.state, journal: [{ id: 'new', title: '갱신', detail: '협정 기록 갱신', week: 4, tone: 'neutral' }] };
      if (field === 'authorityNote') changed.authorityNote = '해임 · 열람 전용';
      if (field === 'busy') changed.busy = true;
      if (field === 'formKey') changed.formKey = 'offer:usa:home:naval-base:52';
      const gate = { current: null };
      expect(confirmMilitaryAccessReview(review, changed, gate)).toMatchObject({ accepted: false, message: expect.stringContaining('다시 검토') });
      expect(gate.current).toBeNull();
      expect(p.onExecute).not.toHaveBeenCalled();
    },
  );

  it.each(['politicalPower', 'treasury', 'summary', 'dueWeek', 'territoryId', 'territoryName', 'hostNationId', 'beneficiaryNationId', 'kind', 'durationWeeks', 'missingTarget'] as const)(
    'rejects tampered displayed %s even with a current fingerprint', (field) => {
      const p = setup();
      const review = structuredClone(prepared(p));
      if (field === 'politicalPower') review.cost.politicalPower = 0;
      if (field === 'treasury') review.cost.treasury = 50;
      if (field === 'summary') review.summary = '공격·점령도 허용';
      if (field === 'dueWeek') review.dueWeek = 4;
      if (field === 'territoryId') review.target.territoryId = 'home';
      if (field === 'territoryName') review.target.territoryName = '다른 항구';
      if (field === 'hostNationId') review.target.hostNationId = 'china';
      if (field === 'beneficiaryNationId') review.target.beneficiaryNationId = 'usa';
      if (field === 'kind') review.target.kind = 'naval-base';
      if (field === 'durationWeeks') review.target.durationWeeks = 52;
      const tampered = field === 'missingTarget' ? { ...review, target: undefined } as unknown as MilitaryAccessReviewSnapshot : review;
      const gate = { current: null };
      expect(confirmMilitaryAccessReview(tampered, p, gate)).toMatchObject({ accepted: false, message: expect.stringContaining('다시 검토') });
      expect(gate.current).toBeNull();
      expect(p.onExecute).not.toHaveBeenCalled();
    },
  );

  it('keeps reviewed display values detached from later agreement and territory mutations', () => {
    const p = setup([agreement()]);
    const review = prepared(p, { kind: 'activate', agreementId: 'access-test' });
    p.state.agreements[0].durationWeeks = 52;
    p.context.territories.find((site) => site.id === 'host')!.name = '변경된 항구';
    expect(review.target).toMatchObject({ durationWeeks: 13, territoryName: '외국 항구' });
    expect(confirmMilitaryAccessReview(review, p, { current: null }).accepted).toBe(false);
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('fails preparation closed during processing, without authority, and on mismatched ledgers or missing ids', () => {
    const p = setup();
    expect(prepareMilitaryAccessReview({ ...p, busy: true }, proposal).review).toBeNull();
    expect(prepareMilitaryAccessReview({ ...p, context: { ...p.context, canNegotiate: false } }, proposal).review).toBeNull();
    expect(prepareMilitaryAccessReview({ ...p, state: { ...p.state, lastAdvancedWeek: 3 } }, proposal)).toMatchObject({ review: null, reason: expect.stringContaining('원장이 일치하지 않습니다') });
    expect(prepareMilitaryAccessReview(p, { kind: 'activate', agreementId: 'missing' }).review).toBeNull();
    expect(renderToStaticMarkup(<MilitaryAccessReviewSubject />)).toContain('검토 대상 확인 불가');
    const pending = setup([agreement()]);
    pending.context.canRatify = false;
    expect(prepareMilitaryAccessReview(pending, { kind: 'activate', agreementId: 'access-test' }).review).toBeNull();
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(pending.onExecute).not.toHaveBeenCalled();
  });
});

describe('military access records, status and rebase UI', () => {
  it.each([
    { canNegotiate: true, busy: false }, { canNegotiate: true, busy: true },
    { canNegotiate: false, busy: false }, { canNegotiate: false, busy: true },
  ])('links the enabled proposal shortcut to its focusable form for authority=$canNegotiate and busy=$busy without state effects', ({ canNegotiate, busy }) => {
    const p = setup([agreement()]);
    p.context.canNegotiate = canNegotiate;
    p.context.canRatify = canNegotiate;
    p.busy = busy;
    const before = JSON.stringify([p.state, p.context, p.fleets]);
    const html = renderToStaticMarkup(<MilitaryAccessBoard {...p} />);
    const button = html.match(/<button\b[^>]*class="military-access-proposal-jump"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
    const controls = button.match(/aria-controls="([^"]+)"/)?.[1];
    const section = html.match(/<section\b[^>]*class="military-access-proposal"[^>]*>/)?.[0] ?? '';
    expect(button).toContain('type="button"');
    expect(button).toContain(canNegotiate ? '새 제안 작성' : '제안 조건 보기');
    expect(button).not.toContain('disabled');
    expect(controls).toBeTruthy();
    expect(section).toContain(`id="${controls}"`);
    expect(section).toContain('tabindex="-1"');
    expect(section).toContain(`aria-labelledby="${controls}-heading"`);
    const target = { scrollIntoView: vi.fn(), focus: vi.fn() };
    focusMilitaryAccessProposal(target);
    expect(target.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'start', behavior: 'instant' });
    expect(target.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    expect(target.scrollIntoView.mock.invocationCallOrder[0]).toBeLessThan(target.focus.mock.invocationCallOrder[0]);
    expect(JSON.stringify([p.state, p.context, p.fleets])).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(p.onRebase).not.toHaveBeenCalled();
    expect(p.onOpenMap).not.toHaveBeenCalled();
  });

  it('keeps an existing review and its selection fingerprint intact when navigating to the proposal, and tolerates a missing target', () => {
    const p = { ...setup(), formKey: 'request:usa:host:transit:13' };
    const review = prepared(p);
    const before = JSON.stringify([p.state, p.context, p.formKey, review]);
    const target = { scrollIntoView: vi.fn(), focus: vi.fn() };
    focusMilitaryAccessProposal(target);
    expect(() => focusMilitaryAccessProposal(null)).not.toThrow();
    expect(JSON.stringify([p.state, p.context, p.formKey, review])).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(confirmMilitaryAccessReview(review, p, { current: null }).accepted).toBe(true);
  });

  it('filters request and offer sites by live controller, deduplicates them, and restricts naval bases to ports', () => {
    const p = setup();
    p.context.territories = [...p.context.territories, { ...host }];
    const before = JSON.stringify(p.context);
    expect(getMilitaryAccessSites(p.context, 'usa', 'request', 'transit').map((site) => site.id)).toEqual(['host', 'city']);
    expect(getMilitaryAccessSites(p.context, 'usa', 'request', 'naval-base').map((site) => site.id)).toEqual(['host']);
    expect(getMilitaryAccessSites(p.context, 'usa', 'offer', 'naval-base').map((site) => site.id)).toEqual(['home']);
    expect(getMilitaryAccessSites(p.context, 'korea', 'request', 'transit')).toEqual([]);
    expect(getMilitaryAccessSites(p.context, 'unknown' as 'usa', 'request', 'transit')).toEqual([]);
    expect(JSON.stringify(p.context)).toBe(before);
  });

  it('prioritizes attention records without sorting the original ledger or exposing unrelated records', () => {
    const ownActive = active({ id: 'active' });
    const pending = agreement({ id: 'accepted' });
    const notice = active({ id: 'notice', status: 'notice', closedWeek: 4 });
    const unrelated = agreement({ id: 'foreign-secret', hostNationId: 'britain', beneficiaryNationId: 'china', territoryId: 'secret-site', reason: '외국 비공개 기록' });
    const p = setup([ownActive, unrelated, pending, notice]);
    p.state.journal = [{ id: 'secret-journal', title: '외국 비공개 일지', detail: '표시하면 안 됨', week: 4, tone: 'neutral' }];
    const before = JSON.stringify(p.state);
    expect(getVisibleMilitaryAccessAgreements(p.state, 'korea').map((entry) => entry.id)).toEqual(['notice', 'accepted', 'active']);
    const html = renderToStaticMarkup(<MilitaryAccessBoard {...p} />);
    expect(html).not.toContain('외국 비공개');
    expect(html).not.toContain('secret-site');
    expect(JSON.stringify(p.state)).toBe(before);
  });

  it.each([
    ['proposed', '상대국 답변 대기'], ['accepted', '수락 · 발효 확인 필요'], ['active', '발효 중'],
    ['notice', '종료 통고 · 철수 중'], ['expired', '기간 만료'], ['revoked', '철회 종료'],
    ['rejected', '상대국 거부'], ['withdrawn', '제안 철회'],
  ] as const)('renders the %s lifecycle status without executing or moving a fleet', (status, label) => {
    const saved = ['active', 'notice', 'expired', 'revoked'].includes(status)
      ? active({ status, ...(status !== 'active' ? { closedWeek: 4 } : {}) }) : agreement({ status });
    const p = setup([saved]);
    const before = JSON.stringify([p.state, p.context, p.fleets]);
    const html = renderToStaticMarkup(<MilitaryAccessBoard {...p} />);
    expect(html).toContain(`military-access-status-${status}`);
    expect(html).toContain(label);
    expect(html).toContain('대상 거점 지도 조회');
    if (status === 'accepted') {
      expect(html).toContain('상대국 수락만으로 사용할 수 없습니다');
      expect(html).toContain('발효안 검토');
      expect(html).not.toContain('aria-label="협정 기지로 함대 이동"');
    }
    if (['active', 'notice', 'expired', 'revoked'].includes(status)) {
      expect(html).toContain('aria-label="협정 기지로 함대 이동"');
      expect(html).toContain('disabled="">선택 함대를 기지로 이동');
      expect(html).toContain('함대를 직접 선택하세요');
    }
    if (['notice', 'expired', 'revoked'].includes(status)) expect(html).toContain('이 협정은 신규 기지 배치를 허용하지 않습니다');
    expect(JSON.stringify([p.state, p.context, p.fleets])).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(p.onRebase).not.toHaveBeenCalled();
    expect(p.onOpenMap).not.toHaveBeenCalled();
  });

  it('allows an explicitly selected fleet only for a currently active beneficiary naval-base grant', () => {
    const saved = active();
    const p = setup([saved]);
    expect(canRequestMilitaryAccessRebase(saved, p, '')).toBe(false);
    expect(canRequestMilitaryAccessRebase(saved, p, 'missing-fleet')).toBe(false);
    expect(canRequestMilitaryAccessRebase(saved, p, 'fleet-1')).toBe(true);
    expect(p.onRebase).not.toHaveBeenCalled();
  });

  it.each(['proposed', 'accepted', 'notice', 'expired', 'revoked', 'rejected', 'withdrawn'] as const)('blocks new naval placement for %s records', (status) => {
    const saved = active({ status, closedWeek: 4 });
    expect(canRequestMilitaryAccessRebase(saved, setup([saved]), 'fleet-1')).toBe(false);
  });

  it.each(['busy', 'noCallback', 'noFleet', 'missingRecord', 'changedRecord', 'mismatchedState', 'transit', 'foreignBeneficiary', 'notActivated', 'futureActivation', 'noExpiry', 'expiredDate', 'missingSite', 'changedController'] as const)(
    'blocks naval placement when %s invalidates the request', (condition) => {
      const saved = active();
      const p = setup([saved]);
      const onRebase = p.onRebase;
      if (condition === 'busy') p.busy = true;
      if (condition === 'noCallback') p.onRebase = undefined;
      if (condition === 'noFleet') p.fleets = [];
      if (condition === 'missingRecord') p.state.agreements = [];
      if (condition === 'changedRecord') p.state.agreements = [{ ...saved, reason: '갱신된 기록' }];
      if (condition === 'mismatchedState') p.context.state = { ...p.state, agreements: [] };
      if (condition === 'transit') saved.kind = 'transit';
      if (condition === 'foreignBeneficiary') saved.beneficiaryNationId = 'china';
      if (condition === 'notActivated') saved.activatedWeek = undefined;
      if (condition === 'futureActivation') saved.activatedWeek = 5;
      if (condition === 'noExpiry') saved.expiresWeek = undefined;
      if (condition === 'expiredDate') saved.expiresWeek = 4;
      if (condition === 'missingSite') p.context.territories = [home];
      if (condition === 'changedController') {
        p.context.territories = p.context.territories.map((site) => site.id === 'host' ? { ...site, ownerId: 'china' } : site);
        p.context.control = createMapPoliticalLedger(p.context.territories, 0);
      }
      expect(canRequestMilitaryAccessRebase(saved, p, 'fleet-1')).toBe(false);
      expect(onRebase).not.toHaveBeenCalled();
    },
  );

  it('preserves records and resources across repeated read-only renders and disables negotiation, ratification and movement', () => {
    const p = setup([agreement()]);
    p.context.canNegotiate = false;
    p.context.canRatify = false;
    p.onRebase = undefined;
    p.authorityNote = '해임 상태 · 협정 기록 열람만 가능';
    const before = JSON.stringify([p.state, p.context, p.fleets]);
    for (let index = 0; index < 3; index += 1) {
      const html = renderToStaticMarkup(<MilitaryAccessBoard {...p} />);
      expect(html).toContain(p.authorityNote);
      expect(html).toContain('class="military-access-form" disabled=""');
      expect(html).toContain('disabled="">발효안 검토');
      expect(html).toContain('disabled="">제안 철회안 검토');
      expect(html).toContain('disabled="">접근권 제안안 검토');
      expect(html).toContain('대상 거점 지도 조회');
      expect(html).not.toContain('확인 후 집행 요청');
    }
    expect(JSON.stringify([p.state, p.context, p.fleets])).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(p.onOpenMap).not.toHaveBeenCalled();
    const naval = setup([active()]);
    naval.onRebase = undefined;
    expect(renderToStaticMarkup(<MilitaryAccessBoard {...naval} />)).toContain('이 화면에서는 이동 명령을 사용할 수 없습니다');
    expect(canRequestMilitaryAccessRebase(naval.state.agreements[0], naval, 'fleet-1')).toBe(false);
  });

  it('explains withdrawal deadlines, stale expiry and the absence of automatic return or fuel restoration', () => {
    expect(getMilitaryAccessTiming(active({ status: 'notice', closedWeek: 4 }), 4)).toContain('철수 유예 2주 남음');
    expect(getMilitaryAccessTiming(active({ status: 'notice', closedWeek: 4 }), 6)).toContain('부대는 자동 귀환·삭제되지 않으며');
    expect(getMilitaryAccessTiming(active({ expiresWeek: 4 }), 4)).toContain('만료 시점 도달 · 신규 사용 불가');
    expect(getMilitaryAccessTiming(active({ expiresWeek: undefined }), 4)).toContain('사용 가능하다고 간주하지 않습니다');
    expect(getMilitaryAccessTiming(agreement({ status: 'proposed' }), 4)).toContain('아직 답변 기록 없음');
    const html = renderToStaticMarkup(<MilitaryAccessBoard {...setup([active()])} />);
    expect(html).toContain('즉시 도착·연료 회복·공격 출격을 의미하지 않습니다');
    expect(formatMilitaryAccessWeek(4)).toContain('제5주');
    expect(formatMilitaryAccessWeek(-1)).toBe('시점 확인 불가');
  });

  it('states that transit and naval access do not grant attacks, territory or unrelated basing rights', () => {
    const transit = renderToStaticMarkup(<MilitaryAccessScope kind="transit" />);
    const naval = renderToStaticMarkup(<MilitaryAccessScope kind="naval-base" />);
    expect(transit).toContain('전투·점령·자동 보급 권한이 아니며');
    expect(transit).toContain('해군·공군 기지 사용을 포함하지 않습니다');
    expect(naval).toContain('육군 하선·공군 기지·공격 출격을 허용하지 않으며 소유권도 바뀌지 않습니다');
  });
});
