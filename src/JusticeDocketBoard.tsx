import { useCallback, useRef, useState, type Ref } from 'react';
import { ArrowRight, Check, FileSearch, Gavel, LockKeyhole, Scale, ShieldAlert } from 'lucide-react';
import { canUseJusticeOption, getAvailableJusticeCaseTemplates, getJusticeDecisionOptions, getJusticeEvidenceTypeLabel, justiceJurisdictionLabels, justiceStageLabels, openJusticeCase, resolveJusticeDecision, type JusticeActionResult, type JusticeCaseRecord, type JusticeContext, type JusticeDecisionOptionId, type JusticeEvidenceItem, type JusticeSystemState } from './justiceSystem';
import './JusticeDocketBoard.css';

export interface JusticeDocketBoardProps {
  compact?: boolean; state: JusticeSystemState; context: JusticeContext;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onOpenCase: (templateId: string) => void; onDecision: (optionId: JusticeDecisionOptionId) => void; busy?: boolean;
  publicConfidence?: number;
}
export type JusticeWorkspace = 'cases' | 'decision' | 'intake' | 'records';
export interface JusticeDeskSelection { workspace: JusticeWorkspace; caseId: string | null; templateId: string | null; optionId: JusticeDecisionOptionId | null; recordId: string | null }
export const initialJusticeDeskSelection: JusticeDeskSelection = { workspace: 'cases', caseId: null, templateId: null, optionId: null, recordId: null };
export type JusticeDeskCommand = { kind: 'open'; templateId: string } | { kind: 'decision'; optionId: JusticeDecisionOptionId };
export interface JusticeDeskReview { command: JusticeDeskCommand; fingerprint: string; caseId: string; pendingId: string | null; title: string; politicalCost: number; treasuryCost: number; result: JusticeActionResult; previewLines: string[] }
const workspaceLabels: Record<JusticeWorkspace, string> = { cases: '사건 목록', decision: '현재 결재', intake: '신규 제보', records: '기록' };
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const number = (value: number) => Number(value.toFixed(2)).toLocaleString('ko-KR');
export const justiceDeskFingerprint = (p: JusticeDocketBoardProps) => JSON.stringify([p.state, p.context, Boolean(p.busy), p.publicConfidence]);
export function resolveJusticeDeskCase(state: JusticeSystemState, id: string | null): JusticeCaseRecord | null {
  return state.cases.find((item) => item.id === (id ?? state.activeCaseId ?? state.cases[0]?.id)) ?? null;
}
export function reviewJusticeDeskCommand(p: JusticeDocketBoardProps, command: JusticeDeskCommand, selectedCaseId: string | null): { review: JusticeDeskReview | null; reason: string } {
  const blocked = (reason: string) => ({ review: null, reason }); const { state, context } = p;
  if (p.busy) return blocked('기간 진행 중입니다. 정산이 멈춘 뒤 최신 조건으로 검토하십시오.');
  if (state.nationId !== context.nationId || context.role.nationId !== context.nationId) return blocked('사건 장부와 현재 국가·보직의 소속이 다릅니다.');
  if (!Number.isInteger(context.week) || context.week < 0 || !Number.isFinite(context.year) || !Number.isInteger(context.role.tier) || context.role.tier < 1 || context.role.tier > 5) return blocked('주차·시대·보직 기록을 확인할 수 없습니다.');
  if ([context.politicalPower, context.treasury, context.stability, context.intelNetwork, context.legitimacy, context.unrest, context.institutionalCapacity].some((value) => !Number.isFinite(value))) return blocked('현재 자원·제도 지표가 유효하지 않습니다.');
  if (command.kind === 'open') {
    const template = getAvailableJusticeCaseTemplates(context.year).find((item) => item.id === command.templateId);
    if (!template) return blocked('현재 시대에 접수할 수 없는 제보입니다.');
    if (state.pendingDecision) return blocked('기존 사건의 대기 결재를 먼저 처리하십시오.');
    if (state.cases.filter((item) => item.stage !== 'closed').length >= 6) return blocked('미결 사건 6건 상한입니다. 기존 절차를 먼저 진행하십시오.');
    if (context.politicalPower < 2) return blocked('신규 사건 접수에는 정치력 2가 필요합니다.');
    const result = openJusticeCase(state, template.id, context);
    if (!result || !result.state.pendingDecision) return blocked('현재 조건으로 사건을 접수할 수 없습니다.');
    const review: JusticeDeskReview = { command: { ...command }, fingerprint: justiceDeskFingerprint(p), caseId: result.state.pendingDecision.caseId, pendingId: null, title: template.title, politicalCost: 2, treasuryCost: 0, result, previewLines: [] };
    review.previewLines = getJusticePreviewLines(review, p);
    return { review, reason: '검토만으로 사건을 접수하거나 비용을 사용하지 않습니다.' };
  }
  const pending = state.pendingDecision;
  if (!pending) return blocked('현재 대기 중인 결재가 없습니다.');
  if (selectedCaseId !== pending.caseId) return blocked('선택 사건과 결재 대상이 다릅니다. 결재 사건으로 이동한 뒤 검토하십시오.');
  const matching = state.cases.filter((item) => item.id === pending.caseId);
  if (matching.length !== 1 || matching[0].stage === 'closed') return blocked('결재 대상의 고유 미결 사건을 확인할 수 없습니다.');
  if (!Number.isFinite(pending.openedWeek) || pending.openedWeek > context.week || matching[0].openedWeek > context.week) return blocked('아직 도달하지 않은 시점의 결재 기록입니다.');
  const option = getJusticeDecisionOptions(pending).find((item) => item?.id === command.optionId);
  if (!option) return blocked('현재 결재에 포함되지 않은 처리안입니다.');
  const eligibility = canUseJusticeOption(option, context);
  if (!eligibility.allowed) return blocked(eligibility.reason);
  const result = resolveJusticeDecision(state, option.id, context);
  if (!result) return blocked('현재 사건·권한·비용 조건으로 결재할 수 없습니다.');
  const review: JusticeDeskReview = { command: { ...command }, fingerprint: justiceDeskFingerprint(p), caseId: pending.caseId, pendingId: pending.id, title: option.name, politicalCost: option.politicalCost, treasuryCost: option.treasuryCost, result, previewLines: [] };
  review.previewLines = getJusticePreviewLines(review, p);
  return { review, reason: '검토만으로 결재하거나 비용을 사용하지 않습니다.' };
}
export function assessJusticeDeskReview(review: JusticeDeskReview | null, p: JusticeDocketBoardProps, selectedCaseId: string | null) {
  if (!review) return { allowed: false, reason: '처리안을 선택하고 검토하십시오.' };
  if (review.fingerprint !== justiceDeskFingerprint(p)) return { allowed: false, reason: '검토 후 주차·사건·권한 또는 자원이 바뀌었습니다. 다시 검토하십시오.' };
  if (review.command.kind === 'decision' && (review.pendingId !== p.state.pendingDecision?.id || review.caseId !== p.state.pendingDecision.caseId || review.caseId !== selectedCaseId)) return { allowed: false, reason: '검토한 결재 대상과 현재 선택 사건이 다릅니다.' };
  const current = reviewJusticeDeskCommand(p, review.command, selectedCaseId);
  return { allowed: Boolean(current.review), reason: current.reason };
}
export function createJusticeDeskController() {
  const dispatched = new Set<string>();
  return (review: JusticeDeskReview | null, p: JusticeDocketBoardProps, selectedCaseId: string | null) => {
    const assessment = assessJusticeDeskReview(review, p, selectedCaseId);
    if (!review || !assessment.allowed) return { accepted: false, reason: assessment.reason };
    // A second different option for the same pending decision must not dispatch before React updates.
    const key = review.command.kind === 'decision' ? JSON.stringify([p.context.nationId, review.pendingId]) : `open:${review.fingerprint}`;
    if (dispatched.has(key)) return { accepted: false, reason: '이미 전달한 결재입니다. 실제 사건 기록이 갱신됐는지 확인하십시오.' };
    dispatched.add(key);
    if (review.command.kind === 'open') p.onOpenCase(review.command.templateId); else p.onDecision(review.command.optionId);
    return { accepted: true, reason: '명령을 한 번 전달했습니다. 갱신된 사건 상태와 기록을 확인하십시오.' };
  };
}
export function getJusticePreviewLines(review: JusticeDeskReview, p: JusticeDocketBoardProps): string[] {
  const { state, context } = p; const result = review.result; const lines: string[] = [];
  const add = (label: string, before: number, after: number) => { if (before !== after) lines.push(`${label} ${number(before)} → ${number(after)}`); };
  add('정치력 순변화', context.politicalPower, Math.max(0, context.politicalPower + result.politicalPowerDelta));
  if (result.treasuryDelta) lines.push(`국고 순변화 ${p.formatMoney(context.treasury, { exact: true })} → ${p.formatMoney(Math.max(0, context.treasury + result.treasuryDelta), { exact: true })}`);
  const institutions = { independence: '사법 독립', integrity: '기관 청렴', transparency: '절차 투명', prosecutorSafety: '검사 안전', sourceProtection: '취재원 보호', corruptionPressure: '부패 압력', impunity: '무처벌 위험' };
  for (const key of Object.keys(institutions) as (keyof typeof institutions)[]) add(institutions[key], state[key], result.state[key]);
  add('정통성', context.legitimacy, clamp(context.legitimacy + result.legitimacyDelta));
  add('사회 불안', context.unrest, clamp(context.unrest + result.unrestDelta));
  add('제도 역량', context.institutionalCapacity, clamp(context.institutionalCapacity + result.institutionalCapacityDelta));
  add('안정도', context.stability, clamp(context.stability + result.stabilityDelta));
  if (result.publicConfidenceDelta) {
    if (typeof p.publicConfidence === 'number' && Number.isFinite(p.publicConfidence)) add('국민 신뢰', p.publicConfidence, clamp(p.publicConfidence + result.publicConfidenceDelta));
    else lines.push(`국민 신뢰 변화 요청 ${result.publicConfidenceDelta > 0 ? '+' : ''}${result.publicConfidenceDelta} · 현재 경제 신뢰값은 이 화면에 없어 적용 상한 별도`);
  }
  const before = state.cases.find((item) => item.id === review.caseId); const after = result.state.cases.find((item) => item.id === review.caseId);
  const caseMetrics = { evidenceStrength: '사건 증거력', chainOfCustody: '증거 보전', witnessSafety: '증인 안전', prosecutorSafety: '사건 검사 안전', mediaAttention: '언론 관심', publicConfidence: '사건 절차 신뢰' };
  if (before && after) for (const key of Object.keys(caseMetrics) as (keyof typeof caseMetrics)[]) add(caseMetrics[key], before[key], after[key]);
  return lines;
}

function focusHeading(node: HTMLHeadingElement) {
  node.focus({ preventScroll: true }); const viewport = node.ownerDocument.defaultView;
  node.scrollIntoView({ block: 'start', behavior: !viewport?.matchMedia || viewport.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
export function JusticeDocketBoard(p: JusticeDocketBoardProps) {
  const [selection, setSelection] = useState<JusticeDeskSelection>(() => ({ ...initialJusticeDeskSelection }));
  const [review, setReview] = useState<JusticeDeskReview | null>(null); const [notice, setNotice] = useState('');
  const controller = useRef<ReturnType<typeof createJusticeDeskController> | null>(null);
  if (!controller.current) controller.current = createJusticeDeskController();
  const requested = useRef<'workspace' | 'review' | null>(null); const workspaceHeading = useRef<HTMLHeadingElement | null>(null);
  const headingRef = useCallback((node: HTMLHeadingElement | null) => { workspaceHeading.current = node; if (node && requested.current === 'workspace') { requested.current = null; focusHeading(node); } }, [selection]);
  const reviewRef = useCallback((node: HTMLHeadingElement | null) => { if (node && requested.current === 'review') { requested.current = null; focusHeading(node); } }, [review]);
  const select = (patch: Partial<JusticeDeskSelection>) => { requested.current = 'workspace'; setSelection((current) => ({ ...current, ...patch })); setReview(null); setNotice(''); };
  const propose = (command: JusticeDeskCommand) => { const result = reviewJusticeDeskCommand(p, command, resolveJusticeDeskCase(p.state, selection.caseId)?.id ?? null); requested.current = result.review ? 'review' : null; setReview(result.review); setNotice(result.reason); };
  return <JusticeDocketView {...p} selection={selection} review={review} notice={notice} headingRef={headingRef} reviewRef={reviewRef} onSelectionChange={select} onReview={propose}
    onDiscard={() => { requested.current = null; setReview(null); setNotice('검토를 취소했습니다. 사건과 자원은 변경하지 않았습니다.'); if (workspaceHeading.current) focusHeading(workspaceHeading.current); }}
    onConfirm={() => { const result = controller.current!(review, p, resolveJusticeDeskCase(p.state, selection.caseId)?.id ?? null); if (result.accepted) { requested.current = 'workspace'; setReview(null); setSelection((current) => review?.command.kind === 'open' ? { ...current, workspace: 'decision', caseId: null, optionId: null } : { ...current }); } setNotice(result.reason); }} />;
}
export interface JusticeDocketViewProps extends JusticeDocketBoardProps {
  selection: JusticeDeskSelection; review: JusticeDeskReview | null; notice?: string;
  onSelectionChange: (patch: Partial<JusticeDeskSelection>) => void; onReview: (command: JusticeDeskCommand) => void; onDiscard: () => void; onConfirm: () => void;
  headingRef?: Ref<HTMLHeadingElement>; reviewRef?: Ref<HTMLHeadingElement>;
}
function EvidenceRows({ evidence }: { evidence: JusticeEvidenceItem[] }) {
  return <div className="jd-evidence-list">{evidence.map((item) => <article key={item.id}><small>{getJusticeEvidenceTypeLabel(item.type)} · {item.public ? '공개 자료' : '비공개 수사자료'}</small><strong>{item.title}</strong><p>{item.detail}</p><span>신뢰 {Math.round(item.reliability)} · 보전 {Math.round(item.custody)} · 법정 채택·유죄 확정 아님</span></article>)}</div>;
}
function CaseDetails({ item, headingRef }: { item: JusticeCaseRecord; headingRef?: Ref<HTMLHeadingElement> }) {
  return <article className="jd-surface jd-case-detail" data-justice-case={item.id}>
    <small>{justiceStageLabels[item.stage]} · {justiceJurisdictionLabels[item.jurisdiction]}</small><h2 tabIndex={-1} ref={headingRef}>{item.title}</h2><p>{item.allegation}</p>
    <p className="jd-caution">의혹·기소·비공개 증거는 유죄 확정이 아닙니다. 아래 수치는 수사 절차의 게임 지표이며 유죄 확률이 아닙니다.</p>
    <dl className="jd-facts"><div><dt>피의·피고 측</dt><dd>{item.suspect}</dd><small>{item.office} · 권력 지표 {item.accusedPower}</small></div><div><dt>수사 책임</dt><dd>{item.prosecutor}</dd></div><div><dt>판단 기관</dt><dd>{item.judge}</dd></div><div><dt>보도·감시</dt><dd>{item.reporter}</dd></div></dl>
    <dl className="jd-metrics">{[['사건 증거력', item.evidenceStrength], ['증거 보전', item.chainOfCustody], ['증인 안전', item.witnessSafety], ['검사 안전', item.prosecutorSafety], ['절차 신뢰', item.publicConfidence], ['언론 관심', item.mediaAttention]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{Math.round(Number(value))}</dd></div>)}</dl>
    <div className="jd-status-line"><span>중대도 {item.severity} · 제{item.openedWeek + 1}주 접수</span><strong>{item.stage === 'closed' ? `종결 기록${item.closedWeek === null ? '' : ` · 제${item.closedWeek + 1}주`}` : `다음 절차 검토 · 제${item.nextReviewWeek + 1}주`}</strong></div>
    {item.outcome ? <div className="jd-outcome"><small>저장된 판단·처분 · 현재 절차 {justiceStageLabels[item.stage]}</small><strong>{item.outcome}</strong>{item.sentence ? <p>{item.sentence}</p> : null}{item.stage !== 'closed' ? <p>사건은 아직 종결되지 않았습니다. 항소·사후 절차를 확인하십시오.</p> : null}</div> : <p>아직 저장된 판단·처분이 없습니다. 증거 수치로 최종 판결을 만들어 표시하지 않습니다.</p>}
    <details className="jd-disclosure"><summary>증거 목록 · 공개 {item.evidence.filter((entry) => entry.public).length} / 비공개 {item.evidence.filter((entry) => !entry.public).length}</summary><p>비공개 표시는 내부 수사자료의 공개 상태입니다. 진실성이나 법정 채택이 확정됐다는 뜻이 아닙니다.</p><EvidenceRows evidence={item.evidence} /></details>
  </article>;
}
export function JusticeDocketView(p: JusticeDocketViewProps) {
  const { state, context, selection, review, onSelectionChange } = p;
  const selected = resolveJusticeDeskCase(state, selection.caseId);
  const cases = [...state.cases].sort((a, b) => Number(a.stage === 'closed') - Number(b.stage === 'closed') || b.openedWeek - a.openedWeek);
  const pending = state.pendingDecision; const pendingCase = pending ? state.cases.find((item) => item.id === pending.caseId) ?? null : null;
  const options = getJusticeDecisionOptions(pending).filter(Boolean); const option = options.find((item) => item.id === selection.optionId) ?? options[0] ?? null;
  const templates = getAvailableJusticeCaseTemplates(context.year); const template = templates.find((item) => item.id === selection.templateId) ?? (selection.templateId === null ? templates[0] : null);
  const record = state.history.find((item) => item.id === selection.recordId) ?? (selection.recordId === null ? state.history[0] : null);
  const assessment = assessJusticeDeskReview(review, p, selected?.id ?? null); const nextCase = review?.result.state.cases.find((item) => item.id === review.caseId);
  const command = selection.workspace === 'decision' && option ? { kind: 'decision' as const, optionId: option.id } : selection.workspace === 'intake' && template ? { kind: 'open' as const, templateId: template.id } : null;
  const eligibility = command ? reviewJusticeDeskCommand(p, command, selected?.id ?? null) : null;
  const goPending = () => onSelectionChange({ workspace: 'decision', caseId: pending?.caseId ?? null, optionId: null });
  return <section className="justice-command-desk command-edition" data-justice-workspace={selection.workspace} data-compact={Boolean(p.compact)} aria-label="사법 사건 업무공간">
    <header className="jd-heading"><div><small>JUSTICE DOCKET · {context.year}</small><h1>사법 사건실</h1><p>{context.role.title} · 제{context.week + 1}주</p></div><span className="jd-badge">미결 {state.cases.filter((item) => item.stage !== 'closed').length}/6 · 결재 {pending ? '대기' : '없음'}</span></header>
    <nav className="jd-workspaces" aria-label="사법 업무">{(Object.entries(workspaceLabels) as [JusticeWorkspace, string][]).map(([id, label]) => <button type="button" key={id} aria-pressed={selection.workspace === id} onClick={() => onSelectionChange({ workspace: id })}>{label}{id === 'decision' && pending ? <span aria-label="대기 결재 있음">1</span> : null}</button>)}</nav>
    {p.busy ? <p className="jd-caution">기간 진행 중 · 사건 열람은 가능하지만 확정은 정산 후에 가능합니다.</p> : null}{p.notice ? <p role="status" className="jd-notice">{p.notice}</p> : null}
    {review ? <section className="jd-review" aria-labelledby="jd-review-title"><small>결재 전 검토 · 아직 미집행</small><h2 id="jd-review-title" tabIndex={-1} ref={p.reviewRef}>{review.title}</h2><p>대상 사건: {nextCase?.title ?? review.caseId}</p><dl className="jd-metrics"><div><dt>집행에 필요한 정치력</dt><dd>{review.politicalCost}</dd></div><div><dt>집행에 필요한 국고</dt><dd>{p.formatMoney(review.treasuryCost, { exact: true })}</dd></div></dl><p>비용과 회수·보상을 함께 반영한 순변화는 아래와 같습니다. 검토는 무료이며 아직 기록이나 자원에 반영하지 않았습니다.</p><ul className="jd-preview-effects">{review.previewLines.map((line) => <li key={line}>{line}</li>)}</ul><p><strong>확인 시점:</strong> 결재 즉시 절차·지표 반영{nextCase ? ` · ${nextCase.stage === 'closed' ? '이 선택은 절차를 종결합니다. 유죄 확정을 뜻하지는 않습니다.' : `다음 절차 검토 제${nextCase.nextReviewWeek + 1}주 (${justiceStageLabels[nextCase.stage]})`}` : ''}</p><p>예상 처리 경로이며 미래의 판결·증언·새 증거를 확정 기록으로 제시하지 않습니다.</p>{!assessment.allowed ? <p role="alert">{assessment.reason}</p> : null}<div className="jd-actions"><button type="button" onClick={p.onDiscard}>검토 취소</button>{!assessment.allowed ? <button type="button" onClick={() => p.onReview(review.command)}>현재 조건으로 재검토</button> : null}<button type="button" className="jd-primary" disabled={!assessment.allowed} onClick={() => { if (assessment.allowed) p.onConfirm(); }}><Check size={18} />{review.command.kind === 'open' ? '사건 접수 확정' : '이 사건 결재 확정'}</button></div></section> : null}
    {selection.workspace === 'cases' ? <>
      {pending ? <section className="jd-priority"><ShieldAlert size={23} /><div><small>현재 결재 대상</small><strong>{pendingCase?.title ?? '대상 사건 확인 필요'}</strong><p>{pending.title} · {context.week > pending.deadlineWeek ? `기한 ${context.week - pending.deadlineWeek}주 경과` : `제${pending.deadlineWeek + 1}주까지`}</p></div><button type="button" onClick={goPending}>해당 사건 결재 보기<ArrowRight size={18} /></button></section> : <p className="jd-notice">대기 결재가 없습니다. 사건별 다음 절차 검토 시점이나 신규 제보를 확인하십시오.</p>}
      <div className="jd-layout"><aside className="jd-surface jd-case-picker"><h2>사건 파일</h2><label className="jd-mobile-picker">열람할 사건<select value={selected?.id ?? ''} onChange={(event) => onSelectionChange({ caseId: event.currentTarget.value })}><option value="" disabled>사건 선택</option>{cases.map((item) => <option value={item.id} key={item.id}>{justiceStageLabels[item.stage]} · {item.title}</option>)}</select></label><div className="jd-desktop-picker">{cases.map((item) => <button type="button" key={item.id} aria-pressed={selected?.id === item.id} onClick={() => onSelectionChange({ caseId: item.id })}><small>{justiceStageLabels[item.stage]}{pending?.caseId === item.id ? ' · 결재 대기' : ''}</small><strong>{item.title}</strong><span>제{item.openedWeek + 1}주 접수</span></button>)}</div>{!cases.length ? <p>접수된 사건이 없습니다.</p> : null}</aside>{selected ? <CaseDetails item={selected} headingRef={p.headingRef} /> : <section className="jd-surface"><h2 tabIndex={-1} ref={p.headingRef}>선택 사건을 확인할 수 없습니다</h2><p>현재 목록에서 사건을 다시 선택하십시오. 다른 사건에 결재를 자동 적용하지 않습니다.</p></section>}</div>
      <details className="jd-disclosure"><summary>사법기관 현황과 사건의 성격</summary><p>모든 사건은 기존 역사 자료를 일반화한 가상 복합 사건입니다. 실존 인물에게 확인되지 않은 혐의를 붙이지 않습니다.</p><dl className="jd-metrics">{[['사법 독립', state.independence], ['기관 청렴', state.integrity], ['절차 투명', state.transparency], ['검사 안전', state.prosecutorSafety], ['취재원 보호', state.sourceProtection], ['무처벌 위험', state.impunity]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{Math.round(Number(value))}</dd></div>)}</dl></details>
    </> : null}
    {selection.workspace === 'decision' ? <section className="jd-surface jd-decision" data-decision-case={pending?.caseId ?? ''}><small>현재 결재 · 다른 사건에 적용하지 않음</small><h2 tabIndex={-1} ref={p.headingRef}>{pending?.title ?? '현재 대기 결재가 없습니다'}</h2>{pending ? <><h3>{pendingCase?.title ?? '대상 사건이 없습니다'}</h3>{selected?.id !== pending.caseId ? <div className="jd-caution"><strong>선택 사건과 결재 대상이 다릅니다</strong><p>열람 중: {selected?.title ?? '선택 없음'} · 결재 대상: {pendingCase?.title ?? pending.caseId}</p><button type="button" onClick={goPending}>결재 대상 사건으로 이동<ArrowRight size={18} /></button></div> : pendingCase ? <><p>{pending.briefing}</p><p className="jd-caution">{pending.danger} · {context.week > pending.deadlineWeek ? `기한 ${context.week - pending.deadlineWeek}주 경과. 현재 결재는 가능하지만 주간 진행 때 안전·보전이 악화됩니다.` : `결재 기한 제${pending.deadlineWeek + 1}주`}</p><label>검토할 처리안<select value={option?.id ?? ''} onChange={(event) => onSelectionChange({ optionId: event.currentTarget.value as JusticeDecisionOptionId })}>{options.map((item) => <option key={item.id} value={item.id}>{item.name} · 정치력 {item.politicalCost}</option>)}</select></label>{option ? <article className="jd-option"><h3>{option.name}</h3><p>{option.approach}</p><p><small>정책 설명 · 현재 상태 계산은 검토에서 확인</small>{option.forecast}</p><p>필요 정치력 {option.politicalCost} · 국고 {p.formatMoney(option.treasuryCost, { exact: true })} · {option.minimumTier}급 이내</p><button type="button" className="jd-primary" disabled={!eligibility?.review} onClick={() => { if (eligibility?.review && command) p.onReview(command); }}><Scale size={18} />이 처리안 검토</button><p>{eligibility?.reason}</p></article> : <p>현재 결재의 처리안을 확인할 수 없습니다.</p>}<button type="button" onClick={() => onSelectionChange({ workspace: 'cases', caseId: pending.caseId })}>이 사건의 증거·절차 열람<ArrowRight size={18} /></button></> : <p role="alert">대상 사건을 찾을 수 없어 결재할 수 없습니다.</p>}</> : <><p>예상 결재나 미래 판결을 만들어 표시하지 않습니다. 현재 사건 상태와 다음 검토 시점을 확인하십시오.</p><button type="button" onClick={() => onSelectionChange({ workspace: 'cases' })}>사건 목록 보기</button></>}</section> : null}
    {selection.workspace === 'intake' ? <section className="jd-surface jd-intake"><small>새 사건 접수 · 현재 {context.year}년의 기존 사건 유형</small><h2 tabIndex={-1} ref={p.headingRef}>신규 제보 검토</h2><p>제보를 접수해도 혐의가 입증되는 것은 아닙니다. 사건화 뒤 관할과 수사 독립성을 별도로 결정합니다.</p><label>제보 선택<select value={template?.id ?? ''} disabled={!templates.length} onChange={(event) => onSelectionChange({ templateId: event.currentTarget.value })}><option value="" disabled>현재 시대의 제보 선택</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>{template ? <><h3>{template.title}</h3><small>{template.office} · 가상 복합 사건</small><p>{template.allegation}</p><p>접수 비용 정치력 2 · 이후 수사·공판 결재 비용은 별도입니다.</p><button type="button" className="jd-primary" disabled={!eligibility?.review} onClick={() => { if (eligibility?.review && command) p.onReview(command); }}><FileSearch size={18} />사건 접수안 검토</button><p>{eligibility?.reason}</p><details className="jd-disclosure"><summary>이 제보의 기존 역사적 구성 근거</summary><p>{template.historicalBasis}</p><p>{template.pressAngle}</p></details></> : <p>현재 시대에 선택할 수 없는 제보입니다. 목록에서 다시 선택하십시오.</p>}{pending ? <button type="button" onClick={goPending}>기존 대기 결재로 이동<ArrowRight size={18} /></button> : null}</section> : null}
    {selection.workspace === 'records' ? <section className="jd-surface jd-records"><small>저장된 기록 · 예상 처리안과 구분</small><h2 tabIndex={-1} ref={p.headingRef}>사법 처리 기록</h2><p>기존 장부에는 선택 내용과 사건 서술이 저장됩니다. 과거 실제 차감 영수증이 없는 항목은 현재 값으로 역산하지 않습니다.</p><label>기록 선택<select value={record?.id ?? ''} disabled={!state.history.length} onChange={(event) => onSelectionChange({ recordId: event.currentTarget.value })}><option value="" disabled>기록 선택</option>{state.history.map((item) => <option key={item.id} value={item.id}>제{item.week + 1}주 · {item.title}</option>)}</select></label>{record ? <article className="jd-record" data-justice-record={record.id}><small>제{record.week + 1}주 · {state.cases.find((item) => item.id === record.caseId)?.title ?? '이전 사건'}</small><h3>{record.title}</h3><p>{record.detail}</p><p>당시 기록의 서술이며 최종 유무죄는 사건 파일의 저장된 판단·현재 절차를 확인하십시오.</p>{state.cases.some((item) => item.id === record.caseId) ? <button type="button" onClick={() => onSelectionChange({ workspace: 'cases', caseId: record.caseId })}>연결된 사건 열기<ArrowRight size={18} /></button> : null}</article> : <p>선택한 저장 기록이 없습니다. 검토안을 완료 기록으로 채우지 않습니다.</p>}</section> : null}
    <footer className="jd-footer"><LockKeyhole size={16} /><span>열람·선택·검토는 무료입니다. 확정 버튼을 눌러야 기존 사법 절차에 전달됩니다.</span><Gavel size={16} /></footer>
  </section>;
}
