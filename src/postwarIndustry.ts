import type { GameState, NationId, ProductionLine, Stockpile } from './types';

export type PostwarIndustryPolicyId = 'balanced' | 'production' | 'maintenance';

export const postwarIndustryPolicyDefinitions = {
  balanced: { label: '균형 가동', description: '표준 속도와 자원 투입으로 생산선을 가동합니다.', outputMultiplier: 1, resourceMultiplier: 1, manufacturingMultiplier: 1, operatingCostPerFactory: 0.08 },
  production: { label: '생산 집중', description: '납품 상한을 높이는 대신 단위 자원·운영비가 증가합니다.', outputMultiplier: 1.25, resourceMultiplier: 1.15, manufacturingMultiplier: 1.1, operatingCostPerFactory: 0.1 },
  maintenance: { label: '설비 보존', description: '생산 속도를 낮추고 자원을 절약합니다. 공장 운영 방침이며 무기 정비·준비도를 변경하지 않습니다.', outputMultiplier: 0.65, resourceMultiplier: 0.8, manufacturingMultiplier: 0.85, operatingCostPerFactory: 0.09 },
} as const;

export const POSTWAR_INDUSTRY_SECURITY_SHARE = 0.5;
export const postwarStockpileKeys = ['infantryEquipment', 'tanks', 'aircraft', 'convoys', 'artillery', 'trucks'] as const;

export type PostwarStockpileKey = typeof postwarStockpileKeys[number];
type StockpileKey = PostwarStockpileKey;
export type PostwarIndustryBottleneck = 'inactive' | 'factories' | 'fuel' | 'steel' | 'budget';

export interface PostwarIndustryLineReport {
  lineId: string;
  stockpileKey: PostwarStockpileKey;
  name: string;
  assignedFactories: number;
  efficiency: number;
  planned: number;
  delivered: number;
  fuelUsed: number;
  steelUsed: number;
  manufacturingCost: number;
  operatingCost: number;
}

export interface PostwarIndustryInput {
  /** Arrival/settlement week: pass nextWeek, not the week being left. */
  week: number;
  nationId: NationId;
  production: readonly ProductionLine[];
  game: Pick<GameState, 'factories' | 'fuel' | 'steel' | 'treasury'>;
  stockpile: Stockpile;
  spendingLevel: number;
  securityBudgetPercent: number;
  policy?: PostwarIndustryPolicyId;
  /** Additional cash explicitly authorized by the player. Defaults to zero. */
  extraTreasuryAllowance?: number;
}

export interface PostwarIndustryReport {
  week: number;
  nationId: NationId;
  policy: PostwarIndustryPolicyId;
  activeFactories: number;
  perLine: PostwarIndustryLineReport[];
  potentialDelivery: Stockpile;
  delivered: Stockpile;
  deliveryRatio: number;
  bottlenecks: PostwarIndustryBottleneck[];
  securityBaseBudget: number;
  industryBudgetShare: number;
  includedIndustryBudget: number;
  includedBudgetUsed: number;
  additionalTreasuryAllowance: number;
  additionalTreasuryCost: number;
  operatingCost: number;
  manufacturingCost: number;
  totalCost: number;
  requestedCost: number;
  fuelRequired: number;
  steelRequired: number;
  fuelUsed: number;
  steelUsed: number;
  projectedStockpile: Stockpile;
  projectedResources: Pick<GameState, 'fuel' | 'steel' | 'treasury'>;
  summary: string;
}

export interface PostwarIndustryState {
  version: 1;
  nationId: NationId;
  lastSettledWeek: number;
  lastReport: PostwarIndustryReport | null;
}

export interface PostwarIndustryAdvanceResult {
  state: PostwarIndustryState;
  report: PostwarIndustryReport | null;
  applied: boolean;
  gameDelta: Pick<GameState, 'fuel' | 'steel' | 'treasury'>;
  stockpileDelta: Stockpile;
}

// Game abstractions, not historical prices or industrial engineering estimates.
// output is the existing five-factory weekly baseline; resources use game K units,
// manufacturing/operation costs use the game's M-money unit. No legacy free output.
const lineKeys: Record<string, StockpileKey> = {
  rifle: 'infantryEquipment', sherman: 'tanks', spitfire: 'aircraft',
  convoy: 'convoys', artillery: 'artillery', truck: 'trucks',
};
/** Identity does not disappear when a factory is paused or receives no weekly output. */
export function getPostwarProductionLineEquipment(production: readonly ProductionLine[]) {
  return production.filter((line, index, all) => Object.hasOwn(lineKeys, line.id) && all.findIndex((other) => other.id === line.id) === index)
    .map((line) => ({ lineId: line.id, equipmentKey: lineKeys[line.id] }));
}
export const postwarIndustryUnitCosts: Record<StockpileKey, { fuel: number; steel: number; manufacturing: number }> = {
  infantryEquipment: { fuel: 0.00005, steel: 0.0002, manufacturing: 0.0005 },
  tanks: { fuel: 0.006, steel: 0.018, manufacturing: 0.018 },
  aircraft: { fuel: 0.007, steel: 0.015, manufacturing: 0.022 },
  convoys: { fuel: 0.02, steel: 0.08, manufacturing: 0.08 },
  artillery: { fuel: 0.003, steel: 0.01, manufacturing: 0.012 },
  trucks: { fuel: 0.0015, steel: 0.004, manufacturing: 0.006 },
};

const nonnegative = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Number(value.toFixed(6));
const zeroStockpile = (): Stockpile => ({ infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 });
const normalizedWeek = (week: number) => Math.floor(nonnegative(week));

export function createPostwarIndustryState(nationId: NationId, currentWeek = 0): PostwarIndustryState {
  return { version: 1, nationId, lastSettledWeek: normalizedWeek(currentWeek), lastReport: null };
}

export function normalizePostwarIndustryState(value: unknown, nationId: NationId, currentWeek: number): PostwarIndustryState {
  const fallback = createPostwarIndustryState(nationId, currentWeek);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<PostwarIndustryState>;
  if (candidate.version !== 1 || candidate.nationId !== nationId
    || !Number.isInteger(candidate.lastSettledWeek) || (candidate.lastSettledWeek ?? -1) < 0) return fallback;
  // Preserve a valid settlement watermark even if the caller inspects an older
  // week; lowering it would allow already delivered goods to be generated again.
  const lastSettledWeek = candidate.lastSettledWeek!;
  const report = candidate.lastReport;
  const numericReportFields: Array<keyof PostwarIndustryReport> = ['activeFactories', 'deliveryRatio', 'securityBaseBudget', 'industryBudgetShare', 'includedIndustryBudget', 'includedBudgetUsed', 'additionalTreasuryAllowance', 'additionalTreasuryCost', 'operatingCost', 'manufacturingCost', 'totalCost', 'requestedCost', 'fuelRequired', 'steelRequired', 'fuelUsed', 'steelUsed'];
  const validReport = report && report.nationId === nationId && report.week === lastSettledWeek
    && Object.hasOwn(postwarIndustryPolicyDefinitions, report.policy)
    && numericReportFields.every((key) => typeof report[key] === 'number' && Number.isFinite(report[key]))
    && [report.potentialDelivery, report.delivered, report.projectedStockpile].every((stock) => stock && postwarStockpileKeys.every((key) => Number.isFinite(stock[key]) && stock[key] >= 0))
    && report.projectedResources && ['fuel', 'steel', 'treasury'].every((key) => Number.isFinite(report.projectedResources[key as keyof typeof report.projectedResources]))
    && Array.isArray(report.perLine) && Array.isArray(report.bottlenecks) && typeof report.summary === 'string';
  return { version: 1, nationId, lastSettledWeek, lastReport: validReport ? structuredClone(report) : null };
}

/** Pure preview. The existing public-spending envelope is allocated, never charged again. */
export function forecastPostwarIndustry(input: PostwarIndustryInput): PostwarIndustryReport {
  const week = normalizedWeek(input.week);
  const policy = input.policy && Object.hasOwn(postwarIndustryPolicyDefinitions, input.policy) ? input.policy : 'balanced';
  const definition = postwarIndustryPolicyDefinitions[policy];
  const seen = new Set<string>();
  const lines = input.production.filter((line) => {
    if (!Object.hasOwn(lineKeys, line.id) || seen.has(line.id) || nonnegative(line.assigned) === 0
      || nonnegative(line.efficiency) === 0 || nonnegative(line.output) === 0) return false;
    seen.add(line.id);
    return true;
  });
  const assigned = lines.reduce((sum, line) => sum + nonnegative(line.assigned), 0);
  const availableFactories = nonnegative(input.game.factories);
  const factoryRatio = assigned > 0 ? Math.min(1, availableFactories / assigned) : 0;
  const activeFactories = Math.min(assigned, availableFactories);
  const potentialDelivery = zeroStockpile();
  lines.forEach((line) => {
    potentialDelivery[lineKeys[line.id]] = Math.floor(nonnegative(line.output) * nonnegative(line.assigned) / 5
      * clamp(nonnegative(line.efficiency), 0, 100) / 100 * factoryRatio * definition.outputMultiplier);
  });
  const costFor = (stock: Stockpile, field: 'fuel' | 'steel' | 'manufacturing') => postwarStockpileKeys.reduce((sum, key) => sum + stock[key] * postwarIndustryUnitCosts[key][field], 0);
  const fuelRequired = costFor(potentialDelivery, 'fuel') * definition.resourceMultiplier;
  const steelRequired = costFor(potentialDelivery, 'steel') * definition.resourceMultiplier;
  const potentialManufacturingCost = costFor(potentialDelivery, 'manufacturing') * definition.manufacturingMultiplier;
  const potentialOperatingCost = potentialManufacturingCost > 0 ? activeFactories * definition.operatingCostPerFactory : 0;
  const requestedCost = potentialManufacturingCost + potentialOperatingCost;
  const fuelAvailable = nonnegative(input.game.fuel);
  const steelAvailable = nonnegative(input.game.steel);
  const treasuryAvailable = nonnegative(input.game.treasury);
  // nationManagement already charges spendingLevel * .78. Only half its security
  // allocation is available here; policing, intelligence, etc. retain the other half.
  const securityBaseBudget = clamp(nonnegative(input.spendingLevel), 0, 100) * 0.78 * clamp(nonnegative(input.securityBudgetPercent), 0, 100) / 100;
  const includedIndustryBudget = securityBaseBudget * POSTWAR_INDUSTRY_SECURITY_SHARE;
  const additionalTreasuryAllowance = Math.min(treasuryAvailable, nonnegative(input.extraTreasuryAllowance ?? 0));
  const availableBudget = includedIndustryBudget + additionalTreasuryAllowance;
  const budgetRatio = requestedCost > 0 ? Math.min(1, availableBudget / requestedCost) : 0;
  const fuelRatio = fuelRequired > 0 ? Math.min(1, fuelAvailable / fuelRequired) : 1;
  const steelRatio = steelRequired > 0 ? Math.min(1, steelAvailable / steelRequired) : 1;
  const deliveryRatio = Math.min(budgetRatio, fuelRatio, steelRatio);
  const delivered = zeroStockpile();
  postwarStockpileKeys.forEach((key) => { delivered[key] = Math.floor(potentialDelivery[key] * deliveryRatio); });
  const manufacturingCost = costFor(delivered, 'manufacturing') * definition.manufacturingMultiplier;
  const realizedShare = potentialManufacturingCost > 0 ? manufacturingCost / potentialManufacturingCost : 0;
  const operatingCost = potentialOperatingCost * realizedShare;
  const totalCost = Math.min(availableBudget, manufacturingCost + operatingCost);
  const includedBudgetUsed = Math.min(includedIndustryBudget, totalCost);
  const additionalTreasuryCost = Math.min(additionalTreasuryAllowance, Math.max(0, totalCost - includedBudgetUsed));
  const fuelUsed = Math.min(fuelAvailable, costFor(delivered, 'fuel') * definition.resourceMultiplier);
  const steelUsed = Math.min(steelAvailable, costFor(delivered, 'steel') * definition.resourceMultiplier);
  const projectedStockpile = zeroStockpile();
  postwarStockpileKeys.forEach((key) => { projectedStockpile[key] = nonnegative(input.stockpile[key]) + delivered[key]; });
  const perLine: PostwarIndustryLineReport[] = lines.map((line) => {
    const key = lineKeys[line.id];
    const unitCost = postwarIndustryUnitCosts[key];
    const lineManufacturingCost = delivered[key] * unitCost.manufacturing * definition.manufacturingMultiplier;
    return {
      lineId: line.id, stockpileKey: key, name: line.name,
      assignedFactories: round(nonnegative(line.assigned) * factoryRatio), efficiency: clamp(nonnegative(line.efficiency), 0, 100),
      planned: potentialDelivery[key], delivered: delivered[key],
      fuelUsed: round(delivered[key] * unitCost.fuel * definition.resourceMultiplier),
      steelUsed: round(delivered[key] * unitCost.steel * definition.resourceMultiplier),
      manufacturingCost: round(lineManufacturingCost),
      operatingCost: round(manufacturingCost > 0 ? operatingCost * lineManufacturingCost / manufacturingCost : 0),
    };
  });
  const bottlenecks: PostwarIndustryBottleneck[] = [];
  if (requestedCost === 0) bottlenecks.push('inactive');
  if (factoryRatio < 1 && assigned > 0) bottlenecks.push('factories');
  if (fuelRatio < 1) bottlenecks.push('fuel');
  if (steelRatio < 1) bottlenecks.push('steel');
  if (budgetRatio < 1 && requestedCost > 0) bottlenecks.push('budget');
  return {
    week, nationId: input.nationId, policy, activeFactories: round(activeFactories), perLine,
    potentialDelivery, delivered, deliveryRatio: round(realizedShare), bottlenecks,
    securityBaseBudget: round(securityBaseBudget), industryBudgetShare: POSTWAR_INDUSTRY_SECURITY_SHARE,
    includedIndustryBudget: round(includedIndustryBudget), includedBudgetUsed: round(includedBudgetUsed),
    // Settlement debits retain their bounded precision: rounding a fractional
    // allowance upward could otherwise spend more cash/material than exists.
    additionalTreasuryAllowance, additionalTreasuryCost,
    operatingCost: round(operatingCost), manufacturingCost: round(manufacturingCost), totalCost: round(totalCost), requestedCost: round(requestedCost),
    fuelRequired: round(fuelRequired), steelRequired: round(steelRequired), fuelUsed, steelUsed,
    projectedStockpile,
    projectedResources: { fuel: fuelAvailable - fuelUsed, steel: steelAvailable - steelUsed, treasury: treasuryAvailable - additionalTreasuryCost },
    summary: requestedCost === 0 ? '유효한 가동 생산선이 없어 납품과 추가 집행이 없습니다.'
      : `${definition.label}: 계획 대비 ${Math.round(realizedShare * 100)}% 납품. 기존 안보예산의 50% 군수몫을 먼저 사용하고, 추가 국고는 허용액·보유현금 한도 안에서만 집행합니다.`,
  };
}

/** Settles only this arrival week; gaps never generate retroactive deliveries. */
export function advancePostwarIndustryWeek(state: PostwarIndustryState | null | undefined, input: PostwarIndustryInput): PostwarIndustryAdvanceResult {
  const normalized = normalizePostwarIndustryState(state, input.nationId, input.week);
  const zeroResult = { state: normalized, report: normalized.lastReport, applied: false, gameDelta: { fuel: 0, steel: 0, treasury: 0 }, stockpileDelta: zeroStockpile() };
  if (!Number.isInteger(input.week) || input.week < 0 || input.week <= normalized.lastSettledWeek) return zeroResult;
  const report = forecastPostwarIndustry(input);
  return {
    state: { version: 1, nationId: input.nationId, lastSettledWeek: input.week, lastReport: report },
    report,
    applied: true,
    gameDelta: { fuel: report.fuelUsed > 0 ? -report.fuelUsed : 0, steel: report.steelUsed > 0 ? -report.steelUsed : 0, treasury: report.additionalTreasuryCost > 0 ? -report.additionalTreasuryCost : 0 },
    stockpileDelta: { ...report.delivered },
  };
}
