import { describe, expect, it } from 'vitest';
import { createCareerState, getRole } from './campaign';
import { getRoleTabMandates } from './roleMandate';
import { getHeadquartersActionProblem, type HeadquartersActionContext, type HeadquartersDirectActionTab } from './headquartersActionGuard';

function fixture(tab: HeadquartersDirectActionTab): HeadquartersActionContext {
  const role = getRole('britain-tier1', 'britain');
  return { nationId: 'britain', week: 4, role, career: createCareerState('britain', role.id), affiliationStatus: 'serving', busy: false, mandate: getRoleTabMandates(role)[tab] };
}

describe('headquarters execution-time direct action authority', () => {
  it.each(['research', 'industry', 'army'] as const)('allows the current serving office to operate %s without mutating the context', (tab) => {
    const input = fixture(tab); const before = structuredClone(input);
    expect(getHeadquartersActionProblem(input, tab)).toBeNull();
    expect(input).toEqual(before);
  });

  it.each(['research', 'industry', 'army'] as const)('blocks %s during multiweek processing', (tab) => {
    expect(getHeadquartersActionProblem({ ...fixture(tab), busy: true }, tab)).toContain('기간 진행');
  });

  it.each(['request', 'report', 'locked'] as const)('does not reinterpret a %s mandate as direct action', (mode) => {
    const input = fixture('research'); input.mandate = { ...input.mandate, mode, reason: '담당 기관의 승인 필요' };
    expect(getHeadquartersActionProblem(input, 'research')).toBe('담당 기관의 승인 필요');
  });

  it('requires the target-specific mandate instead of another room permission', () => {
    expect(getHeadquartersActionProblem(fixture('research'), 'industry')).toContain('해당 기관');
  });

  it.each(['dismissed', 'unattached'] as const)('blocks a stale direct mandate after %s', (affiliationStatus) => {
    expect(getHeadquartersActionProblem({ ...fixture('industry'), affiliationStatus }, 'industry')).toContain('보직에서 이탈');
  });

  it.each(['exile', 'defector', 'double-agent'] as const)('preserves existing office eligibility for an appointed %s career', (affiliationStatus) => {
    expect(getHeadquartersActionProblem({ ...fixture('research'), affiliationStatus }, 'research')).toBeNull();
  });

  it('blocks mismatched current nation, career nation, and role identities', () => {
    const input = fixture('industry');
    expect(getHeadquartersActionProblem({ ...input, nationId: 'korea' }, 'industry')).not.toBeNull();
    expect(getHeadquartersActionProblem({ ...input, career: { ...input.career!, nationId: 'korea' } }, 'industry')).not.toBeNull();
    expect(getHeadquartersActionProblem({ ...input, career: { ...input.career!, roleId: 'different-office' } }, 'industry')).not.toBeNull();
    expect(getHeadquartersActionProblem({ ...input, career: undefined }, 'industry')).not.toBeNull();
  });

  it('does not let an unappointed civilian act through a cached direct mandate', () => {
    const input = fixture('research'); input.career = { ...input.career!, startMode: 'civilian', civilian: undefined };
    expect(getHeadquartersActionProblem(input, 'research')).not.toBeNull();
  });

  it('honors a valid effective delegation rather than recomputing only the base role mandate', () => {
    const input = fixture('research');
    const role = { ...input.role, id: 'delegated-office', tier: 4 as const, branch: 'military' as const, archetype: 'field-command' as const };
    expect(getRoleTabMandates(role).research.mode).toBe('request');
    input.role = role; input.career = { ...input.career!, roleId: role.id };
    expect(getHeadquartersActionProblem(input, 'research')).toBeNull();
  });

  it.each([-1, 1.5, NaN, Infinity])('blocks malformed current week %s', (week) => {
    expect(getHeadquartersActionProblem({ ...fixture('research'), week }, 'research')).not.toBeNull();
  });

  it('rejects an unknown affiliation rather than treating it as a serving office', () => {
    const input = fixture('industry'); input.affiliationStatus = 'unknown' as HeadquartersActionContext['affiliationStatus'];
    expect(getHeadquartersActionProblem(input, 'industry')).not.toBeNull();
  });
});
