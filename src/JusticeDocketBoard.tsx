import { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CheckCircle2,
  FileSearch,
  Gavel,
  Landmark,
  LockKeyhole,
  Newspaper,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import {
  canUseJusticeOption,
  getAvailableJusticeCaseTemplates,
  getJusticeDecisionOptions,
  getJusticeEvidenceTypeLabel,
  justiceJurisdictionLabels,
  justiceStageLabels,
  type JusticeCaseStage,
  type JusticeContext,
  type JusticeDecisionOptionId,
  type JusticeSystemState,
} from './justiceSystem';

interface JusticeDocketBoardProps {
  compact?: boolean;
  state: JusticeSystemState;
  context: JusticeContext;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onOpenCase: (templateId: string) => void;
  onDecision: (optionId: JusticeDecisionOptionId) => void;
}

const stageOrder: JusticeCaseStage[] = ['assessment', 'investigation', 'charging', 'pretrial', 'trial', 'appeal', 'closed'];

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <article className={danger ? 'warning' : ''}>
      <span>{label}</span><strong>{Math.round(value)}</strong>
      <i aria-label={`${label} ${Math.round(value)}%`}><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
    </article>
  );
}

export function JusticeDocketBoard({ compact = false, state, context, formatMoney, onOpenCase, onDecision }: JusticeDocketBoardProps) {
  const [selectedCaseId, setSelectedCaseId] = useState(state.activeCaseId ?? state.cases[0]?.id ?? '');
  const availableTemplates = useMemo(() => getAvailableJusticeCaseTemplates(context.year), [context.year]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(availableTemplates[0]?.id ?? '');
  const selectedCase = state.cases.find((item) => item.id === selectedCaseId)
    ?? state.cases.find((item) => item.id === state.activeCaseId)
    ?? state.cases[0]
    ?? null;
  const pendingCase = state.pendingDecision ? state.cases.find((item) => item.id === state.pendingDecision?.caseId) ?? null : null;
  const pendingOptions = getJusticeDecisionOptions(state.pendingDecision);
  const openCases = state.cases.filter((item) => item.stage !== 'closed');
  const selectedTemplate = availableTemplates.find((item) => item.id === selectedTemplateId) ?? availableTemplates[0] ?? null;
  const canOpen = Boolean(selectedTemplate && !state.pendingDecision && openCases.length < 6 && context.politicalPower >= 2);

  return (
    <section className={`nation-surface justice-docket-board ${compact ? 'compact' : ''}`}>
      <header>
        <div><span>사법·검찰·보도 사건 장부</span><h3>혐의가 판결과 제도 변화까지 이어지는 장기 사건 체계</h3></div>
        <small>{context.year}년 · 미결 {openCases.length}건 · 결재 {state.pendingDecision ? '대기' : '없음'}</small>
      </header>

      <div className="justice-principle-note">
        <Scale />
        <div><strong>사건은 실제 절차를 참고한 가상 복합 사건입니다</strong><p>실존 인물에 확인되지 않은 혐의를 붙이지 않습니다. 독립 수사, 피고인의 방어권, 증거 보전, 취재원·증인 보호와 공개재판이 서로 영향을 줍니다.</p></div>
      </div>

      <div className="justice-metric-grid">
        <Metric label="사법 독립" value={state.independence} danger={state.independence < 40} />
        <Metric label="기관 청렴" value={state.integrity} danger={state.integrity < 40} />
        <Metric label="절차 투명" value={state.transparency} danger={state.transparency < 38} />
        <Metric label="검사 안전" value={state.prosecutorSafety} danger={state.prosecutorSafety < 45} />
        <Metric label="취재원 보호" value={state.sourceProtection} danger={state.sourceProtection < 40} />
        <Metric label="무처벌 위험" value={state.impunity} danger={state.impunity >= 60} />
      </div>

      <div className="justice-pipeline" aria-label="사건 절차 단계">
        {stageOrder.map((stage) => {
          const count = state.cases.filter((item) => item.stage === stage).length;
          return <div key={stage} className={count ? 'active' : ''}><span>{justiceStageLabels[stage]}</span><strong>{count}</strong></div>;
        })}
      </div>

      {state.pendingDecision && pendingCase ? (
        <section className="justice-decision-room" aria-labelledby="justice-decision-title">
          <div className="justice-decision-heading">
            <ShieldAlert />
            <span><small>{justiceStageLabels[pendingCase.stage]} · 제{state.pendingDecision.deadlineWeek + 1}주까지</small><strong id="justice-decision-title">{state.pendingDecision.title}</strong><p>{pendingCase.title}</p></span>
            <b>{Math.max(0, state.pendingDecision.deadlineWeek - context.week)}주 남음</b>
          </div>
          <p>{state.pendingDecision.briefing}</p>
          <div className="justice-danger-note"><LockKeyhole /><span><strong>방치 위험</strong>{state.pendingDecision.danger}</span></div>
          <div className="justice-option-grid">
            {pendingOptions.map((option) => {
              const eligibility = canUseJusticeOption(option, context);
              return (
                <button type="button" key={option.id} className={option.tone} disabled={!eligibility.allowed} onClick={() => onDecision(option.id)} title={eligibility.reason}>
                  <span>{option.tone === 'bad' ? <ShieldAlert /> : option.id.includes('bribe') || option.id.includes('arrangement') ? <BadgeDollarSign /> : <Gavel />}{option.approach}</span>
                  <strong>{option.name}</strong>
                  <p>{option.forecast}</p>
                  <small>정치력 {option.politicalCost} · {formatMoney(option.treasuryCost)} · {eligibility.allowed ? '결재 가능' : eligibility.reason}</small>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="justice-workspace">
        <aside className="justice-case-list" aria-label="사건 목록">
          <div><strong>사건 파일</strong><small>최근·미결 우선</small></div>
          {[...state.cases].sort((left, right) => Number(left.stage === 'closed') - Number(right.stage === 'closed') || right.openedWeek - left.openedWeek).map((item) => (
            <button type="button" key={item.id} className={`${item.id === selectedCase?.id ? 'active' : ''} ${item.id === state.pendingDecision?.caseId ? 'decision' : ''}`} aria-pressed={item.id === selectedCase?.id} onClick={() => setSelectedCaseId(item.id)}>
              <span>{item.category === 'press-freedom' || item.category === 'journalist-attack' ? <Newspaper /> : item.category.includes('bribery') || item.category === 'political-finance' ? <BadgeDollarSign /> : <FileSearch />}<b>{justiceStageLabels[item.stage]}</b></span>
              <strong>{item.title}</strong>
              <small>증거 {Math.round(item.evidenceStrength)} · 관심 {Math.round(item.mediaAttention)} · 제{item.openedWeek + 1}주 개시</small>
            </button>
          ))}
        </aside>

        {selectedCase ? (
          <article className="justice-case-file">
            <div className="justice-case-title">
              <span><small>{justiceStageLabels[selectedCase.stage]} · {justiceJurisdictionLabels[selectedCase.jurisdiction]}</small><h4>{selectedCase.title}</h4><p>{selectedCase.allegation}</p></span>
              <b className={selectedCase.severity >= 75 ? 'danger' : ''}>중대도 {selectedCase.severity}</b>
            </div>
            <div className="justice-actor-grid">
              <div><UserRound /><span><small>피의·피고 측</small><strong>{selectedCase.suspect}</strong><em>{selectedCase.office} · 권력 {selectedCase.accusedPower}</em></span></div>
              <div><ShieldCheck /><span><small>수사 책임</small><strong>{selectedCase.prosecutor}</strong><em>안전 {Math.round(selectedCase.prosecutorSafety)}</em></span></div>
              <div><Landmark /><span><small>판단 기관</small><strong>{selectedCase.judge}</strong><em>{justiceJurisdictionLabels[selectedCase.jurisdiction]}</em></span></div>
              <div><Newspaper /><span><small>보도·감시</small><strong>{selectedCase.reporter}</strong><em>관심 {Math.round(selectedCase.mediaAttention)}</em></span></div>
            </div>
            <div className="justice-case-metrics">
              <Metric label="종합 증거력" value={selectedCase.evidenceStrength} danger={selectedCase.evidenceStrength < 42} />
              <Metric label="증거 보전" value={selectedCase.chainOfCustody} danger={selectedCase.chainOfCustody < 45} />
              <Metric label="증인 안전" value={selectedCase.witnessSafety} danger={selectedCase.witnessSafety < 45} />
              <Metric label="절차 신뢰" value={selectedCase.publicConfidence} danger={selectedCase.publicConfidence < 40} />
            </div>
            <div className="justice-evidence-ledger">
              <div><strong>증거 목록</strong><small>신뢰도와 보관 연속성을 따로 판정</small></div>
              {selectedCase.evidence.map((evidence) => (
                <article key={evidence.id}>
                  <span>{evidence.type === 'financial' ? <BadgeDollarSign /> : evidence.type === 'press' ? <Newspaper /> : <FileSearch />}<b>{getJusticeEvidenceTypeLabel(evidence.type)}</b></span>
                  <div><strong>{evidence.title}</strong><small>{evidence.detail}</small></div>
                  <em>신뢰 {Math.round(evidence.reliability)} · 보전 {Math.round(evidence.custody)}{evidence.public ? ' · 공개' : ' · 비공개'}</em>
                </article>
              ))}
            </div>
            <div className="justice-procedure-timeline">
              {stageOrder.map((stage, index) => {
                const currentIndex = stageOrder.indexOf(selectedCase.stage);
                return <span key={stage} className={index < currentIndex ? 'done' : index === currentIndex ? 'current' : ''}>{index < currentIndex ? <CheckCircle2 /> : <i />}{justiceStageLabels[stage]}</span>;
              })}
            </div>
            {selectedCase.outcome ? <div className="justice-outcome"><Gavel /><span><strong>{selectedCase.outcome}</strong><p>{selectedCase.sentence}</p></span></div> : <p className="justice-next-review">다음 절차 검토: 제{selectedCase.nextReviewWeek + 1}주 · 현재 단계는 한 주 만에 자동 종결되지 않습니다.</p>}
          </article>
        ) : null}
      </div>

      {!compact ? (
        <div className="justice-intake-planner">
          <div><FileSearch /><span><small>신규 수사안건</small><strong>감사·언론·내부고발 제보를 사건화</strong></span></div>
          <label>안건 선택<select value={selectedTemplate?.id ?? ''} onChange={(event) => setSelectedTemplateId(event.target.value)}>{availableTemplates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></label>
          {selectedTemplate ? <p><b>{selectedTemplate.office}</b> · {selectedTemplate.allegation}<small>{selectedTemplate.historicalBasis}</small></p> : null}
          <button type="button" disabled={!canOpen} onClick={() => selectedTemplate && onOpenCase(selectedTemplate.id)}>정치력 2 · 공식 사건철 개봉</button>
          <small>{state.pendingDecision ? '먼저 대기 중인 사법 결재를 처리하십시오.' : openCases.length >= 6 ? '미결 사건 6건 상한입니다. 기존 사건의 기소·종결을 진행하십시오.' : '사건화 뒤에는 관할과 수사 독립성부터 결정합니다.'}</small>
        </div>
      ) : null}

      {state.history.length ? <div className="justice-history-ledger"><h4>사법·검찰 사건 기록</h4>{state.history.slice(0, compact ? 4 : 8).map((record) => <article key={record.id} className={record.tone}><span><strong>{record.title}</strong><small>{record.detail}</small></span><b>제{record.week + 1}주</b></article>)}</div> : null}
    </section>
  );
}
