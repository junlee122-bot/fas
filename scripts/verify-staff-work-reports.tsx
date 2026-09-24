// Isolated Vite fixture. It never accesses localStorage, IndexedDB or player save files.
// Each step calls the real weekly staff engines exactly once, then attaches their snapshots.
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { StaffWorkReportCard } from '../src/StaffWorkReportCard';
import { createCareerState, createStaffRoster, getRole } from '../src/campaign';
import { advanceStaffRosterWeek } from '../src/staffManagement';
import { advanceStaffNarrativeWeek, createStaffNarrativeState, type StaffNarrativeState } from '../src/staffNarrative';
import { getStaffAuthorityProfile, getStaffSeatDefinition } from '../src/staffOrganization';
import { assessStaffWorkPriority, getStaffWorkPriority, staffWorkPriorities } from '../src/staffWork';
import { attachStaffWorkReports } from '../src/staffWorkReport';
import type { StaffDecisionInput } from '../src/staffDecisions';
import type { GameState, StaffMember, StaffWorkPriority } from '../src/types';

const nationId = 'britain' as const;
const role = getRole('britain-tier1', nationId);
const career = createCareerState(nationId, role.id);
const managedDepartments = new Set(getStaffAuthorityProfile(role).managedDepartments);
const formatMoney = (value: number) => `£${value.toLocaleString('ko-KR')} (검증용 기준액)`;
const number = (value: number) => (Math.round(value * 100) / 100).toLocaleString('ko-KR');

interface FixtureState {
  kind: 'staff-work-report-fixture-v1';
  game: GameState;
  staff: StaffMember[];
  narrative: StaffNarrativeState;
  developmentFocusId: string | null;
  notice: string;
  events: Array<{ week: number; title: string; detail: string }>;
}
function initialState(): FixtureState {
  const staff = createStaffRoster(nationId, role.id);
  return {
    kind: 'staff-work-report-fixture-v1',
    game: { week: 0, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
      stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
      airPower: 57, navalPower: 52, intelNetwork: 78, enemyPressure: 68 },
    staff, narrative: createStaffNarrativeState(staff, 0), developmentFocusId: null,
    notice: '첫 결산 전입니다. 현재 능력치로 과거 결과를 추정하지 않습니다.', events: [],
  };
}
function decisionInput(run: FixtureState): StaffDecisionInput {
  return { game: run.game, role, career, staff: run.staff, developmentFocusId: run.developmentFocusId,
    campaignPhase: 'war', nationStatus: 'sovereign', affiliationStatus: 'serving', busy: false };
}
function settleWeek(previous: FixtureState): FixtureState {
  const fromWeek = previous.game.week;
  const week = fromWeek + 1;
  const afterWork = advanceStaffRosterWeek(previous.staff, previous.developmentFocusId);
  const manageableIds = new Set(afterWork.filter((member) => managedDepartments.has(member.department)).map((member) => member.id));
  const narrative = advanceStaffNarrativeWeek(previous.narrative, afterWork, week, manageableIds);
  const staff = attachStaffWorkReports(previous.staff, afterWork, narrative.staff,
    { nationId, fromWeek, week, developmentFocusId: previous.developmentFocusId });
  return { ...previous, game: { ...previous.game, week }, staff, narrative: narrative.state,
    notice: `제${week + 1}주 실제 참모 결산을 완료했습니다. 업무 결산 뒤 조직 사건을 반영한 결과입니다.`,
    events: [...previous.events, ...narrative.events.map((event) => ({ week, title: event.title, detail: event.detail }))].slice(-16),
  };
}

function Verification() {
  const [run, setRun] = useState(initialState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const [briefingRequests, setBriefingRequests] = useState(0);
  const [previewWidth, setPreviewWidth] = useState<'380' | '480' | 'full'>('380');
  const member = selectedId === null ? run.staff[0] : run.staff.find((candidate) => candidate.id === selectedId);
  const priority = member ? getStaffWorkPriority(member) : null;

  const changePriority = (nextPriority: StaffWorkPriority) => {
    if (!member) return;
    const identity = { id: member.id, personId: member.personId };
    setRun((previous) => {
      const assessment = assessStaffWorkPriority(decisionInput(previous), identity.id, identity.personId, nextPriority);
      return assessment.allowed ? { ...previous, staff: assessment.staffAfter, notice: assessment.reason }
        : { ...previous, notice: assessment.reason };
    });
  };
  const fixtureFocus = () => {
    if (!member) return;
    const identity = { id: member.id, personId: member.personId };
    setRun((previous) => {
      const current = previous.staff.find((candidate) => candidate.id === identity.id && candidate.personId === identity.personId);
      if (!current) return { ...previous, notice: '선택한 인물이 바뀌었습니다. 다른 인물에게 대신 적용하지 않았습니다.' };
      return { ...previous, developmentFocusId: previous.developmentFocusId === current.id ? null : current.id,
        notice: '검증 입력인 집중 육성 대상을 변경했습니다. 과거 결산은 다시 계산하지 않으며 다음 실제 결산부터 적용합니다.' };
    });
  };
  const reloadSnapshot = () => {
    if (!savedJson) return;
    const restored = JSON.parse(savedJson) as FixtureState;
    if (restored.kind !== 'staff-work-report-fixture-v1') return;
    setRun({ ...restored, notice: '이 화면의 메모리 JSON 스냅숏을 복원했습니다. 실제 사용자 저장은 읽거나 변경하지 않았습니다.' });
    setSelectedId(null);
  };

  return <main className="staff-fixture">
    <header><h1>참모의 지난주 업무 · 격리 검증</h1>
      <p>실제 참모 업무·계약·조직 사건 엔진의 전후 값을 기록하는 검증 화면입니다. 국가 전체 경제 결산·전투·승인 화면은 재현하지 않습니다.</p>
      <small>게임 저장과 완전히 분리되어 있으며 새로고침하면 초기화됩니다. 아래 JSON 기능도 이 페이지의 메모리 안에서만 작동합니다.</small>
    </header>
    <div className="staff-fixture-toolbar">
      <button type="button" onClick={() => setRun(settleWeek)}>다음 주간 결산</button>
      <button type="button" onClick={() => setRun((previous) => {
        let next = previous;
        for (let index = 0; index < 6; index += 1) next = settleWeek(next);
        return next;
      })}>검증용: 6주 차례로 결산</button>
      <button type="button" onClick={() => setSavedJson(JSON.stringify(run))}>메모리에 JSON 저장</button>
      <button type="button" disabled={!savedJson} onClick={reloadSnapshot}>JSON 스냅숏 복원</button>
      <button type="button" onClick={() => { setRun(initialState()); setSelectedId(null); setBriefingRequests(0); }}>초기 상태로</button>
      <output aria-label="현재 주차" data-testid="staff-fixture-week">제{run.game.week + 1}주</output>
    </div>
    <output className="staff-fixture-status" role="status">{run.notice}</output>
    <div className="staff-fixture-grid">
      <section className="staff-fixture-panel" aria-labelledby="staff-fixture-person-heading">
        <h2 id="staff-fixture-person-heading">현재 참모 상태</h2>
        <label htmlFor="staff-fixture-person">확인할 인물 </label>
        <select id="staff-fixture-person" value={member?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)}>
          {!member ? <option value="">인물을 다시 선택하십시오</option> : null}
          {run.staff.map((candidate) => <option key={`${candidate.id}:${candidate.personId}`} value={candidate.id}>{candidate.name} · {getStaffSeatDefinition(candidate.department).label}</option>)}
        </select>
        {member ? <>
          <dl className="staff-fixture-current">
            <div><dt>현재 업무 부담</dt><dd>{number(member.workload)}</dd></div>
            <div><dt>현재 성장도</dt><dd>{number(member.development)}</dd></div>
            <div><dt>현재 업무 방침</dt><dd>{staffWorkPriorities.find((option) => option.id === priority)?.label}</dd></div>
            <div><dt>집중 육성</dt><dd>{run.developmentFocusId === member.id ? '선택됨' : '일반 육성'}</dd></div>
          </dl>
          <div className="staff-fixture-toolbar" aria-label="업무 방침 변경">
            {staffWorkPriorities.map((option) => <button key={option.id} type="button" aria-pressed={priority === option.id}
              onClick={() => changePriority(option.id)}>{option.label}</button>)}
          </div>
          <p>업무 방침 버튼은 실제 권한·인물 확인 함수를 거칩니다. 결산 뒤 방침을 바꿔도 이전 결과의 숫자는 바뀌지 않아야 합니다.</p>
          <button type="button" aria-pressed={run.developmentFocusId === member.id} onClick={fixtureFocus}>검증 입력: 집중 육성 전환</button>
          <details><summary>이 인물의 확정 결산 원자료</summary><pre data-testid="staff-fixture-receipt">{JSON.stringify(member.lastWorkReport ?? null, null, 2)}</pre></details>
        </> : <p>선택한 보직을 찾지 못했습니다. 다른 인물에게 자동으로 명령하지 않습니다.</p>}
        <small>JSON 스냅숏: {savedJson ? `${savedJson.length.toLocaleString('ko-KR')}자 저장됨` : '아직 없음'}</small>
      </section>
      <section className="staff-fixture-panel" aria-labelledby="staff-fixture-card-heading">
        <h2 id="staff-fixture-card-heading">게임에서 사용하는 실제 결산 카드</h2>
        <label htmlFor="staff-fixture-preview-width">검증용 보기 폭 </label>
        <select id="staff-fixture-preview-width" value={previewWidth}
          onChange={(event) => setPreviewWidth(event.target.value as '380' | '480' | 'full')}>
          <option value="380">380px · 좁은 인스펙터</option>
          <option value="480">480px</option>
          <option value="full">패널 전체 폭</option>
        </select>
        <div data-testid="staff-fixture-card-width" style={{ maxWidth: previewWidth === 'full' ? 'none' : `${previewWidth}px` }}>
          {member ? <StaffWorkReportCard member={member} nationId={nationId} week={run.game.week}
            developmentFocusId={run.developmentFocusId} formatMoney={formatMoney}
            onOpenBriefing={() => setBriefingRequests((previous) => previous + 1)} /> : null}
        </div>
        <output aria-label="브리핑 연결 요청" data-testid="staff-fixture-briefing">브리핑 콜백 {briefingRequests}회 확인</output>
        <p>이 검증 화면은 실제 주간 브리핑으로 이동하지 않고 연결 요청만 확인합니다.</p>
      </section>
    </div>
    <details><summary>실제 조직 사건 엔진 기록 ({run.events.length}건)</summary>
      {run.events.length ? <ol className="staff-fixture-event-list">{run.events.map((event, index) => <li key={`${event.week}:${index}`}><strong>제{event.week + 1}주 · {event.title}</strong><br />{event.detail}</li>)}</ol>
        : <p>아직 발생한 조직 사건이 없습니다. 결산 숫자를 장식하기 위해 사건을 만들어 넣지 않습니다.</p>}
    </details>
  </main>;
}

// Keep the same React root when Vite re-executes this standalone entry during HMR.
// Do not unmount it in dispose: a retained, unmounted Root cannot be rendered again.
const root = (import.meta.hot?.data.staffWorkReportRoot as Root | undefined)
  ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.staffWorkReportRoot = root;
root.render(<Verification />);
