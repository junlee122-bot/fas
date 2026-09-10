import type { EmergentHistoryProfile, HistoryForce } from './emergentHistory';
import type { DiplomaticRelation, Faction, GameTab, StaffMember, Territory, WarEvent } from './types';

export type WorldChangeTone = 'positive' | 'negative' | 'contested';
export type WorldChangeDomain = 'territory' | 'diplomacy' | 'organization' | 'society' | 'technology' | 'intelligence';
export type WorldEditorialTone = 'frontline' | 'technocratic' | 'diplomatic' | 'reformist' | 'liberation' | 'investigative';

export interface TerritoryWorldChange {
  id: string;
  territoryId: string;
  name: string;
  kind: 'liberated' | 'occupied' | 'recovered' | 'scarred';
  before: string;
  after: string;
  detail: string;
  tone: WorldChangeTone;
  intensity: number;
}

export interface WorldChangeSignal {
  id: string;
  domain: WorldChangeDomain;
  title: string;
  before: string;
  after: string;
  detail: string;
  tone: WorldChangeTone;
  actionTab: GameTab;
  territoryId?: string;
  week?: number;
}

export interface WorldChangeProfile {
  stage: 'forming' | 'visible' | 'transformed';
  headline: string;
  summary: string;
  editorialTone: WorldEditorialTone;
  editorialLabel: string;
  territoryChanges: TerritoryWorldChange[];
  relationChanges: WorldChangeSignal[];
  organizationChanges: WorldChangeSignal[];
  recentSignals: WorldChangeSignal[];
  visibleChangeCount: number;
}

export interface WorldChangeBaseline {
  territories: Territory[];
  relations: DiplomaticRelation[];
}

interface WorldChangeInput {
  territories: Territory[];
  baselineTerritories: Territory[];
  relations: DiplomaticRelation[];
  baselineRelations: DiplomaticRelation[];
  staff: StaffMember[];
  events: WarEvent[];
  trajectory: EmergentHistoryProfile;
  playerFaction: Exclude<Faction, 'neutral'>;
}

export function createWorldChangeBaseline(territories: Territory[], relations: DiplomaticRelation[]): WorldChangeBaseline {
  return {
    territories: territories.map((territory) => ({ ...territory, neighbors: [...territory.neighbors] })),
    relations: relations.map((relation) => ({ ...relation })),
  };
}

export function normalizeWorldChangeBaseline(value: unknown, territories: Territory[], relations: DiplomaticRelation[]): WorldChangeBaseline {
  if (!value || typeof value !== 'object') return createWorldChangeBaseline(territories, relations);
  const candidate = value as Partial<WorldChangeBaseline>;
  if (!Array.isArray(candidate.territories) || !Array.isArray(candidate.relations)) return createWorldChangeBaseline(territories, relations);
  const validTerritories = candidate.territories.every((territory) => territory && typeof territory.id === 'string' && typeof territory.supply === 'number' && typeof territory.controller === 'string');
  const validRelations = candidate.relations.every((relation) => relation && typeof relation.id === 'string' && typeof relation.value === 'number');
  return validTerritories && validRelations
    ? createWorldChangeBaseline(candidate.territories, candidate.relations)
    : createWorldChangeBaseline(territories, relations);
}

const factionLabels: Record<Faction, string> = { allies: '연합권', axis: '추축권', neutral: '중립권' };

const editorialMeta: Record<HistoryForce, { tone: WorldEditorialTone; label: string }> = {
  military: { tone: 'frontline', label: '전황·승패 중심 편집' },
  industry: { tone: 'technocratic', label: '생산·과학 중심 편집' },
  diplomacy: { tone: 'diplomatic', label: '회담·세력균형 중심 편집' },
  civic: { tone: 'reformist', label: '시민·제도 중심 편집' },
  liberation: { tone: 'liberation', label: '독립·자결 중심 편집' },
  intelligence: { tone: 'investigative', label: '폭로·정보전 중심 편집' },
};

function eventDomain(event: WarEvent): WorldChangeDomain {
  const text = `${event.title} ${event.detail}`;
  if (/외교|관계|협정|동맹|회담|조약/.test(text) || event.trace?.domain === 'diplomacy') return 'diplomacy';
  if (/참모|조직|인사|사임|영입|충성|파벌/.test(text)) return 'organization';
  if (/연구|과학|기술|장비|핵|원자/.test(text)) return 'technology';
  if (/정보|첩보|공작|폭로|스파이|방첩/.test(text)) return 'intelligence';
  if (/도시|영토|점령|해방|전선|전투|공세/.test(text) || event.trace?.domain === 'operations') return 'territory';
  return 'society';
}

function actionTab(domain: WorldChangeDomain): GameTab {
  if (domain === 'territory') return 'map';
  if (domain === 'diplomacy') return 'diplomacy';
  if (domain === 'organization') return 'organization';
  if (domain === 'technology') return 'research';
  if (domain === 'intelligence') return 'intelligence';
  return 'governance';
}

function eventTone(event: WarEvent): WorldChangeTone {
  return event.tone === 'good' ? 'positive' : event.tone === 'bad' ? 'negative' : 'contested';
}

function deriveTerritoryChanges(input: WorldChangeInput): TerritoryWorldChange[] {
  const baseline = new Map(input.baselineTerritories.map((territory) => [territory.id, territory]));
  const changes: TerritoryWorldChange[] = [];
  input.territories.forEach((territory) => {
    const before = baseline.get(territory.id);
    if (!before) return;
    if (before.controller !== territory.controller) {
      const playerNowControls = territory.controller === input.playerFaction;
      changes.push({
        id: `territory-control-${territory.id}`,
        territoryId: territory.id,
        name: territory.name,
        kind: playerNowControls ? 'liberated' as const : 'occupied' as const,
        before: factionLabels[before.controller],
        after: factionLabels[territory.controller],
        detail: `${territory.name}의 실제 통제권이 ${factionLabels[before.controller]}에서 ${factionLabels[territory.controller]}으로 바뀌어 국경·주둔·신문 보도에 반영됩니다.`,
        tone: playerNowControls ? 'positive' as const : 'negative' as const,
        intensity: 100,
      });
      return;
    }
    const supplyDelta = Math.round(territory.supply - before.supply);
    if (Math.abs(supplyDelta) < 15) return;
    const recovered = supplyDelta > 0;
    changes.push({
      id: `territory-supply-${territory.id}`,
      territoryId: territory.id,
      name: territory.name,
      kind: recovered ? 'recovered' as const : 'scarred' as const,
      before: `보급 ${Math.round(before.supply)}%`,
      after: `보급 ${Math.round(territory.supply)}%`,
      detail: recovered
        ? `${territory.name}의 철도·항만·배급망이 복구되며 도시의 생활과 전선 지속력이 개선됐습니다.`
        : `${territory.name}의 보급망과 생활 기반이 훼손되어 군사 성과와 별도로 도시의 상흔이 남았습니다.`,
      tone: recovered ? 'positive' as const : 'negative' as const,
      intensity: Math.min(100, Math.abs(supplyDelta) * 4),
    });
  });
  return changes.sort((left, right) => right.intensity - left.intensity || left.name.localeCompare(right.name, 'ko-KR'));
}

function deriveRelationChanges(input: WorldChangeInput): WorldChangeSignal[] {
  const baseline = new Map(input.baselineRelations.map((relation) => [relation.id, relation]));
  return input.relations.flatMap((relation) => {
    const before = baseline.get(relation.id)?.value ?? 50;
    const delta = Math.round(relation.value - before);
    if (Math.abs(delta) < 7) return [];
    const improved = delta > 0;
    return [{
      id: `relation-${relation.id}`,
      domain: 'diplomacy' as const,
      title: `${relation.name} 관계 ${improved ? '밀착' : '균열'}`,
      before: `${Math.round(before)}/100`,
      after: `${Math.round(relation.value)}/100`,
      detail: improved ? '공동작전·교역·정보 공유의 문턱이 낮아졌습니다.' : '외교 제안과 공동행동의 비용이 커지고 상대 진영의 포섭 가능성이 높아졌습니다.',
      tone: improved ? 'positive' as const : 'negative' as const,
      actionTab: 'diplomacy' as const,
    }];
  }).sort((left, right) => Math.abs(Number(right.after.split('/')[0]) - Number(right.before.split('/')[0])) - Math.abs(Number(left.after.split('/')[0]) - Number(left.before.split('/')[0])));
}

function deriveOrganizationChanges(staff: StaffMember[]): WorldChangeSignal[] {
  const changes: WorldChangeSignal[] = [];
  staff.forEach((member) => {
    const morale = member.morale ?? 60;
    const satisfaction = member.roleSatisfaction ?? 60;
    if (member.loyalty >= 82 && morale >= 65) {
      changes.push({
        id: `staff-pillar-${member.id}`,
        domain: 'organization',
        title: `${member.name}, 조직의 핵심축으로 부상`,
        before: member.role,
        after: `충성 ${Math.round(member.loyalty)} · 사기 ${Math.round(morale)}`,
        detail: '주요 결정에서 공개 지지와 부하 설득을 기대할 수 있지만 영향력 확대는 후계 경쟁도 키웁니다.',
        tone: 'positive',
        actionTab: 'organization',
      });
      return;
    }
    if (member.loyalty <= 42 || satisfaction <= 38 || member.workload >= 90) changes.push({
      id: `staff-friction-${member.id}`,
      domain: 'organization',
      title: `${member.name}, 이탈·책임공방 위험`,
      before: member.role,
      after: `충성 ${Math.round(member.loyalty)} · 만족 ${Math.round(satisfaction)} · 업무 ${Math.round(member.workload)}`,
      detail: '방치하면 사임·파벌 이동·언론 폭로 또는 경쟁 기관의 포섭으로 이어질 수 있습니다.',
      tone: 'negative',
      actionTab: 'organization',
    });
  });
  return changes.sort((left, right) => Number(right.tone === 'negative') - Number(left.tone === 'negative')).slice(0, 6);
}

function deriveEventSignals(events: WarEvent[]): WorldChangeSignal[] {
  return events
    .filter((event) => event.trace?.certainty === 'confirmed')
    .sort((left, right) => right.week - left.week || right.id - left.id)
    .slice(0, 8)
    .map((event) => {
      const domain = eventDomain(event);
      return {
        id: `event-change-${event.id}`,
        domain,
        title: event.title,
        before: event.trace?.decision ?? '결정 전',
        after: event.trace?.effects[0]?.value ?? event.detail,
        detail: event.trace?.ongoing[0] ?? event.detail,
        tone: eventTone(event),
        actionTab: actionTab(domain),
        week: event.week,
      };
    });
}

export function deriveWorldChangeProfile(input: WorldChangeInput): WorldChangeProfile {
  const territoryChanges = deriveTerritoryChanges(input);
  const relationChanges = deriveRelationChanges(input);
  const organizationChanges = deriveOrganizationChanges(input.staff);
  const eventSignals = deriveEventSignals(input.events);
  const structuralSignals: WorldChangeSignal[] = [
    ...territoryChanges.map((change) => ({
      id: change.id,
      domain: 'territory' as const,
      title: `${change.name} · ${change.kind === 'liberated' ? '해방' : change.kind === 'occupied' ? '점령' : change.kind === 'recovered' ? '복구' : '도시 상흔'}`,
      before: change.before,
      after: change.after,
      detail: change.detail,
      tone: change.tone,
      actionTab: 'map' as const,
      territoryId: change.territoryId,
    })),
    ...relationChanges,
    ...organizationChanges,
  ];
  const recentSignals = [...eventSignals, ...structuralSignals]
    .filter((signal, index, items) => items.findIndex((item) => item.id === signal.id) === index)
    .slice(0, 12);
  const visibleChangeCount = territoryChanges.length + relationChanges.length + organizationChanges.length + eventSignals.length;
  const stage = visibleChangeCount >= 12 ? 'transformed' : visibleChangeCount >= 4 ? 'visible' : 'forming';
  const editorial = editorialMeta[input.trajectory.dominantForce];
  const dominantTerritory = territoryChanges[0];
  const headline = dominantTerritory
    ? `${dominantTerritory.name}에서 달라진 세계가 보이기 시작했습니다`
    : relationChanges[0]?.title ?? organizationChanges[0]?.title ?? `${editorial.label}의 세계가 형성 중입니다`;
  const summary = `${territoryChanges.length}개 영토·도시, ${relationChanges.length}개 외교관계, ${organizationChanges.length}개 인물·조직 변화가 현재 지도와 보도에 연결됩니다.`;
  return {
    stage,
    headline,
    summary,
    editorialTone: editorial.tone,
    editorialLabel: editorial.label,
    territoryChanges,
    relationChanges,
    organizationChanges,
    recentSignals,
    visibleChangeCount,
  };
}

export function getTerritoryWorldChange(profile: WorldChangeProfile, territoryId: string) {
  return profile.territoryChanges.find((change) => change.territoryId === territoryId) ?? null;
}
