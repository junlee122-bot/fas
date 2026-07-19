import type {
  BattleReport,
  CampaignOutcome,
  CareerTier,
  CovertOperation,
  DiplomaticRelation,
  Division,
  EquipmentDevelopmentState,
  GameState,
  GameTab,
  ResearchProject,
  StaffMember,
  Stockpile,
  WarEvent,
} from './types';
import type { EconomyState } from './economy';
import type { CampaignPhase, NationManagementState } from './nationManagement';
import type { PublicHealthState } from './publicHealth';
import firstVictoryArt from './assets/achievements/first-victory.webp';
import lifelineLogisticsArt from './assets/achievements/lifeline-logistics.webp';
import invisibleFrontArt from './assets/achievements/invisible-front.webp';
import cabinetOfMindsArt from './assets/achievements/cabinet-of-minds.webp';
import authorOfHistoryArt from './assets/achievements/author-of-history.webp';
import fromFieldToCommandArt from './assets/achievements/from-field-to-command.webp';
import negotiatedFrontArt from './assets/achievements/negotiated-front.webp';
import warEndedArt from './assets/achievements/war-ended.webp';

export type AchievementCategory = 'combat' | 'logistics' | 'intelligence' | 'organization' | 'technology' | 'economy' | 'health' | 'governance' | 'history' | 'career' | 'diplomacy' | 'legacy';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementSortMode = 'recommended' | 'progress' | 'points' | 'rarity';

export interface AchievementSnapshot {
  game: GameState;
  stockpile: Stockpile;
  divisions: Division[];
  research: ResearchProject[];
  operations: CovertOperation[];
  staff: StaffMember[];
  relations: DiplomaticRelation[];
  completedDecisions: string[];
  events: WarEvent[];
  battleReports: BattleReport[];
  careerTier: CareerTier;
  selectedPolicies: string[];
  campaignOutcome: CampaignOutcome;
  campaignPhase: CampaignPhase;
  equipmentDevelopment: EquipmentDevelopmentState;
  economy: EconomyState;
  publicHealth: PublicHealthState;
  nationManagement: NationManagementState;
}

export interface AchievementProgress {
  current: number;
  target: number;
  percent: number;
  complete: boolean;
  detail: string;
}

export interface AchievementUnlock {
  id: string;
  unlockedWeek: number;
  unlockedAt: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  condition: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  art: string;
  inspiration: string;
  evaluate: (snapshot: AchievementSnapshot) => AchievementProgress;
}

export const achievementCategoryLabels: Record<AchievementCategory, string> = {
  combat: '전투',
  logistics: '보급',
  intelligence: '첩보',
  organization: '조직',
  technology: '기술',
  economy: '경제',
  health: '보건',
  governance: '국가 운영',
  history: '대체역사',
  career: '경력',
  diplomacy: '외교',
  legacy: '유산',
};

export const achievementCategoryDestinations: Record<AchievementCategory, { tab: GameTab; label: string }> = {
  combat: { tab: 'map', label: '작전 지도' },
  logistics: { tab: 'industry', label: '생산·보급부' },
  intelligence: { tab: 'intelligence', label: '정보국' },
  organization: { tab: 'organization', label: '조직 본부' },
  technology: { tab: 'research', label: '연구·장비국' },
  economy: { tab: 'economy', label: '전시 재무성' },
  health: { tab: 'health', label: '국가 보건본부' },
  governance: { tab: 'governance', label: '국가 운영 내각' },
  history: { tab: 'command', label: '국가 전략실' },
  career: { tab: 'organization', label: '조직·경력실' },
  diplomacy: { tab: 'diplomacy', label: '외무부' },
  legacy: { tab: 'command', label: '지휘 본부' },
};

export const achievementRarityLabels: Record<AchievementRarity, string> = {
  common: '일반',
  rare: '희귀',
  epic: '서사',
  legendary: '전설',
};

export const achievementSortLabels: Record<AchievementSortMode, string> = {
  recommended: '다음 추천',
  progress: '진행률 높은 순',
  points: '명예점수 높은 순',
  rarity: '희귀도 높은 순',
};

function progress(current: number, target: number, detail: string): AchievementProgress {
  const safeCurrent = Math.max(0, current);
  return {
    current: safeCurrent,
    target,
    percent: Math.max(0, Math.min(100, Math.round((safeCurrent / Math.max(1, target)) * 100))),
    complete: safeCurrent >= target,
    detail,
  };
}

function completedGate(value: boolean): number {
  return value ? 1 : 0;
}

export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first-victory',
    title: '첫 승전보',
    subtitle: '지도 위의 첫 번째 화살표',
    description: '처음 맡은 보직에서 계획한 공세를 실제 승리로 바꾸십시오.',
    condition: '전투 보고서에서 첫 승리 기록',
    category: 'combat',
    rarity: 'common',
    points: 10,
    art: firstVictoryArt,
    inspiration: '첫 승리형 경력 이정표',
    evaluate: (snapshot) => {
      const victories = snapshot.battleReports.filter((report) => report.victory).length;
      return progress(victories, 1, victories > 0 ? `${victories}회 승리` : '승리한 공세가 아직 없습니다');
    },
  },
  {
    id: 'economy-of-force',
    title: '최소 희생의 승리',
    subtitle: '좋은 작전은 병사를 집으로 돌려보낸다',
    description: '무모한 소모전 대신 정보와 준비를 활용해 매우 적은 손실로 전선을 돌파하십시오.',
    condition: '아군 전력 손실 5 이하 · 보급 소모 7 이하로 전투 승리',
    category: 'combat',
    rarity: 'rare',
    points: 35,
    art: firstVictoryArt,
    inspiration: '효율과 인명 보존을 보상하는 전술 도전',
    evaluate: (snapshot) => {
      const efficientVictories = snapshot.battleReports.filter((report) => report.victory && report.attackerStrengthLoss <= 5 && report.supplySpent <= 7).length;
      return progress(efficientVictories, 1, efficientVictories > 0 ? `저손실 승리 ${efficientVictories}회` : '손실 5·보급 7 이하의 승리가 필요합니다');
    },
  },
  {
    id: 'veteran-corps',
    title: '베테랑 군단',
    subtitle: '부대도 역사를 기억한다',
    description: '한 번의 승리가 아니라 여러 부대를 살아남고 성장한 정예 전력으로 만드십시오.',
    condition: '경험 75 이상 사단 3개 · 총 전투 승리 5회',
    category: 'combat',
    rarity: 'epic',
    points: 60,
    art: fromFieldToCommandArt,
    inspiration: '장기 로스터 육성과 전투 기록의 결합',
    evaluate: (snapshot) => {
      const veterans = snapshot.divisions.filter((division) => division.experience >= 75).length;
      const victories = snapshot.battleReports.filter((report) => report.victory).length;
      return progress(Math.min(3, veterans) + Math.min(5, victories), 8, `정예 사단 ${Math.min(3, veterans)}/3 · 승리 ${Math.min(5, victories)}/5`);
    },
  },
  {
    id: 'lifeline-unbroken',
    title: '끊기지 않는 생명선',
    subtitle: '군대는 보급으로 진군한다',
    description: '기계화 군수 교리, 충분한 수송선, 전군의 안정된 보급을 동시에 달성하십시오.',
    condition: '군수 교리 완료 · 수송선 700척 · 모든 사단 보급 85% 이상',
    category: 'logistics',
    rarity: 'rare',
    points: 35,
    art: lifelineLogisticsArt,
    inspiration: '누적 자산과 복합 조건형 전략 과제',
    evaluate: (snapshot) => {
      const doctrineReady = snapshot.research.some((project) => project.id === 'logistics' && project.complete);
      const convoyReady = snapshot.stockpile.convoys >= 700;
      const supplyReady = snapshot.divisions.length > 0 && snapshot.divisions.every((division) => division.supply >= 85);
      const minimumSupply = snapshot.divisions.length > 0 ? Math.min(...snapshot.divisions.map((division) => division.supply)) : 0;
      const current = completedGate(doctrineReady) + completedGate(convoyReady) + completedGate(supplyReady);
      return progress(current, 3, `교리 ${doctrineReady ? '완료' : '미완료'} · 수송선 ${Math.round(snapshot.stockpile.convoys)}/700 · 최저 보급 ${Math.round(minimumSupply)}%`);
    },
  },
  {
    id: 'arsenal-without-end',
    title: '고갈되지 않는 병기창',
    subtitle: '다음 전투까지 계산된 생산',
    description: '어느 한 병과에 치우치지 않은 대규모 전략 비축을 완성하십시오.',
    condition: '보병장비 65,000 · 전차 2,000 · 항공기 3,000 · 야포 5,000 · 트럭 16,000',
    category: 'logistics',
    rarity: 'epic',
    points: 65,
    art: lifelineLogisticsArt,
    inspiration: '다품목 생산 균형과 장기 조달 계획 도전',
    evaluate: (snapshot) => {
      const gates = [snapshot.stockpile.infantryEquipment >= 65_000, snapshot.stockpile.tanks >= 2_000, snapshot.stockpile.aircraft >= 3_000, snapshot.stockpile.artillery >= 5_000, snapshot.stockpile.trucks >= 16_000];
      return progress(gates.filter(Boolean).length, 5, `보병 ${Math.round(snapshot.stockpile.infantryEquipment).toLocaleString('ko-KR')} · 전차 ${Math.round(snapshot.stockpile.tanks).toLocaleString('ko-KR')} · 항공 ${Math.round(snapshot.stockpile.aircraft).toLocaleString('ko-KR')} · 야포 ${Math.round(snapshot.stockpile.artillery).toLocaleString('ko-KR')} · 트럭 ${Math.round(snapshot.stockpile.trucks).toLocaleString('ko-KR')}`);
    },
  },
  {
    id: 'invisible-front',
    title: '보이지 않는 전선',
    subtitle: '전투가 시작되기 전에 이긴다',
    description: '암호 해독과 인적 네트워크를 결합해 하나의 비밀 작전을 완수하십시오.',
    condition: '해독 체계 완료 · 정보망 90% · 비밀 작전 하나 100%',
    category: 'intelligence',
    rarity: 'rare',
    points: 40,
    art: invisibleFrontArt,
    inspiration: '기술·자원·작전 결합형 과제',
    evaluate: (snapshot) => {
      const codeReady = snapshot.research.some((project) => project.id === 'code' && project.complete);
      const networkReady = snapshot.game.intelNetwork >= 90;
      const operationProgress = Math.max(0, ...snapshot.operations.map((operation) => operation.progress));
      const operationReady = operationProgress >= 100;
      const current = completedGate(codeReady) + completedGate(networkReady) + completedGate(operationReady);
      return progress(current, 3, `해독 ${codeReady ? '완료' : '미완료'} · 정보망 ${Math.round(snapshot.game.intelNetwork)}% · 작전 ${Math.round(operationProgress)}%`);
    },
  },
  {
    id: 'three-shadows',
    title: '세 개의 그림자',
    subtitle: '국경을 넘는 보이지 않는 조직',
    description: '서로 다른 비밀 작전망을 완성해 전구 전체에 지속 가능한 정보 우위를 구축하십시오.',
    condition: '진척도 100% 비밀 작전 3개 · 정보망 85 이상',
    category: 'intelligence',
    rarity: 'epic',
    points: 60,
    art: invisibleFrontArt,
    inspiration: '다중 정보망 운영과 장기 첩보 투자 과제',
    evaluate: (snapshot) => {
      const completed = snapshot.operations.filter((operation) => operation.progress >= 100).length;
      const networkReady = snapshot.game.intelNetwork >= 85;
      return progress(Math.min(3, completed) + completedGate(networkReady), 4, `완료 작전 ${Math.min(3, completed)}/3 · 정보망 ${Math.round(snapshot.game.intelNetwork)}/85`);
    },
  },
  {
    id: 'cabinet-of-minds',
    title: '인재들의 내각',
    subtitle: '승리는 사람에게서 시작된다',
    description: '영입 시장을 활용해 두 명의 핵심 인재를 데려오고 과학·경제 자문 역량을 확보하십시오.',
    condition: '신임 참모 2명 영입 · 과학/경제 부서 능력 80 이상',
    category: 'organization',
    rarity: 'epic',
    points: 55,
    art: cabinetOfMindsArt,
    inspiration: '풋볼 매니저식 스태프 영입과 조직 구성 과제',
    evaluate: (snapshot) => {
      const recruitCount = snapshot.events.filter((event) => event.title.includes('신임 참모 영입')).length;
      const scienceReady = snapshot.staff.some((member) => member.department === 'science' && member.ability >= 80);
      const economyReady = snapshot.staff.some((member) => member.department === 'economy' && member.ability >= 80);
      const current = Math.min(2, recruitCount) + completedGate(scienceReady) + completedGate(economyReady);
      return progress(current, 4, `영입 ${Math.min(2, recruitCount)}/2 · 과학 ${scienceReady ? '충족' : '보강 필요'} · 경제 ${economyReady ? '충족' : '보강 필요'}`);
    },
  },
  {
    id: 'unshaken-cabinet',
    title: '흔들리지 않는 내각',
    subtitle: '충성만이 아니라 역량으로 묶인 팀',
    description: '핵심 참모들의 신뢰를 지키면서 여러 부서를 숙련된 조직으로 성장시키십시오.',
    condition: '충성도 80 이상 참모 5명 · 2급 이상 참모 3명',
    category: 'organization',
    rarity: 'rare',
    points: 45,
    art: cabinetOfMindsArt,
    inspiration: 'FM식 장기 스태프 육성과 라커룸 안정 과제',
    evaluate: (snapshot) => {
      const loyal = snapshot.staff.filter((member) => member.loyalty >= 80).length;
      const senior = snapshot.staff.filter((member) => member.grade >= 2).length;
      return progress(Math.min(5, loyal) + Math.min(3, senior), 8, `고충성 참모 ${Math.min(5, loyal)}/5 · 2급 이상 ${Math.min(3, senior)}/3`);
    },
  },
  {
    id: 'prototype-age',
    title: '시제품의 시대',
    subtitle: '도면을 전력으로 바꾸는 사람',
    description: '상상한 장비를 설계하는 데 그치지 않고 여러 병과의 실제 제식 체계로 연결하십시오.',
    condition: '시제품 3종 제작 · 서로 다른 장비 분야 2종 제식 채택',
    category: 'technology',
    rarity: 'epic',
    points: 70,
    art: cabinetOfMindsArt,
    inspiration: '연구·시제품·제식 채택 수명주기 과제',
    evaluate: (snapshot) => {
      const prototypes = snapshot.equipmentDevelopment.prototypes.length;
      const fieldedIds = new Set(Object.values(snapshot.equipmentDevelopment.fieldedByCategory).filter(Boolean));
      const fieldedPrototypeCategories = new Set(snapshot.equipmentDevelopment.prototypes
        .filter((prototype) => fieldedIds.has(prototype.id))
        .map((prototype) => prototype.category)).size;
      return progress(Math.min(3, prototypes) + Math.min(2, fieldedPrototypeCategories), 5, `시제품 ${Math.min(3, prototypes)}/3 · 시제품 제식 분야 ${Math.min(2, fieldedPrototypeCategories)}/2`);
    },
  },
  {
    id: 'scientific-commonwealth',
    title: '과학 공동체',
    subtitle: '전쟁의 연구소에서 시민의 대학으로',
    description: '전시 연구 기반을 전후 교육과 장기 기술 발전의 토대로 전환하십시오.',
    condition: '연구 5개 완료 · 국가 운영 단계 교육 65 이상',
    category: 'technology',
    rarity: 'legendary',
    points: 85,
    art: authorOfHistoryArt,
    inspiration: '전시 과학에서 전후 지식국가로 이어지는 장기 과제',
    evaluate: (snapshot) => {
      const researchCount = snapshot.research.filter((project) => project.complete).length;
      const educationReady = snapshot.campaignPhase === 'nation' && snapshot.nationManagement.education >= 65;
      return progress(Math.min(5, researchCount) + completedGate(educationReady), 6, `완료 연구 ${Math.min(5, researchCount)}/5 · 교육 ${snapshot.campaignPhase === 'nation' ? Math.round(snapshot.nationManagement.education) : '전후 전환 필요'}/65`);
    },
  },
  {
    id: 'balanced-ledger',
    title: '네 번의 흑자',
    subtitle: '차입이 아닌 운영으로 버틴 국가',
    description: '단발성 자산 매각이 아니라 연속된 국정 운영으로 재정 신뢰를 증명하십시오.',
    condition: '국가 운영 주간 결산 4회 연속 재정수지 흑자',
    category: 'economy',
    rarity: 'rare',
    points: 45,
    art: negotiatedFrontArt,
    inspiration: '연속 결과를 요구하는 재정 운영 과제',
    evaluate: (snapshot) => {
      const consecutive = snapshot.nationManagement.reports.slice(0, 4).filter((report) => report.fiscalBalance >= 0).length;
      const eligibleReports = Math.min(4, snapshot.nationManagement.reports.length);
      const current = eligibleReports === 4 && consecutive === 4 ? 4 : consecutive;
      return progress(current, 4, `최근 4주 중 흑자 ${consecutive}회 · 결산 기록 ${eligibleReports}/4`);
    },
  },
  {
    id: 'price-stability',
    title: '빵값을 지킨 정부',
    subtitle: '승전보다 먼저 체감되는 평화',
    description: '충분한 기간 동안 경제를 운영한 뒤 물가와 대중의 경제 신뢰를 함께 안정시키십시오.',
    condition: '26주 이상 진행 · 물가 5% 이하 · 경제 신뢰 75 이상',
    category: 'economy',
    rarity: 'rare',
    points: 50,
    art: lifelineLogisticsArt,
    inspiration: '물가와 신뢰의 상충관계를 관리하는 민생 과제',
    evaluate: (snapshot) => {
      const timeReady = snapshot.game.week >= 26;
      const inflationReady = snapshot.economy.inflation <= 5;
      const confidenceReady = snapshot.economy.publicConfidence >= 75;
      return progress(completedGate(timeReady) + completedGate(inflationReady) + completedGate(confidenceReady), 3, `기간 ${Math.min(26, snapshot.game.week)}/26주 · 물가 ${snapshot.economy.inflation.toFixed(1)}% · 신뢰 ${Math.round(snapshot.economy.publicConfidence)}/75`);
    },
  },
  {
    id: 'industrial-portfolio',
    title: '산업의 설계자',
    subtitle: '한 기업이 아닌 국가의 포트폴리오',
    description: '역사적 기업과 산업기금에 분산 투자하면서 국가의 유동성도 보존하십시오.',
    condition: '서로 다른 기업지분 3개 보유 · 국고 £500M 이상',
    category: 'economy',
    rarity: 'epic',
    points: 60,
    art: cabinetOfMindsArt,
    inspiration: '분산 투자와 국가 유동성을 함께 요구하는 경제 과제',
    evaluate: (snapshot) => {
      const holdings = new Set(snapshot.economy.holdings.map((holding) => holding.companyId)).size;
      const treasuryReady = snapshot.game.treasury >= 500;
      return progress(Math.min(3, holdings) + completedGate(treasuryReady), 4, `보유 기업 ${Math.min(3, holdings)}/3 · 국고 £${Math.round(snapshot.game.treasury)}M/500M`);
    },
  },
  {
    id: 'epidemic-contained',
    title: '유행을 꺾은 주',
    subtitle: '전선 밖에서 구한 수천 명',
    description: '발병을 숨기거나 방치하지 않고 실제 유행을 제한된 피해로 종결하십시오.',
    condition: '감염병 유행을 ‘통제’ 결과로 종결',
    category: 'health',
    rarity: 'epic',
    points: 65,
    art: lifelineLogisticsArt,
    inspiration: '확률적 위기에 대한 장기 대응 결과 과제',
    evaluate: (snapshot) => {
      const contained = snapshot.publicHealth.history.filter((record) => record.outcome === 'contained').length;
      return progress(contained, 1, contained > 0 ? `통제 종결 ${contained}회` : '통제 결과로 종결된 유행이 없습니다');
    },
  },
  {
    id: 'prepared-state',
    title: '다음 위기 이전에',
    subtitle: '발병하지 않은 재난도 성과다',
    description: '감염병이 터진 뒤의 영웅주의보다 감시·병상·대비 체계를 미리 완성하십시오.',
    condition: '대비·감시·의료 역량 각 80 이상 · 영구 투자 3개 완료',
    category: 'health',
    rarity: 'legendary',
    points: 80,
    art: invisibleFrontArt,
    inspiration: '예방 투자와 보이지 않는 성과를 보상하는 과제',
    evaluate: (snapshot) => {
      const gates = [snapshot.publicHealth.preparedness >= 80, snapshot.publicHealth.surveillance >= 80, snapshot.publicHealth.medicalCapacity >= 80];
      const investments = snapshot.publicHealth.completedInvestments.length;
      return progress(gates.filter(Boolean).length + Math.min(3, investments), 6, `대비 ${Math.round(snapshot.publicHealth.preparedness)} · 감시 ${Math.round(snapshot.publicHealth.surveillance)} · 의료 ${Math.round(snapshot.publicHealth.medicalCapacity)} · 투자 ${Math.min(3, investments)}/3`);
    },
  },
  {
    id: 'author-of-history',
    title: '역사를 움직인 자',
    subtitle: '선언이 아니라 선택의 누적',
    description: '서로 다른 국가 원칙과 실제 위기 대응을 쌓아 세계가 자연스럽게 갈라지게 하십시오.',
    condition: '국가 원칙 4개 · 세계 위기 또는 국가 의제 결정 3개',
    category: 'history',
    rarity: 'epic',
    points: 70,
    art: authorOfHistoryArt,
    inspiration: '행동과 결과의 누적을 보상하는 문명식 복합 과제',
    evaluate: (snapshot) => {
      const flashpoints = snapshot.completedDecisions.filter((id) => id.startsWith('world-flashpoint:')).length;
      const councilChoices = snapshot.events.filter((event) => event.title.startsWith('국가 의제 결론')).length;
      const decisions = flashpoints + councilChoices;
      return progress(Math.min(4, snapshot.selectedPolicies.length) + Math.min(3, decisions), 7, `국가 원칙 ${Math.min(4, snapshot.selectedPolicies.length)}/4 · 실제 분기 결정 ${Math.min(3, decisions)}/3`);
    },
  },
  {
    id: 'impossible-future',
    title: '불가능한 미래의 전제',
    subtitle: '사건 하나가 아니라 제도를 바꾼다',
    description: '장기간의 세계 위기 결정을 축적하고 이를 뒷받침할 과학 기반까지 확보하십시오.',
    condition: '세계 위기 5개 직접 해결 · 연구 4개 완료',
    category: 'history',
    rarity: 'legendary',
    points: 95,
    art: authorOfHistoryArt,
    inspiration: '장기 선택과 시스템 성취가 함께 필요한 대체역사 과제',
    evaluate: (snapshot) => {
      const flashpoints = snapshot.completedDecisions.filter((id) => id.startsWith('world-flashpoint:')).length;
      const researchCount = snapshot.research.filter((project) => project.complete).length;
      return progress(Math.min(5, flashpoints) + Math.min(4, researchCount), 9, `직접 해결한 세계 위기 ${Math.min(5, flashpoints)}/5 · 완료 연구 ${Math.min(4, researchCount)}/4`);
    },
  },
  {
    id: 'peace-dividend',
    title: '평화의 배당',
    subtitle: '공장을 닫지 않고 목적을 바꾸다',
    description: '전쟁의 생산력을 대량 실업 없이 민간 산업과 재건의 성장으로 전환하십시오.',
    condition: '국가 운영 단계 · 민수 산업 65 · 고용 65 · 인프라 60',
    category: 'governance',
    rarity: 'epic',
    points: 70,
    art: warEndedArt,
    inspiration: '군수 동원에서 민수 경제로의 구조 전환 과제',
    evaluate: (snapshot) => {
      const phaseReady = snapshot.campaignPhase === 'nation';
      const industryReady = snapshot.nationManagement.civilianIndustry >= 65;
      const employmentReady = snapshot.nationManagement.employment >= 65;
      const infrastructureReady = snapshot.nationManagement.infrastructure >= 60;
      return progress([phaseReady, industryReady, employmentReady, infrastructureReady].filter(Boolean).length, 4, `전후 ${phaseReady ? '진입' : '미진입'} · 민수 ${Math.round(snapshot.nationManagement.civilianIndustry)}/65 · 고용 ${Math.round(snapshot.nationManagement.employment)}/65 · 인프라 ${Math.round(snapshot.nationManagement.infrastructure)}/60`);
    },
  },
  {
    id: 'social-contract-achievement',
    title: '새로운 사회계약',
    subtitle: '국가가 국민에게 돌려준 약속',
    description: '복지와 교육을 확대하면서 구조적 불평등을 낮춘 전후 국가를 만드십시오.',
    condition: '국가 운영 단계 · 복지 70 · 교육 70 · 불평등 35 이하',
    category: 'governance',
    rarity: 'legendary',
    points: 90,
    art: negotiatedFrontArt,
    inspiration: '성장 외의 삶과 분배를 독립된 승리로 인정하는 과제',
    evaluate: (snapshot) => {
      const phaseReady = snapshot.campaignPhase === 'nation';
      const welfareReady = snapshot.nationManagement.welfare >= 70;
      const educationReady = snapshot.nationManagement.education >= 70;
      const equalityReady = snapshot.nationManagement.inequality <= 35;
      return progress([phaseReady, welfareReady, educationReady, equalityReady].filter(Boolean).length, 4, `전후 ${phaseReady ? '진입' : '미진입'} · 복지 ${Math.round(snapshot.nationManagement.welfare)}/70 · 교육 ${Math.round(snapshot.nationManagement.education)}/70 · 불평등 ${Math.round(snapshot.nationManagement.inequality)}/35 이하`);
    },
  },
  {
    id: 'renewed-mandate',
    title: '다시 받은 위임',
    subtitle: '전쟁의 권력이 선거를 통과하다',
    description: '전시 지도부의 권위를 강요하지 않고 국민 평가를 통과해 다음 임기를 확보하십시오.',
    condition: '국민 평가 승리 1회 · 현재 국민 위임 60 이상',
    category: 'governance',
    rarity: 'legendary',
    points: 100,
    art: fromFieldToCommandArt,
    inspiration: '208주 장기 국가 운영과 민주적 정통성 과제',
    evaluate: (snapshot) => {
      const electionReady = snapshot.nationManagement.electionWins >= 1;
      const mandateReady = snapshot.nationManagement.mandateScore >= 60;
      return progress(completedGate(electionReady) + completedGate(mandateReady), 2, `국민 평가 승리 ${snapshot.nationManagement.electionWins}/1 · 위임 ${snapshot.nationManagement.mandateScore}/60`);
    },
  },
  {
    id: 'from-field-to-command',
    title: '현장에서 최고 지휘부까지',
    subtitle: '보직이 곧 서사가 된다',
    description: '1성 현장 보직에서 시작해 네 번의 전시 승진을 거쳐 5성 국가 최고위층에 진입하십시오.',
    condition: '5급 보직 경력에서 전시 승진 4회 · 1급 보직 도달',
    category: 'career',
    rarity: 'epic',
    points: 65,
    art: fromFieldToCommandArt,
    inspiration: '하부 리그에서 정상까지 오르는 장기 경력 과제',
    evaluate: (snapshot) => {
      const promotions = snapshot.events.filter((event) => event.title.includes('전시 승진')).length;
      const current = Math.min(4, promotions) + completedGate(snapshot.careerTier === 1);
      return progress(current, 5, `승진 ${Math.min(4, promotions)}/4 · 현재 보직 TIER ${snapshot.careerTier}`);
    },
  },
  {
    id: 'negotiated-front',
    title: '협상으로 얻은 전선',
    subtitle: '서명 하나가 사단보다 강할 때',
    description: '국가별 외교 의제를 성사시키고 핵심 파트너와 확고한 신뢰를 구축하십시오.',
    condition: '국가 외교 의제 완료 · 관계도 90 이상 확보',
    category: 'diplomacy',
    rarity: 'rare',
    points: 45,
    art: negotiatedFrontArt,
    inspiration: '외교 목표와 세계 상태 결합형 과제',
    evaluate: (snapshot) => {
      const agendaReady = snapshot.completedDecisions.some((id) => id.startsWith('diplomatic-agenda-'));
      const bestRelation = Math.max(0, ...snapshot.relations.map((relation) => relation.value));
      const relationReady = bestRelation >= 90;
      return progress(completedGate(agendaReady) + completedGate(relationReady), 2, `외교 의제 ${agendaReady ? '완료' : '미완료'} · 최고 관계도 ${Math.round(bestRelation)}`);
    },
  },
  {
    id: 'league-of-many',
    title: '셋 이상의 동맹',
    subtitle: '양극이 아닌 다극의 안전망',
    description: '한 강대국에 종속되지 않고 여러 국가와 동시에 높은 신뢰를 구축하십시오.',
    condition: '관계도 80 이상 국가 3개',
    category: 'diplomacy',
    rarity: 'epic',
    points: 60,
    art: negotiatedFrontArt,
    inspiration: '다극 외교와 관계 포트폴리오 과제',
    evaluate: (snapshot) => {
      const trusted = snapshot.relations.filter((relation) => relation.value >= 80).length;
      return progress(trusted, 3, `고신뢰 국가 ${Math.min(3, trusted)}/3`);
    },
  },
  {
    id: 'long-peace',
    title: '전쟁 이후의 1년',
    subtitle: '평화는 사건이 아니라 운영이다',
    description: '종전 이후 한 해 동안 국가 성과를 높이고 사회 불안을 낮게 유지하십시오.',
    condition: '국가 운영 결산 52주 · 국가 성과 65 · 사회 불안 35 이하',
    category: 'legacy',
    rarity: 'legendary',
    points: 110,
    art: warEndedArt,
    inspiration: '엔딩 이후에도 이어지는 장기 국가 운영 완주 과제',
    evaluate: (snapshot) => {
      const weeks = snapshot.nationManagement.reports.length;
      const scoreReady = snapshot.nationManagement.nationalScore >= 65;
      const unrestReady = snapshot.nationManagement.unrest <= 35;
      return progress(Math.min(52, weeks) + completedGate(scoreReady) + completedGate(unrestReady), 54, `국정 ${Math.min(52, weeks)}/52주 · 국가 성과 ${snapshot.nationManagement.nationalScore}/65 · 사회 불안 ${Math.round(snapshot.nationManagement.unrest)}/35 이하`);
    },
  },
  {
    id: 'war-ended',
    title: '전쟁을 끝낸 사람',
    subtitle: '승리보다 어려운 마지막 결정',
    description: '자신이 만든 대체역사 속에서 전쟁을 승리로 끝내고 전후 질서를 여십시오.',
    condition: '캠페인 승리 달성',
    category: 'legacy',
    rarity: 'legendary',
    points: 90,
    art: warEndedArt,
    inspiration: '캠페인 종결과 유산을 기념하는 최종 과제',
    evaluate: (snapshot) => progress(snapshot.campaignOutcome === 'victory' ? 90 : Math.min(89, snapshot.game.victoryScore), 90, snapshot.campaignOutcome === 'victory' ? '승전과 전후 질서 개막' : `승리 점수 ${Math.round(snapshot.game.victoryScore)}/90`),
  },
];

export function evaluateAchievements(snapshot: AchievementSnapshot): Record<string, AchievementProgress> {
  return Object.fromEntries(achievementDefinitions.map((achievement) => [achievement.id, achievement.evaluate(snapshot)]));
}

const achievementRarityWeight: Record<AchievementRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

function recommendationScore(achievement: AchievementDefinition, state: AchievementProgress | undefined) {
  const percent = state?.percent ?? 0;
  const startedBonus = percent > 0 ? 180 : 0;
  const completionBonus = state?.complete ? 500 : 0;
  return completionBonus + startedBonus + percent * 3 + achievement.points * 0.22 + achievementRarityWeight[achievement.rarity] * 2;
}

export function sortAchievementDefinitions(
  progressById: Record<string, AchievementProgress>,
  unlockedIds: ReadonlySet<string>,
  mode: AchievementSortMode,
): AchievementDefinition[] {
  const originalOrder = new Map(achievementDefinitions.map((achievement, index) => [achievement.id, index]));
  return [...achievementDefinitions].sort((left, right) => {
    const leftProgress = progressById[left.id];
    const rightProgress = progressById[right.id];
    if (mode === 'recommended') {
      const unlockDifference = Number(unlockedIds.has(left.id)) - Number(unlockedIds.has(right.id));
      if (unlockDifference !== 0) return unlockDifference;
      const scoreDifference = recommendationScore(right, rightProgress) - recommendationScore(left, leftProgress);
      if (scoreDifference !== 0) return scoreDifference;
    }
    if (mode === 'progress') {
      const progressDifference = (rightProgress?.percent ?? 0) - (leftProgress?.percent ?? 0);
      if (progressDifference !== 0) return progressDifference;
    }
    if (mode === 'points') {
      const pointDifference = right.points - left.points;
      if (pointDifference !== 0) return pointDifference;
    }
    if (mode === 'rarity') {
      const rarityDifference = achievementRarityWeight[right.rarity] - achievementRarityWeight[left.rarity];
      if (rarityDifference !== 0) return rarityDifference;
      const pointDifference = right.points - left.points;
      if (pointDifference !== 0) return pointDifference;
    }
    return (originalOrder.get(left.id) ?? 0) - (originalOrder.get(right.id) ?? 0);
  });
}

export function getAchievementRecommendations(
  progressById: Record<string, AchievementProgress>,
  unlockedIds: ReadonlySet<string>,
  limit = 3,
) {
  return sortAchievementDefinitions(progressById, unlockedIds, 'recommended')
    .filter((achievement) => !unlockedIds.has(achievement.id))
    .slice(0, Math.max(0, limit));
}

export function getAchievement(id: string): AchievementDefinition | undefined {
  return achievementDefinitions.find((achievement) => achievement.id === id);
}

export function normalizeTrackedAchievementId(value: unknown): string | null {
  return typeof value === 'string' && getAchievement(value) ? value : null;
}

export function normalizeAchievementUnlocks(value: unknown): AchievementUnlock[] {
  if (!Array.isArray(value)) return [];
  const validIds = new Set(achievementDefinitions.map((achievement) => achievement.id));
  const seen = new Set<string>();
  return value.filter((entry): entry is AchievementUnlock => {
    if (!entry || typeof entry !== 'object') return false;
    const candidate = entry as Partial<AchievementUnlock>;
    if (typeof candidate.id !== 'string' || !validIds.has(candidate.id) || seen.has(candidate.id)) return false;
    if (typeof candidate.unlockedWeek !== 'number' || typeof candidate.unlockedAt !== 'string') return false;
    seen.add(candidate.id);
    return true;
  });
}
