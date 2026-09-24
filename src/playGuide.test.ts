import { describe, expect, it } from 'vitest';
import { getPlayGuide } from './playGuide';
import { getRoleTabMandates, type RoleAccessMode } from './roleMandate';
import type { CareerRole, CareerTier, GameTab } from './types';

function role(branch: CareerRole['branch'], tier: CareerTier): CareerRole {
  return {
    id: `guide-${branch}-${tier}`, nationId: 'britain', branch, tier,
    title: '시험 보직', archetype: 'bureau-director', scope: '배정된 업무', authority: 50,
    expectation: '업무 확인', historicalHolderId: 'holder', historicalHolderName: '인물',
    historicalOffice: '역사 보직', historicalBasis: '시험', coverIdentity: '공식 기관', replacementEffect: '교체',
  };
}

const branches: CareerRole['branch'][] = ['military', 'politics', 'intelligence'];
const tiers: CareerTier[] = [1, 2, 3, 4, 5];
const expectedTabs: GameTab[] = ['governance', 'map', 'organization', 'economy', 'health', 'army', 'industry', 'research', 'diplomacy', 'intelligence'];
const firstTabs: Record<CareerRole['branch'], GameTab> = { military: 'army', politics: 'organization', intelligence: 'intelligence' };

describe('read-only first-session play guide', () => {
  for (const branch of branches) {
    for (const tier of tiers) {
      it(`explains ${branch} tier ${tier} using its actual mandates`, () => {
        const currentRole = role(branch, tier);
        const mandates = getRoleTabMandates(currentRole);
        const guide = getPlayGuide({ role: currentRole, mandates });
        expect(guide.firstAction.tab).toBe(firstTabs[branch]);
        expect(guide.capabilities.map((entry) => entry.id).sort()).toEqual([...expectedTabs].sort());
        expect(new Set(guide.capabilities.map((entry) => entry.id)).size).toBe(10);
        for (const entry of guide.capabilities) {
          expect(entry.mode).toBe(mandates[entry.id].mode);
          expect(entry.reason).toBe(mandates[entry.id].reason);
          expect(entry.description).toBeTruthy();
          expect(entry.result).toBeTruthy();
        }
        expect(guide.firstAction.actionLabel).not.toMatch(/승인|집행|시행|실행/);
      });
    }
  }

  it('does not invent mandatory requests for junior military unit control', () => {
    const currentRole = role('military', 5);
    const guide = getPlayGuide({ role: currentRole, mandates: getRoleTabMandates(currentRole) });
    expect(guide.capabilities.find((entry) => entry.id === 'army')?.mode).toBe('direct');
    expect(guide.firstAction.detail).toContain('내 지휘 범위');
    expect(guide.firstAction.actionLabel).not.toContain('상신');
    expect(guide.firstAction.result).toContain('모든 이동·전투가 다음 주에 끝나지는 않습니다');
  });

  it('preserves head-of-state authority independently of numeric tier', () => {
    const head = { ...role('politics', 4), archetype: 'head-of-state' as const };
    const guide = getPlayGuide({ role: head, mandates: getRoleTabMandates(head) });
    expect(guide.capabilities.every((entry) => entry.mode === 'direct')).toBe(true);
    expect(guide.firstAction.title).toBe('참모와 권한 확인');
  });

  it('uses current delegated authority instead of recomputing base role access', () => {
    const currentRole = role('military', 5);
    const mandates = getRoleTabMandates(currentRole);
    mandates.research = { ...mandates.research, mode: 'direct', reason: '현재 유효한 연구 위임' };
    const guide = getPlayGuide({ role: currentRole, mandates });
    expect(guide.capabilities.find((entry) => entry.id === 'research')).toMatchObject({
      mode: 'direct', accessLabel: '직접 담당', reason: '현재 유효한 연구 위임',
    });
  });

  it.each([
    ['request', '상신 검토'], ['report', '보고 열람'], ['locked', '권한 필요'],
  ] as const)('does not promise execution for a %s primary desk', (mode, actionLabel) => {
    const currentRole = role('intelligence', 3);
    const mandates = getRoleTabMandates(currentRole);
    mandates.intelligence = { ...mandates.intelligence, mode, reason: '현재 권한 설명' };
    const guide = getPlayGuide({ role: currentRole, mandates });
    expect(guide.firstAction.actionLabel).toBe(actionLabel);
    expect(guide.firstAction.detail).toContain('현재 권한 설명');
    expect(guide.firstAction.detail).not.toContain('요원과 표적을 비교한 뒤');
    expect(guide.capabilities.find((entry) => entry.id === 'intelligence')).toMatchObject({ mode, actionLabel });
    if (mode === 'locked') expect(guide.firstAction.result).toContain('화면을 열 수 없습니다');
  });

  it('gives request and report portfolios different routes and checkpoints', () => {
    const currentRole = role('politics', 3);
    const guide = getPlayGuide({ role: currentRole, mandates: getRoleTabMandates(currentRole) });
    const economy = guide.capabilities.find((entry) => entry.id === 'economy')!;
    const army = guide.capabilities.find((entry) => entry.id === 'army')!;
    expect(economy).toMatchObject({ mode: 'request', actionLabel: '상신 검토' });
    expect(economy.result).toContain('승인이 보장되지는 않습니다');
    expect(army).toMatchObject({ mode: 'report', actionLabel: '보고 열람' });
    expect(army.result).toContain('보고 열람만으로');
    expect(guide.firstAction.title).toBe('참모와 권한 확인');
  });

  it('keeps civilian discovery on personal activity even with inconsistent national mandates', () => {
    const currentRole = role('politics', 1);
    const mandates = getRoleTabMandates(currentRole);
    const civilian = { professionId: 'scientist' as const, originId: 'exile-diaspora' as const };
    const guide = getPlayGuide({ role: currentRole, mandates, civilian });
    expect(guide.firstAction.tab).toBe('command');
    expect(guide.firstAction.actionLabel).toBe('시민 활동실 살펴보기');
    expect(guide.roleSummary).toContain('과학자·연구자');
    expect(guide.roleSummary).toContain('망명·디아스포라');
    expect(guide.capabilities.every((entry) => entry.mode === 'locked' && entry.actionLabel === '권한 필요')).toBe(true);
    expect(Object.values(mandates).every((mandate) => mandate.mode === 'direct')).toBe(true);
  });

  it('does not grant authority when opening a civilian guide', () => {
    const currentRole = role('military', 4);
    const mandates = getRoleTabMandates(currentRole, 'civilian');
    const guide = getPlayGuide({ role: currentRole, mandates, civilian: { professionId: 'journalist', originId: 'working-community' } });
    expect(guide.capabilities.every((entry) => entry.mode === 'locked')).toBe(true);
    expect(guide.firstAction.detail).toContain('국가 정책을 대신 결재하는 것이 아니라');
    expect(guide.firstAction.result).toContain('개인 활동 기록');
  });

  it('returns fresh data without modifying roles, mandates or civilian state', () => {
    const currentRole = Object.freeze(role('politics', 2));
    const mandates = getRoleTabMandates(currentRole);
    Object.values(mandates).forEach(Object.freeze);
    Object.freeze(mandates);
    const civilian = Object.freeze({ professionId: 'intellectual' as const, originId: 'university-network' as const });
    const input = Object.freeze({ role: currentRole, mandates, civilian });
    const before = JSON.stringify(input);
    const first = getPlayGuide(input);
    const second = getPlayGuide(input);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.capabilities[0]).not.toBe(second.capabilities[0]);
    first.capabilities[0].mode = 'direct' as RoleAccessMode;
    expect(second.capabilities[0].mode).toBe('locked');
    expect(JSON.stringify(input)).toBe(before);
  });

  it('keeps research, production and diplomacy outcomes distinct from immediate completion', () => {
    const currentRole = role('politics', 1);
    const guide = getPlayGuide({ role: currentRole, mandates: getRoleTabMandates(currentRole) });
    const result = (id: GameTab) => guide.capabilities.find((entry) => entry.id === id)!.result;
    expect(result('research')).toContain('서로 다른 단계');
    expect(result('industry')).toContain('실제 도착 상태');
    expect(result('diplomacy')).toContain('제안과 합의는 다릅니다');
    expect(result('economy')).toContain('다음 주 결산');
  });
});
