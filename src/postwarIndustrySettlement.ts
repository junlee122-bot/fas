import type { NationAdvanceResult } from './nationManagement';
import type { GameState } from './types';
import type { PostwarIndustryReport, PostwarIndustryPolicyId } from './postwarIndustry';

export interface PostwarIndustrySettings {
  policy: PostwarIndustryPolicyId;
  extraTreasuryAllowance: number;
}

export const postwarIndustryAllowances = [0, 2, 5, 10] as const;
export function normalizePostwarIndustrySettings(value: unknown): PostwarIndustrySettings {
  const data = value && typeof value === 'object' ? value as Partial<PostwarIndustrySettings> : {};
  return {
    policy: data.policy === 'production' || data.policy === 'maintenance' ? data.policy : 'balanced',
    extraTreasuryAllowance: postwarIndustryAllowances.some((amount) => amount === data.extraTreasuryAllowance) ? data.extraTreasuryAllowance! : 0,
  };
}

/** Existing cash must cover prior fiscal/health commitments before an extra contract. */
export function reservePostwarIndustryResources(game: GameState, base: NationAdvanceResult, healthDelta: Partial<GameState> = {}, pendingDelta: Partial<GameState> = {}) {
  const finite = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  const signedFinite = (value: number | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const available = (key: 'factories' | 'fuel' | 'steel' | 'treasury') => finite(
    finite(game[key]) + signedFinite(base.gameDelta[key]) + signedFinite(healthDelta[key]) + signedFinite(pendingDelta[key]),
  );
  return {
    factories: available('factories'),
    fuel: available('fuel'),
    steel: available('steel'),
    treasury: Math.min(finite(game.treasury), available('treasury')),
  };
}

/** The included security envelope was already paid. Only supplemental cash is new expenditure. */
export function mergePostwarIndustrySettlement(base: NationAdvanceResult, industry: PostwarIndustryReport): NationAdvanceResult {
  if (industry.nationId !== base.state.nationId || industry.week !== base.report.week || base.report.industrySettlement) return base;
  const extra = industry.additionalTreasuryCost;
  const balance = base.report.fiscalBalance - extra;
  const report = {
    ...base.report,
    industrySettlement: { nationId: industry.nationId, week: industry.week, additionalTreasuryCost: extra, includedBudgetUsed: industry.includedBudgetUsed },
    fiscalExpenditure: base.report.fiscalExpenditure + extra,
    fiscalBalance: balance,
    causes: [...base.report.causes, `군수: 기존 안보예산에 포함된 집행 ${industry.includedBudgetUsed.toFixed(3)}M은 재차 차감하지 않음 · 명시적 추가 국고 집행 ${extra.toFixed(3)}M (기준 회계단위)`],
    effects: [...base.report.effects.filter((effect) => !effect.startsWith('재정 ')), `군수 추가 집행 반영 수지 ${balance >= 0 ? '+' : ''}${balance.toFixed(3)}M · 추가집행은 현금 한도 내이며 군수 사유의 자동 차입 없음`],
  };
  return {
    ...base, report,
    state: { ...base.state, reports: [report, ...base.state.reports.filter((item) => item.week !== report.week)] },
    gameDelta: { ...base.gameDelta, treasury: (base.gameDelta.treasury ?? 0) - extra, fuel: (base.gameDelta.fuel ?? 0) - industry.fuelUsed, steel: (base.gameDelta.steel ?? 0) - industry.steelUsed },
  };
}

// Fixed game quotes, not historical market prices. Purchases are explicit immediate orders.
export const postwarMaterialQuotes = {
  fuel: { label: '연료 10K', quantity: 10, cost: 6 },
  steel: { label: '강철 10K', quantity: 10, cost: 4 },
} as const;

export function purchasePostwarMaterial(game: GameState, material: 'fuel' | 'steel', authorized: boolean): GameState | null {
  const quote = postwarMaterialQuotes[material];
  if (!authorized || !quote || !Number.isFinite(game.treasury) || !Number.isFinite(game[material]) || game.treasury < quote.cost) return null;
  return { ...game, treasury: game.treasury - quote.cost, [material]: Math.max(0, game[material]) + quote.quantity };
}
