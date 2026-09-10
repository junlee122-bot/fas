import type { DiplomaticRelation, NationId } from './types';
import { withJosa } from './koreanGrammar';

export type ExchangePolicy = 'open' | 'managed' | 'restricted' | 'blockaded';
export type CurrencyBacking = 'continuity' | 'foreign-reserve' | 'state-credit';

export interface HistoricalCurrency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  issuer: string;
  issuerNationIds: NationId[];
  unitsPerSterling: number;
  exchangePolicy: ExchangePolicy;
  startYear: number;
  endYear?: number;
  historicalNote: string;
  transitionNote?: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface CustomCurrency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  issuer: string;
  unitsPerSterling: number;
  backing: CurrencyBacking;
  introducedYear: number;
}

export interface CurrencyExchangeRecord {
  id: string;
  week: number;
  side: 'buy' | 'sell';
  currencyId: string;
  baseAmount: number;
  foreignAmount: number;
  feeRate: number;
}

export interface CurrencyTransitionRecord {
  id: string;
  year: number;
  fromCurrencyId: string;
  toCurrencyId: string;
  note: string;
}

export interface MonetarySystemState {
  activeCurrencyId: string;
  historicalAutoTransition: boolean;
  customCurrency: CustomCurrency | null;
  foreignReserves: Record<string, number>;
  exchangeHistory: CurrencyExchangeRecord[];
  transitionHistory: CurrencyTransitionRecord[];
}

export interface CurrencyMetrics {
  inflation: number;
  publicConfidence: number;
}

export interface ExchangeQuote {
  approved: boolean;
  reason: string;
  feeRate: number;
  domesticPerForeign: number;
  foreignPerDomestic: number;
  domesticCurrency: HistoricalCurrency;
  foreignCurrency: HistoricalCurrency;
}

const BOE_CONTROL_SOURCE = 'https://www.bankofengland.co.uk/quarterly-bulletin/1967/q3/the-uk-exchange-control-a-short-history';
const BUNDESBANK_REFORM_SOURCE = 'https://www.bundesbank.de/en/tasks/topics/dates-of-the-german-monetary-policy-detailed-version--626908';
const BOK_FIRST_WON_SOURCE = 'https://www.bok.or.kr/eng/main/contents.do?menuNo=400116';
const BOK_HWAN_SOURCE = 'https://www.bok.or.kr/eng/main/contents.do?menuNo=400117';
const BOK_SECOND_WON_SOURCE = 'https://www.bok.or.kr/eng/main/contents.do?menuNo=400118';
const RBI_SOURCE = 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=14472';
const PBC_SOURCE = 'https://dalian.pbc.gov.cn/dalian/123863/2025031322062624206/index.html';
const BI_SOURCE = 'https://www.bi.go.id/en/tentang-bi/sejarah-bi/default.aspx';
const BSP_SOURCE = 'https://www.bsp.gov.ph/Pages/CoinsAndNotes/HistoryOfPhilippineMoney/HistoryOfPhilippineMoney.aspx/1000';
const SBV_SOURCE = 'https://sbv.gov.vn/documents/20117/185410/237958.pdf';

/**
 * `unitsPerSterling` is a gameplay exchange anchor: nominal millions of the
 * currency represented by one internal real-value unit. 1942 parities and
 * documented redenominations are the starting point; inflation and confidence
 * then move the displayed cross-rate in the alternate timeline.
 */
export const historicalCurrencies: HistoricalCurrency[] = [
  { id: 'gbp', name: '파운드 스털링', code: 'GBP', symbol: '£', issuer: '영란은행·영국 재무부', issuerNationIds: ['britain'], unitsPerSterling: 1, exchangePolicy: 'managed', startYear: 1694, historicalNote: '전시 외환통제 아래 스털링 지역 결제의 중심이지만 자유 태환은 제한됩니다.', sourceTitle: 'Bank of England — UK exchange control history', sourceUrl: BOE_CONTROL_SOURCE },
  { id: 'usd', name: '미국 달러', code: 'USD', symbol: '$', issuer: '미국 재무부·연방준비제도', issuerNationIds: ['usa'], unitsPerSterling: 4.03, exchangePolicy: 'open', startYear: 1792, historicalNote: '전시 조달과 전후 국제결제에서 가장 유동적인 외화입니다.', sourceTitle: 'Federal Reserve History — WWII and its aftermath', sourceUrl: 'https://www.federalreservehistory.org/essays/wwii-and-its-aftermath' },
  { id: 'sur', name: '소비에트 루블', code: 'SUR', symbol: '₽', issuer: '소련 국가은행', issuerNationIds: ['ussr'], unitsPerSterling: 21.5, exchangePolicy: 'blockaded', startYear: 1922, endYear: 1991, historicalNote: '국가계획과 공식 청산계정 안에서 쓰이며 일반 시장 환전은 거의 허용되지 않습니다.', sourceTitle: 'Bank of Russia — history of the central bank', sourceUrl: 'https://www.cbr.ru/eng/about_br/history/' },
  { id: 'rur', name: '러시아 루블', code: 'RUR', symbol: '₽', issuer: '러시아 중앙은행', issuerNationIds: ['ussr'], unitsPerSterling: 2_100, exchangePolicy: 'restricted', startYear: 1992, endYear: 1997, historicalNote: '소련 해체 뒤의 고인플레이션 루블입니다.', transitionNote: '소비에트 루블 체계가 해체되고 러시아 루블로 이행합니다.', sourceTitle: 'Bank of Russia — history of the central bank', sourceUrl: 'https://www.cbr.ru/eng/about_br/history/' },
  { id: 'rub', name: '신 러시아 루블', code: 'RUB', symbol: '₽', issuer: '러시아 중앙은행', issuerNationIds: ['ussr'], unitsPerSterling: 21, exchangePolicy: 'managed', startYear: 1998, historicalNote: '1998년 화폐개혁 뒤의 루블입니다.', transitionNote: '1 신 루블 = 1,000 구 루블로 개칭·절하 단위를 정리합니다.', sourceTitle: 'Bank of Russia — history of the central bank', sourceUrl: 'https://www.cbr.ru/eng/about_br/history/' },
  { id: 'rm', name: '라이히스마르크', code: 'RM', symbol: 'RM', issuer: '독일국가은행', issuerNationIds: ['germany'], unitsPerSterling: 10, exchangePolicy: 'blockaded', startYear: 1924, endYear: 1947, historicalNote: '통제가격과 점령지 청산계정을 통해 운용되는 전시 통화입니다.', sourceTitle: 'Deutsche Bundesbank — monetary-policy dates', sourceUrl: BUNDESBANK_REFORM_SOURCE },
  { id: 'dem', name: '도이체마르크', code: 'DEM', symbol: 'DM', issuer: '서독 중앙은행 체계', issuerNationIds: ['germany'], unitsPerSterling: 11.7, exchangePolicy: 'managed', startYear: 1948, endYear: 1998, historicalNote: '1948년 서부 점령지 화폐개혁의 통화입니다.', transitionNote: '1948년 6월 일반 구권은 명목 100 RM당 10 DM 기준으로 전환됩니다.', sourceTitle: 'Deutsche Bundesbank — monetary-policy dates', sourceUrl: BUNDESBANK_REFORM_SOURCE },
  { id: 'eur', name: '유로', code: 'EUR', symbol: '€', issuer: '유럽 중앙은행 체계', issuerNationIds: ['germany', 'freefrance', 'italy'], unitsPerSterling: 1.45, exchangePolicy: 'open', startYear: 1999, historicalNote: '참여국 공동통화입니다. 대체역사에서는 해당 국가가 역사 자동전환을 유지할 때 등장합니다.', transitionNote: '국가통화 회계단위를 공동통화 유로로 전환합니다.', sourceTitle: 'European Central Bank — euro history', sourceUrl: 'https://www.ecb.europa.eu/euro/intro/html/index.en.html' },
  { id: 'jpy', name: '일본 엔', code: 'JPY', symbol: '¥', issuer: '일본은행', issuerNationIds: ['japan'], unitsPerSterling: 16.5, exchangePolicy: 'blockaded', startYear: 1871, historicalNote: '전시 금융통제와 점령지 군표권을 묶는 기준 통화입니다.', sourceTitle: 'Bank of Japan — outline and history', sourceUrl: 'https://www.boj.or.jp/en/about/outline/' },
  { id: 'fabi', name: '법폐', code: 'FABI', symbol: '法幣', issuer: '중화민국 중앙은행', issuerNationIds: ['china'], unitsPerSterling: 80, exchangePolicy: 'restricted', startYear: 1935, endYear: 1947, historicalNote: '중일전쟁기 중화민국의 법정 불환지폐로 전시 인플레이션에 노출됩니다.', sourceTitle: 'People’s Bank of China — RMB legal history', sourceUrl: PBC_SOURCE },
  { id: 'gju', name: '금원권', code: 'GYU', symbol: '金圓', issuer: '중화민국 중앙은행', issuerNationIds: ['china'], unitsPerSterling: 240_000, exchangePolicy: 'blockaded', startYear: 1948, endYear: 1948, historicalNote: '극심한 인플레이션을 수습하려 발행된 단명한 통화입니다.', transitionNote: '법폐를 금원권으로 개혁하지만 신뢰가 낮으면 빠르게 붕괴할 수 있습니다.', sourceTitle: 'People’s Bank of China — RMB legal history', sourceUrl: PBC_SOURCE },
  { id: 'cny', name: '인민폐·위안', code: 'CNY', symbol: '¥', issuer: '중국인민은행', issuerNationIds: ['china'], unitsPerSterling: 11.3, exchangePolicy: 'restricted', startYear: 1949, historicalNote: '1948년 말 창설된 중국인민은행이 발행을 시작한 통일 통화입니다.', transitionNote: '1948년 12월 시작된 인민폐 발행을 전국 통화로 확대합니다.', sourceTitle: 'People’s Bank of China — RMB legal history', sourceUrl: PBC_SOURCE },
  { id: 'inr', name: '인도 루피', code: 'INR', symbol: '₹', issuer: '인도준비은행', issuerNationIds: ['india'], unitsPerSterling: 13.33, exchangePolicy: 'managed', startYear: 1835, historicalNote: '전시에는 스털링 자산과 연계되고 1939년부터 외환통제를 받습니다.', sourceTitle: 'Reserve Bank of India — institutional history', sourceUrl: RBI_SOURCE },
  { id: 'frf', name: '프랑스 프랑', code: 'FRF', symbol: '₣', issuer: '프랑스은행', issuerNationIds: ['freefrance'], unitsPerSterling: 176, exchangePolicy: 'restricted', startYear: 1795, endYear: 1959, historicalNote: '점령·망명·해방 권역의 복수 결제망 사이에서 운용되는 프랑입니다.', sourceTitle: 'Banque de France — historical exchange tables', sourceUrl: 'https://webstat.banque-france.fr/en/' },
  { id: 'nfr', name: '신 프랑', code: 'NFR', symbol: 'NF', issuer: '프랑스은행', issuerNationIds: ['freefrance'], unitsPerSterling: 8.1, exchangePolicy: 'managed', startYear: 1960, endYear: 1998, historicalNote: '1960년 단위를 정리한 프랑스 신 프랑입니다.', transitionNote: '1 신 프랑 = 100 구 프랑으로 화폐 단위를 개칭합니다.', sourceTitle: 'Banque de France — historical currency tables', sourceUrl: 'https://webstat.banque-france.fr/en/' },
  { id: 'itl', name: '이탈리아 리라', code: 'ITL', symbol: '₤', issuer: '이탈리아은행', issuerNationIds: ['italy'], unitsPerSterling: 80, exchangePolicy: 'blockaded', startYear: 1861, endYear: 1998, historicalNote: '전시 통제와 배급경제 아래 운용되는 리라입니다.', sourceTitle: 'Banca d’Italia — history', sourceUrl: 'https://www.bancaditalia.it/chi-siamo/storia/index.html?com.dotmarketing.htmlpage.language=1' },
  { id: 'kjy', name: '조선은행권 엔', code: 'KJY', symbol: '圓', issuer: '조선은행', issuerNationIds: ['korea'], unitsPerSterling: 16.5, exchangePolicy: 'blockaded', startYear: 1910, endYear: 1944, historicalNote: '식민지 조선에서 일본 엔과 등가로 강제 유통된 조선은행권입니다.', sourceTitle: 'Bank of Korea — Currency in Korea', sourceUrl: BOK_FIRST_WON_SOURCE },
  { id: 'krw1', name: '제1차 원', code: 'KRW-I', symbol: '圜', issuer: '조선은행·한국은행', issuerNationIds: ['korea'], unitsPerSterling: 60, exchangePolicy: 'restricted', startYear: 1945, endYear: 1952, historicalNote: '해방 뒤 원 표시 통화로, 전쟁과 물가상승의 압박을 받습니다.', transitionNote: '식민지 은행권을 독립국의 원 표시 통화로 교체합니다.', sourceTitle: 'Bank of Korea — Won (1950–1953)', sourceUrl: BOK_FIRST_WON_SOURCE },
  { id: 'krh', name: '환', code: 'KRH', symbol: '圜', issuer: '한국은행', issuerNationIds: ['korea'], unitsPerSterling: 168, exchangePolicy: 'restricted', startYear: 1953, endYear: 1961, historicalNote: '한국전쟁기 인플레이션 수습을 위해 도입된 환입니다.', transitionNote: '1953년 2월 100 구 원을 1환으로 전환합니다.', sourceTitle: 'Bank of Korea — Hwan (1953–1962)', sourceUrl: BOK_HWAN_SOURCE },
  { id: 'krw', name: '대한민국 원', code: 'KRW', symbol: '₩', issuer: '한국은행', issuerNationIds: ['korea'], unitsPerSterling: 364, exchangePolicy: 'managed', startYear: 1962, historicalNote: '1962년 긴급통화조치 뒤의 원입니다.', transitionNote: '1962년 6월 10환을 1원으로 전환합니다.', sourceTitle: 'Bank of Korea — Won (1962–present)', sourceUrl: BOK_SECOND_WON_SOURCE },
  { id: 'pic', name: '인도차이나 피아스트르', code: 'PIC', symbol: 'P', issuer: '인도차이나은행', issuerNationIds: ['vietnam'], unitsPerSterling: 17.6, exchangePolicy: 'restricted', startYear: 1885, endYear: 1950, historicalNote: '프랑스령 인도차이나와 점령경제에서 쓰인 피아스트르입니다.', sourceTitle: 'State Bank of Vietnam — history of Vietnamese currency', sourceUrl: SBV_SOURCE },
  { id: 'vnd', name: '베트남 동', code: 'VND', symbol: '₫', issuer: '베트남 국가은행', issuerNationIds: ['vietnam'], unitsPerSterling: 52, exchangePolicy: 'restricted', startYear: 1951, historicalNote: '1951년 독립 국가은행 창설과 함께 등장한 동입니다.', transitionNote: '독립 통화 동을 발행해 식민지 피아스트르 결제권에서 이탈합니다.', sourceTitle: 'State Bank of Vietnam — history of Vietnamese currency', sourceUrl: SBV_SOURCE },
  { id: 'nig', name: '네덜란드령 인도 굴덴', code: 'NIG', symbol: 'ƒ', issuer: '자바은행·점령 군정', issuerNationIds: ['indonesia'], unitsPerSterling: 7.6, exchangePolicy: 'blockaded', startYear: 1828, endYear: 1945, historicalNote: '식민지 굴덴과 일본 점령권이 충돌하는 군도 결제권입니다.', sourceTitle: 'Bank Indonesia — institutional history', sourceUrl: BI_SOURCE },
  { id: 'idr', name: '공화국 루피아·ORI', code: 'IDR', symbol: 'Rp', issuer: '인도네시아 공화국', issuerNationIds: ['indonesia'], unitsPerSterling: 13.5, exchangePolicy: 'restricted', startYear: 1946, historicalNote: '1946년 10월 유통을 시작한 공화국 독립통화입니다.', transitionNote: 'Oeang Republik Indonesia를 발행해 식민지·점령 통화와 통화주권 경쟁에 들어갑니다.', sourceTitle: 'Bank Indonesia — early independence currency', sourceUrl: BI_SOURCE },
  { id: 'jpp', name: '일본 점령지 페소', code: 'JPP', symbol: '₱', issuer: '일본 군정', issuerNationIds: ['philippines'], unitsPerSterling: 8.06, exchangePolicy: 'blockaded', startYear: 1942, endYear: 1944, historicalNote: '점령 당국 발행권과 게릴라 비상화폐가 경쟁하는 페소권입니다.', sourceTitle: 'Bangko Sentral ng Pilipinas — history of Philippine money', sourceUrl: BSP_SOURCE },
  { id: 'php', name: '필리핀 페소', code: 'PHP', symbol: '₱', issuer: '필리핀 중앙은행 체계', issuerNationIds: ['philippines'], unitsPerSterling: 8.06, exchangePolicy: 'managed', startYear: 1945, historicalNote: '해방 뒤 승리 표기권과 공화국 통화로 이어지는 페소입니다.', transitionNote: '점령지 발행권을 회수하고 영연방·공화국 페소로 복귀합니다.', sourceTitle: 'Bangko Sentral ng Pilipinas — history of Philippine money', sourceUrl: BSP_SOURCE },
];

const timelineIds: Record<NationId, string[]> = {
  britain: ['gbp'], usa: ['usd'], ussr: ['sur', 'rur', 'rub'], germany: ['rm', 'dem', 'eur'], japan: ['jpy'],
  china: ['fabi', 'gju', 'cny'], india: ['inr'], freefrance: ['frf', 'nfr', 'eur'], italy: ['itl', 'eur'],
  korea: ['kjy', 'krw1', 'krh', 'krw'], vietnam: ['pic', 'vnd'], indonesia: ['nig', 'idr'], philippines: ['jpp', 'php'],
};

const byId = new Map(historicalCurrencies.map((currency) => [currency.id, currency]));

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function getHistoricalCurrency(nationId: NationId, year: number) {
  const timeline = timelineIds[nationId].map((id) => byId.get(id)!).filter(Boolean);
  return timeline.find((currency) => year >= currency.startYear && year <= (currency.endYear ?? Number.POSITIVE_INFINITY))
    ?? timeline.filter((currency) => currency.startYear <= year).at(-1)
    ?? timeline[0];
}

export function createMonetarySystem(nationId: NationId, year = 1942): MonetarySystemState {
  return {
    activeCurrencyId: getHistoricalCurrency(nationId, year).id,
    historicalAutoTransition: true,
    customCurrency: null,
    foreignReserves: {},
    exchangeHistory: [],
    transitionHistory: [],
  };
}

export function normalizeMonetarySystem(value: Partial<MonetarySystemState> | null | undefined, nationId: NationId, year = 1942): MonetarySystemState {
  const fallback = createMonetarySystem(nationId, year);
  const custom = value?.customCurrency && typeof value.customCurrency.name === 'string' && Number.isFinite(value.customCurrency.unitsPerSterling)
    ? { ...value.customCurrency, unitsPerSterling: clamp(Number(value.customCurrency.unitsPerSterling), 0.000001, 1_000_000_000) }
    : null;
  const validActiveId = typeof value?.activeCurrencyId === 'string' && ((Boolean(custom) && value.activeCurrencyId === custom?.id) || timelineIds[nationId].includes(value.activeCurrencyId));
  const foreignReserves = Object.fromEntries(Object.entries(value?.foreignReserves ?? {}).filter(([id, amount]) => byId.has(id) && Number.isFinite(amount) && amount > 0).map(([id, amount]) => [id, Number(amount)]));
  return {
    activeCurrencyId: validActiveId ? value!.activeCurrencyId! : fallback.activeCurrencyId,
    historicalAutoTransition: typeof value?.historicalAutoTransition === 'boolean' ? value.historicalAutoTransition : fallback.historicalAutoTransition,
    customCurrency: custom,
    foreignReserves,
    exchangeHistory: Array.isArray(value?.exchangeHistory) ? value.exchangeHistory.filter((item) => byId.has(item.currencyId)).slice(0, 30) : [],
    transitionHistory: Array.isArray(value?.transitionHistory) ? value.transitionHistory.slice(0, 20) : [],
  };
}

export function resolveActiveCurrency(system: MonetarySystemState, nationId: NationId, year: number): HistoricalCurrency {
  if (system.customCurrency && system.activeCurrencyId === system.customCurrency.id) {
    return {
      id: system.customCurrency.id,
      name: system.customCurrency.name,
      code: system.customCurrency.code,
      symbol: system.customCurrency.symbol,
      issuer: system.customCurrency.issuer,
      issuerNationIds: [nationId],
      unitsPerSterling: system.customCurrency.unitsPerSterling,
      exchangePolicy: system.customCurrency.backing === 'foreign-reserve' ? 'managed' : system.customCurrency.backing === 'state-credit' ? 'restricted' : 'managed',
      startYear: system.customCurrency.introducedYear,
      historicalNote: '사용자가 이 세계선에서 창설한 주권 통화입니다.',
      sourceTitle: '대체역사 통화헌장',
      sourceUrl: '',
    };
  }
  return byId.get(system.activeCurrencyId) ?? getHistoricalCurrency(nationId, year);
}

export function getEffectiveUnitsPerSterling(currency: HistoricalCurrency, metrics: CurrencyMetrics, isDomestic = false) {
  if (!isDomestic) return currency.unitsPerSterling;
  const inflationPressure = Math.max(0, metrics.inflation - 4) * 0.018;
  const confidencePressure = Math.max(0, 60 - metrics.publicConfidence) * 0.006;
  return currency.unitsPerSterling * clamp(1 + inflationPressure + confidencePressure, 0.4, 4.5);
}

function formatKoreanUnits(nominalMillions: number, maximumFractionDigits = 1) {
  const absoluteUnits = Math.abs(nominalMillions) * 1_000_000;
  const compactFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits });
  if (absoluteUnits >= 1_000_000_000_000) return `${compactFormatter.format(absoluteUnits / 1_000_000_000_000)}조`;
  if (absoluteUnits >= 100_000_000) return `${compactFormatter.format(absoluteUnits / 100_000_000)}억`;
  if (absoluteUnits >= 10_000) return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(absoluteUnits / 10_000)}만`;
  return compactFormatter.format(absoluteUnits);
}

export function formatForeignCurrency(nominalMillions: number, currency: Pick<HistoricalCurrency, 'symbol'>, options: { exact?: boolean; maximumFractionDigits?: number } = {}) {
  const amount = options.exact
    ? `${Math.abs(nominalMillions).toLocaleString('ko-KR', { maximumFractionDigits: options.maximumFractionDigits ?? 1 })}M`
    : formatKoreanUnits(nominalMillions, options.maximumFractionDigits ?? 1);
  return `${currency.symbol}${currency.symbol.length > 1 ? ' ' : ''}${amount}`;
}

export function formatNationalCurrency(
  baseValue: number,
  system: MonetarySystemState,
  nationId: NationId,
  year: number,
  metrics: CurrencyMetrics,
  options: { signed?: boolean; exact?: boolean; maximumFractionDigits?: number } = {},
) {
  const currency = resolveActiveCurrency(system, nationId, year);
  const nominalMillions = baseValue * getEffectiveUnitsPerSterling(currency, metrics, true);
  const sign = baseValue < 0 ? '−' : options.signed && baseValue > 0 ? '+' : '';
  return `${sign}${formatForeignCurrency(nominalMillions, currency, options)}`;
}

export function getForeignCurrencies(nationId: NationId, year: number) {
  const ids = new Set<string>();
  return (Object.keys(timelineIds) as NationId[])
    .filter((id) => id !== nationId)
    .map((id) => getHistoricalCurrency(id, year))
    .filter((currency) => !ids.has(currency.id) && Boolean(ids.add(currency.id)));
}

function relationWithIssuer(currency: HistoricalCurrency, relations: DiplomaticRelation[]) {
  const values = currency.issuerNationIds.map((id) => relations.find((relation) => relation.id === id)?.value).filter((value): value is number => typeof value === 'number');
  return values.length ? Math.max(...values) : 45;
}

export function getExchangeQuote(
  system: MonetarySystemState,
  nationId: NationId,
  foreignCurrencyId: string,
  year: number,
  metrics: CurrencyMetrics,
  relations: DiplomaticRelation[],
): ExchangeQuote | null {
  const foreignCurrency = byId.get(foreignCurrencyId);
  if (!foreignCurrency) return null;
  const domesticCurrency = resolveActiveCurrency(system, nationId, year);
  const relation = relationWithIssuer(foreignCurrency, relations);
  const customPenalty = Boolean(system.customCurrency && system.activeCurrencyId === system.customCurrency.id);
  let approved = true;
  let reason = '중앙은행 승인';
  if (relation < 25) {
    approved = false;
    reason = '교전·제재 관계로 승인은행이 결제를 거부했습니다.';
  } else if (foreignCurrency.exchangePolicy === 'blockaded' && relation < 65) {
    approved = false;
    reason = '적성·폐쇄 결제권이 태환을 거부했습니다.';
  } else if (foreignCurrency.exchangePolicy === 'restricted' && relation < 48) {
    approved = false;
    reason = '외환배정 협정 또는 외교관계가 부족합니다.';
  } else if (foreignCurrency.exchangePolicy === 'managed' && relation < 28) {
    approved = false;
    reason = '교전·제재 관계로 승인은행이 결제를 거부했습니다.';
  } else if (customPenalty && metrics.publicConfidence < 35) {
    approved = false;
    reason = '신설 통화의 신뢰가 낮아 상대 중앙은행이 받지 않습니다.';
  } else if (metrics.inflation >= 35 && foreignCurrency.exchangePolicy !== 'open') {
    approved = false;
    reason = '고인플레이션 국가에 대한 외환배정이 중단됐습니다.';
  } else if (foreignCurrency.exchangePolicy === 'open') {
    reason = relation < 45 ? '개방시장에서 고위험 가산금리로 승인' : '개방시장 즉시 승인';
  } else if (foreignCurrency.exchangePolicy === 'managed') {
    reason = '공인은행 한도 내 승인';
  } else {
    reason = '외교·무역 목적 특별배정 승인';
  }

  const policySpread = foreignCurrency.exchangePolicy === 'open' ? 0.015 : foreignCurrency.exchangePolicy === 'managed' ? 0.028 : foreignCurrency.exchangePolicy === 'restricted' ? 0.05 : 0.075;
  const relationSpread = Math.max(0, 60 - relation) * 0.0007;
  const stabilitySpread = Math.max(0, metrics.inflation - 8) * 0.001 + Math.max(0, 55 - metrics.publicConfidence) * 0.0008;
  const customSpread = customPenalty ? (system.customCurrency?.backing === 'foreign-reserve' ? 0.01 : 0.03) : 0;
  const feeRate = round(clamp(policySpread + relationSpread + stabilitySpread + customSpread, 0.01, 0.18), 4);
  const domesticRate = getEffectiveUnitsPerSterling(domesticCurrency, metrics, true);
  const foreignRate = getEffectiveUnitsPerSterling(foreignCurrency, metrics, false);
  return {
    approved,
    reason,
    feeRate,
    domesticPerForeign: domesticRate / foreignRate,
    foreignPerDomestic: foreignRate / domesticRate,
    domesticCurrency,
    foreignCurrency,
  };
}

export function buyForeignCurrency(
  system: MonetarySystemState,
  nationId: NationId,
  foreignCurrencyId: string,
  baseAmount: number,
  year: number,
  week: number,
  metrics: CurrencyMetrics,
  relations: DiplomaticRelation[],
) {
  const quote = getExchangeQuote(system, nationId, foreignCurrencyId, year, metrics, relations);
  if (!quote || !quote.approved || baseAmount <= 0) return null;
  const foreignAmount = round(baseAmount * quote.foreignCurrency.unitsPerSterling * (1 - quote.feeRate), 3);
  const record: CurrencyExchangeRecord = { id: `fx-buy-${week}-${foreignCurrencyId}-${system.exchangeHistory.length}`, week, side: 'buy', currencyId: foreignCurrencyId, baseAmount: round(baseAmount), foreignAmount, feeRate: quote.feeRate };
  return {
    state: {
      ...system,
      foreignReserves: { ...system.foreignReserves, [foreignCurrencyId]: round((system.foreignReserves[foreignCurrencyId] ?? 0) + foreignAmount, 3) },
      exchangeHistory: [record, ...system.exchangeHistory].slice(0, 30),
    },
    treasuryDelta: -baseAmount,
    foreignAmount,
    quote,
  };
}

export function sellForeignCurrency(
  system: MonetarySystemState,
  nationId: NationId,
  foreignCurrencyId: string,
  ratio: 0.5 | 1,
  year: number,
  week: number,
  metrics: CurrencyMetrics,
  relations: DiplomaticRelation[],
) {
  const quote = getExchangeQuote(system, nationId, foreignCurrencyId, year, metrics, relations);
  const holding = system.foreignReserves[foreignCurrencyId] ?? 0;
  const currency = byId.get(foreignCurrencyId);
  if (!quote || !currency || holding <= 0) return null;
  const foreignAmount = round(holding * ratio, 3);
  const feeRate = quote.approved ? quote.feeRate : Math.min(0.18, quote.feeRate + 0.04);
  const baseAmount = round((foreignAmount / currency.unitsPerSterling) * (1 - feeRate));
  const remaining = round(holding - foreignAmount, 3);
  const reserves = { ...system.foreignReserves };
  if (remaining > 0.001) reserves[foreignCurrencyId] = remaining;
  else delete reserves[foreignCurrencyId];
  const record: CurrencyExchangeRecord = { id: `fx-sell-${week}-${foreignCurrencyId}-${system.exchangeHistory.length}`, week, side: 'sell', currencyId: foreignCurrencyId, baseAmount, foreignAmount, feeRate };
  return {
    state: { ...system, foreignReserves: reserves, exchangeHistory: [record, ...system.exchangeHistory].slice(0, 30) },
    treasuryDelta: baseAmount,
    foreignAmount,
    quote: { ...quote, feeRate },
  };
}

export function getForeignReserveValue(system: MonetarySystemState) {
  return round(Object.entries(system.foreignReserves).reduce((total, [id, amount]) => total + amount / (byId.get(id)?.unitsPerSterling ?? Number.POSITIVE_INFINITY), 0));
}

export function issueCustomCurrency(
  system: MonetarySystemState,
  nationId: NationId,
  year: number,
  name: string,
  symbol: string,
  backing: CurrencyBacking,
  metrics: CurrencyMetrics,
) {
  const current = resolveActiveCurrency(system, nationId, year);
  const confidenceFactor = clamp(1 + Math.max(0, 55 - metrics.publicConfidence) * 0.008 + Math.max(0, metrics.inflation - 8) * 0.012, 0.7, 2.5);
  const backingFactor = backing === 'foreign-reserve' ? 0.92 : backing === 'state-credit' ? 1.24 : 1;
  const cleanedName = name.trim().slice(0, 24) || '신 국가통화';
  const cleanedSymbol = symbol.trim().slice(0, 4) || '¤';
  const id = `custom-${nationId}-${year}`;
  const customCurrency: CustomCurrency = {
    id,
    name: cleanedName,
    code: cleanedName.replace(/[^A-Za-z0-9가-힣]/g, '').slice(0, 5).toUpperCase() || 'NEW',
    symbol: cleanedSymbol,
    issuer: '사용자 설계 중앙은행',
    unitsPerSterling: round(current.unitsPerSterling * confidenceFactor * backingFactor, 6),
    backing,
    introducedYear: year,
  };
  const transition: CurrencyTransitionRecord = {
    id: `currency-custom-${year}-${system.transitionHistory.length}`,
    year,
    fromCurrencyId: current.id,
    toCurrencyId: id,
    note: `${cleanedName} 발행. ${backing === 'foreign-reserve' ? '외환준비금 태환' : backing === 'state-credit' ? '국가신용·관리변동' : '기존 구매력 연속'} 원칙을 채택했습니다.`,
  };
  return { ...system, activeCurrencyId: id, historicalAutoTransition: false, customCurrency, transitionHistory: [transition, ...system.transitionHistory].slice(0, 20) };
}

export function restoreHistoricalCurrency(system: MonetarySystemState, nationId: NationId, year: number) {
  const historical = getHistoricalCurrency(nationId, year);
  const currentId = system.activeCurrencyId;
  if (currentId === historical.id && system.historicalAutoTransition) return system;
  return {
    ...system,
    activeCurrencyId: historical.id,
    historicalAutoTransition: true,
    transitionHistory: [{
      id: `currency-restore-${year}-${system.transitionHistory.length}`,
      year,
      fromCurrencyId: currentId,
      toCurrencyId: historical.id,
      note: `${year}년 역사 기본 통화 ${withJosa(historical.name, '으로/로')} 복귀했습니다.`,
    }, ...system.transitionHistory].slice(0, 20),
  };
}

export function advanceMonetarySystem(system: MonetarySystemState, nationId: NationId, year: number) {
  if (!system.historicalAutoTransition) return { state: system, transition: null as CurrencyTransitionRecord | null };
  const historical = getHistoricalCurrency(nationId, year);
  if (historical.id === system.activeCurrencyId) return { state: system, transition: null as CurrencyTransitionRecord | null };
  const previous = resolveActiveCurrency(system, nationId, year - 1);
  const transition: CurrencyTransitionRecord = {
    id: `currency-auto-${year}-${system.transitionHistory.length}`,
    year,
    fromCurrencyId: system.activeCurrencyId,
    toCurrencyId: historical.id,
    note: historical.transitionNote ?? `${previous.name}에서 ${withJosa(historical.name, '으로/로')} 통화 명칭과 발권체계를 변경했습니다.`,
  };
  return {
    state: { ...system, activeCurrencyId: historical.id, transitionHistory: [transition, ...system.transitionHistory].slice(0, 20) },
    transition,
  };
}

export function getCurrencyById(id: string) {
  return byId.get(id) ?? null;
}
