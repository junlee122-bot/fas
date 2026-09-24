import type { Division, Faction, Order, Territory } from './types';
import { validateLandRoute } from './mapRoutes';
import { getSiteMilitaryAccess, type MilitaryAccessOperationalContext } from './militaryAccess';

export const OFFENSIVE_COMMAND_COST = 5;

export type OffensiveValidationCode = 'allowed' | 'missing-territory' | 'neutral-target' | 'friendly-target' | 'not-adjacent'
  | 'sea-origin' | 'sea-target' | 'sea-crossing' | 'origin-access-denied'
  | 'not-at-origin' | 'missing-division' | 'not-war' | 'not-authorized' | 'not-ready' | 'already-ordered' | 'insufficient-command' | 'processing-week';

export interface OffensiveValidation {
  allowed: boolean;
  code: OffensiveValidationCode;
  reason: string;
}

const deny = (code: OffensiveValidationCode, reason: string): OffensiveValidation => ({ allowed: false, code, reason });
const allowed: OffensiveValidation = { allowed: true, code: 'allowed', reason: '육로로 연결된 인접 적 거점에 공세를 승인할 수 있습니다.' };

export interface OffensiveTargetContext {
  origin: Territory | undefined;
  target: Territory | undefined;
  playerFaction: Faction;
  militaryAccess?: MilitaryAccessOperationalContext;
}

/** Shared by map highlighting, command review and weekly execution. */
export function validateOffensiveTarget({ origin, target, playerFaction, militaryAccess }: OffensiveTargetContext): OffensiveValidation {
  if (!origin || !target) return deny('missing-territory', '출발지 또는 목표 지역을 확인할 수 없습니다.');
  if (militaryAccess) {
    const departure = getSiteMilitaryAccess(origin, 'offensive', militaryAccess);
    if (!departure.allowed) return deny('origin-access-denied', departure.reason);
  }
  if (target.controller === 'neutral') return deny('neutral-target', '중립 지역에는 직접 공세를 명령할 수 없습니다. 외교 상태를 먼저 확인하십시오.');
  if (target.controller === playerFaction) return deny('friendly-target', '이미 아군이 통제하는 지역입니다.');
  const routeValidation = validateLandRoute(origin, target);
  if (!routeValidation.allowed) return routeValidation;
  return allowed;
}

export interface OffensiveCommandContext extends OffensiveTargetContext {
  division: Division | undefined;
  phase: 'war' | 'nation';
  commandableDivisionIds: ReadonlySet<string>;
  orders: readonly Order[];
  commandPoints: number;
  processingWeek?: boolean;
}

/** Approval is revalidated against the current snapshot, never just the marker style. */
export function validateOffensiveCommand(context: OffensiveCommandContext): OffensiveValidation {
  if (context.phase !== 'war') return deny('not-war', '국가 운영 단계에서는 전시 영토 공세를 발령할 수 없습니다.');
  if (context.processingWeek) return deny('processing-week', '주간 결산 중에는 새 공세를 승인할 수 없습니다.');
  const { division, origin } = context;
  if (!division) return deny('missing-division', '초안에 배속한 부대를 찾을 수 없습니다.');
  if (!context.commandableDivisionIds.has(division.id)) return deny('not-authorized', '현재 보직의 지휘 범위를 벗어난 부대입니다.');
  if (context.orders.some((order) => order.divisionId === division.id)) return deny('already-ordered', '이 부대에는 이미 승인된 명령이 있습니다. 작전 현장에서 확인하십시오.');
  if (division.status !== 'ready') return deny('not-ready', '이 사단은 새 명령을 수행할 준비가 되지 않았습니다.');
  if (origin && division.territoryId !== origin.id) return deny('not-at-origin', '부대가 초안의 출발선에서 이동했습니다. 출발지를 다시 확인하십시오.');
  const targetValidation = validateOffensiveTarget(context);
  if (!targetValidation.allowed) return targetValidation;
  if (!Number.isFinite(context.commandPoints) || context.commandPoints < OFFENSIVE_COMMAND_COST) return deny('insufficient-command', '지휘 점수가 부족합니다.');
  return allowed;
}
