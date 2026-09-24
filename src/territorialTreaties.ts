import { nations } from './campaign';
import type { MapPoliticalLedger } from './mapPoliticalLedger';
import { getTerritoryGeography } from './territoryGeography';
import type { DiplomaticRelation, GameState, NationId, Territory } from './types';
import { consistentTreatyConsentResult, forecastTreatyConsent, getTreatyTerms, isTreatyConsentMethod, satisfiesTreatyConsent,
  treatyConsentAbstraction, treatyConsentApproved, treatyConsentEvidenceKey, validTreatyTerms } from './territorialConsent';
export { forecastTreatyConsent, getTreatyTerms } from './territorialConsent';

export type TreatyConsentMethod = 'none' | 'regional-council' | 'referendum';
export interface TreatyTerms {
  consentMethod: TreatyConsentMethod;
  civilGuarantees: boolean;
  withdrawBeforeHandover: boolean;
  handoverDelayWeeks: 1 | 4 | 8;
}
export interface TreatyConsentRecord {
  method: Exclude<TreatyConsentMethod, 'none'>;
  status: 'preparing' | 'suspended' | 'approved' | 'rejected';
  startedWeek: number; lastProcessedWeek: number; progressWeeks: number;
  resolvedWeek?: number; supportPercent?: number; participationPercent?: number; reason: string;
  supplyAtResolution?: number; modelVersion?: 1; evidenceKey?: string;
}

export interface TerritorialTreaty {
  id: string; name: string; proposerNationId: NationId; partnerNationId: NationId;
  fromNationId: NationId; toNationId: NationId; territoryId: string;
  proposedWeek: number; responseDueWeek: number;
  status: 'proposed' | 'accepted' | 'rejected' | 'ratified' | 'suspended' | 'completed' | 'withdrawn';
  reason: string; respondedWeek?: number; ratifiedWeek?: number; handoverDueWeek?: number; completedWeek?: number;
  terms?: TreatyTerms; consent?: TreatyConsentRecord;
}
export interface TreatyEvent { id: string; title: string; detail: string; week: number; tone: 'good' | 'bad' | 'neutral' }
export interface TreatyState { version: 1; treaties: TerritorialTreaty[]; lastAdvancedWeek: number; journal: TreatyEvent[] }
export type TreatyAction =
  | { kind: 'propose'; name: string; partnerNationId: NationId; territoryId: string; direction: 'offer' | 'request'; terms?: TreatyTerms }
  | { kind: 'ratify' | 'withdraw' | 'start-consultation'; treatyId: string };
export interface TreatyContext {
  week: number; nationId: NationId; territories: readonly Territory[]; control: MapPoliticalLedger;
  relations: readonly DiplomaticRelation[]; politicalPower: number; treasury: number; stability: number;
  institutionalCapacity: number; canNegotiate: boolean; canRatify: boolean; approvalSupport: number;
  approvalLabel: string; blockedTerritoryIds: readonly string[];
  requiredConsent?: TreatyConsentMethod;
  garrisonCountByTerritory?: Readonly<Record<string, number>>;
}
export interface TreatyReview { allowed: boolean; reason: string; cost: { politicalPower: number; treasury: number }; dueWeek: number | null; summary: string }
export interface TreatyResult {
  state: TreatyState; accepted: boolean; reason: string; gameDelta: Partial<GameState>; events: TreatyEvent[];
  transfers: Array<{ treatyId: string; territoryId: string; fromNationId: NationId; toNationId: NationId; week: number }>;
}

export function createTerritorialTreatiesState(): TreatyState {
  return { version: 1, treaties: [], lastAdvancedWeek: 0, journal: [] };
}

const profiles = new Map(nations.map((nation) => [nation.id, nation]));
const capitals = new Set(nations.map((nation) => nation.capitalTerritoryId));
const statuses = new Set<TerritorialTreaty['status']>(['proposed', 'accepted', 'rejected', 'ratified', 'suspended', 'completed', 'withdrawn']);
const active = (treaty: TerritorialTreaty) => ['proposed', 'accepted', 'ratified', 'suspended'].includes(treaty.status);
const validNation = (value: unknown): value is NationId => typeof value === 'string' && profiles.has(value as NationId);
const validWeek = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const percent = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;
const resource = (value: number) => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const text = (value: unknown, max = 1200): value is string => typeof value === 'string' && value.trim().length > 0
  && value.length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
const nationName = (nation: NationId) => profiles.get(nation)?.shortName ?? '국가 미확인';
const metric = (value: number) => (Math.floor(value * 100) / 100).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
const treatyId = (proposer: NationId, partner: NationId, site: string, week: number) => `treaty:${proposer}:${partner}:${site}:${week}`;
const scopeNote = '양 당사국 사이의 거점 귀속 합의이며 보편적인 영토 주권 승인이나 국경 전체의 확정이 아닙니다.';
const responseNote = '상대 정부의 응답은 게임 규칙으로 추상화하며 역사적·법적 사실을 예측하지 않습니다.';
const land = (site: Territory | undefined): site is Territory => !!site && site.siteType !== 'sea'
  && !/해역|해상|바다|^sea$|^ocean$/i.test(site.terrain) && getTerritoryGeography(site.id)?.kind !== 'sea';
const transferable = (site: Territory | undefined): site is Territory => land(site) && site.siteType !== 'capital' && !capitals.has(site.id);
function findSite(context: TreatyContext, id: string): Territory | undefined {
  const sites = context.territories.filter((site) => site.id === id);
  return sites.length === 1 ? sites[0] : undefined;
}
function latestWeek(state: TreatyState): number {
  return Math.max(state.lastAdvancedWeek, state.journal.at(-1)?.week ?? 0,
    ...state.treaties.map((t) => Math.max(t.completedWeek ?? t.ratifiedWeek ?? t.respondedWeek ?? t.proposedWeek, t.consent?.lastProcessedWeek ?? 0)));
}
function relation(context: TreatyContext, partner: NationId): number | undefined {
  const matches = context.relations.filter((item) => item.id === partner);
  return matches.length === 1 && percent(matches[0].value) ? matches[0].value : undefined;
}
function blockedSitesValid(context: TreatyContext): boolean {
  return Array.isArray(context.blockedTerritoryIds) && context.blockedTerritoryIds.every((id) => text(id, 200));
}
/** The map recorder refuses backdated receipts, including after another site's future change. */
function controlLedgerIsCurrent(context: TreatyContext): boolean {
  const ledger = context.control;
  if (!ledger || !validWeek(ledger.startedWeek) || ledger.startedWeek > context.week
    || !Array.isArray(ledger.changes) || !ledger.latestByTerritory || typeof ledger.latestByTerritory !== 'object'
    || Array.isArray(ledger.latestByTerritory)) return false;
  return [...ledger.changes, ...Object.values(ledger.latestByTerritory)]
    .every((change) => !!change && validWeek(change.week) && change.week <= context.week);
}
function journal(state: TreatyState, events: readonly TreatyEvent[]): TreatyState {
  return { ...state, journal: [...state.journal, ...events.map((event) => ({ ...event }))].slice(-200) };
}
function refused(state: TreatyState, reason: string): TreatyResult {
  return { state, accepted: false, reason, gameDelta: {}, events: [], transfers: [] };
}
function consultationObstacle(treaty: TerritorialTreaty, context: TreatyContext): string | undefined {
  const site = findSite(context, treaty.territoryId);
  if (!transferable(site) || getTreatySiteController(site, context.control) !== treaty.fromNationId) return '제공국의 현장 통제를 확인할 수 없어 지역 동의 절차를 중단합니다.';
  if (context.blockedTerritoryIds.includes(site.id)) return '진행 중인 작전 때문에 지역 동의 절차를 안전하게 실시할 수 없습니다.';
  if (!percent(site.supply) || site.supply < 40) return '지역 동의 절차에는 현지 보급 40 이상이 필요합니다.';
  return undefined;
}
function approvedConsent(treaty: TerritorialTreaty): boolean {
  const terms = getTreatyTerms(treaty); const consent = treaty.consent;
  if (terms.consentMethod === 'none') return consent === undefined;
  return !!consent && consent.method === terms.consentMethod && consent.status === 'approved'
    && consent.progressWeeks === 3 && validWeek(consent.startedWeek) && validWeek(consent.resolvedWeek)
    && consent.resolvedWeek >= consent.startedWeek + 3 && consent.lastProcessedWeek === consent.resolvedWeek
    && typeof consent.supportPercent === 'number' && typeof consent.participationPercent === 'number'
    && consistentTreatyConsentResult(treaty, consent)
    && treatyConsentApproved(consent.method, consent.supportPercent, consent.participationPercent);
}
function withdrawalObstacle(treaty: TerritorialTreaty, context: TreatyContext): string | undefined {
  if (!getTreatyTerms(treaty).withdrawBeforeHandover) return undefined;
  if (treaty.fromNationId !== context.nationId) return '육군 주둔부대 철수 확인 조건이 있지만 외국 제공국의 현재 육군 위치를 증명할 수 없습니다. 외국군·함대·항공기·기지권 전체 철수로 추정하지 않고 인계를 중단합니다.';
  const counts = context.garrisonCountByTerritory;
  if (!counts || !Object.prototype.hasOwnProperty.call(counts, treaty.territoryId)
    || !Number.isSafeInteger(counts[treaty.territoryId]) || counts[treaty.territoryId] < 0) {
    return '육군 주둔부대 철수 확인 조건이 있지만 해당 거점의 제공국 육군 편제 수를 확인할 수 없습니다. 병력 부재를 추정하지 않고 인계를 중단합니다.';
  }
  return counts[treaty.territoryId] === 0 ? undefined : `육군 주둔부대 철수 확인: 현재 해당 거점의 제공국 육군 편제 ${counts[treaty.territoryId]}개가 남아 있습니다. 자동 이동시키지 않고 철수 확인까지 인계를 중단합니다.`;
}

/** Current game control, never an assertion of historical or legal sovereignty. */
export function getTreatySiteController(territory: Territory, control: MapPoliticalLedger): NationId | undefined {
  if (!land(territory) || !control?.current || !['allies', 'axis', 'neutral'].includes(territory.controller)) return undefined;
  const recorded = Object.prototype.hasOwnProperty.call(control.current, territory.id);
  const record = recorded ? control.current[territory.id] : undefined;
  if (!recorded || !record || typeof record !== 'object' || Array.isArray(record)) return undefined;
  if (record && (record.controller !== territory.controller || record.gameOwnerId !== territory.ownerId)) return undefined;
  if (record?.verifiedControllerNationId !== undefined) return validNation(record.verifiedControllerNationId) ? record.verifiedControllerNationId : undefined;
  return validNation(territory.ownerId) && profiles.get(territory.ownerId)?.alignment === territory.controller ? territory.ownerId : undefined;
}

export function reviewTreatyAction(state: TreatyState, action: TreatyAction, context: TreatyContext): TreatyReview {
  const review: TreatyReview = { allowed: false, reason: '', cost: { politicalPower: 0, treasury: 0 }, dueWeek: null, summary: '' };
  const deny = (reason: string) => ({ ...review, reason });
  if (!action || !['propose', 'ratify', 'withdraw', 'start-consultation'].includes(action.kind)) return deny('지원하지 않는 조약 행동입니다.');
  if (!validWeek(context.week) || !validNation(context.nationId) || context.week < latestWeek(state)) return deny('현재 국가·주차를 확인하세요. 과거 주차에 조약 행동을 실행할 수 없습니다.');
  if (!controlLedgerIsCurrent(context)) return deny('통제 원장에 미래 시점 또는 유효하지 않은 기록이 있습니다. 현재 주차와 원장을 일치시킨 뒤 조약을 처리하세요.');
  if (!resource(context.politicalPower) || !resource(context.treasury)) return deny('정치력·재정 기록이 유효하지 않습니다.');
  if (!blockedSitesValid(context)) return deny('진행 중인 작전의 거점 기록을 확인해야 합니다.');
  const requiredConsent = context.requiredConsent === undefined ? 'none' : context.requiredConsent;
  if (!isTreatyConsentMethod(requiredConsent)) return deny('현재 헌법의 지역 동의 요건을 확인해야 합니다.');
  if (action.kind === 'propose') {
    review.cost = { politicalPower: 6, treasury: 0 }; review.dueWeek = context.week + 2;
    const threshold = action.direction === 'offer' ? 50 : 75;
    review.summary = `한 육상 거점의 귀속 협상을 제안합니다. 실제 주간 처리 2회 후 현재 관계 ${threshold} 이상·안정도 45 이상이면 상대가 수락합니다. 수락만으로 귀속·통제·병력은 바뀌지 않으며 별도 비준과 현장 인계가 필요합니다. ${scopeNote} ${responseNote}`;
    if (context.canNegotiate !== true) return deny('현재 보직에는 조약 제안 권한이 없습니다.');
    if (!validNation(action.partnerNationId) || action.partnerNationId === context.nationId) return deny('자국이 아닌 유효한 상대국을 선택하세요.');
    if (!['offer', 'request'].includes(action.direction) || !text(action.name, 80) || action.name.trim().length < 2) return deny('제안 방향과 2~80자의 조약 이름을 확인하세요.');
    const terms = getTreatyTerms(action);
    if (!validTreatyTerms(terms)) return deny('지역 동의 방식·민간 보호 약속·철수 조건·인계 기간을 확인하세요.');
    if (!satisfiesTreatyConsent(terms.consentMethod, requiredConsent)) return deny('현재 헌법의 지역 동의 요건을 충족하는 절차를 제안에 포함해야 합니다. 지역 협의로 주민투표 요건을 대신할 수 없습니다.');
    review.summary += ` 지역 동의: ${terms.consentMethod === 'none' ? '별도 절차 없음' : terms.consentMethod === 'regional-council' ? '지역 대표 협의' : '지역 투표'}, 민간 보호 약속: ${terms.civilGuarantees ? '포함(비준 시 재정 8 추가)' : '미포함'}, 육군 주둔부대 철수 확인: ${terms.withdrawBeforeHandover ? '필수' : '별도 조건 없음'}, 비준 후 인계 준비 ${terms.handoverDelayWeeks}주. 제안 후 조건은 변경할 수 없습니다.`;
    const site = findSite(context, action.territoryId);
    if (!transferable(site)) return deny('이번 조약은 존재하는 비수도 육상 거점 하나만 다룹니다. 해역·국가 수도는 제외됩니다.');
    if (context.blockedTerritoryIds.includes(site.id)) return deny('해당 거점에 진행 중인 작전이 있어 새 귀속 협상을 제안할 수 없습니다.');
    const donor = action.direction === 'offer' ? context.nationId : action.partnerNationId;
    if (getTreatySiteController(site, context.control) !== donor) return deny('제공국이 현재 통제하는 거점만 협상할 수 있습니다. 같은 진영·게임상 귀속만으로 외국 거점을 넘길 수 없으며 오래된 통제 기록은 사용할 수 없습니다.');
    if (state.treaties.some((t) => t.territoryId === site.id && active(t))) return deny('이 거점에는 진행 중인 조약이 있습니다. 기존 협상을 정리한 뒤 다시 제안하세요.');
    if (state.treaties.some((t) => t.id === treatyId(context.nationId, action.partnerNationId, site.id, context.week))) return deny('같은 주의 동일 거점·상대국 제안은 이미 기록되었습니다. 중복 비용을 지불하지 않습니다.');
    if (state.treaties.length >= 4096) return deny('보존 가능한 조약 기록 한도에 도달했습니다. 기존 기록을 지우고 재실행하지 않습니다.');
    if (relation(context, action.partnerNationId) === undefined || !percent(context.stability)) return deny('현재 상대국 관계·자국 안정도 기록이 필요합니다.');
  } else {
    const treaty = state.treaties.find((item) => item.id === action.treatyId);
    if (!treaty || treaty.proposerNationId !== context.nationId) return deny('현재 국가가 제안한 조약만 처리할 수 있습니다.');
    const terms = getTreatyTerms(treaty);
    if (!validTreatyTerms(terms)) return deny('조약에 기록된 조건을 확인할 수 없습니다.');
    if (action.kind === 'withdraw') {
      review.summary = '비준 전 제안을 철회합니다. 이전 협상 비용은 환급하지 않으며 거점 통제·귀속을 변경하지 않습니다.';
      if (context.canNegotiate !== true) return deny('현재 보직에는 조약 철회 권한이 없습니다.');
      if (!['proposed', 'accepted'].includes(treaty.status)) return deny('제안 중이거나 수락된 조약만 비준 전에 철회할 수 있습니다. 이미 비준된 합의를 일방적으로 삭제하지 않습니다.');
    } else if (action.kind === 'start-consultation') {
      review.cost = { politicalPower: 4, treasury: 3 }; review.dueWeek = context.week + 3;
      review.summary = `지역 동의 절차를 시작합니다. 제공국 통제·작전 부재·현지 보급 40 이상을 실제 연속 3주 확인합니다. 중단 시 진행을 0으로 되돌리고 안전이 회복되면 자동 재개합니다. 거점·당사국의 고정 기반과 결과 주의 보급·민간 보호 약속으로 계산하며, 결정된 결과를 같은 제안에서 다시 뽑을 수 없습니다. ${treatyConsentAbstraction}`;
      if (context.canNegotiate !== true) return deny('현재 보직에는 지역 동의 절차를 시작할 협상 권한이 없습니다.');
      if (treaty.status !== 'accepted') return deny('상대국이 수락한 조약에서만 지역 동의 절차를 시작할 수 있습니다.');
      if (terms.consentMethod === 'none') return deny('이 제안에는 지역 동의 절차가 포함되지 않았습니다. 필요한 조건으로 새 제안을 작성해야 합니다.');
      if (!satisfiesTreatyConsent(terms.consentMethod, requiredConsent)) return deny('수락 뒤 헌법의 지역 동의 요건이 강화되었습니다. 기존 제안을 철회하고 필요한 절차로 다시 제안하세요.');
      if (treaty.consent) return deny('이 제안의 지역 동의 절차는 이미 기록되어 있습니다. 중단은 자동 재개하며, 확정된 결과는 다시 실시하지 않습니다.');
      const obstacle = consultationObstacle(treaty, context);
      if (obstacle) return deny(obstacle);
    } else {
      review.cost = { politicalPower: 8, treasury: terms.civilGuarantees ? 12 : 4 }; review.dueWeek = context.week + terms.handoverDelayWeeks;
      review.summary = `최고 정치 보직의 비준으로 양 당사국의 거점 귀속 합의를 기록합니다. ${terms.handoverDelayWeeks}주 후부터 제공국의 실제 통제와 작전 종료${terms.withdrawBeforeHandover ? '·제공국 육군 주둔 편제 0개 확인' : ''}를 확인한 뒤 인계하며, 조건 불충족이면 합의를 보존하고 인계만 중단합니다. ${terms.civilGuarantees ? '민간 보호 약속을 위한 추가 재정 8을 포함합니다. 보호가 자동 집행됐다는 뜻은 아닙니다. ' : ''}병력은 자동 이동하지 않습니다. ${scopeNote}`;
      if (context.canRatify !== true) return deny('현재 보직에는 국가 조약을 비준할 권한이 없습니다. 최고 정치 보직의 결재가 필요합니다.');
      if (treaty.status !== 'accepted') return deny('상대국이 수락한 조약만 한 번 비준할 수 있습니다.');
      if (terms.withdrawBeforeHandover && treaty.fromNationId !== context.nationId) return deny('현재 자료로 이행할 수 없는 외국 육군 철수 조건은 비준할 수 없습니다. 비준 전 철회 후 철수 조건을 제외하고 재협상하세요.');
      if (!satisfiesTreatyConsent(terms.consentMethod, requiredConsent)) return deny('현재 헌법이 요구하는 지역 동의 절차가 이 제안에 없습니다. 비준 전 제안을 철회하고 새 조건으로 다시 협상하세요.');
      if (!approvedConsent(treaty) || (treaty.consent?.resolvedWeek ?? context.week) > context.week) return deny('제안에 명시된 지역 동의 절차의 승인 결과가 필요합니다. 준비·중단·반대 결과를 비준으로 건너뛸 수 없습니다.');
      if (!percent(context.approvalSupport) || context.approvalSupport < 60 || !text(context.approvalLabel, 120)) return deny('유효한 국내 승인 절차와 지지 60 이상이 필요합니다.');
      if (!percent(context.institutionalCapacity) || context.institutionalCapacity < 45 || !percent(context.stability) || context.stability < 45) return deny('비준에는 현재 행정역량 45·안정도 45 이상이 필요합니다.');
      const site = findSite(context, treaty.territoryId);
      if (!transferable(site) || getTreatySiteController(site, context.control) !== treaty.fromNationId) return deny('제공국의 현재 육상 거점 통제를 확인할 수 없어 비준할 수 없습니다.');
      if (context.blockedTerritoryIds.includes(site.id)) return deny('해당 거점에 진행 중인 작전이 있어 비준할 수 없습니다.');
      if (state.treaties.some((other) => other.id !== treaty.id && other.territoryId === treaty.territoryId && active(other))) return deny('같은 거점의 다른 조약이 진행 중입니다. 상충하는 합의를 동시에 비준할 수 없습니다.');
    }
  }
  if (review.dueWeek !== null && !validWeek(review.dueWeek)) return deny('예정 주차가 유효 범위를 벗어났습니다.');
  if (context.politicalPower < review.cost.politicalPower || context.treasury < review.cost.treasury) return deny(`정치력 ${review.cost.politicalPower}·재정 ${review.cost.treasury}가 필요합니다. 현재 잔액이 부족합니다.`);
  return { ...review, allowed: true, reason: '현재 조건을 충족합니다. 확인 후 실행하면 표시된 비용만 한 번 반영합니다.' };
}

export function executeTreatyAction(state: TreatyState, action: TreatyAction, context: TreatyContext): TreatyResult {
  const review = reviewTreatyAction(state, action, context);
  if (!review.allowed) return refused(state, review.reason);
  let treaty: TerritorialTreaty; let title: string; let verb: string;
  if (action.kind === 'propose') {
    treaty = { id: treatyId(context.nationId, action.partnerNationId, action.territoryId, context.week), name: action.name.trim(),
      proposerNationId: context.nationId, partnerNationId: action.partnerNationId,
      fromNationId: action.direction === 'offer' ? context.nationId : action.partnerNationId,
      toNationId: action.direction === 'offer' ? action.partnerNationId : context.nationId,
      territoryId: action.territoryId, proposedWeek: context.week, responseDueWeek: context.week + 2,
      status: 'proposed', reason: `제${context.week + 3}주 응답 검토 예정. ${review.summary}`,
      ...(action.terms !== undefined ? { terms: getTreatyTerms(action) } : {}) };
    title = `${treaty.name} · 귀속 협상 제안`; verb = 'proposed';
  } else {
    const previous = state.treaties.find((t) => t.id === action.treatyId)!;
    if (action.kind === 'start-consultation') {
      treaty = { ...previous, consent: { method: getTreatyTerms(previous).consentMethod as TreatyConsentRecord['method'],
        status: 'preparing', startedWeek: context.week, lastProcessedWeek: context.week, progressWeeks: 0, reason: review.summary }, reason: review.summary };
      title = `${treaty.name} · 지역 동의 절차 시작`;
    } else {
      treaty = action.kind === 'ratify' ? { ...previous, status: 'ratified', ratifiedWeek: context.week, handoverDueWeek: context.week + getTreatyTerms(previous).handoverDelayWeeks,
        reason: `${context.approvalLabel.trim()} 지지 ${metric(context.approvalSupport)}·행정역량 ${metric(context.institutionalCapacity)}·안정도 ${metric(context.stability)}를 확인했습니다. ${review.summary}` }
        : { ...previous, status: 'withdrawn', reason: review.summary };
      title = `${treaty.name} · ${action.kind === 'ratify' ? '비준 완료, 현장 인계 대기' : '제안 철회'}`;
    }
    verb = action.kind;
  }
  const event: TreatyEvent = { id: `${verb}:${treaty.id}`, week: context.week, title, detail: treaty.reason, tone: 'neutral' };
  const treaties = action.kind === 'propose' ? [...state.treaties, treaty] : state.treaties.map((t) => t.id === treaty.id ? treaty : t);
  return { state: journal({ ...state, treaties }, [event]), accepted: true, reason: title,
    gameDelta: review.cost.politicalPower || review.cost.treasury ? { politicalPower: -review.cost.politicalPower, treasury: review.cost.treasury ? -review.cost.treasury : 0 } : {},
    events: [{ ...event }], transfers: [] };
}

/** Observe one actual weekly tick. Transfers are receipts for the caller, never local map mutations. */
export function advanceTreatyWeek(state: TreatyState, context: TreatyContext): TreatyResult {
  if (!validWeek(context.week) || !validNation(context.nationId) || context.week <= state.lastAdvancedWeek || context.week < latestWeek(state)) return refused(state, '이미 처리했거나 과거인 주차입니다. 조약 결과를 반복 적용하지 않습니다.');
  if (!controlLedgerIsCurrent(context)) return refused(state, '통제 원장에 미래 시점 또는 유효하지 않은 기록이 있어 조약 응답·인계를 진행하지 않습니다.');
  if (!blockedSitesValid(context)) return refused(state, '진행 중인 작전 기록을 확인할 수 없어 인계를 진행하지 않습니다.');
  const events: TreatyEvent[] = []; const transfers: TreatyResult['transfers'] = [];
  const emit = (treaty: TerritorialTreaty, verb: string, title: string, detail: string, tone: TreatyEvent['tone']) => {
    events.push({ id: `${verb}:${treaty.id}:${context.week}`, week: context.week, title: `${treaty.name} · ${title}`, detail, tone });
  };
  const treaties = state.treaties.map((original): TerritorialTreaty => {
    if (original.status === 'proposed') {
      if (context.week <= original.proposedWeek) return original;
      const missed = Math.max(0, context.week - Math.max(state.lastAdvancedWeek, original.proposedWeek) - 1);
      const due = original.responseDueWeek + missed;
      if (!validWeek(due)) return original;
      const treaty = missed ? { ...original, responseDueWeek: due } : original;
      const site = findSite(context, treaty.territoryId);
      if (!transferable(site) || getTreatySiteController(site, context.control) !== treaty.fromNationId) {
        const reason = '응답 대기 중 제공국의 현장 통제를 잃었거나 현재 통제 기록이 불일치하여 제안을 거절했습니다. 거점을 강제로 취득하지 않습니다.';
        emit(treaty, 'response', '협상 거절', reason, 'bad');
        return { ...treaty, status: 'rejected', respondedWeek: context.week, reason };
      }
      if (context.week < due) return missed ? { ...treaty, reason: `관측하지 않은 주차는 소급하지 않습니다. 제${due + 1}주부터 상대 응답을 검토합니다. ${scopeNote}` } : treaty;
      // A career change does not magically make the new nation's relations the old nation's relations.
      if (treaty.proposerNationId !== context.nationId) {
        const reason = '제안국을 떠난 커리어입니다. 제안국의 현재 외교 관계·안정도를 확인할 때까지 응답만 대기합니다. 다른 국가의 수치를 대신 사용하지 않습니다.';
        if (treaty.reason !== reason) emit(treaty, 'response-wait', '제안국 정보 대기', reason, 'neutral');
        return { ...treaty, reason };
      }
      const value = relation(context, treaty.partnerNationId); const threshold = treaty.fromNationId === treaty.proposerNationId ? 50 : 75;
      const accepted = value !== undefined && percent(context.stability) && value >= threshold && context.stability >= 45;
      const reason = value === undefined || !percent(context.stability)
        ? `현재 상대국 관계·자국 안정도 기록을 확인할 수 없어 제안을 거절했습니다. ${responseNote}`
        : `현재 관계 ${metric(value)} / 필요 ${threshold}, 안정도 ${metric(context.stability)} / 필요 45: ${accepted ? '조건을 충족하여 상대가 수락했습니다. 아직 비준·현장 인계 전입니다.' : '응답 조건을 충족하지 않아 상대가 거절했습니다.'} ${scopeNote} ${responseNote}`;
      emit(treaty, 'response', accepted ? '상대 수락, 비준 필요' : '상대 거절', reason, accepted ? 'good' : 'bad');
      return { ...treaty, status: accepted ? 'accepted' : 'rejected', respondedWeek: context.week, reason };
    }
    if (original.status === 'accepted' && original.consent && ['preparing', 'suspended'].includes(original.consent.status)) {
      const consent = original.consent;
      if (context.week <= consent.lastProcessedWeek) return original;
      const obstacle = consultationObstacle(original, context);
      if (obstacle) {
        const reason = `${obstacle} 연속 준비를 0/3주로 되돌립니다. 안전 조건이 회복되면 추가 비용 없이 자동 재개합니다. ${treatyConsentAbstraction}`;
        if (consent.status !== 'suspended' || consent.reason !== reason) emit(original, 'consent-suspended', '지역 동의 절차 중단', reason, 'bad');
        return { ...original, reason, consent: { ...consent, status: 'suspended', progressWeeks: 0, lastProcessedWeek: context.week, reason } };
      }
      const consecutive = consent.status === 'preparing' && consent.lastProcessedWeek === context.week - 1;
      const progressWeeks = consecutive ? consent.progressWeeks + 1 : 1;
      const site = findSite(context, original.territoryId)!;
      if (progressWeeks < 3) {
        const reason = `${consecutive ? '' : '이전 중단·관측하지 않은 주차를 소급하지 않고 새로 셉니다. '}안전한 현장 통제·작전 부재·보급 ${metric(site.supply)}를 연속 ${progressWeeks}/3주 확인했습니다. ${treatyConsentAbstraction}`;
        emit(original, 'consent-progress', `지역 동의 준비 ${progressWeeks}/3주`, reason, 'neutral');
        return { ...original, reason, consent: { ...consent, status: 'preparing', progressWeeks, lastProcessedWeek: context.week, reason } };
      }
      const forecast = forecastTreatyConsent(original, site);
      const approved = treatyConsentApproved(consent.method, forecast.supportPercent, forecast.participationPercent);
      const reason = `실제 연속 3주 안전 조건을 확인했습니다. 합성 찬성 지표 ${forecast.supportPercent}/100·참여 지표 ${forecast.participationPercent}/100으로 ${approved ? '지역 동의 승인' : '지역 동의 반대'} 결과를 기록합니다. ${forecast.factors.join(' ')}`;
      emit(original, 'consent-result', approved ? '지역 동의 승인' : '지역 동의 반대', reason, approved ? 'good' : 'bad');
      return { ...original, reason, consent: { ...consent, status: approved ? 'approved' : 'rejected', progressWeeks: 3,
        lastProcessedWeek: context.week, resolvedWeek: context.week, supportPercent: forecast.supportPercent,
        participationPercent: forecast.participationPercent, supplyAtResolution: site.supply, modelVersion: 1,
        evidenceKey: treatyConsentEvidenceKey(original), reason } };
    }
    if (!['ratified', 'suspended'].includes(original.status) || original.handoverDueWeek === undefined || original.handoverDueWeek > context.week) return original;
    const site = findSite(context, original.territoryId);
    let reason: string | undefined;
    if (!transferable(site) || getTreatySiteController(site, context.control) !== original.fromNationId) reason = '제공국의 현장 통제를 확인할 수 없어 인계를 중단했습니다. 비준된 양자 귀속 합의는 보존하며, 통제 회복 후 다시 확인합니다. 점령은 합의를 삭제하지 않습니다.';
    else if (context.blockedTerritoryIds.includes(site.id)) reason = '해당 거점의 진행 중인 작전 때문에 인계를 중단했습니다. 비준된 합의는 보존하고 작전 종료 후 다시 확인합니다.';
    else if (state.treaties.some((other) => other.id !== original.id && other.territoryId === original.territoryId && active(other))) reason = '같은 거점에 다른 활성 조약이 있어 인계를 중단했습니다. 중복·상충하는 이전을 자동 실행하지 않습니다.';
    else reason = withdrawalObstacle(original, context);
    if (reason) {
      if (original.status !== 'suspended' || original.reason !== reason) emit(original, 'suspended', '현장 인계 중단', reason, 'bad');
      return { ...original, status: 'suspended', reason };
    }
    const detail = `${nationName(original.fromNationId)} → ${nationName(original.toNationId)}: 제공국 통제와 작전 부재를 확인하여 거점 인계 결과를 한 번 발행했습니다. 병력은 이동시키지 않습니다. ${scopeNote}`;
    transfers.push({ treatyId: original.id, territoryId: original.territoryId, fromNationId: original.fromNationId, toNationId: original.toNationId, week: context.week });
    emit(original, 'completed', '현장 인계 완료', detail, 'good');
    return { ...original, status: 'completed', completedWeek: context.week, reason: detail };
  });
  return { state: journal({ ...state, treaties, lastAdvancedWeek: context.week }, events), accepted: true, reason: '이번 주의 조약 응답과 현장 인계 조건을 확인했습니다.', gameDelta: {}, events: events.map((event) => ({ ...event })), transfers };
}

/** Validated receipts survive later capture. Bad saves start empty now, never with invented past rights. */
export function normalizeTerritorialTreatiesState(value: unknown, territories: readonly Territory[], week: number): TreatyState {
  const fallback = (): TreatyState => ({ ...createTerritorialTreatiesState(), lastAdvancedWeek: validWeek(week) ? week : 0 });
  if (!validWeek(week) || !value || typeof value !== 'object' || Array.isArray(value)) return fallback();
  const raw = value as TreatyState;
  if (raw.version !== 1 || !validWeek(raw.lastAdvancedWeek) || raw.lastAdvancedWeek > week || !Array.isArray(raw.treaties)
    || raw.treaties.length > 4096 || !Array.isArray(raw.journal) || raw.journal.length > 200) return fallback();
  const sites = new Map(territories.map((site) => [site.id, site]));
  if (sites.size !== territories.length) return fallback();
  const ids = new Set<string>(); const treaties: TerritorialTreaty[] = [];
  const observed = (v: unknown): v is number => validWeek(v) && v <= week && v <= raw.lastAdvancedWeek;
  for (const t of raw.treaties) {
    if (!t || !validNation(t.proposerNationId) || !validNation(t.partnerNationId) || t.proposerNationId === t.partnerNationId
      || !validNation(t.fromNationId) || !validNation(t.toNationId) || t.fromNationId === t.toNationId
      || ![t.proposerNationId, t.partnerNationId].includes(t.fromNationId) || ![t.proposerNationId, t.partnerNationId].includes(t.toNationId)
      || !transferable(sites.get(t.territoryId)) || !validWeek(t.proposedWeek) || t.proposedWeek > week
      || !validWeek(t.responseDueWeek) || t.responseDueWeek < t.proposedWeek + 2 || t.responseDueWeek > Math.max(week + 2, t.proposedWeek + 2)
      || t.id !== treatyId(t.proposerNationId, t.partnerNationId, t.territoryId, t.proposedWeek) || ids.has(t.id)
      || !text(t.name, 80) || t.name.trim().length < 2 || t.name !== t.name.trim() || !statuses.has(t.status) || !text(t.reason)) return fallback();
    const responded = t.respondedWeek !== undefined;
    const ratified = t.ratifiedWeek !== undefined;
    const handover = t.handoverDueWeek !== undefined;
    const completed = t.completedWeek !== undefined;
    const terms = getTreatyTerms(t);
    if (!validTreatyTerms(terms)) return fallback();
    if (responded && (!observed(t.respondedWeek) || t.respondedWeek <= t.proposedWeek)) return fallback();
    if (ratified && (!validWeek(t.ratifiedWeek) || t.ratifiedWeek > week || !responded || t.ratifiedWeek < t.respondedWeek!)) return fallback();
    if (handover && (!validWeek(t.handoverDueWeek) || !ratified || t.handoverDueWeek !== t.ratifiedWeek! + terms.handoverDelayWeeks)) return fallback();
    if (completed && (!observed(t.completedWeek) || !handover || t.completedWeek < t.handoverDueWeek!)) return fallback();
    if (t.status === 'proposed' && (responded || ratified || handover || completed)) return fallback();
    if (['accepted', 'rejected'].includes(t.status) && (!responded || ratified || handover || completed)) return fallback();
    if (t.status === 'withdrawn' && (ratified || handover || completed)) return fallback();
    if (['accepted', 'ratified', 'suspended', 'completed'].includes(t.status) && (!responded || t.respondedWeek! < t.responseDueWeek)) return fallback();
    if (['ratified', 'suspended', 'completed'].includes(t.status) && (!responded || !ratified || !handover)) return fallback();
    if (t.status === 'completed' ? !completed : completed) return fallback();
    if (t.status === 'suspended' && t.handoverDueWeek! > raw.lastAdvancedWeek) return fallback();
    if (t.status === 'withdrawn' && responded && t.respondedWeek! < t.responseDueWeek) return fallback();
    if (active(t) && treaties.some((other) => active(other) && other.territoryId === t.territoryId)) return fallback();
    let cleanConsent: TreatyConsentRecord | undefined;
    if (t.consent !== undefined) {
      const c = t.consent;
      if (!c || typeof c !== 'object' || Array.isArray(c) || terms.consentMethod === 'none' || c.method !== terms.consentMethod
        || !['preparing', 'suspended', 'approved', 'rejected'].includes(c.status)
        || !['accepted', 'ratified', 'suspended', 'completed', 'withdrawn'].includes(t.status)
        || !responded || !validWeek(c.startedWeek) || c.startedWeek < t.respondedWeek! || c.startedWeek > week
        || !validWeek(c.lastProcessedWeek) || c.lastProcessedWeek < c.startedWeek || c.lastProcessedWeek > week
        || c.lastProcessedWeek > Math.max(raw.lastAdvancedWeek, c.startedWeek)
        || !Number.isSafeInteger(c.progressWeeks) || c.progressWeeks < 0 || c.progressWeeks > 3
        || c.progressWeeks > c.lastProcessedWeek - c.startedWeek || !text(c.reason)) return fallback();
      const resolved = c.status === 'approved' || c.status === 'rejected';
      if (resolved) {
        if (c.progressWeeks !== 3 || !observed(c.resolvedWeek) || c.resolvedWeek < c.startedWeek + 3
          || c.lastProcessedWeek !== c.resolvedWeek || !consistentTreatyConsentResult(t, c)
          || typeof c.supportPercent !== 'number' || typeof c.participationPercent !== 'number'
          || treatyConsentApproved(c.method, c.supportPercent, c.participationPercent) !== (c.status === 'approved')) return fallback();
      } else if (c.resolvedWeek !== undefined || c.supportPercent !== undefined || c.participationPercent !== undefined
        || c.supplyAtResolution !== undefined || c.modelVersion !== undefined || c.evidenceKey !== undefined
        || (c.status === 'preparing' ? c.progressWeeks > 2 || c.progressWeeks === 0 && c.lastProcessedWeek !== c.startedWeek
          : c.progressWeeks !== 0 || c.lastProcessedWeek <= c.startedWeek)) return fallback();
      cleanConsent = { method: c.method, status: c.status, startedWeek: c.startedWeek, lastProcessedWeek: c.lastProcessedWeek,
        progressWeeks: c.progressWeeks, reason: c.reason,
        ...(resolved ? { resolvedWeek: c.resolvedWeek, supportPercent: c.supportPercent, participationPercent: c.participationPercent,
          supplyAtResolution: c.supplyAtResolution, modelVersion: c.modelVersion, evidenceKey: c.evidenceKey } : {}) };
    }
    if (ratified && (!approvedConsent(t) || (t.consent?.resolvedWeek ?? t.ratifiedWeek!) > t.ratifiedWeek!)) return fallback();
    ids.add(t.id);
    treaties.push({ id: t.id, name: t.name, proposerNationId: t.proposerNationId, partnerNationId: t.partnerNationId,
      fromNationId: t.fromNationId, toNationId: t.toNationId, territoryId: t.territoryId, proposedWeek: t.proposedWeek,
      responseDueWeek: t.responseDueWeek, status: t.status, reason: t.reason,
      ...(responded ? { respondedWeek: t.respondedWeek } : {}), ...(ratified ? { ratifiedWeek: t.ratifiedWeek } : {}),
      ...(handover ? { handoverDueWeek: t.handoverDueWeek } : {}), ...(completed ? { completedWeek: t.completedWeek } : {}),
      ...(t.terms !== undefined ? { terms: { consentMethod: terms.consentMethod, civilGuarantees: terms.civilGuarantees,
        withdrawBeforeHandover: terms.withdrawBeforeHandover, handoverDelayWeeks: terms.handoverDelayWeeks } } : {}),
      ...(cleanConsent ? { consent: cleanConsent } : {}) });
  }
  const events: TreatyEvent[] = []; const eventIds = new Set<string>(); let previousWeek = 0;
  for (const event of raw.journal) {
    if (!event || !text(event.id, 600) || eventIds.has(event.id) || !text(event.title, 200) || !text(event.detail, 1400)
      || !validWeek(event.week) || event.week > week || event.week < previousWeek || !['good', 'bad', 'neutral'].includes(event.tone)) return fallback();
    eventIds.add(event.id); previousWeek = event.week;
    events.push({ id: event.id, title: event.title, detail: event.detail, week: event.week, tone: event.tone });
  }
  return { version: 1, treaties, lastAdvancedWeek: raw.lastAdvancedWeek, journal: events };
}
