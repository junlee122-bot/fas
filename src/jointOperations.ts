import type { GameState, NationId, TheaterId } from './types';

export type FleetKind = 'carrier' | 'surface' | 'escort' | 'submarine' | 'coastal' | 'clandestine';
export type AirGroupKind = 'fighter' | 'bomber' | 'maritime' | 'transport' | 'recon' | 'mixed';
export type JointDoctrine = 'concentration' | 'interdiction' | 'protection';
export type JointOperationKind = 'air-superiority' | 'close-support' | 'strategic-bombing' | 'convoy-escort' | 'submarine-raiding' | 'carrier-strike' | 'amphibious-cover' | 'reconnaissance';
export type JointForceStatus = 'ready' | 'assigned' | 'refit';
export type JointObjectiveKind = 'convoy-route' | 'air-zone' | 'industrial-area' | 'naval-base' | 'landing-sector';

export interface JointCampaignObjective {
  id: string;
  theater: TheaterId;
  kind: JointObjectiveKind;
  name: string;
  region: string;
  historicalBasis: string;
  control: number;
  infrastructure: number;
  throughput: number;
  enemyThreat: number;
  damage: number;
  civilianRisk: number;
  lastChangedWeek: number;
  lastResult: string;
}

export interface NavalTaskForce {
  id: string;
  name: string;
  kind: FleetKind;
  commander: string;
  flagship: string;
  location: string;
  ships: number;
  authorizedShips?: number;
  readiness: number;
  organization: number;
  experience: number;
  status: JointForceStatus;
  assignmentId: string | null;
  historicalBasis: string;
}

export interface AirGroup {
  id: string;
  name: string;
  kind: AirGroupKind;
  commander: string;
  principalAircraft: string;
  base: string;
  aircraft: number;
  authorizedAircraft?: number;
  serviceability: number;
  readiness: number;
  experience: number;
  status: JointForceStatus;
  assignmentId: string | null;
  historicalBasis: string;
}

export interface JointOperationTemplate {
  id: string;
  name: string;
  kind: JointOperationKind;
  theater: TheaterId | 'both';
  description: string;
  historicalBasis: string;
  minimumWeeks: number;
  maximumWeeks: number;
  commandCost: number;
  fuelCost: number;
  convoyCost: number;
  requiredFleetKinds: FleetKind[];
  requiredAirKinds: AirGroupKind[];
  worldEffect: string;
}

export interface ActiveJointOperation {
  id: string;
  templateId: string;
  name: string;
  kind: JointOperationKind;
  theater: TheaterId;
  startedWeek: number;
  elapsedWeeks: number;
  minimumWeeks: number;
  maximumWeeks: number;
  progress: number;
  successChance: number;
  initialForceStrength?: number;
  objectiveId?: string;
  objectiveName?: string;
  fleetIds: string[];
  airGroupIds: string[];
  status: 'active';
}

export interface JointOperationRecord {
  id: string;
  templateId: string;
  name: string;
  theater: TheaterId;
  startedWeek: number;
  endedWeek: number;
  outcome: 'success' | 'setback';
  losses: string;
  result: string;
  worldEffect: string;
  objectiveId?: string;
  objectiveName?: string;
  campaignChanges?: string[];
  finalForceStrength?: number;
}

export interface CompletedCloseAirSupport {
  id: string;
  kind: JointOperationKind;
  theater: TheaterId;
  objectiveId?: string;
  effectStrength?: number;
}

/** Read only this week's successful player missions, including interception losses. */
export function getCompletedCloseAirSupport(operations: ActiveJointOperation[], records: JointOperationRecord[], week: number): CompletedCloseAirSupport[] {
  return operations.filter((operation) => operation.kind === 'close-support').flatMap((operation) => {
    const record = records.find((item) => item.id === `record-${operation.id}` && item.endedWeek === week && item.outcome === 'success');
    if (!record) return [];
    return [{ id: operation.id, kind: operation.kind, theater: operation.theater, objectiveId: operation.objectiveId, effectStrength: record.finalForceStrength ?? operation.initialForceStrength ?? 1 }];
  });
}

export interface EnemyJointOperation extends ActiveJointOperation {
  detected: boolean;
  intelligenceConfidence: number;
  detectedWeek: number | null;
  target: string;
}

export interface JointOpponentState {
  nationId: NationId;
  name: string;
  doctrine: JointDoctrine;
  fleets: NavalTaskForce[];
  airGroups: AirGroup[];
  operations: EnemyJointOperation[];
  records: JointOperationRecord[];
  lastDecisionWeek: number;
}

export interface JointEngagementRecord {
  id: string;
  week: number;
  theater: TheaterId;
  playerOperationId: string;
  enemyOperationId: string;
  title: string;
  domain: 'air' | 'sea' | 'combined';
  advantage: 'player' | 'enemy' | 'contested';
  summary: string;
  playerLosses: string;
  enemyLosses: string;
}

export type JointCommandResponse = 'back' | 'revise' | 'overrule';

export interface JointCommandMessage {
  id: string;
  week: number;
  operationId: string;
  commander: string;
  office: string;
  subject: string;
  body: string;
  status: 'pending' | 'resolved';
  response: JointCommandResponse | 'report' | null;
}

export interface TheaterControlSnapshot {
  air: number;
  sea: number;
  intelligence: number;
  trend: -1 | 0 | 1;
  lastChangedWeek: number;
}

export interface JointForcesState {
  version: 3;
  nationId: NationId;
  doctrine: JointDoctrine;
  fleets: NavalTaskForce[];
  airGroups: AirGroup[];
  operations: ActiveJointOperation[];
  records: JointOperationRecord[];
  opponent: JointOpponentState;
  engagements: JointEngagementRecord[];
  commandMessages: JointCommandMessage[];
  commandTrust: number;
  theaterControl: Record<TheaterId, TheaterControlSnapshot>;
  objectives: Record<TheaterId, JointCampaignObjective[]>;
}

export interface JointOperationContext {
  week: number;
  theater: TheaterId;
  game: Pick<GameState, 'airPower' | 'navalPower' | 'intelNetwork' | 'enemyPressure'>;
}

export interface JointOperationForecast {
  chance: number;
  duration: string;
  fuelCost: number;
  commandCost: number;
  convoyCost: number;
  factors: string[];
  warning: string | null;
  objective: JointCampaignObjective | null;
  civilianWarning: string | null;
}

export interface JointOperationEvent {
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  operationId: string;
  resolved: boolean;
  worldEffect?: string;
  side?: 'player' | 'enemy' | 'engagement';
}

export interface JointWeekResult {
  state: JointForcesState;
  gameDelta: Partial<Record<keyof GameState, number>>;
  aircraftDelta: number;
  convoyDelta: number;
  events: JointOperationEvent[];
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function stableRoll(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

const fleetKindLabels: Record<FleetKind, string> = {
  carrier: '항모 기동부대',
  surface: '수상 전투함대',
  escort: '호송·대잠 전대',
  submarine: '잠수함 전대',
  coastal: '연안 전대',
  clandestine: '비밀 해상연락대',
};

const airKindLabels: Record<AirGroupKind, string> = {
  fighter: '전투기 집단',
  bomber: '폭격기 집단',
  maritime: '해상초계 항공대',
  transport: '수송 항공대',
  recon: '정찰 항공대',
  mixed: '혼성 항공단',
};

export const jointDoctrineDefinitions: Record<JointDoctrine, { name: string; description: string; bonus: string }> = {
  concentration: { name: '결전 집중', description: '주력함·폭격기·전투기를 한 시점에 집중해 짧은 작전의 타격력을 높입니다.', bonus: '공세 진척 +8 · 주간 손실 위험 +2' },
  interdiction: { name: '종심 차단', description: '잠수함·정찰·폭격 전력을 적 수송로와 후방 기지에 분산 투입합니다.', bonus: '차단·폭격 성공률 +7% · 정보 의존' },
  protection: { name: '생명선 보호', description: '호송·대잠·전투기 엄호를 우선해 수송선과 가동률을 보존합니다.', bonus: '호송 성공률 +10% · 손실 -25%' },
};

const objectiveSeeds: Record<TheaterId, Array<Omit<JointCampaignObjective, 'lastChangedWeek' | 'lastResult'>>> = {
  europe: [
    { id: 'north-atlantic-route', theater: 'europe', kind: 'convoy-route', name: '북대서양 생명선', region: '핼리팩스–리버풀', historicalBasis: 'HX·SC·ON 호송선단과 중부 대서양 공중 공백을 중심으로 한 연합군 생명선을 재구성했습니다.', control: 54, infrastructure: 72, throughput: 68, enemyThreat: 66, damage: 18, civilianRisk: 12 },
    { id: 'mediterranean-route', theater: 'europe', kind: 'convoy-route', name: '지중해 보급항로', region: '지브롤터–몰타–알렉산드리아', historicalBasis: '몰타 보급선단과 추축군 해공 차단, 북아프리카 항만 수송을 하나의 작전 항로로 모델링했습니다.', control: 48, infrastructure: 61, throughput: 51, enemyThreat: 72, damage: 27, civilianRisk: 18 },
    { id: 'channel-air-zone', theater: 'europe', kind: 'air-zone', name: '영불해협 제공권', region: '도버–칼레–노르망디', historicalBasis: '영국 본토 방공, 해협 전투기 소탕과 대륙 상공 호위거리 문제를 반영했습니다.', control: 52, infrastructure: 69, throughput: 58, enemyThreat: 63, damage: 20, civilianRisk: 34 },
    { id: 'ruhr-industrial-area', theater: 'europe', kind: 'industrial-area', name: '루르 산업지대', region: '에센–도르트문트–뒤스부르크', historicalBasis: '철강·석탄·합성연료·철도 결절과 방공망이 밀집한 독일 산업권을 바탕으로 합니다.', control: 31, infrastructure: 88, throughput: 76, enemyThreat: 81, damage: 9, civilianRisk: 78 },
    { id: 'norway-naval-bases', theater: 'europe', kind: 'naval-base', name: '노르웨이 전진기지군', region: '트론헤임–나르비크–알타피오르', historicalBasis: '북극항로와 독일 수상함·U보트의 노르웨이 전진기지를 묶은 해상 작전 구역입니다.', control: 35, infrastructure: 74, throughput: 57, enemyThreat: 76, damage: 14, civilianRisk: 28 },
    { id: 'normandy-landing-sector', theater: 'europe', kind: 'landing-sector', name: '노르망디 상륙 해안', region: '셰르부르–캉–센만', historicalBasis: '1942년에는 아직 확정되지 않은 장래 상륙 후보지로서 조수·항만·방어선·공중 엄호 조건을 계산합니다.', control: 28, infrastructure: 66, throughput: 42, enemyThreat: 79, damage: 11, civilianRisk: 61 },
  ],
  asia: [
    { id: 'south-pacific-route', theater: 'asia', kind: 'convoy-route', name: '남태평양 수송축', region: '하와이–누메아–브리즈번', historicalBasis: '미국 본토와 호주를 잇는 병력·연료 수송선단과 일본 잠수함·항공 정찰 위협을 반영했습니다.', control: 55, infrastructure: 63, throughput: 64, enemyThreat: 61, damage: 17, civilianRisk: 9 },
    { id: 'indian-ocean-route', theater: 'asia', kind: 'convoy-route', name: '인도양·벵골만 항로', region: '아덴–봄베이–콜롬보–캘커타', historicalBasis: '수에즈·페르시아만에서 인도와 버마 전선으로 이어지는 제국 수송망과 잠수함 위협을 모델링했습니다.', control: 51, infrastructure: 59, throughput: 57, enemyThreat: 58, damage: 21, civilianRisk: 23 },
    { id: 'solomons-air-zone', theater: 'asia', kind: 'air-zone', name: '솔로몬·뉴기니 항공회랑', region: '라바울–과달카날–포트모르즈비', historicalBasis: '장거리 항공 정찰, 비행장 확보, 해상 보급과 전투기 항속거리가 얽힌 남서태평양 전역입니다.', control: 47, infrastructure: 48, throughput: 43, enemyThreat: 75, damage: 31, civilianRisk: 19 },
    { id: 'home-islands-industry', theater: 'asia', kind: 'industrial-area', name: '일본 본토 산업회랑', region: '도쿄–요코하마–나고야–오사카', historicalBasis: '항공기·조선·기계 공업과 도시 인구가 집중된 산업권으로 장거리 폭격의 군사효과와 민간 피해를 함께 계산합니다.', control: 24, infrastructure: 91, throughput: 82, enemyThreat: 87, damage: 5, civilianRisk: 91 },
    { id: 'truk-rabaul-bases', theater: 'asia', kind: 'naval-base', name: '트루크·라바울 전진기지', region: '캐롤라인–비스마르크 제도', historicalBasis: '일본 연합함대 정박지와 남태평양 항공·해군 보급 거점을 결합한 전진기지군입니다.', control: 29, infrastructure: 78, throughput: 70, enemyThreat: 84, damage: 13, civilianRisk: 35 },
    { id: 'philippines-landing-sector', theater: 'asia', kind: 'landing-sector', name: '필리핀 군도 접근로', region: '레이테–루손–민도로', historicalBasis: '다수의 해협·비행장·정박지와 현지 저항망이 상륙 및 재보급을 좌우하는 군도 전역입니다.', control: 33, infrastructure: 55, throughput: 46, enemyThreat: 73, damage: 24, civilianRisk: 67 },
  ],
};

function createCampaignObjectives(nationId: NationId): Record<TheaterId, JointCampaignObjective[]> {
  const reversePerspective = ['germany', 'japan', 'italy'].includes(nationId);
  const prepare = (objective: Omit<JointCampaignObjective, 'lastChangedWeek' | 'lastResult'>): JointCampaignObjective => ({
    ...objective,
    control: reversePerspective ? 100 - objective.control : objective.control,
    lastChangedWeek: -1,
    lastResult: '아직 이 구역에서 확정된 작전 결과가 없습니다.',
  });
  return {
    europe: objectiveSeeds.europe.map(prepare),
    asia: objectiveSeeds.asia.map(prepare),
  };
}

const objectiveKindsByOperation: Record<JointOperationKind, JointObjectiveKind[]> = {
  'air-superiority': ['air-zone', 'industrial-area', 'naval-base', 'landing-sector'],
  'close-support': ['landing-sector', 'air-zone'],
  'strategic-bombing': ['industrial-area', 'naval-base'],
  'convoy-escort': ['convoy-route'],
  'submarine-raiding': ['convoy-route'],
  'carrier-strike': ['naval-base', 'landing-sector', 'convoy-route'],
  'amphibious-cover': ['landing-sector'],
  reconnaissance: ['convoy-route', 'air-zone', 'industrial-area', 'naval-base', 'landing-sector'],
};

export function getJointOperationObjectives(state: JointForcesState, theater: TheaterId, kind: JointOperationKind) {
  const allowedKinds = objectiveKindsByOperation[kind];
  const postureMatch = (objective: JointCampaignObjective) => kind === 'convoy-escort' ? objective.control >= 38
    : ['submarine-raiding', 'strategic-bombing', 'carrier-strike', 'amphibious-cover'].includes(kind) ? objective.control <= 62
      : true;
  return state.objectives[theater].filter((objective) => allowedKinds.includes(objective.kind) && postureMatch(objective));
}

export const jointOperationTemplates: JointOperationTemplate[] = [
  {
    id: 'atlantic-lifeline', name: '대양 생명선 호송', kind: 'convoy-escort', theater: 'europe',
    description: '호송전대와 장거리 초계기를 묶어 상선단을 항구까지 엄호합니다.',
    historicalBasis: '호송함, 초계기, 암호정보가 결합되며 1943년 대서양의 공중 공백이 축소된 역사적 전개를 반영합니다.',
    minimumWeeks: 3, maximumWeeks: 7, commandCost: 7, fuelCost: 9, convoyCost: 8,
    requiredFleetKinds: ['escort', 'surface'], requiredAirKinds: ['maritime', 'recon', 'fighter'],
    worldEffect: '대서양 수송량과 해외 원정군의 보급 안정성이 변합니다.',
  },
  {
    id: 'wolfpack-interdiction', name: '통상파괴 순환초계', kind: 'submarine-raiding', theater: 'both',
    description: '잠수함·연안 전력을 분산 배치해 적 호송로를 찾아 장기간 압박합니다.',
    historicalBasis: '통신정보와 해역 배치를 바탕으로 잠수함 집단이 호송선단을 추적했던 통상파괴전을 모델링합니다.',
    minimumWeeks: 4, maximumWeeks: 9, commandCost: 8, fuelCost: 8, convoyCost: 0,
    requiredFleetKinds: ['submarine', 'coastal', 'clandestine'], requiredAirKinds: ['recon', 'maritime'],
    worldEffect: '적 수송능력과 연료 흐름이 약화되지만 방첩·대잠 대응을 촉진합니다.',
  },
  {
    id: 'fighter-sweep', name: '전구 항공우세 작전', kind: 'air-superiority', theater: 'both',
    description: '전투기 집단을 집중해 제공권을 다투고 육·해군의 작전 자유를 확보합니다.',
    historicalBasis: '전투기 엄호, 지상 관제, 정찰정보와 기지 가동률이 제공권을 결정했던 전구 항공전을 반영합니다.',
    minimumWeeks: 2, maximumWeeks: 5, commandCost: 6, fuelCost: 12, convoyCost: 0,
    requiredFleetKinds: [], requiredAirKinds: ['fighter', 'mixed'],
    worldEffect: '제공권이 전선 보급, 폭격 손실과 지상군 작전 속도에 영향을 줍니다.',
  },
  {
    id: 'close-air-support', name: '지상군 근접항공지원', kind: 'close-support', theater: 'both',
    description: '전투기·폭격기와 전선 연락반을 묶어 진행 중인 육상 공세를 지원합니다.',
    historicalBasis: '항공지원 요청, 표적 식별, 전선 기상과 아군 오폭 위험을 포함한 공지 협동을 추상화합니다.',
    minimumWeeks: 2, maximumWeeks: 4, commandCost: 7, fuelCost: 14, convoyCost: 0,
    requiredFleetKinds: [], requiredAirKinds: ['fighter', 'bomber', 'mixed'],
    worldEffect: '육상 공세의 누적 진척과 사상자 비율이 변합니다.',
  },
  {
    id: 'strategic-air-campaign', name: '전략폭격 공세', kind: 'strategic-bombing', theater: 'both',
    description: '폭격기·전투기·정찰기를 다주간 운용해 적 산업과 철도망을 마비시킵니다.',
    historicalBasis: '표적정보, 호위거리, 기상, 승무원 피로와 민간인 피해가 장기 폭격전의 성과와 정치적 비용을 함께 만들도록 구성했습니다.',
    minimumWeeks: 5, maximumWeeks: 10, commandCost: 11, fuelCost: 22, convoyCost: 0,
    requiredFleetKinds: [], requiredAirKinds: ['bomber'],
    worldEffect: '적 산업압력과 민간인 피해, 국내외 정당성 논쟁이 함께 누적됩니다.',
  },
  {
    id: 'carrier-strike', name: '항모 기동타격', kind: 'carrier-strike', theater: 'asia',
    description: '항모 중심 기동부대와 함재기·정찰대를 운용해 적 함대와 기지를 타격합니다.',
    historicalBasis: '항모, 호위함, 정찰, 타격대의 발견-결심-발진 순환과 취약한 비행갑판·연료 계통을 함께 반영합니다.',
    minimumWeeks: 3, maximumWeeks: 6, commandCost: 12, fuelCost: 20, convoyCost: 0,
    requiredFleetKinds: ['carrier'], requiredAirKinds: ['fighter', 'bomber', 'mixed', 'recon'],
    worldEffect: '태평양의 해상 주도권과 섬 기지 접근 가능성이 크게 변합니다.',
  },
  {
    id: 'amphibious-cover', name: '상륙부대 해공 엄호', kind: 'amphibious-cover', theater: 'both',
    description: '수상함·호송선·전투기·수송대를 통합해 상륙 교두보를 준비합니다.',
    historicalBasis: '상륙함정, 제해·제공권, 기상, 해안정보와 후속 보급이 모두 충족돼야 했던 상륙작전의 복합성을 반영합니다.',
    minimumWeeks: 4, maximumWeeks: 8, commandCost: 14, fuelCost: 24, convoyCost: 18,
    requiredFleetKinds: ['surface', 'escort', 'carrier', 'coastal'], requiredAirKinds: ['fighter', 'transport', 'mixed'],
    worldEffect: '상륙 전선의 개방과 후속 보급로 유지 가능성이 달라집니다.',
  },
  {
    id: 'armed-reconnaissance', name: '장거리 무장정찰', kind: 'reconnaissance', theater: 'both',
    description: '정찰·해상초계·혼성 항공대를 보내 적 배치와 항로를 갱신합니다.',
    historicalBasis: '사진정찰, 해상초계, 통신감청 결과가 다음 작전의 표적 신뢰도를 높였던 정보 순환을 반영합니다.',
    minimumWeeks: 1, maximumWeeks: 3, commandCost: 4, fuelCost: 6, convoyCost: 0,
    requiredFleetKinds: [], requiredAirKinds: ['recon', 'maritime', 'mixed'],
    worldEffect: '정보 신뢰도와 후속 합동작전의 성공 가능성이 높아집니다.',
  },
];

interface NationForceSeed {
  fleets: [string, FleetKind, string, string, string, number, string][];
  air: [string, AirGroupKind, string, string, string, number, string][];
}

const nationForceSeeds: Record<NationId, NationForceSeed> = {
  britain: {
    fleets: [
      ['본국함대', 'surface', '존 토비', 'HMS 킹 조지 5세', '스캐퍼플로', 18, '1942년 영국 본국함대와 존 토비 제독의 지휘를 바탕으로 합니다.'],
      ['서부접근로 호송사령부', 'escort', '퍼시 노블', 'HMS 워커', '리버풀', 31, '서부접근로의 대서양 호송·대잠 지휘체계를 바탕으로 합니다.'],
    ],
    air: [
      ['전투사령부 제11그룹', 'fighter', '트래퍼드 리맬러리', '스핏파이어 Mk V', '욱스브리지', 420, '영국 본토 방공과 대륙 진입로를 담당한 제11그룹을 바탕으로 합니다.'],
      ['연안사령부 대서양집단', 'maritime', '필립 주베르 드 라 페르테', 'B-24 리버레이터', '북아일랜드', 168, '1942년 RAF 연안사령부의 대잠초계 임무를 바탕으로 합니다.'],
    ],
  },
  usa: {
    fleets: [
      ['제16기동부대', 'carrier', '토머스 킨케이드', 'USS 엔터프라이즈', '누메아', 17, '1942년 남태평양의 USS 엔터프라이즈 중심 기동부대를 바탕으로 합니다.'],
      ['대서양 호송지원부대', 'escort', '로열 잉거솔', 'USS 레인저', '노퍽', 28, '미 대서양함대의 호송·대잠 및 횃불작전 수송 지원을 바탕으로 합니다.'],
    ],
    air: [
      ['제8공군 폭격사령부', 'bomber', '칼 스파츠', 'B-17 플라잉 포트리스', '영국 남부', 360, '1942년 영국에 전개한 미 제8공군의 주간 폭격 전력을 바탕으로 합니다.'],
      ['제5공군 전투집단', 'fighter', '조지 케니', 'P-38 라이트닝', '포트모르즈비', 310, '1942년 남서태평양 제5공군과 조지 케니의 지휘를 바탕으로 합니다.'],
    ],
  },
  ussr: {
    fleets: [
      ['북방함대', 'escort', '아르세니 골롭코', '바쿠', '폴랴르니', 24, '북극항로 호송과 연안 방어를 맡은 소련 북방함대를 바탕으로 합니다.'],
      ['흑해함대', 'surface', '필리프 옥탸브리스키', '파리 코뮌', '캅카스 연안', 32, '세바스토폴 철수 이후 캅카스 해역을 지원한 흑해함대를 바탕으로 합니다.'],
    ],
    air: [
      ['제8항공군', 'mixed', '티모페이 흐류킨', 'Yak-1 · Il-2', '스탈린그라드', 520, '스탈린그라드 전선의 제8항공군을 바탕으로 합니다.'],
      ['장거리항공대', 'bomber', '알렉산드르 골로바노프', 'Il-4', '모스크바 권역', 280, '소련 장거리항공대의 전략·야간 폭격 임무를 바탕으로 합니다.'],
    ],
  },
  germany: {
    fleets: [
      ['U보트 사령부', 'submarine', '카를 되니츠', 'U-552', '브레스트', 41, '1942년 대서양의 U보트 전력과 되니츠의 잠수함 지휘체계를 바탕으로 합니다.'],
      ['북해 전투함대', 'surface', '오토 칠리아크스', '티르피츠', '노르웨이', 13, '노르웨이·북해에서 연합군 항로를 견제한 독일 수상함 전력을 바탕으로 합니다.'],
    ],
    air: [
      ['제2항공함대', 'mixed', '알베르트 케셀링', 'Bf 109 · Ju 88', '지중해', 580, '1942년 지중해·북아프리카를 지원한 제2항공함대를 바탕으로 합니다.'],
      ['제3항공함대', 'bomber', '후고 슈페를레', 'He 111 · Fw 190', '프랑스', 430, '점령 프랑스에서 서부 전구를 담당한 제3항공함대를 바탕으로 합니다.'],
      ['제40폭격비행단 해상초계대', 'maritime', '에드가 페테르젠', 'Fw 200 콘도르', '보르도-메리냐크', 86, '대서양에서 장거리 수색과 통상파괴 지원을 수행한 KG 40과 Fw 200 운용을 바탕으로 합니다.'],
    ],
  },
  japan: {
    fleets: [
      ['연합함대 주력', 'surface', '야마모토 이소로쿠', '야마토', '트루크', 35, '1942년 야마모토가 지휘한 일본 연합함대 주력부대를 바탕으로 합니다.'],
      ['제3함대 항모부대', 'carrier', '나구모 주이치', '쇼카쿠', '남태평양', 19, '1942년 일본 제3함대의 항모전력을 바탕으로 합니다.'],
    ],
    air: [
      ['제11항공함대', 'mixed', '구사카 진이치', 'A6M 제로 · G4M', '라바울', 440, '라바울을 중심으로 남태평양 작전을 수행한 해군 항공전력을 바탕으로 합니다.'],
      ['육군 제3비행집단', 'fighter', '스가와라 미치오', 'Ki-43 하야부사', '버마', 350, '동남아시아 전구의 일본 육군항공대를 바탕으로 합니다.'],
    ],
  },
  china: {
    fleets: [
      ['국민정부 해군총사령부', 'coastal', '천사오콴', '민강 경비함대', '푸젠 내륙수로', 12, '대형함 손실 뒤 강·연안을 중심으로 존속한 중화민국 해군 지휘부를 바탕으로 합니다.'],
      ['양쯔강 수송경비대', 'clandestine', '천처', '내하 경비정', '충칭·이창', 18, '전시 내륙수로 수송과 점령지 연락망을 합성한 비정규 편제입니다.'],
    ],
    air: [
      ['중국공군 제4대대', 'fighter', '저우즈러우', 'P-40 워호크', '쿤밍', 190, '중국공군과 연합 항공지원망의 1942년 전력을 바탕으로 합니다.'],
      ['중미 혼성정찰단', 'recon', '클레어 셰놀트', 'P-40 · 수송기', '쿤밍', 145, '플라잉 타이거스에서 중국 주둔 미 항공전력으로 이어진 연락망을 바탕으로 합니다.'],
    ],
  },
  india: {
    fleets: [
      ['왕립인도해군 동부전대', 'escort', '제프리 마일스', 'HMIS 힌두스탄', '봄베이', 17, '전시 호송·연안방어로 확대된 왕립인도해군을 바탕으로 합니다.'],
      ['벵골만 연안전대', 'coastal', '조지프 존스', 'HMIS 소나라', '캘커타', 14, '벵골만 항로와 항만 방어 임무를 바탕으로 재구성했습니다.'],
    ],
    air: [
      ['인도 공군 제1비행대', 'recon', '서브로토 무케르지', '라이샌더', '임팔', 78, '버마 전선에서 육군협동 임무를 수행한 인도 공군 제1비행대를 바탕으로 합니다.'],
      ['동부항공 수송집단', 'transport', '토머스 엘머스트', '다코타', '아삼', 96, '인도 동부의 수송·훈련·방공 전력을 합성한 전구 편제입니다.'],
    ],
  },
  freefrance: {
    fleets: [
      ['자유프랑스 해군', 'escort', '필리프 오보이노', '르 트리옹팡', '포츠머스', 19, '1942년 필리프 오보이노가 지휘한 자유프랑스 해군을 바탕으로 합니다.'],
      ['적도아프리카 연안전대', 'coastal', '조르주 티에리 다르장리외', '사보르냥 드 브라자', '두알라', 11, '자유프랑스령 아프리카의 해상 연락과 통제를 바탕으로 합니다.'],
    ],
    air: [
      ['자유프랑스 공군', 'mixed', '마르시알 발랭', '스핏파이어 · 보스턴', '영국·북아프리카', 155, '마르시알 발랭 휘하 자유프랑스 공군을 바탕으로 합니다.'],
      ['로렌 폭격비행단', 'bomber', '리오넬 드 마르미에', '더글러스 보스턴', '영국', 64, '자유프랑스 로렌 폭격비행단의 전시 활동을 바탕으로 합니다.'],
    ],
  },
  italy: {
    fleets: [
      ['제1전대', 'surface', '안젤로 이아키노', '리토리오', '타란토', 29, '1942년 지중해의 이탈리아 주력 전투함대를 바탕으로 합니다.'],
      ['BETASOM 잠수함전대', 'submarine', '엔초 그로시', '바르바리고', '보르도', 22, '보르도 기지에서 대서양 통상파괴전을 수행한 이탈리아 잠수함대를 바탕으로 합니다.'],
    ],
    air: [
      ['제5항공군', 'mixed', '마리오 베르나스코니', 'MC.202 · SM.79', '리비아', 330, '북아프리카 전역을 지원한 이탈리아 항공전력을 바탕으로 합니다.'],
      ['사르데냐 해상항공단', 'maritime', '루지노 보노', 'SM.79 스파르비에로', '사르데냐', 180, '지중해 대함·호송 차단 임무를 수행한 뇌격기 전력을 바탕으로 합니다.'],
    ],
  },
  korea: {
    fleets: [
      ['임정 해상연락대', 'clandestine', '신익희', '중국 연안 연락선', '충칭·상하이 연락로', 7, '임시정부의 국내외 연락·밀항·자금 수송 사례에서 확장한 비정규 해상편제입니다.'],
      ['광복군 수송협조대', 'coastal', '이범석', '연합군 지원정', '인도·중국 연결로', 9, '광복군의 인도 파견대와 연합군 협력 사례를 해상수송 임무로 확장했습니다.'],
    ],
    air: [
      ['광복군 항공연락대', 'recon', '최용덕', '연합군 연락기', '충칭', 38, '중국 공군에서 활동한 최용덕과 광복군의 항공대 구상을 바탕으로 한 대체역사 초기편제입니다.'],
      ['국내정진 수송반', 'transport', '김신', 'C-47 연락기', '시안', 24, '광복군과 OSS의 국내정진 훈련 구상을 항공수송 편제로 확장한 대체역사 요소입니다.'],
    ],
  },
  vietnam: {
    fleets: [
      ['비엣민 해상연락망', 'clandestine', '보응우옌잡', '통킹만 연락선', '까오방·통킹만', 8, '베트민의 국경·연안 연락과 비정규 보급망을 합성한 초기편제입니다.'],
      ['메콩 수로조직', 'coastal', '팜반동', '메콩 연락정', '메콩 삼각주', 10, '식민지기 수로망과 독립운동 연락조직을 바탕으로 확장했습니다.'],
    ],
    air: [
      ['해외 항공기술조', 'recon', '쩐다이응이아', '민간 연락기', '쿤밍 연락로', 22, '해외 공학 인재와 중국 연결망을 대체역사 항공기술 조직으로 확장했습니다.'],
      ['통킹 관측대', 'mixed', '호앙반타이', '노획 경비행기', '비엣박', 18, '비정규 정찰·연락 임무를 위한 대체역사 편제입니다.'],
    ],
  },
  indonesia: {
    fleets: [
      ['군도 연락선단', 'clandestine', '수디르만', '자바 연락선', '자바해', 11, '일본 점령기 군도 간 민족운동 연락망을 비정규 해상편제로 확장했습니다.'],
      ['말루쿠 연안조직', 'coastal', '삼 라툴랑이', '도서 경비정', '술라웨시·말루쿠', 9, '군도 행정·지역조직을 연안 연락 임무로 재구성했습니다.'],
    ],
    air: [
      ['인도네시아 항공연락조', 'recon', '수르야디 수르야다르마', '훈련·연락기', '자바', 26, '네덜란드령 동인도 항공 경력자들이 이후 공군을 세운 역사를 앞당긴 대체편제입니다.'],
      ['군도 수송비행대', 'transport', '압둘라 살레', '민간 수송기', '수마트라', 20, '독립기 항공 개척자들의 경력을 전시 연락망으로 확장했습니다.'],
    ],
  },
  philippines: {
    fleets: [
      ['해안감시대 연락선단', 'clandestine', '찰스 파슨스', '게릴라 연락선', '비사야·민다나오', 12, '일본 점령하 필리핀의 해안감시·잠수함 연락망을 바탕으로 합니다.'],
      ['필리핀 연안방위대', 'coastal', '라몬 알카라스', 'Q-보트', '민다나오', 9, '전쟁 전 필리핀 해안방위 함정과 생존 장병을 대체역사 편제로 재구성했습니다.'],
    ],
    air: [
      ['극동항공 연락대', 'recon', '헤수스 비야모르', 'P-40 · 연락기', '호주·민다나오', 32, '필리핀 전투기 조종사와 연합군 정보 연락을 바탕으로 합니다.'],
      ['게릴라 보급비행반', 'transport', '웬델 퍼티그', '경수송기', '민다나오', 20, '게릴라 보급·정보망을 소규모 항공수송으로 확장한 대체역사 편제입니다.'],
    ],
  },
};

const nationNames: Record<NationId, string> = {
  britain: '영국', usa: '미국', ussr: '소련', germany: '독일', japan: '일본', china: '중국', india: '인도',
  freefrance: '자유 프랑스', italy: '이탈리아', korea: '한국 독립운동', vietnam: '베트남 독립운동',
  indonesia: '인도네시아 독립운동', philippines: '필리핀',
};

const primaryOpponent: Record<NationId, NationId> = {
  britain: 'germany', usa: 'japan', ussr: 'germany', germany: 'britain', japan: 'usa', china: 'japan', india: 'japan',
  freefrance: 'germany', italy: 'britain', korea: 'japan', vietnam: 'japan', indonesia: 'japan', philippines: 'japan',
};

const initialTheaterControl = (): Record<TheaterId, TheaterControlSnapshot> => ({
  europe: { air: 50, sea: 50, intelligence: 50, trend: 0, lastChangedWeek: 0 },
  asia: { air: 50, sea: 50, intelligence: 50, trend: 0, lastChangedWeek: 0 },
});

function createFleet(nationId: NationId, seed: NationForceSeed['fleets'][number], index: number): NavalTaskForce {
  const [name, kind, commander, flagship, location, ships, historicalBasis] = seed;
  const minor = ['korea', 'vietnam', 'indonesia', 'philippines'].includes(nationId);
  return {
    id: `${nationId}-fleet-${index + 1}`,
    name, kind, commander, flagship, location, ships, authorizedShips: ships,
    readiness: minor ? 54 + index * 5 : 72 - index * 4,
    organization: minor ? 48 + index * 6 : 76 - index * 3,
    experience: minor ? 38 + index * 5 : 68 - index * 2,
    status: 'ready', assignmentId: null, historicalBasis,
  };
}

function createAirGroup(nationId: NationId, seed: NationForceSeed['air'][number], index: number): AirGroup {
  const [name, kind, commander, principalAircraft, base, aircraft, historicalBasis] = seed;
  const minor = ['korea', 'vietnam', 'indonesia', 'philippines'].includes(nationId);
  return {
    id: `${nationId}-air-${index + 1}`,
    name, kind, commander, principalAircraft, base, aircraft, authorizedAircraft: aircraft,
    serviceability: minor ? 51 + index * 5 : 73 - index * 3,
    readiness: minor ? 55 + index * 4 : 75 - index * 4,
    experience: minor ? 36 + index * 6 : 65 - index * 2,
    status: 'ready', assignmentId: null, historicalBasis,
  };
}

function createNationForces(nationId: NationId) {
  const seed = nationForceSeeds[nationId];
  return {
    fleets: seed.fleets.map((item, index) => createFleet(nationId, item, index)),
    airGroups: seed.air.map((item, index) => createAirGroup(nationId, item, index)),
  };
}

function createJointOpponentState(nationId: NationId): JointOpponentState {
  const opponentNationId = primaryOpponent[nationId];
  const forces = createNationForces(opponentNationId);
  return {
    nationId: opponentNationId,
    name: nationNames[opponentNationId],
    doctrine: ['germany', 'japan', 'italy'].includes(opponentNationId) ? 'concentration' : 'protection',
    ...forces,
    operations: [],
    records: [],
    lastDecisionWeek: -3,
  };
}

export function createJointForcesState(nationId: NationId): JointForcesState {
  const forces = createNationForces(nationId);
  return {
    version: 3,
    nationId,
    doctrine: 'protection',
    ...forces,
    operations: [],
    records: [],
    opponent: createJointOpponentState(nationId),
    engagements: [],
    commandMessages: [],
    commandTrust: 50,
    theaterControl: initialTheaterControl(),
    objectives: createCampaignObjectives(nationId),
  };
}

export function normalizeJointForcesState(value: unknown, nationId: NationId): JointForcesState {
  const fallback = createJointForcesState(nationId);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<JointForcesState>;
  if (candidate.nationId !== nationId || !Array.isArray(candidate.fleets) || !Array.isArray(candidate.airGroups)) return fallback;
  const fleetFallback = new Map(fallback.fleets.map((unit) => [unit.id, unit]));
  const airFallback = new Map(fallback.airGroups.map((unit) => [unit.id, unit]));
  const candidateOpponent = candidate.opponent && typeof candidate.opponent === 'object' ? candidate.opponent : fallback.opponent;
  const opponentFleetFallback = new Map(fallback.opponent.fleets.map((unit) => [unit.id, unit]));
  const opponentAirFallback = new Map(fallback.opponent.airGroups.map((unit) => [unit.id, unit]));
  return {
    ...fallback,
    doctrine: candidate.doctrine && candidate.doctrine in jointDoctrineDefinitions ? candidate.doctrine : fallback.doctrine,
    fleets: candidate.fleets.map((unit) => ({ ...fleetFallback.get(unit.id), ...unit })).filter((unit): unit is NavalTaskForce => Boolean(unit.id)),
    airGroups: candidate.airGroups.map((unit) => ({ ...airFallback.get(unit.id), ...unit })).filter((unit): unit is AirGroup => Boolean(unit.id)),
    operations: Array.isArray(candidate.operations) ? candidate.operations.filter((operation) => operation?.status === 'active') : [],
    records: Array.isArray(candidate.records) ? candidate.records.slice(-40) : [],
    opponent: {
      ...fallback.opponent,
      ...candidateOpponent,
      doctrine: candidateOpponent.doctrine && candidateOpponent.doctrine in jointDoctrineDefinitions ? candidateOpponent.doctrine : fallback.opponent.doctrine,
      fleets: Array.isArray(candidateOpponent.fleets)
        ? candidateOpponent.fleets.map((unit) => ({ ...opponentFleetFallback.get(unit.id), ...unit })).filter((unit): unit is NavalTaskForce => Boolean(unit.id))
        : fallback.opponent.fleets,
      airGroups: Array.isArray(candidateOpponent.airGroups)
        ? candidateOpponent.airGroups.map((unit) => ({ ...opponentAirFallback.get(unit.id), ...unit })).filter((unit): unit is AirGroup => Boolean(unit.id))
        : fallback.opponent.airGroups,
      operations: Array.isArray(candidateOpponent.operations) ? candidateOpponent.operations.filter((operation) => operation?.status === 'active') : [],
      records: Array.isArray(candidateOpponent.records) ? candidateOpponent.records.slice(-40) : [],
    },
    engagements: Array.isArray(candidate.engagements) ? candidate.engagements.slice(-60) : [],
    commandMessages: Array.isArray(candidate.commandMessages) ? candidate.commandMessages.slice(-30) : [],
    commandTrust: typeof candidate.commandTrust === 'number' ? clamp(candidate.commandTrust) : fallback.commandTrust,
    theaterControl: candidate.theaterControl && typeof candidate.theaterControl === 'object'
      ? { ...fallback.theaterControl, ...candidate.theaterControl }
      : fallback.theaterControl,
    objectives: candidate.objectives && typeof candidate.objectives === 'object'
      ? {
        europe: Array.isArray(candidate.objectives.europe) ? candidate.objectives.europe.map((objective) => ({ ...fallback.objectives.europe.find((item) => item.id === objective.id), ...objective })).filter((objective): objective is JointCampaignObjective => Boolean(objective.id)) : fallback.objectives.europe,
        asia: Array.isArray(candidate.objectives.asia) ? candidate.objectives.asia.map((objective) => ({ ...fallback.objectives.asia.find((item) => item.id === objective.id), ...objective })).filter((objective): objective is JointCampaignObjective => Boolean(objective.id)) : fallback.objectives.asia,
      }
      : fallback.objectives,
  };
}

export function getAvailableJointOperationTemplates(theater: TheaterId) {
  return jointOperationTemplates.filter((template) => template.theater === 'both' || template.theater === theater);
}

function matchesFleet(template: JointOperationTemplate, unit: NavalTaskForce) {
  return template.requiredFleetKinds.length === 0 || template.requiredFleetKinds.includes(unit.kind);
}

function matchesAir(template: JointOperationTemplate, unit: AirGroup) {
  return template.requiredAirKinds.length === 0 || template.requiredAirKinds.includes(unit.kind);
}

const historicalForces = (Object.keys(nationForceSeeds) as NationId[]).map(createNationForces);
const historicalFleetSizes = new Map(historicalForces.flatMap((forces) => forces.fleets.map((unit) => [unit.id, unit.ships] as const)));
const historicalAirSizes = new Map(historicalForces.flatMap((forces) => forces.airGroups.map((unit) => [unit.id, unit.aircraft] as const)));
const availableCount = (count: number) => Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

function getForceStrength(template: JointOperationTemplate, fleets: NavalTaskForce[], airGroups: AirGroup[]): number {
  const ratios: number[] = [];
  if (template.requiredFleetKinds.length > 0 || fleets.length > 0) {
    const nominal = fleets.reduce((sum, unit) => sum + Math.max(1, unit.authorizedShips ?? historicalFleetSizes.get(unit.id) ?? unit.ships), 0);
    ratios.push(nominal > 0 ? clamp(fleets.reduce((sum, unit) => sum + availableCount(unit.ships), 0) / nominal, 0, 1) : 0);
  }
  if (template.requiredAirKinds.length > 0 || airGroups.length > 0) {
    const nominal = airGroups.reduce((sum, unit) => sum + Math.max(1, unit.authorizedAircraft ?? historicalAirSizes.get(unit.id) ?? unit.aircraft), 0);
    ratios.push(nominal > 0 ? clamp(airGroups.reduce((sum, unit) => sum + availableCount(unit.aircraft), 0) / nominal, 0, 1) : 0);
  }
  // A full air wing cannot replace missing ships in a combined mission.
  return ratios.length ? Math.min(...ratios) : 0;
}

function getOperationStrength(operation: ActiveJointOperation, fleets: NavalTaskForce[], airGroups: AirGroup[]) {
  const template = jointOperationTemplates.find((item) => item.id === operation.templateId);
  return template ? getForceStrength(template, fleets.filter((unit) => operation.fleetIds.includes(unit.id)), airGroups.filter((unit) => operation.airGroupIds.includes(unit.id))) : 0;
}

function currentOperationChance(operation: ActiveJointOperation, strength: number) {
  if (strength <= 0) return 0;
  // The launch forecast already priced in its initial losses. Only apply new
  // losses here; old saves use their historical full-strength baseline.
  return clamp(operation.successChance - Math.max(0, (operation.initialForceStrength ?? 1) - strength) * 36, 0, 96);
}

function distributeFormationLosses<T extends { id: string; assignmentId: string | null }>(units: T[], losses: Map<string, number>, count: (unit: T) => number) {
  const allocated = new Map<string, number>();
  for (const [operationId, requestedLoss] of losses) {
    const assigned = units.filter((unit) => unit.assignmentId === operationId);
    const total = assigned.reduce((sum, unit) => sum + availableCount(count(unit)), 0);
    if (total === 0) continue;
    const loss = Math.min(total, availableCount(requestedLoss));
    let cumulative = 0;
    let distributed = 0;
    assigned.forEach((unit) => {
      cumulative += availableCount(count(unit));
      const next = Math.floor(loss * cumulative / total);
      allocated.set(unit.id, next - distributed);
      distributed = next;
    });
  }
  return allocated;
}

export function forecastJointOperation(
  state: JointForcesState,
  templateId: string,
  fleetIds: string[],
  airGroupIds: string[],
  context: JointOperationContext,
  objectiveId?: string,
): JointOperationForecast | null {
  const template = jointOperationTemplates.find((item) => item.id === templateId);
  if (!template) return null;
  const fleets = state.fleets.filter((unit) => fleetIds.includes(unit.id));
  const airGroups = state.airGroups.filter((unit) => airGroupIds.includes(unit.id));
  const objectives = getJointOperationObjectives(state, context.theater, template.kind);
  const objective = objectives.find((item) => item.id === objectiveId) ?? objectives[0] ?? null;
  const requiresFleet = template.requiredFleetKinds.length > 0;
  const requiresAir = template.requiredAirKinds.length > 0;
  let warning: string | null = null;
  if (requiresFleet && fleets.length === 0) warning = `${template.requiredFleetKinds.map((kind) => fleetKindLabels[kind]).join('·')} 중 하나가 필요합니다.`;
  else if (requiresFleet && !fleets.some((unit) => matchesFleet(template, unit))) warning = '선택한 함대 유형이 임무 요구와 맞지 않습니다.';
  else if (requiresAir && airGroups.length === 0) warning = `${template.requiredAirKinds.map((kind) => airKindLabels[kind]).join('·')} 중 하나가 필요합니다.`;
  else if (requiresAir && !airGroups.some((unit) => matchesAir(template, unit))) warning = '선택한 항공대 유형이 임무 요구와 맞지 않습니다.';
  else if (fleets.some((unit) => availableCount(unit.ships) === 0)) warning = '함정이 0척인 함대는 출격할 수 없습니다. 전력을 보충하거나 다른 함대를 선택하십시오.';
  else if (airGroups.some((unit) => availableCount(unit.aircraft) === 0)) warning = '항공기가 0대인 항공대는 출격할 수 없습니다. 전력을 보충하거나 다른 항공대를 선택하십시오.';
  else if ([...fleets, ...airGroups].some((unit) => unit.status !== 'ready')) warning = '선택 전력 중 다른 임무에 배속됐거나 재편 중인 부대가 있습니다.';
  else if (!objective) warning = '현재 전구에서 이 작전에 맞는 목표 구역을 찾을 수 없습니다.';

  const forceReadiness = [...fleets.map((unit) => (unit.readiness + unit.organization + unit.experience) / 3), ...airGroups.map((unit) => (unit.readiness + unit.serviceability + unit.experience) / 3)];
  const averageReadiness = forceReadiness.length > 0 ? forceReadiness.reduce((sum, value) => sum + value, 0) / forceReadiness.length : 35;
  const domainPower = template.kind === 'air-superiority' || template.kind === 'strategic-bombing' || template.kind === 'close-support'
    ? context.game.airPower
    : template.kind === 'reconnaissance'
      ? context.game.intelNetwork
      : (context.game.navalPower + context.game.airPower) / 2;
  const combinedBonus = fleets.length > 0 && airGroups.length > 0 ? 8 : 0;
  const doctrineBonus = state.doctrine === 'protection' && template.kind === 'convoy-escort' ? 10
    : state.doctrine === 'interdiction' && ['submarine-raiding', 'strategic-bombing', 'reconnaissance'].includes(template.kind) ? 7
      : state.doctrine === 'concentration' && ['carrier-strike', 'air-superiority', 'close-support', 'amphibious-cover'].includes(template.kind) ? 7 : 0;
  const objectiveModifier = objective ? clamp(9 - objective.enemyThreat * .13 - objective.damage * .04 + context.game.intelNetwork * .04, -10, 8) : 0;
  const forceStrength = getForceStrength(template, fleets, airGroups);
  const chance = forceStrength > 0 ? Math.round(clamp(24 + averageReadiness * 0.42 + domainPower * 0.22 + context.game.intelNetwork * 0.12 + combinedBonus + doctrineBonus + objectiveModifier - context.game.enemyPressure * 0.28 - (1 - forceStrength) * 36, 1, 92)) : 0;
  const factors = [
    `투입 전력 평균 준비도 ${Math.round(averageReadiness)}`,
    `실제 전력 충족률 ${Math.round(forceStrength * 100)}% · 함정 ${fleets.reduce((sum, unit) => sum + availableCount(unit.ships), 0)}척 · 항공기 ${airGroups.reduce((sum, unit) => sum + availableCount(unit.aircraft), 0)}대`,
    `전구 ${template.kind.includes('air') || template.kind === 'strategic-bombing' || template.kind === 'close-support' ? '공군력' : '해·공군력'} ${Math.round(domainPower)}`,
    `정보 신뢰도 ${Math.round(context.game.intelNetwork)}`,
    `적 대응압력 ${Math.round(context.game.enemyPressure)}`,
    combinedBonus ? '해·공군 합동 편성 +8' : '단일 군종 편성',
    doctrineBonus ? `${jointDoctrineDefinitions[state.doctrine].name} 교리 +${doctrineBonus}` : '교리 직접 보너스 없음',
    objective ? `${objective.name} · 적 위협 ${Math.round(objective.enemyThreat)} · 누적 피해 ${Math.round(objective.damage)}` : '작전 목표 미지정',
  ];
  return {
    chance,
    duration: `${template.minimumWeeks}~${template.maximumWeeks}주`,
    fuelCost: template.fuelCost,
    commandCost: template.commandCost,
    convoyCost: template.convoyCost,
    factors,
    warning,
    objective,
    civilianWarning: objective && ['strategic-bombing', 'carrier-strike', 'close-support'].includes(template.kind) && objective.civilianRisk >= 60
      ? `민간 노출 ${Math.round(objective.civilianRisk)}: 군사효과와 별도로 사상자·정당성·전후 책임이 누적됩니다.`
      : null,
  };
}

export function launchJointOperation(
  state: JointForcesState,
  templateId: string,
  fleetIds: string[],
  airGroupIds: string[],
  context: JointOperationContext,
  objectiveId?: string,
): { state: JointForcesState; operation: ActiveJointOperation; forecast: JointOperationForecast } | null {
  const template = jointOperationTemplates.find((item) => item.id === templateId);
  const forecast = forecastJointOperation(state, templateId, fleetIds, airGroupIds, context, objectiveId);
  if (!template || !forecast || forecast.warning) return null;
  const operationId = `joint-${context.week}-${templateId}-${state.operations.length + state.records.length}`;
  const operation: ActiveJointOperation = {
    id: operationId,
    templateId,
    name: template.name,
    kind: template.kind,
    theater: template.theater === 'both' ? context.theater : template.theater,
    startedWeek: context.week,
    elapsedWeeks: 0,
    minimumWeeks: template.minimumWeeks,
    maximumWeeks: template.maximumWeeks,
    progress: 0,
    successChance: forecast.chance,
    initialForceStrength: getForceStrength(template, state.fleets.filter((unit) => fleetIds.includes(unit.id)), state.airGroups.filter((unit) => airGroupIds.includes(unit.id))),
    objectiveId: forecast.objective?.id,
    objectiveName: forecast.objective?.name,
    fleetIds,
    airGroupIds,
    status: 'active',
  };
  const leadFleet = state.fleets.find((unit) => fleetIds.includes(unit.id));
  const leadAirGroup = state.airGroups.find((unit) => airGroupIds.includes(unit.id));
  const lead = leadFleet ?? leadAirGroup;
  const commandMessage: JointCommandMessage | null = lead ? {
    id: `command-${operationId}`,
    week: context.week,
    operationId,
    commander: lead.commander,
    office: leadFleet ? `${leadFleet.name} 지휘부` : `${leadAirGroup?.name ?? '항공작전'} 지휘부`,
    subject: forecast.chance >= 68 ? '작전 재량권 요청' : '위험평가 재검토 요청',
    body: forecast.chance >= 68
      ? `${lead.commander} 지휘관은 현장 접촉 뒤 표적과 출격 시각을 조정할 재량권을 요청했습니다. 지원하면 지휘관의 신뢰와 작전 대응력이 오르지만 추가 준비가 필요합니다.`
      : `${lead.commander} 지휘관은 현재 성공 전망 ${forecast.chance}%로는 손실 위험이 크다고 보고했습니다. 계획을 늦춰 정찰을 보강할지, 원안을 밀어붙일지 결정해야 합니다.`,
    status: 'pending',
    response: null,
  } : null;
  return {
    state: {
      ...state,
      fleets: state.fleets.map((unit) => fleetIds.includes(unit.id) ? { ...unit, status: 'assigned', assignmentId: operationId } : unit),
      airGroups: state.airGroups.map((unit) => airGroupIds.includes(unit.id) ? { ...unit, status: 'assigned', assignmentId: operationId } : unit),
      operations: [...state.operations, operation],
      commandMessages: commandMessage ? [...state.commandMessages, commandMessage].slice(-30) : state.commandMessages,
    },
    operation,
    forecast,
  };
}

export function respondToJointCommandMessage(
  state: JointForcesState,
  messageId: string,
  response: JointCommandResponse,
): { state: JointForcesState; commandCost: number; detail: string } | null {
  const message = state.commandMessages.find((item) => item.id === messageId);
  if (!message || message.status !== 'pending') return null;
  const commandCost = response === 'back' ? 3 : response === 'revise' ? 1 : 0;
  const chanceChange = response === 'back' ? 6 : response === 'revise' ? 3 : -4;
  const trustChange = response === 'back' ? 4 : response === 'revise' ? 1 : -6;
  const detail = response === 'back'
    ? `${message.commander}의 현장 재량권을 보장했습니다. 작전 성공 전망 +6, 지휘부 신뢰 +4.`
    : response === 'revise'
      ? '작전 일정을 한 주 늘리고 정찰·정비 계획을 보강했습니다. 성공 전망 +3.'
      : `원안을 강행해 지휘점수는 아꼈지만 ${message.commander}의 신뢰와 현장 대응력이 낮아졌습니다.`;
  const operation = state.operations.find((item) => item.id === message.operationId);
  return {
    state: {
      ...state,
      operations: state.operations.map((item) => item.id === message.operationId ? {
        ...item,
        successChance: clamp(item.successChance + chanceChange, 8, 96),
        maximumWeeks: response === 'revise' ? item.maximumWeeks + 1 : item.maximumWeeks,
      } : item),
      fleets: state.fleets.map((unit) => response === 'back' && unit.assignmentId === message.operationId ? { ...unit, readiness: clamp(unit.readiness - 2) } : unit),
      airGroups: state.airGroups.map((unit) => response === 'back' && unit.assignmentId === message.operationId ? { ...unit, readiness: clamp(unit.readiness - 2) } : unit),
      commandMessages: state.commandMessages.map((item) => item.id === messageId ? { ...item, status: 'resolved', response } : item),
      commandTrust: clamp(state.commandTrust + trustChange),
    },
    commandCost,
    detail: operation ? detail : `${detail} 작전은 이미 종료되어 지휘부 신뢰에만 반영됐습니다.`,
  };
}

function operationOutcome(template: JointOperationTemplate, success: boolean) {
  if (!success) return {
    result: template.kind === 'convoy-escort' ? '호송선단이 분산됐고 일부 화물이 목적지에 도달하지 못했습니다.' : '적의 대응과 정비 손실로 작전목표를 달성하지 못했습니다.',
    worldEffect: template.kind === 'strategic-bombing' ? '폭격 피해와 민간인 희생을 둘러싼 국내외 비판이 확대됩니다.' : '적이 해당 전구의 방어 교훈을 얻고 경계 태세를 강화합니다.',
  };
  const results: Record<JointOperationKind, string> = {
    'air-superiority': '전투기 집단이 전구 상공의 작전 자유를 확보했습니다.',
    'close-support': '전선 연락과 근접지원이 육상군의 돌파 속도를 높였습니다.',
    'strategic-bombing': '적 철도·산업 거점에 지속적인 피해를 주었지만 민간 피해 조사도 시작됐습니다.',
    'convoy-escort': '상선단과 병력이 목적지에 도착해 전구 보급이 안정됐습니다.',
    'submarine-raiding': '적 수송선을 분산시키고 호송 전력을 후방에서 끌어냈습니다.',
    'carrier-strike': '함재기가 적 함대와 전진기지를 타격해 해상 주도권을 넓혔습니다.',
    'amphibious-cover': '해공 엄호망이 상륙부대와 후속 보급로를 보호했습니다.',
    reconnaissance: '사진·통신·해상 접촉정보가 갱신돼 다음 작전의 불확실성이 줄었습니다.',
  };
  return { result: results[template.kind], worldEffect: template.worldEffect };
}

const counterKinds: Record<JointOperationKind, JointOperationKind[]> = {
  'air-superiority': ['air-superiority', 'reconnaissance'],
  'close-support': ['air-superiority'],
  'strategic-bombing': ['air-superiority', 'reconnaissance'],
  'convoy-escort': ['submarine-raiding', 'carrier-strike'],
  'submarine-raiding': ['convoy-escort', 'reconnaissance'],
  'carrier-strike': ['carrier-strike', 'air-superiority', 'submarine-raiding', 'reconnaissance'],
  'amphibious-cover': ['carrier-strike', 'submarine-raiding', 'air-superiority'],
  reconnaissance: ['air-superiority'],
};

export function getCounterOperationTemplateIds(enemyKind: JointOperationKind, theater: TheaterId) {
  return getAvailableJointOperationTemplates(theater)
    .filter((template) => counterKinds[enemyKind].includes(template.kind))
    .map((template) => template.id);
}

function operationCounters(actor: JointOperationKind, target: JointOperationKind) {
  return counterKinds[target].includes(actor);
}

function operationDomain(kind: JointOperationKind): JointEngagementRecord['domain'] {
  if (['air-superiority', 'close-support', 'strategic-bombing', 'reconnaissance'].includes(kind)) return 'air';
  if (['convoy-escort', 'submarine-raiding'].includes(kind)) return 'sea';
  return 'combined';
}

function averageOperationReadiness(operation: ActiveJointOperation, fleets: NavalTaskForce[], airGroups: AirGroup[]) {
  const assignedFleets = fleets.filter((unit) => operation.fleetIds.includes(unit.id));
  const assignedAir = airGroups.filter((unit) => operation.airGroupIds.includes(unit.id));
  const readiness = [
    ...assignedFleets.map((unit) => (unit.readiness + unit.organization) / 2),
    ...assignedAir.map((unit) => (unit.readiness + unit.serviceability) / 2),
  ];
  return readiness.length > 0 ? readiness.reduce((sum, value) => sum + value, 0) / readiness.length : 30;
}

function opponentMissionPriorities(nationId: NationId): string[] {
  if (nationId === 'germany') return ['wolfpack-interdiction', 'strategic-air-campaign', 'fighter-sweep', 'armed-reconnaissance'];
  if (nationId === 'japan') return ['carrier-strike', 'fighter-sweep', 'amphibious-cover', 'armed-reconnaissance'];
  if (nationId === 'usa') return ['carrier-strike', 'fighter-sweep', 'strategic-air-campaign', 'amphibious-cover'];
  if (nationId === 'britain') return ['atlantic-lifeline', 'fighter-sweep', 'strategic-air-campaign', 'armed-reconnaissance'];
  return ['fighter-sweep', 'armed-reconnaissance', 'close-air-support', 'wolfpack-interdiction'];
}

function planOpponentOperation(
  opponent: JointOpponentState,
  playerOperations: ActiveJointOperation[],
  objectives: Record<TheaterId, JointCampaignObjective[]>,
  context: JointOperationContext,
): { opponent: JointOpponentState; event: JointOperationEvent | null } {
  if (opponent.operations.length >= 2 || context.week - opponent.lastDecisionWeek < 3) return { opponent, event: null };
  const readyFleets = opponent.fleets.filter((unit) => unit.status === 'ready' && availableCount(unit.ships) > 0);
  const readyAir = opponent.airGroups.filter((unit) => unit.status === 'ready' && availableCount(unit.aircraft) > 0);
  const reactiveKinds = playerOperations.map((operation) => counterKinds[operation.kind]).flat();
  const templates = getAvailableJointOperationTemplates(context.theater)
    .filter((template) => (!template.requiredFleetKinds.length || readyFleets.some((unit) => matchesFleet(template, unit)))
      && (!template.requiredAirKinds.length || readyAir.some((unit) => matchesAir(template, unit))));
  if (!templates.length) return { opponent: { ...opponent, lastDecisionWeek: context.week }, event: null };
  const priorities = opponentMissionPriorities(opponent.nationId);
  const selected = [...templates].sort((left, right) => {
    const score = (template: JointOperationTemplate) => {
      const historical = Math.max(0, 12 - Math.max(0, priorities.indexOf(template.id)) * 3);
      const reactive = reactiveKinds.includes(template.kind) ? 9 : 0;
      const pressure = context.game.enemyPressure > 62 && ['strategic-bombing', 'carrier-strike', 'submarine-raiding'].includes(template.kind) ? 5 : 0;
      return historical + reactive + pressure + stableRoll(`${opponent.nationId}:${template.id}:${context.week}`) * 4;
    };
    return score(right) - score(left);
  })[0];
  const fleets = selected.requiredFleetKinds.length ? readyFleets.filter((unit) => matchesFleet(selected, unit)).slice(0, 1) : [];
  const airGroups = selected.requiredAirKinds.length ? readyAir.filter((unit) => matchesAir(selected, unit)).slice(0, 1) : [];
  const forceReadiness = [
    ...fleets.map((unit) => (unit.readiness + unit.organization + unit.experience) / 3),
    ...airGroups.map((unit) => (unit.readiness + unit.serviceability + unit.experience) / 3),
  ];
  const readiness = forceReadiness.reduce((sum, value) => sum + value, 0) / Math.max(1, forceReadiness.length);
  const forceStrength = getForceStrength(selected, fleets, airGroups);
  const roll = stableRoll(`enemy-plan:${opponent.nationId}:${selected.id}:${context.week}`);
  const confidence = Math.round(clamp(context.game.intelNetwork * .72 + (playerOperations.some((operation) => operation.kind === 'reconnaissance') ? 18 : 0) + roll * 22 - 8));
  const operationId = `enemy-joint-${context.week}-${selected.id}-${opponent.operations.length + opponent.records.length}`;
  const targetCandidates = objectives[context.theater].filter((objective) => objectiveKindsByOperation[selected.kind].includes(objective.kind)
    && (selected.kind === 'convoy-escort' ? objective.control <= 62
      : ['submarine-raiding', 'strategic-bombing', 'carrier-strike', 'amphibious-cover'].includes(selected.kind) ? objective.control >= 38 : true));
  const targetObjective = [...targetCandidates].sort((left, right) => {
    const score = (objective: JointCampaignObjective) => selected.kind === 'submarine-raiding' ? objective.throughput + objective.infrastructure * .3
      : selected.kind === 'strategic-bombing' ? objective.infrastructure + objective.throughput * .2
        : selected.kind === 'carrier-strike' ? objective.infrastructure + objective.control * .25
          : 100 - objective.control + objective.enemyThreat * .2;
    return score(right) - score(left);
  })[0];
  const operation: EnemyJointOperation = {
    id: operationId,
    templateId: selected.id,
    name: selected.name,
    kind: selected.kind,
    theater: context.theater,
    startedWeek: context.week,
    elapsedWeeks: 0,
    minimumWeeks: selected.minimumWeeks,
    maximumWeeks: selected.maximumWeeks,
    progress: 0,
    successChance: Math.round(clamp(25 + readiness * .43 + context.game.enemyPressure * .22 - context.game.intelNetwork * .1 - (1 - forceStrength) * 36, 1, 88)),
    initialForceStrength: forceStrength,
    objectiveId: targetObjective?.id,
    objectiveName: targetObjective?.name,
    fleetIds: fleets.map((unit) => unit.id),
    airGroupIds: airGroups.map((unit) => unit.id),
    status: 'active',
    detected: confidence >= 52,
    intelligenceConfidence: confidence,
    detectedWeek: confidence >= 52 ? context.week : null,
    target: targetObjective ? `${targetObjective.name} · ${targetObjective.region}` : selected.kind === 'submarine-raiding' ? '주요 호송로' : selected.kind === 'strategic-bombing' ? '산업·철도 거점' : selected.kind === 'carrier-strike' ? '함대·전진기지' : '전구 주도권',
  };
  const nextOpponent: JointOpponentState = {
    ...opponent,
    fleets: opponent.fleets.map((unit) => operation.fleetIds.includes(unit.id) ? { ...unit, status: 'assigned', assignmentId: operationId } : unit),
    airGroups: opponent.airGroups.map((unit) => operation.airGroupIds.includes(unit.id) ? { ...unit, status: 'assigned', assignmentId: operationId } : unit),
    operations: [...opponent.operations, operation],
    lastDecisionWeek: context.week,
  };
  return {
    opponent: nextOpponent,
    event: operation.detected ? {
      title: `적 작전 징후 포착 — ${selected.name}`,
      detail: `${opponent.name}의 ${selected.name} 준비 징후를 포착했습니다. 정보 신뢰 ${confidence}% · 예상 표적 ${operation.target}.`,
      tone: 'neutral', operationId, resolved: false, side: 'enemy',
    } : null,
  };
}

function applyOpponentSuccess(kind: JointOperationKind, gameDelta: Partial<Record<keyof GameState, number>>) {
  gameDelta.enemyPressure = (gameDelta.enemyPressure ?? 0) + (kind === 'reconnaissance' ? 1 : 3);
  if (kind === 'strategic-bombing') {
    gameDelta.factories = (gameDelta.factories ?? 0) - 1;
    gameDelta.stability = (gameDelta.stability ?? 0) - 1;
    gameDelta.airPower = (gameDelta.airPower ?? 0) - 1;
  } else if (kind === 'submarine-raiding') {
    gameDelta.fuel = (gameDelta.fuel ?? 0) - 6;
    gameDelta.navalPower = (gameDelta.navalPower ?? 0) - 2;
  } else if (kind === 'carrier-strike') {
    gameDelta.navalPower = (gameDelta.navalPower ?? 0) - 3;
    gameDelta.airPower = (gameDelta.airPower ?? 0) - 1;
  } else if (kind === 'air-superiority') {
    gameDelta.airPower = (gameDelta.airPower ?? 0) - 3;
  } else if (kind === 'reconnaissance') {
    gameDelta.intelNetwork = (gameDelta.intelNetwork ?? 0) - 3;
  } else {
    gameDelta.victoryScore = (gameDelta.victoryScore ?? 0) - 3;
    gameDelta.warSupport = (gameDelta.warSupport ?? 0) - 1;
  }
}

function applyCampaignObjectiveOutcome(
  objectives: Record<TheaterId, JointCampaignObjective[]>,
  operation: ActiveJointOperation,
  success: boolean,
  side: 'player' | 'enemy',
  week: number,
  forceStrength: number,
): { objectives: Record<TheaterId, JointCampaignObjective[]>; changes: string[] } {
  if (!operation.objectiveId || forceStrength <= 0) return { objectives, changes: [] };
  const direction = side === 'player' ? 1 : -1;
  const effective = (success ? 1 : .2) * forceStrength;
  const delta = { control: 0, infrastructure: 0, throughput: 0, enemyThreat: 0, damage: 0, civilianRisk: 0 };
  if (operation.kind === 'convoy-escort') Object.assign(delta, { control: 6 * direction, infrastructure: 3, throughput: 12, enemyThreat: -10 * direction, damage: -4 });
  else if (operation.kind === 'submarine-raiding') Object.assign(delta, { control: 5 * direction, infrastructure: -3, throughput: -14, enemyThreat: -8 * direction, damage: 7 });
  else if (operation.kind === 'air-superiority') Object.assign(delta, { control: 11 * direction, throughput: 3 * direction, enemyThreat: -9 * direction, damage: side === 'player' ? 2 : 4 });
  else if (operation.kind === 'close-support') Object.assign(delta, { control: 8 * direction, infrastructure: -3, throughput: -4, enemyThreat: -5 * direction, damage: 5, civilianRisk: 3 });
  else if (operation.kind === 'strategic-bombing') Object.assign(delta, { control: 4 * direction, infrastructure: -15, throughput: -10, enemyThreat: -4 * direction, damage: 18, civilianRisk: 9 });
  else if (operation.kind === 'carrier-strike') Object.assign(delta, { control: 10 * direction, infrastructure: -10, throughput: -7, enemyThreat: -7 * direction, damage: 14, civilianRisk: 4 });
  else if (operation.kind === 'amphibious-cover') Object.assign(delta, { control: 16 * direction, infrastructure: -5, throughput: 6 * direction, enemyThreat: -8 * direction, damage: 7, civilianRisk: 5 });
  else Object.assign(delta, { control: 4 * direction, enemyThreat: -10 * direction, damage: -1 });
  const adjusted = Object.fromEntries(Object.entries(delta).map(([key, value]) => [key, Math.round(value * effective)])) as typeof delta;
  let changes: string[] = [];
  const theaterObjectives = objectives[operation.theater].map((objective) => {
    if (objective.id !== operation.objectiveId) return objective;
    const next = {
      ...objective,
      control: clamp(objective.control + adjusted.control),
      infrastructure: clamp(objective.infrastructure + adjusted.infrastructure),
      throughput: clamp(objective.throughput + adjusted.throughput),
      enemyThreat: clamp(objective.enemyThreat + adjusted.enemyThreat),
      damage: clamp(objective.damage + adjusted.damage),
      civilianRisk: clamp(objective.civilianRisk + adjusted.civilianRisk),
      lastChangedWeek: week,
      lastResult: `${side === 'player' ? '우리' : '적'} ${operation.name} ${success ? '성과' : '좌절'}: ${operation.objectiveName ?? objective.name} 전역 지표가 변했습니다.`,
    };
    const describe = (label: string, value: number) => `${label} ${value >= 0 ? '+' : ''}${value}`;
    changes = [
      adjusted.control ? describe('통제', adjusted.control) : '',
      adjusted.throughput ? describe('수송', adjusted.throughput) : '',
      adjusted.infrastructure ? describe('기반시설', adjusted.infrastructure) : '',
      adjusted.damage ? describe('누적피해', adjusted.damage) : '',
      adjusted.civilianRisk ? describe('민간위험', adjusted.civilianRisk) : '',
    ].filter(Boolean);
    return next;
  });
  return { objectives: { ...objectives, [operation.theater]: theaterObjectives }, changes };
}

export function advanceJointOperationsWeek(state: JointForcesState, context: JointOperationContext): JointWeekResult {
  let aircraftDelta = 0;
  let convoyDelta = 0;
  const gameDelta: Partial<Record<keyof GameState, number>> = {};
  const events: JointOperationEvent[] = [];
  const completedIds = new Set<string>();
  const completedEnemyIds = new Set<string>();
  const records: JointOperationRecord[] = [];
  const enemyRecords: JointOperationRecord[] = [];
  const newEngagements: JointEngagementRecord[] = [];
  const playerAirLosses = new Map<string, number>();
  const playerShipLosses = new Map<string, number>();
  const enemyAirLosses = new Map<string, number>();
  const enemyShipLosses = new Map<string, number>();
  let airShift = 0;
  let seaShift = 0;
  let intelShift = 0;

  const planned = planOpponentOperation(state.opponent, state.operations, state.objectives, context);
  let opponent = planned.opponent;
  if (planned.event) events.push(planned.event);
  const reconActive = state.operations.some((operation) => operation.kind === 'reconnaissance' && operation.theater === context.theater);
  opponent = {
    ...opponent,
    operations: opponent.operations.map((operation) => {
      if (operation.detected) return { ...operation, intelligenceConfidence: clamp(operation.intelligenceConfidence + (reconActive ? 7 : 2)) };
      const gain = Math.round(context.game.intelNetwork * .08 + (reconActive ? 16 : 2));
      const confidence = clamp(operation.intelligenceConfidence + gain);
      if (confidence >= 52) {
        events.push({
          title: `정보 융합 완료 — ${operation.name}`,
          detail: `${opponent.name}의 작전 준비를 정찰사진·감청·접촉보고로 확인했습니다. 신뢰 ${Math.round(confidence)}%.`,
          tone: 'good', operationId: operation.id, resolved: false, side: 'enemy',
        });
        return { ...operation, detected: true, detectedWeek: context.week, intelligenceConfidence: confidence };
      }
      return { ...operation, intelligenceConfidence: confidence };
    }),
  };

  const engagementEffect = new Map<string, number>();
  const enemyEngagementEffect = new Map<string, number>();
  const forcedDetection = new Set<string>();
  state.operations.forEach((playerOperation) => {
    const playerStrength = getOperationStrength(playerOperation, state.fleets, state.airGroups);
    if (playerStrength <= 0) return;
    const candidates = opponent.operations.filter((enemyOperation) => enemyOperation.theater === playerOperation.theater
      && getOperationStrength(enemyOperation, opponent.fleets, opponent.airGroups) > 0
      && (!playerOperation.objectiveId || !enemyOperation.objectiveId || playerOperation.objectiveId === enemyOperation.objectiveId)
      && (operationCounters(playerOperation.kind, enemyOperation.kind) || operationCounters(enemyOperation.kind, playerOperation.kind)));
    if (!candidates.length) return;
    const enemyOperation = [...candidates].sort((left, right) => right.progress - left.progress)[0];
    const playerCounter = operationCounters(playerOperation.kind, enemyOperation.kind) ? 14 : 0;
    const enemyCounter = operationCounters(enemyOperation.kind, playerOperation.kind) ? 14 : 0;
    const enemyStrength = getOperationStrength(enemyOperation, opponent.fleets, opponent.airGroups);
    const edge = currentOperationChance(playerOperation, playerStrength) - currentOperationChance(enemyOperation, enemyStrength) + playerCounter - enemyCounter + (context.game.intelNetwork - 50) * .14;
    const advantage: JointEngagementRecord['advantage'] = edge > 8 ? 'player' : edge < -8 ? 'enemy' : 'contested';
    const playerEffect = advantage === 'player' ? 5 : advantage === 'enemy' ? -5 : -1;
    engagementEffect.set(playerOperation.id, (engagementEffect.get(playerOperation.id) ?? 0) + playerEffect);
    enemyEngagementEffect.set(enemyOperation.id, (enemyEngagementEffect.get(enemyOperation.id) ?? 0) - playerEffect);
    forcedDetection.add(enemyOperation.id);
    const engagementId = `engagement-${playerOperation.id}-${enemyOperation.id}`;
    if (state.engagements.some((item) => item.id === engagementId)) return;
    const domain = operationDomain(enemyOperation.kind) === operationDomain(playerOperation.kind) ? operationDomain(playerOperation.kind) : 'combined';
    const playerAircraft = state.airGroups.filter((unit) => playerOperation.airGroupIds.includes(unit.id)).reduce((sum, unit) => sum + availableCount(unit.aircraft), 0);
    const enemyAircraft = Math.max(0, opponent.airGroups.filter((unit) => enemyOperation.airGroupIds.includes(unit.id)).reduce((sum, unit) => sum + availableCount(unit.aircraft), 0) - (enemyAirLosses.get(enemyOperation.id) ?? 0));
    const playerShips = state.fleets.filter((unit) => playerOperation.fleetIds.includes(unit.id)).reduce((sum, unit) => sum + availableCount(unit.ships), 0);
    const enemyShips = Math.max(0, opponent.fleets.filter((unit) => enemyOperation.fleetIds.includes(unit.id)).reduce((sum, unit) => sum + availableCount(unit.ships), 0) - (enemyShipLosses.get(enemyOperation.id) ?? 0));
    const playerAirLoss = Math.min(playerAircraft, domain !== 'sea' ? (advantage === 'enemy' ? 4 : advantage === 'contested' ? 2 : 1) : 0);
    const enemyAirLoss = Math.min(enemyAircraft, domain !== 'sea' ? (advantage === 'player' ? 4 : advantage === 'contested' ? 2 : 1) : 0);
    const playerShipLoss = Math.min(playerShips, domain !== 'air' ? (advantage === 'enemy' ? 2 : advantage === 'contested' ? 1 : 0) : 0);
    const enemyShipLoss = Math.min(enemyShips, domain !== 'air' ? (advantage === 'player' ? 2 : advantage === 'contested' ? 1 : 0) : 0);
    playerAirLosses.set(playerOperation.id, playerAirLoss);
    enemyAirLosses.set(enemyOperation.id, (enemyAirLosses.get(enemyOperation.id) ?? 0) + enemyAirLoss);
    playerShipLosses.set(playerOperation.id, playerShipLoss);
    enemyShipLosses.set(enemyOperation.id, (enemyShipLosses.get(enemyOperation.id) ?? 0) + enemyShipLoss);
    aircraftDelta -= playerAirLoss;
    if (enemyOperation.kind === 'submarine-raiding' && advantage !== 'player') convoyDelta -= advantage === 'enemy' ? 3 : 1;
    const engagement: JointEngagementRecord = {
      id: engagementId,
      week: context.week,
      theater: playerOperation.theater,
      playerOperationId: playerOperation.id,
      enemyOperationId: enemyOperation.id,
      title: domain === 'air' ? '전구 항공요격전' : domain === 'sea' ? '호송로 접촉전' : '해공 합동 교전',
      domain,
      advantage,
      summary: advantage === 'player' ? `${playerOperation.name} 작전이 적 ${enemyOperation.name}의 작전 주기를 끊었습니다.`
        : advantage === 'enemy' ? `적 ${enemyOperation.name} 작전이 우리 ${playerOperation.name}의 진척을 지연시켰습니다.`
          : '양측이 접촉했지만 결정적인 우세 없이 탐색·요격을 반복하고 있습니다.',
      playerLosses: `${playerAirLoss ? `항공기 ${playerAirLoss}대` : '항공기 0대'} · ${playerShipLoss ? `함정 ${playerShipLoss}척` : '함정 0척'}`,
      enemyLosses: `${enemyAirLoss ? `항공기 ${enemyAirLoss}대` : '항공기 0대'} · ${enemyShipLoss ? `함정 ${enemyShipLoss}척` : '함정 0척'}`,
    };
    newEngagements.push(engagement);
    airShift += domain !== 'sea' ? (advantage === 'player' ? 2 : advantage === 'enemy' ? -2 : 0) : 0;
    seaShift += domain !== 'air' ? (advantage === 'player' ? 2 : advantage === 'enemy' ? -2 : 0) : 0;
    events.push({
      title: `${engagement.title} — ${advantage === 'player' ? '우세' : advantage === 'enemy' ? '열세' : '백중세'}`,
      detail: `${engagement.summary} 우리 손실 ${engagement.playerLosses} · 확인된 적 손실 ${engagement.enemyLosses}.`,
      tone: advantage === 'player' ? 'good' : advantage === 'enemy' ? 'bad' : 'neutral',
      operationId: playerOperation.id, resolved: false, side: 'engagement',
    });
  });
  if (forcedDetection.size) {
    opponent = { ...opponent, operations: opponent.operations.map((operation) => forcedDetection.has(operation.id)
      ? { ...operation, detected: true, detectedWeek: operation.detectedWeek ?? context.week, intelligenceConfidence: Math.max(76, operation.intelligenceConfidence) }
      : operation) };
  }

  const engagementFleetLosses = distributeFormationLosses(state.fleets, playerShipLosses, (unit) => unit.ships);
  const engagementAirLosses = distributeFormationLosses(state.airGroups, playerAirLosses, (unit) => unit.aircraft);
  const engagedFleets = state.fleets.map((unit) => ({ ...unit, ships: availableCount(unit.ships) - (engagementFleetLosses.get(unit.id) ?? 0) }));
  const engagedAirGroups = state.airGroups.map((unit) => ({ ...unit, aircraft: availableCount(unit.aircraft) - (engagementAirLosses.get(unit.id) ?? 0) }));
  const engagementEnemyFleetLosses = distributeFormationLosses(opponent.fleets, enemyShipLosses, (unit) => unit.ships);
  const engagementEnemyAirLosses = distributeFormationLosses(opponent.airGroups, enemyAirLosses, (unit) => unit.aircraft);
  const engagedEnemyFleets = opponent.fleets.map((unit) => ({ ...unit, ships: availableCount(unit.ships) - (engagementEnemyFleetLosses.get(unit.id) ?? 0) }));
  const engagedEnemyAirGroups = opponent.airGroups.map((unit) => ({ ...unit, aircraft: availableCount(unit.aircraft) - (engagementEnemyAirLosses.get(unit.id) ?? 0) }));

  const nextOperations = state.operations.map((operation) => {
    const template = jointOperationTemplates.find((item) => item.id === operation.templateId);
    if (!template) return operation;
    const fleets = engagedFleets.filter((unit) => operation.fleetIds.includes(unit.id));
    const airGroups = engagedAirGroups.filter((unit) => operation.airGroupIds.includes(unit.id));
    const averageReadiness = averageOperationReadiness(operation, state.fleets, state.airGroups);
    const forceStrength = getForceStrength(template, fleets, airGroups);
    const effectiveChance = currentOperationChance(operation, forceStrength);
    const roll = stableRoll(`${state.nationId}:${operation.id}:${context.week}`);
    const progressGain = Math.round(clamp(7 + averageReadiness * 0.11 + effectiveChance * 0.07 + (engagementEffect.get(operation.id) ?? 0) + (roll - 0.5) * 14, 2, 27) * forceStrength);
    const elapsedWeeks = operation.elapsedWeeks + 1;
    const progress = clamp(operation.progress + progressGain, 0, 120);
    const canResolve = elapsedWeeks >= operation.minimumWeeks && progress >= 100;
    const forcedResolution = elapsedWeeks >= operation.maximumWeeks || forceStrength <= 0;
    if (!canResolve && !forcedResolution) {
      if (elapsedWeeks === 1 || elapsedWeeks === Math.ceil(operation.maximumWeeks / 2)) {
        events.push({
          title: `${operation.name} — ${elapsedWeeks}주차`,
          detail: `${operation.objectiveName ? `${operation.objectiveName} · ` : ''}작전 진척 ${Math.round(progress)}% · 투입 전력 가동률 ${Math.round(averageReadiness)}% · 실제 전력 충족률 ${Math.round(forceStrength * 100)}%. 아직 결과는 확정되지 않았습니다.`,
          tone: progressGain >= 14 ? 'good' : progressGain <= 8 ? 'bad' : 'neutral', operationId: operation.id, resolved: false,
        });
      }
      return { ...operation, elapsedWeeks, progress };
    }

    const successThreshold = effectiveChance + Math.min(12, progress - 90) - (forcedResolution && progress < 100 ? 14 : 0);
    const success = forceStrength > 0 && roll * 100 <= successThreshold;
    const lossScale = state.doctrine === 'protection' ? 0.75 : state.doctrine === 'concentration' ? 1.12 : 1;
    const availableAircraft = airGroups.reduce((sum, unit) => sum + availableCount(unit.aircraft), 0);
    const aircraftLoss = Math.min(availableAircraft, airGroups.length > 0 ? Math.max(1, Math.round((success ? 4 : 12) * airGroups.length * lossScale)) : 0);
    const convoyLoss = template.convoyCost > 0 ? Math.max(1, Math.round((success ? 3 : 11) * lossScale)) : 0;
    aircraftDelta -= aircraftLoss;
    convoyDelta -= convoyLoss;
    playerAirLosses.set(operation.id, (playerAirLosses.get(operation.id) ?? 0) + aircraftLoss);
    if (success) {
      gameDelta.victoryScore = (gameDelta.victoryScore ?? 0) + Math.round((template.kind === 'reconnaissance' ? 1 : 3) * forceStrength);
      gameDelta.enemyPressure = (gameDelta.enemyPressure ?? 0) - Math.round((template.kind === 'strategic-bombing' || template.kind === 'submarine-raiding' ? 4 : 2) * forceStrength);
      if (['air-superiority', 'close-support', 'strategic-bombing', 'reconnaissance'].includes(template.kind)) gameDelta.airPower = (gameDelta.airPower ?? 0) + Math.round(2 * forceStrength);
      if (['convoy-escort', 'submarine-raiding', 'carrier-strike', 'amphibious-cover'].includes(template.kind)) gameDelta.navalPower = (gameDelta.navalPower ?? 0) + Math.round(2 * forceStrength);
      if (template.kind === 'reconnaissance') gameDelta.intelNetwork = (gameDelta.intelNetwork ?? 0) + Math.round(4 * forceStrength);
      if (['air-superiority', 'close-support', 'strategic-bombing', 'reconnaissance'].includes(template.kind)) airShift += Math.round(4 * forceStrength);
      if (['convoy-escort', 'submarine-raiding', 'carrier-strike', 'amphibious-cover'].includes(template.kind)) seaShift += Math.round(4 * forceStrength);
      if (template.kind === 'reconnaissance') intelShift += Math.round(6 * forceStrength);
    } else {
      gameDelta.warSupport = (gameDelta.warSupport ?? 0) - 2;
      gameDelta.enemyPressure = (gameDelta.enemyPressure ?? 0) + 2;
      if (operationDomain(template.kind) !== 'sea') airShift -= 2;
      if (operationDomain(template.kind) !== 'air') seaShift -= 2;
    }
    const targetObjective = state.objectives[operation.theater].find((objective) => objective.id === operation.objectiveId);
    const exposesCivilians = forceStrength > 0 && targetObjective
      && ['strategic-bombing', 'carrier-strike', 'close-support'].includes(template.kind)
      && targetObjective.civilianRisk >= 60;
    if (exposesCivilians) {
      const legitimacyCost = template.kind === 'strategic-bombing' && success ? 2 : 1;
      gameDelta.warSupport = (gameDelta.warSupport ?? 0) - legitimacyCost;
      if (template.kind === 'strategic-bombing' && success) gameDelta.stability = (gameDelta.stability ?? 0) - 1;
      events.push({
        title: `민간 피해 조사 개시 — ${targetObjective.name}`,
        detail: `민간 노출 ${Math.round(targetObjective.civilianRisk)}의 표적에 ${template.name}이 집행됐습니다. 군사 성과와 별도로 사상자 추계·지휘책임·전후 배상 논쟁이 세계선에 남습니다.`,
        tone: 'bad',
        operationId: operation.id,
        resolved: false,
        side: 'player',
      });
    }
    const outcome = operationOutcome(template, success);
    const losses = `${aircraftLoss > 0 ? `항공기 ${aircraftLoss}대` : '항공기 손실 없음'} · ${convoyLoss > 0 ? `수송선 ${convoyLoss}척` : '수송선 손실 없음'}`;
    const record: JointOperationRecord = {
      id: `record-${operation.id}`,
      templateId: operation.templateId,
      name: operation.name,
      theater: operation.theater,
      startedWeek: operation.startedWeek,
      endedWeek: context.week,
      outcome: success ? 'success' : 'setback',
      finalForceStrength: forceStrength,
      losses,
      result: outcome.result,
      worldEffect: outcome.worldEffect,
      objectiveId: operation.objectiveId,
      objectiveName: operation.objectiveName,
    };
    records.push(record);
    completedIds.add(operation.id);
    events.push({
      title: `${success ? '합동작전 성공' : '합동작전 좌절'} — ${operation.name}`,
      detail: `${operation.objectiveName ? `${operation.objectiveName}에서 ` : ''}${elapsedWeeks}주간의 작전이 종료됐습니다. ${outcome.result} ${losses}.`,
      tone: success ? 'good' : 'bad', operationId: operation.id, resolved: true, worldEffect: outcome.worldEffect,
      side: 'player',
    });
    return { ...operation, elapsedWeeks, progress };
  }).filter((operation) => !completedIds.has(operation.id));

  const nextEnemyOperations = opponent.operations.map((operation) => {
    const template = jointOperationTemplates.find((item) => item.id === operation.templateId);
    if (!template) return operation;
    const averageReadiness = averageOperationReadiness(operation, opponent.fleets, opponent.airGroups);
    const forceStrength = getOperationStrength(operation, engagedEnemyFleets, engagedEnemyAirGroups);
    const effectiveChance = currentOperationChance(operation, forceStrength);
    const roll = stableRoll(`${opponent.nationId}:${operation.id}:${context.week}`);
    const progressGain = Math.round(clamp(7 + averageReadiness * .1 + effectiveChance * .07 + (enemyEngagementEffect.get(operation.id) ?? 0) + (roll - .5) * 13, 2, 26) * forceStrength);
    const elapsedWeeks = operation.elapsedWeeks + 1;
    const progress = clamp(operation.progress + progressGain, 0, 120);
    const canResolve = elapsedWeeks >= operation.minimumWeeks && progress >= 100;
    const forcedResolution = elapsedWeeks >= operation.maximumWeeks || forceStrength <= 0;
    if (!canResolve && !forcedResolution) return { ...operation, elapsedWeeks, progress };
    const successThreshold = effectiveChance + Math.min(10, progress - 90) - (forcedResolution && progress < 100 ? 14 : 0);
    const success = forceStrength > 0 && roll * 100 <= successThreshold;
    if (success) {
      const opponentDelta: Partial<Record<keyof GameState, number>> = {};
      applyOpponentSuccess(template.kind, opponentDelta);
      for (const key of Object.keys(opponentDelta) as Array<keyof GameState>) gameDelta[key] = (gameDelta[key] ?? 0) + Math.round((opponentDelta[key] ?? 0) * forceStrength);
      if (template.kind === 'submarine-raiding') convoyDelta -= Math.round(8 * forceStrength);
      if (['strategic-bombing', 'carrier-strike', 'air-superiority', 'close-support'].includes(template.kind)) aircraftDelta -= Math.round(3 * forceStrength);
      if (operationDomain(template.kind) !== 'sea') airShift -= Math.round(4 * forceStrength);
      if (operationDomain(template.kind) !== 'air') seaShift -= Math.round(4 * forceStrength);
      if (template.kind === 'reconnaissance') intelShift -= Math.round(5 * forceStrength);
    } else {
      gameDelta.victoryScore = (gameDelta.victoryScore ?? 0) + 1;
      gameDelta.enemyPressure = (gameDelta.enemyPressure ?? 0) - 1;
      if (operationDomain(template.kind) !== 'sea') airShift += 2;
      if (operationDomain(template.kind) !== 'air') seaShift += 2;
    }
    const outcome = operationOutcome(template, success);
    const record: JointOperationRecord = {
      id: `record-${operation.id}`,
      templateId: operation.templateId,
      name: operation.name,
      theater: operation.theater,
      startedWeek: operation.startedWeek,
      endedWeek: context.week,
      outcome: success ? 'success' : 'setback',
      finalForceStrength: forceStrength,
      losses: success ? '작전 피해가 우리 전구 자산에 반영됨' : '우리 요격·방어로 적 전력 손실 확인',
      result: outcome.result,
      worldEffect: outcome.worldEffect,
      objectiveId: operation.objectiveId,
      objectiveName: operation.objectiveName,
    };
    enemyRecords.push(record);
    completedEnemyIds.add(operation.id);
    events.push({
      title: `${opponent.name} ${success ? '작전 타격' : '작전 저지'} — ${operation.name}`,
      detail: success ? `적 작전이 ${operation.objectiveName ?? operation.target}에 도달했습니다. ${template.kind === 'submarine-raiding' ? '수송선과 연료 흐름이 훼손됐습니다.' : outcome.result}` : `우리 요격·방어망이 ${operation.objectiveName ? `${operation.objectiveName}에서 ` : ''}${elapsedWeeks}주간 이어진 적 작전을 무력화했습니다.`,
      tone: success ? 'bad' : 'good', operationId: operation.id, resolved: true, worldEffect: outcome.worldEffect, side: 'enemy',
    });
    return { ...operation, elapsedWeeks, progress, detected: true, detectedWeek: operation.detectedWeek ?? context.week };
  }).filter((operation) => !completedEnemyIds.has(operation.id));

  let nextObjectives = state.objectives;
  const resolvedRecords = records.map((record) => {
    const operation = state.operations.find((item) => item.id === record.id.replace('record-', ''));
    if (!operation) return record;
    const applied = applyCampaignObjectiveOutcome(nextObjectives, operation, record.outcome === 'success', 'player', context.week, getOperationStrength(operation, engagedFleets, engagedAirGroups));
    nextObjectives = applied.objectives;
    return { ...record, campaignChanges: applied.changes };
  });
  const resolvedEnemyRecords = enemyRecords.map((record) => {
    const operation = opponent.operations.find((item) => item.id === record.id.replace('record-', ''));
    if (!operation) return record;
    const applied = applyCampaignObjectiveOutcome(nextObjectives, operation, record.outcome === 'success', 'enemy', context.week, getOperationStrength(operation, engagedEnemyFleets, engagedEnemyAirGroups));
    nextObjectives = applied.objectives;
    return { ...record, campaignChanges: applied.changes };
  });

  const activeFleetIds = new Set(nextOperations.flatMap((operation) => operation.fleetIds));
  const activeAirIds = new Set(nextOperations.flatMap((operation) => operation.airGroupIds));
  const finalAirLosses = distributeFormationLosses(state.airGroups, playerAirLosses, (unit) => unit.aircraft);
  const nextFleets = state.fleets.map((unit) => {
    const wasCompleted = unit.assignmentId ? completedIds.has(unit.assignmentId) : false;
    const shipLoss = engagementFleetLosses.get(unit.id) ?? 0;
    if (activeFleetIds.has(unit.id)) return { ...unit, ships: Math.max(0, unit.ships - shipLoss), readiness: clamp(unit.readiness - 2), organization: clamp(unit.organization - 1) };
    const nextReadiness = clamp(unit.readiness + (unit.status === 'refit' ? 7 : wasCompleted ? -4 : 2));
    return {
      ...unit,
      ships: Math.max(0, unit.ships - shipLoss),
      readiness: nextReadiness,
      organization: clamp(unit.organization + (unit.status === 'refit' ? 6 : 2)),
      status: unit.status === 'refit' && nextReadiness < 95 ? 'refit' as const : 'ready' as const,
      assignmentId: null,
    };
  });
  const nextAirGroups = state.airGroups.map((unit) => {
    const wasCompleted = unit.assignmentId ? completedIds.has(unit.assignmentId) : false;
    const unitLoss = finalAirLosses.get(unit.id) ?? 0;
    if (activeAirIds.has(unit.id)) return { ...unit, aircraft: Math.max(0, unit.aircraft - unitLoss), readiness: clamp(unit.readiness - 3), serviceability: clamp(unit.serviceability - 2) };
    const nextServiceability = clamp(unit.serviceability + (unit.status === 'refit' ? 7 : 2));
    return {
      ...unit,
      aircraft: Math.max(0, unit.aircraft - unitLoss),
      readiness: clamp(unit.readiness + (unit.status === 'refit' ? 8 : wasCompleted ? -5 : 2)),
      serviceability: nextServiceability,
      status: unit.status === 'refit' && nextServiceability < 95 ? 'refit' as const : 'ready' as const,
      assignmentId: null,
    };
  });
  const activeEnemyFleetIds = new Set(nextEnemyOperations.flatMap((operation) => operation.fleetIds));
  const activeEnemyAirIds = new Set(nextEnemyOperations.flatMap((operation) => operation.airGroupIds));
  const nextEnemyFleets = opponent.fleets.map((unit) => {
    const completed = unit.assignmentId ? completedEnemyIds.has(unit.assignmentId) : false;
    const loss = engagementEnemyFleetLosses.get(unit.id) ?? 0;
    if (activeEnemyFleetIds.has(unit.id)) return { ...unit, ships: Math.max(0, unit.ships - loss), readiness: clamp(unit.readiness - 2), organization: clamp(unit.organization - 1) };
    return { ...unit, ships: Math.max(0, unit.ships - loss), readiness: clamp(unit.readiness + (completed ? -4 : 2)), organization: clamp(unit.organization + 2), status: 'ready' as const, assignmentId: null };
  });
  const nextEnemyAir = opponent.airGroups.map((unit) => {
    const completed = unit.assignmentId ? completedEnemyIds.has(unit.assignmentId) : false;
    const loss = engagementEnemyAirLosses.get(unit.id) ?? 0;
    if (activeEnemyAirIds.has(unit.id)) return { ...unit, aircraft: Math.max(0, unit.aircraft - loss), readiness: clamp(unit.readiness - 3), serviceability: clamp(unit.serviceability - 2) };
    return { ...unit, aircraft: Math.max(0, unit.aircraft - loss), readiness: clamp(unit.readiness + (completed ? -5 : 2)), serviceability: clamp(unit.serviceability + 2), status: 'ready' as const, assignmentId: null };
  });
  const currentControl = state.theaterControl[context.theater];
  const controlChange = airShift + seaShift + intelShift;
  const nextControl: TheaterControlSnapshot = {
    air: clamp(currentControl.air + airShift),
    sea: clamp(currentControl.sea + seaShift),
    intelligence: clamp(currentControl.intelligence + intelShift + (reconActive ? 1 : 0)),
    trend: controlChange > 0 ? 1 : controlChange < 0 ? -1 : 0,
    lastChangedWeek: controlChange !== 0 ? context.week : currentControl.lastChangedWeek,
  };
  const afterActionMessages: JointCommandMessage[] = resolvedRecords.map((record) => {
    const operation = state.operations.find((item) => item.id === record.id.replace('record-', ''));
    const lead = state.fleets.find((unit) => operation?.fleetIds.includes(unit.id)) ?? state.airGroups.find((unit) => operation?.airGroupIds.includes(unit.id));
    return {
      id: `report-${record.id}`,
      week: context.week,
      operationId: operation?.id ?? record.id,
      commander: lead?.commander ?? '합동참모본부',
      office: lead ? `${lead.name} 지휘부` : '합동참모본부',
      subject: record.outcome === 'success' ? '작전 종료·전과 보고' : '작전 좌절·책임 평가',
      body: record.outcome === 'success' ? `${record.result} 지휘관은 현재 편제를 재정비한 뒤 후속 작전을 제안했습니다.` : `${record.result} 지휘관은 정보·편제·상부 명령 가운데 실패 원인을 규명해 달라고 요청했습니다.`,
      status: 'resolved' as const,
      response: 'report' as const,
    };
  });
  const closedCommandMessages = state.commandMessages.map((message) => completedIds.has(message.operationId) && message.status === 'pending'
    ? { ...message, status: 'resolved' as const, response: 'report' as const }
    : message);
  return {
    state: {
      ...state,
      fleets: nextFleets,
      airGroups: nextAirGroups,
      operations: nextOperations,
      records: [...state.records, ...resolvedRecords].slice(-40),
      opponent: {
        ...opponent,
        fleets: nextEnemyFleets,
        airGroups: nextEnemyAir,
        operations: nextEnemyOperations,
        records: [...opponent.records, ...resolvedEnemyRecords].slice(-40),
      },
      engagements: [...state.engagements, ...newEngagements].slice(-60),
      commandMessages: [...closedCommandMessages, ...afterActionMessages].slice(-30),
      theaterControl: { ...state.theaterControl, [context.theater]: nextControl },
      objectives: nextObjectives,
    },
    gameDelta,
    aircraftDelta,
    convoyDelta,
    events,
  };
}

export function setJointDoctrine(state: JointForcesState, doctrine: JointDoctrine) {
  if (state.doctrine === doctrine) return state;
  return { ...state, doctrine };
}

export function sendJointForceToRefit(state: JointForcesState, forceId: string): JointForcesState {
  const fleet = state.fleets.find((unit) => unit.id === forceId);
  const air = state.airGroups.find((unit) => unit.id === forceId);
  if ((!fleet && !air) || fleet?.status === 'assigned' || air?.status === 'assigned') return state;
  return {
    ...state,
    fleets: state.fleets.map((unit) => unit.id === forceId ? { ...unit, status: unit.status === 'refit' ? 'ready' : 'refit' } : unit),
    airGroups: state.airGroups.map((unit) => unit.id === forceId ? { ...unit, status: unit.status === 'refit' ? 'ready' : 'refit' } : unit),
  };
}
