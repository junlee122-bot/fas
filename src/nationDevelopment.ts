import type { NationId, NationStatus } from './types';

export type NationTransitionArchetype = 'victor-settlement' | 'defeated-reconstruction' | 'civil-settlement' | 'restoration' | 'decolonization' | 'liberation';
export type NationTransitionOutcome = 'victory' | 'negotiated' | 'liberation' | 'independence' | 'restoration' | 'regime-collapse';
export type PoliticalRuptureKind = 'constitutional-crisis' | 'regime-struggle' | 'center-region-break' | 'exile-split' | 'colonial-repression' | 'liberation-split';
export type NationAgendaChoiceId = 'bargain' | 'invest' | 'enforce';

export interface NationAgendaDefinition {
  id: string;
  title: string;
  briefing: string;
  stakes: string;
  options: Record<NationAgendaChoiceId, { label: string; description: string }>;
}

export interface NationDevelopmentProfile {
  nationId: NationId;
  status: NationStatus;
  transition: {
    archetype: NationTransitionArchetype;
    outcome: NationTransitionOutcome;
    label: string;
    description: string;
    earliestWeek: number;
    targetWeek: number;
    deadlineWeek: number;
    readinessThreshold: number;
    stabilityFloor: number;
    extraordinaryThreshold: number;
  };
  structure: {
    baseUnrest: number;
    regionalPressure: number;
    identityPressure: number;
    inequalityWeight: number;
    housingWeight: number;
    demographicWeight: number;
    ecologicalWeight: number;
    institutionalWeight: number;
    generationalVolatility: number;
    resourceBase: number;
    industrialPotential: number;
    administrativeEfficiency: number;
    reconstructionEfficiency: number;
    longTermPotential: number;
  };
  agendaCadenceWeeks: number;
  agendas: [NationAgendaDefinition, NationAgendaDefinition, NationAgendaDefinition];
  crisis: {
    kind: PoliticalRuptureKind;
    label: string;
    attemptLabel: string;
    successLabel: string;
    riskBias: number;
    cooldownWeeks: number;
  };
  endingTags: [string, string, string];
}

const options = (
  bargainLabel: string,
  investLabel: string,
  enforceLabel: string,
): NationAgendaDefinition['options'] => ({
  bargain: { label: bargainLabel, description: '대표권과 절차를 넓혀 정당성과 장기 제도 역량을 얻지만 합의 비용을 부담합니다.' },
  invest: { label: investLabel, description: '재정과 행정 역량을 집중해 산업·주거 기반을 빠르게 확충하지만 단기 격차가 커질 수 있습니다.' },
  enforce: { label: enforceLabel, description: '중앙의 지휘권으로 즉시 집행해 단기 안정과 속도를 얻지만 반대 세력의 구조적 불만이 남습니다.' },
});

const agenda = (
  id: string,
  title: string,
  briefing: string,
  stakes: string,
  labels: [string, string, string],
): NationAgendaDefinition => ({
  id,
  title,
  briefing,
  stakes,
  options: options(...labels),
});

export const nationDevelopmentProfiles: Record<NationId, NationDevelopmentProfile> = {
  britain: {
    nationId: 'britain',
    status: 'sovereign',
    transition: { archetype: 'victor-settlement', outcome: 'victory', label: '연합전 승리와 제국 재협상', description: '유럽 종전만이 아니라 영연방·식민지·전시부채의 합의가 국가운영 전환을 결정합니다.', earliestWeek: 150, targetWeek: 182, deadlineWeek: 286, readinessThreshold: 52, stabilityFloor: 38, extraordinaryThreshold: 74 },
    structure: { baseUnrest: 9, regionalPressure: 3, identityPressure: 4, inequalityWeight: .16, housingWeight: .12, demographicWeight: .08, ecologicalWeight: .06, institutionalWeight: .08, generationalVolatility: 3, resourceBase: 62, industrialPotential: 67, administrativeEfficiency: 72, reconstructionEfficiency: 1.08, longTermPotential: 66 },
    agendaCadenceWeeks: 39,
    agendas: [
      agenda('commonwealth-settlement', '영연방 권한 재협상', '자치령과 식민지 대표들이 전시 공헌에 상응하는 동등한 발언권을 요구합니다.', '제국 유지비·탈식민 속도·연합 외교의 신뢰가 함께 바뀝니다.', ['연방 대표회의 소집', '공동개발기금 창설', '웨스트민스터 지휘권 유지']),
      agenda('welfare-settlement', '전후 사회보장 합의', '동원된 시민과 귀환병이 의료·주택·고용을 전쟁 공헌의 대가로 요구합니다.', '복지국가의 정당성과 재정 지속가능성이 걸려 있습니다.', ['노사·지역 사회계약', '주택·보건 집중투자', '배급·고용 행정명령']),
      agenda('sterling-order', '파운드권과 유럽 질서', '전시부채와 달러 부족 속에서 파운드권을 개방할지 보호할지 결정해야 합니다.', '금융주권·대미 관계·유럽 통합의 방향이 갈립니다.', ['다자 통화협정', '생산성·수출 투자', '자본통제와 파운드권 결속']),
    ],
    crisis: { kind: 'constitutional-crisis', label: '헌정 비상전환', attemptLabel: '내각 불신임·비상권 장악 시도', successLabel: '비상 헌정체제 수립', riskBias: -2, cooldownWeeks: 520 },
    endingTags: ['commonwealth', 'welfare-state', 'maritime-order'],
  },
  usa: {
    nationId: 'usa',
    status: 'sovereign',
    transition: { archetype: 'victor-settlement', outcome: 'victory', label: '양양전 종결과 전후 국제기구 설계', description: '전구 승리, 의회 승인, 동맹 신뢰가 함께 확보돼야 전시행정부가 평시 국가로 전환됩니다.', earliestWeek: 156, targetWeek: 190, deadlineWeek: 286, readinessThreshold: 54, stabilityFloor: 40, extraordinaryThreshold: 76 },
    structure: { baseUnrest: 10, regionalPressure: 5, identityPressure: 5, inequalityWeight: .2, housingWeight: .1, demographicWeight: .07, ecologicalWeight: .07, institutionalWeight: .06, generationalVolatility: 4, resourceBase: 84, industrialPotential: 88, administrativeEfficiency: 71, reconstructionEfficiency: 1.04, longTermPotential: 78 },
    agendaCadenceWeeks: 52,
    agendas: [
      agenda('alliance-architecture', '동맹과 국제기구의 권한', '의회와 동맹국이 상설 안보기구·원조·기지의 범위를 놓고 충돌합니다.', '패권 유지비와 다자질서의 정당성이 결정됩니다.', ['상원·동맹 협약', '원조·재건기금 투자', '대통령 비상안보권']),
      agenda('federal-rights', '연방 권리와 지역 질서', '전시 동원으로 커진 연방 권한을 시민권과 노동권에 사용할지 논쟁이 커집니다.', '권리·지역 반발·생산성의 장기 균형이 걸려 있습니다.', ['전국 권리연합 구성', '교육·도시 기반 투자', '연방 집행명령']),
      agenda('dollar-system', '달러·무역 체제 설계', '세계 결제통화의 책임과 국내 산업 보호 요구가 동시에 커졌습니다.', '번영과 패권 비용, 금융위기 전파 경로가 바뀝니다.', ['다자 환율협정', '전환산업·기술 투자', '전략산업 보호조치']),
    ],
    crisis: { kind: 'constitutional-crisis', label: '헌정 승계 위기', attemptLabel: '선거 불복·연방권 장악 시도', successLabel: '비상 연방정부 수립', riskBias: -3, cooldownWeeks: 520 },
    endingTags: ['alliance-system', 'federal-rights', 'dollar-order'],
  },
  ussr: {
    nationId: 'ussr',
    status: 'sovereign',
    transition: { archetype: 'victor-settlement', outcome: 'victory', label: '대조국전쟁 종결과 연방 재건', description: '점령지 회복, 군·당 권력정리, 막대한 인명·산업 손실의 재건안이 전환 조건입니다.', earliestWeek: 166, targetWeek: 198, deadlineWeek: 312, readinessThreshold: 55, stabilityFloor: 42, extraordinaryThreshold: 78 },
    structure: { baseUnrest: 13, regionalPressure: 5, identityPressure: 7, inequalityWeight: .1, housingWeight: .16, demographicWeight: .12, ecologicalWeight: .08, institutionalWeight: .12, generationalVolatility: 3, resourceBase: 82, industrialPotential: 79, administrativeEfficiency: 64, reconstructionEfficiency: .94, longTermPotential: 70 },
    agendaCadenceWeeks: 39,
    agendas: [
      agenda('union-compact', '연방공화국 권한 재조정', '전쟁 피해와 민족 동원 경험이 중앙과 공화국의 권한 논쟁으로 번졌습니다.', '연방 결속·지역 대표권·안보 통제가 갈립니다.', ['공화국 대표협약', '지역 재건기금', '중앙 계획권 강화']),
      agenda('reconstruction-allocation', '중공업과 생활재건 배분', '군수산업 복구와 주택·식량·보건 회복을 동시에 감당하기 어렵습니다.', '장기 생산력과 시민 생활, 군의 영향력이 달라집니다.', ['노동·지역 배분협약', '주택·전력 집중투자', '중공업 우선 동원령']),
      agenda('security-reform', '전시 보안기관의 평시 권한', '방첩과 숙청 장치가 전후에도 광범위한 권한을 요구합니다.', '정권 생존과 과학·문화의 자율성 사이의 갈등입니다.', ['당·군·공화국 공동감사', '사법·행정 현대화', '보안기관 권한 유지']),
    ],
    crisis: { kind: 'regime-struggle', label: '당·군·보안 권력투쟁', attemptLabel: '지도부 교체·국가기관 장악 시도', successLabel: '비상 당·국가체제 수립', riskBias: 1, cooldownWeeks: 468 },
    endingTags: ['union-compact', 'planned-reconstruction', 'security-state'],
  },
  germany: {
    nationId: 'germany',
    status: 'sovereign',
    transition: { archetype: 'defeated-reconstruction', outcome: 'regime-collapse', label: '전쟁체제 붕괴와 주권 재구성', description: '단순 종전이 아니라 정권 해체·점령 또는 협상정부·국경·전범처리의 조합이 새 국가를 만듭니다.', earliestWeek: 142, targetWeek: 230, deadlineWeek: 364, readinessThreshold: 58, stabilityFloor: 32, extraordinaryThreshold: 82 },
    structure: { baseUnrest: 15, regionalPressure: 5, identityPressure: 6, inequalityWeight: .12, housingWeight: .18, demographicWeight: .09, ecologicalWeight: .07, institutionalWeight: .16, generationalVolatility: 4, resourceBase: 58, industrialPotential: 82, administrativeEfficiency: 68, reconstructionEfficiency: .86, longTermPotential: 68 },
    agendaCadenceWeeks: 39,
    agendas: [
      agenda('constitutional-reconstruction', '정권 청산과 새 헌정', '당·군·관료·지역정부의 책임과 연속성을 어디까지 인정할지 결정해야 합니다.', '정당성·행정 공백·권력 잔존망이 장기적으로 남습니다.', ['지역 헌정회의', '사법·행정 재건 투자', '중앙 비상청산위원회']),
      agenda('territorial-settlement', '점령권·분할·중립화 협상', '외부 강대국과 국내 지역세력이 독일의 주권 형태를 두고 경쟁합니다.', '분단·중립·연방화·재무장의 가능성이 갈립니다.', ['다자 주권협상', '지역 경제통합 투자', '중앙 통일정부 선언']),
      agenda('industrial-accountability', '산업재건과 기업 책임', '군수기업의 설비·기술·경영진을 재건에 어떻게 사용할지 논쟁이 커집니다.', '생산 회복 속도와 사회적 정당성이 맞바뀝니다.', ['노사 공동관리', '민수전환 투자', '국가관리청 인수']),
    ],
    crisis: { kind: 'regime-struggle', label: '전후 권력 재편 위기', attemptLabel: '잔존 권력기관의 국가 장악 시도', successLabel: '국가비상지도부 수립', riskBias: 3, cooldownWeeks: 416 },
    endingTags: ['constitutional-reconstruction', 'territorial-settlement', 'industrial-accountability'],
  },
  japan: {
    nationId: 'japan',
    status: 'sovereign',
    transition: { archetype: 'defeated-reconstruction', outcome: 'regime-collapse', label: '제국전쟁 종결과 헌정 재편', description: '본토 방위·식민지 철수·군부 해체 또는 궁중 조정의 결과가 전후 체제를 결정합니다.', earliestWeek: 156, targetWeek: 220, deadlineWeek: 350, readinessThreshold: 57, stabilityFloor: 34, extraordinaryThreshold: 80 },
    structure: { baseUnrest: 14, regionalPressure: 3, identityPressure: 5, inequalityWeight: .13, housingWeight: .17, demographicWeight: .14, ecologicalWeight: .08, institutionalWeight: .13, generationalVolatility: 3, resourceBase: 35, industrialPotential: 76, administrativeEfficiency: 72, reconstructionEfficiency: .9, longTermPotential: 65 },
    agendaCadenceWeeks: 39,
    agendas: [
      agenda('post-imperial-constitution', '황실·의회·군의 새 헌정', '전쟁 책임과 국가 상징, 군 지휘권을 새 헌법에 어떻게 배치할지 논쟁합니다.', '국체 연속성과 민주적 정당성, 재무장 경로가 결정됩니다.', ['국민·의회 헌정회의', '민정·사법 재건 투자', '칙령 비상개혁']),
      agenda('land-industrial-reform', '농지·재벌·노동 재편', '농촌 소작과 산업집중을 해소하라는 요구가 생산 회복과 충돌합니다.', '내수 성장·기업 권력·농촌 안정이 함께 바뀝니다.', ['농민·노동 협약', '지역 산업투자', '중앙 경제통제']),
      agenda('pacific-alignment', '태평양 안보와 아시아 화해', '외부 안보 의존과 주변국 배상·관계정상화를 함께 해결해야 합니다.', '군비·무역·지역 신뢰의 장기 경로가 갈립니다.', ['아시아 다자협정', '평화산업·항만 투자', '안보동맹 우선']),
    ],
    crisis: { kind: 'regime-struggle', label: '궁중·군·의회 권력투쟁', attemptLabel: '비상통치·국가기관 장악 시도', successLabel: '국가수습 비상체제 수립', riskBias: -3, cooldownWeeks: 468 },
    endingTags: ['post-imperial-constitution', 'industrial-reform', 'pacific-alignment'],
  },
  china: {
    nationId: 'china',
    status: 'sovereign',
    transition: { archetype: 'civil-settlement', outcome: 'negotiated', label: '항전 종결과 통일정부 협상', description: '대일전 종결만으로 끝나지 않으며 중앙·지방군·통일전선의 군대와 토지·세원을 합의해야 합니다.', earliestWeek: 176, targetWeek: 304, deadlineWeek: 520, readinessThreshold: 60, stabilityFloor: 34, extraordinaryThreshold: 84 },
    structure: { baseUnrest: 18, regionalPressure: 8, identityPressure: 6, inequalityWeight: .2, housingWeight: .1, demographicWeight: .12, ecologicalWeight: .07, institutionalWeight: .14, generationalVolatility: 4, resourceBase: 67, industrialPotential: 72, administrativeEfficiency: 48, reconstructionEfficiency: .82, longTermPotential: 70 },
    agendaCadenceWeeks: 26,
    agendas: [
      agenda('center-province-compact', '중앙·성정부 권한 협약', '지방군과 성정부가 세원·군대·치안 권한의 보장을 요구합니다.', '국가 통합과 지역 자치, 내전 재발 위험이 걸려 있습니다.', ['연방 대표회의', '내륙 교통·행정 투자', '중앙군·세정 통합']),
      agenda('land-settlement', '토지·농민·군량 개혁', '농촌 동원과 지대·부채 문제가 군대 충원과 정권 정당성을 흔듭니다.', '농업 생산·대중 지지·지주 엘리트의 충성이 바뀝니다.', ['농촌 협상개혁', '관개·신용 투자', '토지·곡물 통제령']),
      agenda('united-front-future', '통일전선의 전후 권력', '항전 동맹을 연립정부로 바꿀지 무장해제할지 결정해야 합니다.', '다당정부·내전·지역 분단의 경로가 갈립니다.', ['연립정치 협약', '통합군 전문화 투자', '경쟁군 강제해산']),
    ],
    crisis: { kind: 'center-region-break', label: '중앙·지역 권력단절', attemptLabel: '성정부·경쟁군의 지휘권 이탈', successLabel: '경쟁 중앙정부 수립', riskBias: 0, cooldownWeeks: 416 },
    endingTags: ['center-province-compact', 'land-settlement', 'united-front'],
  },
  india: {
    nationId: 'india',
    status: 'colonized',
    transition: { archetype: 'decolonization', outcome: 'independence', label: '식민 통치 종료와 제헌 이양', description: '전쟁 공헌, 대중 정통성, 군·행정 이양, 지역·종교 합의가 독립 국가 전환을 결정합니다.', earliestWeek: 198, targetWeek: 310, deadlineWeek: 520, readinessThreshold: 61, stabilityFloor: 32, extraordinaryThreshold: 85 },
    structure: { baseUnrest: 19, regionalPressure: 8, identityPressure: 9, inequalityWeight: .21, housingWeight: .1, demographicWeight: .12, ecologicalWeight: .09, institutionalWeight: .1, generationalVolatility: 5, resourceBase: 61, industrialPotential: 69, administrativeEfficiency: 57, reconstructionEfficiency: .84, longTermPotential: 69 },
    agendaCadenceWeeks: 26,
    agendas: [
      agenda('constituent-assembly', '제헌의회 대표권', '지역·종교·카스트·노동·농민 대표가 제헌의회 구성 원칙을 다투고 있습니다.', '독립의 정당성과 이후 선거질서가 결정됩니다.', ['포괄 제헌협약', '지방 행정·교육 투자', '중앙 제헌위원회 지정']),
      agenda('partition-federalism', '연방·분리·국경 협상', '다수결 공포와 지역 주권 요구가 분할과 연방화의 갈림길을 만듭니다.', '국경 폭력·이주·장기 안보질서가 걸려 있습니다.', ['연방 안전보장 협약', '혼합지역 공동투자', '중앙 치안·국경안 강행']),
      agenda('nonalignment-development', '비동맹과 개발국가 노선', '독립 후 원조·군사동맹·산업화의 우선순위를 선택해야 합니다.', '외교 자율성과 성장 속도, 지역 패권비용이 달라집니다.', ['비동맹 개발회의', '중공업·과학 투자', '전략동맹 우선']),
    ],
    crisis: { kind: 'colonial-repression', label: '식민통치·독립 주도권 위기', attemptLabel: '식민당국 탄압·독립기구 장악 시도', successLabel: '비상 식민·독립정부 수립', riskBias: -6, cooldownWeeks: 520 },
    endingTags: ['constituent-assembly', 'federal-settlement', 'nonalignment'],
  },
  freefrance: {
    nationId: 'freefrance',
    status: 'government-in-exile',
    transition: { archetype: 'restoration', outcome: 'restoration', label: '본토 해방과 공화국 귀환', description: '영토 수복, 레지스탕스 대표권, 연합국 승인과 식민지 관계를 묶어 임시정부를 본국 정부로 바꿉니다.', earliestWeek: 124, targetWeek: 180, deadlineWeek: 286, readinessThreshold: 56, stabilityFloor: 36, extraordinaryThreshold: 80 },
    structure: { baseUnrest: 12, regionalPressure: 4, identityPressure: 6, inequalityWeight: .15, housingWeight: .16, demographicWeight: .08, ecologicalWeight: .06, institutionalWeight: .12, generationalVolatility: 4, resourceBase: 55, industrialPotential: 72, administrativeEfficiency: 66, reconstructionEfficiency: .92, longTermPotential: 67 },
    agendaCadenceWeeks: 26,
    agendas: [
      agenda('resistance-legitimacy', '레지스탕스 공헌과 국가대표권', '국내 저항조직이 망명 지도부와 동등한 정부 지분을 요구합니다.', '해방 정통성·무장해제·사회개혁의 범위가 갈립니다.', ['전국저항평의회 협약', '지역 행정재건 투자', '임시정부 지휘권 확립']),
      agenda('republican-charter', '새 공화국의 헌정', '전간기 체제를 복원할지 강한 행정부와 사회권을 결합할지 논쟁합니다.', '정부 안정성과 의회 대표성의 균형이 결정됩니다.', ['제헌연립회의', '사법·공공서비스 투자', '비상정부 헌장']),
      agenda('colonial-union', '식민지 대표권과 프랑스 연합', '전쟁에 참여한 식민지와 해외영토가 자치·독립·동등 시민권을 요구합니다.', '탈식민 전쟁과 다국적 연합의 가능성이 갈립니다.', ['동등회원국 회의', '해외 공동개발 투자', '제국 행정 복원']),
    ],
    crisis: { kind: 'exile-split', label: '망명정부·국내저항 지도부 분열', attemptLabel: '해방정부 대표권 장악 시도', successLabel: '경쟁 해방정부 수립', riskBias: 0, cooldownWeeks: 468 },
    endingTags: ['resistance-legitimacy', 'republican-charter', 'colonial-union'],
  },
  italy: {
    nationId: 'italy',
    status: 'sovereign',
    transition: { archetype: 'defeated-reconstruction', outcome: 'regime-collapse', label: '전쟁 이탈과 왕국·공화국 재편', description: '휴전, 내전, 왕실·당·저항세력의 합의 또는 충돌이 전후 국가형태를 결정합니다.', earliestWeek: 86, targetWeek: 148, deadlineWeek: 286, readinessThreshold: 55, stabilityFloor: 31, extraordinaryThreshold: 79 },
    structure: { baseUnrest: 15, regionalPressure: 7, identityPressure: 4, inequalityWeight: .17, housingWeight: .14, demographicWeight: .1, ecologicalWeight: .07, institutionalWeight: .13, generationalVolatility: 4, resourceBase: 43, industrialPotential: 65, administrativeEfficiency: 57, reconstructionEfficiency: .88, longTermPotential: 61 },
    agendaCadenceWeeks: 39,
    agendas: [
      agenda('monarchy-republic', '왕정·공화정 국민결정', '왕실의 전쟁 책임과 국가 연속성을 두고 국민투표 요구가 커집니다.', '정부 형태와 군·관료 충성, 헌정 정당성이 바뀝니다.', ['국민투표·제헌협약', '지방 공공행정 투자', '왕실 비상내각 유지']),
      agenda('north-south-compact', '북부 산업·남부 토지 격차', '재건자금과 토지개혁의 지역 배분이 국가 결속을 흔듭니다.', '성장률과 지역 불안, 정당체제가 갈립니다.', ['지역개발 협약', '남부 기반시설 투자', '중앙 재건청 배분']),
      agenda('mediterranean-role', '지중해 외교와 안보', '대륙동맹·중립·지중해 연대 가운데 국가의 생존 전략을 선택해야 합니다.', '무역·군비·식민지 청산의 경로가 달라집니다.', ['지중해 다자회의', '항만·에너지 투자', '강대국 안보동맹']),
    ],
    crisis: { kind: 'regime-struggle', label: '왕실·정당·군 권력투쟁', attemptLabel: '정부 전복·비상권 장악 시도', successLabel: '국가수습 비상정부 수립', riskBias: 0, cooldownWeeks: 416 },
    endingTags: ['monarchy-republic', 'regional-compact', 'mediterranean-order'],
  },
  korea: {
    nationId: 'korea',
    status: 'government-in-exile',
    transition: { archetype: 'liberation', outcome: 'liberation', label: '해방·귀환·국제승인과 통합 건국', description: '일본 패전만이 아니라 국내 기반, 광복군 귀환, 연합국 승인, 분할 위험을 함께 해결해야 합니다.', earliestWeek: 182, targetWeek: 326, deadlineWeek: 520, readinessThreshold: 64, stabilityFloor: 30, extraordinaryThreshold: 88 },
    structure: { baseUnrest: 20, regionalPressure: 7, identityPressure: 10, inequalityWeight: .18, housingWeight: .16, demographicWeight: .1, ecologicalWeight: .06, institutionalWeight: .15, generationalVolatility: 5, resourceBase: 38, industrialPotential: 66, administrativeEfficiency: 44, reconstructionEfficiency: .8, longTermPotential: 66 },
    agendaCadenceWeeks: 20,
    agendas: [
      agenda('recognition-trusteeship', '국제승인·신탁·자주정부 협상', '연합국의 점령·신탁 구상과 임시정부 법통, 국내 대표권이 충돌합니다.', '주권 획득 시점과 외세 의존, 정부 정통성이 갈립니다.', ['국내외 대표회의', '귀환행정·외교망 투자', '임시정부 단독 주권선언']),
      agenda('division-unification', '분할 점령과 통일 행정', '서로 다른 점령권·군정·지역위원회가 한반도의 행정과 군대를 나누려 합니다.', '분단·중립통일·연방·내전의 가능성이 결정됩니다.', ['남북 공동위원회', '전국 교통·통신 투자', '중앙정부 선점 배치']),
      agenda('land-collaboration', '토지개혁과 협력자 처리', '토지 소유·식민 관료·경찰·기업의 연속성을 어디까지 인정할지 논쟁합니다.', '농촌 지지와 행정 공백, 보복 폭력의 위험이 맞바뀝니다.', ['농민·지역 사법협약', '토지·주택 재건기금', '특별청산위원회']),
    ],
    crisis: { kind: 'liberation-split', label: '건국 주도권 분열', attemptLabel: '점령권·정파의 정부 장악 시도', successLabel: '경쟁 건국정부 수립', riskBias: -10, cooldownWeeks: 624 },
    endingTags: ['recognition', 'unification', 'land-reform'],
  },
  vietnam: {
    nationId: 'vietnam',
    status: 'resistance-coalition',
    transition: { archetype: 'decolonization', outcome: 'independence', label: '독립전쟁 종결과 주권 승인', description: '점령 붕괴 뒤 식민권력 복귀, 독립전선 통합, 외교 승인과 전국 행정 확보가 국가 전환 조건입니다.', earliestWeek: 208, targetWeek: 520, deadlineWeek: 832, readinessThreshold: 65, stabilityFloor: 29, extraordinaryThreshold: 90 },
    structure: { baseUnrest: 21, regionalPressure: 8, identityPressure: 8, inequalityWeight: .21, housingWeight: .11, demographicWeight: .11, ecologicalWeight: .09, institutionalWeight: .14, generationalVolatility: 5, resourceBase: 51, industrialPotential: 58, administrativeEfficiency: 39, reconstructionEfficiency: .76, longTermPotential: 63 },
    agendaCadenceWeeks: 20,
    agendas: [
      agenda('independence-negotiation', '독립 승인과 외국군 철수', '식민권력·주변국·독립전선이 휴전과 주권의 범위를 다투고 있습니다.', '장기전·분단·국제승인의 경로가 갈립니다.', ['다자 독립협상', '외교·행정망 투자', '전국 봉기·주권선언']),
      agenda('land-revolution', '농지·지주·농촌권력 재편', '독립군의 농촌 기반과 행정·생산 연속성이 충돌합니다.', '농민 동원과 식량 생산, 정치적 숙청 위험이 바뀝니다.', ['단계적 토지협약', '관개·농촌신용 투자', '토지 몰수령']),
      agenda('indochina-relations', '라오스·캄보디아와 지역질서', '공동 해방전선과 각 민족의 별도 주권 요구를 조정해야 합니다.', '연방·동맹·지역패권의 가능성이 갈립니다.', ['동등 독립국 회의', '국경·교통 공동투자', '통합 군사지휘부']),
    ],
    crisis: { kind: 'liberation-split', label: '독립전선 주도권 분열', attemptLabel: '경쟁 정파·지역군의 혁명기구 장악', successLabel: '경쟁 독립정부 수립', riskBias: -5, cooldownWeeks: 572 },
    endingTags: ['independence-negotiation', 'land-revolution', 'indochina-order'],
  },
  indonesia: {
    nationId: 'indonesia',
    status: 'colonized',
    transition: { archetype: 'decolonization', outcome: 'independence', label: '군도 독립선언과 주권이양', description: '자바의 선언만이 아니라 섬별 행정·무장조직·해상 연락망과 국제 승인을 확보해야 합니다.', earliestWeek: 176, targetWeek: 370, deadlineWeek: 624, readinessThreshold: 63, stabilityFloor: 28, extraordinaryThreshold: 88 },
    structure: { baseUnrest: 21, regionalPressure: 11, identityPressure: 7, inequalityWeight: .18, housingWeight: .1, demographicWeight: .1, ecologicalWeight: .1, institutionalWeight: .14, generationalVolatility: 5, resourceBase: 76, industrialPotential: 61, administrativeEfficiency: 40, reconstructionEfficiency: .78, longTermPotential: 65 },
    agendaCadenceWeeks: 20,
    agendas: [
      agenda('unitary-federal', '단일공화국·연방 군도 협상', '자바 중심 정부와 외곽 섬·지역 엘리트가 주권 배분을 다투고 있습니다.', '분리주의·행정 효율·해양 국가 정체성이 갈립니다.', ['군도 대표협약', '섬간 항만·통신 투자', '단일 중앙정부 선포']),
      agenda('civil-military', '청년군·정규군·민간정부 관계', '독립전의 무장조직들이 정부와 지역 경제의 지휘권을 요구합니다.', '문민통제와 혁명 정통성, 군벌화 위험이 바뀝니다.', ['군·민 통합회의', '직업군·보훈 투자', '혁명군 최고사령부']),
      agenda('resource-sovereignty', '석유·고무·광산 주권', '외국 기업 계약과 국유화, 지역 수익배분을 함께 결정해야 합니다.', '재정 자립·외부개입·지역 격차가 갈립니다.', ['생산지 수익협약', '국영개발기금', '전면 국유화 명령']),
    ],
    crisis: { kind: 'colonial-repression', label: '식민복귀·독립기구 장악 위기', attemptLabel: '식민당국·지역군의 독립정부 전복', successLabel: '경쟁 군도정부 수립', riskBias: -10, cooldownWeeks: 624 },
    endingTags: ['unitary-federal', 'civil-military', 'resource-sovereignty'],
  },
  philippines: {
    nationId: 'philippines',
    status: 'occupied-commonwealth',
    transition: { archetype: 'restoration', outcome: 'restoration', label: '점령 해방과 자치정부 복원·독립', description: '게릴라 공헌, 망명정부 귀환, 미국과의 주권·기지협정, 지역 무장해제를 함께 해결해야 합니다.', earliestWeek: 146, targetWeek: 228, deadlineWeek: 390, readinessThreshold: 59, stabilityFloor: 31, extraordinaryThreshold: 84 },
    structure: { baseUnrest: 18, regionalPressure: 9, identityPressure: 6, inequalityWeight: .2, housingWeight: .13, demographicWeight: .1, ecologicalWeight: .09, institutionalWeight: .11, generationalVolatility: 5, resourceBase: 55, industrialPotential: 62, administrativeEfficiency: 53, reconstructionEfficiency: .84, longTermPotential: 64 },
    agendaCadenceWeeks: 26,
    agendas: [
      agenda('restoration-guerrillas', '망명정부·게릴라 대표권', '점령기 희생과 전공을 정부·군·지방권력에 어떻게 반영할지 논쟁합니다.', '무장해제·정통성·지역 군벌화가 걸려 있습니다.', ['해방공헌 대표회의', '보훈·지방행정 투자', '자치정부 지휘권 복원']),
      agenda('base-sovereignty', '외국 기지와 주권협정', '안보 보장과 군사기지·경제특권의 대가를 두고 여론이 갈립니다.', '외교 자율성과 국방비, 지역 안보가 바뀝니다.', ['상호방위 재협상', '자주국방·항만 투자', '기지협정 신속 비준']),
      agenda('land-elite-reform', '토지·지역 엘리트·농민운동', '점령 전 지주질서 복원과 농민 게릴라의 개혁 요구가 충돌합니다.', '농촌 불안·생산·정당정치의 장기 구조가 갈립니다.', ['농지·소작 협약', '농촌신용·관개 투자', '치안 중심 질서복원']),
    ],
    crisis: { kind: 'liberation-split', label: '해방정부·지역무장세력 지휘권 위기', attemptLabel: '경쟁 무장세력의 정부 장악 시도', successLabel: '경쟁 해방정부 수립', riskBias: -9, cooldownWeeks: 572 },
    endingTags: ['restoration', 'base-sovereignty', 'land-reform'],
  },
};

export function getNationDevelopmentProfile(nationId: NationId) {
  return nationDevelopmentProfiles[nationId];
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function getNationTransitionSchedule(nationId: NationId, behaviorTargetWeek: number, sessionSeed = 0) {
  const transition = getNationDevelopmentProfile(nationId).transition;
  const variation = hash(`${nationId}:${sessionSeed}:transition`) % 53 - 26;
  const targetWeek = Math.max(
    transition.earliestWeek,
    Math.min(
      transition.deadlineWeek,
      Math.round(transition.targetWeek * .78 + behaviorTargetWeek * .22 + variation),
    ),
  );
  return {
    ...transition,
    targetWeek,
    deadlineWeek: Math.max(targetWeek + 78, transition.deadlineWeek),
  };
}
