import { useId, useRef, useState } from 'react';
import { Anchor, ArrowRight, CheckCheck, FileText, LifeBuoy, MapPin, Ship, ShieldCheck } from 'lucide-react';
import type { SeaTransportContext, SeaTransportState } from './seaTransport';
import { buildSeaTransportPresentation, resolveSeaTransportSelection, type SeaTransportPresentationRow } from './seaTransportPresentation';
import './SeaTransportScene.css';

export interface SeaTransportSceneRequest {
  workspace: 'plan' | 'active' | 'history';
  operationId?: string;
  recordId?: string;
}
export interface SeaTransportSceneProps {
  state: SeaTransportState;
  context: SeaTransportContext;
  onOpen: (request: SeaTransportSceneRequest) => void;
  onOpenLocation: (id: string) => void;
}
type Filter = 'active' | 'attention' | 'history';
const filters: { id: Filter; label: string }[] = [
  { id: 'active', label: '진행 중' }, { id: 'attention', label: '확인 필요' }, { id: 'history', label: '확정 결과' },
];

function openRequest(row: SeaTransportPresentationRow): SeaTransportSceneRequest {
  return row.kind === 'record' ? { workspace: 'history', recordId: row.id } : { workspace: 'active', operationId: row.operationId };
}

/** A read-only window onto weekly engine snapshots, never a second transport simulation. */
export function SeaTransportScene({ state, context, onOpen, onOpenLocation }: SeaTransportSceneProps) {
  const id = useId();
  const detailRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [selection, setSelection] = useState<{ nationId: typeof context.nationId; id: string } | null>(null);
  const model = buildSeaTransportPresentation(state, context);
  const rows = filter === 'history' ? model.records : filter === 'attention' ? model.operations.filter(row => row.attention) : model.operations;
  const selected = resolveSeaTransportSelection({ ...model, operations: filter === 'history' ? [] : rows, records: filter === 'history' ? rows : [] }, selection, context.nationId);
  const completedSelection = selection?.nationId === context.nationId ? model.records.find(row => row.operationId === selection.id) : undefined;
  const select = (row: SeaTransportPresentationRow) => {
    setSelection({ nationId: context.nationId, id: row.id });
    detailRef.current?.focus();
  };
  const attentionCount = model.operations.filter(row => row.attention).length;
  return <section className="sea-scene" aria-labelledby={`${id}-title`}>
    <header className="sea-scene-heading"><div><span className="sea-scene-eyebrow">SEA LIFT / 제{context.week + 1}주 관제 기록</span><h2 id={`${id}-title`}>해상 수송 관제판</h2><p>어디까지 왔는지 확인하고, 필요한 작전만 열어 지휘하세요.</p></div><button type="button" onClick={() => onOpen({ workspace: 'plan' })}>수송 계획·권한 확인<ArrowRight size={17} /></button></header>
    {model.unavailableReason ? <div className="sea-scene-dispatch has-attention" role="status"><strong>관제 자료 확인 필요</strong><p>{model.unavailableReason}</p></div> : <div className="sea-scene-summary" aria-label="해상 수송 요약">
      <div><Ship aria-hidden="true" /><span>진행 중<strong>{model.operations.length}건</strong></span></div>
      <div className={attentionCount ? 'has-attention' : ''}><LifeBuoy aria-hidden="true" /><span>확인 필요<strong>{attentionCount}건</strong></span></div>
      <div><FileText aria-hidden="true" /><span>보관된 확정 결과<strong>{model.records.length}건</strong></span></div>
    </div>}
    <p className="sea-scene-note">열람·선택만으로 명령이나 비용이 발생하지 않습니다. 아래는 주간 결산 단계도이며 실시간 함선 위치나 정밀 해도가 아닙니다.</p>
    <nav className="sea-scene-filters" aria-label="해상 수송 기록 필터">{filters.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setSelection(null); }}>{item.label}</button>)}</nav>
    <div className="sea-scene-layout">
      <div className="sea-scene-ledger" role="group" aria-label="수송 현장 선택">
        {rows.length ? rows.map(row => <button key={row.id} type="button" aria-pressed={selected?.id === row.id} aria-controls={`${id}-detail`} onClick={() => select(row)}>
          <span className="sea-scene-row-heading">{row.kind === 'record' ? <CheckCheck size={18} aria-hidden="true" /> : row.attention ? <LifeBuoy size={18} aria-hidden="true" /> : <Ship size={18} aria-hidden="true" />}<strong>{row.divisionName}</strong><span>{row.stageLabel}</span></span>
          <span>{row.from.name} → {row.target.name}</span><small>{row.locationLabel} · {row.location?.name ?? '위치 자료 확인 필요'}</small>
          {row.attentionReason ? <small className="sea-scene-alert-text">{row.attentionReason}</small> : null}
        </button>) : <div className="sea-scene-empty"><Anchor size={32} aria-hidden="true" /><h3>{filter === 'history' ? '아직 확정 결과가 없습니다' : filter === 'attention' ? '별도 확인이 필요한 수송이 없습니다' : '진행 중인 해상 수송이 없습니다'}</h3><p>{filter === 'active' ? '부대와 출발항·목적지를 정하고 기존 작전 본부에서 검토·승인하면 여기에 나타납니다.' : '기록은 실제 주간 결산 결과가 있을 때만 표시됩니다.'}</p></div>}
      </div>
      <article id={`${id}-detail`} ref={detailRef} tabIndex={-1} className="sea-scene-detail" aria-label="선택한 해상 수송 현황">
        {selected ? <>
          <header><span className="sea-scene-eyebrow">{selected.kind === 'record' ? '확정 보고 / ' : '현재 단계 / '}{selected.stageLabel}</span><h3>{selected.divisionName}</h3><p>{selected.statusText}</p></header>
          <ol className="sea-scene-steps" aria-label="실제 수송 단계">{selected.steps.map(step => <li key={step.id} data-status={step.status} aria-current={step.status === 'current' ? 'step' : undefined}><span className="sea-scene-step-marker" aria-hidden="true">{step.status === 'complete' ? <CheckCheck size={18} /> : step.status === 'current' ? <Ship size={18} /> : <Anchor size={16} />}</span><strong>{step.label}</strong><small>{step.detail}</small></li>)}</ol>
          <div className={`sea-scene-dispatch${selected.attention ? ' has-attention' : ''}`}><strong>{selected.attention ? '지금 확인할 내용' : selected.kind === 'record' ? '확정된 결과' : '최근 작전 보고'}</strong><p>{selected.lastMessage}</p>{selected.attentionReason && selected.attentionReason !== selected.lastMessage ? <p>{selected.attentionReason}</p> : null}</div>
          {selected.kind === 'operation' && selected.arrival ? <p className="sea-scene-note">이번 귀환 목적지: <strong>{selected.arrival.name}</strong> · 처음 계획한 {selected.target.name} 상륙과 별개입니다. 아직 도착한 것은 아닙니다.</p> : null}
          <dl className="sea-scene-facts"><div><dt>{selected.locationLabel}</dt><dd>{selected.location?.name ?? '자료 확인 필요'}</dd></div><div><dt>{selected.kind === 'record' ? '수송선 반환 / 투입' : '잔존 수송선 / 누적 투입'}</dt><dd>{selected.convoysRemaining} / {selected.convoysReserved}척</dd><small>손실 {selected.convoysLost}척 · 호위 함정과 별도</small></div><div><dt>{selected.kind === 'record' ? '결과 확정' : '현 단계 기본 일정'}</dt><dd>{selected.kind === 'record' ? `제${selected.week + 1}주` : selected.remainingWeeks === null ? '일정 확정 불가' : `최소 ${selected.remainingWeeks}회 결산`}</dd><small>{selected.kind === 'record' ? '계획 목적지와 실제 도착지는 다를 수 있습니다.' : '다음 단계까지의 조건부 최소치 · 전체 도착 보장 아님'}</small></div></dl>
          <section className="sea-scene-escort" aria-label="수송과 호위의 별도 진행"><h4><ShieldCheck size={18} aria-hidden="true" />호위·구조 진행</h4><p>{selected.supportSummary}</p>{selected.escorts.length ? <ul>{selected.escorts.map(fleet => <li key={fleet.id}><strong>{fleet.name}<span>{fleet.label}</span></strong><p>{fleet.position}{fleet.destination ? ` → ${fleet.destination}` : ''}</p><small>{fleet.detail}</small></li>)}</ul> : null}<small>부대 수송 완료와 호위 함대의 귀항·급유 완료는 별개입니다. 함대 정보는 현재 편제 기록입니다.</small></section>
          <div className="sea-scene-actions"><button type="button" onClick={() => onOpen(openRequest(selected))}>{selected.kind === 'record' ? '이 수송의 확정 보고서' : selected.canCommand ? selected.nextActionLabel : '이 수송의 보고·권한 확인'}<ArrowRight size={17} /></button>{selected.location && context.territories.some(site => site.id === selected.location!.id) ? <button type="button" onClick={() => onOpenLocation(selected.location!.id)}><MapPin size={17} />{selected.kind === 'record' ? '실제 도착지 지도' : '현재 구역 지도'}</button> : null}{selected.kind === 'operation' && selected.arrival && context.territories.some(site => site.id === selected.arrival!.id) ? <button type="button" onClick={() => onOpenLocation(selected.arrival!.id)}><Anchor size={17} />귀환 목적지 지도</button> : null}</div>
          {!selected.canCommand && selected.kind === 'operation' ? <p className="sea-scene-note">현재 직접 명령할 수 없는 수송입니다. 열람은 가능하며, 집행은 기존 보직·주간 결산 권한 검사를 따릅니다.</p> : null}
        </> : <div className="sea-scene-empty"><Ship size={32} aria-hidden="true" /><h3>{selection ? '선택한 수송의 상태가 달라졌습니다' : '수송을 선택하면 진행 경로가 펼쳐집니다'}</h3><p>{selection ? '다른 작전을 자동으로 대신 선택하지 않습니다. 목록에서 다시 고르거나 해당 수송의 확정 결과를 확인하세요.' : '승선부터 귀환까지 실제 기록을 보여줍니다. 아직 발생하지 않은 결과는 만들지 않습니다.'}</p>{completedSelection ? <button type="button" onClick={() => { setFilter('history'); setSelection({ nationId: context.nationId, id: completedSelection.id }); }}>방금 종료된 수송 결과 보기<ArrowRight size={17} /></button> : null}</div>}
      </article>
    </div>
  </section>;
}
