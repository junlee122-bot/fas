import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { AlertTriangle, ArrowRight, BadgeCheck, Landmark, LockKeyhole, ShieldAlert, ShieldCheck, Users, X } from 'lucide-react';
import { NationFlag } from './NationFlag';
import {
  coupPreventionDefinitions,
  getCoupResponseForecasts,
  getFactionRelationLabel,
  getCoupRiskLabel,
} from './politicalCrisis';
import type {
  CoupIncident,
  CoupPreventionId,
  CoupResponseId,
  CoupRiskAssessment,
  NationPoliticalProfile,
  PoliticalCrisisContext,
  PoliticalCrisisState,
} from './politicalCrisis';
import type { CareerRole } from './types';

interface PoliticalCrisisModalProps {
  profile: NationPoliticalProfile;
  state: PoliticalCrisisState;
  assessment: CoupRiskAssessment;
  context: PoliticalCrisisContext;
  role: CareerRole;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  incident?: CoupIncident | null;
  onPrevent: (id: CoupPreventionId) => void;
  onRespond: (id: CoupResponseId) => void;
  onClose?: () => void;
}

const riskTone = {
  stable: 'stable',
  watch: 'watch',
  dangerous: 'dangerous',
  critical: 'critical',
} as const;

function hasPreventionResources(id: CoupPreventionId, context: PoliticalCrisisContext) {
  if (id === 'faction-dialogue') return context.game.politicalPower >= 8 && context.game.treasury >= 30;
  if (id === 'loyalty-review') return context.game.commandPoints >= 8;
  if (id === 'security-audit') return context.game.politicalPower >= 5 && context.game.intelNetwork >= 4;
  return context.game.treasury >= 90;
}

function hasResponseResources(id: CoupResponseId, context: PoliticalCrisisContext) {
  if (id === 'constitutional-appeal') return context.game.politicalPower >= 8;
  if (id === 'faction-negotiation') return context.game.politicalPower >= 14 && context.game.treasury >= 35;
  if (id === 'loyal-command') return context.game.commandPoints >= 14;
  return context.game.politicalPower >= 8 && context.game.intelNetwork >= 6;
}

export function PoliticalCrisisModal({
  profile,
  state,
  assessment,
  context,
  role,
  formatMoney,
  incident = null,
  onPrevent,
  onRespond,
  onClose,
}: PoliticalCrisisModalProps) {
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const responseForecasts = useMemo(
    () => incident ? getCoupResponseForecasts(incident, role, context, state) : [],
    [context, incident, role, state],
  );

  useEffect(() => {
    firstActionRef.current?.focus();
  }, [incident]);

  const resolveFactionName = (id: string) => profile.factions.find((faction) => faction.id === id)?.shortName ?? id;
  const relationRows = Object.entries(state.relations).map(([pair, value]) => {
    const [left, right] = pair.split('::');
    return { pair, left: resolveFactionName(left), right: resolveFactionName(right), value };
  });
  const leadingFaction = profile.factions.find((faction) => faction.id === incident?.leadingFactionId) ?? assessment.leadingFaction;
  const localizeMoney = (text: string) => text.replace(/£([\d.]+)M/g, (_match, amount: string) => formatMoney(Number(amount)));

  return (
    <div className="modal-backdrop political-crisis-backdrop" role="presentation">
      <section
        className={`political-crisis-modal ${incident ? 'incident' : ''} tone-${riskTone[assessment.tier]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="political-crisis-title"
        aria-describedby="political-crisis-summary"
      >
        <header className="political-crisis-header">
          <div className="political-crisis-identity">
            <NationFlag nationId={profile.nationId} size="standard" decorative />
            <span className="political-crisis-seal"><ShieldAlert size={23} aria-hidden="true" /></span>
            <div>
              <small>{incident ? 'NATIONAL EMERGENCY · TIME STOPPED' : 'INTERNAL SECURITY DIRECTORATE'}</small>
              <h2 id="political-crisis-title">{incident ? incident.title : `${assessment.crisisLabel} 상황실`}</h2>
              <p id="political-crisis-summary">{incident ? incident.briefing : `${state.governmentName}의 권력집단 관계와 ${assessment.crisisLabel} 위험을 매주 추적합니다.`}</p>
            </div>
          </div>
          {!incident && onClose && <button ref={firstActionRef} className="icon-button" onClick={onClose} aria-label="정치위기 상황실 닫기"><X size={18} /></button>}
        </header>

        <div className="political-crisis-hero">
          <div className="coup-risk-gauge" aria-label={`${assessment.crisisLabel} 위험 ${assessment.score}점, ${getCoupRiskLabel(assessment.tier)}`}>
            <span style={{ '--risk-value': `${assessment.score * 3.6}deg` } as CSSProperties}>
              <strong>{assessment.score}</strong><small>/ 100</small>
            </span>
            <div><small>위기 단계</small><strong>{getCoupRiskLabel(assessment.tier)}</strong></div>
          </div>
          <div className="coup-hero-stat"><AlertTriangle size={18} /><span><small>다음 주 {assessment.crisisLabel} 발생 확률</small><strong>{assessment.weeklyChance.toFixed(1)}%</strong></span></div>
          <div className="coup-hero-stat"><Landmark size={18} /><span><small>현 정부</small><strong>{state.governmentName}</strong></span></div>
          <div className="coup-hero-stat"><Users size={18} /><span><small>주도 위험집단</small><strong>{leadingFaction.shortName}</strong></span></div>
          <div className="coup-hero-stat"><ShieldCheck size={18} /><span><small>누적 기록</small><strong>위기 {state.attempts} · 저지 {state.prevented} · 강제전환 {state.successful}</strong></span></div>
        </div>

        {incident ? (
          <div className="coup-response-layout">
            <section className="coup-incident-brief">
              <span className={`detection-badge ${incident.detected ? 'detected' : 'surprise'}`}>{incident.detected ? '사전 적발 · 대응 보너스' : '기습 실행 · 대응 불리'}</span>
              <h3>무엇이 이 사태를 만들었나</h3>
              <ol className="coup-trigger-list">
                {assessment.triggers.filter((trigger) => trigger.contribution > 0).slice(0, 5).map((trigger) => (
                  <li key={trigger.id}><span><strong>{trigger.label}</strong><small>{localizeMoney(trigger.detail)}</small></span><b>+{trigger.contribution.toFixed(1)}</b></li>
                ))}
              </ol>
              <div className="historical-case-note"><BadgeCheck size={17} /><p><strong>역사 사례 기반</strong>{incident.historicalEcho}</p></div>
            </section>
            <section className="coup-response-panel">
              <div className="section-heading"><div><small>YOUR OFFICE · {role.branch.toUpperCase()}</small><h3>대응 명령 선택</h3></div><span>선택 즉시 결과 확정</span></div>
              <div className="coup-response-grid">
                {responseForecasts.map((response, index) => {
                  const resourcesReady = hasResponseResources(response.id, context);
                  const disabled = !response.allowed || !resourcesReady;
                  return (
                    <button key={response.id} ref={index === 0 ? firstActionRef : undefined} className="coup-response-card" disabled={disabled} onClick={() => onRespond(response.id)}>
                      <span className="response-card-top"><b>{response.name}</b><em>{response.successChance}%</em></span>
                      <p>{response.description}</p>
                      <small>{localizeMoney(response.costLabel)}</small>
                      {response.preparednessBonus > 0 && <span className="response-preparedness">과거 대응 학습·제도 준비 +{response.preparednessBonus}%p</span>}
                      <span className="response-consequence">{response.consequence}</span>
                      <span className="response-availability">{!response.allowed ? <><LockKeyhole size={13} /> {response.branch} 계열 또는 1급 보직 필요</> : !resourcesReady ? <><LockKeyhole size={13} /> 자원 부족</> : <>명령 확정 <ArrowRight size={14} /></>}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="political-crisis-body">
            <section className="coup-faction-section">
              <div className="section-heading"><div><small>POWER BLOCS</small><h3>국내 권력집단</h3></div><span>불만 × 조직력 × 지지 기반</span></div>
              <div className="coup-faction-grid">
                {profile.factions.map((faction) => {
                  const standing = state.factionStandings[faction.id];
                  const isLeading = faction.id === assessment.leadingFaction.id;
                  return (
                    <article key={faction.id} className={isLeading ? 'leading' : ''}>
                      <header><span><small>{faction.kind.toUpperCase()}</small><strong>{faction.name}</strong></span>{isLeading && <em>최대 위험</em>}</header>
                      <p>{faction.agenda}</p>
                      <div className="faction-meter-row"><span>지지 <b>{Math.round(standing.support)}</b></span><i><em style={{ width: `${standing.support}%` }} /></i></div>
                      <div className="faction-meter-row grievance"><span>불만 <b>{Math.round(standing.grievance)}</b></span><i><em style={{ width: `${standing.grievance}%` }} /></i></div>
                      <div className="faction-meter-row organization"><span>조직 <b>{Math.round(standing.organization)}</b></span><i><em style={{ width: `${standing.organization}%` }} /></i></div>
                      <small className="faction-grievance">불만 요인: {faction.grievance}</small>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="coup-analysis-column">
              <div className="coup-analysis-card">
                <div className="section-heading"><div><small>RISK BREAKDOWN</small><h3>위험 기여도</h3></div></div>
                <ol className="coup-trigger-list">
                  {assessment.triggers.slice(0, 6).map((trigger) => (
                    <li key={trigger.id}><span><strong>{trigger.label}</strong><small>{localizeMoney(trigger.detail)}</small></span><b className={trigger.contribution < 0 ? 'protective' : ''}>{trigger.contribution > 0 ? '+' : ''}{trigger.contribution.toFixed(1)}</b></li>
                  ))}
                </ol>
              </div>
              <div className="coup-analysis-card">
                <div className="section-heading"><div><small>RELATIONS</small><h3>집단 간 관계</h3></div></div>
                <div className="faction-relations">
                  {relationRows.map((relation) => <div key={relation.pair}><span>{relation.left}<ArrowRight size={12} />{relation.right}</span><b>{getFactionRelationLabel(relation.value)} · {Math.round(relation.value)}</b></div>)}
                </div>
              </div>
            </section>

            <section className="coup-prevention-section">
              <div className="section-heading"><div><small>PREVENTIVE ORDERS</small><h3>사전 예방조치</h3></div><span>{state.lastPreventionWeek === context.week ? '이번 주 조치 완료' : '주 1회 실행 가능'}</span></div>
              <div className="coup-prevention-grid">
                {coupPreventionDefinitions.map((action) => {
                  const branchAllowed = action.branch === 'any' || role.tier === 1 || role.branch === action.branch;
                  const resourcesReady = hasPreventionResources(action.id, context);
                  const disabled = !branchAllowed || !resourcesReady || state.lastPreventionWeek === context.week;
                  return (
                    <button key={action.id} disabled={disabled} onClick={() => onPrevent(action.id)}>
                      <span><strong>{action.name}</strong><small>{action.description}</small></span>
                      <em>{!branchAllowed ? `${action.branch} 권한 필요` : !resourcesReady ? '자원 부족' : localizeMoney(action.costLabel)}</em>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="coup-history-section" aria-labelledby="coup-history-title">
              <div className="section-heading"><div><small>INSTITUTIONAL MEMORY</small><h3 id="coup-history-title">정치 위기 대응 기록</h3></div><span>최근 {state.history.length}/24건</span></div>
              {state.history.length > 0 ? (
                <div className="coup-history-list">
                  {state.history.slice(0, 8).map((record) => (
                    <article className={`outcome-${record.outcome}`} key={record.id}>
                      <time>{1942 + Math.floor(record.week / 52)}년</time>
                      <span><strong>{record.title}</strong><small>{record.crisisLabel} · {resolveFactionName(record.leadingFactionId)} · {record.responseName}</small></span>
                      <em>{record.outcome === 'prevented' ? '저지' : record.outcome === 'compromise' ? '타협' : '체제 전환'}</em>
                    </article>
                  ))}
                </div>
              ) : <p className="coup-history-empty">아직 확정된 정치 위기 대응 기록이 없습니다. 예방조치와 실제 대응 결과가 이곳에 누적됩니다.</p>}
            </section>
          </div>
        )}

        <footer className="political-crisis-footer">
          <p><ShieldCheck size={15} /><span><strong>{profile.constitutionalCenter}</strong> · {profile.historicalContext}</span></p>
          <div className="historical-source-links">
            <span>사례 기준</span>
            <a href="https://www.ndl.go.jp/modern/e/cha4/description07.html" target="_blank" rel="noreferrer">일본 2·26 사건</a>
            <a href="https://history.state.gov/historicaldocuments/frus1969-76ve16/d139" target="_blank" rel="noreferrer">칠레 권력 양극화</a>
            <a href="https://history.state.gov/historicaldocuments/frus1964-68v29p1/d22" target="_blank" rel="noreferrer">한국 군부·치안 분석</a>
          </div>
        </footer>
      </section>
    </div>
  );
}
