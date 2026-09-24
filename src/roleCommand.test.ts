import { describe, expect, it } from 'vitest';
import { careerRoles, getRole, nations } from './campaign';
import { getRoleTabMandates } from './roleMandate';
import {
  advanceRoleCommandWeek,
  applyRoleDelegations,
  createRoleCommandState,
  defyRoleAuthority,
  getRoleOperationalScope,
  normalizeRoleCommandState,
  persuadeRoleAuthority,
  recordRoleActionEvidence,
  recordRoleInteraction,
  submitRoleAuthorityRequest,
} from './roleCommand';

describe('role command chain', () => {
  it('turns a request into a delayed review instead of instant direct control', () => {
    const role = getRole('britain-field-command', 'britain');
    const mandates = getRoleTabMandates(role);
    const state = createRoleCommandState(role);
    const submitted = submitRoleAuthorityRequest(state, role, mandates.research, '연구 개발', 0, { councilTrust: 65, reputation: 58 });
    expect(submitted?.requests[0].status).toBe('submitted');
    expect(applyRoleDelegations(mandates, submitted!, 0).research.mode).toBe('request');
    const reviewed = advanceRoleCommandWeek(submitted!, role, 1);
    expect(reviewed.state.requests[0].status).toBe('reviewing');
  });

  it('lets evidence and sponsors improve a pending request', () => {
    const role = getRole('britain-field-command', 'britain');
    const mandates = getRoleTabMandates(role);
    const submitted = submitRoleAuthorityRequest(createRoleCommandState(role), role, mandates.research, '연구 개발', 0, { councilTrust: 50, reputation: 50 })!;
    const evidence = persuadeRoleAuthority(submitted, submitted.requests[0].id, 'evidence')!;
    const sponsor = persuadeRoleAuthority(evidence.state, submitted.requests[0].id, 'sponsor')!;
    expect(evidence.politicalCost).toBe(2);
    expect(sponsor.state.requests[0].support).toBeGreaterThan(submitted.requests[0].support + 20);
    expect(sponsor.state.objective.tasks.find((task) => task.kind === 'chain')?.done).toBe(true);
  });

  it('allows a costly two-week emergency overreach without granting permanent authority', () => {
    const role = getRole('britain-field-command', 'britain');
    const mandates = getRoleTabMandates(role);
    const result = defyRoleAuthority(createRoleCommandState(role), role, mandates.economy, '전시 재무성', 4)!;
    expect(result.trustDelta).toBeLessThan(0);
    expect(applyRoleDelegations(mandates, result.state, 5).economy.label).toBe('비상 월권');
    const expired = advanceRoleCommandWeek(result.state, role, 6);
    expect(applyRoleDelegations(mandates, expired.state, 6).economy.mode).toBe('report');
  });

  it('requires successful action evidence in addition to visits and reports for weekly rewards', () => {
    const role = getRole('britain-field-command', 'britain');
    let state = createRoleCommandState(role, 0);
    const duty = state.objective.tasks.find((task) => task.kind === 'visit')!;
    state = recordRoleInteraction(state, 'direct', duty.tab!);
    state = recordRoleInteraction(state, 'report', 'economy');
    expect(state.objective.completed).toBe(false);
    expect(advanceRoleCommandWeek(state, role, 1).careerDelta).toEqual({ reputation: 0, councilTrust: 0, experience: 0 });
    state = recordRoleActionEvidence(state, role, { id: 'training-0', week: 0, tab: 'army', description: '예하 부대 훈련 집행', outcome: 'succeeded' });
    expect(state.objective.completed).toBe(true);
    const result = advanceRoleCommandWeek(state, role, 1);
    expect(result.careerDelta).toEqual({ reputation: 1, councilTrust: 2, experience: 5 });
    expect(result.state.objective.week).toBe(1);
    expect(result.state.objective.actionEvidence).toEqual([]);
    expect(advanceRoleCommandWeek(result.state, role, 1).careerDelta).toEqual({ reputation: 0, councilTrust: 0, experience: 0 });
    expect(advanceRoleCommandWeek(result.state, role, 2).careerDelta).toEqual({ reputation: 0, councilTrust: 0, experience: 0 });
  });

  it('rejects failed, unchanged, stale, future and out-of-authority evidence', () => {
    const role = getRole('britain-field-command', 'britain');
    const state = createRoleCommandState(role, 4);
    const evidence = { id: 'action-4', week: 4, tab: 'army' as const, description: '예하 부대 훈련 집행', outcome: 'succeeded' as const };
    for (const outcome of ['failed', 'unchanged'] as const) {
      expect(recordRoleActionEvidence(state, role, { ...evidence, outcome })).toBe(state);
    }
    for (const week of [3, 5]) expect(recordRoleActionEvidence(state, role, { ...evidence, week })).toBe(state);
    expect(recordRoleActionEvidence(state, role, { ...evidence, tab: 'economy' })).toBe(state);
    expect(recordRoleActionEvidence(state, role, { ...evidence, tab: 'command' })).toBe(state);
    expect(recordRoleActionEvidence(state, role, { ...evidence, description: ' ' })).toBe(state);
    const recorded = recordRoleActionEvidence(state, role, evidence);
    expect(recorded.objective.actionEvidence).toHaveLength(1);
    expect(recordRoleActionEvidence(recorded, role, evidence)).toBe(recorded);
  });

  it('recognizes successful actions inside an active delegation but not after it expires', () => {
    const role = getRole('britain-field-command', 'britain');
    const state = createRoleCommandState(role, 4);
    const delegated = defyRoleAuthority(state, role, getRoleTabMandates(role).economy, '전시 재무성', 4)!.state;
    const recorded = recordRoleActionEvidence(delegated, role, { id: 'budget-4', week: 4, tab: 'economy', description: '비상 조달 예산 승인', outcome: 'succeeded' });
    expect(recorded.objective.actionEvidence).toHaveLength(1);
    const expired = advanceRoleCommandWeek(recorded, role, 6).state;
    expect(recordRoleActionEvidence(expired, role, { id: 'budget-6', week: 6, tab: 'economy', description: '비상 조달 예산 승인', outcome: 'succeeded' })).toBe(expired);
  });

  it('migrates legacy completed objectives without treating menu visits as earned performance', () => {
    const role = getRole('britain-field-command', 'britain');
    const initial = createRoleCommandState(role, 0);
    const legacy = { ...initial, objective: { ...initial.objective, actionEvidence: undefined, completed: true, tasks: initial.objective.tasks.filter((task) => task.kind !== 'action').map((task) => ({ ...task, done: true })) } };
    const restored = normalizeRoleCommandState(legacy, role, 0);
    expect(restored.objective.tasks.find((task) => task.kind === 'action')?.done).toBe(false);
    expect(restored.objective.completed).toBe(false);
    expect(advanceRoleCommandWeek(restored, role, 1).careerDelta.experience).toBe(0);
    const earned = recordRoleActionEvidence(restored, role, { id: 'training-0', week: 0, tab: 'army', description: '예하 훈련 집행', outcome: 'succeeded' });
    const reloaded = normalizeRoleCommandState(JSON.parse(JSON.stringify(earned)), role, 0);
    expect(reloaded.objective.completed).toBe(true);
    expect(reloaded.objective.actionEvidence).toHaveLength(1);
    expect(advanceRoleCommandWeek(reloaded, role, 1).careerDelta.experience).toBe(5);
  });

  it('limits unit command to the formation assigned to a junior military post', () => {
    const baseRole = getRole('britain-field-command', 'britain');
    const divisions = ['a', 'b', 'c', 'd', 'e', 'f'];
    const juniorScope = getRoleOperationalScope({ ...baseRole, branch: 'military', tier: 5 }, divisions);
    const nationalScope = getRoleOperationalScope({ ...baseRole, branch: 'military', tier: 1 }, divisions);
    expect(juniorScope.divisionIds).toEqual(['a']);
    expect(juniorScope.level).toBe('unit');
    expect(nationalScope.divisionIds).toEqual(divisions);
  });

  it('gives non-military posts an observer scope over formations', () => {
    const baseRole = getRole('britain-field-command', 'britain');
    const scope = getRoleOperationalScope({ ...baseRole, branch: 'politics' }, ['a', 'b']);
    expect(scope.level).toBe('observer');
    expect(scope.divisionIds).toEqual([]);
  });

  it.each(nations)('aligns the real $id head of state with direct military mandates', (nation) => {
    expect(nations).toHaveLength(13);
    const role = getRole(nation.id + '-tier1', nation.id);
    expect(role.nationId).toBe(nation.id);
    expect(role.branch).toBe('politics');
    expect(role.tier).toBe(1);
    expect(role.archetype).toBe('head-of-state');
    const divisions = ['own-a', 'own-b', 'own-c'];
    const scope = getRoleOperationalScope(role, divisions);
    const mandates = getRoleTabMandates(role);
    expect(mandates.army.mode).toBe('direct');
    expect(mandates.map.mode).toBe('direct');
    expect(scope.level).toBe('national');
    expect(scope.label).toBe('국가 전군 통수');
    expect(scope.divisionIds).toEqual(divisions);
    expect(scope.divisionIds).not.toBe(divisions);
    scope.divisionIds.push('returned-list-only');
    expect(divisions).toEqual(['own-a', 'own-b', 'own-c']);
  });

  it.each(['politics', 'intelligence'] as const)('retains observer scope for every ordinary %s office', (branch) => {
    const roles = careerRoles.filter((role) => role.branch === branch && role.tier !== 1 && role.archetype !== 'head-of-state');
    expect(roles).toHaveLength(13 * 4);
    for (const role of roles) {
      const scope = getRoleOperationalScope(role, ['a', 'b', 'c', 'd']);
      expect(scope.level).toBe('observer');
      expect(scope.divisionIds).toEqual([]);
      expect(getRoleTabMandates(role).army.mode).toBe('report');
    }
  });

  it.each(nations)('preserves the existing real $id military tiers and formation limits', (nation) => {
    const divisions = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (const [suffix, tier, level, limit] of [
      ['tier2', 2, 'theater', 5],
      ['military-staff', 3, 'formation', 3],
      ['field-command', 4, 'unit', 2],
      ['unit-command', 5, 'unit', 1],
    ] as const) {
      const role = getRole(nation.id + '-' + suffix, nation.id);
      expect(role.branch).toBe('military');
      expect(role.tier).toBe(tier);
      const scope = getRoleOperationalScope(role, divisions);
      expect(scope.level).toBe(level);
      expect(scope.divisionIds).toEqual(divisions.slice(0, limit));
      expect(getRoleTabMandates(role).army.mode).toBe('direct');
    }
    expect(divisions).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it.each(['tier', 'archetype'] as const)('preserves the same independent highest-office %s exception as the mandate model', (exception) => {
    const ordinary = getRole('britain-political-minister', 'britain');
    const role = exception === 'tier' ? { ...ordinary, tier: 1 as const } : { ...ordinary, archetype: 'head-of-state' as const };
    expect(getRoleTabMandates(role).army.mode).toBe('direct');
    expect(getRoleOperationalScope(role, ['a']).level).toBe('national');
    expect(getRoleOperationalScope(role, ['a']).divisionIds).toEqual(['a']);
  });

  it('does not invent forces when the highest office has an empty current roster', () => {
    const head = getRole('britain-tier1', 'britain');
    const scope = getRoleOperationalScope(head, []);
    expect(scope.level).toBe('national');
    expect(scope.divisionIds).toEqual([]);
  });
});
