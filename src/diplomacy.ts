import type { DiplomaticRelation, GameState, NationId } from './types';

export type DiplomaticAgendaBasis = 'documented-conference' | 'historical-composite';

export interface DiplomaticAgenda {
  nationId: NationId;
  partnerNationId: NationId;
  title: string;
  location: string;
  participants: string;
  detail: string;
  historicalAnchor: string;
  initialWeeksUntil: number;
  basis: DiplomaticAgendaBasis;
}

type DiplomaticReward = Partial<Pick<GameState,
  'manpower' | 'politicalPower' | 'fuel' | 'steel' | 'factories' | 'stability' |
  'warSupport' | 'commandPoints' | 'treasury' | 'airPower' | 'navalPower' | 'intelNetwork'
>>;

export interface DiplomaticAgendaOutcome {
  cost: number;
  requiredRelation: number;
  requiredReadiness: number;
  relationGain: number;
  effectLabel: string;
  reward: DiplomaticReward;
}

export const diplomaticAgendas: Record<NationId, DiplomaticAgenda> = {
  britain: {
    nationId: 'britain', partnerNationId: 'usa', title: '카사블랑카 연합 전략회의', location: '프랑스령 모로코 · 카사블랑카', participants: '윈스턴 처칠 · 프랭클린 D. 루스벨트 · 연합참모진', initialWeeksUntil: 12, basis: 'documented-conference',
    detail: '1943년 연합군의 유럽·지중해 전략, 북아프리카 이후 작전과 추축국에 대한 공동 전쟁목표를 조율합니다.',
    historicalAnchor: '1943년 1월 14–24일 실제 카사블랑카 회담을 기준점으로 삼습니다.',
  },
  usa: {
    nationId: 'usa', partnerNationId: 'britain', title: '카사블랑카 연합 전략회의', location: '프랑스령 모로코 · 카사블랑카', participants: '프랭클린 D. 루스벨트 · 윈스턴 처칠 · 연합참모진', initialWeeksUntil: 12, basis: 'documented-conference',
    detail: '독일 우선 전략과 태평양 압박을 함께 유지하면서 1943년 연합군의 작전 순서를 결정합니다.',
    historicalAnchor: '1943년 1월 14–24일 실제 카사블랑카 회담을 기준점으로 삼습니다.',
  },
  ussr: {
    nationId: 'ussr', partnerNationId: 'britain', title: '제2전선·원조 조정 교섭', location: '모스크바', participants: '소련 외무·최고사령부 · 영미 군사사절단', initialWeeksUntil: 6, basis: 'historical-composite',
    detail: '제2전선 개설 시기, 북극항로 원조와 동부전선의 전략 정보를 하나의 협상안으로 묶습니다.',
    historicalAnchor: '1942년 영미소 연합외교와 렌드리스 교섭을 합성한 게임용 회담입니다.',
  },
  germany: {
    nationId: 'germany', partnerNationId: 'italy', title: '추축국 전쟁지도부 협의', location: '동프로이센 · 지휘본부', participants: '독일 최고지휘부 · 이탈리아 군사사절단', initialWeeksUntil: 5, basis: 'historical-composite',
    detail: '지중해와 동부전선 사이의 자원 우선순위, 연료와 수송 분담을 재협상합니다.',
    historicalAnchor: '1942년 독일·이탈리아 간 군사 조정을 단일 의제로 재구성했습니다.',
  },
  japan: {
    nationId: 'japan', partnerNationId: 'germany', title: '대본영·정부 연락회의', location: '도쿄', participants: '대본영 육해군부 · 내각 · 추축국 연락관', initialWeeksUntil: 4, basis: 'historical-composite',
    detail: '육군과 해군의 전구 우선순위, 점령지 통치와 장거리 해상수송 계획을 조정합니다.',
    historicalAnchor: '실제 대본영정부연락회의 제도를 바탕으로 의제를 게임용으로 확장했습니다.',
  },
  china: {
    nationId: 'china', partnerNationId: 'usa', title: '충칭 연합전구 조정회의', location: '중화민국 전시수도 · 충칭', participants: '국민정부 군사위원회 · 미영 중국-버마-인도 전구 사절단', initialWeeksUntil: 5, basis: 'historical-composite',
    detail: '버마 보급로, 항공지원과 중국군 지휘권을 묶어 연합국 지원 조건을 협상합니다.',
    historicalAnchor: '1942년 충칭의 연합국 군사사절·보급 교섭을 합성한 게임용 회담입니다.',
  },
  india: {
    nationId: 'india', partnerNationId: 'britain', title: '참전·헌정 지위 협상', location: '뉴델리', participants: '인도 정치세력 · 총독부 · 인도군 지휘부', initialWeeksUntil: 7, basis: 'historical-composite',
    detail: '전쟁 동원과 식량·산업 부담을 자치권, 정치범 문제와 전후 독립 일정에 연결합니다.',
    historicalAnchor: '크립스 사절단과 1942년 인도 독립운동의 충돌을 대체역사 협상으로 재구성했습니다.',
  },
  freefrance: {
    nationId: 'freefrance', partnerNationId: 'usa', title: '프랑스 해방지도부 통합교섭', location: '런던 ↔ 알제', participants: '자유 프랑스 · 북아프리카 프랑스 세력 · 영미 연락관', initialWeeksUntil: 10, basis: 'historical-composite',
    detail: '해방 프랑스의 대표권, 식민지 병력 지휘와 전후 공화정의 정통성을 협상합니다.',
    historicalAnchor: '횃불 작전 이후 드골·지로 진영의 통합 과정으로 이어지는 실제 갈등을 기준으로 삼았습니다.',
  },
  italy: {
    nationId: 'italy', partnerNationId: 'germany', title: '지중해 전쟁전략 회의', location: '로마', participants: '이탈리아 왕실·최고사령부 · 독일 군사사절단', initialWeeksUntil: 4, basis: 'historical-composite',
    detail: '북아프리카 보급, 해군 연료와 독일 의존도를 놓고 독자전략의 여지를 확보합니다.',
    historicalAnchor: '1942년 북아프리카 전역의 독이 군사조정 문제를 합성한 게임용 회담입니다.',
  },
  korea: {
    nationId: 'korea', partnerNationId: 'china', title: '대한민국 임시정부 승인 교섭', location: '중화민국 전시수도 · 충칭', participants: '대한민국 임시정부 · 중국 국민정부 · 연합국 외교 연락관', initialWeeksUntil: 6, basis: 'historical-composite',
    detail: '임시정부 승인, 한국 독립 보장과 한국광복군에 대한 군사·재정 지원을 하나의 의제로 제출합니다.',
    historicalAnchor: '1942년 중국의 임시정부 승인 검토와 미국의 외교 문서를 기반으로 한 대체역사 교섭입니다.',
  },
  vietnam: {
    nationId: 'vietnam', partnerNationId: 'china', title: '국경 항일연락 교섭', location: '비엣박 ↔ 광시', participants: '베트민 연락조 · 중국 측 항일조직 · 지역 정보원', initialWeeksUntil: 7, basis: 'historical-composite',
    detail: '국경 통과권, 일본군 정보와 무기·의약품 지원을 프랑스 식민통치 이후의 독립 구상과 연결합니다.',
    historicalAnchor: '1941년 창설된 베트민의 중국 국경 활동을 바탕으로 한 게임용 비밀회담입니다.',
  },
  indonesia: {
    nationId: 'indonesia', partnerNationId: 'japan', title: '군도 독립연락 회합', location: '자바 지하연락망', participants: '민족주의 지도자 · 청년 지하조직 · 점령행정 접촉선', initialWeeksUntil: 8, basis: 'historical-composite',
    detail: '점령당국과의 제한적 협력, 지하 저항과 독립 준비를 동시에 관리할 공동 원칙을 정합니다.',
    historicalAnchor: '수카르노·하타의 공개 활동과 샤리르 계열 지하 저항이 병존한 역사적 조건을 합성했습니다.',
  },
  philippines: {
    nationId: 'philippines', partnerNationId: 'usa', title: '영연방 망명정부 전략회의', location: '워싱턴 D.C.', participants: '필리핀 영연방 정부 · 미국 전쟁부 · 게릴라 연락관', initialWeeksUntil: 5, basis: 'historical-composite',
    detail: '점령지 민간행정의 정통성, 게릴라 보급과 필리핀 수복 이후의 권력 이양을 협의합니다.',
    historicalAnchor: '1942년 영연방 망명정부와 미군·필리핀 저항 연락을 하나의 게임 의제로 구성했습니다.',
  },
};

/**
 * 회담의 기회비용과 결과는 각 진영의 1942년 외교적 병목을 게임 자원으로 번역한다.
 * 수치는 역사 자체의 정량화가 아니라, 플레이 선택에 서로 다른 전략적 결과를 주기 위한 규칙이다.
 */
export const diplomaticAgendaOutcomes: Record<NationId, DiplomaticAgendaOutcome> = {
  britain: { cost: 16, requiredRelation: 62, requiredReadiness: 68, relationGain: 10, effectLabel: '연합참모 조율 · 지휘 +8 · 전쟁 지지도 +3', reward: { commandPoints: 8, warSupport: 3 } },
  usa: { cost: 16, requiredRelation: 62, requiredReadiness: 68, relationGain: 10, effectLabel: '연합작전 교리 · 공군력 +3 · 지휘 +7', reward: { airPower: 3, commandPoints: 7 } },
  ussr: { cost: 15, requiredRelation: 57, requiredReadiness: 66, relationGain: 9, effectLabel: '북극항로 원조 · 연료 +12 · 지휘 +6', reward: { fuel: 12, commandPoints: 6 } },
  germany: { cost: 14, requiredRelation: 58, requiredReadiness: 66, relationGain: 8, effectLabel: '추축 수송분담 · 연료 +10 · 지휘 +6', reward: { fuel: 10, commandPoints: 6 } },
  japan: { cost: 15, requiredRelation: 55, requiredReadiness: 65, relationGain: 8, effectLabel: '전구 우선순위 합의 · 해군력 +3 · 지휘 +7', reward: { navalPower: 3, commandPoints: 7 } },
  china: { cost: 14, requiredRelation: 57, requiredReadiness: 66, relationGain: 10, effectLabel: '버마 보급로 지원 · 인력 +60 · 정보망 +4', reward: { manpower: 60, intelNetwork: 4 } },
  india: { cost: 17, requiredRelation: 55, requiredReadiness: 67, relationGain: 9, effectLabel: '조건부 동원협약 · 안정도 +4 · 인력 +50', reward: { stability: 4, manpower: 50 } },
  freefrance: { cost: 16, requiredRelation: 58, requiredReadiness: 68, relationGain: 10, effectLabel: '대표권 통합 · 안정도 +6 · 인력 +40', reward: { stability: 6, manpower: 40 } },
  italy: { cost: 14, requiredRelation: 56, requiredReadiness: 65, relationGain: 8, effectLabel: '지중해 보급협약 · 해군력 +3 · 연료 +10', reward: { navalPower: 3, fuel: 10 } },
  korea: { cost: 18, requiredRelation: 60, requiredReadiness: 70, relationGain: 12, effectLabel: '승인 기반 확대 · 정보망 +7 · 인력 +35', reward: { intelNetwork: 7, manpower: 35 } },
  vietnam: { cost: 13, requiredRelation: 52, requiredReadiness: 64, relationGain: 10, effectLabel: '국경 연락망 · 정보망 +8 · 인력 +25', reward: { intelNetwork: 8, manpower: 25 } },
  indonesia: { cost: 13, requiredRelation: 50, requiredReadiness: 64, relationGain: 7, effectLabel: '이중 연락선 · 정보망 +7 · 안정도 +4', reward: { intelNetwork: 7, stability: 4 } },
  philippines: { cost: 14, requiredRelation: 58, requiredReadiness: 66, relationGain: 10, effectLabel: '게릴라 보급선 · 정보망 +6 · 인력 +35', reward: { intelNetwork: 6, manpower: 35 } },
};

export function getDiplomaticAgenda(nationId: NationId): DiplomaticAgenda {
  return diplomaticAgendas[nationId];
}

export function getDiplomaticAgendaOutcome(nationId: NationId): DiplomaticAgendaOutcome {
  return diplomaticAgendaOutcomes[nationId];
}

export function applyDiplomaticAgendaReward(game: GameState, reward: DiplomaticReward): GameState {
  const next = { ...game };
  if (reward.manpower) next.manpower += reward.manpower;
  if (reward.politicalPower) next.politicalPower += reward.politicalPower;
  if (reward.fuel) next.fuel += reward.fuel;
  if (reward.steel) next.steel += reward.steel;
  if (reward.factories) next.factories += reward.factories;
  if (reward.commandPoints) next.commandPoints += reward.commandPoints;
  if (reward.treasury) next.treasury += reward.treasury;
  if (reward.stability) next.stability = Math.min(100, Math.max(0, next.stability + reward.stability));
  if (reward.warSupport) next.warSupport = Math.min(100, Math.max(0, next.warSupport + reward.warSupport));
  if (reward.airPower) next.airPower = Math.min(100, Math.max(0, next.airPower + reward.airPower));
  if (reward.navalPower) next.navalPower = Math.min(100, Math.max(0, next.navalPower + reward.navalPower));
  if (reward.intelNetwork) next.intelNetwork = Math.min(100, Math.max(0, next.intelNetwork + reward.intelNetwork));
  return next;
}

export function calculateAgendaReadiness(relations: DiplomaticRelation[], politicalPower: number, partnerNationId?: NationId): number {
  const partnerRelation = partnerNationId ? relations.find((relation) => relation.id === partnerNationId) : undefined;
  const relationshipBasis = partnerRelation?.value ?? (relations.length > 0 ? relations.reduce((total, relation) => total + relation.value, 0) / relations.length : 0);
  return Math.min(100, Math.max(0, Math.round(22 + relationshipBasis * 0.6 + politicalPower * 0.16)));
}
