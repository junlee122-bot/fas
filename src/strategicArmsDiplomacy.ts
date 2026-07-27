import type { EquipmentCategory, EquipmentEra, GameState, NationId } from './types';

export type StrategicStageId = 'total-war' | 'reconstruction' | 'bipolar' | 'networked' | 'horizon';
export type AcquisitionRoute = 'indigenous' | 'license' | 'import' | 'joint' | 'aid' | 'covert' | 'export';
export type ArmsDiplomacyDoctrine = 'arsenal' | 'alliance' | 'nonaligned' | 'deterrent' | 'exporter' | 'institutionalist';

export interface StrategicStage {
  id: StrategicStageId;
  label: string;
  shortLabel: string;
  startYear: number;
  endYear: number;
  equipmentEra: EquipmentEra;
  order: string;
  pressure: string;
}

export interface NationArmsProfile {
  nationId: NationId;
  industrialBase: number;
  scienceBase: number;
  importDependence: number;
  exportCapacity: number;
  sanctionsResilience: number;
  interoperability: number;
  autonomy: number;
  escalationTolerance: number;
  priorities: EquipmentCategory[];
  preferredRoutes: AcquisitionRoute[];
  historicalAnchor: string;
}

export interface WeaponProgram {
  id: string;
  stageId: StrategicStageId;
  category: EquipmentCategory;
  title: string;
  summary: string;
  historicalAnchor: string;
  sourceLabel: string;
  sourceUrl: string;
  capabilityGain: number;
  industrialLoad: number;
  scienceLoad: number;
  escalationRisk: number;
}

export interface StrategicPolicyEffects {
  capability: number;
  autonomy: number;
  interoperability: number;
  relations: number;
  treasury: number;
  escalation: number;
  legitimacy: number;
  supplySecurity: number;
  proliferation: number;
  exportInfluence: number;
  treatyCompliance: number;
}

export interface ArmsDiplomacyPolicy {
  id: string;
  stageId: StrategicStageId;
  route: AcquisitionRoute;
  title: string;
  summary: string;
  historicalBasis: string;
  sourceLabel: string;
  sourceUrl: string;
  politicalCost: number;
  reviewYears: number;
  effects: StrategicPolicyEffects;
}

export interface EquipmentProcurementQuote {
  route: AcquisitionRoute;
  routeLabel: string;
  multiplier: number;
  treasuryCost: number;
  autonomyEffect: number;
  interoperabilityEffect: number;
  riskLabel: string;
  explanation: string;
}

export const strategicStages: StrategicStage[] = [
  {
    id: 'total-war',
    label: '총력전·연합 원조',
    shortLabel: '1942–45 총력전',
    startYear: 1942,
    endYear: 1945,
    equipmentEra: 'historical',
    order: '전시동맹, 무기대여, 해상봉쇄와 점령행정이 군비 접근을 결정합니다.',
    pressure: '당장 전선에 도착하는 수량과 규격 호환성이 독자 설계보다 중요할 수 있습니다.',
  },
  {
    id: 'reconstruction',
    label: '재건·탈식민·안보조약',
    shortLabel: '1946–59 재건',
    startYear: 1946,
    endYear: 1959,
    equipmentEra: 'late-war',
    order: '전시 원조가 끝나고 재건금융, 집단방위, 독립 승인과 군사고문단이 새 질서를 만듭니다.',
    pressure: '전시 잉여장비를 받을지, 면허생산으로 산업 기반을 만들지 선택해야 합니다.',
  },
  {
    id: 'bipolar',
    label: '냉전·비동맹·군축',
    shortLabel: '1960–91 냉전',
    startYear: 1960,
    endYear: 1991,
    equipmentEra: 'cold-war',
    order: '동맹 표준화, 비동맹 조달, 대리전 원조, 핵 억제와 군축조약이 동시에 작동합니다.',
    pressure: '강대국 보호와 기술 이전을 얻을수록 외교 자율성과 공급망 선택지가 줄어듭니다.',
  },
  {
    id: 'networked',
    label: '세계화·정밀전·수출통제',
    shortLabel: '1992–2024 네트워크전',
    startYear: 1992,
    endYear: 2024,
    equipmentEra: 'modern',
    order: '공동개발, 국제 공급망, 평화유지, 제재와 책임 있는 무기이전 규범이 조달을 재편합니다.',
    pressure: '센서·소프트웨어·정밀부품의 연결성이 플랫폼 숫자보다 큰 전력 차이를 만듭니다.',
  },
  {
    id: 'horizon',
    label: '다극화·우주·자율무기 규범',
    shortLabel: '2025–60 가능미래',
    startYear: 2025,
    endYear: 2060,
    equipmentEra: 'speculative',
    order: '우주·사이버·AI 군비경쟁과 인간 통제, 기술블록, 기후안보 규칙을 플레이어가 협상합니다.',
    pressure: '빠른 자율화는 우위를 주지만 오판·확산·통제 상실 위험을 함께 키웁니다.',
  },
];

const profile = (
  nationId: NationId,
  values: Omit<NationArmsProfile, 'nationId'>,
): NationArmsProfile => ({ nationId, ...values });

export const nationArmsProfiles: Record<NationId, NationArmsProfile> = {
  britain: profile('britain', {
    industrialBase: 82, scienceBase: 88, importDependence: 32, exportCapacity: 78, sanctionsResilience: 79,
    interoperability: 82, autonomy: 84, escalationTolerance: 56,
    priorities: ['naval', 'aircraft', 'systems'], preferredRoutes: ['joint', 'indigenous', 'license'],
    historicalAnchor: '제국 해상망과 자국 연구 기반을 보유했지만 미국 생산력 및 연합 표준화와 긴밀히 결합했습니다.',
  }),
  usa: profile('usa', {
    industrialBase: 98, scienceBase: 94, importDependence: 12, exportCapacity: 100, sanctionsResilience: 94,
    interoperability: 86, autonomy: 98, escalationTolerance: 62,
    priorities: ['aircraft', 'naval', 'logistics'], preferredRoutes: ['indigenous', 'joint', 'aid'],
    historicalAnchor: '대규모 전시 생산과 원조, 전후 동맹·수출통제를 함께 운용할 수 있는 병기창형 국가입니다.',
  }),
  ussr: profile('ussr', {
    industrialBase: 91, scienceBase: 87, importDependence: 26, exportCapacity: 91, sanctionsResilience: 95,
    interoperability: 58, autonomy: 97, escalationTolerance: 81,
    priorities: ['armor', 'artillery', 'strategic'], preferredRoutes: ['indigenous', 'aid', 'covert'],
    historicalAnchor: '전시 원조를 활용하면서도 전후에는 독자 규격·대량생산과 우호국 군사원조망을 구축했습니다.',
  }),
  germany: profile('germany', {
    industrialBase: 89, scienceBase: 91, importDependence: 38, exportCapacity: 86, sanctionsResilience: 57,
    interoperability: 64, autonomy: 90, escalationTolerance: 84,
    priorities: ['armor', 'aircraft', 'systems'], preferredRoutes: ['indigenous', 'license', 'covert'],
    historicalAnchor: '높은 설계 역량과 분산된 생산·연료 제약이 공존하며 패전·분단·통합 여부에 따라 계보가 크게 갈립니다.',
  }),
  japan: profile('japan', {
    industrialBase: 83, scienceBase: 85, importDependence: 47, exportCapacity: 80, sanctionsResilience: 51,
    interoperability: 67, autonomy: 87, escalationTolerance: 67,
    priorities: ['naval', 'aircraft', 'systems'], preferredRoutes: ['indigenous', 'license', 'joint'],
    historicalAnchor: '해공군 기술과 조선 역량은 강하지만 석유·원료·후대 핵심부품의 대외 의존이 전략을 제약합니다.',
  }),
  china: profile('china', {
    industrialBase: 65, scienceBase: 72, importDependence: 71, exportCapacity: 72, sanctionsResilience: 73,
    interoperability: 54, autonomy: 70, escalationTolerance: 74,
    priorities: ['infantry', 'artillery', 'systems'], preferredRoutes: ['license', 'indigenous', 'import'],
    historicalAnchor: '분산된 산업과 복수 외국 규격에서 출발해 면허·원조를 흡수하고 독자 대량생산으로 전환할 잠재력이 있습니다.',
  }),
  india: profile('india', {
    industrialBase: 68, scienceBase: 76, importDependence: 62, exportCapacity: 65, sanctionsResilience: 72,
    interoperability: 73, autonomy: 74, escalationTolerance: 49,
    priorities: ['aircraft', 'naval', 'strategic'], preferredRoutes: ['license', 'joint', 'import'],
    historicalAnchor: '영연방 규격에서 출발하지만 비동맹 다변화와 면허생산, 독자 전략기술을 병행할 수 있습니다.',
  }),
  freefrance: profile('freefrance', {
    industrialBase: 76, scienceBase: 84, importDependence: 55, exportCapacity: 82, sanctionsResilience: 68,
    interoperability: 85, autonomy: 80, escalationTolerance: 58,
    priorities: ['aircraft', 'armor', 'strategic'], preferredRoutes: ['joint', 'license', 'indigenous'],
    historicalAnchor: '망명기 연합 장비 의존에서 해방 뒤 독자 산업·핵 억제·유럽 공동개발로 이동할 수 있습니다.',
  }),
  italy: profile('italy', {
    industrialBase: 73, scienceBase: 76, importDependence: 53, exportCapacity: 76, sanctionsResilience: 62,
    interoperability: 72, autonomy: 75, escalationTolerance: 55,
    priorities: ['naval', 'aircraft', 'armor'], preferredRoutes: ['license', 'joint', 'indigenous'],
    historicalAnchor: '제한된 대량생산과 연료 문제 속에서도 지중해 해공군, 면허생산과 지역 수출에 강점을 가집니다.',
  }),
  korea: profile('korea', {
    industrialBase: 38, scienceBase: 57, importDependence: 91, exportCapacity: 28, sanctionsResilience: 46,
    interoperability: 74, autonomy: 45, escalationTolerance: 52,
    priorities: ['infantry', 'systems', 'logistics'], preferredRoutes: ['aid', 'license', 'joint'],
    historicalAnchor: '영토·공장 없는 독립운동에서 출발하므로 승인과 원조가 생존 수단이며, 건국 뒤 면허생산과 독자 산업으로 전환합니다.',
  }),
  vietnam: profile('vietnam', {
    industrialBase: 31, scienceBase: 49, importDependence: 87, exportCapacity: 25, sanctionsResilience: 78,
    interoperability: 42, autonomy: 61, escalationTolerance: 72,
    priorities: ['infantry', 'logistics', 'artillery'], preferredRoutes: ['aid', 'covert', 'license'],
    historicalAnchor: '지하 보급과 노획·외부 원조에서 시작해 장기전 속에서 정비·분산생산 능력을 축적합니다.',
  }),
  indonesia: profile('indonesia', {
    industrialBase: 34, scienceBase: 52, importDependence: 85, exportCapacity: 31, sanctionsResilience: 63,
    interoperability: 48, autonomy: 58, escalationTolerance: 54,
    priorities: ['naval', 'logistics', 'infantry'], preferredRoutes: ['aid', 'import', 'license'],
    historicalAnchor: '군도 연락망과 잔존 장비에서 출발해 독립 승인, 해양 감시, 다변화 조달이 생존을 좌우합니다.',
  }),
  philippines: profile('philippines', {
    industrialBase: 36, scienceBase: 55, importDependence: 89, exportCapacity: 27, sanctionsResilience: 49,
    interoperability: 83, autonomy: 49, escalationTolerance: 48,
    priorities: ['naval', 'aircraft', 'systems'], preferredRoutes: ['aid', 'import', 'joint'],
    historicalAnchor: '미군 규격·기지·원조와 높은 상호운용성을 얻는 대신 외교·정비 자율성의 비용을 부담합니다.',
  }),
};

const ARMY_LOGISTICS = 'https://history.army.mil/Publications/Publications-Catalog/Logistics-in-World-War-II/';
const NATO_STANDARDIZATION = 'https://www.nato.int/cps/uk/natohq/topics_69269.htm?selectedLocale=en';
const NATO_HISTORY = 'https://www.nato.int/en/about-us/nato-history/a-short-history-of-nato';
const BANDUNG = 'https://history.state.gov/milestones/1953-1960/bandung-conf';
const UN_CHARTER = 'https://www.un.org/en/about-us/un-charter/';
const UN_DECOLONIZATION = 'https://www.un.org/dppa/decolonization/en/about';
const NPT = 'https://www.unoda.org/en/our-work/weapons-mass-destruction/nuclear-weapons/treaty-non-proliferation-nuclear-weapons';
const IAEA_SAFEGUARDS = 'https://www.iaea.org/newscenter/news/nuclear-safeguards-conclusions-presented-2016-safeguards-implementation-report';
const ARMS_TRADE = 'https://www.unoda.org/en/our-work/conventional-arms/legal-instruments/arms-trade-treaty';
const ASEAN_TAC = 'https://asean.org/wp-content/uploads/2021/01/20131230235433.pdf';
const OSCE_HISTORY = 'https://www.osce.org/history';
const OUTER_SPACE = 'https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/introouterspacetreaty.html';
const MILITARY_AI = 'https://www.unoda.org/en/our-work/emerging-challenges/artificial-intelligence-military-domain';
const AUTONOMOUS_WEAPONS = 'https://www.unoda.org/en/our-work/emerging-challenges/lethal-autonomous-weapon-systems';
const CYBER_NORMS = 'https://digitallibrary.un.org/record/3934214?ln=en';

type ProgramSeed = [
  EquipmentCategory,
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  number,
];

const programSeeds: Record<StrategicStageId, ProgramSeed[]> = {
  'total-war': [
    ['infantry', '분대화기·탄약 규격 통합', '소총·기관총·박격포 탄약과 정비품을 단순화해 보충병도 빠르게 전력화합니다.', '대량생산과 표준화가 공장부터 전선까지의 보급을 좌우했습니다.', 'U.S. Army Center of Military History', 12, 7, 3, 2],
    ['artillery', '전구 화력지휘·차량화 포병단', '관측, 통신, 포탄 수송과 견인차를 한 체계로 묶어 화력 전환 시간을 줄입니다.', '총력전 병참은 조달·수송·정비를 단일 체계로 관리했습니다.', 'U.S. Army Center of Military History', 14, 9, 4, 3],
    ['armor', '표준 중형전차·회수정비 군단', '최고 성능 한 종보다 수리 가능한 차체와 회수차·부품망을 함께 양산합니다.', '미 육군 병참 보고서는 M4 중형전차 표준화와 생산·보급의 관계를 기록합니다.', 'U.S. Army Center of Military History', 15, 12, 5, 4],
    ['aircraft', '레이더 요격·전시 항공생산망', '조기경보, 관제, 요격기와 예비부품 생산을 하나의 방공 체계로 만듭니다.', '전시 항공력은 기체뿐 아니라 경보·기지·정비 네트워크에 의존했습니다.', 'U.S. Army Center of Military History', 15, 12, 7, 5],
    ['naval', '호송선단·항모·대잠 통합전단', '상선 호송, 대잠초계, 함재기와 수리기지를 묶어 해상 보급로를 지킵니다.', '전구 병참은 공장과 해외 전선을 잇는 선박·항만망을 포함했습니다.', 'U.S. Army Center of Military History', 16, 14, 6, 5],
    ['logistics', '표준차량·항만·전구 정비망', '트럭, 철도, 항만 하역, 연료와 예비부품을 공통 계획으로 운용합니다.', '미 육군 전후 보고서는 제2차 세계대전을 공장부터 전선까지 이어진 병참전으로 평가합니다.', 'U.S. Army Center of Military History', 13, 8, 3, 1],
    ['systems', '레이더·암호·연합 작전실', '탐지·통신·암호해독 자료를 지휘소에 모아 전구 공통 상황도를 만듭니다.', '연합 작전의 효과는 장비와 절차, 정보 공유의 호환성에 달려 있었습니다.', 'U.S. Army Center of Military History', 15, 8, 10, 4],
    ['strategic', '원자연구·장거리 유도무기국', '과학자, 희귀 자원, 시험장과 폭격·로켓 운반체를 국가사업으로 묶습니다.', '후기 총력전의 과학 동원과 전략무기 경쟁을 사료 기반 출발점으로 삼습니다.', 'U.S. Army Center of Military History', 19, 17, 17, 14],
  ],
  reconstruction: [
    ['infantry', '중간탄약·선택사격 보병체계', '전시 경험을 바탕으로 분대 화력을 재설계하고 동맹 탄약 규격과의 호환을 정합니다.', '전후 동맹 표준화는 탄약부터 교리·절차까지 확장됐습니다.', 'NATO', 14, 8, 6, 2],
    ['artillery', '자주포·전술로켓 화력여단', '기계화 부대와 함께 이동하는 자주포와 초기 유도·로켓 화력을 편성합니다.', '군사 준비태세 협력과 공동 규격은 집단방위의 기반이 됐습니다.', 'NATO', 16, 11, 8, 5],
    ['armor', '주력전차·기계화보병 공통차체', '전시 중·중전차 역할을 통합하고 동맹국 면허생산 또는 독자 차체를 선택합니다.', '초기 NATO는 군사 준비태세와 표준화 기구를 제도화했습니다.', 'NATO', 17, 14, 9, 5],
    ['aircraft', '제트 요격·전천후 방공망', '제트 추진, 지상 레이더와 활주로 네트워크를 통합합니다.', '동맹 방공은 공동 기지·통신·절차를 요구했습니다.', 'NATO', 18, 15, 12, 7],
    ['naval', '전후 항모·대잠 초계함대', '잠수함 탐지, 해상초계기와 항모 전단을 재건된 조선소에 연결합니다.', '집단방위는 북대서양 해상교통로와 공동 작전능력을 중시했습니다.', 'NATO', 18, 16, 10, 6],
    ['logistics', '전략공수·표준 팔레트 보급', '수송기, 화물 표준과 해외 기지 접근권을 결합해 신속 전개합니다.', '표준화는 중복을 줄이고 동맹 자원을 함께 쓰게 합니다.', 'NATO', 15, 10, 7, 2],
    ['systems', '조기경보·반도체 지휘통제', '장거리 센서와 초기 계산·데이터링크를 방공 지휘소에 연결합니다.', 'NATO 과학협력과 상호운용성은 기술·절차·인적 차원을 함께 다뤘습니다.', 'NATO', 18, 12, 14, 6],
    ['strategic', '원자력·탄도미사일 선택', '평화적 원자력, 독자 핵무장, 동맹 핵우산 또는 국제 관리 사이에서 경로를 고릅니다.', '전후 집단방위와 원자력 국제관리의 긴장이 핵 질서를 형성했습니다.', 'United Nations', 22, 20, 20, 18],
  ],
  bipolar: [
    ['infantry', '표준 소구경탄·대전차유도 분대', '경량 개인화기와 휴대 대전차·방공 능력을 분대 네트워크에 넣습니다.', '동맹 표준은 탄약 교환과 공동 훈련의 비용을 줄였습니다.', 'NATO', 16, 9, 8, 3],
    ['artillery', '대포병 레이더·정밀 전술미사일', '탐지부터 사격까지 시간을 줄이되 미사일 확산과 위기 고조를 관리합니다.', '헬싱키 과정과 재래식 군비통제는 군사 투명성을 안보의 일부로 만들었습니다.', 'OSCE', 19, 13, 13, 8],
    ['armor', '복합장갑 주력전차·기계화군단', '열상·사격통제와 복합장갑을 갖춘 전차군을 동맹 또는 비동맹 규격으로 편성합니다.', '냉전 블록은 장비 규격과 훈련을 장기적으로 묶었습니다.', 'NATO', 20, 17, 13, 7],
    ['aircraft', '초음속 다목적기·공중조기경보', '레이더 유도무장, 공중급유와 조기경보로 지역 방공망을 확장합니다.', '상호운용은 통신·기지·훈련을 공유하는 능력까지 포함합니다.', 'NATO', 21, 18, 16, 9],
    ['naval', '유도탄 함대·원자력 잠수전', '대함·방공 미사일, 장기 잠항과 해양감시망으로 억제선을 만듭니다.', '핵 비확산과 해양 동맹의 압력이 전략잠수함 선택에 개입합니다.', 'UNODA', 22, 20, 18, 13],
    ['logistics', '컨테이너화·전략 수송사령부', '민군 항만, 항공수송과 표준 화물을 동맹 전개계획에 연결합니다.', '동맹 표준화는 시설·연료 연결부·보급 절차의 호환을 포함합니다.', 'NATO', 17, 11, 9, 2],
    ['systems', '위성정찰·통합 방공 지휘망', '우주 감시, 데이터링크와 전자전을 국가 지휘망으로 통합합니다.', '우주조약은 자유로운 이용과 WMD 궤도 배치 금지를 동시에 규정했습니다.', 'UNOOSA', 22, 15, 20, 10],
    ['strategic', '핵 억제·사찰·군축 삼각체계', '핵전력, IAEA 안전조치와 군축 협상을 연동해 생존성과 국제 접근을 조절합니다.', 'NPT는 비확산·평화적 이용·군축을 하나의 거래구조로 묶었습니다.', 'UNODA · IAEA', 26, 23, 24, 22],
  ],
  networked: [
    ['infantry', '모듈식 개인장비·전술 데이터망', '광학·야간장비·무전·무인정찰을 분대 공통망으로 묶습니다.', '현대 상호운용성은 장비 공유보다 연결·통신·자료 교환을 중시합니다.', 'NATO', 18, 11, 13, 4],
    ['artillery', '센서-사수 정밀화력망', '위성·무인기 표적정보와 유도탄을 연결하고 수출통제 부품 의존을 관리합니다.', '무기이전 규범은 재래식 무기의 책임 있는 거래와 전용 위험을 다룹니다.', 'UNODA', 22, 16, 19, 10],
    ['armor', '능동방호·무인차량 협동여단', '전차, 보병전투차와 무인정찰·방호체계를 공통 데이터망에서 운용합니다.', '공동개발은 비용을 나누지만 표준·소프트웨어 주권을 협상하게 합니다.', 'NATO', 22, 19, 18, 9],
    ['aircraft', '저피탐·센서융합 연합항공군', '공동상황도와 정밀무장을 공유하되 핵심 소프트웨어 접근권을 별도 협상합니다.', '상호운용은 기술·절차·인적·정보 차원의 결합을 요구합니다.', 'NATO', 24, 22, 22, 12],
    ['naval', '통합방공·협동교전 해양망', '함정·잠수함·해상초계기·위성의 표적정보를 실시간 교환합니다.', '공통 표준은 다국적 함대가 서로의 기반시설과 데이터를 쓰게 합니다.', 'NATO', 24, 23, 21, 11],
    ['logistics', '예측정비·글로벌 부품 공급망', '민간 물류와 군수 재고를 연결하되 제재·팬데믹·해협 봉쇄에 대비해 이중화합니다.', '책임 있는 이전과 국제 공급망은 비용 절감과 제재 노출을 동시에 만듭니다.', 'UNODA', 20, 14, 17, 4],
    ['systems', '사이버전자전·다영역 지휘망', '사이버 방어, 전자전, 우주·지상 센서를 공통 작전상에 연결합니다.', 'UN 사이버 논의는 국제법·책임 있는 국가행동·신뢰구축·역량강화를 함께 다룹니다.', 'United Nations', 25, 17, 25, 14],
    ['strategic', '미사일방어·정밀 장거리타격', '다층 방어와 원거리 타격을 구축하면서 오판과 선제공격 유인을 통제합니다.', '재래식 무기이전과 비확산 규범은 전략체계의 외교 비용을 높입니다.', 'UNODA', 27, 25, 24, 20],
  ],
  horizon: [
    ['infantry', '인간-로봇 협동 전투생태계', '착용 센서, 무인 지원과 인간 승인 절차를 분대 교리에 포함합니다.', '군사 AI 규범은 전 생애주기의 국제법 적용과 책임성 격차를 논의합니다.', 'UNODA', 20, 13, 22, 9],
    ['artillery', '분산 자율화력·교전 승인망', '자율 표적추천과 장거리 효과기를 결합하되 인간 승인·감사 기록을 의무화할 수 있습니다.', '자율무기 논의는 예측 가능성과 인간 통제·감독을 핵심 쟁점으로 둡니다.', 'UNODA', 25, 18, 27, 17],
    ['armor', '선택유인 모듈식 지상전투군', '유인 지휘차와 무인 전투차를 임무별로 재구성하고 통제권 상실 위험을 관리합니다.', '자율기능은 방어체계부터 무인 전투체계까지 이미 다양한 수준으로 존재합니다.', 'UNODA', 25, 21, 27, 16],
    ['aircraft', '유·무인 협동 항공군', '유인기, 협동전투기와 분산 센서를 인간 지휘 아래 운용합니다.', '군사 AI는 의사결정 지원부터 무기 관련 기능까지 넓은 용도를 가집니다.', 'UNODA', 27, 24, 29, 18],
    ['naval', '분산 무인 해양억제망', '유·무인 수상·수중 플랫폼을 군집 운용하고 해저 인프라 방호 규칙을 협상합니다.', '책임성과 예측 가능성은 자율체계의 해양 확산에서도 핵심 제약입니다.', 'UNODA', 27, 25, 28, 18],
    ['logistics', '분산제조·무탄소 자립 보급권', '현장 제조, 에너지 마이크로그리드와 재활용으로 봉쇄·재난 속 보급을 지속합니다.', '미래 안보협력은 군사력과 기후·재난 회복력을 함께 다룰 수 있습니다.', 'United Nations', 23, 19, 24, 6],
    ['systems', '검증가능 AI·양자감시 지휘망', '결정 근거를 감사할 수 있는 AI와 분산 센서를 연결하고 사이버 신뢰조치를 설계합니다.', 'UN의 ICT 안보 논의는 규범·국제법·신뢰구축·역량강화를 제도화하고 있습니다.', 'United Nations', 29, 21, 32, 18],
    ['strategic', '우주·극초음속 위기관리 체계', '궤도 감시와 고속 타격을 개발하면서 우주 WMD 금지, 통보·검증 장치를 함께 설계합니다.', '우주조약은 평화적 이용, WMD 궤도배치 금지와 국제 협력을 기본 틀로 둡니다.', 'UNOOSA', 31, 29, 32, 27],
  ],
};

const sourceForProgram = (stageId: StrategicStageId, category: EquipmentCategory) => {
  if (stageId === 'total-war') return ARMY_LOGISTICS;
  if (stageId === 'reconstruction') return category === 'strategic' ? UN_CHARTER : NATO_HISTORY;
  if (stageId === 'bipolar') {
    if (category === 'strategic') return NPT;
    if (category === 'systems') return OUTER_SPACE;
    if (category === 'artillery') return OSCE_HISTORY;
    return NATO_STANDARDIZATION;
  }
  if (stageId === 'networked') {
    if (category === 'systems') return CYBER_NORMS;
    if (category === 'artillery' || category === 'logistics' || category === 'strategic') return ARMS_TRADE;
    return NATO_STANDARDIZATION;
  }
  if (category === 'strategic') return OUTER_SPACE;
  if (category === 'logistics') return UN_CHARTER;
  return category === 'systems' ? CYBER_NORMS : category === 'infantry' || category === 'aircraft' ? MILITARY_AI : AUTONOMOUS_WEAPONS;
};

export const weaponPrograms: WeaponProgram[] = strategicStages.flatMap((stage) => (
  programSeeds[stage.id].map(([category, title, summary, historicalAnchor, sourceLabel, capabilityGain, industrialLoad, scienceLoad, escalationRisk]) => ({
    id: `${stage.id}-${category}`,
    stageId: stage.id,
    category,
    title,
    summary,
    historicalAnchor,
    sourceLabel,
    sourceUrl: sourceForProgram(stage.id, category),
    capabilityGain,
    industrialLoad,
    scienceLoad,
    escalationRisk,
  }))
));

const zeroEffects = (): StrategicPolicyEffects => ({
  capability: 0,
  autonomy: 0,
  interoperability: 0,
  relations: 0,
  treasury: 0,
  escalation: 0,
  legitimacy: 0,
  supplySecurity: 0,
  proliferation: 0,
  exportInfluence: 0,
  treatyCompliance: 0,
});

const policy = (
  stageId: StrategicStageId,
  id: string,
  route: AcquisitionRoute,
  title: string,
  summary: string,
  historicalBasis: string,
  sourceLabel: string,
  sourceUrl: string,
  politicalCost: number,
  reviewYears: number,
  effects: Partial<StrategicPolicyEffects>,
): ArmsDiplomacyPolicy => ({
  id,
  stageId,
  route,
  title,
  summary,
  historicalBasis,
  sourceLabel,
  sourceUrl,
  politicalCost,
  reviewYears,
  effects: { ...zeroEffects(), ...effects },
});

export const armsDiplomacyPolicies: ArmsDiplomacyPolicy[] = [
  policy('total-war', 'emergency-aid', 'aid', '긴급 무기대여·원조선', '공급국 규격을 받아들이고 당장 필요한 장비·연료·수송선을 확보합니다.', '전시 원조는 현금구매가 어려운 동맹의 작전 지속을 가능하게 했지만 전쟁 종료와 함께 급격히 바뀔 수 있었습니다.', 'U.S. Office of the Historian', 'https://history.state.gov/historicaldocuments/frus1945v06/d55', 8, 1, { capability: 11, relations: 9, treasury: 70, autonomy: -7, interoperability: 8, supplySecurity: 6 }),
  policy('total-war', 'licensed-mass-production', 'license', '전시 면허 대량생산', '외국 설계를 자국 공장 규격에 맞춰 양산하고 정비 인력을 함께 육성합니다.', '전시 표준화는 생산량과 수리성을 높였지만 설계 변경과 공장 전환 비용을 요구했습니다.', 'U.S. Army Center of Military History', ARMY_LOGISTICS, 10, 2, { capability: 9, autonomy: 5, interoperability: 5, treasury: -60, supplySecurity: 10 }),
  policy('total-war', 'combined-standards', 'joint', '연합 탄약·통신 표준위원회', '탄약, 연료 연결부, 무전 절차와 보급 문서를 동맹과 맞춥니다.', '상호운용성은 물자 규격뿐 아니라 절차와 정보 교환을 함께 요구합니다.', 'NATO', NATO_STANDARDIZATION, 9, 2, { interoperability: 14, relations: 6, capability: 4, autonomy: -2, supplySecurity: 8 }),
  policy('total-war', 'strategic-embargo', 'covert', '전략물자 금수·봉쇄망', '상대의 연료·공작기계·희소금속 접근을 차단하고 우회조달망을 추적합니다.', '총력전의 생산과 해상수송은 외교·봉쇄와 분리할 수 없었습니다.', 'United Nations Charter', UN_CHARTER, 11, 1, { capability: 3, relations: -6, escalation: 9, supplySecurity: 4, exportInfluence: 7 }),
  policy('total-war', 'scientific-mission', 'joint', '연합 과학사절단', '레이더·암호·의학·원자연구 자료를 제한적으로 교환합니다.', '전시 과학동원은 국가 간 자료 접근과 보안 장벽을 동시에 만들었습니다.', 'U.S. Army Center of Military History', ARMY_LOGISTICS, 12, 2, { capability: 10, interoperability: 6, relations: 5, autonomy: -2, proliferation: 6 }),
  policy('total-war', 'neutral-procurement', 'import', '중립시장 현금 조달', '블록 밖 상사와 제3국을 통해 부족 장비를 빠르게 구매합니다.', '현금조달은 빠르지만 가격·봉쇄·규격 혼재 위험을 키웁니다.', 'U.S. Army Center of Military History', ARMY_LOGISTICS, 7, 1, { capability: 7, treasury: -45, autonomy: 3, interoperability: -5, supplySecurity: -3 }),

  policy('reconstruction', 'mutual-defense', 'joint', '상호방위조약·군사고문단', '안보 보장과 기지·훈련 접근을 교환해 새 군대를 빠르게 제도화합니다.', '북대서양조약은 집단방위와 군사 준비태세 협력을 연결했습니다.', 'NATO', 'https://www.nato.int/en/about-us/organization/founding-treaty', 13, 4, { relations: 12, interoperability: 13, capability: 7, autonomy: -6, legitimacy: 4 }),
  policy('reconstruction', 'arsenal-reconstruction-credit', 'license', '병기창 재건차관', '철도·조선소·병기창 재건금융을 면허생산과 묶습니다.', '마셜 플랜과 안보협력은 경제 회복과 군사 안정이 병행돼야 한다는 논리에서 발전했습니다.', 'U.S. Office of the Historian', 'https://history.state.gov/milestones/1945-1952/nato', 11, 5, { treasury: 95, capability: 6, autonomy: 5, supplySecurity: 9, relations: 7 }),
  policy('reconstruction', 'demobilization-control', 'indigenous', '동원해제·군수산업 전환', '과잉 전시 생산을 민수·예비전력 체계로 바꿔 재정과 정통성을 회복합니다.', '전시 원조와 계약의 종료는 재고 처리와 민수 전환을 외교 의제로 만들었습니다.', 'U.S. Office of the Historian', 'https://history.state.gov/historicaldocuments/frus1945v06/d55', 8, 3, { treasury: 80, legitimacy: 9, escalation: -8, capability: -3, supplySecurity: 4 }),
  policy('reconstruction', 'decolonization-security-compact', 'joint', '독립·기지·방위협약 일괄협상', '독립 승인, 기지 철수 일정과 새 국가의 방위 원조를 하나의 협정으로 다룹니다.', '유엔 헌장은 자결과 비자치지역 주민의 발전·자치 준비 의무를 제도화했습니다.', 'United Nations', UN_DECOLONIZATION, 12, 4, { legitimacy: 13, relations: 8, autonomy: 12, capability: 3, escalation: -4 }),
  policy('reconstruction', 'surplus-arms-transfer', 'import', '전시 잉여장비 인수', '낮은 가격에 즉시 전력을 만들지만 부품 단종과 낡은 교리에 묶일 수 있습니다.', '전시 원조 종료 뒤 재고와 계약 인수는 실제 협상 대상이 됐습니다.', 'U.S. Office of the Historian', 'https://history.state.gov/historicaldocuments/frus1945v06/d55', 7, 2, { capability: 9, treasury: -25, autonomy: -4, interoperability: 7, supplySecurity: -7 }),
  policy('reconstruction', 'atomic-oversight', 'joint', '원자력 국제관리 제안', '연료·연구 접근을 국제 신고와 사찰, 군사 전용 금지와 교환합니다.', '전후 원자력 국제관리 논의는 이후 IAEA와 비확산 체계의 토대가 됐습니다.', 'IAEA', IAEA_SAFEGUARDS, 14, 6, { capability: 5, relations: 10, treatyCompliance: 15, proliferation: -11, autonomy: -4 }),

  policy('bipolar', 'alliance-standardization', 'joint', '동맹 표준화·공동군수', '탄약·통신·정비·교리를 동맹 표준에 맞춰 공동 작전 비용을 낮춥니다.', 'NATO는 표준화를 상호운용성과 비용 효율적 전력의 핵심으로 설명합니다.', 'NATO', NATO_STANDARDIZATION, 13, 5, { interoperability: 18, relations: 10, supplySecurity: 12, autonomy: -7, capability: 6 }),
  policy('bipolar', 'nonaligned-diversification', 'import', '비동맹 다변화 조달', '서로 다른 블록에서 장비와 차관을 받아 한 공급국의 압력을 상쇄합니다.', '반둥회의는 주권·불간섭·평화공존과 강대국 의존 축소를 강조했습니다.', 'U.S. Office of the Historian', BANDUNG, 12, 4, { autonomy: 14, relations: 4, capability: 7, interoperability: -8, supplySecurity: 2 }),
  policy('bipolar', 'npt-safeguards', 'joint', 'NPT 가입·IAEA 전면안전조치', '평화적 원자력 접근과 국제 신뢰를 얻는 대신 핵무장 선택을 제한합니다.', 'NPT는 비확산, 평화적 이용과 군축을 결합하고 IAEA 검증을 핵심 장치로 둡니다.', 'UNODA · IAEA', NPT, 15, 8, { treatyCompliance: 22, relations: 12, proliferation: -20, legitimacy: 6, autonomy: -5, capability: 4 }),
  policy('bipolar', 'proxy-military-aid', 'aid', '우호세력 군사원조', '고문단·장비·훈련으로 우호정부나 해방운동의 전력을 키웁니다.', '냉전 원조는 현지 분쟁을 국제 블록 경쟁과 연결했습니다.', 'United Nations Charter', UN_CHARTER, 11, 3, { exportInfluence: 14, relations: 5, escalation: 13, treasury: -70, proliferation: 8 }),
  policy('bipolar', 'indigenous-deterrent', 'indigenous', '독자 억제력·비밀기술국', '외부 보장에 의존하지 않는 전략무기·미사일·잠수전 기반을 구축합니다.', '핵 비확산 체제는 독자 억제와 평화적 기술 접근 사이에 큰 외교 비용을 만듭니다.', 'UNODA', NPT, 18, 10, { capability: 16, autonomy: 15, escalation: 16, proliferation: 18, relations: -10, treasury: -130 }),
  policy('bipolar', 'hotline-arms-control', 'joint', '핫라인·사전통보·재래식 군축', '훈련 통보, 검증, 위기 연락망으로 기습 우려와 오판을 줄입니다.', '헬싱키 과정은 군사·경제·인권 약속을 유럽 안보의 한 틀에 넣었습니다.', 'OSCE', OSCE_HISTORY, 12, 5, { escalation: -15, treatyCompliance: 16, relations: 9, legitimacy: 5, capability: -2 }),

  policy('networked', 'joint-procurement', 'joint', '다국적 공동개발·분업생산', '개발비를 나누고 부품생산을 배분하되 요구성능과 수출권을 공동 결정합니다.', 'NATO 상호운용은 산업과 개방형 표준을 통해 자원 중복을 줄이는 방향으로 발전했습니다.', 'NATO', 'https://www.nato.int/en/what-we-do/deterrence-and-defence/interoperability-connecting-forces?selectedLocale=em', 14, 7, { capability: 11, interoperability: 16, relations: 10, treasury: -55, autonomy: -4, supplySecurity: 7 }),
  policy('networked', 'responsible-export-controls', 'export', '책임수출·최종사용자 검증', '수출 심사와 사후 검증으로 시장 신뢰를 얻고 불법 전용 위험을 줄입니다.', '무기거래조약은 재래식 무기 국제거래의 공통 기준과 불법 거래 억제를 목표로 합니다.', 'UNODA', ARMS_TRADE, 11, 5, { exportInfluence: 12, treatyCompliance: 15, relations: 7, proliferation: -10, treasury: 45 }),
  policy('networked', 'peacekeeping-assistance', 'aid', '평화유지·안보부문 개혁단', '훈련·공병·의무·감시 장비를 제공해 파트너 제도를 강화합니다.', '유엔 헌장 체계는 분쟁의 평화적 해결과 국제 평화·안전 유지를 제도화했습니다.', 'United Nations', UN_CHARTER, 10, 4, { legitimacy: 11, relations: 10, interoperability: 7, escalation: -5, treasury: -40 }),
  policy('networked', 'regional-code-conduct', 'joint', '지역 불가침·분쟁해결 규범', '영토분쟁을 협의체와 중재 절차로 관리하고 군비 투명성을 높입니다.', 'ASEAN 우호협력조약은 주권존중·불간섭·평화적 해결·무력위협 포기를 원칙으로 둡니다.', 'ASEAN', ASEAN_TAC, 10, 5, { relations: 13, escalation: -12, legitimacy: 6, treatyCompliance: 11 }),
  policy('networked', 'precision-network-access', 'license', '정밀센서·암호망 접근협정', '정밀유도·위성자료·암호키 접근을 공동작전 조건과 교환합니다.', '현대 상호운용은 하드웨어보다 연결·데이터·서비스 교환 능력을 중시합니다.', 'NATO', 'https://www.nato.int/en/what-we-do/deterrence-and-defence/interoperability-connecting-forces?selectedLocale=em', 16, 6, { capability: 14, interoperability: 17, autonomy: -10, relations: 9, supplySecurity: 3 }),
  policy('networked', 'illicit-transfer-interdiction', 'covert', '불법무기·우회수출 차단망', '금융·선박·최종사용자 정보를 공유해 제재 회피와 무기 전용을 추적합니다.', 'ATT는 무책임한 이전과 금수 위반이 지역 안정·민간인·개발을 해친다는 문제의식에서 출발했습니다.', 'UNODA', ARMS_TRADE, 12, 3, { treatyCompliance: 12, proliferation: -12, exportInfluence: 5, relations: 3, escalation: 3 }),

  policy('horizon', 'human-control-protocol', 'joint', '자율무기 인간통제 의정서', '표적선정·무력사용의 인간 승인, 설명가능성, 사고 조사와 중단 장치를 의무화합니다.', 'UN 자율무기 논의는 예측 가능성, 국제법 준수와 인간 통제·감독을 핵심으로 다룹니다.', 'UNODA', AUTONOMOUS_WEAPONS, 14, 6, { treatyCompliance: 18, proliferation: -11, legitimacy: 10, escalation: -10, capability: 2 }),
  policy('horizon', 'autonomous-joint-lab', 'joint', '검증가능 군사 AI 공동연구소', '훈련자료·시험장·안전평가를 공유해 중소국도 신뢰 가능한 AI 체계에 접근합니다.', '유엔은 군사 AI의 전 생애주기에서 국제법 적용과 국가 간 역량 격차를 논의합니다.', 'UNODA', MILITARY_AI, 16, 7, { capability: 15, interoperability: 13, relations: 8, autonomy: -4, proliferation: 5 }),
  policy('horizon', 'space-incident-regime', 'joint', '우주 활동 통보·사고방지 체제', '궤도배치, 근접기동과 파편 발생 시험을 통보하고 긴급 연락망을 둡니다.', '우주조약은 평화적 이용, WMD 궤도 배치 금지와 유해 간섭 시 협의를 규정합니다.', 'UNOOSA', OUTER_SPACE, 15, 8, { escalation: -14, treatyCompliance: 17, relations: 11, capability: 3, autonomy: -2 }),
  policy('horizon', 'resilient-supply-club', 'license', '반도체·에너지·희소광물 복원력 연합', '핵심부품 공동비축, 상호대체 생산과 위기 수출면제 규칙을 만듭니다.', '상호운용성과 표준화는 자원의 공동 사용과 중복 감소를 가능하게 합니다.', 'NATO', NATO_STANDARDIZATION, 13, 6, { supplySecurity: 18, interoperability: 10, relations: 8, autonomy: 4, treasury: -60 }),
  policy('horizon', 'cyber-confidence-network', 'joint', '사이버 신뢰·핵심기반시설 보호망', '사고 연락망, 취약점 통보와 핵심 민간시설 불공격 규범을 협상합니다.', 'UN ICT 안보 논의는 책임 있는 국가행동, 국제법, 신뢰구축과 역량강화를 함께 다룹니다.', 'United Nations', CYBER_NORMS, 13, 5, { escalation: -11, treatyCompliance: 14, interoperability: 9, relations: 8, capability: 4 }),
  policy('horizon', 'sovereign-ai-deterrent', 'indigenous', '주권 AI·극초음속 독자 억제', '외부 클라우드와 모델에 의존하지 않는 지휘 AI와 고속 전략체계를 구축합니다.', '군사 AI와 자율체계는 우위뿐 아니라 예측불가능성·확산·책임 문제를 발생시킵니다.', 'UNODA', MILITARY_AI, 19, 9, { capability: 18, autonomy: 16, escalation: 18, proliferation: 13, relations: -8, treasury: -145 }),
];

export const acquisitionRouteLabels: Record<AcquisitionRoute, string> = {
  indigenous: '독자 개발',
  license: '면허 생산',
  import: '직도입',
  joint: '공동 개발',
  aid: '군사 원조',
  covert: '비공식 조달',
  export: '책임 수출',
};

export function getStrategicStage(year: number): StrategicStage {
  return strategicStages.find((stage) => year >= stage.startYear && year <= stage.endYear)
    ?? (year < strategicStages[0].startYear ? strategicStages[0] : strategicStages[strategicStages.length - 1]);
}

export function getNationArmsProfile(nationId: NationId): NationArmsProfile {
  return nationArmsProfiles[nationId];
}

export function getStageWeaponPrograms(stageId: StrategicStageId) {
  return weaponPrograms.filter((program) => program.stageId === stageId);
}

export function getStageDiplomaticPolicies(stageId: StrategicStageId) {
  return armsDiplomacyPolicies.filter((item) => item.stageId === stageId);
}

export function getStrategicDecisionId(policyId: string, stageId: StrategicStageId) {
  return `arms-diplomacy-${stageId}-${policyId}`;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function enactedPolicyIds(completedDecisions: string[]) {
  return new Set(completedDecisions.filter((id) => id.startsWith('arms-diplomacy-')));
}

export function getEquipmentProcurementQuote(
  nationId: NationId,
  year: number,
  category: EquipmentCategory,
  baseCost: number,
  completedDecisions: string[] = [],
): EquipmentProcurementQuote {
  const nation = getNationArmsProfile(nationId);
  const stage = getStrategicStage(year);
  const enacted = enactedPolicyIds(completedDecisions);
  const priority = nation.priorities.includes(category);
  const route = nation.preferredRoutes[0];
  const industrialPenalty = (70 - nation.industrialBase) / 180;
  const priorityDiscount = priority ? -0.08 : 0.03;
  const eraComplexity = strategicStages.indexOf(stage) * 0.025;
  let policyDiscount = 0;
  let autonomyEffect = route === 'indigenous' ? 5 : route === 'license' ? 2 : route === 'joint' ? -1 : -4;
  let interoperabilityEffect = route === 'joint' ? 7 : route === 'license' ? 4 : route === 'aid' || route === 'import' ? 5 : -1;

  getStageDiplomaticPolicies(stage.id).forEach((item) => {
    if (!enacted.has(getStrategicDecisionId(item.id, stage.id))) return;
    if (item.route === 'license' || item.route === 'joint') policyDiscount += 0.055;
    if (item.route === 'aid' || item.route === 'import') policyDiscount += 0.035;
    autonomyEffect += Math.round(item.effects.autonomy / 6);
    interoperabilityEffect += Math.round(item.effects.interoperability / 6);
  });

  const multiplier = clamp(1 + industrialPenalty + priorityDiscount + eraComplexity - policyDiscount, 0.62, 1.48);
  const treasuryCost = Math.max(20, Math.round(baseCost * multiplier));
  const riskLabel = nation.importDependence >= 75 && route !== 'indigenous'
    ? '공급 중단 고위험'
    : nation.sanctionsResilience < 55
      ? '제재 취약'
      : route === 'indigenous' && nation.scienceBase < 60
        ? '개발 지연 위험'
        : '관리 가능';
  return {
    route,
    routeLabel: acquisitionRouteLabels[route],
    multiplier: Math.round(multiplier * 100) / 100,
    treasuryCost,
    autonomyEffect,
    interoperabilityEffect,
    riskLabel,
    explanation: `${priority ? '국가 중점 분야' : '비중점 분야'} · 산업 ${nation.industrialBase} · 과학 ${nation.scienceBase} · 수입의존 ${nation.importDependence}`,
  };
}

export function applyStrategicPolicyReward(game: GameState, policyItem: ArmsDiplomacyPolicy): GameState {
  const effects = policyItem.effects;
  return {
    ...game,
    treasury: Math.max(0, game.treasury + effects.treasury),
    stability: clamp(game.stability + Math.round(effects.legitimacy / 2)),
    warSupport: clamp(game.warSupport + Math.round((effects.capability + effects.legitimacy - Math.max(0, effects.escalation)) / 6)),
    commandPoints: Math.max(0, game.commandPoints + Math.round((effects.capability + effects.interoperability) / 4)),
    fuel: Math.max(0, game.fuel + Math.round(effects.supplySecurity / 2)),
    intelNetwork: clamp(game.intelNetwork + Math.round((effects.supplySecurity + effects.treatyCompliance) / 5)),
    airPower: clamp(game.airPower + Math.round(effects.capability / 5)),
    navalPower: clamp(game.navalPower + Math.round(effects.capability / 6)),
    enemyPressure: clamp(game.enemyPressure + Math.round(effects.escalation / 3)),
  };
}

export function applyStrategicPolicyRelations<T extends { id: string; value: number }>(
  relations: T[],
  policyItem: ArmsDiplomacyPolicy,
): T[] {
  const relationChange = policyItem.effects.relations;
  return relations.map((relation, index) => ({
    ...relation,
    value: clamp(relation.value + (index === 0 ? relationChange : Math.round(relationChange / 2))),
  }));
}

export function getPolicyEffectLabels(policyItem: ArmsDiplomacyPolicy) {
  const labels: Array<[number, string]> = [
    [policyItem.effects.capability, '전력'],
    [policyItem.effects.autonomy, '자율성'],
    [policyItem.effects.interoperability, '상호운용'],
    [policyItem.effects.relations, '관계'],
    [policyItem.effects.supplySecurity, '공급안보'],
    [policyItem.effects.escalation, '긴장'],
    [policyItem.effects.proliferation, '확산'],
    [policyItem.effects.treatyCompliance, '규범신뢰'],
  ];
  return labels
    .filter(([value]) => value !== 0)
    .sort((left, right) => Math.abs(right[0]) - Math.abs(left[0]))
    .slice(0, 4)
    .map(([value, label]) => `${label} ${value > 0 ? '+' : ''}${value}`);
}
