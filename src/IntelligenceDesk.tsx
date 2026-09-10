import { useCallback, useRef, useState, type Dispatch, type Ref, type SetStateAction } from 'react';
import { ArrowRight, Check, Eye, FileText, Fingerprint, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getNation } from './campaign';
import { getCampaignYearForWeek } from './campaignCalendar';
import { getRoleTabMandates } from './roleMandate';
import type { CareerMarketState } from './careerMarket';
import type { ResolvedIntelligenceOrganization } from './intelligenceHistory';
import type { CareerRole, CovertOperation, GameState, GameTab, NationProfile, TheaterId, WarEvent, WarEventTrace } from './types';
import './IntelligenceDesk.css';

export interface IntelligenceDeskProps {
  game: GameState;
  operations: CovertOperation[];
  setOperations: Dispatch<SetStateAction<CovertOperation[]>>;
  setGame: Dispatch<SetStateAction<GameState>>;
  notify: (message: string) => void;
  addEvent: (title: string, detail: string, tone: WarEvent['tone'], week: number, trace?: Partial<WarEventTrace>) => void;
  nation: NationProfile;
  role: CareerRole;
  activeTheater: TheaterId;
  intelligenceHistory: ResolvedIntelligenceOrganization[];
  careerMarket: CareerMarketState;
  onOpenClandestineDesk: () => void;
  onActionCompleted: (tab: GameTab, id: string, description: string) => void;
  busy?: boolean;
  authorized?: boolean;
}
export type IntelligenceWorkspace = 'overview' | 'planning' | 'reports' | 'institutions';
export interface IntelligenceDeskSelection {
  workspace: IntelligenceWorkspace;
  operationId: string | null;
  reportId: string | null;
  organizationId: string | null;
}
export const initialIntelligenceDeskSelection: IntelligenceDeskSelection = { workspace: 'overview', operationId: null, reportId: null, organizationId: null };
export interface IntelligenceExecutionProposal {
  nationId: NationProfile['id']; roleId: string; week: number; theater: TheaterId;
  operation: CovertOperation; politicalPower: number; intelNetwork: number; politicalCost: number;
}
const workspaceLabels: Record<IntelligenceWorkspace, string> = { overview: '정보 현황', planning: '공작 계획', reports: '진행·보고', institutions: '기관·인물' };
const operationSnapshot = (operation: CovertOperation) => [operation.id, operation.name, operation.region, operation.progress, operation.risk, operation.active, operation.icon];
export const getIntelligenceOperationCost = (role: CareerRole) => role.branch === 'intelligence' ? 7 : 10;
export function canDirectIntelligence(props: Pick<IntelligenceDeskProps, 'authorized' | 'role'>) {
  return props.authorized ?? getRoleTabMandates(props.role).intelligence.mode === 'direct';
}
export function resolveIntelligenceSelection<T extends { id: string }>(items: readonly T[], id: string | null): T | null {
  return items.find((item) => item.id === id) ?? items[0] ?? null;
}
export function createIntelligenceProposal(input: IntelligenceDeskProps, operationId: string): IntelligenceExecutionProposal | null {
  const operation = input.operations.find((item) => item.id === operationId);
  if (!operation || operation.progress >= 100) return null;
  return { nationId: input.nation.id, roleId: input.role.id, week: input.game.week, theater: input.activeTheater, operation: { ...operation }, politicalPower: input.game.politicalPower, intelNetwork: input.game.intelNetwork, politicalCost: getIntelligenceOperationCost(input.role) };
}
export function assessIntelligenceProposal(proposal: IntelligenceExecutionProposal | null, input: IntelligenceDeskProps) {
  const cost = getIntelligenceOperationCost(input.role);
  const reject = (reason: string) => ({ allowed: false, reason, cost, intelDelta: 0, operation: null as CovertOperation | null });
  if (!proposal) return reject('공작을 선택하고 집행안을 검토하십시오.');
  if (!canDirectIntelligence(input)) return reject('현재 보직에는 정보 공작의 직접 집행권이 없습니다.');
  if (input.busy) return reject('기간 진행 중입니다. 주간 정산이 멈춘 뒤 다시 확인하십시오.');
  if (input.role.nationId !== input.nation.id || proposal.nationId !== input.nation.id || proposal.roleId !== input.role.id) return reject('국가·보직이 변경되었습니다. 현재 소속으로 다시 검토하십시오.');
  if (!Number.isInteger(input.game.week) || input.game.week < 0 || proposal.week !== input.game.week || proposal.theater !== input.activeTheater) return reject('주차 또는 전구가 바뀌었습니다. 집행안을 다시 검토하십시오.');
  const matches = input.operations.filter((operation) => operation.id === proposal.operation.id);
  const operation = matches[0];
  if (matches.length !== 1 || !operation) return reject('선택한 공작의 고유 기록을 찾을 수 없습니다. 현재 목록에서 다시 선택하십시오.');
  if (!Number.isFinite(operation.progress) || operation.progress < 0 || operation.progress >= 100) return reject('이미 완료됐거나 준비도 기록이 유효하지 않은 공작입니다.');
  if (JSON.stringify(operationSnapshot(operation)) !== JSON.stringify(operationSnapshot(proposal.operation))) return reject('선택 공작의 상태가 변경되었습니다. 최신 기록으로 다시 검토하십시오.');
  if (!Number.isFinite(input.game.politicalPower) || !Number.isFinite(input.game.intelNetwork) || input.game.intelNetwork < 0 || input.game.intelNetwork > 100) return reject('정치력·정보망 기록이 유효하지 않습니다.');
  if (proposal.politicalCost !== cost || proposal.politicalPower !== input.game.politicalPower || proposal.intelNetwork !== input.game.intelNetwork) return reject('비용 또는 정보망 조건이 달라졌습니다. 현재 수치로 다시 검토하십시오.');
  if (input.game.politicalPower < cost) return reject('정보 공작에 필요한 정치력이 부족합니다.');
  return { allowed: true, reason: '현재 국가·보직·주차·공작 상태와 비용을 확인했습니다.', cost, intelDelta: Math.min(100, input.game.intelNetwork + 4) - input.game.intelNetwork, operation };
}
/** Same legacy action: one political charge, +4 intelligence (capped), immediate completion. */
export function createIntelligenceExecutionController() {
  const delivered = new Set<string>();
  return (proposal: IntelligenceExecutionProposal | null, input: IntelligenceDeskProps) => {
    const assessment = assessIntelligenceProposal(proposal, input);
    if (!assessment.allowed || !proposal || !assessment.operation) return { accepted: false, reason: assessment.reason };
    const key = JSON.stringify([proposal.nationId, proposal.roleId, proposal.week, proposal.theater, operationSnapshot(proposal.operation)]);
    if (delivered.has(key)) return { accepted: false, reason: '이 집행안은 이미 전달됐습니다. 완료 기록을 확인하십시오.' };
    delivered.add(key);
    const operation = assessment.operation;
    input.setGame((current) => ({ ...current, politicalPower: current.politicalPower - assessment.cost, intelNetwork: Math.min(100, current.intelNetwork + 4) }));
    input.setOperations((current) => current.map((item) => item.id === operation.id ? { ...item, progress: 100 } : item));
    input.addEvent('정보 작전 성공 — ' + operation.name, operation.region + '에서 준비한 공작이 목표를 달성했습니다. 정보망이 확장됩니다.', 'good', input.game.week, {
      domain: 'operations',
      decision: `${operation.name} · ${operation.region} 국가 정보 공작을 직접 승인했습니다.`,
      trigger: `제${input.game.week + 1}주 · ${input.role.title}의 집행 확정`,
      factors: [
        `선택 공작: ${operation.name} (${operation.id}) · ${operation.region}`,
        `현재 보직의 공작 비용: 정치력 ${assessment.cost}`,
        '현재 간단 공작 규칙: 별도 주간 대기 없이 즉시 완료 · 정보망 최대 +4 (상한 100)',
        '위험 참고값은 성공·실패·손실 판정에 반영되지 않습니다.',
      ],
      effects: [
        { label: '정치력', value: `${input.game.politicalPower} → ${input.game.politicalPower - assessment.cost} (−${assessment.cost})`, tone: 'negative' },
        { label: '공작 상태', value: `${operation.progress}% → 완료 100% · 즉시 반영`, tone: 'positive' },
        { label: '정보망', value: `${input.game.intelNetwork} → ${input.game.intelNetwork + assessment.intelDelta} (+${assessment.intelDelta})`, tone: assessment.intelDelta > 0 ? 'positive' : 'neutral' },
      ],
      ongoing: ['선택한 공작만 완료 처리했습니다. 다른 준비안은 변경하지 않았습니다.', '이 간단 공작에는 자동 주간 진행이나 별도의 실패·손실 판정이 없습니다.'],
      nextActions: ['정보국의 진행·보고에서 선택한 공작의 완료 상태를 확인하십시오.', '개인 잠입·포섭 임무는 별도 비밀 커리어에서 검토하십시오.'],
      certainty: 'confirmed',
    });
    input.notify(operation.name + ' 작전이 성공했습니다.');
    input.onActionCompleted('intelligence', 'intelligence-operation:' + operation.id, operation.name + ' 정보 작전 완료');
    return { accepted: true, reason: operation.name + ' 집행 명령을 전달했습니다.' };
  };
}
export function getIntelligenceInstitutionView(props: Pick<IntelligenceDeskProps, 'intelligenceHistory' | 'nation' | 'game'>) {
  const year = getCampaignYearForWeek(props.game.week);
  const relevant = props.intelligenceHistory.filter((organization) => organization.nationIds.includes(props.nation.id));
  const active = relevant.filter((organization) => organization.appearanceYear <= year && (!organization.dissolvedYear || organization.dissolvedYear >= year));
  const next = [...relevant].filter((organization) => organization.appearanceYear > year).sort((a, b) => a.appearanceYear - b.appearanceYear)[0] ?? null;
  return { year, relevant, active, next };
}
function moveToHeading(node: HTMLHeadingElement) {
  node.focus({ preventScroll: true });
  const viewport = node.ownerDocument.defaultView;
  node.scrollIntoView({ behavior: !viewport?.matchMedia || viewport.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
export function IntelligenceDesk(props: IntelligenceDeskProps) {
  const [selection, setSelection] = useState<IntelligenceDeskSelection>(() => ({ ...initialIntelligenceDeskSelection }));
  const [proposal, setProposal] = useState<IntelligenceExecutionProposal | null>(null);
  const [notice, setNotice] = useState('');
  const controller = useRef<ReturnType<typeof createIntelligenceExecutionController> | null>(null);
  if (!controller.current) controller.current = createIntelligenceExecutionController();
  const headingRequested = useRef(false);
  const reviewRequested = useRef(false);
  const planHeading = useRef<HTMLHeadingElement | null>(null);
  const headingRef = useCallback((node: HTMLHeadingElement | null) => {
    planHeading.current = node;
    if (!node || !headingRequested.current) return;
    headingRequested.current = false; moveToHeading(node);
  }, [selection.workspace, selection.operationId]);
  const reviewRef = useCallback((node: HTMLHeadingElement | null) => {
    if (!node || !proposal || !reviewRequested.current) return;
    reviewRequested.current = false; moveToHeading(node);
  }, [proposal]);
  const changeSelection = (patch: Partial<IntelligenceDeskSelection>) => {
    if (patch.workspace && patch.workspace !== selection.workspace) headingRequested.current = true;
    if ('operationId' in patch && patch.operationId !== selection.operationId) headingRequested.current = true;
    if ('operationId' in patch || ('workspace' in patch && patch.workspace !== selection.workspace)) { setProposal(null); reviewRequested.current = false; }
    setNotice(''); setSelection((current) => ({ ...current, ...patch }));
  };
  return <IntelligenceDeskView {...props} selection={selection} proposal={proposal} notice={notice} headingRef={headingRef} reviewRef={reviewRef} onSelectionChange={changeSelection}
    onReview={(id) => { const next = createIntelligenceProposal(props, id); if (!next) { setNotice('검토 가능한 미완료 공작을 다시 선택하십시오.'); return; } reviewRequested.current = true; setProposal(next); setNotice(''); }}
    onDiscard={() => { setProposal(null); reviewRequested.current = false; if (planHeading.current) moveToHeading(planHeading.current); }}
    onConfirm={() => { const result = controller.current!(proposal, props); if (!result.accepted) { setNotice(result.reason); return; } changeSelection({ workspace: 'reports', reportId: proposal!.operation.id }); setProposal(null); }}
  />;
}
interface IntelligenceDeskViewProps extends IntelligenceDeskProps {
  selection: IntelligenceDeskSelection; proposal: IntelligenceExecutionProposal | null; notice?: string;
  onSelectionChange: (patch: Partial<IntelligenceDeskSelection>) => void;
  onReview: (operationId: string) => void; onDiscard: () => void; onConfirm: () => void;
  headingRef?: Ref<HTMLHeadingElement>; reviewRef?: Ref<HTMLHeadingElement>;
}
function Meter({ value, label }: { value: number; label: string }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <div className="ids-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><span style={{ width: safeValue + '%' }} /></div>;
}
function OperationChoices({ operations, selectedId, onSelect }: { operations: CovertOperation[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <aside className="ids-operation-choices"><label className="ids-mobile-choice" htmlFor="ids-operation-select">공작 선택<select id="ids-operation-select" value={selectedId ?? ''} disabled={!operations.length} onChange={(event) => onSelect(event.currentTarget.value)}>{!operations.length ? <option value="">미완료 공작 없음</option> : operations.map((operation) => <option value={operation.id} key={operation.id}>{operation.name} · {operation.region}</option>)}</select></label><div className="ids-desktop-choice" role="group" aria-label="미완료 공작 선택">{operations.map((operation) => <button key={operation.id} type="button" aria-pressed={operation.id === selectedId} onClick={() => onSelect(operation.id)}><strong>{operation.name}</strong><small>{operation.region} · 저장 준비도 {operation.progress}%</small></button>)}</div></aside>;
}
function PersonalCareerLink({ careerMarket, onOpenClandestineDesk, compact = false }: Pick<IntelligenceDeskProps, 'careerMarket' | 'onOpenClandestineDesk'> & { compact?: boolean }) {
  const personal = careerMarket.clandestine;
  if (!personal) return <div className="ids-personal-link"><Fingerprint size={22} /><div><h3>잠입·포섭은 개인 비밀 커리어에서</h3><p>국가의 간단 공작과 개인의 핸들러·위장 신분·침투 임무는 별도 체계입니다.</p></div><button type="button" onClick={onOpenClandestineDesk}>개인 비밀 커리어 열기<ArrowRight size={16} /></button></div>;
  return <section className="ids-personal-link"><Fingerprint size={22} /><div><span className="ids-eyebrow">본인의 비밀 소속 · {getNation(personal.handlerNationId).shortName}</span><h3>{personal.incident ? '개인 방첩 위기 검토가 필요합니다' : '핸들러와 개인 임무'}</h3><p>{personal.coverName} · {personal.handlerAlias}</p>{!compact ? <dl className="ids-metrics">{[['본국 신뢰', personal.homeTrust], ['핸들러 신뢰', personal.handlerTrust], ['위장 강도', personal.coverStrength], ['노출 위험', careerMarket.exposure]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{Math.round(Number(value))}</dd></div>)}</dl> : null}<small>제안 임무 {personal.missions.filter((mission) => mission.status === 'offered').length}건{personal.incident ? ' · 방첩 사건 있음' : ''}</small></div><button type="button" onClick={onOpenClandestineDesk}>{personal.incident ? <ShieldAlert size={17} /> : <Fingerprint size={17} />}{personal.incident ? '긴급 방첩 위기 대응' : '비밀 임무·핸들러 관리'}</button></section>;
}
export function IntelligenceDeskView(props: IntelligenceDeskViewProps) {
  const { game, operations, nation, role, selection, proposal, notice, onSelectionChange, headingRef, reviewRef } = props;
  const pending = operations.filter((operation) => operation.progress < 100);
  const completed = operations.filter((operation) => operation.progress >= 100);
  const selected = resolveIntelligenceSelection(pending, selection.operationId);
  const report = resolveIntelligenceSelection(operations, selection.reportId ?? completed[0]?.id ?? null);
  const institutions = getIntelligenceInstitutionView(props);
  const organization = resolveIntelligenceSelection(institutions.active, selection.organizationId);
  const assessment = assessIntelligenceProposal(proposal, props);
  const authorized = canDirectIntelligence(props);
  const operationCost = getIntelligenceOperationCost(role);
  return <div className="intelligence-desk command-edition" data-intelligence-workspace={selection.workspace}>
    <header className="ids-header"><div><span className="ids-eyebrow">{nation.code} INTELLIGENCE / 제{game.week + 1}주</span><h1>정보국</h1><p>{role.title} · {role.coverIdentity}</p></div><span className="ids-status">미완료 {pending.length} · 완료 표시 {completed.length}</span></header>
    {!authorized ? <p className="ids-authority"><ShieldCheck size={18} />현재 보직은 정보 공작을 직접 집행할 수 없습니다. 현황·계획과 역사 자료는 열람할 수 있습니다.</p> : null}
    {props.busy ? <p className="ids-authority">기간 진행 중 · 열람은 가능하지만 새 공작 확정은 잠시 중지됩니다.</p> : null}
    <nav className="ids-workspaces" aria-label="정보국 업무">{(Object.entries(workspaceLabels) as [IntelligenceWorkspace, string][]).map(([id, label]) => <button type="button" key={id} aria-pressed={selection.workspace === id} onClick={() => onSelectionChange({ workspace: id })}>{label}</button>)}</nav>
    <h2 className="ids-workspace-title" tabIndex={-1} ref={selection.workspace === 'planning' && selected ? undefined : headingRef}>{workspaceLabels[selection.workspace]}</h2>
    {notice ? <p className="ids-warning" role="status">{notice}</p> : null}
    {selection.workspace === 'overview' ? <>
      <section className="ids-priority"><div><span className="ids-eyebrow">이번 정보 업무</span><h2>{props.careerMarket.clandestine?.incident ? '개인 방첩 사건과 국가 공작을 구분해 검토하십시오' : pending.length ? '집행할 공작을 하나 선택하십시오' : '현재 등록된 공작의 완료 기록을 확인하십시오'}</h2><p>{pending.length ? '선택과 검토는 무료입니다. 확정 시 정치력을 사용하고 현재 규칙에 따라 즉시 완료합니다.' : '완료된 공작은 다시 집행할 수 없습니다. 이 화면이 새 공작을 자동 생성하지 않습니다.'}</p></div><button type="button" onClick={() => onSelectionChange({ workspace: pending.length ? 'planning' : 'reports' })}>{pending.length ? '공작 계획 검토' : '기록 확인'}<ArrowRight size={18} /></button></section>
      <section className="ids-surface"><span className="ids-eyebrow">CURRENT CAPABILITY</span><h2>전구 신호정보</h2><p>{props.activeTheater === 'asia' ? '아시아·태평양 전구의 통신·연락망을 다루는 국가 정보 지표입니다.' : '유럽·지중해 전구의 통신·연락망을 다루는 국가 정보 지표입니다.'}</p><dl className="ids-metrics"><div><dt>정보망 지표</dt><dd>{Math.round(game.intelNetwork)}</dd><Meter value={game.intelNetwork} label="국가 정보망 지표" /></div><div><dt>정치력</dt><dd>{Math.round(game.politicalPower)}</dd><small>공작당 {operationCost} 필요</small></div><div><dt>미완료 준비안</dt><dd>{pending.length}</dd><small>자동 주간 진행과 별도</small></div><div><dt>활동 기관 계보</dt><dd>{institutions.active.length}</dd><small>{institutions.year}년 세계선 기준</small></div></dl><p className="ids-meta">정보망 수치는 역량 지표이며, 이 화면에는 적의 숨겨진 보급량·작전 계획 원본이 제공되지 않습니다. 확인되지 않은 적 정보를 확정 사실처럼 표시하지 않습니다.</p></section>
      <section className="ids-surface"><PersonalCareerLink careerMarket={props.careerMarket} onOpenClandestineDesk={props.onOpenClandestineDesk} compact /></section>
    </> : null}
    {selection.workspace === 'planning' ? <>
      {selected ? <div className="ids-planning-layout"><OperationChoices operations={pending} selectedId={selected.id} onSelect={(id) => onSelectionChange({ operationId: id })} /><section className="ids-surface ids-operation-detail" data-operation-id={selected.id} aria-labelledby="ids-selected-operation"><span className="ids-eyebrow">{role.archetype === 'resistance' ? '저항 연락망' : '국가 비밀 공작'} · {selected.region}</span><h2 id="ids-selected-operation" tabIndex={-1} ref={headingRef}>{selected.name}</h2><dl className="ids-metrics"><div><dt>저장 준비도</dt><dd>{selected.progress}%</dd><Meter value={selected.progress} label="선택 공작 저장 준비도" /></div><div><dt>위험 참고값</dt><dd>{selected.risk}%</dd><small>성공확률 아님</small></div><div><dt>현재 보직 비용</dt><dd>{operationCost} 정치력</dd></div></dl><p>현재 간단 공작 규칙은 별도 파견 대기 없이, 확정한 공작을 즉시 완료하고 국가 정보망을 최대 4 높입니다.</p><details className="ids-disclosure"><summary>준비도·위험 수치와 현재 계산 범위</summary><p>준비도는 저장된 공작 상태입니다. 이 화면의 공작에는 자동 주간 진행이 연결되어 있지 않습니다. 위험 수치는 현재 성공·실패·손실 판정에 반영되지 않는 참고값이며, 100−위험을 성공확률로 해석할 수 없습니다.</p><p>개인 잠입·포섭 임무의 진행과 노출 위험은 별도의 비밀 커리어에서 처리됩니다.</p></details><button type="button" className="ids-primary" onClick={() => props.onReview(selected.id)}><Eye size={18} />이 공작의 집행안 검토</button><small className="ids-review-note">아직 비용을 사용하거나 완료 처리하지 않습니다.</small></section></div> : <section className="ids-surface ids-empty"><h2>검토할 미완료 공작이 없습니다</h2><p>완료 기록은 진행·보고에서 확인할 수 있습니다. 새 임무를 추정하거나 자동으로 집행하지 않습니다.</p></section>}
      {proposal ? <section className="ids-review" aria-labelledby="ids-review-title"><span className="ids-eyebrow">확정 전 검토 / 아직 미집행</span><h2 id="ids-review-title" tabIndex={-1} ref={reviewRef}>{proposal.operation.name} 집행 확인</h2><p>{proposal.operation.region} · 제{proposal.week + 1}주 · 정치력과 정보망은 아래 승인 시 변경됩니다.</p><dl className="ids-review-comparison"><div><dt>정치력</dt><dd>{proposal.politicalPower} → {proposal.politicalPower - proposal.politicalCost}</dd><small>{proposal.politicalCost} 차감</small></div><div><dt>정보망</dt><dd>{proposal.intelNetwork} → {Math.min(100, proposal.intelNetwork + 4)}</dd><small>최대 +4 · 상한 100</small></div><div><dt>공작 상태</dt><dd>{proposal.operation.progress}% → 완료 100%</dd><small>확정 즉시 · 별도 대기 주차 없음</small></div></dl><p className={assessment.allowed ? 'ids-meta' : 'ids-warning'} role="status">{assessment.reason}</p><div className="ids-review-actions"><button type="button" onClick={props.onDiscard}>검토 취소</button><button type="button" className="ids-primary" disabled={!assessment.allowed} onClick={() => { if (assessment.allowed) props.onConfirm(); }}><Check size={18} />공작 집행 확정 · {proposal.politicalCost} 정치력</button></div></section> : null}
    </> : null}
    {selection.workspace === 'reports' ? <section className="ids-surface"><span className="ids-eyebrow">SAVED OPERATION STATUS</span><h2>공작 상태와 완료 표시</h2><p>진행 중인 개인 임무와 국가의 간단 공작을 구분합니다. 아래는 현재 국가 공작 저장 기록입니다.</p>{report ? <><label className="ids-select-label" htmlFor="ids-report-select">공작 기록 선택<select id="ids-report-select" value={report.id} onChange={(event) => onSelectionChange({ reportId: event.currentTarget.value })}>{operations.map((operation) => <option key={operation.id} value={operation.id}>{operation.name} · {operation.progress >= 100 ? '완료 표시' : '미완료 준비안'}</option>)}</select></label><article className="ids-report" data-report-id={report.id}><span className="ids-eyebrow">{report.progress >= 100 ? '현재 저장: 완료' : '현재 저장: 미완료'}</span><h3>{report.name}</h3><p>{report.region}</p><dl className="ids-metrics"><div><dt>저장 진행값</dt><dd>{report.progress}%</dd></div><div><dt>위험 참고값</dt><dd>{report.risk}%</dd><small>판정에 미반영</small></div></dl><p>{report.progress >= 100 ? '이 공작은 완료 표시가 있어 재집행할 수 없습니다.' : '준비안만 저장되어 있습니다. 자동으로 시간이 흐르거나 성과가 확정되지 않습니다.'}</p><div className="ids-record-limit"><FileText size={20} /><p>기존 공작 저장에는 완료 주차·실제 차감 영수증·실패 또는 손실 상세가 없습니다. 현재 수치로 과거 비용을 역산하지 않습니다. 새 집행 때는 기존 사건 기록에 결과가 한 번 남습니다.</p></div>{report.progress < 100 ? <button type="button" onClick={() => onSelectionChange({ workspace: 'planning', operationId: report.id })}>이 공작 검토<ArrowRight size={16} /></button> : null}</article></> : <p className="ids-empty">저장된 공작 기록이 없습니다.</p>}</section> : null}
    {selection.workspace === 'institutions' ? <>
      <section className="ids-surface"><span className="ids-eyebrow">INSTITUTIONAL LINEAGE / {institutions.year}</span><h2>{nation.shortName} 정보기관과 관련 인물</h2><p>기존 역사·세계선 계보를 참고합니다. 기관이나 인물을 읽는 것만으로 임명·영입·공작이 실행되지 않습니다.</p>{organization ? <><label className="ids-select-label" htmlFor="ids-organization-select">현재 활동 시기의 기관<select id="ids-organization-select" value={organization.id} onChange={(event) => onSelectionChange({ organizationId: event.currentTarget.value })}>{institutions.active.map((item) => <option value={item.id} key={item.id}>{item.abbreviation} · {item.displayName}</option>)}</select></label><article className="ids-organization" data-organization-id={organization.id}><span className="ids-eyebrow">{organization.appearanceYear}{organization.dissolvedYear ? '–' + organization.dissolvedYear : '–'} · {organization.abbreviation}</span><h3>{organization.displayName}</h3><p>{organization.doctrine}</p><p className="ids-ethical-risk">{organization.ethicalRisk}</p><details className="ids-disclosure"><summary>기존 사료·세계선 분기 근거</summary><p>{organization.historicalBasis}</p><p>{organization.variantTitle} · {organization.alternateEffect}</p><a href={organization.sourceUrl} target="_blank" rel="noreferrer">{organization.sourceLabel}</a></details><details className="ids-disclosure"><summary>현재 시기에 등장하는 사료상 관련 인물</summary><p className="ids-meta">사료상의 이름·직책입니다. 현재 영입 가능성, 실제 충성도 또는 이중간첩 판정이 아닙니다.</p>{organization.figures.filter((figure) => figure.activeFromYear <= institutions.year && figure.availableFromYear <= institutions.year).length ? organization.figures.filter((figure) => figure.activeFromYear <= institutions.year && figure.availableFromYear <= institutions.year).map((figure) => <article className="ids-historical-person" key={figure.id}><strong>{figure.name}</strong><span>{figure.office}</span></article>) : <p>현재 시기 조건으로 공개할 관련 인물이 없습니다.</p>}</details></article></> : <p className="ids-empty">현재 활동 시기에 해당하는 중앙 조직이 없습니다. 기존 저항·연락망과 향후 계보를 참고할 수 있습니다.</p>}
        <details className="ids-disclosure"><summary>전체 역사 계보 참고 · {institutions.relevant.length}개 분기</summary><p className="ids-meta">현재의 작전 실체가 아닌 기존 역사 카탈로그입니다. 아래 인물·기관의 등장이 현재 권한이나 임무 생성으로 확정되는 것은 아닙니다.</p><ul className="ids-lineage">{institutions.relevant.map((item) => <li key={item.id}><span>{item.appearanceYear}{item.dissolvedYear ? '–' + item.dissolvedYear : '–'}</span><strong>{item.displayName}</strong></li>)}</ul>{institutions.next ? <div className="ids-next-institution"><span className="ids-eyebrow">다음 계보 참고 · {institutions.next.appearanceYear}</span><h3>{institutions.next.displayName}</h3><p>{institutions.next.variantTitle}</p><small>{institutions.next.historicalBasis}</small></div> : null}</details>
      </section><section className="ids-surface"><PersonalCareerLink careerMarket={props.careerMarket} onOpenClandestineDesk={props.onOpenClandestineDesk} /></section>
    </> : null}
  </div>;
}
