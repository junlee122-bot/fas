import { getStaffContractWeeks, getStaffMorale, getStaffRoleSatisfaction } from './staffManagement';
import { getStaffWorkPriority } from './staffWork';
import type { NationId, StaffDepartment, StaffMember, StaffWorkPriority } from './types';

export interface StaffWorkSnapshot {
  workload: number;
  development: number;
  morale: number;
  loyalty: number;
  roleSatisfaction: number;
  contractWeeks: number;
}

export interface StaffWorkReport {
  version: 1;
  nationId: NationId;
  staffId: string;
  personId: string;
  joinedWeek?: number;
  personName: string;
  departmentBefore: StaffDepartment;
  fromWeek: number;
  week: number;
  basis: {
    priority: StaffWorkPriority;
    delegated: boolean;
    focused: boolean;
    /** Reference salary at settlement, NOT proof of a separate individual payment. */
    weeklyCost: number;
  };
  before: StaffWorkSnapshot;
  /** The work, contract and roster-cohesion engine has already run once. */
  afterWork: StaffWorkSnapshot;
  /** Final actually committed staff state after the narrative engine. */
  after: StaffWorkSnapshot;
  delegatedAfter: boolean;
}

export interface StaffWorkReportContext {
  nationId: NationId;
  fromWeek: number;
  week: number;
  developmentFocusId?: string | null;
}

export type StaffWorkReportAvailability =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'available'; report: StaffWorkReport; ageWeeks: number; instructionChanged: boolean };

const nations = new Set<NationId>(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const departments = new Set<StaffDepartment>(['operations', 'logistics', 'armaments', 'personnel', 'political', 'science', 'economy']);
const priorities = new Set<StaffWorkPriority>(['urgent', 'normal', 'recovery']);
const statKeys = ['workload', 'development', 'morale', 'loyalty', 'roleSatisfaction'] as const;
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isWeek = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isStat = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const isCost = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function validIdentity(member: StaffMember): boolean {
  return isObject(member) && isId(member.id) && isId(member.personId) && isId(member.name)
    && departments.has(member.department) && (member.joinedWeek === undefined || isWeek(member.joinedWeek));
}

function readSnapshot(value: unknown): StaffWorkSnapshot | undefined {
  if (!isObject(value) || !statKeys.every((key) => isStat(value[key])) || !isWeek(value.contractWeeks)) return undefined;
  return { workload: value.workload as number, development: value.development as number, morale: value.morale as number,
    loyalty: value.loyalty as number, roleSatisfaction: value.roleSatisfaction as number, contractWeeks: value.contractWeeks };
}

/** Match the engine's legacy defaults, while rejecting missing/non-finite actual measurements. */
function snapshot(member: StaffMember): StaffWorkSnapshot | undefined {
  if (!validIdentity(member) || ![member.workload, member.development, member.loyalty, member.ability, member.influence].every(isStat)
    || ![1, 2, 3].includes(member.grade) || typeof member.delegated !== 'boolean'
    || [member.morale, member.roleSatisfaction].some((value) => value !== undefined && !isStat(value))
    || (member.contractWeeksRemaining !== undefined && !isWeek(member.contractWeeksRemaining))) return undefined;
  return readSnapshot({ workload: member.workload, development: member.development, loyalty: member.loyalty,
    morale: getStaffMorale(member), roleSatisfaction: getStaffRoleSatisfaction(member), contractWeeks: getStaffContractWeeks(member) });
}

/** Loading or viewing never reconstructs an old result from today's statistics or a forecast. */
export function normalizeStaffWorkReport(value: unknown, member: StaffMember, nationId: NationId, currentWeek: number): StaffWorkReport | undefined {
  if (!isObject(value) || !validIdentity(member) || !nations.has(nationId) || !isWeek(currentWeek)
    || value.version !== 1 || value.nationId !== nationId || value.staffId !== member.id || value.personId !== member.personId
    || value.joinedWeek !== member.joinedWeek || (value.joinedWeek !== undefined && !isWeek(value.joinedWeek))
    || !isId(value.personName) || !departments.has(value.departmentBefore as StaffDepartment)
    || !isWeek(value.fromWeek) || !isWeek(value.week) || value.week !== value.fromWeek + 1 || value.week > currentWeek
    || (member.joinedWeek !== undefined && member.joinedWeek > value.fromWeek)
    || !isObject(value.basis) || !priorities.has(value.basis.priority as StaffWorkPriority)
    || typeof value.basis.delegated !== 'boolean' || typeof value.basis.focused !== 'boolean' || !isCost(value.basis.weeklyCost)
    || typeof value.delegatedAfter !== 'boolean') return undefined;
  const before = readSnapshot(value.before);
  const afterWork = readSnapshot(value.afterWork);
  const after = readSnapshot(value.after);
  if (!before || !afterWork || !after) return undefined;
  return {
    version: 1, nationId, staffId: member.id, personId: member.personId,
    ...(member.joinedWeek === undefined ? {} : { joinedWeek: member.joinedWeek }),
    personName: value.personName, departmentBefore: value.departmentBefore as StaffDepartment,
    fromWeek: value.fromWeek, week: value.week,
    basis: { priority: value.basis.priority as StaffWorkPriority, delegated: value.basis.delegated, focused: value.basis.focused, weeklyCost: value.basis.weeklyCost },
    before, afterWork, after, delegatedAfter: value.delegatedAfter,
  };
}

export function getStaffWorkReport(member: StaffMember, nationId: NationId, currentWeek: number, developmentFocusId?: string | null): StaffWorkReportAvailability {
  if (member.lastWorkReport === undefined) return { status: 'missing' };
  const report = normalizeStaffWorkReport(member.lastWorkReport, member, nationId, currentWeek);
  if (!report) return { status: 'invalid' };
  return { status: 'available', report, ageWeeks: currentWeek - report.week,
    instructionChanged: member.department !== report.departmentBefore || getStaffWorkPriority(member) !== report.basis.priority
      || member.delegated !== report.delegatedAfter
      || (developmentFocusId !== undefined && (developmentFocusId === member.id) !== report.basis.focused) };
}

function uniqueRoster(roster: readonly StaffMember[]): Map<string, StaffMember> | null {
  if (!Array.isArray(roster)) return null;
  const byId = new Map<string, StaffMember>();
  const people = new Set<string>();
  for (const member of roster) {
    if (!validIdentity(member) || byId.has(member.id) || people.has(member.personId)) return null;
    byId.set(member.id, member);
    people.add(member.personId);
  }
  return byId;
}

function clearReport(member: StaffMember): StaffMember {
  if (!isObject(member) || member.lastWorkReport === undefined) return member;
  const copy = { ...member };
  delete copy.lastWorkReport;
  return copy;
}

/** Capture the three existing settlement snapshots; never advances staff or awards bonuses. */
export function attachStaffWorkReports(
  before: readonly StaffMember[],
  afterWork: readonly StaffMember[],
  afterNarrative: readonly StaffMember[],
  context: StaffWorkReportContext,
): StaffMember[] {
  if (!Array.isArray(afterNarrative)) return [];
  const previous = uniqueRoster(before);
  const work = uniqueRoster(afterWork);
  const final = uniqueRoster(afterNarrative);
  const validContext = nations.has(context.nationId) && isWeek(context.fromWeek) && isWeek(context.week) && context.week === context.fromWeek + 1;
  return afterNarrative.map((member) => {
    if (!previous || !work || !final || !validContext) return clearReport(member);
    const initial = previous.get(member.id);
    const intermediate = work.get(member.id);
    if (!initial || !intermediate || initial.personId !== member.personId || intermediate.personId !== member.personId
      || initial.joinedWeek !== member.joinedWeek || intermediate.joinedWeek !== member.joinedWeek
      || (member.joinedWeek !== undefined && member.joinedWeek > context.fromWeek)
      || !isCost(initial.weeklyCost)) return clearReport(member);
    const initialSnapshot = snapshot(initial);
    const workSnapshot = snapshot(intermediate);
    const finalSnapshot = snapshot(member);
    if (!initialSnapshot || !workSnapshot || !finalSnapshot) return clearReport(member);
    const report: StaffWorkReport = {
      version: 1, nationId: context.nationId, staffId: member.id, personId: member.personId,
      ...(member.joinedWeek === undefined ? {} : { joinedWeek: member.joinedWeek }),
      personName: initial.name, departmentBefore: initial.department, fromWeek: context.fromWeek, week: context.week,
      basis: { priority: getStaffWorkPriority(initial), delegated: initial.delegated, focused: context.developmentFocusId === initial.id, weeklyCost: initial.weeklyCost },
      before: initialSnapshot, afterWork: workSnapshot, after: finalSnapshot, delegatedAfter: member.delegated,
    };
    return { ...member, lastWorkReport: report };
  });
}
