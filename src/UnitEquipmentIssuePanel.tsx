import { useId, useRef, useState } from 'react';
import { ArrowUpRight, Check, ClipboardCheck, PackageCheck, ShieldCheck } from 'lucide-react';
import { getUnitEquipmentIssueReceipts, reviewUnitEquipmentIssue, unitEquipmentIssueLabels } from './unitEquipmentIssue';
import type { UnitEquipmentIssueCommand, UnitEquipmentIssueContext, UnitEquipmentIssuePreview, UnitEquipmentIssueState } from './unitEquipmentIssue';
import './UnitEquipmentIssuePanel.css';

export interface UnitEquipmentIssuePanelProps {
  state: UnitEquipmentIssueState;
  context: UnitEquipmentIssueContext;
  divisionId: string;
  onApprove: (command: UnitEquipmentIssueCommand) => boolean;
  onOpenIndustry?: () => void;
}
export interface UnitEquipmentIssuePanelReview {
  nationId: UnitEquipmentIssueContext['nationId'];
  week: number;
  divisionId: string;
  reviewKey: string;
  preview: UnitEquipmentIssuePreview;
}
type IssueInput = Pick<UnitEquipmentIssuePanelProps, 'state' | 'context' | 'divisionId'>;
export function createUnitEquipmentIssuePanelReview(input: IssueInput): UnitEquipmentIssuePanelReview | null {
  const result = reviewUnitEquipmentIssue(input.state, input.divisionId, input.context);
  return result.allowed && result.reviewKey && result.preview ? {
    nationId: input.context.nationId, week: input.context.week, divisionId: input.divisionId,
    reviewKey: result.reviewKey, preview: { ...result.preview },
  } : null;
}
export function canConfirmUnitEquipmentIssue(review: UnitEquipmentIssuePanelReview | null, input: IssueInput): boolean {
  if (!review || review.nationId !== input.context.nationId || review.week !== input.context.week || review.divisionId !== input.divisionId) return false;
  const current = reviewUnitEquipmentIssue(input.state, input.divisionId, input.context);
  return current.allowed && current.reviewKey === review.reviewKey;
}

const amount = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
function IssuePreview({ preview, reviewed }: { preview: UnitEquipmentIssuePreview; reviewed: boolean }) {
  return <>
    <p className="unit-issue-target"><ShieldCheck size={18} aria-hidden="true" /><strong>{preview.divisionName}</strong><span>{preview.territoryName} 주둔</span></p>
    <dl className="unit-issue-flow" aria-label={reviewed ? '검토한 장비 차감 내역' : '현재 조건의 장비 차감 예상'}>
      <div><dt>국가 가용 {unitEquipmentIssueLabels[preview.equipmentKey]}</dt><dd>{amount(preview.stockBefore)}개</dd></div>
      <div><dt>이번 지급에 필요한 수량</dt><dd className="unit-issue-cost">−{amount(preview.quantity)}개</dd></div>
      <div><dt>지급 후 국가 가용 비축</dt><dd>{preview.stockAfter < 0 ? `${amount(-preview.stockAfter)}개 부족` : `${amount(preview.stockAfter)}개`}</dd></div>
    </dl>
    <div className="unit-issue-supply"><div><span>부대 기초 보급</span><strong>{amount(preview.supplyBefore)} → {amount(preview.supplyAfter)} / 100 <small>(+{amount(preview.supplyGain)})</small></strong></div>
      <progress aria-label="지급 후 부대 기초 보급 예상" value={preview.supplyAfter} max={100} />
      <small>승인 전 예상입니다. 병력·전투력·사기를 직접 올리는 명령은 아닙니다.</small>
    </div>
  </>;
}

export function UnitEquipmentIssuePanel(props: UnitEquipmentIssuePanelProps) {
  return <UnitEquipmentIssuePanelContent key={`${props.context.nationId}:${props.divisionId}`} {...props} />;
}
function UnitEquipmentIssuePanelContent(props: UnitEquipmentIssuePanelProps) {
  const { state, context, divisionId, onApprove, onOpenIndustry } = props;
  const titleId = useId();
  const [review, setReview] = useState<UnitEquipmentIssuePanelReview | null>(null);
  const [notice, setNotice] = useState('');
  const submittedKey = useRef<string | null>(null);
  const current = reviewUnitEquipmentIssue(state, divisionId, context);
  const canInspect = Boolean(divisionId) && context.commandableDivisionIds.has(divisionId)
    && context.divisions.filter(division => division.id === divisionId).length === 1;
  const validReview = canConfirmUnitEquipmentIssue(review, props);
  const receipts = canInspect ? getUnitEquipmentIssueReceipts(state, context.nationId, divisionId, context.week).slice(0, 5) : [];
  const propose = () => {
    const next = createUnitEquipmentIssuePanelReview(props);
    if (!next) { setNotice(reviewUnitEquipmentIssue(state, divisionId, context).reason); return; }
    setReview(next); setNotice('');
  };
  const approve = () => {
    if (!review || !canConfirmUnitEquipmentIssue(review, props) || submittedKey.current === review.reviewKey) return;
    submittedKey.current = review.reviewKey;
    const applied = onApprove({ divisionId: review.divisionId, reviewKey: review.reviewKey });
    setReview(null);
    if (applied) setNotice('장비 지급이 승인되었습니다. 국가 비축·부대 기초 보급과 아래 실제 지급 기록을 확인하세요.');
    else { submittedKey.current = null; setNotice('장비 지급이 반영되지 않았습니다. 최신 조건을 다시 검토하세요.'); }
  };
  return <section className="unit-equipment-issue" aria-labelledby={titleId}>
    <header><div><span className="unit-issue-eyebrow">NATIONAL DEPOT → UNIT</span><h3 id={titleId}>국가 비축에서 부대로 장비 지급</h3><small>부대별 주 1회 · 승인 전에는 비축과 보급이 바뀌지 않습니다.</small></div><PackageCheck size={25} aria-hidden="true" /></header>
    <p className="unit-issue-notice" role="status">{current.reason}</p>
    {canInspect && current.lastIssuedWeek !== null ? <p>이 부대의 최근 지급: 제{current.lastIssuedWeek + 1}주{current.lastIssuedWeek === context.week ? ' · 이번 주 지급 완료' : ''}</p> : null}
    {!review && canInspect && current.lastIssuedWeek !== context.week && current.preview ? <IssuePreview preview={current.preview} reviewed={false} /> : null}
    <div className="unit-issue-actions"><button type="button" disabled={!current.allowed} onClick={propose}><ClipboardCheck size={17} aria-hidden="true" />{review ? '최신 지급안 다시 검토' : '장비 지급안 검토'}</button>{onOpenIndustry ? <button type="button" onClick={onOpenIndustry}>생산·가용 비축 확인<ArrowUpRight size={16} aria-hidden="true" /></button> : null}</div>
    {review ? <section className="unit-issue-review" data-stale={!validReview} aria-label="장비 지급 최종 검토">
      <h4>제{review.week + 1}주에 검토한 지급안 · 아직 미집행</h4>
      <IssuePreview preview={review.preview} reviewed />
      {!validReview ? <p className="unit-issue-notice" role="status">국가·주차·부대·위치·비축·보급 또는 실행 조건이 바뀌어 승인을 잠갔습니다. 위 수치는 이전 검토안이며 바뀐 비용을 자동으로 적용하지 않습니다.</p> : <p>아래 승인 버튼을 누르면 위 수량을 한 번 차감하고 해당 부대에 즉시 지급합니다.</p>}
      <div className="unit-issue-actions"><button type="button" onClick={() => setReview(null)}>검토 취소</button><button className="unit-issue-primary" type="button" disabled={!validReview} onClick={approve}><Check size={17} aria-hidden="true" />이 수량으로 장비 지급 승인</button></div>
    </section> : null}
    {notice ? <p className="unit-issue-notice" role="status">{notice}</p> : null}
    <p className="unit-issue-limits">게임의 장비 수량을 부대 기초 보급 지표로 바꾸는 추상화된 현지 지급입니다. 전투용 보급 수치는 제식 장비·준비도 보정을 별도로 적용합니다. 실제 역사 속 편제별 실물 수량이나 특정 공장의 생산 묶음 출처를 증명하지 않습니다. 지역 창고·수송 중 물량은 국가 가용 비축이 아니며 이 지급에 사용할 수 없습니다.</p>
    <details className="unit-issue-history" open><summary>이 국가·이 부대의 최근 실제 지급 {receipts.length}건</summary>
      {receipts.length ? <ol>{receipts.map(receipt => <li key={receipt.id}><strong>제{receipt.week + 1}주 · {receipt.divisionName}</strong><span>{unitEquipmentIssueLabels[receipt.equipmentKey]} {amount(receipt.quantity)}개 지급 · {receipt.territoryName}</span><span>국가 비축 {amount(receipt.stockBefore)} → {amount(receipt.stockAfter)}개 · 부대 기초 보급 {amount(receipt.supplyBefore)} → {amount(receipt.supplyAfter)}</span><small>당시 확정 기록 · 현재 비축 잔량·현재 부대 상태와 별개</small></li>)}</ol> : <p>{canInspect ? '이 국가와 선택 부대에 일치하는 확정 지급 기록이 없습니다. 예상량으로 기록을 채우지 않습니다.' : '현재 지휘 범위의 부대를 정확히 선택하면 지급 기록을 확인할 수 있습니다.'}</p>}
    </details>
  </section>;
}
