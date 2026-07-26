import type { GameState, Stockpile } from './types';
import type { GeneratedWorldEvent, WorldHistoryCategory, WorldHistoryVariant } from './worldHistory';

export const WORLD_FLASHPOINT_PREFIX = 'world-flashpoint:';
export const WORLD_FLASHPOINT_INTERVAL_WEEKS = 17;

export interface WorldFlashpointSelection {
  entry: GeneratedWorldEvent;
  campaignYear: number;
  historicalHorizon: number;
  resolvedCount: number;
  accelerated: boolean;
}

export interface WorldFlashpointEffects {
  gameDelta: Partial<Record<keyof GameState, number>>;
  stockpileDelta: Partial<Record<keyof Stockpile, number>>;
  relationChange: number;
  tone: 'good' | 'bad' | 'neutral';
  summary: string[];
}

export interface WorldFlashpointForecast extends WorldFlashpointSelection {
  decisionWeek: number;
  weeksUntil: number;
}

const round = (value: number) => Math.round(value);

export function getCampaignYear(week: number) {
  return 1942 + Math.floor(Math.max(0, week) / 52);
}

export function getWorldFlashpointDecisionId(eventId: string, variantId: string, week: number) {
  return `${WORLD_FLASHPOINT_PREFIX}${eventId}:${variantId}:${week}`;
}

export function isWorldFlashpointResolved(eventId: string, completedDecisions: string[]) {
  return completedDecisions.some((decision) => decision.startsWith(`${WORLD_FLASHPOINT_PREFIX}${eventId}:`));
}

function resolvedFlashpointCount(completedDecisions: string[]) {
  return completedDecisions.filter((decision) => decision.startsWith(WORLD_FLASHPOINT_PREFIX)).length;
}

function resolvedFlashpointState(completedDecisions: string[]) {
  const ids = new Set<string>();
  let count = 0;
  let lastEventId: string | null = null;
  let lastWeek = Number.NEGATIVE_INFINITY;
  completedDecisions.forEach((decision) => {
    if (!decision.startsWith(WORLD_FLASHPOINT_PREFIX)) return;
    count += 1;
    const [eventId, , rawWeek] = decision.slice(WORLD_FLASHPOINT_PREFIX.length).split(':');
    if (!eventId) return;
    ids.add(eventId);
    const week = Number(rawWeek);
    if (Number.isFinite(week) && week > lastWeek) {
      lastWeek = week;
      lastEventId = eventId;
    }
  });
  return { ids, count, lastEventId };
}

function historicalHorizonFromCount(week: number, resolvedCount: number) {
  const campaignYear = getCampaignYear(week);
  const accelerationYears = Math.min(6, Math.max(0, Math.floor(Math.log2(resolvedCount + 1)) - 2));
  return campaignYear + accelerationYears;
}

export function getHistoricalHorizon(week: number, completedDecisions: string[]) {
  // Institutional learning can bring a later development forward, but no longer turns every
  // quarterly choice into two whole years of acceleration. The logarithmic ceiling keeps the
  // late-century atlas alive without erasing alternate-history momentum.
  return historicalHorizonFromCount(week, resolvedFlashpointCount(completedDecisions));
}

export function createWorldFlashpointSelection(
  entry: GeneratedWorldEvent,
  week: number,
  completedDecisions: string[],
): WorldFlashpointSelection {
  const campaignYear = getCampaignYear(week);
  const resolvedCount = resolvedFlashpointCount(completedDecisions);
  // Each resolved crisis moves institutions, doctrines and fault lines roughly two years farther
  // than the calendar. This is explicitly surfaced as alternate-history acceleration in the UI.
  const historicalHorizon = getHistoricalHorizon(week, completedDecisions);
  return {
    entry,
    campaignYear,
    historicalHorizon,
    resolvedCount,
    accelerated: entry.event.historicalYear > campaignYear,
  };
}

export function selectNextWorldFlashpoint(
  timeline: GeneratedWorldEvent[],
  week: number,
  completedDecisions: string[],
): WorldFlashpointSelection | null {
  if (week < WORLD_FLASHPOINT_INTERVAL_WEEKS) return null;
  const campaignYear = getCampaignYear(week);
  const resolved = resolvedFlashpointState(completedDecisions);
  const resolvedCount = resolved.count;
  const historicalHorizon = historicalHorizonFromCount(week, resolvedCount);
  const eligible = timeline
    .filter((entry) => !resolved.ids.has(entry.event.id))
    .filter((entry) => entry.event.historicalYear <= historicalHorizon)
    .sort((left, right) => {
      const leftHistoricallyDue = left.event.historicalYear <= campaignYear ? 0 : 1;
      const rightHistoricallyDue = right.event.historicalYear <= campaignYear ? 0 : 1;
      return leftHistoricallyDue - rightHistoricallyDue
        || left.event.historicalYear - right.event.historicalYear
        || left.event.id.localeCompare(right.event.id);
    });
  const lastCategory = resolved.lastEventId
    ? timeline.find((entry) => entry.event.id === resolved.lastEventId)?.event.category
    : undefined;
  const historicallyDue = eligible.filter((entry) => entry.event.historicalYear <= campaignYear);
  const selectionPool = historicallyDue.length > 0 ? historicallyDue : eligible;
  const next = selectionPool.find((entry) => entry.event.category !== lastCategory) ?? selectionPool[0];
  return next ? createWorldFlashpointSelection(next, week, completedDecisions) : null;
}

export function forecastNextWorldFlashpoint(
  timeline: GeneratedWorldEvent[],
  currentWeek: number,
  completedDecisions: string[],
): WorldFlashpointForecast | null {
  let decisionWeek = Math.max(WORLD_FLASHPOINT_INTERVAL_WEEKS, Math.ceil((Math.max(0, currentWeek) + 1) / WORLD_FLASHPOINT_INTERVAL_WEEKS) * WORLD_FLASHPOINT_INTERVAL_WEEKS);
  // The atlas currently reaches 2022. Four hundred quarterly windows cover a full century,
  // while keeping this forecast deterministic and cheap enough to derive during rendering.
  for (let window = 0; window < 400; window += 1) {
    const selection = selectNextWorldFlashpoint(timeline, decisionWeek, completedDecisions);
    if (selection) {
      return {
        ...selection,
        decisionWeek,
        weeksUntil: Math.max(0, decisionWeek - currentWeek),
      };
    }
    decisionWeek += WORLD_FLASHPOINT_INTERVAL_WEEKS;
  }
  return null;
}

function categoryDelta(category: WorldHistoryCategory): Partial<Record<keyof GameState, number>> {
  if (category === 'proxy-war') return { commandPoints: 2, fuel: -4, navalPower: 1, enemyPressure: 2 };
  if (category === 'economy') return { treasury: 18, factories: 1 };
  if (category === 'technology' || category === 'space') return { airPower: 2, steel: -3 };
  if (category === 'intelligence') return { intelNetwork: 4, politicalPower: 1 };
  if (category === 'public-health') return { stability: 2, manpower: 8 };
  if (category === 'nuclear') return { warSupport: 2, intelNetwork: 1, stability: -1 };
  if (category === 'world-order' || category === 'decolonization') return { politicalPower: 2 };
  return {};
}

function combineDelta(...deltas: Partial<Record<keyof GameState, number>>[]) {
  const combined: Partial<Record<keyof GameState, number>> = {};
  deltas.forEach((delta) => {
    (Object.entries(delta) as [keyof GameState, number][]).forEach(([key, value]) => {
      combined[key] = (combined[key] ?? 0) + value;
    });
  });
  return combined;
}

function describeEffects(gameDelta: Partial<Record<keyof GameState, number>>, stockpileDelta: Partial<Record<keyof Stockpile, number>>, relationChange: number) {
  const labels: Array<[keyof GameState, string, string]> = [
    ['treasury', '국고', '£'], ['stability', '안정도', ''], ['warSupport', '전쟁 지지', ''], ['politicalPower', '정치력', ''],
    ['enemyPressure', '적 압력', ''], ['fuel', '연료', ''], ['navalPower', '해군력', ''], ['airPower', '공군력', ''],
    ['intelNetwork', '정보망', ''], ['commandPoints', '지휘점수', ''], ['factories', '공장', ''], ['manpower', '인력', ''],
  ];
  const summary = labels.flatMap(([key, label, prefix]) => {
    const value = gameDelta[key];
    return value ? [`${label} ${value > 0 ? '+' : ''}${prefix}${value}`] : [];
  });
  const convoyDelta = stockpileDelta.convoys ?? 0;
  if (convoyDelta) summary.push(`수송선 ${convoyDelta > 0 ? '+' : ''}${convoyDelta}`);
  if (relationChange) summary.push(`전체 외교관계 ${relationChange > 0 ? '+' : ''}${relationChange}`);
  return summary;
}

export function deriveWorldFlashpointEffects(eventId: string, category: WorldHistoryCategory, variant: WorldHistoryVariant): WorldFlashpointEffects {
  const metrics = variant.metricDelta;
  const systemicDelta: Partial<Record<keyof GameState, number>> = {
    treasury: round((metrics.prosperity ?? 0) * 6),
    stability: round((metrics.rights ?? 0) * 0.35 - (metrics.instability ?? 0) * 0.4),
    warSupport: round((metrics.deterrence ?? 0) * 0.25 - (metrics.instability ?? 0) * 0.12),
    politicalPower: round((metrics.multipolarity ?? 0) * 0.25 + (metrics.rights ?? 0) * 0.15),
    enemyPressure: round((metrics.instability ?? 0) * 0.42),
  };
  let gameDelta = combineDelta(systemicDelta, categoryDelta(category));
  let stockpileDelta: Partial<Record<keyof Stockpile, number>> = {};
  let relationChange = round(((metrics.multipolarity ?? 0) + (metrics.rights ?? 0) - (metrics.instability ?? 0)) * 0.35);

  if (eventId === 'hormuz-tanker-war') {
    if (variant.id === 'institutional') {
      gameDelta = combineDelta(gameDelta, { fuel: 10, treasury: -12, navalPower: 2, enemyPressure: -4 });
      stockpileDelta = { convoys: 20 };
      relationChange += 6;
    } else if (variant.id === 'transformative') {
      gameDelta = combineDelta(gameDelta, { fuel: -28, treasury: -80, navalPower: -3, enemyPressure: 9 });
      stockpileDelta = { convoys: -90 };
      relationChange -= 8;
    } else {
      gameDelta = combineDelta(gameDelta, { fuel: -12, treasury: -35, navalPower: 3, enemyPressure: 3 });
      stockpileDelta = { convoys: -35 };
      relationChange -= 2;
    }
  }

  const summary = describeEffects(gameDelta, stockpileDelta, relationChange);
  const netRisk = (metrics.instability ?? 0) - (metrics.prosperity ?? 0) - (metrics.rights ?? 0) * 0.5;
  return {
    gameDelta,
    stockpileDelta,
    relationChange,
    tone: netRisk >= 8 ? 'bad' : netRisk <= -5 ? 'good' : 'neutral',
    summary: summary.length > 0 ? summary : ['즉시 자원 변화 없음 · 장기 세계선만 변경'],
  };
}
