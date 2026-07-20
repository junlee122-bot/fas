import { useMemo, useState } from 'react';
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
import {
  defaultRecruitmentOffer,
  recruitmentChance,
  recruitmentScore,
  sortTalentCandidates,
} from './recruitment';
import type { RecruitmentOffer, TalentMarketSort } from './recruitment';
import { RecruitmentNegotiation } from './RecruitmentNegotiation';
import {
  assessStaffPromise,
  calculateCandidateSeatFit,
  createStaffManagementOverview,
  getStaffBuyIn,
  getStaffMorale,
  getStaffRenewalCost,
  getStaffRoleSatisfaction,
  staffMeetingOptions,
} from './staffManagement';
import type { StaffMeetingTopic } from './staffManagement';
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

interface OrganizationPanelProps {
  game: GameState;
  nation: NationProfile;
  role: CareerRole;
  campaignPhase: CampaignPhase;
  careerReputation: number;
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
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onMeetStaff: (id: string, topic: StaffMeetingTopic) => void;
  onToggleDelegation: (id: string) => void;
  onAssignStaff: (staffId: string, department: StaffDepartment) => void;
  onSetPriorityDivision: (id: string) => void;
  onSetProcurementFocus: (id: string) => void;
  onSetSupplyPolicy: (policy: SupplyPolicy) => void;
  onSelectPolicy: (policyId: string) => void;
  onSetDevelopmentFocus: (staffId: string) => void;
  onUpgradeStaff: (staffId: string) => void;
  onScoutCandidate: (candidateId: string) => void;
  onToggleShortlist: (candidateId: string) => void;
  onApproachCandidate: (candidateId: string) => void;
  onRecruitCandidate: (candidateId: string, offer: RecruitmentOffer) => void;
  onRenewStaff: (staffId: string) => void;
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

type TalentMarketScope = 'all' | 'shortlisted' | 'scouting' | 'available' | 'later' | 'deep' | 'identity';

const talentScopeLabels: Record<TalentMarketScope, string> = {
  all: '전체',
  shortlisted: '관심 명단',
  scouting: '조사 중',
  available: '영입 가능',
  later: '후대 인물',
  deep: '심층 검증',
  identity: '대규모 DB',
};

const talentSortLabels: Record<TalentMarketSort, string> = {
  recommended: '추천순',
  chance: '합의 가능성',
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
}: OrganizationPanelProps) {
  const [talentQuery, setTalentQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<PersonnelDiscipline | 'all'>('all');
  const [talentScope, setTalentScope] = useState<TalentMarketScope>('all');
  const [talentSort, setTalentSort] = useState<TalentMarketSort>('recommended');
  const [talentPage, setTalentPage] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [staffView, setStaffView] = useState<'planner' | 'roster' | 'responsibilities' | 'dynamics'>('planner');
  const [negotiatingCandidateId, setNegotiatingCandidateId] = useState<string | null>(null);
  const [meetingStaffId, setMeetingStaffId] = useState<string | null>(null);
  const [recruitmentOffer, setRecruitmentOffer] = useState<RecruitmentOffer>(defaultRecruitmentOffer);
  const authority = useMemo(() => getStaffAuthorityProfile(role), [role]);
  const [selectedStaffDepartment, setSelectedStaffDepartment] = useState<StaffDepartment>(() => authority.managedDepartments[0]);
  const manageableDepartments = useMemo(() => new Set(authority.managedDepartments), [authority]);
  const delegatedCount = staff.filter((member) => member.delegated).length;
  const managedDelegatedCount = staff.filter((member) => member.delegated && manageableDepartments.has(member.department)).length;
  const weeklyPayroll = staff.reduce((total, member) => total + member.weeklyCost, 0);
  const scienceAdvisor = staff.find((member) => member.department === 'science');
  const economyAdvisor = staff.find((member) => member.department === 'economy');
  const scienceBonus = scienceAdvisor?.delegated ? Math.max(2, Math.round((scienceAdvisor.ability + scienceAdvisor.influence) / 62)) : 0;
  const economyBonus = economyAdvisor?.delegated ? Math.max(8, Math.round((economyAdvisor.ability + economyAdvisor.influence) / 12)) : 0;
  const expertCount = candidates.filter((candidate) => candidate.birthYear).length;
  const shortlistCount = candidates.filter((candidate) => candidate.status === 'shortlisted').length;
  const scoutingCount = candidates.filter((candidate) => candidate.status === 'scouting').length;
  const laterEraCount = candidates.filter((candidate) => candidate.historicalEra && candidate.historicalEra !== 'wartime').length;
  const deepProfileCount = candidates.filter((candidate) => candidate.birthYear && !candidate.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q')).length;
  const filteredCandidates = useMemo(() => {
    const query = talentQuery.trim().toLocaleLowerCase('ko-KR');
    const filtered = candidates.filter((candidate) => {
      if (disciplineFilter !== 'all' && candidate.discipline !== disciplineFilter) return false;
      const laterEra = Boolean(candidate.historicalEra && candidate.historicalEra !== 'wartime');
      const identityOnly = (candidate.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q') ?? false) && !laterEra;
      if (talentScope === 'shortlisted' && candidate.status !== 'shortlisted') return false;
      if (talentScope === 'scouting' && candidate.status !== 'scouting') return false;
      if (talentScope === 'available' && (candidate.status === 'signed' || candidate.status === 'lost')) return false;
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
  const negotiatingCandidate = candidates.find((candidate) => candidate.id === negotiatingCandidateId) ?? null;
  const meetingStaff = staff.find((member) => member.id === meetingStaffId) ?? null;
  const selectedCandidateScore = selectedCandidate ? recruitmentScore(selectedCandidate, careerReputation) : 0;
  const selectedCandidateChance = selectedCandidate ? recruitmentChance(selectedCandidate, careerReputation) : 0;
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
  const selectedCandidateFit = selectedCandidate ? calculateCandidateSeatFit(selectedCandidate, selectedCandidate.department) : null;
  const recruitmentPriorities = [...staffOverview.seats].filter((seat) => seat.manageable).sort((left, right) => right.needScore - left.needScore).slice(0, 3);
  const rankedStaff = useMemo(() => staff
    .filter((member) => manageableDepartments.has(member.department))
    .map((member) => ({ member, suitability: calculateStaffSuitability(member, selectedStaffDepartment) }))
    .sort((left, right) => right.suitability.score - left.suitability.score), [manageableDepartments, selectedStaffDepartment, staff]);
  const selectedCandidateNextAction = !selectedCandidate
    ? ''
    : selectedCandidateUnavailable
      ? selectedCandidate.status === 'signed' ? '영입 완료: 직속 참모진에서 임명 상태를 확인하십시오.' : '경쟁 기관이 먼저 영입해 현재 시장에서는 접근할 수 없습니다.'
      : !selectedCandidateManaged
        ? `${getStaffSeatTitle(selectedCandidate.department, campaignPhase, nation.status)} 임명권은 현재 직함의 지휘계통 밖에 있습니다.`
      : selectedCandidate.knowledge < 30
        ? '조사를 시작하고 1주 진행해 접촉선과 성향 정보를 확보하십시오.'
        : selectedCandidate.knowledge < 55
          ? '비밀 접촉으로 관계·관심을 높이고, 조사를 계속해 정보 55%를 확보하십시오.'
          : selectedCandidateScore < 72
            ? `기본 설득 점수가 ${72 - selectedCandidateScore} 부족합니다. 비밀 접촉을 이어가거나 협상에서 권한·임기·보수를 개선하십시오.`
            : '기본 협상력이 충분합니다. 권한·임기·보수·보직 약속과 장기 재정 부담을 비교해 제안하십시오.';
  const revealCandidateReport = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    requestAnimationFrame(() => document.getElementById('staff-recruitment-hub')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const openNegotiation = (candidate: StaffCandidate) => {
    setSelectedCandidateId(candidate.id);
    setRecruitmentOffer(defaultRecruitmentOffer);
    setNegotiatingCandidateId(candidate.id);
  };

  return (
    <div className="organization-grid">
      <section className="management-card staff-card">
        <div className="management-heading">
          <div><span>STAFF PLANNER</span><h3>참모진·책임 관리</h3></div>
          <em>{authority.managedDepartments.length}/{staff.length}개 보직 관리 · 주급 {formatMoney(weeklyPayroll)}</em>
        </div>
        <div className="staff-management-hero">
          <div className="staff-command-identity">
            <span className="staff-command-icon">{role.tier === 1 ? <Crown size={22} /> : <BriefcaseBusiness size={22} />}</span>
            <span><small>{campaignPhase === 'war' ? 'WAR OFFICE · 1942' : nation.status === 'sovereign' ? 'POSTWAR GOVERNMENT' : 'FOUNDING GOVERNMENT'}</small><strong>{role.title}</strong><em>{authority.label} · {role.scope}</em></span>
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
          <p>당신이 이 실존 인물의 자리를 대체했습니다. 시작 직함에서 부여받은 인사권 범위는 정권이 바뀌어도 지휘계통으로 유지되며, 보직 명칭과 책임만 시대에 맞게 개편됩니다.</p>
        </div>
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
        <nav className="staff-management-tabs" aria-label="참모 관리 보기">
          <button type="button" className={staffView === 'planner' ? 'active' : ''} aria-pressed={staffView === 'planner'} onClick={() => setStaffView('planner')}><LayoutGrid size={15} /> 보직 계획</button>
          <button type="button" className={staffView === 'roster' ? 'active' : ''} aria-pressed={staffView === 'roster'} onClick={() => setStaffView('roster')}><List size={15} /> 참모 명단</button>
          <button type="button" className={staffView === 'responsibilities' ? 'active' : ''} aria-pressed={staffView === 'responsibilities'} onClick={() => setStaffView('responsibilities')}><ShieldCheck size={15} /> 책임 위임</button>
          <button type="button" className={staffView === 'dynamics' ? 'active' : ''} aria-pressed={staffView === 'dynamics'} onClick={() => setStaffView('dynamics')}><HeartHandshake size={15} /> 분위기·계약</button>
        </nav>

        {staffView === 'planner' && (
          <div className="staff-planner-layout">
            <section className="staff-seat-board" aria-label="참모 보직 계획">
              <header><span><UserRoundCog size={16} /><strong>보직별 뎁스 차트</strong></span><small>보직을 고른 뒤 오른쪽 후보를 비교해 즉시 교체합니다.</small></header>
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
                      onClick={() => setSelectedStaffDepartment(seat.department)}
                    >
                      <span className="staff-seat-card-top"><em>{seat.label}</em>{manageable ? <small>관리 가능</small> : <small><LockKeyhole size={10} /> 상급 권한</small>}</span>
                      <strong>{getStaffSeatTitle(seat.department, campaignPhase, nation.status)}</strong>
                      <span className="staff-seat-person"><i style={{ borderColor: nation.accent }}>{member ? initials(member.name) : '—'}</i><span><b>{member?.name ?? '공석'}</b><small>{member?.specialty ?? '후보 영입 필요'}</small></span></span>
                      <span className="staff-seat-fit"><em>{suitability?.label ?? '공석'}</em><b>{suitability?.score ?? 0}</b><Meter value={suitability?.score ?? 0} tone={(suitability?.score ?? 0) < 55 ? 'red' : (suitability?.score ?? 0) < 75 ? 'gold' : 'blue'} /></span>
                      <span className="staff-seat-planning"><em className={plan?.priority}>{plan?.priority === 'top' ? '최우선 보강' : plan?.priority === 'standard' ? '보강 검토' : '안정'}</em><small>뎁스 {plan?.depthScore ?? 0} · 내부/외부 각 3명</small></span>
                      <span className={`staff-seat-duty ${member?.delegated ? 'delegated' : ''}`}>{member?.delegated ? '주간 책임 위임' : '사용자 직접 결재'}</span>
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
                      return (
                        <article className={`staff-option ${incumbent ? 'incumbent' : ''}`} key={member.id}>
                          <span className="staff-option-rank">{index + 1}</span>
                          <span className="staff-option-copy"><strong>{member.name}</strong><small>{getStaffSeatTitle(member.department, campaignPhase, nation.status)} · 능력 {member.ability} · 잠재 {member.potential}</small><em>{suitability.reasons[0]}</em></span>
                          <span className="staff-option-score"><small>{suitability.label}</small><strong>{suitability.score}</strong></span>
                          <button type="button" disabled={incumbent} onClick={() => onAssignStaff(member.id, selectedStaffDepartment)}>{incumbent ? '현재 배치' : <><ArrowRightLeft size={12} /> 배치</>}</button>
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
                  {selectedSeatMember && calculateStaffSuitability(selectedSeatMember, selectedStaffDepartment).score < 65 && <button type="button" className="staff-recruitment-prompt" onClick={() => { setDisciplineFilter(selectedSeat.preferredDisciplines[0]); setTalentQuery(''); }}><Search size={13} /> 적합도 부족 — 아래 인재 시장에서 {departmentLabels[selectedSeat.department]} 후보 찾기</button>}
                </>
              )}
            </aside>
          </div>
        )}

        {staffView === 'roster' && (
          <div className="staff-table" role="table" aria-label="직속 참모진">
            {staff.map((member) => {
              const manageable = manageableDepartments.has(member.department);
              return (
                <article className={`staff-row ${manageable ? '' : 'staff-row-locked'}`} role="row" key={member.id}>
                  <div className="staff-identity">
                    <span className="staff-avatar" style={{ borderColor: nation.accent }}>{initials(member.name)}</span>
                    <div>
                      <strong>{member.name}</strong>
                      <small>{getStaffSeatTitle(member.department, campaignPhase, nation.status)} · {departmentLabels[member.department]}</small>
                      <em>{member.historicalOffice} · {member.affiliation}</em>
                    </div>
                  </div>
                  <div className="staff-rating"><span>현재 / 잠재</span><strong>{member.ability} <small>/ {member.potential}</small></strong><Meter value={member.ability} /></div>
                  <div className="staff-rating"><span>충성도</span><strong>{member.loyalty}</strong><Meter value={member.loyalty} tone={member.loyalty < 55 ? 'red' : 'gold'} /></div>
                  <div className="staff-rating"><span>업무량</span><strong>{member.workload}%</strong><Meter value={member.workload} tone={member.workload > 75 ? 'red' : 'blue'} /></div>
                  <div className="staff-rating"><span>등급 {member.grade} · 성장</span><strong>{member.development}%</strong><Meter value={member.development} tone="gold" /></div>
                  <div className="staff-actions">
                    <button disabled={!manageable} onClick={() => setMeetingStaffId(member.id)} title={manageable ? '면담 의제와 예상 효과 선택' : authority.restrictionReason}><MessageSquare size={13} /> 면담</button>
                    <button disabled={!manageable} className={member.delegated ? 'active' : ''} onClick={() => onToggleDelegation(member.id)}><Check size={13} /> {member.delegated ? '위임 중' : '직접 결재'}</button>
                    <button disabled={!manageable} className={developmentFocusId === member.id ? 'active' : ''} onClick={() => onSetDevelopmentFocus(member.id)}><Star size={13} /> {developmentFocusId === member.id ? '육성 중' : '육성'}</button>
                    <button disabled={!manageable || member.development < 100 || member.grade >= 3} title={!manageable ? authority.restrictionReason : member.grade >= 3 ? '이미 최고 등급입니다.' : member.development < 100 ? `성장도 100%가 필요합니다. 현재 ${member.development}%` : '정치력과 재정을 사용해 승급합니다.'} onClick={() => onUpgradeStaff(member.id)}><RefreshCw size={13} /> 승급</button>
                  </div>
                </article>
              );
            })}
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
                const renewalCost = getStaffRenewalCost(record.member);
                return (
                  <article className={`${record.contractRisk} ${manageable ? '' : 'locked'}`} key={record.member.id}>
                    <span className="staff-dynamic-person"><i style={{ borderColor: nation.accent }}>{initials(record.member.name)}</i><span><small>{hierarchyLabels[record.hierarchy]} · {careerStageLabels[record.careerStage]}</small><strong>{record.member.name}</strong><em>{getStaffSeatTitle(record.member.department, campaignPhase, nation.status)}</em></span></span>
                    <span className="staff-dynamic-rating"><small>사기</small><strong>{record.morale}</strong><Meter value={record.morale} tone={record.morale < 50 ? 'red' : 'blue'} /></span>
                    <span className="staff-dynamic-rating"><small>역할 만족</small><strong>{record.roleSatisfaction}</strong><Meter value={record.roleSatisfaction} tone={record.roleSatisfaction < 50 ? 'red' : 'gold'} /></span>
                    <span className="staff-dynamic-rating"><small>지도부 수용</small><strong>{record.buyIn}</strong><Meter value={record.buyIn} tone={record.buyIn < 50 ? 'red' : 'blue'} /></span>
                    <span className={`staff-contract-cell ${record.contractRisk}`}><small>{squadStatusLabels[record.member.squadStatus ?? (record.hierarchy === 'leader' ? 'key' : record.hierarchy === 'core' ? 'regular' : 'rotation')]}</small><strong>{record.contractWeeks}주</strong><em>{contractRiskLabels[record.contractRisk]}</em></span>
                    <span className={`staff-promise-cell ${record.promise.state}`} title={record.promise.summary}><small>임명 합의</small><strong>{record.promise.label}</strong><em>{record.promise.summary}</em></span>
                    <button type="button" disabled={!manageable || record.contractRisk === 'secure' || game.politicalPower < 4 || game.treasury < renewalCost} title={!manageable ? authority.restrictionReason : `2년 재계약 · 정치력 4 · 보너스 ${formatMoney(renewalCost)}`} onClick={() => onRenewStaff(record.member.id)}><CalendarClock size={12} /> {record.contractRisk === 'secure' ? '계약 안정' : `재계약 ${formatMoney(renewalCost)}`}</button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="recruitment-hub" id="staff-recruitment-hub">
          <div className="recruitment-title">
            <div><span>GLOBAL TALENT MARKET · 1942</span><strong>실존 인물 영입 센터</strong></div>
            <em>검증 DB {historicalExperts.length.toLocaleString('ko-KR')}명 · 현재 접촉권 {candidates.length}명 · 민간 전문가 {expertCount}명 · 조사→접촉→포섭→보직 교체</em>
          </div>
          <div className="talent-coverage-audit" aria-label="국가별 실존 인물 데이터 범위">
            <span><small>플레이 권역</small><strong>{Object.keys(historicalExpertCoverage).length}개</strong></span>
            <span><small>국가별 최소 인물</small><strong>{minimumHistoricalExpertsPerNation}명</strong></span>
            <span><small>{nation.name} 소속 실존 인물</small><strong>{historicalExpertCoverage[nation.id]}명</strong></span>
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
            <header><ClipboardList size={16} /><span><strong>영입은 이렇게 진행합니다</strong><small>조사 결과는 후보 카드의 ‘보고서’ 버튼을 누르면 바로 아래 전용 패널에 모입니다.</small></span></header>
            <ol>
              <li><i>1</i><span><strong>후보 찾기</strong><small>이름·직책·전공으로 검색</small></span></li>
              <li><i>2</i><span><strong>조사 · 2PP</strong><small>즉시 정보 +8, 매주 +18{staff.some((member) => member.department === 'personnel' && member.delegated) ? ' + 위임 5' : ''}</small></span></li>
              <li><i>3</i><span><strong>관심·접촉</strong><small>정보 30%부터 접촉 · 관계 상승</small></span></li>
              <li><i>4</i><span><strong>조건 협상</strong><small>권한·임기·보수·약속 설계</small></span></li>
              <li><i>5</i><span><strong>임명·계약 관리</strong><small>만족도·사기·재계약 추적</small></span></li>
            </ol>
            <p><b>공개 기준</b> 임명 효과 45% · 제안 55% · 정확한 능력 65% · 정확한 잠재력 85%. 조사 중인 후보는 다음 주에도 자동 갱신됩니다.</p>
          </section>
          <div className="talent-toolbar">
            <label><Search size={13} /><input value={talentQuery} onChange={(event) => { setTalentQuery(event.target.value); setTalentPage(0); }} placeholder="이름·직책·기관·전문 분야 검색" /></label>
            <div className="talent-filter-list" aria-label="인재 분야 필터">
              {disciplineFilters.map((discipline) => (
                <button className={disciplineFilter === discipline ? 'active' : ''} key={discipline} onClick={() => { setDisciplineFilter(discipline); setTalentPage(0); }}>
                  {discipline === 'all' ? '전체' : disciplineLabels[discipline]}
                </button>
              ))}
            </div>
            <span>{filteredCandidates.length}명 · {visibleTalentPage + 1}/{talentPageCount}쪽</span>
          </div>
          <div className="talent-market-controls">
            <div className="talent-scope-list" aria-label="인재 시장 보기 필터">
              <span><ListFilter size={11} /> 빠른 보기</span>
              {(Object.keys(talentScopeLabels) as TalentMarketScope[]).map((scope) => {
                const count = scope === 'shortlisted' ? shortlistCount : scope === 'scouting' ? scoutingCount : scope === 'later' ? laterEraCount : scope === 'deep' ? deepProfileCount : null;
                return <button type="button" className={talentScope === scope ? 'active' : ''} key={scope} onClick={() => { setTalentScope(scope); setTalentPage(0); }}>{talentScopeLabels[scope]}{count !== null && <em>{count}</em>}</button>;
              })}
            </div>
            <label className="talent-sort"><ArrowUpDown size={11} /><span>정렬</span><select value={talentSort} onChange={(event) => { setTalentSort(event.target.value as TalentMarketSort); setTalentPage(0); }}>{(Object.keys(talentSortLabels) as TalentMarketSort[]).map((sort) => <option value={sort} key={sort}>{talentSortLabels[sort]}</option>)}</select></label>
          </div>
          {selectedCandidate && (
            <section className="candidate-report" role="region" aria-label={`${selectedCandidate.name} 조사 보고서`}>
              <header>
                <span><ClipboardList size={16} /><small>PERSONNEL DOSSIER · 정보 신뢰도 {selectedCandidate.knowledge}%</small><strong>{selectedCandidate.name} 조사 보고서</strong></span>
                <button type="button" onClick={() => setSelectedCandidateId(null)} aria-label="조사 보고서 닫기"><X size={15} /></button>
              </header>
              <div className={`candidate-verification ${selectedCandidateLaterEra ? 'later-era' : selectedCandidateIdentityOnly ? 'identity-only' : 'deep-profile'}`}>
                <ShieldCheck size={13} />
                <span>
                  <strong>{selectedCandidateLaterEra ? '후대 실존 인물 · 대체역사 임명' : selectedCandidateIdentityOnly ? '신원·국적·생년·직업 확인' : '1942년 경력 심층 검증 프로필'}</strong>
                  <small>{selectedCandidateLaterEra ? `실제 신원·출생·공개 직업만 사료 정보입니다. ${selectedCandidate.marketEntryYear}년의 접촉 경로·능력·충성·임명 효과는 현재 세계선의 게임 설정입니다.` : selectedCandidateIdentityOnly ? '1942년 실제 소속·직책·정치 성향은 게임 내 조사와 추가 사료 검증이 필요합니다.' : '직책·기관·전시 활동·역사적 제약을 별도 사료로 모델링한 인물입니다.'}</small>
                </span>
              </div>
              <div className="candidate-report-summary">
                <span><small>현재 / 잠재 능력</small><strong>{selectedCandidate.knowledge >= 65 ? selectedCandidate.ability : '추정치'} / {selectedCandidate.knowledge >= 85 ? selectedCandidate.potential : '미확인'}</strong></span>
                <span><small>목표 보직 적합도</small><strong className={(selectedCandidateFit?.score ?? 0) >= 68 ? 'ready' : ''}>{selectedCandidateFit?.score ?? 0} · {selectedCandidateFit?.label}</strong></span>
                <span><small>관계 / 경쟁 제안</small><strong>{selectedCandidate.relationship} / {selectedCandidate.rivalInterest}</strong></span>
                <span><small>설득 점수</small><strong className={selectedCandidateScore >= 72 ? 'ready' : ''}>{selectedCandidateScore} / 72</strong></span>
                <span><small>합의 가능성</small><strong>{selectedCandidateChance}%</strong></span>
                <span><small>비용</small><strong>{formatMoney(selectedCandidate.signingCost)} + 주 {formatMoney(selectedCandidate.weeklyCost)}</strong></span>
              </div>
              <div className="candidate-report-findings">
                <article><small>경력·성향 판단</small><p>{selectedCandidate.knowledge >= 60 ? selectedCandidate.summary : `정보 ${60 - selectedCandidate.knowledge}%p를 더 확보하면 경력 평가와 이념 성향이 공개됩니다.`}</p></article>
                <article><small>임명 시 효과</small><p>{selectedCandidate.knowledge >= 45 ? selectedCandidate.appointmentEffect ?? selectedCandidate.specialty : `정보 ${45 - selectedCandidate.knowledge}%p를 더 확보하면 국가 운영 효과가 공개됩니다.`}</p></article>
                <article><small>위험·마찰</small><p>{selectedCandidate.knowledge >= 65 ? selectedCandidate.historicalConstraint ?? selectedCandidate.friction ?? '중대한 역사적 제약이 확인되지 않았습니다.' : '정보 65%에서 역사적 제약·충성 위험·조직 마찰이 공개됩니다.'}</p></article>
              </div>
              <div className="candidate-report-next"><strong>추천 다음 행동</strong><span>{selectedCandidateNextAction}</span></div>
              <div className="candidate-report-actions">
                <button disabled={selectedCandidateUnavailable || selectedCandidate.knowledge >= 100} onClick={() => onScoutCandidate(selectedCandidate.id)}><Search size={12} /> 조사 계속 · 2PP</button>
                <button disabled={selectedCandidateUnavailable || selectedCandidate.knowledge < 30} onClick={() => onApproachCandidate(selectedCandidate.id)}><MessageSquare size={12} /> 비밀 접촉 · 4PP</button>
                <button title={selectedCandidateManaged ? '권한·임기·보수·보직 약속을 조정해 제안합니다.' : authority.restrictionReason} disabled={!selectedCandidateManaged || selectedCandidateUnavailable || selectedCandidate.knowledge < 55} onClick={() => openNegotiation(selectedCandidate)}>{selectedCandidateManaged ? <HeartHandshake size={12} /> : <LockKeyhole size={12} />} 조건 협상 열기</button>
                {selectedCandidate.sourceUrl && <a href={selectedCandidate.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={11} /> 역사 자료</a>}
              </div>
            </section>
          )}
          <div className="candidate-grid">
            {visibleCandidates.map((candidate) => {
              const uncertainty = Math.max(1, Math.ceil((100 - candidate.knowledge) / 10));
              const ability = candidate.knowledge >= 65 ? String(candidate.ability) : `${Math.max(35, candidate.ability - uncertainty)}–${Math.min(99, candidate.ability + uncertainty)}`;
              const potential = candidate.knowledge >= 85 ? String(candidate.potential) : `${Math.max(40, candidate.potential - uncertainty)}+`;
              const unavailable = candidate.status === 'signed' || candidate.status === 'lost';
              const chance = recruitmentChance(candidate, careerReputation);
              const score = recruitmentScore(candidate, careerReputation);
              const isExpert = Boolean(candidate.birthYear);
              const laterEra = Boolean(candidate.historicalEra && candidate.historicalEra !== 'wartime');
              const identityOnly = Boolean(candidate.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q') && candidate.historicalOffice.includes('정밀조사 필요'));
              const manageable = manageableDepartments.has(candidate.department);
              const seatFit = calculateCandidateSeatFit(candidate, candidate.department);
              return (
                <article className={`candidate-card ${candidate.status} ${isExpert ? 'historical-expert' : ''} ${manageable ? '' : 'authority-locked'}`} key={candidate.id}>
                  <header>
                    <span>{isExpert ? (candidate.department === 'science' ? <Atom size={10} /> : <Landmark size={10} />) : null}{departmentLabels[candidate.department]} · {candidate.discipline ? disciplineLabels[candidate.discipline] : '군사'}</span>
                    <em>{manageable ? statusLabels[candidate.status] : <><LockKeyhole size={9} /> 열람만 가능</>}</em>
                  </header>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.historicalOffice}</small>
                  {isExpert && <div className={`historical-verification ${laterEra ? 'later-era' : identityOnly ? 'identity-only' : 'deep-profile'}`}><ShieldCheck size={10} /> {laterEra ? `${candidate.marketEntryYear}년 등장 · 실제 인물 / 가상 임명 분리` : identityOnly ? '신원·직업 확인 · 1942 경력 조사 필요' : '1942 경력 심층 검증'}</div>}
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
                  <div className="recruitment-forecast"><strong>{chance}%</strong><span>예상 합의율<small>설득 {score}/72</small></span></div>
                  <button className="open-candidate-report" type="button" onClick={() => setSelectedCandidateId(candidate.id)}><ClipboardList size={11} /> 조사 보고서 보기 <em>{candidate.knowledge}%</em></button>
                  <div className="candidate-actions">
                    <button disabled={unavailable || candidate.knowledge >= 100} title="정치력 2를 사용해 정보를 수집합니다." onClick={() => { setSelectedCandidateId(candidate.id); onScoutCandidate(candidate.id); }}><Search size={10} /> 조사</button>
                    <button disabled={unavailable || candidate.knowledge < 35} className={candidate.status === 'shortlisted' ? 'active' : ''} onClick={() => onToggleShortlist(candidate.id)}><Star size={10} /> 관심</button>
                    <button disabled={unavailable || candidate.knowledge < 30} title="정치력 4로 비밀 접촉합니다." onClick={() => onApproachCandidate(candidate.id)}><MessageSquare size={10} /> 접촉</button>
                    <button disabled={!manageable || unavailable || candidate.knowledge < 55} title={manageable ? '권한·임기·보수·보직 약속을 조정합니다.' : authority.restrictionReason} onClick={() => openNegotiation(candidate)}>{manageable ? <HeartHandshake size={10} /> : <LockKeyhole size={10} />} 협상</button>
                  </div>
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
        {negotiatingCandidate && (
          <RecruitmentNegotiation
            candidate={negotiatingCandidate}
            offer={recruitmentOffer}
            politicalPower={game.politicalPower}
            treasury={game.treasury}
            reputation={careerReputation}
            formatMoney={formatMoney}
            onChange={setRecruitmentOffer}
            onClose={() => setNegotiatingCandidateId(null)}
            onSubmit={() => { onRecruitCandidate(negotiatingCandidate.id, recruitmentOffer); setNegotiatingCandidateId(null); }}
          />
        )}
        {meetingStaff && (() => {
          const promise = assessStaffPromise(meetingStaff, developmentFocusId === meetingStaff.id);
          const completedThisWeek = meetingStaff.lastMeetingWeek === game.week;
          const buyIn = getStaffBuyIn(meetingStaff, developmentFocusId === meetingStaff.id);
          const morale = getStaffMorale(meetingStaff);
          const satisfaction = getStaffRoleSatisfaction(meetingStaff);
          return (
            <div className="staff-meeting-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setMeetingStaffId(null); }}>
              <section className="staff-meeting-modal" role="dialog" aria-modal="true" aria-labelledby="staff-meeting-title">
                <header>
                  <span><MessageSquare size={22} /><small>ONE-TO-ONE MEETING</small><strong id="staff-meeting-title">{meetingStaff.name} 면담</strong></span>
                  <button type="button" aria-label="면담 창 닫기" onClick={() => setMeetingStaffId(null)}><X size={16} /></button>
                </header>
                <div className="staff-meeting-status">
                  <span><small>사기</small><strong>{morale}</strong><Meter value={morale} tone={morale < 50 ? 'red' : 'blue'} /></span>
                  <span><small>충성</small><strong>{meetingStaff.loyalty}</strong><Meter value={meetingStaff.loyalty} tone={meetingStaff.loyalty < 50 ? 'red' : 'gold'} /></span>
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
                    const unavailable = completedThisWeek || game.politicalPower < option.cost;
                    return (
                      <button type="button" className={option.risk} key={option.id} disabled={unavailable} onClick={() => { onMeetStaff(meetingStaff.id, option.id); setMeetingStaffId(null); }}>
                        <i>{option.id === 'wellbeing' ? <HeartHandshake size={16} /> : option.id === 'workload' ? <ClipboardList size={16} /> : option.id === 'career' ? <Star size={16} /> : <Target size={16} />}</i>
                        <span><small>{option.risk === 'safe' ? '안전한 의제' : option.risk === 'balanced' ? '성장 의제' : `요구적 의제 · 수용 기준 ${buyIn}/58`}</small><strong>{option.label}</strong><p>{option.summary}</p><em>{option.forecast}</em></span>
                        <b>{option.cost} PP</b>
                      </button>
                    );
                  })}
                </div>
                <footer><small>면담 결과는 진행 결과 분석실과 주간 조직 수치에 즉시 기록됩니다.</small><button type="button" onClick={() => setMeetingStaffId(null)}>취소</button></footer>
              </section>
            </div>
          );
        })()}
      </section>

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
  );
}
