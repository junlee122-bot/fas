import { useId, useRef, useState } from 'react';
import { nations } from './campaign';
import { getCampaignDateForWeek } from './campaignCalendar';
import { GameIcon } from './GameIcon';
import { GameIllustration } from './GameIllustration';
import { getTerritoryGeography } from './territoryGeography';
import { forecastTreatyConsent, getTreatySiteController, getTreatyTerms, reviewTreatyAction } from './territorialTreaties';
import type { TerritorialTreaty, TreatyAction, TreatyConsentMethod, TreatyContext, TreatyReview, TreatyState, TreatyTerms } from './territorialTreaties';
import type { NationId, Territory } from './types';
import './TerritorialTreatyBoard.css';
import './GovernanceIllustrations.css';

export interface TerritorialTreatyBoardProps {
  state: TreatyState;
  context: TreatyContext;
  nationName: string;
  formatMoney: (value: number) => string;
  onExecute: (action: TreatyAction) => void;
  onOpenMap: (id: string) => void;
  authorityNote: string;
  busy?: boolean;
}

type ReviewInput = Pick<TerritorialTreatyBoardProps, 'state' | 'context' | 'authorityNote' | 'busy'> & { formKey?: string };
export interface TerritorialTreatyReviewTarget {
  name: string;
  territoryId: string;
  territoryName: string;
  fromNationId: NationId;
  toNationId: NationId;
  terms: TreatyTerms;
}
export interface TerritorialTreatyReviewSnapshot {
  action: TreatyAction;
  target: TerritorialTreatyReviewTarget;
  fingerprint: string;
  summary: string;
  cost: TreatyReview['cost'];
  dueWeek: number | null;
}

export const territorialTreatyFingerprint = (input: ReviewInput): string => JSON.stringify([
  input.state, input.context, input.authorityNote, Boolean(input.busy), input.formKey ?? '',
]);

const copyTreatyAction = (action: TreatyAction): TreatyAction => action.kind === 'propose' && action.terms
  ? { ...action, terms: { ...action.terms } } : { ...action };

function assessTreatyAction(input: ReviewInput, action: TreatyAction): TreatyReview {
  const result = reviewTreatyAction(input.state, action, input.context);
  if (input.busy) return { ...result, allowed: false, reason: '기간 진행 중입니다. 주간 결산이 끝난 뒤 최신 조건을 검토하세요.' };
  if (action.kind !== 'propose') {
    const treaty = input.state.treaties.find((entry) => entry.id === action.treatyId);
    if (!treaty || treaty.proposerNationId !== input.context.nationId) {
      return { ...result, allowed: false, reason: '이 조약의 제안국만 동의 절차·비준·철회 안건을 집행할 수 있습니다.' };
    }
  }
  return result;
}

export function prepareTerritorialTreatyReview(input: ReviewInput, action: TreatyAction): {
  review: TerritorialTreatyReviewSnapshot | null; reason: string;
} {
  const result = assessTreatyAction(input, action);
  if (!result.allowed) return { review: null, reason: result.reason };
  const treaty = action.kind === 'propose' ? undefined : input.state.treaties.find((entry) => entry.id === action.treatyId);
  if (action.kind !== 'propose' && !treaty) return { review: null, reason: '검토할 조약 기록을 확인할 수 없습니다.' };
  const territoryId = action.kind === 'propose' ? action.territoryId : treaty!.territoryId;
  const target: TerritorialTreatyReviewTarget = {
    name: action.kind === 'propose' ? action.name.trim() : treaty!.name,
    territoryId,
    territoryName: input.context.territories.find((territory) => territory.id === territoryId)?.name ?? '현재 목록에 없는 거점',
    fromNationId: action.kind === 'propose' ? action.direction === 'offer' ? input.context.nationId : action.partnerNationId : treaty!.fromNationId,
    toNationId: action.kind === 'propose' ? action.direction === 'offer' ? action.partnerNationId : input.context.nationId : treaty!.toNationId,
    terms: { ...getTreatyTerms(action.kind === 'propose' ? action : treaty!) },
  };
  return {
    review: { action: copyTreatyAction(action), target, fingerprint: territorialTreatyFingerprint(input), summary: result.summary, cost: { ...result.cost }, dueWeek: result.dueWeek },
    reason: '아직 집행하지 않았습니다. 대상·비용·확인 시점을 검토하세요.',
  };
}

export function confirmTerritorialTreatyReview(
  review: TerritorialTreatyReviewSnapshot,
  input: ReviewInput & Pick<TerritorialTreatyBoardProps, 'onExecute'>,
  gate: { current: string | null },
): { accepted: boolean; message: string } {
  if (review.fingerprint !== territorialTreatyFingerprint(input)) {
    return { accepted: false, message: '주차·권한·통제·자원 또는 선택 내용이 바뀌었습니다. 최신 조건으로 다시 검토하세요.' };
  }
  const fresh = prepareTerritorialTreatyReview(input, review.action);
  if (!fresh.review) return { accepted: false, message: fresh.reason };
  if (!review.target || JSON.stringify(review.target) !== JSON.stringify(fresh.review.target)) {
    return { accepted: false, message: '검토 대상 기록이 일치하지 않습니다. 조약 이름·거점·이전 방향을 다시 검토하세요.' };
  }
  const key = JSON.stringify([review.fingerprint, review.action]);
  if (gate.current === key) return { accepted: false, message: '이미 전달한 안건입니다. 조약 기록에서 처리 결과를 확인하세요.' };
  gate.current = key;
  // Only the owning handler changes resources, treaty state or territorial attribution.
  input.onExecute(copyTreatyAction(review.action));
  return { accepted: true, message: '집행 요청을 전달했습니다. 조약 기록에서 결과를 확인하세요.' };
}

const nationNames = new Map(nations.map((nation) => [nation.id, nation.shortName]));
const capitalIds = new Set(nations.map((nation) => nation.capitalTerritoryId));
const statusLabels: Record<TerritorialTreaty['status'], string> = {
  proposed: '상대국 답변 대기', accepted: '상대국 수락 · 비준 대기', rejected: '상대국 거부',
  ratified: '비준 기록 · 인계 대기', suspended: '인계 보류', completed: '거점 인계 완료', withdrawn: '제안 철회',
};
const actionTitles: Record<TreatyAction['kind'], string> = { propose: '거점 귀속 조약 제안', 'start-consultation': '지역 동의 절차 시작', ratify: '조약 비준', withdraw: '조약 철회' };
const consentLabels: Record<TreatyConsentMethod, string> = { none: '없음', 'regional-council': '지역대표 심의', referendum: '주민투표' };
const consentStatusLabels = { preparing: '동의 절차 준비 중', suspended: '동의 절차 중단', approved: '동의 절차 승인', rejected: '동의 절차 거부' };

export function TerritorialTreatyTerms({ terms, formatMoney }: { terms?: TreatyTerms; formatMoney?: (value: number) => string }) {
  const value = getTreatyTerms({ terms });
  return <dl className="treaty-terms-summary" aria-label="조약 조건">
    <div><dt>동의 절차</dt><dd>{consentLabels[value.consentMethod]}</dd></div>
    <div><dt>주민보호 조항</dt><dd>{value.civilGuarantees ? '조약상 주민보호 약속' : '추가 보호 약속 미포함'}{value.civilGuarantees ? <small>비준 시 국고 추가 {formatMoney?.(8) ?? '8'} · 실제 보호 이행 완료를 뜻하지 않음</small> : null}</dd></div>
    <div><dt>육군 주둔부대 철수 확인</dt><dd>{value.withdrawBeforeHandover ? '인계 전 제공국 육군 주둔부대 0개 확인 필요' : '육군 철수 확인 조항 없음'}<small>병력은 자동 이동하지 않습니다. 함대·항공대·기지권 전체 철수는 확인하지 않습니다.</small></dd></div>
    <div><dt>인도 준비기간</dt><dd>{value.handoverDelayWeeks}주<small>비준 후 대기 · 기간 경과만으로 인계 확정 아님</small></dd></div>
  </dl>;
}

export function getTreatyGarrisonDescription(counts: TreatyContext['garrisonCountByTerritory'], territoryId: string, foreignProvider = false): string {
  if (foreignProvider) return '확인 불가 · 외국 육군의 위치 자료가 없어 인도 유예';
  const count = counts && Object.prototype.hasOwnProperty.call(counts, territoryId) ? counts[territoryId] : undefined;
  return typeof count === 'number' && Number.isSafeInteger(count) && count >= 0
    ? `확인된 제공국 육군 주둔부대 ${count}개${count === 0 ? ' · 육군 철수 확인 수량 조건 충족' : ' · 인계 전 육군 철수 필요'}`
    : '현지 육군 주둔부대 수 확인 불가 · 0개로 간주하지 않습니다.';
}

export function TerritorialTreatyConsentRecord({ treaty, counts, nationId }: { treaty: TerritorialTreaty; counts: TreatyContext['garrisonCountByTerritory']; nationId?: NationId }) {
  const terms = getTreatyTerms(treaty);
  const consent = treaty.consent;
  const foreignWithdrawalBeforeRatification = nationId && treaty.fromNationId !== nationId && ['proposed', 'accepted'].includes(treaty.status);
  return <section className="treaty-consent-record" aria-label="지역 동의와 철수 확인 기록">
    {terms.consentMethod !== 'none' ? <>
      <header><h4>{consentLabels[terms.consentMethod]}</h4><span>{consent ? consentStatusLabels[consent.status] : '동의 절차 시작 전'}</span></header>
      <p className="treaty-cost-note">판정 규칙: {terms.consentMethod === 'referendum' ? '찬성 지표 50 초과 · 참여 지표 50 이상' : '찬성 지표 60 이상'}. 실제 결정 시점의 조건을 사용합니다.</p>
      {consent ? <><p>{consent.reason}</p><p className="treaty-cost-note">안전 조건을 충족한 연속 준비 {consent.progressWeeks}/3주 · 최근 확인 {formatTerritorialTreatyWeek(consent.lastProcessedWeek)}</p>
        {consent.resolvedWeek !== undefined ? <><p>결과 기록 {formatTerritorialTreatyWeek(consent.resolvedWeek)}</p><dl className="treaty-consent-metrics"><div><dt>게임 내 찬성 지표</dt><dd>{consent.supportPercent === undefined ? '확인 불가' : `${metric(consent.supportPercent)}/100`}</dd></div><div><dt>게임 내 참여 지표</dt><dd>{consent.participationPercent === undefined ? '확인 불가' : `${metric(consent.participationPercent)}/100`}</dd></div></dl></> : null}
      </> : <p>별도 검토·확인으로 절차를 시작해야 합니다. 준비에는 실제 연속 안전 3주가 필요하며 승인을 보장하지 않습니다.</p>}
      <small>찬성·참여 지표는 합성된 게임 규칙입니다. 실제 유권자 수나 역사적 주민 동의를 나타내지 않습니다.</small>
    </> : <p className="treaty-cost-note">이 조약에는 별도의 지역 동의 절차가 포함되지 않았습니다.</p>}
    {terms.withdrawBeforeHandover ? <p className="treaty-garrison-proof">{foreignWithdrawalBeforeRatification ? '현재 외국 제공국의 육군 위치 자료를 확보할 수 없어 이 철수 확인 조항이 있는 조약은 비준 불가입니다. 제안국이 철회 후 조건을 제외하고 재협상해야 합니다.' : nationId ? getTreatyGarrisonDescription(counts, treaty.territoryId, treaty.fromNationId !== nationId) : getTreatyGarrisonDescription(undefined, treaty.territoryId)}</p> : null}
  </section>;
}

export function TerritorialTreatyReviewSubject({ target, formatMoney }: { target?: TerritorialTreatyReviewTarget; formatMoney?: (value: number) => string }) {
  if (!target) return <p className="treaty-caution" role="alert">검토 대상 확인 불가 · 최신 조건으로 다시 검토하세요.</p>;
  return <><dl className="treaty-review-target" aria-label="집행 검토 대상">
    <div><dt>조약 문서</dt><dd>{target.name}</dd></div>
    <div><dt>대상 거점</dt><dd>{target.territoryName}<small>{target.territoryId}</small></dd></div>
    <div><dt>귀속 합의 방향</dt><dd>{nationNames.get(target.fromNationId) ?? '제공국 미확인'} → {nationNames.get(target.toNationId) ?? '수령국 미확인'}</dd></div>
  </dl><TerritorialTreatyTerms terms={target.terms} formatMoney={formatMoney} /></>;
}

export function getTerritorialTreatySites(context: TreatyContext, partnerNationId: NationId, direction: 'offer' | 'request'): Territory[] {
  const controller = direction === 'offer' ? context.nationId : partnerNationId;
  if (!nationNames.has(partnerNationId) || partnerNationId === context.nationId) return [];
  return context.territories.filter((territory) => !capitalIds.has(territory.id)
    && territory.siteType !== 'capital' && territory.siteType !== 'sea' && getTerritoryGeography(territory.id)?.kind !== 'sea'
    && !/해역|해상|바다|대양|^sea$|^ocean$/i.test(territory.terrain)
    && getTreatySiteController(territory, context.control) === controller);
}

export function getVisibleTerritorialTreaties(state: TreatyState, nationId: NationId): TerritorialTreaty[] {
  return state.treaties.filter((treaty) => [treaty.proposerNationId, treaty.partnerNationId, treaty.fromNationId, treaty.toNationId].includes(nationId))
    .slice().sort((a, b) => b.proposedWeek - a.proposedWeek);
}

export function formatTerritorialTreatyWeek(week: number): string {
  const date = getCampaignDateForWeek(week);
  return `제${week + 1}주 · ${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
}

const metric = (value: number) => !Number.isFinite(value) ? '—'
  : Number(String(value).replace(/(\.\d{2})\d+$/, '$1')).toLocaleString('ko-KR', { maximumFractionDigits: 2 });

function nextCheck(treaty: TerritorialTreaty, week: number): string {
  if (treaty.status === 'proposed') return treaty.responseDueWeek > week
    ? `답변 예정 ${formatTerritorialTreatyWeek(treaty.responseDueWeek)}`
    : `답변 예정 시점 경과 ${formatTerritorialTreatyWeek(treaty.responseDueWeek)} · 아직 답변 기록 없음`;
  if (treaty.status === 'accepted') {
    if (getTreatyTerms(treaty).consentMethod !== 'none' && treaty.consent?.status !== 'approved') {
      if (treaty.consent?.status === 'rejected') return '동의 절차 거부가 기록되었습니다. 이 결과를 비준으로 건너뛸 수 없습니다.';
      if (treaty.consent?.status === 'suspended') return '안전 조건 회복 후 동의 준비를 자동 재개합니다. 아직 비준 전입니다.';
      return treaty.consent ? '연속 안전 3주를 확인 중입니다. 동의 결과 확정 뒤 별도로 비준해야 합니다.' : '지역 동의 절차 시작을 기다립니다. 동의 승인과 비준은 별도입니다.';
    }
    return '명시적 비준을 기다립니다. 아직 인계 일정이 확정되지 않았습니다.';
  }
  if (treaty.status === 'ratified') return treaty.handoverDueWeek === undefined ? '인계 확인 시점 기록 없음 · 현재 기록을 확인해야 합니다.'
    : `인계 조건 확인 ${formatTerritorialTreatyWeek(treaty.handoverDueWeek)}${treaty.handoverDueWeek <= week ? ' · 아직 완료 기록 없음' : ''}`;
  if (treaty.status === 'suspended') return '인계가 보류되었습니다. 다음 주간 결산에서 현재 조건을 다시 확인합니다.';
  return '추가 주간 처리 예정 없음';
}

export function TerritorialTreatyBoard(props: TerritorialTreatyBoardProps) {
  const { state, context, nationName, formatMoney, onOpenMap, authorityNote, busy } = props;
  const id = useId();
  const partners = context.relations.filter((relation, index, entries) => nationNames.has(relation.id as NationId)
    && relation.id !== context.nationId && entries.findIndex((entry) => entry.id === relation.id) === index);
  const treaties = getVisibleTerritorialTreaties(state, context.nationId);
  const [selectedId, setSelectedId] = useState(treaties[0]?.id ?? '');
  const [name, setName] = useState('');
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? '');
  const [direction, setDirection] = useState<'offer' | 'request'>('offer');
  const [terms, setTerms] = useState<TreatyTerms>(() => ({ ...getTreatyTerms({}), consentMethod: context.requiredConsent ?? 'none' }));
  const [territoryId, setTerritoryId] = useState(() => getTerritorialTreatySites(context, (partners[0]?.id ?? '') as NationId, 'offer')[0]?.id ?? '');
  const [review, setReview] = useState<TerritorialTreatyReviewSnapshot | null>(null);
  const [message, setMessage] = useState('');
  const reviewRef = useRef<HTMLElement>(null);
  const gate = useRef<string | null>(null);
  const selected = treaties.find((treaty) => treaty.id === selectedId) ?? treaties[0];
  const partner = partners.find((relation) => relation.id === partnerId);
  const sites = getTerritorialTreatySites(context, (partner?.id ?? '') as NationId, direction);
  const site = sites.find((territory) => territory.id === territoryId);
  const formKey = JSON.stringify([name, partnerId, direction, territoryId, selected?.id ?? '', terms]);
  const reviewInput = { ...props, formKey };
  const isStale = Boolean(review && (!review.target?.terms || review.fingerprint !== territorialTreatyFingerprint(reviewInput)));
  const clearReview = () => { setReview(null); setMessage(''); };
  const proposeAction: TreatyAction = { kind: 'propose', name: name.trim(), partnerNationId: (partner?.id ?? '') as NationId, territoryId: site?.id ?? '', direction, terms: { ...terms } };
  const proposalAssessment = assessTreatyAction(reviewInput, proposeAction);
  const ratificationAssessment = selected ? assessTreatyAction(reviewInput, { kind: 'ratify', treatyId: selected.id }) : null;
  const withdrawalAssessment = selected ? assessTreatyAction(reviewInput, { kind: 'withdraw', treatyId: selected.id }) : null;
  const consultationAssessment = selected ? assessTreatyAction(reviewInput, { kind: 'start-consultation', treatyId: selected.id }) : null;
  const selectedTerms = selected ? getTreatyTerms(selected) : undefined;
  const proposalForecast = site && partner && Number.isFinite(site.supply) && site.supply >= 0 && site.supply <= 100 && terms.consentMethod !== 'none' ? forecastTreatyConsent({
    id: 'ui-preview', name: name.trim(), proposerNationId: context.nationId, partnerNationId: partner.id as NationId,
    fromNationId: direction === 'offer' ? context.nationId : partner.id as NationId,
    toNationId: direction === 'offer' ? partner.id as NationId : context.nationId, territoryId: site.id,
    proposedWeek: context.week, responseDueWeek: context.week + 2, status: 'proposed', reason: '', terms: { ...terms },
  }, site) : undefined;
  const territoryName = (siteId: string) => context.territories.find((territory) => territory.id === siteId)?.name ?? '현재 목록에 없는 거점';
  const hasMapSite = selected && context.territories.some((territory) => territory.id === selected.territoryId);
  const canActOnSelected = selected?.proposerNationId === context.nationId;
  const prepare = (action: TreatyAction) => {
    const result = prepareTerritorialTreatyReview(reviewInput, action);
    setReview(result.review); setMessage(result.reason);
    if (result.review) requestAnimationFrame(() => reviewRef.current?.focus());
  };
  const confirm = () => {
    if (!review) return;
    const result = confirmTerritorialTreatyReview(review, reviewInput, gate);
    setMessage(result.message);
    if (result.accepted) setReview(null);
  };
  const choosePartner = (next: string) => {
    setPartnerId(next);
    setTerritoryId(getTerritorialTreatySites(context, next as NationId, direction)[0]?.id ?? '');
    clearReview();
  };
  const chooseDirection = (next: 'offer' | 'request') => {
    setDirection(next);
    setTerritoryId(getTerritorialTreatySites(context, (partner?.id ?? '') as NationId, next)[0]?.id ?? '');
    clearReview();
  };
  const updateTerms = (patch: Partial<TreatyTerms>) => { setTerms((current) => ({ ...current, ...patch })); clearReview(); };

  return <section className="territorial-treaty-board" aria-labelledby={`${id}-heading`}>
    <header className="treaty-heading"><div><span className="treaty-eyebrow"><GameIcon name="treaty" size={18} tone="gold" className="inline" />{nationName} · 외교 문서실</span><h2 id={`${id}-heading`}>거점 귀속 조약</h2><p>제안과 비준, 현지 인계는 서로 다른 기록입니다.</p></div><span className="treaty-date">{formatTerritorialTreatyWeek(context.week)}</span><div className="governance-illustration-slot"><GameIllustration scene="territorial-administration" compact /></div></header>
    <p className="treaty-authority">{authorityNote}</p>
    <p className="treaty-required-consent">현재 필수 동의 절차: {consentLabels[context.requiredConsent ?? 'none']} · 주민투표는 지역대표 심의 요건을 충족하지만, 지역대표 심의는 주민투표 요건을 대신하지 못합니다.</p>
    <p className="treaty-scope">당사국 간 한 거점의 귀속 합의를 다룹니다. 국제사회 전체의 주권 승인이나 국경선 변경을 뜻하지 않으며, 병력은 자동 이동하지 않습니다.</p>
    {message ? <p className="treaty-message" role="status">{message}</p> : null}
    {review ? <section className="treaty-review" ref={reviewRef} tabIndex={-1} aria-label="조약 집행 전 검토">
      <span className="treaty-eyebrow">검토 중 · 아직 집행하지 않음</span><h3>{actionTitles[review.action.kind]}</h3>
      <TerritorialTreatyReviewSubject target={review.target} formatMoney={formatMoney} />
      <p>{review.summary}</p>
      <dl className="treaty-costs"><div><dt>정치력 비용</dt><dd>{review.cost.politicalPower}</dd></div><div><dt>국고 비용</dt><dd>{formatMoney(review.cost.treasury)}</dd></div><div><dt>다음 확인 시점</dt><dd>{review.dueWeek === null ? '집행 결과 기록 확인' : formatTerritorialTreatyWeek(review.dueWeek)}</dd></div></dl>
      <p className="treaty-caution">{review.action.kind === 'propose' ? '지금 확인하는 것은 제안 발송입니다. 상대국 답변과 별도 비준 없이 거점을 이전하지 않습니다.' : review.action.kind === 'start-consultation' ? '동의 절차 준비를 시작합니다. 실제 연속 안전 3주 뒤 게임 지표를 판정하며, 절차 시작은 동의 승인이나 비준이 아닙니다.' : review.action.kind === 'ratify' ? `비준 직후 거점이나 병력이 이동하지 않습니다. 인도 준비 ${review.target?.terms?.handoverDelayWeeks ?? '확인 필요'}주 뒤 현장 통제·작전·철수 조건을 다시 확인하며, 조건이 맞지 않으면 보류됩니다.` : '비준 전 제안을 철회합니다. 이전 협상 비용은 환급하지 않으며 현재 거점 귀속과 병력은 바뀌지 않습니다.'}</p>
      {isStale ? <p role="alert">조건이나 선택 내용이 바뀌었습니다. 이전 검토안으로는 집행할 수 없습니다.</p> : null}
      <div className="treaty-actions"><button type="button" onClick={() => setReview(null)}>검토 취소</button>{isStale ? <button type="button" onClick={() => prepare(review.action)}>최신 조건 재검토</button> : null}<button type="button" className="treaty-confirm" disabled={isStale || Boolean(busy)} onClick={confirm}>확인 후 집행 요청</button></div>
    </section> : null}

    <div className="treaty-workspace">
      <section className="treaty-ledger" aria-label="소속국 관련 조약 기록"><header><h3>보관 조약</h3><span>{treaties.length}건</span></header>
        {treaties.length ? <ul>{treaties.map((treaty) => <li key={treaty.id}><button type="button" aria-pressed={selected?.id === treaty.id} onClick={() => { setSelectedId(treaty.id); clearReview(); }}><strong>{treaty.name}</strong><span>{territoryName(treaty.territoryId)} · {nationNames.get(treaty.fromNationId)} → {nationNames.get(treaty.toNationId)}</span><small className={`treaty-status status-${treaty.status}`}>{statusLabels[treaty.status]}</small></button></li>)}</ul> : <p className="treaty-empty">아직 이 국가와 관련된 조약이 없습니다. 아래에서 한 거점의 합의를 제안할 수 있습니다. 과거 조약이나 귀속 변경을 자동으로 만들어내지 않습니다.</p>}
      </section>
      <section className="treaty-record" aria-label="선택한 조약 상세">
        {selected ? <>
          <header><div><span className="treaty-eyebrow">선택한 문서</span><h3>{selected.name}</h3></div><span className={`treaty-status status-${selected.status}`}>{statusLabels[selected.status]}</span></header>
          <dl className="treaty-parties"><div><dt>대상 거점</dt><dd>{territoryName(selected.territoryId)}</dd></div><div><dt>귀속 합의 방향</dt><dd>{nationNames.get(selected.fromNationId)} → {nationNames.get(selected.toNationId)}</dd></div><div><dt>제안국 / 상대국</dt><dd>{nationNames.get(selected.proposerNationId)} / {nationNames.get(selected.partnerNationId)}</dd></div></dl>
          <p className="treaty-reason">{selected.reason}</p>
          <TerritorialTreatyTerms terms={selected.terms} formatMoney={formatMoney} />
          <TerritorialTreatyConsentRecord treaty={selected} counts={context.garrisonCountByTerritory} nationId={context.nationId} />
          <ol className="treaty-timeline" aria-label="조약 처리 단계">
            <li><span>제안 기록</span><strong>{formatTerritorialTreatyWeek(selected.proposedWeek)}</strong></li>
            <li><span>상대국 답변</span><strong>{selected.respondedWeek !== undefined ? formatTerritorialTreatyWeek(selected.respondedWeek) : selected.status === 'proposed' ? `예정 ${formatTerritorialTreatyWeek(selected.responseDueWeek)}` : '답변 시점 기록 없음'}</strong></li>
            <li><span>명시적 비준</span><strong>{selected.ratifiedWeek !== undefined ? formatTerritorialTreatyWeek(selected.ratifiedWeek) : '비준 기록 없음'}</strong></li>
            <li><span>현지 인계</span><strong>{selected.completedWeek !== undefined ? formatTerritorialTreatyWeek(selected.completedWeek) : selected.handoverDueWeek !== undefined ? `최초 예정 ${formatTerritorialTreatyWeek(selected.handoverDueWeek)} · 완료 아님` : '인계 기록 없음'}</strong></li>
          </ol>
          <p className="treaty-next-check">{nextCheck(selected, context.week)}</p>
          <button type="button" className="treaty-map-link" disabled={!hasMapSite} onClick={() => { if (hasMapSite) onOpenMap(selected.territoryId); }}>대상 거점 지도 조회</button>
          {canActOnSelected ? <div className="treaty-record-actions">
            {selected.status === 'accepted' ? <>
              {selectedTerms?.consentMethod !== 'none' ? <div className="treaty-consultation-action"><p>{consultationAssessment?.reason}</p>{consultationAssessment?.summary ? <p className="treaty-cost-note">동의 절차 시작 비용: 정치력 {consultationAssessment.cost.politicalPower} · 국고 {formatMoney(consultationAssessment.cost.treasury)}</p> : null}<button type="button" disabled={!consultationAssessment?.allowed} onClick={() => prepare({ kind: 'start-consultation', treatyId: selected.id })}>동의 절차 시작안 검토</button></div> : null}
              <dl className="treaty-requirements" aria-label="비준 조건"><div><dt>{context.approvalLabel}</dt><dd>{metric(context.approvalSupport)}<small> / 60 이상</small></dd></div><div><dt>제도 역량</dt><dd>{metric(context.institutionalCapacity)}<small> / 45 이상</small></dd></div><div><dt>자국 안정도</dt><dd>{metric(context.stability)}<small> / 45 이상</small></dd></div></dl>
              <p>{ratificationAssessment?.reason}</p>{ratificationAssessment?.summary ? <p className="treaty-cost-note">비준 비용: 정치력 {ratificationAssessment.cost.politicalPower} · 국고 {formatMoney(ratificationAssessment.cost.treasury)}</p> : null}
              <button type="button" disabled={!ratificationAssessment?.allowed} onClick={() => prepare({ kind: 'ratify', treatyId: selected.id })}>비준안 검토</button>
            </> : null}
            {!['completed', 'withdrawn', 'rejected'].includes(selected.status) ? <div className="treaty-withdrawal"><button type="button" disabled={!withdrawalAssessment?.allowed} onClick={() => prepare({ kind: 'withdraw', treatyId: selected.id })}>철회안 검토</button><p>{withdrawalAssessment?.reason}</p></div> : null}
          </div> : <p className="treaty-readonly">상대국 기록 열람입니다. 이 조약의 제안국만 동의 절차·비준·철회 안건을 집행할 수 있습니다.</p>}
        </> : <div className="treaty-empty"><GameIcon name="diplomacy" size={24} tone="steel" /><h3>검토할 조약 문서가 없습니다</h3><p>제안을 보내면 답변 대기 기록부터 남습니다. 수락만으로 비준이나 인계가 완료되지는 않습니다.</p></div>}
      </section>
    </div>

    <section className="treaty-proposal" aria-labelledby={`${id}-proposal-heading`}>
      <header><GameIcon name="treaty" size={22} tone="steel" /><div><h3 id={`${id}-proposal-heading`}>새 조약안 작성</h3><p>게임에 등록된 수도·중심 거점과 해역을 제외한 육상 거점 한 곳만 선택합니다.</p></div></header>
      <div className="treaty-form-fields">
        <label htmlFor={`${id}-name`}>조약 문서 이름<input id={`${id}-name`} maxLength={80} placeholder="예: 평양 거점 귀속 합의" value={name} disabled={Boolean(busy) || !context.canNegotiate} onChange={(event) => { setName(event.target.value); clearReview(); }} /></label>
        <label htmlFor={`${id}-partner`}>상대국<select id={`${id}-partner`} value={partner?.id ?? ''} disabled={Boolean(busy) || !context.canNegotiate} onChange={(event) => choosePartner(event.target.value)}><option value="" disabled>외교 관계국을 선택하세요</option>{partners.map((relation) => <option key={relation.id} value={relation.id}>{nationNames.get(relation.id as NationId)} · 관계 {metric(relation.value)}</option>)}</select></label>
        <label htmlFor={`${id}-direction`}>제안 방향<select id={`${id}-direction`} value={direction} disabled={Boolean(busy) || !context.canNegotiate} onChange={(event) => chooseDirection(event.target.value as 'offer' | 'request')}><option value="offer">자국 통제 거점 양도 제안</option><option value="request">상대국 통제 거점 요청</option></select></label>
        <label htmlFor={`${id}-site`}>대상 육상 거점<select id={`${id}-site`} value={site?.id ?? ''} disabled={Boolean(busy) || !context.canNegotiate} onChange={(event) => { setTerritoryId(event.target.value); clearReview(); }}><option value="" disabled>{sites.length ? '거점을 선택하세요' : '현재 선택 가능한 거점이 없습니다'}</option>{sites.map((territory) => <option key={territory.id} value={territory.id}>{territory.name} · {territory.region}</option>)}</select></label>
      </div>
      <fieldset className="treaty-terms-editor" disabled={Boolean(busy) || !context.canNegotiate}>
        <legend>제안할 조약 조건</legend>
        <label htmlFor={`${id}-consent`}>동의 절차<select id={`${id}-consent`} value={terms.consentMethod} onChange={(event) => updateTerms({ consentMethod: event.target.value as TreatyConsentMethod })}><option value="none">없음</option><option value="regional-council">지역대표 심의</option><option value="referendum">주민투표</option></select></label>
        <label htmlFor={`${id}-delay`}>인도 준비기간<select id={`${id}-delay`} value={terms.handoverDelayWeeks} onChange={(event) => updateTerms({ handoverDelayWeeks: Number(event.target.value) as TreatyTerms['handoverDelayWeeks'] })}><option value={1}>1주</option><option value={4}>4주</option><option value={8}>8주</option></select></label>
        <label className="treaty-check-label" htmlFor={`${id}-guarantees`}><input id={`${id}-guarantees`} type="checkbox" checked={terms.civilGuarantees} onChange={(event) => updateTerms({ civilGuarantees: event.target.checked })} /><span>주민보호 조항<small>조약상 주민보호 약속 · 비준 국고 추가 {formatMoney(8)}</small></span></label>
        <label className="treaty-check-label" htmlFor={`${id}-withdrawal`}><input id={`${id}-withdrawal`} type="checkbox" checked={terms.withdrawBeforeHandover} onChange={(event) => updateTerms({ withdrawBeforeHandover: event.target.checked })} /><span>육군 주둔부대 철수 확인<small>{direction === 'request' ? '현재 외국 제공국은 육군 위치 증거를 확보할 수 없어 이 조항 포함 시 비준 불가 · 이미 제안했다면 철회 후 조건을 제외하고 재협상' : '인도 전 자국 육군 주둔부대 0개를 확인합니다. 직접 이동 명령을 내려야 하며 함대·항공대·기지권은 포함하지 않습니다.'}</small></span></label>
      </fieldset>
      {proposalForecast ? <section className="treaty-consent-forecast" aria-label="동의 절차 게임 지표 미리보기"><header><h4>동의 절차 미리보기</h4><span>예상 게임 지표 · 결과 확정 아님</span></header><dl className="treaty-consent-metrics"><div><dt>게임 내 찬성 지표</dt><dd>{metric(proposalForecast.supportPercent)}/100</dd></div><div><dt>게임 내 참여 지표</dt><dd>{metric(proposalForecast.participationPercent)}/100</dd></div></dl><small>합성된 게임 지표이며 실제 유권자·인구 수나 역사적 주민 동의를 뜻하지 않습니다.</small><details><summary>예상 지표의 게임 요인</summary><ul>{proposalForecast.factors.map((factor, index) => <li key={`${index}:${factor}`}>{factor}</li>)}</ul></details></section> : null}
      <p className="treaty-proposal-direction">{direction === 'offer' ? `${nationName} → ${partner ? nationNames.get(partner.id as NationId) : '상대국 미선택'}` : `${partner ? nationNames.get(partner.id as NationId) : '상대국 미선택'} → ${nationName}`} · {site?.name ?? '대상 거점 미선택'}</p>
      <p className="treaty-cost-note">현재 관계 {partner ? metric(partner.value) : '—'} / 필요 {direction === 'offer' ? 50 : 75} · 안정도 {metric(context.stability)} / 필요 45 · 답변 시점에 다시 검증합니다.</p>
      {proposalAssessment.summary ? <p className="treaty-cost-note">제안 비용: 정치력 {proposalAssessment.cost.politicalPower} · 국고 {formatMoney(proposalAssessment.cost.treasury)} · 실제 주간 처리 2회 후 답변 심사</p> : null}
      <div className="treaty-proposal-action"><p>{proposalAssessment.reason}</p><button type="button" disabled={!proposalAssessment.allowed} onClick={() => prepare(proposeAction)}>조약 제안안 검토</button></div>
      <details className="treaty-rules"><summary>조약의 범위와 처리 규칙</summary><p>제안 발송 뒤 실제 주간 처리 2회를 거쳐 상대국 답변을 심사합니다. 관측하지 않은 주차는 소급하지 않으며 제안국의 현재 외교 정보를 확인할 수 없으면 응답이 늦어질 수 있습니다. 선택한 지역 동의 절차는 별도 준비·판정이며, 승인 뒤에도 비준 권한과 내부 승인·제도 역량·안정도 조건을 갖추어 별도로 비준해야 합니다. 비준 후 정한 1·4·8주 준비기간을 거쳐 현장 조건을 확인하며, 작전이나 철수 미확인으로 인계가 보류될 수 있습니다.</p><p>이 절차는 두 당사국 사이의 거점 귀속 합의입니다. 외교적 정부 대표권 승인, 주변 영토 전체의 주권, 국경 다각형과는 별개이며 병력 이동 명령도 아닙니다. 비용과 소요 기간은 게임 규칙입니다.</p></details>
    </section>
  </section>;
}
