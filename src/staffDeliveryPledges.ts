import type { NationId, ProductionLine, StaffDepartment, StaffMember, Stockpile } from './types';
import type { RegionalDeliveryReceipt } from './regionalIndustry';
import type { RoleTabMandate } from './roleMandate';
import { postwarStockpileKeys } from './postwarIndustry';
import type { PostwarIndustryReport, PostwarStockpileKey } from './postwarIndustry';

export type StaffDeliveryPledgeMetric = 'factory-completed' | 'national-available';
export type StaffDeliveryPledgeDuration = 2 | 4 | 8;
export type StaffDeliveryPledgeStatus = 'open' | 'succeeded' | 'failed' | 'void';
export const staffDeliveryPledgeDurations = [2, 4, 8] as const;
export const STAFF_DELIVERY_PLEDGE_HISTORY_LIMIT = 120;
export const STAFF_DELIVERY_PLEDGE_OPEN_LIMIT = 4;
export const STAFF_DELIVERY_PLEDGE_MAX_QUANTITY = 1_000_000_000;

export interface StaffDeliveryReceipt {
  /** Stable actual application ID, never a fresh ID generated while rendering. */
  id: string;
  nationId: NationId;
  week: number;
  equipmentKey: PostwarStockpileKey;
  source: 'factory-completed' | 'national-direct' | 'shipment-arrival';
  quantity: number;
  /** Required for factory completion; availability uses the unique equipment mapping. */
  lineId?: string;
}

export interface StaffDeliveryPledge {
  id: string;
  nationId: NationId;
  staffId: string;
  personId: string;
  staffName: string;
  department: StaffDepartment;
  lineId: string;
  lineName: string;
  equipmentKey: PostwarStockpileKey;
  metric: StaffDeliveryPledgeMetric;
  targetQuantity: number;
  durationWeeks: StaffDeliveryPledgeDuration;
  createdWeek: number;
  deadlineWeek: number;
  status: StaffDeliveryPledgeStatus;
  resolvedWeek?: number;
  resolution?: string;
  /** An evidence ledger, not inventory; progress is derived from these actual receipts. */
  receipts: StaffDeliveryReceipt[];
}

export interface StaffDeliveryPledgeState {
  version: 1;
  lastAdvancedWeek: number;
  pledges: StaffDeliveryPledge[];
  diagnostics: string[];
}

export interface StaffDeliveryPledgeContext {
  nationId: NationId;
  /** Current week for creation; arrival week for the one weekly receipt batch. */
  week: number;
  phase: 'war' | 'nation';
  staff: readonly StaffMember[];
  production: readonly ProductionLine[];
  manageableDepartments: readonly StaffDepartment[];
  industryMandate: RoleTabMandate;
  /** Obtain from the authoritative industry report, not names or icon matching. */
  lineEquipment: readonly { lineId: string; equipmentKey: PostwarStockpileKey }[];
}

export interface StaffDeliveryPledgeCommand {
  id: string;
  expectedWeek: number;
  staffId: string;
  personId: string;
  lineId: string;
  metric: StaffDeliveryPledgeMetric;
  targetQuantity: number;
  durationWeeks: StaffDeliveryPledgeDuration;
}

export interface StaffDeliveryPledgeResult {
  state: StaffDeliveryPledgeState;
  applied: boolean;
  reason: string;
  completed: StaffDeliveryPledge[];
}

export interface StaffDeliveryReceiptBatchInput {
  nationId: NationId;
  week: number;
  industryReport: PostwarIndustryReport | null;
  industryApplied: boolean;
  /** Only the APPLIED attribution delta, never combined stock, warehouse, or forecast. */
  nationalDirectDelta?: Partial<Stockpile> | null;
  deliveries: readonly Pick<RegionalDeliveryReceipt, 'id' | 'nationId' | 'week' | 'equipmentKey' | 'quantity'>[];
}

const isWeek = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isQuantity = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= STAFF_DELIVERY_PLEDGE_MAX_QUANTITY;
const isKey = (value: unknown): value is PostwarStockpileKey => postwarStockpileKeys.includes(value as PostwarStockpileKey);
const isMetric = (value: unknown): value is StaffDeliveryPledgeMetric => value === 'factory-completed' || value === 'national-available';
const isDuration = (value: unknown): value is StaffDeliveryPledgeDuration => staffDeliveryPledgeDurations.includes(value as StaffDeliveryPledgeDuration);
const departments: StaffDepartment[] = ['operations', 'logistics', 'armaments', 'personnel', 'political', 'science', 'economy'];

/** Adapt actual settlement results once; preview reports alone cannot create receipts. */
export function buildStaffDeliveryReceipts(input: StaffDeliveryReceiptBatchInput): StaffDeliveryReceipt[] {
  if (!isWeek(input.week)) return [];
  const receipts: StaffDeliveryReceipt[] = [];
  const report = input.industryApplied && input.industryReport?.nationId === input.nationId && input.industryReport.week === input.week ? input.industryReport : null;
  if (report) {
    for (const line of report.perLine) {
      if (!isId(line.lineId) || !isKey(line.stockpileKey) || !isQuantity(line.delivered)
        || report.perLine.filter((candidate) => candidate.lineId === line.lineId).length !== 1) continue;
      receipts.push({ id: `factory:${input.nationId}:${input.week}:${line.lineId}`, nationId: input.nationId, week: input.week, equipmentKey: line.stockpileKey, source: 'factory-completed', quantity: line.delivered, lineId: line.lineId });
    }
    for (const equipmentKey of postwarStockpileKeys) {
      const direct = input.nationalDirectDelta?.[equipmentKey];
      // National attribution cannot exceed the actually produced quantity of this batch.
      if (!isQuantity(direct) || !isQuantity(report.delivered[equipmentKey]) || direct > report.delivered[equipmentKey]) continue;
      receipts.push({ id: `direct:${input.nationId}:${input.week}:${equipmentKey}`, nationId: input.nationId, week: input.week, equipmentKey, source: 'national-direct', quantity: direct });
    }
  }
  const seenDeliveryIds = new Set<string>();
  for (const delivery of input.deliveries) {
    if (!isId(delivery.id) || delivery.nationId !== input.nationId || delivery.week !== input.week || !isKey(delivery.equipmentKey) || !isQuantity(delivery.quantity) || seenDeliveryIds.has(delivery.id)) continue;
    seenDeliveryIds.add(delivery.id);
    receipts.push({ id: `arrival:${input.nationId}:${delivery.id}`, nationId: input.nationId, week: input.week, equipmentKey: delivery.equipmentKey, source: 'shipment-arrival', quantity: delivery.quantity });
  }
  return receipts;
}

export function createStaffDeliveryPledgeState(): StaffDeliveryPledgeState {
  return { version: 1, lastAdvancedWeek: -1, pledges: [], diagnostics: [] };
}

export function getStaffDeliveryPledgeQuantity(pledge: StaffDeliveryPledge): number {
  return pledge.receipts.reduce((sum, receipt) => sum + receipt.quantity, 0);
}

function validReceipt(value: unknown): value is StaffDeliveryReceipt {
  if (!value || typeof value !== 'object') return false;
  const receipt = value as StaffDeliveryReceipt;
  return isId(receipt.id) && isId(receipt.nationId) && isWeek(receipt.week) && isKey(receipt.equipmentKey) && isQuantity(receipt.quantity)
    && ['factory-completed', 'national-direct', 'shipment-arrival'].includes(receipt.source)
    && (receipt.lineId === undefined || isId(receipt.lineId))
    && (receipt.source !== 'factory-completed' || isId(receipt.lineId));
}

function matchesPledge(receipt: StaffDeliveryReceipt, pledge: StaffDeliveryPledge): boolean {
  return receipt.nationId === pledge.nationId && receipt.equipmentKey === pledge.equipmentKey
    && receipt.week > pledge.createdWeek && receipt.week <= pledge.deadlineWeek
    && (pledge.metric === 'factory-completed' ? receipt.source === 'factory-completed' && receipt.lineId === pledge.lineId
      : receipt.source === 'national-direct' || receipt.source === 'shipment-arrival');
}

function compact(state: StaffDeliveryPledgeState): StaffDeliveryPledgeState {
  const finished = state.pledges.filter((pledge) => pledge.status !== 'open')
    .sort((first, second) => (second.resolvedWeek ?? second.createdWeek) - (first.resolvedWeek ?? first.createdWeek))
    .slice(0, STAFF_DELIVERY_PLEDGE_HISTORY_LIMIT);
  const keep = new Set(finished.map((pledge) => pledge.id));
  return { ...state, pledges: state.pledges.filter((pledge) => pledge.status === 'open' || keep.has(pledge.id)), diagnostics: state.diagnostics.slice(-12) };
}

export function getStaffDeliveryPledgeLines(context: StaffDeliveryPledgeContext): Array<{ line: ProductionLine; equipmentKey: PostwarStockpileKey }> {
  return context.production.flatMap((line) => {
    if (context.production.filter((candidate) => candidate.id === line.id).length !== 1) return [];
    const bindings = context.lineEquipment.filter((binding) => binding.lineId === line.id && isKey(binding.equipmentKey));
    if (bindings.length !== 1) return [];
    const equipmentKey = bindings[0].equipmentKey;
    const mappedIds = new Set(context.lineEquipment.filter((binding) => binding.equipmentKey === equipmentKey).map((binding) => binding.lineId));
    if (context.production.filter((candidate) => mappedIds.has(candidate.id)).length !== 1) return [];
    return [{ line, equipmentKey }];
  });
}

function ownerProblem(pledge: StaffDeliveryPledge, context: StaffDeliveryPledgeContext): string | null {
  if (pledge.nationId !== context.nationId) return '국가 이동으로 원래 약속을 종료했습니다. 새 국가나 담당자에게 자동 양도하지 않습니다.';
  if (context.phase !== 'nation') return '국정 산업 적용 구간이 끝나 약속 검증을 종료했습니다.';
  const matches = context.staff.filter((member) => member.id === pledge.staffId);
  const member = matches.length === 1 ? matches[0] : undefined;
  if (!member || member.personId !== pledge.personId || member.department !== pledge.department
    || (member.joinedWeek !== undefined && member.joinedWeek > pledge.createdWeek)) return '담당자가 퇴임·교체되었거나 담당 보직이 바뀌었습니다. 후임자에게 자동 양도하지 않습니다.';
  if (!getStaffDeliveryPledgeLines(context).some(({ line, equipmentKey }) => line.id === pledge.lineId && equipmentKey === pledge.equipmentKey)) return '생산라인 또는 품목의 유일한 연결을 확인할 수 없어 검증을 종료했습니다.';
  return null;
}

/** Optional context reconciles identities only. Loading never consumes receipts or awards success. */
export function normalizeStaffDeliveryPledges(value: unknown, context?: StaffDeliveryPledgeContext): StaffDeliveryPledgeState {
  const fallback = createStaffDeliveryPledgeState();
  if (!value || typeof value !== 'object' || (value as StaffDeliveryPledgeState).version !== 1) return fallback;
  const saved = value as StaffDeliveryPledgeState;
  if (!Array.isArray(saved.pledges)) return fallback;
  const state: StaffDeliveryPledgeState = { version: 1, lastAdvancedWeek: isWeek(saved.lastAdvancedWeek) ? saved.lastAdvancedWeek : -1, pledges: [], diagnostics: Array.isArray(saved.diagnostics) ? saved.diagnostics.filter((note) => typeof note === 'string').slice(-12) : [] };
  const seen = new Set<string>();
  for (const record of saved.pledges) {
    if (!record || !isId(record.id) || seen.has(record.id) || !isId(record.nationId) || !isId(record.staffId) || !isId(record.personId)
      || !isId(record.staffName) || !departments.includes(record.department) || !isId(record.lineId) || !isId(record.lineName) || !isKey(record.equipmentKey)
      || !isMetric(record.metric) || !isQuantity(record.targetQuantity) || !isDuration(record.durationWeeks)
      || !isWeek(record.createdWeek) || record.deadlineWeek !== record.createdWeek + record.durationWeeks
      || !['open', 'succeeded', 'failed', 'void'].includes(record.status) || !Array.isArray(record.receipts)) {
      state.diagnostics.push('복원할 수 없는 약속 항목을 제외했습니다. 인물·물량이나 성과를 추정하지 않았습니다.');
      continue;
    }
    seen.add(record.id);
    const receiptIds = new Set<string>();
    const currentWeek = context && isWeek(context.week) ? context.week : null;
    const futureReceiptCount = currentWeek === null ? 0 : record.receipts.filter((receipt) => validReceipt(receipt) && receipt.week > currentWeek).length;
    const receipts = record.receipts.filter((receipt) => {
      if (!validReceipt(receipt) || !matchesPledge(receipt, record) || receiptIds.has(receipt.id)
        || (currentWeek !== null && receipt.week > currentWeek)) return false;
      receiptIds.add(receipt.id);
      return true;
    }).map((receipt) => ({ ...receipt }));
    let pledge: StaffDeliveryPledge = { ...record, receipts };
    const futureRecord = currentWeek !== null && (futureReceiptCount > 0 || pledge.createdWeek > currentWeek
      || (isWeek(pledge.resolvedWeek) && pledge.resolvedWeek > currentWeek)
      || (pledge.status === 'open' && state.lastAdvancedWeek > currentWeek));
    const invalidHistory = (pledge.status === 'succeeded' || pledge.status === 'failed') && (!isWeek(pledge.resolvedWeek)
      || pledge.resolvedWeek < pledge.deadlineWeek
      || (pledge.status === 'succeeded') !== (getStaffDeliveryPledgeQuantity(pledge) >= pledge.targetQuantity));
    if (futureRecord) {
      pledge = { ...pledge, status: 'void', resolvedWeek: currentWeek!, resolution: '현재 주차보다 미래인 영수증·완료 시점 또는 결산 기준이 있어 검증 불가로 보존합니다. 미래 영수증은 성과에서 제외했으며 재보상하지 않습니다.' };
      state.diagnostics.push(`${record.id}: 현재 주차와 맞지 않는 저장 기록입니다. 미래 영수증 ${futureReceiptCount}건을 제외하고 완료 판정을 무효화했습니다.`);
    } else if (invalidHistory) {
      pledge = { ...pledge, status: 'void', resolution: '기록된 기한·실제 영수증과 완료 판정이 일치하지 않아 검증 불가로 보존합니다.' };
      state.diagnostics.push(`${record.id}: 실제 영수증과 완료 판정 불일치를 확인해 검증 불가로 보존했습니다.`);
    }
    if (context && isWeek(context.week) && pledge.status === 'open') {
      const reason = ownerProblem(pledge, context);
      if (reason) pledge = { ...pledge, status: 'void', resolvedWeek: context.week, resolution: reason };
    }
    state.pledges.push(pledge);
  }
  return compact(state);
}

export function getStaffDeliveryPledgeAvailability(state: StaffDeliveryPledgeState, command: StaffDeliveryPledgeCommand, context: StaffDeliveryPledgeContext): { allowed: boolean; reason: string | null } {
  let reason: string | null = null;
  if (!isWeek(context.week) || command.expectedWeek !== context.week || context.week < state.lastAdvancedWeek) reason = '검토한 주차와 현재 주차가 다릅니다. 최신 조건으로 다시 검토하세요.';
  else if (context.phase !== 'nation') reason = '국정 산업 단계에서만 정량 이행 약속을 기록할 수 있습니다.';
  else if (context.industryMandate.tab !== 'industry' || context.industryMandate.mode !== 'direct') reason = '현재 산업 직접 결재권이 없습니다. 이 화면은 상신이나 권한 위임을 제공하지 않습니다.';
  else if (!isId(command.id) || state.pledges.some((pledge) => pledge.id === command.id)) reason = '이미 처리된 요청이거나 유효한 약속 ID가 없습니다.';
  else if (!isMetric(command.metric) || !isDuration(command.durationWeeks) || !isQuantity(command.targetQuantity)) reason = '양의 정수 목표 수량과 2·4·8주 중 하나를 선택하세요.';
  else {
    const matches = context.staff.filter((member) => member.id === command.staffId);
    const member = matches.length === 1 ? matches[0] : undefined;
    if (!member || !isId(command.personId) || member.personId !== command.personId || (member.joinedWeek !== undefined && member.joinedWeek > context.week)) reason = '현재 재직하는 동일 담당자를 다시 선택하세요.';
    else if (!context.manageableDepartments.includes(member.department)) reason = '해당 담당자는 현재 보직의 직접 인사 관리 범위 밖입니다.';
    else if (!getStaffDeliveryPledgeLines(context).some(({ line }) => line.id === command.lineId)) reason = '현재 생산라인과 품목의 유일한 연결이 필요합니다. 이름으로 생산 출처를 추정하지 않습니다.';
    else if (state.pledges.some((pledge) => pledge.status === 'open' && pledge.nationId === context.nationId && (pledge.lineId === command.lineId || pledge.personId === command.personId))) reason = '이 생산라인 또는 담당자에게 이미 열린 약속이 있습니다. 기존 기한 검증을 먼저 마쳐야 합니다.';
    else if (state.pledges.filter((pledge) => pledge.status === 'open').length >= STAFF_DELIVERY_PLEDGE_OPEN_LIMIT) reason = `동시에 관리할 수 있는 열린 약속은 ${STAFF_DELIVERY_PLEDGE_OPEN_LIMIT}개입니다.`;
  }
  return { allowed: reason === null, reason };
}

export function createStaffDeliveryPledge(value: StaffDeliveryPledgeState, command: StaffDeliveryPledgeCommand, context: StaffDeliveryPledgeContext): StaffDeliveryPledgeResult {
  const state = normalizeStaffDeliveryPledges(value, context);
  const availability = getStaffDeliveryPledgeAvailability(state, command, context);
  if (!availability.allowed) return { state, applied: false, reason: availability.reason!, completed: [] };
  const member = context.staff.find((person) => person.id === command.staffId)!;
  const binding = getStaffDeliveryPledgeLines(context).find(({ line }) => line.id === command.lineId)!;
  const pledge: StaffDeliveryPledge = {
    id: command.id, nationId: context.nationId, staffId: member.id, personId: member.personId, staffName: member.name, department: member.department,
    lineId: binding.line.id, lineName: binding.line.name, equipmentKey: binding.equipmentKey, metric: command.metric,
    targetQuantity: command.targetQuantity, durationWeeks: command.durationWeeks, createdWeek: context.week, deadlineWeek: context.week + command.durationWeeks,
    status: 'open', receipts: [],
  };
  return { state: compact({ ...state, pledges: [pledge, ...state.pledges] }), applied: true, reason: '약속 기록을 만들었습니다. 비용·생산·인물 수치·성과 보상은 적용하지 않았습니다.', completed: [] };
}

/** Call once AFTER factory, direct-stock and transport-arrival settlement have all finished. */
export function advanceStaffDeliveryPledges(value: StaffDeliveryPledgeState, context: StaffDeliveryPledgeContext, actualReceipts: readonly StaffDeliveryReceipt[]): StaffDeliveryPledgeResult {
  const original = normalizeStaffDeliveryPledges(value);
  const state = normalizeStaffDeliveryPledges(original, context);
  const newlyVoided = state.pledges.filter((pledge) => pledge.status === 'void' && original.pledges.some((previous) => previous.id === pledge.id && previous.status === 'open'));
  if (!isWeek(context.week) || context.week <= state.lastAdvancedWeek) return { state, applied: newlyVoided.length > 0, reason: '이미 처리한 주차입니다. 영수증과 성과를 다시 집계하지 않습니다.', completed: newlyVoided };
  const batch = actualReceipts.filter((receipt) => validReceipt(receipt) && receipt.week <= context.week && receipt.week > state.lastAdvancedWeek);
  const completed = [...newlyVoided];
  const pledges = state.pledges.map((pledge) => {
    if (pledge.status !== 'open') return pledge;
    const ids = new Set(pledge.receipts.map((receipt) => receipt.id));
    const receipts = [...pledge.receipts];
    for (const receipt of batch) {
      if (!matchesPledge(receipt, pledge) || ids.has(receipt.id)) continue;
      ids.add(receipt.id);
      receipts.push({ ...receipt });
    }
    const updated: StaffDeliveryPledge = { ...pledge, receipts };
    if (context.week >= pledge.deadlineWeek) {
      const quantity = getStaffDeliveryPledgeQuantity(updated);
      updated.status = quantity >= pledge.targetQuantity ? 'succeeded' : 'failed';
      updated.resolvedWeek = context.week;
      updated.resolution = `기한 내 실제 영수증 ${quantity} / 목표 ${pledge.targetQuantity}. ${updated.status === 'succeeded' ? '목표를 충족했습니다.' : '목표에 미달했습니다.'} 기록만 확정하며 추가 보상·벌점은 없습니다.`;
      completed.push(updated);
    }
    return updated;
  });
  return { state: compact({ ...state, lastAdvancedWeek: context.week, pledges }), applied: true, reason: '실제 영수증을 한 번 집계했습니다. 약속은 물량을 생산하거나 예약하지 않습니다.', completed };
}

export interface StaffDeliveryPledgeForecast {
  factoryPerWeek: number | null;
  nationalDirectPerWeek: number | null;
  simplePeriodTotal: number | null;
  explanation: string;
}

export function deriveStaffDeliveryPledgeForecast(command: Pick<StaffDeliveryPledgeCommand, 'lineId' | 'metric' | 'durationWeeks'>, context: StaffDeliveryPledgeContext, forecast?: PostwarIndustryReport | null, routedEquipmentKey?: PostwarStockpileKey): StaffDeliveryPledgeForecast {
  const binding = getStaffDeliveryPledgeLines(context).find(({ line }) => line.id === command.lineId);
  const currentForecast = forecast?.nationId === context.nationId && forecast.week === context.week + 1 ? forecast : null;
  const entry = currentForecast?.perLine.find((line) => line.lineId === command.lineId && line.stockpileKey === binding?.equipmentKey);
  const factoryPerWeek = entry && Number.isFinite(entry.delivered) && entry.delivered >= 0 ? Math.floor(entry.delivered)
    : currentForecast && binding?.line.assigned === 0 ? 0 : null;
  const routed = Boolean(binding && routedEquipmentKey === binding.equipmentKey);
  const nationalDirectPerWeek = factoryPerWeek === null ? null : routed ? 0 : factoryPerWeek;
  const chosen = command.metric === 'factory-completed' ? factoryPerWeek : nationalDirectPerWeek;
  return {
    factoryPerWeek, nationalDirectPerWeek,
    simplePeriodTotal: chosen === null || !isDuration(command.durationWeeks) ? null : chosen * command.durationWeeks,
    explanation: factoryPerWeek === null ? '다음 주와 일치하는 생산 전망이 없습니다. 계획량을 실제 완료량처럼 채우지 않습니다.'
      : command.metric === 'factory-completed' ? '현재 예산·원료·배치가 유지된다는 단순 환산입니다. 이후 부족이나 변경에 따라 실제 생산은 달라집니다.'
        : routed ? '선택 품목은 집하창고를 거칩니다. 신규 생산의 국가 직납 전망은 0이며 실제 배송 도착량은 이 예측에 포함하지 않습니다.'
          : '현재 조건의 신규 국가 직납만 단순 환산합니다. 이전 창고 생산의 실제 도착은 검증 때 포함하지만 이 예측에는 포함하지 않습니다.',
  };
}
