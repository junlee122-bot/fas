import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleDollarSign,
  Clock3,
  CloudRain,
  Cog,
  Crosshair,
  Eye,
  Factory,
  FlaskConical,
  Fuel,
  Handshake,
  Landmark,
  Lightbulb,
  LockKeyhole,
  Map,
  Menu,
  Minus,
  Pause,
  Plane,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  SkipForward,
  Star,
  Swords,
  Target,
  TrendingUp,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import {
  initialOperations,
  initialRelations,
  initialResearch,
  territories as initialTerritories,
  worldNews,
} from './data';
import type {
  BattleReport,
  BattleStance,
  Division,
  DiplomaticRelation,
  CovertOperation,
  CareerRole,
  CareerState,
  Commander,
  CommanderDevelopment,
  CommanderSkillId,
  Faction,
  GameState,
  GameTab,
  Order,
  MapLayer,
  NationId,
  NationProfile,
  ProductionLine,
  ResearchProject,
  StaffCandidate,
  StaffMember,
  Stockpile,
  SupplyPolicy,
  Territory,
  TheaterId,
  WarEvent,
} from './types';
import type { CampaignOutcome } from './types';
import { calculateDefensivePower, calculateEnemyPower, calculateProductionGains, selectThreatenedTerritory } from './engine';
import {
  careerRoles,
  createCampaignDivisions,
  createCampaignProduction,
  createCareerCommanders,
  createCareerState,
  createCovertOperations,
  createDiplomaticRelations,
  createStaffRoster,
  createStaffCandidates,
  getNation,
  getRole,
} from './campaign';
import { CampaignSetup } from './CampaignSetup';
import { OrganizationPanel } from './OrganizationPanel';
import { CouncilEventModal } from './CouncilEventModal';
import { councilEvents, strategicPolicies } from './choices';
import { resolveBattle } from './combat';
import { BattleReportModal } from './BattleReportModal';
import { BattleDoctrinePanel } from './BattleDoctrinePanel';
import { CommanderDevelopmentPanel } from './CommanderDevelopmentPanel';
import { ActionCenter } from './ActionCenter';
import { SettingsModal } from './SettingsModal';
import { WarJournal } from './WarJournal';
import { ConfirmResetModal } from './ConfirmResetModal';
import { CommandPalette } from './CommandPalette';
import type { CommandPaletteItem } from './CommandPalette';
import { FieldManual } from './FieldManual';
import {
  applyCommanderDevelopment,
  createCommanderDevelopment,
  getAvailableSkillPoints,
  getBattleHonor,
  getCommanderRecord,
  recordBattleExperience,
  recoverCommanderFatigue,
  restCommander,
  unlockCommanderSkill,
} from './development';
import { defaultUXPreferences, deriveOnboardingSteps, deriveUXActions, normalizeUXPreferences } from './ux';
import type { UXAction, UXPreferences } from './ux';

const SAVE_KEY = 'iron-dominion-campaign-v1';
const UX_SETTINGS_KEY = 'iron-dominion-ux-v1';
const DEFAULT_NATION_ID: NationId = 'britain';
const DEFAULT_ROLE_ID = 'britain-tier2';

const initialGame: GameState = {
  week: 0,
  manpower: 1280,
  politicalPower: 86,
  fuel: 74,
  steel: 112,
  factories: 30,
  stability: 78,
  warSupport: 84,
  commandPoints: 42,
  treasury: 920,
  victoryScore: 38,
  airPower: 57,
  navalPower: 52,
  intelNetwork: 64,
  enemyPressure: 68,
};

const initialStockpile: Stockpile = {
  infantryEquipment: 48200,
  tanks: 1284,
  aircraft: 2106,
  convoys: 624,
  artillery: 3840,
  trucks: 12600,
};

const defaultNation = getNation(DEFAULT_NATION_ID);
const defaultDivisions = createCampaignDivisions(defaultNation);
const defaultProduction = createCampaignProduction(defaultNation);
const defaultCommanderDevelopment = createCommanderDevelopment(createCareerCommanders(defaultNation, getRole(DEFAULT_ROLE_ID, DEFAULT_NATION_ID)));

const initialEvents: WarEvent[] = [
  { id: 1, week: 0, title: '전쟁 내각 소집', detail: '북아프리카와 지중해의 주도권을 되찾을 작전안을 제출하십시오.', tone: 'neutral' },
  { id: 2, week: 0, title: '울트라 전문 수신', detail: '롬멜 군단의 연료 비축량이 임계치 아래로 떨어졌습니다.', tone: 'good' },
  { id: 3, week: 0, title: '대서양 피해 보고', detail: 'HX-212 호송선단에서 상선 4척이 손실되었습니다.', tone: 'bad' },
];

const factionLabels: Record<Faction, string> = {
  allies: '연합국',
  axis: '추축국',
  neutral: '중립국',
};

const typeMeta = {
  infantry: { label: '보병', symbol: 'Ⅱ', className: 'infantry' },
  armor: { label: '기갑', symbol: '▰', className: 'armor' },
  airborne: { label: '공수', symbol: '✦', className: 'airborne' },
  marine: { label: '해병', symbol: '⚓', className: 'marine' },
};

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.round(value)));

const percentageGameFields = new Set<keyof GameState>([
  'stability', 'warSupport', 'commandPoints', 'victoryScore', 'airPower', 'navalPower', 'intelNetwork', 'enemyPressure',
]);

function applyGameDelta(current: GameState, delta: Partial<Record<keyof GameState, number>> = {}) {
  const next = { ...current };
  const numeric = next as unknown as Record<string, number>;
  Object.entries(delta).forEach(([key, amount]) => {
    if (typeof amount !== 'number') return;
    const typedKey = key as keyof GameState;
    const updated = numeric[key] + amount;
    numeric[key] = percentageGameFields.has(typedKey) ? Math.max(0, Math.min(100, updated)) : Math.max(0, updated);
  });
  return next;
}

function getCampaignDate(week: number) {
  const date = new Date(Date.UTC(1942, 9, 25 + week * 7));
  return {
    full: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date),
    day: new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(date),
  };
}

function ProgressBar({ value, tone = 'allied', thin = false }: { value: number; tone?: 'allied' | 'axis' | 'gold' | 'green'; thin?: boolean }) {
  return (
    <div className={'progress-track ' + (thin ? 'thin' : '')}>
      <span className={'progress-fill ' + tone} style={{ width: Math.min(100, Math.max(0, value)) + '%' }} />
    </div>
  );
}

function ResourceChip({ icon, value, label, delta }: { icon: React.ReactNode; value: string; label: string; delta?: string }) {
  return (
    <div className="resource-chip" title={label}>
      <span className="resource-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {delta && <em>{delta}</em>}
    </div>
  );
}

export function App() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [divisions, setDivisions] = useState<Division[]>(defaultDivisions);
  const [research, setResearch] = useState<ResearchProject[]>(initialResearch);
  const [production, setProduction] = useState<ProductionLine[]>(defaultProduction);
  const [events, setEvents] = useState<WarEvent[]>(initialEvents);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<GameTab>('command');
  const [selectedTerritoryId, setSelectedTerritoryId] = useState(defaultNation.capitalTerritoryId);
  const [selectedDivisionId, setSelectedDivisionId] = useState(defaultDivisions[0].id);
  const [planningMode, setPlanningMode] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [showBriefing, setShowBriefing] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  const [doctrine, setDoctrine] = useState<'coalition' | 'methodical' | 'maneuver'>('coalition');
  const [toast, setToast] = useState('');
  const [objectiveProgress, setObjectiveProgress] = useState(28);
  const [torchAuthorized, setTorchAuthorized] = useState(false);
  const [completedDecisions, setCompletedDecisions] = useState<string[]>([]);
  const [uxPreferences, setUXPreferences] = useState<UXPreferences>(() => {
    try {
      return normalizeUXPreferences(JSON.parse(localStorage.getItem(UX_SETTINGS_KEY) ?? 'null'));
    } catch {
      return defaultUXPreferences;
    }
  });
  const [showActionCenter, setShowActionCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showFieldManual, setShowFieldManual] = useState(false);
  const [stockpile, setStockpile] = useState<Stockpile>(initialStockpile);
  const [campaignOutcome, setCampaignOutcome] = useState<CampaignOutcome>(null);
  const [relations, setRelations] = useState<DiplomaticRelation[]>(initialRelations);
  const [operations, setOperations] = useState<CovertOperation[]>(initialOperations);
  const [mapLayer, setMapLayer] = useState<MapLayer>('political');
  const [setupNationId, setSetupNationId] = useState<NationId>(DEFAULT_NATION_ID);
  const [setupRoleId, setSetupRoleId] = useState(DEFAULT_ROLE_ID);
  const [career, setCareer] = useState<CareerState>(() => createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
  const [activeTheater, setActiveTheater] = useState<TheaterId>('europe');
  const [staff, setStaff] = useState<StaffMember[]>(() => createStaffRoster(DEFAULT_NATION_ID));
  const [staffCandidates, setStaffCandidates] = useState<StaffCandidate[]>(() => createStaffCandidates(DEFAULT_NATION_ID));
  const [developmentFocusId, setDevelopmentFocusId] = useState<string | null>(null);
  const [supplyPolicy, setSupplyPolicy] = useState<SupplyPolicy>('balanced');
  const [procurementFocusId, setProcurementFocusId] = useState<string | null>('rifle');
  const [priorityDivisionId, setPriorityDivisionId] = useState(defaultDivisions[0].id);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [pendingCouncilEventId, setPendingCouncilEventId] = useState<string | null>(null);
  const [resolvedCouncilChoices, setResolvedCouncilChoices] = useState<string[]>([]);
  const [battleStance, setBattleStance] = useState<BattleStance>('balanced');
  const [battleReports, setBattleReports] = useState<BattleReport[]>([]);
  const [pendingBattleReportId, setPendingBattleReportId] = useState<string | null>(null);
  const [commanderDevelopment, setCommanderDevelopment] = useState<CommanderDevelopment[]>(defaultCommanderDevelopment);
  const toastTimerRef = useRef<number | null>(null);

  const playerNation = getNation(career.nationId);
  const careerRole = getRole(career.roleId, career.nationId);
  const playerFaction = playerNation.alignment;
  const enemyFaction: Exclude<Faction, 'neutral'> = playerFaction === 'allies' ? 'axis' : 'allies';
  const careerCommanders = useMemo(() => createCareerCommanders(playerNation, careerRole), [careerRole, playerNation]);
  const effectiveCommanders = useMemo(() => careerCommanders.map((commander) => {
    const assignedDivision = divisions.find((division) => division.commanderId === commander.id);
    return applyCommanderDevelopment(commander, getCommanderRecord(commanderDevelopment, commander), assignedDivision?.type);
  }), [careerCommanders, commanderDevelopment, divisions]);
  const activePolicies = useMemo(() => strategicPolicies.filter((policy) => selectedPolicies.includes(policy.id)), [selectedPolicies]);
  const policyAttackBonus = activePolicies.reduce((total, policy) => total + (policy.attackBonus ?? 0), 0);
  const policyDefenseBonus = activePolicies.reduce((total, policy) => total + (policy.defenseBonus ?? 0), 0);
  const policyProductionMultiplier = activePolicies.reduce((total, policy) => total * (policy.productionMultiplier ?? 1), 1);
  const policySupplyRecovery = activePolicies.reduce((total, policy) => total + (policy.supplyRecovery ?? 0), 0);
  const delegatedDepartments = useMemo(() => new Set(staff.filter((member) => member.delegated).map((member) => member.department)), [staff]);
  const staffWeeklyCost = staff.reduce((total, member) => total + member.weeklyCost, 0);
  const pendingCouncilEvent = councilEvents.find((event) => event.id === pendingCouncilEventId) ?? null;
  const pendingBattleReport = battleReports.find((report) => report.id === pendingBattleReportId) ?? null;
  const theaterTerritories = useMemo(
    () => territories.filter((territory) => (territory.theater ?? 'europe') === activeTheater),
    [activeTheater, territories],
  );

  const selectedTerritory = useMemo(
    () => territories.find((territory) => territory.id === selectedTerritoryId) ?? territories[0],
    [selectedTerritoryId, territories],
  );
  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === selectedDivisionId) ?? divisions[0],
    [divisions, selectedDivisionId],
  );
  const selectedCommander = effectiveCommanders.find((commander) => commander.id === selectedDivision.commanderId) ?? effectiveCommanders[0];
  const selectedCommanderDevelopment = getCommanderRecord(commanderDevelopment, selectedCommander);
  const uxActions = useMemo(() => deriveUXActions({
    factories: game.factories,
    production,
    research,
    selectedPolicies,
    divisions,
    orders,
    commanderDevelopment,
  }), [commanderDevelopment, divisions, game.factories, orders, production, research, selectedPolicies]);
  const onboardingSteps = useMemo(() => deriveOnboardingSteps({
    factories: game.factories,
    production,
    research,
    selectedPolicies,
    orders,
    alternatePathId: career.alternatePathId,
  }), [career.alternatePathId, game.factories, orders, production, research, selectedPolicies]);
  const campaignDate = getCampaignDate(game.week);
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    localStorage.setItem(UX_SETTINGS_KEY, JSON.stringify(uxPreferences));
  }, [uxPreferences]);

  const addEvent = useCallback((title: string, detail: string, tone: WarEvent['tone'], week: number) => {
    setEvents((current) => [{ id: Date.now() + Math.random(), week, title, detail, tone }, ...current].slice(0, 30));
  }, []);

  const advanceWeek = useCallback(() => {
    const nextWeek = game.week + 1;
    const currentOrder = orders[0];
    setCommanderDevelopment((current) => recoverCommanderFatigue(current));

    if (currentOrder) {
      const division = divisions.find((item) => item.id === currentOrder.divisionId);
      const target = territories.find((item) => item.id === currentOrder.targetId);
      const commander = effectiveCommanders.find((item) => item.id === division?.commanderId);
      if (division && target && commander) {
        if (target.controller === playerFaction) {
          setDivisions((current) => current.map((item) => item.id === division.id ? {
            ...item,
            territoryId: target.id,
            status: 'ready',
            organization: Math.max(45, item.organization - 3),
            supply: Math.max(35, item.supply - 2),
          } : item));
          addEvent('우군 집결 — ' + target.name, division.name + '이(가) 확보된 교두보에 합류했습니다.', 'neutral', nextWeek);
          notify(division.name + '이(가) ' + target.name + '에 합류했습니다.');
        } else {
          const doctrineBonus = doctrine === 'maneuver' && division.type === 'armor' ? 14 : doctrine === 'methodical' ? 7 : 4;
          const priorityBonus = division.id === priorityDivisionId ? 5 : 0;
          const resolvedBattle = resolveBattle({
            week: nextWeek,
            division,
            commander,
            target,
            stance: battleStance,
            enemyPressure: game.enemyPressure,
            intelNetwork: game.intelNetwork,
            doctrineBonus,
            policyAttackBonus,
            priorityBonus,
            randomRolls: [Math.random(), Math.random(), Math.random(), Math.random()],
          });
          const existingDevelopment = getCommanderRecord(commanderDevelopment, commander);
          const recoveredDevelopment = { ...existingDevelopment, fatigue: Math.max(0, existingDevelopment.fatigue - 3) };
          const developmentResult = recordBattleExperience(recoveredDevelopment, resolvedBattle, battleStance);
          const battleHonor = getBattleHonor(resolvedBattle);
          const battleReport: BattleReport = {
            ...resolvedBattle,
            commanderXpGained: developmentResult.xpGained,
            battleHonor,
          };
          setCommanderDevelopment((current) => {
            const exists = current.some((record) => record.commanderId === commander.id);
            return exists
              ? current.map((record) => record.commanderId === commander.id ? developmentResult.record : record)
              : [...current, developmentResult.record];
          });
          setBattleReports((current) => [battleReport, ...current].slice(0, 24));
          setPendingBattleReportId(battleReport.id);
          setSpeed(0);
          if (developmentResult.leveledUp) {
            addEvent('지휘관 성장 — ' + commander.name, '실전 경험으로 새로운 복무 레벨에 도달했습니다. 육군 화면에서 특기 하나를 선택할 수 있습니다.', 'good', nextWeek);
          }
          if (battleReport.victory) {
            setTerritories((current) => current.map((item) => item.id === target.id ? { ...item, controller: playerFaction, ownerId: playerNation.id, supply: Math.max(35, item.supply - 12) } : item));
            setDivisions((current) => current.map((item) => item.id === division.id ? {
              ...item,
              territoryId: target.id,
              status: 'recovering',
              strength: Math.max(35, item.strength - battleReport.attackerStrengthLoss),
              organization: Math.max(28, item.organization - battleReport.organizationLoss),
              supply: Math.max(20, item.supply - battleReport.supplySpent),
              experience: Math.min(100, item.experience + 4),
              battleHonors: battleHonor ? Array.from(new Set([...(item.battleHonors ?? []), battleHonor])).slice(-8) : item.battleHonors,
            } : item));
            setGame((current) => ({ ...current, manpower: Math.max(0, current.manpower - battleReport.attackerStrengthLoss * 3), victoryScore: Math.min(100, current.victoryScore + target.value), warSupport: Math.min(100, current.warSupport + 2) }));
            setObjectiveProgress((current) => Math.min(100, current + target.value * 3));
            addEvent('전선 돌파 — ' + target.name, battleReport.summary, 'good', nextWeek);
            notify(target.name + ' 확보! 전선이 전진했습니다.');
          } else {
            setTerritories((current) => current.map((item) => item.id === target.id ? { ...item, supply: Math.max(20, item.supply - Math.round(battleReport.defenderStrengthLoss / 2)) } : item));
            setDivisions((current) => current.map((item) => item.id === division.id ? {
              ...item,
              status: 'recovering',
              strength: Math.max(28, item.strength - battleReport.attackerStrengthLoss),
              organization: Math.max(20, item.organization - battleReport.organizationLoss),
              supply: Math.max(15, item.supply - battleReport.supplySpent),
              experience: Math.min(100, item.experience + 2),
            } : item));
            setGame((current) => ({ ...current, manpower: Math.max(0, current.manpower - battleReport.attackerStrengthLoss * 3), warSupport: Math.max(35, current.warSupport - 2) }));
            addEvent('공세 좌절 — ' + target.name, battleReport.summary, 'bad', nextWeek);
            notify('공세가 좌절되었습니다. 사단을 재정비하십시오.');
          }
        }
      }
      setOrders((current) => current.slice(1));
    }

    setDivisions((current) => current.map((division) => {
      const isPriority = division.id === priorityDivisionId;
      const personnelBonus = delegatedDepartments.has('personnel') ? 1 : 0;
      const logisticsBonus = delegatedDepartments.has('logistics') ? 1 : 0;
      if (division.status !== 'recovering') {
        if (supplyPolicy === 'frontline' && (division.status === 'moving' || division.status === 'combat')) {
          return { ...division, supply: Math.min(100, division.supply + 3 + logisticsBonus) };
        }
        return isPriority ? { ...division, organization: Math.min(100, division.organization + 1), supply: Math.min(100, division.supply + 1) } : division;
      }
      const recoveredOrganization = Math.min(100, division.organization + 11 + personnelBonus + (isPriority ? 2 : 0));
      return {
        ...division,
        organization: recoveredOrganization,
        strength: Math.min(100, division.strength + 2 + (supplyPolicy === 'reserve' ? 1 : 0)),
        supply: Math.min(100, division.supply + 4 + policySupplyRecovery + logisticsBonus + (supplyPolicy === 'reserve' ? 2 : 0)),
        status: recoveredOrganization >= 70 ? 'ready' : 'recovering',
      };
    }));

    const researchGain = doctrine === 'methodical' ? 13 : 11;
    const breakthroughs = research.filter((project) => project.active && !project.complete && project.progress + researchGain >= project.duration);
    setResearch((current) => current.map((project) => {
      if (!project.active || project.complete) return project;
      const progress = Math.min(project.duration, project.progress + researchGain);
      return { ...project, progress, complete: progress >= project.duration, active: progress < project.duration };
    }));

    breakthroughs.forEach((project) => {
      addEvent('연구 완료 — ' + project.name, project.description + ' 효과가 전군에 적용되었습니다.', 'good', nextWeek);
      if (project.id === 'radar') setGame((current) => ({ ...current, airPower: Math.min(100, current.airPower + 12), intelNetwork: Math.min(100, current.intelNetwork + 5) }));
      if (project.id === 'tank') setDivisions((current) => current.map((division) => division.type === 'armor' ? { ...division, strength: Math.min(100, division.strength + 8), experience: Math.min(100, division.experience + 3) } : division));
      if (project.id === 'logistics') setDivisions((current) => current.map((division) => ({ ...division, supply: Math.min(100, division.supply + 12) })));
      if (project.id === 'code') setGame((current) => ({ ...current, intelNetwork: Math.min(100, current.intelNetwork + 20), enemyPressure: Math.max(25, current.enemyPressure - 8) }));
      if (project.id === 'landing') setGame((current) => ({ ...current, navalPower: Math.min(100, current.navalPower + 14), commandPoints: Math.min(100, current.commandPoints + 12) }));
      if (project.id === 'penicillin') setGame((current) => ({ ...current, manpower: current.manpower + 120, warSupport: Math.min(100, current.warSupport + 3) }));
    });

    const productionGains = calculateProductionGains(production, nextWeek);
    const focusMultiplier = (lineId: string) => procurementFocusId === lineId ? 1.12 : 1;
    setStockpile((current) => ({
      ...current,
      tanks: current.tanks + Math.round(productionGains.tanks * policyProductionMultiplier * focusMultiplier('sherman')),
      aircraft: current.aircraft + Math.round(productionGains.aircraft * policyProductionMultiplier * focusMultiplier('spitfire')),
      infantryEquipment: current.infantryEquipment + Math.round(productionGains.infantryEquipment * policyProductionMultiplier * focusMultiplier('rifle')),
      convoys: current.convoys + Math.round(productionGains.convoys * policyProductionMultiplier * focusMultiplier('convoy')),
      artillery: current.artillery + Math.round(productionGains.artillery * policyProductionMultiplier),
      trucks: current.trucks + Math.round(productionGains.trucks * policyProductionMultiplier),
    }));

    setProduction((current) => current.map((line) => ({
      ...line,
      efficiency: Math.min(100, line.efficiency + (line.assigned > 0 ? 1 : 0) + (line.id === procurementFocusId ? 1 : 0) + (delegatedDepartments.has('armaments') ? 1 : 0)),
    })));
    setGame((current) => ({
      ...current,
      week: current.week + 1,
      manpower: current.manpower + 18,
      politicalPower: Math.min(200, current.politicalPower + 3 + (delegatedDepartments.has('political') ? 1 : 0)),
      fuel: Math.max(0, Math.min(200, current.fuel + 8 - current.factories * 0.18 - (supplyPolicy === 'frontline' ? 2 : 0))),
      steel: Math.min(240, current.steel + 9),
      commandPoints: Math.min(100, current.commandPoints + 6 + (delegatedDepartments.has('operations') ? 2 : 0)),
      treasury: Math.max(0, current.treasury + 54 - current.factories - staffWeeklyCost),
      airPower: Math.min(100, current.airPower + (nextWeek % 4 === 0 ? 1 : 0)),
      navalPower: Math.max(20, Math.min(100, current.navalPower + (nextWeek % 3 === 0 ? 1 : 0))),
      enemyPressure: Math.min(100, current.enemyPressure + (nextWeek % 4 === 0 ? 2 : 0)),
    }));

    const careerGain = currentOrder ? 7 : 3;
    const promotionRole = careerRole.tier > 1
      ? careerRoles.find((role) => role.nationId === career.nationId && role.tier === careerRole.tier - 1)
      : undefined;
    const earnsPromotion = Boolean(promotionRole && career.experience + careerGain >= 100);
    setCareer((current) => ({
      ...current,
      roleId: earnsPromotion && promotionRole ? promotionRole.id : current.roleId,
      experience: earnsPromotion ? 35 : Math.min(100, current.experience + careerGain),
      reputation: Math.min(100, current.reputation + (currentOrder ? 2 : 1)),
      councilTrust: Math.max(10, Math.min(100, current.councilTrust + (game.victoryScore >= 50 ? 1 : -1))),
      legacy: Math.min(100, current.legacy + (currentOrder ? 2 : 0)),
    }));
    if (earnsPromotion && promotionRole) {
      addEvent('전시 승진 — ' + promotionRole.title, '전구 성과가 인정되어 더 넓은 권한과 책임을 부여받았습니다.', 'good', nextWeek);
      notify('승진했습니다: ' + promotionRole.title);
    }

    if (nextWeek % 3 === 0) {
      const threatenedTerritory = selectThreatenedTerritory(territories, divisions, currentOrder?.targetId, playerFaction, activeTheater);

      if (threatenedTerritory) {
        const { defender, power } = calculateDefensivePower(threatenedTerritory, divisions, effectiveCommanders);
        const defensivePower = power + policyDefenseBonus + (defender?.id === priorityDivisionId ? 5 : 0);
        const enemyPower = calculateEnemyPower(game.enemyPressure, threatenedTerritory.value, Math.random());

        if (enemyPower > defensivePower) {
          const fallbackId = threatenedTerritory.neighbors.find((neighborId) => territories.find((item) => item.id === neighborId)?.controller === playerFaction);
          setTerritories((current) => current.map((territory) => territory.id === threatenedTerritory.id ? { ...territory, controller: enemyFaction, supply: Math.max(20, territory.supply - 18) } : territory));
          setDivisions((current) => current.map((division) => division.territoryId === threatenedTerritory.id ? {
            ...division,
            territoryId: fallbackId ?? division.territoryId,
            status: 'recovering',
            strength: Math.max(25, division.strength - 9),
            organization: Math.max(18, division.organization - 22),
          } : division));
          setGame((current) => ({ ...current, victoryScore: Math.max(0, current.victoryScore - threatenedTerritory.value), warSupport: Math.max(20, current.warSupport - 2), enemyPressure: Math.min(100, current.enemyPressure + 3) }));
          setObjectiveProgress((current) => Math.max(0, current - threatenedTerritory.value * 2));
          addEvent('적 반격 성공 — ' + threatenedTerritory.name, '적군이 전선을 돌파했습니다. 예비대를 투입해 방어선을 복구해야 합니다.', 'bad', nextWeek);
        } else {
          if (defender) {
            setDivisions((current) => current.map((division) => division.id === defender.id ? { ...division, strength: Math.max(30, division.strength - 3), organization: Math.max(30, division.organization - 9), experience: Math.min(100, division.experience + 2) } : division));
          }
          setGame((current) => ({ ...current, commandPoints: Math.min(100, current.commandPoints + 3), enemyPressure: Math.max(25, current.enemyPressure - 2) }));
          addEvent('적 반격 격퇴 — ' + threatenedTerritory.name, playerNation.shortName + ' 방어선이 적의 공세를 저지했습니다.', 'good', nextWeek);
        }
      }
    }

    if (nextWeek % 2 === 0) {
      const news = worldNews[nextWeek % worldNews.length];
      addEvent('세계 전황', news, 'neutral', nextWeek);
    }
    if (nextWeek % 5 === 0) {
      setGame((current) => ({ ...current, stability: Math.max(45, current.stability - 1) }));
      addEvent('국내 전시 피로', '장기 배급과 공습 경보로 국민 피로가 누적되고 있습니다.', 'bad', nextWeek);
    }
    setStaff((current) => current.map((member) => ({
      ...member,
      workload: Math.max(8, Math.min(100, member.workload + (member.delegated ? 3 : -2))),
      loyalty: member.delegated && member.workload >= 85 ? Math.max(20, member.loyalty - 2) : member.loyalty,
      development: Math.min(100, member.development + (member.delegated ? 6 : 3) + (member.id === developmentFocusId ? 7 : 0) - (member.workload >= 85 ? 2 : 0)),
    })));
    setStaffCandidates((current) => current.map((candidate) => candidate.status === 'scouting' ? {
      ...candidate,
      knowledge: Math.min(100, candidate.knowledge + 18 + (delegatedDepartments.has('personnel') ? 5 : 0)),
    } : candidate));
    if (nextWeek % 4 === 0 && !pendingCouncilEventId) {
      const unresolvedEvent = councilEvents.find((event) => !resolvedCouncilChoices.some((record) => record.startsWith(event.id + ':')));
      const councilEvent = unresolvedEvent ?? councilEvents[(Math.floor(nextWeek / 4) - 1) % councilEvents.length];
      setPendingCouncilEventId(councilEvent.id);
      setSpeed(0);
      addEvent('긴급 의제 소집 — ' + councilEvent.category, councilEvent.title, 'bad', nextWeek);
    }
  }, [activeTheater, addEvent, battleStance, career.experience, career.nationId, careerRole.tier, commanderDevelopment, delegatedDepartments, developmentFocusId, divisions, doctrine, effectiveCommanders, enemyFaction, game.enemyPressure, game.intelNetwork, game.victoryScore, game.week, notify, orders, pendingCouncilEventId, playerFaction, playerNation.id, playerNation.shortName, policyAttackBonus, policyDefenseBonus, policyProductionMultiplier, policySupplyRecovery, priorityDivisionId, procurementFocusId, production, research, resolvedCouncilChoices, staffWeeklyCost, supplyPolicy, territories]);

  useEffect(() => {
    if (speed === 0 || showBriefing) return;
    const delay = speed === 1 ? 4200 : speed === 2 ? 2600 : 1500;
    const timer = window.setInterval(advanceWeek, delay);
    return () => window.clearInterval(timer);
  }, [advanceWeek, showBriefing, speed]);

  useEffect(() => {
    if (showBriefing) return;
    const payload = { version: 8, game, territories, divisions, research, production, events, orders, stockpile, relations, operations, campaignOutcome, objectiveProgress, torchAuthorized, completedDecisions, doctrine, career, activeTheater, selectedTerritoryId, selectedDivisionId, staff, staffCandidates, developmentFocusId, supplyPolicy, procurementFocusId, priorityDivisionId, selectedPolicies, pendingCouncilEventId, resolvedCouncilChoices, battleStance, battleReports, pendingBattleReportId, commanderDevelopment };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }, [activeTheater, battleReports, battleStance, campaignOutcome, career, commanderDevelopment, completedDecisions, developmentFocusId, divisions, doctrine, events, game, objectiveProgress, operations, orders, pendingBattleReportId, pendingCouncilEventId, priorityDivisionId, procurementFocusId, production, relations, research, resolvedCouncilChoices, selectedDivisionId, selectedPolicies, selectedTerritoryId, showBriefing, staff, staffCandidates, stockpile, supplyPolicy, territories, torchAuthorized]);

  useEffect(() => {
    if (showBriefing || campaignOutcome) return;
    const playerTerritoryCount = theaterTerritories.filter((territory) => territory.controller === playerFaction).length;
    const enemyTerritoryCount = theaterTerritories.filter((territory) => territory.controller === enemyFaction).length;
    if (game.victoryScore >= 90 || playerTerritoryCount >= Math.ceil(theaterTerritories.length * 0.72) || enemyTerritoryCount <= 2) {
      setCampaignOutcome('victory');
      setSpeed(0);
      addEvent('전략적 승리', playerNation.shortName + '이(가) 전구의 주도권을 장악했습니다. 새로운 국제 질서를 결정할 시간이 왔습니다.', 'good', game.week);
    } else if (game.victoryScore <= 8 || game.warSupport <= 22 || game.stability <= 28 || (game.week >= 156 && game.victoryScore < 62)) {
      setCampaignOutcome('defeat');
      setSpeed(0);
      addEvent('전략적 패배', playerNation.shortName + '의 전쟁 수행 능력이 한계에 도달했습니다. 지도부가 당신의 해임을 논의합니다.', 'bad', game.week);
    }
  }, [addEvent, campaignOutcome, enemyFaction, game.stability, game.victoryScore, game.warSupport, game.week, playerFaction, playerNation.shortName, showBriefing, theaterTerritories]);

  const startCampaign = () => {
    const nation = getNation(setupNationId);
    const role = getRole(setupRoleId, setupNationId);
    const newCareer = createCareerState(nation.id, role.id);
    const newDivisions = createCampaignDivisions(nation);
    const doctrineBonus: Partial<GameState> = doctrine === 'methodical'
      ? { factories: (nation.modifiers.factories ?? initialGame.factories) + 3, steel: (nation.modifiers.steel ?? initialGame.steel) + 13 }
      : doctrine === 'maneuver'
        ? { fuel: (nation.modifiers.fuel ?? initialGame.fuel) + 22, commandPoints: initialGame.commandPoints + 8 }
        : { politicalPower: (nation.modifiers.politicalPower ?? initialGame.politicalPower) + 16, stability: (nation.modifiers.stability ?? initialGame.stability) + 4 };

    setGame({ ...initialGame, ...nation.modifiers, ...doctrineBonus });
    setTerritories(initialTerritories.map((territory) => ({ ...territory })));
    setDivisions(newDivisions);
    setResearch(initialResearch.map((project) => ({ ...project })));
    setProduction(createCampaignProduction(nation));
    setStaff(createStaffRoster(nation.id));
    setStaffCandidates(createStaffCandidates(nation.id));
    setDevelopmentFocusId(null);
    setSupplyPolicy('balanced');
    setProcurementFocusId('rifle');
    setPriorityDivisionId(newDivisions[0].id);
    setSelectedPolicies([]);
    setPendingCouncilEventId(null);
    setResolvedCouncilChoices([]);
    setBattleStance('balanced');
    setBattleReports([]);
    setPendingBattleReportId(null);
    setCommanderDevelopment(createCommanderDevelopment(createCareerCommanders(nation, role)));
    setEvents([
      { id: Date.now(), week: 0, title: '취임 — ' + role.title, detail: '당신이 ' + nation.name + '의 ' + role.title + ' 직무를 인수했습니다. 원래 역사와 다른 명령을 내릴 수 있습니다.', tone: 'good' },
      { id: Date.now() + 1, week: 0, title: '세계는 하나의 전장', detail: '유럽의 결정이 아시아의 보급과 외교를 바꾸고, 태평양의 결과가 유럽의 전후 질서를 흔듭니다.', tone: 'neutral' },
    ]);
    setOrders([]);
    setStockpile(initialStockpile);
    setRelations(createDiplomaticRelations(nation.id));
    setOperations(createCovertOperations(nation.defaultTheater));
    setCareer(newCareer);
    setActiveTheater(nation.defaultTheater);
    setSelectedTerritoryId(nation.capitalTerritoryId);
    setSelectedDivisionId(newDivisions[0].id);
    setObjectiveProgress(22);
    setTorchAuthorized(false);
    setCompletedDecisions([]);
    setCampaignOutcome(null);
    setShowActionCenter(false);
    setShowSettings(false);
    setShowResetConfirmation(false);
    setShowCommandPalette(false);
    setShowFieldManual(false);
    setShowBriefing(false);
    notify(nation.shortName + ' · ' + role.title + '로 취임했습니다.');
  };

  const continueCampaign = () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const restoredCareer: CareerState = data.career ?? createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID);
      const restoredNation = getNation(restoredCareer.nationId);
      const restoredRole = getRole(restoredCareer.roleId, restoredCareer.nationId);
      const defaultDevelopment = createCommanderDevelopment(createCareerCommanders(restoredNation, restoredRole));
      const savedDevelopment: CommanderDevelopment[] = data.commanderDevelopment ?? [];
      const restoredDevelopment = defaultDevelopment.map((fallback) => {
        const saved = savedDevelopment.find((record) => record.commanderId === fallback.commanderId);
        return saved ? { ...fallback, ...saved, skills: saved.skills ?? [] } : fallback;
      });
      const savedTerritories: Territory[] = data.territories ?? [];
      const mergedTerritories = initialTerritories.map((territory) => ({ ...territory, ...(savedTerritories.find((saved) => saved.id === territory.id) ?? {}) }));
      const restoredDivisions: Division[] = data.divisions ?? createCampaignDivisions(restoredNation);
      const migratedDivisions = data.version >= 4 ? restoredDivisions : restoredDivisions.map((division, index) => ({ ...division, commanderId: index % 3 === 0 ? 'player' : index % 3 === 1 ? 'staff-alpha' : 'staff-beta' }));
      setGame({ ...initialGame, ...(data.game ?? {}) });
      setTerritories(mergedTerritories);
      setDivisions(migratedDivisions);
      setResearch(data.research ?? initialResearch);
      setProduction(data.production ?? createCampaignProduction(restoredNation));
      setEvents(data.events ?? initialEvents);
      setOrders(data.orders ?? []);
      setStockpile({ ...initialStockpile, ...(data.stockpile ?? {}) });
      setRelations(data.relations ?? createDiplomaticRelations(restoredNation.id));
      setOperations(data.operations ?? createCovertOperations(restoredNation.defaultTheater));
      setStaff((data.staff ?? createStaffRoster(restoredNation.id)).map((member: StaffMember) => ({ ...member, grade: member.grade ?? 1, development: member.development ?? 20 })));
      setStaffCandidates(data.staffCandidates ?? createStaffCandidates(restoredNation.id));
      setDevelopmentFocusId(data.developmentFocusId ?? null);
      setSupplyPolicy(data.supplyPolicy ?? 'balanced');
      setProcurementFocusId(data.procurementFocusId ?? 'rifle');
      setPriorityDivisionId(data.priorityDivisionId ?? migratedDivisions[0]?.id ?? '');
      setSelectedPolicies(data.selectedPolicies ?? []);
      setPendingCouncilEventId(data.pendingCouncilEventId ?? null);
      setResolvedCouncilChoices(data.resolvedCouncilChoices ?? []);
      setBattleStance(data.battleStance ?? 'balanced');
      setBattleReports(data.battleReports ?? []);
      setPendingBattleReportId(data.pendingBattleReportId ?? null);
      setCommanderDevelopment(restoredDevelopment);
      setCareer(restoredCareer);
      setSetupNationId(restoredCareer.nationId);
      setSetupRoleId(restoredCareer.roleId);
      setActiveTheater(data.activeTheater ?? restoredNation.defaultTheater);
      setSelectedTerritoryId(data.selectedTerritoryId ?? restoredNation.capitalTerritoryId);
      setSelectedDivisionId(data.selectedDivisionId ?? migratedDivisions[0]?.id);
      setCampaignOutcome(data.campaignOutcome ?? null);
      setObjectiveProgress(data.objectiveProgress ?? 28);
      setTorchAuthorized(data.torchAuthorized ?? false);
      setCompletedDecisions(data.completedDecisions ?? []);
      setDoctrine(data.doctrine ?? 'coalition');
      setShowActionCenter(false);
      setShowSettings(false);
      setShowResetConfirmation(false);
      setShowCommandPalette(false);
      setShowFieldManual(false);
      setShowBriefing(false);
      notify('저장된 전쟁 지휘소를 복구했습니다.');
    } catch {
      notify('저장 데이터를 읽을 수 없습니다. 새 캠페인을 시작합니다.');
    }
  };

  const resetCampaign = () => {
    localStorage.removeItem(SAVE_KEY);
    setGame(initialGame);
    setTerritories(initialTerritories);
    setDivisions(defaultDivisions);
    setResearch(initialResearch);
    setProduction(defaultProduction);
    setEvents(initialEvents);
    setOrders([]);
    setStockpile(initialStockpile);
    setRelations(initialRelations);
    setOperations(initialOperations);
    setStaff(createStaffRoster(DEFAULT_NATION_ID));
    setStaffCandidates(createStaffCandidates(DEFAULT_NATION_ID));
    setDevelopmentFocusId(null);
    setSupplyPolicy('balanced');
    setProcurementFocusId('rifle');
    setPriorityDivisionId(defaultDivisions[0].id);
    setSelectedPolicies([]);
    setPendingCouncilEventId(null);
    setResolvedCouncilChoices([]);
    setBattleStance('balanced');
    setBattleReports([]);
    setPendingBattleReportId(null);
    setCommanderDevelopment(defaultCommanderDevelopment);
    setSetupNationId(DEFAULT_NATION_ID);
    setSetupRoleId(DEFAULT_ROLE_ID);
    setCareer(createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
    setActiveTheater('europe');
    setSelectedTerritoryId(defaultNation.capitalTerritoryId);
    setSelectedDivisionId(defaultDivisions[0].id);
    setMapLayer('political');
    setCampaignOutcome(null);
    setObjectiveProgress(28);
    setTorchAuthorized(false);
    setCompletedDecisions([]);
    setSpeed(0);
    setShowActionCenter(false);
    setShowSettings(false);
    setShowResetConfirmation(false);
    setShowCommandPalette(false);
    setShowFieldManual(false);
    setShowBriefing(true);
  };

  const selectTerritory = (territoryId: string) => {
    if (planningMode) {
      const currentDivision = divisions.find((item) => item.id === selectedDivisionId);
      const origin = territories.find((item) => item.id === currentDivision?.territoryId);
      const target = territories.find((item) => item.id === territoryId);
      if (!currentDivision || !origin || !target) return;
      if (!origin.neighbors.includes(target.id)) {
        notify('인접한 지역만 작전 목표로 지정할 수 있습니다.');
        return;
      }
      if (target.controller === playerFaction) {
        notify('이미 아군이 통제하는 지역입니다.');
        return;
      }
      if (game.commandPoints < 5) {
        notify('지휘 점수가 부족합니다.');
        return;
      }
      setOrders((current) => [...current, { divisionId: currentDivision.id, fromId: origin.id, targetId: target.id, startedWeek: game.week }]);
      setDivisions((current) => current.map((item) => item.id === currentDivision.id ? { ...item, status: 'moving' } : item));
      setGame((current) => ({ ...current, commandPoints: current.commandPoints - 5 }));
      setPlanningMode(false);
      setSelectedTerritoryId(target.id);
      notify(currentDivision.name + ' → ' + target.name + ' 공세 계획 승인');
      return;
    }

    setSelectedTerritoryId(territoryId);
    const divisionAtTerritory = divisions.find((division) => division.territoryId === territoryId);
    if (divisionAtTerritory) setSelectedDivisionId(divisionAtTerritory.id);
  };

  const issueOffensive = () => {
    if (selectedDivision.status !== 'ready') {
      notify('이 사단은 현재 명령을 수행할 준비가 되지 않았습니다.');
      return;
    }
    setPlanningMode(true);
    setActiveTab('army');
    notify('지도에서 인접한 적 지역을 선택하십시오.');
  };

  const authorizeTorch = () => {
    if (torchAuthorized) return;
    if (game.politicalPower < 20 || game.commandPoints < 10) {
      notify('정치력 또는 지휘 점수가 부족합니다.');
      return;
    }
    const operationDivisions = divisions.slice(0, 2);
    const operationTarget = territories.find((territory) => territory.id === playerNation.strategicTargets[0]);
    if (!operationTarget) {
      notify('작전 목표를 설정할 수 없습니다.');
      return;
    }
    setOrders((current) => [
      ...current,
      ...operationDivisions.map((division) => ({ divisionId: division.id, fromId: division.territoryId, targetId: operationTarget.id, startedWeek: game.week })),
    ]);
    setDivisions((current) => current.map((division) => operationDivisions.some((item) => item.id === division.id) ? { ...division, status: 'moving' } : division));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 20, commandPoints: current.commandPoints - 10 }));
    setTorchAuthorized(true);
    addEvent(playerNation.majorOperation + ' 승인', playerNation.majorOperationDetail, 'good', game.week);
    notify(playerNation.majorOperation + '이(가) 개시되었습니다.');
  };

  const enactDecision = (id: string, title: string, cost: number, effect: () => void) => {
    if (completedDecisions.includes(id)) return;
    if (game.politicalPower < cost) {
      notify('정치력이 부족합니다.');
      return;
    }
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - cost }));
    setCompletedDecisions((current) => [...current, id]);
    effect();
    addEvent('내각 결정 — ' + title, '전쟁 내각이 결정을 승인하고 즉시 시행했습니다.', 'good', game.week);
    notify(title + ' 시행 완료');
  };

  const toggleResearch = (id: string) => {
    const activeCount = research.filter((project) => project.active).length;
    const project = research.find((item) => item.id === id);
    if (!project || project.complete) return;
    if (!project.active && activeCount >= 2) {
      notify('연구 슬롯 2개가 모두 사용 중입니다.');
      return;
    }
    setResearch((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item));
  };

  const adjustFactories = (id: string, amount: number) => {
    const usedFactories = production.reduce((sum, line) => sum + line.assigned, 0);
    if (amount > 0 && usedFactories >= game.factories) {
      notify('배정 가능한 군수 공장이 없습니다.');
      return;
    }
    setProduction((current) => current.map((line) => line.id === id ? {
      ...line,
      assigned: Math.max(0, line.assigned + amount),
      efficiency: amount < 0 ? Math.max(15, line.efficiency - 4) : line.efficiency,
    } : line));
  };

  const assignCommander = (divisionId: string, commanderId: string) => {
    const targetDivision = divisions.find((division) => division.id === divisionId);
    if (!targetDivision || targetDivision.commanderId === commanderId) return;
    const previousCommanderId = targetDivision.commanderId;
    setDivisions((current) => current.map((division) => {
      if (division.id === divisionId) return { ...division, commanderId };
      if (division.commanderId === commanderId) return { ...division, commanderId: previousCommanderId };
      return division;
    }));
    const commander = careerCommanders.find((item) => item.id === commanderId);
    addEvent('지휘관 인사 발령', (commander?.name ?? '신임 지휘관') + '이(가) ' + targetDivision.name + ' 지휘를 맡았습니다.', 'neutral', game.week);
    notify('지휘관 배치를 변경했습니다.');
  };

  const trainDivision = (divisionId: string) => {
    const division = divisions.find((item) => item.id === divisionId);
    if (!division || division.status !== 'ready') {
      notify('준비 상태의 사단만 야전 훈련을 진행할 수 있습니다.');
      return;
    }
    if (game.commandPoints < 8 || game.manpower < 12) {
      notify('훈련에 필요한 지휘 점수 또는 인력이 부족합니다.');
      return;
    }
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 8, manpower: current.manpower - 12 }));
    setDivisions((current) => current.map((item) => item.id === divisionId ? {
      ...item,
      organization: Math.min(100, item.organization + 7),
      experience: Math.min(100, item.experience + 5),
      strength: Math.min(100, item.strength + 2),
      status: 'recovering',
    } : item));
    addEvent('야전 훈련 — ' + division.name, '합동 기동훈련을 마치고 사단의 조직력과 경험이 향상되었습니다.', 'good', game.week);
    notify(division.name + ' 야전 훈련 완료');
  };

  const selectCommanderSkill = (skillId: CommanderSkillId) => {
    if (getAvailableSkillPoints(selectedCommanderDevelopment) <= 0 || selectedCommanderDevelopment.skills.includes(skillId)) {
      notify('사용할 수 있는 지휘관 특기 점수가 없습니다.');
      return;
    }
    const updated = unlockCommanderSkill(selectedCommanderDevelopment, skillId);
    setCommanderDevelopment((current) => current.some((record) => record.commanderId === selectedCommander.id)
      ? current.map((record) => record.commanderId === selectedCommander.id ? updated : record)
      : [...current, updated]);
    addEvent('지휘관 특기 습득 — ' + selectedCommander.name, '실전 경험을 새로운 지휘 방식으로 체계화했습니다.', 'good', game.week);
    notify(selectedCommander.name + '의 새 지휘 특기를 선택했습니다.');
  };

  const sendCommanderOnRest = () => {
    if (game.commandPoints < 6) {
      notify('참모 휴양에 필요한 지휘 점수가 부족합니다.');
      return;
    }
    if (selectedCommanderDevelopment.fatigue < 10) {
      notify('현재 지휘관은 휴양이 필요하지 않습니다.');
      return;
    }
    const rested = restCommander(selectedCommanderDevelopment);
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 6 }));
    setCommanderDevelopment((current) => current.some((record) => record.commanderId === selectedCommander.id)
      ? current.map((record) => record.commanderId === selectedCommander.id ? rested : record)
      : [...current, rested]);
    addEvent('참모 휴양 — ' + selectedCommander.name, '후방 지휘소에서 휴식과 작전 복기를 마쳐 피로도가 22 감소했습니다.', 'neutral', game.week);
    notify(selectedCommander.name + '의 피로도가 회복되었습니다.');
  };

  const changeSetupNation = (nationId: NationId) => {
    const defaultRole = careerRoles.find((role) => role.nationId === nationId && role.tier === 2);
    setSetupNationId(nationId);
    if (defaultRole) setSetupRoleId(defaultRole.id);
  };

  const switchTheater = (theater: TheaterId) => {
    setActiveTheater(theater);
    setPlanningMode(false);
    const divisionInTheater = divisions.find((division) => {
      const territory = territories.find((item) => item.id === division.territoryId);
      return (territory?.theater ?? 'europe') === theater;
    });
    const focusTerritory = divisionInTheater
      ? territories.find((territory) => territory.id === divisionInTheater.territoryId)
      : territories.find((territory) => (territory.theater ?? 'europe') === theater && territory.controller === playerFaction)
        ?? territories.find((territory) => (territory.theater ?? 'europe') === theater);
    if (focusTerritory) setSelectedTerritoryId(focusTerritory.id);
    if (divisionInTheater) setSelectedDivisionId(divisionInTheater.id);
  };

  const chooseAlternatePath = (pathId: string) => {
    if (career.alternatePathId) return;
    const path = playerNation.paths.find((item) => item.id === pathId);
    if (!path) return;
    setCareer((current) => ({ ...current, alternatePathId: path.id, reputation: Math.min(100, current.reputation + 8), councilTrust: Math.min(100, current.councilTrust + 5), legacy: Math.min(100, current.legacy + 14) }));
    if (path.tone === 'reform') setGame((current) => ({ ...current, stability: Math.min(100, current.stability + 7), politicalPower: current.politicalPower + 6 }));
    if (path.tone === 'hardline') setGame((current) => ({ ...current, factories: current.factories + 3, warSupport: Math.min(100, current.warSupport + 5), stability: Math.max(20, current.stability - 3) }));
    if (path.tone === 'international') {
      setGame((current) => ({ ...current, politicalPower: current.politicalPower + 12, treasury: Math.max(0, current.treasury - 100) }));
      setRelations((current) => current.map((relation) => ({ ...relation, value: Math.min(100, relation.value + 8) })));
    }
    addEvent('대체역사 분기 — ' + path.title, path.summary + ' ' + path.effect, 'good', game.week);
    notify(path.title + ': 이제 역사가 다른 방향으로 흐릅니다.');
  };

  const meetStaff = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member || game.politicalPower < 4) {
      notify('참모 면담에는 정치력 4가 필요합니다.');
      return;
    }
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 4 }));
    setStaff((current) => current.map((item) => item.id === staffId ? {
      ...item,
      loyalty: Math.min(100, item.loyalty + 8),
      workload: Math.max(5, item.workload - 12),
    } : item));
    addEvent('참모 면담 — ' + member.name, member.specialty + ' 현안을 직접 조율했습니다. 충성도가 오르고 업무 부담이 줄었습니다.', 'good', game.week);
    notify(member.name + '과(와) 면담했습니다.');
  };

  const toggleStaffDelegation = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member) return;
    setStaff((current) => current.map((item) => item.id === staffId ? { ...item, delegated: !item.delegated } : item));
    notify(member.role + (member.delegated ? ' 권한을 회수했습니다.' : '에게 주간 업무를 위임했습니다.'));
  };

  const changeDevelopmentFocus = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member) return;
    setDevelopmentFocusId((current) => current === staffId ? null : staffId);
    notify(developmentFocusId === staffId ? '집중 육성 지정을 해제했습니다.' : member.name + '을(를) 집중 육성합니다.');
  };

  const upgradeStaff = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member || member.development < 100 || member.grade >= 3) return;
    if (game.politicalPower < 8 || game.treasury < 50) {
      notify('승급에는 정치력 8과 재정 £50M이 필요합니다.');
      return;
    }
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 8, treasury: current.treasury - 50 }));
    setStaff((current) => current.map((item) => item.id === staffId ? {
      ...item,
      grade: Math.min(3, item.grade + 1) as 1 | 2 | 3,
      development: 0,
      ability: Math.min(item.potential, item.ability + 4),
      potential: Math.min(99, item.potential + 1),
      loyalty: Math.min(100, item.loyalty + 5),
      workload: Math.min(100, item.workload + 8),
      weeklyCost: item.weeklyCost + 1,
    } : item));
    addEvent('참모 승급 — ' + member.name, member.specialty + ' 역량이 한 단계 전문화됐습니다. 능력과 주급, 조직 내 영향력이 함께 상승합니다.', 'good', game.week);
    notify(member.name + '이(가) 등급 ' + (member.grade + 1) + '로 승급했습니다.');
  };

  const scoutCandidate = (candidateId: string) => {
    const candidate = staffCandidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === 'signed') return;
    const scoutingCapacity = delegatedDepartments.has('personnel') ? 3 : 2;
    const activeAssignments = staffCandidates.filter((item) => item.status === 'scouting').length;
    if (candidate.status !== 'scouting' && activeAssignments >= scoutingCapacity) {
      notify('조사 슬롯이 모두 사용 중입니다. 인사 권한을 위임하면 슬롯이 1개 늘어납니다.');
      return;
    }
    if (game.politicalPower < 2) {
      notify('정밀 조사 착수에는 정치력 2가 필요합니다.');
      return;
    }
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 2 }));
    setStaffCandidates((current) => current.map((item) => item.id === candidateId ? {
      ...item,
      status: 'scouting',
      knowledge: Math.min(100, item.knowledge + 8),
    } : item));
    addEvent('인재 조사 — ' + candidate.name, candidate.role + ' 후보에 대한 경력·평판·충성도 검증을 시작했습니다.', 'neutral', game.week);
    notify(candidate.name + ' 정밀 조사를 시작했습니다.');
  };

  const toggleCandidateShortlist = (candidateId: string) => {
    const candidate = staffCandidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === 'signed' || candidate.knowledge < 35) return;
    setStaffCandidates((current) => current.map((item) => item.id === candidateId ? {
      ...item,
      status: item.status === 'shortlisted' ? 'unscouted' : 'shortlisted',
    } : item));
    notify(candidate.name + (candidate.status === 'shortlisted' ? '을(를) 관심 명단에서 제외했습니다.' : '을(를) 최종 관심 명단에 올렸습니다.'));
  };

  const recruitCandidate = (candidateId: string) => {
    const candidate = staffCandidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === 'signed' || candidate.knowledge < 55) return;
    if (game.treasury < candidate.signingCost || game.politicalPower < 6) {
      notify('영입에는 정치력 6과 계약금 £' + candidate.signingCost + 'M이 필요합니다.');
      return;
    }
    const persuasion = candidate.interest + Math.round(career.reputation * 0.25) + (candidate.status === 'shortlisted' ? 6 : 0);
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - (persuasion >= 66 ? 6 : 3), treasury: persuasion >= 66 ? current.treasury - candidate.signingCost : current.treasury }));
    if (persuasion < 66) {
      setStaffCandidates((current) => current.map((item) => item.id === candidateId ? { ...item, interest: Math.min(100, item.interest + 9), signingCost: item.signingCost + 12 } : item));
      addEvent('영입 협상 결렬 — ' + candidate.name, '후보가 권한과 처우에 확신하지 못했습니다. 재협상 가능하지만 요구 계약금이 올랐습니다.', 'bad', game.week);
      notify('협상이 결렬됐습니다. 관심도가 상승했지만 요구 조건도 높아졌습니다.');
      return;
    }
    const incumbent = staff.find((member) => member.department === candidate.department);
    setStaff((current) => current.map((member) => member.department === candidate.department ? {
      ...member,
      name: candidate.name,
      candidateName: incumbent?.name ?? member.candidateName,
      ability: candidate.ability,
      potential: candidate.potential,
      loyalty: candidate.loyalty,
      workload: 18,
      weeklyCost: candidate.weeklyCost,
      specialty: candidate.specialty,
      delegated: false,
      grade: 1,
      development: 0,
    } : member));
    setStaffCandidates((current) => current.map((item) => item.id === candidateId ? { ...item, status: 'signed' } : item));
    addEvent('신임 참모 영입 — ' + candidate.name, (incumbent?.name ?? '전임자') + '을(를) 대신해 ' + candidate.role + ' 직무를 맡습니다.', 'good', game.week);
    notify(candidate.name + ' 영입 협상이 타결됐습니다.');
  };

  const setPriorityFormation = (divisionId: string) => {
    if (priorityDivisionId === divisionId) return;
    if (game.commandPoints < 3) {
      notify('핵심 편제 변경에는 지휘 점수 3이 필요합니다.');
      return;
    }
    const division = divisions.find((item) => item.id === divisionId);
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 3 }));
    setPriorityDivisionId(divisionId);
    addEvent('핵심 편제 지정', (division?.name ?? '신규 편제') + '에 최우선 보충·훈련·참모 지원이 배정됩니다.', 'neutral', game.week);
    notify((division?.name ?? '편제') + '을(를) 핵심 편제로 지정했습니다.');
  };

  const setProcurementFocus = (lineId: string) => {
    if (procurementFocusId === lineId) return;
    if (game.politicalPower < 5) {
      notify('조달 우선순위 변경에는 정치력 5가 필요합니다.');
      return;
    }
    const line = production.find((item) => item.id === lineId);
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 5 }));
    setProcurementFocusId(lineId);
    addEvent('조달 포커스 변경 — ' + (line?.name ?? lineId), '선택 장비의 주간 산출량이 12% 증가하고 생산 효율이 더 빠르게 상승합니다.', 'good', game.week);
    notify((line?.name ?? '장비') + ' 우선 조달을 승인했습니다.');
  };

  const changeSupplyPolicy = (policy: SupplyPolicy) => {
    if (supplyPolicy === policy) return;
    if (game.commandPoints < 4) {
      notify('보급 방침 변경에는 지휘 점수 4가 필요합니다.');
      return;
    }
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 4 }));
    setSupplyPolicy(policy);
    const label = policy === 'frontline' ? '전선 우선' : policy === 'reserve' ? '전략 예비' : '균형 배분';
    addEvent('보급 방침 — ' + label, '군수참모부가 새로운 배분 기준을 전 전구에 하달했습니다.', 'neutral', game.week);
    notify(label + ' 보급 방침을 적용했습니다.');
  };

  const selectStrategicPolicy = (policyId: string) => {
    const policy = strategicPolicies.find((item) => item.id === policyId);
    if (!policy || selectedPolicies.includes(policy.id)) return;
    const existing = strategicPolicies.find((item) => item.domain === policy.domain && selectedPolicies.includes(item.id));
    if (existing) {
      notify('이 국가 운영 영역은 이미 ' + existing.title + ' 원칙을 채택했습니다.');
      return;
    }
    setSelectedPolicies((current) => [...current, policy.id]);
    setGame((current) => applyGameDelta(current, policy.gameDelta));
    if (policy.domain === 'diplomacy') {
      setRelations((current) => current.map((relation) => {
        const delta = policy.id === 'diplomacy-aid' ? 6 : policy.id === 'diplomacy-pragmatic' ? 3 : relation.status.includes('공동') || relation.status.includes('동맹') ? 5 : -3;
        return { ...relation, value: Math.max(0, Math.min(100, relation.value + delta)) };
      }));
    }
    addEvent('국가 원칙 채택 — ' + policy.title, policy.description + ' ' + policy.effect, 'good', game.week);
    notify(policy.title + ' 원칙이 장기 시뮬레이션에 적용됩니다.');
  };

  const resolveCouncilChoice = (choiceId: string) => {
    const councilEvent = councilEvents.find((event) => event.id === pendingCouncilEventId);
    const choice = councilEvent?.choices.find((item) => item.id === choiceId);
    if (!councilEvent || !choice) return;
    const effect = choice.effect;
    setGame((current) => applyGameDelta(current, effect.gameDelta));
    if (effect.divisionSupply || effect.divisionOrganization) {
      setDivisions((current) => current.map((division) => ({
        ...division,
        supply: Math.max(0, Math.min(100, division.supply + (effect.divisionSupply ?? 0))),
        organization: Math.max(0, Math.min(100, division.organization + (effect.divisionOrganization ?? 0))),
      })));
    }
    if (effect.productionEfficiency) {
      setProduction((current) => current.map((line) => ({ ...line, efficiency: Math.min(100, line.efficiency + (effect.productionEfficiency ?? 0)) })));
    }
    if (effect.relationChange) {
      setRelations((current) => current.map((relation) => ({ ...relation, value: Math.max(0, Math.min(100, relation.value + (effect.relationChange ?? 0))) })));
    }
    if (effect.careerReputation || effect.careerTrust) {
      setCareer((current) => ({
        ...current,
        reputation: Math.max(0, Math.min(100, current.reputation + (effect.careerReputation ?? 0))),
        councilTrust: Math.max(0, Math.min(100, current.councilTrust + (effect.careerTrust ?? 0))),
      }));
    }
    if (effect.enemyTerritorySupply) {
      setTerritories((current) => current.map((territory) => territory.controller === enemyFaction ? {
        ...territory,
        supply: Math.max(0, Math.min(100, territory.supply + (effect.enemyTerritorySupply ?? 0))),
      } : territory));
    }
    setResolvedCouncilChoices((current) => [...current, councilEvent.id + ':' + choice.id + ':' + game.week]);
    setPendingCouncilEventId(null);
    addEvent('국가 의제 결론 — ' + choice.title, choice.result, 'neutral', game.week);
    notify(choice.title + ': 선택의 결과가 전쟁 전체에 반영됐습니다.');
  };

  const navigateFromActionCenter = (action: UXAction) => {
    if (action.id === 'commander-skill') {
      const commanderRecord = commanderDevelopment.find((record) => getAvailableSkillPoints(record) > 0);
      const assignedDivision = divisions.find((division) => division.commanderId === commanderRecord?.commanderId);
      if (assignedDivision) {
        setSelectedDivisionId(assignedDivision.id);
        setSelectedTerritoryId(assignedDivision.territoryId);
      }
    }
    if (action.id === 'idle-formations') {
      const readyDivision = divisions.find((division) => division.status === 'ready');
      if (readyDivision) {
        setSelectedDivisionId(readyDivision.id);
        setSelectedTerritoryId(readyDivision.territoryId);
      }
    }
    setActiveTab(action.tab);
    setShowActionCenter(false);
  };

  const toggleUXPreference = (key: keyof UXPreferences) => {
    setUXPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (!showBriefing && !campaignOutcome && !pendingCouncilEventId && !pendingBattleReportId && !showJournal && !showSettings && !showActionCenter && !showResetConfirmation && !showFieldManual) {
          event.preventDefault();
          setShowCommandPalette((current) => !current);
        }
        return;
      }
      if (event.key === 'Escape') {
        setShowActionCenter(false);
        setShowSettings(false);
        setShowResetConfirmation(false);
        setShowCommandPalette(false);
        setShowFieldManual(false);
        setShowJournal(false);
        setPlanningMode(false);
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (target?.isContentEditable || tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button') return;
      if (showBriefing || campaignOutcome || pendingCouncilEventId || pendingBattleReportId || showJournal || showSettings || showActionCenter || showResetConfirmation || showCommandPalette || showFieldManual || event.repeat) return;
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        setShowActionCenter(true);
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        setShowSettings(true);
      } else if (event.key === '?') {
        event.preventDefault();
        setShowFieldManual(true);
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        advanceWeek();
      } else if (event.key === ' ') {
        event.preventDefault();
        setSpeed((current) => current === 0 ? 1 : 0);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [advanceWeek, campaignOutcome, pendingBattleReportId, pendingCouncilEventId, showActionCenter, showBriefing, showCommandPalette, showFieldManual, showJournal, showResetConfirmation, showSettings]);

  const tabItems: { id: GameTab; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'command', label: '최고사령부', description: '전황·국가 진로·전쟁 내각의 핵심 결정을 검토합니다.', icon: <Shield size={17} /> },
    { id: 'organization', label: '조직 운영', description: '참모진·영입·편제·조달·국가 원칙을 관리합니다.', icon: <BriefcaseBusiness size={17} /> },
    { id: 'army', label: '육군', description: '사단과 지휘관을 배치하고 공세와 훈련을 명령합니다.', icon: <Swords size={17} /> },
    { id: 'industry', label: '군수 생산', description: '군수 공장과 장비 생산선, 전략 비축량을 조정합니다.', icon: <Factory size={17} /> },
    { id: 'research', label: '연구', description: '두 개의 연구 슬롯에 전쟁 기술 과제를 배정합니다.', icon: <FlaskConical size={17} /> },
    { id: 'diplomacy', label: '외교', description: '국가 관계와 영향력을 관리해 전후 질서를 설계합니다.', icon: <Handshake size={17} /> },
    { id: 'intelligence', label: '정보국', description: '전구별 첩보망과 비밀 작전, 암호 해독을 지휘합니다.', icon: <Eye size={17} /> },
  ];
  const activeTabMeta = tabItems.find((tab) => tab.id === activeTab) ?? tabItems[0];
  const commandPaletteItems: CommandPaletteItem[] = [
    ...tabItems.map((tab) => ({ id: `tab-${tab.id}`, group: '관리 화면', title: tab.label, description: tab.description, keywords: [tab.id], icon: tab.icon, active: activeTab === tab.id })),
    { id: 'theater-europe', group: '전구 지도', title: '유럽·지중해 전구', description: '유럽, 북아프리카와 지중해 전선을 엽니다.', keywords: ['유럽', '아프리카', '지도'], icon: <Map size={17} />, active: activeTheater === 'europe' },
    { id: 'theater-asia', group: '전구 지도', title: '아시아·태평양 전구', description: '중국, 인도, 동남아시아와 태평양 전선을 엽니다.', keywords: ['아시아', '태평양', '지도'], icon: <Map size={17} />, active: activeTheater === 'asia' },
    { id: 'action-center', group: '지휘 도구', title: '행동 센터', description: '놓친 결정과 우선 처리할 행동을 확인합니다.', keywords: ['할 일', '다음 행동', '권장'], icon: <Menu size={17} />, meta: `${uxActions.length}건` },
    { id: 'war-journal', group: '지휘 도구', title: '전쟁 일지', description: '작전·국내·외교 전문을 검색합니다.', keywords: ['기록', '전문', '이벤트'], icon: <BookOpen size={17} /> },
    { id: 'settings', group: '지휘 도구', title: '사용자 환경 설정', description: '가독성, 고대비, 지도 라벨과 화면 효과를 조정합니다.', keywords: ['접근성', '글자', 'UI'], icon: <Settings size={17} /> },
    { id: 'field-manual', group: '지휘 도구', title: '야전 교범', description: '첫 주 체크리스트와 전투·운영 시스템 설명을 검색합니다.', keywords: ['도움말', '튜토리얼', '가이드'], icon: <CircleHelp size={17} />, meta: '?' },
    { id: 'next-week', group: '시간 제어', title: '다음 주 진행', description: '생산과 명령을 해결하고 전쟁을 한 주 진행합니다.', keywords: ['턴', '시간'], icon: <SkipForward size={17} />, meta: 'N' },
    { id: 'toggle-time', group: '시간 제어', title: speed === 0 ? '시간 재개' : '일시 정지', description: '시간 진행과 일시 정지를 전환합니다.', keywords: ['시간', '정지', '재개'], icon: speed === 0 ? <SkipForward size={17} /> : <Pause size={17} />, meta: 'Space' },
  ];

  const executePaletteCommand = (id: string) => {
    setShowCommandPalette(false);
    if (id.startsWith('tab-')) {
      const tabId = id.slice(4) as GameTab;
      const tab = tabItems.find((item) => item.id === tabId);
      if (tab) {
        setActiveTab(tabId);
        notify(`${tab.label} 화면을 열었습니다.`);
      }
      return;
    }
    if (id === 'theater-europe' || id === 'theater-asia') {
      switchTheater(id === 'theater-europe' ? 'europe' : 'asia');
    } else if (id === 'action-center') {
      setShowActionCenter(true);
    } else if (id === 'war-journal') {
      setShowJournal(true);
    } else if (id === 'settings') {
      setShowSettings(true);
    } else if (id === 'field-manual') {
      setShowFieldManual(true);
    } else if (id === 'next-week') {
      advanceWeek();
    } else if (id === 'toggle-time') {
      setSpeed((current) => current === 0 ? 1 : 0);
    }
  };

  return (
    <div className={'game-shell' + (uxPreferences.highContrast ? ' high-contrast' : '') + (uxPreferences.readableUI ? ' readable-ui' : '') + (uxPreferences.largeMapLabels ? ' large-map-labels' : '') + (uxPreferences.reducedMotion ? ' reduced-motion' : '')}>
      <header className="topbar">
        <div className="brand-block">
          <button className="icon-button menu-button" aria-label={`행동 센터, ${uxActions.length}건`} aria-keyshortcuts="G" onClick={() => setShowActionCenter(true)}>
            <Menu size={19} />
            <span aria-hidden="true" className={'attention-badge ' + (uxActions.some((action) => action.priority === 'urgent') ? 'urgent' : '')}>{uxActions.length}</span>
          </button>
          <div className="brand-mark" style={{ borderColor: playerNation.accent }}><span>{playerNation.code}</span></div>
          <div className="brand-copy">
            <strong>IRON DOMINION</strong>
            <span>{playerNation.code} · ALTERNATE HISTORY · 1942</span>
          </div>
          <div className="career-rank-chip"><small>TIER {careerRole.tier}</small><strong>{careerRole.title}</strong></div>
        </div>

        <div className="resource-row">
          <ResourceChip icon={<Users size={16} />} value={formatNumber(game.manpower) + 'K'} label="가용 인력" delta="+18" />
          <ResourceChip icon={<Landmark size={16} />} value={formatNumber(game.politicalPower)} label="정치력" delta="+3" />
          <ResourceChip icon={<Factory size={16} />} value={String(game.factories)} label="군수 공장" />
          <ResourceChip icon={<Fuel size={16} />} value={formatNumber(game.fuel) + 'K'} label="연료" delta="+2.6" />
          <ResourceChip icon={<Cog size={16} />} value={formatNumber(game.steel) + 'K'} label="강철" delta="+9" />
          <ResourceChip icon={<CircleDollarSign size={16} />} value={'£' + formatNumber(game.treasury) + 'M'} label="전시 재정" />
        </div>

        <div className="time-controls">
          <div className="weather"><CloudRain size={15} /><span>{activeTheater === 'asia' ? '아시아·태평양' : '유럽'}<br /><b>{activeTheater === 'asia' ? '몬순 · 29°C' : '비 · 11°C'}</b></span></div>
          <div className="date-block"><strong>{campaignDate.full}</strong><span>제 {game.week + 1}주 · {campaignDate.day}</span></div>
          <button className={'speed-button ' + (speed === 0 ? 'active' : '')} onClick={() => setSpeed(0)} aria-label="일시 정지" aria-keyshortcuts="Space"><Pause size={14} /></button>
          {[1, 2, 3].map((item) => (
            <button key={item} className={'speed-button text ' + (speed === item ? 'active' : '')} onClick={() => setSpeed(item)}>{item}×</button>
          ))}
          <button className="speed-button next" onClick={advanceWeek} aria-label="다음 주" aria-keyshortcuts="N"><SkipForward size={15} /></button>
        </div>
      </header>

      <aside className="left-rail">
        <div className="nation-emblem">
          <div className="flag-union" style={{ background: playerNation.color }}><span>{playerNation.code}</span></div>
          <small>{playerNation.shortName}</small>
        </div>
        <nav className="primary-nav" aria-label="게임 메뉴">
          {tabItems.map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)} title={tab.label} data-tooltip={tab.description} aria-current={activeTab === tab.id ? 'page' : undefined}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <button title="빠른 이동" data-tooltip="빠른 이동 · Ctrl+K" aria-label="빠른 이동" aria-keyshortcuts="Control+K Meta+K" onClick={() => setShowCommandPalette(true)}><Search size={18} /></button>
          <button title="전쟁 일지" data-tooltip="전쟁 일지" aria-label="전쟁 일지" onClick={() => setShowJournal(true)}><BookOpen size={18} /></button>
          <button title={uxPreferences.soundOn ? '음향 끄기' : '음향 켜기'} data-tooltip={uxPreferences.soundOn ? '게임 음향 끄기' : '게임 음향 켜기'} aria-label={uxPreferences.soundOn ? '음향 끄기' : '음향 켜기'} onClick={() => toggleUXPreference('soundOn')}><Volume2 size={18} className={uxPreferences.soundOn ? '' : 'muted'} /></button>
          <button title="새 캠페인 시작" data-tooltip="새 캠페인 시작" aria-label="새 캠페인 시작" onClick={() => setShowResetConfirmation(true)}><RotateCcw size={18} /></button>
          <button title="야전 교범" data-tooltip="야전 교범 · ?" aria-label="야전 교범" aria-keyshortcuts="?" onClick={() => setShowFieldManual(true)}><CircleHelp size={18} /></button>
          <button title="사용자 환경 설정" data-tooltip="사용자 환경 설정 · S" aria-label="사용자 환경 설정" aria-keyshortcuts="S" onClick={() => setShowSettings(true)}><Settings size={18} /></button>
        </div>
      </aside>

      <main className="war-room">
        <section className="map-section">
          <MapBoard
            territories={theaterTerritories}
            divisions={divisions}
            orders={orders}
            selectedTerritoryId={selectedTerritoryId}
            planningMode={planningMode}
            layer={mapLayer}
            theater={activeTheater}
            intelNetwork={game.intelNetwork}
            onSelect={selectTerritory}
          />
          <div className="map-top-left">
            <span className="eyebrow">전역 지도</span>
            <h1>{activeTheater === 'asia' ? '아시아 · 태평양 전구' : '유럽 · 지중해 전구'}</h1>
            <div className="theater-switch" role="group" aria-label="전구 선택">
              <button aria-pressed={activeTheater === 'europe'} className={activeTheater === 'europe' ? 'active' : ''} onClick={() => switchTheater('europe')}>EUROPE</button>
              <button aria-pressed={activeTheater === 'asia'} className={activeTheater === 'asia' ? 'active' : ''} onClick={() => switchTheater('asia')}>ASIA · PACIFIC</button>
            </div>
            <div className="map-legend">
              <span><i className="dot allies" /> 연합국</span>
              <span><i className="dot axis" /> 추축국</span>
              <span><i className="dot neutral" /> 중립국</span>
              <span><i className="front-symbol" /> 주요 전선</span>
            </div>
          </div>
          <div className="map-toolbar">
            <button aria-pressed={mapLayer === 'political'} className={mapLayer === 'political' ? 'active' : ''} onClick={() => setMapLayer('political')}><Map size={15} /> 정치</button>
            <button aria-pressed={mapLayer === 'supply'} className={mapLayer === 'supply' ? 'active' : ''} onClick={() => setMapLayer('supply')}><Shield size={15} /> 보급</button>
            <button aria-pressed={mapLayer === 'weather'} className={mapLayer === 'weather' ? 'active' : ''} onClick={() => setMapLayer('weather')}><CloudRain size={15} /> 기상</button>
            <button aria-pressed={mapLayer === 'intelligence'} className={mapLayer === 'intelligence' ? 'active' : ''} onClick={() => setMapLayer('intelligence')}><Eye size={15} /> 정보</button>
          </div>
          {planningMode && (
            <div className="planning-banner">
              <Target size={18} />
              <div><strong>공세 목표 지정</strong><span>{selectedDivision.name}의 인접 적 지역을 선택하십시오.</span></div>
              <button onClick={() => setPlanningMode(false)} aria-label="공세 목표 지정 취소" title="공세 목표 지정 취소"><X size={15} /></button>
            </div>
          )}
          <div className="theater-score">
            <div><span>{playerNation.shortName} 전황</span><strong>{game.victoryScore}</strong></div>
            <ProgressBar value={game.victoryScore} />
            <div className="score-labels"><span>후퇴</span><span>승리</span></div>
          </div>
        </section>

        <aside className="intel-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">NATIONAL COMMAND</span><h2>{playerNation.shortName} 지휘부</h2></div>
            <button className="icon-button" aria-label="전쟁 전문 열기" onClick={() => setShowJournal(true)}><Radio size={17} /></button>
          </div>

          <section className={'command-assistant-card ' + (uxActions[0]?.priority ?? 'clear')}>
            <header><Lightbulb size={15} /><span>다음 권장 행동</span><em>{uxActions.length > 0 ? `${uxActions.length}건 대기` : '정상'}</em></header>
            {uxActions[0] ? (
              <>
                <strong>{uxActions[0].title}</strong>
                <p>{uxActions[0].detail}</p>
                <button onClick={() => navigateFromActionCenter(uxActions[0])}>{uxActions[0].label}<ChevronRight size={14} /></button>
              </>
            ) : (
              <div className="command-assistant-clear"><CheckCircle2 size={18} /><span>놓친 핵심 결정이 없습니다. 작전을 진행해도 좋습니다.</span></div>
            )}
          </section>

          <section className="prime-objective">
            <div className="objective-top"><span>최우선 목표</span><em>D-14</em></div>
            <h3>{playerNation.majorOperation}</h3>
            <p>{playerNation.majorOperationDetail}</p>
            <ProgressBar value={objectiveProgress} tone="gold" />
            <div className="objective-footer"><span>작전 달성도</span><strong>{objectiveProgress}%</strong></div>
            <ul>
              {playerNation.strategicTargets.map((targetId) => {
                const target = territories.find((territory) => territory.id === targetId);
                return <li key={targetId} className={target?.controller === playerFaction ? 'done' : ''}><CheckCircle2 size={14} /> {target?.name ?? targetId} 확보</li>;
              })}
              <li className={torchAuthorized ? 'done' : ''}><CheckCircle2 size={14} /> {playerNation.majorOperation} 개시</li>
            </ul>
          </section>

          <section className="situation-card">
            <div className="section-title"><span>국가 지표</span><em>주간 변화</em></div>
            <Metric label="안정도" value={game.stability} icon={<Shield size={14} />} />
            <Metric label="전쟁 지지도" value={game.warSupport} icon={<TrendingUp size={14} />} tone="gold" />
            <Metric label="암호 해독" value={game.intelNetwork} icon={<LockKeyhole size={14} />} tone="green" />
            <Metric label="공중 우세" value={game.airPower} icon={<Plane size={14} />} />
            <Metric label="해상 통제" value={game.navalPower} icon={<Anchor size={14} />} tone="gold" />
          </section>

          <section className="dispatches">
            <div className="section-title"><span>최신 전문</span><button onClick={() => setShowJournal(true)}>모두 보기</button></div>
            {events.slice(0, 3).map((event) => (
              <button className={'dispatch ' + event.tone} key={event.id} onClick={() => setShowJournal(true)}>
                <i>{event.tone === 'good' ? <Check size={13} /> : event.tone === 'bad' ? <AlertTriangle size={13} /> : <Radio size={13} />}</i>
                <span><strong>{event.title}</strong><small>{event.detail}</small></span>
              </button>
            ))}
          </section>
        </aside>

        <section className="command-deck">
          <div className="deck-context-bar">
            <div><span>전쟁 지휘소 / {activeTabMeta.label}</span><strong>{activeTabMeta.label}</strong><small>{activeTabMeta.description}</small></div>
            <button onClick={() => setShowCommandPalette(true)} aria-keyshortcuts="Control+K Meta+K"><Search size={15} /><span>빠른 이동</span><kbd>Ctrl K</kbd></button>
          </div>
          <div className="deck-tabs">
            {tabItems.map((tab) => (
              <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.icon}{tab.label}</button>
            ))}
          </div>
          <div className="deck-content">
            {activeTab === 'command' && (
              <CommandPanel
                game={game}
                territories={territories}
                divisions={divisions}
                orders={orders}
                torchAuthorized={torchAuthorized}
                completedDecisions={completedDecisions}
                onAuthorizeTorch={authorizeTorch}
                onDecision={enactDecision}
                setGame={setGame}
                setDivisions={setDivisions}
                nation={playerNation}
                role={careerRole}
                career={career}
                playerFaction={playerFaction}
                activeTheater={activeTheater}
                onChoosePath={chooseAlternatePath}
              />
            )}
            {activeTab === 'organization' && (
              <OrganizationPanel
                game={game}
                nation={playerNation}
                staff={staff}
                candidates={staffCandidates}
                divisions={divisions}
                commanders={careerCommanders}
                production={production}
                stockpile={stockpile}
                supplyPolicy={supplyPolicy}
                procurementFocusId={procurementFocusId}
                priorityDivisionId={priorityDivisionId}
                selectedPolicies={selectedPolicies}
                developmentFocusId={developmentFocusId}
                onMeetStaff={meetStaff}
                onToggleDelegation={toggleStaffDelegation}
                onSetPriorityDivision={setPriorityFormation}
                onSetProcurementFocus={setProcurementFocus}
                onSetSupplyPolicy={changeSupplyPolicy}
                onSelectPolicy={selectStrategicPolicy}
                onSetDevelopmentFocus={changeDevelopmentFocus}
                onUpgradeStaff={upgradeStaff}
                onScoutCandidate={scoutCandidate}
                onToggleShortlist={toggleCandidateShortlist}
                onRecruitCandidate={recruitCandidate}
              />
            )}
            {activeTab === 'army' && (
              <ArmyPanel
                game={game}
                divisions={divisions}
                selectedDivision={selectedDivision}
                selectedCommander={selectedCommander}
                selectedCommanderDevelopment={selectedCommanderDevelopment}
                commanders={effectiveCommanders}
                territories={territories}
                orders={orders}
                battleStance={battleStance}
                battleReports={battleReports}
                onSelectDivision={(id) => {
                  setSelectedDivisionId(id);
                  const division = divisions.find((item) => item.id === id);
                  if (division) setSelectedTerritoryId(division.territoryId);
                }}
                onIssueOffensive={issueOffensive}
                onAssignCommander={assignCommander}
                onTrain={trainDivision}
                onBattleStanceChange={setBattleStance}
                onOpenBattleReport={setPendingBattleReportId}
                onUnlockCommanderSkill={selectCommanderSkill}
                onRestCommander={sendCommanderOnRest}
              />
            )}
            {activeTab === 'industry' && <IndustryPanel production={production} stockpile={stockpile} factories={game.factories} activeTheater={activeTheater} onAdjust={adjustFactories} />}
            {activeTab === 'research' && <ResearchPanel research={research} onToggle={toggleResearch} />}
            {activeTab === 'diplomacy' && <DiplomacyPanel game={game} relations={relations} setRelations={setRelations} setGame={setGame} notify={notify} />}
            {activeTab === 'intelligence' && <IntelligencePanel game={game} operations={operations} setOperations={setOperations} setGame={setGame} notify={notify} addEvent={addEvent} nation={playerNation} activeTheater={activeTheater} />}
          </div>
        </section>
      </main>

      <div className="selected-province">
        <div className={'faction-stripe ' + selectedTerritory.controller} />
        <div className="province-title">
          <span>{selectedTerritory.region}</span>
          <h3>{selectedTerritory.name}</h3>
          <small>{factionLabels[selectedTerritory.controller]} 통제 · {selectedTerritory.terrain}</small>
        </div>
        <div className="province-stat"><span>보급</span><strong>{selectedTerritory.supply}%</strong><ProgressBar value={selectedTerritory.supply} thin /></div>
        <div className="province-stat"><span>전략 가치</span><strong>{selectedTerritory.value}</strong><div className="stars">{'★'.repeat(Math.min(5, Math.ceil(selectedTerritory.value / 2)))}</div></div>
        <button className="focus-button" onClick={() => setActiveTab('army')}>주둔군 보기 <ChevronRight size={15} /></button>
      </div>

      {showBriefing && (
        <CampaignSetup
          nationId={setupNationId}
          roleId={setupRoleId}
          doctrine={doctrine}
          hasSave={hasSave}
          onNationChange={changeSetupNation}
          onRoleChange={setSetupRoleId}
          onDoctrineChange={setDoctrine}
          onStart={startCampaign}
          onContinue={continueCampaign}
        />
      )}
      {campaignOutcome && !showBriefing && (
        <CampaignOutcomeModal
          outcome={campaignOutcome}
          game={game}
          territories={territories}
          nation={playerNation}
          playerFaction={playerFaction}
          onJournal={() => setShowJournal(true)}
          onRestart={resetCampaign}
        />
      )}
      {pendingCouncilEvent && !showBriefing && !campaignOutcome && (
        <CouncilEventModal event={pendingCouncilEvent} onChoose={resolveCouncilChoice} />
      )}
      {pendingBattleReport && !pendingCouncilEvent && !showBriefing && !campaignOutcome && (
        <BattleReportModal report={pendingBattleReport} onClose={() => setPendingBattleReportId(null)} />
      )}
      {showJournal && <WarJournal events={events} onClose={() => setShowJournal(false)} />}
      {showActionCenter && !showBriefing && !campaignOutcome && !pendingCouncilEvent && !pendingBattleReport && (
        <ActionCenter actions={uxActions} onNavigate={navigateFromActionCenter} onClose={() => setShowActionCenter(false)} />
      )}
      {showSettings && !showBriefing && !campaignOutcome && !pendingCouncilEvent && !pendingBattleReport && (
        <SettingsModal
          preferences={uxPreferences}
          onToggle={toggleUXPreference}
          onReset={() => setUXPreferences({ ...defaultUXPreferences })}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showCommandPalette && !showBriefing && !campaignOutcome && !pendingCouncilEvent && !pendingBattleReport && (
        <CommandPalette items={commandPaletteItems} onExecute={executePaletteCommand} onClose={() => setShowCommandPalette(false)} />
      )}
      {showFieldManual && !showBriefing && !campaignOutcome && !pendingCouncilEvent && !pendingBattleReport && (
        <FieldManual
          steps={onboardingSteps}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setShowFieldManual(false);
            notify(`${tabItems.find((item) => item.id === tab)?.label ?? '관리'} 화면을 열었습니다.`);
          }}
          onClose={() => setShowFieldManual(false)}
        />
      )}
      {showResetConfirmation && !showBriefing && !campaignOutcome && !pendingCouncilEvent && !pendingBattleReport && (
        <ConfirmResetModal nationName={playerNation.shortName} week={game.week} onConfirm={resetCampaign} onClose={() => setShowResetConfirmation(false)} />
      )}
      {toast && <div className="toast" role="status" aria-live="polite"><Radio size={16} /><span>{toast}</span></div>}
    </div>
  );
}

function Metric({ label, value, icon, tone = 'allied' }: { label: string; value: number; icon: React.ReactNode; tone?: 'allied' | 'gold' | 'green' }) {
  return (
    <div className="metric-row">
      <div>{icon}<span>{label}</span></div>
      <strong>{Math.round(value)}%</strong>
      <ProgressBar value={value} tone={tone} thin />
    </div>
  );
}

function MapBoard({ territories, divisions, orders, selectedTerritoryId, planningMode, layer, theater, intelNetwork, onSelect }: {
  territories: Territory[];
  divisions: Division[];
  orders: Order[];
  selectedTerritoryId: string;
  planningMode: boolean;
  layer: MapLayer;
  theater: TheaterId;
  intelNetwork: number;
  onSelect: (id: string) => void;
}) {
  const divisionGroups = divisions.reduce<Record<string, Division[]>>((groups, division) => {
    groups[division.territoryId] = [...(groups[division.territoryId] ?? []), division];
    return groups;
  }, {});
  return (
    <svg className={'strategic-map theater-' + theater + ' layer-' + layer + (planningMode ? ' planning' : '')} viewBox="0 0 1200 760" role="img" aria-label={theater === 'asia' ? '아시아와 태평양 전략 지도' : '유럽과 지중해 전략 지도'}>
      <defs>
        <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(255,255,255,.025)" strokeWidth="1" />
        </pattern>
        <filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.48" /></filter>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#172627" /><stop offset="1" stopColor="#0d191c" /></linearGradient>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#333a32" /><stop offset="1" stopColor="#232a26" /></linearGradient>
      </defs>
      <rect width="1200" height="760" fill="url(#sea)" />
      <rect width="1200" height="760" fill="url(#grid)" />
      <g className="map-contours" opacity="0.22">
        <path d="M28 610 C180 500 230 620 390 535 S660 535 770 470 1050 510 1180 410" />
        <path d="M-20 675 C165 565 270 690 420 600 S700 615 850 540 1060 590 1240 475" />
        <path d="M20 165 C160 105 235 170 340 115 S620 105 745 48 1030 80 1190 22" />
      </g>
      {theater === 'europe' ? (
        <>
          <g className="landmass">
            <path d="M256 92 L330 45 390 60 418 115 470 142 520 130 560 84 610 52 650 70 665 135 725 160 770 148 845 103 938 90 1080 120 1190 205 1200 470 1110 480 1040 445 965 474 902 455 850 422 790 430 730 408 680 435 625 412 575 380 520 398 470 365 420 388 365 345 320 335 292 285 245 248 225 198 Z" />
            <path d="M120 348 L205 315 285 332 330 385 312 455 265 502 178 515 105 470 72 410 Z" />
            <path d="M178 535 L325 520 465 540 565 515 670 530 760 505 875 520 985 500 1115 530 1200 580 1200 760 90 760 72 650 Z" />
            <path d="M555 405 L610 422 640 482 620 535 585 515 568 465 Z" />
            <path d="M650 445 L710 435 753 475 730 520 675 508 Z" />
            <path d="M804 480 L890 470 965 510 925 550 850 540 Z" />
          </g>
          <g className="mountains" opacity="0.35"><path d="M430 365 l18 -24 18 26 19 -31 19 32 22 -25 20 24" /><path d="M835 428 l20 -28 20 27 22 -35 25 36 20 -29 24 29" /><path d="M180 500 l20 -25 18 22 20 -29 24 30 19 -21" /></g>
          <g className="sea-labels"><text x="115" y="370" transform="rotate(-18 115 370)">NORTH ATLANTIC</text><text x="516" y="585">MEDITERRANEAN SEA</text><text x="372" y="213">NORTH SEA</text><text x="830" y="365">EASTERN FRONT</text></g>
          <g className="front-lines"><path className="western" d="M302 214 C330 245 320 280 360 315 S410 360 432 398" /><path className="eastern" d="M760 182 C795 230 780 286 817 330 S804 405 852 455" /><path className="africa" d="M595 650 C660 620 724 648 786 625" /></g>
          <g className="supply-lines"><path d="M135 340 C182 270 205 235 255 190" /><path d="M135 340 C110 455 180 548 292 590" /><path d="M740 615 C840 600 914 570 1008 546" /></g>
        </>
      ) : (
        <>
          <g className="landmass asia-landmass">
            <path d="M50 180 L180 135 310 150 395 110 510 128 620 95 745 118 835 170 875 260 840 350 760 398 690 470 590 500 520 455 430 470 350 430 265 450 190 410 110 350 48 275 Z" />
            <path d="M170 480 L255 455 335 495 385 575 355 660 270 700 185 640 135 555 Z" />
            <path d="M475 525 L545 510 610 560 590 640 520 670 465 610 Z" />
            <path d="M655 575 L715 555 760 610 735 680 675 665 640 620 Z" />
            <path d="M805 590 L865 570 910 625 882 690 825 675 790 630 Z" />
            <path d="M1030 390 L1090 365 1140 410 1120 465 1060 478 1015 438 Z" />
          </g>
          <g className="mountains" opacity="0.38"><path d="M285 405 l22 -30 20 27 23 -38 25 40 24 -30 28 31" /><path d="M485 325 l22 -28 22 27 25 -36 28 37 22 -29" /><path d="M610 220 l19 -25 20 22 20 -31 24 30" /></g>
          <g className="sea-labels"><text x="210" y="730">INDIAN OCEAN</text><text x="690" y="520">SOUTH CHINA SEA</text><text x="940" y="330">PACIFIC OCEAN</text><text x="470" y="82">ASIAN MAINLAND</text></g>
          <g className="front-lines"><path className="western" d="M410 270 C455 310 430 360 485 405 S540 440 565 500" /><path className="eastern" d="M690 220 C720 270 705 330 745 380" /><path className="africa" d="M500 650 C590 620 690 665 790 630" /></g>
          <g className="supply-lines"><path d="M195 430 C300 500 410 560 525 650" /><path d="M870 430 C930 390 1010 405 1100 425" /><path d="M720 640 C830 610 945 540 1080 440" /></g>
        </>
      )}

      {layer === 'weather' && (
        <g className="weather-zones" aria-label="전구 기상 상황">
          <g transform={theater === 'asia' ? 'translate(420 570)' : 'translate(470 210)'}><circle r="70" /><CloudRain size={28} x={-14} y={-28} /><text y="22">{theater === 'asia' ? 'MONSOON' : 'RAIN FRONT'}</text></g>
          <g transform={theater === 'asia' ? 'translate(830 650)' : 'translate(750 630)'}><circle r="78" /><CloudRain size={28} x={-14} y={-28} /><text y="22">{theater === 'asia' ? 'TYPHOON' : 'SANDSTORM'}</text></g>
          <g transform={theater === 'asia' ? 'translate(670 155)' : 'translate(930 160)'}><circle r="62" /><CloudRain size={28} x={-14} y={-28} /><text y="22">{theater === 'asia' ? 'SIBERIAN COLD' : 'SNOW FRONT'}</text></g>
        </g>
      )}

      {orders.map((order) => {
        const origin = territories.find((item) => item.id === order.fromId);
        const target = territories.find((item) => item.id === order.targetId);
        if (!origin || !target) return null;
        const x1 = origin.x * 12;
        const y1 = origin.y * 7.6;
        const x2 = target.x * 12;
        const y2 = target.y * 7.6;
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        return (
          <g className="order-arrow" key={order.divisionId + '-' + order.targetId + '-' + order.startedWeek}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <polygon points={(x2 - 12) + ',' + (y2 - 7) + ' ' + (x2 + 4) + ',' + y2 + ' ' + (x2 - 12) + ',' + (y2 + 7)} transform={'rotate(' + angle + ' ' + x2 + ' ' + y2 + ')'} />
          </g>
        );
      })}

      {territories.map((territory) => {
        const x = territory.x * 12;
        const y = territory.y * 7.6;
        const group = divisionGroups[territory.id] ?? [];
        const selected = selectedTerritoryId === territory.id;
        return (
          <g
            key={territory.id}
            className={'territory-marker ' + territory.controller + (selected ? ' selected' : '') + (territory.supply < 50 ? ' low-supply' : '')}
            transform={'translate(' + x + ' ' + y + ')'}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(territory.id)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onSelect(territory.id);
            }}
            aria-label={territory.name + ', ' + factionLabels[territory.controller]}
          >
            {selected && <circle className="selection-ring" r="31" />}
            <circle className="territory-halo" r={territory.value > 8 ? 22 : 18} />
            <circle className="territory-core" r={territory.value > 8 ? 11 : 9} />
            <text className="territory-name" y="-23">{territory.name}</text>
            {layer === 'political' && territory.ownerId && <text className="layer-reading owner-reading" y="35">{getNation(territory.ownerId).code}</text>}
            {layer === 'supply' && <text className="layer-reading supply-reading" y="35">{territory.supply}%</text>}
            {layer === 'intelligence' && (
              <text className="layer-reading intel-reading" y="35">
                {territory.controller === 'axis' ? '추정 ' + Math.max(22, Math.min(99, Math.round(intelNetwork - territory.value + 18))) + '%' : '확인'}
              </text>
            )}
            {group.length > 0 && (
              <g className="unit-counter" transform="translate(16 12)" filter="url(#shadow)">
                <rect x="0" y="0" width="43" height="28" rx="3" />
                <text x="8" y="19">{typeMeta[group[0].type].symbol}</text>
                <text x="31" y="19" textAnchor="middle">{group.length}</text>
              </g>
            )}
          </g>
        );
      })}
      <g className="compass" transform="translate(1110 650)">
        <circle r="38" /><path d="M0 -28 L7 0 0 28 -7 0 Z" /><text y="-46">N</text>
      </g>
    </svg>
  );
}

function CommandPanel({ game, territories, divisions, orders, torchAuthorized, completedDecisions, onAuthorizeTorch, onDecision, setGame, setDivisions, nation, role, career, playerFaction, activeTheater, onChoosePath }: {
  game: GameState;
  territories: Territory[];
  divisions: Division[];
  orders: Order[];
  torchAuthorized: boolean;
  completedDecisions: string[];
  onAuthorizeTorch: () => void;
  onDecision: (id: string, title: string, cost: number, effect: () => void) => void;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  setDivisions: React.Dispatch<React.SetStateAction<Division[]>>;
  nation: NationProfile;
  role: CareerRole;
  career: CareerState;
  playerFaction: Exclude<Faction, 'neutral'>;
  activeTheater: TheaterId;
  onChoosePath: (pathId: string) => void;
}) {
  const frontDefinitions = activeTheater === 'asia'
    ? [
      { name: '중국·버마 전선', detail: '윈난 · 버마 · 아삼', ids: ['china_interior', 'yunnan', 'burma', 'assam'], strength: 58 },
      { name: '남서 태평양', detail: '뉴기니 · 솔로몬', ids: ['new_guinea', 'coral_sea', 'solomons'], strength: 46 },
      { name: '중부 태평양', detail: '미드웨이 · 하와이', ids: ['midway', 'hawaii', 'japan_home'], strength: 63 },
    ]
    : [
      { name: '북아프리카', detail: '이집트 · 리비아 · 튀니지', ids: ['egypt', 'libya', 'tunisia'], strength: 64 },
      { name: '서부 유럽', detail: '영불 해협 · 대서양', ids: ['britain', 'atlantic', 'channel', 'france'], strength: 51 },
      { name: '동부 전선', detail: '발트 · 우크라이나 · 캅카스', ids: ['baltic', 'ukraine', 'caucasus'], strength: 44 },
    ];
  const fronts = frontDefinitions.map((front) => {
    const controlled = front.ids.filter((id) => territories.find((territory) => territory.id === id)?.controller === playerFaction).length;
    const tone = controlled >= 3 ? 'good' : controlled >= 1 ? 'neutral' : 'bad';
    return { ...front, tone, status: tone === 'good' ? '우세' : tone === 'neutral' ? '대치' : '위기', count: divisions.filter((division) => front.ids.includes(division.territoryId)).length };
  });
  const theaterTerritories = territories.filter((territory) => (territory.theater ?? 'europe') === activeTheater);
  const selectedPath = nation.paths.find((path) => path.id === career.alternatePathId);
  return (
    <div className="command-grid">
      <section className="deck-section career-dossier">
        <div className="career-profile-mark" style={{ background: nation.color, borderColor: nation.accent }}>{nation.code}</div>
        <div className="career-profile-copy"><span className="eyebrow">YOUR WARTIME CAREER</span><h3>{role.title}</h3><p>TIER {role.tier} · {role.scope} · {role.expectation}</p></div>
        <div className="career-meters">
          <div><span>평판</span><ProgressBar value={career.reputation} tone="gold" thin /><strong>{career.reputation}</strong></div>
          <div><span>지도부 신임</span><ProgressBar value={career.councilTrust} tone={career.councilTrust > 55 ? 'green' : 'axis'} thin /><strong>{career.councilTrust}</strong></div>
          <div><span>{role.tier === 1 ? '역사적 유산' : '승진 심사'}</span><ProgressBar value={role.tier === 1 ? career.legacy : career.experience} thin /><strong>{role.tier === 1 ? career.legacy : career.experience}%</strong></div>
        </div>
        <div className="career-paths">
          <span>{selectedPath ? '채택한 국가 진로' : '대체역사 국가 진로를 선택하십시오'}</span>
          {nation.paths.map((path) => (
            <button key={path.id} className={career.alternatePathId === path.id ? 'selected' : ''} disabled={Boolean(career.alternatePathId)} onClick={() => onChoosePath(path.id)}>
              <strong>{path.title}</strong><small>{path.effect}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="deck-section front-overview">
        <div className="deck-section-heading"><div><span className="eyebrow">THEATERS</span><h3>{activeTheater === 'asia' ? '아시아·태평양 전황' : '유럽·지중해 전황'}</h3></div><em>{theaterTerritories.filter((item) => item.controller === playerFaction).length}/{theaterTerritories.length} 지역 통제</em></div>
        <div className="front-list">
          {fronts.map((front) => (
            <div className="front-row" key={front.name}>
              <i className={front.tone}><Swords size={15} /></i>
              <div><strong>{front.name}</strong><span>{front.detail}</span></div>
              <div className="front-force"><span>{front.count}개 사단</span><ProgressBar value={front.strength} tone={front.tone === 'good' ? 'green' : front.tone === 'bad' ? 'axis' : 'gold'} thin /></div>
              <em className={front.tone}>{front.status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="deck-section operation-card">
        <div className="operation-visual"><Anchor size={28} /><span>JOINT OPERATION</span></div>
        <div className="operation-body">
          <div className="classified">TOP SECRET · MOST IMMEDIATE</div>
          <h3>{nation.majorOperation}</h3>
          <p>{nation.majorOperationDetail}</p>
          <div className="operation-meta"><span><Clock3 size={13} /> 2주</span><span><Users size={13} /> 2개 사단</span><span><ShieldAlert size={13} /> 중간 위험</span></div>
          <button className={torchAuthorized ? 'approved' : ''} onClick={onAuthorizeTorch} disabled={torchAuthorized}>
            {torchAuthorized ? <><Check size={15} /> 작전 진행 중</> : <>작전 승인 <span>20 <Landmark size={12} /> · 10 CP</span></>}
          </button>
        </div>
      </section>

      <section className="deck-section decisions">
        <div className="deck-section-heading"><div><span className="eyebrow">CABINET</span><h3>내각 결정</h3></div><em>{game.politicalPower} 정치력</em></div>
        <DecisionCard
          title="전시 채권 발행"
          detail="재정 +£240M · 안정도 -2%"
          cost={12}
          done={completedDecisions.includes('bonds')}
          onClick={() => onDecision('bonds', '전시 채권 발행', 12, () => setGame((current) => ({ ...current, treasury: current.treasury + 240, stability: current.stability - 2 })))}
        />
        <DecisionCard
          title="전구 우선 보급"
          detail="전체 사단 보급 +12% · 연료 -18K"
          cost={16}
          done={completedDecisions.includes('supply')}
          onClick={() => onDecision('supply', '전구 우선 보급', 16, () => {
            setDivisions((current) => current.map((division) => ({ ...division, supply: Math.min(100, division.supply + 12) })));
            setGame((current) => ({ ...current, fuel: Math.max(0, current.fuel - 18) }));
          })}
        />
      </section>

      <section className="deck-section order-queue">
        <div className="deck-section-heading"><div><span className="eyebrow">ORDERS</span><h3>작전 명령</h3></div><em>{orders.length} 대기</em></div>
        {orders.length === 0 ? (
          <div className="empty-order"><Target size={22} /><span>육군 탭에서 사단을 선택해<br />새 공세 명령을 내리십시오.</span></div>
        ) : orders.map((order, index) => {
          const division = divisions.find((item) => item.id === order.divisionId);
          const target = territories.find((item) => item.id === order.targetId);
          return (
            <div className="queued-order" key={order.divisionId + '-' + order.targetId + '-' + order.startedWeek}>
              <i>{index + 1}</i><div><strong>{division?.name}</strong><span>목표: {target?.name}</span></div><em>다음 주</em>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function DecisionCard({ title, detail, cost, done, onClick }: { title: string; detail: string; cost: number; done: boolean; onClick: () => void }) {
  return (
    <button className={'decision-card ' + (done ? 'done' : '')} onClick={onClick} disabled={done}>
      <i>{done ? <Check size={15} /> : <Landmark size={15} />}</i>
      <span><strong>{title}</strong><small>{detail}</small></span>
      <em>{done ? '완료' : cost}</em>
    </button>
  );
}

function ArmyPanel({ game, divisions, selectedDivision, selectedCommander, selectedCommanderDevelopment, commanders, territories, orders, battleStance, battleReports, onSelectDivision, onIssueOffensive, onAssignCommander, onTrain, onBattleStanceChange, onOpenBattleReport, onUnlockCommanderSkill, onRestCommander }: {
  game: GameState;
  divisions: Division[];
  selectedDivision: Division;
  selectedCommander: Commander;
  selectedCommanderDevelopment: CommanderDevelopment;
  commanders: Commander[];
  territories: Territory[];
  orders: Order[];
  battleStance: BattleStance;
  battleReports: BattleReport[];
  onSelectDivision: (id: string) => void;
  onIssueOffensive: () => void;
  onAssignCommander: (divisionId: string, commanderId: string) => void;
  onTrain: (divisionId: string) => void;
  onBattleStanceChange: (stance: BattleStance) => void;
  onOpenBattleReport: (reportId: string) => void;
  onUnlockCommanderSkill: (skillId: CommanderSkillId) => void;
  onRestCommander: () => void;
}) {
  const location = territories.find((territory) => territory.id === selectedDivision.territoryId);
  const divisionOrder = orders.find((order) => order.divisionId === selectedDivision.id);
  return (
    <div className="army-layout">
      <section className="deck-section division-roster">
        <div className="deck-section-heading"><div><span className="eyebrow">ORDER OF BATTLE</span><h3>야전군 편제</h3></div><em>{divisions.length}개 사단</em></div>
        <div className="roster-list">
          {divisions.map((division) => {
            const meta = typeMeta[division.type];
            const commander = commanders.find((item) => item.id === division.commanderId);
            const territory = territories.find((item) => item.id === division.territoryId);
            return (
              <button key={division.id} className={'division-row ' + (selectedDivision.id === division.id ? 'selected' : '')} onClick={() => onSelectDivision(division.id)}>
                <i className={meta.className}>{meta.symbol}</i>
                <span className="division-name"><strong>{division.name}</strong><small>{commander?.name} · {territory?.name}</small></span>
                <span className="compact-stat"><small>전력</small><strong>{division.strength}%</strong></span>
                <span className={'status-pill ' + division.status}>{division.status === 'ready' ? '준비' : division.status === 'moving' ? '이동' : division.status === 'combat' ? '교전' : '재편'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="deck-section division-detail">
        <div className="division-banner">
          <div className={'large-unit-icon ' + typeMeta[selectedDivision.type].className}>{typeMeta[selectedDivision.type].symbol}</div>
          <div><span>{typeMeta[selectedDivision.type].label}사단 · {location?.region}</span><h3>{selectedDivision.name}</h3><small>{location?.name} 주둔</small></div>
          <button className="order-button" onClick={onIssueOffensive} disabled={selectedDivision.status !== 'ready'} title={selectedDivision.status === 'ready' ? '인접 적 지역에 공세를 계획합니다.' : '준비 상태의 사단만 공세 명령을 받을 수 있습니다.'}><Crosshair size={15} /> 공세 명령</button>
        </div>
        {divisionOrder && <div className="active-order-notice"><Zap size={15} /><span>{territories.find((item) => item.id === divisionOrder.targetId)?.name} 공세 준비 중</span></div>}
        <div className="division-metrics">
          <Metric label="병력 전력" value={selectedDivision.strength} icon={<Users size={14} />} tone="green" />
          <Metric label="조직력" value={selectedDivision.organization} icon={<Shield size={14} />} />
          <Metric label="보급 상태" value={selectedDivision.supply} icon={<Cog size={14} />} tone="gold" />
          <Metric label="전투 경험" value={selectedDivision.experience} icon={<Star size={14} />} tone="gold" />
        </div>
        <div className="equipment-grid">
          <div><span>주력 병력</span><strong>{formatNumber(selectedDivision.strength * 142)}명</strong><small>충원 +180 / 주</small></div>
          <div><span>전투 차량</span><strong>{selectedDivision.type === 'armor' ? 286 : 74}대</strong><small>가동률 {Math.round(selectedDivision.supply * .91)}%</small></div>
          <div><span>화력 지수</span><strong>{Math.round(selectedDivision.strength * .7 + selectedDivision.experience * .3)}</strong><small>전구 평균 +8</small></div>
        </div>
      </section>

      <section className="deck-section commander-profile">
        <div className="commander-header">
          <div className="commander-portrait" style={{ background: selectedCommander.color }}>{selectedCommander.initials}</div>
          <div><span>{selectedCommander.rank}</span><h3>{selectedCommander.name}</h3><small>{selectedCommander.specialty}</small></div>
          <div className="rating"><Star size={13} fill="currentColor" /><strong>{selectedCommander.command}</strong></div>
        </div>
        <div className="trait"><i><Zap size={14} /></i><div><strong>{selectedCommander.trait}</strong><span>지휘 특성</span></div></div>
        <div className="commander-stats">
          <div><span>공격</span><strong>{selectedCommander.attack}</strong></div>
          <div><span>방어</span><strong>{selectedCommander.defense}</strong></div>
          <div><span>군수</span><strong>{selectedCommander.logistics}</strong></div>
        </div>
        <div className="condition-row"><span>피로도</span><ProgressBar value={selectedCommander.fatigue} tone="axis" thin /><strong>{selectedCommander.fatigue}%</strong></div>
        <div className="condition-row"><span>충성도</span><ProgressBar value={selectedCommander.loyalty} tone="green" thin /><strong>{selectedCommander.loyalty}%</strong></div>
        <div className="commander-actions">
          <label>
            <span>지휘관 배치</span>
            <select value={selectedCommander.id} onChange={(event) => onAssignCommander(selectedDivision.id, event.target.value)}>
              {commanders.map((commander) => <option key={commander.id} value={commander.id}>{commander.name} · {commander.command}</option>)}
            </select>
          </label>
          <button onClick={() => onTrain(selectedDivision.id)} disabled={game.commandPoints < 8 || selectedDivision.status !== 'ready'} title={selectedDivision.status !== 'ready' ? '준비 상태의 사단만 훈련할 수 있습니다.' : game.commandPoints < 8 ? '지휘 점수 8이 필요합니다.' : '조직력·경험·전력을 높이고 한 주간 재편합니다.'}><TrendingUp size={13} /> 야전 훈련 <em>8 CP</em></button>
        </div>
      </section>
      <CommanderDevelopmentPanel
        commander={selectedCommander}
        development={selectedCommanderDevelopment}
        division={selectedDivision}
        commandPoints={game.commandPoints}
        onUnlockSkill={onUnlockCommanderSkill}
        onRestCommander={onRestCommander}
      />
      <BattleDoctrinePanel stance={battleStance} reports={battleReports} onStanceChange={onBattleStanceChange} onOpenReport={onOpenBattleReport} />
    </div>
  );
}

function IndustryPanel({ production, stockpile, factories, activeTheater, onAdjust }: { production: ProductionLine[]; stockpile: Stockpile; factories: number; activeTheater: TheaterId; onAdjust: (id: string, amount: number) => void }) {
  const used = production.reduce((sum, line) => sum + line.assigned, 0);
  return (
    <div className="industry-layout">
      <section className="deck-section production-table">
        <div className="deck-section-heading"><div><span className="eyebrow">WAR ECONOMY</span><h3>군수 생산 라인</h3></div><em>{used}/{factories} 공장 배정</em></div>
        <div className="factory-summary"><Factory size={20} /><div><strong>{factories - used}</strong><span>미배정 공장</span></div><ProgressBar value={used / factories * 100} tone="gold" /></div>
        {production.map((line) => (
          <div className="production-line" key={line.id}>
            <i>{line.icon}</i>
            <div className="production-name"><strong>{line.name}</strong><span>{line.category}</span></div>
            <div className="efficiency"><span>생산 효율 {line.efficiency}%</span><ProgressBar value={line.efficiency} tone="green" thin /></div>
            <div className="output"><span>주간 생산</span><strong>{formatNumber(line.output * Math.max(1, line.assigned) / 5)}</strong></div>
            <div className="factory-stepper">
              <button onClick={() => onAdjust(line.id, -1)} disabled={line.assigned <= 0} aria-label={`${line.name} 공장 배정 1개 감소`} title={line.assigned <= 0 ? '회수할 공장이 없습니다.' : `${line.name}에서 공장 1개를 회수합니다.`}><Minus size={13} /></button>
              <strong>{line.assigned}</strong>
              <button onClick={() => onAdjust(line.id, 1)} disabled={used >= factories} aria-label={`${line.name} 공장 배정 1개 증가`} title={used >= factories ? '배정 가능한 군수 공장이 없습니다.' : `${line.name}에 공장 1개를 배정합니다.`}><Plus size={13} /></button>
            </div>
          </div>
        ))}
      </section>
      <section className="deck-section logistics-card">
        <div className="deck-section-heading"><div><span className="eyebrow">LOGISTICS</span><h3>전략 물자</h3></div></div>
        <div className="stockpile-grid">
          <div><span>보병 장비</span><strong>{formatNumber(stockpile.infantryEquipment)}</strong><em className="good">생산 중</em></div>
          <div><span>중형 전차</span><strong>{formatNumber(stockpile.tanks)}</strong><em className="good">생산 중</em></div>
          <div><span>전투기</span><strong>{formatNumber(stockpile.aircraft)}</strong><em className="good">생산 중</em></div>
          <div><span>수송선</span><strong>{formatNumber(stockpile.convoys)}</strong><em className={stockpile.convoys < 500 ? 'bad' : 'good'}>{stockpile.convoys < 500 ? '부족' : '안정'}</em></div>
          <div><span>야포</span><strong>{formatNumber(stockpile.artillery)}</strong><em className="good">+72/주</em></div>
          <div><span>트럭</span><strong>{formatNumber(stockpile.trucks)}</strong><em className="good">+110/주</em></div>
        </div>
        <div className="convoy-warning"><AlertTriangle size={15} /><span><strong>{activeTheater === 'asia' ? '태평양 수송 손실' : '대서양 수송 손실'}</strong>{activeTheater === 'asia' ? '잠수함과 장거리 항공대 활동으로 수송 효율이 9% 감소했습니다.' : '잠수함 활동으로 수송 효율이 11% 감소했습니다.'}</span></div>
      </section>
    </div>
  );
}

function ResearchPanel({ research, onToggle }: { research: ResearchProject[]; onToggle: (id: string) => void }) {
  const activeCount = research.filter((project) => project.active).length;
  return (
    <div className="research-layout">
      <section className="deck-section research-board">
        <div className="deck-section-heading"><div><span className="eyebrow">RESEARCH & DEVELOPMENT</span><h3>연구 위원회</h3></div><em>{activeCount}/2 연구 슬롯</em></div>
        <div className="research-grid">
          {research.map((project) => {
            const percent = project.progress / project.duration * 100;
            return (
              <button className={'research-card ' + (project.active ? 'active' : '') + (project.complete ? ' complete' : '')} key={project.id} onClick={() => onToggle(project.id)} disabled={project.complete} aria-pressed={project.active} title={project.complete ? '완료된 연구는 전군에 적용 중입니다.' : project.active ? '선택하면 연구를 일시 중지합니다.' : activeCount >= 2 ? '연구 슬롯 2개가 모두 사용 중입니다.' : '이 과제를 연구 슬롯에 배정합니다.'}>
                <i>{project.complete ? <Check size={19} /> : project.icon}</i>
                <span className="branch">{project.branch}</span>
                <h4>{project.name}</h4>
                <p>{project.description}</p>
                <ProgressBar value={percent} tone={project.complete ? 'green' : project.active ? 'gold' : 'allied'} thin />
                <div className="research-footer"><span>{project.complete ? '연구 완료' : project.active ? Math.round(percent) + '% 진행 중' : '대기 중'}</span><em>{project.complete ? '적용됨' : project.active ? Math.ceil((project.duration - project.progress) / 11) + '주' : '선택'}</em></div>
              </button>
            );
          })}
        </div>
      </section>
      <section className="deck-section science-advisor">
        <div className="advisor-portrait">AT</div>
        <span className="eyebrow">CHIEF SCIENTIFIC ADVISER</span>
        <h3>앨런 튜링</h3>
        <p>“전쟁의 승패는 적보다 먼저 이해하고, 더 빠르게 결정하는 쪽에 달려 있습니다.”</p>
        <div className="advisor-bonus"><LockKeyhole size={16} /><span><strong>블레츨리 파크</strong>전자전 연구 속도 +15%</span></div>
      </section>
    </div>
  );
}

function DiplomacyPanel({ game, relations, setRelations, setGame, notify }: {
  game: GameState;
  relations: DiplomaticRelation[];
  setRelations: React.Dispatch<React.SetStateAction<DiplomaticRelation[]>>;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  notify: (message: string) => void;
}) {
  const influence = (id: string, name: string) => {
    if (game.politicalPower < 8) return notify('정치력이 부족합니다.');
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 8 }));
    setRelations((current) => current.map((country) => country.id === id ? { ...country, value: Math.min(100, country.value + 7) } : country));
    notify(name + '과의 관계가 개선되었습니다.');
  };
  return (
    <div className="diplomacy-layout">
      <section className="deck-section diplomatic-list">
        <div className="deck-section-heading"><div><span className="eyebrow">FOREIGN OFFICE</span><h3>외교 관계</h3></div><em>{game.politicalPower} 정치력</em></div>
        {relations.map((country) => (
          <div className="country-row" key={country.id}>
            <i style={{ background: country.color }}>{country.code}</i>
            <div><strong>{country.name}</strong><span>{country.status}</span></div>
            <div className="relation-meter"><span>관계 {country.value}</span><ProgressBar value={country.value} tone={country.value > 70 ? 'green' : country.value > 40 ? 'gold' : 'axis'} thin /></div>
            <button onClick={() => influence(country.id, country.name)}>영향력 행사 <small>8</small></button>
          </div>
        ))}
      </section>
      <section className="deck-section summit-card">
        <div className="summit-badge"><Handshake size={25} /></div>
        <span className="eyebrow">UPCOMING SUMMIT</span>
        <h3>카사블랑카 회담</h3>
        <p>루스벨트 대통령과 전후 전략, 이탈리아 진공, 무조건 항복 원칙을 논의하십시오.</p>
        <div className="summit-date"><Clock3 size={15} /><span>9주 후 · 카사블랑카</span></div>
        <div className="agenda"><span>의제 준비도</span><strong>64%</strong><ProgressBar value={64} tone="gold" /></div>
      </section>
    </div>
  );
}

function IntelligencePanel({ game, operations, setOperations, setGame, notify, addEvent, nation, activeTheater }: {
  game: GameState;
  operations: CovertOperation[];
  setOperations: React.Dispatch<React.SetStateAction<CovertOperation[]>>;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  notify: (message: string) => void;
  addEvent: (title: string, detail: string, tone: WarEvent['tone'], week: number) => void;
  nation: NationProfile;
  activeTheater: TheaterId;
}) {
  const launchOperation = () => {
    if (game.politicalPower < 10) return notify('정보 작전에 필요한 정치력이 부족합니다.');
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 10 }));
    setOperations((current) => current.map((operation, index) => index === 0 ? { ...operation, progress: 100 } : operation));
    addEvent('정보 작전 성공', '프랑스 레지스탕스가 적 철도 허브의 운용을 중단시켰습니다.', 'good', game.week);
    notify('프랑스 레지스탕스 작전이 성공했습니다.');
  };
  return (
    <div className="intel-layout">
      <section className="deck-section operation-list">
        <div className="deck-section-heading"><div><span className="eyebrow">SPECIAL OPERATIONS EXECUTIVE</span><h3>비밀 작전</h3></div><em>요원 18명 가용</em></div>
        {operations.map((operation) => (
          <div className="covert-row" key={operation.id}>
            <i>{operation.icon === 'radio' ? <Radio size={19} /> : operation.icon === 'eye' ? <Eye size={19} /> : <Crosshair size={19} />}</i>
            <div className="covert-name"><strong>{operation.name}</strong><span>{operation.region}</span></div>
            <div className="covert-progress"><span>준비도 {operation.progress}%</span><ProgressBar value={operation.progress} tone={operation.risk > 40 ? 'gold' : 'green'} thin /></div>
            <span className={'risk ' + (operation.risk > 40 ? 'medium' : 'low')}>위험 {operation.risk}%</span>
          </div>
        ))}
        <button className="launch-intel" onClick={launchOperation}><Zap size={15} /> 최우선 작전 실행 <span>10 정치력</span></button>
      </section>
      <section className="deck-section enigma-card">
        <div className="enigma-rings"><LockKeyhole size={28} /></div>
        <span className="eyebrow">{nation.code} SIGNALS · EYES ONLY</span>
        <h3>전구 암호 해독</h3>
        <p>{activeTheater === 'asia' ? '태평양 함대와 대륙군의 통신망을 추적하고 있습니다.' : '유럽과 지중해의 적 지휘망을 추적하고 있습니다.'}</p>
        <div className="decode-value">{Math.round(game.intelNetwork)}<small>%</small></div>
        <ProgressBar value={game.intelNetwork} tone="green" />
        <div className="intel-bonus"><Eye size={14} /> 적 보급량과 전투 계획 일부 공개</div>
      </section>
    </div>
  );
}

function CampaignOutcomeModal({ outcome, game, territories, nation, playerFaction, onJournal, onRestart }: {
  outcome: Exclude<CampaignOutcome, null>;
  game: GameState;
  territories: Territory[];
  nation: NationProfile;
  playerFaction: Exclude<Faction, 'neutral'>;
  onJournal: () => void;
  onRestart: () => void;
}) {
  const controlledTerritories = territories.filter((territory) => territory.controller === playerFaction).length;
  const isVictory = outcome === 'victory';
  return (
    <div className={'outcome-backdrop ' + outcome}>
      <section className="outcome-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-outcome-title">
        <div className="outcome-seal">{isVictory ? <Star size={34} /> : <ShieldAlert size={34} />}</div>
        <span className="eyebrow">{nation.code} NATIONAL COMMAND · FINAL COMMUNIQUÉ</span>
        <h1 id="campaign-outcome-title">{isVictory ? nation.shortName + '이(가) 새로운 역사의 주도권을 잡았습니다' : '지도부가 당신의 해임을 결정했습니다'}</h1>
        <p>{isVictory ? '원래 역사에는 없던 세력 균형이 탄생했습니다. 이제 당신이 선택한 국가 진로가 전후 세계의 규칙이 됩니다.' : '전쟁 수행 능력과 지도부 신임이 임계점 아래로 떨어졌습니다. 다음 커리어에서는 다른 보직과 국가 진로를 선택할 수 있습니다.'}</p>
        <div className="outcome-stats">
          <div><span>최종 전황</span><strong>{game.victoryScore}</strong></div>
          <div><span>통제 지역</span><strong>{controlledTerritories}/{territories.length}</strong></div>
          <div><span>지휘 기간</span><strong>{game.week + 1}주</strong></div>
          <div><span>전쟁 지지도</span><strong>{game.warSupport}%</strong></div>
        </div>
        <div className="outcome-actions">
          <button onClick={onJournal}><BookOpen size={15} /> 전쟁 일지 검토</button>
          <button className="primary" onClick={onRestart}><RotateCcw size={15} /> 새 캠페인</button>
        </div>
      </section>
    </div>
  );
}
