import { nations } from './campaign';
import type { MapPoliticalLedger } from './mapPoliticalLedger';
import { getTerritoryGeography } from './territoryGeography';
import type { DiplomaticRelation, GameState, NationId, Territory } from './types';

export interface CampaignPolity {
  id: string; nationId: NationId; name: string; declaration: 'independence' | 'representation';
  seatTerritoryId: string; declaredWeek: number;
}
export interface Recognition {
  id: string; polityId: string; partnerNationId: NationId; requestedWeek: number; dueWeek: number;
  resolvedWeek?: number; status: 'pending' | 'recognized' | 'deferred' | 'rejected'; reason: string;
}
export interface Administration {
  id: string; polityId: string; territoryId: string; status: 'preparing' | 'operating' | 'suspended';
  startedWeek: number; progressWeeks: number; lastProcessedWeek: number; reason: string;
}
export interface PoliticalSettlementEvent {
  id: string; title: string; detail: string; week: number; tone: 'good' | 'bad' | 'neutral';
}
export interface PoliticalSettlementState {
  version: 1; polities: CampaignPolity[];
  /** Latest request per polity/partner; older attempts remain in the bounded journal. */
  recognitions: Recognition[]; administrations: Administration[]; lastAdvancedWeek: number;
  journal: PoliticalSettlementEvent[];
}
export interface PoliticalSettlementContext {
  week: number; nationId: NationId; territories: readonly Territory[]; control: MapPoliticalLedger;
  relations: readonly DiplomaticRelation[]; politicalPower: number; treasury: number;
  stability: number; institutionalCapacity: number; canDeclare: boolean; canNegotiate: boolean; canAdminister: boolean;
}
export type PoliticalSettlementAction =
  | { kind: 'declare'; name: string; seatTerritoryId: string; declaration: 'independence' | 'representation' }
  | { kind: 'request-recognition'; partnerNationId: NationId }
  | { kind: 'start-administration'; territoryId: string }
  | { kind: 'resume-administration'; territoryId: string };
export interface PoliticalSettlementReview {
  allowed: boolean; reason: string; cost: { politicalPower: number; treasury: number }; dueWeek: number | null; summary: string;
}
export interface PoliticalSettlementResult {
  state: PoliticalSettlementState; accepted: boolean; reason: string; gameDelta: Partial<GameState>; events: PoliticalSettlementEvent[];
}

const profiles = new Map(nations.map((nation) => [nation.id, nation]));
const isNation = (value: unknown): value is NationId => typeof value === 'string' && profiles.has(value as NationId);
const validWeek = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const percent = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;
const resource = (value: number) => Number.isFinite(value) && value >= 0;
const validText = (value: unknown, max = 800): value is string => typeof value === 'string' && value.trim().length > 0
  && value.length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
const polityId = (nation: NationId) => `polity:${nation}`;
const recognitionId = (polity: string, partner: NationId, week: number) => `representation:${polity}:${partner}:${week}`;
const administrationId = (polity: string, territory: string) => `administration:${polity}:${territory}`;
const nationName = (nation: NationId) => profiles.get(nation)?.shortName ?? '국가 미확인';
const abstractRules = '수치는 게임 규칙이며 역사적 승인 가능성의 예측이 아닙니다.';
// Truncate display precision without rounding a just-below-threshold value up.
const metricLabel = (value: number) => (Math.floor(value * 100) / 100).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
const noSovereignty = '정부 대표권에 관한 양자 관계이며 영토 주권·국경·국제적 지위의 일괄 승인이 아닙니다.';
const isLandSite = (territory: Territory | undefined): territory is Territory => !!territory
  && territory.siteType !== 'sea' && !/해역|해상|바다|^sea$|^ocean$/i.test(territory.terrain)
  && getTerritoryGeography(territory.id)?.kind !== 'sea';

export function createPoliticalSettlementState(): PoliticalSettlementState {
  return { version: 1, polities: [], recognitions: [], administrations: [], lastAdvancedWeek: 0, journal: [] };
}
export function getPoliticalSettlementPolity(state: PoliticalSettlementState, nation: NationId): CampaignPolity | undefined {
  return state.polities.find((polity) => polity.nationId === nation);
}
function latestWeek(state: PoliticalSettlementState) {
  return Math.max(state.lastAdvancedWeek, ...state.polities.map((p) => p.declaredWeek),
    ...state.recognitions.map((r) => r.resolvedWeek ?? r.requestedWeek),
    ...state.administrations.map((a) => a.lastProcessedWeek), state.journal.at(-1)?.week ?? 0);
}
/** Game jurisdiction only: allied alignment alone grants no local powers. */
function jurisdiction(nation: NationId, territory: Territory | undefined, control: MapPoliticalLedger): boolean {
  if (!isLandSite(territory)) return false;
  const record = control.current[territory.id];
  if (record && (record.controller !== territory.controller || record.gameOwnerId !== territory.ownerId)) return false;
  if (record?.verifiedControllerNationId) return record.verifiedControllerNationId === nation;
  return territory.ownerId === nation && territory.controller === profiles.get(nation)?.alignment;
}
function administrationBlock(context: PoliticalSettlementContext, territory: Territory | undefined): string | null {
  if (!jurisdiction(context.nationId, territory, context.control)) return '확인된 자국 통제 또는 현재 자국 게임 관할이 필요합니다. 같은 진영이나 외국의 대표권 승인만으로는 행정할 수 없습니다.';
  if (!territory || !percent(territory.supply) || territory.supply < 40) return '현지 보급이 40 이상이어야 행정 준비를 시작·유지할 수 있습니다.';
  if (!percent(context.institutionalCapacity) || context.institutionalCapacity < 45) return '현재 국가의 행정역량이 45 이상이어야 행정 준비를 시작·유지할 수 있습니다.';
  return null;
}
function relationValue(context: PoliticalSettlementContext, partner: NationId): number | null {
  const matches = context.relations.filter((relation) => relation.id === partner);
  return matches.length === 1 && percent(matches[0].value) ? matches[0].value : null;
}
function withJournal(state: PoliticalSettlementState, events: readonly PoliticalSettlementEvent[]): PoliticalSettlementState {
  return { ...state, journal: [...state.journal, ...events.map((event) => ({ ...event }))].slice(-200) };
}
function refused(state: PoliticalSettlementState, reason: string): PoliticalSettlementResult {
  return { state, accepted: false, reason, gameDelta: {}, events: [] };
}

export function reviewPoliticalSettlementAction(state: PoliticalSettlementState, action: PoliticalSettlementAction, context: PoliticalSettlementContext): PoliticalSettlementReview {
  const review: PoliticalSettlementReview = { allowed: false, reason: '', cost: { politicalPower: 0, treasury: 0 }, dueWeek: null, summary: '' };
  const block = (reason: string) => ({ ...review, reason });
  if (!action || !['declare', 'request-recognition', 'start-administration', 'resume-administration'].includes(action.kind)) return block('지원하지 않는 정치 정착 행동입니다.');
  if (!validWeek(context.week) || context.week < latestWeek(state) || !isNation(context.nationId)) return block('현재 국가·주차를 확인해야 합니다. 이미 처리한 시점보다 과거에 명령할 수 없습니다.');
  if (!resource(context.politicalPower) || !resource(context.treasury)) return block('정치력·재정 기록을 확인해야 합니다.');
  const polity = getPoliticalSettlementPolity(state, context.nationId);
  if (action.kind === 'declare') {
    review.cost = { politicalPower: 12, treasury: 0 };
    review.summary = `${action.declaration === 'independence' ? '독립선언' : '정부 대표권 선언'}을 기록합니다. 선언 자체는 거점의 통제·귀속·법적 주권을 바꾸지 않습니다. 연락 거점 지정은 현지 행정 허가가 아닙니다.`;
    if (context.canDeclare !== true) return block('현재 보직에는 독립·대표권 선언 권한이 없습니다.');
    if (polity) return block('이 국가에는 이미 선언된 정치체가 있습니다. 같은 선언을 반복하거나 비용을 다시 지불할 수 없습니다.');
    if (!['independence', 'representation'].includes(action.declaration) || !validText(action.name, 80) || action.name.trim().length < 2) return block('선언 종류와 2~80자의 정치체 이름을 확인하세요.');
    const seat = context.territories.find((territory) => territory.id === action.seatTerritoryId);
    if (!isLandSite(seat)) return block('존재하는 육상 거점을 연락 거점으로 선택하세요. 외국 내 거점도 영토 권리 없이 표기할 수 있습니다.');
  } else if (action.kind === 'request-recognition') {
    review.cost = { politicalPower: 8, treasury: 0 }; review.dueWeek = context.week + 2;
    review.summary = `2주 뒤 해당 상대국과의 현재 관계·자국 안정도로 정부 대표권 승인을 검토합니다. 관계 65 이상·안정도 45 이상이면 승인, 관계 35 미만이면 거부, 그 외에는 보류합니다. ${noSovereignty} ${abstractRules}`;
    if (context.canNegotiate !== true) return block('현재 보직에는 정부 대표권 승인 협상 권한이 없습니다.');
    if (!polity) return block('먼저 독립 또는 정부 대표권 선언으로 정치체를 등록해야 합니다.');
    if (!isNation(action.partnerNationId) || action.partnerNationId === context.nationId) return block('자국이 아닌 유효한 상대국을 선택하세요.');
    const previous = state.recognitions.find((r) => r.polityId === polity.id && r.partnerNationId === action.partnerNationId);
    if (previous?.status === 'pending') return block('이 상대국에는 검토 중인 신청이 있습니다. 중복 비용을 지불하지 않습니다.');
    if (previous?.status === 'recognized') return block('이 상대국의 정부 대표권 승인은 이미 기록되어 있습니다.');
    if (previous && (previous.resolvedWeek === undefined || context.week < previous.resolvedWeek + 4)) return block(`거부·보류 결정 뒤 4주가 지나야 재신청할 수 있습니다.${previous.resolvedWeek !== undefined ? ` 재신청 가능: 제${previous.resolvedWeek + 5}주.` : ''}`);
    if (relationValue(context, action.partnerNationId) === null) return block('해당 상대국과의 현재 외교 관계 기록이 없어 신청할 수 없습니다.');
  } else {
    const resume = action.kind === 'resume-administration';
    review.cost = { politicalPower: resume ? 4 : 8, treasury: resume ? 0 : 4 }; review.dueWeek = context.week + 3;
    review.summary = '자국이 실제로 관할하는 거점에서 현지 행정을 준비합니다. 보급 40·행정역량 45 이상을 실제 연속 3주 유지해야 운영 상태가 됩니다. 외국의 대표권 승인은 필요하지 않으며, 중단 후에는 명시적 재개가 필요합니다. 영토 귀속·주권·국경은 변경하지 않습니다.';
    if (context.canAdminister !== true) return block('현재 보직에는 현지 행정 준비 권한이 없습니다.');
    if (!polity) return block('먼저 독립 또는 정부 대표권 선언으로 정치체를 등록해야 합니다.');
    const previous = state.administrations.find((a) => a.polityId === polity.id && a.territoryId === action.territoryId);
    if (resume && (!previous || previous.status !== 'suspended')) return block('중단된 현지 행정만 재개할 수 있습니다.');
    if (!resume && previous) return block(previous.status === 'suspended' ? '기존 행정이 중단되어 있습니다. 신규 시작 대신 재개를 선택하세요.' : '이미 준비 중이거나 운영 중인 거점입니다. 중복 비용을 지불하지 않습니다.');
    const reason = administrationBlock(context, context.territories.find((territory) => territory.id === action.territoryId));
    if (reason) return block(reason);
  }
  if (review.dueWeek !== null && !validWeek(review.dueWeek)) return block('처리 예정 주차가 유효하지 않습니다.');
  if (context.politicalPower < review.cost.politicalPower || context.treasury < review.cost.treasury) return block(`정치력 ${review.cost.politicalPower}·재정 ${review.cost.treasury}가 필요합니다. 현재 잔액으로 실행할 수 없습니다.`);
  return { ...review, allowed: true, reason: '조건을 충족합니다. 확인 후 실행하면 표시된 비용만 한 번 지불합니다.' };
}

export function executePoliticalSettlementAction(state: PoliticalSettlementState, action: PoliticalSettlementAction, context: PoliticalSettlementContext): PoliticalSettlementResult {
  const review = reviewPoliticalSettlementAction(state, action, context);
  if (!review.allowed) return refused(state, review.reason);
  let result = state; let event: PoliticalSettlementEvent;
  if (action.kind === 'declare') {
    const polity: CampaignPolity = { id: polityId(context.nationId), nationId: context.nationId, name: action.name.trim(), declaration: action.declaration, seatTerritoryId: action.seatTerritoryId, declaredWeek: context.week };
    result = { ...state, polities: [...state.polities, polity] };
    event = { id: `settlement:declare:${polity.id}`, week: context.week, tone: 'neutral', title: `${polity.name} · ${action.declaration === 'independence' ? '독립선언' : '대표권 선언'}`, detail: review.summary };
  } else {
    const polity = getPoliticalSettlementPolity(state, context.nationId)!;
    if (action.kind === 'request-recognition') {
      const recognition: Recognition = { id: recognitionId(polity.id, action.partnerNationId, context.week), polityId: polity.id, partnerNationId: action.partnerNationId, requestedWeek: context.week, dueWeek: context.week + 2, status: 'pending', reason: '신청 시점의 관계로 결과를 고정하지 않습니다. 검토 시점의 현재 조건을 확인합니다.' };
      result = { ...state, recognitions: [...state.recognitions.filter((r) => r.polityId !== polity.id || r.partnerNationId !== action.partnerNationId), recognition] };
      event = { id: `settlement:request:${recognition.id}`, week: context.week, tone: 'neutral', title: `${nationName(action.partnerNationId)}에 정부 대표권 승인 요청`, detail: `제${recognition.dueWeek + 1}주 검토 예정. ${review.summary}` };
    } else {
      const administration: Administration = { id: administrationId(polity.id, action.territoryId), polityId: polity.id, territoryId: action.territoryId, status: 'preparing', startedWeek: context.week, progressWeeks: 0, lastProcessedWeek: context.week, reason: '현재 관할·보급·행정역량을 확인했습니다. 다음 주부터 연속 3주 준비를 확인합니다.' };
      result = { ...state, administrations: [...state.administrations.filter((a) => a.id !== administration.id), administration] };
      const name = context.territories.find((territory) => territory.id === action.territoryId)!.name;
      event = { id: `settlement:${action.kind}:${administration.id}:${context.week}`, week: context.week, tone: 'neutral', title: `${name} 현지 행정 ${action.kind === 'resume-administration' ? '준비 재개' : '준비 시작'}`, detail: review.summary };
    }
  }
  return { state: withJournal(result, [event]), accepted: true, reason: `${event.title} 기록을 추가하고 표시된 비용을 반영했습니다.`,
    gameDelta: { politicalPower: -review.cost.politicalPower, treasury: review.cost.treasury ? -review.cost.treasury : 0 }, events: [{ ...event }] };
}

/** One observed tick, never automatic historical dates or fabricated foreign statistics. */
export function advancePoliticalSettlementWeek(state: PoliticalSettlementState, context: PoliticalSettlementContext): PoliticalSettlementResult {
  if (!validWeek(context.week) || !isNation(context.nationId) || context.week <= state.lastAdvancedWeek || context.week < latestWeek(state)) return refused(state, '이미 처리했거나 과거인 주차입니다. 주간 처리를 반복하지 않습니다.');
  const events: PoliticalSettlementEvent[] = [];
  const polities = new Map(state.polities.map((p) => [p.id, p]));
  const recognitions = state.recognitions.map((r): Recognition => {
    const polity = polities.get(r.polityId);
    if (!polity || polity.nationId !== context.nationId || r.status !== 'pending' || r.dueWeek > context.week) return r;
    const relation = relationValue(context, r.partnerNationId);
    let status: Recognition['status'] = 'deferred'; let reason: string;
    if (relation === null || !percent(context.stability)) reason = '현재 외교 관계 또는 안정도 기록을 확인할 수 없어 보류했습니다.';
    else if (relation < 35) { status = 'rejected'; reason = `현재 관계 ${metricLabel(relation)}로, 게임의 거부 기준 35 미만에 해당합니다.`; }
    else if (relation >= 65 && context.stability >= 45) { status = 'recognized'; reason = `현재 관계 ${metricLabel(relation)}·안정도 ${metricLabel(context.stability)}로, 승인 기준 관계 65·안정도 45 이상을 충족했습니다.`; }
    else reason = `현재 관계 ${metricLabel(relation)}·안정도 ${metricLabel(context.stability)}로 승인 기준 관계 65·안정도 45 이상을 모두 충족하지 않아 보류했습니다.`;
    reason += ` ${noSovereignty} ${abstractRules}`;
    events.push({ id: `settlement:recognition-result:${r.id}`, week: context.week, title: `${nationName(r.partnerNationId)}의 정부 대표권 ${status === 'recognized' ? '승인' : status === 'rejected' ? '거부' : '검토 보류'}`, detail: `${polity.name}: ${reason}`, tone: status === 'recognized' ? 'good' : status === 'rejected' ? 'bad' : 'neutral' });
    return { ...r, status, resolvedWeek: context.week, reason };
  });
  const administrations = state.administrations.map((a): Administration => {
    const polity = polities.get(a.polityId);
    if (!polity || a.status === 'suspended' || a.lastProcessedWeek >= context.week) return a;
    const territory = context.territories.find((site) => site.id === a.territoryId);
    const ownPolity = polity.nationId === context.nationId;
    const reason = !jurisdiction(polity.nationId, territory, context.control) ? '현재 통제·게임 관할을 잃어 행정을 중단했습니다. 거점을 다시 확보해도 자동 재개하지 않습니다.' : ownPolity ? administrationBlock(context, territory) : null;
    if (reason) {
      events.push({ id: `settlement:administration-suspended:${a.id}:${context.week}`, week: context.week, tone: 'bad', title: `${territory?.name ?? '기록된 거점'} 현지 행정 중단`, detail: reason });
      return { ...a, status: 'suspended', progressWeeks: 0, lastProcessedWeek: context.week, reason };
    }
    // Current-country capacity cannot progress a former career's foreign polity.
    if (!ownPolity) return a;
    if (a.status === 'operating') return { ...a, lastProcessedWeek: context.week };
    const consecutive = a.lastProcessedWeek === context.week - 1;
    const progressWeeks = consecutive ? a.progressWeeks + 1 : 1;
    const operating = progressWeeks >= 3;
    const detail = operating ? '관할을 유지하며 보급 40·행정역량 45 이상을 실제 연속 3주 확인했습니다. 현지 행정이 운영 상태가 됐습니다. 주권·귀속·외교 승인이나 반복 자원 보상은 발생하지 않습니다.'
      : `${consecutive ? '' : '관측하지 않은 주차를 소급하지 않고 연속 준비를 다시 셉니다. '}${progressWeeks}/3주 확인: 보급 ${metricLabel(territory!.supply)}·행정역량 ${metricLabel(context.institutionalCapacity)}. 다음 주에도 관할·보급·역량을 유지해야 합니다.`;
    events.push({ id: `settlement:administration-progress:${a.id}:${context.week}`, week: context.week, title: `${territory!.name} 현지 행정 ${operating ? '운영 개시' : `준비 ${progressWeeks}/3주`}`, detail, tone: operating ? 'good' : 'neutral' });
    return { ...a, status: operating ? 'operating' : 'preparing', progressWeeks: Math.min(3, progressWeeks), lastProcessedWeek: context.week, reason: detail };
  });
  return { state: withJournal({ ...state, recognitions, administrations, lastAdvancedWeek: context.week }, events), accepted: true, reason: '현재 조건으로 이번 주의 대표권·현지 행정을 확인했습니다.', gameDelta: {}, events: events.map((event) => ({ ...event })) };
}

/** Bad saves restart empty NOW; never manufacture an earlier history. */
export function normalizePoliticalSettlementState(value: unknown, territories: readonly Territory[], week: number): PoliticalSettlementState {
  const fallback = () => ({ ...createPoliticalSettlementState(), lastAdvancedWeek: validWeek(week) ? week : 0 });
  if (!validWeek(week) || !value || typeof value !== 'object' || Array.isArray(value)) return fallback();
  const raw = value as PoliticalSettlementState;
  if (raw.version !== 1 || !validWeek(raw.lastAdvancedWeek) || raw.lastAdvancedWeek > week
    || !Array.isArray(raw.polities) || raw.polities.length > profiles.size
    || !Array.isArray(raw.recognitions) || raw.recognitions.length > profiles.size * (profiles.size - 1)
    || !Array.isArray(raw.administrations) || raw.administrations.length > profiles.size * territories.length
    || !Array.isArray(raw.journal) || raw.journal.length > 200) return fallback();
  const sites = new Map(territories.map((territory) => [territory.id, territory]));
  const land = (id: string) => isLandSite(sites.get(id));
  const polities: CampaignPolity[] = []; const byId = new Map<string, CampaignPolity>();
  for (const p of raw.polities) {
    if (!p || !isNation(p.nationId) || p.id !== polityId(p.nationId) || byId.has(p.id)
      || !validText(p.name, 80) || p.name.trim().length < 2 || p.name !== p.name.trim()
      || !['independence', 'representation'].includes(p.declaration) || !land(p.seatTerritoryId)
      || !validWeek(p.declaredWeek) || p.declaredWeek > week) return fallback();
    const clean: CampaignPolity = { id: p.id, nationId: p.nationId, name: p.name, declaration: p.declaration, seatTerritoryId: p.seatTerritoryId, declaredWeek: p.declaredWeek };
    polities.push(clean); byId.set(clean.id, clean);
  }
  const pairs = new Set<string>(); const recognitions: Recognition[] = [];
  for (const r of raw.recognitions) {
    if (!r || !byId.has(r.polityId) || !isNation(r.partnerNationId)) return fallback();
    const polity = byId.get(r.polityId)!; const pair = `${r.polityId}|${r.partnerNationId}`;
    if (pairs.has(pair) || r.partnerNationId === polity.nationId
      || !validWeek(r.requestedWeek) || r.requestedWeek < polity.declaredWeek || r.requestedWeek > week
      || !validWeek(r.dueWeek) || r.dueWeek !== r.requestedWeek + 2
      || r.id !== recognitionId(polity.id, r.partnerNationId, r.requestedWeek)
      || !['pending', 'recognized', 'deferred', 'rejected'].includes(r.status) || !validText(r.reason)
      || (r.status === 'pending' ? r.resolvedWeek !== undefined : !validWeek(r.resolvedWeek) || r.resolvedWeek < r.dueWeek || r.resolvedWeek > week || r.resolvedWeek > raw.lastAdvancedWeek)) return fallback();
    pairs.add(pair); recognitions.push({ id: r.id, polityId: r.polityId, partnerNationId: r.partnerNationId, requestedWeek: r.requestedWeek, dueWeek: r.dueWeek, status: r.status, reason: r.reason, ...(r.resolvedWeek !== undefined ? { resolvedWeek: r.resolvedWeek } : {}) });
  }
  const adminIds = new Set<string>(); const administrations: Administration[] = [];
  for (const a of raw.administrations) {
    if (!a || !byId.has(a.polityId) || !land(a.territoryId) || a.id !== administrationId(a.polityId, a.territoryId) || adminIds.has(a.id)
      || !['preparing', 'operating', 'suspended'].includes(a.status) || !validText(a.reason)
      || !validWeek(a.startedWeek) || a.startedWeek < byId.get(a.polityId)!.declaredWeek || a.startedWeek > week
      || !validWeek(a.lastProcessedWeek) || a.lastProcessedWeek < a.startedWeek || a.lastProcessedWeek > week
      || a.lastProcessedWeek > Math.max(raw.lastAdvancedWeek, a.startedWeek)
      || !Number.isSafeInteger(a.progressWeeks) || a.progressWeeks < 0 || a.progressWeeks > 3
      || a.progressWeeks > a.lastProcessedWeek - a.startedWeek
      || a.status === 'operating' && a.progressWeeks !== 3 || a.status === 'preparing' && a.progressWeeks >= 3 || a.status === 'suspended' && a.progressWeeks !== 0) return fallback();
    adminIds.add(a.id); administrations.push({ id: a.id, polityId: a.polityId, territoryId: a.territoryId, status: a.status, startedWeek: a.startedWeek, progressWeeks: a.progressWeeks, lastProcessedWeek: a.lastProcessedWeek, reason: a.reason });
  }
  const ids = new Set<string>(); const journal: PoliticalSettlementEvent[] = []; let previousWeek = 0;
  for (const event of raw.journal) {
    if (!event || !validText(event.id, 500) || ids.has(event.id) || !validText(event.title, 180) || !validText(event.detail, 1600)
      || !validWeek(event.week) || event.week < previousWeek || event.week > week || !['good', 'bad', 'neutral'].includes(event.tone)) return fallback();
    ids.add(event.id); previousWeek = event.week; journal.push({ id: event.id, title: event.title, detail: event.detail, week: event.week, tone: event.tone });
  }
  return { version: 1, polities, recognitions, administrations, journal, lastAdvancedWeek: raw.lastAdvancedWeek };
}
