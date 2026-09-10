import type { Commander, Division, Faction, GameState, NationId, Territory, TheaterId } from './types';

export type EnemyOperationKind = 'breakthrough' | 'encirclement' | 'siege' | 'attrition' | 'interdiction' | 'counterstroke' | 'feint';
export type EnemyOperationStage = 'forming' | 'probing' | 'committed';
export type EnemyOperationOutcome = 'success' | 'repulsed' | 'feint' | 'aborted';

interface EnemyCommandProfile {
  nationId: NationId;
  commandName: string;
  doctrine: string;
  aggression: number;
  tempo: number;
  deception: number;
  logistics: number;
  sourceLabel: string;
  sourceUrl: string;
}

export interface EnemyOperationPlan {
  id: string;
  attackerNationId: NationId;
  commandName: string;
  doctrine: string;
  kind: EnemyOperationKind;
  targetId: string;
  sourceId: string;
  startedWeek: number;
  stage: EnemyOperationStage;
  progress: number;
  requiredProgress: number;
  targetScore: number;
  deception: number;
  expectedDuration: number;
  sourceLabel: string;
  sourceUrl: string;
}

export interface EnemyOperationHistory {
  id: string;
  week: number;
  targetId: string;
  targetName: string;
  kind: EnemyOperationKind;
  outcome: EnemyOperationOutcome;
  summary: string;
}

export interface EnemyStrategyState {
  plan: EnemyOperationPlan | null;
  history: EnemyOperationHistory[];
  lastPlanningWeek: number;
  strategicMomentum: number;
  adaptation: number;
  operationsCompleted: number;
}

export interface EnemyStrategyContext {
  week: number;
  theater: TheaterId;
  playerNationId?: NationId;
  playerFaction: Exclude<Faction, 'neutral'>;
  enemyFaction: Exclude<Faction, 'neutral'>;
  territories: Territory[];
  divisions: Division[];
  commanders: Commander[];
  enemyPressure: number;
  playerVictoryScore: number;
  playerOrderTargetIds: string[];
  defenseBonus?: number;
  priorityDivisionId?: string;
}

export interface EnemyStrategyEffect {
  targetId: string;
  territoryCaptured: boolean;
  defenderStrengthLoss: number;
  defenderOrganizationLoss: number;
  defenderSupplyLoss: number;
  gameDelta: Partial<GameState>;
}

export interface EnemyStrategyEvent {
  type: 'formed' | 'stage-change' | 'contact' | 'resolved' | 'aborted';
  tone: 'good' | 'bad' | 'neutral';
  title: string;
  detail: string;
  targetId: string;
  factors: string[];
}

export interface EnemyStrategyAdvanceResult {
  state: EnemyStrategyState;
  event: EnemyStrategyEvent | null;
  effect: EnemyStrategyEffect | null;
}

export interface EnemyIntentReport {
  active: boolean;
  title: string;
  summary: string;
  classification: '소문' | '정황' | '분석' | '확정';
  confidence: number;
  threatLevel: 'low' | 'guarded' | 'elevated' | 'critical';
  stageLabel: string;
  operationLabel: string;
  targetName: string;
  targetRegion: string;
  targetId: string | null;
  sourceName: string | null;
  etaLabel: string;
  progress: number;
  deceptionRisk: string;
  indicators: string[];
  countermeasures: string[];
  sourceLabel: string | null;
  sourceUrl: string | null;
}

const commandProfiles: Record<NationId, EnemyCommandProfile> = {
  britain: { nationId: 'britain', commandName: '영국 참모총장위원회', doctrine: '제한목표·병참 우위', aggression: 57, tempo: 58, deception: 82, logistics: 86, sourceLabel: 'British Military History', sourceUrl: 'https://www.gov.uk/government/collections/second-world-war-military-records' },
  usa: { nationId: 'usa', commandName: '미 합동참모본부', doctrine: '화력집중·합동작전', aggression: 72, tempo: 71, deception: 68, logistics: 94, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/World-War-II/' },
  ussr: { nationId: 'ussr', commandName: '소련 최고사령부 스타프카', doctrine: '심층작전·다중 제파', aggression: 84, tempo: 78, deception: 61, logistics: 62, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/World-War-II/' },
  germany: { nationId: 'germany', commandName: '독일 국방군 최고사령부', doctrine: '중심 돌파·기동 포위', aggression: 86, tempo: 84, deception: 73, logistics: 58, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/World-War-II/' },
  japan: { nationId: 'japan', commandName: '일본 대본영', doctrine: '결전·우회 침투', aggression: 88, tempo: 76, deception: 69, logistics: 46, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/World-War-II/World-War-II-Asiatic-Pacific-Theater/' },
  china: { nationId: 'china', commandName: '중국 국민정부 군사위원회', doctrine: '종심방어·지구전', aggression: 54, tempo: 49, deception: 64, logistics: 43, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/World-War-II/World-War-II-Asiatic-Pacific-Theater/' },
  india: { nationId: 'india', commandName: '인도군 총사령부', doctrine: '전구 방어·병참 축선', aggression: 55, tempo: 53, deception: 57, logistics: 71, sourceLabel: 'British Military History', sourceUrl: 'https://www.gov.uk/government/collections/second-world-war-military-records' },
  freefrance: { nationId: 'freefrance', commandName: '자유 프랑스 국방위원회', doctrine: '연합 기동·국토 회복', aggression: 73, tempo: 67, deception: 62, logistics: 55, sourceLabel: 'Chemins de mémoire', sourceUrl: 'https://www.cheminsdememoire.gouv.fr/en/second-world-war' },
  italy: { nationId: 'italy', commandName: '이탈리아 최고사령부', doctrine: '제한 공세·해안 축선', aggression: 62, tempo: 55, deception: 58, logistics: 44, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/World-War-II/' },
  korea: { nationId: 'korea', commandName: '한국광복군 총사령부', doctrine: '국내진공·연합 침투', aggression: 68, tempo: 61, deception: 79, logistics: 38, sourceLabel: '독립기념관 한국독립운동정보시스템', sourceUrl: 'https://search.i815.or.kr/' },
  vietnam: { nationId: 'vietnam', commandName: '베트민 총부', doctrine: '유격전·정치동원', aggression: 64, tempo: 66, deception: 81, logistics: 37, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/World-War-II/' },
  indonesia: { nationId: 'indonesia', commandName: '인도네시아 독립조직 연락부', doctrine: '도시 지하망·군도 분산전', aggression: 58, tempo: 55, deception: 78, logistics: 34, sourceLabel: 'Nationaal Archief', sourceUrl: 'https://www.nationaalarchief.nl/en/research' },
  philippines: { nationId: 'philippines', commandName: '필리핀 게릴라 연합사령부', doctrine: '도서 게릴라·연안 연락', aggression: 61, tempo: 59, deception: 76, logistics: 42, sourceLabel: 'U.S. Army Center of Military History', sourceUrl: 'https://history.army.mil/Research/Reference-Topics/Army-Campaigns/Brief-Summaries/World-War-II/World-War-II-Asiatic-Pacific-Theater/' },
};

const kindMeta: Record<EnemyOperationKind, { label: string; required: number; duration: number; attack: number }> = {
  breakthrough: { label: '집중 돌파', required: 112, duration: 5, attack: 7 },
  encirclement: { label: '양익 포위', required: 136, duration: 6, attack: 10 },
  siege: { label: '요새·도시 공략', required: 148, duration: 7, attack: 5 },
  attrition: { label: '소모·고착 공세', required: 142, duration: 7, attack: 3 },
  interdiction: { label: '항로·보급 차단', required: 124, duration: 6, attack: 5 },
  counterstroke: { label: '작전축 역습', required: 106, duration: 5, attack: 9 },
  feint: { label: '기만 공세', required: 88, duration: 4, attack: -4 },
};

const stageLabels: Record<EnemyOperationStage, string> = { forming: '전력 집결', probing: '정찰·탐색전', committed: '주력 투입' };

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const rollAt = (rolls: number[], index: number, fallback: number) => clamp(Number.isFinite(rolls[index]) ? rolls[index] : fallback, 0, 1);

export function createEnemyStrategyState(): EnemyStrategyState {
  return { plan: null, history: [], lastPlanningWeek: -2, strategicMomentum: 50, adaptation: 0, operationsCompleted: 0 };
}

export function normalizeEnemyStrategyState(value: unknown): EnemyStrategyState {
  const fallback = createEnemyStrategyState();
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<EnemyStrategyState>;
  const plan = candidate.plan && typeof candidate.plan === 'object' ? candidate.plan as EnemyOperationPlan : null;
  return {
    plan,
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 24) : [],
    lastPlanningWeek: Number.isFinite(candidate.lastPlanningWeek) ? Number(candidate.lastPlanningWeek) : fallback.lastPlanningWeek,
    strategicMomentum: clamp(Number(candidate.strategicMomentum ?? fallback.strategicMomentum)),
    adaptation: clamp(Number(candidate.adaptation ?? fallback.adaptation)),
    operationsCompleted: Math.max(0, Math.round(Number(candidate.operationsCompleted ?? 0))),
  };
}

function getEnemySource(target: Territory, context: EnemyStrategyContext): Territory | null {
  const byId = new Map(context.territories.map((territory) => [territory.id, territory]));
  return target.neighbors
    .map((neighborId) => byId.get(neighborId))
    .filter((territory): territory is Territory => Boolean(territory && territory.controller === context.enemyFaction))
    .sort((a, b) => (b.supply + b.value * 3) - (a.supply + a.value * 3) || a.id.localeCompare(b.id))[0] ?? null;
}

function getDefenseScore(target: Territory, context: EnemyStrategyContext): number {
  const defender = context.divisions
    .filter((division) => division.territoryId === target.id)
    .sort((a, b) => b.strength + b.organization - a.strength - a.organization)[0];
  const commander = context.commanders.find((candidate) => candidate.id === defender?.commanderId);
  const terrain = `${target.terrain} ${target.siteType ?? ''}`;
  const terrainBonus = /산악|정글/.test(terrain) ? 13 : /요새|fortress|수도|capital/.test(terrain) ? 17 : /도시|urban/.test(terrain) ? 10 : /해안|도서|port|island/.test(terrain) ? 7 : 4;
  const preparedDefense = (context.defenseBonus ?? 0) + (defender?.id === context.priorityDivisionId ? 5 : 0);
  return defender
    ? defender.strength * .22 + defender.organization * .18 + defender.supply * .1 + (commander?.defense ?? 58) * .08 + target.supply * .12 + terrainBonus + preparedDefense
    : target.value * 2.1 + target.supply * .19 + terrainBonus;
}

function scoreTarget(target: Territory, source: Territory, context: EnemyStrategyContext): number {
  const defenders = context.divisions.filter((division) => division.territoryId === target.id);
  const hostileSides = target.neighbors.filter((neighborId) => context.territories.find((territory) => territory.id === neighborId)?.controller === context.enemyFaction).length;
  const reactingToPlayer = context.playerOrderTargetIds.includes(source.id) ? 15 : 0;
  const commandTarget = target.siteType === 'capital' ? 18 : target.siteType === 'port' || target.siteType === 'fortress' ? 9 : 0;
  return target.value * 5.5 + (100 - target.supply) * .34 + hostileSides * 7 + (defenders.length === 0 ? 17 : 0) + reactingToPlayer + commandTarget + source.supply * .08 - getDefenseScore(target, context) * .2;
}

export function selectEnemyStrategicTarget(context: EnemyStrategyContext): { target: Territory; source: Territory; score: number } | null {
  const exposedTargets = context.territories.filter((territory) => (
    territory.controller === context.playerFaction
    && (territory.theater ?? 'europe') === context.theater
    && Boolean(getEnemySource(territory, context))
  ));
  const responsibilityTargets = context.playerNationId ? exposedTargets.filter((territory) => (
    territory.ownerId === context.playerNationId
    || context.divisions.some((division) => division.territoryId === territory.id)
  )) : [];
  const candidates = responsibilityTargets.length > 0 ? responsibilityTargets : exposedTargets;
  return candidates
    .flatMap((target) => {
      const source = getEnemySource(target, context);
      return source ? [{ target, source, score: scoreTarget(target, source, context) }] : [];
    })
    .sort((a, b) => b.score - a.score || a.target.id.localeCompare(b.target.id))[0] ?? null;
}

function chooseOperationKind(target: Territory, source: Territory, context: EnemyStrategyContext, profile: EnemyCommandProfile, roll: number): EnemyOperationKind {
  if (context.playerOrderTargetIds.includes(source.id)) return 'counterstroke';
  const hostileSides = target.neighbors.filter((neighborId) => context.territories.find((territory) => territory.id === neighborId)?.controller === context.enemyFaction).length;
  if (roll > .88 && profile.deception >= 65) return 'feint';
  if (target.siteType === 'capital' || target.siteType === 'fortress') return 'siege';
  if (target.siteType === 'port' || target.siteType === 'island' || target.siteType === 'sea') return 'interdiction';
  if (hostileSides >= 2) return 'encirclement';
  if (/산악|정글|사막/.test(target.terrain)) return 'attrition';
  return 'breakthrough';
}

function formPlan(state: EnemyStrategyState, context: EnemyStrategyContext, rolls: number[]): EnemyStrategyAdvanceResult {
  const selection = selectEnemyStrategicTarget(context);
  if (!selection) return { state: { ...state, lastPlanningWeek: context.week }, event: null, effect: null };
  const fallbackNationId: NationId = context.enemyFaction === 'axis' ? (context.theater === 'asia' ? 'japan' : 'germany') : (context.theater === 'asia' ? 'usa' : 'ussr');
  const attackerNationId = selection.source.ownerId && commandProfiles[selection.source.ownerId] ? selection.source.ownerId : fallbackNationId;
  const profile = commandProfiles[attackerNationId];
  const kind = chooseOperationKind(selection.target, selection.source, context, profile, rollAt(rolls, 0, .42));
  const meta = kindMeta[kind];
  const pressureDuration = context.enemyPressure >= 75 ? -1 : context.enemyPressure <= 42 ? 1 : 0;
  const plan: EnemyOperationPlan = {
    id: `enemy-plan-${context.week}-${selection.target.id}`,
    attackerNationId,
    commandName: profile.commandName,
    doctrine: profile.doctrine,
    kind,
    targetId: selection.target.id,
    sourceId: selection.source.id,
    startedWeek: context.week,
    stage: 'forming',
    progress: 0,
    requiredProgress: meta.required,
    targetScore: Math.round(selection.score),
    deception: clamp(profile.deception + (kind === 'feint' ? 15 : 0)),
    expectedDuration: Math.max(3, meta.duration + pressureDuration),
    sourceLabel: profile.sourceLabel,
    sourceUrl: profile.sourceUrl,
  };
  return {
    state: { ...state, plan },
    event: {
      type: 'formed', tone: 'neutral', targetId: plan.targetId,
      title: `적 작전 징후 — ${selection.target.region}`,
      detail: `${profile.commandName}가 ${profile.doctrine} 교리에 따라 새 작전축을 검토하기 시작했습니다. 정보 분석을 통해 목표와 투입 시점을 좁혀야 합니다.`,
      factors: [`후보 목표 가치 ${selection.target.value}`, `보급 ${selection.target.supply}%`, `적 출발지 보급 ${selection.source.supply}%`, `표적 점수 ${Math.round(selection.score)}`],
    },
    effect: null,
  };
}

function abortPlan(state: EnemyStrategyState, context: EnemyStrategyContext, plan: EnemyOperationPlan, targetName: string): EnemyStrategyAdvanceResult {
  const record: EnemyOperationHistory = { id: `${plan.id}-aborted`, week: context.week, targetId: plan.targetId, targetName, kind: plan.kind, outcome: 'aborted', summary: '전선 조건 변화로 적 작전이 취소됐습니다.' };
  return {
    state: { ...state, plan: null, history: [record, ...state.history].slice(0, 24), lastPlanningWeek: context.week, strategicMomentum: clamp(state.strategicMomentum - 3) },
    event: { type: 'aborted', tone: 'good', targetId: plan.targetId, title: `적 작전 취소 — ${targetName}`, detail: '통제권 또는 접근로가 바뀌어 적이 준비하던 작전축을 폐기했습니다.', factors: ['표적 통제권 변화', '인접 적 출발지 상실'] },
    effect: null,
  };
}

export function advanceEnemyStrategyWeek(state: EnemyStrategyState, context: EnemyStrategyContext, randomRolls: number[] = []): EnemyStrategyAdvanceResult {
  if (!state.plan) {
    if (context.week - state.lastPlanningWeek < 2) return { state, event: null, effect: null };
    return formPlan(state, context, randomRolls);
  }

  const plan = state.plan;
  const target = context.territories.find((territory) => territory.id === plan.targetId);
  const source = context.territories.find((territory) => territory.id === plan.sourceId);
  if (!target || !source || target.controller !== context.playerFaction || source.controller !== context.enemyFaction || !target.neighbors.includes(source.id)) {
    return abortPlan(state, context, plan, target?.name ?? plan.targetId);
  }

  const profile = commandProfiles[plan.attackerNationId];
  const progressGain = Math.round(17 + profile.tempo * .1 + context.enemyPressure * .035 + state.adaptation * .03 + rollAt(randomRolls, 1, .5) * 8);
  const nextProgress = Math.min(plan.requiredProgress, plan.progress + progressGain);
  const nextStage: EnemyOperationStage = nextProgress >= 56 ? 'committed' : nextProgress >= 26 ? 'probing' : 'forming';
  const nextPlan = { ...plan, progress: nextProgress, stage: nextStage };

  if (nextStage !== plan.stage) {
    return {
      state: { ...state, plan: nextPlan }, effect: null,
      event: {
        type: 'stage-change', tone: nextStage === 'committed' ? 'bad' : 'neutral', targetId: plan.targetId,
        title: nextStage === 'committed' ? `적 주력 투입 — ${target.name}` : `적 탐색전 확대 — ${target.region}`,
        detail: `${plan.commandName}의 ${kindMeta[plan.kind].label} 계획이 ‘${stageLabels[nextStage]}’ 단계로 이동했습니다. 작전은 한 주 판정으로 끝나지 않으며 준비·탐색·주력 투입을 거칩니다.`,
        factors: [`작전 준비 ${Math.round(nextProgress / plan.requiredProgress * 100)}%`, `적 압력 ${Math.round(context.enemyPressure)}`, `교리 ${plan.doctrine}`],
      },
    };
  }

  if (nextStage !== 'committed') return { state: { ...state, plan: nextPlan }, event: null, effect: null };

  const ongoing = nextProgress < plan.requiredProgress;
  const attritionScale = plan.kind === 'attrition' || plan.kind === 'siege' ? 1.3 : plan.kind === 'feint' ? .35 : 1;
  const defenderStrengthLoss = Math.max(1, Math.round((2 + rollAt(randomRolls, 2, .45) * 3) * attritionScale));
  const defenderOrganizationLoss = Math.max(2, Math.round((4 + rollAt(randomRolls, 2, .45) * 5) * attritionScale));
  const defenderSupplyLoss = Math.max(1, Math.round((1 + rollAt(randomRolls, 2, .45) * 3) * (plan.kind === 'interdiction' ? 1.6 : 1)));

  if (ongoing) {
    return {
      state: { ...state, plan: nextPlan },
      effect: { targetId: target.id, territoryCaptured: false, defenderStrengthLoss, defenderOrganizationLoss, defenderSupplyLoss, gameDelta: { enemyPressure: 1 } },
      event: {
        type: 'contact', tone: 'neutral', targetId: target.id,
        title: `적 공세 진행 — ${target.name}`,
        detail: `${kindMeta[plan.kind].label} ${Math.round(nextProgress / plan.requiredProgress * 100)}%. 접촉전과 포격으로 방어 조직과 보급이 소모됐지만 지역 통제는 아직 바뀌지 않았습니다.`,
        factors: [`현재 단계 ${stageLabels[nextStage]}`, `방어 병력 -${defenderStrengthLoss}`, `조직 -${defenderOrganizationLoss}`, `보급 -${defenderSupplyLoss}`],
      },
    };
  }

  const defenseScore = getDefenseScore(target, context);
  const meta = kindMeta[plan.kind];
  const strategicUrgency = Math.max(-4, Math.min(6, (context.playerVictoryScore - 50) * .08));
  const attackScore = context.enemyPressure * .45 + source.supply * .15 + profile.aggression * .1 + profile.logistics * .05 + state.adaptation * .06 + meta.attack + strategicUrgency + rollAt(randomRolls, 3, .5) * 18;
  const feint = plan.kind === 'feint';
  const success = !feint && attackScore > defenseScore;
  const outcome: EnemyOperationOutcome = feint ? 'feint' : success ? 'success' : 'repulsed';
  const summary = feint
    ? `${target.name} 정면의 위협은 예비대를 묶기 위한 기만으로 판명됐습니다.`
    : success
      ? `${plan.commandName}가 ${target.name} 방어선을 돌파했습니다.`
      : `${target.name} 방어선이 ${plan.commandName}의 공세를 저지했습니다.`;
  const record: EnemyOperationHistory = { id: `${plan.id}-${outcome}`, week: context.week, targetId: target.id, targetName: target.name, kind: plan.kind, outcome, summary };
  const momentumDelta = success ? 8 : feint ? 1 : -7;
  const adaptationDelta = success ? 2 : 5;
  return {
    state: {
      ...state,
      plan: null,
      history: [record, ...state.history].slice(0, 24),
      lastPlanningWeek: context.week,
      strategicMomentum: clamp(state.strategicMomentum + momentumDelta),
      adaptation: clamp(state.adaptation + adaptationDelta),
      operationsCompleted: state.operationsCompleted + 1,
    },
    effect: {
      targetId: target.id,
      territoryCaptured: success,
      defenderStrengthLoss: feint ? 1 : success ? Math.max(7, defenderStrengthLoss + 4) : defenderStrengthLoss + 1,
      defenderOrganizationLoss: feint ? 3 : success ? Math.max(16, defenderOrganizationLoss + 10) : defenderOrganizationLoss + 3,
      defenderSupplyLoss: feint ? 2 : defenderSupplyLoss + 2,
      gameDelta: success
        ? { victoryScore: -target.value, warSupport: -2, enemyPressure: 3 }
        : feint
          ? { commandPoints: -2, enemyPressure: 1 }
          : { commandPoints: 3, enemyPressure: -3 },
    },
    event: {
      type: 'resolved', tone: success ? 'bad' : 'good', targetId: target.id,
      title: success ? `적 작전 성공 — ${target.name}` : feint ? `적 기만 확인 — ${target.name}` : `적 작전 격퇴 — ${target.name}`,
      detail: `${summary} 공격 ${Math.round(attackScore)} 대 방어 ${Math.round(defenseScore)}로 최종 판정됐습니다.`,
      factors: [`${kindMeta[plan.kind].label} · ${plan.doctrine}`, `공격 평가 ${Math.round(attackScore)}`, `방어 평가 ${Math.round(defenseScore)}`, `${context.week - plan.startedWeek + 1}주간 작전`],
    },
  };
}

function getCountermeasures(kind: EnemyOperationKind, target: Territory): string[] {
  const common = [`${target.name}의 보급과 방어 조직을 우선 회복`, '인접 지역에 기동 예비대를 남겨 퇴로 확보'];
  if (kind === 'encirclement') return ['양익 인접 지역을 동시에 보강해 포위 고리 차단', ...common];
  if (kind === 'siege') return ['요새·도시의 보급일수와 공병 방어 준비 점검', ...common];
  if (kind === 'interdiction') return ['호송·항공 엄호를 배치해 접근로 차단 저지', ...common];
  if (kind === 'feint') return ['확증 전까지 주력 예비대의 성급한 이동 금지', ...common];
  if (kind === 'counterstroke') return ['아군 공세 출발지와 측면을 별도 방어', ...common];
  if (kind === 'attrition') return ['교대 주기와 의무·정비 능력으로 소모전 회피', ...common];
  return ['돌파 예상 축에 대전차·포병 예비대를 집중', ...common];
}

export function deriveEnemyIntentReport(state: EnemyStrategyState, intelNetwork: number, territories: Territory[]): EnemyIntentReport {
  const plan = state.plan;
  if (!plan) {
    const latest = state.history[0];
    return {
      active: false,
      title: latest ? '적 작전 재편 중' : '적 작전 징후 없음',
      summary: latest ? `${latest.summary} 적 지휘부는 다음 작전축을 다시 평가하고 있습니다.` : '현재 확인된 주력 공세 준비는 없습니다. 취약 전선 감시는 계속됩니다.',
      classification: intelNetwork >= 70 ? '분석' : intelNetwork >= 40 ? '정황' : '소문',
      confidence: clamp(Math.round(24 + intelNetwork * .55)),
      threatLevel: 'low', stageLabel: '작전 공백', operationLabel: '재편·평가', targetName: '미상', targetRegion: '전구 전체', targetId: null, sourceName: null,
      etaLabel: '2주 이후 재평가', progress: 0, deceptionRisk: intelNetwork < 55 ? '높음' : '보통', indicators: ['무선·철도·보급량의 기준선 감시'], countermeasures: ['취약 전선의 보급과 예비대 배치를 유지'], sourceLabel: null, sourceUrl: null,
    };
  }

  const target = territories.find((territory) => territory.id === plan.targetId);
  const source = territories.find((territory) => territory.id === plan.sourceId);
  const stageBonus = plan.stage === 'committed' ? 12 : plan.stage === 'probing' ? 5 : 0;
  const deceptionPenalty = plan.deception * (plan.kind === 'feint' ? .18 : .08);
  const confidence = clamp(Math.round(14 + intelNetwork * .82 + stageBonus - deceptionPenalty), 8, 96);
  const classification: EnemyIntentReport['classification'] = confidence >= 82 ? '확정' : confidence >= 62 ? '분석' : confidence >= 38 ? '정황' : '소문';
  const targetKnown = confidence >= 48;
  const regionKnown = confidence >= 28;
  const operationKnown = confidence >= 58;
  const sourceKnown = confidence >= 72;
  const remaining = Math.max(0, plan.requiredProgress - plan.progress);
  const weeks = Math.max(1, Math.ceil(remaining / 27));
  const uncertainty = confidence >= 80 ? 0 : confidence >= 55 ? 1 : 2;
  const etaLabel = plan.stage === 'committed'
    ? uncertainty === 0 ? `D-${weeks}주 내 결판` : `D-${Math.max(1, weeks - uncertainty)}~${weeks + uncertainty}주`
    : plan.stage === 'probing' ? '2~4주 내 주력 투입 가능' : '3~6주 내 작전 가능';
  const progress = Math.round(plan.progress / plan.requiredProgress * 100);
  const operationLabel = operationKnown ? kindMeta[plan.kind].label : plan.stage === 'committed' ? '주력 공세' : '공세 준비 징후';
  const targetName = targetKnown ? target?.name ?? plan.targetId : regionKnown ? `${target?.region ?? '전구'}의 전략 거점` : '목표 불명';
  const indicators = [
    plan.stage === 'forming' ? '철도·차량 이동과 보급 집적 증가' : plan.stage === 'probing' ? '정찰대·포병 관측·국지 공격 증가' : '주력 편제와 화력지원 전선 투입',
    plan.kind === 'interdiction' ? '항공·잠수함·호송로 정찰 증가' : plan.kind === 'feint' ? '복수 축에서 상충하는 무선 신호 발생' : `출발 축 ${sourceKnown ? source?.name ?? plan.sourceId : '미확인'}의 활동 증가`,
    `적 작전 적응도 ${Math.round(state.adaptation)} · 기세 ${Math.round(state.strategicMomentum)}`,
  ];
  const criticalTarget = !target || target.value >= 10;
  const threatLevel: EnemyIntentReport['threatLevel'] = plan.stage === 'committed' && criticalTarget ? 'critical' : plan.stage === 'committed' ? 'elevated' : plan.stage === 'probing' ? 'guarded' : 'low';
  return {
    active: true,
    title: `${operationLabel} · ${targetName}`,
    summary: `${plan.commandName}의 ${plan.doctrine} 작전이 ${stageLabels[plan.stage]} 단계에 있습니다. 정보 신뢰도에 따라 목표와 시점은 계속 갱신됩니다.`,
    classification,
    confidence,
    threatLevel,
    stageLabel: stageLabels[plan.stage],
    operationLabel,
    targetName,
    targetRegion: target?.region ?? '전구 미상',
    targetId: targetKnown ? plan.targetId : null,
    sourceName: sourceKnown ? source?.name ?? plan.sourceId : null,
    etaLabel,
    progress,
    deceptionRisk: confidence < 45 || plan.kind === 'feint' ? '높음' : confidence < 72 ? '보통' : '낮음',
    indicators: indicators.slice(0, confidence >= 62 ? 3 : confidence >= 34 ? 2 : 1),
    countermeasures: getCountermeasures(plan.kind, target ?? { id: plan.targetId, name: '예상 목표', region: '전구', x: 0, y: 0, controller: 'neutral', value: 5, supply: 50, terrain: '불명', neighbors: [] }).slice(0, confidence >= 58 ? 3 : 2),
    sourceLabel: confidence >= 72 ? plan.sourceLabel : null,
    sourceUrl: confidence >= 72 ? plan.sourceUrl : null,
  };
}
