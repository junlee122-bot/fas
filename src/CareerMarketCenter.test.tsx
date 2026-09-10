import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { careerRoles, createCareerState, getRole, nations } from './campaign';
import { createCareerMarketState } from './careerMarket';
import type { CareerApproachKind, CareerOfferResponse, ForeignCareerOffer, ForeignCareerOfferKind } from './careerMarket';
import { createCareerReviewGate, getCareerDecisionReceipt } from './careerDecisions';
import type { CareerDecisionAction, CareerDecisionInput, CareerDecisionResult } from './careerDecisions';
import {
  CareerMarketCenter, assessCareerDeskReview, confirmCareerDeskReview, createCareerDeskReview,
  getCareerDeskAvailability, getCareerDeskSelectedOffer, getCareerDeskStatus,
} from './CareerMarketCenter';
import type { CareerMarketCenterProps } from './CareerMarketCenter';

function fixture(kind: ForeignCareerOfferKind = 'official-appointment'): CareerMarketCenterProps {
  const role = getRole('britain-tier2', 'britain');
  const game = { week: 26, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
    stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
    airPower: 57, navalPower: 52, intelNetwork: 78, enemyPressure: 68 };
  const offer: ForeignCareerOffer = {
    id: 'ce7-offer', sourceNationId: 'usa', targetRoleId: getRole('usa-tier2', 'usa').id,
    kind, status: 'pending', origin: 'foreign-initiated', receivedWeek: 24, deadlineWeek: 30,
    title: '미국의 공식 초청', sender: '연락 대표', coverChannel: '공식 회선', pitch: '새 보직을 맡아주십시오.', demand: '조직 합류',
    motive: 'security', secrecy: 65, exposureRisk: 30, credibility: 72, acceptanceChance: 60,
    terms: { signingBonus: 150, weeklyRetainer: 9, authority: 75, protection: 62, extraction: 70, autonomy: 'operational' },
    consequencePreview: ['인계 후 새 보직에서 활동합니다.'],
  };
  const decisionInput: CareerDecisionInput = {
    state: { ...createCareerMarketState(), offers: [offer], exposure: 12 },
    context: { week: game.week, game, role, career: { ...createCareerState('britain', role.id),
      reputation: 76, councilTrust: 48, experience: 61, legacy: 10 }, campaignPhase: 'war', relationByNation: { usa: 72 } },
  };
  return {
    state: decisionInput.state, decisionInput, currentNationId: 'britain', role, week: game.week,
    intelNetwork: game.intelNetwork, canTurnApproach: true,
    formatMoney: vi.fn((value: number, options?: { exact?: boolean }) => value + (options?.exact ? ' 정확파운드' : ' 반올림파운드')),
    onRespond: vi.fn(), onApproach: vi.fn(), onClandestineMissionResponse: vi.fn(),
    onClandestineIncidentResponse: vi.fn(), onClandestinePostureChange: vi.fn(), onClose: vi.fn(),
  };
}
const respond = (response: CareerOfferResponse): CareerDecisionAction => ({ kind: 'respond', offerId: 'ce7-offer', response });
const approach = (kind: CareerApproachKind = 'apply'): CareerDecisionAction => ({ kind: 'approach', nationId: 'usa', approach: kind });

function persist(p: CareerMarketCenterProps, result: CareerDecisionResult): CareerDecisionInput {
  return { state: result.stateAfter, context: { ...p.decisionInput!.context, career: result.careerAfter,
    game: result.gameAfter, role: result.transfer?.nextRole ?? p.decisionInput!.context.role } };
}

describe('CE7 international career desk', () => {
  it('renders a labelled modal with explicit review steps, six non-immediate responses and exact amounts', () => {
    const p = fixture(); const before = JSON.stringify(p);
    const html = renderToStaticMarkup(<CareerMarketCenter {...p} />);
    expect(html).toContain('role="dialog"'); expect(html).toContain('aria-modal="true"');
    expect(html).toContain('국제 경력 시장 닫기'); expect(html).toContain('최종 승인 전에는 연락·비용이 발생하지 않습니다');
    expect(html).toContain('미국의 공식 초청'); expect(html).toContain('150 정확파운드');
    for (const label of ['탐색 회신', '조건 재협상', '제안 수락', '현 소속에 보고', '포섭 연락망 역이용', '명시적 거절']) expect(html).toContain(label);
    expect(html).not.toContain('최종 승인</button>'); expect(html).not.toContain('상대 수용도'); expect(html).not.toContain('탈출 성공 추정');
    expect(html).toContain('지원 수준이며 성공 확률이 아닙니다'); expect(html).toContain('공식 보직 · 정기 비밀수당 없음');
    expect(html).toContain('직접 접근 2 · 연락망 역이용 3'); expect(html).not.toContain('직접 접근 2 · 역포섭 3');
    expect(p.onRespond).not.toHaveBeenCalled(); expect(p.onApproach).not.toHaveBeenCalled(); expect(p.onClose).not.toHaveBeenCalled();
    expect(JSON.stringify(p)).toBe(before);
  });

  it.each(['inbox', 'opportunities', 'history', 'clandestine'] as const)('switchable %s view performs no commands on render', (initialView) => {
    const p = fixture(); const html = renderToStaticMarkup(<CareerMarketCenter {...p} initialView={initialView} />);
    expect(html).toContain('aria-current="page"'); expect(p.onRespond).not.toHaveBeenCalled(); expect(p.onApproach).not.toHaveBeenCalled();
    expect(p.onClandestineMissionResponse).not.toHaveBeenCalled();
  });

  it('supplies labelled mobile selectors, not a mandatory horizontally scrolling list', () => {
    const p = fixture();
    const inbox = renderToStaticMarkup(<CareerMarketCenter {...p} />);
    const outreach = renderToStaticMarkup(<CareerMarketCenter {...p} initialView="opportunities" />);
    expect(inbox).toContain('검토할 제안<select'); expect(outreach).toContain('접근할 국가<select');
    expect(inbox).toContain('career-desktop-selection'); expect(inbox).toContain('aria-pressed="true"');
  });

  it.each(['missing', 'nation', 'week', 'state'] as const)('keeps mismatched %s context read-only', (change) => {
    const p = fixture();
    if (change === 'missing') p.decisionInput = undefined;
    if (change === 'nation') p.currentNationId = 'usa';
    if (change === 'week') p.week += 1;
    if (change === 'state') p.state = { ...p.state, exposure: 99 };
    expect(createCareerDeskReview(p, respond('accept'))).toBeNull();
    expect(getCareerDeskAvailability(p, approach()).allowed).toBe(false);
    expect(renderToStaticMarkup(<CareerMarketCenter {...p} />)).toContain('읽기 전용');
  });

  it.each<CareerOfferResponse>(['explore', 'negotiate', 'accept', 'reject', 'report', 'turn'])('previewing %s never calls back or mutates source state', (response) => {
    const p = fixture(); const before = JSON.stringify(p);
    const review = createCareerDeskReview(p, respond(response));
    expect(review).not.toBeNull(); expect(JSON.stringify(p)).toBe(before);
    expect(p.onRespond).not.toHaveBeenCalled(); expect(p.onApproach).not.toHaveBeenCalled();
  });

  it.each<CareerApproachKind>(['apply', 'appeal', 'request-asylum', 'offer-secrets', 'offer-double-agent'])('approach %s exposes costs but never a seeded outcome', (kind) => {
    const p = fixture(); const before = JSON.stringify(p); const review = createCareerDeskReview(p, approach(kind))!;
    expect(review.summary.join('\n')).toContain('정치력 2'); expect(review.resources).toEqual([{ label: '정치력 · 회신 실패 때도 사용', before: '86', after: '84' }]);
    expect(review.quote.assessment.preview).not.toHaveProperty('approachResult');
    expect(review.quote.assessment.preview).not.toHaveProperty('success');
    expect(review.summary.join('\n')).toContain('결과는 승인 이후'); expect(p.onApproach).not.toHaveBeenCalled(); expect(JSON.stringify(p)).toBe(before);
  });

  it('describes actual transfer resets, preserved research/worldline, national treasury and experience', () => {
    const p = fixture(); const review = createCareerDeskReview(p, respond('accept'))!;
    expect(review.identity?.before).toContain('영국'); expect(review.identity?.after).toContain('미합중국');
    expect(review.acknowledgement).toContain('기존 참모·부대를 그대로 가져가지');
    expect(review.resets.join('\n')).toContain('55%'); expect(review.resets.join('\n')).toContain('참모·후보 명단');
    expect(review.preserved.join('\n')).toContain('연구 목록과 진행도는 유지');
    expect(review.summary.join('\n')).toContain('지도부 신임 48 → 52'); expect(review.summary.join('\n')).toContain('경험 61 → 34');
    expect(review.summary.join('\n')).toContain('계약금 150 정확파운드');
    expect(review.summary.join('\n')).not.toContain('주간 비밀수당 9');
  });

  it('requires explicit acknowledgement for a transfer and a secret contract', () => {
    for (const kind of ['official-appointment', 'double-agent'] as const) {
      const p = fixture(kind); const review = createCareerDeskReview(p, respond('accept'))!; const gate = createCareerReviewGate();
      expect(confirmCareerDeskReview(review, p, gate, false)).toMatchObject({ ok: false, submitted: false });
      expect(p.onRespond).not.toHaveBeenCalled();
      expect(confirmCareerDeskReview(review, p, gate, true)).toMatchObject({ ok: true, submitted: true });
      expect(p.onRespond).toHaveBeenCalledTimes(1);
    }
  });

  it.each<ForeignCareerOfferKind>(['secret-retainer', 'sell-secrets', 'double-agent', 'state-betrayal'])('explains conditional weekly income for %s without guaranteed percentage claims', (kind) => {
    const p = fixture(kind); const review = createCareerDeskReview(p, respond('accept'))!;
    expect(review.summary.join('\n')).toContain('계약상 주간 비밀수당 9 정확파운드');
    expect(review.summary.join('\n')).toContain('활동 상태·상한에 따라');
    expect(review.identity?.after).toContain('현 보직 유지');
    const html = renderToStaticMarkup(<CareerMarketCenter {...p} />);
    expect(html).toContain('계약상 주간 비밀수당 9 정확파운드'); expect(html).not.toContain('보호</span><strong>62%');
  });

  it('keeps current-currency display strings stable after transfer changes the formatter', () => {
    const p = fixture(); const review = createCareerDeskReview(p, respond('negotiate'))!; const before = JSON.stringify(review);
    p.formatMoney = (value) => value + ' 신통화';
    expect(JSON.stringify(review)).toBe(before); expect(review.summary.join('\n')).toContain('150 정확파운드 → 183 정확파운드');
    expect(review.currencyNote).toContain('이적 후에도'); expect(review.summary.join('\n')).not.toContain('신통화');
  });

  it.each(['week', 'politicalPower', 'treasury', 'role', 'offer', 'deadline', 'exposure', 'busy', 'removed'] as const)('blocks stale review after %s changes', (change) => {
    const p = fixture(); const review = createCareerDeskReview(p, respond('explore'))!; const input = p.decisionInput!;
    if (change === 'week') { input.context.week += 1; input.context.game.week += 1; p.week += 1; }
    if (change === 'politicalPower') input.context.game.politicalPower -= 1;
    if (change === 'treasury') input.context.game.treasury -= 1;
    if (change === 'role') input.context.role = getRole('britain-tier3', 'britain');
    if (change === 'offer') input.state.offers[0].terms.signingBonus += 1;
    if (change === 'deadline') input.state.offers[0].deadlineWeek += 1;
    if (change === 'exposure') input.state.exposure += 1;
    if (change === 'busy') input.busy = true;
    if (change === 'removed') input.state.offers = [];
    expect(assessCareerDeskReview(review, p).allowed).toBe(false);
    expect(confirmCareerDeskReview(review, p, createCareerReviewGate(), true)).toMatchObject({ ok: false, submitted: false });
    expect(p.onRespond).not.toHaveBeenCalled();
  });

  it('rejects a changed selected offer or action before callback', () => {
    const p = fixture(); const review = createCareerDeskReview(p, respond('explore'))!;
    expect(confirmCareerDeskReview(review, p, createCareerReviewGate(), true, respond('negotiate'))).toMatchObject({ ok: false, submitted: false });
    expect(p.onRespond).not.toHaveBeenCalled();
  });

  it.each(['explore', 'negotiate', 'accept', 'reject', 'report', 'turn'] as const)('approves %s at most once and waits for actual state, not callback truth', (response) => {
    const p = fixture(); const review = createCareerDeskReview(p, respond(response))!; const gate = createCareerReviewGate();
    const outcome = confirmCareerDeskReview(review, p, gate, true);
    expect(outcome.ok).toBe(true); expect(outcome.result).not.toBeNull(); expect(p.onRespond).toHaveBeenCalledWith('ce7-offer', response);
    expect(confirmCareerDeskReview(review, p, gate, true).ok).toBe(false); expect(p.onRespond).toHaveBeenCalledTimes(1);
    expect(getCareerDecisionReceipt(outcome.result!, p.decisionInput!).confirmed).toBe(false);
    expect(getCareerDecisionReceipt(outcome.result!, persist(p, outcome.result!)).confirmed).toBe(true);
  });

  it.each(['false', 'throw'] as const)('never retries an uncertain %s callback', (mode) => {
    const p = fixture(); p.onRespond = vi.fn(() => { if (mode === 'throw') throw new Error('uncertain'); return false; });
    const review = createCareerDeskReview(p, respond('explore'))!; const gate = createCareerReviewGate();
    expect(confirmCareerDeskReview(review, p, gate, true)).toMatchObject({ ok: false, submitted: true });
    expect(confirmCareerDeskReview(review, p, gate, true).ok).toBe(false); expect(p.onRespond).toHaveBeenCalledTimes(1);
  });

  it('replaces pending footer feedback only after all actual receipt branches match', () => {
    const p = fixture(); const review = createCareerDeskReview(p, respond('explore'))!;
    const outcome = confirmCareerDeskReview(review, p, createCareerReviewGate(), true);
    const pending = getCareerDecisionReceipt(outcome.result!, p.decisionInput!);
    expect(getCareerDeskStatus(pending.confirmed, outcome.reason, true)).toBe(outcome.reason);
    const confirmed = getCareerDecisionReceipt(outcome.result!, persist(p, outcome.result!));
    const status = getCareerDeskStatus(confirmed.confirmed, outcome.reason, true);
    expect(status).toContain('실제 반영된 것을 확인했습니다'); expect(status).not.toContain('승인 요청을 전달했습니다');
  });

  it('preserves read-only and unsent footer messages without a confirmed receipt', () => {
    expect(getCareerDeskStatus(false, '', false)).toContain('읽기 전용');
    expect(getCareerDeskStatus(false, '', true)).toContain('최고 국가수반');
    expect(getCareerDeskStatus(false, '처리 결과를 확인할 수 없습니다.', true)).toBe('처리 결과를 확인할 수 없습니다.');
  });

  it('never silently selects a different offer when the old one is removed or resolved', () => {
    const p = fixture(); p.state.offers.push({ ...p.state.offers[0], id: 'other', title: '다른 제안' });
    expect(getCareerDeskSelectedOffer(p.state, 'missing')).toBeNull(); expect(getCareerDeskSelectedOffer(p.state, null)).toBeNull();
    p.state.offers[0].status = 'accepted';
    expect(getCareerDeskSelectedOffer(p.state, 'ce7-offer')?.status).toBe('accepted');
    const html = renderToStaticMarkup(<CareerMarketCenter {...p} initialOfferId="missing" />);
    expect(html).toContain('선택한 제안을 찾을 수 없습니다'); expect(html).toContain('목록에서 직접 선택하십시오');
  });

  it.each(nations.map((nation) => [nation.id] as const))('renders role and read-only career views for %s without executing', (nationId) => {
    const p = fixture(); const role = careerRoles.find((entry) => entry.nationId === nationId)!;
    const html = renderToStaticMarkup(<CareerMarketCenter {...p} currentNationId={nationId} role={role} decisionInput={undefined} initialView="opportunities" />);
    expect(html).toContain(role.title); expect(html).toContain('접근할 국가'); expect(p.onRespond).not.toHaveBeenCalled(); expect(p.onApproach).not.toHaveBeenCalled();
  });
});
