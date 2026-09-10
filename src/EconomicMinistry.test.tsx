import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EconomicMinistry, createEconomicOrderReview, confirmEconomicOrderReview, type EconomicMinistryView, type EconomicOrderIntent, type NationalFiscalLedger } from './EconomicMinistry';
import { buyIndustrialStake, sellIndustrialStake, calculateEconomyLedger, createEconomyState, getAvailableCompanies, type EconomyState } from './economy';
import { buyForeignCurrency, sellForeignCurrency, issueCustomCurrency, formatNationalCurrency, getForeignCurrencies } from './currency';
import { getCampaignYearForWeek } from './campaignCalendar';
import type { GameState } from './types';

const game: GameState = {
  week: 100, manpower: 1200, politicalPower: 80, fuel: 70, steel: 100,
  factories: 30, stability: 75, warSupport: 62, commandPoints: 50,
  treasury: 900, victoryScore: 75, airPower: 60, navalPower: 58,
  intelNetwork: 55, enemyPressure: 20,
};
const nationalLedger: NationalFiscalLedger = { week: 101, revenue: 100, expenditure: 80, balance: 20, additionalIndustryCost: 10 };

function render(options: { nationalLedger?: NationalFiscalLedger; state?: EconomyState; navigation?: boolean; initialView?: EconomicMinistryView } = {}) {
  const state = options.state ?? createEconomyState('britain');
  const callbacks = {
    onTaxPolicy: vi.fn(), onBondProgram: vi.fn(), onPriceControl: vi.fn(),
    onBuy: vi.fn(), onSell: vi.fn(), onBuyCurrency: vi.fn(), onSellCurrency: vi.fn(),
    onIssueCurrency: vi.fn(), onRestoreHistoricalCurrency: vi.fn(),
  };
  const onOpenNationalBudget = options.navigation ? vi.fn() : undefined;
  const html = renderToStaticMarkup(<EconomicMinistry
    state={state} game={game} nationId="britain" relations={[]}
    staffWeeklyCost={18} economyAdvisorBonus={10} {...callbacks}
    nationalLedger={options.nationalLedger} onOpenNationalBudget={onOpenNationalBudget}
    initialView={options.initialView}
  />);
  const money = (value: number, signed = false) => formatNationalCurrency(value, state.monetarySystem, 'britain', getCampaignYearForWeek(game.week), { inflation: state.inflation, publicConfidence: state.publicConfidence }, { signed });
  const hero = html.split('<div class="economy-hero-balance">')[1].split('</div>')[0];
  const ledger = html.split('<section class="economy-ledger-panel">')[1]?.split('</section>')[0] ?? '';
  return { html, hero, ledger, money, callbacks, onOpenNationalBudget, state };
}

describe('phase-correct treasury presentation', () => {
  it('retains the original wartime ledger and policy controls when no national ledger is supplied', () => {
    const result = render();
    const expected = calculateEconomyLedger(result.state, { week: 101, nationId: 'britain', game, staffWeeklyCost: 18, economyAdvisorBonus: 10 });
    expect(result.html).toContain('<h2>전시 재무성</h2>');
    expect(result.hero).toContain(result.money(expected.netTreasuryChange, true));
    expect(result.ledger).toContain('군수공장 운영·조달');
    expect(result.ledger).toContain('참모·전문가 급여');
    const policy = render({ initialView: 'policy' });
    expect(policy.html.match(/class="economy-policy-selector"/g)).toHaveLength(3);
    expect(policy.html).toContain('국채·신용 조달');
    expect(result.html).not.toContain('국정 실제 계산 전망');
  });

  it('takes all national headline numbers from the supplied settlement projection', () => {
    const { html, hero, ledger, money } = render({ nationalLedger });
    expect(html).toContain('<h2>국정 재무성</h2>');
    expect(hero).toContain('제102주 국정 실제 계산 전망');
    expect(hero).toContain(money(20, true));
    expect(ledger).toContain(money(100, true));
    expect(ledger).toContain(money(80));
    expect(ledger).toContain(money(20, true));
    expect(ledger).not.toContain('군수공장 운영·조달');
    expect(ledger).not.toContain('참모·전문가 급여');
    expect(ledger).not.toContain('신규 차입 없음');
  });

  it('splits existing and additional industry costs without subtracting the additional cost again', () => {
    const { html, hero, ledger, money } = render({ nationalLedger });
    expect(ledger).toContain(money(70));
    expect(ledger).toContain(money(10));
    expect(ledger).toContain(`${money(100)} 세입 − ${money(80)} 총지출`);
    expect(hero).toContain(money(20, true));
    expect(hero).not.toContain(money(10, true));
    expect(html).toContain('기존 치안 예산의 군수 집행 몫 포함 · 재차 차감 없음');
    expect(html).toContain('총지출에 이미 1회 포함 · 별도 중복 차감 없음');
  });

  it('removes inapplicable war-policy buttons and offers the national budget route', () => {
    const { html, callbacks, onOpenNationalBudget } = render({ nationalLedger, navigation: true, initialView: 'policy' });
    expect(html).not.toContain('economy-policy-selector');
    expect(html).not.toContain('<legend>조세 정책</legend>');
    expect(html).not.toContain('<legend>국채·신용 조달</legend>');
    expect(html).not.toContain('<legend>물가·배급 통제</legend>');
    expect(html).toContain('국가 운영 예산 열기');
    expect(html).toContain('전시 정책을 국정 장부에 중복 적용하지 않습니다');
    for (const callback of Object.values(callbacks)) expect(callback).not.toHaveBeenCalled();
    expect(onOpenNationalBudget).not.toHaveBeenCalled();
  });

  it('works without an optional navigation callback and does not render a dead budget button', () => {
    const { html } = render({ nationalLedger, initialView: 'policy' });
    expect(html).toContain('국가 운영 화면의 세입·지출 조정에서 예산을 변경할 수 있습니다');
    expect(html).not.toContain('국가 운영 예산 열기');
  });

  it('updates forecasts directly from new props, including a deficit and zero additional charge', () => {
    const first = render({ nationalLedger });
    const nextLedger = { ...nationalLedger, week: 102, revenue: 40, expenditure: 45, balance: -5, additionalIndustryCost: 0 };
    const next = render({ nationalLedger: nextLedger });
    expect(first.hero).toContain(first.money(20, true));
    expect(next.hero).toContain('제103주 국정 실제 계산 전망');
    expect(next.hero).toContain(next.money(-5, true));
    expect(next.hero).not.toContain(next.money(20, true));
    expect(next.ledger).toContain(`${next.money(40)} 세입 − ${next.money(45)} 총지출`);
    expect(nextLedger).toEqual({ week: 102, revenue: 40, expenditure: 45, balance: -5, additionalIndustryCost: 0 });
  });

  it('keeps real stock and currency controls while labeling postwar dividends as unconnected estimates', () => {
    const initial = createEconomyState('britain');
    const invested = buyIndustrialStake(initial, getAvailableCompanies('britain')[0].id, 100)!.state;
    const original = structuredClone(invested);
    const { html } = render({ nationalLedger, state: invested, initialView: 'investments' });
    const currency = render({ nationalLedger, state: invested, initialView: 'currency' }).html;
    expect(currency).toContain('새 화폐 발행');
    expect(currency).toContain('역사 연표로 복귀 검토');
    expect(currency).toContain('economy-fx-buy');
    expect(html).toContain('<b>매수 검토</b>');
    expect(html).toContain('절반 매각');
    expect(html).toContain('전량 매각');
    expect(html).toContain('국정 자동입금 미연결 · 세입 미포함');
    expect(html).toContain('참고 주 배당');
    expect(html).not.toContain('주간 재정 세입에 포함');
    expect(invested).toEqual(original);
  });

  it('does not present un-applied wartime market cash and confidence effects as national settlement', () => {
    const state = createEconomyState('britain');
    state.eventHistory = [{ id: 'market-event', title: '시험 시장 사건', detail: '기업 평가가격 기록', priceImpact: 0.02, treasuryImpact: 7, inflationImpact: 0.1, confidenceImpact: 2, tone: 'good' }];
    const national = render({ nationalLedger, state, initialView: 'investments' });
    expect(national.html).toContain('가격 변동만 적용');
    expect(national.html).toContain('전시 참고 재정');
    expect(national.html).toContain('전시 참고 신뢰');
    expect(national.hero).not.toContain(national.money(27, true));
    expect(render({ state }).html).not.toContain('전시 참고 재정');
  });

  it('starts with cash flow and real review routes, not all company or currency cards', () => {
    const { html, callbacks } = render({ nationalLedger });
    expect(html).toContain('이번 주 재정 검토');
    expect(html).toContain('재무성 업무 선택');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('economy-company-row');
    expect(html).not.toContain('economy-fx-list');
    expect(html).not.toContain('economy-policy-selector');
    expect(html).not.toContain('economy-event-panel');
    for (const callback of Object.values(callbacks)) expect(callback).not.toHaveBeenCalled();
  });

  it('renders only the selected asset card and preserves the other choices in accessible selectors', () => {
    const investment = render({ initialView: 'investments' }).html;
    expect(investment.match(/class="economy-company-row /g)).toHaveLength(1);
    expect(investment).toContain('검토할 기업');
    for (const company of getAvailableCompanies('britain')) expect(investment).toContain(`value="${company.id}"`);
    const fx = render({ initialView: 'currency' }).html;
    expect(fx).toContain('검토할 외화');
    expect(fx.match(/<article class="(?:approved|refused)"/g)).toHaveLength(1);
    expect(fx).not.toContain('economy-company-row');
  });
});

describe('review then explicitly submit financial orders', () => {
  const input = (state = createEconomyState('britain')) => ({ state, game: { ...game }, nationId: 'britain' as const, relations: [], staffWeeklyCost: 18, economyAdvisorBonus: 10, nationalLedger });
  const callbacks = () => ({ onBuy: vi.fn(), onSell: vi.fn(), onBuyCurrency: vi.fn(), onSellCurrency: vi.fn(), onIssueCurrency: vi.fn(), onRestoreHistoricalCurrency: vi.fn() });
  const companyId = getAvailableCompanies('britain')[0].id;
  const year = getCampaignYearForWeek(game.week);

  it('uses the existing buy/sell engine costs without mutating state or charging twice', () => {
    const source = input(); const before = structuredClone(source);
    const buyIntent: EconomicOrderIntent = { kind: 'buy-company', companyId, amount: 50 };
    const review = createEconomicOrderReview(source, buyIntent)!;
    const engine = buyIndustrialStake(source.state, companyId, 50)!;
    expect(review.treasuryDelta).toBe(engine.treasuryDelta);
    expect(review.treasuryAfter).toBe(game.treasury + engine.treasuryDelta);
    const holding = input(engine.state);
    const sold = createEconomicOrderReview(holding, { kind: 'sell-company', companyId, ratio: 0.5 })!;
    expect(sold.treasuryDelta).toBe(sellIndustrialStake(engine.state, companyId, 0.5)!.treasuryDelta);
    expect(sold.details.join(' ')).toContain('2% 수수료를 이미 반영');
    expect(source).toEqual(before);
  });

  it('shows engine-rounded FX receipts and liquidation fees without adding a second fee', () => {
    const source = input();
    const metrics = { inflation: source.state.inflation, publicConfidence: source.state.publicConfidence };
    const currencyId = getForeignCurrencies('britain', year).find((currency) => buyForeignCurrency(source.state.monetarySystem, 'britain', currency.id, 25, year, game.week, metrics, []))!.id;
    const engine = buyForeignCurrency(source.state.monetarySystem, 'britain', currencyId, 25, year, game.week, metrics, [])!;
    const review = createEconomicOrderReview(source, { kind: 'buy-currency', currencyId, amount: 25 })!;
    expect(review.treasuryDelta).toBe(engine.treasuryDelta);
    const held = input({ ...source.state, monetarySystem: engine.state });
    const sold = createEconomicOrderReview(held, { kind: 'sell-currency', currencyId, ratio: 1 })!;
    const sale = sellForeignCurrency(engine.state, 'britain', currencyId, 1, year, game.week, metrics, [])!;
    expect(sold.treasuryDelta).toBe(sale.treasuryDelta);
    expect(sold.treasuryAfter).toBe(game.treasury + sale.treasuryDelta);
    expect(sold.details.join(' ')).toContain(`${(sale.quote.feeRate * 100).toFixed(2)}%`);
  });

  it('previews currency issuance without creating treasury and preserves history restoration review', () => {
    const source = input(); const before = structuredClone(source);
    const intent: EconomicOrderIntent = { kind: 'issue-currency', name: '신 통화', symbol: 'N', backing: 'foreign-reserve' };
    const review = createEconomicOrderReview(source, intent)!;
    expect(review.treasuryDelta).toBe(0);
    expect(review.treasuryAfter).toBe(game.treasury);
    expect(review.risk).toContain('역사 자동전환이 중지');
    expect(review.risk).toContain('준비금 자동 확보를 뜻하지 않습니다');
    const issued = issueCustomCurrency(source.state.monetarySystem, 'britain', year, intent.name, intent.symbol, intent.backing, { inflation: source.state.inflation, publicConfidence: source.state.publicConfidence });
    const restored = createEconomicOrderReview(input({ ...source.state, monetarySystem: issued }), { kind: 'restore-currency' })!;
    expect(restored.treasuryDelta).toBe(0);
    expect(restored.details.join(' ')).toContain('역사 자동전환 재개');
    expect(source).toEqual(before);
  });

  it('rejects stale weeks, cash, prices, holdings, quote inputs, ledger and country before any callback', () => {
    const source = input();
    const review = createEconomicOrderReview(source, { kind: 'buy-company', companyId, amount: 50 })!;
    const variants = [
      { ...source, game: { ...game, week: game.week + 1 } },
      { ...source, game: { ...game, treasury: game.treasury - 1 } },
      { ...source, state: { ...source.state, marketPrices: { ...source.state.marketPrices, [companyId]: source.state.marketPrices[companyId] + 1 } } },
      { ...source, state: buyIndustrialStake(source.state, companyId, 25)!.state },
      { ...source, state: { ...source.state, publicConfidence: source.state.publicConfidence - 1 } },
      { ...source, state: { ...source.state, monetarySystem: { ...source.state.monetarySystem, foreignReserves: { usd: 10 } } } },
      { ...source, nationalLedger: { ...nationalLedger, balance: 19 } },
      { ...source, nationId: 'usa' as const },
      { ...source, relations: [{ id: 'usa', name: '미국', code: 'US', value: 0, status: '제재', color: '#000' }] },
    ];
    for (const current of variants) {
      const handlers = callbacks();
      expect(confirmEconomicOrderReview(review, current, handlers, { lastSubmittedFingerprint: null }).status).toBe('stale');
      for (const handler of Object.values(handlers)) expect(handler).not.toHaveBeenCalled();
    }
  });

  it('dispatches a reviewed order once and never treats a void callback as proof of success', () => {
    const source = input(); const handlers = callbacks(); const gate = { lastSubmittedFingerprint: null as string | null };
    const review = createEconomicOrderReview(source, { kind: 'buy-company', companyId, amount: 50 })!;
    const before = structuredClone(source);
    expect(handlers.onBuy).not.toHaveBeenCalled();
    const first = confirmEconomicOrderReview(review, source, handlers, gate);
    expect(first.status).toBe('sent');
    expect(first.message).toContain('주문을 전달했습니다');
    expect(first.message).toContain('거래 기록에서 반영 결과');
    expect(first.message).not.toMatch(/체결 완료|발행 완료|성공했습니다|콜백/);
    expect(handlers.onBuy).toHaveBeenCalledExactlyOnceWith(companyId, 50);
    expect(confirmEconomicOrderReview(review, source, handlers, gate).status).toBe('blocked');
    expect(handlers.onBuy).toHaveBeenCalledTimes(1);
    expect(source).toEqual(before);
  });

  it('blocks insufficient cash, unavailable firms, malformed amounts and unapproved foreign purchases', () => {
    const source = input();
    for (const amount of [0, -1, NaN, Infinity, game.treasury + 1]) expect(createEconomicOrderReview(source, { kind: 'buy-company', companyId, amount })).toBeNull();
    expect(createEconomicOrderReview(source, { kind: 'buy-company', companyId: 'unknown', amount: 50 })).toBeNull();
    expect(createEconomicOrderReview({ ...source, game: { ...game, treasury: NaN } }, { kind: 'buy-company', companyId, amount: 50 })).toBeNull();
    expect(createEconomicOrderReview(source, { kind: 'buy-currency', currencyId: 'rm', amount: 25 })).toBeNull();
    expect(createEconomicOrderReview(source, { kind: 'issue-currency', name: ' ', symbol: 'N', backing: 'continuity' })).toBeNull();
  });

  it('submits each sell, FX and currency-control callback only with its reviewed arguments', () => {
    const initial = input();
    const withCompany = buyIndustrialStake(initial.state, companyId, 100)!.state;
    const metrics = { inflation: withCompany.inflation, publicConfidence: withCompany.publicConfidence };
    const withFx = buyForeignCurrency(withCompany.monetarySystem, 'britain', 'usd', 50, year, game.week, metrics, [])!.state;
    const monetarySystem = issueCustomCurrency(withFx, 'britain', year, '기존 신화폐', 'X', 'continuity', metrics);
    const source = input({ ...withCompany, monetarySystem });
    const cases: Array<{ intent: EconomicOrderIntent; callback: keyof ReturnType<typeof callbacks>; args: unknown[] }> = [
      { intent: { kind: 'sell-company', companyId, ratio: 0.5 }, callback: 'onSell', args: [companyId, 0.5] },
      { intent: { kind: 'buy-currency', currencyId: 'usd', amount: 25 }, callback: 'onBuyCurrency', args: ['usd', 25] },
      { intent: { kind: 'sell-currency', currencyId: 'usd', ratio: 1 }, callback: 'onSellCurrency', args: ['usd', 1] },
      { intent: { kind: 'issue-currency', name: '검토한 화폐', symbol: 'R', backing: 'state-credit' }, callback: 'onIssueCurrency', args: ['검토한 화폐', 'R', 'state-credit'] },
      { intent: { kind: 'restore-currency' }, callback: 'onRestoreHistoricalCurrency', args: [] },
    ];
    for (const entry of cases) {
      const handlers = callbacks();
      const review = createEconomicOrderReview(source, entry.intent)!;
      expect(review).not.toBeNull();
      expect(confirmEconomicOrderReview(review, source, handlers, { lastSubmittedFingerprint: null }).status).toBe('sent');
      expect(handlers[entry.callback]).toHaveBeenCalledExactlyOnceWith(...entry.args);
      expect(Object.values(handlers).reduce((sum, handler) => sum + handler.mock.calls.length, 0)).toBe(1);
    }
  });

  it('retains the engine distinction between blocked FX purchases and costly reserve liquidation', () => {
    const initial = input();
    const monetarySystem = { ...initial.state.monetarySystem, foreignReserves: { usd: 100 } };
    const source = { ...initial, state: { ...initial.state, monetarySystem }, relations: [{ id: 'usa', name: '미국', code: 'US', value: 0, status: '제재', color: '#000' }] };
    expect(createEconomicOrderReview(source, { kind: 'buy-currency', currencyId: 'usd', amount: 25 })).toBeNull();
    const sold = createEconomicOrderReview(source, { kind: 'sell-currency', currencyId: 'usd', ratio: 1 })!;
    expect(sold.treasuryDelta).toBeGreaterThan(0);
    expect(sold.risk).toContain('추가 비용을 적용한 보유 외화 청산');
    const metrics = { inflation: source.state.inflation, publicConfidence: source.state.publicConfidence };
    expect(sold.treasuryDelta).toBe(sellForeignCurrency(monetarySystem, 'britain', 'usd', 1, year, game.week, metrics, source.relations)!.treasuryDelta);
  });

  it('keeps unlisted industrial accounts distinct from ordinary listed shares', () => {
    const source = { ...input(createEconomyState('ussr')), nationId: 'ussr' as const };
    const unlisted = getAvailableCompanies('ussr').find((company) => company.ownership !== 'listed')!;
    const review = createEconomicOrderReview(source, { kind: 'buy-company', companyId: unlisted.id, amount: 25 })!;
    expect(review.risk).toContain('일반 상장주식이 아닌 국가 산업계정·계약 지분');
    expect(review.risk).toContain('국정 배당 자동입금은 미연결');
  });
});
