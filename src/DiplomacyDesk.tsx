import { useId, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowRight, BookOpen, Check, Handshake, Search, ShieldCheck } from 'lucide-react';
import { getNation } from './campaign';
import { NationFlag } from './NationFlag';
import { getCampaignYearForWeek } from './campaignCalendar';
import { applyDiplomaticAgendaReward, calculateAgendaReadiness, getDiplomaticAgenda, getDiplomaticAgendaOutcome } from './diplomacy';
import { getNationArmsProfile, getPolicyEffectLabels, getStageDiplomaticPolicies, getStrategicDecisionId, getStrategicStage, type ArmsDiplomacyPolicy, type ArmsPortfolioState } from './strategicArmsDiplomacy';
import { diplomacyFeedbackPrecisionNote, formatDiplomacyFeedbackEffects, getArmsPolicyFeedback, getEmergencyStockpileFeedback, getSummitFeedback } from './diplomacyFeedback';
import type { DiplomaticRelation, GameState, GameTab, NationProfile } from './types';
import './DiplomacyDesk.css';

export interface DiplomacyDeskProps {
  game: GameState;
  relations: DiplomaticRelation[];
  setRelations: Dispatch<SetStateAction<DiplomaticRelation[]>>;
  setGame: Dispatch<SetStateAction<GameState>>;
  notify: (message: string) => void;
  nation: NationProfile;
  completedDecisions: string[];
  armsPortfolio: ArmsPortfolioState;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onDecision: (id: string, title: string, cost: number, effect: () => void) => void;
  onEnactArmsPolicy: (policy: ArmsDiplomacyPolicy) => void;
  onFundStockpile: () => void;
  onActionCompleted: (tab: GameTab, id: string, description: string) => void;
  onRecord?: (title: string, detail: string) => void;
  onOpenJournal?: () => void;
  busy?: boolean;
  authorized?: boolean;
}
export type DiplomacyOrder = { kind: 'influence'; id: string } | { kind: 'summit' } | { kind: 'policy'; id: string } | { kind: 'stockpile' };
export type DiplomacyView = 'relations' | 'summit' | 'policies' | 'records';
export interface DiplomacyReview { order: DiplomacyOrder; fingerprint: string; title: string; cost: number; treasuryDelta: number; effects: string[]; timing: string }
type ReviewInput = Pick<DiplomacyDeskProps, 'game' | 'relations' | 'nation' | 'completedDecisions' | 'armsPortfolio' | 'busy' | 'authorized' | 'formatMoney'>;
export const diplomacyFingerprint = (p: ReviewInput) => JSON.stringify([p.game, p.relations, p.nation.id, p.completedDecisions, p.armsPortfolio, Boolean(p.busy), p.authorized !== false]);

export function getSummitReadiness(p: ReviewInput) {
  const agenda = getDiplomaticAgenda(p.nation.id);
  const outcome = getDiplomaticAgendaOutcome(p.nation.id);
  const partner = getNation(agenda.partnerNationId);
  const relation = p.relations.find((r) => r.id === partner.id);
  const readiness = calculateAgendaReadiness(p.relations, p.game.politicalPower, partner.id);
  const weeks = Math.max(0, agenda.initialWeeksUntil - p.game.week);
  const decisionId = `diplomatic-agenda-${p.nation.id}`;
  const completed = p.completedDecisions.includes(decisionId);
  const gates = [
    { label: '개최 시점', value: weeks ? `${weeks}주 남음` : '도달', passed: weeks === 0 },
    { label: `${partner.shortName} 관계`, value: `${relation?.value ?? 0} / ${outcome.requiredRelation}`, passed: Boolean(relation && relation.value >= outcome.requiredRelation) },
    { label: '의제 준비도', value: `${readiness}% / ${outcome.requiredReadiness}%`, passed: readiness >= outcome.requiredReadiness },
    { label: '정치력', value: `${p.game.politicalPower} / ${outcome.cost}`, passed: p.game.politicalPower >= outcome.cost },
  ];
  return { agenda, outcome, partner, relation, readiness, weeks, completed, decisionId, gates };
}

export function reviewDiplomacyOrder(p: ReviewInput, order: DiplomacyOrder): { review: DiplomacyReview | null; reason: string } {
  const blocked = (reason: string) => ({ review: null, reason });
  if (p.authorized === false) return blocked('현재 보직에는 직접 결재 권한이 없습니다.');
  if (p.busy) return blocked('기간 진행이 끝난 뒤 현재 조건으로 검토하세요.');
  if (!Number.isFinite(p.game.politicalPower) || !Number.isFinite(p.game.treasury)) return blocked('현재 자원 정보를 확인할 수 없습니다.');
  let title = ''; let cost = 0; let treasuryDelta = 0; let effects: string[] = []; let timing = '';
  if (order.kind === 'influence') {
    const country = p.relations.find((r) => r.id === order.id);
    if (!country) return blocked('현재 관계 목록에 없는 국가입니다.');
    if (!Number.isFinite(country.value) || country.value < 0) return blocked('상대국 관계 정보를 다시 확인하세요.');
    if (country.value >= 100) return blocked('이미 관계가 최고 수준입니다.');
    title = `${country.name} 외교 접촉`; cost = 8;
    effects = [`관계 ${country.value} → ${Math.min(100, country.value + 7)}`, '관계 개선 자체가 동맹 체결이나 영토 변경을 뜻하지는 않습니다.'];
    timing = '승인 즉시 관계에 반영 · 회담 개최 조건에 누적';
  } else if (order.kind === 'summit') {
    const s = getSummitReadiness(p);
    if (s.completed) return blocked('이미 타결한 회담입니다.');
    const failed = s.gates.find((g) => !g.passed);
    if (failed) return blocked(`${failed.label} 보완 필요 · ${failed.value}`);
    title = s.agenda.title; cost = s.outcome.cost;
    const feedback = getSummitFeedback(p.game, p.relations, p.nation.id);
    treasuryDelta = feedback.game.treasury - p.game.treasury;
    effects = [...formatDiplomacyFeedbackEffects(feedback, p.formatMoney).map((item) => `${item.label} ${item.value}`), '이 회담은 캠페인당 한 번 타결합니다.', diplomacyFeedbackPrecisionNote];
    timing = '승인 즉시 회담 효과와 완료 기록 반영';
  } else if (order.kind === 'policy') {
    const stage = getStrategicStage(getCampaignYearForWeek(p.game.week));
    const policy = getStageDiplomaticPolicies(stage.id).find((item) => item.id === order.id);
    if (!policy) return blocked('현재 시대에 선택할 수 없는 정책입니다.');
    if (p.armsPortfolio.nationId !== p.nation.id) return blocked('현재 국가의 군비 기록을 다시 확인하세요.');
    if (p.completedDecisions.includes(getStrategicDecisionId(policy.id, policy.stageId))) return blocked('이미 시행한 정책입니다.');
    if (policy.effects.treasury < 0 && p.game.treasury < -policy.effects.treasury) return blocked('정책 집행에 필요한 국고가 부족합니다.');
    const feedback = getArmsPolicyFeedback(p.game, p.relations, p.armsPortfolio, policy);
    title = policy.title; cost = policy.politicalCost; treasuryDelta = feedback.game.treasury - p.game.treasury;
    effects = [...formatDiplomacyFeedbackEffects(feedback, p.formatMoney).map((item) => `${item.label} ${item.value}`), diplomacyFeedbackPrecisionNote];
    timing = `자원·관계·군비 지표는 즉시 반영 · ${policy.reviewYears}년 뒤 실제 성과 검증 (${getCampaignYearForWeek(p.game.week + policy.reviewYears * 52)}년)`;
  } else {
    if (p.armsPortfolio.nationId !== p.nation.id) return blocked('현재 국가의 비축 기록을 다시 확인하세요.');
    if (p.armsPortfolio.emergencyStockpile >= 90) return blocked('비축이 이미 안전 상한에 도달했습니다.');
    title = '90일 군수 공동비축'; cost = 4; treasuryDelta = -55;
    const feedback = getEmergencyStockpileFeedback(p.game, p.armsPortfolio);
    effects = [...formatDiplomacyFeedbackEffects(feedback, p.formatMoney).map((item) => `${item.label} ${item.value}`), '직도입·원조·비공식 조달에서 비축을 소모합니다.', diplomacyFeedbackPrecisionNote];
    timing = '승인 즉시 비축 반영 · 이후 조달과 제재 충격에서 활용';
  }
  if (p.game.politicalPower < cost) return blocked(`정치력 ${cost - p.game.politicalPower} 부족 · 필요 ${cost}`);
  if (p.game.treasury + treasuryDelta < 0) return blocked('정책 집행에 필요한 국고가 부족합니다.');
  return { review: { order: { ...order }, fingerprint: diplomacyFingerprint(p), title, cost, treasuryDelta, effects, timing }, reason: '검토만으로 비용이 지출되지 않습니다.' };
}

export function confirmDiplomacyOrder(review: DiplomacyReview, p: DiplomacyDeskProps, gate: { current: string | null }) {
  if (review.fingerprint !== diplomacyFingerprint(p)) return { accepted: false, message: '주차·자원·관계 또는 권한이 바뀌었습니다. 최신 조건으로 다시 검토하세요.' };
  const result = reviewDiplomacyOrder(p, review.order);
  if (!result.review) return { accepted: false, message: result.reason };
  const key = JSON.stringify([review.fingerprint, review.order]);
  if (gate.current === key) return { accepted: false, message: '이미 전달한 명령입니다. 최신 기록을 확인하세요.' };
  gate.current = key;
  const order = review.order;
  if (order.kind === 'influence') {
    const country = p.relations.find((r) => r.id === order.id)!;
    p.setGame((current) => ({ ...current, politicalPower: current.politicalPower - 8 }));
    p.setRelations((current) => current.map((r) => r.id === country.id ? { ...r, value: Math.min(100, r.value + 7) } : r));
    p.onRecord?.(`외교 접촉 — ${country.name}`, `정치력 8을 사용해 관계 ${country.value} → ${Math.min(100, country.value + 7)}. 동맹·영토는 변경하지 않았습니다.`);
    p.onActionCompleted('diplomacy', `diplomatic-influence:${country.id}`, `${country.name} 외교 접촉·관계 개선`);
  } else if (order.kind === 'summit') {
    const s = getSummitReadiness(p);
    p.onDecision(s.decisionId, s.agenda.title, s.outcome.cost, () => {
      p.setGame((current) => applyDiplomaticAgendaReward(current, s.outcome.reward));
      p.setRelations((current) => current.map((r) => r.id === s.partner.id ? { ...r, value: Math.min(100, r.value + s.outcome.relationGain) } : r));
    });
  } else if (order.kind === 'policy') {
    p.onEnactArmsPolicy(getStageDiplomaticPolicies(getStrategicStage(getCampaignYearForWeek(p.game.week)).id).find((policy) => policy.id === order.id)!);
  } else p.onFundStockpile();
  const message = `${review.title} 승인 요청을 전달했습니다. 반영된 수치와 기록을 확인하세요.`;
  p.notify(message);
  return { accepted: true, message };
}

export function DiplomacyDesk(p: DiplomacyDeskProps) {
  const [view, setView] = useState<DiplomacyView>('relations');
  const [query, setQuery] = useState('');
  const [countryId, setCountryId] = useState(p.relations[0]?.id ?? '');
  const [policyId, setPolicyId] = useState('');
  const [recordId, setRecordId] = useState('');
  const [review, setReview] = useState<DiplomacyReview | null>(null);
  const [message, setMessage] = useState('');
  const gate = useRef<string | null>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const selectId = useId();
  const year = getCampaignYearForWeek(p.game.week);
  const stage = getStrategicStage(year);
  const policies = getStageDiplomaticPolicies(stage.id);
  const policy = policies.find((item) => item.id === policyId) ?? policies[0];
  const countries = p.relations.filter((r) => `${r.name} ${r.status}`.toLowerCase().includes(query.trim().toLowerCase()));
  const country = countries.find((r) => r.id === countryId);
  const summit = getSummitReadiness(p);
  const summitEffects = formatDiplomacyFeedbackEffects(getSummitFeedback(p.game, p.relations, p.nation.id), p.formatMoney).filter((effect) => effect.label !== '정치력');
  const policyEffects = policy ? formatDiplomacyFeedbackEffects(getArmsPolicyFeedback(p.game, p.relations, p.armsPortfolio, policy), p.formatMoney).filter((effect) => effect.label !== '정치력') : [];
  const records = [...p.armsPortfolio.history].reverse();
  const record = records.find((r) => r.id === recordId) ?? records[0];
  const profile = getNationArmsProfile(p.nation.id);
  const stale = review && review.fingerprint !== diplomacyFingerprint(p);
  const navigate = (next: DiplomacyView) => { setView(next); setReview(null); setMessage(''); };
  const propose = (order: DiplomacyOrder) => {
    const result = reviewDiplomacyOrder(p, order); setReview(result.review); setMessage(result.reason);
    if (result.review) requestAnimationFrame(() => reviewRef.current?.focus());
  };
  const approve = () => {
    if (!review) return;
    const result = confirmDiplomacyOrder(review, p, gate); setMessage(result.message);
    if (result.accepted) setReview(null);
  };
  const action = (order: DiplomacyOrder, label: string) => { const result = reviewDiplomacyOrder(p, order); return <div className="diplomacy-action"><button type="button" className="diplomacy-primary" disabled={!result.review} onClick={() => propose(order)}>{label}<ArrowRight size={16} /></button><p>{result.reason}</p></div>; };
  return <section className="diplomacy-desk" aria-label="외교 작업대">
    <header className="diplomacy-heading"><div><small>FOREIGN OFFICE · {year}</small><h2>외교 지휘실</h2><p>상대국과 현안을 고르고, 조건을 확인한 뒤 지시하세요.</p></div><span className="diplomacy-badge">정치력 {p.game.politicalPower}</span></header>
    <nav className="diplomacy-tabs" aria-label="외교 업무">{([['relations', '국가 관계'], ['summit', '회담 의제'], ['policies', '군비·협약'], ['records', '이행 기록']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => navigate(id)}>{label}</button>)}</nav>
    {message ? <p role="status" className="diplomacy-message">{message}</p> : null}
    {review ? <section className="diplomacy-review" tabIndex={-1} ref={reviewRef} aria-label="외교 명령 검토"><small>REVIEW · 아직 집행하지 않은 안건</small><h3>{review.title}</h3><dl><div><dt>정치 비용</dt><dd>{review.cost} PP</dd></div><div><dt>예상 국고 변화</dt><dd>{p.formatMoney(review.treasuryDelta, { signed: true })}</dd></div></dl><ul>{review.effects.map((effect) => <li key={effect}>{effect}</li>)}</ul><p>{review.timing}</p>{stale ? <p role="alert">검토 후 조건이 바뀌었습니다. 재검토가 필요합니다.</p> : null}<div className="diplomacy-buttons"><button type="button" onClick={() => setReview(null)}>검토 취소</button>{stale ? <button type="button" onClick={() => propose(review.order)}>최신 조건 재검토</button> : null}<button type="button" className="diplomacy-primary" disabled={Boolean(stale)} onClick={approve}><Check size={16} />명령 승인</button></div></section> : null}
    {view === 'relations' ? <div className="diplomacy-split"><aside className="diplomacy-card"><label className="diplomacy-search"><Search size={17} /><input aria-label="국가·관계 상태 검색" value={query} onChange={(e) => { setQuery(e.target.value); setReview(null); }} placeholder="국가·관계 상태 찾기" /></label><label className="diplomacy-mobile" htmlFor={selectId}>상대국 선택<select id={selectId} value={country?.id ?? ''} onChange={(e) => { setCountryId(e.target.value); setReview(null); }}><option value="" disabled>목록에서 상대국 선택</option>{countries.map((r) => <option key={r.id} value={r.id}>{r.name} · 관계 {r.value}</option>)}</select></label><div className="diplomacy-country-list">{countries.map((r) => <button type="button" key={r.id} aria-pressed={country?.id === r.id} onClick={() => { setCountryId(r.id); setReview(null); }}><span><strong>{r.name}</strong><small>{r.status}</small></span><b>{r.value}</b></button>)}</div>{countries.length === 0 ? <p>검색 결과가 없습니다.</p> : null}</aside><article className="diplomacy-card diplomacy-detail">{country ? <><div className="diplomacy-heading"><div><small>선택한 상대국</small><h3>{country.name}</h3><p>{country.status}</p></div><span className="diplomacy-score">{country.value}<small>관계 / 100</small></span></div><p>외교 접촉은 정치력 8을 사용해 관계를 최대 7 개선합니다. 상대국 선택은 관계나 자원을 바꾸지 않습니다.</p>{action({ kind: 'influence', id: country.id }, '외교 접촉 검토')}{country.id === summit.partner.id ? <button type="button" onClick={() => navigate('summit')}><Handshake size={17} />{summit.agenda.title} 조건 확인</button> : <p className="diplomacy-muted">현재 주요 회담 상대는 {summit.partner.shortName}입니다. 다른 국가도 관계 개선은 가능하지만 개별 회담이 자동 생성되지는 않습니다.</p>}</> : <p>현재 검색 결과에서 상대국을 선택하세요.</p>}</article></div> : null}
    {view === 'summit' ? <article className="diplomacy-card diplomacy-detail"><div className="diplomacy-flags"><NationFlag nationId={p.nation.id} size="standard" /><Handshake size={22} /><NationFlag nationId={summit.partner.id} size="standard" /></div><small>{summit.agenda.basis === 'documented-conference' ? '실제 회담을 기준으로 한 의제' : '역사적 교섭을 재구성한 게임 의제'}</small><h3>{summit.agenda.title}</h3><p>{summit.agenda.detail}</p><p>{summit.agenda.location} · {summit.weeks ? `${summit.weeks}주 뒤 개최 시점` : '개최 시점 도달'}</p><div className="diplomacy-gates">{summit.gates.map((g) => <div key={g.label} className={g.passed ? 'passed' : ''}><small>{g.passed ? '충족' : '보완 필요'} · {g.label}</small><strong>{g.value}</strong></div>)}</div><div className="diplomacy-result"><strong>{summit.completed ? '과거 회담의 실제 내역은 기록에서 확인' : '현재 상태 기준 즉시 변화 · 개최 조건 충족 시'}</strong>{summit.completed ? <p>현재 수치로 과거 보상을 역산하지 않습니다.</p> : <><ul>{summitEffects.map((effect) => <li key={effect.label}>{effect.label} {effect.value}</li>)}</ul><p>{diplomacyFeedbackPrecisionNote}</p></>}</div>{summit.completed ? <p><ShieldCheck size={18} />이미 타결한 회담입니다.</p> : action({ kind: 'summit' }, '회담 개최안 검토')}<button type="button" onClick={() => { navigate('relations'); setQuery(''); setCountryId(summit.partner.id); }}>{summit.partner.shortName} 관계 관리</button><details><summary>참석자·역사적 기준점</summary><p>{summit.agenda.participants}</p><p>{summit.agenda.historicalAnchor}</p></details></article> : null}
    {view === 'policies' ? <><div className="diplomacy-metrics">{[['공급 안보', p.armsPortfolio.supplySecurity], ['조달 자율', p.armsPortfolio.autonomy], ['상호운용', p.armsPortfolio.interoperability], ['군비 긴장', p.armsPortfolio.escalation], ['규범 신뢰', p.armsPortfolio.treatyCompliance], ['공동 비축', p.armsPortfolio.emergencyStockpile]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{Math.round(Number(value))}</strong></div>)}</div><article className="diplomacy-card diplomacy-detail"><label>검토할 군비·외교 정책<select value={policy?.id ?? ''} onChange={(e) => { setPolicyId(e.target.value); setReview(null); }}>{policies.map((item) => <option key={item.id} value={item.id}>{item.title}{p.completedDecisions.includes(getStrategicDecisionId(item.id, item.stageId)) ? ' · 시행 완료' : ''}</option>)}</select></label>{policy ? <><small>{stage.label}</small><h3>{policy.title}</h3><p>{policy.summary}</p><strong>현재 상태 기준 시행 가정 · 자원 조건 충족 시</strong><ul className="diplomacy-effects">{policyEffects.map((effect) => <li key={effect.label}>{effect.label} {effect.value}</li>)}</ul><p>{diplomacyFeedbackPrecisionNote} 이미 시행한 정책은 현재 상태의 재계산 참고이며 과거 집행 결과가 아닙니다.</p><details><summary>기본 설계값 · 상한·체감 적용 전</summary><p>{getPolicyEffectLabels(policy).join(' · ')} · 주요 명목 항목만 표시하며 실제 적용 내역은 위 전후 변화에 따릅니다.</p></details><p>자원은 승인 직후, 실제 성과는 {policy.reviewYears}년 뒤 검증합니다.</p>{action({ kind: 'policy', id: policy.id }, '정책 시행안 검토')}<details><summary>정책 사료와 이 시대의 국제질서</summary><p>{stage.order}</p><p>{profile.historicalAnchor}</p><p>{policy.historicalBasis}</p><a href={policy.sourceUrl} target="_blank" rel="noreferrer"><BookOpen size={16} />{policy.sourceLabel}</a></details></> : <p>현재 시대의 정책이 없습니다.</p>}</article><article className="diplomacy-card diplomacy-detail"><h3>90일 군수 공동비축</h3><p>혼합 규격의 부품·탄약을 보유해 제재·봉쇄 충격을 완충합니다. 정치력 4 · {p.formatMoney(55)}</p>{action({ kind: 'stockpile' }, '비축 확충안 검토')}</article></> : null}
    {view === 'records' ? <article className="diplomacy-card diplomacy-detail"><header className="diplomacy-heading"><div><small>CONFIRMED RECORDS</small><h3>군비·협약 이행 기록</h3></div>{p.onOpenJournal ? <button type="button" onClick={p.onOpenJournal}>외교 전문·전체 결과<ArrowRight size={16} /></button> : null}</header><p>조달·정책·비축·장기 검증의 실제 기록입니다. 일반 외교 접촉과 회담 전문은 전체 결과에서 확인하세요.</p><label>기록 선택<select value={record?.id ?? ''} disabled={!records.length} onChange={(e) => setRecordId(e.target.value)}>{!records.length ? <option value="">아직 기록이 없습니다</option> : records.map((r) => <option value={r.id} key={r.id}>{r.year}년 · {r.title}</option>)}</select></label>{record ? <><small>{record.year}년 · 제{record.week + 1}주</small><h4>{record.title}</h4><p>{record.summary}</p><p>기록된 재정 비용 {p.formatMoney(record.treasuryCost)}</p></> : <p>결정 전 예측을 완료 기록으로 표시하지 않습니다. 정책이나 조달을 시행하면 기록이 쌓입니다.</p>}</article> : null}
  </section>;
}
