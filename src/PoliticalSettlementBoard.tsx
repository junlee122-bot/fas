import { useId, useRef, useState } from 'react';
import { nations } from './campaign';
import { GameIcon } from './GameIcon';
import { GameIllustration } from './GameIllustration';
import { getCampaignDateForWeek } from './campaignCalendar';
import { getTerritoryGeography } from './territoryGeography';
import { getPoliticalSettlementPolity, reviewPoliticalSettlementAction } from './politicalSettlement';
import type { PoliticalSettlementAction, PoliticalSettlementContext, PoliticalSettlementState } from './politicalSettlement';
import type { NationId, Territory } from './types';
import './PoliticalSettlementBoard.css';
import './GovernanceIllustrations.css';

export interface PoliticalSettlementBoardProps {
  state: PoliticalSettlementState;
  context: PoliticalSettlementContext;
  nationName: string;
  defaultSeatTerritoryId: string;
  formatMoney: (value: number) => string;
  onExecute: (action: PoliticalSettlementAction) => void;
  onOpenMap: (territoryId: string) => void;
  authorityNote: string;
  busy?: boolean;
}

type ReviewInput = Pick<PoliticalSettlementBoardProps, 'state' | 'context' | 'busy' | 'authorityNote'>;
export interface PoliticalSettlementReviewSnapshot {
  action: PoliticalSettlementAction;
  fingerprint: string;
  summary: string;
  cost: { politicalPower: number; treasury: number };
  dueWeek: number | null;
}

/** Includes the domain's control receipt and permissions, not merely the selected tab. */
export const politicalSettlementFingerprint = (input: ReviewInput): string => JSON.stringify([
  input.state, input.context, Boolean(input.busy), input.authorityNote,
]);

export function preparePoliticalSettlementReview(input: ReviewInput, action: PoliticalSettlementAction): {
  review: PoliticalSettlementReviewSnapshot | null; reason: string;
} {
  if (input.busy) return { review: null, reason: '기간 진행 중입니다. 결산이 끝난 뒤 최신 조건으로 검토하세요.' };
  const result = reviewPoliticalSettlementAction(input.state, action, input.context);
  if (!result.allowed) return { review: null, reason: result.reason };
  return {
    review: { action: { ...action }, fingerprint: politicalSettlementFingerprint(input), summary: result.summary, cost: { ...result.cost }, dueWeek: result.dueWeek },
    reason: '아직 집행하지 않았습니다. 비용과 범위를 확인한 뒤 승인하세요.',
  };
}

export function confirmPoliticalSettlementReview(
  review: PoliticalSettlementReviewSnapshot,
  input: ReviewInput & Pick<PoliticalSettlementBoardProps, 'onExecute'>,
  gate: { current: string | null },
): { accepted: boolean; message: string } {
  if (review.fingerprint !== politicalSettlementFingerprint(input)) return { accepted: false, message: '주차·소속·권한·통제 또는 자원이 바뀌었습니다. 최신 조건으로 다시 검토하세요.' };
  const fresh = preparePoliticalSettlementReview(input, review.action);
  if (!fresh.review) return { accepted: false, message: fresh.reason };
  const key = JSON.stringify([review.fingerprint, review.action]);
  if (gate.current === key) return { accepted: false, message: '이미 전달한 안건입니다. 처리 결과를 확인하세요.' };
  gate.current = key;
  // The owning handler validates and applies the result. This view never writes resources.
  input.onExecute({ ...review.action });
  return { accepted: true, message: '집행 요청을 전달했습니다. 아래의 현재 상태와 기록에서 반영 결과를 확인하세요.' };
}

export function getPoliticalSettlementLandSeats(territories: readonly Territory[]): Territory[] {
  return territories.filter((territory) => territory.siteType !== 'sea'
    && getTerritoryGeography(territory.id)?.kind !== 'sea'
    && !/해역|해상|바다|대양/.test(territory.terrain));
}

export function formatPoliticalSettlementWeek(week: number): string {
  const date = getCampaignDateForWeek(week);
  return `제${week + 1}주 · ${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
}

const nationNames = new Map(nations.map((nation) => [nation.id, nation.shortName]));
const recognitionLabels = { pending: '심사 중', recognized: '정부 대표권 승인', deferred: '유보', rejected: '거부' } as const;
const administrationLabels = { preparing: '인수 준비 중', operating: '행정 운영 중', suspended: '인수·운영 중단' } as const;
// A just-below-threshold value must not look as though it meets the adjacent requirement.
const conditionValue = (value: number) => {
  if (!Number.isFinite(value) || value < 0 || value > 100) return '—';
  // Truncate decimal text so binary multiplication cannot turn 64.99 into 64.98.
  const truncated = value < .01 ? 0 : Number(String(value).replace(/(\.\d{2})\d+$/, '$1'));
  return truncated.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
};
const actionTitles: Record<PoliticalSettlementAction['kind'], string> = {
  declare: '대표 주체 공표', 'request-recognition': '정부 대표권 승인 요청',
  'start-administration': '현지 행정 인수 준비', 'resume-administration': '현지 행정 준비 재개',
};

export function PoliticalSettlementBoard(props: PoliticalSettlementBoardProps) {
  const { state, context, nationName, onOpenMap, authorityNote, formatMoney, busy } = props;
  const inputId = useId();
  const landSeats = getPoliticalSettlementLandSeats(context.territories);
  const polity = getPoliticalSettlementPolity(state, context.nationId);
  const partners = context.relations.filter((relation, index, entries) => nationNames.has(relation.id as NationId)
    && relation.id !== context.nationId && entries.findIndex((other) => other.id === relation.id) === index);
  const ownFaction = nations.find((nation) => nation.id === context.nationId)?.alignment;
  const defaultAdministration = landSeats.find((territory) => context.control.current[territory.id]?.verifiedControllerNationId === context.nationId
    || (territory.ownerId === context.nationId && territory.controller === ownFaction));
  const [name, setName] = useState(`${nationName} 대표정부`);
  const [declaration, setDeclaration] = useState<'independence' | 'representation'>('representation');
  const [seatId, setSeatId] = useState(props.defaultSeatTerritoryId);
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? '');
  const [administrationId, setAdministrationId] = useState(defaultAdministration?.id ?? '');
  const [review, setReview] = useState<PoliticalSettlementReviewSnapshot | null>(null);
  const [message, setMessage] = useState('');
  const gate = useRef<string | null>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const seat = landSeats.find((territory) => territory.id === seatId);
  const partner = partners.find((relation) => relation.id === partnerId);
  const administrationTerritory = landSeats.find((territory) => territory.id === administrationId);
  const recognitions = polity ? state.recognitions.filter((entry) => entry.polityId === polity.id) : [];
  const administrations = polity ? state.administrations.filter((entry) => entry.polityId === polity.id) : [];
  const selectedAdministration = administrations.find((entry) => entry.territoryId === administrationId);
  const selectedRecognition = recognitions.find((entry) => entry.partnerNationId === partnerId);
  const territoryName = (id: string) => context.territories.find((territory) => territory.id === id)?.name ?? '현재 목록에 없는 거점';
  const isStale = Boolean(review && review.fingerprint !== politicalSettlementFingerprint(props));
  const clearReview = () => { setReview(null); setMessage(''); };
  const propose = (action: PoliticalSettlementAction) => {
    const result = preparePoliticalSettlementReview(props, action);
    setReview(result.review); setMessage(result.reason);
    if (result.review) requestAnimationFrame(() => reviewRef.current?.focus());
  };
  const confirm = () => {
    if (!review) return;
    const result = confirmPoliticalSettlementReview(review, props, gate);
    setMessage(result.message);
    if (result.accepted) setReview(null);
  };
  const declarationAction: PoliticalSettlementAction = { kind: 'declare', name: name.trim(), seatTerritoryId: seat?.id ?? '', declaration };
  const recognitionAction: PoliticalSettlementAction = { kind: 'request-recognition', partnerNationId: (partner?.id ?? '') as NationId };
  const administrationAction: PoliticalSettlementAction = { kind: selectedAdministration?.status === 'suspended' ? 'resume-administration' : 'start-administration', territoryId: administrationTerritory?.id ?? '' };
  const assess = (action: PoliticalSettlementAction) => busy
    ? { allowed: false, reason: '기간 진행이 끝난 뒤 검토할 수 있습니다.' }
    : reviewPoliticalSettlementAction(state, action, context);
  const declarationAssessment = assess(declarationAction);
  const recognitionAssessment = assess(recognitionAction);
  const administrationAssessment = assess(administrationAction);

  return <section className="political-settlement-board" aria-labelledby={`${inputId}-heading`}>
    <header className="settlement-heading">
      <div><span className="settlement-eyebrow">{nationName} · 정치 기록실</span><h2 id={`${inputId}-heading`}>정부 대표권·현지 행정</h2><p>공표한 주체, 상대국의 승인, 현지 행정은 서로 다른 상태입니다.</p></div>
      <span className="settlement-date">{formatPoliticalSettlementWeek(context.week)}</span>
      <div className="governance-illustration-slot"><GameIllustration scene="territorial-administration" compact /></div>
    </header>
    <p className="settlement-authority">{authorityNote}</p>
    <dl className="settlement-summary" aria-label="대표권과 행정 현황">
      <div><dt>대표 주체 공표</dt><dd>{polity ? polity.declaration === 'independence' ? '독립 선언 기록' : '대표권 선언 기록' : '미공표'}<small>공표만으로 영토가 생기지 않습니다.</small></dd></div>
      <div><dt>외교 승인</dt><dd>{recognitions.filter((entry) => entry.status === 'recognized').length}개국<small>정부 대표권 승인 · 영토 주권과 별개</small></dd></div>
      <div><dt>현지 행정</dt><dd>{administrations.filter((entry) => entry.status === 'operating').length}개 거점 운영<small>외교 승인 없이도 별도 요건으로 준비 가능</small></dd></div>
    </dl>
    {message ? <p className="settlement-message" role="status">{message}</p> : null}
    {review ? <section ref={reviewRef} tabIndex={-1} className="settlement-review" aria-label="정치 안건 집행 전 검토">
      <span className="settlement-eyebrow">검토 중 · 아직 집행하지 않음</span><h3>{actionTitles[review.action.kind]}</h3><p>{review.summary}</p>
      <dl><div><dt>정치력 비용</dt><dd>{review.cost.politicalPower}</dd></div><div><dt>국고 비용</dt><dd>{formatMoney(review.cost.treasury)}</dd></div><div><dt>확인 시점</dt><dd>{review.dueWeek === null ? '승인 즉시 공표 기록' : formatPoliticalSettlementWeek(review.dueWeek)}</dd></div></dl>
      <p className="settlement-caution">{review.action.kind === 'declare' ? '선언은 대표 주체의 공표입니다. 외국의 승인·거점 통제·국경은 바뀌지 않습니다.' : review.action.kind === 'request-recognition' ? '지금 승인하는 것은 요청 발송입니다. 상대국이 2주 뒤 정부 대표권의 승인·유보·거부를 판단합니다.' : '3주 동안 보급과 제도 요건을 유지해야 운영을 시작합니다. 인수 준비가 영토 획득이나 병력 이동을 뜻하지 않습니다.'}</p>
      {isStale ? <p role="alert">조건이 바뀌었습니다. 이전 검토안으로는 집행할 수 없습니다.</p> : null}
      <div className="settlement-actions"><button type="button" onClick={() => setReview(null)}>검토 취소</button>{isStale ? <button type="button" onClick={() => propose(review.action)}>최신 조건 재검토</button> : null}<button type="button" className="settlement-primary" disabled={isStale || Boolean(busy)} onClick={confirm}>확인 후 집행 요청</button></div>
    </section> : null}

    <article className="settlement-declaration" aria-labelledby={`${inputId}-declaration-heading`}>
      <div className="settlement-section-title"><GameIcon name="politics" size={21} tone="steel" /><div><h3 id={`${inputId}-declaration-heading`}>대표 주체와 선언</h3><p>현지 연락 거점과 공표 내용을 기록합니다. 이 위치는 국경의 범위가 아닙니다.</p></div></div>
      {polity ? <div className="settlement-polity"><div><h4>{polity.name}</h4><p>{polity.declaration === 'independence' ? '독립 선언' : '정부 대표권 선언'} · {formatPoliticalSettlementWeek(polity.declaredWeek)}</p><p>연락·대표 중심 거점: {territoryName(polity.seatTerritoryId)}</p><small>기록된 선언은 당시의 공표이며, 법적 주권이나 주변 지역의 통제를 자동 확정하지 않습니다.</small></div><button type="button" disabled={!context.territories.some((territory) => territory.id === polity.seatTerritoryId)} onClick={() => onOpenMap(polity.seatTerritoryId)}>중심 거점 지도 조회</button></div> : <>
        <div className="settlement-declaration-fields"><label htmlFor={`${inputId}-name`}>공표할 주체 이름<input id={`${inputId}-name`} maxLength={80} value={name} disabled={!context.canDeclare} onChange={(event) => { setName(event.target.value); clearReview(); }} /></label><label htmlFor={`${inputId}-declaration`}>공표 성격<select id={`${inputId}-declaration`} value={declaration} disabled={!context.canDeclare} onChange={(event) => { setDeclaration(event.target.value as typeof declaration); clearReview(); }}><option value="representation">정부 대표권 선언</option><option value="independence">독립 선언</option></select></label><label htmlFor={`${inputId}-seat`}>연락·대표 중심 거점<select id={`${inputId}-seat`} value={seat?.id ?? ''} disabled={!context.canDeclare} onChange={(event) => { setSeatId(event.target.value); clearReview(); }}><option value="" disabled>육상 거점을 선택하세요</option>{landSeats.map((territory) => <option key={territory.id} value={territory.id}>{territory.name} · {territory.region}</option>)}</select></label></div>
        <div className="settlement-action-row"><button type="button" className="settlement-primary" disabled={!declarationAssessment.allowed} onClick={() => propose(declarationAction)}>공표안 검토</button><p>{declarationAssessment.allowed ? '공표안 검토에는 비용이 들지 않습니다.' : declarationAssessment.reason}</p></div>
      </>}
    </article>

    <div className="settlement-columns">
      <article className="settlement-domain" aria-labelledby={`${inputId}-recognition-heading`}>
        <div className="settlement-section-title"><GameIcon name="diplomacy" size={21} tone="steel" /><div><h3 id={`${inputId}-recognition-heading`}>상대국의 대표권 승인</h3><p>요청과 답변을 분리해 추적합니다.</p></div></div>
        <section className="settlement-ledger" aria-label="국가별 요청·답변 기록">
          <header><h4>국가별 요청·답변</h4><span>{recognitions.length}건</span></header>
          {recognitions.length ? <ul className="settlement-ledger-list">{recognitions.map((entry) => <li key={`${entry.polityId}:${entry.partnerNationId}`}>
            <button type="button" className={`settlement-record-select status-${entry.status}`} aria-pressed={entry.partnerNationId === partnerId} onClick={() => { setPartnerId(entry.partnerNationId); clearReview(); }}>
              <span className="settlement-record-name">{nationNames.get(entry.partnerNationId) ?? '상대국 미확인'}</span><strong>{recognitionLabels[entry.status]}</strong>
              <small>{entry.status === 'pending' ? `답변 예정 ${formatPoliticalSettlementWeek(entry.dueWeek)}` : `최종 결정 ${formatPoliticalSettlementWeek(entry.resolvedWeek ?? entry.requestedWeek)}`}</small>
            </button>
          </li>)}</ul> : <p className="settlement-empty">아직 이 주체에 대한 국가별 승인 기록이 없습니다.</p>}
        </section>
        <div className="settlement-target-editor">
          <label htmlFor={`${inputId}-partner`}>요청할 상대국<select id={`${inputId}-partner`} value={partner?.id ?? ''} onChange={(event) => { setPartnerId(event.target.value); clearReview(); }}><option value="" disabled>외교 관계국을 선택하세요</option>{partners.map((relation) => <option key={relation.id} value={relation.id}>{nationNames.get(relation.id as NationId)} · 관계 {conditionValue(relation.value)}</option>)}</select></label>
          {selectedRecognition ? <div className={`settlement-status status-${selectedRecognition.status}`}><strong>{recognitionLabels[selectedRecognition.status]}</strong><p>{selectedRecognition.reason}</p><small>{selectedRecognition.status === 'pending' ? `답변 예정 ${formatPoliticalSettlementWeek(selectedRecognition.dueWeek)}` : typeof selectedRecognition.resolvedWeek === 'number' ? `결정 ${formatPoliticalSettlementWeek(selectedRecognition.resolvedWeek)}` : `신청 ${formatPoliticalSettlementWeek(selectedRecognition.requestedWeek)}`}</small></div> : null}
          <dl className="settlement-requirements" aria-label="선택국 승인 심사 조건"><div><dt>선택국 관계</dt><dd>{partner ? conditionValue(partner.value) : '—'}<small> / 65 이상</small></dd></div><div><dt>자국 안정도</dt><dd>{conditionValue(context.stability)}<small> / 45 이상</small></dd></div></dl>
          <p className="settlement-timing">답변 심사 2주 · 요청 시점의 수치만으로 승인되지 않습니다.</p>
          <div className="settlement-action-row"><p>{recognitionAssessment.allowed ? '상대국의 정부 대표권 승인을 요청합니다. 영토 주권 승인과는 다릅니다.' : recognitionAssessment.reason}</p><button type="button" className="settlement-primary" disabled={!recognitionAssessment.allowed} onClick={() => propose(recognitionAction)}>승인 요청안 검토</button></div>
          <details className="settlement-help"><summary>심사 규칙과 승인의 범위</summary><p>게임 규칙: 2주 뒤 관계 65·안정도 45 이상 등 심사 조건을 확인합니다. 부족하면 유보·거부될 수 있으며, 요청 시점의 높은 수치도 승인을 보장하지 않습니다.</p></details>
        </div>
      </article>
      <article className="settlement-domain" aria-labelledby={`${inputId}-administration-heading`}>
        <div className="settlement-section-title"><GameIcon name="organization" size={21} tone="steel" /><div><h3 id={`${inputId}-administration-heading`}>거점별 현지 행정</h3><p>선언·외교 승인과 별도로 인수 준비를 진행합니다.</p></div></div>
        <section className="settlement-ledger" aria-label="거점별 행정 상태 기록">
          <header><h4>거점별 행정 상태</h4><span>{administrations.length}건</span></header>
          {administrations.length ? <ul className="settlement-ledger-list">{administrations.map((entry) => <li key={`${entry.polityId}:${entry.territoryId}`}>
            <button type="button" className={`settlement-record-select status-${entry.status}`} aria-pressed={entry.territoryId === administrationId} onClick={() => { setAdministrationId(entry.territoryId); clearReview(); }}>
              <span className="settlement-record-name">{territoryName(entry.territoryId)}</span><strong>{administrationLabels[entry.status]}</strong>
              <small>{entry.status === 'preparing' ? `준비 ${entry.progressWeeks}/3주 · 다음 주간 결산에서 검증` : `마지막 확인 ${formatPoliticalSettlementWeek(entry.lastProcessedWeek)}`}</small>
            </button>
          </li>)}</ul> : <p className="settlement-empty">아직 준비하거나 운영 중인 현지 행정이 없습니다.</p>}
        </section>
        <div className="settlement-target-editor">
          <div className="settlement-target-line"><label htmlFor={`${inputId}-administration`}>인수할 육상 거점<select id={`${inputId}-administration`} value={administrationTerritory?.id ?? ''} onChange={(event) => { setAdministrationId(event.target.value); clearReview(); }}><option value="" disabled>거점을 선택하세요</option>{landSeats.map((territory) => <option key={territory.id} value={territory.id}>{territory.name} · {territory.region}</option>)}</select></label><button type="button" className="settlement-map-link" disabled={!administrationTerritory} onClick={() => { if (administrationTerritory) onOpenMap(administrationTerritory.id); }}>거점 지도 조회</button></div>
          {selectedAdministration ? <div className={`settlement-status status-${selectedAdministration.status}`}><strong>{administrationLabels[selectedAdministration.status]}</strong><p>{selectedAdministration.reason}</p><small>{selectedAdministration.status === 'preparing' ? `준비 ${selectedAdministration.progressWeeks}/3주 · 다음 주간 결산에서 검증` : `마지막 확인 ${formatPoliticalSettlementWeek(selectedAdministration.lastProcessedWeek)}`}</small></div> : null}
          <dl className="settlement-requirements" aria-label="선택 거점 행정 준비 조건"><div><dt>선택 거점 보급</dt><dd>{administrationTerritory ? conditionValue(administrationTerritory.supply) : '—'}<small> / 40 이상</small></dd></div><div><dt>제도 역량</dt><dd>{conditionValue(context.institutionalCapacity)}<small> / 45 이상</small></dd></div></dl>
          <p className="settlement-timing">자국 통제 확인 · 3주간 요건 유지 · 외교 승인 수와 별개</p>
          <div className="settlement-action-row"><p>{administrationAssessment.allowed ? '명시한 거점 한 곳의 행정 준비입니다. 국가 운영 단계 전환 권한은 별도입니다.' : administrationAssessment.reason}</p><button type="button" className="settlement-primary" disabled={!administrationAssessment.allowed} onClick={() => propose(administrationAction)}>{administrationAction.kind === 'resume-administration' ? '준비 재개안 검토' : '행정 인수안 검토'}</button></div>
          <details className="settlement-help"><summary>행정 준비 규칙과 통제 조건</summary><p>게임 규칙: 자국 통제 확인, 보급 40·제도 역량 45 이상을 유지하며 3주간 준비합니다. 타국 거점·해역은 인수할 수 없으며 외교 승인 수는 필수 조건이 아닙니다.</p></details>
        </div>
      </article>
    </div>
    <details className="settlement-records settlement-journal"><summary>정치 상태 변경 기록 {state.journal.length}건</summary>{state.journal.length ? <ul>{[...state.journal].sort((a, b) => b.week - a.week).map((entry) => <li key={entry.id}><div><strong>{entry.title}</strong><small>{formatPoliticalSettlementWeek(entry.week)}</small></div><p>{entry.detail}</p></li>)}</ul> : <p className="settlement-empty">새 기능 이전의 선언·승인·행정 이력은 만들어내지 않습니다. 지금부터 확정한 결과를 기록합니다.</p>}</details>
  </section>;
}
