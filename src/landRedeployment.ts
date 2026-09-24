import { validateLandRoute } from './mapRoutes';
import { getSiteMilitaryAccess } from './militaryAccess';
import { createOperationOrder } from './operations';
import { getSeaTransportBusyDivisionIds } from './seaTransport';
import type { SeaTransportContext, SeaTransportPlan, SeaTransportState } from './seaTransport';
import type { Order } from './types';

export const LAND_REDEPLOYMENT_COMMAND_COST = 3;
export const LAND_REDEPLOYMENT_FUEL_COST = 1;
export type LandRedeploymentPlan = SeaTransportPlan;
export type LandRedeploymentContext = SeaTransportContext;
export interface LandRedeploymentResult {
  accepted: boolean;
  reason: string;
  commandCost: number;
  fuelCost: number;
  order?: Order;
}

/** Approval only: no position, stockpile, resource or order queue is mutated here. */
export function forecastLandRedeployment(
  seaTransport: SeaTransportState,
  plan: LandRedeploymentPlan,
  context: LandRedeploymentContext,
): LandRedeploymentResult {
  const result = { accepted: false, commandCost: LAND_REDEPLOYMENT_COMMAND_COST, fuelCost: LAND_REDEPLOYMENT_FUEL_COST };
  const fail = (reason: string): LandRedeploymentResult => ({ ...result, reason });
  if (context.processingWeek) return fail('주간 결산 중에는 육상 재배치를 승인할 수 없습니다.');
  if (!Number.isInteger(context.week) || context.week < 0) return fail('현재 캠페인 주차를 확인할 수 없습니다.');
  const division = context.divisions.find((item) => item.id === plan.divisionId);
  const origin = context.territories.find((item) => item.id === plan.fromId);
  const target = context.territories.find((item) => item.id === plan.targetId);
  if (!division || !origin || !target) return fail('부대·출발지·목적지를 모두 확인해 주세요.');
  if (!context.commandableDivisionIds.has(division.id)) return fail('현재 보직에서 직접 지휘할 수 없는 부대입니다.');
  if (getSeaTransportBusyDivisionIds(seaTransport).has(division.id)) return fail('해상 수송에 배속된 부대는 육상 재배치를 동시에 수행할 수 없습니다.');
  if (context.orders.some((order) => order.divisionId === division.id)) return fail('이 부대에는 이미 승인된 육상 명령이 있습니다.');
  if (division.status !== 'ready') return fail('준비 상태의 부대만 육상 재배치를 시작할 수 있습니다.');
  if (division.territoryId !== origin.id) return fail('부대가 선택한 출발지에 실제로 주둔하고 있지 않습니다.');
  if (context.militaryAccess) {
    const departure = getSiteMilitaryAccess(origin, 'land-departure', { ...context.militaryAccess, week: context.week });
    if (!departure.allowed) return fail(departure.reason);
    const destination = getSiteMilitaryAccess(target, 'transit', { ...context.militaryAccess, week: context.week });
    if (!destination.allowed) return fail(destination.reason);
  } else {
    if (origin.controller !== context.playerFaction) return fail('현재 아군이 통제하는 출발지에서만 육상 재배치할 수 있습니다.');
    if (target.controller !== context.playerFaction) return fail('육상 재배치는 아군 거점 사이의 이동입니다. 적·중립 지역으로 공격하지 않습니다.');
  }
  if ((origin.theater ?? 'europe') !== (target.theater ?? 'europe')) return fail('다른 전구의 거점으로 한 주 만에 육상 재배치할 수 없습니다.');
  const route = validateLandRoute(origin, target);
  if (!route.allowed) return fail(route.reason);
  if (!Number.isFinite(context.game.commandPoints) || context.game.commandPoints < result.commandCost) return fail(`육상 재배치에는 지휘력 ${result.commandCost}이 필요합니다.`);
  if (!Number.isFinite(context.game.fuel) || context.game.fuel < result.fuelCost) return fail(`육상 재배치에는 연료 ${result.fuelCost}가 필요합니다.`);
  return { ...result, accepted: true, reason: '다음 주에 접근이 허가된 인접 육지로 이동합니다. 접근권·통제가 바뀌면 공격으로 전환하지 않고 중단합니다. 통행권은 소유권·보급권·공격권이 아닙니다.' };
}

/** The existing land scheduler resolves this next week in both war and nation phases. */
export function approveLandRedeployment(
  seaTransport: SeaTransportState,
  plan: LandRedeploymentPlan,
  context: LandRedeploymentContext,
): LandRedeploymentResult {
  const forecast = forecastLandRedeployment(seaTransport, plan, context);
  if (!forecast.accepted) return forecast;
  const division = context.divisions.find((item) => item.id === plan.divisionId)!;
  const origin = context.territories.find((item) => item.id === plan.fromId)!;
  const target = context.territories.find((item) => item.id === plan.targetId)!;
  const order = {
    ...createOperationOrder({
      ...plan, startedWeek: context.week, stance: 'balanced', commandCost: forecast.commandCost,
      commandId: `redeploy:${context.nationId}:${context.week}:${division.id}:${origin.id}:${target.id}`,
    }, origin, target, division),
    intent: 'redeployment' as const,
  };
  return { ...forecast, order };
}
