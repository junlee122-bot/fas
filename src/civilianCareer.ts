import type {
  CareerBranch,
  CareerRole,
  CivilianCareerActionRecord,
  CivilianCareerStage,
  CivilianCareerState,
  CivilianHistoryForce,
  CivilianOriginId,
  CivilianProfessionId,
  CivilianWorldInfluence,
  GameState,
  NationId,
} from './types';

export interface CivilianProfession {
  id: CivilianProfessionId;
  name: string;
  category: string;
  summary: string;
  historicalBasis: string;
  vocation: string;
  risk: string;
  strengths: [string, string, string];
  branch: CareerBranch;
  primaryForce: CivilianHistoryForce;
  secondaryForce: CivilianHistoryForce;
  entryBranches: CareerBranch[];
  starting: Pick<CivilianCareerState, 'publicReputation' | 'expertise' | 'network' | 'livelihood' | 'independence' | 'scrutiny'>;
  gameDelta: Partial<Record<keyof GameState, number>>;
}

export interface CivilianOrigin {
  id: CivilianOriginId;
  name: string;
  summary: string;
  advantage: string;
  startingDelta: Partial<Pick<CivilianCareerState, 'publicReputation' | 'expertise' | 'network' | 'livelihood' | 'independence' | 'scrutiny'>>;
  force: CivilianHistoryForce;
}

export interface CivilianAction {
  id: string;
  title: string;
  summary: string;
  commitment: string;
  force: CivilianHistoryForce;
  statDelta: Partial<Pick<CivilianCareerState, 'publicReputation' | 'expertise' | 'network' | 'livelihood' | 'independence' | 'scrutiny'>>;
  gameDelta: Partial<Record<keyof GameState, number>>;
  minimumLivelihood: number;
  cooldownWeeks: number;
}

export interface CivilianActionResolution {
  state: CivilianCareerState;
  record: CivilianCareerActionRecord;
  influence: CivilianWorldInfluence;
  gameDelta: Partial<Record<keyof GameState, number>>;
  stageChanged: boolean;
}

export const civilianProfessions: CivilianProfession[] = [
  {
    id: 'intellectual',
    name: '지식인·논객',
    category: '사상·공론',
    summary: '기고·강연·연구회를 통해 전쟁과 독립, 국가의 미래를 둘러싼 언어를 만듭니다.',
    historicalBasis: '전시기 대학인, 망명 지식인, 반식민 사상가와 정책 논객의 실제 활동을 바탕으로 합니다.',
    vocation: '논문·성명·강연·정책 자문',
    risk: '검열, 출판 금지, 사상 탄압',
    strengths: ['공론 형성', '정책 설계', '국제 지식망'],
    branch: 'politics',
    primaryForce: 'civic',
    secondaryForce: 'diplomacy',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 23, expertise: 58, network: 31, livelihood: 43, independence: 66, scrutiny: 19 },
    gameDelta: { politicalPower: 4, stability: 1 },
  },
  {
    id: 'scientist',
    name: '과학자·연구자',
    category: '과학·연구',
    summary: '연구실과 국제 학술망에서 발견을 축적하고 국가 연구계획 또는 독립 연구소의 방향을 정합니다.',
    historicalBasis: '전시 동원 연구, 망명 과학자 네트워크, 기초과학 연구소와 원자력·의학 프로젝트를 바탕으로 합니다.',
    vocation: '기초연구·실험실·과학자 구호',
    risk: '군사 전용, 기밀화, 연구윤리 갈등',
    strengths: ['연구 돌파', '인재망', '장기 기술'],
    branch: 'politics',
    primaryForce: 'industry',
    secondaryForce: 'civic',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 14, expertise: 69, network: 27, livelihood: 49, independence: 58, scrutiny: 22 },
    gameDelta: { factories: 1, steel: 4 },
  },
  {
    id: 'engineer',
    name: '기술자·발명가',
    category: '기술·생산',
    summary: '철도·통신·기계·항공 기술을 현장 문제에 적용하고 민수와 군수 사이의 경계를 선택합니다.',
    historicalBasis: '전시 생산기술자, 기반시설 기사, 항공·통신 발명가와 식민지 기술관료의 기록을 바탕으로 합니다.',
    vocation: '설계·시제품·기반시설 복구',
    risk: '강제 동원, 특허 탈취, 파괴공작',
    strengths: ['현장 해결', '생산 혁신', '기술 조직'],
    branch: 'politics',
    primaryForce: 'industry',
    secondaryForce: 'military',
    entryBranches: ['politics', 'military'],
    starting: { publicReputation: 16, expertise: 64, network: 25, livelihood: 54, independence: 52, scrutiny: 20 },
    gameDelta: { factories: 1, fuel: 3, steel: 5 },
  },
  {
    id: 'physician',
    name: '의사·보건가',
    category: '의료·보건',
    summary: '병원과 피난민 진료소를 운영하며 전염병, 전상자, 공공보건 정책 사이에서 우선순위를 정합니다.',
    historicalBasis: '전시 군의관, 적십자 의료진, 지역 의사, 공중보건 운동가의 실제 사례를 바탕으로 합니다.',
    vocation: '진료·방역·의료 구호',
    risk: '의약품 부족, 점령군 간섭, 환자 선별',
    strengths: ['생명 보호', '지역 신뢰', '보건 제도'],
    branch: 'politics',
    primaryForce: 'civic',
    secondaryForce: 'diplomacy',
    entryBranches: ['politics', 'military'],
    starting: { publicReputation: 27, expertise: 62, network: 34, livelihood: 46, independence: 57, scrutiny: 14 },
    gameDelta: { manpower: 18, stability: 2 },
  },
  {
    id: 'journalist',
    name: '기자·편집인',
    category: '언론·정보',
    summary: '검열선 안팎에서 사실을 수집하고, 선전·폭로·국제 보도 중 무엇을 세상에 내보낼지 결정합니다.',
    historicalBasis: '종군기자, 지하신문 편집인, 통신사 특파원, 라디오 방송인의 실제 활동을 바탕으로 합니다.',
    vocation: '취재·편집·방송·지하신문',
    risk: '검열, 정보원 노출, 허위정보',
    strengths: ['정보 접근', '대중 영향', '폭로'],
    branch: 'intelligence',
    primaryForce: 'intelligence',
    secondaryForce: 'civic',
    entryBranches: ['intelligence', 'politics'],
    starting: { publicReputation: 31, expertise: 48, network: 46, livelihood: 39, independence: 64, scrutiny: 31 },
    gameDelta: { intelNetwork: 7, politicalPower: 2 },
  },
  {
    id: 'jurist',
    name: '법률가·인권변호사',
    category: '법·제도',
    summary: '재판, 청원, 헌정 초안과 정치범 변론을 통해 국가 권력의 경계와 시민의 권리를 설계합니다.',
    historicalBasis: '전시 법률가, 반식민 변호사, 헌법 기초자, 전범재판 실무자의 기록을 바탕으로 합니다.',
    vocation: '변론·청원·헌정 설계',
    risk: '자격 박탈, 정치재판, 권력과의 타협',
    strengths: ['제도 설계', '협상', '권리 보호'],
    branch: 'politics',
    primaryForce: 'civic',
    secondaryForce: 'liberation',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 25, expertise: 61, network: 38, livelihood: 51, independence: 61, scrutiny: 20 },
    gameDelta: { politicalPower: 5, stability: 2 },
  },
  {
    id: 'educator',
    name: '교사·교육운동가',
    category: '교육·지역사회',
    summary: '학교와 야학, 언어교육, 청년조직을 통해 전쟁 이후를 살아갈 세대와 공동체를 만듭니다.',
    historicalBasis: '식민지·점령지의 민족학교, 야학, 난민학교와 전시 교육개혁 사례를 바탕으로 합니다.',
    vocation: '학교·야학·교재·청년조직',
    risk: '학교 폐쇄, 언어 탄압, 학생 동원',
    strengths: ['세대 육성', '지역망', '문화 보존'],
    branch: 'politics',
    primaryForce: 'liberation',
    secondaryForce: 'civic',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 24, expertise: 55, network: 41, livelihood: 35, independence: 63, scrutiny: 21 },
    gameDelta: { manpower: 12, stability: 2, politicalPower: 2 },
  },
  {
    id: 'entrepreneur',
    name: '상공인·기업가',
    category: '기업·금융',
    summary: '기업, 운송망, 금융과 암시장을 오가며 자본을 어디에 투자하고 누구와 거래할지 결정합니다.',
    historicalBasis: '전시 기업가, 교포 상인망, 산업가, 협동조합과 군수계약자의 사례를 바탕으로 합니다.',
    vocation: '투자·조달·무역·산업 네트워크',
    risk: '전시 통제, 부역 논란, 자산 몰수',
    strengths: ['자본 조달', '물류망', '고용'],
    branch: 'politics',
    primaryForce: 'industry',
    secondaryForce: 'diplomacy',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 19, expertise: 50, network: 49, livelihood: 72, independence: 50, scrutiny: 24 },
    gameDelta: { treasury: 36, factories: 1, politicalPower: 2 },
  },
  {
    id: 'labor-organizer',
    name: '노동운동가·협동조합가',
    category: '노동·대중조직',
    summary: '공장·항만·광산의 노동자를 조직해 임금, 생산, 파업, 저항과 사회계약의 방향을 정합니다.',
    historicalBasis: '전시 노동조합, 항만노조, 지하 파업조직과 협동조합 운동의 실제 사례를 바탕으로 합니다.',
    vocation: '조합·협동조합·파업·상호부조',
    risk: '해고, 탄압, 조직 분열',
    strengths: ['대중 동원', '현장 정보', '사회개혁'],
    branch: 'politics',
    primaryForce: 'civic',
    secondaryForce: 'liberation',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 28, expertise: 43, network: 56, livelihood: 30, independence: 67, scrutiny: 34 },
    gameDelta: { manpower: 25, warSupport: 2, stability: -1 },
  },
  {
    id: 'artist',
    name: '작가·예술가',
    category: '문화·기억',
    summary: '문학, 미술, 영화, 음악으로 전쟁과 점령의 기억을 기록하고 새로운 국가의 상징을 만듭니다.',
    historicalBasis: '전시 예술가, 망명 작가, 선전영화 제작자, 민족문화 보존운동의 사례를 바탕으로 합니다.',
    vocation: '창작·공연·기록·문화운동',
    risk: '검열, 선전 동원, 작품 압수',
    strengths: ['상징 형성', '대중 감정', '문화 외교'],
    branch: 'politics',
    primaryForce: 'liberation',
    secondaryForce: 'civic',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 33, expertise: 52, network: 35, livelihood: 29, independence: 74, scrutiny: 23 },
    gameDelta: { stability: 3, warSupport: 2 },
  },
  {
    id: 'humanitarian',
    name: '구호활동가·사회사업가',
    category: '구호·국제협력',
    summary: '난민, 포로, 고아와 전재민을 돕는 구호망을 만들고 국경을 넘는 협력을 조직합니다.',
    historicalBasis: '적십자, 난민구호위원회, 종교·민간 구호망과 전후 국제기구 창설자의 사례를 바탕으로 합니다.',
    vocation: '난민구호·포로교환·국제원조',
    risk: '중립성 논란, 구호품 탈취, 국경 봉쇄',
    strengths: ['국제 신뢰', '구호망', '협상'],
    branch: 'politics',
    primaryForce: 'diplomacy',
    secondaryForce: 'civic',
    entryBranches: ['politics', 'intelligence'],
    starting: { publicReputation: 29, expertise: 47, network: 50, livelihood: 37, independence: 65, scrutiny: 15 },
    gameDelta: { stability: 3, manpower: 14, politicalPower: 3 },
  },
  {
    id: 'clergy',
    name: '종교인·공동체 지도자',
    category: '종교·공동체',
    summary: '사원·교회·성당과 지역 신앙망에서 피난처, 비밀 연락, 화해와 저항의 경계를 선택합니다.',
    historicalBasis: '점령지 성직자, 종교계 독립운동, 피난처 제공과 전후 화해운동의 실제 사례를 바탕으로 합니다.',
    vocation: '피난처·상담·공동체 조직',
    risk: '보복, 종교 갈등, 권위주의 결탁',
    strengths: ['지역 신뢰', '비밀 보호', '화해'],
    branch: 'intelligence',
    primaryForce: 'civic',
    secondaryForce: 'liberation',
    entryBranches: ['intelligence', 'politics'],
    starting: { publicReputation: 30, expertise: 45, network: 48, livelihood: 38, independence: 60, scrutiny: 17 },
    gameDelta: { stability: 4, intelNetwork: 3 },
  },
];

export const civilianOrigins: CivilianOrigin[] = [
  {
    id: 'university-network',
    name: '대학·연구회 출신',
    summary: '전문 지식과 동료 집단은 강하지만 대중 기반과 생계는 아직 불안정합니다.',
    advantage: '전문성 +10 · 인맥 +5',
    startingDelta: { expertise: 10, network: 5, livelihood: -4, scrutiny: 2 },
    force: 'industry',
  },
  {
    id: 'working-community',
    name: '지역·노동 공동체 출신',
    summary: '생활 현장의 신뢰와 조직망을 갖고 시작하지만 엘리트 제도권 접근은 더 어렵습니다.',
    advantage: '평판 +7 · 인맥 +9 · 생계 -6',
    startingDelta: { publicReputation: 7, network: 9, livelihood: -6, independence: 4 },
    force: 'civic',
  },
  {
    id: 'exile-diaspora',
    name: '망명·디아스포라 출신',
    summary: '국경을 넘는 연락망과 자유로운 시야를 갖지만 본국의 감시와 정체성 갈등을 안고 갑니다.',
    advantage: '인맥 +12 · 독립성 +7 · 감시 +6',
    startingDelta: { network: 12, independence: 7, scrutiny: 6, livelihood: -3 },
    force: 'diplomacy',
  },
  {
    id: 'established-family',
    name: '유력 가문·전문직 집안',
    summary: '자본과 소개망이 넓지만 특권층이라는 시선과 가문의 이해관계가 선택을 제약합니다.',
    advantage: '생계 +13 · 인맥 +8 · 독립성 -8',
    startingDelta: { livelihood: 13, network: 8, independence: -8, publicReputation: 3, scrutiny: 3 },
    force: 'industry',
  },
];

export const civilianActions: CivilianAction[] = [
  {
    id: 'publish-public-work',
    title: '논문·기고·작품 발표',
    summary: '전문 지식과 시대 인식을 공개해 공론을 움직입니다.',
    commitment: '생계 4 · 공개 노출 증가',
    force: 'civic',
    statDelta: { publicReputation: 8, expertise: 5, livelihood: -4, scrutiny: 4 },
    gameDelta: { politicalPower: 2, stability: 1 },
    minimumLivelihood: 5,
    cooldownWeeks: 5,
  },
  {
    id: 'build-professional-circle',
    title: '연구회·협회 조직',
    summary: '동료와 후원자를 묶어 독립적인 전문 조직을 만듭니다.',
    commitment: '생계 6 · 조직 감시 증가',
    force: 'industry',
    statDelta: { network: 10, expertise: 3, livelihood: -6, independence: 2, scrutiny: 3 },
    gameDelta: { factories: 1, politicalPower: 1 },
    minimumLivelihood: 7,
    cooldownWeeks: 8,
  },
  {
    id: 'serve-local-community',
    title: '지역사회 현장 활동',
    summary: '진료, 교육, 법률지원, 구호 또는 기술 봉사로 생활 현장의 신뢰를 얻습니다.',
    commitment: '생계 5 · 장기 현장 투입',
    force: 'civic',
    statDelta: { publicReputation: 6, network: 7, expertise: 2, livelihood: -5, scrutiny: -1 },
    gameDelta: { stability: 2, manpower: 8 },
    minimumLivelihood: 6,
    cooldownWeeks: 6,
  },
  {
    id: 'secure-independent-funding',
    title: '후원·사업 기반 확보',
    summary: '후원자, 구독자, 협동조합 또는 사업 수입으로 활동의 재정을 마련합니다.',
    commitment: '평판보다 생계와 지속성 우선',
    force: 'industry',
    statDelta: { livelihood: 14, network: 4, independence: -2, scrutiny: 1 },
    gameDelta: { treasury: 18 },
    minimumLivelihood: 0,
    cooldownWeeks: 9,
  },
  {
    id: 'join-underground-network',
    title: '지하 연락망 참여',
    summary: '검열과 점령을 피해 정보, 사람, 문서를 옮기는 비밀망에 들어갑니다.',
    commitment: '감시 +10 · 발각 위험',
    force: 'intelligence',
    statDelta: { network: 8, independence: 5, scrutiny: 10, livelihood: -3 },
    gameDelta: { intelNetwork: 7, stability: -1 },
    minimumLivelihood: 3,
    cooldownWeeks: 10,
  },
  {
    id: 'launch-public-campaign',
    title: '대중 캠페인 전개',
    summary: '청원, 모금, 집회, 방송을 연결해 하나의 쟁점을 전국적 의제로 만듭니다.',
    commitment: '생계 8 · 감시 +7',
    force: 'liberation',
    statDelta: { publicReputation: 12, network: 8, livelihood: -8, scrutiny: 7, independence: 3 },
    gameDelta: { politicalPower: 5, warSupport: 2, stability: -1 },
    minimumLivelihood: 9,
    cooldownWeeks: 13,
  },
];

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function getCivilianProfession(id: CivilianProfessionId) {
  return civilianProfessions.find((profession) => profession.id === id) ?? civilianProfessions[0];
}

export function getCivilianOrigin(id: CivilianOriginId) {
  return civilianOrigins.find((origin) => origin.id === id) ?? civilianOrigins[0];
}

export function getCivilianRoleId(nationId: NationId, professionId: CivilianProfessionId) {
  return `civilian-${nationId}-${professionId}`;
}

export function getCivilianSyntheticRole(roleId: string, nationId: NationId): CareerRole | null {
  const prefix = `civilian-${nationId}-`;
  if (!roleId.startsWith(prefix)) return null;
  const professionId = roleId.slice(prefix.length) as CivilianProfessionId;
  const profession = civilianProfessions.find((candidate) => candidate.id === professionId);
  if (!profession) return null;
  return {
    id: roleId,
    nationId,
    title: profession.name,
    branch: profession.branch,
    tier: 5,
    archetype: profession.branch === 'intelligence' ? 'agent' : 'organizer',
    scope: '민간 생활권·전문 공동체',
    authority: 12,
    expectation: '공식 권한 없이 전문성·평판·인맥을 쌓아 사회와 국가의 선택지를 바꿉니다.',
    historicalHolderId: 'civilian-self',
    historicalHolderName: '대체 인물 없음',
    historicalOffice: '공식 보직 없음',
    historicalBasis: profession.historicalBasis,
    coverIdentity: profession.vocation,
    replacementEffect: '실존 인물을 밀어내지 않습니다. 사용자의 활동이 기존 인물과 조직의 진로를 바꿉니다.',
  };
}

export function createCivilianCareerState(professionId: CivilianProfessionId, originId: CivilianOriginId): CivilianCareerState {
  const profession = getCivilianProfession(professionId);
  const origin = getCivilianOrigin(originId);
  const withOrigin = <K extends keyof CivilianOrigin['startingDelta']>(key: K) => clamp(profession.starting[key] + (origin.startingDelta[key] ?? 0));
  return {
    professionId,
    originId,
    stage: 'private-citizen',
    publicReputation: withOrigin('publicReputation'),
    expertise: withOrigin('expertise'),
    network: withOrigin('network'),
    livelihood: withOrigin('livelihood'),
    independence: withOrigin('independence'),
    scrutiny: withOrigin('scrutiny'),
    weeksActive: 0,
    actionHistory: [],
    worldInfluences: [
      {
        id: `civilian-profession:${profession.id}`,
        label: `${profession.name}의 시선`,
        detail: `${profession.vocation}을 통해 공식 지휘계통 밖에서 역사에 개입합니다.`,
        force: profession.primaryForce,
        strength: 12,
      },
      {
        id: `civilian-origin:${origin.id}`,
        label: origin.name,
        detail: origin.summary,
        force: origin.force,
        strength: 7,
      },
    ],
    enteredOfficeRoleId: null,
  };
}

export function getCivilianStage(state: CivilianCareerState): CivilianCareerStage {
  if (state.enteredOfficeRoleId) return 'institutional-insider';
  const score = state.publicReputation + state.expertise + state.network - Math.max(0, state.scrutiny - 60);
  if (score >= 225 && state.actionHistory.length >= 6) return 'national-figure';
  if (score >= 178 && state.actionHistory.length >= 4) return 'movement-leader';
  if (score >= 132 && state.actionHistory.length >= 2) return 'public-voice';
  return 'private-citizen';
}

export function getCivilianStageLabel(stage: CivilianCareerStage) {
  return ({
    'private-citizen': '무명의 시민',
    'public-voice': '공적 발언자',
    'movement-leader': '운동·전문조직 지도자',
    'national-figure': '전국적 인물',
    'institutional-insider': '제도권 진입',
  } satisfies Record<CivilianCareerStage, string>)[stage];
}

export function getCivilianActionAvailability(state: CivilianCareerState, action: CivilianAction, week: number) {
  if (state.enteredOfficeRoleId) return { available: false, reason: '이미 제도권 보직에 진입했습니다.' };
  if (state.livelihood < action.minimumLivelihood) return { available: false, reason: `생계 ${action.minimumLivelihood} 이상이 필요합니다.` };
  const previous = [...state.actionHistory].reverse().find((record) => record.id === action.id);
  const remaining = previous ? action.cooldownWeeks - (week - previous.week) : 0;
  if (remaining > 0) return { available: false, reason: `${remaining}주 뒤 다시 실행할 수 있습니다.` };
  return { available: true, reason: '이번 주 실행 가능' };
}

export function resolveCivilianAction(state: CivilianCareerState, actionId: string, week: number): CivilianActionResolution | null {
  const action = civilianActions.find((candidate) => candidate.id === actionId);
  if (!action || !getCivilianActionAvailability(state, action, week).available) return null;
  const profession = getCivilianProfession(state.professionId);
  const outcome = `${action.title}을 통해 ${profession.name}의 활동이 공적 기록과 사회 관계망에 남았습니다.`;
  const record: CivilianCareerActionRecord = { id: action.id, week, title: action.title, outcome };
  const influence: CivilianWorldInfluence = {
    id: `civilian-action:${action.id}:${week}`,
    label: action.title,
    detail: `${action.summary} 이 선택은 이후 인물·조직·사건의 등장 조건에 누적됩니다.`,
    force: action.force === 'civic' ? profession.primaryForce : action.force,
    strength: action.id === 'launch-public-campaign' ? 10 : 7,
  };
  const next: CivilianCareerState = {
    ...state,
    publicReputation: clamp(state.publicReputation + (action.statDelta.publicReputation ?? 0)),
    expertise: clamp(state.expertise + (action.statDelta.expertise ?? 0)),
    network: clamp(state.network + (action.statDelta.network ?? 0)),
    livelihood: clamp(state.livelihood + (action.statDelta.livelihood ?? 0)),
    independence: clamp(state.independence + (action.statDelta.independence ?? 0)),
    scrutiny: clamp(state.scrutiny + (action.statDelta.scrutiny ?? 0)),
    actionHistory: [...state.actionHistory, record].slice(-80),
    worldInfluences: [...state.worldInfluences, influence].slice(-40),
  };
  const nextStage = getCivilianStage(next);
  return {
    state: { ...next, stage: nextStage },
    record,
    influence,
    gameDelta: action.gameDelta,
    stageChanged: nextStage !== state.stage,
  };
}

export function advanceCivilianCareerWeek(state: CivilianCareerState): CivilianCareerState {
  if (state.enteredOfficeRoleId) return { ...state, weeksActive: state.weeksActive + 1 };
  const livelihoodRecovery = state.weeksActive % 4 === 3 ? 2 : 0;
  const scrutinyRecovery = state.actionHistory.length === 0 || state.weeksActive % 6 === 5 ? 1 : 0;
  const next = {
    ...state,
    weeksActive: state.weeksActive + 1,
    livelihood: clamp(state.livelihood + livelihoodRecovery),
    scrutiny: clamp(state.scrutiny - scrutinyRecovery),
  };
  return { ...next, stage: getCivilianStage(next) };
}

export function getCivilianInstitutionReadiness(state: CivilianCareerState) {
  const profession = getCivilianProfession(state.professionId);
  const score = Math.round(state.publicReputation * .34 + state.expertise * .28 + state.network * .38 - Math.max(0, state.scrutiny - 68) * .45);
  const requirements = [
    { label: '공적 평판 42', met: state.publicReputation >= 42 },
    { label: '전문성 52', met: state.expertise >= 52 },
    { label: '인맥 45', met: state.network >= 45 },
    { label: '주요 활동 3회', met: state.actionHistory.length >= 3 },
  ];
  return {
    score,
    ready: requirements.every((requirement) => requirement.met),
    requirements,
    branches: profession.entryBranches,
  };
}

export function enterCivilianInstitution(state: CivilianCareerState, roleId: string): CivilianCareerState {
  return {
    ...state,
    stage: 'institutional-insider',
    enteredOfficeRoleId: roleId,
    scrutiny: clamp(state.scrutiny + 4),
    worldInfluences: [
      ...state.worldInfluences,
      {
        id: `civilian-entry:${roleId}`,
        label: '시민에서 제도권으로',
        detail: '민간에서 쌓은 전문성과 관계망을 지닌 채 공식 보직에 진입했습니다.',
        force: getCivilianProfession(state.professionId).primaryForce,
        strength: 11,
      },
    ].slice(-40),
  };
}

export function getCivilianCareerSignature(state: CivilianCareerState) {
  return [
    state.professionId,
    state.originId,
    state.stage,
    state.actionHistory.map((record) => `${record.id}@${record.week}`).join(',') || 'no-actions',
    state.enteredOfficeRoleId ?? 'outside-institutions',
  ].join(':');
}

export const CIVILIAN_POSSIBILITY_BASE = civilianProfessions.length * civilianOrigins.length * 3 * civilianActions.length;
