import { describe, expect, it } from 'vitest';
import { deriveWorldChangeProfile } from './worldChangeVisualization';
import type { EmergentHistoryProfile } from './emergentHistory';
import type { StaffMember, Territory } from './types';

const trajectory: EmergentHistoryProfile = {
  forces: { military: 70, industry: 30, diplomacy: 25, civic: 20, liberation: 18, intelligence: 22 },
  metricMomentum: { deterrence: 10, multipolarity: 0, decolonization: 0, rights: 0, prosperity: 0, instability: 3 },
  dominantForce: 'military', secondaryForce: 'industry', title: '군사 주도', summary: '전선 중심', influences: [], resolvedChoiceCount: 1, signature: 'test', nextLevers: [],
};

const baseline: Territory[] = [{ id: 'city', name: '시험도시', region: '유럽', x: 0, y: 0, controller: 'axis', value: 8, supply: 70, terrain: 'urban', neighbors: [] }];

describe('world change visualization', () => {
  it('turns a control change into a visible liberation signal', () => {
    const profile = deriveWorldChangeProfile({
      territories: [{ ...baseline[0], controller: 'allies', supply: 52 }],
      baselineTerritories: baseline,
      relations: [{ id: 'partner', name: '동맹국', code: 'AL', value: 72, status: '동맹', color: '#fff' }],
      baselineRelations: [{ id: 'partner', name: '동맹국', code: 'AL', value: 50, status: '중립', color: '#fff' }],
      staff: [], events: [], trajectory, playerFaction: 'allies',
    });
    expect(profile.territoryChanges[0]).toMatchObject({ territoryId: 'city', kind: 'liberated', tone: 'positive' });
    expect(profile.relationChanges[0].after).toBe('72/100');
    expect(profile.editorialTone).toBe('frontline');
  });

  it('exposes staff fractures and confirmed choice consequences', () => {
    const staff = [{ id: 's', name: '참모', role: '작전국장', loyalty: 30, workload: 95, roleSatisfaction: 25 }] as StaffMember[];
    const profile = deriveWorldChangeProfile({
      territories: baseline, baselineTerritories: baseline, relations: [], baselineRelations: [], staff,
      events: [{ id: 1, week: 4, title: '의회 개혁 확정', detail: '권리 확대', tone: 'good', trace: { domain: 'management', decision: '개혁 선택', trigger: '표결 통과', factors: [], effects: [{ label: '권리', value: '+8', tone: 'positive' }], ongoing: ['다음 선거에 반영'], nextActions: [], certainty: 'confirmed' } }],
      trajectory: { ...trajectory, dominantForce: 'civic' }, playerFaction: 'allies',
    });
    expect(profile.organizationChanges[0].title).toContain('이탈');
    expect(profile.recentSignals.some((signal) => signal.after === '+8')).toBe(true);
    expect(profile.editorialTone).toBe('reformist');
  });
});
