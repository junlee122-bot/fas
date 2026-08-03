import { useState } from 'react';
import {
  ArrowRight,
  Activity,
  Building2,
  CalendarClock,
  Castle,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Factory,
  GraduationCap,
  Handshake,
  Heart,
  HeartHandshake,
  Home,
  Landmark,
  LockKeyhole,
  Mic,
  Minus,
  Newspaper,
  Plus,
  Scale,
  ScrollText,
  ShieldCheck,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import type { CivilizationPath, CivilizationProgram } from './civilizationSystems';
import {
  canAdoptGovernmentForm,
  canManageDynasticPolitics,
  getDynasticWeeklyEffects,
  getGovernmentForm,
  getMarriageCandidates,
  getSuccessionLawName,
  governmentForms,
  nobleRanks,
  type DynasticActionContext,
  type GovernmentFormId,
  type NobleRankId,
  type SuccessionLawId,
} from './dynasticPolitics';
import type { EconomyState } from './economy';
import { ElectionSituationRoom } from './ElectionSituationRoom';
import type { ElectionCampaignActionId, ReferendumTopicId } from './electoralPolitics';
import {
  canFormalizeUnion,
  canReformFamilyLaw,
  familyLawDefinitions,
  familyPlanDefinitions,
  getEraFamilyClimate,
  getFamilyLaw,
  getGenderLabel,
  getOrientationLabel,
  getPairKindLabel,
  getPersonalRelationshipCandidates,
  getUnionFormLabel,
  getVisibilityLabel,
  personalLifeActionDefinitions,
  type FamilyLawId,
  type FamilyPlanId,
  type GenderIdentity,
  type OrientationId,
  type PartnerTermPreference,
  type PersonalIdentityProfile,
  type PersonalLifeActionId,
  type PersonalLifeContext,
  type RelationshipBoundary,
  type RelationshipVisibility,
  type UnionForm,
} from './personalLife';
import {
  calculateDisclosureRisk,
  canReformMediaLaw,
  exposureResponseDefinitions,
  getExposureStageLabel,
  getMediaLaw,
  interviewResponseDefinitions,
  mediaLawDefinitions,
  mediaTopicDefinitions,
  previewInterviewResponse,
  type ExposureResponseId,
  type InterviewResponseId,
  type MediaLawId,
  type MediaRelationsContext,
  type MediaTopicId,
} from './mediaRelations';
import { NationalSimulationOverview } from './NationalSimulationOverview';
import type { NationalSimulationSnapshot } from './nationalSimulation';
import { PowerNetworkBoard } from './PowerNetworkBoard';
import { StrategicSagaBoard } from './StrategicSagaBoard';
import { SocialistWorldBoard } from './SocialistWorldBoard';
import type {
  LeadershipPrincipleId,
  LegacyPathId,
  OpportunityChoiceId,
  PowerBlocId,
  PowerNetworkContext,
  RivalActionId,
} from './powerNetwork';
import type { SagaApproachId, SagaChampion, StrategicSagaContext } from './strategicSaga';
import type { SocialistModelId, SocialistSettlementId, SocialistTransitionMethodId, SocialistTransitionSponsor, SocialistWorldContext } from './socialistWorld';
import {
  getAvailableStrategicOperations,
  nationalPlanDefinitions,
  strategicOperationDefinitions,
  type NationalPlanId,
} from './strategicContinuity';
import {
  getActiveNationAgenda,
  getStructuralPressureLever,
  nationBudgetDefinitions,
  nationStrategies,
  type CampaignPhase,
  type NationBudgetDomain,
  type NationManagementState,
  type NationStrategyId,
  type NationTransitionReason,
} from './nationManagement';
import type { NationAgendaChoiceId } from './nationDevelopment';
import type { CareerRole, DiplomaticRelation, GameState, GameTab, NationProfile, StaffMember, Territory } from './types';

interface TransitionReadiness {
  score: number;
  eligible: boolean;
  threshold: number;
  stabilityFloor: number;
  earliestWeek: number;
  transitionLabel: string;
  transitionDescription: string;
  blockedReasons: string[];
  pillars: {
    security: number;
    legitimacy: number;
    finance: number;
    industry: number;
    diplomacy: number;
    sovereignty: number;
  };
}

interface NationManagementPanelProps {
  phase: CampaignPhase;
  state: NationManagementState;
  game: GameState;
  economy: EconomyState;
  nation: NationProfile;
  role: CareerRole;
  staff: StaffMember[];
  territories: Territory[];
  relations: DiplomaticRelation[];
  nationalSimulation: NationalSimulationSnapshot;
  completedDecisions: string[];
  completedResearch: number;
  publicHealthPressure: number;
  worldlineTitle: string;
  readiness: TransitionReadiness;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onTransition: (reason: NationTransitionReason) => void;
  onBudgetChange: (domain: NationBudgetDomain, delta: -5 | 5) => void;
  onTaxChange: (delta: -5 | 5) => void;
  onSpendingChange: (delta: -5 | 5) => void;
  onStrategyChange: (strategyId: NationStrategyId) => void;
  onNationAgendaChoice: (choiceId: NationAgendaChoiceId) => void;
  onGovernmentFormChange: (formId: GovernmentFormId) => void;
  onGrantTitle: (input: { recipientId: string; rankId: NobleRankId; domainId: string }) => void;
  onRevokeTitle: (grantId: string) => void;
  onArrangeMarriage: (nationId: string) => void;
  onSuccessionLawChange: (lawId: SuccessionLawId) => void;
  onConfigurePersonalLife: (profile: Omit<PersonalIdentityProfile, 'configured'>) => void;
  onStartPersonalRelationship: (candidateId: string) => void;
  onFormalizeRelationship: (unionForm: UnionForm, visibility: RelationshipVisibility) => void;
  onFamilyLawChange: (lawId: FamilyLawId) => void;
  onPersonalLifeAction: (actionId: PersonalLifeActionId) => void;
  onFamilyPlanChange: (familyPlanId: FamilyPlanId) => void;
  onMediaLawChange: (lawId: MediaLawId) => void;
  onRequestMediaInterview: (topicId: MediaTopicId) => void;
  onAnswerMediaInterview: (responseId: InterviewResponseId) => void;
  onAnswerExposure: (responseId: ExposureResponseId) => void;
  onLeadershipPrinciplesChange: (principles: LeadershipPrincipleId[]) => void;
  onPowerBlocPromise: (blocId: PowerBlocId) => void;
  onLegacyPathChange: (pathId: LegacyPathId) => void;
  onRivalAction: (actionId: RivalActionId) => void;
  onPowerOpportunityChoice: (choiceId: OpportunityChoiceId) => void;
  onStrategicSagaStart: (definitionId: string, champion: SagaChampion) => void;
  onStrategicSagaApproach: (approachId: SagaApproachId) => void;
  onStrategicSagaReserve: () => void;
  onSocialistTransitionStart: (modelId: SocialistModelId, sponsor: SocialistTransitionSponsor) => void;
  onSocialistSettlement: (settlementId: SocialistSettlementId) => void;
  onSocialistTransitionMethod: (methodId: SocialistTransitionMethodId) => void;
  onElectionCampaignAction: (actionId: ElectionCampaignActionId, regionId: string | null) => void;
  onLaunchReferendum: (topicId: ReferendumTopicId) => void;
  onLaunchStrategicOperation: (operationId: string) => void;
  onLaunchNationalPlan: (planId: NationalPlanId) => void;
  onAdvancePeriod: (weeks: 4 | 13) => void;
  periodAdvanceRemaining: number;
  onCancelPeriodAdvance: () => void;
  onNavigate: (tab: GameTab) => void;
  onEnactCivilization: (program: CivilizationProgram, path: CivilizationPath) => void;
  onNextWeek: () => void;
}

const budgetIcons: Record<NationBudgetDomain, typeof Building2> = {
  reconstruction: Building2,
  welfare: HeartHandshake,
  education: GraduationCap,
  industry: Factory,
  diplomacy: Handshake,
  security: ShieldCheck,
};

function MetricBar({ value, danger = false }: { value: number; danger?: boolean }) {
  return <span className={`nation-metric-bar ${danger ? 'danger' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function SignedValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return <span className={positive ? 'positive' : 'negative'}>{positive ? '+' : ''}{value.toFixed(1)}{suffix}</span>;
}

export function NationManagementPanel({
  phase,
  state,
  game,
  economy,
  nation,
  role,
  staff,
  territories,
  relations,
  nationalSimulation,
  completedDecisions,
  completedResearch,
  publicHealthPressure,
  worldlineTitle,
  readiness,
  formatMoney,
  onTransition,
  onBudgetChange,
  onTaxChange,
  onSpendingChange,
  onStrategyChange,
  onNationAgendaChoice,
  onGovernmentFormChange,
  onGrantTitle,
  onRevokeTitle,
  onArrangeMarriage,
  onSuccessionLawChange,
  onConfigurePersonalLife,
  onStartPersonalRelationship,
  onFormalizeRelationship,
  onFamilyLawChange,
  onPersonalLifeAction,
  onFamilyPlanChange,
  onMediaLawChange,
  onRequestMediaInterview,
  onAnswerMediaInterview,
  onAnswerExposure,
  onLeadershipPrinciplesChange,
  onPowerBlocPromise,
  onLegacyPathChange,
  onRivalAction,
  onPowerOpportunityChoice,
  onStrategicSagaStart,
  onStrategicSagaApproach,
  onStrategicSagaReserve,
  onSocialistTransitionStart,
  onSocialistSettlement,
  onSocialistTransitionMethod,
  onElectionCampaignAction,
  onLaunchReferendum,
  onLaunchStrategicOperation,
  onLaunchNationalPlan,
  onAdvancePeriod,
  periodAdvanceRemaining,
  onCancelPeriodAdvance,
  onNavigate,
  onEnactCivilization,
  onNextWeek,
}: NationManagementPanelProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedRankId, setSelectedRankId] = useState<NobleRankId>('baron');
  const [selectedMarriageNationId, setSelectedMarriageNationId] = useState('');
  const [identityGender, setIdentityGender] = useState<GenderIdentity>(state.personalLife.profile.gender);
  const [identityOrientation, setIdentityOrientation] = useState<OrientationId>(state.personalLife.profile.orientation);
  const [partnerTerm, setPartnerTerm] = useState<PartnerTermPreference>(state.personalLife.profile.partnerTerm);
  const [relationshipBoundary, setRelationshipBoundary] = useState<RelationshipBoundary>(state.personalLife.profile.boundary);
  const [selectedPersonalCandidateId, setSelectedPersonalCandidateId] = useState('');
  const [selectedUnionForm, setSelectedUnionForm] = useState<UnionForm>('marriage');
  const [selectedRelationshipVisibility, setSelectedRelationshipVisibility] = useState<RelationshipVisibility>('private');
  const [selectedFamilyPlanId, setSelectedFamilyPlanId] = useState<FamilyPlanId>('undecided');
  const [selectedMediaTopicId, setSelectedMediaTopicId] = useState<MediaTopicId>('national-vision');
  const latestReport = state.reports[0] ?? null;
  const activeAgenda = getActiveNationAgenda(state);
  const transitionReasonLabel: Record<NationTransitionReason, string> = {
    victory: '승전 계승 체제',
    negotiated: '협상 종전 체제',
    liberation: '해방 건국 체제',
    independence: '독립 주권이양 체제',
    restoration: '정부 복원 체제',
    'regime-collapse': '전쟁체제 재건국',
  };
  const localizeMoney = (text: string) => text.replace(/([+−-]?)£([\d.]+)M/g, (_match, sign: string, amount: string) => formatMoney(Number(amount) * (sign === '−' || sign === '-' ? -1 : 1), { signed: sign === '+' }));
  const electionWeeks = Math.max(0, state.nextElectionWeek - game.week);
  const currentStrategy = nationStrategies.find((strategy) => strategy.id === state.strategyId) ?? nationStrategies[0];
  const currentGovernmentForm = getGovernmentForm(state.dynasty.formId);
  const dynasticEffects = getDynasticWeeklyEffects(state.dynasty);
  const dynasticAuthority = canManageDynasticPolitics(role);
  const dynasticContext: DynasticActionContext = {
    week: game.week,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: state.legitimacy,
    role,
  };
  const availableRecipients = staff.filter((member) => !state.dynasty.titleGrants.some((grant) => grant.recipientId === member.id));
  const availableDomains = territories
    .filter((territory) => (territory.ownerId === nation.id || territory.id === nation.capitalTerritoryId || nation.strategicTargets.includes(territory.id)) && territory.siteType !== 'sea')
    .filter((territory, index, list) => list.findIndex((candidate) => candidate.id === territory.id) === index)
    .filter((territory) => !state.dynasty.titleGrants.some((grant) => grant.domainId === territory.id))
    .slice(0, 12);
  const selectedRecipient = availableRecipients.find((member) => member.id === selectedRecipientId) ?? availableRecipients[0] ?? null;
  const selectedDomain = availableDomains.find((territory) => territory.id === selectedDomainId) ?? availableDomains[0] ?? null;
  const marriageCandidates = getMarriageCandidates(relations).filter((candidate) => !state.dynasty.marriages.some((marriage) => marriage.partnerNationId === candidate.nationId));
  const selectedMarriage = marriageCandidates.find((candidate) => candidate.nationId === selectedMarriageNationId) ?? marriageCandidates[0] ?? null;
  const currentYear = 1942 + Math.floor(game.week / 52);
  const personalLifeContext: PersonalLifeContext = {
    week: game.week,
    year: currentYear,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: state.legitimacy,
    education: state.education,
    institutionalCapacity: state.institutionalCapacity,
    role,
  };
  const personalCandidates = getPersonalRelationshipCandidates(state.personalLife, [
    { id: nation.id, name: nation.shortName, relationValue: 70 },
    ...relations.map((relation) => ({ id: relation.id, name: relation.name, relationValue: relation.value })),
  ]);
  const selectedPersonalCandidate = personalCandidates.find((candidate) => candidate.id === selectedPersonalCandidateId) ?? personalCandidates[0] ?? null;
  const activePersonalRelationship = state.personalLife.activeRelationship;
  const currentFamilyLaw = getFamilyLaw(state.personalLife.familyLawId);
  const eraFamilyClimate = getEraFamilyClimate(currentYear);
  const unionEligibility = canFormalizeUnion(state.personalLife, selectedUnionForm);
  const mediaContext: MediaRelationsContext = {
    week: game.week,
    year: currentYear,
    role,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    education: state.education,
    institutionalCapacity: state.institutionalCapacity,
    inflation: economy.inflation,
    publicConfidence: economy.publicConfidence,
    intelNetwork: game.intelNetwork,
    governmentFormId: state.dynasty.formId,
    strategyId: state.strategyId,
    activeElection: Boolean(state.electoral.activeCampaign),
    personalLife: state.personalLife,
  };
  const currentMediaLaw = getMediaLaw(state.mediaRelations.lawId);
  const disclosureRisk = calculateDisclosureRisk(state.mediaRelations, mediaContext);
  const pendingInterview = state.mediaRelations.pendingInterview;
  const activeExposure = state.mediaRelations.activeExposure;
  const availableStrategicOperations = getAvailableStrategicOperations(state.strategicContinuity, role, currentYear);
  const activeStrategicDefinition = strategicOperationDefinitions.find((definition) => definition.id === state.strategicContinuity.active?.id) ?? null;
  const activePlanDefinition = nationalPlanDefinitions.find((definition) => definition.id === state.nationalPlanning.active?.id) ?? null;
  const powerNetworkContext: PowerNetworkContext = {
    week: game.week,
    year: currentYear,
    phase,
    nationId: nation.id,
    role,
    strategyId: state.strategyId,
    budget: state.budget,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    warSupport: game.warSupport,
    enemyPressure: game.enemyPressure,
    intelNetwork: game.intelNetwork,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    welfare: state.welfare,
    education: state.education,
    employment: state.employment,
    civilianIndustry: state.civilianIndustry,
    institutionalCapacity: state.institutionalCapacity,
    inequality: state.inequality,
    relativeCompetitiveness: state.relativeCompetitiveness,
    relationAverage: relations.length > 0 ? relations.reduce((sum, relation) => sum + relation.value, 0) / relations.length : 50,
    inflation: economy.inflation,
    publicConfidence: economy.publicConfidence,
    mediaFreedom: state.mediaRelations.freedom,
    pressTrust: state.mediaRelations.pressTrust,
    activeElection: Boolean(state.electoral.activeCampaign),
  };
  const strategicSagaContext: StrategicSagaContext = {
    week: game.week,
    year: currentYear,
    phase,
    nationId: nation.id,
    role,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    warSupport: game.warSupport,
    enemyPressure: game.enemyPressure,
    intelNetwork: game.intelNetwork,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    education: state.education,
    civilianIndustry: state.civilianIndustry,
    institutionalCapacity: state.institutionalCapacity,
    relativeCompetitiveness: state.relativeCompetitiveness,
    relationAverage: relations.length > 0 ? relations.reduce((sum, relation) => sum + relation.value, 0) / relations.length : 50,
    publicConfidence: economy.publicConfidence,
    inflation: economy.inflation,
    completedResearch,
    publicHealthPressure,
    coalitionSupport: state.powerNetwork.blocs.reduce((sum, bloc) => sum + bloc.support, 0) / Math.max(1, state.powerNetwork.blocs.length),
    promiseReliability: state.powerNetwork.promiseReliability,
  };
  const blocById = new Map(state.powerNetwork.blocs.map((bloc) => [bloc.id, bloc]));
  const socialistWorldContext: SocialistWorldContext = {
    week: game.week,
    year: currentYear,
    phase,
    nationId: nation.id,
    role,
    politicalPower: game.politicalPower,
    treasury: game.treasury,
    stability: game.stability,
    warSupport: game.warSupport,
    enemyPressure: game.enemyPressure,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    welfare: state.welfare,
    employment: state.employment,
    inequality: state.inequality,
    education: state.education,
    civilianIndustry: state.civilianIndustry,
    institutionalCapacity: state.institutionalCapacity,
    publicConfidence: economy.publicConfidence,
    inflation: economy.inflation,
    relationAverage: relations.length > 0 ? relations.reduce((sum, relation) => sum + relation.value, 0) / relations.length : 50,
    laborSupport: blocById.get('labor')?.support ?? 50,
    laborInfluence: blocById.get('labor')?.influence ?? 50,
    civicSupport: blocById.get('civic')?.support ?? 50,
    intelligentsiaSupport: blocById.get('intelligentsia')?.support ?? 50,
    securitySupport: blocById.get('security')?.support ?? 50,
  };

  if (phase === 'war') {
    const pillarRows = [
      { label: '전쟁 종결력', value: readiness.pillars.security, detail: '승점과 전선 주도권' },
      { label: '국내 정통성', value: readiness.pillars.legitimacy, detail: '안정도와 정부 신뢰' },
      { label: '재정 여력', value: readiness.pillars.finance, detail: '전후 예산을 버틸 국고' },
      { label: '산업 전환력', value: readiness.pillars.industry, detail: '군수 공장을 민수로 돌릴 기반' },
      { label: '외교 출구', value: readiness.pillars.diplomacy, detail: '강화 회담과 무역망의 신뢰' },
      { label: '주권·대표성', value: readiness.pillars.sovereignty, detail: '해방·복원·독립 뒤 통치할 정치 기반' },
    ];
    return (
      <div className="nation-management nation-transition-planner">
        <section className="nation-transition-hero">
          <div>
            <span className="eyebrow">WAR TO STATE · 연속 캠페인</span>
            <h2>{readiness.transitionLabel}</h2>
            <p>{readiness.transitionDescription} 전쟁에서 만든 국경·부채·물가·공장·연구·인물·외교 관계는 그대로 이어집니다.</p>
          </div>
          <div className={`transition-readiness-seal ${readiness.eligible ? 'ready' : ''}`}>
            <span>국가 전환 준비도</span>
            <strong>{readiness.score}</strong>
            <em>{readiness.eligible ? '협상 종전 가능' : '국가 기반 보강 필요'}</em>
          </div>
        </section>

        <div className="nation-transition-grid">
          <section className="nation-surface transition-pillars">
            <header><div><span>전환 조건</span><h3>전쟁에서 국가로</h3></div><small>{readiness.threshold}점 이상 · 안정도 {readiness.stabilityFloor} 이상</small></header>
            <div className="transition-pillar-list">
              {pillarRows.map((pillar) => (
                <div key={pillar.label} className="transition-pillar">
                  <div><strong>{pillar.label}</strong><small>{pillar.detail}</small></div>
                  <MetricBar value={pillar.value} danger={pillar.value < 40} />
                  <b>{pillar.value}</b>
                </div>
              ))}
            </div>
            <button
              className="nation-primary-action"
              disabled={!readiness.eligible}
              onClick={() => onTransition('negotiated')}
            >
              <Handshake size={18} /> {readiness.transitionLabel} 승인 <ArrowRight size={17} />
            </button>
            {!readiness.eligible && <p className="transition-lock-note">{readiness.blockedReasons.join(' · ')}. 전선·국고·산업·외교뿐 아니라 주권과 대표성을 함께 보강하십시오.</p>}
          </section>

          <section className="nation-surface inherited-state">
            <header><div><span>계승되는 세계</span><h3>지금의 선택이 전후 초기 조건</h3></div><Landmark size={20} /></header>
            <div className="inheritance-cards">
              <article><CircleDollarSign /><span>국고와 부채</span><strong>{formatMoney(game.treasury)} · 부채 {formatMoney(economy.debt)}</strong><small>무리한 전비 조달은 전후 세금과 복지를 압박합니다.</small></article>
              <article><TrendingUp /><span>물가와 신뢰</span><strong>{economy.inflation.toFixed(1)}% · 신뢰 {Math.round(economy.publicConfidence)}</strong><small>배급·채권·투자 결정이 생활비와 정부 위임으로 이어집니다.</small></article>
              <article><Factory /><span>생산 기반</span><strong>{game.factories}개 공장</strong><small>군수 생산력은 주택·철도·소비재 산업으로 전환할 수 있습니다.</small></article>
              <article><Users /><span>사람과 제도</span><strong>내각·지휘관·전문가 유지</strong><small>전쟁 중 영입하고 성장시킨 인물이 전후 부처와 기관을 이끕니다.</small></article>
            </div>
          </section>
        </div>

        <section className="nation-surface wartime-media-desk">
          <header><div><span>전시 언론 데스크</span><h3>보직·소속 집단·사생활을 둘러싼 질문도 전쟁 중 계속됩니다</h3></div><small>{currentMediaLaw.name} · 자유 {Math.round(state.mediaRelations.freedom)}</small></header>
          <div className="wartime-media-summary">
            <article><Newspaper /><span>언론 신뢰</span><strong>{Math.round(state.mediaRelations.pressTrust)}</strong></article>
            <article><Mic /><span>언론 접근</span><strong>{Math.round(state.mediaRelations.access)}</strong></article>
            <article className={disclosureRisk.weeklyChance >= 8 ? 'warning' : ''}><LockKeyhole /><span>주간 폭로 가능성</span><strong>{disclosureRisk.weeklyChance.toFixed(1)}%</strong></article>
          </div>
          {!state.personalLife.profile.configured ? (
            <div className="wartime-identity-setup">
              <div><strong>먼저 개인 정보의 공개 기준을 정하십시오</strong><p>설정한 정체성이 능력치 페널티가 되지는 않습니다. 이후 경쟁자와 언론이 이를 알게 되는 경로와 법적 보호가 계산됩니다.</p></div>
              <label>성별<select value={identityGender} onChange={(event) => setIdentityGender(event.target.value as GenderIdentity)}><option value="woman">여성</option><option value="man">남성</option><option value="nonbinary">논바이너리</option><option value="private">공개하지 않음</option></select></label>
              <label>성적 지향<select value={identityOrientation} onChange={(event) => setIdentityOrientation(event.target.value as OrientationId)}><option value="heterosexual">이성애</option><option value="gay-lesbian">동성애</option><option value="bisexual">양성애</option><option value="pansexual">범성애</option><option value="asexual">무성애 스펙트럼</option><option value="private">공개하지 않음</option></select></label>
              <button type="button" onClick={() => onConfigurePersonalLife({ gender: identityGender, orientation: identityOrientation, partnerTerm, boundary: relationshipBoundary })}>개인 정보 기준 저장</button>
            </div>
          ) : null}
          {pendingInterview ? (
            <div className="wartime-interview-request">
              <div><span>{pendingInterview.outlet.name}</span><strong>{pendingInterview.format}</strong><b>제{pendingInterview.deadlineWeek + 1}주까지</b></div>
              <blockquote>{pendingInterview.question}</blockquote>
              <div>{interviewResponseDefinitions.map((response) => <button type="button" key={response.id} onClick={() => onAnswerMediaInterview(response.id)}><strong>{response.name}</strong><small>{previewInterviewResponse(pendingInterview, response.id, mediaContext).label}</small></button>)}</div>
            </div>
          ) : (
            <div className="wartime-interview-pitch"><label>먼저 제안할 의제<select value={selectedMediaTopicId} onChange={(event) => setSelectedMediaTopicId(event.target.value as MediaTopicId)}>{mediaTopicDefinitions.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label><button type="button" disabled={!currentMediaLaw.independentInterviews || state.mediaRelations.access < 25 || game.politicalPower < 2} onClick={() => onRequestMediaInterview(selectedMediaTopicId)}>정치력 2 · 인터뷰 요청</button></div>
          )}
          {activeExposure && activeExposure.stage !== 'resolved' ? (
            <div className="wartime-exposure-alert">
              <div><span>{getExposureStageLabel(activeExposure.stage)}</span><strong>{activeExposure.subject}</strong><b>{activeExposure.outlet.name} · 증거 {activeExposure.evidenceQuality}</b></div>
              <p>{activeExposure.instigator}가 {activeExposure.motive}을 위해 자료를 전달했습니다.</p>
              <div>{exposureResponseDefinitions.map((response) => {
                const disabled = response.id === 'independent-review' ? state.institutionalCapacity < 42 || game.treasury < 10 : response.id === 'legal-protection' ? state.personalLife.familyLawId === 'restrictive-code' || game.politicalPower < 5 || game.treasury < 6 : false;
                return <button type="button" key={response.id} disabled={disabled} onClick={() => onAnswerExposure(response.id)}>{response.name}</button>;
              })}</div>
            </div>
          ) : null}
        </section>

        <PowerNetworkBoard
          compact
          state={state.powerNetwork}
          context={powerNetworkContext}
          staff={staff}
          formatMoney={formatMoney}
          onPrinciplesChange={onLeadershipPrinciplesChange}
          onPromise={onPowerBlocPromise}
          onLegacyChange={onLegacyPathChange}
          onRivalAction={onRivalAction}
          onOpportunityChoice={onPowerOpportunityChoice}
        />

        <StrategicSagaBoard
          compact
          state={state.strategicSaga}
          context={strategicSagaContext}
          staff={staff}
          onStart={onStrategicSagaStart}
          onApproach={onStrategicSagaApproach}
          onReserve={onStrategicSagaReserve}
        />

        <SocialistWorldBoard
          compact
          state={state.socialistWorld}
          context={socialistWorldContext}
          staff={staff}
          onStart={onSocialistTransitionStart}
          onSettlement={onSocialistSettlement}
          onMethod={onSocialistTransitionMethod}
        />

        <section className="nation-surface transition-routes">
          <header><div><span>두 개의 종전 경로</span><h3>같은 나라, 다른 출발선</h3></div><small>{worldlineTitle}</small></header>
          <div>
            <article className="preferred"><CheckCircle2 /><h4>완전 승전 체제</h4><p>승전국의 외교 영향력과 국민적 위임을 얻지만, 넓어진 점령지·동원 해제·전쟁 부채를 동시에 관리해야 합니다.</p><b>전쟁 승리 화면에서 선택</b></article>
            <article><Scale /><h4>{readiness.transitionLabel}</h4><p>{readiness.transitionDescription}</p><b>{readiness.eligible ? '현재 선택 가능' : `준비도 ${Math.max(0, readiness.threshold - readiness.score)}점 추가 필요`}</b></article>
          </div>
        </section>
      </div>
    );
  }

  const objectiveRows = [
    { label: '국가 성과 60 달성', current: state.nationalScore, target: 60 },
    { label: '국민 위임 50 이상 유지', current: state.mandateScore, target: 50 },
    { label: '사회 불안 35 이하', current: 100 - state.unrest, target: 65 },
    { label: '민수 산업 65 달성', current: state.civilianIndustry, target: 65 },
  ];

  return (
    <div className="nation-management nation-live-government">
      <section className="nation-government-hero">
        <div>
          <span className="eyebrow">{nation.code} NATIONAL GOVERNMENT · {transitionReasonLabel[state.transitionReason]}</span>
          <h2>{nation.shortName} 국가 운영 내각</h2>
          <p>{worldlineTitle} · 영토 확장보다 국민의 삶, 제도의 지속성, 경제와 외교에서 국가의 성과를 증명해야 합니다.</p>
        </div>
        <div className="nation-hero-scores">
          <div><span>국가 성과</span><strong>{state.nationalScore}</strong><small>산업·교육·복지·제도 종합</small></div>
          <div><span>국민 위임</span><strong>{state.mandateScore}</strong><small>다음 평가까지 {electionWeeks}주</small></div>
          <button onClick={onNextWeek}>국정 1주 진행 <ChevronRight size={17} /></button>
        </div>
      </section>

      <section className="nation-kpi-grid">
        {[
          ['고용', state.employment, Factory, false],
          ['복지', state.welfare, HeartHandshake, false],
          ['교육', state.education, GraduationCap, false],
          ['주택', state.housing, Building2, false],
          ['제도 역량', state.institutionalCapacity, Landmark, false],
          ['사회 불안', state.unrest, TrendingDown, true],
        ].map(([label, value, Icon, danger]) => {
          const MetricIcon = Icon as typeof Factory;
          return <article key={label as string} className={danger && Number(value) > 55 ? 'warning' : ''}><MetricIcon /><span>{label as string}</span><strong>{Math.round(Number(value))}</strong><MetricBar value={Number(value)} danger={Boolean(danger)} /></article>;
        })}
      </section>

      <section className="nation-surface national-agenda-board" aria-labelledby="national-agenda-title">
        <header>
          <div><span>국가 고유 의제</span><h3 id="national-agenda-title">{activeAgenda?.title ?? '다음 구조 의제 준비 중'}</h3></div>
          <small>{activeAgenda ? `결론까지 ${Math.max(0, activeAgenda.expiresWeek - game.week)}주` : `다음 의제까지 ${Math.max(0, state.agenda.nextIssueWeek - game.week)}주`}</small>
        </header>
        {activeAgenda ? (
          <>
            <div className="national-agenda-briefing">
              <ScrollText />
              <div><strong>{activeAgenda.briefing}</strong><p>{activeAgenda.stakes}</p></div>
            </div>
            <div className="national-agenda-options">
              {(Object.entries(activeAgenda.options) as Array<[NationAgendaChoiceId, (typeof activeAgenda.options)[NationAgendaChoiceId]]>).map(([choiceId, choice]) => (
                <button key={choiceId} onClick={() => onNationAgendaChoice(choiceId)}>
                  <span>{choiceId === 'bargain' ? '대표협상' : choiceId === 'invest' ? '집중투자' : '중앙집행'}</span>
                  <strong>{choice.label}</strong>
                  <small>{choice.description}</small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="continuity-empty-state">국가마다 다른 주기로 외교·지역·헌정·독립·사회경제 의제가 열립니다. 장기 진행은 의제나 위기가 생기면 자동으로 멈춥니다.</p>
        )}
      </section>

      <PowerNetworkBoard
        state={state.powerNetwork}
        context={powerNetworkContext}
        staff={staff}
        formatMoney={formatMoney}
        onPrinciplesChange={onLeadershipPrinciplesChange}
        onPromise={onPowerBlocPromise}
        onLegacyChange={onLegacyPathChange}
        onRivalAction={onRivalAction}
        onOpportunityChoice={onPowerOpportunityChoice}
      />

      <StrategicSagaBoard
        state={state.strategicSaga}
        context={strategicSagaContext}
        staff={staff}
        onStart={onStrategicSagaStart}
        onApproach={onStrategicSagaApproach}
        onReserve={onStrategicSagaReserve}
      />

      <SocialistWorldBoard
        state={state.socialistWorld}
        context={socialistWorldContext}
        staff={staff}
        onStart={onSocialistTransitionStart}
        onSettlement={onSocialistSettlement}
        onMethod={onSocialistTransitionMethod}
      />

      <section className="nation-surface structural-pressure-board" aria-labelledby="structural-pressure-title">
        <header>
          <div><span>사회 불안 구조</span><h3 id="structural-pressure-title">사라지는 수치가 아니라 계속 재생되는 갈등</h3></div>
          <small>현재 {state.unrest.toFixed(1)} · 구조 목표 {state.structuralPressure.targetUnrest.toFixed(1)} · 최소 {state.structuralPressure.floor}</small>
        </header>
        <div className="structural-pressure-summary">
          <div><Activity /><span><strong>최대 압력 · {state.structuralPressure.dominantDriver}</strong><small>정책 완화 효과 {state.structuralPressure.policyRelief.toFixed(1)}</small></span></div>
          <MetricBar value={state.structuralPressure.targetUnrest} danger />
        </div>
        <div className="structural-pressure-drivers">
          {state.structuralPressure.drivers.slice(0, 5).map((driver) => {
            const lever = getStructuralPressureLever(driver.id);
            const budgetName = nationBudgetDefinitions.find((definition) => definition.id === lever.budgetDomain)?.name ?? lever.budgetDomain;
            return (
              <article key={driver.id}>
                <span>{driver.label}</span><strong>+{driver.value.toFixed(1)}</strong><small>{driver.detail}</small>
                <div className="structural-pressure-action">
                  <b>{lever.action}</b>
                  <em>{budgetName} 연결 · {lever.expectedEffect} · {lever.verificationWeeks}주 뒤 확인</em>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <NationalSimulationOverview
        snapshot={nationalSimulation}
        phase="nation"
        year={1942 + Math.floor(game.week / 52)}
        nationId={nation.id}
        role={role}
        game={game}
        completedDecisions={completedDecisions}
        onNavigate={onNavigate}
        onEnactCivilization={onEnactCivilization}
      />

      <section className="nation-surface continuity-command-board">
        <header>
          <div><span>장기 지휘 주기</span><h3>한 주의 결재를 1·4·13주 국가전략으로 연결</h3></div>
          <small>{currentYear}년 · {role.title} 권한 · {role.branch === 'military' ? '군사' : role.branch === 'intelligence' ? '정보' : '정치'} 계통</small>
        </header>

        <div className="period-advance-strip">
          <div>
            <CalendarClock />
            <span><strong>기간 진행</strong><small>위기·선거·중간평가가 발생하면 자동으로 멈춥니다.</small></span>
          </div>
          <button onClick={onNextWeek} disabled={periodAdvanceRemaining > 0}>1주</button>
          <button onClick={() => onAdvancePeriod(4)} disabled={periodAdvanceRemaining > 0}>4주</button>
          <button onClick={() => onAdvancePeriod(13)} disabled={periodAdvanceRemaining > 0}>13주</button>
          {periodAdvanceRemaining > 0 && <button className="cancel-period-advance" onClick={onCancelPeriodAdvance}><TimerReset size={16} /> 중지 · {periodAdvanceRemaining}주 남음</button>}
        </div>

        <div className="continuity-board-grid">
          <section>
            <div className="continuity-board-heading"><Target /><span><small>평시 전략작전</small><strong>전쟁 뒤에도 이어지는 군사·정보 경력</strong></span></div>
            {activeStrategicDefinition && state.strategicContinuity.active ? (
              <article className="continuity-active-card">
                <span>{activeStrategicDefinition.domain} · {activeStrategicDefinition.durationWeeks}주 임무</span>
                <strong>{activeStrategicDefinition.name}</strong>
                <p>{activeStrategicDefinition.description}</p>
                <MetricBar value={(state.strategicContinuity.active.progressWeeks / activeStrategicDefinition.durationWeeks) * 100} />
                <small>{state.strategicContinuity.active.progressWeeks}/{activeStrategicDefinition.durationWeeks}주 · 지도 이동이나 화면 전환으로 취소되지 않습니다.</small>
              </article>
            ) : (
              <div className="continuity-option-list">
                {availableStrategicOperations.slice(0, 4).map((operation) => {
                  const affordable = game.politicalPower >= operation.politicalCost && game.treasury >= operation.treasuryCost && game.commandPoints >= operation.commandCost;
                  return (
                    <article key={operation.id}>
                      <span>{operation.domain} · 위험 {operation.risk}</span>
                      <strong>{operation.name}</strong>
                      <p>{operation.description}</p>
                      <small>정치력 {operation.politicalCost} · {formatMoney(operation.treasuryCost)} · 지휘 {operation.commandCost} · {operation.durationWeeks}주</small>
                      <button disabled={!affordable} onClick={() => onLaunchStrategicOperation(operation.id)}>{affordable ? '작전 승인' : '자원 부족'}</button>
                    </article>
                  );
                })}
                {availableStrategicOperations.length === 0 && <p className="continuity-empty-state">현재 시대와 직무 권한에 맞는 신규 전략작전이 없습니다. 시대가 바뀌거나 최근 작전의 재편 기간이 끝나면 새 임무가 열립니다.</p>}
              </div>
            )}
          </section>

          <section>
            <div className="continuity-board-heading"><Activity /><span><small>1·5·10년 국가계획</small><strong>임기보다 긴 약속을 중간평가로 검증</strong></span></div>
            {activePlanDefinition && state.nationalPlanning.active ? (
              <article className="continuity-active-card">
                <span>{activePlanDefinition.horizonYears}개년 · {activePlanDefinition.doctrine}</span>
                <strong>{activePlanDefinition.name}</strong>
                <p>{activePlanDefinition.targets.join(' · ')}</p>
                <MetricBar value={state.nationalPlanning.active.progress} danger={state.nationalPlanning.active.progress < 45} />
                <small>진척 {state.nationalPlanning.active.progress.toFixed(0)}% · 다음 검증 {Math.max(0, state.nationalPlanning.active.reviewWeek - game.week)}주 · 종료 {Math.max(0, state.nationalPlanning.active.deadlineWeek - game.week)}주</small>
              </article>
            ) : (
              <div className="continuity-option-list plan-options">
                {nationalPlanDefinitions.map((plan) => (
                  <article key={plan.id}>
                    <span>{plan.horizonYears}개년 · {plan.doctrine}</span>
                    <strong>{plan.name}</strong>
                    <p>{plan.description}</p>
                    <small>{plan.targets.join(' · ')}</small>
                    <button onClick={() => onLaunchNationalPlan(plan.id)}>계획 채택</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="late-era-pressure-grid" aria-label="후기 시대 구조 압력">
          {[
            ['상대 경쟁력', state.relativeCompetitiveness, false],
            ['제도 노후', state.institutionalAge, true],
            ['인구 압력', state.demographicPressure, true],
            ['생태 압력', state.ecologicalPressure, true],
            ['패권 비용', state.hegemonyCost, true],
          ].map(([label, value, danger]) => (
            <article key={String(label)} className={Boolean(danger) && Number(value) >= 55 ? 'warning' : ''}>
              <span>{String(label)}</span><strong>{Math.round(Number(value))}</strong><MetricBar value={Number(value)} danger={Boolean(danger)} />
            </article>
          ))}
        </div>
      </section>

      <ElectionSituationRoom
        state={state.electoral}
        nation={state}
        game={game}
        economy={economy}
        role={role}
        formatMoney={formatMoney}
        onCampaignAction={onElectionCampaignAction}
        onLaunchReferendum={onLaunchReferendum}
      />

      <div className="nation-government-grid">
        <section className="nation-surface fiscal-cabinet">
          <header><div><span>주간 재정</span><h3>세입·지출 조정</h3></div><CircleDollarSign size={20} /></header>
          <div className="fiscal-summary">
            <div><span>국고</span><strong>{formatMoney(game.treasury)}</strong></div>
            <div><span>국가 부채</span><strong>{formatMoney(economy.debt)}</strong></div>
            <div><span>물가</span><strong>{economy.inflation.toFixed(1)}%</strong></div>
            <div><span>최근 수지</span><strong>{latestReport ? formatMoney(latestReport.fiscalBalance, { signed: true }) : '첫 결산 전'}</strong></div>
          </div>
          <div className="fiscal-controls">
            <div><span><b>조세 부담</b><small>세입 증가 · 고용과 지지 부담</small></span><div><button aria-label="조세 부담 5 낮추기" onClick={() => onTaxChange(-5)} disabled={state.taxBurden <= 20}><Minus /></button><strong>{state.taxBurden}</strong><button aria-label="조세 부담 5 높이기" onClick={() => onTaxChange(5)} disabled={state.taxBurden >= 80}><Plus /></button></div></div>
            <div><span><b>공공지출</b><small>정책 효과 증가 · 부채와 물가 부담</small></span><div><button aria-label="공공지출 5 낮추기" onClick={() => onSpendingChange(-5)} disabled={state.spendingLevel <= 25}><Minus /></button><strong>{state.spendingLevel}</strong><button aria-label="공공지출 5 높이기" onClick={() => onSpendingChange(5)} disabled={state.spendingLevel >= 85}><Plus /></button></div></div>
          </div>
          <button className="economy-deep-link" onClick={() => onNavigate('economy')}>채권·세제·기업 투자 상세 관리 <ChevronRight size={15} /></button>
        </section>

        <section className="nation-surface national-objectives">
          <header><div><span>국가 운영 목표</span><h3>정복이 아닌 지속 가능한 승리</h3></div><ShieldCheck size={20} /></header>
          <div>
            {objectiveRows.map((objective) => (
              <article key={objective.label}>
                <span><strong>{objective.label}</strong><small>{Math.round(objective.current)} / {objective.target}</small></span>
                <MetricBar value={(objective.current / objective.target) * 100} danger={objective.label.includes('불안')} />
              </article>
            ))}
          </div>
          <p>선거·국민 위임, 경제 안정, 공공서비스, 외교적 생존이 새 승리 조건입니다. 군사력은 억지력과 안보 비용으로 남지만 영토 점령은 더 이상 주간 진행의 중심이 아닙니다.</p>
        </section>
      </div>

      <section className="nation-surface ministry-budget-board">
        <header><div><span>내각 예산안</span><h3>100%의 한정된 자원을 어디에 배분할 것인가</h3></div><small>한 부처를 +5% 하면 여력이 가장 큰 다른 부처에서 자동 조정됩니다.</small></header>
        <div className="ministry-budget-grid">
          {nationBudgetDefinitions.map((definition) => {
            const Icon = budgetIcons[definition.id];
            return (
              <article key={definition.id}>
                <div className="ministry-title"><Icon /><span><small>{definition.ministry}</small><strong>{definition.name}</strong></span><b>{state.budget[definition.id]}%</b></div>
                <p>{definition.description}</p>
                <small className="ministry-effect">{definition.primaryEffect}</small>
                <div className="ministry-control"><button aria-label={`${definition.name} 예산 5퍼센트포인트 낮추기`} onClick={() => onBudgetChange(definition.id, -5)} disabled={state.budget[definition.id] <= 5}><Minus /></button><MetricBar value={(state.budget[definition.id] / 45) * 100} /><button aria-label={`${definition.name} 예산 5퍼센트포인트 높이기`} onClick={() => onBudgetChange(definition.id, 5)} disabled={state.budget[definition.id] >= 45}><Plus /></button></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="nation-surface national-strategy-board">
        <header><div><span>국가 발전 노선</span><h3>내각 전체가 따를 장기 전략</h3></div><small>현재: {currentStrategy.name}</small></header>
        <div className="national-strategy-grid">
          {nationStrategies.map((strategy) => (
            <button key={strategy.id} className={state.strategyId === strategy.id ? 'active' : ''} onClick={() => onStrategyChange(strategy.id)}>
              <span>{strategy.doctrine}</span><strong>{strategy.name}</strong><p>{strategy.description}</p><small><b>강점</b> {strategy.strengths}</small><em><b>위험</b> {strategy.risk}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="nation-surface personal-life-board">
        <header>
          <div><span>개인·가족·혼인</span><h3>한 사람의 삶도 세계선의 일부입니다</h3></div>
          <small>{currentYear}년 · {currentFamilyLaw.name}</small>
        </header>

        <div className="personal-life-status-grid">
          <article>
            <UserRound />
            <span>개인 프로필</span>
            <strong>{state.personalLife.profile.configured ? `${getGenderLabel(state.personalLife.profile.gender)} · ${getOrientationLabel(state.personalLife.profile.orientation)}` : '설정 필요'}</strong>
            <small>정체성은 능력치 우열을 만들지 않습니다.</small>
          </article>
          <article>
            <Scale />
            <span>법적 보호</span>
            <strong>{currentFamilyLaw.principle}</strong>
            <small>혼인 {currentFamilyLaw.sameGenderMarriage ? '평등' : '제한'} · 시민결합 {currentFamilyLaw.civilPartnership ? '허용' : '불허'}</small>
          </article>
          <article className={eraFamilyClimate.pressure >= 50 ? 'warning' : ''}>
            <LockKeyhole />
            <span>시대 환경</span>
            <strong>{eraFamilyClimate.label}</strong>
            <small>사회·제도 압력 {eraFamilyClimate.pressure}/100</small>
          </article>
          <article>
            <Heart />
            <span>현재 관계</span>
            <strong>{activePersonalRelationship ? `${activePersonalRelationship.partnerTerm} · ${activePersonalRelationship.candidate.name}` : '독신·관계 없음'}</strong>
            <small>{activePersonalRelationship ? `${getUnionFormLabel(activePersonalRelationship.unionForm)} · ${getVisibilityLabel(activePersonalRelationship.visibility)}` : '비혼으로 계속 플레이할 수 있습니다.'}</small>
          </article>
        </div>

        <div className="personal-life-principles">
          <div><strong>이 시대의 조건</strong><p>{eraFamilyClimate.detail}</p></div>
          <div><strong>설계 원칙</strong><p>성적 지향 자체에는 페널티가 없습니다. 위험은 시대의 법, 관계 공개 범위, 국가의 제도 역량에서 발생하며 개혁으로 바꿀 수 있습니다.</p></div>
        </div>

        {!activePersonalRelationship ? (
          <div className="personal-profile-editor">
            <div className="personal-section-heading"><UserRound /><span><small>IDENTITY & BOUNDARIES</small><strong>{state.personalLife.profile.configured ? '관계 프로필 수정' : '먼저 나의 관계 원칙 설정'}</strong></span></div>
            <div className="personal-profile-fields">
              <label>성별 정체성<select value={identityGender} onChange={(event) => setIdentityGender(event.target.value as GenderIdentity)}>
                <option value="woman">여성</option><option value="man">남성</option><option value="nonbinary">논바이너리</option><option value="private">공개하지 않음</option>
              </select></label>
              <label>성적 지향<select value={identityOrientation} onChange={(event) => setIdentityOrientation(event.target.value as OrientationId)}>
                <option value="heterosexual">이성애</option><option value="gay-lesbian">동성애</option><option value="bisexual">양성애</option><option value="pansexual">범성애</option><option value="asexual">무성애 스펙트럼</option><option value="private">공개하지 않음·직접 선택</option>
              </select></label>
              <label>상대 호칭<select value={partnerTerm} onChange={(event) => setPartnerTerm(event.target.value as PartnerTermPreference)}>
                <option value="auto">자동: 아내·남편·배우자</option><option value="wife">아내</option><option value="husband">남편</option><option value="spouse">배우자</option><option value="partner">동반자</option>
              </select></label>
              <label>관계 경계<select value={relationshipBoundary} onChange={(event) => setRelationshipBoundary(event.target.value as RelationshipBoundary)}>
                <option value="exclusive">배타적 관계</option><option value="negotiated">합의형 관계</option><option value="companionate">동반자 관계</option><option value="private">사생활 비공개</option>
              </select></label>
            </div>
            <button type="button" onClick={() => onConfigurePersonalLife({ gender: identityGender, orientation: identityOrientation, partnerTerm, boundary: relationshipBoundary })}>{state.personalLife.profile.configured ? '프로필 변경 저장' : '원칙 저장 · 후보 열기'}</button>
          </div>
        ) : null}

        <div className="family-law-track">
          <div className="personal-section-heading"><Scale /><span><small>FAMILY LAW</small><strong>가족법과 혼인평등</strong></span></div>
          <div className="family-law-grid">
            {familyLawDefinitions.map((law) => {
              const active = law.id === state.personalLife.familyLawId;
              const eligibility = canReformFamilyLaw(state.personalLife, law.id, personalLifeContext);
              return (
                <button type="button" key={law.id} className={active ? 'active' : ''} disabled={active || !eligibility.allowed} onClick={() => onFamilyLawChange(law.id)} title={active ? '현재 시행 중' : eligibility.reason}>
                  <span>{law.principle}</span><strong>{law.name}</strong><p>{law.description}</p>
                  <small>정치 {law.politicalCost} · 행정비 {formatMoney(law.treasuryCost)} · 교육 {law.requiredEducation} · 제도 {law.requiredInstitutions}</small>
                  <em>{active ? '시행 중' : eligibility.allowed ? '법안 발의 가능' : eligibility.reason}</em>
                </button>
              );
            })}
          </div>
        </div>

        {state.personalLife.profile.configured && !activePersonalRelationship ? (
          <div className="relationship-market">
            <div className="personal-section-heading"><Heart /><span><small>RELATIONSHIP NETWORK</small><strong>관계 후보 · {personalCandidates.length}명</strong></span></div>
            <label>후보 선택<select value={selectedPersonalCandidate?.id ?? ''} onChange={(event) => setSelectedPersonalCandidateId(event.target.value)}>
              {personalCandidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {getGenderLabel(candidate.gender)} · {candidate.profession} · {candidate.nationName}</option>)}
            </select></label>
            {selectedPersonalCandidate ? (
              <div className="relationship-candidate-card">
                <div><span className="candidate-avatar"><UserRound /></span><span><strong>{selectedPersonalCandidate.name}</strong><small>{selectedPersonalCandidate.pronouns} · {getGenderLabel(selectedPersonalCandidate.gender)} · {selectedPersonalCandidate.orientation === 'bisexual' ? '양성애' : '범성애'}</small></span><b>{selectedPersonalCandidate.nationName}</b></div>
                <p>{selectedPersonalCandidate.background}</p>
                <dl><div><dt>직업</dt><dd>{selectedPersonalCandidate.profession}</dd></div><div><dt>관계 방식</dt><dd>{selectedPersonalCandidate.relationshipStyle}</dd></div><div><dt>가치</dt><dd>{selectedPersonalCandidate.values.join(' · ')}</dd></div><div><dt>공적 기반</dt><dd>{Math.round(selectedPersonalCandidate.publicStanding)}/100</dd></div></dl>
                <small>가상 복합 인물 · 실존 인물의 확인되지 않은 사생활이나 성적 지향을 사용하지 않습니다.</small>
              </div>
            ) : <p className="personal-empty-state">현재 설정과 맞는 후보가 없습니다. 관계 프로필에서 지향 또는 공개 설정을 조정하십시오.</p>}
            <button type="button" disabled={!selectedPersonalCandidate || game.politicalPower < 4 || game.treasury < 8} onClick={() => selectedPersonalCandidate && onStartPersonalRelationship(selectedPersonalCandidate.id)}>교제 시작 <small>정치 4 · {formatMoney(8)}</small></button>
          </div>
        ) : null}

        {activePersonalRelationship ? (
          <div className="active-relationship-board">
            <div className="relationship-hero">
              <span className="candidate-avatar"><Heart /></span>
              <div><small>{getPairKindLabel(activePersonalRelationship.pairKind)} · {getVisibilityLabel(activePersonalRelationship.visibility)}</small><h4>{activePersonalRelationship.candidate.name}</h4><p>{activePersonalRelationship.candidate.profession} · {activePersonalRelationship.partnerTerm} · 함께한 시간 {activePersonalRelationship.weeksTogether}주</p></div>
              <b>{getUnionFormLabel(activePersonalRelationship.unionForm)}</b>
            </div>
            <div className="relationship-metrics">
              <article><span>유대</span><strong>{Math.round(activePersonalRelationship.bond)}</strong><MetricBar value={activePersonalRelationship.bond} /></article>
              <article><span>신뢰</span><strong>{Math.round(activePersonalRelationship.trust)}</strong><MetricBar value={activePersonalRelationship.trust} /></article>
              <article className={activePersonalRelationship.strain >= 65 ? 'warning' : ''}><span>긴장</span><strong>{Math.round(activePersonalRelationship.strain)}</strong><MetricBar value={activePersonalRelationship.strain} danger /></article>
              <article className={activePersonalRelationship.exposure >= 65 ? 'warning' : ''}><span>노출</span><strong>{Math.round(activePersonalRelationship.exposure)}</strong><MetricBar value={activePersonalRelationship.exposure} danger /></article>
              <article><span>법적 보호</span><strong>{activePersonalRelationship.legalRecognition === 'full' ? '완전' : activePersonalRelationship.legalRecognition === 'partial' ? '제한' : '없음'}</strong><small>{currentFamilyLaw.name}</small></article>
            </div>

            {activePersonalRelationship.stage === 'courtship' ? (
              <div className="union-formalization">
                <div className="personal-section-heading"><Home /><span><small>COMMITMENT</small><strong>관계 형태와 공개 범위 결정</strong></span></div>
                <div className="union-form-fields">
                  <label>관계 형태<select value={selectedUnionForm} onChange={(event) => setSelectedUnionForm(event.target.value as UnionForm)}><option value="marriage">법률혼</option><option value="civil-partnership">시민결합</option><option value="domestic-partnership">동거 동반자</option><option value="private-commitment">비공개 서약</option></select></label>
                  <label>공개 범위<select value={selectedRelationshipVisibility} onChange={(event) => setSelectedRelationshipVisibility(event.target.value as RelationshipVisibility)}><option value="public">공개</option><option value="private">비공개</option><option value="secret">비밀</option></select></label>
                </div>
                <p className={unionEligibility.allowed ? 'union-eligible' : 'union-blocked'}>{unionEligibility.allowed ? `체결 가능 · ${unionEligibility.reason}` : `체결 불가 · ${unionEligibility.reason}`}</p>
                <button type="button" disabled={!unionEligibility.allowed} onClick={() => onFormalizeRelationship(selectedUnionForm, selectedRelationshipVisibility)}>{getUnionFormLabel(selectedUnionForm)} 확정</button>
              </div>
            ) : (
              <div className="family-plan-control">
                <div className="personal-section-heading"><Home /><span><small>HOUSEHOLD</small><strong>가족 형태와 양육 계획</strong></span></div>
                <label>가족 계획<select value={selectedFamilyPlanId} onChange={(event) => setSelectedFamilyPlanId(event.target.value as FamilyPlanId)}>{familyPlanDefinitions.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
                <p>{familyPlanDefinitions.find((plan) => plan.id === selectedFamilyPlanId)?.description}</p>
                <button type="button" disabled={selectedFamilyPlanId === 'adoption' && !currentFamilyLaw.jointAdoption} onClick={() => onFamilyPlanChange(selectedFamilyPlanId)}>가족 계획 적용</button>
                <small>현재: {familyPlanDefinitions.find((plan) => plan.id === activePersonalRelationship.familyPlan)?.name} · 부양 가족 {activePersonalRelationship.dependents}명</small>
              </div>
            )}

            <div className="relationship-actions">
              {personalLifeActionDefinitions.map((action) => <button type="button" key={action.id} className={action.id === 'separate' ? 'danger' : ''} onClick={() => onPersonalLifeAction(action.id)}><strong>{action.name}</strong><span>{action.description}</span><small>{action.cost}</small></button>)}
            </div>
          </div>
        ) : null}

        {state.personalLife.history.length > 0 ? (
          <div className="personal-history-ledger"><h4>개인사 기록</h4>{state.personalLife.history.slice(0, 6).map((record) => <article key={record.id}><span><strong>{record.title}</strong><small>{record.detail}</small></span><b>제{record.week + 1}주</b></article>)}</div>
        ) : null}
      </section>

      <section className="nation-surface media-relations-board">
        <header>
          <div><span>언론·평판 상황실</span><h3>질문을 피하는 것이 아니라, 누가 서사를 만드는지 관리합니다</h3></div>
          <small>{currentYear}년 · {currentMediaLaw.name}</small>
        </header>

        <div className="media-status-grid">
          <article><Newspaper /><span>언론 자유</span><strong>{Math.round(state.mediaRelations.freedom)}</strong><MetricBar value={state.mediaRelations.freedom} /></article>
          <article><Mic /><span>언론 접근</span><strong>{Math.round(state.mediaRelations.access)}</strong><MetricBar value={state.mediaRelations.access} /></article>
          <article><ShieldCheck /><span>언론 신뢰</span><strong>{Math.round(state.mediaRelations.pressTrust)}</strong><MetricBar value={state.mediaRelations.pressTrust} /></article>
          <article className={state.mediaRelations.hostility >= 60 ? 'warning' : ''}><LockKeyhole /><span>취재 적대</span><strong>{Math.round(state.mediaRelations.hostility)}</strong><MetricBar value={state.mediaRelations.hostility} danger /></article>
        </div>

        <div className="media-design-principle">
          <strong>정체성은 페널티가 아닙니다</strong>
          <p>폭로 위험은 {role.title}의 공적 지위, 소속 집단의 권력 경쟁, 가족법, 언론법, 선거와 공개 범위에서 발생합니다. 동의 없는 공개는 별도의 사생활 침해로 기록되며 대응 결과는 법과 제도의 보호 수준에 따라 달라집니다.</p>
        </div>

        <div className="media-law-grid">
          {mediaLawDefinitions.map((law) => {
            const eligibility = canReformMediaLaw(state.mediaRelations, law.id, mediaContext);
            const active = law.id === state.mediaRelations.lawId;
            return (
              <button type="button" key={law.id} className={active ? 'active' : ''} disabled={active || !eligibility.allowed} onClick={() => onMediaLawChange(law.id)} title={active ? '현재 시행 중' : eligibility.reason}>
                <span>{law.principle}</span><strong>{law.name}</strong><p>{law.description}</p>
                <small>자유 목표 {law.freedomTarget} · 정치력 {law.politicalCost} · {formatMoney(law.treasuryCost)}</small>
                <em>{active ? '현재 시행 중' : eligibility.reason}</em>
              </button>
            );
          })}
        </div>

        <div className="media-operations-grid">
          <section className={`media-interview-card ${pendingInterview ? 'pending' : ''}`}>
            <div className="personal-section-heading"><Mic /><span><small>PRESS INTERVIEW</small><strong>{pendingInterview ? `${pendingInterview.outlet.name} 인터뷰 요청` : '먼저 언론 인터뷰를 제안'}</strong></span></div>
            {pendingInterview ? (
              <>
                <div className="interview-request-meta">
                  <span>{pendingInterview.initiator === 'media' ? '편집국 요청' : '사용자 제안'}</span><b>{pendingInterview.format}</b><em>제{pendingInterview.deadlineWeek + 1}주까지</em>
                </div>
                <blockquote>{pendingInterview.question}</blockquote>
                <p>{pendingInterview.context}</p>
                <div className="interview-response-list">
                  {interviewResponseDefinitions.map((response) => {
                    const preview = previewInterviewResponse(pendingInterview, response.id, mediaContext);
                    return <button type="button" key={response.id} className={response.id === 'decline' ? 'danger' : ''} onClick={() => onAnswerMediaInterview(response.id)}><strong>{response.name}</strong><span>{response.approach}</span><small>예상: {preview.label}</small></button>;
                  })}
                </div>
              </>
            ) : (
              <div className="outbound-interview-planner">
                <label>주도할 의제<select value={selectedMediaTopicId} onChange={(event) => setSelectedMediaTopicId(event.target.value as MediaTopicId)}>{mediaTopicDefinitions.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
                <p>{mediaTopicDefinitions.find((topic) => topic.id === selectedMediaTopicId)?.purpose}</p>
                <button type="button" disabled={!currentMediaLaw.independentInterviews || state.mediaRelations.access < 25 || game.politicalPower < 2} onClick={() => onRequestMediaInterview(selectedMediaTopicId)}>정치력 2 · 편집국에 인터뷰 요청</button>
                <small>{currentMediaLaw.independentInterviews ? '편집국이 독립 질문을 추가하므로 일방적인 선전 방송이 아닙니다.' : '현재 언론법에서는 독립 인터뷰를 요청할 수 없습니다.'}</small>
              </div>
            )}
          </section>

          <section className={`media-exposure-card ${activeExposure && activeExposure.stage !== 'resolved' ? 'danger' : ''}`}>
            <div className="personal-section-heading"><LockKeyhole /><span><small>PRIVACY & DISCLOSURE</small><strong>{activeExposure && activeExposure.stage !== 'resolved' ? '폭로 대응실 가동' : '사생활 폭로 위험'}</strong></span></div>
            {activeExposure && activeExposure.stage !== 'resolved' ? (
              <>
                <div className="exposure-stage-line"><span>{getExposureStageLabel(activeExposure.stage)}</span><b>{activeExposure.outlet.name}</b><em>증거 {activeExposure.evidenceQuality}/100 · 관심 {activeExposure.publicAttention}/100</em></div>
                <h4>{activeExposure.subject}</h4>
                <p><b>제보자</b> {activeExposure.instigator}</p><p><b>동기</b> {activeExposure.motive}</p>
                <div className="exposure-response-list">
                  {exposureResponseDefinitions.map((response) => {
                    const disabled = response.id === 'independent-review'
                      ? state.institutionalCapacity < 42 || game.treasury < 10
                      : response.id === 'legal-protection'
                        ? state.personalLife.familyLawId === 'restrictive-code' || game.politicalPower < 5 || game.treasury < 6
                        : false;
                    return <button type="button" key={response.id} disabled={disabled} className={response.id === 'attack-source' ? 'danger' : ''} onClick={() => onAnswerExposure(response.id)}><strong>{response.name}</strong><span>{response.approach}</span><small>{response.id === 'independent-review' ? '제도 42 · 국고 10M' : response.id === 'legal-protection' ? '사생활 보호법 이상 · 정치력 5 · 국고 6M' : '즉시 대응'}</small></button>;
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="disclosure-risk-score"><span>주간 폭로 가능성</span><strong>{disclosureRisk.weeklyChance.toFixed(1)}%</strong><em>종합 압력 {disclosureRisk.score}/100</em></div>
                <p><b>예상 제보자</b> {disclosureRisk.likelyInstigator}</p><p><b>대상 정보</b> {disclosureRisk.subject}</p>
                <div className="disclosure-factor-list">{disclosureRisk.factors.map((factor) => <div key={factor.label}><span><strong>{factor.label}</strong><small>{factor.detail}</small></span><b>+{factor.value}</b></div>)}</div>
                <small className="media-protection-note">현재 보호: {disclosureRisk.protection}</small>
                {activeExposure?.stage === 'resolved' && <div className="resolved-exposure-note"><strong>최근 해결</strong><p>{activeExposure.resolution}</p></div>}
              </>
            )}
          </section>
        </div>

        {state.mediaRelations.history.length > 0 && <div className="media-history-ledger"><h4>언론 대응 기록</h4>{state.mediaRelations.history.slice(0, 8).map((record) => <article key={record.id} className={record.tone}><span><strong>{record.title}</strong><small>{record.detail}</small></span><b>제{record.week + 1}주</b></article>)}</div>}
      </section>

      <section className="nation-surface dynastic-politics-board">
        <header>
          <div><span>헌정·왕실 운영</span><h3>국가체제, 작위, 영지와 왕위계승</h3></div>
          <small>{currentGovernmentForm.name} · {dynasticAuthority ? '직접 결재 가능' : `${role.title} 권한 밖`}</small>
        </header>

        <div className="dynastic-status-grid">
          <article><Landmark /><span>현 국가체제</span><strong>{currentGovernmentForm.name}</strong><small>{currentGovernmentForm.doctrine}</small></article>
          <article><Crown /><span>왕권·헌정 권위</span><strong>{Math.round(state.dynasty.crownAuthority)}</strong><small>{state.dynasty.houseName}</small></article>
          <article><Castle /><span>궁정 결속</span><strong>{Math.round(state.dynasty.courtUnity)}</strong><small>낮을수록 궁정 쿠데타 증가</small></article>
          <article><ScrollText /><span>계승 안정</span><strong>{Math.round(state.dynasty.successionSecurity)}</strong><small>{getSuccessionLawName(state.dynasty.successionLawId)}</small></article>
          <article className={state.dynasty.estateBurden >= 55 ? 'warning' : ''}><Scale /><span>영지 특권 부담</span><strong>{Math.round(state.dynasty.estateBurden)}</strong><small>작위 {state.dynasty.titleGrants.length}건</small></article>
          <article><CircleDollarSign /><span>주간 왕실비</span><strong>{formatMoney(-dynasticEffects.weeklyCost, { signed: true })}</strong><small>{currentGovernmentForm.monarchy ? dynasticEffects.note : '왕실 지출 없음'}</small></article>
        </div>

        <div className="government-form-grid">
          {governmentForms.map((form) => {
            const eligibility = canAdoptGovernmentForm(state.dynasty, form.id, dynasticContext);
            const active = form.id === state.dynasty.formId;
            return (
              <button key={form.id} className={active ? 'active' : ''} disabled={active || !eligibility.allowed} onClick={() => onGovernmentFormChange(form.id)} title={active ? '현재 체제' : eligibility.reason}>
                <span>{form.monarchy ? <Crown size={15} /> : <Landmark size={15} />}{form.doctrine}</span>
                <strong>{form.name}</strong>
                <p>{form.description}</p>
                <small>정치력 {form.politicalCost} · {formatMoney(form.treasuryCost)} · 정통성 {form.minimumLegitimacy}+</small>
                <em>{active ? '현재 시행 중' : eligibility.allowed ? '헌정회의 소집 가능' : eligibility.reason}</em>
              </button>
            );
          })}
        </div>

        {!currentGovernmentForm.monarchy ? (
          <div className="dynastic-locked-state"><Crown /><div><strong>왕실 운영은 왕정 체제 전환 뒤 열립니다</strong><p>입헌군주국·왕권국가·제국연방·군사섭정을 선택하면 작위 서임, 영지 배분, 정략결혼, 왕위계승법과 왕위 찬탈 사건이 활성화됩니다.</p></div></div>
        ) : (
          <div className="court-management-grid">
            <section className="court-action-card">
              <div className="court-action-heading"><Castle /><span><small>작위·영지 배분</small><strong>참모에게 봉사 계약 부여</strong></span></div>
              <label>피서임자<select value={selectedRecipient?.id ?? ''} onChange={(event) => setSelectedRecipientId(event.target.value)} disabled={!dynasticAuthority || !selectedRecipient}>{availableRecipients.map((member) => <option key={member.id} value={member.id}>{member.name} · 충성 {member.loyalty} · 영향 {member.influence}</option>)}</select></label>
              <label>작위 등급<select value={selectedRankId} onChange={(event) => setSelectedRankId(event.target.value as NobleRankId)} disabled={!dynasticAuthority}>{nobleRanks.map((rank) => <option key={rank.id} value={rank.id}>{rank.name} · 정치 {rank.politicalCost} · {formatMoney(rank.treasuryCost)}</option>)}</select></label>
              <label>영지·책임구역<select value={selectedDomain?.id ?? ''} onChange={(event) => setSelectedDomainId(event.target.value)} disabled={!dynasticAuthority || !selectedDomain}>{availableDomains.map((territory) => <option key={territory.id} value={territory.id}>{territory.name} · {territory.region} · 가치 {territory.value}</option>)}</select></label>
              {selectedRecipient && <p>예상: 충성 {selectedRecipient.loyalty}가 높으면 결속이 오르고, 영향력 {selectedRecipient.influence}가 지나치게 크면 독자 권력과 찬탈 위험도 함께 커집니다.</p>}
              <button disabled={!dynasticAuthority || !selectedRecipient || !selectedDomain} onClick={() => selectedRecipient && selectedDomain && onGrantTitle({ recipientId: selectedRecipient.id, rankId: selectedRankId, domainId: selectedDomain.id })}>작위와 영지 서임</button>
            </section>

            <section className="court-action-card">
              <div className="court-action-heading"><HeartHandshake /><span><small>정략·왕실 혼인</small><strong>관계와 계승을 한 조약으로</strong></span></div>
              <label>상대 왕가<select value={selectedMarriage?.nationId ?? ''} onChange={(event) => setSelectedMarriageNationId(event.target.value)} disabled={!dynasticAuthority || !selectedMarriage}>{marriageCandidates.map((candidate) => {
                const relation = relations.find((item) => item.id === candidate.nationId);
                return <option key={candidate.nationId} value={candidate.nationId}>{candidate.houseName} · 관계 {relation?.value ?? 0}</option>;
              })}</select></label>
              {selectedMarriage && <div className="marriage-candidate-brief"><strong>{selectedMarriage.spouseStyle}</strong><p>{selectedMarriage.historicalBasis}</p><small>정치력 18 · {formatMoney(65)} · 관계 30 이상</small></div>}
              <button disabled={!dynasticAuthority || !selectedMarriage || (relations.find((relation) => relation.id === selectedMarriage.nationId)?.value ?? 0) < 30} onClick={() => selectedMarriage && onArrangeMarriage(selectedMarriage.nationId)}>혼인 조약 체결</button>

              <div className="succession-law-list">
                <strong>왕위계승법</strong>
                {(['primogeniture', 'absolute-primogeniture', 'elective', 'appointed'] as SuccessionLawId[]).map((lawId) => <button key={lawId} className={state.dynasty.successionLawId === lawId ? 'active' : ''} disabled={!dynasticAuthority || state.dynasty.successionLawId === lawId || game.politicalPower < 16} onClick={() => onSuccessionLawChange(lawId)}>{getSuccessionLawName(lawId)}</button>)}
              </div>
            </section>
          </div>
        )}

        {(state.dynasty.titleGrants.length > 0 || state.dynasty.marriages.length > 0) && (
          <div className="court-ledger">
            <div><h4>서임 작위·영지</h4>{state.dynasty.titleGrants.length === 0 ? <p>아직 서임한 작위가 없습니다.</p> : state.dynasty.titleGrants.map((grant) => <article key={grant.id}><span><strong>{grant.titleName}</strong><small>{grant.recipientName} · {grant.hereditary ? '세습' : '비세습'} · 주 {formatMoney(grant.weeklyStipend)}</small></span><button disabled={!dynasticAuthority || game.politicalPower < 12} onClick={() => onRevokeTitle(grant.id)}>회수</button></article>)}</div>
            <div><h4>혼인·계승 조약</h4>{state.dynasty.marriages.length === 0 ? <p>아직 체결한 왕실 혼인이 없습니다.</p> : state.dynasty.marriages.map((marriage) => <article key={marriage.id}><span><strong>{marriage.partnerHouse}</strong><small>{marriage.partnerNationName} · 관계 +{marriage.treatyValue} · 계승 +{marriage.successionGain}</small></span><b>제{marriage.arrangedWeek + 1}주</b></article>)}</div>
          </div>
        )}
      </section>

      {latestReport && (
        <section className="nation-surface nation-weekly-causality">
          <header><div><span>제{latestReport.week + 1}주 국정 결산</span><h3>무엇을 선택했고, 무엇이 달라졌는가</h3></div><strong>{formatMoney(latestReport.fiscalBalance, { signed: true })}</strong></header>
          <div className="causality-columns">
            <div><h4>원인</h4>{latestReport.causes.map((cause) => <p key={cause}>{localizeMoney(cause)}</p>)}</div>
            <ChevronRight className="causality-arrow" />
            <div><h4>결과</h4>{latestReport.effects.map((effect) => <p key={effect}>{localizeMoney(effect)}</p>)}</div>
          </div>
          {latestReport.events.map((event) => <article className={`nation-policy-event ${event.tone}`} key={event.id}><span>{event.title}</span><strong>{event.detail}</strong><p><b>발생 원인</b> {event.cause}</p><p><b>향후 영향</b> {event.consequence}</p></article>)}
        </section>
      )}
    </div>
  );
}
