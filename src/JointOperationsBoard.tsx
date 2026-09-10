import { useCallback, useRef, useState, type Ref } from 'react';
import { Anchor, ArrowRight, Clock3, Crosshair, FileText, Plane, Radar, ShieldCheck, Wrench } from 'lucide-react';
import type { GameState, Stockpile, TheaterId } from './types';
import {
  forecastJointOperation, getAvailableJointOperationTemplates, getCounterOperationTemplateIds,
  getJointOperationObjectives, jointDoctrineDefinitions,
  type AirGroup, type JointCommandResponse, type JointDoctrine, type JointForcesState,
  type JointOperationTemplate, type NavalTaskForce,
} from './jointOperations';
import './JointOperationsBoard.css';

export type JointOperationsView = 'joint' | 'naval' | 'air';
export type JointCommandWorkspace = 'overview' | 'planning' | 'operations';
export interface JointOperationsBoardProps {
  view: JointOperationsView; state: JointForcesState; theater: TheaterId; game: GameState; stockpile: Stockpile;
  onLaunch: (templateId: string, fleetIds: string[], airGroupIds: string[], objectiveId?: string) => void;
  onDoctrineChange: (doctrine: JointDoctrine) => void;
  onRefit: (forceId: string) => void;
  onCommandResponse: (messageId: string, response: JointCommandResponse) => void;
  planningDisabledReason?: string;
}
export interface JointBoardSelection {
  workspace: JointCommandWorkspace;
  fleetId: string | null; airGroupId: string | null;
  templateId: string | null; objectiveId: string | null;
  doctrineId: JointDoctrine | null;
  fleetIds: string[]; airGroupIds: string[];
  overviewObjectiveId: string | null; operationId: string | null; recordId: string | null;
}
export const initialJointBoardSelection: JointBoardSelection = {
  workspace: 'overview', fleetId: null, airGroupId: null, templateId: null, objectiveId: null, doctrineId: null,
  fleetIds: [], airGroupIds: [], overviewObjectiveId: null, operationId: null, recordId: null,
};
const fleetKindLabels = { carrier: '항모', surface: '수상함', escort: '호송·대잠', submarine: '잠수함', coastal: '연안', clandestine: '비밀 연락' } as const;
const airKindLabels = { fighter: '전투기', bomber: '폭격기', maritime: '해상초계', transport: '수송', recon: '정찰', mixed: '혼성' } as const;
const workspaceLabels: Record<JointCommandWorkspace, string> = { overview: '전구 현황', planning: '작전 계획', operations: '진행·보고서' };
const theaterLabel = (theater: TheaterId) => theater === 'asia' ? '아시아·태평양' : '유럽·지중해';
const countOf = (force: NavalTaskForce | AirGroup) => 'ships' in force ? force.ships : force.aircraft;
const countLabel = (force: NavalTaskForce | AirGroup) => String(countOf(force)) + ('ships' in force ? '척' : '대');
function forceStatus(force: NavalTaskForce | AirGroup) {
  return force.status === 'assigned' ? '작전 배속' : force.status === 'refit' ? '정비 중' : countOf(force) <= 0 ? '전력 소진' : '명령 대기';
}
export function resolveJointSelection<T extends { id: string }>(items: readonly T[], id: string | null) {
  return items.find((item) => item.id === id) ?? items[0] ?? null;
}
export function getJointForceSelectionReason(force: NavalTaskForce | AirGroup, template: JointOperationTemplate) {
  if (countOf(force) <= 0) return 'ships' in force ? '함정 0척 · 출격 불가' : '항공기 0대 · 출격 불가';
  if (force.status !== 'ready') return force.status === 'assigned' ? '다른 작전에 배속됨' : '정비 중';
  const compatible = 'ships' in force
    ? !template.requiredFleetKinds.length || template.requiredFleetKinds.includes(force.kind)
    : !template.requiredAirKinds.length || template.requiredAirKinds.includes(force.kind);
  return compatible ? null : '이 작전 유형에 부적합';
}
export function getJointBoardPlan(input: JointOperationsBoardProps, selection: JointBoardSelection) {
  const templates = getAvailableJointOperationTemplates(input.theater);
  const template = resolveJointSelection(templates, selection.templateId);
  const objectives = template ? getJointOperationObjectives(input.state, input.theater, template.kind) : [];
  const objective = resolveJointSelection(objectives, selection.objectiveId);
  const fleetIds = [...new Set(selection.fleetIds)].filter((id) => input.state.fleets.some((force) => force.id === id));
  const airGroupIds = [...new Set(selection.airGroupIds)].filter((id) => input.state.airGroups.some((force) => force.id === id));
  const staleSelection = (selection.templateId !== null && template?.id !== selection.templateId)
    || (selection.objectiveId !== null && objective?.id !== selection.objectiveId)
    || selection.fleetIds.some((id) => !fleetIds.includes(id)) || selection.airGroupIds.some((id) => !airGroupIds.includes(id));
  const incompatible = template ? [...input.state.fleets.filter((force) => fleetIds.includes(force.id)), ...input.state.airGroups.filter((force) => airGroupIds.includes(force.id))]
    .some((force) => getJointForceSelectionReason(force, template) !== null) : false;
  const forecast = template ? forecastJointOperation(input.state, template.id, fleetIds, airGroupIds, { week: input.game.week, theater: input.theater, game: input.game }, objective?.id) : null;
  const insufficientResources = Boolean(forecast && (input.game.commandPoints < forecast.commandCost || input.game.fuel < forecast.fuelCost || input.stockpile.convoys < forecast.convoyCost));
  const warning = input.planningDisabledReason
    || (staleSelection ? '선택한 작전·목표·전력이 변경되었습니다. 현재 목록에서 새 계획을 선택하십시오.' : null)
    || forecast?.warning || (incompatible ? '선택 전력의 출격 상태 또는 작전 적합성을 다시 확인하십시오.' : null)
    || (insufficientResources ? '필요한 지휘점수·연료·수송선이 부족합니다.' : null);
  return { templates, template, objectives, objective, fleetIds, airGroupIds, forecast, warning, staleSelection, canLaunch: Boolean(template && objective && forecast && !warning) };
}
/** Prevent duplicate callback delivery against the same immutable game snapshot. */
export function createJointCommandGuard() {
  let snapshot: JointForcesState | null = null;
  let week = -1;
  let sent = new Set<string>();
  return (state: JointForcesState, currentWeek: number, key: string, action: () => void) => {
    if (snapshot !== state || week !== currentWeek) { snapshot = state; week = currentWeek; sent = new Set(); }
    if (sent.has(key)) return false;
    sent.add(key);
    action();
    return true;
  };
}
function focusHeading(node: HTMLHeadingElement) {
  node.focus({ preventScroll: true });
  const viewport = node.ownerDocument.defaultView;
  node.scrollIntoView({ behavior: !viewport?.matchMedia || viewport.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
export function JointOperationsBoard(props: JointOperationsBoardProps) {
  const [selection, setSelection] = useState<JointBoardSelection>(() => ({ ...initialJointBoardSelection }));
  const focusRequested = useRef(false);
  const sendOnce = useRef<ReturnType<typeof createJointCommandGuard> | null>(null);
  if (!sendOnce.current) sendOnce.current = createJointCommandGuard();
  const headingRef = useCallback((node: HTMLHeadingElement | null) => {
    if (!node || !focusRequested.current) return;
    focusRequested.current = false;
    focusHeading(node);
  }, [props.view, selection.workspace, selection.fleetId, selection.airGroupId, selection.operationId, selection.recordId]);
  const changeSelection = (patch: Partial<JointBoardSelection>) => {
    if (('workspace' in patch && patch.workspace !== selection.workspace)
      || ('fleetId' in patch && patch.fleetId !== selection.fleetId)
      || ('airGroupId' in patch && patch.airGroupId !== selection.airGroupId)) focusRequested.current = true;
    setSelection((current) => ({ ...current, ...patch }));
  };
  const guarded = (key: string, action: () => void) => {
    if (props.planningDisabledReason) return;
    sendOnce.current!(props.state, props.game.week, key, action);
  };
  return <JointOperationsBoardView {...props} selection={selection} onSelectionChange={changeSelection} headingRef={headingRef}
    onLaunch={(templateId, fleetIds, airGroupIds, objectiveId) => guarded('launch', () => {
      props.onLaunch(templateId, fleetIds, airGroupIds, objectiveId);
      changeSelection({ workspace: 'operations', fleetIds: [], airGroupIds: [], operationId: null });
    })}
    onRefit={(id) => guarded('refit:' + id, () => props.onRefit(id))}
    onDoctrineChange={(doctrine) => guarded('doctrine', () => props.onDoctrineChange(doctrine))}
    onCommandResponse={(id, response) => guarded('response:' + id, () => props.onCommandResponse(id, response))}
  />;
}
interface BoardViewProps extends JointOperationsBoardProps {
  selection: JointBoardSelection; onSelectionChange: (patch: Partial<JointBoardSelection>) => void; headingRef?: Ref<HTMLHeadingElement>;
}
interface Choice { id: string; label: string; detail: string }
function ChoiceList({ id, label, choices, selectedId, onChange }: { id: string; label: string; choices: Choice[]; selectedId: string | null; onChange: (id: string) => void }) {
  return <aside className="jcb-choice-list">
    <label className="jcb-mobile-choice" htmlFor={id}>{label}<select id={id} value={selectedId ?? ''} disabled={!choices.length} onChange={(event) => onChange(event.currentTarget.value)}>
      {!choices.length ? <option value="">등록된 항목 없음</option> : choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label} · {choice.detail}</option>)}
    </select></label>
    <div className="jcb-desktop-choice" role="group" aria-label={label}>{choices.map((choice) => <button key={choice.id} type="button" aria-pressed={choice.id === selectedId} onClick={() => onChange(choice.id)}><strong>{choice.label}</strong><small>{choice.detail}</small></button>)}</div>
  </aside>;
}
function Meter({ value, label }: { value: number; label: string }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <div className="jcb-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><span style={{ width: safeValue + '%' }} /></div>;
}
function SurfaceHeading({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
  return <header className="jcb-surface-heading"><div><span className="jcb-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{meta ? <small>{meta}</small> : null}</header>;
}
function ForceDetail({ force, state, disabledReason, onRefit, headingRef }: { force: NavalTaskForce | AirGroup; state: JointForcesState; disabledReason?: string; onRefit: (id: string) => void; headingRef?: Ref<HTMLHeadingElement> }) {
  const naval = 'ships' in force;
  const operation = state.operations.find((item) => item.id === force.assignmentId && (naval ? item.fleetIds : item.airGroupIds).includes(force.id));
  const canRefit = force.status !== 'assigned' && !disabledReason;
  const authorizedCount = naval ? force.authorizedShips : force.authorizedAircraft;
  return <section className="jcb-surface jcb-force-detail" aria-labelledby="jcb-force-title" data-force-id={force.id}>
    <header className="jcb-force-heading"><span className="jcb-symbol">{naval ? <Anchor size={28} /> : <Plane size={28} />}</span><div><span className="jcb-eyebrow">{naval ? fleetKindLabels[force.kind] : airKindLabels[force.kind]} · {forceStatus(force)}</span><h2 id="jcb-force-title" tabIndex={-1} ref={headingRef}>{force.name}</h2><p>{force.commander} · {naval ? '기함 ' + force.flagship : force.principalAircraft}</p></div></header>
    <dl className="jcb-metrics">
      <div><dt>{naval ? '현존 함정' : '보유 기체'}</dt><dd>{countLabel(force)}</dd><small>{authorizedCount !== undefined ? '기준 편제 ' + authorizedCount + (naval ? '척' : '대') : '기준 편제 미기록'}</small></div>
      <div><dt>준비도</dt><dd>{Math.round(force.readiness)}</dd><Meter value={force.readiness} label="부대 준비도" /></div>
      <div><dt>{naval ? '조직력' : '가동률'}</dt><dd>{Math.round(naval ? force.organization : force.serviceability)}{naval ? '' : '%'}</dd><Meter value={naval ? force.organization : force.serviceability} label={naval ? '함대 조직력' : '항공기 가동률'} /></div>
      <div><dt>경험</dt><dd>{Math.round(force.experience)}</dd><small>{naval ? force.location : force.base}</small></div>
    </dl>
    {countOf(force) <= 0 ? <p className="jcb-warning">현존 전력이 없어 출격할 수 없습니다. 정비는 손실된 함정·기체를 보충하지 않습니다.</p> : null}
    <section className="jcb-current-mission" aria-label="선택 부대 현재 작전"><span className="jcb-eyebrow">현재 배속</span>
      {operation ? <><h3>{operation.name}</h3><p>{operation.objectiveName ?? theaterLabel(operation.theater)} · 제{operation.startedWeek + 1}주 승인</p><div className="jcb-progress-line"><Clock3 size={16} /><span>{operation.elapsedWeeks}/{operation.maximumWeeks}주 · 진척 {Math.round(operation.progress)}%</span></div><Meter value={operation.progress} label="현재 배속 작전 진척" /><small>진행 중입니다. 최종 손실과 전과는 합동작전의 확정 보고서에서 확인합니다.</small></>
        : <><h3>{force.status === 'assigned' ? '배속 기록 확인 필요' : force.status === 'refit' ? '정비 중 · 출격 배속 불가' : '현재 작전 배속 없음'}</h3><p>{force.status === 'assigned' ? '현재 부대 ID와 일치하는 진행 작전 기록을 찾지 못했습니다. 새 명령을 자동 실행하지 않습니다.' : '부대를 선택하는 것만으로 출격·정비·시간 진행이 실행되지 않습니다.'}</p></>}
    </section>
    <div className="jcb-action-row"><div><h3>{naval ? '창정비 지시' : '집중 정비 지시'}</h3><p>{naval ? '주간 정산에서 준비도·조직력을 회복합니다.' : '주간 정산에서 준비도·가동률을 회복합니다.'} 현존 수량은 별도입니다.</p></div><button type="button" disabled={!canRefit} title={disabledReason ?? (force.status === 'assigned' ? '작전 배속 중에는 정비 전환 불가' : undefined)} onClick={() => { if (canRefit) onRefit(force.id); }}><Wrench size={17} />{force.status === 'refit' ? '정비 중단' : '정비 전환'}</button></div>
    <details className="jcb-disclosure"><summary>사료 기반과 편제 설명</summary><p>{force.historicalBasis}</p></details>
  </section>;
}
export function JointOperationsBoardView(props: BoardViewProps) {
  const { view, state, theater, game, stockpile, selection, onSelectionChange, headingRef, planningDisabledReason } = props;
  const workspace = selection.workspace;
  const proposedDoctrine = selection.doctrineId && selection.doctrineId in jointDoctrineDefinitions ? selection.doctrineId : state.doctrine;
  const canApplyDoctrine = !planningDisabledReason && game.commandPoints >= 4 && proposedDoctrine !== state.doctrine;
  const plan = getJointBoardPlan(props, selection);
  const pending = state.commandMessages.filter((message) => message.status === 'pending');
  const detected = state.opponent.operations.filter((operation) => operation.theater === theater && operation.detected);
  const selectTemplate = (id: string, objectiveId: string | null = null) => onSelectionChange({ workspace: 'planning', templateId: id, objectiveId, fleetIds: [], airGroupIds: [] });
  const naval = view === 'naval';
  const forces = naval ? state.fleets : state.airGroups;
  const force = resolveJointSelection<NavalTaskForce | AirGroup>(forces, naval ? selection.fleetId : selection.airGroupId);
  const currentObjective = resolveJointSelection(state.objectives[theater], selection.overviewObjectiveId);
  const activeOperation = resolveJointSelection(state.operations, selection.operationId);
  const records = [...state.records].reverse();
  const record = resolveJointSelection(records, selection.recordId);
  const control = state.theaterControl[theater];
  return <div className="joint-command-board command-edition" data-joint-view={view} data-joint-workspace={workspace}>
    <header className="jcb-header"><div><span className="jcb-eyebrow">{view === 'joint' ? 'COMBINED OPERATIONS' : naval ? 'NAVAL COMMAND' : 'AIR COMMAND'} / 제{game.week + 1}주</span><h1>{view === 'joint' ? '합동작전 본부' : naval ? '해군 전력 관리' : '항공군 전력 관리'}</h1><p>{view === 'joint' ? theaterLabel(theater) + ' · 읽기 → 명령 → 주간 진행 → 확정 결과' : forces.length + '개 부대 · 한 편제의 현재 상태와 명령을 확인합니다.'}</p></div><span className="jcb-status">{view === 'joint' ? state.operations.length + '개 작전 진행' : forces.filter((item) => item.status === 'assigned').length + '개 작전 배속'}</span></header>
    {planningDisabledReason ? <p className="jcb-authority"><ShieldCheck size={18} />{planningDisabledReason} 현재 화면은 열람할 수 있습니다.</p> : null}
    {view !== 'joint' ? forces.length ? <div className="jcb-force-layout">
      <ChoiceList id="jcb-force-select" label={naval ? '함대 선택' : '항공대 선택'} selectedId={force?.id ?? null} choices={forces.map((item) => ({ id: item.id, label: item.name, detail: countLabel(item) + ' · ' + forceStatus(item) }))} onChange={(id) => onSelectionChange(naval ? { fleetId: id } : { airGroupId: id })} />
      {force ? <ForceDetail force={force} state={state} disabledReason={planningDisabledReason} onRefit={props.onRefit} headingRef={headingRef} /> : null}
    </div> : <section className="jcb-surface jcb-empty"><h2>등록된 {naval ? '함대가' : '항공대가'} 없습니다</h2><p>선택할 전력이 없습니다. 다른 부대를 추정하거나 자동 명령을 내리지 않습니다.</p></section> : <>
      <nav className="jcb-workspaces" aria-label="합동작전 업무"><button type="button" aria-pressed={workspace === 'overview'} onClick={() => onSelectionChange({ workspace: 'overview' })}>전구 현황<small>주도권·관측 정보</small></button><button type="button" aria-pressed={workspace === 'planning'} onClick={() => onSelectionChange({ workspace: 'planning' })}>작전 계획<small>목표·배속·승인</small></button><button type="button" aria-pressed={workspace === 'operations'} onClick={() => onSelectionChange({ workspace: 'operations' })}>진행·보고서<small>{state.operations.length}건 진행 · {pending.length}건 답신 대기</small></button></nav>
      <h2 className="jcb-workspace-title" tabIndex={-1} ref={headingRef}>{workspaceLabels[workspace]}</h2>
      {workspace === 'overview' ? <>
        <section className="jcb-priority"><div><span className="jcb-eyebrow">이번 지휘 확인</span><h2>{pending.length ? '지휘관의 답신 요청을 검토하십시오' : detected.length ? '관측된 적 작전과 대응 목표를 확인하십시오' : '가용 전력을 확인하고 작전을 계획하십시오'}</h2><p>{pending.length ? '답신 대기 ' + pending.length + '건 · 승인 전에는 추가 지휘점수를 사용하지 않습니다.' : '현황을 읽거나 계획을 선택해도 전력이 배속되지 않습니다.'}</p></div><button type="button" onClick={() => onSelectionChange({ workspace: pending.length ? 'operations' : 'planning' })}>{pending.length ? '요청 검토' : '계획 작성'}<ArrowRight size={18} /></button></section>
        <section className="jcb-surface"><SurfaceHeading eyebrow="OWN CAPABILITIES" title="현재 전력 지표" meta="국가 지표 · 부대 현존 수량과 별도" /><dl className="jcb-metrics">{[['공중 우세', game.airPower], ['해상 우세', game.navalPower], ['정보 신뢰', game.intelNetwork], ['적 대응압력', game.enemyPressure]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{Math.round(Number(value))}</dd><Meter value={Number(value)} label={String(label)} /></div>)}</dl>
          <div className="jcb-control-grid">{[['제공권', control.air], ['제해권', control.sea], ['정보우세', control.intelligence]].map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>우리 {Math.round(Number(value))} · 상대 {Math.round(100 - Number(value))}</strong><Meter value={Number(value)} label={'우리 측 ' + label} /></article>)}</div><p className="jcb-meta">전구 주도권 · {control.trend > 0 ? '우리 측으로 이동' : control.trend < 0 ? state.opponent.name + ' 측으로 이동' : '교착'}</p>
        </section>
        <section className="jcb-surface"><SurfaceHeading eyebrow="CAMPAIGN OBJECTIVES" title="전역·항로·표적 현황" meta="주간 작전 결과가 누적된 실제 구역 상태" />
          <label className="jcb-select-label" htmlFor="jcb-overview-objective">작전 구역<select id="jcb-overview-objective" value={currentObjective?.id ?? ''} disabled={!currentObjective} onChange={(event) => onSelectionChange({ overviewObjectiveId: event.currentTarget.value })}>{state.objectives[theater].map((objective) => <option key={objective.id} value={objective.id}>{objective.name}</option>)}</select></label>
          {currentObjective ? <div className="jcb-objective-detail"><span className="jcb-eyebrow">{objectiveKindLabel(currentObjective.kind)} · {currentObjective.region}</span><h3>{currentObjective.name}</h3><dl className="jcb-metrics">{[['통제', currentObjective.control], ['수송', currentObjective.throughput], ['시설', currentObjective.infrastructure], ['위협', currentObjective.enemyThreat], ['피해', currentObjective.damage]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{Math.round(Number(value))}</dd></div>)}</dl><p>{currentObjective.lastResult}</p><details className="jcb-disclosure"><summary>구역 사료와 모델링 범위</summary><p>{currentObjective.historicalBasis}</p></details></div> : <p>등록된 작전 구역이 없습니다.</p>}
        </section>
        <section className="jcb-surface"><SurfaceHeading eyebrow="OBSERVED INTELLIGENCE" title={state.opponent.name + ' 작전 정보'} meta={'탐지 ' + detected.length + '건 · 미탐지 편제는 공개하지 않음'} />
          {!detected.length ? <p className="jcb-empty"><Radar size={20} />현재 실체를 확인한 적 작전이 없습니다. 정찰 임무와 정보망이 탐지를 지원합니다.</p> : detected.map((operation) => {
            const uncertainty = Math.max(4, Math.round((100 - operation.intelligenceConfidence) * .24));
            const counter = plan.templates.find((template) => template.id === getCounterOperationTemplateIds(operation.kind, theater)[0]);
            return <article className="jcb-intel-report" key={operation.id}><span className="jcb-eyebrow">신뢰 {Math.round(operation.intelligenceConfidence)}%</span><h3>{operation.intelligenceConfidence >= 68 ? operation.name : operationDomainLabel(operation.kind) + ' 작전 추정'}</h3><p>예상 표적 · {operation.target}</p><p>진척 추정 {Math.max(0, Math.round(operation.progress - uncertainty))}~{Math.min(100, Math.round(operation.progress + uncertainty))}% · 결과 판정까지 최대 {Math.max(0, operation.maximumWeeks - operation.elapsedWeeks)}주</p>{counter ? <button type="button" onClick={() => selectTemplate(counter.id, operation.objectiveId ?? null)}>대응 계획 검토 · {counter.name}<ArrowRight size={16} /></button> : null}</article>;
          })}
        </section>
      </> : null}
      {workspace === 'planning' ? <>
        <section className="jcb-surface jcb-doctrine"><div><span className="jcb-eyebrow">현재 합동 교리 · {jointDoctrineDefinitions[state.doctrine].name}</span><h2>교리 검토</h2><p>{jointDoctrineDefinitions[proposedDoctrine].description}</p><small>{jointDoctrineDefinitions[proposedDoctrine].bonus}</small></div><div><label className="jcb-select-label" htmlFor="jcb-doctrine">검토할 교리 · 선택만으로 변경되지 않음<select id="jcb-doctrine" value={proposedDoctrine} onChange={(event) => { const doctrine = event.currentTarget.value as JointDoctrine; if (doctrine in jointDoctrineDefinitions) onSelectionChange({ doctrineId: doctrine }); }}>{Object.entries(jointDoctrineDefinitions).map(([id, doctrine]) => <option key={id} value={id}>{doctrine.name}</option>)}</select></label><button type="button" disabled={!canApplyDoctrine} onClick={() => { if (canApplyDoctrine) props.onDoctrineChange(proposedDoctrine); }}>교리 적용 · 4 CP</button><p className="jcb-meta">변경 명령 때 기존 규칙으로 지휘점수 4 차감 · 현재 {Math.round(game.commandPoints)} CP</p></div></section>
        <div className="jcb-plan-grid"><section className="jcb-surface"><SurfaceHeading eyebrow="01 / MISSION & OBJECTIVE" title="작전과 목표" /><label className="jcb-select-label" htmlFor="jcb-template">작전 유형<select id="jcb-template" value={plan.template?.id ?? ''} disabled={!plan.template} onChange={(event) => selectTemplate(event.currentTarget.value)}>{plan.templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.minimumWeeks}~{template.maximumWeeks}주</option>)}</select></label>
          {plan.template ? <><h3>{plan.template.name}</h3><p>{plan.template.description}</p><details className="jcb-disclosure"><summary>사료 기반과 예상 세계 변화</summary><p>{plan.template.historicalBasis}</p><p>{plan.template.worldEffect}</p></details><label className="jcb-select-label" htmlFor="jcb-target">작전 목표<select id="jcb-target" value={plan.objective?.id ?? ''} disabled={!plan.objective} onChange={(event) => onSelectionChange({ objectiveId: event.currentTarget.value })}>{!plan.objective ? <option value="">적합한 목표 없음</option> : plan.objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.name} · {objectiveKindLabel(objective.kind)}</option>)}</select></label>{plan.objective ? <div className="jcb-target-brief"><strong>{plan.objective.name}</strong><p>{plan.objective.region}</p><small>위협 {Math.round(plan.objective.enemyThreat)} · 피해 {Math.round(plan.objective.damage)} · 민간 노출 {Math.round(plan.objective.civilianRisk)}</small><details className="jcb-disclosure"><summary>선택 표적의 배경</summary><p>{plan.objective.historicalBasis}</p></details></div> : null}</> : <p>현재 전구에 등록된 작전 유형이 없습니다.</p>}
        </section><section className="jcb-surface"><SurfaceHeading eyebrow="02 / ASSIGN FORCES" title="투입 전력 선택" meta={'함대 ' + plan.fleetIds.length + ' · 항공대 ' + plan.airGroupIds.length} />
          {plan.template ? <>{([['fleet', state.fleets, plan.fleetIds], ['air', state.airGroups, plan.airGroupIds]] as const).map(([branch, units, ids]) => <fieldset className="jcb-force-picks" key={branch}><legend>{branch === 'fleet' ? '함대' : '항공대'} · {(branch === 'fleet' ? plan.template!.requiredFleetKinds : plan.template!.requiredAirKinds).length ? '필수 군종' : '선택 지원'}</legend>{units.length ? units.map((unit) => {
            const reason = getJointForceSelectionReason(unit, plan.template!);
            const checked = ids.includes(unit.id);
            return <label className={'jcb-force-pick' + (checked ? ' is-selected' : '')} key={unit.id}><input type="checkbox" checked={checked} disabled={Boolean(reason) && !checked} onChange={() => {
              if (reason && !checked) return;
              const updated = checked ? ids.filter((id) => id !== unit.id) : [...ids, unit.id];
              onSelectionChange(branch === 'fleet' ? { fleetIds: updated } : { airGroupIds: updated });
            }} /><span><strong>{unit.name}</strong><small>{countLabel(unit)} · 준비 {Math.round(unit.readiness)}{'serviceability' in unit ? ' · 가동 ' + Math.round(unit.serviceability) + '%' : ''}</small>{reason ? <em>{reason}</em> : null}</span></label>;
          }) : <p>등록된 전력 없음</p>}</fieldset>)}</> : null}
        </section></div>
        <section className="jcb-forecast" aria-labelledby="jcb-forecast-title"><div><span className="jcb-eyebrow">03 / REVIEW & AUTHORIZE</span><h2 id="jcb-forecast-title">작전 승인 전 검토</h2><p>승인 전에는 비용 차감과 실제 부대 배속이 없습니다. 예측은 현재 적용된 교리를 사용하며, 검토 중인 교리는 별도 적용해야 합니다.</p><strong className="jcb-chance">{plan.forecast?.chance ?? 0}% <span>예상 성공 · 확정 결과 아님</span></strong><dl className="jcb-metrics"><div><dt>예상 기간</dt><dd>{plan.forecast?.duration ?? '—'}</dd></div><div><dt>지휘점수</dt><dd>{plan.forecast?.commandCost ?? '—'} CP</dd><small>보유 {Math.round(game.commandPoints)}</small></div><div><dt>연료</dt><dd>{plan.forecast?.fuelCost ?? '—'}K</dd><small>보유 {Math.round(game.fuel)}K</small></div><div><dt>수송선</dt><dd>{plan.forecast?.convoyCost ?? '—'}척</dd><small>보유 {stockpile.convoys}척</small></div></dl></div>
          <div className="jcb-approval"><details className="jcb-disclosure"><summary>작전 전망의 판단 근거</summary><ul>{plan.forecast?.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul></details>{plan.forecast?.civilianWarning ? <p className="jcb-warning">{plan.forecast.civilianWarning}</p> : null}{plan.warning ? <p className="jcb-warning" role="status">{plan.warning}</p> : <p>목표 {plan.objective?.name} · 선택된 현재 전력으로 승인합니다.</p>}{plan.staleSelection && plan.template ? <button type="button" onClick={() => selectTemplate(plan.template!.id)}>현재 전력으로 계획 다시 검토</button> : null}<button type="button" className="jcb-primary" disabled={!plan.canLaunch} onClick={() => { if (plan.canLaunch && plan.template) props.onLaunch(plan.template.id, plan.fleetIds, plan.airGroupIds, plan.objective?.id); }}><Crosshair size={18} />작전명령 승인</button></div>
        </section>
      </> : null}
      {workspace === 'operations' ? <>
        <section className="jcb-surface"><SurfaceHeading eyebrow="ACTIVE MISSIONS" title="진행 중 작전" meta="모든 전구 · 현재 작전은 아직 결산되지 않음" />
          {activeOperation ? <div className="jcb-operation-layout"><ChoiceList id="jcb-operation-select" label="진행 작전 선택" selectedId={activeOperation.id} choices={state.operations.map((operation) => ({ id: operation.id, label: operation.name, detail: theaterLabel(operation.theater) + ' · ' + Math.round(operation.progress) + '%' }))} onChange={(id) => onSelectionChange({ operationId: id })} /><article className="jcb-active-detail" data-operation-id={activeOperation.id}><span className="jcb-eyebrow">{theaterLabel(activeOperation.theater)} · 제{activeOperation.startedWeek + 1}주 승인</span><h3>{activeOperation.name}</h3><p>{activeOperation.objectiveName ?? '목표 구역 미기록'}</p><dl className="jcb-metrics"><div><dt>진척</dt><dd>{Math.round(activeOperation.progress)}%</dd></div><div><dt>진행 주차</dt><dd>{activeOperation.elapsedWeeks}/{activeOperation.maximumWeeks}주</dd></div><div><dt>계획·지휘 조정 전망</dt><dd>{activeOperation.successChance}%</dd></div></dl><Meter value={activeOperation.progress} label="선택 작전 진척" /><p className="jcb-meta">저장된 전망입니다. 이후 실제 손실·교전은 주간 판정에 추가 반영되며 성공을 보장하지 않습니다.</p><h4>현재 배속 전력</h4><ul className="jcb-assigned-forces">{[...state.fleets.filter((unit) => activeOperation.fleetIds.includes(unit.id)), ...state.airGroups.filter((unit) => activeOperation.airGroupIds.includes(unit.id))].map((unit) => <li key={unit.id}>{unit.name} · 현존 {countLabel(unit)} · {forceStatus(unit)}</li>)}</ul><small>진행 중인 작전을 완료된 전과로 표시하지 않습니다.</small></article></div> : <p className="jcb-empty">현재 진행 중인 합동작전이 없습니다. 새 계획은 별도 승인해야 시작됩니다.</p>}
        </section>
        <section className="jcb-surface"><SurfaceHeading eyebrow="COMMANDER INBOX" title="지휘관 전문" meta={'답신 대기 ' + pending.length + '건 · 지휘부 신뢰 ' + Math.round(state.commandTrust)} />
          {!pending.length ? <p>답신을 기다리는 지휘관 요청이 없습니다.</p> : pending.map((message) => <details className="jcb-message" key={message.id}><summary><span><strong>{message.subject}</strong><small>{message.commander} · {message.office} · 제{message.week + 1}주</small></span></summary><p>{message.body}</p><div className="jcb-message-actions">{([['back', '재량권 보장', 3], ['revise', '계획 보강', 1], ['overrule', '원안 강행', 0]] as const).map(([response, label, cost]) => <button type="button" key={response} disabled={Boolean(planningDisabledReason) || game.commandPoints < cost} onClick={() => { if (!planningDisabledReason && game.commandPoints >= cost && message.status === 'pending') props.onCommandResponse(message.id, response); }}>{label}<small>{cost} CP</small></button>)}</div></details>)}
          {state.commandMessages.filter((message) => message.response === 'report' && message.subject.includes('작전 종료')).slice(-2).reverse().map((message) => <details className="jcb-message" key={message.id}><summary><span><strong>{message.subject}</strong><small>전과 전문 · {message.commander} · 제{message.week + 1}주</small></span></summary><p>{message.body}</p></details>)}
        </section>
        <section className="jcb-surface"><SurfaceHeading eyebrow="CONFIRMED RESULTS" title="확정 작전 보고서" meta={'보관 ' + records.length + '건'} />
          {record ? <><label className="jcb-select-label" htmlFor="jcb-record">완료 보고서 선택<select id="jcb-record" value={record.id} onChange={(event) => onSelectionChange({ recordId: event.currentTarget.value })}>{records.map((item) => <option value={item.id} key={item.id}>제{item.endedWeek + 1}주 · {item.name} · {outcomeLabel(item.outcome)}</option>)}</select></label><article className="jcb-record" data-record-id={record.id}><span className="jcb-eyebrow">{outcomeLabel(record.outcome)} · 제{record.startedWeek + 1}~{record.endedWeek + 1}주</span><h3>{record.name}{record.objectiveName ? ' · ' + record.objectiveName : ''}</h3><p>{record.result}</p><dl className="jcb-receipt"><div><dt>기록된 손실</dt><dd>{record.losses}</dd></div><div><dt>작전 기간</dt><dd>{record.endedWeek - record.startedWeek + 1}주</dd></div></dl>{record.campaignChanges?.length ? <ul>{record.campaignChanges.map((change) => <li key={change}>{change}</li>)}</ul> : null}<p>{record.worldEffect}</p></article></> : <p className="jcb-empty"><FileText size={20} />아직 확정된 합동작전 보고서가 없습니다. 계획·진행 전망은 실제 결과와 구분됩니다.</p>}
        </section>
        {state.engagements.length ? <section className="jcb-surface"><SurfaceHeading eyebrow="CONTACT REPORTS" title="최근 요격·교전" meta={'최근 ' + Math.min(4, state.engagements.length) + '건'} />{state.engagements.slice(-4).reverse().map((engagement) => <details className="jcb-message" key={engagement.id}><summary><span><strong>{engagement.title}</strong><small>제{engagement.week + 1}주 · {theaterLabel(engagement.theater)}</small></span></summary><p>{engagement.summary}</p><p>보고된 손실 · 우리 {engagement.playerLosses} / 적 {engagement.enemyLosses}</p></details>)}</section> : null}
      </> : null}
    </>}
  </div>;
}
function outcomeLabel(outcome: string) { return outcome === 'success' ? '성공' : '목표 미달'; }
function operationDomainLabel(kind: string) {
  if (['air-superiority', 'close-support', 'strategic-bombing', 'reconnaissance'].includes(kind)) return '항공';
  if (['convoy-escort', 'submarine-raiding'].includes(kind)) return '해상';
  return '해공 합동';
}
function objectiveKindLabel(kind: string) {
  if (kind === 'convoy-route') return '호송로';
  if (kind === 'air-zone') return '항공전구';
  if (kind === 'industrial-area') return '산업표적';
  if (kind === 'naval-base') return '해군기지';
  return '상륙구역';
}
