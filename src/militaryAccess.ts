import { nations } from './campaign';
import type { MapPoliticalLedger } from './mapPoliticalLedger';
import { getTreatySiteController } from './territorialTreaties';
import { getTerritoryGeography } from './territoryGeography';
import type { DiplomaticRelation, Faction, NationId, Territory } from './types';

export type MilitaryAccessKind = 'transit' | 'naval-base';
export type MilitaryAccessStatus = 'proposed' | 'accepted' | 'active' | 'notice' | 'expired' | 'revoked' | 'rejected' | 'withdrawn';
export interface MilitaryAccessAgreement {
  id: string; hostNationId: NationId; beneficiaryNationId: NationId; proposerNationId: NationId;
  territoryId: string; kind: MilitaryAccessKind; durationWeeks: 13 | 26 | 52;
  status: MilitaryAccessStatus; proposedWeek: number; responseDueWeek: number;
  activatedWeek?: number; expiresWeek?: number; closedWeek?: number; reason: string;
}
export interface MilitaryAccessEvent { id: string; title: string; detail: string; week: number; tone: 'good' | 'bad' | 'neutral' }
export interface MilitaryAccessState { version: 1; agreements: MilitaryAccessAgreement[]; lastAdvancedWeek: number; journal: MilitaryAccessEvent[] }
export interface MilitaryAccessOperationalContext {
  state: MilitaryAccessState; control: MapPoliticalLedger; nationId: NationId; week: number; playerFaction: Faction;
}
export interface MilitaryAccessContext extends MilitaryAccessOperationalContext {
  territories: readonly Territory[]; relations: readonly DiplomaticRelation[];
  politicalPower: number; treasury: number; stability: number;
  canNegotiate: boolean; canRatify: boolean; approvalSupport: number; approvalLabel: string;
}
export type MilitaryAccessAction = {
  kind: 'propose'; partnerNationId: NationId; territoryId: string; accessKind: MilitaryAccessKind;
  direction: 'request' | 'offer'; durationWeeks: 13 | 26 | 52;
} | { kind: 'activate' | 'withdraw' | 'revoke'; agreementId: string };
export interface MilitaryAccessReview {
  allowed: boolean; reason: string; summary: string; cost: { politicalPower: number; treasury: number }; dueWeek: number | null;
}
export type MilitaryAccessPurpose = 'transit' | 'land-departure' | 'naval-base' | 'naval-departure' | 'offensive' | 'land-supply';
export interface MilitaryAccessDecision { allowed: boolean; reason: string; source: 'national' | 'coalition' | 'agreement' | 'withdrawal' | 'denied'; agreementId?: string }

const knownNations = new Set(nations.map((n) => n.id));
const weekValid = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0;
const nationValid = (n: unknown): n is NationId => knownNations.has(n as NationId);
const percent = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;
const resource = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const unfinished = (a: MilitaryAccessAgreement) => ['proposed', 'accepted', 'active', 'notice'].includes(a.status);
const agreementId = (a: Pick<MilitaryAccessAgreement, 'hostNationId' | 'beneficiaryNationId' | 'territoryId' | 'kind' | 'proposedWeek'>) =>
  JSON.stringify(['access', a.hostNationId, a.beneficiaryNationId, a.territoryId, a.kind, a.proposedWeek]);
export const militaryAccessKindLabels: Record<MilitaryAccessKind, string> = { transit: '육군 통행권', 'naval-base': '해군 기지 사용권' };
export const militaryAccessStatusLabels: Record<MilitaryAccessStatus, string> = {
  proposed: '상대국 답변 대기', accepted: '수락 · 국내 승인 대기', active: '사용 가능', notice: '종료 통고 · 철수만 가능',
  expired: '기간 만료', revoked: '사용 중단', rejected: '제안 거절', withdrawn: '제안 철회',
};
export function createMilitaryAccessState(week = 0): MilitaryAccessState {
  return { version: 1, agreements: [], lastAdvancedWeek: weekValid(week) ? week : 0, journal: [] };
}
export function isMilitaryAccessPort(site: Territory | undefined): boolean {
  return !!site && site.siteType === 'port' && site.terrain !== '해역' && getTerritoryGeography(site.id)?.kind !== 'sea';
}
function ledgerCurrent(context: MilitaryAccessOperationalContext): boolean {
  const ledger = context.control;
  return weekValid(context.week) && !!ledger && weekValid(ledger.startedWeek) && ledger.startedWeek <= context.week
    && Array.isArray(ledger.changes) && !!ledger.latestByTerritory
    && [...ledger.changes, ...Object.values(ledger.latestByTerritory)].every((change) => !!change && weekValid(change.week) && change.week <= context.week);
}
function relation(context: MilitaryAccessContext, nationId: NationId): number | undefined {
  const code = nations.find((n) => n.id === nationId)?.code;
  const value = context.relations.find((r) => r.id === nationId || r.code === code)?.value;
  return percent(value) ? value : undefined;
}
function currentHost(a: MilitaryAccessAgreement, context: MilitaryAccessContext): boolean {
  const site = context.territories.find((t) => t.id === a.territoryId);
  return !!site && getTreatySiteController(site, context.control) === a.hostNationId
    && (a.kind !== 'naval-base' || isMilitaryAccessPort(site));
}

/** Bilateral access is an overlay, never a change of ownership or sovereignty.
 * Existing coalition logistics are retained for old campaigns. Once an agreement
 * has actually entered into force, its termination cannot fall back to that shortcut. */
export function getSiteMilitaryAccess(site: Territory | undefined, purpose: MilitaryAccessPurpose, context: MilitaryAccessOperationalContext): MilitaryAccessDecision {
  const deny = (reason: string): MilitaryAccessDecision => ({ allowed: false, reason, source: 'denied' });
  if (!site || !nationValid(context.nationId) || !ledgerCurrent(context) || context.state.lastAdvancedWeek > context.week) return deny('현재 거점·통제 원장·주차를 확인할 수 없습니다.');
  if (site.siteType === 'sea' || site.terrain === '해역' || getTerritoryGeography(site.id)?.kind === 'sea') return deny('이 협정은 육상 거점·항구에 한정됩니다. 일반 해역·해협 통과권은 별도입니다.');
  const host = getTreatySiteController(site, context.control);
  // Legacy coalition sites can include occupied land with no verified national controller.
  const recorded = context.control.current[site.id];
  if (!Object.prototype.hasOwnProperty.call(context.control.current, site.id) || !recorded || recorded.controller !== site.controller || recorded.gameOwnerId !== site.ownerId) return deny('거점의 실제 통제 기록이 바뀌었습니다.');
  if (recorded.verifiedControllerNationId !== undefined && !nationValid(recorded.verifiedControllerNationId)) return deny('현재 통제 국가 기록을 확인할 수 없습니다.');
  if (purpose === 'naval-base' && !isMilitaryAccessPort(site)) return deny('해군 기지 사용은 항구에서만 가능합니다.');
  if (host === context.nationId) return { allowed: true, reason: '자국이 현재 통제하는 거점입니다.', source: 'national' };
  const history = context.state.agreements.filter((a) => a.territoryId === site.id && a.beneficiaryNationId === context.nationId && a.activatedWeek !== undefined);
  if (purpose === 'offensive' && history.length) return deny('통행·기지 사용 협정에는 외국 거점에서 공격할 권한이 없습니다. 자국 작전 거점으로 먼저 이동하세요.');
  if (purpose === 'land-supply' && history.length) return deny('통행권은 육군 주둔·보급 협정이 아닙니다. 정규 보급 거점으로 복귀해야 회복할 수 있습니다.');
  const naval = purpose === 'naval-base' || purpose === 'naval-departure';
  const kind = naval ? 'naval-base' : 'transit';
  const relevant = history.filter((a) => a.kind === kind);
  const active = relevant.find((a) => a.status === 'active' && a.hostNationId === host && a.activatedWeek! <= context.week && context.week < (a.expiresWeek ?? -1));
  if (active) return { allowed: true, reason: `${militaryAccessKindLabels[kind]} · ${active.expiresWeek! - context.week}주 남음. 공격·소유권 이전은 포함하지 않습니다.`, source: 'agreement', agreementId: active.id };
  const departure = purpose === 'land-departure' || purpose === 'naval-departure';
  const grace = relevant.find((a) => {
    const stopped = a.closedWeek ?? a.expiresWeek;
    return a.hostNationId === host && stopped !== undefined && stopped <= context.week && context.week < stopped + 2;
  });
  if (departure && grace) return { allowed: true, reason: '합의된 2주 철수 기간입니다. 신규 진입·공격·급유는 허용하지 않습니다.', source: 'withdrawal', agreementId: grace.id };
  if (history.length) return deny(relevant.length ? '해당 거점의 사용권이 만료·철회되었거나 제공국이 통제를 잃었습니다. 재협상 또는 다른 거점이 필요합니다.' : '이 거점의 협정은 이 행동을 허용하지 않습니다. 육군 통행과 해군 기지 사용을 별도로 협상하세요.');
  if (site.controller === context.playerFaction && ['allies', 'axis'].includes(context.playerFaction)) return { allowed: true, reason: '기존 연합 작전 접근 범위입니다. 별도 양자 협정의 효력이 시작되면 그 조건을 우선합니다.', source: 'coalition' };
  return deny('자국·연합 작전 거점이 아닙니다. 제공국과 해당 거점의 사용권을 먼저 체결하세요.');
}

export function reviewMilitaryAccessAction(state: MilitaryAccessState, action: MilitaryAccessAction, context: MilitaryAccessContext): MilitaryAccessReview {
  const result: MilitaryAccessReview = { allowed: false, reason: '', summary: '', cost: { politicalPower: 0, treasury: 0 }, dueWeek: null };
  const deny = (reason: string) => ({ ...result, reason });
  if (!action || !['propose', 'activate', 'withdraw', 'revoke'].includes(action.kind)) return deny('지원하지 않는 협정 행동입니다.');
  if (!nationValid(context.nationId) || !ledgerCurrent(context) || state.lastAdvancedWeek > context.week || state.agreements.some((a) => a.proposedWeek > context.week || (a.activatedWeek ?? 0) > context.week || (a.closedWeek ?? 0) > context.week)) return deny('국가·주차·통제 원장이 현재 시점과 일치하지 않습니다.');
  if (!resource(context.politicalPower) || !resource(context.treasury)) return deny('정치력·국고 기록이 유효하지 않습니다.');
  if (action.kind === 'propose') {
    result.cost.politicalPower = 4; result.dueWeek = context.week + 2;
    const threshold = action.direction === 'offer' ? 50 : action.accessKind === 'transit' ? 60 : 70;
    result.summary = `2주 후 상대국 관계 ${threshold} 이상·안정도 45 이상이면 수락합니다. 이후 별도 국내 승인(지지 60 이상)이 필요합니다. ${action.durationWeeks}주 유효 · 종료 시 철수 전용 2주. 통행권은 보급·공격을, 기지권은 육군 하선·공군 운용·공격 출격을 허용하지 않습니다. 외국에 제공해도 외국 부대를 새로 생성하지 않습니다.`;
    if (context.canNegotiate !== true) return deny('현재 보직에는 국가 간 사용권 협상 권한이 없습니다. 외교를 담당하는 정치 상위 보직이 필요합니다.');
    if (!nationValid(action.partnerNationId) || action.partnerNationId === context.nationId || !['request', 'offer'].includes(action.direction) || !['transit', 'naval-base'].includes(action.accessKind) || ![13, 26, 52].includes(action.durationWeeks)) return deny('상대국·권리 종류·방향·기간을 확인하세요.');
    const site = context.territories.find((t) => t.id === action.territoryId);
    const host = action.direction === 'request' ? action.partnerNationId : context.nationId;
    const beneficiary = action.direction === 'request' ? context.nationId : action.partnerNationId;
    if (!site || getTreatySiteController(site, context.control) !== host) return deny('제공국이 현재 직접 통제하는 육상 거점만 협상할 수 있습니다.');
    if (action.accessKind === 'naval-base' && !isMilitaryAccessPort(site)) return deny('해군 기지 사용권은 항구 거점에서만 협상할 수 있습니다.');
    if (state.agreements.some((a) => a.territoryId === site.id && a.beneficiaryNationId === beneficiary && a.kind === action.accessKind && (unfinished(a) || a.proposedWeek === context.week))) return deny('같은 거점·이용국·권리의 협정이 이미 진행 중이거나 이번 주에 기록되었습니다.');
    if (state.agreements.length >= 4096) return deny('협정 보존 한도에 도달했습니다. 기존 기록은 삭제하지 않습니다.');
    if (relation(context, action.partnerNationId) === undefined || !percent(context.stability)) return deny('상대국 관계와 안정도 정보가 필요합니다.');
  } else {
    const a = state.agreements.find((entry) => entry.id === action.agreementId);
    if (!a || ![a.hostNationId, a.beneficiaryNationId].includes(context.nationId)) return deny('현재 국가가 당사자인 협정만 처리할 수 있습니다.');
    if (action.kind === 'withdraw') {
      result.summary = '비준 전 제안을 철회합니다. 이미 사용한 협상 비용은 환급하지 않습니다.';
      if (!context.canNegotiate || a.proposerNationId !== context.nationId || !['proposed', 'accepted'].includes(a.status)) return deny('제안국의 협상권자로서 비준 전 제안만 철회할 수 있습니다.');
    } else if (action.kind === 'revoke') {
      result.summary = '신규 진입·출격·급유를 즉시 중단합니다. 현재 주둔 부대에는 계약상 철수 전용 2주를 남깁니다. 자동 이동·삭제·환급은 없습니다.';
      if (!context.canRatify || a.status !== 'active' || context.week >= (a.expiresWeek ?? 0)) return deny('효력이 있는 협정만 최고 정치 보직에서 종료 통고할 수 있습니다.');
    } else {
      result.cost = { politicalPower: 6, treasury: a.kind === 'naval-base' ? 8 : 2 };
      result.dueWeek = context.week;
      result.summary = `${militaryAccessKindLabels[a.kind]}을 지금부터 ${a.durationWeeks}주 발효합니다. 국고 비용은 일회성 협정 이행 비용이며 주간 임대료가 아닙니다. 영토 귀속·통제·병력 위치는 그대로입니다. 기지 이용은 함대의 실제 이동과 별도 명령이 필요합니다.`;
      if (!context.canRatify || a.proposerNationId !== context.nationId || a.status !== 'accepted') return deny('제안국의 최고 정치 보직만 상대국 수락 후 국내 승인을 집행할 수 있습니다.');
      if (!percent(context.approvalSupport) || context.approvalSupport < 60 || !context.approvalLabel?.trim() || !percent(context.stability) || context.stability < 45) return deny('국내 승인 지지 60·안정도 45 이상이 필요합니다.');
      const partner = a.hostNationId === context.nationId ? a.beneficiaryNationId : a.hostNationId;
      if ((relation(context, partner) ?? -1) < (a.proposerNationId === a.hostNationId ? 50 : a.kind === 'transit' ? 60 : 70)) return deny('수락 뒤 상대국 관계가 협상 기준보다 떨어졌습니다. 관계를 회복하거나 제안을 철회하세요.');
      if (!currentHost(a, context)) return deny('제공국이 더 이상 해당 거점을 통제하지 않습니다.');
      if (state.agreements.some((other) => other.id !== a.id && other.territoryId === a.territoryId && other.beneficiaryNationId === a.beneficiaryNationId && other.kind === a.kind && ['active', 'notice'].includes(other.status))) return deny('동일 권리의 다른 협정이 이미 유효합니다.');
    }
  }
  if (context.politicalPower < result.cost.politicalPower || context.treasury < result.cost.treasury) return deny('표시된 정치력·국고 비용을 지불할 수 없습니다.');
  return { ...result, allowed: true, reason: '조건 충족 · 대상과 비용을 확인한 뒤 집행하세요.' };
}

function withEvents(state: MilitaryAccessState, agreements: MilitaryAccessAgreement[], events: MilitaryAccessEvent[], week: number): MilitaryAccessState {
  return { ...state, agreements, lastAdvancedWeek: week, journal: [...state.journal, ...events].slice(-160) };
}
export function executeMilitaryAccessAction(state: MilitaryAccessState, action: MilitaryAccessAction, context: MilitaryAccessContext) {
  const review = reviewMilitaryAccessAction(state, action, context);
  if (!review.allowed) return { accepted: false, reason: review.reason, state, delta: {}, events: [] as MilitaryAccessEvent[] };
  let entry: MilitaryAccessAgreement;
  let title: string;
  if (action.kind === 'propose') {
    const partial = { hostNationId: action.direction === 'request' ? action.partnerNationId : context.nationId,
      beneficiaryNationId: action.direction === 'request' ? context.nationId : action.partnerNationId,
      territoryId: action.territoryId, kind: action.accessKind, proposedWeek: context.week };
    entry = { ...partial, id: agreementId(partial), proposerNationId: context.nationId, durationWeeks: action.durationWeeks,
      status: 'proposed', responseDueWeek: context.week + 2, reason: '2주 후 상대국 답변 확인 · 아직 이동 권한 없음' };
    title = '사용권 협상 제안';
  } else {
    entry = { ...state.agreements.find((a) => a.id === action.agreementId)! };
    if (action.kind === 'activate') { entry.status = 'active'; entry.activatedWeek = context.week; entry.expiresWeek = context.week + entry.durationWeeks; entry.reason = '국내 승인 완료 · 지정 거점·권리만 이용 가능'; title = '사용권 협정 발효'; }
    else if (action.kind === 'withdraw') { entry.status = 'withdrawn'; entry.closedWeek = context.week; entry.reason = '제안국이 비준 전 철회'; title = '사용권 제안 철회'; }
    else { entry.status = 'notice'; entry.closedWeek = context.week; entry.reason = '종료 통고 · 신규 이용 중단, 2주 철수 전용'; title = '사용권 종료 통고'; }
  }
  const site = context.territories.find((t) => t.id === entry.territoryId);
  const event: MilitaryAccessEvent = { id: `${entry.id}:${action.kind}:${context.week}`, title, detail: `${site?.name ?? entry.territoryId} · ${militaryAccessKindLabels[entry.kind]} — ${review.summary}`, week: context.week, tone: action.kind === 'activate' ? 'good' : 'neutral' };
  const agreements = action.kind === 'propose' ? [...state.agreements, entry] : state.agreements.map((a) => a.id === entry.id ? entry : a);
  return { accepted: true, reason: entry.reason, state: withEvents(state, agreements, [event], state.lastAdvancedWeek), delta: { politicalPower: -review.cost.politicalPower || 0, treasury: -review.cost.treasury || 0 }, events: [event] };
}

export function advanceMilitaryAccessWeek(state: MilitaryAccessState, context: MilitaryAccessContext) {
  if (!ledgerCurrent(context) || !weekValid(state.lastAdvancedWeek) || context.week <= state.lastAdvancedWeek) return { state, events: [] as MilitaryAccessEvent[] };
  const events: MilitaryAccessEvent[] = [];
  const agreements = state.agreements.map((old) => {
    let a = old;
    if (old.status === 'proposed' && context.week >= old.responseDueWeek) {
      // No fabricated foreign diplomatic data after a career changes countries.
      if (old.proposerNationId !== context.nationId) return old;
      const partner = old.hostNationId === context.nationId ? old.beneficiaryNationId : old.hostNationId;
      const threshold = old.proposerNationId === old.hostNationId ? 50 : old.kind === 'transit' ? 60 : 70;
      const accepted = currentHost(old, context) && (relation(context, partner) ?? -1) >= threshold && percent(context.stability) && context.stability >= 45;
      a = { ...old, status: accepted ? 'accepted' : 'rejected', reason: accepted ? '상대국 수락 · 국내 승인 전에는 이용 불가' : '현재 관계·안정도 또는 제공국 통제 조건을 충족하지 못해 거절', ...(!accepted ? { closedWeek: context.week } : {}) };
    } else if (['active', 'notice'].includes(old.status)) {
      if (!currentHost(old, context)) a = { ...old, status: 'revoked', closedWeek: context.week, reason: '제공국의 현지 통제 상실 · 기존 협정으로 새 통제국을 통과할 수 없음' };
      else if (old.status === 'notice' && context.week >= old.closedWeek! + 2) a = { ...old, status: 'revoked', reason: '종료 통고의 2주 철수 기간 종료 · 재협상 필요' };
      else if (old.status === 'active' && context.week >= old.expiresWeek!) a = { ...old, status: 'expired', closedWeek: old.expiresWeek, reason: '계약 만료 · 만료 시점부터 철수 전용 2주, 신규 진입·급유 불가' };
      else if (old.status === 'active' && context.week < old.expiresWeek! && old.expiresWeek! - context.week <= 2 && old.expiresWeek! - state.lastAdvancedWeek > 2) {
        events.push({ id: `${old.id}:expiry-warning`, title: '사용권 만료 임박', detail: `${context.territories.find((t) => t.id === old.territoryId)?.name ?? old.territoryId} · ${old.expiresWeek! - context.week}주 후 만료. 병력과 함대를 미리 철수시키세요.`, week: context.week, tone: 'bad' });
      }
    }
    if (a !== old) events.push({ id: `${a.id}:${a.status}:${context.week}`, title: `${militaryAccessKindLabels[a.kind]} · ${militaryAccessStatusLabels[a.status]}`, detail: `${context.territories.find((t) => t.id === a.territoryId)?.name ?? a.territoryId} — ${a.reason}`, week: context.week, tone: a.status === 'accepted' ? 'good' : 'bad' });
    return a;
  });
  return { state: withEvents(state, agreements, events, context.week), events };
}

export function normalizeMilitaryAccessState(value: unknown, territories: readonly Territory[], week: number): MilitaryAccessState {
  const result = createMilitaryAccessState(week);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  const raw = value as Partial<MilitaryAccessState>;
  if (raw.version !== 1 || !Array.isArray(raw.agreements) || !weekValid(raw.lastAdvancedWeek) || raw.lastAdvancedWeek > week) return result;
  const sites = new Set(territories.map((t) => t.id)); const seen = new Set<string>(); const live = new Set<string>();
  for (const entry of raw.agreements.slice(0, 4096)) {
    if (!entry || typeof entry !== 'object') continue;
    const a = entry;
    if (!nationValid(a.hostNationId) || !nationValid(a.beneficiaryNationId) || a.hostNationId === a.beneficiaryNationId || ![a.hostNationId, a.beneficiaryNationId].includes(a.proposerNationId)
      || !sites.has(a.territoryId) || !['transit', 'naval-base'].includes(a.kind) || ![13, 26, 52].includes(a.durationWeeks)
      || !Object.prototype.hasOwnProperty.call(militaryAccessStatusLabels, a.status) || !weekValid(a.proposedWeek) || a.proposedWeek > week || a.responseDueWeek !== a.proposedWeek + 2 || a.id !== agreementId(a) || seen.has(a.id)) continue;
    const entered = a.activatedWeek !== undefined;
    if (entered && (!weekValid(a.activatedWeek) || a.activatedWeek < a.responseDueWeek || a.activatedWeek > week || a.expiresWeek !== a.activatedWeek + a.durationWeeks)) continue;
    if (!entered && (a.expiresWeek !== undefined || ['active', 'notice', 'expired', 'revoked'].includes(a.status))) continue;
    if (entered && ['proposed', 'accepted', 'rejected', 'withdrawn'].includes(a.status)) continue;
    if (a.closedWeek !== undefined && (!weekValid(a.closedWeek) || a.closedWeek < (a.activatedWeek ?? a.proposedWeek) || a.closedWeek > week)) continue;
    if (['notice', 'expired', 'revoked', 'rejected', 'withdrawn'].includes(a.status) && a.closedWeek === undefined) continue;
    if (['active', 'proposed', 'accepted'].includes(a.status) && a.closedWeek !== undefined) continue;
    if (a.status === 'expired' && a.closedWeek !== a.expiresWeek) continue;
    if (a.status === 'accepted' && week < a.responseDueWeek) continue;
    const key = JSON.stringify([a.territoryId, a.beneficiaryNationId, a.kind]);
    if (unfinished(a) && live.has(key)) continue;
    seen.add(a.id); if (unfinished(a)) live.add(key);
    result.agreements.push({ id: a.id, hostNationId: a.hostNationId, beneficiaryNationId: a.beneficiaryNationId, proposerNationId: a.proposerNationId,
      territoryId: a.territoryId, kind: a.kind, durationWeeks: a.durationWeeks, status: a.status, proposedWeek: a.proposedWeek, responseDueWeek: a.responseDueWeek,
      ...(entered ? { activatedWeek: a.activatedWeek, expiresWeek: a.expiresWeek } : {}), ...(a.closedWeek !== undefined ? { closedWeek: a.closedWeek } : {}),
      reason: typeof a.reason === 'string' ? a.reason.slice(0, 1000) : '불러온 협정 · 현재 이용 조건을 다시 확인하세요.' });
  }
  result.lastAdvancedWeek = raw.lastAdvancedWeek;
  // Journal text is not an authority source; restore only valid, past, distinct receipts.
  if (Array.isArray(raw.journal)) result.journal = raw.journal.filter((e, i, all) => e && typeof e.id === 'string' && e.id.length < 500 && typeof e.title === 'string' && e.title.length < 200 && typeof e.detail === 'string' && e.detail.length < 2000 && weekValid(e.week) && e.week <= week && ['good', 'bad', 'neutral'].includes(e.tone) && all.findIndex((other) => other?.id === e.id) === i).slice(-160).map((e) => ({ ...e }));
  return result;
}
