import type { CareerRole, GameTab, NationId } from './types';
import { getRoleTabMandates } from './roleMandate';
import type { RoleAccessMode, RoleTabMandate } from './roleMandate';

export type RoleRequestStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'expired';
export type RolePersuasionStrategy = 'evidence' | 'sponsor' | 'pressure';
export type RoleInteractionKind = 'briefing' | 'direct' | 'report' | 'request' | 'persuade' | 'defy';

export interface RoleAuthorityRequest {
  id: string;
  tab: GameTab;
  tabLabel: string;
  sourceMode: Extract<RoleAccessMode, 'request' | 'report'>;
  status: RoleRequestStatus;
  submittedWeek: number;
  decisionWeek: number;
  delegationUntilWeek: number | null;
  support: number;
  persuasionCount: number;
  route: 'authorized' | 'defiant';
  result: string | null;
}

export interface RoleObjectiveTask {
  id: string;
  label: string;
  detail: string;
  kind: 'briefing' | 'visit' | 'chain' | 'action';
  tab?: GameTab;
  done: boolean;
}

export interface RoleActionEvidence {
  id: string;
  week: number;
  tab: GameTab;
  description: string;
  outcome: 'succeeded' | 'failed' | 'unchanged';
}

export interface RoleWeeklyObjective {
  id: string;
  week: number;
  title: string;
  summary: string;
  tasks: RoleObjectiveTask[];
  completed: boolean;
  rewardClaimed: boolean;
  reward: string;
  actionEvidence: RoleActionEvidence[];
}

export interface RoleCommandState {
  version: 1;
  nationId: NationId;
  roleId: string;
  requests: RoleAuthorityRequest[];
  objective: RoleWeeklyObjective;
  officialFavor: number;
  defiance: number;
  reportsRead: number;
  lastAdvancedWeek: number;
}

export interface RoleCommandChainProfile {
  superior: string;
  current: string;
  subordinates: string;
  accountability: string;
  refusalConsequence: string;
}

export interface RoleOperationalScope {
  level: 'national' | 'theater' | 'formation' | 'unit' | 'observer';
  label: string;
  detail: string;
  divisionIds: string[];
}

export interface RoleCommandEvent {
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  tab: GameTab;
}

export interface RoleCommandWeekResult {
  state: RoleCommandState;
  events: RoleCommandEvent[];
  careerDelta: { reputation: number; councilTrust: number; experience: number };
}

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));

function stableRoll(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

const branchDutyTabs: Record<CareerRole['branch'], GameTab[]> = {
  military: ['army', 'map', 'organization', 'industry'],
  politics: ['governance', 'organization', 'economy', 'diplomacy'],
  intelligence: ['intelligence', 'organization', 'map', 'diplomacy'],
};

const branchObjectiveCopy: Record<CareerRole['branch'], { title: string; summary: string }> = {
  military: { title: '작전 지휘 순환', summary: '전황을 읽고 예하 전력을 확인한 뒤 상부와 지원부서의 협조를 확보하십시오.' },
  politics: { title: '정책 연합 순환', summary: '민심과 내각 상황을 검토하고 담당 부처·정파 사이에서 집행 가능한 합의를 만드십시오.' },
  intelligence: { title: '정보 판단 순환', summary: '첩보의 신뢰도를 확인하고 작전·외교 부서에 필요한 범위만 공유해 행동을 이끌어내십시오.' },
};

export function getRoleOperationalScope(role: CareerRole, divisionIds: string[]): RoleOperationalScope {
  // Match the highest-office exception in getRoleTabMandates before branch limits.
  // The real campaign heads are political posts, not military tier-one fixtures.
  if (role.tier === 1 || role.archetype === 'head-of-state') {
    return { level: 'national', label: '국가 전군 통수', detail: '모든 야전부대에 직접 명령할 수 있습니다.', divisionIds: [...divisionIds] };
  }
  if (role.branch !== 'military') {
    return {
      level: 'observer',
      label: '전황 보고만 열람',
      detail: '군령권이 없는 보직입니다. 작전 개입은 군 지휘부에 상신해야 합니다.',
      divisionIds: [],
    };
  }
  const limit = role.tier === 2 ? Math.max(4, Math.ceil(divisionIds.length * .72))
    : role.tier === 3 ? Math.max(3, Math.ceil(divisionIds.length * .46))
      : role.tier === 4 ? 2 : 1;
  const level = role.tier === 2 ? 'theater' : role.tier === 3 ? 'formation' : 'unit';
  const label = role.tier === 2 ? '전구 지휘권' : role.tier === 3 ? '군단·집단군 지휘권' : role.tier === 4 ? '예하 편제 지휘권' : '단일 부대 지휘권';
  return {
    level,
    label,
    detail: `${Math.min(limit, divisionIds.length)}개 예하 부대만 직접 인사·훈련·공세 명령을 내릴 수 있습니다. 나머지는 상급 지휘부 관할입니다.`,
    divisionIds: divisionIds.slice(0, limit),
  };
}

function createWeeklyObjective(role: CareerRole, week: number): RoleWeeklyObjective {
  const mandates = getRoleTabMandates(role);
  const duties = branchDutyTabs[role.branch].filter((tab) => mandates[tab].mode === 'direct');
  const primaryTab = duties[week % duties.length];
  const secondaryTab = duties[(week + 1) % duties.length];
  const copy = branchObjectiveCopy[role.branch];
  const tasks: RoleObjectiveTask[] = [
    { id: `briefing-${week}`, label: '보직 브리핑 확인', detail: '내 책임·권한 경계와 이번 주 우선순위를 검토', kind: 'briefing', tab: 'command', done: true },
    { id: `duty-${week}`, label: '직접 책임 업무 점검', detail: `${primaryTab} 지휘실에서 현황과 실행 가능한 행동을 확인`, kind: 'visit', tab: primaryTab, done: false },
    role.tier === 1 || role.archetype === 'head-of-state'
      ? { id: `oversight-${week}`, label: '두 번째 국정 분야 교차검토', detail: `${secondaryTab} 지휘실에서 부처 간 영향을 검토`, kind: 'visit', tab: secondaryTab, done: false }
      : { id: `chain-${week}`, label: '지휘계통 행동 1회', detail: '보고 확인·권한 상신·설득·명령 이의제기 중 하나를 기록', kind: 'chain', done: false },
    { id: `action-${week}`, label: '실제 조치 성과 1건', detail: '직접 권한 안에서 조달·훈련·정책·인사 등 실제 조치를 성공시킵니다. 화면 열람이나 같은 설정 재적용은 성과가 아닙니다.', kind: 'action', done: false },
  ];
  return {
    id: `role-objective-${role.id}-${week}`,
    week,
    title: copy.title,
    summary: copy.summary,
    tasks,
    completed: false,
    rewardClaimed: false,
    reward: '경력 경험 +5 · 지도부 신임 +2 · 평판 +1',
    actionEvidence: [],
  };
}

export function createRoleCommandState(role: CareerRole, week = 0): RoleCommandState {
  return {
    version: 1,
    nationId: role.nationId,
    roleId: role.id,
    requests: [],
    objective: createWeeklyObjective(role, week),
    officialFavor: 50,
    defiance: 0,
    reportsRead: 0,
    lastAdvancedWeek: week,
  };
}

export function normalizeRoleCommandState(value: unknown, role: CareerRole, week: number): RoleCommandState {
  const fallback = createRoleCommandState(role, week);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<RoleCommandState>;
  if (candidate.nationId !== role.nationId || candidate.roleId !== role.id) return fallback;
  const normalized: RoleCommandState = {
    ...fallback,
    requests: Array.isArray(candidate.requests) ? candidate.requests.filter((request) => request && typeof request.id === 'string').slice(-30) : [],
    objective: fallback.objective,
    officialFavor: typeof candidate.officialFavor === 'number' ? clamp(candidate.officialFavor) : fallback.officialFavor,
    defiance: typeof candidate.defiance === 'number' ? clamp(candidate.defiance) : fallback.defiance,
    reportsRead: typeof candidate.reportsRead === 'number' ? Math.max(0, candidate.reportsRead) : 0,
    lastAdvancedWeek: typeof candidate.lastAdvancedWeek === 'number' ? candidate.lastAdvancedWeek : week,
  };
  const savedObjective = candidate.objective;
  if (!savedObjective || savedObjective.week !== week) return normalized;
  const savedTasks = Array.isArray(savedObjective.tasks) ? savedObjective.tasks : [];
  const mandates = applyRoleDelegations(getRoleTabMandates(role), normalized, week);
  const evidence = Array.isArray(savedObjective.actionEvidence) ? savedObjective.actionEvidence.filter((entry, index, entries) =>
    entry && typeof entry.id === 'string' && entry.id.trim().length > 0
    && entry.week === week && entry.outcome === 'succeeded'
    && typeof entry.description === 'string' && entry.description.trim().length > 0
    && entry.tab !== 'command' && mandates[entry.tab]?.mode === 'direct'
    && entries.findIndex((other) => other?.id === entry.id) === index).slice(0, 12) : [];
  const tasks = fallback.objective.tasks.map((task) => ({
    ...task,
    done: task.kind === 'action' ? evidence.length > 0 : task.done || Boolean(savedTasks.some((saved) =>
      saved.id === task.id && saved.kind === task.kind && saved.tab === task.tab && saved.done)),
  }));
  return {
    ...normalized,
    objective: {
      ...fallback.objective,
      tasks,
      completed: tasks.every((task) => task.done),
      rewardClaimed: savedObjective.rewardClaimed === true,
      actionEvidence: evidence,
    },
  };
}

export function getRoleCommandChainProfile(role: CareerRole): RoleCommandChainProfile {
  const head = role.tier === 1 || role.archetype === 'head-of-state';
  const superior = head ? '국민·헌정 질서·정권 핵심연합'
    : role.branch === 'military' ? '상급 전구사령부·국가 전쟁지도부'
      : role.branch === 'politics' ? '국가원수·전시내각·의회 또는 당 지도부'
        : '정보기관장·국가안보 지도부';
  const subordinates = role.branch === 'military' ? '예하 지휘관·참모부·지원부대'
    : role.branch === 'politics' ? '담당 관료·정책참모·지역조직'
      : '분석관·현장요원·비밀 연락망';
  return {
    superior,
    current: `${role.title} · ${role.historicalOffice}`,
    subordinates,
    accountability: head ? '국가 전체의 결과와 정권 생존에 직접 책임' : `${role.scope} 안에서는 직접 책임, 보직 밖 업무는 상신·협의 책임`,
    refusalConsequence: head ? '헌정위기·내각 이탈·국민 위임 하락' : '상급자 신뢰 하락·명령 불복 기록·해임 또는 독자 노선의 기회',
  };
}

export function getActiveRoleRequest(state: RoleCommandState, tab: GameTab) {
  return [...state.requests].reverse().find((request) => request.tab === tab && request.status !== 'expired') ?? null;
}

export function applyRoleDelegations(
  mandates: Record<GameTab, RoleTabMandate>,
  state: RoleCommandState,
  week: number,
): Record<GameTab, RoleTabMandate> {
  const activeTabs = new Map(state.requests
    .filter((request) => request.status === 'approved' && (request.delegationUntilWeek ?? -1) >= week)
    .map((request) => [request.tab, request]));
  return Object.fromEntries(Object.entries(mandates).map(([tab, mandate]) => {
    const request = activeTabs.get(tab as GameTab);
    if (!request || mandate.mode === 'locked') return [tab, mandate];
    return [tab, {
      ...mandate,
      mode: 'direct',
      label: request.route === 'defiant' ? '비상 월권' : '위임 집행',
      reason: request.route === 'defiant'
        ? `상급기관의 사전 승인 없이 제${(request.delegationUntilWeek ?? week) + 1}주까지 한시적으로 집행합니다.`
        : `상급기관이 제${(request.delegationUntilWeek ?? week) + 1}주까지 제한적으로 결재권을 위임했습니다.`,
      authorityRoute: request.route === 'defiant'
        ? '결과가 좋으면 독자 지도력이 되지만 실패하면 명령 불복과 월권 책임을 집니다.'
        : '위임 범위와 기간 안에서만 직접 결재하며 종료 뒤 상급기관에 결과를 보고합니다.',
    } satisfies RoleTabMandate];
  })) as Record<GameTab, RoleTabMandate>;
}

export function recordRoleInteraction(state: RoleCommandState, kind: RoleInteractionKind, tab: GameTab): RoleCommandState {
  const nextTasks = state.objective.tasks.map((task) => {
    const matches = task.kind === 'briefing' ? kind === 'briefing'
      : task.kind === 'visit' ? kind === 'direct' && task.tab === tab
        : task.kind === 'chain' && ['report', 'request', 'persuade', 'defy'].includes(kind);
    return matches && !task.done ? { ...task, done: true } : task;
  });
  const completed = nextTasks.every((task) => task.done) && (state.objective.actionEvidence?.length ?? 0) > 0;
  if (kind !== 'report' && completed === state.objective.completed && nextTasks.every((task, index) => task === state.objective.tasks[index])) return state;
  return {
    ...state,
    reportsRead: kind === 'report' ? state.reportsRead + 1 : state.reportsRead,
    objective: { ...state.objective, tasks: nextTasks, completed },
  };
}

/** Call only after the owning action handler has applied a successful, non-no-op change. */
export function recordRoleActionEvidence(state: RoleCommandState, role: CareerRole, evidence: RoleActionEvidence): RoleCommandState {
  if (state.roleId !== role.id || state.nationId !== role.nationId
    || evidence.week !== state.objective.week || evidence.outcome !== 'succeeded'
    || !evidence.id.trim() || !evidence.description.trim() || evidence.tab === 'command') return state;
  const mandates = applyRoleDelegations(getRoleTabMandates(role), state, evidence.week);
  if (mandates[evidence.tab].mode !== 'direct') return state;
  const previous = state.objective.actionEvidence ?? [];
  if (previous.some((entry) => entry.id === evidence.id)) return state;
  const tasks = state.objective.tasks.map((task) => task.kind === 'action' ? { ...task, done: true } : task);
  return {
    ...state,
    objective: {
      ...state.objective,
      tasks,
      actionEvidence: [...previous, evidence].slice(0, 12),
      completed: tasks.every((task) => task.done),
    },
  };
}

export function submitRoleAuthorityRequest(
  state: RoleCommandState,
  role: CareerRole,
  mandate: RoleTabMandate,
  tabLabel: string,
  week: number,
  metrics: { councilTrust: number; reputation: number },
): RoleCommandState | null {
  if (mandate.mode !== 'request' && mandate.mode !== 'report') return null;
  const current = getActiveRoleRequest(state, mandate.tab);
  if (current && ['submitted', 'reviewing', 'approved'].includes(current.status)) return null;
  const sensitivity = ['governance', 'economy', 'diplomacy', 'army'].includes(mandate.tab) ? 8 : 3;
  const support = clamp(24 + role.authority * .25 + metrics.councilTrust * .22 + metrics.reputation * .14
    - (mandate.mode === 'report' ? 12 : 0) - sensitivity, 10, 82);
  const request: RoleAuthorityRequest = {
    id: `role-request-${role.id}-${mandate.tab}-${week}-${state.requests.length}`,
    tab: mandate.tab,
    tabLabel,
    sourceMode: mandate.mode,
    status: 'submitted',
    submittedWeek: week,
    decisionWeek: week + 2,
    delegationUntilWeek: null,
    support: Math.round(support),
    persuasionCount: 0,
    route: 'authorized',
    result: null,
  };
  return recordRoleInteraction({ ...state, requests: [...state.requests, request].slice(-30) }, 'request', mandate.tab);
}

export function persuadeRoleAuthority(
  state: RoleCommandState,
  requestId: string,
  strategy: RolePersuasionStrategy,
): { state: RoleCommandState; politicalCost: number; trustDelta: number; detail: string } | null {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || !['submitted', 'reviewing', 'rejected'].includes(request.status)) return null;
  const politicalCost = strategy === 'evidence' ? 2 : strategy === 'sponsor' ? 4 : 0;
  const supportGain = strategy === 'evidence' ? 10 : strategy === 'sponsor' ? 16 : 13;
  const trustDelta = strategy === 'pressure' ? -4 : strategy === 'sponsor' ? 1 : 0;
  const detail = strategy === 'evidence' ? '전문가 검토와 수치 근거를 첨부해 승인 가능성을 높였습니다.'
    : strategy === 'sponsor' ? '내각·참모부의 후원자를 설득해 상신안에 공동 책임자를 세웠습니다.'
      : '언론·현장 성과·조직 압력을 이용해 빠른 결정을 요구했습니다. 승인 가능성은 오르지만 상급자 신뢰가 손상됩니다.';
  const nextState = {
    ...state,
    officialFavor: clamp(state.officialFavor + (strategy === 'sponsor' ? 2 : strategy === 'pressure' ? -5 : 0)),
    defiance: clamp(state.defiance + (strategy === 'pressure' ? 6 : 0)),
    requests: state.requests.map((item) => item.id === requestId ? {
      ...item,
      status: item.status === 'rejected' ? 'reviewing' as const : item.status,
      decisionWeek: item.status === 'rejected' ? item.decisionWeek + 1 : item.decisionWeek,
      support: clamp(item.support + supportGain, 0, 96),
      persuasionCount: item.persuasionCount + 1,
      result: null,
    } : item),
  };
  return { state: recordRoleInteraction(nextState, 'persuade', request.tab), politicalCost, trustDelta, detail };
}

export function defyRoleAuthority(
  state: RoleCommandState,
  role: CareerRole,
  mandate: RoleTabMandate,
  tabLabel: string,
  week: number,
): { state: RoleCommandState; trustDelta: number; reputationDelta: number; detail: string } | null {
  if ((mandate.mode !== 'request' && mandate.mode !== 'report') || role.tier === 1) return null;
  const request: RoleAuthorityRequest = {
    id: `role-defiance-${role.id}-${mandate.tab}-${week}-${state.requests.length}`,
    tab: mandate.tab,
    tabLabel,
    sourceMode: mandate.mode,
    status: 'approved',
    submittedWeek: week,
    decisionWeek: week,
    delegationUntilWeek: week + 1,
    support: 0,
    persuasionCount: 0,
    route: 'defiant',
    result: '상급기관 승인 없이 비상권한을 행사했습니다.',
  };
  const next = recordRoleInteraction({
    ...state,
    requests: [...state.requests, request].slice(-30),
    officialFavor: clamp(state.officialFavor - 10),
    defiance: clamp(state.defiance + 14),
  }, 'defy', mandate.tab);
  return {
    state: next,
    trustDelta: -8,
    reputationDelta: -2,
    detail: `${tabLabel}의 결재권을 2주 동안 비상 인수했습니다. 결과가 나쁘면 월권·명령 불복 책임이 해임 심사에 반영됩니다.`,
  };
}

export function advanceRoleCommandWeek(
  state: RoleCommandState,
  role: CareerRole,
  week: number,
): RoleCommandWeekResult {
  const events: RoleCommandEvent[] = [];
  const careerDelta = { reputation: 0, councilTrust: 0, experience: 0 };
  if (week <= state.lastAdvancedWeek) return { state, events, careerDelta };
  let favorShift = 0;
  const hasEvidence = state.objective.actionEvidence?.some((entry) => entry.week === state.objective.week && entry.outcome === 'succeeded');
  if (state.objective.completed && hasEvidence && !state.objective.rewardClaimed) {
    careerDelta.reputation += 1;
    careerDelta.councilTrust += 2;
    careerDelta.experience += 5;
  }
  const requests = state.requests.map((request) => {
    if (request.status === 'submitted' && week > request.submittedWeek) {
      events.push({ title: `${request.tabLabel} 상신안 심사 개시`, detail: `상급기관이 안건을 정식 심사 목록에 올렸습니다. 현재 지지 ${Math.round(request.support)}% · 결정 예정 제${request.decisionWeek + 1}주.`, tone: 'neutral', tab: request.tab });
      return { ...request, status: 'reviewing' as const };
    }
    if (request.status === 'reviewing' && week >= request.decisionWeek) {
      const approved = stableRoll(`${request.id}:${week}:${request.support}`) * 100 <= request.support;
      const delegationWeeks = request.sourceMode === 'request' ? 3 : 1;
      events.push({
        title: `${request.tabLabel} 권한 ${approved ? '승인' : '기각'}`,
        detail: approved ? `상급기관이 ${delegationWeeks}주 한시 위임을 승인했습니다. 기간 안에 집행하고 결과를 보고해야 합니다.` : `상급기관이 권한 범위·자원 부담을 이유로 기각했습니다. 근거 보강, 후원자 확보, 공개 압박 가운데 하나를 선택할 수 있습니다.`,
        tone: approved ? 'good' : 'bad', tab: request.tab,
      });
      favorShift += approved ? 3 : -1;
      return { ...request, status: approved ? 'approved' as const : 'rejected' as const, delegationUntilWeek: approved ? week + delegationWeeks - 1 : null, result: approved ? '한시 위임 승인' : '권한 상신 기각' };
    }
    if (request.status === 'approved' && week > (request.delegationUntilWeek ?? -1)) {
      events.push({ title: `${request.tabLabel} 위임 종료`, detail: request.route === 'defiant' ? '비상 월권 기간이 끝났습니다. 성과와 부작용이 다음 인사평가에서 함께 검토됩니다.' : '한시적 집행권이 상급기관으로 돌아갔습니다. 이후 행동은 다시 보고·상신 절차를 거쳐야 합니다.', tone: 'neutral', tab: request.tab });
      return { ...request, status: 'expired' as const };
    }
    return request;
  });
  const objective = state.objective.week < week ? createWeeklyObjective(role, week) : { ...state.objective, rewardClaimed: state.objective.completed ? true : state.objective.rewardClaimed };
  return {
    state: { ...state, requests, objective, officialFavor: clamp(state.officialFavor + favorShift), defiance: clamp(state.defiance - .5), lastAdvancedWeek: week },
    events,
    careerDelta,
  };
}
