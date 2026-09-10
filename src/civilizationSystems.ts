import type { EconomyState } from './economy';
import type { NationManagementState } from './nationManagement';
import type { PublicHealthState } from './publicHealth';
import type { CareerRole, GameState, GameTab, NationId } from './types';

export type CivilizationDomainId =
  | 'food'
  | 'energy'
  | 'housing'
  | 'transport'
  | 'health'
  | 'education'
  | 'labor'
  | 'information'
  | 'environment'
  | 'science'
  | 'finance'
  | 'justice'
  | 'migration'
  | 'culture'
  | 'resilience';

export type CivilizationApproachId = 'public' | 'civic' | 'market';
export type CivilizationEraId = 'mobilization' | 'reconstruction' | 'mass-society' | 'globalization' | 'networked' | 'planetary';
export type CivilizationAuthorityMode = 'direct' | 'ministerial' | 'proposal';

type EconomyEffectKey = 'debt' | 'inflation' | 'publicConfidence';
type NationEffectKey =
  | 'legitimacy'
  | 'welfare'
  | 'infrastructure'
  | 'education'
  | 'housing'
  | 'employment'
  | 'inequality'
  | 'institutionalCapacity'
  | 'civilianIndustry'
  | 'tradeBalance'
  | 'unrest'
  | 'relativeCompetitiveness'
  | 'demographicPressure'
  | 'ecologicalPressure';
type PublicHealthEffectKey = 'preparedness' | 'surveillance' | 'medicalCapacity' | 'publicTrust' | 'outbreakPressure' | 'countermeasureProgress';

export interface CivilizationEra {
  id: CivilizationEraId;
  label: string;
  shortLabel: string;
  startYear: number;
  endYear: number;
  order: string;
  question: string;
}

export interface CivilizationDomainDefinition {
  id: CivilizationDomainId;
  label: string;
  shortLabel: string;
  description: string;
  destination: GameTab;
  approaches: Record<CivilizationApproachId, {
    label: string;
    summary: string;
    beneficiary: string;
    risk: string;
  }>;
}

export interface CivilizationEffects {
  game: Partial<Record<keyof GameState, number>>;
  economy: Partial<Record<EconomyEffectKey, number>>;
  nation: Partial<Record<NationEffectKey, number>>;
  publicHealth: Partial<Record<PublicHealthEffectKey, number>>;
  relations: number;
  researchProgress: number;
}

export interface CivilizationProgram {
  id: string;
  eraId: CivilizationEraId;
  domainId: CivilizationDomainId;
  title: string;
  summary: string;
  historicalBasis: string;
  sourceLabel: string;
  sourceUrl: string;
  baseTreasuryCost: number;
  reviewWeeks: 4 | 13 | 26 | 52;
}

export interface CivilizationPath {
  id: string;
  programId: string;
  approachId: CivilizationApproachId;
  label: string;
  summary: string;
  beneficiary: string;
  risk: string;
  authorityMode: CivilizationAuthorityMode;
  authorityLabel: string;
  authorityNote: string;
  politicalCost: number;
  treasuryCost: number;
  reviewWeeks: 4 | 13 | 26 | 52;
  effectiveness: number;
  effects: CivilizationEffects;
}

export interface NationCivilizationProfile {
  nationId: NationId;
  stateCapacity: number;
  civicCapacity: number;
  marketDepth: number;
  strengths: CivilizationDomainId[];
  constraints: CivilizationDomainId[];
  historicalAnchor: string;
}

export const civilizationEras: CivilizationEra[] = [
  {
    id: 'mobilization',
    label: '총력전과 생존국가',
    shortLabel: '1942–1945',
    startYear: 1942,
    endYear: 1945,
    order: '배급, 동원, 피난, 선전과 전시 과학이 국가의 생존 능력을 좌우합니다.',
    question: '전쟁을 버티면서도 전후 사회가 감당할 제도적 부채를 어디까지 만들 것인가?',
  },
  {
    id: 'reconstruction',
    label: '재건과 국제제도의 탄생',
    shortLabel: '1946–1959',
    startYear: 1946,
    endYear: 1959,
    order: '주택·보건·교육·통화제도를 재건하면서 냉전과 독립운동이 새로운 국가 질서를 만듭니다.',
    question: '폐허를 빠르게 복구하는 국가와 권리·대표성을 넓히는 국가를 어떻게 함께 만들 것인가?',
  },
  {
    id: 'mass-society',
    label: '대중사회와 개발국가',
    shortLabel: '1960–1979',
    startYear: 1960,
    endYear: 1979,
    order: '도시화, 녹색혁명, 대학교육, 텔레비전, 우주개발과 환경정치가 대규모 사회를 재편합니다.',
    question: '고속 성장의 성과와 토지·노동·환경·지역 격차의 비용을 누가 나눠 가질 것인가?',
  },
  {
    id: 'globalization',
    label: '세계화와 체제전환',
    shortLabel: '1980–1999',
    startYear: 1980,
    endYear: 1999,
    order: '금융·컨테이너·위성·컴퓨터 네트워크가 국경을 낮추지만 산업 공동화와 새로운 불평등을 만듭니다.',
    question: '개방의 속도, 사회적 보호, 국가 전략산업 사이의 균형을 어디에 둘 것인가?',
  },
  {
    id: 'networked',
    label: '연결세계와 복합위기',
    shortLabel: '2000–2024',
    startYear: 2000,
    endYear: 2024,
    order: '초연결 공급망, 플랫폼 경제, 팬데믹, 기후재난과 인공지능이 효율과 취약성을 동시에 키웁니다.',
    question: '개방된 네트워크를 유지하면서 보건·정보·공급망 충격에 회복력을 갖출 수 있는가?',
  },
  {
    id: 'planetary',
    label: '행성문명과 인간 통제',
    shortLabel: '2025–2060',
    startYear: 2025,
    endYear: 2060,
    order: '기후적응, 자율체계, 합성생물학, 우주경제와 고령화가 국가의 경계를 다시 정의합니다.',
    question: '기술적 풍요를 누가 통제하고, 위험과 세대 간 비용을 어떤 헌정질서로 배분할 것인가?',
  },
];

export const civilizationDomainDefinitions: Record<CivilizationDomainId, CivilizationDomainDefinition> = {
  food: {
    id: 'food',
    label: '식량·농업',
    shortLabel: '식량',
    description: '생산량뿐 아니라 토지, 비축, 가격, 영양과 농촌 권력관계를 함께 다룹니다.',
    destination: 'economy',
    approaches: {
      public: { label: '국가 배급·비축망', summary: '국가가 가격과 비축, 영양 기준을 직접 보장합니다.', beneficiary: '도시 저소득층·군수 노동자·피난민', risk: '관료적 배분과 암시장, 높은 재정 부담' },
      civic: { label: '농민조합·지역 식량권', summary: '협동조합, 토지개혁과 지방 비축고를 연결합니다.', beneficiary: '소농·지역사회·식량 취약지역', risk: '대지주·중앙관료와의 권한 충돌' },
      market: { label: '상업농·시장조달', summary: '가격 신호와 민간 유통망으로 생산과 수입을 늘립니다.', beneficiary: '상업농·유통기업·수출 부문', risk: '가격 급등과 토지 집중, 수입 의존' },
    },
  },
  energy: {
    id: 'energy',
    label: '에너지·자원',
    shortLabel: '에너지',
    description: '연료, 전력망, 산업 원료와 전략적 자율성을 하나의 체계로 봅니다.',
    destination: 'industry',
    approaches: {
      public: { label: '국영 전력·연료망', summary: '발전·송전과 전략 비축을 국가 계획으로 통합합니다.', beneficiary: '기간산업·농촌 전력화·공공서비스', risk: '대규모 부채와 기술 경직성' },
      civic: { label: '지역 분산에너지', summary: '지방 공기업과 협동조합이 소규모 전원을 운영합니다.', beneficiary: '도서·농촌·재난 취약지역', risk: '규격 혼재와 초기 조정 비용' },
      market: { label: '민간 발전·가격경쟁', summary: '민간 투자와 경쟁시장을 통해 설비를 빠르게 늘립니다.', beneficiary: '산업 소비자·에너지 기업·투자자', risk: '가격 변동과 공급 독점' },
    },
  },
  housing: {
    id: 'housing',
    label: '주거·도시',
    shortLabel: '주거',
    description: '주택 공급, 토지, 이주, 도시 기반시설과 지역 공동체를 함께 설계합니다.',
    destination: 'governance',
    approaches: {
      public: { label: '공공주택·신도시', summary: '토지 수용과 장기 공공임대로 대규모 주거를 공급합니다.', beneficiary: '피난민·노동자·신혼가구', risk: '재정 부담과 획일적 도시계획' },
      civic: { label: '협동주택·현지개량', summary: '주민조합과 지방정부가 기존 공동체를 보존하며 개량합니다.', beneficiary: '세입자·지역상인·이주민 공동체', risk: '공급 속도와 사업 규모의 한계' },
      market: { label: '민간건설·주택금융', summary: '개발권과 장기금융으로 민간 공급을 촉진합니다.', beneficiary: '중산층·건설업·금융 부문', risk: '지가 상승과 투기, 비공식 정착지 확대' },
    },
  },
  transport: {
    id: 'transport',
    label: '교통·물류',
    shortLabel: '교통',
    description: '철도, 도로, 항만, 항공과 보급망을 민간 생활과 군사 지속성에 동시에 연결합니다.',
    destination: 'map',
    approaches: {
      public: { label: '국가 간선망', summary: '철도·항만·도로를 국가 우선순위에 따라 통합 투자합니다.', beneficiary: '전국 시장·군수 보급·내륙 지역', risk: '초대형 사업의 부채와 지역 편중' },
      civic: { label: '지역교통·공공운수', summary: '도시·지방 교통망과 노동자 통근을 먼저 연결합니다.', beneficiary: '통근자·지역기업·교통 소외지역', risk: '간선 수송력과 국제 연결의 부족' },
      market: { label: '민간 물류회랑', summary: '운임 경쟁과 민간 터미널로 물류 효율을 높입니다.', beneficiary: '수출기업·항만도시·물류기업', risk: '수익성 낮은 지역의 배제와 독점' },
    },
  },
  health: {
    id: 'health',
    label: '보건·돌봄',
    shortLabel: '보건',
    description: '병원만이 아니라 감시, 1차의료, 의약품, 돌봄과 공중의 신뢰를 다룹니다.',
    destination: 'health',
    approaches: {
      public: { label: '보편 보건망', summary: '국가가 1차의료, 병상과 필수의약품 접근을 보장합니다.', beneficiary: '전 국민·감염 취약층·농촌', risk: '상시 재정 부담과 중앙 병목' },
      civic: { label: '지역보건·상호부조', summary: '지역 보건요원과 비영리 병원, 직장·마을 보험을 연결합니다.', beneficiary: '농촌·노동 공동체·소수집단', risk: '지역별 서비스 격차' },
      market: { label: '보험·의료산업 혁신', summary: '보험시장과 제약·의료기기 투자를 확대합니다.', beneficiary: '전문 의료·제약 연구·보험 가입층', risk: '접근성 격차와 비용 상승' },
    },
  },
  education: {
    id: 'education',
    label: '교육·문화',
    shortLabel: '교육',
    description: '문해, 직업교육, 대학, 문화권과 세대 간 이동성을 함께 만듭니다.',
    destination: 'research',
    approaches: {
      public: { label: '보편 공교육망', summary: '무상 기초교육과 교원·도서관 체계를 전국에 확장합니다.', beneficiary: '아동·농촌·저소득 가구', risk: '획일적 교과와 높은 행정 수요' },
      civic: { label: '지역학교·문화자치', summary: '지역 언어, 공동체 학교와 평생학습을 제도화합니다.', beneficiary: '소수언어 공동체·성인 학습자·예술가', risk: '학력 기준과 재정의 지역 편차' },
      market: { label: '민간대학·기술훈련', summary: '산업 수요와 경쟁을 통해 고급인력 공급을 빠르게 늘립니다.', beneficiary: '전문직·기업·도시 중산층', risk: '교육비와 계층 재생산' },
    },
  },
  labor: {
    id: 'labor',
    label: '노동·사회보장',
    shortLabel: '노동',
    description: '임금, 노동시간, 조직권, 실업·연금과 생산성 협약을 함께 조정합니다.',
    destination: 'organization',
    approaches: {
      public: { label: '국가 고용·사회보험', summary: '최저기준, 실업보험과 공공고용을 국가가 보장합니다.', beneficiary: '실업자·산재 피해자·노년층', risk: '기여금 부담과 경직된 배치' },
      civic: { label: '노사정 공동결정', summary: '노조·기업·정부가 임금과 투자, 재훈련을 교섭합니다.', beneficiary: '조직 노동·숙련기업·지역경제', risk: '협상 지연과 비조직 노동의 소외' },
      market: { label: '유연고용·기업복지', summary: '채용 유연성과 기업별 보상을 통해 고용을 늘립니다.', beneficiary: '성장기업·청년 진입자·고숙련 인력', risk: '불안정 노동과 협상력 격차' },
    },
  },
  information: {
    id: 'information',
    label: '정보·미디어',
    shortLabel: '정보',
    description: '통신망, 언론, 검열, 개인정보, 선전과 공론장의 신뢰를 함께 다룹니다.',
    destination: 'intelligence',
    approaches: {
      public: { label: '공영 통신·책임보도', summary: '보편 통신과 독립된 공영매체, 정보공개 규칙을 만듭니다.', beneficiary: '전국 시청자·재난 대응·공공기관', risk: '정부 영향력과 관료적 편집' },
      civic: { label: '지역매체·디지털 공유지', summary: '지역 방송, 협동 플랫폼과 시민 검증망을 지원합니다.', beneficiary: '지역사회·소수집단·시민언론', risk: '재정 취약성과 정보 파편화' },
      market: { label: '상업미디어·플랫폼 경쟁', summary: '민간 투자와 광고시장으로 매체·통신망을 확장합니다.', beneficiary: '콘텐츠 산업·광고주·도시 이용자', risk: '소유 집중과 허위정보 유인' },
    },
  },
  environment: {
    id: 'environment',
    label: '환경·기후',
    shortLabel: '환경',
    description: '오염, 물, 산림, 재난, 감축과 적응 비용을 성장 전략에 내장합니다.',
    destination: 'governance',
    approaches: {
      public: { label: '국가 환경기준·대전환', summary: '배출기준과 공공투자로 산업·도시 체계를 전환합니다.', beneficiary: '오염 피해지역·미래세대·공공 인프라', risk: '전환 비용과 산업 반발' },
      civic: { label: '지역 생태복원·적응', summary: '유역·산림·해안 공동관리와 주민 주도 적응을 지원합니다.', beneficiary: '농어촌·재난 취약지역·원주민 공동체', risk: '국가 감축 규모와 속도의 한계' },
      market: { label: '탄소가격·녹색금융', summary: '가격과 공시, 민간금융으로 저탄소 투자를 유도합니다.', beneficiary: '청정기술 기업·금융시장·수출산업', risk: '비용 전가와 회계상 감축' },
    },
  },
  science: {
    id: 'science',
    label: '과학·첨단기술',
    shortLabel: '과학',
    description: '기초연구, 임무형 개발, 안전규범, 기술이전과 지식 접근을 함께 설계합니다.',
    destination: 'research',
    approaches: {
      public: { label: '국가 연구임무', summary: '국립연구소와 장기 임무에 자원과 인재를 집중합니다.', beneficiary: '기초과학·전략기술·공공 임무', risk: '군사화와 실패한 대형사업' },
      civic: { label: '대학·공개과학 연합', summary: '대학·학회·국제협력망이 지식과 시설을 공유합니다.', beneficiary: '연구자·학생·중소국 과학망', risk: '의사결정 분산과 보안 갈등' },
      market: { label: '기업 연구·모험자본', summary: '특허와 창업, 조달시장으로 응용기술을 빠르게 확산합니다.', beneficiary: '기술기업·발명가·고숙련 노동', risk: '독점과 기초연구·안전의 과소투자' },
    },
  },
  finance: {
    id: 'finance',
    label: '통화·금융',
    shortLabel: '금융',
    description: '화폐 신뢰, 중앙은행, 국채, 외환, 자본이동과 시민의 신용 접근을 하나의 체계로 다룹니다.',
    destination: 'economy',
    approaches: {
      public: { label: '공공통화·개발금융', summary: '중앙은행·국책은행·외환통제로 전쟁과 국가개발에 장기자금을 배분합니다.', beneficiary: '기간산업·주택사업·전략 수입 부문', risk: '정치적 대출, 인플레이션과 경직된 외환배분' },
      civic: { label: '협동금융·지역신용', summary: '신용협동조합·우편저축·지역은행으로 가계와 소기업의 금융 접근을 넓힙니다.', beneficiary: '농촌·노동가구·소상공인·협동조합', risk: '지역별 자본 격차와 감독 역량 부족' },
      market: { label: '민간은행·자본시장', summary: '상업은행·증권시장·외국자본 경쟁으로 투자와 환전의 속도를 높입니다.', beneficiary: '수출기업·투자자·신산업·국제금융도시', risk: '투기, 급격한 자본유출과 금융권력 집중' },
    },
  },
  justice: {
    id: 'justice',
    label: '헌정·사법',
    shortLabel: '사법',
    description: '헌법, 법원, 경찰 책임, 과거사, 지방권한과 권력자의 법적 책임을 함께 설계합니다.',
    destination: 'governance',
    approaches: {
      public: { label: '국가 법치·전문사법', summary: '통일 법전, 전문법관, 감사원과 독립 수사기관을 전국에 구축합니다.', beneficiary: '법적 보호가 약한 시민·공공행정·전국 시장', risk: '중앙 엘리트의 법 독점과 비상권한 상시화' },
      civic: { label: '참여사법·진실화해', summary: '배심·주민조정·피해자 참여·진실위원회와 지방자치를 결합합니다.', beneficiary: '전쟁피해자·소수집단·지역공동체·시민단체', risk: '느린 합의, 지역 편차와 정치적 재충돌' },
      market: { label: '상사법원·규제경쟁', summary: '계약 집행, 기업규제와 독립 중재를 통해 거래 신뢰와 투자를 높입니다.', beneficiary: '기업·전문직·투자자·무역 부문', risk: '경제권 보호가 사회권·형사정의보다 앞설 위험' },
    },
  },
  migration: {
    id: 'migration',
    label: '이주·시민권',
    shortLabel: '이주',
    description: '피난·귀환·노동이주·망명·국적·디아스포라를 인구 숫자가 아닌 권리와 국가형성 문제로 다룹니다.',
    destination: 'diplomacy',
    approaches: {
      public: { label: '국가 정착·시민권 체계', summary: '등록, 주택, 언어교육, 노동배치와 귀화 절차를 중앙정부가 보장합니다.', beneficiary: '난민·귀환병·무국적자·이산가족', risk: '강제동화, 감시와 관료적 대기열' },
      civic: { label: '지역후견·다중소속', summary: '지방정부·종교·노조·디아스포라가 정착과 문화권, 가족결합을 공동 보장합니다.', beneficiary: '소수민족·국경공동체·가족·망명 네트워크', risk: '지역별 권리 차이와 공동체 지도자의 문지기 권력' },
      market: { label: '노동이동·기술비자', summary: '기업 수요, 이민 점수와 국제자격 인정으로 인력 이동을 확대합니다.', beneficiary: '숙련이주자·성장기업·유학인재·고령사회', risk: '계층화된 시민권, 인재유출과 저임금 착취' },
    },
  },
  culture: {
    id: 'culture',
    label: '문화·기억',
    shortLabel: '문화',
    description: '언어, 종교, 예술, 체육, 전쟁기억, 유산과 대중문화가 정체성과 외교력에 미치는 영향을 다룹니다.',
    destination: 'governance',
    approaches: {
      public: { label: '국가문화·공공기억', summary: '박물관·방송·기념일·예술기관과 문화재 복구를 국가계획으로 지원합니다.', beneficiary: '전국 관객·전쟁피해지역·공공예술·교육기관', risk: '국가서사의 독점, 검열과 소수 기억의 삭제' },
      civic: { label: '지역언어·살아있는 유산', summary: '공동체가 언어·공예·의례·구술사·생활문화를 직접 기록하고 전승합니다.', beneficiary: '지역공동체·소수언어·예술가·종교집단', risk: '분절된 기억정치와 안정적 재원 부족' },
      market: { label: '문화산업·국제교류', summary: '영화·음악·출판·스포츠와 관광의 민간 생태계를 세계시장에 연결합니다.', beneficiary: '창작자·청년·관광도시·콘텐츠 기업', risk: '상업화, 소유집중과 인기 없는 문화의 소멸' },
    },
  },
  resilience: {
    id: 'resilience',
    label: '재난·민방위',
    shortLabel: '회복력',
    description: '공습·재난·기후·사이버 공격에 대비한 경보, 대피, 구조, 비축과 복구 책임을 설계합니다.',
    destination: 'command',
    approaches: {
      public: { label: '국가 민방위·비축망', summary: '통합경보, 대피시설, 구조대, 전략비축과 복구지휘를 국가가 운영합니다.', beneficiary: '대도시·핵심시설·재난취약계층·전시 후방', risk: '군사화, 높은 유지비와 중앙 지휘 실패의 단일점' },
      civic: { label: '지역 자율방재망', summary: '주민구조대·자원봉사·지역위험지도와 상호부조 비축을 연결합니다.', beneficiary: '농어촌·도서·주민조직·현장 대응자', risk: '지역 자원 격차와 초대형 재난 대응력 부족' },
      market: { label: '보험·민간복구 생태계', summary: '위험공시, 보험, 건축기준과 전문 복구산업으로 예방투자를 유도합니다.', beneficiary: '기업·주택소유자·기반시설 운영자·복구산업', risk: '보험 배제, 위험의 가격 전가와 저소득 지역 방치' },
    },
  },
};

const sources = {
  armyLogistics: { label: 'U.S. Army Center of Military History', url: 'https://history.army.mil/Publications/Publications-Catalog/Logistics-in-World-War-II/' },
  udhr: { label: 'United Nations · Universal Declaration of Human Rights', url: 'https://www.un.org/en/about-us/universal-declaration-of-human-rights' },
  imf: { label: 'International Monetary Fund · Bretton Woods timeline', url: 'https://www.imf.org/external/about/timeline/index.htm' },
  who: { label: 'World Health Organization · Constitution', url: 'https://www.who.int/about/governance/constitution' },
  whoMilestones: { label: 'World Health Organization · Public health milestones', url: 'https://www.who.int/campaigns/75-years-of-improving-public-health/milestones' },
  unesco: { label: 'UNESCO · Constitution', url: 'https://www.unesco.org/en/legal-affairs/constitution' },
  fao: { label: 'FAO · Lessons from the Green Revolution', url: 'https://www.fao.org/4/x0262e/x0262e06.htm' },
  habitat: { label: 'UN-Habitat · Housing', url: 'https://unhabitat.org/topic/housing' },
  itu: { label: 'International Telecommunication Union · History', url: 'https://www.itu.int/en/history/pages/ITUsHistory.aspx' },
  ituDivide: { label: 'International Telecommunication Union · Digital divide', url: 'https://www.itu.int/ITU-D/ict/publications/wtdr_02/material/WTDR02-Sum_E.pdf' },
  stockholm: { label: 'United Nations · Stockholm Conference 1972', url: 'https://www.un.org/en/conferences/environment/stockholm1972' },
  rio: { label: 'United Nations · Rio Declaration', url: 'https://www.un.org/esa/documents/ga/conf151/aconf15126-1.htm' },
  paris: { label: 'UNFCCC · Paris Agreement', url: 'https://www.unfccc.int/process-and-meetings/the-paris-agreement' },
  iaea: { label: 'International Atomic Energy Agency · Atoms for Peace', url: 'https://www.iaea.org/newscenter/news/atoms-should-be-peace' },
  nasa: { label: 'NASA · Apollo Program', url: 'https://www.nasa.gov/the-apollo-program/' },
  decolonization: { label: 'United Nations · Decolonization', url: 'https://www.un.org/en/global-issues/decolonization/' },
  iccpr: { label: 'OHCHR · International Covenant on Civil and Political Rights', url: 'https://2covenants.ohchr.org/About-ICCPR.html' },
  media: { label: 'UNESCO · Freedom of expression and media development', url: 'https://www.unesco.org/en/world-media-trends/about' },
  governance: { label: 'World Bank · Governance and the Law', url: 'https://www.worldbank.org/en/publication/wdr2017' },
  imfSystem: { label: 'IMF · International monetary system history', url: 'https://www.imf.org/-/media/files/news/seminars/strengthening-the-international-monetary-system-a-stocktaking.pdf' },
  ruleOfLaw: { label: 'United Nations · Rule of law and human rights', url: 'https://www.un.org/ruleoflaw/rule-of-law-and-human-rights/' },
  transitionalJustice: { label: 'OHCHR · Truth commissions and transitional justice', url: 'https://www.ohchr.org/Documents/Publications/RuleoflawTruthCommissionsen.pdf' },
  unhcr: { label: 'UNHCR · History of international refugee protection', url: 'https://www.unhcr.org/about-unhcr/overview/history-unhcr' },
  heritage: { label: 'UNESCO · World Heritage Convention', url: 'https://www.unesco.org/en/legal-affairs/convention-concerning-protection-world-cultural-and-natural-heritage' },
  intangibleHeritage: { label: 'UNESCO · Intangible cultural heritage', url: 'https://ich.unesco.org/en/working-towards-a-convention-00004' },
  civilDefence: { label: 'ICRC · Civil defence in international humanitarian law', url: 'https://www.icrc.org/en/document/civil-defence-international-humanitarian-law' },
  sendai: { label: 'UNDRR · Sendai Framework for Disaster Risk Reduction', url: 'https://www.undrr.org/implementing-sendai-framework/what-sendai-framework' },
} as const;

type SourceId = keyof typeof sources;
type ProgramSeed = [
  domainId: CivilizationDomainId,
  title: string,
  summary: string,
  historicalBasis: string,
  sourceId: SourceId,
  baseTreasuryCost: number,
  reviewWeeks: 4 | 13 | 26 | 52,
];

const programSeedsByEra: Record<CivilizationEraId, ProgramSeed[]> = {
  mobilization: [
    ['food', '전시 배급과 영양선', '군·도시·피난민의 배급을 생산·수송·영양 기준과 연결합니다.', '총력전의 식량 문제는 생산량만이 아니라 선박, 철도, 가격통제와 배급 신뢰의 문제였습니다.', 'armyLogistics', 48, 4],
    ['energy', '석탄·석유 전시배분', '발전소, 공장, 수송과 군 작전 사이에서 제한 연료의 우선순위를 정합니다.', '연료와 전력의 배분은 공장 가동률과 작전 지속시간을 동시에 결정했습니다.', 'armyLogistics', 56, 4],
    ['housing', '피난민·폭격 이재민 긴급주거', '대피소를 임시주택, 위생, 직장 접근과 전후 귀환 계획으로 확장합니다.', '전쟁이 만든 대규모 강제이동은 주거·보건·노동 배치를 하나의 문제로 만들었습니다.', 'udhr', 52, 13],
    ['transport', '철도·항만·상선 통합운영', '민간 물류와 군수수송의 시간표, 규격과 정비를 통합합니다.', '제2차 세계대전의 군수 연구는 공장부터 항만·선박·철도·전선까지 이어지는 체계를 강조합니다.', 'armyLogistics', 64, 13],
    ['health', '방역·야전의료 국가망', '질병감시, 예방접종, 혈액·의약품과 민군 병상 배분을 연결합니다.', '전시 이동과 밀집은 감염병 감시와 의료 물류를 국가안보의 일부로 만들었습니다.', 'whoMilestones', 50, 13],
    ['education', '전시 기술교육·문해 동원', '단기 직업훈련과 문해교육으로 생산·의료·통신 인력을 늘립니다.', '교육·과학·문화 협력은 전쟁 이후 평화를 구축할 핵심 제도로 구상되었습니다.', 'unesco', 44, 26],
    ['labor', '동원노동 권리협약', '징용·여성노동·군수노동의 임금, 안전과 전후 복귀 약속을 정합니다.', '노동권과 사회보장은 전시 동원의 정당성과 전후 사회계약을 좌우했습니다.', 'udhr', 46, 13],
    ['information', '라디오·공보·검열 규칙', '전시 정보보호와 언론 신뢰, 대국민 경보를 하나의 규칙으로 만듭니다.', '정보 통제는 작전보안에 도움을 주지만 장기적으로 공론장과 정부 신뢰에 비용을 남깁니다.', 'media', 42, 4],
    ['environment', '전시 산림·토양·수자원 보전', '단기 수탈이 전후 농업·수력·도시 복구를 파괴하지 않도록 한계를 둡니다.', '환경보호와 개발은 분리할 수 없으며 자원 고갈은 재건 비용으로 되돌아옵니다.', 'rio', 40, 26],
    ['science', '국가 과학동원위원회', '레이더·의학·암호·원자연구를 기초과학과 안전심사에 연결합니다.', '전시 임무형 연구는 빠른 혁신을 낳았지만 비밀주의와 군사화라는 경로 의존성도 만들었습니다.', 'iaea', 70, 26],
    ['finance', '전시금융·외환 배분위원회', '국채, 강제저축, 가격통제와 희소 외환을 군수·식량·연료 수입에 배분합니다.', '양차 대전 사이의 경쟁적 평가절하와 보호주의 경험은 1944년 국제통화 협력 구상의 직접 배경이 됐습니다.', 'imfSystem', 54, 4],
    ['justice', '비상권한·군사재판 통제령', '작전보안과 민간 사법, 구금심사와 점령지 책임 사이의 한계를 정합니다.', '전시에도 국가와 기관을 공개된 법, 동등한 적용과 책임 아래 두는 장치가 장기 정당성을 좌우합니다.', 'ruleOfLaw', 42, 13],
    ['migration', '피난·강제이동 등록망', '국경·항만·철도에서 피난민을 등록하고 가족추적, 배급, 임시국적과 귀환 선택을 연결합니다.', '제2차 세계대전의 대규모 강제이동과 무국적 문제는 전후 국제난민 보호체계의 출발점이 됐습니다.', 'unhcr', 48, 4],
    ['culture', '전시 문화재·기억 구조대', '폭격·약탈에서 기록물과 유산을 보호하고 점령선전과 지역 기억의 충돌을 관리합니다.', '전쟁과 사회변동이 문화유산을 파괴할 수 있다는 경험은 국제적 공동보호 제도의 필요성을 키웠습니다.', 'heritage', 38, 13],
    ['resilience', '공습경보·민간구호망', '대피소, 소방, 구조, 응급의료와 생필품 비축을 군 지휘와 분리된 민간 보호망으로 구성합니다.', '민방위는 전쟁수단의 발전이 민간인에게 가하는 손실과 고통을 줄이려는 국제인도법의 핵심 실천입니다.', 'civilDefence', 52, 4],
  ],
  reconstruction: [
    ['food', '배급 해제와 농지개혁', '전시 배급을 정상시장으로 전환하면서 토지와 영양 접근을 재설계합니다.', '전후 식량체계의 정당성은 생산 회복과 가격 안정, 농촌 권력 재편에 달려 있었습니다.', 'udhr', 58, 26],
    ['energy', '전국 전력화와 평화적 원자력', '수력·화력·원자력과 송전망을 산업·농촌 전력화 계획으로 묶습니다.', '평화적 원자력은 에너지·보건·농업의 기회와 확산·안전 위험을 함께 제기했습니다.', 'iaea', 82, 52],
    ['housing', '전후 대량주택 건설', '귀환병·피난민·도시 노동자를 위한 주택과 상하수도를 함께 공급합니다.', '적정 주거는 보건, 교육, 고용과 사회 참여의 기반입니다.', 'habitat', 76, 52],
    ['transport', '국토 재건 교통계획', '파괴된 철도·교량·항만을 국내 통합과 국제무역의 기준으로 복구합니다.', '재건 금융과 교통 투자는 생산 회복뿐 아니라 지역 권력의 재배치도 결정했습니다.', 'imf', 80, 52],
    ['health', '보편 보건체계 창설', '전염병 감시와 1차의료, 병원·의약품을 평시 제도로 정착시킵니다.', 'WHO 헌장은 건강을 신체·정신·사회적 안녕으로 보고 정부의 책임을 명시했습니다.', 'who', 68, 52],
    ['education', '무상교육·국립대학 확장', '기초교육, 교원 양성과 대학·직업학교를 전국 인재망으로 연결합니다.', 'UNESCO는 교육·과학·문화의 광범위한 확산을 평화의 제도적 기반으로 보았습니다.', 'unesco', 64, 52],
    ['labor', '사회보험과 단체교섭', '실업·산재·노령 보장과 노조·기업의 교섭 규칙을 제도화합니다.', '전후 사회계약은 노동권, 사회보장과 적정 생활수준을 국가의 책무로 넓혔습니다.', 'udhr', 62, 26],
    ['information', '공영방송과 정보공개', '전시 공보를 독립된 공영방송·의회감시·지역매체 체계로 전환합니다.', '자유로운 정보의 흐름과 독립적 언론은 평화와 책임정부의 기반으로 다뤄졌습니다.', 'unesco', 50, 26],
    ['environment', '도시 위생·유역 복구', '상하수도, 폐기물, 홍수와 산림복구를 재건계획에 포함합니다.', '건강한 생활은 주택·물·위생·환경 조건과 분리될 수 없습니다.', 'who', 58, 52],
    ['science', '국립연구소와 국제과학기구', '기초연구소, 표준기관과 국제 공동시설을 평시 체제로 만듭니다.', '전후 국제기구는 과학 지식의 평화적 이용과 광범위한 공유를 제도화하려 했습니다.', 'unesco', 76, 52],
    ['finance', '브레턴우즈·재건금융 선택', '환율제도, 외환통제, 재건차관과 중앙은행 독립 범위를 새 통화질서에 맞춥니다.', '브레턴우즈 체제는 조정 가능한 환율과 자본통제, 국제유동성 지원을 결합해 국내 재건 여지를 확보했습니다.', 'imfSystem', 72, 26],
    ['justice', '전범책임·신헌법·진실기록', '재판, 공직심사, 배상, 진실조사와 권리헌장을 어떤 순서와 범위로 시행할지 정합니다.', '과거사 위원회는 재판·배상·공직심사·재발방지와 함께 설계돼야 하며 피해자 참여가 정당성의 핵심입니다.', 'transitionalJustice', 58, 26],
    ['migration', '귀환·재정착·신국적 협약', '귀환권, 난민 정착, 국적 회복과 재산 반환을 주택·고용·교육 계획에 연결합니다.', '1950년 UNHCR과 1951년 난민협약은 전후 실향민 보호와 지속 가능한 해결책을 국제 규범으로 만들었습니다.', 'unhcr', 62, 26],
    ['culture', '폐허의 문화재건·공공기억', '학교·박물관·공연장·언어기관을 복구하고 점령·저항·학살의 공공기억 원칙을 세웁니다.', '전후 교육·과학·문화의 광범위한 확산은 평화를 제도화하는 과정으로 구상됐습니다.', 'unesco', 52, 26],
    ['resilience', '재건형 민방위·비축 전환', '전시 대피망을 홍수·지진·화재·산업사고에도 작동하는 평시 구조체계로 전환합니다.', '민간 보호조직은 점령 상황에서도 활동할 수 있도록 보호돼야 하며 평시 재난대응의 기반이 됩니다.', 'civilDefence', 66, 26],
  ],
  'mass-society': [
    ['food', '녹색혁명과 농촌개혁', '종자·관개·비료·연구와 토지·신용 제도를 하나의 농업전환으로 설계합니다.', 'FAO는 녹색혁명의 생산성 성과와 함께 관개·투입재 의존, 지역·계층 격차를 함께 지적합니다.', 'fao', 84, 52],
    ['energy', '대형 전력망과 에너지 안보', '석유·원자력·수력과 전국 송전망을 산업화 계획에 맞춥니다.', '대형 에너지망은 산업화를 가속했지만 외부 연료충격과 대형사고 위험도 집중시켰습니다.', 'iaea', 92, 52],
    ['housing', '도시화·신도시·슬럼 개선', '대규모 이촌에 맞춰 주택, 토지, 대중교통과 생활서비스를 함께 늘립니다.', '주거 접근은 고용·교육·보건 접근의 전제이며 도시화 정책의 중심입니다.', 'habitat', 86, 52],
    ['transport', '고속도로·항공·컨테이너 회랑', '국내 시장과 세계무역을 잇는 복합운송망을 구축합니다.', '표준화된 운송과 대형 간선망은 시장을 넓히지만 자동차·항만 중심의 지역 편중을 낳을 수 있습니다.', 'itu', 88, 52],
    ['health', '1차의료와 질병퇴치 캠페인', '지역보건요원, 예방접종과 국제 감시망을 전국 병원체계와 연결합니다.', 'WHO의 초기 활동은 결핵·말라리아·천연두 등 대규모 질병퇴치와 국제 감시에 집중했습니다.', 'whoMilestones', 72, 26],
    ['education', '대중 고등교육과 기술대학', '중등·대학 진학 확대와 산업 기술인력 양성을 함께 추진합니다.', '교육 접근 확대는 생산성·사회이동을 높이지만 학력 인플레이션과 지역 격차를 만들 수 있습니다.', 'udhr', 78, 52],
    ['labor', '완전고용·소득정책 협약', '노사정이 임금, 생산성, 복지와 산업전환을 장기 협약으로 조정합니다.', '정책 효과는 제도의 명칭보다 신뢰할 수 있는 약속·조정·협력 능력에 달려 있습니다.', 'governance', 70, 26],
    ['information', '텔레비전 대중사회 규칙', '전국 방송망의 교육·문화 기능과 정치광고·소유집중 규칙을 만듭니다.', '대중매체는 공통 경험을 만들지만 국가·상업 권력의 집중 통로가 될 수도 있습니다.', 'media', 60, 13],
    ['environment', '오염규제와 환경부 창설', '대기·수질·유해물질 기준과 독립된 측정·집행기관을 만듭니다.', '1972년 스톡홀름 회의는 환경을 세계적 의제로 올리고 평가·관리·국제협력 체계를 제안했습니다.', 'stockholm', 66, 52],
    ['science', '우주·컴퓨터·생명과학 임무', '국가 대형연구와 대학·기업의 파급효과를 연결합니다.', '아폴로 계획은 국가 목표, 과학 탐사, 산업기술과 인간의 우주활동 능력을 함께 추구했습니다.', 'nasa', 98, 52],
    ['finance', '개발은행·대중저축·외환산업화', '국내 저축과 외자를 기간산업·수출·주택에 배분하고 통화안정 장치를 함께 둡니다.', '고정환율과 자본통제가 유지된 전후 국제통화질서는 국가별 산업화 정책과 국제무역 확대를 함께 허용했습니다.', 'imfSystem', 82, 26],
    ['justice', '행정법원·시민권·지방분권', '팽창하는 개발국가를 법원이 심사하고 선거권·노동권·지역자치를 대중사회에 확장합니다.', '법치주의는 권력분립, 참여, 법적 확실성, 자의성 방지와 절차적 투명성을 함께 요구합니다.', 'ruleOfLaw', 68, 26],
    ['migration', '도시이주·탈식민 시민권', '농촌이주, 독립국 국적, 해외노동과 가족결합을 도시주택·직업훈련에 연결합니다.', '전후 난민보호는 유럽에 한정됐던 시간적 범위를 1967년 의정서로 넓히며 세계적 제도로 발전했습니다.', 'unhcr', 64, 26],
    ['culture', '대중방송·문화유산·국민정체성', '텔레비전·영화·체육과 국가유산을 지원하되 지역 언어와 소수 기억의 참여권을 보장합니다.', '1972년 세계유산협약은 문화와 자연유산을 국가계획과 국제협력 안에서 지속적으로 보호하도록 했습니다.', 'heritage', 60, 26],
    ['resilience', '산업도시 재난·핵대피 체계', '대형산업사고, 지진, 홍수와 핵위험에 대비해 경보·대피·의료·복구 훈련을 표준화합니다.', '민방위는 구조·의료·소방·대피 등 민간 보호업무를 전쟁과 대형위험 모두에 대비시키는 체계입니다.', 'civilDefence', 76, 26],
  ],
  globalization: [
    ['food', '세계 식량시장과 안전망', '수입 다변화·수출농업·영양지원과 전략 비축을 함께 설계합니다.', '세계시장 통합은 공급을 늘릴 수 있지만 가격·외환·운송 충격을 국내 식탁으로 전파합니다.', 'fao', 78, 26],
    ['energy', '효율혁명과 전력시장 개편', '에너지 효율, 연료 다변화와 발전시장 규칙을 다시 만듭니다.', '경쟁과 민간투자는 효율을 높일 수 있지만 규제 역량과 보편서비스 장치가 필요합니다.', 'governance', 86, 52],
    ['housing', '도시재생과 주택금융', '노후 도심 개량, 장기 주택금융과 세입자 보호를 조합합니다.', '주택의 금융자산화는 공급 자금을 늘리면서 가격 변동과 퇴거 위험도 키울 수 있습니다.', 'habitat', 82, 52],
    ['transport', '컨테이너·적시생산망', '항만 자동화, 항공화물과 국경 통관을 세계 공급망에 맞춥니다.', '초효율 물류는 재고 비용을 낮추지만 단일 회랑·공급자 중단에 대한 취약성을 만듭니다.', 'itu', 90, 26],
    ['health', 'HIV·신종감염 국제연대', '지역사회 예방, 치료 접근과 국제 연구·감시를 연결합니다.', '감염병 통제의 불균등은 모든 국가에 공통 위험이며 지식과 치료의 광범위한 접근이 중요합니다.', 'who', 76, 26],
    ['education', '보편 중등교육과 평생학습', '학교 보편화와 직업 전환교육, 국제 학술교류를 확대합니다.', '교육은 인간 발전과 경제 참여의 기반이며 전쟁·빈곤·성별 격차가 접근을 제한합니다.', 'udhr', 72, 52],
    ['labor', '산업전환·재훈련 사회협약', '무역개방과 자동화로 이동하는 노동을 소득보장·재훈련과 연결합니다.', '개혁은 권력 비대칭과 배제, 기득권 포획을 다루지 않으면 지속되기 어렵습니다.', 'governance', 74, 26],
    ['information', '위성·인터넷 공공규칙', '통신 자유화, 보편접속과 초기 인터넷의 개방 규칙을 결정합니다.', 'ITU는 통신 발전을 정부·기업·국제협력의 역사로 설명하며 보편적 혜택 확산을 임무로 둡니다.', 'itu', 80, 26],
    ['environment', '오존·리우 지속가능발전 체제', '국제협약과 국내 산업전환, 생물다양성·개발권을 함께 조정합니다.', '리우 선언은 환경보호가 개발 과정의 통합된 일부라고 명시했습니다.', 'rio', 72, 52],
    ['science', '반도체·바이오 혁신생태계', '대학 연구, 제조기반, 특허와 모험자본의 균형을 정합니다.', '첨단 혁신은 개방된 지식망과 장기 공공연구, 응용투자의 조합에 의존합니다.', 'unesco', 92, 52],
    ['finance', '금융개방·외환위기 안전망', '은행 자유화, 자본계정 개방, 예금보호와 국제 긴급유동성의 순서와 속도를 정합니다.', '변동환율과 금융통합은 자본 흐름을 확대했지만 국가·지역 금융안전망과 반복되는 위기도 함께 낳았습니다.', 'imfSystem', 78, 13],
    ['justice', '민주화·과거사·헌법재판', '권위주의 유산을 재판·진실·배상·공직개혁으로 처리하고 새 권력분립을 정착시킵니다.', '전환기의 진실기구는 국가별 맥락에 맞아야 하며 독립성과 피해자 참여, 다른 책임제도와의 연결이 필요합니다.', 'transitionalJustice', 66, 26],
    ['migration', '세계 노동이주·이중국적', '해외취업, 송금, 가족결합, 귀환과 디아스포라 투자를 시민권 체계와 연결합니다.', '국제난민 보호는 비호뿐 아니라 자발적 귀환·현지통합·제3국 재정착 같은 지속 가능한 해결책을 추구합니다.', 'unhcr', 62, 13],
    ['culture', '문화산업·세계유산·기억정치', '영화·음악·관광의 세계화를 유산보호, 창작권과 다원적 과거사 서사에 연결합니다.', '세계유산 체계는 보존뿐 아니라 연구·교육·공공참여와 국제재정 지원을 제도화했습니다.', 'heritage', 68, 26],
    ['resilience', '국가위기관리·기반시설 안전', '재난지도, 내진기준, 비상통신과 민관 복구협약을 국가계획과 예산에 통합합니다.', '재난위험 관리는 예방·완화·대비·대응·회복과 재건을 연결하는 국가·지역 거버넌스를 필요로 합니다.', 'sendai', 82, 26],
  ],
  networked: [
    ['food', '회복력 식량망과 정밀농업', '기후·분쟁·가격 충격에 대비해 데이터 농업, 비축과 공급처를 다변화합니다.', '생산성 기술은 식량안보를 높일 수 있지만 취약 농가의 자본·데이터 접근을 함께 해결해야 합니다.', 'fao', 86, 26],
    ['energy', '재생에너지·스마트그리드', '분산전원, 저장장치와 송전망을 탄소·안보 목표에 맞춰 통합합니다.', '저탄소 전환은 대규모 투자, 기술이전, 전력망과 공정한 비용 배분을 요구합니다.', 'paris', 96, 52],
    ['housing', '주거비 위기와 포용도시', '공공토지, 임대보호와 고밀도 교통도시를 함께 설계합니다.', '적정 주거는 건강·교육·안전·사회통합의 기반이며 기후와 강제이주가 위기를 키웁니다.', 'habitat', 92, 52],
    ['transport', '초연결 공급망 회복력', '디지털 통관과 자동화 물류에 이중조달·전략재고를 결합합니다.', '연결성은 성장을 촉진하지만 품질·접근·보안의 새로운 격차를 만들 수 있습니다.', 'ituDivide', 94, 26],
    ['health', '팬데믹 감시·백신 플랫폼', '유전체 감시, 병상, 백신·의약품 연구와 국제 정보공유를 구축합니다.', '국제 보건은 감시·과학·보편 접근과 대중의 신뢰를 동시에 필요로 합니다.', 'who', 104, 26],
    ['education', '디지털 교육과 평생 전환', '학교 연결망, 교사 역량과 성인 재훈련을 보편적 디지털 접근과 묶습니다.', '디지털 격차는 소득·지역·성별·교육 격차와 중첩되며 접속만으로 해결되지 않습니다.', 'ituDivide', 84, 26],
    ['labor', '플랫폼 노동·이동형 안전망', '고용형태와 무관하게 보험·훈련·협상권이 따라다니도록 만듭니다.', '새로운 고용 유연성은 기회를 늘리지만 보호와 협상력의 공백을 만들 수 있습니다.', 'udhr', 80, 26],
    ['information', '광대역·개방데이터·플랫폼 책임', '보편접속, 개인정보, 경쟁, 알고리즘 투명성과 언론 안전을 묶습니다.', '독립적이고 다원적인 언론과 정보 접근은 민주적 책임성과 지속가능발전의 조건입니다.', 'media', 90, 26],
    ['environment', '파리협정 감축·적응 계획', '5년 단위 목표, 투명성, 기후금융과 국내 적응사업을 연결합니다.', '파리협정은 각국 계획의 반복적 상향, 투명성 검토와 재정·기술·역량 지원을 제도화했습니다.', 'paris', 108, 52],
    ['science', '인공지능·우주·오픈사이언스', '공공 연구, 기업 혁신, 데이터 접근과 안전평가를 함께 설계합니다.', '과학 발전의 혜택을 공유할 권리와 창작·발명의 정당한 보호는 동시에 고려되어야 합니다.', 'udhr', 112, 52],
    ['finance', '거시건전성·디지털결제 공공망', '은행자본, 그림자금융, 국경간 자금, 디지털결제와 위기구제의 책임 규칙을 정합니다.', '세계 금융통합 이후 통화체제는 변동환율, 지역안전망과 금융안정 협력이라는 복합 구조로 변화했습니다.', 'imfSystem', 92, 13],
    ['justice', '플랫폼권력·데이터 기본권', '알고리즘 행정, 개인정보, 감시, 플랫폼 독점과 디지털 적법절차를 헌정질서에 편입합니다.', '현대 법치주의는 기술, 인간권리, 접근 가능한 사법과 국가를 포함한 모든 권력의 법적 책임을 요구합니다.', 'ruleOfLaw', 78, 26],
    ['migration', '난민분담·기후이주·도시통합', '대규모 강제이동의 분담, 신속보호, 취업·교육과 지역사회 수용력을 함께 계획합니다.', '국제난민 보호체계는 전쟁·박해의 변화에 따라 지역을 넘어 확장되며 장기 정착과 권리보장을 다뤘습니다.', 'unhcr', 84, 13],
    ['culture', '디지털문화·무형유산·창작권', '온라인 유통과 문화데이터를 지역 전승, 창작자 보상과 다언어 접근에 연결합니다.', '무형유산 보호는 공동체가 자신의 지식·기술·의례·공간을 살아 있는 문화로 인정하고 전승하는 데 초점을 둡니다.', 'intangibleHeritage', 74, 26],
    ['resilience', '복합재난·팬데믹 국가플랫폼', '보건·기후·사이버·공급망 위험을 공동상황실, 지방 플랫폼과 사전복구 재원으로 연결합니다.', '센다이 체계는 위험 이해, 거버넌스, 회복력 투자와 더 나은 복구를 네 가지 우선순위로 둡니다.', 'sendai', 96, 13],
  ],
  planetary: [
    ['food', '기후적응 식량·생태 농업', '내재해 품종, 토양·물 복원과 도시·해양 식량망을 결합합니다.', '미래 식량안보는 수확량뿐 아니라 생태 회복력과 취약 생산자의 접근권에 달려 있습니다.', 'fao', 106, 52],
    ['energy', '무탄소 초전력 문명', '재생·원자력·저장·차세대 전원과 국제 전력망의 통제원칙을 정합니다.', '에너지 기술은 안보·경쟁력·기후를 개선할 수 있지만 안전과 주권의 선택은 각 사회가 결정해야 합니다.', 'iaea', 126, 52],
    ['housing', '기후이주·회복도시 헌장', '해수면·폭염·인구이동에 맞춰 토지권, 냉방, 물과 새 도시를 설계합니다.', '주거·도시·환경은 기후변화의 원인이자 영향이며 취약한 사람의 권리를 중심에 둬야 합니다.', 'habitat', 118, 52],
    ['transport', '자율물류·대륙 회랑 안전규범', '무인 운송, 고속철·해운과 사이버·노동 안전 기준을 통합합니다.', '신기술의 혜택 확산에는 국제 표준과 공공·민간·지역사회의 협력이 필요합니다.', 'itu', 120, 26],
    ['health', '원헬스·유전체 방어망', '인간·동물·환경 감시와 신속 치료 설계, 공평한 접근을 연결합니다.', '한 국가의 보건 불균형은 공동 위험이며 과학지식의 광범위한 공유가 필수적입니다.', 'who', 122, 26],
    ['education', '인간-AI 평생교육 헌장', '기초문해부터 AI 협업·윤리·시민교육까지 평생 학습권을 보장합니다.', '교육은 인간의 전면적 발전과 자유·관용·평화를 강화해야 한다는 원칙을 미래 기술에 적용합니다.', 'udhr', 104, 26],
    ['labor', '자동화 배당·돌봄 사회계약', '생산성 이익을 소득, 노동시간, 돌봄과 재훈련으로 배분합니다.', '노동·휴식·사회보장 권리를 자동화 시대의 소득과 권력 배분에 다시 연결해야 합니다.', 'udhr', 110, 26],
    ['information', '주권형 디지털 공유지', '신원·데이터·AI 모델·양자통신의 공공성과 국제 상호운용 규칙을 정합니다.', '디지털 접근의 양뿐 아니라 품질, 권리, 신뢰와 권력 집중을 함께 다뤄야 합니다.', 'ituDivide', 116, 26],
    ['environment', '탄소음성·행성복원 계약', '감축, 제거, 생물다양성, 손실과 피해를 장기 재정계약으로 묶습니다.', '기후 대응은 과학 기반의 경제·사회 전환과 적응, 투명한 반복 검토를 요구합니다.', 'paris', 132, 52],
    ['science', '양자·합성생물·우주 거버넌스', '문명급 기술의 단계별 실험, 국제검증과 인간 통제 원칙을 만듭니다.', '우주와 원자력의 역사처럼 개척 기술은 국가 경쟁, 과학 탐사와 국제 규범이 동시에 형성합니다.', 'nasa', 140, 52],
    ['finance', '다중통화·자동재정 안정망', '중앙은행화폐, 지역결제권, 자동조세·배당과 국경간 위기유동성의 통제권을 배분합니다.', '통화질서는 고정환율·자본통제에서 변동체제·지역금융망으로 계속 변해 왔으며 미래에도 국내 자율성과 국제안정의 타협이 핵심입니다.', 'imfSystem', 126, 26],
    ['justice', '인간·AI 공동결정 헌정', '자동행정의 설명·이의제기권, 미래세대 대표와 초국가 법원의 권한 한계를 정합니다.', '법치는 기술이 바뀌어도 공개된 규칙, 동등한 적용, 독립 판단, 참여와 자의적 권력의 방지를 요구합니다.', 'ruleOfLaw', 116, 26],
    ['migration', '행성 이동권·다층 시민권', '기후·자동화·해외거주로 이동하는 사람에게 도시·국가·지역공동체의 권리와 의무를 조합합니다.', '난민보호의 역사는 제한된 전후 보호에서 보편적 지역 범위와 장기 해결책으로 확장돼 왔습니다.', 'unhcr', 112, 26],
    ['culture', '합성문화·기억보존 헌장', '가상공간·AI 창작·유전 기억과 지역 전통의 진위, 접근, 소유와 망각권을 정합니다.', '유산 정책은 기념물 중심에서 공동체·문화공간·살아 있는 지식과 기술을 포함하는 방향으로 확장됐습니다.', 'intangibleHeritage', 104, 26],
    ['resilience', '행성위험·분산복구 문명망', '초대형 기후·생물·사이버·우주 위험에 다중 거점, 공개 검증과 자동복구 자원을 배치합니다.', '재난위험 감축은 위험지식, 지역주도 대응, 선제투자와 복구 준비를 결합할 때 개발 성과를 지킬 수 있습니다.', 'sendai', 136, 26],
  ],
};

const emptyEffects = (): CivilizationEffects => ({
  game: {},
  economy: {},
  nation: {},
  publicHealth: {},
  relations: 0,
  researchProgress: 0,
});

const effect = (partial: Partial<CivilizationEffects>): CivilizationEffects => ({
  ...emptyEffects(),
  ...partial,
  game: partial.game ?? {},
  economy: partial.economy ?? {},
  nation: partial.nation ?? {},
  publicHealth: partial.publicHealth ?? {},
});

const effectSeeds: Record<CivilizationDomainId, Record<CivilizationApproachId, CivilizationEffects>> = {
  food: {
    public: effect({ game: { stability: 3, manpower: 18 }, economy: { inflation: -1.2, publicConfidence: 4 }, nation: { welfare: 4, inequality: -2, unrest: -2.5, institutionalCapacity: 1 } }),
    civic: effect({ game: { stability: 2, manpower: 30 }, economy: { publicConfidence: 3 }, nation: { employment: 3, inequality: -3, unrest: -2, tradeBalance: 1 } }),
    market: effect({ game: { manpower: 12 }, economy: { inflation: -0.5, publicConfidence: 2 }, nation: { civilianIndustry: 3, tradeBalance: 4, employment: 2, inequality: 1.5 } }),
  },
  energy: {
    public: effect({ game: { fuel: 18, factories: 1 }, economy: { debt: 1.3 }, nation: { infrastructure: 4, civilianIndustry: 2, ecologicalPressure: 1.5 } }),
    civic: effect({ game: { fuel: 11, stability: 2 }, economy: { publicConfidence: 2 }, nation: { infrastructure: 2, ecologicalPressure: -2, unrest: -1 } }),
    market: effect({ game: { fuel: 15, factories: 1 }, economy: { publicConfidence: 2 }, nation: { civilianIndustry: 4, tradeBalance: 2, inequality: 1 } }),
  },
  housing: {
    public: effect({ game: { stability: 3 }, economy: { debt: 1.5, publicConfidence: 3 }, nation: { housing: 7, welfare: 2, inequality: -1.5, unrest: -3 } }),
    civic: effect({ game: { stability: 2 }, economy: { publicConfidence: 3 }, nation: { housing: 5, employment: 3, unrest: -2.5, legitimacy: 2 } }),
    market: effect({ game: { factories: 1 }, economy: { publicConfidence: 2, inflation: 0.4 }, nation: { housing: 4, civilianIndustry: 4, employment: 2, inequality: 2 } }),
  },
  transport: {
    public: effect({ game: { fuel: 8, factories: 1, commandPoints: 2 }, economy: { debt: 1.4 }, nation: { infrastructure: 7, tradeBalance: 2, institutionalCapacity: 1 } }),
    civic: effect({ game: { stability: 1, commandPoints: 1 }, economy: { publicConfidence: 2 }, nation: { infrastructure: 4, employment: 3, inequality: -1, unrest: -1 } }),
    market: effect({ game: { fuel: 6, factories: 1 }, economy: { publicConfidence: 2 }, nation: { infrastructure: 4, civilianIndustry: 4, tradeBalance: 5, inequality: 1 } }),
  },
  health: {
    public: effect({ game: { stability: 3, manpower: 20 }, economy: { debt: 0.9, publicConfidence: 4 }, nation: { welfare: 4, inequality: -1.5, unrest: -2 }, publicHealth: { preparedness: 7, medicalCapacity: 8, publicTrust: 4, outbreakPressure: -4 } }),
    civic: effect({ game: { stability: 2, manpower: 16 }, economy: { publicConfidence: 3 }, nation: { welfare: 3, legitimacy: 2, unrest: -1.5 }, publicHealth: { preparedness: 6, surveillance: 5, medicalCapacity: 4, publicTrust: 6 } }),
    market: effect({ game: { manpower: 10 }, economy: { publicConfidence: 2 }, nation: { civilianIndustry: 3, relativeCompetitiveness: 3, inequality: 1.5 }, publicHealth: { medicalCapacity: 6, countermeasureProgress: 8, publicTrust: -1 } }),
  },
  education: {
    public: effect({ game: { stability: 2, politicalPower: 2 }, economy: { debt: 0.8, publicConfidence: 3 }, nation: { education: 7, institutionalCapacity: 3, inequality: -2, legitimacy: 1 }, researchProgress: 5 }),
    civic: effect({ game: { stability: 2, intelNetwork: 2 }, economy: { publicConfidence: 3 }, nation: { education: 5, legitimacy: 2, inequality: -1.5, unrest: -1.5 }, researchProgress: 4 }),
    market: effect({ game: { factories: 1 }, economy: { publicConfidence: 1 }, nation: { education: 5, civilianIndustry: 3, relativeCompetitiveness: 4, inequality: 1.5 }, researchProgress: 7 }),
  },
  labor: {
    public: effect({ game: { stability: 3, manpower: 25 }, economy: { debt: 0.7, publicConfidence: 3 }, nation: { employment: 5, welfare: 3, inequality: -3, unrest: -3 } }),
    civic: effect({ game: { stability: 3, factories: 1 }, economy: { publicConfidence: 4 }, nation: { employment: 4, inequality: -2, legitimacy: 2, civilianIndustry: 2 } }),
    market: effect({ game: { factories: 1, manpower: 18 }, economy: { publicConfidence: 1 }, nation: { employment: 5, civilianIndustry: 4, relativeCompetitiveness: 3, inequality: 2.5, unrest: 1 } }),
  },
  information: {
    public: effect({ game: { intelNetwork: 6, stability: 2, politicalPower: 2 }, economy: { publicConfidence: 3 }, nation: { institutionalCapacity: 3, legitimacy: 2, unrest: -1 }, relations: 1 }),
    civic: effect({ game: { intelNetwork: 5, stability: 3, politicalPower: 2 }, economy: { publicConfidence: 4 }, nation: { legitimacy: 3, unrest: -2, inequality: -1 }, relations: 2 }),
    market: effect({ game: { intelNetwork: 4, factories: 1 }, economy: { publicConfidence: 1 }, nation: { civilianIndustry: 4, relativeCompetitiveness: 3, inequality: 1.5 }, relations: 1 }),
  },
  environment: {
    public: effect({ game: { stability: 2, fuel: -3 }, economy: { debt: 1, inflation: 0.4, publicConfidence: 2 }, nation: { ecologicalPressure: -7, infrastructure: 3, legitimacy: 2, civilianIndustry: -1 }, relations: 2 }),
    civic: effect({ game: { stability: 3 }, economy: { publicConfidence: 3 }, nation: { ecologicalPressure: -6, unrest: -2, employment: 2, legitimacy: 2 }, relations: 1 }),
    market: effect({ game: { factories: 1 }, economy: { publicConfidence: 1 }, nation: { ecologicalPressure: -4, civilianIndustry: 4, tradeBalance: 3, inequality: 1 }, relations: 2 }),
  },
  science: {
    public: effect({ game: { factories: 1, politicalPower: 2, intelNetwork: 2 }, economy: { debt: 1.1 }, nation: { education: 3, institutionalCapacity: 3, relativeCompetitiveness: 4, civilianIndustry: 2 }, researchProgress: 10 }),
    civic: effect({ game: { intelNetwork: 3, stability: 1 }, economy: { publicConfidence: 2 }, nation: { education: 4, legitimacy: 1, relativeCompetitiveness: 3 }, relations: 3, researchProgress: 9 }),
    market: effect({ game: { factories: 2 }, economy: { publicConfidence: 1 }, nation: { civilianIndustry: 5, relativeCompetitiveness: 6, inequality: 1.5 }, researchProgress: 12 }),
  },
  finance: {
    public: effect({ game: { politicalPower: 2, stability: 2 }, economy: { inflation: -1.4, debt: 1, publicConfidence: 3 }, nation: { institutionalCapacity: 3, civilianIndustry: 2, tradeBalance: 2, inequality: -1 } }),
    civic: effect({ game: { stability: 2, manpower: 8 }, economy: { inflation: -.5, publicConfidence: 4 }, nation: { employment: 3, inequality: -2, legitimacy: 2, civilianIndustry: 1 } }),
    market: effect({ game: { factories: 1 }, economy: { inflation: .5, debt: -.8, publicConfidence: 1 }, nation: { civilianIndustry: 5, tradeBalance: 5, relativeCompetitiveness: 5, inequality: 2.5, unrest: 1 } }),
  },
  justice: {
    public: effect({ game: { politicalPower: 3, stability: 2, intelNetwork: 2 }, economy: { publicConfidence: 2 }, nation: { institutionalCapacity: 6, legitimacy: 3, unrest: -2, inequality: -1 }, relations: 2 }),
    civic: effect({ game: { stability: 3, politicalPower: 2 }, economy: { publicConfidence: 4 }, nation: { legitimacy: 5, unrest: -4, institutionalCapacity: 3, inequality: -2 }, relations: 3 }),
    market: effect({ game: { factories: 1, politicalPower: 1 }, economy: { publicConfidence: 3 }, nation: { institutionalCapacity: 4, civilianIndustry: 3, tradeBalance: 3, relativeCompetitiveness: 3, inequality: 1 }, relations: 2 }),
  },
  migration: {
    public: effect({ game: { manpower: 35, stability: 2 }, economy: { debt: .7, publicConfidence: 2 }, nation: { housing: 2, employment: 3, welfare: 2, legitimacy: 2, demographicPressure: -4, unrest: -1 }, relations: 2 }),
    civic: effect({ game: { manpower: 28, intelNetwork: 2, stability: 3 }, economy: { publicConfidence: 3 }, nation: { housing: 2, employment: 2, legitimacy: 3, demographicPressure: -3, inequality: -1.5 }, relations: 4 }),
    market: effect({ game: { manpower: 42, factories: 1 }, economy: { publicConfidence: 1 }, nation: { employment: 4, civilianIndustry: 4, relativeCompetitiveness: 4, demographicPressure: -2, inequality: 2, unrest: 1 }, relations: 2 }),
  },
  culture: {
    public: effect({ game: { stability: 3, politicalPower: 2 }, economy: { debt: .5, publicConfidence: 3 }, nation: { education: 2, legitimacy: 4, unrest: -2, institutionalCapacity: 1 }, relations: 3 }),
    civic: effect({ game: { stability: 4, intelNetwork: 1 }, economy: { publicConfidence: 4 }, nation: { education: 3, legitimacy: 4, unrest: -3, inequality: -1 }, relations: 4 }),
    market: effect({ game: { factories: 1 }, economy: { publicConfidence: 2 }, nation: { civilianIndustry: 4, tradeBalance: 4, employment: 3, relativeCompetitiveness: 3, inequality: 1 }, relations: 5 }),
  },
  resilience: {
    public: effect({ game: { stability: 4, manpower: 18, commandPoints: 3, fuel: 4 }, economy: { debt: 1, publicConfidence: 3 }, nation: { infrastructure: 4, institutionalCapacity: 4, unrest: -2, ecologicalPressure: -2 }, publicHealth: { preparedness: 5, medicalCapacity: 2 } }),
    civic: effect({ game: { stability: 4, manpower: 14, commandPoints: 2 }, economy: { publicConfidence: 4 }, nation: { infrastructure: 2, legitimacy: 3, unrest: -3, ecologicalPressure: -2 }, publicHealth: { preparedness: 4, publicTrust: 4 } }),
    market: effect({ game: { factories: 1, commandPoints: 2 }, economy: { publicConfidence: 2 }, nation: { infrastructure: 3, civilianIndustry: 3, employment: 2, inequality: 1.5, ecologicalPressure: -1 }, publicHealth: { preparedness: 2 } }),
  },
};

export const nationCivilizationProfiles: Record<NationId, NationCivilizationProfile> = {
  britain: { nationId: 'britain', stateCapacity: 78, civicCapacity: 76, marketDepth: 82, strengths: ['information', 'science', 'transport', 'finance'], constraints: ['housing', 'energy', 'migration'], historicalAnchor: '의회·지방정부·제국망과 복지국가 전환이 공존해 공공서비스와 해외 네트워크의 균형이 핵심입니다.' },
  usa: { nationId: 'usa', stateCapacity: 76, civicCapacity: 72, marketDepth: 94, strengths: ['energy', 'science', 'transport', 'finance'], constraints: ['housing', 'labor', 'justice'], historicalAnchor: '대륙 규모의 산업·시장·대학 기반이 강하지만 연방·지역·인종·계층 격차가 정책 효과를 다르게 만듭니다.' },
  ussr: { nationId: 'ussr', stateCapacity: 91, civicCapacity: 48, marketDepth: 34, strengths: ['energy', 'education', 'science', 'resilience'], constraints: ['food', 'information', 'finance'], historicalAnchor: '계획·동원·대형 과학사업 능력이 강하지만 지역 지식과 공개된 피드백이 약해 병목이 누적될 수 있습니다.' },
  germany: { nationId: 'germany', stateCapacity: 84, civicCapacity: 58, marketDepth: 80, strengths: ['science', 'labor', 'transport', 'finance'], constraints: ['housing', 'environment', 'justice'], historicalAnchor: '고숙련 산업과 행정 기반이 강하지만 전쟁·체제붕괴·분단 여부가 제도 연속성을 크게 바꿉니다.' },
  japan: { nationId: 'japan', stateCapacity: 82, civicCapacity: 61, marketDepth: 84, strengths: ['transport', 'education', 'science', 'resilience'], constraints: ['energy', 'housing', 'migration'], historicalAnchor: '고밀도 도시·산업조직과 기술학습 능력이 강하지만 에너지·식량 수입과 재난 노출이 전략을 제한합니다.' },
  china: { nationId: 'china', stateCapacity: 64, civicCapacity: 59, marketDepth: 53, strengths: ['food', 'labor', 'transport', 'resilience'], constraints: ['health', 'housing', 'justice'], historicalAnchor: '광대한 농촌·지역 다양성과 전쟁 피해 때문에 중앙계획의 규모와 현지 실행 능력 사이의 간극이 중요합니다.' },
  india: { nationId: 'india', stateCapacity: 58, civicCapacity: 74, marketDepth: 61, strengths: ['food', 'education', 'information', 'culture'], constraints: ['health', 'transport', 'finance'], historicalAnchor: '민주적 다원성과 과학·행정 인재가 강점이지만 식민지 유산, 농촌 빈곤과 대륙 규모의 서비스 격차가 큽니다.' },
  freefrance: { nationId: 'freefrance', stateCapacity: 67, civicCapacity: 71, marketDepth: 70, strengths: ['transport', 'education', 'health', 'justice'], constraints: ['housing', 'energy', 'migration'], historicalAnchor: '망명·저항 네트워크를 해방 후 정통성과 공화국 행정으로 전환하는 과정이 모든 사업의 효과를 좌우합니다.' },
  italy: { nationId: 'italy', stateCapacity: 62, civicCapacity: 68, marketDepth: 69, strengths: ['food', 'housing', 'labor', 'culture'], constraints: ['energy', 'transport', 'finance'], historicalAnchor: '도시·농촌과 남북 격차, 강한 지방사회가 중앙 개발계획의 속도와 정당성을 함께 결정합니다.' },
  korea: { nationId: 'korea', stateCapacity: 46, civicCapacity: 78, marketDepth: 43, strengths: ['education', 'information', 'labor', 'culture'], constraints: ['housing', 'transport', 'finance'], historicalAnchor: '식민지 지배와 분단 위험 속에서 국내망·망명정부·지역조직을 주권국가의 공공제도로 바꾸는 것이 핵심입니다.' },
  vietnam: { nationId: 'vietnam', stateCapacity: 48, civicCapacity: 76, marketDepth: 40, strengths: ['food', 'labor', 'information', 'resilience'], constraints: ['health', 'transport', 'finance'], historicalAnchor: '농촌 조직과 독립운동의 동원력은 강하지만 장기전·식민지 경제와 파괴된 기반시설이 민생 전환을 어렵게 합니다.' },
  indonesia: { nationId: 'indonesia', stateCapacity: 43, civicCapacity: 73, marketDepth: 52, strengths: ['food', 'information', 'labor', 'migration'], constraints: ['transport', 'health', 'resilience'], historicalAnchor: '군도·다언어 사회에서 항로, 지방대표성과 공통 행정표준을 함께 세워야 국가 사업이 실제로 도달합니다.' },
  philippines: { nationId: 'philippines', stateCapacity: 51, civicCapacity: 69, marketDepth: 63, strengths: ['information', 'education', 'housing', 'migration'], constraints: ['transport', 'energy', 'resilience'], historicalAnchor: '군도 물류와 식민지 제도, 지방 엘리트 권력이 보편서비스와 시장개방의 수혜 분포를 좌우합니다.' },
};

const validDomainIds = new Set<CivilizationDomainId>(Object.keys(civilizationDomainDefinitions) as CivilizationDomainId[]);

export const civilizationPrograms: CivilizationProgram[] = civilizationEras.flatMap((era) => (
  programSeedsByEra[era.id].map(([domainId, title, summary, historicalBasis, sourceId, baseTreasuryCost, reviewWeeks]) => {
    const source = sources[sourceId];
    return {
      id: `${era.id}-${domainId}`,
      eraId: era.id,
      domainId,
      title,
      summary,
      historicalBasis,
      sourceLabel: source.label,
      sourceUrl: source.url,
      baseTreasuryCost,
      reviewWeeks,
    };
  })
));

const branchDomains: Record<CareerRole['branch'], CivilizationDomainId[]> = {
  politics: ['food', 'housing', 'health', 'education', 'labor', 'environment', 'finance', 'justice', 'migration', 'culture'],
  military: ['energy', 'transport', 'health', 'science', 'resilience', 'migration'],
  intelligence: ['information', 'science', 'education', 'transport', 'finance', 'justice', 'migration', 'culture', 'resilience'],
};

const authorityLabels: Record<CivilizationAuthorityMode, string> = {
  direct: '직접 결재',
  ministerial: '부처 협의',
  proposal: '상신·연합 구축',
};

const authorityNotes: Record<CivilizationAuthorityMode, string> = {
  direct: '현재 직무가 이 분야의 집행권 또는 국가 전체 조정권을 보유합니다.',
  ministerial: '관할 부처와 합의가 필요해 정치 비용이 늘지만 효과는 거의 유지됩니다.',
  proposal: '직접 집행권이 없어 지지연합을 먼저 만들어야 하며 초기 효과가 제한됩니다.',
};

function getAuthorityMode(role: CareerRole, domainId: CivilizationDomainId): CivilizationAuthorityMode {
  if (role.tier === 1) return 'direct';
  const branchMatch = branchDomains[role.branch].includes(domainId);
  if (branchMatch && role.tier <= 3) return 'direct';
  if (role.tier <= 2) return 'ministerial';
  return 'proposal';
}

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function scaleRecord<T extends string>(record: Partial<Record<T, number>>, multiplier: number) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [
    key,
    round((typeof value === 'number' ? value : 0) * multiplier),
  ])) as Partial<Record<T, number>>;
}

function scaleEffects(effects: CivilizationEffects, multiplier: number): CivilizationEffects {
  return {
    game: scaleRecord(effects.game, multiplier),
    economy: scaleRecord(effects.economy, multiplier),
    nation: scaleRecord(effects.nation, multiplier),
    publicHealth: scaleRecord(effects.publicHealth, multiplier),
    relations: round(effects.relations * multiplier),
    researchProgress: round(effects.researchProgress * multiplier),
  };
}

export function getCivilizationEra(year: number) {
  return civilizationEras.find((era) => year >= era.startYear && year <= era.endYear)
    ?? (year < civilizationEras[0].startYear ? civilizationEras[0] : civilizationEras[civilizationEras.length - 1]);
}

export function getCivilizationPrograms(year: number) {
  const era = getCivilizationEra(year);
  return civilizationPrograms.filter((program) => program.eraId === era.id);
}

export function getCivilizationProgram(programId: string) {
  return civilizationPrograms.find((program) => program.id === programId) ?? null;
}

export function getCivilizationDecisionPrefix(programId: string) {
  return `civilization:${programId}:`;
}

export function getCivilizationDecisionId(programId: string, approachId: CivilizationApproachId) {
  return `${getCivilizationDecisionPrefix(programId)}${approachId}`;
}

export interface CivilizationReviewSchedule {
  dueWeek: number;
  programId: string;
  approachId: CivilizationApproachId;
}

export function getCivilizationReviewMarker(path: Pick<CivilizationPath, 'programId' | 'approachId'>, dueWeek: number) {
  return `civilization-review:${Math.max(0, Math.floor(dueWeek))}:${path.programId}:${path.approachId}`;
}

export function getCivilizationReviewedMarker(schedule: CivilizationReviewSchedule) {
  return `civilization-reviewed:${schedule.dueWeek}:${schedule.programId}:${schedule.approachId}`;
}

export function parseCivilizationReviewMarker(value: string): CivilizationReviewSchedule | null {
  const match = /^civilization-review:(\d+):([^:]+):(public|civic|market)$/.exec(value);
  if (!match) return null;
  return {
    dueWeek: Number(match[1]),
    programId: match[2],
    approachId: match[3] as CivilizationApproachId,
  };
}

export function getCompletedCivilizationApproach(programId: string, completedDecisions: string[]) {
  const prefix = getCivilizationDecisionPrefix(programId);
  const decision = completedDecisions.find((id) => id.startsWith(prefix));
  const approachId = decision?.slice(prefix.length) as CivilizationApproachId | undefined;
  return approachId && ['public', 'civic', 'market'].includes(approachId) ? approachId : null;
}

export function getCivilizationPaths(program: CivilizationProgram, nationId: NationId, role: CareerRole): CivilizationPath[] {
  const profile = nationCivilizationProfiles[nationId];
  const domain = civilizationDomainDefinitions[program.domainId];
  const authorityMode = getAuthorityMode(role, program.domainId);
  const eraIndex = civilizationEras.findIndex((era) => era.id === program.eraId);
  const domainMultiplier = profile.strengths.includes(program.domainId) ? 1.1 : profile.constraints.includes(program.domainId) ? 0.88 : 1;
  const authorityMultiplier = authorityMode === 'direct' ? 1 : authorityMode === 'ministerial' ? 0.94 : 0.82;
  const authorityPoliticalCost = authorityMode === 'direct' ? 0 : authorityMode === 'ministerial' ? 3 : 6;
  const approachScores: Record<CivilizationApproachId, number> = {
    public: profile.stateCapacity,
    civic: profile.civicCapacity,
    market: profile.marketDepth,
  };
  const costMultipliers: Record<CivilizationApproachId, number> = { public: 1.12, civic: 0.88, market: 0.68 };

  return (['public', 'civic', 'market'] as CivilizationApproachId[]).map((approachId) => {
    const approach = domain.approaches[approachId];
    const institutionalMultiplier = 0.82 + approachScores[approachId] / 300;
    const effectiveness = domainMultiplier * authorityMultiplier * institutionalMultiplier;
    const capacityForCost = approachId === 'public' ? profile.stateCapacity : approachId === 'civic' ? profile.civicCapacity : profile.marketDepth;
    const treasuryCost = Math.max(12, Math.round(program.baseTreasuryCost * costMultipliers[approachId] * (1.14 - capacityForCost / 360)));
    return {
      id: getCivilizationDecisionId(program.id, approachId),
      programId: program.id,
      approachId,
      label: approach.label,
      summary: approach.summary,
      beneficiary: approach.beneficiary,
      risk: approach.risk,
      authorityMode,
      authorityLabel: authorityLabels[authorityMode],
      authorityNote: authorityNotes[authorityMode],
      politicalCost: 6 + eraIndex + authorityPoliticalCost + (approachId === 'public' ? 2 : approachId === 'civic' ? 1 : 0),
      treasuryCost,
      reviewWeeks: program.reviewWeeks,
      effectiveness: Math.round(effectiveness * 100),
      effects: scaleEffects(effectSeeds[program.domainId][approachId], effectiveness),
    };
  });
}

const effectLabels: Array<{
  surface: keyof Pick<CivilizationEffects, 'game' | 'economy' | 'nation' | 'publicHealth'>;
  key: string;
  label: string;
  reversed?: boolean;
}> = [
  { surface: 'game', key: 'stability', label: '안정도' },
  { surface: 'game', key: 'factories', label: '공장' },
  { surface: 'game', key: 'fuel', label: '연료' },
  { surface: 'game', key: 'manpower', label: '인력' },
  { surface: 'game', key: 'intelNetwork', label: '정보망' },
  { surface: 'game', key: 'politicalPower', label: '정치력' },
  { surface: 'game', key: 'commandPoints', label: '지휘력' },
  { surface: 'economy', key: 'inflation', label: '물가', reversed: true },
  { surface: 'economy', key: 'publicConfidence', label: '경제신뢰' },
  { surface: 'economy', key: 'debt', label: '부채', reversed: true },
  { surface: 'nation', key: 'welfare', label: '복지' },
  { surface: 'nation', key: 'legitimacy', label: '정당성' },
  { surface: 'nation', key: 'infrastructure', label: '기반시설' },
  { surface: 'nation', key: 'institutionalCapacity', label: '제도역량' },
  { surface: 'nation', key: 'education', label: '교육' },
  { surface: 'nation', key: 'housing', label: '주거' },
  { surface: 'nation', key: 'employment', label: '고용' },
  { surface: 'nation', key: 'inequality', label: '불평등', reversed: true },
  { surface: 'nation', key: 'unrest', label: '사회불안', reversed: true },
  { surface: 'nation', key: 'civilianIndustry', label: '민간산업' },
  { surface: 'nation', key: 'tradeBalance', label: '무역' },
  { surface: 'nation', key: 'relativeCompetitiveness', label: '경쟁력' },
  { surface: 'nation', key: 'demographicPressure', label: '인구압력', reversed: true },
  { surface: 'nation', key: 'ecologicalPressure', label: '생태압력', reversed: true },
  { surface: 'publicHealth', key: 'preparedness', label: '보건대비' },
  { surface: 'publicHealth', key: 'medicalCapacity', label: '의료역량' },
  { surface: 'publicHealth', key: 'publicTrust', label: '보건신뢰' },
  { surface: 'publicHealth', key: 'outbreakPressure', label: '유행압력', reversed: true },
];

export function getCivilizationEffectLabels(path: CivilizationPath, limit = 5) {
  const labels = effectLabels.flatMap((definition) => {
    const value = path.effects[definition.surface][definition.key as never] as number | undefined;
    if (!value) return [];
    const favorable = definition.reversed ? value < 0 : value > 0;
    return [{
      label: definition.label,
      value,
      favorable,
      text: `${definition.label} ${value > 0 ? '+' : ''}${value}`,
    }];
  });
  if (path.effects.relations) labels.push({ label: '대외관계', value: path.effects.relations, favorable: path.effects.relations > 0, text: `대외관계 ${path.effects.relations > 0 ? '+' : ''}${path.effects.relations}` });
  if (path.effects.researchProgress) labels.push({ label: '연구진척', value: path.effects.researchProgress, favorable: true, text: `연구진척 +${path.effects.researchProgress}` });
  return labels
    .sort((left, right) => Number(right.favorable) - Number(left.favorable) || Math.abs(right.value) - Math.abs(left.value))
    .slice(0, limit);
}

export function countCivilizationEffectSurfaces(path: CivilizationPath) {
  return [
    Object.keys(path.effects.game).length > 0,
    Object.keys(path.effects.economy).length > 0,
    Object.keys(path.effects.nation).length > 0,
    Object.keys(path.effects.publicHealth).length > 0,
    path.effects.relations !== 0,
    path.effects.researchProgress !== 0,
  ].filter(Boolean).length;
}

function applyBoundedRecord<T extends object>(
  current: T,
  delta: Partial<Record<string, number>>,
  bounds: Partial<Record<string, [number, number]>>,
) {
  const next = { ...current };
  const writable = next as unknown as Record<string, unknown>;
  Object.entries(delta).forEach(([key, amount]) => {
    if (typeof amount !== 'number' || typeof writable[key] !== 'number') return;
    const [minimum, maximum] = bounds[key] ?? [0, 100];
    writable[key] = clamp((writable[key] as number) + amount, minimum, maximum);
  });
  return next;
}

export function applyCivilizationEconomyEffects(current: EconomyState, path: CivilizationPath) {
  return applyBoundedRecord(current, path.effects.economy, {
    debt: [0, 500],
    inflation: [0, 100],
    publicConfidence: [0, 100],
  });
}

export function applyCivilizationNationEffects(current: NationManagementState, path: CivilizationPath) {
  return applyBoundedRecord(current, path.effects.nation, {
    tradeBalance: [-100, 100],
    ecologicalPressure: [0, 100],
    demographicPressure: [0, 100],
  });
}

export function applyCivilizationPublicHealthEffects(current: PublicHealthState, path: CivilizationPath) {
  return applyBoundedRecord(current, path.effects.publicHealth, {
    outbreakPressure: [0, 100],
    countermeasureProgress: [0, 100],
  });
}

export function isCivilizationDomainId(value: string): value is CivilizationDomainId {
  return validDomainIds.has(value as CivilizationDomainId);
}
