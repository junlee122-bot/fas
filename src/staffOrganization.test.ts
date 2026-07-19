import { describe, expect, it } from 'vitest';
import { careerRoles, createStaffRoster, getNation } from './campaign';
import {
  calculateStaffSuitability,
  getCareerInstitutionalTitle,
  getStaffAuthorityProfile,
  getStaffSeatTitle,
  reassignStaff,
} from './staffOrganization';

function role(id: string) {
  const match = careerRoles.find((item) => item.id === id);
  if (!match) throw new Error(`Missing role ${id}`);
  return match;
}

describe('staff organization authority', () => {
  it('gives a head of state authority over every staff seat', () => {
    const authority = getStaffAuthorityProfile(role('britain-tier1'));
    expect(authority.managedDepartments).toHaveLength(7);
    expect(authority.maxDelegations).toBe(7);
  });

  it('limits a theater commander to military staff departments', () => {
    const authority = getStaffAuthorityProfile(role('britain-tier2'));
    expect(authority.managedDepartments).toEqual(['operations', 'logistics', 'armaments', 'personnel']);
    expect(authority.managedDepartments).not.toContain('economy');
  });

  it('gives an intelligence director a different four-seat chain of command', () => {
    const authority = getStaffAuthorityProfile(role('britain-intelligence-director'));
    expect(authority.managedDepartments).toEqual(['operations', 'personnel', 'political', 'science']);
    expect(authority.managedDepartments).not.toContain('armaments');
  });

  it('limits field roles to three seats and two delegated responsibilities', () => {
    const authority = getStaffAuthorityProfile(role('britain-field-command'));
    expect(authority.managedDepartments).toHaveLength(3);
    expect(authority.maxDelegations).toBe(2);
  });

  it('makes one-star entry roles meaningfully narrower than three-star middle management', () => {
    const entry = getStaffAuthorityProfile(role('britain-political-organizer'));
    const regional = getStaffAuthorityProfile(role('britain-political-regional'));
    const middle = getStaffAuthorityProfile(role('britain-political-bureau'));
    expect(entry.managedDepartments).toHaveLength(2);
    expect(entry.maxDelegations).toBe(1);
    expect(regional.managedDepartments).toHaveLength(3);
    expect(regional.maxDelegations).toBe(2);
    expect(middle.managedDepartments).toHaveLength(4);
    expect(middle.maxDelegations).toBe(3);
  });
});

describe('staff organization transitions', () => {
  it('renames war offices after a sovereign postwar transition', () => {
    expect(getStaffSeatTitle('operations', 'war', 'sovereign')).toBe('작전참모장');
    expect(getStaffSeatTitle('operations', 'nation', 'sovereign')).toBe('국가안보보좌관');
  });

  it('uses founding offices for a government-in-exile', () => {
    expect(getStaffSeatTitle('economy', 'nation', 'government-in-exile')).toBe('재정경제위원장');
    expect(getCareerInstitutionalTitle(role('korea-tier2'), 'nation', getNation('korea').status)).toBe('건국군 총사령관');
  });
});

describe('staff planner', () => {
  it('scores a matching specialist above a mismatched low-skill option', () => {
    const roster = createStaffRoster('britain', 'britain-tier1');
    const specialist = { ...roster[0], ability: 86, influence: 80, discipline: 'military' as const, workload: 40 };
    const outsider = { ...roster[1], ability: 55, influence: 48, discipline: 'medicine' as const, workload: 84 };
    expect(calculateStaffSuitability(specialist, 'operations').score).toBeGreaterThan(calculateStaffSuitability(outsider, 'operations').score);
  });

  it('swaps two occupied seats and clears delegated authority', () => {
    const roster = createStaffRoster('britain', 'britain-tier1');
    const operations = roster.find((member) => member.department === 'operations');
    const logistics = roster.find((member) => member.department === 'logistics');
    if (!operations || !logistics) throw new Error('Expected occupied seats');
    const result = reassignStaff(roster.map((member) => ({ ...member, delegated: true })), logistics.id, 'operations');
    expect(result.find((member) => member.id === logistics.id)?.department).toBe('operations');
    expect(result.find((member) => member.id === operations.id)?.department).toBe('logistics');
    expect(result.filter((member) => [operations.id, logistics.id].includes(member.id)).every((member) => !member.delegated)).toBe(true);
  });
});
