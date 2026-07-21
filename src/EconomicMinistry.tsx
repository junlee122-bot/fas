import { useState } from 'react';
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
} from './economy';
import type { BondProgramId, EconomyState, PriceControlId, TaxPolicyId } from './economy';
import { formatForeignCurrency, formatNationalCurrency, getCurrencyById, getExchangeQuote, getForeignCurrencies, getForeignReserveValue, resolveActiveCurrency } from './currency';
import type { CurrencyBacking } from './currency';
import type { DiplomaticRelation, GameState, NationId } from './types';

interface EconomicMinistryProps {
  state: EconomyState;
  game: GameState;
  nationId: NationId;
  relations: DiplomaticRelation[];
  staffWeeklyCost: number;
  economyAdvisorBonus: number;
  onTaxPolicy: (policy: TaxPolicyId) => void;
  onBondProgram: (program: BondProgramId) => void;
  onPriceControl: (control: PriceControlId) => void;
  onBuy: (companyId: string, amount: number) => void;
  onSell: (companyId: string, ratio: 0.5 | 1) => void;
  onBuyCurrency: (currencyId: string, amount: number) => void;
  onSellCurrency: (currencyId: string, ratio: 0.5 | 1) => void;
  onIssueCurrency: (name: string, symbol: string, backing: CurrencyBacking) => void;
  onRestoreHistoricalCurrency: () => void;
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
  onTaxPolicy,
  onBondProgram,
  onPriceControl,
  onBuy,
  onSell,
  onBuyCurrency,
  onSellCurrency,
  onIssueCurrency,
  onRestoreHistoricalCurrency,
}: EconomicMinistryProps) {
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);
  const [currencyName, setCurrencyName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [currencyBacking, setCurrencyBacking] = useState<CurrencyBacking>('continuity');
  const currentYear = 1942 + Math.floor(game.week / 52);
  const currencyMetrics = { inflation: state.inflation, publicConfidence: state.publicConfidence };
  const activeCurrency = resolveActiveCurrency(state.monetarySystem, nationId, currentYear);
  const historicalMode = state.monetarySystem.historicalAutoTransition;
  const money = (value: number) => formatNationalCurrency(value, state.monetarySystem, nationId, currentYear, currencyMetrics, { signed: true });
  const plainMoney = (value: number) => formatNationalCurrency(Math.abs(value), state.monetarySystem, nationId, currentYear, currencyMetrics);
  const exactMoney = (value: number) => formatNationalCurrency(value, state.monetarySystem, nationId, currentYear, currencyMetrics, { exact: true });
  const foreignCurrencies = getForeignCurrencies(nationId, currentYear);
  const reserveValue = getForeignReserveValue(state.monetarySystem);
  const context = { week: game.week + 1, nationId, game, staffWeeklyCost, economyAdvisorBonus };
  const ledger = calculateEconomyLedger(state, context);
  const portfolio = getPortfolioMetrics(state);
  const companies = getAvailableCompanies(nationId);
  const operatingBalance = ledger.operatingRevenue - ledger.totalExpenses;
  const debtRate = bondPrograms.find((program) => program.id === state.bondProgram)?.effect ?? '';
  const weeklyDividend = ledger.revenues.find((line) => line.id === 'dividend')?.amount ?? 0;
  const investmentExposure = portfolio.value + game.treasury > 0 ? Math.round((portfolio.value / (portfolio.value + game.treasury)) * 100) : 0;
  const companySnapshots = companies
    .map((company) => ({ company, snapshot: getCompanyInvestmentSnapshot(state, company) }))
    .sort((left, right) => Number(Boolean(right.snapshot.holding)) - Number(Boolean(left.snapshot.holding)) || right.snapshot.weeklyChange - left.snapshot.weeklyChange || left.company.name.localeCompare(right.company.name, 'ko'));
  const policyForecast = (change: Partial<Pick<EconomyState, 'taxPolicy' | 'bondProgram' | 'priceControl'>>) => {
    const preview = advanceEconomyWeek({ ...state, ...change }, context);
    const previewOperatingBalance = preview.ledger.operatingRevenue - preview.ledger.totalExpenses;
    return `국고 ${money(preview.ledger.netTreasuryChange)} · 경상 ${money(previewOperatingBalance)} · 물가 ${state.inflation.toFixed(1)}→${preview.state.inflation.toFixed(1)}% · 신뢰 ${state.publicConfidence.toFixed(0)}→${preview.state.publicConfidence.toFixed(0)}`;
  };

  return (
    <section className="economy-ministry">
      <header className="economy-hero">
        <div><span>WAR FINANCE & INDUSTRIAL CAPITAL</span><h2>전시 재무성</h2><p>세입, 차입, 지출과 산업지분을 분리해 다음 주 현금과 장기 부담을 함께 판단합니다.</p></div>
        <div className="economy-hero-balance"><small>현재 전시 재정 · {activeCurrency.code}</small><strong>{plainMoney(game.treasury)}</strong><em>{exactMoney(game.treasury)} · {activeCurrency.name}</em><span className={ledger.netTreasuryChange >= 0 ? 'good' : 'bad'}>다음 주 {money(ledger.netTreasuryChange)}</span></div>
      </header>

      <div className="economy-kpis">
        <article><CircleDollarSign size={19} /><small>실질 경상수지</small><strong className={operatingBalance >= 0 ? 'good' : 'bad'}>{money(operatingBalance)}</strong><span>세입 {plainMoney(ledger.operatingRevenue)} − 지출 {plainMoney(ledger.totalExpenses)}</span></article>
        <article><WalletCards size={19} /><small>차입 포함 주간 증감</small><strong className={ledger.netTreasuryChange >= 0 ? 'good' : 'bad'}>{money(ledger.netTreasuryChange)}</strong><span>국채 조달 {money(ledger.financingRaised)}</span></article>
        <article><CalendarDays size={19} /><small>한 달 예상</small><strong className={ledger.monthlyProjection >= 0 ? 'good' : 'bad'}>{money(ledger.monthlyProjection)}</strong><span>1개월 = 평균 4.345주 · 현재 정책 유지</span></article>
        <article><Landmark size={19} /><small>국가부채·물가</small><strong>{plainMoney(state.debt)}</strong><span>인플레이션 {state.inflation.toFixed(1)}% · 신뢰 {state.publicConfidence.toFixed(0)}/100</span></article>
      </div>

      <section className="economy-currency-panel">
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
            <button disabled={historicalMode && activeCurrency.id !== state.monetarySystem.customCurrency?.id} onClick={onRestoreHistoricalCurrency}><RefreshCw size={13} /> 역사 연표로 복귀</button>
          </div>
          <details className="economy-currency-history">
            <summary>화폐의 역사적 근거와 전환 기록</summary>
            <p>{activeCurrency.historicalNote}</p>
            {activeCurrency.sourceUrl && <a href={activeCurrency.sourceUrl} target="_blank" rel="noreferrer">사료: {activeCurrency.sourceTitle}<ExternalLink size={11} /></a>}
            {state.monetarySystem.transitionHistory.slice(0, 4).map((transition) => <div key={transition.id}><b>{transition.year}</b><span>{transition.note}</span></div>)}
          </details>
        </div>

        {showCurrencyForm && (
          <form className="economy-currency-form" onSubmit={(event) => { event.preventDefault(); onIssueCurrency(currencyName, currencySymbol, currencyBacking); setShowCurrencyForm(false); }}>
            <label><small>새 화폐 이름</small><input name="currency-name" value={currencyName} onChange={(event) => setCurrencyName(event.target.value)} maxLength={24} placeholder="예: 자유원, 태평양 크라운" required /></label>
            <label><small>기호</small><input name="currency-symbol" value={currencySymbol} onChange={(event) => setCurrencySymbol(event.target.value)} maxLength={4} placeholder="예: F₩" required /></label>
            <label><small>발행 원칙</small><select name="currency-backing" value={currencyBacking} onChange={(event) => setCurrencyBacking(event.target.value as CurrencyBacking)}><option value="continuity">구 화폐 구매력 승계</option><option value="foreign-reserve">외환보유고 태환</option><option value="state-credit">국가신용·관리변동</option></select></label>
            <button type="submit">통화헌장 공포</button>
            <p><Info size={12} /> 새 통화는 자동 역사전환을 중지합니다. 신뢰가 낮거나 물가가 높으면 명목환율과 환전 수수료가 불리해지고 상대국이 태환을 거부할 수 있습니다.</p>
          </form>
        )}

        <div className="economy-fx-guide"><ArrowLeftRight size={14} /><strong>환전 방법</strong><span>외화를 사면 국고가 줄고 외환보유고가 늘어납니다.</span><span>환율에는 승인은행 비용이 포함됩니다.</span><span>적성·폐쇄 통화는 거래를 거부할 수 있습니다.</span></div>
        <div className="economy-fx-list">
          {foreignCurrencies.map((currency) => {
            const quote = getExchangeQuote(state.monetarySystem, nationId, currency.id, currentYear, currencyMetrics, relations);
            if (!quote) return null;
            const reserve = state.monetarySystem.foreignReserves[currency.id] ?? 0;
            return (
              <article className={quote.approved ? 'approved' : 'refused'} key={currency.id}>
                <header><i>{currency.symbol}</i><span><small>{currency.code} · {currency.issuer}</small><strong>{currency.name}</strong></span><b>{quote.approved ? <><CheckCircle2 size={11} /> 환전 가능</> : <><Ban size={11} /> 거래 거부</>}</b></header>
                <div className="economy-fx-rate"><span><small>양방향 교차환율</small><strong>1 {currency.code} = {quote.domesticPerForeign.toLocaleString('ko-KR', { maximumFractionDigits: quote.domesticPerForeign < 0.1 ? 4 : 2 })} {activeCurrency.code}</strong><em>1 {activeCurrency.code} = {quote.foreignPerDomestic.toLocaleString('ko-KR', { maximumFractionDigits: quote.foreignPerDomestic < 0.1 ? 4 : 2 })} {currency.code}</em></span><span><small>승인비용</small><b>{(quote.feeRate * 100).toFixed(1)}%</b></span></div>
                <p>{quote.reason}</p>
                <div className="economy-fx-reserve"><span><small>보유액 · 현재 국내가치</small><strong>{reserve > 0 ? formatForeignCurrency(reserve, currency) : '없음'}</strong>{reserve > 0 && <em>{plainMoney(reserve / currency.unitsPerSterling)}</em>}</span>{reserve > 0 && <div><button onClick={() => onSellCurrency(currency.id, 0.5)}>절반 매도</button><button onClick={() => onSellCurrency(currency.id, 1)}>전량 매도</button></div>}</div>
                <div className="economy-fx-buy">{[10, 25, 50].map((amount) => { const expectedForeign = amount * currency.unitsPerSterling * (1 - quote.feeRate); return <button disabled={!quote.approved || game.treasury < amount} title={!quote.approved ? quote.reason : `${plainMoney(amount)} 지급 · ${formatForeignCurrency(expectedForeign, currency)} 예상 수령`} onClick={() => onBuyCurrency(currency.id, amount)} key={amount}><span>{plainMoney(amount)}</span><em>→ {formatForeignCurrency(expectedForeign, currency)}</em></button>; })}</div>
              </article>
            );
          })}
        </div>
        {state.monetarySystem.exchangeHistory.length > 0 && <details className="economy-fx-history"><summary>최근 환전 체결 {state.monetarySystem.exchangeHistory.length}건</summary><div>{state.monetarySystem.exchangeHistory.slice(0, 6).map((record) => { const currency = getCurrencyById(record.currencyId); return currency ? <p key={record.id}><span>제 {record.week + 1}주 · {record.side === 'buy' ? '외화 매수' : '외화 매도'}</span><strong>{currency.code} {formatForeignCurrency(record.foreignAmount, currency, { exact: true })}</strong><em>비용 {(record.feeRate * 100).toFixed(1)}%</em></p> : null; })}</div></details>}
      </section>

      <div className="economy-grid">
        <section className="economy-ledger-panel">
          <div className="economy-section-heading"><div><small>WEEKLY CASH FLOW</small><h3>다음 주 재정은 어디서 오는가</h3></div><span>예상 순증감 <b className={ledger.netTreasuryChange >= 0 ? 'good' : 'bad'}>{money(ledger.netTreasuryChange)}</b></span></div>
          <div className="economy-ledger-group revenue"><h4><ArrowUpRight size={14} /> 세입 — 갚지 않아도 되는 돈 <em>{money(ledger.operatingRevenue)}</em></h4>{ledger.revenues.map((line) => <div key={line.id}><span><strong>{line.label}</strong><small>{line.explanation}</small></span><b>{money(line.amount)}</b></div>)}</div>
          <div className="economy-ledger-group financing"><h4><WalletCards size={14} /> 차입 — 지금 들어오지만 부채가 되는 돈 <em>{money(ledger.financingRaised)}</em></h4>{ledger.financing.length ? ledger.financing.map((line) => <div key={line.id}><span><strong>{line.label}</strong><small>{line.explanation}</small></span><b>{money(line.amount)}</b></div>) : <div><span><strong>신규 차입 없음</strong><small>세입 안에서만 지출합니다.</small></span><b>{plainMoney(0)}</b></div>}</div>
          <div className="economy-ledger-group expense"><h4><ArrowDownRight size={14} /> 지출 — 이번 주 빠져나가는 돈 <em>−{plainMoney(ledger.totalExpenses)}</em></h4>{ledger.expenses.map((line) => <div key={line.id}><span><strong>{line.label}</strong><small>{line.explanation}</small></span><b>−{plainMoney(line.amount)}</b></div>)}</div>
          <div className="economy-ledger-total"><span><small>계산식</small><strong>{plainMoney(ledger.operatingRevenue)} 세입 + {plainMoney(ledger.financingRaised)} 차입 − {plainMoney(ledger.totalExpenses)} 지출</strong></span><b>{money(ledger.netTreasuryChange)}</b></div>
        </section>

        <aside className="economy-policy-panel">
          <div className="economy-section-heading"><div><small>FISCAL CABINET</small><h3>어떻게 재정을 당길 것인가</h3></div></div>
          <div className="economy-policy-verification"><CalendarDays size={14} /><span><strong>선택 즉시 전망 갱신</strong><small>실제 국고·부채·물가 변화는 제 {context.week + 1}주 통합 주간 브리핑에서 확인합니다.</small></span></div>
          <PolicySelector title="조세 정책" value={state.taxPolicy} options={taxPolicies} forecast={(id) => policyForecast({ taxPolicy: id })} onChange={(id) => onTaxPolicy(id as TaxPolicyId)} />
          <PolicySelector title="국채·신용 조달" value={state.bondProgram} options={bondPrograms} forecast={(id) => policyForecast({ bondProgram: id })} onChange={(id) => onBondProgram(id as BondProgramId)} />
          <PolicySelector title="물가·배급 통제" value={state.priceControl} options={priceControls} forecast={(id) => policyForecast({ priceControl: id })} onChange={(id) => onPriceControl(id as PriceControlId)} />
          <div className="economy-policy-warning"><ShieldAlert size={15} /><span><strong>부채는 수입이 아닙니다.</strong><small>{debtRate}. 중앙은행 인수는 빠르지만 물가와 신뢰를 훼손하며, 저축채권도 매주 이자비용을 남깁니다.</small></span></div>
        </aside>
      </div>

      <section className="economy-market-panel">
        <div className="economy-section-heading"><div><small>HISTORICAL INDUSTRIAL MARKET</small><h3>산업 투자</h3><p>회사를 고르고 투자하면 매주 배당과 가격 변동이 국고에 반영됩니다. 실제 개인 주식시장이 아니라 국가 재무성의 산업지분 운용입니다.</p></div><span><small>현재 보유자산</small><b>{plainMoney(portfolio.value)}</b><em className={portfolio.unrealizedGain >= 0 ? 'good' : 'bad'}>{money(portfolio.unrealizedGain)} · {portfolio.returnRate >= 0 ? '+' : ''}{portfolio.returnRate.toFixed(1)}%</em></span></div>
        <div className="economy-investment-summary">
          <article><WalletCards size={16} /><span><small>지금 투자할 수 있는 돈</small><strong>{plainMoney(game.treasury)}</strong></span></article>
          <article><PieChart size={16} /><span><small>투자한 원금</small><strong>{plainMoney(portfolio.invested)}</strong><em>전체 자산 중 {investmentExposure}%</em></span></article>
          <article className={portfolio.unrealizedGain >= 0 ? 'good' : 'bad'}>{portfolio.unrealizedGain >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}<span><small>아직 팔지 않은 손익</small><strong>{money(portfolio.unrealizedGain)}</strong><em>매각 시 수수료 2%</em></span></article>
          <article><CircleDollarSign size={16} /><span><small>이번 주 예상 배당</small><strong>{money(weeklyDividend)}</strong><em>주간 재정 세입에 포함</em></span></article>
        </div>
        <div className="economy-investment-guide"><Info size={14} /><strong>이용 방법</strong><span><b>1</b> 기업 비교</span><i>→</i><span><b>2</b> 정액 매수</span><i>→</i><span><b>3</b> 매주 배당·가격 확인</span><i>→</i><span><b>4</b> 필요할 때 매각</span></div>
        <div className="economy-company-list">
          <div className="economy-company-list-head"><span>기업</span><span>이번 주 가격</span><span>위험·배당</span><span>내 보유 현황</span><span>투자 행동</span></div>
          {companySnapshots.map(({ company, snapshot }) => {
            const { holding } = snapshot;
            const changeTone = snapshot.weeklyChange > 0.05 ? 'good' : snapshot.weeklyChange < -0.05 ? 'bad' : 'flat';
            const minimumBuyDisabled = game.treasury < 25 || snapshot.availableCapacity < 25;
            return (
              <article className={`economy-company-row ${holding ? 'owned' : ''}`} key={company.id}>
                <div className="economy-company-identity"><i><Building2 size={16} /></i><span><small>{company.country} · {sectorLabels[company.sector]}</small><strong>{company.name}</strong><em>{ownershipLabels[company.ownership]}{holding ? ' · 보유 중' : ''}</em></span></div>
                <div className="economy-company-price"><small>산업지수</small><strong>{snapshot.price.toFixed(1)}</strong><em className={changeTone}>{snapshot.weeklyChange > 0 ? <TrendingUp size={11} /> : snapshot.weeklyChange < 0 ? <TrendingDown size={11} /> : <Scale size={11} />}{snapshot.weeklyChange > 0 ? '+' : ''}{snapshot.weeklyChange.toFixed(1)}% <b>{changeTone === 'good' ? '상승' : changeTone === 'bad' ? '하락' : '보합'}</b></em></div>
                <div className="economy-company-profile"><span><small>위험</small><b className={`risk-${snapshot.riskLevel}`}>{[1, 2, 3].map((level) => <i className={level <= snapshot.riskLevel ? 'filled' : ''} key={level} />)}{snapshot.riskLevel === 1 ? '낮음' : snapshot.riskLevel === 2 ? '보통' : '높음'}</b></span><span><small>{plainMoney(50)} 투자 시 연 배당</small><strong>{snapshot.previewAnnualDividend > 0 ? money(snapshot.previewAnnualDividend) : '배당 없음'}</strong></span></div>
                <div className="economy-company-holding">{holding ? <><span><small>현재 가치</small><strong>{plainMoney(snapshot.holdingValue)}</strong></span><span><small>내 손익</small><b className={snapshot.holdingGain >= 0 ? 'good' : 'bad'}>{money(snapshot.holdingGain)} · {snapshot.holdingReturnRate >= 0 ? '+' : ''}{snapshot.holdingReturnRate.toFixed(1)}%</b></span><em>주 배당 {money(snapshot.holdingWeeklyDividend)}</em></> : <><strong>아직 투자하지 않음</strong><small>최소 {plainMoney(25)}부터 매수</small></>}</div>
                <div className="economy-company-actions"><small>{minimumBuyDisabled ? game.treasury < 25 ? `국고 ${plainMoney(25)} 필요` : '투자 한도 도달' : `추가 한도 ${plainMoney(snapshot.availableCapacity)}`}</small><div>{[25, 50, 100].map((amount) => <button key={amount} title={game.treasury < amount ? `국고가 ${plainMoney(amount)}보다 적습니다.` : snapshot.availableCapacity < amount ? `남은 투자 한도는 ${plainMoney(snapshot.availableCapacity)}입니다.` : `${company.name}에 ${plainMoney(amount)} 투자`} disabled={game.treasury < amount || snapshot.availableCapacity < amount} onClick={() => onBuy(company.id, amount)}>{plainMoney(amount)} <b>매수</b></button>)}</div>{holding && <div className="sell-actions"><button className="sell" onClick={() => onSell(company.id, 0.5)}>절반 매각</button><button className="sell" onClick={() => onSell(company.id, 1)}>전량 매각</button></div>}</div>
                <details className="economy-company-details"><summary>가격 변동 요인·역사적 위험 보기</summary><div><p><strong>산업 기반</strong>{company.historicalBasis}</p><p><strong>손실 위험</strong>{company.riskNote}</p><a href={company.sourceUrl} target="_blank" rel="noreferrer">사료: {company.sourceTitle}<ExternalLink size={11} /></a></div></details>
              </article>
            );
          })}
        </div>
      </section>

      <section className="economy-event-panel">
        <div className="economy-section-heading"><div><small>MONTHLY ECONOMIC DISPATCHES</small><h3>경제 사건과 시장 결과</h3></div><span>4주마다 기업계약·원가·수송·국채 사건 판정</span></div>
        {state.eventHistory.length ? <div>{state.eventHistory.slice(0, 8).map((event) => {
          const company = event.companyId ? historicalCompanies.find((item) => item.id === event.companyId) : null;
          return <article className={event.tone} key={event.id}><i>{event.tone === 'good' ? <TrendingUp size={15} /> : event.tone === 'bad' ? <TrendingDown size={15} /> : <Scale size={15} />}</i><span><small>{company?.name ?? '국가 금융시장'}</small><strong>{event.title}</strong><p>{event.detail}</p></span><div><em>가격 {event.priceImpact >= 0 ? '+' : ''}{(event.priceImpact * 100).toFixed(1)}%</em><em>재정 {money(event.treasuryImpact)}</em><em>신뢰 {event.confidenceImpact >= 0 ? '+' : ''}{event.confidenceImpact}</em></div></article>;
        })}</div> : <div className="economy-event-empty"><Landmark size={22} /><strong>아직 확정된 월간 경제 사건이 없습니다.</strong><span>제4주부터 조달계약·공습·원가·국채시장 사건이 기록됩니다.</span></div>}
      </section>
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
