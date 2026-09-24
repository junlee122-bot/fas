import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getRole } from './campaign';
import { createClandestineCareerState, type ClandestineCareerState } from './clandestineCareer';
import { ClandestineCareerCenter } from './ClandestineCareerCenter';

const role = getRole('britain-intelligence-director', 'britain');
function stateForDesk() {
  const state = createClandestineCareerState({ homeNationId: 'britain', handlerNationId: 'usa', week: 8, role, weeklyRetainer: 8 });
  state.missions = [];
  return state;
}
function render(state: ClandestineCareerState | null) {
  const callbacks = { onMissionResponse: vi.fn(), onIncidentResponse: vi.fn(), onPostureChange: vi.fn() };
  const before = structuredClone(state);
  const html = renderToStaticMarkup(<ClandestineCareerCenter state={state} role={role} week={8} intelNetwork={75} exposure={12} formatMoney={(value) => `£${value}`} {...callbacks} />);
  expect(state).toEqual(before);
  Object.values(callbacks).forEach((callback) => expect(callback).not.toHaveBeenCalled());
  return html;
}

describe('clandestine supporting illustration boundaries', () => {
  it('adds one abstract network still life only to the non-urgent desk', () => {
    const html = render(stateForDesk());
    expect(html.match(/data-game-illustration="clandestine-network"/g)).toHaveLength(1);
    expect(html).toContain('추상화된 비밀 연락망');
    expect(html).toContain('주간 비밀수당');
  });

  it('does not add art to a locked clandestine career', () => {
    expect(render(null)).not.toContain('data-game-illustration=');
  });

  it('does not add art beside pending mission decisions', () => {
    const state = createClandestineCareerState({ homeNationId: 'britain', handlerNationId: 'usa', week: 8, role, weeklyRetainer: 8 });
    expect(render(state)).not.toContain('data-game-illustration=');
  });

  it('keeps urgent incident choices free of illustration and does not resolve them', () => {
    const state = stateForDesk();
    state.incident = { id: 'urgent-art-boundary', kind: 'internal-audit', openedWeek: 8, title: '접근기록 감사', detail: '현재 사건의 실제 검토', stakes: ['보안인가'] };
    const html = render(state);
    expect(html).toContain('긴급 방첩 사건');
    expect(html).toContain('시간 정지');
    expect(html).not.toContain('data-game-illustration=');
  });
});
