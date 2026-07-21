import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  LayoutDashboard,
  LockKeyhole,
  Map,
  Maximize2,
  Menu,
  Minus,
  Newspaper,
  Pause,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  SkipForward,
  Star,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Volume2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
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
  EquipmentCategory,
  EquipmentDevelopmentState,
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
  StaffDepartment,
  StaffMember,
  Stockpile,
  SupplyPolicy,
  Territory,
  TheaterId,
  WarEvent,
  WarEventComparison,
  WarEventTrace,
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
  getPromotionThreshold,
  getNation,
  getNationCommandTerritoryId,
  getRole,
  nations,
} from './campaign';
import { CampaignSetup } from './CampaignSetup';
import { CommandDashboard } from './CommandDashboard';
import { MapControlCenter } from './MapControlCenter';
import { GameIcon } from './GameIcon';
import type { GameIconName, GameIconTone } from './GameIcon';
import { NationFlag } from './NationFlag';
import { getHistoricalFlag } from './historicalFlags';
import { applyDiplomaticAgendaReward, calculateAgendaReadiness, getDiplomaticAgenda, getDiplomaticAgendaOutcome } from './diplomacy';
import { CouncilEventModal } from './CouncilEventModal';
import { councilEvents, strategicPolicies } from './choices';
import { forecastBattle, resolveBattle } from './combat';
import type { BattleForecast } from './combat';
import { BattleReportModal } from './BattleReportModal';
import { BattleDoctrinePanel } from './BattleDoctrinePanel';
import { OffensivePlanningModal } from './OffensivePlanningModal';
import { CommanderDevelopmentPanel } from './CommanderDevelopmentPanel';
import { ActionCenter } from './ActionCenter';
import { StatusOverview } from './StatusOverview';
import type { StatusMetric, StatusProjection, StatusResource } from './StatusOverview';
import { SettingsModal } from './SettingsModal';
import { WarJournal } from './WarJournal';
import { createWarEventTrace, getJournalComparisonStatus } from './journal';
import { ConfirmResetModal } from './ConfirmResetModal';
import { CommandPalette } from './CommandPalette';
import type { CommandPaletteItem } from './CommandPalette';
import { SaveCenter } from './SaveCenter';
import { deleteManualSave, isCampaignSavePayload, normalizeManualSaves, upsertManualSave } from './save';
import type { CampaignSavePayload, ManualSaveSlot } from './save';
import { assessRecruitmentOffer, isRecruitmentOfferSuccess, weeklyRivalInterest } from './recruitment';
import type { RecruitmentOffer } from './recruitment';
import { advanceStaffRosterWeek, getStaffContractWeeks, getStaffMeetingOption, getStaffRenewalCost, resolveStaffMeeting } from './staffManagement';
import type { StaffMeetingTopic } from './staffManagement';
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
import { acknowledgeUXActions, decorateUXActions, defaultUXPreferences, deriveOnboardingSteps, deriveUXActions, deriveWeeklyCommandCycle, getInitialNavigationCollapsed, isTrackedActionResolved, markUXActionsForVerification, normalizeUXActionLifecycle, normalizeUXPreferences, reconcileUXActionLifecycle, startUXAction } from './ux';
import type { UXAction, UXActionLifecycleRecord, UXPreferences } from './ux';
import {
  applyEquipmentToDivision,
  calculatePrototype,
  canResearchEquipment,
  canUseModule,
  createEquipmentDevelopment,
  getDevelopedEquipment,
  getEquipmentModule,
  getEquipmentNode,
  normalizeEquipmentDevelopment,
} from './equipment';
import { clampMapCamera, DEFAULT_MAP_CAMERA, deriveFrontLabelAnchors, deriveFrontSummaries, deriveMapConnections, deriveMapMarkerPresentation, deriveSameFrameMapConnections, deriveValidTargetIds, deriveVisibleMapLabelIds, getTerrainGlyphKind, MAX_MAP_ZOOM } from './mapPresentation';
import type { FrontSummary, MapCamera, MapLabelMode } from './mapPresentation';
import { getHistoricalMapPlacement, getHistoricalMapPoint, historicalMapFrames, historicalMapSources } from './historicalMaps';
import { getDefaultMapRegion, getMapRegion, getMapRegionForTerritory, getMapRegionsForTheater, getTerritoriesForMapRegion } from './mapRegions';
import { strategicFronts } from './strategicMapData';
import { achievementDefinitions, evaluateAchievements, getAchievement, getAchievementRecommendations, normalizeAchievementUnlocks, normalizeTrackedAchievementId } from './achievements';
import type { AchievementUnlock } from './achievements';
import { createWorldHistorySeed, generateWorldline, normalizeWorldHistoryState } from './worldHistory';
import type { WorldHistoryState } from './worldHistory';
import { deriveEmergentHistory, historyForceLabels } from './emergentHistory';
import type { EmergentHistoryProfile, HistoryForce } from './emergentHistory';
import { WorldFlashpointModal } from './WorldFlashpointModal';
import {
  createWorldFlashpointSelection,
  deriveWorldFlashpointEffects,
  forecastNextWorldFlashpoint,
  getHistoricalHorizon,
  getWorldFlashpointDecisionId,
  selectNextWorldFlashpoint,
} from './worldFlashpoints';
import type { ResolvedHistoricalEnding } from './historicalEndings';
import { createEmergentIntelligenceCandidates } from './intelligenceHistory';
import type { ResolvedIntelligenceOrganization } from './intelligenceHistory';
import { createLaterEraCandidates } from './laterEraFigures';
import {
  advancePublicHealthWeek,
  applyPublicHealthInvestment,
  calculateWeeklyOutbreakRisk,
  canFundPublicHealthInvestment,
  createPublicHealthSeed,
  createPublicHealthState,
  getPublicHealthInvestment,
  normalizePublicHealthState,
} from './publicHealth';
import type { PublicHealthInvestmentId, PublicHealthPolicyId } from './publicHealth';
import { advanceEconomyWeek, buyIndustrialStake, calculateEconomyLedger, createEconomyState, historicalCompanies, normalizeEconomyState, sellIndustrialStake } from './economy';
import type { BondProgramId, PriceControlId, TaxPolicyId } from './economy';
import { advanceMonetarySystem, buyForeignCurrency, formatNationalCurrency, getCurrencyById, issueCustomCurrency, restoreHistoricalCurrency, sellForeignCurrency } from './currency';
import type { CurrencyBacking } from './currency';
import { generateWorldWeeklyIssue, normalizeWorldWeeklyIssues } from './worldWeeklyEngine';
import type { WorldWeeklyIssue } from './worldWeeklyEngine';
import {
  advanceNationManagementWeek,
  calculateTransitionReadiness,
  createNationManagementState,
  nationStrategies,
  normalizeNationManagementState,
  rebalanceNationBudget,
} from './nationManagement';
import type { CampaignPhase, NationBudgetDomain, NationStrategyId, NationTransitionReason } from './nationManagement';
import {
  adoptGovernmentForm,
  arrangeDynasticMarriage,
  getGovernmentForm,
  getMarriageCandidates,
  grantNobleTitle,
  revokeNobleGrant,
  setSuccessionLaw,
} from './dynasticPolitics';
import type { DynasticActionResult, GovernmentFormId, NobleRankId, SuccessionLawId } from './dynasticPolitics';
import { applyElectionCampaignAction, launchReferendum } from './electoralPolitics';
import type { ElectionCampaignActionId, ElectoralActionResult, ElectoralContext, ReferendumTopicId } from './electoralPolitics';
import {
  calculateStaffSuitability,
  getCareerInstitutionalTitle,
  getStaffAuthorityProfile,
  getStaffSeatTitle,
  reassignStaff,
} from './staffOrganization';
import {
  advancePoliticalCrisisWeek,
  applyCoupPrevention,
  assessCoupRisk,
  createPoliticalCrisisState,
  getCoupRiskLabel,
  getNationPoliticalProfile,
  normalizePoliticalCrisisState,
  resolveCoupAttempt,
} from './politicalCrisis';
import type { CoupIncident, CoupPreventionId, CoupResponseId, PoliticalCrisisContext } from './politicalCrisis';
import { PoliticalCrisisModal } from './PoliticalCrisisModal';
import { deriveNationalSimulation } from './nationalSimulation';

const loadOrganizationPanel = () => import('./OrganizationPanel');
const loadEquipmentLab = () => import('./EquipmentLab');
const loadFieldManual = () => import('./FieldManual');
const loadTutorialOverlay = () => import('./TutorialOverlay');
const loadAchievementGallery = () => import('./AchievementGallery');
const loadWorldHistoryAtlas = () => import('./WorldHistoryAtlas');
const loadPublicHealthCenter = () => import('./PublicHealthCenter');
const loadEconomicMinistry = () => import('./EconomicMinistry');
const loadWorldWeekly = () => import('./WorldWeekly');
const loadNationManagementPanel = () => import('./NationManagementPanel');
const OrganizationPanel = lazy(() => loadOrganizationPanel().then((module) => ({ default: module.OrganizationPanel })));
const EquipmentLab = lazy(() => loadEquipmentLab().then((module) => ({ default: module.EquipmentLab })));
const FieldManual = lazy(() => loadFieldManual().then((module) => ({ default: module.FieldManual })));
const TutorialOverlay = lazy(() => loadTutorialOverlay().then((module) => ({ default: module.TutorialOverlay })));
const AchievementGallery = lazy(() => loadAchievementGallery().then((module) => ({ default: module.AchievementGallery })));
const WorldHistoryAtlas = lazy(() => loadWorldHistoryAtlas().then((module) => ({ default: module.WorldHistoryAtlas })));
const PublicHealthCenter = lazy(() => loadPublicHealthCenter().then((module) => ({ default: module.PublicHealthCenter })));
const EconomicMinistry = lazy(() => loadEconomicMinistry().then((module) => ({ default: module.EconomicMinistry })));
const WorldWeekly = lazy(() => loadWorldWeekly().then((module) => ({ default: module.WorldWeekly })));
const NationManagementPanel = lazy(() => loadNationManagementPanel().then((module) => ({ default: module.NationManagementPanel })));

function preloadGameTab(tab: GameTab) {
  if (tab === 'organization') void loadOrganizationPanel();
  if (tab === 'research') void loadEquipmentLab();
  if (tab === 'health') void loadPublicHealthCenter();
  if (tab === 'economy') void loadEconomicMinistry();
  if (tab === 'governance') void loadNationManagementPanel();
}

const SAVE_KEY = 'iron-dominion-campaign-v1';
const MANUAL_SAVE_KEY = 'iron-dominion-manual-saves-v1';
const UX_SETTINGS_KEY = 'iron-dominion-ux-v1';
const NAVIGATION_COLLAPSED_KEY = 'iron-dominion-navigation-collapsed-v1';
const TUTORIAL_KEY = 'iron-dominion-tutorial-v1';
const TRACKED_ACHIEVEMENT_KEY = 'iron-dominion-tracked-achievement-v1';
const DEFAULT_NATION_ID: NationId = 'britain';
const DEFAULT_ROLE_ID = 'britain-tier2';
const MAP_LAYER_META: Record<MapLayer, { label: string; description: string; key: string }> = {
  political: { label: '정치·통제', description: '소유국, 전략 거점과 실제 인접 전선을 표시합니다.', key: '1' },
  supply: { label: '보급망', description: '청록 보급로와 보급 50% 미만의 위험 거점을 강조합니다.', key: '2' },
  weather: { label: '기상', description: '강우·한랭·폭풍권이 작전에 미칠 영향을 표시합니다.', key: '3' },
  intelligence: { label: '정보 신뢰도', description: '적 지역 정보의 추정 신뢰도와 미확인 구간을 표시합니다.', key: '4' },
};

function DeferredSurface({ label, overlay = false }: { label: string; overlay?: boolean }) {
  return (
    <div className={overlay ? 'deferred-surface-backdrop' : 'deferred-surface'} role="status" aria-live="polite">
      <Clock3 size={19} aria-hidden="true" />
      <span><strong>{label}</strong><small>필요한 지휘 자료를 불러오고 있습니다.</small></span>
    </div>
  );
}

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
const defaultNationManagementState = createNationManagementState(
  DEFAULT_NATION_ID,
  initialGame,
  createEconomyState(DEFAULT_NATION_ID),
  initialResearch.filter((project) => project.complete).length,
  'negotiated',
);

interface PendingOffensivePlan {
  divisionId: string;
  originId: string;
  targetId: string;
  stance: BattleStance;
}

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

function ResourceChip({ icon, value, label, compactLabel = label, delta, tone = 'steel', priority = false }: { icon: GameIconName; value: string; label: string; compactLabel?: string; delta?: string; tone?: GameIconTone; priority?: boolean }) {
  return (
    <div className={'resource-chip' + (priority ? ' priority' : '')} title={`${label} ${value}${delta ? ` · ${delta}` : ''}`}>
      <span className="resource-icon"><GameIcon name={icon} size={17} tone={tone} /></span>
      <div className="resource-copy">
        <span className="resource-value-line">
          <strong>{value}</strong>
          {delta && <em>{delta}</em>}
        </span>
        <span className="resource-label" data-compact-label={compactLabel}>{label}</span>
      </div>
    </div>
  );
}

export function App() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [divisions, setDivisions] = useState<Division[]>(defaultDivisions);
  const [research, setResearch] = useState<ResearchProject[]>(initialResearch);
  const [equipmentDevelopment, setEquipmentDevelopment] = useState<EquipmentDevelopmentState>(() => createEquipmentDevelopment(DEFAULT_NATION_ID));
  const [production, setProduction] = useState<ProductionLine[]>(defaultProduction);
  const [events, setEvents] = useState<WarEvent[]>(initialEvents);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<GameTab>('command');
  const [trackedActionId, setTrackedActionId] = useState<string | null>(null);
  const [trackedActionSnapshot, setTrackedActionSnapshot] = useState<UXAction | null>(null);
  const [completedTrackedAction, setCompletedTrackedAction] = useState<UXAction | null>(null);
  const [uxActionLifecycle, setUXActionLifecycle] = useState<UXActionLifecycleRecord[]>([]);
  const [visitedOnboardingTabs, setVisitedOnboardingTabs] = useState<GameTab[]>(['command']);
  const [onboardingMilestones, setOnboardingMilestones] = useState<string[]>([]);
  const [navigationCollapsed, setNavigationCollapsed] = useState(() => {
    try {
      return getInitialNavigationCollapsed(localStorage.getItem(NAVIGATION_COLLAPSED_KEY), window.innerWidth);
    } catch {
      return getInitialNavigationCollapsed(null, window.innerWidth);
    }
  });
  const [selectedTerritoryId, setSelectedTerritoryId] = useState(getNationCommandTerritoryId(defaultNation));
  const [selectedDivisionId, setSelectedDivisionId] = useState(defaultDivisions[0].id);
  const [planningMode, setPlanningMode] = useState(false);
  const [pendingOffensivePlan, setPendingOffensivePlan] = useState<PendingOffensivePlan | null>(null);
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
  const [showStatusOverview, setShowStatusOverview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showFieldManual, setShowFieldManual] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSaveCenter, setShowSaveCenter] = useState(false);
  const [showAchievementGallery, setShowAchievementGallery] = useState(false);
  const [showWorldHistory, setShowWorldHistory] = useState(false);
  const [showWorldWeekly, setShowWorldWeekly] = useState(false);
  const [worldWeeklyIssues, setWorldWeeklyIssues] = useState<WorldWeeklyIssue[]>([]);
  const [lastReadWorldWeeklyId, setLastReadWorldWeeklyId] = useState<string | null>(null);
  const [lastReviewedJournalWeek, setLastReviewedJournalWeek] = useState(-1);
  const [pendingAchievementId, setPendingAchievementId] = useState<string | null>(null);
  const [achievementUnlocks, setAchievementUnlocks] = useState<AchievementUnlock[]>([]);
  const [trackedAchievementId, setTrackedAchievementId] = useState<string | null>(() => {
    try {
      return normalizeTrackedAchievementId(localStorage.getItem(TRACKED_ACHIEVEMENT_KEY));
    } catch {
      return null;
    }
  });
  const [worldHistoryState, setWorldHistoryState] = useState<WorldHistoryState>(() => ({
    seed: createWorldHistorySeed(DEFAULT_NATION_ID, DEFAULT_ROLE_ID),
    choices: {},
  }));
  const [publicHealth, setPublicHealth] = useState(() => createPublicHealthState(createPublicHealthSeed(DEFAULT_NATION_ID, DEFAULT_ROLE_ID)));
  const [economy, setEconomy] = useState(() => createEconomyState(DEFAULT_NATION_ID));
  const [campaignPhase, setCampaignPhase] = useState<CampaignPhase>('war');
  const [nationManagement, setNationManagement] = useState(() => defaultNationManagementState);
  const [politicalCrisis, setPoliticalCrisis] = useState(() => createPoliticalCrisisState(DEFAULT_NATION_ID));
  const [pendingCoupIncident, setPendingCoupIncident] = useState<CoupIncident | null>(null);
  const [showPoliticalCrisis, setShowPoliticalCrisis] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [manualSaves, setManualSaves] = useState<ManualSaveSlot[]>(() => {
    try {
      return normalizeManualSaves(JSON.parse(localStorage.getItem(MANUAL_SAVE_KEY) ?? '[]'));
    } catch {
      return [];
    }
  });
  const [stockpile, setStockpile] = useState<Stockpile>(initialStockpile);
  const [campaignOutcome, setCampaignOutcome] = useState<CampaignOutcome>(null);
  const [relations, setRelations] = useState<DiplomaticRelation[]>(initialRelations);
  const [operations, setOperations] = useState<CovertOperation[]>(initialOperations);
  const [mapLayer, setMapLayer] = useState<MapLayer>('political');
  const [mapCamera, setMapCamera] = useState<MapCamera>(DEFAULT_MAP_CAMERA);
  const [mapLabelMode, setMapLabelMode] = useState<MapLabelMode>('essential');
  const [mapFiltersOpen, setMapFiltersOpen] = useState(false);
  const [mapLegendOpen, setMapLegendOpen] = useState(false);
  const [mapIntelOpen, setMapIntelOpen] = useState(() => {
    try {
      return window.innerWidth >= 1700;
    } catch {
      return false;
    }
  });
  const [mapFocusMode, setMapFocusMode] = useState(false);
  const [mapSelectionOpen, setMapSelectionOpen] = useState(true);
  const [setupNationId, setSetupNationId] = useState<NationId>(DEFAULT_NATION_ID);
  const [setupRoleId, setSetupRoleId] = useState(DEFAULT_ROLE_ID);
  const [career, setCareer] = useState<CareerState>(() => createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
  const [activeTheater, setActiveTheater] = useState<TheaterId>('europe');
  const [activeMapRegionId, setActiveMapRegionId] = useState('europe-overview');
  const [staff, setStaff] = useState<StaffMember[]>(() => createStaffRoster(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
  const [staffCandidates, setStaffCandidates] = useState<StaffCandidate[]>(() => [
    ...createStaffCandidates(DEFAULT_NATION_ID, DEFAULT_ROLE_ID),
    ...createEmergentIntelligenceCandidates(DEFAULT_NATION_ID, 1942),
  ]);
  const [developmentFocusId, setDevelopmentFocusId] = useState<string | null>(null);
  const [supplyPolicy, setSupplyPolicy] = useState<SupplyPolicy>('balanced');
  const [procurementFocusId, setProcurementFocusId] = useState<string | null>('rifle');
  const [priorityDivisionId, setPriorityDivisionId] = useState(defaultDivisions[0].id);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [pendingCouncilEventId, setPendingCouncilEventId] = useState<string | null>(null);
  const [pendingWorldFlashpointId, setPendingWorldFlashpointId] = useState<string | null>(null);
  const [resolvedCouncilChoices, setResolvedCouncilChoices] = useState<string[]>([]);
  const [battleStance, setBattleStance] = useState<BattleStance>('balanced');
  const [battleReports, setBattleReports] = useState<BattleReport[]>([]);
  const [pendingBattleReportId, setPendingBattleReportId] = useState<string | null>(null);
  const [commanderDevelopment, setCommanderDevelopment] = useState<CommanderDevelopment[]>(defaultCommanderDevelopment);
  const toastTimerRef = useRef<number | null>(null);
  const deckContentRef = useRef<HTMLDivElement>(null);
  const deckScrollPositionsRef = useRef<Partial<Record<GameTab, number>>>({});

  useLayoutEffect(() => {
    const content = deckContentRef.current;
    if (!content) return undefined;
    content.scrollTop = deckScrollPositionsRef.current[activeTab] ?? 0;
    return () => {
      deckScrollPositionsRef.current[activeTab] = content.scrollTop;
    };
  }, [activeTab]);

  const playerNation = getNation(career.nationId);
  const careerRole = getRole(career.roleId, career.nationId);
  const staffAuthority = useMemo(() => getStaffAuthorityProfile(careerRole), [careerRole]);
  const currentRoleTitle = getCareerInstitutionalTitle(careerRole, campaignPhase, playerNation.status);
  const displayedCareerRole = useMemo(() => ({ ...careerRole, title: currentRoleTitle }), [careerRole, currentRoleTitle]);
  const playerFaction = playerNation.alignment;
  const enemyFaction: Exclude<Faction, 'neutral'> = playerFaction === 'allies' ? 'axis' : 'allies';
  const careerCommanders = useMemo(() => createCareerCommanders(playerNation, careerRole), [careerRole, playerNation]);
  const effectiveCommanders = useMemo(() => careerCommanders.map((commander) => {
    const assignedDivision = divisions.find((division) => division.commanderId === commander.id);
    return applyCommanderDevelopment(commander, getCommanderRecord(commanderDevelopment, commander), assignedDivision?.type);
  }), [careerCommanders, commanderDevelopment, divisions]);
  const effectiveDivisions = useMemo(
    () => divisions.map((division) => applyEquipmentToDivision(division, equipmentDevelopment)),
    [divisions, equipmentDevelopment],
  );
  const activePolicies = useMemo(() => strategicPolicies.filter((policy) => selectedPolicies.includes(policy.id)), [selectedPolicies]);
  const policyAttackBonus = activePolicies.reduce((total, policy) => total + (policy.attackBonus ?? 0), 0);
  const policyDefenseBonus = activePolicies.reduce((total, policy) => total + (policy.defenseBonus ?? 0), 0);
  const policyProductionMultiplier = activePolicies.reduce((total, policy) => total * (policy.productionMultiplier ?? 1), 1);
  const policySupplyRecovery = activePolicies.reduce((total, policy) => total + (policy.supplyRecovery ?? 0), 0);
  const delegatedDepartments = useMemo(() => new Set(staff.filter((member) => member.delegated).map((member) => member.department)), [staff]);
  const scienceAdvisor = staff.find((member) => member.department === 'science');
  const economyAdvisor = staff.find((member) => member.department === 'economy');
  const scienceAdvisorBonus = scienceAdvisor?.delegated ? Math.max(2, Math.round((scienceAdvisor.ability + scienceAdvisor.influence) / 62)) : 0;
  const economyAdvisorBonus = economyAdvisor?.delegated ? Math.max(8, Math.round((economyAdvisor.ability + economyAdvisor.influence) / 12)) : 0;
  const staffWeeklyCost = staff.reduce((total, member) => total + member.weeklyCost, 0);
  const averageDivisionSupply = useMemo(() => divisions.reduce((total, division) => total + division.supply, 0) / Math.max(1, divisions.length), [divisions]);
  const averageStaffLoyalty = useMemo(() => staff.reduce((total, member) => total + member.loyalty, 0) / Math.max(1, staff.length), [staff]);
  const averageStaffOverload = useMemo(() => staff.reduce((total, member) => total + member.workload, 0) / Math.max(1, staff.length), [staff]);
  const publicHealthContext = useMemo(() => ({
    week: game.week + 1,
    nationId: playerNation.id,
    theater: activeTheater,
    enemyPressure: game.enemyPressure,
    stability: game.stability,
    averageSupply: averageDivisionSupply,
    scienceBonus: scienceAdvisorBonus + (scienceAdvisor?.discipline === 'medicine' ? 3 : 0),
  }), [activeTheater, averageDivisionSupply, game.enemyPressure, game.stability, game.week, playerNation.id, scienceAdvisor?.discipline, scienceAdvisorBonus]);
  const publicHealthView = useMemo(() => ({
    ...publicHealth,
    weeklyRisk: calculateWeeklyOutbreakRisk(publicHealth, publicHealthContext),
  }), [publicHealth, publicHealthContext]);
  const economyForecast = useMemo(() => calculateEconomyLedger(economy, {
    week: game.week + 1,
    nationId: playerNation.id,
    game,
    staffWeeklyCost,
    economyAdvisorBonus,
  }), [economy, economyAdvisorBonus, game, playerNation.id, staffWeeklyCost]);
  const currentYear = 1942 + Math.floor(game.week / 52);
  const currencyMetrics = useMemo(() => ({ inflation: economy.inflation, publicConfidence: economy.publicConfidence }), [economy.inflation, economy.publicConfidence]);
  const formatGameMoney = useCallback((value: number, options: { signed?: boolean; exact?: boolean } = {}) => formatNationalCurrency(value, economy.monetarySystem, playerNation.id, currentYear, currencyMetrics, options), [currencyMetrics, currentYear, economy.monetarySystem, playerNation.id]);
  const politicalCrisisContext = useMemo<PoliticalCrisisContext>(() => ({
    week: game.week,
    phase: campaignPhase,
    game,
    economy,
    nation: nationManagement,
    averageSupply: averageDivisionSupply,
    staffLoyalty: averageStaffLoyalty,
    staffOverload: averageStaffOverload,
    councilTrust: career.councilTrust,
    reputation: career.reputation,
  }), [averageDivisionSupply, averageStaffLoyalty, averageStaffOverload, campaignPhase, career.councilTrust, career.reputation, economy, game, nationManagement]);
  const coupRisk = useMemo(() => assessCoupRisk(politicalCrisis, politicalCrisisContext), [politicalCrisis, politicalCrisisContext]);
  const politicalProfile = getNationPoliticalProfile(playerNation.id);
  const nationalSimulation = useMemo(() => deriveNationalSimulation({
    nationId: playerNation.id,
    phase: campaignPhase,
    game,
    economy,
    stockpile,
    production,
    divisions: effectiveDivisions,
    research,
    publicHealth: publicHealthView,
    selectedPolicies: activePolicies,
    politicalState: politicalCrisis,
    coupRisk,
    nationManagement,
  }), [activePolicies, campaignPhase, coupRisk, economy, effectiveDivisions, game, nationManagement, playerNation.id, politicalCrisis, production, publicHealthView, research, stockpile]);
  const pendingCouncilEvent = councilEvents.find((event) => event.id === pendingCouncilEventId) ?? null;
  const pendingBattleReport = battleReports.find((report) => report.id === pendingBattleReportId) ?? null;
  const theaterTerritories = useMemo(
    () => territories.filter((territory) => (territory.theater ?? 'europe') === activeTheater),
    [activeTheater, territories],
  );
  const theaterFrontSummaries = useMemo(
    () => deriveFrontSummaries(theaterTerritories, strategicFronts.filter((front) => front.theater === activeTheater), playerFaction),
    [activeTheater, playerFaction, theaterTerritories],
  );
  const activeMapRegion = useMemo(() => getMapRegion(activeMapRegionId, activeTheater), [activeMapRegionId, activeTheater]);
  const mapRegions = useMemo(() => getMapRegionsForTheater(activeTheater), [activeTheater]);
  const regionalTerritories = useMemo(
    () => getTerritoriesForMapRegion(theaterTerritories, activeMapRegion),
    [activeMapRegion, theaterTerritories],
  );
  const regionalTerritoryIds = useMemo(() => new Set(regionalTerritories.map((territory) => territory.id)), [regionalTerritories]);
  const regionalFrontSummaries = useMemo(() => theaterFrontSummaries.flatMap((front) => {
    const visibleTerritoryIds = front.territoryIds.filter((id) => regionalTerritoryIds.has(id));
    return visibleTerritoryIds.length ? [{ ...front, territoryIds: visibleTerritoryIds }] : [];
  }), [regionalTerritoryIds, theaterFrontSummaries]);
  const regionalCities = useMemo(
    () => regionalTerritories
      .filter((territory) => ['capital', 'city', 'port', 'fortress'].includes(territory.siteType ?? ''))
      .sort((a, b) => (a.labelTier ?? 3) - (b.labelTier ?? 3) || b.value - a.value || a.name.localeCompare(b.name, 'ko')),
    [regionalTerritories],
  );

  const selectedTerritory = useMemo(
    () => territories.find((territory) => territory.id === selectedTerritoryId) ?? territories[0],
    [selectedTerritoryId, territories],
  );
  const selectedFrontSummary = theaterFrontSummaries.find((front) => front.id === selectedTerritory.frontId);
  const selectedTerritoryDivisions = effectiveDivisions.filter((division) => division.territoryId === selectedTerritory.id).length;
  const selectedIsOperationalHeadquarters = campaignPhase === 'war' && playerNation.operationalHeadquarters?.territoryId === selectedTerritory.id;
  const selectedHostileNeighbors = selectedTerritory.neighbors.filter((neighborId) => {
    const controller = territories.find((territory) => territory.id === neighborId)?.controller;
    return controller !== undefined && controller !== selectedTerritory.controller && controller !== 'neutral';
  }).length;
  const selectedDivision = useMemo(
    () => effectiveDivisions.find((division) => division.id === selectedDivisionId) ?? effectiveDivisions[0],
    [effectiveDivisions, selectedDivisionId],
  );
  const selectedCommander = effectiveCommanders.find((commander) => commander.id === selectedDivision.commanderId) ?? effectiveCommanders[0];
  const selectedCommanderDevelopment = getCommanderRecord(commanderDevelopment, selectedCommander);
  const activeOrderPresentations = useMemo(() => orders.flatMap((order) => {
    const division = effectiveDivisions.find((item) => item.id === order.divisionId);
    const origin = territories.find((item) => item.id === order.fromId);
    const target = territories.find((item) => item.id === order.targetId);
    if (!division || !origin || !target) return [];
    const stance = order.stance ?? 'balanced';
    return [{
      order,
      division,
      origin,
      target,
      stanceLabel: stance === 'aggressive' ? '총공세' : stance === 'cautious' ? '신중 공세' : '균형 공세',
    }];
  }), [effectiveDivisions, orders, territories]);
  const pendingPlanDivisionId = pendingOffensivePlan?.divisionId;
  const pendingPlanOriginId = pendingOffensivePlan?.originId;
  const pendingPlanTargetId = pendingOffensivePlan?.targetId;
  const pendingOffensivePlanDetails = useMemo(() => {
    if (!pendingPlanDivisionId || !pendingPlanOriginId || !pendingPlanTargetId) return null;
    const division = effectiveDivisions.find((item) => item.id === pendingPlanDivisionId);
    const origin = territories.find((item) => item.id === pendingPlanOriginId);
    const target = territories.find((item) => item.id === pendingPlanTargetId);
    const commander = effectiveCommanders.find((item) => item.id === division?.commanderId);
    return division && origin && target && commander ? { division, origin, target, commander } : null;
  }, [effectiveDivisions, effectiveCommanders, pendingPlanDivisionId, pendingPlanOriginId, pendingPlanTargetId, territories]);
  const offensiveForecasts = useMemo<Record<BattleStance, BattleForecast> | null>(() => {
    if (!pendingOffensivePlanDetails) return null;
    const { division, commander, target } = pendingOffensivePlanDetails;
    const doctrineBonus = doctrine === 'maneuver' && division.type === 'armor' ? 14 : doctrine === 'methodical' ? 7 : 4;
    const priorityBonus = division.id === priorityDivisionId ? 5 : 0;
    const baseForecast = {
      week: game.week,
      division,
      commander,
      target,
      enemyPressure: game.enemyPressure,
      intelNetwork: game.intelNetwork,
      doctrineBonus,
      policyAttackBonus,
      priorityBonus,
    };
    return {
      cautious: forecastBattle({ ...baseForecast, stance: 'cautious' }),
      balanced: forecastBattle({ ...baseForecast, stance: 'balanced' }),
      aggressive: forecastBattle({ ...baseForecast, stance: 'aggressive' }),
    };
  }, [doctrine, game.enemyPressure, game.intelNetwork, game.week, pendingOffensivePlanDetails, policyAttackBonus, priorityDivisionId]);
  const warUXActions = useMemo(() => deriveUXActions({
    factories: game.factories,
    production,
    research,
    selectedPolicies,
    divisions,
    orders,
    commanderDevelopment,
    publicHealth: publicHealthView,
    economyOperatingBalance: economyForecast.operatingRevenue - economyForecast.totalExpenses,
    economyInflation: economy.inflation,
    economyDebt: economy.debt,
    formatMoney: formatGameMoney,
  }), [commanderDevelopment, divisions, economy.debt, economy.inflation, economyForecast.operatingRevenue, economyForecast.totalExpenses, formatGameMoney, game.factories, orders, production, publicHealthView, research, selectedPolicies]);
  const nationUXActions = useMemo<UXAction[]>(() => {
    const actions: UXAction[] = [];
    const latestReport = nationManagement.reports[0];
    if (!latestReport) actions.push({
      id: 'nation-first-week', priority: 'recommended', title: '첫 국정 결산이 필요합니다', detail: '예산과 국가 발전 노선을 확인한 뒤 한 주를 진행해 정책 결과를 계산하십시오.',
      reason: '건국·종전 이후 아직 기준 국정 보고서가 만들어지지 않았습니다.', ifIgnored: '예산과 발전 노선의 효과를 비교할 첫 기준선이 늦어집니다.', resolution: '한 주 진행 후 첫 국정 결산에서 확인',
      instruction: '국가 발전 노선과 예산 배분을 확인하고, 상단의 주간 진행으로 첫 국정 기준선을 확정하십시오.',
      label: '국가 운영 열기', tab: 'governance',
    });
    if (economy.inflation >= 10) actions.push({
      id: 'nation-inflation', priority: 'urgent', title: `물가가 ${economy.inflation.toFixed(1)}%까지 상승했습니다`, detail: '공공지출·산업 공급·가격 통제의 조합을 재검토해야 합니다.',
      reason: `물가 ${economy.inflation.toFixed(1)}% · 안정 관리 기준 10% 초과`, ifIgnored: '생활수준·실질임금·정부 신뢰가 함께 낮아질 수 있습니다.', resolution: '예산·산업 정책 조정 · 다음 주 국정 결산에 반영',
      instruction: '물가를 올리는 지출과 공급 부족을 확인하고 산업·복지·가격 정책을 함께 재배분하십시오.',
      label: '재정 조정', tab: 'governance',
    });
    if (nationManagement.unrest >= 55) actions.push({
      id: 'nation-unrest', priority: 'urgent', title: `사회 불안 ${Math.round(nationManagement.unrest)}`, detail: '복지·주택·고용 예산과 정통성의 부족이 국내 질서를 압박합니다.',
      reason: `사회 불안 ${Math.round(nationManagement.unrest)} · 위기 기준 55 초과`, ifIgnored: '파업·폭동·쿠데타 세력의 조직화 가능성이 커집니다.', resolution: '예산·제도 조정 · 다음 주 불안도와 권력집단 반응 확인',
      instruction: '불만이 큰 인구집단을 확인한 뒤 복지·주택·고용 예산과 정통성 제도를 우선 조정하십시오.',
      label: '예산 재배분', tab: 'governance',
    });
    if (nationManagement.mandateScore < 50) actions.push({
      id: 'nation-mandate', priority: 'recommended', title: `국민 위임 ${nationManagement.mandateScore}`, detail: `다음 평가까지 ${Math.max(0, nationManagement.nextElectionWeek - game.week)}주 남았습니다. 생활 지표와 정부 신뢰를 회복하십시오.`,
      reason: `국민 위임 ${nationManagement.mandateScore} · 안정 기준 50 미만`, ifIgnored: '선거·당대회·정권 평가에서 정책 권한이 축소될 수 있습니다.', resolution: '생활·신뢰 정책 조정 · 매주 위임 점수에 누적 반영',
      instruction: '평가일까지 남은 기간을 확인하고 생활수준과 정부 신뢰를 동시에 높일 예산·제도를 선택하십시오.',
      label: '국정 지표 보기', tab: 'governance',
    });
    if (nationManagement.electoral.activeCampaign) {
      const election = nationManagement.electoral.activeCampaign;
      actions.push({
        id: 'nation-election-campaign', priority: election.electionWeek - game.week <= 2 ? 'urgent' : 'recommended', title: `${election.type === 'presidential' ? '대통령 선거' : election.type === 'parliamentary' ? '총선거' : election.type === 'referendum' ? '국민투표' : '지방·시장 선거'} ${Math.max(0, election.electionWeek - game.week)}주 전`, detail: `현재 ${election.stage} 단계입니다. 유세 행동과 집중 지역을 선택하지 않으면 상대 후보 조직력이 그대로 득표에 반영됩니다.`,
        reason: `예상 투표율 ${election.turnoutProjection.toFixed(1)}% · 절차 신뢰 ${election.integrity.toFixed(1)} · 양극화 ${election.polarization.toFixed(1)}`, ifIgnored: '후보 기세·지역 판세·시장 선거 연계에서 주도권을 잃을 수 있습니다.', resolution: `제${election.electionWeek + 1}주 투표·개표 결과에서 확인`,
        instruction: '선거 상황실에서 후보별 기세와 지역을 확인하고 이번 주 유세·토론·공약·선거관리 행동을 선택하십시오.',
        label: '선거 상황실', tab: 'governance',
      });
    }
    if (publicHealth.activeOutbreak) actions.push({
      id: 'nation-health', priority: 'urgent', title: `${publicHealth.activeOutbreak.codeName} 보건 위기`, detail: '유행 대응 비용과 인명 피해가 복지·재정·국민 위임에 영향을 줍니다.',
      reason: `활성 유행 · ${publicHealth.activeOutbreak.codeName}`, ifIgnored: '인명 피해와 의료비가 재정·생산성·국민 위임을 동시에 압박합니다.', resolution: '보건 태세 변경 즉시 · 다음 주 국정·보건 결산에서 확인',
      instruction: '태세별 감염·사망·병상 전망과 비용을 비교해 국가 운영이 감당할 대응책을 확정하십시오.',
      label: '보건 위기 지휘', tab: 'health',
    });
    if (actions.length === 0) actions.push({
      id: 'nation-stable', priority: 'info', title: '국정 운영이 안정적입니다', detail: '장기 산업·교육·외교 목표를 향해 다음 주를 진행할 수 있습니다.',
      reason: '긴급 임계치를 넘은 국정 지표가 없습니다.', ifIgnored: '즉시 위험은 없지만 장기 성장 기회를 활용하지 못할 수 있습니다.', resolution: '장기 목표 선택 · 다음 주 성장 지표에서 확인',
      instruction: '산업·교육·외교 중 이번 임기의 우선 목표를 정하고 예산을 집중한 뒤 다음 주를 진행하십시오.',
      label: '국정 현황', tab: 'governance',
    });
    return actions;
  }, [economy.inflation, game.week, nationManagement, publicHealth.activeOutbreak]);
  const baseUXActions = campaignPhase === 'nation' ? nationUXActions : warUXActions;
  const rawUXActions = useMemo<UXAction[]>(() => {
    const coupAction: UXAction | null = coupRisk.tier === 'stable' ? null : {
      id: 'political-crisis',
      priority: coupRisk.tier === 'critical' || coupRisk.tier === 'dangerous' ? 'urgent' : 'recommended',
      title: `쿠데타 위험 ${getCoupRiskLabel(coupRisk.tier)} · ${coupRisk.score}`,
      detail: `${coupRisk.leadingFaction.name}의 불만·조직력과 국내 대립이 누적되고 있습니다. 다음 주 시도 확률 ${coupRisk.weeklyChance.toFixed(1)}%.`,
      reason: `${coupRisk.leadingFaction.name} 주도 · 위험 점수 ${coupRisk.score}`,
      ifIgnored: `다음 주 쿠데타 시도 확률 ${coupRisk.weeklyChance.toFixed(1)}%가 그대로 적용됩니다.`,
      resolution: '파벌·기관 대응 즉시 · 다음 주 정치위기 판정에서 검증',
      instruction: '최대 위험 파벌과 장악 기관을 확인하고 회유·감찰·인사 조치 중 권한과 자원에 맞는 대응을 선택하십시오.',
      label: '정치위기 상황실',
      tab: 'command',
      signalValue: coupRisk.score,
    };
    const actions = coupAction ? [coupAction, ...baseUXActions] : baseUXActions;
    const order = { urgent: 0, recommended: 1, info: 2 } as const;
    return [...actions].sort((left, right) => order[left.priority] - order[right.priority]);
  }, [baseUXActions, coupRisk]);
  const uxActionSignature = rawUXActions.map((action) => `${action.id}:${action.priority}:${action.signalValue ?? ''}`).join('|');
  const uxActions = useMemo(() => decorateUXActions(rawUXActions, uxActionLifecycle), [rawUXActions, uxActionLifecycle]);
  const trackedAction = trackedActionId
    ? uxActions.find((action) => action.id === trackedActionId) ?? null
    : null;
  const relationAverage = useMemo(
    () => relations.reduce((total, relation) => total + relation.value, 0) / Math.max(1, relations.length),
    [relations],
  );
  const transitionReadiness = useMemo(
    () => calculateTransitionReadiness(game, relationAverage, economy),
    [economy, game, relationAverage],
  );
  const tabActionSummary = useMemo(() => {
    const counts: Partial<Record<GameTab, number>> = { command: uxActions.length };
    const urgentTabs = new Set<GameTab>();
    uxActions.forEach((action) => {
      if (action.tab !== 'command') counts[action.tab] = (counts[action.tab] ?? 0) + 1;
      if (action.priority === 'urgent') {
        urgentTabs.add(action.tab);
        urgentTabs.add('command');
      }
    });
    return { counts, urgentTabs };
  }, [uxActions]);
  const latestWorldWeeklyIssue = worldWeeklyIssues[0] ?? null;
  const hasUnreadWorldWeekly = Boolean(latestWorldWeeklyIssue && latestWorldWeeklyIssue.id !== lastReadWorldWeeklyId);
  const onboardingSteps = useMemo(() => deriveOnboardingSteps({
    role: careerRole,
    week: game.week,
    briefingRead: !hasUnreadWorldWeekly,
    visitedTabs: visitedOnboardingTabs,
    milestones: onboardingMilestones,
    factories: game.factories,
    production,
    research,
    selectedPolicies,
    orders,
  }), [careerRole, game.factories, game.week, hasUnreadWorldWeekly, onboardingMilestones, orders, production, research, selectedPolicies, visitedOnboardingTabs]);
  const historyTrajectory = useMemo(() => deriveEmergentHistory({
    doctrine,
    roleBranch: careerRole.branch,
    game,
    selectedPolicies: activePolicies,
    completedDecisions,
    events,
    research,
    operations,
    relations,
    nationStrategyId: campaignPhase === 'nation' ? nationManagement.strategyId : undefined,
    nationBudget: campaignPhase === 'nation' ? nationManagement.budget : undefined,
  }), [activePolicies, campaignPhase, careerRole.branch, completedDecisions, doctrine, events, game, nationManagement.budget, nationManagement.strategyId, operations, relations, research]);
  const achievementProgress = useMemo(() => evaluateAchievements({
    game,
    stockpile,
    divisions,
    research,
    operations,
    staff,
    relations,
    completedDecisions,
    events,
    battleReports,
    careerTier: careerRole.tier,
    selectedPolicies,
    campaignOutcome,
    campaignPhase,
    equipmentDevelopment,
    economy,
    publicHealth,
    nationManagement,
  }), [battleReports, campaignOutcome, campaignPhase, careerRole.tier, completedDecisions, divisions, economy, equipmentDevelopment, events, game, nationManagement, operations, publicHealth, relations, research, selectedPolicies, staff, stockpile]);
  const recommendedAchievement = useMemo(() => getAchievementRecommendations(
    achievementProgress,
    new Set(achievementUnlocks.map((unlock) => unlock.id)),
    1,
  )[0], [achievementProgress, achievementUnlocks]);
  const trackedAchievement = trackedAchievementId ? getAchievement(trackedAchievementId) : undefined;
  const activeAchievement = trackedAchievement && !achievementUnlocks.some((unlock) => unlock.id === trackedAchievement.id)
    ? trackedAchievement
    : recommendedAchievement;
  const worldline = useMemo(() => generateWorldline({
    nation: playerNation,
    game,
    state: worldHistoryState,
    trajectory: historyTrajectory,
  }), [game, historyTrajectory, playerNation, worldHistoryState]);
  const pendingWorldFlashpointEntry = pendingWorldFlashpointId
    ? worldline.timeline.find((entry) => entry.event.id === pendingWorldFlashpointId)
    : undefined;
  const pendingWorldFlashpoint = pendingWorldFlashpointEntry
    ? createWorldFlashpointSelection(pendingWorldFlashpointEntry, game.week, completedDecisions)
    : null;
  const worldFlashpointForecast = useMemo(
    () => forecastNextWorldFlashpoint(worldline.timeline, game.week, completedDecisions),
    [completedDecisions, game.week, worldline.timeline],
  );
  const globalWeeklyCycle = useMemo(() => deriveWeeklyCommandCycle({
    week: game.week,
    hasCurrentWeekResults: events.some((event) => event.week === game.week),
    resultsReviewed: game.week === 0 || lastReviewedJournalWeek >= game.week,
    weeklyUnread: hasUnreadWorldWeekly,
    urgentCount: uxActions.filter((action) => action.priority === 'urgent').length,
    recommendedCount: uxActions.filter((action) => action.priority === 'recommended').length,
    activeOrders: orders.length,
    activeResearch: research.filter((project) => project.active && !project.complete).length,
  }), [events, game.week, hasUnreadWorldWeekly, lastReviewedJournalWeek, orders.length, research, uxActions]);
  const savePayload = useMemo<CampaignSavePayload>(() => ({
    version: 22,
    game,
    territories,
    divisions,
    research,
    equipmentDevelopment,
    production,
    events,
    orders,
    stockpile,
    relations,
    operations,
    campaignOutcome,
    objectiveProgress,
    torchAuthorized,
    completedDecisions,
    doctrine,
    career,
    activeTheater,
    selectedTerritoryId,
    selectedDivisionId,
    staff,
    staffCandidates,
    developmentFocusId,
    supplyPolicy,
    procurementFocusId,
    priorityDivisionId,
    selectedPolicies,
    pendingCouncilEventId,
    pendingWorldFlashpointId,
    resolvedCouncilChoices,
    battleStance,
    battleReports,
    pendingBattleReportId,
    commanderDevelopment,
    achievementUnlocks,
    worldHistoryState,
    publicHealth,
    economy,
    worldWeeklyIssues,
    lastReadWorldWeeklyId,
    lastReviewedJournalWeek,
    uxActionLifecycle,
    visitedOnboardingTabs,
    onboardingMilestones,
    campaignPhase,
    nationManagement,
    politicalCrisis,
    pendingCoupIncident,
  }), [achievementUnlocks, activeTheater, battleReports, battleStance, campaignOutcome, campaignPhase, career, commanderDevelopment, completedDecisions, developmentFocusId, divisions, doctrine, economy, equipmentDevelopment, events, game, lastReadWorldWeeklyId, lastReviewedJournalWeek, nationManagement, objectiveProgress, onboardingMilestones, operations, orders, pendingBattleReportId, pendingCouncilEventId, pendingCoupIncident, pendingWorldFlashpointId, politicalCrisis, priorityDivisionId, procurementFocusId, production, publicHealth, relations, research, resolvedCouncilChoices, selectedDivisionId, selectedPolicies, selectedTerritoryId, staff, staffCandidates, stockpile, supplyPolicy, territories, torchAuthorized, uxActionLifecycle, visitedOnboardingTabs, worldHistoryState, worldWeeklyIssues]);
  const campaignDate = getCampaignDate(game.week);
  const isKoreaWarCampaign = playerNation.id === 'korea' && campaignPhase === 'war';
  const statusResources: StatusResource[] = [
    { id: 'treasury', label: isKoreaWarCampaign ? '독립운동 기금' : '국고', value: formatGameMoney(game.treasury), delta: campaignPhase === 'nation' && nationManagement.reports[0] ? formatGameMoney(nationManagement.reports[0].fiscalBalance, { signed: true }) : formatGameMoney(economyForecast.netTreasuryChange, { signed: true }), detail: isKoreaWarCampaign ? '임시정부 운영·연합 조달·국내 공작 재원' : '정책·조달·급여의 공통 재원', icon: 'treasury', tone: 'gold', priority: true },
    { id: 'politics', label: isKoreaWarCampaign ? '외교·조직력' : campaignPhase === 'nation' ? '정치 역량' : '정치력', value: formatNumber(game.politicalPower), delta: campaignPhase === 'nation' ? `위임 ${nationManagement.mandateScore}` : '+3/주', detail: isKoreaWarCampaign ? '승인 교섭·정파 통합·인사 결재' : '인사·외교·정책 결재에 사용', icon: 'politics', tone: 'gold', priority: true },
    { id: 'manpower', label: isKoreaWarCampaign ? '동원 가능 인력' : campaignPhase === 'nation' ? '노동·예비 인력' : '가용 인력', value: `${formatNumber(game.manpower)}K`, delta: campaignPhase === 'nation' ? `고용 ${Math.round(nationManagement.employment)}` : '+18/주', detail: isKoreaWarCampaign ? '광복군 충원·연락망·해방 행정 인력' : campaignPhase === 'nation' ? '산업·행정·국방 인력 기반' : '편제 충원과 손실 보충', icon: 'manpower', tone: 'blue' },
    { id: 'factories', label: isKoreaWarCampaign ? '협력 생산망' : campaignPhase === 'nation' ? '산업 기반' : '군수 공장', value: String(game.factories), delta: campaignPhase === 'nation' ? `민수 ${Math.round(nationManagement.civilianIndustry)}` : undefined, detail: isKoreaWarCampaign ? '중국·연합군 조달과 분산 작업장' : '장비·기반시설 생산 능력', icon: 'industry', tone: 'steel' },
    { id: 'fuel', label: isKoreaWarCampaign ? '작전 연료' : campaignPhase === 'nation' ? '전략 에너지' : '연료', value: `${formatNumber(game.fuel)}K`, delta: campaignPhase === 'nation' ? undefined : '+2.6/주', detail: isKoreaWarCampaign ? '광복군 훈련·침투·연합 수송 지원' : '기갑·항공·해군 작전 지속', icon: 'fuel', tone: 'green' },
    { id: 'steel', label: isKoreaWarCampaign ? '조달 강철' : '강철', value: `${formatNumber(game.steel)}K`, delta: '+9/주', detail: isKoreaWarCampaign ? '연합 조달 장비와 정비 부품 원료' : '중장비·차량·함정 생산 원료', icon: 'steel', tone: 'steel' },
  ];
  const projectionCompletedResearch = research.filter((project) => project.complete).length;
  const projectionPublicHealthPressure = publicHealth.activeOutbreak
    ? Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.weeklyCases / 10_000)
    : publicHealth.outbreakPressure * 0.12;
  const nationWeekProjection = useMemo(() => campaignPhase === 'nation'
    ? advanceNationManagementWeek(nationManagement, {
      week: game.week + 1,
      game,
      economy,
      relationAverage,
      completedResearch: projectionCompletedResearch,
      publicHealthPressure: projectionPublicHealthPressure,
      role: careerRole,
    })
    : null, [campaignPhase, careerRole, economy, game, nationManagement, projectionCompletedResearch, projectionPublicHealthPressure, relationAverage]);
  const projectionResearchGain = campaignPhase === 'nation' && nationWeekProjection
    ? 6 + Math.floor(nationWeekProjection.state.education / 18) + scienceAdvisorBonus
    : (doctrine === 'methodical' ? 13 : 11) + 2 + scienceAdvisorBonus + (scienceAdvisor?.discipline === 'science' ? 1 : 0);
  const projectionActiveResearch = research.filter((project) => project.active && !project.complete);
  const projectionBreakthroughs = projectionActiveResearch.filter((project) => project.progress + projectionResearchGain >= project.duration);
  const baseProductionProjection = calculateProductionGains(production, game.week + 1);
  const projectionFocusMultiplier = (lineId: string) => procurementFocusId === lineId ? 1.12 : 1;
  const productionProjection = {
    tanks: Math.round(baseProductionProjection.tanks * policyProductionMultiplier * projectionFocusMultiplier('sherman')),
    aircraft: Math.round(baseProductionProjection.aircraft * policyProductionMultiplier * projectionFocusMultiplier('spitfire')),
    infantryEquipment: Math.round(baseProductionProjection.infantryEquipment * policyProductionMultiplier * projectionFocusMultiplier('rifle')),
    convoys: Math.round(baseProductionProjection.convoys * policyProductionMultiplier * projectionFocusMultiplier('convoy')),
    artillery: Math.round(baseProductionProjection.artillery * policyProductionMultiplier * projectionFocusMultiplier('artillery')),
    trucks: Math.round(baseProductionProjection.trucks * policyProductionMultiplier * projectionFocusMultiplier('truck')),
  };
  const projectionProductionTotal = Object.values(productionProjection).reduce((total, amount) => total + amount, 0);
  const projectionManpowerGain = 18 + (scienceAdvisor?.delegated && scienceAdvisor.discipline === 'medicine' ? 6 : 0);
  const projectionPoliticalGain = 3 + (delegatedDepartments.has('political') ? 1 : 0) + (scienceAdvisor?.delegated && scienceAdvisor.discipline === 'social-science' ? 1 : 0);
  const projectionCommandGain = 6 + (delegatedDepartments.has('operations') ? 2 : 0);
  const projectionFuelDelta = Number((8 - game.factories * 0.18 - (supplyPolicy === 'frontline' ? 2 : 0)).toFixed(1));
  const projectionOrderTarget = orders[0] ? territories.find((territory) => territory.id === orders[0].targetId)?.name : null;
  const statusProjections: StatusProjection[] = campaignPhase === 'nation' && nationWeekProjection
    ? [
      {
        id: 'nation-finance',
        label: '재정 수지',
        value: formatGameMoney(nationWeekProjection.report.fiscalBalance, { signed: true }),
        detail: `세입 ${formatGameMoney(nationWeekProjection.report.fiscalRevenue)} · 지출 ${formatGameMoney(nationWeekProjection.report.fiscalExpenditure)}`,
        tone: nationWeekProjection.report.fiscalBalance < -12 ? 'danger' : nationWeekProjection.report.fiscalBalance < 0 ? 'warning' : 'good',
        icon: 'treasury',
      },
      {
        id: 'nation-performance',
        label: '국가 성과·위임',
        value: `${nationManagement.nationalScore} → ${nationWeekProjection.state.nationalScore}`,
        detail: `국민 위임 ${nationManagement.mandateScore} → ${nationWeekProjection.state.mandateScore} · 사회 불안 ${nationWeekProjection.state.unrest.toFixed(1)}`,
        tone: nationWeekProjection.state.mandateScore < 40 ? 'danger' : nationWeekProjection.state.mandateScore < 55 ? 'warning' : 'good',
        icon: 'politics',
      },
      {
        id: 'nation-economy',
        label: '물가·부채',
        value: `물가 ${nationWeekProjection.economyDelta.inflation >= 0 ? '+' : ''}${nationWeekProjection.economyDelta.inflation.toFixed(2)}%p`,
        detail: `부채 ${formatGameMoney(nationWeekProjection.economyDelta.debt, { signed: true })} · 공공신뢰 ${nationWeekProjection.economyDelta.publicConfidence >= 0 ? '+' : ''}${nationWeekProjection.economyDelta.publicConfidence.toFixed(2)}`,
        tone: nationWeekProjection.economyDelta.inflation > 0.2 || nationWeekProjection.economyDelta.debt > 12 ? 'warning' : 'neutral',
        icon: 'industry',
      },
      {
        id: 'nation-research',
        label: '국가 연구',
        value: projectionActiveResearch.length ? `${projectionActiveResearch.length}건 · 각각 +${projectionResearchGain}` : '배정 필요',
        detail: projectionBreakthroughs.length ? `완료 예정: ${projectionBreakthroughs.map((project) => project.name).join(' · ')}` : projectionActiveResearch.map((project) => project.name).join(' · ') || '빈 연구 슬롯은 주간 연구량을 잃습니다.',
        tone: projectionActiveResearch.length ? 'good' : 'warning',
        icon: 'research',
      },
    ]
    : [
      {
        id: 'war-finance',
        label: '전시 재정',
        value: formatGameMoney(economyForecast.netTreasuryChange, { signed: true }),
        detail: `경상세입 ${formatGameMoney(economyForecast.operatingRevenue)} · 총지출 ${formatGameMoney(economyForecast.totalExpenses)} · 조달 ${formatGameMoney(economyForecast.financingRaised)}`,
        tone: economyForecast.netTreasuryChange < -12 ? 'danger' : economyForecast.netTreasuryChange < 0 ? 'warning' : 'good',
        icon: 'treasury',
      },
      {
        id: 'war-production',
        label: '군수 생산',
        value: `총 +${formatNumber(projectionProductionTotal)}`,
        detail: `보병 +${formatNumber(productionProjection.infantryEquipment)} · 전차 +${formatNumber(productionProjection.tanks)} · 항공 +${formatNumber(productionProjection.aircraft)} · 야포 +${formatNumber(productionProjection.artillery)}`,
        tone: productionProjection.infantryEquipment > 0 ? 'good' : 'warning',
        icon: 'industry',
      },
      {
        id: 'war-research',
        label: '연구 진척',
        value: projectionActiveResearch.length ? `${projectionActiveResearch.length}건 · 각각 +${projectionResearchGain}` : '배정 필요',
        detail: projectionBreakthroughs.length ? `완료 예정: ${projectionBreakthroughs.map((project) => project.name).join(' · ')}` : projectionActiveResearch.map((project) => project.name).join(' · ') || '연구 슬롯이 비어 있습니다.',
        tone: projectionActiveResearch.length ? 'good' : 'warning',
        icon: 'research',
      },
      {
        id: 'war-operations',
        label: '작전 판정',
        value: orders.length ? `${orders.length}건 예약` : '명령 없음',
        detail: orders.length ? `다음 판정: ${projectionOrderTarget ?? '목표 지역'} · ${battleStance === 'aggressive' ? '강공' : battleStance === 'cautious' ? '신중' : '균형'} 태세` : '작전 결과 없이 행정 주간으로 진행됩니다.',
        tone: orders.length ? 'good' : 'warning',
        icon: 'army',
      },
      {
        id: 'war-resources',
        label: '국력 변화',
        value: `인력 +${projectionManpowerGain} · 연료 ${projectionFuelDelta >= 0 ? '+' : ''}${projectionFuelDelta}`,
        detail: `정치력 +${projectionPoliticalGain} · 지휘 +${projectionCommandGain} · 강철 +9`,
        tone: game.fuel + projectionFuelDelta < 25 ? 'danger' : projectionFuelDelta < 0 ? 'warning' : 'neutral',
        icon: 'supply',
      },
    ];
  const statusMetrics: StatusMetric[] = [
    {
      id: 'coup',
      label: isKoreaWarCampaign ? '독립운동 내부 갈등' : '국내 정치위기',
      value: `${getCoupRiskLabel(coupRisk.tier)} ${coupRisk.score}`,
      detail: `다음 주 시도 확률 ${coupRisk.weeklyChance.toFixed(1)}%`,
      tone: coupRisk.tier === 'critical' || coupRisk.tier === 'dangerous' ? 'danger' : coupRisk.tier === 'watch' ? 'warning' : 'good',
      icon: 'alert',
    },
    {
      id: 'health',
      label: publicHealthView.activeOutbreak ? '보건 비상' : '감염병 감시',
      value: publicHealthView.activeOutbreak?.codeName ?? `${(publicHealthView.weeklyRisk * 100).toFixed(2)}%`,
      detail: publicHealthView.activeOutbreak ? `R ${publicHealthView.activeOutbreak.rEffective.toFixed(2)} · 병상 ${Math.round(publicHealthView.activeOutbreak.hospitalLoad)}%` : '다음 주 발병 추정 확률',
      tone: publicHealthView.activeOutbreak ? 'danger' : publicHealthView.weeklyRisk >= 0.018 ? 'warning' : 'good',
      icon: 'health',
    },
    {
      id: 'stability',
      label: isKoreaWarCampaign ? '독립운동 결속' : '국가 안정도',
      value: `${Math.round(game.stability)}`,
      detail: game.stability < 45 ? '정책 집행과 국내 질서가 위험합니다.' : '정부 집행력과 국내 질서',
      tone: game.stability < 40 ? 'danger' : game.stability < 60 ? 'warning' : 'good',
      icon: 'organization',
    },
    campaignPhase === 'nation'
      ? { id: 'mandate', label: '국민 위임', value: `${nationManagement.mandateScore}`, detail: `사회 불안 ${Math.round(nationManagement.unrest)} · 고용 ${Math.round(nationManagement.employment)}`, tone: nationManagement.mandateScore < 40 ? 'danger' : nationManagement.mandateScore < 60 ? 'warning' : 'good', icon: 'politics' }
      : { id: 'pressure', label: isKoreaWarCampaign ? '점령지 압력' : '적 전선 압력', value: `${Math.round(game.enemyPressure)}`, detail: `전쟁 지지도 ${Math.round(game.warSupport)} · 평균 보급 ${Math.round(averageDivisionSupply)}`, tone: game.enemyPressure >= 75 ? 'danger' : game.enemyPressure >= 58 ? 'warning' : 'neutral', icon: 'army' },
  ];
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    setUXActionLifecycle((current) => reconcileUXActionLifecycle(current, rawUXActions, game.week));
  }, [game.week, rawUXActions, uxActionSignature]);

  useEffect(() => {
    if (!isTrackedActionResolved(trackedActionId, uxActions) || trackedAction || trackedActionSnapshot?.id !== trackedActionId) return;
    setCompletedTrackedAction(trackedActionSnapshot);
    setTrackedActionSnapshot(null);
    setTrackedActionId(null);
    notify(`지시 완료 · ${trackedActionSnapshot.title} · ${trackedActionSnapshot.resolution ?? '다음 주 결산에서 결과를 확인하십시오.'}`);
  }, [notify, trackedAction, trackedActionId, trackedActionSnapshot, uxActions]);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    localStorage.setItem(UX_SETTINGS_KEY, JSON.stringify(uxPreferences));
  }, [uxPreferences]);

  useEffect(() => {
    try {
      if (!window.matchMedia('(max-width: 900px)').matches) {
        localStorage.setItem(NAVIGATION_COLLAPSED_KEY, String(navigationCollapsed));
      }
    } catch {
      // Navigation still works for the current session when storage is unavailable.
    }
  }, [navigationCollapsed]);

  useEffect(() => {
    const compactViewport = window.matchMedia('(max-width: 900px)');
    const syncNavigationWithViewport = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setNavigationCollapsed(true);
        return;
      }
      try {
        setNavigationCollapsed(localStorage.getItem(NAVIGATION_COLLAPSED_KEY) === 'true');
      } catch {
        setNavigationCollapsed(false);
      }
    };
    compactViewport.addEventListener('change', syncNavigationWithViewport);
    return () => compactViewport.removeEventListener('change', syncNavigationWithViewport);
  }, []);

  useEffect(() => {
    try {
      if (trackedAchievementId) localStorage.setItem(TRACKED_ACHIEVEMENT_KEY, trackedAchievementId);
      else localStorage.removeItem(TRACKED_ACHIEVEMENT_KEY);
    } catch {
      // Challenge tracking remains available for the current session when storage is unavailable.
    }
  }, [trackedAchievementId]);

  useEffect(() => {
    if (trackedAchievementId && achievementUnlocks.some((unlock) => unlock.id === trackedAchievementId)) {
      setTrackedAchievementId(null);
    }
  }, [achievementUnlocks, trackedAchievementId]);

  useEffect(() => {
    try {
      localStorage.setItem(MANUAL_SAVE_KEY, JSON.stringify(manualSaves));
    } catch {
      notify('브라우저 저장 공간이 부족해 체크포인트를 기록하지 못했습니다. 저장 파일을 내보내십시오.');
    }
  }, [manualSaves, notify]);

  const addEvent = useCallback((title: string, detail: string, tone: WarEvent['tone'], week: number, trace?: Partial<WarEventTrace>) => {
    setEvents((current) => [{ id: Date.now() + Math.random(), week, title, detail, tone, trace: createWarEventTrace(title, detail, tone, trace) }, ...current].slice(0, 120));
  }, []);

  const scheduleWorldFlashpoint = useCallback((week: number) => {
    if (week % 13 !== 0 || pendingWorldFlashpointId || pendingCouncilEventId || pendingCoupIncident) return false;
    const selection = selectNextWorldFlashpoint(worldline.timeline, week, completedDecisions);
    if (!selection) return false;
    setPendingWorldFlashpointId(selection.entry.event.id);
    setSpeed(0);
    addEvent(
      `세계 위기 도착 — ${selection.entry.event.title}`,
      `${selection.campaignYear}년 세계선에서 ${selection.entry.event.historicalYear}년의 역사적 조건이 재조합됐습니다. 전쟁 종결 여부와 관계없이 대응이 필요합니다.`,
      'bad',
      week,
      {
        domain: 'history',
        decision: '아직 결정하지 않음 — 세계 위기 대응안을 선택해야 시간이 다시 진행됩니다.',
        trigger: selection.accelerated
          ? `앞서 해결한 세계 위기 ${selection.resolvedCount}건이 제도·동맹·군사기술의 전개 범위를 ${selection.historicalHorizon}년까지 가속했습니다.`
          : `캠페인 달력과 세계선의 조건이 역사 기준 ${selection.entry.event.historicalYear}년에 도달했습니다.`,
        factors: [selection.entry.event.historicalBasis, `현재 행위자: ${selection.entry.actor}`, `캠페인 단계: ${campaignPhase === 'war' ? '전쟁 수행 중' : '국가 운영 중'}`],
        effects: [{ label: '진행 상태', value: '시간 정지 · 선택 대기', tone: 'negative' }],
        ongoing: ['결정 뒤 즉시 국가 자원과 외교 관계가 바뀌며, 선택한 분기는 이후 세계 사건의 행위자와 결말 계산에 남습니다.'],
        nextActions: ['세 대응안의 즉시 효과와 장기 세계 지표를 비교해 하나를 선택하십시오.'],
        certainty: 'confirmed',
      },
    );
    return true;
  }, [addEvent, campaignPhase, completedDecisions, pendingCouncilEventId, pendingCoupIncident, pendingWorldFlashpointId, worldline.timeline]);

  const scheduleCoupCheck = useCallback((week: number) => {
    const result = advancePoliticalCrisisWeek(politicalCrisis, { ...politicalCrisisContext, week });
    setPoliticalCrisis(result.state);
    result.notices.forEach((notice) => addEvent(
      '국내 정치위기 단계 변경',
      `${notice} 현재 최대 위험집단은 ${result.assessment.leadingFaction.name}이며 다음 주 시도 확률은 ${result.assessment.weeklyChance.toFixed(1)}%입니다.`,
      result.assessment.tier === 'critical' || result.assessment.tier === 'dangerous' ? 'bad' : 'neutral',
      week,
      {
        domain: 'management',
        decision: '주간 국정·전쟁 수행 결과가 국내 권력관계에 반영됐습니다.',
        trigger: result.assessment.triggers.filter((item) => item.contribution > 0).slice(0, 4).map((item) => `${item.label} +${item.contribution.toFixed(1)}`).join(' · '),
        factors: result.assessment.triggers.slice(0, 5).map((item) => `${item.label}: ${item.detail}`),
        effects: [{ label: '쿠데타 위험', value: `${getCoupRiskLabel(result.assessment.tier)} ${result.assessment.score} · 주간 ${result.assessment.weeklyChance.toFixed(1)}%`, tone: result.assessment.tier === 'stable' ? 'positive' : result.assessment.tier === 'watch' ? 'neutral' : 'negative' }],
        ongoing: ['정치위기 상황실에서 권력집단 불만, 조직력, 상호관계와 예방조치를 확인할 수 있습니다.'],
        nextActions: ['권한이 허용하는 예방조치를 실행하거나 안정도·재정·보급·참모 충성을 회복하십시오.'],
        certainty: 'forecast',
      },
    ));
    if (!result.incident) return false;
    setPendingCoupIncident(result.incident);
    setShowPoliticalCrisis(false);
    setSpeed(0);
    addEvent(
      `국가 비상사태 — ${result.incident.title}`,
      `${result.incident.detected ? '방첩망이 거사 전 징후를 포착했습니다.' : '수도 핵심시설에서 기습적인 권력 장악 시도가 시작됐습니다.'} 시간을 정지하고 사용자의 보직 권한에 맞는 대응을 선택해야 합니다.`,
      'bad',
      week,
      {
        domain: 'management',
        decision: '아직 결정하지 않음 — 쿠데타 대응 명령이 필요합니다.',
        trigger: result.assessment.triggers.filter((item) => item.contribution > 0).slice(0, 5).map((item) => `${item.label} +${item.contribution.toFixed(1)}`).join(' · '),
        factors: result.assessment.triggers.slice(0, 6).map((item) => item.detail),
        effects: [{ label: '진행 상태', value: '시간 정지 · 대응 대기', tone: 'negative' }],
        ongoing: ['성공적으로 저지하면 주도 파벌의 조직력이 약화됩니다. 실패하면 정권이 교체되지만 캠페인은 새 권력구조에서 계속됩니다.'],
        nextActions: ['각 대응안의 성공 확률, 비용, 보직 권한을 비교해 하나를 선택하십시오.'],
        certainty: result.incident.detected ? 'confirmed' : 'developing',
      },
    );
    return true;
  }, [addEvent, politicalCrisis, politicalCrisisContext]);

  useEffect(() => {
    if (showBriefing || game.week < 1) return;
    setWorldWeeklyIssues((current) => {
      if (current.some((issue) => issue.week === game.week)) return current;
      const issue = generateWorldWeeklyIssue({
        week: game.week,
        nation: playerNation,
        playerFaction,
        game,
        territories,
        events,
        battleReports,
        relations,
        economy,
        publicHealth: publicHealthView,
        research,
        operations,
        worldline,
      });
      return [issue, ...current].sort((left, right) => right.week - left.week).slice(0, 104);
    });
  }, [showBriefing, game.week]);

  useEffect(() => {
    if (showBriefing || showTutorial || hasUnreadWorldWeekly || pendingAchievementId || showAchievementGallery || showWorldHistory || showWorldWeekly) return;
    const unlockedIds = new Set(achievementUnlocks.map((unlock) => unlock.id));
    const nextAchievement = achievementDefinitions.find((achievement) => !unlockedIds.has(achievement.id) && achievementProgress[achievement.id]?.complete);
    if (!nextAchievement) return;
    const nextUnlock: AchievementUnlock = {
      id: nextAchievement.id,
      unlockedWeek: game.week,
      unlockedAt: new Date().toISOString(),
    };
    setAchievementUnlocks((current) => [...current, nextUnlock]);
    setPendingAchievementId(nextAchievement.id);
    setSpeed(0);
    addEvent(`도전과제 달성 — ${nextAchievement.title}`, `${nextAchievement.condition} · 삽화가 기록실에 해금되었습니다.`, 'good', game.week);
  }, [achievementProgress, achievementUnlocks, addEvent, game.week, hasUnreadWorldWeekly, pendingAchievementId, showAchievementGallery, showBriefing, showTutorial, showWorldHistory, showWorldWeekly]);

  const advanceNationWeek = useCallback(() => {
    const nextWeek = game.week + 1;
    const monetaryResult = advanceMonetarySystem(economy.monetarySystem, playerNation.id, 1942 + Math.floor(nextWeek / 52));
    const publicHealthResult = advancePublicHealthWeek(publicHealth, publicHealthContext);
    const completedResearch = research.filter((project) => project.complete).length;
    const publicHealthPressure = publicHealth.activeOutbreak
      ? Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.weeklyCases / 10_000)
      : publicHealth.outbreakPressure * 0.12;
    const result = advanceNationManagementWeek(nationManagement, {
      week: nextWeek,
      game,
      economy,
      relationAverage,
      completedResearch,
      publicHealthPressure,
      role: careerRole,
    });
    const researchGain = 6 + Math.floor(result.state.education / 18) + scienceAdvisorBonus;
    const breakthroughs = research.filter((project) => project.active && !project.complete && project.progress + researchGain >= project.duration);

    setNationManagement(result.state);
    setGame((current) => applyGameDelta(applyGameDelta(current, result.gameDelta), publicHealthResult.gameDelta));
    setEconomy((current) => ({
      ...current,
      debt: Math.max(0, current.debt + result.economyDelta.debt),
      inflation: Math.max(0, Math.min(100, current.inflation + result.economyDelta.inflation)),
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.economyDelta.publicConfidence)),
      monetarySystem: monetaryResult.state,
    }));
    if (monetaryResult.transition) {
      const nextCurrency = getCurrencyById(monetaryResult.transition.toCurrencyId);
      addEvent(`통화개혁 — ${nextCurrency?.name ?? monetaryResult.transition.toCurrencyId}`, monetaryResult.transition.note, 'neutral', nextWeek);
      notify(`${monetaryResult.transition.year}년 통화개혁: ${nextCurrency?.name ?? monetaryResult.transition.toCurrencyId}`);
    }
    setPublicHealth(publicHealthResult.state);
    setResearch((current) => current.map((project) => {
      if (!project.active || project.complete) return project;
      const progress = Math.min(project.duration, project.progress + researchGain);
      return { ...project, progress, complete: progress >= project.duration, active: progress < project.duration };
    }));
    setRelations((current) => current.map((relation) => ({
      ...relation,
      value: Math.max(0, Math.min(100, relation.value + (result.state.budget.diplomacy >= 20 ? 0.35 : result.state.budget.diplomacy <= 5 ? -0.2 : 0.08))),
    })));
    setCareer((current) => ({
      ...current,
      experience: current.experience + 5,
      reputation: Math.max(0, Math.min(100, current.reputation + (result.report.mandateScore >= 55 ? 0.4 : result.report.mandateScore < 40 ? -0.5 : 0.1))),
      legacy: Math.max(0, current.legacy + (result.report.nationalScore >= 60 ? 1 : 0)),
    }));

    breakthroughs.forEach((project) => addEvent(
      `민간 연구 성과 — ${project.name}`,
      `${project.description} 교육·과학 예산과 기존 전시 연구 기반이 전후 기술로 전환됐습니다.`,
      'good',
      nextWeek,
      {
        domain: 'management',
        decision: `교육·과학 기반을 유지해 ${project.name} 연구를 완료했습니다.`,
        trigger: `주간 연구 진척 +${researchGain}가 남은 기간을 충족했습니다.`,
        factors: [`교육 수준 ${Math.round(result.state.education)}`, `완료 연구 ${completedResearch}건`, `과학 고문 보너스 +${scienceAdvisorBonus}`],
        effects: [{ label: '연구 완료', value: project.name, tone: 'positive' }],
        ongoing: ['연구 성과는 국가 성과와 이후 대체역사 사건의 기술 조건으로 이어집니다.'],
        nextActions: ['연구 개발에서 다음 민간·전략 기술을 활성화하십시오.'],
      },
    ));
    publicHealthResult.events.forEach((event) => addEvent(event.title, event.detail, event.tone, event.week));
    result.report.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      decision: `국가 발전 노선과 부처 예산을 유지한 채 제${nextWeek + 1}주 국정을 집행했습니다.`,
      trigger: event.cause,
      factors: result.report.causes,
      effects: result.report.effects.map((effect) => ({ label: '국정 영향', value: effect, tone: event.tone === 'bad' ? 'negative' : event.tone === 'good' ? 'positive' : 'neutral' })),
      ongoing: [event.consequence],
      nextActions: ['국가 운영 화면에서 다음 주 예산과 발전 노선을 재검토하십시오.'],
      certainty: 'confirmed',
    }));
    const expectedNationResult = nationWeekProjection ?? result;
    addEvent(
      `국가 운영 결산 — 제 ${nextWeek + 1}주`,
      `세입 ${formatGameMoney(result.report.fiscalRevenue)}, 지출 ${formatGameMoney(result.report.fiscalExpenditure)}, 수지 ${formatGameMoney(result.report.fiscalBalance, { signed: true })}. 국가 성과 ${result.state.nationalScore}, 국민 위임 ${result.state.mandateScore}.`,
      result.report.fiscalBalance < -12 || result.state.unrest >= 60 ? 'bad' : result.report.nationalScore >= 60 ? 'good' : 'neutral',
      nextWeek,
      {
        domain: 'management',
        decision: `${nationStrategies.find((strategy) => strategy.id === result.state.strategyId)?.name ?? '국가 발전 노선'}과 조세 ${result.state.taxBurden}, 공공지출 ${result.state.spendingLevel}, 6개 부처 예산을 집행했습니다.`,
        trigger: '“국정 1주 진행”으로 재정·민생·산업·외교·보건·연구 계산을 동시에 확정했습니다.',
        factors: result.report.causes,
        effects: result.report.effects.map((effect) => ({ label: '주간 결과', value: effect, tone: effect.includes('부채 +') || effect.includes('물가 +') ? 'negative' : 'neutral' })),
        comparisons: [
          {
            label: '재정 수지',
            expected: formatGameMoney(expectedNationResult.report.fiscalBalance, { signed: true }),
            actual: formatGameMoney(result.report.fiscalBalance, { signed: true }),
            status: getJournalComparisonStatus(expectedNationResult.report.fiscalBalance, result.report.fiscalBalance),
            explanation: '세입·조세·공공지출·부채이자를 진행 직전 예상치와 같은 기준으로 재계산했습니다.',
          },
          {
            label: '국가 성과',
            expected: `${expectedNationResult.state.nationalScore}`,
            actual: `${result.state.nationalScore}`,
            status: getJournalComparisonStatus(expectedNationResult.state.nationalScore, result.state.nationalScore),
            explanation: '인프라·교육·복지·산업·제도 성과의 종합점수입니다.',
          },
          {
            label: '국민 위임',
            expected: `${expectedNationResult.state.mandateScore}`,
            actual: `${result.state.mandateScore}`,
            status: getJournalComparisonStatus(expectedNationResult.state.mandateScore, result.state.mandateScore),
            explanation: '생활수준·고용·불평등·물가·정당성이 유권자 평가에 반영됐습니다.',
          },
          {
            label: '물가 변화',
            expected: `${expectedNationResult.economyDelta.inflation >= 0 ? '+' : ''}${expectedNationResult.economyDelta.inflation.toFixed(2)}%p`,
            actual: `${result.economyDelta.inflation >= 0 ? '+' : ''}${result.economyDelta.inflation.toFixed(2)}%p`,
            status: getJournalComparisonStatus(expectedNationResult.economyDelta.inflation, result.economyDelta.inflation, false),
            explanation: '지출 압력과 산업 공급·조세 효과를 함께 반영한 주간 물가 변화입니다.',
          },
        ],
        ongoing: [`다음 국민 평가까지 ${Math.max(0, result.state.nextElectionWeek - nextWeek)}주`, `현재 사회 불안 ${Math.round(result.state.unrest)} · 민수 산업 ${Math.round(result.state.civilianIndustry)}`],
        nextActions: [result.report.fiscalBalance < 0 ? '적자를 줄이려면 조세 부담·공공지출·산업 예산의 조합을 조정하십시오.' : '흑자를 부채 감축과 장기 교육·인프라 투자 중 어디에 쓸지 결정하십시오.', result.state.mandateScore < 50 ? '복지·고용·주택과 물가를 개선해 다음 국민 평가 전 위임을 회복하십시오.' : '현재 위임을 장기 제도·산업 성과로 전환하십시오.'],
        certainty: 'confirmed',
      },
    );
    const openedCoup = scheduleCoupCheck(nextWeek);
    if (!openedCoup) scheduleWorldFlashpoint(nextWeek);
  }, [addEvent, careerRole, economy, formatGameMoney, game, nationManagement, nationWeekProjection, notify, playerNation.id, publicHealth, publicHealthContext, relationAverage, research, scheduleCoupCheck, scheduleWorldFlashpoint, scienceAdvisorBonus]);

  const advanceWeek = useCallback(() => {
    if (pendingWorldFlashpointId || pendingCouncilEventId || pendingCoupIncident) return;
    setUXActionLifecycle((current) => markUXActionsForVerification(current, game.week));
    if (campaignPhase === 'nation') {
      advanceNationWeek();
      return;
    }
    const nextWeek = game.week + 1;
    const currentOrder = orders[0];
    let weeklyOrderComparison: WarEventComparison | null = null;
    const publicHealthResult = advancePublicHealthWeek(publicHealth, publicHealthContext);
    const economyResult = advanceEconomyWeek(economy, {
      week: nextWeek,
      nationId: playerNation.id,
      game,
      staffWeeklyCost,
      economyAdvisorBonus,
    });
    setCommanderDevelopment((current) => recoverCommanderFatigue(current));

    if (currentOrder) {
      const division = effectiveDivisions.find((item) => item.id === currentOrder.divisionId);
      const target = territories.find((item) => item.id === currentOrder.targetId);
      const commander = effectiveCommanders.find((item) => item.id === division?.commanderId);
      if (division && target && commander) {
        const orderStance = currentOrder.stance ?? battleStance;
        if (target.controller === playerFaction) {
          weeklyOrderComparison = {
            label: '작전 명령',
            expected: `${target.name} 우군 집결`,
            actual: `${division.name} 이동 완료`,
            status: 'matched',
            explanation: '이미 확보한 영토로의 이동은 전투 판정 없이 예정대로 해결됐습니다.',
          };
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
          const battleInput = {
            week: nextWeek,
            division,
            commander,
            target,
            stance: orderStance,
            enemyPressure: game.enemyPressure,
            intelNetwork: game.intelNetwork,
            doctrineBonus,
            policyAttackBonus,
            priorityBonus,
          };
          const preBattleForecast = forecastBattle(battleInput);
          const resolvedBattle = resolveBattle({
            ...battleInput,
            randomRolls: [Math.random(), Math.random(), Math.random(), Math.random()],
          });
          const existingDevelopment = getCommanderRecord(commanderDevelopment, commander);
          const recoveredDevelopment = { ...existingDevelopment, fatigue: Math.max(0, existingDevelopment.fatigue - 3) };
          const developmentResult = recordBattleExperience(recoveredDevelopment, resolvedBattle, orderStance);
          const battleHonor = getBattleHonor(resolvedBattle);
          const battleReport: BattleReport = {
            ...resolvedBattle,
            commanderXpGained: developmentResult.xpGained,
            battleHonor,
          };
          const expectedVictory = preBattleForecast.successChance >= 50;
          weeklyOrderComparison = {
            label: `${target.name} 공세`,
            expected: `승산 ${preBattleForecast.successChance}% · 병력 손실 ${preBattleForecast.strengthLoss[0]}~${preBattleForecast.strengthLoss[1]}`,
            actual: `${battleReport.victory ? '승리' : '패배'} · 병력 -${battleReport.attackerStrengthLoss} · 작전 마진 ${battleReport.margin >= 0 ? '+' : ''}${battleReport.margin}`,
            status: battleReport.victory === expectedVictory ? 'matched' : battleReport.victory ? 'better' : 'worse',
            explanation: `정보 신뢰도 ${preBattleForecast.confidence === 'high' ? '높음' : preBattleForecast.confidence === 'medium' ? '보통' : '낮음'} 전망과 정찰·전개·교전·추격 4단계 확률 판정을 비교했습니다.`,
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

    const researchGain = (doctrine === 'methodical' ? 13 : 11) + 2 + scienceAdvisorBonus + (scienceAdvisor?.discipline === 'science' ? 1 : 0);
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

    const activeEquipmentProject = getEquipmentNode(equipmentDevelopment.activeProjectId ?? '');
    const equipmentResearchGain = 8
      + Math.floor(game.factories / 7)
      + (doctrine === 'methodical' ? 3 : 0)
      + (delegatedDepartments.has('armaments') ? 2 : 0)
      + Math.max(0, scienceAdvisorBonus - 1)
      + (scienceAdvisor?.discipline === 'engineering' ? 1 : 0)
      + 2;
    const equipmentBreakthrough = activeEquipmentProject
      && equipmentDevelopment.progress + equipmentResearchGain >= activeEquipmentProject.researchCost
      ? activeEquipmentProject
      : null;
    if (activeEquipmentProject) {
      setEquipmentDevelopment((current) => {
        if (current.activeProjectId !== activeEquipmentProject.id) return current;
        const progress = Math.min(activeEquipmentProject.researchCost, current.progress + equipmentResearchGain);
        if (progress < activeEquipmentProject.researchCost) return { ...current, progress };
        return {
          ...current,
          unlockedIds: Array.from(new Set([...current.unlockedIds, activeEquipmentProject.id])),
          activeProjectId: null,
          progress: 0,
        };
      });
    }
    if (equipmentBreakthrough) {
      addEvent('장비 개발 완료 — ' + equipmentBreakthrough.name, equipmentBreakthrough.doctrineEffect + '. 시제품 설계와 채택 승인이 가능해졌습니다.', 'good', nextWeek);
      if (equipmentBreakthrough.category === 'systems') {
        setGame((current) => ({ ...current, intelNetwork: Math.min(100, current.intelNetwork + 6) }));
      }
      if (equipmentBreakthrough.category === 'logistics') {
        setDivisions((current) => current.map((division) => ({ ...division, supply: Math.min(100, division.supply + 5) })));
      }
      if (equipmentBreakthrough.category === 'strategic') {
        setGame((current) => ({ ...current, warSupport: Math.min(100, current.warSupport + 3), stability: Math.max(20, current.stability - 1) }));
      }
    }

    const productionGains = calculateProductionGains(production, nextWeek);
    const focusMultiplier = (lineId: string) => procurementFocusId === lineId ? 1.12 : 1;
    setStockpile((current) => ({
      ...current,
      tanks: current.tanks + Math.round(productionGains.tanks * policyProductionMultiplier * focusMultiplier('sherman')),
      aircraft: current.aircraft + Math.round(productionGains.aircraft * policyProductionMultiplier * focusMultiplier('spitfire')),
      infantryEquipment: current.infantryEquipment + Math.round(productionGains.infantryEquipment * policyProductionMultiplier * focusMultiplier('rifle')),
      convoys: current.convoys + Math.round(productionGains.convoys * policyProductionMultiplier * focusMultiplier('convoy')),
      artillery: current.artillery + Math.round(productionGains.artillery * policyProductionMultiplier * focusMultiplier('artillery')),
      trucks: current.trucks + Math.round(productionGains.trucks * policyProductionMultiplier * focusMultiplier('truck')),
    }));

    setProduction((current) => current.map((line) => ({
      ...line,
      efficiency: Math.min(100, line.efficiency + (line.assigned > 0 ? 1 : 0) + (line.id === procurementFocusId ? 1 : 0) + (delegatedDepartments.has('armaments') ? 1 : 0)),
    })));
    setGame((current) => applyGameDelta({
      ...current,
      week: current.week + 1,
      manpower: current.manpower + 18 + (scienceAdvisor?.delegated && scienceAdvisor.discipline === 'medicine' ? 6 : 0),
      politicalPower: Math.min(200, current.politicalPower + 3 + (delegatedDepartments.has('political') ? 1 : 0) + (scienceAdvisor?.delegated && scienceAdvisor.discipline === 'social-science' ? 1 : 0)),
      fuel: Math.max(0, Math.min(200, current.fuel + 8 - current.factories * 0.18 - (supplyPolicy === 'frontline' ? 2 : 0))),
      steel: Math.min(240, current.steel + 9),
      commandPoints: Math.min(100, current.commandPoints + 6 + (delegatedDepartments.has('operations') ? 2 : 0)),
      treasury: current.treasury,
      intelNetwork: Math.min(100, current.intelNetwork + (scienceAdvisor?.delegated && scienceAdvisor.discipline === 'intelligence' ? 1 : 0)),
      airPower: Math.min(100, current.airPower + (nextWeek % 4 === 0 ? 1 : 0)),
      navalPower: Math.max(20, Math.min(100, current.navalPower + (nextWeek % 3 === 0 ? 1 : 0))),
      enemyPressure: Math.min(100, current.enemyPressure + (nextWeek % 4 === 0 ? 2 : 0)),
    }, economyResult.gameDelta));
    setPublicHealth(publicHealthResult.state);
    setEconomy(economyResult.state);
    if (economyResult.currencyTransition) {
      const nextCurrency = getCurrencyById(economyResult.currencyTransition.toCurrencyId);
      addEvent(`통화개혁 — ${nextCurrency?.name ?? economyResult.currencyTransition.toCurrencyId}`, economyResult.currencyTransition.note, 'neutral', nextWeek, {
        domain: 'management',
        decision: '역사 통화연표 자동전환을 유지해 중앙은행의 화폐개혁을 시행했습니다.',
        trigger: `${economyResult.currencyTransition.year}년 통화 전환연도에 도달했습니다.`,
        factors: ['기존 국고의 실질 구매력은 보존', '화폐명·기호·명목단위 변경', '외환보유고는 원 통화별로 계속 보유'],
        effects: [{ label: '새 법정통화', value: `${nextCurrency?.symbol ?? ''} ${nextCurrency?.name ?? economyResult.currencyTransition.toCurrencyId}`, tone: 'neutral' }],
        ongoing: ['새 통화의 명목환율은 국내 물가와 공공신뢰에 따라 움직입니다.'],
        nextActions: ['전시 재무성의 통화·외환 화면에서 새 단위와 교차환율을 확인하십시오.'],
      });
      notify(`${economyResult.currencyTransition.year}년 통화개혁: ${nextCurrency?.name ?? economyResult.currencyTransition.toCurrencyId}`);
    }
    if (Object.keys(publicHealthResult.gameDelta).length > 0) {
      setGame((current) => applyGameDelta(current, publicHealthResult.gameDelta));
    }
    if (publicHealthResult.supplyLoss > 0 || publicHealthResult.organizationLoss > 0) {
      setDivisions((current) => current.map((division) => ({
        ...division,
        supply: Math.max(12, division.supply - publicHealthResult.supplyLoss),
        organization: Math.max(18, division.organization - publicHealthResult.organizationLoss),
      })));
    }
    publicHealthResult.events.forEach((event) => addEvent(event.title, event.detail, event.tone, event.week));
    if (economyResult.event) {
      const event = economyResult.event;
      addEvent(event.title, event.detail, event.tone, nextWeek, {
        domain: 'management',
        decision: `현재 조세·국채·물가 정책과 산업지분 배분을 제 ${nextWeek + 1}주 경제 판정에 적용했습니다.`,
        trigger: '4주 단위 경제사건 판정 또는 부채·물가·전황 위험조건이 충족됐습니다.',
        factors: [`국가부채 ${formatGameMoney(economy.debt)}`, `인플레이션 ${economy.inflation.toFixed(1)}%`, `공공신뢰 ${economy.publicConfidence.toFixed(0)}/100`, `적 압력 ${game.enemyPressure}/100`],
        effects: [
          { label: '재정', value: formatGameMoney(event.treasuryImpact, { signed: true }), tone: event.treasuryImpact > 0 ? 'positive' : event.treasuryImpact < 0 ? 'negative' : 'neutral' },
          { label: '시장평가', value: `${event.priceImpact >= 0 ? '+' : ''}${(event.priceImpact * 100).toFixed(1)}%`, tone: event.priceImpact >= 0 ? 'positive' : 'negative' },
          { label: '물가·신뢰', value: `물가 ${event.inflationImpact >= 0 ? '+' : ''}${event.inflationImpact}%p · 신뢰 ${event.confidenceImpact >= 0 ? '+' : ''}${event.confidenceImpact}`, tone: event.confidenceImpact >= 0 ? 'positive' : 'negative' },
        ],
        ongoing: ['기업 평가액 변화는 보유지분의 미실현 손익과 다음 매각대금에 계속 반영됩니다.', '물가와 공공신뢰 변화는 다음 주 시장수익률과 국채 조달의 지속가능성에 영향을 줍니다.'],
        nextActions: [event.tone === 'bad' ? '전시 재무성에서 차입방식·가격통제·위험기업 보유비중을 재검토하십시오.' : '추가 투자 전에 현재 경상수지와 부채 증가분을 함께 비교하십시오.'],
      });
    }
    if (!publicHealth.activeOutbreak && publicHealthResult.state.activeOutbreak) {
      setSpeed(0);
      notify(`${publicHealthResult.state.activeOutbreak.codeName} 보건 비상: 시간 진행을 일시 정지했습니다.`);
    }

    const careerGain = currentOrder ? 7 : 3;
    const promotionThreshold = getPromotionThreshold(careerRole.tier);
    const promotionRole = careerRole.tier > 1
      ? careerRoles.find((role) => role.nationId === career.nationId && role.branch === careerRole.branch && role.tier === careerRole.tier - 1)
        ?? careerRoles.find((role) => role.nationId === career.nationId && role.tier === careerRole.tier - 1)
      : undefined;
    const earnsPromotion = Boolean(promotionRole && career.experience + careerGain >= promotionThreshold);
    setCareer((current) => ({
      ...current,
      roleId: earnsPromotion && promotionRole ? promotionRole.id : current.roleId,
      experience: earnsPromotion ? 20 : Math.min(promotionThreshold, current.experience + careerGain),
      reputation: Math.min(100, current.reputation + (currentOrder ? 2 : 1)),
      councilTrust: Math.max(10, Math.min(100, current.councilTrust + (game.victoryScore >= 50 ? 1 : -1))),
      legacy: Math.min(100, current.legacy + (currentOrder ? 2 : 0)),
    }));
    if (earnsPromotion && promotionRole) {
      addEvent('전시 승진 — ' + promotionRole.title, '전구 성과가 인정되어 더 넓은 권한과 책임을 부여받았습니다.', 'good', nextWeek);
      notify('승진했습니다: ' + promotionRole.title);
    }

    if (nextWeek % 3 === 0) {
      const threatenedTerritory = selectThreatenedTerritory(territories, effectiveDivisions, currentOrder?.targetId, playerFaction, activeTheater);

      if (threatenedTerritory) {
        const { defender, power } = calculateDefensivePower(threatenedTerritory, effectiveDivisions, effectiveCommanders);
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
    const committedWorldEvents = worldline.timeline.filter((entry) => entry.isPlayerChoice);
    if (nextWeek % 12 === 0 && committedWorldEvents.length > 0) {
      const commitment = committedWorldEvents[(Math.floor(nextWeek / 12) - 1) % committedWorldEvents.length];
      setGame((current) => {
        if (commitment.event.category === 'nuclear') return { ...current, intelNetwork: Math.min(100, current.intelNetwork + 2), stability: Math.max(20, current.stability - 1) };
        if (commitment.event.category === 'economy') return { ...current, factories: Math.min(80, current.factories + 1), treasury: Math.max(0, current.treasury - 24) };
        if (commitment.event.category === 'proxy-war') return { ...current, commandPoints: Math.min(100, current.commandPoints + 2), stability: Math.max(20, current.stability - 1) };
        if (commitment.event.category === 'intelligence') return { ...current, intelNetwork: Math.min(100, current.intelNetwork + 4), politicalPower: Math.min(200, current.politicalPower + 1), stability: Math.max(20, current.stability - 1) };
        if (commitment.event.category === 'technology' || commitment.event.category === 'space') return { ...current, steel: Math.max(0, current.steel - 3), airPower: Math.min(100, current.airPower + 1) };
        return { ...current, politicalPower: Math.min(200, current.politicalPower + 2), warSupport: Math.min(100, current.warSupport + 1) };
      });
      addEvent(`전후질서 사전준비 — ${commitment.variant.title}`, commitment.variant.consequence, commitment.event.category === 'proxy-war' ? 'bad' : 'neutral', nextWeek);
    }
    setStaff((current) => advanceStaffRosterWeek(current, developmentFocusId));
    const currentYear = 1942 + Math.floor(nextWeek / 52);
    const historicalHorizon = getHistoricalHorizon(nextWeek, completedDecisions);
    const intelligenceCandidates = createEmergentIntelligenceCandidates(playerNation.id, currentYear, worldline.timeline);
    const newIntelligenceCandidates = intelligenceCandidates.filter((candidate) => !staffCandidates.some((existing) => existing.personId === candidate.personId));
    const laterEraCandidates = createLaterEraCandidates(playerNation.id, currentYear, historicalHorizon);
    const newLaterEraCandidates = laterEraCandidates
      .filter((candidate) => !staffCandidates.some((existing) => existing.personId === candidate.personId))
      .slice(0, 4);
    const rivalVictories = staffCandidates.filter((candidate) => candidate.status !== 'signed' && candidate.status !== 'lost' && weeklyRivalInterest(candidate) >= 100);
    setStaffCandidates((current) => {
      const existingPeople = new Set(current.map((candidate) => candidate.personId));
      const expanded = [
        ...current,
        ...intelligenceCandidates.filter((candidate) => !existingPeople.has(candidate.personId)),
        ...newLaterEraCandidates.filter((candidate) => !existingPeople.has(candidate.personId)),
      ];
      return expanded.map((candidate) => {
        if (candidate.status === 'signed' || candidate.status === 'lost') return candidate;
        const rivalInterest = weeklyRivalInterest(candidate);
        return {
          ...candidate,
          rivalInterest,
          status: rivalInterest >= 100 ? 'lost' : candidate.status,
          knowledge: candidate.status === 'scouting'
            ? Math.min(100, candidate.knowledge + 18 + (delegatedDepartments.has('personnel') ? 5 : 0))
            : candidate.knowledge,
        };
      });
    });
    newIntelligenceCandidates.forEach((candidate) => addEvent('비밀 인재 등장 — ' + candidate.name, `${candidate.historicalOffice} 경력의 인물이 ${candidate.affiliation} 계보와 함께 인재 시장에 등장했습니다. 먼저 스카우트해 충성·이중공작 위험을 확인하십시오.`, 'neutral', nextWeek));
    newLaterEraCandidates.forEach((candidate) => addEvent(
      `새로운 세대 등장 — ${candidate.name}`,
      `${candidate.birthYear}년생 실존 인물 · ${candidate.historicalOffice}. ${candidate.alternateHistoryEntry ? `세계선 발전 범위가 ${historicalHorizon}년까지 앞서가면서 통상 등장 기준 ${candidate.generationUnlockYear}년보다 조기 발탁됐습니다.` : `${currentYear}년의 세대교체로 인재 시장에 등장했습니다.`} 실제 신원·직업과 게임용 임명·능력은 조사 보고서에서 구분됩니다.`,
      'neutral',
      nextWeek,
    ));
    rivalVictories.forEach((candidate) => addEvent('경쟁 기관 영입 — ' + candidate.name, candidate.affiliation + '의 영향력 경쟁에서 밀렸습니다. 이 인물은 더 이상 영입할 수 없습니다.', 'bad', nextWeek));
    const openedCoup = scheduleCoupCheck(nextWeek);
    const openedWorldFlashpoint = !openedCoup && scheduleWorldFlashpoint(nextWeek);
    if (!openedCoup && !openedWorldFlashpoint && nextWeek % 4 === 0 && !pendingCouncilEventId) {
      const eligibleEvents = councilEvents.filter((event) =>
        (!event.nationIds || event.nationIds.includes(playerNation.id))
        && (!event.roleBranches || event.roleBranches.includes(careerRole.branch)));
      const isUnresolved = (event: (typeof councilEvents)[number]) => !resolvedCouncilChoices.some((record) => record.startsWith(event.id + ':'));
      const unresolvedEvent = eligibleEvents.find((event) => event.nationIds?.includes(playerNation.id) && isUnresolved(event))
        ?? eligibleEvents.find(isUnresolved);
      const councilEvent = unresolvedEvent ?? eligibleEvents[(Math.floor(nextWeek / 4) - 1) % eligibleEvents.length];
      setPendingCouncilEventId(councilEvent.id);
      setSpeed(0);
      addEvent('긴급 의제 소집 — ' + councilEvent.category, councilEvent.title, 'bad', nextWeek);
    }
    const actualProduction = {
      tanks: Math.round(productionGains.tanks * policyProductionMultiplier * focusMultiplier('sherman')),
      aircraft: Math.round(productionGains.aircraft * policyProductionMultiplier * focusMultiplier('spitfire')),
      infantryEquipment: Math.round(productionGains.infantryEquipment * policyProductionMultiplier * focusMultiplier('rifle')),
      convoys: Math.round(productionGains.convoys * policyProductionMultiplier * focusMultiplier('convoy')),
      artillery: Math.round(productionGains.artillery * policyProductionMultiplier * focusMultiplier('artillery')),
      trucks: Math.round(productionGains.trucks * policyProductionMultiplier * focusMultiplier('truck')),
    };
    const weeklyManpowerGain = 18 + (scienceAdvisor?.delegated && scienceAdvisor.discipline === 'medicine' ? 6 : 0);
    const weeklyPoliticalGain = 3 + (delegatedDepartments.has('political') ? 1 : 0) + (scienceAdvisor?.delegated && scienceAdvisor.discipline === 'social-science' ? 1 : 0);
    const weeklyCommandGain = 6 + (delegatedDepartments.has('operations') ? 2 : 0);
    const weeklyFuelDelta = Number((8 - game.factories * 0.18 - (supplyPolicy === 'frontline' ? 2 : 0)).toFixed(1));
    const weeklyTreasuryDelta = economyResult.ledger.netTreasuryChange;
    const activeResearchNames = research.filter((project) => project.active && !project.complete).map((project) => project.name);
    const actualProductionTotal = Object.values(actualProduction).reduce((total, amount) => total + amount, 0);
    const reportDetail = `생산: 보병장비 +${actualProduction.infantryEquipment}, 전차 +${actualProduction.tanks}, 항공기 +${actualProduction.aircraft}, 야포 +${actualProduction.artillery}, 트럭 +${actualProduction.trucks}, 수송선 +${actualProduction.convoys}. 국력 기준 변화: 인력 +${weeklyManpowerGain}, 정치력 +${weeklyPoliticalGain}, 지휘점수 +${weeklyCommandGain}, 연료 ${weeklyFuelDelta >= 0 ? '+' : ''}${weeklyFuelDelta}, 재정 ${weeklyTreasuryDelta >= 0 ? '+' : ''}${weeklyTreasuryDelta}.`;
    addEvent(`주간 지휘 결산 — 제 ${nextWeek + 1}주`, reportDetail, weeklyTreasuryDelta < 0 || game.fuel + weeklyFuelDelta < 25 ? 'bad' : 'neutral', nextWeek, {
      domain: 'management',
      decision: `제 ${nextWeek + 1}주에 유지한 생산 배정·${supplyPolicy === 'frontline' ? '전선 우선' : supplyPolicy === 'reserve' ? '예비대 우선' : '균형'} 보급·참모 위임·연구 ${activeResearchNames.length}건${currentOrder ? '·작전 명령 1건' : ''}을 동시에 해결했습니다.`,
      trigger: '“다음 주 진행” 명령으로 모든 부서의 주간 계산이 같은 시점에 확정됐습니다.',
      factors: [
        `생산 = 공장 배정 × 라인 효율 × 국가 생산계수 ${policyProductionMultiplier.toFixed(2)}${procurementFocusId ? ' × 조달 포커스 1.12' : ''}`,
        `일반 연구 = 기본·교리·고문·부서 보너스 합계 프로젝트당 +${researchGain}`,
        `장비 연구 = 공장 규모·교리·공학고문·위임 합계 +${equipmentResearchGain}`,
        `재정 = 세입 ${economyResult.ledger.operatingRevenue.toFixed(1)} + 국채조달 ${economyResult.ledger.financingRaised.toFixed(1)} - 지출 ${economyResult.ledger.totalExpenses.toFixed(1)} = ${weeklyTreasuryDelta >= 0 ? '+' : ''}${weeklyTreasuryDelta.toFixed(1)}M`,
        `연료 = 기본 +8 - 공장소비 ${(game.factories * 0.18).toFixed(1)}${supplyPolicy === 'frontline' ? ' - 전선우선 2' : ''} = ${weeklyFuelDelta >= 0 ? '+' : ''}${weeklyFuelDelta}`,
      ],
      effects: [
        { label: '군수 비축', value: `보병 +${actualProduction.infantryEquipment} · 전차 +${actualProduction.tanks} · 항공 +${actualProduction.aircraft} · 야포 +${actualProduction.artillery} · 트럭 +${actualProduction.trucks} · 수송선 +${actualProduction.convoys}`, tone: 'positive' },
        { label: '국가 자원', value: `인력 +${weeklyManpowerGain} · 정치력 +${weeklyPoliticalGain} · 지휘 +${weeklyCommandGain} · 강철 +9`, tone: 'positive' },
        { label: '수지', value: `연료 ${weeklyFuelDelta >= 0 ? '+' : ''}${weeklyFuelDelta} · 재정 ${weeklyTreasuryDelta >= 0 ? '+' : ''}${weeklyTreasuryDelta}`, tone: weeklyTreasuryDelta < 0 || weeklyFuelDelta < 0 ? 'negative' : 'neutral' },
        { label: '연구 진행', value: activeResearchNames.length > 0 ? `${activeResearchNames.join(' · ')} 각각 +${researchGain}` : '활성 연구 없음 — 연구 슬롯이 비어 있음', tone: activeResearchNames.length > 0 ? 'positive' : 'negative' },
      ],
      comparisons: [
        {
          label: '전시 재정',
          expected: formatGameMoney(economyForecast.netTreasuryChange, { signed: true }),
          actual: formatGameMoney(weeklyTreasuryDelta, { signed: true }),
          status: getJournalComparisonStatus(economyForecast.netTreasuryChange, weeklyTreasuryDelta),
          explanation: '사전 현황판과 확정 결산의 세입·지출·국채 조달을 동일한 구매력 기준으로 비교했습니다.',
        },
        {
          label: '군수 생산',
          expected: `총 +${formatNumber(projectionProductionTotal)}`,
          actual: `총 +${formatNumber(actualProductionTotal)}`,
          status: getJournalComparisonStatus(projectionProductionTotal, actualProductionTotal),
          explanation: '공장 배정·라인 효율·국가 생산계수·조달 포커스를 장비 6종에 적용했습니다.',
        },
        {
          label: '일반 연구',
          expected: `${projectionActiveResearch.length}건 · 각각 +${projectionResearchGain}`,
          actual: `${activeResearchNames.length}건 · 각각 +${researchGain}`,
          status: getJournalComparisonStatus(projectionResearchGain, researchGain),
          explanation: '진행 직전 활성 슬롯과 교리·과학고문·위임 보너스를 확정치와 비교했습니다.',
        },
        {
          label: '연료 수지',
          expected: `${projectionFuelDelta >= 0 ? '+' : ''}${projectionFuelDelta}K`,
          actual: `${weeklyFuelDelta >= 0 ? '+' : ''}${weeklyFuelDelta}K`,
          status: getJournalComparisonStatus(projectionFuelDelta, weeklyFuelDelta),
          explanation: '기본 공급에서 공장 소비와 전선 우선 보급 비용을 차감했습니다.',
        },
        ...(weeklyOrderComparison ? [weeklyOrderComparison] : []),
      ],
      ongoing: [
        `생산라인 효율은 배정 라인마다 +1${procurementFocusId ? ', 조달 포커스 라인은 추가 +1' : ''}${delegatedDepartments.has('armaments') ? ', 군수 위임으로 추가 +1' : ''} 상승합니다.`,
        currentOrder ? '이번 주 작전 결과의 병력·조직·보급 손실은 별도 전투 보고서와 다음 주 회복 계산에 이어집니다.' : '작전 명령이 없어 커리어 경험은 행정 주간 기준으로만 증가했습니다.',
        `이번 주 확정된 정책·작전·연구 결과는 ${historyForceLabels[historyTrajectory.dominantForce]} 중심의 역사 흐름에 누적됩니다.`,
      ],
      nextActions: [
        weeklyTreasuryDelta < 0 ? '전시 재무성에서 조세·국채·가격통제와 공장·참모 지출을 함께 조정해 다음 주 적자를 줄이십시오.' : '흑자 중 국채로 조달한 몫을 제외한 경상수지를 확인한 뒤 연구·영입·산업투자 우선순위를 결정하십시오.',
        game.fuel + weeklyFuelDelta < 35 ? '연료가 위험구간에 접근했습니다. 전선 우선 보급 또는 공장소비를 재검토하십시오.' : '생산 비축과 전선 보급을 비교해 다음 작전 투입 가능 여부를 판단하십시오.',
        activeResearchNames.length < 2 ? '비어 있는 일반 연구 슬롯을 채워 주간 연구량 손실을 막으십시오.' : '완료 예정 연구를 확인하고 후속 프로젝트를 미리 선정하십시오.',
      ],
      certainty: 'confirmed',
    });
  }, [activeTheater, addEvent, advanceNationWeek, battleStance, campaignPhase, career.experience, career.nationId, careerRole.tier, commanderDevelopment, completedDecisions, delegatedDepartments, developmentFocusId, divisions, doctrine, economy, economyAdvisorBonus, economyForecast.netTreasuryChange, effectiveCommanders, effectiveDivisions, enemyFaction, equipmentDevelopment, formatGameMoney, game, historyTrajectory.dominantForce, notify, orders, pendingCouncilEventId, pendingCoupIncident, pendingWorldFlashpointId, playerFaction, playerNation.id, playerNation.shortName, policyAttackBonus, policyDefenseBonus, policyProductionMultiplier, policySupplyRecovery, priorityDivisionId, procurementFocusId, production, projectionActiveResearch.length, projectionFuelDelta, projectionProductionTotal, projectionResearchGain, publicHealth, publicHealthContext, research, resolvedCouncilChoices, scheduleCoupCheck, scheduleWorldFlashpoint, scienceAdvisor, scienceAdvisorBonus, staffCandidates, staffWeeklyCost, supplyPolicy, territories, worldline]);

  useEffect(() => {
    if (speed === 0 || pendingWorldFlashpointId || pendingCoupIncident || showBriefing || showWorldHistory || showWorldWeekly || showTutorial) return;
    const delay = speed === 1 ? 4200 : speed === 2 ? 2600 : 1500;
    const timer = window.setInterval(advanceWeek, delay);
    return () => window.clearInterval(timer);
  }, [advanceWeek, pendingCoupIncident, pendingWorldFlashpointId, showBriefing, showTutorial, showWorldHistory, showWorldWeekly, speed]);

  useEffect(() => {
    if (showBriefing) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(savePayload));
      setLastSavedAt(Date.now());
    } catch {
      notify('자동 저장에 실패했습니다. 저장 센터에서 캠페인을 내보내십시오.');
    }
  }, [notify, savePayload, showBriefing]);

  useEffect(() => {
    if (showBriefing || campaignOutcome || campaignPhase === 'nation') return;
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
  }, [addEvent, campaignOutcome, campaignPhase, enemyFaction, game.stability, game.victoryScore, game.warSupport, game.week, playerFaction, playerNation.shortName, showBriefing, theaterTerritories]);

  const transitionToNationManagement = useCallback((reason: NationTransitionReason) => {
    if (reason === 'negotiated' && !transitionReadiness.eligible) {
      notify(`국가 전환 준비도가 ${transitionReadiness.score}/45입니다. 안정도·재정·산업·외교 기반을 먼저 보강하십시오.`);
      return;
    }
    const nextState = createNationManagementState(
      playerNation.id,
      game,
      economy,
      research.filter((project) => project.complete).length,
      reason,
    );
    setCampaignPhase('nation');
    setNationManagement(nextState);
    setCampaignOutcome(null);
    setSpeed(0);
    setOrders([]);
    setPendingOffensivePlan(null);
    setPendingBattleReportId(null);
    setPendingCouncilEventId(null);
    setPendingWorldFlashpointId(null);
    setPlanningMode(false);
    setDivisions((current) => current.map((division) => ({ ...division, status: 'ready' })));
    setGame((current) => ({
      ...current,
      enemyPressure: Math.min(current.enemyPressure, reason === 'victory' ? 18 : 28),
      politicalPower: Math.max(0, Math.min(200, current.politicalPower + (reason === 'victory' ? 12 : -4))),
      stability: Math.max(0, Math.min(100, current.stability + (reason === 'victory' ? 4 : -2))),
    }));
    setActiveTab('governance');
    addEvent(
      reason === 'victory' ? '승전 체제에서 국가 운영 체제로' : '협상 종전 — 국가 운영 체제로',
      `${playerNation.shortName}은(는) 동원과 영토 확장의 시대를 끝내고 전후 국가 운영에 들어갔습니다. 전쟁에서 남은 국고 ${formatGameMoney(game.treasury)}, 부채 ${formatGameMoney(economy.debt)}, 물가 ${economy.inflation.toFixed(1)}%, 공장 ${game.factories}개가 새 정부의 초기 조건입니다.`,
      reason === 'victory' ? 'good' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: reason === 'victory' ? '전략적 승리 뒤 같은 세계선에서 국가 운영을 계속하기로 결정했습니다.' : '완전 정복 대신 협상 종전과 국내 재건을 선택했습니다.',
        trigger: reason === 'victory' ? '전구 승리 조건을 달성해 승전국의 전후 질서 설계 권한을 확보했습니다.' : `전환 준비도 ${transitionReadiness.score}와 안정도 ${Math.round(game.stability)}가 협상 종전 조건을 충족했습니다.`,
        factors: [`전황 ${transitionReadiness.pillars.security}`, `정통성 ${transitionReadiness.pillars.legitimacy}`, `재정 ${transitionReadiness.pillars.finance}`, `산업 ${transitionReadiness.pillars.industry}`, `외교 ${transitionReadiness.pillars.diplomacy}`],
        effects: [{ label: '캠페인 단계', value: '전쟁 수행 → 국가 운영', tone: 'positive' }, { label: '새 승리 조건', value: '국가 성과 · 국민 위임 · 경제 · 제도', tone: 'neutral' }],
        ongoing: ['전쟁 중 축적한 인물·기술·재정·외교·영토·세계선 선택은 모두 유지됩니다.', reason === 'victory' ? '승전 위임과 함께 동원 해제·점령지·부채 관리 책임도 이어집니다.' : '조기 민생 회복의 이점과 미완의 전선·강경파 반발을 함께 관리해야 합니다.'],
        nextActions: ['국가 운영 화면에서 발전 노선, 조세·지출 수준, 6개 부처 예산을 결정하십시오.', '한 주를 진행해 선택의 재정·민생·산업·정치 결과를 확인하십시오.'],
        certainty: 'confirmed',
      },
    );
    const nextRoleTitle = getCareerInstitutionalTitle(careerRole, 'nation', playerNation.status);
    const renamedSeats = staffAuthority.managedDepartments
      .map((department) => getStaffSeatTitle(department, 'nation', playerNation.status))
      .join(' · ');
    addEvent(
      '정부 조직 개편 — ' + nextRoleTitle,
      `${careerRole.title} 직함은 ${nextRoleTitle}(으)로 전환됐습니다. 당신의 인사권 범위는 유지되지만 예하 보직의 명칭과 책임은 새 체제에 맞게 개편됩니다: ${renamedSeats}.`,
      'neutral',
      game.week,
      {
        domain: 'management',
        decision: '전시 지휘계통을 전후·건국 정부의 행정 체계로 전환했습니다.',
        trigger: '캠페인이 전쟁 수행 단계에서 국가 운영 단계로 이동했습니다.',
        factors: [`기존 직함: ${careerRole.title}`, `새 직함: ${nextRoleTitle}`, `직접 관리 보직 ${staffAuthority.managedDepartments.length}개`],
        effects: staffAuthority.managedDepartments.map((department) => ({ label: getStaffSeatTitle(department, 'war', playerNation.status), value: getStaffSeatTitle(department, 'nation', playerNation.status), tone: 'neutral' })),
        ongoing: ['게임 시작 때 선택한 직무의 지휘계통과 인사권 한도는 유지됩니다.', '참모의 능력·충성도·육성·배치 기록도 새 정부에 승계됩니다.'],
        nextActions: ['조직 운영 화면의 보직 계획에서 개편된 직책과 현재 배치를 검토하십시오.', '책임 위임 화면에서 새 정부의 주간 결재 체계를 다시 설정하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${reason === 'victory' ? '승전국의 전후 국가 운영' : '협상 종전 뒤 국가 운영'}을 시작합니다. 새 직함: ${nextRoleTitle}`);
  }, [addEvent, careerRole, economy, formatGameMoney, game, notify, playerNation.id, playerNation.shortName, playerNation.status, research, staffAuthority.managedDepartments, transitionReadiness]);

  const changeNationBudget = (domain: NationBudgetDomain, delta: -5 | 5) => {
    setNationManagement((current) => rebalanceNationBudget(current, domain, delta));
  };

  const changeNationTax = (delta: -5 | 5) => {
    setNationManagement((current) => ({ ...current, taxBurden: Math.max(20, Math.min(80, current.taxBurden + delta)) }));
  };

  const changeNationSpending = (delta: -5 | 5) => {
    setNationManagement((current) => ({ ...current, spendingLevel: Math.max(25, Math.min(85, current.spendingLevel + delta)) }));
  };

  const changeNationStrategy = (strategyId: NationStrategyId) => {
    setNationManagement((current) => ({ ...current, strategyId }));
    notify(`${nationStrategies.find((strategy) => strategy.id === strategyId)?.name ?? '국가 발전 노선'}을 내각의 장기 노선으로 채택했습니다.`);
  };

  const applyDynasticActionResult = useCallback((result: DynasticActionResult) => {
    setNationManagement((current) => ({
      ...current,
      dynasty: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.legitimacyDelta)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.unrestDelta)),
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.politicalPowerDelta,
      treasury: result.treasuryDelta,
      stability: result.stabilityDelta,
    }));
    if (result.relationDelta) {
      setRelations((current) => current.map((relation) => relation.id === result.relationDelta?.nationId ? {
        ...relation,
        value: Math.max(0, Math.min(100, relation.value + (result.relationDelta?.value ?? 0))),
        status: relation.value + (result.relationDelta?.value ?? 0) >= 72 ? '왕실 혼인 동맹' : relation.status,
      } : relation));
    }
    addEvent(result.title, result.detail, result.unrestDelta >= 5 || result.legitimacyDelta < 0 ? 'bad' : result.legitimacyDelta >= 3 ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: '전후 국가 운영 화면에서 헌정·왕실 조치를 직접 결재했습니다.',
      factors: [`현재 보직: ${displayedCareerRole.title}`, `국가체제: ${getGovernmentForm(result.state.formId).name}`, `왕실: ${result.state.houseName}`],
      effects: [
        { label: '정치력', value: `${result.politicalPowerDelta}`, tone: 'negative' },
        { label: '국고', value: formatGameMoney(result.treasuryDelta, { signed: true }), tone: 'negative' },
        { label: '정통성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta >= 0 ? 'positive' : 'negative' },
        { label: '사회 불안', value: `${result.unrestDelta >= 0 ? '+' : ''}${result.unrestDelta}`, tone: result.unrestDelta > 0 ? 'negative' : 'positive' },
      ],
      ongoing: ['왕권·궁정 결속·계승 안정·영지 부담은 매주 국정 결산과 쿠데타 위험에 계속 반영됩니다.'],
      nextActions: ['정치위기 상황실에서 왕위 찬탈·궁정 쿠데타 위험 변화를 확인하십시오.', '다음 국정 1주 진행에서 왕실비와 정통성 변화를 검증하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
  }, [addEvent, displayedCareerRole.title, formatGameMoney, game.week, notify]);

  const dynasticActionContext = useCallback(() => ({
    week: game.week,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: nationManagement.legitimacy,
    role: careerRole,
  }), [careerRole, game.politicalPower, game.stability, game.treasury, game.week, nationManagement.legitimacy]);

  const changeGovernmentForm = (formId: GovernmentFormId) => {
    const result = adoptGovernmentForm(nationManagement.dynasty, formId, dynasticActionContext());
    if (!result) {
      notify('헌정 전환 요건·보직 권한·정치력·국고 또는 26주 냉각기간을 확인하십시오.');
      return;
    }
    applyDynasticActionResult(result);
    setPoliticalCrisis((current) => ({ ...current, governmentName: getGovernmentForm(formId).name, generation: current.generation + 1, lastOutcome: result.title }));
  };

  const appointNobleTitle = (input: { recipientId: string; rankId: NobleRankId; domainId: string }) => {
    const recipient = staff.find((member) => member.id === input.recipientId);
    const domain = territories.find((territory) => territory.id === input.domainId);
    if (!recipient || !domain) return;
    const result = grantNobleTitle(nationManagement.dynasty, {
      week: game.week,
      recipientId: recipient.id,
      recipientName: recipient.name,
      loyalty: recipient.loyalty,
      influence: recipient.influence,
      rankId: input.rankId,
      domainId: domain.id,
      domainName: domain.name,
    }, dynasticActionContext());
    if (!result) {
      notify('왕정 체제·서임 권한·비어 있는 영지·정치력·국고 요건을 확인하십시오.');
      return;
    }
    applyDynasticActionResult(result);
    setStaff((current) => current.map((member) => member.id === recipient.id ? { ...member, loyalty: Math.min(100, member.loyalty + 8), roleSatisfaction: Math.min(100, (member.roleSatisfaction ?? 60) + 12), appointmentPromise: 'succession' } : member));
  };

  const revokeNobleTitle = (grantId: string) => {
    const result = revokeNobleGrant(nationManagement.dynasty, grantId, dynasticActionContext());
    if (!result) {
      notify('작위 회수에는 왕실 인사권과 정치력 12가 필요합니다.');
      return;
    }
    const grant = nationManagement.dynasty.titleGrants.find((item) => item.id === grantId);
    applyDynasticActionResult(result);
    if (grant) setStaff((current) => current.map((member) => member.id === grant.recipientId ? { ...member, loyalty: Math.max(0, member.loyalty - 16), roleSatisfaction: Math.max(0, (member.roleSatisfaction ?? 60) - 24) } : member));
  };

  const arrangeRoyalMarriage = (nationId: string) => {
    const relation = relations.find((item) => item.id === nationId);
    const candidate = getMarriageCandidates(relations).find((item) => item.nationId === nationId);
    if (!relation || !candidate) return;
    const result = arrangeDynasticMarriage(nationManagement.dynasty, candidate, relation.value, dynasticActionContext());
    if (!result) {
      notify('왕정 체제·외교 관계 30·혼인 권한·정치력 18·국고 65M 요건을 확인하십시오.');
      return;
    }
    applyDynasticActionResult(result);
  };

  const changeSuccessionLaw = (lawId: SuccessionLawId) => {
    const result = setSuccessionLaw(nationManagement.dynasty, lawId, dynasticActionContext());
    if (!result) {
      notify('왕정 체제와 계승법 제정 권한, 정치력 16, 국고 24M이 필요합니다.');
      return;
    }
    applyDynasticActionResult(result);
  };

  const electoralContext = useCallback((): ElectoralContext => ({
    week: game.week,
    role: displayedCareerRole,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: nationManagement.legitimacy,
    mandateScore: nationManagement.mandateScore,
    unrest: nationManagement.unrest,
    education: nationManagement.education,
    institutionalCapacity: nationManagement.institutionalCapacity,
    inflation: economy.inflation,
    publicConfidence: economy.publicConfidence,
  }), [displayedCareerRole, economy.inflation, economy.publicConfidence, game.politicalPower, game.stability, game.treasury, game.week, nationManagement.education, nationManagement.institutionalCapacity, nationManagement.legitimacy, nationManagement.mandateScore, nationManagement.unrest]);

  const applyElectoralActionResult = useCallback((result: ElectoralActionResult) => {
    setNationManagement((current) => ({
      ...current,
      electoral: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.legitimacyDelta)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.unrestDelta)),
    }));
    setGame((current) => applyGameDelta(current, { politicalPower: result.politicalPowerDelta, treasury: result.treasuryDelta }));
    addEvent(result.title, result.detail, result.legitimacyDelta >= 1 ? 'good' : result.unrestDelta > 1 ? 'bad' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: '선거·국민투표 상황실에서 유세 또는 투표 발의안을 결재했습니다.',
      factors: [`현재 보직: ${displayedCareerRole.title}`, `국민 위임 ${nationManagement.mandateScore}`, `정통성 ${Math.round(nationManagement.legitimacy)}`, `사회 불안 ${Math.round(nationManagement.unrest)}`],
      effects: [
        { label: '정치력', value: `${result.politicalPowerDelta}`, tone: 'negative' },
        { label: '국고', value: formatGameMoney(result.treasuryDelta, { signed: true }), tone: result.treasuryDelta < 0 ? 'negative' : 'positive' },
        { label: '정통성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta >= 0 ? 'positive' : 'negative' },
      ],
      ongoing: ['후보 기세·지역 집중도·투표율·선거 신뢰는 투표일까지 누적되고 최종 득표·선거인·의석·시장 당선에 반영됩니다.'],
      nextActions: ['선거 상황실에서 지역별 판세와 반복 유세의 효율 저하를 확인하십시오.', '다음 국정 1주 진행으로 선거운동 단계를 진전시키십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
  }, [addEvent, displayedCareerRole.title, formatGameMoney, game.week, nationManagement.legitimacy, nationManagement.mandateScore, nationManagement.unrest, notify]);

  const runElectionCampaignAction = (actionId: ElectionCampaignActionId, regionId: string | null) => {
    const result = applyElectionCampaignAction(nationManagement.electoral, actionId, regionId, electoralContext());
    if (!result) {
      notify('현재 선거 일정, 보직 권한, 정치력·국고 또는 지역 선택을 확인하십시오. 같은 행동을 반복하면 효과가 점차 줄어듭니다.');
      return;
    }
    applyElectoralActionResult(result);
  };

  const proposeReferendum = (topicId: ReferendumTopicId) => {
    const result = launchReferendum(nationManagement.electoral, topicId, electoralContext());
    if (!result) {
      notify('진행 중인 선거가 없고, 2단계 이상 정치 보직과 안건별 정통성·정치력·국고 요건을 충족해야 합니다.');
      return;
    }
    applyElectoralActionResult(result);
  };

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
    const roleDelta: Partial<Record<keyof GameState, number>> = role.branch === 'intelligence'
      ? { intelNetwork: role.archetype === 'resistance' ? 16 : 11, politicalPower: 5, manpower: role.archetype === 'resistance' ? 45 : 0 }
      : role.branch === 'military'
        ? { commandPoints: 10, warSupport: 3 }
        : { politicalPower: 8, stability: 3 };

    const newGame = applyGameDelta({ ...initialGame, ...nation.modifiers, ...doctrineBonus }, roleDelta);
    const newWorldHistoryState = { seed: createWorldHistorySeed(nation.id, role.id), choices: {} };
    const newPublicHealth = createPublicHealthState(createPublicHealthSeed(nation.id, role.id));
    const newEconomy = createEconomyState(nation.id);
    const newRelations = createDiplomaticRelations(nation.id);
    const newOperations = createCovertOperations(nation.defaultTheater, nation.id);
    const openingTrajectory = deriveEmergentHistory({ doctrine, roleBranch: role.branch, game: newGame, relations: newRelations, operations: newOperations });
    const newWorldline = generateWorldline({ nation, game: newGame, state: newWorldHistoryState, trajectory: openingTrajectory });
    const newTerritories = initialTerritories.map((territory) => ({ ...territory }));
    const newResearch = initialResearch.map((project) => ({ ...project }));
    const openingEventTimestamp = Date.now();
    const openingEvents: WarEvent[] = [
      { id: openingEventTimestamp, week: 0, title: '보직 인수 — ' + role.historicalHolderName + '을 대신하여', detail: role.historicalHolderName + '이(가) 맡았던 ' + role.historicalOffice + '의 권한을 대체역사 보직으로 재편했습니다. 전임자는 인재 시장의 경쟁자로 남습니다.', tone: 'good' },
      {
        id: openingEventTimestamp + 1,
        week: 0,
        title: `살아있는 역사 개막 — ${openingTrajectory.title}`,
        detail: `${doctrine === 'coalition' ? '연합과 협상' : doctrine === 'methodical' ? '산업과 준비' : '속도와 충격'}이라는 첫 선택에서 출발합니다. 앞으로 실제 행동이 세계의 세력권과 제도를 계속 바꿉니다.`,
        tone: 'neutral',
        trace: {
          domain: 'history',
          decision: `취임 지휘 철학으로 ‘${doctrine === 'coalition' ? '연합과 협상' : doctrine === 'methodical' ? '산업과 준비' : '속도와 충격'}’을 선택했습니다.`,
          trigger: `${nation.shortName}의 ${role.title} 보직에서 1942년 10월 25일 지휘를 시작했습니다.`,
          factors: [`플레이 국가: ${nation.shortName}`, `대체 보직: ${role.historicalHolderName} · ${role.historicalOffice}`, `세계선 코드: ${newWorldline.code}`, `세력권 경쟁: ${newWorldline.rivalryName}`],
          effects: [{ label: '세계선', value: newWorldline.code, tone: 'neutral' }],
          ongoing: ['국가 원칙·작전·인사·외교·연구·경제 선택이 여섯 역사 압력에 누적되며, 이후 사건의 행위자와 결과 확률을 바꿉니다.'],
          nextActions: ['세계 주보의 각 기사에서 전선·외교·경제·사회·과학·정보 화면으로 이동해 첫 주 우선순위를 결정하십시오.'],
          certainty: 'developing',
        },
      },
    ];
    const openingWorldWeeklyIssue = generateWorldWeeklyIssue({
      week: 0,
      nation,
      playerFaction: nation.alignment,
      game: newGame,
      territories: newTerritories,
      events: openingEvents,
      battleReports: [],
      relations: newRelations,
      economy: newEconomy,
      publicHealth: newPublicHealth,
      research: newResearch,
      operations: newOperations,
      worldline: newWorldline,
    });
    setGame(newGame);
    setPublicHealth(newPublicHealth);
    setEconomy(newEconomy);
    setCampaignPhase('war');
    setNationManagement(createNationManagementState(nation.id, newGame, newEconomy, initialResearch.filter((project) => project.complete).length, 'negotiated'));
    setPoliticalCrisis(createPoliticalCrisisState(nation.id));
    setPendingCoupIncident(null);
    setShowPoliticalCrisis(false);
    setTerritories(newTerritories);
    setDivisions(newDivisions);
    setResearch(newResearch);
    setEquipmentDevelopment(createEquipmentDevelopment(nation.id));
    setProduction(createCampaignProduction(nation));
    setStaff(createStaffRoster(nation.id, role.id));
    setStaffCandidates([
      ...createStaffCandidates(nation.id, role.id),
      ...createEmergentIntelligenceCandidates(nation.id, 1942, newWorldline.timeline),
    ]);
    setDevelopmentFocusId(null);
    setSupplyPolicy('balanced');
    setProcurementFocusId('rifle');
    setPriorityDivisionId(newDivisions[0].id);
    setSelectedPolicies([]);
    setPendingCouncilEventId(null);
    setPendingWorldFlashpointId(null);
    setResolvedCouncilChoices([]);
    setBattleStance('balanced');
    setBattleReports([]);
    setPendingBattleReportId(null);
    setPendingOffensivePlan(null);
    setPlanningMode(false);
    setCommanderDevelopment(createCommanderDevelopment(createCareerCommanders(nation, role)));
    setEvents(openingEvents);
    setOrders([]);
    setStockpile(initialStockpile);
    setRelations(newRelations);
    setOperations(newOperations);
    setCareer(newCareer);
    const commandTerritoryId = getNationCommandTerritoryId(nation);
    const openingMapRegion = nation.operationalHeadquarters
      ? getMapRegionForTerritory(newTerritories, commandTerritoryId, nation.defaultTheater)
      : getDefaultMapRegion(nation.defaultTheater);
    setActiveTheater(nation.defaultTheater);
    setActiveMapRegionId(openingMapRegion.id);
    setMapCamera(clampMapCamera(openingMapRegion.camera));
    setSelectedTerritoryId(commandTerritoryId);
    setSelectedDivisionId(newDivisions[0].id);
    setObjectiveProgress(22);
    setTorchAuthorized(false);
    setCompletedDecisions([]);
    setCampaignOutcome(null);
    setShowActionCenter(false);
    setShowStatusOverview(false);
    setShowSettings(false);
    setShowResetConfirmation(false);
    setShowCommandPalette(false);
    setShowFieldManual(false);
    setShowSaveCenter(false);
    setShowAchievementGallery(false);
    setShowWorldHistory(false);
    setShowWorldWeekly(false);
    setTrackedActionId(null);
    setTrackedActionSnapshot(null);
    setCompletedTrackedAction(null);
    setUXActionLifecycle([]);
    setVisitedOnboardingTabs(['command']);
    setOnboardingMilestones([]);
    setPendingAchievementId(null);
    setAchievementUnlocks([]);
    setWorldWeeklyIssues([openingWorldWeeklyIssue]);
    setLastReadWorldWeeklyId(null);
    setLastReviewedJournalWeek(-1);
    setWorldHistoryState(newWorldHistoryState);
    setShowBriefing(false);
    setShowTutorial(!localStorage.getItem(TUTORIAL_KEY));
    notify(nation.shortName + ' · ' + role.title + '로 취임했습니다. 세계 주보 창간호가 발행되었습니다.');
  };

  const continueCampaign = () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const savedCareer: CareerState = data.career ?? createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID);
      const restoredNation = getNation(savedCareer.nationId);
      const restoredRole = getRole(savedCareer.roleId, savedCareer.nationId);
      const restoredCareer: CareerState = {
        ...savedCareer,
        replacedPersonId: savedCareer.replacedPersonId ?? restoredRole.historicalHolderId,
      };
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
      const historicalProduction = createCampaignProduction(restoredNation);
      const savedProduction: ProductionLine[] = data.production ?? [];
      const migratedProduction = historicalProduction.map((fallback) => ({ ...fallback, ...(savedProduction.find((line) => line.id === fallback.id) ?? {}) }));
      const restoredGame = { ...initialGame, ...(data.game ?? {}) };
      const restoredWorldHistoryState = normalizeWorldHistoryState(data.worldHistoryState, createWorldHistorySeed(restoredNation.id, restoredRole.id, data.game?.week ?? 0));
      const restoredPublicHealth = normalizePublicHealthState(data.publicHealth, createPublicHealthSeed(restoredNation.id, restoredRole.id));
      const restoredEvents: WarEvent[] = data.events ?? initialEvents;
      const restoredRelations: DiplomaticRelation[] = data.relations ?? createDiplomaticRelations(restoredNation.id);
      const restoredOperations: CovertOperation[] = data.operations ?? createCovertOperations(restoredNation.defaultTheater, restoredNation.id);
      const restoredBattleReports: BattleReport[] = data.battleReports ?? [];
      setGame(restoredGame);
      setPublicHealth(restoredPublicHealth);
      const restoredEconomy = normalizeEconomyState(data.economy, restoredNation.id, 1942 + Math.floor(restoredGame.week / 52));
      const restoredResearch: ResearchProject[] = data.research ?? initialResearch;
      const restoredPhase: CampaignPhase = data.campaignPhase === 'nation' ? 'nation' : 'war';
      const nationFallback = createNationManagementState(restoredNation.id, restoredGame, restoredEconomy, restoredResearch.filter((project) => project.complete).length, 'negotiated');
      const restoredNationManagement = normalizeNationManagementState(data.nationManagement, nationFallback);
      const restoredPolicies = strategicPolicies.filter((policy) => (data.selectedPolicies ?? []).includes(policy.id));
      const restoredTrajectory = deriveEmergentHistory({
        doctrine: data.doctrine ?? 'coalition',
        roleBranch: restoredRole.branch,
        game: restoredGame,
        selectedPolicies: restoredPolicies,
        completedDecisions: data.completedDecisions ?? [],
        events: restoredEvents,
        research: restoredResearch,
        operations: restoredOperations,
        relations: restoredRelations,
        nationStrategyId: restoredPhase === 'nation' ? restoredNationManagement.strategyId : undefined,
        nationBudget: restoredPhase === 'nation' ? restoredNationManagement.budget : undefined,
      });
      const restoredWorldline = generateWorldline({ nation: restoredNation, game: restoredGame, state: restoredWorldHistoryState, trajectory: restoredTrajectory });
      setEconomy(restoredEconomy);
      setCampaignPhase(restoredPhase);
      setNationManagement(restoredNationManagement);
      setPoliticalCrisis(normalizePoliticalCrisisState(data.politicalCrisis, restoredNation.id));
      setPendingCoupIncident(data.pendingCoupIncident && data.pendingCoupIncident.nationId === restoredNation.id ? data.pendingCoupIncident : null);
      setShowPoliticalCrisis(false);
      setTerritories(mergedTerritories);
      setDivisions(migratedDivisions);
      setResearch(restoredResearch);
      setEquipmentDevelopment(normalizeEquipmentDevelopment(data.equipmentDevelopment, restoredNation.id));
      setProduction(migratedProduction);
      setEvents(restoredEvents);
      setOrders(data.orders ?? []);
      setStockpile({ ...initialStockpile, ...(data.stockpile ?? {}) });
      setRelations(restoredRelations);
      setOperations(restoredOperations);
      const historicalStaff = createStaffRoster(restoredNation.id, restoredRole.id);
      const savedStaff: StaffMember[] = data.staff ?? [];
      setStaff(historicalStaff.map((fallback) => {
        const saved = savedStaff.find((member) => member.department === fallback.department);
        if (!saved) return fallback;
        if (data.version >= 9) return { ...fallback, ...saved, grade: saved.grade ?? 1, development: saved.development ?? 20 };
        return {
          ...fallback,
          ability: saved.ability ?? fallback.ability,
          potential: saved.potential ?? fallback.potential,
          loyalty: saved.loyalty ?? fallback.loyalty,
          workload: saved.workload ?? fallback.workload,
          weeklyCost: saved.weeklyCost ?? fallback.weeklyCost,
          delegated: saved.delegated ?? fallback.delegated,
          grade: saved.grade ?? fallback.grade,
          development: saved.development ?? fallback.development,
        };
      }));
      const restoredYear = 1942 + Math.floor((data.game?.week ?? 0) / 52);
      const restoredHistoricalHorizon = getHistoricalHorizon(data.game?.week ?? 0, data.completedDecisions ?? []);
      const historicalCandidates = [
        ...createStaffCandidates(restoredNation.id, restoredRole.id),
        ...createEmergentIntelligenceCandidates(restoredNation.id, restoredYear, restoredWorldline.timeline),
        ...createLaterEraCandidates(restoredNation.id, restoredYear, restoredHistoricalHorizon).slice(0, 16),
      ];
      const savedCandidates: StaffCandidate[] = data.staffCandidates ?? [];
      const mergedCandidates = historicalCandidates.map((fallback) => {
        const saved = savedCandidates.find((candidate) => candidate.personId === fallback.personId || candidate.id === fallback.id);
        return saved ? { ...fallback, ...saved } : fallback;
      });
      const displacedCandidates = savedCandidates.filter((saved) => !historicalCandidates.some((fallback) => fallback.personId === saved.personId || fallback.id === saved.id));
      setStaffCandidates([...mergedCandidates, ...displacedCandidates]);
      setDevelopmentFocusId(data.developmentFocusId ?? null);
      setSupplyPolicy(data.supplyPolicy ?? 'balanced');
      setProcurementFocusId(data.procurementFocusId ?? 'rifle');
      setPriorityDivisionId(data.priorityDivisionId ?? migratedDivisions[0]?.id ?? '');
      setSelectedPolicies(data.selectedPolicies ?? []);
      setPendingCouncilEventId(data.pendingCouncilEventId ?? null);
      setPendingWorldFlashpointId(typeof data.pendingWorldFlashpointId === 'string' ? data.pendingWorldFlashpointId : null);
      setResolvedCouncilChoices(data.resolvedCouncilChoices ?? []);
      setBattleStance(data.battleStance ?? 'balanced');
      setBattleReports(restoredBattleReports);
      setPendingBattleReportId(data.pendingBattleReportId ?? null);
      setPendingOffensivePlan(null);
      setPlanningMode(false);
      setCommanderDevelopment(restoredDevelopment);
      setAchievementUnlocks(normalizeAchievementUnlocks(data.achievementUnlocks));
      const restoredWorldWeeklyIssues = normalizeWorldWeeklyIssues(data.worldWeeklyIssues);
      setWorldWeeklyIssues(restoredWorldWeeklyIssues.length > 0 ? restoredWorldWeeklyIssues : [generateWorldWeeklyIssue({
        week: restoredGame.week,
        nation: restoredNation,
        playerFaction: restoredNation.alignment,
        game: restoredGame,
        territories: mergedTerritories,
        events: restoredEvents,
        battleReports: restoredBattleReports,
        relations: restoredRelations,
        economy: restoredEconomy,
        publicHealth: restoredPublicHealth,
        research: restoredResearch,
        operations: restoredOperations,
        worldline: restoredWorldline,
      })]);
      setLastReadWorldWeeklyId(typeof data.lastReadWorldWeeklyId === 'string' ? data.lastReadWorldWeeklyId : null);
      setLastReviewedJournalWeek(typeof data.lastReviewedJournalWeek === 'number' ? data.lastReviewedJournalWeek : -1);
      setUXActionLifecycle(normalizeUXActionLifecycle(data.uxActionLifecycle));
      setVisitedOnboardingTabs(Array.isArray(data.visitedOnboardingTabs)
        ? Array.from(new Set(['command', ...data.visitedOnboardingTabs.filter((tab: unknown): tab is GameTab => typeof tab === 'string')]))
        : ['command']);
      setOnboardingMilestones(Array.isArray(data.onboardingMilestones)
        ? data.onboardingMilestones.filter((milestone: unknown): milestone is string => typeof milestone === 'string')
        : []);
      setWorldHistoryState(restoredWorldHistoryState);
      setPendingAchievementId(null);
      setCareer(restoredCareer);
      setSetupNationId(restoredCareer.nationId);
      setSetupRoleId(restoredCareer.roleId);
      const restoredTheater = data.activeTheater ?? restoredNation.defaultTheater;
      const restoredMapRegion = getDefaultMapRegion(restoredTheater);
      setActiveTheater(restoredTheater);
      setActiveMapRegionId(restoredMapRegion.id);
      setMapCamera(clampMapCamera(restoredMapRegion.camera));
      setSelectedTerritoryId(data.selectedTerritoryId ?? getNationCommandTerritoryId(restoredNation));
      setSelectedDivisionId(data.selectedDivisionId ?? migratedDivisions[0]?.id);
      setCampaignOutcome(restoredPhase === 'nation' ? null : data.campaignOutcome ?? null);
      setObjectiveProgress(data.objectiveProgress ?? 28);
      setTorchAuthorized(data.torchAuthorized ?? false);
      setCompletedDecisions(data.completedDecisions ?? []);
      setDoctrine(data.doctrine ?? 'coalition');
      setShowActionCenter(false);
      setShowStatusOverview(false);
      setShowSettings(false);
      setShowResetConfirmation(false);
      setShowCommandPalette(false);
      setShowFieldManual(false);
      setShowTutorial(false);
      setShowSaveCenter(false);
      setShowAchievementGallery(false);
      setShowWorldHistory(false);
      setShowWorldWeekly(false);
      setTrackedActionId(null);
      setTrackedActionSnapshot(null);
      setCompletedTrackedAction(null);
      setActiveTab(restoredPhase === 'nation' ? 'governance' : 'command');
      setShowBriefing(false);
      if (typeof data.pendingWorldFlashpointId === 'string' || data.pendingCoupIncident) setSpeed(0);
      notify('저장된 전쟁 지휘소를 복구했습니다.');
    } catch {
      notify('저장 데이터를 읽을 수 없습니다. 새 캠페인을 시작합니다.');
    }
  };

  const resetCampaign = () => {
    localStorage.removeItem(SAVE_KEY);
    setGame(initialGame);
    setPublicHealth(createPublicHealthState(createPublicHealthSeed(DEFAULT_NATION_ID, DEFAULT_ROLE_ID)));
    setEconomy(createEconomyState(DEFAULT_NATION_ID));
    setCampaignPhase('war');
    setNationManagement(defaultNationManagementState);
    setPoliticalCrisis(createPoliticalCrisisState(DEFAULT_NATION_ID));
    setPendingCoupIncident(null);
    setShowPoliticalCrisis(false);
    setTerritories(initialTerritories);
    setDivisions(defaultDivisions);
    setResearch(initialResearch);
    setEquipmentDevelopment(createEquipmentDevelopment(DEFAULT_NATION_ID));
    setProduction(defaultProduction);
    setEvents(initialEvents);
    setOrders([]);
    setStockpile(initialStockpile);
    setRelations(initialRelations);
    setOperations(initialOperations);
    setStaff(createStaffRoster(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
    setStaffCandidates([
      ...createStaffCandidates(DEFAULT_NATION_ID, DEFAULT_ROLE_ID),
      ...createEmergentIntelligenceCandidates(DEFAULT_NATION_ID, 1942),
    ]);
    setDevelopmentFocusId(null);
    setSupplyPolicy('balanced');
    setProcurementFocusId('rifle');
    setPriorityDivisionId(defaultDivisions[0].id);
    setSelectedPolicies([]);
    setPendingCouncilEventId(null);
    setPendingWorldFlashpointId(null);
    setResolvedCouncilChoices([]);
    setBattleStance('balanced');
    setBattleReports([]);
    setPendingBattleReportId(null);
    setPendingOffensivePlan(null);
    setPlanningMode(false);
    setCommanderDevelopment(defaultCommanderDevelopment);
    setSetupNationId(DEFAULT_NATION_ID);
    setSetupRoleId(DEFAULT_ROLE_ID);
    setCareer(createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
    setActiveTheater('europe');
    setActiveMapRegionId('europe-overview');
    setSelectedTerritoryId(getNationCommandTerritoryId(defaultNation));
    setSelectedDivisionId(defaultDivisions[0].id);
    setMapLayer('political');
    setMapCamera(DEFAULT_MAP_CAMERA);
    setCampaignOutcome(null);
    setObjectiveProgress(28);
    setTorchAuthorized(false);
    setCompletedDecisions([]);
    setSpeed(0);
    setShowActionCenter(false);
    setShowStatusOverview(false);
    setShowSettings(false);
    setShowResetConfirmation(false);
    setShowCommandPalette(false);
    setShowFieldManual(false);
    setShowTutorial(false);
    setShowSaveCenter(false);
    setShowAchievementGallery(false);
    setShowWorldHistory(false);
    setShowWorldWeekly(false);
    setTrackedActionId(null);
    setTrackedActionSnapshot(null);
    setCompletedTrackedAction(null);
    setUXActionLifecycle([]);
    setVisitedOnboardingTabs(['command']);
    setOnboardingMilestones([]);
    setPendingAchievementId(null);
    setAchievementUnlocks([]);
    setWorldWeeklyIssues([]);
    setLastReadWorldWeeklyId(null);
    setLastReviewedJournalWeek(-1);
    setWorldHistoryState({ seed: createWorldHistorySeed(DEFAULT_NATION_ID, DEFAULT_ROLE_ID), choices: {} });
    setShowBriefing(true);
  };

  const saveManualSlot = (slot: number) => {
    const nextSave: ManualSaveSlot = {
      slot,
      savedAt: new Date().toISOString(),
      nationName: playerNation.shortName,
      roleTitle: currentRoleTitle,
      week: game.week,
      theaterName: activeTheater === 'asia' ? '아시아·태평양' : '유럽·지중해',
      victoryScore: game.victoryScore,
      payload: savePayload,
    };
    setManualSaves((current) => upsertManualSave(current, nextSave));
    notify(`체크포인트 ${slot}에 현재 캠페인을 저장했습니다.`);
  };

  const loadManualSlot = (slot: number) => {
    const saved = manualSaves.find((item) => item.slot === slot);
    if (!saved) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved.payload));
    setShowSaveCenter(false);
    continueCampaign();
    notify(`체크포인트 ${slot}을 불러왔습니다.`);
  };

  const removeManualSlot = (slot: number) => {
    setManualSaves((current) => deleteManualSave(current, slot));
    notify(`체크포인트 ${slot}을 삭제했습니다.`);
  };

  const exportCampaignSave = (slot: number | null) => {
    const selectedSave = slot === null ? null : manualSaves.find((item) => item.slot === slot);
    const exportData: ManualSaveSlot = selectedSave ?? {
      slot: 0,
      savedAt: new Date().toISOString(),
      nationName: playerNation.shortName,
      roleTitle: currentRoleTitle,
      week: game.week,
      theaterName: activeTheater === 'asia' ? '아시아·태평양' : '유럽·지중해',
      victoryScore: game.victoryScore,
      payload: savePayload,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `iron-dominion-${exportData.payload.career.nationId}-week-${exportData.week + 1}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify('캠페인 저장 파일을 내보냈습니다.');
  };

  const importCampaignSave = (file: File) => {
    const emptySlot = [1, 2, 3].find((slot) => !manualSaves.some((save) => save.slot === slot));
    if (!emptySlot) {
      notify('가져오려면 먼저 수동 저장 슬롯 하나를 비워야 합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result ?? ''));
        const wrappedPayload = parsed && typeof parsed === 'object' && 'payload' in parsed ? (parsed as { payload: unknown }).payload : parsed;
        if (!isCampaignSavePayload(wrappedPayload)) throw new Error('invalid-save');
        const importedNation = getNation(wrappedPayload.career.nationId as NationId);
        const importedRole = getRole(wrappedPayload.career.roleId, importedNation.id);
        const normalizedPayload: CampaignSavePayload = {
          ...wrappedPayload,
          career: { ...wrappedPayload.career, nationId: importedNation.id, roleId: importedRole.id },
        };
        const importedSlot: ManualSaveSlot = {
          slot: emptySlot,
          savedAt: new Date().toISOString(),
          nationName: importedNation.shortName,
          roleTitle: importedRole.title,
          week: wrappedPayload.game.week,
          theaterName: wrappedPayload.activeTheater === 'asia' ? '아시아·태평양' : '유럽·지중해',
          victoryScore: wrappedPayload.game.victoryScore,
          payload: normalizedPayload,
        };
        setManualSaves((current) => upsertManualSave(current, importedSlot));
        notify(`저장 파일을 체크포인트 ${emptySlot}에 가져왔습니다.`);
      } catch {
        notify('올바른 IRON DOMINION 저장 파일이 아닙니다.');
      }
    };
    reader.onerror = () => notify('저장 파일을 읽을 수 없습니다.');
    reader.readAsText(file);
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
      setPendingOffensivePlan({ divisionId: currentDivision.id, originId: origin.id, targetId: target.id, stance: battleStance });
      setPlanningMode(false);
      setSpeed(0);
      setSelectedTerritoryId(target.id);
      setMapSelectionOpen(true);
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      setToast('');
      return;
    }

    setSelectedTerritoryId(territoryId);
    setMapSelectionOpen(true);
    const divisionAtTerritory = divisions.find((division) => division.territoryId === territoryId);
    if (divisionAtTerritory) setSelectedDivisionId(divisionAtTerritory.id);
  };

  const issueOffensive = () => {
    if (campaignPhase === 'nation') {
      notify('국가 운영 단계에서 전역 지도는 국경·교역·안보 현황을 보여 줍니다. 영토 공세 대신 외교·안보 예산을 사용하십시오.');
      setPlanningMode(false);
      return;
    }
    if (selectedDivision.status !== 'ready') {
      notify('이 사단은 현재 명령을 수행할 준비가 되지 않았습니다.');
      return;
    }
    setPendingOffensivePlan(null);
    setPlanningMode(true);
    setActiveTab('map');
    notify('지도에서 인접한 적 지역을 선택하십시오.');
  };

  const cancelOffensivePlan = () => {
    setPendingOffensivePlan(null);
    setPlanningMode(true);
    notify('계획 승인을 보류했습니다. 지도에서 다른 목표를 선택할 수 있습니다.');
  };

  const completeOnboardingMilestone = useCallback((milestoneId: string) => {
    setOnboardingMilestones((current) => current.includes(milestoneId) ? current : [...current, milestoneId]);
  }, []);

  const confirmOffensivePlan = () => {
    if (campaignPhase === 'nation') {
      setPendingOffensivePlan(null);
      setPlanningMode(false);
      notify('종전 체제에서는 공세 명령을 발령할 수 없습니다.');
      return;
    }
    if (!pendingOffensivePlan || !pendingOffensivePlanDetails) return;
    const { division, origin, target } = pendingOffensivePlanDetails;
    if (division.status !== 'ready' || !origin.neighbors.includes(target.id) || target.controller === playerFaction) {
      setPendingOffensivePlan(null);
      setPlanningMode(false);
      notify('전선 상황이 바뀌어 이 계획을 승인할 수 없습니다.');
      return;
    }
    if (game.commandPoints < 5) {
      notify('지휘 점수가 부족합니다.');
      return;
    }
    const stance = pendingOffensivePlan.stance;
    const forecast = offensiveForecasts?.[stance];
    const stanceLabel = stance === 'cautious' ? '신중한 공세' : stance === 'aggressive' ? '총공세' : '균형 공세';
    setOrders((current) => [...current, {
      divisionId: division.id,
      fromId: origin.id,
      targetId: target.id,
      startedWeek: game.week,
      stance,
    }]);
    setDivisions((current) => current.map((item) => item.id === division.id ? { ...item, status: 'moving' } : item));
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 5 }));
    setBattleStance(stance);
    setPendingOffensivePlan(null);
    setPlanningMode(false);
    setSelectedTerritoryId(target.id);
    completeOnboardingMilestone('military-action');
    addEvent(
      '공세 계획 승인 — ' + target.name,
      `${division.name}에 ${stanceLabel}를 명령했습니다.${forecast ? ` 참모부 예상 승산은 ${forecast.successChance}%입니다.` : ''}`,
      'neutral',
      game.week,
    );
    notify(`${division.name} → ${target.name} 공세 승인 · ${stanceLabel}`);
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
      ...operationDivisions.map((division) => ({ divisionId: division.id, fromId: division.territoryId, targetId: operationTarget.id, startedWeek: game.week, stance: battleStance })),
    ]);
    setDivisions((current) => current.map((division) => operationDivisions.some((item) => item.id === division.id) ? { ...division, status: 'moving' } : division));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 20, commandPoints: current.commandPoints - 10 }));
    setTorchAuthorized(true);
    completeOnboardingMilestone('military-action');
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

  const startEquipmentResearch = (nodeId: string) => {
    const node = getEquipmentNode(nodeId);
    if (!node || !canResearchEquipment(node, equipmentDevelopment, playerNation.id)) {
      notify('선행 장비 계보를 먼저 완료해야 합니다.');
      return;
    }
    if (equipmentDevelopment.activeProjectId) {
      notify('통합 장비 개발 슬롯이 이미 사용 중입니다.');
      return;
    }
    if (game.politicalPower < 5) {
      notify('개발 사업 승인에는 정치력 5가 필요합니다.');
      return;
    }
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 5 }));
    setEquipmentDevelopment((current) => ({ ...current, activeProjectId: node.id, progress: 0 }));
    addEvent('장비 개발 착수 — ' + node.name, node.summary + ' 연구·시험 사업을 승인했습니다.', 'neutral', game.week);
    notify(node.name + ' 개발 사업을 시작했습니다.');
  };

  const createEquipmentPrototype = (baseNodeId: string, moduleIds: string[], name: string) => {
    const base = getEquipmentNode(baseNodeId);
    const modules = moduleIds.map(getEquipmentModule);
    if (!base || !equipmentDevelopment.unlockedIds.includes(base.id) || modules.some((module) => !module || !canUseModule(module, equipmentDevelopment))) {
      notify('아직 사용할 수 없는 장비나 모듈이 포함되어 있습니다.');
      return;
    }
    if (new Set(modules.map((module) => module?.slot)).size !== modules.length || moduleIds.length < 2) {
      notify('서로 다른 모듈 슬롯을 두 개 이상 선택하십시오.');
      return;
    }
    if (equipmentDevelopment.prototypes.length >= 8) {
      notify('시제품 보관 한도 8개에 도달했습니다.');
      return;
    }
    const prototype = calculatePrototype(base.id, moduleIds, name, game.week);
    if (!prototype) return;
    const treasuryCost = Math.max(45, Math.round(prototype.industrialCost * 1.6));
    if (game.treasury < treasuryCost || game.politicalPower < 8) {
      notify(`시제품 제작에는 정치력 8과 재정 ${formatGameMoney(treasuryCost)}가 필요합니다.`);
      return;
    }
    const storedPrototype = { ...prototype, id: `${prototype.id}-${equipmentDevelopment.prototypes.length + 1}` };
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 8, treasury: current.treasury - treasuryCost }));
    setEquipmentDevelopment((current) => ({ ...current, prototypes: [...current.prototypes, storedPrototype] }));
    addEvent('시제 장비 완성 — ' + storedPrototype.name, `6개 성능 지표 시험이 시작됐습니다. 통합 위험 ${storedPrototype.risk}%, 신뢰성 ${storedPrototype.reliability}.`, storedPrototype.risk >= 35 ? 'bad' : 'good', game.week);
    notify(`${storedPrototype.name} 제작 완료 · 개발 위험 ${storedPrototype.risk}%`);
  };

  const fieldEquipment = (equipmentId: string) => {
    const equipment = getDevelopedEquipment(equipmentId, equipmentDevelopment);
    if (!equipment || (!equipmentDevelopment.unlockedIds.includes(equipment.id) && !equipmentDevelopment.prototypes.some((prototype) => prototype.id === equipment.id))) return;
    if (equipmentDevelopment.fieldedByCategory[equipment.category] === equipment.id) return;
    const adoptionCost = Math.max(30, Math.round(equipment.industrialCost * 1.2));
    if (game.politicalPower < 6 || game.treasury < adoptionCost) {
      notify(`채택 승인에는 정치력 6과 재정 ${formatGameMoney(adoptionCost)}가 필요합니다.`);
      return;
    }
    const lineIds: Partial<Record<EquipmentCategory, string>> = {
      infantry: 'rifle', artillery: 'artillery', armor: 'sherman', aircraft: 'spitfire', naval: 'convoy', logistics: 'truck',
    };
    const baseOutputs: Record<string, number> = { rifle: 6480, artillery: 360, sherman: 116, spitfire: 198, convoy: 12, truck: 620 };
    const lineId = lineIds[equipment.category];
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 6, treasury: current.treasury - adoptionCost }));
    setEquipmentDevelopment((current) => ({ ...current, fieldedByCategory: { ...current.fieldedByCategory, [equipment.category]: equipment.id } }));
    if (lineId) {
      setProduction((current) => current.map((line) => line.id === lineId ? {
        ...line,
        name: equipment.name,
        equipmentId: equipment.id,
        reliability: equipment.stats.reliability,
        unitCost: equipment.industrialCost,
        output: Math.max(1, Math.round(baseOutputs[lineId] * equipment.stats.production / 75)),
        efficiency: Math.max(20, line.efficiency - 12 - Math.round(('risk' in equipment ? equipment.risk : 0) / 8)),
      } : line));
    }
    addEvent('제식 채택 — ' + equipment.name, `${equipment.category} 분야의 생산·보급 표준을 전환했습니다. 생산 효율은 재편 후 매주 회복됩니다.`, 'good', game.week);
    notify(equipment.name + (lineId ? ' 양산 전환을 승인했습니다.' : ' 운용 교리를 전군에 적용했습니다.'));
  };

  const assignDivisionEquipment = (divisionId: string, equipmentId: string) => {
    const division = divisions.find((item) => item.id === divisionId);
    const equipment = getDevelopedEquipment(equipmentId, equipmentDevelopment);
    const requiredCategory: EquipmentCategory = division?.type === 'armor' ? 'armor' : 'infantry';
    if (!division || !equipment || equipment.category !== requiredCategory) {
      notify('사단 유형에 맞는 제식 장비 패키지만 배치할 수 있습니다.');
      return;
    }
    setEquipmentDevelopment((current) => ({ ...current, divisionAssignments: { ...current.divisionAssignments, [divisionId]: equipment.id } }));
    setDivisions((current) => current.map((item) => item.id === divisionId ? { ...item, equipmentPackageId: equipment.id } : item));
    addEvent('장비 재편 — ' + division.name, equipment.name + ' 패키지를 우선 보급 편제로 지정했습니다.', 'neutral', game.week);
    notify(division.name + '에 ' + equipment.name + '을(를) 배치했습니다.');
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

  const completeTutorial = (openWorldWeeklyAfter: boolean) => {
    localStorage.setItem(TUTORIAL_KEY, 'complete');
    setShowTutorial(false);
    if (openWorldWeeklyAfter && latestWorldWeeklyIssue) {
      setSpeed(0);
      setLastReadWorldWeeklyId(latestWorldWeeklyIssue.id);
      setShowWorldWeekly(true);
      notify(`튜토리얼을 마쳤습니다. 세계 주보 제 ${latestWorldWeeklyIssue.edition}호를 엽니다.`);
      return;
    }
    notify('첫 지휘 튜토리얼을 닫았습니다. 읽지 않은 세계 주보는 지휘 본부에서 확인할 수 있습니다.');
  };

  const zoomMap = useCallback((delta: number) => {
    setMapCamera((current) => clampMapCamera({ ...current, zoom: current.zoom + delta }));
  }, []);

  const moveMapCamera = useCallback((camera: MapCamera) => {
    setMapCamera(clampMapCamera(camera));
  }, []);

  const resetMapCamera = useCallback(() => {
    setMapCamera(clampMapCamera(activeMapRegion.camera));
  }, [activeMapRegion.camera]);

  const toggleMapFilters = useCallback(() => {
    setMapFiltersOpen((current) => !current);
    setMapLegendOpen(false);
  }, []);

  const toggleMapLegend = useCallback(() => {
    setMapLegendOpen((current) => !current);
    setMapFiltersOpen(false);
  }, []);

  const toggleMapFocusMode = useCallback(() => {
    setMapFocusMode((current) => !current);
    setMapFiltersOpen(false);
    setMapLegendOpen(false);
  }, []);

  const switchMapRegion = useCallback((regionId: string) => {
    const region = getMapRegion(regionId, activeTheater);
    const visibleTerritories = getTerritoriesForMapRegion(territories, region);
    const focus = visibleTerritories.find((territory) => territory.controller === playerFaction && territory.siteType === 'capital')
      ?? visibleTerritories.find((territory) => territory.controller === playerFaction && (territory.labelTier ?? 3) === 1)
      ?? visibleTerritories[0];
    setActiveMapRegionId(region.id);
    setMapCamera(clampMapCamera(region.camera));
    if (focus) setSelectedTerritoryId(focus.id);
    setMapSelectionOpen(Boolean(focus));
  }, [activeTheater, playerFaction, territories]);

  const focusMapTerritory = useCallback((territoryId: string) => {
    const territory = territories.find((candidate) => candidate.id === territoryId);
    if (!territory) return;
    const territoryTheater = territory.theater ?? 'europe';
    const point = getHistoricalMapPoint(territoryTheater, territory);
    const region = getMapRegionForTerritory(territories, territory.id, territoryTheater);
    setActiveTheater(territoryTheater);
    setActiveMapRegionId(region.id);
    setActiveTab('map');
    setSelectedTerritoryId(territory.id);
    setMapSelectionOpen(true);
    setMapCamera(clampMapCamera({ centerX: point.x, centerY: point.y, zoom: 2.25 }));
  }, [territories]);

  const focusOperationalOrder = useCallback((order: Order) => {
    focusMapTerritory(order.targetId);
    setSelectedDivisionId(order.divisionId);
    setMapFocusMode(false);
  }, [focusMapTerritory]);

  const focusMapFront = useCallback((frontId: string) => {
    const members = theaterTerritories.filter((territory) => territory.frontId === frontId && regionalTerritoryIds.has(territory.id));
    if (!members.length) return;
    const points = members.map((territory) => getHistoricalMapPoint(activeTheater, territory));
    setSelectedTerritoryId(members.sort((a, b) => b.value - a.value)[0].id);
    setMapSelectionOpen(true);
    setMapCamera(clampMapCamera({
      centerX: points.reduce((total, point) => total + point.x, 0) / points.length,
      centerY: points.reduce((total, point) => total + point.y, 0) / points.length,
      zoom: Math.max(2, activeMapRegion.camera.zoom),
    }));
  }, [activeMapRegion.camera.zoom, activeTheater, regionalTerritoryIds, theaterTerritories]);

  const switchTheater = (theater: TheaterId) => {
    const defaultRegion = getDefaultMapRegion(theater);
    setActiveTheater(theater);
    setActiveMapRegionId(defaultRegion.id);
    setActiveTab('map');
    setMapCamera(clampMapCamera(defaultRegion.camera));
    const divisionInTheater = divisions.find((division) => {
      const territory = territories.find((item) => item.id === division.territoryId);
      return (territory?.theater ?? 'europe') === theater;
    });
    const focusTerritory = divisionInTheater
      ? territories.find((territory) => territory.id === divisionInTheater.territoryId)
      : territories.find((territory) => (territory.theater ?? 'europe') === theater && territory.controller === playerFaction)
        ?? territories.find((territory) => (territory.theater ?? 'europe') === theater);
    if (focusTerritory) setSelectedTerritoryId(focusTerritory.id);
    setMapSelectionOpen(Boolean(focusTerritory));
    if (divisionInTheater) setSelectedDivisionId(divisionInTheater.id);
  };

  const meetStaff = (staffId: string, topic: StaffMeetingTopic) => {
    const member = staff.find((item) => item.id === staffId);
    if (member && !staffAuthority.managedDepartments.includes(member.department)) {
      notify(`${getStaffSeatTitle(member.department, campaignPhase, playerNation.status)}은(는) 현재 직함의 면담·평가 권한 밖입니다.`);
      return;
    }
    if (!member) return;
    const option = getStaffMeetingOption(topic);
    if (member.lastMeetingWeek === game.week) {
      notify(`${member.name}과(와)는 이번 주에 이미 면담했습니다.`);
      return;
    }
    if (game.politicalPower < option.cost) {
      notify(`${option.label}에는 정치력 ${option.cost}가 필요합니다.`);
      return;
    }
    const result = resolveStaffMeeting(member, topic, game.week, member.id === developmentFocusId);
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - option.cost }));
    setStaff((current) => current.map((item) => item.id === staffId ? result.member : item));
    addEvent(result.title, result.summary, result.tone, game.week);
    notify(result.success ? `${member.name}과(와)의 ${option.label} 면담이 성과를 냈습니다.` : `${member.name}이(가) 요구를 받아들이지 않았습니다.`);
  };

  const toggleStaffDelegation = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member) return;
    if (!staffAuthority.managedDepartments.includes(member.department)) {
      notify(`${getStaffSeatTitle(member.department, campaignPhase, playerNation.status)}의 책임 배분은 상급기관이 결정합니다.`);
      return;
    }
    const managedDelegatedCount = staff.filter((item) => item.delegated && staffAuthority.managedDepartments.includes(item.department)).length;
    if (!member.delegated && managedDelegatedCount >= staffAuthority.maxDelegations) {
      notify(`${staffAuthority.label}의 책임 위임 한도 ${staffAuthority.maxDelegations}개에 도달했습니다.`);
      return;
    }
    setStaff((current) => current.map((item) => item.id === staffId ? { ...item, delegated: !item.delegated } : item));
    notify(getStaffSeatTitle(member.department, campaignPhase, playerNation.status) + (member.delegated ? ' 책임을 직접 결재로 회수했습니다.' : ` 주간 책임을 ${member.name}에게 위임했습니다.`));
  };

  const changeDevelopmentFocus = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member) return;
    if (!staffAuthority.managedDepartments.includes(member.department)) {
      notify(`${member.name}의 육성은 현재 지휘계통 밖의 인사권입니다.`);
      return;
    }
    setDevelopmentFocusId((current) => current === staffId ? null : staffId);
    notify(developmentFocusId === staffId ? '집중 육성 지정을 해제했습니다.' : member.name + '을(를) 집중 육성합니다.');
  };

  const upgradeStaff = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member || member.development < 100 || member.grade >= 3) return;
    if (!staffAuthority.managedDepartments.includes(member.department)) {
      notify(`${member.name}의 승급은 현재 지휘계통 밖의 인사권입니다.`);
      return;
    }
    if (game.politicalPower < 8 || game.treasury < 50) {
      notify(`승급에는 정치력 8과 재정 ${formatGameMoney(50)}가 필요합니다.`);
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

  const assignStaffToDepartment = (staffId: string, department: StaffDepartment) => {
    const member = staff.find((item) => item.id === staffId);
    const targetMember = staff.find((item) => item.department === department);
    if (!member || !targetMember || member.department === department) return;
    if (!staffAuthority.managedDepartments.includes(member.department) || !staffAuthority.managedDepartments.includes(department)) {
      notify('현재 직함은 선택한 두 보직을 모두 임명할 권한이 없습니다. 잠긴 보직은 상급기관이 관리합니다.');
      return;
    }
    const sourceTitle = getStaffSeatTitle(member.department, campaignPhase, playerNation.status);
    const targetTitle = getStaffSeatTitle(department, campaignPhase, playerNation.status);
    const suitability = calculateStaffSuitability(member, department);
    setStaff((current) => reassignStaff(current, staffId, department));
    if (developmentFocusId === member.id || developmentFocusId === targetMember.id) setDevelopmentFocusId(null);
    addEvent(
      `참모 보직 교체 — ${member.name}`,
      `${member.name}을(를) ${sourceTitle}에서 ${targetTitle}(으)로 배치하고 ${targetMember.name}을(를) 반대 보직으로 이동했습니다. 두 보직의 기존 위임은 안전하게 회수됐습니다.`,
      suitability.score >= 68 ? 'good' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: `${member.name}을(를) ${targetTitle}에 배치했습니다.`,
        trigger: `${targetTitle}의 현재 보직 적합도와 참모진 뎁스를 재검토했습니다.`,
        factors: suitability.reasons,
        effects: [{ label: '보직 적합도', value: `${suitability.score} · ${suitability.label}`, tone: suitability.score >= 68 ? 'positive' : 'neutral' }, { label: '책임 위임', value: '두 보직 모두 직접 결재로 전환', tone: 'neutral' }],
        ongoing: ['새 부서 기준으로 참모 보너스와 주간 업무가 계산됩니다.', `${targetMember.name}은(는) ${sourceTitle}에서 계속 참모진에 남습니다.`],
        nextActions: ['책임 위임 탭에서 새 배치의 결재 범위를 설정하십시오.', '참모 명단에서 충성도·업무량·육성 계획을 검토하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${member.name} → ${targetTitle} 배치 완료 · 적합도 ${suitability.score}`);
  };

  const scoutCandidate = (candidateId: string) => {
    const candidate = staffCandidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === 'signed' || candidate.status === 'lost') return;
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
    completeOnboardingMilestone('intelligence-action');
    addEvent('인재 조사 — ' + candidate.name, candidate.role + ' 후보에 대한 경력·평판·충성도 검증을 시작했습니다.', 'neutral', game.week);
    notify(candidate.name + ' 정밀 조사를 시작했습니다.');
  };

  const toggleCandidateShortlist = (candidateId: string) => {
    const candidate = staffCandidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === 'signed' || candidate.status === 'lost' || candidate.knowledge < 35) return;
    setStaffCandidates((current) => current.map((item) => item.id === candidateId ? {
      ...item,
      status: item.status === 'shortlisted' ? 'unscouted' : 'shortlisted',
    } : item));
    completeOnboardingMilestone('intelligence-action');
    notify(candidate.name + (candidate.status === 'shortlisted' ? '을(를) 관심 명단에서 제외했습니다.' : '을(를) 최종 관심 명단에 올렸습니다.'));
  };

  const approachCandidate = (candidateId: string) => {
    const candidate = staffCandidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === 'signed' || candidate.status === 'lost' || candidate.knowledge < 30) return;
    if (candidate.lastApproachWeek === game.week) {
      notify('같은 인물에게는 한 주에 한 번만 비밀 접촉할 수 있습니다.');
      return;
    }
    if (game.politicalPower < 4 || game.intelNetwork < 25) {
      notify('비밀 접촉에는 정치력 4와 정보망 25 이상이 필요합니다.');
      return;
    }
    const networkBonus = careerRole.branch === 'intelligence' ? 5 : game.intelNetwork >= 70 ? 3 : 0;
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 4 }));
    setStaffCandidates((current) => current.map((item) => item.id === candidateId ? {
      ...item,
      relationship: Math.min(100, item.relationship + 14 + networkBonus),
      interest: Math.min(100, item.interest + 6),
      rivalInterest: Math.max(0, item.rivalInterest - 8),
      knowledge: Math.min(100, item.knowledge + 6),
      lastApproachWeek: game.week,
    } : item));
    addEvent('비밀 접촉 — ' + candidate.name, candidate.affiliation + ' 내부의 중개선을 통해 권한·노선·안전 보장을 탐색했습니다.', 'neutral', game.week);
    notify(candidate.name + '과(와)의 관계가 깊어지고 경쟁 기관의 우선권이 낮아졌습니다.');
  };

  const recruitCandidate = (candidateId: string, offer: RecruitmentOffer) => {
    const candidate = staffCandidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === 'signed' || candidate.status === 'lost' || candidate.knowledge < 55) return;
    if (!staffAuthority.managedDepartments.includes(candidate.department)) {
      notify(`${getStaffSeatTitle(candidate.department, campaignPhase, playerNation.status)} 임명은 현재 직함의 인사권 밖입니다. 후보 조사는 계속할 수 있지만 정식 제안은 상급기관 권한입니다.`);
      return;
    }
    const assessment = assessRecruitmentOffer(candidate, career.reputation, offer);
    if (game.treasury < assessment.signingCost || game.politicalPower < 6) {
      notify(`영입에는 정치력 6과 계약금 ${formatGameMoney(assessment.signingCost)}가 필요합니다.`);
      return;
    }
    const persuasion = assessment.score;
    const success = isRecruitmentOfferSuccess(candidate, career.reputation, offer);
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - (success ? 6 : 3), treasury: success ? current.treasury - assessment.signingCost : current.treasury }));
    if (!success) {
      setStaffCandidates((current) => current.map((item) => item.id === candidateId ? {
        ...item,
        interest: Math.min(100, item.interest + 7),
        relationship: Math.min(100, item.relationship + 4),
        rivalInterest: Math.min(100, item.rivalInterest + 6),
        signingCost: item.signingCost + 12,
      } : item));
      addEvent(
        '영입 협상 결렬 — ' + candidate.name,
        `후보가 ${offer.termWeeks / 52}년 임기·${offer.authority === 'autonomous' ? '독립 권한' : offer.authority === 'executive' ? '집행 권한' : '자문 권한'} 조건에 확신하지 못했습니다. 재협상 가능하지만 요구 계약금이 올랐습니다.`,
        'bad',
        game.week,
        {
          domain: 'management',
          decision: `${candidate.name}에게 조건부 임명 제안을 보냈습니다.`,
          trigger: `${candidate.role} 보직의 외부 영입 협상을 시작했습니다.`,
          factors: assessment.factors.map((factor) => `${factor.label} ${factor.points > 0 ? '+' : ''}${factor.points}`),
          effects: [{ label: '협상 결과', value: `설득 ${assessment.score}/${assessment.threshold} · 결렬`, tone: 'negative' }, { label: '다음 요구 계약금', value: formatGameMoney(candidate.signingCost + 12), tone: 'negative' }],
          ongoing: ['관계와 관심도는 일부 남지만 경쟁 기관의 압력이 높아집니다.', '조건을 개선하거나 비밀 접촉으로 관계를 쌓아 재협상할 수 있습니다.'],
          nextActions: ['인재 시장에서 권한·임기·보수를 조정해 다시 제안하십시오.', '한 주를 진행하기 전에 경쟁 제안 수치를 확인하십시오.'],
          certainty: 'confirmed',
        },
      );
      notify('협상이 결렬됐습니다. 설득 점수 ' + persuasion + '/72 · 관계는 남았지만 경쟁과 요구 조건이 높아졌습니다.');
      return;
    }
    const incumbent = staff.find((member) => member.department === candidate.department);
    setStaff((current) => current.map((member) => member.department === candidate.department ? {
      ...member,
      personId: candidate.personId,
      name: candidate.name,
      role: candidate.role,
      candidateName: incumbent?.name ?? member.candidateName,
      historicalOffice: candidate.historicalOffice,
      affiliation: candidate.affiliation,
      summary: candidate.summary,
      ability: candidate.ability,
      potential: candidate.potential,
      loyalty: candidate.loyalty,
      workload: 18,
      weeklyCost: assessment.weeklyCost,
      specialty: candidate.specialty,
      influence: candidate.influence,
      delegated: false,
      grade: 1,
      development: 0,
      morale: Math.min(100, 68 + (offer.salaryMultiplier > 1 ? 5 : offer.salaryMultiplier < 1 ? -5 : 0) + (offer.promise !== 'none' ? 4 : 0)),
      roleSatisfaction: Math.min(100, offer.authority === 'autonomous' ? 84 : offer.authority === 'executive' ? 74 : 62),
      contractWeeksRemaining: offer.termWeeks,
      contractTermWeeks: offer.termWeeks,
      joinedWeek: game.week,
      promisedDepartment: candidate.department,
      squadStatus: offer.authority === 'autonomous' ? 'key' : offer.authority === 'executive' ? 'regular' : 'rotation',
      appointmentAuthority: offer.authority,
      appointmentPromise: offer.promise,
      discipline: candidate.discipline,
      birthYear: candidate.birthYear,
      nationality: candidate.nationality,
      wartimeLocation: candidate.wartimeLocation,
      historicalConstraint: candidate.historicalConstraint,
      expertise: candidate.expertise,
      networks: candidate.networks,
      friction: candidate.friction,
      appointmentEffect: candidate.appointmentEffect,
      sourceLabel: candidate.sourceLabel,
      sourceUrl: candidate.sourceUrl,
    } : member));
    setStaffCandidates((current) => current.map((item) => {
      if (item.id !== candidateId) return item;
      if (!incumbent) return { ...item, status: 'signed' };
      return {
        id: playerNation.id + '-candidate-displaced-' + incumbent.personId + '-' + game.week,
        personId: incumbent.personId,
        name: incumbent.name,
        role: '전임 ' + incumbent.role,
        historicalOffice: incumbent.historicalOffice,
        affiliation: incumbent.affiliation,
        summary: incumbent.summary,
        department: incumbent.department,
        ability: incumbent.ability,
        potential: incumbent.potential,
        loyalty: incumbent.loyalty,
        weeklyCost: incumbent.weeklyCost,
        signingCost: 42 + incumbent.ability + Math.round(incumbent.influence * 0.4),
        interest: Math.max(12, Math.round(58 - incumbent.loyalty * 0.35)),
        knowledge: 100,
        status: 'unscouted',
        specialty: incumbent.specialty,
        influence: incumbent.influence,
        relationship: 3,
        rivalInterest: 18,
        availability: 'displaced',
        lastApproachWeek: null,
        discipline: incumbent.discipline,
        birthYear: incumbent.birthYear,
        nationality: incumbent.nationality,
        wartimeLocation: incumbent.wartimeLocation,
        historicalConstraint: incumbent.historicalConstraint,
        expertise: incumbent.expertise,
        networks: incumbent.networks,
        friction: incumbent.friction,
        appointmentEffect: incumbent.appointmentEffect,
        sourceLabel: incumbent.sourceLabel,
        sourceUrl: incumbent.sourceUrl,
      };
    }));
    addEvent(
      '신임 참모 영입 — ' + candidate.name,
      `${incumbent?.name ?? '전임자'}을(를) 대신해 ${candidate.role} 직무를 맡습니다. ${offer.termWeeks / 52}년 임기, 주급 ${formatGameMoney(assessment.weeklyCost)}, 계약금 ${formatGameMoney(assessment.signingCost)} 조건입니다.`,
      'good',
      game.week,
      {
        domain: 'management',
        decision: `${candidate.name}을(를) ${candidate.role}(으)로 임명했습니다.`,
        trigger: `${getStaffSeatTitle(candidate.department, campaignPhase, playerNation.status)} 뎁스와 외부 후보를 비교해 정식 협상을 진행했습니다.`,
        factors: assessment.factors.map((factor) => `${factor.label} ${factor.points > 0 ? '+' : ''}${factor.points}`),
        effects: [{ label: '설득 결과', value: `${assessment.score}/${assessment.threshold} · 합의`, tone: 'positive' }, { label: '계약', value: `${offer.termWeeks}주 · 주급 ${formatGameMoney(assessment.weeklyCost)}`, tone: 'neutral' }, { label: '계약금', value: formatGameMoney(-assessment.signingCost, { signed: true }), tone: 'negative' }],
        ongoing: [`약속한 보직은 ${getStaffSeatTitle(candidate.department, campaignPhase, playerNation.status)}입니다. 다른 부서로 옮기면 역할 만족도가 하락합니다.`, offer.promise === 'none' ? '추가 보직 약속은 없습니다.' : '협상에서 한 약속은 계약 기간 동안 사기와 충성도 계산에 남습니다.'],
        nextActions: ['분위기·계약 탭에서 새 참모의 사기와 역할 만족도를 확인하십시오.', '책임 위임 탭에서 합의한 권한 수준에 맞게 실무를 배분하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${candidate.name} 영입 타결 · ${offer.termWeeks / 52}년 · 주급 ${formatGameMoney(assessment.weeklyCost)}`);
  };

  const renewStaffContract = (staffId: string) => {
    const member = staff.find((item) => item.id === staffId);
    if (!member || !staffAuthority.managedDepartments.includes(member.department)) return;
    const renewalCost = getStaffRenewalCost(member);
    if (game.politicalPower < 4 || game.treasury < renewalCost) {
      notify(`재계약에는 정치력 4와 갱신 보너스 ${formatGameMoney(renewalCost)}가 필요합니다.`);
      return;
    }
    const nextWeeklyCost = Math.ceil(member.weeklyCost * 1.08);
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 4, treasury: current.treasury - renewalCost }));
    setStaff((current) => current.map((item) => item.id === staffId ? {
      ...item,
      contractWeeksRemaining: Math.max(getStaffContractWeeks(item), 0) + 104,
      contractTermWeeks: 104,
      weeklyCost: nextWeeklyCost,
      morale: Math.min(100, (item.morale ?? 65) + 10),
      roleSatisfaction: Math.min(100, (item.roleSatisfaction ?? 65) + 6),
      loyalty: Math.min(100, item.loyalty + 5),
    } : item));
    addEvent(
      `참모 재계약 — ${member.name}`,
      `${getStaffSeatTitle(member.department, campaignPhase, playerNation.status)}의 임기를 104주 연장했습니다. 갱신 보너스 ${formatGameMoney(renewalCost)}, 새 주급 ${formatGameMoney(nextWeeklyCost)}입니다.`,
      'good',
      game.week,
      {
        domain: 'management',
        decision: `${member.name}과(와) 2년 재계약을 체결했습니다.`,
        trigger: `남은 계약 ${getStaffContractWeeks(member)}주로 승계 또는 재계약 판단이 필요했습니다.`,
        factors: [`현재 능력 ${member.ability}`, `영향력 ${member.influence}`, `충성도 ${member.loyalty}`, `기존 주급 ${formatGameMoney(member.weeklyCost)}`],
        effects: [{ label: '계약 기간', value: '+104주', tone: 'positive' }, { label: '사기', value: '+10', tone: 'positive' }, { label: '주급', value: formatGameMoney(nextWeeklyCost), tone: 'neutral' }],
        ongoing: ['계약 안정은 조직 분위기와 지도부 수용도를 지지합니다.', '보직 약속과 업무 과부하는 재계약 뒤에도 계속 관리해야 합니다.'],
        nextActions: ['책임 위임과 업무량을 다시 검토하십시오.', '후임 후보는 비상 승계선으로 관심 명단에 유지할 수 있습니다.'],
        certainty: 'confirmed',
      },
    );
    notify(`${member.name} 재계약 완료 · 104주 연장`);
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
    const isSwitch = Boolean(existing);
    const switchDecisionId = `policy-shift:${policy.domain}:${policy.id}`;
    const transitionCost = 12;
    if (isSwitch && completedDecisions.includes(switchDecisionId)) {
      notify('이미 시행했다가 폐기한 원칙은 같은 캠페인에서 다시 채택할 수 없습니다.');
      return;
    }
    if (isSwitch && game.politicalPower < transitionCost) {
      notify(`국가 원칙 전환에는 정치력 ${transitionCost}가 필요합니다.`);
      return;
    }
    const appliedDelta = isSwitch
      ? Object.fromEntries(Object.entries(policy.gameDelta).map(([key, value]) => [key, Math.round(Number(value) * .35)])) as Partial<Record<keyof GameState, number>>
      : policy.gameDelta;
    setSelectedPolicies((current) => [
      ...current.filter((selectedId) => strategicPolicies.find((item) => item.id === selectedId)?.domain !== policy.domain),
      policy.id,
    ]);
    setGame((current) => applyGameDelta({ ...current, politicalPower: current.politicalPower - (isSwitch ? transitionCost : 0) }, appliedDelta));
    completeOnboardingMilestone('political-action');
    if (isSwitch) setCompletedDecisions((current) => Array.from(new Set([...current, switchDecisionId])));
    if (policy.domain === 'diplomacy') {
      setRelations((current) => current.map((relation) => {
        const delta = policy.id === 'diplomacy-aid' ? 6 : policy.id === 'diplomacy-pragmatic' ? 3 : relation.status.includes('공동') || relation.status.includes('동맹') ? 5 : -3;
        return { ...relation, value: Math.max(0, Math.min(100, relation.value + delta)) };
      }));
    }
    addEvent(
      `${isSwitch ? '국가 원칙 전환' : '국가 원칙 채택'} — ${policy.title}`,
      `${existing ? `${existing.title}에서 전환했습니다. ` : ''}${policy.description} ${isSwitch ? '전환기에는 즉시 효과의 35%만 적용됩니다.' : policy.effect}`,
      isSwitch ? 'neutral' : 'good',
      game.week,
      {
        domain: 'management',
        decision: `${policy.domain} 영역의 운영 원칙을 ‘${policy.title}’(으)로 ${isSwitch ? '전환' : '채택'}했습니다.`,
        trigger: existing ? `${existing.title} 노선을 유지하지 않고 정치력 ${transitionCost}를 사용해 제도를 바꿨습니다.` : '해당 영역에 장기 운영 원칙이 없었습니다.',
        factors: [policy.description, existing ? `이전 원칙: ${existing.title}` : '최초 원칙 채택', `현재 주차: ${game.week + 1}주`],
        effects: Object.entries(appliedDelta).map(([key, value]) => ({ label: key, value: `${Number(value) >= 0 ? '+' : ''}${value}`, tone: Number(value) >= 0 ? 'positive' : 'negative' })),
        ongoing: ['이 원칙은 매주 전투·생산·보급 보정과 살아있는 역사 흐름의 원인으로 유지됩니다.', existing ? `${existing.title}의 과거 효과는 역사 기록에 남지만 현재 가중치는 새 원칙으로 바뀝니다.` : '다른 원칙으로 전환할 수 있지만 정치 비용과 전환 충격이 발생합니다.'],
        nextActions: ['지휘 본부의 역사 흐름에서 어느 압력이 상승했는지 확인하십시오.', '새 원칙과 맞는 연구·예산·외교·작전을 이어가면 장기 사건의 가능성이 더 크게 바뀝니다.'],
        certainty: 'confirmed',
      },
    );
    notify(`${policy.title} 원칙이 현재 행동 궤적에 적용됩니다.${isSwitch ? ` 정치력 ${transitionCost}를 사용했습니다.` : ''}`);
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

  const resolveWorldFlashpointChoice = (variantId: string) => {
    if (!pendingWorldFlashpoint) return;
    const { event } = pendingWorldFlashpoint.entry;
    const variant = event.variants.find((item) => item.id === variantId);
    if (!variant) return;
    const effects = deriveWorldFlashpointEffects(event.id, event.category, variant);
    setGame((current) => applyGameDelta(current, effects.gameDelta));
    setStockpile((current) => {
      const next = { ...current };
      (Object.entries(effects.stockpileDelta) as [keyof Stockpile, number][]).forEach(([key, delta]) => {
        next[key] = Math.max(0, next[key] + delta);
      });
      return next;
    });
    if (effects.relationChange) {
      setRelations((current) => current.map((relation) => ({
        ...relation,
        value: Math.max(0, Math.min(100, relation.value + effects.relationChange)),
      })));
    }
    setWorldHistoryState((current) => ({ ...current, choices: { ...current.choices, [event.id]: variant.id } }));
    setCompletedDecisions((current) => Array.from(new Set([
      ...current,
      getWorldFlashpointDecisionId(event.id, variant.id, game.week),
    ])));
    setPendingWorldFlashpointId(null);
    addEvent(
      `세계선 분기 — ${event.title}`,
      `${variant.title}: ${variant.consequence}`,
      effects.tone,
      game.week,
      {
        domain: 'history',
        decision: `${event.title}에서 ‘${variant.title}’ 대응을 채택했습니다.`,
        trigger: event.historicalBasis,
        factors: [`캠페인 연도 ${pendingWorldFlashpoint.campaignYear}`, `역사 기준 ${event.historicalYear}`, `현재 행위자 ${pendingWorldFlashpoint.entry.actor}`],
        effects: effects.summary.map((effect) => ({ label: '즉시 영향', value: effect, tone: effects.tone === 'bad' ? 'negative' : effects.tone === 'good' ? 'positive' : 'neutral' })),
        ongoing: [variant.consequence, '이 선택은 대체지구 아틀라스의 확정 분기로 저장되며 후속 세계 사건의 행위자·시점·결말에 반영됩니다.'],
        nextActions: [effects.tone === 'bad' ? '세계 주보와 국고·연료·수송선 변화를 확인하고 손실 복구 예산을 편성하십시오.' : '세계 주보에서 새 외교·경제 기회를 확인하고 장기 정책에 연결하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${variant.title}: 즉시 효과가 적용됐고 세계선 분기가 저장됐습니다.`);
  };

  const preventCoup = (actionId: CoupPreventionId) => {
    const result = applyCoupPrevention(politicalCrisis, politicalCrisisContext, careerRole, actionId);
    if (!result) {
      notify('이 보직에는 해당 조치의 권한이 없거나, 자원이 부족하거나, 이번 주 예방조치를 이미 사용했습니다.');
      return;
    }
    setPoliticalCrisis(result.state);
    setGame((current) => applyGameDelta(current, result.gameDelta));
    addEvent(
      '쿠데타 예방조치 — ' + result.state.lastOutcome,
      result.detail,
      'neutral',
      game.week,
      {
        domain: 'management',
        decision: result.state.lastOutcome ?? '국내 정치위기 예방조치',
        trigger: `조치 전 쿠데타 위험 ${getCoupRiskLabel(coupRisk.tier)} ${coupRisk.score} · 주간 ${coupRisk.weeklyChance.toFixed(1)}%`,
        factors: coupRisk.triggers.slice(0, 4).map((item) => `${item.label}: ${item.detail}`),
        effects: Object.entries(result.gameDelta).map(([key, value]) => ({ label: key, value: `${Number(value) >= 0 ? '+' : ''}${value}`, tone: Number(value) >= 0 ? 'positive' : 'negative' })),
        ongoing: ['권력집단 불만·조직력·관계 변화는 다음 주 위험 계산과 쿠데타 성공 확률에 계속 반영됩니다.'],
        nextActions: ['상황실을 다시 확인해 위험 점수와 최대 위험집단이 어떻게 바뀌었는지 비교하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(result.detail);
  };

  const respondToCoup = (responseId: CoupResponseId) => {
    if (!pendingCoupIncident) return;
    const result = resolveCoupAttempt(politicalCrisis, pendingCoupIncident, careerRole, politicalCrisisContext, responseId);
    if (!result) {
      notify('이 대응을 명령할 보직 권한 또는 자원이 부족합니다.');
      return;
    }
    setPoliticalCrisis(result.state);
    setGame((current) => applyGameDelta(current, result.gameDelta));
    setCareer((current) => ({
      ...current,
      reputation: Math.max(0, Math.min(100, current.reputation + result.careerDelta.reputation)),
      councilTrust: Math.max(0, Math.min(100, current.councilTrust + result.careerDelta.councilTrust)),
      legacy: Math.max(0, current.legacy + result.careerDelta.legacy),
    }));
    setNationManagement((current) => ({
      ...current,
      unrest: Math.max(0, Math.min(100, current.unrest + result.nationDelta.unrest)),
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.nationDelta.legitimacy)),
      mandateScore: Math.max(0, Math.min(100, current.mandateScore + result.nationDelta.mandateScore)),
    }));
    setPendingCoupIncident(null);
    setShowPoliticalCrisis(true);
    addEvent(
      result.title,
      result.detail,
      result.outcome === 'prevented' ? 'good' : result.outcome === 'successful' ? 'bad' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: `쿠데타 대응 명령: ${responseId}`,
        trigger: `${pendingCoupIncident.title} · 위험 ${pendingCoupIncident.riskScore} · 사전 적발 ${pendingCoupIncident.detected ? '성공' : '실패'}`,
        factors: coupRisk.triggers.slice(0, 5).map((item) => `${item.label}: ${item.detail}`),
        effects: [
          { label: '정치적 결말', value: result.title, tone: result.outcome === 'prevented' ? 'positive' : result.outcome === 'successful' ? 'negative' : 'neutral' },
          { label: '새 정부', value: result.state.governmentName, tone: result.outcome === 'successful' ? 'negative' : 'neutral' },
          ...Object.entries(result.gameDelta).map(([key, value]) => ({ label: key, value: `${Number(value) >= 0 ? '+' : ''}${value}`, tone: Number(value) >= 0 ? 'positive' as const : 'negative' as const })),
        ],
        ongoing: [result.outcome === 'successful' ? '캠페인은 종료되지 않습니다. 새 정권 아래에서 참모·파벌 관계와 사용자의 영향력을 다시 구축해야 합니다.' : '잔존 파벌의 불만과 조직력은 사라지지 않으며, 조건이 다시 악화되면 후속 쿠데타가 발생할 수 있습니다.'],
        nextActions: ['국내 정치위기 상황실에서 새 정부, 파벌 세력, 집단 간 관계와 재발 위험을 확인하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(result.detail);
  };

  const navigateFromActionCenter = (action: UXAction) => {
    setUXActionLifecycle((current) => startUXAction(current, action.id, game.week));
    if (action.id === 'political-crisis') {
      setSpeed(0);
      setTrackedActionId(null);
      setTrackedActionSnapshot(null);
      setCompletedTrackedAction(null);
      setShowPoliticalCrisis(true);
      setShowActionCenter(false);
      return;
    }
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
    setCompletedTrackedAction(null);
    setTrackedActionSnapshot(action);
    setTrackedActionId(action.id);
    deckScrollPositionsRef.current[action.tab] = 0;
    setActiveTab(action.tab);
    setShowActionCenter(false);
  };

  const acknowledgeActionCenter = useCallback((actionIds: string[]) => {
    setUXActionLifecycle((current) => acknowledgeUXActions(current, actionIds, game.week));
  }, [game.week]);

  const navigateFromStatusOverview = (action: UXAction) => {
    setShowStatusOverview(false);
    navigateFromActionCenter(action);
  };

  const toggleUXPreference = (key: keyof UXPreferences) => {
    setUXPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const openWorldHistory = () => {
    setSpeed(0);
    setShowWorldHistory(true);
  };

  const openWorldWeekly = useCallback(() => {
    if (!latestWorldWeeklyIssue) {
      notify('캠페인을 시작하면 선택한 세계선의 1942년 10월 창간호가 즉시 발행됩니다.');
      return;
    }
    setSpeed(0);
    setLastReadWorldWeeklyId(latestWorldWeeklyIssue.id);
    setShowWorldWeekly(true);
  }, [latestWorldWeeklyIssue, notify]);

  const openWarJournal = useCallback(() => {
    setSpeed(0);
    setLastReviewedJournalWeek(game.week);
    setShowJournal(true);
  }, [game.week]);

  const acknowledgeWeeklyBriefing = useCallback(() => {
    setSpeed(0);
    setLastReviewedJournalWeek(game.week);
    if (latestWorldWeeklyIssue) setLastReadWorldWeeklyId(latestWorldWeeklyIssue.id);
    notify(`제 ${game.week + 1}주 통합 브리핑을 확인했습니다.`);
  }, [game.week, latestWorldWeeklyIssue, notify]);

  const continueWeeklyFlow = useCallback(() => {
    setSpeed(0);
    if (campaignPhase === 'nation' || globalWeeklyCycle.primaryDestination === 'advance') {
      advanceWeek();
      return;
    }
    if (globalWeeklyCycle.primaryDestination === 'briefing') {
      acknowledgeWeeklyBriefing();
      return;
    }
    setShowActionCenter(true);
  }, [acknowledgeWeeklyBriefing, advanceWeek, campaignPhase, globalWeeklyCycle.primaryDestination]);

  const globalNextLabel = campaignPhase === 'nation'
    ? '다음 주'
    : globalWeeklyCycle.primaryDestination === 'briefing'
      ? '브리핑'
      : globalWeeklyCycle.primaryDestination === 'journal'
        ? '결산'
        : globalWeeklyCycle.primaryDestination === 'weekly'
          ? '주보'
        : globalWeeklyCycle.primaryDestination === 'actions'
          ? '결재'
          : '다음 주';
  const globalNextAriaLabel = campaignPhase === 'nation' ? '다음 주 진행' : globalWeeklyCycle.primaryLabel;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!showBriefing && !campaignOutcome && !pendingWorldFlashpointId && !pendingCoupIncident && !pendingCouncilEventId && !pendingBattleReportId && !pendingOffensivePlan && !pendingAchievementId && !showJournal && !showSettings && !showActionCenter && !showStatusOverview && !showResetConfirmation && !showFieldManual && !showCommandPalette && !showAchievementGallery && !showWorldHistory && !showWorldWeekly && !showTutorial && !showPoliticalCrisis) {
          setShowSaveCenter((current) => !current);
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (!showBriefing && !campaignOutcome && !pendingWorldFlashpointId && !pendingCoupIncident && !pendingCouncilEventId && !pendingBattleReportId && !pendingOffensivePlan && !pendingAchievementId && !showJournal && !showSettings && !showActionCenter && !showStatusOverview && !showResetConfirmation && !showFieldManual && !showSaveCenter && !showAchievementGallery && !showWorldHistory && !showWorldWeekly && !showTutorial && !showPoliticalCrisis) {
          event.preventDefault();
          setShowCommandPalette((current) => !current);
        }
        return;
      }
      if (event.key === 'Escape') {
        setShowActionCenter(false);
        setShowStatusOverview(false);
        setShowSettings(false);
        setShowResetConfirmation(false);
        setShowCommandPalette(false);
        setShowFieldManual(false);
        setShowTutorial(false);
        setShowSaveCenter(false);
        setShowAchievementGallery(false);
        setShowWorldHistory(false);
        setShowWorldWeekly(false);
        if (!pendingCoupIncident) setShowPoliticalCrisis(false);
        setPendingAchievementId(null);
        setShowJournal(false);
        setPlanningMode(false);
        setPendingOffensivePlan(null);
        setMapFiltersOpen(false);
        setMapLegendOpen(false);
        setMapFocusMode(false);
        if (window.matchMedia('(max-width: 900px)').matches) setNavigationCollapsed(true);
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (target?.isContentEditable || tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (showBriefing || campaignOutcome || pendingWorldFlashpointId || pendingCoupIncident || pendingCouncilEventId || pendingBattleReportId || pendingOffensivePlan || pendingAchievementId || showJournal || showSettings || showActionCenter || showStatusOverview || showResetConfirmation || showCommandPalette || showFieldManual || showSaveCenter || showAchievementGallery || showWorldHistory || showWorldWeekly || showTutorial || showPoliticalCrisis || event.repeat) return;
      if (activeTab === 'map' && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        zoomMap(0.2);
      } else if (activeTab === 'map' && event.key === '-') {
        event.preventDefault();
        zoomMap(-0.2);
      } else if (activeTab === 'map' && event.key === '0') {
        event.preventDefault();
        resetMapCamera();
      } else if (activeTab === 'map' && ['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        const layers: MapLayer[] = ['political', 'supply', 'weather', 'intelligence'];
        setMapLayer(layers[Number(event.key) - 1]);
      } else if (activeTab === 'map' && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleMapFocusMode();
      } else if (activeTab === 'map' && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setMapIntelOpen((current) => !current);
      } else if (activeTab === 'map' && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        setMapLabelMode((current) => current === 'essential' ? 'operational' : current === 'operational' ? 'all' : 'essential');
      } else if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        setShowActionCenter(true);
      } else if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setShowStatusOverview(true);
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        setShowSettings(true);
      } else if (event.key === '?') {
        event.preventDefault();
        setShowFieldManual(true);
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        continueWeeklyFlow();
      } else if (event.key === ' ') {
        if (tag === 'button') return;
        event.preventDefault();
        setSpeed((current) => current === 0 ? 1 : 0);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [activeTab, advanceWeek, campaignOutcome, continueWeeklyFlow, pendingAchievementId, pendingBattleReportId, pendingCouncilEventId, pendingCoupIncident, pendingOffensivePlan, pendingWorldFlashpointId, resetMapCamera, showActionCenter, showAchievementGallery, showBriefing, showCommandPalette, showFieldManual, showJournal, showPoliticalCrisis, showResetConfirmation, showSaveCenter, showSettings, showStatusOverview, showTutorial, showWorldHistory, showWorldWeekly, toggleMapFocusMode, zoomMap]);

  const changePublicHealthPolicy = (policyId: PublicHealthPolicyId) => {
    setPublicHealth((current) => ({ ...current, policyId }));
    notify('국가 보건 대응 태세를 갱신했습니다. 다음 주 역학 계산부터 반영됩니다.');
  };

  const fundPublicHealthInvestment = (investmentId: PublicHealthInvestmentId) => {
    const investment = getPublicHealthInvestment(investmentId);
    if (!canFundPublicHealthInvestment(publicHealth, investmentId, game)) {
      notify('사업 승인 조건이나 자원이 부족합니다. 비용과 병원체 지식 조건을 확인하십시오.');
      return;
    }
    setPublicHealth((current) => applyPublicHealthInvestment(current, investmentId));
    setGame((current) => applyGameDelta(current, {
      treasury: -investment.treasuryCost,
      politicalPower: -(investment.politicalPowerCost ?? 0),
      steel: -(investment.steelCost ?? 0),
      manpower: -(investment.manpowerCost ?? 0),
    }));
    addEvent(`보건 역량 사업 — ${investment.name}`, `${investment.effectLabel}. 영구 국가 역량으로 적용됐습니다.`, 'good', game.week);
    notify(`${investment.name} 사업을 승인했습니다.`);
  };

  const changeTaxPolicy = (policy: TaxPolicyId) => {
    if (economy.taxPolicy === policy) return;
    if (game.politicalPower < 2) return notify('조세정책 변경에는 정치력 2가 필요합니다.');
    setEconomy((current) => ({ ...current, taxPolicy: policy }));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 2 }));
    addEvent('조세정책 변경', '새 조세정책이 다음 주 소득세·기업세와 사회 안정도 계산부터 적용됩니다.', 'neutral', game.week);
  };

  const changeBondProgram = (program: BondProgramId) => {
    if (economy.bondProgram === program) return;
    if (game.politicalPower < 2) return notify('국채 조달방식 변경에는 정치력 2가 필요합니다.');
    setEconomy((current) => ({ ...current, bondProgram: program }));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 2 }));
    addEvent('전쟁금융 조달방식 변경', '새 국채·중앙은행 조달방식이 다음 주 현금, 부채, 이자, 물가에 함께 반영됩니다.', program === 'central-bank' ? 'bad' : 'neutral', game.week);
  };

  const changePriceControl = (control: PriceControlId) => {
    if (economy.priceControl === control) return;
    if (game.politicalPower < 2) return notify('가격통제 변경에는 정치력 2가 필요합니다.');
    setEconomy((current) => ({ ...current, priceControl: control }));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 2 }));
    addEvent('가격·배급 통제 변경', '행정비용과 다음 주 인플레이션 변화가 새 통제수준으로 계산됩니다.', 'neutral', game.week);
  };

  const issueEmergencyWarBonds = () => {
    setEconomy((current) => ({
      ...current,
      debt: current.debt + 240,
      publicConfidence: Math.max(0, current.publicConfidence - 3),
    }));
    setGame((current) => ({ ...current, treasury: current.treasury + 240, stability: current.stability - 2 }));
    addEvent(`긴급 전시채권 ${formatGameMoney(240)} 발행`, `현금 ${formatGameMoney(240)}를 조달하는 동시에 같은 실질가치의 국가부채가 생겼습니다. 다음 주부터 이자비용에 반영됩니다.`, 'neutral', game.week, {
      domain: 'management',
      decision: '내각이 일회성 긴급 전시채권 발행을 승인했습니다.',
      trigger: '즉시 전비를 확보하는 대신 미래 세입으로 상환할 채무를 인수했습니다.',
      factors: [`발행액 ${formatGameMoney(240)}`, '안정도 −2%', '시장 신뢰 −3', '발행 이후 주간 이자비용 증가'],
      effects: [{ label: '가용 현금', value: formatGameMoney(240, { signed: true }), tone: 'positive' }, { label: '국가부채', value: formatGameMoney(240, { signed: true }), tone: 'negative' }],
      ongoing: ['발행액은 세입이 아니므로 경상수지를 개선하지 않습니다.', '부채 잔액이 늘어 다음 주부터 이자지출이 증가합니다.'],
      nextActions: ['전시 재무성에서 조세수입과 이자비용을 비교하고 상시 국채 조달방식을 재검토하십시오.'],
    });
  };

  const buyCompanyStake = (companyId: string, amount: number) => {
    if (game.treasury < amount) return notify(`산업지분 매입에는 재정 ${formatGameMoney(amount)}가 필요합니다.`);
    const result = buyIndustrialStake(economy, companyId, amount);
    if (!result) return notify('최소 투자액 또는 기업별 투자한도를 확인하십시오.');
    const company = historicalCompanies.find((item) => item.id === companyId);
    setEconomy(result.state);
    setGame((current) => ({ ...current, treasury: Math.max(0, current.treasury + result.treasuryDelta) }));
    addEvent(`산업지분 매입 — ${company?.name ?? companyId}`, `국가 산업계정에서 ${formatGameMoney(result.amount)}를 투입했습니다. 배당과 평가손익은 매주 재정 결산에 반영됩니다.`, 'neutral', game.week, {
      domain: 'management',
      decision: `${company?.name ?? companyId} 지분·산업채권에 ${formatGameMoney(result.amount)}를 배정했습니다.`,
      trigger: '매입 승인 즉시 현재 시장지수로 지분 단위가 확정됐습니다.',
      factors: [company?.historicalBasis ?? '역사적 산업기반', company?.riskNote ?? '산업시장 위험', `기업별 최대 투자한도 ${formatGameMoney(company?.maxInvestment ?? 0)}`],
      effects: [{ label: '현금', value: formatGameMoney(-result.amount), tone: 'negative' }, { label: '산업자산', value: `${formatGameMoney(result.amount, { signed: true })} 취득원가`, tone: 'positive' }],
      ongoing: ['기업지수 변동이 미실현 손익과 매각대금에 반영됩니다.', '배당 또는 국가성과 배분이 주간 경상세입에 포함됩니다.'],
      nextActions: ['한 기업에 집중하지 말고 부채·현금·산업분야 노출을 함께 비교하십시오.'],
    });
    notify(`${company?.name ?? companyId} 산업지분 ${formatGameMoney(result.amount)}를 매입했습니다.`);
  };

  const sellCompanyStake = (companyId: string, ratio: 0.5 | 1) => {
    const result = sellIndustrialStake(economy, companyId, ratio);
    if (!result) return;
    const company = historicalCompanies.find((item) => item.id === companyId);
    setEconomy(result.state);
    setGame((current) => ({ ...current, treasury: current.treasury + result.treasuryDelta }));
    addEvent(`산업지분 매각 — ${company?.name ?? companyId}`, `${ratio === 1 ? '전량' : '절반'}을 매각해 ${formatGameMoney(result.proceeds)}를 회수했습니다. 실현손익 ${formatGameMoney(result.realizedGain, { signed: true })}.`, result.realizedGain >= 0 ? 'good' : 'bad', game.week, {
      domain: 'management',
      decision: `${company?.name ?? companyId} 보유지분의 ${ratio === 1 ? '전량' : '50%'} 매각을 승인했습니다.`,
      trigger: '현재 시장지수에 전시 유동성 비용 2%를 차감해 체결됐습니다.',
      factors: ['현재 기업지수', '기존 평균 취득원가', '전시시장 매각비용 2%'],
      effects: [{ label: '현금회수', value: formatGameMoney(result.proceeds, { signed: true }), tone: 'positive' }, { label: '실현손익', value: formatGameMoney(result.realizedGain, { signed: true }), tone: result.realizedGain >= 0 ? 'positive' : 'negative' }],
      ongoing: [ratio === 1 ? '해당 기업의 이후 배당과 지수변동 노출이 종료됐습니다.' : '남은 절반 지분은 계속 배당과 시장위험에 노출됩니다.'],
      nextActions: ['회수한 현금을 경상적자 보전, 부채축소 또는 다른 산업분야에 배분하십시오.'],
    });
    notify(`${company?.name ?? companyId} 지분을 매각해 ${formatGameMoney(result.proceeds)}를 회수했습니다.`);
  };

  const buyCurrencyReserve = (currencyId: string, amount: number) => {
    if (game.treasury < amount) return notify(`외화 매수에는 국고 ${formatGameMoney(amount)}가 필요합니다.`);
    const result = buyForeignCurrency(economy.monetarySystem, playerNation.id, currencyId, amount, currentYear, game.week, currencyMetrics, relations);
    const currency = getCurrencyById(currencyId);
    if (!result || !currency) return notify('상대 중앙은행이 거래를 거부했거나 환전 조건이 바뀌었습니다.');
    setEconomy((current) => ({ ...current, monetarySystem: result.state }));
    setGame((current) => ({ ...current, treasury: Math.max(0, current.treasury + result.treasuryDelta) }));
    const received = `${currency.symbol}${currency.symbol.length > 1 ? ' ' : ''}${result.foreignAmount.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}M`;
    addEvent(`외환 매수 — ${currency.name}`, `${formatGameMoney(amount)}를 지급하고 ${received}을 외환보유고에 편입했습니다. 승인비용 ${(result.quote.feeRate * 100).toFixed(1)}%가 환율에 반영됐습니다.`, 'neutral', game.week);
    notify(`${currency.code} ${received} 매수 체결`);
  };

  const sellCurrencyReserve = (currencyId: string, ratio: 0.5 | 1) => {
    const result = sellForeignCurrency(economy.monetarySystem, playerNation.id, currencyId, ratio, currentYear, game.week, currencyMetrics, relations);
    const currency = getCurrencyById(currencyId);
    if (!result || !currency) return notify('매도할 외환보유고가 없습니다.');
    setEconomy((current) => ({ ...current, monetarySystem: result.state }));
    setGame((current) => ({ ...current, treasury: current.treasury + result.treasuryDelta }));
    addEvent(`외환 매도 — ${currency.name}`, `${ratio === 1 ? '전량' : '절반'}을 중앙은행 계정에 매도해 ${formatGameMoney(result.treasuryDelta, { signed: true })}를 국고로 회수했습니다.`, 'neutral', game.week);
    notify(`${currency.code} 매도 · ${formatGameMoney(result.treasuryDelta, { signed: true })} 회수`);
  };

  const createSovereignCurrency = (name: string, symbol: string, backing: CurrencyBacking) => {
    const nextSystem = issueCustomCurrency(economy.monetarySystem, playerNation.id, currentYear, name, symbol, backing, currencyMetrics);
    setEconomy((current) => ({ ...current, monetarySystem: nextSystem }));
    const created = nextSystem.customCurrency;
    if (!created) return;
    addEvent(`신 통화 발행 — ${created.name}`, `${playerNation.shortName}이(가) ${created.symbol} ${created.name}을 법정통화로 선포했습니다. 역사 자동전환은 중지되며 물가·신뢰·외환보유고가 태환조건을 결정합니다.`, 'neutral', game.week, {
      domain: 'management',
      decision: `${created.name}을 새 국가통화로 명명하고 ${backing === 'foreign-reserve' ? '외환준비금 태환' : backing === 'state-credit' ? '국가신용 관리변동' : '구매력 연속'} 원칙을 채택했습니다.`,
      trigger: '사용자가 역사적 통화연표 대신 독자적인 통화주권 경로를 선택했습니다.',
      factors: [`인플레이션 ${economy.inflation.toFixed(1)}%`, `공공신뢰 ${economy.publicConfidence.toFixed(0)}/100`, `외환보유고 가치 ${formatGameMoney(Object.entries(economy.monetarySystem.foreignReserves).reduce((sum, [id, value]) => sum + value / (getCurrencyById(id)?.unitsPerSterling ?? Number.POSITIVE_INFINITY), 0))}`],
      effects: [{ label: '법정통화', value: `${created.symbol} ${created.name}`, tone: 'neutral' }, { label: '역사 자동전환', value: '중지', tone: 'negative' }],
      ongoing: ['고물가·저신뢰 상태에서는 명목환율과 거래비용이 악화됩니다.', '상대국은 외교관계와 통화신뢰에 따라 환전을 승인하거나 거부합니다.'],
      nextActions: ['외환보유고를 확보하고 물가·공공신뢰를 안정시켜 신 통화의 태환성을 높이십시오.'],
    });
    notify(`${created.symbol} ${created.name} 통화헌장을 공포했습니다.`);
  };

  const returnToHistoricalCurrency = () => {
    const nextSystem = restoreHistoricalCurrency(economy.monetarySystem, playerNation.id, currentYear);
    const currency = getCurrencyById(nextSystem.activeCurrencyId);
    setEconomy((current) => ({ ...current, monetarySystem: nextSystem }));
    notify(`${currentYear}년 역사 기본통화 ${currency?.name ?? nextSystem.activeCurrencyId}(으)로 복귀했습니다.`);
  };

  const tabItems: { id: GameTab; label: string; description: string; navHint: string; group: string; guide: [string, string, string]; icon: GameIconName }[] = [
    { id: 'command', label: isKoreaWarCampaign ? '독립운동 상황실' : campaignPhase === 'nation' ? '국정 상황실' : '지휘 본부', navHint: isKoreaWarCampaign ? '승인·공작·광복군' : '이번 주 우선순위', group: '최고 지휘부', description: isKoreaWarCampaign ? '충칭 지휘부에서 승인 외교·국내 공작망·광복군·귀환 준비를 한 화면에 파악합니다.' : campaignPhase === 'nation' ? '국민·재정·보건·외교의 긴급 업무를 한 화면에서 파악합니다.' : '결재 업무·전황·조직·생산·연구를 한 화면에서 파악합니다.', guide: isKoreaWarCampaign ? ['네 축의 준비도 확인', '보직 권한 안에서 결재', '해방 시간선 진행'] : ['경고 확인', '권장 행동 결재', '다음 주 진행'], icon: 'command' },
    { id: 'governance', label: isKoreaWarCampaign ? '해방·건국 설계' : campaignPhase === 'nation' ? '국가 운영' : '전후 설계', navHint: isKoreaWarCampaign ? '헌정·통합·국가 전환' : campaignPhase === 'nation' ? '예산·민생·선거' : '종전과 국가 전환', group: '최고 지휘부', description: isKoreaWarCampaign ? '해방 뒤 정부 형태, 헌정 질서, 행정 인력과 무장 세력 통합 방식을 준비합니다.' : campaignPhase === 'nation' ? '예산·민생·산업·제도·국민 위임을 주간 단위로 운영합니다.' : '전쟁에서 국가 운영으로 이어질 종전 방식과 전후 초기 조건을 준비합니다.', guide: isKoreaWarCampaign ? ['귀환 준비도 확인', '헌정·통합안 비교', '해방 이후 경로 선택'] : campaignPhase === 'nation' ? ['국가 지표 확인', '예산·노선 조정', '국정 1주 진행'] : ['전환 준비도 확인', '전후 위험 비교', '종전 경로 선택'], icon: 'organization' },
    { id: 'map', label: isKoreaWarCampaign ? '한반도 작전도' : campaignPhase === 'nation' ? '세계·국경 지도' : '전황 지도', navHint: isKoreaWarCampaign ? '점령 본토·국내정진' : campaignPhase === 'nation' ? '국경과 국제 질서' : '전선과 작전 계획', group: '최고 지휘부', description: isKoreaWarCampaign ? '조선 본토의 점령 상태와 만주 연락선, 중국 거점, 국내정진 경로를 구분해 검토합니다.' : campaignPhase === 'nation' ? '종전 이후 국경·교역·안보 관계와 세계선의 변화를 검토합니다.' : '전선·보급·기상·정보를 지도에서 검토하고 공세 목표를 지정합니다.', guide: isKoreaWarCampaign ? ['한반도 지역 선택', '점령·연락망 확인', '국내정진 목표 지정'] : campaignPhase === 'nation' ? ['세계선 선택', '국경·거점 확인', '외교·안보 검토'] : ['지도층 선택', '부대·거점 확인', '공세 목표 지정'], icon: 'map' },
    { id: 'organization', label: isKoreaWarCampaign ? '독립운동 조직' : '조직 운영', navHint: isKoreaWarCampaign ? '임정·광복군·공작망' : '참모·영입·편제', group: '국가 운영', description: isKoreaWarCampaign ? '임시정부·한국광복군·국내외 공작망의 인재와 지휘선을 보직 권한에 맞춰 관리합니다.' : '참모진·영입·편제·조달·국가 원칙을 관리합니다.', guide: isKoreaWarCampaign ? ['조직별 지휘선 확인', '인재 조사·접촉', '보직과 권한 배정'] : ['조직 병목 확인', '인재 비교·영입', '보직과 권한 배정'], icon: 'organization' },
    { id: 'economy', label: isKoreaWarCampaign ? '독립운동 재정' : campaignPhase === 'nation' ? '재정·경제부' : '전시 재무성', navHint: isKoreaWarCampaign ? '기금·조달·외환' : '세금·국채·기업지분', group: '국가 운영', description: isKoreaWarCampaign ? '독립운동 기금, 중국·연합군 조달, 외환과 분산 생산망의 주간 흐름을 관리합니다.' : '주간·월간 세입과 지출, 국가부채, 물가, 역사적 산업지분을 운용합니다.', guide: isKoreaWarCampaign ? ['기금 수입·지출 확인', '조달·외환 결정', '지원망 위험 검토'] : ['경상수지와 차입 분리 확인', '조세·국채·가격통제 결정', '기업 위험과 지분 배분'], icon: 'treasury' },
    { id: 'diplomacy', label: isKoreaWarCampaign ? '독립 승인 외교' : '외교', navHint: isKoreaWarCampaign ? '중국·연합국 승인' : '관계와 전후 질서', group: '국가 운영', description: isKoreaWarCampaign ? '중국과 연합국의 지원·승인·전후 발언권을 확보하고 독립의 외교적 근거를 만듭니다.' : '국가 관계와 영향력을 관리해 전후 질서를 설계합니다.', guide: isKoreaWarCampaign ? ['승인 현황 확인', '외교 상대·의제 선택', '전후 발언권 검토'] : ['관계도 확인', '외교 의제 선택', '파급 효과 검토'], icon: 'diplomacy' },
    { id: 'intelligence', label: isKoreaWarCampaign ? '국내 공작망' : '정보국', navHint: isKoreaWarCampaign ? '침투·연락·방첩' : '첩보망·비밀 작전', group: '국가 운영', description: isKoreaWarCampaign ? '조선·만주의 연락망, 침투 거점, 선전·구출·파괴 공작과 방첩을 지휘합니다.' : '전구별 첩보망과 비밀 작전, 암호 해독을 지휘합니다.', guide: isKoreaWarCampaign ? ['연락망 신뢰도 확인', '요원·침투 경로 선택', '노출 위험 승인'] : ['정보 신뢰도 확인', '요원·표적 선택', '노출 위험 승인'], icon: 'intelligence' },
    { id: 'health', label: '보건 위기', navHint: '감시·유행·의료 대응', group: '국가 운영', description: '발병 위험을 감시하고 격리·병상·연구·사회 대응을 주간 단위로 지휘합니다.', guide: ['발병 위험·유행 단계 확인', '대응 태세 비교', '영구 역량 사업 승인'], icon: 'health' },
    { id: 'army', label: isKoreaWarCampaign ? '한국광복군' : campaignPhase === 'nation' ? '국방·동원' : '육군', navHint: isKoreaWarCampaign ? '부대·지휘관·국내정진' : campaignPhase === 'nation' ? '억지력·동원 해제' : '사단·지휘관·명령', group: campaignPhase === 'nation' ? '국가 역량' : '전쟁 수행', description: isKoreaWarCampaign ? '광복군 부대와 지휘관, 연합 훈련, 장비와 국내정진 작전 준비를 관리합니다.' : campaignPhase === 'nation' ? '전쟁에서 남은 사단과 지휘관을 국방·예비군·동원 해제 관점에서 관리합니다.' : '사단과 지휘관을 배치하고 공세와 훈련을 명령합니다.', guide: isKoreaWarCampaign ? ['부대 준비도 확인', '지휘관·연합 장비 배치', '국내정진 명령 검토'] : ['사단 준비도 확인', '지휘관·장비 배치', campaignPhase === 'nation' ? '국방 태세 검토' : '명령 승인'], icon: 'army' },
    { id: 'industry', label: isKoreaWarCampaign ? '연합 조달망' : campaignPhase === 'nation' ? '산업 전환' : '군수 생산', navHint: isKoreaWarCampaign ? '중국·연합군·비축' : campaignPhase === 'nation' ? '민수화·고용·비축' : '공장·비축·보급', group: campaignPhase === 'nation' ? '국가 역량' : '전쟁 수행', description: isKoreaWarCampaign ? '중국 내 분산 작업장과 연합군 조달, 광복군 장비 비축과 수송 병목을 관리합니다.' : campaignPhase === 'nation' ? '군수 공장과 장비 생산선을 민간 산업·고용 기반과 함께 관리합니다.' : '군수 공장과 장비 생산선, 전략 비축량을 조정합니다.', guide: isKoreaWarCampaign ? ['지원망 가동률 확인', '조달선 재배정', '광복군 비축 예측'] : ['가동률 확인', '공장 재배정', '주간 생산 예측'], icon: 'industry' },
    { id: 'research', label: isKoreaWarCampaign ? '독립전쟁 기술' : '연구 개발', navHint: isKoreaWarCampaign ? '무전·침투·연합 훈련' : '기술과 장비 계보', group: '전쟁 수행', description: isKoreaWarCampaign ? '무전·암호·침투·의무·연합 훈련과 장비 운용 능력을 연구합니다.' : '두 개의 연구 슬롯에 전쟁 기술 과제를 배정합니다.', guide: isKoreaWarCampaign ? ['작전 병목 선택', '기술·연합 장비 비교', '연구 슬롯 배정'] : ['전략 목표 선택', '기술·장비 비교', '연구 슬롯 배정'], icon: 'research' },
  ];
  const activeTabMeta = tabItems.find((tab) => tab.id === activeTab) ?? tabItems[0];
  const openGameTab = useCallback((tabId: GameTab) => {
    preloadGameTab(tabId);
    setVisitedOnboardingTabs((current) => current.includes(tabId) ? current : [...current, tabId]);
    if (tabId === 'map' && isKoreaWarCampaign) {
      setMapFocusMode(false);
      focusMapTerritory('korea');
      if (window.matchMedia('(max-width: 900px)').matches) setNavigationCollapsed(true);
      return;
    }
    if (tabId !== 'map') {
      setMapFocusMode(false);
    }
    setActiveTab(tabId);
    if (window.matchMedia('(max-width: 900px)').matches) setNavigationCollapsed(true);
  }, [focusMapTerritory, isKoreaWarCampaign]);
  const commandPaletteItems: CommandPaletteItem[] = [
    ...tabItems.map((tab) => ({ id: `tab-${tab.id}`, group: tab.group, title: tab.label, description: tab.description, keywords: [tab.id, tab.navHint], icon: <GameIcon name={tab.icon} size={18} tone="gold" />, active: activeTab === tab.id })),
    { id: 'theater-europe', group: '전구 지도', title: '유럽·지중해 전구', description: '유럽, 북아프리카와 지중해 전선을 엽니다.', keywords: ['유럽', '아프리카', '지도'], icon: <Map size={17} />, active: activeTheater === 'europe' },
    { id: 'theater-asia', group: '전구 지도', title: '아시아·태평양 전구', description: '중국, 인도, 동남아시아와 태평양 전선을 엽니다.', keywords: ['아시아', '태평양', '지도'], icon: <Map size={17} />, active: activeTheater === 'asia' },
    { id: 'action-center', group: '지휘 도구', title: '행동 센터', description: '놓친 결정과 우선 처리할 행동을 확인합니다.', keywords: ['할 일', '다음 행동', '권장'], icon: <Menu size={17} />, meta: `${uxActions.length}건` },
    { id: 'status-overview', group: '지휘 도구', title: '지휘 현황판', description: '핵심 자원·국가 위험·최우선 행동과 다음 주 준비 상태를 한 화면에서 확인합니다.', keywords: ['현황', '자원', '국고', '위험', '요약', '대시보드'], icon: <LayoutDashboard size={17} />, meta: 'H' },
    { id: 'war-journal', group: '지휘 도구', title: '진행 결과 분석실', description: '선택·계산·즉시효과·장기영향을 추적합니다.', keywords: ['기록', '전문', '이벤트', '결과', '원인', '결산'], icon: <BookOpen size={17} /> },
    { id: 'world-weekly', group: '지휘 도구', title: '세계 주보', description: '지난 7일의 전선·외교·경제·사회·과학·정보를 신뢰도와 인과관계까지 묶어 읽습니다.', keywords: ['신문', '주간', '뉴스', '세계', '이번 주'], icon: <Newspaper size={17} />, meta: latestWorldWeeklyIssue ? `제 ${latestWorldWeeklyIssue.edition}호` : '캠페인 시작 시 발행' },
    { id: 'achievements', group: '지휘 도구', title: '도전과제 기록실', description: '경력 목표, 달성 진척도와 해금된 삽화를 확인합니다.', keywords: ['업적', '도전과제', '삽화', '갤러리'], icon: <Trophy size={17} />, meta: `${achievementUnlocks.length}/${achievementDefinitions.length}` },
    { id: 'world-history', group: '지휘 도구', title: '대체지구 아틀라스', description: worldFlashpointForecast ? `다음 위기 ${worldFlashpointForecast.entry.event.title}까지 ${worldFlashpointForecast.weeksUntil}주. 세계선을 계산하고 직접 분기시킵니다.` : '모든 장기 세계 위기 결정을 완료했습니다.', keywords: ['대체역사', '냉전', '맨해튼', '전후', '세계선', '세계 위기'], icon: <Landmark size={17} />, meta: worldFlashpointForecast ? `D-${worldFlashpointForecast.weeksUntil}` : worldline.code },
    { id: 'settings', group: '지휘 도구', title: '사용자 환경 설정', description: '가독성, 고대비, 지도 라벨과 화면 효과를 조정합니다.', keywords: ['접근성', '글자', 'UI'], icon: <Settings size={17} /> },
    { id: 'field-manual', group: '지휘 도구', title: '야전 교범', description: '첫 주 체크리스트와 전투·운영 시스템 설명을 검색합니다.', keywords: ['도움말', '튜토리얼', '가이드'], icon: <CircleHelp size={17} />, meta: '?' },
    { id: 'save-center', group: '지휘 도구', title: '저장 및 캠페인 관리', description: '수동 체크포인트, 내보내기, 불러오기와 새 캠페인을 관리합니다.', keywords: ['저장', '불러오기', '체크포인트'], icon: <Save size={17} />, meta: 'Ctrl S' },
    { id: 'next-week', group: '주간 사이클', title: campaignPhase === 'nation' ? '다음 주 진행' : globalWeeklyCycle.primaryLabel, description: campaignPhase === 'nation' ? '재정·민생·산업·외교·보건 정책을 해결하고 국정을 한 주 진행합니다.' : globalWeeklyCycle.detail, keywords: ['턴', '시간', '다음 주', '결산', '주보', '결재'], icon: <SkipForward size={17} />, meta: 'N' },
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
    } else if (id === 'status-overview') {
      setShowStatusOverview(true);
    } else if (id === 'war-journal') {
      openWarJournal();
    } else if (id === 'world-weekly') {
      openWorldWeekly();
    } else if (id === 'achievements') {
      setShowAchievementGallery(true);
    } else if (id === 'world-history') {
      openWorldHistory();
    } else if (id === 'settings') {
      setShowSettings(true);
    } else if (id === 'field-manual') {
      setShowFieldManual(true);
    } else if (id === 'save-center') {
      setShowSaveCenter(true);
    } else if (id === 'next-week') {
      continueWeeklyFlow();
    } else if (id === 'toggle-time') {
      setSpeed((current) => current === 0 ? 1 : 0);
    }
  };

  return (
    <div className={'game-shell phase-' + campaignPhase + (navigationCollapsed ? ' navigation-collapsed' : '') + (activeTab === 'map' && mapFocusMode ? ' map-focus-mode' : '') + (uxPreferences.highContrast ? ' high-contrast' : '') + (uxPreferences.readableUI ? ' readable-ui' : '') + (uxPreferences.largeMapLabels ? ' large-map-labels' : '') + (uxPreferences.reducedMotion ? ' reduced-motion' : '')}>
      <a className="skip-to-workspace" href="#main-workspace">본문 업무공간으로 이동</a>
      <header className="topbar">
        <div className="brand-block">
          <button className="icon-button menu-button" aria-label={`행동 센터, ${uxActions.length}건`} aria-keyshortcuts="G" onClick={() => setShowActionCenter(true)}>
            <GameIcon name="command" size={19} tone="gold" />
            <span aria-hidden="true" className={'attention-badge ' + (uxActions.some((action) => action.priority === 'urgent') ? 'urgent' : '')}>{uxActions.length}</span>
          </button>
          <div className="brand-mark" style={{ borderColor: playerNation.accent }}><NationFlag nationId={playerNation.id} size="standard" decorative /></div>
          <div className="brand-copy">
            <strong>IRON DOMINION</strong>
            <span>{isKoreaWarCampaign ? `${playerNation.code} · ${1942 + Math.floor(game.week / 52)} · 독립운동 세계선` : `${playerNation.code} · ALTERNATE HISTORY · ${1942 + Math.floor(game.week / 52)}`}</span>
          </div>
          <div className="career-rank-chip"><small>TIER {careerRole.tier} · {staffAuthority.label}</small><strong>{currentRoleTitle}</strong></div>
          <button className={`campaign-phase-chip ${campaignPhase}`} onMouseEnter={() => void loadNationManagementPanel()} onFocus={() => void loadNationManagementPanel()} onClick={() => setActiveTab('governance')}>
            <Landmark size={15} />
            <span><small>{isKoreaWarCampaign ? 'LIBERATION GOVERNMENT' : campaignPhase === 'nation' ? 'POSTWAR GOVERNMENT' : 'WAR GOVERNMENT'}</small><strong>{isKoreaWarCampaign ? `해방·건국 준비 ${transitionReadiness.score}` : campaignPhase === 'nation' ? '국가 운영 단계' : `전환 준비 ${transitionReadiness.score}`}</strong></span>
          </button>
          <button className={`political-crisis-chip ${coupRisk.tier}`} onClick={() => { setSpeed(0); setShowPoliticalCrisis(true); }} aria-label={`${isKoreaWarCampaign ? '독립운동 내부 갈등' : '국내 정치위기'} 상황실, 쿠데타 위험 ${getCoupRiskLabel(coupRisk.tier)} ${coupRisk.score}점`}>
            <ShieldAlert size={16} />
            <span><small>{isKoreaWarCampaign ? '독립운동 내부 갈등' : '국내 정치위기'}</small><strong>{getCoupRiskLabel(coupRisk.tier)} {coupRisk.score}</strong></span>
            {coupRisk.tier === 'critical' && <em aria-hidden="true" />}
          </button>
          <button className={`health-command-chip ${publicHealthView.activeOutbreak ? 'crisis' : ''}`} onClick={() => setActiveTab('health')} aria-label={publicHealthView.activeOutbreak ? `${publicHealthView.activeOutbreak.codeName} 보건 위기 지휘실 열기` : `보건 대비 본부 열기, 다음 주 발병 확률 ${(publicHealthView.weeklyRisk * 100).toFixed(2)}퍼센트`}>
            <GameIcon name="health" size={16} tone={publicHealth.activeOutbreak ? 'red' : 'green'} />
            <span><small>{publicHealthView.activeOutbreak ? '보건 비상' : '보건 감시'}</small><strong>{publicHealthView.activeOutbreak ? publicHealthView.activeOutbreak.codeName : `${(publicHealthView.weeklyRisk * 100).toFixed(2)}%`}</strong></span>
          </button>
          <button className={`world-weekly-chip ${hasUnreadWorldWeekly ? 'unread' : ''}`} onMouseEnter={() => void loadWorldWeekly()} onFocus={() => void loadWorldWeekly()} onClick={openWorldWeekly} aria-label={latestWorldWeeklyIssue ? `세계 주보 제 ${latestWorldWeeklyIssue.edition}호${hasUnreadWorldWeekly ? ', 새 호' : ''}` : '세계 주보, 캠페인 시작 시 창간호 발행'}>
            <Newspaper size={17} />
            <span><small>{hasUnreadWorldWeekly ? '새 호 발행' : '세계 주보'}</small><strong>{latestWorldWeeklyIssue ? `제 ${latestWorldWeeklyIssue.edition}호` : '발행 대기'}</strong></span>
            {hasUnreadWorldWeekly && <em aria-hidden="true" />}
          </button>
        </div>

        <div className="resource-row">
          <div className="resource-scroll-track" role="region" tabIndex={0} aria-label="핵심 자원, 좌우로 스크롤 가능">
            <ResourceChip priority icon="treasury" tone="gold" value={formatGameMoney(game.treasury)} label={`${isKoreaWarCampaign ? '독립운동 기금' : '국고'} · ${economy.monetarySystem.historicalAutoTransition ? '역사통화' : '신 통화'}`} compactLabel={isKoreaWarCampaign ? '독립기금' : '국고'} delta={campaignPhase === 'nation' && nationManagement.reports[0] ? formatGameMoney(nationManagement.reports[0].fiscalBalance, { signed: true }) : formatGameMoney(economyForecast.netTreasuryChange, { signed: true })} />
            <ResourceChip icon="politics" tone="gold" value={formatNumber(game.politicalPower)} label={isKoreaWarCampaign ? '외교·조직력' : campaignPhase === 'nation' ? '정치 역량' : '정치력'} compactLabel={isKoreaWarCampaign ? '외교·조직' : '정치'} delta={campaignPhase === 'nation' ? `위임 ${nationManagement.mandateScore}` : '+3'} />
            <ResourceChip icon="manpower" tone="blue" value={formatNumber(game.manpower) + 'K'} label={isKoreaWarCampaign ? '동원 가능 인력' : campaignPhase === 'nation' ? '노동·예비 인력' : '가용 인력'} compactLabel={isKoreaWarCampaign ? '동원 인력' : campaignPhase === 'nation' ? '인력' : '가용 인력'} delta={campaignPhase === 'nation' ? `고용 ${Math.round(nationManagement.employment)}` : '+18'} />
            <ResourceChip icon="industry" tone="steel" value={String(game.factories)} label={isKoreaWarCampaign ? '협력 생산망' : campaignPhase === 'nation' ? '산업 기반' : '군수 공장'} compactLabel={isKoreaWarCampaign ? '생산망' : campaignPhase === 'nation' ? '산업' : '군수 공장'} delta={campaignPhase === 'nation' ? `민수 ${Math.round(nationManagement.civilianIndustry)}` : undefined} />
            <ResourceChip icon="fuel" tone="green" value={formatNumber(game.fuel) + 'K'} label={isKoreaWarCampaign ? '작전 연료' : campaignPhase === 'nation' ? '전략 에너지' : '연료'} delta={campaignPhase === 'nation' ? undefined : '+2.6'} />
            <ResourceChip icon="steel" tone="steel" value={formatNumber(game.steel) + 'K'} label={isKoreaWarCampaign ? '조달 강철' : '강철'} delta="+9" />
          </div>
          <button type="button" className="status-overview-trigger" aria-label="지휘 현황판 열기" aria-keyshortcuts="H" title="핵심 자원·위험·다음 행동 전체 보기 · H" onClick={() => setShowStatusOverview(true)}><LayoutDashboard size={17} /><span>현황</span></button>
        </div>

        <div className="time-controls">
          <div className="weather"><GameIcon name="weather" size={17} tone="blue" /><span>{activeTheater === 'asia' ? '아시아·태평양' : '유럽'}<br /><b>{activeTheater === 'asia' ? '몬순 · 29°C' : '비 · 11°C'}</b></span></div>
          <div className="date-block"><strong>{campaignDate.full}</strong><span>제 {game.week + 1}주 · {campaignDate.day}</span></div>
          <button className={'speed-button ' + (speed === 0 ? 'active' : '')} onClick={() => setSpeed(0)} aria-label="일시 정지" aria-keyshortcuts="Space"><Pause size={14} /></button>
          {[1, 2, 3].map((item) => (
            <button key={item} className={'speed-button text ' + (speed === item ? 'active' : '')} onClick={() => setSpeed(item)}>{item}×</button>
          ))}
          <button className={`speed-button next flow-${campaignPhase === 'nation' ? 'advance' : globalWeeklyCycle.currentStage}`} onClick={continueWeeklyFlow} aria-label={globalNextAriaLabel} title={`${globalNextAriaLabel} · N`} aria-keyshortcuts="N">
            <GameIcon name={campaignPhase === 'nation' || globalWeeklyCycle.primaryDestination === 'advance' ? 'advance' : globalWeeklyCycle.primaryDestination === 'actions' ? 'command' : 'report'} size={14} tone={globalWeeklyCycle.primaryDestination === 'actions' ? 'gold' : 'blue'} />
            <span>{globalNextLabel}</span>
          </button>
        </div>
      </header>

      <button
        type="button"
        className="rail-visibility-toggle"
        aria-controls="primary-navigation"
        aria-expanded={!navigationCollapsed}
        aria-label={navigationCollapsed ? '좌측 메뉴 펼치기' : '좌측 메뉴 접기'}
        title={navigationCollapsed ? '좌측 메뉴 펼치기' : '좌측 메뉴 접기'}
        onClick={() => setNavigationCollapsed((current) => !current)}
      >
        {navigationCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        <span className="sr-only">{navigationCollapsed ? '좌측 메뉴 펼치기' : '좌측 메뉴 접기'}</span>
      </button>

      <aside id="primary-navigation" className="left-rail" aria-hidden={navigationCollapsed} inert={navigationCollapsed ? true : undefined}>
        <div className="nation-emblem">
          <NationFlag nationId={playerNation.id} size="standard" />
          <small>{playerNation.shortName}</small>
        </div>
        <nav className="primary-nav" aria-label="게임 메뉴">
          {tabItems.map((tab, index) => (
            <div className="nav-entry" key={tab.id}>
            {(index === 0 || tabItems[index - 1].group !== tab.group) && <span className="primary-nav-group-label">{tab.group}</span>}
            <button data-tour={`${tab.id}-tab`} className={activeTab === tab.id ? 'active' : ''} onMouseEnter={() => preloadGameTab(tab.id)} onFocus={() => preloadGameTab(tab.id)} onClick={() => openGameTab(tab.id)} title={tab.label} data-tooltip={tab.description} aria-label={`${tab.label}${tabActionSummary.counts[tab.id] ? `, 미처리 업무 ${tabActionSummary.counts[tab.id]}건` : ''}`} aria-current={activeTab === tab.id ? 'page' : undefined}>
              <span className="nav-icon-plate"><GameIcon name={tab.icon} size={21} tone={activeTab === tab.id ? 'gold' : 'steel'} active={activeTab === tab.id} /></span>
              <span className="nav-copy"><strong>{tab.label}</strong><small>{tab.navHint}</small></span>
              {Boolean(tabActionSummary.counts[tab.id]) && <em className={`nav-work-badge ${tabActionSummary.urgentTabs.has(tab.id) ? 'urgent' : ''}`} aria-hidden="true">{tabActionSummary.counts[tab.id]}</em>}
            </button>
            </div>
          ))}
        </nav>
        <div className="rail-bottom">
          <button className={hasUnreadWorldWeekly ? 'rail-unread' : ''} title="세계 주보" data-tooltip={latestWorldWeeklyIssue ? `지난 7일의 세계 · 제 ${latestWorldWeeklyIssue.edition}호` : '캠페인 시작 시 창간호 발행'} aria-label={latestWorldWeeklyIssue ? `세계 주보 제 ${latestWorldWeeklyIssue.edition}호${hasUnreadWorldWeekly ? ', 새 호' : ''}` : '세계 주보'} onMouseEnter={() => void loadWorldWeekly()} onFocus={() => void loadWorldWeekly()} onClick={openWorldWeekly}><Newspaper size={17} /><span>세계 주보</span>{hasUnreadWorldWeekly && <em className="rail-achievement-count">NEW</em>}</button>
          <button title="도전과제 기록실" data-tooltip={`도전과제와 해금 삽화 · ${achievementUnlocks.length}/${achievementDefinitions.length}`} aria-label={`도전과제 기록실, ${achievementUnlocks.length}개 달성`} onMouseEnter={() => void loadAchievementGallery()} onFocus={() => void loadAchievementGallery()} onClick={() => setShowAchievementGallery(true)}><Trophy size={17} /><span>도전과제</span><em className="rail-achievement-count">{achievementUnlocks.length}</em></button>
          <button className={pendingWorldFlashpoint ? 'rail-crisis-due' : ''} title="대체지구 아틀라스" data-tooltip={pendingWorldFlashpoint ? `결정 대기 · ${pendingWorldFlashpoint.entry.event.title}` : worldFlashpointForecast ? `다음 세계 위기 · ${worldFlashpointForecast.entry.event.title} · ${worldFlashpointForecast.weeksUntil}주 후 · 역사 가속 범위 ${worldFlashpointForecast.historicalHorizon}년` : `${worldline.code} · 모든 장기 위기 결정 완료`} aria-label={pendingWorldFlashpoint ? `세계 위기 결정 대기, ${pendingWorldFlashpoint.entry.event.title}` : worldFlashpointForecast ? `대체지구 아틀라스, 다음 세계 위기 ${worldFlashpointForecast.entry.event.title}, ${worldFlashpointForecast.weeksUntil}주 후` : `대체지구 아틀라스, ${worldline.title}, 모든 장기 위기 결정 완료`} onMouseEnter={() => void loadWorldHistoryAtlas()} onFocus={() => void loadWorldHistoryAtlas()} onClick={openWorldHistory}><Landmark size={17} /><span>세계선</span>{worldFlashpointForecast && <em className="rail-crisis-count">{pendingWorldFlashpoint ? '결정' : `D-${worldFlashpointForecast.weeksUntil}`}</em>}</button>
          <button title="빠른 이동" data-tooltip="빠른 이동 · Ctrl+K" aria-label="빠른 이동" aria-keyshortcuts="Control+K Meta+K" onClick={() => setShowCommandPalette(true)}><GameIcon name="search" size={17} tone="steel" /><span>빠른 이동</span></button>
          <button title="진행 결과 분석실" data-tooltip="선택·계산·결과 추적" aria-label="진행 결과 분석실" onClick={openWarJournal}><GameIcon name="report" size={17} tone="steel" /><span>진행 결과</span></button>
          <button title={uxPreferences.soundOn ? '음향 끄기' : '음향 켜기'} data-tooltip={uxPreferences.soundOn ? '게임 음향 끄기' : '게임 음향 켜기'} aria-label={uxPreferences.soundOn ? '음향 끄기' : '음향 켜기'} onClick={() => toggleUXPreference('soundOn')}><GameIcon name="sound" size={17} tone="steel" className={uxPreferences.soundOn ? '' : 'muted'} /><span>음향</span></button>
          <button title="저장 및 캠페인 관리" data-tooltip="저장 및 캠페인 관리 · Ctrl+S" aria-label="저장 및 캠페인 관리" aria-keyshortcuts="Control+S Meta+S" onClick={() => setShowSaveCenter(true)}><GameIcon name="save" size={17} tone="steel" /><span>저장</span></button>
          <button title="야전 교범" data-tooltip="야전 교범 · ?" aria-label="야전 교범" aria-keyshortcuts="?" onMouseEnter={() => void loadFieldManual()} onFocus={() => void loadFieldManual()} onClick={() => setShowFieldManual(true)}><GameIcon name="help" size={17} tone="steel" /><span>야전 교범</span></button>
          <button title="사용자 환경 설정" data-tooltip="사용자 환경 설정 · S" aria-label="사용자 환경 설정" aria-keyshortcuts="S" onClick={() => setShowSettings(true)}><GameIcon name="settings" size={17} tone="steel" /><span>환경 설정</span></button>
        </div>
      </aside>

      {!navigationCollapsed && <button type="button" className="mobile-navigation-scrim" aria-label="전체 메뉴 닫기" onClick={() => setNavigationCollapsed(true)} />}

      <nav className="mobile-command-dock" aria-label="모바일 빠른 지휘">
        <button type="button" className={activeTab === 'command' ? 'active' : ''} aria-current={activeTab === 'command' ? 'page' : undefined} onClick={() => openGameTab('command')}><GameIcon name="command" size={20} tone={activeTab === 'command' ? 'gold' : 'steel'} /><span>상황실</span></button>
        <button type="button" className={activeTab === 'map' ? 'active' : ''} aria-current={activeTab === 'map' ? 'page' : undefined} onClick={() => openGameTab('map')}><GameIcon name="map" size={20} tone={activeTab === 'map' ? 'gold' : 'steel'} /><span>전황</span></button>
        <button type="button" className={`mobile-action-button ${uxActions.some((action) => action.priority === 'urgent') ? 'urgent' : ''}`} aria-label={`행동 센터, ${uxActions.length}건`} onClick={() => setShowActionCenter(true)}><GameIcon name="command" size={22} tone={uxActions.some((action) => action.priority === 'urgent') ? 'red' : 'gold'} framed active /><span>결재</span><em>{uxActions.length}</em></button>
        <button type="button" className={activeTab === 'organization' ? 'active' : ''} aria-current={activeTab === 'organization' ? 'page' : undefined} onClick={() => openGameTab('organization')}><GameIcon name="organization" size={20} tone={activeTab === 'organization' ? 'gold' : 'steel'} /><span>조직</span></button>
        <button type="button" className={!navigationCollapsed ? 'active' : ''} aria-expanded={!navigationCollapsed} aria-controls="primary-navigation" onClick={() => setNavigationCollapsed((current) => !current)}><Menu size={20} /><span>전체</span></button>
      </nav>

      <main id="main-workspace" tabIndex={-1} className={`war-room ${activeTab === 'map' ? `map-mode ${mapIntelOpen ? 'map-intel-open' : 'map-intel-closed'}` : 'workspace-mode'}`}>
        {activeTab === 'map' && (
          <>
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
            playerFaction={playerFaction}
            operationalHeadquarters={campaignPhase === 'war' ? playerNation.operationalHeadquarters : undefined}
            planningOriginId={planningMode ? selectedDivision.territoryId : undefined}
            camera={mapCamera}
            labelMode={mapLabelMode}
            onCameraChange={moveMapCamera}
            onZoom={zoomMap}
            onSelect={selectTerritory}
            fronts={regionalFrontSummaries}
          />
          <MapControlCenter
            activeTheater={activeTheater}
            activeRegion={activeMapRegion}
            regions={mapRegions}
            cities={regionalCities}
            selectedTerritoryId={selectedTerritoryId}
            territoryCount={regionalTerritories.length}
            cityCount={regionalCities.length}
            frontCount={regionalFrontSummaries.length}
            activeContactCount={regionalFrontSummaries.filter((front) => front.activeContacts > 0).length}
            layer={mapLayer}
            layerMeta={MAP_LAYER_META}
            labelMode={mapLabelMode}
            filtersOpen={mapFiltersOpen}
            legendOpen={mapLegendOpen}
            intelOpen={mapIntelOpen}
            focusMode={mapFocusMode}
            onTheaterChange={switchTheater}
            onRegionChange={switchMapRegion}
            onCityChange={focusMapTerritory}
            onLayerChange={setMapLayer}
            onLabelModeChange={setMapLabelMode}
            onToggleFilters={toggleMapFilters}
            onToggleLegend={toggleMapLegend}
            onToggleIntel={() => setMapIntelOpen((current) => !current)}
            onToggleFocus={toggleMapFocusMode}
          />
          <div className="map-camera-controls" role="group" aria-label="지도 확대와 이동">
            <button onClick={() => zoomMap(-0.2)} disabled={mapCamera.zoom <= 1} aria-label="지도 축소" aria-keyshortcuts="-"><ZoomOut size={15} /></button>
            <span aria-live="polite">{Math.round(mapCamera.zoom * 100)}%</span>
            <button onClick={() => zoomMap(0.2)} disabled={mapCamera.zoom >= MAX_MAP_ZOOM} aria-label="지도 확대" aria-keyshortcuts="+"><ZoomIn size={15} /></button>
            <button onClick={resetMapCamera} disabled={mapCamera.zoom === activeMapRegion.camera.zoom && mapCamera.centerX === activeMapRegion.camera.centerX && mapCamera.centerY === activeMapRegion.camera.centerY} aria-label="선택한 지역 작전도 위치로 복귀" aria-keyshortcuts="0"><Maximize2 size={15} /></button>
          </div>
          {planningMode && (
            <div className="planning-banner">
              <Target size={18} />
              <div className="planning-banner-copy"><strong>공세 목표 지정 · 명령 초안 유지 중</strong><span>{selectedDivision.name}의 인접 적 지역을 선택하십시오. 지도 이동·전구 전환·다른 화면 확인으로는 취소되지 않습니다.</span></div>
              <div className="planning-banner-actions">
                <button type="button" onClick={() => focusMapTerritory(selectedDivision.territoryId)}>출발선 보기</button>
                <button type="button" className="danger" onClick={() => {
                  setPlanningMode(false);
                  setPendingOffensivePlan(null);
                  notify('공세 목표 지정 초안을 취소했습니다. 이미 승인된 명령은 유지됩니다.');
                }} aria-label="공세 목표 지정 초안 취소"><X size={14} /> 초안 취소</button>
              </div>
            </div>
          )}
          {activeOrderPresentations.length > 0 && (
            <aside className="active-operation-dock" aria-label={`실행 중인 공세 명령 ${activeOrderPresentations.length}건`} aria-live="polite">
              <header>
                <ShieldCheck size={17} />
                <span><em>ACTIVE OPERATIONS</em><strong>승인된 공세 {activeOrderPresentations.length}건</strong></span>
                <b>지도 선택과 무관하게 유지</b>
              </header>
              <div className="active-operation-list">
                {activeOrderPresentations.slice(0, 3).map(({ order, division, origin, target, stanceLabel }) => (
                  <button type="button" key={`${order.divisionId}-${order.targetId}-${order.startedWeek}`} onClick={() => focusOperationalOrder(order)}>
                    <Target size={15} />
                    <span><strong>{target.name} · {stanceLabel}</strong><small>{division.name} · {origin.name} 출발 · 다음 주 결산</small></span>
                    <em>위치 보기 <ChevronRight size={13} /></em>
                  </button>
                ))}
              </div>
              {activeOrderPresentations.length > 3 && <footer>외 {activeOrderPresentations.length - 3}건은 육군 명령 목록에서 계속 추적됩니다.</footer>}
            </aside>
          )}
          <div className="theater-score">
            <div><span>{playerNation.shortName} 전황</span><strong>{game.victoryScore}</strong></div>
            <ProgressBar value={game.victoryScore} />
            <div className="score-labels"><span>후퇴</span><span>승리</span></div>
          </div>
        </section>

        {mapIntelOpen && <aside className="intel-panel" aria-label="전구 지휘 정보">
          <div className="panel-heading">
            <div><span className="eyebrow">NATIONAL COMMAND</span><h2>{playerNation.shortName} 지휘부</h2></div>
            <div className="panel-heading-actions">
              <button className="icon-button" aria-label="전쟁 전문 열기" onClick={openWarJournal}><Radio size={17} /></button>
              <button className="icon-button" aria-label="전구 정보 패널 닫기" onClick={() => setMapIntelOpen(false)}><X size={17} /></button>
            </div>
          </div>

          <section className="historical-map-source" aria-label="현재 지도의 역사 사료 출처">
            <div className="historical-map-source-heading">
              <Landmark size={14} />
              <span>ARCHIVE MAP</span>
              <em>{historicalMapSources[activeTheater].rightsLabel}</em>
            </div>
            <strong>{historicalMapSources[activeTheater].title}</strong>
            <span>{historicalMapSources[activeTheater].dateLabel} · {historicalMapSources[activeTheater].catalogId}</span>
            <small>{historicalMapSources[activeTheater].archive}</small>
            <div className="historical-map-quality"><b>{historicalMapSources[activeTheater].assetProfile}</b><span>{historicalMapSources[activeTheater].pixelDimensions} · 로컬 최고 화질</span></div>
            <p><b>{activeMapRegion.name}</b> 구간을 원본 스캔에서 확대했습니다. 지리와 당시 지명은 사료, 색상·부대·접촉선은 현재 대체역사 값입니다.</p>
            <a href={historicalMapSources[activeTheater].sourceUrl} target="_blank" rel="noreferrer">소장처 원문 보기 <ChevronRight size={12} /></a>
          </section>

          <section className="front-register" aria-label="현재 전구 전선 목록">
            <header><span>{activeMapRegion.shortName} 전선 상황판</span><em>{regionalFrontSummaries.filter((front) => front.activeContacts > 0).length}/{regionalFrontSummaries.length} 교전</em></header>
            <div>
              {regionalFrontSummaries.slice(0, 12).map((front) => (
                <button type="button" key={front.id} title={`${front.name}을 지도 중앙에 표시`} onClick={() => focusMapFront(front.id)} className={`${front.status === '위기' ? 'danger' : front.status === '우세' ? 'good' : ''}${front.activeContacts === 0 ? ' inactive' : ''}`}>
                  <i><Swords size={12} /></i>
                  <span><strong>{front.name}</strong><small>{front.commandArea}</small></span>
                  <em>{front.activeContacts > 0 ? `${front.activeContacts} 접촉 · ${front.status}` : '비접촉 · 감시'}</em>
                </button>
              ))}
            </div>
          </section>

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
            <div className="section-title"><span>최신 전문</span><button onClick={openWarJournal}>모두 보기</button></div>
            {events.slice(0, 3).map((event) => (
              <button className={'dispatch ' + event.tone} key={event.id} onClick={openWarJournal}>
                <i>{event.tone === 'good' ? <Check size={13} /> : event.tone === 'bad' ? <AlertTriangle size={13} /> : <Radio size={13} />}</i>
                <span><strong>{event.title}</strong><small>{event.detail}</small></span>
              </button>
            ))}
          </section>
        </aside>}
          </>
        )}

        {activeTab !== 'map' && (
        <section className="command-deck workspace-deck">
          <div className="deck-context-bar">
            <div className="deck-context-title" role="status" aria-live="polite" aria-atomic="true">
              <GameIcon name={activeTabMeta.icon} size={22} tone="gold" framed active />
              <span><em>{campaignPhase === 'nation' ? '국가 운영 내각' : '전쟁 지휘소'} / {activeTabMeta.group}</em><strong>{activeTabMeta.label}</strong><small>{activeTabMeta.description}</small></span>
            </div>
            <ol className="deck-route" aria-label={`${activeTabMeta.label} 이용 순서`}>
              {activeTabMeta.guide.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}
            </ol>
            <div className="deck-context-actions">
              <button className="autosave-indicator" onClick={() => setShowSaveCenter(true)} aria-label="저장 센터 열기"><ShieldCheck size={14} /><span>{lastSavedAt ? '자동 저장 완료' : '자동 저장 대기'}</span></button>
              <button className="quick-navigation-trigger" onClick={() => setShowCommandPalette(true)} aria-keyshortcuts="Control+K Meta+K"><Search size={15} /><span>빠른 이동</span><kbd>Ctrl K</kbd></button>
            </div>
          </div>
          {trackedAction && activeTab !== trackedAction.tab && (
            <button
              type="button"
              className={`tracked-command-return ${trackedAction.priority}`}
              onClick={() => {
                deckScrollPositionsRef.current[trackedAction.tab] = 0;
                setActiveTab(trackedAction.tab);
              }}
            >
              <GameIcon name="command" size={18} tone={trackedAction.priority === 'urgent' ? 'red' : 'gold'} framed active />
              <span><small>추적 중인 지시</small><strong>{trackedAction.title}</strong></span>
              <em>{trackedAction.label} 화면으로 복귀 <ChevronRight size={14} /></em>
            </button>
          )}
          {publicHealth.activeOutbreak && activeTab !== 'health' && (
            <button className={`workspace-crisis-ribbon ${publicHealth.activeOutbreak.phase}`} onClick={() => setActiveTab('health')}>
              <span className="crisis-ribbon-icon"><GameIcon name="health" size={19} tone="red" framed active /></span>
              <span><small>국가 보건 비상 · {publicHealth.activeOutbreak.codeName}</small><strong>주간 {formatNumber(publicHealth.activeOutbreak.weeklyCases)}건 · R {publicHealth.activeOutbreak.rEffective.toFixed(2)} · 병상 {Math.round(publicHealth.activeOutbreak.hospitalLoad)}%</strong></span>
              <em>위기 지휘실 열기 <ChevronRight size={15} /></em>
            </button>
          )}
          <div className="deck-content" ref={deckContentRef}>
            {completedTrackedAction && (
              <section className="tracked-command-complete" role="status" aria-live="polite" aria-atomic="true">
                <span className="tracked-command-complete-icon" aria-hidden="true"><CheckCircle2 size={20} /></span>
                <span>
                  <small>ORDER COMPLETE · 지시 해결</small>
                  <strong>{completedTrackedAction.title}</strong>
                  <p>{completedTrackedAction.resolution ?? '다음 주 결산에서 최종 결과를 확인하십시오.'}</p>
                </span>
                <button type="button" onClick={() => setCompletedTrackedAction(null)}>확인 <X size={14} /></button>
              </section>
            )}
            {trackedAction && activeTab === trackedAction.tab && (
              <section className={`tracked-command-brief ${trackedAction.priority}`} aria-label={`추적 중인 지시: ${trackedAction.title}`}>
                <span className="tracked-command-icon" aria-hidden="true">
                  <GameIcon name="command" size={20} tone={trackedAction.priority === 'urgent' ? 'red' : 'gold'} framed active />
                </span>
                <span className="tracked-command-copy">
                  <small>TRACKED ORDER · {trackedAction.priority === 'urgent' ? '긴급 지시' : trackedAction.priority === 'recommended' ? '권장 지시' : '상태 추적'}</small>
                  <strong>{trackedAction.title}</strong>
                  <p>{trackedAction.instruction ?? `${trackedAction.label} 관련 설정을 조정하십시오.`}</p>
                </span>
                <span className="tracked-command-outcome">
                  <small>결과 확인</small>
                  <strong>{trackedAction.resolution ?? '다음 주 결산에서 확인'}</strong>
                </span>
                <button type="button" onClick={() => { setTrackedActionId(null); setTrackedActionSnapshot(null); }} aria-label={`${trackedAction.title} 추적 해제`}>
                  <X size={15} />
                </button>
              </section>
            )}
            {activeTab === 'command' && campaignPhase === 'war' && (
              <div className="command-home">
                <CommandDashboard
                  nation={playerNation}
                  role={displayedCareerRole}
                  career={career}
                  game={game}
                  activeTheater={activeTheater}
                  playerFaction={playerFaction}
                  territories={territories}
                  divisions={effectiveDivisions}
                  orders={orders}
                  production={production}
                  stockpile={stockpile}
                  research={research}
                  equipmentDevelopment={equipmentDevelopment}
                  staff={staff}
                  candidates={staffCandidates}
                  events={events}
                  actions={uxActions}
                  publicHealth={publicHealthView}
                  nationalSimulation={nationalSimulation}
                  weeklyIssue={latestWorldWeeklyIssue}
                  weeklyUnread={hasUnreadWorldWeekly}
                  resultsReviewed={game.week === 0 || lastReviewedJournalWeek >= game.week}
                  objectiveProgress={objectiveProgress}
                  achievement={activeAchievement}
                  achievementProgress={activeAchievement ? achievementProgress[activeAchievement.id] : undefined}
                  achievementTracked={Boolean(activeAchievement && trackedAchievementId === activeAchievement.id)}
                  onNavigate={openGameTab}
                  onAction={navigateFromActionCenter}
                  onOpenActionCenter={() => setShowActionCenter(true)}
                  onOpenJournal={openWarJournal}
                  onOpenWorldWeekly={openWorldWeekly}
                  onAcknowledgeWeeklyBriefing={acknowledgeWeeklyBriefing}
                  onOpenAchievements={() => setShowAchievementGallery(true)}
                  onNextWeek={advanceWeek}
                />
                <section id="command-council" className="command-council-section">
                  <header>
                    <div><span className="eyebrow">WAR CABINET</span><h2>전쟁 내각과 국가 전략</h2></div>
                    <p>대체역사 노선, 국가 결정과 주요 작전을 검토합니다.</p>
                  </header>
                  <CommandPanel
                    game={game}
                    territories={territories}
                    divisions={divisions}
                    orders={orders}
                    battleStance={battleStance}
                    torchAuthorized={torchAuthorized}
                    completedDecisions={completedDecisions}
                    onAuthorizeTorch={authorizeTorch}
                    onDecision={enactDecision}
                    onEmergencyBond={issueEmergencyWarBonds}
                    setGame={setGame}
                    setDivisions={setDivisions}
                    nation={playerNation}
                    role={careerRole}
                    career={career}
                    historyTrajectory={historyTrajectory}
                    playerFaction={playerFaction}
                    activeTheater={activeTheater}
                    onOpenHistory={openWorldHistory}
                  />
                </section>
              </div>
            )}
            {(activeTab === 'governance' || (activeTab === 'command' && campaignPhase === 'nation')) && (
              <Suspense fallback={<DeferredSurface label="국가 운영 내각 준비 중" />}>
                <NationManagementPanel
                  phase={campaignPhase}
                  state={nationManagement}
                  game={game}
                  economy={economy}
                  nation={playerNation}
                  role={displayedCareerRole}
                  staff={staff}
                  territories={territories}
                  relations={relations}
                  nationalSimulation={nationalSimulation}
                  worldlineTitle={worldline.title}
                  readiness={transitionReadiness}
                  formatMoney={formatGameMoney}
                  onTransition={transitionToNationManagement}
                  onBudgetChange={changeNationBudget}
                  onTaxChange={changeNationTax}
                  onSpendingChange={changeNationSpending}
                  onStrategyChange={changeNationStrategy}
                  onGovernmentFormChange={changeGovernmentForm}
                  onGrantTitle={appointNobleTitle}
                  onRevokeTitle={revokeNobleTitle}
                  onArrangeMarriage={arrangeRoyalMarriage}
                  onSuccessionLawChange={changeSuccessionLaw}
                  onElectionCampaignAction={runElectionCampaignAction}
                  onLaunchReferendum={proposeReferendum}
                  onNavigate={setActiveTab}
                  onNextWeek={advanceWeek}
                />
              </Suspense>
            )}
            {activeTab === 'organization' && (
              <Suspense fallback={<DeferredSurface label="조직 운영실 준비 중" />}>
              <OrganizationPanel
                game={game}
                nation={playerNation}
                role={displayedCareerRole}
                campaignPhase={campaignPhase}
                careerReputation={career.reputation}
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
                formatMoney={formatGameMoney}
                onMeetStaff={meetStaff}
                onToggleDelegation={toggleStaffDelegation}
                onAssignStaff={assignStaffToDepartment}
                onSetPriorityDivision={setPriorityFormation}
                onSetProcurementFocus={setProcurementFocus}
                onSetSupplyPolicy={changeSupplyPolicy}
                onSelectPolicy={selectStrategicPolicy}
                onSetDevelopmentFocus={changeDevelopmentFocus}
                onUpgradeStaff={upgradeStaff}
                onScoutCandidate={scoutCandidate}
                onToggleShortlist={toggleCandidateShortlist}
                onApproachCandidate={approachCandidate}
                onRecruitCandidate={recruitCandidate}
                onRenewStaff={renewStaffContract}
              />
              </Suspense>
            )}
            {activeTab === 'economy' && (
              <Suspense fallback={<DeferredSurface label="전시 재무성 장부 준비 중" />}>
                <EconomicMinistry
                  state={economy}
                  game={game}
                  nationId={playerNation.id}
                  relations={relations}
                  staffWeeklyCost={staffWeeklyCost}
                  economyAdvisorBonus={economyAdvisorBonus}
                  onTaxPolicy={changeTaxPolicy}
                  onBondProgram={changeBondProgram}
                  onPriceControl={changePriceControl}
                  onBuy={buyCompanyStake}
                  onSell={sellCompanyStake}
                  onBuyCurrency={buyCurrencyReserve}
                  onSellCurrency={sellCurrencyReserve}
                  onIssueCurrency={createSovereignCurrency}
                  onRestoreHistoricalCurrency={returnToHistoricalCurrency}
                />
              </Suspense>
            )}
            {activeTab === 'health' && (
              <Suspense fallback={<DeferredSurface label="국가 보건 위기실 준비 중" />}>
                <PublicHealthCenter state={publicHealthView} game={game} context={publicHealthContext} onPolicyChange={changePublicHealthPolicy} onInvestment={fundPublicHealthInvestment} />
              </Suspense>
            )}
            {activeTab === 'army' && (
              <ArmyPanel
                game={game}
                divisions={effectiveDivisions}
                selectedDivision={selectedDivision}
                selectedEquipmentName={getDevelopedEquipment(selectedDivision.equipmentPackageId, equipmentDevelopment)?.name ?? '표준 장비 패키지'}
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
            {activeTab === 'research' && (
              <div className="research-page">
                <ResearchPanel nationId={playerNation.id} research={research} weeklyGain={(doctrine === 'methodical' ? 13 : 11) + 2 + scienceAdvisorBonus + (scienceAdvisor?.discipline === 'science' ? 1 : 0)} onToggle={toggleResearch} />
                <Suspense fallback={<DeferredSurface label="통합 장비 개발국 준비 중" />}>
                <EquipmentLab
                  nationId={playerNation.id}
                  game={game}
                  development={equipmentDevelopment}
                  production={production}
                  divisions={effectiveDivisions}
                  weeklyResearchGain={8 + Math.floor(game.factories / 7) + (doctrine === 'methodical' ? 3 : 0) + (delegatedDepartments.has('armaments') ? 2 : 0) + Math.max(0, scienceAdvisorBonus - 1) + (scienceAdvisor?.discipline === 'engineering' ? 1 : 0) + 2}
                  formatMoney={formatGameMoney}
                  onStartResearch={startEquipmentResearch}
                  onCreatePrototype={createEquipmentPrototype}
                  onFieldEquipment={fieldEquipment}
                  onAssignDivisionEquipment={assignDivisionEquipment}
                />
                </Suspense>
              </div>
            )}
            {activeTab === 'diplomacy' && <DiplomacyPanel game={game} relations={relations} setRelations={setRelations} setGame={setGame} notify={notify} nation={playerNation} completedDecisions={completedDecisions} onDecision={enactDecision} />}
            {activeTab === 'intelligence' && <IntelligencePanel game={game} operations={operations} setOperations={setOperations} setGame={setGame} notify={notify} addEvent={addEvent} nation={playerNation} role={careerRole} activeTheater={activeTheater} intelligenceHistory={worldline.intelligenceHistory} />}
          </div>
        </section>
        )}
      </main>

      {activeTab === 'map' && mapSelectionOpen && <section className="selected-province" aria-label={`선택 지역 ${selectedTerritory.name}`}>
        <div className={'faction-stripe ' + selectedTerritory.controller} />
        <div className="province-title">
          <span>{selectedIsOperationalHeadquarters ? playerNation.operationalHeadquarters?.label : selectedTerritory.region}</span>
          <h3>{selectedIsOperationalHeadquarters ? `${selectedTerritory.name} · 연합국 주재지` : selectedTerritory.name}</h3>
          <small title={selectedTerritory.historicalNote}>{factionLabels[selectedTerritory.controller]} 통제 · {selectedTerritory.terrain}{selectedIsOperationalHeadquarters ? ' · 중국 영토 내 임정 본부' : ''}{selectedFrontSummary ? ` · ${selectedFrontSummary.name}` : ''}</small>
        </div>
        <div className="province-stat"><span>보급</span><strong>{selectedTerritory.supply}%</strong><ProgressBar value={selectedTerritory.supply} thin /></div>
        <div className="province-stat"><span>전략 가치</span><strong>{selectedTerritory.value}</strong><div className="stars">{'★'.repeat(Math.min(5, Math.ceil(selectedTerritory.value / 2)))}</div></div>
        <div className="province-stat"><span>주둔 전력</span><strong>{selectedTerritoryDivisions}개 사단</strong><small>{selectedTerritoryDivisions > 0 ? '지휘 가능' : '주둔군 없음'}</small></div>
        <div className={`province-stat ${selectedHostileNeighbors > 0 ? 'contact' : ''}`}><span>전선 접촉</span><strong>{selectedHostileNeighbors}개 방면</strong><small>{selectedHostileNeighbors > 0 ? '적 인접 지역' : '후방 지역'}</small></div>
        <button className="focus-button" onClick={() => {
          setMapFocusMode(false);
          setActiveTab('army');
        }}>{selectedTerritory.controller === playerFaction ? '주둔군 보기' : '아군 편제 열기'} <ChevronRight size={15} /></button>
        <button type="button" className="province-dismiss" aria-label="선택 지역 카드 닫기" onClick={() => setMapSelectionOpen(false)}><X size={14} /></button>
      </section>}

      {pendingOffensivePlan && pendingOffensivePlanDetails && offensiveForecasts && !showBriefing && !campaignOutcome && !pendingCouncilEvent && !pendingBattleReport && (
        <OffensivePlanningModal
          division={pendingOffensivePlanDetails.division}
          commander={pendingOffensivePlanDetails.commander}
          origin={pendingOffensivePlanDetails.origin}
          target={pendingOffensivePlanDetails.target}
          stance={pendingOffensivePlan.stance}
          forecasts={offensiveForecasts}
          commandPoints={game.commandPoints}
          intelNetwork={game.intelNetwork}
          onStanceChange={(stance) => setPendingOffensivePlan((current) => current ? { ...current, stance } : current)}
          onConfirm={confirmOffensivePlan}
          onCancel={cancelOffensivePlan}
        />
      )}

      {showBriefing && (
        <CampaignSetup
          nationId={setupNationId}
          roleId={setupRoleId}
          doctrine={doctrine}
          hasSave={hasSave}
          hasManualSaves={manualSaves.length > 0}
          onNationChange={changeSetupNation}
          onRoleChange={setSetupRoleId}
          onDoctrineChange={setDoctrine}
          onStart={startCampaign}
          onContinue={continueCampaign}
          onManageSaves={() => setShowSaveCenter(true)}
        />
      )}
      {pendingAchievementId && !showBriefing && !showTutorial && (
        <Suspense fallback={<DeferredSurface label="도전과제 삽화 준비 중" overlay />}>
          <AchievementGallery
            unlocks={achievementUnlocks}
            progress={achievementProgress}
            featuredId={pendingAchievementId}
            onAcknowledge={() => setPendingAchievementId(null)}
            onOpenGallery={() => setShowAchievementGallery(true)}
            onClose={() => setPendingAchievementId(null)}
          />
        </Suspense>
      )}
      {showAchievementGallery && !pendingAchievementId && !showBriefing && !showTutorial && (
        <Suspense fallback={<DeferredSurface label="도전과제 기록실 준비 중" overlay />}>
          <AchievementGallery
            unlocks={achievementUnlocks}
            progress={achievementProgress}
            trackedId={trackedAchievementId}
            onTrack={(id) => setTrackedAchievementId((current) => current === id ? null : id)}
            onClose={() => setShowAchievementGallery(false)}
          />
        </Suspense>
      )}
      {showWorldHistory && !showBriefing && !showTutorial && !pendingAchievementId && !showAchievementGallery && (
        <Suspense fallback={<DeferredSurface label="대체지구 세계선 계산 중" overlay />}>
          <WorldHistoryAtlas
            worldline={worldline}
            trajectory={historyTrajectory}
            onClose={() => setShowWorldHistory(false)}
          />
        </Suspense>
      )}
      {showWorldWeekly && !showBriefing && !showTutorial && !pendingAchievementId && !showAchievementGallery && !showWorldHistory && worldWeeklyIssues.length > 0 && (
        <Suspense fallback={<DeferredSurface label="세계 주보 편집 중" overlay />}>
          <WorldWeekly
            issues={worldWeeklyIssues}
            onNavigate={setActiveTab}
            onClose={() => setShowWorldWeekly(false)}
          />
        </Suspense>
      )}
      {campaignOutcome && !showBriefing && !pendingWorldFlashpoint && !pendingCoupIncident && !pendingAchievementId && !showAchievementGallery && !showWorldHistory && !showWorldWeekly && (
        <CampaignOutcomeModal
          outcome={campaignOutcome}
          game={game}
          territories={territories}
          nation={playerNation}
          playerFaction={playerFaction}
          ending={worldline.ending}
          endingCount={worldline.endingCount}
          onJournal={openWarJournal}
          onWorldHistory={openWorldHistory}
          onContinueNation={() => transitionToNationManagement('victory')}
          onRestart={resetCampaign}
        />
      )}
      {(pendingCoupIncident || showPoliticalCrisis) && !showBriefing && (
        <PoliticalCrisisModal
          profile={politicalProfile}
          state={politicalCrisis}
          assessment={coupRisk}
          context={politicalCrisisContext}
          role={careerRole}
          formatMoney={formatGameMoney}
          incident={pendingCoupIncident}
          onPrevent={preventCoup}
          onRespond={respondToCoup}
          onClose={pendingCoupIncident ? undefined : () => setShowPoliticalCrisis(false)}
        />
      )}
      {pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !showBriefing && (
        <WorldFlashpointModal selection={pendingWorldFlashpoint} campaignPhase={campaignPhase} onChoose={resolveWorldFlashpointChoice} />
      )}
      {pendingCouncilEvent && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !showBriefing && !campaignOutcome && (
        <CouncilEventModal event={pendingCouncilEvent} onChoose={resolveCouncilChoice} />
      )}
      {pendingBattleReport && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !showBriefing && !campaignOutcome && (
        <BattleReportModal report={pendingBattleReport} onClose={() => setPendingBattleReportId(null)} />
      )}
      {showJournal && <WarJournal events={events} onClose={() => setShowJournal(false)} />}
      {showStatusOverview && !showBriefing && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <StatusOverview
          nationName={playerNation.shortName}
          roleTitle={currentRoleTitle}
          date={campaignDate.full}
          phaseLabel={isKoreaWarCampaign ? '독립운동·해방 준비 단계' : campaignPhase === 'nation' ? '국가 운영 단계' : '전쟁 지휘 단계'}
          resources={statusResources}
          metrics={statusMetrics}
          projections={statusProjections}
          actions={uxActions}
          primaryActionLabel={globalNextAriaLabel}
          onNavigate={navigateFromStatusOverview}
          onContinue={() => { setShowStatusOverview(false); continueWeeklyFlow(); }}
          onClose={() => setShowStatusOverview(false)}
        />
      )}
      {showActionCenter && !showBriefing && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <ActionCenter
          actions={uxActions}
          lifecycleRecords={uxActionLifecycle}
          onAcknowledge={acknowledgeActionCenter}
          onNavigate={navigateFromActionCenter}
          onClose={() => setShowActionCenter(false)}
        />
      )}
      {showSettings && !showBriefing && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <SettingsModal
          preferences={uxPreferences}
          onToggle={toggleUXPreference}
          onReset={() => setUXPreferences({ ...defaultUXPreferences })}
          onRestartTutorial={() => {
            setShowSettings(false);
            setShowTutorial(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showCommandPalette && !showBriefing && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <CommandPalette items={commandPaletteItems} onExecute={executePaletteCommand} onClose={() => setShowCommandPalette(false)} />
      )}
      {showFieldManual && !showBriefing && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <Suspense fallback={<DeferredSurface label="야전 교범 준비 중" overlay />}>
          <FieldManual
            steps={onboardingSteps}
            onRestartTutorial={() => {
              setShowFieldManual(false);
              setShowTutorial(true);
            }}
            onNavigate={(tab) => {
              setActiveTab(tab);
              setShowFieldManual(false);
              notify(`${tabItems.find((item) => item.id === tab)?.label ?? '관리'} 화면을 열었습니다.`);
            }}
            onClose={() => setShowFieldManual(false)}
          />
        </Suspense>
      )}
      {showSaveCenter && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <SaveCenter
          saves={manualSaves}
          autoSavedAt={lastSavedAt}
          nationName={playerNation.shortName}
          roleTitle={currentRoleTitle}
          week={game.week}
          theaterName={activeTheater === 'asia' ? '아시아·태평양' : '유럽·지중해'}
          victoryScore={game.victoryScore}
          onSave={saveManualSlot}
          onLoad={loadManualSlot}
          onDelete={removeManualSlot}
          onExport={exportCampaignSave}
          onImport={importCampaignSave}
          onNewCampaign={() => {
            setShowSaveCenter(false);
            if (!showBriefing) setShowResetConfirmation(true);
          }}
          onClose={() => setShowSaveCenter(false)}
        />
      )}
      {showResetConfirmation && !showBriefing && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <ConfirmResetModal nationName={playerNation.shortName} week={game.week} onConfirm={resetCampaign} onClose={() => setShowResetConfirmation(false)} />
      )}
      {showTutorial && !showBriefing && !campaignOutcome && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && (
        <Suspense fallback={null}>
          <TutorialOverlay nationId={playerNation.id} role={careerRole} onNavigate={openGameTab} onComplete={completeTutorial} />
        </Suspense>
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

function TerrainGlyph({ terrain }: { terrain: string }) {
  const glyph = getTerrainGlyphKind(terrain);
  if (glyph === 'mountain') {
    return <g className="terrain-glyph mountain-glyph" transform="translate(-18 13)" aria-hidden="true"><path d="M-7 5 L-1 -5 4 3 8 -3 13 5 Z" /></g>;
  }
  if (glyph === 'forest') {
    return <g className="terrain-glyph forest-glyph" transform="translate(-18 12)" aria-hidden="true"><path d="M-5 5 L0 -5 5 5 M2 5 L7 -3 12 5" /><path d="M0 5 V8 M7 5 V8" /></g>;
  }
  if (glyph === 'urban') {
    return <g className="terrain-glyph urban-glyph" transform="translate(-18 12)" aria-hidden="true"><rect x="-5" y="-4" width="7" height="11" /><rect x="4" y="-1" width="8" height="8" /><path d="M-2 -4 V-8 M8 -1 V-6" /></g>;
  }
  if (glyph === 'naval') {
    return <g className="terrain-glyph naval-glyph" transform="translate(-18 13)" aria-hidden="true"><path d="M-7 0 Q-3 -3 1 0 T9 0 M-7 5 Q-3 2 1 5 T9 5" /></g>;
  }
  if (glyph === 'desert') {
    return <g className="terrain-glyph desert-glyph" transform="translate(-18 14)" aria-hidden="true"><path d="M-7 4 Q-1 -5 5 4 Q9 8 13 3" /></g>;
  }
  if (glyph === 'river') {
    return <g className="terrain-glyph river-glyph" transform="translate(-18 13)" aria-hidden="true"><path d="M-6 -5 C5 -1 -2 4 11 8" /></g>;
  }
  return <g className="terrain-glyph plains-glyph" transform="translate(-18 14)" aria-hidden="true"><path d="M-7 1 H12 M-4 5 H9" /></g>;
}

function MapBoard({ territories, divisions, orders, selectedTerritoryId, planningMode, layer, labelMode, theater, intelNetwork, playerFaction, operationalHeadquarters, planningOriginId, camera, fronts, onCameraChange, onZoom, onSelect }: {
  territories: Territory[];
  divisions: Division[];
  orders: Order[];
  selectedTerritoryId: string;
  planningMode: boolean;
  layer: MapLayer;
  labelMode: MapLabelMode;
  theater: TheaterId;
  intelNetwork: number;
  playerFaction: Exclude<Faction, 'neutral'>;
  operationalHeadquarters?: NationProfile['operationalHeadquarters'];
  planningOriginId?: string;
  camera: MapCamera;
  fronts: FrontSummary[];
  onCameraChange: (camera: MapCamera) => void;
  onZoom: (delta: number) => void;
  onSelect: (id: string) => void;
}) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; centerX: number; centerY: number; viewWidth: number; viewHeight: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const divisionGroups = useMemo(() => divisions.reduce<Record<string, Division[]>>((groups, division) => {
    groups[division.territoryId] = [...(groups[division.territoryId] ?? []), division];
    return groups;
  }, {}), [divisions]);
  const connections = useMemo(() => deriveMapConnections(territories), [territories]);
  const mapSource = historicalMapSources[theater];
  const territoryPositions = useMemo(
    () => Object.fromEntries(territories.map((territory) => [territory.id, getHistoricalMapPlacement(theater, territory)])),
    [territories, theater],
  );
  const visibleConnections = useMemo(
    () => deriveSameFrameMapConnections(connections, territoryPositions),
    [connections, territoryPositions],
  );
  const validTargetIds = useMemo(
    () => planningMode ? deriveValidTargetIds(territories, planningOriginId, playerFaction) : new Set<string>(),
    [planningMode, planningOriginId, playerFaction, territories],
  );
  const markerPresentations = useMemo(() => new globalThis.Map(territories.map((territory) => {
    const group = divisionGroups[territory.id] ?? [];
    const selected = selectedTerritoryId === territory.id;
    const isPlanningOrigin = planningMode && planningOriginId === territory.id;
    const isValidTarget = planningMode && validTargetIds.has(territory.id);
    return [territory.id, deriveMapMarkerPresentation({
      mode: labelMode,
      selected,
      hasUnits: group.length > 0,
      planningOrigin: isPlanningOrigin,
      validTarget: isValidTarget,
      siteType: territory.siteType,
      labelTier: territory.labelTier ?? 2,
      value: territory.value,
      frontId: territory.frontId,
      zoom: camera.zoom,
    })];
  })), [camera.zoom, divisionGroups, labelMode, planningMode, planningOriginId, selectedTerritoryId, territories, validTargetIds]);
  const visibleFrontLabels = useMemo(() => {
    if (camera.zoom > 2.1) return [];
    const limit = labelMode === 'essential'
      ? (camera.zoom >= 1.4 ? 2 : 4)
      : labelMode === 'operational'
        ? (camera.zoom >= 1.4 ? 4 : 6)
        : (camera.zoom >= 1.4 ? 5 : 8);
    const prioritizedFronts = [...fronts]
      .filter((front) => front.activeContacts > 0)
      .sort((a, b) => b.intensity - a.intensity || b.activeContacts - a.activeContacts)
      .slice(0, limit);
    return deriveFrontLabelAnchors(prioritizedFronts, connections, territoryPositions)
      .map((anchor) => ({
        ...anchor,
        width: Math.max(86, anchor.front.name.length * 10 + 26),
      }));
  }, [camera.zoom, connections, fronts, labelMode, territoryPositions]);
  const visibleMapLabelIds = useMemo(() => deriveVisibleMapLabelIds([
    ...Object.entries(divisionGroups).flatMap(([territoryId, group]) => {
      const point = territoryPositions[territoryId];
      if (!point || !group.length) return [];
      return [{
        id: `unit:${territoryId}`,
        x: point.x + 37 / camera.zoom,
        y: point.y + 26 / camera.zoom,
        text: '',
        priority: 1200,
        force: true,
        width: 48,
        height: 32,
      }];
    }),
    ...territories.flatMap((territory) => {
      const presentation = markerPresentations.get(territory.id);
      if (!presentation?.showLabel) return [];
      const point = territoryPositions[territory.id];
      const selected = selectedTerritoryId === territory.id;
      const isPlanningOrigin = planningMode && planningOriginId === territory.id;
      const isValidTarget = planningMode && validTargetIds.has(territory.id);
      const hasUnits = (divisionGroups[territory.id]?.length ?? 0) > 0;
      const hasLayerReading = layer === 'political' || layer === 'supply' || layer === 'intelligence';
      return [{
        id: `territory:${territory.id}`,
        x: point.x,
        y: point.y + (hasLayerReading ? 4 : -19) / camera.zoom,
        text: territory.name,
        priority: selected ? 1000 : isPlanningOrigin || isValidTarget ? 950 : hasUnits ? 900 : territory.siteType === 'capital' ? 820 : 300 - (territory.labelTier ?? 2) * 35 + territory.value * 8,
        force: selected,
        height: hasLayerReading ? 58 : 18,
      }];
    }),
    ...visibleFrontLabels.map(({ front, x, y, width }) => ({
      id: `front:${front.id}`,
      x,
      y,
      text: front.name,
      priority: 470 + front.intensity,
      width,
      height: 24,
    })),
  ], camera.zoom), [camera.zoom, divisionGroups, layer, markerPresentations, planningMode, planningOriginId, selectedTerritoryId, territories, territoryPositions, validTargetIds, visibleFrontLabels]);
  const viewWidth = 1200 / camera.zoom;
  const viewHeight = 760 / camera.zoom;
  const viewX = camera.centerX - viewWidth / 2;
  const viewY = camera.centerY - viewHeight / 2;

  const startMapDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || (event.target as Element).closest('.territory-marker')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerX: camera.centerX,
      centerY: camera.centerY,
      viewWidth,
      viewHeight,
    };
    setDragging(true);
  };

  const moveMapDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    onCameraChange({
      ...camera,
      centerX: drag.centerX - (event.clientX - drag.startX) / Math.max(1, bounds.width) * drag.viewWidth,
      centerY: drag.centerY - (event.clientY - drag.startY) / Math.max(1, bounds.height) * drag.viewHeight,
    });
  };

  const stopMapDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <svg
      className={'strategic-map theater-' + theater + ' layer-' + layer + ' density-' + labelMode + (planningMode ? ' planning' : '') + (camera.zoom > 1 ? ' zoomed' : '') + (dragging ? ' dragging' : '')}
      viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={(theater === 'asia' ? '아시아와 태평양 전략 지도' : '유럽과 지중해 전략 지도') + `, 확대 ${Math.round(camera.zoom * 100)}%, ${labelMode === 'essential' ? '핵심 표식' : labelMode === 'operational' ? '작전 표식' : '전체 표식'} 모드`}
      onWheel={(event) => {
        event.preventDefault();
        onZoom(event.deltaY < 0 ? 0.2 : -0.2);
      }}
      onPointerDown={startMapDrag}
      onPointerMove={moveMapDrag}
      onPointerUp={stopMapDrag}
      onPointerCancel={stopMapDrag}
    >
      <defs>
        <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(242,230,194,.055)" strokeWidth="1" />
        </pattern>
        <filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.48" /></filter>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="historical-map-tint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(8,14,13,.12)" /><stop offset="65%" stopColor="rgba(8,14,13,.22)" /><stop offset="100%" stopColor="rgba(8,14,13,.38)" /></linearGradient>
        <radialGradient id="map-vignette"><stop offset="55%" stopColor="rgba(0,0,0,0)" /><stop offset="100%" stopColor="rgba(0,0,0,.52)" /></radialGradient>
      </defs>
      <rect width="1200" height="760" fill="#0a0d0c" />
      <image
        className="historical-map-scan"
        href={mapSource.image}
        x="0"
        y="0"
        width="1200"
        height="760"
        preserveAspectRatio="xMidYMid slice"
        aria-label={`${mapSource.title}, ${mapSource.dateLabel}`}
      />
      <rect className="historical-map-tint" width="1200" height="760" fill="url(#historical-map-tint)" />
      <rect width="1200" height="760" fill="url(#grid)" />

      {theater === 'asia' && (
        <g className="map-frame-boundaries" aria-hidden="true">
          {historicalMapFrames.asia.filter((frame) => frame.id !== 'main').map((frame) => (
            <rect key={frame.id} x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx="2" />
          ))}
        </g>
      )}

      <g className="control-zones" aria-hidden="true">
        {territories.filter((territory) => territory.controller !== 'neutral').map((territory) => (
          <circle key={territory.id} className={territory.controller} cx={territoryPositions[territory.id].x} cy={territoryPositions[territory.id].y} r={12 + territory.value * 1.25} />
        ))}
      </g>
      <g className="map-routes" aria-hidden="true">
        {visibleConnections.map(({ from, to, isFront }) => {
          const selectedRoute = from.id === selectedTerritoryId || to.id === selectedTerritoryId;
          const validPlanRoute = planningMode && ((from.id === planningOriginId && validTargetIds.has(to.id)) || (to.id === planningOriginId && validTargetIds.has(from.id)));
          const fromPoint = territoryPositions[from.id];
          const toPoint = territoryPositions[to.id];
          return (
            <line
              key={`${from.id}-${to.id}`}
              className={`${isFront ? 'front-contact' : ''}${selectedRoute ? ' selected-route' : ''}${validPlanRoute ? ' valid-plan-route' : ''}`}
              x1={fromPoint.x}
              y1={fromPoint.y}
              x2={toPoint.x}
              y2={toPoint.y}
            />
          );
        })}
      </g>

      {camera.zoom <= 2.1 && (
        <g className="front-group-labels" aria-label="활성 전선 명칭">
          {visibleFrontLabels.map(({ front, x, y, width }) => {
            if (!visibleMapLabelIds.has(`front:${front.id}`)) return null;
            return (
              <g key={front.id} className={front.status === '위기' ? 'danger' : front.status === '우세' ? 'good' : ''} transform={`translate(${x} ${y}) scale(${1 / camera.zoom})`}>
                <rect x={-width / 2} y={-12} width={width} height={24} rx={4} />
                <text y="4">{front.name}</text>
                <circle cx={-width / 2 + 8} cy={0} r={3} />
              </g>
            );
          })}
        </g>
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
        const originPoint = territoryPositions[origin.id];
        const targetPoint = territoryPositions[target.id];
        if (originPoint.frame !== targetPoint.frame) return null;
        const { x: x1, y: y1 } = originPoint;
        const { x: x2, y: y2 } = targetPoint;
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        return (
          <g className={`order-arrow stance-${order.stance ?? 'balanced'}`} key={order.divisionId + '-' + order.targetId + '-' + order.startedWeek}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <polygon points={(x2 - 12) + ',' + (y2 - 7) + ' ' + (x2 + 4) + ',' + y2 + ' ' + (x2 - 12) + ',' + (y2 + 7)} transform={'rotate(' + angle + ' ' + x2 + ' ' + y2 + ')'} />
          </g>
        );
      })}

      {territories.map((territory) => {
        const { x, y } = territoryPositions[territory.id];
        const group = divisionGroups[territory.id] ?? [];
        const selected = selectedTerritoryId === territory.id;
        const isPlanningOrigin = planningMode && planningOriginId === territory.id;
        const isValidTarget = planningMode && validTargetIds.has(territory.id);
        const isUnavailableTarget = planningMode && !isPlanningOrigin && !isValidTarget;
        const isOperationalHeadquarters = operationalHeadquarters?.territoryId === territory.id;
        const labelTier = territory.labelTier ?? 2;
        const markerPresentation = markerPresentations.get(territory.id)!;
        return (
          <g
            key={territory.id}
            className={'territory-marker label-tier-' + labelTier + ' site-' + (territory.siteType ?? 'region') + ' ' + territory.controller + (selected ? ' selected' : '') + (isOperationalHeadquarters ? ' operational-headquarters' : '') + (markerPresentation.secondary ? ' secondary-marker' : '') + (territory.supply < 50 ? ' low-supply' : '') + (isPlanningOrigin ? ' planning-origin' : '') + (isValidTarget ? ' valid-target' : '') + (isUnavailableTarget ? ' unavailable-target' : '')}
            transform={'translate(' + x + ' ' + y + ')'}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(territory.id)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onSelect(territory.id);
            }}
            aria-label={`${territory.name}, ${factionLabels[territory.controller]} 통제, ${territory.terrain}, 보급 ${territory.supply}%${isOperationalHeadquarters ? `, ${operationalHeadquarters.label}` : ''}`}
          >
            {isValidTarget && <circle className="valid-target-ring" r="30" />}
            {selected && <circle className="selection-ring" r="31" />}
            <circle className="territory-halo" r={territory.value > 8 ? 19 : 15} />
            <circle className="territory-core" r={territory.value > 8 ? 9 : 7} />
            {isOperationalHeadquarters && (
              <g className="operational-headquarters-badge" transform={`scale(${1 / camera.zoom})`} aria-hidden="true">
                <rect x="-63" y="-55" width="126" height="20" rx="3" />
                <text y="-41">{operationalHeadquarters.label}</text>
              </g>
            )}
            {markerPresentation.showDetailGlyph && <TerrainGlyph terrain={territory.terrain} />}
            {markerPresentation.showLabel && visibleMapLabelIds.has(`territory:${territory.id}`) && (
              <g className="territory-label" transform={`scale(${1 / camera.zoom})`}>
                <text className="territory-name" y="-19">{territory.name}</text>
                {layer === 'political' && territory.ownerId && <text className="layer-reading owner-reading" y="29">{getNation(territory.ownerId).code}</text>}
                {layer === 'supply' && <text className="layer-reading supply-reading" y="29">{territory.supply}%</text>}
                {layer === 'intelligence' && (
                  <text className="layer-reading intel-reading" y="35">
                    {territory.controller === 'axis' ? '추정 ' + Math.max(22, Math.min(99, Math.round(intelNetwork - territory.value + 18))) + '%' : '확인'}
                  </text>
                )}
              </g>
            )}
            {group.length > 0 && (
              <g className="unit-counter" transform={`translate(16 12) scale(${1 / camera.zoom})`} filter="url(#shadow)">
                <rect x="0" y="0" width="43" height="28" rx="3" />
                <text x="8" y="19">{typeMeta[group[0].type].symbol}</text>
                <text x="31" y="19" textAnchor="middle">{group.length}</text>
              </g>
            )}
          </g>
        );
      })}
      <rect className="map-vignette" width="1200" height="760" fill="url(#map-vignette)" pointerEvents="none" />
      <g className="compass" transform="translate(1110 650)">
        <circle r="38" /><path d="M0 -28 L7 0 0 28 -7 0 Z" /><text y="-46">N</text>
      </g>
    </svg>
  );
}

function CommandPanel({ game, territories, divisions, orders, battleStance, torchAuthorized, completedDecisions, onAuthorizeTorch, onDecision, onEmergencyBond, setGame, setDivisions, nation, role, career, historyTrajectory, playerFaction, activeTheater, onOpenHistory }: {
  game: GameState;
  territories: Territory[];
  divisions: Division[];
  orders: Order[];
  battleStance: BattleStance;
  torchAuthorized: boolean;
  completedDecisions: string[];
  onAuthorizeTorch: () => void;
  onDecision: (id: string, title: string, cost: number, effect: () => void) => void;
  onEmergencyBond: () => void;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  setDivisions: React.Dispatch<React.SetStateAction<Division[]>>;
  nation: NationProfile;
  role: CareerRole;
  career: CareerState;
  historyTrajectory: EmergentHistoryProfile;
  playerFaction: Exclude<Faction, 'neutral'>;
  activeTheater: TheaterId;
  onOpenHistory: () => void;
}) {
  const theaterTerritories = territories.filter((territory) => (territory.theater ?? 'europe') === activeTheater);
  const allFronts = deriveFrontSummaries(theaterTerritories, strategicFronts.filter((front) => front.theater === activeTheater), playerFaction);
  const displayedFronts = (allFronts.some((front) => front.activeContacts > 0) ? allFronts.filter((front) => front.activeContacts > 0) : allFronts).slice(0, 6).map((front) => ({
    ...front,
    detail: front.commandArea,
    strength: front.intensity,
    tone: front.status === '우세' ? 'good' : front.status === '위기' ? 'bad' : 'neutral',
    count: divisions.filter((division) => front.territoryIds.includes(division.territoryId)).length,
  }));
  const promotionThreshold = getPromotionThreshold(role.tier);
  const historyForceOrder: HistoryForce[] = ['military', 'industry', 'diplomacy', 'civic', 'liberation', 'intelligence'];
  return (
    <div className="command-grid">
      <section className="deck-section career-dossier">
        <div className="career-profile-mark" style={{ borderColor: nation.accent }}><NationFlag nationId={nation.id} size="large" decorative /></div>
        <div className="career-profile-copy"><span className="eyebrow">YOUR WARTIME CAREER</span><h3>{role.title}</h3><p>TIER {role.tier} · {role.scope} · {role.expectation}</p></div>
        <div className="career-meters">
          <div><span>평판</span><ProgressBar value={career.reputation} tone="gold" thin /><strong>{career.reputation}</strong></div>
          <div><span>지도부 신임</span><ProgressBar value={career.councilTrust} tone={career.councilTrust > 55 ? 'green' : 'axis'} thin /><strong>{career.councilTrust}</strong></div>
          <div><span>{role.tier === 1 ? '역사적 유산' : `TIER ${role.tier - 1} 승진 심사`}</span><ProgressBar value={role.tier === 1 ? career.legacy : career.experience / promotionThreshold * 100} thin /><strong>{role.tier === 1 ? `${career.legacy}%` : `${career.experience}/${promotionThreshold}`}</strong></div>
        </div>
        <div className="player-history-card history-flow-card" data-tour="history-flow">
          <div><span>LIVING HISTORY · {historyTrajectory.resolvedChoiceCount} CHOICES</span><strong>{historyTrajectory.title}</strong><small>{historyTrajectory.summary}</small></div>
          <div className="history-flow-forces" aria-label="현재 역사 압력">
            {historyForceOrder.map((force) => <div className={force === historyTrajectory.dominantForce ? 'dominant' : ''} key={force}><span>{historyForceLabels[force]}</span><strong>{historyTrajectory.forces[force]}</strong><i><b style={{ width: `${historyTrajectory.forces[force]}%` }} /></i></div>)}
          </div>
          <div className="history-flow-causes"><span>최근 원인</span>{historyTrajectory.influences.slice(0, 3).map((influence) => <p key={influence.id}><em>{influence.source}</em>{influence.label}</p>)}</div>
          <button onMouseEnter={() => void loadWorldHistoryAtlas()} onFocus={() => void loadWorldHistoryAtlas()} onClick={onOpenHistory}><Landmark size={15} /> 인과관계와 가능한 미래 보기</button>
        </div>
      </section>

      <section className="deck-section front-overview">
        <div className="deck-section-heading"><div><span className="eyebrow">THEATERS</span><h3>{activeTheater === 'asia' ? '아시아·태평양 전황' : '유럽·지중해 전황'}</h3></div><em>{theaterTerritories.filter((item) => item.controller === playerFaction).length}/{theaterTerritories.length} 지역 통제</em></div>
        <div className="front-list">
          {displayedFronts.map((front) => (
            <div className="front-row" key={front.name}>
              <i className={front.tone}><Swords size={15} /></i>
              <div><strong>{front.name}</strong><span>{front.detail}</span></div>
              <div className="front-force"><span>{front.count}개 사단 · 접촉 {front.activeContacts}</span><ProgressBar value={front.strength} tone={front.tone === 'good' ? 'green' : front.tone === 'bad' ? 'axis' : 'gold'} thin /></div>
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
          detail="현금·국가부채 동일 구매력 +240 · 안정도 -2%"
          cost={12}
          done={completedDecisions.includes('bonds')}
          onClick={() => onDecision('bonds', '전시 채권 발행', 12, onEmergencyBond)}
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
          const effectiveStance = order.stance ?? battleStance;
          const stanceLabel = effectiveStance === 'cautious' ? '신중' : effectiveStance === 'aggressive' ? '총력' : '균형';
          return (
            <div className="queued-order" key={order.divisionId + '-' + order.targetId + '-' + order.startedWeek}>
              <i>{index + 1}</i><div><strong>{division?.name}</strong><span>목표: {target?.name} · {stanceLabel} 공세</span></div><em>다음 주</em>
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

function ArmyPanel({ game, divisions, selectedDivision, selectedEquipmentName, selectedCommander, selectedCommanderDevelopment, commanders, territories, orders, battleStance, battleReports, onSelectDivision, onIssueOffensive, onAssignCommander, onTrain, onBattleStanceChange, onOpenBattleReport, onUnlockCommanderSkill, onRestCommander }: {
  game: GameState;
  divisions: Division[];
  selectedDivision: Division;
  selectedEquipmentName: string;
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
  const effectiveDivisionOrderStance = divisionOrder?.stance ?? battleStance;
  const divisionOrderStance = effectiveDivisionOrderStance === 'cautious' ? '신중한 공세' : effectiveDivisionOrderStance === 'aggressive' ? '총공세' : '균형 공세';
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
        {divisionOrder && <div className="active-order-notice"><Zap size={15} /><span>{territories.find((item) => item.id === divisionOrder.targetId)?.name} · {divisionOrderStance} 준비 중</span></div>}
        <div className="division-metrics">
          <Metric label="병력 전력" value={selectedDivision.strength} icon={<Users size={14} />} tone="green" />
          <Metric label="조직력" value={selectedDivision.organization} icon={<Shield size={14} />} />
          <Metric label="보급 상태" value={selectedDivision.supply} icon={<Cog size={14} />} tone="gold" />
          <Metric label="전투 경험" value={selectedDivision.experience} icon={<Star size={14} />} tone="gold" />
        </div>
        <div className="equipment-grid">
          <div><span>제식 장비 패키지</span><strong>{selectedEquipmentName}</strong><small>전투 계산 적용 중</small></div>
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
  const weeklyGains = calculateProductionGains(production, 1);
  return (
    <div className="industry-layout">
      <section className="deck-section production-table">
        <div className="deck-section-heading"><div><span className="eyebrow">WAR ECONOMY</span><h3>군수 생산 라인</h3></div><em>{used}/{factories} 공장 배정</em></div>
        <div className="factory-summary"><Factory size={20} /><div><strong>{factories - used}</strong><span>미배정 공장</span></div><ProgressBar value={used / factories * 100} tone="gold" /></div>
        {production.map((line) => (
          <div className="production-line" key={line.id}>
            <i>{line.icon}</i>
            <div className="production-name"><strong>{line.name}</strong><span>{line.category}{line.reliability ? ` · 신뢰성 ${line.reliability}` : ''}{line.unitCost ? ` · 비용 ${line.unitCost}` : ''}</span></div>
            <div className="efficiency"><span>생산 효율 {line.efficiency}%</span><ProgressBar value={line.efficiency} tone="green" thin /></div>
            <div className="output"><span>효율 반영 주간 생산</span><strong>{formatNumber(line.output * line.assigned / 5 * line.efficiency / 100)}</strong></div>
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
          <div><span>보병 장비</span><strong>{formatNumber(stockpile.infantryEquipment)}</strong><em className="good">+{formatNumber(weeklyGains.infantryEquipment)}/주</em></div>
          <div><span>중형 전차</span><strong>{formatNumber(stockpile.tanks)}</strong><em className="good">+{formatNumber(weeklyGains.tanks)}/주</em></div>
          <div><span>전투기</span><strong>{formatNumber(stockpile.aircraft)}</strong><em className="good">+{formatNumber(weeklyGains.aircraft)}/주</em></div>
          <div><span>수송선</span><strong>{formatNumber(stockpile.convoys)}</strong><em className={stockpile.convoys < 500 ? 'bad' : 'good'}>+{formatNumber(weeklyGains.convoys)}/주</em></div>
          <div><span>야포</span><strong>{formatNumber(stockpile.artillery)}</strong><em className="good">+{formatNumber(weeklyGains.artillery)}/주</em></div>
          <div><span>트럭</span><strong>{formatNumber(stockpile.trucks)}</strong><em className="good">+{formatNumber(weeklyGains.trucks)}/주</em></div>
        </div>
        <div className="convoy-warning"><AlertTriangle size={15} /><span><strong>{activeTheater === 'asia' ? '태평양 수송 손실' : '대서양 수송 손실'}</strong>{activeTheater === 'asia' ? '잠수함과 장거리 항공대 활동으로 수송 효율이 9% 감소했습니다.' : '잠수함 활동으로 수송 효율이 11% 감소했습니다.'}</span></div>
      </section>
    </div>
  );
}

const scientificLiaisons: Record<NationId, { initials: string; name: string; office: string; bonus: string }> = {
  britain: { initials: 'AT', name: '앨런 튜링', office: '정부암호학교 암호해독 연구자', bonus: '암호·계산 연구 연락망 · 진행 +2/주' },
  usa: { initials: 'VB', name: '버니바 부시', office: '과학연구개발국(OSRD) 국장', bonus: '산학 공동연구 연락망 · 진행 +2/주' },
  ussr: { initials: 'SI', name: '세르게이 일류신', office: '항공기 설계국 수석설계자', bonus: '항공·생산 연구 연락망 · 진행 +2/주' },
  germany: { initials: 'AS', name: '알베르트 슈페어', office: '군수·전쟁생산 담당 국가장관', bonus: '병기 표준화 연락망 · 진행 +2/주' },
  japan: { initials: 'JH', name: '호리코시 지로', office: '미쓰비시 항공기 설계자', bonus: '항공기 설계 연락망 · 진행 +2/주' },
  china: { initials: 'WW', name: '웡원하오', office: '지질학자·전시 경제행정가', bonus: '자원·군수 연구 연락망 · 진행 +2/주' },
  india: { initials: 'HB', name: '호미 J. 바바', office: '인도과학원 우주선 연구단', bonus: '기초과학 연구 연락망 · 진행 +2/주' },
  freefrance: { initials: 'FJ', name: '프레데리크 졸리오퀴리', office: '물리학자·프랑스 레지스탕스 연구자', bonus: '물리·산업 연구 연락망 · 진행 +2/주' },
  italy: { initials: 'UT', name: '우고 티베리오', office: '왕립해군사관학교 레이더 연구자', bonus: '레이더·해군 연구 연락망 · 진행 +2/주' },
  korea: { initials: 'CY', name: '최용덕', office: '한국광복군 항공·총무 간부', bonus: '연합 항공·기술 연락망 · 진행 +2/주' },
  vietnam: { initials: 'TD', name: '쩐다이응이아', office: '프랑스 체류 공학자·후일 군사기술자', bonus: '해외 공학 인재 연락망 · 진행 +2/주' },
  indonesia: { initials: 'SR', name: '삼 라툴랑이', office: '수학자·민족운동 지도자', bonus: '과학 교육·군도 행정망 · 진행 +2/주' },
  philippines: { initials: 'FD', name: '페 델 문도', office: '소아과 의사·전시 의료 활동가', bonus: '의료·인력 회복 연구망 · 진행 +2/주' },
};

function ResearchPanel({ nationId, research, weeklyGain, onToggle }: { nationId: NationId; research: ResearchProject[]; weeklyGain: number; onToggle: (id: string) => void }) {
  const activeCount = research.filter((project) => project.active).length;
  const liaison = scientificLiaisons[nationId];
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
                <div className="research-footer"><span>{project.complete ? '연구 완료' : project.active ? Math.round(percent) + '% 진행 중' : '대기 중'}</span><em>{project.complete ? '적용됨' : project.active ? Math.ceil((project.duration - project.progress) / weeklyGain) + '주' : '선택'}</em></div>
              </button>
            );
          })}
        </div>
      </section>
      <section className="deck-section science-advisor">
        <div className="advisor-portrait">{liaison.initials}</div>
        <span className="eyebrow">HISTORICAL SCIENTIFIC LIAISON</span>
        <h3>{liaison.name}</h3>
        <p>{liaison.office}. 실제 인물의 1942년 활동 영역을 연구 연락관 효과로 추상화했습니다.</p>
        <div className="advisor-bonus"><LockKeyhole size={16} /><span><strong>국가 연구 연락망</strong>{liaison.bonus}</span></div>
      </section>
    </div>
  );
}

function DiplomacyPanel({ game, relations, setRelations, setGame, notify, nation, completedDecisions, onDecision }: {
  game: GameState;
  relations: DiplomaticRelation[];
  setRelations: React.Dispatch<React.SetStateAction<DiplomaticRelation[]>>;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  notify: (message: string) => void;
  nation: NationProfile;
  completedDecisions: string[];
  onDecision: (id: string, title: string, cost: number, effect: () => void) => void;
}) {
  const influenceCost = 8;
  const agenda = getDiplomaticAgenda(nation.id);
  const outcome = getDiplomaticAgendaOutcome(nation.id);
  const agendaPartner = getNation(agenda.partnerNationId);
  const partnerRelation = relations.find((relation) => relation.id === agenda.partnerNationId)?.value ?? 0;
  const agendaReadiness = calculateAgendaReadiness(relations, game.politicalPower, agenda.partnerNationId);
  const weeksUntilAgenda = Math.max(0, agenda.initialWeeksUntil - game.week);
  const decisionId = `diplomatic-agenda-${nation.id}`;
  const agendaCompleted = completedDecisions.includes(decisionId);
  const agendaGates = [
    { label: '개최 시점', value: weeksUntilAgenda === 0 ? '도달' : `${weeksUntilAgenda}주 남음`, passed: weeksUntilAgenda === 0 },
    { label: `${agendaPartner.shortName} 관계`, value: `${partnerRelation} / ${outcome.requiredRelation}`, passed: partnerRelation >= outcome.requiredRelation },
    { label: '의제 준비도', value: `${agendaReadiness}% / ${outcome.requiredReadiness}%`, passed: agendaReadiness >= outcome.requiredReadiness },
    { label: '정치력', value: `${game.politicalPower} / ${outcome.cost}`, passed: game.politicalPower >= outcome.cost },
  ];
  const failedGate = agendaGates.find((gate) => !gate.passed);
  const canConveneAgenda = !agendaCompleted && !failedGate;
  const conveneAgenda = () => {
    if (agendaCompleted) return notify('이 외교 회담은 이미 완료되었습니다.');
    if (failedGate) return notify(`${failedGate.label} 조건을 먼저 충족해야 합니다.`);
    onDecision(decisionId, agenda.title, outcome.cost, () => {
      setGame((current) => applyDiplomaticAgendaReward(current, outcome.reward));
      setRelations((current) => current.map((country) => country.id === agenda.partnerNationId
        ? { ...country, value: Math.min(100, country.value + outcome.relationGain) }
        : country));
    });
  };
  const influence = (id: string, name: string) => {
    const relation = relations.find((country) => country.id === id);
    if (relation && relation.value >= 100) return notify(name + '과의 관계는 이미 최고 수준입니다.');
    if (game.politicalPower < influenceCost) return notify('정치력이 부족합니다.');
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - influenceCost }));
    setRelations((current) => current.map((country) => country.id === id ? { ...country, value: Math.min(100, country.value + 7) } : country));
    notify(name + '과의 관계가 개선되었습니다.');
  };
  return (
    <div className="diplomacy-layout">
      <section className="deck-section diplomatic-list">
        <div className="deck-section-heading"><div><span className="eyebrow">FOREIGN OFFICE</span><h3>외교 관계</h3></div><em>{game.politicalPower} 정치력</em></div>
        {relations.map((country) => {
          const relationNation = nations.find((candidate) => candidate.id === country.id);
          const flag = relationNation ? getHistoricalFlag(relationNation.id) : null;
          const atMaximum = country.value >= 100;
          const lacksPoliticalPower = game.politicalPower < influenceCost;
          const actionLabel = atMaximum ? '관계 최대' : lacksPoliticalPower ? '정치력 부족' : '영향력 행사';
          return (
            <div className="country-row" key={country.id}>
              {relationNation ? <NationFlag nationId={relationNation.id} size="compact" /> : <i style={{ background: country.color }}>{country.code}</i>}
              <div><strong>{country.name}</strong><span>{country.status}</span>{flag && <small>{flag.shortLabel} · {flag.kindLabel}</small>}</div>
              <div className="relation-meter"><span>관계 {country.value}</span><ProgressBar value={country.value} tone={country.value > 70 ? 'green' : country.value > 40 ? 'gold' : 'axis'} thin /></div>
              <button disabled={atMaximum || lacksPoliticalPower} title={atMaximum ? '관계 수치가 이미 100입니다.' : lacksPoliticalPower ? `정치력 ${influenceCost}이 필요합니다.` : '정치력으로 관계를 7 개선합니다.'} onClick={() => influence(country.id, country.name)}>{actionLabel} {!atMaximum && !lacksPoliticalPower && <small>{influenceCost}</small>}</button>
            </div>
          );
        })}
      </section>
      <section className={'deck-section summit-card' + (agendaCompleted ? ' completed' : '')}>
        <div className="summit-flag-pair"><NationFlag nationId={nation.id} size="standard" /><Handshake size={18} /><NationFlag nationId={agendaPartner.id} size="standard" /></div>
        <span className="eyebrow">{agenda.basis === 'documented-conference' ? 'DOCUMENTED CONFERENCE' : 'HISTORICAL-ANCHOR AGENDA'}</span>
        <h3>{agenda.title}</h3>
        <small className="summit-participants">{agenda.participants}</small>
        <p>{agenda.detail}</p>
        <div className="summit-anchor"><BookOpen size={14} /><span>{agenda.historicalAnchor}</span></div>
        <div className="summit-date"><Clock3 size={15} /><span>{weeksUntilAgenda === 0 ? '개최 가능' : `${weeksUntilAgenda}주 후`} · {agenda.location}</span></div>
        <div className="agenda"><span>의제 준비도</span><strong>{agendaReadiness}%</strong><ProgressBar value={agendaReadiness} tone={agendaReadiness >= outcome.requiredReadiness ? 'green' : 'gold'} /></div>
        <div className="summit-outcome"><span>회담 타결 효과</span><strong>{outcome.effectLabel}</strong><small>상대국 관계 +{outcome.relationGain} · 캠페인당 1회</small></div>
        <div className="summit-requirements" aria-label="회담 개최 조건">
          {agendaGates.map((gate) => <div className={gate.passed ? 'passed' : ''} key={gate.label}>{gate.passed ? <CheckCircle2 size={12} /> : <LockKeyhole size={12} />}<span>{gate.label}</span><strong>{gate.value}</strong></div>)}
        </div>
        <button className="summit-convene-button" type="button" disabled={!canConveneAgenda} onClick={conveneAgenda} title={agendaCompleted ? '이미 타결된 회담입니다.' : failedGate ? `${failedGate.label} 조건이 부족합니다.` : `${outcome.cost} 정치력으로 회담을 개최합니다.`}>
          {agendaCompleted ? <><CheckCircle2 size={15} /> 회담 타결 완료</> : <><Handshake size={15} /> {failedGate ? `${failedGate.label} 보완 필요` : '의제 확정 · 회담 개최'}<small>{outcome.cost} PP</small></>}
        </button>
      </section>
    </div>
  );
}

function IntelligencePanel({ game, operations, setOperations, setGame, notify, addEvent, nation, role, activeTheater, intelligenceHistory }: {
  game: GameState;
  operations: CovertOperation[];
  setOperations: React.Dispatch<React.SetStateAction<CovertOperation[]>>;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  notify: (message: string) => void;
  addEvent: (title: string, detail: string, tone: WarEvent['tone'], week: number) => void;
  nation: NationProfile;
  role: CareerRole;
  activeTheater: TheaterId;
  intelligenceHistory: ResolvedIntelligenceOrganization[];
}) {
  const leadOperation = operations[0];
  const operationCost = role.branch === 'intelligence' ? 7 : 10;
  const currentYear = 1942 + Math.floor(game.week / 52);
  const relevantOrganizations = intelligenceHistory.filter((organization) => organization.nationIds.includes(nation.id));
  const activeOrganizations = relevantOrganizations.filter((organization) => organization.appearanceYear <= currentYear && (!organization.dissolvedYear || organization.dissolvedYear >= currentYear));
  const nextOrganization = relevantOrganizations.find((organization) => organization.appearanceYear > currentYear);
  const launchOperation = () => {
    if (!leadOperation) return notify('실행 가능한 정보 작전이 없습니다.');
    if (game.politicalPower < operationCost) return notify('정보 작전에 필요한 정치력이 부족합니다.');
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - operationCost, intelNetwork: Math.min(100, current.intelNetwork + 4) }));
    setOperations((current) => current.map((operation, index) => index === 0 ? { ...operation, progress: 100 } : operation));
    addEvent('정보 작전 성공 — ' + leadOperation.name, leadOperation.region + '에서 준비한 공작이 목표를 달성했습니다. 정보망이 확장됩니다.', 'good', game.week);
    notify(leadOperation.name + ' 작전이 성공했습니다.');
  };
  return (
    <div className="intel-layout">
      <section className="deck-section operation-list">
        <div className="deck-section-heading"><div><span className="eyebrow">{role.archetype === 'resistance' ? 'RESISTANCE NETWORK' : 'SPECIAL OPERATIONS'}</span><h3>{role.title} · 비밀 작전</h3></div><em>{role.coverIdentity}</em></div>
        {operations.map((operation) => (
          <div className="covert-row" key={operation.id}>
            <i>{operation.icon === 'radio' ? <Radio size={19} /> : operation.icon === 'eye' ? <Eye size={19} /> : <Crosshair size={19} />}</i>
            <div className="covert-name"><strong>{operation.name}</strong><span>{operation.region}</span></div>
            <div className="covert-progress"><span>준비도 {operation.progress}%</span><ProgressBar value={operation.progress} tone={operation.risk > 40 ? 'gold' : 'green'} thin /></div>
            <span className={'risk ' + (operation.risk > 40 ? 'medium' : 'low')}>위험 {operation.risk}%</span>
          </div>
        ))}
        <button className="launch-intel" onClick={launchOperation}><Zap size={15} /> 최우선 작전 실행 <span>{operationCost} 정치력</span></button>
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
      <section className="deck-section intelligence-institutions">
        <div className="deck-section-heading">
          <div><span className="eyebrow">INSTITUTIONAL LINEAGE · {currentYear}</span><h3>{nation.shortName} 정보기관 계보</h3></div>
          <em>{activeOrganizations.length}개 활동 · {relevantOrganizations.length}개 역사 분기</em>
        </div>
        <div className="intelligence-institution-grid">
          {activeOrganizations.slice(0, 6).map((organization) => (
            <article className={organization.kind === 'political-police' ? 'danger' : ''} key={organization.id}>
              <span>{organization.appearanceYear}{organization.dissolvedYear ? `–${organization.dissolvedYear}` : '–'} · {organization.abbreviation}</span>
              <strong>{organization.displayName}</strong>
              <p>{organization.doctrine}</p>
              <small>{organization.figures.length > 0 ? organization.figures.slice(0, 3).map((figure) => figure.name).join(' · ') : '등장 인물은 향후 사건에서 공개'}</small>
              <em>{organization.ethicalRisk}</em>
            </article>
          ))}
          {activeOrganizations.length === 0 && <div className="intelligence-institution-empty">현재 활동 가능한 중앙 조직이 없습니다. 레지스탕스·군 연락망을 키우거나 역사 분기를 기다리십시오.</div>}
          {nextOrganization && (
            <article className="future">
              <span>NEXT · {nextOrganization.appearanceYear}</span>
              <strong>{nextOrganization.displayName}</strong>
              <p>{nextOrganization.variantTitle}</p>
              <small>{nextOrganization.historicalBasis}</small>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

function CampaignOutcomeModal({ outcome, game, territories, nation, playerFaction, ending, endingCount, onJournal, onWorldHistory, onContinueNation, onRestart }: {
  outcome: Exclude<CampaignOutcome, null>;
  game: GameState;
  territories: Territory[];
  nation: NationProfile;
  playerFaction: Exclude<Faction, 'neutral'>;
  ending: ResolvedHistoricalEnding;
  endingCount: number;
  onJournal: () => void;
  onWorldHistory: () => void;
  onContinueNation: () => void;
  onRestart: () => void;
}) {
  const controlledTerritories = territories.filter((territory) => territory.controller === playerFaction).length;
  const isVictory = outcome === 'victory';
  return (
    <div className={'outcome-backdrop ' + outcome}>
      <section className="outcome-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-outcome-title">
        <div className="outcome-seal">{isVictory ? <Star size={34} /> : <ShieldAlert size={34} />}</div>
        <span className="eyebrow">{nation.code} NATIONAL COMMAND · FINAL COMMUNIQUÉ</span>
        <h1 id="campaign-outcome-title">{isVictory ? ending.title : `당신이 떠난 뒤 · ${ending.title}`}</h1>
        <p>{isVictory ? '원래 역사에는 없던 세력 균형이 탄생했습니다. 이제 당신이 선택한 국가 진로가 전후 세계의 규칙이 됩니다.' : '전쟁 수행 능력과 지도부 신임이 임계점 아래로 떨어졌습니다. 다음 커리어에서는 다른 보직과 국가 진로를 선택할 수 있습니다.'}</p>
        <div className="outcome-ending">
          <span>{endingCount}개 사료 기반 결말 중 도달 · 적합도 {ending.fitScore}</span>
          <strong>{ending.orderName} · {ending.settlementName} · {ending.horizonName}</strong>
          <p>{ending.summary}</p>
        </div>
        <div className="outcome-stats">
          <div><span>최종 전황</span><strong>{game.victoryScore}</strong></div>
          <div><span>통제 지역</span><strong>{controlledTerritories}/{territories.length}</strong></div>
          <div><span>지휘 기간</span><strong>{game.week + 1}주</strong></div>
          <div><span>전쟁 지지도</span><strong>{game.warSupport}%</strong></div>
        </div>
        <div className="outcome-actions">
          <button onClick={onJournal}><BookOpen size={15} /> 진행 결과 분석</button>
          <button onClick={onWorldHistory}><Landmark size={15} /> 전후 세계선 설계</button>
          {isVictory && <button className="primary continue-nation" onClick={onContinueNation}><Landmark size={15} /> 이 세계선에서 국가 운영 계속</button>}
          <button className={isVictory ? '' : 'primary'} onClick={onRestart}><RotateCcw size={15} /> 새 캠페인</button>
        </div>
      </section>
    </div>
  );
}
