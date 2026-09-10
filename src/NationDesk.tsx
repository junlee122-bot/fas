import { useCallback, useRef, useState, type Ref } from 'react';
import { ArrowRight, Check, FileText, Minus, Plus, RotateCcw } from 'lucide-react';
import { getActiveNationAgenda, getStructuralPressureLever, nationBudgetDefinitions, rebalanceNationBudget } from './nationManagement';
import type { CampaignPhase, NationBudgetDomain, NationManagementState } from './nationManagement';
import { getRoleTabMandates } from './roleMandate';
import type { CareerRole, GameState, NationProfile } from './types';
import type { EconomyState } from './economy';

export type NationDeskView = 'overview' | 'transition' | 'agenda' | 'strategy' | 'pressure' | 'simulation' | 'budget' | 'institutions' | 'constitution' | 'sovereign' | 'justice' | 'dynasty' | 'elections' | 'power' | 'saga' | 'socialist' | 'personal' | 'media' | 'continuity' | 'records';
export interface NationDeskSection { id: string; label: string; items: Array<{ id: NationDeskView; label: string }> }
export function getNationDeskSections(phase: CampaignPhase): NationDeskSection[] {
  const nation = phase === 'nation';
  return [
    { id: 'desk', label: '국정 데스크', items: [{ id: 'overview', label: '이번 주 국정' }] },
    ...(nation ? [
      { id: 'policy', label: '정책·발전', items: [{ id: 'agenda', label: '국가 의제' }, { id: 'strategy', label: '발전 노선' }, { id: 'pressure', label: '사회 갈등' }, { id: 'simulation', label: '국가 분석' }] },
      { id: 'finance', label: '재정·예산', items: [{ id: 'budget', label: '주간 재정과 배분' }, { id: 'records', label: '실제 국정 결산' }] },
    ] as NationDeskSection[] : [{ id: 'transition', label: '전후 전환', items: [{ id: 'transition', label: '전환 조건과 계승' }] } as NationDeskSection]),
    { id: 'institutions', label: '헌정·사법', items: [{ id: 'institutions', label: '제도 업무 일정' }, { id: 'constitution', label: '헌법과 임명' }, { id: 'sovereign', label: '주권 권한' }, { id: 'justice', label: '사법 사건' }, ...(nation ? [{ id: 'dynasty', label: '국가체제·왕실' }, { id: 'elections', label: '선거·국민투표' }] as NationDeskSection['items'] : [])] },
    { id: 'leadership', label: '권력·노선', items: [{ id: 'power', label: '정치 연합' }, { id: 'saga', label: '전략 서사' }, { id: 'socialist', label: '사회주의 전환' }] },
    { id: 'life', label: '삶·언론', items: [...(nation ? [{ id: 'personal', label: '개인·가족' }] as NationDeskSection['items'] : []), { id: 'media', label: '언론과 공개 대응' }] },
    ...(nation ? [{ id: 'continuity', label: '장기 계획', items: [{ id: 'continuity', label: '기간 진행·전략작전·국가계획' }] }] as NationDeskSection[] : []),
  ];
}
export function resolveNationDeskView(phase: CampaignPhase, requested: NationDeskView): NationDeskView {
  return getNationDeskSections(phase).some((section) => section.items.some((item) => item.id === requested)) ? requested : 'overview';
}
export function NationDeskNavigation({ phase, view, onChange }: { phase: CampaignPhase; view: NationDeskView; onChange: (view: NationDeskView) => void }) {
  const sections = getNationDeskSections(phase);
  const current = sections.find((section) => section.items.some((item) => item.id === view)) ?? sections[0];
  return <nav className="nation-desk-navigation" aria-label="국정 분야">
    <div className="nation-desk-domains">{sections.map((section) => <button type="button" key={section.id} aria-pressed={section.id === current.id} onClick={() => onChange(section.items[0].id)}>{section.label}</button>)}</div>
    {current.items.length > 1 ? <div className="nation-desk-subnav" role="group" aria-label={current.label + ' 세부 업무'}>{current.items.map((item) => <button type="button" key={item.id} aria-pressed={view === item.id} onClick={() => onChange(item.id)}>{item.label}</button>)}</div> : null}
  </nav>;
}

interface OverviewProps {
  phase: CampaignPhase; state: NationManagementState; game: GameState; economy: EconomyState; nation: NationProfile;
  readiness: { score: number; eligible: boolean; threshold: number; transitionLabel: string; transitionDescription: string; blockedReasons: string[] };
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onViewChange: (view: NationDeskView) => void;
}
export function NationDeskOverview({ phase, state, game, economy, nation, readiness, formatMoney, onViewChange }: OverviewProps) {
  const war = phase === 'war';
  const agenda = getActiveNationAgenda(state);
  const driver = state.structuralPressure.drivers[0];
  const lever = driver ? getStructuralPressureLever(driver.id) : null;
  const title = war ? readiness.transitionLabel : agenda?.title ?? (lever?.action || '다음 주 예산과 국가 목표를 점검하십시오');
  const detail = war ? readiness.transitionDescription : agenda?.stakes ?? (driver ? driver.detail : '새 안건이 열리기 전에 현재 재정과 국민의 삶을 확인할 수 있습니다.');
  const destination: NationDeskView = war ? 'transition' : agenda ? 'agenda' : driver ? 'pressure' : 'budget';
  const report = state.reports[0];
  return <div className="nation-desk-overview" aria-label="이번 주 국정 요약">
    <div className="nation-desk-focus-grid"><section className="nation-desk-priority" aria-labelledby="nation-desk-priority-title">
      <span className="nation-desk-eyebrow">01 / 이번 주 정책 결정</span><h2 id="nation-desk-priority-title">{title}</h2><p>{detail}</p>
      <dl><div><dt>예상 영향</dt><dd>{war ? '국경·국고·부채·생산·인물·외교를 이어받는 전후 초기 조건' : agenda ? '선택지별 대표권·투자·중앙 집행의 효과와 부담을 비교' : lever?.expectedEffect ?? '배분 변화가 공공서비스·고용·재정에 반영'}</dd></div>
        <div><dt>검증 시점</dt><dd>{war ? '전환 승인 때 계승 확인 · 이후 주간 국정 결산' : agenda ? '의제 선택 직후 효과 확인 · 제' + (agenda.expiresWeek + 1) + '주까지 결론' : lever ? lever.verificationWeeks + '주 뒤 지표와 실제 결산 비교' : '다음 주 실제 국정 결산'}</dd></div></dl>
      <button type="button" onClick={() => onViewChange(destination)}>{war ? '전환 조건 검토' : agenda ? '정책 선택지 검토' : '대응 정책 검토'}<ArrowRight size={18} /></button>
      <small>이 버튼은 검토 화면만 엽니다. 열람으로 정책이 집행되거나 시간이 흐르지 않습니다.</small>
    </section>
    <section className="nation-desk-objectives"><span className="nation-desk-eyebrow">{war ? '02 / 전환 조건' : '02 / 운영 참고선'}</span><h2>{war ? '주권과 전후 기반' : '국민의 삶과 국가 성과'}</h2>
      {war ? <><div className="nation-desk-target"><strong>전환 준비도</strong><span>{readiness.score} / {readiness.threshold}</span></div><p>{readiness.eligible ? '전환 검토 조건 충족. 별도 승인 전까지 현재 전쟁은 계속됩니다.' : readiness.blockedReasons.join(' · ') || '국가 기반을 보강해야 합니다.'}</p></>
        : <div className="nation-desk-targets">{[
          ['국가 성과', state.nationalScore, '60 이상'], ['국민 위임', state.mandateScore, '50 이상'], ['사회 불안', state.unrest, '35 이하'], ['민수 산업', state.civilianIndustry, '65 이상'],
        ].map(([label, value, target]) => <div className="nation-desk-target" key={String(label)}><span>{label}<small>참고선 {target}</small></span><strong>{Math.round(Number(value))}</strong></div>)}</div>}
      {!war ? <p className="nation-desk-meta">네 지표는 운영 참고선입니다. 동시 달성만으로 승리·종결·보상이 확정되지 않으며, 선거와 도전과제는 각자의 실제 조건으로 판정됩니다.</p> : null}
      <p className="nation-desk-meta">{nation.shortName} · {war ? '현 전쟁 단계의 실제 조건' : '다음 국민 평가까지 ' + Math.max(0, state.nextElectionWeek - game.week) + '주'}</p>
    </section></div>
    <section className="nation-desk-current" aria-labelledby="nation-desk-current-title"><h2 id="nation-desk-current-title">이번 주 국정 상태</h2><div className="nation-desk-current-grid">
      <article><span>국고</span><strong>{formatMoney(game.treasury)}</strong><small>부채 {formatMoney(economy.debt)}</small></article>
      <article><span>물가</span><strong>{economy.inflation.toFixed(1)}%</strong><small>공공 신뢰 {Math.round(economy.publicConfidence)}</small></article>
      <article><span>{war ? '정치 기반' : '고용'}</span><strong>{Math.round(war ? game.stability : state.employment)}</strong><small>{war ? '현재 안정도' : '주거 지표 ' + Math.round(state.housing)}</small></article>
      <article><span>최근 국정 결산</span><strong>{report ? formatMoney(report.fiscalBalance, { signed: true }) : '첫 결산 전'}</strong><small>{report ? '제' + (report.week + 1) + '주 확정 수지' : '예측을 실제 결과로 표시하지 않습니다.'}</small></article>
    </div>{!war ? <button type="button" className="nation-desk-link" onClick={() => onViewChange('records')}><FileText size={16} /> 실제 원인과 결과 보기<ArrowRight size={16} /></button> : null}</section>
  </div>;
}

export interface NationBudgetProposal { nationId: string; roleId: string; week: number; baseBudget: NationManagementState['budget']; domain: NationBudgetDomain; delta: -5 | 5 }
export function createNationBudgetProposal(state: NationManagementState, nation: NationProfile, role: CareerRole, week: number, domain: NationBudgetDomain, delta: -5 | 5): NationBudgetProposal {
  return { nationId: nation.id, roleId: role.id, week, baseBudget: { ...state.budget }, domain, delta };
}
interface BudgetProps {
  state: NationManagementState; nation: NationProfile; role: CareerRole; week: number; phase: CampaignPhase;
  busy?: boolean; authorized?: boolean; onBudgetChange: (domain: NationBudgetDomain, delta: -5 | 5) => void;
}
export function assessNationBudgetProposal(proposal: NationBudgetProposal | null, input: Omit<BudgetProps, 'onBudgetChange'>) {
  const authorized = input.authorized ?? getRoleTabMandates(input.role).governance.mode === 'direct';
  const empty = { allowed: false, nextBudget: input.state.budget, reason: '부처별 ±5를 눌러 하나의 재배분안을 작성하십시오.' };
  if (!proposal) return empty;
  const reject = (reason: string) => ({ ...empty, reason });
  if (input.phase !== 'nation' || !authorized) return reject('현재 국가 예산의 직접 집행권이 없습니다.');
  if (input.busy) return reject('기간 진행 중입니다. 결산이 멈춘 뒤 다시 검토하십시오.');
  if (input.state.nationId !== input.nation.id || input.role.nationId !== input.nation.id) return reject('국가·국정 저장·보직의 소속이 일치하지 않습니다.');
  if (!Number.isInteger(input.week) || input.week < 0 || !Number.isInteger(proposal.week)) return reject('유효한 현재 주차가 필요합니다.');
  if (proposal.week !== input.week || proposal.nationId !== input.nation.id || proposal.roleId !== input.role.id) return reject('주차·국가·보직이 바뀌었습니다. 현재 조건으로 새 안을 작성하십시오.');
  const keys = nationBudgetDefinitions.map((item) => item.id);
  if (!keys.includes(proposal.domain) || ![-5, 5].includes(proposal.delta)) return reject('유효한 단일 재배분 명령이 아닙니다.');
  if (keys.some((key) => proposal.baseBudget[key] !== input.state.budget[key])) return reject('기존 예산이 바뀌었습니다. 현재 배분으로 새 안을 작성하십시오.');
  if (keys.some((key) => !Number.isFinite(proposal.baseBudget[key]) || proposal.baseBudget[key] < 5 || proposal.baseBudget[key] > 45) || keys.reduce((sum, key) => sum + proposal.baseBudget[key], 0) !== 100) return reject('현재 배분 합계는 100%이고 부처별 비중은 5~45% 범위여야 합니다.');
  const nextBudget = rebalanceNationBudget(input.state, proposal.domain, proposal.delta).budget;
  if (keys.some((key) => !Number.isFinite(nextBudget[key]) || nextBudget[key] < 5 || nextBudget[key] > 45) || keys.reduce((sum, key) => sum + nextBudget[key], 0) !== 100) return reject('이 안은 100% 배분 또는 부처별 한도를 벗어납니다.');
  if (nextBudget[proposal.domain] === proposal.baseBudget[proposal.domain]) return reject('현재 배분 한도로는 변경할 수 없습니다.');
  return { allowed: true, nextBudget, reason: '현재 주차·보직·기존 배분 확인 완료. 승인하면 한 번만 적용합니다.' };
}
export function focusNationBudgetElement(target: HTMLElement | null) {
  if (!target?.isConnected) return;
  target.focus({ preventScroll: true });
  const viewport = target.ownerDocument.defaultView;
  const reducedMotion = !viewport?.matchMedia || viewport.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' });
}
export function NationBudgetProposalView({ proposal, input, onApprove, onDiscard, headingRef }: { proposal: NationBudgetProposal; input: Omit<BudgetProps, 'onBudgetChange'>; onApprove: () => void; onDiscard: () => void; headingRef?: Ref<HTMLHeadingElement> }) {
  const assessment = assessNationBudgetProposal(proposal, input);
  return <section className="nation-budget-review" aria-labelledby="nation-budget-review-title"><span className="nation-desk-eyebrow">예산 재배분 초안 / 아직 미집행</span><h2 id="nation-budget-review-title" ref={headingRef} tabIndex={-1} aria-describedby="nation-budget-review-status">제{proposal.week + 1}주 예산 재배분안 검토</h2>
    <div className="nation-budget-comparison">{nationBudgetDefinitions.filter((item) => proposal.baseBudget[item.id] !== assessment.nextBudget[item.id]).map((item) => <div key={item.id}><span>{item.name}</span><strong>{proposal.baseBudget[item.id]}% → {assessment.nextBudget[item.id]}%</strong><small>{item.primaryEffect}에 영향 · 결과 보장 아님</small></div>)}</div>
    <p>배분 합계 {Object.values(assessment.nextBudget).reduce((sum, value) => sum + value, 0)}% · 새 비용을 별도 차감하지 않습니다. 정책 효과와 실제 비용은 다음 주 기존 국정 결산에서 확인합니다.</p>
    <p id="nation-budget-review-status" role="status">{assessment.reason}</p><div className="nation-budget-review-actions"><button type="button" onClick={onDiscard}><RotateCcw size={16} />초안 폐기</button><button type="button" disabled={!assessment.allowed} onClick={() => { if (assessment.allowed) onApprove(); }}><Check size={16} />재배분 승인</button></div>
  </section>;
}
export function NationBudgetEditor(input: BudgetProps) {
  const [proposal, setProposal] = useState<NationBudgetProposal | null>(null);
  const submitted = useRef(false);
  const editorHeading = useRef<HTMLHeadingElement | null>(null);
  const draftTrigger = useRef<HTMLButtonElement | null>(null);
  const reviewFocusRequested = useRef(false);
  // Commit the click-requested focus only after the new/replacement draft exists.
  // Unrelated state updates and repeated ref attachment must not steal focus.
  const focusReviewHeading = useCallback((heading: HTMLHeadingElement | null) => {
    if (!heading || !proposal || !reviewFocusRequested.current) return;
    reviewFocusRequested.current = false;
    focusNationBudgetElement(heading);
  }, [proposal]);
  const authorized = input.authorized ?? getRoleTabMandates(input.role).governance.mode === 'direct';
  const canDraft = input.phase === 'nation' && authorized && !input.busy;
  const propose = (domain: NationBudgetDomain, delta: -5 | 5, trigger: HTMLButtonElement) => {
    if (!canDraft) return;
    submitted.current = false;
    draftTrigger.current = trigger;
    reviewFocusRequested.current = true;
    setProposal(createNationBudgetProposal(input.state, input.nation, input.role, input.week, domain, delta));
  };
  const closeProposal = (approved: boolean) => {
    reviewFocusRequested.current = false;
    setProposal(null);
    const trigger = draftTrigger.current;
    // Approval can disable the original +5/-5 control at its new limit.
    focusNationBudgetElement(!approved && trigger?.isConnected && !trigger.disabled ? trigger : editorHeading.current);
    draftTrigger.current = null;
  };
  return <section className="nation-surface nation-budget-editor" aria-labelledby="nation-budget-editor-title"><header><div><span>내각 예산 검토</span><h2 id="nation-budget-editor-title" ref={editorHeading} tabIndex={-1}>배분을 비교한 뒤 명시적으로 승인합니다</h2></div><small>합계 100% · 단일 안건씩 적용</small></header>
    <p>±5는 초안만 만듭니다. 한 부처의 변경에 따라 다른 부처의 배분을 기존 규칙으로 자동 조정하며, 다른 ±5를 누르면 초안을 새 안으로 교체합니다.</p>
    {!authorized ? <p className="nation-desk-warning">현재 보직은 예산 배분을 열람만 할 수 있습니다.</p> : null}
    <div className="nation-budget-edit-grid">{nationBudgetDefinitions.map((item) => <article key={item.id}><span className="nation-desk-meta">{item.ministry}</span><h4>{item.name}</h4><p>{item.description}</p><small>{item.primaryEffect}</small><div>
      <button type="button" aria-label={item.name + ' 예산 5퍼센트포인트 감액안'} disabled={!canDraft || input.state.budget[item.id] <= 5} onClick={(event) => propose(item.id, -5, event.currentTarget)}><Minus size={17} /></button><strong>{input.state.budget[item.id]}%</strong><button type="button" aria-label={item.name + ' 예산 5퍼센트포인트 증액안'} disabled={!canDraft || input.state.budget[item.id] >= 45} onClick={(event) => propose(item.id, 5, event.currentTarget)}><Plus size={17} /></button>
    </div></article>)}</div>
    {proposal ? <NationBudgetProposalView proposal={proposal} input={input} headingRef={focusReviewHeading} onDiscard={() => closeProposal(false)} onApprove={() => {
      if (submitted.current || !assessNationBudgetProposal(proposal, input).allowed) return;
      submitted.current = true;
      input.onBudgetChange(proposal.domain, proposal.delta);
      closeProposal(true);
    }} /> : <p className="nation-desk-meta">확정된 현재 배분입니다. 작성·열람만으로 재고·국고·주차는 변하지 않습니다.</p>}
  </section>;
}
