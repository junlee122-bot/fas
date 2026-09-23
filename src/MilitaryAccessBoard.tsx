import { useId, useRef, useState } from 'react';
import { nations } from './campaign';
import { getCampaignDateForWeek } from './campaignCalendar';
import { GameIcon } from './GameIcon';
import { AccessScopeArt } from './AccessScopeArt';
import { getSiteMilitaryAccess, isMilitaryAccessPort, reviewMilitaryAccessAction } from './militaryAccess';
import type { MilitaryAccessAction, MilitaryAccessAgreement, MilitaryAccessContext, MilitaryAccessState } from './militaryAccess';
import { getTreatySiteController } from './territorialTreaties';
import type { NationId, Territory } from './types';
import './MilitaryAccessBoard.css';

export interface MilitaryAccessBoardProps {
  state: MilitaryAccessState;
  context: MilitaryAccessContext;
  nationName: string;
  formatMoney: (value: number) => string;
  onExecute: (action: MilitaryAccessAction) => void;
  onOpenMap: (id: string) => void;
  authorityNote: string;
  busy?: boolean;
  fleets?: readonly { id: string; name: string }[];
  onRebase?: (fleetId: string, territoryId: string) => void;
}

type AccessKind = MilitaryAccessAgreement['kind'];
type AccessDuration = MilitaryAccessAgreement['durationWeeks'];
type ReviewInput = Pick<MilitaryAccessBoardProps, 'state' | 'context' | 'authorityNote' | 'busy'> & { formKey?: string };
type ActionAssessment = ReturnType<typeof reviewMilitaryAccessAction>;
export interface MilitaryAccessReviewTarget {
  territoryId: string;
  territoryName: string;
  hostNationId: NationId;
  beneficiaryNationId: NationId;
  kind: AccessKind;
  durationWeeks: AccessDuration;
}
export interface MilitaryAccessReviewSnapshot {
  action: MilitaryAccessAction;
  target: MilitaryAccessReviewTarget;
  fingerprint: string;
  summary: string;
  cost: ActionAssessment['cost'];
  dueWeek: number | null;
}

const nationNames = new Map(nations.map((nation) => [nation.id, nation.shortName]));
const nationLabel = (id: NationId) => nationNames.get(id) ?? '국가 미확인';
const kindLabels: Record<AccessKind, string> = { transit: '육상 통행권', 'naval-base': '해군 기지 사용권' };
const statusLabels: Record<MilitaryAccessAgreement['status'], string> = {
  proposed: '상대국 답변 대기', accepted: '수락 · 발효 확인 필요', active: '발효 중', notice: '종료 통고 · 철수 중',
  expired: '기간 만료', revoked: '철회 종료', rejected: '상대국 거부', withdrawn: '제안 철회',
};
const actionTitles: Record<MilitaryAccessAction['kind'], string> = {
  propose: '접근권 제안 발송', activate: '협정 발효', withdraw: '발효 전 제안 철회', revoke: '협정 종료 통고',
};
const statusOrder: Record<MilitaryAccessAgreement['status'], number> = {
  notice: 0, accepted: 1, proposed: 2, active: 3, expired: 4, revoked: 4, rejected: 4, withdrawn: 4,
};
const emptyFleets: NonNullable<MilitaryAccessBoardProps['fleets']> = [];
const metric = (value: number) => Number.isFinite(value) ? value.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '확인 불가';

export function formatMilitaryAccessWeek(week: number): string {
  if (!Number.isSafeInteger(week) || week < 0) return '시점 확인 불가';
  const date = getCampaignDateForWeek(week);
  return `제${week + 1}주 · ${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
}

export const militaryAccessFingerprint = (input: ReviewInput): string => JSON.stringify([
  input.state, input.context, input.authorityNote, Boolean(input.busy), input.formKey ?? '',
]);

function assessMilitaryAccessAction(input: ReviewInput, action: MilitaryAccessAction): ActionAssessment {
  const result = reviewMilitaryAccessAction(input.state, action, input.context);
  if (input.busy) return { ...result, allowed: false, reason: '기간 진행 중입니다. 주간 처리가 끝난 뒤 최신 조건을 검토하세요.' };
  if (JSON.stringify(input.state) !== JSON.stringify(input.context.state)) {
    return { ...result, allowed: false, reason: '화면과 작전의 협정 원장이 일치하지 않습니다. 최신 기록을 불러온 뒤 다시 검토하세요.' };
  }
  return result;
}

export function prepareMilitaryAccessReview(input: ReviewInput, action: MilitaryAccessAction): {
  review: MilitaryAccessReviewSnapshot | null; reason: string;
} {
  const result = assessMilitaryAccessAction(input, action);
  if (!result.allowed) return { review: null, reason: result.reason };
  const agreement = action.kind === 'propose' ? undefined : input.state.agreements.find((entry) => entry.id === action.agreementId);
  if (action.kind !== 'propose' && !agreement) return { review: null, reason: '검토할 협정 기록을 확인할 수 없습니다.' };
  const territoryId = action.kind === 'propose' ? action.territoryId : agreement!.territoryId;
  const target: MilitaryAccessReviewTarget = {
    territoryId,
    territoryName: input.context.territories.find((territory) => territory.id === territoryId)?.name ?? '현재 목록에 없는 거점',
    hostNationId: action.kind === 'propose' ? action.direction === 'offer' ? input.context.nationId : action.partnerNationId : agreement!.hostNationId,
    beneficiaryNationId: action.kind === 'propose' ? action.direction === 'offer' ? action.partnerNationId : input.context.nationId : agreement!.beneficiaryNationId,
    kind: action.kind === 'propose' ? action.accessKind : agreement!.kind,
    durationWeeks: action.kind === 'propose' ? action.durationWeeks : agreement!.durationWeeks,
  };
  return {
    review: { action: { ...action }, target, fingerprint: militaryAccessFingerprint(input), summary: result.summary, cost: { ...result.cost }, dueWeek: result.dueWeek },
    reason: '아직 집행하지 않았습니다. 제공국·사용국·거점·권리 범위를 확인하세요.',
  };
}

export function confirmMilitaryAccessReview(
  review: MilitaryAccessReviewSnapshot,
  input: ReviewInput & Pick<MilitaryAccessBoardProps, 'onExecute'>,
  gate: { current: string | null },
): { accepted: boolean; message: string } {
  if (review.fingerprint !== militaryAccessFingerprint(input)) {
    return { accepted: false, message: '주차·권한·통제·자원 또는 선택 내용이 바뀌었습니다. 최신 조건으로 다시 검토하세요.' };
  }
  const fresh = prepareMilitaryAccessReview(input, review.action);
  if (!fresh.review) return { accepted: false, message: fresh.reason };
  if (!review.target || JSON.stringify([review.target, review.cost, review.summary, review.dueWeek])
    !== JSON.stringify([fresh.review.target, fresh.review.cost, fresh.review.summary, fresh.review.dueWeek])) {
    return { accepted: false, message: '표시한 대상·기간·비용·일정이 현재 검토 결과와 다릅니다. 다시 검토하세요.' };
  }
  const key = JSON.stringify([review.fingerprint, review.action]);
  if (gate.current === key) return { accepted: false, message: '이미 전달한 안건입니다. 협정 기록에서 처리 결과를 확인하세요.' };
  gate.current = key;
  // The owning engine is the sole writer of resources, rights and unit positions.
  input.onExecute({ ...review.action });
  return { accepted: true, message: '집행 요청을 전달했습니다. 협정 기록에서 처리 결과를 확인하세요.' };
}

export function getMilitaryAccessSites(context: MilitaryAccessContext, partnerNationId: NationId, direction: 'request' | 'offer', kind: AccessKind): Territory[] {
  if (!nationNames.has(partnerNationId) || partnerNationId === context.nationId) return [];
  const host = direction === 'offer' ? context.nationId : partnerNationId;
  return context.territories.filter((site, index, sites) => sites.findIndex((entry) => entry.id === site.id) === index
    && getTreatySiteController(site, context.control) === host && (kind !== 'naval-base' || isMilitaryAccessPort(site)));
}

export function getVisibleMilitaryAccessAgreements(state: MilitaryAccessState, nationId: NationId): MilitaryAccessAgreement[] {
  return state.agreements.filter((agreement) => agreement.hostNationId === nationId || agreement.beneficiaryNationId === nationId)
    .slice().sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.proposedWeek - a.proposedWeek || a.id.localeCompare(b.id));
}

export function getMilitaryAccessTiming(agreement: MilitaryAccessAgreement, week: number): string {
  if (agreement.status === 'proposed') return `답변 심사 예정 ${formatMilitaryAccessWeek(agreement.responseDueWeek)}${agreement.responseDueWeek <= week ? ' · 아직 답변 기록 없음' : ''}`;
  if (agreement.status === 'accepted') return '상대국 수락만으로 사용할 수 없습니다. 별도로 발효를 확인하세요.';
  if (['notice', 'expired', 'revoked'].includes(agreement.status)) {
    const stopped = agreement.closedWeek ?? agreement.expiresWeek;
    if (stopped === undefined) return '사용 중단 시점 확인 불가 · 신규 사용 불가. 작전 화면에서 현재 철수 조건을 확인하세요.';
    const until = stopped + 2;
    return week < until
      ? `신규 진입·배치·급유 금지 · 계약상 철수 유예 ${until - week}주 남음 (${formatMilitaryAccessWeek(until)}부터 종료). 제공국의 현장 통제가 유지되는 경우에만 철수할 수 있으며 직접 명령이 필요합니다.`
      : `철수 유예 종료 · ${formatMilitaryAccessWeek(until)}부터 이 협정으로 이동할 수 없습니다. 부대는 자동 귀환·삭제되지 않으며 작전 화면에서 현재 조건을 확인하세요.`;
  }
  if (agreement.status === 'active') {
    if (agreement.expiresWeek === undefined) return '만료 시점 확인 불가 · 사용 가능하다고 간주하지 않습니다.';
    return agreement.expiresWeek > week ? `만료까지 ${agreement.expiresWeek - week}주 · ${formatMilitaryAccessWeek(agreement.expiresWeek)}`
      : `만료 시점 도달 · 신규 사용 불가 · ${formatMilitaryAccessWeek(agreement.expiresWeek)}`;
  }
  return '사용권이 발효되지 않았습니다. 추가 주간 처리 예정 없음';
}

export function MilitaryAccessScope({ kind }: { kind: AccessKind }) {
  return <p className="military-access-scope-note">{kind === 'transit'
    ? '육상 이동을 위한 통행만 허용합니다. 전투·점령·자동 보급 권한이 아니며 해군·공군 기지 사용을 포함하지 않습니다.'
    : '지정 항구의 해군 기지 사용권입니다. 육군 하선·공군 기지·공격 출격을 허용하지 않으며 소유권도 바뀌지 않습니다.'}</p>;
}

export function MilitaryAccessReviewSubject({ target }: { target?: MilitaryAccessReviewTarget }) {
  if (!target) return <p className="military-access-warning" role="alert">검토 대상 확인 불가 · 최신 조건으로 다시 검토하세요.</p>;
  return <>
    <dl className="military-access-review-subject" aria-label="접근권 집행 검토 대상">
      <div><dt>대상 거점</dt><dd>{target.territoryName}<small>{target.territoryId}</small></dd></div>
      <div><dt>제공국 → 사용국</dt><dd>{nationLabel(target.hostNationId)} → {nationLabel(target.beneficiaryNationId)}</dd></div>
      <div><dt>권리 / 계약 기간</dt><dd>{kindLabels[target.kind]}<small>발효 후 {target.durationWeeks}주 · 영토 이전 없음</small></dd></div>
    </dl>
    <MilitaryAccessScope kind={target.kind} />
  </>;
}

export function canRequestMilitaryAccessRebase(agreement: MilitaryAccessAgreement, props: Pick<MilitaryAccessBoardProps, 'state' | 'context' | 'busy' | 'fleets' | 'onRebase'>, fleetId: string): boolean {
  const site = props.context.territories.find((entry) => entry.id === agreement.territoryId);
  return !props.busy && typeof props.onRebase === 'function' && (props.fleets ?? emptyFleets).some((fleet) => fleet.id === fleetId)
    && props.state.agreements.some((entry) => entry.id === agreement.id && JSON.stringify(entry) === JSON.stringify(agreement))
    && JSON.stringify(props.state) === JSON.stringify(props.context.state)
    && agreement.kind === 'naval-base' && agreement.status === 'active' && agreement.beneficiaryNationId === props.context.nationId
    && agreement.activatedWeek !== undefined && agreement.activatedWeek <= props.context.week
    && agreement.expiresWeek !== undefined && agreement.expiresWeek > props.context.week
    && !!site && getSiteMilitaryAccess(site, 'naval-base', props.context).allowed
    && getTreatySiteController(site, props.context.control) === agreement.hostNationId;
}

export function focusMilitaryAccessProposal(target: Pick<HTMLElement, 'scrollIntoView' | 'focus'> | null): void {
  if (!target) return;
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
  target.focus({ preventScroll: true });
}

export function MilitaryAccessBoard(props: MilitaryAccessBoardProps) {
  const { state, context, nationName, formatMoney, authorityNote, onOpenMap, busy, onRebase } = props;
  const id = useId();
  const partners = context.relations.filter((relation, index, entries) => nationNames.has(relation.id as NationId)
    && relation.id !== context.nationId && entries.findIndex((entry) => entry.id === relation.id) === index);
  const agreements = getVisibleMilitaryAccessAgreements(state, context.nationId);
  const [selectedId, setSelectedId] = useState(agreements[0]?.id ?? '');
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? '');
  const [direction, setDirection] = useState<'request' | 'offer'>('request');
  const [accessKind, setAccessKind] = useState<AccessKind>('transit');
  const [durationWeeks, setDurationWeeks] = useState<AccessDuration>(26);
  const [territoryId, setTerritoryId] = useState(() => getMilitaryAccessSites(context, (partners[0]?.id ?? '') as NationId, 'request', 'transit')[0]?.id ?? '');
  const [fleetId, setFleetId] = useState('');
  const [review, setReview] = useState<MilitaryAccessReviewSnapshot | null>(null);
  const [message, setMessage] = useState('');
  const reviewRef = useRef<HTMLElement>(null);
  const proposalRef = useRef<HTMLElement>(null);
  const gate = useRef<string | null>(null);
  const rebaseGate = useRef<string | null>(null);
  const selected = agreements.find((entry) => entry.id === selectedId) ?? agreements[0];
  const partner = partners.find((entry) => entry.id === partnerId);
  const sites = getMilitaryAccessSites(context, (partner?.id ?? '') as NationId, direction, accessKind);
  const site = sites.find((entry) => entry.id === territoryId);
  const formKey = JSON.stringify([partnerId, direction, accessKind, durationWeeks, territoryId, selected?.id ?? '']);
  const reviewInput = { ...props, formKey };
  const isStale = Boolean(review && review.fingerprint !== militaryAccessFingerprint(reviewInput));
  const proposal: MilitaryAccessAction = { kind: 'propose', partnerNationId: (partner?.id ?? '') as NationId, territoryId: site?.id ?? '', accessKind, direction, durationWeeks };
  const proposalAssessment = assessMilitaryAccessAction(reviewInput, proposal);
  const selectedSite = context.territories.find((entry) => entry.id === selected?.territoryId);
  const fleets = props.fleets ?? emptyFleets;
  const hasRebaseSection = selected?.kind === 'naval-base' && selected.beneficiaryNationId === context.nationId && ['active', 'notice', 'expired', 'revoked'].includes(selected.status);
  const currentFleet = fleets.find((entry) => entry.id === fleetId);
  const canRebase = !!selected && canRequestMilitaryAccessRebase(selected, props, currentFleet?.id ?? '');
  const siteName = (siteId: string) => context.territories.find((entry) => entry.id === siteId)?.name ?? '현재 목록에 없는 거점';
  const activeCount = agreements.filter((entry) => entry.status === 'active' && entry.expiresWeek !== undefined && entry.expiresWeek > context.week).length;
  const attentionCount = agreements.filter((entry) => entry.status === 'accepted').length;
  const noticeCount = agreements.filter((entry) => entry.status === 'notice').length;
  const clearReview = () => { setReview(null); setMessage(''); };
  const prepare = (action: MilitaryAccessAction) => {
    const result = prepareMilitaryAccessReview(reviewInput, action);
    setReview(result.review); setMessage(result.reason);
    if (result.review) requestAnimationFrame(() => reviewRef.current?.focus());
  };
  const confirm = () => {
    if (!review) return;
    const result = confirmMilitaryAccessReview(review, reviewInput, gate);
    setMessage(result.message);
    if (result.accepted) setReview(null);
  };
  const updateSelection = (nextPartner: string, nextDirection: 'request' | 'offer', nextKind: AccessKind) => {
    setPartnerId(nextPartner); setDirection(nextDirection); setAccessKind(nextKind);
    setTerritoryId(getMilitaryAccessSites(context, nextPartner as NationId, nextDirection, nextKind)[0]?.id ?? '');
    clearReview();
  };
  const requestRebase = () => {
    if (!selected || !currentFleet || !canRequestMilitaryAccessRebase(selected, props, currentFleet.id)) return;
    const key = JSON.stringify([state, context, selected.id, currentFleet.id]);
    if (rebaseGate.current === key) { setMessage('이미 전달한 이동 요청입니다. 함대 작전 화면에서 결과를 확인하세요.'); return; }
    rebaseGate.current = key;
    onRebase?.(currentFleet.id, selected.territoryId);
    setMessage('함대 이동 요청을 전달했습니다. 실제 항로·연료·명령 권한은 작전 엔진이 확인하며 즉시 도착하지 않습니다.');
  };

  return <section className="military-access-board" aria-labelledby={`${id}-heading`} aria-busy={Boolean(busy)}>
    <header className="military-access-heading">
      <div><span className="military-access-eyebrow"><GameIcon name="diplomacy" size={18} tone="gold" />{nationName} · 접근권 협상</span><h2 id={`${id}-heading`}>통행권·해군 기지</h2><p>땅을 넘기지 않고, 어디까지 이동하고 사용할지 합의합니다.</p></div>
      <div className="military-access-header-actions"><span className="military-access-date">{formatMilitaryAccessWeek(context.week)}</span><button type="button" className="military-access-proposal-jump" aria-controls={`${id}-proposal`} onClick={() => focusMilitaryAccessProposal(proposalRef.current)}>{context.canNegotiate ? '새 제안 작성' : '제안 조건 보기'}</button></div>
    </header>
    <p className="military-access-authority">{authorityNote}</p>
    <dl className="military-access-counters" aria-label="협정 현황"><div><dt>기간 내 발효 기록</dt><dd>{activeCount}<small>건 · 현장 통제 별도 확인</small></dd></div><div><dt>발효 확인 대기</dt><dd>{attentionCount}<small>건</small></dd></div><div><dt>철수 유예 진행</dt><dd>{noticeCount}<small>건</small></dd></div></dl>
    {!review ? <div className="military-access-boundaries"><section><h3><GameIcon name="army" size={19} tone="steel" />육상 통행</h3><MilitaryAccessScope kind="transit" /><AccessScopeArt kind="transit" year={getCampaignDateForWeek(context.week).getUTCFullYear()} /></section><section><h3><GameIcon name="naval" size={19} tone="steel" />해군 기지</h3><MilitaryAccessScope kind="naval-base" /><AccessScopeArt kind="naval-base" year={getCampaignDateForWeek(context.week).getUTCFullYear()} /></section></div> : null}
    {message ? <p className="military-access-message" role="status">{message}</p> : null}
    {review ? <section className="military-access-review" ref={reviewRef} tabIndex={-1} aria-label="접근권 집행 전 검토">
      <span className="military-access-eyebrow">검토 중 · 아직 집행하지 않음</span><h3>{actionTitles[review.action.kind]}</h3>
      <MilitaryAccessReviewSubject target={review.target} />
      <p>{review.summary}</p>
      <dl className="military-access-costs"><div><dt>정치력 비용</dt><dd>{metric(review.cost.politicalPower)}</dd></div><div><dt>국고 비용</dt><dd>{formatMoney(review.cost.treasury)}</dd></div><div><dt>다음 확인 시점</dt><dd>{review.dueWeek === null ? '집행 결과 기록 확인' : formatMilitaryAccessWeek(review.dueWeek)}</dd></div></dl>
      <p className="military-access-warning">{review.action.kind === 'propose' ? '지금은 제안만 발송합니다. 상대국 수락과 별도 발효 확인 전에는 새 권리가 생기지 않습니다.'
        : review.action.kind === 'activate' ? '권리만 발효합니다. 부대·함대는 자동 이동하지 않으며, 사용할 때 현장 통제를 다시 확인합니다.'
          : review.action.kind === 'revoke' ? '신규 사용을 중단하고 2주 철수 유예를 시작합니다. 남은 부대나 함대는 자동 귀환하지 않습니다.'
            : '발효 전 제안을 철회합니다. 이전 비용이 환급되거나 영토가 이전되지 않습니다.'}</p>
      {isStale ? <p className="military-access-warning" role="alert">조건이나 선택 내용이 바뀌었습니다. 이전 검토안으로는 집행할 수 없습니다.</p> : null}
      <div className="military-access-actions"><button type="button" onClick={() => setReview(null)}>검토 취소</button>{isStale ? <button type="button" disabled={Boolean(busy)} onClick={() => prepare(review.action)}>최신 조건 재검토</button> : null}<button type="button" className="military-access-confirm" disabled={isStale || Boolean(busy)} onClick={confirm}>확인 후 집행 요청</button></div>
    </section> : null}

    <div className="military-access-workspace">
      <section className="military-access-ledger" aria-label="소속국 관련 접근권 기록"><header><h3>접근권 문서</h3><span>{agreements.length}건</span></header>
        {agreements.length > 0 ? <ul>{agreements.map((agreement) => <li key={agreement.id}><button type="button" aria-pressed={selected?.id === agreement.id} onClick={() => { setSelectedId(agreement.id); setFleetId(''); clearReview(); }}>
          <strong>{siteName(agreement.territoryId)}</strong><span>{kindLabels[agreement.kind]} · {agreement.durationWeeks}주</span><span>{nationLabel(agreement.hostNationId)} → {nationLabel(agreement.beneficiaryNationId)}</span><small className={`military-access-status military-access-status-${agreement.status}`}>{statusLabels[agreement.status]}</small>
        </button></li>)}</ul> : <p className="military-access-empty">아직 체결하거나 제안한 접근권이 없습니다. 아래에서 한 거점에 대한 제안을 작성하세요.</p>}
      </section>
      <section className="military-access-record" aria-label="선택한 접근권 상세">
        {selected ? <>
          <header><div><span className="military-access-eyebrow">선택한 협정</span><h3>{siteName(selected.territoryId)}</h3></div><span className={`military-access-status military-access-status-${selected.status}`}>{statusLabels[selected.status]}</span></header>
          <dl className="military-access-parties"><div><dt>제공국</dt><dd>{nationLabel(selected.hostNationId)}</dd></div><div><dt>사용국</dt><dd>{nationLabel(selected.beneficiaryNationId)}</dd></div><div><dt>협정 범위</dt><dd>{kindLabels[selected.kind]} · {selected.durationWeeks}주</dd></div></dl>
          <p className="military-access-reason">{selected.reason}</p><MilitaryAccessScope kind={selected.kind} />
          <ol className="military-access-timeline" aria-label="접근권 처리 일정"><li><span>제안</span><strong>{formatMilitaryAccessWeek(selected.proposedWeek)}</strong></li><li><span>답변 심사 예정</span><strong>{formatMilitaryAccessWeek(selected.responseDueWeek)} · 실제 상태는 위 기록 기준</strong></li><li><span>발효</span><strong>{selected.activatedWeek === undefined ? '발효 기록 없음' : formatMilitaryAccessWeek(selected.activatedWeek)}</strong></li><li><span>계약 만료</span><strong>{selected.expiresWeek === undefined ? '발효 전 · 미확정' : formatMilitaryAccessWeek(selected.expiresWeek)}</strong></li>{selected.closedWeek !== undefined ? <li><span>사용 중단 기록</span><strong>{formatMilitaryAccessWeek(selected.closedWeek)} · 철수 완료와 다름</strong></li> : null}</ol>
          <p className={`military-access-timing${['notice', 'expired', 'revoked'].includes(selected.status) ? ' military-access-warning' : ''}`}>{getMilitaryAccessTiming(selected, context.week)}</p>
          {selectedSite && getTreatySiteController(selectedSite, context.control) !== selected.hostNationId ? <p className="military-access-warning">제공국의 현재 거점 통제를 확인할 수 없습니다. 발효 기록이 있어도 실제 이동·기지 이용이 차단될 수 있습니다.</p> : null}
          <button type="button" className="military-access-map-link" disabled={!selectedSite} onClick={() => { if (selectedSite) onOpenMap(selectedSite.id); }}><GameIcon name="map" size={17} tone="steel" />대상 거점 지도 조회</button>
          <div className="military-access-record-actions">
            {(['activate', 'withdraw', 'revoke'] as const).filter((kind) => kind === 'activate' ? selected.status === 'accepted' : kind === 'withdraw' ? ['proposed', 'accepted'].includes(selected.status) : selected.status === 'active').map((kind) => {
              const action: MilitaryAccessAction = { kind, agreementId: selected.id };
              const assessment = assessMilitaryAccessAction(reviewInput, action);
              return <div key={kind}><button type="button" disabled={!assessment.allowed} onClick={() => prepare(action)}>{kind === 'activate' ? '발효안 검토' : kind === 'withdraw' ? '제안 철회안 검토' : '종료 통고안 검토'}</button><p>{assessment.reason}</p>{assessment.summary ? <small>정치력 {metric(assessment.cost.politicalPower)} · 국고 {formatMoney(assessment.cost.treasury)}</small> : null}</div>;
            })}
          </div>
          {selected.status === 'accepted' ? <p className="military-access-muted">현재 {context.approvalLabel}: {metric(context.approvalSupport)} · 안정도 {metric(context.stability)}. 발효 가능 여부는 위 검토 사유를 확인하세요.</p> : null}
          {hasRebaseSection ? <section className="military-access-rebase" aria-label="협정 기지로 함대 이동"><h4>이 기지로 함대 이동</h4><p>협정 발효와 실제 이동 명령은 별도입니다. 항속거리·연료·진행 중인 임무·지휘 권한을 작전 엔진에서 다시 확인합니다.</p>
            <div><label htmlFor={`${id}-fleet`}>이동할 함대<select id={`${id}-fleet`} value={currentFleet?.id ?? ''} disabled={Boolean(busy) || selected.status !== 'active' || !onRebase || fleets.length === 0} onChange={(event) => setFleetId(event.target.value)}><option value="">함대를 직접 선택하세요</option>{fleets.map((fleet) => <option key={fleet.id} value={fleet.id}>{fleet.name}</option>)}</select></label><button type="button" disabled={!canRebase} onClick={requestRebase}>선택 함대를 기지로 이동</button></div>
            {!onRebase ? <small>이 화면에서는 이동 명령을 사용할 수 없습니다. 해군 작전 화면에서 확인하세요.</small> : fleets.length === 0 ? <small>현재 선택할 수 있는 함대가 없습니다.</small> : selected.status !== 'active' ? <small>이 협정은 신규 기지 배치를 허용하지 않습니다. 남은 함대는 해군 작전 화면에서 철수시키세요.</small> : <small>이동 요청이며 즉시 도착·연료 회복·공격 출격을 의미하지 않습니다.</small>}
          </section> : null}
          {selected.hostNationId === context.nationId ? <p className="military-access-muted">외국에 권리를 제공하는 협정입니다. 이 협정만으로 외국 AI의 새 부대 이동이나 주둔을 자동 생성하지 않습니다.</p> : null}
        </> : <div className="military-access-empty"><GameIcon name="diplomacy" size={25} tone="steel" /><h3>검토할 접근권 문서가 없습니다</h3><p>제안 → 상대국 응답 → 발효 확인 순서로 진행합니다. 수락만으로 이동 권한이 생기지 않습니다.</p></div>}
      </section>
    </div>

    <section className="military-access-proposal" id={`${id}-proposal`} ref={proposalRef} tabIndex={-1} aria-labelledby={`${id}-proposal-heading`}>
      <header><h3 id={`${id}-proposal-heading`}>새 접근권 제안</h3><p>제공국의 현재 통제가 확인되는 거점만 표시합니다. 해군 기지는 항구만 선택하며 실제 항로는 이동 명령 때 확인합니다.</p></header>
      <fieldset className="military-access-form" disabled={Boolean(busy) || !context.canNegotiate}><legend>협상 조건</legend>
        <label htmlFor={`${id}-partner`}>상대국<select id={`${id}-partner`} value={partner?.id ?? ''} onChange={(event) => updateSelection(event.target.value, direction, accessKind)}><option value="" disabled>외교 관계국을 선택하세요</option>{partners.map((relation) => <option key={relation.id} value={relation.id}>{nationLabel(relation.id as NationId)} · 관계 {metric(relation.value)}</option>)}</select></label>
        <label htmlFor={`${id}-direction`}>제안 방향<select id={`${id}-direction`} value={direction} onChange={(event) => updateSelection(partner?.id ?? '', event.target.value as 'request' | 'offer', accessKind)}><option value="request">상대국 거점의 사용권 요청</option><option value="offer">자국 거점의 사용권 제공</option></select></label>
        <label htmlFor={`${id}-kind`}>권리 종류<select id={`${id}-kind`} value={accessKind} onChange={(event) => updateSelection(partner?.id ?? '', direction, event.target.value as AccessKind)}><option value="transit">육상 통행권</option><option value="naval-base">해군 기지 사용권</option></select></label>
        <label htmlFor={`${id}-duration`}>발효 후 계약 기간<select id={`${id}-duration`} value={durationWeeks} onChange={(event) => { setDurationWeeks(Number(event.target.value) as AccessDuration); clearReview(); }}><option value={13}>13주</option><option value={26}>26주</option><option value={52}>52주</option></select></label>
        <label className="military-access-site-field" htmlFor={`${id}-site`}>대상 거점<select id={`${id}-site`} value={site?.id ?? ''} onChange={(event) => { setTerritoryId(event.target.value); clearReview(); }}><option value="" disabled>{sites.length > 0 ? '거점을 선택하세요' : '현재 조건에 맞는 거점이 없습니다'}</option>{sites.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.region}</option>)}</select></label>
      </fieldset>
      <p className="military-access-proposal-direction">제공국 {direction === 'offer' ? nationName : partner ? nationLabel(partner.id as NationId) : '미선택'} → 사용국 {direction === 'request' ? nationName : partner ? nationLabel(partner.id as NationId) : '미선택'} · {site?.name ?? '거점 미선택'}</p>
      <MilitaryAccessScope kind={accessKind} />
      {direction === 'offer' ? <p className="military-access-muted">제공 협정은 외국 AI의 새 이동·주둔을 자동 생성하지 않습니다.</p> : null}
      {proposalAssessment.summary ? <p className="military-access-muted">제안 비용: 정치력 {metric(proposalAssessment.cost.politicalPower)} · 국고 {formatMoney(proposalAssessment.cost.treasury)} · {proposalAssessment.dueWeek === null ? '답변 시점 확인 필요' : `답변 심사 예정 ${formatMilitaryAccessWeek(proposalAssessment.dueWeek)}`}</p> : null}
      <div className="military-access-proposal-action"><p>{proposalAssessment.reason}</p><button type="button" disabled={!proposalAssessment.allowed} onClick={() => prepare(proposal)}>접근권 제안안 검토</button></div>
    </section>
    <details className="military-access-rules"><summary>동맹·중립·만료와 실제로 구현한 범위</summary>
      <p>통행권과 기지 사용권은 공격권·점령권·영유권이 아닙니다. 중립 또는 외국 통제 거점은 이동 명령 시 현재 권리와 통제를 확인하며, 권한이 막혔다고 부대를 순간이동시키지 않습니다.</p>
      <p>기존 진영 기반 우군 접근은 실제 발효 이력이 없는 거점의 호환 규칙으로 남아 있습니다. 제안·거절·발효 전 철회만으로 기존 연합 작전을 막지 않습니다. 같은 진영이라는 표시를 개별 국가의 역사적 동의로 해석하지 않으며, 한 번 발효한 협정의 종료·만료는 이 호환 규칙으로 우회하지 않습니다.</p>
      <p>종료 통고 후 철수 유예는 2주입니다. 신규 진입·배치는 중단하며 철수는 직접 명령해야 합니다. 이는 게임의 계약 종료 규칙이며, 역사상 모든 중립국이 교전국 부대에 자유 귀환을 보장했다는 뜻이 아닙니다.</p>
      <p>13·26·52주 기간과 비용·승인 판정은 게임 규칙입니다. 역사적 기지 협정의 임차 기간이나 법적 효과를 그대로 재현하지 않습니다. 외국 AI의 신규 주둔 생성, 기지별 재판권, 외부 공격 출격 협상은 이 화면에 포함하지 않습니다.</p>
    </details>
  </section>;
}
