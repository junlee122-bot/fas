import type { CareerRole, NationId, StaffDepartment } from './types';

export type SagaDomain = 'war' | 'diplomacy' | 'economy' | 'science' | 'society' | 'health' | 'environment' | 'intelligence';
export type SagaApproachId = 'command' | 'coalition' | 'innovation';
export type SagaOutcome = 'transformative' | 'contested' | 'costly';

export interface SagaActDefinition {
  title: string;
  question: string;
  completion: string;
}

export interface StrategicSagaDefinition {
  id: string;
  title: string;
  shortTitle: string;
  era: string;
  domain: SagaDomain;
  earliestYear: number;
  latestYear: number;
  phases: Array<'war' | 'nation'>;
  preferredDepartments: StaffDepartment[];
  premise: string;
  historicalPattern: string;
  stakes: string;
  legacy: string;
  acts: [SagaActDefinition, SagaActDefinition, SagaActDefinition, SagaActDefinition];
}

export interface SagaChampion {
  id: string;
  name: string;
  department: StaffDepartment;
  ability: number;
  loyalty: number;
}

export interface SagaTurningPoint {
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface ActiveStrategicSaga {
  id: string;
  definitionId: string;
  startedWeek: number;
  actIndex: 0 | 1 | 2 | 3;
  progress: number;
  pressure: number;
  momentum: number;
  deadlineWeek: number;
  approachId: SagaApproachId | null;
  champion: SagaChampion;
  reserveCommitted: boolean;
  setbacks: number;
  scars: string[];
  turningPoints: SagaTurningPoint[];
}

export interface SagaHistoryRecord {
  id: string;
  definitionId: string;
  title: string;
  startedWeek: number;
  resolvedWeek: number;
  outcome: SagaOutcome;
  championName: string;
  summary: string;
  scars: string[];
  turningPoints: SagaTurningPoint[];
}

export interface StrategicSagaState {
  version: 1;
  offers: string[];
  active: ActiveStrategicSaga | null;
  history: SagaHistoryRecord[];
  nextOfferWeek: number;
  legacyMarks: number;
  institutionalMemory: string[];
  lastUpdatedWeek: number;
}

export interface StrategicSagaContext {
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
  intelNetwork: number;
  legitimacy: number;
  unrest: number;
  education: number;
  civilianIndustry: number;
  institutionalCapacity: number;
  relativeCompetitiveness: number;
  relationAverage: number;
  publicConfidence: number;
  inflation: number;
  completedResearch: number;
  publicHealthPressure: number;
  coalitionSupport: number;
  promiseReliability: number;
}

export interface SagaEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  cause: string;
  consequence: string;
}

export interface SagaActionResult {
  state: StrategicSagaState;
  title: string;
  detail: string;
  politicalPowerDelta: number;
  treasuryDelta: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  publicConfidenceDelta: number;
}

export interface SagaWeeklyResult {
  state: StrategicSagaState;
  events: SagaEvent[];
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  unrest: number;
  publicConfidence: number;
  requiresDecision: boolean;
}

export interface SagaApproachPreview {
  id: SagaApproachId;
  name: string;
  doctrine: string;
  forecast: string;
  politicalCost: number;
  treasuryCost: number;
  capability: number;
  weeklyProgress: number;
  weeklyPressure: number;
  strengths: string;
  risk: string;
}

const act = (title: string, question: string, completion: string): SagaActDefinition => ({ title, question, completion });

export const strategicSagaDefinitions: StrategicSagaDefinition[] = [
  {
    id: 'arsenal-lifeline', title: '생존의 동맥과 연합 군수망', shortTitle: '연합 군수망', era: '총력전과 재건', domain: 'war', earliestYear: 1942, latestYear: 1965, phases: ['war', 'nation'], preferredDepartments: ['logistics', 'armaments', 'operations'],
    premise: '전선의 승패보다 먼저 선박·철도·항공로·공장과 동맹의 우선순위를 하나의 체계로 묶어야 합니다.', historicalPattern: '대서양 수송전, 렌드리스, 버마 로드와 전후 유럽 복구에서 확인된 병참·동맹의 결합을 바탕으로 합니다.', stakes: '성공하면 독자적 군수권과 동맹 신뢰를 얻지만, 실패하면 전선과 민간 배급이 함께 무너집니다.', legacy: '통합 병참 사령부와 민군 공급망',
    acts: [act('병목의 발견', '어디에서 보급이 끊기며 누가 실제 우선권을 쥐고 있습니까?', '수송·생산·배급 병목을 하나의 전황표로 통합'), act('호송과 생산의 결합', '해군·철도·공장의 상충하는 요구를 어떻게 조정합니까?', '주간 생산량과 전선 도착량을 연결'), act('동맹의 청구서', '원조와 주권 사이의 교환조건을 어디까지 받아들입니까?', '동맹 부담과 국내 통제권의 합의'), act('평시 전환', '전시 군수망을 해체할지 국가 발전망으로 바꿀지 결정하십시오.', '전시 자산의 민수·국방 이중 유산 확정')],
  },
  {
    id: 'liberation-settlement', title: '해방 전선과 건국의 정당성', shortTitle: '해방과 건국', era: '탈식민·건국', domain: 'society', earliestYear: 1942, latestYear: 1985, phases: ['war', 'nation'], preferredDepartments: ['political', 'personnel', 'operations'],
    premise: '해방을 약속한 무장·외교·시민 세력이 승리 이후 누가 국가를 대표할지를 두고 충돌합니다.', historicalPattern: '유럽 레지스탕스, 한반도·동남아 독립운동, 인도·아프리카 탈식민 협상의 복합 경로를 참고했습니다.', stakes: '영토 확보만으로 끝나지 않습니다. 대표성에 실패하면 분단·내전·군정·외세 후견이 뒤따릅니다.', legacy: '헌정 협약 또는 미해결 정통성 분쟁',
    acts: [act('해방 연합', '국내 조직과 망명 세력의 지휘권을 어떻게 묶습니까?', '공통 강령과 대표 절차 수립'), act('과도 권력', '군정·임시정부·지방위원회 중 누가 일상을 통치합니까?', '과도 행정권과 치안 책임 확정'), act('국경과 소수자', '지도 위의 경계가 삶의 경계가 될 때 누구를 보호합니까?', '국경·귀환·시민권 원칙 합의'), act('건국의 날', '승리의 주역이 권력을 내려놓는 규칙을 만들 수 있습니까?', '헌정 질서와 최초 권력 이양')],
  },
  {
    id: 'atomic-crossroads', title: '원자력의 문과 최후무기의 딜레마', shortTitle: '원자력의 문', era: '핵과 과학국가', domain: 'science', earliestYear: 1942, latestYear: 1985, phases: ['war', 'nation'], preferredDepartments: ['science', 'armaments', 'political'],
    premise: '과학자·군부·정보기관·동맹이 하나의 발견을 서로 다른 미래로 끌고 갑니다.', historicalPattern: '맨해튼 계획, 핵 확산, 민수 원자력과 국제 사찰의 실제 쟁점을 기반으로 합니다.', stakes: '억지력·전쟁 종결·과학 도약을 얻을 수 있지만 사고·군비경쟁·도덕적 정당성의 비용이 누적됩니다.', legacy: '핵 독점, 국제 통제, 민수 원자력 또는 금기',
    acts: [act('보이지 않는 도시', '비밀 연구를 누가 감독하고 자원을 어디까지 우회합니까?', '연구·보안·민간 통제선 확립'), act('실험의 문턱', '불확실한 기술 위험을 감수할 기준은 무엇입니까?', '시험·안전·정보공개 규칙 결정'), act('사용과 과시', '무기를 사용·시연·봉인하는 선택의 책임은 누구에게 있습니까?', '군사·외교 교리 확정'), act('원자의 평화', '과학 인프라를 에너지·의학·감시에 어떻게 나눕니까?', '장기 핵질서와 책임기관 창설')],
  },
  {
    id: 'divided-world', title: '분할된 세계와 동맹의 장기 대치', shortTitle: '분할된 세계', era: '다극 냉전', domain: 'diplomacy', earliestYear: 1946, latestYear: 2035, phases: ['nation'], preferredDepartments: ['political', 'operations', 'economy'],
    premise: '가장 강한 두 나라가 아니라, 실제로 살아남은 강대국과 이념 연합이 세계를 나누려 합니다.', historicalPattern: '냉전 동맹, 비동맹운동, 베를린·쿠바식 위기와 데탕트의 반복을 재조합합니다.', stakes: '작은 분쟁도 체제 신뢰의 시험이 되지만, 완전한 승리는 동맹 피로와 패권 비용을 키웁니다.', legacy: '동맹권, 비동맹 질서 또는 공동안보 체제',
    acts: [act('선 긋기', '무엇을 방어하며 무엇은 협상 가능한지 동맹에 설명하십시오.', '공동 위협과 방어선 합의'), act('대리전의 유혹', '직접전 없이 영향력을 넓히는 비용을 누가 치릅니까?', '개입·원조·중립 원칙 수립'), act('자정의 위기', '오판과 경보가 전면전으로 번지기 전에 어떤 통로를 엽니까?', '위기 통신과 확전 통제선 구축'), act('얼음 이후', '상대 체제가 흔들릴 때 질서를 함께 만들지 승리를 독점할지 정하십시오.', '장기 안보 건축과 동맹 재편')],
  },
  {
    id: 'independence-wave', title: '독립의 물결과 신생국 협상장', shortTitle: '독립의 물결', era: '탈식민 세계', domain: 'diplomacy', earliestYear: 1945, latestYear: 1995, phases: ['nation'], preferredDepartments: ['political', 'economy', 'personnel'],
    premise: '독립은 깃발의 교체가 아니라 부채·기업·군대·언어·국경의 재협상입니다.', historicalPattern: '아시아·아프리카 독립, 반둥회의, 프랑스·영국 제국 해체와 자원 국유화 사례를 참고했습니다.', stakes: '급진적 주권은 외교·자본 압력을 부르고, 점진적 이양은 국내 정통성을 시험합니다.', legacy: '주권 경제권과 신생국 연대',
    acts: [act('대표권 투쟁', '누가 독립 협상에 앉을 자격이 있습니까?', '국내 대표 연합 구성'), act('제국의 장부', '부채·기지·기업·연금을 어떤 비율로 승계합니까?', '재산과 책임의 이양 합의'), act('국경의 현실', '식민 행정선과 공동체 경계의 충돌을 어떻게 다룹니까?', '국경 중재와 소수자 보장'), act('독립 이후의 독립', '원조에 의존하지 않는 다음 10년의 선택은 무엇입니까?', '산업·외교·교육 주권 계획')],
  },
  {
    id: 'energy-currency-shock', title: '에너지 충격과 화폐 질서의 재편', shortTitle: '에너지·통화 충격', era: '석유와 금융', domain: 'economy', earliestYear: 1965, latestYear: 2060, phases: ['nation'], preferredDepartments: ['economy', 'political', 'science'],
    premise: '연료 가격, 환율, 임금과 동맹이 동시에 흔들리며 단일 정책으로 해결할 수 없는 충격이 옵니다.', historicalPattern: '브레턴우즈 붕괴, 석유파동, 외환위기와 에너지 전환의 정책 묶음을 바탕으로 합니다.', stakes: '물가를 잡으면 실업이, 성장을 지키면 통화 신뢰와 불평등이 악화될 수 있습니다.', legacy: '통화 신뢰, 에너지 자립 또는 사회적 고통분담 체계',
    acts: [act('가격의 파도', '일시적 충격과 구조적 전환을 어떻게 구별합니까?', '에너지·물가·환율 공동 진단'), act('고통의 배분', '가계·노동·기업·국고 중 누가 먼저 부담합니까?', '보상과 긴축의 사회계약'), act('새 공급망', '자원 외교와 국내 전환에 어느 정도씩 투자합니까?', '다변화된 에너지·무역망 구축'), act('화폐의 약속', '새 시대의 돈이 무엇으로 신뢰를 얻을지 결정하십시오.', '통화·재정·산업 규칙 재정립')],
  },
  {
    id: 'information-order', title: '위성·방송·네트워크가 만든 정보 질서', shortTitle: '정보 질서', era: '정보화 시대', domain: 'intelligence', earliestYear: 1975, latestYear: 2060, phases: ['nation'], preferredDepartments: ['operations', 'science', 'political'],
    premise: '정보의 생산·검증·유통 속도가 국가의 법과 조직보다 빨라집니다.', historicalPattern: '위성통신, 24시간 뉴스, 인터넷 상용화, 대규모 감시와 허위정보 대응의 역사를 참고했습니다.', stakes: '연결성은 성장과 참여를 만들지만 감시국가·선동·외국 개입도 동시에 강화합니다.', legacy: '개방 네트워크, 공공 디지털 인프라 또는 통제 정보권',
    acts: [act('연결의 문', '국가망과 민간망을 누가 건설하고 소유합니까?', '접근권과 인프라 책임 확정'), act('진실의 속도', '검증보다 빠른 정보에 어떤 절차로 대응합니까?', '공개 검증·정정·위기통신 체계'), act('보이지 않는 전선', '외국 공작과 국내 반대를 어떻게 구별합니까?', '감시 권한과 사법 통제선 설정'), act('기억의 주권', '데이터·기록·알고리즘을 누구의 권리로 볼지 정하십시오.', '디지털 권리와 안보 원칙 제정')],
  },
  {
    id: 'pandemic-compact', title: '국경을 넘는 감염과 공중보건 계약', shortTitle: '감염병 사회계약', era: '세계 보건위기', domain: 'health', earliestYear: 1955, latestYear: 2060, phases: ['nation'], preferredDepartments: ['science', 'political', 'logistics'],
    premise: '질병의 속도와 정책의 속도가 충돌하며 병상·생계·자유·국경을 동시에 판단해야 합니다.', historicalPattern: '아시아독감, HIV/AIDS, SARS, COVID-19와 백신·검역·국제 정보공유의 경험을 바탕으로 합니다.', stakes: '강한 통제는 시간을 벌지만 신뢰를 잃을 수 있고, 자율에만 맡기면 불평등한 피해가 누적됩니다.', legacy: '상시 보건망, 국제 감시협정 또는 비상통치 관행',
    acts: [act('이상 신호', '불완전한 정보로 언제 경보를 발령합니까?', '감시·표본·공개 기준 수립'), act('곡선을 꺾는 비용', '이동·학교·기업·병원의 부담을 어떻게 나눕니까?', '보건 조치와 생계 보상 결합'), act('치료제의 정치', '연구·특허·생산·배분의 우선순위를 누가 정합니까?', '의료 생산과 공정 배분 협약'), act('다음 유행 이전', '비상조직을 해체할지 상설화할지 결정하십시오.', '보건 회복력과 권한 회수 규칙')],
  },
  {
    id: 'climate-transition', title: '기후 충격과 산업 문명의 전환', shortTitle: '기후 전환', era: '행성적 위험', domain: 'environment', earliestYear: 1985, latestYear: 2060, phases: ['nation'], preferredDepartments: ['science', 'economy', 'political'],
    premise: '재난 복구, 에너지, 산업 일자리와 세대 책임을 하나의 장기 전환으로 묶어야 합니다.', historicalPattern: '기후협약, 탄소시장, 산업 전환과 적응 재정의 실제 갈등을 기반으로 합니다.', stakes: '늦을수록 비용이 커지지만 성급하고 불공정한 전환은 지역·노동 반발을 폭발시킵니다.', legacy: '저탄소 산업권, 적응국가 또는 요새화된 불평등',
    acts: [act('위험의 지도', '누가 위험을 측정하고 어떤 피해를 먼저 인정합니까?', '지역·산업별 기후 장부 작성'), act('전환의 패자', '사라질 산업과 지역에 어떤 약속을 합니까?', '정의로운 전환 계약'), act('국경 밖의 탄소', '무역·원조·기술의 부담을 다른 나라와 어떻게 나눕니까?', '국제 전환 연합 형성'), act('새로운 번영', '성장을 무엇으로 측정할지 다시 정하십시오.', '산업·복지·생태 성과체계 확정')],
  },
  {
    id: 'algorithmic-state', title: '알고리즘 국가와 인간의 최종 결정권', shortTitle: '알고리즘 국가', era: '자동화와 인공지능', domain: 'science', earliestYear: 2005, latestYear: 2060, phases: ['nation'], preferredDepartments: ['science', 'political', 'operations'],
    premise: '채용·복지·전쟁·여론 판단을 자동화할수록 효율과 책임의 간극이 커집니다.', historicalPattern: '자동화 행정, 플랫폼 권력, 대규모 언어모델, 자율무기와 알고리즘 규제 논의를 재구성합니다.', stakes: '빠른 국가는 우위를 얻지만 설명 불가능한 결정과 권력 집중이 디스토피아적 경로를 열 수 있습니다.', legacy: '인간 감독형 자동화, 기술관료 체제 또는 계산된 권위주의',
    acts: [act('기계의 추천', '어떤 결정부터 자동화하고 누가 오류를 감시합니까?', '사용 범위와 책임자 지정'), act('데이터의 시민권', '학습 데이터와 개인의 권리를 어떻게 조정합니까?', '동의·소유·삭제 원칙 수립'), act('자율성의 선', '안보와 전장에서 기계가 넘지 못할 선은 어디입니까?', '인간 최종결정권 교리'), act('계산되는 사회', '효율을 넘어 존엄과 이견을 어떻게 보존합니까?', '알고리즘 헌정 질서 확정')],
  },
];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const stableHash = (text: string) => [...text].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 2166136261);

export function getStrategicSagaDefinition(id: string): StrategicSagaDefinition {
  return strategicSagaDefinitions.find((definition) => definition.id === id) ?? strategicSagaDefinitions[0];
}

function isEligible(definition: StrategicSagaDefinition, context: Pick<StrategicSagaContext, 'year' | 'phase' | 'completedResearch' | 'publicHealthPressure'>): boolean {
  if (context.year < definition.earliestYear || context.year > definition.latestYear || !definition.phases.includes(context.phase)) return false;
  if (definition.id === 'atomic-crossroads' && context.completedResearch < 1) return false;
  if (definition.id === 'pandemic-compact' && context.year < 2000 && context.publicHealthPressure < 18) return false;
  return true;
}

export function selectSagaOffers(context: Pick<StrategicSagaContext, 'week' | 'year' | 'phase' | 'nationId' | 'completedResearch' | 'publicHealthPressure'>, excluded: string[] = []): string[] {
  const eligible = strategicSagaDefinitions.filter((definition) => isEligible(definition, context) && !excluded.includes(definition.id));
  const pool = eligible.length >= 3 ? eligible : strategicSagaDefinitions.filter((definition) => definition.phases.includes(context.phase) && !excluded.includes(definition.id));
  return [...pool]
    .sort((left, right) => (stableHash(`${context.nationId}-${context.week}-${left.id}`) % 997) - (stableHash(`${context.nationId}-${context.week}-${right.id}`) % 997))
    .slice(0, 3)
    .map((definition) => definition.id);
}

export function createStrategicSagaState(context: Pick<StrategicSagaContext, 'week' | 'year' | 'phase' | 'nationId' | 'completedResearch' | 'publicHealthPressure'>): StrategicSagaState {
  return { version: 1, offers: selectSagaOffers(context), active: null, history: [], nextOfferWeek: context.week + 26, legacyMarks: 0, institutionalMemory: [], lastUpdatedWeek: context.week };
}

function domainCapability(domain: SagaDomain, context: StrategicSagaContext): number {
  switch (domain) {
    case 'war': return context.warSupport * .24 + (100 - context.enemyPressure) * .18 + context.civilianIndustry * .2 + context.intelNetwork * .14 + context.institutionalCapacity * .24;
    case 'diplomacy': return context.relationAverage * .28 + context.legitimacy * .2 + context.coalitionSupport * .2 + context.promiseReliability * .14 + context.institutionalCapacity * .18;
    case 'economy': return context.civilianIndustry * .26 + context.relativeCompetitiveness * .22 + context.publicConfidence * .2 + context.institutionalCapacity * .18 + (100 - clamp(context.inflation * 4)) * .14;
    case 'science': return context.education * .28 + context.relativeCompetitiveness * .2 + clamp(context.completedResearch * 8) * .18 + context.institutionalCapacity * .2 + context.intelNetwork * .14;
    case 'society': return context.legitimacy * .26 + (100 - context.unrest) * .24 + context.coalitionSupport * .22 + context.publicConfidence * .16 + context.institutionalCapacity * .12;
    case 'health': return context.education * .24 + context.institutionalCapacity * .26 + context.publicConfidence * .2 + context.civilianIndustry * .14 + (100 - context.publicHealthPressure) * .16;
    case 'environment': return context.education * .22 + context.relativeCompetitiveness * .18 + context.relationAverage * .18 + context.institutionalCapacity * .2 + context.publicConfidence * .22;
    case 'intelligence': return context.intelNetwork * .3 + context.education * .16 + context.institutionalCapacity * .22 + context.stability * .16 + context.relationAverage * .16;
  }
}

const approachMeta: Record<SagaApproachId, Omit<SagaApproachPreview, 'capability' | 'weeklyProgress' | 'weeklyPressure' | 'forecast'>> = {
  command: { id: 'command', name: '집중 지휘', doctrine: '권한·예산·조직을 하나의 지휘선에 집중합니다.', politicalCost: 5, treasuryCost: 6, strengths: '초기 진척과 위기 통제', risk: '압력과 반대 세력이 빠르게 누적' },
  coalition: { id: 'coalition', name: '연합 협상', doctrine: '이해당사자에게 검증 가능한 몫과 거부권을 나눕니다.', politicalCost: 4, treasuryCost: 4, strengths: '압력 완화와 정당성', risk: '낮은 지지에서는 협상이 지연' },
  innovation: { id: 'innovation', name: '제도 실험', doctrine: '과학·정보·시범사업으로 기존 선택지의 한계를 바꿉니다.', politicalCost: 3, treasuryCost: 8, strengths: '높은 잠재력과 장기 유산', risk: '역량이 부족하면 비용만 남음' },
};

export function previewSagaApproach(active: ActiveStrategicSaga, approachId: SagaApproachId, context: StrategicSagaContext): SagaApproachPreview {
  const definition = getStrategicSagaDefinition(active.definitionId);
  const meta = approachMeta[approachId];
  const championFit = definition.preferredDepartments.includes(active.champion.department) ? 9 : -3;
  const champion = active.champion.ability * .16 + active.champion.loyalty * .04 + championFit;
  const base = domainCapability(definition.domain, context);
  const style = approachId === 'command'
    ? context.stability * .16 + context.role.tier * 4
    : approachId === 'coalition'
      ? context.relationAverage * .11 + context.coalitionSupport * .12
      : context.education * .12 + clamp(context.completedResearch * 6) * .08;
  const capability = clamp(base * .62 + champion + style);
  const pressureModifier = approachId === 'command' ? 1.7 : approachId === 'coalition' ? -1.4 : .2;
  const weeklyPressure = round(Math.max(.8, 1.9 + context.enemyPressure * .018 + context.publicHealthPressure * .012 + pressureModifier));
  const weeklyProgress = round(Math.max(1.2, 1.5 + capability * .065 + active.momentum * .018 - active.pressure * .018 + (active.reserveCommitted ? 1.2 : 0)));
  const weeksToAct = Math.max(1, Math.ceil((100 - active.progress) / weeklyProgress));
  return { ...meta, capability: round(capability), weeklyProgress, weeklyPressure, forecast: `현재 추세 ${weeksToAct}주 · 역량 ${Math.round(capability)} · 압력 ${weeklyPressure >= 3.5 ? '상승' : weeklyPressure <= 1.5 ? '완화' : '관리 가능'}` };
}

function emptyAction(state: StrategicSagaState, title: string, detail: string): SagaActionResult {
  return { state, title, detail, politicalPowerDelta: 0, treasuryDelta: 0, stabilityDelta: 0, legitimacyDelta: 0, unrestDelta: 0, publicConfidenceDelta: 0 };
}

export function startStrategicSaga(state: StrategicSagaState, definitionId: string, champion: SagaChampion, context: StrategicSagaContext): SagaActionResult {
  if (state.active || !state.offers.includes(definitionId)) return emptyAction(state, '전략 서사 시작 불가', '이미 진행 중이거나 현재 제안된 국면이 아닙니다.');
  const definition = getStrategicSagaDefinition(definitionId);
  if (context.politicalPower < 4 || context.treasury < 4) return emptyAction(state, '착수 자원 부족', '정치력 4와 국고 4가 필요합니다.');
  const active: ActiveStrategicSaga = { id: `${definitionId}-${context.week}`, definitionId, startedWeek: context.week, actIndex: 0, progress: 8, pressure: clamp(22 + context.enemyPressure * .18 + context.publicHealthPressure * .12), momentum: 0, deadlineWeek: context.week + 104, approachId: null, champion, reserveCommitted: false, setbacks: 0, scars: [], turningPoints: [{ week: context.week, title: `${definition.shortTitle} 착수`, detail: `${champion.name}에게 첫 국면의 조정권을 맡겼습니다.`, tone: 'neutral' }] };
  return { state: { ...state, active, offers: [], nextOfferWeek: context.week + 78, lastUpdatedWeek: context.week }, title: `${definition.shortTitle} 착수`, detail: `${definition.acts[0].title} 단계가 열렸습니다. 대응 원칙을 선택해야 시간이 진행됩니다.`, politicalPowerDelta: -4, treasuryDelta: -4, stabilityDelta: 0, legitimacyDelta: 1, unrestDelta: 0, publicConfidenceDelta: 1 };
}

export function chooseSagaApproach(state: StrategicSagaState, approachId: SagaApproachId, context: StrategicSagaContext): SagaActionResult {
  if (!state.active) return emptyAction(state, '대응할 국면 없음', '먼저 시대 국면을 선택하십시오.');
  const preview = previewSagaApproach(state.active, approachId, context);
  if (context.politicalPower < preview.politicalCost || context.treasury < preview.treasuryCost) return emptyAction(state, '대응 자원 부족', `정치력 ${preview.politicalCost}, 국고 ${preview.treasuryCost}가 필요합니다.`);
  const definition = getStrategicSagaDefinition(state.active.definitionId);
  const actDefinition = definition.acts[state.active.actIndex];
  const turningPoint: SagaTurningPoint = { week: context.week, title: `${actDefinition.title} · ${preview.name}`, detail: `${preview.doctrine} ${preview.forecast}`, tone: 'neutral' };
  const legitimacyDelta = approachId === 'coalition' ? 1 : approachId === 'command' ? -1 : 0;
  return { state: { ...state, active: { ...state.active, approachId, momentum: clamp(state.active.momentum + (approachId === 'innovation' ? 2 : 1), -30, 40), turningPoints: [turningPoint, ...state.active.turningPoints].slice(0, 30) }, lastUpdatedWeek: context.week }, title: `${actDefinition.title} · ${preview.name}`, detail: `${preview.forecast}. 다음 주부터 진척과 압력이 함께 계산됩니다.`, politicalPowerDelta: -preview.politicalCost, treasuryDelta: -preview.treasuryCost, stabilityDelta: approachId === 'command' ? 1 : 0, legitimacyDelta, unrestDelta: approachId === 'command' ? 1 : approachId === 'coalition' ? -1 : 0, publicConfidenceDelta: approachId === 'innovation' ? 1 : 0 };
}

export function commitSagaReserve(state: StrategicSagaState, context: StrategicSagaContext): SagaActionResult {
  if (!state.active || !state.active.approachId || state.active.reserveCommitted) return emptyAction(state, '예비자원 투입 불가', '대응 원칙을 선택했고 아직 예비자원을 투입하지 않은 국면에서만 가능합니다.');
  if (context.politicalPower < 3 || context.treasury < 10) return emptyAction(state, '예비자원 부족', '정치력 3과 국고 10이 필요합니다.');
  const turningPoint: SagaTurningPoint = { week: context.week, title: '국가 예비자원 투입', detail: '시간을 벌기 위해 인력·예산·정치적 신용을 당겨 썼습니다.', tone: 'neutral' };
  return { state: { ...state, active: { ...state.active, reserveCommitted: true, progress: clamp(state.active.progress + 12), pressure: clamp(state.active.pressure + 5), momentum: clamp(state.active.momentum + 4, -30, 40), turningPoints: [turningPoint, ...state.active.turningPoints].slice(0, 30) } }, title: '국가 예비자원 투입', detail: '진척 +12, 압력 +5. 이번 막의 주간 진척도도 상승합니다.', politicalPowerDelta: -3, treasuryDelta: -10, stabilityDelta: 0, legitimacyDelta: 0, unrestDelta: 1, publicConfidenceDelta: 0 };
}

function setbackScar(definition: StrategicSagaDefinition, actIndex: number): string {
  const domainScars: Record<SagaDomain, string[]> = {
    war: ['우선권 없는 보급망', '동맹 청구권의 누적', '민군 수송 갈등'], diplomacy: ['보장 없는 약속', '동맹 피로', '국경 밖 후견정치'], economy: ['물가 기억', '긴축의 세대', '통화 불신'], science: ['비밀기관의 관성', '안전보다 속도', '기술 격차'], society: ['미해결 대표권', '과도권력의 관성', '귀환·시민권 분쟁'], health: ['보건 불신', '비상권한의 관성', '의료 접근 격차'], environment: ['전환 지역의 원한', '재난 부채', '세대 간 비용 전가'], intelligence: ['감시의 관성', '검증기관 불신', '데이터 권력 집중'],
  };
  return domainScars[definition.domain][actIndex % 3];
}

function completeSaga(state: StrategicSagaState, active: ActiveStrategicSaga, context: StrategicSagaContext): SagaWeeklyResult {
  const definition = getStrategicSagaDefinition(active.definitionId);
  const score = active.momentum + (active.champion.ability - 60) * .3 - active.setbacks * 12 - active.pressure * .08;
  const outcome: SagaOutcome = score >= 12 ? 'transformative' : score >= -8 ? 'contested' : 'costly';
  const outcomeLabel = outcome === 'transformative' ? '전환적 합의' : outcome === 'contested' ? '경합 속 타협' : '상처 입은 돌파';
  const record: SagaHistoryRecord = { id: active.id, definitionId: definition.id, title: definition.title, startedWeek: active.startedWeek, resolvedWeek: context.week, outcome, championName: active.champion.name, summary: `${outcomeLabel}. ${definition.legacy}이(가) 다음 시대의 제도적 기억으로 남았습니다.`, scars: active.scars, turningPoints: active.turningPoints };
  const next: StrategicSagaState = { ...state, active: null, history: [record, ...state.history].slice(0, 40), nextOfferWeek: context.week + (outcome === 'transformative' ? 39 : 26), legacyMarks: state.legacyMarks + (outcome === 'transformative' ? 3 : outcome === 'contested' ? 2 : 1), institutionalMemory: [`${definition.shortTitle} · ${outcomeLabel}`, ...active.scars.map((scar) => `상처 · ${scar}`), ...state.institutionalMemory].slice(0, 20), lastUpdatedWeek: context.week };
  return { state: next, events: [{ id: `saga-complete-${active.id}`, title: `${definition.shortTitle} · ${outcomeLabel}`, detail: record.summary, tone: outcome === 'transformative' ? 'good' : outcome === 'costly' ? 'bad' : 'neutral', cause: `${context.year}년까지 ${active.turningPoints.length}개의 전환점과 ${active.setbacks}회의 후퇴가 누적됐습니다.`, consequence: `${definition.legacy}. ${active.scars.length ? `남은 상처: ${active.scars.join(' · ')}` : '해결되지 않은 중대 상처는 없습니다.'}` }], politicalPower: outcome === 'transformative' ? 5 : 2, treasury: outcome === 'costly' ? -5 : 0, stability: outcome === 'transformative' ? 3 : outcome === 'costly' ? -1 : 1, legitimacy: outcome === 'transformative' ? 4 : outcome === 'costly' ? -2 : 2, unrest: outcome === 'transformative' ? -4 : outcome === 'costly' ? 3 : -1, publicConfidence: outcome === 'transformative' ? 5 : outcome === 'costly' ? -2 : 2, requiresDecision: false };
}

export function advanceStrategicSagaWeek(state: StrategicSagaState, context: StrategicSagaContext): SagaWeeklyResult {
  let next = { ...state, lastUpdatedWeek: context.week };
  const events: SagaEvent[] = [];
  if (!next.active) {
    if ((next.offers.length === 0 && context.week >= next.nextOfferWeek) || next.offers.some((id) => !isEligible(getStrategicSagaDefinition(id), context))) {
      const recent = next.history.slice(0, 3).map((record) => record.definitionId);
      next = { ...next, offers: selectSagaOffers(context, recent), nextOfferWeek: context.week + 26 };
      if (next.offers.length > 0) events.push({ id: `saga-offers-${context.week}`, title: '새 시대 국면이 열렸습니다', detail: '세계의 구조적 긴장이 장기 대응이 필요한 세 갈래 국면으로 모였습니다.', tone: 'neutral', cause: `${context.year}년의 전쟁·경제·외교 조건이 새로운 전환점을 만들었습니다.`, consequence: '전략 서사에서 담당 참모와 국면을 선택하기 전까지 자동 진행은 멈추지 않지만 기회는 26주 뒤 재편됩니다.' });
    }
    return { state: next, events, politicalPower: 0, treasury: 0, stability: 0, legitimacy: 0, unrest: 0, publicConfidence: 0, requiresDecision: false };
  }
  const active = { ...next.active };
  if (!active.approachId) return { state: next, events, politicalPower: 0, treasury: 0, stability: 0, legitimacy: 0, unrest: 0, publicConfidence: 0, requiresDecision: true };
  const definition = getStrategicSagaDefinition(active.definitionId);
  const preview = previewSagaApproach(active, active.approachId, context);
  active.progress = clamp(active.progress + preview.weeklyProgress);
  active.pressure = clamp(active.pressure + preview.weeklyPressure + (context.week > active.deadlineWeek ? 2 : 0));
  active.momentum = clamp(active.momentum + (preview.capability >= 68 ? .4 : preview.capability < 45 ? -.5 : .1), -30, 40);
  if (active.pressure >= 100 && active.progress < 100) {
    const scar = setbackScar(definition, active.actIndex);
    active.setbacks += 1;
    active.scars = active.scars.includes(scar) ? active.scars : [scar, ...active.scars].slice(0, 8);
    active.pressure = 54;
    active.progress = Math.max(32, active.progress - 18);
    active.momentum = clamp(active.momentum - 8, -30, 40);
    active.reserveCommitted = false;
    active.approachId = null;
    const turningPoint: SagaTurningPoint = { week: context.week, title: `${definition.acts[active.actIndex].title} 후퇴`, detail: `${scar}이(가) 제도적 상처로 남았습니다. 같은 막을 다른 방식으로 다시 수습해야 합니다.`, tone: 'bad' };
    active.turningPoints = [turningPoint, ...active.turningPoints].slice(0, 30);
    events.push({ id: `saga-setback-${active.id}-${active.setbacks}`, title: `${definition.shortTitle} · 국면 후퇴`, detail: `${scar}이(가) 남았습니다. 진행도는 일부 보존되지만 대응 원칙을 다시 선택해야 합니다.`, tone: 'bad', cause: `압력이 100에 도달하는 동안 진행은 ${Math.round(active.progress)}에 머물렀습니다.`, consequence: '실패는 게임을 끝내지 않습니다. 상처가 최종 결말과 이후 시대의 제도적 기억을 바꿉니다.' });
    next.active = active;
    return { state: next, events, politicalPower: 0, treasury: -2, stability: -1, legitimacy: -1, unrest: 2, publicConfidence: -2, requiresDecision: true };
  }
  if (active.progress >= 100) {
    const completedAct = definition.acts[active.actIndex];
    const turningPoint: SagaTurningPoint = { week: context.week, title: completedAct.title, detail: completedAct.completion, tone: 'good' };
    active.turningPoints = [turningPoint, ...active.turningPoints].slice(0, 30);
    if (active.actIndex === 3) return completeSaga(next, active, context);
    active.actIndex = (active.actIndex + 1) as 0 | 1 | 2 | 3;
    active.progress = 10 + Math.min(12, active.momentum * .2);
    active.pressure = clamp(18 + active.setbacks * 8 + context.enemyPressure * .12);
    active.approachId = null;
    active.reserveCommitted = false;
    events.push({ id: `saga-act-${active.id}-${active.actIndex}`, title: `${definition.shortTitle} · ${completedAct.title} 돌파`, detail: `${completedAct.completion}. 이제 ${definition.acts[active.actIndex].title} 단계가 열렸습니다.`, tone: 'good', cause: `${preview.name} 방식으로 진행 100에 도달했습니다.`, consequence: `${definition.acts[active.actIndex].question} 새 대응 원칙을 선택해야 다음 주 진척이 시작됩니다.` });
  }
  next.active = active;
  return { state: next, events, politicalPower: 0, treasury: active.reserveCommitted ? -.2 : 0, stability: 0, legitimacy: 0, unrest: 0, publicConfidence: active.momentum >= 15 ? .1 : 0, requiresDecision: active.approachId === null };
}

export function normalizeStrategicSagaState(value: unknown, fallback: StrategicSagaState): StrategicSagaState {
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<StrategicSagaState>;
  if (candidate.version !== 1) return fallback;
  const validIds = new Set(strategicSagaDefinitions.map((definition) => definition.id));
  const active = candidate.active && validIds.has(candidate.active.definitionId) ? candidate.active : null;
  return { ...fallback, ...candidate, offers: Array.isArray(candidate.offers) ? candidate.offers.filter((id) => validIds.has(id)).slice(0, 3) : fallback.offers, active, history: Array.isArray(candidate.history) ? candidate.history.filter((record) => validIds.has(record.definitionId)).slice(0, 40) : [], institutionalMemory: Array.isArray(candidate.institutionalMemory) ? candidate.institutionalMemory.slice(0, 20) : [], legacyMarks: Number.isFinite(candidate.legacyMarks) ? clamp(Number(candidate.legacyMarks), 0, 9999) : 0 };
}
