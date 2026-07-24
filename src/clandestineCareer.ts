import type { CareerBranch, CareerRole, GameState, NationId } from './types';

export type ClandestineStatus =
  | 'probation'
  | 'active'
  | 'controlled-double'
  | 'under-investigation'
  | 'compromised'
  | 'exfiltration'
  | 'closed';

export type ClandestinePosture =
  | 'protect-cover'
  | 'earn-handler-trust'
  | 'controlled-deception'
  | 'prepare-exit';

export type ClandestineMissionDomain =
  | 'military'
  | 'diplomacy'
  | 'technology'
  | 'logistics'
  | 'personnel'
  | 'politics';

export type ClandestineMissionStatus =
  | 'offered'
  | 'in-progress'
  | 'resolved'
  | 'refused'
  | 'failed';

export type ClandestineMissionResponse =
  | 'comply-full'
  | 'comply-selective'
  | 'disinform'
  | 'controlled-double'
  | 'refuse';

export type ClandestineIncidentKind =
  | 'internal-audit'
  | 'handler-doubt'
  | 'colleague-suspicion'
  | 'loyalty-review'
  | 'emergency-extraction';

export type ClandestineIncidentResponse =
  | 'lay-low'
  | 'cooperate-home'
  | 'misdirect-investigation'
  | 'request-extraction'
  | 'cut-ties';

export interface ClandestineMission {
  id: string;
  title: string;
  codename: string;
  domain: ClandestineMissionDomain;
  status: ClandestineMissionStatus;
  receivedWeek: number;
  deadlineWeek: number;
  resolutionWeek: number | null;
  response: ClandestineMissionResponse | null;
  objective: string;
  handlerRationale: string;
  accessRequired: number;
  difficulty: number;
  dangerToHome: number;
  handlerValue: number;
  coverRisk: number;
  reward: number;
  historicalPattern: string;
  previews: string[];
  resultTitle?: string;
  resultDetail?: string;
}

export interface ClandestineMessage {
  id: string;
  week: number;
  sender: 'handler' | 'home-counterintelligence' | 'system';
  title: string;
  detail: string;
  tone: 'good' | 'neutral' | 'bad';
}

export interface ClandestineIncident {
  id: string;
  kind: ClandestineIncidentKind;
  openedWeek: number;
  title: string;
  detail: string;
  stakes: string[];
}

export interface ClandestineCareerState {
  homeNationId: NationId;
  handlerNationId: NationId;
  handlerAlias: string;
  coverName: string;
  status: ClandestineStatus;
  posture: ClandestinePosture;
  recruitedWeek: number;
  lastProcessedWeek: number;
  nextMissionWeek: number;
  handlerTrust: number;
  homeTrust: number;
  coverStrength: number;
  accessLevel: number;
  pressure: number;
  stress: number;
  extractionReadiness: number;
  operationalFunds: number;
  totalEarnings: number;
  completedMissions: number;
  genuineLeaks: number;
  deceptionReports: number;
  controlledByHome: boolean;
  missions: ClandestineMission[];
  messages: ClandestineMessage[];
  incident: ClandestineIncident | null;
}

export interface ClandestineRecruitmentInput {
  homeNationId: NationId;
  handlerNationId: NationId;
  week: number;
  role: CareerRole;
  handlerTrust?: number;
  coverStrength?: number;
  weeklyRetainer: number;
}

export interface ClandestineWeekContext {
  week: number;
  role: CareerRole;
  intelNetwork: number;
  stability: number;
  warSupport: number;
  campaignPhase: 'war' | 'nation';
  exposure: number;
}

export interface ClandestineResolution {
  state: ClandestineCareerState;
  exposureDelta: number;
  gameDelta: Partial<Record<keyof GameState, number>>;
  careerDelta: {
    reputation: number;
    councilTrust: number;
    legacy: number;
  };
  title: string;
  detail: string;
  tone: 'good' | 'neutral' | 'bad';
  needsAttention?: boolean;
  missionId?: string;
  transferNationId?: NationId;
}

export interface ClandestineWeekResult {
  state: ClandestineCareerState;
  exposureDelta: number;
  gameDelta: Partial<Record<keyof GameState, number>>;
  careerDelta: {
    reputation: number;
    councilTrust: number;
    legacy: number;
  };
  notices: Array<{
    title: string;
    detail: string;
    tone: 'good' | 'neutral' | 'bad';
  }>;
  newMissionId: string | null;
  incidentOpened: boolean;
  needsAttention: boolean;
}

export const clandestineStatusLabels: Record<ClandestineStatus, string> = {
  probation: '검증 단계',
  active: '비밀 협조 중',
  'controlled-double': '통제 이중공작',
  'under-investigation': '방첩 조사 중',
  compromised: '신분 노출',
  exfiltration: '탈출 준비',
  closed: '연락 종료',
};

export const clandestinePostureLabels: Record<ClandestinePosture, { title: string; detail: string }> = {
  'protect-cover': { title: '신분 보전 우선', detail: '요구를 늦추고 접근 범위를 줄여 장기 생존을 우선합니다.' },
  'earn-handler-trust': { title: '핸들러 신뢰 확보', detail: '상대가 가치 있다고 느낄 정보를 제공해 더 큰 제안과 보호를 노립니다.' },
  'controlled-deception': { title: '통제 기만', detail: '본국 방첩기관과 협조해 사실과 허위정보의 비율을 설계합니다.' },
  'prepare-exit': { title: '이탈 준비', detail: '임무 성과보다 신변보호와 새 소속으로의 이동 준비를 앞세웁니다.' },
};

export const clandestineResponseLabels: Record<ClandestineMissionResponse, { title: string; detail: string }> = {
  'comply-full': { title: '요구대로 제공', detail: '핸들러 신뢰와 보상은 크지만 본국 피해와 발각 위험도 가장 큽니다.' },
  'comply-selective': { title: '선별·지연 제공', detail: '검증 가능한 일부만 넘겨 양측의 의심을 관리합니다.' },
  disinform: { title: '가공 정보 제공', detail: '상대를 오판시키지만 검증에 실패하면 핸들러 신뢰가 크게 무너집니다.' },
  'controlled-double': { title: '본국에 보고 후 통제', detail: '본국 방첩기관과 함께 상대 연락선을 역이용합니다.' },
  refuse: { title: '요구 거부', detail: '이번 피해는 막지만 압박과 계약 파기 위험이 높아집니다.' },
};

export const clandestineIncidentResponseLabels: Record<ClandestineIncidentResponse, { title: string; detail: string }> = {
  'lay-low': { title: '활동 중지·잠복', detail: '당분간 임무와 보상을 포기하고 의심이 가라앉기를 기다립니다.' },
  'cooperate-home': { title: '본국 방첩기관에 자진 보고', detail: '처벌·경력 손상을 감수하고 통제 이중공작 또는 보호관찰을 요청합니다.' },
  'misdirect-investigation': { title: '조사의 방향 전환', detail: '정치력과 내부 신뢰를 소모해 자신에게 집중된 의심을 분산합니다.' },
  'request-extraction': { title: '긴급 탈출 요청', detail: '핸들러의 보호 약속을 시험하며 성공하면 외국 소속으로 전환할 길이 열립니다.' },
  'cut-ties': { title: '연락 완전 단절', detail: '외국 신뢰와 미지급 보상을 포기하고 추가 노출을 막습니다.' },
};

const handlerAliases = [
  '서기관 그레이',
  '연락관 오리온',
  '특사 노스',
  '고문 라자르',
  '조정관 아틀라스',
  '대리인 메리디언',
];

const coverNamesByBranch: Record<CareerBranch, string[]> = {
  military: ['군사사절단 연락고문', '전구 보급평가관', '합동훈련 참관관'],
  politics: ['중립국 정책연구위원', '전후재건 연락고문', '통상협상 자문관'],
  intelligence: ['전구 정보분석 연락관', '점령지 조사위원', '통신보안 평가관'],
};

const missionTemplates: Array<{
  domain: ClandestineMissionDomain;
  title: string;
  codename: string;
  objective: string;
  handlerRationale: string;
  historicalPattern: string;
  branch?: CareerBranch;
  danger: number;
  value: number;
  difficulty: number;
}> = [
  {
    domain: 'military',
    title: '전구 우선순위 요약 요구',
    codename: '흐린 나침반',
    objective: '향후 몇 주간 어느 전선과 전력이 우선될지 판단 가능한 고위급 요약을 요구받았습니다.',
    handlerRationale: '상대는 병력 자체보다 지휘부가 무엇을 중요하게 보는지 알고 싶어 합니다.',
    historicalPattern: '전시 이중공작에서 전략 의도와 우선순위를 둘러싼 진실·기만의 혼합',
    danger: 72,
    value: 82,
    difficulty: 62,
  },
  {
    domain: 'logistics',
    title: '군수 병목 평가 요구',
    codename: '깨진 톱니',
    objective: '생산·수송·연료 가운데 현재 체계를 가장 크게 제한하는 병목의 등급과 추세를 요구받았습니다.',
    handlerRationale: '구체 좌표가 아니라 국가 운영의 취약한 축을 확인해 장기 압박 계획에 쓰려 합니다.',
    historicalPattern: '군수·희소자원·수송 정보가 전략 판단을 바꾸는 내부자 위협 사례',
    danger: 64,
    value: 70,
    difficulty: 48,
  },
  {
    domain: 'technology',
    title: '연구 방향 검증 요구',
    codename: '검은 청사진',
    objective: '현재 연구·장비개발에서 실제로 자원이 집중되는 분야와 성숙도를 확인해 달라는 요구입니다.',
    handlerRationale: '상대는 완성 기술보다 연구 우선순위와 조직의 자신감을 측정하려 합니다.',
    historicalPattern: '군사·민수 겸용 기술과 연구 방향을 노린 경제·기술 첩보 사례',
    danger: 68,
    value: 76,
    difficulty: 58,
  },
  {
    domain: 'personnel',
    title: '지도부 균열 지도 작성',
    codename: '갈라진 원탁',
    objective: '참모·각료 가운데 현 지도부에 불만이 있거나 외부 제안에 흔들릴 수 있는 세력의 유형을 평가합니다.',
    handlerRationale: '단일 인물보다 조직의 파벌과 승진 경쟁을 이용할 여지를 찾으려 합니다.',
    historicalPattern: '불만·경력 좌절·이념·금전 동기가 포섭 위험을 높인다는 방첩 연구',
    danger: 78,
    value: 84,
    difficulty: 70,
  },
  {
    domain: 'diplomacy',
    title: '협상 한계선 탐색',
    codename: '유리 국경',
    objective: '동맹·휴전·통상 교섭에서 본국 지도부가 양보할 수 있는 범위를 간접적으로 확인합니다.',
    handlerRationale: '공개 입장과 실제 타협 가능성 사이의 간극을 외교 협상에 이용하려 합니다.',
    historicalPattern: '내부 정책·협상 자료가 외국 정부와 기업에 교섭 우위를 주는 사례',
    danger: 58,
    value: 66,
    difficulty: 55,
  },
  {
    domain: 'politics',
    title: '정책 결정에 미세한 영향 요구',
    codename: '기울어진 저울',
    objective: '다음 회의에서 특정 예산·인사·외교 선택지가 더 합리적으로 보이도록 영향력을 행사하라는 요구입니다.',
    handlerRationale: '문서보다 사용자의 실제 권한을 시험하고 장기 영향공작 가능성을 검증합니다.',
    historicalPattern: '접근권과 조직 내 영향력이 정보 수집을 넘어 정책 결과에 영향을 주는 포섭 구조',
    branch: 'politics',
    danger: 82,
    value: 88,
    difficulty: 74,
  },
  {
    domain: 'military',
    title: '전선 기만정보 공동 설계',
    codename: '종이 군단',
    objective: '상대가 믿을 수 있는 일부 사실에 가공된 전략 신호를 섞어 장기적인 오판을 유도할 수 있는지 시험합니다.',
    handlerRationale: '핸들러는 당신을 통제한다고 믿지만, 본국은 상대의 신뢰망을 역으로 이용할 수 있습니다.',
    historicalPattern: 'MI5 Double Cross와 GARBO 사례의 장기 허위정보·가공된 조직망 운용',
    branch: 'intelligence',
    danger: 74,
    value: 92,
    difficulty: 82,
  },
];

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, value));
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function choose<T>(items: T[], seed: string, offset = 0) {
  return items[(hashText(`${seed}:${offset}`) + offset) % items.length];
}

function pushMessage(
  state: ClandestineCareerState,
  message: Omit<ClandestineMessage, 'id'>,
): ClandestineCareerState {
  return {
    ...state,
    messages: [
      { ...message, id: `clandestine-message-${message.week}-${hashText(`${message.title}:${message.detail}`).toString(36)}` },
      ...state.messages,
    ].slice(0, 80),
  };
}

function createMission(state: ClandestineCareerState, role: CareerRole, week: number): ClandestineMission {
  const eligible = missionTemplates.filter((template) => !template.branch || template.branch === role.branch);
  const template = choose(eligible, `${state.handlerNationId}:${role.id}:${week}:${state.completedMissions}`, 2);
  const trustModifier = Math.round((state.handlerTrust - 50) * 0.12);
  const accessModifier = Math.round((state.accessLevel - 50) * 0.08);
  const deadline = week + Math.max(2, 4 - Math.floor(state.pressure / 35));
  const danger = clamp(template.danger + trustModifier + Math.floor(state.completedMissions / 2) * 2);
  const value = clamp(template.value + accessModifier);
  const difficulty = clamp(template.difficulty + Math.floor(state.completedMissions / 3) * 3);
  const reward = Math.round(8 + value * 0.34 + state.handlerTrust * 0.12);
  return {
    id: `clandestine-mission-${week}-${template.domain}-${hashText(`${state.handlerAlias}:${template.codename}:${week}`).toString(36)}`,
    title: template.title,
    codename: template.codename,
    domain: template.domain,
    status: 'offered',
    receivedWeek: week,
    deadlineWeek: deadline,
    resolutionWeek: null,
    response: null,
    objective: template.objective,
    handlerRationale: template.handlerRationale,
    accessRequired: clamp(difficulty - 8),
    difficulty,
    dangerToHome: danger,
    handlerValue: value,
    coverRisk: clamp(18 + difficulty * 0.38 + state.pressure * 0.16 - state.coverStrength * 0.14),
    reward,
    historicalPattern: template.historicalPattern,
    previews: [
      `핸들러 신뢰 ${Math.round(state.handlerTrust)}에 따라 이번 요구의 중요도는 ${value >= 75 ? '전략급' : value >= 55 ? '고위급' : '제한급'}입니다.`,
      `현재 접근권 ${Math.round(state.accessLevel)} · 요구 접근권 ${Math.round(clamp(difficulty - 8))}. 부족하면 결과의 신뢰도와 위장 강도가 낮아집니다.`,
      `요구대로 수행하면 본국 피해 ${Math.round(danger)} · 기본 위장 노출 ${Math.round(clamp(18 + difficulty * 0.38 - state.coverStrength * 0.14))}.`,
      `응답 기한은 제 ${deadline + 1}주입니다. 지연은 즉시 발각보다 핸들러 압박과 계약 파기 가능성을 높입니다.`,
    ],
  };
}

function incidentFor(
  state: ClandestineCareerState,
  context: ClandestineWeekContext,
): ClandestineIncident | null {
  if (state.incident || state.status === 'closed') return null;
  if (state.status === 'exfiltration') {
    if (state.extractionReadiness < 72) return null;
    return {
      id: `clandestine-incident-${context.week}-final-extraction`,
      kind: 'emergency-extraction',
      openedWeek: context.week,
      title: '최종 탈출 창구 개방',
      detail: '외국 핸들러가 신변보호·이동·새 보직 인계를 묶은 최종 이탈 결정을 요구합니다.',
      stakes: ['수락하면 현재 국가의 보직을 잃고 핸들러 국가로 전향', '같은 세계선·경력·선택 기록은 유지', '거부하거나 연락을 끊으면 현 소속에 남음'],
    };
  }
  const combinedRisk = context.exposure
    + state.pressure * 0.22
    + state.stress * 0.18
    + (100 - state.coverStrength) * 0.28
    + state.genuineLeaks * 4;
  const due = combinedRisk >= 54 && hashText(`${context.week}:${state.handlerAlias}:${Math.round(combinedRisk)}`) % 100 < clamp(combinedRisk - 30, 12, 74);
  if (!due) return null;
  const kindPool: ClandestineIncidentKind[] = context.exposure >= 82
    ? ['emergency-extraction', 'loyalty-review', 'internal-audit']
    : state.handlerTrust < 34
      ? ['handler-doubt', 'loyalty-review', 'colleague-suspicion']
      : ['internal-audit', 'colleague-suspicion', 'loyalty-review', 'handler-doubt'];
  const kind = choose(kindPool, `${context.week}:${combinedRisk}`, 3);
  const descriptions: Record<ClandestineIncidentKind, { title: string; detail: string; stakes: string[] }> = {
    'internal-audit': {
      title: '본국 방첩부의 접근기록 감사',
      detail: '최근 결재·열람·접촉 패턴이 보직상 필요 범위를 벗어났다는 내부 검토가 시작됐습니다.',
      stakes: ['협조하면 외국 연락선이 드러날 수 있음', '회피하면 지도부 신임과 위장 강도가 하락', '통제 이중공작으로 전환할 마지막 기회'],
    },
    'handler-doubt': {
      title: '핸들러의 충성도 재검증',
      detail: '제공 정보의 정확도와 지연 패턴이 상대 기관 내부 심사를 통과하지 못했습니다.',
      stakes: ['추가 진짜 정보를 요구받을 가능성', '허위정보가 드러나면 외국 보호 약속 약화', '신뢰 회복 대신 연락 단절 가능'],
    },
    'colleague-suspicion': {
      title: '가까운 참모의 비공식 의심',
      detail: '주변 인물이 일정·결재·재정 변화의 불일치를 감지해 상급자에게 보고할지를 고민하고 있습니다.',
      stakes: ['조직 관계가 개인 방첩 위험으로 전환', '내부 신임을 소모해 의심을 완화 가능', '대응 실패 시 공식 조사로 확대'],
    },
    'loyalty-review': {
      title: '긴급 충성도 심사',
      detail: '보직 갱신과 보안인가를 앞두고 신원·재정·정책결정에 대한 종합 검증이 예고됐습니다.',
      stakes: ['접근권 유지 여부', '현직 해임 또는 체포 위험', '본국·외국 중 어느 보호를 선택할지 결정'],
    },
    'emergency-extraction': {
      title: '연락망 붕괴와 긴급 이탈 통보',
      detail: '상대 기관은 현재 신분이 곧 노출될 수 있다며 즉시 탈출하거나 모든 연락을 끊으라고 통보했습니다.',
      stakes: ['외국 망명·전향 경로 개방', '현재 국가의 보직과 조직을 포기', '남으면 체포 위험이 크게 증가'],
    },
  };
  return {
    id: `clandestine-incident-${context.week}-${kind}`,
    kind,
    openedWeek: context.week,
    ...descriptions[kind],
  };
}

function missionGameDelta(
  mission: ClandestineMission,
  response: ClandestineMissionResponse,
  success: boolean,
): Partial<Record<keyof GameState, number>> {
  if (!success) return response === 'disinform' || response === 'controlled-double'
    ? { intelNetwork: -3, politicalPower: -2 }
    : { stability: -1, politicalPower: -1 };
  const sign = response === 'comply-full' ? -1 : response === 'comply-selective' ? -0.45 : 1;
  const magnitude = mission.dangerToHome >= 75 ? 3 : mission.dangerToHome >= 55 ? 2 : 1;
  if (mission.domain === 'military') return { victoryScore: Math.round(sign * magnitude), enemyPressure: Math.round(-sign * magnitude) };
  if (mission.domain === 'logistics') return { fuel: Math.round(sign * magnitude * 3), steel: Math.round(sign * magnitude * 2) };
  if (mission.domain === 'technology') return { intelNetwork: Math.round(sign * magnitude * 2), factories: sign < 0 ? -1 : 0 };
  if (mission.domain === 'personnel') return { politicalPower: Math.round(sign * magnitude * 2), stability: Math.round(sign * magnitude) };
  if (mission.domain === 'diplomacy') return { politicalPower: Math.round(sign * magnitude * 2), warSupport: Math.round(sign * magnitude) };
  return { stability: Math.round(sign * magnitude), politicalPower: Math.round(sign * magnitude * 2) };
}

export function createClandestineCareerState(input: ClandestineRecruitmentInput): ClandestineCareerState {
  const seed = `${input.homeNationId}:${input.handlerNationId}:${input.role.id}:${input.week}`;
  const initialState: ClandestineCareerState = {
    homeNationId: input.homeNationId,
    handlerNationId: input.handlerNationId,
    handlerAlias: choose(handlerAliases, seed),
    coverName: choose(coverNamesByBranch[input.role.branch], seed, 2),
    status: 'probation',
    posture: 'protect-cover',
    recruitedWeek: input.week,
    lastProcessedWeek: input.week,
    nextMissionWeek: input.week,
    handlerTrust: clamp(input.handlerTrust ?? 46),
    homeTrust: 62,
    coverStrength: clamp(input.coverStrength ?? 72),
    accessLevel: clamp(input.role.authority),
    pressure: 24,
    stress: 18,
    extractionReadiness: 32,
    operationalFunds: input.weeklyRetainer,
    totalEarnings: input.weeklyRetainer,
    completedMissions: 0,
    genuineLeaks: 0,
    deceptionReports: 0,
    controlledByHome: false,
    missions: [],
    messages: [],
    incident: null,
  };
  const firstMission = createMission(initialState, input.role, input.week);
  return pushMessage(
    {
      ...initialState,
      missions: [firstMission],
      nextMissionWeek: firstMission.deadlineWeek + 1,
    },
    {
      week: input.week,
      sender: 'handler',
      title: `${initialState.handlerAlias}의 첫 검증 임무`,
      detail: `비밀 소속은 아직 검증 단계입니다. “${firstMission.codename}”에 대한 대응이 이후 보호·보상·요구 수준을 결정합니다.`,
      tone: 'neutral',
    },
  );
}

export function normalizeClandestineCareerState(value: unknown): ClandestineCareerState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ClandestineCareerState>;
  if (!candidate.homeNationId || !candidate.handlerNationId || typeof candidate.recruitedWeek !== 'number') return null;
  return {
    homeNationId: candidate.homeNationId,
    handlerNationId: candidate.handlerNationId,
    handlerAlias: candidate.handlerAlias ?? '신원 미상 연락관',
    coverName: candidate.coverName ?? '비공식 연락고문',
    status: candidate.status ?? 'probation',
    posture: candidate.posture ?? 'protect-cover',
    recruitedWeek: candidate.recruitedWeek,
    lastProcessedWeek: candidate.lastProcessedWeek ?? candidate.recruitedWeek,
    nextMissionWeek: candidate.nextMissionWeek ?? candidate.recruitedWeek + 3,
    handlerTrust: clamp(candidate.handlerTrust ?? 45),
    homeTrust: clamp(candidate.homeTrust ?? 60),
    coverStrength: clamp(candidate.coverStrength ?? 70),
    accessLevel: clamp(candidate.accessLevel ?? 50),
    pressure: clamp(candidate.pressure ?? 25),
    stress: clamp(candidate.stress ?? 20),
    extractionReadiness: clamp(candidate.extractionReadiness ?? 30),
    operationalFunds: Math.max(0, candidate.operationalFunds ?? 0),
    totalEarnings: Math.max(0, candidate.totalEarnings ?? 0),
    completedMissions: Math.max(0, candidate.completedMissions ?? 0),
    genuineLeaks: Math.max(0, candidate.genuineLeaks ?? 0),
    deceptionReports: Math.max(0, candidate.deceptionReports ?? 0),
    controlledByHome: Boolean(candidate.controlledByHome),
    missions: Array.isArray(candidate.missions) ? candidate.missions : [],
    messages: Array.isArray(candidate.messages) ? candidate.messages : [],
    incident: candidate.incident ?? null,
  };
}

export function setClandestinePosture(
  state: ClandestineCareerState,
  posture: ClandestinePosture,
): ClandestineCareerState {
  if (state.status === 'closed' || state.posture === posture) return state;
  return {
    ...state,
    posture,
    controlledByHome: posture === 'controlled-deception' ? true : state.controlledByHome,
    status: posture === 'controlled-deception'
      ? 'controlled-double'
      : posture === 'prepare-exit'
        ? 'exfiltration'
        : state.status === 'exfiltration'
          ? 'active'
          : state.status,
  };
}

export function respondToClandestineMission(
  state: ClandestineCareerState,
  missionId: string,
  response: ClandestineMissionResponse,
  context: ClandestineWeekContext,
): ClandestineResolution | null {
  const mission = state.missions.find((entry) => entry.id === missionId);
  if (!mission || mission.status !== 'offered' || state.incident) return null;
  const duration = response === 'comply-full' ? 1 : response === 'refuse' ? 0 : 2;
  if (response === 'refuse') {
    const refusedMission: ClandestineMission = {
      ...mission,
      response,
      status: 'refused',
      resultTitle: '요구 거부',
      resultDetail: '이번 정보 피해는 막았지만 상대 기관은 사용자의 가치와 충성도를 재평가합니다.',
    };
    const refusedState = pushMessage({
      ...state,
      missions: state.missions.map((entry) => entry.id === missionId ? refusedMission : entry),
      handlerTrust: clamp(state.handlerTrust - 13),
      coverStrength: clamp(state.coverStrength + 2),
      pressure: clamp(state.pressure + 15),
      stress: clamp(state.stress + 7),
      nextMissionWeek: context.week + 2,
    }, {
      week: context.week,
      sender: 'handler',
      title: '요구 거부 접수',
      detail: '핸들러는 즉시 관계를 끊지 않았지만 다음 접촉에서 더 강한 충성도 검증을 예고했습니다.',
      tone: 'bad',
    });
    return {
      state: refusedState,
      exposureDelta: -2,
      gameDelta: {},
      careerDelta: { reputation: 0, councilTrust: 1, legacy: 0 },
      title: `비밀 임무 거부 — ${mission.codename}`,
      detail: refusedMission.resultDetail ?? '임무 요구를 거부했습니다.',
      tone: 'neutral',
      missionId,
    };
  }
  const controlled = response === 'controlled-double';
  const handlerTrustDelta = response === 'comply-full' ? 8 : response === 'comply-selective' ? 3 : controlled ? -1 : 0;
  const homeTrustDelta = response === 'comply-full' ? -8 : response === 'comply-selective' ? -3 : controlled ? 12 : 4;
  const exposureDelta = response === 'comply-full' ? 9 : response === 'comply-selective' ? 5 : controlled ? 4 : 7;
  const activeMission: ClandestineMission = {
    ...mission,
    response,
    status: 'in-progress',
    resolutionWeek: context.week + duration,
  };
  const nextState = pushMessage({
    ...state,
    missions: state.missions.map((entry) => entry.id === missionId ? activeMission : entry),
    status: controlled ? 'controlled-double' : state.status === 'probation' ? 'active' : state.status,
    controlledByHome: controlled ? true : state.controlledByHome,
    posture: controlled ? 'controlled-deception' : state.posture,
    handlerTrust: clamp(state.handlerTrust + handlerTrustDelta),
    homeTrust: clamp(state.homeTrust + homeTrustDelta),
    pressure: clamp(state.pressure + (response === 'comply-full' ? -4 : 2)),
    stress: clamp(state.stress + (controlled ? 8 : 5)),
  }, {
    week: context.week,
    sender: controlled ? 'home-counterintelligence' : 'handler',
    title: controlled ? '통제 이중공작 승인 대기' : `${mission.codename} 수행안 접수`,
    detail: controlled
      ? '본국 방첩기관이 상대의 요구를 분석하고, 실제 피해를 제한하면서 연락선의 신뢰를 유지할 정보 조합을 준비합니다.'
      : `${clandestineResponseLabels[response].title} 방식으로 임무를 시작했습니다. 제 ${context.week + duration + 1}주에 결과를 검증합니다.`,
    tone: controlled ? 'good' : 'neutral',
  });
  return {
    state: nextState,
    exposureDelta,
    gameDelta: controlled ? { intelNetwork: 3, politicalPower: -2 } : {},
    careerDelta: {
      reputation: 0,
      councilTrust: controlled ? 6 : response === 'comply-full' ? -4 : -1,
      legacy: controlled ? 1 : 0,
    },
    title: `${mission.codename} — ${clandestineResponseLabels[response].title}`,
    detail: `${duration}주 동안 접근권·정보 진위·상대 검증 가능성을 계산합니다. 선택은 취소할 수 없으며 결과가 양측 신뢰와 방첩 노출에 남습니다.`,
    tone: controlled ? 'good' : 'neutral',
    missionId,
  };
}

function resolveMission(
  state: ClandestineCareerState,
  mission: ClandestineMission,
  context: ClandestineWeekContext,
): ClandestineResolution {
  const response = mission.response ?? 'comply-selective';
  const postureBonus = state.posture === 'protect-cover' ? 8
    : state.posture === 'earn-handler-trust' ? 5
      : state.posture === 'controlled-deception' && (response === 'disinform' || response === 'controlled-double') ? 13
        : state.posture === 'prepare-exit' ? -5
          : 0;
  const accessGap = state.accessLevel - mission.accessRequired;
  const strategyBonus = response === 'comply-full' ? 14
    : response === 'comply-selective' ? 6
      : response === 'controlled-double' ? context.intelNetwork * 0.14
        : context.intelNetwork * 0.08;
  const chance = clamp(
    42
      + accessGap * 0.38
      + state.coverStrength * 0.2
      + state.handlerTrust * 0.14
      + strategyBonus
      + postureBonus
      - mission.difficulty * 0.34
      - context.exposure * 0.12
      - state.stress * 0.08,
    8,
    94,
  );
  const roll = hashText(`${mission.id}:${context.week}:${response}:${state.posture}`) % 100;
  const success = roll < chance;
  const isDeception = response === 'disinform' || response === 'controlled-double';
  const resultTitle = success
    ? isDeception ? '기만 보고가 신뢰망에 진입' : '핸들러 검증 통과'
    : isDeception ? '정보 일관성에 의문 발생' : '접근·신뢰성 검증 실패';
  const resultDetail = success
    ? isDeception
      ? `상대는 가공된 보고를 잠정 채택했습니다. 본국은 상대의 반응을 통해 정보망과 전략 판단을 역추적합니다. 성공 추정 ${Math.round(chance)}%.`
      : `상대가 보고의 가치와 접근권을 인정했습니다. 핸들러 신뢰와 보상은 늘지만 본국 피해와 다음 요구 수준도 상승합니다. 성공 추정 ${Math.round(chance)}%.`
    : isDeception
      ? `상대 분석관이 보고의 모순을 발견했습니다. 즉시 정체가 드러나지는 않았지만 재검증과 추가 자료 요구가 뒤따릅니다. 성공 추정 ${Math.round(chance)}%.`
      : `요구한 수준의 정보에 접근하지 못했거나 내용이 검증을 통과하지 못했습니다. 핸들러는 충성도와 실제 보직 권한을 의심합니다. 성공 추정 ${Math.round(chance)}%.`;
  const resolvedMission: ClandestineMission = {
    ...mission,
    status: success ? 'resolved' : 'failed',
    resultTitle,
    resultDetail,
  };
  const handlerTrustDelta = success
    ? response === 'comply-full' ? 11 : response === 'comply-selective' ? 5 : 7
    : -14;
  const homeTrustDelta = success
    ? response === 'comply-full' ? -10 : response === 'comply-selective' ? -3 : 8
    : isDeception ? -2 : 0;
  const coverDelta = success
    ? response === 'comply-full' ? -6 : response === 'comply-selective' ? -2 : 3
    : -11;
  const exposureDelta = success
    ? response === 'comply-full' ? 7 : response === 'comply-selective' ? 3 : 2
    : 9;
  const reward = success ? mission.reward : Math.round(mission.reward * 0.2);
  const nextState = pushMessage({
    ...state,
    status: success && state.status === 'probation' ? 'active' : state.status,
    missions: state.missions.map((entry) => entry.id === mission.id ? resolvedMission : entry),
    handlerTrust: clamp(state.handlerTrust + handlerTrustDelta),
    homeTrust: clamp(state.homeTrust + homeTrustDelta),
    coverStrength: clamp(state.coverStrength + coverDelta),
    pressure: clamp(state.pressure + (success ? -5 : 13)),
    stress: clamp(state.stress + (success ? 3 : 10)),
    extractionReadiness: clamp(state.extractionReadiness + (state.posture === 'prepare-exit' ? 12 : success ? 3 : 1)),
    operationalFunds: state.operationalFunds + reward,
    totalEarnings: state.totalEarnings + reward,
    completedMissions: state.completedMissions + (success ? 1 : 0),
    genuineLeaks: state.genuineLeaks + (success && response === 'comply-full' ? 1 : 0),
    deceptionReports: state.deceptionReports + (success && isDeception ? 1 : 0),
    nextMissionWeek: context.week + Math.max(2, 5 - Math.floor(state.handlerTrust / 35)),
  }, {
    week: context.week,
    sender: isDeception && state.controlledByHome ? 'home-counterintelligence' : 'handler',
    title: `${mission.codename} 결과 — ${resultTitle}`,
    detail: resultDetail,
    tone: success ? 'good' : 'bad',
  });
  return {
    state: nextState,
    exposureDelta,
    gameDelta: missionGameDelta(mission, response, success),
    careerDelta: {
      reputation: success && isDeception ? 1 : 0,
      councilTrust: homeTrustDelta,
      legacy: success ? 1 : 0,
    },
    title: `비밀 임무 결과 — ${mission.codename}`,
    detail: resultDetail,
    tone: success ? 'good' : 'bad',
    missionId: mission.id,
  };
}

export function respondToClandestineIncident(
  state: ClandestineCareerState,
  response: ClandestineIncidentResponse,
  context: ClandestineWeekContext,
): ClandestineResolution | null {
  const incident = state.incident;
  if (!incident) return null;
  let exposureDelta = 0;
  let gameDelta: Partial<Record<keyof GameState, number>> = {};
  let careerDelta = { reputation: 0, councilTrust: 0, legacy: 0 };
  let nextStatus: ClandestineStatus = state.status === 'under-investigation' ? 'active' : state.status;
  let handlerTrust = state.handlerTrust;
  let homeTrust = state.homeTrust;
  let coverStrength = state.coverStrength;
  let pressure = state.pressure;
  let extractionReadiness = state.extractionReadiness;
  let controlledByHome = state.controlledByHome;
  let posture = state.posture;
  let tone: ClandestineResolution['tone'] = 'neutral';
  const completesExtraction = response === 'request-extraction'
    && state.status === 'exfiltration'
    && state.extractionReadiness >= 72;

  if (response === 'lay-low') {
    exposureDelta = -12;
    handlerTrust -= 8;
    coverStrength += 9;
    pressure += 7;
    gameDelta = { politicalPower: -2 };
  } else if (response === 'cooperate-home') {
    exposureDelta = -18;
    homeTrust += 18;
    handlerTrust -= 5;
    coverStrength += 5;
    controlledByHome = true;
    posture = 'controlled-deception';
    nextStatus = 'controlled-double';
    gameDelta = { intelNetwork: 8, politicalPower: -4 };
    careerDelta = { reputation: -2, councilTrust: 12, legacy: 2 };
    tone = 'good';
  } else if (response === 'misdirect-investigation') {
    exposureDelta = -5;
    homeTrust -= 8;
    coverStrength += 2;
    pressure += 4;
    gameDelta = { politicalPower: -8, stability: -1 };
    careerDelta = { reputation: -1, councilTrust: -5, legacy: 0 };
  } else if (response === 'request-extraction') {
    exposureDelta = 8;
    handlerTrust += 6;
    homeTrust -= 14;
    extractionReadiness = completesExtraction ? 100 : extractionReadiness + 28;
    nextStatus = completesExtraction ? 'closed' : 'exfiltration';
    posture = 'prepare-exit';
    gameDelta = { politicalPower: -4, stability: -2 };
    careerDelta = { reputation: -3, councilTrust: -12, legacy: 1 };
  } else {
    exposureDelta = -8;
    handlerTrust -= 24;
    pressure = Math.max(0, pressure - 10);
    nextStatus = 'closed';
    gameDelta = { politicalPower: -2 };
    careerDelta = { reputation: 0, councilTrust: 4, legacy: 0 };
  }

  const nextState = pushMessage({
    ...state,
    incident: null,
    status: nextStatus,
    posture,
    controlledByHome,
    handlerTrust: clamp(handlerTrust),
    homeTrust: clamp(homeTrust),
    coverStrength: clamp(coverStrength),
    pressure: clamp(pressure),
    stress: clamp(state.stress + (response === 'lay-low' ? -6 : response === 'cut-ties' ? -10 : 5)),
    extractionReadiness: clamp(extractionReadiness),
    nextMissionWeek: context.week + (response === 'lay-low' ? 4 : response === 'cut-ties' ? 52 : 2),
  }, {
    week: context.week,
    sender: response === 'cooperate-home' ? 'home-counterintelligence' : 'system',
    title: `${incident.title} 대응 완료`,
    detail: clandestineIncidentResponseLabels[response].detail,
    tone,
  });
  return {
    state: nextState,
    exposureDelta,
    gameDelta,
    careerDelta,
    title: `비밀 신분 위기 대응 — ${clandestineIncidentResponseLabels[response].title}`,
    detail: completesExtraction
      ? `${incident.title}의 최종 보호 조건을 수락했습니다. 현재 보직을 떠나 ${state.handlerNationId} 소속의 새 경력으로 같은 세계선을 이어갑니다.`
      : `${incident.title}에 대응했습니다. 즉시 노출 변화 ${exposureDelta >= 0 ? '+' : ''}${exposureDelta}, 핸들러 신뢰 ${Math.round(state.handlerTrust)}→${Math.round(nextState.handlerTrust)}, 본국 신뢰 ${Math.round(state.homeTrust)}→${Math.round(nextState.homeTrust)}.`,
    tone,
    transferNationId: completesExtraction ? state.handlerNationId : undefined,
  };
}

export function advanceClandestineCareerWeek(
  state: ClandestineCareerState,
  context: ClandestineWeekContext,
): ClandestineWeekResult {
  if (context.week <= state.lastProcessedWeek || state.status === 'closed') {
    return {
      state,
      exposureDelta: 0,
      gameDelta: {},
      careerDelta: { reputation: 0, councilTrust: 0, legacy: 0 },
      notices: [],
      newMissionId: null,
      incidentOpened: false,
      needsAttention: false,
    };
  }
  let nextState: ClandestineCareerState = {
    ...state,
    lastProcessedWeek: context.week,
    accessLevel: clamp(state.accessLevel + (context.role.authority - state.accessLevel) * 0.2),
    coverStrength: clamp(state.coverStrength + (state.posture === 'protect-cover' ? 1.5 : -0.2)),
    pressure: clamp(state.pressure + (state.posture === 'earn-handler-trust' ? -1 : state.posture === 'prepare-exit' ? 2 : 0.4)),
    stress: clamp(state.stress + (state.incident ? 4 : state.posture === 'protect-cover' ? -1 : 0.8)),
    extractionReadiness: clamp(state.extractionReadiness + (state.posture === 'prepare-exit' ? 4 : 0.3)),
    operationalFunds: state.operationalFunds + (state.status === 'exfiltration' ? 0 : Math.max(1, Math.round(3 + state.handlerTrust / 18))),
    totalEarnings: state.totalEarnings + (state.status === 'exfiltration' ? 0 : Math.max(1, Math.round(3 + state.handlerTrust / 18))),
  };
  let exposureDelta = state.status === 'exfiltration' ? 1.5 : state.posture === 'protect-cover' ? -0.6 : 0.7;
  let gameDelta: Partial<Record<keyof GameState, number>> = {};
  let careerDelta = { reputation: 0, councilTrust: 0, legacy: 0 };
  const notices: ClandestineWeekResult['notices'] = [];
  let newMissionId: string | null = null;

  const resolvingMissions = nextState.missions.filter((mission) =>
    mission.status === 'in-progress'
    && mission.resolutionWeek !== null
    && mission.resolutionWeek <= context.week,
  );
  resolvingMissions.forEach((mission) => {
    const resolution = resolveMission(nextState, mission, context);
    nextState = resolution.state;
    exposureDelta += resolution.exposureDelta;
    Object.entries(resolution.gameDelta).forEach(([key, value]) => {
      if (typeof value !== 'number') return;
      const typedKey = key as keyof GameState;
      gameDelta[typedKey] = (gameDelta[typedKey] ?? 0) + value;
    });
    careerDelta = {
      reputation: careerDelta.reputation + resolution.careerDelta.reputation,
      councilTrust: careerDelta.councilTrust + resolution.careerDelta.councilTrust,
      legacy: careerDelta.legacy + resolution.careerDelta.legacy,
    };
    notices.push({ title: resolution.title, detail: resolution.detail, tone: resolution.tone });
  });

  const expiredOffers = nextState.missions.filter((mission) => mission.status === 'offered' && mission.deadlineWeek < context.week);
  if (expiredOffers.length > 0) {
    const expiredIds = new Set(expiredOffers.map((mission) => mission.id));
    nextState = pushMessage({
      ...nextState,
      missions: nextState.missions.map((mission) => expiredIds.has(mission.id)
        ? { ...mission, status: 'failed', resultTitle: '응답 기한 초과', resultDetail: '핸들러가 침묵을 불복종 또는 접근권 부족으로 해석했습니다.' }
        : mission),
      handlerTrust: clamp(nextState.handlerTrust - expiredOffers.length * 10),
      pressure: clamp(nextState.pressure + expiredOffers.length * 12),
      stress: clamp(nextState.stress + expiredOffers.length * 5),
      nextMissionWeek: context.week + 2,
    }, {
      week: context.week,
      sender: 'handler',
      title: '응답 기한 초과',
      detail: `${expiredOffers.length}개 요구가 회신 없이 만료됐습니다. 다음 접촉은 충성도 재검증 성격이 강해집니다.`,
      tone: 'bad',
    });
    exposureDelta += expiredOffers.length * 3;
    notices.push({
      title: '비밀 임무 기한 초과',
      detail: `${expiredOffers.map((mission) => mission.codename).join(' · ')}에 회신하지 않아 핸들러 신뢰와 위장 안정성이 하락했습니다.`,
      tone: 'bad',
    });
  }

  const hasOpenMission = nextState.missions.some((mission) => mission.status === 'offered' || mission.status === 'in-progress');
  if (
    !hasOpenMission
    && !nextState.incident
    && context.week >= nextState.nextMissionWeek
    && nextState.status !== 'exfiltration'
    && nextState.status !== 'compromised'
  ) {
    const mission = createMission(nextState, context.role, context.week);
    nextState = pushMessage({
      ...nextState,
      missions: [mission, ...nextState.missions].slice(0, 50),
      nextMissionWeek: mission.deadlineWeek + 1,
    }, {
      week: context.week,
      sender: 'handler',
      title: `새 요구 — ${mission.codename}`,
      detail: `${mission.title}. 제 ${mission.deadlineWeek + 1}주까지 진짜 정보·선별 제공·가공 정보·본국 통제·거부 가운데 하나를 선택해야 합니다.`,
      tone: 'neutral',
    });
    newMissionId = mission.id;
    notices.push({
      title: `외국 핸들러 새 임무 — ${mission.codename}`,
      detail: `${mission.objective} 대응 기한은 제 ${mission.deadlineWeek + 1}주입니다.`,
      tone: 'neutral',
    });
  }

  const projectedContext = { ...context, exposure: clamp(context.exposure + exposureDelta) };
  const incident = incidentFor(nextState, projectedContext);
  const incidentOpened = Boolean(incident);
  if (incident) {
    nextState = pushMessage({
      ...nextState,
      incident,
      status: incident.kind === 'emergency-extraction'
        ? nextState.status === 'exfiltration' ? 'exfiltration' : 'compromised'
        : 'under-investigation',
    }, {
      week: context.week,
      sender: incident.kind === 'handler-doubt' || incident.kind === 'emergency-extraction' ? 'handler' : 'home-counterintelligence',
      title: incident.title,
      detail: incident.detail,
      tone: 'bad',
    });
    notices.push({ title: `긴급 비밀 신분 위기 — ${incident.title}`, detail: incident.detail, tone: 'bad' });
  }

  return {
    state: nextState,
    exposureDelta,
    gameDelta,
    careerDelta,
    notices,
    newMissionId,
    incidentOpened,
    needsAttention: Boolean(newMissionId || incidentOpened),
  };
}
