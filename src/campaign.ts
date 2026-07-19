import type {
  CareerRole,
  CareerState,
  CareerTier,
  Commander,
  CovertOperation,
  DiplomaticRelation,
  Division,
  NationId,
  NationProfile,
  ProductionLine,
  StaffCandidate,
  StaffMember,
  TheaterId,
} from './types';
import { getHistoricalRoleHolder, historicalPersonnel, historicalSupplementalPersonnel } from './historicalPersonnel';
import { getRecruitableHistoricalExperts, getStartingHistoricalExperts } from './historicalExperts';
import { getNationHistoricalEquipment } from './equipment';

export const nations: NationProfile[] = [
  {
    id: 'britain', name: '영국', shortName: '영국', code: 'GB', alignment: 'allies', color: '#54758a', accent: '#91b5c8', defaultTheater: 'europe', status: 'sovereign', historicalBasis: '1942년 처칠 전시내각과 제국·영연방 연합 지휘체계', capitalTerritoryId: 'britain', strategicTargets: ['channel', 'france'],
    summary: '제국의 자원과 연합 외교를 묶어 두 전구를 동시에 지휘합니다.', challenge: '해상 보급, 식민지 자치, 미국과의 주도권 경쟁', majorOperation: '라운드테이블 작전', majorOperationDetail: '유럽 상륙과 아시아 방어를 하나의 연합 지휘체계로 통합합니다.',
    formations: ['왕립 기갑원정군', '제1 제국야전군', '연합 공수사단'], equipment: ['Churchill Mk III', 'Spitfire Mk V', 'Lee-Enfield No.4 · Bren', 'Bedford QL · Tribal급'],
    modifiers: { navalPower: 67, intelNetwork: 72, politicalPower: 96 },
    paths: [
      { id: 'commonwealth-federation', title: '코먼웰스 연방', summary: '식민지에 동등한 전시 의결권을 부여해 자발적 연합을 만듭니다.', effect: '안정도 +8 · 인력 +180K', tone: 'reform' },
      { id: 'imperial-arsenal', title: '제국 병기창', summary: '제국 전역의 산업과 수송망을 런던 지휘 아래 집중합니다.', effect: '군수 공장 +5 · 정치력 -12', tone: 'hardline' },
    ],
  },
  {
    id: 'usa', name: '미합중국', shortName: '미국', code: 'US', alignment: 'allies', color: '#526f91', accent: '#95b6db', defaultTheater: 'asia', status: 'sovereign', historicalBasis: '1942년 루스벨트 행정부, 합동참모체계와 태평양 전구', capitalTerritoryId: 'hawaii', strategicTargets: ['philippines', 'solomons'],
    summary: '거대한 산업력을 어느 전구에 먼저 투입할지 결정합니다.', challenge: '양양전쟁, 의회 지지, 동맹국과의 전략 우선순위', majorOperation: '태평양 교차로', majorOperationDetail: '중부 태평양의 기지를 연결해 일본 본토로 향하는 새로운 진격로를 엽니다.',
    formations: ['제1 태평양 기갑군', '미 제1 원정군', '해병 원정사단'], equipment: ['M4 Sherman 75 mm', 'Curtiss P-40E', 'M1 Garand · BAR', 'GMC CCKW · Fletcher급'],
    modifiers: { factories: 38, treasury: 1280, manpower: 1560, navalPower: 64 },
    paths: [
      { id: 'arsenal-democracies', title: '민주주의 병기창', summary: '원조를 조건 없이 확대해 전후 다자 질서의 기반을 만듭니다.', effect: '동맹 관계 +12 · 재정 -180M', tone: 'international' },
      { id: 'pacific-first', title: '태평양 우선', summary: '유럽보다 아시아 해방과 해양 패권에 국력을 집중합니다.', effect: '해상 통제 +12 · 공중 우세 +8', tone: 'hardline' },
    ],
  },
  {
    id: 'ussr', name: '소비에트 연방', shortName: '소련', code: 'SU', alignment: 'allies', color: '#8b544f', accent: '#ce8a78', defaultTheater: 'europe', status: 'sovereign', historicalBasis: '1942년 국가방위위원회와 붉은군 최고사령부', capitalTerritoryId: 'moscow', strategicTargets: ['ukraine', 'poland'],
    summary: '막대한 희생 속에서 전선과 국가 체제의 미래를 함께 결정합니다.', challenge: '전선 붕괴 위험, 장교단 신뢰, 서방 원조 의존', majorOperation: '심층 전환 공세', majorOperationDetail: '기갑·철도·예비대를 결합해 적의 전선 전체를 연쇄 붕괴시킵니다.',
    formations: ['제3 근위기갑군', '제1 충격군', '극동 소총군단'], equipment: ['T-34/76 Model 1942', 'Ilyushin Il-2', 'Mosin-Nagant · PPSh-41', 'ZiS-5 · Gnevny급'],
    modifiers: { manpower: 1880, factories: 34, stability: 68, warSupport: 93 },
    paths: [
      { id: 'officers-compact', title: '장교단 협약', summary: '현장 지휘관에게 작전 자율성을 보장하고 숙청의 시대를 끝냅니다.', effect: '지휘 점수 +18 · 안정도 +5', tone: 'reform' },
      { id: 'permanent-mobilization', title: '영구 총동원', summary: '모든 산업과 행정을 전선의 요구에 종속시킵니다.', effect: '인력 +260K · 전쟁 지지도 -6', tone: 'hardline' },
    ],
  },
  {
    id: 'germany', name: '독일국', shortName: '독일', code: 'DE', alignment: 'axis', color: '#6c6d68', accent: '#b7b2a7', defaultTheater: 'europe', status: 'sovereign', historicalBasis: '1942년 독재정권의 국방군 최고지휘부와 경쟁 권력기관', capitalTerritoryId: 'germany', strategicTargets: ['moscow', 'britain'],
    summary: '다중 전선의 과잉 팽창을 수습하거나 전쟁 체제 자체를 바꿉니다.', challenge: '연료 부족, 권력기관 경쟁, 동서 양면전선', majorOperation: '대륙 재편 계획', majorOperationDetail: '전선 축소, 협상, 집중 공세 중 하나로 유럽의 세력 균형을 다시 설계합니다.',
    formations: ['제1 기갑집단', '중부 집단군', '공수엽병 군단'], equipment: ['Panzer IV F2/G', 'Fw 190 A', 'Kar98k · MG 42', 'Opel Blitz · Type VII C'],
    modifiers: { factories: 36, steel: 146, fuel: 58, stability: 66 },
    paths: [
      { id: 'generals-directorate', title: '장군단 국가관리', summary: '당 조직을 배제하고 전문 관료와 군부가 국가를 인수합니다.', effect: '지휘 점수 +16 · 안정도 -5', tone: 'reform' },
      { id: 'fortress-europe', title: '유럽 요새화', summary: '팽창을 멈추고 점령지를 경제·방위 공동체로 재조직합니다.', effect: '보급 +12 · 적 압력 -8', tone: 'hardline' },
    ],
  },
  {
    id: 'japan', name: '일본 제국', shortName: '일본', code: 'JP', alignment: 'axis', color: '#8b5c58', accent: '#d69a87', defaultTheater: 'asia', status: 'sovereign', historicalBasis: '1942년 대본영과 육·해군의 병립 지휘체계', capitalTerritoryId: 'japan_home', strategicTargets: ['midway', 'india'],
    summary: '육군과 해군의 경쟁을 통제하며 아시아 질서의 성격을 결정합니다.', challenge: '석유 고갈, 함대 손실, 점령지 저항과 군부 파벌', majorOperation: '팔방 해양계획', majorOperationDetail: '인도양과 중부 태평양 중 한 축에 함대와 항공대를 집중합니다.',
    formations: ['제1 기동집단', '남방군', '해군육전 연합사단'], equipment: ['신포탑 치하', 'Mitsubishi A6M2', '99식 소총 · 96식 경기관총', '94식 트럭 · Shōkaku급'],
    modifiers: { navalPower: 75, airPower: 68, fuel: 52, warSupport: 91 },
    paths: [
      { id: 'asian-conference', title: '아시아 자치회의', summary: '점령 행정을 해체하고 지역 정부들과 조건부 동맹을 맺습니다.', effect: '안정도 +7 · 정보망 +10', tone: 'reform' },
      { id: 'decisive-battle', title: '결전국가', summary: '모든 자원과 함대를 단 한 번의 해상 결전에 걸도록 재편합니다.', effect: '해상 통제 +16 · 연료 -18K', tone: 'hardline' },
    ],
  },
  {
    id: 'china', name: '중화민국', shortName: '중국', code: 'CN', alignment: 'allies', color: '#55746d', accent: '#8fbaad', defaultTheater: 'asia', status: 'sovereign', historicalBasis: '1942년 충칭 국민정부와 국민혁명군·연합전선', capitalTerritoryId: 'china_interior', strategicTargets: ['central_china', 'manchuria'],
    summary: '분열된 군벌·정파를 묶어 침략에 저항하고 새로운 국가를 설계합니다.', challenge: '군벌 자치, 열악한 산업, 내전 재발 위험', majorOperation: '국민통합 공세', majorOperationDetail: '정규군과 유격대, 지역군을 공동 지휘체계 아래 결합합니다.',
    formations: ['국민혁명군 기계화군', '제5 전구군', '적후 유격군단'], equipment: ['T-26 잔존 전차대', 'P-40 중국 항공대', '24식 중정 · ZB vz.26', '버마 공로 혼성 수송대'],
    modifiers: { manpower: 2140, factories: 20, stability: 54, warSupport: 95 },
    paths: [
      { id: 'united-republic', title: '연합공화국', summary: '군벌과 경쟁 정파를 지방정부로 인정하는 연방 헌정을 제안합니다.', effect: '안정도 +12 · 정치력 -10', tone: 'reform' },
      { id: 'national-reconstruction', title: '국가재건위원회', summary: '전시 관료와 군이 산업·토지·징병을 중앙에서 직접 관리합니다.', effect: '군수 공장 +4 · 인력 +160K', tone: 'hardline' },
    ],
  },
  {
    id: 'india', name: '영국령 인도', shortName: '인도', code: 'IN', alignment: 'allies', color: '#8a704f', accent: '#c8a56c', defaultTheater: 'asia', status: 'colonized', historicalBasis: '1942년 영국령 인도 행정부·인도군과 독립운동의 병존', capitalTerritoryId: 'india', strategicTargets: ['burma', 'malaya'],
    summary: '제국의 전쟁과 독립 요구 사이에서 인도군과 행정의 충성을 선택합니다.', challenge: '독립운동, 벵골 식량위기, 버마 국경 방어', majorOperation: '동방 관문 작전', majorOperationDetail: '인도군을 독자 지휘부로 승격해 버마와 말라야를 탈환합니다.',
    formations: ['인도 제1 기갑군단', '동부군', '친디트 장거리군단'], equipment: ['M3 Stuart', 'Hurricane Mk II', 'SMLE · Bren', 'CMP truck · HMIS Jumna급'],
    modifiers: { manpower: 1760, factories: 24, politicalPower: 68, stability: 52 },
    paths: [
      { id: 'dominion-now', title: '즉시 자치령', summary: '참전을 조건으로 전시 내각과 독립 후 헌법제정을 요구합니다.', effect: '전쟁 지지도 +10 · 정치력 +18', tone: 'reform' },
      { id: 'indian-national-army', title: '독립 국민군', summary: '제국 지휘에서 이탈해 독자적인 아시아 해방 전선을 선포합니다.', effect: '인력 +220K · 동맹 관계 재편', tone: 'hardline' },
    ],
  },
  {
    id: 'freefrance', name: '자유 프랑스', shortName: '자유 프랑스', code: 'FR', alignment: 'allies', color: '#5a6f8f', accent: '#91a9d0', defaultTheater: 'europe', status: 'government-in-exile', historicalBasis: '1942년 자유프랑스 국가위원회와 BCRA·본토 레지스탕스', capitalTerritoryId: 'levant', strategicTargets: ['france', 'algeria'],
    summary: '망명 조직에서 출발해 프랑스의 해방과 전후 정통성을 쟁취합니다.', challenge: '제한된 병력, 식민지 충성, 동맹국의 불신', majorOperation: '공화국 귀환', majorOperationDetail: '레지스탕스 봉기와 원정군 상륙을 동기화해 프랑스 본토에 임시정부를 세웁니다.',
    formations: ['자유프랑스 기갑사단', '제1 원정군단', '레지스탕스 통합군'], equipment: ['M3 Stuart', 'Hurricane 자유프랑스 비행대', 'MAS-36 · FM 24/29', '연합군 혼성 트럭 · Le Triomphant'],
    modifiers: { politicalPower: 62, manpower: 760, intelNetwork: 78, stability: 72 },
    paths: [
      { id: 'fourth-republic', title: '새 공화국 헌장', summary: '해방 이전에 여성 참정권과 식민지 대표권을 포함한 헌장을 공표합니다.', effect: '안정도 +10 · 동맹 관계 +8', tone: 'reform' },
      { id: 'french-union', title: '프랑스 연합', summary: '식민지를 자치 회원국으로 바꾸고 공동 방위체계를 수립합니다.', effect: '인력 +120K · 정치력 +10', tone: 'international' },
    ],
  },
  {
    id: 'italy', name: '이탈리아 왕국', shortName: '이탈리아', code: 'IT', alignment: 'axis', color: '#65775f', accent: '#9cb58f', defaultTheater: 'europe', status: 'sovereign', historicalBasis: '1942년 왕국·파시스트 정권·최고사령부의 병존', capitalTerritoryId: 'italy', strategicTargets: ['egypt', 'malta'],
    summary: '흔들리는 체제와 지중해 전선을 수습하고 독일 의존에서 벗어납니다.', challenge: '군수 부족, 왕실과 당의 대립, 해군 연료 고갈', majorOperation: '독립 지중해 전략', majorOperationDetail: '독일의 부속 전선이 아닌 이탈리아 중심의 외교·해군 전략을 수립합니다.',
    formations: ['아리에테 기갑군단', '지중해 집단군', '산마르코 해병군단'], equipment: ['M14/41', 'Macchi C.202', 'Carcano M91 · Breda 30', 'Fiat 626 · Soldati급'],
    modifiers: { factories: 26, navalPower: 61, fuel: 49, stability: 58 },
    paths: [
      { id: 'royal-coup', title: '왕실 비상정부', summary: '군과 왕실이 당 지도부를 축출하고 조건부 휴전을 모색합니다.', effect: '안정도 +9 · 추축 관계 -18', tone: 'reform' },
      { id: 'mediterranean-league', title: '지중해 연맹', summary: '발칸·튀르키예·북아프리카와 독자적인 지역권을 구축합니다.', effect: '해상 통제 +10 · 정치력 +14', tone: 'international' },
    ],
  },
  {
    id: 'korea', name: '대한민국 임시정부·한국광복군', shortName: '한국 독립운동', code: 'KR', alignment: 'allies', color: '#5b728f', accent: '#c08b86', defaultTheater: 'asia', status: 'government-in-exile', historicalBasis: '1919년 수립된 대한민국 임시정부와 1940년 창설된 한국광복군의 충칭 활동', capitalTerritoryId: 'korea', strategicTargets: ['korea', 'manchuria'],
    summary: '충칭의 임시정부, 광복군, 국내외 연락망을 연결해 해방 뒤 국가 형태까지 설계합니다.', challenge: '영토 없는 정부, 연합국 승인, 국내 침투망과 독립운동 정파 통합', majorOperation: '독수리 귀환 계획', majorOperationDetail: '광복군의 국내정진 구상과 연합 정보기관 협력을 앞당겨 한반도 내부 봉기와 상륙을 연결합니다.',
    formations: ['한국광복군 총사령부', '국내정진 선발대', '만주·한반도 지하연락망'], equipment: ['중국군·연합군 혼성 소화기', '소형 무전기·암호표', '경량 폭파 장비', '분산 보급망'],
    modifiers: { manpower: 420, factories: 10, politicalPower: 74, intelNetwork: 78, stability: 57, navalPower: 28 },
    paths: [
      { id: 'korean-republic-charter', title: '민주공화국 건국헌장', summary: '임시정부의 법통과 국내 대표회의를 결합해 광복 즉시 총선거를 준비합니다.', effect: '안정도 +10 · 정치력 +12', tone: 'reform' },
      { id: 'northeast-asian-federation', title: '동북아 독립연대', summary: '중국·만주·일본의 반전 세력과 식민지 해방 공동전선을 조직합니다.', effect: '정보망 +12 · 동맹 관계 +8', tone: 'international' },
    ],
  },
  {
    id: 'vietnam', name: '베트남 독립동맹회', shortName: '베트민', code: 'VN', alignment: 'allies', color: '#7a6250', accent: '#c2a66e', defaultTheater: 'asia', status: 'resistance-coalition', historicalBasis: '1941년 결성된 베트남 독립동맹회와 북부 산악지대의 항일 조직', capitalTerritoryId: 'indochina', strategicTargets: ['indochina', 'south_china'],
    summary: '산악 근거지와 대중조직, 국경 연락망으로 식민지 독립과 전후 정통성을 동시에 쟁취합니다.', challenge: '무기 부족, 프랑스 식민 행정과 일본 점령의 이중 압력, 정파 연합', majorOperation: '비엣박 해방구', majorOperationDetail: '북부 산악의 연락망과 자위대를 통합해 정치 조직이 군사 거점으로 성장하게 합니다.',
    formations: ['베트민 구국대', '북부 선전무장대', '인도차이나 연락망'], equipment: ['프랑스제·노획 소화기', '수제 폭발물', '산악 운반대', '은닉 무전망'],
    modifiers: { manpower: 610, factories: 9, politicalPower: 68, intelNetwork: 74, stability: 51, navalPower: 22 },
    paths: [
      { id: 'broad-independence-front', title: '전민족 독립전선', summary: '이념보다 독립을 우선해 종교·지역·정파 대표를 임시의회에 참여시킵니다.', effect: '안정도 +11 · 인력 +140K', tone: 'reform' },
      { id: 'indochina-federation', title: '인도차이나 연방회의', summary: '라오스·캄보디아 독립조직과 동등한 연방·방위 협약을 제안합니다.', effect: '정치력 +14 · 동맹 관계 +10', tone: 'international' },
    ],
  },
  {
    id: 'indonesia', name: '인도네시아 독립운동', shortName: '인도네시아', code: 'ID', alignment: 'allies', color: '#7c544f', accent: '#d29a82', defaultTheater: 'asia', status: 'colonized', historicalBasis: '전간기 민족운동과 1942년 일본 점령 아래 협력·지하저항 노선의 분화', capitalTerritoryId: 'dutch_east_indies', strategicTargets: ['dutch_east_indies', 'singapore'],
    summary: '수마트라와 자바의 민족운동, 청년조직, 지하 저항을 묶어 독립 선언의 조건을 만듭니다.', challenge: '군도 통신, 점령당국 감시, 협력과 저항 사이의 정통성 경쟁', majorOperation: '누산타라 연락망', majorOperationDetail: '섬별 청년조직과 노동·철도망을 연결해 독립 선언이 실제 행정력으로 이어지게 합니다.',
    formations: ['자바 청년연락대', '수마트라 지하조직', '군도 해상연락대'], equipment: ['네덜란드군 잔존 소화기', '노획 일본군 장비', '소형 선박·자전거 수송', '비밀 인쇄·무전 장비'],
    modifiers: { manpower: 880, factories: 13, politicalPower: 72, intelNetwork: 69, stability: 48, navalPower: 37 },
    paths: [
      { id: 'youth-republic', title: '청년 공화국', summary: '협력기관을 독립 준비위원회로 전환하고 지역 대표가 참여하는 공화국을 선언합니다.', effect: '전쟁 지지도 +10 · 안정도 +7', tone: 'reform' },
      { id: 'nusantara-commonwealth', title: '누산타라 공동체', summary: '군도의 지방 자치와 공동 해양방위를 결합한 연합국가를 설계합니다.', effect: '해상 통제 +9 · 정치력 +13', tone: 'international' },
    ],
  },
  {
    id: 'philippines', name: '필리핀 자치정부·저항군', shortName: '필리핀', code: 'PH', alignment: 'allies', color: '#4f7181', accent: '#d3b06d', defaultTheater: 'asia', status: 'occupied-commonwealth', historicalBasis: '1942년 망명 자치정부와 루손·민다나오 등지의 분산 게릴라·정보망', capitalTerritoryId: 'philippines', strategicTargets: ['philippines', 'new_guinea'],
    summary: '망명정부, 잔존군, 민간 정보원과 지역 게릴라를 하나의 해방 행정으로 통합합니다.', challenge: '분산된 섬, 보급 단절, 협력정부와 게릴라 간 정통성 경쟁', majorOperation: '바얀 귀환 작전', majorOperationDetail: '잠수함 보급과 비밀 무전을 표준화해 군도 전역의 저항군을 연합군 상륙과 연결합니다.',
    formations: ['루손 게릴라 연합', '민다나오 저항사령부', '군도 정보·해상연락대'], equipment: ['미·필리핀군 잔존 소화기', '노획 일본군 장비', '민간 선박·잠수함 보급', '휴대 무전기'],
    modifiers: { manpower: 720, factories: 12, politicalPower: 71, intelNetwork: 77, stability: 50, navalPower: 41 },
    paths: [
      { id: 'resistance-congress', title: '저항 국민회의', summary: '지역 게릴라·농민조직·망명정부 대표를 묶어 해방 전 임시의회를 구성합니다.', effect: '안정도 +10 · 정보망 +7', tone: 'reform' },
      { id: 'pacific-republic-pact', title: '태평양 공화국 협약', summary: '미국 의존을 줄이고 아시아 독립국들과 상호 방위·통상 협약을 맺습니다.', effect: '정치력 +15 · 동맹 관계 +9', tone: 'international' },
    ],
  },
];

const roleCatalog: Record<NationId, [string, string, string, string, string, string]> = {
  britain: ['제국 전쟁내각 조정관', '동부제국 전구사령관', '특수작전국 지역국장', '합동정보위원회 부국장', '원정군 야전사령관', '점령 유럽 SOE 연락요원'],
  usa: ['합동전략위원회 의장', '태평양 원정군 사령관', '전략정보국 지역책임자', 'OSS 전구정보책임자', '도서 원정대 지휘관', '점령지 침투·연락요원'],
  ussr: ['국가방위위원회 작전위원', '전선군 사령관', '극동 정보총국장', '정보·유격전 조정관', '근위군단 야전지휘관', '점령지 파르티잔 연락요원'],
  germany: ['국가전쟁지도부 총감', '기갑집단 사령관', '해외정보국 전구책임자', '국방군 정보조정관', '전선 군단 지휘관', '해외 잠복공작원'],
  japan: ['대본영 전략참의', '연합함대 전구참모', '남방 연락기관장', '육해군 정보조정관', '남방군 야전사령관', '점령지 특무공작원'],
  china: ['국민정부 군사위원', '국민혁명군 전구사령관', '적후공작국 지역책임자', '군통·전시정보 조정관', '유격전구 야전지휘관', '점령지 지하연락요원'],
  india: ['총독부 국방집행위원', '인도 동부군 사령관', '독립연락국 책임자', '전시정보·정치 연락관', '인도군 여단 지휘관', '독립운동 지하조직원'],
  freefrance: ['임시정부 국방위원', '자유프랑스 원정군단장', '레지스탕스 연락국장', 'BCRA 작전책임자', '자유프랑스 야전지휘관', '본토 레지스탕스 특사'],
  italy: ['최고국방위원회 위원', '지중해 집단군 사령관', '군사정보국 전구책임자', 'SIM 해외정보 조정관', '원정군단 야전지휘관', '점령지 비밀연락원'],
  korea: ['임시정부 국무위원', '한국광복군 전구지휘관', '국내공작 지역책임자', '광복군 정보처 책임자', '국내정진대 지휘관', '한반도 지하연락요원'],
  vietnam: ['독립동맹 중앙위원', '구국군 전구지휘관', '국경 연락책임자', '베트민 정보·선전책임자', '북부 무장대 지휘관', '도시 지하조직원'],
  indonesia: ['독립준비 정치조정관', '군도 방위조직 지휘관', '지하저항 연락책임자', '군도 정보망 책임자', '청년 무장대 지휘관', '점령행정 잠복요원'],
  philippines: ['자치정부 전시위원', '필리핀 저항군 전구지휘관', '군도 정보연락책임자', '망명정부 정보조정관', '지역 게릴라 지휘관', '도시·해상 비밀요원'],
};

const roleInstitutions: Record<NationId, { politics: string; military: string; intelligence: string }> = {
  britain: { politics: '전쟁내각', military: '영국군 합동지휘부', intelligence: 'SIS·SOE' },
  usa: { politics: '백악관 전시행정부', military: '합동참모·전구사령부', intelligence: 'OSS' },
  ussr: { politics: '국가방위위원회', military: '스타프카·붉은군', intelligence: 'NKVD·GRU' },
  germany: { politics: '국가전쟁지도부', military: 'OKW·육군 지휘부', intelligence: '아프베어' },
  japan: { politics: '대본영·전시내각', military: '육해군 대본영', intelligence: '특무·연락기관' },
  china: { politics: '국민정부 군사위원회', military: '국민혁명군', intelligence: '군통·적후공작망' },
  india: { politics: '총독 집행평의회', military: '인도 육군사령부', intelligence: '정보국·독립연락망' },
  freefrance: { politics: '프랑스 국민위원회', military: '자유프랑스군', intelligence: 'BCRA·레지스탕스' },
  italy: { politics: '왕국 전시정부', military: '최고사령부', intelligence: 'SIM' },
  korea: { politics: '대한민국 임시정부', military: '한국광복군', intelligence: '광복군 정보·국내공작망' },
  vietnam: { politics: '베트민 중앙조직', military: '구국군·무장대', intelligence: '국경·도시 비밀망' },
  indonesia: { politics: '민족운동 정치망', military: '군도 방위·청년조직', intelligence: '반일 지하망' },
  philippines: { politics: '망명 자치정부', military: '필리핀군·저항군', intelligence: '군도 게릴라 연락망' },
};

export const CAREER_TIER_COUNT = 5;

export function getCareerStarCount(tier: CareerTier) {
  return CAREER_TIER_COUNT + 1 - tier;
}

export function getPromotionThreshold(tier: CareerTier) {
  return ({ 1: 100, 2: 100, 3: 90, 4: 80, 5: 70 } satisfies Record<CareerTier, number>)[tier];
}

export const careerRoles: CareerRole[] = nations.flatMap((nation) => {
  const titles = roleCatalog[nation.id];
  const institutions = roleInstitutions[nation.id];
  const roster = historicalPersonnel[nation.id];
  const supplemental = historicalSupplementalPersonnel[nation.id];
  const holders = [
    getHistoricalRoleHolder(nation.id, 1), supplemental[0], roster.staff[4], supplemental[1], roster.market[4],
    getHistoricalRoleHolder(nation.id, 2), roster.staff[0], roster.market[0], roster.market[1],
    getHistoricalRoleHolder(nation.id, 3), roster.staff[3], roster.market[3], roster.market[2],
  ];
  const buildRole = (index: number, id: string, title: string, tier: CareerTier, branch: CareerRole['branch'], archetype: CareerRole['archetype'], scope: string, authority: number, expectation: string, coverIdentity: string): CareerRole => {
    const holder = holders[index];
    return {
      id: nation.id + '-' + id,
      nationId: nation.id,
      title,
      branch,
      tier,
      archetype,
      scope,
      authority,
      expectation,
      historicalHolderId: holder.id,
      historicalHolderName: holder.name,
      historicalOffice: holder.office,
      historicalBasis: `게임 보직은 ${holder.name}의 실제 ${holder.office}와 1942년 조직 환경을 바탕으로 재구성했습니다.`,
      coverIdentity,
      replacementEffect: `${holder.name}은(는) 취임과 동시에 직책에서 밀려나며 인재 시장의 고영향력 경쟁자로 남습니다.`,
    };
  };
  return [
    buildRole(0, 'tier1', titles[0], 1, 'politics', 'head-of-state', '국가 전체', 92, '국가 진로와 전쟁 목표를 직접 결정합니다.', '공식 국가기관'),
    buildRole(1, 'political-minister', `${institutions.politics} 수석위원`, 2, 'politics', 'cabinet-minister', '중앙 내각·위원회', 80, '부처 연합과 예산을 장악해 최고지도부 진입을 노립니다.', '중앙정부 관저'),
    buildRole(2, 'political-bureau', `${institutions.politics} 정책국장`, 3, 'politics', 'bureau-director', '정책·인사 관료망', 66, '정책 성과와 연합 구축으로 장관급 보직에 도전합니다.', '정부 부처·위원회'),
    buildRole(3, 'political-regional', `${institutions.politics} 지역조정관`, 4, 'politics', 'regional-command', '지역 행정·대중조직', 48, '지역 동원과 민심을 관리해 중앙 정치에 발판을 만듭니다.', nation.status === 'sovereign' ? '지역 행정기관' : '망명·지하 연락소'),
    buildRole(4, 'political-organizer', `${institutions.politics} 현장조직관`, 5, 'politics', 'organizer', '지역 위원회·대중운동', 32, '현장 조직과 제한된 예산으로 정치적 기반을 처음부터 구축합니다.', nation.status === 'sovereign' ? '지방위원회 사무실' : '교회·학교·상점 연락망'),
    buildRole(5, 'tier2', titles[1], 2, 'military', 'theater-command', nation.defaultTheater === 'asia' ? '아시아·태평양 전구' : '유럽·지중해 전구', 72, '전구 성과로 중앙 지도부의 신뢰와 승진을 쟁취합니다.', '정규군 사령부'),
    buildRole(6, 'military-staff', `${institutions.military} 작전참모`, 3, 'military', 'bureau-director', '군단·전구 참모부', 62, '작전안·보급·예비대 조정 성과로 전구 지휘권을 획득합니다.', '상급 사령부'),
    buildRole(7, 'field-command', titles[4], 4, 'military', 'field-command', '사단·여단급 현장 부대', 51, '부대 생존과 승전으로 상급 사령부 진입을 노립니다.', '야전 지휘소'),
    buildRole(8, 'unit-command', `${institutions.military} 전투단 지휘관`, 5, 'military', 'unit-command', '대대·분견대·게릴라대', 38, '한정된 병력과 장비로 전공과 부하의 신뢰를 쌓습니다.', '전선 지휘소·은신처'),
    buildRole(9, 'intelligence-director', titles[3], 2, 'intelligence', 'service-director', '국가 정보기관', 68, '요원망·방첩·기만작전을 설계하고 정치적 책임을 집니다.', '정보기관 본부'),
    buildRole(10, 'intelligence-regional', `${institutions.intelligence} 전구국장`, 3, 'intelligence', 'bureau-director', '전구 정보·공작 지부', 57, '여러 공작망과 경쟁 기관을 조정해 본부 진입을 노립니다.', '전구 연락본부'),
    buildRole(11, 'tier3', titles[2], 4, 'intelligence', 'agent', '지역 정보망', 44, '제한된 권한과 정보망으로 역사의 흐름을 바꿉니다.', nation.status === 'sovereign' ? '외교·군사기관 파견관' : '상업인·기자·연락원'),
    buildRole(12, 'resistance-agent', titles[5], 5, 'intelligence', nation.status === 'sovereign' ? 'agent' : 'resistance', '점령지·식민지 지하조직', 36, '정체를 숨기고 인물 포섭·파괴공작·봉기를 연결합니다.', nation.status === 'sovereign' ? '가명·위조 신분' : '교사·노동자·상인·학생 신분'),
  ];
});

const startingPositions: Record<NationId, [string, string, string]> = {
  britain: ['britain', 'egypt', 'malta'], usa: ['hawaii', 'midway', 'coral_sea'], ussr: ['moscow', 'caucasus', 'soviet_far_east'],
  germany: ['germany', 'poland', 'ukraine'], japan: ['japan_home', 'manchuria', 'malaya'], china: ['china_interior', 'south_china', 'yunnan'],
  india: ['india', 'assam', 'ceylon'], freefrance: ['levant', 'britain', 'malta'], italy: ['italy', 'sicily', 'libya'],
  korea: ['china_interior', 'korea', 'manchuria'], vietnam: ['south_china', 'indochina', 'yunnan'],
  indonesia: ['dutch_east_indies', 'singapore', 'new_guinea'], philippines: ['philippines', 'new_guinea', 'south_china'],
};

const staffDepartments: Array<Pick<StaffMember, 'id' | 'role' | 'department' | 'specialty'>> = [
  { id: 'chief-operations', role: '작전참모장', department: 'operations', specialty: '전구 계획 · 상대 분석' },
  { id: 'chief-logistics', role: '군수총감', department: 'logistics', specialty: '보급망 · 수송 손실 관리' },
  { id: 'chief-armaments', role: '무기조달국장', department: 'armaments', specialty: '생산 계약 · 장비 표준화' },
  { id: 'chief-personnel', role: '인사·훈련국장', department: 'personnel', specialty: '지휘관 육성 · 부대 사기' },
  { id: 'political-liaison', role: '정치연락관', department: 'political', specialty: '지도부 신임 · 예산 협상' },
  { id: 'chief-science', role: '과학기술고문', department: 'science', specialty: '국가 연구망 · 과학자 포섭' },
  { id: 'chief-economy', role: '전시경제고문', department: 'economy', specialty: '전쟁금융 · 생산계획 · 민간경제' },
];

export function getNation(id: NationId) {
  return nations.find((nation) => nation.id === id) ?? nations[0];
}

export function getRole(id: string, nationId: NationId) {
  return careerRoles.find((role) => role.id === id) ?? careerRoles.find((role) => role.nationId === nationId && role.tier === 2) ?? careerRoles[0];
}

export function createCareerState(nationId: NationId, roleId: string): CareerState {
  const role = getRole(roleId, nationId);
  const reputationByTier: Record<CareerTier, number> = { 1: 68, 2: 52, 3: 40, 4: 31, 5: 24 };
  const trustByTier: Record<CareerTier, number> = { 1: 74, 2: 64, 3: 57, 4: 50, 5: 44 };
  const experienceByTier: Record<CareerTier, number> = { 1: 76, 2: 42, 3: 30, 4: 18, 5: 8 };
  return {
    nationId,
    roleId: role.id,
    reputation: reputationByTier[role.tier],
    councilTrust: trustByTier[role.tier],
    experience: experienceByTier[role.tier],
    legacy: 0,
    alternatePathId: null,
    replacedPersonId: role.historicalHolderId,
  };
}

export function createCareerCommanders(nation: NationProfile, role: CareerRole): Commander[] {
  const base = ({ 1: 86, 2: 79, 3: 73, 4: 68, 5: 63 } satisfies Record<CareerTier, number>)[role.tier];
  const historicalCommanders = [...historicalPersonnel[nation.id].staff, ...historicalPersonnel[nation.id].market]
    .filter((person) => person.id !== role.historicalHolderId && person.command)
    .slice(0, 2);
  return [
    { id: 'player', name: '나 · ' + role.title, rank: 'TIER ' + role.tier + ' 임명직', initials: nation.code, color: nation.color, command: base + 5, attack: base, defense: base + 2, logistics: base + 1, trait: '대체역사의 주인공', specialty: role.scope, fatigue: 8, loyalty: 100 },
    ...historicalCommanders.map((person, index) => ({
      id: index === 0 ? 'staff-alpha' : 'staff-beta',
      name: person.name,
      rank: person.command!.rank,
      initials: person.name.replace(/[^가-힣A-Za-z]/g, '').slice(0, 2),
      color: index === 0 ? '#69766f' : '#786f5d',
      command: person.command!.command,
      attack: person.command!.attack,
      defense: person.command!.defense,
      logistics: person.command!.logistics,
      trait: person.command!.trait,
      specialty: person.command!.specialty,
      fatigue: index === 0 ? 24 : 17,
      loyalty: person.loyalty,
    })),
  ];
}

export function createStaffRoster(nationId: NationId, roleId?: string): StaffMember[] {
  const personnel = historicalPersonnel[nationId];
  const replacedPersonId = roleId ? getRole(roleId, nationId).historicalHolderId : null;
  return staffDepartments.map((department, index) => {
    if (department.department === 'science' || department.department === 'economy') {
      const experts = getStartingHistoricalExperts(nationId);
      const profile = experts[department.department];
      const successor = getRecruitableHistoricalExperts(nationId).find((candidate) => candidate.department === department.department) ?? profile;
      return {
        ...department,
        role: profile.appointmentTitle,
        personId: profile.id,
        name: profile.name,
        candidateName: successor.name,
        historicalOffice: profile.office1942,
        affiliation: profile.affiliation,
        summary: profile.summary,
        ability: profile.ability,
        potential: profile.potential,
        loyalty: profile.loyalty,
        workload: 36 + index * 5,
        weeklyCost: 5 + Math.floor(profile.ability / 18),
        specialty: profile.expertise.join(' · '),
        influence: profile.influence,
        delegated: false,
        grade: 1,
        development: 18 + index * 9,
        discipline: profile.discipline,
        birthYear: profile.birthYear,
        nationality: profile.nationality,
        wartimeLocation: profile.wartimeLocation,
        historicalConstraint: profile.historicalConstraint,
        expertise: profile.expertise,
        networks: profile.networks,
        friction: profile.friction,
        appointmentEffect: profile.appointmentEffect,
        sourceLabel: profile.sourceLabel,
        sourceUrl: profile.sourceUrl,
      };
    }
    const incumbent = personnel.staff.find((person) => person.department === department.department) ?? personnel.staff[index];
    const replacement = personnel.market.find((person) => person.department === department.department && person.id !== replacedPersonId) ?? personnel.market[index];
    const profile = incumbent.id === replacedPersonId ? replacement : incumbent;
    const successor = [...personnel.market, ...personnel.staff].find((person) => person.department === department.department && person.id !== profile.id && person.id !== replacedPersonId) ?? incumbent;
    return {
      ...department,
      personId: profile.id,
      name: profile.name,
      candidateName: successor.name,
      historicalOffice: profile.office,
      affiliation: profile.affiliation,
      summary: profile.summary,
      ability: profile.ability,
      potential: profile.potential,
      loyalty: profile.loyalty,
      workload: 31 + index * 8,
      weeklyCost: 4 + Math.floor(profile.ability / 20),
      influence: profile.influence,
      delegated: index < 2,
      grade: index === 0 ? 2 : 1,
      development: 24 + index * 16,
    };
  });
}

export function createStaffCandidates(nationId: NationId, roleId?: string): StaffCandidate[] {
  const role = getRole(roleId ?? nationId + '-tier2', nationId);
  const personnel = historicalPersonnel[nationId];
  const allPeople = [...personnel.roleHolders, ...personnel.staff, ...personnel.market, ...historicalSupplementalPersonnel[nationId]];
  const holder = allPeople.find((person) => person.id === role.historicalHolderId) ?? personnel.roleHolders[0];
  const candidatePool = Array.from(new Map([
    holder,
    ...historicalSupplementalPersonnel[nationId],
    ...personnel.market,
    ...personnel.roleHolders,
    ...personnel.staff,
  ].map((person) => [person.id, person])).values()).slice(0, 8);
  const seniorCandidates: StaffCandidate[] = candidatePool.map((profile, index) => {
    const department = staffDepartments.find((entry) => entry.department === profile.department) ?? staffDepartments[0];
    const isDisplaced = profile.id === holder.id;
    return {
      id: nationId + '-candidate-' + profile.id,
      personId: profile.id,
      name: profile.name,
      role: isDisplaced ? '전임 ' + role.title : department.role,
      historicalOffice: profile.office,
      affiliation: profile.affiliation,
      summary: profile.summary,
      department: profile.department,
      ability: profile.ability,
      potential: profile.potential,
      loyalty: profile.loyalty,
      weeklyCost: 5 + Math.floor(profile.ability / 18),
      signingCost: 36 + profile.ability + Math.round(profile.influence * 0.45),
      interest: profile.interest,
      knowledge: isDisplaced ? 72 : 18 + index * 7,
      status: 'unscouted',
      specialty: department.specialty,
      influence: profile.influence,
      relationship: isDisplaced ? 4 : 12,
      rivalInterest: Math.max(10, profile.influence - (isDisplaced ? 48 : 62)),
      availability: isDisplaced ? 'displaced' : profile.availability,
      lastApproachWeek: null,
      discipline: profile.command ? 'military' : profile.department === 'armaments' ? 'industry' : profile.department === 'personnel' ? 'intelligence' : profile.department === 'political' ? 'diplomacy' : 'military',
      sourceLabel: profile.sourceLabel,
      sourceUrl: profile.sourceUrl,
    };
  });
  const expertCandidates: StaffCandidate[] = getRecruitableHistoricalExperts(nationId).map((profile, index) => ({
    id: nationId + '-expert-candidate-' + profile.id,
    personId: profile.id,
    name: profile.name,
    role: profile.appointmentTitle,
    historicalOffice: profile.office1942,
    affiliation: profile.affiliation,
    summary: profile.summary,
    department: profile.department,
    ability: profile.ability,
    potential: profile.potential,
    loyalty: profile.loyalty,
    weeklyCost: 6 + Math.floor(profile.ability / 17),
    signingCost: 48 + profile.ability + Math.round(profile.influence * 0.6),
    interest: profile.interest,
    knowledge: 14 + (index % 6) * 7,
    status: 'unscouted',
    specialty: profile.expertise.join(' · '),
    influence: profile.influence,
    relationship: 8 + (index % 4) * 3,
    rivalInterest: Math.max(14, profile.influence - 58),
    availability: profile.availability,
    lastApproachWeek: null,
    discipline: profile.discipline,
    birthYear: profile.birthYear,
    nationality: profile.nationality,
    wartimeLocation: profile.wartimeLocation,
    historicalConstraint: profile.historicalConstraint,
    expertise: profile.expertise,
    networks: profile.networks,
    friction: profile.friction,
    appointmentEffect: profile.appointmentEffect,
    sourceLabel: profile.sourceLabel,
    sourceUrl: profile.sourceUrl,
  }));
  return [...seniorCandidates, ...expertCandidates];
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
  const equipment = getNationHistoricalEquipment(nation.id);
  const byCategory = (category: 'armor' | 'aircraft' | 'infantry' | 'naval' | 'artillery' | 'logistics') => equipment.find((node) => node.category === category)!;
  const armor = byCategory('armor');
  const aircraft = byCategory('aircraft');
  const infantry = byCategory('infantry');
  const naval = byCategory('naval');
  const artillery = byCategory('artillery');
  const logistics = byCategory('logistics');
  const factoryCapacity = nation.modifiers.factories ?? 29;
  const assigned = [6, 7, 5, 4, 4, 3].map((value) => Math.max(1, Math.round(value * Math.min(29, factoryCapacity) / 29)));
  return [
    { id: 'sherman', name: armor.name, category: '기갑 장비', assigned: assigned[0], efficiency: 72, output: 116, icon: '▰', equipmentId: armor.id, reliability: armor.stats.reliability, unitCost: armor.industrialCost },
    { id: 'spitfire', name: aircraft.name, category: '전투 항공기', assigned: assigned[1], efficiency: 78, output: 198, icon: '✦', equipmentId: aircraft.id, reliability: aircraft.stats.reliability, unitCost: aircraft.industrialCost },
    { id: 'rifle', name: infantry.name, category: '보병 장비', assigned: assigned[2], efficiency: 84, output: 6480, icon: '╂', equipmentId: infantry.id, reliability: infantry.stats.reliability, unitCost: infantry.industrialCost },
    { id: 'convoy', name: naval.name, category: '함정·호송선', assigned: assigned[3], efficiency: 64, output: 12, icon: '≋', equipmentId: naval.id, reliability: naval.stats.reliability, unitCost: naval.industrialCost },
    { id: 'artillery', name: artillery.name, category: '야포·지원화기', assigned: assigned[4], efficiency: 69, output: 360, icon: '◉', equipmentId: artillery.id, reliability: artillery.stats.reliability, unitCost: artillery.industrialCost },
    { id: 'truck', name: logistics.name, category: '수송·정비차량', assigned: assigned[5], efficiency: 74, output: 620, icon: '▣', equipmentId: logistics.id, reliability: logistics.stats.reliability, unitCost: logistics.industrialCost },
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

const resistanceOperations: Partial<Record<NationId, CovertOperation[]>> = {
  korea: [
    { id: 'korea-homecoming', name: '국내정진 침투망', region: '한반도', risk: 62, progress: 18, active: true, icon: 'radio' },
    { id: 'manchurian-links', name: '만주 독립군 연락선 복원', region: '만주·화북', risk: 49, progress: 37, active: true, icon: 'eye' },
    { id: 'allied-eagle-precursor', name: '연합 특수침투 훈련 제안', region: '중국 전구', risk: 34, progress: 26, active: false, icon: 'crosshair' },
  ],
  vietnam: [
    { id: 'viet-bac-couriers', name: '비엣박 산악 연락망', region: '북부 인도차이나', risk: 41, progress: 58, active: true, icon: 'radio' },
    { id: 'border-intelligence', name: '중국 국경 정보선', region: '윈난·광시', risk: 35, progress: 44, active: true, icon: 'eye' },
    { id: 'rail-sabotage-vn', name: '인도차이나 철도 파괴조', region: '하노이·라오까이', risk: 57, progress: 21, active: false, icon: 'crosshair' },
  ],
  indonesia: [
    { id: 'sjahrir-underground', name: '샤리르 청년 지하망', region: '자바', risk: 48, progress: 53, active: true, icon: 'radio' },
    { id: 'archipelago-listening', name: '군도 단파수신망', region: '자바·수마트라', risk: 39, progress: 46, active: true, icon: 'eye' },
    { id: 'rail-workers', name: '철도 노동자 비밀연락선', region: '자바 내륙', risk: 52, progress: 29, active: false, icon: 'crosshair' },
  ],
  philippines: [
    { id: 'manila-spy-ring', name: '마닐라 민간 첩보망', region: '마닐라', risk: 61, progress: 48, active: true, icon: 'eye' },
    { id: 'guerrilla-radio-ph', name: '루손·민다나오 게릴라 무전망', region: '필리핀 군도', risk: 44, progress: 57, active: true, icon: 'radio' },
    { id: 'submarine-rendezvous', name: '연합 잠수함 접선 계획', region: '필리핀 연안', risk: 53, progress: 24, active: false, icon: 'crosshair' },
  ],
};

export function createCovertOperations(theater: TheaterId, nationId?: NationId): CovertOperation[] {
  if (nationId && resistanceOperations[nationId]) return resistanceOperations[nationId]!.map((operation) => ({ ...operation }));
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
