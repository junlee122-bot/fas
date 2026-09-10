import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
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
  Fingerprint,
  FlaskConical,
  Fuel,
  GitBranch,
  Handshake,
  Landmark,
  Lightbulb,
  LayoutDashboard,
  LockKeyhole,
  Map,
  Maximize2,
  Menu,
  Minus,
  MoreHorizontal,
  Newspaper,
  Pause,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Plus,
  Radio,
  Radar,
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
  Wrench,
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
  CampaignStartMode,
  CareerRole,
  CareerState,
  CivilianOriginId,
  CivilianProfessionId,
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
  WeaponMaintenanceDoctrine,
  WeaponModernizationPriority,
  WeaponReplacementPolicy,
  WeaponWorkOrderType,
} from './types';
import type { CampaignOutcome } from './types';
import { calculateProductionGains } from './engine';
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
import { EnemyIntentBrief } from './EnemyIntentBrief';
import {
  advanceEnemyStrategyWeek,
  createEnemyStrategyState,
  deriveEnemyIntentReport,
  normalizeEnemyStrategyState,
} from './enemyStrategy';
import type { EnemyStrategyState } from './enemyStrategy';
import { CommandDesk } from './CommandDesk';
import { WeeklyBriefingDialog } from './WeeklyBriefingDialog';
import { RoleMandateDesk } from './RoleMandateDesk';
import { getDirectRoleTabs, getRoleTabMandates } from './roleMandate';
import {
  advanceRoleCommandWeek,
  applyRoleDelegations,
  createRoleCommandState,
  defyRoleAuthority,
  getActiveRoleRequest,
  getRoleCommandChainProfile,
  getRoleOperationalScope,
  normalizeRoleCommandState,
  persuadeRoleAuthority,
  recordRoleInteraction,
  recordRoleActionEvidence,
  submitRoleAuthorityRequest,
} from './roleCommand';
import type { RoleCommandState, RoleOperationalScope, RolePersuasionStrategy } from './roleCommand';
import { inferGameAudioCue, playGameAudioCue } from './gameAudio';
import { withJosa } from './koreanGrammar';
import {
  getNationalProgram,
  getNationalProgramMilestoneMarker,
  getNationalProgramPulse,
  getNationalProgramReviewMarker,
  getNationalProgramStartedWeek,
  getNationalProgramStartMarker,
  nationalProgramToneMeta,
} from './nationalPrograms';
import { CivilianCareerPanel } from './CivilianCareerPanel';
import { MapControlCenter } from './MapControlCenter';
import { GameIcon } from './GameIcon';
import type { GameIconName, GameIconTone } from './GameIcon';
import { NationFlag } from './NationFlag';
import {
  applyArmsPolicyReviewToPortfolio,
  applyProcurementToPortfolio,
  applyStrategicPolicyRelations,
  applyStrategicPolicyReward,
  applyStrategicPolicyToPortfolio,
  armsDiplomacyPolicies,
  createArmsPortfolioState,
  fundEmergencyArmsStockpile,
  getArmsPolicyReviewedMarker,
  getArmsPolicyReviewMarker,
  getEquipmentProcurementQuote,
  getStrategicDecisionId,
  getStrategicStage,
  normalizeArmsPortfolioState,
  parseArmsPolicyReviewMarker,
  type AcquisitionRoute,
  type ArmsDiplomacyPolicy,
  type ArmsPortfolioState,
} from './strategicArmsDiplomacy';
import { diplomacyFeedbackPrecisionNote, formatDiplomacyFeedbackEffects, getArmsPolicyFeedback, getEmergencyStockpileFeedback, getSummitFeedback } from './diplomacyFeedback';
import {
  applyCivilizationEconomyEffects,
  applyCivilizationNationEffects,
  applyCivilizationPublicHealthEffects,
  civilizationDomainDefinitions,
  getCivilizationDecisionPrefix,
  getCivilizationEffectLabels,
  getCivilizationPaths,
  getCivilizationProgram,
  getCivilizationReviewedMarker,
  getCivilizationReviewMarker,
  parseCivilizationReviewMarker,
  type CivilizationPath,
  type CivilizationProgram,
} from './civilizationSystems';
import { CouncilEventModal } from './CouncilEventModal';
import { councilEvents, selectNextCouncilEvent, strategicPolicies } from './choices';
import { forecastBattle } from './combat';
import type { BattleForecast } from './combat';
import { battleTypeProfiles, createOperationOrder, getOperationOrderId, getOperationProgress, normalizeOperationOrders, normalizeOperationStopReceipts, requestLandOperationStop } from './operations';
import type { OperationStopReceipt } from './operations';
import { FieldWorkspaceSwitch } from './FieldWorkspaceSwitch';
import { configureRegionalIndustry, createRegionalIndustryState, getRegionalIndustryAccount, normalizeRegionalIndustry, planRegionalShipment, cancelRegionalReservedShipment, regionalEquipmentLabels } from './regionalIndustry';
import type { RegionalIndustryConfiguration, RegionalIndustryContext } from './regionalIndustry';
import { combineStockpileDeltas, regionalEquipmentProductionCoverage, settleRegionalIndustryDelivery } from './regionalIndustrySettlement';
import { createStaffDeliveryPledgeState, normalizeStaffDeliveryPledges, createStaffDeliveryPledge, advanceStaffDeliveryPledges, buildStaffDeliveryReceipts } from './staffDeliveryPledges';
import type { StaffDeliveryPledgeContext, StaffDeliveryPledgeCommand } from './staffDeliveryPledges';
import { StaffDeliveryCheckIn, StaffDeliveryPledgeBoard } from './StaffDeliveryPledgeBoard';
import { ProductionDesk } from './ProductionDesk';
import { ResearchDesk } from './ResearchDesk';
import { LandForceRoster } from './LandForceRoster';
import './CapabilityDesks.css';
import { resolveLandOrdersWeek } from './landOperations';
import { getCampaignDateForWeek, getCampaignYearForWeek } from './campaignCalendar';
import { BattleReportModal } from './BattleReportModal';
import { BattleDoctrinePanel } from './BattleDoctrinePanel';
import { FrontOperationsBoard } from './FrontOperationsBoard';
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
import { weeklyRivalInterest } from './recruitment';
import { advanceCandidateScouting, assessPersonnelAction, confirmPersonnelReview, createPersonnelReview, createPersonnelReviewGate, normalizeCandidateScoutingRoster } from './personnelActions';
import type { PersonnelAction, PersonnelActionResult } from './personnelActions';
import type { RecruitmentOffer } from './recruitment';
import { advanceStaffRosterWeek, getStaffContractWeeks, getStaffMeetingOption, getStaffRenewalCost, resolveStaffMeeting } from './staffManagement';
import type { StaffMeetingTopic } from './staffManagement';
import { advanceStaffNarrativeWeek, createStaffNarrativeState, getStaffNarrativeOptions, normalizeStaffNarrativeState, resolveStaffNarrativeDecision } from './staffNarrative';
import type { StaffNarrativeState } from './staffNarrative';
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
  equipmentCategoryLabels,
  getDevelopedEquipment,
  getEquipmentModule,
  getEquipmentNode,
  normalizeEquipmentDevelopment,
} from './equipment';
import {
  advanceWeaponReadinessWeek,
  queueWeaponWorkOrder,
  transitionWeaponReadinessEquipment,
  weaponMaintenanceDoctrineDefinitions,
  weaponReplacementPolicyDefinitions,
  weaponWorkOrderDefinitions,
} from './weaponReadiness';
import { clampMapCamera, DEFAULT_MAP_CAMERA, deriveFrontLabelAnchors, deriveFrontSummaries, deriveMapConnections, deriveMapMarkerPresentation, deriveSameFrameMapConnections, deriveValidTargetIds, deriveVisibleMapLabelIds, getTerrainGlyphKind, MAX_MAP_ZOOM } from './mapPresentation';
import type { FrontSummary, MapCamera, MapLabelMode } from './mapPresentation';
import { recognizeBattle } from './frontLegacy';
import { getHistoricalMapPlacement, getHistoricalMapPoint, historicalMapFrames, historicalMapSources } from './historicalMaps';
import { getDefaultMapRegion, getMapRegion, getMapRegionForTerritory, getMapRegionsForTheater, getTerritoriesForMapRegion } from './mapRegions';
import { deriveStrategicFrontChronology, getPeriodAppropriateTerritory, strategicFronts } from './strategicMapData';
import { achievementDefinitions, evaluateAchievements, getAchievement, getAchievementRecommendations, normalizeAchievementUnlocks, normalizeTrackedAchievementId } from './achievements';
import type { AchievementUnlock } from './achievements';
import { createWorldHistorySeed, generateWorldline, normalizeWorldHistoryState } from './worldHistory';
import type { WorldHistoryState } from './worldHistory';
import { deriveEmergentHistory, historyForceLabels } from './emergentHistory';
import type { EmergentHistoryProfile, HistoryForce } from './emergentHistory';
import { createWorldChangeBaseline, deriveWorldChangeProfile, getTerritoryWorldChange, normalizeWorldChangeBaseline } from './worldChangeVisualization';
import type { WorldChangeBaseline, WorldChangeProfile } from './worldChangeVisualization';
import {
  advanceCivilianCareerWeek,
  createCivilianCareerState,
  enterCivilianInstitution,
  getCivilianCareerSignature,
  getCivilianInstitutionReadiness,
  getCivilianProfession,
  getCivilianRoleId,
  getCivilianStageLabel,
  resolveCivilianAction,
} from './civilianCareer';
import { WorldFlashpointModal } from './WorldFlashpointModal';
import {
  createWorldFlashpointSelection,
  deriveWorldFlashpointEffects,
  forecastNextWorldFlashpoint,
  getHistoricalHorizon,
  getWorldFlashpointDecisionId,
  selectNextWorldFlashpoint,
  WORLD_FLASHPOINT_INTERVAL_WEEKS,
} from './worldFlashpoints';
import { advanceResearchProjects, getNewlyAvailableResearch, getResearchAvailability, normalizeResearchProjects } from './researchProgression';
import type { ResolvedHistoricalEnding } from './historicalEndings';
import { createEmergentIntelligenceCandidates } from './intelligenceHistory';
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
import { advanceEconomyMarketWeek, advanceEconomyWeek, buyIndustrialStake, calculateEconomyLedger, createEconomyState, historicalCompanies, normalizeEconomyState, sellIndustrialStake } from './economy';
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
  resolveNationAgendaChoice,
} from './nationManagement';
import type { CampaignPhase, NationBudgetDomain, NationStrategyId, NationTransitionReason } from './nationManagement';
import type { NationAgendaChoiceId } from './nationDevelopment';
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
import {
  beginPersonalRelationship,
  chooseFamilyPlan,
  configurePersonalIdentity,
  formalizePersonalUnion,
  getPersonalRelationshipCandidates,
  getPersonalLifeActivityAvailability,
  reformFamilyLaw,
  resolvePersonalLifeAction,
} from './personalLife';
import type {
  FamilyLawId,
  FamilyPlanId,
  PersonalIdentityProfile,
  PersonalLifeActionId,
  PersonalLifeActionResult,
  PersonalLifeContext,
  RelationshipVisibility,
  UnionForm,
} from './personalLife';
import {
  advanceMediaRelationsWeek,
  reformMediaLaw,
  requestPressInterview,
  resolveExposureIncident,
  respondToInterview,
} from './mediaRelations';
import {
  advanceJusticeWeek,
  openJusticeCase,
  resolveJusticeDecision,
} from './justiceSystem';
import type {
  JusticeActionResult,
  JusticeContext,
  JusticeDecisionOptionId,
} from './justiceSystem';
import {
  activateConstitutionalFounding,
  advanceConstitutionalJudiciaryWeek,
  nominateJudicialCandidate,
  ratifyConstitution,
  resolveJudicialNomination,
  selectConstitutionClause,
} from './constitutionalJudiciary';
import type {
  ConstitutionalActionResult,
  ConstitutionalContext,
  JudicialOfficeId,
  NominationDecisionId,
  RatificationMethodId,
} from './constitutionalJudiciary';
import { advanceSovereignPowersWeek, exerciseSovereignPower } from './sovereignPowers';
import type { SovereignPowerActionResult, SovereignPowerContext, SovereignPowerId } from './sovereignPowers';
import type {
  ExposureResponseId,
  InterviewResponseId,
  MediaActionResult,
  MediaLawId,
  MediaRelationsContext,
  MediaTopicId,
} from './mediaRelations';
import {
  advancePowerNetworkWeek,
  makeBlocPromise,
  manageRival,
  resolvePowerOpportunity,
  selectLegacyPath,
  setLeadershipPrinciples,
} from './powerNetwork';
import type {
  LeadershipPrincipleId,
  LegacyPathId,
  OpportunityChoiceId,
  PowerBlocId,
  PowerNetworkActionResult,
  PowerNetworkContext,
  RivalActionId,
} from './powerNetwork';
import {
  advanceStrategicSagaWeek,
  chooseSagaApproach,
  commitSagaReserve,
  startStrategicSaga,
} from './strategicSaga';
import type {
  SagaActionResult,
  SagaApproachId,
  SagaChampion,
  StrategicSagaContext,
} from './strategicSaga';
import {
  advanceSocialistWorldWeek,
  chooseSocialistSettlement,
  chooseSocialistTransitionMethod,
  startSocialistTransition,
} from './socialistWorld';
import type {
  SocialistActionResult,
  SocialistModelId,
  SocialistSettlementId,
  SocialistTransitionMethodId,
  SocialistTransitionSponsor,
  SocialistWorldContext,
} from './socialistWorld';
import { applyElectionCampaignAction, launchReferendum } from './electoralPolitics';
import type { ElectionCampaignActionId, ElectoralActionResult, ElectoralContext, ReferendumTopicId } from './electoralPolitics';
import {
  launchNationalPlan,
  launchStrategicOperation,
  nationalPlanDefinitions,
  strategicOperationDefinitions,
  type NationalPlanId,
  type NationalPlanMetrics,
} from './strategicContinuity';
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
import type { NationalSimulationInput } from './nationalSimulation';
import { LivingWorldScene } from './LivingWorldScene';
import { reallocateFactory, formatSupplyContribution, selectLivingWorldRecords } from './livingWorld';
import { deriveNationalEconomyFeedback } from './nationalEconomyFeedback';
import { deriveStaffPlayEvidence } from './staffPlayEvidence';
import { advancePostwarIndustryWeek, createPostwarIndustryState, forecastPostwarIndustry, normalizePostwarIndustryState, postwarIndustryPolicyDefinitions, getPostwarProductionLineEquipment } from './postwarIndustry';
import type { PostwarIndustryInput, PostwarIndustryReport } from './postwarIndustry';
import { mergePostwarIndustrySettlement, normalizePostwarIndustrySettings, postwarMaterialQuotes, purchasePostwarMaterial, reservePostwarIndustryResources } from './postwarIndustrySettlement';
import type { PostwarIndustrySettings } from './postwarIndustrySettlement';
import { advancePostwarEquipmentWeek } from './postwarEquipment';
import { PostwarIndustryBoard } from './PostwarIndustryBoard';
import {
  careerAffiliationLabels,
  createCareerMarketState,
  evaluateForeignCareerOffers,
  initiateCareerApproach,
  markCareerDismissed,
  normalizeCareerMarketState,
  respondToCareerOffer,
} from './careerMarket';
import type {
  CareerApproachKind,
  CareerMarketState,
  CareerMarketContext,
  CareerOfferResponse,
  ForeignCareerOffer,
} from './careerMarket';
import {
  advanceClandestineCareerWeek,
  respondToClandestineIncident,
  respondToClandestineMission,
  setClandestinePosture,
} from './clandestineCareer';
import type {
  ClandestineIncidentResponse,
  ClandestineMissionResponse,
  ClandestinePosture,
} from './clandestineCareer';
import type { CareerMarketView } from './CareerMarketCenter';
import { assessKoreaLiberationReadiness } from './koreaExperience';
import {
  advanceJointOperationsWeek,
  createJointForcesState,
  jointDoctrineDefinitions,
  jointOperationTemplates,
  launchJointOperation,
  getCompletedCloseAirSupport,
  normalizeJointForcesState,
  respondToJointCommandMessage,
  sendJointForceToRefit,
  setJointDoctrine,
} from './jointOperations';
import type { JointCommandResponse, JointDoctrine, JointForcesState } from './jointOperations';
import type { JointOperationsView } from './JointOperationsBoard';
import {
  assessStrategicCadence,
  buildStrategicAdvanceReport,
  createStrategicAdvanceSession,
  getStrategicTimeAdvanceOptions,
  normalizeStrategicAdvanceReport,
  shouldInterruptNationAdvance,
} from './timeCadence';
import type {
  StrategicAdvanceReport,
  StrategicAdvanceSession,
  StrategicAdvanceSnapshot,
  StrategicAdvanceWeeks,
} from './timeCadence';

const loadOrganizationPanel = () => import('./OrganizationPanel');
const loadCareerMarketCenter = () => import('./CareerMarketCenter');
const loadEquipmentLab = () => import('./EquipmentLab');
const loadFieldManual = () => import('./FieldManual');
const loadTutorialOverlay = () => import('./TutorialOverlay');
const loadAchievementGallery = () => import('./AchievementGallery');
const loadWorldHistoryAtlas = () => import('./WorldHistoryAtlas');
const loadPublicHealthCenter = () => import('./PublicHealthCenter');
const loadDiplomacyDesk = () => import('./DiplomacyDesk');
const loadIntelligenceDesk = () => import('./IntelligenceDesk');
const loadEconomicMinistry = () => import('./EconomicMinistry');
const loadWorldWeekly = () => import('./WorldWeekly');
const loadNationManagementPanel = () => import('./NationManagementPanel');
const loadJointOperationsBoard = () => import('./JointOperationsBoard');
const loadTimeCommandCenter = () => import('./TimeCommandCenter');
const loadOperationFieldBoard = () => import('./OperationFieldBoard');
const loadStaffMeetingRoom = () => import('./StaffMeetingRoom');
const loadRegionalIndustryBoard = () => import('./RegionalIndustryBoard');
const OperationFieldBoard = lazy(() => loadOperationFieldBoard().then((module) => ({ default: module.OperationFieldBoard })));
const StaffMeetingRoom = lazy(() => loadStaffMeetingRoom().then((module) => ({ default: module.StaffMeetingRoom })));
const RegionalIndustryBoard = lazy(() => loadRegionalIndustryBoard().then((module) => ({ default: module.RegionalIndustryBoard })));
const OrganizationPanel = lazy(() => loadOrganizationPanel().then((module) => ({ default: module.OrganizationPanel })));
const EquipmentLab = lazy(() => loadEquipmentLab().then((module) => ({ default: module.EquipmentLab })));
const FieldManual = lazy(() => loadFieldManual().then((module) => ({ default: module.FieldManual })));
const TutorialOverlay = lazy(() => loadTutorialOverlay().then((module) => ({ default: module.TutorialOverlay })));
const AchievementGallery = lazy(() => loadAchievementGallery().then((module) => ({ default: module.AchievementGallery })));
const WorldHistoryAtlas = lazy(() => loadWorldHistoryAtlas().then((module) => ({ default: module.WorldHistoryAtlas })));
const PublicHealthCenter = lazy(() => loadPublicHealthCenter().then((module) => ({ default: module.PublicHealthCenter })));
const DiplomacyDesk = lazy(() => loadDiplomacyDesk().then((module) => ({ default: module.DiplomacyDesk })));
const IntelligenceDesk = lazy(() => loadIntelligenceDesk().then((module) => ({ default: module.IntelligenceDesk })));
const EconomicMinistry = lazy(() => loadEconomicMinistry().then((module) => ({ default: module.EconomicMinistry })));
const WorldWeekly = lazy(() => loadWorldWeekly().then((module) => ({ default: module.WorldWeekly })));
const NationManagementPanel = lazy(() => loadNationManagementPanel().then((module) => ({ default: module.NationManagementPanel })));
const CareerMarketCenter = lazy(() => loadCareerMarketCenter().then((module) => ({ default: module.CareerMarketCenter })));
const JointOperationsBoard = lazy(() => loadJointOperationsBoard().then((module) => ({ default: module.JointOperationsBoard })));
const TimeCommandCenter = lazy(() => loadTimeCommandCenter().then((module) => ({ default: module.TimeCommandCenter })));

function preloadGameTab(tab: GameTab) {
  if (tab === 'organization') void loadOrganizationPanel();
  if (tab === 'research') void loadEquipmentLab();
  if (tab === 'health') void loadPublicHealthCenter();
  if (tab === 'diplomacy') void loadDiplomacyDesk();
  if (tab === 'intelligence') void loadIntelligenceDesk();
  if (tab === 'economy') void loadEconomicMinistry();
  if (tab === 'governance') void loadNationManagementPanel();
  if (tab === 'army') void loadJointOperationsBoard();
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
  history: { label: '살아있는 세계', description: '캠페인 시작 뒤 통제권·도시 복구·파괴가 실제로 달라진 곳을 표시합니다.', key: '5' },
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
  const date = getCampaignDateForWeek(week);
  return {
    full: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date),
    day: new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(date),
  };
}

function createStrategicAdvanceSnapshotFromState(
  game: GameState,
  nation: { mandateScore: number; unrest: number; nationalScore: number },
  economy: { publicConfidence: number; inflation: number },
): StrategicAdvanceSnapshot {
  return {
    week: game.week,
    treasury: game.treasury,
    stability: game.stability,
    mandate: nation.mandateScore,
    unrest: nation.unrest,
    nationalScore: nation.nationalScore,
    publicConfidence: economy.publicConfidence,
    inflation: economy.inflation,
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
        <span className="resource-label" data-compact-label={compactLabel}>{compactLabel}</span>
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
  const [armsPortfolio, setArmsPortfolio] = useState<ArmsPortfolioState>(() => createArmsPortfolioState(DEFAULT_NATION_ID));
  const [production, setProduction] = useState<ProductionLine[]>(defaultProduction);
  const [postwarIndustry, setPostwarIndustry] = useState(() => createPostwarIndustryState(DEFAULT_NATION_ID, initialGame.week));
  const [postwarIndustrySettings, setPostwarIndustrySettings] = useState(() => normalizePostwarIndustrySettings(undefined));
  const [regionalIndustry, setRegionalIndustry] = useState(() => createRegionalIndustryState(DEFAULT_NATION_ID, initialGame.week));
  const regionalIndustryRef = useRef(regionalIndustry);
  useEffect(() => { regionalIndustryRef.current = regionalIndustry; }, [regionalIndustry]);
  const [staffDeliveryPledges, setStaffDeliveryPledges] = useState(createStaffDeliveryPledgeState);
  const staffDeliveryPledgesRef = useRef(staffDeliveryPledges);
  useEffect(() => { staffDeliveryPledgesRef.current = staffDeliveryPledges; }, [staffDeliveryPledges]);
  const [events, setEvents] = useState<WarEvent[]>(initialEvents);
  const [orders, setOrders] = useState<Order[]>([]);
  const [operationStoppages, setOperationStoppages] = useState<OperationStopReceipt[]>([]);
  const [selectedFieldOrderId, setSelectedFieldOrderId] = useState<string | undefined>();
  const [armyWorkspace, setArmyWorkspace] = useState<'operations' | 'forces'>('operations');
  const [organizationWorkspace, setOrganizationWorkspace] = useState<'squad' | 'market' | 'meeting' | 'pledges'>('squad');
  const [focusedPledgeOwner, setFocusedPledgeOwner] = useState<Pick<StaffDeliveryPledgeCommand, 'staffId' | 'personId'> | undefined>();
  const [industryWorkspace, setIndustryWorkspace] = useState<'production' | 'policy' | 'logistics' | 'pledges'>('production');
  const [researchWorkspace, setResearchWorkspace] = useState<'national' | 'equipment'>('national');
  const [equipmentWorkspace, setEquipmentWorkspace] = useState<'overview' | 'research' | 'prototype' | 'deployment'>('overview');
  const staffDecisionLocksRef = useRef(new Set<string>());
  const personnelCommandGateRef = useRef(createPersonnelReviewGate());
  const commandSubmissionLocksRef = useRef(new Set<string>());
  const lastWeekAdvanceRequestRef = useRef<string | null>(null);
  const resetFieldSession = useCallback(() => {
    staffDecisionLocksRef.current.clear();
    personnelCommandGateRef.current = createPersonnelReviewGate();
    commandSubmissionLocksRef.current.clear();
    lastWeekAdvanceRequestRef.current = null;
    setSelectedFieldOrderId(undefined);
    setArmyWorkspace('operations');
    setOrganizationWorkspace('squad');
    setFocusedPledgeOwner(undefined);
    setIndustryWorkspace('production');
    setResearchWorkspace('national');
    setEquipmentWorkspace('overview');
  }, []);
  const initializeRegionalAccount = useCallback((nationId: NationId, week: number, reset = false) => {
    const next = reset ? createRegionalIndustryState(nationId, week) : normalizeRegionalIndustry(regionalIndustryRef.current, nationId, week);
    regionalIndustryRef.current = next;
    setRegionalIndustry(next);
    if (reset) {
      const emptyPledges = createStaffDeliveryPledgeState();
      staffDeliveryPledgesRef.current = emptyPledges;
      setStaffDeliveryPledges(emptyPledges);
    }
  }, []);
  const [activeTab, setActiveTab] = useState<GameTab>('command');
  const [governanceEntry, setGovernanceEntry] = useState<'overview' | 'budget'>('overview');
  const [commandWorkspace, setCommandWorkspace] = useState<'desk' | 'world' | 'analysis'>('desk');
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
  const [journalView, setJournalView] = useState<'history' | 'briefing'>('history');
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
  const [periodAdvanceRemaining, setPeriodAdvanceRemaining] = useState(0);
  const [periodAdvanceSession, setPeriodAdvanceSession] = useState<StrategicAdvanceSession | null>(null);
  const [latestPeriodAdvanceReport, setLatestPeriodAdvanceReport] = useState<StrategicAdvanceReport | null>(null);
  const [showTimeCommandCenter, setShowTimeCommandCenter] = useState(false);
  const periodAdvanceStopReasonRef = useRef<string | null>(null);
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
  const [jointForces, setJointForces] = useState<JointForcesState>(() => createJointForcesState(DEFAULT_NATION_ID));
  const [enemyStrategy, setEnemyStrategy] = useState<EnemyStrategyState>(() => createEnemyStrategyState());
  const [campaignOutcome, setCampaignOutcome] = useState<CampaignOutcome>(null);
  const [relations, setRelations] = useState<DiplomaticRelation[]>(initialRelations);
  const [worldChangeBaseline, setWorldChangeBaseline] = useState<WorldChangeBaseline>(() => createWorldChangeBaseline(initialTerritories, initialRelations));
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
  const [selectedFrontDetailId, setSelectedFrontDetailId] = useState<string | null>(null);
  const [setupNationId, setSetupNationId] = useState<NationId>(DEFAULT_NATION_ID);
  const [setupRoleId, setSetupRoleId] = useState(DEFAULT_ROLE_ID);
  const [setupStartMode, setSetupStartMode] = useState<CampaignStartMode>('office');
  const [setupCivilianProfessionId, setSetupCivilianProfessionId] = useState<CivilianProfessionId>('intellectual');
  const [setupCivilianOriginId, setSetupCivilianOriginId] = useState<CivilianOriginId>('university-network');
  const [career, setCareer] = useState<CareerState>(() => createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
  const [roleCommand, setRoleCommand] = useState<RoleCommandState>(() => createRoleCommandState(getRole(DEFAULT_ROLE_ID, DEFAULT_NATION_ID)));
  const [careerMarket, setCareerMarket] = useState(() => createCareerMarketState());
  const [showCareerMarket, setShowCareerMarket] = useState(false);
  const [pendingCareerOfferId, setPendingCareerOfferId] = useState<string | null>(null);
  const [pendingClandestineMissionId, setPendingClandestineMissionId] = useState<string | null>(null);
  const [careerMarketInitialView, setCareerMarketInitialView] = useState<CareerMarketView | undefined>(undefined);
  const [activeTheater, setActiveTheater] = useState<TheaterId>('europe');
  const [activeMapRegionId, setActiveMapRegionId] = useState('europe-overview');
  const [staff, setStaff] = useState<StaffMember[]>(() => createStaffRoster(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
  const [staffNarrative, setStaffNarrative] = useState<StaffNarrativeState>(() => createStaffNarrativeState(createStaffRoster(DEFAULT_NATION_ID, DEFAULT_ROLE_ID)));
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
  const civilianCareerActive = career.startMode === 'civilian' && Boolean(career.civilian && !career.civilian.enteredOfficeRoleId);
  const civilianEntryBranches = career.civilian ? getCivilianInstitutionReadiness(career.civilian).branches : [];
  const civilianEntryRoles = careerRoles.filter((role) => role.nationId === career.nationId && role.tier === 5 && civilianEntryBranches.includes(role.branch));
  const staffAuthority = useMemo(() => getStaffAuthorityProfile(careerRole), [careerRole]);
  const currentRoleTitle = getCareerInstitutionalTitle(careerRole, campaignPhase, playerNation.status);
  const displayedCareerRole = useMemo(() => ({ ...careerRole, title: currentRoleTitle }), [careerRole, currentRoleTitle]);
  const recordSuccessfulRoleAction = useCallback((tab: GameTab, id: string, description: string) => {
    setRoleCommand((current) => recordRoleActionEvidence(current, displayedCareerRole, {
      id: `${game.week}:${id}`, week: game.week, tab, description, outcome: 'succeeded',
    }));
  }, [displayedCareerRole, game.week]);
  const campaignYear = getCampaignYearForWeek(game.week);
  const baseRoleMandates = useMemo(
    () => getRoleTabMandates(displayedCareerRole, civilianCareerActive ? 'civilian' : 'office'),
    [civilianCareerActive, displayedCareerRole],
  );
  const roleMandates = useMemo(
    () => applyRoleDelegations(baseRoleMandates, roleCommand, game.week),
    [baseRoleMandates, game.week, roleCommand],
  );
  const roleCommandChain = useMemo(() => getRoleCommandChainProfile(displayedCareerRole), [displayedCareerRole]);
  const careerMarketContext = useMemo<CareerMarketContext>(() => ({
    week: game.week,
    career,
    role: careerRole,
    game,
    campaignPhase,
    relationByNation: Object.fromEntries(relations.map((relation) => [relation.id, relation.value])) as Partial<Record<NationId, number>>,
  }), [campaignPhase, career, careerRole, game, relations]);
  const pendingClandestineCount = (careerMarket.clandestine?.missions.filter((mission) => mission.status === 'offered').length ?? 0)
    + (careerMarket.clandestine?.incident ? 1 : 0);
  const hasClandestineIncident = Boolean(careerMarket.clandestine?.incident);
  const pendingCareerOfferCount = careerMarket.offers.filter((offer) => ['pending', 'exploring', 'negotiating'].includes(offer.status)).length
    + pendingClandestineCount;
  const playerFaction = playerNation.alignment;
  const enemyFaction: Exclude<Faction, 'neutral'> = playerFaction === 'allies' ? 'axis' : 'allies';
  const enemyIntentReport = useMemo(
    () => deriveEnemyIntentReport(enemyStrategy, game.intelNetwork, territories),
    [enemyStrategy, game.intelNetwork, territories],
  );
  const careerCommanders = useMemo(() => createCareerCommanders(playerNation, careerRole), [careerRole, playerNation]);
  const effectiveCommanders = useMemo(() => careerCommanders.map((commander) => {
    const assignedDivision = divisions.find((division) => division.commanderId === commander.id);
    return applyCommanderDevelopment(commander, getCommanderRecord(commanderDevelopment, commander), assignedDivision?.type);
  }), [careerCommanders, commanderDevelopment, divisions]);
  const effectiveDivisions = useMemo(
    () => divisions.map((division) => applyEquipmentToDivision(division, equipmentDevelopment)),
    [divisions, equipmentDevelopment],
  );
  const roleOperationalScope = useMemo(
    () => getRoleOperationalScope(displayedCareerRole, effectiveDivisions.map((division) => division.id)),
    [displayedCareerRole, effectiveDivisions],
  );
  const commandableDivisionIds = useMemo(() => new Set(roleOperationalScope.divisionIds), [roleOperationalScope.divisionIds]);
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
  const averageDivisionStrength = useMemo(() => divisions.reduce((total, division) => total + division.strength, 0) / Math.max(1, divisions.length), [divisions]);
  const battleVictoryCount = useMemo(() => battleReports.filter((report) => report.victory).length, [battleReports]);
  const relationAverage = useMemo(
    () => relations.reduce((total, relation) => total + relation.value, 0) / Math.max(1, relations.length),
    [relations],
  );
  const transitionReadiness = useMemo(
    () => calculateTransitionReadiness(game, relationAverage, economy, playerNation.id),
    [economy, game, playerNation.id, relationAverage],
  );
  const koreaLiberationReadiness = useMemo(() => playerNation.id === 'korea' ? assessKoreaLiberationReadiness({
    politicalPower: game.politicalPower,
    stability: game.stability,
    warSupport: game.warSupport,
    intelNetwork: game.intelNetwork,
    averageStrength: averageDivisionStrength,
    averageSupply: averageDivisionSupply,
    objectiveProgress,
    victoryScore: game.victoryScore,
    battleVictories: battleVictoryCount,
    relationAverage,
    weeksElapsed: game.week,
    territories,
  }) : null, [averageDivisionStrength, averageDivisionSupply, battleVictoryCount, game, objectiveProgress, playerNation.id, relationAverage, territories]);
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
  const currentYear = getCampaignYearForWeek(game.week);
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
  const nationalSimulationInput = useMemo<NationalSimulationInput>(() => ({
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
  const nationalSimulation = useMemo(() => deriveNationalSimulation(nationalSimulationInput), [nationalSimulationInput]);
  const livingWorldRecords = useMemo(() => selectLivingWorldRecords(events, playerNation.id), [events, playerNation.id]);
  const staffPlayContext = useMemo(() => deriveStaffPlayEvidence(staff, battleReports, game.week), [staff, battleReports, game.week]);
  const pendingCouncilEvent = councilEvents.find((event) => event.id === pendingCouncilEventId) ?? null;
  const pendingBattleReport = battleReports.find((report) => report.id === pendingBattleReportId) ?? null;
  const strategicFrontChronology = useMemo(() => deriveStrategicFrontChronology(strategicFronts, {
    year: campaignYear,
    phase: campaignPhase,
    territories,
    baselineTerritories: initialTerritories,
    activeTargetIds: orders.map((order) => order.targetId),
  }), [campaignPhase, campaignYear, orders, territories]);
  const visibleStrategicFrontIds = useMemo(
    () => new Set(strategicFrontChronology.filter((front) => front.visible).map((front) => front.id)),
    [strategicFrontChronology],
  );
  const regionalIndustryContext = useMemo<RegionalIndustryContext>(() => {
    const currentTerritories = territories.map((territory) => getPeriodAppropriateTerritory(territory, campaignYear, strategicFronts, visibleStrategicFrontIds));
    return {
      nationId: playerNation.id, controllingFaction: playerFaction, week: game.week, territories: currentTerritories,
      playableTerritoryIds: currentTerritories.filter((territory) => territory.siteType !== 'sea').map((territory) => territory.id),
      factories: game.factories, authorized: campaignPhase === 'nation' && !civilianCareerActive && roleMandates.industry.mode === 'direct',
    };
  }, [territories, campaignYear, visibleStrategicFrontIds, playerNation.id, playerFaction, game.week, game.factories, campaignPhase, civilianCareerActive, roleMandates.industry.mode]);
  const regionalAccount = getRegionalIndustryAccount(regionalIndustry, playerNation.id, game.week);
  const routedEquipmentKey = regionalAccount.configuration.mode === 'pilot' && regionalAccount.configuration.acceptNewReceipts !== false
    ? regionalAccount.configuration.equipmentKey : undefined;
  const theaterFrontChronology = useMemo(
    () => strategicFrontChronology.filter((front) => front.theater === activeTheater),
    [activeTheater, strategicFrontChronology],
  );
  const theaterTerritories = useMemo(
    () => territories
      .filter((territory) => (territory.theater ?? 'europe') === activeTheater)
      .map((territory) => getPeriodAppropriateTerritory(territory, campaignYear, strategicFronts, visibleStrategicFrontIds)),
    [activeTheater, campaignYear, territories, visibleStrategicFrontIds],
  );
  const theaterFrontSummaries = useMemo(
    () => deriveFrontSummaries(theaterTerritories, strategicFronts.filter((front) => front.theater === activeTheater && visibleStrategicFrontIds.has(front.id)), playerFaction),
    [activeTheater, playerFaction, theaterTerritories, visibleStrategicFrontIds],
  );
  const activeMapRegion = useMemo(() => getMapRegion(activeMapRegionId, activeTheater), [activeMapRegionId, activeTheater]);
  const mapRegions = useMemo(() => getMapRegionsForTheater(activeTheater), [activeTheater]);
  const regionalTerritories = useMemo(
    () => getTerritoriesForMapRegion(theaterTerritories, activeMapRegion),
    [activeMapRegion, theaterTerritories],
  );
  const regionalTerritoryIds = useMemo(() => new Set(regionalTerritories.map((territory) => territory.id)), [regionalTerritories]);
  const regionalFrontChronology = useMemo(
    () => theaterFrontChronology.filter((front) => front.territoryIds.some((territoryId) => regionalTerritoryIds.has(territoryId))),
    [regionalTerritoryIds, theaterFrontChronology],
  );
  const regionalActiveFrontChronology = useMemo(
    () => regionalFrontChronology.filter((front) => front.visible).sort((a, b) => b.activeContactCount - a.activeContactCount || a.name.localeCompare(b.name, 'ko')),
    [regionalFrontChronology],
  );
  const regionalUpcomingFrontChronology = useMemo(
    () => regionalFrontChronology.filter((front) => front.state === 'scheduled').sort((a, b) => a.startYear - b.startYear || a.name.localeCompare(b.name, 'ko')),
    [regionalFrontChronology],
  );
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
    () => getPeriodAppropriateTerritory(territories.find((territory) => territory.id === selectedTerritoryId) ?? territories[0], campaignYear, strategicFronts, visibleStrategicFrontIds),
    [campaignYear, selectedTerritoryId, territories, visibleStrategicFrontIds],
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
  const canCommandSelectedDivision = commandableDivisionIds.has(selectedDivision.id);
  const selectedCommanderDevelopment = getCommanderRecord(commanderDevelopment, selectedCommander);
  const activeOrderPresentations = useMemo(() => orders.flatMap((order) => {
    const division = effectiveDivisions.find((item) => item.id === order.divisionId);
    const origin = territories.find((item) => item.id === order.fromId);
    const target = territories.find((item) => item.id === order.targetId);
    if (!division || !origin || !target) return [];
    const stance = order.stance ?? 'balanced';
    const profile = battleTypeProfiles[order.battleType ?? 'attrition'];
    return [{
      order,
      division,
      origin,
      target,
      profile,
      progress: getOperationProgress(order),
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
    currentYear: campaignYear,
  }), [campaignYear, commanderDevelopment, divisions, economy.debt, economy.inflation, economyForecast.operatingRevenue, economyForecast.totalExpenses, formatGameMoney, game.factories, orders, production, publicHealthView, research, selectedPolicies]);
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
      label: '재정 조정', tab: 'governance', signalValue: economy.inflation,
    });
    if (nationManagement.unrest >= 55) actions.push({
      id: 'nation-unrest', priority: 'urgent', title: `사회 불안 ${Math.round(nationManagement.unrest)}`, detail: '복지·주택·고용 예산과 정통성의 부족이 국내 질서를 압박합니다.',
      reason: `사회 불안 ${Math.round(nationManagement.unrest)} · 위기 기준 55 초과`, ifIgnored: '파업·폭동·쿠데타 세력의 조직화 가능성이 커집니다.', resolution: '예산·제도 조정 · 다음 주 불안도와 권력집단 반응 확인',
      instruction: '불만이 큰 인구집단을 확인한 뒤 복지·주택·고용 예산과 정통성 제도를 우선 조정하십시오.',
      label: '예산 재배분', tab: 'governance', signalValue: nationManagement.unrest,
    });
    if (nationManagement.mandateScore < 50) actions.push({
      id: 'nation-mandate', priority: 'recommended', title: `국민 위임 ${nationManagement.mandateScore}`, detail: `다음 평가까지 ${Math.max(0, nationManagement.nextElectionWeek - game.week)}주 남았습니다. 생활 지표와 정부 신뢰를 회복하십시오.`,
      reason: `국민 위임 ${nationManagement.mandateScore} · 안정 기준 50 미만`, ifIgnored: '선거·당대회·정권 평가에서 정책 권한이 축소될 수 있습니다.', resolution: '생활·신뢰 정책 조정 · 매주 위임 점수에 누적 반영',
      instruction: '평가일까지 남은 기간을 확인하고 생활수준과 정부 신뢰를 동시에 높일 예산·제도를 선택하십시오.',
      label: '국정 지표 보기', tab: 'governance', signalValue: 100 - nationManagement.mandateScore,
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
      label: '보건 위기 지휘', tab: 'health', signalValue: Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.rEffective * 50),
    });
    const activeResearchCount = research.filter((project) => project.active && !project.complete).length;
    const availableResearchCount = research.filter((project) => !project.active && !project.complete && getResearchAvailability(project, research, campaignYear).available).length;
    if (activeResearchCount < 2 && availableResearchCount > 0) actions.push({
      id: 'nation-research-slot', priority: activeResearchCount === 0 ? 'urgent' : 'recommended', title: `국가 연구 슬롯 ${2 - activeResearchCount}개 대기`, detail: `${campaignYear}년 현재 시작 가능한 후속 연구 ${availableResearchCount}개가 있습니다.`,
      reason: `활성 연구 ${activeResearchCount}/2 · 시대·선행조건 충족 과제 ${availableResearchCount}개`, ifIgnored: '교육·과학 예산이 연구 성과로 전환되지 않아 다음 기술 세대 진입이 늦어집니다.', resolution: '과제 배정 즉시 · 다음 주 국정 결산에서 진척 확인',
      instruction: '연구 위원회에서 현재 시대의 선행기술과 국가 전략을 비교해 빈 슬롯을 채우십시오.', label: '연구 위원회', tab: 'research', signalValue: 2 - activeResearchCount,
    });
    const expiringStaff = staff.filter((member) => getStaffContractWeeks(member) <= 13).length;
    if (expiringStaff > 0) actions.push({
      id: 'nation-staff-renewal', priority: expiringStaff >= 2 ? 'urgent' : 'recommended', title: `참모 임기·계약 ${expiringStaff}건 결재 대기`, detail: '전후 직제의 임기 갱신, 승계 후보 또는 외부 영입을 결정해야 합니다.',
      reason: `13주 안에 계약 만료 또는 임기 종료 ${expiringStaff}명`, ifIgnored: '위임이 해제되고 담당 부처의 성장·조사·정책 집행 보너스가 사라집니다.', resolution: '갱신·교체 즉시 · 다음 주 조직 결산에서 권한 확인',
      instruction: '조직 운영의 참모 스쿼드와 후보 시장을 나란히 비교해 갱신 또는 승계를 확정하십시오.', label: '조직 개편', tab: 'organization', signalValue: expiringStaff,
    });
    if (actions.length === 0) actions.push({
      id: 'nation-stable', priority: 'info', title: '국정 운영이 안정적입니다', detail: '장기 산업·교육·외교 목표를 향해 다음 주를 진행할 수 있습니다.',
      reason: '긴급 임계치를 넘은 국정 지표가 없습니다.', ifIgnored: '즉시 위험은 없지만 장기 성장 기회를 활용하지 못할 수 있습니다.', resolution: '장기 목표 선택 · 다음 주 성장 지표에서 확인',
      instruction: '산업·교육·외교 중 이번 임기의 우선 목표를 정하고 예산을 집중한 뒤 다음 주를 진행하십시오.',
      label: '국정 현황', tab: 'governance',
    });
    return actions;
  }, [campaignYear, economy.inflation, game.week, nationManagement, publicHealth.activeOutbreak, research, staff]);
  const baseUXActions = campaignPhase === 'nation' ? nationUXActions : warUXActions;
  const rawUXActions = useMemo<UXAction[]>(() => {
    const staffStory = [...staffNarrative.activeStorylines].sort((left, right) => left.deadlineWeek - right.deadlineWeek)[0];
    const staffStoryAction: UXAction | null = staffStory ? {
      id: `staff-story-${staffStory.id}`,
      priority: staffStory.stage === 'public' || staffStory.deadlineWeek - game.week <= 1 ? 'urgent' : 'recommended',
      title: `${staffStory.stage === 'public' ? '언론 노출' : staffStory.stage === 'cabinet' ? '각료회의 갈등' : '참모진 현안'} · ${staffStory.title}`,
      detail: `${staffStory.summary} ${Math.max(0, staffStory.deadlineWeek - game.week)}주 안에 대응 원칙을 정해야 합니다.`,
      reason: staffStory.trigger,
      ifIgnored: staffStory.stakes,
      resolution: '대응 즉시 · 선택지에 표시된 1~3주 뒤 후속 검증',
      instruction: '조직 운영의 인물·분위기 탭에서 당사자 관계와 세 가지 대응의 즉시·장기 효과를 비교하십시오.',
      label: '인물·갈등 브리핑',
      tab: 'organization',
      signalValue: staffStory.publicRisk,
    } : null;
    const coupAction: UXAction | null = coupRisk.tier === 'stable' ? null : {
      id: 'political-crisis',
      priority: coupRisk.tier === 'critical' || coupRisk.tier === 'dangerous' ? 'urgent' : 'recommended',
      title: `${coupRisk.crisisLabel} 위험 ${getCoupRiskLabel(coupRisk.tier)} · ${coupRisk.score}`,
      detail: `${coupRisk.leadingFaction.name}의 불만·조직력과 국내 대립이 누적되고 있습니다. 다음 주 시도 확률 ${coupRisk.weeklyChance.toFixed(1)}%.`,
      reason: `${coupRisk.leadingFaction.name} 주도 · 위험 점수 ${coupRisk.score}`,
      ifIgnored: `다음 주 ${coupRisk.crisisLabel} 발생 확률 ${coupRisk.weeklyChance.toFixed(1)}%가 그대로 적용됩니다.`,
      resolution: '파벌·기관 대응 즉시 · 다음 주 정치위기 판정에서 검증',
      instruction: '최대 위험 파벌과 장악 기관을 확인하고 회유·감찰·인사 조치 중 권한과 자원에 맞는 대응을 선택하십시오.',
      label: '정치위기 상황실',
      tab: 'command',
      signalValue: coupRisk.score,
    };
    const blockedKoreaTrack = campaignPhase === 'war'
      ? koreaLiberationReadiness?.tracks.find((track) => koreaLiberationReadiness.blockedTrackIds.includes(track.id))
      : undefined;
    const koreaAction: UXAction | null = blockedKoreaTrack && koreaLiberationReadiness ? {
      id: `korea-liberation-${blockedKoreaTrack.id}`,
      priority: koreaLiberationReadiness.score < 55 ? 'urgent' : 'recommended',
      title: `해방·건국 준비 ${koreaLiberationReadiness.score}/100 · ${blockedKoreaTrack.label} 보강`,
      detail: `${blockedKoreaTrack.label} ${blockedKoreaTrack.value}점으로 최소 기준에 미달합니다. 현재 분할 위험은 ${koreaLiberationReadiness.partitionRisk}입니다.`,
      reason: `미달 축 ${koreaLiberationReadiness.blockedTrackIds.length}개 · 가장 먼저 ${blockedKoreaTrack.label} 보강`,
      ifIgnored: '해방 뒤 과도정부·외세 점령구역 고착과 분할 위험이 커집니다.',
      resolution: `${blockedKoreaTrack.label} 기준 충족 즉시 · 건국 전환 화면에서 결과 확인`,
      instruction: `${blockedKoreaTrack.action} 화면으로 이동해 관련 결정을 실행하고, 상황실의 네 준비축 변화를 확인하십시오.`,
      label: blockedKoreaTrack.action,
      tab: blockedKoreaTrack.tab,
      signalValue: 100 - blockedKoreaTrack.value,
    } : null;
    const actions = [
      ...(coupAction ? [coupAction] : []),
      ...(koreaAction ? [koreaAction] : []),
      ...(staffStoryAction ? [staffStoryAction] : []),
      ...baseUXActions,
    ];
    const order = { urgent: 0, recommended: 1, info: 2 } as const;
    return [...actions].sort((left, right) => order[left.priority] - order[right.priority]);
  }, [baseUXActions, campaignPhase, coupRisk, game.week, koreaLiberationReadiness, staffNarrative.activeStorylines]);
  const uxActionSignature = rawUXActions.map((action) => `${action.id}:${action.priority}:${action.signalValue ?? ''}`).join('|');
  const uxActions = useMemo(() => decorateUXActions(rawUXActions, uxActionLifecycle), [rawUXActions, uxActionLifecycle]);
  const trackedAction = trackedActionId
    ? uxActions.find((action) => action.id === trackedActionId) ?? null
    : null;
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
    civilianInfluences: career.civilian?.worldInfluences,
  }), [activePolicies, campaignPhase, career.civilian?.worldInfluences, careerRole.branch, completedDecisions, doctrine, events, game, nationManagement.budget, nationManagement.strategyId, operations, relations, research]);
  const worldChangeProfile = useMemo(() => deriveWorldChangeProfile({
    territories,
    baselineTerritories: worldChangeBaseline.territories,
    relations,
    baselineRelations: worldChangeBaseline.relations,
    staff,
    events,
    trajectory: historyTrajectory,
    playerFaction,
  }), [events, historyTrajectory, playerFaction, relations, staff, territories, worldChangeBaseline]);
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
    careerSignature: [
      career.roleId,
      career.replacedPersonId,
      career.alternatePathId ?? 'historical-office',
      career.civilian ? getCivilianCareerSignature(career.civilian) : 'office-entry',
      careerMarket.affiliationStatus,
      ...careerMarket.history.slice(0, 12).map((record) => `${record.nationId}:${record.outcome}`),
    ].join(':'),
    recentDecisionSignature: [
      ...completedDecisions.slice(-24),
      ...jointForces.records.slice(-8).map((record) => `${record.templateId}:${record.outcome}:${record.endedWeek}`),
    ].join('|') || 'no-confirmed-decisions',
    nationalPlanSignature: [
      nationManagement.nationalPlanning.active?.id ?? 'no-active-plan',
      ...nationManagement.nationalPlanning.history.slice(0, 8).map((record) => `${record.planId}:${record.outcome}`),
      ...nationManagement.strategicContinuity.history.slice(0, 8).map((record) => `${record.operationId}:${record.outcome}`),
    ].join('|'),
  }), [career.alternatePathId, career.civilian, career.replacedPersonId, career.roleId, careerMarket.affiliationStatus, careerMarket.history, completedDecisions, game, historyTrajectory, jointForces.records, nationManagement.nationalPlanning, nationManagement.strategicContinuity.history, playerNation, worldHistoryState]);
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
    version: 38,
    game,
    territories,
    divisions,
    research,
    equipmentDevelopment,
    armsPortfolio,
    production,
    events,
    postwarIndustry,
    postwarIndustrySettings,
    regionalIndustry,
    staffDeliveryPledges,
    orders,
    operationStoppages,
    stockpile,
    jointForces,
    enemyStrategy,
    roleCommand,
    relations,
    worldChangeBaseline,
    latestPeriodAdvanceReport,
    operations,
    campaignOutcome,
    objectiveProgress,
    torchAuthorized,
    completedDecisions,
    doctrine,
    career,
    careerMarket,
    pendingCareerOfferId,
    pendingClandestineMissionId,
    activeTheater,
    selectedTerritoryId,
    selectedDivisionId,
    staff,
    staffNarrative,
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
  }), [staffDeliveryPledges, operationStoppages, regionalIndustry, achievementUnlocks, activeTheater, armsPortfolio, battleReports, battleStance, campaignOutcome, campaignPhase, career, careerMarket, commanderDevelopment, completedDecisions, developmentFocusId, divisions, doctrine, economy, enemyStrategy, equipmentDevelopment, events, game, jointForces, lastReadWorldWeeklyId, lastReviewedJournalWeek, latestPeriodAdvanceReport, nationManagement, objectiveProgress, onboardingMilestones, operations, orders, pendingBattleReportId, pendingCareerOfferId, pendingClandestineMissionId, pendingCouncilEventId, pendingCoupIncident, pendingWorldFlashpointId, politicalCrisis, priorityDivisionId, procurementFocusId, postwarIndustry, postwarIndustrySettings, production, publicHealth, relations, research, resolvedCouncilChoices, roleCommand, selectedDivisionId, selectedPolicies, selectedTerritoryId, staff, staffCandidates, staffNarrative, stockpile, supplyPolicy, territories, torchAuthorized, uxActionLifecycle, visitedOnboardingTabs, worldChangeBaseline, worldHistoryState, worldWeeklyIssues]);
  const campaignDate = getCampaignDate(game.week);
  const strategicPublicHealthPressure = publicHealth.activeOutbreak
    ? Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.weeklyCases / 10_000)
    : publicHealth.outbreakPressure * .12;
  const timeCadenceContext = {
    year: campaignYear,
    unrest: nationManagement.unrest,
    activeElection: Boolean(nationManagement.electoral.activeCampaign),
    publicHealthPressure: strategicPublicHealthPressure,
    activeStrategicOperation: Boolean(nationManagement.strategicContinuity.active),
    activeNationalPlan: Boolean(nationManagement.nationalPlanning.active),
  };
  const timeCadenceAssessment = assessStrategicCadence(timeCadenceContext);
  const timeCadenceOptions = getStrategicTimeAdvanceOptions(timeCadenceContext);
  const periodAdvanceTargetDate = periodAdvanceSession ? getCampaignDate(periodAdvanceSession.targetWeek).full : null;
  const isKoreaWarCampaign = playerNation.id === 'korea' && campaignPhase === 'war';
  const statusResources: StatusResource[] = civilianCareerActive && career.civilian ? [
    { id: 'livelihood', label: '개인 생계', value: `${career.civilian.livelihood}`, detail: '주거·수입·활동비를 포함한 민간 활동 지속 능력', icon: 'treasury', tone: career.civilian.livelihood < 25 ? 'red' : 'gold', priority: true },
    { id: 'reputation', label: '공적 평판', value: `${career.civilian.publicReputation}`, detail: '대중·언론·지역사회가 당신을 신뢰하는 정도', icon: 'politics', tone: 'gold', priority: true },
    { id: 'expertise', label: '전문성', value: `${career.civilian.expertise}`, detail: '직업적 성과와 판단의 신뢰도', icon: 'research', tone: 'blue' },
    { id: 'network', label: '인맥', value: `${career.civilian.network}`, detail: '동료·후원자·조직과의 연결', icon: 'organization', tone: 'green' },
    { id: 'independence', label: '독립성', value: `${career.civilian.independence}`, detail: '권력과 후원자의 요구에서 벗어나 행동할 수 있는 정도', icon: 'diplomacy', tone: 'steel' },
    { id: 'scrutiny', label: '감시 위험', value: `${career.civilian.scrutiny}`, detail: '검열·경찰·정보기관의 주목과 활동 노출', icon: 'intelligence', tone: career.civilian.scrutiny >= 65 ? 'red' : 'steel' },
  ] : [
    { id: 'treasury', label: isKoreaWarCampaign ? '독립운동 기금' : '국고', value: formatGameMoney(game.treasury), delta: campaignPhase === 'nation' && nationManagement.reports[0] ? formatGameMoney(nationManagement.reports[0].fiscalBalance, { signed: true }) : formatGameMoney(economyForecast.netTreasuryChange, { signed: true }), detail: isKoreaWarCampaign ? '임시정부 운영·연합 조달·국내 공작 재원' : '정책·조달·급여의 공통 재원', icon: 'treasury', tone: 'gold', priority: true },
    { id: 'politics', label: isKoreaWarCampaign ? '외교·조직력' : campaignPhase === 'nation' ? '정치 역량' : '정치력', value: formatNumber(game.politicalPower), delta: campaignPhase === 'nation' ? `위임 ${nationManagement.mandateScore}` : '+3/주', detail: isKoreaWarCampaign ? '승인 교섭·정파 통합·인사 결재' : '인사·외교·정책 결재에 사용', icon: 'politics', tone: 'gold', priority: true },
    { id: 'manpower', label: isKoreaWarCampaign ? '동원 가능 인력' : campaignPhase === 'nation' ? '노동·예비 인력' : '가용 인력', value: `${formatNumber(game.manpower)}K`, delta: campaignPhase === 'nation' ? `고용 ${Math.round(nationManagement.employment)}` : '+18/주', detail: isKoreaWarCampaign ? '광복군 충원·연락망·해방 행정 인력' : campaignPhase === 'nation' ? '산업·행정·국방 인력 기반' : '편제 충원과 손실 보충', icon: 'manpower', tone: 'blue' },
    { id: 'factories', label: isKoreaWarCampaign ? '협력 생산망' : campaignPhase === 'nation' ? '산업 기반' : '군수 공장', value: String(game.factories), delta: campaignPhase === 'nation' ? `민수 ${Math.round(nationManagement.civilianIndustry)}` : undefined, detail: isKoreaWarCampaign ? '중국·연합군 조달과 분산 작업장' : '장비·기반시설 생산 능력', icon: 'industry', tone: 'steel' },
    { id: 'fuel', label: isKoreaWarCampaign ? '작전 연료' : campaignPhase === 'nation' ? '전략 에너지' : '연료', value: `${formatNumber(game.fuel)}K`, delta: campaignPhase === 'nation' ? undefined : '+2.6/주', detail: isKoreaWarCampaign ? '광복군 훈련·침투·연합 수송 지원' : '기갑·항공·해군 작전 지속', icon: 'fuel', tone: 'green' },
    { id: 'steel', label: isKoreaWarCampaign ? '조달 강철' : '강철', value: `${formatNumber(game.steel)}K`, delta: campaignPhase === 'nation' ? undefined : '+9/주', detail: isKoreaWarCampaign ? '연합 조달 장비와 정비 부품 원료' : '중장비·차량·함정 생산 원료', icon: 'steel', tone: 'steel' },
  ];
  const projectionCompletedResearch = research.filter((project) => project.complete).length;
  const projectionPublicHealthPressure = publicHealth.activeOutbreak
    ? Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.weeklyCases / 10_000)
    : publicHealth.outbreakPressure * 0.12;
  const nationBaseWeekProjection = useMemo(() => campaignPhase === 'nation'
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
  const nationHealthProjection = useMemo(() => campaignPhase === 'nation' ? advancePublicHealthWeek(publicHealth, publicHealthContext) : null, [campaignPhase, publicHealth, publicHealthContext]);
  const nationProgramCommitments = useMemo(() => getNationalProgramPulse(
    getNationalProgram(playerNation, career.alternatePathId),
    getNationalProgramStartedWeek(career.alternatePathId, completedDecisions),
    game.week + 1,
    completedDecisions,
  ).gameDelta, [career.alternatePathId, completedDecisions, game.week, playerNation]);
  const postwarIndustryInput = useMemo<PostwarIndustryInput | null>(() => nationBaseWeekProjection ? {
    nationId: playerNation.id, week: game.week + 1, production, stockpile,
    game: reservePostwarIndustryResources(game, nationBaseWeekProjection, nationHealthProjection?.gameDelta, nationProgramCommitments),
    spendingLevel: nationManagement.spendingLevel, securityBudgetPercent: nationManagement.budget.security,
    ...postwarIndustrySettings,
  } : null, [game, nationBaseWeekProjection, nationHealthProjection, nationProgramCommitments, nationManagement.spendingLevel, nationManagement.budget.security, playerNation.id, postwarIndustrySettings, production, stockpile]);
  const postwarIndustryForecast = useMemo(() => postwarIndustryInput ? forecastPostwarIndustry(postwarIndustryInput) : null, [postwarIndustryInput]);
  const staffDeliveryContext = useMemo<StaffDeliveryPledgeContext>(() => ({
    nationId: playerNation.id, week: game.week, phase: campaignPhase, staff, production,
    manageableDepartments: staffAuthority.managedDepartments, industryMandate: roleMandates.industry,
    lineEquipment: getPostwarProductionLineEquipment(production),
  }), [playerNation.id, game.week, campaignPhase, staff, production, staffAuthority.managedDepartments, roleMandates.industry]);
  useEffect(() => {
    if (!staffDeliveryPledgesRef.current.pledges.some((pledge) => pledge.status === 'open')) return;
    const next = normalizeStaffDeliveryPledges(staffDeliveryPledgesRef.current, staffDeliveryContext);
    if (JSON.stringify(next) === JSON.stringify(staffDeliveryPledgesRef.current)) return;
    staffDeliveryPledgesRef.current = next;
    setStaffDeliveryPledges(next);
  }, [staffDeliveryContext]);
  const nationWeekProjection = useMemo(() => nationBaseWeekProjection && postwarIndustryForecast ? mergePostwarIndustrySettlement(nationBaseWeekProjection, postwarIndustryForecast) : nationBaseWeekProjection, [nationBaseWeekProjection, postwarIndustryForecast]);
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
        detail: orders.length ? `다음 교전: ${projectionOrderTarget ?? '목표 지역'} · ${orders[0].battleType ? battleTypeProfiles[orders[0].battleType].shortLabel : '작전 분류 예정'} · 진척 ${getOperationProgress(orders[0])}%` : '작전 결과 없이 행정 주간으로 진행됩니다.',
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
    playGameAudioCue(inferGameAudioCue(message), uxPreferences.soundOn);
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
      toastTimerRef.current = null;
    }, 3200);
  }, [uxPreferences.soundOn]);

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

  const addEvent = useCallback((title: string, detail: string, tone: WarEvent['tone'], week: number, trace?: Partial<WarEventTrace>, scope?: Pick<WarEvent, 'nationId'>) => {
    setEvents((current) => [{ id: Date.now() + Math.random(), week, title, detail, tone, ...scope, trace: createWarEventTrace(title, detail, tone, trace) }, ...current].slice(0, 120));
  }, []);

  useEffect(() => {
    const dueReviews = completedDecisions
      .flatMap((decisionId) => {
        const schedule = parseCivilizationReviewMarker(decisionId);
        return schedule ? [schedule] : [];
      })
      .filter((schedule) => schedule.dueWeek <= game.week)
      .filter((schedule) => !completedDecisions.includes(getCivilizationReviewedMarker(schedule)));
    if (dueReviews.length === 0) return;

    setCompletedDecisions((current) => [
      ...current,
      ...dueReviews.map(getCivilizationReviewedMarker),
    ]);

    dueReviews.forEach((schedule) => {
      const program = getCivilizationProgram(schedule.programId);
      if (!program) return;
      const path = getCivilizationPaths(program, playerNation.id, careerRole)
        .find((candidate) => candidate.approachId === schedule.approachId);
      if (!path) return;
      const domain = civilizationDomainDefinitions[program.domainId];
      const deliveryCapacity = (
        game.stability
        + economy.publicConfidence
        + nationManagement.institutionalCapacity
        + Math.max(0, 100 - nationManagement.unrest)
        + Math.max(0, 100 - economy.inflation)
      ) / 5;
      const actualEffectiveness = Math.max(0, Math.min(140, Math.round(path.effectiveness * 0.7 + deliveryCapacity * 0.3)));
      const variance = actualEffectiveness - path.effectiveness;
      const comparisonStatus = variance >= 5 ? 'better' : variance >= -5 ? 'matched' : 'worse';
      const tone: WarEvent['tone'] = comparisonStatus === 'better' ? 'good' : comparisonStatus === 'worse' ? 'bad' : 'neutral';

      if (comparisonStatus === 'better') {
        setGame((current) => applyGameDelta(current, { stability: 1, politicalPower: 1 }));
        setEconomy((current) => ({ ...current, publicConfidence: Math.min(100, current.publicConfidence + 1) }));
      } else if (comparisonStatus === 'worse') {
        setGame((current) => applyGameDelta(current, { politicalPower: -1 }));
        setEconomy((current) => ({ ...current, publicConfidence: Math.max(0, current.publicConfidence - 1) }));
        setNationManagement((current) => ({ ...current, unrest: Math.min(100, current.unrest + 1) }));
      } else {
        setEconomy((current) => ({ ...current, publicConfidence: Math.min(100, current.publicConfidence + 0.5) }));
      }

      addEvent(
        `제도 검증 · ${domain.shortLabel} — ${path.label}`,
        `${program.title}의 ${path.reviewWeeks}주 1차 검증이 끝났습니다. 예상 실효 ${path.effectiveness}%에 대해 실제 집행 실효는 ${actualEffectiveness}%로 평가됐습니다.`,
        tone,
        game.week,
        {
          domain: 'management',
          decision: `${program.title} · ${path.label}`,
          trigger: `제 ${schedule.dueWeek + 1}주 예정 검증 도래`,
          factors: [
            `국가 안정도 ${Math.round(game.stability)}/100`,
            `경제 신뢰 ${Math.round(economy.publicConfidence)}/100 · 물가 ${economy.inflation.toFixed(1)}%`,
            `제도 역량 ${Math.round(nationManagement.institutionalCapacity)}/100`,
            `사회 불안 ${Math.round(nationManagement.unrest)}/100`,
          ],
          effects: [
            { label: '실제 집행 실효', value: `${actualEffectiveness}%`, tone: comparisonStatus === 'worse' ? 'negative' : 'positive' },
            { label: '예상 대비', value: `${variance > 0 ? '+' : ''}${variance}%p`, tone: comparisonStatus === 'better' ? 'positive' : comparisonStatus === 'worse' ? 'negative' : 'neutral' },
          ],
          comparisons: [{
            label: `${domain.shortLabel} 제도 집행`,
            expected: `${path.effectiveness}%`,
            actual: `${actualEffectiveness}%`,
            status: comparisonStatus,
            explanation: comparisonStatus === 'better'
              ? '안정·신뢰·제도역량이 예상보다 강해 집행 효과가 확대됐습니다.'
              : comparisonStatus === 'worse'
                ? '물가·불안 또는 부족한 제도역량이 정책 전달을 약화했습니다.'
                : '현재 국가역량이 계획 범위 안에서 정책을 전달했습니다.',
          }],
          ongoing: [
            `다음 시대 ${domain.label} 사업의 출발 조건에 누적`,
            `구조적 위험 계속 감시: ${path.risk}`,
          ],
          nextActions: comparisonStatus === 'worse'
            ? ['제도역량과 경제 신뢰 회복', `${domain.label} 수혜집단과 재협상`, '진행 결과에서 다음 결산 비교']
            : [`${domain.label} 성과를 인접 분야로 확산`, '다음 시대 포트폴리오 재원 비축', '세계 주보에서 국제 반응 확인'],
          certainty: 'confirmed',
        },
      );
    });
  }, [
    addEvent,
    careerRole,
    completedDecisions,
    economy.inflation,
    economy.publicConfidence,
    game.stability,
    game.week,
    nationManagement.institutionalCapacity,
    nationManagement.unrest,
    playerNation.id,
  ]);

  useEffect(() => {
    const dueReviews = completedDecisions
      .flatMap((decisionId) => {
        const schedule = parseArmsPolicyReviewMarker(decisionId);
        return schedule ? [schedule] : [];
      })
      .filter((schedule) => schedule.dueWeek <= game.week)
      .filter((schedule) => !completedDecisions.includes(getArmsPolicyReviewedMarker(schedule)));
    if (dueReviews.length === 0) return;

    let nextPortfolio = armsPortfolio;
    const results = dueReviews.map((schedule) => {
      const result = applyArmsPolicyReviewToPortfolio(nextPortfolio, schedule, game.week);
      nextPortfolio = result.state;
      return { schedule, ...result };
    });
    setArmsPortfolio(nextPortfolio);
    setCompletedDecisions((current) => [...current, ...dueReviews.map(getArmsPolicyReviewedMarker)]);

    results.forEach(({ schedule, status, score, summary }) => {
      const policy = armsDiplomacyPolicies.find((item) => item.id === schedule.policyId && item.stageId === schedule.stageId);
      if (!policy) return;
      addEvent(
        `군비 정책 검증 — ${policy.title}`,
        `${policy.reviewYears}년 성과 검증이 끝났습니다. 집행 점수 ${score}/100. ${summary}`,
        status === 'better' ? 'good' : status === 'worse' ? 'bad' : 'neutral',
        game.week,
        {
          domain: 'diplomacy',
          decision: policy.title,
          trigger: `제 ${schedule.dueWeek + 1}주 예정 검증 도래`,
          factors: [
            `공급안보 ${Math.round(armsPortfolio.supplySecurity)}/100`,
            `조달 자율 ${Math.round(armsPortfolio.autonomy)}/100 · 상호운용 ${Math.round(armsPortfolio.interoperability)}/100`,
            `규범 신뢰 ${Math.round(armsPortfolio.treatyCompliance)}/100`,
            `군비 긴장 ${Math.round(armsPortfolio.escalation)}/100 · 비공식 노출 ${Math.round(armsPortfolio.covertExposure)}/100`,
          ],
          effects: [
            { label: '실제 집행 점수', value: `${score}/100`, tone: status === 'worse' ? 'negative' : 'positive' },
            { label: '평가', value: status === 'better' ? '예상 상회' : status === 'worse' ? '예상 미달' : '계획 범위', tone: status === 'better' ? 'positive' : status === 'worse' ? 'negative' : 'neutral' },
          ],
          comparisons: [{
            label: '군비·외교 정책 집행',
            expected: '48–69 계획 범위',
            actual: `${score}/100`,
            status,
            explanation: summary,
          }],
          ongoing: ['검증 결과가 다음 조달의 공급안보와 비상비축에 누적', '같은 시대의 다른 정책과 조달 경로에 파급'],
          nextActions: status === 'worse'
            ? ['비상 군수비축 확충', '혼합 규격 축소', '현지 정비권·면허생산 협상']
            : ['성과가 검증된 경로의 다음 단계 현지화', '전략무기 통보·검증·핫라인 병행'],
          certainty: 'confirmed',
        },
      );
    });
  }, [addEvent, armsPortfolio, completedDecisions, game.week]);

  useEffect(() => {
    if (showBriefing || showTutorial || campaignOutcome || pendingWorldFlashpointId || pendingCoupIncident || pendingCouncilEventId || pendingAchievementId) return;
    const offerResult = evaluateForeignCareerOffers(careerMarket, careerMarketContext);
    const clandestineResult = offerResult.state.clandestine
      ? advanceClandestineCareerWeek(offerResult.state.clandestine, {
          week: game.week,
          role: careerRole,
          intelNetwork: game.intelNetwork,
          stability: game.stability,
          warSupport: game.warSupport,
          campaignPhase,
          exposure: offerResult.state.exposure,
        })
      : null;
    const clandestineChanged = Boolean(
      clandestineResult
      && (
        clandestineResult.state !== offerResult.state.clandestine
        || clandestineResult.exposureDelta !== 0
      ),
    );
    const nextCareerMarket = clandestineResult && clandestineChanged
      ? {
          ...offerResult.state,
          clandestine: clandestineResult.state,
          exposure: Math.max(0, Math.min(100, offerResult.state.exposure + clandestineResult.exposureDelta)),
        }
      : offerResult.state;
    if (nextCareerMarket !== careerMarket) setCareerMarket(nextCareerMarket);

    if (clandestineResult) {
      if (Object.keys(clandestineResult.gameDelta).length > 0) {
        setGame((current) => applyGameDelta(current, clandestineResult.gameDelta));
      }
      if (Object.values(clandestineResult.careerDelta).some((value) => value !== 0)) {
        setCareer((current) => ({
          ...current,
          reputation: Math.max(0, Math.min(100, current.reputation + clandestineResult.careerDelta.reputation)),
          councilTrust: Math.max(0, Math.min(100, current.councilTrust + clandestineResult.careerDelta.councilTrust)),
          legacy: Math.max(0, current.legacy + clandestineResult.careerDelta.legacy),
        }));
      }
      clandestineResult.notices.forEach((notice) => addEvent(
        notice.title,
        notice.detail,
        notice.tone,
        game.week,
        {
          domain: 'operations',
          decision: '이중 소속의 장기 태세와 앞서 선택한 정보 진위 방식이 이번 주에 해결됐습니다.',
          trigger: `비밀 소속 주간 처리 · 노출 ${Math.round(offerResult.state.exposure)} → ${Math.round(nextCareerMarket.exposure)}.`,
          factors: [
            `핸들러 신뢰 ${Math.round(clandestineResult.state.handlerTrust)}`,
            `본국 신뢰 ${Math.round(clandestineResult.state.homeTrust)}`,
            `위장 강도 ${Math.round(clandestineResult.state.coverStrength)}`,
            `심리 압박 ${Math.round(clandestineResult.state.stress)}`,
          ],
          effects: Object.entries(clandestineResult.gameDelta).map(([key, value]) => ({
            label: key,
            value: `${Number(value) >= 0 ? '+' : ''}${value}`,
            tone: Number(value) >= 0 ? 'positive' : 'negative',
          })),
          ongoing: ['비밀 신분의 양측 신뢰·위장·노출·스트레스는 다음 임무와 방첩 조사 확률에 이어집니다.'],
          nextActions: [clandestineResult.needsAttention ? '국제 경력·비밀 접촉실에서 새 핸들러 요구 또는 방첩 위기에 대응하십시오.' : '비밀 기록에서 이번 주 결과와 다음 요구 예상 시점을 확인하십시오.'],
          certainty: 'confirmed',
        },
      ));
      if (clandestineResult.needsAttention) {
        setPendingClandestineMissionId(clandestineResult.newMissionId);
        setCareerMarketInitialView('clandestine');
        setShowCareerMarket(true);
        setPeriodAdvanceRemaining(0);
        setSpeed(0);
        notify(clandestineResult.incidentOpened ? '긴급 방첩 위기가 발생했습니다.' : '외국 핸들러의 새 요구가 도착했습니다.');
        return;
      }
    }

    const firstOffer = offerResult.newOffers[0];
    if (!firstOffer) return;
    setPendingCareerOfferId(firstOffer.id);
    setPendingClandestineMissionId(null);
    setCareerMarketInitialView('inbox');
    setShowCareerMarket(true);
    setPeriodAdvanceRemaining(0);
    setSpeed(0);
    addEvent(
      `외국의 직접 제안 — ${firstOffer.title}`,
      `${withJosa(firstOffer.sender, '이/가')} ${withJosa(firstOffer.coverChannel, '을/를')} 통해 먼저 접근했습니다. ${firstOffer.deadlineWeek + 1}주차까지 탐색·협상·수락·거절·상부 보고·역포섭 중 하나를 결정할 수 있습니다.`,
      firstOffer.exposureRisk >= 65 ? 'bad' : 'neutral',
      game.week,
      {
        domain: 'diplomacy',
        decision: '아직 답변하지 않음 — 국제 경력·비밀 접촉실에서 제안을 검토해야 합니다.',
        trigger: `평판 ${Math.round(career.reputation)}, 지도부 신임 ${Math.round(career.councilTrust)}, ${careerRole.title}의 접근권을 외국 기관이 평가했습니다.`,
        factors: [`제안 유형: ${firstOffer.kind}`, `접근 동기: ${firstOffer.motive}`, `발각 위험 ${Math.round(firstOffer.exposureRisk)}`, `신뢰도 ${Math.round(firstOffer.credibility)}`],
        effects: [{ label: '진행 상태', value: '시간 정지 · 제안 도착', tone: 'neutral' }],
        ongoing: ['거절하지 않는 한 제안은 답변 기한까지 받은편지함에 남습니다.', '현직 중 외부 접촉은 지도부 신임과 방첩 노출 위험에 영향을 줍니다.'],
        nextActions: ['국제 경력·비밀 접촉실에서 상대의 요구, 보직, 보호, 대가와 위험을 비교하십시오.'],
        certainty: 'developing',
      },
    );
    notify(`${firstOffer.title}이 도착했습니다. 상대가 먼저 보낸 제안입니다.`);
  }, [addEvent, campaignOutcome, campaignPhase, career.councilTrust, career.reputation, careerMarket, careerMarketContext, careerRole, game, notify, pendingAchievementId, pendingCouncilEventId, pendingCoupIncident, pendingWorldFlashpointId, showBriefing, showTutorial]);

  useEffect(() => {
    if (campaignOutcome !== 'defeat' || careerMarket.affiliationStatus === 'dismissed') return;
    const result = markCareerDismissed(careerMarket, careerMarketContext);
    setCareerMarket(result.state);
    const firstOffer = result.newOffers[0] ?? null;
    setPendingCareerOfferId(firstOffer?.id ?? null);
    setPendingClandestineMissionId(null);
    setCareerMarketInitialView('inbox');
    setShowCareerMarket(true);
    setPeriodAdvanceRemaining(0);
    setSpeed(0);
    addEvent(
      '해임 뒤 국제 경력 시장 개방',
      `현재 보직은 잃었지만 평판 ${Math.round(career.reputation)}, 경력, 인맥과 비밀 접근 기록은 유지됩니다. ${result.newOffers.length}개 기관이 망명·새 보직·비밀 고문 또는 정보 거래 가능성을 타진했습니다.`,
      'neutral',
      game.week,
      {
        domain: 'management',
        decision: '해임 이후에도 같은 세계선에서 국제 경력을 계속할 수 있습니다.',
        trigger: `${careerRole.title} 해임과 전쟁 수행 실패가 외국 정부·정보기관의 인재 평가를 촉발했습니다.`,
        factors: [`새 제안 ${result.newOffers.length}건`, `보유 평판 ${Math.round(career.reputation)}`, `보유 정보망 ${Math.round(game.intelNetwork)}`],
        effects: [{ label: '경력 상태', value: '현직 → 해임 · 국제 구직 가능', tone: 'neutral' }],
        ongoing: ['새 국가의 공식 보직을 수락하면 세계의 기존 사건·전황·선택 기록을 유지한 채 소속만 바뀝니다.'],
        nextActions: ['국제 경력·비밀 접촉실에서 제안을 비교하거나 원하는 국가에 직접 자신을 어필하십시오.'],
        certainty: 'confirmed',
      },
    );
  }, [addEvent, campaignOutcome, career.reputation, careerMarket, careerMarketContext, careerRole.title, game.intelNetwork, game.week]);

  const scheduleWorldFlashpoint = useCallback((week: number) => {
    if (week % WORLD_FLASHPOINT_INTERVAL_WEEKS !== 0 || pendingWorldFlashpointId || pendingCouncilEventId || pendingCoupIncident) return false;
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
        effects: [{ label: result.assessment.crisisLabel, value: `${getCoupRiskLabel(result.assessment.tier)} ${result.assessment.score} · 주간 ${result.assessment.weeklyChance.toFixed(1)}%`, tone: result.assessment.tier === 'stable' ? 'positive' : result.assessment.tier === 'watch' ? 'neutral' : 'negative' }],
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
        decision: `아직 결정하지 않음 — ${result.assessment.crisisLabel} 대응 명령이 필요합니다.`,
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
        worldChange: worldChangeProfile,
      });
      return [issue, ...current].sort((left, right) => right.week - left.week).slice(0, 104);
    });
  }, [showBriefing, game.week, worldChangeProfile]);

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
    playGameAudioCue('achievement', uxPreferences.soundOn);
    addEvent(`도전과제 달성 — ${nextAchievement.title}`, `${nextAchievement.condition} · 삽화가 기록실에 해금되었습니다.`, 'good', game.week);
  }, [achievementProgress, achievementUnlocks, addEvent, game.week, hasUnreadWorldWeekly, pendingAchievementId, showAchievementGallery, showBriefing, showTutorial, showWorldHistory, showWorldWeekly, uxPreferences.soundOn]);

  const settleNationalSupplyWeek = useCallback((nextWeek: number) => {
    const feedback = deriveNationalEconomyFeedback(nationalSimulation, nationalSimulationInput);
    const bounded = (value: number) => Math.max(0, Math.min(100, value));
    setGame((current) => ({ ...current, stability: bounded(current.stability + feedback.gameDelta.stability) }));
    setEconomy((current) => ({ ...current,
      inflation: bounded(current.inflation + feedback.economyDelta.inflation),
      publicConfidence: bounded(current.publicConfidence + feedback.economyDelta.publicConfidence),
    }));
    setNationManagement((current) => ({ ...current,
      unrest: bounded(current.unrest + feedback.nationDelta.unrest),
      employment: bounded(current.employment + feedback.nationDelta.employment),
    }));
    const effect = (label: string, value: number, inverse = false) => ({ label, value: formatSupplyContribution(value), tone: value === 0 ? 'neutral' as const : (inverse ? value < 0 : value > 0) ? 'positive' as const : 'negative' as const });
    addEvent('민생 공급 결산', `${feedback.summary} 공급 경로 기여: 물가 ${formatSupplyContribution(feedback.economyDelta.inflation)}%p · 신뢰 ${formatSupplyContribution(feedback.economyDelta.publicConfidence)} · 사회 불안 ${formatSupplyContribution(feedback.nationDelta.unrest)}.`, 'neutral', nextWeek, {
      domain: 'management', decision: '주간 시작 시점의 군수·민수 배치와 생활재 공급을 유지했습니다.',
      trigger: '주간 진행 시 공급 경로를 전시·국정의 기본 결산 뒤 한 번 반영합니다.',
      factors: feedback.affectedGoods.length ? feedback.affectedGoods.map((good) => `${good.name}: 공급 ${good.availability}/100`) : ['생활재 공급 부족 없음 또는 추가 조정의 수렴 구간'],
      effects: [effect('물가 %p', feedback.economyDelta.inflation, true), effect('경제 신뢰', feedback.economyDelta.publicConfidence), effect('국가 안정', feedback.gameDelta.stability), effect('사회 불안', feedback.nationDelta.unrest, true), effect('고용', feedback.nationDelta.employment)],
      ongoing: ['표시값은 공급 경로만의 추가 기여분입니다. 세금·전쟁·보건 변화는 별도이며 최종 지표는 0~100 경계 안에서 합산합니다.', '공급 부족과 회복 효과는 주간 상한과 목표 구간을 가지며 같은 이유로 무한 누적되지 않습니다.'],
      nextActions: ['본부 현장 보기에서 생산 배치와 소비재 공급을 비교하거나, 재정 정책과 공급 병목을 확인하십시오.'], certainty: 'confirmed',
    }, { nationId: nationalSimulationInput.nationId });
  }, [addEvent, nationalSimulation, nationalSimulationInput]);

  const advanceNationWeek = useCallback(() => {
    const nextWeek = game.week + 1;
    const currentYear = getCampaignYearForWeek(nextWeek);
    const previousYear = getCampaignYearForWeek(nextWeek - 1);
    const monetaryResult = advanceMonetarySystem(economy.monetarySystem, playerNation.id, currentYear);
    const publicHealthResult = advancePublicHealthWeek(publicHealth, publicHealthContext);
    const completedResearch = research.filter((project) => project.complete).length;
    const publicHealthPressure = publicHealth.activeOutbreak
      ? Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.weeklyCases / 10_000)
      : publicHealth.outbreakPressure * 0.12;
    const baseResult = advanceNationManagementWeek(nationManagement, {
      week: nextWeek,
      game,
      economy,
      relationAverage,
      completedResearch,
      publicHealthPressure,
      role: careerRole,
    });
    const industryResult = advancePostwarIndustryWeek(postwarIndustry, {
      nationId: playerNation.id, week: nextWeek, production, stockpile,
      game: reservePostwarIndustryResources(game, baseResult, publicHealthResult.gameDelta, nationProgramCommitments),
      spendingLevel: nationManagement.spendingLevel, securityBudgetPercent: nationManagement.budget.security,
      ...postwarIndustrySettings,
    });
    const result = industryResult.applied && industryResult.report ? mergePostwarIndustrySettlement(baseResult, industryResult.report) : baseResult;
    setPostwarIndustry(industryResult.state);
    const regionalResult = settleRegionalIndustryDelivery(regionalIndustryRef.current, { ...regionalIndustryContext, week: nextWeek }, industryResult.applied ? {
      id: `${playerNation.id}:industry:${nextWeek}`, nationId: playerNation.id, week: nextWeek, stockpileDelta: industryResult.stockpileDelta,
    } : undefined);
    regionalIndustryRef.current = regionalResult.state;
    setRegionalIndustry(regionalResult.state);
    if (regionalResult.automaticReservation?.applied) addEvent('지역 수송 자동 예약', `${regionalResult.automaticReservation.reservedQuantity}개를 기존 자동 지시에 따라 예약했습니다. 창고 최소잔량과 주간 처리 상한을 지켰으며, 국가 가용 비축에는 도착할 때 반영됩니다.`, 'neutral', nextWeek, undefined, { nationId: playerNation.id });
    const deliveredStockpile = combineStockpileDeltas(stockpile, regionalResult.availableDelta);
    setStockpile((current) => combineStockpileDeltas(current, regionalResult.availableDelta));
    regionalResult.transport.deliveries.forEach((receipt) => addEvent('지역 수송 도착', `${regionalEquipmentLabels[receipt.equipmentKey]} ${receipt.quantity}개가 ${regionalIndustryContext.territories.find((territory) => territory.id === receipt.destinationTerritoryId)?.name ?? receipt.destinationTerritoryId}에 도착하여 국가 가용 비축에 한 번 반영됐습니다. 수송 기록 ${receipt.shipmentId}`, 'good', nextWeek, undefined, { nationId: playerNation.id }));
    const postwarEquipmentResult = advancePostwarEquipmentWeek(equipmentDevelopment, {
      week: nextWeek, game: applyGameDelta(applyGameDelta(game, result.gameDelta), publicHealthResult.gameDelta),
      production, stockpile: deliveredStockpile, divisions, armsPortfolio,
      researchGain: 8 + Math.floor(game.factories / 7) + (doctrine === 'methodical' ? 3 : 0) + (delegatedDepartments.has('armaments') ? 2 : 0) + Math.max(0, scienceAdvisorBonus - 1) + (scienceAdvisor?.discipline === 'engineering' ? 1 : 0) + 2,
      productionCoverageScale: industryResult.applied ? industryResult.report?.deliveryRatio ?? 0 : 0,
      productionCoverageByCategory: regionalEquipmentProductionCoverage(industryResult.report, regionalResult.availableDelta),
    });
    if (postwarEquipmentResult.advanced) {
      setEquipmentDevelopment(postwarEquipmentResult.state);
      setDivisions(postwarEquipmentResult.divisions);
    }
    if (postwarEquipmentResult.completedProject) addEvent('장비 개발 완료 — ' + postwarEquipmentResult.completedProject.name, postwarEquipmentResult.completedProject.doctrineEffect + '. 국정 주간 연구로 완료했습니다. 선지급 연구비는 다시 차감하지 않았습니다.', 'good', nextWeek);
    if (postwarEquipmentResult.blockedProjectReason) addEvent('장비 연구 기록 정리', postwarEquipmentResult.blockedProjectReason, 'neutral', nextWeek);
    postwarEquipmentResult.completedOrders.forEach((order) => addEvent(`병기 작업 완료 — ${equipmentCategoryLabels[order.category]} ${weaponWorkOrderDefinitions[order.type].label}`, '국정 주간 정비에서 작업을 완료했습니다. 선지급 작업비는 다시 차감하지 않았으며 평시 운용·실제 공급·비축을 반영했습니다.', 'good', nextWeek));
    if (industryResult.applied && industryResult.report) {
      const delivery = industryResult.report;
      addEvent('국정 군수 생산 결산', `${postwarIndustryPolicyDefinitions[delivery.policy].label} · 계획 대비 ${Math.round(delivery.deliveryRatio * 100)}% 생산 완료. 기존 예산 집행 ${formatGameMoney(delivery.includedBudgetUsed)} · 추가 국고 ${formatGameMoney(delivery.additionalTreasuryCost)} · 연료 ${delivery.fuelUsed.toFixed(2)}K · 강철 ${delivery.steelUsed.toFixed(2)}K 사용.`, 'neutral', nextWeek, {
        domain: 'management', decision: '승인된 공장 배치·가동 방침·추가 국고 한도로 국정 군수 납품을 집행했습니다.',
        trigger: '다음 주 진행: 기본 재정·보건·국가 프로그램 지출을 고려한 예산과 원료 한도에서 한 번 납품했습니다.',
        factors: [delivery.summary, `가동 공장 ${delivery.activeFactories} · 안보예산 중 군수몫 ${delivery.industryBudgetShare * 100}%`, `운영비 ${formatGameMoney(delivery.operatingCost)} · 제조비 ${formatGameMoney(delivery.manufacturingCost)}`],
        effects: delivery.perLine.map((line) => ({ label: line.name, value: `생산 완료 +${line.delivered}`, tone: line.delivered > 0 ? 'positive' : 'neutral' })),
        comparisons: delivery.perLine.map((line) => ({ label: line.name, expected: String(postwarIndustryForecast?.perLine.find((item) => item.lineId === line.lineId)?.delivered ?? line.delivered), actual: String(line.delivered), status: postwarIndustryForecast?.perLine.find((item) => item.lineId === line.lineId)?.delivered === line.delivered ? 'matched' : 'variance', explanation: '생산 계획이 아니라 자원·예산을 반영한 직전 납품 전망과 비교합니다.' })),
        ongoing: ['안보 기본예산 포함분은 다시 차감하지 않고 추가 허용액의 실제 집행분만 국고·국정 수지에 반영했습니다.', `지역 집하 ${Object.entries(regionalResult.stagedDelta).filter(([, amount]) => amount > 0).map(([key, amount]) => `${regionalEquipmentLabels[key as keyof Stockpile]} ${amount}`).join(' · ') || '없음'}. 집하분은 수송 도착 전까지 국가 가용 비축에 포함되지 않습니다.`, '설비 보존은 공장 가동 방침이며, 병기 작업지시의 정비 결과는 별도 기록됩니다.'],
        nextActions: ['산업 전환 화면에서 가동 방침·물자 조달·다음 주 입고 전망을 확인하십시오.'], certainty: 'confirmed',
      }, { nationId: playerNation.id });
    }
    const researchGain = 6 + Math.floor(result.state.education / 18) + scienceAdvisorBonus;
    const breakthroughs = research.filter((project) => project.active && !project.complete && project.progress + researchGain >= project.duration);
    const newlyAvailableResearch = getNewlyAvailableResearch(research, previousYear, currentYear);

    setNationManagement(result.state);
    setGame((current) => applyGameDelta(applyGameDelta(applyGameDelta(current, result.gameDelta), publicHealthResult.gameDelta), postwarEquipmentResult.gameDelta));
    setEconomy((current) => ({
      ...advanceEconomyMarketWeek(current, { week: nextWeek, nationId: playerNation.id, game }).state,
      debt: Math.max(0, current.debt + result.economyDelta.debt),
      inflation: Math.max(0, Math.min(100, current.inflation + result.economyDelta.inflation)),
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.economyDelta.publicConfidence)),
      monetarySystem: monetaryResult.state,
    }));
    const marketResult = advanceEconomyMarketWeek(economy, { week: nextWeek, nationId: playerNation.id, game });
    if (marketResult.event) {
      addEvent(`시장 동향 — ${marketResult.event.title}`, `${marketResult.event.detail} 기업 평가가격에 반영했습니다. 전후 세입·지출은 국정 결산에서 한 번만 계산하며, 전시 사건의 국고·물가 보정은 중복 적용하지 않습니다.`, marketResult.event.tone, nextWeek);
    }
    if (monetaryResult.transition) {
      const nextCurrency = getCurrencyById(monetaryResult.transition.toCurrencyId);
      addEvent(`통화개혁 — ${nextCurrency?.name ?? monetaryResult.transition.toCurrencyId}`, monetaryResult.transition.note, 'neutral', nextWeek);
      notify(`${monetaryResult.transition.year}년 통화개혁: ${nextCurrency?.name ?? monetaryResult.transition.toCurrencyId}`);
    }
    setPublicHealth(publicHealthResult.state);
    setResearch((current) => advanceResearchProjects(current, researchGain, currentYear));
    const advancedStaff = advanceStaffRosterWeek(staff, developmentFocusId);
    const manageableStaffIds = new Set(advancedStaff.filter((member) => staffAuthority.managedDepartments.includes(member.department)).map((member) => member.id));
    const staffNarrativeResult = advanceStaffNarrativeWeek(staffNarrative, advancedStaff, nextWeek, manageableStaffIds, staffPlayContext);
    setStaff(staffNarrativeResult.staff);
    setStaffNarrative(staffNarrativeResult.state);
    const deliveryPledgeResult = advanceStaffDeliveryPledges(staffDeliveryPledgesRef.current, { ...staffDeliveryContext, week: nextWeek, staff: staffNarrativeResult.staff }, buildStaffDeliveryReceipts({
      nationId: playerNation.id, week: nextWeek, industryApplied: industryResult.applied, industryReport: industryResult.report,
      nationalDirectDelta: regionalResult.attribution?.applied ? regionalResult.attribution.stockpileDelta : null,
      deliveries: regionalResult.transport.deliveries,
    }));
    staffDeliveryPledgesRef.current = deliveryPledgeResult.state;
    setStaffDeliveryPledges(deliveryPledgeResult.state);
    deliveryPledgeResult.completed.forEach((pledge) => addEvent(`납품 약속 ${pledge.status === 'succeeded' ? '달성' : pledge.status === 'void' ? '종료' : '미달'} — ${pledge.staffName}`, `${pledge.lineName} · ${pledge.metric === 'factory-completed' ? '공장 생산 완료' : '국가 가용 도착'} ${pledge.receipts.reduce((sum, receipt) => sum + receipt.quantity, 0)}/${pledge.targetQuantity}개. ${pledge.resolution ?? ''} 추가 보상이나 비용은 적용하지 않습니다.`, pledge.status === 'succeeded' ? 'good' : 'neutral', nextWeek, undefined, { nationId: playerNation.id }));
    staffNarrativeResult.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      decision: event.decision,
      trigger: event.trigger,
      factors: event.factors,
      effects: event.effects,
      ongoing: event.ongoing,
      nextActions: event.nextActions,
      certainty: event.certainty,
    }));
    if (staffNarrativeResult.events.some((event) => event.title.startsWith('언론 노출') || event.title.startsWith('조직 갈등 폭발'))) {
      setSpeed(0);
      notify('참모 갈등이 공개 단계에 도달해 시간 진행을 일시 정지했습니다. 조직 운영에서 대응하십시오.');
    }
    if (nextWeek % 208 === 0) addEvent('임기 중간 조직개편 — 참모 스쿼드 재평가', '부처별 성과·계약·후보 뎁스를 비교하는 4년 주기 조직개편 창이 열렸습니다. 만료 계약은 자동 연장되지 않으며 사용자의 인사권 범위에서 갱신·승계·영입해야 합니다.', 'neutral', nextWeek);
    const historicalHorizon = getHistoricalHorizon(nextWeek, completedDecisions);
    const marketReviewWeek = nextWeek % 13 === 0;
    const intelligenceCandidates = marketReviewWeek ? createEmergentIntelligenceCandidates(playerNation.id, currentYear, worldline.timeline) : [];
    const laterEraCandidates = marketReviewWeek ? createLaterEraCandidates(playerNation.id, currentYear, historicalHorizon) : [];
    const knownCandidatePeople = new Set([...staffCandidates.map((candidate) => candidate.personId), ...staff.map((member) => member.personId)]);
    const newIntelligenceCandidates = intelligenceCandidates.filter((candidate) => !knownCandidatePeople.has(candidate.personId)).slice(0, 2);
    const newLaterEraCandidates = laterEraCandidates.filter((candidate) => !knownCandidatePeople.has(candidate.personId)).slice(0, 4);
    const rivalVictories = staffCandidates.filter((candidate) => candidate.status !== 'signed' && candidate.status !== 'lost' && weeklyRivalInterest(candidate) >= 100);
    staffCandidates.filter((candidate) => candidate.status === 'scouting' && candidate.knowledge < 100 && candidate.knowledge + (delegatedDepartments.has('personnel') ? 23 : 18) >= 100 && weeklyRivalInterest(candidate) < 100).forEach((candidate) => addEvent(
      '인재 조사 완료 — ' + candidate.name,
      '조사 정보 100%를 확보하고 슬롯을 반환했습니다. 추가 정치력 지출 없이 완료됐습니다. 조직 운영 → 후보 시장 → 완료 보고서에서 능력·경력·위험을 확인하고 협상 조건을 검토할 수 있습니다.',
      'good', nextWeek,
    ));
    setStaffCandidates((current) => {
      const existingPeople = new Set([...current.map((candidate) => candidate.personId), ...staff.map((member) => member.personId)]);
      const expanded = [
        ...current,
        ...newIntelligenceCandidates.filter((candidate) => !existingPeople.has(candidate.personId)),
        ...newLaterEraCandidates.filter((candidate) => !existingPeople.has(candidate.personId)),
      ];
      return advanceCandidateScouting(expanded, delegatedDepartments.has('personnel'));
    });
    setRelations((current) => current.map((relation) => ({
      ...relation,
      value: Math.max(0, Math.min(100, relation.value + (result.state.budget.diplomacy >= 20 ? 0.35 : result.state.budget.diplomacy <= 5 ? -0.2 : 0.08))),
    })));
    setCareer((current) => ({
      ...current,
      experience: current.experience + 5,
      reputation: Math.max(0, Math.min(100, current.reputation + (result.report.mandateScore >= 55 ? 0.4 : result.report.mandateScore < 40 ? -0.5 : 0.1))),
      councilTrust: Math.max(0, Math.min(100, current.councilTrust + (result.report.mandateScore >= 60 && result.state.legitimacy >= 60 ? 0.2 : result.report.mandateScore < 35 ? -0.25 : 0))),
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
    newlyAvailableResearch.forEach((project) => addEvent(
      `새 연구 세대 개방 — ${project.name}`,
      `${currentYear}년 기술·제도 조건이 도달했습니다. ${project.historicalBasis ?? project.description} 선행 연구를 갖추면 연구 슬롯에 배정할 수 있습니다.`,
      'neutral',
      nextWeek,
    ));
    newIntelligenceCandidates.forEach((candidate) => addEvent('비밀 인재 등장 — ' + candidate.name, `${candidate.historicalOffice} 경력의 인물이 ${candidate.affiliation} 계보와 함께 인재 시장에 등장했습니다.`, 'neutral', nextWeek));
    newLaterEraCandidates.forEach((candidate) => addEvent('새로운 세대 등장 — ' + candidate.name, `${candidate.birthYear}년생 실존 인물 · ${candidate.historicalOffice}. ${currentYear}년의 세대교체로 후보 시장에 합류했습니다.`, 'neutral', nextWeek));
    rivalVictories.forEach((candidate) => addEvent('경쟁 기관 영입 — ' + candidate.name, candidate.affiliation + '의 영향력 경쟁에서 밀렸습니다. 이 인물은 더 이상 영입할 수 없습니다.', 'bad', nextWeek));
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
    if (result.report.events.some((event) => event.id.startsWith('saga-act-') || event.id.startsWith('saga-setback-'))) {
      setSpeed(0);
      periodAdvanceStopReasonRef.current = '전략 서사의 새 막과 대응 원칙 선택';
      setPeriodAdvanceRemaining(0);
      notify('전략 서사의 새 막이 열렸습니다. 국가 운영에서 대응 원칙을 선택하십시오.');
    }
    if (result.report.events.some((event) => event.id.startsWith('socialist-stage-') || event.id.startsWith('socialist-setback-'))) {
      setSpeed(0);
      periodAdvanceStopReasonRef.current = '사회체제 전환 단계와 방법 선택';
      setPeriodAdvanceRemaining(0);
      notify('사회체제 전환의 새 단계가 열렸습니다. 국가 운영에서 전환 방식을 선택하십시오.');
    }
    if (shouldInterruptNationAdvance(result.report.events, {
      researchCompleted: breakthroughs.length > 0 || Boolean(postwarEquipmentResult.completedProject),
      researchUnlocked: newlyAvailableResearch.length > 0,
      publicHealthCrisis: publicHealthResult.events.some((event) => event.tone === 'bad'),
      requiresDecision: postwarEquipmentResult.completedOrders.length > 0,
    })) {
      periodAdvanceStopReasonRef.current = result.report.events[0]?.title
        ?? publicHealthResult.events[0]?.title
        ?? (postwarEquipmentResult.completedProject
          ? `장비 개발 완료 · ${postwarEquipmentResult.completedProject.name}`
          : postwarEquipmentResult.completedOrders.length > 0
            ? `병기 작업 완료 · ${postwarEquipmentResult.completedOrders.length}건`
            : breakthroughs[0]
          ? `연구 완료 · ${breakthroughs[0].name}`
          : newlyAvailableResearch[0]
            ? `새 연구 세대 개방 · ${newlyAvailableResearch[0].name}`
            : '정책 검증 시점 도달');
      setPeriodAdvanceRemaining(0);
    }
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
    const openedWorldFlashpoint = !openedCoup && scheduleWorldFlashpoint(nextWeek);
    if (openedCoup || openedWorldFlashpoint) setPeriodAdvanceRemaining(0);
    if (!openedCoup && !openedWorldFlashpoint && nextWeek % 52 === 26 && !pendingCouncilEventId) {
      const councilEvent = selectNextCouncilEvent(playerNation.id, careerRole.branch, currentYear, resolvedCouncilChoices);
      if (councilEvent) {
        setPendingCouncilEventId(councilEvent.id);
        setSpeed(0);
        addEvent('국정 의제 소집 — ' + councilEvent.category, councilEvent.title, councilEvent.historicalYear ? 'neutral' : 'bad', nextWeek);
      }
    }
  }, [staffDeliveryContext, regionalIndustryContext, armsPortfolio, divisions, doctrine, equipmentDevelopment, postwarIndustry, postwarIndustryForecast, postwarIndustrySettings, production, scienceAdvisor, stockpile, addEvent, careerRole, completedDecisions, delegatedDepartments, developmentFocusId, economy, formatGameMoney, game, nationManagement, nationProgramCommitments, nationWeekProjection, notify, pendingCouncilEventId, playerNation.id, publicHealth, publicHealthContext, relationAverage, research, resolvedCouncilChoices, scheduleCoupCheck, scheduleWorldFlashpoint, scienceAdvisorBonus, staff, staffAuthority.managedDepartments, staffCandidates, staffNarrative, staffPlayContext, worldline.timeline]);

  const advanceNationalProgramWeek = useCallback((nextWeek: number) => {
    const activeNationalProgram = getNationalProgram(playerNation, career.alternatePathId);
    const nationalProgramStartedWeek = getNationalProgramStartedWeek(career.alternatePathId, completedDecisions);
    const nationalProgramPulse = getNationalProgramPulse(
      activeNationalProgram,
      nationalProgramStartedWeek,
      nextWeek,
      completedDecisions,
    );
    setGame((current) => applyGameDelta(current, nationalProgramPulse.gameDelta));
    if (nationalProgramPulse.relationDelta !== 0) {
      setRelations((current) => current.map((relation) => ({
        ...relation,
        value: Math.max(0, Math.min(100, relation.value + nationalProgramPulse.relationDelta)),
      })));
    }
    if (activeNationalProgram && nationalProgramPulse.milestone) {
      const milestone = nationalProgramPulse.milestone;
      setCompletedDecisions((current) => Array.from(new Set([
        ...current,
        getNationalProgramMilestoneMarker(activeNationalProgram.id, milestone.week),
      ])));
      addEvent(
        `국가 프로그램 이정표 — ${milestone.title}`,
        `${activeNationalProgram.title} ${milestone.week}주차 검증을 통과했습니다. ${milestone.detail} 확정 보상: ${milestone.reward}.`,
        activeNationalProgram.tone === 'hardline' && milestone.week === 26 ? 'neutral' : 'good',
        nextWeek,
        {
          domain: 'management',
          decision: `${activeNationalProgram.title} 노선을 ${milestone.week}주 동안 유지해 ‘${milestone.title}’ 단계까지 집행했습니다.`,
          trigger: `국가 프로그램 시작 뒤 ${milestone.week}주가 경과했습니다.`,
          factors: [
            nationalProgramToneMeta[activeNationalProgram.tone].cadence,
            nationalProgramToneMeta[activeNationalProgram.tone].tradeoff,
            `채택 노선: ${activeNationalProgram.summary}`,
          ],
          effects: [{ label: `${milestone.week}주 보상`, value: milestone.reward, tone: activeNationalProgram.tone === 'hardline' && milestone.week === 26 ? 'neutral' : 'positive' }],
          ongoing: [milestone.week < 26 ? `다음 이정표까지 같은 노선의 주간 비용과 보너스가 계속됩니다.` : '상설 프로그램으로 전환되며 4주 주기 효과와 13주 정기감사가 함께 적용됩니다.'],
          nextActions: [milestone.week < 26 ? '지휘 본부에서 다음 검토 시점과 장기 비용을 확인하십시오.' : '노선을 유지하거나 정치력을 사용해 새로운 국가 프로그램으로 전환할 수 있습니다.'],
          certainty: 'confirmed',
        },
      );
      notify(`${activeNationalProgram.title}: ${milestone.title} 달성`);
    }
    if (activeNationalProgram && nationalProgramPulse.review) {
      const review = nationalProgramPulse.review;
      setCompletedDecisions((current) => Array.from(new Set([
        ...current,
        getNationalProgramReviewMarker(activeNationalProgram.id, review.week),
      ])));
      addEvent(
        `국가 프로그램 정기감사 — ${review.title}`,
        `${activeNationalProgram.title} 상설 운영 ${review.cycle}기 평가가 끝났습니다. ${review.detail} 확정 결과: ${review.reward}.`,
        activeNationalProgram.tone === 'hardline' ? 'neutral' : 'good',
        nextWeek,
        {
          domain: 'management',
          decision: `${activeNationalProgram.title} 노선을 폐기하지 않고 상설 기관으로 유지했습니다.`,
          trigger: `26주 제도화 이후 ${review.week}주차 정기감사 시점에 도달했습니다.`,
          factors: [
            nationalProgramToneMeta[activeNationalProgram.tone].cadence,
            nationalProgramToneMeta[activeNationalProgram.tone].tradeoff,
            review.warning,
          ],
          effects: [{ label: `${review.cycle}기 감사 결과`, value: review.reward, tone: activeNationalProgram.tone === 'hardline' ? 'neutral' : 'positive' }],
          ongoing: [
            '다음 13주 동안 같은 집행 방식과 비용 구조가 이어집니다.',
            review.warning,
          ],
          nextActions: [
            '국가 운영 화면에서 다음 감사까지 남은 주와 누적 부담을 확인하십시오.',
            '부작용이 커졌다면 정치력을 사용해 다른 국가 프로그램으로 전환할 수 있습니다.',
          ],
          certainty: 'confirmed',
        },
      );
      notify(`${activeNationalProgram.title}: ${review.title} 완료`);
    }
  }, [addEvent, career.alternatePathId, completedDecisions, notify, playerNation]);

  const advanceRoleDeskWeek = useCallback((nextWeek: number) => {
    const result = advanceRoleCommandWeek(roleCommand, displayedCareerRole, nextWeek);
    setRoleCommand(result.state);
    if (result.careerDelta.experience || result.careerDelta.councilTrust || result.careerDelta.reputation) {
      setCareer((current) => ({
        ...current,
        experience: current.experience + result.careerDelta.experience,
        councilTrust: Math.min(100, current.councilTrust + result.careerDelta.councilTrust),
        reputation: Math.min(100, current.reputation + result.careerDelta.reputation),
      }));
      addEvent(
        `보직 주간임무 완료 — ${roleCommand.objective.title}`,
        `${roleCommand.objective.reward}. 직접 책임 업무와 지휘계통 행동을 모두 마쳐 인사기록에 반영됐습니다.`,
        'good',
        nextWeek,
        {
          domain: 'management',
          decision: `${displayedCareerRole.title}의 보직별 주간 순환을 완료했습니다.`,
          trigger: roleCommand.objective.tasks.map((task) => `${task.label}: ${task.done ? '완료' : '미완료'}`).join(' · '),
          factors: [`상급자 호의 ${Math.round(roleCommand.officialFavor)}`, `명령 불복 기록 ${Math.round(roleCommand.defiance)}`],
          effects: [
            { label: '경력 경험', value: `+${result.careerDelta.experience}`, tone: 'positive' },
            { label: '지도부 신임', value: `+${result.careerDelta.councilTrust}`, tone: 'positive' },
            { label: '개인 평판', value: `+${result.careerDelta.reputation}`, tone: 'positive' },
          ],
          ongoing: ['새 주에는 현재 보직과 시점에 맞는 다음 책임 순환이 생성됩니다.'],
          nextActions: ['지휘 본부에서 새 주간임무와 권한 심사 결과를 확인하십시오.'],
          certainty: 'confirmed',
        },
      );
    }
    result.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      decision: `${event.tab} 업무의 지휘계통 절차를 진행했습니다.`,
      trigger: `${displayedCareerRole.title}의 공식 권한 범위와 상급기관 심사`,
      factors: [`상급자 호의 ${Math.round(result.state.officialFavor)}`, `불복 기록 ${Math.round(result.state.defiance)}`],
      effects: [{ label: '권한 상태', value: event.title, tone: event.tone === 'good' ? 'positive' : event.tone === 'bad' ? 'negative' : 'neutral' }],
      ongoing: ['승인된 권한은 정해진 주까지만 유지되고 이후 원래 지휘계통으로 돌아갑니다.'],
      nextActions: [event.tone === 'bad' ? '근거 보강·후원자 설득·공개 압박 중 하나로 재상신할 수 있습니다.' : '위임 기간 안에 해당 화면에서 필요한 조치를 집행하십시오.'],
      certainty: 'confirmed',
    }));
  }, [addEvent, displayedCareerRole, roleCommand]);

  const advanceWeek = useCallback(() => {
    if (pendingWorldFlashpointId || pendingCouncilEventId || pendingCoupIncident || hasClandestineIncident) return;
    const advanceRequest = `${career.nationId}:${game.week}`;
    if (lastWeekAdvanceRequestRef.current === advanceRequest) return;
    lastWeekAdvanceRequestRef.current = advanceRequest;
    setUXActionLifecycle((current) => markUXActionsForVerification(current, game.week));
    advanceRoleDeskWeek(game.week + 1);
    advanceNationalProgramWeek(game.week + 1);
    if (campaignPhase === 'nation') {
      advanceNationWeek();
      settleNationalSupplyWeek(game.week + 1);
      return;
    }
    const nextWeek = game.week + 1;
    const jointWeekResult = advanceJointOperationsWeek(jointForces, { week: nextWeek, theater: activeTheater, game });
    setJointForces(jointWeekResult.state);
    setGame((current) => applyGameDelta(current, jointWeekResult.gameDelta));
    setStockpile((current) => ({
      ...current,
      aircraft: Math.max(0, current.aircraft + jointWeekResult.aircraftDelta),
      convoys: Math.max(0, current.convoys + jointWeekResult.convoyDelta),
    }));
    jointWeekResult.events.forEach((event) => {
      const operation = jointForces.operations.find((item) => item.id === event.operationId);
      const template = operation ? jointOperationTemplates.find((item) => item.id === operation.templateId) : undefined;
      addEvent(event.title, event.detail, event.tone, nextWeek, {
        domain: 'operations',
        decision: `${template?.name ?? '합동작전'}에 편성된 함대·항공대를 다주간 운용했습니다.`,
        trigger: event.resolved ? '최소 작전기간과 누적 진척이 충족되어 최종 판정을 내렸습니다.' : '작전 중간 점검 주차에 도달했습니다.',
        factors: [
          `합동교리: ${jointDoctrineDefinitions[jointForces.doctrine].name}`,
          `공군력 ${Math.round(game.airPower)} · 해군력 ${Math.round(game.navalPower)}`,
          `정보 ${Math.round(game.intelNetwork)} · 적 대응압력 ${Math.round(game.enemyPressure)}`,
          operation ? `초기 성공 전망 ${operation.successChance}%` : '작전 전망 기록 유지',
        ],
        effects: [
          { label: '항공기 손실', value: `${jointWeekResult.aircraftDelta}대`, tone: jointWeekResult.aircraftDelta < 0 ? 'negative' : 'neutral' },
          { label: '수송선 손실', value: `${jointWeekResult.convoyDelta}척`, tone: jointWeekResult.convoyDelta < 0 ? 'negative' : 'neutral' },
          { label: '전황', value: `${jointWeekResult.gameDelta.victoryScore ?? 0}`, tone: (jointWeekResult.gameDelta.victoryScore ?? 0) > 0 ? 'positive' : 'neutral' },
        ],
        ongoing: [event.worldEffect ?? '투입 부대의 준비도와 가동률이 다음 주에도 이어집니다.'],
        nextActions: [event.resolved ? '합동군 화면의 전구 변화 기록에서 결과와 세계 효과를 확인하십시오.' : '진척과 가동률을 확인하고 완료 전까지 다른 임무에 중복 배속하지 마십시오.'],
        certainty: event.resolved ? 'confirmed' : 'developing',
      });
    });

    if (career.civilian && !career.civilian.enteredOfficeRoleId) {
      const nextCivilian = advanceCivilianCareerWeek(career.civilian);
      setCareer((current) => ({ ...current, civilian: nextCivilian }));
      if (nextCivilian.stage !== career.civilian.stage) {
        addEvent(
          `민간 위상 변화 — ${getCivilianStageLabel(nextCivilian.stage)}`,
          `누적된 전문성·평판·인맥으로 사회적 활동 단계가 상승했습니다. 새로운 제도권 제안과 고위험 민간 행동의 조건을 확인하십시오.`,
          'good',
          nextWeek,
        );
      }
    }
    const hasActiveLandOrders = orders.some((order) => order.startedWeek < nextWeek);
    const weeklyOrderComparisons: WarEventComparison[] = [];
    const publicHealthResult = advancePublicHealthWeek(publicHealth, publicHealthContext);
    const economyResult = advanceEconomyWeek(economy, {
      week: nextWeek,
      nationId: playerNation.id,
      game,
      staffWeeklyCost,
      economyAdvisorBonus,
    });
    const warMediaEffects = advanceMediaRelationsWeek(nationManagement.mediaRelations, {
      week: nextWeek,
      year: getCampaignYearForWeek(nextWeek),
      role: careerRole,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      legitimacy: nationManagement.legitimacy,
      unrest: nationManagement.unrest,
      education: nationManagement.education,
      institutionalCapacity: nationManagement.institutionalCapacity,
      inflation: economy.inflation,
      publicConfidence: economy.publicConfidence,
      intelNetwork: game.intelNetwork,
      governmentFormId: nationManagement.dynasty.formId,
      strategyId: nationManagement.strategyId,
      activeElection: Boolean(nationManagement.electoral.activeCampaign),
      personalLife: nationManagement.personalLife,
    });
    const warJusticeEffects = advanceJusticeWeek(nationManagement.justice, {
      week: nextWeek,
      year: getCampaignYearForWeek(nextWeek),
      phase: 'war',
      nationId: playerNation.id,
      role: careerRole,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      intelNetwork: game.intelNetwork,
      legitimacy: nationManagement.legitimacy,
      unrest: nationManagement.unrest,
      institutionalCapacity: nationManagement.institutionalCapacity,
      mediaFreedom: warMediaEffects.state.freedom,
      pressTrust: warMediaEffects.state.pressTrust,
      activeElection: Boolean(nationManagement.electoral.activeCampaign),
      strategyId: nationManagement.strategyId,
    });
    const warConstitutionalEffects = advanceConstitutionalJudiciaryWeek(nationManagement.constitutionalJudiciary, {
      week: nextWeek,
      year: getCampaignYearForWeek(nextWeek),
      nationId: playerNation.id,
      role: careerRole,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      legitimacy: nationManagement.legitimacy,
      institutionalCapacity: nationManagement.institutionalCapacity,
      publicConfidence: economy.publicConfidence,
    });
    const warSovereignEffects = advanceSovereignPowersWeek(nationManagement.sovereignPowers, {
      week: nextWeek,
      year: getCampaignYearForWeek(nextWeek),
      nationId: playerNation.id,
      role: careerRole,
      formId: nationManagement.dynasty.formId,
      constitution: warConstitutionalEffects.state,
      dynasty: nationManagement.dynasty,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      legitimacy: nationManagement.legitimacy,
      unrest: nationManagement.unrest,
      publicConfidence: economy.publicConfidence,
      institutionalCapacity: nationManagement.institutionalCapacity,
      mediaFreedom: warMediaEffects.state.freedom,
      justiceIndependence: warJusticeEffects.state.independence,
    });
    const warPowerEffects = advancePowerNetworkWeek(nationManagement.powerNetwork, {
      week: nextWeek,
      year: getCampaignYearForWeek(nextWeek),
      phase: 'war',
      nationId: playerNation.id,
      role: careerRole,
      strategyId: nationManagement.strategyId,
      budget: nationManagement.budget,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      warSupport: game.warSupport,
      enemyPressure: game.enemyPressure,
      intelNetwork: game.intelNetwork,
      legitimacy: nationManagement.legitimacy,
      unrest: nationManagement.unrest,
      welfare: nationManagement.welfare,
      education: nationManagement.education,
      employment: nationManagement.employment,
      civilianIndustry: nationManagement.civilianIndustry,
      institutionalCapacity: nationManagement.institutionalCapacity,
      inequality: nationManagement.inequality,
      relativeCompetitiveness: nationManagement.relativeCompetitiveness,
      relationAverage,
      inflation: economy.inflation,
      publicConfidence: economy.publicConfidence,
      mediaFreedom: warMediaEffects.state.freedom,
      pressTrust: warMediaEffects.state.pressTrust,
      activeElection: Boolean(nationManagement.electoral.activeCampaign),
    });
    const warSagaEffects = advanceStrategicSagaWeek(nationManagement.strategicSaga, {
      week: nextWeek,
      year: getCampaignYearForWeek(nextWeek),
      phase: 'war',
      nationId: playerNation.id,
      role: careerRole,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      warSupport: game.warSupport,
      enemyPressure: game.enemyPressure,
      intelNetwork: game.intelNetwork,
      legitimacy: nationManagement.legitimacy,
      unrest: nationManagement.unrest,
      education: nationManagement.education,
      civilianIndustry: nationManagement.civilianIndustry,
      institutionalCapacity: nationManagement.institutionalCapacity,
      relativeCompetitiveness: nationManagement.relativeCompetitiveness,
      relationAverage,
      publicConfidence: economy.publicConfidence,
      inflation: economy.inflation,
      completedResearch: research.filter((project) => project.complete).length,
      publicHealthPressure: publicHealth.activeOutbreak
        ? Math.max(publicHealth.activeOutbreak.hospitalLoad, publicHealth.activeOutbreak.weeklyCases / 10_000)
        : publicHealth.outbreakPressure * .12,
      coalitionSupport: nationManagement.powerNetwork.blocs.reduce((sum, bloc) => sum + bloc.support, 0) / Math.max(1, nationManagement.powerNetwork.blocs.length),
      promiseReliability: nationManagement.powerNetwork.promiseReliability,
    });
    const warBlocById = new globalThis.Map(nationManagement.powerNetwork.blocs.map((bloc) => [bloc.id, bloc]));
    const warSocialistEffects = advanceSocialistWorldWeek(nationManagement.socialistWorld, {
      week: nextWeek,
      year: getCampaignYearForWeek(nextWeek),
      phase: 'war',
      nationId: playerNation.id,
      role: careerRole,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      warSupport: game.warSupport,
      enemyPressure: game.enemyPressure,
      legitimacy: nationManagement.legitimacy,
      unrest: nationManagement.unrest,
      welfare: nationManagement.welfare,
      employment: nationManagement.employment,
      inequality: nationManagement.inequality,
      education: nationManagement.education,
      civilianIndustry: nationManagement.civilianIndustry,
      institutionalCapacity: nationManagement.institutionalCapacity,
      publicConfidence: economy.publicConfidence,
      inflation: economy.inflation,
      relationAverage,
      laborSupport: warBlocById.get('labor')?.support ?? 50,
      laborInfluence: warBlocById.get('labor')?.influence ?? 50,
      civicSupport: warBlocById.get('civic')?.support ?? 50,
      intelligentsiaSupport: warBlocById.get('intelligentsia')?.support ?? 50,
      securitySupport: warBlocById.get('security')?.support ?? 50,
    });
    setNationManagement((current) => ({
      ...current,
      mediaRelations: {
        ...warMediaEffects.state,
        freedom: Math.max(0, Math.min(100, warMediaEffects.state.freedom + warSovereignEffects.impact.mediaFreedom)),
        pressTrust: Math.max(0, Math.min(100, warMediaEffects.state.pressTrust + warSovereignEffects.impact.pressTrust)),
      },
      justice: warJusticeEffects.state,
      constitutionalJudiciary: {
        ...warConstitutionalEffects.state,
        courtIndependence: Math.max(0, Math.min(100, warConstitutionalEffects.state.courtIndependence + warSovereignEffects.impact.justiceIndependence)),
      },
      sovereignPowers: warSovereignEffects.state,
      dynasty: {
        ...current.dynasty,
        crownAuthority: Math.max(0, Math.min(100, current.dynasty.crownAuthority + warSovereignEffects.impact.crownAuthority)),
        courtUnity: Math.max(0, Math.min(100, current.dynasty.courtUnity + warSovereignEffects.impact.courtUnity)),
        successionSecurity: Math.max(0, Math.min(100, current.dynasty.successionSecurity + warSovereignEffects.impact.successionSecurity)),
        estateBurden: Math.max(0, Math.min(100, current.dynasty.estateBurden + warSovereignEffects.impact.estateBurden)),
      },
      personalLife: warMediaEffects.personalLife,
      powerNetwork: warPowerEffects.state,
      strategicSaga: warSagaEffects.state,
      socialistWorld: warSocialistEffects.state,
      welfare: Math.max(0, Math.min(100, current.welfare + warSocialistEffects.nationDelta.welfare)),
      employment: Math.max(0, Math.min(100, current.employment + warSocialistEffects.nationDelta.employment)),
      inequality: Math.max(0, Math.min(100, current.inequality + warSocialistEffects.nationDelta.inequality)),
      civilianIndustry: Math.max(0, Math.min(100, current.civilianIndustry + warSocialistEffects.nationDelta.civilianIndustry)),
      institutionalCapacity: Math.max(0, Math.min(100, current.institutionalCapacity + warSocialistEffects.nationDelta.institutionalCapacity + warJusticeEffects.institutionalCapacityDelta)),
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + warMediaEffects.legitimacy + warPowerEffects.legitimacy + warSagaEffects.legitimacy + warSocialistEffects.nationDelta.legitimacy + warJusticeEffects.legitimacyDelta + warSovereignEffects.impact.legitimacy)),
      unrest: Math.max(0, Math.min(100, current.unrest + warMediaEffects.unrest + warPowerEffects.unrest + warSagaEffects.unrest + warSocialistEffects.nationDelta.unrest + warJusticeEffects.unrestDelta + warSovereignEffects.impact.unrest)),
    }));
    if (warSovereignEffects.impact.stability !== 0) setGame((current) => applyGameDelta(current, { stability: warSovereignEffects.impact.stability }));
    if (warMediaEffects.stability !== 0) setGame((current) => applyGameDelta(current, { stability: warMediaEffects.stability }));
    if (warPowerEffects.stability !== 0 || warPowerEffects.politicalPower !== 0 || warPowerEffects.treasury !== 0) setGame((current) => applyGameDelta(current, { stability: warPowerEffects.stability, politicalPower: warPowerEffects.politicalPower, treasury: warPowerEffects.treasury }));
    if (warSagaEffects.stability !== 0 || warSagaEffects.politicalPower !== 0 || warSagaEffects.treasury !== 0) setGame((current) => applyGameDelta(current, { stability: warSagaEffects.stability, politicalPower: warSagaEffects.politicalPower, treasury: warSagaEffects.treasury }));
    if (warSocialistEffects.stability !== 0 || warSocialistEffects.politicalPower !== 0 || warSocialistEffects.treasury !== 0) setGame((current) => applyGameDelta(current, { stability: warSocialistEffects.stability, politicalPower: warSocialistEffects.politicalPower, treasury: warSocialistEffects.treasury }));
    if (warJusticeEffects.stabilityDelta !== 0 || warJusticeEffects.politicalPowerDelta !== 0 || warJusticeEffects.treasuryDelta !== 0) setGame((current) => applyGameDelta(current, { stability: warJusticeEffects.stabilityDelta, politicalPower: warJusticeEffects.politicalPowerDelta, treasury: warJusticeEffects.treasuryDelta }));
    if (warMediaEffects.publicConfidence !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + warMediaEffects.publicConfidence)),
    }));
    if (warSovereignEffects.impact.publicConfidence !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + warSovereignEffects.impact.publicConfidence)),
    }));
    if (warPowerEffects.publicConfidence !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + warPowerEffects.publicConfidence)),
    }));
    if (warSagaEffects.publicConfidence !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + warSagaEffects.publicConfidence)),
    }));
    if (warSocialistEffects.publicConfidence !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + warSocialistEffects.publicConfidence)),
    }));
    if (warJusticeEffects.publicConfidenceDelta !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + warJusticeEffects.publicConfidenceDelta)),
    }));
    warJusticeEffects.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      trigger: event.cause,
      decision: '사건 인지·수사·기소·재판·보도 절차가 한 주 진행됐습니다.',
      factors: [`사법 독립 ${Math.round(warJusticeEffects.state.independence)}`, `무처벌 위험 ${Math.round(warJusticeEffects.state.impunity)}`, `언론 자유 ${Math.round(warMediaEffects.state.freedom)}`],
      effects: [{ label: '후속 절차', value: event.consequence, tone: event.tone === 'bad' ? 'negative' : event.tone === 'good' ? 'positive' : 'neutral' }],
      ongoing: [warJusticeEffects.note],
      nextActions: ['전후 설계의 사법·검찰·보도 사건 장부에서 기한, 증거, 검사 안전과 결재안을 확인하십시오.'],
      certainty: event.requiresDecision ? 'developing' : 'confirmed',
    }));
    if (warJusticeEffects.events.some((event) => event.requiresDecision)) {
      setSpeed(0);
      setPeriodAdvanceRemaining(0);
      notify('사법·검찰 긴급 결재가 도착했습니다. 전후 설계의 사건 장부에서 확인하십시오.');
    }
    warConstitutionalEffects.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      trigger: '최고위 보직 진입, 판사·검사 후보 검증기한 또는 사법 고위직 임기 조건이 충족됐습니다.',
      decision: '헌정·사법 인사 절차가 다음 단계로 이동했습니다.',
      factors: [`현재 보직 ${careerRole.title} · ${careerRole.tier}급`, `법원 독립 ${Math.round(warConstitutionalEffects.state.courtIndependence)}`, `검찰 자율 ${Math.round(warConstitutionalEffects.state.prosecutorialAutonomy)}`],
      effects: [{ label: '후속 절차', value: event.detail, tone: event.tone === 'bad' ? 'negative' : event.tone === 'good' ? 'positive' : 'neutral' }],
      ongoing: ['헌법 조항과 임명 결과는 이후 권력형 사건, 쿠데타, 언론 자유와 공정재판 판정에 계속 남습니다.'],
      nextActions: ['전후 설계의 헌정 창설과 사법 인사 화면에서 초안 또는 인준 결재를 확인하십시오.'],
      certainty: 'developing',
    }));
    if (warConstitutionalEffects.events.length > 0) {
      setSpeed(0);
      setPeriodAdvanceRemaining(0);
      notify('헌정·사법 인사 절차가 갱신됐습니다. 전후 설계에서 확인하십시오.');
    }
    warSovereignEffects.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      trigger: event.cause,
      decision: '국가원수·군주·귀족 권한의 행사 후 헌정적 효력과 세력 반응을 검증했습니다.',
      factors: [`헌정 관례 ${Math.round(warSovereignEffects.state.constitutionalConvention)}`, `의회 신임 ${Math.round(warSovereignEffects.state.parliamentaryConfidence)}`, `귀족 지레버리지 ${Math.round(warSovereignEffects.state.aristocraticLeverage)}`],
      effects: [{ label: '후속 결과', value: event.consequence, tone: event.tone === 'bad' ? 'negative' : event.tone === 'good' ? 'positive' : 'neutral' }],
      ongoing: [warSovereignEffects.note],
      nextActions: ['전후 설계의 직위·왕관·영지 권한 화면에서 권한 행사 장부를 확인하십시오.'],
      certainty: 'confirmed',
    }));
    warMediaEffects.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      trigger: event.cause,
      decision: '언론 편집국과 경쟁 집단이 현재 보직·여론·개인정보 공개 경계를 평가했습니다.',
      factors: [`언론법 ${warMediaEffects.state.lawId}`, `언론 자유 ${Math.round(warMediaEffects.state.freedom)}`, `보직 ${careerRole.title}`],
      effects: [{ label: '후속 상태', value: event.consequence, tone: event.tone === 'bad' ? 'negative' : 'neutral' }],
      ongoing: [warMediaEffects.note],
      nextActions: ['전후 설계 화면의 전시 언론 데스크에서 인터뷰 답변 또는 폭로 대응을 선택하십시오.'],
      certainty: event.id.includes('exposure') ? 'developing' : 'confirmed',
    }));
    if (warMediaEffects.events.some((event) => event.id.includes('interview-request') || event.id.includes('exposure-open'))) {
      setSpeed(0);
      notify('새 언론 요청 또는 사생활 제보가 도착했습니다. 전후 설계의 전시 언론 데스크에서 확인하십시오.');
    }
    warPowerEffects.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      trigger: event.cause,
      decision: '전시 지도부의 공약·세력 관계·경쟁자·장기 유산이 한 주 진행됐습니다.',
      factors: [`연정 지지와 공약 신뢰`, `경쟁자 ${warPowerEffects.state.rival.name} 압력 ${Math.round(warPowerEffects.state.rival.pressure)}`, `보직 ${careerRole.title}`],
      effects: [{ label: '후속 상태', value: event.consequence, tone: event.tone === 'bad' ? 'negative' : event.tone === 'good' ? 'positive' : 'neutral' }],
      ongoing: [warPowerEffects.note],
      nextActions: ['전후 설계의 전시 권력 생태계에서 공약·기회·경쟁자 대응을 선택하십시오.'],
      certainty: 'confirmed',
    }));
    if (warPowerEffects.events.some((event) => event.id.includes('opportunity-open') || event.id.includes('promise-broken') || event.id.includes('rival-move'))) {
      setSpeed(0);
      notify('권력 생태계에 새로운 결재·공약 위기·경쟁자 행동이 발생했습니다. 전후 설계 화면에서 확인하십시오.');
    }
    warSagaEffects.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      trigger: event.cause,
      decision: '담당 참모, 대응 원칙, 투입 자원과 누적 압력이 함께 국면을 움직였습니다.',
      factors: [
        `진행 국면 ${warSagaEffects.state.active?.definitionId ?? '완결 또는 제안 단계'}`,
        `정치력 ${Math.round(game.politicalPower)} · 국고 ${formatGameMoney(game.treasury)}`,
        `공약 신뢰 ${Math.round(nationManagement.powerNetwork.promiseReliability)}`,
      ],
      effects: [{ label: '시대 유산', value: event.consequence, tone: event.tone === 'bad' ? 'negative' : event.tone === 'good' ? 'positive' : 'neutral' }],
      ongoing: ['후퇴해도 게임은 끝나지 않으며 제도적 상처와 전환점이 최종 결말과 다음 시대에 남습니다.'],
      nextActions: [warSagaEffects.requiresDecision ? '전후 설계의 전략 서사에서 다음 막의 대응 원칙을 선택하십시오.' : '전략 서사에서 진행도·압력·기세를 확인하십시오.'],
      certainty: 'developing',
    }));
    if (warSagaEffects.requiresDecision) {
      setSpeed(0);
      setPeriodAdvanceRemaining(0);
      notify('전략 서사의 새 막이 열렸습니다. 전후 설계에서 대응 원칙을 선택하십시오.');
    }
    warSocialistEffects.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      trigger: event.cause,
      decision: '전시 노동·농촌·당·시민조직과 국가기관의 권력 재편이 한 주 진행됐습니다.',
      factors: [
        `계급 압력 ${Math.round(warSocialistEffects.state.classPressure)} · 노동 조직 ${Math.round(warSocialistEffects.state.workerOrganization)}`,
        `사회적 소유 ${Math.round(warSocialistEffects.state.socialOwnership)} · 강제력 ${Math.round(warSocialistEffects.state.coercion)}`,
        `현재 모델 ${warSocialistEffects.state.currentModelId ?? '혼합질서'}`,
      ],
      effects: [{ label: '체제 결과', value: event.consequence, tone: event.tone === 'bad' ? 'negative' : event.tone === 'good' ? 'positive' : 'neutral' }],
      ongoing: ['전환 방식은 매 단계 다시 선택할 수 있으며 성과와 강제·부족·관료화의 비용이 함께 누적됩니다.'],
      nextActions: [warSocialistEffects.requiresDecision ? '전후 설계의 사회체제 화면에서 다음 전환 방식을 선택하십시오.' : '사회체제 화면에서 조직·소유·당권·평의회·시장 지표를 확인하십시오.'],
      certainty: 'developing',
    }));
    if (warSocialistEffects.requiresDecision) {
      setSpeed(0);
      setPeriodAdvanceRemaining(0);
      notify('사회체제 전환의 새 단계가 열렸습니다. 전후 설계에서 방법을 선택하십시오.');
    }
    setCommanderDevelopment((current) => recoverCommanderFatigue(current));

    const landWeekResult = resolveLandOrdersWeek({
      week: nextWeek, orders, divisions: effectiveDivisions, commanders: effectiveCommanders, territories,
      playerFaction, stance: battleStance, doctrine, enemyPressure: game.enemyPressure,
      intelNetwork: game.intelNetwork, policyAttackBonus, priorityDivisionId,
      completedAirSupport: getCompletedCloseAirSupport(jointForces.operations, jointWeekResult.state.records, nextWeek),
    });
    setOrders(landWeekResult.orders);
    const capturedThisWeek = new Set<string>();
    for (const entry of landWeekResult.entries) {
      if (entry.kind === 'invalid') {
        addEvent('집행 불가 명령 정리', entry.reason, 'neutral', nextWeek);
        const hasAnotherOrder = landWeekResult.orders.some((order) => order.divisionId === entry.order.divisionId)
          || landWeekResult.entries.some((other) => other.kind !== 'invalid' && other.order.divisionId === entry.order.divisionId);
        if (!hasAnotherOrder) setDivisions((current) => current.map((division) => division.id === entry.order.divisionId && (division.status === 'moving' || division.status === 'combat') ? { ...division, status: division.organization >= 70 ? 'ready' : 'recovering' } : division));
        continue;
      }
      if (entry.kind === 'stopped') {
        setDivisions((current) => current.map((division) => division.id === entry.division.id ? { ...division, status: entry.releasedStatus } : division));
        setOperationStoppages((current) => normalizeOperationStopReceipts([entry.receipt, ...current]));
        addEvent('공세 중단 완료', `${entry.division.name}: ${entry.reason}`, 'neutral', nextWeek, {
          domain: 'operations', decision: '승인된 공세의 다음 교전을 중단했습니다.', trigger: `명령 ${getOperationOrderId(entry.order)} · 중단 요청 주 ${entry.order.stopRequestedWeek! + 1}`,
          factors: ['이미 확정된 피해·비용은 유지합니다. 목표 점령이나 승인비 환급은 없습니다.'],
          effects: [{ label: '공세 명령', value: '중단 완료 · 이번 주 신규 교전 없음', tone: 'neutral' }],
          ongoing: ['부대 위치와 기존 전력은 보존됩니다. 정기 회복·재보급은 별도 주간 규칙입니다.'], nextActions: ['작전 현장에서 중단 기록을 확인하고 편제·합동군에서 재정비하십시오.'], certainty: 'confirmed',
        }, { nationId: playerNation.id });
        weeklyOrderComparisons.push({ label: '공세 중단', expected: '다음 교전 전에 중단', actual: '신규 교전 없이 명령 해제', status: 'matched', explanation: entry.reason });
        continue;
      }
      const { division, target } = entry;
      if (entry.kind === 'move') {
          weeklyOrderComparisons.push({
            label: '작전 명령',
            expected: `${target.name} 우군 집결`,
            actual: `${division.name} 이동 완료`,
            status: 'matched',
            explanation: '이미 확보한 영토로의 이동은 전투 판정 없이 예정대로 해결됐습니다.',
          });
          setDivisions((current) => current.map((item) => item.id === division.id ? {
            ...item,
            territoryId: target.id,
            status: 'ready',
            organization: Math.max(0, item.organization - 3),
            supply: Math.max(0, item.supply - 2),
          } : item));
          addEvent('우군 집결 — ' + target.name, `${withJosa(division.name, '이/가')} 확보된 교두보에 합류했습니다.`, 'neutral', nextWeek);
          notify(`${withJosa(division.name, '이/가')} ${target.name}에 합류했습니다.`);
        } else {
          const { commander, stance: orderStance, forecast: preBattleForecast, resolution: operationResolution } = entry;
          const resolvedBattle = operationResolution.report;
          const existingDevelopment = getCommanderRecord(commanderDevelopment, commander);
          const recoveredDevelopment = { ...existingDevelopment, fatigue: Math.max(0, existingDevelopment.fatigue - 3) };
          const developmentResult = recordBattleExperience(recoveredDevelopment, resolvedBattle, orderStance);
          const battleHonor = operationResolution.outcome === 'victory' ? getBattleHonor(resolvedBattle) : undefined;
          const battleReport: BattleReport = {
            ...resolvedBattle,
            commanderId: commander.id,
            targetValue: target.value,
            frontId: target.frontId,
            commanderXpGained: developmentResult.xpGained,
            battleHonor,
            appliedLosses: {
              strength: Math.min(divisions.find((item) => item.id === division.id)?.strength ?? 0, resolvedBattle.attackerStrengthLoss),
              organization: Math.min(divisions.find((item) => item.id === division.id)?.organization ?? 0, resolvedBattle.organizationLoss),
              supply: Math.min(divisions.find((item) => item.id === division.id)?.supply ?? 0, resolvedBattle.supplySpent),
            },
          };
          const expectedVictory = preBattleForecast.successChance >= 50;
          weeklyOrderComparisons.push({
            label: `${target.name} 공세`,
            expected: `승산 ${preBattleForecast.successChance}% · 병력 손실 ${preBattleForecast.strengthLoss[0]}~${preBattleForecast.strengthLoss[1]}`,
            actual: operationResolution.outcome === 'ongoing'
              ? `${operationResolution.profile.shortLabel} ${operationResolution.order.elapsedWeeks}주차 · 진척 ${operationResolution.progressPercent}% · 병력 -${battleReport.attackerStrengthLoss}`
              : `${operationResolution.outcome === 'victory' ? '작전 승리' : '작전 철수'} · 병력 -${battleReport.attackerStrengthLoss} · 누적 진척 ${operationResolution.progressPercent}%`,
            status: battleReport.victory === expectedVictory ? 'matched' : battleReport.victory ? 'better' : 'worse',
            explanation: `교전 승산은 이번 주 우세 확률입니다. ${operationResolution.profile.label}은 진척도와 최소 지속 기간을 모두 충족해야 영토 확보로 종결됩니다.${entry.airSupport > 0 ? ` 지정 구역 항공지원 진척 +${entry.airSupport}.` : ''}`,
          });
          setCommanderDevelopment((current) => {
            const currentRecord = getCommanderRecord(current, commander);
            const accumulated = recordBattleExperience(currentRecord, resolvedBattle, orderStance).record;
            const exists = current.some((record) => record.commanderId === commander.id);
            return exists
              ? current.map((record) => record.commanderId === commander.id ? accumulated : record)
              : [...current, accumulated];
          });
          setBattleReports((current) => [battleReport, ...current].slice(0, 120));
          setPendingBattleReportId((current) => current ?? battleReport.id);
          setSpeed(0);
          if (developmentResult.leveledUp) {
            addEvent('지휘관 성장 — ' + commander.name, '실전 경험으로 새로운 복무 레벨에 도달했습니다. 육군 화면에서 특기 하나를 선택할 수 있습니다.', 'good', nextWeek);
          }
          if (operationResolution.outcome === 'ongoing') {
            setTerritories((current) => current.map((item) => item.id === target.id ? { ...item, supply: Math.max(20, item.supply - Math.max(1, Math.round(battleReport.defenderStrengthLoss / 3))) } : item));
            setDivisions((current) => current.map((item) => item.id === division.id ? {
              ...item,
              status: 'combat',
              strength: Math.max(0, item.strength - battleReport.attackerStrengthLoss),
              organization: Math.max(0, item.organization - battleReport.organizationLoss),
              supply: Math.max(0, item.supply - battleReport.supplySpent),
              experience: Math.min(100, item.experience + (battleReport.victory ? 3 : 2)),
            } : item));
            setGame((current) => ({ ...current, manpower: Math.max(0, current.manpower - battleReport.attackerStrengthLoss * 3), warSupport: Math.max(35, Math.min(100, current.warSupport + (battleReport.victory ? 1 : -1))) }));
            addEvent(
              `작전 진행 — ${target.name} ${operationResolution.order.elapsedWeeks}주차`,
              `${operationResolution.profile.label} 진척 ${operationResolution.progressPercent}% (${operationResolution.progressGained >= 0 ? '+' : ''}${operationResolution.progressGained}). 영토 통제는 아직 변하지 않았습니다.`,
              battleReport.victory ? 'good' : 'neutral',
              nextWeek,
            );
            notify(`${target.name} ${operationResolution.profile.shortLabel} ${operationResolution.progressPercent}% · 다음 주 계속`);
          } else if (operationResolution.outcome === 'victory') {
            const firstCapture = !capturedThisWeek.has(target.id);
            capturedThisWeek.add(target.id);
            if (firstCapture) setTerritories((current) => current.map((item) => item.id === target.id ? { ...item, controller: playerFaction, ownerId: playerNation.id, supply: Math.max(35, item.supply - 12) } : item));
            setDivisions((current) => current.map((item) => item.id === division.id ? {
              ...item,
              territoryId: target.id,
              status: 'recovering',
              strength: Math.max(0, item.strength - battleReport.attackerStrengthLoss),
              organization: Math.max(0, item.organization - battleReport.organizationLoss),
              supply: Math.max(0, item.supply - battleReport.supplySpent),
              experience: Math.min(100, item.experience + 4),
              battleHonors: battleHonor ? Array.from(new Set([...(item.battleHonors ?? []), battleHonor])).slice(-8) : item.battleHonors,
            } : item));
            setGame((current) => ({ ...current, manpower: Math.max(0, current.manpower - battleReport.attackerStrengthLoss * 3), victoryScore: Math.min(100, current.victoryScore + (firstCapture ? target.value : 0)), warSupport: Math.min(100, current.warSupport + (firstCapture ? 2 : 0)) }));
            if (firstCapture) setObjectiveProgress((current) => Math.min(100, current + target.value * 3));
            addEvent('전선 돌파 — ' + target.name, battleReport.summary, 'good', nextWeek);
            notify(`${target.name} 확보! ${operationResolution.order.elapsedWeeks}주간의 ${operationResolution.profile.shortLabel}이 종결됐습니다.`);
          } else {
            setTerritories((current) => current.map((item) => item.id === target.id ? { ...item, supply: Math.max(20, item.supply - Math.round(battleReport.defenderStrengthLoss / 2)) } : item));
            setDivisions((current) => current.map((item) => item.id === division.id ? {
              ...item,
              status: 'recovering',
              strength: Math.max(0, item.strength - battleReport.attackerStrengthLoss),
              organization: Math.max(0, item.organization - battleReport.organizationLoss),
              supply: Math.max(0, item.supply - battleReport.supplySpent),
              experience: Math.min(100, item.experience + 2),
            } : item));
            setGame((current) => ({ ...current, manpower: Math.max(0, current.manpower - battleReport.attackerStrengthLoss * 3), warSupport: Math.max(35, current.warSupport - 2) }));
            addEvent(`작전 중단 — ${target.name}`, `${operationResolution.order.elapsedWeeks}주간의 ${operationResolution.profile.label} 끝에 공세를 중단했습니다. ${battleReport.summary}`, 'bad', nextWeek);
            notify(`${operationResolution.profile.shortLabel}이 ${operationResolution.order.elapsedWeeks}주차에 중단됐습니다. 사단을 재정비하십시오.`);
          }
        }
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

    const currentYear = getCampaignYearForWeek(nextWeek);
    const previousYear = getCampaignYearForWeek(nextWeek - 1);
    const researchGain = (doctrine === 'methodical' ? 13 : 11) + 2 + scienceAdvisorBonus + (scienceAdvisor?.discipline === 'science' ? 1 : 0);
    const breakthroughs = research.filter((project) => project.active && !project.complete && project.progress + researchGain >= project.duration);
    const newlyAvailableResearch = getNewlyAvailableResearch(research, previousYear, currentYear);
    setResearch((current) => advanceResearchProjects(current, researchGain, currentYear));

    breakthroughs.forEach((project) => {
      addEvent('연구 완료 — ' + project.name, project.description + ' 효과가 전군에 적용되었습니다.', 'good', nextWeek);
      if (project.id === 'radar') setGame((current) => ({ ...current, airPower: Math.min(100, current.airPower + 12), intelNetwork: Math.min(100, current.intelNetwork + 5) }));
      if (project.id === 'tank') setDivisions((current) => current.map((division) => division.type === 'armor' ? { ...division, strength: Math.min(100, division.strength + 8), experience: Math.min(100, division.experience + 3) } : division));
      if (project.id === 'logistics') setDivisions((current) => current.map((division) => ({ ...division, supply: Math.min(100, division.supply + 12) })));
      if (project.id === 'code') setGame((current) => ({ ...current, intelNetwork: Math.min(100, current.intelNetwork + 20), enemyPressure: Math.max(25, current.enemyPressure - 8) }));
      if (project.id === 'landing') setGame((current) => ({ ...current, navalPower: Math.min(100, current.navalPower + 14), commandPoints: Math.min(100, current.commandPoints + 12) }));
      if (project.id === 'penicillin') setGame((current) => ({ ...current, manpower: current.manpower + 120, warSupport: Math.min(100, current.warSupport + 3) }));
    });
    newlyAvailableResearch.forEach((project) => addEvent('새 연구 세대 개방 — ' + project.name, `${currentYear}년 기술·제도 조건이 도달했습니다. ${project.historicalBasis ?? project.description}`, 'neutral', nextWeek));

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
    const readinessLineIds: Partial<Record<EquipmentCategory, string>> = {
      infantry: 'rifle', artillery: 'artillery', armor: 'sherman', aircraft: 'spitfire', naval: 'convoy', logistics: 'truck',
    };
    const readinessEquipment = Object.fromEntries((Object.keys(equipmentCategoryLabels) as EquipmentCategory[]).map((category) => {
      const equipment = getDevelopedEquipment(equipmentDevelopment.fieldedByCategory[category], equipmentDevelopment);
      return [category, equipment];
    })) as Record<EquipmentCategory, ReturnType<typeof getDevelopedEquipment>>;
    const productionCoverage = Object.fromEntries((Object.keys(equipmentCategoryLabels) as EquipmentCategory[]).map((category) => {
      const lineId = readinessLineIds[category];
      const line = lineId ? production.find((candidate) => candidate.id === lineId) : undefined;
      const coverage = line
        ? Math.min(100, line.efficiency * 0.72 + line.assigned * 4 + (line.id === procurementFocusId ? 10 : 0))
        : category === 'systems'
          ? Math.min(100, (game.intelNetwork + armsPortfolio.capability) / 2)
          : Math.min(100, (armsPortfolio.capability + armsPortfolio.emergencyStockpile) / 2);
      return [category, coverage];
    })) as Partial<Record<EquipmentCategory, number>>;
    const stockpileCoverage: Partial<Record<EquipmentCategory, number>> = {
      infantry: Math.min(100, stockpile.infantryEquipment * 100 / Math.max(200, divisions.filter((division) => division.type !== 'armor').length * 900)),
      artillery: Math.min(100, stockpile.artillery * 100 / Math.max(80, divisions.length * 90)),
      armor: Math.min(100, stockpile.tanks * 100 / Math.max(40, divisions.filter((division) => division.type === 'armor').length * 140)),
      aircraft: Math.min(100, stockpile.aircraft / 18),
      naval: Math.min(100, stockpile.convoys / 7),
      logistics: Math.min(100, stockpile.trucks * 100 / Math.max(120, divisions.length * 160)),
      systems: Math.min(100, game.intelNetwork),
      strategic: Math.min(100, (armsPortfolio.capability + game.airPower + game.navalPower) / 3),
    };
    const assignedModelCount: Partial<Record<EquipmentCategory, number>> = {
      infantry: new Set(divisions.filter((division) => division.type !== 'armor').map((division) => equipmentDevelopment.divisionAssignments[division.id] ?? equipmentDevelopment.fieldedByCategory.infantry).filter(Boolean)).size || 1,
      armor: new Set(divisions.filter((division) => division.type === 'armor').map((division) => equipmentDevelopment.divisionAssignments[division.id] ?? equipmentDevelopment.fieldedByCategory.armor).filter(Boolean)).size || 1,
    };
    const weaponReadinessResult = advanceWeaponReadinessWeek(equipmentDevelopment.readiness, {
      week: nextWeek,
      fieldedByCategory: equipmentDevelopment.fieldedByCategory,
      equipmentReliability: Object.fromEntries(Object.entries(readinessEquipment).map(([category, equipment]) => [category, equipment?.stats.reliability ?? 55])),
      equipmentProduction: Object.fromEntries(Object.entries(readinessEquipment).map(([category, equipment]) => [category, equipment?.stats.production ?? 50])),
      equipmentRisk: Object.fromEntries(Object.entries(readinessEquipment).map(([category, equipment]) => [category, equipment && 'risk' in equipment ? equipment.risk : 0])),
      productionCoverage,
      stockpileCoverage,
      assignedModelCount,
      operationalTempo: hasActiveLandOrders ? (battleStance === 'aggressive' ? 86 : battleStance === 'cautious' ? 61 : 74) : divisions.some((division) => division.status === 'combat') ? 58 : 24,
      supplySecurity: armsPortfolio.supplySecurity,
      emergencyStockpile: armsPortfolio.emergencyStockpile,
      fuel: game.fuel,
      steel: game.steel,
    });
    setEquipmentDevelopment((current) => ({ ...current, readiness: weaponReadinessResult.state }));
    weaponReadinessResult.completedOrders.forEach((order) => {
      const definition = weaponWorkOrderDefinitions[order.type];
      addEvent(
        `병기 작업 완료 — ${equipmentCategoryLabels[order.category]} ${definition.label}`,
        `${definition.expected}. 주간 결산에서 실제 가동률·정비 적체·숙련 변화가 검증됐습니다.`,
        weaponReadinessResult.state.categories[order.category].trend >= 0 ? 'good' : 'neutral',
        nextWeek,
      );
    });
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

    const careerGain = hasActiveLandOrders ? 7 : 3;
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
      reputation: Math.min(100, current.reputation + (hasActiveLandOrders ? 2 : 1)),
      councilTrust: Math.max(10, Math.min(100, current.councilTrust + (game.victoryScore >= 50 ? 1 : -1))),
      legacy: Math.min(100, current.legacy + (hasActiveLandOrders ? 2 : 0)),
    }));
    if (earnsPromotion && promotionRole) {
      setRoleCommand(createRoleCommandState(promotionRole, nextWeek));
      addEvent('전시 승진 — ' + promotionRole.title, '전구 성과가 인정되어 더 넓은 권한과 책임을 부여받았습니다.', 'good', nextWeek);
      notify('승진했습니다: ' + promotionRole.title);
    }

    const enemyStrategyResult = advanceEnemyStrategyWeek(enemyStrategy, {
      week: nextWeek,
      theater: activeTheater,
      playerNationId: playerNation.id,
      playerFaction,
      enemyFaction,
      territories,
      divisions: effectiveDivisions,
      commanders: effectiveCommanders,
      enemyPressure: game.enemyPressure,
      playerVictoryScore: game.victoryScore,
      playerOrderTargetIds: orders.map((order) => order.targetId),
      defenseBonus: policyDefenseBonus,
      priorityDivisionId,
    }, [Math.random(), Math.random(), Math.random(), Math.random()]);
    setEnemyStrategy(enemyStrategyResult.state);

    if (enemyStrategyResult.effect) {
      const effect = enemyStrategyResult.effect;
      const threatenedTerritory = territories.find((territory) => territory.id === effect.targetId);
      const fallbackId = threatenedTerritory?.neighbors.find((neighborId) => territories.find((territory) => territory.id === neighborId)?.controller === playerFaction);
      const attackerNationId = enemyStrategy.plan?.attackerNationId;
      setTerritories((current) => current.map((territory) => territory.id === effect.targetId ? {
        ...territory,
        controller: effect.territoryCaptured ? enemyFaction : territory.controller,
        ownerId: effect.territoryCaptured && attackerNationId ? attackerNationId : territory.ownerId,
        supply: Math.max(15, territory.supply - effect.defenderSupplyLoss),
      } : territory));
      setDivisions((current) => current.map((division) => division.territoryId === effect.targetId ? {
        ...division,
        territoryId: effect.territoryCaptured ? fallbackId ?? division.territoryId : division.territoryId,
        status: effect.territoryCaptured ? 'recovering' : 'combat',
        strength: Math.max(22, division.strength - effect.defenderStrengthLoss),
        organization: Math.max(15, division.organization - effect.defenderOrganizationLoss),
        supply: Math.max(12, division.supply - effect.defenderSupplyLoss),
        experience: Math.min(100, division.experience + (effect.territoryCaptured ? 1 : 2)),
      } : division));
      setGame((current) => applyGameDelta(current, effect.gameDelta));
      if (effect.territoryCaptured && threatenedTerritory) {
        setObjectiveProgress((current) => Math.max(0, current - threatenedTerritory.value * 2));
      }
    }

    if (enemyStrategyResult.event) {
      const strategyEvent = enemyStrategyResult.event;
      const intentAtReport = deriveEnemyIntentReport(enemyStrategyResult.state, game.intelNetwork, territories);
      const intelligenceMasked = strategyEvent.type === 'formed' || strategyEvent.type === 'stage-change';
      addEvent(
        intelligenceMasked ? `적 정보 보고 — ${intentAtReport.title}` : strategyEvent.title,
        intelligenceMasked ? `${intentAtReport.summary} 예상 시점은 ${intentAtReport.etaLabel}입니다.` : strategyEvent.detail,
        strategyEvent.tone,
        nextWeek,
        {
          domain: 'operations',
          decision: '현재 방어 배치와 보급·예비대 우선순위를 유지했습니다.',
          trigger: intelligenceMasked ? `${intentAtReport.classification} 단계의 적 작전 징후를 포착했습니다.` : strategyEvent.detail,
          factors: intelligenceMasked
            ? [`분석 신뢰도 ${intentAtReport.confidence}%`, ...intentAtReport.indicators]
            : strategyEvent.factors,
          effects: enemyStrategyResult.effect ? [
            { label: '방어 병력', value: `-${enemyStrategyResult.effect.defenderStrengthLoss}`, tone: 'negative' },
            { label: '조직', value: `-${enemyStrategyResult.effect.defenderOrganizationLoss}`, tone: 'negative' },
            { label: '지역 통제', value: enemyStrategyResult.effect.territoryCaptured ? '상실' : '유지', tone: enemyStrategyResult.effect.territoryCaptured ? 'negative' : 'neutral' },
          ] : [{ label: '정보 평가', value: `${intentAtReport.classification} ${intentAtReport.confidence}%`, tone: 'neutral' }],
          ongoing: enemyStrategyResult.state.plan
            ? [`${intentAtReport.stageLabel} 단계이며 ${intentAtReport.etaLabel}으로 평가됩니다. 한 주 안에 자동 종결되지 않습니다.`]
            : ['해당 작전은 종결됐으며 적 지휘부가 다음 작전축을 재평가합니다.'],
          nextActions: intentAtReport.countermeasures,
          certainty: strategyEvent.type === 'resolved' || strategyEvent.type === 'aborted' ? 'confirmed' : 'developing',
        },
      );
      if (strategyEvent.type === 'stage-change' && enemyStrategyResult.state.plan?.stage === 'committed' && game.intelNetwork >= 55) {
        setSpeed(0);
        notify(`${intentAtReport.targetName} 방면 적 주력이 투입됐습니다. 시간 진행을 일시 정지했습니다.`);
      } else if (strategyEvent.type === 'resolved' && strategyEvent.tone === 'bad') {
        setSpeed(0);
        notify(`${strategyEvent.title}. 방어선을 재편하십시오.`);
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
    const advancedStaff = advanceStaffRosterWeek(staff, developmentFocusId);
    const manageableStaffIds = new Set(advancedStaff.filter((member) => staffAuthority.managedDepartments.includes(member.department)).map((member) => member.id));
    const staffNarrativeResult = advanceStaffNarrativeWeek(staffNarrative, advancedStaff, nextWeek, manageableStaffIds, staffPlayContext);
    setStaff(staffNarrativeResult.staff);
    setStaffNarrative(staffNarrativeResult.state);
    staffNarrativeResult.events.forEach((event) => addEvent(event.title, event.detail, event.tone, nextWeek, {
      domain: 'management',
      decision: event.decision,
      trigger: event.trigger,
      factors: event.factors,
      effects: event.effects,
      ongoing: event.ongoing,
      nextActions: event.nextActions,
      certainty: event.certainty,
    }));
    if (staffNarrativeResult.events.some((event) => event.title.startsWith('언론 노출') || event.title.startsWith('조직 갈등 폭발'))) {
      setSpeed(0);
      notify('참모 갈등이 공개 단계에 도달해 시간 진행을 일시 정지했습니다. 조직 운영에서 대응하십시오.');
    }
    const historicalHorizon = getHistoricalHorizon(nextWeek, completedDecisions);
    const marketReviewWeek = nextWeek % 13 === 0;
    const intelligenceCandidates = marketReviewWeek ? createEmergentIntelligenceCandidates(playerNation.id, currentYear, worldline.timeline) : [];
    const knownCandidatePeople = new Set([...staffCandidates.map((candidate) => candidate.personId), ...staff.map((member) => member.personId)]);
    const newIntelligenceCandidates = intelligenceCandidates.filter((candidate) => !knownCandidatePeople.has(candidate.personId)).slice(0, 2);
    const laterEraCandidates = marketReviewWeek ? createLaterEraCandidates(playerNation.id, currentYear, historicalHorizon) : [];
    const newLaterEraCandidates = laterEraCandidates
      .filter((candidate) => !knownCandidatePeople.has(candidate.personId))
      .slice(0, 4);
    const rivalVictories = staffCandidates.filter((candidate) => candidate.status !== 'signed' && candidate.status !== 'lost' && weeklyRivalInterest(candidate) >= 100);
    staffCandidates.filter((candidate) => candidate.status === 'scouting' && candidate.knowledge < 100 && candidate.knowledge + (delegatedDepartments.has('personnel') ? 23 : 18) >= 100 && weeklyRivalInterest(candidate) < 100).forEach((candidate) => addEvent(
      '인재 조사 완료 — ' + candidate.name,
      '조사 정보 100%를 확보하고 슬롯을 반환했습니다. 추가 정치력 지출 없이 완료됐습니다. 조직 운영 → 후보 시장 → 완료 보고서에서 능력·경력·위험을 확인하고 협상 조건을 검토할 수 있습니다.',
      'good', nextWeek,
    ));
    setStaffCandidates((current) => {
      const existingPeople = new Set([...current.map((candidate) => candidate.personId), ...staff.map((member) => member.personId)]);
      const expanded = [
        ...current,
        ...newIntelligenceCandidates.filter((candidate) => !existingPeople.has(candidate.personId)),
        ...newLaterEraCandidates.filter((candidate) => !existingPeople.has(candidate.personId)),
      ];
      return advanceCandidateScouting(expanded, delegatedDepartments.has('personnel'));
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
    if (!openedCoup && !openedWorldFlashpoint && nextWeek % 52 === 26 && !pendingCouncilEventId) {
      const councilEvent = selectNextCouncilEvent(playerNation.id, careerRole.branch, currentYear, resolvedCouncilChoices);
      if (councilEvent) {
        setPendingCouncilEventId(councilEvent.id);
        setSpeed(0);
        addEvent('전략 의제 소집 — ' + councilEvent.category, councilEvent.title, councilEvent.historicalYear ? 'neutral' : 'bad', nextWeek);
      }
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
      decision: `제 ${nextWeek + 1}주에 유지한 생산 배정·${supplyPolicy === 'frontline' ? '전선 우선' : supplyPolicy === 'reserve' ? '예비대 우선' : '균형'} 보급·참모 위임·연구 ${activeResearchNames.length}건${hasActiveLandOrders ? `·작전 명령 ${landWeekResult.entries.filter((entry) => entry.kind !== 'invalid').length}건` : ''}을 동시에 해결했습니다.`,
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
        { label: '병기 준비도', value: `평균 ${weaponReadinessResult.averageReadiness} · 전주 ${weaponReadinessResult.change >= 0 ? '+' : ''}${weaponReadinessResult.change} · 작전불가 위험 ${weaponReadinessResult.criticalCategories.length}분야`, tone: weaponReadinessResult.criticalCategories.length > 0 ? 'negative' : weaponReadinessResult.change >= 0 ? 'positive' : 'neutral' },
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
        ...weeklyOrderComparisons,
      ],
      ongoing: [
        `생산라인 효율은 배정 라인마다 +1${procurementFocusId ? ', 조달 포커스 라인은 추가 +1' : ''}${delegatedDepartments.has('armaments') ? ', 군수 위임으로 추가 +1' : ''} 상승합니다.`,
        hasActiveLandOrders ? '이번 주 작전 결과의 병력·조직·보급 손실은 별도 전투 보고서와 다음 주 회복 계산에 이어집니다.' : '작전 명령이 없어 커리어 경험은 행정 주간 기준으로만 증가했습니다.',
        `이번 주 확정된 정책·작전·연구 결과는 ${historyForceLabels[historyTrajectory.dominantForce]} 중심의 역사 흐름에 누적됩니다.`,
        weaponReadinessResult.summary,
      ],
      nextActions: [
        weeklyTreasuryDelta < 0 ? '전시 재무성에서 조세·국채·가격통제와 공장·참모 지출을 함께 조정해 다음 주 적자를 줄이십시오.' : '흑자 중 국채로 조달한 몫을 제외한 경상수지를 확인한 뒤 연구·영입·산업투자 우선순위를 결정하십시오.',
        game.fuel + weeklyFuelDelta < 35 ? '연료가 위험구간에 접근했습니다. 전선 우선 보급 또는 공장소비를 재검토하십시오.' : '생산 비축과 전선 보급을 비교해 다음 작전 투입 가능 여부를 판단하십시오.',
        activeResearchNames.length < 2 ? '비어 있는 일반 연구 슬롯을 채워 주간 연구량 손실을 막으십시오.' : '완료 예정 연구를 확인하고 후속 프로젝트를 미리 선정하십시오.',
        weaponReadinessResult.criticalCategories.length > 0 ? '연구·무기의 병기 수명주기 본부에서 작전불가 위험 분야에 창정비·부품 통합 작업을 지시하십시오.' : '병기 수명주기 본부에서 관찰 등급 분야의 후계 장비와 예비부품 심도를 점검하십시오.',
      ],
      certainty: 'confirmed',
    });
    settleNationalSupplyWeek(nextWeek);
  }, [activeTheater, addEvent, advanceNationWeek, settleNationalSupplyWeek, advanceNationalProgramWeek, advanceRoleDeskWeek, battleStance, campaignPhase, career.alternatePathId, career.civilian, career.experience, career.nationId, careerRole, commanderDevelopment, completedDecisions, delegatedDepartments, developmentFocusId, divisions, doctrine, economy, economyAdvisorBonus, economyForecast.netTreasuryChange, effectiveCommanders, effectiveDivisions, enemyFaction, enemyStrategy, equipmentDevelopment, formatGameMoney, game, hasClandestineIncident, historyTrajectory.dominantForce, jointForces, nationManagement, notify, orders, pendingCouncilEventId, pendingCoupIncident, pendingWorldFlashpointId, playerFaction, playerNation.id, playerNation.shortName, policyAttackBonus, policyDefenseBonus, policyProductionMultiplier, policySupplyRecovery, priorityDivisionId, procurementFocusId, production, projectionActiveResearch.length, projectionFuelDelta, projectionProductionTotal, projectionResearchGain, publicHealth, publicHealthContext, research, resolvedCouncilChoices, scheduleCoupCheck, scheduleWorldFlashpoint, scienceAdvisor, scienceAdvisorBonus, staff, staffAuthority.managedDepartments, staffCandidates, staffNarrative, staffPlayContext, staffWeeklyCost, supplyPolicy, territories, worldline]);

  useEffect(() => {
    if (speed === 0 || pendingWorldFlashpointId || pendingCoupIncident || hasClandestineIncident || showBriefing || showCareerMarket || showWorldHistory || showWorldWeekly || showTutorial) return;
    const delay = speed === 1 ? 4200 : speed === 2 ? 2600 : 1500;
    const timer = window.setInterval(advanceWeek, delay);
    return () => window.clearInterval(timer);
  }, [advanceWeek, hasClandestineIncident, pendingCoupIncident, pendingWorldFlashpointId, showBriefing, showCareerMarket, showTutorial, showWorldHistory, showWorldWeekly, speed]);

  useEffect(() => {
    if (periodAdvanceRemaining <= 0 || campaignPhase !== 'nation') return;
    if (showTimeCommandCenter) return;
    const interruptionReason = pendingCoupIncident
      ? '국내 쿠데타 위기 긴급 결재'
      : pendingWorldFlashpointId
        ? '세계 위기·외교 사건 긴급 결재'
        : hasClandestineIncident
          ? '비밀 접촉·방첩 사건 대응'
          : pendingCouncilEventId
            ? '국정 의제·내각 결재'
            : pendingAchievementId
              ? '장기 목표 달성과 새 선택지 확인'
              : showCareerMarket
                ? '인재·비밀 제안 검토'
                : showWorldWeekly || showWorldHistory || showJournal
                  ? '사용자 기록 검토'
                  : showBriefing || showTutorial || showPoliticalCrisis || showSettings || showActionCenter || showStatusOverview || showSaveCenter
                    ? '사용자 직접 지휘 복귀'
                    : null;
    if (interruptionReason) {
      periodAdvanceStopReasonRef.current = interruptionReason;
      setPeriodAdvanceRemaining(0);
      return;
    }
    const timer = window.setTimeout(() => {
      if (periodAdvanceRemaining <= 1) periodAdvanceStopReasonRef.current = '계획한 지휘 기간 완료';
      advanceWeek();
      setPeriodAdvanceRemaining((current) => Math.max(0, current - 1));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [advanceWeek, campaignPhase, hasClandestineIncident, pendingAchievementId, pendingCouncilEventId, pendingCoupIncident, pendingWorldFlashpointId, periodAdvanceRemaining, showActionCenter, showBriefing, showCareerMarket, showJournal, showPoliticalCrisis, showSaveCenter, showSettings, showStatusOverview, showTimeCommandCenter, showTutorial, showWorldHistory, showWorldWeekly]);

  useEffect(() => {
    if (!periodAdvanceSession || periodAdvanceRemaining > 0) return;
    const snapshot = createStrategicAdvanceSnapshotFromState(game, nationManagement, economy);
    const report = buildStrategicAdvanceReport(
      periodAdvanceSession,
      snapshot,
      periodAdvanceStopReasonRef.current ?? '중요 사건 또는 정책 검증 시점 도달',
    );
    periodAdvanceStopReasonRef.current = null;
    setLatestPeriodAdvanceReport(report);
    setPeriodAdvanceSession(null);
    addEvent(
      `지휘 주기 결산 — ${report.headline}`,
      `${report.summary} 정지 사유: ${report.stopReason}.`,
      report.metrics.filter((metric) => metric.delta !== 0 && (metric.inverse ? metric.delta > 0 : metric.delta < 0)).length >= 3 ? 'bad' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: `${report.requestedWeeks}주 전략 지휘 주기를 선택해 반복 집행을 부처에 위임했습니다.`,
        trigger: report.stopReason,
        factors: report.metrics.map((metric) => `${metric.label} ${metric.before.toFixed(metric.id === 'treasury' || metric.id === 'inflation' ? 1 : 0)} → ${metric.after.toFixed(metric.id === 'treasury' || metric.id === 'inflation' ? 1 : 0)}`),
        effects: report.metrics.map((metric) => ({
          label: metric.label,
          value: `${metric.delta > 0 ? '+' : ''}${metric.delta.toFixed(metric.id === 'treasury' || metric.id === 'inflation' ? 1 : 0)}`,
          tone: metric.delta === 0 ? 'neutral' : (metric.inverse ? metric.delta < 0 : metric.delta > 0) ? 'positive' : 'negative',
        })),
        ongoing: ['중간결산 이후 정책·예산·인사 상태는 그대로 유지됩니다.', '다음 지휘 주기는 현재 위험도와 장기계획에 맞춰 다시 선택할 수 있습니다.'],
        nextActions: ['상단 지휘 주기에서 전후 지표를 확인하고 다음 기간을 선택하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${report.headline} · ${report.stopReason}`);
    if (report.completed) setShowTimeCommandCenter(true);
  }, [addEvent, economy, game, nationManagement, notify, periodAdvanceRemaining, periodAdvanceSession]);

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
      addEvent('전략적 승리', `${withJosa(playerNation.shortName, '이/가')} 전구의 주도권을 장악했습니다. 새로운 국제 질서를 결정할 시간이 왔습니다.`, 'good', game.week);
    } else if (game.victoryScore <= 8 || game.warSupport <= 22 || game.stability <= 28 || (game.week >= 156 && game.victoryScore < 62)) {
      setCampaignOutcome('defeat');
      setSpeed(0);
      addEvent('전략적 패배', playerNation.shortName + '의 전쟁 수행 능력이 한계에 도달했습니다. 지도부가 당신의 해임을 논의합니다.', 'bad', game.week);
    }
  }, [addEvent, campaignOutcome, campaignPhase, enemyFaction, game.stability, game.victoryScore, game.warSupport, game.week, playerFaction, playerNation.shortName, showBriefing, theaterTerritories]);

  const transitionToNationManagement = useCallback((reason: NationTransitionReason) => {
    if (playerNation.id === 'korea' && reason === 'negotiated' && !koreaLiberationReadiness?.eligible) {
      const missing = koreaLiberationReadiness?.tracks
        .filter((track) => koreaLiberationReadiness.blockedTrackIds.includes(track.id))
        .map((track) => `${track.label} ${track.value}`)
        .join(' · ');
      notify(`해방·건국 준비도 ${koreaLiberationReadiness?.score ?? 0}/100입니다. 기준 미달: ${missing || '네 준비축을 확인하십시오.'}`);
      return;
    }
    if (reason === 'negotiated' && !transitionReadiness.eligible) {
      notify(`${transitionReadiness.transitionLabel} 준비도 ${transitionReadiness.score}/${transitionReadiness.threshold}입니다. ${transitionReadiness.blockedReasons.join(' · ')}`);
      return;
    }
    let nextState = createNationManagementState(
      playerNation.id,
      game,
      economy,
      research.filter((project) => project.complete).length,
      reason,
    );
    if (koreaLiberationReadiness) {
      nextState = {
        ...nextState,
        legitimacy: Math.max(0, Math.min(100, nextState.legitimacy + Math.round((koreaLiberationReadiness.score - koreaLiberationReadiness.partitionRisk) / 12))),
        unrest: Math.max(0, Math.min(100, nextState.unrest + Math.round((koreaLiberationReadiness.partitionRisk - 35) / 8))),
        institutionalCapacity: Math.max(0, Math.min(100, nextState.institutionalCapacity + Math.round(koreaLiberationReadiness.score / 18))),
      };
    }
    nextState = {
      ...nextState,
      personalLife: nationManagement.personalLife,
      mediaRelations: nationManagement.mediaRelations,
      justice: nationManagement.justice,
      constitutionalJudiciary: nationManagement.constitutionalJudiciary,
      powerNetwork: nationManagement.powerNetwork,
    };
    setCampaignPhase('nation');
    setPostwarIndustry(createPostwarIndustryState(playerNation.id, game.week));
    initializeRegionalAccount(playerNation.id, game.week);
    resetFieldSession();
    setPostwarIndustrySettings(normalizePostwarIndustrySettings(undefined));
    setNationManagement(nextState);
    setPeriodAdvanceRemaining(0);
    setPeriodAdvanceSession(null);
    setLatestPeriodAdvanceReport(null);
    setCampaignOutcome(null);
    setSpeed(0);
    setOrders([]);
    setEnemyStrategy(createEnemyStrategyState());
    setPendingOffensivePlan(null);
    setPendingBattleReportId(null);
    setPendingCouncilEventId(null);
    setPendingWorldFlashpointId(null);
    setPlanningMode(false);
    if (playerNation.id === 'korea') {
      setTerritories((current) => current.map((territory) => territory.id === 'korea' ? {
        ...territory,
        controller: playerFaction,
        ownerId: 'korea',
        supply: Math.max(territory.supply, Math.round(koreaLiberationReadiness?.tracks.find((track) => track.id === 'return')?.value ?? 58)),
      } : territory));
    }
    setDivisions((current) => current.map((division) => ({ ...division, status: 'ready' })));
    setGame((current) => ({
      ...current,
      enemyPressure: Math.min(current.enemyPressure, reason === 'victory' ? 18 : 28),
      politicalPower: Math.max(0, Math.min(200, current.politicalPower + (reason === 'victory' ? 12 : -4))),
      stability: Math.max(0, Math.min(100, current.stability + (reason === 'victory' ? 4 : -2))),
    }));
    setActiveTab('governance');
    const transitionTitle = koreaLiberationReadiness
      ? `충칭에서 한반도로 — ${koreaLiberationReadiness.outcomeLabel}`
      : reason === 'victory' ? '승전 체제에서 국가 운영 체제로' : '협상 종전 — 국가 운영 체제로';
    addEvent(
      transitionTitle,
      koreaLiberationReadiness
        ? `대한민국 임시정부의 인물·조직·광복군 기록을 계승한 새 정부가 한반도 국가 운영을 시작했습니다. 해방 준비 ${koreaLiberationReadiness.score}, 분할 위험 ${koreaLiberationReadiness.partitionRisk}, 국고 ${formatGameMoney(game.treasury)}, 물가 ${economy.inflation.toFixed(1)}%가 초기 조건입니다.`
        : `${withJosa(playerNation.shortName, '은/는')} 동원과 영토 확장의 시대를 끝내고 전후 국가 운영에 들어갔습니다. 전쟁에서 남은 국고 ${formatGameMoney(game.treasury)}, 부채 ${formatGameMoney(economy.debt)}, 물가 ${economy.inflation.toFixed(1)}%, 공장 ${game.factories}개가 새 정부의 초기 조건입니다.`,
      reason === 'victory' ? 'good' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: reason === 'victory' ? '전략적 승리 뒤 같은 세계선에서 국가 운영을 계속하기로 결정했습니다.' : '완전 정복 대신 협상 종전과 국내 재건을 선택했습니다.',
        trigger: reason === 'victory' ? '전구 승리 조건을 달성해 승전국의 전후 질서 설계 권한을 확보했습니다.' : `전환 준비도 ${transitionReadiness.score}와 안정도 ${Math.round(game.stability)}가 협상 종전 조건을 충족했습니다.`,
        factors: koreaLiberationReadiness
          ? [...koreaLiberationReadiness.tracks.map((track) => `${track.label} ${track.value}`), `분할 위험 ${koreaLiberationReadiness.partitionRisk}`]
          : [`전황 ${transitionReadiness.pillars.security}`, `정통성 ${transitionReadiness.pillars.legitimacy}`, `재정 ${transitionReadiness.pillars.finance}`, `산업 ${transitionReadiness.pillars.industry}`, `외교 ${transitionReadiness.pillars.diplomacy}`],
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
      `${careerRole.title} 직함은 ${withJosa(nextRoleTitle, '으로/로')} 전환됐습니다. 당신의 인사권 범위는 유지되지만 예하 보직의 명칭과 책임은 새 체제에 맞게 개편됩니다: ${renamedSeats}.`,
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
  }, [addEvent, careerRole, economy, formatGameMoney, game, koreaLiberationReadiness, nationManagement.mediaRelations, nationManagement.personalLife, nationManagement.powerNetwork, notify, playerFaction, playerNation.id, playerNation.shortName, playerNation.status, research, staffAuthority.managedDepartments, transitionReadiness]);

  const changeNationBudget = (domain: NationBudgetDomain, delta: -5 | 5) => {
    const next = rebalanceNationBudget(nationManagement, domain, delta);
    if (next.budget[domain] === nationManagement.budget[domain]) return;
    setNationManagement(next);
    recordSuccessfulRoleAction('governance', `nation-budget:${domain}`, `${domain} 부처 예산 재배분 승인`);
  };

  const changeNationTax = (delta: -5 | 5) => {
    if (Math.max(20, Math.min(80, nationManagement.taxBurden + delta)) === nationManagement.taxBurden) return;
    setNationManagement((current) => ({ ...current, taxBurden: Math.max(20, Math.min(80, current.taxBurden + delta)) }));
    recordSuccessfulRoleAction('governance', 'nation-tax', '국가 조세 부담 조정 승인');
  };

  const changeNationSpending = (delta: -5 | 5) => {
    if (Math.max(25, Math.min(85, nationManagement.spendingLevel + delta)) === nationManagement.spendingLevel) return;
    setNationManagement((current) => ({ ...current, spendingLevel: Math.max(25, Math.min(85, current.spendingLevel + delta)) }));
    recordSuccessfulRoleAction('governance', 'nation-spending', '국가 공공 지출 조정 승인');
  };

  const changeNationStrategy = (strategyId: NationStrategyId) => {
    if (nationManagement.strategyId === strategyId) return;
    setNationManagement((current) => ({ ...current, strategyId }));
    recordSuccessfulRoleAction('governance', `nation-strategy:${strategyId}`, '국가 발전 노선 변경 승인');
    notify(`${nationStrategies.find((strategy) => strategy.id === strategyId)?.name ?? '국가 발전 노선'}을 내각의 장기 노선으로 채택했습니다.`);
  };

  const decideNationAgenda = (choiceId: NationAgendaChoiceId) => {
    const result = resolveNationAgendaChoice(nationManagement, choiceId, game.week);
    if (!result) {
      notify('현재 결재할 국가 고유 의제가 없습니다.');
      return;
    }
    setNationManagement(result.state);
    setGame((current) => applyGameDelta(current, result.gameDelta));
    setEconomy((current) => ({
      ...current,
      debt: Math.max(0, current.debt + result.economyDelta.debt),
      inflation: Math.max(0, Math.min(100, current.inflation + result.economyDelta.inflation)),
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.economyDelta.publicConfidence)),
    }));
    setCompletedDecisions((current) => [
      ...current,
      `nation-agenda:${playerNation.id}:${result.state.agenda.history[0]?.issueId ?? 'unknown'}:${choiceId}:${game.week}`,
    ]);
    addEvent(result.title, `${result.detail} ${result.effects.join(' · ')}`, choiceId === 'enforce' ? 'neutral' : 'good', game.week);
    notify(`${result.title}: ${result.effects.join(' · ')}`);
  };

  const launchPeacetimeStrategicOperation = (operationId: string) => {
    const result = launchStrategicOperation(nationManagement.strategicContinuity, operationId, {
      week: game.week,
      role: careerRole,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      commandPoints: game.commandPoints,
      stability: game.stability,
      legitimacy: nationManagement.legitimacy,
      institutionalCapacity: nationManagement.institutionalCapacity,
      securityBudget: nationManagement.budget.security,
      diplomacyBudget: nationManagement.budget.diplomacy,
      intelNetwork: game.intelNetwork,
      enemyPressure: game.enemyPressure,
    });
    if (!result) {
      notify('현재 직무 권한·시대·정치력·국고·지휘 자원 또는 진행 중인 작전을 확인하십시오.');
      return;
    }
    const definition = strategicOperationDefinitions.find((candidate) => candidate.id === operationId);
    setNationManagement((current) => ({ ...current, strategicContinuity: result.state }));
    setGame((current) => applyGameDelta(current, result.gameDelta));
    setPeriodAdvanceRemaining(0);
    if (result.event) addEvent(result.event.title, result.event.detail, result.event.tone, game.week, {
      domain: careerRole.branch === 'military' ? 'operations' : careerRole.branch === 'intelligence' ? 'management' : 'diplomacy',
      decision: `${withJosa(definition?.name ?? operationId, '을/를')} ${definition?.durationWeeks ?? 0}주 전략임무로 승인했습니다.`,
      trigger: result.event.cause,
      factors: [`현재 직무 ${careerRole.title}`, `안보 예산 ${nationManagement.budget.security}%`, `외교 예산 ${nationManagement.budget.diplomacy}%`, `정보망 ${Math.round(game.intelNetwork)}`],
      effects: [{ label: '초기 비용', value: `정치력 ${result.gameDelta.politicalPower ?? 0} · 국고 ${formatGameMoney(result.gameDelta.treasury ?? 0, { signed: true })} · 지휘 ${result.gameDelta.commandPoints ?? 0}`, tone: 'negative' }],
      ongoing: ['지도·조직·경제 화면으로 이동해도 작전은 취소되지 않으며 매주 진행됩니다.', '중간검토와 최종 결과가 기간 진행을 자동 정지시킵니다.'],
      nextActions: ['4주 또는 13주 기간 진행을 사용해 작전을 운용하거나 매주 정책을 세밀하게 조정하십시오.'],
      certainty: 'confirmed',
    });
    notify(`${definition?.name ?? '전략작전'}을 승인했습니다. 화면을 이동해도 임무가 유지됩니다.`);
  };

  const launchLongTermNationalPlan = (planId: NationalPlanId) => {
    const metrics: NationalPlanMetrics = {
      nationalScore: nationManagement.nationalScore,
      mandateScore: nationManagement.mandateScore,
      legitimacy: nationManagement.legitimacy,
      welfare: nationManagement.welfare,
      education: nationManagement.education,
      civilianIndustry: nationManagement.civilianIndustry,
      institutionalCapacity: nationManagement.institutionalCapacity,
      inequality: nationManagement.inequality,
      unrest: nationManagement.unrest,
      relativeCompetitiveness: nationManagement.relativeCompetitiveness,
      demographicPressure: nationManagement.demographicPressure,
      ecologicalPressure: nationManagement.ecologicalPressure,
      hegemonyCost: nationManagement.hegemonyCost,
      relationAverage,
    };
    const nextPlanning = launchNationalPlan(nationManagement.nationalPlanning, planId, game.week, metrics);
    const definition = nationalPlanDefinitions.find((candidate) => candidate.id === planId);
    if (!nextPlanning || !definition) {
      notify('이미 진행 중인 국가계획을 먼저 완수하거나 종료 시점까지 운영하십시오.');
      return;
    }
    setNationManagement((current) => ({ ...current, nationalPlanning: nextPlanning }));
    setPeriodAdvanceRemaining(0);
    addEvent(`국가계획 채택 — ${definition.name}`, definition.description, 'neutral', game.week, {
      domain: 'management',
      decision: `${definition.horizonYears}개년 ${definition.name}을 국가의 장기 기준선으로 채택했습니다.`,
      trigger: `${game.week + 1}주 국가성과 ${nationManagement.nationalScore} · 국민 위임 ${nationManagement.mandateScore}에서 출발합니다.`,
      factors: definition.targets,
      effects: [{ label: '중간평가', value: definition.horizonYears === 1 ? '6개월·1년' : '매년·중간지점·종료시점', tone: 'neutral' }],
      ongoing: [`실패 위험: ${definition.risk}`, '예산과 정책을 바꾸면 진척률도 매주 다시 계산됩니다.'],
      nextActions: ['장기 지휘 주기의 진척률과 후기 구조 압력을 함께 확인하십시오.'],
      certainty: 'confirmed',
    });
    notify(`${definition.name}을 채택했습니다. 중간평가에서 실제 지표로 검증됩니다.`);
  };

  const startPeriodAdvance = (weeks: StrategicAdvanceWeeks) => {
    if (campaignPhase !== 'nation') return;
    const option = timeCadenceOptions.find((candidate) => candidate.weeks === weeks);
    if (!option || option.disabled) {
      notify(option?.reason ?? '현재 국면에서는 이 지휘 주기를 사용할 수 없습니다.');
      return;
    }
    setSpeed(0);
    periodAdvanceStopReasonRef.current = null;
    setPeriodAdvanceSession(createStrategicAdvanceSession(
      weeks,
      createStrategicAdvanceSnapshotFromState(game, nationManagement, economy),
      timeCadenceAssessment,
    ));
    setPeriodAdvanceRemaining(weeks);
    setShowTimeCommandCenter(false);
    notify(`${weeks === 4 ? '1개월' : weeks === 13 ? '1분기' : weeks === 26 ? '반기' : '1년'} 국정 위임을 시작합니다. 중요 결재·위기·중간평가에서 자동 정지합니다.`);
  };

  const cancelPeriodAdvance = () => {
    if (periodAdvanceRemaining <= 0) return;
    periodAdvanceStopReasonRef.current = '사용자가 중간결산을 요청함';
    setPeriodAdvanceRemaining(0);
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

  const personalLifeContext = useCallback((): PersonalLifeContext => ({
    week: game.week,
    year: getCampaignYearForWeek(game.week),
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: nationManagement.legitimacy,
    education: nationManagement.education,
    institutionalCapacity: nationManagement.institutionalCapacity,
    role: displayedCareerRole,
  }), [displayedCareerRole, game.politicalPower, game.stability, game.treasury, game.week, nationManagement.education, nationManagement.institutionalCapacity, nationManagement.legitimacy]);

  const applyPersonalLifeActionResult = useCallback((result: PersonalLifeActionResult) => {
    setNationManagement((current) => ({
      ...current,
      personalLife: result.state,
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
      } : relation));
    }
    addEvent(result.title, result.detail, result.unrestDelta > 1 || result.legitimacyDelta < 0 ? 'bad' : result.legitimacyDelta > 0 || result.stabilityDelta > 0 ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: '개인·가족 화면에서 관계, 가족법 또는 사생활 결정을 내렸습니다.',
      factors: [
        `현재 보직: ${displayedCareerRole.title}`,
        `시대: ${getCampaignYearForWeek(game.week)}년`,
        `가족법: ${result.state.familyLawId}`,
      ],
      effects: [
        { label: '정치력', value: `${result.politicalPowerDelta}`, tone: result.politicalPowerDelta < 0 ? 'negative' : 'neutral' },
        { label: '국고', value: formatGameMoney(result.treasuryDelta, { signed: true }), tone: result.treasuryDelta < 0 ? 'negative' : 'neutral' },
        { label: '정통성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta >= 0 ? 'positive' : 'negative' },
        { label: '사회 불안', value: `${result.unrestDelta >= 0 ? '+' : ''}${result.unrestDelta}`, tone: result.unrestDelta > 0 ? 'negative' : 'positive' },
      ],
      ongoing: ['유대·신뢰·긴장·관계 노출·가구 비용은 이후 매주 국가 결산에 반영됩니다.'],
      nextActions: ['개인·가족 화면에서 관계 상태와 법적 보호를 확인하십시오.', '법적 보호가 부족하면 가족법 개혁 또는 사생활 보호를 검토하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
  }, [addEvent, displayedCareerRole.title, formatGameMoney, game.week, notify]);

  const configurePersonalLife = (profile: Omit<PersonalIdentityProfile, 'configured'>) => {
    const next = configurePersonalIdentity(nationManagement.personalLife, profile, game.week);
    if (next === nationManagement.personalLife) {
      notify('진행 중인 관계가 있을 때는 핵심 관계 프로필을 다시 설정할 수 없습니다. 호칭과 경계는 관계 행동으로 조정하십시오.');
      return;
    }
    setNationManagement((current) => ({ ...current, personalLife: next }));
    addEvent('개인 관계 프로필 설정', '성별 정체성·성적 지향·배우자 호칭·관계 경계를 설정했습니다. 이 정보는 관계 후보와 서술을 결정하며 능력치 우열을 만들지 않습니다.', 'neutral', game.week);
    notify('개인 관계 원칙을 저장했습니다. 이제 관계 후보를 검토할 수 있습니다.');
  };

  const relationshipCountries = () => [
    { id: playerNation.id, name: playerNation.shortName, relationValue: 70 },
    ...relations.map((relation) => ({ id: relation.id, name: relation.name, relationValue: relation.value })),
  ];

  const startPersonalRelationship = (candidateId: string) => {
    const availability = getPersonalLifeActivityAvailability(nationManagement.personalLife, game.week);
    if (!availability.allowed) return notify(availability.reason);
    const candidate = getPersonalRelationshipCandidates(nationManagement.personalLife, relationshipCountries()).find((item) => item.id === candidateId);
    if (!candidate) return notify('현재 관계 원칙과 맞는 후보를 찾을 수 없습니다.');
    const result = beginPersonalRelationship(nationManagement.personalLife, candidate, personalLifeContext());
    if (!result) return notify('교제 시작에는 관계 프로필·정치력 4·국고 8M과 현재 독신 상태가 필요합니다.');
    applyPersonalLifeActionResult(result);
  };

  const formalizeRelationship = (unionForm: UnionForm, visibility: RelationshipVisibility) => {
    const availability = getPersonalLifeActivityAvailability(nationManagement.personalLife, game.week);
    if (!availability.allowed) return notify(availability.reason);
    const result = formalizePersonalUnion(nationManagement.personalLife, unionForm, visibility, personalLifeContext());
    if (!result) return notify('유대·신뢰, 가족법, 정치력과 국고 조건을 확인하십시오. 동성 법률혼에는 혼인평등법이 필요합니다.');
    applyPersonalLifeActionResult(result);
  };

  const changeFamilyLaw = (lawId: FamilyLawId) => {
    const result = reformFamilyLaw(nationManagement.personalLife, lawId, personalLifeContext());
    if (!result) return notify('가족법 개정에는 권한, 정치력, 국고, 교육·제도 역량과 정통성 조건이 필요합니다.');
    applyPersonalLifeActionResult(result);
  };

  const takePersonalLifeAction = (actionId: PersonalLifeActionId) => {
    const availability = getPersonalLifeActivityAvailability(nationManagement.personalLife, game.week);
    if (!availability.allowed) return notify(availability.reason);
    const result = resolvePersonalLifeAction(nationManagement.personalLife, actionId, personalLifeContext());
    if (!result) return notify('현재 관계 또는 필요한 정치력·국고 조건을 확인하십시오.');
    applyPersonalLifeActionResult(result);
  };

  const changeFamilyPlan = (familyPlanId: FamilyPlanId) => {
    const availability = getPersonalLifeActivityAvailability(nationManagement.personalLife, game.week);
    if (!availability.allowed) return notify(availability.reason);
    const result = chooseFamilyPlan(nationManagement.personalLife, familyPlanId, personalLifeContext());
    if (!result) return notify('먼저 관계를 공식화하십시오. 공동 입양에는 시민결합법 이상의 법적 보호가 필요합니다.');
    applyPersonalLifeActionResult(result);
  };

  const mediaRelationsContext = useCallback((): MediaRelationsContext => ({
    week: game.week,
    year: getCampaignYearForWeek(game.week),
    role: displayedCareerRole,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: nationManagement.legitimacy,
    unrest: nationManagement.unrest,
    education: nationManagement.education,
    institutionalCapacity: nationManagement.institutionalCapacity,
    inflation: economy.inflation,
    publicConfidence: economy.publicConfidence,
    intelNetwork: game.intelNetwork,
    governmentFormId: nationManagement.dynasty.formId,
    strategyId: nationManagement.strategyId,
    activeElection: Boolean(nationManagement.electoral.activeCampaign),
    personalLife: nationManagement.personalLife,
  }), [displayedCareerRole, economy.inflation, economy.publicConfidence, game.intelNetwork, game.politicalPower, game.stability, game.treasury, game.week, nationManagement.dynasty.formId, nationManagement.education, nationManagement.electoral.activeCampaign, nationManagement.institutionalCapacity, nationManagement.legitimacy, nationManagement.personalLife, nationManagement.strategyId, nationManagement.unrest]);

  const applyMediaActionResult = useCallback((result: MediaActionResult) => {
    setNationManagement((current) => ({
      ...current,
      mediaRelations: result.state,
      personalLife: result.personalLife,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.legitimacyDelta)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.unrestDelta)),
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.politicalPowerDelta,
      treasury: result.treasuryDelta,
      stability: result.stabilityDelta,
    }));
    setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.publicConfidenceDelta)),
    }));
    addEvent(result.title, result.detail, result.legitimacyDelta < 0 || result.unrestDelta > 2 ? 'bad' : result.legitimacyDelta > 1 || result.publicConfidenceDelta > 2 ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: '언론법·편집국 의제·공적 지위·경쟁 집단·개인정보 공개 경계가 함께 작동했습니다.',
      factors: [
        `현재 보직: ${displayedCareerRole.title}`,
        `언론법: ${result.state.lawId}`,
        `언론 자유 ${Math.round(result.state.freedom)} · 신뢰 ${Math.round(result.state.pressTrust)} · 적대 ${Math.round(result.state.hostility)}`,
      ],
      effects: [
        { label: '정치력', value: `${result.politicalPowerDelta}`, tone: result.politicalPowerDelta < 0 ? 'negative' : 'neutral' },
        { label: '정통성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta >= 0 ? 'positive' : 'negative' },
        { label: '사회 불안', value: `${result.unrestDelta >= 0 ? '+' : ''}${result.unrestDelta}`, tone: result.unrestDelta > 0 ? 'negative' : 'positive' },
        { label: '국민 신뢰', value: `${result.publicConfidenceDelta >= 0 ? '+' : ''}${result.publicConfidenceDelta}`, tone: result.publicConfidenceDelta >= 0 ? 'positive' : 'negative' },
      ],
      ongoing: ['답변·거절·폭로 대응은 언론 신뢰, 다음 인터뷰 접근성, 경쟁자의 공격 강도와 주간 기사에 계속 반영됩니다.'],
      nextActions: ['국가 운영의 언론·평판 상황실에서 대기 인터뷰와 폭로 사건의 후속 상태를 확인하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
  }, [addEvent, displayedCareerRole.title, game.week, notify]);

  const changeMediaLaw = (lawId: MediaLawId) => {
    const result = reformMediaLaw(nationManagement.mediaRelations, lawId, mediaRelationsContext());
    if (!result) return notify('언론법 개정에는 보직 권한, 정치력·국고, 교육·제도 역량과 정통성 조건이 필요합니다.');
    applyMediaActionResult(result);
  };

  const requestMediaInterview = (topicId: MediaTopicId) => {
    const result = requestPressInterview(nationManagement.mediaRelations, topicId, mediaRelationsContext());
    if (!result) return notify('진행 중인 인터뷰가 없어야 하며, 독립 인터뷰를 허용하는 언론법·언론 접근 25·정치력 2가 필요합니다.');
    applyMediaActionResult(result);
  };

  const answerMediaInterview = (responseId: InterviewResponseId) => {
    const result = respondToInterview(nationManagement.mediaRelations, responseId, mediaRelationsContext());
    if (!result) return notify('현재 답변할 인터뷰 요청이 없습니다.');
    applyMediaActionResult(result);
  };

  const answerExposureIncident = (responseId: ExposureResponseId) => {
    const result = resolveExposureIncident(nationManagement.mediaRelations, responseId, mediaRelationsContext());
    if (!result) return notify('현재 대응 가능한 폭로가 없거나, 선택한 대응의 제도·자원 조건을 충족하지 못했습니다.');
    applyMediaActionResult(result);
  };

  const justiceContext = useCallback((): JusticeContext => ({
    week: game.week,
    year: getCampaignYearForWeek(game.week),
    phase: campaignPhase,
    nationId: playerNation.id,
    role: displayedCareerRole,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    intelNetwork: game.intelNetwork,
    legitimacy: nationManagement.legitimacy,
    unrest: nationManagement.unrest,
    institutionalCapacity: nationManagement.institutionalCapacity,
    mediaFreedom: nationManagement.mediaRelations.freedom,
    pressTrust: nationManagement.mediaRelations.pressTrust,
    activeElection: Boolean(nationManagement.electoral.activeCampaign),
    strategyId: nationManagement.strategyId,
  }), [campaignPhase, displayedCareerRole, game.intelNetwork, game.politicalPower, game.stability, game.treasury, game.week, nationManagement.electoral.activeCampaign, nationManagement.institutionalCapacity, nationManagement.legitimacy, nationManagement.mediaRelations.freedom, nationManagement.mediaRelations.pressTrust, nationManagement.strategyId, nationManagement.unrest, playerNation.id]);

  const applyJusticeActionResult = useCallback((result: JusticeActionResult) => {
    setNationManagement((current) => ({
      ...current,
      justice: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.legitimacyDelta)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.unrestDelta)),
      institutionalCapacity: Math.max(0, Math.min(100, current.institutionalCapacity + result.institutionalCapacityDelta)),
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.politicalPowerDelta,
      treasury: result.treasuryDelta,
      stability: result.stabilityDelta,
    }));
    setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.publicConfidenceDelta)),
    }));
    const primaryEvent = result.events[0];
    addEvent(result.actionTitle, result.actionDetail, primaryEvent?.tone ?? (result.legitimacyDelta < 0 ? 'bad' : result.legitimacyDelta > 0 ? 'good' : 'neutral'), game.week, {
      domain: 'management',
      decision: result.actionTitle,
      trigger: primaryEvent?.cause ?? '사건 기한, 증거력, 보관 연속성, 검사·증인 안전, 언론 관심을 함께 판단했습니다.',
      factors: [
        `현재 보직 ${displayedCareerRole.title} · ${displayedCareerRole.tier}급`,
        `사법 독립 ${Math.round(result.state.independence)} · 기관 청렴 ${Math.round(result.state.integrity)}`,
        `검사 안전 ${Math.round(result.state.prosecutorSafety)} · 취재원 보호 ${Math.round(result.state.sourceProtection)} · 무처벌 ${Math.round(result.state.impunity)}`,
      ],
      effects: [
        { label: '정치력', value: `${result.politicalPowerDelta >= 0 ? '+' : ''}${result.politicalPowerDelta}`, tone: result.politicalPowerDelta < 0 ? 'negative' : 'positive' },
        { label: '국고', value: formatGameMoney(result.treasuryDelta, { signed: true }), tone: result.treasuryDelta < 0 ? 'negative' : 'positive' },
        { label: '정당성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta < 0 ? 'negative' : 'positive' },
        { label: '국민 신뢰', value: `${result.publicConfidenceDelta >= 0 ? '+' : ''}${result.publicConfidenceDelta}`, tone: result.publicConfidenceDelta < 0 ? 'negative' : 'positive' },
      ],
      ongoing: [result.note, '한 번의 결재로 사건이 즉시 종결되지 않으며 다음 수사·공판·항소 시점에 영향을 줍니다.'],
      nextActions: ['국가 운영의 사법·검찰·보도 장부에서 증거 목록과 다음 절차 예정일을 확인하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.actionDetail);
    setPeriodAdvanceRemaining(0);
  }, [addEvent, displayedCareerRole.tier, displayedCareerRole.title, formatGameMoney, game.week, notify]);

  const startJusticeCase = (templateId: string) => {
    const result = openJusticeCase(nationManagement.justice, templateId, justiceContext());
    if (!result) return notify('대기 결재, 미결 사건 6건 상한, 정치력 2 또는 해당 시대의 사건 조건을 확인하십시오.');
    applyJusticeActionResult(result);
  };

  const decideJusticeCase = (optionId: JusticeDecisionOptionId) => {
    const result = resolveJusticeDecision(nationManagement.justice, optionId, justiceContext());
    if (!result) return notify('현재 결재안, 보직 권한, 정치력·국고, 시대·전시 조건을 확인하십시오.');
    applyJusticeActionResult(result);
  };

  const constitutionalContext = useCallback((): ConstitutionalContext => ({
    week: game.week,
    year: getCampaignYearForWeek(game.week),
    nationId: playerNation.id,
    role: displayedCareerRole,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: nationManagement.legitimacy,
    institutionalCapacity: nationManagement.institutionalCapacity,
    publicConfidence: economy.publicConfidence,
  }), [displayedCareerRole, economy.publicConfidence, game.politicalPower, game.stability, game.treasury, game.week, nationManagement.institutionalCapacity, nationManagement.legitimacy, playerNation.id]);

  const applyConstitutionalActionResult = useCallback((result: ConstitutionalActionResult) => {
    setNationManagement((current) => ({
      ...current,
      constitutionalJudiciary: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.legitimacyDelta)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.unrestDelta)),
      institutionalCapacity: Math.max(0, Math.min(100, current.institutionalCapacity + result.institutionalCapacityDelta)),
      justice: {
        ...current.justice,
        independence: Math.max(0, Math.min(100, current.justice.independence + result.justiceIndependenceDelta)),
        integrity: Math.max(0, Math.min(100, current.justice.integrity + result.justiceIntegrityDelta)),
      },
      dynasty: result.governmentFormId ? {
        ...current.dynasty,
        formId: result.governmentFormId,
        formedWeek: game.week,
        lastReformWeek: game.week,
      } : current.dynasty,
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.politicalPowerDelta,
      treasury: result.treasuryDelta,
      stability: result.stabilityDelta,
    }));
    setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.publicConfidenceDelta)),
    }));
    addEvent(result.title, result.detail, result.legitimacyDelta < 0 || result.justiceIndependenceDelta < -3 ? 'bad' : result.legitimacyDelta > 0 || result.justiceIndependenceDelta > 2 ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: `현재 보직 ${displayedCareerRole.title}의 헌정·사법 인사권과 공개된 절차 조건을 적용했습니다.`,
      factors: [
        `정치력 ${result.politicalPowerDelta >= 0 ? '+' : ''}${result.politicalPowerDelta} · 국고 ${formatGameMoney(result.treasuryDelta, { signed: true })}`,
        `법원 독립 ${Math.round(result.state.courtIndependence)} · 검찰 자율 ${Math.round(result.state.prosecutorialAutonomy)}`,
        `기본권 보호 ${Math.round(result.state.rightsProtection)} · 행정부 견제 ${Math.round(result.state.executiveConstraint)}`,
      ],
      effects: [
        { label: '정통성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta < 0 ? 'negative' : 'positive' },
        { label: '사법 독립', value: `${result.justiceIndependenceDelta >= 0 ? '+' : ''}${result.justiceIndependenceDelta}`, tone: result.justiceIndependenceDelta < 0 ? 'negative' : 'positive' },
        { label: '제도 역량', value: `${result.institutionalCapacityDelta >= 0 ? '+' : ''}${result.institutionalCapacityDelta}`, tone: result.institutionalCapacityDelta < 0 ? 'negative' : 'positive' },
        { label: '국민 신뢰', value: `${result.publicConfidenceDelta >= 0 ? '+' : ''}${result.publicConfidenceDelta}`, tone: result.publicConfidenceDelta < 0 ? 'negative' : 'positive' },
      ],
      ongoing: ['헌법 조항과 판사·검사 임기는 저장되며 수사·재판·쿠데타·선거·언론 사건의 제도적 배경으로 계속 작동합니다.'],
      nextActions: [result.state.activeNomination ? '주간을 진행해 검증·청문을 마친 뒤 인준 여부를 결정하십시오.' : result.state.status === 'drafting' ? '남은 헌법 장을 작성하고 비준 방식을 선택하십시오.' : '헌정·사법 인사 화면에서 공석과 임기를 점검하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
    setPeriodAdvanceRemaining(0);
  }, [addEvent, displayedCareerRole.title, formatGameMoney, game.week, notify]);

  const activateConstitution = useCallback(() => {
    const result = activateConstitutionalFounding(nationManagement.constitutionalJudiciary, constitutionalContext());
    if (!result) return notify('국가 최고위 1급 보직에 처음 도달했을 때 제헌권이 열립니다.');
    applyConstitutionalActionResult(result);
  }, [applyConstitutionalActionResult, constitutionalContext, nationManagement.constitutionalJudiciary, notify]);

  const chooseConstitutionClause = (clauseId: string) => {
    const result = selectConstitutionClause(nationManagement.constitutionalJudiciary, clauseId, constitutionalContext());
    if (!result) return notify('제헌 초안 상태, 최고위 보직과 정치력 1을 확인하십시오.');
    applyConstitutionalActionResult(result);
  };

  const enactConstitution = (methodId: RatificationMethodId) => {
    const result = ratifyConstitution(nationManagement.constitutionalJudiciary, methodId, constitutionalContext());
    if (!result) return notify('일곱 헌법 장, 비준 방식의 권력구조 적합성, 최고위 보직과 정치력·국고를 확인하십시오.');
    applyConstitutionalActionResult(result);
  };

  const nominateJudicialOfficer = (officeId: JudicialOfficeId, candidateId: string) => {
    const result = nominateJudicialCandidate(nationManagement.constitutionalJudiciary, officeId, candidateId, constitutionalContext());
    if (!result) return notify('공석, 진행 중인 다른 지명, 현재 보직의 인사권과 정치력·국고를 확인하십시오.');
    applyConstitutionalActionResult(result);
  };

  const decideJudicialNomination = (decisionId: NominationDecisionId) => {
    const result = resolveJudicialNomination(nationManagement.constitutionalJudiciary, decisionId, constitutionalContext());
    if (!result) return notify('청문 종료 여부, 인준 지지도, 보직 권한과 보강검증·강행 비용을 확인하십시오.');
    applyConstitutionalActionResult(result);
  };

  const sovereignPowerContext = useCallback((): SovereignPowerContext => ({
    week: game.week,
    year: getCampaignYearForWeek(game.week),
    nationId: playerNation.id,
    role: displayedCareerRole,
    formId: nationManagement.dynasty.formId,
    constitution: nationManagement.constitutionalJudiciary,
    dynasty: nationManagement.dynasty,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: nationManagement.legitimacy,
    unrest: nationManagement.unrest,
    publicConfidence: economy.publicConfidence,
    institutionalCapacity: nationManagement.institutionalCapacity,
    mediaFreedom: nationManagement.mediaRelations.freedom,
    justiceIndependence: nationManagement.justice.independence,
  }), [displayedCareerRole, economy.publicConfidence, game.politicalPower, game.stability, game.treasury, game.week, nationManagement.constitutionalJudiciary, nationManagement.dynasty, nationManagement.institutionalCapacity, nationManagement.justice.independence, nationManagement.legitimacy, nationManagement.mediaRelations.freedom, nationManagement.unrest, playerNation.id]);

  const applySovereignPowerResult = useCallback((result: SovereignPowerActionResult) => {
    setNationManagement((current) => ({
      ...current,
      sovereignPowers: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.impact.legitimacy)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.impact.unrest)),
      dynasty: {
        ...current.dynasty,
        crownAuthority: Math.max(0, Math.min(100, current.dynasty.crownAuthority + result.impact.crownAuthority)),
        courtUnity: Math.max(0, Math.min(100, current.dynasty.courtUnity + result.impact.courtUnity)),
        successionSecurity: Math.max(0, Math.min(100, current.dynasty.successionSecurity + result.impact.successionSecurity)),
        estateBurden: Math.max(0, Math.min(100, current.dynasty.estateBurden + result.impact.estateBurden)),
      },
      mediaRelations: {
        ...current.mediaRelations,
        freedom: Math.max(0, Math.min(100, current.mediaRelations.freedom + result.impact.mediaFreedom)),
        pressTrust: Math.max(0, Math.min(100, current.mediaRelations.pressTrust + result.impact.pressTrust)),
      },
      justice: {
        ...current.justice,
        independence: Math.max(0, Math.min(100, current.justice.independence + result.impact.justiceIndependence)),
        integrity: Math.max(0, Math.min(100, current.justice.integrity + result.impact.justiceIntegrity)),
      },
      constitutionalJudiciary: {
        ...current.constitutionalJudiciary,
        courtIndependence: Math.max(0, Math.min(100, current.constitutionalJudiciary.courtIndependence + result.impact.justiceIndependence)),
      },
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.impact.politicalPower,
      treasury: result.impact.treasury,
      stability: result.impact.stability,
    }));
    setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.impact.publicConfidence)),
    }));
    addEvent(result.title, result.detail, result.status === 'ultra-vires' ? 'bad' : result.status === 'express' || result.status === 'countersigned' ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: `현재 보직 ${displayedCareerRole.title}의 권한과 ${getGovernmentForm(nationManagement.dynasty.formId).name} 헌정을 대조했습니다.`,
      factors: [result.note, `헌정 관례 ${Math.round(result.state.constitutionalConvention)} · 의회 신임 ${Math.round(result.state.parliamentaryConfidence)}`, `군 복종 ${Math.round(result.state.militaryObedience)} · 귀족 지레버리지 ${Math.round(result.state.aristocraticLeverage)}`],
      effects: [
        { label: '정치력', value: `${result.impact.politicalPower >= 0 ? '+' : ''}${result.impact.politicalPower}`, tone: result.impact.politicalPower < 0 ? 'negative' : 'positive' },
        { label: '국고', value: formatGameMoney(result.impact.treasury, { signed: true }), tone: result.impact.treasury < 0 ? 'negative' : 'positive' },
        { label: '정통성', value: `${result.impact.legitimacy >= 0 ? '+' : ''}${result.impact.legitimacy}`, tone: result.impact.legitimacy < 0 ? 'negative' : 'positive' },
        { label: '사회 불안', value: `${result.impact.unrest >= 0 ? '+' : ''}${result.impact.unrest}`, tone: result.impact.unrest > 0 ? 'negative' : 'positive' },
      ],
      ongoing: [`제${result.verificationWeek + 1}주에 의회·법원·언론·궁정 반응을 검증합니다.`, '권한의 반복 행사는 헌정 관례·인사 후원 압력·귀족 지레버리지에 누적됩니다.'],
      nextActions: ['직위·왕관·영지 권한 장부에서 효력, 부서, 재행사 제한과 검증 주차를 확인하십시오.'],
      certainty: 'developing',
    });
    notify(result.detail);
    setPeriodAdvanceRemaining(0);
  }, [addEvent, displayedCareerRole.title, formatGameMoney, game.week, nationManagement.dynasty.formId, notify]);

  const exerciseOfficePower = (powerId: SovereignPowerId, targetGrantId: string | null) => {
    const target = targetGrantId ? nationManagement.dynasty.titleGrants.find((grant) => grant.id === targetGrantId) ?? null : null;
    const result = exerciseSovereignPower(nationManagement.sovereignPowers, powerId, sovereignPowerContext(), target);
    if (!result) return notify('현재 보직, 헌법·관례, 작위 대상, 재행사 제한, 권한 자본·정치력·국고 요건을 확인하십시오.');
    applySovereignPowerResult(result);
  };

  useEffect(() => {
    if (showBriefing || displayedCareerRole.tier !== 1 || nationManagement.constitutionalJudiciary.status !== 'awaiting-authority') return;
    const result = activateConstitutionalFounding(nationManagement.constitutionalJudiciary, constitutionalContext());
    if (!result) return;
    applyConstitutionalActionResult(result);
    setSpeed(0);
  }, [applyConstitutionalActionResult, constitutionalContext, displayedCareerRole.tier, nationManagement.constitutionalJudiciary, showBriefing]);

  const powerNetworkContext = useCallback((): PowerNetworkContext => ({
    week: game.week,
    year: getCampaignYearForWeek(game.week),
    phase: campaignPhase,
    nationId: playerNation.id,
    role: displayedCareerRole,
    strategyId: nationManagement.strategyId,
    budget: nationManagement.budget,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    warSupport: game.warSupport,
    enemyPressure: game.enemyPressure,
    intelNetwork: game.intelNetwork,
    legitimacy: nationManagement.legitimacy,
    unrest: nationManagement.unrest,
    welfare: nationManagement.welfare,
    education: nationManagement.education,
    employment: nationManagement.employment,
    civilianIndustry: nationManagement.civilianIndustry,
    institutionalCapacity: nationManagement.institutionalCapacity,
    inequality: nationManagement.inequality,
    relativeCompetitiveness: nationManagement.relativeCompetitiveness,
    relationAverage,
    inflation: economy.inflation,
    publicConfidence: economy.publicConfidence,
    mediaFreedom: nationManagement.mediaRelations.freedom,
    pressTrust: nationManagement.mediaRelations.pressTrust,
    activeElection: Boolean(nationManagement.electoral.activeCampaign),
  }), [campaignPhase, displayedCareerRole, economy.inflation, economy.publicConfidence, game.enemyPressure, game.intelNetwork, game.politicalPower, game.stability, game.treasury, game.warSupport, game.week, nationManagement.budget, nationManagement.civilianIndustry, nationManagement.education, nationManagement.electoral.activeCampaign, nationManagement.employment, nationManagement.inequality, nationManagement.institutionalCapacity, nationManagement.legitimacy, nationManagement.mediaRelations.freedom, nationManagement.mediaRelations.pressTrust, nationManagement.relativeCompetitiveness, nationManagement.strategyId, nationManagement.unrest, nationManagement.welfare, playerNation.id, relationAverage]);

  const applyPowerNetworkActionResult = useCallback((result: PowerNetworkActionResult) => {
    setNationManagement((current) => ({
      ...current,
      powerNetwork: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.legitimacyDelta)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.unrestDelta)),
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.politicalPowerDelta,
      treasury: result.treasuryDelta,
      stability: result.stabilityDelta,
    }));
    setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.publicConfidenceDelta)),
    }));
    const negative = result.legitimacyDelta < 0 || result.unrestDelta > 1 || result.publicConfidenceDelta < -1;
    const positive = result.legitimacyDelta > 0 || result.unrestDelta < 0 || result.publicConfidenceDelta > 1;
    addEvent(result.title, result.detail, negative ? 'bad' : positive ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: '보이는 세력의 지지·불만·동원, 공약 신뢰와 경쟁자의 지렛대가 함께 작동했습니다.',
      factors: [
        `현재 보직: ${displayedCareerRole.title} · ${displayedCareerRole.tier}급`,
        `연정 공약 신뢰 ${Math.round(result.state.promiseReliability)}`,
        `경쟁자 압력 ${Math.round(result.state.rival.pressure)} · 존중 ${Math.round(result.state.rival.respect)} · 지렛대 ${Math.round(result.state.rival.leverage)}`,
      ],
      effects: [
        { label: '정치력', value: `${result.politicalPowerDelta >= 0 ? '+' : ''}${result.politicalPowerDelta}`, tone: result.politicalPowerDelta < 0 ? 'negative' : 'positive' },
        { label: '국고', value: formatGameMoney(result.treasuryDelta, { signed: true }), tone: result.treasuryDelta < 0 ? 'negative' : 'positive' },
        { label: '정통성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta < 0 ? 'negative' : 'positive' },
        { label: '사회 불안', value: `${result.unrestDelta >= 0 ? '+' : ''}${result.unrestDelta}`, tone: result.unrestDelta > 0 ? 'negative' : 'positive' },
      ],
      ongoing: ['세력은 이번 결정을 기억하며 이후 지지, 동원, 공약 협상과 경쟁자의 13주 행동에 반영합니다.'],
      nextActions: ['국가 운영의 권력 생태계에서 세력별 반응과 다음 공약·기회·경쟁자 행동을 확인하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
  }, [addEvent, displayedCareerRole.tier, displayedCareerRole.title, formatGameMoney, game.week, notify]);

  const changeLeadershipPrinciples = (principles: LeadershipPrincipleId[]) => {
    const result = setLeadershipPrinciples(nationManagement.powerNetwork, principles, powerNetworkContext());
    if (!result) return notify('서로 다른 원칙 세 가지와 정치력 4가 필요합니다. 현재와 같은 조합은 다시 선언할 수 없습니다.');
    applyPowerNetworkActionResult(result);
  };

  const promisePowerBloc = (blocId: PowerBlocId) => {
    const result = makeBlocPromise(nationManagement.powerNetwork, blocId, powerNetworkContext());
    if (!result) return notify('동시에 하나의 공약만 관리할 수 있으며 정치력 3이 필요합니다.');
    applyPowerNetworkActionResult(result);
  };

  const changeLegacyPath = (pathId: LegacyPathId) => {
    const result = selectLegacyPath(nationManagement.powerNetwork, pathId, powerNetworkContext());
    if (!result) return notify('장기 유산 전환에는 정치력 6과 이전 선언 이후 26주의 숙의 기간이 필요합니다.');
    applyPowerNetworkActionResult(result);
  };

  const takeRivalAction = (actionId: RivalActionId) => {
    const result = manageRival(nationManagement.powerNetwork, actionId, powerNetworkContext());
    if (!result) return notify('보직 권한, 정치력·국고 또는 6주 행동 냉각기간을 확인하십시오.');
    applyPowerNetworkActionResult(result);
  };

  const decidePowerOpportunity = (choiceId: OpportunityChoiceId) => {
    const result = resolvePowerOpportunity(nationManagement.powerNetwork, choiceId, powerNetworkContext());
    if (!result) return notify('현재 결재 가능한 정치적 기회가 없거나 선택에 필요한 정치력·국고가 부족합니다.');
    applyPowerNetworkActionResult(result);
    setPeriodAdvanceRemaining(0);
  };

  const strategicSagaContext = useCallback((): StrategicSagaContext => ({
    week: game.week,
    year: getCampaignYearForWeek(game.week),
    phase: campaignPhase,
    nationId: playerNation.id,
    role: displayedCareerRole,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    warSupport: game.warSupport,
    enemyPressure: game.enemyPressure,
    intelNetwork: game.intelNetwork,
    legitimacy: nationManagement.legitimacy,
    unrest: nationManagement.unrest,
    education: nationManagement.education,
    civilianIndustry: nationManagement.civilianIndustry,
    institutionalCapacity: nationManagement.institutionalCapacity,
    relativeCompetitiveness: nationManagement.relativeCompetitiveness,
    relationAverage,
    publicConfidence: economy.publicConfidence,
    inflation: economy.inflation,
    completedResearch: research.filter((project) => project.complete).length,
    publicHealthPressure: projectionPublicHealthPressure,
    coalitionSupport: nationManagement.powerNetwork.blocs.reduce((sum, bloc) => sum + bloc.support, 0) / Math.max(1, nationManagement.powerNetwork.blocs.length),
    promiseReliability: nationManagement.powerNetwork.promiseReliability,
  }), [campaignPhase, displayedCareerRole, economy.inflation, economy.publicConfidence, game.enemyPressure, game.intelNetwork, game.politicalPower, game.stability, game.treasury, game.warSupport, game.week, nationManagement.civilianIndustry, nationManagement.education, nationManagement.institutionalCapacity, nationManagement.legitimacy, nationManagement.powerNetwork.blocs, nationManagement.powerNetwork.promiseReliability, nationManagement.relativeCompetitiveness, nationManagement.unrest, playerNation.id, projectionPublicHealthPressure, relationAverage, research]);

  const applySagaActionResult = useCallback((result: SagaActionResult) => {
    setNationManagement((current) => ({
      ...current,
      strategicSaga: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.legitimacyDelta)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.unrestDelta)),
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.politicalPowerDelta,
      treasury: result.treasuryDelta,
      stability: result.stabilityDelta,
    }));
    if (result.publicConfidenceDelta !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.publicConfidenceDelta)),
    }));
    addEvent(result.title, result.detail, result.legitimacyDelta < 0 || result.unrestDelta > 0 ? 'bad' : result.legitimacyDelta > 0 || result.publicConfidenceDelta > 0 ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: '현재 시대의 구조적 긴장, 책임 참모의 역량과 선택한 대응 원칙을 결합했습니다.',
      factors: [
        `현재 보직 ${displayedCareerRole.title} · 권한 ${displayedCareerRole.tier}급`,
        `정치력 ${result.politicalPowerDelta >= 0 ? '+' : ''}${result.politicalPowerDelta} · 국고 ${formatGameMoney(result.treasuryDelta, { signed: true })}`,
        `완결 유산 ${result.state.legacyMarks} · 제도 기억 ${result.state.institutionalMemory.length}`,
      ],
      effects: [
        { label: '정당성', value: `${result.legitimacyDelta >= 0 ? '+' : ''}${result.legitimacyDelta}`, tone: result.legitimacyDelta < 0 ? 'negative' : 'positive' },
        { label: '사회 불안', value: `${result.unrestDelta >= 0 ? '+' : ''}${result.unrestDelta}`, tone: result.unrestDelta > 0 ? 'negative' : 'positive' },
      ],
      ongoing: ['선택은 매주 진행도·압력·기세를 바꾸고, 각 막의 전환점과 후퇴는 최종 유산에 기록됩니다.'],
      nextActions: ['전략 서사 카드에서 예상 주간 진척과 압력을 확인한 뒤 필요하면 예비자원을 투입하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
    setPeriodAdvanceRemaining(0);
  }, [addEvent, displayedCareerRole.tier, displayedCareerRole.title, formatGameMoney, game.week, notify]);

  const launchStrategicSaga = (definitionId: string, champion: SagaChampion) => {
    const result = startStrategicSaga(nationManagement.strategicSaga, definitionId, champion, strategicSagaContext());
    applySagaActionResult(result);
  };

  const selectStrategicSagaApproach = (approachId: SagaApproachId) => {
    const result = chooseSagaApproach(nationManagement.strategicSaga, approachId, strategicSagaContext());
    applySagaActionResult(result);
  };

  const reinforceStrategicSaga = () => {
    const result = commitSagaReserve(nationManagement.strategicSaga, strategicSagaContext());
    applySagaActionResult(result);
  };

  const socialistWorldContext = useCallback((): SocialistWorldContext => {
    const blocById = new globalThis.Map(nationManagement.powerNetwork.blocs.map((bloc) => [bloc.id, bloc]));
    return {
      week: game.week,
      year: getCampaignYearForWeek(game.week),
      phase: campaignPhase,
      nationId: playerNation.id,
      role: displayedCareerRole,
      politicalPower: game.politicalPower,
      treasury: game.treasury,
      stability: game.stability,
      warSupport: game.warSupport,
      enemyPressure: game.enemyPressure,
      legitimacy: nationManagement.legitimacy,
      unrest: nationManagement.unrest,
      welfare: nationManagement.welfare,
      employment: nationManagement.employment,
      inequality: nationManagement.inequality,
      education: nationManagement.education,
      civilianIndustry: nationManagement.civilianIndustry,
      institutionalCapacity: nationManagement.institutionalCapacity,
      publicConfidence: economy.publicConfidence,
      inflation: economy.inflation,
      relationAverage,
      laborSupport: blocById.get('labor')?.support ?? 50,
      laborInfluence: blocById.get('labor')?.influence ?? 50,
      civicSupport: blocById.get('civic')?.support ?? 50,
      intelligentsiaSupport: blocById.get('intelligentsia')?.support ?? 50,
      securitySupport: blocById.get('security')?.support ?? 50,
    };
  }, [campaignPhase, displayedCareerRole, economy.inflation, economy.publicConfidence, game.enemyPressure, game.politicalPower, game.stability, game.treasury, game.warSupport, game.week, nationManagement.civilianIndustry, nationManagement.education, nationManagement.employment, nationManagement.inequality, nationManagement.institutionalCapacity, nationManagement.legitimacy, nationManagement.powerNetwork.blocs, nationManagement.unrest, nationManagement.welfare, playerNation.id, relationAverage]);

  const applySocialistActionResult = useCallback((result: SocialistActionResult) => {
    setNationManagement((current) => ({
      ...current,
      socialistWorld: result.state,
      legitimacy: Math.max(0, Math.min(100, current.legitimacy + result.nationDelta.legitimacy)),
      unrest: Math.max(0, Math.min(100, current.unrest + result.nationDelta.unrest)),
      welfare: Math.max(0, Math.min(100, current.welfare + result.nationDelta.welfare)),
      employment: Math.max(0, Math.min(100, current.employment + result.nationDelta.employment)),
      inequality: Math.max(0, Math.min(100, current.inequality + result.nationDelta.inequality)),
      civilianIndustry: Math.max(0, Math.min(100, current.civilianIndustry + result.nationDelta.civilianIndustry)),
      institutionalCapacity: Math.max(0, Math.min(100, current.institutionalCapacity + result.nationDelta.institutionalCapacity)),
    }));
    setGame((current) => applyGameDelta(current, {
      politicalPower: result.politicalPowerDelta,
      treasury: result.treasuryDelta,
      stability: result.stabilityDelta,
    }));
    if (result.publicConfidenceDelta !== 0) setEconomy((current) => ({
      ...current,
      publicConfidence: Math.max(0, Math.min(100, current.publicConfidence + result.publicConfidenceDelta)),
    }));
    const costly = result.stabilityDelta < 0 || result.nationDelta.unrest > 0 || result.publicConfidenceDelta < 0;
    addEvent(result.title, result.detail, costly ? 'bad' : result.nationDelta.legitimacy > 0 ? 'good' : 'neutral', game.week, {
      domain: 'management',
      decision: result.title,
      trigger: '계급 압력, 조직 기반, 현재 권력연합, 책임 참모의 역량과 선택한 전환 모델을 함께 판정했습니다.',
      factors: [
        `현재 보직 ${displayedCareerRole.title} · 권한 ${displayedCareerRole.tier}급`,
        `계급 압력 ${Math.round(result.state.classPressure)} · 노동 조직 ${Math.round(result.state.workerOrganization)}`,
        `당 통제 ${Math.round(result.state.partyControl)} · 평의회 권력 ${Math.round(result.state.councilPower)} · 강제력 ${Math.round(result.state.coercion)}`,
      ],
      effects: [
        { label: '정치력', value: `${result.politicalPowerDelta >= 0 ? '+' : ''}${result.politicalPowerDelta}`, tone: result.politicalPowerDelta < 0 ? 'negative' : 'neutral' },
        { label: '국고', value: formatGameMoney(result.treasuryDelta, { signed: true }), tone: result.treasuryDelta < 0 ? 'negative' : 'neutral' },
        { label: '정당성', value: `${result.nationDelta.legitimacy >= 0 ? '+' : ''}${result.nationDelta.legitimacy}`, tone: result.nationDelta.legitimacy < 0 ? 'negative' : 'positive' },
        { label: '사회 불안', value: `${result.nationDelta.unrest >= 0 ? '+' : ''}${result.nationDelta.unrest}`, tone: result.nationDelta.unrest > 0 ? 'negative' : 'positive' },
      ],
      ongoing: ['네 단계에서 고른 방법, 발생한 후퇴와 제도적 상처가 체제 성립 이후의 생산·복지·대표권·강제력에 계속 반영됩니다.'],
      nextActions: [result.state.active?.settlementId === null ? '사회체제 화면에서 새 단계의 제도 합의를 선택하십시오.' : result.state.active?.methodId === null ? '채택한 제도 합의를 집행할 전환 방식을 선택하십시오.' : '주간 브리핑에서 진척·내부 모순·자본유출·외압의 변화 원인을 확인하십시오.'],
      certainty: 'developing',
    });
    notify(result.detail);
    setPeriodAdvanceRemaining(0);
  }, [addEvent, displayedCareerRole.tier, displayedCareerRole.title, formatGameMoney, game.week, notify]);

  const launchSocialistWorldTransition = (modelId: SocialistModelId, sponsor: SocialistTransitionSponsor) => {
    applySocialistActionResult(startSocialistTransition(nationManagement.socialistWorld, modelId, sponsor, socialistWorldContext()));
  };

  const selectSocialistWorldMethod = (methodId: SocialistTransitionMethodId) => {
    applySocialistActionResult(chooseSocialistTransitionMethod(nationManagement.socialistWorld, methodId, socialistWorldContext()));
  };

  const selectSocialistSettlement = (settlementId: SocialistSettlementId) => {
    applySocialistActionResult(chooseSocialistSettlement(nationManagement.socialistWorld, settlementId, socialistWorldContext()));
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

  const continueCareerInForeignService = (
    offer: ForeignCareerOffer,
    transfer: NonNullable<ReturnType<typeof respondToCareerOffer>>['transfer'],
    gameDelta: Partial<Record<keyof GameState, number>>,
    careerDelta: { reputation: number; councilTrust: number; legacy: number },
  ) => {
    if (!transfer) return;
    const nextNation = getNation(transfer.nationId);
    const nextRole = getRole(transfer.roleId, transfer.nationId);
    const nextDivisions = createCampaignDivisions(nextNation);
    const nextGame = applyGameDelta({ ...game, ...nextNation.modifiers, week: game.week }, gameDelta);
    const nextEconomy = createEconomyState(nextNation.id);
    const nextRelations = createDiplomaticRelations(nextNation.id);
    const nextOperations = createCovertOperations(nextNation.defaultTheater, nextNation.id);
    const nextPublicHealth = createPublicHealthState(createPublicHealthSeed(nextNation.id, nextRole.id));
    const nextCandidates = [
      ...createStaffCandidates(nextNation.id, nextRole.id),
      ...createEmergentIntelligenceCandidates(nextNation.id, campaignYear, worldline.timeline),
      ...createLaterEraCandidates(nextNation.id, campaignYear, getHistoricalHorizon(game.week, completedDecisions)).slice(0, 12),
    ];
    const commandTerritoryId = getNationCommandTerritoryId(nextNation);
    const nextMapRegion = nextNation.operationalHeadquarters
      ? getMapRegionForTerritory(territories, commandTerritoryId, nextNation.defaultTheater)
      : getDefaultMapRegion(nextNation.defaultTheater);

    setCareer((current) => ({
      ...current,
      nationId: nextNation.id,
      roleId: nextRole.id,
      reputation: Math.max(0, Math.min(100, current.reputation + careerDelta.reputation)),
      councilTrust: Math.max(0, Math.min(100, 52 + careerDelta.councilTrust)),
      experience: Math.max(12, Math.round(current.experience * 0.55)),
      legacy: Math.max(0, current.legacy + careerDelta.legacy),
      alternatePathId: null,
      replacedPersonId: nextRole.historicalHolderId,
    }));
    setGame(nextGame);
    setEconomy(nextEconomy);
    setPublicHealth(nextPublicHealth);
    setNationManagement(createNationManagementState(nextNation.id, nextGame, nextEconomy, research.filter((project) => project.complete).length, 'negotiated'));
    setPoliticalCrisis(createPoliticalCrisisState(nextNation.id));
    setPendingCoupIncident(null);
    setShowPoliticalCrisis(false);
    setDivisions(nextDivisions);
    setProduction(createCampaignProduction(nextNation));
    setPostwarIndustry(createPostwarIndustryState(nextNation.id, game.week));
    initializeRegionalAccount(nextNation.id, game.week);
    resetFieldSession();
    setOperationStoppages([]);
    setBattleReports([]);
    setPostwarIndustrySettings(normalizePostwarIndustrySettings(undefined));
    setEquipmentDevelopment(createEquipmentDevelopment(nextNation.id));
    setArmsPortfolio(createArmsPortfolioState(nextNation.id));
    const transferredStaff = createStaffRoster(nextNation.id, nextRole.id);
    setStaff(transferredStaff);
    setStaffNarrative(createStaffNarrativeState(transferredStaff, game.week));
    setStaffCandidates(nextCandidates);
    setRelations(nextRelations);
    setOperations(nextOperations);
    setJointForces(createJointForcesState(nextNation.id));
    setEnemyStrategy(createEnemyStrategyState());
    setRoleCommand(createRoleCommandState(nextRole, game.week));
    setOrders([]);
    setPendingOffensivePlan(null);
    setPendingBattleReportId(null);
    setPendingCouncilEventId(null);
    setPendingWorldFlashpointId(null);
    setPlanningMode(false);
    setCommanderDevelopment(createCommanderDevelopment(createCareerCommanders(nextNation, nextRole)));
    setPriorityDivisionId(nextDivisions[0]?.id ?? '');
    setSelectedDivisionId(nextDivisions[0]?.id);
    setSelectedTerritoryId(commandTerritoryId);
    setActiveTheater(nextNation.defaultTheater);
    setActiveMapRegionId(nextMapRegion.id);
    setMapCamera(clampMapCamera(nextMapRegion.camera));
    setSelectedFrontDetailId(null);
    setCampaignOutcome(null);
    setPeriodAdvanceRemaining(0);
    setSpeed(0);
    setSetupNationId(nextNation.id);
    setSetupRoleId(nextRole.id);
    setShowCareerMarket(false);
    setPendingCareerOfferId(null);
    setPendingClandestineMissionId(null);
    setCareerMarketInitialView(undefined);
    setActiveTab(campaignPhase === 'nation' ? 'governance' : 'command');
    addEvent(
      `국제 경력 이동 — ${nextNation.shortName} ${nextRole.title}`,
      `${offer.title}을 수락했습니다. 이전 국가에서 쌓은 평판·경력·세계선·완료 연구·선택 기록은 유지되며, 지휘부·참모·부대·재정·외교망은 새 소속에 맞게 인계됐습니다.`,
      'neutral',
      game.week,
      {
        domain: 'diplomacy',
        decision: `${nextNation.shortName}의 ${nextRole.title} 보직을 수락해 같은 세계선에서 경력을 계속했습니다.`,
        trigger: `${withJosa(offer.sender, '이/가')} 보낸 ${offer.title}의 조건을 최종 수락했습니다.`,
        factors: [`이전 소속: ${playerNation.shortName}`, `새 소속: ${nextNation.shortName}`, `새 보직: ${nextRole.title}`, `경력 신분: ${transfer.status}`],
        effects: [
          { label: '소속 국가', value: `${playerNation.shortName} → ${nextNation.shortName}`, tone: 'neutral' },
          { label: '계약금', value: formatGameMoney(offer.terms.signingBonus), tone: 'positive' },
          { label: '세계선', value: '기존 사건·선택·연구 기록 유지', tone: 'positive' },
        ],
        ongoing: ['전향·망명 기록은 이후 외교 제안, 방첩 위험, 결말과 역사적 평가에 계속 반영됩니다.', '새 소속의 전황·국정 자원과 조직을 인수했지만 개인 경력과 대체역사 인과관계는 초기화되지 않습니다.'],
        nextActions: [campaignPhase === 'nation' ? '국가 운영 화면에서 새 정부의 예산·정통성·국가계획을 검토하십시오.' : '지휘 본부에서 새 부대·전선·참모와 첫 주 우선순위를 확인하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${nextNation.shortName} · ${withJosa(nextRole.title, '으로/로')} 국제 경력을 계속합니다.`);
  };

  const respondToForeignCareerOffer = (offerId: string, response: CareerOfferResponse) => {
    const result = respondToCareerOffer(careerMarket, offerId, response, careerMarketContext);
    if (!result) {
      notify('이 대응은 현재 보직·정보력 또는 제안 상태에서 실행할 수 없습니다.');
      return;
    }
    setCareerMarket(result.state);
    if (response === 'accept' && result.state.clandestine) {
      setPendingCareerOfferId(null);
      setPendingClandestineMissionId(result.state.clandestine.missions.find((mission) => mission.status === 'offered')?.id ?? null);
      setCareerMarketInitialView('clandestine');
    }
    if (response === 'defer') {
      setShowCareerMarket(false);
      setPendingCareerOfferId(null);
      setPendingClandestineMissionId(null);
      setCareerMarketInitialView(undefined);
      notify(result.detail);
      return;
    }
    if (result.transfer) {
      continueCareerInForeignService(result.offer, result.transfer, result.gameDelta, result.careerDelta);
      return;
    }
    setGame((current) => applyGameDelta(current, result.gameDelta));
    setCareer((current) => ({
      ...current,
      reputation: Math.max(0, Math.min(100, current.reputation + result.careerDelta.reputation)),
      councilTrust: Math.max(0, Math.min(100, current.councilTrust + result.careerDelta.councilTrust)),
      legacy: Math.max(0, current.legacy + result.careerDelta.legacy),
    }));
    addEvent(
      result.title,
      result.detail,
      result.tone,
      game.week,
      {
        domain: 'operations',
        decision: `${result.offer.title}에 대해 ${response} 대응을 선택했습니다.`,
        trigger: `${result.offer.sender}의 외국 제안이 사용자에게 직접 도착했습니다.`,
        factors: [`발각 위험 ${Math.round(result.offer.exposureRisk)}`, `제안 신뢰도 ${Math.round(result.offer.credibility)}`, `경력 신분 ${result.state.affiliationStatus}`],
        effects: Object.entries(result.gameDelta).map(([key, value]) => ({ label: key, value: `${Number(value) >= 0 ? '+' : ''}${value}`, tone: Number(value) >= 0 ? 'positive' : 'negative' })),
        ongoing: response === 'accept'
          ? ['비밀 협조와 이중 소속은 매주 노출 위험과 외국 신뢰를 변화시키며 이후 추가 요구를 발생시킵니다.']
          : response === 'report' || response === 'turn'
            ? ['상대 기관은 연락망이 노출됐다고 의심하며 다음 접근 방식과 제안 조건을 바꿉니다.']
            : ['거절 기록은 해당 국가의 외국 신뢰와 다음 제안 가능성에 남습니다.'],
        nextActions: ['국제 경력·비밀 접촉실의 경력 기록에서 결과와 남은 제안을 확인하십시오.'],
        certainty: 'confirmed',
      },
    );
    const nextPending = result.state.offers.find((offer) => offer.id !== offerId && ['pending', 'exploring', 'negotiating'].includes(offer.status));
    if (!(response === 'accept' && result.state.clandestine)) setPendingCareerOfferId(nextPending?.id ?? null);
    notify(result.detail);
  };

  const approachForeignCareerMarket = (nationId: NationId, kind: CareerApproachKind) => {
    const result = initiateCareerApproach(careerMarket, nationId, kind, careerMarketContext);
    setCareerMarket(result.state);
    setCareer((current) => ({
      ...current,
      councilTrust: Math.max(0, Math.min(100, current.councilTrust + result.careerTrustDelta)),
    }));
    setGame((current) => applyGameDelta(current, result.gameDelta));
    if (result.offer) {
      setPendingCareerOfferId(result.offer.id);
      setPendingClandestineMissionId(null);
      setCareerMarketInitialView('inbox');
      setShowCareerMarket(true);
      setPeriodAdvanceRemaining(0);
      setSpeed(0);
    }
    addEvent(
      result.title,
      result.detail,
      result.success ? 'neutral' : 'bad',
      game.week,
      {
        domain: 'diplomacy',
        decision: `${getNation(nationId).shortName}에 사용자가 먼저 ${kind} 접근을 보냈습니다.`,
        trigger: `현재 경력 신분 ${careerMarket.affiliationStatus}, 평판 ${Math.round(career.reputation)}, 지도부 신임 ${Math.round(career.councilTrust)}.`,
        factors: [`목표 국가: ${getNation(nationId).shortName}`, `접근 방식: ${kind}`, `현재 노출 위험 ${Math.round(result.state.exposure)}`],
        effects: [{ label: '접촉 결과', value: result.success ? '회신·제안 도착' : '응답 없음', tone: result.success ? 'positive' : 'negative' }],
        ongoing: ['재직 중 외부 접근은 현재 지도부 신임과 방첩 노출 기록에 남습니다.'],
        nextActions: [result.offer ? '도착한 회신의 보직·대가·보호·요구를 비교하십시오.' : '2주 뒤 다른 방식이나 국가로 다시 접근할 수 있습니다.'],
        certainty: 'confirmed',
      },
    );
    notify(result.detail);
  };

  const createCurrentClandestineContext = () => ({
    week: game.week,
    role: careerRole,
    intelNetwork: game.intelNetwork,
    stability: game.stability,
    warSupport: game.warSupport,
    campaignPhase,
    exposure: careerMarket.exposure,
  });

  const applyClandestineResolution = (
    result: NonNullable<ReturnType<typeof respondToClandestineMission>>,
  ) => {
    setCareerMarket((current) => ({
      ...current,
      clandestine: result.state,
      exposure: Math.max(0, Math.min(100, current.exposure + result.exposureDelta)),
    }));
    setGame((current) => applyGameDelta(current, result.gameDelta));
    setCareer((current) => ({
      ...current,
      reputation: Math.max(0, Math.min(100, current.reputation + result.careerDelta.reputation)),
      councilTrust: Math.max(0, Math.min(100, current.councilTrust + result.careerDelta.councilTrust)),
      legacy: Math.max(0, current.legacy + result.careerDelta.legacy),
    }));
    addEvent(
      result.title,
      result.detail,
      result.tone,
      game.week,
      {
        domain: 'operations',
        decision: result.title,
        trigger: '외국 핸들러 요구 또는 방첩 위기에 사용자가 직접 대응했습니다.',
        factors: [
          `노출 변화 ${result.exposureDelta >= 0 ? '+' : ''}${result.exposureDelta}`,
          `핸들러 신뢰 ${Math.round(result.state.handlerTrust)}`,
          `본국 신뢰 ${Math.round(result.state.homeTrust)}`,
          `위장 강도 ${Math.round(result.state.coverStrength)}`,
        ],
        effects: Object.entries(result.gameDelta).map(([key, value]) => ({
          label: key,
          value: `${Number(value) >= 0 ? '+' : ''}${value}`,
          tone: Number(value) >= 0 ? 'positive' : 'negative',
        })),
        ongoing: ['선택 기록은 이후 숙련도·양측 신뢰·보호 약속·조사 확률에 남고, 시대가 바뀌면 별도 경력 장으로 보존됩니다.'],
        nextActions: [result.needsAttention ? '비밀 접촉실에서 후속 결정을 완료하십시오.' : '다음 주 진행 뒤 임무 결과와 양국 자원 변화를 확인하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(result.detail);
  };

  const respondToHandlerMission = (missionId: string, response: ClandestineMissionResponse) => {
    if (!careerMarket.clandestine) {
      notify('활성화된 외국 핸들러가 없습니다.');
      return;
    }
    const result = respondToClandestineMission(
      careerMarket.clandestine,
      missionId,
      response,
      createCurrentClandestineContext(),
    );
    if (!result) {
      notify('현재는 이 임무에 대응할 수 없습니다. 방첩 위기 또는 임무 상태를 먼저 확인하십시오.');
      return;
    }
    applyClandestineResolution(result);
    if (result.state.status === 'closed') {
      setCareerMarket((current) => ({
        ...current,
        affiliationStatus: 'serving',
        handlerNationId: null,
        history: [{
          id: `clandestine-contact-closed-${game.week}`,
          week: game.week,
          nationId: result.state.handlerNationId,
          title: '비밀 연락선 종료',
          outcome: 'rejected' as const,
          detail: `외국 연락은 종료됐지만 ${careerRole.title}의 공개 경력과 같은 세계선은 계속됩니다. 이후 다른 국가의 새 제안이나 사용자의 직접 접근으로 새 비밀 경력을 시작할 수 있습니다.`,
        }, ...current.history].slice(0, 80),
      }));
    }
    setPendingClandestineMissionId(null);
    setCareerMarketInitialView('clandestine');
  };

  const respondToSecretIdentityIncident = (response: ClandestineIncidentResponse) => {
    if (!careerMarket.clandestine) return;
    const result = respondToClandestineIncident(
      careerMarket.clandestine,
      response,
      createCurrentClandestineContext(),
    );
    if (!result) {
      notify('현재 대응할 비밀 신분 위기가 없습니다.');
      return;
    }
    if (result.transferNationId) {
      const targetRole = careerRoles.find((role) =>
        role.nationId === result.transferNationId
        && role.branch === careerRole.branch
        && role.tier === careerRole.tier,
      ) ?? careerRoles.find((role) => role.nationId === result.transferNationId && role.branch === careerRole.branch)
        ?? getRole(`${result.transferNationId}-tier3`, result.transferNationId);
      const handlerNation = getNation(result.transferNationId);
      const clandestine = careerMarket.clandestine;
      const extractionOffer: ForeignCareerOffer = {
        id: `clandestine-extraction-${game.week}-${result.transferNationId}`,
        sourceNationId: result.transferNationId,
        targetRoleId: targetRole.id,
        kind: 'asylum-and-post',
        status: 'accepted',
        origin: 'foreign-initiated',
        receivedWeek: game.week,
        deadlineWeek: game.week,
        title: `${handlerNation.shortName} · 비밀 신분 긴급 탈출`,
        sender: clandestine?.handlerAlias ?? '외국 정보기관 연락관',
        coverChannel: '게임 내 추상화된 비밀 보호 회선',
        pitch: '장기 비밀 협조의 최종 보호 조건이 발동됐습니다.',
        demand: '현재 보직 사임과 외국 보호구역·새 보직으로의 이동',
        motive: 'security',
        secrecy: clandestine?.coverStrength ?? 40,
        exposureRisk: careerMarket.exposure,
        credibility: clandestine?.handlerTrust ?? 50,
        acceptanceChance: 100,
        terms: {
          signingBonus: clandestine?.operationalFunds ?? 0,
          weeklyRetainer: 0,
          authority: targetRole.authority,
          protection: clandestine?.handlerTrust ?? 50,
          extraction: 100,
          autonomy: targetRole.tier <= 2 ? 'independent' : targetRole.tier <= 4 ? 'operational' : 'limited',
        },
        consequencePreview: ['현재 국가의 보직을 떠납니다.', '기존 세계선·경력·완료 연구·선택 기록은 유지됩니다.'],
      };
      setCareerMarket((current) => ({
        ...current,
        affiliationStatus: 'defector',
        handlerNationId: null,
        clandestine: null,
        defections: current.defections + 1,
        exposure: Math.max(0, Math.min(100, current.exposure + result.exposureDelta)),
      }));
      continueCareerInForeignService(
        extractionOffer,
        { nationId: result.transferNationId, roleId: targetRole.id, status: 'defector' },
        result.gameDelta,
        result.careerDelta,
      );
      return;
    }
    applyClandestineResolution(result);
    setPendingClandestineMissionId(null);
    setCareerMarketInitialView('clandestine');
  };

  const changeClandestinePosture = (posture: ClandestinePosture) => {
    if (!careerMarket.clandestine) return;
    const nextState = setClandestinePosture(careerMarket.clandestine, posture);
    if (nextState === careerMarket.clandestine) return;
    setCareerMarket((current) => ({ ...current, clandestine: nextState }));
    addEvent(
      `비밀 활동 태세 변경 — ${nextState.posture}`,
      `장기 비밀 활동의 기본 태세를 변경했습니다. 다음 주부터 위장·핸들러 압박·기만 성공·탈출 준비 계산에 반영됩니다.`,
      'neutral',
      game.week,
    );
    notify('비밀 활동 태세를 변경했습니다.');
  };

  const startCampaign = () => {
    const nation = getNation(setupNationId);
    const isCivilianStart = setupStartMode === 'civilian';
    const civilianProfession = getCivilianProfession(setupCivilianProfessionId);
    const selectedCareerRoleId = isCivilianStart ? getCivilianRoleId(nation.id, setupCivilianProfessionId) : setupRoleId;
    const role = getRole(selectedCareerRoleId, setupNationId);
    const newCareer: CareerState = {
      ...createCareerState(nation.id, role.id),
      startMode: setupStartMode,
      replacedPersonId: isCivilianStart ? '' : role.historicalHolderId,
      civilian: isCivilianStart ? createCivilianCareerState(setupCivilianProfessionId, setupCivilianOriginId) : undefined,
    };
    const newDivisions = createCampaignDivisions(nation);
    const doctrineBonus: Partial<GameState> = isCivilianStart
      ? doctrine === 'methodical'
        ? { steel: (nation.modifiers.steel ?? initialGame.steel) + 4, stability: (nation.modifiers.stability ?? initialGame.stability) + 2 }
        : doctrine === 'maneuver'
          ? { politicalPower: (nation.modifiers.politicalPower ?? initialGame.politicalPower) + 5, intelNetwork: (nation.modifiers.intelNetwork ?? initialGame.intelNetwork) + 3 }
          : { politicalPower: (nation.modifiers.politicalPower ?? initialGame.politicalPower) + 7, stability: (nation.modifiers.stability ?? initialGame.stability) + 3 }
      : doctrine === 'methodical'
        ? { factories: (nation.modifiers.factories ?? initialGame.factories) + 3, steel: (nation.modifiers.steel ?? initialGame.steel) + 13 }
        : doctrine === 'maneuver'
          ? { fuel: (nation.modifiers.fuel ?? initialGame.fuel) + 22, commandPoints: initialGame.commandPoints + 8 }
          : { politicalPower: (nation.modifiers.politicalPower ?? initialGame.politicalPower) + 16, stability: (nation.modifiers.stability ?? initialGame.stability) + 4 };
    const roleDelta: Partial<Record<keyof GameState, number>> = isCivilianStart
      ? civilianProfession.gameDelta
      : role.branch === 'intelligence'
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
    const openingTrajectory = deriveEmergentHistory({
      doctrine,
      roleBranch: role.branch,
      game: newGame,
      relations: newRelations,
      operations: newOperations,
      civilianInfluences: newCareer.civilian?.worldInfluences,
    });
    const newWorldline = generateWorldline({
      nation,
      game: newGame,
      state: newWorldHistoryState,
      trajectory: openingTrajectory,
      careerSignature: newCareer.civilian ? getCivilianCareerSignature(newCareer.civilian) : role.id,
    });
    const newTerritories = initialTerritories.map((territory) => ({ ...territory }));
    const newResearch = initialResearch.map((project) => ({ ...project }));
    const openingEventTimestamp = Date.now();
    const openingEvents: WarEvent[] = [
      isCivilianStart
        ? {
          id: openingEventTimestamp,
          week: 0,
          title: `민간 커리어 시작 — ${civilianProfession.name}`,
          detail: `${civilianProfession.vocation}을 일상 기반으로 삼아 공식 권한 없이 활동을 시작했습니다. 실존 인물을 밀어내지 않으며 평판·전문성·인맥·생계·감시 위험이 별도로 계산됩니다.`,
          tone: 'good',
        }
        : { id: openingEventTimestamp, week: 0, title: `보직 인수 — ${withJosa(role.historicalHolderName, '을/를')} 대신하여`, detail: `${withJosa(role.historicalHolderName, '이/가')} 맡았던 ${role.historicalOffice}의 권한을 대체역사 보직으로 재편했습니다. 전임자는 인재 시장의 경쟁자로 남습니다.`, tone: 'good' },
      {
        id: openingEventTimestamp + 1,
        week: 0,
        title: `살아있는 역사 개막 — ${openingTrajectory.title}`,
        detail: `${doctrine === 'coalition' ? '연합과 협상' : doctrine === 'methodical' ? '산업과 준비' : '속도와 충격'}이라는 첫 선택에서 출발합니다. 앞으로 실제 행동이 세계의 세력권과 제도를 계속 바꿉니다.`,
        tone: 'neutral',
        trace: {
          domain: 'history',
          decision: `취임 지휘 철학으로 ‘${doctrine === 'coalition' ? '연합과 협상' : doctrine === 'methodical' ? '산업과 준비' : '속도와 충격'}’을 선택했습니다.`,
          trigger: isCivilianStart
            ? `${nation.shortName}에서 ${civilianProfession.name}의 삶으로 1942년 10월 25일 활동을 시작했습니다.`
            : `${nation.shortName}의 ${role.title} 보직에서 1942년 10월 25일 지휘를 시작했습니다.`,
          factors: [
            `플레이 국가: ${nation.shortName}`,
            isCivilianStart ? `민간 출발: ${civilianProfession.name} · ${setupCivilianOriginId}` : `대체 보직: ${role.historicalHolderName} · ${role.historicalOffice}`,
            `세계선 코드: ${newWorldline.code}`,
            `세력권 경쟁: ${newWorldline.rivalryName}`,
          ],
          effects: [{ label: '세계선', value: newWorldline.code, tone: 'neutral' }],
          ongoing: ['국가 원칙·작전·인사·외교·연구·경제 선택이 여섯 역사 압력에 누적되며, 이후 사건의 행위자와 결과 확률을 바꿉니다.'],
          nextActions: [isCivilianStart
            ? '세계 주보를 읽은 뒤 상황실의 민간 행동 6개 중 하나를 골라 첫 사회적 흔적을 남기십시오.'
            : '세계 주보의 각 기사에서 전선·외교·경제·사회·과학·정보 화면으로 이동해 첫 주 우선순위를 결정하십시오.'],
          certainty: 'developing',
        },
      },
    ];
    const openingWorldChange = deriveWorldChangeProfile({
      territories: newTerritories,
      baselineTerritories: newTerritories,
      relations: newRelations,
      baselineRelations: newRelations,
      staff: createStaffRoster(nation.id, role.id),
      events: openingEvents,
      trajectory: openingTrajectory,
      playerFaction: nation.alignment,
    });
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
      worldChange: openingWorldChange,
    });
    setGame(newGame);
    setPublicHealth(newPublicHealth);
    setEconomy(newEconomy);
    setCampaignPhase('war');
    setPeriodAdvanceRemaining(0);
    setPeriodAdvanceSession(null);
    setLatestPeriodAdvanceReport(null);
    setShowTimeCommandCenter(false);
    setNationManagement(createNationManagementState(nation.id, newGame, newEconomy, initialResearch.filter((project) => project.complete).length, 'negotiated'));
    setPoliticalCrisis(createPoliticalCrisisState(nation.id));
    setPendingCoupIncident(null);
    setShowPoliticalCrisis(false);
    setTerritories(newTerritories);
    setWorldChangeBaseline(createWorldChangeBaseline(newTerritories, newRelations));
    setDivisions(newDivisions);
    setResearch(newResearch);
    setEquipmentDevelopment(createEquipmentDevelopment(nation.id));
    setArmsPortfolio(createArmsPortfolioState(nation.id));
    setProduction(createCampaignProduction(nation));
    setPostwarIndustry(createPostwarIndustryState(nation.id, newGame.week));
    initializeRegionalAccount(nation.id, newGame.week, true);
    resetFieldSession();
    setOperationStoppages([]);
    setPostwarIndustrySettings(normalizePostwarIndustrySettings(undefined));
    const openingStaff = createStaffRoster(nation.id, role.id);
    setStaff(openingStaff);
    setStaffNarrative(createStaffNarrativeState(openingStaff));
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
    setJointForces(createJointForcesState(nation.id));
    setEnemyStrategy(createEnemyStrategyState());
    setRelations(newRelations);
    setOperations(newOperations);
    setCareer(newCareer);
    setRoleCommand(createRoleCommandState(role, 0));
    setCareerMarket(createCareerMarketState());
    setShowCareerMarket(false);
    setPendingCareerOfferId(null);
    setPendingClandestineMissionId(null);
    setCareerMarketInitialView(undefined);
    const commandTerritoryId = getNationCommandTerritoryId(nation);
    const openingMapRegion = nation.operationalHeadquarters
      ? getMapRegionForTerritory(newTerritories, commandTerritoryId, nation.defaultTheater)
      : getDefaultMapRegion(nation.defaultTheater);
    setActiveTheater(nation.defaultTheater);
    setActiveMapRegionId(openingMapRegion.id);
    setMapCamera(clampMapCamera(openingMapRegion.camera));
    setSelectedFrontDetailId(null);
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
    setCommandWorkspace('desk');
    setShowBriefing(false);
    setShowTutorial(!localStorage.getItem(TUTORIAL_KEY));
    notify(isCivilianStart
      ? `${nation.shortName} · ${civilianProfession.name}의 삶을 시작했습니다. 세계 주보 창간호가 발행되었습니다.`
      : `${nation.shortName} · ${withJosa(role.title, '으로/로')} 취임했습니다. 세계 주보 창간호가 발행되었습니다.`);
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
      const restoredWorldChangeBaseline = normalizeWorldChangeBaseline(data.worldChangeBaseline, mergedTerritories, restoredRelations);
      const restoredOperations: CovertOperation[] = data.operations ?? createCovertOperations(restoredNation.defaultTheater, restoredNation.id);
      const restoredBattleReports: BattleReport[] = data.battleReports ?? [];
      setGame(restoredGame);
      setPublicHealth(restoredPublicHealth);
      const restoredEconomy = normalizeEconomyState(data.economy, restoredNation.id, getCampaignYearForWeek(restoredGame.week));
      const restoredResearch = normalizeResearchProjects(data.research, initialResearch);
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
        civilianInfluences: savedCareer.civilian?.worldInfluences,
      });
      const restoredWorldline = generateWorldline({ nation: restoredNation, game: restoredGame, state: restoredWorldHistoryState, trajectory: restoredTrajectory });
      setEconomy(restoredEconomy);
      setCampaignPhase(restoredPhase);
      setPeriodAdvanceRemaining(0);
      setPeriodAdvanceSession(null);
      setLatestPeriodAdvanceReport(normalizeStrategicAdvanceReport(data.latestPeriodAdvanceReport));
      setShowTimeCommandCenter(false);
      setNationManagement(restoredNationManagement);
      setPoliticalCrisis(normalizePoliticalCrisisState(data.politicalCrisis, restoredNation.id));
      setPendingCoupIncident(data.pendingCoupIncident && data.pendingCoupIncident.nationId === restoredNation.id ? data.pendingCoupIncident : null);
      setShowPoliticalCrisis(false);
      setTerritories(mergedTerritories);
      setDivisions(migratedDivisions);
      setResearch(restoredResearch);
      setEquipmentDevelopment(normalizeEquipmentDevelopment(data.equipmentDevelopment, restoredNation.id));
      setArmsPortfolio(normalizeArmsPortfolioState(data.armsPortfolio, restoredNation.id));
      setProduction(migratedProduction);
      setPostwarIndustry(normalizePostwarIndustryState(data.postwarIndustry, restoredNation.id, restoredGame.week));
      resetFieldSession();
      setPostwarIndustrySettings(normalizePostwarIndustrySettings(data.postwarIndustrySettings));
      setEvents(restoredEvents);
      setOrders(normalizeOperationOrders(data.orders ?? [], mergedTerritories, migratedDivisions));
      setOperationStoppages(normalizeOperationStopReceipts(data.operationStoppages));
      const restoredRegionalIndustry = normalizeRegionalIndustry(data.regionalIndustry, restoredNation.id, restoredGame.week);
      regionalIndustryRef.current = restoredRegionalIndustry;
      setRegionalIndustry(restoredRegionalIndustry);
      setSelectedFieldOrderId(undefined);
      staffDecisionLocksRef.current.clear();
      commandSubmissionLocksRef.current.clear();
      lastWeekAdvanceRequestRef.current = null;
      setStockpile({ ...initialStockpile, ...(data.stockpile ?? {}) });
      setJointForces(normalizeJointForcesState(data.jointForces, restoredNation.id));
      setEnemyStrategy(restoredPhase === 'nation' ? createEnemyStrategyState() : normalizeEnemyStrategyState(data.enemyStrategy));
      setRoleCommand(normalizeRoleCommandState(data.roleCommand, restoredRole, restoredGame.week));
      setRelations(restoredRelations);
      setWorldChangeBaseline(restoredWorldChangeBaseline);
      setOperations(restoredOperations);
      const historicalStaff = createStaffRoster(restoredNation.id, restoredRole.id);
      const savedStaff: StaffMember[] = data.staff ?? [];
      const restoredStaff = data.version >= 37 && Array.isArray(data.staff)
        ? savedStaff.filter((member, index, all) => member && typeof member.id === 'string' && all.findIndex((other) => other?.id === member.id) === index)
          .map((member) => ({ ...member, grade: member.grade ?? 1, development: member.development ?? 20 }))
        : historicalStaff.map((fallback) => {
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
      });
      setStaff(restoredStaff);
      setStaffNarrative(normalizeStaffNarrativeState(data.staffNarrative, restoredStaff, restoredGame.week));
      const restoredPledges = normalizeStaffDeliveryPledges(data.staffDeliveryPledges, { ...staffDeliveryContext, nationId: restoredNation.id, week: restoredGame.week, phase: restoredPhase, staff: restoredStaff, production: migratedProduction, lineEquipment: getPostwarProductionLineEquipment(migratedProduction) });
      staffDeliveryPledgesRef.current = restoredPledges;
      setStaffDeliveryPledges(restoredPledges);
      const restoredYear = getCampaignYearForWeek(data.game?.week ?? 0);
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
      setStaffCandidates(normalizeCandidateScoutingRoster([...mergedCandidates, ...displacedCandidates]));
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
      setSelectedFrontDetailId(null);
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
      const restoredCareerMarket = normalizeCareerMarketState(data.careerMarket);
      const restoredPendingCareerOfferId = typeof data.pendingCareerOfferId === 'string'
        && restoredCareerMarket.offers.some((offer) => offer.id === data.pendingCareerOfferId && ['pending', 'exploring', 'negotiating'].includes(offer.status))
        ? data.pendingCareerOfferId
        : null;
      const restoredPendingClandestineMissionId = typeof data.pendingClandestineMissionId === 'string'
        && restoredCareerMarket.clandestine?.missions.some((mission) => mission.id === data.pendingClandestineMissionId && mission.status === 'offered')
        ? data.pendingClandestineMissionId
        : null;
      setCareerMarket(restoredCareerMarket);
      setPendingCareerOfferId(restoredPendingCareerOfferId);
      setPendingClandestineMissionId(restoredPendingClandestineMissionId);
      setCareerMarketInitialView(restoredPendingClandestineMissionId ? 'clandestine' : restoredPendingCareerOfferId ? 'inbox' : undefined);
      setShowCareerMarket(false);
      setSetupNationId(restoredCareer.nationId);
      setSetupRoleId(restoredCareer.roleId);
      setSetupStartMode(restoredCareer.startMode === 'civilian' ? 'civilian' : 'office');
      if (restoredCareer.civilian) {
        setSetupCivilianProfessionId(restoredCareer.civilian.professionId);
        setSetupCivilianOriginId(restoredCareer.civilian.originId);
      }
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
    setPeriodAdvanceRemaining(0);
    setPeriodAdvanceSession(null);
    setLatestPeriodAdvanceReport(null);
    setShowTimeCommandCenter(false);
    setNationManagement(defaultNationManagementState);
    setPoliticalCrisis(createPoliticalCrisisState(DEFAULT_NATION_ID));
    setPendingCoupIncident(null);
    setShowPoliticalCrisis(false);
    setTerritories(initialTerritories);
    setDivisions(defaultDivisions);
    setResearch(initialResearch);
    setEquipmentDevelopment(createEquipmentDevelopment(DEFAULT_NATION_ID));
    setArmsPortfolio(createArmsPortfolioState(DEFAULT_NATION_ID));
    setProduction(defaultProduction);
    setPostwarIndustry(createPostwarIndustryState(DEFAULT_NATION_ID, initialGame.week));
    initializeRegionalAccount(DEFAULT_NATION_ID, initialGame.week, true);
    resetFieldSession();
    setOperationStoppages([]);
    setPostwarIndustrySettings(normalizePostwarIndustrySettings(undefined));
    setEvents(initialEvents);
    setOrders([]);
    setStockpile(initialStockpile);
    setJointForces(createJointForcesState(DEFAULT_NATION_ID));
    setEnemyStrategy(createEnemyStrategyState());
    setRelations(initialRelations);
    setWorldChangeBaseline(createWorldChangeBaseline(initialTerritories, initialRelations));
    setOperations(initialOperations);
    const resetStaff = createStaffRoster(DEFAULT_NATION_ID, DEFAULT_ROLE_ID);
    setStaff(resetStaff);
    setStaffNarrative(createStaffNarrativeState(resetStaff));
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
    setSetupStartMode('office');
    setSetupCivilianProfessionId('intellectual');
    setSetupCivilianOriginId('university-network');
    setCareer(createCareerState(DEFAULT_NATION_ID, DEFAULT_ROLE_ID));
    setRoleCommand(createRoleCommandState(getRole(DEFAULT_ROLE_ID, DEFAULT_NATION_ID)));
    setCareerMarket(createCareerMarketState());
    setShowCareerMarket(false);
    setPendingCareerOfferId(null);
    setPendingClandestineMissionId(null);
    setCareerMarketInitialView(undefined);
    setActiveTheater('europe');
    setActiveMapRegionId('europe-overview');
    setSelectedTerritoryId(getNationCommandTerritoryId(defaultNation));
    setSelectedDivisionId(defaultDivisions[0].id);
    setMapLayer('political');
    setMapCamera(DEFAULT_MAP_CAMERA);
    setSelectedFrontDetailId(null);
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
    setCommandWorkspace('desk');
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
      if (!commandableDivisionIds.has(currentDivision.id)) {
        notify('이 부대는 현재 보직의 예하 편제가 아닙니다. 상급 지휘부를 통해 작전을 상신하십시오.');
        setPlanningMode(false);
        return;
      }
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

  const launchCombinedOperation = (templateId: string, fleetIds: string[], airGroupIds: string[], objectiveId?: string) => {
    if (campaignPhase === 'nation') {
      notify('평시 합동작전은 국가 운영의 전략작전 체계에서 승인하십시오. 현재 화면은 전시 작전용입니다.');
      return;
    }
    const result = launchJointOperation(jointForces, templateId, fleetIds, airGroupIds, {
      week: game.week,
      theater: activeTheater,
      game,
    }, objectiveId);
    if (!result) {
      notify('임무 요구에 맞는 출격 가능 함대·항공대를 배속해야 합니다.');
      return;
    }
    if (game.commandPoints < result.forecast.commandCost || game.fuel < result.forecast.fuelCost || stockpile.convoys < result.forecast.convoyCost) {
      notify('지휘점수·연료·수송선 중 작전에 필요한 자원이 부족합니다.');
      return;
    }
    setJointForces(result.state);
    setGame((current) => ({
      ...current,
      commandPoints: Math.max(0, current.commandPoints - result.forecast.commandCost),
      fuel: Math.max(0, current.fuel - result.forecast.fuelCost),
    }));
    if (result.forecast.convoyCost > 0) {
      setStockpile((current) => ({ ...current, convoys: Math.max(0, current.convoys - result.forecast.convoyCost) }));
    }
    completeOnboardingMilestone('military-action');
    addEvent(
      `합동작전 승인 — ${result.operation.name}`,
      `${result.operation.objectiveName ?? '전구 목표'}에 ${result.operation.fleetIds.length}개 함대와 ${result.operation.airGroupIds.length}개 항공대를 배속했습니다. ${result.forecast.duration} 동안 진행되며 초기 성공 전망은 ${result.forecast.chance}%입니다.`,
      'neutral',
      game.week,
      {
        domain: 'operations',
        decision: `${result.operation.name} 작전계획·${result.operation.objectiveName ?? '전구 목표'}·투입 편제를 승인했습니다.`,
        trigger: `${activeTheater === 'asia' ? '아시아·태평양' : '유럽·지중해'} 전구에서 독립 해·공군 임무를 개시했습니다.`,
        factors: result.forecast.factors,
        effects: [
          { label: '지휘점수', value: `-${result.forecast.commandCost}`, tone: 'negative' },
          { label: '연료', value: `-${result.forecast.fuelCost}K`, tone: 'negative' },
          { label: '수송선', value: `-${result.forecast.convoyCost}척`, tone: result.forecast.convoyCost > 0 ? 'negative' : 'neutral' },
        ],
        ongoing: [`최소 ${result.operation.minimumWeeks}주가 지나고 누적 진척 100%에 도달해야 성공 판정을 받을 수 있습니다.`, '투입 부대는 작전 종료 전까지 다른 임무에 중복 배속할 수 없습니다.', result.forecast.civilianWarning ?? '작전 결과는 목표 구역의 통제·수송·기반시설·위협에 누적됩니다.'],
        nextActions: ['다음 주 진행 뒤 합동군 화면에서 진척·가동률·중간보고를 확인하십시오.'],
        certainty: 'forecast',
      },
    );
    notify(`${result.operation.name} 승인 · ${result.forecast.duration} · 성공 전망 ${result.forecast.chance}%`);
    recordSuccessfulRoleAction('army', `joint-operation:${result.operation.id}`, `${result.operation.name} 편제·작전 승인`);
  };

  const changeJointDoctrine = (nextDoctrine: JointDoctrine) => {
    if (jointForces.doctrine === nextDoctrine) return;
    if (game.commandPoints < 4) {
      notify('합동교리 변경에는 지휘점수 4가 필요합니다.');
      return;
    }
    setJointForces((current) => setJointDoctrine(current, nextDoctrine));
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 4 }));
    addEvent('합동교리 변경 — ' + jointDoctrineDefinitions[nextDoctrine].name, `${jointDoctrineDefinitions[nextDoctrine].description} ${jointDoctrineDefinitions[nextDoctrine].bonus}`, 'neutral', game.week);
    notify(`${jointDoctrineDefinitions[nextDoctrine].name} 채택 · 지휘점수 -4`);
  };

  const answerJointCommander = (messageId: string, response: JointCommandResponse) => {
    const result = respondToJointCommandMessage(jointForces, messageId, response);
    if (!result) {
      notify('이미 처리됐거나 종료된 지휘관 전문입니다.');
      return;
    }
    if (game.commandPoints < result.commandCost) {
      notify(`이 응답에는 지휘점수 ${result.commandCost}가 필요합니다.`);
      return;
    }
    setJointForces(result.state);
    if (result.commandCost > 0) setGame((current) => ({ ...current, commandPoints: current.commandPoints - result.commandCost }));
    addEvent('지휘관 전문 회신', result.detail, response === 'overrule' ? 'bad' : 'neutral', game.week, {
      domain: 'operations',
      decision: response === 'back' ? '현장 지휘관의 재량권을 보장했습니다.' : response === 'revise' ? '작전계획 보강과 일정 조정을 지시했습니다.' : '추가 조정 없이 원안을 강행했습니다.',
      trigger: '합동작전 지휘관이 위험평가와 현장 재량권에 관한 전문을 보냈습니다.',
      factors: [`지휘부 신뢰 ${jointForces.commandTrust}`, `가용 지휘점수 ${game.commandPoints}`],
      effects: [
        { label: '지휘점수', value: `-${result.commandCost}`, tone: result.commandCost > 0 ? 'negative' : 'neutral' },
        { label: '지휘부 신뢰', value: response === 'back' ? '+4' : response === 'revise' ? '+1' : '-6', tone: response === 'overrule' ? 'negative' : 'positive' },
      ],
      ongoing: ['회신은 해당 작전의 성공 전망과 지휘관의 장기 신뢰에 반영됩니다.'],
      nextActions: ['합동작전 본부에서 수정된 성공 전망과 작전 기간을 확인하십시오.'],
      certainty: 'confirmed',
    });
    notify(result.detail);
  };

  const toggleJointForceRefit = (forceId: string) => {
    const force = [...jointForces.fleets, ...jointForces.airGroups].find((unit) => unit.id === forceId);
    if (!force || force.status === 'assigned') {
      notify('작전 배속 중인 전력은 임무 종료 전까지 재편할 수 없습니다.');
      return;
    }
    setJointForces((current) => sendJointForceToRefit(current, forceId));
    addEvent(
      `${force.status === 'refit' ? '전력 복귀' : '집중 정비'} — ${force.name}`,
      force.status === 'refit' ? '정비 태세를 해제하고 다음 주부터 출격 가능한 예비전력으로 복귀합니다.' : '한 주마다 준비도와 가동률을 빠르게 회복하지만 작전에는 배속할 수 없습니다.',
      'neutral',
      game.week,
    );
  };

  const issueOffensive = () => {
    if (campaignPhase === 'nation') {
      notify('국가 운영 단계에서 전역 지도는 국경·교역·안보 현황을 보여 줍니다. 영토 공세 대신 외교·안보 예산을 사용하십시오.');
      setPlanningMode(false);
      return;
    }
    if (!canCommandSelectedDivision) {
      notify(`${withJosa(selectedDivision.name, '은/는')} 상급 지휘부 관할입니다. 현재 보직에서는 전황만 열람할 수 있습니다.`);
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
    const submissionId = `offensive:${playerNation.id}:${game.week}:${division.id}`;
    if (commandSubmissionLocksRef.current.has(submissionId) || orders.some((order) => order.divisionId === division.id)) {
      notify('이 부대에는 이미 승인된 명령이 있습니다. 작전 현장에서 확인하십시오.');
      return;
    }
    if (!commandableDivisionIds.has(division.id)) {
      setPendingOffensivePlan(null);
      setPlanningMode(false);
      notify('보직의 작전 지휘 범위를 벗어난 부대라 계획을 승인할 수 없습니다.');
      return;
    }
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
    const operationOrder = createOperationOrder({
      divisionId: division.id,
      fromId: origin.id,
      targetId: target.id,
      startedWeek: game.week,
      stance,
      commandCost: 5,
    }, origin, target, division);
    commandSubmissionLocksRef.current.add(submissionId);
    const operationProfile = battleTypeProfiles[operationOrder.battleType ?? 'attrition'];
    setOrders((current) => [...current, operationOrder]);
    setSelectedFieldOrderId(getOperationOrderId(operationOrder));
    setDivisions((current) => current.map((item) => item.id === division.id ? { ...item, status: 'moving' } : item));
    setGame((current) => ({ ...current, commandPoints: current.commandPoints - 5 }));
    setBattleStance(stance);
    setPendingOffensivePlan(null);
    setPlanningMode(false);
    setSelectedTerritoryId(target.id);
    completeOnboardingMilestone('military-action');
    recordSuccessfulRoleAction('army', `offensive:${division.id}:${target.id}`, `${division.name}의 ${target.name} 공세 계획 승인`);
    addEvent(
      '공세 계획 승인 — ' + target.name,
      `${division.name}에 ${stanceLabel}를 명령했습니다. ${operationProfile.label}으로 분류되어 약 ${operationProfile.minimumWeeks}~${operationProfile.maximumWeeks}주가 예상됩니다.${forecast ? ` 첫 주 교전 우세 확률은 ${forecast.successChance}%입니다.` : ''}`,
      'neutral',
      game.week,
    );
    notify(`${division.name} → ${target.name} ${operationProfile.shortLabel} 승인 · 예상 ${operationProfile.minimumWeeks}~${operationProfile.maximumWeeks}주`);
  };

  const authorizeTorch = () => {
    const commandLock = `major-operation:${playerNation.id}:${game.week}`;
    if (torchAuthorized || commandSubmissionLocksRef.current.has(commandLock)) return;
    if (campaignPhase !== 'war' || roleMandates.army.mode !== 'direct') { notify('현재 단계·보직에서는 대규모 전쟁 작전을 승인할 수 없습니다.'); return; }
    if (game.politicalPower < 20 || game.commandPoints < 10) {
      notify('정치력 또는 지휘 점수가 부족합니다.');
      return;
    }
    const operationDivisions = divisions.filter((division) => commandableDivisionIds.has(division.id) && division.status === 'ready' && !orders.some((order) => order.divisionId === division.id)).slice(0, 2);
    if (operationDivisions.length < 2) {
      notify('대규모 작전에는 현재 보직의 지휘권 안에 있는 준비 완료 부대 2개가 필요합니다. 진행 중인 명령이나 재편을 먼저 확인하십시오.');
      return;
    }
    const operationTarget = territories.find((territory) => territory.id === playerNation.strategicTargets[0]);
    if (!operationTarget) {
      notify('작전 목표를 설정할 수 없습니다.');
      return;
    }
    const majorOrders = operationDivisions.map((division) => {
        const origin = territories.find((territory) => territory.id === division.territoryId) ?? operationTarget;
        return createOperationOrder({ divisionId: division.id, fromId: division.territoryId, targetId: operationTarget.id, startedWeek: game.week, stance: battleStance, commandCost: 5 }, origin, operationTarget, division);
      });
    commandSubmissionLocksRef.current.add(commandLock);
    operationDivisions.forEach((division) => commandSubmissionLocksRef.current.add(`offensive:${playerNation.id}:${game.week}:${division.id}`));
    setOrders((current) => [...current, ...majorOrders]);
    setSelectedFieldOrderId(getOperationOrderId(majorOrders[0]));
    setDivisions((current) => current.map((division) => operationDivisions.some((item) => item.id === division.id) ? { ...division, status: 'moving' } : division));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 20, commandPoints: current.commandPoints - 10 }));
    setTorchAuthorized(true);
    completeOnboardingMilestone('military-action');
    recordSuccessfulRoleAction('army', 'major-operation', `${playerNation.majorOperation} 편제·작전 승인`);
    addEvent(playerNation.majorOperation + ' 승인', playerNation.majorOperationDetail, 'good', game.week);
    notify(`${withJosa(playerNation.majorOperation, '이/가')} 개시되었습니다.`);
  };

  const enactDecision = (id: string, title: string, cost: number, effect: () => void) => {
    if (completedDecisions.includes(id)) return;
    if (game.politicalPower < cost) {
      notify('정치력이 부족합니다.');
      return;
    }
    const diplomaticFeedback = id === `diplomatic-agenda-${playerNation.id}` ? getSummitFeedback(game, relations, playerNation.id) : null;
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - cost }));
    setCompletedDecisions((current) => [...current, id]);
    effect();
    addEvent('내각 결정 — ' + title, diplomaticFeedback ? '회담을 한 번 타결하고 아래의 상한 적용 후 변화와 정치 비용을 즉시 반영했습니다.' : '전쟁 내각이 결정을 승인하고 즉시 시행했습니다.', 'good', game.week, diplomaticFeedback ? {
      domain: 'diplomacy',
      decision: `${title} 타결`,
      trigger: `제${game.week + 1}주 · 개최 시점·상대국 관계·준비도·정치 비용 확인 후 승인`,
      factors: [`정치 비용 ${cost}`, diplomacyFeedbackPrecisionNote],
      effects: formatDiplomacyFeedbackEffects(diplomaticFeedback, formatGameMoney),
      ongoing: ['이 회담은 캠페인당 한 번 타결합니다. 보상을 매주 반복 적용하지 않습니다.', '반영된 관계·국가 지표는 이후 행동의 현재 상태로 유지됩니다.'],
      nextActions: ['외교 지휘실에서 상대국 관계와 회담 완료 상태를 확인하십시오.'],
      certainty: 'confirmed',
    } : undefined);
    notify(title + ' 시행 완료');
  };

  const enactArmsDiplomacyPolicy = (policy: ArmsDiplomacyPolicy) => {
    const id = getStrategicDecisionId(policy.id, policy.stageId);
    if (completedDecisions.includes(id)) {
      notify('이미 시행한 군비·외교 정책입니다.');
      return;
    }
    if (game.politicalPower < policy.politicalCost) {
      notify(`정책 시행에 정치력 ${policy.politicalCost - game.politicalPower}이 더 필요합니다.`);
      return;
    }
    if (policy.effects.treasury < 0 && game.treasury < Math.abs(policy.effects.treasury)) {
      notify(`이 정책에는 재정 ${formatGameMoney(Math.abs(policy.effects.treasury))}이 필요합니다.`);
      return;
    }
    const dueWeek = game.week + policy.reviewYears * 52;
    const feedback = getArmsPolicyFeedback(game, relations, armsPortfolio, policy);
    setGame((current) => ({
      ...applyStrategicPolicyReward(current, policy),
      politicalPower: Math.max(0, current.politicalPower - policy.politicalCost),
    }));
    setRelations((current) => applyStrategicPolicyRelations(current, policy));
    setArmsPortfolio((current) => applyStrategicPolicyToPortfolio(current, policy, game.week, campaignYear));
    setCompletedDecisions((current) => [...current, id, getArmsPolicyReviewMarker(policy, dueWeek)]);
    addEvent(
      `군비·외교 결정 — ${policy.title}`,
      `${policy.summary} 자원은 즉시 반영되며 ${policy.reviewYears}년 뒤 공급·자율·규범·긴장을 함께 검증합니다.`,
      policy.effects.escalation >= 10 ? 'neutral' : 'good',
      game.week,
      {
        domain: 'diplomacy',
        decision: policy.title,
        trigger: `${campaignYear}년 ${getStrategicStage(campaignYear).label} · ${policy.route}`,
        factors: [policy.historicalBasis, `검증 예정: ${getCampaignYearForWeek(dueWeek)}년`, diplomacyFeedbackPrecisionNote],
        effects: formatDiplomacyFeedbackEffects(feedback, formatGameMoney),
        ongoing: [
          `${policy.reviewYears}년 뒤 실제 집행 점수 검증`,
          '다음 장비 견적의 비용·성공률·현지화·공급안보에 누적',
          policy.route === 'covert' ? '비공식 경로의 노출 위험과 외교 비용이 누적' : '동맹 규격과 조달 자율성의 상충관계 추적',
        ],
        nextActions: ['연구·무기에서 조달 경로별 1·3·5년 전망 확인', '취약 분야의 정비권·부품 현지화 확보', '세계 주보에서 상대국 반응 확인'],
        certainty: 'developing',
      },
    );
    notify(`${policy.title} 시행 · ${policy.reviewYears}년 뒤 성과 검증`);
  };

  const fundArmsEmergencyStockpile = () => {
    if (game.treasury < 55 || game.politicalPower < 4) {
      notify(`공동 비축에는 정치력 4와 재정 ${formatGameMoney(55)}가 필요합니다.`);
      return;
    }
    if (armsPortfolio.emergencyStockpile >= 90) {
      notify('비상 부품·탄약 비축이 이미 안전 상한에 도달했습니다.');
      return;
    }
    const feedback = getEmergencyStockpileFeedback(game, armsPortfolio);
    setGame((current) => ({ ...current, treasury: current.treasury - 55, politicalPower: current.politicalPower - 4 }));
    setArmsPortfolio((current) => fundEmergencyArmsStockpile(current, game.week, campaignYear));
    addEvent(
      '군수 비축 — 90일 예비부품·탄약',
      '서로 다른 규격의 핵심 부품과 탄약을 공동 비축하고 대체 공급 계약을 체결했습니다. 다음 제재·봉쇄 충격의 가동률 하락을 완충합니다.',
      'good',
      game.week,
      {
        domain: 'management',
        decision: '90일 군수 공동비축',
        trigger: `공급안보 ${Math.round(armsPortfolio.supplySecurity)} · 비축 ${Math.round(armsPortfolio.emergencyStockpile)}`,
        factors: ['조달 경로별 제재·봉쇄 위험', '현지 정비권과 혼합 규격 부담', diplomacyFeedbackPrecisionNote],
        effects: formatDiplomacyFeedbackEffects(feedback, formatGameMoney),
        ongoing: ['직도입·원조·비공식 조달 때 비축 3씩 사용', '재비축 여부는 매 조달 전 같은 화면에서 확인'],
        nextActions: ['면허생산 또는 독자개발로 단계 전환', '정비 기술자·부품 현지화 확보'],
        certainty: 'confirmed',
      },
    );
    notify('90일 군수 공동비축 완료 · 공급 충격 완충력 상승');
  };

  const enactCivilizationProgram = (program: CivilizationProgram, path: CivilizationPath) => {
    const domain = civilizationDomainDefinitions[program.domainId];
    const programAlreadyCompleted = completedDecisions.some((decisionId) => decisionId.startsWith(getCivilizationDecisionPrefix(program.id)));
    if (programAlreadyCompleted) {
      notify(`${domain.shortLabel} 분야는 이미 이번 시대의 경로를 채택했습니다.`);
      return;
    }
    if (game.politicalPower < path.politicalCost) {
      notify(`정치력이 ${path.politicalCost - game.politicalPower} 부족합니다.`);
      return;
    }
    if (game.treasury < path.treasuryCost) {
      notify(`국고가 ${formatGameMoney(path.treasuryCost - game.treasury)} 부족합니다.`);
      return;
    }

    const gameDelta: Partial<Record<keyof GameState, number>> = {
      ...path.effects.game,
      politicalPower: (path.effects.game.politicalPower ?? 0) - path.politicalCost,
      treasury: (path.effects.game.treasury ?? 0) - path.treasuryCost,
    };
    setGame((current) => applyGameDelta(current, gameDelta));
    setEconomy((current) => applyCivilizationEconomyEffects(current, path));
    setNationManagement((current) => applyCivilizationNationEffects(current, path));
    setPublicHealth((current) => applyCivilizationPublicHealthEffects(current, path));
    if (path.effects.researchProgress > 0) {
      setResearch((current) => current.map((project) => (
        project.active && !project.complete
          ? {
              ...project,
              progress: Math.min(project.duration, project.progress + path.effects.researchProgress),
              complete: project.progress + path.effects.researchProgress >= project.duration,
            }
          : project
      )));
    }
    if (path.effects.relations !== 0) {
      setRelations((current) => current.map((relation) => ({
        ...relation,
        value: Math.max(0, Math.min(100, relation.value + path.effects.relations)),
      })));
    }
    setCompletedDecisions((current) => [
      ...current,
      path.id,
      getCivilizationReviewMarker(path, game.week + path.reviewWeeks),
    ]);

    const effectLabels = getCivilizationEffectLabels(path, 8);
    addEvent(
      `국가체계 결정 · ${domain.shortLabel} — ${path.label}`,
      `${program.title}에서 ${path.label} 경로를 채택했습니다. ${withJosa(path.beneficiary, '이/가')} 우선 수혜를 받으며, ${path.reviewWeeks}주 뒤 첫 제도 검증이 이뤄집니다.`,
      path.effectiveness >= 85 ? 'good' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: `${program.title} · ${path.label}`,
        trigger: `${campaignYear}년 ${playerNation.shortName} · ${careerRole.title} · ${path.authorityLabel}`,
        factors: [
          `역사적 기준점: ${program.historicalBasis}`,
          `주요 수혜: ${path.beneficiary}`,
          `구조적 위험: ${path.risk}`,
          `국가별·보직별 예상 실효 ${path.effectiveness}%`,
        ],
        effects: [
          { label: '정치 비용', value: `−${path.politicalCost}`, tone: 'negative' },
          { label: '재정 비용', value: formatGameMoney(-path.treasuryCost, { signed: true }), tone: 'negative' },
          ...effectLabels.map((effect) => ({
            label: effect.label,
            value: `${effect.value > 0 ? '+' : ''}${effect.value}`,
            tone: effect.favorable ? 'positive' as const : 'negative' as const,
          })),
        ],
        ongoing: [
          `${path.reviewWeeks}주 뒤 1차 성과 검증`,
          `${domain.label} 지표와 시장·권력집단 반응에 누적`,
          `위험 감시: ${path.risk}`,
        ],
        nextActions: [
          `${domain.label} 분야의 다음 시대 사업을 위한 집행역량 확보`,
          '진행 결과에서 예상 효과와 실제 결과 비교',
          '세계 주보에서 국제 파급과 타국 반응 확인',
        ],
        certainty: 'developing',
      },
    );
    notify(`${domain.shortLabel} 정책 채택 · ${path.reviewWeeks}주 뒤 첫 검증`);
  };

  const toggleResearch = (id: string) => {
    const activeCount = research.filter((project) => project.active).length;
    const project = research.find((item) => item.id === id);
    if (!project || project.complete) return;
    const availability = getResearchAvailability(project, research, campaignYear);
    if (!project.active && !availability.available) {
      notify(availability.reason);
      return;
    }
    if (!project.active && activeCount >= 2) {
      notify('연구 슬롯 2개가 모두 사용 중입니다.');
      return;
    }
    setResearch((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item));
    if (!project.active) recordSuccessfulRoleAction('research', `research:${id}`, `${project.name} 연구 슬롯 배정`);
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
    recordSuccessfulRoleAction('research', `equipment-research:${node.id}`, `${node.name} 개발 사업 승인`);
    addEvent('장비 개발 착수 — ' + node.name, node.summary + ' 연구·시험 사업을 승인했습니다.', 'neutral', game.week);
    notify(node.name + ' 개발 사업을 시작했습니다.');
  };

  const createEquipmentPrototype = (baseNodeId: string, moduleIds: string[], name: string, route: AcquisitionRoute) => {
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
    const quote = getEquipmentProcurementQuote(
      playerNation.id,
      campaignYear,
      prototype.category,
      Math.max(45, Math.round(prototype.industrialCost * 1.6)),
      completedDecisions,
      route,
      armsPortfolio,
    );
    const treasuryCost = quote.treasuryCost;
    if (!quote.available) {
      notify(quote.unavailableReason ?? '현재 조달 경로를 사용할 수 없습니다.');
      return;
    }
    if (game.treasury < treasuryCost || game.politicalPower < 8) {
      notify(`시제품 제작에는 정치력 8과 재정 ${formatGameMoney(treasuryCost)}가 필요합니다.`);
      return;
    }
    const storedPrototype = { ...prototype, id: `${prototype.id}-${equipmentDevelopment.prototypes.length + 1}` };
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 8, treasury: current.treasury - treasuryCost }));
    setEquipmentDevelopment((current) => ({ ...current, prototypes: [...current.prototypes, storedPrototype] }));
    setArmsPortfolio((current) => applyProcurementToPortfolio(current, {
      week: game.week,
      year: campaignYear,
      kind: 'prototype',
      title: storedPrototype.name,
      category: prototype.category,
      quote,
    }));
    addEvent(
      '시제 장비 완성 — ' + storedPrototype.name,
      `${quote.routeLabel} 경로로 시험 사업을 완료했습니다. 도입 성공 ${quote.successChance}%, 현지화 ${quote.localContent}%, 연 유지비 ${formatGameMoney(quote.annualSustainmentCost)}가 조달 원장에 기록됐습니다.`,
      storedPrototype.risk >= 35 || quote.successChance < 55 ? 'bad' : 'good',
      game.week,
      {
        domain: 'management',
        decision: `${storedPrototype.name} · ${quote.routeLabel} 시제품`,
        trigger: `${playerNation.shortName} ${campaignYear}년 ${prototype.category} 조달`,
        factors: [quote.explanation, ...quote.warnings],
        effects: [
          { label: '초기 비용', value: formatGameMoney(-treasuryCost, { signed: true }), tone: 'negative' },
          { label: '도입 성공', value: `${quote.successChance}%`, tone: quote.successChance >= 65 ? 'positive' : 'negative' },
          { label: '공급 안보', value: `${quote.supplySecurityEffect > 0 ? '+' : ''}${quote.supplySecurityEffect}`, tone: quote.supplySecurityEffect >= 0 ? 'positive' : 'negative' },
          { label: '조달 자율', value: `${quote.autonomyEffect > 0 ? '+' : ''}${quote.autonomyEffect}`, tone: quote.autonomyEffect >= 0 ? 'positive' : 'negative' },
        ],
        ongoing: quote.forecast.map((forecast) => `${forecast.years}년: 전력 ${forecast.readiness} · 공급 ${forecast.supplySecurity} · 누적 ${formatGameMoney(forecast.cumulativeCost)}`),
        nextActions: ['제식 채택 전 조달 경로 재비교', '현지 정비권·부품 현지화 확보', '외교 정책실에서 제재·상호운용 조건 보완'],
        certainty: 'developing',
      },
    );
    notify(`${storedPrototype.name} 제작 · ${quote.routeLabel} · 5년 누적 ${formatGameMoney(quote.forecast[2].cumulativeCost)}`);
  };

  const fieldEquipment = (equipmentId: string, route: AcquisitionRoute) => {
    const equipment = getDevelopedEquipment(equipmentId, equipmentDevelopment);
    if (!equipment || (!equipmentDevelopment.unlockedIds.includes(equipment.id) && !equipmentDevelopment.prototypes.some((prototype) => prototype.id === equipment.id))) return;
    if (equipmentDevelopment.fieldedByCategory[equipment.category] === equipment.id) return;
    const quote = getEquipmentProcurementQuote(
      playerNation.id,
      campaignYear,
      equipment.category,
      Math.max(30, Math.round(equipment.industrialCost * 1.2)),
      completedDecisions,
      route,
      armsPortfolio,
    );
    const adoptionCost = quote.treasuryCost;
    if (!quote.available) {
      notify(quote.unavailableReason ?? '현재 조달 경로를 사용할 수 없습니다.');
      return;
    }
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
    setEquipmentDevelopment((current) => ({
      ...current,
      fieldedByCategory: { ...current.fieldedByCategory, [equipment.category]: equipment.id },
      readiness: transitionWeaponReadinessEquipment(current.readiness, equipment.category, equipment.id, game.week),
    }));
    setArmsPortfolio((current) => applyProcurementToPortfolio(current, {
      week: game.week,
      year: campaignYear,
      kind: 'adoption',
      title: equipment.name,
      category: equipment.category,
      quote,
    }));
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
    addEvent(
      '제식 채택 — ' + equipment.name,
      `${quote.routeLabel} 계약으로 생산·보급 표준을 전환했습니다. 현지 정비·부품망과 공급자 피로가 다음 조달 견적에 누적됩니다.`,
      quote.successChance >= 60 ? 'good' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: `${equipment.name} · ${quote.routeLabel} 제식 채택`,
        trigger: `${campaignYear}년 ${equipmentCategoryLabels[equipment.category]} 세대교체`,
        factors: [quote.explanation, ...quote.warnings],
        effects: [
          { label: '도입 비용', value: formatGameMoney(-adoptionCost, { signed: true }), tone: 'negative' },
          { label: '연 유지비', value: formatGameMoney(-quote.annualSustainmentCost, { signed: true }), tone: 'negative' },
          { label: '상호운용', value: `${quote.interoperabilityEffect > 0 ? '+' : ''}${quote.interoperabilityEffect}`, tone: quote.interoperabilityEffect >= 0 ? 'positive' : 'negative' },
          { label: '긴장', value: `${quote.escalationEffect > 0 ? '+' : ''}${quote.escalationEffect}`, tone: quote.escalationEffect <= 0 ? 'positive' : 'negative' },
        ],
        ongoing: quote.forecast.map((forecast) => `${forecast.years}년: 전력 ${forecast.readiness} · 공급 ${forecast.supplySecurity} · 자율 ${forecast.autonomy}`),
        nextActions: quote.warnings.length > 0 ? ['조달 경고 해소 정책 선택', '정비권·기술자 양성 투자', '다음 세대 교체비 비축'] : ['생산 효율 검증', '부대별 장비 배치', '5년 세대교체 계획 수립'],
        certainty: 'confirmed',
      },
    );
    notify(`${equipment.name} 채택 · ${quote.routeLabel} · 공급안보 ${quote.supplySecurityEffect > 0 ? '+' : ''}${quote.supplySecurityEffect}`);
  };

  const setWeaponMaintenanceDoctrine = (doctrineId: WeaponMaintenanceDoctrine) => {
    if (equipmentDevelopment.readiness.maintenanceDoctrine === doctrineId) return;
    if (game.politicalPower < 2) {
      notify('전군 정비 교리 변경에는 정치력 2가 필요합니다.');
      return;
    }
    const definition = weaponMaintenanceDoctrineDefinitions[doctrineId];
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 2 }));
    setEquipmentDevelopment((current) => ({ ...current, readiness: { ...current.readiness, maintenanceDoctrine: doctrineId } }));
    addEvent('정비 교리 변경 — ' + definition.label, `${definition.summary} ${definition.tradeoff}. 다음 주 병기 결산부터 반영됩니다.`, 'neutral', game.week);
    notify(`${definition.label} 적용 · 다음 주 준비도 결산에서 검증`);
  };

  const setWeaponReplacementPolicy = (policyId: WeaponReplacementPolicy) => {
    if (equipmentDevelopment.readiness.replacementPolicy === policyId) return;
    if (game.politicalPower < 1) {
      notify('보충·세대교체 원칙 변경에는 정치력 1이 필요합니다.');
      return;
    }
    const definition = weaponReplacementPolicyDefinitions[policyId];
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 1 }));
    setEquipmentDevelopment((current) => ({ ...current, readiness: { ...current.readiness, replacementPolicy: policyId } }));
    addEvent('병기 보충 원칙 — ' + definition.label, `${definition.summary} 다음 주 생산·수리·신형 전환 배분부터 반영됩니다.`, 'neutral', game.week);
    notify(`${definition.label} 적용 · 정치력 1 사용`);
  };

  const setWeaponReadinessPriority = (category: EquipmentCategory, priority: WeaponModernizationPriority) => {
    setEquipmentDevelopment((current) => ({
      ...current,
      readiness: { ...current.readiness, priorities: { ...current.readiness.priorities, [category]: priority } },
    }));
    notify(`${equipmentCategoryLabels[category]} 현대화 우선순위 · ${priority === 'critical' ? '최우선' : priority === 'monitor' ? '관찰' : '표준'}`);
  };

  const startWeaponWorkOrder = (category: EquipmentCategory, type: WeaponWorkOrderType) => {
    const definition = weaponWorkOrderDefinitions[type];
    const nextReadiness = queueWeaponWorkOrder(equipmentDevelopment.readiness, category, type, game.week);
    if (!nextReadiness) {
      notify('동시 작업지시 한도 3개에 도달했거나 같은 작업이 이미 진행 중입니다.');
      return;
    }
    if (game.treasury < definition.treasuryCost || game.politicalPower < definition.politicalCost || game.commandPoints < definition.commandCost) {
      notify(`작업에는 재정 ${formatGameMoney(definition.treasuryCost)}, 정치력 ${definition.politicalCost}, 지휘 ${definition.commandCost}가 필요합니다.`);
      return;
    }
    setGame((current) => ({
      ...current,
      treasury: current.treasury - definition.treasuryCost,
      politicalPower: current.politicalPower - definition.politicalCost,
      commandPoints: current.commandPoints - definition.commandCost,
    }));
    setEquipmentDevelopment((current) => ({ ...current, readiness: nextReadiness }));
    addEvent(
      `병기 작업지시 — ${equipmentCategoryLabels[category]} ${definition.label}`,
      `${definition.durationWeeks}주 동안 ${definition.summary} 예상 결과: ${definition.expected}.`,
      'neutral',
      game.week,
      {
        domain: 'management',
        decision: `${equipmentCategoryLabels[category]} · ${definition.label}`,
        trigger: '병기 수명주기 본부 작업지시',
        factors: [`현재 준비도 ${equipmentDevelopment.readiness.categories[category].readinessScore}`, `정비 교리 ${weaponMaintenanceDoctrineDefinitions[equipmentDevelopment.readiness.maintenanceDoctrine].label}`, `세대교체 ${weaponReplacementPolicyDefinitions[equipmentDevelopment.readiness.replacementPolicy].label}`],
        effects: [
          { label: '사업 기간', value: `${definition.durationWeeks}주`, tone: 'neutral' },
          { label: '재정', value: formatGameMoney(-definition.treasuryCost, { signed: true }), tone: 'negative' },
          { label: '지휘 자원', value: `${definition.politicalCost}PP · 지휘 ${definition.commandCost}`, tone: 'negative' },
        ],
        ongoing: ['매주 작업 진척이 감소하며 완료 시 실제 준비도 수치와 수리 적체에 반영됩니다.', definition.expected],
        nextActions: ['다음 주 결산에서 작업 진척 확인', '같은 분야의 생산라인·조달 경로와 함께 점검'],
        certainty: 'developing',
      },
    );
    notify(`${definition.label} 착수 · ${definition.durationWeeks}주 후 검증`);
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
    notify(`${division.name}에 ${withJosa(equipment.name, '을/를')} 배치했습니다.`);
  };

  const canAuthorizeIndustryCash = roleMandates.economy.mode === 'direct' || roleMandates.governance.mode === 'direct';
  const approvePostwarIndustrySettings = (settings: PostwarIndustrySettings) => {
    if (campaignPhase !== 'nation' || roleMandates.industry.mode !== 'direct') { notify('국정 생산 집행권이 필요합니다.'); return false; }
    if (!canAuthorizeIndustryCash && settings.extraTreasuryAllowance !== postwarIndustrySettings.extraTreasuryAllowance) { notify('추가 국고 집행 한도 변경은 재정 또는 국정 직접권한이 필요합니다.'); return false; }
    const next = normalizePostwarIndustrySettings(settings);
    if (next.policy === postwarIndustrySettings.policy && next.extraTreasuryAllowance === postwarIndustrySettings.extraTreasuryAllowance) return false;
    setPostwarIndustrySettings(next);
    addEvent('국정 군수 가동 방침 승인', `${postwarIndustryPolicyDefinitions[next.policy].label} · 추가 국고 한도 ${formatGameMoney(next.extraTreasuryAllowance)}/주. 다음 주 결산 때 실제 납품과 필요한 비용만 반영합니다.`, 'neutral', game.week, undefined, { nationId: playerNation.id });
    recordSuccessfulRoleAction('industry', `postwar-policy:${game.week}:${next.policy}:${next.extraTreasuryAllowance}`, '국정 군수 가동 방침과 지출 한도 승인');
    notify('가동 방침 승인 · 다음 주 군수 납품에 반영');
    return true;
  };
  const purchaseIndustryMaterial = (material: 'fuel' | 'steel') => {
    const next = purchasePostwarMaterial(game, material, campaignPhase === 'nation' && roleMandates.industry.mode === 'direct' && canAuthorizeIndustryCash);
    if (!next) { notify('직접 집행 권한과 조달 비용을 확인하십시오.'); return; }
    const quote = postwarMaterialQuotes[material];
    setGame(next);
    addEvent('국정 원료 조달 — ' + quote.label, `${withJosa(formatGameMoney(quote.cost), '을/를')} 즉시 지불하고 ${quote.label}를 확보했습니다. 게임 내 고정 조달 견적이며 다음 군수 결산의 원료 한도에 반영됩니다.`, 'neutral', game.week, undefined, { nationId: playerNation.id });
    recordSuccessfulRoleAction('industry', `postwar-material:${material}:${game.week}`, `${quote.label} 조달`);
    notify(`${quote.label} 확보 · 국고 -${formatGameMoney(quote.cost)}`);
  };

  const adjustFactories = (id: string, amount: number) => {
    const next = reallocateFactory(production, game.factories, id, amount, roleMandates.industry.mode === 'direct');
    if (!next) {
      notify(roleMandates.industry.mode !== 'direct' ? '현재 보직에서는 생산 배치의 직접 결재권이 없습니다.' : '공장 여력과 선택한 생산 라인의 배치를 확인하십시오.');
      return;
    }
    setProduction(next);
    const lineName = next.find((line) => line.id === id)?.name ?? id;
    addEvent('생산 역량 전환 — ' + lineName, `${amount < 0 ? '군수 라인에서 공장 1개를 회수해 민수 공급 여력으로 전환했습니다. 해당 라인 효율은 4 감소합니다(최저 15).' : '민수 여력 1개를 군수 라인에 배치했습니다.'} 공급 전망은 즉시 갱신되며, 제${game.week + 2}주 민생 공급 결산에서 사회 반응이 적용됩니다.`, 'neutral', game.week, undefined, { nationId: playerNation.id });
    recordSuccessfulRoleAction('industry', `factory:${id}:${game.week}:${amount}`, `${lineName}의 생산 역량 전환`);
    notify(`${lineName} · ${amount < 0 ? '민수 여력 +1' : '군수 배치 +1'} · 다음 주 민생 결산에서 검증`);
  };

  const assignCommander = (divisionId: string, commanderId: string) => {
    const targetDivision = divisions.find((division) => division.id === divisionId);
    if (!targetDivision || targetDivision.commanderId === commanderId) return;
    if (!commandableDivisionIds.has(divisionId)) {
      notify('상급 지휘부 관할 부대의 인사는 직접 변경할 수 없습니다.');
      return;
    }
    const previousCommanderId = targetDivision.commanderId;
    setDivisions((current) => current.map((division) => {
      if (division.id === divisionId) return { ...division, commanderId };
      if (division.commanderId === commanderId) return { ...division, commanderId: previousCommanderId };
      return division;
    }));
    const commander = careerCommanders.find((item) => item.id === commanderId);
    addEvent('지휘관 인사 발령', `${withJosa(commander?.name ?? '신임 지휘관', '이/가')} ${targetDivision.name} 지휘를 맡았습니다.`, 'neutral', game.week);
    notify('지휘관 배치를 변경했습니다.');
  };

  const trainDivision = (divisionId: string) => {
    const division = divisions.find((item) => item.id === divisionId);
    if (!commandableDivisionIds.has(divisionId)) {
      notify('현재 보직의 예하 부대만 훈련 일정을 직접 지시할 수 있습니다.');
      return;
    }
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
    recordSuccessfulRoleAction('army', `training:${divisionId}`, `${division.name} 야전 훈련 집행`);
    notify(division.name + ' 야전 훈련 완료');
  };

  const selectCommanderSkill = (skillId: CommanderSkillId) => {
    if (!canCommandSelectedDivision) {
      notify('상급 지휘부 관할 지휘관의 성장 방침은 직접 결정할 수 없습니다.');
      return;
    }
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
    if (!canCommandSelectedDivision) {
      notify('상급 지휘부 관할 지휘관에게 직접 휴양 명령을 내릴 수 없습니다.');
      return;
    }
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

  const recognizeBattleAchievement = (reportId: string, input: { battleName?: string; decorationId?: string; citation?: string }) => {
    const report = battleReports.find((candidate) => candidate.id === reportId);
    if (!report) return;
    const recognized = recognizeBattle(report, {
      ...input,
      nationId: playerNation.id,
      year: getCampaignYearForWeek(report.week),
    });
    setBattleReports((current) => current.map((candidate) => candidate.id === reportId ? recognized : candidate));
    const recognition = [recognized.battleName, recognized.decoration?.name].filter(Boolean).join(' · ');
    addEvent(`전공 기록 승인 — ${recognized.commanderName}`, `${withJosa(recognition || recognized.targetName, '을/를')} 전선 공식 기록에 등재했습니다.${recognized.decoration ? ` 공적 사유: ${recognized.decoration.citation}` : ''}`, 'good', game.week);
    notify(`${recognized.commanderName}의 전공 기록을 승인했습니다${recognized.decoration ? ` · ${recognized.decoration.name}` : ''}.`);
  };

  const performCivilianAction = (actionId: string) => {
    if (!career.civilian || career.civilian.enteredOfficeRoleId) {
      notify('현재는 민간 커리어 행동을 실행할 수 없습니다.');
      return;
    }
    const result = resolveCivilianAction(career.civilian, actionId, game.week);
    if (!result) {
      notify('생계 또는 준비 기간 조건을 먼저 충족해야 합니다.');
      return;
    }
    setCareer((current) => ({
      ...current,
      reputation: Math.min(100, current.reputation + Math.max(1, Math.round((result.state.publicReputation - career.civilian!.publicReputation) / 2))),
      experience: Math.min(100, current.experience + 2),
      legacy: Math.min(100, current.legacy + (result.stageChanged ? 3 : 1)),
      civilian: result.state,
    }));
    setGame((current) => applyGameDelta(current, result.gameDelta));
    setCompletedDecisions((current) => [...current, `civilian:${career.civilian!.professionId}:${actionId}:${game.week}`]);
    addEvent(
      `민간 활동 — ${result.record.title}`,
      `${result.record.outcome}${result.stageChanged ? ` 사회적 단계가 ‘${getCivilianStageLabel(result.state.stage)}’로 상승했습니다.` : ''}`,
      result.state.scrutiny >= 70 ? 'bad' : 'good',
      game.week,
      {
        domain: 'history',
        decision: `${getCivilianProfession(result.state.professionId).name}의 경로에서 ‘${result.record.title}’을 실행했습니다.`,
        trigger: `공적 평판 ${result.state.publicReputation} · 전문성 ${result.state.expertise} · 인맥 ${result.state.network} · 생계 ${result.state.livelihood} · 감시 ${result.state.scrutiny}`,
        factors: [
          `출신 배경: ${result.state.originId}`,
          `누적 민간 활동: ${result.state.actionHistory.length}회`,
          `역사 압력: ${result.influence.force} +${result.influence.strength}`,
        ],
        effects: [
          { label: '민간 커리어', value: `${result.record.title} · ${getCivilianStageLabel(result.state.stage)}`, tone: 'positive' },
          { label: '가능세계 영향', value: `${result.influence.force} +${result.influence.strength}`, tone: 'neutral' },
          { label: '노출 위험', value: `감시 ${result.state.scrutiny}`, tone: result.state.scrutiny >= 70 ? 'negative' : 'neutral' },
        ],
        ongoing: ['이 행동은 세계선 원인 기록에 남고 이후 사건·인물·제도권 제안의 조건에 누적됩니다.'],
        nextActions: ['생계와 감시 위험을 확인한 뒤 다음 민간 행동 또는 제도권 진입 조건을 선택하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${result.record.title} 완료 · 다음 세계선 계산에 반영됩니다.`);
  };

  const enterCivilianRole = (roleId: string) => {
    if (!career.civilian || career.civilian.enteredOfficeRoleId) return;
    const readiness = getCivilianInstitutionReadiness(career.civilian);
    const targetRole = careerRoles.find((role) => role.id === roleId && role.nationId === career.nationId && role.tier === 5 && readiness.branches.includes(role.branch));
    if (!readiness.ready || !targetRole) {
      notify('제도권 진입 조건을 모두 충족해야 합니다.');
      return;
    }
    const nextCivilian = enterCivilianInstitution(career.civilian, targetRole.id);
    setCareer((current) => ({
      ...current,
      roleId: targetRole.id,
      reputation: Math.max(current.reputation, 38),
      councilTrust: Math.max(current.councilTrust, 46),
      experience: Math.max(current.experience, 18),
      replacedPersonId: '',
      civilian: nextCivilian,
    }));
    setSetupRoleId(targetRole.id);
    const institutionalStaff = createStaffRoster(playerNation.id, targetRole.id);
    setStaff(institutionalStaff);
    setStaffNarrative(createStaffNarrativeState(institutionalStaff, game.week));
    setStaffCandidates([
      ...createStaffCandidates(playerNation.id, targetRole.id),
      ...createEmergentIntelligenceCandidates(playerNation.id, currentYear, worldline.timeline),
    ]);
    setCommanderDevelopment(createCommanderDevelopment(createCareerCommanders(playerNation, targetRole)));
    setRoleCommand(createRoleCommandState(targetRole, game.week));
    setCompletedDecisions((current) => [...current, `civilian-entry:${targetRole.id}:${game.week}`]);
    addEvent(
      `제도권 진입 — ${targetRole.title}`,
      `민간에서 쌓은 전문성·평판·관계망을 유지한 채 ${targetRole.title} 제안을 수락했습니다. 특정 실존 인물을 밀어낸 것이 아니라 조직이 사용자를 위한 새 자리를 만들었습니다.`,
      'good',
      game.week,
      {
        domain: 'history',
        decision: `${getCivilianProfession(career.civilian.professionId).name}에서 ${withJosa(targetRole.title, '으로/로')} 진입했습니다.`,
        trigger: `진입 준비도 ${readiness.score} · 민간 활동 ${career.civilian.actionHistory.length}회`,
        factors: readiness.requirements.map((requirement) => `${requirement.label}: 충족`),
        effects: [
          { label: '공식 보직', value: targetRole.title, tone: 'positive' },
          { label: '권한', value: `${targetRole.authority} · TIER ${targetRole.tier}`, tone: 'positive' },
          { label: '민간 유산', value: `${career.civilian.worldInfluences.length}개 세계선 원인 유지`, tone: 'neutral' },
        ],
        ongoing: ['이제 참모 스쿼드·후보 시장·보직 이동이 열리지만 민간 경력에서 만든 관계와 위험은 계속 남습니다.'],
        nextActions: ['상황실에서 새 보직의 권한을 확인하고 조직 운영에서 첫 참모 배치를 결정하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${targetRole.title} 제안을 수락했습니다. 기존 보직 커리어 흐름이 열렸습니다.`);
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
    setSelectedFrontDetailId(null);
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
    setSelectedFrontDetailId(null);
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

  const stopFieldOperation = (orderId: string) => {
    if (roleMandates.army.mode !== 'direct') { notify('현재 보직에는 공세 중단 권한이 없습니다.'); return; }
    const lockId = `stop:${playerNation.id}:${orderId}`;
    if (commandSubmissionLocksRef.current.has(lockId)) return;
    const result = requestLandOperationStop(orders, orderId, { week: game.week, phase: campaignPhase, commandableDivisionIds, processingWeek: periodAdvanceRemaining > 0 });
    if (!result.applied) { notify(result.reason); return; }
    commandSubmissionLocksRef.current.add(lockId);
    setOrders(result.orders);
    setSelectedFieldOrderId(orderId);
    addEvent('공세 중단 요청 접수', result.reason + ' 이전 교전 결과는 유지하며 승인 비용은 반환하지 않습니다.', 'neutral', game.week, undefined, { nationId: playerNation.id });
    notify('중단 요청을 접수했습니다. 다음 주 교전 전에 처리합니다.');
  };

  const approveStaffDeliveryPledge = (command: StaffDeliveryPledgeCommand) => {
    const result = createStaffDeliveryPledge(staffDeliveryPledgesRef.current, command, staffDeliveryContext);
    if (!result.applied) { notify(result.reason); return false; }
    staffDeliveryPledgesRef.current = result.state;
    setStaffDeliveryPledges(result.state);
    notify(result.reason);
    return true;
  };

  const configureRegionalLogistics = (configuration: RegionalIndustryConfiguration) => {
    const result = configureRegionalIndustry(regionalIndustryRef.current, configuration, regionalIndustryContext);
    notify(result.reason);
    if (!result.applied) return false;
    regionalIndustryRef.current = result.state;
    setRegionalIndustry(result.state);
    addEvent('지역 물류 구성 승인', result.reason, 'neutral', game.week, undefined, { nationId: playerNation.id });
    return true;
  };
  const reserveRegionalShipment = (quantity: number) => {
    const result = planRegionalShipment(regionalIndustryRef.current, { id: `shipment:${crypto.randomUUID()}`, quantity }, regionalIndustryContext);
    notify(result.reason);
    if (!result.applied) return false;
    regionalIndustryRef.current = result.state;
    setRegionalIndustry(result.state);
    addEvent('지역 수송 예약', result.reason + ' 예약량은 집하창고에서 이동하며 국가 가용 비축은 도착 때 증가합니다.', 'neutral', game.week, undefined, { nationId: playerNation.id });
    return true;
  };
  const cancelRegionalShipment = (shipmentId: string) => {
    const result = cancelRegionalReservedShipment(regionalIndustryRef.current, shipmentId, regionalIndustryContext);
    notify(result.reason);
    if (!result.applied) return false;
    regionalIndustryRef.current = result.state;
    setRegionalIndustry(result.state);
    addEvent('지역 수송 예약 취소', result.reason, 'neutral', game.week, undefined, { nationId: playerNation.id });
    return true;
  };

  const resolveStaffStoryline = (storylineId: string, optionId: string) => {
    const storyline = staffNarrative.activeStorylines.find((story) => story.id === storylineId);
    const decisionId = `${playerNation.id}:${storylineId}`;
    if (!storyline || staffDecisionLocksRef.current.has(decisionId)) return false;
    const option = getStaffNarrativeOptions(storyline).find((candidate) => candidate.id === optionId);
    if (!option) return false;
    const involved = [storyline.firstStaffId, storyline.secondStaffId].filter(Boolean) as string[];
    const canIntervene = staff.some((member) => involved.includes(member.id) && staffAuthority.managedDepartments.includes(member.department));
    if (!canIntervene || roleMandates.organization.mode !== 'direct') {
      notify('이 현안은 현재 직함의 직접 인사권 밖입니다. 상급기관의 결정을 기다려야 합니다.');
      return false;
    }
    if (game.politicalPower < option.cost) {
      notify(`이 대응에는 정치력 ${option.cost}가 필요합니다.`);
      return false;
    }
    const result = resolveStaffNarrativeDecision(staffNarrative, staff, storylineId, optionId, game.week);
    if (!result) return false;
    staffDecisionLocksRef.current.add(decisionId);
    setStaff(result.staff);
    setStaffNarrative(result.state);
    setGame((current) => applyGameDelta(current, result.gameDelta));
    recordSuccessfulRoleAction('organization', `staff-story:${storylineId}`, result.event.title);
    addEvent(result.event.title, result.event.detail, result.event.tone, game.week, {
      domain: 'management',
      decision: result.event.decision,
      trigger: result.event.trigger,
      factors: result.event.factors,
      effects: result.event.effects,
      ongoing: result.event.ongoing,
      nextActions: result.event.nextActions,
      certainty: result.event.certainty,
    });
    notify(`${option.label} 결정 완료 · 제${game.week + option.verifyAfterWeeks + 1}주 후속 검증`);
    return true;
  };

  const meetStaff = (staffId: string, topic: StaffMeetingTopic) => {
    const member = staff.find((item) => item.id === staffId);
    if (member && !staffAuthority.managedDepartments.includes(member.department)) {
      notify(`${withJosa(getStaffSeatTitle(member.department, campaignPhase, playerNation.status), '은/는')} 현재 직함의 면담·평가 권한 밖입니다.`);
      return;
    }
    if (!member) return;
    const option = getStaffMeetingOption(topic);
    if (member.lastMeetingWeek === game.week) {
      notify(`${withJosa(member.name, '과/와')} 이번 주에 이미 면담했습니다.`);
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
    notify(result.success ? `${withJosa(member.name, '과/와')}의 ${option.label} 면담이 성과를 냈습니다.` : `${withJosa(member.name, '이/가')} 요구를 받아들이지 않았습니다.`);
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
    notify(developmentFocusId === staffId ? '집중 육성 지정을 해제했습니다.' : `${withJosa(member.name, '을/를')} 집중 육성합니다.`);
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
    notify(`${withJosa(member.name, '이/가')} 등급 ${member.grade + 1}로 승급했습니다.`);
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
      `${withJosa(member.name, '을/를')} ${sourceTitle}에서 ${withJosa(targetTitle, '으로/로')} 배치하고 ${withJosa(targetMember.name, '을/를')} 반대 보직으로 이동했습니다. 두 보직의 기존 위임은 안전하게 회수됐습니다.`,
      suitability.score >= 68 ? 'good' : 'neutral',
      game.week,
      {
        domain: 'management',
        decision: `${withJosa(member.name, '을/를')} ${targetTitle}에 배치했습니다.`,
        trigger: `${targetTitle}의 현재 보직 적합도와 참모진 뎁스를 재검토했습니다.`,
        factors: suitability.reasons,
        effects: [{ label: '보직 적합도', value: `${suitability.score} · ${suitability.label}`, tone: suitability.score >= 68 ? 'positive' : 'neutral' }, { label: '책임 위임', value: '두 보직 모두 직접 결재로 전환', tone: 'neutral' }],
        ongoing: ['새 부서 기준으로 참모 보너스와 주간 업무가 계산됩니다.', `${withJosa(targetMember.name, '은/는')} ${sourceTitle}에서 계속 참모진에 남습니다.`],
        nextActions: ['책임 위임 탭에서 새 배치의 결재 범위를 설정하십시오.', '참모 명단에서 충성도·업무량·육성 계획을 검토하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${member.name} → ${targetTitle} 배치 완료 · 적합도 ${suitability.score}`);
    recordSuccessfulRoleAction('organization', `staff-assignment:${staffId}:${department}`, `${member.name} ${targetTitle} 배치`);
  };

  const commitPersonnelAction = (action: PersonnelAction): PersonnelActionResult | null => {
    const context = { game, role: displayedCareerRole, reputation: career.reputation, staff, candidates: staffCandidates, busy: periodAdvanceRemaining > 0 };
    const assessment = assessPersonnelAction(context, action);
    if (!assessment.allowed) {
      notify(assessment.reason);
      return null;
    }
    const review = createPersonnelReview(context, action);
    if (!review) return null;
    const approval = confirmPersonnelReview(review, context, (result) => {
      setGame((current) => ({
        ...current,
        politicalPower: Math.max(0, current.politicalPower + result.gameDelta.politicalPower),
        treasury: Math.max(0, current.treasury + result.gameDelta.treasury),
      }));
      setStaff(result.staff);
      setStaffCandidates(result.candidates);
      return true;
    }, personnelCommandGateRef.current);
    if (!approval.ok) {
      notify(approval.reason);
      return null;
    }
    return assessment.result;
  };

  const scoutCandidate = (candidateId: string) => {
    const result = commitPersonnelAction({ kind: 'scout', candidateId });
    if (!result) return false;
    completeOnboardingMilestone('intelligence-action');
    addEvent('인재 조사 — ' + result.candidate.name, result.summary.join(' '), 'neutral', game.week);
    notify(result.updatedCandidate?.knowledge === 100 ? result.candidate.name + ' 조사 완료 · 슬롯 반환' : result.candidate.name + ' 정밀 조사 착수 · 이후 매주 자동 갱신');
    return true;
  };

  const stopCandidateScouting = (candidateId: string) => {
    const result = commitPersonnelAction({ kind: 'stop-scout', candidateId });
    if (!result) return false;
    addEvent('인재 조사 중단 — ' + result.candidate.name, result.summary.join(' '), 'neutral', game.week);
    notify(result.candidate.name + ' 조사 중단 · 확보한 정보와 관심 명단 유지');
    return true;
  };

  const toggleCandidateShortlist = (candidateId: string) => {
    const result = commitPersonnelAction({ kind: 'shortlist', candidateId });
    if (!result) return false;
    completeOnboardingMilestone('intelligence-action');
    notify(result.candidate.name + ' · ' + result.summary[0]);
    return true;
  };

  const approachCandidate = (candidateId: string) => {
    const result = commitPersonnelAction({ kind: 'approach', candidateId });
    if (!result) return false;
    addEvent('비밀 접촉 — ' + result.candidate.name, result.summary.join(' '), 'neutral', game.week);
    notify(result.candidate.name + ' 접촉 완료 · 정치력 4 사용 · 다음 접촉은 다음 주');
    return true;
  };

  const recruitCandidate = (candidateId: string, offer: RecruitmentOffer) => {
    const result = commitPersonnelAction({ kind: 'recruit', candidateId, offer });
    if (!result?.recruitment) return false;
    const candidate = result.candidate;
    const { assessment, success, incumbent, weeklyPayrollBefore, weeklyPayrollAfter } = result.recruitment;
    if (!success) {
      addEvent(
        '영입 협상 결렬 — ' + candidate.name,
        '정치력 3을 사용했고 계약금은 지출하지 않았습니다. 현직 참모는 유지되며, 후보의 다음 요구 기본 계약금이 올랐습니다.',
        'bad',
        game.week,
        {
          domain: 'management',
          decision: candidate.name + '에게 조건부 임명 제안을 보냈습니다.',
          trigger: candidate.role + ' 보직의 외부 영입 협상을 시작했습니다.',
          factors: assessment.factors.map((factor) => factor.label + ' ' + (factor.points > 0 ? '+' : '') + factor.points),
          effects: [
            { label: '협상 결과', value: '설득 ' + assessment.score + '/' + assessment.threshold + ' · 결렬', tone: 'negative' },
            { label: '실제 비용', value: '정치력 −3 · 계약금 지출 없음', tone: 'negative' },
            { label: '다음 요구 기본 계약금', value: formatGameMoney(candidate.signingCost + 12), tone: 'negative' },
          ],
          ongoing: ['관계와 관심도는 일부 남지만 경쟁 기관의 압력이 높아집니다.', '현직 참모와 전체 주간 인건비는 변경되지 않았습니다.'],
          nextActions: ['협상 작업대에서 권한·임기·보수의 설득 점수를 비교하십시오.', '비밀 접촉으로 관계를 쌓은 뒤 최신 조건을 다시 검토할 수 있습니다.'],
          certainty: 'confirmed',
        },
      );
      notify('협상 결렬 · 설득 ' + assessment.score + '/' + assessment.threshold + ' · 정치력 3 사용, 계약금 미지출');
      return true;
    }
    if (developmentFocusId === incumbent.id) setDevelopmentFocusId(null);
    addEvent(
      '신임 참모 영입 — ' + candidate.name,
      withJosa(incumbent.name, '을/를') + ' 대신해 ' + candidate.role + ' 직무를 맡습니다. ' + offer.termWeeks + '주 임기, 주급 ' + formatGameMoney(assessment.weeklyCost) + ', 계약금 ' + formatGameMoney(assessment.signingCost) + ' 조건입니다.',
      'good',
      game.week,
      {
        domain: 'management',
        decision: withJosa(candidate.name, '을/를') + ' ' + withJosa(candidate.role, '으로/로') + ' 임명했습니다.',
        trigger: getStaffSeatTitle(candidate.department, campaignPhase, playerNation.status) + '의 현직자와 외부 후보를 비교해 정식 협상을 진행했습니다.',
        factors: assessment.factors.map((factor) => factor.label + ' ' + (factor.points > 0 ? '+' : '') + factor.points),
        effects: [
          { label: '설득 결과', value: assessment.score + '/' + assessment.threshold + ' · 합의', tone: 'positive' },
          { label: '계약', value: offer.termWeeks + '주 · 주급 ' + formatGameMoney(assessment.weeklyCost), tone: 'neutral' },
          { label: '실제 비용', value: '정치력 −6 · 계약금 ' + formatGameMoney(-assessment.signingCost, { signed: true }), tone: 'negative' },
          { label: '전체 주간 인건비', value: formatGameMoney(weeklyPayrollBefore) + ' → ' + formatGameMoney(weeklyPayrollAfter), tone: 'neutral' },
        ],
        ongoing: [
          withJosa(incumbent.name, '은/는') + ' 전임자 후보로 시장에 남습니다. 책임 위임과 집중 육성 대상은 새 인물에게 자동 승계하지 않습니다.',
          '약속한 보직은 ' + getStaffSeatTitle(candidate.department, campaignPhase, playerNation.status) + '입니다. 다른 부서로 옮기면 역할 만족도가 하락합니다.',
          offer.promise === 'none' ? '추가 보직 약속은 없습니다.' : '협상에서 한 약속은 계약 기간 동안 사기와 충성도 계산에 남습니다.',
        ],
        nextActions: ['참모 스쿼드에서 새 참모의 사기와 역할 만족도를 확인하십시오.', '책임 위임과 집중 육성 대상을 새 인물 기준으로 다시 선택하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(candidate.name + ' 영입 타결 · ' + offer.termWeeks + '주 · 주급 ' + formatGameMoney(assessment.weeklyCost));
    recordSuccessfulRoleAction('organization', 'recruit:' + candidateId, candidate.name + ' 영입 계약 체결');
    return true;
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
        decision: `${withJosa(member.name, '과/와')} 2년 재계약을 체결했습니다.`,
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
    notify(`${withJosa(division?.name ?? '편제', '을/를')} 핵심 편제로 지정했습니다.`);
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
        decision: `${policy.domain} 영역의 운영 원칙을 ${withJosa(policy.title, '으로/로')} ${isSwitch ? '전환' : '채택'}했습니다.`,
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

  const selectNationalProgram = (programId: string) => {
    const program = playerNation.paths.find((path) => path.id === programId);
    if (!program || career.alternatePathId === program.id) return;
    const previous = getNationalProgram(playerNation, career.alternatePathId);
    const politicalCost = previous ? 14 : 8;
    if (game.politicalPower < politicalCost) {
      notify(`국가 프로그램 ${previous ? '전환' : '채택'}에는 정치력 ${politicalCost}가 필요합니다.`);
      return;
    }
    const immediateDelta: Partial<Record<keyof GameState, number>> = program.tone === 'reform'
      ? { politicalPower: -politicalCost, stability: 2 }
      : program.tone === 'hardline'
        ? { politicalPower: -politicalCost, commandPoints: 5, stability: -1 }
        : { politicalPower: -politicalCost, intelNetwork: 3 };
    setCareer((current) => ({ ...current, alternatePathId: program.id }));
    setGame((current) => applyGameDelta(current, immediateDelta));
    if (program.tone === 'international') {
      setRelations((current) => current.map((relation) => ({
        ...relation,
        value: Math.min(100, relation.value + 2),
      })));
    }
    setCompletedDecisions((current) => Array.from(new Set([
      ...current,
      getNationalProgramStartMarker(program.id, game.week),
      ...(previous ? [`national-program:${previous.id}:ended:${game.week}`] : []),
    ])));
    addEvent(
      `${previous ? '국가 프로그램 전환' : '국가 프로그램 채택'} — ${program.title}`,
      `${previous ? `${previous.title}의 누적 성과를 역사 기록에 남기고 새 노선으로 전환했습니다. ` : ''}${program.summary} ${nationalProgramToneMeta[program.tone].tradeoff}`,
      previous ? 'neutral' : 'good',
      game.week,
      {
        domain: 'management',
        decision: `${playerNation.shortName}의 26주 장기 의제로 ${withJosa(program.title, '을/를')} ${previous ? '새로 선택' : '채택'}했습니다.`,
        trigger: previous ? `기존 ${previous.title} 노선을 중단하고 정치력 ${politicalCost}를 사용했습니다.` : `국가 장기 노선이 비어 있어 정치력 ${politicalCost}를 사용했습니다.`,
        factors: [program.summary, program.effect, nationalProgramToneMeta[program.tone].cadence],
        effects: Object.entries(immediateDelta).map(([key, value]) => ({
          label: key,
          value: `${Number(value) >= 0 ? '+' : ''}${value}`,
          tone: Number(value) >= 0 ? 'positive' : 'negative',
        })),
        ongoing: ['6·13·26주에 단계별 검증과 보상이 발생합니다.', nationalProgramToneMeta[program.tone].tradeoff],
        nextActions: ['지휘 본부의 국가 프로그램 카드에서 다음 검토 시점과 누적 진척을 확인하십시오.'],
        certainty: 'confirmed',
      },
    );
    notify(`${program.title} 국가 프로그램을 시작했습니다.`);
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
      const assignedDivision = divisions.find((division) => division.commanderId === commanderRecord?.commanderId && commandableDivisionIds.has(division.id));
      if (assignedDivision) {
        setSelectedDivisionId(assignedDivision.id);
        setSelectedTerritoryId(assignedDivision.territoryId);
      }
    }
    if (action.id === 'idle-formations') {
      const readyDivision = divisions.find((division) => division.status === 'ready' && commandableDivisionIds.has(division.id));
      if (readyDivision) {
        setSelectedDivisionId(readyDivision.id);
        setSelectedTerritoryId(readyDivision.territoryId);
      }
    }
    setCompletedTrackedAction(null);
    setTrackedActionSnapshot(action);
    setTrackedActionId(action.id);
    deckScrollPositionsRef.current[action.tab] = 0;
    setRoleCommand((current) => recordRoleInteraction(current, action.tab === 'command' ? 'briefing' : roleMandates[action.tab].mode === 'direct' ? 'direct' : 'briefing', action.tab));
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
    setUXPreferences((current) => {
      const enabled = !current[key];
      if (key === 'soundOn' && enabled) playGameAudioCue('confirm', true);
      return { ...current, [key]: enabled };
    });
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
    setJournalView('history');
    setShowJournal(true);
  }, [game.week]);

  const openWeeklyBriefing = useCallback(() => {
    setSpeed(0);
    setJournalView('briefing');
    setShowJournal(true);
  }, []);

  const acknowledgeWeeklyBriefing = useCallback(() => {
    setSpeed(0);
    setLastReviewedJournalWeek(game.week);
    if (latestWorldWeeklyIssue) setLastReadWorldWeeklyId(latestWorldWeeklyIssue.id);
    setShowJournal(false);
    notify(`제 ${game.week + 1}주 통합 브리핑을 확인했습니다.`);
  }, [game.week, latestWorldWeeklyIssue, notify]);

  const continueWeeklyFlow = useCallback(() => {
    setSpeed(0);
    if (campaignPhase === 'nation' && periodAdvanceRemaining > 0) {
      setShowTimeCommandCenter(true);
      return;
    }
    if (hasClandestineIncident) {
      setPendingCareerOfferId(null);
      setPendingClandestineMissionId(null);
      setCareerMarketInitialView('clandestine');
      setShowCareerMarket(true);
      return;
    }
    if (campaignPhase === 'nation' || globalWeeklyCycle.primaryDestination === 'advance') {
      advanceWeek();
      return;
    }
    if (globalWeeklyCycle.primaryDestination === 'briefing') {
      openWeeklyBriefing();
      return;
    }
    setShowActionCenter(true);
  }, [openWeeklyBriefing, advanceWeek, campaignPhase, globalWeeklyCycle.primaryDestination, hasClandestineIncident, periodAdvanceRemaining]);

  const globalNextLabel = hasClandestineIncident
    ? '비밀 위기'
    : campaignPhase === 'nation'
    ? periodAdvanceRemaining > 0 ? '위임 중' : '다음 주'
    : globalWeeklyCycle.primaryDestination === 'briefing'
      ? '브리핑'
      : globalWeeklyCycle.primaryDestination === 'journal'
        ? '결산'
        : globalWeeklyCycle.primaryDestination === 'weekly'
          ? '주보'
        : globalWeeklyCycle.primaryDestination === 'actions'
          ? '결재'
          : '다음 주';
  const globalNextAriaLabel = hasClandestineIncident
    ? '긴급 비밀 신분 위기 대응'
    : campaignPhase === 'nation'
      ? periodAdvanceRemaining > 0 ? `지휘 위임 진행 상황, ${periodAdvanceRemaining}주 남음` : '다음 주 진행'
      : globalWeeklyCycle.primaryLabel;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!showBriefing && !campaignOutcome && !pendingWorldFlashpointId && !pendingCoupIncident && !pendingCouncilEventId && !pendingBattleReportId && !pendingOffensivePlan && !pendingAchievementId && !showJournal && !showSettings && !showActionCenter && !showStatusOverview && !showResetConfirmation && !showFieldManual && !showCommandPalette && !showAchievementGallery && !showWorldHistory && !showWorldWeekly && !showTutorial && !showPoliticalCrisis && !showTimeCommandCenter) {
          setShowSaveCenter((current) => !current);
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (!showBriefing && !campaignOutcome && !pendingWorldFlashpointId && !pendingCoupIncident && !pendingCouncilEventId && !pendingBattleReportId && !pendingOffensivePlan && !pendingAchievementId && !showJournal && !showSettings && !showActionCenter && !showStatusOverview && !showResetConfirmation && !showFieldManual && !showSaveCenter && !showAchievementGallery && !showWorldHistory && !showWorldWeekly && !showTutorial && !showPoliticalCrisis && !showTimeCommandCenter) {
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
        setShowCareerMarket(false);
        setPendingCareerOfferId(null);
        setPendingClandestineMissionId(null);
        setCareerMarketInitialView(undefined);
        if (!pendingCoupIncident) setShowPoliticalCrisis(false);
        setPendingAchievementId(null);
        setShowJournal(false);
        setPlanningMode(false);
        setPendingOffensivePlan(null);
        setMapFiltersOpen(false);
        setMapLegendOpen(false);
        setMapFocusMode(false);
        setShowTimeCommandCenter(false);
        if (window.matchMedia('(max-width: 900px)').matches) setNavigationCollapsed(true);
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (target?.isContentEditable || tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (showBriefing || campaignOutcome || pendingWorldFlashpointId || pendingCoupIncident || pendingCouncilEventId || pendingBattleReportId || pendingOffensivePlan || pendingAchievementId || showJournal || showSettings || showActionCenter || showStatusOverview || showResetConfirmation || showCommandPalette || showFieldManual || showSaveCenter || showAchievementGallery || showWorldHistory || showWorldWeekly || showCareerMarket || showTutorial || showPoliticalCrisis || showTimeCommandCenter || event.repeat) return;
      if (activeTab === 'map' && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        zoomMap(0.2);
      } else if (activeTab === 'map' && event.key === '-') {
        event.preventDefault();
        zoomMap(-0.2);
      } else if (activeTab === 'map' && event.key === '0') {
        event.preventDefault();
        resetMapCamera();
      } else if (activeTab === 'map' && ['1', '2', '3', '4', '5'].includes(event.key)) {
        event.preventDefault();
        const layers: MapLayer[] = ['political', 'supply', 'weather', 'intelligence', 'history'];
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
        if (campaignPhase === 'nation') setShowTimeCommandCenter(true);
        else setSpeed((current) => current === 0 ? 1 : 0);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [activeTab, advanceWeek, campaignOutcome, campaignPhase, continueWeeklyFlow, pendingAchievementId, pendingBattleReportId, pendingCouncilEventId, pendingCoupIncident, pendingOffensivePlan, pendingWorldFlashpointId, resetMapCamera, showActionCenter, showAchievementGallery, showBriefing, showCareerMarket, showCommandPalette, showFieldManual, showJournal, showPoliticalCrisis, showResetConfirmation, showSaveCenter, showSettings, showStatusOverview, showTimeCommandCenter, showTutorial, showWorldHistory, showWorldWeekly, toggleMapFocusMode, zoomMap]);

  const changePublicHealthPolicy = (policyId: PublicHealthPolicyId) => {
    if (publicHealth.policyId === policyId) return;
    setPublicHealth((current) => ({ ...current, policyId }));
    recordSuccessfulRoleAction('health', `health-policy:${policyId}`, '국가 보건 대응 태세 변경');
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
    recordSuccessfulRoleAction('health', `health-investment:${investmentId}`, `${investment.name} 사업 집행`);
    notify(`${investment.name} 사업을 승인했습니다.`);
  };

  const changeTaxPolicy = (policy: TaxPolicyId) => {
    if (economy.taxPolicy === policy) return;
    if (game.politicalPower < 2) return notify('조세정책 변경에는 정치력 2가 필요합니다.');
    setEconomy((current) => ({ ...current, taxPolicy: policy }));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 2 }));
    addEvent('조세정책 변경', '새 조세정책이 다음 주 소득세·기업세와 사회 안정도 계산부터 적용됩니다.', 'neutral', game.week);
    recordSuccessfulRoleAction('economy', `tax:${policy}`, '조세정책 변경 승인');
  };

  const changeBondProgram = (program: BondProgramId) => {
    if (economy.bondProgram === program) return;
    if (game.politicalPower < 2) return notify('국채 조달방식 변경에는 정치력 2가 필요합니다.');
    setEconomy((current) => ({ ...current, bondProgram: program }));
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - 2 }));
    addEvent('전쟁금융 조달방식 변경', '새 국채·중앙은행 조달방식이 다음 주 현금, 부채, 이자, 물가에 함께 반영됩니다.', program === 'central-bank' ? 'bad' : 'neutral', game.week);
    recordSuccessfulRoleAction('economy', `bond:${program}`, '국채 조달방식 변경 승인');
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
    addEvent(`신 통화 발행 — ${created.name}`, `${withJosa(playerNation.shortName, '이/가')} ${created.symbol} ${withJosa(created.name, '을/를')} 법정통화로 선포했습니다. 역사 자동전환은 중지되며 물가·신뢰·외환보유고가 태환조건을 결정합니다.`, 'neutral', game.week, {
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
    notify(`${currentYear}년 역사 기본통화 ${withJosa(currency?.name ?? nextSystem.activeCurrencyId, '으로/로')} 복귀했습니다.`);
  };

  const tabItems: { id: GameTab; label: string; description: string; navHint: string; group: string; guide: [string, string, string]; icon: GameIconName }[] = [
    { id: 'command', label: civilianCareerActive ? '시민 활동실' : isKoreaWarCampaign ? '독립운동 상황실' : campaignPhase === 'nation' ? '국정 상황실' : '지휘 본부', navHint: civilianCareerActive ? '직업·인맥·공적 활동' : isKoreaWarCampaign ? '승인·공작·광복군' : '이번 주 우선순위', group: civilianCareerActive ? '민간 커리어' : '최고 지휘부', description: civilianCareerActive ? '평판·전문성·인맥·생계·감시를 관리하고 이번 주 민간 행동과 제도권 진입 경로를 선택합니다.' : isKoreaWarCampaign ? '충칭 지휘부에서 승인 외교·국내 공작망·광복군·귀환 준비를 한 화면에 파악합니다.' : campaignPhase === 'nation' ? '국민·재정·보건·외교의 긴급 업무를 한 화면에서 파악합니다.' : '결재 업무·전황·조직·생산·연구를 한 화면에서 파악합니다.', guide: civilianCareerActive ? ['세계 주보 읽기', '민간 행동 선택', '다음 주 진행'] : isKoreaWarCampaign ? ['네 축의 준비도 확인', '보직 권한 안에서 결재', '해방 시간선 진행'] : ['경고 확인', '권장 행동 결재', '다음 주 진행'], icon: 'command' },
    { id: 'governance', label: isKoreaWarCampaign ? '해방·건국 설계' : campaignPhase === 'nation' ? '국가 운영' : '전후 설계', navHint: isKoreaWarCampaign ? '헌정·통합·국가 전환' : campaignPhase === 'nation' ? '예산·민생·선거' : '종전과 국가 전환', group: '최고 지휘부', description: isKoreaWarCampaign ? '해방 뒤 정부 형태, 헌정 질서, 행정 인력과 무장 세력 통합 방식을 준비합니다.' : campaignPhase === 'nation' ? '예산·민생·산업·제도·국민 위임을 주간 단위로 운영합니다.' : '전쟁에서 국가 운영으로 이어질 종전 방식과 전후 초기 조건을 준비합니다.', guide: isKoreaWarCampaign ? ['귀환 준비도 확인', '헌정·통합안 비교', '해방 이후 경로 선택'] : campaignPhase === 'nation' ? ['국가 지표 확인', '예산·노선 조정', '국정 1주 진행'] : ['전환 준비도 확인', '전후 위험 비교', '종전 경로 선택'], icon: 'organization' },
    { id: 'map', label: isKoreaWarCampaign ? '한반도 작전도' : campaignPhase === 'nation' ? '세계·국경 지도' : '전황 지도', navHint: isKoreaWarCampaign ? '점령 본토·국내정진' : campaignPhase === 'nation' ? '국경과 국제 질서' : '전선과 작전 계획', group: '최고 지휘부', description: isKoreaWarCampaign ? '조선 본토의 점령 상태와 만주 연락선, 중국 거점, 국내정진 경로를 구분해 검토합니다.' : campaignPhase === 'nation' ? '종전 이후 국경·교역·안보 관계와 세계선의 변화를 검토합니다.' : '전선·보급·기상·정보를 지도에서 검토하고 공세 목표를 지정합니다.', guide: isKoreaWarCampaign ? ['한반도 지역 선택', '점령·연락망 확인', '국내정진 목표 지정'] : campaignPhase === 'nation' ? ['세계선 선택', '국경·거점 확인', '외교·안보 검토'] : ['지도층 선택', '부대·거점 확인', '공세 목표 지정'], icon: 'map' },
    { id: 'organization', label: isKoreaWarCampaign ? '독립운동 조직' : '조직 운영', navHint: isKoreaWarCampaign ? '임정·광복군·공작망' : '참모·영입·편제', group: '국가 운영', description: isKoreaWarCampaign ? '임시정부·한국광복군·국내외 공작망의 인재와 지휘선을 보직 권한에 맞춰 관리합니다.' : '참모진·영입·편제·조달·국가 원칙을 관리합니다.', guide: isKoreaWarCampaign ? ['조직별 지휘선 확인', '인재 조사·접촉', '보직과 권한 배정'] : ['조직 병목 확인', '인재 비교·영입', '보직과 권한 배정'], icon: 'organization' },
    { id: 'economy', label: isKoreaWarCampaign ? '독립운동 재정' : campaignPhase === 'nation' ? '재정·경제부' : '전시 재무성', navHint: isKoreaWarCampaign ? '기금·조달·외환' : '세금·국채·기업지분', group: '국가 운영', description: isKoreaWarCampaign ? '독립운동 기금, 중국·연합군 조달, 외환과 분산 생산망의 주간 흐름을 관리합니다.' : '주간·월간 세입과 지출, 국가부채, 물가, 역사적 산업지분을 운용합니다.', guide: isKoreaWarCampaign ? ['기금 수입·지출 확인', '조달·외환 결정', '지원망 위험 검토'] : ['경상수지와 차입 분리 확인', '조세·국채·가격통제 결정', '기업 위험과 지분 배분'], icon: 'treasury' },
    { id: 'diplomacy', label: isKoreaWarCampaign ? '독립 승인 외교' : '외교', navHint: isKoreaWarCampaign ? '중국·연합국 승인' : '관계와 전후 질서', group: '국가 운영', description: isKoreaWarCampaign ? '중국과 연합국의 지원·승인·전후 발언권을 확보하고 독립의 외교적 근거를 만듭니다.' : '국가 관계와 영향력을 관리해 전후 질서를 설계합니다.', guide: isKoreaWarCampaign ? ['승인 현황 확인', '외교 상대·의제 선택', '전후 발언권 검토'] : ['관계도 확인', '외교 의제 선택', '파급 효과 검토'], icon: 'diplomacy' },
    { id: 'intelligence', label: isKoreaWarCampaign ? '국내 공작망' : '정보국', navHint: isKoreaWarCampaign ? '침투·연락·방첩' : '첩보망·비밀 작전', group: '국가 운영', description: isKoreaWarCampaign ? '조선·만주의 연락망, 침투 거점, 선전·구출·파괴 공작과 방첩을 지휘합니다.' : '전구별 첩보망과 비밀 작전, 암호 해독을 지휘합니다.', guide: isKoreaWarCampaign ? ['연락망 신뢰도 확인', '요원·침투 경로 선택', '노출 위험 승인'] : ['정보 신뢰도 확인', '요원·표적 선택', '노출 위험 승인'], icon: 'intelligence' },
    { id: 'health', label: '보건 위기', navHint: '감시·유행·의료 대응', group: '국가 운영', description: '발병 위험을 감시하고 격리·병상·연구·사회 대응을 주간 단위로 지휘합니다.', guide: ['발병 위험·유행 단계 확인', '대응 태세 비교', '영구 역량 사업 승인'], icon: 'health' },
    { id: 'army', label: isKoreaWarCampaign ? '광복군·합동대' : campaignPhase === 'nation' ? '국방·동원' : '합동군', navHint: isKoreaWarCampaign ? '육상·항공·해상 연락' : campaignPhase === 'nation' ? '억지력·동원 해제' : '육군·함대·항공대', group: campaignPhase === 'nation' ? '국가 역량' : '전쟁 수행', description: isKoreaWarCampaign ? '광복군 부대와 지휘관, 연합 항공·해상 연락대, 국내정진 작전 준비를 관리합니다.' : campaignPhase === 'nation' ? '전쟁에서 남은 사단·함대·항공대를 국방·예비군·동원 해제 관점에서 관리합니다.' : '사단·함대·항공대를 독립 편제로 관리하고 다주 합동작전을 계획합니다.', guide: isKoreaWarCampaign ? ['군종별 준비도 확인', '지휘관·연합 장비 배치', '합동 국내정진 검토'] : ['군종별 준비도 확인', '함대·항공대 편성', campaignPhase === 'nation' ? '국방 태세 검토' : '합동작전 승인'], icon: 'army' },
    { id: 'industry', label: isKoreaWarCampaign ? '연합 조달망' : campaignPhase === 'nation' ? '산업 전환' : '군수 생산', navHint: isKoreaWarCampaign ? '중국·연합군·비축' : campaignPhase === 'nation' ? '민수화·고용·비축' : '공장·비축·보급', group: campaignPhase === 'nation' ? '국가 역량' : '전쟁 수행', description: isKoreaWarCampaign ? '중국 내 분산 작업장과 연합군 조달, 광복군 장비 비축과 수송 병목을 관리합니다.' : campaignPhase === 'nation' ? '군수 공장과 장비 생산선을 민간 산업·고용 기반과 함께 관리합니다.' : '군수 공장과 장비 생산선, 전략 비축량을 조정합니다.', guide: isKoreaWarCampaign ? ['지원망 가동률 확인', '조달선 재배정', '광복군 비축 예측'] : ['가동률 확인', '공장 재배정', '주간 생산 예측'], icon: 'industry' },
    { id: 'research', label: isKoreaWarCampaign ? '독립전쟁 기술' : '연구 개발', navHint: isKoreaWarCampaign ? '무전·침투·연합 훈련' : '기술과 장비 계보', group: '전쟁 수행', description: isKoreaWarCampaign ? '무전·암호·침투·의무·연합 훈련과 장비 운용 능력을 연구합니다.' : '두 개의 연구 슬롯에 전쟁 기술 과제를 배정합니다.', guide: isKoreaWarCampaign ? ['작전 병목 선택', '기술·연합 장비 비교', '연구 슬롯 배정'] : ['전략 목표 선택', '기술·장비 비교', '연구 슬롯 배정'], icon: 'research' },
  ];
  const activeTabMeta = tabItems.find((tab) => tab.id === activeTab) ?? tabItems[0];
  const activeTabMandate = roleMandates[activeTab];
  const activeRoleRequest = getActiveRoleRequest(roleCommand, activeTab);
  const directRoleTabIds = new Set(getDirectRoleTabs(roleMandates));
  const directRoleDestinations = tabItems.filter((tab) => directRoleTabIds.has(tab.id));
  const roleReportCards = ['map', 'army', 'industry'].includes(activeTab) ? [
    { label: '전구 압력', value: `${Math.round(game.enemyPressure)}/100`, detail: `승점 ${game.victoryScore} · 전쟁 지지 ${Math.round(game.warSupport)}` },
    { label: '해·공군 주도권', value: `${Math.round(game.navalPower)} / ${Math.round(game.airPower)}`, detail: `진행 합동작전 ${jointForces.operations.length} · 확인된 적 작전 ${jointForces.opponent.operations.filter((operation) => operation.detected).length}` },
    { label: '전력 준비', value: `${divisions.filter((division) => division.status === 'ready').length}/${divisions.length}`, detail: `연료 ${formatNumber(game.fuel)}K · 수송선 ${stockpile.convoys}척` },
  ] : activeTab === 'economy' ? [
    { label: '가용 국고', value: formatGameMoney(game.treasury), detail: `국가부채 ${formatGameMoney(economy.debt)} · 주간 순수입 ${formatGameMoney(economyForecast.netTreasuryChange, { signed: true })}` },
    { label: '물가·신뢰', value: `${economy.inflation.toFixed(1)}%`, detail: `공공신뢰 ${Math.round(economy.publicConfidence)} · 부채부담 ${Math.round(economy.debt / Math.max(1, game.treasury) * 100)}%` },
    { label: '기업 지분', value: `${economy.holdings.length}종`, detail: `현금·채권·투자는 재무 담당 부서의 결재 아래 집행됩니다.` },
  ] : activeTab === 'health' ? [
    { label: '유행 단계', value: publicHealth.activeOutbreak?.phase ?? '감시', detail: publicHealth.activeOutbreak ? `${publicHealth.activeOutbreak.codeName} · 주간 ${formatNumber(publicHealth.activeOutbreak.weeklyCases)}건` : `주간 발병 위험 ${(publicHealth.weeklyRisk * 100).toFixed(2)}%` },
    { label: '병상 부담', value: `${Math.round(publicHealth.activeOutbreak?.hospitalLoad ?? 0)}%`, detail: `감시 ${Math.round(publicHealth.surveillance)} · 의료역량 ${Math.round(publicHealth.medicalCapacity)}` },
    { label: '사회 신뢰', value: `${Math.round(publicHealth.publicTrust)}/100`, detail: `정책 집행은 보건 담당자와 내각 승인에 따릅니다.` },
  ] : activeTab === 'diplomacy' ? [
    { label: '평균 대외관계', value: `${Math.round(relationAverage)}`, detail: `관계국 ${relations.length}개 · 진행 비밀접촉 ${operations.filter((operation) => operation.active).length}건` },
    { label: '외교 자원', value: `${game.politicalPower}`, detail: `국고 ${formatGameMoney(game.treasury)} · 정보망 ${Math.round(game.intelNetwork)}` },
    { label: '세계선 경쟁', value: worldline.rivalryName, detail: `현재 질서 ${worldline.title}` },
  ] : activeTab === 'intelligence' ? [
    { label: '정보 신뢰', value: `${Math.round(game.intelNetwork)}/100`, detail: `적 대응압력 ${Math.round(game.enemyPressure)} · 확인 적 작전 ${jointForces.opponent.operations.filter((operation) => operation.detected).length}건` },
    { label: '비밀 작전', value: `${operations.filter((operation) => operation.active).length}건`, detail: `작전 목록 총 ${operations.length}건` },
    { label: '노출 위험', value: `${Math.round(careerMarket.exposure)}`, detail: `이중신분·외국 접촉의 결과는 정보 경력 기록에 남습니다.` },
  ] : activeTab === 'organization' ? [
    { label: '직접 관리 인원', value: `${staff.length}명`, detail: `위임 중 ${staff.filter((member) => member.delegated).length} · 후보 ${staffCandidates.length}명` },
    { label: '평균 충성', value: `${Math.round(staff.reduce((sum, member) => sum + member.loyalty, 0) / Math.max(1, staff.length))}`, detail: `상급자 호의 ${Math.round(roleCommand.officialFavor)} · 불복 ${Math.round(roleCommand.defiance)}` },
    { label: '인사 권한', value: `TIER ${displayedCareerRole.tier}`, detail: `${staffAuthority.managedDepartments.length}개 부서 직접 관리` },
  ] : [
    { label: campaignPhase === 'war' ? '전쟁 수행' : '국가 집행', value: `${Math.round(campaignPhase === 'war' ? game.warSupport : nationManagement.mandateScore)}/100`, detail: campaignPhase === 'war' ? `전선 압력 ${Math.round(game.enemyPressure)} · 승점 ${game.victoryScore}` : `정통성 ${Math.round(nationManagement.legitimacy)} · 불안 ${Math.round(nationManagement.unrest)}` },
    { label: '재정 여력', value: formatGameMoney(game.treasury), detail: `물가 ${economy.inflation.toFixed(1)}% · 공공신뢰 ${Math.round(economy.publicConfidence)}` },
    { label: '조직 신뢰', value: `${Math.round(career.councilTrust)}/100`, detail: `개인 평판 ${Math.round(career.reputation)} · 정치력 ${game.politicalPower}` },
  ];

  const submitMandateRequest = () => {
    const politicalCost = activeTabMandate.mode === 'report' ? 2 : 1;
    if (activeTabMandate.mode !== 'request' && activeTabMandate.mode !== 'report') return;
    if (game.politicalPower < politicalCost) {
      notify(`이 권한 요청에는 정치력 ${politicalCost}가 필요합니다. 직접 책임 업무에서 신뢰와 자원을 먼저 확보하십시오.`);
      return;
    }
    const nextState = submitRoleAuthorityRequest(roleCommand, displayedCareerRole, activeTabMandate, activeTabMeta.label, game.week, {
      councilTrust: career.councilTrust,
      reputation: career.reputation,
    });
    if (!nextState) {
      notify('이미 심사 중이거나 유효한 위임이 있습니다. 현재 지휘계통 기록을 먼저 확인하십시오.');
      return;
    }
    setRoleCommand(nextState);
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - politicalCost }));
    addEvent(
      `${activeTabMeta.label} 권한 상신`,
      `${currentRoleTitle} 명의로 담당자의 검토 의견을 붙여 상급기관에 자원·결재권을 요청했습니다. 제${game.week + 3}주까지 심사가 이어지며 즉시 결재권이 열리지는 않습니다.`,
      'neutral',
      game.week,
      {
        domain: 'management',
        decision: `${activeTabMeta.label}의 한시적 집행권을 공식 지휘계통에 요청했습니다.`,
        trigger: activeTabMandate.reason,
        factors: [`현재 보직 권한 ${displayedCareerRole.authority}`, `지도부 신임 ${Math.round(career.councilTrust)}`, `개인 평판 ${Math.round(career.reputation)}`, `초기 승인 지지 ${nextState.requests.at(-1)?.support ?? 0}%`],
        effects: [{ label: '정치력', value: `-${politicalCost}`, tone: 'negative' }, { label: '심사 기간', value: '2주', tone: 'neutral' }],
        ongoing: ['심사 중 근거 보강·후원자 설득·공개 압박으로 승인 가능성을 바꿀 수 있습니다.'],
        nextActions: ['지휘계통 카드에서 현재 지지와 결정 예정 주를 확인하십시오.'],
        certainty: 'developing',
      },
    );
    notify(`${activeTabMeta.label} 상신서를 접수했습니다 · 정치력 -${politicalCost} · 2주 심사`);
  };

  const persuadeMandateRequest = (strategy: RolePersuasionStrategy) => {
    if (!activeRoleRequest) return;
    const result = persuadeRoleAuthority(roleCommand, activeRoleRequest.id, strategy);
    if (!result) {
      notify('현재 설득할 수 있는 권한 심사가 없습니다.');
      return;
    }
    if (game.politicalPower < result.politicalCost) {
      notify(`이 설득 방식에는 정치력 ${result.politicalCost}가 필요합니다.`);
      return;
    }
    setRoleCommand(result.state);
    setGame((current) => ({ ...current, politicalPower: current.politicalPower - result.politicalCost }));
    if (result.trustDelta) setCareer((current) => ({ ...current, councilTrust: Math.max(0, Math.min(100, current.councilTrust + result.trustDelta)) }));
    addEvent(`${activeTabMeta.label} 심사 개입`, result.detail, strategy === 'pressure' ? 'bad' : 'neutral', game.week);
    notify(`${result.detail} 승인 지지 ${Math.round(result.state.requests.find((request) => request.id === activeRoleRequest.id)?.support ?? 0)}%`);
  };

  const defyMandateAuthority = () => {
    const result = defyRoleAuthority(roleCommand, displayedCareerRole, activeTabMandate, activeTabMeta.label, game.week);
    if (!result) {
      notify('현재 보직에서는 이 업무의 비상권한을 인수할 수 없습니다.');
      return;
    }
    setRoleCommand(result.state);
    setCareer((current) => ({
      ...current,
      councilTrust: Math.max(0, current.councilTrust + result.trustDelta),
      reputation: Math.max(0, current.reputation + result.reputationDelta),
    }));
    addEvent(
      `비상 월권 — ${activeTabMeta.label}`,
      result.detail,
      'bad',
      game.week,
      {
        domain: 'management',
        decision: '상급기관의 사전 승인 없이 한시적 직접 집행권을 인수했습니다.',
        trigger: `${displayedCareerRole.title}의 공식 권한 밖 업무에서 즉시 행동이 필요하다고 판단했습니다.`,
        factors: [`지도부 신임 -8`, `개인 평판 -2`, `누적 불복 기록 ${Math.round(result.state.defiance)}`],
        effects: [{ label: '직접 집행', value: '2주 개방', tone: 'positive' }, { label: '지도부 신임', value: '-8', tone: 'negative' }, { label: '평판', value: '-2', tone: 'negative' }],
        ongoing: ['성과가 나쁘면 월권과 명령 불복이 해임·쿠데타·파벌 관계에 불리하게 작용합니다.'],
        nextActions: [`${activeTabMeta.label} 화면에서 필요한 조치를 집행하고 다음 주 결과를 확인하십시오.`],
        certainty: 'confirmed',
      },
    );
    notify(result.detail);
  };

  const acknowledgeMandateReport = () => {
    setRoleCommand((current) => recordRoleInteraction(current, 'report', activeTab));
    notify(`${activeTabMeta.label} 담당 부서 보고를 확인했습니다. 직접 결재권은 해당 부서에 유지됩니다.`);
  };

  const openGameTab = useCallback((tabId: GameTab, governanceView: 'overview' | 'budget' = 'overview') => {
    if (civilianCareerActive && tabId !== 'command') {
      setActiveTab('command');
      notify('공식 권한이 없는 민간 커리어입니다. 상황실의 민간 행동과 세계 주보를 통해 영향력을 키우십시오.');
      return;
    }
    playGameAudioCue('navigate', uxPreferences.soundOn);
    preloadGameTab(tabId);
    if (tabId === 'governance') setGovernanceEntry(governanceView);
    setVisitedOnboardingTabs((current) => current.includes(tabId) ? current : [...current, tabId]);
    if (tabId === 'map' && isKoreaWarCampaign) {
      setRoleCommand((current) => recordRoleInteraction(current, roleMandates[tabId].mode === 'direct' ? 'direct' : 'briefing', tabId));
      setMapFocusMode(false);
      focusMapTerritory('korea');
      if (window.matchMedia('(max-width: 900px)').matches) setNavigationCollapsed(true);
      return;
    }
    if (tabId !== 'map') {
      setMapFocusMode(false);
    }
    setRoleCommand((current) => recordRoleInteraction(current, tabId === 'command' ? 'briefing' : roleMandates[tabId].mode === 'direct' ? 'direct' : 'briefing', tabId));
    setActiveTab(tabId);
    if (window.matchMedia('(max-width: 900px)').matches) setNavigationCollapsed(true);
  }, [civilianCareerActive, focusMapTerritory, isKoreaWarCampaign, notify, roleMandates, uxPreferences.soundOn]);
  const commandPaletteItems: CommandPaletteItem[] = [
    ...tabItems.map((tab) => ({ id: `tab-${tab.id}`, group: tab.group, title: tab.label, description: tab.description, keywords: [tab.id, tab.navHint], icon: <GameIcon name={tab.icon} size={18} tone="gold" />, active: activeTab === tab.id })),
    { id: 'theater-europe', group: '전구 지도', title: '유럽·지중해 전구', description: '유럽, 북아프리카와 지중해 전선을 엽니다.', keywords: ['유럽', '아프리카', '지도'], icon: <Map size={17} />, active: activeTheater === 'europe' },
    { id: 'theater-asia', group: '전구 지도', title: '아시아·태평양 전구', description: '중국, 인도, 동남아시아와 태평양 전선을 엽니다.', keywords: ['아시아', '태평양', '지도'], icon: <Map size={17} />, active: activeTheater === 'asia' },
    { id: 'action-center', group: '지휘 도구', title: '행동 센터', description: '놓친 결정과 우선 처리할 행동을 확인합니다.', keywords: ['할 일', '다음 행동', '권장'], icon: <Menu size={17} />, meta: `${uxActions.length}건` },
    { id: 'status-overview', group: '지휘 도구', title: '지휘 현황판', description: '핵심 자원·국가 위험·최우선 행동과 다음 주 준비 상태를 한 화면에서 확인합니다.', keywords: ['현황', '자원', '국고', '위험', '요약', '대시보드'], icon: <LayoutDashboard size={17} />, meta: 'H' },
    { id: 'weapon-readiness', group: '군사 운영', title: '병기 수명주기 본부', description: '8개 병기 분야의 가동률·수리·탄약·부품·숙련·후계 계획을 관리합니다.', keywords: ['무기', '장비', '정비', '부품', '탄약', '가동률', '후계 장비', '군수'], icon: <Wrench size={17} />, meta: `${Math.round(Object.values(equipmentDevelopment.readiness.categories).reduce((total, item) => total + item.readinessScore, 0) / 8)}점` },
    { id: 'civilization-portfolio', group: '국가 운영', title: '국가 문명 포트폴리오', description: '15개 분야의 역사 기반 국가 사업과 공공·시민·시장 경로를 비교합니다.', keywords: ['문명', '금융', '사법', '시민권', '문화', '민방위', '국가 사업'], icon: <Landmark size={17} />, meta: '15분야' },
    { id: 'war-journal', group: '지휘 도구', title: '진행 결과 분석실', description: '선택·계산·즉시효과·장기영향을 추적합니다.', keywords: ['기록', '전문', '이벤트', '결과', '원인', '결산'], icon: <BookOpen size={17} /> },
    { id: 'world-weekly', group: '지휘 도구', title: '세계 주보', description: '지난 7일의 전선·외교·경제·사회·과학·정보를 신뢰도와 인과관계까지 묶어 읽습니다.', keywords: ['신문', '주간', '뉴스', '세계', '이번 주'], icon: <Newspaper size={17} />, meta: latestWorldWeeklyIssue ? `제 ${latestWorldWeeklyIssue.edition}호` : '캠페인 시작 시 발행' },
    { id: 'achievements', group: '지휘 도구', title: '도전과제 기록실', description: '경력 목표, 달성 진척도와 해금된 삽화를 확인합니다.', keywords: ['업적', '도전과제', '삽화', '갤러리'], icon: <Trophy size={17} />, meta: `${achievementUnlocks.length}/${achievementDefinitions.length}` },
    { id: 'world-history', group: '지휘 도구', title: '대체지구 아틀라스', description: worldFlashpointForecast ? `다음 위기 ${worldFlashpointForecast.entry.event.title}까지 ${worldFlashpointForecast.weeksUntil}주. 세계선을 계산하고 직접 분기시킵니다.` : '모든 장기 세계 위기 결정을 완료했습니다.', keywords: ['대체역사', '냉전', '맨해튼', '전후', '세계선', '세계 위기'], icon: <Landmark size={17} />, meta: worldFlashpointForecast ? `D-${worldFlashpointForecast.weeksUntil}` : worldline.code },
    { id: 'settings', group: '지휘 도구', title: '사용자 환경 설정', description: '가독성, 고대비, 지도 라벨과 화면 효과를 조정합니다.', keywords: ['접근성', '글자', 'UI'], icon: <Settings size={17} /> },
    { id: 'field-manual', group: '지휘 도구', title: '야전 교범', description: '첫 주 체크리스트와 전투·운영 시스템 설명을 검색합니다.', keywords: ['도움말', '튜토리얼', '가이드'], icon: <CircleHelp size={17} />, meta: '?' },
    { id: 'save-center', group: '지휘 도구', title: '저장 및 캠페인 관리', description: '수동 체크포인트, 내보내기, 불러오기와 새 캠페인을 관리합니다.', keywords: ['저장', '불러오기', '체크포인트'], icon: <Save size={17} />, meta: 'Ctrl S' },
    { id: 'next-week', group: '주간 사이클', title: campaignPhase === 'nation' ? '다음 주 진행' : globalWeeklyCycle.primaryLabel, description: campaignPhase === 'nation' ? '재정·민생·산업·외교·보건 정책을 해결하고 국정을 한 주 진행합니다.' : globalWeeklyCycle.detail, keywords: ['턴', '시간', '다음 주', '결산', '주보', '결재'], icon: <SkipForward size={17} />, meta: 'N' },
    { id: 'toggle-time', group: '시간 제어', title: campaignPhase === 'nation' ? '지휘 주기 설정' : speed === 0 ? '시간 재개' : '일시 정지', description: campaignPhase === 'nation' ? '위험도에 맞춰 1주·1개월·분기·반기·연간 진행을 선택합니다.' : '시간 진행과 일시 정지를 전환합니다.', keywords: ['시간', '정지', '재개', '월', '분기', '연간', '위임'], icon: campaignPhase === 'nation' ? <CalendarClock size={17} /> : speed === 0 ? <SkipForward size={17} /> : <Pause size={17} />, meta: 'Space' },
  ];

  const executePaletteCommand = (id: string) => {
    setShowCommandPalette(false);
    if (id.startsWith('tab-')) {
      const tabId = id.slice(4) as GameTab;
      const tab = tabItems.find((item) => item.id === tabId);
      if (tab) {
        openGameTab(tabId);
        if (!civilianCareerActive || tabId === 'command') notify(`${tab.label} 화면을 열었습니다.`);
      }
      return;
    }
    if (id === 'theater-europe' || id === 'theater-asia') {
      switchTheater(id === 'theater-europe' ? 'europe' : 'asia');
    } else if (id === 'action-center') {
      setShowActionCenter(true);
    } else if (id === 'status-overview') {
      setShowStatusOverview(true);
    } else if (id === 'weapon-readiness') {
      setResearchWorkspace('equipment');
      setEquipmentWorkspace('deployment');
      openGameTab('research');
      notify('병기 수명주기 본부를 열었습니다. 가장 낮은 준비도와 수리 적체부터 확인하십시오.');
    } else if (id === 'civilization-portfolio') {
      openGameTab('governance');
      requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector('.civilization-portfolio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
      notify('국가 문명 포트폴리오를 열었습니다. 생존 기반·사회계약·주권과 미래의 15개 분야를 비교하십시오.');
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
      if (campaignPhase === 'nation') setShowTimeCommandCenter(true);
      else setSpeed((current) => current === 0 ? 1 : 0);
    }
  };

  const backgroundInteractionBlocked = Boolean(
    showBriefing || showTutorial || showJournal || showSettings || showActionCenter || showStatusOverview
    || showResetConfirmation || showCommandPalette || showFieldManual || showSaveCenter || showAchievementGallery
    || showWorldHistory || showWorldWeekly || showCareerMarket || showPoliticalCrisis || campaignOutcome
    || showTimeCommandCenter
    || pendingWorldFlashpoint || pendingCoupIncident || pendingCouncilEvent || pendingBattleReport || pendingOffensivePlan,
  );

  return (
    <div className={'game-shell design-v2 phase-' + campaignPhase + (navigationCollapsed ? ' navigation-collapsed' : '') + (activeTab === 'map' && mapFocusMode ? ' map-focus-mode' : '') + (uxPreferences.highContrast ? ' high-contrast' : '') + (uxPreferences.readableUI ? ' readable-ui' : '') + (uxPreferences.largeMapLabels ? ' large-map-labels' : '') + (uxPreferences.reducedMotion ? ' reduced-motion' : '')}>
      <a className="skip-to-workspace" href="#main-workspace" inert={backgroundInteractionBlocked ? true : undefined}>본문 업무공간으로 이동</a>
      <header className="topbar" aria-hidden={backgroundInteractionBlocked || undefined} inert={backgroundInteractionBlocked ? true : undefined}>
        <div className="brand-block">
          <button className="icon-button menu-button" aria-label={`행동 센터, ${uxActions.length}건`} aria-keyshortcuts="G" onClick={() => setShowActionCenter(true)}>
            <GameIcon name="command" size={19} tone="gold" />
            <span aria-hidden="true" className={'attention-badge ' + (uxActions.some((action) => action.priority === 'urgent') ? 'urgent' : '')}>{uxActions.length}</span>
          </button>
          <div className="brand-mark" style={{ borderColor: playerNation.accent }}><NationFlag nationId={playerNation.id} size="standard" decorative /></div>
          <div className="brand-copy">
            <strong>IRON DOMINION</strong>
            <span className="brand-timeline">{isKoreaWarCampaign ? `${playerNation.code} · ${getCampaignYearForWeek(game.week)} · 독립운동 세계선` : `${playerNation.code} · ALTERNATE HISTORY · ${getCampaignYearForWeek(game.week)}`}</span>
            <span className="compact-campaign-date">{campaignDate.full}</span>
          </div>
          <details className="command-utilities"><summary aria-label="보직·국가 상황 더 보기"><MoreHorizontal size={21} /></summary><div className="command-utilities-panel">
          <div className="career-rank-chip"><small>TIER {careerRole.tier} · {staffAuthority.label}</small><strong>{currentRoleTitle}</strong></div>
          <button className={`campaign-phase-chip ${campaignPhase}`} onMouseEnter={() => void loadNationManagementPanel()} onFocus={() => void loadNationManagementPanel()} onClick={() => openGameTab('governance')}>
            <Landmark size={15} />
            <span><small>{isKoreaWarCampaign ? 'LIBERATION GOVERNMENT' : campaignPhase === 'nation' ? 'POSTWAR GOVERNMENT' : 'WAR GOVERNMENT'}</small><strong>{isKoreaWarCampaign ? `해방·건국 준비 ${transitionReadiness.score}` : campaignPhase === 'nation' ? '국가 운영 단계' : `전환 준비 ${transitionReadiness.score}`}</strong></span>
          </button>
          <button className={`political-crisis-chip ${coupRisk.tier}`} onClick={() => { setSpeed(0); setShowPoliticalCrisis(true); }} aria-label={`${coupRisk.crisisLabel} 상황실, 위험 ${getCoupRiskLabel(coupRisk.tier)} ${coupRisk.score}점`}>
            <ShieldAlert size={16} />
            <span><small>{coupRisk.crisisLabel}</small><strong>{getCoupRiskLabel(coupRisk.tier)} {coupRisk.score}</strong></span>
            {coupRisk.tier === 'critical' && <em aria-hidden="true" />}
          </button>
          <button className={`health-command-chip ${publicHealthView.activeOutbreak ? 'crisis' : ''}`} onClick={() => setActiveTab('health')} aria-label={publicHealthView.activeOutbreak ? `${publicHealthView.activeOutbreak.codeName} 보건 위기 지휘실 열기` : `보건 대비 본부 열기, 다음 주 발병 확률 ${(publicHealthView.weeklyRisk * 100).toFixed(2)}퍼센트`}>
            <GameIcon name="health" size={16} tone={publicHealth.activeOutbreak ? 'red' : 'green'} />
            <span><small>{publicHealthView.activeOutbreak ? '보건 비상' : '보건 감시'}</small><strong>{publicHealthView.activeOutbreak ? publicHealthView.activeOutbreak.codeName : `${(publicHealthView.weeklyRisk * 100).toFixed(2)}%`}</strong></span>
          </button>
          <button data-tour="world-weekly" className={`world-weekly-chip ${hasUnreadWorldWeekly ? 'unread' : ''}`} onMouseEnter={() => void loadWorldWeekly()} onFocus={() => void loadWorldWeekly()} onClick={openWorldWeekly} aria-label={latestWorldWeeklyIssue ? `세계 주보 제 ${latestWorldWeeklyIssue.edition}호${hasUnreadWorldWeekly ? ', 새 호' : ''}` : '세계 주보, 캠페인 시작 시 창간호 발행'}>
            <Newspaper size={17} />
            <span><small>{hasUnreadWorldWeekly ? '새 호 발행' : '세계 주보'}</small><strong>{latestWorldWeeklyIssue ? `제 ${latestWorldWeeklyIssue.edition}호` : '발행 대기'}</strong></span>
            {hasUnreadWorldWeekly && <em aria-hidden="true" />}
          </button>
          <div className="compact-time-settings"><strong>시간 진행</strong>{campaignPhase === 'nation' ? <button type="button" onClick={() => { setSpeed(0); setShowTimeCommandCenter(true); }}>지휘 주기 설정</button> : <div role="group" aria-label="진행 속도">{[0, 1, 2, 3].map((value) => <button type="button" key={value} aria-pressed={speed === value} onClick={() => setSpeed(value)}>{value === 0 ? '일시 정지' : `${value}배속`}</button>)}</div>}</div>
          </div></details>
        </div>

        <div className="resource-row">
          <div className="resource-scroll-track" role="region" aria-label="핵심 자원">
            {civilianCareerActive ? statusResources.map((resource) => (
              <ResourceChip key={resource.id} priority={resource.priority} icon={resource.icon} tone={resource.tone} value={resource.value} label={resource.label} compactLabel={resource.label} delta={resource.delta} />
            )) : (
              <>
                <ResourceChip priority icon="treasury" tone="gold" value={formatGameMoney(game.treasury)} label={`${isKoreaWarCampaign ? '독립운동 기금' : '국고'} · ${economy.monetarySystem.historicalAutoTransition ? '역사통화' : '신 통화'}`} compactLabel={isKoreaWarCampaign ? '독립기금' : '국고'} delta={campaignPhase === 'nation' && nationManagement.reports[0] ? formatGameMoney(nationManagement.reports[0].fiscalBalance, { signed: true }) : formatGameMoney(economyForecast.netTreasuryChange, { signed: true })} />
                <ResourceChip icon="politics" tone="gold" value={formatNumber(game.politicalPower)} label={isKoreaWarCampaign ? '외교·조직력' : campaignPhase === 'nation' ? '정치 역량' : '정치력'} compactLabel={isKoreaWarCampaign ? '외교·조직' : '정치'} delta={campaignPhase === 'nation' ? `위임 ${nationManagement.mandateScore}` : '+3'} />
                <ResourceChip icon="manpower" tone="blue" value={formatNumber(game.manpower) + 'K'} label={isKoreaWarCampaign ? '동원 가능 인력' : campaignPhase === 'nation' ? '노동·예비 인력' : '가용 인력'} compactLabel={isKoreaWarCampaign ? '동원 인력' : campaignPhase === 'nation' ? '인력' : '가용 인력'} delta={campaignPhase === 'nation' ? `고용 ${Math.round(nationManagement.employment)}` : '+18'} />
                <ResourceChip icon="industry" tone="steel" value={String(game.factories)} label={isKoreaWarCampaign ? '협력 생산망' : campaignPhase === 'nation' ? '산업 기반' : '군수 공장'} compactLabel={isKoreaWarCampaign ? '생산망' : campaignPhase === 'nation' ? '산업' : '군수 공장'} delta={campaignPhase === 'nation' ? `민수 ${Math.round(nationManagement.civilianIndustry)}` : undefined} />
                <ResourceChip icon="fuel" tone="green" value={formatNumber(game.fuel) + 'K'} label={isKoreaWarCampaign ? '작전 연료' : campaignPhase === 'nation' ? '전략 에너지' : '연료'} delta={campaignPhase === 'nation' ? undefined : '+2.6'} />
                <ResourceChip icon="steel" tone="steel" value={formatNumber(game.steel) + 'K'} label={isKoreaWarCampaign ? '조달 강철' : '강철'} delta="+9" />
              </>
            )}
          </div>
          <button type="button" className="status-overview-trigger" aria-label="지휘 현황판 열기" aria-keyshortcuts="H" title="핵심 자원·위험·다음 행동 전체 보기 · H" onClick={() => setShowStatusOverview(true)}><LayoutDashboard size={17} /><span>현황</span></button>
        </div>

        <div className="time-controls">
          <div className="weather"><GameIcon name="weather" size={17} tone="blue" /><span>{activeTheater === 'asia' ? '아시아·태평양' : '유럽'}<br /><b>{activeTheater === 'asia' ? '몬순 · 29°C' : '비 · 11°C'}</b></span></div>
          <div className="date-block"><strong>{campaignDate.full}</strong><span>제 {game.week + 1}주 · {campaignDate.day}</span></div>
          {campaignPhase === 'nation' ? (
            <button
              type="button"
              className={`time-cadence-trigger ${periodAdvanceRemaining > 0 ? 'running' : ''}`}
              onMouseEnter={() => void loadTimeCommandCenter()}
              onFocus={() => void loadTimeCommandCenter()}
              onClick={() => { setSpeed(0); setShowTimeCommandCenter(true); }}
              aria-label={periodAdvanceRemaining > 0 ? `지휘 위임 진행 중, ${periodAdvanceRemaining}주 남음` : `지휘 주기 설정, 현재 ${timeCadenceAssessment.label}`}
            >
              <CalendarClock size={15} />
              <span><small>{periodAdvanceRemaining > 0 ? '자동 위임 중' : timeCadenceAssessment.label}</small><strong>{periodAdvanceRemaining > 0 ? `${periodAdvanceRemaining}주 남음` : `${timeCadenceAssessment.recommendedWeeks}주 추천`}</strong></span>
            </button>
          ) : (
            <>
              <button className={'speed-button ' + (speed === 0 ? 'active' : '')} onClick={() => setSpeed(0)} aria-label="일시 정지" aria-keyshortcuts="Space"><Pause size={14} /></button>
              {[1, 2, 3].map((item) => (
                <button key={item} className={'speed-button text ' + (speed === item ? 'active' : '')} onClick={() => setSpeed(item)}>{item}×</button>
              ))}
            </>
          )}
          <button data-tour="next-week" className={`speed-button next flow-${campaignPhase === 'nation' ? 'advance' : globalWeeklyCycle.currentStage}`} onClick={continueWeeklyFlow} aria-label={globalNextAriaLabel} title={`${globalNextAriaLabel} · N`} aria-keyshortcuts="N">
            <GameIcon name={campaignPhase === 'nation' || globalWeeklyCycle.primaryDestination === 'advance' ? 'advance' : globalWeeklyCycle.primaryDestination === 'actions' ? 'command' : 'report'} size={14} tone={globalWeeklyCycle.primaryDestination === 'actions' ? 'gold' : 'blue'} />
            <span>{globalNextLabel}</span>
          </button>
        </div>
      </header>

      <button
        type="button"
        className="rail-visibility-toggle"
        aria-hidden={backgroundInteractionBlocked || undefined}
        inert={backgroundInteractionBlocked ? true : undefined}
        aria-controls="primary-navigation"
        aria-expanded={!navigationCollapsed}
        aria-label={navigationCollapsed ? '좌측 메뉴 펼치기' : '좌측 메뉴 접기'}
        title={navigationCollapsed ? '좌측 메뉴 펼치기' : '좌측 메뉴 접기'}
        onClick={() => setNavigationCollapsed((current) => !current)}
      >
        {navigationCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        <span className="sr-only">{navigationCollapsed ? '좌측 메뉴 펼치기' : '좌측 메뉴 접기'}</span>
      </button>

      <aside id="primary-navigation" className="left-rail" aria-hidden={navigationCollapsed || backgroundInteractionBlocked} inert={navigationCollapsed || backgroundInteractionBlocked ? true : undefined}>
        <div className="nation-emblem">
          <NationFlag nationId={playerNation.id} size="standard" />
          <small>{playerNation.shortName}</small>
        </div>
        <nav className="primary-nav" aria-label="게임 메뉴">
          {tabItems.map((tab, index) => (
            <div className="nav-entry" key={tab.id}>
            {(index === 0 || tabItems[index - 1].group !== tab.group) && <span className="primary-nav-group-label">{tab.group}</span>}
            <button data-tour={`${tab.id}-tab`} className={`${activeTab === tab.id ? 'active' : ''}${roleMandates[tab.id].mode === 'locked' ? ' career-locked' : ''} mandate-${roleMandates[tab.id].mode}`} onMouseEnter={() => preloadGameTab(tab.id)} onFocus={() => preloadGameTab(tab.id)} onClick={() => openGameTab(tab.id)} title={tab.label} data-tooltip={`${roleMandates[tab.id].label} · ${roleMandates[tab.id].reason}`} aria-label={`${tab.label}, ${roleMandates[tab.id].label}${roleMandates[tab.id].mode === 'locked' ? ', 제도권 진입 전 잠김' : tabActionSummary.counts[tab.id] ? `, 미처리 업무 ${tabActionSummary.counts[tab.id]}건` : ''}`} aria-disabled={roleMandates[tab.id].mode === 'locked'} aria-current={activeTab === tab.id ? 'page' : undefined}>
              <span className="nav-icon-plate"><GameIcon name={tab.icon} size={21} tone={activeTab === tab.id ? 'gold' : 'steel'} active={activeTab === tab.id} /></span>
              <span className="nav-copy"><strong>{tab.label}</strong><small>{tab.navHint}</small><i className={`nav-mandate-label ${roleMandates[tab.id].mode}`}>{roleMandates[tab.id].label}</i></span>
              {Boolean(tabActionSummary.counts[tab.id]) && <em className={`nav-work-badge ${tabActionSummary.urgentTabs.has(tab.id) ? 'urgent' : ''}`} aria-hidden="true">{tabActionSummary.counts[tab.id]}</em>}
            </button>
            </div>
          ))}
        </nav>
        <details className="rail-support"><summary>기록·저장·설정</summary><div className="rail-bottom">
          <button className={hasUnreadWorldWeekly ? 'rail-unread' : ''} title="세계 주보" data-tooltip={latestWorldWeeklyIssue ? `지난 7일의 세계 · 제 ${latestWorldWeeklyIssue.edition}호` : '캠페인 시작 시 창간호 발행'} aria-label={latestWorldWeeklyIssue ? `세계 주보 제 ${latestWorldWeeklyIssue.edition}호${hasUnreadWorldWeekly ? ', 새 호' : ''}` : '세계 주보'} onMouseEnter={() => void loadWorldWeekly()} onFocus={() => void loadWorldWeekly()} onClick={openWorldWeekly}><Newspaper size={17} /><span>세계 주보</span>{hasUnreadWorldWeekly && <em className="rail-achievement-count">NEW</em>}</button>
          <button title="도전과제 기록실" data-tooltip={`도전과제와 해금 삽화 · ${achievementUnlocks.length}/${achievementDefinitions.length}`} aria-label={`도전과제 기록실, ${achievementUnlocks.length}개 달성`} onMouseEnter={() => void loadAchievementGallery()} onFocus={() => void loadAchievementGallery()} onClick={() => setShowAchievementGallery(true)}><Trophy size={17} /><span>도전과제</span><em className="rail-achievement-count">{achievementUnlocks.length}</em></button>
          <button className={pendingWorldFlashpoint ? 'rail-crisis-due' : ''} title="대체지구 아틀라스" data-tooltip={pendingWorldFlashpoint ? `결정 대기 · ${pendingWorldFlashpoint.entry.event.title}` : worldFlashpointForecast ? `다음 세계 위기 · ${worldFlashpointForecast.entry.event.title} · ${worldFlashpointForecast.weeksUntil}주 후 · 역사 가속 범위 ${worldFlashpointForecast.historicalHorizon}년` : `${worldline.code} · 모든 장기 위기 결정 완료`} aria-label={pendingWorldFlashpoint ? `세계 위기 결정 대기, ${pendingWorldFlashpoint.entry.event.title}` : worldFlashpointForecast ? `대체지구 아틀라스, 다음 세계 위기 ${worldFlashpointForecast.entry.event.title}, ${worldFlashpointForecast.weeksUntil}주 후` : `대체지구 아틀라스, ${worldline.title}, 모든 장기 위기 결정 완료`} onMouseEnter={() => void loadWorldHistoryAtlas()} onFocus={() => void loadWorldHistoryAtlas()} onClick={openWorldHistory}><Landmark size={17} /><span>세계선</span>{worldFlashpointForecast && <em className="rail-crisis-count">{pendingWorldFlashpoint ? '결정' : `D-${worldFlashpointForecast.weeksUntil}`}</em>}</button>
          <button title="빠른 이동" data-tooltip="빠른 이동 · Ctrl+K" aria-label="빠른 이동" aria-keyshortcuts="Control+K Meta+K" onClick={() => setShowCommandPalette(true)}><GameIcon name="search" size={17} tone="steel" /><span>빠른 이동</span></button>
          <button title="진행 결과 분석실" data-tooltip="선택·계산·결과 추적" aria-label="진행 결과 분석실" onClick={openWarJournal}><GameIcon name="report" size={17} tone="steel" /><span>진행 결과</span></button>
          <button title={uxPreferences.soundOn ? '음향 끄기' : '음향 켜기'} data-tooltip={uxPreferences.soundOn ? '게임 음향 끄기' : '게임 음향 켜기'} aria-label={uxPreferences.soundOn ? '음향 끄기' : '음향 켜기'} onClick={() => toggleUXPreference('soundOn')}><GameIcon name="sound" size={17} tone="steel" className={uxPreferences.soundOn ? '' : 'muted'} /><span>음향</span></button>
          <button title="저장 및 캠페인 관리" data-tooltip="저장 및 캠페인 관리 · Ctrl+S" aria-label="저장 및 캠페인 관리" aria-keyshortcuts="Control+S Meta+S" onClick={() => setShowSaveCenter(true)}><GameIcon name="save" size={17} tone="steel" /><span>저장</span></button>
          <button title="야전 교범" data-tooltip="야전 교범 · ?" aria-label="야전 교범" aria-keyshortcuts="?" onMouseEnter={() => void loadFieldManual()} onFocus={() => void loadFieldManual()} onClick={() => setShowFieldManual(true)}><GameIcon name="help" size={17} tone="steel" /><span>야전 교범</span></button>
          <button title="사용자 환경 설정" data-tooltip="사용자 환경 설정 · S" aria-label="사용자 환경 설정" aria-keyshortcuts="S" onClick={() => setShowSettings(true)}><GameIcon name="settings" size={17} tone="steel" /><span>환경 설정</span></button>
        </div></details>
      </aside>

      {!navigationCollapsed && <button type="button" className="mobile-navigation-scrim" aria-label="전체 메뉴 닫기" aria-hidden={backgroundInteractionBlocked || undefined} inert={backgroundInteractionBlocked ? true : undefined} onClick={() => setNavigationCollapsed(true)} />}

      <nav className="mobile-command-dock" aria-label="모바일 빠른 지휘" aria-hidden={backgroundInteractionBlocked || undefined} inert={backgroundInteractionBlocked ? true : undefined}>
        <button type="button" className={activeTab === 'command' ? 'active' : ''} aria-current={activeTab === 'command' ? 'page' : undefined} onClick={() => openGameTab('command')}><GameIcon name="command" size={20} tone={activeTab === 'command' ? 'gold' : 'steel'} /><span>상황실</span></button>
        <button type="button" className={activeTab === 'map' ? 'active' : ''} aria-current={activeTab === 'map' ? 'page' : undefined} onClick={() => openGameTab('map')}><GameIcon name="map" size={20} tone={activeTab === 'map' ? 'gold' : 'steel'} /><span>전황</span></button>
        <button type="button" className={`mobile-action-button ${uxActions.some((action) => action.priority === 'urgent') ? 'urgent' : ''}`} aria-label={`행동 센터, ${uxActions.length}건`} onClick={() => setShowActionCenter(true)}><GameIcon name="command" size={22} tone={uxActions.some((action) => action.priority === 'urgent') ? 'red' : 'gold'} framed active /><span>결재</span><em>{uxActions.length}</em></button>
        <button type="button" className={activeTab === 'organization' ? 'active' : ''} aria-current={activeTab === 'organization' ? 'page' : undefined} onClick={() => openGameTab('organization')}><GameIcon name="organization" size={20} tone={activeTab === 'organization' ? 'gold' : 'steel'} /><span>조직</span></button>
        <button type="button" className={!navigationCollapsed ? 'active' : ''} aria-expanded={!navigationCollapsed} aria-controls="primary-navigation" onClick={() => setNavigationCollapsed((current) => !current)}><Menu size={20} /><span>전체</span></button>
      </nav>

      <main id="main-workspace" tabIndex={-1} aria-hidden={backgroundInteractionBlocked || undefined} inert={backgroundInteractionBlocked ? true : undefined} className={`war-room ${activeTab === 'map' && activeTabMandate.mode === 'direct' ? `map-mode ${mapIntelOpen ? 'map-intel-open' : 'map-intel-closed'}` : 'workspace-mode'}`}>
        {activeTab === 'map' && activeTabMandate.mode === 'direct' && (
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
            enemyIntentTargetId={enemyIntentReport.targetId ?? undefined}
            planningOriginId={planningMode ? selectedDivision.territoryId : undefined}
            camera={mapCamera}
            labelMode={mapLabelMode}
            onCameraChange={moveMapCamera}
            onZoom={zoomMap}
            onSelect={selectTerritory}
            fronts={regionalFrontSummaries}
            worldChanges={worldChangeProfile}
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
            campaignYear={campaignYear}
            frontTimeline={regionalFrontChronology}
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
                {activeOrderPresentations.slice(0, 3).map(({ order, division, origin, target, profile, progress, stanceLabel }) => (
                  <button type="button" key={getOperationOrderId(order)} onClick={() => { setSelectedFieldOrderId(getOperationOrderId(order)); focusOperationalOrder(order); }}>
                    <Target size={15} />
                    <span><strong>{target.name} · {profile.shortLabel} {progress}%</strong><small>{division.name} · {stanceLabel} · {order.elapsedWeeks ?? 0}/{order.maxWeeks ?? profile.maximumWeeks}주</small><i><b style={{ width: `${progress}%` }} /></i></span>
                    <em>{origin.name} 출발 <ChevronRight size={13} /></em>
                  </button>
                ))}
              </div>
              {activeOrderPresentations.length > 3 && <footer>외 {activeOrderPresentations.length - 3}건은 육군 명령 목록에서 계속 추적됩니다.</footer>}
              <footer><button type="button" onClick={() => { setArmyWorkspace('operations'); openGameTab('army'); }}>작전 현장 · 결산과 중단 관리 <ChevronRight size={15} /></button></footer>
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

          <EnemyIntentBrief
            report={enemyIntentReport}
            onFocusTarget={enemyIntentReport.targetId ? () => focusMapTerritory(enemyIntentReport.targetId as string) : undefined}
          />

          <section className="historical-map-source" aria-label="현재 지도의 역사 사료 출처">
            <div className="historical-map-source-heading">
              <Landmark size={14} />
              <span>ARCHIVE MAP</span>
              <em>{historicalMapSources[activeTheater].rightsLabel}</em>
            </div>
            <strong>{historicalMapSources[activeTheater].title}</strong>
            <span>{historicalMapSources[activeTheater].dateLabel} · {historicalMapSources[activeTheater].catalogId}</span>
            <small>{historicalMapSources[activeTheater].archive}</small>
            <div className="historical-time-disclosure"><Clock3 size={13} /><span><b>배경 원도 {historicalMapSources[activeTheater].dateLabel}</b><em>작전 오버레이 {campaignYear}년 · 전선은 연도·통제권·실제 적 접촉으로 재계산</em></span></div>
            <div className="historical-map-quality"><b>{historicalMapSources[activeTheater].assetProfile}</b><span>{historicalMapSources[activeTheater].pixelDimensions} · 로컬 최고 화질</span></div>
            <p><b>{activeMapRegion.name}</b> 구간을 원본 스캔에서 확대했습니다. 원도 제작일과 캠페인 날짜는 다를 수 있으며, 지명·전선명·부대·접촉선은 현재 연도와 대체역사 상태로 교정됩니다.</p>
            <a href={historicalMapSources[activeTheater].sourceUrl} target="_blank" rel="noreferrer">소장처 원문 보기 <ChevronRight size={12} /></a>
          </section>

          <section className="map-front-chronology-card" aria-label={`${campaignYear}년 ${activeMapRegion.name} 전선 시간선`}>
            <header>
              <CalendarClock size={15} />
              <span><small>FRONT CHRONOLOGY · {campaignYear}</small><strong>{activeMapRegion.shortName} 전선 형성 기록</strong></span>
              <em>{regionalActiveFrontChronology.length} 활성 / {regionalUpcomingFrontChronology.length} 예정</em>
            </header>
            <p>전선명은 날짜만으로 고정되지 않습니다. 역사보다 이른 공격·통제권 변화는 새 전선을 조기에 열고, 종결 연도 뒤에도 적 접촉이 남으면 대체역사 전선으로 계속됩니다.</p>
            <div className="map-front-chronology-stats">
              <span><b>{regionalActiveFrontChronology.filter((front) => front.state === 'historical-window').length}</b><small>사료상 활성</small></span>
              <span><b>{regionalActiveFrontChronology.filter((front) => front.state === 'diverged-early' || front.state === 'alternate-continuation').length}</b><small>역사 이탈</small></span>
              <span><b>{regionalFrontChronology.filter((front) => front.state === 'dormant' || front.state === 'postwar-legacy').length}</b><small>종결·보관</small></span>
            </div>
            <div className="map-front-chronology-list">
              {regionalActiveFrontChronology.slice(0, 3).map((front) => (
                <button type="button" className={front.state} key={front.id} onClick={() => front.territoryIds[0] && focusMapTerritory(front.territoryIds[0])} disabled={!front.territoryIds[0]} title={front.reason}>
                  <i />
                  <span><strong>{front.name}</strong><small>{front.statusLabel} · {front.commandArea}</small></span>
                  <em>{front.activeContactCount > 0 ? `${front.activeContactCount} 접촉` : front.historicalWindow}</em>
                </button>
              ))}
              {regionalActiveFrontChronology.length === 0 && <span className="map-front-chronology-empty">이 지역에 현재 표시할 전선이 없습니다. 도시와 보급 거점은 계속 선택할 수 있습니다.</span>}
            </div>
            {regionalUpcomingFrontChronology[0] && (
              <footer>
                <span><small>NEXT HISTORICAL WINDOW</small><strong>{regionalUpcomingFrontChronology[0].name}</strong><em>{regionalUpcomingFrontChronology[0].startYear}년 · D-{regionalUpcomingFrontChronology[0].yearsUntil}년</em></span>
                <button type="button" onClick={() => regionalUpcomingFrontChronology[0].territoryIds[0] && focusMapTerritory(regionalUpcomingFrontChronology[0].territoryIds[0])} disabled={!regionalUpcomingFrontChronology[0].territoryIds[0]}>후보 지역 보기 <ChevronRight size={12} /></button>
              </footer>
            )}
          </section>

          <section className={`map-world-change-card ${worldChangeProfile.stage}`} aria-label="캠페인 시작 뒤 달라진 세계">
            <header><GitBranch size={15} /><span><small>LIVING WORLD · {worldChangeProfile.visibleChangeCount} SIGNALS</small><strong>{worldChangeProfile.headline}</strong></span><em>{worldChangeProfile.editorialLabel}</em></header>
            <p>{worldChangeProfile.summary}</p>
            <div>
              {worldChangeProfile.territoryChanges.slice(0, 3).map((change) => (
                <button type="button" key={change.id} onClick={() => focusMapTerritory(change.territoryId)}>
                  <i className={change.kind} />
                  <span><strong>{change.name}</strong><small>{change.before} → {change.after}</small></span>
                  <ChevronRight size={13} />
                </button>
              ))}
              {worldChangeProfile.territoryChanges.length === 0 ? <span className="map-world-change-empty">아직 지도에 남을 통제권·도시 상태 변화는 없습니다. 첫 전투 결과가 이곳에 기록됩니다.</span> : null}
            </div>
            <button type="button" className="map-world-change-open" onClick={openWarJournal}>모든 원인과 결과 보기 <ChevronRight size={13} /></button>
          </section>

          <FrontOperationsBoard
            fronts={regionalFrontSummaries}
            selectedFrontId={regionalFrontSummaries.some((front) => front.id === selectedFrontDetailId) ? selectedFrontDetailId : null}
            battleReports={battleReports}
            commanders={effectiveCommanders}
            divisions={effectiveDivisions}
            onSelectFront={(frontId) => {
              setSelectedFrontDetailId(frontId);
              focusMapFront(frontId);
            }}
            onCloseDetail={() => setSelectedFrontDetailId(null)}
            onOpenReport={setPendingBattleReportId}
          />

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

        {activeTab === 'map' && activeTabMandate.mode !== 'direct' && (
          <section className="command-deck workspace-deck role-gated-workspace">
            <div className="deck-context-bar">
              <div className="deck-context-title"><GameIcon name="map" size={22} tone="gold" framed /><span><em>보직 권한 / {activeTabMandate.label}</em><strong>{activeTabMeta.label}</strong><small>{activeTabMeta.description}</small></span></div>
            </div>
            <div className="deck-content">
              <RoleMandateDesk
                roleTitle={currentRoleTitle}
                tabLabel={activeTabMeta.label}
                mandate={activeTabMandate}
                year={campaignYear}
                week={game.week}
                reports={roleReportCards}
                directDestinations={directRoleDestinations}
                request={activeRoleRequest}
                commandChain={roleCommandChain}
                officialFavor={roleCommand.officialFavor}
                defiance={roleCommand.defiance}
                onSubmitRequest={submitMandateRequest}
                onPersuade={persuadeMandateRequest}
                onDefy={defyMandateAuthority}
                onAcknowledgeReport={acknowledgeMandateReport}
                onNavigate={openGameTab}
              />
            </div>
          </section>
        )}

        {activeTab !== 'map' && (
        <section className="command-deck workspace-deck">
          <div className="deck-context-bar">
            <div className="deck-context-title" role="status" aria-live="polite" aria-atomic="true">
              <GameIcon name={activeTabMeta.icon} size={22} tone="gold" framed active />
              <span><em>{campaignPhase === 'nation' ? '국가 운영 내각' : '전쟁 지휘소'} / {activeTabMeta.group}</em><strong>{activeTabMeta.label}</strong><small>{activeTabMeta.description}</small></span>
            </div>
            <details className="deck-guide"><summary>이 화면 이용법</summary><ol className="deck-route" aria-label={`${activeTabMeta.label} 이용 순서`}>
              {activeTabMeta.guide.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}
            </ol></details>
            <div className="deck-context-actions">
              <button className="autosave-indicator" onClick={() => setShowSaveCenter(true)} aria-label="저장 센터 열기"><ShieldCheck size={14} /><span>{lastSavedAt ? '자동 저장 완료' : '자동 저장 대기'}</span></button>
              <button className="quick-navigation-trigger" onClick={() => setShowCommandPalette(true)} aria-label="빠른 이동" aria-keyshortcuts="Control+K Meta+K"><Search size={15} /><span>빠른 이동</span><kbd>Ctrl K</kbd></button>
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
          {!publicHealth.activeOutbreak && campaignPhase === 'war' && (enemyIntentReport.threatLevel === 'elevated' || enemyIntentReport.threatLevel === 'critical') && (
            <button className={`workspace-crisis-ribbon enemy-operation ${enemyIntentReport.threatLevel}`} onClick={() => enemyIntentReport.targetId ? focusMapTerritory(enemyIntentReport.targetId) : openGameTab('map')}>
              <span className="crisis-ribbon-icon"><Radar size={19} /></span>
              <span><small>적 주력 투입 · {enemyIntentReport.classification} {enemyIntentReport.confidence}%</small><strong>{enemyIntentReport.targetName} · {enemyIntentReport.operationLabel} · {enemyIntentReport.etaLabel}</strong></span>
              <em>적 의도와 방어책 보기 <ChevronRight size={15} /></em>
            </button>
          )}
          <div className="deck-content" ref={deckContentRef}>
            {activeTab !== 'command' && activeRoleRequest?.status === 'approved' && activeTabMandate.mode === 'direct' && (
              <section className={`role-delegation-banner ${activeRoleRequest.route}`} role="status">
                <ShieldAlert size={19} />
                <span>
                  <small>{activeRoleRequest.route === 'defiant' ? 'EMERGENCY OVERRULE · 비상 월권' : 'TEMPORARY MANDATE · 한시 위임'}</small>
                  <strong>{activeRoleRequest.tabLabel} 직접 집행권</strong>
                  <p>제{(activeRoleRequest.delegationUntilWeek ?? game.week) + 1}주까지 유효 · 종료 뒤 상급기관에 결과와 책임을 보고합니다.</p>
                </span>
                <em>{activeRoleRequest.route === 'defiant' ? '불복 책임 발생' : '승인된 권한'}</em>
              </section>
            )}
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
            {activeTab !== 'command' && activeTabMandate.mode !== 'direct' && (
              <RoleMandateDesk
                roleTitle={currentRoleTitle}
                tabLabel={activeTabMeta.label}
                mandate={activeTabMandate}
                year={campaignYear}
                week={game.week}
                reports={roleReportCards}
                directDestinations={directRoleDestinations}
                request={activeRoleRequest}
                commandChain={roleCommandChain}
                officialFavor={roleCommand.officialFavor}
                defiance={roleCommand.defiance}
                onSubmitRequest={submitMandateRequest}
                onPersuade={persuadeMandateRequest}
                onDefy={defyMandateAuthority}
                onAcknowledgeReport={acknowledgeMandateReport}
                onNavigate={openGameTab}
              />
            )}
            {activeTab === 'command' && !civilianCareerActive && <FieldWorkspaceSwitch label="지휘 본부 보기" value={commandWorkspace} onChange={(value) => { if (campaignPhase === 'nation' && value === 'analysis') openGameTab('governance'); else setCommandWorkspace(value); }} items={[{ id: 'desk', label: '지휘 데스크', detail: '이번 주 결정 · 나의 임무' }, { id: 'world', label: '현장 보기', detail: '산업 · 사회 · 선택의 흔적' }, { id: 'analysis', label: campaignPhase === 'nation' ? '국정 상세로 이동' : '상세 분석', detail: '국가 전략 · 전체 지표' }]} />}
            {activeTab === 'command' && !civilianCareerActive && commandWorkspace === 'desk' && (
              <CommandDesk
                nationName={playerNation.shortName}
                dateLabel={campaignDate.full}
                nextLabel={globalNextLabel}
                recentEvents={events.slice(0, 3).map((event) => ({ ...event, id: String(event.id) }))}
                activities={[
                  { id: 'operations', label: '진행 중 작전', value: orders.length, detail: '명령과 중단 상태', tab: 'army' as const },
                  { id: 'meeting', label: '참모 현안', value: staffNarrative.activeStorylines.filter((story) => staff.some((member) => (member.id === story.firstStaffId || member.id === story.secondStaffId) && staffAuthority.managedDepartments.includes(member.department))).length, detail: '면담과 주간 검증', tab: 'organization' as const },
                  { id: 'logistics', label: '이동 중 수송', value: regionalAccount.shipments.filter((shipment) => shipment.status === 'reserved' || shipment.status === 'in-transit').length, detail: '예약에서 실제 도착까지', tab: 'industry' as const },
                ].filter((activity) => roleMandates[activity.tab].mode === 'direct')}
                onActivity={(id, tab) => { if (id === 'operations') setArmyWorkspace('operations'); if (id === 'meeting') setOrganizationWorkspace('meeting'); if (id === 'logistics') setIndustryWorkspace('logistics'); openGameTab(tab); }}
                onOpenBriefing={openWeeklyBriefing}
                role={displayedCareerRole}
                mandates={roleMandates}
                tabs={tabItems}
                actions={uxActions}
                worldlineTitle={worldline.title}
                expanded={false}
                commandState={roleCommand}
                commandChain={roleCommandChain}
                operationalScope={roleOperationalScope}
                onNavigate={openGameTab}
                onAction={navigateFromActionCenter}
                onToggleExpanded={() => setCommandWorkspace('analysis')}
                onNextWeek={continueWeeklyFlow}
              />
            )}
            {activeTab === 'command' && !civilianCareerActive && commandWorkspace === 'world' && (
              <LivingWorldScene
                nationName={playerNation.shortName}
                input={nationalSimulationInput}
                snapshot={nationalSimulation}
                industryMandate={roleMandates.industry}
                routedEquipmentKey={routedEquipmentKey}
                postwarInput={postwarIndustryInput ?? undefined}
                staffIssues={staffNarrative.activeStorylines.filter((story) => staff.some((member) => (member.id === story.firstStaffId || member.id === story.secondStaffId) && staffAuthority.managedDepartments.includes(member.department))).length}
                lastSettlement={livingWorldRecords.lastSettlement}
                lastOrder={livingWorldRecords.lastOrder}
                onNavigate={(tab) => { if (tab === 'organization') setOrganizationWorkspace('meeting'); openGameTab(tab); }}
                onReallocate={adjustFactories}
                onOpenBriefing={openWeeklyBriefing}
              />
            )}
            {activeTab === 'command' && campaignPhase === 'war' && (
              civilianCareerActive && career.civilian ? (
                <CivilianCareerPanel
                  state={career.civilian}
                  nation={playerNation}
                  week={game.week}
                  entryRoles={civilianEntryRoles}
                  worldlineTitle={worldline.title}
                  worldlineCode={worldline.code}
                  weeklyUnread={hasUnreadWorldWeekly}
                  onAction={performCivilianAction}
                  onEnterRole={enterCivilianRole}
                  onOpenWorldWeekly={openWorldWeekly}
                  onOpenWorldHistory={openWorldHistory}
                  onNextWeek={advanceWeek}
                />
              ) : commandWorkspace === 'analysis' ? (
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
                  completedDecisions={completedDecisions}
                  weeklyIssue={latestWorldWeeklyIssue}
                  weeklyUnread={hasUnreadWorldWeekly}
                  resultsReviewed={game.week === 0 || lastReviewedJournalWeek >= game.week}
                  objectiveProgress={objectiveProgress}
                  relationAverage={relationAverage}
                  battleVictories={battleVictoryCount}
                  enemyIntent={enemyIntentReport}
                  achievement={activeAchievement}
                  achievementProgress={activeAchievement ? achievementProgress[activeAchievement.id] : undefined}
                  achievementTracked={Boolean(activeAchievement && trackedAchievementId === activeAchievement.id)}
                  onNavigate={openGameTab}
                  onFocusEnemyTarget={focusMapTerritory}
                  onEnactCivilization={enactCivilizationProgram}
                  onSelectNationalProgram={selectNationalProgram}
                  onAction={navigateFromActionCenter}
                  onOpenActionCenter={() => setShowActionCenter(true)}
                  onOpenJournal={openWarJournal}
                  onOpenWorldWeekly={openWorldWeekly}
                  onAcknowledgeWeeklyBriefing={openWeeklyBriefing}
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
              ) : null
            )}
            {activeTab === 'governance' && activeTabMandate.mode === 'direct' && (
              <Suspense fallback={<DeferredSurface label="국가 운영 내각 준비 중" />}>
                <NationManagementPanel
                  key={`${playerNation.id}:${governanceEntry}`}
                  initialView={governanceEntry}
                  budgetAuthority={roleMandates.governance.mode === 'direct'}
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
                  completedDecisions={completedDecisions}
                  completedResearch={research.filter((project) => project.complete).length}
                  publicHealthPressure={projectionPublicHealthPressure}
                  worldlineTitle={worldline.title}
                  readiness={transitionReadiness}
                  formatMoney={formatGameMoney}
                  onTransition={transitionToNationManagement}
                  onBudgetChange={changeNationBudget}
                  onTaxChange={changeNationTax}
                   onSpendingChange={changeNationSpending}
                   onStrategyChange={changeNationStrategy}
                   onNationAgendaChoice={decideNationAgenda}
                   onGovernmentFormChange={changeGovernmentForm}
                  onGrantTitle={appointNobleTitle}
                  onRevokeTitle={revokeNobleTitle}
                  onArrangeMarriage={arrangeRoyalMarriage}
                  onSuccessionLawChange={changeSuccessionLaw}
                  onConfigurePersonalLife={configurePersonalLife}
                  onStartPersonalRelationship={startPersonalRelationship}
                  onFormalizeRelationship={formalizeRelationship}
                  onFamilyLawChange={changeFamilyLaw}
                  onPersonalLifeAction={takePersonalLifeAction}
                  onFamilyPlanChange={changeFamilyPlan}
                  onMediaLawChange={changeMediaLaw}
                  onRequestMediaInterview={requestMediaInterview}
                  onAnswerMediaInterview={answerMediaInterview}
                  onAnswerExposure={answerExposureIncident}
                  onOpenJusticeCase={startJusticeCase}
                  onJusticeDecision={decideJusticeCase}
                  onActivateConstitution={activateConstitution}
                  onConstitutionClauseSelect={chooseConstitutionClause}
                  onConstitutionRatify={enactConstitution}
                  onJudicialNominate={nominateJudicialOfficer}
                  onJudicialNominationDecision={decideJudicialNomination}
                  onSovereignPowerExercise={exerciseOfficePower}
                  onLeadershipPrinciplesChange={changeLeadershipPrinciples}
                  onPowerBlocPromise={promisePowerBloc}
                  onLegacyPathChange={changeLegacyPath}
                  onRivalAction={takeRivalAction}
                  onPowerOpportunityChoice={decidePowerOpportunity}
                  onStrategicSagaStart={launchStrategicSaga}
                  onStrategicSagaApproach={selectStrategicSagaApproach}
                  onStrategicSagaReserve={reinforceStrategicSaga}
                  onSocialistTransitionStart={launchSocialistWorldTransition}
                  onSocialistSettlement={selectSocialistSettlement}
                  onSocialistTransitionMethod={selectSocialistWorldMethod}
                  onElectionCampaignAction={runElectionCampaignAction}
                  onLaunchReferendum={proposeReferendum}
                  onLaunchStrategicOperation={launchPeacetimeStrategicOperation}
                  onLaunchNationalPlan={launchLongTermNationalPlan}
                  onAdvancePeriod={startPeriodAdvance}
                  periodAdvanceRemaining={periodAdvanceRemaining}
                  onCancelPeriodAdvance={cancelPeriodAdvance}
                  onNavigate={setActiveTab}
                  onEnactCivilization={enactCivilizationProgram}
                  onNextWeek={advanceWeek}
                />
              </Suspense>
            )}
            {activeTab === 'organization' && activeTabMandate.mode === 'direct' && (
              <>
              <FieldWorkspaceSwitch label="조직 작업대 선택" value={organizationWorkspace} onChange={(value) => { setOrganizationWorkspace(value); setFocusedPledgeOwner(undefined); }} items={[{ id: 'squad', label: '참모 스쿼드', detail: '사람 · 배치 · 성장' }, { id: 'market', label: '후보 시장', detail: '탐색 · 조사 · 영입' }, { id: 'meeting', label: '면담·회의', detail: '갈등 · 중재 · 후속 확인' }, ...(campaignPhase === 'nation' ? [{ id: 'pledges' as const, label: '이행 약속', detail: '담당자 · 수량 · 기한' }] : [])]} />
              {organizationWorkspace === 'pledges' && campaignPhase === 'nation' ? <StaffDeliveryPledgeBoard key={`${playerNation.id}:${focusedPledgeOwner?.personId ?? 'all'}`} state={staffDeliveryPledges} context={staffDeliveryContext} forecast={postwarIndustryForecast} routedEquipmentKey={routedEquipmentKey} onCreate={approveStaffDeliveryPledge} initialOwner={focusedPledgeOwner} onOpenProduction={roleMandates.industry.mode === 'direct' ? () => { setIndustryWorkspace('production'); openGameTab('industry'); } : undefined} onOpenLogistics={roleMandates.industry.mode === 'direct' ? () => { setIndustryWorkspace('logistics'); openGameTab('industry'); } : undefined} /> : organizationWorkspace === 'meeting' ? <Suspense fallback={<DeferredSurface label="참모 회의실 준비 중" />}>
                {campaignPhase === 'nation' ? <StaffDeliveryCheckIn state={staffDeliveryPledges} context={staffDeliveryContext} onOpen={(owner) => { setFocusedPledgeOwner(owner); setOrganizationWorkspace('pledges'); }} /> : null}
                <StaffMeetingRoom state={staffNarrative} staff={staff} week={game.week} politicalPower={game.politicalPower} manageableStaffIds={new Set(staff.filter((member) => staffAuthority.managedDepartments.includes(member.department)).map((member) => member.id))} organizationMandate={roleMandates.organization} onResolve={resolveStaffStoryline} onOpenAuthority={() => openGameTab('command')} />
              </Suspense> :
              <Suspense fallback={<DeferredSurface label="조직 운영실 준비 중" />}>
              <OrganizationPanel
                workspace={organizationWorkspace === 'market' ? 'market' : 'squad'}
                onWorkspaceChange={setOrganizationWorkspace}
                hideWorkspaceNavigation
                onOpenDeliveryPledges={campaignPhase === 'nation' && roleMandates.industry.mode === 'direct' ? (staffId) => { const member = staff.find((person) => person.id === staffId); if (!member) return; setFocusedPledgeOwner({ staffId: member.id, personId: member.personId }); setOrganizationWorkspace('pledges'); } : undefined}
                game={game}
                nation={playerNation}
                role={displayedCareerRole}
                campaignPhase={campaignPhase}
                careerReputation={career.reputation}
                busy={periodAdvanceRemaining > 0}
                careerOfferCount={pendingCareerOfferCount}
                careerStatusLabel={careerAffiliationLabels[careerMarket.affiliationStatus]}
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
                staffNarrative={staffNarrative}
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
                onStopScouting={stopCandidateScouting}
                onToggleShortlist={toggleCandidateShortlist}
                onApproachCandidate={approachCandidate}
                onRecruitCandidate={recruitCandidate}
                onRenewStaff={renewStaffContract}
                onResolveStaffNarrative={resolveStaffStoryline}
                onOpenCareerMarket={() => {
                  setPendingCareerOfferId(careerMarket.offers.find((offer) => ['pending', 'exploring', 'negotiating'].includes(offer.status))?.id ?? null);
                  setPendingClandestineMissionId(careerMarket.clandestine?.missions.find((mission) => mission.status === 'offered')?.id ?? null);
                  setCareerMarketInitialView(careerMarket.clandestine?.incident || careerMarket.clandestine?.missions.some((mission) => mission.status === 'offered') ? 'clandestine' : undefined);
                  setShowCareerMarket(true);
                  setPeriodAdvanceRemaining(0);
                  setSpeed(0);
                }}
              />
              </Suspense>}
              </>
            )}
            {activeTab === 'economy' && activeTabMandate.mode === 'direct' && (
              <Suspense fallback={<DeferredSurface label="전시 재무성 장부 준비 중" />}>
                <EconomicMinistry
                  state={economy}
                  game={game}
                  nationId={playerNation.id}
                  relations={relations}
                  staffWeeklyCost={staffWeeklyCost}
                  economyAdvisorBonus={economyAdvisorBonus}
                  nationalLedger={campaignPhase === 'nation' && nationWeekProjection ? {
                    week: nationWeekProjection.report.week,
                    revenue: nationWeekProjection.report.fiscalRevenue,
                    expenditure: nationWeekProjection.report.fiscalExpenditure,
                    balance: nationWeekProjection.report.fiscalBalance,
                    additionalIndustryCost: postwarIndustryForecast?.additionalTreasuryCost ?? 0,
                  } : undefined}
                  onOpenNationalBudget={() => openGameTab('governance', 'budget')}
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
            {activeTab === 'health' && activeTabMandate.mode === 'direct' && (
              <Suspense fallback={<DeferredSurface label="국가 보건 위기실 준비 중" />}>
                <PublicHealthCenter state={publicHealthView} game={game} context={publicHealthContext} onPolicyChange={changePublicHealthPolicy} onInvestment={fundPublicHealthInvestment} busy={periodAdvanceRemaining > 0} formatMoney={formatGameMoney} />
              </Suspense>
            )}
            {activeTab === 'army' && activeTabMandate.mode === 'direct' && (
              <>
              <FieldWorkspaceSwitch label="군사 작업대 선택" value={armyWorkspace} onChange={setArmyWorkspace} items={[{ id: 'operations', label: '작전 현장', detail: '공세 진행 · 실제 결산 · 중단' }, { id: 'forces', label: '편제·합동작전', detail: '부대 · 지휘관 · 육해공 준비' }]} />
              {armyWorkspace === 'operations' ? <Suspense fallback={<DeferredSurface label="작전 현장 준비 중" />}>
                <OperationFieldBoard week={game.week} phase={campaignPhase} orders={orders} reports={battleReports} divisions={divisions} territories={territories} commanders={effectiveCommanders} commandableDivisionIds={commandableDivisionIds} stoppages={operationStoppages} processingWeek={periodAdvanceRemaining > 0} selectedOrderId={selectedFieldOrderId} onSelectOrder={setSelectedFieldOrderId} onStop={stopFieldOperation} onSelectTarget={(id) => { focusMapTerritory(id); openGameTab('map'); }} />
              </Suspense> :
              <ArmyPanel
                game={game}
                campaignPhase={campaignPhase}
                divisions={effectiveDivisions}
                operationalScope={roleOperationalScope}
                commandableDivisionIds={commandableDivisionIds}
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
                onOpenFieldOrder={() => { setSelectedFieldOrderId(orders.find((order) => order.divisionId === selectedDivision.id)?.id); setArmyWorkspace('operations'); }}
                onOpenLocation={() => { focusMapTerritory(selectedDivision.territoryId); openGameTab('map'); }}
                onIssueOffensive={issueOffensive}
                onAssignCommander={assignCommander}
                onTrain={trainDivision}
                onBattleStanceChange={setBattleStance}
                onOpenBattleReport={setPendingBattleReportId}
                onUnlockCommanderSkill={selectCommanderSkill}
                onRestCommander={sendCommanderOnRest}
                jointForces={jointForces}
                activeTheater={activeTheater}
                stockpile={stockpile}
                onLaunchJointOperation={launchCombinedOperation}
                onJointDoctrineChange={changeJointDoctrine}
                onJointForceRefit={toggleJointForceRefit}
                onJointCommandResponse={answerJointCommander}
              />}
              </>
            )}
            {activeTab === 'industry' && activeTabMandate.mode === 'direct' && <>
              {campaignPhase === 'nation' && <FieldWorkspaceSwitch label="산업 작업대 선택" value={industryWorkspace} onChange={setIndustryWorkspace} items={[{ id: 'production', label: '생산선', detail: '공장 배정 · 품목별 상태' }, { id: 'policy', label: '가동·예산', detail: '방침 · 원료 · 실제 결산' }, { id: 'logistics', label: '집하·수송', detail: '예약 · 자동 지시 · 실제 도착' }, { id: 'pledges', label: '이행 약속', detail: '수량 · 기한 · 검증' }]} />}
              {campaignPhase === 'nation' && industryWorkspace === 'pledges' ? <StaffDeliveryPledgeBoard key={playerNation.id} state={staffDeliveryPledges} context={staffDeliveryContext} forecast={postwarIndustryForecast} routedEquipmentKey={routedEquipmentKey} onCreate={approveStaffDeliveryPledge} /> : campaignPhase === 'nation' && industryWorkspace === 'logistics' ? <Suspense fallback={<DeferredSurface label="지역 수송실 준비 중" />}>
                <RegionalIndustryBoard state={regionalIndustry} context={regionalIndustryContext} nationalStockpile={stockpile} onConfigure={configureRegionalLogistics} onPlanShipment={reserveRegionalShipment} onCancelReserved={cancelRegionalShipment} />
              </Suspense> : campaignPhase === 'nation' && industryWorkspace === 'policy' && postwarIndustryInput ? <PostwarIndustryBoard key={playerNation.id} input={postwarIndustryInput} routedEquipmentKey={routedEquipmentKey} lastReport={postwarIndustry.lastReport} canManage={roleMandates.industry.mode === 'direct'} canAuthorizeCash={canAuthorizeIndustryCash} cashAvailable={game.treasury} formatMoney={formatGameMoney} onApprove={approvePostwarIndustrySettings} onPurchase={purchaseIndustryMaterial} onOpenBudget={() => openGameTab('governance', 'budget')} onOpenBriefing={openWeeklyBriefing} /> :
                <ProductionDesk nationId={playerNation.id} week={game.week} production={production} stockpile={stockpile} factories={game.factories} weeklyGains={postwarIndustryForecast?.delivered ?? productionProjection} onAdjust={adjustFactories} postwarForecast={postwarIndustryForecast ?? undefined} routedEquipmentKey={routedEquipmentKey} busy={periodAdvanceRemaining > 0} onOpenPolicy={campaignPhase === 'nation' ? () => setIndustryWorkspace('policy') : undefined} onOpenLogistics={campaignPhase === 'nation' ? () => setIndustryWorkspace('logistics') : undefined} onOpenEquipment={roleMandates.research.mode === 'direct' ? () => { setResearchWorkspace('equipment'); setEquipmentWorkspace('deployment'); openGameTab('research'); } : undefined} />}
            </>}
            {activeTab === 'research' && activeTabMandate.mode === 'direct' && (
              <div className="research-page">
                <FieldWorkspaceSwitch label="연구 작업대 선택" value={researchWorkspace} onChange={setResearchWorkspace} items={[{ id: 'national', label: '국가 연구', detail: '연구 슬롯 · 기술 · 제도' }, { id: 'equipment', label: '장비 개발국', detail: '개발 · 시제 · 제식 · 정비' }]} />
                {researchWorkspace === 'national' ? <ResearchDesk research={research} currentYear={campaignYear} week={game.week} weeklyGain={projectionResearchGain} onToggle={toggleResearch} busy={periodAdvanceRemaining > 0} liaison={scientificLiaisons[playerNation.id]} onOpenEquipment={() => { setEquipmentWorkspace('overview'); setResearchWorkspace('equipment'); }} /> : <Suspense fallback={<DeferredSurface label="통합 장비 개발국 준비 중" />}>
                <EquipmentLab
                  view={equipmentWorkspace}
                  onViewChange={setEquipmentWorkspace}
                  nationId={playerNation.id}
                  game={game}
                  development={equipmentDevelopment}
                  production={production}
                  divisions={effectiveDivisions}
                  weeklyResearchGain={8 + Math.floor(game.factories / 7) + (doctrine === 'methodical' ? 3 : 0) + (delegatedDepartments.has('armaments') ? 2 : 0) + Math.max(0, scienceAdvisorBonus - 1) + (scienceAdvisor?.discipline === 'engineering' ? 1 : 0) + 2}
                  completedDecisions={completedDecisions}
                  armsPortfolio={armsPortfolio}
                  formatMoney={formatGameMoney}
                  onStartResearch={startEquipmentResearch}
                  onCreatePrototype={createEquipmentPrototype}
                  onFieldEquipment={fieldEquipment}
                  onAssignDivisionEquipment={assignDivisionEquipment}
                  onSetMaintenanceDoctrine={setWeaponMaintenanceDoctrine}
                  onSetReplacementPolicy={setWeaponReplacementPolicy}
                  onSetReadinessPriority={setWeaponReadinessPriority}
                  onStartWeaponWorkOrder={startWeaponWorkOrder}
                />
                </Suspense>}
              </div>
            )}
            {activeTab === 'diplomacy' && activeTabMandate.mode === 'direct' && <Suspense fallback={<DeferredSurface label="외교 작업대 준비 중" />}><DiplomacyDesk game={game} relations={relations} setRelations={setRelations} setGame={setGame} notify={notify} nation={playerNation} completedDecisions={completedDecisions} armsPortfolio={armsPortfolio} formatMoney={formatGameMoney} onDecision={enactDecision} onEnactArmsPolicy={enactArmsDiplomacyPolicy} onFundStockpile={fundArmsEmergencyStockpile} onActionCompleted={recordSuccessfulRoleAction} busy={periodAdvanceRemaining > 0} authorized={activeTabMandate.mode === 'direct'} onRecord={(title, detail) => addEvent(title, detail, 'good', game.week)} onOpenJournal={openWarJournal} /></Suspense>}
            {activeTab === 'intelligence' && activeTabMandate.mode === 'direct' && (
              <Suspense fallback={<DeferredSurface label="정보 작업대 준비 중" />}><IntelligenceDesk
                game={game}
                operations={operations}
                setOperations={setOperations}
                setGame={setGame}
                notify={notify}
                addEvent={addEvent}
                nation={playerNation}
                role={displayedCareerRole}
                authorized={activeTabMandate.mode === 'direct'}
                busy={periodAdvanceRemaining > 0}
                activeTheater={activeTheater}
                intelligenceHistory={worldline.intelligenceHistory}
                careerMarket={careerMarket}
                onActionCompleted={recordSuccessfulRoleAction}
                onOpenClandestineDesk={() => {
                  setPendingCareerOfferId(null);
                  setPendingClandestineMissionId(careerMarket.clandestine?.missions.find((mission) => mission.status === 'offered')?.id ?? null);
                  setCareerMarketInitialView('clandestine');
                  setShowCareerMarket(true);
                  setPeriodAdvanceRemaining(0);
                  setSpeed(0);
                }}
              /></Suspense>
            )}
          </div>
        </section>
        )}
      </main>

      {activeTab === 'map' && activeTabMandate.mode === 'direct' && mapSelectionOpen && <section className="selected-province" aria-label={`선택 지역 ${selectedTerritory.name}`} aria-hidden={backgroundInteractionBlocked || undefined} inert={backgroundInteractionBlocked ? true : undefined}>
        <div className={'faction-stripe ' + selectedTerritory.controller} />
        <div className="province-title">
          <span>{selectedIsOperationalHeadquarters ? playerNation.operationalHeadquarters?.label : selectedTerritory.region}</span>
          <h3>{selectedIsOperationalHeadquarters ? `${selectedTerritory.name} · 연합국 주재지` : selectedTerritory.name}</h3>
          <small title={selectedTerritory.historicalNote}>{selectedTerritory.siteType === 'sea' ? `${factionLabels[selectedTerritory.controller]} 해역 우세` : `${factionLabels[selectedTerritory.controller]} 통제`} · {selectedTerritory.terrain}{selectedIsOperationalHeadquarters ? ' · 중국 영토 내 임정 본부' : ''}{selectedFrontSummary ? ` · ${selectedFrontSummary.name}` : ''}</small>
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

      {showBriefing && !showSaveCenter && (
        <CampaignSetup
          nationId={setupNationId}
          roleId={setupRoleId}
          startMode={setupStartMode}
          civilianProfessionId={setupCivilianProfessionId}
          civilianOriginId={setupCivilianOriginId}
          doctrine={doctrine}
          hasSave={hasSave}
          hasManualSaves={manualSaves.length > 0}
          onNationChange={changeSetupNation}
          onRoleChange={setSetupRoleId}
          onStartModeChange={setSetupStartMode}
          onCivilianProfessionChange={setSetupCivilianProfessionId}
          onCivilianOriginChange={setSetupCivilianOriginId}
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
      {showTimeCommandCenter && campaignPhase === 'nation' && !showBriefing && !showTutorial && !campaignOutcome && !pendingAchievementId && !showAchievementGallery && !pendingWorldFlashpoint && !pendingCoupIncident && !showPoliticalCrisis && !pendingCouncilEvent && !pendingBattleReport && !showWorldWeekly && !showWorldHistory && !showCareerMarket && (
        <Suspense fallback={<DeferredSurface label="지휘 주기 분석 중" overlay />}>
          <TimeCommandCenter
            assessment={timeCadenceAssessment}
            options={timeCadenceOptions}
            currentWeek={game.week}
            currentDate={campaignDate.full}
            targetDate={periodAdvanceTargetDate}
            remainingWeeks={periodAdvanceRemaining}
            session={periodAdvanceSession}
            report={latestPeriodAdvanceReport}
            onAdvanceWeek={() => { setShowTimeCommandCenter(false); advanceWeek(); }}
            onStart={startPeriodAdvance}
            onCancel={cancelPeriodAdvance}
            onClose={() => setShowTimeCommandCenter(false)}
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
          onCareerMarket={() => {
            setPendingCareerOfferId(careerMarket.offers.find((offer) => ['pending', 'exploring', 'negotiating'].includes(offer.status))?.id ?? null);
            setPendingClandestineMissionId(careerMarket.clandestine?.missions.find((mission) => mission.status === 'offered')?.id ?? null);
            setCareerMarketInitialView(careerMarket.clandestine ? 'clandestine' : 'inbox');
            setShowCareerMarket(true);
          }}
          onRestart={resetCampaign}
        />
      )}
      {showCareerMarket && !showBriefing && (
        <Suspense fallback={<DeferredSurface label="국제 경력·비밀 접촉실 준비 중" overlay />}>
          <CareerMarketCenter
            state={careerMarket}
            currentNationId={playerNation.id}
            role={displayedCareerRole}
            week={game.week}
            intelNetwork={game.intelNetwork}
            formatMoney={formatGameMoney}
            canTurnApproach={careerRole.branch === 'intelligence' || game.intelNetwork >= 68}
            initialOfferId={pendingCareerOfferId}
            initialView={careerMarketInitialView}
            initialMissionId={pendingClandestineMissionId}
            onRespond={respondToForeignCareerOffer}
            onApproach={approachForeignCareerMarket}
            onClandestineMissionResponse={respondToHandlerMission}
            onClandestineIncidentResponse={respondToSecretIdentityIncident}
            onClandestinePostureChange={changeClandestinePosture}
            onClose={() => {
              setShowCareerMarket(false);
              setPendingCareerOfferId(null);
              setPendingClandestineMissionId(null);
              setCareerMarketInitialView(undefined);
            }}
          />
        </Suspense>
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
        <BattleReportModal
          key={pendingBattleReport.id}
          report={pendingBattleReport}
          nationId={playerNation.id}
          onRecognize={recognizeBattleAchievement}
          onClose={() => setPendingBattleReportId(null)}
        />
      )}
      {showJournal && journalView === 'briefing' && (
        <WeeklyBriefingDialog week={game.week} date={campaignDate.full} events={events} issue={latestWorldWeeklyIssue} actions={uxActions}
          onAcknowledge={acknowledgeWeeklyBriefing} onClose={() => setShowJournal(false)} onJournal={openWarJournal}
          onNewspaper={() => { setShowJournal(false); openWorldWeekly(); }}
          onActions={() => { setShowJournal(false); setShowActionCenter(true); }} />
      )}
      {showJournal && journalView === 'history' && (
        <WarJournal
          events={events}
          worldChanges={worldChangeProfile}
          worldline={{
            code: worldline.code,
            outcomeId: worldline.outcomeId,
            legacySignature: worldline.legacySignature,
            title: worldline.title,
            summary: worldline.summary,
            divergenceCount: worldline.divergenceCount,
            dominantForce: historyForceLabels[historyTrajectory.dominantForce],
            secondaryForce: historyForceLabels[historyTrajectory.secondaryForce],
            programTitle: playerNation.paths.find((program) => program.id === career.alternatePathId)?.title ?? '아직 채택하지 않음',
          }}
          onClose={() => setShowJournal(false)}
        />
      )}
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
          <TutorialOverlay nationId={playerNation.id} role={careerRole} civilian={civilianCareerActive ? career.civilian : undefined} onNavigate={setActiveTab} onComplete={completeTutorial} />
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

function MapBoard({ territories, divisions, orders, selectedTerritoryId, planningMode, layer, labelMode, theater, intelNetwork, playerFaction, operationalHeadquarters, enemyIntentTargetId, planningOriginId, camera, fronts, worldChanges, onCameraChange, onZoom, onSelect }: {
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
  enemyIntentTargetId?: string;
  planningOriginId?: string;
  camera: MapCamera;
  fronts: FrontSummary[];
  worldChanges: WorldChangeProfile;
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
      const hasLayerReading = layer === 'political' || layer === 'supply' || layer === 'intelligence' || layer === 'history';
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
          const historyShift = layer === 'history' && (getTerritoryWorldChange(worldChanges, from.id) || getTerritoryWorldChange(worldChanges, to.id));
          return (
            <line
              key={`${from.id}-${to.id}`}
              className={`${isFront ? 'front-contact' : ''}${selectedRoute ? ' selected-route' : ''}${validPlanRoute ? ' valid-plan-route' : ''}${historyShift ? ' history-shift-route' : ''}`}
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
        const isEnemyIntentTarget = enemyIntentTargetId === territory.id;
        const labelTier = territory.labelTier ?? 2;
        const markerPresentation = markerPresentations.get(territory.id)!;
        const worldChange = getTerritoryWorldChange(worldChanges, territory.id);
        return (
          <g
            key={territory.id}
            className={'territory-marker label-tier-' + labelTier + ' site-' + (territory.siteType ?? 'region') + ' ' + territory.controller + (selected ? ' selected' : '') + (isOperationalHeadquarters ? ' operational-headquarters' : '') + (isEnemyIntentTarget ? ' enemy-intent-target' : '') + (markerPresentation.secondary ? ' secondary-marker' : '') + (territory.supply < 50 ? ' low-supply' : '') + (isPlanningOrigin ? ' planning-origin' : '') + (isValidTarget ? ' valid-target' : '') + (isUnavailableTarget ? ' unavailable-target' : '') + (layer === 'history' && worldChange ? ` history-changed history-${worldChange.kind}` : '')}
            transform={'translate(' + x + ' ' + y + ')'}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(territory.id)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onSelect(territory.id);
            }}
              aria-label={`${territory.name}, ${factionLabels[territory.controller]} ${territory.siteType === 'sea' ? '해역 우세' : '통제'}, ${territory.terrain}, 보급 ${territory.supply}%${isOperationalHeadquarters ? `, ${operationalHeadquarters.label}` : ''}${isEnemyIntentTarget ? ', 적 작전 예상 목표' : ''}`}
          >
            {isValidTarget && <circle className="valid-target-ring" r="30" />}
            {isEnemyIntentTarget && <circle className="enemy-intent-ring" r="27" />}
            {layer === 'history' && worldChange ? <circle className="history-change-ring" r={23 + worldChange.intensity * .08} /> : null}
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
                {layer === 'history' && worldChange ? <text className={`layer-reading history-reading ${worldChange.tone}`} y="31">{worldChange.before} → {worldChange.after}</text> : null}
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
          const operationProfile = battleTypeProfiles[order.battleType ?? 'attrition'];
          const operationProgress = getOperationProgress(order);
          return (
            <div className="queued-order" key={order.divisionId + '-' + order.targetId + '-' + order.startedWeek}>
              <i>{index + 1}</i><div><strong>{division?.name}</strong><span>목표: {target?.name} · {operationProfile.shortLabel} · {stanceLabel}</span><small><b style={{ width: `${operationProgress}%` }} /> 진척 {operationProgress}% · {order.elapsedWeeks ?? 0}/{order.maxWeeks ?? operationProfile.maximumWeeks}주</small></div><em>{index === 0 ? '교전 중' : '대기'}</em>
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

function ArmyPanel({ game, campaignPhase, divisions, operationalScope, commandableDivisionIds, selectedDivision, selectedEquipmentName, selectedCommander, selectedCommanderDevelopment, commanders, territories, orders, battleStance, battleReports, onSelectDivision, onOpenFieldOrder, onOpenLocation, onIssueOffensive, onAssignCommander, onTrain, onBattleStanceChange, onOpenBattleReport, onUnlockCommanderSkill, onRestCommander, jointForces, activeTheater, stockpile, onLaunchJointOperation, onJointDoctrineChange, onJointForceRefit, onJointCommandResponse }: {
  game: GameState;
  campaignPhase: CampaignPhase;
  divisions: Division[];
  operationalScope: RoleOperationalScope;
  commandableDivisionIds: ReadonlySet<string>;
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
  onOpenFieldOrder: () => void;
  onOpenLocation: () => void;
  onIssueOffensive: () => void;
  onAssignCommander: (divisionId: string, commanderId: string) => void;
  onTrain: (divisionId: string) => void;
  onBattleStanceChange: (stance: BattleStance) => void;
  onOpenBattleReport: (reportId: string) => void;
  onUnlockCommanderSkill: (skillId: CommanderSkillId) => void;
  onRestCommander: () => void;
  jointForces: JointForcesState;
  activeTheater: TheaterId;
  stockpile: Stockpile;
  onLaunchJointOperation: (templateId: string, fleetIds: string[], airGroupIds: string[], objectiveId?: string) => void;
  onJointDoctrineChange: (doctrine: JointDoctrine) => void;
  onJointForceRefit: (forceId: string) => void;
  onJointCommandResponse: (messageId: string, response: JointCommandResponse) => void;
}) {
  const [serviceView, setServiceView] = useState<'land' | JointOperationsView>('joint');
  const [landView, setLandView] = useState<'unit' | 'commander' | 'reports'>('unit');
  const location = territories.find((territory) => territory.id === selectedDivision.territoryId);
  const canCommandSelectedDivision = commandableDivisionIds.has(selectedDivision.id);
  const divisionOrder = orders.find((order) => order.divisionId === selectedDivision.id);
  const effectiveDivisionOrderStance = divisionOrder?.stance ?? battleStance;
  const divisionOrderStance = effectiveDivisionOrderStance === 'cautious' ? '신중한 공세' : effectiveDivisionOrderStance === 'aggressive' ? '총공세' : '균형 공세';
  const jointPlanningDisabledReason = campaignPhase === 'nation'
    ? '종전 뒤 해외 군사행동은 국가 운영의 평시 전략작전에서 정치·외교 승인을 받아야 합니다.'
    : operationalScope.level === 'national' || operationalScope.level === 'theater'
      ? undefined
      : `${operationalScope.label}: 함대·항공대 교리와 합동작전은 상급 전구사령부에 상신해야 합니다.`;
  return (
    <div className="combined-forces-page capability-desk command-forces-v2">
      <nav className="service-command-tabs" aria-label="군종 및 합동작전 화면">
        <button type="button" className={serviceView === 'joint' ? 'active' : ''} aria-pressed={serviceView === 'joint'} onClick={() => setServiceView('joint')}><Zap size={16} /><span><strong>합동작전</strong><small>{jointForces.operations.length ? `${jointForces.operations.length}건 진행` : '작전 계획'}</small></span></button>
        <button type="button" className={serviceView === 'land' ? 'active' : ''} aria-pressed={serviceView === 'land'} onClick={() => setServiceView('land')}><Swords size={16} /><span><strong>육군</strong><small>{divisions.length}개 사단</small></span></button>
        <button type="button" className={serviceView === 'naval' ? 'active' : ''} aria-pressed={serviceView === 'naval'} onClick={() => setServiceView('naval')}><Anchor size={16} /><span><strong>해군</strong><small>{jointForces.fleets.length}개 함대</small></span></button>
        <button type="button" className={serviceView === 'air' ? 'active' : ''} aria-pressed={serviceView === 'air'} onClick={() => setServiceView('air')}><Plane size={16} /><span><strong>공군</strong><small>{jointForces.airGroups.length}개 항공대</small></span></button>
      </nav>
      {serviceView !== 'land' ? (
        <Suspense fallback={<DeferredSurface label="합동작전 전력표 준비 중" />}>
          <JointOperationsBoard
            view={serviceView}
            state={jointForces}
            theater={activeTheater}
            game={game}
            stockpile={stockpile}
            onLaunch={onLaunchJointOperation}
            onDoctrineChange={onJointDoctrineChange}
            onRefit={onJointForceRefit}
            onCommandResponse={onJointCommandResponse}
            planningDisabledReason={jointPlanningDisabledReason}
          />
        </Suspense>
      ) : (
      <div className="army-layout">
      <LandForceRoster divisions={divisions} commanders={commanders} territories={territories} selectedId={selectedDivision.id} commandableIds={commandableDivisionIds} scope={operationalScope} onSelect={onSelectDivision} />
      <div className="land-detail-workspace">
      <nav className="land-detail-navigation" aria-label="선택 부대 업무"><button type="button" aria-pressed={landView === 'unit'} onClick={() => setLandView('unit')}>부대 현황</button><button type="button" aria-pressed={landView === 'commander'} onClick={() => setLandView('commander')}>지휘관·훈련</button><button type="button" aria-pressed={landView === 'reports'} onClick={() => setLandView('reports')}>교리·전투 기록</button></nav>
      {landView === 'unit' ? <>

      <section className="deck-section division-detail">
        <div className="division-banner">
          <div className={'large-unit-icon ' + typeMeta[selectedDivision.type].className}>{typeMeta[selectedDivision.type].symbol}</div>
          <div><span>{typeMeta[selectedDivision.type].label}사단 · {location?.region}</span><h3>{selectedDivision.name}</h3><small>{location?.name} 주둔</small></div>
          <button className="order-button" onClick={onIssueOffensive} disabled={campaignPhase === 'nation' || selectedDivision.status !== 'ready' || !canCommandSelectedDivision} title={campaignPhase === 'nation' ? '국가 운영 단계의 영토 공세는 직접 집행할 수 없습니다.' : !canCommandSelectedDivision ? '현재 보직의 예하 편제가 아니므로 전황만 열람할 수 있습니다.' : selectedDivision.status === 'ready' ? '인접 적 지역에 공세를 계획합니다.' : '준비 상태의 사단만 공세 명령을 받을 수 있습니다.'}><Crosshair size={15} /> {campaignPhase === 'nation' ? '평시 국방 태세' : canCommandSelectedDivision ? '공세 계획' : '상급 관할'}</button>
        </div>
        {divisionOrder && <div className="active-order-notice"><Zap size={15} /><span>{territories.find((item) => item.id === divisionOrder.targetId)?.name} · {divisionOrderStance} 진행</span><button type="button" onClick={onOpenFieldOrder}>작전 진행 보기</button></div>}
        <div className="division-metrics">
          <Metric label="병력 전력" value={selectedDivision.strength} icon={<Users size={14} />} tone="green" />
          <Metric label="조직력" value={selectedDivision.organization} icon={<Shield size={14} />} />
          <Metric label="보급 상태" value={selectedDivision.supply} icon={<Cog size={14} />} tone="gold" />
          <Metric label="전투 경험" value={selectedDivision.experience} icon={<Star size={14} />} tone="gold" />
        </div>
        <div className="equipment-grid">
          <div><span>제식 장비 패키지</span><strong>{selectedEquipmentName}</strong><small>전투 계산 적용 중</small></div>
          <div><span>실제 주둔지</span><strong>{location?.name ?? '위치 확인 필요'}</strong><button type="button" onClick={onOpenLocation}>지도에서 확인</button></div>
          <div><span>명령 상태</span><strong>{divisionOrder ? '현재 작전 배속' : selectedDivision.status === 'ready' ? '새 명령 가능' : selectedDivision.status === 'recovering' ? '재편 중' : selectedDivision.status === 'combat' ? '교전 중' : '이동 중'}</strong><small>명령과 전력 상태에서 확인한 정보</small></div>
        </div>
      </section>
      </> : landView === 'commander' ? <>
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
            <select value={selectedCommander.id} disabled={!canCommandSelectedDivision} onChange={(event) => onAssignCommander(selectedDivision.id, event.target.value)}>
              {commanders.map((commander) => <option key={commander.id} value={commander.id}>{commander.name} · {commander.command}</option>)}
            </select>
          </label>
          <button onClick={() => onTrain(selectedDivision.id)} disabled={!canCommandSelectedDivision || game.commandPoints < 8 || game.manpower < 12 || selectedDivision.status !== 'ready'} title={!canCommandSelectedDivision ? '현재 보직의 예하 편제가 아닙니다.' : selectedDivision.status !== 'ready' ? '준비 상태의 사단만 훈련할 수 있습니다.' : game.commandPoints < 8 || game.manpower < 12 ? '지휘 점수 8과 인력 12K가 필요합니다.' : '조직력 +7·경험 +5·전력 +2(각 최대 100), 재편 상태로 전환합니다.'}><TrendingUp size={13} /> 야전 훈련 <em>8 CP · 인력 12K</em></button>
        </div>
      </section>
      <CommanderDevelopmentPanel
        commander={selectedCommander}
        development={selectedCommanderDevelopment}
        division={selectedDivision}
        commandPoints={game.commandPoints}
        managementLockedReason={canCommandSelectedDivision ? undefined : '상급 지휘부 관할 · 성장 방침과 휴양은 열람만 가능'}
        onUnlockSkill={onUnlockCommanderSkill}
        onRestCommander={onRestCommander}
      />
      </> : <BattleDoctrinePanel stance={battleStance} reports={battleReports} onStanceChange={onBattleStanceChange} onOpenReport={onOpenBattleReport} />}
      </div>
      </div>
      )}
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



function CampaignOutcomeModal({ outcome, game, territories, nation, playerFaction, ending, endingCount, onJournal, onWorldHistory, onContinueNation, onCareerMarket, onRestart }: {
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
  onCareerMarket: () => void;
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
        <p>{isVictory ? '원래 역사에는 없던 세력 균형이 탄생했습니다. 이제 당신이 선택한 국가 진로가 전후 세계의 규칙이 됩니다.' : '전쟁 수행 능력과 지도부 신임이 임계점 아래로 떨어져 해임됐습니다. 그러나 같은 세계선에서 다른 국가의 보직·망명정부·정보기관으로 경력을 이어갈 수 있습니다.'}</p>
        <div className="outcome-ending">
          <span>{endingCount}개 사료 기반 결말 중 도달 · 적합도 {ending.fitScore}</span>
          <strong>{ending.orderName} · {ending.settlementName} · {ending.horizonName}</strong>
          <p>{ending.summary}</p>
        </div>
        <div className="outcome-epilogue-grid" aria-label="대체역사 다축 에필로그">
          {ending.epilogueChapters.map((chapter) => <article key={chapter.id}><span>{chapter.label}</span><strong>{chapter.title}</strong><p>{chapter.detail}</p></article>)}
        </div>
        {ending.decisiveChoices.length > 0 && <div className="outcome-decisive-choices">
          <span className="eyebrow">YOUR DECISIVE CHOICES</span>
          <h3>이 세계를 만든 결정</h3>
          {ending.decisiveChoices.slice(0, 5).map((choice) => <article key={`${choice.year}-${choice.eventTitle}`}><time>{choice.year}</time><div><strong>{choice.eventTitle} — {choice.choiceTitle}</strong><p>{choice.consequence}</p></div><em>{choice.axisImpact}</em></article>)}
        </div>}
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
          {!isVictory && <button className="primary continue-nation" onClick={onCareerMarket}><BriefcaseBusiness size={15} /> 국제 경력 시장에서 계속</button>}
          <button onClick={onRestart}><RotateCcw size={15} /> 새 캠페인</button>
        </div>
      </section>
    </div>
  );
}
