import { normalizeRegionalIndustry, REGIONAL_TRANSPORT_WEEKS } from './regionalIndustry';
import type { RegionalIndustryContext, RegionalIndustryState } from './regionalIndustry';
import { buildRegionalLogisticsPresentation } from './regionalLogisticsPresentation';
import type { RegionalLogisticsPresentation, RegionalLogisticsRow } from './regionalLogisticsPresentation';
import { getStaffDeliveryPledgeLines, getStaffDeliveryPledgeQuantity, normalizeStaffDeliveryPledges } from './staffDeliveryPledges';
import type { StaffDeliveryPledge, StaffDeliveryPledgeContext, StaffDeliveryReceipt } from './staffDeliveryPledges';

export interface DeliveryGoalTraceInput {
  pledge: StaffDeliveryPledge;
  context: StaffDeliveryPledgeContext;
  regional?: { state: RegionalIndustryState; context: RegionalIndustryContext };
}

export interface DeliveryGoalReceiptTrace {
  receipt: StaffDeliveryReceipt;
  shipmentId: string | null;
  originName?: string;
  destinationName?: string;
  linkReason: string;
}

export interface DeliveryGoalTrace {
  /** A readable, valid goal in this national context; this is never command authority. */
  available: boolean;
  reason: string | null;
  credited: number;
  remaining: number;
  production: { lineId: string; name: string; assigned: number; efficiency: number } | null;
  /** Current same-equipment context only, never attributed to this goal or added to credited. */
  warehouse: number | null;
  reserved: number | null;
  inTransit: number | null;
  receipts: DeliveryGoalReceiptTrace[];
  relatedShipments: RegionalLogisticsRow[];
  nextStep: { kind: 'production' | 'dispatch' | 'records' | 'verification' | 'none'; label: string; reason: string; shipmentId?: string };
  notes: string[];
}

const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const nations = new Set(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const empty = (reason: string): DeliveryGoalTrace => ({ available: false, reason, credited: 0, remaining: 0,
  production: null, warehouse: null, reserved: null, inTransit: null, receipts: [], relatedShipments: [],
  nextStep: { kind: 'none', label: '기록 확인 필요', reason }, notes: [] });

function regionalView(input: DeliveryGoalTraceInput): { model: RegionalLogisticsPresentation | null; reason: string | null } {
  const source = input.regional;
  if (!source) return { model: null, reason: '지역 수송 자료가 연결되지 않아 현재 창고·수송량과 도착 상세를 확인할 수 없습니다.' };
  const { context, state } = source;
  if (!context || !state || state.version !== 1 || context.nationId !== input.context.nationId || context.week !== input.context.week
    || !integer(context.factories) || !Array.isArray(context.territories) || !Array.isArray(context.playableTerritoryIds)) {
    return { model: null, reason: '지역 수송의 국가·주차·기초 자료가 맞지 않아 현재 물류와 연결하지 않습니다.' };
  }
  const raw = state.accounts?.[context.nationId];
  if (!raw) return { model: null, reason: '현재 국가의 지역 수송 계정이 없습니다. 없는 창고를 0개로 추정하지 않습니다.' };
  if (!integer(raw.lastReceiptWeek) || !integer(raw.lastTransportWeek) || raw.lastReceiptWeek > context.week || raw.lastTransportWeek > context.week) {
    return { model: null, reason: '지역 수송 결산 시점이 현재 주차와 맞지 않습니다. 미래 상태를 현재 진행에 연결하지 않습니다.' };
  }
  const normalized = normalizeRegionalIndustry(state, context.nationId, context.week);
  if (Object.hasOwn(normalized.quarantinedAccounts, context.nationId)) {
    return { model: null, reason: '격리된 지역 재고 자료입니다. 실제 약속 영수증은 유지하되 현재 물류 수량·연결을 추정하지 않습니다.' };
  }
  const account = normalized.accounts[context.nationId]!;
  if (account.shipments.some((shipment) => shipment.status === 'delivered'
    ? shipment.remainingWeeks !== 0 || shipment.deliveredWeek === null || shipment.deliveredWeek < shipment.reservedWeek + REGIONAL_TRANSPORT_WEEKS
      || (shipment.closedWeek !== undefined && shipment.closedWeek !== shipment.deliveredWeek)
    : shipment.deliveredWeek !== null)) return { model: null, reason: '수송 원장의 도착 상태·진행 단계·주차가 상충하여 연결을 보류합니다.' };
  const model = buildRegionalLogisticsPresentation(normalized, context);
  if (model.totals.some((row) => ![row.warehouse, row.reserved, row.inTransit, row.deliveredThisWeek].every(integer))) {
    return { model: null, reason: '지역 물량 합계가 안전한 정수 범위를 벗어나 현재 수량을 표시하지 않습니다.' };
  }
  return { model, reason: null };
}

function traceReceipt(receipt: StaffDeliveryReceipt, model: RegionalLogisticsPresentation | null): DeliveryGoalReceiptTrace {
  const base = { receipt: { ...receipt }, shipmentId: null };
  if (receipt.source === 'factory-completed') return { ...base, linkReason: '실제 공장 완료 영수증입니다. 창고에서 생산 묶음이 혼합되므로 특정 수송에 귀속하지 않습니다.' };
  if (receipt.source === 'national-direct') return { ...base, linkReason: '국가 직납 영수증입니다. 지역 수송을 거친 것으로 표시하지 않습니다.' };
  if (!model) return { ...base, linkReason: '도착 실적은 저장 영수증에 남아 있지만 현재 수송 원장을 확인할 수 없어 상세 연결은 제공하지 않습니다.' };
  // Both adapters prefix their stable ID. Construct the exact known identity; never parse by names, quantity or suffix.
  const matching = model.rows.filter((row) => receipt.id === `arrival:${receipt.nationId}:arrival:${model.nationKey}:${row.id}`);
  if (matching.length !== 1) return { ...base, linkReason: '정확히 일치하는 수송 원본이 없습니다. 기록 압축·미연결 등 원인은 단정하지 않으며 저장된 실적은 유지합니다.' };
  const row = matching[0];
  if (row.nationKey !== receipt.nationId || row.status !== 'delivered' || row.equipmentKey !== receipt.equipmentKey
    || row.quantity !== receipt.quantity || row.deliveredWeek !== receipt.week || row.remainingSteps !== 0
    || row.deliveredWeek < row.reservedWeek + REGIONAL_TRANSPORT_WEEKS) {
    return { ...base, linkReason: '영수증 ID는 일치하지만 품목·수량·도착 주차·완료 상태가 일치하지 않아 다른 운송으로 대신 연결하지 않습니다.' };
  }
  return { ...base, shipmentId: row.id, originName: row.originName, destinationName: row.destinationName,
    linkReason: '동일 국가·수송 ID·품목·수량·도착 주차가 실제 완료 기록과 일치합니다. 생산 묶음 출처까지 증명하지는 않습니다.' };
}

/** Connect existing evidence only. Reading never creates receipts, advances a pledge or reserves cargo. */
export function buildDeliveryGoalTrace(input: DeliveryGoalTraceInput): DeliveryGoalTrace {
  const { context, pledge } = input;
  if (!context || !integer(context.week) || !nations.has(context.nationId) || !pledge || pledge.nationId !== context.nationId) {
    return empty('약속과 현재 국가·주차가 맞지 않습니다. 다른 국가의 물량이나 담당자로 대체하지 않습니다.');
  }
  if (!Array.isArray(context.staff) || !Array.isArray(context.production) || !Array.isArray(context.lineEquipment)
    || !Array.isArray(context.manageableDepartments) || !context.industryMandate || context.industryMandate.tab !== 'industry'
    || !['direct', 'request', 'report'].includes(context.industryMandate.mode)) return empty('현재 담당 범위와 생산라인 자료를 확인할 수 없습니다.');
  if (context.staff.some((member) => !member || !text(member.id) || !text(member.personId))
    || context.production.some((line) => !line || !text(line.id)) || context.lineEquipment.some((binding) => !binding || !text(binding.lineId))) return empty('담당자·생산라인의 식별 자료를 확인할 수 없습니다.');
  if (!context.manageableDepartments.includes(pledge.department)) return empty('현재 관리 범위 밖의 약속입니다. 담당자·물량 상세를 이 목표에 연결하지 않습니다.');
  const normalized = normalizeStaffDeliveryPledges({ version: 1, lastAdvancedWeek: context.week, pledges: [pledge], diagnostics: [] }, context).pledges[0];
  if (!normalized) return empty('약속의 신원·기한·영수증 기록을 확인할 수 없습니다.');
  const credited = getStaffDeliveryPledgeQuantity(normalized);
  if (!integer(credited)) return empty('영수증 합계가 안전한 정수 수량을 벗어나 집계하지 않습니다.');
  const result: DeliveryGoalTrace = { ...empty(''), available: true, reason: null, credited,
    remaining: Math.max(0, normalized.targetQuantity - credited), notes: [
      '목표 실적은 약속 기간에 인정된 실제 영수증만 셉니다. 생산 완료와 국가 가용 편입을 더해 이중 집계하지 않습니다.',
      '현재 같은 품목의 창고·예약·운송은 참고 현황입니다. 이 약속에 예약되었거나 이 생산라인의 특정 생산 묶음이라고 단정하지 않습니다.',
    ] };
  if (context.phase !== 'nation' || normalized.status === 'void' || normalized.createdWeek > context.week) {
    result.available = false;
    result.reason = normalized.resolution ?? '현재 국정 산업 단계에서 검증 가능한 약속이 아닙니다.';
    result.receipts = normalized.receipts.map((receipt) => traceReceipt(receipt, null));
    result.nextStep = { kind: 'none', label: '검증 불가 기록', reason: result.reason };
    return result;
  }
  if (normalized.status === 'open') {
    const owners = context.staff.filter((member) => member.personId === normalized.personId);
    if (owners.length !== 1 || owners[0].id !== normalized.staffId
      || (owners[0].joinedWeek !== undefined && (!integer(owners[0].joinedWeek) || owners[0].joinedWeek > normalized.createdWeek))) {
      result.available = false;
      result.reason = '현재 담당자의 신원·재임 기간이 유일하게 확인되지 않습니다. 후임·재임용 인물에 자동 연결하지 않습니다.';
      result.receipts = normalized.receipts.map((receipt) => traceReceipt(receipt, null));
      result.nextStep = { kind: 'none', label: '담당 기록 확인 필요', reason: result.reason };
      return result;
    }
  }
  const regional = regionalView(input);
  result.receipts = normalized.receipts.map((receipt) => traceReceipt(receipt, regional.model));
  if (regional.reason) result.notes.push(regional.reason);
  if (normalized.status !== 'open') {
    result.notes.push('이미 종료된 약속입니다. 현재 창고·배치·수송 병목을 과거 결과의 원인으로 연결하지 않습니다.');
    result.nextStep = { kind: 'verification', label: '확정 결과 확인', reason: normalized.resolution ?? '기한에 확정된 결과와 당시 실제 영수증을 확인합니다.' };
    return result;
  }
  const binding = getStaffDeliveryPledgeLines(context).find(({ line, equipmentKey }) => line.id === normalized.lineId && equipmentKey === normalized.equipmentKey);
  if (!binding || !text(binding.line.name) || !integer(binding.line.assigned) || typeof binding.line.efficiency !== 'number'
    || !Number.isFinite(binding.line.efficiency) || binding.line.efficiency < 0 || binding.line.efficiency > 100) {
    result.available = false;
    result.reason = '현재 생산라인의 유일한 품목 연결·배정·효율을 확인할 수 없습니다.';
    result.nextStep = { kind: 'none', label: '생산 기록 확인 필요', reason: result.reason };
    return result;
  }
  result.production = { lineId: binding.line.id, name: binding.line.name, assigned: binding.line.assigned, efficiency: binding.line.efficiency };
  if (regional.model) {
    const total = regional.model.totals.find((row) => row.equipmentKey === normalized.equipmentKey);
    // A real, normalized account exists. An absent totals row means the selected item has zero current material.
    result.warehouse = total?.warehouse ?? 0;
    result.reserved = total?.reserved ?? 0;
    result.inTransit = total?.inTransit ?? 0;
    result.relatedShipments = regional.model.rows.filter((row) => row.equipmentKey === normalized.equipmentKey && (row.status === 'reserved' || row.status === 'in-transit'));
  }
  if (credited >= normalized.targetQuantity || context.week >= normalized.deadlineWeek) {
    result.nextStep = { kind: 'verification', label: '기한 검증 확인', reason: credited >= normalized.targetQuantity
      ? '수량은 충족했지만 기한의 동일 담당자 검증 전에는 성공으로 확정하지 않습니다.'
      : '기한에 도달했습니다. 새 물량으로 이전 기간을 채우지 않고 주간 검증 기록을 확인합니다.' };
  } else if (normalized.metric === 'factory-completed') {
    result.nextStep = { kind: 'production', label: '생산 조건 검토', reason: '이 목표는 공장 완료량입니다. 현재 배정·효율·예산·원료를 확인하고 다음 실제 완료 영수증을 비교합니다.' };
  } else {
    const held = result.relatedShipments.find((row) => row.currentBlocker);
    const reserved = result.relatedShipments.find((row) => row.status === 'reserved');
    const moving = result.relatedShipments.find((row) => row.status === 'in-transit');
    if (held) result.nextStep = { kind: 'records', label: '수송 병목 검토', reason: `같은 품목의 현재 수송 참고: ${held.currentBlocker}`, shipmentId: held.id };
    else if (reserved) result.nextStep = { kind: 'records', label: '출발 예약 확인', reason: '같은 품목의 예약이 있습니다. 출발 조건을 확인하며 예약량은 목표 실적에 포함하지 않습니다.', shipmentId: reserved.id };
    else if ((result.warehouse ?? 0) > 0) result.nextStep = { kind: 'dispatch', label: '창고 출발 조건 검토', reason: '같은 품목의 창고 잔량이 있습니다. 목표에 귀속된 물량은 아니며 별도 검토·예약이 필요합니다.' };
    else if (moving) result.nextStep = { kind: 'records', label: '실제 수송 진행 확인', reason: '같은 품목이 운송 중입니다. 실제 도착 영수증 전에는 목표 실적으로 집계하지 않습니다.', shipmentId: moving.id };
    else result.nextStep = { kind: 'production', label: '생산·입고 조건 검토', reason: '현재 생산·직납·집하 조건을 확인합니다. 기존 국가 비축이나 앞으로의 예상 생산량을 목표 실적으로 대신 채우지 않습니다.' };
  }
  return result;
}
