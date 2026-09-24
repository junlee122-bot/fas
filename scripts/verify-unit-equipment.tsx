// Isolated real-engine verification entry: no player saves or browser persistence.
import { useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { UnitEquipmentIssuePanel } from '../src/UnitEquipmentIssuePanel';
import { createUnitEquipmentIssueState, issueUnitEquipment, type UnitEquipmentIssueContext, type UnitEquipmentIssueState } from '../src/unitEquipmentIssue';

interface Run {
  state: UnitEquipmentIssueState;
  context: UnitEquipmentIssueContext;
  selectedId: string;
  calls: number;
  applied: number;
  navigation: number;
  notice: string;
}
function initial(): Run {
  return { state: createUnitEquipmentIssueState(), selectedId: 'verification-infantry', calls: 0, applied: 0, navigation: 0,
    notice: '검토·취소·화면 열기만으로 재고나 보급이 바뀌면 안 됩니다.',
    context: { nationId: 'britain', week: 8, playerFaction: 'allies', authorized: true, processingWeek: false,
      divisions: [
        { id: 'verification-infantry', name: '검증용 제1보병사단', type: 'infantry', strength: 85, organization: 80, experience: 50, supply: 65, territoryId: 'verification-home', commanderId: 'verification-commander', status: 'ready' },
        { id: 'verification-armor', name: '검증용 제2기갑사단', type: 'armor', strength: 85, organization: 80, experience: 50, supply: 60, territoryId: 'verification-home', commanderId: 'verification-tank-commander', status: 'ready' },
      ],
      territories: [{ id: 'verification-home', name: '영국 본토 검증 보급소', ownerId: 'britain', controller: 'allies', supply: 80, x: 10, y: 10, neighbors: [], region: '검증', value: 1, siteType: 'city', terrain: '평야' }],
      playableTerritoryIds: ['verification-home'], commandableDivisionIds: new Set(['verification-infantry', 'verification-armor']),
      stockpile: { infantryEquipment: 300, tanks: 100, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 },
    },
  };
}
function Verification() {
  const [run, setRun] = useState(initial);
  const current = useRef(run);
  const [epoch, setEpoch] = useState(0);
  current.current = run;
  const update = (next: Run) => { current.current = next; setRun(next); };
  const changeContext = (patch: Partial<UnitEquipmentIssueContext>) => update({ ...current.current, context: { ...current.current.context, ...patch } });
  return <main className="issue-fixture">
    <header><h1>국가 비축 → 부대 장비 지급 · 실제 엔진 검증</h1><p>메모리에서만 실행되는 격리 화면입니다. 플레이어 저장자료를 읽거나 변경하지 않습니다. 이곳의 보급소·편제는 검증용이며 게임 세계의 새 역사 콘텐츠가 아닙니다.</p></header>
    <div className="issue-fixture-controls" aria-label="검증 조건">
      <label>부대 선택<select value={run.selectedId} onChange={event => update({ ...current.current, selectedId: event.target.value })}><option value="verification-infantry">제1보병사단</option><option value="verification-armor">제2기갑사단</option><option value="missing-division">존재하지 않는 부대</option></select></label>
      <label><input type="checkbox" checked={!run.context.authorized} onChange={event => changeContext({ authorized: !event.target.checked })} />직접 권한 해제</label>
      <label><input type="checkbox" checked={Boolean(run.context.processingWeek)} onChange={event => changeContext({ processingWeek: event.target.checked })} />결산 진행 중</label>
      <button type="button" onClick={() => changeContext({ week: current.current.context.week + 1 })}>다음 주차로 변경</button>
      <button type="button" onClick={() => changeContext({ stockpile: { ...current.current.context.stockpile, infantryEquipment: Math.max(0, current.current.context.stockpile.infantryEquipment - 10) } })}>외부 조건: 보병 비축 −10</button>
      <button type="button" onClick={() => changeContext({ territories: current.current.context.territories.map(site => ({ ...site, supply: site.supply === 80 ? 70 : 80 })) })}>거점 보급 80↔70</button>
      <button type="button" onClick={() => { update(initial()); setEpoch(value => value + 1); }}>검증 초기화</button>
    </div>
    <div className="issue-fixture-counters"><output>승인 콜백 {run.calls}회</output><output>실제 지급 {run.applied}회</output><output>산업 이동 {run.navigation}회</output><output>현재 제{run.context.week + 1}주</output><output>보병 비축 {run.context.stockpile.infantryEquipment}개</output></div>
    <p className="issue-fixture-status" role="status">{run.notice}</p>
    <UnitEquipmentIssuePanel key={epoch} state={run.state} context={run.context} divisionId={run.selectedId}
      onApprove={command => {
        const before = current.current;
        const result = issueUnitEquipment(before.state, command, before.context);
        update({ ...before, calls: before.calls + 1, applied: before.applied + Number(result.applied), state: result.state,
          context: { ...before.context, stockpile: result.stockpile, divisions: result.divisions }, notice: result.reason });
        return result.applied;
      }}
      onOpenIndustry={() => update({ ...current.current, navigation: current.current.navigation + 1, notice: '산업 화면 이동 요청만 기록했습니다. 생산·지급·비축 변화 없음.' })}
    />
    <details><summary>실제 원장·비축·부대 상태 확인</summary><pre>{JSON.stringify({ state: run.state, stockpile: run.context.stockpile, divisions: run.context.divisions }, null, 2)}</pre></details>
  </main>;
}
const root = (import.meta.hot?.data.unitEquipmentRoot as Root | undefined) ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.unitEquipmentRoot = root;
root.render(<Verification />);
