import type { NationId } from './types';
import { postwarStockpileKeys, type PostwarStockpileKey } from './postwarIndustry';
import {
  REGIONAL_TRANSPORT_WEEKS,
  deriveRegionalCapacity,
  getRegionalRouteProblem,
  regionalCargoPerItem,
  regionalEquipmentLabels,
  type RegionalIndustryContext,
  type RegionalIndustryState,
  type RegionalShipment,
} from './regionalIndustry';

/** Navigation suggestions only. This model never issues a logistics command. */
export type RegionalLogisticsNextAction = 'configure' | 'dispatch' | 'records';

export interface RegionalLogisticsRow {
  id: string;
  nationKey: NationId;
  status: RegionalShipment['status'];
  equipmentKey: PostwarStockpileKey;
  equipmentLabel: string;
  quantity: number;
  originTerritoryId: string;
  destinationTerritoryId: string;
  originName: string;
  destinationName: string;
  reservedWeek: number;
  deliveredWeek: number | null;
  closedWeek: number | null;
  /** Completed settlement steps, never elapsed calendar weeks or map distance. */
  completedSteps: number | null;
  remainingSteps: number | null;
  stageIndex: 0 | 1 | 2 | null;
  /** Current blockers are separate from what the last settlement recorded. */
  currentBlocker: string | null;
  holdReason: string | null;
  recordedHoldReason: string | null;
  /** Conditional lower bound under current conditions; null means no estimate. */
  earliestArrivalSteps: number | null;
  arrivalCondition: string | null;
  summary: string;
  nextAction: RegionalLogisticsNextAction;
}

export interface RegionalLogisticsTotals {
  equipmentKey: PostwarStockpileKey;
  equipmentLabel: string;
  warehouse: number;
  reserved: number;
  inTransit: number;
  deliveredThisWeek: number;
}

export interface RegionalLogisticsPresentation {
  nationKey: NationId;
  nationId: NationId;
  week: number;
  quarantined: boolean;
  rows: RegionalLogisticsRow[];
  /** Item counts remain separate by equipment; there is no mixed-unit total. */
  totals: RegionalLogisticsTotals[];
  nextAction: RegionalLogisticsNextAction;
  summary: string;
}

export interface RegionalLogisticsSelection {
  nationKey: NationId;
  shipmentId: string;
}

const isActive = (shipment: RegionalShipment) => shipment.status === 'reserved' || shipment.status === 'in-transit';
const capacityHoldReason = '현재 가용 출발 용량이 예약보다 작아 보류 중입니다.';

function visibleAtWeek(shipment: RegionalShipment, week: number): boolean {
  if (shipment.reservedWeek > week) return false;
  if (shipment.status === 'delivered' && (shipment.deliveredWeek === null || shipment.deliveredWeek > week)) return false;
  return shipment.closedWeek === undefined || shipment.closedWeek <= week;
}

/**
 * Read-only projection of the current nation's normalized logistics ledger.
 * The engine stores settlement progress, not departure timestamps or geography.
 */
export function buildRegionalLogisticsPresentation(
  state: RegionalIndustryState,
  context: RegionalIndustryContext,
): RegionalLogisticsPresentation {
  const quarantined = Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId);
  const model: RegionalLogisticsPresentation = {
    nationKey: context.nationId,
    nationId: context.nationId,
    week: context.week,
    quarantined,
    rows: [],
    totals: [],
    nextAction: quarantined ? 'records' : 'configure',
    summary: quarantined
      ? '격리된 지역 재고 원본이 있습니다. 수량이나 운송을 추정하지 않습니다. 기록에서 저장을 내보내 확인하십시오.'
      : '현재 국가의 실제 화물 기록입니다. 진행도는 주간 결산 단계이며 실제 거리·차량 위치나 도착 보장이 아닙니다.',
  };
  const account = state.accounts[context.nationId];
  if (quarantined || !account) return model;

  const shipments = account.shipments.filter((shipment) => visibleAtWeek(shipment, context.week));
  const territoryNames = new Map(context.territories.map((territory) => [territory.id, territory.name]));
  const blockers = new Map<string, string | null>();
  let capacity = deriveRegionalCapacity(state, context).cargoPerWeek;

  // Match the engine's departure queue. Already moving cargo consumes no new
  // departure capacity, and a blocked route does not reserve that capacity.
  [...shipments].sort((a, b) => a.reservedWeek - b.reservedWeek || a.id.localeCompare(b.id)).forEach((shipment) => {
    if (!isActive(shipment)) return;
    const routeProblem = getRegionalRouteProblem({
      ...account.configuration,
      originTerritoryId: shipment.originTerritoryId,
      destinationTerritoryId: shipment.destinationTerritoryId,
    }, context);
    if (routeProblem) {
      blockers.set(shipment.id, routeProblem);
      return;
    }
    const cargo = shipment.quantity * regionalCargoPerItem[shipment.equipmentKey];
    if (shipment.status === 'reserved' && cargo > capacity) {
      blockers.set(shipment.id, capacityHoldReason);
      return;
    }
    if (shipment.status === 'reserved') capacity -= cargo;
    blockers.set(shipment.id, null);
  });

  model.rows = shipments.map((shipment): RegionalLogisticsRow => {
    const active = isActive(shipment);
    const currentBlocker = active ? blockers.get(shipment.id) ?? null : null;
    const cancelled = shipment.status === 'cancelled';
    const remainingSteps = cancelled ? null : shipment.status === 'delivered' ? 0 : Math.max(1, shipment.remainingWeeks);
    const completedSteps = remainingSteps === null ? null : REGIONAL_TRANSPORT_WEEKS - remainingSteps;
    const timingSupported = account.lastTransportWeek <= context.week && account.lastReceiptWeek <= context.week;
    const earliestArrivalSteps = active && !currentBlocker && timingSupported ? remainingSteps : null;
    const stageIndex = cancelled ? null : shipment.status === 'reserved' ? 0 : shipment.status === 'in-transit' ? 1 : 2;
    const phase = shipment.status === 'reserved' ? '출발 예약' : shipment.status === 'in-transit' ? '운송 중' : shipment.status === 'delivered' ? '도착 완료' : '예약 취소';
    const summary = cancelled ? '예약 취소 · 출발 창고로 반환'
      : shipment.status === 'delivered' && shipment.deliveredWeek !== null ? `도착 완료 · 제${shipment.deliveredWeek + 1}주 국가 비축 편입`
        : `${currentBlocker ? '보류 · ' : ''}${phase} · 주간 결산 ${completedSteps}/${REGIONAL_TRANSPORT_WEEKS}단계 진행`;
    return {
      id: shipment.id,
      nationKey: context.nationId,
      status: shipment.status,
      equipmentKey: shipment.equipmentKey,
      equipmentLabel: regionalEquipmentLabels[shipment.equipmentKey],
      quantity: shipment.quantity,
      originTerritoryId: shipment.originTerritoryId,
      destinationTerritoryId: shipment.destinationTerritoryId,
      originName: territoryNames.get(shipment.originTerritoryId) ?? `미확인 지역 (${shipment.originTerritoryId})`,
      destinationName: territoryNames.get(shipment.destinationTerritoryId) ?? `미확인 지역 (${shipment.destinationTerritoryId})`,
      reservedWeek: shipment.reservedWeek,
      deliveredWeek: shipment.deliveredWeek,
      closedWeek: shipment.closedWeek ?? shipment.deliveredWeek,
      completedSteps,
      remainingSteps,
      stageIndex,
      currentBlocker,
      holdReason: currentBlocker,
      recordedHoldReason: active ? shipment.heldReason : null,
      earliestArrivalSteps,
      arrivalCondition: earliestArrivalSteps === null ? null
        : `현재 ${shipment.status === 'reserved' ? '경로·출발 용량' : '경로'} 유지 시 최소 ${earliestArrivalSteps}번의 주간 결산 뒤 도착 가능하며, 도착은 보장되지 않습니다.`,
      summary,
      nextAction: currentBlocker ? 'configure' : shipment.status === 'reserved' ? 'dispatch' : 'records',
    };
  });

  const priority = (row: RegionalLogisticsRow) => row.currentBlocker ? 0 : row.status === 'in-transit' ? 1 : row.status === 'reserved' ? 2 : 3;
  model.rows.sort((a, b) => priority(a) - priority(b)
    || (priority(a) === 3
      ? (b.closedWeek ?? b.reservedWeek) - (a.closedWeek ?? a.reservedWeek)
      : a.reservedWeek - b.reservedWeek)
    || a.id.localeCompare(b.id));

  model.totals = postwarStockpileKeys.map((equipmentKey): RegionalLogisticsTotals => {
    const matching = shipments.filter((shipment) => shipment.equipmentKey === equipmentKey);
    return {
      equipmentKey,
      equipmentLabel: regionalEquipmentLabels[equipmentKey],
      warehouse: account.warehouse[equipmentKey],
      reserved: matching.filter((shipment) => shipment.status === 'reserved').reduce((sum, shipment) => sum + shipment.quantity, 0),
      inTransit: matching.filter((shipment) => shipment.status === 'in-transit').reduce((sum, shipment) => sum + shipment.quantity, 0),
      deliveredThisWeek: matching.filter((shipment) => shipment.status === 'delivered' && shipment.deliveredWeek === context.week).reduce((sum, shipment) => sum + shipment.quantity, 0),
    };
  }).filter((totals) => totals.warehouse > 0 || totals.reserved > 0 || totals.inTransit > 0 || totals.deliveredThisWeek > 0
    || (account.configuration.mode === 'pilot' && totals.equipmentKey === account.configuration.equipmentKey));

  model.nextAction = model.rows.some((row) => row.currentBlocker) ? 'configure'
    : account.configuration.mode !== 'pilot' ? (model.rows.length ? 'records' : 'configure')
      : model.totals.some((totals) => totals.warehouse > 0 || totals.reserved > 0) ? 'dispatch'
        : 'records';
  return model;
}

export function resolveRegionalLogisticsSelection(
  model: RegionalLogisticsPresentation,
  selection: RegionalLogisticsSelection | null,
): RegionalLogisticsRow | null {
  if (!selection) return model.rows[0] ?? null;
  if (selection.nationKey !== model.nationKey) return null;
  return model.rows.find((row) => row.id === selection.shipmentId && row.nationKey === selection.nationKey) ?? null;
}
