import type {
  CareerRole,
  CareerState,
  Commander,
  CovertOperation,
  DiplomaticRelation,
  Division,
  NationId,
  NationProfile,
  ProductionLine,
  TheaterId,
} from './types';

export const nations: NationProfile[] = [
  {
    id: 'britain', name: '영국', shortName: '영국', code: 'GB', alignment: 'allies', color: '#54758a', accent: '#91b5c8', defaultTheater: 'europe', capitalTerritoryId: 'britain', strategicTargets: ['channel', 'france'],
    summary: '제국의 자원과 연합 외교를 묶어 두 전구를 동시에 지휘합니다.', challenge: '해상 보급, 식민지 자치, 미국과의 주도권 경쟁', majorOperation: '라운드테이블 작전', majorOperationDetail: '유럽 상륙과 아시아 방어를 하나의 연합 지휘체계로 통합합니다.',
    formations: ['왕립 기갑원정군', '제1 제국야전군', '연합 공수사단'], equipment: ['크롬웰 전차', '스핏파이어 Mk.IX', '리-엔필드 & 지원화기', '대서양 수송선'],
    modifiers: { navalPower: 67, intelNetwork: 72, politicalPower: 96 },
    paths: [
      { id: 'commonwealth-federation', title: '코먼웰스 연방', summary: '식민지에 동등한 전시 의결권을 부여해 자발적 연합을 만듭니다.', effect: '안정도 +8 · 인력 +180K', tone: 'reform' },
      { id: 'imperial-arsenal', title: '제국 병기창', summary: '제국 전역의 산업과 수송망을 런던 지휘 아래 집중합니다.', effect: '군수 공장 +5 · 정치력 -12', tone: 'hardline' },
    ],
  },
  {
    id: 'usa', name: '미합중국', shortName: '미국', code: 'US', alignment: 'allies', color: '#526f91', accent: '#95b6db', defaultTheater: 'asia', capitalTerritoryId: 'hawaii', strategicTargets: ['philippines', 'solomons'],
    summary: '거대한 산업력을 어느 전구에 먼저 투입할지 결정합니다.', challenge: '양양전쟁, 의회 지지, 동맹국과의 전략 우선순위', majorOperation: '태평양 교차로', majorOperationDetail: '중부 태평양의 기지를 연결해 일본 본토로 향하는 새로운 진격로를 엽니다.',
    formations: ['제1 태평양 기갑군', '미 제1 원정군', '해병 원정사단'], equipment: ['M4 셔먼', 'F6F 헬캣', 'M1 개런드 & 지원화기', '리버티 수송선'],
    modifiers: { factories: 38, treasury: 1280, manpower: 1560, navalPower: 64 },
    paths: [
      { id: 'arsenal-democracies', title: '민주주의 병기창', summary: '원조를 조건 없이 확대해 전후 다자 질서의 기반을 만듭니다.', effect: '동맹 관계 +12 · 재정 -180M', tone: 'international' },
      { id: 'pacific-first', title: '태평양 우선', summary: '유럽보다 아시아 해방과 해양 패권에 국력을 집중합니다.', effect: '해상 통제 +12 · 공중 우세 +8', tone: 'hardline' },
    ],
  },
  {
    id: 'ussr', name: '소비에트 연방', shortName: '소련', code: 'SU', alignment: 'allies', color: '#8b544f', accent: '#ce8a78', defaultTheater: 'europe', capitalTerritoryId: 'moscow', strategicTargets: ['ukraine', 'poland'],
    summary: '막대한 희생 속에서 전선과 국가 체제의 미래를 함께 결정합니다.', challenge: '전선 붕괴 위험, 장교단 신뢰, 서방 원조 의존', majorOperation: '심층 전환 공세', majorOperationDetail: '기갑·철도·예비대를 결합해 적의 전선 전체를 연쇄 붕괴시킵니다.',
    formations: ['제3 근위기갑군', '제1 충격군', '극동 소총군단'], equipment: ['T-34/76', 'Yak-9', 'PPSh-41 & 지원화기', '철도 보급단'],
    modifiers: { manpower: 1880, factories: 34, stability: 68, warSupport: 93 },
    paths: [
      { id: 'officers-compact', title: '장교단 협약', summary: '현장 지휘관에게 작전 자율성을 보장하고 숙청의 시대를 끝냅니다.', effect: '지휘 점수 +18 · 안정도 +5', tone: 'reform' },
      { id: 'permanent-mobilization', title: '영구 총동원', summary: '모든 산업과 행정을 전선의 요구에 종속시킵니다.', effect: '인력 +260K · 전쟁 지지도 -6', tone: 'hardline' },
    ],
  },
  {
    id: 'germany', name: '독일국', shortName: '독일', code: 'DE', alignment: 'axis', color: '#6c6d68', accent: '#b7b2a7', defaultTheater: 'europe', capitalTerritoryId: 'germany', strategicTargets: ['moscow', 'britain'],
    summary: '다중 전선의 과잉 팽창을 수습하거나 전쟁 체제 자체를 바꿉니다.', challenge: '연료 부족, 권력기관 경쟁, 동서 양면전선', majorOperation: '대륙 재편 계획', majorOperationDetail: '전선 축소, 협상, 집중 공세 중 하나로 유럽의 세력 균형을 다시 설계합니다.',
    formations: ['제1 기갑집단', '중부 집단군', '공수엽병 군단'], equipment: ['판터 시제전차', 'Fw 190', '차세대 돌격소총', '유럽 군수열차'],
    modifiers: { factories: 36, steel: 146, fuel: 58, stability: 66 },
    paths: [
      { id: 'generals-directorate', title: '장군단 국가관리', summary: '당 조직을 배제하고 전문 관료와 군부가 국가를 인수합니다.', effect: '지휘 점수 +16 · 안정도 -5', tone: 'reform' },
      { id: 'fortress-europe', title: '유럽 요새화', summary: '팽창을 멈추고 점령지를 경제·방위 공동체로 재조직합니다.', effect: '보급 +12 · 적 압력 -8', tone: 'hardline' },
    ],
  },
  {
    id: 'japan', name: '일본 제국', shortName: '일본', code: 'JP', alignment: 'axis', color: '#8b5c58', accent: '#d69a87', defaultTheater: 'asia', capitalTerritoryId: 'japan_home', strategicTargets: ['midway', 'india'],
    summary: '육군과 해군의 경쟁을 통제하며 아시아 질서의 성격을 결정합니다.', challenge: '석유 고갈, 함대 손실, 점령지 저항과 군부 파벌', majorOperation: '팔방 해양계획', majorOperationDetail: '인도양과 중부 태평양 중 한 축에 함대와 항공대를 집중합니다.',
    formations: ['제1 기동집단', '남방군', '해군육전 연합사단'], equipment: ['3식 중전차 계획', 'A6M 영식함전', '99식 소총 & 지원화기', '남방자원 수송선'],
    modifiers: { navalPower: 75, airPower: 68, fuel: 52, warSupport: 91 },
    paths: [
      { id: 'asian-conference', title: '아시아 자치회의', summary: '점령 행정을 해체하고 지역 정부들과 조건부 동맹을 맺습니다.', effect: '안정도 +7 · 정보망 +10', tone: 'reform' },
      { id: 'decisive-battle', title: '결전국가', summary: '모든 자원과 함대를 단 한 번의 해상 결전에 걸도록 재편합니다.', effect: '해상 통제 +16 · 연료 -18K', tone: 'hardline' },
    ],
  },
  {
    id: 'china', name: '중화민국', shortName: '중국', code: 'CN', alignment: 'allies', color: '#55746d', accent: '#8fbaad', defaultTheater: 'asia', capitalTerritoryId: 'china_interior', strategicTargets: ['central_china', 'manchuria'],
    summary: '분열된 군벌·정파를 묶어 침략에 저항하고 새로운 국가를 설계합니다.', challenge: '군벌 자치, 열악한 산업, 내전 재발 위험', majorOperation: '국민통합 공세', majorOperationDetail: '정규군과 유격대, 지역군을 공동 지휘체계 아래 결합합니다.',
    formations: ['국민혁명군 기계화군', '제5 전구군', '적후 유격군단'], equipment: ['국산 기갑차량', 'P-40 전투비행단', '한양식 소총 & 지원화기', '버마로드 수송대'],
    modifiers: { manpower: 2140, factories: 20, stability: 54, warSupport: 95 },
    paths: [
      { id: 'united-republic', title: '연합공화국', summary: '군벌과 경쟁 정파를 지방정부로 인정하는 연방 헌정을 제안합니다.', effect: '안정도 +12 · 정치력 -10', tone: 'reform' },
      { id: 'national-reconstruction', title: '국가재건위원회', summary: '전시 관료와 군이 산업·토지·징병을 중앙에서 직접 관리합니다.', effect: '군수 공장 +4 · 인력 +160K', tone: 'hardline' },
    ],
  },
  {
    id: 'india', name: '영국령 인도', shortName: '인도', code: 'IN', alignment: 'allies', color: '#8a704f', accent: '#c8a56c', defaultTheater: 'asia', capitalTerritoryId: 'india', strategicTargets: ['burma', 'malaya'],
    summary: '제국의 전쟁과 독립 요구 사이에서 인도군과 행정의 충성을 선택합니다.', challenge: '독립운동, 벵골 식량위기, 버마 국경 방어', majorOperation: '동방 관문 작전', majorOperationDetail: '인도군을 독자 지휘부로 승격해 버마와 말라야를 탈환합니다.',
    formations: ['인도 제1 기갑군단', '동부군', '친디트 장거리군단'], equipment: ['밸런타인 전차', '허리케인 Mk.II', '리-엔필드 인도형', '인도양 수송선'],
    modifiers: { manpower: 1760, factories: 24, politicalPower: 68, stability: 52 },
    paths: [
      { id: 'dominion-now', title: '즉시 자치령', summary: '참전을 조건으로 전시 내각과 독립 후 헌법제정을 요구합니다.', effect: '전쟁 지지도 +10 · 정치력 +18', tone: 'reform' },
      { id: 'indian-national-army', title: '독립 국민군', summary: '제국 지휘에서 이탈해 독자적인 아시아 해방 전선을 선포합니다.', effect: '인력 +220K · 동맹 관계 재편', tone: 'hardline' },
    ],
  },
  {
    id: 'freefrance', name: '자유 프랑스', shortName: '자유 프랑스', code: 'FR', alignment: 'allies', color: '#5a6f8f', accent: '#91a9d0', defaultTheater: 'europe', capitalTerritoryId: 'levant', strategicTargets: ['france', 'algeria'],
    summary: '망명 조직에서 출발해 프랑스의 해방과 전후 정통성을 쟁취합니다.', challenge: '제한된 병력, 식민지 충성, 동맹국의 불신', majorOperation: '공화국 귀환', majorOperationDetail: '레지스탕스 봉기와 원정군 상륙을 동기화해 프랑스 본토에 임시정부를 세웁니다.',
    formations: ['자유프랑스 기갑사단', '제1 원정군단', '레지스탕스 통합군'], equipment: ['M4A2 셔먼', '자유프랑스 전투비행단', 'MAS-36 & 지원화기', '지중해 수송선'],
    modifiers: { politicalPower: 62, manpower: 760, intelNetwork: 78, stability: 72 },
    paths: [
      { id: 'fourth-republic', title: '새 공화국 헌장', summary: '해방 이전에 여성 참정권과 식민지 대표권을 포함한 헌장을 공표합니다.', effect: '안정도 +10 · 동맹 관계 +8', tone: 'reform' },
      { id: 'french-union', title: '프랑스 연합', summary: '식민지를 자치 회원국으로 바꾸고 공동 방위체계를 수립합니다.', effect: '인력 +120K · 정치력 +10', tone: 'international' },
    ],
  },
  {
    id: 'italy', name: '이탈리아 왕국', shortName: '이탈리아', code: 'IT', alignment: 'axis', color: '#65775f', accent: '#9cb58f', defaultTheater: 'europe', capitalTerritoryId: 'italy', strategicTargets: ['egypt', 'malta'],
    summary: '흔들리는 체제와 지중해 전선을 수습하고 독일 의존에서 벗어납니다.', challenge: '군수 부족, 왕실과 당의 대립, 해군 연료 고갈', majorOperation: '독립 지중해 전략', majorOperationDetail: '독일의 부속 전선이 아닌 이탈리아 중심의 외교·해군 전략을 수립합니다.',
    formations: ['아리에테 기갑군단', '지중해 집단군', '산마르코 해병군단'], equipment: ['P26/40 계획', 'C.205 벨트로', '카르카노 & 지원화기', '지중해 수송선'],
    modifiers: { factories: 26, navalPower: 61, fuel: 49, stability: 58 },
    paths: [
      { id: 'royal-coup', title: '왕실 비상정부', summary: '군과 왕실이 당 지도부를 축출하고 조건부 휴전을 모색합니다.', effect: '안정도 +9 · 추축 관계 -18', tone: 'reform' },
      { id: 'mediterranean-league', title: '지중해 연맹', summary: '발칸·튀르키예·북아프리카와 독자적인 지역권을 구축합니다.', effect: '해상 통제 +10 · 정치력 +14', tone: 'international' },
    ],
  },
];

const roleCatalog: Record<NationId, [string, string, string]> = {
  britain: ['제국 전쟁내각 조정관', '동부제국 전구사령관', '특수작전국 지역국장'],
  usa: ['합동전략위원회 의장', '태평양 원정군 사령관', '전략정보국 지역책임자'],
  ussr: ['국가방위위원회 작전위원', '전선군 사령관', '극동 정보총국장'],
  germany: ['국가전쟁지도부 총감', '기갑집단 사령관', '해외정보국 전구책임자'],
  japan: ['대본영 전략참의', '연합함대 전구참모', '남방 연락기관장'],
  china: ['국민정부 군사위원', '국민혁명군 전구사령관', '적후공작국 지역책임자'],
  india: ['총독부 국방집행위원', '인도 동부군 사령관', '독립연락국 책임자'],
  freefrance: ['임시정부 국방위원', '자유프랑스 원정군단장', '레지스탕스 연락국장'],
  italy: ['최고국방위원회 위원', '지중해 집단군 사령관', '군사정보국 전구책임자'],
};

export const careerRoles: CareerRole[] = nations.flatMap((nation) => {
  const titles = roleCatalog[nation.id];
  return [
    { id: nation.id + '-tier1', nationId: nation.id, title: titles[0], branch: 'politics', tier: 1, scope: '국가 전체', authority: 92, expectation: '국가 진로와 전쟁 목표를 직접 결정합니다.' },
    { id: nation.id + '-tier2', nationId: nation.id, title: titles[1], branch: 'military', tier: 2, scope: nation.defaultTheater === 'asia' ? '아시아·태평양 전구' : '유럽·지중해 전구', authority: 72, expectation: '전구 성과로 중앙 지도부의 신뢰와 승진을 쟁취합니다.' },
    { id: nation.id + '-tier3', nationId: nation.id, title: titles[2], branch: 'intelligence', tier: 3, scope: '지역 조직', authority: 48, expectation: '제한된 권한과 정보망으로 역사의 흐름을 바꿉니다.' },
  ];
});

const startingPositions: Record<NationId, [string, string, string]> = {
  britain: ['britain', 'egypt', 'malta'], usa: ['hawaii', 'midway', 'coral_sea'], ussr: ['moscow', 'caucasus', 'soviet_far_east'],
  germany: ['germany', 'poland', 'ukraine'], japan: ['japan_home', 'manchuria', 'malaya'], china: ['china_interior', 'south_china', 'yunnan'],
  india: ['india', 'assam', 'ceylon'], freefrance: ['levant', 'britain', 'malta'], italy: ['italy', 'sicily', 'libya'],
};

export function getNation(id: NationId) {
  return nations.find((nation) => nation.id === id) ?? nations[0];
}

export function getRole(id: string, nationId: NationId) {
  return careerRoles.find((role) => role.id === id) ?? careerRoles.find((role) => role.nationId === nationId && role.tier === 2) ?? careerRoles[0];
}

export function createCareerState(nationId: NationId, roleId: string): CareerState {
  const role = getRole(roleId, nationId);
  return {
    nationId,
    roleId: role.id,
    reputation: role.tier === 1 ? 68 : role.tier === 2 ? 44 : 26,
    councilTrust: role.tier === 1 ? 74 : role.tier === 2 ? 61 : 48,
    experience: role.tier === 1 ? 76 : role.tier === 2 ? 42 : 18,
    legacy: 0,
    alternatePathId: null,
  };
}

export function createCareerCommanders(nation: NationProfile, role: CareerRole): Commander[] {
  const base = role.tier === 1 ? 86 : role.tier === 2 ? 76 : 67;
  return [
    { id: 'player', name: '나 · ' + role.title, rank: 'TIER ' + role.tier + ' 임명직', initials: nation.code, color: nation.color, command: base + 5, attack: base, defense: base + 2, logistics: base + 1, trait: '대체역사의 주인공', specialty: role.scope, fatigue: 8, loyalty: 100 },
    { id: 'staff-alpha', name: nation.shortName + ' 작전참모단', rank: '선임 참모진', initials: 'A1', color: '#69766f', command: 75, attack: 78, defense: 72, logistics: 76, trait: '전구 실무', specialty: '공세 계획 · 조정', fatigue: 24, loyalty: 82 },
    { id: 'staff-beta', name: nation.shortName + ' 군수참모단', rank: '전구 참모진', initials: 'L2', color: '#786f5d', command: 71, attack: 66, defense: 77, logistics: 89, trait: '보급 우선', specialty: '군수 · 회복', fatigue: 17, loyalty: 86 },
  ];
}

export function createCampaignDivisions(nation: NationProfile): Division[] {
  const positions = startingPositions[nation.id];
  return nation.formations.map((name, index) => ({
    id: nation.id + '-formation-' + (index + 1),
    name,
    type: index === 0 ? 'armor' : index === 2 ? (nation.defaultTheater === 'asia' ? 'marine' : 'airborne') : 'infantry',
    strength: 88 - index * 4,
    organization: 84 - index * 3,
    experience: 62 - index * 6,
    supply: 80 - index * 4,
    territoryId: positions[index],
    commanderId: index === 0 ? 'player' : index === 1 ? 'staff-alpha' : 'staff-beta',
    status: 'ready',
  }));
}

export function createCampaignProduction(nation: NationProfile): ProductionLine[] {
  const [tank, aircraft, infantry, convoy] = nation.equipment;
  return [
    { id: 'sherman', name: tank, category: '기갑 장비', assigned: 8, efficiency: 72, output: 116, icon: '▰' },
    { id: 'spitfire', name: aircraft, category: '전투 항공기', assigned: 9, efficiency: 78, output: 198, icon: '✦' },
    { id: 'rifle', name: infantry, category: '보병 장비', assigned: 7, efficiency: 84, output: 6480, icon: '╂' },
    { id: 'convoy', name: convoy, category: '전구 수송', assigned: 5, efficiency: 64, output: 12, icon: '≋' },
  ];
}

export function createDiplomaticRelations(nationId: NationId): DiplomaticRelation[] {
  const playerNation = getNation(nationId);
  return nations.filter((nation) => nation.id !== nationId).map((nation) => {
    const sameAlignment = nation.alignment === playerNation.alignment;
    return {
      id: nation.id,
      name: nation.name,
      code: nation.code,
      value: sameAlignment ? 64 + ((nation.code.charCodeAt(0) + nation.code.charCodeAt(1)) % 22) : 18 + (nation.code.charCodeAt(0) % 17),
      status: sameAlignment ? '공동 교전국' : '적대 교전국',
      color: nation.color,
    };
  });
}

export function createCovertOperations(theater: TheaterId): CovertOperation[] {
  if (theater === 'asia') {
    return [
      { id: 'burma-rail', name: '버마 철도망 침투', region: '버마·아삼', risk: 38, progress: 61, active: true, icon: 'radio' },
      { id: 'south-sea', name: '남중국해 기만 계획', region: '남중국해', risk: 47, progress: 36, active: true, icon: 'eye' },
      { id: 'island-watch', name: '도서 감시망 구축', region: '솔로몬 제도', risk: 24, progress: 79, active: true, icon: 'crosshair' },
    ];
  }
  return [
    { id: 'resistance', name: '점령지 저항조직 지원', region: '서유럽', risk: 28, progress: 72, active: true, icon: 'radio' },
    { id: 'mincemeat', name: '지중해 기만 작전', region: '지중해', risk: 46, progress: 34, active: true, icon: 'eye' },
    { id: 'deep-recon', name: '적 후방 장거리 정찰', region: '주요 전선', risk: 18, progress: 88, active: true, icon: 'crosshair' },
  ];
}
