import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gavel,
  Landmark,
  Scale,
  ScrollText,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  canNominateJudicialOffice,
  constitutionAxisLabels,
  constitutionClauses,
  getConstitutionContradictions,
  getConstitutionDraftProgress,
  getVacantJudicialOffices,
  isJudicialOfficeConstitutionallyEnabled,
  judicialOffices,
  ratificationMethods,
  type ConstitutionAxis,
  type ConstitutionalContext,
  type ConstitutionalJudiciaryState,
  type JudicialOfficeId,
  type NominationDecisionId,
  type RatificationMethodId,
} from './constitutionalJudiciary';

interface ConstitutionalJudiciaryBoardProps {
  compact?: boolean;
  state: ConstitutionalJudiciaryState;
  context: ConstitutionalContext;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onActivate: () => void;
  onClauseSelect: (clauseId: string) => void;
  onRatify: (methodId: RatificationMethodId) => void;
  onNominate: (officeId: JudicialOfficeId, candidateId: string) => void;
  onNominationDecision: (decisionId: NominationDecisionId) => void;
}

const axes = Object.keys(constitutionAxisLabels) as ConstitutionAxis[];
const philosophyLabels = {
  'rights-oriented': '권리·적법절차',
  institutionalist: '법적 안정성',
  'security-oriented': '국가안보',
  'social-justice': '사회권·평등',
  'executive-loyalist': '행정 효율',
  'anti-corruption': '반부패·공직윤리',
};

function Meter({ value, danger = false }: { value: number; danger?: boolean }) {
  return <span className={`constitutional-meter ${danger ? 'danger' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

export function ConstitutionalJudiciaryBoard({
  compact = false,
  state,
  context,
  formatMoney,
  onActivate,
  onClauseSelect,
  onRatify,
  onNominate,
  onNominationDecision,
}: ConstitutionalJudiciaryBoardProps) {
  const [selectedAxis, setSelectedAxis] = useState<ConstitutionAxis>('government');
  const vacantOffices = useMemo(() => getVacantJudicialOffices(state, context.week), [context.week, state]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<JudicialOfficeId>(vacantOffices[0]?.id ?? 'supreme-chief');
  const selectedOffice = judicialOffices.find((office) => office.id === selectedOfficeId) ?? judicialOffices[0];
  const progress = getConstitutionDraftProgress(state);
  const contradictions = getConstitutionContradictions(state.draft);
  const nomination = state.activeNomination;
  const nominationCandidate = nomination ? state.candidates.find((candidate) => candidate.id === nomination.candidateId) : null;
  const nominationOffice = nomination ? judicialOffices.find((office) => office.id === nomination.officeId) : null;
  const constitutionReady = progress === axes.length;
  const canManageConstitution = context.role.tier === 1;

  return (
    <section className={`nation-surface constitutional-judiciary-board ${compact ? 'compact' : ''}`}>
      <header className="constitutional-board-header">
        <div><span>CONSTITUTION · BENCH · PROSECUTION</span><h3>헌정 창설과 사법 인사</h3><p>헌법의 권력구조가 이후 판사·검사 임명과 권력형 사건의 독립성을 결정합니다.</p></div>
        <div className={`constitutional-status ${state.status}`}><ScrollText size={18} /><span>{state.status === 'awaiting-authority' ? '제헌권 대기' : state.status === 'drafting' ? `초안 ${progress}/${axes.length}` : '헌법 시행 중'}</span></div>
      </header>

      <div className="constitutional-metrics" aria-label="헌정·사법 지표">
        <article><Scale /><span>법원 독립</span><strong>{Math.round(state.courtIndependence)}</strong><Meter value={state.courtIndependence} danger={state.courtIndependence < 40} /></article>
        <article><ShieldCheck /><span>검찰 자율</span><strong>{Math.round(state.prosecutorialAutonomy)}</strong><Meter value={state.prosecutorialAutonomy} danger={state.prosecutorialAutonomy < 40} /></article>
        <article><Gavel /><span>사법 역량</span><strong>{Math.round(state.judicialCapacity)}</strong><Meter value={state.judicialCapacity} danger={state.judicialCapacity < 40} /></article>
        <article><BookOpenCheck /><span>기본권 보호</span><strong>{Math.round(state.rightsProtection)}</strong><Meter value={state.rightsProtection} danger={state.rightsProtection < 35} /></article>
        <article><Landmark /><span>행정부 견제</span><strong>{Math.round(state.executiveConstraint)}</strong><Meter value={state.executiveConstraint} danger={state.executiveConstraint < 30} /></article>
      </div>

      {state.status === 'awaiting-authority' && (
        <div className={`constitutional-authority-gate ${canManageConstitution ? 'ready' : ''}`}>
          <div className="constitutional-seal"><Landmark size={28} /></div>
          <div>
            <span>{canManageConstitution ? '최고위 보직 도달' : '국가 제헌권 잠김'}</span>
            <h4>{canManageConstitution ? `${context.role.title}에게 제헌권이 도착했습니다` : '국가 최고위 보직에서만 헌법을 창설할 수 있습니다'}</h4>
            <p>{canManageConstitution ? '기존 국가를 그대로 복제하지 않고, 일곱 헌정 축을 조합해 새로운 기본법과 사법 인사규칙을 만드십시오.' : `현재 ${context.role.title} · ${context.role.tier}급입니다. 승진 전에는 담당 범위의 검찰 인사만 다룰 수 있습니다.`}</p>
          </div>
          {canManageConstitution && <button type="button" onClick={onActivate}><ScrollText size={17} /> 제헌회의 소집</button>}
        </div>
      )}

      {state.status === 'drafting' && (
        <div className="constitution-drafting-room">
          <div className="constitution-progress-rail">
            <div><span>헌법 초안 완성도</span><strong>{progress}/{axes.length}</strong><Meter value={(progress / axes.length) * 100} /></div>
            <nav aria-label="헌법 조항 분야">
              {axes.map((axis, index) => {
                const selected = state.draft[axis];
                return <button type="button" key={axis} className={`${selectedAxis === axis ? 'active' : ''} ${selected ? 'complete' : ''}`} onClick={() => setSelectedAxis(axis)}><b>{index + 1}</b><span><strong>{constitutionAxisLabels[axis].name}</strong><small>{selected ? constitutionClauses.find((clause) => clause.id === selected)?.name : '미결정'}</small></span>{selected ? <CheckCircle2 size={15} /> : <ChevronRight size={15} />}</button>;
              })}
            </nav>
          </div>

          <div className="constitution-clause-workspace">
            <header><span>제{axes.indexOf(selectedAxis) + 1}장 · {constitutionAxisLabels[selectedAxis].name}</span><h4>{constitutionAxisLabels[selectedAxis].question}</h4><p>선택은 비준 전까지 바꿀 수 있으며, 수정할 때마다 정치력 1을 사용합니다.</p></header>
            <div className="constitution-clause-grid">
              {constitutionClauses.filter((clause) => clause.axis === selectedAxis).map((clause) => {
                const active = state.draft[selectedAxis] === clause.id;
                return (
                  <button type="button" key={clause.id} className={active ? 'active' : ''} disabled={!canManageConstitution || gameCostUnavailable(context.politicalPower)} onClick={() => onClauseSelect(clause.id)}>
                    <span>{active ? <BadgeCheck size={16} /> : <ScrollText size={16} />}{clause.institution}</span>
                    <strong>{clause.name}</strong>
                    <p>{clause.summary}</p>
                    <dl><div><dt>강점</dt><dd>{clause.strength}</dd></div><div><dt>위험</dt><dd>{clause.risk}</dd></div></dl>
                    <small>법원 {signed(clause.independence)} · 권리 {signed(clause.rights)} · 행정부 {signed(clause.executive)} · 정통성 {signed(clause.legitimacy)}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {state.status === 'drafting' && (
        <div className="constitution-ratification-room">
          <header><div><span>FINAL RATIFICATION</span><h4>헌법 비준 방식</h4></div><strong>{constitutionReady ? '일곱 장 작성 완료' : `${axes.length - progress}개 장 미작성`}</strong></header>
          {contradictions.length > 0 && <div className="constitution-conflict-list"><AlertTriangle size={18} /><div><strong>조항 충돌 {contradictions.length}건</strong>{contradictions.map((warning) => <p key={warning}>{warning}</p>)}</div></div>}
          <div className="ratification-method-grid">
            {ratificationMethods.map((method) => {
              const incompatible = method.id === 'royal-assent' ? state.draft.government !== 'constitutional-crown' : method.id === 'party-congress' ? !['peoples-congress', 'council-directorate'].includes(state.draft.government ?? '') : false;
              const disabled = !constitutionReady || incompatible || context.role.tier !== 1 || context.politicalPower < method.politicalCost || context.treasury < method.treasuryCost;
              return <button type="button" key={method.id} disabled={disabled} onClick={() => onRatify(method.id)}><strong>{method.name}</strong><p>{method.detail}</p><small>정치력 {method.politicalCost} · {formatMoney(method.treasuryCost)} · 정통성 {signed(method.legitimacy)}</small><em>{incompatible ? '현재 권력구조와 양립 불가' : method.risk}</em></button>;
            })}
          </div>
        </div>
      )}

      {state.status === 'enacted' && state.enacted && (
        <div className="enacted-constitution-card">
          <div className="enacted-constitution-title"><div className="constitutional-seal"><ScrollText size={29} /></div><div><span>제{state.enacted.enactedWeek + 1}주 공포 · 지지 {state.enacted.publicSupport}/100</span><h4>{state.enacted.name}</h4><p>개헌 요건: {state.enacted.amendmentThreshold}</p></div></div>
          <div className="enacted-clause-grid">{axes.map((axis) => <article key={axis}><span>{constitutionAxisLabels[axis].name}</span><strong>{constitutionClauses.find((clause) => clause.id === state.enacted?.clauses[axis])?.name}</strong><small>{constitutionClauses.find((clause) => clause.id === state.enacted?.clauses[axis])?.institution}</small></article>)}</div>
          {state.enacted.contradictions.length > 0 && <div className="constitution-conflict-list"><AlertTriangle size={18} /><div><strong>미해결 헌정 긴장</strong>{state.enacted.contradictions.map((warning) => <p key={warning}>{warning}</p>)}</div></div>}
        </div>
      )}

      <div className="judicial-appointment-room">
        <header><div><span>JUDICIAL APPOINTMENTS</span><h4>판사·검사 임명실</h4><p>후보 한 명의 성향보다 검증 절차, 임기, 인준 지지도와 헌법상 임명방식이 함께 결과를 만듭니다.</p></div><small>현직 {state.appointments.length} · 공석 {vacantOffices.length}</small></header>

        {nomination && nominationCandidate && nominationOffice ? (
          <div className={`active-nomination-card ${nomination.stage}`}>
            <div className="nomination-process"><span className={nomination.stage === 'vetting' ? 'active' : 'done'}><b>1</b>신원·재산 검증</span><i /><span className={nomination.stage === 'hearing' ? 'active' : nomination.stage === 'confirmation' ? 'done' : ''}><b>2</b>공개 청문</span><i /><span className={nomination.stage === 'confirmation' ? 'active' : ''}><b>3</b>인준·임명</span></div>
            <div className="nomination-brief">
              <div><span>{nominationOffice.name} 후보</span><h5>{nominationCandidate.name}</h5><p>{nominationCandidate.profile}</p></div>
              <div className="nomination-score"><span>검증</span><strong>{nomination.vettingScore}</strong><span>청문 지지</span><strong>{nomination.hearingSupport}</strong></div>
            </div>
            <div className="nomination-concern"><AlertTriangle size={16} /><span><strong>핵심 검증 쟁점</strong>{nomination.concern}</span></div>
            {nomination.stage !== 'confirmation' ? <div className="nomination-wait"><Clock3 size={16} /> 제{nomination.nextReviewWeek + 1}주에 다음 단계 · 주간 진행 필요</div> : (
              <div className="nomination-actions">
                <button type="button" disabled={nomination.hearingSupport < 50} onClick={() => onNominationDecision('confirm')}><UserCheck size={16} /> 인준·임명</button>
                <button type="button" disabled={context.politicalPower < 3 || context.treasury < 4} onClick={() => onNominationDecision('return-vetting')}>보강검증 2주</button>
                <button type="button" onClick={() => onNominationDecision('withdraw')}>지명 철회</button>
                <button type="button" className="danger" disabled={context.role.tier !== 1 || context.politicalPower < 8} onClick={() => onNominationDecision('force-through')}>정치력 8 · 임명 강행</button>
              </div>
            )}
          </div>
        ) : (
          <div className="judicial-market-layout">
            <aside className="judicial-office-list" aria-label="사법 고위직 공석">
              {judicialOffices.map((office) => {
                const incumbent = state.appointments.find((appointment) => appointment.officeId === office.id && appointment.termEndWeek > context.week);
                const eligibility = canNominateJudicialOffice(office, context);
                const constitutionallyEnabled = isJudicialOfficeConstitutionallyEnabled(state, office.id);
                return <button type="button" key={office.id} className={selectedOfficeId === office.id ? 'active' : ''} onClick={() => setSelectedOfficeId(office.id)}><span>{office.branch === 'judge' ? <Gavel size={16} /> : <ShieldCheck size={16} />}<strong>{office.name}</strong></span><small>{!constitutionallyEnabled ? '헌법상 미설치 · 일반법원 분산심사' : incumbent ? `${incumbent.candidateName} · ${incumbent.termEndWeek - context.week}주 남음` : eligibility.allowed ? '공석 · 지명 가능' : `공석 · ${eligibility.reason}`}</small></button>;
              })}
            </aside>
            <div className="judicial-candidate-market">
              <div className="selected-office-brief"><div><span>{selectedOffice.branch === 'judge' ? '법원' : '검찰'} · {selectedOffice.termWeeks}주 임기</span><h5>{selectedOffice.name}</h5><p>{selectedOffice.scope}</p></div><small>지명 비용: 정치력 {selectedOffice.politicalCost} · {formatMoney(selectedOffice.treasuryCost)}</small></div>
              {!isJudicialOfficeConstitutionallyEnabled(state, selectedOffice.id) ? (
                <div className="judicial-incumbent"><Landmark size={22} /><div><strong>현재 헌법에 이 기관이 없습니다</strong><p>독립 헌법재판소 조항을 채택한 세계에서만 헌법재판관을 별도로 임명합니다. 현재는 일반법원 또는 대표기관이 해당 기능을 담당합니다.</p></div></div>
              ) : state.appointments.some((appointment) => appointment.officeId === selectedOffice.id && appointment.termEndWeek > context.week) ? (
                <div className="judicial-incumbent"><BadgeCheck size={22} /><div><strong>현직 임기 진행 중</strong><p>임기 종료 뒤 후임 후보 지명이 열립니다. 정치적 이유만으로 중도 해임하는 기능은 헌법상 징계 절차와 함께 후속 사건으로 다뤄집니다.</p></div></div>
              ) : (
                <div className="judicial-candidate-grid">
                  {state.candidates.map((candidate) => {
                    const eligibility = canNominateJudicialOffice(selectedOffice, context);
                    return <article key={candidate.id} className={candidate.integrity < 60 ? 'warning' : ''}>
                      <header><div className="candidate-monogram">{candidate.name.slice(0, 1)}</div><div><span>{philosophyLabels[candidate.philosophy]}</span><h6>{candidate.name}</h6></div><em>가상 법조인</em></header>
                      <p>{candidate.profile}</p>
                      <div className="candidate-stat-row"><span>전문성 <b>{candidate.competence}</b></span><span>청렴 <b>{candidate.integrity}</b></span><span>독립 <b>{candidate.independence}</b></span><span>연정 <b>{candidate.coalitionSupport}</b></span></div>
                      <div className="candidate-disclosure"><AlertTriangle size={14} /> {candidate.disclosure}</div>
                      <button type="button" disabled={!eligibility.allowed} title={eligibility.reason} onClick={() => onNominate(selectedOffice.id, candidate.id)}><Users size={15} /> 검증·청문 개시</button>
                    </article>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!compact && state.history.length > 0 && <div className="constitutional-history"><h4>헌정·사법 인사 기록</h4>{state.history.slice(0, 8).map((record) => <article key={record.id} className={record.tone}><span><strong>{record.title}</strong><small>{record.detail}</small></span><b>제{record.week + 1}주</b></article>)}</div>}
    </section>
  );
}

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value}`;
}

function gameCostUnavailable(politicalPower: number) {
  return politicalPower < 1;
}
