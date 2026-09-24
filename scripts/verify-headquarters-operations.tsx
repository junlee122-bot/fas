// Isolated Vite entry: memory only, no player saves, localStorage or IndexedDB.
// Initial values mirror HeadquartersWorkspace.test.tsx without importing its mocks.
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HeadquartersWorkspace, type HeadquartersWorkspaceProps } from '../src/HeadquartersWorkspace';
import { assessResearchAction } from '../src/ResearchDesk';
import { createCareerState, createStaffRoster, getNation, getRole } from '../src/campaign';
import { createEconomyState } from '../src/economy';
import { reallocateFactory } from '../src/livingWorld';
import { createNationManagementState } from '../src/nationManagement';
import { deriveNationalSimulation, type NationalSimulationInput } from '../src/nationalSimulation';
import { createPoliticalCrisisState, getNationPoliticalProfile } from '../src/politicalCrisis';
import { createPublicHealthState } from '../src/publicHealth';
import { advanceResearchProjects } from '../src/researchProgression';
import { getRoleTabMandates } from '../src/roleMandate';
import { advanceStaffRosterWeek } from '../src/staffManagement';
import { advanceStaffNarrativeWeek, createStaffNarrativeState, type StaffNarrativeState } from '../src/staffNarrative';
import { getStaffAuthorityProfile } from '../src/staffOrganization';
import { assessStaffWorkPriority } from '../src/staffWork';
import { attachStaffWorkReports } from '../src/staffWorkReport';
import type { StaffDecisionInput } from '../src/staffDecisions';
import type { GameState, StaffMember } from '../src/types';

const nationId = 'britain' as const;
const weeklyGain = 20;
const startingWeek = 8;
const formatMoney = (value: number) => `£${value.toLocaleString('ko-KR')} (검증 기준액)`;

interface FixtureState {
  nation: NationalSimulationInput;
  staff: StaffMember[];
  narrative: StaffNarrativeState;
  focusId: string | null;
  roleId: 'britain-tier1' | 'britain-tier3';
  busy: boolean;
  readOnly: boolean;
  researchCalls: number;
  researchApplied: number;
  productionCalls: number;
  productionApplied: number;
  briefingCalls: number;
  notices: string[];
}

function initialState(): FixtureState {
  const role = getRole('britain-tier1', nationId);
  const staff = createStaffRoster(nationId, role.id);
  const game: GameState = { week: startingWeek, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
    stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
    airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 };
  const economy = createEconomyState(nationId);
  const nation: NationalSimulationInput = { nationId, phase: 'war', game, economy,
    stockpile: { infantryEquipment: 48200, tanks: 1284, aircraft: 2106, convoys: 624, artillery: 3840, trucks: 12600 },
    divisions: [{ id: 'fixture-division', name: '검증용 제1사단', type: 'infantry', strength: 82, organization: 78, experience: 54, supply: 76, territoryId: 'home', commanderId: 'fixture-commander', status: 'ready' }],
    production: [
      { id: 'rifle', name: '보병 장비', category: '보병 장비', assigned: 8, efficiency: 84, output: 1200, icon: 'factory' },
      { id: 'sherman', name: '중형 전차', category: '기갑', assigned: 4, efficiency: 65, output: 24, icon: 'factory' },
      { id: 'convoy', name: '수송선', category: '해군', assigned: 2, efficiency: 73, output: 8, icon: 'factory' },
    ],
    research: [
      { id: 'radio', name: '무선 통신', branch: '통신', description: '검증용 완료 과제', progress: 100, duration: 100, active: false, complete: true, icon: 'radio' },
      { id: 'logistics', name: '보급 조직 개선', branch: '물류', description: '검증용 진행 과제 · 실제 연구 결산으로 진척됩니다.', progress: 40, duration: 100, active: true, complete: false, icon: 'factory' },
      { id: 'code', name: '암호 분석', branch: '정보', description: '검증용 중지 과제 · 시작 승인 전에는 진척되지 않습니다.', progress: 30, duration: 100, active: false, complete: false, icon: 'radio' },
      { id: 'future-fixture', name: '후대 전자 계산', branch: '전자', description: '시대 제한 검증용 과제', minimumYear: 1948, prerequisites: ['code'], progress: 0, duration: 120, active: false, complete: false, icon: 'radio' },
    ],
    publicHealth: createPublicHealthState(42), selectedPolicies: [], politicalState: createPoliticalCrisisState(nationId),
    coupRisk: { score: 18, tier: 'stable', weeklyChance: 0, triggers: [], leadingFaction: getNationPoliticalProfile(nationId).factions[0], weakestRelation: { pair: 'civil-military', value: 48 }, crisisLabel: '헌정 비상전환' },
    nationManagement: createNationManagementState(nationId, game, economy, 1, 'negotiated'),
  };
  return { nation, staff, narrative: createStaffNarrativeState(staff, startingWeek), focusId: null, roleId: 'britain-tier1', busy: false, readOnly: false,
    researchCalls: 0, researchApplied: 0, productionCalls: 0, productionApplied: 0, briefingCalls: 0,
    notices: ['공간·흐름·과제 선택만으로 콜백이 호출되거나 상태가 바뀌면 안 됩니다.'] };
}

function yearOf(run: FixtureState) { return 1942 + Math.floor((run.nation.game.week - startingWeek) / 52); }
function mandatesOf(run: FixtureState) {
  const mandates = getRoleTabMandates(getRole(run.roleId, nationId));
  if (!run.readOnly) return mandates;
  return Object.fromEntries(Object.entries(mandates).map(([tab, mandate]) => [tab, {
    ...mandate, mode: 'report' as const, label: '검증: 열람 전용', reason: '검증 입력으로 직접 결재를 잠갔습니다. 현재 상태와 승인 전 검토의 안전성을 확인합니다.',
  }])) as typeof mandates;
}
function staffInput(run: FixtureState): StaffDecisionInput {
  const role = getRole(run.roleId, nationId);
  return { game: run.nation.game, role, staff: run.staff, developmentFocusId: run.focusId,
    campaignPhase: run.nation.phase, nationStatus: getNation(nationId).status,
    career: createCareerState(nationId, role.id), affiliationStatus: 'serving', busy: run.busy };
}
function notice(run: FixtureState, message: string): FixtureState {
  return { ...run, notices: [message, ...run.notices].slice(0, 16) };
}
function settlePartialWeek(run: FixtureState): FixtureState {
  if (run.busy) return notice(run, '진행 중 잠금이 켜져 있어 검증 결산을 실행하지 않았습니다.');
  const fromWeek = run.nation.game.week;
  const week = fromWeek + 1;
  const role = getRole(run.roleId, nationId);
  const afterWork = advanceStaffRosterWeek(run.staff, run.focusId);
  const manageable = new Set(afterWork.filter((member) => getStaffAuthorityProfile(role).managedDepartments.includes(member.department)).map((member) => member.id));
  const narrative = advanceStaffNarrativeWeek(run.narrative, afterWork, week, manageable);
  const staff = attachStaffWorkReports(run.staff, afterWork, narrative.staff, { nationId, fromWeek, week, developmentFocusId: run.focusId });
  const research = advanceResearchProjects(run.nation.research, weeklyGain, yearOf(run));
  return notice({ ...run, staff, narrative: narrative.state, nation: { ...run.nation, game: { ...run.nation.game, week }, research } },
    `제${week + 1}주 부분 결산: 실제 연구 진행(+${weeklyGain}/활성 과제)과 참모 엔진을 한 번씩 실행했습니다. 경제·생산 입고·전투는 실행하지 않았습니다.`);
}

function Verification() {
  const [run, setRun] = useState(initialState);
  const mandates = mandatesOf(run);
  const recordNavigation = (message: string) => setRun((previous) => notice(previous, `${message} 연결 요청을 확인했습니다. 이 격리 화면에서는 게임 페이지로 이동하지 않습니다.`));
  const outsideScope = (message: string) => {
    setRun((previous) => notice(previous, `${message}: 검증 범위 밖 콜백입니다. 이 요청은 실행하지 않았고 자원·참모는 그대로입니다.`));
    return false;
  };
  const props: HeadquartersWorkspaceProps = {
    context: { input: staffInput(run), formatMoney,
      onUpgradeStaff: () => outsideScope('승급'), onRenewStaff: () => outsideScope('계약 연장'), onAssignStaff: () => outsideScope('재배치') },
    staffNarrative: run.narrative,
    onToggleDelegation: () => outsideScope('책임 위임'),
    onSetDevelopmentFocus: () => outsideScope('집중 육성'),
    onSetWorkPriority: (id, personId, priority) => setRun((previous) => {
      if (previous.readOnly) return notice(previous, '검증용 열람 전용 상태라 업무 방침을 변경하지 않았습니다.');
      const assessment = assessStaffWorkPriority(staffInput(previous), id, personId, priority);
      return notice(assessment.allowed ? { ...previous, staff: assessment.staffAfter } : previous, assessment.reason);
    }),
    onMeetStaff: () => outsideScope('개인 면담'),
    onOpenOrganization: () => recordNavigation('조직 운영'), mandates, year: yearOf(run),
    onOpenFacility: (room, tab) => recordNavigation(`${room} → ${tab}`),
    researchControl: { weeklyGain, onToggle: (id) => setRun((previous) => {
      const counted = { ...previous, researchCalls: previous.researchCalls + 1 };
      const project = previous.nation.research.find((item) => item.id === id);
      const assessment = assessResearchAction(project, previous.nation.research, yearOf(previous), previous.busy);
      if (mandatesOf(previous).research.mode !== 'direct' || previous.readOnly) return notice(counted, '연구 요청을 받았지만 현재 결재권이 없어 거절했습니다.');
      if (!project || !assessment.allowed) return notice(counted, `연구 요청 거절: ${assessment.reason}`);
      return notice({ ...counted, researchApplied: previous.researchApplied + 1, nation: { ...previous.nation,
        research: previous.nation.research.map((item) => item.id === id ? { ...item, active: !item.active } : item) } },
        `${project.name}: ${project.active ? '연구 중지를' : '연구 시작을'} 실제 과제 상태에 반영했습니다. 누적 진행은 보존했습니다.`);
    }) },
    world: { nationName: '영국', input: run.nation, snapshot: deriveNationalSimulation(run.nation), industryMandate: mandates.industry,
      staffIssues: run.narrative.activeStorylines.length,
      onNavigate: (tab) => recordNavigation(tab),
      onReallocate: (id, amount) => setRun((previous) => {
        const counted = { ...previous, productionCalls: previous.productionCalls + 1 };
        const next = reallocateFactory(previous.nation.production, previous.nation.game.factories, id, amount,
          !previous.busy && !previous.readOnly && mandatesOf(previous).industry.mode === 'direct');
        return next ? notice({ ...counted, productionApplied: previous.productionApplied + 1, nation: { ...previous.nation, production: next } },
          `공장 배분 ${id} ${amount > 0 ? '+1' : '−1'}: 실제 reallocateFactory 결과를 반영했습니다. 장비 입고는 아직 실행하지 않았습니다.`)
          : notice(counted, '공장 배분 요청을 받았지만 현재 권한·잠금·용량 조건으로 거절했습니다.');
      }),
      onOpenBriefing: () => setRun((previous) => notice({ ...previous, briefingCalls: previous.briefingCalls + 1 }, '주간 브리핑 연결 요청을 확인했습니다. 이 화면 아래 확정 원자료에서 부분 결산만 확인할 수 있습니다.')),
    },
  };

  return <main className="hq-fixture">
    <header><h1>지휘부 운영 흐름 · 격리 검증</h1>
      <p>아래는 실제 게임의 지휘부 컴포넌트입니다. 연구·공장 명령의 검토/승인, 역할·잠금 전환, 실제 연구·참모 부분 결산을 확인합니다. 건물·배치도는 조직 모식도이며 물리적인 도시 시뮬레이션이 아닙니다.</p>
      <p>메모리 상태만 사용합니다. 사용자 저장은 읽거나 변경하지 않으며 새로고침하면 초기화됩니다. 인사 재배치·면담·계약·위임은 이 화면에서 실행하지 않고 연결 여부만 기록합니다.</p>
    </header>
    <div className="hq-fixture-tools" aria-label="격리 검증 조건">
      <label htmlFor="hq-fixture-role">보직<select id="hq-fixture-role" value={run.roleId} onChange={(event) => {
        const roleId = event.target.value as FixtureState['roleId'];
        setRun((previous) => notice({ ...previous, roleId }, '검증용 보직을 변경했습니다. 기존 검토서가 남아 있어도 현재 권한으로 다시 판단해야 합니다.'));
      }}><option value="britain-tier1">최고 보직 · 직접 지휘</option><option value="britain-tier3">3단계 보직 · 실제 상신/열람 권한</option></select></label>
      <label><input type="checkbox" checked={run.readOnly} onChange={(event) => { const readOnly = event.target.checked; setRun((previous) => ({ ...previous, readOnly })); }} />검증 입력: 모두 열람 전용</label>
      <label><input type="checkbox" checked={run.busy} onChange={(event) => { const busy = event.target.checked; setRun((previous) => ({ ...previous, busy })); }} />검증 입력: 시간 진행 중 잠금</label>
      <label htmlFor="hq-fixture-phase">단계<select id="hq-fixture-phase" value={run.nation.phase} onChange={(event) => {
        const phase = event.target.value as NationalSimulationInput['phase'];
        setRun((previous) => notice({ ...previous, nation: { ...previous.nation, phase } }, '검증용 단계 표시만 바꿨습니다. 종전·건국 엔진이나 경제 결산을 수행한 것은 아닙니다.'));
      }}><option value="war">전쟁</option><option value="nation">국가 운영</option></select></label>
      <button type="button" disabled={run.busy} onClick={() => setRun(settlePartialWeek)}>검증용 1주 진행 · 연구/참모만</button>
      <button type="button" onClick={() => setRun(initialState())}>메모리 상태 초기화</button>
    </div>
    <output role="status" className="hq-fixture-status">{run.notices[0]}</output>
    <div className="hq-fixture-counters" aria-label="실행 요청 계수">
      <output data-testid="hq-fixture-research-calls">연구 콜백 {run.researchCalls}회 / 실제 반영 {run.researchApplied}회</output>
      <output data-testid="hq-fixture-production-calls">공장 콜백 {run.productionCalls}회 / 실제 반영 {run.productionApplied}회</output>
      <output data-testid="hq-fixture-week">현재 제{run.nation.game.week + 1}주 · 연구 속도 +{weeklyGain}/주 (검증 입력)</output>
      <output data-testid="hq-fixture-briefing-calls">브리핑 연결 {run.briefingCalls}회</output>
    </div>
    <HeadquartersWorkspace {...props} />
    <details className="hq-fixture-audit"><summary>현재 실제 상태 · 명령 및 부분 결산 검증 원자료</summary>
      <pre data-testid="hq-fixture-state">{JSON.stringify({ week: run.nation.game.week, role: run.roleId, readOnly: run.readOnly, busy: run.busy,
        researchMandate: mandates.research.mode, industryMandate: mandates.industry.mode,
        production: run.nation.production, research: run.nation.research,
        staffReports: run.staff.map(({ id, personId, lastWorkReport }) => ({ id, personId, lastWorkReport })) }, null, 2)}</pre>
    </details>
    <details className="hq-fixture-audit"><summary>검증 요청 기록 · 최근 {run.notices.length}건</summary><ol>{run.notices.map((message, index) => <li key={index}>{message}</li>)}</ol></details>
  </main>;
}

// Reuse the React root across Vite HMR without touching browser persistence.
const root = (import.meta.hot?.data.headquartersOperationsRoot as Root | undefined)
  ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.headquartersOperationsRoot = root;
root.render(<Verification />);
