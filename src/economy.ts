import type { GameState, NationId } from './types';
import { advanceMonetarySystem, createMonetarySystem, normalizeMonetarySystem } from './currency';
import type { MonetarySystemState } from './currency';
import { getCampaignYearForWeek } from './campaignCalendar';

export type TaxPolicyId = 'relief' | 'balanced' | 'total-war';
export type BondProgramId = 'none' | 'savings' | 'institutional' | 'central-bank';
export type PriceControlId = 'none' | 'targeted' | 'comprehensive';
export type CompanySector = 'aircraft' | 'vehicles' | 'shipbuilding' | 'steel' | 'chemicals' | 'electrical' | 'transport' | 'consumer';
export type CompanyOwnership = 'listed' | 'private-contract' | 'state-combine' | 'resistance-fund';

export interface EconomyPolicyOption<T extends string> {
  id: T;
  name: string;
  summary: string;
  effect: string;
}

export interface HistoricalCompany {
  id: string;
  name: string;
  country: string;
  sector: CompanySector;
  ownership: CompanyOwnership;
  availableTo: NationId[];
  basePrice: number;
  annualDividendYield: number;
  volatility: number;
  maxInvestment: number;
  historicalBasis: string;
  riskNote: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface CompanyHolding {
  companyId: string;
  units: number;
  invested: number;
  averagePrice: number;
}

export interface EconomyLedgerLine {
  id: string;
  label: string;
  amount: number;
  explanation: string;
  kind: 'revenue' | 'financing' | 'expense';
}

export interface EconomyLedger {
  week: number;
  revenues: EconomyLedgerLine[];
  financing: EconomyLedgerLine[];
  expenses: EconomyLedgerLine[];
  operatingRevenue: number;
  financingRaised: number;
  totalExpenses: number;
  netTreasuryChange: number;
  monthlyProjection: number;
  debtAfter: number;
  portfolioValue: number;
  unrealizedGain: number;
}

export interface EconomicEvent {
  id: string;
  title: string;
  detail: string;
  companyId?: string;
  priceImpact: number;
  treasuryImpact: number;
  inflationImpact: number;
  confidenceImpact: number;
  tone: 'good' | 'bad' | 'neutral';
}

export interface EconomyState {
  taxPolicy: TaxPolicyId;
  bondProgram: BondProgramId;
  priceControl: PriceControlId;
  debt: number;
  inflation: number;
  publicConfidence: number;
  marketPrices: Record<string, number>;
  previousPrices: Record<string, number>;
  holdings: CompanyHolding[];
  lastLedger: EconomyLedger | null;
  eventHistory: EconomicEvent[];
  monetarySystem: MonetarySystemState;
}

export interface EconomyContext {
  week: number;
  nationId: NationId;
  game: GameState;
  staffWeeklyCost: number;
  economyAdvisorBonus: number;
}

export const taxPolicies: EconomyPolicyOption<TaxPolicyId>[] = [
  { id: 'relief', name: '민생 감세', summary: '가계와 영세사업자의 부담을 낮춰 소비와 안정도를 지킵니다.', effect: '조세수입 -22% · 주간 안정도 +0.2' },
  { id: 'balanced', name: '누진 전시세제', summary: '소득세와 초과이윤세를 함께 걷되 민생 한계를 남깁니다.', effect: '기준 세입 · 안정적 징수' },
  { id: 'total-war', name: '총력전 증세', summary: '급여 원천징수와 기업 초과이윤세를 최대한 확대합니다.', effect: '조세수입 +30% · 주간 안정도 -0.3' },
];

export const bondPrograms: EconomyPolicyOption<BondProgramId>[] = [
  { id: 'none', name: '신규 차입 중단', summary: '현재 세입 안에서만 지출해 부채 증가를 멈춥니다.', effect: '신규 조달 없음 · 신뢰 회복' },
  { id: 'savings', name: '국민 저축채권', summary: '소액 저축을 전쟁채권으로 흡수해 민간 유동성을 조달합니다.', effect: '주간 +24M · 연 2.5% 이자' },
  { id: 'institutional', name: '금융기관 국채배정', summary: '은행·보험·연기금에 중장기 국채를 배정합니다.', effect: '주간 +55M · 연 2.0% 이자 · 신뢰 부담' },
  { id: 'central-bank', name: '중앙은행 직접인수', summary: '중앙은행 신용으로 국채를 떠받쳐 가장 빠르게 현금을 만듭니다.', effect: '주간 +85M · 연 0.5% 이자 · 인플레이션 급증' },
];

export const priceControls: EconomyPolicyOption<PriceControlId>[] = [
  { id: 'none', name: '시장가격 허용', summary: '행정비용은 적지만 군수수요가 생활물가로 전가됩니다.', effect: '행정비 0 · 인플레이션 +0.2%p/주' },
  { id: 'targeted', name: '핵심품목 최고가격', summary: '식량·연료·수송의 가격과 배급만 선별 통제합니다.', effect: '주간 -3M · 물가상승 완화' },
  { id: 'comprehensive', name: '전면 가격·임금 통제', summary: '광범위한 가격·임금·할부신용을 통제해 물가를 억누릅니다.', effect: '주간 -7M · 인플레이션 하락 · 암시장 위험' },
];

const allied = ['britain', 'usa', 'china', 'india', 'freefrance', 'korea', 'vietnam', 'indonesia', 'philippines'] satisfies NationId[];
const axis = ['germany', 'japan', 'italy'] satisfies NationId[];

export const historicalCompanies: HistoricalCompany[] = [
  { id: 'rolls-royce', name: 'Rolls-Royce', country: '영국', sector: 'aircraft', ownership: 'listed', availableTo: allied, basePrice: 108, annualDividendYield: 0.026, volatility: 0.055, maxInvestment: 320, historicalBasis: 'Merlin 계열 항공기 엔진과 전시 항공산업을 대표합니다.', riskNote: '알루미늄·고급 합금 부족과 공습으로 생산차질이 날 수 있습니다.', sourceTitle: 'Rolls-Royce heritage', sourceUrl: 'https://www.rolls-royce.com/about/our-history.aspx' },
  { id: 'vickers-armstrongs', name: 'Vickers-Armstrongs', country: '영국', sector: 'shipbuilding', ownership: 'listed', availableTo: allied, basePrice: 96, annualDividendYield: 0.041, volatility: 0.048, maxInvestment: 360, historicalBasis: '함정·포병·기갑과 항공기까지 공급한 복합 군수기업입니다.', riskNote: '대형 조선소 공습과 전후 군수수요 축소에 민감합니다.', sourceTitle: 'London Stock Exchange history', sourceUrl: 'https://www.londonstockexchange.com/discover/lseg/our-history?lang=en' },
  { id: 'ici', name: 'Imperial Chemical Industries', country: '영국', sector: 'chemicals', ownership: 'listed', availableTo: allied, basePrice: 102, annualDividendYield: 0.038, volatility: 0.036, maxInvestment: 280, historicalBasis: '화약·화학소재·합성원료를 포괄하는 영국 화학산업 지분입니다.', riskNote: '원료 수입과 화학설비 사고, 전후 환경책임에 노출됩니다.', sourceTitle: 'UK Parliament: the cost of war', sourceUrl: 'https://www.parliament.uk/about/living-heritage/transformingsociety/private-lives/taxation/overview/costofwar/' },
  { id: 'ford', name: 'Ford Motor Company', country: '미국', sector: 'vehicles', ownership: 'listed', availableTo: allied, basePrice: 112, annualDividendYield: 0.032, volatility: 0.049, maxInvestment: 420, historicalBasis: '민수차 생산을 중단하고 Jeep·항공기·엔진·전차 생산으로 전환했습니다.', riskNote: '노동관계, 정부 계약 종료와 전후 민수전환 비용에 민감합니다.', sourceTitle: 'Ford company timeline', sourceUrl: 'https://corporate.ford.com/about/history/company-timeline/' },
  { id: 'general-motors', name: 'General Motors', country: '미국', sector: 'vehicles', ownership: 'listed', availableTo: allied, basePrice: 116, annualDividendYield: 0.035, volatility: 0.043, maxInvestment: 460, historicalBasis: '차량·엔진·탄약을 대량생산하는 미국 산업동원 지분입니다.', riskNote: '전시 계약집중과 해외 자산의 정치적 책임 위험이 있습니다.', sourceTitle: 'GM Heritage: Arsenal of Democracy', sourceUrl: 'https://www.gm.com/heritage?evar25=gmhc_redirect' },
  { id: 'boeing', name: 'Boeing Airplane Company', country: '미국', sector: 'aircraft', ownership: 'listed', availableTo: allied, basePrice: 124, annualDividendYield: 0.018, volatility: 0.074, maxInvestment: 360, historicalBasis: '대형 폭격기 생산과 항공기술 확대에 연동되는 성장형 지분입니다.', riskNote: '개발실패·사고·계약취소 때 변동폭이 큽니다.', sourceTitle: 'Boeing history chronology', sourceUrl: 'https://www.boeing.com/content/dam/boeing/boeingdotcom/history/pdf/Boeing-Chronology.pdf' },
  { id: 'tata-steel', name: 'Tata Iron & Steel', country: '영국령 인도', sector: 'steel', ownership: 'listed', availableTo: ['britain', 'india', 'china'], basePrice: 91, annualDividendYield: 0.044, volatility: 0.041, maxInvestment: 260, historicalBasis: '인도 철강과 철도·군수 소재 공급망을 대표하는 산업 지분입니다.', riskNote: '벵골·버마 수송위기, 노동분쟁과 독립 이후 정책변화에 민감합니다.', sourceTitle: 'Tata: The Defence Journey', sourceUrl: 'https://www.tata.com/newsroom/tata-defence-journey' },
  { id: 'cnac', name: 'China National Aviation Corporation', country: '중화민국', sector: 'transport', ownership: 'private-contract', availableTo: ['china', 'usa', 'britain', 'korea'], basePrice: 84, annualDividendYield: 0.016, volatility: 0.081, maxInvestment: 180, historicalBasis: '중국 내륙과 연합군 보급 항로를 잇는 항공운송 계약 지분입니다.', riskNote: '항로 손실·기상·점령지 변화 때문에 매우 위험합니다.', sourceTitle: 'Pan Am Historical Foundation: CNAC', sourceUrl: 'https://www.panam.org/pan-am-inspirations/china-national-aviation-corporation' },
  { id: 'renault', name: 'Renault', country: '프랑스', sector: 'vehicles', ownership: 'private-contract', availableTo: ['freefrance', 'britain'], basePrice: 71, annualDividendYield: 0.0, volatility: 0.092, maxInvestment: 180, historicalBasis: '점령과 전후 국유화 가능성까지 포함한 프랑스 자동차산업 권리입니다.', riskNote: '점령당국 통제·공습·협력 책임·국유화로 원금 손실이 날 수 있습니다.', sourceTitle: 'Renault group history', sourceUrl: 'https://www.renaultgroup.com/en/our-company/heritage/' },
  { id: 'fiat', name: 'FIAT', country: '이탈리아', sector: 'vehicles', ownership: 'listed', availableTo: ['italy'], basePrice: 93, annualDividendYield: 0.028, volatility: 0.064, maxInvestment: 300, historicalBasis: '차량·항공기·엔진과 이탈리아 산업동원에 연결된 지분입니다.', riskNote: '노동불안·연합군 폭격·정권교체와 전후 전환 위험이 큽니다.', sourceTitle: 'Stellantis heritage', sourceUrl: 'https://www.stellantis.com/en/company/heritage' },
  { id: 'ansaldo', name: 'Ansaldo', country: '이탈리아', sector: 'shipbuilding', ownership: 'private-contract', availableTo: ['italy'], basePrice: 86, annualDividendYield: 0.031, volatility: 0.071, maxInvestment: 240, historicalBasis: '함정·포병·중공업 계약에 노출된 이탈리아 군수산업 지분입니다.', riskNote: '해상봉쇄와 원료부족, 정권 붕괴 시 계약손실 위험이 있습니다.', sourceTitle: 'Fondazione Ansaldo history', sourceUrl: 'https://www.fondazioneansaldo.it/' },
  { id: 'siemens', name: 'Siemens & Halske', country: '독일', sector: 'electrical', ownership: 'listed', availableTo: axis, basePrice: 101, annualDividendYield: 0.034, volatility: 0.052, maxInvestment: 330, historicalBasis: '통신·전기·산업설비와 군수 전자부품 공급망을 대표합니다.', riskNote: '폭격과 강제노동 책임, 전후 해체·배상 위험을 명시적으로 반영합니다.', sourceTitle: 'Siemens history 1933–1945', sourceUrl: 'https://www.siemens.com/global/en/company/about/history/company/1933-1945.html' },
  { id: 'krupp', name: 'Fried. Krupp AG', country: '독일', sector: 'steel', ownership: 'private-contract', availableTo: ['germany'], basePrice: 109, annualDividendYield: 0.025, volatility: 0.067, maxInvestment: 380, historicalBasis: '철강·포병·장갑 생산과 대형 군수계약에 연동됩니다.', riskNote: '강제노동·약탈경제 책임과 폭격, 전후 재판·분할 위험이 매우 큽니다.', sourceTitle: 'Bundesbank: Reichsbank to Bundesbank', sourceUrl: 'https://www.bundesbank.de/resource/blob/927730/25fef541e4458e82d064ac532464646f/mL/von-der-reichsbank-zur-bundesbank-data.pdf' },
  { id: 'ig-farben', name: 'I.G. Farbenindustrie', country: '독일', sector: 'chemicals', ownership: 'listed', availableTo: ['germany'], basePrice: 105, annualDividendYield: 0.029, volatility: 0.083, maxInvestment: 300, historicalBasis: '합성연료·고무·화학제품 생산능력에 연동되지만 범죄적 강제노동 체계를 포함합니다.', riskNote: '인권범죄 책임, 시설폭격, 전후 해체와 몰수 위험을 숨기지 않습니다.', sourceTitle: 'Wollheim Memorial: I.G. Farben', sourceUrl: 'https://www.wollheim-memorial.de/en/ig_farben_ag_en' },
  { id: 'mitsubishi', name: 'Mitsubishi Honsha', country: '일본', sector: 'shipbuilding', ownership: 'listed', availableTo: ['japan'], basePrice: 107, annualDividendYield: 0.027, volatility: 0.061, maxInvestment: 390, historicalBasis: '조선·광업·항공·무역을 묶은 재벌형 중공업 지분입니다.', riskNote: '해상봉쇄·공습·노무 책임과 전후 재벌해체 위험이 있습니다.', sourceTitle: 'Mitsubishi history', sourceUrl: 'https://www.mitsubishi.com/en/profile/history/outline/' },
  { id: 'kawasaki', name: 'Kawasaki Heavy Industries', country: '일본', sector: 'shipbuilding', ownership: 'listed', availableTo: ['japan'], basePrice: 98, annualDividendYield: 0.024, volatility: 0.069, maxInvestment: 310, historicalBasis: '함정·항공기·철도차량을 생산하는 일본 중공업 지분입니다.', riskNote: '수입원료·해상수송·공습과 전후 군수금지에 취약합니다.', sourceTitle: 'Kawasaki history', sourceUrl: 'https://global.kawasaki.com/en/corp/history/' },
  { id: 'uralvagonzavod', name: '우랄바곤자보드 제183공장', country: '소련', sector: 'vehicles', ownership: 'state-combine', availableTo: ['ussr'], basePrice: 100, annualDividendYield: 0.0, volatility: 0.038, maxInvestment: 400, historicalBasis: '상장주식이 아니라 전차 생산 증설에 참여하는 국가 산업계정입니다.', riskNote: '배당 대신 생산성과 국가배당을 얻지만 강제동원·병목 책임이 발생할 수 있습니다.', sourceTitle: 'Russian state archive portal', sourceUrl: 'https://statearchive.ru/' },
  { id: 'gaz', name: '고리키 자동차 공장', country: '소련', sector: 'vehicles', ownership: 'state-combine', availableTo: ['ussr'], basePrice: 94, annualDividendYield: 0.0, volatility: 0.044, maxInvestment: 280, historicalBasis: '트럭과 차량 생산을 확대하는 국가 산업투자 계정입니다.', riskNote: '공습·부품부족·과도한 생산목표로 평가가 하락할 수 있습니다.', sourceTitle: 'Federal Reserve: WWII and its aftermath', sourceUrl: 'https://www.federalreservehistory.org/essays/wwii-and-its-aftermath' },
  { id: 'independence-fund', name: '독립운동 산업기금', country: '망명·저항 지역', sector: 'transport', ownership: 'resistance-fund', availableTo: ['korea', 'vietnam', 'indonesia', 'philippines'], basePrice: 80, annualDividendYield: 0.0, volatility: 0.058, maxInvestment: 180, historicalBasis: '상장주식이 아니라 인쇄소·운송망·무전망·지역협동조합에 분산 투자하는 비밀기금입니다.', riskNote: '체포·압수·침투 위험이 있지만 독립 후 산업기반과 정치적 신뢰를 남깁니다.', sourceTitle: 'US National Archives: World War II records', sourceUrl: 'https://www.archives.gov/research/military/ww2' },
];

const bondWeekly: Record<BondProgramId, number> = { none: 0, savings: 24, institutional: 55, 'central-bank': 85 };
const bondRates: Record<BondProgramId, number> = { none: 0.018, savings: 0.025, institutional: 0.02, 'central-bank': 0.005 };
const taxMultipliers: Record<TaxPolicyId, number> = { relief: 0.78, balanced: 1, 'total-war': 1.3 };
const priceControlCost: Record<PriceControlId, number> = { none: 0, targeted: 3, comprehensive: 7 };

function roundMoney(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function stableRoll(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function getAvailableCompanies(nationId: NationId) {
  return historicalCompanies.filter((company) => company.availableTo.includes(nationId));
}

export function createEconomyState(nationId: NationId, year = 1942): EconomyState {
  const marketPrices = Object.fromEntries(getAvailableCompanies(nationId).map((company) => [company.id, company.basePrice]));
  return {
    taxPolicy: 'balanced',
    bondProgram: nationId === 'ussr' || nationId === 'germany' || nationId === 'japan' ? 'institutional' : 'savings',
    priceControl: 'targeted',
    debt: nationId === 'usa' ? 620 : nationId === 'britain' ? 780 : nationId === 'germany' || nationId === 'japan' ? 840 : 360,
    inflation: nationId === 'germany' || nationId === 'japan' ? 7.2 : 4.8,
    publicConfidence: 68,
    marketPrices,
    previousPrices: { ...marketPrices },
    holdings: [],
    lastLedger: null,
    eventHistory: [],
    monetarySystem: createMonetarySystem(nationId, year),
  };
}

export function normalizeEconomyState(value: Partial<EconomyState> | null | undefined, nationId: NationId, year = 1942): EconomyState {
  const fallback = createEconomyState(nationId, year);
  const allowedIds = new Set(getAvailableCompanies(nationId).map((company) => company.id));
  const prices = { ...fallback.marketPrices, ...(value?.marketPrices ?? {}) };
  return {
    ...fallback,
    ...value,
    taxPolicy: taxPolicies.some((policy) => policy.id === value?.taxPolicy) ? value?.taxPolicy as TaxPolicyId : fallback.taxPolicy,
    bondProgram: bondPrograms.some((policy) => policy.id === value?.bondProgram) ? value?.bondProgram as BondProgramId : fallback.bondProgram,
    priceControl: priceControls.some((policy) => policy.id === value?.priceControl) ? value?.priceControl as PriceControlId : fallback.priceControl,
    debt: clamp(Number(value?.debt ?? fallback.debt), 0, 100_000),
    inflation: clamp(Number(value?.inflation ?? fallback.inflation), 0, 100),
    publicConfidence: clamp(Number(value?.publicConfidence ?? fallback.publicConfidence), 0, 100),
    marketPrices: Object.fromEntries(Object.entries(prices).filter(([id, price]) => allowedIds.has(id) && Number.isFinite(price)).map(([id, price]) => [id, clamp(Number(price), 5, 500)])),
    previousPrices: { ...fallback.previousPrices, ...(value?.previousPrices ?? {}) },
    holdings: Array.isArray(value?.holdings) ? value.holdings.filter((holding) => allowedIds.has(holding.companyId) && holding.units > 0) : [],
    lastLedger: value?.lastLedger ?? null,
    eventHistory: Array.isArray(value?.eventHistory) ? value.eventHistory.slice(0, 24) : [],
    monetarySystem: normalizeMonetarySystem(value?.monetarySystem, nationId, year),
  };
}

export function getPortfolioMetrics(state: EconomyState) {
  const value = state.holdings.reduce((total, holding) => total + holding.units * (state.marketPrices[holding.companyId] ?? holding.averagePrice), 0);
  const invested = state.holdings.reduce((total, holding) => total + holding.invested, 0);
  const unrealizedGain = roundMoney(value - invested);
  return {
    value: roundMoney(value),
    invested: roundMoney(invested),
    unrealizedGain,
    returnRate: invested > 0 ? roundMoney((unrealizedGain / invested) * 100) : 0,
  };
}

export function getCompanyDividendYield(company: HistoricalCompany) {
  if (company.ownership === 'state-combine') return 0.018;
  if (company.ownership === 'resistance-fund') return 0.012;
  return company.annualDividendYield;
}

export function getCompanyInvestmentSnapshot(state: EconomyState, company: HistoricalCompany, previewAmount = 50) {
  const price = state.marketPrices[company.id] ?? company.basePrice;
  const previousPrice = state.previousPrices[company.id] ?? price;
  const weeklyChange = previousPrice > 0 ? roundMoney(((price - previousPrice) / previousPrice) * 100) : 0;
  const holding = state.holdings.find((item) => item.companyId === company.id) ?? null;
  const holdingValue = roundMoney((holding?.units ?? 0) * price);
  const holdingGain = roundMoney(holdingValue - (holding?.invested ?? 0));
  const holdingReturnRate = holding?.invested ? roundMoney((holdingGain / holding.invested) * 100) : 0;
  const dividendYield = getCompanyDividendYield(company);
  const riskLevel = company.volatility >= 0.075 ? 3 : company.volatility >= 0.055 ? 2 : 1;
  return {
    price,
    previousPrice,
    weeklyChange,
    holding,
    holdingValue,
    holdingGain,
    holdingReturnRate,
    dividendYield,
    previewAnnualDividend: roundMoney(previewAmount * dividendYield),
    holdingWeeklyDividend: roundMoney(holdingValue * dividendYield / 52),
    riskLevel,
    availableCapacity: roundMoney(company.maxInvestment - (holding?.invested ?? 0)),
  };
}

export function calculateEconomyLedger(state: EconomyState, context: EconomyContext): EconomyLedger {
  const { game, staffWeeklyCost, economyAdvisorBonus } = context;
  const taxBase = 20 + game.factories * 0.72 + game.stability * 0.12;
  const incomeTax = roundMoney(taxBase * taxMultipliers[state.taxPolicy]);
  const excessProfitTax = roundMoney(game.factories * (state.taxPolicy === 'total-war' ? 0.46 : state.taxPolicy === 'relief' ? 0.22 : 0.34));
  const tradeAndCustoms = roundMoney((game.navalPower * 0.12 + game.stability * 0.05) * (game.enemyPressure >= 80 ? 0.62 : game.enemyPressure >= 65 ? 0.78 : 1));
  const advisorCollection = roundMoney(economyAdvisorBonus);
  const dividends = roundMoney(state.holdings.reduce((total, holding) => {
    const company = historicalCompanies.find((item) => item.id === holding.companyId);
    if (!company) return total;
    const price = state.marketPrices[holding.companyId] ?? holding.averagePrice;
    return total + holding.units * price * getCompanyDividendYield(company) / 52;
  }, 0));
  const bondProceeds = bondWeekly[state.bondProgram];
  const factoryMaintenance = roundMoney(game.factories);
  const debtService = roundMoney(state.debt * bondRates[state.bondProgram] / 52);
  const controls = priceControlCost[state.priceControl];
  const revenues: EconomyLedgerLine[] = [
    { id: 'income-tax', label: '소득세·급여 원천징수', amount: incomeTax, explanation: `세원 ${taxBase.toFixed(1)} × ${taxMultipliers[state.taxPolicy].toFixed(2)}`, kind: 'revenue' },
    { id: 'profit-tax', label: '기업세·초과이윤세', amount: excessProfitTax, explanation: `가동 군수공장 ${game.factories}개에 세율 적용`, kind: 'revenue' },
    { id: 'trade', label: '관세·무역결제', amount: tradeAndCustoms, explanation: `해상통제 ${game.navalPower} · 적 압력 ${game.enemyPressure}`, kind: 'revenue' },
    { id: 'advisor', label: '징세행정·경제고문', amount: advisorCollection, explanation: economyAdvisorBonus > 0 ? '위임된 경제고문의 능력·영향력 보정' : '경제고문 위임 없음', kind: 'revenue' },
    { id: 'dividend', label: '산업지분 배당·국가배당', amount: dividends, explanation: `${state.holdings.length}개 보유지분의 연환산 배당을 주간 배분`, kind: 'revenue' },
  ];
  const financing: EconomyLedgerLine[] = bondProceeds > 0 ? [{ id: 'bond', label: bondPrograms.find((item) => item.id === state.bondProgram)?.name ?? '국채', amount: bondProceeds, explanation: `이번 주 차입 +${bondProceeds}M · 부채에도 같은 금액 계상`, kind: 'financing' }] : [];
  const expenses: EconomyLedgerLine[] = [
    { id: 'factory', label: '군수공장 운영·조달', amount: factoryMaintenance, explanation: `공장 ${game.factories}개 × 1M`, kind: 'expense' },
    { id: 'staff', label: '참모·전문가 급여', amount: staffWeeklyCost, explanation: '현재 임명된 인력의 주간 급여 합계', kind: 'expense' },
    { id: 'interest', label: '국채 이자비용', amount: debtService, explanation: `부채 ${state.debt.toFixed(0)}M × 연 ${(bondRates[state.bondProgram] * 100).toFixed(1)}% ÷ 52주`, kind: 'expense' },
    { id: 'controls', label: '배급·가격통제 행정비', amount: controls, explanation: priceControls.find((item) => item.id === state.priceControl)?.name ?? '', kind: 'expense' },
  ];
  const operatingRevenue = roundMoney(revenues.reduce((total, line) => total + line.amount, 0));
  const totalExpenses = roundMoney(expenses.reduce((total, line) => total + line.amount, 0));
  const netTreasuryChange = roundMoney(operatingRevenue + bondProceeds - totalExpenses);
  const portfolio = getPortfolioMetrics(state);
  return {
    week: context.week,
    revenues,
    financing,
    expenses,
    operatingRevenue,
    financingRaised: bondProceeds,
    totalExpenses,
    netTreasuryChange,
    monthlyProjection: roundMoney(netTreasuryChange * 4.345),
    debtAfter: roundMoney(state.debt + bondProceeds),
    portfolioValue: portfolio.value,
    unrealizedGain: portfolio.unrealizedGain,
  };
}

export type EconomyMarketContext = Pick<EconomyContext, 'week' | 'nationId' | 'game'>;

function sectorSignal(company: HistoricalCompany, context: EconomyMarketContext) {
  const game = context.game;
  if (company.sector === 'aircraft') return (game.airPower - 50) / 900 + (game.enemyPressure - 50) / 1300;
  if (company.sector === 'shipbuilding' || company.sector === 'transport') return (game.navalPower - 50) / 900 - Math.max(0, game.enemyPressure - 72) / 900;
  if (company.sector === 'vehicles' || company.sector === 'steel') return (game.factories - 25) / 700 + (game.warSupport - 50) / 1500;
  if (company.sector === 'consumer') return (game.stability - 55) / 900 - (game.warSupport - 50) / 1600;
  return (game.factories - 25) / 900 + (game.stability - 50) / 1800;
}

function createMonthlyEvent(state: EconomyState, context: EconomyMarketContext): EconomicEvent | null {
  if (context.week === 0 || context.week % 4 !== 0) return null;
  const companies = getAvailableCompanies(context.nationId);
  if (companies.length === 0) return null;
  const selected = companies[Math.floor(stableRoll(`${context.nationId}-${context.week}-event`) * companies.length) % companies.length];
  if (state.debt > 1800 && state.publicConfidence < 55) {
    return { id: `bond-strain-${context.week}`, title: '국채 소화 부진', detail: '금융기관과 가계의 국채 인수 여력이 떨어져 차환 비용과 물가 불안이 커졌습니다.', priceImpact: -0.03, treasuryImpact: -18, inflationImpact: 0.7, confidenceImpact: -5, tone: 'bad' };
  }
  if (context.game.enemyPressure >= 78) {
    return { id: `disruption-${context.week}-${selected.id}`, title: `${selected.name} 생산·수송 차질`, detail: `${selected.riskNote} 해당 위험이 현실화되어 계약 납기와 평가액이 하락했습니다.`, companyId: selected.id, priceImpact: -0.08, treasuryImpact: -8, inflationImpact: 0.25, confidenceImpact: -2, tone: 'bad' };
  }
  if (state.inflation >= 10) {
    return { id: `cost-shock-${context.week}-${selected.id}`, title: `${selected.name} 원가 급등`, detail: '원료·임금·운송비 상승이 계약단가 조정보다 빨라 수익성이 악화됐습니다.', companyId: selected.id, priceImpact: -0.055, treasuryImpact: 0, inflationImpact: 0.35, confidenceImpact: -1.5, tone: 'bad' };
  }
  const contractBoost = selected.ownership === 'resistance-fund' ? 0.045 : 0.07;
  return { id: `contract-${context.week}-${selected.id}`, title: `${selected.name} 신규 조달계약`, detail: '생산능력·납기 신뢰도가 인정되어 장기 조달계약과 설비투자가 승인됐습니다.', companyId: selected.id, priceImpact: contractBoost, treasuryImpact: 5, inflationImpact: 0.08, confidenceImpact: 2, tone: 'good' };
}

/**
 * Updates market quotations and their news history only. Event macroeconomic impacts
 * are returned as metadata, not applied: the caller owns its phase's fiscal model.
 * No taxes, borrowing, dividends, treasury delta, or ledger settlement occur here.
 */
export function advanceEconomyMarketWeek(state: EconomyState, context: EconomyMarketContext) {
  const previousPrices = { ...state.marketPrices };
  const marketPrices = Object.fromEntries(getAvailableCompanies(context.nationId).map((company) => {
    const current = state.marketPrices[company.id] ?? company.basePrice;
    const noise = (stableRoll(`${company.id}-${context.week}`) - 0.5) * company.volatility;
    const confidence = (state.publicConfidence - 50) / 1800;
    const inflationPenalty = Math.max(0, state.inflation - 6) / 1400;
    const next = current * (1 + sectorSignal(company, context) + confidence + noise - inflationPenalty);
    return [company.id, roundMoney(clamp(next, 5, 500))];
  }));
  const event = createMonthlyEvent(state, context);
  if (event?.companyId && marketPrices[event.companyId]) marketPrices[event.companyId] = roundMoney(marketPrices[event.companyId] * (1 + event.priceImpact));
  return {
    state: {
      ...state,
      marketPrices,
      previousPrices,
      eventHistory: event ? [event, ...state.eventHistory].slice(0, 24) : state.eventHistory,
    },
    event,
  };
}

export function advanceEconomyWeek(state: EconomyState, context: EconomyContext) {
  const monetaryResult = advanceMonetarySystem(state.monetarySystem, context.nationId, getCampaignYearForWeek(context.week));
  const marketResult = advanceEconomyMarketWeek(state, context);
  const { event } = marketResult;
  const provisional = { ...marketResult.state, monetarySystem: monetaryResult.state };
  const ledger = calculateEconomyLedger(provisional, context);
  const taxStability = state.taxPolicy === 'relief' ? 0.2 : state.taxPolicy === 'total-war' ? -0.3 : 0;
  const controlInflation = state.priceControl === 'comprehensive' ? -0.22 : state.priceControl === 'targeted' ? -0.06 : 0.18;
  const bondInflation = state.bondProgram === 'central-bank' ? 0.38 : state.bondProgram === 'institutional' ? 0.08 : 0.02;
  const confidenceDelta = state.bondProgram === 'none' ? 0.35 : state.bondProgram === 'central-bank' ? -0.45 : state.bondProgram === 'institutional' ? -0.12 : 0.08;
  const resolvedLedger = {
    ...ledger,
    netTreasuryChange: roundMoney(ledger.netTreasuryChange + (event?.treasuryImpact ?? 0)),
    monthlyProjection: roundMoney((ledger.netTreasuryChange + (event?.treasuryImpact ?? 0)) * 4.345),
  };
  const nextState: EconomyState = {
    ...provisional,
    debt: ledger.debtAfter,
    inflation: roundMoney(clamp(state.inflation + controlInflation + bondInflation + (event?.inflationImpact ?? 0), 0, 100)),
    publicConfidence: roundMoney(clamp(state.publicConfidence + confidenceDelta + taxStability + (event?.confidenceImpact ?? 0), 0, 100)),
    lastLedger: resolvedLedger,
  };
  return {
    state: nextState,
    ledger: resolvedLedger,
    event,
    currencyTransition: monetaryResult.transition,
    gameDelta: {
      treasury: resolvedLedger.netTreasuryChange,
      stability: taxStability + (state.priceControl === 'comprehensive' && state.inflation < 3 ? -0.15 : 0),
    } satisfies Partial<Record<keyof GameState, number>>,
  };
}

export function buyIndustrialStake(state: EconomyState, companyId: string, amount: number) {
  const company = historicalCompanies.find((item) => item.id === companyId);
  const price = state.marketPrices[companyId];
  if (!company || !price || amount < 25) return null;
  const existing = state.holdings.find((holding) => holding.companyId === companyId);
  const existingInvestment = existing?.invested ?? 0;
  const acceptedAmount = roundMoney(Math.min(amount, company.maxInvestment - existingInvestment));
  if (acceptedAmount < 25) return null;
  const units = acceptedAmount / price;
  const holding: CompanyHolding = existing ? {
    ...existing,
    units: existing.units + units,
    invested: existing.invested + acceptedAmount,
    averagePrice: (existing.invested + acceptedAmount) / (existing.units + units),
  } : { companyId, units, invested: acceptedAmount, averagePrice: price };
  return { state: { ...state, holdings: [...state.holdings.filter((item) => item.companyId !== companyId), holding] }, treasuryDelta: -acceptedAmount, amount: acceptedAmount };
}

export function sellIndustrialStake(state: EconomyState, companyId: string, ratio: 0.25 | 0.5 | 1 = 1) {
  const holding = state.holdings.find((item) => item.companyId === companyId);
  const price = state.marketPrices[companyId];
  if (!holding || !price) return null;
  const soldUnits = holding.units * ratio;
  const proceeds = roundMoney(soldUnits * price * 0.98);
  const costBasis = roundMoney(holding.invested * ratio);
  const remainder = ratio === 1 ? [] : [{ ...holding, units: holding.units - soldUnits, invested: holding.invested - costBasis }];
  return {
    state: { ...state, holdings: [...state.holdings.filter((item) => item.companyId !== companyId), ...remainder] },
    treasuryDelta: proceeds,
    proceeds,
    realizedGain: roundMoney(proceeds - costBasis),
  };
}
