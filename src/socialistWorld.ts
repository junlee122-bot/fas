import type { CareerRole, NationId, StaffDepartment } from './types';

export type SocialistModelId =
  | 'popular-front'
  | 'council-commonwealth'
  | 'central-plan'
  | 'peasant-commune'
  | 'self-management'
  | 'market-socialism'
  | 'international-commonwealth';
export type SocialistTransitionMethodId = 'constitutional' | 'mass-mobilization' | 'party-command';
export type SocialistSettlementId =
  | 'broad-front-charter'
  | 'vanguard-compact'
  | 'worker-peasant-congress'
  | 'compensated-socialization'
  | 'rapid-expropriation'
  | 'cooperative-transfer'
  | 'constitutional-pluralism'
  | 'council-republic'
  | 'party-supremacy'
  | 'peaceful-coexistence'
  | 'nonaligned-solidarity'
  | 'revolutionary-bloc';
export type SocialistTransitionStage = 'latent' | 'coalition' | 'property' | 'governance' | 'world-order' | 'consolidated' | 'fractured';

export interface SocialistSettlementDefinition {
  id: SocialistSettlementId;
  stageIndex: 0 | 1 | 2 | 3;
  name: string;
  shortName: string;
  description: string;
  consequence: string;
  historicalBasis: string;
  sourceLabel: string;
  sourceUrl: string;
  politicalCost: number;
  treasuryCost: number;
  progressModifier: number;
  contradictionModifier: number;
  mandateDelta: number;
  stateDelta: Partial<Pick<SocialistWorldState, 'partyControl' | 'councilPower' | 'socialOwnership' | 'marketAllowance' | 'internationalism' | 'coercion' | 'consumerProvision' | 'capitalFlight' | 'foreignPressure' | 'counterrevolutionRisk' | 'bureaucraticCapture' | 'cooperativeSector' | 'productiveDemocracy'>>;
  profile: 'plural' | 'centralized' | 'participatory' | 'mixed';
}

export interface SocialistModelDefinition {
  id: SocialistModelId;
  name: string;
  shortName: string;
  doctrine: string;
  premise: string;
  ownership: string;
  government: string;
  economy: string;
  international: string;
  promise: string;
  danger: string;
  historicalBasis: string;
  sourceLabel: string;
  sourceUrl: string;
  preferredDepartments: StaffDepartment[];
  affinities: Array<'workers' | 'peasants' | 'party' | 'councils' | 'market' | 'international'>;
}

export interface SocialistWorldContext {
  week: number;
  year: number;
  phase: 'war' | 'nation';
  nationId: NationId;
  role: CareerRole;
  politicalPower: number;
  treasury: number;
  stability: number;
  warSupport: number;
  enemyPressure: number;
  legitimacy: number;
  unrest: number;
  welfare: number;
  employment: number;
  inequality: number;
  education: number;
  civilianIndustry: number;
  institutionalCapacity: number;
  publicConfidence: number;
  inflation: number;
  relationAverage: number;
  laborSupport: number;
  laborInfluence: number;
  civicSupport: number;
  intelligentsiaSupport: number;
  securitySupport: number;
}

export interface SocialistTransitionSponsor {
  id: string;
  name: string;
  department: StaffDepartment;
  ability: number;
  loyalty: number;
}

export interface SocialistTurningPoint {
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface ActiveSocialistTransition {
  id: string;
  targetModelId: SocialistModelId;
  stage: Exclude<SocialistTransitionStage, 'latent' | 'consolidated' | 'fractured'>;
  stageIndex: 0 | 1 | 2 | 3;
  progress: number;
  contradiction: number;
  mandate: number;
  startedWeek: number;
  methodId: SocialistTransitionMethodId | null;
  settlementId: SocialistSettlementId | null;
  settlements: SocialistSettlementId[];
  sponsor: SocialistTransitionSponsor;
  setbacks: number;
  scars: string[];
  turningPoints: SocialistTurningPoint[];
}

export interface SocialistTransitionRecord {
  id: string;
  modelId: SocialistModelId;
  modelName: string;
  startedWeek: number;
  resolvedWeek: number;
  sponsorName: string;
  outcome: 'plural' | 'centralized' | 'contested';
  summary: string;
  scars: string[];
  settlements: SocialistSettlementId[];
  constitutionalProfile: string;
}

export interface SocialistWorldState {
  version: 1;
  currentModelId: SocialistModelId | null;
  stage: SocialistTransitionStage;
  classPressure: number;
  workerOrganization: number;
  peasantMobilization: number;
  partyControl: number;
  councilPower: number;
  socialOwnership: number;
  marketAllowance: number;
  internationalism: number;
  coercion: number;
  consumerProvision: number;
  capitalFlight: number;
  foreignPressure: number;
  counterrevolutionRisk: number;
  bureaucraticCapture: number;
  cooperativeSector: number;
  productiveDemocracy: number;
  conventionAvailable: boolean;
  active: ActiveSocialistTransition | null;
  history: SocialistTransitionRecord[];
  institutionalMemory: string[];
  reformCooldownUntil: number;
  lastUpdatedWeek: number;
}

export interface SocialistModelOutlook {
  definition: SocialistModelDefinition;
  viability: number;
  available: boolean;
  strengths: string[];
  blockers: string[];
  projected: string;
}

export interface SocialistMethodPreview {
  id: SocialistTransitionMethodId;
  name: string;
  description: string;
  politicalCost: number;
  treasuryCost: number;
  weeklyProgress: number;
  weeklyContradiction: number;
  mandateChange: number;
  forecast: string;
}

export interface SocialistWorldEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  cause: string;
  consequence: string;
}

export interface SocialistNationDelta {
  legitimacy: number;
  unrest: number;
  welfare: number;
  employment: number;
  inequality: number;
  civilianIndustry: number;
  institutionalCapacity: number;
}

export interface SocialistActionResult {
  state: SocialistWorldState;
  title: string;
  detail: string;
  politicalPowerDelta: number;
  treasuryDelta: number;
  stabilityDelta: number;
  publicConfidenceDelta: number;
  nationDelta: SocialistNationDelta;
}

export interface SocialistWeeklyResult {
  state: SocialistWorldState;
  events: SocialistWorldEvent[];
  politicalPower: number;
  treasury: number;
  stability: number;
  publicConfidence: number;
  nationDelta: SocialistNationDelta;
  requiresDecision: boolean;
}

const model = (
  id: SocialistModelId,
  name: string,
  shortName: string,
  doctrine: string,
  premise: string,
  ownership: string,
  government: string,
  economy: string,
  international: string,
  promise: string,
  danger: string,
  historicalBasis: string,
  sourceLabel: string,
  sourceUrl: string,
  preferredDepartments: StaffDepartment[],
  affinities: SocialistModelDefinition['affinities'],
): SocialistModelDefinition => ({ id, name, shortName, doctrine, premise, ownership, government, economy, international, promise, danger, historicalBasis, sourceLabel, sourceUrl, preferredDepartments, affinities });

export const socialistModelDefinitions: SocialistModelDefinition[] = [
  model('popular-front', '인민전선 사회공화국', '인민전선', '선거·노조·사회화 입법', '공산당·사회당·노동조합·농민·반파시스트 중도파가 의회와 제헌회의에서 권력을 나눕니다.', '전략산업·은행 공공소유, 중소 사유재산과 협동조합 병존', '다당 선거와 강한 노동·지역 대표기관', '복지·완전고용·산업 민주화를 단계적으로 확대', '다른 체제와 교역하며 국제 노동권 기준을 확산', '폭력적 내전 없이 사회적 소유와 보편 복지를 넓힙니다.', '연립 붕괴, 자본 도피, 군·외세의 개입과 개혁 지연', '프랑스·이탈리아의 전후 공산당 제도 참여와 인민전선·살레르노 전환의 경험을 추상화했습니다.', 'U.S. Office of the Historian · FRUS 1947', 'https://history.state.gov/historicaldocuments/frus1947v03/d204', ['political', 'economy', 'personnel'], ['workers', 'councils', 'international']),
  model('council-commonwealth', '노동자평의회 공동체', '평의회 공동체', '아래로부터의 생산·지역 자치', '공장위원회·병사위원회·지역평의회가 소유권과 대표권을 결합하고 중앙기관은 위임받은 권한만 행사합니다.', '기업·토지의 사회소유, 현장 평의회의 운영권', '소환 가능한 평의회 대표와 다층 연방', '계획 목표를 현장 협상과 공개 회계로 조정', '국가보다 노동자·도시 간 직접 연대망을 중시', '당 관료와 사적 자본 양쪽으로부터 생산자의 자치를 지킵니다.', '조정 지연, 지역 격차, 숙련집단의 내부 지배와 비상시 지휘 혼선', '1917년 소비에트와 1956년 헝가리 노동자평의회, 자주관리 논쟁의 공통 구조를 사용했습니다.', 'Library of Congress · Czechoslovakia country study', 'https://www.loc.gov/item/88600487/', ['personnel', 'economy', 'political'], ['workers', 'councils', 'international']),
  model('central-plan', '중앙계획 당국가', '중앙계획', '전위당·국유화·중공업 계획', '당과 국가계획기관이 토지·은행·대기업·무역을 통제하고 장기 생산목표에 자원을 집중합니다.', '토지·금융·산업의 광범위한 국가소유', '단일당 또는 지배당과 중앙집중 행정', '물량계획·배급·중공업 우선 투자', '상호원조권과 공동 국방·기술 계획', '후발국도 단기간에 중공업·교육·국방 기반을 건설할 수 있습니다.', '강제집단화, 비현실적 할당, 소비재 부족, 검열과 숙청의 자기강화', '소련의 제1차 5개년계획과 집단화, 기록에 남은 생산 확대와 막대한 인적 비용을 함께 모델링했습니다.', 'Library of Congress · Russian Archives', 'https://www.loc.gov/exhibits/archives/intn.html', ['economy', 'armaments', 'political'], ['party', 'workers', 'international']),
  model('peasant-commune', '농민혁명 코뮌 연방', '농민 코뮌', '토지혁명·농촌동원·자력갱생', '도시 노동자보다 농민·유격대·마을조직이 혁명의 주력이 되어 토지개혁과 지방 동원을 결합합니다.', '지주 토지 재분배 뒤 협동조합·코뮌으로 단계 전환', '농촌 당조직·대중조직·지역혁명위원회', '농업잉여와 지방공업을 국가건설에 동원', '반식민 해방운동과 농촌혁명 네트워크', '식민·지주 질서를 빠르게 해체하고 농촌 보건·교육·대표성을 확대합니다.', '과속 집단화, 허위 생산보고, 기근, 도시 전문성 파괴와 지속적 정치운동', '마오의 후난 농민운동 조사, 중국 토지개혁·협동화·코뮌의 단계와 대약진의 실패를 함께 반영했습니다.', 'Columbia Asia for Educators · Chinese communes', 'https://afe.easia.columbia.edu/special/china_1950_commune.htm', ['logistics', 'political', 'personnel'], ['peasants', 'party', 'international']),
  model('self-management', '노동자 자주관리 연방', '자주관리 연방', '사회소유·기업자치·연방협상', '기업은 사회소유로 두되 노동자 이사회가 투자·임금·생산을 결정하고 공화국·지역이 넓은 경제권을 가집니다.', '국가가 아닌 사회소유, 기업별 노동자 운영권', '연방 당정과 지역·기업 자치의 이중권력', '시장 가격과 사회투자기금을 함께 사용', '비동맹과 동서 양측 교역', '중앙계획의 경직성을 줄이고 작업장 민주주의와 개방 교역을 결합합니다.', '지역 불균형, 기업 간 실업·부채, 당의 최종 거부권과 민족연방 갈등', '유고슬라비아 노동자 자주관리와 비동맹 연방의 성과·부채·민족 불균형을 모델로 삼았습니다.', 'Library of Congress · Yugoslavia country study', 'https://www.loc.gov/item/91040323/', ['economy', 'personnel', 'political'], ['workers', 'councils', 'market', 'international']),
  model('market-socialism', '시장사회주의 개혁국가', '시장사회주의', '공공 지배·시장 신호·실험구역', '당·공공부문이 전략 방향을 유지하면서 농가책임·중소기업·가격·외국투자를 제한적으로 허용합니다.', '핵심 산업 공공소유, 협동조합·민간·외국자본 병존', '당국가 또는 우세정당 아래 기술관료적 개혁', '시장 가격·국가 투자·산업정책의 혼합', '경제특구·기술도입·다자교역', '부족과 정체를 완화하면서 국가의 장기 산업역량을 유지합니다.', '불평등·부패·지역격차, 노동권 약화, 개혁 수혜층의 사유화 압력', '레닌의 NEP와 중국의 개혁개방처럼 체제 생존을 위해 시장을 다시 도입한 서로 다른 사례를 비교했습니다.', 'Library of Congress · Soviet–U.S. economic cooperation', 'https://www.loc.gov/exhibits/archives/sovi.html', ['economy', 'science', 'political'], ['party', 'market', 'international']),
  model('international-commonwealth', '사회주의 국제공동체', '국제공동체', '주권을 넘는 공동계획·해방연대', '각국의 단일 모델을 강요하지 않고 개발은행·공동비축·기술·노동권·방위를 초국가 평의회에 위임합니다.', '국가·협동조합·평의회 소유가 공동기금과 연결', '회원국·노동·지역 대표의 다층 국제평의회', '국제 청산단위와 공동 산업·식량·보건 계획', '비동맹·탈식민 국가까지 포함하는 다중 중심 연대', '혁명 수출 대신 자원·기술·협상력을 공유하는 대안 세계질서를 만듭니다.', '중심국 지배, 분담금 갈등, 회원국 개혁 노선 충돌과 군사개입 유혹', '코민포름·경제상호원조회의의 중앙집중 문제와 반둥·비동맹의 주권평등 원칙을 대체역사적으로 결합했습니다.', 'United Nations Digital Library · Bandung and non-alignment', 'https://digitallibrary.un.org/record/98584/files/A_40_PV.11-EN.pdf', ['political', 'economy', 'science'], ['workers', 'international', 'councils']),
];

const settlement = (
  id: SocialistSettlementId,
  stageIndex: 0 | 1 | 2 | 3,
  name: string,
  shortName: string,
  description: string,
  consequence: string,
  historicalBasis: string,
  sourceLabel: string,
  sourceUrl: string,
  politicalCost: number,
  treasuryCost: number,
  progressModifier: number,
  contradictionModifier: number,
  mandateDelta: number,
  stateDelta: SocialistSettlementDefinition['stateDelta'],
  profile: SocialistSettlementDefinition['profile'],
): SocialistSettlementDefinition => ({ id, stageIndex, name, shortName, description, consequence, historicalBasis, sourceLabel, sourceUrl, politicalCost, treasuryCost, progressModifier, contradictionModifier, mandateDelta, stateDelta, profile });

export const socialistSettlementDefinitions: SocialistSettlementDefinition[] = [
  settlement('broad-front-charter', 0, '광범위 인민전선 헌장', '인민전선 헌장', '공산·사회·농민·노조·반파시스트 중도 세력에 공개 협약과 상호 거부권을 부여합니다.', '대중 위임과 국제 신뢰는 커지지만 연정 협상 때문에 전환 속도가 느려집니다.', '칠레 인민연합과 전후 유럽 좌파 연정처럼 선거연합 내부의 온건·급진 세력이 헌정 절차와 전환 속도를 두고 경쟁한 경험을 반영합니다.', 'U.S. Office of the Historian · Chile 1971', 'https://history.state.gov/historicaldocuments/frus1969-76ve16/d78', 5, 4, -0.6, -0.8, 6, { partyControl: -3, councilPower: 4, counterrevolutionRisk: -4, foreignPressure: -2 }, 'plural'),
  settlement('vanguard-compact', 0, '전위당–국가기관 협약', '전위당 협약', '당 중앙·보안기관·핵심 노조가 단일 지휘부를 구성하고 반대파의 거부권을 제한합니다.', '동원과 집행은 빨라지지만 권력독점·숙청·대외 경계가 구조적으로 커집니다.', '소련의 중앙당·계획기관·보안기구 결합과 전시 동원에서 집행력과 억압이 함께 강화된 경험을 추상화했습니다.', 'Library of Congress · Soviet internal workings', 'https://www.loc.gov/exhibits/archives/intn.html', 4, 3, 1.4, 1.5, -3, { partyControl: 9, coercion: 6, bureaucraticCapture: 5, foreignPressure: 4 }, 'centralized'),
  settlement('worker-peasant-congress', 0, '노동자–농민 대표대회', '노농 대표대회', '산업 노동자·농민조직·병사·지역평의회가 인구와 조직력에 따라 대표권을 나눕니다.', '도시와 농촌의 동맹이 넓어지지만 대표 비율과 전문행정의 정당성을 둘러싼 충돌이 남습니다.', '중국의 농민조직화와 노동자·농민 동맹, 지역 대중조직의 동원 경험을 기반으로 합니다.', 'Columbia AFE · Hunan peasant movement', 'https://afe.easia.columbia.edu/main_pop/ps/ps_china-mao-peasant.htm', 4, 5, 0.4, 0.3, 4, { councilPower: 7, cooperativeSector: 4, productiveDemocracy: 3, bureaucraticCapture: -2 }, 'participatory'),

  settlement('compensated-socialization', 1, '보상부 사회화 입법', '보상부 사회화', '은행·에너지·운송·중공업을 법률로 공공기관에 넘기고 채권 보상과 단계별 인수를 실시합니다.', '국고 부담은 크지만 자본·전문인력 유출과 법적 저항을 줄일 수 있습니다.', '1945–1951년 영국 국유화법들이 산업별 공공기관, 보상조건, 인수 과도기를 규정한 사례를 사용했습니다.', 'UK Parliament · Public ownership history', 'https://commonslibrary.parliament.uk/research-briefings/cbp-8325/', 5, 16, -0.4, -0.9, 4, { socialOwnership: 9, capitalFlight: -8, counterrevolutionRisk: -3, marketAllowance: -3 }, 'plural'),
  settlement('rapid-expropriation', 1, '무보상 집중수용', '집중수용', '토지·은행·대기업·외국자산을 짧은 기간에 수용하고 관리위원을 파견합니다.', '사회적 소유는 즉시 늘지만 자본도피·외교제재·생산관리 공백이 급증합니다.', '칠레의 구리 국유화·보상 분쟁과 소련의 급속한 소유 재편에서 나타난 국내외 충돌을 함께 반영합니다.', 'U.S. Office of the Historian · Allende years', 'https://history.state.gov/milestones/1969-1976/allende', 4, 5, 1.8, 2.2, -2, { socialOwnership: 15, partyControl: 4, capitalFlight: 11, foreignPressure: 8, counterrevolutionRisk: 5, consumerProvision: -3 }, 'centralized'),
  settlement('cooperative-transfer', 1, '노동자·농민 협동조합 이전', '협동조합 이전', '국가가 기업을 영구 관료기구로 흡수하지 않고 노동자 매입·협동조합·사회기금으로 이전합니다.', '현장 주도권과 고용은 커지지만 회계·숙련·지역금융 역량이 부족하면 기업 격차가 벌어집니다.', 'ILO가 정리한 노동자 소유·민주적 통제와 노조–협동조합 결합을 역사적 기반으로 삼았습니다.', 'ILO · Worker cooperatives', 'https://www.ilo.org/resource/other/sse-worker-cooperatives', 4, 10, 0.1, 0.2, 3, { socialOwnership: 8, cooperativeSector: 11, productiveDemocracy: 8, councilPower: 4, bureaucraticCapture: -5 }, 'participatory'),

  settlement('constitutional-pluralism', 2, '다당제 사회주의 헌법', '다당제 헌법', '사회적 소유를 헌법에 두되 야당·독립사법·지방선거·언론·정권교체 가능성을 보장합니다.', '정당성과 자기교정 능력이 커지지만 의회 교착과 반대파의 제도적 역공을 감수해야 합니다.', '칠레의 의회·행정부 권한 충돌과 경쟁적 다당제가 전환을 제약하면서도 타협 통로를 남긴 경험을 반영합니다.', 'U.S. Office of the Historian · Chile 1972', 'https://history.state.gov/historicaldocuments/frus1969-76ve16/d116', 7, 6, -0.8, -0.7, 7, { partyControl: -6, councilPower: 4, coercion: -6, counterrevolutionRisk: -3, productiveDemocracy: 3 }, 'plural'),
  settlement('council-republic', 2, '소환제 평의회 공화국', '평의회 공화국', '작업장·지역·병사평의회가 대표를 선출하고 언제든 소환하며 중앙기관은 위임된 권한만 행사합니다.', '생산자의 통제는 강해지지만 전국 조정과 전문관료 통제에 높은 제도역량이 필요합니다.', '유고슬라비아 노동자 이사회의 투자·차입·경영 승인 권한과 당 임명 경영진 사이의 실제 긴장을 확장했습니다.', 'Library of Congress · Yugoslavia study', 'https://www.loc.gov/item/91040323/', 5, 8, 0.2, 0.5, 4, { councilPower: 12, productiveDemocracy: 10, partyControl: -4, bureaucraticCapture: -7, cooperativeSector: 4 }, 'participatory'),
  settlement('party-supremacy', 2, '전위당 영도 헌법', '당 영도 헌법', '당이 국가·군·계획기관·대중조직의 최종 인사권과 노선해석권을 가집니다.', '장기계획과 위기대응은 일관되지만 관료적 정보독점과 평화적 권력교체의 부재가 커집니다.', '소련형 당국가에서 당기구가 형식적 국가기관 위에 놓였던 권력구조와 후기 관료화를 반영합니다.', 'Library of Congress · Soviet internal workings', 'https://www.loc.gov/exhibits/archives/intn.html', 4, 4, 1.5, 1.7, -4, { partyControl: 12, coercion: 7, bureaucraticCapture: 10, councilPower: -5, counterrevolutionRisk: 2 }, 'centralized'),

  settlement('peaceful-coexistence', 3, '평화공존·개방교역', '평화공존', '다른 체제와 외교관계·교역·군비통제를 유지하고 국내 모델의 성과로 경쟁합니다.', '봉쇄 위험과 소비재 부족을 줄이지만 급진 국제주의 세력은 혁명 포기로 받아들일 수 있습니다.', '유엔 헌장의 주권평등·평화적 분쟁 해결과 전후 공존 외교를 대체역사 사회주의 질서에 적용했습니다.', 'United Nations · Charter Article 2', 'https://legal.un.org/repertory/art2.shtml', 4, 5, -0.2, -0.8, 3, { foreignPressure: -10, internationalism: 3, marketAllowance: 4, consumerProvision: 3 }, 'mixed'),
  settlement('nonaligned-solidarity', 3, '반둥형 비동맹 연대', '비동맹 연대', '탈식민 국가와 주권평등·개발금융·자원주권·보건·기술 협력을 묶되 어느 강대국 블록에도 종속되지 않습니다.', '외교 선택과 남반구 협상력이 커지지만 공동기금과 회원국 노선 차이를 관리해야 합니다.', '반둥 원칙의 국가평등·평화적 해결·국제협력과 유엔 자원주권 결의를 결합했습니다.', 'United Nations · Permanent sovereignty over resources', 'https://legal.un.org/avl/ha/ga_1803/ga_1803.html', 6, 10, 0.3, 0.1, 5, { internationalism: 12, foreignPressure: -4, cooperativeSector: 4, productiveDemocracy: 2 }, 'participatory'),
  settlement('revolutionary-bloc', 3, '혁명권 공동방위 블록', '혁명권 블록', '우호 정권·해방운동과 군사·정보·계획·무역기구를 통합하고 체제방위를 공동화합니다.', '외부 위협에 대한 억지력은 커지지만 중심국 지배와 블록 대결·개입 유혹이 강화됩니다.', '코민포름과 냉전 블록정치에서 나타난 당간 조정, 위성화 우려, 대외 봉쇄를 대체역사적으로 확장했습니다.', 'U.S. Office of the Historian · Cominform context', 'https://history.state.gov/historicaldocuments/frus1947v02/d355', 6, 8, 1.1, 1.4, -2, { internationalism: 10, partyControl: 5, foreignPressure: 11, coercion: 3, bureaucraticCapture: 3 }, 'centralized'),
];

const stageNames = ['coalition', 'property', 'governance', 'world-order'] as const;
const stageLabels = ['혁명 연합', '소유권 재편', '권력의 형태', '세계질서 선택'] as const;
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const zeroNationDelta = (): SocialistNationDelta => ({ legitimacy: 0, unrest: 0, welfare: 0, employment: 0, inequality: 0, civilianIndustry: 0, institutionalCapacity: 0 });

export function getSocialistModelDefinition(id: SocialistModelId): SocialistModelDefinition {
  return socialistModelDefinitions.find((definition) => definition.id === id) ?? socialistModelDefinitions[0];
}

export function createSocialistWorldState(nationId: NationId, week: number): SocialistWorldState {
  const established = nationId === 'ussr' ? 'central-plan' : null;
  return {
    version: 1,
    currentModelId: established,
    stage: established ? 'consolidated' : 'latent',
    classPressure: nationId === 'ussr' ? 54 : nationId === 'china' || nationId === 'vietnam' ? 48 : 28,
    workerOrganization: nationId === 'ussr' ? 72 : nationId === 'china' || nationId === 'vietnam' ? 55 : 34,
    peasantMobilization: nationId === 'china' || nationId === 'vietnam' ? 70 : 30,
    partyControl: nationId === 'ussr' ? 88 : nationId === 'china' || nationId === 'vietnam' ? 56 : 22,
    councilPower: 24,
    socialOwnership: nationId === 'ussr' ? 90 : 18,
    marketAllowance: nationId === 'ussr' ? 10 : 72,
    internationalism: 42,
    coercion: nationId === 'ussr' ? 74 : 20,
    consumerProvision: nationId === 'ussr' ? 38 : 55,
    capitalFlight: nationId === 'ussr' ? 8 : 18,
    foreignPressure: nationId === 'ussr' ? 62 : nationId === 'china' || nationId === 'vietnam' ? 48 : 22,
    counterrevolutionRisk: nationId === 'ussr' ? 28 : nationId === 'china' || nationId === 'vietnam' ? 46 : 24,
    bureaucraticCapture: nationId === 'ussr' ? 72 : 20,
    cooperativeSector: nationId === 'ussr' ? 22 : 18,
    productiveDemocracy: nationId === 'ussr' ? 18 : 24,
    conventionAvailable: ['ussr', 'china', 'vietnam'].includes(nationId),
    active: null,
    history: [],
    institutionalMemory: established ? ['소련형 중앙계획 체제가 전시 국가의 출발조건입니다.'] : [],
    reformCooldownUntil: week,
    lastUpdatedWeek: week,
  };
}

function conventionThreshold(context: SocialistWorldContext): boolean {
  return context.role.tier >= 4
    || (context.laborSupport >= 52 && context.laborInfluence >= 42)
    || (context.unrest >= 55 && context.inequality >= 58)
    || ['ussr', 'china', 'vietnam'].includes(context.nationId);
}

export function calculateSocialistModelOutlooks(state: SocialistWorldState, context: SocialistWorldContext): SocialistModelOutlook[] {
  return socialistModelDefinitions.map((definition) => {
    const affinities = definition.affinities;
    let viability = 18 + state.workerOrganization * .18 + context.laborSupport * .16 + state.classPressure * .1 + context.role.tier * 3;
    const strengths: string[] = [];
    const blockers: string[] = [];
    if (affinities.includes('workers')) viability += context.employment * .06 + context.civilianIndustry * .06;
    if (affinities.includes('peasants')) viability += state.peasantMobilization * .18;
    if (affinities.includes('party')) viability += state.partyControl * .16 + context.institutionalCapacity * .05;
    if (affinities.includes('councils')) viability += state.councilPower * .14 + context.civicSupport * .08;
    if (affinities.includes('market')) viability += state.marketAllowance * .1 + context.education * .06;
    if (affinities.includes('international')) viability += state.internationalism * .08 + context.relationAverage * .06;
    if (definition.id === 'popular-front') viability += context.legitimacy * .08 + context.civicSupport * .08;
    if (definition.id === 'central-plan') viability += context.enemyPressure * .08 + context.warSupport * .05;
    if (definition.id === 'market-socialism') viability += Math.max(0, 60 - state.consumerProvision) * .15;
    if (definition.id === 'international-commonwealth') viability += context.relationAverage * .08;
    if (context.laborSupport >= 60) strengths.push(`노동 지지 ${Math.round(context.laborSupport)}`);
    if (state.workerOrganization >= 55) strengths.push(`조직력 ${Math.round(state.workerOrganization)}`);
    if (context.institutionalCapacity >= 60) strengths.push(`제도 역량 ${Math.round(context.institutionalCapacity)}`);
    if (context.inequality < 38 && state.classPressure < 38) blockers.push('계급 압력이 낮아 급진 전환의 대중 명분이 약함');
    if (definition.affinities.includes('peasants') && state.peasantMobilization < 42) blockers.push('농촌 조직과 토지 의제가 부족함');
    if (definition.affinities.includes('councils') && state.councilPower < 35) blockers.push('현장 평의회가 행정을 맡을 준비가 부족함');
    if (definition.affinities.includes('party') && state.partyControl < 35) blockers.push('통합 당조직과 간부망이 부족함');
    if (definition.affinities.includes('international') && context.relationAverage < 40) blockers.push('대외 고립으로 국제 연대 비용이 큼');
    viability = clamp(viability);
    const available = !state.active && context.week >= state.reformCooldownUntil && (state.conventionAvailable || conventionThreshold(context)) && viability >= 38 && state.currentModelId !== definition.id;
    return { definition, viability: round(viability), available, strengths: strengths.slice(0, 3), blockers: blockers.slice(0, 3), projected: viability >= 70 ? '대중 기반이 넓어 제도화 가능성이 높습니다.' : viability >= 52 ? '연합을 유지하면 전환할 수 있지만 반대세력과 소유권 충돌이 큽니다.' : '선택은 가능하지만 조직·행정·생산 기반을 먼저 보강해야 합니다.' };
  }).sort((left, right) => right.viability - left.viability || left.definition.id.localeCompare(right.definition.id));
}

export function getSocialistSettlementDefinition(id: SocialistSettlementId): SocialistSettlementDefinition {
  return socialistSettlementDefinitions.find((definition) => definition.id === id) ?? socialistSettlementDefinitions[0];
}

export function getSocialistSettlementsForStage(stageIndex: 0 | 1 | 2 | 3): SocialistSettlementDefinition[] {
  return socialistSettlementDefinitions.filter((definition) => definition.stageIndex === stageIndex);
}

function applySettlementDelta(state: SocialistWorldState, delta: SocialistSettlementDefinition['stateDelta']): SocialistWorldState {
  return {
    ...state,
    partyControl: clamp(state.partyControl + (delta.partyControl ?? 0)),
    councilPower: clamp(state.councilPower + (delta.councilPower ?? 0)),
    socialOwnership: clamp(state.socialOwnership + (delta.socialOwnership ?? 0)),
    marketAllowance: clamp(state.marketAllowance + (delta.marketAllowance ?? 0)),
    internationalism: clamp(state.internationalism + (delta.internationalism ?? 0)),
    coercion: clamp(state.coercion + (delta.coercion ?? 0)),
    consumerProvision: clamp(state.consumerProvision + (delta.consumerProvision ?? 0)),
    capitalFlight: clamp(state.capitalFlight + (delta.capitalFlight ?? 0)),
    foreignPressure: clamp(state.foreignPressure + (delta.foreignPressure ?? 0)),
    counterrevolutionRisk: clamp(state.counterrevolutionRisk + (delta.counterrevolutionRisk ?? 0)),
    bureaucraticCapture: clamp(state.bureaucraticCapture + (delta.bureaucraticCapture ?? 0)),
    cooperativeSector: clamp(state.cooperativeSector + (delta.cooperativeSector ?? 0)),
    productiveDemocracy: clamp(state.productiveDemocracy + (delta.productiveDemocracy ?? 0)),
  };
}

const methodBase: Record<SocialistTransitionMethodId, { name: string; description: string; politicalCost: number; treasuryCost: number; progress: number; contradiction: number; mandate: number }> = {
  constitutional: { name: '제헌·선거 경로', description: '선거 승리, 제헌회의, 보상·국유화법과 독립 사법절차를 연결합니다.', politicalCost: 5, treasuryCost: 7, progress: 4.8, contradiction: .7, mandate: 3 },
  'mass-mobilization': { name: '파업·대중동원', description: '노조·농민회·병사위원회·거리조직이 기성기관을 압박하고 직접 집행합니다.', politicalCost: 4, treasuryCost: 5, progress: 6.5, contradiction: 2.2, mandate: 1 },
  'party-command': { name: '전위당 집중지휘', description: '당 중앙과 보안·행정기관이 소유권과 권력 재편을 동시에 명령합니다.', politicalCost: 6, treasuryCost: 4, progress: 8, contradiction: 3.8, mandate: -2 },
};

export function previewSocialistTransitionMethod(state: SocialistWorldState, methodId: SocialistTransitionMethodId, context: SocialistWorldContext): SocialistMethodPreview | null {
  const active = state.active;
  if (!active?.settlementId) return null;
  const settlementId = active.settlementId;
  const definition = getSocialistModelDefinition(active.targetModelId);
  const institutionalSettlement = getSocialistSettlementDefinition(settlementId);
  const base = methodBase[methodId];
  const fit = methodId === 'constitutional'
    ? (context.legitimacy + context.civicSupport + context.institutionalCapacity) / 3
    : methodId === 'mass-mobilization'
      ? (state.workerOrganization + state.peasantMobilization + context.laborSupport) / 3
      : (state.partyControl + context.securitySupport + context.institutionalCapacity) / 3;
  const sponsorFit = definition.preferredDepartments.includes(active.sponsor.department) ? 8 : -3;
  const profileFit = institutionalSettlement.profile === 'centralized' && definition.affinities.includes('party')
    ? 5
    : institutionalSettlement.profile === 'participatory' && (definition.affinities.includes('councils') || definition.affinities.includes('peasants'))
      ? 5
      : institutionalSettlement.profile === 'plural' && definition.id === 'popular-front'
        ? 5
        : 0;
  const capacity = clamp(fit * .55 + active.sponsor.ability * .22 + active.sponsor.loyalty * .08 + sponsorFit + profileFit);
  const weeklyProgress = round(Math.max(1.2, base.progress + institutionalSettlement.progressModifier + capacity * .038 + active.mandate * .012 - active.contradiction * .018));
  const stageRisk = active.stageIndex === 1 ? 1 : active.stageIndex === 2 ? 1.4 : .5;
  const systemicRisk = (state.foreignPressure + state.counterrevolutionRisk + state.capitalFlight + state.bureaucraticCapture) / 400;
  const weeklyContradiction = round(Math.max(.5, base.contradiction + institutionalSettlement.contradictionModifier + stageRisk + systemicRisk + context.enemyPressure * .012 + Math.max(0, 50 - context.publicConfidence) * .02 - context.institutionalCapacity * .008));
  return { id: methodId, name: base.name, description: base.description, politicalCost: base.politicalCost, treasuryCost: base.treasuryCost, weeklyProgress, weeklyContradiction, mandateChange: base.mandate, forecast: `${institutionalSettlement.shortName} · 현 역량 ${Math.round(capacity)} · 약 ${Math.max(1, Math.ceil((100 - active.progress) / weeklyProgress))}주 · 모순 ${weeklyContradiction >= 4 ? '급증' : weeklyContradiction <= 1.4 ? '완화' : '누적'}` };
}

function noAction(state: SocialistWorldState, title: string, detail: string): SocialistActionResult {
  return { state, title, detail, politicalPowerDelta: 0, treasuryDelta: 0, stabilityDelta: 0, publicConfidenceDelta: 0, nationDelta: zeroNationDelta() };
}

export function startSocialistTransition(state: SocialistWorldState, modelId: SocialistModelId, sponsor: SocialistTransitionSponsor, context: SocialistWorldContext): SocialistActionResult {
  const outlook = calculateSocialistModelOutlooks(state, context).find((entry) => entry.definition.id === modelId);
  if (!outlook?.available) return noAction(state, '사회체제 전환 조건 미달', outlook?.blockers[0] ?? '현재 권력관계와 사회적 조건으로는 전환회의를 열 수 없습니다.');
  if (context.politicalPower < 8 || context.treasury < 10) return noAction(state, '전환회의 자원 부족', '정치력 8과 국고 10이 필요합니다.');
  const definition = outlook.definition;
  const active: ActiveSocialistTransition = {
    id: `${modelId}-${context.week}`,
    targetModelId: modelId,
    stage: 'coalition',
    stageIndex: 0,
    progress: 5,
    contradiction: clamp(24 + (100 - outlook.viability) * .35),
    mandate: clamp(context.laborSupport * .38 + context.legitimacy * .25 + state.workerOrganization * .22 + context.civicSupport * .15),
    startedWeek: context.week,
    methodId: null,
    settlementId: null,
    settlements: [],
    sponsor,
    setbacks: 0,
    scars: [],
    turningPoints: [{ week: context.week, title: `${definition.shortName} 전환회의`, detail: `${sponsor.name}이(가) 노동·농민·시민·당 조직의 대표권을 조정하기 시작했습니다.`, tone: 'neutral' }],
  };
  return { state: { ...state, active, stage: 'coalition', conventionAvailable: false, lastUpdatedWeek: context.week }, title: `${definition.shortName} 전환회의 개막`, detail: '첫 단계인 혁명 연합 구성에서 제도 합의를 선택한 뒤 진행 방식을 정해야 합니다.', politicalPowerDelta: -8, treasuryDelta: -10, stabilityDelta: -1, publicConfidenceDelta: 1, nationDelta: { ...zeroNationDelta(), legitimacy: 1, unrest: 1 } };
}

export function chooseSocialistSettlement(state: SocialistWorldState, settlementId: SocialistSettlementId, context: SocialistWorldContext): SocialistActionResult {
  if (!state.active) return noAction(state, '진행 중인 체제 전환 없음', '먼저 전환할 사회주의 모델과 책임자를 선택하십시오.');
  if (state.active.settlementId) return noAction(state, '이미 제도 합의가 채택됨', '현재 단계의 제도 합의는 단계가 끝날 때까지 유지됩니다.');
  const definition = socialistSettlementDefinitions.find((candidate) => candidate.id === settlementId && candidate.stageIndex === state.active?.stageIndex);
  if (!definition) return noAction(state, '현재 단계와 맞지 않는 합의', '현재 단계에 제안된 세 가지 제도 합의 중 하나를 선택하십시오.');
  if (context.politicalPower < definition.politicalCost || context.treasury < definition.treasuryCost) return noAction(state, '제도 합의 자원 부족', `정치력 ${definition.politicalCost}, 국고 ${definition.treasuryCost}가 필요합니다.`);
  const point: SocialistTurningPoint = { week: context.week, title: `${stageLabels[state.active.stageIndex]} · ${definition.name}`, detail: `${definition.description} ${definition.consequence}`, tone: definition.profile === 'centralized' ? 'neutral' : 'good' };
  const active: ActiveSocialistTransition = {
    ...state.active,
    settlementId,
    settlements: [...state.active.settlements, settlementId],
    mandate: clamp(state.active.mandate + definition.mandateDelta),
    contradiction: clamp(state.active.contradiction + Math.max(0, definition.contradictionModifier * 2)),
    turningPoints: [point, ...state.active.turningPoints].slice(0, 32),
  };
  const next = applySettlementDelta({ ...state, active }, definition.stateDelta);
  const legitimacy = definition.profile === 'plural' ? 2 : definition.profile === 'participatory' ? 1 : definition.profile === 'centralized' ? -1 : 0;
  const unrest = definition.profile === 'centralized' ? 1 : definition.profile === 'plural' ? -1 : 0;
  return {
    state: next,
    title: `${stageLabels[state.active.stageIndex]} · ${definition.name}`,
    detail: `${definition.consequence} 이제 이 합의를 집행할 진행 방식을 선택하십시오.`,
    politicalPowerDelta: -definition.politicalCost,
    treasuryDelta: -definition.treasuryCost,
    stabilityDelta: definition.profile === 'centralized' ? 1 : 0,
    publicConfidenceDelta: legitimacy,
    nationDelta: { ...zeroNationDelta(), legitimacy, unrest, civilianIndustry: settlementId === 'rapid-expropriation' ? -.3 : settlementId === 'cooperative-transfer' ? .15 : 0 },
  };
}

export function chooseSocialistTransitionMethod(state: SocialistWorldState, methodId: SocialistTransitionMethodId, context: SocialistWorldContext): SocialistActionResult {
  if (state.active && !state.active.settlementId) return noAction(state, '제도 합의가 먼저 필요', '현재 단계의 소유·권력·연합·대외질서 합의를 먼저 선택하십시오.');
  const preview = previewSocialistTransitionMethod(state, methodId, context);
  if (!state.active || !preview) return noAction(state, '진행 중인 체제 전환 없음', '먼저 전환할 사회주의 모델과 책임자를 선택하십시오.');
  if (context.politicalPower < preview.politicalCost || context.treasury < preview.treasuryCost) return noAction(state, '전환 자원 부족', `정치력 ${preview.politicalCost}, 국고 ${preview.treasuryCost}가 필요합니다.`);
  const point: SocialistTurningPoint = { week: context.week, title: `${stageLabels[state.active.stageIndex]} · ${preview.name}`, detail: `${preview.description} ${preview.forecast}`, tone: 'neutral' };
  return { state: { ...state, active: { ...state.active, methodId, mandate: clamp(state.active.mandate + preview.mandateChange), turningPoints: [point, ...state.active.turningPoints].slice(0, 32) } }, title: `${stageLabels[state.active.stageIndex]} · ${preview.name}`, detail: `${preview.forecast}. 이 선택은 다음 단계에서 다시 바꿀 수 있습니다.`, politicalPowerDelta: -preview.politicalCost, treasuryDelta: -preview.treasuryCost, stabilityDelta: methodId === 'party-command' ? 1 : 0, publicConfidenceDelta: methodId === 'constitutional' ? 2 : methodId === 'party-command' ? -1 : 0, nationDelta: { ...zeroNationDelta(), legitimacy: methodId === 'constitutional' ? 2 : methodId === 'party-command' ? -1 : 0, unrest: methodId === 'mass-mobilization' ? 2 : methodId === 'constitutional' ? -1 : 1 } };
}

function scarFor(modelId: SocialistModelId, stageIndex: number): string {
  const scars: Record<SocialistModelId, string[]> = {
    'popular-front': ['붕괴한 연립 신뢰', '보상 없는 국유화 분쟁', '비상입법의 관성', '블록 외교의 의심'],
    'council-commonwealth': ['대표권 없는 평의회', '현장 소유권 충돌', '중앙–지역 이중권력', '고립된 국제연대'],
    'central-plan': ['숙청된 전문성', '강제수용의 기억', '할당량 조작', '위성국 불신'],
    'peasant-commune': ['토지보복의 악순환', '과속 집단화', '농촌 생산보고 왜곡', '도시–농촌 단절'],
    'self-management': ['기업 간 격차', '사회기금 부채', '연방 거부권 충돌', '지역 민족주의'],
    'market-socialism': ['개혁 특권층', '공공자산 내부자 전용', '당–기업 유착', '노동권의 후퇴'],
    'international-commonwealth': ['중심국 지배 의혹', '분담금 거부', '공동기관의 민주성 부족', '회원국 노선분열'],
  };
  return scars[modelId][stageIndex];
}

function modelWeeklyDelta(modelId: SocialistModelId | null): SocialistNationDelta {
  if (!modelId) return zeroNationDelta();
  switch (modelId) {
    case 'popular-front': return { legitimacy: .08, unrest: -.05, welfare: .08, employment: .03, inequality: -.08, civilianIndustry: .02, institutionalCapacity: .05 };
    case 'council-commonwealth': return { legitimacy: .05, unrest: -.03, welfare: .04, employment: .05, inequality: -.07, civilianIndustry: .01, institutionalCapacity: .02 };
    case 'central-plan': return { legitimacy: -.03, unrest: .03, welfare: .02, employment: .08, inequality: -.06, civilianIndustry: .11, institutionalCapacity: .04 };
    case 'peasant-commune': return { legitimacy: .02, unrest: -.01, welfare: .03, employment: .05, inequality: -.09, civilianIndustry: .02, institutionalCapacity: -.01 };
    case 'self-management': return { legitimacy: .05, unrest: -.04, welfare: .04, employment: .07, inequality: -.05, civilianIndustry: .06, institutionalCapacity: .02 };
    case 'market-socialism': return { legitimacy: .02, unrest: -.02, welfare: .01, employment: .08, inequality: .05, civilianIndustry: .1, institutionalCapacity: .04 };
    case 'international-commonwealth': return { legitimacy: .04, unrest: -.02, welfare: .05, employment: .04, inequality: -.05, civilianIndustry: .06, institutionalCapacity: .06 };
  }
}

function applySystemicRiskDelta(delta: SocialistNationDelta, state: SocialistWorldState): SocialistNationDelta {
  const flightPenalty = Math.max(0, state.capitalFlight - 55) * .004;
  const counterrevolutionPenalty = Math.max(0, state.counterrevolutionRisk - 55) * .004;
  const bureaucracyPenalty = Math.max(0, state.bureaucraticCapture - 60) * .003;
  const participationBonus = Math.max(0, state.productiveDemocracy - 55) * .0025;
  const isolationPenalty = Math.max(0, state.foreignPressure - 60) * .003;
  return {
    legitimacy: delta.legitimacy - bureaucracyPenalty - counterrevolutionPenalty + participationBonus,
    unrest: delta.unrest + counterrevolutionPenalty + flightPenalty - participationBonus,
    welfare: delta.welfare - isolationPenalty,
    employment: delta.employment - flightPenalty + participationBonus,
    inequality: delta.inequality + flightPenalty * .5 - participationBonus,
    civilianIndustry: delta.civilianIndustry - flightPenalty - isolationPenalty + participationBonus,
    institutionalCapacity: delta.institutionalCapacity - bureaucracyPenalty + participationBonus,
  };
}

function completeTransition(state: SocialistWorldState, active: ActiveSocialistTransition, context: SocialistWorldContext): SocialistWeeklyResult {
  const definition = getSocialistModelDefinition(active.targetModelId);
  const selectedSettlements = active.settlements.map(getSocialistSettlementDefinition);
  const centralized = selectedSettlements.filter((item) => item.profile === 'centralized').length * 2 + active.turningPoints.filter((point) => point.title.includes('전위당 집중지휘')).length;
  const plural = selectedSettlements.filter((item) => item.profile === 'plural').length * 2 + active.turningPoints.filter((point) => point.title.includes('제헌·선거')).length;
  const participatory = selectedSettlements.filter((item) => item.profile === 'participatory').length * 2 + active.turningPoints.filter((point) => point.title.includes('파업·대중동원')).length;
  const highestAlternative = Math.max(plural, participatory);
  const outcome = centralized >= highestAlternative + 2 ? 'centralized' : highestAlternative >= centralized + 2 ? 'plural' : 'contested';
  const constitutionalProfile = centralized >= plural && centralized >= participatory
    ? '전위당 지도·집중계획 헌정'
    : participatory > plural
      ? '생산자 평의회·협동조합 헌정'
      : plural > centralized
        ? '다당제·사회적 소유 헌정'
        : '당·의회·평의회 경합 헌정';
  const summary = outcome === 'plural' ? `${constitutionalProfile} 아래 대표기관과 사회적 소유가 함께 제도화됐습니다.` : outcome === 'centralized' ? `${constitutionalProfile}이 전환을 완수했지만 권력 집중과 관료적 정보독점이 장기 과제가 됐습니다.` : `${constitutionalProfile}으로 타협했으나 소유와 최종 결정권의 충돌이 남았습니다.`;
  const record: SocialistTransitionRecord = { id: active.id, modelId: active.targetModelId, modelName: definition.name, startedWeek: active.startedWeek, resolvedWeek: context.week, sponsorName: active.sponsor.name, outcome, summary, scars: active.scars, settlements: active.settlements, constitutionalProfile };
  const coercionDelta = outcome === 'centralized' ? 18 : outcome === 'plural' ? -5 : 5;
  const next: SocialistWorldState = { ...state, currentModelId: active.targetModelId, stage: 'consolidated', active: null, socialOwnership: clamp(state.socialOwnership + 12), partyControl: clamp(state.partyControl + (outcome === 'centralized' ? 12 : 2)), councilPower: clamp(state.councilPower + (outcome === 'plural' ? 10 : 3)), marketAllowance: clamp(definition.affinities.includes('market') ? Math.max(48, state.marketAllowance) : state.marketAllowance - 8), internationalism: clamp(state.internationalism + (definition.affinities.includes('international') ? 10 : 2)), coercion: clamp(state.coercion + coercionDelta), consumerProvision: clamp(state.consumerProvision + (definition.id === 'market-socialism' || definition.id === 'self-management' ? 10 : definition.id === 'central-plan' ? -5 : 3)), bureaucraticCapture: clamp(state.bureaucraticCapture + (outcome === 'centralized' ? 8 : outcome === 'plural' ? -4 : 2)), productiveDemocracy: clamp(state.productiveDemocracy + (participatory > centralized ? 10 : plural > centralized ? 4 : -2)), history: [record, ...state.history].slice(0, 30), institutionalMemory: [`${definition.shortName} · ${constitutionalProfile}`, ...selectedSettlements.map((item) => `${stageLabels[item.stageIndex]} · ${item.shortName}`), ...active.scars.map((scar) => `미해결 · ${scar}`), ...state.institutionalMemory].slice(0, 24), reformCooldownUntil: context.week + 52, lastUpdatedWeek: context.week };
  return { state: next, events: [{ id: `socialist-complete-${active.id}`, title: `${definition.name} 성립 · ${constitutionalProfile}`, detail: summary, tone: outcome === 'plural' ? 'good' : outcome === 'centralized' && next.coercion >= 65 ? 'bad' : 'neutral', cause: `${context.year}년까지 네 단계에서 ${selectedSettlements.map((item) => item.shortName).join(' → ')} 합의를 통과했습니다.`, consequence: `${definition.promise} 남은 위험: ${active.scars.length ? active.scars.join(' · ') : definition.danger}` }], politicalPower: outcome === 'plural' ? 4 : 2, treasury: 0, stability: outcome === 'centralized' ? 2 : 1, publicConfidence: outcome === 'plural' ? 4 : outcome === 'centralized' ? -1 : 2, nationDelta: { ...modelWeeklyDelta(active.targetModelId), legitimacy: outcome === 'plural' ? 4 : outcome === 'centralized' ? -1 : 2, unrest: outcome === 'plural' ? -4 : outcome === 'centralized' ? 2 : -1 }, requiresDecision: false };
}

export function advanceSocialistWorldWeek(state: SocialistWorldState, context: SocialistWorldContext): SocialistWeeklyResult {
  const pressureTarget = clamp(12 + context.inequality * .34 + context.unrest * .2 + context.inflation * .55 + context.enemyPressure * .08 - context.welfare * .18 - context.employment * .08);
  const organizationTarget = clamp(12 + context.laborSupport * .45 + context.laborInfluence * .2 + context.education * .1 + context.civilianIndustry * .08);
  let next: SocialistWorldState = {
    ...state,
    classPressure: clamp(state.classPressure + (pressureTarget - state.classPressure) * .035),
    workerOrganization: clamp(state.workerOrganization + (organizationTarget - state.workerOrganization) * .025),
    peasantMobilization: clamp(state.peasantMobilization + (context.nationId === 'china' || context.nationId === 'vietnam' || context.nationId === 'india' || context.nationId === 'indonesia' ? .05 : -.01)),
    conventionAvailable: state.conventionAvailable || conventionThreshold(context),
    lastUpdatedWeek: context.week,
  };
  const events: SocialistWorldEvent[] = [];
  if (next.active || next.currentModelId) {
    const capitalFlightTarget = clamp(12 + next.socialOwnership * .28 + next.foreignPressure * .12 - next.marketAllowance * .18 - context.institutionalCapacity * .14 - next.cooperativeSector * .08);
    const foreignPressureTarget = clamp(18 + context.enemyPressure * .22 + Math.max(0, 55 - context.relationAverage) * .55 + next.internationalism * .04 + (next.currentModelId === 'international-commonwealth' ? -8 : 0));
    const bureaucracyTarget = clamp(10 + next.partyControl * .3 + next.socialOwnership * .18 - next.councilPower * .14 - context.institutionalCapacity * .1 - next.productiveDemocracy * .08);
    const productiveTarget = clamp(14 + next.councilPower * .3 + next.cooperativeSector * .28 + state.workerOrganization * .12 + context.education * .08 - next.bureaucraticCapture * .12);
    next.capitalFlight = clamp(next.capitalFlight + (capitalFlightTarget - next.capitalFlight) * .03);
    next.foreignPressure = clamp(next.foreignPressure + (foreignPressureTarget - next.foreignPressure) * .025);
    next.bureaucraticCapture = clamp(next.bureaucraticCapture + (bureaucracyTarget - next.bureaucraticCapture) * .025);
    next.productiveDemocracy = clamp(next.productiveDemocracy + (productiveTarget - next.productiveDemocracy) * .025);
    const counterrevolutionTarget = clamp(12 + context.unrest * .24 + next.capitalFlight * .16 + next.foreignPressure * .13 + Math.max(0, 58 - context.legitimacy) * .22 + Math.max(0, 50 - context.securitySupport) * .14 - next.workerOrganization * .08);
    next.counterrevolutionRisk = clamp(next.counterrevolutionRisk + (counterrevolutionTarget - next.counterrevolutionRisk) * .03);
    if (state.capitalFlight < 65 && next.capitalFlight >= 65) events.push({ id: `socialist-flight-${context.week}`, title: '자본·전문인력 유출 임계점', detail: '기업 자금, 기술자, 무역결제망이 국외 또는 지하경제로 이동하며 생산 인수와 세수 기반이 흔들립니다.', tone: 'bad', cause: `사회적 소유 ${Math.round(next.socialOwnership)} · 시장 허용 ${Math.round(next.marketAllowance)} · 제도역량 ${Math.round(context.institutionalCapacity)}.`, consequence: '보상·협동조합·개방교역 합의는 압력을 낮추고, 무보상 집중수용과 대외 고립은 압력을 높입니다.' });
    if (state.foreignPressure < 70 && next.foreignPressure >= 70) events.push({ id: `socialist-isolation-${context.week}`, title: '신용·무역 봉쇄의 형성', detail: '외국 정부와 금융기관이 신용·기술·원자재 접근을 제한하고 우호국에도 노선 선택을 요구합니다.', tone: 'bad', cause: `대외관계 ${Math.round(context.relationAverage)} · 적 압력 ${Math.round(context.enemyPressure)} · 국제주의 ${Math.round(next.internationalism)}.`, consequence: '평화공존·비동맹 공동기금·혁명권 블록 가운데 무엇을 택했는지가 공급과 외교의 다음 국면을 바꿉니다.' });
    if (state.counterrevolutionRisk < 70 && next.counterrevolutionRisk >= 70) events.push({ id: `socialist-counterrevolution-${context.week}`, title: '반혁명 연합의 가시화', detail: '재산권 반대세력, 군·치안 일부, 야당, 망명자금과 외국 지원이 느슨한 공동전선으로 결집했습니다.', tone: 'bad', cause: `정당성 ${Math.round(context.legitimacy)} · 사회불안 ${Math.round(context.unrest)} · 자본유출 ${Math.round(next.capitalFlight)} · 외압 ${Math.round(next.foreignPressure)}.`, consequence: '강압은 단기 위험을 낮출 수 있으나 장기 강제력과 관료화를 높이며, 헌정 타협은 느리지만 연합을 분열시킬 수 있습니다.' });
    if (state.bureaucraticCapture < 72 && next.bureaucraticCapture >= 72) events.push({ id: `socialist-bureaucracy-${context.week}`, title: '계획기관의 정보독점', detail: '하급기관이 목표를 맞추기 위해 수치를 왜곡하고 중앙 간부가 인사·물자·감사를 서로 보증하는 구조가 굳어집니다.', tone: 'bad', cause: `당 통제 ${Math.round(next.partyControl)} · 평의회 권력 ${Math.round(next.councilPower)} · 생산 민주성 ${Math.round(next.productiveDemocracy)}.`, consequence: '현장 공개회계·소환제·협동조합 자율은 이를 낮추지만 중앙의 단기 집행력도 함께 약해질 수 있습니다.' });
    if (state.productiveDemocracy < 65 && next.productiveDemocracy >= 65) events.push({ id: `socialist-participation-${context.week}`, title: '현장 경영권의 정착', detail: '작업장과 협동조합이 생산·투자·교육 자료를 공개하고 노동자가 경영진을 실제로 교체하기 시작했습니다.', tone: 'good', cause: `평의회 권력 ${Math.round(next.councilPower)} · 협동조합 부문 ${Math.round(next.cooperativeSector)} · 교육 ${Math.round(context.education)}.`, consequence: '고용·제도역량·정당성에 장기 보너스가 생기지만 전국 투자조정과 지역격차는 계속 관리해야 합니다.' });
  }
  if (!next.active) {
    const delta = applySystemicRiskDelta(modelWeeklyDelta(next.currentModelId), next);
    if (next.currentModelId === null && next.conventionAvailable && !state.conventionAvailable) {
      events.push({
        id: `socialist-convention-${context.week}`,
        title: '사회체제 전환회의 요구',
        detail: '노동·농민·시민·당 조직이 소유권과 대표권을 더는 개별 정책으로 다룰 수 없다며 국가적 전환회의를 요구했습니다.',
        tone: 'neutral',
        cause: `계급 압력 ${Math.round(next.classPressure)} · 노동 지지 ${Math.round(context.laborSupport)} · 노동 영향력 ${Math.round(context.laborInfluence)} · 현재 보직 권한 ${context.role.tier}급.`,
        consequence: '국가 운영의 사회체제 화면에서 일곱 모델의 현재 성립 가능성·취약점·책임 참모를 비교해 회의를 열거나 기존 질서를 유지할 수 있습니다.',
      });
    }
    if (next.currentModelId === 'central-plan') {
      const provisionTarget = clamp(35 + context.employment * .18 + context.civilianIndustry * .16 - context.inflation * .65 - context.enemyPressure * .08);
      next.consumerProvision = clamp(next.consumerProvision + (provisionTarget - next.consumerProvision) * .025);
      next.partyControl = clamp(next.partyControl + (context.securitySupport >= 60 ? .03 : -.01));
      next.coercion = clamp(next.coercion + (context.unrest >= 55 ? .05 : context.legitimacy >= 68 ? -.025 : 0));
    } else if (next.currentModelId === 'popular-front') {
      next.councilPower = clamp(next.councilPower + (context.civicSupport - next.councilPower) * .008);
      next.consumerProvision = clamp(next.consumerProvision + (context.welfare >= 58 ? .025 : -.01));
      next.coercion = clamp(next.coercion - .025);
    } else if (next.currentModelId === 'council-commonwealth') {
      next.councilPower = clamp(next.councilPower + .035);
      next.partyControl = clamp(next.partyControl - .02);
      next.consumerProvision = clamp(next.consumerProvision + (context.institutionalCapacity >= 55 ? .02 : -.025));
    } else if (next.currentModelId === 'peasant-commune') {
      next.peasantMobilization = clamp(next.peasantMobilization + .03);
      next.consumerProvision = clamp(next.consumerProvision + (context.institutionalCapacity >= 52 && context.inflation < 9 ? .015 : -.035));
      next.coercion = clamp(next.coercion + (context.unrest >= 50 ? .025 : -.01));
    } else if (next.currentModelId === 'self-management') {
      next.councilPower = clamp(next.councilPower + .025);
      next.marketAllowance = clamp(next.marketAllowance + (context.publicConfidence >= 55 ? .015 : -.01));
      next.consumerProvision = clamp(next.consumerProvision + (context.relationAverage >= 48 ? .03 : -.015));
      next.coercion = clamp(next.coercion - .02);
    } else if (next.currentModelId === 'market-socialism') {
      next.marketAllowance = clamp(next.marketAllowance + .025);
      next.consumerProvision = clamp(next.consumerProvision + (context.civilianIndustry >= 52 ? .035 : -.01));
      next.socialOwnership = clamp(next.socialOwnership + (context.inequality >= 58 ? -.02 : .005));
    } else if (next.currentModelId === 'international-commonwealth') {
      next.internationalism = clamp(next.internationalism + (context.relationAverage >= 55 ? .035 : -.025));
      next.consumerProvision = clamp(next.consumerProvision + (context.relationAverage >= 50 ? .02 : -.02));
      next.coercion = clamp(next.coercion - .015);
    }
    const reformReady = next.currentModelId !== null && context.week >= next.reformCooldownUntil && (next.classPressure >= 52 || next.consumerProvision <= 38 || next.coercion >= 68 || next.capitalFlight >= 65 || next.foreignPressure >= 70 || next.bureaucraticCapture >= 72 || next.counterrevolutionRisk >= 70);
    if (reformReady && !state.conventionAvailable) {
      next.conventionAvailable = true;
      events.push({ id: `socialist-reform-${context.week}`, title: '사회주의 체제개혁 논쟁', detail: '생산·소비·대표권의 모순이 기존 사회주의 모델을 다시 선택의 대상으로 만들었습니다.', tone: 'neutral', cause: `계급 압력 ${Math.round(next.classPressure)} · 소비 공급 ${Math.round(next.consumerProvision)} · 강제력 ${Math.round(next.coercion)}.`, consequence: '같은 이념권 안에서도 자주관리·시장사회주의·평의회·국제공동체 또는 중앙계획 강화로 전환할 수 있습니다.' });
    }
    return { state: next, events, politicalPower: 0, treasury: 0, stability: 0, publicConfidence: next.currentModelId === 'central-plan' && next.consumerProvision < 35 ? -.1 : 0, nationDelta: delta, requiresDecision: false };
  }
  const active = { ...next.active };
  if (!active.settlementId || !active.methodId) return { state: next, events, politicalPower: 0, treasury: 0, stability: 0, publicConfidence: 0, nationDelta: applySystemicRiskDelta(zeroNationDelta(), next), requiresDecision: true };
  const preview = previewSocialistTransitionMethod({ ...next, active }, active.methodId, context)!;
  active.progress = clamp(active.progress + preview.weeklyProgress);
  active.contradiction = clamp(active.contradiction + preview.weeklyContradiction);
  active.mandate = clamp(active.mandate + (preview.mandateChange > 0 ? .12 : preview.mandateChange < 0 ? -.1 : 0));
  if (active.contradiction >= 100 && active.progress < 100) {
    const scar = scarFor(active.targetModelId, active.stageIndex);
    const point: SocialistTurningPoint = { week: context.week, title: `${stageLabels[active.stageIndex]} 위기`, detail: `${scar}이(가) 남았고 같은 단계를 다른 방식으로 재협상해야 합니다.`, tone: 'bad' };
    active.setbacks += 1;
    active.scars = active.scars.includes(scar) ? active.scars : [scar, ...active.scars].slice(0, 8);
    active.progress = Math.max(30, active.progress - 20);
    active.contradiction = 55;
    active.mandate = clamp(active.mandate - 8);
    active.methodId = null;
    active.turningPoints = [point, ...active.turningPoints].slice(0, 32);
    next.active = active;
    next.stage = 'fractured';
    return { state: next, events: [{ id: `socialist-setback-${active.id}-${active.setbacks}`, title: `${stageLabels[active.stageIndex]} 전환 위기`, detail: `${scar}. 전환은 끝나지 않았지만 강제·불신·생산 손실이 이후 체제에 남습니다.`, tone: 'bad', cause: '전환 모순이 진척보다 먼저 100에 도달했습니다.', consequence: '진행 일부는 보존되며 새 방법을 선택해 같은 단계를 수습할 수 있습니다.' }], politicalPower: -1, treasury: -3, stability: -2, publicConfidence: -3, nationDelta: { ...zeroNationDelta(), legitimacy: -2, unrest: 3, civilianIndustry: -.2 }, requiresDecision: true };
  }
  if (active.progress >= 100) {
    const point: SocialistTurningPoint = { week: context.week, title: `${stageLabels[active.stageIndex]} 합의`, detail: `${methodBase[active.methodId].name} 경로로 단계 합의가 성립했습니다.`, tone: 'good' };
    active.turningPoints = [point, ...active.turningPoints].slice(0, 32);
    if (active.stageIndex === 3) return completeTransition(next, active, context);
    active.stageIndex = (active.stageIndex + 1) as 0 | 1 | 2 | 3;
    active.stage = stageNames[active.stageIndex];
    active.progress = 8;
    active.contradiction = clamp(20 + active.setbacks * 8 + (100 - active.mandate) * .18);
    active.methodId = null;
    active.settlementId = null;
    next.stage = active.stage;
    events.push({ id: `socialist-stage-${active.id}-${active.stageIndex}`, title: `${stageLabels[active.stageIndex - 1]} 합의 → ${stageLabels[active.stageIndex]}`, detail: '전 단계의 제도 합의·방법·상처는 보존됩니다. 다음 단계에서 세 가지 제도안과 집행 방법을 새로 선택하십시오.', tone: 'good', cause: '단계 진척이 100에 도달했습니다.', consequence: '같은 목표라도 소유권·헌법·국제질서의 조합에 따라 전혀 다른 국가가 됩니다.' });
  }
  next.active = active;
  return { state: next, events, politicalPower: 0, treasury: 0, stability: 0, publicConfidence: 0, nationDelta: applySystemicRiskDelta({ ...zeroNationDelta(), civilianIndustry: active.stageIndex === 1 ? -.03 : .01 }, next), requiresDecision: active.settlementId === null || active.methodId === null };
}

export function normalizeSocialistWorldState(value: unknown, fallback: SocialistWorldState): SocialistWorldState {
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<SocialistWorldState>;
  if (candidate.version !== 1) return fallback;
  const ids = new Set(socialistModelDefinitions.map((definition) => definition.id));
  const settlementIds = new Set(socialistSettlementDefinitions.map((definition) => definition.id));
  const currentModelId = candidate.currentModelId && ids.has(candidate.currentModelId) ? candidate.currentModelId : null;
  const active = candidate.active && ids.has(candidate.active.targetModelId) ? {
    ...candidate.active,
    settlementId: candidate.active.settlementId && settlementIds.has(candidate.active.settlementId) ? candidate.active.settlementId : null,
    settlements: Array.isArray(candidate.active.settlements) ? candidate.active.settlements.filter((id) => settlementIds.has(id)).slice(0, 4) : [],
  } : null;
  const history = Array.isArray(candidate.history) ? candidate.history
    .filter((record) => ids.has(record.modelId))
    .map((record) => ({ ...record, settlements: Array.isArray(record.settlements) ? record.settlements.filter((id) => settlementIds.has(id)).slice(0, 4) : [], constitutionalProfile: record.constitutionalProfile ?? '저장 호환형 사회주의 헌정' }))
    .slice(0, 30) : [];
  const normalizedMetric = (metric: number | undefined, fallbackMetric: number) => typeof metric === 'number' && Number.isFinite(metric) ? clamp(metric) : fallbackMetric;
  return {
    ...fallback,
    ...candidate,
    currentModelId,
    active,
    history,
    capitalFlight: normalizedMetric(candidate.capitalFlight, fallback.capitalFlight),
    foreignPressure: normalizedMetric(candidate.foreignPressure, fallback.foreignPressure),
    counterrevolutionRisk: normalizedMetric(candidate.counterrevolutionRisk, fallback.counterrevolutionRisk),
    bureaucraticCapture: normalizedMetric(candidate.bureaucraticCapture, fallback.bureaucraticCapture),
    cooperativeSector: normalizedMetric(candidate.cooperativeSector, fallback.cooperativeSector),
    productiveDemocracy: normalizedMetric(candidate.productiveDemocracy, fallback.productiveDemocracy),
    institutionalMemory: Array.isArray(candidate.institutionalMemory) ? candidate.institutionalMemory.slice(0, 24) : [],
  };
}
