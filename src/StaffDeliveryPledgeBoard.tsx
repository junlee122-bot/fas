import { useId, useRef, useState } from 'react';
import { ArrowUpRight, CalendarClock, ClipboardCheck, Factory, PackageCheck, UserRound } from 'lucide-react';
import { createStaffDeliveryPledge, deriveStaffDeliveryPledgeForecast, getStaffDeliveryPledgeAvailability, getStaffDeliveryPledgeLines, getStaffDeliveryPledgeQuantity, normalizeStaffDeliveryPledges, staffDeliveryPledgeDurations, STAFF_DELIVERY_PLEDGE_MAX_QUANTITY } from './staffDeliveryPledges';
import type { StaffDeliveryPledge, StaffDeliveryPledgeCommand, StaffDeliveryPledgeContext, StaffDeliveryPledgeDuration, StaffDeliveryPledgeMetric, StaffDeliveryPledgeState } from './staffDeliveryPledges';
import type { PostwarIndustryReport, PostwarStockpileKey } from './postwarIndustry';
import { getNation } from './campaign';
import { getStaffSeatTitle } from './staffOrganization';
import './StaffDeliveryPledgeBoard.css';

export interface StaffDeliveryPledgeBoardProps {
  state: StaffDeliveryPledgeState;
  context: StaffDeliveryPledgeContext;
  forecast?: PostwarIndustryReport | null;
  routedEquipmentKey?: PostwarStockpileKey;
  onCreate: (command: StaffDeliveryPledgeCommand) => boolean;
  initialOwner?: Pick<StaffDeliveryPledgeCommand, 'staffId' | 'personId'>;
  initialView?: 'records' | 'create';
  onOpenProduction?: () => void;
  onOpenLogistics?: () => void;
}

const metricLabels: Record<StaffDeliveryPledgeMetric, string> = { 'factory-completed': '공장 생산 완료', 'national-available': '국가 가용 새 편입' };
const statusLabels = { open: '진행 중', succeeded: '목표 충족', failed: '목표 미달', void: '검증 불가' };
const sourceLabels = { 'factory-completed': '실제 생산 완료', 'national-direct': '신규 국가 직납', 'shipment-arrival': '배송 도착' };
const quantity = (value: number | null) => value === null ? '전망 없음' : value.toLocaleString();

/** The meeting desk reads the same commitments; no parallel promise state or rewards. */
export function StaffDeliveryCheckIn({ state, context, onOpen }: { state: StaffDeliveryPledgeState; context: StaffDeliveryPledgeContext; onOpen: (owner: Pick<StaffDeliveryPledgeCommand, 'staffId' | 'personId'>) => void }) {
  const records = normalizeStaffDeliveryPledges(state, context).pledges.filter((pledge) => pledge.nationId === context.nationId && context.manageableDepartments.includes(pledge.department));
  const open = records.filter((pledge) => pledge.status === 'open').sort((a, b) => a.deadlineWeek - b.deadlineWeek);
  const visible = open.length ? open.slice(0, 3) : records.filter((pledge) => pledge.resolvedWeek !== undefined).sort((a, b) => (b.resolvedWeek ?? 0) - (a.resolvedWeek ?? 0)).slice(0, 2);
  if (!visible.length) return null;
  return <section className="staff-delivery-check-in" aria-label="회의 후 이행 확인"><header><ClipboardCheck size={19} /><div><h3>회의가 끝난 뒤에도, 약속은 남습니다.</h3><p>{open.length ? `진행 중 ${open.length}건 · 가장 가까운 검증부터 확인하세요.` : '최근 확정된 결과입니다. 현재 담당자의 새 성과로 재해석하지 않습니다.'}</p></div></header><div>{visible.map((pledge) => <button type="button" key={pledge.id} onClick={() => onOpen({ staffId: pledge.staffId, personId: pledge.personId })}><span><strong>{pledge.staffName}</strong><small>{pledge.lineName}</small></span><span><b>{quantity(getStaffDeliveryPledgeQuantity(pledge))} / {quantity(pledge.targetQuantity)}</b><small>{pledge.status === 'open' ? `제${pledge.deadlineWeek + 1}주 검증` : statusLabels[pledge.status]}</small></span><ArrowUpRight size={17} /></button>)}</div></section>;
}

function PledgeRecord({ pledge, week, currentNationId, onOpenProduction, onOpenLogistics }: { pledge: StaffDeliveryPledge; week: number; currentNationId: string; onOpenProduction?: () => void; onOpenLogistics?: () => void }) {
  const delivered = getStaffDeliveryPledgeQuantity(pledge);
  const waiting = pledge.status === 'open' && week >= pledge.deadlineWeek;
  return <article className={`staff-delivery-record ${pledge.status}`}>
    <header><span>{pledge.nationId === currentNationId ? '현재 국가 기록' : `${pledge.nationId} · 과거 국가 기록`}</span><strong>{waiting ? '기한 도착 · 주간 검증 기록 대기' : statusLabels[pledge.status]}</strong></header>
    <h4>{pledge.staffName} · {pledge.lineName}</h4>
    <p>{metricLabels[pledge.metric]} · 제{pledge.createdWeek + 2}주부터 제{pledge.deadlineWeek + 1}주까지</p>
    <div className="staff-delivery-record-progress"><strong>{quantity(delivered)} <small>/ 목표 {quantity(pledge.targetQuantity)}</small></strong><span>실제 영수증 {pledge.receipts.length}건</span></div>
    <progress value={Math.min(delivered, pledge.targetQuantity)} max={pledge.targetQuantity} aria-label={`${pledge.staffName}의 약속 수량 진행`} />
    {pledge.status === 'open' && delivered >= pledge.targetQuantity ? <p className="staff-delivery-note">수량은 충족했으나 기한의 동일 인물 검증이 남았습니다. 지금 성공으로 확정하지 않습니다.</p> : null}
    {pledge.resolution ? <p>{pledge.resolution}</p> : null}
    {pledge.nationId === currentNationId && pledge.status !== 'void' && (onOpenProduction || onOpenLogistics) ? <nav className="staff-delivery-next-actions" aria-label={`${pledge.staffName} 약속 관련 작업`}>
      {onOpenProduction ? <button type="button" onClick={onOpenProduction}><Factory size={16} />생산 배정 확인<ArrowUpRight size={15} /></button> : null}
      {pledge.metric === 'national-available' && onOpenLogistics ? <button type="button" onClick={onOpenLogistics}><PackageCheck size={16} />수송·도착 확인<ArrowUpRight size={15} /></button> : null}
    </nav> : null}
    <p className="staff-delivery-note">{pledge.metric === 'national-available' ? '기간 중 새 국가 편입량입니다. 이전 창고 생산의 실제 도착도 포함하며 특정 생산라인의 생산 묶음 출처를 증명하지 않습니다.' : '공장의 실제 완료량입니다. 집하창고에 남아 있거나 수송 중이면 국가에서 바로 사용할 수 있다는 뜻은 아닙니다.'}</p>
    <details><summary>약속과 실제 영수증 확인</summary><p className="staff-delivery-metadata">약속 ID: {pledge.id}<br />담당 인물 ID: {pledge.personId}<br />보직 ID: {pledge.staffId} · 생산라인 ID: {pledge.lineId}</p>
      {pledge.receipts.length ? <ul>{pledge.receipts.map((receipt) => <li key={receipt.id}><span>제{receipt.week + 1}주 · {sourceLabels[receipt.source]} · {quantity(receipt.quantity)}</span><small>영수증 ID: {receipt.id}</small></li>)}</ul> : <p>현재 집계된 실제 영수증이 없습니다. 계획량·창고 합계로 대신 채우지 않습니다.</p>}
    </details>
  </article>;
}

export function StaffDeliveryPledgeBoard({ state, context, forecast, routedEquipmentKey, onCreate, initialOwner, initialView, onOpenProduction, onOpenLogistics }: StaffDeliveryPledgeBoardProps) {
  const formId = useId();
  const eligibleStaff = context.staff.filter((member) => context.manageableDepartments.includes(member.department));
  const lines = getStaffDeliveryPledgeLines(context);
  const [owner, setOwner] = useState(() => initialOwner ?? ({ staffId: eligibleStaff[0]?.id ?? '', personId: eligibleStaff[0]?.personId ?? '' }));
  const [view, setView] = useState<'records' | 'create'>(() => initialView ?? (state.pledges.length ? 'records' : 'create'));
  const [focusedRecords, setFocusedRecords] = useState(Boolean(initialOwner));
  const [lineId, setLineId] = useState(() => lines[0]?.line.id ?? '');
  const [metric, setMetric] = useState<StaffDeliveryPledgeMetric>('factory-completed');
  const [target, setTarget] = useState('10');
  const [duration, setDuration] = useState<StaffDeliveryPledgeDuration>(4);
  const [message, setMessage] = useState('');
  const lastSubmission = useRef<string | null>(null);
  const selectedOwner = eligibleStaff.find((member) => member.id === owner.staffId && member.personId === owner.personId);
  const selectedLine = lines.find(({ line }) => line.id === lineId);
  const command: StaffDeliveryPledgeCommand = { id: `draft:${context.nationId}:${context.week}:${owner.personId}:${lineId}`, expectedWeek: context.week, ...owner, lineId, metric, targetQuantity: Number(target), durationWeeks: duration };
  const normalized = normalizeStaffDeliveryPledges(state, context);
  const availability = getStaffDeliveryPledgeAvailability(normalized, command, context);
  const preview = deriveStaffDeliveryPledgeForecast(command, context, forecast, routedEquipmentKey);
  const authorized = context.phase === 'nation' && context.industryMandate.tab === 'industry' && context.industryMandate.mode === 'direct';
  const originalRecords = normalized.pledges;
  const displayedRecords = focusedRecords && initialOwner ? originalRecords.filter((pledge) => pledge.staffId === initialOwner.staffId && pledge.personId === initialOwner.personId && pledge.nationId === context.nationId) : originalRecords;
  const focusedPerson = initialOwner ? context.staff.find((member) => member.id === initialOwner.staffId && member.personId === initialOwner.personId) : undefined;
  const openCount = originalRecords.filter((pledge) => pledge.status === 'open' && pledge.nationId === context.nationId).length;

  const submit = () => {
    const current = { ...command, id: `staff-delivery:${crypto.randomUUID()}` };
    const fingerprint = JSON.stringify([context.nationId, command.expectedWeek, owner, lineId, metric, target, duration]);
    if (lastSubmission.current === fingerprint) return;
    // This pure preflight does not apply its state; only the parent can commit the command.
    const checked = createStaffDeliveryPledge(state, current, context);
    if (!checked.applied) { setMessage(checked.reason); return; }
    lastSubmission.current = fingerprint;
    if (onCreate(current)) { setMessage('요청을 전달했습니다. 실제 저장된 약속 기록을 확인하세요.'); setView('records'); setFocusedRecords(false); }
    else { lastSubmission.current = null; setMessage('약속이 기록되지 않았습니다. 담당자·권한·주차·기존 약속을 확인하세요.'); }
  };

  return <section className="staff-delivery-pledges" aria-labelledby={`${formId}-title`}>
    <header className="staff-delivery-heading"><div><span className="staff-delivery-eyebrow">ACCOUNTABLE DELIVERY</span><h3 id={`${formId}-title`}>담당자와 수량을 정한 이행 약속</h3><p>누가, 무엇을, 언제까지 확인할지 정합니다. 이후 실제 영수증으로만 결과를 검증합니다.</p></div><span className="staff-delivery-open-count"><ClipboardCheck size={20} aria-hidden="true" /> 열린 약속 {openCount}개</span></header>
    <nav className="staff-delivery-view-switch" aria-label="이행 약속 작업공간"><button type="button" aria-pressed={view === 'records'} onClick={() => setView('records')}>이행 기록 <span>{originalRecords.length}</span></button><button type="button" aria-pressed={view === 'create'} onClick={() => setView('create')}>새 약속 작성</button></nav>
    {initialOwner ? <div className="staff-delivery-person-context"><UserRound size={18} /><span>{focusedPerson ? `${focusedPerson.name}의 참모 상세에서 열었습니다.` : '선택했던 담당자가 현재 보직에 없습니다. 후임에게 자동 연결하지 않습니다.'}</span>{view === 'records' ? <button type="button" onClick={() => setFocusedRecords((current) => !current)}>{focusedRecords ? '전체 이행 기록 보기' : '선택 인물 기록만 보기'}</button> : null}</div> : null}
    {view === 'create' ? <>
    <p className="staff-delivery-scope-note">기록 전용 기능 · 생성 비용 0 · 정치력·사기 보상과 벌점 0 · 생산·운송 명령이나 물량 예약이 아닙니다.</p>
    <form className="staff-delivery-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <div className="staff-delivery-inputs">
        <label htmlFor={`${formId}-owner`}><span><UserRound size={16} aria-hidden="true" /> 직접 관리하는 실제 담당자</span><select id={`${formId}-owner`} disabled={!authorized} value={selectedOwner ? owner.staffId : ''} onChange={(event) => { const member = eligibleStaff.find((person) => person.id === event.target.value); setOwner({ staffId: member?.id ?? '', personId: member?.personId ?? '' }); setMessage(''); }}><option value="">담당자를 선택하세요</option>{eligibleStaff.map((member) => <option key={member.id} value={member.id}>{member.name} · {getStaffSeatTitle(member.department, context.phase, getNation(context.nationId).status)}</option>)}</select><small>현재 보직의 관리 범위 안에서만 약속을 만들 수 있습니다.</small></label>
        <label htmlFor={`${formId}-line`}><span><Factory size={16} aria-hidden="true" /> 기존 생산라인 · 품목 기준</span><select id={`${formId}-line`} disabled={!authorized} value={selectedLine ? lineId : ''} onChange={(event) => { setLineId(event.target.value); setMessage(''); }}><option value="">생산라인을 선택하세요</option>{lines.map(({ line }) => <option key={line.id} value={line.id}>{line.name} · 배치 {line.assigned}</option>)}</select><small>같은 품목에 연결된 라인이 정확히 하나일 때만 선택합니다.</small></label>
        <label htmlFor={`${formId}-target`}><span>목표 수량 · 게임 장비 단위</span><input id={`${formId}-target`} type="number" min="1" max={STAFF_DELIVERY_PLEDGE_MAX_QUANTITY} step="1" inputMode="numeric" value={target} disabled={!authorized} onChange={(event) => { setTarget(event.target.value); setMessage(''); }} /></label>
        <label htmlFor={`${formId}-duration`}><span><CalendarClock size={16} aria-hidden="true" /> 검증 기간</span><select id={`${formId}-duration`} value={duration} disabled={!authorized} onChange={(event) => { setDuration(Number(event.target.value) as StaffDeliveryPledgeDuration); setMessage(''); }}>{staffDeliveryPledgeDurations.map((weeks) => <option key={weeks} value={weeks}>{weeks}주 · 제{context.week + weeks + 1}주 검증</option>)}</select></label>
      </div>
      <fieldset className="staff-delivery-metric"><legend>무엇을 확인할까요?</legend><div role="group" aria-label="약속의 수량 지표">{(['factory-completed', 'national-available'] as const).map((choice) => <button key={choice} type="button" disabled={!authorized} aria-pressed={metric === choice} onClick={() => { setMetric(choice); setMessage(''); }}>{choice === 'factory-completed' ? <Factory size={21} aria-hidden="true" /> : <PackageCheck size={21} aria-hidden="true" />}<strong>{metricLabels[choice]}</strong><span>{choice === 'factory-completed' ? '실제 공장 완료 영수증. 창고 보관·수송 중 물량도 생산 완료에는 포함됩니다.' : '신규 국가 직납 + 실제 배송 도착. 이전 창고 생산의 도착도 포함하며 미도착 창고 재고는 제외합니다.'}</span></button>)}</div></fieldset>
      <div className="staff-delivery-preview" aria-live="polite"><div><span>현재 조건의 다음 주 예상</span><strong>{quantity(metric === 'factory-completed' ? preview.factoryPerWeek : preview.nationalDirectPerWeek)}</strong><small>{metric === 'factory-completed' ? '공장 생산 완료 전망' : '국가 직납 전망 · 배송 도착 예측 제외'}</small></div><div><span>{duration}주 단순 환산 · 보장 아님</span><strong>{quantity(preview.simplePeriodTotal)}</strong><small>목표 {target || '미입력'}과 비교해 검토하세요.</small></div><p>{preview.explanation}</p></div>
      <p className="staff-delivery-note">약속은 생성 주의 다음 주부터 기한 주까지의 실제 영수증만 셉니다. 담당자·보직·국가가 바뀌면 자동 양도하지 않고 검증 불가로 종료합니다. 같은 담당자나 라인에 열린 약속을 중복해 만들 수 없습니다.</p>
      {metric === 'national-available' ? <p className="staff-delivery-note">국가 가용 목표에서 생산라인은 품목 식별용입니다. 도착 장비가 그 라인의 특정 생산 묶음에서 나왔다는 출처를 증명하지 않습니다.</p> : null}
      {availability.reason ? <p className="staff-delivery-blocked">{availability.reason}</p> : null}
      <footer className="staff-delivery-form-footer"><button type="submit" disabled={!availability.allowed}>이 조건으로 약속 기록</button><span>이 화면에는 상신·권한 위임 기능이 없습니다.</span></footer>
    </form>
    </> : null}
    <p className="staff-delivery-message" role="status" aria-live="polite">{message || '열람·입력·예측은 원래 게임 상태를 바꾸지 않습니다.'}</p>
    {normalized.diagnostics.length ? <div className="staff-delivery-blocked">{normalized.diagnostics.map((note, index) => <p key={`${index}:${note}`}>{note}</p>)}</div> : null}
    {view === 'records' ? <section className="staff-delivery-records" aria-label="실제 저장된 약속과 검증 기록"><h4>약속과 검증 기록</h4><p className="staff-delivery-note">현재 인물·국가·주차와 맞지 않는 기록은 검증 불가로 표시합니다. 열람만으로 게임 상태를 변경하지 않습니다.</p>{displayedRecords.length ? displayedRecords.map((pledge) => <PledgeRecord key={pledge.id} pledge={pledge} week={context.week} currentNationId={context.nationId} onOpenProduction={onOpenProduction} onOpenLogistics={onOpenLogistics} />) : <div className="staff-delivery-empty"><p>{focusedRecords ? '선택 인물의 저장된 약속이 없습니다.' : '아직 저장된 약속이 없습니다.'} 기록이 생긴 뒤 실제 생산·입고·도착 영수증을 모읍니다.</p><button type="button" onClick={() => setView('create')}>첫 이행 약속 작성</button></div>}</section> : null}
  </section>;
}
