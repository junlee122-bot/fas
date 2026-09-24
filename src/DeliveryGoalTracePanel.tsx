import { ArrowUpRight, ClipboardCheck, Factory, PackageCheck, Truck, UserRound, Warehouse } from 'lucide-react';
import { buildDeliveryGoalTrace } from './deliveryGoalTrace';
import type { StaffDeliveryPledge, StaffDeliveryPledgeContext } from './staffDeliveryPledges';
import type { RegionalIndustryContext, RegionalIndustryState } from './regionalIndustry';
import type { NationId } from './types';
import './DeliveryGoalTracePanel.css';

/** Navigation only. Every destination still checks its own command authority. */
export type DeliveryGoalNavigation =
  | { kind: 'production'; nationId: NationId; pledgeId: string; lineId: string }
  | { kind: 'logistics'; nationId: NationId; pledgeId: string; view: 'dispatch' | 'records'; shipmentId?: string }
  | { kind: 'staff'; nationId: NationId; pledgeId: string; staffId: string; personId: string };

export interface DeliveryGoalTracePanelProps {
  pledge: StaffDeliveryPledge;
  context: StaffDeliveryPledgeContext;
  regional?: { state: RegionalIndustryState; context: RegionalIndustryContext };
  onNavigate?: (target: DeliveryGoalNavigation) => void;
}

const amount = (value: number | null) => value === null ? '확인 불가' : `${value.toLocaleString()}개`;
const sourceLabels = { 'factory-completed': '생산 완료', 'national-direct': '국가 직납', 'shipment-arrival': '수송 도착' };

export function DeliveryGoalTracePanel({ pledge, context, regional, onNavigate }: DeliveryGoalTracePanelProps) {
  const trace = buildDeliveryGoalTrace({ pledge, context, regional });
  const owner = context.staff.filter(member => member.id === pledge.staffId && member.personId === pledge.personId && member.department === pledge.department
    && (member.joinedWeek === undefined || (Number.isSafeInteger(member.joinedWeek) && member.joinedWeek >= 0 && member.joinedWeek <= pledge.createdWeek)));
  const canOpenStaff = trace.available && pledge.nationId === context.nationId && owner.length === 1
    && context.manageableDepartments.includes(pledge.department);
  const industryMode = context.industryMandate.mode;
  const productionNavigationLabel = industryMode === 'request' ? '생산 보고·상신 확인' : industryMode === 'report' ? '생산 보고 열람' : '이 생산라인 열기';
  const workNavigationLabel = industryMode === 'request' ? '담당 부서 보고·상신 확인' : industryMode === 'report' ? '담당 부서 보고 열람' : '해당 작업 확인';
  const navigateProduction = () => onNavigate?.({ kind: 'production', nationId: pledge.nationId, pledgeId: pledge.id, lineId: pledge.lineId });
  const navigateLogistics = (view: 'dispatch' | 'records', shipmentId?: string) => onNavigate?.({ kind: 'logistics', nationId: pledge.nationId, pledgeId: pledge.id, view, shipmentId });
  const primaryNavigation = trace.available && onNavigate && (trace.nextStep.kind === 'production' && trace.production
    ? navigateProduction : trace.nextStep.kind === 'dispatch' || trace.nextStep.kind === 'records'
      ? () => navigateLogistics(trace.nextStep.kind === 'dispatch' ? 'dispatch' : 'records', trace.nextStep.shipmentId) : null);

  return <section className="delivery-goal-trace" aria-label={`${pledge.staffName}의 납품 목표 추적`}>
    <header><div><span>DELIVERY / 실제 기록 연결</span><h5>이 목표는 어디까지 왔나요?</h5></div><strong>{trace.available || trace.receipts.length ? amount(trace.credited) : '검증 불가'} <small>/ 목표 {amount(pledge.targetQuantity)}</small></strong></header>
    <p className="delivery-trace-basis">{pledge.metric === 'factory-completed' ? '이 목표는 해당 라인의 공장 완료량을 셉니다. 수송 도착은 달성 조건이 아닙니다.' : '이 목표는 같은 품목의 신규 국가 직납과 실제 수송 도착을 셉니다. 현재 비축 잔량과는 다릅니다.'}</p>
    {trace.available && onNavigate && (industryMode === 'request' || industryMode === 'report') ? <p className="delivery-trace-notice">{industryMode === 'request' ? '현재 보직은 생산·수송의 보고·상신 화면으로 이동합니다. 직접 편집 작업대를 열거나 결재를 대신하지 않습니다.' : '현재 보직은 생산·수송의 보고 열람 화면으로 이동합니다. 직접 편집 작업대를 열거나 명령을 실행하지 않습니다.'}</p> : null}
    {trace.reason ? <p className="delivery-trace-notice" role="status">{trace.reason}</p> : null}
    <div className="delivery-trace-stages" aria-label="목표의 생산·물류·실적 구분">
      <article><Factory size={21} aria-hidden="true" /><span>01 · 현재 생산라인</span><strong>{trace.production?.name ?? '현재 생산 연결 없음'}</strong><p>{trace.production ? `배정 ${trace.production.assigned.toLocaleString()}개 · 효율 ${trace.production.efficiency}%` : '과거 실적을 현재 생산 상태로 대신 설명하지 않습니다.'}</p>{trace.production && onNavigate ? <button type="button" onClick={navigateProduction}>{productionNavigationLabel}<ArrowUpRight size={15} /></button> : null}</article>
      <article><Warehouse size={21} aria-hidden="true" /><span>02 · 같은 품목의 현재 물류</span><dl><div><dt>창고</dt><dd>{amount(trace.warehouse)}</dd></div><div><dt>출발 예약</dt><dd>{amount(trace.reserved)}</dd></div><div><dt>운송 중</dt><dd>{amount(trace.inTransit)}</dd></div></dl><p>현재 참고량 · 이 목표 전용 예약이나 달성량이 아닙니다.</p></article>
      <article><PackageCheck size={21} aria-hidden="true" /><span>03 · 약속에 반영된 실적</span><strong>{trace.available || trace.receipts.length ? amount(trace.credited) : '확인 불가'}</strong><p>{!trace.available ? '현재 유효한 달성 판정을 제공하지 않습니다' : trace.remaining > 0 ? `목표까지 ${amount(trace.remaining)} 남음` : '목표 수량 충족'} · 실제 영수증 {trace.receipts.length}건</p><small>제{pledge.deadlineWeek + 1}주 검증 · 수량 충족만으로 기한 전 성공 확정하지 않음</small></article>
    </div>
    <div className="delivery-trace-next"><ClipboardCheck size={20} aria-hidden="true" /><div><strong>{trace.nextStep.label}</strong><p>{trace.nextStep.reason}</p></div>{primaryNavigation ? <button type="button" onClick={primaryNavigation}>{workNavigationLabel}<ArrowUpRight size={16} /></button> : null}</div>
    {trace.relatedShipments.length ? <details className="delivery-trace-shipments"><summary>같은 품목의 진행 중 운송 {trace.relatedShipments.length}건 · 목표 실적과 별개</summary><ul>{trace.relatedShipments.map(shipment => <li key={shipment.id}><div><strong>{shipment.originName} → {shipment.destinationName}</strong><span>{amount(shipment.quantity)} · {shipment.status === 'reserved' ? '출발 예약' : '운송 중'}{shipment.holdReason ? ' · 보류' : ''}</span><p>{shipment.currentBlocker ?? shipment.holdReason ?? shipment.summary}</p><small>운송 ID: {shipment.id}</small></div>{onNavigate ? <button type="button" onClick={() => navigateLogistics('records', shipment.id)}><Truck size={16} />이 운송 확인</button> : null}</li>)}</ul></details> : null}
    <details className="delivery-trace-evidence" open><summary>실제 반영 영수증과 도착 근거 {trace.receipts.length}건</summary>{trace.receipts.length ? <ul>{[...trace.receipts].sort((a, b) => b.receipt.week - a.receipt.week).map(entry => <li key={entry.receipt.id}><div><strong>제{entry.receipt.week + 1}주 · {sourceLabels[entry.receipt.source]} · {amount(entry.receipt.quantity)}</strong><p>{entry.originName && entry.destinationName ? `${entry.originName} → ${entry.destinationName}` : entry.linkReason}</p>{entry.originName && entry.destinationName ? <small>{entry.linkReason}</small> : null}<small>영수증 ID: {entry.receipt.id}</small></div>{trace.available && entry.shipmentId && onNavigate ? <button type="button" onClick={() => navigateLogistics('records', entry.shipmentId!)}>이 도착 증빙 열기<ArrowUpRight size={15} /></button> : null}</li>)}</ul> : <p>{trace.available ? '아직 반영된 영수증이 없습니다.' : '현재 맥락에서 검증 가능한 영수증이 없습니다.'} 예상 생산량·창고·운송 중 물량을 실적으로 더하지 않습니다.</p>}</details>
    <footer>{canOpenStaff && onNavigate ? <button type="button" onClick={() => onNavigate({ kind: 'staff', nationId: pledge.nationId, pledgeId: pledge.id, staffId: pledge.staffId, personId: pledge.personId })}><UserRound size={16} />이 담당자 업무 확인<ArrowUpRight size={15} /></button> : null}<span>화면 이동은 지시·예약·보상 처리가 아닙니다.</span></footer>
    {trace.notes.length ? <details className="delivery-trace-limits"><summary>집계 범위와 연결 한계</summary>{trace.notes.map((note, index) => <p key={`${index}:${note}`}>{note}</p>)}</details> : null}
  </section>;
}
