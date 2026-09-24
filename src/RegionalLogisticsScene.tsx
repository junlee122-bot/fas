import { useId, useState } from 'react';
import { ArrowRight, ClipboardList, PackageCheck, Truck, Warehouse } from 'lucide-react';
import type { RegionalIndustryContext, RegionalIndustryState } from './regionalIndustry';
import { buildRegionalLogisticsPresentation, resolveRegionalLogisticsSelection, type RegionalLogisticsSelection } from './regionalLogisticsPresentation';
import './RegionalLogisticsScene.css';

export type RegionalLogisticsView = 'overview' | 'configure' | 'dispatch' | 'records';
export interface RegionalLogisticsSceneProps {
  state: RegionalIndustryState;
  context: RegionalIndustryContext;
  onOpen: (view: RegionalLogisticsView, shipmentId?: string) => void;
  showTotals?: boolean;
}
const statusLabels = { reserved: '출발 예약', 'in-transit': '운송 중', delivered: '도착 확정', cancelled: '예약 취소' };
const stages = [
  { label: '출발 예약', detail: '창고에서 물량 확보', Icon: Warehouse },
  { label: '수송 중', detail: '아직 국가 가용 아님', Icon: Truck },
  { label: '도착 확정', detail: '국가 비축 편입 완료', Icon: PackageCheck },
];

/** A settlement-stage diagram, never a vehicle's interpolated geographic position. */
export function RegionalLogisticsScene({ state, context, onOpen, showTotals = true }: RegionalLogisticsSceneProps) {
  const model = buildRegionalLogisticsPresentation(state, context);
  const [selection, setSelection] = useState<RegionalLogisticsSelection | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'held' | 'delivered'>('all');
  const id = useId();
  const rows = model.rows.filter((row) => filter === 'all' || (filter === 'held' ? Boolean(row.holdReason) : filter === 'delivered' ? row.status === 'delivered' : row.status === 'reserved' || row.status === 'in-transit'));
  const selected = resolveRegionalLogisticsSelection({ ...model, rows }, selection);
  const active = model.rows.filter((row) => row.status === 'reserved' || row.status === 'in-transit').length;
  const held = model.rows.filter((row) => Boolean(row.holdReason)).length;
  return <section className="logistics-scene" aria-labelledby={`${id}-title`}>
    <div className="logistics-scene-heading"><div><span>DISPATCH CONTROL / 제{context.week + 1}주</span><h3 id={`${id}-title`}>수송 관제판</h3><p>어디에 묶였고, 무엇이 도착했는지 확인합니다.</p></div><div className="logistics-scene-counts">{model.quarantined ? <span>자료 확인 필요</span> : <><span>진행 <strong>{active}건</strong></span><span data-warning={held > 0}>보류·재확인 <strong>{held}건</strong></span></>}</div></div>
    {model.quarantined ? <p className="logistics-scene-notice" role="status">저장 검증이 필요한 물류 기록입니다. 물량과 이동을 추정하지 않습니다. 원본 저장을 내보내 복구하기 전에는 집행할 수 없습니다.</p> : <>
      {!context.authorized && <p className="logistics-scene-notice">현재는 물류 보고 열람입니다. 이 화면은 직접 집행권을 부여하지 않으며, 조치는 기존 권한·상신 창구에서 확인합니다.</p>}
      {showTotals && model.totals.length > 0 && <div className="logistics-scene-totals" aria-label="품목별 물류 현황"><table><caption>창고·미도착 물자는 국가 즉시 사용 가능 비축과 별도입니다.</caption><thead><tr><th scope="col">품목</th><th scope="col">창고</th><th scope="col">예약</th><th scope="col">운송 중</th><th scope="col">이번 주 도착</th></tr></thead><tbody>{model.totals.map((total) => <tr key={total.equipmentKey}><th scope="row">{total.equipmentLabel}</th><td>{total.warehouse.toLocaleString()}개</td><td>{total.reserved.toLocaleString()}개</td><td>{total.inTransit.toLocaleString()}개</td><td>{total.deliveredThisWeek.toLocaleString()}개</td></tr>)}</tbody></table></div>}
      {model.rows.length > 0 ? <>
        <nav className="logistics-scene-filters" aria-label="관제판 운송 필터">{([['all', '전체'], ['active', '진행 중'], ['held', '보류·재확인'], ['delivered', '도착 기록']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</nav>
        <div className="logistics-scene-layout">
          <div className="logistics-scene-ledger" aria-label="운송 선택">{rows.length ? rows.map((row, index) => <button key={row.id} type="button" aria-pressed={selected?.id === row.id} aria-controls={`${id}-detail`} onClick={() => setSelection({ nationKey: model.nationKey, shipmentId: row.id })}><span><small>제{row.reservedWeek + 1}주 예약 · 기록 {index + 1}</small><strong>{row.equipmentLabel} {row.quantity.toLocaleString()}개</strong><span>{row.originName} → {row.destinationName}</span></span><em data-warning={Boolean(row.holdReason)}>{row.holdReason ? '보류·재확인' : statusLabels[row.status]}</em></button>) : <p>해당 상태의 운송이 없습니다. 필터는 운송을 변경하지 않습니다.</p>}</div>
          <section className="logistics-scene-detail" id={`${id}-detail`} aria-label="선택 운송 진행 단계">
            {selected ? <>
              <div className="logistics-scene-cargo"><span>실제 운송 기록</span><h4>{selected.equipmentLabel} {selected.quantity.toLocaleString()}개</h4><strong>{selected.originName} → {selected.destinationName}</strong></div>
              <ol className={`logistics-stage-track${selected.holdReason ? ' is-held' : ''}${selected.status === 'cancelled' ? ' is-cancelled' : ''}`} aria-label="주간 결산에 따른 진행 단계">{stages.map(({ label, detail, Icon }, index) => <li key={label} className={selected.stageIndex !== null && selected.stageIndex >= index ? 'is-reached' : ''} aria-current={selected.stageIndex === index ? 'step' : undefined}><div><Icon size={28} aria-hidden="true" /></div><strong>{label}</strong><small>{detail}</small></li>)}</ol>
              <p className="logistics-scene-status" role="status">{selected.summary}</p>
              {selected.holdReason && <p className="logistics-scene-hold"><strong>보류·재확인 사유</strong>{selected.holdReason}</p>}
              {selected.recordedHoldReason && <p className="logistics-scene-estimate">지난 결산 보류 기록: {selected.recordedHoldReason}{!selected.holdReason ? ' 현재 조건은 회복됐지만 재개 여부는 다음 결산에서 확정됩니다.' : ''}</p>}
              {selected.earliestArrivalSteps !== null && <p className="logistics-scene-estimate">{selected.status === 'reserved' ? '경로·출발 용량' : '경로'} 조건이 유지되면 도착까지 최소 {selected.earliestArrivalSteps}회 주간 결산. 달력상의 확정 도착 약속은 아닙니다.</p>}
              <div className="logistics-scene-actions"><button type="button" onClick={() => onOpen('records', selected.id)}><ClipboardList size={16} />이 운송 기록 열기</button>{selected.nextAction !== 'records' && (selected.status === 'reserved' || selected.status === 'in-transit') ? <button type="button" onClick={() => onOpen(selected.nextAction, selected.id)}>{context.authorized ? selected.nextAction === 'configure' ? '노선·출발 조건 검토' : '예약·병목 검토' : '권한·상신 확인'}<ArrowRight size={16} /></button> : null}</div>
            </> : <p>운송을 선택하면 실제 기록의 출발·도착지와 결산 단계를 확인할 수 있습니다.</p>}
          </section>
        </div>
      </> : <div className="logistics-scene-empty"><Warehouse size={36} aria-hidden="true" /><h4>아직 지역 수송 기록이 없습니다</h4><p>노선을 승인하고 새 생산품을 집하한 뒤 출발을 예약합니다. 기존 국가 비축을 자동으로 트럭에 싣거나 가상의 수송을 만들지 않습니다.</p><button type="button" onClick={() => onOpen('configure')}>{context.authorized ? '집하 노선 검토하기' : '물류 권한·보고 확인'}<ArrowRight size={16} /></button></div>}
    </>}
    <p className="logistics-scene-basis">선은 출발·운송·도착의 결산 단계도입니다. 실제 도로·철도 경로나 차량의 현재 위치가 아닙니다. 화면을 보거나 운송을 선택하는 동안 게임 시간과 물량은 변하지 않습니다.</p>
  </section>;
}
