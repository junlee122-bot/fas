import type { EmergentHistoryProfile, HistoryForce } from './emergentHistory';
import type { DiplomaticRelation, Faction, GameTab, NationId, StaffMember, Territory, WarEvent } from './types';

export type WorldChangeTone = 'positive' | 'negative' | 'contested';
export type WorldChangeDomain = 'territory' | 'diplomacy' | 'organization' | 'society' | 'technology' | 'intelligence';
export type WorldEditorialTone = 'frontline' | 'technocratic' | 'diplomatic' | 'reformist' | 'liberation' | 'investigative';

export interface TerritoryWorldChange {
  id: string;
  territoryId: string;
  name: string;
  kind: 'control-changed' | 'attribution-changed' | 'supply-improved' | 'supply-declined';
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

export const territoryWorldChangeLabels: Readonly<Record<TerritoryWorldChange['kind'], string>> = {
  'control-changed': '통제 진영 변경',
  'attribution-changed': '게임 귀속 변경',
  'supply-improved': '보급 개선',
  'supply-declined': '보급 악화',
};

const factionLabels: Record<Faction, string> = { allies: '연합권', axis: '추축권', neutral: '중립권' };
// Display names for the existing playable-game attribution IDs, not sovereignty.
const attributionLabels: Record<NationId, string> = {
  britain: '영국', usa: '미국', ussr: '소련', germany: '독일', japan: '일본', china: '중국', india: '인도',
  freefrance: '자유 프랑스', italy: '이탈리아', korea: '한국/조선', vietnam: '베트남', indonesia: '인도네시아', philippines: '필리핀',
};
const nonemptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isFaction = (value: unknown): value is Faction => typeof value === 'string' && Object.hasOwn(factionLabels, value);
const isAttribution = (value: unknown): value is NationId => typeof value === 'string' && Object.hasOwn(attributionLabels, value);
const validPercentage = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const copyNeighbors = (value: unknown): string[] => Array.isArray(value) ? value.filter(nonemptyString) : [];

export function createWorldChangeBaseline(territories: Territory[], relations: DiplomaticRelation[]): WorldChangeBaseline {
  return {
    territories: territories.map((territory) => ({ ...territory, neighbors: copyNeighbors(territory.neighbors) })),
    relations: relations.map((relation) => ({ ...relation })),
  };
}

export function normalizeWorldChangeBaseline(value: unknown, territories: Territory[], relations: DiplomaticRelation[]): WorldChangeBaseline {
  if (!value || typeof value !== 'object') return createWorldChangeBaseline(territories, relations);
  const candidate = value as Partial<WorldChangeBaseline>;
  if (!Array.isArray(candidate.territories) || !Array.isArray(candidate.relations)) return createWorldChangeBaseline(territories, relations);
  const territoryIds = new Set<string>(), relationIds = new Set<string>();
  const validTerritories = candidate.territories.every((territory) => {
    if (!territory || !nonemptyString(territory.id) || !isFaction(territory.controller)
      || !validPercentage(territory.supply) || territoryIds.has(territory.id)) return false;
    territoryIds.add(territory.id);
    return true;
  });
  const validRelations = candidate.relations.every((relation) => {
    if (!relation || !nonemptyString(relation.id) || !validPercentage(relation.value) || relationIds.has(relation.id)) return false;
    relationIds.add(relation.id);
    return true;
  });
  // Empty arrays must not erase a populated comparison baseline. A genuinely
  // empty current scenario remains valid, including scenarios without diplomacy.
  // Recover the two independent collections separately: a newly introduced or
  // malformed diplomatic list must not erase valid earlier territorial changes.
  const savedTerritories = validTerritories && (candidate.territories.length || !territories.length) ? candidate.territories : territories;
  const savedRelations = validRelations && (candidate.relations.length || !relations.length) ? candidate.relations : relations;
  const currentById = new Map(territories.map((territory) => [territory.id, territory]));
  return createWorldChangeBaseline(savedTerritories.map((saved) => {
    const current = currentById.get(saved.id);
    return {
      ...current, ...saved,
      name: nonemptyString(saved.name) ? saved.name : current?.name ?? saved.id,
      // Repair old display snapshots, but never copy today's attribution into
      // a snapshot that had no attribution record of its own.
      ownerId: isAttribution(saved.ownerId) ? saved.ownerId : undefined,
      neighbors: copyNeighbors(Array.isArray(saved.neighbors) ? saved.neighbors : current?.neighbors),
    };
  }), savedRelations);
}

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
    if (!before || !isFaction(before.controller) || !isFaction(territory.controller)) return;
    if (before.controller !== territory.controller) {
      changes.push({
        id: `territory-control-${territory.id}`,
        territoryId: territory.id,
        name: territory.name,
        kind: 'control-changed',
        before: factionLabels[before.controller],
        after: factionLabels[territory.controller],
        detail: `${territory.name}의 게임상 통제 진영이 ${factionLabels[before.controller]}에서 ${factionLabels[territory.controller]}으로 변경됐습니다. 국가별 통제 주체·법적 주권·국경 변경은 이 진영 값만으로 확인할 수 없습니다.`,
        tone: 'contested',
        intensity: 100,
      });
      return;
    }
    if (isAttribution(before.ownerId) && isAttribution(territory.ownerId) && before.ownerId !== territory.ownerId) {
      changes.push({
        id: `territory-attribution-${territory.id}`,
        territoryId: territory.id,
        name: territory.name,
        kind: 'attribution-changed',
        before: `게임 귀속 ${attributionLabels[before.ownerId]}`,
        after: `게임 귀속 ${attributionLabels[territory.ownerId]}`,
        detail: `${territory.name}의 게임 귀속 기록이 ${attributionLabels[before.ownerId]}에서 ${attributionLabels[territory.ownerId]}으로 변경됐습니다. 통제 진영은 ${factionLabels[territory.controller]}으로 동일합니다. 이 기록은 법적 주권 이양이나 외교적 승인을 확정하지 않습니다.`,
        tone: 'contested',
        intensity: 90,
      });
      return;
    }
    if (!validPercentage(before.supply) || !validPercentage(territory.supply)) return;
    const supplyDelta = Math.round(territory.supply - before.supply);
    if (Math.abs(supplyDelta) < 15) return;
    const improved = supplyDelta > 0;
    changes.push({
      id: `territory-supply-${territory.id}`,
      territoryId: territory.id,
      name: territory.name,
      kind: improved ? 'supply-improved' : 'supply-declined',
      before: `보급 ${Math.round(before.supply)}%`,
      after: `보급 ${Math.round(territory.supply)}%`,
      detail: `${territory.name}의 보급 수치가 ${Math.round(before.supply)}%에서 ${Math.round(territory.supply)}%로 ${improved ? '상승' : '하락'}했습니다. 이 수치만으로 시설 복구·손상이나 민간 생활·피해 상태를 확인할 수 없습니다.`,
      tone: improved ? 'positive' as const : 'negative' as const,
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
      title: `${change.name} · ${territoryWorldChangeLabels[change.kind]}`,
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
