import { describe, expect, it } from 'vitest';
import { createStaffCandidates, createStaffRoster } from './campaign';
import {
  advanceStaffMemberWeek,
  advanceStaffRosterWeek,
  assessStaffPromise,
  calculateCandidateSeatFit,
  createStaffInfluenceBlocs,
  createStaffManagementOverview,
  createStaffRelationships,
  getStaffContractRisk,
  getStaffMeetingOption,
  getStaffRenewalCost,
  resolveStaffMeeting,
} from './staffManagement';

describe('FM-style staff management cycle', () => {
  it('connects weak seats to prioritized recruitment needs and external depth', () => {
    const roster = createStaffRoster('britain', 'britain-tier1').map((member) => member.department === 'operations'
      ? { ...member, ability: 38, workload: 94, contractWeeksRemaining: 8 }
      : member);
    const overview = createStaffManagementOverview(roster, createStaffCandidates('britain', 'britain-tier1'), ['operations', 'logistics']);
    const operations = overview.seats.find((seat) => seat.department === 'operations');
    expect(operations?.priority).toBe('top');
    expect(operations?.externalDepth).toHaveLength(3);
    expect(overview.topNeed?.department).toBe('operations');
  });

  it('scores a matching, well-scouted candidate above a mismatched unknown candidate', () => {
    const [candidate] = createStaffCandidates('britain', 'britain-tier1');
    const verified = calculateCandidateSeatFit({ ...candidate, department: 'science', discipline: 'science', knowledge: 90 }, 'science');
    const unknown = calculateCandidateSeatFit({ ...candidate, department: 'operations', discipline: 'military', knowledge: 12 }, 'science');
    expect(verified.score).toBeGreaterThan(unknown.score);
    expect(unknown.uncertainty).toBeGreaterThan(verified.uncertainty);
  });

  it('advances workload, morale and contracts together each week', () => {
    const [member] = createStaffRoster('britain', 'britain-tier1');
    const next = advanceStaffMemberWeek({ ...member, delegated: true, workload: 89, morale: 52, contractWeeksRemaining: 1 }, false);
    expect(next.contractWeeksRemaining).toBe(0);
    expect(next.delegated).toBe(false);
    expect(next.morale).toBeLessThan(52);
    expect(getStaffContractRisk(next)).toBe('expired');
  });

  it('prices renewals from responsibility, influence and weekly compensation', () => {
    const [member] = createStaffRoster('britain', 'britain-tier1');
    expect(getStaffRenewalCost({ ...member, grade: 3, influence: 90, weeklyCost: 14 }))
      .toBeGreaterThan(getStaffRenewalCost({ ...member, grade: 1, influence: 40, weeklyCost: 6 }));
  });

  it('treats an ungranted autonomous mandate as a broken appointment promise', () => {
    const [member] = createStaffRoster('britain', 'britain-tier1');
    const appointed = {
      ...member,
      delegated: false,
      morale: 70,
      roleSatisfaction: 70,
      contractWeeksRemaining: 104,
      promisedDepartment: member.department,
      appointmentAuthority: 'autonomous' as const,
      appointmentPromise: 'none' as const,
    };

    expect(assessStaffPromise(appointed).state).toBe('broken');
    const next = advanceStaffMemberWeek(appointed, false);
    expect(next.roleSatisfaction).toBeLessThan(appointed.roleSatisfaction);
    expect(next.morale).toBeLessThan(appointed.morale);
    expect(next.loyalty).toBeLessThan(appointed.loyalty);
  });

  it('keeps a resources promise only while the appointee remains the development focus', () => {
    const [member] = createStaffRoster('britain', 'britain-tier1');
    const appointed = {
      ...member,
      delegated: true,
      contractWeeksRemaining: 104,
      promisedDepartment: member.department,
      appointmentAuthority: 'executive' as const,
      appointmentPromise: 'resources' as const,
    };

    expect(assessStaffPromise(appointed, true).state).toBe('kept');
    expect(assessStaffPromise(appointed, false).state).toBe('at-risk');
  });

  it('surfaces broken promises in the weekly management overview', () => {
    const roster = createStaffRoster('britain', 'britain-tier1');
    const first = roster[0];
    const appointed = roster.map((member, index) => index === 0 ? {
      ...member,
      delegated: false,
      promisedDepartment: first.department,
      appointmentAuthority: 'autonomous' as const,
      appointmentPromise: 'none' as const,
    } : member);
    const overview = createStaffManagementOverview(appointed, createStaffCandidates('britain', 'britain-tier1'), ['operations', 'logistics']);

    expect(overview.brokenPromises).toBe(1);
    expect(overview.dynamics.find((record) => record.member.id === first.id)?.promise.state).toBe('broken');
  });

  it('resolves workload meetings with the advertised cost and workload relief', () => {
    const [member] = createStaffRoster('britain', 'britain-tier1');
    const option = getStaffMeetingOption('workload');
    const result = resolveStaffMeeting({ ...member, workload: 88, morale: 55, roleSatisfaction: 60 }, 'workload', 12);

    expect(option.cost).toBe(3);
    expect(result.member.workload).toBe(70);
    expect(result.member.morale).toBe(59);
    expect(result.member.roleSatisfaction).toBe(64);
    expect(result.member.lastMeetingWeek).toBe(12);
  });

  it('makes a demanding standards meeting depend on leadership buy-in', () => {
    const [member] = createStaffRoster('britain', 'britain-tier1');
    const accepted = resolveStaffMeeting({ ...member, delegated: true, loyalty: 90, morale: 90, roleSatisfaction: 90, development: 20 }, 'standards', 4);
    const rejected = resolveStaffMeeting({ ...member, delegated: false, loyalty: 25, morale: 20, roleSatisfaction: 20, development: 20 }, 'standards', 4);

    expect(accepted.success).toBe(true);
    expect(accepted.member.development).toBe(32);
    expect(rejected.success).toBe(false);
    expect(rejected.member.morale).toBe(13);
    expect(rejected.member.roleSatisfaction).toBe(12);
  });

  it('builds deterministic pair relationships and three institutional influence blocs', () => {
    const roster = createStaffRoster('britain', 'britain-tier1');
    const relationships = createStaffRelationships(roster);
    const repeated = createStaffRelationships(roster);
    const blocs = createStaffInfluenceBlocs(roster, relationships);

    expect(relationships).toHaveLength(roster.length * (roster.length - 1) / 2);
    expect(repeated.map((relationship) => relationship.affinity)).toEqual(relationships.map((relationship) => relationship.affinity));
    expect(relationships.every((relationship) => relationship.affinity >= 15 && relationship.affinity <= 92)).toBe(true);
    expect(blocs.map((bloc) => bloc.id)).toEqual(['command', 'administration', 'state']);
    expect(blocs.flatMap((bloc) => bloc.members)).toHaveLength(roster.length);
  });

  it('turns a cohesive colleague group into a small weekly morale and satisfaction bonus', () => {
    const roster = createStaffRoster('britain', 'britain-tier1').slice(0, 2).map((member, index) => ({
      ...member,
      department: index === 0 ? 'operations' as const : 'logistics' as const,
      affiliation: '합동 참모 조직',
      discipline: 'military' as const,
      influence: 45,
      delegated: true,
      workload: 55,
      morale: 60,
      roleSatisfaction: 60,
    }));
    const individual = advanceStaffMemberWeek(roster[0], false);
    const [withTeam] = advanceStaffRosterWeek(roster, null);

    expect(createStaffRelationships(roster)[0].affinity).toBeGreaterThanOrEqual(65);
    expect(withTeam.morale).toBe(individual.morale! + 1);
    expect(withTeam.roleSatisfaction).toBe(individual.roleSatisfaction! + 1);
  });
});
