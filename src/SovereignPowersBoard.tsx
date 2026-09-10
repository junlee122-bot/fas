import { useId, useRef, useState } from 'react';
import { BadgeCheck, BookOpenCheck, Castle, ChevronRight, Crown, Landmark, Scale, ScrollText, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getConstitutionClause } from './constitutionalJudiciary';
import { withJosa } from './koreanGrammar';
import {
  assessSovereignPower, deriveSovereignOfficeKind, exerciseSovereignPower,
  sovereignOfficeProfiles, sovereignPowerDefinitions, sovereignPowerGroupLabels, sovereignPowerStatusLabels,
  type SovereignPowerActionResult, type SovereignPowerAssessment, type SovereignPowerContext,
  type SovereignPowerGroup, type SovereignPowerId, type SovereignPowersState,
} from './sovereignPowers';
import './SovereignPowersBoard.css';

export interface SovereignPowersBoardProps {
  state: SovereignPowersState;
  context: SovereignPowerContext;
  compact?: boolean;
  busy?: boolean;
  indicators?: { justiceIntegrity: number; pressTrust: number };
  initialView?: 'exercise' | 'ledger';
  initialGroup?: SovereignPowerGroup;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onExercise: (powerId: SovereignPowerId, targetGrantId: string | null) => void;
}

export interface SovereignPreviewIndicator {
  key: string;
  label: string;
  before: number | null;
  after: number | null;
  delta: number;
  requestedDelta: number;
  tone: 'good' | 'bad' | 'neutral';
}

export interface SovereignReview {
  week: number;
  actorTitle: string;
  powerId: SovereignPowerId;
  targetGrantId: string | null;
  targetName: string | null;
  fingerprint: string;
  assessment: SovereignPowerAssessment;
  result: SovereignPowerActionResult;
  indicators: SovereignPreviewIndicator[];
}

const groups = Object.keys(sovereignPowerGroupLabels) as SovereignPowerGroup[];
const groupIcons = { legislation: ScrollText, executive: ShieldCheck, state: Landmark, estates: Castle };
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const rounded = (value: number) => Number(value.toFixed(2));
const signed = (value: number) => `${value > 0 ? '+' : ''}${rounded(value)}`;

export function sovereignReviewFingerprint(props: SovereignPowersBoardProps) {
  return JSON.stringify([props.state, props.context, props.indicators ?? null, Boolean(props.busy)]);
}

export function presentSovereignLegalBasis(assessment: SovereignPowerAssessment, context: SovereignPowerContext) {
  let text = assessment.legalBasis;
  for (const clauseId of Object.values(context.constitution.enacted?.clauses ?? {})) {
    const clause = getConstitutionClause(clauseId);
    if (clause) text = text.replace(withJosa(clauseId, '을/를'), withJosa(clause.name, '을/를'));
  }
  return text;
}

export function getSovereignPreviewIndicators(props: SovereignPowersBoardProps, result: SovereignPowerActionResult): SovereignPreviewIndicator[] {
  const { state: s, context: c } = props;
  const rows: SovereignPreviewIndicator[] = [];
  const add = (key: string, label: string, before: number | undefined, change: number, risk = false, after?: number) => {
    if (change === 0 && (after === undefined || after === before)) return;
    const next = before === undefined ? null : after ?? clamp(before + change);
    const delta = before === undefined || next === null ? change : rounded(next - before);
    rows.push({ key, label, before: before ?? null, after: next, delta, requestedDelta: change, tone: delta === 0 ? 'neutral' : (risk ? delta < 0 : delta > 0) ? 'good' : 'bad' });
  };
  add('politicalPower', '정치력', c.politicalPower, result.impact.politicalPower, false, Math.max(0, c.politicalPower + result.impact.politicalPower));
  add('treasury', '국고', c.treasury, result.impact.treasury, false, Math.max(0, c.treasury + result.impact.treasury));
  add('authorityCapital', '권한 자본', s.authorityCapital, result.state.authorityCapital - s.authorityCapital, false, result.state.authorityCapital);
  add('constitutionalConvention', '헌정 관례', s.constitutionalConvention, result.state.constitutionalConvention - s.constitutionalConvention, false, result.state.constitutionalConvention);
  add('stability', '안정도', c.stability, result.impact.stability);
  add('legitimacy', '정통성', c.legitimacy, result.impact.legitimacy);
  add('unrest', '사회 불안', c.unrest, result.impact.unrest, true);
  add('publicConfidence', '국민 신뢰', c.publicConfidence, result.impact.publicConfidence);
  add('justiceIndependence', '사법 독립', c.justiceIndependence, result.impact.justiceIndependence);
  add('courtIndependence', '헌법재판 독립', c.constitution.courtIndependence, result.impact.justiceIndependence);
  add('justiceIntegrity', '사법 청렴', props.indicators?.justiceIntegrity, result.impact.justiceIntegrity);
  add('mediaFreedom', '언론 자유', c.mediaFreedom, result.impact.mediaFreedom);
  add('pressTrust', '언론 신뢰', props.indicators?.pressTrust, result.impact.pressTrust);
  add('crownAuthority', '왕권', c.dynasty.crownAuthority, result.impact.crownAuthority);
  add('courtUnity', '궁정 결속', c.dynasty.courtUnity, result.impact.courtUnity);
  add('successionSecurity', '계승 안정', c.dynasty.successionSecurity, result.impact.successionSecurity);
  add('estateBurden', '영지 부담', c.dynasty.estateBurden, result.impact.estateBurden, true);
  add('parliamentaryConfidence', '의회 신임', s.parliamentaryConfidence, result.impact.parliamentaryConfidence, false, result.state.parliamentaryConfidence);
  add('militaryObedience', '군 복종', s.militaryObedience, result.impact.militaryObedience, false, result.state.militaryObedience);
  add('aristocraticLeverage', '귀족 독자 영향', s.aristocraticLeverage, result.impact.aristocraticLeverage, true, result.state.aristocraticLeverage);
  add('patronagePressure', '인사 후원 압력', s.patronagePressure, result.impact.patronagePressure, true, result.state.patronagePressure);
  return rows;
}

export function createSovereignReview(props: SovereignPowersBoardProps, powerId: SovereignPowerId, targetGrantId: string | null): { review: SovereignReview | null; reason: string } {
  if (props.busy) return { review: null, reason: '시간 진행 중에는 검토·승인을 할 수 없습니다. 진행을 멈춘 뒤 다시 검토하십시오.' };
  const definition = sovereignPowerDefinitions.find((item) => item.id === powerId);
  if (!definition) return { review: null, reason: '현재 목록에 없는 권한입니다. 권한을 다시 선택하십시오.' };
  const { context: c, state: s } = props;
  if ([s.nationId, c.role.nationId, c.constitution.nationId].some((nationId) => nationId !== c.nationId)) return { review: null, reason: '국가·보직·헌법·권한 장부가 일치하지 않습니다. 화면을 다시 열어 주십시오.' };
  if (c.formId !== c.dynasty.formId) return { review: null, reason: '현재 국가체제와 왕실·영지 장부의 체제가 일치하지 않습니다.' };
  if (!Number.isInteger(c.week) || c.week < 0) return { review: null, reason: '현재 주차가 유효하지 않아 안전하게 검토할 수 없습니다.' };
  if (!Number.isInteger(c.role.tier) || c.role.tier < 1 || c.role.tier > 5) return { review: null, reason: '현재 보직의 직급이 유효하지 않아 권한을 확인할 수 없습니다.' };
  const numeric = [c.week, c.politicalPower, c.treasury, c.stability, c.legitimacy, c.unrest, c.publicConfidence, c.justiceIndependence, c.mediaFreedom, c.constitution.courtIndependence, c.dynasty.crownAuthority, c.dynasty.courtUnity, c.dynasty.successionSecurity, c.dynasty.estateBurden, s.authorityCapital, s.constitutionalConvention, s.parliamentaryConfidence, s.militaryObedience, s.aristocraticLeverage, s.patronagePressure, ...(props.indicators ? Object.values(props.indicators) : [])];
  if (numeric.some((value) => !Number.isFinite(value))) return { review: null, reason: '현재 수치가 유효하지 않아 안전하게 검토할 수 없습니다.' };
  const target = targetGrantId ? c.dynasty.titleGrants.find((grant) => grant.id === targetGrantId) : null;
  if (definition.requiresNobleTarget && (!targetGrantId || !target)) return { review: null, reason: '행사 주체가 될 작위·영지 보유자를 직접 선택하십시오. 사라진 대상은 자동으로 바꾸지 않습니다.' };
  if (!definition.requiresNobleTarget && targetGrantId) return { review: null, reason: '이 권한은 특정 영지를 대상으로 행사하지 않습니다. 권한을 다시 검토하십시오.' };
  const assessment = assessSovereignPower(s, powerId, c, target);
  if (!assessment.allowed) return { review: null, reason: assessment.reason };
  const result = exerciseSovereignPower(s, powerId, c, target);
  if (!result) return { review: null, reason: '현재 헌법·보직의 행사 요건을 충족하지 못했습니다.' };
  return { review: { week: c.week, actorTitle: c.role.title, powerId, targetGrantId, targetName: target ? `${target.titleName} · ${target.recipientName} · ${target.domainName}` : null, fingerprint: sovereignReviewFingerprint(props), assessment, result, indicators: getSovereignPreviewIndicators(props, result) }, reason: '' };
}

export function confirmSovereignReview(review: SovereignReview, props: SovereignPowersBoardProps, gate: { current: string | null }, acknowledgeOverreach = false) {
  if (review.fingerprint !== sovereignReviewFingerprint(props)) return { accepted: false, message: '주차·보직·헌법·대상·수치가 바뀌었습니다. 최신 상태로 다시 검토하십시오.' };
  const checked = createSovereignReview(props, review.powerId, review.targetGrantId);
  if (!checked.review) return { accepted: false, message: checked.reason };
  if (checked.review.assessment.status === 'ultra-vires' && !acknowledgeOverreach) return { accepted: false, message: '월권에 따른 헌정 훼손과 부작용을 확인한 뒤에만 강행할 수 있습니다.' };
  if (gate.current === review.fingerprint) return { accepted: false, message: '현재 상태에서 권한 행사 승인을 이미 요청했습니다. 다른 안건도 실제 결과가 반영된 뒤 검토하십시오.' };
  gate.current = review.fingerprint;
  try {
    props.onExercise(review.powerId, review.targetGrantId);
  } catch {
    return { accepted: false, message: '승인 요청 전달 중 문제가 발생했습니다. 다시 지출하지 말고 실제 권한 장부와 잔액을 먼저 확인하십시오.' };
  }
  return { accepted: true, message: '권한 행사 승인 요청을 보냈습니다. 검증 장부에서 접수·검증 시점을 확인하십시오.' };
}

function IndicatorList({ rows, formatMoney }: { rows: SovereignPreviewIndicator[]; formatMoney: SovereignPowersBoardProps['formatMoney'] }) {
  const value = (row: SovereignPreviewIndicator, amount: number) => row.key === 'treasury' ? formatMoney(amount, { exact: true }) : rounded(amount);
  return <dl className="sovereign-desk-effects">{rows.map((row) => <div key={row.key} className={row.tone}>
    <dt>{row.label}</dt><dd>{row.before !== null && row.after !== null ? <><span>{value(row, row.before)}</span><ChevronRight size={13} aria-label="변경 후" /><strong>{value(row, row.after)}</strong></> : <strong>현재값 미연결</strong>}
      <small>{row.before === null ? '명목 변화 ' : '실제 변화 '}{row.key === 'treasury' ? formatMoney(row.delta, { signed: true, exact: true }) : signed(row.delta)}{Math.abs(row.delta - row.requestedDelta) > 0.001 ? ' · 상·하한 반영' : ''}</small>
    </dd>
  </div>)}</dl>;
}

export function SovereignPowersBoard(props: SovereignPowersBoardProps) {
  const { state, context, compact = false, busy = false, formatMoney } = props;
  const id = useId();
  const [view, setView] = useState(props.initialView ?? 'exercise');
  const [group, setGroup] = useState<SovereignPowerGroup>(props.initialGroup ?? 'legislation');
  const [powerId, setPowerId] = useState<SovereignPowerId>(() => sovereignPowerDefinitions.find((item) => item.group === (props.initialGroup ?? 'legislation'))!.id);
  const [grantId, setGrantId] = useState('');
  const [recordId, setRecordId] = useState(state.history[0]?.id ?? '');
  const [review, setReview] = useState<SovereignReview | null>(null);
  const [message, setMessage] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const gate = useRef<string | null>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const officeKind = deriveSovereignOfficeKind(context.formId, context.constitution);
  const profile = sovereignOfficeProfiles[officeKind];
  const definitions = sovereignPowerDefinitions.filter((item) => item.group === group);
  const selected = definitions.find((item) => item.id === powerId) ?? null;
  const target = context.dynasty.titleGrants.find((grant) => grant.id === grantId) ?? null;
  const assessment = selected ? assessSovereignPower(state, selected.id, context, selected.requiresNobleTarget ? target : null) : null;
  const readiness = selected ? createSovereignReview(props, selected.id, selected.requiresNobleTarget ? grantId || null : null) : null;
  const stale = Boolean(review && review.fingerprint !== sovereignReviewFingerprint(props));
  const activeRecord = state.history.find((record) => record.id === recordId) ?? state.history[0] ?? null;
  const clearReview = () => { setReview(null); setMessage(''); setAcknowledged(false); };
  const changeGroup = (next: SovereignPowerGroup) => { setGroup(next); setPowerId(sovereignPowerDefinitions.find((item) => item.group === next)!.id); clearReview(); };
  const inspect = () => {
    if (!selected) return;
    const next = createSovereignReview(props, selected.id, selected.requiresNobleTarget ? grantId || null : null);
    setReview(next.review); setMessage(next.reason); setAcknowledged(false);
    if (next.review) requestAnimationFrame(() => reviewRef.current?.focus());
  };
  const approve = () => {
    if (!review) return;
    const result = confirmSovereignReview(review, props, gate, acknowledged);
    setMessage(result.message);
    if (result.accepted) { setReview(null); setAcknowledged(false); }
  };
  return <section className={`nation-surface sovereign-powers-board sovereign-desk ${compact ? 'compact' : ''}`} aria-labelledby={`${id}-title`}>
    <header className="sovereign-desk-header">
      <div><span className="sovereign-desk-eyebrow">CONSTITUTION & OFFICE</span><h3 id={`${id}-title`}>직위·왕관·영지 권한</h3><p>{profile.name} · {context.role.title}</p></div>
      <span className="sovereign-desk-office"><Crown size={18} /><strong>{context.role.tier}급 보직</strong><small>각 행위의 헌법·관례를 개별 심사</small></span>
    </header>
    <div className="sovereign-desk-principle"><BookOpenCheck size={20} /><div><strong>{context.constitution.enacted?.name ?? '헌법 제정 전·관습 헌정'}</strong><p>{profile.caution} 보직이 높아도 모든 권한이 합법적인 것은 아닙니다.</p></div></div>
    <div className="sovereign-desk-metrics">{[
      ['권한 자본', state.authorityCapital], ['헌정 관례', state.constitutionalConvention], ['의회 신임', state.parliamentaryConfidence],
    ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{rounded(Number(value))}<small> / 100</small></strong></div>)}</div>
    {state.activeEmergency ? <aside className="sovereign-desk-warning"><ShieldAlert size={20} /><p><strong>비상사태 시행 중 · 제{state.activeEmergency.reviewWeek + 1}주 재심</strong><span>제{state.activeEmergency.declaredWeek + 1}주 선포 · 자동 연장 {state.activeEmergency.renewals}회. 종료하지 않으면 재심 기한부터 정통성·사법독립·언론자유가 매주 하락합니다.</span></p></aside> : null}
    <nav className="sovereign-desk-views" aria-label="권한 작업대"><button type="button" aria-pressed={view === 'exercise'} onClick={() => { setView('exercise'); clearReview(); }}><Scale size={17} />권한 행사</button><button type="button" aria-pressed={view === 'ledger'} onClick={() => { setView('ledger'); clearReview(); }}><ScrollText size={17} />검증 장부 <span>{state.history.filter((record) => !record.resolved).length}건 대기</span></button></nav>
    <p className="sovereign-desk-feedback" role="status">{message || (busy ? '시간 진행 중입니다. 현재 상태를 읽을 수 있지만 승인할 수 없습니다.' : '목록과 대상을 바꾸거나 검토하는 동안에는 자원을 사용하지 않습니다.')}</p>
    {view === 'exercise' ? <>
      <nav className="sovereign-desk-groups" aria-label="권한 분야">{groups.map((item) => { const Icon = groupIcons[item]; return <button type="button" key={item} aria-pressed={group === item} onClick={() => changeGroup(item)}><Icon size={17} /><span>{sovereignPowerGroupLabels[item].name}</span><small>{sovereignPowerDefinitions.filter((definition) => definition.group === item).length}</small></button>; })}</nav>
      <div className="sovereign-desk-workspace">
        <aside className="sovereign-desk-list" aria-label={`${sovereignPowerGroupLabels[group].name} 권한 목록`}><h4>01 · 행사할 권한</h4><p>{sovereignPowerGroupLabels[group].description}</p>{definitions.map((item) => {
          const current = assessSovereignPower(state, item.id, context, item.requiresNobleTarget ? target : null);
          return <button type="button" key={item.id} aria-pressed={selected?.id === item.id} onClick={() => { setPowerId(item.id); clearReview(); }}><strong>{item.name}</strong><small className={current.status === 'ultra-vires' || current.status === 'reserve' ? 'caution' : ''}>{current.statusLabel}</small></button>;
        })}</aside>
        <label className="sovereign-desk-mobile-select">01 · 행사할 권한<select value={selected?.id ?? ''} onChange={(event) => { setPowerId(event.target.value as SovereignPowerId); clearReview(); }}>{definitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        {selected && assessment ? <article className="sovereign-desk-detail" aria-labelledby={`${id}-power`}>
          <span className={`sovereign-desk-status ${assessment.status}`}>{assessment.statusLabel}</span><h4 id={`${id}-power`}>{selected.name}</h4><p>{selected.summary}</p>
          {selected.requiresNobleTarget ? <div className="sovereign-desk-target"><label htmlFor={`${id}-grant`}>02 · 행사 주체인 작위·영지 보유자</label><select id={`${id}-grant`} value={target?.id ?? ''} disabled={!context.dynasty.titleGrants.length} onChange={(event) => { setGrantId(event.target.value); clearReview(); }}><option value="">{context.dynasty.titleGrants.length ? '작위·영지를 직접 선택하십시오' : '서임된 작위·영지가 없습니다'}</option>{context.dynasty.titleGrants.map((grant) => <option key={grant.id} value={grant.id}>{grant.titleName} · {grant.recipientName} · {grant.domainName}</option>)}</select><p>{target ? `${target.domainName} · ${target.hereditary ? '세습' : '비세습'} · 서임 당시 충성 ${target.loyaltyAtGrant}` : '왕실 운영에서 서임한 대상을 사용합니다. 다른 영지로 자동 대체하지 않습니다.'}</p></div> : null}
          <div className="sovereign-desk-basis"><strong>권한의 근거와 절차</strong><p>{presentSovereignLegalBasis(assessment, context)}</p><p>{assessment.countersignature}</p><small>{selected.procedure.replaceAll('일모', '일몰')}</small></div>
          {assessment.status === 'ultra-vires' || assessment.status === 'reserve' ? <p className="sovereign-desk-danger"><ShieldAlert size={17} />{assessment.status === 'ultra-vires' ? '합법적 권한이 아닌 월권 강행입니다. 헌정 관례와 권리 지표의 즉시 훼손을 포함해 검토하십시오.' : '관례상 행사하지 않는 유보권입니다. 명문 권한과 달리 추가 정치 비용과 헌정 반발이 있습니다.'}</p> : null}
          <dl className="sovereign-desk-costs"><div><dt>권한 자본</dt><dd>{assessment.authorityCost} 사용</dd></div><div><dt>정치력</dt><dd>{assessment.politicalCost} 사용</dd></div><div><dt>국고</dt><dd>{formatMoney(-assessment.treasuryCost, { signed: true, exact: true })}</dd></div></dl>
          <p className="sovereign-desk-timing">행사 후 {assessment.verificationWeeks}주 뒤 반응 검증 · {assessment.cooldownRemaining ? `재행사까지 ${assessment.cooldownRemaining}주 남음` : `재행사 제한 ${selected.cooldownWeeks}주`}</p>
          <button type="button" className="sovereign-desk-primary" disabled={!readiness?.review} onClick={inspect}>비용·영향 검토<ChevronRight size={18} /></button>
          {!readiness?.review ? <p className="sovereign-desk-blocked">{readiness?.reason}</p> : null}
          <details className="sovereign-desk-source"><summary>역사적 근거와 현재 구현 범위</summary><p>{selected.historicalBasis}</p><p>{profile.source} · {profile.role}</p><p>이 작업대는 국가 지표·권한 관례·검증 기록에 영향을 줍니다. 법안 본문 작성, 실제 후보의 임명, 선거 실시, 새 작위 서임은 이 버튼만으로 자동 수행되지 않으며 해당 업무 화면에서 진행합니다.</p></details>
        </article> : <p>행사할 권한을 선택하십시오.</p>}
      </div>
      {review ? <section className={`sovereign-desk-review ${review.assessment.status}`} ref={reviewRef} tabIndex={-1} aria-labelledby={`${id}-review`}>
        <span className="sovereign-desk-eyebrow">REVIEW BEFORE SIGNING</span><h4 id={`${id}-review`}>{review.assessment.definition.name} · 승인 전 검토</h4><p>{review.targetName ? `행사 주체: ${review.targetName}` : `행사 주체: ${review.actorTitle} · ${review.assessment.statusLabel}`}</p>
        <p>지금 승인했을 때의 실제 전후값입니다. 상·하한을 적용했으며 후속 검증 결과는 보장하지 않습니다.</p>
        <IndicatorList rows={review.indicators} formatMoney={formatMoney} />
        <div className="sovereign-desk-timeline"><span><strong>검토 당시 · 제{review.week + 1}주</strong>승인 시 비용 사용·제도 지표 반영</span><span><strong>제{review.result.verificationWeek + 1}주</strong>의회·법원·언론·궁정 반응 검증</span><span><strong>제{review.week + review.assessment.definition.cooldownWeeks + 1}주 이후</strong>요건을 충족하면 재행사 가능</span></div>
        {review.powerId === 'declare-emergency' && review.result.state.activeEmergency ? <p className="sovereign-desk-danger">비상권 별도 재심: 제{review.result.state.activeEmergency.reviewWeek + 1}주. 재심이 비상사태를 자동 종료하지는 않습니다.</p> : null}
        {review.powerId === 'end-emergency' ? <p>비상상태를 해제합니다. 권한 자본은 사용 비용과 종료 보너스를 함께 반영한 순변화로 표시합니다.</p> : null}
        {review.assessment.status === 'ultra-vires' ? <label className="sovereign-desk-consent"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />합법적 권한이 아님을 확인했으며 헌정 훼손·권리 제한의 부작용을 감수하고 강행합니다.</label> : null}
        {stale ? <p role="alert" className="sovereign-desk-danger">검토 이후 상태가 바뀌었습니다. 이 안건은 승인할 수 없으므로 다시 검토하십시오.</p> : null}
        <div className="sovereign-desk-actions"><button type="button" onClick={clearReview}>검토 취소</button><button type="button" className="sovereign-desk-primary" disabled={stale || busy || (review.assessment.status === 'ultra-vires' && !acknowledged)} onClick={approve}>{review.assessment.status === 'ultra-vires' ? '월권 강행 확정' : '권한 행사 확정'}<ChevronRight size={18} /></button></div>
      </section> : null}
    </> : <section className="sovereign-desk-ledger" aria-label="권한 행사 검증 장부">
      <header><h4>행사한 뒤, 실제 반응까지</h4><p>최근 {state.history.length}건을 보관합니다. 대기 기록은 표시된 주차의 주간 진행에서 검증됩니다.</p></header>
      {activeRecord ? <><label>확인할 권한 행사<select value={activeRecord.id} onChange={(event) => setRecordId(event.target.value)}>{state.history.map((record) => <option key={record.id} value={record.id}>제{record.week + 1}주 · {record.title} · {record.resolved ? '검증 완료' : '검증 대기'}</option>)}</select></label><article className="sovereign-desk-record"><span className={`sovereign-desk-status ${activeRecord.status}`}>{sovereignPowerStatusLabels[activeRecord.status]}</span><h4>{activeRecord.title}</h4>{activeRecord.targetName ? <p>행사 주체: {activeRecord.targetName}</p> : null}<p>{activeRecord.detail}</p><div className="sovereign-desk-record-verdict">{activeRecord.resolved ? <BadgeCheck size={22} /> : <ShieldAlert size={22} />}<div><strong>{activeRecord.resolved ? '검증 완료' : `제${activeRecord.verificationWeek + 1}주 검증 대기`}</strong><p>{activeRecord.outcome ?? '승인은 접수됐지만 헌정적 효력과 후속 반응은 아직 확정되지 않았습니다.'}</p></div></div></article></> : <div className="sovereign-desk-empty"><ScrollText size={28} /><h4>아직 행사한 권한이 없습니다</h4><p>권한 행사에서 행위와 비용을 검토한 뒤 승인하면 접수 기록과 후속 검증 주차가 여기에 남습니다.</p><button type="button" onClick={() => setView('exercise')}>권한 검토로 이동</button></div>}
    </section>}
  </section>;
}
