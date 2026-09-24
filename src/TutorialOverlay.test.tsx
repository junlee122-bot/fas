import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { careerRoles } from './campaign';
import { createCivilianCareerState, civilianOrigins } from './civilianCareer';
import { getRoleTabMandates } from './roleMandate';
import { getPlayGuide } from './playGuide';
import { buildTutorialSteps, TutorialOverlay } from './TutorialOverlay';

describe('role-aware first-session tutorial', () => {
  it('keeps each real office to five steps and reuses the actual play-guide first action', () => {
    for (const role of careerRoles) {
      const mandates = getRoleTabMandates(role);
      const before = JSON.stringify({ role, mandates });
      const steps = buildTutorialSteps(role.nationId, role, undefined, mandates);
      const first = getPlayGuide({ role, mandates }).firstAction;
      expect(steps).toHaveLength(5);
      expect(steps[0].target).toBe('.command-desk');
      expect(steps[1].target).toBe('.command-desk-briefing');
      expect(steps[2]).toMatchObject({ title: first.title, tab: first.tab, action: first.actionLabel });
      expect(steps.at(-1)?.tab).toBe('command');
      expect(steps.every((step) => step.target !== '.role-focus-briefing')).toBe(true);
      expect(JSON.stringify({ role, mandates })).toBe(before);
    }
  });

  it('does not promise direct fiscal policy to a tier-three politician', () => {
    const role = careerRoles.find((item) => item.branch === 'politics' && item.tier === 3)!;
    const steps = buildTutorialSteps(role.nationId, role);
    expect(steps[3]).toMatchObject({ tab: 'economy', title: '재정은 보고받고 필요한 권한을 상신합니다' });
    expect(steps[3].detail).toContain('상신 필요');
    expect(steps[3].detail).not.toContain('정책을 결재');
  });

  it('does not infer that a junior military officer must request every command', () => {
    const role = careerRoles.find((item) => item.branch === 'military' && item.tier === 5)!;
    const steps = buildTutorialSteps(role.nationId, role);
    expect(steps[2].tab).toBe('army');
    expect(steps[3].detail).toContain('실제 예하 부대는 직접 지휘');
    expect(steps[3].detail).toContain('모든 지휘관의 의무는 아닙니다');
  });

  it('uses the current desk for Korean headquarters guidance without making the homeland owned territory', () => {
    const role = careerRoles.find((item) => item.nationId === 'korea')!;
    const opening = buildTutorialSteps('korea', role)[0];
    expect(opening.target).toBe('.command-desk');
    expect(opening.detail).toContain('충칭');
    expect(opening.detail).toContain('일제 점령지');
  });

  it('keeps a civilian on the personal-career surface with no forced institutional entry', () => {
    const role = careerRoles[0];
    const civilian = createCivilianCareerState('scientist', civilianOrigins[0].id);
    const steps = buildTutorialSteps(role.nationId, role, civilian);
    expect(steps).toHaveLength(4);
    expect(steps.every((step) => step.tab === 'command')).toBe(true);
    expect(steps[2].target).toBe('.civilian-actions-board');
    expect(steps[2].detail).toContain('보직 진입은 필수가 아니며');
    expect(steps.at(-1)?.detail).toContain('자동 실행되지 않습니다');
  });

  it('renders as a labelled dialog without executing navigation, completion, or game actions', () => {
    const onNavigate = vi.fn();
    const onComplete = vi.fn();
    const role = careerRoles[0];
    const html = renderToStaticMarkup(<TutorialOverlay role={role} nationId={role.nationId} onNavigate={onNavigate} onComplete={onComplete} />);
    expect(html).toContain('role="dialog" aria-modal="true"');
    expect(html).toContain('찾아갈 곳');
    expect(html).toContain('1/5');
    expect(html).toContain('건너뛰어도 불이익은 없습니다');
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
