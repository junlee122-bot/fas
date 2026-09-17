import type { RoleTabMandate } from './roleMandate';
import type { CareerRole, GameTab } from './types';
import type { UXAction } from './ux';

type DeskRole = Pick<CareerRole, 'branch' | 'tier' | 'archetype'>;
const branchFocusTabs: Readonly<Record<CareerRole['branch'], readonly GameTab[]>> = {
  military: ['army', 'map', 'industry', 'research', 'organization'],
  politics: ['governance', 'economy', 'diplomacy', 'health', 'industry', 'research', 'organization'],
  intelligence: ['intelligence', 'map', 'diplomacy', 'research', 'organization'],
};

// Match getRoleTabMandates exactly. Both independent highest-office exceptions
// already exist in the authority model; this only removes a display restriction.
const highestOffice = (role: DeskRole) => role.tier === 1 || role.archetype === 'head-of-state';

/** Presentation remit only, never an authorization check. Callers still check the current mandate. */
export function isCommandDeskFocusTab(role: DeskRole, tab: GameTab): boolean {
  return highestOffice(role) || Boolean(branchFocusTabs[role.branch]?.includes(tab));
}

/** Read-only predicate: no mandate changes, priority sorting, approvals or action execution. */
export function isCommandDeskActionVisible(
  role: DeskRole,
  mandates: Readonly<Record<GameTab, RoleTabMandate>>,
  action: Pick<UXAction, 'id' | 'tab'>,
): boolean {
  if (mandates[action.tab]?.mode !== 'direct' || !isCommandDeskFocusTab(role, action.tab)) return false;
  if (highestOffice(role)) return true;
  if (action.id === 'national-policy' && role.branch !== 'politics') return false;
  if (action.id === 'political-crisis' && role.branch === 'military' && role.tier > 2) return false;
  return true;
}
