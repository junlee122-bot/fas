import { canResearchEquipment, getDevelopedEquipment, getEquipmentNode } from './equipment';
import type { ArmsPortfolioState } from './strategicArmsDiplomacy';
import type { Division, EquipmentCategory, EquipmentDevelopmentState, EquipmentNode, GameState, ProductionLine, Stockpile, WeaponWorkOrder } from './types';
import { advanceWeaponReadinessWeek, weaponCategoryOrder, type WeaponReadinessWeekContext, type WeaponReadinessWeekResult } from './weaponReadiness';

export interface PostwarEquipmentContext {
  /** Arrival week, normally game.week + 1. A saved campaign never catches up retrospectively. */
  week: number;
  game: GameState;
  production: ProductionLine[];
  stockpile: Stockpile;
  divisions: Division[];
  armsPortfolio: ArmsPortfolioState;
  researchGain: number;
  /** Actual industrial operating ratio after budget/material limits, not nominal factory capacity. */
  productionCoverageScale?: number;
  /** Optional physical-category delivery ratio; local warehouse/transit is not usable supply. */
  productionCoverageByCategory?: Partial<Record<EquipmentCategory, number>>;
}

export interface PostwarEquipmentResult {
  state: EquipmentDevelopmentState;
  advanced: boolean;
  completedProject: EquipmentNode | null;
  completedOrders: WeaponWorkOrder[];
  gameDelta: Partial<Record<keyof GameState, number>>;
  divisions: Division[];
  readiness: WeaponReadinessWeekResult;
  blockedProjectReason: string | null;
}

const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value: number, maximum = 100) => Math.max(0, Math.min(maximum, finite(value)));
const lineIds: Partial<Record<EquipmentCategory, string>> = {
  infantry: 'rifle', artillery: 'artillery', armor: 'sherman', aircraft: 'spitfire', naval: 'convoy', logistics: 'truck',
};

function readinessContext(state: EquipmentDevelopmentState, context: PostwarEquipmentContext): WeaponReadinessWeekContext {
  const { game, production, stockpile, divisions, armsPortfolio } = context;
  const scale = context.productionCoverageScale === undefined ? 1 : clamp(context.productionCoverageScale, 1);
  const categoryScale = (category: EquipmentCategory) => context.productionCoverageByCategory?.[category] === undefined
    ? scale : clamp(context.productionCoverageByCategory[category]!, 1);
  const equipment = Object.fromEntries(weaponCategoryOrder.map((category) => [category, getDevelopedEquipment(state.fieldedByCategory[category], state)])) as Record<EquipmentCategory, ReturnType<typeof getDevelopedEquipment>>;
  const productionCoverage = Object.fromEntries(weaponCategoryOrder.map((category) => {
    const lineId = lineIds[category];
    const line = lineId ? production.find((candidate) => candidate.id === lineId) : undefined;
    // A stopped/missing physical line supplies nothing. Systems/strategic capability
    // is abstract, but it is still constrained by the same actual operating ratio.
    const nominal = lineId
      ? line && finite(line.assigned) > 0 && finite(line.output) > 0 && finite(line.efficiency) > 0
        ? clamp(line.efficiency * 0.72 + line.assigned * 4)
        : 0
      : category === 'systems'
        ? clamp((finite(game.intelNetwork) + finite(armsPortfolio.capability)) / 2)
        : clamp((finite(armsPortfolio.capability) + finite(armsPortfolio.emergencyStockpile)) / 2);
    return [category, nominal * categoryScale(category)];
  }));
  const stockpileCoverage: Partial<Record<EquipmentCategory, number>> = {
    infantry: clamp(finite(stockpile.infantryEquipment) * 100 / Math.max(200, divisions.filter((division) => division.type !== 'armor').length * 900)),
    artillery: clamp(finite(stockpile.artillery) * 100 / Math.max(80, divisions.length * 90)),
    armor: clamp(finite(stockpile.tanks) * 100 / Math.max(40, divisions.filter((division) => division.type === 'armor').length * 140)),
    aircraft: clamp(finite(stockpile.aircraft) / 18),
    naval: clamp(finite(stockpile.convoys) / 7),
    logistics: clamp(finite(stockpile.trucks) * 100 / Math.max(120, divisions.length * 160)),
    systems: clamp(game.intelNetwork),
    strategic: clamp((finite(armsPortfolio.capability) + finite(game.airPower) + finite(game.navalPower)) / 3),
  };
  return {
    week: context.week,
    fieldedByCategory: state.fieldedByCategory,
    equipmentReliability: Object.fromEntries(weaponCategoryOrder.map((category) => [category, clamp(equipment[category]?.stats.reliability ?? 55)])),
    // The shared lifecycle engine also uses manufacturability as a parts-flow
    // contribution. Constrain that contribution too, not just ammunition coverage.
    equipmentProduction: Object.fromEntries(weaponCategoryOrder.map((category) => [category,
      productionCoverage[category] > 0 ? clamp(equipment[category]?.stats.production ?? 50) * categoryScale(category) : 0,
    ])),
    equipmentRisk: Object.fromEntries(weaponCategoryOrder.map((category) => {
      const item = equipment[category];
      return [category, item && 'risk' in item ? clamp(item.risk) : 0];
    })),
    productionCoverage,
    stockpileCoverage,
    assignedModelCount: {
      infantry: new Set(divisions.filter((division) => division.type !== 'armor').map((division) => state.divisionAssignments[division.id] ?? state.fieldedByCategory.infantry).filter(Boolean)).size || 1,
      armor: new Set(divisions.filter((division) => division.type === 'armor').map((division) => state.divisionAssignments[division.id] ?? state.fieldedByCategory.armor).filter(Boolean)).size || 1,
    },
    operationalTempo: 12,
    supplySecurity: clamp(armsPortfolio.supplySecurity),
    emergencyStockpile: clamp(armsPortfolio.emergencyStockpile),
    fuel: clamp(game.fuel, 200),
    steel: clamp(game.steel, 240),
  };
}

/**
 * Resume existing, prepaid development and readiness work in the civilian phase.
 * No treasury, production deliveries, joint operations, combat or elapsed-year
 * catch-up are applied here. The readiness week marker also guards research.
 */
export function advancePostwarEquipmentWeek(development: EquipmentDevelopmentState, context: PostwarEquipmentContext): PostwarEquipmentResult {
  if (!Number.isInteger(context.week) || context.week < 0 || context.week <= development.readiness.lastAdvancedWeek) {
    const scores = weaponCategoryOrder.map((category) => development.readiness.categories[category].readinessScore);
    return {
      state: development, advanced: false, completedProject: null, completedOrders: [], gameDelta: {}, divisions: context.divisions, blockedProjectReason: null,
      readiness: {
        state: development.readiness,
        averageReadiness: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
        change: 0,
        criticalCategories: weaponCategoryOrder.filter((category) => development.readiness.categories[category].status === 'grounded'),
        completedOrders: [], summary: '이번 주 국정 장비 개발·정비가 이미 결산됐거나 유효한 주차가 아닙니다.',
      },
    };
  }

  let state = development;
  let completedProject: EquipmentNode | null = null;
  let blockedProjectReason: string | null = null;
  const gameDelta: Partial<Record<keyof GameState, number>> = {};
  let divisions = context.divisions;
  if (development.activeProjectId) {
    const project = getEquipmentNode(development.activeProjectId);
    if (!project || !canResearchEquipment(project, development, context.armsPortfolio.nationId) || !Number.isFinite(project.researchCost) || project.researchCost <= 0) {
      blockedProjectReason = '이미 해금됐거나 선행 계보·국가 조건이 맞지 않는 장비 연구 기록을 정리했습니다.';
      state = { ...state, activeProjectId: null, progress: 0 };
    } else {
      const progress = Math.min(project.researchCost, Math.max(0, finite(development.progress)) + Math.max(0, finite(context.researchGain)));
      if (progress >= project.researchCost) {
        completedProject = project;
        state = { ...state, unlockedIds: Array.from(new Set([...state.unlockedIds, project.id])), activeProjectId: null, progress: 0 };
        if (project.category === 'systems') gameDelta.intelNetwork = Math.max(0, Math.min(6, 100 - context.game.intelNetwork));
        if (project.category === 'logistics') divisions = divisions.map((division) => ({ ...division, supply: Math.min(100, division.supply + 5) }));
        if (project.category === 'strategic') {
          gameDelta.warSupport = Math.max(0, Math.min(3, 100 - context.game.warSupport));
          gameDelta.stability = -Math.min(1, Math.max(0, context.game.stability - 20));
        }
      } else {
        state = { ...state, progress };
      }
    }
  }
  const readiness = advanceWeaponReadinessWeek(state.readiness, readinessContext(state, context));
  return {
    state: { ...state, readiness: readiness.state }, advanced: true,
    completedProject, completedOrders: readiness.completedOrders, gameDelta,
    divisions, readiness, blockedProjectReason,
  };
}
