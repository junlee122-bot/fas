import { useId, useState } from 'react';
import {
  deriveRegionalAutomaticReservation, deriveRegionalCapacity, deriveRegionalOwnedStockpile, getRegionalDispatchConfiguration, getRegionalEligibleTerritories,
  getRegionalIndustryAccount, getRegionalRouteProblem, hasRegionalPendingMaterials,
  regionalCargoPerItem, regionalEquipmentLabels, REGIONAL_TRANSPORT_WEEKS,
} from './regionalIndustry';
import type { RegionalIndustryConfiguration, RegionalIndustryContext, RegionalIndustryState, RegionalShipment } from './regionalIndustry';
import type { Stockpile } from './types';
import type { PostwarStockpileKey } from './postwarIndustry';
import './RegionalIndustryBoard.css';

export interface RegionalIndustryBoardProps {
  state: RegionalIndustryState;
  context: RegionalIndustryContext;
  nationalStockpile: Stockpile;
  onConfigure: (configuration: RegionalIndustryConfiguration) => boolean;
  onPlanShipment: (quantity: number) => boolean;
  onCancelReserved: (shipmentId: string) => boolean;
}

export interface RegionalIndustryDraft { basis: string; configuration: RegionalIndustryConfiguration }
export function getRegionalIndustryDraftBasis(state: RegionalIndustryState, context: RegionalIndustryContext) {
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  return JSON.stringify([context.nationId, context.week, context.authorized, context.factories, account.configuration,
    hasRegionalPendingMaterials(account), Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId),
    getRegionalEligibleTerritories(context).map((territory) => [territory.id, territory.neighbors])]);
}
export function resolveRegionalIndustryDraft(draft: RegionalIndustryDraft | null, basis: string, approved: RegionalIndustryConfiguration) {
  return { proposal: draft?.basis === basis ? draft.configuration : approved, stale: draft !== null && draft.basis !== basis };
}
const recordLabels = { reserved: '출발 예약', 'in-transit': '운송 중', delivered: '도착 완료', cancelled: '예약 취소됨' };
export function getRegionalShipmentRecordLabels(shipments: readonly RegionalShipment[], territories: RegionalIndustryContext['territories']) {
  const labels = shipments.map((shipment) => `제${shipment.reservedWeek + 1}주 · ${regionalEquipmentLabels[shipment.equipmentKey]} ${shipment.quantity.toLocaleString()}개 · ${recordLabels[shipment.status]}${shipment.heldReason ? ' · 보류' : ''} · ${territories.find((territory) => territory.id === shipment.destinationTerritoryId)?.name ?? '도착지 미상'}`);
  const counts = new Map<string, number>();
  labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
  return new Map(shipments.map((shipment, index) => [shipment.id, `${labels[index]}${(counts.get(labels[index]) ?? 0) > 1 ? ` · 기록 ${index + 1}` : ''}`]));
}

export function RegionalIndustryBoard({ state, context, nationalStockpile, onConfigure, onPlanShipment, onCancelReserved }: RegionalIndustryBoardProps) {
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  const [draft, setDraft] = useState<RegionalIndustryDraft | null>(null);
  const [quantityDraft, setQuantityDraft] = useState<{ basis: string; value: string } | null>(null);
  const [view, setView] = useState<'overview' | 'configure' | 'dispatch' | 'records'>('overview');
  const [recordFilter, setRecordFilter] = useState<'all' | 'reserved' | 'in-transit' | 'delivered' | 'cancelled'>('all');
  const [selectedRecord, setSelectedRecord] = useState<{ nationId: string; id: string } | null>(null);
  const [rejection, setRejection] = useState<{ basis: string; message: string } | null>(null);
  const panelId = useId();
  const approved = account.configuration;
  const basis = getRegionalIndustryDraftBasis(state, context);
  const { proposal, stale } = resolveRegionalIndustryDraft(draft, basis, approved);
  const currentDraft = draft !== null && !stale;
  const quantityBasis = JSON.stringify([basis, account.warehouse, account.shipments.map((shipment) => [shipment.id, shipment.status, shipment.quantity])]);
  const quantity = quantityDraft?.basis === quantityBasis ? quantityDraft.value : '1';
  const dispatch = getRegionalDispatchConfiguration(approved);
  const proposedDispatch = getRegionalDispatchConfiguration(proposal);
  const eligible = getRegionalEligibleTerritories(context);
  const hasMaterials = hasRegionalPendingMaterials(account);
  const quarantined = Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId);
  const canManage = context.authorized && !quarantined;
  const capacity = deriveRegionalCapacity(state, context);
  const automaticPreview = deriveRegionalAutomaticReservation(state, context);
  const total = deriveRegionalOwnedStockpile(state, context.nationId, nationalStockpile);
  const activeShipments = account.shipments.filter((shipment) => shipment.status === 'reserved' || shipment.status === 'in-transit');
  const routeProblem = approved.mode === 'pilot' ? getRegionalRouteProblem(approved, context) : null;
  const update = (change: Partial<RegionalIndustryConfiguration>) => { setDraft({ basis, configuration: { ...proposal, ...change } }); setRejection(null); };
  const origin = context.territories.find((territory) => territory.id === approved.originTerritoryId);
  const destination = context.territories.find((territory) => territory.id === approved.destinationTerritoryId);
  const pointsValid = origin && destination && [origin.x, origin.y, destination.x, destination.y].every(Number.isFinite);
  const margin = 25;
  const viewBox = pointsValid ? `${Math.min(origin.x, destination.x) - margin} ${Math.min(origin.y, destination.y) - margin} ${Math.max(60, Math.abs(origin.x - destination.x) + margin * 2)} ${Math.max(60, Math.abs(origin.y - destination.y) + margin * 2)}` : '0 0 100 100';
  const selectedKey = approved.equipmentKey;
  const warehouseQuantity = account.warehouse[selectedKey];
  const cargoPerItem = regionalCargoPerItem[selectedKey];
  const reservedCargo = activeShipments.filter((shipment) => shipment.status === 'reserved')
    .reduce((sum, shipment) => sum + shipment.quantity * regionalCargoPerItem[shipment.equipmentKey], 0);
  const oversizedReservation = activeShipments.some((shipment) => shipment.status === 'reserved' && shipment.quantity * regionalCargoPerItem[shipment.equipmentKey] > capacity.cargoPerWeek);
  const itemsPerWeek = Math.floor(capacity.cargoPerWeek / cargoPerItem);
  const canDispatch = canManage && !routeProblem && !oversizedReservation && itemsPerWeek > 0;
  const reservableNow = canDispatch ? Math.min(warehouseQuantity, Math.max(0, Math.floor((capacity.cargoPerWeek - reservedCargo) / cargoPerItem))) : 0;
  // Lower bound only: current reserved cargo precedes warehouse cargo, new intake
  // is stopped, and the player submits full-capacity reservations every week.
  const minimumDepartureWeeks = canDispatch && warehouseQuantity > 0
    ? Math.ceil((warehouseQuantity + reservedCargo / cargoPerItem) / itemsPerWeek) : null;
  const finalTransitWeeks = REGIONAL_TRANSPORT_WEEKS - 1;
  const receipt = account.lastDelivery?.nationId === context.nationId && account.lastDelivery.week <= context.week ? account.lastDelivery : null;
  const reservedQuantity = activeShipments.filter((shipment) => shipment.status === 'reserved' && shipment.equipmentKey === selectedKey).reduce((sum, shipment) => sum + shipment.quantity, 0);
  const transitQuantity = activeShipments.filter((shipment) => shipment.status === 'in-transit' && shipment.equipmentKey === selectedKey).reduce((sum, shipment) => sum + shipment.quantity, 0);
  const records = account.shipments.filter((shipment) => recordFilter === 'all' || shipment.status === recordFilter);
  const selectedShipment = records.find((shipment) => selectedRecord?.nationId === context.nationId && shipment.id === selectedRecord.id) ?? records[0] ?? null;
  const shipmentLabels = getRegionalShipmentRecordLabels(account.shipments, context.territories);
  const selectedShipmentLabel = selectedShipment ? shipmentLabels.get(selectedShipment.id) : undefined;
  const configure = (configuration: RegionalIndustryConfiguration) => {
    if (onConfigure(configuration)) { setDraft(null); setRejection(null); }
    else setRejection({ basis, message: '설정이 승인되지 않았습니다. 기존 설정을 유지하며 현재 권한·노선·재고를 다시 확인하십시오.' });
  };
  return <section className="regional-industry" aria-label="지역 집하·수송 시범">
    <header><div><span>REGIONAL LOGISTICS</span><h3>지역 물류</h3></div><strong className="regional-status">{approved.mode === 'national' ? '국가 비축 모드' : approved.acceptNewReceipts === false ? '신규 집하 중지 · 잔여 배송' : '지역 집하 시범 가동'}</strong></header>
    <nav className="regional-workspace-tabs" aria-label="지역 물류 보기">{([['overview', '현재 흐름'], ['configure', '노선·자동 지시'], ['dispatch', '창고·출발 예약'], ['records', '운송·도착 기록']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} aria-controls={`${panelId}-${id}`} onClick={() => setView(id)}>{label}</button>)}</nav>
    {quarantined ? <div className="regional-warning" role="alert">지역 재고 저장 검증에 실패했습니다. 원본은 격리 보존하며 수량을 추정하지 않습니다. 저장을 내보내 복구하기 전까지 지역 명령·운송은 중지하고 새 납품은 국가 비축으로 보냅니다.</div> : null}
    {stale && <p className="regional-warning" role="status">주차·국가·권한·노선 또는 재고 상태가 바뀌어 이전 설정 초안은 적용하지 않습니다. 현재 승인값으로 다시 검토하십시오.</p>}
    {rejection?.basis === basis && <p className="regional-warning" role="status">{rejection.message}</p>}
    {!context.authorized ? <p className="regional-warning">지역 산업 직접 집행권이 없어 열람만 가능합니다. 자동 예약은 보류되며 기존 자동 지시의 중지는 가능합니다.</p> : null}
    <div id={`${panelId}-overview`} className="regional-overview" hidden={view !== 'overview'}>
      <div className="regional-approved-route"><span>현재 승인된 노선 · {regionalEquipmentLabels[selectedKey]}</span><strong>{approved.mode === 'pilot' ? `${origin?.name ?? approved.originTerritoryId} → ${destination?.name ?? approved.destinationTerritoryId}` : '지역 집하 미승인 · 국가 직접 입고'}</strong><small>설정은 이 국가의 한 노선·한 품목입니다. 물량 단계를 선택해 확인하십시오.</small></div>
      {approved.mode === 'pilot' && !quarantined && <div className="regional-flow-stages" aria-label="승인된 품목의 현재 물류 단계"><button type="button" onClick={() => setView('dispatch')}><small>01 · 출발 창고</small><strong>{warehouseQuantity.toLocaleString()}개</strong><span>미예약 · 국가 가용 아님</span></button><button type="button" onClick={() => { setRecordFilter('reserved'); setView('records'); }}><small>02 · 출발 예약</small><strong>{reservedQuantity.toLocaleString()}개</strong><span>예약 상태 · 국가 가용 아님</span></button><button type="button" onClick={() => { setRecordFilter('in-transit'); setView('records'); }}><small>03 · 수송 중</small><strong>{transitQuantity.toLocaleString()}개</strong><span>미도착 · 국가 가용 아님</span></button><button type="button" onClick={() => { setRecordFilter('delivered'); setView('records'); }}><small>04 · 최근 도착 영수증</small><strong>{receipt?.equipmentKey === selectedKey ? `${receipt.quantity.toLocaleString()}개` : '기록 없음'}</strong><span>{receipt?.equipmentKey === selectedKey ? `제${receipt.week + 1}주 확정 도착 · 누계 아님` : '현재 품목의 최근 영수증 없음'}</span></button></div>}
      <div className="regional-next-step"><strong>{routeProblem ? '경로 보류' : oversizedReservation ? '출발 예약이 용량을 초과합니다' : approved.mode !== 'pilot' ? '국가 직접 입고 경로 사용 중' : `이번 주 예약 가능 ${reservableNow.toLocaleString()}개`}</strong><p>{routeProblem ?? (oversizedReservation ? '해당 예약을 취소한 뒤 현재 용량에 맞춰 나누어 예약하십시오.' : approved.mode !== 'pilot' ? '지역 수송은 명시적으로 노선을 승인한 뒤 시작합니다.' : automaticPreview.reason)}</p><button type="button" onClick={() => setView(approved.mode === 'pilot' ? 'dispatch' : 'configure')}>{approved.mode === 'pilot' ? '창고 병목·예약 확인' : '집하 노선 검토'}</button></div>
      <p>기존 국가 비축은 계속 즉시 사용 가능합니다. 시범을 승인하면 선택 품목의 새 전후 납품만 출발 창고에 모으며, 실제 도착 후 국가 가용 비축에 편입합니다.</p>
      <p className="regional-basis">보기·필터·변경안 입력만으로는 운송을 예약하지 않습니다. 선택한 단계는 진행 애니메이션이나 자동 성공 판정이 아닙니다.</p>
    </div>
    <div id={`${panelId}-configure`} className="regional-configuration-view" hidden={view !== 'configure'}>
    <form className="regional-config" onSubmit={(event) => { event.preventDefault(); if (canManage && currentDraft) configure(proposal); }}>
      <div className="regional-section-heading"><span>01 / ROUTE</span><h4>집하 거점과 출발 지시</h4><p>변경안을 작성한 뒤 한 번에 결재합니다. 입력만으로는 실행되지 않습니다.</p></div>
      <fieldset disabled={!canManage || hasMaterials}><legend>플레이어 지정 집하 거점 · 결재 전 설정</legend>
        <label>운영 모드<select value={proposal.mode} onChange={(event) => update({ mode: event.target.value as 'national' | 'pilot', allocatedFactories: proposal.allocatedFactories || 1 })}><option value="national">국가 비축 유지</option><option value="pilot">지역 집하 시범</option></select></label>
        <label>출발 집하 창고<select value={proposal.originTerritoryId} onChange={(event) => update({ originTerritoryId: event.target.value, destinationTerritoryId: '' })}><option value="">직접 소유 지역 선택</option>{proposal.originTerritoryId && !eligible.some((territory) => territory.id === proposal.originTerritoryId) && <option value={proposal.originTerritoryId} disabled>기존 출발지 · 현재 선택 불가</option>}{eligible.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}</select></label>
        <label>도착 물류 거점<select value={proposal.destinationTerritoryId} onChange={(event) => update({ destinationTerritoryId: event.target.value })}><option value="">인접 지역 선택</option>{proposal.destinationTerritoryId && getRegionalRouteProblem(proposal, context) && <option value={proposal.destinationTerritoryId} disabled>기존 도착지 · 현재 연결 불가</option>}{eligible.filter((territory) => !getRegionalRouteProblem({ ...proposal, destinationTerritoryId: territory.id }, context)).map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}</select></label>
        <label>집하할 새 납품 품목<select value={proposal.equipmentKey} onChange={(event) => update({ equipmentKey: event.target.value as PostwarStockpileKey })}>{(Object.keys(regionalEquipmentLabels) as PostwarStockpileKey[]).filter((key) => key !== 'convoys').map((key) => <option key={key} value={key}>{regionalEquipmentLabels[key]}</option>)}</select></label>
      </fieldset>
      <fieldset disabled={!canManage || proposal.mode !== 'pilot'} className="regional-dispatch-config"><legend>역량과 자동 예약 · 결재 전 설정</legend>
        <label>시범 거점에 귀속한 국가 역량<input type="number" min={0} max={capacity.total} step={1} value={proposal.allocatedFactories} onChange={(event) => update({ allocatedFactories: Number(event.target.value) })} /><small>0은 새 출발 보류 · 국가 생산량은 바꾸지 않습니다.</small></label>
        <label>출발 예약 방식<select value={proposedDispatch.mode} onChange={(event) => update({ dispatch: { ...proposedDispatch, mode: event.target.value as 'manual' | 'automatic', maxItemsPerWeek: proposedDispatch.maxItemsPerWeek || Math.max(1, itemsPerWeek) } })}><option value="manual">수동 예약 · 기본값</option><option value="automatic">자동 예약 · 명시적 승인</option></select></label>
        <label>자동 예약 주당 장비 수량 상한<input type="number" min={1} step={1} disabled={proposedDispatch.mode !== 'automatic'} value={proposedDispatch.maxItemsPerWeek || ''} onChange={(event) => update({ dispatch: { ...proposedDispatch, maxItemsPerWeek: Number(event.target.value) } })} /><small>게임 화물단위가 아닌 선택 장비의 개수입니다.</small></label>
        <label>자동 예약 후 창고 최소잔량<input type="number" min={0} step={1} disabled={proposedDispatch.mode !== 'automatic'} value={proposedDispatch.minimumWarehouse} onChange={(event) => update({ dispatch: { ...proposedDispatch, minimumWarehouse: Number(event.target.value) } })} /><small>자동 예약에만 적용합니다. 수동 명령은 별도 결재입니다.</small></label>
      </fieldset>
      <div className="regional-config-actions"><button className="regional-primary" type="submit" disabled={!canManage || !currentDraft}>설정 결재</button>{currentDraft ? <><button type="button" onClick={() => { setDraft(null); setRejection(null); }}>변경안 취소</button><p role="status">미결재 변경안 · 결재 전까지 기존 설정으로 진행합니다.</p></> : <p>현재 승인 설정 · {dispatch.mode === 'automatic' ? `자동 예약 주당 ${dispatch.maxItemsPerWeek}개 / 창고 최소 ${dispatch.minimumWarehouse}개` : '자동 예약 꺼짐'}</p>}</div>
    </form>
    {hasMaterials ? <p className="regional-basis">재고·예약·운송 물량이 남으면 모드·경로·품목은 유지해야 합니다. 동일 경로·품목의 귀속 역량과 자동 예약 설정은 지금도 조정할 수 있습니다. 용량을 줄이면 큰 기존 예약이 보류될 수 있습니다.</p> : null}
    {eligible.length < 2 ? <p className="regional-warning">현재 활성 지도에서 직접 소유한 지상 거점이 두 곳 미만입니다. 동맹국 거점을 자동 임대하거나 새 거점을 만들지 않습니다.</p> : null}
    {currentDraft && proposal.mode === 'pilot' && getRegionalRouteProblem(proposal, context) ? <p role="status">미결재 설정: {getRegionalRouteProblem(proposal, context)}</p> : null}
    <p className="regional-basis">이곳은 플레이어가 지정한 집하·물류 거점입니다. 실제 공장 위치나 역사적 철도·도로를 확인한 표시가 아닙니다. 귀속 역량은 국가 공장 수를 늘리거나 기존 생산 배치를 바꾸지 않습니다.</p>
    <dl className="regional-capacity"><div><dt>국가 역량</dt><dd>{capacity.total}</dd></div><div><dt>시범 귀속 역량</dt><dd>{capacity.attributed}</dd></div><div><dt>지리적 위치 미확인 역량</dt><dd>{capacity.unlocated}</dd></div><div><dt>주간 출발 용량</dt><dd>{capacity.cargoPerWeek} 게임 화물단위</dd></div></dl>
    </div>
    {approved.mode === 'pilot' ? <>
      <div id={`${panelId}-dispatch`} className="regional-dispatch-view" hidden={view !== 'dispatch'}>
      {routeProblem ? <p className="regional-warning" role="status">경로 보류: {routeProblem} 보유 물량은 삭제하지 않습니다.</p> : null}
      <div className="regional-inventory" aria-label="품목 재고 보존"><h4>{regionalEquipmentLabels[selectedKey]} · 국가 가용 / 지역 보유 분리</h4><dl><div><dt>국가 즉시 사용 가능</dt><dd>{nationalStockpile[selectedKey].toLocaleString()}</dd></div><div><dt>출발 창고 미예약</dt><dd>{account.warehouse[selectedKey].toLocaleString()}</dd></div><div><dt>예약·운송 중</dt><dd>{activeShipments.reduce((sum, shipment) => sum + (shipment.equipmentKey === selectedKey ? shipment.quantity : 0), 0).toLocaleString()}</dd></div><div><dt>국가 총보유</dt><dd>{total[selectedKey].toLocaleString()}</dd></div></dl></div>
      <div className="regional-throughput" aria-live="polite"><strong>{`이번 주 예약 가능 ${reservableNow.toLocaleString()}개`}</strong><p>{`주간 최대 ${itemsPerWeek.toLocaleString()}개 · 현재 출발 예약 ${reservedCargo.toLocaleString()} / ${capacity.cargoPerWeek.toLocaleString()} 게임 화물단위`}</p>{minimumDepartureWeeks !== null ? <p>{`창고 전량 출발 최소 ${minimumDepartureWeeks.toLocaleString()}주 + 마지막 출발 후 운송 ${finalTransitWeeks}주 · 국가 가용까지 최소 ${(minimumDepartureWeeks + finalTransitWeeks).toLocaleString()}주`}</p> : <p>{warehouseQuantity === 0 ? '미예약 창고 물량이 없습니다. 기존 예약·운송은 아래 기록에서 확인합니다.' : '현재 권한·경로·용량으로는 창고 처리 기간을 확정할 수 없습니다.'}</p>}<small>신규 집하를 멈추고, 경로·용량이 유지되며, 매주 가능한 물량을 직접 예약한다는 최소치입니다. 자동 예약의 낮은 주당 상한·창고 최소잔량은 전량 처리를 늦추거나 잔량을 남깁니다.</small></div>
      {warehouseQuantity > itemsPerWeek && approved.acceptNewReceipts !== false ? <p className="regional-warning">창고 물량이 한 주 수송량보다 많습니다. 새 생산이 계속 쌓이면 적체가 늘 수 있으니 ‘신규 집하 중지’ 후 기존 물량부터 예약하십시오.</p> : null}
      {oversizedReservation ? <p className="regional-warning">현재 용량보다 큰 출발 예약이 보류됩니다. 해당 예약을 취소한 뒤 현재 용량에 맞춰 나누어 예약하십시오.</p> : null}
      <form className="regional-shipping" onSubmit={(event) => { event.preventDefault(); if (reservableNow < 1 || !Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1) return; if (onPlanShipment(Number(quantity))) { setQuantityDraft(null); setRejection(null); } else setRejection({ basis, message: '출발 예약이 승인되지 않았습니다. 현재 창고·용량·권한을 다시 확인하십시오.' }); }}><label>예약 물량<input type="number" min={1} step={1} value={quantity} disabled={!canManage} onChange={(event) => { setQuantityDraft({ basis: quantityBasis, value: event.target.value }); setRejection(null); }} /></label><button type="submit" disabled={reservableNow < 1 || !Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1}>출발 예약</button><p>장비 1개당 {cargoPerItem} 게임 화물단위 · 최소 {REGIONAL_TRANSPORT_WEEKS}번의 주간 경계 · 부족한 예약 용량은 부분 승인합니다. 운송 추가 비용 모델은 없으며 국고를 차감하지 않습니다.</p></form>
      <button type="button" onClick={() => setView('records')}>승인된 예약·운송 {activeShipments.length}건 확인</button>
      <div className="regional-intake"><button type="button" disabled={!canManage} onClick={() => { if (canManage) configure({ ...approved, acceptNewReceipts: approved.acceptNewReceipts === false }); }}>{approved.acceptNewReceipts === false ? '신규 집하 재개' : '신규 집하 중지'}</button><span>집하 중지 후에도 기존 창고 예약·배송은 계속할 수 있습니다. 모두 도착하면 국가 모드로 전환할 수 있습니다.</span></div>
      <div className="regional-automation" aria-label="승인된 자동 예약 상태"><div><span className="regional-eyebrow">{dispatch.mode === 'automatic' ? 'STANDING ORDER / 승인됨' : 'STANDING ORDER / 꺼짐'}</span><h4>{dispatch.mode === 'automatic' ? '자동 출발 예약' : '수동 출발 예약'}</h4><p>{automaticPreview.reason}</p>{dispatch.mode === 'automatic' ? <small>주당 최대 {dispatch.maxItemsPerWeek}개 · 창고 최소 {dispatch.minimumWarehouse}개 유지 · 현재 창고 기준이며 다음 주 생산량은 미포함</small> : null}</div>{dispatch.mode === 'automatic' ? <button type="button" disabled={quarantined} onClick={() => { if (!quarantined) configure({ ...approved, dispatch: { ...dispatch, mode: 'manual' } }); }}>자동 예약 중지</button> : null}<p className="regional-automation-basis">주간 결산은 기존 운송 진행 → 새 생산 집하 → 자동 출발 예약 순서입니다. 새 예약은 같은 주에 출발·도착하지 않으며, 다음 주부터 최소 2번의 주간 경계가 필요합니다. 중지해도 이미 승인된 예약과 운송은 유지됩니다.</p></div>
      <details className="regional-detail"><summary>승인된 추상 연결과 지도 근거</summary>
      {pointsValid ? <figure className="regional-route"><svg viewBox={viewBox} role="img" aria-label={`${origin.name}에서 ${destination.name}까지 플레이어 지정 추상 연결`}><line x1={origin.x} y1={origin.y} x2={destination.x} y2={destination.y} /><circle cx={origin.x} cy={origin.y} r="3" /><circle cx={destination.x} cy={destination.y} r="3" /><text x={origin.x} y={origin.y - 7} textAnchor="middle">{origin.name}</text><text x={destination.x} y={destination.y + 12} textAnchor="middle">{destination.name}</text></svg><figcaption>전략지도 인접 연결의 추상 수송 시범 · 실제 경유지·역사적 노선은 모델링하지 않습니다.</figcaption></figure> : null}
      </details>
      </div>
    </> : <div id={`${panelId}-dispatch`} hidden={view !== 'dispatch'}><p>선택형 시범은 꺼져 있습니다. 모든 새 납품은 기존 국가 비축 경로를 사용합니다.</p><button type="button" onClick={() => setView('configure')}>집하 노선 검토</button></div>}
      <div id={`${panelId}-records`} className="regional-records-view" hidden={view !== 'records'}>
      <div className="regional-record-selectors"><label>운송 상태 필터<select value={recordFilter} onChange={(event) => setRecordFilter(event.target.value as typeof recordFilter)}><option value="all">전체 기록</option>{Object.entries(recordLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label><label>운송 기록 선택<select value={selectedShipment?.id ?? ''} disabled={!records.length} onChange={(event) => setSelectedRecord({ nationId: context.nationId, id: event.target.value })}>{!records.length && <option value="">해당 상태의 기록 없음</option>}{records.map((shipment) => <option key={shipment.id} value={shipment.id}>{shipmentLabels.get(shipment.id)}</option>)}</select></label></div>
      {selectedShipment ? <article className="regional-selected-shipment" aria-label={`${selectedShipmentLabel} 운송 상세`}><header><strong>{regionalEquipmentLabels[selectedShipment.equipmentKey]} {selectedShipment.quantity.toLocaleString()}개</strong><span>{selectedShipment.heldReason ? `${recordLabels[selectedShipment.status]} · 보류` : recordLabels[selectedShipment.status]}</span></header><p>{context.territories.find((t) => t.id === selectedShipment.originTerritoryId)?.name ?? selectedShipment.originTerritoryId} → {context.territories.find((t) => t.id === selectedShipment.destinationTerritoryId)?.name ?? selectedShipment.destinationTerritoryId}</p><dl><div><dt>예약 기록</dt><dd>제{selectedShipment.reservedWeek + 1}주</dd></div><div><dt>현재 진행</dt><dd>{selectedShipment.status === 'delivered' ? selectedShipment.deliveredWeek === null ? '도착 주차 기록 없음' : `제${selectedShipment.deliveredWeek + 1}주 확정 도착` : selectedShipment.status === 'cancelled' ? '예약 취소됨 · 도착 실적 아님' : `도착까지 남은 유효 진행 ${selectedShipment.remainingWeeks}주`}</dd></div></dl>{selectedShipment.heldReason && <p className="regional-warning">{selectedShipment.heldReason}</p>}<small>현재 설정이 아닌 이 운송에 기록된 출발·도착지입니다.</small>{selectedShipment.status === 'reserved' && <button type="button" disabled={!canManage} aria-label={`${selectedShipmentLabel} 예약 취소`} onClick={() => { if (!canManage) return; if (!onCancelReserved(selectedShipment.id)) setRejection({ basis, message: '예약 취소가 승인되지 않았습니다. 이미 출발했는지 현재 기록을 확인하십시오.' }); else setRejection(null); }}>예약 취소</button>}</article> : <p className="regional-empty">해당 상태의 운송 기록이 없습니다. 필터 선택은 운송을 생성하지 않습니다.</p>}
      {receipt ? <p className="regional-receipt">확정 도착 · 제{receipt.week + 1}주 · {context.territories.find((t) => t.id === receipt.destinationTerritoryId)?.name ?? receipt.destinationTerritoryId} · {regionalEquipmentLabels[receipt.equipmentKey]} {receipt.quantity}개 국가 가용 비축 편입</p> : <p>아직 확정 도착 영수증이 없습니다. 창고 적립이나 출발 예약은 도착이 아닙니다.</p>}
      {selectedShipment || receipt ? <details className="regional-detail"><summary>운송 추적 번호</summary>{selectedShipment && <p>선택한 운송 ID: {selectedShipment.id}</p>}{receipt && <p>최근 확정 도착 영수증 ID: {receipt.id}<br />영수증에 연결된 운송 ID: {receipt.shipmentId}</p>}</details> : null}
      </div>
  </section>;
}
