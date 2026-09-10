import { describe, expect, it } from 'vitest';
import { deriveStaffPlayEvidence } from './staffPlayEvidence';
import type { BattleReport, StaffMember } from './types';

const staff = [{ id: 'a', name: '실제 지휘관', joinedWeek: 0 }] as StaffMember[];
const report = { id: 'r1', week: 2, commanderName: '실제 지휘관', targetName: '시험 전선', divisionName: '시험 사단', victory: true, operationOutcome: 'victory' } as BattleReport;
describe('play evidence identity matching', () => {
  it('links completed reports to a unique matching commander only', () => {
    expect(deriveStaffPlayEvidence(staff, [report], 2).evidence[0]).toMatchObject({ id: 'battle:r1', staffIds: ['a'], kind: 'battle-victory' });
    expect(deriveStaffPlayEvidence([...staff, { ...staff[0], id: 'b' }], [report], 2).evidence).toHaveLength(0);
    expect(deriveStaffPlayEvidence(staff, [{ ...report, commanderName: '다른 장군' }], 2).evidence).toHaveLength(0);
  });
  it('does not invent final victories from ongoing, future or stale reports', () => {
    expect(deriveStaffPlayEvidence(staff, [{ ...report, operationOutcome: 'ongoing' }], 2).evidence).toHaveLength(0);
    expect(deriveStaffPlayEvidence(staff, [report], 1).evidence).toHaveLength(0);
    expect(deriveStaffPlayEvidence(staff, [report], 10).evidence).toHaveLength(0);
  });
  it('does not claim the starting roster was newly recruited during play', () => {
    expect(deriveStaffPlayEvidence(staff, [], 0).evidence).toHaveLength(0);
    expect(deriveStaffPlayEvidence([{ ...staff[0], joinedWeek: 3 }], [], 3).evidence[0]).toMatchObject({ kind: 'personnel-change', week: 3, staffIds: ['a'] });
  });
});
