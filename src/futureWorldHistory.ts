import type {
  WorldHistoryCategory,
  WorldHistoryEra,
  WorldHistoryEvent,
  WorldHistoryVariant,
  WorldMetric,
} from './worldHistory';

type Citation = readonly [string, string];
type FuturePattern = 'cooperation' | 'competition' | 'rights' | 'resilience' | 'security';

interface FutureScenarioSpec {
  id: string;
  title: string;
  year: number;
  era: WorldHistoryEra;
  category: WorldHistoryCategory;
  historicalBasis: string;
  source: Citation;
  pattern: FuturePattern;
  triggerTags: string[];
  outcomes: readonly [string, string, string];
}

const sources = {
  ai: ['OECD · 인공지능 원칙', 'https://oecd.ai/en/ai-principles'] as Citation,
  climate: ['UNFCCC · 파리협정과 국가 기후행동', 'https://unfccc.int/process-and-meetings/the-paris-agreement'] as Citation,
  disasters: ['UNDRR · 센다이 재난위험경감체계', 'https://www.undrr.org/implementing-sendai-framework/what-sendai-framework'] as Citation,
  health: ['WHO · 세계 공중보건 주요 사건', 'https://www.who.int/campaigns/75-years-of-improving-public-health/milestones'] as Citation,
  ageing: ['WHO · 건강한 고령화 10년', 'https://www.who.int/initiatives/decade-of-healthy-ageing'] as Citation,
  nuclear: ['IAEA · 평화적 원자력과 국제 사찰', 'https://www.iaea.org/newscenter/news/atoms-should-be-peace'] as Citation,
  space: ['UN 우주사무국 · 우주조약', 'https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/outerspacetreaty.html'] as Citation,
  trade: ['WTO · 다자무역체제', 'https://www.wto.org/english/thewto_e/history_e/history_e.htm'] as Citation,
  migration: ['UNHCR · 난민보호 체제', 'https://www.unhcr.org/about-unhcr/who-we-are/history-unhcr'] as Citation,
  rights: ['유엔 · 세계인권선언', 'https://www.un.org/en/about-us/universal-declaration-of-human-rights/'] as Citation,
} as const;

const patternDeltas: Record<FuturePattern, readonly [
  Partial<Record<WorldMetric, number>>,
  Partial<Record<WorldMetric, number>>,
  Partial<Record<WorldMetric, number>>,
]> = {
  cooperation: [
    { prosperity: 4, multipolarity: 2, instability: -2 },
    { prosperity: 7, rights: 5, multipolarity: 5, instability: -6 },
    { deterrence: 4, multipolarity: 8, instability: 7 },
  ],
  competition: [
    { prosperity: 5, deterrence: 3, instability: 2 },
    { prosperity: 6, rights: 4, multipolarity: 4, instability: -3 },
    { deterrence: 8, prosperity: -3, rights: -5, instability: 9 },
  ],
  rights: [
    { rights: 5, prosperity: 2, instability: 1 },
    { rights: 9, multipolarity: 3, instability: -5 },
    { rights: -8, deterrence: 4, instability: 9 },
  ],
  resilience: [
    { prosperity: 4, rights: 2, instability: -2 },
    { prosperity: 7, rights: 5, multipolarity: 4, instability: -7 },
    { prosperity: -5, multipolarity: 5, instability: 10 },
  ],
  security: [
    { deterrence: 6, instability: 2 },
    { deterrence: 3, rights: 4, multipolarity: 5, instability: -5 },
    { deterrence: 10, rights: -6, instability: 10 },
  ],
};

const summaries: Record<FuturePattern, readonly [string, string, string]> = {
  cooperation: ['제한된 국가협력과 상호운용 규칙이 위기를 관리한다.', '공동기관·검증·분담금이 국경을 넘는 문제를 지속적으로 관리한다.', '경쟁 권역이 서로 다른 규칙과 기반시설을 구축한다.'],
  competition: ['국가와 기업의 경쟁이 기술 보급과 전략투자를 가속한다.', '공개표준과 상호검증을 조건으로 기술과 이익을 공동 관리한다.', '군사화·독점·봉쇄가 혁신의 방향과 접근권을 장악한다.'],
  rights: ['국내법과 판례가 새로운 권리 문제를 점진적으로 조정한다.', '국제감사와 시민대표가 기술·생명·이동의 권리를 공동 규칙으로 만든다.', '비상권력과 계층화가 기술 혜택과 자유를 분리한다.'],
  resilience: ['국가별 적응투자가 충격과 복구비용을 완화한다.', '공동보험·이주협약·상호구호망이 충격을 국경 너머에서 분담한다.', '요새화와 자원민족주의가 피해를 취약 지역에 전가한다.'],
  security: ['억지와 제한적 투명성이 위기를 관리하지만 경쟁선을 남긴다.', '공동경보·사찰·인간 승인 규칙이 오판과 선제행동을 줄인다.', '자동화된 선제체계와 폐쇄 블록이 작은 오류를 체제 위기로 키운다.'],
};

const specs: FutureScenarioSpec[] = [
  { id: 'public-compute-compact', title: '공공 연산과 AI 감사 협약', year: 2025, era: 'planetary-transition', category: 'technology', historicalBasis: '플랫폼·연산자원 집중과 AI 원칙의 역사에서 도출한 가능세계 압력이다. 모델 접근, 안전검증과 공공 연구 연산의 배분을 둘러싼 선택이 핵심이다.', source: sources.ai, pattern: 'rights', triggerTags: ['ai', 'computing', 'rights'], outcomes: ['국가별 AI 허가제', '국제 모델감사·공공연산망', '폐쇄형 군사연산 블록'] },
  { id: 'climate-loss-solidarity', title: '기후 손실·피해 분담질서', year: 2027, era: 'planetary-transition', category: 'environment', historicalBasis: '기후협약의 재원·책임·적응 논쟁과 대형 재난 뒤 국제지원 경험에서 도출한 가능세계 압력이다.', source: sources.climate, pattern: 'resilience', triggerTags: ['climate', 'finance', 'development'], outcomes: ['국가별 적응기금', '세계 손실·피해 상호보험', '기후부채·국경세 전쟁'] },
  { id: 'orbital-traffic-regime', title: '궤도 교통·잔해 통제체제', year: 2029, era: 'planetary-transition', category: 'space', historicalBasis: '우주조약, 위성 수 증가와 해상·항공 교통규칙의 역사적 선례에서 도출한 궤도 이용 시나리오다.', source: sources.space, pattern: 'cooperation', triggerTags: ['space', 'logistics', 'deterrence'], outcomes: ['국가별 궤도구역 신고', '국제 우주교통관제청', '궤도 봉쇄·요격권 경쟁'] },
  { id: 'quantum-transition-crisis', title: '암호체계 전환과 신뢰위기', year: 2031, era: 'planetary-transition', category: 'intelligence', historicalBasis: '암호 해독 경쟁, 공개키 기반시설과 국가 디지털 전환의 역사에서 도출한 장기 기밀·신원 체계 시나리오다.', source: sources.ai, pattern: 'security', triggerTags: ['quantum', 'cyber', 'institutions'], outcomes: ['국가별 암호교체', '상호검증형 양자내성 표준', '금융·군사지휘 해독위기'] },
  { id: 'autonomous-arms-convention', title: '자율무기 인간통제 협약', year: 2033, era: 'planetary-transition', category: 'world-order', historicalBasis: '핵·화학무기 군비통제와 국제 인도법의 역사에서 도출한 인간 승인권·책임소재 시나리오다.', source: sources.rights, pattern: 'security', triggerTags: ['ai', 'command', 'deterrence'], outcomes: ['국가별 인간승인 원칙', '검증 가능한 자율무기 제한조약', '기계속도 선제타격 경쟁'] },
  { id: 'ageing-labor-compact', title: '고령화·자동화 사회계약', year: 2035, era: 'planetary-transition', category: 'society', historicalBasis: '연금, 노동시간, 보편교육과 건강한 고령화 정책의 역사에서 도출한 세대간 생산·돌봄 시나리오다.', source: sources.ageing, pattern: 'rights', triggerTags: ['health', 'automation', 'welfare'], outcomes: ['정년·연금 점진개혁', '평생교육·돌봄 보편계약', '자동화 배당 계급사회'] },
  { id: 'climate-mobility-corridors', title: '기후이주와 계획정착 회랑', year: 2037, era: 'planetary-transition', category: 'decolonization', historicalBasis: '난민보호, 노동이주와 재난대피의 역사에서 도출한 국경·시민권·도시수용 시나리오다.', source: sources.migration, pattern: 'resilience', triggerTags: ['migration', 'climate', 'rights'], outcomes: ['임시보호·국경관리', '도시연합형 계획정착권', '기후난민 무국적지대'] },
  { id: 'fusion-mineral-bargain', title: '신에너지·핵심광물 대타협', year: 2039, era: 'planetary-transition', category: 'economy', historicalBasis: '석유질서, 원자력 사찰, 개발은행과 원자재 카르텔의 역사에서 도출한 에너지 전환 권력 시나리오다.', source: sources.nuclear, pattern: 'competition', triggerTags: ['energy', 'trade', 'resources'], outcomes: ['국가 전략광물 비축', '광물국·기술국 공동개발권', '에너지 기술봉쇄 냉전'] },
  { id: 'lunar-commons-settlement', title: '달 거점과 공동유산 협정', year: 2041, era: 'synthetic-century', category: 'space', historicalBasis: '우주조약과 해양법의 공동유산·관할권 논쟁에서 도출한 달 자원·기지·구조책임 시나리오다.', source: sources.space, pattern: 'cooperation', triggerTags: ['space', 'resources', 'law'], outcomes: ['국가·기업 기지권', '달 공동유산 신탁통치', '무장 자원구역 경쟁'] },
  { id: 'synthetic-biology-incident', title: '합성생물 사고와 생물검증체제', year: 2043, era: 'synthetic-century', category: 'public-health', historicalBasis: '감염병 감시, 핵사찰과 이중용도 연구 통제의 역사에서 도출한 설계 생물체 사고 시나리오다.', source: sources.health, pattern: 'security', triggerTags: ['biosecurity', 'health', 'science'], outcomes: ['국가 실험실 안전강화', '국제 유전자설계 등록·현장검증', '생물기술 봉쇄와 비밀무기 경쟁'] },
  { id: 'post-carbon-trade-order', title: '탄소 이후 무역·산업 결제질서', year: 2045, era: 'synthetic-century', category: 'economy', historicalBasis: '관세동맹, 브레턴우즈, 배출권과 공급망 표준의 역사에서 도출한 산업 탄소·재제조 가치 시나리오다.', source: sources.trade, pattern: 'cooperation', triggerTags: ['trade', 'environment', 'industry'], outcomes: ['국가별 탄소관세권', '상호인증 순환경제 결제권', '재료·전력 블록 분리'] },
  { id: 'transboundary-water-authority', title: '초국경 수자원·도시권 협약', year: 2047, era: 'synthetic-century', category: 'environment', historicalBasis: '국제하천 협정, 광역 상수도와 재난위험경감의 역사에서 도출한 물·식량·도시 생존 시나리오다.', source: sources.disasters, pattern: 'resilience', triggerTags: ['water', 'cities', 'food'], outcomes: ['댐·담수화 국가계획', '유역 공동관리·상호배급망', '수자원 봉쇄·도시 이탈'] },
  { id: 'algorithmic-constitution', title: '알고리즘 행정과 헌법감사', year: 2049, era: 'synthetic-century', category: 'society', historicalBasis: '행정법, 선거관리와 자동화된 의사결정의 책임 원칙에서 도출한 디지털 국가 권리 시나리오다.', source: sources.rights, pattern: 'rights', triggerTags: ['ai', 'elections', 'institutions'], outcomes: ['법원 중심 알고리즘 통제', '시민배심·공개모델 헌법체계', '예측행정·신용시민권 국가'] },
  { id: 'planetary-defense-council', title: '행성방위 공동경보회의', year: 2051, era: 'synthetic-century', category: 'world-order', historicalBasis: '조기경보, 집단안보와 국제 과학협력의 역사에서 도출한 천체·우주기상 공동대응 시나리오다.', source: sources.space, pattern: 'security', triggerTags: ['space', 'science', 'command'], outcomes: ['국가별 충돌대응사령부', '국제 행성방위 평의회', '궤도변경 기술의 전략무기화'] },
  { id: 'longevity-distribution', title: '수명연장 접근권과 세대대표', year: 2053, era: 'synthetic-century', category: 'public-health', historicalBasis: '백신·의약품 접근권, 연금과 보편의료의 역사에서 도출한 건강수명 기술 배분 시나리오다.', source: sources.ageing, pattern: 'rights', triggerTags: ['health', 'welfare', 'rights'], outcomes: ['보험형 제한급여', '보편 건강수명권·세대의회', '장수 엘리트와 생물학적 계급'] },
  { id: 'interplanetary-jurisdiction', title: '행성간 정착과 주권승계', year: 2055, era: 'synthetic-century', category: 'decolonization', historicalBasis: '탈식민화, 자치령, 해양관할권과 우주조약의 역사에서 도출한 원거리 정착지 대표권 시나리오다.', source: sources.space, pattern: 'cooperation', triggerTags: ['space', 'decolonization', 'rights'], outcomes: ['본국 관할 정착지', '비대칭 행성연방', '정착기업·주둔군 독립전쟁'] },
  { id: 'managed-retreat-charter', title: '기후 후퇴·도시이전 헌장', year: 2057, era: 'synthetic-century', category: 'environment', historicalBasis: '전후 재건, 실향민 정착과 재난복구의 역사에서 도출한 해안·건조지역 계획이전 시나리오다.', source: sources.disasters, pattern: 'resilience', triggerTags: ['climate', 'housing', 'migration'], outcomes: ['국가 보상형 계획이전', '도시권 상호시민권·토지신탁', '버려진 지역과 요새도시'] },
  { id: 'human-machine-social-contract', title: '인간·기계 공동노동 사회계약', year: 2059, era: 'synthetic-century', category: 'society', historicalBasis: '산업혁명 이후 노동권·사회보험·교육·자동화 협상의 역사에서 도출한 장기 사회계약 시나리오다.', source: sources.ai, pattern: 'rights', triggerTags: ['ai', 'labor', 'welfare'], outcomes: ['직무전환·로봇과세', '사회배당·공동소유 연산경제', '무노동 다수와 기계자본 과두정'] },
];

function variant(id: string, title: string, summary: string, consequence: string, metricDelta: Partial<Record<WorldMetric, number>>): WorldHistoryVariant {
  return { id, title, summary, consequence, metricDelta };
}

function materialize(spec: FutureScenarioSpec): WorldHistoryEvent {
  const deltas = patternDeltas[spec.pattern];
  const copy = summaries[spec.pattern];
  return {
    id: spec.id,
    title: spec.title,
    historicalYear: spec.year,
    era: spec.era,
    category: spec.category,
    historicalBasis: spec.historicalBasis,
    sourceLabel: spec.source[0],
    sourceUrl: spec.source[1],
    scenarioType: 'historical-pattern',
    triggerTags: spec.triggerTags,
    variants: [
      variant('continuity', spec.outcomes[0], copy[0], `${spec.outcomes[0]}이 기존 국가제도 위에서 점진적으로 굳어진다.`, deltas[0]),
      variant('compact', spec.outcomes[1], copy[1], `${spec.outcomes[1]}이 행위자·권리·비용 분담의 규칙을 다시 쓴다.`, deltas[1]),
      variant('rupture', spec.outcomes[2], copy[2], `${spec.outcomes[2]}이 새로운 블록과 장기 위기선을 만든다.`, deltas[2]),
    ],
  };
}

export const futureWorldHistoryEvents: WorldHistoryEvent[] = specs.map(materialize);
