import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { careerRoles } from './campaign';
import { SocialistWorldBoard } from './SocialistWorldBoard';
import { createSocialistWorldState, type SocialistWorldContext } from './socialistWorld';

function fixture() {
  // Reuse the existing campaign role and state constructors, with the context
  // values used by the socialistWorld engine tests.
  const context: SocialistWorldContext = {
    week: 1,
    year: 1942,
    phase: 'war',
    nationId: 'korea',
    role: structuredClone(careerRoles.find((candidate) => candidate.nationId === 'korea' && candidate.branch === 'politics' && candidate.tier === 4)!),
    politicalPower: 100,
    treasury: 500,
    stability: 64,
    warSupport: 68,
    enemyPressure: 38,
    legitimacy: 67,
    unrest: 52,
    welfare: 48,
    employment: 66,
    inequality: 62,
    education: 64,
    civilianIndustry: 62,
    institutionalCapacity: 66,
    publicConfidence: 61,
    inflation: 6,
    relationAverage: 58,
    laborSupport: 68,
    laborInfluence: 64,
    civicSupport: 62,
    intelligentsiaSupport: 65,
    securitySupport: 55,
  };
  return {
    state: createSocialistWorldState('korea', 0),
    context,
    staff: [],
    onStart: vi.fn(),
    onSettlement: vi.fn(),
    onMethod: vi.fn(),
  };
}

describe('socialist board illustration integration', () => {
  it.each([
    ['compact', true, 0],
    ['expanded', false, 1],
    ['default', undefined, 1],
  ] as const)('renders the expected artwork count in %s mode without executing a choice', (_label, compact, expectedCount) => {
    const props = fixture();
    const before = structuredClone({ state: props.state, context: props.context, staff: props.staff });
    // Omit the prop entirely in the default case to exercise the real default.
    const html = renderToStaticMarkup(compact === undefined
      ? <SocialistWorldBoard {...props} />
      : <SocialistWorldBoard {...props} compact={compact} />);

    expect(html.match(/data-game-illustration=/g) ?? []).toHaveLength(expectedCount);
    expect(html.match(/data-game-illustration="socialist-planning"/g) ?? []).toHaveLength(expectedCount);
    expect(html.match(/<img\b/g) ?? []).toHaveLength(expectedCount);
    expect(html.includes('상징 삽화 · 실제 기록 아님')).toBe(expectedCount === 1);
    expect(html).toContain('계급 압력');
    expect(html).toContain('사회적 소유');
    expect({ state: props.state, context: props.context, staff: props.staff }).toEqual(before);
    [props.onStart, props.onSettlement, props.onMethod].forEach((callback) => expect(callback).not.toHaveBeenCalled());
  });
});
