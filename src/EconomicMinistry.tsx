import { getCampaignYearForWeek } from './campaignCalendar';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Ban, Banknote, Building2, CalendarDays, CheckCircle2, CircleDollarSign, ExternalLink, Info, Landmark, PieChart, RefreshCw, Scale, ShieldAlert, TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import {
  bondPrograms,
  advanceEconomyWeek,
  calculateEconomyLedger,
  getAvailableCompanies,
  getCompanyInvestmentSnapshot,
  getPortfolioMetrics,
  historicalCompanies,
  priceControls,
  taxPolicies,
  buyIndustrialStake,
  sellIndustrialStake,
} from './economy';
import type { BondProgramId, EconomyState, PriceControlId, TaxPolicyId } from './economy';
import { buyForeignCurrency, sellForeignCurrency, issueCustomCurrency, restoreHistoricalCurrency, formatForeignCurrency, formatNationalCurrency, getCurrencyById, getExchangeQuote, getForeignCurrencies, getForeignReserveValue, resolveActiveCurrency } from './currency';
import type { CurrencyBacking } from './currency';
import type { DiplomaticRelation, GameState, NationId } from './types';
import './EconomicMinistry.css';

export interface NationalFiscalLedger {
  week: number;
  revenue: number;
  /** Final expenditure, including additionalIndustryCost exactly once. */
  expenditure: number;
  balance: number;
  additionalIndustryCost: number;
}

export type EconomicMinistryView = 'overview' | 'policy' | 'investments' | 'currency';
export interface EconomicMinistryProps {
  state: EconomyState;
  game: GameState;
  nationId: NationId;
  relations: DiplomaticRelation[];
  staffWeeklyCost: number;
  economyAdvisorBonus: number;
  nationalLedger?: NationalFiscalLedger;
  onOpenNationalBudget?: () => void;
  onTaxPolicy: (policy: TaxPolicyId) => void;
  onBondProgram: (program: BondProgramId) => void;
  onPriceControl: (control: PriceControlId) => void;
  onBuy: (companyId: string, amount: number) => void;
  onSell: (companyId: string, ratio: 0.5 | 1) => void;
  onBuyCurrency: (currencyId: string, amount: number) => void;
  onSellCurrency: (currencyId: string, ratio: 0.5 | 1) => void;
  onIssueCurrency: (name: string, symbol: string, backing: CurrencyBacking) => void;
  onRestoreHistoricalCurrency: () => void;
  initialView?: EconomicMinistryView;
}

export type EconomicOrderIntent =
  | { kind: 'buy-company'; companyId: string; amount: number }
  | { kind: 'sell-company'; companyId: string; ratio: 0.5 | 1 }
  | { kind: 'buy-currency'; currencyId: string; amount: number }
  | { kind: 'sell-currency'; currencyId: string; ratio: 0.5 | 1 }
  | { kind: 'issue-currency'; name: string; symbol: string; backing: CurrencyBacking }
  | { kind: 'restore-currency' };
type EconomicOrderInput = Pick<EconomicMinistryProps, 'state' | 'game' | 'nationId' | 'relations' | 'staffWeeklyCost' | 'economyAdvisorBonus' | 'nationalLedger'>;
type EconomicOrderCallbacks = Pick<EconomicMinistryProps, 'onBuy' | 'onSell' | 'onBuyCurrency' | 'onSellCurrency' | 'onIssueCurrency' | 'onRestoreHistoricalCurrency'>;
export interface EconomicOrderReview { intent: EconomicOrderIntent; fingerprint: string; title: string; treasuryDelta: number; treasuryAfter: number; details: string[]; risk: string; }
const orderFingerprint = (input: EconomicOrderInput, intent: EconomicOrderIntent) => JSON.stringify([input.nationId, input.game, input.state, input.relations, input.staffWeeklyCost, input.economyAdvisorBonus, input.nationalLedger ?? null, intent]);

/** Read-only engine preview. Returned next engine states are deliberately never committed here. */
export function createEconomicOrderReview(input: EconomicOrderInput, intent: EconomicOrderIntent): EconomicOrderReview | null {
  const { state, game, nationId, relations } = input;
  if (!Number.isFinite(game.treasury) || game.treasury < 0 || !Number.isSafeInteger(game.week) || game.week < 0
    || !Number.isFinite(state.inflation) || !Number.isFinite(state.publicConfidence)) return null;
  const year = getCampaignYearForWeek(game.week);
  const metrics = { inflation: state.inflation, publicConfidence: state.publicConfidence };
  let title = ''; let treasuryDelta = 0; let details: string[] = []; let risk = '';
  if (intent.kind === 'buy-company' || intent.kind === 'sell-company') {
    const company = getAvailableCompanies(nationId).find((item) => item.id === intent.companyId);
    if (!company) return null;
    const snapshot = getCompanyInvestmentSnapshot(state, company);
    if (!Number.isFinite(snapshot.price) || snapshot.price <= 0) return null;
    if (intent.kind === 'buy-company') {
      if (!Number.isFinite(intent.amount) || intent.amount < 25 || game.treasury < intent.amount) return null;
      const result = buyIndustrialStake(state, intent.companyId, intent.amount);
      if (!result) return null;
      treasuryDelta = result.treasuryDelta;
      title = `${company.name} 산업지분 매수`;
      details = [`현재 산업지수 ${snapshot.price.toFixed(2)}`, `취득 지분 단위 ${(result.amount / snapshot.price).toFixed(4)} · 기업 한도 내 실제 승인액 기준`];
    } else {
      if (intent.ratio !== 0.5 && intent.ratio !== 1) return null;
      const result = sellIndustrialStake(state, intent.companyId, intent.ratio);
      if (!result) return null;
      treasuryDelta = result.treasuryDelta;
      title = `${company.name} ${intent.ratio === 1 ? '전량' : '절반'} 매각`;
      details = [`현재 산업지수 ${snapshot.price.toFixed(2)}`, '매각 대금은 기존 엔진의 2% 수수료를 이미 반영했습니다.'];
    }
    risk = `${company.riskNote} ${company.ownership === 'listed' ? '가격 변동으로 손실이 날 수 있습니다.' : '일반 상장주식이 아닌 국가 산업계정·계약 지분입니다.'}${input.nationalLedger ? ' 국정 배당 자동입금은 미연결이며 세입에 포함하지 않습니다.' : ''}`;
  } else if (intent.kind === 'buy-currency' || intent.kind === 'sell-currency') {
    const currency = getCurrencyById(intent.currencyId);
    if (!currency) return null;
    if (intent.kind === 'buy-currency' && (!getForeignCurrencies(nationId, year).some((item) => item.id === intent.currencyId) || !Number.isFinite(intent.amount) || intent.amount <= 0 || game.treasury < intent.amount)) return null;
    if (intent.kind === 'sell-currency' && intent.ratio !== 0.5 && intent.ratio !== 1) return null;
    const result = intent.kind === 'buy-currency'
      ? buyForeignCurrency(state.monetarySystem, nationId, intent.currencyId, intent.amount, year, game.week, metrics, relations)
      : sellForeignCurrency(state.monetarySystem, nationId, intent.currencyId, intent.ratio, year, game.week, metrics, relations);
    if (!result) return null;
    if (!Number.isFinite(result.foreignAmount) || result.foreignAmount <= 0 || !Number.isFinite(result.quote.feeRate)) return null;
    treasuryDelta = result.treasuryDelta;
    title = `${currency.name} ${intent.kind === 'buy-currency' ? '매수' : intent.ratio === 1 ? '전량 매도' : '절반 매도'}`;
    details = [`외화 ${intent.kind === 'buy-currency' ? '수령' : '매도'} ${formatForeignCurrency(result.foreignAmount, currency, { exact: true })}`, `승인비용 ${(result.quote.feeRate * 100).toFixed(2)}% · 예상 국고 증감에 이미 반영`];
    risk = `${result.quote.reason} ${result.quote.approved ? '외교관계·물가·통화신뢰가 바뀌면 거래조건도 바뀝니다.' : '매수 거부 상태에서도 기존 엔진은 추가 비용을 적용한 보유 외화 청산을 허용합니다.'}`;
  } else if (intent.kind === 'issue-currency') {
    if (!intent.name.trim() || !intent.symbol.trim() || !['continuity', 'foreign-reserve', 'state-credit'].includes(intent.backing)) return null;
    const next = issueCustomCurrency(state.monetarySystem, nationId, year, intent.name, intent.symbol, intent.backing, metrics);
    const created = next.customCurrency!;
    if (!Number.isFinite(created.unitsPerSterling) || created.unitsPerSterling <= 0) return null;
    title = `${created.symbol} ${created.name} 통화 발행`;
    details = [`발행 후 법정통화 ${created.code}`, `구매력 환산지수 ${created.unitsPerSterling.toLocaleString('ko-KR', { maximumFractionDigits: 6 })}`, '직접 국고 비용 0 · 화폐 이름/기준 변경이며 국고 현금을 새로 만들어 주지 않습니다.'];
    risk = '역사 자동전환이 중지됩니다. 고물가·낮은 신뢰는 환전 비용이나 상대국의 승인 거부에 영향을 줍니다. 외환 태환 원칙은 준비금 자동 확보를 뜻하지 않습니다.';
  } else {
    const next = restoreHistoricalCurrency(state.monetarySystem, nationId, year);
    if (next === state.monetarySystem) return null;
    const currency = resolveActiveCurrency(next, nationId, year);
    title = `${currency.name} 역사 통화로 복귀`;
    details = [`${year}년 역사 기본통화 ${currency.code}`, '직접 국고 비용 0 · 역사 자동전환 재개'];
    risk = '법정통화 표시와 환전 기준이 바뀝니다. 기존 외환보유고를 새로 지급하거나 지우지 않습니다.';
  }
  if (!Number.isFinite(treasuryDelta) || game.treasury + treasuryDelta < 0) return null;
  return { intent: { ...intent }, fingerprint: orderFingerprint(input, intent), title, treasuryDelta, treasuryAfter: game.treasury + treasuryDelta, details, risk };
}

/** The ref-backed gate is claimed before invoking a void callback; no success is inferred. */
export function confirmEconomicOrderReview(review: EconomicOrderReview, input: EconomicOrderInput, callbacks: EconomicOrderCallbacks, gate: { lastSubmittedFingerprint: string | null }): { status: 'sent' | 'stale' | 'blocked'; message: string } {
  if (review.fingerprint !== orderFingerprint(input, review.intent)) return { status: 'stale', message: '검토 이후 주차·국고·가격·보유량 또는 외교 조건이 달라졌습니다. 최신 조건으로 다시 검토하세요.' };
  if (gate.lastSubmittedFingerprint === review.fingerprint || !createEconomicOrderReview(input, review.intent)) return { status: 'blocked', message: '이미 전달한 요청이거나 현재 실행할 수 없는 조건입니다. 실제 잔고·기록을 확인하세요.' };
  gate.lastSubmittedFingerprint = review.fingerprint;
  const intent = review.intent;
  if (intent.kind === 'buy-company') callbacks.onBuy(intent.companyId, intent.amount);
  else if (intent.kind === 'sell-company') callbacks.onSell(intent.companyId, intent.ratio);
  else if (intent.kind === 'buy-currency') callbacks.onBuyCurrency(intent.currencyId, intent.amount);
  else if (intent.kind === 'sell-currency') callbacks.onSellCurrency(intent.currencyId, intent.ratio);
  else if (intent.kind === 'issue-currency') callbacks.onIssueCurrency(intent.name, intent.symbol, intent.backing);
  else callbacks.onRestoreHistoricalCurrency();
  return { status: 'sent', message: '주문을 전달했습니다. 상단 국고와 거래 기록에서 반영 결과를 확인하세요.' };
}

const ownershipLabels = {
  listed: '상장 지분',
  'state-combine': '국가 산업계정',
  'resistance-fund': '비밀 산업기금',
  'private-contract': '계약 참여지분',
};

const sectorLabels = {
  aircraft: '항공',
  vehicles: '차량',
  shipbuilding: '조선',
  steel: '철강',
  chemicals: '화학',
  electrical: '전기·통신',
  transport: '수송',
  consumer: '민생산업',
};

export function EconomicMinistry({
  state,
  game,
  nationId,
  relations,
  staffWeeklyCost,
  economyAdvisorBonus,
  nationalLedger,
  onOpenNationalBudget,
  onTaxPolicy,
  onBondProgram,
  onPriceControl,
  onBuy,
  onSell,
  onBuyCurrency,
  onSellCurrency,
  onIssueCurrency,
  onRestoreHistoricalCurrency,
  initialView = 'overview',
}: EconomicMinistryProps) {
  const [view, setView] = useState<EconomicMinistryView>(initialView);
  const [companyId, setCompanyId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [review, setReview] = useState<EconomicOrderReview | null>(null);
  const [orderMessage, setOrderMessage] = useState('');
  const reviewRef = useRef<HTMLElement | null>(null);
  // Focus the newly rendered review, not a trading action; no order runs in an effect.
  useEffect(() => { if (review) reviewRef.current?.focus(); }, [review]);
  const submissionGate = useRef<{ lastSubmittedFingerprint: string | null }>({ lastSubmittedFingerprint: null });
  const viewId = useId();
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);
  const [currencyName, setCurrencyName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [currencyBacking, setCurrencyBacking] = useState<CurrencyBacking>('continuity');
  const currentYear = getCampaignYearForWeek(game.week);
  const currencyMetrics = { inflation: state.inflation, publicConfidence: state.publicConfidence };
  const activeCurrency = resolveActiveCurrency(state.monetarySystem, nationId, currentYear);
  const historicalMode = state.monetarySystem.historicalAutoTransition;
  const money = (value: number) => formatNationalCurrency(value, state.monetarySystem, nationId, currentYear, currencyMetrics, { signed: true });
  const plainMoney = (value: number) => formatNationalCurrency(Math.abs(value), state.monetarySystem, nationId, currentYear, currencyMetrics);
  const exactMoney = (value: number) => formatNationalCurrency(value, state.monetarySystem, nationId, currentYear, currencyMetrics, { exact: true });
  const foreignCurrencies = getForeignCurrencies(nationId, currentYear);
  const reserveValue = getForeignReserveValue(state.monetarySystem);
  const context = { week: game.week + 1, nationId, game, staffWeeklyCost, economyAdvisorBonus };
  const orderInput = { state, game, nationId, relations, staffWeeklyCost, economyAdvisorBonus, nationalLedger };
  const reviewStale = Boolean(review && review.fingerprint !== orderFingerprint(orderInput, review.intent));
  const reviewOrder = (intent: EconomicOrderIntent) => {
    const next = createEconomicOrderReview(orderInput, intent);
    setReview(next);
    setOrderMessage(next ? '아직 실행하지 않았습니다. 지출·잔고·위험을 확인한 뒤 명시적으로 확정하세요.' : '현재 조건에서는 검토할 수 없습니다. 국고·보유량·투자한도·환전 승인을 확인하세요.');
  };
  const confirmOrder = () => {
    if (!review) return;
    const result = confirmEconomicOrderReview(review, orderInput, { onBuy, onSell, onBuyCurrency, onSellCurrency, onIssueCurrency, onRestoreHistoricalCurrency }, submissionGate.current);
    setOrderMessage(result.message);
    if (result.status === 'sent') setReview(null);
  };
  const ledger = calculateEconomyLedger(state, context);
  const fiscalOverview = nationalLedger
    ? { revenue: nationalLedger.revenue, expenditure: nationalLedger.expenditure, balance: nationalLedger.balance, label: `제${nationalLedger.week + 1}주 국정 실제 계산 전망` }
    : { revenue: ledger.operatingRevenue, expenditure: ledger.totalExpenses, balance: ledger.netTreasuryChange, label: '다음 주 전시 재정 전망' };
  const nationalBaseExpenditure = nationalLedger ? Math.max(0, nationalLedger.expenditure - nationalLedger.additionalIndustryCost) : 0;
  const portfolio = getPortfolioMetrics(state);
  const companies = getAvailableCompanies(nationId);
  const operatingBalance = ledger.operatingRevenue - ledger.totalExpenses;
  const debtRate = bondPrograms.find((program) => program.id === state.bondProgram)?.effect ?? '';
  const weeklyDividend = ledger.revenues.find((line) => line.id === 'dividend')?.amount ?? 0;
  const investmentExposure = portfolio.value + game.treasury > 0 ? Math.round((portfolio.value / (portfolio.value + game.treasury)) * 100) : 0;
  const companySnapshots = companies
    .map((company) => ({ company, snapshot: getCompanyInvestmentSnapshot(state, company) }))
    .sort((left, right) => Number(Boolean(right.snapshot.holding)) - Number(Boolean(left.snapshot.holding)) || right.snapshot.weeklyChange - left.snapshot.weeklyChange || left.company.name.localeCompare(right.company.name, 'ko'));
  const selectedCompany = companySnapshots.find((entry) => entry.company.id === companyId) ?? companySnapshots[0];
  const selectedCurrency = foreignCurrencies.find((currency) => currency.id === currencyId) ?? foreignCurrencies[0];
  const policyForecast = (change: Partial<Pick<EconomyState, 'taxPolicy' | 'bondProgram' | 'priceControl'>>) => {
    const preview = advanceEconomyWeek({ ...state, ...change }, context);
    const previewOperatingBalance = preview.ledger.operatingRevenue - preview.ledger.totalExpenses;
    return `국고 ${money(preview.ledger.netTreasuryChange)} · 경상 ${money(previewOperatingBalance)} · 물가 ${state.inflation.toFixed(1)}→${preview.state.inflation.toFixed(1)}% · 신뢰 ${state.publicConfidence.toFixed(0)}→${preview.state.publicConfidence.toFixed(0)}`;
  };

  return (
    <section className="economy-ministry economy-design-v2">
      <header className="economy-hero">
        <div><span>{nationalLedger ? 'NATIONAL FINANCE & INDUSTRIAL CAPITAL' : 'WAR FINANCE & INDUSTRIAL CAPITAL'}</span><h2>{nationalLedger ? '국정 재무성' : '전시 재무성'}</h2><p>{nationalLedger ? '국정의 실제 주간 계산 전망과 산업지분·외환 운용을 함께 확인합니다. 조세·지출 배분은 국가 운영 예산에서 조정합니다.' : '세입, 차입, 지출과 산업지분을 분리해 다음 주 현금과 장기 부담을 함께 판단합니다.'}</p></div>
        <div className="economy-hero-balance"><small>현재 {nationalLedger ? '국정' : '전시'} 재정 · {activeCurrency.code}</small><strong>{plainMoney(game.treasury)}</strong><em>{exactMoney(game.treasury)} · {activeCurrency.name}</em><span className={fiscalOverview.balance >= 0 ? 'good' : 'bad'}>{fiscalOverview.label} {money(fiscalOverview.balance)}</span></div>
      </header>

      <nav className="economy-subviews" aria-label="재무성 업무 선택">{([['overview', '재정 요약'], ['policy', '재정 정책'], ['investments', '기업 투자'], ['currency', '외환·통화']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} aria-controls={`${viewId}-content`} onClick={() => { setView(id); setReview(null); setOrderMessage(''); }}>{label}</button>)}</nav>
      {review ? <section className="economy-order-review" aria-label="금융 주문 검토" tabIndex={-1} ref={reviewRef}>
        <div className="economy-section-heading"><div><small>REVIEW / 아직 미실행</small><h3>{review.title}</h3></div></div>
        <dl><div><dt>예상 국고 증감</dt><dd>{money(review.treasuryDelta)}</dd></div><div><dt>실행 직후 예상 잔고</dt><dd>{plainMoney(review.treasuryAfter)}</dd></div></dl>
        <ul>{review.details.map((detail) => <li key={detail}>{detail}</li>)}</ul><p className="economy-order-risk"><ShieldAlert size={18} aria-hidden="true" />{review.risk}</p>
        <p>예상치는 기존 엔진 계산입니다. 이 화면에서 지출을 차감하거나 자산을 지급하지 않습니다. 다음 주 세입·지출도 아직 반영하지 않은 주문 직후 잔고입니다.</p>
        {reviewStale ? <p role="alert">검토 이후 외부 상태가 변경됐습니다. 오래된 조건으로 확정할 수 없습니다.</p> : null}
        <div className="economy-order-actions"><button type="button" className="economy-primary" disabled={reviewStale} onClick={confirmOrder}>검토한 주문 명시적 확정</button>{reviewStale ? <button type="button" onClick={() => reviewOrder(review.intent)}>최신 조건으로 재검토</button> : null}<button type="button" onClick={() => { setReview(null); setOrderMessage('주문 검토를 취소했습니다. 실행 요청은 보내지 않았습니다.'); }}>검토 취소</button></div>
      </section> : null}
      <p className="economy-order-message" role="status" aria-live="polite">{orderMessage || '기업·외환 주문과 통화 변경은 검토 후 확정합니다. 화면 열람만으로 실행되지 않습니다.'}</p>
      <div id={`${viewId}-content`}>
      {view === 'overview' ? <><div className="economy-kpis">
        {nationalLedger ? <>
          <article><CircleDollarSign size={19} /><small>국정 주간 수지</small><strong className={fiscalOverview.balance >= 0 ? 'good' : 'bad'}>{money(fiscalOverview.balance)}</strong><span>세입 {plainMoney(fiscalOverview.revenue)} − 총지출 {plainMoney(fiscalOverview.expenditure)}</span></article>
          <article><WalletCards size={19} /><small>기존 국정 지출</small><strong>{plainMoney(nationalBaseExpenditure)}</strong><span>기존 치안 예산의 군수 집행 몫 포함 · 재차 차감 없음</span></article>
          <article><CalendarDays size={19} /><small>추가 군수 지출</small><strong>{plainMoney(nationalLedger.additionalIndustryCost)}</strong><span>총지출에 이미 1회 포함 · 별도 중복 차감 없음</span></article>
        </> : <>
        <article><CircleDollarSign size={19} /><small>실질 경상수지</small><strong className={operatingBalance >= 0 ? 'good' : 'bad'}>{money(operatingBalance)}</strong><span>세입 {plainMoney(ledger.operatingRevenue)} − 지출 {plainMoney(ledger.totalExpenses)}</span></article>
        <article><WalletCards size={19} /><small>차입 포함 주간 증감</small><strong className={ledger.netTreasuryChange >= 0 ? 'good' : 'bad'}>{money(ledger.netTreasuryChange)}</strong><span>국채 조달 {money(ledger.financingRaised)}</span></article>
        <article><CalendarDays size={19} /><small>한 달 예상</small><strong className={ledger.monthlyProjection >= 0 ? 'good' : 'bad'}>{money(ledger.monthlyProjection)}</strong><span>1개월 = 평균 4.345주 · 현재 정책 유지</span></article>
        </>}
        <article><Landmark size={19} /><small>국가부채·물가</small><strong>{plainMoney(state.debt)}</strong><span>인플레이션 {state.inflation.toFixed(1)}% · 신뢰 {state.publicConfidence.toFixed(0)}/100</span></article>
      </div>

      <section className="economy-next-action" aria-label="이번 주 재정 검토"><div><small>THIS WEEK / 판단할 일</small><h3>{fiscalOverview.balance < 0 ? '다음 주 적자를 먼저 검토하십시오' : '현금흐름을 확인한 뒤 운용을 결정하십시오'}</h3><p>{fiscalOverview.balance < 0 ? `현재 정책의 주간 부족액은 ${plainMoney(fiscalOverview.balance)}입니다. 투자 수익이나 신규 차입을 확정 세입으로 간주하지 않습니다.` : '지출 계획과 가용 국고를 비교합니다. 투자와 외환은 선택 사항이며 자동 매수 권고가 아닙니다.'}</p></div><div><button type="button" onClick={() => setView('policy')}>{nationalLedger ? '국정 예산 조정 경로 검토' : '세입·차입 정책 검토'}</button>{state.holdings.length > 0 ? <button type="button" onClick={() => setView('investments')}>보유 산업지분·매각 조건 검토</button> : null}{reserveValue > 0 ? <button type="button" onClick={() => setView('currency')}>보유 외환·회수 조건 검토</button> : null}</div></section></> : null}
      {view === 'currency' ? <section className="economy-currency-panel">
        <div className="economy-section-heading">
          <div><small>CENTRAL BANK & FOREIGN EXCHANGE</small><h3>통화·외환</h3><p>국고는 현재 국가와 연도의 통화로 표시됩니다. 다른 통화는 외교관계·전시통제·물가·신뢰에 따라 승인되거나 거부됩니다.</p></div>
          <span><small>외환보유고 가치</small><b>{plainMoney(reserveValue)}</b><em>{Object.keys(state.monetarySystem.foreignReserves).length}개 통화</em></span>
        </div>
        <div className="economy-currency-command">
          <article className="economy-active-currency">
            <i><Banknote size={22} /></i>
            <span><small>{currentYear}년 법정통화</small><strong>{activeCurrency.symbol} {activeCurrency.name}</strong><em>{activeCurrency.code} · {activeCurrency.issuer}</em></span>
            <div><b className={historicalMode ? 'historical' : 'custom'}>{historicalMode ? '역사 자동전환' : '대체역사 통화'}</b><small>구매력 환산지수 {activeCurrency.unitsPerSterling.toLocaleString('ko-KR', { maximumFractionDigits: 3 })}</small></div>
          </article>
          <div className="economy-currency-actions">
            <button onClick={() => setShowCurrencyForm((value) => !value)}><Banknote size={13} /> 새 화폐 발행</button>
            <button disabled={historicalMode && activeCurrency.id !== state.monetarySystem.customCurrency?.id} onClick={() => reviewOrder({ kind: 'restore-currency' })}><RefreshCw size={13} /> 역사 연표로 복귀 검토</button>
          </div>
          <details className="economy-currency-history">
            <summary>화폐의 역사적 근거와 전환 기록</summary>
            <p>{activeCurrency.historicalNote}</p>
            {activeCurrency.sourceUrl && <a href={activeCurrency.sourceUrl} target="_blank" rel="noreferrer">사료: {activeCurrency.sourceTitle}<ExternalLink size={11} /></a>}
            {state.monetarySystem.transitionHistory.slice(0, 4).map((transition) => <div key={transition.id}><b>{transition.year}</b><span>{transition.note}</span></div>)}
          </details>
        </div>

        {showCurrencyForm && (
          <form className="economy-currency-form" onSubmit={(event) => { event.preventDefault(); reviewOrder({ kind: 'issue-currency', name: currencyName, symbol: currencySymbol, backing: currencyBacking }); }}>
            <label><small>새 화폐 이름</small><input name="currency-name" value={currencyName} onChange={(event) => { setCurrencyName(event.target.value); setReview(null); }} maxLength={24} placeholder="예: 자유원, 태평양 크라운" required /></label>
            <label><small>기호</small><input name="currency-symbol" value={currencySymbol} onChange={(event) => { setCurrencySymbol(event.target.value); setReview(null); }} maxLength={4} placeholder="예: F₩" required /></label>
            <label><small>발행 원칙</small><select name="currency-backing" value={currencyBacking} onChange={(event) => { setCurrencyBacking(event.target.value as CurrencyBacking); setReview(null); }}><option value="continuity">구 화폐 구매력 승계</option><option value="foreign-reserve">외환보유고 태환</option><option value="state-credit">국가신용·관리변동</option></select></label>
            <button type="submit">통화 발행 조건 검토</button>
            <p><Info size={12} /> 새 통화는 자동 역사전환을 중지합니다. 신뢰가 낮거나 물가가 높으면 명목환율과 환전 수수료가 불리해지고 상대국이 태환을 거부할 수 있습니다.</p>
          </form>
        )}

        <div className="economy-fx-guide"><ArrowLeftRight size={14} /><strong>환전 방법</strong><span>외화를 사면 국고가 줄고 외환보유고가 늘어납니다.</span><span>환율에는 승인은행 비용이 포함됩니다.</span><span>적성·폐쇄 통화는 거래를 거부할 수 있습니다.</span></div>
        <label className="economy-asset-picker">검토할 외화<select value={selectedCurrency?.id ?? ''} onChange={(event) => { setCurrencyId(event.target.value); setReview(null); }}>{foreignCurrencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} · {currency.name}{state.monetarySystem.foreignReserves[currency.id] > 0 ? ' · 보유 중' : ''}</option>)}</select></label>
        <div className="economy-fx-list">
          {(selectedCurrency ? [selectedCurrency] : []).map((currency) => {
            const quote = getExchangeQuote(state.monetarySystem, nationId, currency.id, currentYear, currencyMetrics, relations);
            if (!quote) return null;
            const reserve = state.monetarySystem.foreignReserves[currency.id] ?? 0;
            return (
              <article className={quote.approved ? 'approved' : 'refused'} key={currency.id}>
                <header><i>{currency.symbol}</i><span><small>{currency.code} · {currency.issuer}</small><strong>{currency.name}</strong></span><b>{quote.approved ? <><CheckCircle2 size={11} /> 환전 가능</> : <><Ban size={11} /> 거래 거부</>}</b></header>
                <div className="economy-fx-rate"><span><small>양방향 교차환율</small><strong>1 {currency.code} = {quote.domesticPerForeign.toLocaleString('ko-KR', { maximumFractionDigits: quote.domesticPerForeign < 0.1 ? 4 : 2 })} {activeCurrency.code}</strong><em>1 {activeCurrency.code} = {quote.foreignPerDomestic.toLocaleString('ko-KR', { maximumFractionDigits: quote.foreignPerDomestic < 0.1 ? 4 : 2 })} {currency.code}</em></span><span><small>승인비용</small><b>{(quote.feeRate * 100).toFixed(1)}%</b></span></div>
                <p>{quote.reason}</p>
                <div className="economy-fx-reserve"><span><small>보유액 · 현재 국내가치</small><strong>{reserve > 0 ? formatForeignCurrency(reserve, currency) : '없음'}</strong>{reserve > 0 && <em>{plainMoney(reserve / currency.unitsPerSterling)}</em>}</span>{reserve > 0 && <div><button onClick={() => reviewOrder({ kind: 'sell-currency', currencyId: currency.id, ratio: 0.5 })}>절반 매도 검토</button><button onClick={() => reviewOrder({ kind: 'sell-currency', currencyId: currency.id, ratio: 1 })}>전량 매도 검토</button></div>}</div>
                <div className="economy-fx-buy">{[10, 25, 50].map((amount) => { const expectedForeign = buyForeignCurrency(state.monetarySystem, nationId, currency.id, amount, currentYear, game.week, currencyMetrics, relations)?.foreignAmount ?? 0; return <button disabled={!quote.approved || game.treasury < amount} title={!quote.approved ? quote.reason : `${plainMoney(amount)} 지급 · ${formatForeignCurrency(expectedForeign, currency)} 예상 수령`} onClick={() => reviewOrder({ kind: 'buy-currency', currencyId: currency.id, amount })} key={amount}><span>{plainMoney(amount)} 매수 검토</span><em>→ {formatForeignCurrency(expectedForeign, currency)}</em></button>; })}</div>
              </article>
            );
          })}
        </div>
        {state.monetarySystem.exchangeHistory.length > 0 && <details className="economy-fx-history"><summary>최근 환전 체결 {state.monetarySystem.exchangeHistory.length}건</summary><div>{state.monetarySystem.exchangeHistory.slice(0, 6).map((record) => { const currency = getCurrencyById(record.currencyId); return currency ? <p key={record.id}><span>제 {record.week + 1}주 · {record.side === 'buy' ? '외화 매수' : '외화 매도'}</span><strong>{currency.code} {formatForeignCurrency(record.foreignAmount, currency, { exact: true })}</strong><em>비용 {(record.feeRate * 100).toFixed(1)}%</em></p> : null; })}</div></details>}
      </section> : null}

      {view === 'overview' || view === 'policy' ? <div className="economy-grid">
        {view === 'overview' ? <section className="economy-ledger-panel">
          <div className="economy-section-heading"><div><small>WEEKLY CASH FLOW</small><h3>{nationalLedger ? fiscalOverview.label : '다음 주 재정은 어디서 오는가'}</h3></div><span>예상 순증감 <b className={fiscalOverview.balance >= 0 ? 'good' : 'bad'}>{money(fiscalOverview.balance)}</b></span></div>
          {nationalLedger ? <>
            <div className="economy-ledger-group revenue"><h4><ArrowUpRight size={14} /> 국정 세입 합계 <em>{money(fiscalOverview.revenue)}</em></h4><div><span><strong>산업·조세·무역 등 국정 세입</strong><small>국가 운영의 주간 결산과 동일한 계산 결과입니다.</small></span><b>{money(fiscalOverview.revenue)}</b></div></div>
            <div className="economy-ledger-group expense"><h4><ArrowDownRight size={14} /> 국정 지출 합계 <em>−{plainMoney(fiscalOverview.expenditure)}</em></h4><div><span><strong>기존 공공지출·부채·보건 등</strong><small>군수 집행에 배분한 기존 치안 예산도 이 안에 포함됩니다.</small></span><b>−{plainMoney(nationalBaseExpenditure)}</b></div><div><span><strong>추가 승인 군수 비용</strong><small>기존 예산을 넘겨 실제로 집행하는 추가분만 총지출에 한 번 포함합니다.</small></span><b>−{plainMoney(nationalLedger.additionalIndustryCost)}</b></div></div>
            <div className="economy-ledger-total"><span><small>국정 계산식 · 추가 군수비는 총지출에 포함</small><strong>{plainMoney(fiscalOverview.revenue)} 세입 − {plainMoney(fiscalOverview.expenditure)} 총지출</strong></span><b>{money(fiscalOverview.balance)}</b></div>
          </> : <>
          <div className="economy-ledger-group revenue"><h4><ArrowUpRight size={14} /> 세입 — 갚지 않아도 되는 돈 <em>{money(ledger.operatingRevenue)}</em></h4>{ledger.revenues.map((line) => <div key={line.id}><span><strong>{line.label}</strong><small>{line.explanation}</small></span><b>{money(line.amount)}</b></div>)}</div>
          <div className="economy-ledger-group financing"><h4><WalletCards size={14} /> 차입 — 지금 들어오지만 부채가 되는 돈 <em>{money(ledger.financingRaised)}</em></h4>{ledger.financing.length ? ledger.financing.map((line) => <div key={line.id}><span><strong>{line.label}</strong><small>{line.explanation}</small></span><b>{money(line.amount)}</b></div>) : <div><span><strong>신규 차입 없음</strong><small>세입 안에서만 지출합니다.</small></span><b>{plainMoney(0)}</b></div>}</div>
          <div className="economy-ledger-group expense"><h4><ArrowDownRight size={14} /> 지출 — 이번 주 빠져나가는 돈 <em>−{plainMoney(ledger.totalExpenses)}</em></h4>{ledger.expenses.map((line) => <div key={line.id}><span><strong>{line.label}</strong><small>{line.explanation}</small></span><b>−{plainMoney(line.amount)}</b></div>)}</div>
          <div className="economy-ledger-total"><span><small>계산식</small><strong>{plainMoney(ledger.operatingRevenue)} 세입 + {plainMoney(ledger.financingRaised)} 차입 − {plainMoney(ledger.totalExpenses)} 지출</strong></span><b>{money(ledger.netTreasuryChange)}</b></div>
          </>}
        </section> : null}

        {view === 'policy' ? <aside className="economy-policy-panel">
          {nationalLedger ? <>
            <div className="economy-section-heading"><div><small>NATIONAL BUDGET</small><h3>국정 예산에서 조정</h3></div></div>
            <div className="economy-policy-verification"><CalendarDays size={14} /><span><strong>국정 실제 계산 전망</strong><small>제{nationalLedger.week + 1}주 세입·지출·수지는 국가 운영 예산과 군수 결산을 기준으로 갱신됩니다.</small></span></div>
            <div className="economy-policy-warning"><Info size={15} /><span><strong>전시 정책을 국정 장부에 중복 적용하지 않습니다.</strong><small>전시 세금·국채·가격통제 선택 대신 국가 운영에서 조세 부담, 공공지출, 치안·산업 예산을 권한에 맞게 조정하십시오. 주식·외환 매매와 통화 관리는 이 화면에서 계속 사용할 수 있습니다.</small></span></div>
            {onOpenNationalBudget ? <button type="button" className="economy-deep-link" onClick={onOpenNationalBudget}><Landmark size={14} /> 국가 운영 예산 열기</button> : <p>국가 운영 화면의 세입·지출 조정에서 예산을 변경할 수 있습니다.</p>}
          </> : <>
          <div className="economy-section-heading"><div><small>FISCAL CABINET</small><h3>어떻게 재정을 당길 것인가</h3></div></div>
          <div className="economy-policy-verification"><CalendarDays size={14} /><span><strong>선택 즉시 전망 갱신</strong><small>실제 국고·부채·물가 변화는 제 {context.week + 1}주 통합 주간 브리핑에서 확인합니다.</small></span></div>
          <PolicySelector title="조세 정책" value={state.taxPolicy} options={taxPolicies} forecast={(id) => policyForecast({ taxPolicy: id })} onChange={(id) => onTaxPolicy(id as TaxPolicyId)} />
          <PolicySelector title="국채·신용 조달" value={state.bondProgram} options={bondPrograms} forecast={(id) => policyForecast({ bondProgram: id })} onChange={(id) => onBondProgram(id as BondProgramId)} />
          <PolicySelector title="물가·배급 통제" value={state.priceControl} options={priceControls} forecast={(id) => policyForecast({ priceControl: id })} onChange={(id) => onPriceControl(id as PriceControlId)} />
          <div className="economy-policy-warning"><ShieldAlert size={15} /><span><strong>부채는 수입이 아닙니다.</strong><small>{debtRate}. 중앙은행 인수는 빠르지만 물가와 신뢰를 훼손하며, 저축채권도 매주 이자비용을 남깁니다.</small></span></div>
          </>}
        </aside> : null}
      </div> : null}

      {view === 'investments' ? <><section className="economy-market-panel">
        <div className="economy-section-heading"><div><small>HISTORICAL INDUSTRIAL MARKET</small><h3>산업 투자</h3><p>{nationalLedger ? '기업 지분 매수·매각과 주간 평가가격 변동을 관리합니다. 배당 추정액의 국정 자동입금은 아직 연결되지 않았으므로 위 국정 세입에 포함하지 않습니다.' : '회사를 고르고 투자하면 매주 배당과 가격 변동이 국고에 반영됩니다.'} 실제 개인 주식시장이 아니라 국가 재무성의 산업지분 운용입니다.</p></div><span><small>현재 보유자산</small><b>{plainMoney(portfolio.value)}</b><em className={portfolio.unrealizedGain >= 0 ? 'good' : 'bad'}>{money(portfolio.unrealizedGain)} · {portfolio.returnRate >= 0 ? '+' : ''}{portfolio.returnRate.toFixed(1)}%</em></span></div>
        <div className="economy-investment-summary">
          <article><WalletCards size={16} /><span><small>지금 투자할 수 있는 돈</small><strong>{plainMoney(game.treasury)}</strong></span></article>
          <article><PieChart size={16} /><span><small>투자한 원금</small><strong>{plainMoney(portfolio.invested)}</strong><em>전체 자산 중 {investmentExposure}%</em></span></article>
          <article className={portfolio.unrealizedGain >= 0 ? 'good' : 'bad'}>{portfolio.unrealizedGain >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}<span><small>아직 팔지 않은 손익</small><strong>{money(portfolio.unrealizedGain)}</strong><em>매각 시 수수료 2%</em></span></article>
          <article><CircleDollarSign size={16} /><span><small>{nationalLedger ? '주간 환산 배당 참고값' : '이번 주 예상 배당'}</small><strong>{money(weeklyDividend)}</strong><em>{nationalLedger ? '국정 자동입금 미연결 · 세입 미포함' : '주간 재정 세입에 포함'}</em></span></article>
        </div>
        <div className="economy-investment-guide"><Info size={14} /><strong>주문 순서</strong><span><b>1</b> 기업·금액 선택</span><i>→</i><span><b>2</b> 지출·잔고·위험 검토</span><i>→</i><span><b>3</b> 명시적 확정</span><i>→</i><span><b>4</b> 실제 잔고·기록 확인</span></div>
        <label className="economy-asset-picker">검토할 기업<select value={selectedCompany?.company.id ?? ''} onChange={(event) => { setCompanyId(event.target.value); setReview(null); }}>{companySnapshots.map(({ company, snapshot }) => <option key={company.id} value={company.id}>{company.name} · {sectorLabels[company.sector]}{snapshot.holding ? ' · 보유 중' : ''}</option>)}</select></label>
        <div className="economy-company-list">
          <div className="economy-company-list-head"><span>기업</span><span>이번 주 가격</span><span>위험·배당</span><span>내 보유 현황</span><span>투자 행동</span></div>
          {(selectedCompany ? [selectedCompany] : []).map(({ company, snapshot }) => {
            const { holding } = snapshot;
            const changeTone = snapshot.weeklyChange > 0.05 ? 'good' : snapshot.weeklyChange < -0.05 ? 'bad' : 'flat';
            const minimumBuyDisabled = game.treasury < 25 || snapshot.availableCapacity < 25;
            return (
              <article className={`economy-company-row ${holding ? 'owned' : ''}`} key={company.id}>
                <div className="economy-company-identity"><i><Building2 size={16} /></i><span><small>{company.country} · {sectorLabels[company.sector]}</small><strong>{company.name}</strong><em>{ownershipLabels[company.ownership]}{holding ? ' · 보유 중' : ''}</em></span></div>
                <div className="economy-company-price"><small>산업지수</small><strong>{snapshot.price.toFixed(1)}</strong><em className={changeTone}>{snapshot.weeklyChange > 0 ? <TrendingUp size={11} /> : snapshot.weeklyChange < 0 ? <TrendingDown size={11} /> : <Scale size={11} />}{snapshot.weeklyChange > 0 ? '+' : ''}{snapshot.weeklyChange.toFixed(1)}% <b>{changeTone === 'good' ? '상승' : changeTone === 'bad' ? '하락' : '보합'}</b></em></div>
                <div className="economy-company-profile"><span><small>위험</small><b className={`risk-${snapshot.riskLevel}`}>{[1, 2, 3].map((level) => <i className={level <= snapshot.riskLevel ? 'filled' : ''} key={level} />)}{snapshot.riskLevel === 1 ? '낮음' : snapshot.riskLevel === 2 ? '보통' : '높음'}</b></span><span><small>{plainMoney(50)} 투자 시 연 배당</small><strong>{snapshot.previewAnnualDividend > 0 ? money(snapshot.previewAnnualDividend) : '배당 없음'}</strong></span></div>
                <div className="economy-company-holding">{holding ? <><span><small>현재 가치</small><strong>{plainMoney(snapshot.holdingValue)}</strong></span><span><small>내 손익</small><b className={snapshot.holdingGain >= 0 ? 'good' : 'bad'}>{money(snapshot.holdingGain)} · {snapshot.holdingReturnRate >= 0 ? '+' : ''}{snapshot.holdingReturnRate.toFixed(1)}%</b></span><em>{nationalLedger ? '참고 주 배당' : '주 배당'} {money(snapshot.holdingWeeklyDividend)}</em></> : <><strong>아직 투자하지 않음</strong><small>최소 {plainMoney(25)}부터 매수</small></>}</div>
                <div className="economy-company-actions"><small>{minimumBuyDisabled ? game.treasury < 25 ? `국고 ${plainMoney(25)} 필요` : '투자 한도 도달' : `추가 한도 ${plainMoney(snapshot.availableCapacity)}`}</small><div>{[25, 50, 100].map((amount) => <button key={amount} title={game.treasury < amount ? `국고가 ${plainMoney(amount)}보다 적습니다.` : snapshot.availableCapacity < amount ? `남은 투자 한도는 ${plainMoney(snapshot.availableCapacity)}입니다.` : `${company.name}에 ${plainMoney(amount)} 투자`} disabled={game.treasury < amount || snapshot.availableCapacity < amount} onClick={() => reviewOrder({ kind: 'buy-company', companyId: company.id, amount })}>{plainMoney(amount)} <b>매수 검토</b></button>)}</div>{holding && <div className="sell-actions"><button className="sell" onClick={() => reviewOrder({ kind: 'sell-company', companyId: company.id, ratio: 0.5 })}>절반 매각 검토</button><button className="sell" onClick={() => reviewOrder({ kind: 'sell-company', companyId: company.id, ratio: 1 })}>전량 매각 검토</button></div>}</div>
                <details className="economy-company-details"><summary>가격 변동 요인·역사적 위험 보기</summary><div><p><strong>산업 기반</strong>{company.historicalBasis}</p><p><strong>손실 위험</strong>{company.riskNote}</p><a href={company.sourceUrl} target="_blank" rel="noreferrer">사료: {company.sourceTitle}<ExternalLink size={11} /></a></div></details>
              </article>
            );
          })}
        </div>
      </section>

      <section className="economy-event-panel">
        <div className="economy-section-heading"><div><small>MONTHLY ECONOMIC DISPATCHES</small><h3>경제 사건과 시장 결과</h3></div><span>4주마다 기업계약·원가·수송·국채 사건 판정</span></div>
        {nationalLedger && <p>국정 단계에서는 이 시장 사건의 가격 변동만 적용합니다. 재정·신뢰 효과는 전시 참고값이며 국정 장부에 다시 더하지 않습니다.</p>}
        {state.eventHistory.length ? <div>{state.eventHistory.slice(0, 8).map((event) => {
          const company = event.companyId ? historicalCompanies.find((item) => item.id === event.companyId) : null;
          return <article className={event.tone} key={event.id}><i>{event.tone === 'good' ? <TrendingUp size={15} /> : event.tone === 'bad' ? <TrendingDown size={15} /> : <Scale size={15} />}</i><span><small>{company?.name ?? '국가 금융시장'}</small><strong>{event.title}</strong><p>{event.detail}</p></span><div><em>가격 {event.priceImpact >= 0 ? '+' : ''}{(event.priceImpact * 100).toFixed(1)}%</em><em>{nationalLedger ? '전시 참고 재정' : '재정'} {money(event.treasuryImpact)}</em><em>{nationalLedger ? '전시 참고 신뢰' : '신뢰'} {event.confidenceImpact >= 0 ? '+' : ''}{event.confidenceImpact}</em></div></article>;
        })}</div> : <div className="economy-event-empty"><Landmark size={22} /><strong>아직 확정된 월간 경제 사건이 없습니다.</strong><span>제4주부터 조달계약·공습·원가·국채시장 사건이 기록됩니다.</span></div>}
      </section></> : null}
      </div>
    </section>
  );
}

function PolicySelector<T extends string>({ title, value, options, forecast, onChange }: { title: string; value: T; options: Array<{ id: T; name: string; summary: string; effect: string }>; forecast: (id: T) => string; onChange: (id: T) => void }) {
  return (
    <fieldset className="economy-policy-selector">
      <legend>{title}</legend>
      {options.map((option) => <button type="button" className={value === option.id ? 'active' : ''} aria-pressed={value === option.id} key={option.id} onClick={() => onChange(option.id)}><span><strong>{option.name}</strong><small>{option.summary}</small></span><em>{option.effect}</em><b className="economy-policy-forecast"><small>다음 주 예상</small>{forecast(option.id)}</b></button>)}
    </fieldset>
  );
}
