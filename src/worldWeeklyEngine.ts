import type { EconomyState } from './economy';
import { deriveFrontSummaries } from './mapPresentation';
import type { PublicHealthState } from './publicHealth';
import { strategicFronts } from './strategicMapData';
import type {
  BattleReport,
  CovertOperation,
  DiplomaticRelation,
  Faction,
  GameState,
  GameTab,
  NationId,
  ResearchProject,
  Territory,
  WarEvent,
} from './types';
import type { GeneratedWorldline } from './worldHistory';

export type WorldNewsCategory = 'front' | 'diplomacy' | 'economy' | 'society' | 'science' | 'intelligence';
export type WorldNewsConfidence = 'confirmed' | 'assessed' | 'rumor';
export type WorldNewsTone = 'positive' | 'negative' | 'neutral';

export interface WorldNewsSignal {
  label: string;
  value: string;
  tone: WorldNewsTone;
}

export interface WorldNewsArticle {
  id: string;
  category: WorldNewsCategory;
  region: string;
  headline: string;
  summary: string;
  cause: string;
  consequence: string;
  confidence: WorldNewsConfidence;
  priority: number;
  tone: WorldNewsTone;
  signals: WorldNewsSignal[];
  actionTab: GameTab;
  actionLabel: string;
  sourceEventId?: number;
}

export interface WorldWeeklyMetrics {
  activeFronts: number;
  battleCount: number;
  territoryChanges: number;
  treasuryChange: number;
  relationAverage: number;
  healthRisk: number;
  eventCount: number;
  intelligence: number;
}

export interface WorldWeeklyIssue {
  id: string;
  week: number;
  edition: number;
  dateRange: string;
  worldlineCode: string;
  worldlineTitle: string;
  leadArticleId: string;
  articles: WorldNewsArticle[];
  metrics: WorldWeeklyMetrics;
}

export interface WorldWeeklyContext {
  week: number;
  nation: { id: NationId; shortName: string };
  playerFaction: Exclude<Faction, 'neutral'>;
  game: Pick<GameState, 'stability' | 'warSupport' | 'treasury' | 'intelNetwork' | 'enemyPressure'>;
  territories: Territory[];
  events: WarEvent[];
  battleReports: BattleReport[];
  relations: DiplomaticRelation[];
  economy: EconomyState;
  publicHealth: PublicHealthState;
  research: ResearchProject[];
  operations: CovertOperation[];
  worldline: Pick<GeneratedWorldline, 'code' | 'title' | 'primaryBloc' | 'rivalBloc' | 'rivalryName'>;
}

export const worldNewsCategoryMeta: Record<WorldNewsCategory, { label: string; desk: string; tab: GameTab; action: string }> = {
  front: { label: '전선', desk: 'WAR DESK', tab: 'map', action: '전황 지도에서 확인' },
  diplomacy: { label: '외교', desk: 'FOREIGN DESK', tab: 'diplomacy', action: '외교부로 이동' },
  economy: { label: '경제', desk: 'MARKETS & INDUSTRY', tab: 'economy', action: '전시 재무성으로 이동' },
  society: { label: '사회·보건', desk: 'HOME & HEALTH', tab: 'health', action: '보건 위기실로 이동' },
  science: { label: '과학·기술', desk: 'SCIENCE', tab: 'research', action: '연구개발국으로 이동' },
  intelligence: { label: '정보', desk: 'INTELLIGENCE', tab: 'intelligence', action: '정보국으로 이동' },
};

const categoryOrder: WorldNewsCategory[] = ['front', 'diplomacy', 'economy', 'society', 'science', 'intelligence'];

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
const signed = (value: number, digits = 0) => `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));

function campaignDate(week: number) {
  const date = new Date(Date.UTC(1942, 9, 25 + week * 7));
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function categoryForEvent(event: WarEvent): WorldNewsCategory {
  const text = `${event.title} ${event.detail}`;
  if (/보건|감염|유행|병상|민생|피로|배급|사망|방역/.test(text)) return 'society';
  if (/연구|과학|기술|장비 개발|시제품|원자|핵/.test(text)) return 'science';
  if (/정보|암호|첩보|비밀|스파이|요원|공작|CIA|울트라/.test(text)) return 'intelligence';
  if (/외교|동맹|관계|협상|회담|조약|전후질서|국제/.test(text)) return 'diplomacy';
  if (/재정|경제|국채|시장|기업|산업|생산|공장|물가|인플레이션/.test(text) || event.trace?.domain === 'management') return 'economy';
  if (/전선|공세|반격|전투|돌파|격퇴|집결|전황|점령|해방|교두보/.test(text) || event.trace?.domain === 'operations') return 'front';
  return event.trace?.domain === 'diplomacy' || event.trace?.domain === 'history' ? 'diplomacy' : 'society';
}

function eventPriority(event: WarEvent, category: WorldNewsCategory) {
  let score = event.tone === 'bad' ? 86 : event.tone === 'good' ? 72 : 58;
  if (category === 'front') score += 7;
  if (category === 'society' && /비상|대유행|사망/.test(`${event.title} ${event.detail}`)) score += 10;
  if (/주간 지휘 결산/.test(event.title)) score -= 24;
  if (/세계 전황/.test(event.title)) score -= 12;
  return clamp(score, 25, 99);
}

function confidenceForEvent(event: WarEvent, intelligence: number): WorldNewsConfidence {
  if (event.trace?.certainty === 'confirmed') return 'confirmed';
  if (event.trace?.certainty === 'forecast') return 'rumor';
  if (event.trace?.certainty === 'developing') return 'assessed';
  if (categoryForEvent(event) === 'intelligence') return intelligence >= 72 ? 'confirmed' : intelligence >= 42 ? 'assessed' : 'rumor';
  return 'confirmed';
}

function toneForEvent(event: WarEvent): WorldNewsTone {
  return event.tone === 'good' ? 'positive' : event.tone === 'bad' ? 'negative' : 'neutral';
}

function inferRegion(event: WarEvent, territories: Territory[]) {
  const territory = territories.find((candidate) => event.title.includes(candidate.name) || event.detail.includes(candidate.name));
  if (territory) return territory.region;
  if (/태평양|중국|버마|인도|조선|일본|동남아/.test(`${event.title} ${event.detail}`)) return '아시아·태평양';
  if (/유럽|지중해|대서양|북아프리카|독일|프랑스|이탈리아/.test(`${event.title} ${event.detail}`)) return '유럽·대서양';
  return '세계';
}

function articleFromEvent(event: WarEvent, context: WorldWeeklyContext, category: WorldNewsCategory): WorldNewsArticle {
  const meta = worldNewsCategoryMeta[category];
  const tone = toneForEvent(event);
  const signals = (event.trace?.effects ?? []).slice(0, 3).map((effect) => ({
    label: effect.label,
    value: effect.value,
    tone: effect.tone,
  }));
  return {
    id: `ww-${context.week}-${category}-${event.id}`,
    category,
    region: inferRegion(event, context.territories),
    headline: event.title,
    summary: event.detail,
    cause: event.trace?.trigger ?? event.trace?.decision ?? '이번 주의 작전·정책 판정과 세계선 조건이 함께 작용했습니다.',
    consequence: event.trace?.ongoing?.[0] ?? event.trace?.nextActions?.[0] ?? '이 변화는 다음 주 전황과 국가 지표 계산에 이어집니다.',
    confidence: confidenceForEvent(event, context.game.intelNetwork),
    priority: eventPriority(event, category),
    tone,
    signals: signals.length > 0 ? signals : [{ label: '판정', value: event.tone === 'good' ? '유리' : event.tone === 'bad' ? '불리' : '전개 중', tone }],
    actionTab: meta.tab,
    actionLabel: meta.action,
    sourceEventId: event.id,
  };
}

function baselineFront(context: WorldWeeklyContext): WorldNewsArticle {
  const fronts = deriveFrontSummaries(context.territories, strategicFronts, context.playerFaction);
  const activeFronts = fronts.filter((front) => front.activeContacts > 0);
  const lead = activeFronts[0] ?? fronts[0];
  if (!lead) {
    return {
      id: `ww-${context.week}-front-baseline`, category: 'front', region: '전 세계', headline: '접촉선 변동 없음',
      summary: '이번 주 확인된 직접 교전 접촉선은 없습니다.', cause: '가용 전구 자료에서 적대 세력의 인접 접촉이 탐지되지 않았습니다.',
      consequence: '재배치와 보급 회복에 유리하지만 정보 공백 여부를 함께 확인해야 합니다.', confidence: 'assessed', priority: 38, tone: 'neutral',
      signals: [{ label: '활성 전선', value: '0', tone: 'neutral' }], actionTab: 'map', actionLabel: '전황 지도에서 확인',
    };
  }
  const region = lead.theater === 'asia' ? '아시아·태평양' : '유럽·지중해';
  const tone: WorldNewsTone = lead.status === '위기' ? 'negative' : lead.status === '우세' ? 'positive' : 'neutral';
  return {
    id: `ww-${context.week}-front-${lead.id}`, category: 'front', region, headline: `${lead.name}, ${lead.status} 국면 지속`,
    summary: `${lead.commandArea}에서 ${lead.activeContacts}개 접촉선이 활성화됐고, 아군 통제율은 ${lead.controlPercent}%입니다. 평균 보급은 ${lead.averageSupply}%입니다.`,
    cause: `적대 인접선 ${lead.activeContacts}곳과 현지 보급 상태를 합산해 전선 강도 ${lead.intensity}/100으로 판정했습니다.`,
    consequence: lead.status === '위기' ? '보급을 보강하지 않으면 다음 적 공세의 우선 목표가 될 가능성이 큽니다.' : lead.status === '우세' ? '주도권을 공세로 전환할 여지가 있지만 접촉선 확대에 따른 보급 소모를 감수해야 합니다.' : '소규모 변화가 전선 전체의 우세를 바꿀 수 있는 경합 상태입니다.',
    confidence: context.game.intelNetwork >= 70 ? 'confirmed' : 'assessed', priority: 66 + Math.round(lead.intensity / 5), tone,
    signals: [
      { label: '접촉선', value: `${lead.activeContacts}곳`, tone: lead.activeContacts >= 4 ? 'negative' : 'neutral' },
      { label: '아군 통제', value: `${lead.controlPercent}%`, tone: lead.controlPercent >= 55 ? 'positive' : lead.controlPercent < 35 ? 'negative' : 'neutral' },
      { label: '평균 보급', value: `${lead.averageSupply}%`, tone: lead.averageSupply >= 65 ? 'positive' : lead.averageSupply < 45 ? 'negative' : 'neutral' },
    ], actionTab: 'map', actionLabel: '전황 지도에서 확인',
  };
}

function baselineDiplomacy(context: WorldWeeklyContext): WorldNewsArticle {
  const relations = [...context.relations].sort((left, right) => left.value - right.value);
  const strained = relations[0];
  const closest = relations[relations.length - 1];
  const average = relations.length ? Math.round(relations.reduce((sum, relation) => sum + relation.value, 0) / relations.length) : 50;
  const tone: WorldNewsTone = average < 40 ? 'negative' : average >= 65 ? 'positive' : 'neutral';
  return {
    id: `ww-${context.week}-diplomacy-baseline`, category: 'diplomacy', region: '국제면',
    headline: strained ? `${strained.name} 관계가 외교 위험선 형성` : `${context.worldline.rivalryName}, 세력권 재편 진행`,
    summary: strained && closest ? `${closest.name}와의 관계는 ${closest.value}/100으로 가장 안정적이며, ${strained.name}와의 관계는 ${strained.value}/100으로 가장 긴장돼 있습니다. 전체 평균은 ${average}/100입니다.` : `${context.worldline.primaryBloc}과 ${context.worldline.rivalBloc}의 경쟁이 국제 의제를 규정하고 있습니다.`,
    cause: '현재 외교관계 수치와 대체지구의 양대 세력 구도를 함께 비교했습니다.',
    consequence: average < 40 ? '교역·정보 공유·공동작전 비용이 커질 수 있어 관계 회복 의제가 필요합니다.' : '가장 취약한 양자관계가 다음 국제 위기의 진입점이 될 수 있습니다.',
    confidence: 'assessed', priority: average < 40 ? 76 : 48, tone,
    signals: [
      { label: '관계 평균', value: `${average}/100`, tone },
      ...(strained ? [{ label: '최저 관계', value: `${strained.name} ${strained.value}`, tone: 'negative' as const }] : []),
      ...(closest ? [{ label: '최고 관계', value: `${closest.name} ${closest.value}`, tone: 'positive' as const }] : []),
    ], actionTab: 'diplomacy', actionLabel: '외교부로 이동',
  };
}

function baselineEconomy(context: WorldWeeklyContext): WorldNewsArticle {
  const ledger = context.economy.lastLedger;
  const balance = ledger?.netTreasuryChange ?? 0;
  const operating = ledger ? ledger.operatingRevenue - ledger.totalExpenses : 0;
  const tone: WorldNewsTone = balance < 0 || context.economy.inflation >= 10 ? 'negative' : balance > 0 ? 'positive' : 'neutral';
  return {
    id: `ww-${context.week}-economy-baseline`, category: 'economy', region: `${context.nation.shortName}·세계시장`,
    headline: ledger ? `전시 재정 ${signed(balance, 1)}M, ${balance < 0 ? '적자 압력 확대' : '주간 유동성 확보'}` : '전시 재정 첫 장부 편성 중',
    summary: ledger ? `세입 ${ledger.operatingRevenue.toFixed(1)}M, 국채 등 조달 ${ledger.financingRaised.toFixed(1)}M, 지출 ${ledger.totalExpenses.toFixed(1)}M으로 마감했습니다. 부채는 ${ledger.debtAfter.toFixed(1)}M, 물가는 ${context.economy.inflation.toFixed(1)}%입니다.` : `조세·국채·물가정책을 기준으로 다음 주 첫 수입과 지출을 계산합니다. 현재 물가는 ${context.economy.inflation.toFixed(1)}%입니다.`,
    cause: ledger ? `경상수지 ${signed(operating, 1)}M에 금융조달 ${ledger.financingRaised.toFixed(1)}M과 포트폴리오 평가를 반영했습니다.` : '아직 확정된 주간 장부가 없어 현재 정책의 예상치만 제시합니다.',
    consequence: operating < 0 ? '국채로 흑자를 만들었더라도 경상적자는 부채와 물가를 누적시키므로 지출·세입 구조를 조정해야 합니다.' : '경상흑자는 산업투자 여력을 만들지만 전선 악화와 시장사건에 대비한 유동성도 필요합니다.',
    confidence: 'confirmed', priority: tone === 'negative' ? 78 : 55, tone,
    signals: [
      { label: '주간 재정', value: `${signed(balance, 1)}M`, tone },
      { label: '경상수지', value: `${signed(operating, 1)}M`, tone: operating < 0 ? 'negative' : 'positive' },
      { label: '인플레이션', value: `${context.economy.inflation.toFixed(1)}%`, tone: context.economy.inflation >= 10 ? 'negative' : 'neutral' },
    ], actionTab: 'economy', actionLabel: '전시 재무성으로 이동',
  };
}

function baselineSociety(context: WorldWeeklyContext): WorldNewsArticle {
  const outbreak = context.publicHealth.activeOutbreak;
  if (outbreak) {
    const tone: WorldNewsTone = outbreak.phase === 'recovery' ? 'positive' : 'negative';
    return {
      id: `ww-${context.week}-society-${outbreak.id}`, category: 'society', region: outbreak.origin,
      headline: `${outbreak.codeName}, ${outbreak.phase === 'recovery' ? '감소세 진입' : '보건 비상 지속'}`,
      summary: `이번 주 ${formatNumber(outbreak.weeklyCases)}건, 누적 사망 ${formatNumber(outbreak.deaths)}명으로 추정됩니다. 유효재생산수 R ${outbreak.rEffective.toFixed(2)}, 병상부하는 ${Math.round(outbreak.hospitalLoad)}%입니다.`,
      cause: `감시망 ${Math.round(context.publicHealth.surveillance)}/100과 확보 지식 ${Math.round(outbreak.knowledge)}/100을 바탕으로 유행 규모를 추정했습니다.`,
      consequence: outbreak.rEffective > 1 ? 'R이 1을 넘는 동안 환자 수와 군수·인력 손실이 계속 증가할 수 있습니다.' : '감소세를 유지하려면 현재 정책과 의료수용력을 조기에 해제하지 않아야 합니다.',
      confidence: outbreak.knowledge >= 65 ? 'confirmed' : 'assessed', priority: outbreak.phase === 'pandemic' ? 99 : outbreak.phase === 'epidemic' ? 92 : 82, tone,
      signals: [
        { label: '주간 환자', value: formatNumber(outbreak.weeklyCases), tone: 'negative' },
        { label: 'R', value: outbreak.rEffective.toFixed(2), tone: outbreak.rEffective > 1 ? 'negative' : 'positive' },
        { label: '병상부하', value: `${Math.round(outbreak.hospitalLoad)}%`, tone: outbreak.hospitalLoad >= 80 ? 'negative' : 'neutral' },
      ], actionTab: 'health', actionLabel: '보건 위기실로 이동',
    };
  }
  const risk = context.publicHealth.weeklyRisk * 100;
  return {
    id: `ww-${context.week}-society-baseline`, category: 'society', region: '국내·점령지', headline: '대규모 유행 없음, 감시체계는 경계 유지',
    summary: `이번 주 활성 감염병은 없습니다. 다음 주 발병 위험은 ${risk.toFixed(2)}%, 대비도는 ${Math.round(context.publicHealth.preparedness)}/100입니다. 안정도 ${Math.round(context.game.stability)}, 전쟁 지지도 ${Math.round(context.game.warSupport)}를 함께 추적합니다.`,
    cause: '전선 압력·보급·감시망·의료수용력과 누적 발병압력을 결합한 위험평가입니다.',
    consequence: risk >= 1 ? '발병 확률이 높아져 감시·병상·비축 투자가 지연될수록 초기 통제비용이 커집니다.' : '현재는 평온하지만 전선 이동과 도시 밀집이 위험도를 빠르게 바꿀 수 있습니다.',
    confidence: 'assessed', priority: risk >= 1 ? 70 : 42, tone: risk >= 1 ? 'negative' : 'neutral',
    signals: [
      { label: '발병위험', value: `${risk.toFixed(2)}%`, tone: risk >= 1 ? 'negative' : 'neutral' },
      { label: '대비도', value: `${Math.round(context.publicHealth.preparedness)}/100`, tone: context.publicHealth.preparedness >= 65 ? 'positive' : 'neutral' },
      { label: '안정도', value: `${Math.round(context.game.stability)}/100`, tone: context.game.stability < 50 ? 'negative' : 'neutral' },
    ], actionTab: 'health', actionLabel: '보건 대비본부로 이동',
  };
}

function baselineScience(context: WorldWeeklyContext): WorldNewsArticle {
  const active = context.research.filter((project) => project.active && !project.complete)
    .sort((left, right) => right.progress / Math.max(1, right.duration) - left.progress / Math.max(1, left.duration));
  const nearest = active[0];
  const completed = context.research.filter((project) => project.complete).length;
  const percent = nearest ? Math.round(nearest.progress / Math.max(1, nearest.duration) * 100) : 0;
  return {
    id: `ww-${context.week}-science-baseline`, category: 'science', region: '연구·군수기관',
    headline: nearest ? `${nearest.name}, 완성도 ${percent}% 도달` : '일반 연구 슬롯이 비어 있음',
    summary: nearest ? `${nearest.branch} 부문의 ${nearest.name}이 가장 완료에 가깝습니다. 현재 ${active.length}개 프로젝트가 진행 중이며 ${completed}개가 완료됐습니다.` : `진행 중인 일반 연구가 없습니다. 현재까지 ${completed}개 프로젝트가 완료됐습니다.`,
    cause: nearest ? '이번 주 연구 진행도와 각 프로젝트의 필요 기간을 비교했습니다.' : '활성화된 연구 프로젝트가 없어 주간 연구량이 배분되지 않았습니다.',
    consequence: nearest ? '완료 시점에 맞춰 후속 연구를 지정해야 연구 슬롯의 공백을 막을 수 있습니다.' : '연구를 배정하지 않으면 장비·정보·보급의 장기 격차가 커집니다.',
    confidence: 'confirmed', priority: nearest ? 52 + Math.round(percent / 5) : 72, tone: nearest ? 'positive' : 'negative',
    signals: [
      { label: '진행 연구', value: `${active.length}/2`, tone: active.length >= 2 ? 'positive' : 'negative' },
      { label: '완료 연구', value: `${completed}`, tone: 'positive' },
      ...(nearest ? [{ label: '최고 진행도', value: `${percent}%`, tone: 'neutral' as const }] : []),
    ], actionTab: 'research', actionLabel: '연구개발국으로 이동',
  };
}

function baselineIntelligence(context: WorldWeeklyContext): WorldNewsArticle {
  const active = context.operations.filter((operation) => operation.active);
  const leading = [...active].sort((left, right) => right.progress - left.progress)[0];
  const intelligence = context.game.intelNetwork;
  const confidence: WorldNewsConfidence = intelligence >= 72 ? 'confirmed' : intelligence >= 42 ? 'assessed' : 'rumor';
  return {
    id: `ww-${context.week}-intelligence-baseline`, category: 'intelligence', region: leading?.region ?? '전 세계 정보망',
    headline: leading ? `${leading.name}, 공작 진척 ${Math.round(leading.progress)}%` : '활성 비밀공작 없음, 정보망 감시 지속',
    summary: leading ? `${leading.region}에서 위험도 ${leading.risk}/100의 공작이 진행 중입니다. 국가 정보망은 ${Math.round(intelligence)}/100이며 활성 공작은 ${active.length}건입니다.` : `국가 정보망은 ${Math.round(intelligence)}/100입니다. 현재 직접 지휘 중인 비밀공작은 없습니다.`,
    cause: '활성 공작의 진행도·위험도와 국가 정보망 수준을 결합해 정보 신뢰도를 판정했습니다.',
    consequence: intelligence < 45 ? '낮은 정보망은 적 전선·외교·비밀기사의 오차를 키우고 허위정보 노출을 늘립니다.' : '정보 우세는 다른 편집국 기사의 신뢰도를 높이고 작전 예측 오차를 줄입니다.',
    confidence, priority: leading && leading.risk >= 70 ? 78 : intelligence < 45 ? 72 : 50, tone: leading && leading.risk >= 70 ? 'negative' : intelligence >= 65 ? 'positive' : 'neutral',
    signals: [
      { label: '정보망', value: `${Math.round(intelligence)}/100`, tone: intelligence >= 65 ? 'positive' : intelligence < 45 ? 'negative' : 'neutral' },
      { label: '활성 공작', value: `${active.length}건`, tone: active.length > 0 ? 'neutral' : 'neutral' },
      ...(leading ? [{ label: '최고 진척', value: `${Math.round(leading.progress)}%`, tone: 'positive' as const }] : []),
    ], actionTab: 'intelligence', actionLabel: '정보국으로 이동',
  };
}

export function generateWorldWeeklyIssue(context: WorldWeeklyContext): WorldWeeklyIssue {
  const weeklyEvents = context.events.filter((event) => event.week === context.week);
  const eventByCategory = new Map<WorldNewsCategory, WarEvent>();
  weeklyEvents.forEach((event) => {
    const category = categoryForEvent(event);
    const current = eventByCategory.get(category);
    if (!current || eventPriority(event, category) > eventPriority(current, category)) eventByCategory.set(category, event);
  });

  const baselines: Record<WorldNewsCategory, () => WorldNewsArticle> = {
    front: () => baselineFront(context),
    diplomacy: () => baselineDiplomacy(context),
    economy: () => baselineEconomy(context),
    society: () => baselineSociety(context),
    science: () => baselineScience(context),
    intelligence: () => baselineIntelligence(context),
  };
  const articles = categoryOrder.map((category) => {
    const event = eventByCategory.get(category);
    return event ? articleFromEvent(event, context, category) : baselines[category]();
  });
  const lead = [...articles].sort((left, right) => right.priority - left.priority || categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category))[0];
  const fronts = deriveFrontSummaries(context.territories, strategicFronts, context.playerFaction);
  const currentBattles = context.battleReports.filter((report) => report.week === context.week);
  const ledger = context.economy.lastLedger;
  const relationAverage = context.relations.length
    ? Math.round(context.relations.reduce((sum, relation) => sum + relation.value, 0) / context.relations.length)
    : 50;
  return {
    id: `world-weekly-${context.nation.id}-${context.week}`,
    week: context.week,
    edition: context.week + 1,
    dateRange: `${campaignDate(context.week - 1)} — ${campaignDate(context.week)}`,
    worldlineCode: context.worldline.code,
    worldlineTitle: context.worldline.title,
    leadArticleId: lead.id,
    articles,
    metrics: {
      activeFronts: fronts.filter((front) => front.activeContacts > 0).length,
      battleCount: currentBattles.length,
      territoryChanges: currentBattles.filter((battle) => battle.victory).length,
      treasuryChange: ledger?.week === context.week ? ledger.netTreasuryChange : 0,
      relationAverage,
      healthRisk: context.publicHealth.activeOutbreak ? 100 : context.publicHealth.weeklyRisk * 100,
      eventCount: weeklyEvents.length,
      intelligence: context.game.intelNetwork,
    },
  };
}

export function normalizeWorldWeeklyIssues(value: unknown): WorldWeeklyIssue[] {
  if (!Array.isArray(value)) return [];
  const seenWeeks = new Set<number>();
  return value.filter((item): item is WorldWeeklyIssue => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<WorldWeeklyIssue>;
    if (typeof candidate.id !== 'string' || typeof candidate.week !== 'number' || !Array.isArray(candidate.articles) || candidate.articles.length === 0 || !candidate.metrics) return false;
    if (seenWeeks.has(candidate.week)) return false;
    const validArticles = candidate.articles.every((article) => article && typeof article.id === 'string' && categoryOrder.includes(article.category) && typeof article.headline === 'string' && typeof article.summary === 'string');
    if (!validArticles) return false;
    seenWeeks.add(candidate.week);
    return true;
  }).sort((left, right) => right.week - left.week).slice(0, 104);
}
