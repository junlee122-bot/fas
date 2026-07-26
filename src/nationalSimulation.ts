import type { EconomyState } from './economy';
import type { CampaignPhase, NationManagementState } from './nationManagement';
import { getNationPoliticalProfile } from './politicalCrisis';
import type { CoupRiskAssessment, PoliticalCrisisState } from './politicalCrisis';
import type { PublicHealthState } from './publicHealth';
import type {
  Division,
  GameState,
  GameTab,
  NationId,
  ProductionLine,
  ResearchProject,
  Stockpile,
  StrategicPolicy,
} from './types';

export type SimulationStatus = 'stable' | 'watch' | 'strained' | 'critical';

export interface PopulationGroup {
  id: string;
  name: string;
  share: number;
  standardOfLiving: number;
  approval: number;
  radicalism: number;
  contribution: string;
  primaryNeed: string;
  trend: 'improving' | 'steady' | 'declining';
}

export interface PowerBloc {
  id: string;
  name: string;
  clout: number;
  approval: number;
  status: 'government' | 'cooperative' | 'opposition';
  agenda: string;
  grievance: string;
  destination: GameTab;
}

export interface NationalInstitution {
  id: string;
  name: string;
  level: number;
  capacityCost: number;
  coverage: number;
  legalBasis: string;
  effect: string;
  status: SimulationStatus;
  destination: GameTab;
}

export interface MarketGood {
  id: string;
  name: string;
  priceIndex: number;
  availability: number;
  weeklyBalance: number;
  status: SimulationStatus;
  driver: string;
  destination: GameTab;
}

export interface NationalPressure {
  id: string;
  title: string;
  severity: 'medium' | 'high' | 'critical';
  cause: string;
  consequence: string;
  actionLabel: string;
  destination: GameTab;
}

export interface NationalSimulationSnapshot {
  standardOfLiving: number;
  marketAccess: number;
  administrativeCapacity: number;
  administrativeCapacityUsed: number;
  socialCohesion: number;
  populationGroups: PopulationGroup[];
  powerBlocs: PowerBloc[];
  institutions: NationalInstitution[];
  goods: MarketGood[];
  pressures: NationalPressure[];
}

export interface NationalSimulationInput {
  nationId: NationId;
  phase: CampaignPhase;
  game: GameState;
  economy: EconomyState;
  stockpile: Stockpile;
  production: ProductionLine[];
  divisions: Division[];
  research: ResearchProject[];
  publicHealth: PublicHealthState;
  selectedPolicies: StrategicPolicy[];
  politicalState: PoliticalCrisisState;
  coupRisk: CoupRiskAssessment;
  nationManagement: NationManagementState;
}

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 0) => Number(value.toFixed(digits));
const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);

function normalizeShares(entries: Array<Omit<PopulationGroup, 'share'> & { weight: number }>): PopulationGroup[] {
  const total = entries.reduce((sum, entry) => sum + Math.max(1, entry.weight), 0);
  const normalized = entries.map(({ weight, ...entry }) => ({ ...entry, share: round((Math.max(1, weight) / total) * 100, 1) }));
  const correction = round(100 - normalized.reduce((sum, entry) => sum + entry.share, 0), 1);
  if (normalized[0]) normalized[0].share = round(normalized[0].share + correction, 1);
  return normalized;
}

function statusForAvailability(value: number): SimulationStatus {
  if (value < 35) return 'critical';
  if (value < 52) return 'strained';
  if (value < 68) return 'watch';
  return 'stable';
}

function statusForCoverage(value: number): SimulationStatus {
  if (value < 30) return 'critical';
  if (value < 50) return 'strained';
  if (value < 70) return 'watch';
  return 'stable';
}

function marketGood(
  id: string,
  name: string,
  availability: number,
  inflation: number,
  driver: string,
  destination: GameTab,
): MarketGood {
  const boundedAvailability = round(clamp(availability), 1);
  return {
    id,
    name,
    availability: boundedAvailability,
    priceIndex: round(clamp(100 + (65 - boundedAvailability) * 1.35 + inflation * 0.8, 60, 220), 1),
    weeklyBalance: round((boundedAvailability - 60) * 0.62, 1),
    status: statusForAvailability(boundedAvailability),
    driver,
    destination,
  };
}

export function deriveNationalSimulation(input: NationalSimulationInput): NationalSimulationSnapshot {
  const {
    phase,
    game,
    economy,
    stockpile,
    production,
    divisions,
    research,
    publicHealth,
    selectedPolicies,
    politicalState,
    coupRisk,
    nationManagement,
  } = input;
  const averageSupply = average(divisions.map((division) => division.supply));
  const activeFactories = production.reduce((total, line) => total + line.assigned, 0);
  const completedResearch = research.filter((project) => project.complete).length;
  const hasPolicy = (id: string) => selectedPolicies.some((policy) => policy.id === id);
  const welfarePolicy = hasPolicy('society-welfare');
  const autonomyPolicy = hasPolicy('society-autonomy');
  const massMobilization = hasPolicy('society-mobilization');
  const balancedEconomy = hasPolicy('economy-balanced');

  const institutionalBase = phase === 'nation'
    ? nationManagement.institutionalCapacity
    : 34 + game.politicalPower * 0.27 + game.intelNetwork * 0.18;
  const administrativeCapacity = round(clamp(institutionalBase, 24, 140));

  const rationingLevel = economy.priceControl === 'comprehensive' ? 5 : economy.priceControl === 'targeted' ? 3 : 1;
  const healthLevel = Math.max(1, Math.min(5, Math.round((publicHealth.medicalCapacity + publicHealth.preparedness * 0.4) / 28)));
  const educationLevel = Math.max(1, Math.min(5, Math.round((completedResearch * 8 + (phase === 'nation' ? nationManagement.education : 35)) / 24)));
  const logisticsLevel = Math.max(1, Math.min(5, Math.round((averageSupply + stockpile.trucks / 35 + stockpile.convoys / 8) / 31)));
  const securityLevel = Math.max(1, Math.min(5, Math.round((game.intelNetwork + game.stability + (100 - coupRisk.score)) / 58)));
  const institutionDrafts = [
    { id: 'economic-administration', name: '배급·경제 행정', level: rationingLevel, legalBasis: economy.priceControl === 'none' ? '시장 가격 허용' : economy.priceControl === 'targeted' ? '필수재 최고가격령' : '전면 가격·임금 통제령', effect: '필수재 가격과 민간 배급을 조정합니다.', destination: 'economy' as const },
    { id: 'public-health', name: '보건 체계', level: healthLevel, legalBasis: publicHealth.policyId === 'sentinel' ? '감시 중심 보건령' : '비상 방역 체계', effect: '병상, 감시망, 유행 대응력을 제공합니다.', destination: 'health' as const },
    { id: 'education-science', name: '교육·과학 체계', level: educationLevel, legalBasis: phase === 'nation' ? '국가 교육·연구 예산' : '전시 연구동원령', effect: '연구 인력과 장기 생산성을 높입니다.', destination: 'research' as const },
    { id: 'national-logistics', name: '국가 물류망', level: logisticsLevel, legalBasis: phase === 'nation' ? '교통·재건 계획' : '군수 우선 수송령', effect: '전선 보급과 시장 접근성을 연결합니다.', destination: 'industry' as const },
    { id: 'home-affairs', name: '내무·국가안전', level: securityLevel, legalBasis: autonomyPolicy ? '지방 자치·협력 치안령' : '중앙 내무·방첩령', effect: '정치 폭력과 쿠데타 조직화를 억제합니다.', destination: 'governance' as const },
  ];
  const administrativeCapacityUsed = institutionDrafts.reduce((sum, institution) => sum + institution.level * 6, 0);
  const capacityRatio = Math.min(1, administrativeCapacity / Math.max(1, administrativeCapacityUsed));
  const institutions: NationalInstitution[] = institutionDrafts.map((institution) => {
    const coverage = round(clamp(institution.level * 20 * capacityRatio));
    return {
      ...institution,
      capacityCost: institution.level * 6,
      coverage,
      status: statusForCoverage(coverage),
    };
  });

  const activeOutbreakPenalty = publicHealth.activeOutbreak
    ? publicHealth.activeOutbreak.hospitalLoad * 0.45 + Math.min(22, publicHealth.activeOutbreak.weeklyCases / 8500)
    : 0;
  const goods = [
    marketGood('food', '식량·배급품', 77 + game.stability * 0.12 - economy.inflation * 1.7 - game.enemyPressure * 0.18 + rationingLevel * 3, economy.inflation, '안정도·물가·배급 제도', 'economy'),
    marketGood('fuel', '연료', game.fuel * 0.82 + averageSupply * 0.18 - game.enemyPressure * 0.13, economy.inflation, '비축량·전선 소모·해상 접근', 'industry'),
    marketGood('steel', '철강·공업재', game.steel * 0.58 + game.factories * 0.72 - activeFactories * 0.42, economy.inflation, '철강 비축·가동 공장·생산 배정', 'industry'),
    marketGood('transport', '수송력', stockpile.trucks / 7 + stockpile.convoys / 2.2 + game.navalPower * 0.28 - game.enemyPressure * 0.16, economy.inflation, '트럭·선단·제해권', 'map'),
    marketGood('consumer', '민간 소비재', economy.publicConfidence * 0.62 + game.stability * 0.28 - economy.inflation * 1.45 - game.warSupport * 0.1 + (balancedEconomy ? 8 : 0), economy.inflation, '민간 신뢰·전시 동원·인플레이션', 'economy'),
    marketGood('medicine', '의약품·병상', publicHealth.medicalCapacity * 0.68 + publicHealth.preparedness * 0.24 - activeOutbreakPenalty, economy.inflation, '의료 역량·대비도·유행 부하', 'health'),
  ];
  const marketAccess = round(average(goods.map((good) => good.availability)));

  const baseLivingStandard = clamp(
    7.3
    + economy.publicConfidence * 0.055
    + game.stability * 0.035
    - economy.inflation * 0.16
    + (marketAccess - 50) * 0.035
    + (welfarePolicy ? 0.8 : 0)
    + (phase === 'nation' ? (nationManagement.welfare - nationManagement.inequality * 0.45) * 0.018 : 0),
    3,
    20,
  );
  const commonRadicalism = clamp((100 - game.stability) * 0.34 + economy.inflation * 1.25 + coupRisk.score * 0.22);
  const populationGroups = normalizeShares([
    {
      id: 'rural', name: '농촌 가구', weight: 32 - game.factories * 0.12, standardOfLiving: round(clamp(baseLivingStandard - 1.1, 1, 20), 1), approval: round(clamp(game.stability - economy.inflation * 1.4 + (autonomyPolicy ? 12 : 0), -100, 100)), radicalism: round(clamp(commonRadicalism + economy.inflation * 0.8 - (autonomyPolicy ? 8 : 0))), contribution: '식량·지역 운송·징집 기반', primaryNeed: marketAccess < 58 ? '배급망과 농산물 가격 안정' : '농촌 신용과 자치권', trend: economy.inflation > 10 ? 'declining' as const : autonomyPolicy ? 'improving' as const : 'steady' as const,
    },
    {
      id: 'industrial-workers', name: '산업 노동자', weight: 14 + game.factories * 0.34, standardOfLiving: round(clamp(baseLivingStandard - economy.inflation * 0.025, 1, 20), 1), approval: round(clamp(game.stability - economy.inflation * 1.8 + (welfarePolicy ? 15 : 0) - (massMobilization ? 7 : 0), -100, 100)), radicalism: round(clamp(commonRadicalism + activeFactories * 0.22 - (welfarePolicy ? 10 : 0))), contribution: '군수·철강·수송 생산', primaryNeed: '실질임금과 노동 안전', trend: welfarePolicy ? 'improving' as const : economy.inflation > 8 ? 'declining' as const : 'steady' as const,
    },
    {
      id: 'professional', name: '전문직·기술 관료', weight: 11 + completedResearch * 1.2, standardOfLiving: round(clamp(baseLivingStandard + 1.4, 1, 20), 1), approval: round(clamp(administrativeCapacity - administrativeCapacityUsed + game.politicalPower * 0.35, -100, 100)), radicalism: round(clamp(commonRadicalism - 12 + Math.max(0, administrativeCapacityUsed - administrativeCapacity))), contribution: '행정·연구·의료 역량', primaryNeed: '제도 역량과 전문성 보장', trend: capacityRatio < 0.82 ? 'declining' as const : educationLevel >= 3 ? 'improving' as const : 'steady' as const,
    },
    {
      id: 'armed-forces', name: '군인·참전 집단', weight: 8 + divisions.length * 1.15 + (massMobilization ? 5 : 0), standardOfLiving: round(clamp(baseLivingStandard + (averageSupply - 50) * 0.025, 1, 20), 1), approval: round(clamp(game.warSupport + averageSupply * 0.35 - game.enemyPressure * 0.28, -100, 100)), radicalism: round(clamp(commonRadicalism + (55 - averageSupply) * 0.45 + coupRisk.score * 0.18)), contribution: '국방·치안·전후 조직력', primaryNeed: averageSupply < 55 ? '보급과 지휘 신뢰 회복' : '복무 보상과 전후 지위', trend: averageSupply < 50 ? 'declining' as const : game.victoryScore > 60 ? 'improving' as const : 'steady' as const,
    },
    {
      id: 'owners', name: '기업·자산 보유층', weight: 9 + economy.publicConfidence * 0.035, standardOfLiving: round(clamp(baseLivingStandard + 3.2, 1, 20), 1), approval: round(clamp(economy.publicConfidence - economy.inflation + (economy.priceControl === 'comprehensive' ? -22 : 5), -100, 100)), radicalism: round(clamp(commonRadicalism - 8 + (economy.priceControl === 'comprehensive' ? 18 : 0))), contribution: '투자·생산 설비·대외 무역', primaryNeed: '재산권과 예측 가능한 계약', trend: economy.publicConfidence > 62 ? 'improving' as const : economy.inflation > 12 ? 'declining' as const : 'steady' as const,
    },
    {
      id: 'displaced', name: phase === 'war' ? '피난민·점령지 주민' : '이주민·지역 소수집단', weight: 7 + game.enemyPressure * 0.06 + (phase === 'nation' ? nationManagement.unrest * 0.04 : 0), standardOfLiving: round(clamp(baseLivingStandard - 3, 1, 20), 1), approval: round(clamp(game.stability - game.enemyPressure - (phase === 'nation' ? nationManagement.unrest : 0) + (autonomyPolicy ? 18 : 0), -100, 100)), radicalism: round(clamp(commonRadicalism + game.enemyPressure * 0.24 + (phase === 'nation' ? nationManagement.unrest * 0.22 : 0) - (autonomyPolicy ? 12 : 0))), contribution: '지역 정보·노동력·정통성', primaryNeed: '안전, 대표권, 귀환·정착 지원', trend: autonomyPolicy || nationManagement.welfare > 62 ? 'improving' as const : 'declining' as const,
    },
  ]);
  const standardOfLiving = round(populationGroups.reduce((sum, group) => sum + group.standardOfLiving * group.share / 100, 0), 1);

  const politicalProfile = getNationPoliticalProfile(input.nationId);
  const rawClout = politicalProfile.factions.map((faction) => {
    const standing = politicalState.factionStandings[faction.id] ?? { support: faction.baseSupport, grievance: 30, organization: faction.baseOrganization };
    return { faction, standing, weight: Math.max(1, standing.support * 0.68 + standing.organization * 0.32) };
  });
  const totalClout = rawClout.reduce((sum, item) => sum + item.weight, 0);
  const powerBlocs: PowerBloc[] = rawClout.map(({ faction, standing, weight }, index) => {
    const approval = round(clamp(55 - standing.grievance + game.stability * 0.18 - coupRisk.score * 0.08, -100, 100));
    return {
      id: faction.id,
      name: faction.name,
      clout: round((weight / totalClout) * 100, index === 0 ? 2 : 1),
      approval,
      status: index === 0 && approval > -15 ? 'government' : approval >= 10 ? 'cooperative' : 'opposition',
      agenda: faction.agenda,
      grievance: faction.grievance,
      destination: faction.kind === 'military' ? 'organization' : faction.kind === 'security' || faction.kind === 'resistance' ? 'intelligence' : 'governance',
    };
  });
  const cloutCorrection = round(100 - powerBlocs.reduce((sum, bloc) => sum + bloc.clout, 0), 1);
  if (powerBlocs[0]) powerBlocs[0].clout = round(powerBlocs[0].clout + cloutCorrection, 1);
  const socialCohesion = round(clamp(
    game.stability * 0.36
    + economy.publicConfidence * 0.22
    + (100 - coupRisk.score) * 0.22
    + (100 - (phase === 'nation' ? nationManagement.unrest : commonRadicalism)) * 0.2,
  ));

  const pressures: NationalPressure[] = [];
  const weakestGood = [...goods].sort((left, right) => left.availability - right.availability)[0];
  if (weakestGood.availability < 60) pressures.push({
    id: `market-${weakestGood.id}`,
    title: `${weakestGood.name} 공급 압력`,
    severity: weakestGood.availability < 35 ? 'critical' : weakestGood.availability < 50 ? 'high' : 'medium',
    cause: `${weakestGood.driver} → 공급 ${Math.round(weakestGood.availability)} → 가격지수 ${Math.round(weakestGood.priceIndex)}`,
    consequence: '가계 생활수준과 생산비가 함께 악화되어 불만과 정치적 급진화로 이어질 수 있습니다.',
    actionLabel: weakestGood.destination === 'map' ? '수송로 점검' : '공급 대책 열기',
    destination: weakestGood.destination,
  });
  if (administrativeCapacityUsed > administrativeCapacity) pressures.push({
    id: 'administrative-deficit',
    title: '행정역량 과부하',
    severity: administrativeCapacityUsed > administrativeCapacity * 1.25 ? 'critical' : 'high',
    cause: `제도 비용 ${administrativeCapacityUsed} → 가용 행정력 ${administrativeCapacity} → 실효 적용률 ${Math.round(capacityRatio * 100)}%`,
    consequence: '법을 제정해도 현장 적용이 지연되며 모든 제도의 효과가 동시에 낮아집니다.',
    actionLabel: '국정 역량 조정',
    destination: 'governance',
  });
  if (coupRisk.tier !== 'stable') pressures.push({
    id: 'power-struggle',
    title: `${coupRisk.leadingFaction.name} · ${coupRisk.crisisLabel}`,
    severity: coupRisk.tier === 'critical' ? 'critical' : coupRisk.tier === 'dangerous' ? 'high' : 'medium',
    cause: `집단 불만·조직화 → ${coupRisk.crisisLabel} 위험 ${coupRisk.score} → 주간 발발률 ${coupRisk.weeklyChance.toFixed(1)}%`,
    consequence: '정책 지연, 지휘 불복종, 연정 붕괴 또는 정권 교체 가능성이 커집니다.',
    actionLabel: '권력집단 관리',
    destination: 'governance',
  });
  if (publicHealth.activeOutbreak || publicHealth.weeklyRisk > 0.045) pressures.push({
    id: 'health-pressure',
    title: publicHealth.activeOutbreak ? `${publicHealth.activeOutbreak.codeName} 보건 위기` : '감염병 유입 위험',
    severity: publicHealth.activeOutbreak?.hospitalLoad && publicHealth.activeOutbreak.hospitalLoad > 80 ? 'critical' : 'high',
    cause: publicHealth.activeOutbreak ? `병상 부하 ${Math.round(publicHealth.activeOutbreak.hospitalLoad)}% → 의료 공급 ${Math.round(goods.find((good) => good.id === 'medicine')?.availability ?? 0)}` : `주간 위험 ${(publicHealth.weeklyRisk * 100).toFixed(2)}% → 감시 ${Math.round(publicHealth.surveillance)}`,
    consequence: '노동력, 전선 보급, 민간 신뢰가 동시에 훼손될 수 있습니다.',
    actionLabel: '보건 지휘실',
    destination: 'health',
  });
  if (standardOfLiving < 9.5) pressures.push({
    id: 'living-standard',
    title: '생활수준 하락',
    severity: standardOfLiving < 7 ? 'critical' : 'high',
    cause: `물가 ${economy.inflation.toFixed(1)}% + 시장 접근 ${marketAccess} → 생활수준 ${standardOfLiving.toFixed(1)}`,
    consequence: '노동 생산성과 충성도가 내려가고 급진 세력의 모집 기반이 넓어집니다.',
    actionLabel: '민생 예산 검토',
    destination: 'economy',
  });
  const fallbacks: NationalPressure[] = [
    { id: 'industrial-balance', title: '군수와 민생 생산의 균형', severity: 'medium', cause: `공장 ${game.factories}개 중 ${activeFactories}개 배정 → 소비재 공급 ${Math.round(goods.find((good) => good.id === 'consumer')?.availability ?? 0)}`, consequence: '군수 우선순위는 단기 전투력을 높이지만 생활수준과 장기 세입 기반을 낮출 수 있습니다.', actionLabel: '생산 배정 열기', destination: 'industry' },
    { id: 'institutional-choice', title: '제도 확대의 다음 선택', severity: 'medium', cause: `가용 행정력 ${administrativeCapacity} → 사용 ${administrativeCapacityUsed} → 미사용 ${Math.max(0, administrativeCapacity - administrativeCapacityUsed)}`, consequence: '남은 역량을 어느 제도에 투입하는지에 따라 다음 세대의 국가 구조가 달라집니다.', actionLabel: '국가 제도 보기', destination: 'governance' },
    { id: 'political-balance', title: '권력집단 연합 유지', severity: 'medium', cause: `사회 결속 ${socialCohesion} → 최대 영향력 ${Math.max(...powerBlocs.map((bloc) => bloc.clout)).toFixed(1)}%`, consequence: '연합을 넓히면 개혁 속도가 느려지고, 좁히면 반대파의 조직화가 빨라집니다.', actionLabel: '연합 점검', destination: 'governance' },
  ];
  fallbacks.forEach((pressure) => {
    if (pressures.length < 3 && !pressures.some((item) => item.id === pressure.id)) pressures.push(pressure);
  });

  return {
    standardOfLiving,
    marketAccess,
    administrativeCapacity,
    administrativeCapacityUsed,
    socialCohesion,
    populationGroups,
    powerBlocs,
    institutions,
    goods,
    pressures: pressures.slice(0, 3),
  };
}
