import { useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpDown,
  Atom,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  ClipboardList,
  Crown,
  ExternalLink,
  Factory,
  Gauge,
  HeartHandshake,
  Landmark,
  Layers3,
  LayoutGrid,
  List,
  ListFilter,
  LockKeyhole,
  MessageSquare,
  Network,
  Package,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Target,
  Truck,
  UserRoundCog,
  UsersRound,
  X,
} from 'lucide-react';
import { policyDomains, strategicPolicies } from './choices';
import { historicalExperts, historicalExpertCoverage, minimumHistoricalExpertsPerNation } from './historicalExperts';
import { wartimeHistoricalExperts, wartimeHistoricalExpertCoverage, wartimeHistoricalExpertIds } from './wartimeHistoricalExperts';
import {
  defaultRecruitmentOffer,
  isCandidateShortlisted,
  assessRecruitmentOffer,
  sortTalentCandidates,
} from './recruitment';
import type { RecruitmentOffer, TalentMarketSort } from './recruitment';
import { RecruitmentNegotiation } from './RecruitmentNegotiation';
import { CandidateActionReview } from './CandidateActionReview';
import { StaffDecisionReview, createStaffDeskReview, getStaffDeskAvailability } from './StaffDecisionReview';
import type { StaffDeskContext, StaffDeskReview } from './StaffDecisionReview';
import { createStaffReviewGate, getStaffOfficeProblem } from './staffDecisions';
import type { StaffDecisionAction, StaffDecisionInput } from './staffDecisions';
import { assessPersonnelAction, createPersonnelReview, getCandidateScoutingPlan, getPersonnelScoutingSummary } from './personnelActions';
import type { PersonnelAction, PersonnelContext, PersonnelReview } from './personnelActions';
import { StaffNarrativeBoard } from './StaffNarrativeBoard';
import {
  assessStaffPromise,
  calculateCandidateSeatFit,
  createStaffManagementOverview,
  getStaffBuyIn,
  getStaffMorale,
  getStaffRoleSatisfaction,
  staffMeetingOptions,
} from './staffManagement';
import type { StaffMeetingTopic } from './staffManagement';
import type { StaffNarrativeState } from './staffNarrative';
import {
  calculateStaffSuitability,
  getStaffAuthorityProfile,
  getStaffSeatDefinition,
  getStaffSeatTitle,
  staffSeatDefinitions,
} from './staffOrganization';
import type { CampaignPhase } from './nationManagement';
import type {
  CareerRole,
  Commander,
  Division,
  GameState,
  NationProfile,
  PersonnelDiscipline,
  ProductionLine,
  StaffCandidate,
  StaffDepartment,
  StaffMember,
  Stockpile,
  SupplyPolicy,
} from './types';
import './OrganizationPanel.css';

export type OrganizationWorkspace = 'squad' | 'market';

export interface OrganizationPanelProps {
  game: GameState;
  nation: NationProfile;
  role: CareerRole;
  campaignPhase: CampaignPhase;
  careerReputation: number;
  careerOfferCount: number;
  careerStatusLabel: string;
  staff: StaffMember[];
  candidates: StaffCandidate[];
  divisions: Division[];
  commanders: Commander[];
  production: ProductionLine[];
  stockpile: Stockpile;
  supplyPolicy: SupplyPolicy;
  procurementFocusId: string | null;
  priorityDivisionId: string;
  selectedPolicies: string[];
  developmentFocusId: string | null;
  staffNarrative: StaffNarrativeState;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onMeetStaff: (id: string, topic: StaffMeetingTopic) => void;
  onToggleDelegation: (id: string) => void;
  onAssignStaff: (staffId: string, department: StaffDepartment) => void | boolean;
  onSetPriorityDivision: (id: string) => void;
  onSetProcurementFocus: (id: string) => void;
  onSetSupplyPolicy: (policy: SupplyPolicy) => void;
  onSelectPolicy: (policyId: string) => void;
  onSetDevelopmentFocus: (staffId: string) => void;
  onUpgradeStaff: (staffId: string) => void | boolean;
  onScoutCandidate: (candidateId: string) => void | boolean;
  onToggleShortlist: (candidateId: string) => void;
  onApproachCandidate: (candidateId: string) => void | boolean;
  onRecruitCandidate: (candidateId: string, offer: RecruitmentOffer) => void | boolean;
  onRenewStaff: (staffId: string) => void | boolean;
  onResolveStaffNarrative: (storylineId: string, optionId: string) => void;
  onOpenCareerMarket: () => void;
  workspace?: OrganizationWorkspace;
  onWorkspaceChange?: (workspace: OrganizationWorkspace) => void;
  hideWorkspaceNavigation?: boolean;
  onOpenDeliveryPledges?: (staffId: string) => void;
  busy?: boolean;
  onStopScouting?: (candidateId: string) => void | boolean;
  /** Required for paid staff actions. An unconnected roster stays read-only. */
  staffDecisionInput?: StaffDecisionInput;
}

export function getOrganizationStaffDecisionInput(props: Pick<OrganizationPanelProps, 'staffDecisionInput' | 'game' | 'role' | 'staff' | 'developmentFocusId' | 'campaignPhase' | 'nation' | 'busy'>): StaffDecisionInput | null {
  const input = props.staffDecisionInput;
  if (!input || input.role.nationId !== props.nation.id || input.role.id !== props.role.id || input.role.archetype !== props.role.archetype
    || input.role.tier !== props.role.tier || input.role.branch !== props.role.branch
    || input.campaignPhase !== props.campaignPhase || input.nationStatus !== props.nation.status
    || input.developmentFocusId !== props.developmentFocusId
    || JSON.stringify(input.game) !== JSON.stringify(props.game) || JSON.stringify(input.staff) !== JSON.stringify(props.staff)) return null;
  return { ...input, busy: Boolean(input.busy || props.busy) };
}

export function getOrganizationSelectedStaff(staff: StaffMember[], identity: { id: string; personId: string } | null) {
  return identity ? staff.find((member) => member.id === identity.id && member.personId === identity.personId) ?? null : null;
}

const departmentLabels: Record<StaffDepartment, string> = {
  operations: '작전',
  logistics: '군수',
  armaments: '병기',
  personnel: '인사',
  political: '정무',
  science: '과학기술',
  economy: '전시경제',
};

const disciplineLabels: Record<PersonnelDiscipline, string> = {
  military: '군사',
  science: '과학',
  engineering: '공학',
  medicine: '의학',
  economics: '경제',
  industry: '산업',
  intelligence: '정보',
  diplomacy: '외교',
  'social-science': '사회과학',
};

const disciplineFilters: Array<PersonnelDiscipline | 'all'> = [
  'all',
  'military',
  'science',
  'engineering',
  'medicine',
  'economics',
  'industry',
  'intelligence',
  'diplomacy',
  'social-science',
];

type TalentMarketScope = 'all' | 'shortlisted' | 'scouting' | 'completed' | 'available' | 'wartime' | 'later' | 'deep' | 'identity';

const talentScopeLabels: Record<TalentMarketScope, string> = {
  all: '전체',
  shortlisted: '관심 명단',
  scouting: '조사 중',
  completed: '조사 완료 보고서',
  available: '영입 가능',
  wartime: '1940년대 정밀 인물',
  later: '후대 인물',
  deep: '심층 검증',
  identity: '대규모 DB',
};

const talentSortLabels: Record<TalentMarketSort, string> = {
  recommended: '추천순',
  chance: '기본조건 설득 점수',
  ability: '현재 능력',
  potential: '잠재력',
  influence: '영향력',
  age: '젊은 인재',
  name: '이름',
};

const availabilityLabels = {
  available: '즉시 협상 가능',
  poachable: '현직 포섭 대상',
  opposition: '야권·비주류 인사',
  displaced: '보직에서 교체됨',
};

const statusLabels = {
  unscouted: '시장 등록',
  scouting: '조사 중',
  shortlisted: '최종 명단',
  signed: '영입 완료',
  lost: '경쟁 기관 이적',
};

const supplyPolicies: Array<{ id: SupplyPolicy; title: string; detail: string; effect: string }> = [
  { id: 'balanced', title: '균형 배분', detail: '전선과 예비대를 같은 기준으로 지원', effect: '안정적 운용' },
  { id: 'frontline', title: '전선 우선', detail: '이동·전투 중인 편제에 물자를 집중', effect: '전선 보급 +3 · 연료 -2/주' },
  { id: 'reserve', title: '후방 예비', detail: '회복 중인 편제를 빠르게 재건', effect: '회복 보급 +2 · 병력 +1/주' },
];

function Meter({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'gold' | 'red' }) {
  return <span className="org-meter"><i className={tone} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('');
}

const careerStageLabels = {
  developing: '육성 단계',
  emerging: '부상 단계',
  peak: '전성기',
  experienced: '경험 전수',
};

const hierarchyLabels = {
  leader: '지도부',
  core: '핵심 참모',
  support: '지원 참모',
};

const squadStatusLabels = {
  key: '핵심 인사',
  regular: '주요 인사',
  rotation: '순환 인사',
  development: '육성 인사',
};

const contractRiskLabels = {
  secure: '안정',
  review: '검토 필요',
  urgent: '긴급 협상',
  expired: '계약 만료',
};

export function OrganizationPanel({
  game,
  nation,
  role,
  campaignPhase,
  careerReputation,
  careerOfferCount,
  careerStatusLabel,
  staff,
  candidates,
  divisions,
  commanders,
  production,
  stockpile,
  supplyPolicy,
  procurementFocusId,
  priorityDivisionId,
  selectedPolicies,
  developmentFocusId,
  staffNarrative,
  formatMoney,
  onMeetStaff,
  onToggleDelegation,
  onAssignStaff,
  onSetPriorityDivision,
  onSetProcurementFocus,
  onSetSupplyPolicy,
  onSelectPolicy,
  onSetDevelopmentFocus,
  onUpgradeStaff,
  onScoutCandidate,
  onToggleShortlist,
  onApproachCandidate,
  onRecruitCandidate,
  onRenewStaff,
  onResolveStaffNarrative,
  onOpenCareerMarket,
  workspace: controlledWorkspace,
  onWorkspaceChange,
  hideWorkspaceNavigation = false,
  onOpenDeliveryPledges,
  busy = false,
  onStopScouting,
  staffDecisionInput,
}: OrganizationPanelProps) {
  const [talentQuery, setTalentQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<PersonnelDiscipline | 'all'>('all');
  const [talentScope, setTalentScope] = useState<TalentMarketScope>('all');
  const [talentSort, setTalentSort] = useState<TalentMarketSort>('recommended');
  const [talentPage, setTalentPage] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [staffView, setStaffView] = useState<'planner' | 'roster' | 'responsibilities' | 'dynamics'>('roster');
  const [internalWorkspace, setInternalWorkspace] = useState<OrganizationWorkspace>('squad');
  const workspace = controlledWorkspace ?? internalWorkspace;
  const setWorkspace = (value: OrganizationWorkspace) => {
    setStaffReview(null);
    if (controlledWorkspace === undefined) setInternalWorkspace(value);
    onWorkspaceChange?.(value);
  };
  const [selectedStaffIdentity, setSelectedStaffIdentity] = useState<{ id: string; personId: string } | null>(() => {
    const first = staff.find((member) => getStaffAuthorityProfile(role).managedDepartments.includes(member.department)) ?? staff[0];
    return first ? { id: first.id, personId: first.personId } : null;
  });
  const [staffReview, setStaffReview] = useState<StaffDeskReview | null>(null);
  const [staffReviewMessage, setStaffReviewMessage] = useState('');
  const staffReviewGate = useRef(createStaffReviewGate());
  const staffReviewReturnFocus = useRef<HTMLElement | null>(null);
  const staffReviewSequence = useRef(0);
  const detailId = useId();
  const reportId = useId();
  const negotiationId = useId();
  const [negotiatingCandidateId, setNegotiatingCandidateId] = useState<string | null>(null);
  const [negotiationSnapshot, setNegotiationSnapshot] = useState<StaffCandidate | null>(null);
  const [candidateReview, setCandidateReview] = useState<PersonnelReview | null>(null);
  const [meetingStaffIdentity, setMeetingStaffIdentity] = useState<{ id: string; personId: string } | null>(null);
  const [recruitmentOffer, setRecruitmentOffer] = useState<RecruitmentOffer>(defaultRecruitmentOffer);
  const officeProblem = staffDecisionInput ? getStaffOfficeProblem(staffDecisionInput) : null;
  const authority = useMemo(() => {
    const profile = getStaffAuthorityProfile(role);
    return officeProblem ? { ...profile, managedDepartments: [], maxDelegations: 0,
      label: '인사권 없음 · 열람 전용', summary: officeProblem, restrictionReason: officeProblem } : profile;
  }, [role, officeProblem]);
  const [selectedStaffDepartment, setSelectedStaffDepartment] = useState<StaffDepartment>(() => authority.managedDepartments[0] ?? 'operations');
  const manageableDepartments = useMemo(() => new Set(authority.managedDepartments), [authority]);
  const manageableStaffIds = useMemo(() => new Set(staff.filter((member) => manageableDepartments.has(member.department)).map((member) => member.id)), [manageableDepartments, staff]);
  const delegatedCount = staff.filter((member) => member.delegated).length;
  const managedDelegatedCount = staff.filter((member) => member.delegated && manageableDepartments.has(member.department)).length;
  const weeklyPayroll = staff.reduce((total, member) => total + member.weeklyCost, 0);
  const scienceAdvisor = staff.find((member) => member.department === 'science');
  const economyAdvisor = staff.find((member) => member.department === 'economy');
  const scienceBonus = scienceAdvisor?.delegated ? Math.max(2, Math.round((scienceAdvisor.ability + scienceAdvisor.influence) / 62)) : 0;
  const economyBonus = economyAdvisor?.delegated ? Math.max(8, Math.round((economyAdvisor.ability + economyAdvisor.influence) / 12)) : 0;
  const personnelContext: PersonnelContext = { game, role, reputation: careerReputation, staff, candidates, busy };
  const assessCandidateAction = (action: PersonnelAction) => officeProblem
    ? { allowed: false as const, reason: officeProblem }
    : assessPersonnelAction(personnelContext, action);
  const liveStaffInput = getOrganizationStaffDecisionInput({ staffDecisionInput, game, role, staff, developmentFocusId, campaignPhase, nation, busy });
  const staffDeskContext: StaffDeskContext = { input: liveStaffInput, formatMoney, onUpgradeStaff, onRenewStaff, onAssignStaff };
  const scoutingSummary = getPersonnelScoutingSummary(personnelContext);
  const shortlistCount = candidates.filter(isCandidateShortlisted).length;
  const scoutingCount = scoutingSummary.active;
  const scoutingCandidates = candidates.filter((candidate) => candidate.status === 'scouting' && candidate.knowledge < 100);
  const completedScoutCount = candidates.filter((candidate) => candidate.knowledge >= 100 && !['signed', 'lost'].includes(candidate.status)).length;
  const personnelDelegated = staff.some((member) => member.department === 'personnel' && member.delegated);
  const laterEraCount = candidates.filter((candidate) => candidate.historicalEra && candidate.historicalEra !== 'wartime').length;
  const wartimeCuratedCount = candidates.filter((candidate) => wartimeHistoricalExpertIds.has(candidate.personId)).length;
  const deepProfileCount = candidates.filter((candidate) => candidate.birthYear && !candidate.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q')).length;
  const filteredCandidates = useMemo(() => {
    const query = talentQuery.trim().toLocaleLowerCase('ko-KR');
    const filtered = candidates.filter((candidate) => {
      if (disciplineFilter !== 'all' && candidate.discipline !== disciplineFilter) return false;
      const laterEra = Boolean(candidate.historicalEra && candidate.historicalEra !== 'wartime');
      const identityOnly = (candidate.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q') ?? false) && !laterEra;
      if (talentScope === 'shortlisted' && !isCandidateShortlisted(candidate)) return false;
      if (talentScope === 'scouting' && (candidate.status !== 'scouting' || candidate.knowledge >= 100)) return false;
      if (talentScope === 'completed' && (candidate.knowledge < 100 || ['signed', 'lost'].includes(candidate.status))) return false;
      if (talentScope === 'available' && (candidate.status === 'signed' || candidate.status === 'lost')) return false;
      if (talentScope === 'wartime' && !wartimeHistoricalExpertIds.has(candidate.personId)) return false;
      if (talentScope === 'later' && !laterEra) return false;
      if (talentScope === 'deep' && (!candidate.birthYear || identityOnly || laterEra)) return false;
      if (talentScope === 'identity' && !identityOnly) return false;
      if (!query) return true;
      return [candidate.name, candidate.role, candidate.historicalOffice, candidate.affiliation, candidate.nationality, candidate.wartimeLocation, ...(candidate.expertise ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('ko-KR').includes(query));
    });
    return sortTalentCandidates(filtered, talentSort, careerReputation);
  }, [candidates, careerReputation, disciplineFilter, talentQuery, talentScope, talentSort]);
  const talentPageSize = 24;
  const talentPageCount = Math.max(1, Math.ceil(filteredCandidates.length / talentPageSize));
  const visibleTalentPage = Math.min(talentPage, talentPageCount - 1);
  const visibleCandidates = filteredCandidates.slice(visibleTalentPage * talentPageSize, (visibleTalentPage + 1) * talentPageSize);
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null;
  const negotiatingCandidate = candidates.find((candidate) => candidate.id === negotiatingCandidateId)
    ?? (negotiationSnapshot?.id === negotiatingCandidateId ? negotiationSnapshot : null);
  const meetingStaff = staff.find((member) => member.id === meetingStaffIdentity?.id && member.personId === meetingStaffIdentity.personId) ?? null;
  const selectedCandidateScore = selectedCandidate ? assessRecruitmentOffer(selectedCandidate, careerReputation, defaultRecruitmentOffer).score : 0;
  const selectedCandidateUnavailable = selectedCandidate?.status === 'signed' || selectedCandidate?.status === 'lost';
  const selectedCandidateManaged = selectedCandidate ? manageableDepartments.has(selectedCandidate.department) : false;
  const selectedCandidateIdentityOnly = Boolean(
    selectedCandidate?.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q')
    && selectedCandidate.historicalOffice.includes('정밀조사 필요'),
  );
  const selectedCandidateLaterEra = Boolean(selectedCandidate?.historicalEra && selectedCandidate.historicalEra !== 'wartime');
  const selectedSeat = getStaffSeatDefinition(selectedStaffDepartment);
  const selectedSeatMember = staff.find((member) => member.department === selectedStaffDepartment) ?? null;
  const staffOverview = useMemo(
    () => createStaffManagementOverview(staff, candidates, authority.managedDepartments, developmentFocusId),
    [authority.managedDepartments, candidates, developmentFocusId, staff],
  );
  const relationshipWatch = staffOverview.activeTensions
    ? staffOverview.relationships.filter((relationship) => relationship.kind === 'tension' || relationship.kind === 'rivalry').slice(0, 4)
    : [...staffOverview.relationships].sort((left, right) => right.affinity - left.affinity).slice(0, 3);
  const selectedSeatPlan = staffOverview.seats.find((seat) => seat.department === selectedStaffDepartment) ?? staffOverview.seats[0];
  const selectedStaff = getOrganizationSelectedStaff(staff, selectedStaffIdentity);
  const selectedStaffManaged = selectedStaff ? manageableDepartments.has(selectedStaff.department) : false;
  const selectedStaffDynamics = staffOverview.dynamics.find((record) => record.member.id === selectedStaff?.id);
  const selectedPromotion = selectedStaff ? getStaffDeskAvailability(liveStaffInput, { kind: 'promote', staffId: selectedStaff.id }) : null;
  const selectedRenewal = selectedStaff ? getStaffDeskAvailability(liveStaffInput, { kind: 'renew', staffId: selectedStaff.id }) : null;
  const selectedCandidateFit = selectedCandidate ? calculateCandidateSeatFit(selectedCandidate, selectedCandidate.department) : null;
  const recruitmentPriorities = [...staffOverview.seats].filter((seat) => seat.manageable).sort((left, right) => right.needScore - left.needScore).slice(0, 3);
  const rankedStaff = useMemo(() => staff
    .map((member) => ({ member, suitability: calculateStaffSuitability(member, selectedStaffDepartment) }))
    .sort((left, right) => right.suitability.score - left.suitability.score), [selectedStaffDepartment, staff]);
  const selectedCandidateNextAction = !selectedCandidate
    ? ''
    : officeProblem ? officeProblem
    : selectedCandidateUnavailable
      ? selectedCandidate.status === 'signed' ? '영입 완료: 직속 참모진에서 임명 상태를 확인하십시오.' : '경쟁 기관이 먼저 영입해 현재 시장에서는 접근할 수 없습니다.'
      : selectedCandidate.knowledge < 30
        ? `조사를 시작하면 즉시 정보 +8, 이후 매주 ${scoutingSummary.weeklyGain}씩 무료 갱신됩니다. 정보 30부터 접촉할 수 있습니다.`
        : selectedCandidate.knowledge < 55
          ? '비밀 접촉으로 관계·관심을 높이고, 조사를 계속해 정보 55%를 확보하십시오.'
          : !selectedCandidateManaged
            ? `${getStaffSeatTitle(selectedCandidate.department, campaignPhase, nation.status)}의 최종 임명은 권한 밖입니다. 조사와 접촉은 계속할 수 있습니다.`
          : selectedCandidateScore < 72
            ? `기본 설득 점수가 ${72 - selectedCandidateScore} 부족합니다. 비밀 접촉을 이어가거나 협상에서 권한·임기·보수를 개선하십시오.`
            : '기본 협상력이 충분합니다. 권한·임기·보수·보직 약속과 장기 재정 부담을 비교해 제안하십시오.';
  const revealCandidateReport = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setCandidateReview(null);
    setNegotiatingCandidateId(null);
    setWorkspace('market');
    window.setTimeout(() => {
      const report = document.getElementById(reportId);
      report?.focus({ preventScroll: true });
      report?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };
  const openNegotiation = (candidate: StaffCandidate) => {
    if (officeProblem) return;
    setCandidateReview(null);
    setSelectedCandidateId(candidate.id);
    setRecruitmentOffer(defaultRecruitmentOffer);
    setNegotiationSnapshot(candidate);
    setNegotiatingCandidateId(candidate.id);
    window.setTimeout(() => document.getElementById(negotiationId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const reviewCandidateAction = (candidateId: string, kind: PersonnelAction['kind']) => {
    if (officeProblem) return;
    setSelectedCandidateId(candidateId);
    setNegotiatingCandidateId(null);
    setCandidateReview(createPersonnelReview(personnelContext, { kind, candidateId }));
    window.setTimeout(() => {
      const review = document.getElementById(reportId)?.querySelector<HTMLElement>('.candidate-action-review');
      review?.focus({ preventScroll: true });
      review?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };
  const dispatchCandidateAction = (action: PersonnelAction) => {
    if (officeProblem) return false;
    if (action.kind === 'scout') return onScoutCandidate(action.candidateId);
    if (action.kind === 'stop-scout') return onStopScouting ? onStopScouting(action.candidateId) : false;
    if (action.kind === 'approach') return onApproachCandidate(action.candidateId);
    return false;
  };
  const openStaffMeeting = (staffId: string) => {
    const member = staff.find((person) => person.id === staffId);
    if (!member || !manageableDepartments.has(member.department)) return;
    setMeetingStaffIdentity({ id: member.id, personId: member.personId });
  };
  const selectStaffById = (staffId: string) => {
    const member = staff.find((person) => person.id === staffId);
    if (member) { setSelectedStaffIdentity({ id: member.id, personId: member.personId }); setStaffReview(null); }
  };
  const changeStaffView = (value: typeof staffView) => { setStaffReview(null); setStaffView(value); };
  const reviewStaffAction = (action: StaffDecisionAction) => {
    const next = createStaffDeskReview(staffDeskContext, action);
    if (!next) { setStaffReviewMessage(getStaffDeskAvailability(liveStaffInput, action).reason); return; }
    staffReviewReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    staffReviewSequence.current += 1;
    setStaffReview(next);
    setStaffReviewMessage('');
  };
  const closeStaffReview = () => {
    setStaffReview(null);
    setStaffReviewMessage('');
    window.setTimeout(() => {
      const origin = staffReviewReturnFocus.current;
      if (origin?.isConnected && !origin.matches(':disabled') && origin.getClientRects().length) { origin.focus(); return; }
      document.querySelector<HTMLElement>('.organization-panel-v2 .staff-management-tabs button[aria-pressed="true"]')?.focus();
    }, 0);
  };

  return (
    <div className={`organization-grid organization-panel-v2 workspace-${workspace}`}>
      {!hideWorkspaceNavigation && <nav className="organization-workspace-switch" aria-label="조직 운영 작업공간">
        <button type="button" className={workspace === 'squad' ? 'active' : ''} aria-pressed={workspace === 'squad'} onClick={() => setWorkspace('squad')}><UsersRound size={18} /><span><strong>참모 스쿼드</strong><small>보직·위임·계약·조직 분위기</small></span><em>{staff.length}</em></button>
        <button type="button" className={workspace === 'market' ? 'active' : ''} aria-pressed={workspace === 'market'} onClick={() => setWorkspace('market')}><Search size={18} /><span><strong>후보 시장</strong><small>탐색·조사·접촉·협상·영입</small></span><em>{shortlistCount + scoutingCount || candidates.length}</em></button>
      </nav>}
      <section className="management-card staff-card">
        <div className="management-heading org-workspace-heading">
          <div><span>{workspace === 'squad' ? 'STAFF SQUAD' : 'TALENT MARKET'}</span><h3>{workspace === 'squad' ? '참모 스쿼드' : '후보 시장'}</h3><p>{workspace === 'squad' ? '명단에서 한 명을 선택하고, 상태를 확인한 뒤 조치하십시오.' : '후보를 찾고 조사 보고서에서 정보·비용·임명 권한을 확인하십시오.'}</p></div>
          <button type="button" className={`org-career-link ${careerOfferCount > 0 ? 'has-offers' : ''}`} aria-label={`내 국제 경력 · ${careerStatusLabel} · 제안 ${careerOfferCount}건`} onClick={onOpenCareerMarket}><BriefcaseBusiness size={16} /><span><span className="org-career-label">내 국제 경력</span><small><span className="org-career-status">{careerStatusLabel} · </span>제안 {careerOfferCount}건</small></span></button>
        </div>
        {officeProblem && <p className="org-staff-action-notice" role="status"><strong>인사권 없음 · 열람 전용.</strong> {officeProblem} 조사·접촉·관심 명단 변경도 잠기지만 기존 참모와 후보 보고서는 계속 확인할 수 있습니다.</p>}
        {workspace === 'squad' && <>
        <div className="org-squad-summary" aria-label="참모진 핵심 현황">
          <span><small>현재 재직 / 직접 관리</small><strong>{staff.length}명 / {manageableStaffIds.size}명</strong></span>
          <span><small>전체 참모 주급</small><strong>{formatMoney(weeklyPayroll)}</strong></span>
          <span><small>계약 만료 임박 · 13주 이내</small><strong>{staffOverview.expiringContracts}명</strong></span>
        </div>
        <nav className="staff-management-tabs" aria-label="참모 관리 보기">
          <button type="button" className={staffView === 'roster' ? 'active' : ''} aria-pressed={staffView === 'roster'} onClick={() => changeStaffView('roster')}><List size={15} /> 명단·개인 관리</button>
          <button type="button" className={staffView === 'planner' ? 'active' : ''} aria-pressed={staffView === 'planner'} onClick={() => changeStaffView('planner')}><LayoutGrid size={15} /> 보직 배치</button>
          <button type="button" className={staffView === 'responsibilities' ? 'active' : ''} aria-pressed={staffView === 'responsibilities'} onClick={() => changeStaffView('responsibilities')}><ShieldCheck size={15} /> 책임 위임</button>
          <button type="button" className={staffView === 'dynamics' ? 'active' : ''} aria-pressed={staffView === 'dynamics'} onClick={() => changeStaffView('dynamics')}><HeartHandshake size={15} /> 분위기·계약{staffNarrative.activeStorylines.length > 0 && <em>{staffNarrative.activeStorylines.length}</em>}</button>
        </nav>

        {!liveStaffInput && <p className="org-staff-action-notice" role="status">인사·국고 기록 연결 필요 · 승급·계약 연장·보직 배치는 열람 전용입니다.</p>}
        {staffReviewMessage && <p className="org-staff-action-notice" role="status">{staffReviewMessage}</p>}
        {staffReview && <StaffDecisionReview key={staffReviewSequence.current} review={staffReview} context={staffDeskContext} gate={staffReviewGate.current} onClose={closeStaffReview} />}

        {staffView === 'planner' && (
          <div className="staff-planner-layout">
            <section className="staff-seat-board" aria-label="참모 보직 계획">
              <header><span><UserRoundCog size={16} /><strong>보직별 뎁스 차트</strong></span><small>보직과 인물을 고르고, 이동하는 모든 참모의 영향을 검토한 뒤 승인합니다.</small></header>
              <div className="staff-seat-grid">
                {staffSeatDefinitions.map((seat) => {
                  const member = staff.find((item) => item.department === seat.department);
                  const manageable = manageableDepartments.has(seat.department);
                  const suitability = member ? calculateStaffSuitability(member, seat.department) : null;
                  const selected = selectedStaffDepartment === seat.department;
                  const plan = staffOverview.seats.find((item) => item.department === seat.department);
                  return (
                    <button
                      type="button"
                      className={`staff-seat-card ${selected ? 'selected' : ''} ${manageable ? '' : 'locked'}`}
                      key={seat.department}
                      aria-pressed={selected}
                      onClick={() => { setStaffReview(null); setSelectedStaffDepartment(seat.department); }}
                    >
                      <span className="staff-seat-card-top"><em>{seat.label}</em>{manageable ? <small>관리 가능</small> : <small><LockKeyhole size={10} /> 상급 권한</small>}</span>
                      <strong>{getStaffSeatTitle(seat.department, campaignPhase, nation.status)}</strong>
                      <span className="staff-seat-person"><i style={{ borderColor: nation.accent }}>{member ? initials(member.name) : '—'}</i><span><b>{member?.name ?? '공석'}</b><small>{member?.specialty ?? '후보 영입 필요'}</small></span></span>
                      <span className="staff-seat-fit"><em>{suitability?.label ?? '공석'}</em><b>{suitability?.score ?? 0}</b><Meter value={suitability?.score ?? 0} tone={(suitability?.score ?? 0) < 55 ? 'red' : (suitability?.score ?? 0) < 75 ? 'gold' : 'blue'} /></span>
                      <span className="staff-seat-planning"><em className={plan?.priority}>{plan?.priority === 'top' ? '최우선 보강' : plan?.priority === 'standard' ? '보강 검토' : '안정'}</em><small>뎁스 {plan?.depthScore ?? 0} · 내부/외부 각 3명</small></span>
                      <span className={`staff-seat-duty ${member?.delegated ? 'delegated' : ''} ${manageable ? '' : 'superior'}`}>{!manageable ? '상급기관 결재 · 보고만' : member?.delegated ? '주간 책임 위임' : '사용자 직접 결재'}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            <aside className="staff-assignment-panel" aria-label={`${selectedSeat.label} 배치 후보`}>
              <header><span><small>SELECTED OFFICE</small><strong>{getStaffSeatTitle(selectedSeat.department, campaignPhase, nation.status)}</strong></span>{manageableDepartments.has(selectedSeat.department) ? <ShieldCheck size={18} /> : <LockKeyhole size={18} />}</header>
              <p>{selectedSeat.responsibility}</p>
              {!manageableDepartments.has(selectedSeat.department) ? (
                <div className="staff-authority-lock"><LockKeyhole size={22} /><strong>배치 권한 없음</strong><span>{authority.restrictionReason}</span><small>명단과 평가 정보는 열람할 수 있지만 임명·위임·육성은 상급기관이 결정합니다.</small></div>
              ) : (
                <>
                  <div className="staff-current-office"><small>현재 보직자</small><strong>{selectedSeatMember?.name ?? '공석'}</strong><span>{selectedSeatMember?.historicalOffice}</span></div>
                  <div className="staff-option-list">
                    {rankedStaff.map(({ member, suitability }, index) => {
                      const incumbent = member.department === selectedStaffDepartment;
                      const assignment = getStaffDeskAvailability(liveStaffInput, { kind: 'assign', staffId: member.id, department: selectedStaffDepartment });
                      return (
                        <article className={`staff-option ${incumbent ? 'incumbent' : ''}`} key={member.id}>
                          <span className="staff-option-rank">{index + 1}</span>
                          <span className="staff-option-copy"><strong>{member.name}</strong><small>{getStaffSeatTitle(member.department, campaignPhase, nation.status)} · 능력 {member.ability} · 잠재 {member.potential}</small><em>{suitability.reasons[0]}</em></span>
                          <span className="staff-option-score"><small>{suitability.label}</small><strong>{suitability.score}</strong></span>
                          <button type="button" disabled={!assignment.allowed} title={assignment.reason} aria-label={`${member.name} 보직 배치 검토`} onClick={() => reviewStaffAction({ kind: 'assign', staffId: member.id, department: selectedStaffDepartment })}>{incumbent ? '현재 배치' : <><ArrowRightLeft size={12} /> 배치 검토</>}</button>
                          {!assignment.allowed && !incumbent && <p className="org-assignment-reason">{assignment.reason}</p>}
                        </article>
                      );
                    })}
                  </div>
                  <section className="staff-external-depth">
                    <header><span><Search size={13} /><strong>외부 영입 뎁스</strong></span><small>정보 부족은 적합도에 불확실성 페널티로 반영됩니다.</small></header>
                    {selectedSeatPlan.externalDepth.map(({ candidate, score, label, uncertainty }, index) => (
                      <button type="button" key={candidate.id} onClick={() => { revealCandidateReport(candidate.id); setTalentScope('available'); }}>
                        <i>{index + 1}</i><span><strong>{candidate.name}</strong><small>정보 {candidate.knowledge}% · {uncertainty ? `불확실성 -${uncertainty}` : '검증 완료'}</small></span><em>{label}<b>{score}</b></em>
                      </button>
                    ))}
                  </section>
                  {selectedSeatMember && calculateStaffSuitability(selectedSeatMember, selectedStaffDepartment).score < 65 && <button type="button" className="staff-recruitment-prompt" onClick={() => { setDisciplineFilter(selectedSeat.preferredDisciplines[0]); setTalentQuery(''); setWorkspace('market'); }}><Search size={13} /> 적합도 부족 — 후보 시장에서 {departmentLabels[selectedSeat.department]} 후보 찾기</button>}
                </>
              )}
            </aside>
          </div>
        )}

        {staffView === 'roster' && (
          <div className="org-squad-layout">
            <section className="org-roster" aria-label="현재 참모 명단">
              <header><span><UsersRound size={16} /><strong>현재 재직자</strong></span><small>{staff.length}명 · 인물을 선택해 상세 보기</small></header>
              <label className="org-mobile-staff-picker"><span>참모 선택 <small>재직 {staff.length}명</small></span><select aria-label="참모 선택" aria-controls={detailId} value={selectedStaff?.id ?? ''} disabled={!staff.length} onChange={(event) => selectStaffById(event.target.value)}>
                {!selectedStaff && <option value="">{staff.length ? '인물을 다시 선택하십시오' : '현재 재직자가 없습니다'}</option>}
                {staff.map((member) => <option key={`${member.id}:${member.personId}`} value={member.id}>{member.name} · {getStaffSeatTitle(member.department, campaignPhase, nation.status)}{manageableDepartments.has(member.department) ? '' : ' · 열람 전용'}</option>)}
              </select></label>
              <div className="org-roster-list">
                {staff.map((member) => {
                  const manageable = manageableDepartments.has(member.department);
                  const selected = selectedStaff?.id === member.id && selectedStaff.personId === member.personId;
                  return <button type="button" key={`${member.id}:${member.personId}`} className={`org-roster-person ${selected ? 'selected' : ''}`} aria-pressed={selected} aria-controls={detailId} onClick={() => selectStaffById(member.id)}>
                    <i className="org-person-monogram" aria-hidden="true">{initials(member.name)}</i>
                    <span className="org-roster-person-copy"><strong>{member.name}</strong><small>{getStaffSeatTitle(member.department, campaignPhase, nation.status)}</small><em>{manageable ? member.delegated ? '직접 관리 · 위임 중' : '직접 관리 · 직접 결재' : '상급기관 관리 · 열람'}</em></span>
                    <span className="org-roster-ability"><small>능력</small><b>{member.ability}</b></span>
                  </button>;
                })}
                {!staff.length && <p className="org-empty">현재 재직 중인 참모가 없습니다. 후보 시장에서 인사권에 맞는 후보를 확인하십시오.</p>}
              </div>
              <button type="button" className="org-market-link" onClick={() => setWorkspace('market')}><Search size={16} /> 후보 시장에서 보강 <ChevronRight size={16} /></button>
            </section>
            <section className="org-person-detail" id={detailId} aria-label={selectedStaff ? `${selectedStaff.name} 참모 상세` : '참모 상세'}>
              {selectedStaff ? <>
                <header className="org-person-heading">
                  <i className="org-person-monogram large" title="이름 머리글자 · 인물 사진 아님" aria-hidden="true">{initials(selectedStaff.name)}</i>
                  <div><small>{getStaffSeatTitle(selectedStaff.department, campaignPhase, nation.status)}</small><h4>{selectedStaff.name}</h4><p>{selectedStaff.specialty}</p></div>
                  <span className={`org-access-tag ${selectedStaffManaged ? 'managed' : 'locked'}`}>{selectedStaffManaged ? <ShieldCheck size={14} /> : <LockKeyhole size={14} />}{selectedStaffManaged ? '직접 관리' : '열람 전용'}</span>
                </header>
                <div className="org-person-ratings" aria-label="선택한 참모 상태">
                  <span><small>현재 / 잠재 능력</small><strong>{selectedStaff.ability} / {selectedStaff.potential}</strong><Meter value={selectedStaff.ability} /></span>
                  <span><small>사기</small><strong>{getStaffMorale(selectedStaff)}</strong><Meter value={getStaffMorale(selectedStaff)} tone={getStaffMorale(selectedStaff) < 50 ? 'red' : 'blue'} /></span>
                  <span><small>충성도</small><strong>{Math.round(selectedStaff.loyalty)}</strong><Meter value={selectedStaff.loyalty} tone={selectedStaff.loyalty < 55 ? 'red' : 'gold'} /></span>
                  <span><small>업무량</small><strong>{Math.round(selectedStaff.workload)}%</strong><Meter value={selectedStaff.workload} tone={selectedStaff.workload > 75 ? 'red' : 'blue'} /></span>
                  <span><small>성장 등급 {selectedStaff.grade}/3 · 보직 별과 별도</small><strong>{selectedStaff.development}%</strong><Meter value={selectedStaff.development} tone="gold" /></span>
                  <span><small>주급 / 잔여 계약</small><strong>{formatMoney(selectedStaff.weeklyCost)} / {selectedStaffDynamics?.contractWeeks ?? '미확인'}주</strong></span>
                </div>
                {selectedStaffDynamics && <div className={`org-person-commitment ${selectedStaffDynamics.promise.state}`}><span><HeartHandshake size={15} /><strong>임명 합의 · {selectedStaffDynamics.promise.label}</strong></span><p>{selectedStaffDynamics.promise.summary}</p><small>역할 만족 {selectedStaffDynamics.roleSatisfaction} · 지도부 수용 {selectedStaffDynamics.buyIn} · 계약 {contractRiskLabels[selectedStaffDynamics.contractRisk]}</small></div>}
                {!selectedStaffManaged && <p className="org-authority-notice"><LockKeyhole size={16} />{authority.restrictionReason} 이 인물은 열람만 가능하며, 아래 관리 조치는 실행할 수 없습니다.</p>}
                <div className="org-person-actions" aria-label="선택한 참모 관리 조치">
                  <button type="button" disabled={!selectedStaffManaged} onClick={() => openStaffMeeting(selectedStaff.id)}><MessageSquare size={16} /> 면담 의제 선택</button>
                  <button type="button" disabled={!selectedStaffManaged || (!selectedStaff.delegated && managedDelegatedCount >= authority.maxDelegations)} className={selectedStaff.delegated ? 'active' : ''} title={!selectedStaffManaged ? authority.restrictionReason : !selectedStaff.delegated && managedDelegatedCount >= authority.maxDelegations ? '현재 보직의 책임 위임 한도에 도달했습니다.' : '위임 상태를 변경합니다.'} onClick={() => onToggleDelegation(selectedStaff.id)}><Check size={16} /> {!selectedStaffManaged ? '인사권 없음' : selectedStaff.delegated ? '위임 회수' : managedDelegatedCount >= authority.maxDelegations ? '위임 한도 도달' : '책임 위임'}</button>
                  <button type="button" disabled={!selectedStaffManaged} className={developmentFocusId === selectedStaff.id ? 'active' : ''} onClick={() => onSetDevelopmentFocus(selectedStaff.id)}><Star size={16} /> {developmentFocusId === selectedStaff.id ? '육성 대상으로 지정됨' : '육성 대상으로 지정'}</button>
                  <button type="button" disabled={!selectedPromotion?.allowed} title={selectedPromotion?.reason} onClick={() => reviewStaffAction({ kind: 'promote', staffId: selectedStaff.id })}><RefreshCw size={16} /> 승급 검토</button>
                  {selectedStaffDynamics && <button type="button" disabled={!selectedRenewal?.allowed} title={selectedRenewal?.reason} onClick={() => reviewStaffAction({ kind: 'renew', staffId: selectedStaff.id })}><CalendarClock size={16} /> {selectedStaffDynamics.contractRisk === 'secure' ? '계약 안정' : '재계약 검토 · 104주 추가'}</button>}
                  <button type="button" onClick={() => { setSelectedStaffDepartment(selectedStaff.department); changeStaffView('planner'); }}><ArrowRightLeft size={16} /> 보직 배치 비교</button>
                  {onOpenDeliveryPledges && campaignPhase === 'nation' && selectedStaffManaged && <button type="button" className="org-pledge-link" onClick={() => onOpenDeliveryPledges(selectedStaff.id)}><Target size={16} /> 이 참모의 이행 약속 열기</button>}
                </div>
                <ul className="org-staff-action-reasons">
                  <li><strong>승급</strong> {selectedPromotion?.allowed ? `정치력 ${selectedPromotion.result.cost.politicalPower} · ${formatMoney(selectedPromotion.result.cost.treasury, { exact: true })}. 새 주급과 성장 변화를 검토합니다.` : selectedPromotion?.reason}</li>
                  <li><strong>계약 연장</strong> {selectedRenewal?.allowed ? `정치력 ${selectedRenewal.result.cost.politicalPower} · 보너스 ${formatMoney(selectedRenewal.result.cost.treasury, { exact: true })}. 남은 ${selectedStaffDynamics?.contractWeeks ?? 0}주에 104주를 더합니다.` : selectedRenewal?.reason}</li>
                </ul>
                <p className="org-read-only-note">{officeProblem ? '인물 선택과 상세 열람에는 비용이나 성과 보상이 없습니다. 현재는 인사권이 없어 면담·위임·육성·승급·재계약·보직 배치를 실행할 수 없습니다.' : '인물 선택과 상세 열람에는 비용이나 성과 보상이 없습니다. 승급·재계약·보직 배치는 검토서를 읽고 최종 승인합니다. 위임·육성은 바로 변경되며, 면담은 의제를 고른 뒤 실행합니다.'}</p>
                {selectedStaffDynamics?.contractRisk === 'expired' && <p className="org-staff-action-notice">계약이 만료됐지만 자동 퇴직하지는 않습니다. 직무와 주급은 유지되며, 주간 처리에서 위임이 회수되고 사기가 떨어지므로 재계약을 검토하십시오.</p>}
                <details className="org-disclosure org-person-background"><summary><ClipboardList size={16} /><span>경력·전문 분야와 역사 자료</span><ChevronRight size={16} /></summary><div className="org-disclosure-body"><p>{selectedStaff.historicalOffice} · {selectedStaff.affiliation}</p><p>{selectedStaff.summary}</p>{selectedStaff.expertise?.length ? <p>전문 분야: {selectedStaff.expertise.join(' · ')}</p> : null}{selectedStaff.historicalConstraint && <p>역사적 제약: {selectedStaff.historicalConstraint}</p>}{selectedStaff.friction && <p>조직 마찰: {selectedStaff.friction}</p>}{selectedStaff.networks?.length ? <p>인맥: {selectedStaff.networks.join(' · ')}</p> : null}{selectedStaff.appointmentEffect && <p>임명 효과: {selectedStaff.appointmentEffect}</p>}{selectedStaff.sourceUrl && <a href={selectedStaff.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> {selectedStaff.sourceLabel ?? '역사 자료 보기'}</a>}</div></details>
              </> : <div className="org-empty"><UsersRound size={28} /><h4>선택할 재직자가 없습니다</h4><p>없는 인물을 대신 표시하지 않습니다. 실제 임명 후 이곳에서 관리할 수 있습니다.</p></div>}
            </section>
          </div>
        )}

        {staffView === 'responsibilities' && (
          <section className="staff-responsibility-board" aria-label="참모 책임 위임">
            <header><span><ShieldCheck size={17} /><strong>책임 배분 현황</strong></span><em>{managedDelegatedCount}/{authority.maxDelegations}개 위임 · 과학 +{scienceBonus}/주 · 재정 {formatMoney(economyBonus, { signed: true })}/주</em></header>
            <p>직접 결재는 통제력을 유지하고, 위임은 참모의 능력과 전공에 따른 주간 보너스를 활성화합니다. 시작 직함의 책임 한도를 넘길 수 없습니다.</p>
            <div className="staff-responsibility-grid">
              {staffSeatDefinitions.map((seat) => {
                const member = staff.find((item) => item.department === seat.department);
                const manageable = manageableDepartments.has(seat.department);
                return (
                  <article className={manageable ? '' : 'locked'} key={seat.department}>
                    <header><span><small>{seat.label}</small><strong>{getStaffSeatTitle(seat.department, campaignPhase, nation.status)}</strong></span>{manageable ? <ShieldCheck size={15} /> : <LockKeyhole size={15} />}</header>
                    <p>{seat.responsibility}</p>
                    <span className="staff-responsibility-owner"><b>{member?.name ?? '공석'}</b><small>{member?.specialty}</small></span>
                    <button type="button" disabled={!manageable || !member || (!member.delegated && managedDelegatedCount >= authority.maxDelegations)} className={member?.delegated ? 'active' : ''} onClick={() => member && onToggleDelegation(member.id)}>{!manageable ? '상급기관 권한' : member?.delegated ? <><Check size={12} /> 위임 중 — 회수</> : managedDelegatedCount >= authority.maxDelegations ? '위임 한도 도달' : '주간 책임 위임'}</button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {staffView === 'dynamics' && (
          <section className="staff-dynamics-board" aria-label="참모진 분위기와 계약">
            <header><span><HeartHandshake size={17} /><strong>조직 위계·관계·역할 만족도·계약</strong></span><em>사기 {staffOverview.atmosphere} · 지지 {staffOverview.leadershipSupport} · 결속 {staffOverview.teamCohesion}</em></header>
            <p>참모는 영향력과 능력에 따라 지도부·핵심·지원 계층을 형성합니다. 소속·전문 분야·공동 책임으로 쌓인 관계와 영향 블록의 결속, 임명 약속과 계약 상태가 매주 사기와 역할 만족에 반영됩니다.</p>
            <details className="org-disclosure"><summary><MessageSquare size={16} /><span>참모 현안과 기존 처리 기록 <small>{staffNarrative.activeStorylines.length}건의 활성 현안</small></span><ChevronRight size={16} /></summary><div className="org-disclosure-body">
            <StaffNarrativeBoard
              state={staffNarrative}
              staff={staff}
              week={game.week}
              politicalPower={game.politicalPower}
              manageableStaffIds={manageableStaffIds}
              onResolve={onResolveStaffNarrative}
              onMeet={openStaffMeeting}
            />
            </div></details>
            <div className="staff-social-dynamics">
              <section className="staff-influence-blocs">
                <header><span><UsersRound size={14} /><strong>영향 블록</strong></span><em>관계 기반 내부 결속</em></header>
                <div>
                  {staffOverview.influenceBlocs.filter((bloc) => bloc.members.length).map((bloc) => (
                    <article className={bloc.status} key={bloc.id} title={bloc.summary}>
                      <span><small>{bloc.status === 'united' ? '결집' : bloc.status === 'stable' ? '안정' : '분열'}</small><strong>{bloc.label}</strong><em>{bloc.members.map((member) => member.name).join(' · ')}</em></span>
                      <span><small>결속</small><b>{bloc.cohesion}</b><Meter value={bloc.cohesion} tone={bloc.cohesion < 46 ? 'red' : bloc.cohesion < 68 ? 'gold' : 'blue'} /></span>
                      <span><small>평균 영향력</small><b>{bloc.influence}</b></span>
                    </article>
                  ))}
                </div>
              </section>
              <section className={`staff-relationship-watch ${staffOverview.activeTensions ? 'warning' : ''}`}>
                <header><span><Network size={14} /><strong>{staffOverview.activeTensions ? `긴장 관계 ${staffOverview.activeTensions}건` : '핵심 신뢰 관계'}</strong></span><em>{staffOverview.activeTensions ? '중재 우선순위' : '조직 자산'}</em></header>
                <div>
                  {relationshipWatch.map((relationship) => (
                    <article className={relationship.kind} key={relationship.id} title={relationship.reason}>
                      <span><strong>{relationship.first.name}</strong><i>↔</i><strong>{relationship.second.name}</strong></span>
                      <em>{relationship.label} · {relationship.reason}</em>
                      <b>{relationship.affinity}</b>
                    </article>
                  ))}
                  {!relationshipWatch.length && <p>현재 관리 범위에는 비교할 참모 관계가 충분하지 않습니다.</p>}
                </div>
              </section>
            </div>
            <div className="staff-dynamics-list">
              {staffOverview.dynamics.map((record) => {
                const manageable = manageableDepartments.has(record.member.department);
                const renewal = getStaffDeskAvailability(liveStaffInput, { kind: 'renew', staffId: record.member.id });
                return (
                  <article className={`${record.contractRisk} ${manageable ? '' : 'locked'}`} key={record.member.id}>
                    <span className="staff-dynamic-person"><i style={{ borderColor: nation.accent }}>{initials(record.member.name)}</i><span><small>{hierarchyLabels[record.hierarchy]} · {careerStageLabels[record.careerStage]}</small><strong>{record.member.name}</strong><em>{getStaffSeatTitle(record.member.department, campaignPhase, nation.status)}</em></span></span>
                    <span className="staff-dynamic-rating"><small>사기</small><strong>{record.morale}</strong><Meter value={record.morale} tone={record.morale < 50 ? 'red' : 'blue'} /></span>
                    <span className="staff-dynamic-rating"><small>역할 만족</small><strong>{record.roleSatisfaction}</strong><Meter value={record.roleSatisfaction} tone={record.roleSatisfaction < 50 ? 'red' : 'gold'} /></span>
                    <span className="staff-dynamic-rating"><small>지도부 수용</small><strong>{record.buyIn}</strong><Meter value={record.buyIn} tone={record.buyIn < 50 ? 'red' : 'blue'} /></span>
                    <span className={`staff-contract-cell ${record.contractRisk}`}><small>{squadStatusLabels[record.member.squadStatus ?? (record.hierarchy === 'leader' ? 'key' : record.hierarchy === 'core' ? 'regular' : 'rotation')]}</small><strong>{record.contractWeeks}주</strong><em>{contractRiskLabels[record.contractRisk]}</em></span>
                    <span className={`staff-promise-cell ${record.promise.state}`} title={record.promise.summary}><small>임명 합의</small><strong>{record.promise.label}</strong><em>{record.promise.summary}</em></span>
                    <div className="org-dynamics-renewal"><button type="button" disabled={!renewal.allowed} title={renewal.reason} aria-label={`${record.member.name} 재계약 검토`} onClick={() => reviewStaffAction({ kind: 'renew', staffId: record.member.id })}><CalendarClock size={12} /> {record.contractRisk === 'secure' ? '계약 안정' : '재계약 검토 · 104주 추가'}</button><small>{renewal.allowed ? `정치력 ${renewal.result.cost.politicalPower} · ${formatMoney(renewal.result.cost.treasury, { exact: true })}` : renewal.reason}</small></div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <details className="org-disclosure org-authority-disclosure">
          <summary><ShieldCheck size={16} /><span>인사권과 현재 지휘계통 <small>{authority.label} · 직접 관리 {authority.managedDepartments.length}개 보직</small></span><ChevronRight size={16} /></summary>
          <div className="org-disclosure-body">
        <div className="staff-management-hero">
          <div className="staff-command-identity">
            <span className="staff-command-icon">{role.tier === 1 ? <Crown size={22} /> : <BriefcaseBusiness size={22} />}</span>
            <span><small>{campaignPhase === 'war' ? 'WAR OFFICE' : nation.status === 'sovereign' ? 'POSTWAR GOVERNMENT' : 'FOUNDING GOVERNMENT'}</small><strong>{role.title}</strong><em>{authority.label} · {role.scope}</em></span>
          </div>
          <div className="staff-authority-summary">
            <span><small>직접 관리</small><strong>{authority.managedDepartments.length}<em> / {staff.length}</em></strong></span>
            <span><small>책임 위임</small><strong>{managedDelegatedCount}<em> / {authority.maxDelegations}</em></strong></span>
            <span><small>전체 위임 현황</small><strong>{delegatedCount}<em>석</em></strong></span>
          </div>
          <p>{authority.summary} <b>{authority.restrictionReason}</b></p>
        </div>
        <div className="replacement-seat-card compact">
          <span>HISTORICAL REPLACEMENT</span>
          <div><strong>{role.historicalHolderName}</strong><small>{role.historicalOffice}</small></div>
          <p>{officeProblem ? '이 인물과 직함은 경력·지휘계통의 참고 기록입니다. 현재 인사권을 뜻하지 않으며, 공식 보직에 취임한 뒤 실제 권한을 다시 확인해야 합니다.' : '당신이 이 실존 인물의 자리를 대체했습니다. 시작 직함에서 부여받은 인사권 범위는 정권이 바뀌어도 지휘계통으로 유지되며, 보직 명칭과 책임만 시대에 맞게 개편됩니다.'}</p>
        </div>
          </div>
        </details>
        <details className="org-disclosure org-briefing-disclosure">
          <summary><ClipboardList size={16} /><span>주간 진단과 보강 우선순위 <small>사기 {staffOverview.atmosphere} · 과부하 {staffOverview.overloadedStaff}명 · 약속 위반 {staffOverview.brokenPromises}건</small></span><ChevronRight size={16} /></summary>
          <div className="org-disclosure-body">
        <section className="staff-weekly-briefing" aria-label="참모진 주간 브리핑">
          <header><span><ClipboardList size={16} /><strong>이번 주 참모진 브리핑</strong><small>뎁스·계약·사기·업무량을 한 번에 진단합니다.</small></span><em>{staffOverview.topNeed ? `최우선 보강: ${departmentLabels[staffOverview.topNeed.department]}` : '보강 필요 없음'}</em></header>
          <div className="staff-briefing-kpis">
            <span><HeartHandshake size={15} /><small>조직 분위기</small><strong>{staffOverview.atmosphere}</strong><Meter value={staffOverview.atmosphere} tone={staffOverview.atmosphere < 55 ? 'red' : 'blue'} /></span>
            <span><Layers3 size={15} /><small>보직 뎁스</small><strong>{staffOverview.roleCoverage}</strong><Meter value={staffOverview.roleCoverage} tone={staffOverview.roleCoverage < 55 ? 'red' : 'gold'} /></span>
            <span><ShieldCheck size={15} /><small>지도부 지지</small><strong>{staffOverview.leadershipSupport}</strong><Meter value={staffOverview.leadershipSupport} tone={staffOverview.leadershipSupport < 55 ? 'red' : 'blue'} /></span>
            <span className={staffOverview.expiringContracts ? 'warning' : ''}><CalendarClock size={15} /><small>13주 내 만료</small><strong>{staffOverview.expiringContracts}</strong><em>명</em></span>
            <span className={staffOverview.overloadedStaff ? 'warning' : ''}><AlertTriangle size={15} /><small>과부하 참모</small><strong>{staffOverview.overloadedStaff}</strong><em>명</em></span>
            <span className={staffOverview.brokenPromises ? 'warning' : ''}><HeartHandshake size={15} /><small>위반된 임명 약속</small><strong>{staffOverview.brokenPromises}</strong><em>건</em></span>
          </div>
          <div className="staff-recruitment-priorities">
            {recruitmentPriorities.map((plan, index) => (
              <button type="button" key={plan.department} onClick={() => { setSelectedStaffDepartment(plan.department); setStaffView('planner'); }}>
                <i>{index + 1}</i><span><small>{plan.priority === 'top' ? 'TOP PRIORITY' : plan.priority === 'standard' ? 'STANDARD' : 'MONITOR'}</small><strong>{getStaffSeatTitle(plan.department, campaignPhase, nation.status)}</strong><em>{plan.warning}</em></span><b>{plan.needScore}</b>
              </button>
            ))}
          </div>
        </section>
          </div>
        </details>
        </>}

        {workspace === 'market' && (<div className="recruitment-hub" id="staff-recruitment-hub">
          <div className="org-squad-summary" aria-label="후보 시장 현황"><span><small>현재 시장 등록</small><strong>{candidates.length}명</strong></span><span><small>관심 명단</small><strong>{shortlistCount}명</strong></span><span><small>조사 진행 중</small><strong>{scoutingCount}명</strong></span></div>
          <section className="org-scouting-desk" aria-label="조사 업무 현황">
            <header><span><Search size={18} /><strong>조사 업무</strong><small>시작할 때 한 번 지출 · 이후 매주 자동 갱신</small></span><b>{scoutingCount} / {scoutingSummary.capacity} 슬롯</b></header>
            <p>신규 조사 2 PP · 즉시 정보 +8 · 매주 +{scoutingSummary.weeklyGain} 무료. 정보 100%에 도달하면 슬롯을 반환하고 보고서가 남습니다. 관심 등록은 조사를 중단하지 않습니다.</p>
            <div className="org-scouting-routes"><button type="button" onClick={() => { setTalentScope('scouting'); setTalentPage(0); }}>진행 중 {scoutingCount}명 보기</button><button type="button" onClick={() => { setTalentScope('completed'); setTalentPage(0); }}>완료 보고서 {completedScoutCount}명 보기</button><span>빈 슬롯 {scoutingSummary.available}개 · {personnelDelegated ? '인사 업무 위임 중' : '기본 조사 속도'}</span></div>
            {scoutingCandidates.length > 0 ? <div className="org-scouting-jobs">{scoutingCandidates.map((candidate) => {
              const plan = getCandidateScoutingPlan(candidate, personnelDelegated);
              const stop = assessCandidateAction({ kind: 'stop-scout', candidateId: candidate.id });
              return <article key={candidate.id}><span><strong>{candidate.name}</strong><small>정보 {candidate.knowledge}% · 현재 속도 유지 시 약 {plan.weeksToComplete}주 후 완료</small><Meter value={candidate.knowledge} /></span><button type="button" onClick={() => revealCandidateReport(candidate.id)}>보고서</button><button type="button" disabled={!stop.allowed || !onStopScouting} title={!stop.allowed ? stop.reason : '확보 정보를 보존하고 슬롯을 반환합니다.'} onClick={() => reviewCandidateAction(candidate.id, 'stop-scout')}>중단 검토 · 무료</button></article>;
            })}</div> : <p className="org-scouting-empty">진행 중인 조사가 없습니다. 후보의 조사 보고서를 열고 ‘조사 검토’를 선택하십시오.</p>}
          </section>
          <div className="org-market-filterbar">
          <div className="talent-toolbar">
            <label className="org-talent-search"><Search size={18} /><span className="org-sr-only">후보 이름·직책·기관·전문 분야 검색</span><input value={talentQuery} onChange={(event) => { setTalentQuery(event.target.value); setTalentPage(0); }} placeholder="이름·직책·기관·전문 분야 검색" /></label>
            <label className="org-discipline-select"><span>전문 분야</span><select value={disciplineFilter} onChange={(event) => { setDisciplineFilter(event.target.value as PersonnelDiscipline | 'all'); setTalentPage(0); }}>
              {disciplineFilters.map((discipline) => (
                <option value={discipline} key={discipline}>
                  {discipline === 'all' ? '전체' : disciplineLabels[discipline]}
                </option>
              ))}
            </select></label>
          </div>
          <div className="talent-market-controls">
            <div className="talent-scope-list" aria-label="인재 시장 보기 필터">
              <ListFilter size={16} /><label><span>시장 범위</span><select value={talentScope} onChange={(event) => { setTalentScope(event.target.value as TalentMarketScope); setTalentPage(0); }}>{(Object.keys(talentScopeLabels) as TalentMarketScope[]).map((scope) => {
                const count = scope === 'shortlisted' ? shortlistCount : scope === 'scouting' ? scoutingCount : scope === 'completed' ? completedScoutCount : scope === 'wartime' ? wartimeCuratedCount : scope === 'later' ? laterEraCount : scope === 'deep' ? deepProfileCount : null;
                return <option value={scope} key={scope}>{talentScopeLabels[scope]}{count !== null ? ` (${count})` : ''}</option>;
              })}</select></label>
            </div>
            <label className="talent-sort"><ArrowUpDown size={11} /><span>정렬</span><select value={talentSort} onChange={(event) => { setTalentSort(event.target.value as TalentMarketSort); setTalentPage(0); }}>{(Object.keys(talentSortLabels) as TalentMarketSort[]).map((sort) => <option value={sort} key={sort}>{talentSortLabels[sort]}</option>)}</select></label>
          </div>
          </div>
          <p className="org-market-result-count" role="status">검색 결과 {filteredCandidates.length}명 · {visibleTalentPage + 1}/{talentPageCount}쪽 · 후보 선택·보고서 열람에는 비용이나 성과 보상이 없습니다.</p>
          {busy && <p className="org-market-result-count" role="status">주간 진행 중에는 조사를 포함한 인사 조치를 잠급니다. 목록과 보고서는 계속 열람할 수 있습니다.</p>}
          {negotiatingCandidate && !officeProblem && <div id={negotiationId} className="org-negotiation-workspace"><RecruitmentNegotiation
            key={`${negotiatingCandidate.id}-${negotiatingCandidate.personId}`}
            candidate={negotiatingCandidate}
            context={personnelContext}
            busy={busy}
            offer={recruitmentOffer}
            politicalPower={game.politicalPower}
            treasury={game.treasury}
            reputation={careerReputation}
            formatMoney={formatMoney}
            onChange={setRecruitmentOffer}
            onClose={() => { setNegotiatingCandidateId(null); setNegotiationSnapshot(null); }}
            onSubmit={() => onRecruitCandidate(negotiatingCandidate.id, recruitmentOffer)}
          /></div>}
          <div className={`org-market-results ${selectedCandidate ? 'has-report' : ''}`}>
          {selectedCandidateId && !selectedCandidate && <p className="org-market-result-count" role="status">선택했던 후보는 현재 시장에 없습니다. 임명·이적 후 다른 인물을 자동으로 대신 선택하지 않습니다.</p>}
          {selectedCandidate && (
            <section className="candidate-report" id={reportId} role="region" tabIndex={-1} aria-label={`${selectedCandidate.name} 조사 보고서`}>
              <header>
                <span><ClipboardList size={16} /><small>PERSONNEL DOSSIER · 정보 신뢰도 {selectedCandidate.knowledge}%</small><strong>{selectedCandidate.name} 조사 보고서</strong></span>
                <button type="button" onClick={() => { setSelectedCandidateId(null); setCandidateReview(null); setNegotiatingCandidateId(null); }} aria-label="조사 보고서 닫기"><X size={15} /></button>
              </header>
              <div className={`candidate-verification ${selectedCandidateLaterEra ? 'later-era' : selectedCandidateIdentityOnly ? 'identity-only' : 'deep-profile'}`}>
                <ShieldCheck size={13} />
                <span>
                  <strong>{selectedCandidateLaterEra ? '후대 실존 인물 · 대체역사 임명' : selectedCandidateIdentityOnly ? '신원·국적·생년·직업 확인' : '1940년대 경력 심층 검증 프로필'}</strong>
                  <small>{selectedCandidateLaterEra ? `실제 신원·출생·공개 직업만 사료 정보입니다. ${selectedCandidate.marketEntryYear}년의 접촉 경로·능력·충성·임명 효과는 현재 세계선의 게임 설정입니다.` : selectedCandidateIdentityOnly ? '1940년대 실제 소속·직책·정치 성향은 게임 내 조사와 추가 사료 검증이 필요합니다.' : '직책·기관·전시 활동·역사적 제약을 별도 사료로 모델링한 인물입니다.'}</small>
                </span>
              </div>
              <div className="candidate-report-summary">
                <span><small>현재 / 잠재 능력</small><strong>{selectedCandidate.knowledge >= 65 ? selectedCandidate.ability : '추정치'} / {selectedCandidate.knowledge >= 85 ? selectedCandidate.potential : '미확인'}</strong></span>
                <span><small>목표 보직 적합도</small><strong className={(selectedCandidateFit?.score ?? 0) >= 68 ? 'ready' : ''}>{selectedCandidateFit?.score ?? 0} · {selectedCandidateFit?.label}</strong></span>
                <span><small>관계 / 경쟁 제안</small><strong>{selectedCandidate.relationship} / {selectedCandidate.rivalInterest}</strong></span>
                <span><small>설득 점수</small><strong className={selectedCandidateScore >= 72 ? 'ready' : ''}>{selectedCandidateScore} / 72</strong></span>
                <span><small>기본조건 판정</small><strong>{selectedCandidateScore >= 72 ? '설득 문턱 충족' : `문턱까지 ${72 - selectedCandidateScore}점`}</strong></span>
                <span><small>비용</small><strong>{formatMoney(selectedCandidate.signingCost)} + 주 {formatMoney(selectedCandidate.weeklyCost)}</strong></span>
              </div>
              <div className="candidate-report-findings">
                <article><small>경력·성향 판단</small><p>{selectedCandidate.knowledge >= 60 ? selectedCandidate.summary : `정보 ${60 - selectedCandidate.knowledge}%p를 더 확보하면 경력 평가와 이념 성향이 공개됩니다.`}</p></article>
                <article><small>임명 시 효과</small><p>{selectedCandidate.knowledge >= 45 ? selectedCandidate.appointmentEffect ?? selectedCandidate.specialty : `정보 ${45 - selectedCandidate.knowledge}%p를 더 확보하면 국가 운영 효과가 공개됩니다.`}</p></article>
                <article><small>위험·마찰</small><p>{selectedCandidate.knowledge >= 65 ? selectedCandidate.historicalConstraint ?? selectedCandidate.friction ?? '중대한 역사적 제약이 확인되지 않았습니다.' : '정보 65%에서 역사적 제약·충성 위험·조직 마찰이 공개됩니다.'}</p></article>
              </div>
              <div className="candidate-report-next"><strong>추천 다음 행동</strong><span>{selectedCandidateNextAction}</span></div>
              <p className="org-candidate-score-note">기본조건 설득 점수는 성공 확률이 아닙니다. 72점 이상이면 설득 문턱을 충족하며, 실제 협상에서는 정보·자원·임명권·변경한 조건을 다시 확인합니다.</p>
              {(() => {
                const plan = getCandidateScoutingPlan(selectedCandidate, personnelDelegated);
                return <div className="org-report-scouting"><strong>{plan.complete ? '조사 완료 · 슬롯 반환' : plan.active ? '조사 진행 중 · 매주 무료 갱신' : '자동 조사 미진행'}</strong><p>{plan.complete ? '확보한 정보는 보고서로 남습니다. 재조사 비용을 지출할 필요가 없습니다.' : plan.active ? `다음 주 정보 +${plan.weeklyGain}, 현재 속도 유지 시 약 ${plan.weeksToComplete}주 후 완료됩니다.` : '조사를 시작할 때만 2 PP를 사용합니다. 보고서 열람과 관심 등록은 무료입니다.'}</p>{!plan.complete && <ul>{plan.milestones.filter((milestone) => milestone.knowledge > selectedCandidate.knowledge).map((milestone) => <li key={milestone.knowledge}>{milestone.label} · 정보 {milestone.knowledge}%{plan.active ? ` · 약 ${milestone.weeks}주 후` : ''}</li>)}</ul>}</div>;
              })()}
              <div className="candidate-report-actions">
                {(['scout', 'approach', 'shortlist'] as const).map((kind) => {
                  const assessment = assessCandidateAction({ kind, candidateId: selectedCandidate.id });
                  const shortlisted = isCandidateShortlisted(selectedCandidate);
                  return <button key={kind} disabled={!assessment.allowed} title={assessment.reason} className={kind === 'shortlist' && shortlisted ? 'active' : ''} onClick={() => kind === 'shortlist' ? onToggleShortlist(selectedCandidate.id) : reviewCandidateAction(selectedCandidate.id, kind)}>{kind === 'scout' ? <Search size={12} /> : kind === 'approach' ? <MessageSquare size={12} /> : <Star size={12} />}{kind === 'scout' ? '조사 검토 · 2PP' : kind === 'approach' ? '접촉 검토 · 4PP' : shortlisted ? '관심 명단에서 제외' : '관심 명단에 추가'}</button>;
                })}
                {selectedCandidate.status === 'scouting' && selectedCandidate.knowledge < 100 && <button disabled={Boolean(officeProblem) || busy || !onStopScouting} title={officeProblem ?? '확보 정보를 보존하고 조사 슬롯을 반환합니다.'} onClick={() => reviewCandidateAction(selectedCandidate.id, 'stop-scout')}>조사 중단 검토 · 무료</button>}
                <button title={selectedCandidateManaged ? '권한·임기·보수·보직 약속을 조정해 제안합니다.' : authority.restrictionReason} disabled={busy || !selectedCandidateManaged || selectedCandidateUnavailable || selectedCandidate.knowledge < 55} onClick={() => openNegotiation(selectedCandidate)}>{selectedCandidateManaged ? <HeartHandshake size={12} /> : <LockKeyhole size={12} />} 조건 협상 열기</button>
                {selectedCandidate.sourceUrl && <a href={selectedCandidate.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={11} /> 역사 자료</a>}
              </div>
              <ul className="org-report-action-reasons" aria-label="후보 조치 가능 조건">{(['scout', 'approach', 'shortlist'] as const).map((kind) => {
                const assessment = assessCandidateAction({ kind, candidateId: selectedCandidate.id });
                return !assessment.allowed ? <li key={kind}>{kind === 'scout' ? '조사' : kind === 'approach' ? '접촉' : '관심 등록'}: {assessment.reason}</li> : null;
              })}</ul>
              {!officeProblem && candidateReview?.action.candidateId === selectedCandidate.id && <CandidateActionReview key={candidateReview.fingerprint} review={candidateReview} context={personnelContext} onConfirm={dispatchCandidateAction} onClose={() => setCandidateReview(null)} />}
            </section>
          )}
          <div className="candidate-grid">
            {visibleCandidates.map((candidate) => {
              const uncertainty = Math.max(1, Math.ceil((100 - candidate.knowledge) / 10));
              const ability = candidate.knowledge >= 65 ? String(candidate.ability) : `${Math.max(35, candidate.ability - uncertainty)}–${Math.min(99, candidate.ability + uncertainty)}`;
              const potential = candidate.knowledge >= 85 ? String(candidate.potential) : `${Math.max(40, candidate.potential - uncertainty)}+`;
              const unavailable = candidate.status === 'signed' || candidate.status === 'lost';
              const score = assessRecruitmentOffer(candidate, careerReputation, defaultRecruitmentOffer).score;
              const isExpert = Boolean(candidate.birthYear);
              const laterEra = Boolean(candidate.historicalEra && candidate.historicalEra !== 'wartime');
              const identityOnly = Boolean(candidate.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q') && candidate.historicalOffice.includes('정밀조사 필요'));
              const manageable = manageableDepartments.has(candidate.department);
              const seatFit = calculateCandidateSeatFit(candidate, candidate.department);
              return (
                <article className={`candidate-card org-candidate-row ${candidate.status} ${selectedCandidate?.id === candidate.id ? 'selected' : ''} ${isExpert ? 'historical-expert' : ''} ${manageable ? '' : 'authority-locked'}`} key={candidate.id}>
                  <header>
                    <span>{isExpert ? (candidate.department === 'science' ? <Atom size={10} /> : <Landmark size={10} />) : null}{departmentLabels[candidate.department]} · {candidate.discipline ? disciplineLabels[candidate.discipline] : '군사'}</span>
                    <em>{candidate.knowledge >= 100 && !unavailable ? '조사 완료' : statusLabels[candidate.status]}{isCandidateShortlisted(candidate) && ' · 관심'}{!manageable && <><LockKeyhole size={12} /> 임명 권한 없음</>}</em>
                  </header>
                  <div className="org-candidate-identity"><i className="org-person-monogram" aria-hidden="true">{initials(candidate.name)}</i><span><strong>{candidate.name}</strong><small>{candidate.historicalOffice}</small></span></div>
                  <div className="org-candidate-comparison"><span><small>정보 / 능력</small><strong>{candidate.knowledge}% / {ability}</strong></span><span><small>계약금 / 주급</small><strong>{formatMoney(candidate.signingCost)} / {formatMoney(candidate.weeklyCost)}</strong></span></div>
                  <button className="open-candidate-report" type="button" aria-label={`${candidate.name} 조사 보고서`} aria-pressed={selectedCandidate?.id === candidate.id} aria-controls={selectedCandidate?.id === candidate.id ? reportId : undefined} onClick={() => revealCandidateReport(candidate.id)}><ClipboardList size={16} /> 조사 보고서 <ChevronRight size={16} /></button>
                  <details className="org-candidate-more"><summary>경력·영입 조건과 빠른 조치 <ChevronRight size={14} /></summary><div className="org-candidate-more-body">
                  {isExpert && <div className={`historical-verification ${laterEra ? 'later-era' : identityOnly ? 'identity-only' : 'deep-profile'}`}><ShieldCheck size={10} /> {laterEra ? `${candidate.marketEntryYear}년 등장 · 실제 인물 / 가상 임명 분리` : identityOnly ? '신원·직업 확인 · 1940년대 경력 조사 필요' : '1940년대 경력 심층 검증'}</div>}
                  {isExpert && <div className="expert-identity"><span>{candidate.nationality} · {candidate.birthYear}년생</span><em>{candidate.wartimeLocation}</em></div>}
                  {laterEra && candidate.alternateHistoryEntry && <div className="later-era-arrival"><RefreshCw size={10} /><span>가속 세계선 조기 발탁</span><em>세대 기준 {candidate.generationUnlockYear}년</em></div>}
                  <div className="candidate-origin"><span>{candidate.affiliation}</span><em>{availabilityLabels[candidate.availability]}</em></div>
                  <div className="candidate-seat-fit"><span>보직 적합도</span><strong>{candidate.knowledge >= 45 ? `${seatFit.score} · ${seatFit.label}` : '조사 필요'}</strong><small>{seatFit.uncertainty ? `불확실성 -${seatFit.uncertainty}` : '검증 완료'}</small></div>
                  {candidate.expertise && <div className="expertise-tags">{candidate.expertise.map((expertise) => <span key={expertise}>{expertise}</span>)}</div>}
                  <div className="candidate-attributes">
                    <span><small>현재 능력</small><b>{ability}</b></span>
                    <span><small>잠재 능력</small><b>{potential}</b></span>
                    <span><small>영향력</small><b>{candidate.knowledge >= 45 ? candidate.influence : '?'}</b></span>
                  </div>
                  <p className="candidate-summary">{candidate.knowledge >= 60 ? candidate.summary : '경력 평가와 이념 성향은 추가 조사가 필요합니다.'}</p>
                  {candidate.appointmentEffect && <div className="appointment-effect"><strong>임명 효과</strong><span>{candidate.knowledge >= 45 ? candidate.appointmentEffect : '정밀 조사 후 공개'}</span></div>}
                  {candidate.historicalConstraint && candidate.knowledge >= 65 && <details className="historical-constraint"><summary>역사적 제약과 마찰</summary><p>{candidate.historicalConstraint}</p>{candidate.friction && <small>핵심 마찰: {candidate.friction}</small>}{candidate.networks && <small>인맥: {candidate.networks.join(' · ')}</small>}</details>}
                  <div className="market-pressure-grid">
                    <span><small>우리 관계 {candidate.relationship}</small><Meter value={candidate.relationship} tone="blue" /></span>
                    <span><small>경쟁 제안 {candidate.rivalInterest}</small><Meter value={candidate.rivalInterest} tone={candidate.rivalInterest >= 70 ? 'red' : 'gold'} /></span>
                  </div>
                  <p>정보 {candidate.knowledge}% · 관심 {candidate.knowledge >= 45 ? `${candidate.interest}%` : '?'} · 계약금 {formatMoney(candidate.signingCost)} · 주급 {formatMoney(candidate.weeklyCost)}</p>
                  {candidate.sourceUrl && <a className="historical-source-link" href={candidate.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={10} /> {candidate.sourceLabel ?? '역사 자료 보기'}</a>}
                  <div className="recruitment-forecast"><strong>{score} / 72</strong><span>기본조건 설득 점수<small>{score >= 72 ? '설득 문턱 충족' : `${72 - score}점 부족`} · 확률 아님</small></span></div>
                  <div className="candidate-actions">
                    {(['scout', 'shortlist', 'approach'] as const).map((kind) => {
                      const assessment = assessCandidateAction({ kind, candidateId: candidate.id });
                      return <button key={kind} disabled={!assessment.allowed} title={assessment.reason} className={kind === 'shortlist' && isCandidateShortlisted(candidate) ? 'active' : ''} onClick={() => kind === 'shortlist' ? onToggleShortlist(candidate.id) : reviewCandidateAction(candidate.id, kind)}>{kind === 'scout' ? <Search size={10} /> : kind === 'shortlist' ? <Star size={10} /> : <MessageSquare size={10} />}{kind === 'scout' ? '조사 검토' : kind === 'shortlist' ? '관심' : '접촉 검토'}</button>;
                    })}
                    <button disabled={busy || !manageable || unavailable || candidate.knowledge < 55} title={manageable ? '권한·임기·보수·보직 약속을 조정합니다.' : authority.restrictionReason} onClick={() => openNegotiation(candidate)}>{manageable ? <HeartHandshake size={10} /> : <LockKeyhole size={10} />} 협상</button>
                  </div>
                  </div></details>
                </article>
              );
            })}
            {filteredCandidates.length === 0 && <div className="talent-empty"><Search size={22} /><strong>조건에 맞는 인물이 없습니다.</strong><span>검색어나 분야 필터를 변경해 보십시오.</span></div>}
          </div>
          {filteredCandidates.length > talentPageSize && (
            <nav className="talent-pagination" aria-label="인재 시장 페이지">
              <button type="button" disabled={visibleTalentPage === 0} onClick={() => setTalentPage((current) => Math.max(0, current - 1))}><ChevronLeft size={13} /> 이전</button>
              <span><strong>{visibleTalentPage + 1}</strong> / {talentPageCount}<small>한 번에 {talentPageSize}명 · 검색은 전체 {filteredCandidates.length}명 대상</small></span>
              <button type="button" disabled={visibleTalentPage >= talentPageCount - 1} onClick={() => setTalentPage((current) => Math.min(talentPageCount - 1, current + 1))}>다음 <ChevronRight size={13} /></button>
            </nav>
          )}
          </div>
          <details className="org-disclosure org-market-guide"><summary><ClipboardList size={16} /><span>조사·접촉·협상 절차와 충원 목표 <small>조사 2PP · 접촉 4PP · 임명은 조건 합의 후</small></span><ChevronRight size={16} /></summary><div className="org-disclosure-body">
          <div className="recruitment-title">
            <div><span>GLOBAL TALENT MARKET</span><strong>실존 인물 영입 센터</strong></div>
            <em>등록 DB {historicalExperts.length.toLocaleString('ko-KR')}명 · 1940년대 정밀 프로필 {wartimeHistoricalExperts.length}명 · 현재 시장 {candidates.length}명 · 조사→접촉→포섭→보직 교체</em>
          </div>
          <div className="talent-coverage-audit" aria-label="국가별 실존 인물 데이터 범위">
            <span><small>플레이 권역</small><strong>{Object.keys(historicalExpertCoverage).length}개</strong></span>
            <span><small>국가별 최소 인물</small><strong>{minimumHistoricalExpertsPerNation}명</strong></span>
            <span><small>{nation.name} 소속 실존 인물</small><strong>{historicalExpertCoverage[nation.id]}명</strong></span>
            <span><small>{nation.name} 1940년대 정밀 인물</small><strong>{wartimeHistoricalExpertCoverage[nation.id]}명</strong></span>
            <span><small>현재 시대 접촉 가능</small><strong>{candidates.length}명</strong></span>
          </div>
          <section className="recruitment-objectives" aria-label="보직별 충원 포커스">
            <header><Target size={15} /><span><strong>충원 포커스</strong><small>보직 계획의 약점을 인재 조사 목표로 자동 연결합니다.</small></span></header>
            <div>{recruitmentPriorities.map((plan) => (
              <button type="button" className={selectedStaffDepartment === plan.department ? 'active' : ''} key={plan.department} onClick={() => { setSelectedStaffDepartment(plan.department); setDisciplineFilter(getStaffSeatDefinition(plan.department).preferredDisciplines[0]); setTalentScope('available'); setTalentPage(0); }}>
                <span><small>{plan.priority === 'top' ? '최우선' : plan.priority === 'standard' ? '일반' : '관찰'} · 필요도 {plan.needScore}</small><strong>{getStaffSeatTitle(plan.department, campaignPhase, nation.status)}</strong></span><em>내부 {plan.internalDepth[1]?.score ?? 0} · 외부 {plan.externalDepth[0]?.score ?? 0}</em>
              </button>
            ))}</div>
          </section>
          <section className="recruitment-guide" aria-label="인재 영입 절차">
            <header><ClipboardList size={16} /><span><strong>영입은 이렇게 진행합니다</strong><small>후보의 ‘조사 보고서’ 버튼으로 비용과 공개된 정보를 비교하십시오. 보고서 열람은 무료입니다.</small></span></header>
            <ol>
              <li><i>1</i><span><strong>후보 찾기</strong><small>이름·직책·전공으로 검색</small></span></li>
              <li><i>2</i><span><strong>조사 · 2PP</strong><small>즉시 정보 +8, 매주 +18{staff.some((member) => member.department === 'personnel' && member.delegated) ? ' + 위임 5' : ''}</small></span></li>
              <li><i>3</i><span><strong>관심·접촉</strong><small>정보 30%부터 접촉 · 관계 상승</small></span></li>
              <li><i>4</i><span><strong>조건 협상</strong><small>권한·임기·보수·약속 설계</small></span></li>
              <li><i>5</i><span><strong>임명·계약 관리</strong><small>만족도·사기·재계약 추적</small></span></li>
            </ol>
            <p><b>공개 기준</b> 임명 효과 45% · 제안 55% · 정확한 능력 65% · 정확한 잠재력 85%. 조사 중인 후보는 다음 주에도 무료로 자동 갱신되고, 정보 100%에서 슬롯을 반환합니다. 관심 등록과 조사 상태는 별도로 유지됩니다.</p>
          </section>
          </div></details>
        </div>)}
        {meetingStaff && (() => {
          const promise = assessStaffPromise(meetingStaff, developmentFocusId === meetingStaff.id);
          const completedThisWeek = meetingStaff.lastMeetingWeek === game.week;
          const buyIn = getStaffBuyIn(meetingStaff, developmentFocusId === meetingStaff.id);
          const morale = getStaffMorale(meetingStaff);
          const satisfaction = getStaffRoleSatisfaction(meetingStaff);
          return (
            <div className="staff-meeting-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setMeetingStaffIdentity(null); }}>
              <section className="staff-meeting-modal" role="dialog" aria-modal="true" aria-labelledby="staff-meeting-title" onKeyDown={(event) => { if (event.key === 'Escape') setMeetingStaffIdentity(null); }}>
                <header>
                  <span><MessageSquare size={22} /><small>ONE-TO-ONE MEETING</small><strong id="staff-meeting-title">{meetingStaff.name} 면담</strong></span>
                  <button type="button" autoFocus aria-label="면담 창 닫기" onClick={() => setMeetingStaffIdentity(null)}><X size={16} /></button>
                </header>
                <div className="staff-meeting-status">
                  <span><small>사기</small><strong>{morale}</strong><Meter value={morale} tone={morale < 50 ? 'red' : 'blue'} /></span>
                  <span><small>충성</small><strong>{Math.round(meetingStaff.loyalty)}</strong><Meter value={meetingStaff.loyalty} tone={meetingStaff.loyalty < 50 ? 'red' : 'gold'} /></span>
                  <span><small>역할 만족</small><strong>{satisfaction}</strong><Meter value={satisfaction} tone={satisfaction < 50 ? 'red' : 'gold'} /></span>
                  <span><small>지도부 수용</small><strong>{buyIn}</strong><Meter value={buyIn} tone={buyIn < 58 ? 'red' : 'blue'} /></span>
                </div>
                <div className={`staff-meeting-context ${promise.state}`}>
                  <span><HeartHandshake size={15} /><strong>{promise.label}</strong></span>
                  <p>{promise.summary}</p>
                  {completedThisWeek && <em><CalendarClock size={12} /> 이번 주 면담을 이미 진행했습니다. 다음 주에 다시 면담할 수 있습니다.</em>}
                </div>
                <div className="staff-meeting-options">
                  {staffMeetingOptions.map((option) => {
                    const unavailable = !manageableStaffIds.has(meetingStaff.id) || completedThisWeek || game.politicalPower < option.cost;
                    return (
                      <button type="button" className={option.risk} key={option.id} disabled={unavailable} onClick={() => { onMeetStaff(meetingStaff.id, option.id); setMeetingStaffIdentity(null); }}>
                        <i>{option.id === 'wellbeing' ? <HeartHandshake size={16} /> : option.id === 'workload' ? <ClipboardList size={16} /> : option.id === 'career' ? <Star size={16} /> : <Target size={16} />}</i>
                        <span><small>{option.risk === 'safe' ? '안전한 의제' : option.risk === 'balanced' ? '성장 의제' : `요구적 의제 · 수용 기준 ${buyIn}/58`}</small><strong>{option.label}</strong><p>{option.summary}</p><em>{option.forecast}</em></span>
                        <b>{option.cost} PP</b>
                      </button>
                    );
                  })}
                </div>
                <footer><small>면담 결과는 진행 결과 분석실과 주간 조직 수치에 즉시 기록됩니다.</small><button type="button" onClick={() => setMeetingStaffIdentity(null)}>취소</button></footer>
              </section>
            </div>
          );
        })()}
      </section>

      {workspace === 'squad' && <details className="org-disclosure org-operations-disclosure">
        <summary><ClipboardList size={16} /><span>조직 운용 설정 <small>편제 우선 지원 · 조달 우선순위 · 보급 운영 · 국가 운영 원칙</small></span><ChevronRight size={16} /></summary>
        <div className="org-operations-grid">
      <section className="management-card formations-card">
        <div className="management-heading">
          <div><span>FIRST TEAM</span><h3>핵심 편제</h3></div>
          <em>{divisions.length}개 편제</em>
        </div>
        <div className="formation-list">
          {divisions.map((division, index) => {
            const commander = commanders.find((item) => item.id === division.commanderId);
            const readiness = Math.round((division.strength + division.organization + division.supply) / 3);
            const priority = division.id === priorityDivisionId;
            return (
              <article className={`formation-management-row ${priority ? 'priority' : ''}`} key={division.id}>
                <div className="formation-rank">{priority ? <Star size={16} fill="currentColor" /> : String(index + 1).padStart(2, '0')}</div>
                <div className="formation-copy"><strong>{division.name}</strong><small>{commander?.name ?? '지휘관 공석'} · {division.status === 'ready' ? '출전 가능' : division.status === 'recovering' ? '재정비' : '작전 중'}</small></div>
                <div className="readiness-score"><span>전투 준비</span><strong>{readiness}</strong><Meter value={readiness} tone={readiness < 55 ? 'red' : 'gold'} /></div>
                <button className={priority ? 'selected' : ''} onClick={() => onSetPriorityDivision(division.id)}>{priority ? '핵심 편제' : '우선 지원'}</button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="management-card procurement-card">
        <div className="management-heading">
          <div><span>RECRUITMENT & PROCUREMENT</span><h3>조달 우선순위</h3></div>
          <em><Factory size={13} /> {game.factories}개 공장</em>
        </div>
        <div className="procurement-grid">
          {production.map((line) => {
            const selected = procurementFocusId === line.id;
            return (
              <button className={selected ? 'selected' : ''} key={line.id} onClick={() => onSetProcurementFocus(line.id)}>
                <span className="procurement-icon">{line.icon}</span>
                <span><strong>{line.name}</strong><small>{line.category} · 공장 {line.assigned}</small></span>
                <em>{line.efficiency}%</em>
                {selected && <i><Star size={12} /> 우선 조달</i>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="management-card logistics-card">
        <div className="management-heading">
          <div><span>LOGISTICS</span><h3>보급 운영</h3></div>
          <em><Truck size={13} /> 수송선 {stockpile.convoys.toLocaleString('ko-KR')}</em>
        </div>
        <div className="logistics-summary">
          <span><Package size={14} /><small>보병 장비</small><strong>{stockpile.infantryEquipment.toLocaleString('ko-KR')}</strong></span>
          <span><Gauge size={14} /><small>연료</small><strong>{Math.round(game.fuel)}K</strong></span>
          <span><Shield size={14} /><small>차량</small><strong>{stockpile.trucks.toLocaleString('ko-KR')}</strong></span>
        </div>
        <div className="supply-policy-list">
          {supplyPolicies.map((policy) => (
            <button className={supplyPolicy === policy.id ? 'selected' : ''} key={policy.id} onClick={() => onSetSupplyPolicy(policy.id)}>
              <i>{supplyPolicy === policy.id ? <Check size={14} /> : null}</i>
              <span><strong>{policy.title}</strong><small>{policy.detail}</small></span>
              <em>{policy.effect}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="management-card policy-card">
        <div className="management-heading">
          <div><span>NATIONAL IDENTITY</span><h3>국가 운영 원칙</h3></div>
          <em>{selectedPolicies.length}/4 적용 · 정치력 12로 전환 가능</em>
        </div>
        <p className="management-intro">각 영역에서 하나의 원칙을 적용합니다. 다른 원칙으로 바꾸면 정치력 12와 전환 충격이 들지만, 역사 흐름과 매주 생산·전투·보급 가중치가 새 방향으로 이동합니다.</p>
        <div className="policy-domain-grid">
          {policyDomains.map((domain) => {
            const policies = strategicPolicies.filter((policy) => policy.domain === domain.id);
            const chosen = policies.find((policy) => selectedPolicies.includes(policy.id));
            return (
              <div className="policy-domain" key={domain.id}>
                <header><span>{domain.subtitle}</span><h4>{domain.title}</h4></header>
                {policies.map((policy) => {
                  const selected = selectedPolicies.includes(policy.id);
                  return (
                    <button key={policy.id} disabled={selected} title={chosen && !selected ? `${chosen.title}에서 전환 · 정치력 12 · 즉시 효과 35%` : policy.effect} className={selected ? 'selected' : ''} onClick={() => onSelectPolicy(policy.id)}>
                      <i>{selected ? <Check size={14} /> : null}</i>
                      <span><strong>{policy.title}</strong><small>{policy.description}</small><em>{selected ? `현재 적용 중 · ${policy.effect}` : chosen ? `전환 · 정치력 12 · ${policy.effect}` : policy.effect}</em></span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
        </div>
      </details>}
    </div>
  );
}
