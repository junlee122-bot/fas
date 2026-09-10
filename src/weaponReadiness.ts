import type {
  EquipmentCategory,
  EquipmentStats,
  WeaponCategoryReadiness,
  WeaponMaintenanceDoctrine,
  WeaponModernizationPriority,
  WeaponReadinessState,
  WeaponReadinessStatus,
  WeaponReplacementPolicy,
  WeaponWorkOrder,
  WeaponWorkOrderType,
} from './types';

export const weaponCategoryOrder: EquipmentCategory[] = [
  'infantry', 'artillery', 'armor', 'aircraft', 'naval', 'logistics', 'systems', 'strategic',
];

export const weaponMaintenanceDoctrineDefinitions: Record<WeaponMaintenanceDoctrine, {
  label: string;
  summary: string;
  tradeoff: string;
}> = {
  preventive: {
    label: '예방정비 중심',
    summary: '운용 시간을 미리 비워 점검·윤활·부품 교환을 정례화합니다.',
    tradeoff: '상태·신뢰성 우수 · 단기 가동률 상승은 느림',
  },
  'forward-repair': {
    label: '전방 수리 우선',
    summary: '교환 가능한 구성품과 이동정비반을 전선 가까이 배치합니다.',
    tradeoff: '가동 복귀가 빠름 · 예비부품 소모 증가',
  },
  'depot-overhaul': {
    label: '후방 창정비',
    summary: '손상 장비를 후송해 완전분해·재생하고 표준 상태로 재불출합니다.',
    tradeoff: '장기 상태·표준화 우수 · 당장 가동 가능한 수량 감소',
  },
  expedient: {
    label: '전시 응급수리',
    summary: '동류전용과 현장 개조로 당장 움직일 장비를 최대한 확보합니다.',
    tradeoff: '단기 가동률 우수 · 상태·규격·안전성 악화',
  },
};

export const weaponReplacementPolicyDefinitions: Record<WeaponReplacementPolicy, {
  label: string;
  summary: string;
}> = {
  balanced: { label: '균등 세대교체', summary: '전 부대의 결손과 구형화를 비슷한 속도로 해소합니다.' },
  'elite-first': { label: '핵심 편제 우선', summary: '공세·방공·기동의 핵심 부대에 신형 장비와 부품을 먼저 줍니다.' },
  'newest-first': { label: '신형 전환 가속', summary: '구형 생산을 빨리 닫고 최신 제식으로 산업과 교육을 집중합니다.' },
  'reserve-depth': { label: '예비전력 심도', summary: '신형화 속도를 낮추고 수리 가능한 구형 장비와 부품을 넓게 비축합니다.' },
};

export const weaponPriorityLabels: Record<WeaponModernizationPriority, string> = {
  critical: '최우선',
  standard: '표준',
  monitor: '관찰',
};

export const weaponWorkOrderDefinitions: Record<WeaponWorkOrderType, {
  label: string;
  durationWeeks: number;
  treasuryCost: number;
  politicalCost: number;
  commandCost: number;
  summary: string;
  expected: string;
}> = {
  'field-trial': {
    label: '전선 운용시험', durationWeeks: 2, treasuryCost: 8, politicalCost: 1, commandCost: 3,
    summary: '제한 편제에 집중 배치하고 고장·명중·정비 기록을 회수합니다.',
    expected: '실전 신뢰 +12 · 승무원 숙련 +4 · 결함 위험 가시화',
  },
  'depot-rebuild': {
    label: '창정비 재생', durationWeeks: 3, treasuryCost: 18, politicalCost: 1, commandCost: 2,
    summary: '수리 대기 장비를 후방 정비창으로 모아 분해·검사·재불출합니다.',
    expected: '상태 +14 · 가동률 +10 · 수리 적체 −18',
  },
  'parts-standardization': {
    label: '부품 규격 통합', durationWeeks: 4, treasuryCost: 25, politicalCost: 2, commandCost: 1,
    summary: '중복 모델과 부품 번호를 줄이고 공구·정비교범·재고를 통합합니다.',
    expected: '표준화 +18 · 부품일수 +12 · 생산 전환 충격 완화',
  },
  'crew-conversion': {
    label: '운용요원 전환교육', durationWeeks: 3, treasuryCost: 12, politicalCost: 0, commandCost: 5,
    summary: '교관·모의장비·정비교범을 묶어 신형 장비 전환 과정을 운영합니다.',
    expected: '숙련 +15 · 가동률 +5 · 탄약일수 −3',
  },
};

const initialCategoryValues: Record<EquipmentCategory, Omit<WeaponCategoryReadiness, 'category' | 'equipmentId' | 'readinessScore' | 'status'>> = {
  infantry: { operationalAvailability: 78, materialCondition: 72, sparePartsDays: 45, ammunitionDays: 55, crewProficiency: 66, standardization: 68, fieldConfidence: 62, repairBacklog: 22, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
  artillery: { operationalAvailability: 70, materialCondition: 68, sparePartsDays: 38, ammunitionDays: 43, crewProficiency: 61, standardization: 62, fieldConfidence: 58, repairBacklog: 29, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
  armor: { operationalAvailability: 63, materialCondition: 64, sparePartsDays: 31, ammunitionDays: 38, crewProficiency: 58, standardization: 55, fieldConfidence: 55, repairBacklog: 36, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
  aircraft: { operationalAvailability: 61, materialCondition: 63, sparePartsDays: 29, ammunitionDays: 41, crewProficiency: 60, standardization: 58, fieldConfidence: 57, repairBacklog: 39, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
  naval: { operationalAvailability: 66, materialCondition: 67, sparePartsDays: 42, ammunitionDays: 49, crewProficiency: 62, standardization: 59, fieldConfidence: 59, repairBacklog: 34, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
  logistics: { operationalAvailability: 72, materialCondition: 65, sparePartsDays: 35, ammunitionDays: 70, crewProficiency: 60, standardization: 54, fieldConfidence: 61, repairBacklog: 31, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
  systems: { operationalAvailability: 68, materialCondition: 70, sparePartsDays: 34, ammunitionDays: 74, crewProficiency: 55, standardization: 52, fieldConfidence: 51, repairBacklog: 32, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
  strategic: { operationalAvailability: 52, materialCondition: 60, sparePartsDays: 24, ammunitionDays: 25, crewProficiency: 46, standardization: 45, fieldConfidence: 39, repairBacklog: 45, trend: 0, weeksInService: 0, lastReviewWeek: 0 },
};

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, Math.round(value)));

export function calculateWeaponReadinessScore(category: WeaponCategoryReadiness) {
  return clamp(
    category.operationalAvailability * 0.25
      + category.materialCondition * 0.14
      + category.sparePartsDays * 0.12
      + category.ammunitionDays * 0.12
      + category.crewProficiency * 0.14
      + category.standardization * 0.1
      + category.fieldConfidence * 0.13
      - category.repairBacklog * 0.08,
  );
}

export function getWeaponReadinessStatus(score: number): WeaponReadinessStatus {
  if (score >= 72) return 'ready';
  if (score >= 57) return 'watch';
  if (score >= 42) return 'strained';
  return 'grounded';
}

function buildCategory(category: EquipmentCategory, equipmentId: string | undefined): WeaponCategoryReadiness {
  const base = { ...initialCategoryValues[category] };
  const candidate = { category, equipmentId: equipmentId ?? null, ...base, readinessScore: 0, status: 'watch' as WeaponReadinessStatus };
  const readinessScore = calculateWeaponReadinessScore(candidate);
  return { ...candidate, readinessScore, status: getWeaponReadinessStatus(readinessScore) };
}

export function createWeaponReadinessState(fielded: Partial<Record<EquipmentCategory, string>> = {}): WeaponReadinessState {
  const categories = Object.fromEntries(weaponCategoryOrder.map((category) => [category, buildCategory(category, fielded[category])])) as Record<EquipmentCategory, WeaponCategoryReadiness>;
  const priorities = Object.fromEntries(weaponCategoryOrder.map((category) => [category, 'standard'])) as Record<EquipmentCategory, WeaponModernizationPriority>;
  return {
    maintenanceDoctrine: 'preventive',
    replacementPolicy: 'balanced',
    priorities,
    categories,
    workOrders: [],
    history: [],
    lastAdvancedWeek: 0,
  };
}

export function normalizeWeaponReadinessState(
  value: Partial<WeaponReadinessState> | undefined,
  fielded: Partial<Record<EquipmentCategory, string>>,
): WeaponReadinessState {
  const fallback = createWeaponReadinessState(fielded);
  if (!value) return fallback;
  const maintenanceDoctrine = value.maintenanceDoctrine && value.maintenanceDoctrine in weaponMaintenanceDoctrineDefinitions ? value.maintenanceDoctrine : fallback.maintenanceDoctrine;
  const replacementPolicy = value.replacementPolicy && value.replacementPolicy in weaponReplacementPolicyDefinitions ? value.replacementPolicy : fallback.replacementPolicy;
  const priorities = Object.fromEntries(weaponCategoryOrder.map((category) => {
    const priority = value.priorities?.[category];
    return [category, priority && priority in weaponPriorityLabels ? priority : 'standard'];
  })) as Record<EquipmentCategory, WeaponModernizationPriority>;
  const categories = Object.fromEntries(weaponCategoryOrder.map((category) => {
    const base = fallback.categories[category];
    const candidate = value.categories?.[category];
    if (!candidate) return [category, base];
    const normalized: WeaponCategoryReadiness = {
      ...base,
      ...candidate,
      category,
      equipmentId: fielded[category] ?? candidate.equipmentId ?? null,
      operationalAvailability: clamp(candidate.operationalAvailability ?? base.operationalAvailability),
      materialCondition: clamp(candidate.materialCondition ?? base.materialCondition),
      sparePartsDays: clamp(candidate.sparePartsDays ?? base.sparePartsDays, 0, 180),
      ammunitionDays: clamp(candidate.ammunitionDays ?? base.ammunitionDays, 0, 180),
      crewProficiency: clamp(candidate.crewProficiency ?? base.crewProficiency),
      standardization: clamp(candidate.standardization ?? base.standardization),
      fieldConfidence: clamp(candidate.fieldConfidence ?? base.fieldConfidence),
      repairBacklog: clamp(candidate.repairBacklog ?? base.repairBacklog),
      trend: clamp(candidate.trend ?? 0, -20, 20),
      weeksInService: Math.max(0, Math.round(candidate.weeksInService ?? 0)),
      lastReviewWeek: Math.max(0, Math.round(candidate.lastReviewWeek ?? 0)),
      readinessScore: 0,
      status: 'watch',
    };
    normalized.readinessScore = calculateWeaponReadinessScore(normalized);
    normalized.status = getWeaponReadinessStatus(normalized.readinessScore);
    return [category, normalized];
  })) as Record<EquipmentCategory, WeaponCategoryReadiness>;
  const workOrders = Array.isArray(value.workOrders) ? value.workOrders.filter((order): order is WeaponWorkOrder => (
    Boolean(order)
      && weaponCategoryOrder.includes(order.category)
      && order.type in weaponWorkOrderDefinitions
      && (order.status === 'active' || order.status === 'completed')
  )).slice(-24) : [];
  const history = Array.isArray(value.history) ? value.history.filter((entry) => Boolean(entry?.id && entry?.title)).slice(-80) : [];
  return {
    maintenanceDoctrine,
    replacementPolicy,
    priorities,
    categories,
    workOrders,
    history,
    lastAdvancedWeek: Math.max(0, Math.round(value.lastAdvancedWeek ?? 0)),
  };
}

export interface WeaponReadinessWeekContext {
  week: number;
  fieldedByCategory: Partial<Record<EquipmentCategory, string>>;
  equipmentReliability: Partial<Record<EquipmentCategory, number>>;
  equipmentProduction: Partial<Record<EquipmentCategory, number>>;
  equipmentRisk: Partial<Record<EquipmentCategory, number>>;
  productionCoverage: Partial<Record<EquipmentCategory, number>>;
  stockpileCoverage: Partial<Record<EquipmentCategory, number>>;
  assignedModelCount: Partial<Record<EquipmentCategory, number>>;
  operationalTempo: number;
  supplySecurity: number;
  emergencyStockpile: number;
  fuel: number;
  steel: number;
}

export interface WeaponReadinessWeekResult {
  state: WeaponReadinessState;
  averageReadiness: number;
  change: number;
  criticalCategories: EquipmentCategory[];
  completedOrders: WeaponWorkOrder[];
  summary: string;
}

const doctrineEffects: Record<WeaponMaintenanceDoctrine, { availability: number; condition: number; parts: number; backlog: number; standardization: number }> = {
  preventive: { availability: 0.2, condition: 1.1, parts: -0.2, backlog: -0.5, standardization: 0.3 },
  'forward-repair': { availability: 1.3, condition: 0.2, parts: -1.5, backlog: -1.2, standardization: -0.1 },
  'depot-overhaul': { availability: -0.4, condition: 1.8, parts: 0.2, backlog: -1.8, standardization: 0.8 },
  expedient: { availability: 1.8, condition: -1.1, parts: -2, backlog: -0.8, standardization: -1.2 },
};

const priorityFactor: Record<WeaponModernizationPriority, number> = { critical: 1.28, standard: 1, monitor: 0.72 };

function applyCompletedOrder(category: WeaponCategoryReadiness, order: WeaponWorkOrder, risk: number) {
  if (order.type === 'field-trial') return {
    ...category,
    fieldConfidence: clamp(category.fieldConfidence + (risk >= 36 ? 7 : 12)),
    crewProficiency: clamp(category.crewProficiency + 4),
    materialCondition: clamp(category.materialCondition - (risk >= 36 ? 3 : 1)),
    repairBacklog: clamp(category.repairBacklog + (risk >= 36 ? 4 : 1)),
  };
  if (order.type === 'depot-rebuild') return {
    ...category,
    materialCondition: clamp(category.materialCondition + 14),
    operationalAvailability: clamp(category.operationalAvailability + 10),
    repairBacklog: clamp(category.repairBacklog - 18),
  };
  if (order.type === 'parts-standardization') return {
    ...category,
    standardization: clamp(category.standardization + 18),
    sparePartsDays: clamp(category.sparePartsDays + 12, 0, 180),
    repairBacklog: clamp(category.repairBacklog - 6),
  };
  return {
    ...category,
    crewProficiency: clamp(category.crewProficiency + 15),
    operationalAvailability: clamp(category.operationalAvailability + 5),
    ammunitionDays: clamp(category.ammunitionDays - 3, 0, 180),
  };
}

export function advanceWeaponReadinessWeek(state: WeaponReadinessState, context: WeaponReadinessWeekContext): WeaponReadinessWeekResult {
  if (context.week <= state.lastAdvancedWeek) {
    const scores = weaponCategoryOrder.map((category) => state.categories[category].readinessScore);
    const averageReadiness = Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
    return { state, averageReadiness, change: 0, criticalCategories: weaponCategoryOrder.filter((category) => state.categories[category].status === 'grounded'), completedOrders: [], summary: '이번 주 병기 상태가 이미 결산되었습니다.' };
  }
  const previousAverage = weaponCategoryOrder.reduce((total, category) => total + state.categories[category].readinessScore, 0) / weaponCategoryOrder.length;
  const updatedOrders = state.workOrders.map((order) => order.status === 'active'
    ? { ...order, remainingWeeks: Math.max(0, order.remainingWeeks - 1), status: order.remainingWeeks <= 1 ? 'completed' as const : 'active' as const }
    : order);
  const completedOrders = updatedOrders.filter((order) => order.status === 'completed' && state.workOrders.find((previous) => previous.id === order.id)?.status === 'active');
  const doctrine = doctrineEffects[state.maintenanceDoctrine];

  const categories = Object.fromEntries(weaponCategoryOrder.map((category) => {
    const previous = state.categories[category];
    const equipmentId = context.fieldedByCategory[category] ?? previous.equipmentId;
    const changedModel = Boolean(previous.equipmentId && equipmentId && previous.equipmentId !== equipmentId);
    const priority = priorityFactor[state.priorities[category]];
    const reliability = context.equipmentReliability[category] ?? 60;
    const manufacturability = context.equipmentProduction[category] ?? 55;
    const risk = context.equipmentRisk[category] ?? 0;
    const productionCoverage = context.productionCoverage[category] ?? 45;
    const stockpileCoverage = context.stockpileCoverage[category] ?? 45;
    const modelCount = Math.max(1, context.assignedModelCount[category] ?? 1);
    const mixPenalty = Math.max(0, modelCount - 1) * 1.4;
    const tempo = Math.max(0, context.operationalTempo) / 100;
    const fuelSensitive = category === 'armor' || category === 'aircraft' || category === 'naval' || category === 'logistics';
    const fuelPenalty = fuelSensitive ? Math.max(0, 30 - context.fuel) / 15 : 0;
    const steelPenalty = Math.max(0, 24 - context.steel) / 20;
    const supportFlow = (context.supplySecurity + context.emergencyStockpile) / 200;
    const wear = tempo * (2.2 + Math.max(0, 72 - reliability) / 22 + risk / 45);
    const replacementBonus = state.replacementPolicy === 'elite-first' && state.priorities[category] === 'critical'
      ? 1.2
      : state.replacementPolicy === 'newest-first' && changedModel
        ? 1.4
        : state.replacementPolicy === 'reserve-depth'
          ? 0.55
          : 0.8;
    let next: WeaponCategoryReadiness = {
      ...previous,
      equipmentId: equipmentId ?? null,
      operationalAvailability: clamp(previous.operationalAvailability + doctrine.availability * priority + productionCoverage / 75 + replacementBonus - wear - fuelPenalty - mixPenalty / 3),
      materialCondition: clamp(previous.materialCondition + doctrine.condition + reliability / 120 - wear * 0.8 - risk / 80),
      sparePartsDays: clamp(previous.sparePartsDays + supportFlow * 2.4 + manufacturability / 90 + doctrine.parts - tempo * 1.8 - mixPenalty, 0, 180),
      ammunitionDays: clamp(previous.ammunitionDays + stockpileCoverage / 38 + productionCoverage / 90 - tempo * 3.8 - steelPenalty, 0, 180),
      crewProficiency: clamp(previous.crewProficiency + (changedModel ? -9 : 0.45) + tempo * 0.7 - (risk >= 45 ? 0.5 : 0)),
      standardization: clamp(previous.standardization + doctrine.standardization + manufacturability / 160 - mixPenalty - (changedModel ? 10 : 0)),
      fieldConfidence: clamp(previous.fieldConfidence + (tempo > 0.2 ? reliability / 150 - risk / 110 : 0.15) - (changedModel ? 6 : 0)),
      repairBacklog: clamp(previous.repairBacklog + wear * 1.5 + risk / 65 + fuelPenalty - doctrine.backlog * priority - productionCoverage / 110),
      readinessScore: previous.readinessScore,
      status: previous.status,
      trend: 0,
      weeksInService: changedModel ? 1 : previous.weeksInService + 1,
      lastReviewWeek: context.week,
    };
    completedOrders.filter((order) => order.category === category).forEach((order) => {
      next = applyCompletedOrder(next, order, risk);
    });
    const readinessScore = calculateWeaponReadinessScore(next);
    return [category, { ...next, readinessScore, status: getWeaponReadinessStatus(readinessScore), trend: clamp(readinessScore - previous.readinessScore, -20, 20) }];
  })) as Record<EquipmentCategory, WeaponCategoryReadiness>;

  const newHistory = completedOrders.map((order) => ({
    id: `weapon-order-result-${order.id}`,
    week: context.week,
    category: order.category,
    title: weaponWorkOrderDefinitions[order.type].label + ' 완료',
    summary: `${weaponWorkOrderDefinitions[order.type].expected} · 최종 준비도 ${categories[order.category].readinessScore}`,
    outcome: categories[order.category].trend >= 2 ? 'positive' as const : categories[order.category].trend <= -2 ? 'negative' as const : 'mixed' as const,
  }));
  const nextState: WeaponReadinessState = {
    ...state,
    categories,
    workOrders: updatedOrders.slice(-24),
    history: [...state.history, ...newHistory].slice(-80),
    lastAdvancedWeek: context.week,
  };
  const averageReadiness = Math.round(weaponCategoryOrder.reduce((total, category) => total + categories[category].readinessScore, 0) / weaponCategoryOrder.length);
  const change = Math.round(averageReadiness - previousAverage);
  const criticalCategories = weaponCategoryOrder.filter((category) => categories[category].status === 'grounded');
  const summary = criticalCategories.length > 0
    ? `${criticalCategories.length}개 병기 분야가 작전불가 위험입니다. 수리 적체·부품·탄약을 우선 조치하십시오.`
    : `8개 병기 분야 평균 준비도 ${averageReadiness}, 전주 대비 ${change >= 0 ? '+' : ''}${change}입니다.`;
  return { state: nextState, averageReadiness, change, criticalCategories, completedOrders, summary };
}

export function queueWeaponWorkOrder(state: WeaponReadinessState, category: EquipmentCategory, type: WeaponWorkOrderType, week: number) {
  if (state.workOrders.filter((order) => order.status === 'active').length >= 3) return null;
  if (state.workOrders.some((order) => order.status === 'active' && order.category === category && order.type === type)) return null;
  const definition = weaponWorkOrderDefinitions[type];
  const order: WeaponWorkOrder = {
    id: `weapon-order-${week}-${category}-${type}`,
    category,
    type,
    startedWeek: week,
    remainingWeeks: definition.durationWeeks,
    totalWeeks: definition.durationWeeks,
    status: 'active',
  };
  return { ...state, workOrders: [...state.workOrders, order].slice(-24) };
}

export function transitionWeaponReadinessEquipment(state: WeaponReadinessState, category: EquipmentCategory, equipmentId: string, week: number) {
  const previous = state.categories[category];
  if (previous.equipmentId === equipmentId) return state;
  const nextCategory: WeaponCategoryReadiness = {
    ...previous,
    equipmentId,
    crewProficiency: clamp(previous.crewProficiency - 8),
    standardization: clamp(previous.standardization - 10),
    fieldConfidence: clamp(previous.fieldConfidence - 6),
    operationalAvailability: clamp(previous.operationalAvailability - 4),
    weeksInService: 0,
    lastReviewWeek: week,
  };
  nextCategory.readinessScore = calculateWeaponReadinessScore(nextCategory);
  nextCategory.status = getWeaponReadinessStatus(nextCategory.readinessScore);
  return { ...state, categories: { ...state.categories, [category]: nextCategory } };
}

export function getWeaponReadinessAdvice(category: WeaponCategoryReadiness) {
  const candidates = [
    { score: category.operationalAvailability, text: '가동률이 가장 약합니다. 창정비 재생이나 전방 수리 교리를 검토하십시오.' },
    { score: category.sparePartsDays, text: '예비부품 심도가 부족합니다. 부품 규격 통합과 공급선 현지화를 우선하십시오.' },
    { score: category.ammunitionDays, text: '탄약·소모품 지속일수가 짧습니다. 생산 포커스와 비축 우선순위를 조정하십시오.' },
    { score: category.crewProficiency, text: '운용요원 숙련이 병목입니다. 전환교육 후 실전 시험으로 검증하십시오.' },
    { score: category.standardization, text: '혼용 규격이 정비망을 압박합니다. 예비·후계 장비 계보를 정리하십시오.' },
    { score: category.fieldConfidence, text: '실전 자료가 부족합니다. 제한적인 전선 운용시험으로 결함을 먼저 찾으십시오.' },
  ];
  return candidates.reduce((lowest, candidate) => candidate.score < lowest.score ? candidate : lowest).text;
}

type ReadinessMetric = 'operationalAvailability' | 'materialCondition' | 'sparePartsDays' | 'ammunitionDays' | 'crewProficiency' | 'standardization' | 'fieldConfidence';

export interface WeaponCapabilityFamilyDefinition {
  id: string;
  category: EquipmentCategory;
  label: string;
  role: string;
  primaryStat: keyof EquipmentStats;
  secondaryStat: keyof EquipmentStats;
  readinessMetric: ReadinessMetric;
  sustainmentMetric: ReadinessMetric;
}

export interface WeaponCapabilityAssessment extends WeaponCapabilityFamilyDefinition {
  score: number;
  status: 'advantage' | 'credible' | 'gap' | 'absent';
  bottleneck: string;
}

export const weaponCapabilityFamilies: WeaponCapabilityFamilyDefinition[] = [
  { id: 'infantry-rifle', category: 'infantry', label: '개인화기·소총', role: '기본 보병 전투와 대량 충원', primaryStat: 'production', secondaryStat: 'reliability', readinessMetric: 'crewProficiency', sustainmentMetric: 'ammunitionDays' },
  { id: 'infantry-automatic', category: 'infantry', label: '분대 자동화기', role: '제압사격과 근접전 화력', primaryStat: 'firepower', secondaryStat: 'reliability', readinessMetric: 'fieldConfidence', sustainmentMetric: 'ammunitionDays' },
  { id: 'infantry-antitank', category: 'infantry', label: '대전차·폭파', role: '장갑·진지·구조물 대응', primaryStat: 'firepower', secondaryStat: 'range', readinessMetric: 'crewProficiency', sustainmentMetric: 'standardization' },
  { id: 'infantry-support', category: 'infantry', label: '박격포·통신·의무', role: '분대와 대대의 지속전 지원', primaryStat: 'range', secondaryStat: 'mobility', readinessMetric: 'operationalAvailability', sustainmentMetric: 'sparePartsDays' },
  { id: 'artillery-field', category: 'artillery', label: '야전포병', role: '사단 직접·간접 화력', primaryStat: 'firepower', secondaryStat: 'range', readinessMetric: 'crewProficiency', sustainmentMetric: 'ammunitionDays' },
  { id: 'artillery-rocket', category: 'artillery', label: '로켓·대량화력', role: '집중 타격과 지역 제압', primaryStat: 'firepower', secondaryStat: 'production', readinessMetric: 'fieldConfidence', sustainmentMetric: 'ammunitionDays' },
  { id: 'artillery-antitank', category: 'artillery', label: '대전차포·직사', role: '기갑 저지와 화력 거점', primaryStat: 'firepower', secondaryStat: 'mobility', readinessMetric: 'operationalAvailability', sustainmentMetric: 'standardization' },
  { id: 'artillery-airdefense', category: 'artillery', label: '방공포·요격지원', role: '저고도 방공과 중요시설 보호', primaryStat: 'range', secondaryStat: 'reliability', readinessMetric: 'crewProficiency', sustainmentMetric: 'sparePartsDays' },
  { id: 'armor-breakthrough', category: 'armor', label: '돌파 전차', role: '화력·방호로 전선 돌파', primaryStat: 'protection', secondaryStat: 'firepower', readinessMetric: 'operationalAvailability', sustainmentMetric: 'sparePartsDays' },
  { id: 'armor-maneuver', category: 'armor', label: '기동·정찰 장갑', role: '측방기동과 전과 확대', primaryStat: 'mobility', secondaryStat: 'range', readinessMetric: 'crewProficiency', sustainmentMetric: 'materialCondition' },
  { id: 'armor-destroyer', category: 'armor', label: '대전차·구축', role: '적 장갑 집중 대응', primaryStat: 'firepower', secondaryStat: 'range', readinessMetric: 'fieldConfidence', sustainmentMetric: 'ammunitionDays' },
  { id: 'armor-recovery', category: 'armor', label: '구난·공병 장갑', role: '고장 회수와 장애물 개척', primaryStat: 'reliability', secondaryStat: 'production', readinessMetric: 'standardization', sustainmentMetric: 'sparePartsDays' },
  { id: 'air-fighter', category: 'aircraft', label: '제공 전투기', role: '공중우세와 요격', primaryStat: 'mobility', secondaryStat: 'firepower', readinessMetric: 'crewProficiency', sustainmentMetric: 'operationalAvailability' },
  { id: 'air-strike', category: 'aircraft', label: '공격·근접지원', role: '지상·해상 표적 타격', primaryStat: 'firepower', secondaryStat: 'protection', readinessMetric: 'fieldConfidence', sustainmentMetric: 'ammunitionDays' },
  { id: 'air-bomber', category: 'aircraft', label: '폭격·장거리타격', role: '후방 산업·교통망 타격', primaryStat: 'range', secondaryStat: 'firepower', readinessMetric: 'operationalAvailability', sustainmentMetric: 'sparePartsDays' },
  { id: 'air-lift', category: 'aircraft', label: '수송·해상초계', role: '공수보급·정찰·대잠 임무', primaryStat: 'range', secondaryStat: 'reliability', readinessMetric: 'standardization', sustainmentMetric: 'materialCondition' },
  { id: 'naval-escort', category: 'naval', label: '호송·대잠', role: '상선 보호와 잠수함 탐색', primaryStat: 'range', secondaryStat: 'reliability', readinessMetric: 'operationalAvailability', sustainmentMetric: 'sparePartsDays' },
  { id: 'naval-surface', category: 'naval', label: '수상함대 타격', role: '제해권과 함대 결전', primaryStat: 'firepower', secondaryStat: 'protection', readinessMetric: 'crewProficiency', sustainmentMetric: 'ammunitionDays' },
  { id: 'naval-submarine', category: 'naval', label: '잠수함·봉쇄', role: '통상파괴와 은밀 접근', primaryStat: 'range', secondaryStat: 'mobility', readinessMetric: 'fieldConfidence', sustainmentMetric: 'materialCondition' },
  { id: 'naval-amphibious', category: 'naval', label: '항모·상륙지원', role: '원정 항공과 상륙작전', primaryStat: 'range', secondaryStat: 'production', readinessMetric: 'standardization', sustainmentMetric: 'operationalAvailability' },
  { id: 'logistics-rail', category: 'logistics', label: '철도·전략수송', role: '후방에서 전구까지 대량수송', primaryStat: 'range', secondaryStat: 'production', readinessMetric: 'standardization', sustainmentMetric: 'materialCondition' },
  { id: 'logistics-truck', category: 'logistics', label: '차량·말단보급', role: '보급거점에서 전선까지 분배', primaryStat: 'mobility', secondaryStat: 'reliability', readinessMetric: 'operationalAvailability', sustainmentMetric: 'sparePartsDays' },
  { id: 'logistics-recovery', category: 'logistics', label: '정비·구난·공병', role: '손상 장비 회수와 현장 복구', primaryStat: 'reliability', secondaryStat: 'production', readinessMetric: 'crewProficiency', sustainmentMetric: 'standardization' },
  { id: 'logistics-medical', category: 'logistics', label: '의무후송·인력보전', role: '부상자 후송과 숙련 인력 복귀', primaryStat: 'mobility', secondaryStat: 'range', readinessMetric: 'crewProficiency', sustainmentMetric: 'operationalAvailability' },
  { id: 'systems-warning', category: 'systems', label: '조기경보·감시', role: '레이더·관측·경보망', primaryStat: 'range', secondaryStat: 'reliability', readinessMetric: 'fieldConfidence', sustainmentMetric: 'operationalAvailability' },
  { id: 'systems-command', category: 'systems', label: '지휘·통신', role: '제대 간 명령과 상황 공유', primaryStat: 'range', secondaryStat: 'production', readinessMetric: 'standardization', sustainmentMetric: 'crewProficiency' },
  { id: 'systems-firecontrol', category: 'systems', label: '사격통제·유도', role: '표적획득과 명중률 향상', primaryStat: 'firepower', secondaryStat: 'reliability', readinessMetric: 'crewProficiency', sustainmentMetric: 'sparePartsDays' },
  { id: 'systems-ew', category: 'systems', label: '전자전·암호', role: '통신보호·교란·정보우세', primaryStat: 'protection', secondaryStat: 'range', readinessMetric: 'fieldConfidence', sustainmentMetric: 'materialCondition' },
  { id: 'strategic-bombing', category: 'strategic', label: '전략폭격·원거리타격', role: '전구 밖 핵심표적 억제·타격', primaryStat: 'range', secondaryStat: 'firepower', readinessMetric: 'operationalAvailability', sustainmentMetric: 'ammunitionDays' },
  { id: 'strategic-nuclear', category: 'strategic', label: '핵·대량파괴 통제', role: '개발·보관·지휘통제·억제', primaryStat: 'firepower', secondaryStat: 'protection', readinessMetric: 'standardization', sustainmentMetric: 'fieldConfidence' },
  { id: 'strategic-missile', category: 'strategic', label: '미사일·우주체계', role: '장거리 투발·경보·우주지원', primaryStat: 'range', secondaryStat: 'reliability', readinessMetric: 'crewProficiency', sustainmentMetric: 'sparePartsDays' },
  { id: 'strategic-autonomy', category: 'strategic', label: '사이버·자율체계', role: '정보공간과 무인 전력 운용', primaryStat: 'mobility', secondaryStat: 'production', readinessMetric: 'fieldConfidence', sustainmentMetric: 'materialCondition' },
];

const capabilityStatusLabels = {
  advantage: '우세', credible: '신뢰 가능', gap: '전력 공백', absent: '능력 미성숙',
};

export function assessWeaponCapabilityFamilies(
  category: EquipmentCategory,
  readiness: WeaponCategoryReadiness,
  stats?: EquipmentStats,
): WeaponCapabilityAssessment[] {
  const equipmentStats: EquipmentStats = stats ?? { firepower: 18, mobility: 18, protection: 18, range: 18, reliability: 18, production: 18 };
  return weaponCapabilityFamilies.filter((family) => family.category === category).map((family) => {
    const components = [
      { label: family.primaryStat, value: equipmentStats[family.primaryStat] },
      { label: family.secondaryStat, value: equipmentStats[family.secondaryStat] },
      { label: family.readinessMetric, value: readiness[family.readinessMetric] },
      { label: family.sustainmentMetric, value: readiness[family.sustainmentMetric] },
    ];
    const score = clamp(components[0].value * 0.34 + components[1].value * 0.2 + components[2].value * 0.26 + components[3].value * 0.2);
    const status: WeaponCapabilityAssessment['status'] = score >= 76 ? 'advantage' : score >= 59 ? 'credible' : score >= 39 ? 'gap' : 'absent';
    const bottleneckComponent = components.reduce((lowest, component) => component.value < lowest.value ? component : lowest);
    const bottleneckLabels: Record<string, string> = {
      firepower: '화력', mobility: '기동', protection: '방호', range: '작전반경', reliability: '기계 신뢰', production: '생산성',
      operationalAvailability: '가동률', materialCondition: '장비 상태', sparePartsDays: '부품 심도', ammunitionDays: '탄약 심도', crewProficiency: '운용 숙련', standardization: '규격 통일', fieldConfidence: '실전 자료',
    };
    return { ...family, score, status, bottleneck: `${capabilityStatusLabels[status]} · 병목 ${bottleneckLabels[bottleneckComponent.label] ?? bottleneckComponent.label} ${Math.round(bottleneckComponent.value)}` };
  });
}
