import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PublicHealthCenter, createPublicHealthReview, confirmPublicHealthReview, previewPublicHealthWeek, resolvePublicHealthInvestmentChoice, resolvePublicHealthPolicyChoice, type PublicHealthCenterProps, type PublicHealthOrder, type PublicHealthReviewInput, type PublicHealthView } from './PublicHealthCenter';
import { advancePublicHealthWeek, applyPublicHealthInvestment, calculateWeeklyOutbreakRisk, createPublicHealthState, getPublicHealthPolicy, outbreakTemplates, publicHealthInvestments, publicHealthPolicies } from './publicHealth';
import type { GameState } from './types';

const game: GameState = { week: 20, manpower: 1200, politicalPower: 80, fuel: 70, steel: 110, factories: 30, stability: 68, warSupport: 75, commandPoints: 50, treasury: 900, victoryScore: 45, airPower: 55, navalPower: 50, intelNetwork: 60, enemyPressure: 72 };
function fixture(active = true): PublicHealthCenterProps {
  const state = createPublicHealthState(1942);
  if (active) {
    state.activeOutbreak = { id: 'covid-test', templateId: 'covid-like-coronavirus', codeName: 'PH-020', origin: '항만 검역소', detectedWeek: 18, phase: 'epidemic', weeksActive: 3, estimatedCases: 5000, weeklyCases: 1200, deaths: 20, rEffective: 1.9, hospitalLoad: 88, knowledge: 60, peakWeeklyCases: 1400, consecutiveDecline: 0, variantCount: 0 };
    state.totalDeaths = 20;
  }
  return { state, game: { ...game }, context: { week: 21, nationId: 'britain', theater: 'europe', enemyPressure: 72, stability: 68, averageSupply: 58, scienceBonus: 2 }, onPolicyChange: vi.fn(), onInvestment: vi.fn(), formatMoney: (value) => `£ ${value}` };
}
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
const policyOrder: PublicHealthOrder = { kind: 'policy', id: 'suppression' };
const investmentOrder: PublicHealthOrder = { kind: 'investment', id: 'laboratory-network' };

describe('public health direct-engine projections', () => {
  it.each(publicHealthPolicies.map((policy) => policy.id))('projects %s from the existing weekly engine without changing the original state', (policyId) => {
    const props = fixture();
    const state = deepFreeze({ ...props.state, policyId });
    const context = deepFreeze(props.context);
    const before = JSON.stringify([state, context]);
    const expected = advancePublicHealthWeek(state, context);
    const preview = previewPublicHealthWeek(state, context)!;
    expect(preview).toMatchObject({ week: context.week, weeklyCases: expected.state.activeOutbreak!.weeklyCases, weeklyDeaths: expected.state.totalDeaths - state.totalDeaths, rEffective: expected.state.activeOutbreak!.rEffective, hospitalLoad: expected.state.activeOutbreak!.hospitalLoad, treasuryCost: -expected.gameDelta.treasury!, politicalPowerCost: -(expected.gameDelta.politicalPower ?? 0) || 0 });
    expect(previewPublicHealthWeek(state, context)).toEqual(preview);
    expect(JSON.stringify([state, context])).toBe(before);
  });

  it('retains actual final-week cases and deaths when the next outbreak is archived', () => {
    const props = fixture();
    const state = { ...props.state, preparedness: 100, surveillance: 100, countermeasureProgress: 100, policyId: 'suppression' as const, activeOutbreak: { ...props.state.activeOutbreak!, weeksActive: 41, consecutiveDecline: 3, weeklyCases: 5000, estimatedCases: 200000, peakWeeklyCases: 100000 } };
    const result = advancePublicHealthWeek(state, props.context);
    expect(result.state.activeOutbreak).toBeNull();
    const preview = previewPublicHealthWeek(state, props.context)!;
    expect(preview.resolved).toBe(true);
    expect(preview.weeklyCases).toBe(result.state.history.at(-1)!.cases - state.activeOutbreak.estimatedCases);
    expect(preview.weeklyDeaths).toBe(result.state.totalDeaths - state.totalDeaths);
    expect(preview.weeklyDeaths).toBeGreaterThan(0);
    expect(preview.rEffective).toBeNull();
    expect(preview.hospitalLoad).toBeNull();
    expect(preview.treasuryCost).toBe(getPublicHealthPolicy('suppression').weeklyTreasury);
  });

  it('does not manufacture or disclose a dormant outbreak forecast', () => {
    const props = fixture(false);
    expect(previewPublicHealthWeek(props.state, props.context)).toBeNull();
    const review = createPublicHealthReview(props, policyOrder).review!;
    expect(review.forecast).toBeNull();
    expect(review.immediateCost).toEqual({ treasury: 0, politicalPower: 0, steel: 0, manpower: 0 });
    expect(review.warnings.join(' ')).toContain('처음 탐지하는 주에는 정책 운영비가 없습니다');
    expect(props.state.history).toHaveLength(0);
  });
});

describe('public health approval review rules', () => {
  it('preserves free policy changes even when future operating costs exceed current funds', () => {
    const props = fixture();
    props.game = { ...props.game, treasury: 0, politicalPower: 0 };
    const before = JSON.stringify(props);
    const { review } = createPublicHealthReview(props, policyOrder);
    expect(review).not.toBeNull();
    expect(review!.immediateCost.treasury).toBe(0);
    expect(review!.resourcesAfter.treasury).toBe(0);
    expect(review!.forecast?.treasuryCost).toBe(48);
    expect(review!.warnings.join(' ')).toContain('정책 변경 자체는 가능');
    expect(JSON.stringify(props)).toBe(before);
  });

  it.each(publicHealthInvestments.map((investment) => investment.id))('previews exact one-time costs and bounded capacity effects for %s', (id) => {
    const props = fixture();
    const before = JSON.stringify(props);
    const investment = publicHealthInvestments.find((entry) => entry.id === id)!;
    const expectedState = applyPublicHealthInvestment(props.state, id);
    const review = createPublicHealthReview(props, { kind: 'investment', id }).review!;
    expect(review.immediateCost).toEqual({ treasury: investment.treasuryCost, politicalPower: investment.politicalPowerCost ?? 0, steel: investment.steelCost ?? 0, manpower: investment.manpowerCost ?? 0 });
    expect(review.resourcesAfter.treasury).toBe(props.game.treasury - investment.treasuryCost);
    expect(review.forecast).toEqual(previewPublicHealthWeek(expectedState, props.context));
    expect(review.riskAfter).toBe(calculateWeeklyOutbreakRisk(expectedState, props.context));
    expect(review.confirmationWeek).toBe(props.context.week);
    expect(JSON.stringify(props)).toBe(before);
  });

  it('shows the actual 100-point cap rather than advertising the full nominal gain', () => {
    const props = fixture();
    props.state = { ...props.state, surveillance: 98, preparedness: 99 };
    const review = createPublicHealthReview(props, investmentOrder).review!;
    expect(review.capacityChanges).toContainEqual({ label: '감시·탐지', before: 98, after: 100 });
    expect(review.capacityChanges).toContainEqual({ label: '사전 대비', before: 99, after: 100 });
    props.state = { ...props.state, surveillance: 100, preparedness: 100 };
    const atCap = createPublicHealthReview(props, investmentOrder).review!;
    expect(atCap.capacityChanges).toHaveLength(0);
    expect(atCap.immediateCost.treasury).toBe(160);
    expect(atCap.warnings.join(' ')).toContain('즉시 지표 상승은 없습니다');
  });

  it('rejects already active policy, duplicate projects, knowledge and resource shortages', () => {
    const props = fixture(false);
    expect(createPublicHealthReview(props, { kind: 'policy', id: 'sentinel' }).review).toBeNull();
    expect(createPublicHealthReview({ ...props, state: { ...props.state, completedInvestments: ['laboratory-network'] } }, investmentOrder).review).toBeNull();
    expect(createPublicHealthReview(props, { kind: 'investment', id: 'countermeasure-consortium' }).reason).toContain('지식 45%');
    expect(createPublicHealthReview({ ...props, game: { ...game, treasury: 159 } }, investmentOrder).review).toBeNull();
    expect(createPublicHealthReview({ ...props, game: { ...game, politicalPower: 7 } }, investmentOrder).review).toBeNull();
    expect(createPublicHealthReview({ ...props, game: { ...game, steel: 11 } }, { kind: 'investment', id: 'protective-stockpile' }).review).toBeNull();
    expect(createPublicHealthReview({ ...props, game: { ...game, manpower: 17 } }, { kind: 'investment', id: 'field-hospitals' }).review).toBeNull();
  });

  it('accepts exact-threshold investment resources without precharging future operating costs', () => {
    const props = fixture();
    props.game = { ...game, treasury: 160, politicalPower: 8 };
    const review = createPublicHealthReview(props, investmentOrder).review!;
    expect(review.resourcesAfter.treasury).toBe(0);
    expect(review.resourcesAfter.politicalPower).toBe(0);
    expect(review.forecast?.treasuryCost).toBe(6);
  });

  it.each([Number.NaN, Infinity])('fails closed for invalid numeric resources (%s)', (treasury) => {
    const props = fixture();
    expect(createPublicHealthReview({ ...props, game: { ...game, treasury } }, investmentOrder).review).toBeNull();
  });
});

describe('public health explicit confirmation', () => {
  it.each([policyOrder, investmentOrder])('sends $kind to the existing handler once without applying state or costs locally', (order) => {
    const props = fixture();
    const review = createPublicHealthReview(props, order).review!;
    const before = JSON.stringify(props);
    const gate = { lastFingerprint: null as string | null };
    const result = confirmPublicHealthReview(review, props, props, gate);
    expect(result.status).toBe('sent');
    expect(result.reason).toContain('요청을 전달했습니다');
    expect(result.reason).toContain('반영 결과를 확인');
    expect(confirmPublicHealthReview(review, props, props, gate).status).toBe('blocked');
    const handler = order.kind === 'policy' ? props.onPolicyChange : props.onInvestment;
    expect(handler).toHaveBeenCalledExactlyOnceWith(order.id);
    expect(JSON.stringify(props)).toBe(before);
  });

  it.each(['week', 'nation', 'resources', 'health', 'supply', 'science', 'theater'] as const)('requires a new review when %s changes', (change) => {
    const props = fixture();
    const review = createPublicHealthReview(props, investmentOrder).review!;
    const next: PublicHealthReviewInput = { ...props };
    if (change === 'week') next.game = { ...props.game, week: props.game.week + 1 };
    if (change === 'nation') next.context = { ...props.context, nationId: 'usa' };
    if (change === 'resources') next.game = { ...props.game, steel: props.game.steel + 1 };
    if (change === 'health') next.state = { ...props.state, publicTrust: props.state.publicTrust + 1 };
    if (change === 'supply') next.context = { ...props.context, averageSupply: props.context.averageSupply + 1 };
    if (change === 'science') next.context = { ...props.context, scienceBonus: 3 };
    if (change === 'theater') next.context = { ...props.context, theater: 'asia' };
    const gate = { lastFingerprint: null };
    expect(confirmPublicHealthReview(review, next, props, gate).status).toBe('stale');
    expect(gate.lastFingerprint).toBeNull();
    expect(props.onInvestment).not.toHaveBeenCalled();
  });

  it('blocks busy reviews and confirmations without consuming the approval gate', () => {
    const props = fixture();
    const review = createPublicHealthReview(props, investmentOrder).review!;
    const gate = { lastFingerprint: null };
    expect(createPublicHealthReview({ ...props, busy: true }, investmentOrder).review).toBeNull();
    expect(confirmPublicHealthReview(review, { ...props, busy: true }, props, gate).status).toBe('blocked');
    expect(gate.lastFingerprint).toBeNull();
    expect(props.onInvestment).not.toHaveBeenCalled();
  });
});

describe('public health focused workspaces', () => {
  it('keeps the initially selected investment after its approval adds the completion record', () => {
    const props = fixture(false);
    const selectedId = resolvePublicHealthInvestmentChoice(props.state).id;
    expect(selectedId).toBe('laboratory-network');
    const completed = applyPublicHealthInvestment(props.state, selectedId);
    expect(resolvePublicHealthInvestmentChoice(completed, selectedId).id).toBe(selectedId);
    expect(completed.completedInvestments).toContain(selectedId);
    expect(resolvePublicHealthInvestmentChoice(completed, 'removed-project').id).toBe('field-hospitals');
  });

  it('keeps the selected policy when approval or later health conditions change the recommendation', () => {
    const props = fixture();
    const selectedId = resolvePublicHealthPolicyChoice(props.state, props.game).id;
    expect(selectedId).toBe('suppression');
    const changed = { ...props.state, policyId: selectedId, activeOutbreak: { ...props.state.activeOutbreak!, rEffective: 1.1, hospitalLoad: 120 } };
    expect(resolvePublicHealthPolicyChoice(changed, props.game).id).toBe('medical-surge');
    expect(resolvePublicHealthPolicyChoice(changed, props.game, selectedId).id).toBe(selectedId);
    expect(resolvePublicHealthPolicyChoice(changed, props.game, 'removed-policy').id).toBe('medical-surge');
  });

  it('offers a focusable result announcement and derives the completed label from actual records only', () => {
    const props = fixture(false);
    const before = renderToStaticMarkup(<PublicHealthCenter {...props} initialView="investments" />);
    expect(before).toContain('aria-label="보건 작업 결과 안내"');
    expect(before).toContain('aria-live="polite" tabindex="-1"');
    expect(before).not.toContain('class="ph-complete"');
    props.state.completedInvestments = publicHealthInvestments.map((investment) => investment.id);
    const completed = renderToStaticMarkup(<PublicHealthCenter {...props} initialView="investments" />);
    expect(completed).toContain('class="ph-complete"');
    expect(completed).toContain('구축 완료 · 보건 역량 기록에 반영');
    expect(completed).toContain('국립 감시 실험실망');
  });

  it.each<PublicHealthView>(['overview', 'policy', 'investments', 'records'])('renders %s without state mutation or action callbacks', (initialView) => {
    const props = fixture();
    const before = JSON.stringify(props);
    const html = renderToStaticMarkup(<PublicHealthCenter {...props} initialView={initialView} />);
    expect(html).toContain('보건 본부 작업보기');
    expect(html).toContain('id="health-intro"');
    expect(JSON.stringify(props)).toBe(before);
    expect(props.onPolicyChange).not.toHaveBeenCalled();
    expect(props.onInvestment).not.toHaveBeenCalled();
  });

  it('starts with current crisis and a recommendation that only opens review work', () => {
    const html = renderToStaticMarkup(<PublicHealthCenter {...fixture()} />);
    expect(html).toContain('이번 주 보건 우선순위');
    expect(html).toContain('PH-020 위기 지휘실');
    expect(html).toContain('권고 정책 살펴보기');
    expect(html).not.toContain('class="ph-policy-detail"');
    expect(html).not.toContain('class="ph-investment-detail"');
    expect(html).not.toContain('class="ph-source-detail"');
    expect(html).not.toContain('권고 태세 채택');
  });

  it('shows one selected policy with existing choices and currency-aware next-week costs', () => {
    const html = renderToStaticMarkup(<PublicHealthCenter {...fixture()} initialView="policy" />);
    expect(html.match(/class="ph-policy-detail"/g)).toHaveLength(1);
    for (const policy of publicHealthPolicies) expect(html).toContain(`value="${policy.id}"`);
    expect(html).toContain('id="health-forecast-title"');
    expect(html).toContain('제 22주 보건 결산 예상');
    expect(html).toContain('£ 48');
    expect(html).toContain('£ 0');
    expect(html).not.toContain('₩');
    expect(html).toContain('정책 변경 검토');
  });

  it('shows one selected investment and all project choices while busy approval stays disabled', () => {
    const html = renderToStaticMarkup(<PublicHealthCenter {...fixture()} initialView="investments" busy />);
    expect(html.match(/class="ph-investment-detail"/g)).toHaveLength(1);
    for (const investment of publicHealthInvestments) expect(html).toContain(`value="${investment.id}"`);
    expect(html).toContain('주간 결산 중');
    expect(html).toContain('disabled=""');
    expect(html).toContain('£ 160');
  });

  it('preserves every existing source choice and explicit counterfactual labels with one source detail', () => {
    const props = fixture();
    const html = renderToStaticMarkup(<PublicHealthCenter {...props} initialView="records" />);
    expect(html.match(/class="ph-source-detail"/g)).toHaveLength(1);
    for (const profile of outbreakTemplates) expect(html).toContain(`value="${profile.id}"`);
    expect(html).toContain(outbreakTemplates.find((profile) => profile.id === 'covid-like-coronavirus')!.sourceUrl);
    expect(html).toContain('후대 유행의 역학·대응 양상을 참고한 대체역사 병원체');
    expect(html).toContain('아직 종결된 유행 기록이 없습니다');
  });

  it('separates opening/cooldown risk from a guaranteed new outbreak', () => {
    const props = fixture(false);
    props.context.week = 1;
    const html = renderToStaticMarkup(<PublicHealthCenter {...props} />);
    expect(html).toContain('새 유행 발생 보류');
    expect(html).toContain('현재 조건의 주간 위험지표');
    expect(html).not.toContain('다음 주 발병 확률');
  });

  it('keeps all actual archived records selectable and displays only the latest record detail initially', () => {
    const props = fixture(false);
    props.state.history = [
      { id: 'first', templateId: 'wartime-influenza', codeName: 'PH-FIRST', detectedWeek: 4, resolvedWeek: 9, cases: 2000, deaths: 12, outcome: 'contained' },
      { id: 'latest', templateId: 'wartime-cholera', codeName: 'PH-LATEST', detectedWeek: 10, resolvedWeek: 19, cases: 3000, deaths: 25, outcome: 'managed' },
    ];
    const html = renderToStaticMarkup(<PublicHealthCenter {...props} initialView="records" />);
    expect(html.match(/class="ph-history-detail"/g)).toHaveLength(1);
    expect(html).toContain('value="first"');
    expect(html).toContain('value="latest"');
    expect(html).toContain('<h4>PH-LATEST');
    expect(html).toContain('3,000');
    expect(props.state.history[0].id).toBe('first');
  });
});
