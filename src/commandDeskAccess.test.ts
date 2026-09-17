import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { careerRoles, getRole, nations } from './campaign';
import { isCommandDeskActionVisible, isCommandDeskFocusTab } from './commandDeskAccess';
import { getRoleTabMandates } from './roleMandate';
import { applyRoleDelegations, createRoleCommandState, defyRoleAuthority, getRoleCommandChainProfile, getRoleOperationalScope } from './roleCommand';
import { RoleFocusBriefing } from './RoleFocusBriefing';
import type { CareerBranch, GameTab } from './types';
import type { UXAction } from './ux';

const allTabs: GameTab[] = ['command', 'governance', 'map', 'organization', 'economy', 'health', 'army', 'industry', 'research', 'diplomacy', 'intelligence'];
const expectedRemits: Record<CareerBranch, GameTab[]> = {
  military: ['army', 'map', 'industry', 'research', 'organization'],
  politics: ['governance', 'economy', 'diplomacy', 'health', 'industry', 'research', 'organization'],
  intelligence: ['intelligence', 'map', 'diplomacy', 'research', 'organization'],
};
const action = (tab: GameTab, id = 'ordinary'): UXAction => ({ id, tab, title: `검토 안건 ${id}`, detail: '기록된 근거', label: '안건 열기', priority: 'urgent', resolution: '다음 결산' });

describe('shared command-desk presentation access', () => {
  it.each(nations)('does not hide $id highest-office army/map/intelligence decisions that are already authorized', (nation) => {
    const role = getRole(nation.id + '-tier1', nation.id);
    const mandates = getRoleTabMandates(role);
    for (const tab of ['army', 'map', 'intelligence'] as const) {
      expect(mandates[tab].mode).toBe('direct');
      expect(isCommandDeskFocusTab(role, tab)).toBe(true);
      expect(isCommandDeskActionVisible(role, mandates, action(tab))).toBe(true);
    }
  });

  it.each(['tier', 'archetype'] as const)('matches the existing independent highest-office %s exception', (exception) => {
    const ordinary = getRole('britain-field-command', 'britain');
    const role = exception === 'tier' ? { ...ordinary, tier: 1 as const } : { ...ordinary, archetype: 'head-of-state' as const };
    const mandates = getRoleTabMandates(role);
    for (const tab of allTabs) expect(isCommandDeskActionVisible(role, mandates, action(tab))).toBe(mandates[tab].mode === 'direct');
    expect(isCommandDeskActionVisible(role, mandates, action('organization', 'national-policy'))).toBe(true);
    expect(isCommandDeskActionVisible(role, mandates, action('organization', 'political-crisis'))).toBe(true);
  });

  it.each(['military', 'politics', 'intelligence'] as const)('preserves every ordinary %s office branch remit', (branch) => {
    const roles = careerRoles.filter((role) => role.branch === branch && role.tier !== 1 && role.archetype !== 'head-of-state');
    expect(roles.length).toBeGreaterThan(0);
    for (const role of roles) {
      const mandates = getRoleTabMandates(role);
      for (const tab of allTabs) {
        expect(isCommandDeskFocusTab(role, tab), `${role.id}:${tab}`).toBe(expectedRemits[branch].includes(tab));
        expect(isCommandDeskActionVisible(role, mandates, action(tab)), `${role.id}:${tab}`)
          .toBe(mandates[tab].mode === 'direct' && expectedRemits[branch].includes(tab));
      }
    }
  });

  it.each(['request', 'report', 'locked'] as const)('never promotes a supplied %s mandate to direct access, even for a head of state', (mode) => {
    const role = getRole('britain-tier1', 'britain');
    const mandates = getRoleTabMandates(role);
    mandates.army = { ...mandates.army, mode };
    expect(isCommandDeskFocusTab(role, 'army')).toBe(true);
    expect(isCommandDeskActionVisible(role, mandates, action('army'))).toBe(false);
    expect(mandates.army.mode).toBe(mode);
  });

  it('retains the national-policy and political-crisis limits for lower offices', () => {
    for (const role of careerRoles.filter((item) => item.tier !== 1 && item.archetype !== 'head-of-state')) {
      const mandates = getRoleTabMandates(role);
      expect(isCommandDeskActionVisible(role, mandates, action('organization', 'national-policy'))).toBe(role.branch === 'politics');
      expect(isCommandDeskActionVisible(role, mandates, action('organization', 'political-crisis'))).toBe(role.branch !== 'military' || role.tier <= 2);
    }
  });

  it('follows actual delegation expiry without granting unrelated branch decisions', () => {
    const role = getRole('britain-field-command', 'britain');
    const base = getRoleTabMandates(role);
    const delegated = defyRoleAuthority(createRoleCommandState(role, 4), role, base.research, '연구 개발', 4)!.state;
    expect(isCommandDeskActionVisible(role, applyRoleDelegations(base, delegated, 5), action('research'))).toBe(true);
    expect(isCommandDeskActionVisible(role, applyRoleDelegations(base, delegated, 6), action('research'))).toBe(false);
    const directEconomy = { ...base, economy: { ...base.economy, mode: 'direct' as const } };
    expect(isCommandDeskActionVisible(role, directEconomy, action('economy'))).toBe(false);
  });

  it('filters stably, keeps original action identities, and does not mutate roles or mandates', () => {
    const role = getRole('britain-field-command', 'britain'); const mandates = getRoleTabMandates(role);
    const actions = [action('economy', 'outside'), action('army', 'first'), action('organization', 'second')];
    const before = JSON.stringify({ role, mandates, actions });
    const queue = actions.filter((item) => isCommandDeskActionVisible(role, mandates, item));
    expect(queue).toEqual([actions[1], actions[2]]); expect(queue[0]).toBe(actions[1]); expect(queue[1]).toBe(actions[2]);
    expect(JSON.stringify({ role, mandates, actions })).toBe(before);
    expect(isCommandDeskActionVisible(role, mandates, { id: 'unknown', tab: 'unknown' } as never)).toBe(false);
  });

  it.each(['army', 'map', 'intelligence'] as const)('connects RoleFocusBriefing to the shared highest-office %s decision rule without side effects', (tab) => {
    const role = getRole('britain-tier1', 'britain'); const mandates = getRoleTabMandates(role);
    const onAction = vi.fn(); const onNavigate = vi.fn(); const onNextWeek = vi.fn(); const onToggleExpanded = vi.fn();
    const commandState = createRoleCommandState(role, 4); const before = JSON.stringify(commandState);
    const html = renderToStaticMarkup(RoleFocusBriefing({ role, mandates, actions: [action(tab, `head-${tab}`)], tabs: allTabs.map((id) => ({ id, label: id })),
      worldlineTitle: '현재 세계선', expanded: false, commandState, commandChain: getRoleCommandChainProfile(role), operationalScope: getRoleOperationalScope(role, []),
      onAction, onNavigate, onNextWeek, onToggleExpanded }));
    expect(html).toContain(`검토 안건 head-${tab}`);
    expect(html).not.toContain('즉시 결재할 위기 없음');
    for (const callback of [onAction, onNavigate, onNextWeek, onToggleExpanded]) expect(callback).not.toHaveBeenCalled();
    expect(JSON.stringify(commandState)).toBe(before);
  });
});
