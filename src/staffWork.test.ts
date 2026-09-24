import { describe, expect, it } from 'vitest';
import { createCareerState, createStaffRoster, getRole } from './campaign';
import type { StaffDecisionInput } from './staffDecisions';
import { advanceStaffMemberWeek, advanceStaffRosterWeek } from './staffManagement';
import { assessStaffWorkPriority, changeStaffWorkPriority, getStaffWorkPriority, projectStaffWorkWeek, staffWorkPriorities } from './staffWork';
import type { StaffMember, StaffWorkPriority } from './types';

function fixture(): StaffDecisionInput {
  const role = getRole('britain-tier1', 'britain');
  return {
    game: { week: 26, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
      stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
      airPower: 57, navalPower: 52, intelNetwork: 78, enemyPressure: 68 },
    role, staff: createStaffRoster('britain', role.id), developmentFocusId: null,
    campaignPhase: 'war', nationStatus: 'sovereign', career: createCareerState('britain', role.id), affiliationStatus: 'serving',
  };
}

function member(): StaffMember {
  return { ...fixture().staff[0], workload: 50, development: 30, delegated: false, contractWeeksRemaining: 100 };
}

function assess(input: StaffDecisionInput, priority: StaffWorkPriority = 'urgent') {
  return assessStaffWorkPriority(input, input.staff[0].id, input.staff[0].personId, priority);
}

describe('HQ persistent staff work tempo', () => {
  it('defines honest workload/development modifiers, not output bonuses', () => {
    expect(staffWorkPriorities.map(({ id, workloadDelta, developmentDelta }) => ({ id, workloadDelta, developmentDelta }))).toEqual([
      { id: 'urgent', workloadDelta: 5, developmentDelta: 2 },
      { id: 'normal', workloadDelta: 0, developmentDelta: 0 },
      { id: 'recovery', workloadDelta: -7, developmentDelta: -2 },
    ]);
  });

  it.each([undefined, null, 'corrupt', 1, {}, 'NORMAL'])('treats invalid/legacy saved priority %s as normal', (workPriority) => {
    const saved = { ...member(), workPriority } as StaffMember;
    expect(getStaffWorkPriority(saved)).toBe('normal');
    expect(projectStaffWorkWeek(saved)).toEqual(projectStaffWorkWeek(member()));
    const next = advanceStaffMemberWeek(saved, false);
    expect(getStaffWorkPriority(next)).toBe('normal');
    if (workPriority !== undefined) expect(next.workPriority).toBe('normal');
  });

  it('keeps legacy normal weekly changes exactly', () => {
    expect(projectStaffWorkWeek(member())).toMatchObject({ workload: 47, development: 33, workloadDelta: -3, developmentDelta: 3 });
    expect(advanceStaffMemberWeek(member(), false)).not.toHaveProperty('workPriority');
    expect(projectStaffWorkWeek({ ...member(), delegated: true }, true)).toMatchObject({ workload: 51.5, development: 43 });
    expect(projectStaffWorkWeek({ ...member(), delegated: true, workload: 90 })).toMatchObject({ workload: 83, development: 34 });
  });

  it.each(['urgent', 'normal', 'recovery'] as const)('uses the same %s forecast in the actual weekly engine', (workPriority) => {
    const before = { ...member(), workPriority };
    const projection = projectStaffWorkWeek(before, true);
    const next = advanceStaffMemberWeek(before, true);
    expect(next.workload).toBe(projection.workload);
    expect(next.development).toBe(projection.development);
    expect(next.workPriority).toBe(workPriority);
    expect(next.ability).toBe(before.ability);
    expect(next.weeklyCost).toBe(before.weeklyCost);
    expect(next.department).toBe(before.department);
  });

  it('persists through JSON save round-trip and changes subsequent weeks, not only the first', () => {
    const input = fixture(); input.staff[0] = member();
    const staffAfter = changeStaffWorkPriority(input, input.staff[0].id, input.staff[0].personId, 'urgent')!;
    let loaded = JSON.parse(JSON.stringify(staffAfter)) as StaffMember[];
    loaded = advanceStaffRosterWeek(loaded);
    expect(loaded[0]).toMatchObject({ workload: 52, development: 35, workPriority: 'urgent' });
    loaded = advanceStaffRosterWeek(loaded);
    expect(loaded[0]).toMatchObject({ workload: 54, development: 40, workPriority: 'urgent' });
  });

  it('clamps workload to 8..100 and development to 0..100', () => {
    expect(projectStaffWorkWeek({ ...member(), delegated: true, workload: 100, development: 100, workPriority: 'urgent' }, true)).toMatchObject({ workload: 98, development: 100 });
    expect(projectStaffWorkWeek({ ...member(), workload: 99, workPriority: 'urgent' })).toMatchObject({ workload: 100 });
    expect(projectStaffWorkWeek({ ...member(), workload: 8, development: 0, workPriority: 'recovery' })).toMatchObject({ workload: 8, development: 1 });
    expect(projectStaffWorkWeek({ ...member(), workload: 90, development: 0, workPriority: 'recovery' })).toMatchObject({ development: 0 });
  });

  it('allows existing overload morale consequences instead of hiding the urgent-work cost', () => {
    const before = { ...member(), workload: 86, morale: 70, workPriority: 'urgent' as const };
    const urgent = advanceStaffMemberWeek(before, false);
    const normal = advanceStaffMemberWeek({ ...before, workPriority: 'normal' }, false);
    expect(urgent.workload).toBe(88);
    expect(urgent.morale).toBeLessThan(normal.morale!);
  });
});

describe('HQ staff work authority and stale identity gate', () => {
  it('only changes the selected priority immediately and leaves input untouched', () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const result = assess(input);
    expect(result.allowed, result.reason).toBe(true);
    if (!result.allowed) throw new Error(result.reason);
    expect(result.memberAfter).toEqual({ ...input.staff[0], workPriority: 'urgent' });
    expect(result.staffAfter.slice(1)).toEqual(input.staff.slice(1));
    expect(result.forecast).toEqual(projectStaffWorkWeek(result.memberAfter));
    expect(result.reason).toContain('다음 주간 결산');
    expect(JSON.stringify(input)).toBe(before);
  });

  it('rejects repeated priorities without granting instant workload/development changes', () => {
    const input = fixture();
    expect(assess(input, 'normal').allowed).toBe(false);
    input.staff = changeStaffWorkPriority(input, input.staff[0].id, input.staff[0].personId, 'urgent')!;
    expect(assess(input).allowed).toBe(false);
    expect(changeStaffWorkPriority(input, input.staff[0].id, input.staff[0].personId, 'urgent')).toBeNull();
  });

  it('permits returning to normal after a non-normal assignment', () => {
    const input = fixture(); input.staff[0].workPriority = 'urgent';
    expect(assess(input, 'normal').allowed).toBe(true);
  });

  it('rejects a stale person identity even when a seat id still exists', () => {
    const input = fixture();
    expect(assessStaffWorkPriority(input, input.staff[0].id, 'former-person', 'urgent').allowed).toBe(false);
    expect(assessStaffWorkPriority(input, 'former-seat', input.staff[0].personId, 'urgent').allowed).toBe(false);
  });

  it('rejects a duplicate person or seat record', () => {
    const input = fixture(); input.staff[1].personId = input.staff[0].personId;
    expect(assess(input).allowed).toBe(false);
    input.staff[1].personId = 'different'; input.staff[1].id = input.staff[0].id;
    expect(assess(input).allowed).toBe(false);
  });

  it.each(['dismissed', 'unattached'] as const)('rejects %s careers', (affiliationStatus) => {
    const input = fixture(); input.affiliationStatus = affiliationStatus;
    expect(assess(input).allowed).toBe(false);
  });

  it('rejects civilian careers without an official appointment', () => {
    const input = fixture(); input.career!.startMode = 'civilian'; input.career!.civilian = undefined;
    expect(assess(input).allowed).toBe(false);
  });

  it('rejects outdated career role permissions', () => {
    const input = fixture(); input.career!.roleId = 'former-office';
    expect(assess(input).allowed).toBe(false);
  });

  it('rejects a department outside the serving office authority', () => {
    const input = fixture(); input.role = getRole('britain-tier2', 'britain'); input.career = createCareerState('britain', input.role.id);
    const member = input.staff.find((item) => item.department === 'economy')!;
    expect(assessStaffWorkPriority(input, member.id, member.personId, 'urgent').allowed).toBe(false);
  });

  it('rejects execution during weekly settlement', () => {
    const input = fixture(); input.busy = true;
    expect(assess(input).allowed).toBe(false);
  });

  it.each([NaN, Infinity, -1, 101])('rejects invalid workload %s', (workload) => {
    const input = fixture(); input.staff[0].workload = workload;
    expect(assess(input).allowed).toBe(false);
  });

  it('rejects non-finite development and an unknown requested priority', () => {
    const input = fixture(); input.staff[0].development = NaN;
    expect(assess(input).allowed).toBe(false);
    expect(assess(fixture(), 'corrupt' as StaffWorkPriority).allowed).toBe(false);
  });

  it('normalizes an invalid saved priority without accepting an invalid new command', () => {
    const input = fixture(); input.staff[0].workPriority = 'corrupt' as StaffWorkPriority;
    expect(assess(input).allowed).toBe(true);
    expect(assess(input, 'normal').allowed).toBe(false);
  });
});
