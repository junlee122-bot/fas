import type { Faction, NationId, Stockpile, Territory } from './types';
import { postwarStockpileKeys, type PostwarStockpileKey } from './postwarIndustry';

export const REGIONAL_TRANSPORT_WEEKS = 2;
export const REGIONAL_CARGO_PER_CAPACITY = 20;
export const REGIONAL_COMPLETED_SHIPMENT_LIMIT = 120;
export const REGIONAL_RECEIPT_ID_LIMIT = 128;
/** Abstract handling load, not tonnes, road surveys, or historical capacity. */
export const regionalCargoPerItem: Record<PostwarStockpileKey, number> = { infantryEquipment: 1, tanks: 20, aircraft: 15, convoys: 30, artillery: 5, trucks: 3 };
export const regionalEquipmentLabels: Record<PostwarStockpileKey, string> = { infantryEquipment: '보병 장비', tanks: '전차', aircraft: '항공기', convoys: '함선·수송선', artillery: '야포', trucks: '차량' };
export interface RegionalDispatchConfiguration {
  mode: 'manual' | 'automatic';
  /** Equipment items, not abstract cargo units. This limits automatic reservations only. */
  maxItemsPerWeek: number;
  minimumWarehouse: number;
}
export interface RegionalIndustryConfiguration {
  mode: 'national' | 'pilot';
  originTerritoryId: string;
  destinationTerritoryId: string;
  equipmentKey: PostwarStockpileKey;
  allocatedFactories: number;
  /** Stop future staging while existing warehouse and transport continue draining. */
  acceptNewReceipts?: boolean;
  /** Explicit player approval only. Missing/invalid saved settings normalize to manual. */
  dispatch?: RegionalDispatchConfiguration;
}
export interface RegionalShipment {
  id: string;
  equipmentKey: PostwarStockpileKey;
  quantity: number;
  originTerritoryId: string;
  destinationTerritoryId: string;
  status: 'reserved' | 'in-transit' | 'delivered' | 'cancelled';
  reservedWeek: number;
  remainingWeeks: number;
  deliveredWeek: number | null;
  closedWeek?: number;
  heldReason: string | null;
}
export interface RegionalDeliveryReceipt {
  id: string;
  shipmentId: string;
  nationId: NationId;
  week: number;
  destinationTerritoryId: string;
  equipmentKey: PostwarStockpileKey;
  quantity: number;
}
export interface RegionalIndustryAccount {
  configuration: RegionalIndustryConfiguration;
  /** Only new receipts staged here. Existing national stock is never copied. */
  warehouse: Stockpile;
  shipments: RegionalShipment[];
  lastTransportWeek: number;
  lastReceiptWeek: number;
  processedReceiptIds: string[];
  lastDelivery: RegionalDeliveryReceipt | null;
  lastAutomaticReservationWeek?: number;
}
export interface RegionalIndustryState {
  version: 1;
  accounts: Partial<Record<NationId, RegionalIndustryAccount>>;
  diagnostics: string[];
  /** Invalid raw accounts survive save/export unchanged; never infer replacement goods. */
  quarantinedAccounts: Partial<Record<NationId, unknown>>;
}
export interface RegionalIndustryContext {
  nationId: NationId;
  /** Current week for commands; arrival week for weekly settlement. */
  week: number;
  territories: readonly Territory[];
  /** Authoritative current playable IDs from the campaign's chronology filter. */
  playableTerritoryIds: readonly string[];
  factories: number;
  authorized: boolean;
  /** Current campaign control, in addition to exact national ownership. */
  controllingFaction?: Faction;
}
export interface RegionalIndustryResult {
  state: RegionalIndustryState;
  applied: boolean;
  reason: string;
  stockpileDelta: Stockpile;
  deliveries: RegionalDeliveryReceipt[];
}
export interface RegionalIndustrySourceReceipt {
  id: string;
  nationId: NationId;
  week: number;
  stockpileDelta: Stockpile;
}
export interface RegionalAutomaticReservationResult extends RegionalIndustryResult {
  reservedQuantity: number;
  attempted: boolean;
}

const nationIds: NationId[] = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'];
const safe = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const validKey = (value: unknown): value is PostwarStockpileKey => postwarStockpileKeys.includes(value as PostwarStockpileKey);
const emptyStockpile = (): Stockpile => ({ infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 });
const manualDispatch = (): RegionalDispatchConfiguration => ({ mode: 'manual', maxItemsPerWeek: 0, minimumWarehouse: 0 });
const validDispatch = (value: unknown): value is RegionalDispatchConfiguration => {
  if (!value || typeof value !== 'object') return false;
  const dispatch = value as RegionalDispatchConfiguration;
  return (dispatch.mode === 'manual' || dispatch.mode === 'automatic') && integer(dispatch.maxItemsPerWeek)
    && integer(dispatch.minimumWarehouse) && (dispatch.mode !== 'automatic' || dispatch.maxItemsPerWeek > 0);
};
export function getRegionalDispatchConfiguration(configuration: RegionalIndustryConfiguration): RegionalDispatchConfiguration {
  return validDispatch(configuration.dispatch) ? configuration.dispatch : manualDispatch();
}
const emptyAccount = (week: number): RegionalIndustryAccount => ({
  configuration: { mode: 'national', originTerritoryId: '', destinationTerritoryId: '', equipmentKey: 'infantryEquipment', allocatedFactories: 0, dispatch: manualDispatch() },
  warehouse: emptyStockpile(), shipments: [], lastTransportWeek: Math.floor(safe(week)), lastReceiptWeek: Math.floor(safe(week)), processedReceiptIds: [], lastDelivery: null,
  lastAutomaticReservationWeek: Math.floor(safe(week)),
});
const validStockpile = (value: unknown): value is Stockpile => Boolean(value && typeof value === 'object' && postwarStockpileKeys.every((key) => integer((value as Stockpile)[key])));
const validConfiguration = (value: unknown): value is RegionalIndustryConfiguration => {
  if (!value || typeof value !== 'object') return false;
  const config = value as RegionalIndustryConfiguration;
  return (config.mode === 'national' || config.mode === 'pilot') && typeof config.originTerritoryId === 'string' && typeof config.destinationTerritoryId === 'string'
    && validKey(config.equipmentKey) && (config.mode !== 'pilot' || config.equipmentKey !== 'convoys') && integer(config.allocatedFactories)
    && (config.acceptNewReceipts === undefined || typeof config.acceptNewReceipts === 'boolean');
};
function compactRegionalAccount(account: RegionalIndustryAccount): RegionalIndustryAccount {
  const terminal = account.shipments.map((shipment, index) => ({ shipment, index }))
    .filter(({ shipment }) => shipment.status === 'delivered' || shipment.status === 'cancelled')
    .sort((a, b) => (b.shipment.closedWeek ?? b.shipment.deliveredWeek ?? b.shipment.reservedWeek)
      - (a.shipment.closedWeek ?? a.shipment.deliveredWeek ?? a.shipment.reservedWeek) || b.index - a.index);
  const retainedIds = new Set(terminal.slice(0, REGIONAL_COMPLETED_SHIPMENT_LIMIT).map(({ shipment }) => shipment.id));
  const lastDeliveryId = account.lastDelivery?.shipmentId;
  if (lastDeliveryId && !retainedIds.has(lastDeliveryId) && terminal.some(({ shipment }) => shipment.id === lastDeliveryId)) {
    if (retainedIds.size >= REGIONAL_COMPLETED_SHIPMENT_LIMIT) retainedIds.delete(terminal[REGIONAL_COMPLETED_SHIPMENT_LIMIT - 1].shipment.id);
    retainedIds.add(lastDeliveryId);
  }
  return {
    ...account,
    processedReceiptIds: account.processedReceiptIds.slice(-REGIONAL_RECEIPT_ID_LIMIT),
    shipments: account.shipments.filter((shipment) => shipment.status === 'reserved' || shipment.status === 'in-transit' || retainedIds.has(shipment.id)),
  };
}
export function createRegionalIndustryState(nationId: NationId, currentWeek = 0): RegionalIndustryState {
  return { version: 1, accounts: { [nationId]: emptyAccount(currentWeek) }, diagnostics: [], quarantinedAccounts: {} };
}
export function getRegionalIndustryAccount(state: RegionalIndustryState, nationId: NationId, currentWeek = 0): RegionalIndustryAccount {
  return state.accounts[nationId] ?? emptyAccount(currentWeek);
}
export function normalizeRegionalIndustry(value: unknown, nationId: NationId, currentWeek: number): RegionalIndustryState {
  const fallback = createRegionalIndustryState(nationId, currentWeek);
  if (!value || typeof value !== 'object' || (value as RegionalIndustryState).version !== 1) return fallback;
  const candidate = value as RegionalIndustryState;
  if (!candidate.accounts || typeof candidate.accounts !== 'object') return fallback;
  const state: RegionalIndustryState = { version: 1, accounts: {}, diagnostics: [], quarantinedAccounts: {} };
  for (const id of nationIds) {
    if (candidate.quarantinedAccounts && Object.hasOwn(candidate.quarantinedAccounts, id)) {
      state.quarantinedAccounts[id] = structuredClone(candidate.quarantinedAccounts[id]);
      state.diagnostics.push(`${id}: 격리된 지역 재고 원본이 있습니다. 저장을 내보낸 뒤 복구하기 전까지 지역 집행을 중단합니다.`);
    }
  }
  for (const id of nationIds) {
    const account = candidate.accounts[id];
    if (!account) continue;
    const seen = new Set<string>();
    const valid = validConfiguration(account.configuration) && validStockpile(account.warehouse)
      && integer(account.lastTransportWeek) && integer(account.lastReceiptWeek)
      && Array.isArray(account.processedReceiptIds) && account.processedReceiptIds.every((receipt) => typeof receipt === 'string')
      && Array.isArray(account.shipments) && account.shipments.every((shipment) => {
        if (!shipment || typeof shipment.id !== 'string' || seen.has(shipment.id)) return false;
        seen.add(shipment.id);
        return validKey(shipment.equipmentKey) && integer(shipment.quantity) && shipment.quantity > 0
          && typeof shipment.originTerritoryId === 'string' && typeof shipment.destinationTerritoryId === 'string'
          && ['reserved', 'in-transit', 'delivered', 'cancelled'].includes(shipment.status)
          && integer(shipment.reservedWeek) && integer(shipment.remainingWeeks) && shipment.remainingWeeks <= REGIONAL_TRANSPORT_WEEKS
          && (shipment.deliveredWeek === null || integer(shipment.deliveredWeek))
          && (shipment.closedWeek === undefined || integer(shipment.closedWeek))
          && (shipment.heldReason === null || typeof shipment.heldReason === 'string');
      });
    const receipt = account.lastDelivery;
    const validDelivery = receipt && receipt.nationId === id && typeof receipt.id === 'string' && typeof receipt.shipmentId === 'string'
      && typeof receipt.destinationTerritoryId === 'string' && validKey(receipt.equipmentKey) && integer(receipt.quantity) && receipt.quantity > 0
      && integer(receipt.week) && receipt.week <= account.lastTransportWeek
      && Array.isArray(account.shipments) && account.shipments.some((shipment) => shipment?.id === receipt.shipmentId && shipment.status === 'delivered'
        && shipment.quantity === receipt.quantity && shipment.deliveredWeek === receipt.week && shipment.destinationTerritoryId === receipt.destinationTerritoryId && shipment.equipmentKey === receipt.equipmentKey);
    if (valid) {
      const invalidAutomation = account.configuration.dispatch !== undefined && !validDispatch(account.configuration.dispatch);
      const invalidAutomaticWeek = account.lastAutomaticReservationWeek !== undefined && !integer(account.lastAutomaticReservationWeek);
      if (invalidAutomation || invalidAutomaticWeek) state.diagnostics.push(`${id}: 유효하지 않은 자동 예약 설정을 수동으로 해제했습니다. 기존 창고·화물은 유지합니다.`);
      state.accounts[id] = compactRegionalAccount(structuredClone({
        ...account,
        configuration: { ...account.configuration, dispatch: invalidAutomation || invalidAutomaticWeek ? manualDispatch() : getRegionalDispatchConfiguration(account.configuration) },
        lastAutomaticReservationWeek: Math.max(integer(account.lastAutomaticReservationWeek) ? account.lastAutomaticReservationWeek : 0, account.lastTransportWeek, account.lastReceiptWeek, Math.floor(safe(currentWeek))),
        lastDelivery: validDelivery ? receipt : null,
      }));
    }
    else {
      if (!Object.hasOwn(state.quarantinedAccounts, id)) state.quarantinedAccounts[id] = structuredClone(account);
      state.diagnostics.push(`${id}: 유효하지 않은 지역 재고 원본을 격리 보존했습니다. 저장을 내보내 확인·복구하십시오. 새 납품은 국가 비축으로만 보냅니다.`);
    }
  }
  if (!state.accounts[nationId]) state.accounts[nationId] = emptyAccount(currentWeek);
  return state;
}
export function getRegionalEligibleTerritories(context: RegionalIndustryContext): Territory[] {
  const playable = new Set(context.playableTerritoryIds);
  return context.territories.filter((territory) => territory.ownerId === context.nationId && playable.has(territory.id)
    && (context.controllingFaction === undefined || territory.controller === context.controllingFaction)
    && territory.siteType !== 'sea' && !/해역|해상|sea|naval|ocean/i.test(territory.terrain) && Number.isFinite(territory.x) && Number.isFinite(territory.y));
}
export function getRegionalRouteProblem(configuration: RegionalIndustryConfiguration, context: RegionalIndustryContext): string | null {
  const eligible = getRegionalEligibleTerritories(context);
  const origin = eligible.find((territory) => territory.id === configuration.originTerritoryId);
  const destination = eligible.find((territory) => territory.id === configuration.destinationTerritoryId);
  if (!origin || !destination) return '현재 직접 소유·통제하고 활성화된 지상 지역 두 곳이 필요합니다. 동맹 통제만으로는 접근할 수 없습니다.';
  if (origin.id === destination.id || (origin.theater ?? 'europe') !== (destination.theater ?? 'europe')
    || !(origin.neighbors.includes(destination.id) || destination.neighbors.includes(origin.id))) return '같은 전구의 서로 다른 인접 지역만 시험 연결할 수 있습니다.';
  return null;
}
export function deriveRegionalCapacity(state: RegionalIndustryState, context: RegionalIndustryContext) {
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  const total = Math.floor(safe(context.factories));
  const attributed = account.configuration.mode === 'pilot' ? Math.min(total, account.configuration.allocatedFactories) : 0;
  return { total, attributed, unlocated: total - attributed, cargoPerWeek: attributed * REGIONAL_CARGO_PER_CAPACITY };
}
export function deriveRegionalOwnedStockpile(state: RegionalIndustryState, nationId: NationId, nationalStockpile: Stockpile): Stockpile {
  const account = getRegionalIndustryAccount(state, nationId);
  const total = { ...nationalStockpile };
  postwarStockpileKeys.forEach((key) => { total[key] = safe(total[key]) + account.warehouse[key]; });
  account.shipments.filter((shipment) => shipment.status === 'reserved' || shipment.status === 'in-transit').forEach((shipment) => { total[shipment.equipmentKey] += shipment.quantity; });
  return total;
}
export function hasRegionalPendingMaterials(account: RegionalIndustryAccount): boolean {
  return postwarStockpileKeys.some((key) => account.warehouse[key] > 0) || account.shipments.some((shipment) => shipment.status === 'reserved' || shipment.status === 'in-transit');
}
const reject = (state: RegionalIndustryState, reason: string): RegionalIndustryResult => ({ state, applied: false, reason, stockpileDelta: emptyStockpile(), deliveries: [] });
const accept = (state: RegionalIndustryState, nationId: NationId, account: RegionalIndustryAccount, reason: string, stockpileDelta = emptyStockpile(), deliveries: RegionalDeliveryReceipt[] = []): RegionalIndustryResult => ({
  state: { ...state, accounts: { ...state.accounts, [nationId]: compactRegionalAccount(account) } }, applied: true, reason, stockpileDelta, deliveries,
});
const commandProblem = (account: RegionalIndustryAccount, context: RegionalIndustryContext) => !context.authorized ? '지역 산업 직접 집행권이 필요합니다.' : !integer(context.week) || context.week < Math.max(account.lastTransportWeek, account.lastReceiptWeek) ? '과거 또는 유효하지 않은 주차의 명령입니다.' : null;

export function configureRegionalIndustry(state: RegionalIndustryState, configuration: RegionalIndustryConfiguration, context: RegionalIndustryContext): RegionalIndustryResult {
  if (Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId)) return reject(state, '격리된 지역 재고 원본을 저장으로 내보내 복구하기 전에는 지역 명령을 실행할 수 없습니다.');
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  const sameRoute = configuration.mode === account.configuration.mode && configuration.originTerritoryId === account.configuration.originTerritoryId
    && configuration.destinationTerritoryId === account.configuration.destinationTerritoryId && configuration.equipmentKey === account.configuration.equipmentKey;
  const sameCapacity = configuration.allocatedFactories === account.configuration.allocatedFactories;
  const nextDispatch = getRegionalDispatchConfiguration(configuration);
  const previousDispatch = getRegionalDispatchConfiguration(account.configuration);
  // A standing automatic order can always be revoked, even after executive authority is lost.
  const stopAutomationOnly = sameRoute && sameCapacity && configuration.acceptNewReceipts === account.configuration.acceptNewReceipts
    && previousDispatch.mode === 'automatic' && nextDispatch.mode === 'manual'
    && nextDispatch.maxItemsPerWeek === previousDispatch.maxItemsPerWeek && nextDispatch.minimumWarehouse === previousDispatch.minimumWarehouse;
  const problem = commandProblem(account, stopAutomationOnly ? { ...context, authorized: true } : context);
  if (problem) return reject(state, problem);
  if (!validConfiguration(configuration)) return reject(state, '유효한 모드·장비·정수 역량이 필요합니다.');
  if (configuration.dispatch !== undefined && !validDispatch(configuration.dispatch)) return reject(state, '자동 예약은 1 이상의 주당 정수 상한과 0 이상의 창고 최소잔량이 필요합니다.');
  if (hasRegionalPendingMaterials(account) && !sameRoute) return reject(state, '신규 집하를 중지하고 창고·예약·운송 물량을 실제 도착시킨 뒤 모드나 경로·품목을 변경하십시오.');
  if (configuration.mode === 'pilot') {
    const routeProblem = getRegionalRouteProblem(configuration, context);
    if (routeProblem && !(sameRoute && sameCapacity)) return reject(state, routeProblem);
    if ((!sameRoute || !sameCapacity) && configuration.allocatedFactories > Math.floor(safe(context.factories))) return reject(state, '귀속 역량은 0부터 현재 국가 공장 수 이내여야 합니다. 0은 새 출발을 보류합니다.');
  }
  return accept(state, context.nationId, { ...account, configuration: { ...configuration, dispatch: configuration.mode === 'national' ? manualDispatch() : { ...nextDispatch }, allocatedFactories: configuration.mode === 'national' ? 0 : configuration.allocatedFactories } }, '시험 설정 승인. 기존 국가 비축·생산량·공장 수는 바뀌지 않습니다. 추가 운송 비용 모델은 없습니다.');
}
/** Call only for the first applied postwar receipt. Return this delta INSTEAD of its original delta. */
export function attributeRegionalIndustryReceipt(state: RegionalIndustryState, receipt: RegionalIndustrySourceReceipt, context: RegionalIndustryContext): RegionalIndustryResult {
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  if (receipt.nationId !== context.nationId || !receipt.id || !integer(receipt.week) || receipt.week !== context.week
    || receipt.week <= account.lastReceiptWeek || receipt.week < account.lastTransportWeek || account.processedReceiptIds.includes(receipt.id)) return reject(state, '이미 귀속됐거나 국가·주차가 맞지 않는 원본 납품입니다.');
  if (!validStockpile(receipt.stockpileDelta)) return reject(state, '원본 납품은 유한한 비음수 정수 수량이어야 합니다.');
  const nationalDelta = { ...receipt.stockpileDelta };
  const warehouse = { ...account.warehouse };
  if (account.configuration.mode === 'pilot' && account.configuration.acceptNewReceipts !== false && !Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId)) {
    const key = account.configuration.equipmentKey;
    warehouse[key] += nationalDelta[key];
    if (!integer(warehouse[key])) return reject(state, '지역 재고 합계가 안전한 정수 범위를 초과합니다.');
    nationalDelta[key] = 0;
  }
  return accept(state, context.nationId, { ...account, warehouse, lastReceiptWeek: receipt.week, processedReceiptIds: [...account.processedReceiptIds, receipt.id] }, '확정 납품만 귀속했습니다. 시험 품목은 출발 창고, 다른 품목은 기존 국가 비축입니다.', nationalDelta);
}
export function planRegionalShipment(state: RegionalIndustryState, command: { id: string; quantity: number }, context: RegionalIndustryContext): RegionalIndustryResult {
  if (Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId)) return reject(state, '격리된 원본 저장을 복구하기 전까지 지역 수송을 중단합니다.');
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  const problem = commandProblem(account, context);
  if (problem) return reject(state, problem);
  if (!command.id || account.shipments.some((shipment) => shipment.id === command.id)) return reject(state, '빈 명령 또는 이미 처리된 수송 명령입니다.');
  if (account.configuration.mode !== 'pilot') return reject(state, '지역 수송 시험을 먼저 승인하십시오.');
  const routeProblem = getRegionalRouteProblem(account.configuration, context);
  if (routeProblem) return reject(state, routeProblem);
  if (!integer(command.quantity) || command.quantity === 0) return reject(state, '1 이상의 정수 화물이 필요합니다.');
  const key = account.configuration.equipmentKey;
  const reservedCargo = account.shipments.filter((shipment) => shipment.status === 'reserved').reduce((sum, shipment) => sum + shipment.quantity * regionalCargoPerItem[shipment.equipmentKey], 0);
  const remainingCapacity = Math.max(0, deriveRegionalCapacity(state, context).cargoPerWeek - reservedCargo);
  const quantity = Math.min(command.quantity, account.warehouse[key], Math.floor(remainingCapacity / regionalCargoPerItem[key]));
  if (quantity === 0) return reject(state, '출발 창고 물량 또는 이번 출발 예약 용량이 부족합니다.');
  const shipment: RegionalShipment = { id: command.id, equipmentKey: key, quantity, originTerritoryId: account.configuration.originTerritoryId, destinationTerritoryId: account.configuration.destinationTerritoryId, status: 'reserved', reservedWeek: context.week, remainingWeeks: REGIONAL_TRANSPORT_WEEKS, deliveredWeek: null, heldReason: null };
  return accept(state, context.nationId, { ...account, warehouse: { ...account.warehouse, [key]: account.warehouse[key] - quantity }, shipments: [...account.shipments, shipment] }, `${quantity}개 예약. 국가 가용 비축에 도착하기까지 최소 ${REGIONAL_TRANSPORT_WEEKS}번의 주간 경계가 필요합니다. 추가 운송 비용은 모델링하지 않습니다.`);
}
/** Current-stock preview only; next week's incoming output and route changes are not promised. */
export function deriveRegionalAutomaticReservation(state: RegionalIndustryState, context: RegionalIndustryContext): { quantity: number; reason: string } {
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  const dispatch = getRegionalDispatchConfiguration(account.configuration);
  if (dispatch.mode !== 'automatic' || account.configuration.mode !== 'pilot') return { quantity: 0, reason: '수동 예약 모드입니다. 자동 지시는 승인되지 않았습니다.' };
  if (Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId)) return { quantity: 0, reason: '자동 예약 보류: 격리된 저장 원본을 먼저 복구해야 합니다.' };
  const problem = commandProblem(account, context) ?? getRegionalRouteProblem(account.configuration, context);
  if (problem) return { quantity: 0, reason: `자동 예약 보류: ${problem}` };
  const key = account.configuration.equipmentKey;
  const reservedCargo = account.shipments.filter((shipment) => shipment.status === 'reserved').reduce((sum, shipment) => sum + shipment.quantity * regionalCargoPerItem[shipment.equipmentKey], 0);
  const capacity = Math.max(0, Math.floor((deriveRegionalCapacity(state, context).cargoPerWeek - reservedCargo) / regionalCargoPerItem[key]));
  const available = Math.max(0, account.warehouse[key] - dispatch.minimumWarehouse);
  const quantity = Math.min(dispatch.maxItemsPerWeek, available, capacity);
  return { quantity, reason: quantity > 0 ? `현재 창고 기준 자동 예약 가능 ${quantity}개. 실제 주간 결산 뒤 남은 용량·최소잔량을 다시 검증합니다.`
    : available === 0 ? '자동 예약 대기: 창고 최소잔량을 제외한 출발 가능 재고가 없습니다.' : '자동 예약 보류: 기존 예약을 제외한 출발 용량이 부족합니다.' };
}
/** Run once AFTER transport and new receipt attribution; only reserves, never moves cargo. */
export function reserveAutomaticRegionalShipmentWeek(state: RegionalIndustryState, context: RegionalIndustryContext): RegionalAutomaticReservationResult {
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  const noAction = (reason: string): RegionalAutomaticReservationResult => ({ ...reject(state, reason), reservedQuantity: 0, attempted: false });
  if (Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId)) return noAction('자동 예약 보류: 격리된 저장 원본을 먼저 복구해야 합니다.');
  if (account.configuration.mode !== 'pilot' || getRegionalDispatchConfiguration(account.configuration).mode !== 'automatic') return noAction('수동 예약 모드입니다. 자동 지시는 승인되지 않았습니다.');
  const lastWeek = account.lastAutomaticReservationWeek ?? Math.max(account.lastTransportWeek, account.lastReceiptWeek);
  if (!integer(context.week) || context.week <= lastWeek || context.week < Math.max(account.lastTransportWeek, account.lastReceiptWeek)) return noAction('이미 처리했거나 과거·유효하지 않은 자동 예약 주차입니다.');
  if (context.week !== account.lastTransportWeek && context.week !== account.lastReceiptWeek) return noAction('자동 예약은 해당 주의 운송·납품 결산 후에만 실행합니다.');
  const preview = deriveRegionalAutomaticReservation(state, context);
  // Stamp even a held/empty attempt. Repeating this week after a cancellation or authority change cannot reserve again.
  const stamped = accept(state, context.nationId, { ...account, lastAutomaticReservationWeek: context.week }, preview.reason).state;
  if (preview.quantity === 0) return { ...reject(stamped, preview.reason), reservedQuantity: 0, attempted: true };
  const planned = planRegionalShipment(stamped, { id: `regional-auto:${context.nationId}:${context.week}`, quantity: preview.quantity }, context);
  return { ...planned, reservedQuantity: planned.applied ? preview.quantity : 0, attempted: true };
}
export function cancelRegionalReservedShipment(state: RegionalIndustryState, shipmentId: string, context: RegionalIndustryContext): RegionalIndustryResult {
  if (Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId)) return reject(state, '격리된 원본 저장을 복구하기 전까지 지역 수송을 중단합니다.');
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  const problem = commandProblem(account, context);
  if (problem) return reject(state, problem);
  const shipment = account.shipments.find((item) => item.id === shipmentId && item.status === 'reserved');
  if (!shipment) return reject(state, '출발 전 예약만 취소할 수 있습니다. 운송 중 물량은 순간 환급하지 않습니다.');
  return accept(state, context.nationId, { ...account, warehouse: { ...account.warehouse, [shipment.equipmentKey]: account.warehouse[shipment.equipmentKey] + shipment.quantity }, shipments: account.shipments.map((item) => item.id === shipmentId ? { ...item, status: 'cancelled', closedWeek: context.week, heldReason: null } : item) }, '예약 물량을 원래 출발 창고로 반환했습니다. 국가 비축이나 국고는 바뀌지 않습니다.');
}
/** One transport step per new arrival week, never elapsed-time catch-up. Run BEFORE new production attribution. */
export function advanceRegionalTransportWeek(state: RegionalIndustryState, context: RegionalIndustryContext): RegionalIndustryResult {
  if (Object.hasOwn(state.quarantinedAccounts ?? {}, context.nationId)) return reject(state, '격리된 원본 저장을 복구하기 전까지 지역 수송을 중단합니다.');
  const account = getRegionalIndustryAccount(state, context.nationId, context.week);
  if (!integer(context.week) || context.week <= account.lastTransportWeek || context.week < account.lastReceiptWeek) return reject(state, '이미 진행했거나 과거·유효하지 않은 수송 주차입니다.');
  const delta = emptyStockpile();
  const deliveries: RegionalDeliveryReceipt[] = [];
  let capacity = deriveRegionalCapacity(state, context).cargoPerWeek;
  const shipments = [...account.shipments].sort((a, b) => a.reservedWeek - b.reservedWeek || a.id.localeCompare(b.id)).map((shipment): RegionalShipment => {
    if (shipment.status === 'delivered' || shipment.status === 'cancelled' || shipment.reservedWeek >= context.week) return shipment;
    const routeProblem = getRegionalRouteProblem({ ...account.configuration, originTerritoryId: shipment.originTerritoryId, destinationTerritoryId: shipment.destinationTerritoryId }, context);
    if (routeProblem) return { ...shipment, heldReason: routeProblem };
    const cargo = shipment.quantity * regionalCargoPerItem[shipment.equipmentKey];
    if (shipment.status === 'reserved' && cargo > capacity) return { ...shipment, heldReason: '현재 가용 출발 용량이 예약보다 작아 보류 중입니다.' };
    if (shipment.status === 'reserved') capacity -= cargo;
    const remainingWeeks = Math.max(0, shipment.remainingWeeks - 1);
    if (remainingWeeks > 0) return { ...shipment, status: 'in-transit', remainingWeeks, heldReason: null };
    delta[shipment.equipmentKey] += shipment.quantity;
    deliveries.push({ id: `arrival:${context.nationId}:${shipment.id}`, shipmentId: shipment.id, nationId: context.nationId, week: context.week, destinationTerritoryId: shipment.destinationTerritoryId, equipmentKey: shipment.equipmentKey, quantity: shipment.quantity });
    return { ...shipment, status: 'delivered', remainingWeeks: 0, deliveredWeek: context.week, closedWeek: context.week, heldReason: null };
  });
  return accept(state, context.nationId, { ...account, shipments, lastTransportWeek: context.week, lastDelivery: deliveries.at(-1) ?? account.lastDelivery }, deliveries.length ? '실제 목적지 도착분만 국가 가용 비축으로 편입했습니다.' : '기존 수송만 한 단계 진행했습니다. 새 생산품의 같은 주 도착은 없습니다.', delta, deliveries);
}
