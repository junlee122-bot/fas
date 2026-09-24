import { getTerritoryGeography } from './territoryGeography';
import type { Division, DivisionType, Faction, NationId, Stockpile, Territory } from './types';

export const UNIT_EQUIPMENT_ISSUE_RECEIPT_LIMIT = 120;
export const UNIT_EQUIPMENT_ISSUE_MAX_SUPPLY = 10;
export const unitEquipmentIssueLabels = { infantryEquipment: '보병 장비', tanks: '전차' } as const;
export type UnitEquipmentIssueKey = keyof typeof unitEquipmentIssueLabels;
export interface UnitEquipmentIssuePreview {
  divisionId: string; divisionName: string; divisionType: DivisionType;
  territoryId: string; territoryName: string; equipmentKey: UnitEquipmentIssueKey;
  quantity: number; stockBefore: number; stockAfter: number;
  supplyBefore: number; supplyAfter: number; supplyGain: number;
}
export interface UnitEquipmentIssueReceipt extends UnitEquipmentIssuePreview {
  id: string; nationId: NationId; week: number;
}
export interface UnitEquipmentIssueAccount {
  receipts: UnitEquipmentIssueReceipt[];
  /** Never compact this replay fence when old receipts leave the visible history. */
  lastIssuedWeek: Record<string, number>;
}
export interface UnitEquipmentIssueState {
  version: 1;
  accounts: Partial<Record<NationId, UnitEquipmentIssueAccount>>;
  quarantinedAccounts: Partial<Record<NationId, unknown>>;
  /** An unsupported or malformed root cannot silently become an empty usable ledger. */
  quarantinedRoot?: unknown;
}
export interface UnitEquipmentIssueContext {
  nationId: NationId; week: number; playerFaction: Faction;
  divisions: readonly Division[]; territories: readonly Territory[];
  playableTerritoryIds: readonly string[]; stockpile: Stockpile;
  commandableDivisionIds: ReadonlySet<string>; authorized: boolean;
  processingWeek?: boolean; activeDivisionIds?: ReadonlySet<string>; seaBusyDivisionIds?: ReadonlySet<string>;
}
export interface UnitEquipmentIssueReview {
  allowed: boolean; reason: string; reviewKey: string | null;
  preview: UnitEquipmentIssuePreview | null; lastIssuedWeek: number | null;
}
export interface UnitEquipmentIssueCommand { divisionId: string; reviewKey: string }
export interface UnitEquipmentIssueResult {
  applied: boolean; reason: string; state: UnitEquipmentIssueState; stockpile: Stockpile;
  divisions: readonly Division[]; receipt: UnitEquipmentIssueReceipt | null; review: UnitEquipmentIssueReview;
}

const nationIds: NationId[] = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'];
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const percent = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const unitType = (value: unknown): value is DivisionType => ['infantry', 'armor', 'airborne', 'marine'].includes(value as string);
const receiptId = (nationId: NationId, week: number, divisionId: string) => JSON.stringify(['unit-equipment-issue', nationId, week, divisionId]);

export function createUnitEquipmentIssueState(): UnitEquipmentIssueState {
  return { version: 1, accounts: {}, quarantinedAccounts: {} };
}
function validReceipt(value: unknown, nationId: NationId): value is UnitEquipmentIssueReceipt {
  if (!record(value) || value.nationId !== nationId || !integer(value.week) || !text(value.divisionId)
    || value.id !== receiptId(nationId, value.week, value.divisionId) || !text(value.divisionName) || !unitType(value.divisionType)
    || !text(value.territoryId) || !text(value.territoryName) || !percent(value.supplyBefore) || !percent(value.supplyAfter)
    || !integer(value.quantity) || value.quantity === 0 || !integer(value.stockBefore) || !integer(value.stockAfter)) return false;
  const equipmentKey = value.divisionType === 'armor' ? 'tanks' : 'infantryEquipment';
  const expectedSupply = Math.min(100, value.supplyBefore + UNIT_EQUIPMENT_ISSUE_MAX_SUPPLY);
  const supplyGain = expectedSupply - value.supplyBefore;
  const expectedQuantity = Math.ceil(supplyGain * (equipmentKey === 'tanks' ? 2 : 10));
  return value.equipmentKey === equipmentKey && value.supplyAfter === expectedSupply && value.supplyGain === supplyGain
    && supplyGain > 0 && value.quantity === expectedQuantity && value.stockBefore - value.quantity === value.stockAfter;
}
function validAccount(value: unknown, nationId: NationId): value is UnitEquipmentIssueAccount {
  if (!record(value) || !Array.isArray(value.receipts) || !record(value.lastIssuedWeek)
    || !Object.entries(value.lastIssuedWeek).every(([id, week]) => text(id) && integer(week))) return false;
  const ids = new Set<string>();
  return value.receipts.every((receipt) => {
    if (!validReceipt(receipt, nationId) || ids.has(receipt.id) || !own(value.lastIssuedWeek as object, receipt.divisionId)
      || (value.lastIssuedWeek as Record<string, number>)[receipt.divisionId] < receipt.week) return false;
    ids.add(receipt.id);
    return true;
  });
}

/** Legacy saves without this field start empty. Invalid existing data is retained and locked, never credited or repaired. */
export function normalizeUnitEquipmentIssueState(value: unknown): UnitEquipmentIssueState {
  const result = createUnitEquipmentIssueState();
  if (value === undefined) return result;
  if (!record(value) || value.version !== 1 || !record(value.accounts) || !record(value.quarantinedAccounts)) {
    result.quarantinedRoot = value;
    return result;
  }
  if (own(value, 'quarantinedRoot')) result.quarantinedRoot = value.quarantinedRoot ?? null;
  nationIds.forEach((nationId) => {
    if (own(value.quarantinedAccounts as object, nationId)) result.quarantinedAccounts[nationId] = (value.quarantinedAccounts as Record<string, unknown>)[nationId] ?? null;
    if (!own(value.accounts as object, nationId)) return;
    const account = (value.accounts as Record<string, unknown>)[nationId];
    if (!validAccount(account, nationId)) { result.quarantinedAccounts[nationId] = account ?? null; return; }
    result.accounts[nationId] = {
      receipts: account.receipts.map((receipt) => ({ ...receipt })).sort((a, b) => b.week - a.week).slice(0, UNIT_EQUIPMENT_ISSUE_RECEIPT_LIMIT),
      lastIssuedWeek: { ...account.lastIssuedWeek },
    };
  });
  return result;
}

export function getUnitEquipmentIssueReceipts(state: UnitEquipmentIssueState, nationId: NationId, divisionId: string, week: number): UnitEquipmentIssueReceipt[] {
  if (!nationIds.includes(nationId) || !text(divisionId) || !integer(week)) return [];
  const normalized = normalizeUnitEquipmentIssueState(state);
  if (own(normalized, 'quarantinedRoot') || own(normalized.quarantinedAccounts, nationId)) return [];
  const account = normalized.accounts[nationId];
  if (!account || Object.values(account.lastIssuedWeek).some((issuedWeek) => issuedWeek > week)) return [];
  return account.receipts.filter((receipt) => receipt.divisionId === divisionId && receipt.week <= week).map((receipt) => ({ ...receipt }));
}

/** National-depot issue is an explicit local abstraction, not a remote shipment or production-batch claim. */
export function reviewUnitEquipmentIssue(state: UnitEquipmentIssueState, divisionId: string, context: UnitEquipmentIssueContext): UnitEquipmentIssueReview {
  const result: UnitEquipmentIssueReview = { allowed: false, reason: '', reviewKey: null, preview: null, lastIssuedWeek: null };
  const deny = (reason: string) => ({ ...result, reason });
  if (!nationIds.includes(context.nationId) || !integer(context.week)) return deny('현재 국가와 주차를 확인할 수 없습니다.');
  const normalized = normalizeUnitEquipmentIssueState(state);
  if (own(normalized, 'quarantinedRoot') || own(normalized.quarantinedAccounts, context.nationId)) return deny('장비 지급 원장에 검증되지 않은 저장 기록이 있어 집행을 잠갔습니다.');
  const account = normalized.accounts[context.nationId];
  if (account && Object.values(account.lastIssuedWeek).some((week) => week > context.week)) return deny('현재 시점보다 미래의 지급 기록이 있어 집행할 수 없습니다.');
  result.lastIssuedWeek = account && own(account.lastIssuedWeek, divisionId) ? account.lastIssuedWeek[divisionId] : null;
  const matches = context.divisions.filter((division) => division.id === divisionId);
  if (!text(divisionId) || matches.length !== 1) return deny('선택 부대를 정확히 확인할 수 없습니다. 다른 부대로 대체하지 않습니다.');
  const division = matches[0];
  if (!text(division.name) || !unitType(division.type) || !percent(division.supply)) return deny('부대 유형 또는 현재 보급 수치를 확인할 수 없습니다.');
  const sites = context.territories.filter((site) => site.id === division.territoryId);
  if (sites.length !== 1 || !text(sites[0].name)) return deny('부대의 실제 주둔지를 정확히 확인할 수 없습니다.');
  const site = sites[0];
  const equipmentKey = division.type === 'armor' ? 'tanks' : 'infantryEquipment';
  const stockBefore = context.stockpile[equipmentKey];
  if (!integer(stockBefore)) return deny('국가 가용 장비 비축량을 확인할 수 없습니다.');
  const supplyAfter = Math.min(100, division.supply + UNIT_EQUIPMENT_ISSUE_MAX_SUPPLY);
  const supplyGain = supplyAfter - division.supply;
  const quantity = Math.ceil(supplyGain * (equipmentKey === 'tanks' ? 2 : 10));
  result.preview = { divisionId, divisionName: division.name, divisionType: division.type, territoryId: site.id, territoryName: site.name,
    equipmentKey, quantity, stockBefore, stockAfter: stockBefore - quantity, supplyBefore: division.supply, supplyAfter, supplyGain };
  result.reviewKey = JSON.stringify(['unit-equipment-review', context.nationId, context.week, result.preview,
    site.ownerId, site.controller, site.supply, result.lastIssuedWeek]);
  if (!context.authorized || !context.commandableDivisionIds.has(divisionId)) return deny('현재 보직의 직접 지휘권이 있는 예하 부대만 장비 지급을 승인할 수 있습니다.');
  if (context.processingWeek) return deny('주간 결산 중에는 장비 지급을 승인할 수 없습니다.');
  if (!context.playableTerritoryIds.includes(site.id) || site.siteType === 'sea' || site.terrain === '해역' || getTerritoryGeography(site.id)?.kind === 'sea') return deny('현재 시대에 활성화된 육상 주둔지에서만 지급할 수 있습니다.');
  if (site.ownerId !== context.nationId || site.controller !== context.playerFaction || context.playerFaction === 'neutral') return deny('자국 소유이면서 현재 아군이 통제하는 거점으로 복귀해야 합니다. 통행권만으로는 장비를 지급하지 않습니다.');
  if (!percent(site.supply) || site.supply < 50) return deny('주둔지 보급이 50 미만이거나 확인되지 않아 지급할 수 없습니다. 보급 거점을 먼저 확보하세요.');
  if (context.activeDivisionIds?.has(divisionId) || context.seaBusyDivisionIds?.has(divisionId) || !['ready', 'recovering'].includes(division.status)) return deny('이동·교전·진행 중인 명령·해상 수송을 마친 뒤 지급할 수 있습니다.');
  if (result.lastIssuedWeek !== null && result.lastIssuedWeek >= context.week) return deny('이 부대는 이번 주 장비를 이미 지급받았습니다. 다음 주에 다시 검토할 수 있습니다.');
  if (supplyGain <= 0) return deny('부대 보급이 이미 100이므로 추가 지급이 필요하지 않습니다.');
  if (stockBefore < quantity) return deny(`국가 가용 ${unitEquipmentIssueLabels[equipmentKey]} ${quantity}개가 필요하지만 ${stockBefore}개만 있습니다. 지역 창고·수송 중 물자는 사용할 수 없습니다.`);
  return { ...result, allowed: true, reason: '현재 가용 비축을 차감하고 이 부대에 즉시 지급합니다. 승인 전에는 변경하지 않습니다.' };
}

export function issueUnitEquipment(state: UnitEquipmentIssueState, command: UnitEquipmentIssueCommand, context: UnitEquipmentIssueContext): UnitEquipmentIssueResult {
  const review = reviewUnitEquipmentIssue(state, command.divisionId, context);
  const reject = (reason: string): UnitEquipmentIssueResult => ({ applied: false, reason, state, stockpile: context.stockpile, divisions: context.divisions, receipt: null, review });
  if (!review.allowed || !review.preview) return reject(review.reason);
  if (!text(command.reviewKey) || command.reviewKey !== review.reviewKey) return reject('검토 이후 국가·주차·부대·위치·보급 또는 비축이 바뀌었습니다. 바뀐 수량을 자동 집행하지 않고 다시 검토합니다.');
  const next = normalizeUnitEquipmentIssueState(state);
  const account = next.accounts[context.nationId] ?? { receipts: [], lastIssuedWeek: {} };
  const receipt: UnitEquipmentIssueReceipt = { ...review.preview, id: receiptId(context.nationId, context.week, command.divisionId), nationId: context.nationId, week: context.week };
  next.accounts[context.nationId] = { receipts: [receipt, ...account.receipts].slice(0, UNIT_EQUIPMENT_ISSUE_RECEIPT_LIMIT), lastIssuedWeek: { ...account.lastIssuedWeek, [command.divisionId]: context.week } };
  return { applied: true, reason: `${receipt.divisionName}에 ${unitEquipmentIssueLabels[receipt.equipmentKey]} ${receipt.quantity}개를 지급했습니다.`, state: next,
    stockpile: { ...context.stockpile, [receipt.equipmentKey]: receipt.stockAfter },
    divisions: context.divisions.map((division) => division.id === command.divisionId ? { ...division, supply: receipt.supplyAfter } : division), receipt, review };
}
