import type { GameState, NationId } from './types';
import type { GeneratedWorldEvent, WorldMetric } from './worldHistory';
import type { EmergentHistoryProfile, HistoryForce } from './emergentHistory';

export interface EndingHistoricalAnchor {
  label: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface EndingAxis extends EndingHistoricalAnchor {
  id: string;
  name: string;
  endingName: string;
  description: string;
  legacy: string;
  tension: string;
  targets: Partial<Record<WorldMetric, number>>;
  signals: Array<[eventId: string, variantId: string]>;
  trajectorySignals: string[];
}

export interface HistoricalEnding {
  id: string;
  title: string;
  orderId: string;
  settlementId: string;
  horizonId: string;
  orderName: string;
  settlementName: string;
  horizonName: string;
  summary: string;
  legacy: string;
  warning: string;
  anchors: [EndingHistoricalAnchor, EndingHistoricalAnchor, EndingHistoricalAnchor];
  tags: [string, string, string];
}

export interface ResolvedHistoricalEnding extends HistoricalEnding {
  fitScore: number;
  reasons: [string, string, string];
  decisiveChoices: Array<{
    year: number;
    eventTitle: string;
    choiceTitle: string;
    consequence: string;
    axisImpact: string;
  }>;
  epilogueChapters: Array<{
    id: 'government' | 'economy' | 'society' | 'technology' | 'world-order';
    label: string;
    title: string;
    detail: string;
  }>;
}

export interface HistoricalEndingInput {
  nationId: NationId;
  metrics: Record<WorldMetric, number>;
  timeline: GeneratedWorldEvent[];
  trajectory?: EmergentHistoryProfile;
  game: Pick<GameState, 'victoryScore' | 'stability' | 'warSupport' | 'factories' | 'intelNetwork' | 'enemyPressure' | 'airPower' | 'navalPower'>;
  seed: number;
}

export interface HistoricalEndingFilter {
  query?: string;
  orderId?: string;
  settlementId?: string;
  horizonId?: string;
}

const sources = {
  un: ['유엔 헌장과 창설', 'https://www.un.org/en/about-us/history-of-the-un'],
  rights: ['유엔 세계인권선언', 'https://www.un.org/en/about-us/universal-declaration-of-human-rights/'],
  decolonization: ['유엔 탈식민화', 'https://www.un.org/en/global-issues/decolonization/'],
  nato: ['NATO 역사', 'https://www.nato.int/en/about-us/nato-history/a-short-history-of-nato'],
  state: ['미국 국무부 역사국·전후 질서', 'https://history.state.gov/milestones/1945-1952/foreword'],
  nam: ['유엔·반둥과 비동맹운동', 'https://press.un.org/en/1996/19960924.sgsm6064.html'],
  eu: ['EU 이사회·슈만 선언', 'https://www.consilium.europa.eu/en/schuman-declaration/'],
  imf: ['IMF·브레턴우즈 체제', 'https://www.imf.org/en/about/factsheets/sheets/2022/imf-world-bank-new'],
  worldbank: ['세계은행 역사 아카이브', 'https://www.worldbank.org/en/archive/history'],
  marshall: ['미국 국무부 역사국·마셜 플랜', 'https://history.state.gov/milestones/1945-1952/marshall-plan'],
  wto: ['WTO·다자무역체제의 역사', 'https://www.wto.org/english/thewto_e/history_e/history_e.htm'],
  iaea: ['IAEA·평화를 위한 원자력', 'https://www.iaea.org/newscenter/news/atoms-should-be-peace'],
  nasa: ['NASA·아폴로–소유스', 'https://www.nasa.gov/history/astp/overview.html'],
  who: ['WHO·천연두 박멸', 'https://www.who.int/emergencies/situations/smallpox'],
  unesco: ['UNESCO·교육·과학·문화 협력의 역사', 'https://www.unesco.org/en/history'],
  climate: ['UNFCCC·파리협정', 'https://unfccc.int/process-and-meetings/the-paris-agreement'],
  ai: ['OECD·인공지능 원칙', 'https://oecd.ai/en/ai-principles'],
  asean: ['ASEAN·방콕선언과 우호협력조약', 'https://asean.org/wp-content/uploads/2025/09/SG-Dr.-Kao-Pre-Recorded-Remarks-at-the-2nd-TAC-Conference-18-Sept-2025-As-Delivered.pdf'],
  ilo: ['ILO·사회적 대화와 삼자주의', 'https://www.ilo.org/topics-and-sectors/social-dialogue-and-tripartism'],
  imfWealth: ['IMF·자원부국의 국부관리', 'https://www.imf.org/en/publications/policy-papers/issues/2016/12/31/sovereign-asset-liability-management-guidance-for-resource-rich-economies-pp4876'],
  regionalBanks: ['세계은행·지역개발은행의 확산', 'https://openknowledge.worldbank.org/server/api/core/bitstreams/4a43a2f8-83dc-5c2d-a638-deb0e435e237/content'],
  icann: ['ICANN·다중이해관계자 인터넷 거버넌스', 'https://atlarge.icann.org/topics/internet-governance/background'],
  irena: ['IRENA·재생에너지 전력망 유연성', 'https://www.irena.org/Publications/2026/Jan/Flexibility-for-a-secure-and-affordable-power-sector-transformation'],
  unclos: ['유엔·해양법과 인류 공동유산', 'https://www.un.org/depts/los/convention_agreements/texts/unclos/part11-2.htm'],
  undrr: ['UNDRR·센다이 재난위험경감 체계', 'https://www.undrr.org/implementing-sendai-framework/what-sendai-framework'],
  healthyAgeing: ['WHO·건강한 고령화 10년', 'https://www.who.int/initiatives/decade-of-healthy-ageing'],
} as const;

function axis(
  id: string,
  name: string,
  endingName: string,
  description: string,
  legacy: string,
  tension: string,
  source: readonly [string, string],
  targets: Partial<Record<WorldMetric, number>>,
  signals: Array<[string, string]>,
  trajectorySignals: string[] = [],
): EndingAxis {
  return { id, name, endingName, description, legacy, tension, label: name, sourceLabel: source[0], sourceUrl: source[1], targets, signals, trajectorySignals };
}

export const endingOrderAxes: EndingAxis[] = [
  axis('charter-commonwealth', '헌장 집단안보', '헌장의 세계', '총회·재판소·상설 평화군이 국가주권 위에 제한된 공동 규칙을 세웁니다.', '전쟁의 합법성과 제재가 공개 제도 안에서 결정됩니다.', '거부권과 강대국의 선택적 준수가 제도의 신뢰를 시험합니다.', sources.un, { rights: 78, instability: 28, multipolarity: 55 }, [['world-organization', 'parliament'], ['alliance-system', 'collective-security']], ['collective-security-system', 'collective-security']),
  axis('great-power-concert', '강대국 협조체제', '다섯 의자의 평화', '핵심 승전국이 세력균형과 거부권으로 대전을 관리합니다.', '정상회담과 비밀 절충이 세계전쟁을 억제합니다.', '약소국의 분쟁은 거래 가능한 완충지대로 취급될 수 있습니다.', sources.un, { deterrence: 72, multipolarity: 30, instability: 38 }, [['world-organization', 'great-power'], ['containment-doctrine', 'spheres']], ['existing-alliance', 'cautious']),
  axis('atlantic-alliance', '대서양 동맹질서', '대서양 방패의 세기', '표준화된 군사동맹과 원조·시장 접근이 하나의 안보권을 만듭니다.', '공동지휘와 재건금융이 장기 억지를 유지합니다.', '동맹 밖 지역의 내전이 체제경쟁으로 확대됩니다.', sources.nato, { deterrence: 84, prosperity: 72, multipolarity: 28 }, [['alliance-system', 'two-blocs'], ['reconstruction-aid', 'bloc-aid']], ['existing-alliance', 'military']),
  axis('socialist-security', '사회주의 공동방위권', '붉은 상호방위선', '계획경제 국가들이 상설 지휘부와 상호원조 체계를 공유합니다.', '중공업·국방·기초과학이 거대한 공동계획에 들어갑니다.', '동맹 이탈과 개혁 요구가 군사개입 문제로 번집니다.', sources.nato, { deterrence: 82, rights: 34, multipolarity: 36 }, [['warsaw-pact', 'historical'], ['hungarian-uprising', 'historical']], ['revolutionary-international', 'peoples-council']),
  axis('regional-federations', '지역연방 다극체제', '대륙연방의 원탁', '대륙별 공동체가 국방·통상·통화를 나누고 세계평의회에서 교섭합니다.', '중견국과 지역기구가 초강대국 사이의 독자 극으로 성장합니다.', '지역 패권국이 연방 규칙을 사유화할 위험이 남습니다.', sources.un, { multipolarity: 88, decolonization: 72, instability: 42 }, [['world-organization', 'regional'], ['alliance-system', 'many-pacts']], ['regional-bloc', 'regional-union', 'federation']),
  axis('nonaligned-century', '비동맹 제3세계 연대', '반둥의 세기', '신생 독립국이 군사블록을 거부하고 공동 표결·중재·개발금융을 구축합니다.', '남반구가 냉전의 대상이 아니라 규칙 제정자가 됩니다.', '회원국의 체제와 이해가 달라 공동행동이 느슨해질 수 있습니다.', sources.nam, { multipolarity: 90, decolonization: 88, deterrence: 46 }, [['nonaligned-conference', 'nonalignment'], ['nonaligned-conference', 'development-bank']], ['nonaligned-movement', 'nonalignment', 'decolonization']),
  axis('liberation-international', '범대륙 해방연대', '해방전선의 세계', '독립운동과 레지스탕스가 국경을 넘어 훈련·무기·외교승인을 공유합니다.', '제국 해체와 민족자결이 가장 빠르게 진행됩니다.', '해방전쟁이 혁명 수출과 장기 대리전으로 변질될 수 있습니다.', sources.decolonization, { decolonization: 96, multipolarity: 82, instability: 68 }, [['nonaligned-conference', 'liberation-front'], ['vietnam-war', 'regional-victory']], ['revolutionary-international', 'mass-movement', 'independence']),
  axis('supranational-union', '초국가 공동체', '국경을 낮춘 연합', '전쟁 핵심산업의 공동관리에서 시작한 연합이 의회·법원·공동시장으로 발전합니다.', '역사적 경쟁국 사이의 전쟁능력이 제도적으로 분리됩니다.', '통합의 속도와 민주적 통제, 탈퇴권을 둘러싼 갈등이 지속됩니다.', sources.eu, { prosperity: 88, rights: 76, instability: 24 }, [['european-coal-steel', 'institutional'], ['maastricht', 'institutional']], ['regional-union', 'federal-council']),
  axis('spheres-order', '상호 세력권 질서', '지도 위의 휴전', '강대국이 완충지대와 불간섭선을 인정해 직접충돌을 피합니다.', '예측 가능한 경계가 핵전쟁 위험을 줄입니다.', '경계 안 시민과 약소국의 선택권이 희생됩니다.', sources.state, { deterrence: 76, rights: 28, multipolarity: 26 }, [['containment-doctrine', 'spheres'], ['war-termination', 'conditional']], ['cautious', 'historical-claims']),
  axis('rights-covenant', '보편 권리공동체', '인권헌장의 공화국들', '국제재판과 개인청원권이 정부의 전시·평시 권력을 제한합니다.', '시민과 피해자가 국경을 넘어 책임과 배상을 요구할 수 있습니다.', '권위주의 국가의 탈퇴와 선택적 집행이 새로운 분쟁선이 됩니다.', sources.rights, { rights: 96, instability: 26, decolonization: 74 }, [['human-rights', 'binding-charter'], ['war-crimes', 'universal']], ['republic', 'social-reform', 'self-determination']),
  axis('corporate-network', '기업·도시 네트워크 질서', '국가보다 빠른 회랑', '항만도시·기업·대학·통신망이 국경보다 빠르게 자본과 기술을 연결합니다.', '혁신과 교역이 비국가 네트워크를 중심으로 폭발합니다.', '독점기업과 사적 치안이 민주적 책임을 우회할 수 있습니다.', sources.wto, { prosperity: 94, rights: 46, multipolarity: 66 }, [['commercial-internet', 'historical'], ['wto-order', 'historical']], ['social-market', 'economic-reform']),
  axis('fractured-sovereignties', '분열된 주권과 영구분쟁', '깨진 국경의 시대', '휴전선·분리정권·민병대·기업영지가 국제승인을 놓고 경쟁합니다.', '일부 지역은 중앙권력 밖에서 자치와 생존 방식을 발명합니다.', '대리전과 난민, 식량·에너지 봉쇄가 일상적 정치수단이 됩니다.', sources.un, { instability: 94, multipolarity: 84, prosperity: 24 }, [['war-termination', 'negotiated'], ['bloc-transformation', 'permanent-plurality']], ['radical', 'historical-claims']),
  axis('knowledge-republics', '지식공화국 연합', '대학이 세운 국경 없는 공화국', '대학·연구소·도서관·기상·보건망이 공개표준과 인재이동권으로 국가 사이를 연결합니다.', '망명과 피난으로 흩어진 지식이 독점병기가 아니라 공동 재건 기반이 됩니다.', '전문가 통치와 연구 중심국의 언어·의제 독점이 민주적 대표성을 위협합니다.', sources.unesco, { prosperity: 88, rights: 82, multipolarity: 76 }, [['wartime-university-diaspora', 'compact'], ['decolonized-university-wave', 'compact']], ['science', 'education', 'open-network']),
  axis('pan-african-solidarity', '범아프리카 주권연합', '해방대륙의 공동의석', '독립국과 해방운동이 국경분쟁·자원계약·평화유지와 개발금융을 대륙기관에 위임합니다.', '식민지 경계를 넘어 공동교섭력과 개입 억제 장치가 성장합니다.', '지역패권·쿠데타·외부 자원개입이 연합의 일관성을 시험합니다.', sources.decolonization, { decolonization: 94, multipolarity: 88, instability: 40 }, [['congo-independence-crisis', 'compact'], ['decolonized-university-wave', 'compact']], ['decolonization', 'regional-union', 'resource-sovereignty']),
  axis('planetary-council', '행성위기 공동통치', '국경 위의 생존평의회', '기후·감염병·해양·우주잔해처럼 국경을 넘는 위험에 과학패널·시민의회·상설기금이 공동명령을 내립니다.', '국제정치의 성과가 영토확장보다 문명위험 감소로 평가됩니다.', '비상권한의 상시화와 위험모형을 둘러싼 기술관료 권력이 새로운 견제문제가 됩니다.', sources.climate, { rights: 80, prosperity: 78, instability: 18, multipolarity: 70 }, [['sustainable-development-goals', 'compact'], ['rio-earth-summit', 'compact']], ['collective-security', 'environment', 'public-health']),
  axis('consensus-regionalism', '합의형 느슨한 지역공동체', '회의실로 전쟁을 미룬 지역들', '주권과 내정불간섭을 유지하면서 정상회의·경제협력·분쟁의 평화적 해결을 축적하는 지역주의가 세계질서의 기본 단위가 됩니다.', '작은 국가도 강제통합 없이 공동의제와 교섭력을 만들고, 반복되는 회의가 군사적 오판을 늦춥니다.', '만장일치와 비간섭 원칙이 인권침해·쿠데타·국경위기에 대한 공동대응을 마비시킬 수 있습니다.', sources.asean, { multipolarity: 84, prosperity: 72, instability: 34, rights: 56 }, [['asean-foundation', 'historical'], ['tac-regional-nonaggression', 'compact']], ['regional-union', 'regional-bloc', 'diplomacy', 'cautious']),
];

export const endingSettlementAxes: EndingAxis[] = [
  axis('bretton-reserve', '브레턴우즈 기축통화', '고정환율 재건', '기축통화·개발은행·무역규칙이 전후 복구를 하나의 결제망으로 묶습니다.', '장거리 투자와 교역이 빠르게 복구됩니다.', '중심국의 금리와 적자가 세계 유동성을 좌우합니다.', sources.imf, { prosperity: 84, multipolarity: 30, instability: 26 }, [['monetary-order', 'reserve-currency'], ['wto-order', 'historical']], ['mixed-reconstruction']),
  axis('clearing-union', '다자 청산동맹', '방코르의 귀환', '흑자국과 적자국 모두 조정의무를 지는 국제청산단위가 채택됩니다.', '불균형과 외환위기가 줄고 복수 통화권이 공존합니다.', '초국가 청산기구의 제재권이 주권 논쟁을 부릅니다.', sources.imf, { prosperity: 82, multipolarity: 68, instability: 24 }, [['monetary-order', 'clearing-union'], ['asian-financial-crisis', 'institutional']], ['collective-security-system', 'mixed-reconstruction']),
  axis('marshall-social-reconstruction', '보편 재건·복지 타협', '빵과 주택의 평화', '대규모 복구원조와 사회보험·노동협약이 민주정부의 기반을 만듭니다.', '완전고용·주택·교육 투자가 전후 황금기를 이끕니다.', '원조 조건과 높은 조세, 배제된 지역의 격차가 남습니다.', sources.marshall, { prosperity: 90, rights: 74, instability: 20 }, [['reconstruction-aid', 'universal-aid'], ['rights-movements', 'legislation']], ['social-market', 'social-reform']),
  axis('planned-industrialization', '계획 중공업 총동원', '다섯개년 재건', '국가계획이 철강·전력·철도·국방과학에 자원을 집중합니다.', '파괴된 농업국이 짧은 기간에 산업·군사 강국으로 변합니다.', '소비·지역·환경 비용과 강제동원 위험이 누적됩니다.', sources.worldbank, { prosperity: 62, deterrence: 78, rights: 34 }, [['reconstruction-aid', 'autarkic-drive'], ['china-reform', 'transformative']], ['planned-mobilization', 'peoples-council']),
  axis('developmental-state', '수출형 개발국가', '기술관료의 기적', '국가신용·교육·산업정책이 민간기업의 수출과 기술추격을 지휘합니다.', '제조업과 중산층이 빠르게 성장합니다.', '노동권 억압·정경유착·지역격차가 성장의 그늘이 됩니다.', sources.worldbank, { prosperity: 94, rights: 54, instability: 34 }, [['green-revolution', 'historical'], ['china-reform', 'historical']], ['mixed-reconstruction', 'economic-reform']),
  axis('cooperative-land-reform', '토지개혁·협동조합 경제', '마을에서 시작한 재건', '농지·신용·유통을 지역 협동조합이 운영하고 국가가 기반시설을 보증합니다.', '식량안보와 농촌 참여가 국가 정통성을 강화합니다.', '대지주·도시자본과의 갈등, 규모의 경제 한계가 남습니다.', sources.decolonization, { decolonization: 82, rights: 72, prosperity: 66 }, [['occupation-reform', 'self-reform'], ['green-revolution', 'institutional']], ['cooperative-reform', 'mass-movement']),
  axis('resource-sovereignty', '자원주권·생산국 연대', '유전과 광산의 독립', '석유·광물·운하 수익을 생산국이 통제하고 공동 개발기금으로 전환합니다.', '식민지형 이권구조가 깨지고 남반구의 교섭력이 커집니다.', '가격무기·부패·외부개입과 단일자원 의존이 위험합니다.', sources.decolonization, { decolonization: 88, multipolarity: 84, instability: 54 }, [['oil-shock', 'embargo'], ['iran-oil-coup', 'transformative']], ['resource-sovereignty', 'independence']),
  axis('market-globalization', '시장개방·세계 생산망', '컨테이너의 세계', '관세인하·민영화·투자보호와 분산 생산망이 세계시장을 통합합니다.', '소비재·자본·기술의 이동이 유례없이 빨라집니다.', '금융전염과 탈산업화, 노동·환경 규범의 하향 경쟁이 발생합니다.', sources.wto, { prosperity: 90, rights: 46, instability: 46 }, [['debt-development', 'structural-adjustment'], ['china-wto', 'historical']], ['social-market', 'economic-reform']),
  axis('autarkic-blocs', '자급형 경제블록', '철의 관세선', '경쟁 진영이 결제망·공급망·표준을 분리하고 전략물자를 내부 생산합니다.', '제재와 봉쇄에 대한 회복력, 핵심산업의 자립이 높아집니다.', '중복투자·생활수준 정체와 경제전쟁이 상시화됩니다.', sources.state, { prosperity: 34, multipolarity: 78, instability: 70 }, [['monetary-order', 'currency-blocs'], ['supply-chain-shock', 'transformative']], ['planned-mobilization', 'historical-claims']),
  axis('debt-jubilee-commons', '채무탕감·세계 공공기금', '빚을 지운 발전권', '채무감면과 보건·교육·기후 투자를 연결한 공공금융 체제가 형성됩니다.', '독립국이 긴축 대신 인적자본과 기반시설에 투자합니다.', '채권국의 반발과 자금배분의 투명성 문제가 지속됩니다.', sources.worldbank, { prosperity: 76, rights: 82, decolonization: 84 }, [['debt-development', 'debt-jubilee'], ['global-financial-crisis', 'institutional']], ['cooperative-reform', 'decolonization']),
  axis('public-knowledge-economy', '공공 지식·특허풀 경제', '발명의 배당금', '공공연구·개방특허·표준설계를 국제기금이 보상하고 모든 지역의 생산자가 이용합니다.', '의약·종자·소프트웨어·청정기술의 보급비용이 낮아지고 연구성과가 넓게 공유됩니다.', '연구보상 산정과 군사·상업 기밀의 예외범위가 지속적인 갈등을 만듭니다.', sources.unesco, { prosperity: 92, rights: 82, multipolarity: 74 }, [['programming-profession-lineage', 'compact'], ['crispr-gene-editing', 'compact']], ['open-network', 'science', 'cooperative-reform']),
  axis('universal-basic-services', '보편 기초서비스 경제', '병원·학교·주택의 시민권', '보건·교육·주거·교통·통신의 최소수준을 국적과 고용상태에 관계없이 공공재정으로 보장합니다.', '전쟁과 불황에도 인적역량과 사회 신뢰가 유지되어 회복이 빨라집니다.', '높은 재정수요와 중앙 표준이 지역 자치·다양한 제공방식과 충돌할 수 있습니다.', sources.rights, { prosperity: 86, rights: 94, instability: 18 }, [['universal-health-right-1948', 'compact'], ['millennium-development-goals', 'compact']], ['social-reform', 'republic', 'cooperative-reform']),
  axis('circular-industrial-commons', '순환형 산업공유체', '폐허가 자원이 된 경제', '제품수리·재사용·소재회수·공동 전략비축을 산업표준과 무역규칙에 내장합니다.', '자원수입과 폐기물 위험이 줄고 지역 제조·정비 일자리가 성장합니다.', '희소광물 채굴국의 소득전환과 복잡한 추적규칙이 새로운 분배문제를 만듭니다.', sources.climate, { prosperity: 82, rights: 72, instability: 24 }, [['stockholm-environment-1972', 'compact'], ['rio-earth-summit', 'compact']], ['resource-sovereignty', 'economic-reform', 'environment']),
  axis('tripartite-codetermination', '노동·정부·기업 공동결정', '공장 이사회가 지킨 평화', '노동자 조직·기업·정부가 임금·자동화·재건투자·직업훈련을 공개자료와 단체협약으로 공동 결정합니다.', '성장의 성과와 전환비용이 교섭으로 배분되어 산업평화와 장기 숙련이 동시에 축적됩니다.', '대표성이 약한 노조·비정규·이주노동자가 협약 밖으로 밀리거나 담합적 기득권이 굳어질 수 있습니다.', sources.ilo, { prosperity: 86, rights: 88, instability: 18 }, [['tripartite-social-pact', 'compact'], ['rights-movements', 'participatory']], ['social-market', 'social-reform', 'cooperative-reform']),
  axis('sovereign-citizen-fund', '자원배당·시민 국부기금', '지하의 부를 미래에 남긴 공화국', '석유·광물·국유자산 수익을 독립기금에 적립하고 경기안정·세대간 형평·시민배당에 규칙적으로 사용합니다.', '일시적 자원호황이 교육·보건·산업다각화와 다음 세대의 금융자산으로 전환됩니다.', '기금의 정치적 전용, 해외자산 의존, 시민배당과 장기투자 사이의 갈등이 새 권력투쟁이 됩니다.', sources.imfWealth, { prosperity: 84, rights: 72, instability: 26, multipolarity: 66 }, [['sovereign-wealth-intergenerational', 'compact'], ['oil-shock', 'energy-compact']], ['resource-sovereignty', 'cooperative-reform', 'economic-reform']),
  axis('regional-development-bank-network', '지역개발은행 연합망', '철도와 병원을 빌려준 남반구', '지역별 개발은행이 공동출자·현지통화 대출·기술지원으로 철도·전력·보건·교육 투자를 장기 조달합니다.', '신생국이 단일 강대국 원조나 원자재 담보에 덜 의존하면서 지역 생산망과 정책역량을 키웁니다.', '대출국의 영향력, 부채 지속가능성, 수익성 낮은 지역의 배제와 사업환경 피해가 공동감독을 시험합니다.', sources.regionalBanks, { prosperity: 88, multipolarity: 86, decolonization: 78, instability: 24 }, [['regional-development-bank-wave', 'compact'], ['nonaligned-conference', 'development-bank']], ['regional-union', 'economic-reform', 'decolonization']),
];

export const endingHorizonAxes: EndingAxis[] = [
  axis('nuclear-deterrence', '상호확증파괴와 군비통제', '원자 억지의 긴 그림자', '생존 가능한 보복전력과 직통선·부분 군축이 불안한 평화를 유지합니다.', '핵전쟁은 억제되지만 위기관리와 지휘통제가 문명의 핵심 기술이 됩니다.', '오경보·쿠데타·확산국 위기가 한 번의 실패로 세계를 파괴할 수 있습니다.', sources.iaea, { deterrence: 92, instability: 54 }, [['atomic-control', 'failed-plan'], ['arms-limitation', 'bilateral-limits']], ['military', 'cautious']),
  axis('verified-disarmament', '검증 가능한 핵폐기', '마지막 탄두의 봉인', '국제사찰·연료은행·단계 폐기로 핵금기가 제도화됩니다.', '핵전쟁 위험과 군비비용이 급감하고 원자력은 민간 공공재가 됩니다.', '사찰주권과 재래식 군사력 격차가 새로운 안보갈등이 됩니다.', sources.iaea, { deterrence: 24, rights: 82, instability: 18 }, [['atoms-for-peace', 'zero-option'], ['arms-limitation', 'multilateral-freeze']], ['collective-security', 'diplomacy']),
  axis('national-space-race', '국가 우주경쟁', '달에 꽂힌 열두 깃발', '로켓·위성·유인기지가 체제와 국가위신 경쟁의 정점이 됩니다.', '통신·재료·계산·교육 투자가 폭발적으로 성장합니다.', '군용 우주체계와 궤도잔해, 기술격차가 지상 냉전을 확대합니다.', sources.nasa, { prosperity: 82, deterrence: 76, instability: 44 }, [['space-launch', 'race'], ['moon-landing', 'historical']], ['military', 'radical']),
  axis('orbital-commonwealth', '국제 우주공동체', '궤도에서의 악수', '공통 도킹규격·구조체계·다국적 기지가 우주를 공동 인프라로 만듭니다.', '위성·기상·통신·과학 데이터가 전 지구 공공재가 됩니다.', '발사비·기술이전·달 자원 배분이 새로운 남북문제가 됩니다.', sources.nasa, { prosperity: 92, multipolarity: 78, instability: 20 }, [['space-cooperation', 'orbital-commonwealth'], ['space-launch', 'international-space']], ['collective-security-system', 'diplomacy']),
  axis('health-solidarity', '세계 보건·백신 공동체', '천연두 없는 세기', '감시·현장조사·공공 백신생산을 공유하는 보건망이 국경을 넘어 작동합니다.', '감염병 박멸과 기대수명 향상이 국제협력의 가장 강력한 정당성이 됩니다.', '개인정보·특허·검역권과 지역별 의료격차가 다음 과제가 됩니다.', sources.who, { rights: 86, prosperity: 78, instability: 18 }, [['smallpox-eradication', 'institutional'], ['covid-pandemic', 'institutional']], ['social-reform', 'cooperative-reform']),
  axis('open-digital-commons', '개방형 디지털 공공망', '모두의 정보고속도로', '공개 표준·공공 데이터·보편접속권이 지식과 정치조직을 세계적으로 연결합니다.', '교육·과학·소규모 창업의 진입장벽이 크게 낮아집니다.', '허위정보·사이버공격·플랫폼 독점에 대한 국제 규칙이 필요합니다.', sources.wto, { prosperity: 90, rights: 76, multipolarity: 68 }, [['information-network', 'open-network'], ['commercial-internet', 'institutional']], ['republic', 'economic-reform']),
  axis('sovereign-ai-blocs', '주권형 AI·감시 블록', '알고리즘 장벽의 냉전', '각 진영이 반도체·데이터·모델·감시체계를 전략무기로 봉쇄합니다.', '자동화 생산과 정보전 역량은 빠르게 성장합니다.', '시민권·노동·진실성·자율무기를 둘러싼 위험이 국가경계를 따라 분열됩니다.', sources.ai, { prosperity: 72, rights: 24, instability: 72 }, [['ai-governance', 'transformative'], ['generative-ai', 'transformative']], ['intelligence', 'radical']),
  axis('climate-compact', '구속력 있는 지구 기후협약', '탄소예산의 행성', '탄소예산·기술이전·적응기금이 산업정책과 무역규칙을 다시 씁니다.', '에너지전환과 기후복원이 장기 번영의 핵심 사업이 됩니다.', '전환비용·역사적 책임·자원채굴이 새로운 분배갈등을 만듭니다.', sources.climate, { prosperity: 80, rights: 72, instability: 26 }, [['ozone-climate', 'climate-constitution'], ['paris-agreement', 'institutional']], ['collective-security-system', 'resource-sovereignty']),
  axis('planetary-biosecurity', '행성 생물안보 공동체', '다음 유행을 막은 세기', '상시 감시·지역 백신공장·병원체 자료공유·현장보건군이 발병 초기부터 자동 가동됩니다.', '유행병이 전쟁이나 봉쇄로 번지기 전 지역사회와 국제기구가 함께 차단합니다.', '병원체 연구의 이중용도, 개인정보와 검역권에 대한 강력한 민주적 감독이 필요합니다.', sources.who, { rights: 88, prosperity: 84, instability: 14 }, [['h1n1-pandemic-2009', 'compact'], ['mrna-vaccine-platform', 'compact']], ['public-health', 'cooperative-reform', 'collective-security']),
  axis('fusion-abundance', '핵융합·초전력 문명', '인공태양의 배당', '핵융합과 대륙 전력망이 담수화·합성연료·고온산업·우주개발의 에너지 제약을 크게 낮춥니다.', '에너지 빈곤과 화석연료 지정학이 약화되고 고에너지 과학의 공공투자가 확대됩니다.', '삼중수소·핵물질·거대망 통제와 지역 독점이 새로운 안보·분배 위험을 만듭니다.', sources.iaea, { prosperity: 98, deterrence: 54, instability: 22 }, [['atomic-control', 'authority'], ['npt-scientist-diplomacy', 'compact']], ['science', 'resource-sovereignty', 'radical']),
  axis('machine-civic-compact', '기계·시민 사회계약', '알고리즘에 투표권은 없다', '자동화와 AI의 생산이익을 노동시간 단축·사회배당·공공연산으로 나누고 고위험 결정에는 인간 항소권을 보장합니다.', '생산성 향상이 감시나 대량실업 대신 시민의 시간·교육·돌봄 능력으로 전환됩니다.', '모델 감사권·데이터 소유권·자율무기 금지를 누가 집행할지가 장기 정치투쟁이 됩니다.', sources.ai, { prosperity: 94, rights: 90, instability: 20 }, [['ai-governance', 'institutional'], ['semiconductor-security-blocs', 'compact']], ['social-reform', 'open-network', 'republic']),
  axis('multistakeholder-internet', '다중이해관계자 인터넷', '누구도 혼자 끌 수 없는 망', '정부·기술공동체·기업·대학·시민사회가 공개표준과 주소자원, 보안규칙을 함께 협상하는 인터넷 질서를 만듭니다.', '단일 국가나 기업의 통제를 피하면서 상호운용성과 지역 언어·시민참여가 확장됩니다.', '대표성의 불균형, 민간 플랫폼 독점, 보안사건 때의 책임소재와 접속차단 권한이 끊임없이 다투어집니다.', sources.icann, { prosperity: 90, rights: 86, multipolarity: 78, instability: 24 }, [['multistakeholder-internet-governance', 'compact'], ['information-network', 'open-network']], ['open-network', 'republic', 'diplomacy']),
  axis('renewable-supergrid', '재생에너지 초광역 전력망', '바람과 해를 나눈 대륙', '국경간 연계선·저장장치·수요반응·분산형 전원을 공동운영해 지역마다 다른 바람과 태양을 하나의 유연한 전력체계로 묶습니다.', '연료수입과 탄소배출이 줄고 전력망·저장·청정산업의 공동투자가 새로운 번영축이 됩니다.', '송전망 의존과 사이버공격, 희소광물 채굴, 전력가격과 입지 갈등이 에너지 동맹을 흔들 수 있습니다.', sources.irena, { prosperity: 92, deterrence: 42, multipolarity: 74, instability: 20 }, [['renewable-flexibility-supergrid', 'compact'], ['oil-shock', 'rapid-transition']], ['resource-sovereignty', 'science', 'environment']),
  axis('ocean-commons', '해양·심해저 공동유산', '바다에 세운 인류의 신탁', '국가관할권 밖 심해저·공해 자원과 항행·과학자료를 국제허가·환경한도·이익공유로 관리합니다.', '해양기술과 광물수익이 연안국뿐 아니라 내륙국과 개발국의 공동재원으로 돌아갑니다.', '해군력과 광구 선점, 생태계 손실의 불확실성, 집행함대의 권한이 새로운 해양대립을 만들 수 있습니다.', sources.unclos, { prosperity: 78, rights: 72, multipolarity: 86, instability: 28 }, [['unclos-common-heritage', 'compact'], ['environmental-order', 'planetary-authority']], ['collective-security', 'resource-sovereignty', 'decolonization']),
  axis('resilient-cities', '재난회복형 도시연합', '무너지기 전에 서로 깨운 도시들', '도시·항만·병원·군수송망이 조기경보·내진기준·위험지도·상호구호 비축을 공유해 재난위험을 개발계획에 내장합니다.', '전쟁과 재난을 함께 견디는 분산형 기반시설이 민간 피해와 복구비용을 크게 낮춥니다.', '안전투자가 부유한 중심지에 집중되거나 위험지도와 강제이주가 취약계층의 권리를 침해할 수 있습니다.', sources.undrr, { prosperity: 82, rights: 80, instability: 14, multipolarity: 70 }, [['sendai-resilient-cities', 'compact'], ['indian-ocean-tsunami-cooperation', 'compact']], ['collective-security', 'public-health', 'cooperative-reform']),
  axis('healthy-longevity', '건강수명·돌봄 사회계약', '백 살의 시민권', '예방의료·접근가능한 도시·통합진료·장기돌봄과 평생학습을 묶어 고령화를 비용이 아니라 시민역량의 장기화로 다룹니다.', '돌봄노동과 보조기술, 세대간 주거·연금개혁이 오래 사는 사회의 새로운 기반산업이 됩니다.', '돌봄인력 착취, 연금세대 갈등, 의료데이터와 수명연장 기술의 계층격차가 권리질서를 시험합니다.', sources.healthyAgeing, { prosperity: 86, rights: 92, instability: 16 }, [['healthy-ageing-social-contract', 'compact'], ['universal-health-right-1948', 'compact']], ['social-reform', 'public-health', 'cooperative-reform']),
];

function makeEnding(order: EndingAxis, settlement: EndingAxis, horizon: EndingAxis): HistoricalEnding {
  return {
    id: `${order.id}__${settlement.id}__${horizon.id}`,
    title: `${order.endingName} · ${settlement.endingName} · ${horizon.endingName}`,
    orderId: order.id,
    settlementId: settlement.id,
    horizonId: horizon.id,
    orderName: order.name,
    settlementName: settlement.name,
    horizonName: horizon.name,
    summary: `${order.description} ${settlement.description} 그 위에서 ${horizon.description}`,
    legacy: `${order.legacy} ${settlement.legacy} ${horizon.legacy}`,
    warning: `${order.tension} ${settlement.tension} ${horizon.tension}`,
    anchors: [order, settlement, horizon],
    tags: [order.name, settlement.name, horizon.name],
  };
}

export const historicalEndings: HistoricalEnding[] = endingOrderAxes.flatMap((order) => (
  endingSettlementAxes.flatMap((settlement) => endingHorizonAxes.map((horizon) => makeEnding(order, settlement, horizon)))
));

export function filterHistoricalEndings({ query = '', orderId = 'all', settlementId = 'all', horizonId = 'all' }: HistoricalEndingFilter) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  return historicalEndings.filter((ending) => (
    (orderId === 'all' || ending.orderId === orderId)
    && (settlementId === 'all' || ending.settlementId === settlementId)
    && (horizonId === 'all' || ending.horizonId === horizonId)
    && (!normalizedQuery || [ending.title, ending.orderName, ending.settlementName, ending.horizonName, ending.summary, ...ending.tags]
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(normalizedQuery)))
  ));
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function trajectoryTokens(trajectory: EmergentHistoryProfile | undefined) {
  if (!trajectory) return new Set<string>();
  const tokensByForce: Record<HistoryForce, string[]> = {
    military: ['military', 'military-directorate', 'planned-mobilization', 'historical-claims', 'radical'],
    industry: ['economic-reform', 'mixed-reconstruction', 'planned-mobilization', 'social-market', 'resource-sovereignty'],
    diplomacy: ['diplomacy', 'collective-security', 'regional-union', 'existing-alliance', 'regional-bloc', 'nonaligned-movement', 'collective-security-system', 'international-trusteeship'],
    civic: ['republic', 'social-reform', 'parliamentary-republic', 'presidential-republic', 'federal-council', 'social-market', 'cooperative-reform', 'self-determination', 'federal-autonomy', 'cautious'],
    liberation: ['independence', 'decolonization', 'nonalignment', 'revolutionary-international', 'self-determination', 'regional-union'],
    intelligence: ['intelligence', 'revolutionary-international', 'radical'],
  };
  const activeForces = (Object.entries(trajectory.forces) as [HistoryForce, number][])
    .filter(([force, score]) => score >= 48 || force === trajectory.dominantForce || force === trajectory.secondaryForce)
    .map(([force]) => force);
  return new Set(activeForces.flatMap((force) => tokensByForce[force]));
}

function scoreAxis(axisDefinition: EndingAxis, input: HistoricalEndingInput, family: string) {
  const targets = Object.entries(axisDefinition.targets) as [WorldMetric, number][];
  const metricFit = targets.reduce((total, [metric, target]) => total + Math.max(0, 100 - Math.abs(input.metrics[metric] - target) * 1.35), 0) / Math.max(1, targets.length);
  const variants = new Map(input.timeline.map((entry) => [entry.event.id, entry.variant.id]));
  const signalMatches = axisDefinition.signals.filter(([eventId, variantId]) => variants.get(eventId) === variantId).length;
  const tokens = trajectoryTokens(input.trajectory);
  const trajectoryMatches = axisDefinition.trajectorySignals.filter((token) => tokens.has(token)).length;
  const campaignFit = family === 'order'
    ? (input.game.intelNetwork + input.game.victoryScore) / 45
    : family === 'settlement'
      ? (input.game.factories + input.game.stability / 4) / 14
      : (input.game.airPower + input.game.navalPower + input.game.warSupport) / 90;
  const jitter = (hash(`${input.seed}:${input.nationId}:${family}:${axisDefinition.id}`) % 700) / 100;
  return metricFit + signalMatches * 24 + trajectoryMatches * 13 + campaignFit + jitter;
}

function chooseAxis(axes: EndingAxis[], input: HistoricalEndingInput, family: string) {
  const ranked = axes
    .map((candidate) => ({ candidate, score: scoreAxis(candidate, input, family) }))
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
  const bestScore = ranked[0].score;
  // Keep the result inside a historically plausible score band, then let the campaign's
  // concrete decision fingerprint decide between near-equivalent futures. This prevents
  // hundreds of distinct worlds from collapsing into one mathematically dominant epilogue
  // while preserving the metrics, trajectory and historical-signal scoring above.
  const plausible = ranked.filter((entry) => entry.score >= bestScore - 18).slice(0, 6);
  const decisionFingerprint = input.timeline
    .filter((entry) => entry.isPlayerChoice)
    .map((entry) => `${entry.event.id}:${entry.variant.id}:${entry.year}`)
    .join('|');
  const selectedIndex = hash(`${input.seed}:${input.nationId}:${family}:${decisionFingerprint}`) % plausible.length;
  return plausible[selectedIndex];
}

const metricNames: Record<WorldMetric, string> = {
  deterrence: '억지', multipolarity: '다극성', decolonization: '탈식민', rights: '권리', prosperity: '번영', instability: '불안정',
};

function buildDecisiveChoices(input: HistoricalEndingInput) {
  return input.timeline
    .filter((entry) => entry.isPlayerChoice)
    .map((entry) => {
      const ranked = (Object.entries(entry.variant.metricDelta) as [WorldMetric, number][])
        .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]));
      return {
        score: ranked.reduce((total, [, value]) => total + Math.abs(value), 0),
        year: entry.year,
        eventTitle: entry.event.title,
        choiceTitle: entry.variant.title,
        consequence: entry.variant.consequence,
        axisImpact: ranked.slice(0, 2).map(([metric, value]) => `${metricNames[metric]} ${value >= 0 ? '+' : ''}${value}`).join(' · ') || '장기 지표 간접 반영',
      };
    })
    .sort((left, right) => right.score - left.score || left.year - right.year || left.eventTitle.localeCompare(right.eventTitle))
    .slice(0, 10)
    .map(({ score: _score, ...choice }) => choice);
}

function buildEpilogueChapters(order: EndingAxis, settlement: EndingAxis, horizon: EndingAxis, input: HistoricalEndingInput): ResolvedHistoricalEnding['epilogueChapters'] {
  const rightsBalance = input.metrics.rights - input.metrics.instability;
  const powerShape = input.metrics.multipolarity >= 65 ? '여러 지역권력이 협상하는 다극 체제' : input.metrics.deterrence >= 65 ? '강한 억지와 동맹 위계가 지배하는 체제' : '유동적인 지역 연합 체제';
  return [
    { id: 'government', label: '정권·헌정', title: order.name, detail: `${order.description} ${order.tension}` },
    { id: 'economy', label: '경제·재건', title: settlement.name, detail: `${settlement.description} ${settlement.legacy}` },
    { id: 'society', label: '사회·권리', title: rightsBalance >= 25 ? '권리 중심 사회계약' : rightsBalance <= -15 ? '안보 우선 동원사회' : '교섭형 혼합 사회계약', detail: `권리 ${Math.round(input.metrics.rights)} · 번영 ${Math.round(input.metrics.prosperity)} · 불안정 ${Math.round(input.metrics.instability)}의 결합이 시민의 일상과 국가 정당성을 결정했습니다.` },
    { id: 'technology', label: '기술·미래', title: horizon.name, detail: `${horizon.description} ${horizon.tension}` },
    { id: 'world-order', label: '국제질서', title: powerShape, detail: `다극성 ${Math.round(input.metrics.multipolarity)} · 억지 ${Math.round(input.metrics.deterrence)} · 탈식민 ${Math.round(input.metrics.decolonization)}. ${order.legacy}` },
  ];
}

export function resolveHistoricalEnding(input: HistoricalEndingInput): ResolvedHistoricalEnding {
  const order = chooseAxis(endingOrderAxes, input, 'order');
  const settlement = chooseAxis(endingSettlementAxes, input, 'settlement');
  const horizon = chooseAxis(endingHorizonAxes, input, 'horizon');
  const ending = historicalEndings.find((candidate) => (
    candidate.orderId === order.candidate.id
    && candidate.settlementId === settlement.candidate.id
    && candidate.horizonId === horizon.candidate.id
  ))!;
  return {
    ...ending,
    fitScore: Math.round((order.score + settlement.score + horizon.score) / 3),
    reasons: [
      `${order.candidate.name}: 세계질서 지표와 선택 연쇄의 적합도 ${Math.round(order.score)}`,
      `${settlement.candidate.name}: 재건·경제 선택의 적합도 ${Math.round(settlement.score)}`,
      `${horizon.candidate.name}: 과학·사회 미래 선택의 적합도 ${Math.round(horizon.score)}`,
    ],
    decisiveChoices: buildDecisiveChoices(input),
    epilogueChapters: buildEpilogueChapters(order.candidate, settlement.candidate, horizon.candidate, input),
  };
}

export function getEndingAlternatives(ending: HistoricalEnding, limit = 5) {
  return historicalEndings.filter((candidate) => (
    candidate.id !== ending.id
    && [candidate.orderId === ending.orderId, candidate.settlementId === ending.settlementId, candidate.horizonId === ending.horizonId].filter(Boolean).length === 2
  )).slice(0, limit);
}
