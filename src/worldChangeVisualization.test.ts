import { describe, expect, it } from 'vitest';
import { createWorldChangeBaseline, deriveWorldChangeProfile, normalizeWorldChangeBaseline, territoryWorldChangeLabels } from './worldChangeVisualization';
import type { EmergentHistoryProfile } from './emergentHistory';
import type { Faction, StaffMember, Territory, WarEvent } from './types';

const trajectory: EmergentHistoryProfile = {
  forces: { military: 70, industry: 30, diplomacy: 25, civic: 20, liberation: 18, intelligence: 22 },
  metricMomentum: { deterrence: 10, multipolarity: 0, decolonization: 0, rights: 0, prosperity: 0, instability: 3 },
  dominantForce: 'military', secondaryForce: 'industry', title: '군사 주도', summary: '전선 중심', influences: [], resolvedChoiceCount: 1, signature: 'test', nextLevers: [],
};

const baseline: Territory[] = [{ id: 'city', name: '시험도시', region: '유럽', x: 0, y: 0, controller: 'axis', value: 8, supply: 70, terrain: 'urban', neighbors: [] }];
const relation = { id: 'partner', name: '동맹국', code: 'AL', value: 50, status: '중립', color: '#fff' };
const profileFor = (before: Territory, after: Territory, playerFaction: 'allies' | 'axis' = 'allies', events: WarEvent[] = []) => deriveWorldChangeProfile({
  territories: [after], baselineTerritories: [before], relations: [], baselineRelations: [], staff: [], events, trajectory, playerFaction,
});

describe('world change visualization', () => {
  it('reports the observed control faction without inventing liberation or sovereignty', () => {
    const profile = deriveWorldChangeProfile({
      territories: [{ ...baseline[0], controller: 'allies', supply: 52 }],
      baselineTerritories: baseline,
      relations: [{ id: 'partner', name: '동맹국', code: 'AL', value: 72, status: '동맹', color: '#fff' }],
      baselineRelations: [{ id: 'partner', name: '동맹국', code: 'AL', value: 50, status: '중립', color: '#fff' }],
      staff: [], events: [], trajectory, playerFaction: 'allies',
    });
    expect(profile.territoryChanges[0]).toMatchObject({ territoryId: 'city', kind: 'control-changed', tone: 'contested', before: '추축권', after: '연합권' });
    expect(profile.territoryChanges[0].detail).toContain('이 진영 값만으로 확인할 수 없습니다');
    expect(profile.recentSignals.find((signal) => signal.territoryId === 'city')?.title).toBe('시험도시 · 통제 진영 변경');
    expect(profile.relationChanges[0].after).toBe('72/100');
    expect(profile.editorialTone).toBe('frontline');
  });

  it.each(['allies', 'axis'] as const)('does not change factual control labels with the player faction %s', (playerFaction) => {
    const profile = profileFor(baseline[0], { ...baseline[0], controller: 'allies' }, playerFaction);
    expect(profile.territoryChanges[0]).toMatchObject({ kind: 'control-changed', tone: 'contested', before: '추축권', after: '연합권' });
    expect(profile.territoryChanges[0].detail).not.toMatch(/해방|주둔|신문 보도에 반영/);
    expect(profile.territoryChanges).toHaveLength(1);
  });

  it.each([
    { from: 30, to: 60, kind: 'supply-improved', label: '보급 개선', tone: 'positive' },
    { from: 80, to: 50, kind: 'supply-declined', label: '보급 악화', tone: 'negative' },
  ])('reports only supply readings for $kind', ({ from, to, kind, label, tone }) => {
    const profile = profileFor({ ...baseline[0], supply: from }, { ...baseline[0], supply: to });
    const change = profile.territoryChanges[0];
    expect(change).toMatchObject({ kind, before: `보급 ${from}%`, after: `보급 ${to}%`, tone });
    expect(change.detail).toContain(`보급 수치가 ${from}%에서 ${to}%로`);
    expect(change.detail).toContain('확인할 수 없습니다');
    expect(change.detail).not.toMatch(/복구되|훼손되어|도시의 상흔|개선됐습니다/);
    expect(profile.recentSignals[0].title).toBe(`시험도시 · ${label}`);
  });

  it('keeps the existing 15-point supply threshold and the one-representative-change priority', () => {
    expect(profileFor(baseline[0], { ...baseline[0], supply: 84 }).territoryChanges).toEqual([]);
    expect(profileFor(baseline[0], { ...baseline[0], supply: 85 }).territoryChanges[0].kind).toBe('supply-improved');
    const both = profileFor({ ...baseline[0], ownerId: 'germany' }, { ...baseline[0], controller: 'allies', ownerId: 'korea', supply: 10 });
    expect(both.territoryChanges).toHaveLength(1);
    expect(both.territoryChanges[0].kind).toBe('control-changed');
  });

  it('reports recorded same-faction attribution changes without asserting legal sovereignty or diplomatic recognition', () => {
    const profile = profileFor({ ...baseline[0], ownerId: 'germany' }, { ...baseline[0], ownerId: 'japan' });
    expect(profile.territoryChanges[0]).toMatchObject({ kind: 'attribution-changed', before: '게임 귀속 독일', after: '게임 귀속 일본', tone: 'contested' });
    expect(profile.territoryChanges[0].detail).toContain('통제 진영은 추축권으로 동일합니다');
    expect(profile.territoryChanges[0].detail).toContain('법적 주권 이양이나 외교적 승인을 확정하지 않습니다');
    expect(profile.recentSignals[0].title).toBe('시험도시 · 게임 귀속 변경');
  });

  it('does not invent attribution history from an absent, invalid or unchanged owner record', () => {
    expect(profileFor(baseline[0], { ...baseline[0], ownerId: 'korea' }).territoryChanges).toEqual([]);
    expect(profileFor({ ...baseline[0], ownerId: 'korea' }, baseline[0]).territoryChanges).toEqual([]);
    expect(profileFor({ ...baseline[0], ownerId: 'korea' }, { ...baseline[0], ownerId: 'korea' }).territoryChanges).toEqual([]);
    expect(profileFor({ ...baseline[0], ownerId: 'constructor' as Territory['ownerId'] }, { ...baseline[0], ownerId: 'korea' }).territoryChanges).toEqual([]);
  });

  it('never derives a sovereignty or city-damage state by parsing an event headline', () => {
    const event: WarEvent = { id: 8, week: 9, title: '시험도시 해방과 주권 이양, 도시 재건 완료', detail: '정치적 주장과 생활 복구에 관한 기사', tone: 'good',
      trace: { domain: 'history', decision: '기사 열람', trigger: '보고', factors: [], effects: [], ongoing: [], nextActions: [], certainty: 'confirmed' } };
    const profile = profileFor(baseline[0], baseline[0], 'allies', [event]);
    expect(profile.territoryChanges).toEqual([]);
    expect(profile.recentSignals[0]).toMatchObject({ id: 'event-change-8', title: event.title });
    expect(profile.recentSignals[0].territoryId).toBeUndefined();
    expect(territoryWorldChangeLabels).toEqual({ 'control-changed': '통제 진영 변경', 'attribution-changed': '게임 귀속 변경', 'supply-improved': '보급 개선', 'supply-declined': '보급 악화' });
  });

  it('ignores invalid live comparison fields instead of publishing NaN or undefined changes', () => {
    expect(profileFor(baseline[0], { ...baseline[0], supply: NaN }).territoryChanges).toEqual([]);
    expect(profileFor(baseline[0], { ...baseline[0], controller: 'invalid' as Faction }).territoryChanges).toEqual([]);
    expect(profileFor({ ...baseline[0], supply: Infinity }, baseline[0]).territoryChanges).toEqual([]);
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

describe('world change display baseline normalization', () => {
  it('keeps valid legacy snapshots and clones mutable arrays', () => {
    const previous = [{ ...baseline[0], neighbors: ['neighbor'], ownerId: 'germany' as const }];
    const saved = createWorldChangeBaseline(previous, [relation]);
    const normalized = normalizeWorldChangeBaseline(saved, [{ ...baseline[0], controller: 'allies', ownerId: 'korea' }], [{ ...relation, value: 70 }]);
    expect(normalized).toEqual(saved);
    expect(normalized).not.toBe(saved);
    normalized.territories[0].neighbors.push('changed');
    normalized.relations[0].value = 0;
    expect(saved.territories[0].neighbors).toEqual(['neighbor']);
    expect(saved.relations[0].value).toBe(50);
  });

  it('repairs missing old neighbors without copying current ownerId into the past', () => {
    const { neighbors: _neighbors, ...old } = baseline[0];
    const current = [{ ...baseline[0], ownerId: 'korea' as const, neighbors: ['present-neighbor'] }];
    const saved = { territories: [{ ...old, supply: 50 }], relations: [] };
    const normalized = normalizeWorldChangeBaseline(saved, current, []);
    expect(normalized.territories[0]).toMatchObject({ controller: 'axis', supply: 50, neighbors: ['present-neighbor'] });
    expect(normalized.territories[0].ownerId).toBeUndefined();
    expect(profileFor(normalized.territories[0], current[0]).territoryChanges[0].kind).toBe('supply-improved');
    normalized.territories[0].neighbors.push('extra');
    expect(current[0].neighbors).toEqual(['present-neighbor']);
  });

  it.each([
    null, {}, { territories: [], relations: [] },
    { territories: [{ ...baseline[0], id: '' }], relations: [relation] },
    { territories: [{ ...baseline[0], id: '   ' }], relations: [relation] },
    { territories: [{ ...baseline[0], controller: 'unknown' }], relations: [relation] },
    { territories: [{ ...baseline[0], controller: 'constructor' }], relations: [relation] },
    { territories: [{ ...baseline[0], supply: NaN }], relations: [relation] },
    { territories: [{ ...baseline[0], supply: Infinity }], relations: [relation] },
    { territories: [{ ...baseline[0], supply: -1 }], relations: [relation] },
    { territories: [{ ...baseline[0], supply: 101 }], relations: [relation] },
    { territories: [baseline[0], baseline[0]], relations: [relation] },
    { territories: baseline, relations: [{ ...relation, id: '' }] },
    { territories: baseline, relations: [{ ...relation, value: NaN }] },
    { territories: baseline, relations: [{ ...relation, value: Infinity }] },
    { territories: baseline, relations: [relation, relation] },
  ])('falls back safely for malformed or empty snapshots %#', (saved) => {
    const normalized = normalizeWorldChangeBaseline(saved, baseline, [relation]);
    expect(normalized).toEqual(createWorldChangeBaseline(baseline, [relation]));
  });

  it('retains intentionally empty scenarios and diplomacy lists', () => {
    expect(normalizeWorldChangeBaseline({ territories: [], relations: [] }, [], [])).toEqual({ territories: [], relations: [] });
    expect(normalizeWorldChangeBaseline({ territories: baseline, relations: [] }, baseline, []).relations).toEqual([]);
  });

  it('does not erase valid territorial history when the diplomatic snapshot is missing entries or malformed', () => {
    const current = [{ ...baseline[0], controller: 'allies' as const, supply: 90 }];
    for (const relations of [[], [{ ...relation, value: NaN }]]) {
      const normalized = normalizeWorldChangeBaseline({ territories: baseline, relations }, current, [relation]);
      expect(normalized.territories[0]).toMatchObject({ controller: 'axis', supply: 70 });
      expect(normalized.relations).toEqual([relation]);
      expect(profileFor(normalized.territories[0], current[0]).territoryChanges[0].kind).toBe('control-changed');
    }
  });
});
