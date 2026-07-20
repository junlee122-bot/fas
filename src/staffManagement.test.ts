import { describe, expect, it } from 'vitest';
import { createStaffCandidates, createStaffRoster } from './campaign';
import {
  advanceStaffMemberWeek,
  calculateCandidateSeatFit,
  createStaffManagementOverview,
  getStaffContractRisk,
  getStaffRenewalCost,
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
});
