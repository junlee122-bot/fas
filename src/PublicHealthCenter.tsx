import {
  Activity,
  Biohazard,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  HeartPulse,
  Microscope,
  RadioTower,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import { GameIcon } from './GameIcon';
import { HealthMeter } from './HealthMeter';
import { PublicHealthForecast } from './PublicHealthForecast';
import {
  canFundPublicHealthInvestment,
  formatOutbreakPhase,
  getOutbreakRiskBreakdown,
  getOutbreakTemplate,
  getPublicHealthPolicy,
  outbreakTemplates,
  publicHealthInvestments,
  publicHealthPolicies,
} from './publicHealth';
import type { PublicHealthContext, PublicHealthInvestmentId, PublicHealthPolicyId, PublicHealthState } from './publicHealth';
import type { GameState } from './types';

interface PublicHealthCenterProps {
  state: PublicHealthState;
  game: GameState;
  context: PublicHealthContext;
  onPolicyChange: (policyId: PublicHealthPolicyId) => void;
  onInvestment: (investmentId: PublicHealthInvestmentId) => void;
}

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));
const formatRisk = (value: number) => `${(value * 100).toFixed(2)}%`;

export function PublicHealthCenter({ state, game, context, onPolicyChange, onInvestment }: PublicHealthCenterProps) {
  const outbreak = state.activeOutbreak;
  const template = outbreak ? getOutbreakTemplate(outbreak.templateId) : null;
  const activePolicy = getPublicHealthPolicy(state.policyId);
  const riskLevel = state.weeklyRisk >= 0.03 ? '심각' : state.weeklyRisk >= 0.018 ? '경계' : state.weeklyRisk >= 0.009 ? '주의' : '안정';
  const riskTone = state.weeklyRisk >= 0.03 ? 'red' : state.weeklyRisk >= 0.018 ? 'amber' : 'green';
  const riskFactors = getOutbreakRiskBreakdown(state, context)
    .filter((factor) => Math.abs(factor.contribution) >= 0.00005)
    .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution));

  return (
    <div className="public-health-center">
      <section className={`health-command-hero ${outbreak ? 'active-crisis' : ''}`}>
        <div className="health-command-copy">
          <span className="eyebrow"><GameIcon name="health" size={16} tone={outbreak ? 'red' : 'green'} /> NATIONAL PUBLIC HEALTH COMMAND</span>
          <h2>{outbreak ? `${outbreak.codeName} 위기 지휘실` : '국가 보건 대비 본부'}</h2>
          <p>{outbreak
            ? `${template?.name} 대응을 군사 작전과 같은 주간 결재 주기로 지휘합니다. 감시·격리·병상·연구의 효과와 비용이 다음 주 전파에 반영됩니다.`
            : '전선과 보급망이 감염병 위험을 바꾸며, 선제 투자는 발병 탐지 시점과 대유행 규모를 낮춥니다.'}</p>
          <div className="health-hero-status">
            <span className={`health-status-badge tone-${riskTone}`}><Activity size={15} /> {outbreak ? formatOutbreakPhase(outbreak.phase) : `위험 ${riskLevel}`}</span>
            <span><strong>{formatRisk(state.weeklyRisk)}</strong> 다음 주 발병 확률</span>
            <span><strong>{state.completedInvestments.length}/4</strong> 핵심 역량 구축</span>
            <span><strong>{context.theater === 'asia' ? '아시아·태평양' : '유럽·지중해'}</strong> 감시 전구</span>
          </div>
        </div>
        <div className="health-risk-dial" role="meter" aria-label={outbreak ? '현재 유효 재생산지수' : '다음 주 감염병 발병 확률'} aria-valuemin={0} aria-valuemax={outbreak ? 4.4 : 4.5} aria-valuenow={outbreak ? Number(outbreak.rEffective.toFixed(2)) : Number((state.weeklyRisk * 100).toFixed(2))}>
          <HeartPulse size={28} />
          <strong>{outbreak ? outbreak.rEffective.toFixed(2) : formatRisk(state.weeklyRisk)}</strong>
          <span>{outbreak ? '유효 재생산지수 R' : '주간 발병 위험'}</span>
          <small>{outbreak ? outbreak.rEffective > 1 ? '1 초과 · 유행 확산' : '1 이하 · 유행 감소' : '최대 모델 범위 4.50%'}</small>
        </div>
      </section>

      {outbreak && template && (
        <>
          <section className="health-kpi-grid" aria-label="유행 핵심 지표">
            <article className="health-kpi"><UsersRound size={20} /><small>누적 추정 사례</small><strong>{formatNumber(outbreak.estimatedCases)}</strong><span>이번 주 +{formatNumber(outbreak.weeklyCases)}</span></article>
            <article className={`health-kpi ${outbreak.rEffective > 1 ? 'danger' : 'safe'}`}><Activity size={20} /><small>유효 재생산지수</small><strong>{outbreak.rEffective.toFixed(2)}</strong><span>{outbreak.rEffective > 1 ? '유행 확산 중' : '유행 감소 중'}</span></article>
            <article className={`health-kpi ${outbreak.hospitalLoad >= 100 ? 'danger' : ''}`}><Stethoscope size={20} /><small>병상 부하</small><strong>{Math.round(outbreak.hospitalLoad)}%</strong><span>{outbreak.hospitalLoad >= 100 ? '수용 역량 초과' : '가용 범위'}</span></article>
            <article className="health-kpi"><Biohazard size={20} /><small>누적 사망</small><strong>{formatNumber(outbreak.deaths)}</strong><span>변이 계통 {outbreak.variantCount}개</span></article>
          </section>

          <section className="health-stage-card">
            <div className="health-section-heading">
              <div><span className="eyebrow">OUTBREAK PHASE</span><h3>유행 단계와 작전 목표</h3></div>
              <span className="health-code">{outbreak.codeName} · {outbreak.origin}</span>
            </div>
            <div className="health-stage-track" aria-label={`현재 단계 ${formatOutbreakPhase(outbreak.phase)}`}>
              {(['cluster', 'epidemic', 'pandemic', 'recovery'] as const).map((phase, index) => {
                const order = ['cluster', 'epidemic', 'pandemic', 'recovery'];
                const currentIndex = order.indexOf(outbreak.phase);
                return (
                  <div key={phase} className={`${phase === outbreak.phase ? 'active' : ''} ${index < currentIndex ? 'passed' : ''}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span><strong>{formatOutbreakPhase(phase)}</strong>
                  </div>
                );
              })}
            </div>
            <div className="health-progress-pair">
              <HealthMeter label="병원체 지식" value={outbreak.knowledge} detail="감시와 공개 연구가 전파 예측의 정확도를 높입니다." tone="blue" />
              <HealthMeter label="대응책 진척" value={state.countermeasureProgress} detail="치료제·백신 공동 연구가 R값과 치명률을 단계적으로 낮춥니다." tone="green" />
            </div>
          </section>
          <PublicHealthForecast state={state} game={game} context={context} onPolicyChange={onPolicyChange} />
        </>
      )}

      <div className="health-command-grid">
        <section className="health-card policy-command">
          <div className="health-section-heading">
            <div><span className="eyebrow">RESPONSE POSTURE</span><h3>{outbreak ? '이번 주 대응 태세' : '발병 시 기본 대응 태세'}</h3></div>
            <span className="health-code">현재 · {activePolicy.name}</span>
          </div>
          <p className="health-section-intro">태세는 다음 주 전파·사망·신뢰에 직접 반영됩니다. 강한 조치는 효과만큼 재정과 정치 비용도 큽니다.</p>
          <div className="health-policy-grid">
            {publicHealthPolicies.map((policy) => (
              <button key={policy.id} className={`health-policy ${state.policyId === policy.id ? 'selected' : ''}`} aria-pressed={state.policyId === policy.id} onClick={() => onPolicyChange(policy.id)}>
                <span><strong>{policy.name}</strong><small>{policy.posture}</small></span>
                {state.policyId === policy.id && <CheckCircle2 size={17} />}
                <p>{policy.description}</p>
                <dl>
                  <div><dt>전파 억제</dt><dd>-{policy.transmissionControl.toFixed(2)} R</dd></div>
                  <div><dt>주간 비용</dt><dd>₩ {policy.weeklyTreasury}{policy.weeklyPoliticalPower ? ` · 정치 ${policy.weeklyPoliticalPower}` : ''}</dd></div>
                </dl>
                <em>{policy.tradeoff}</em>
              </button>
            ))}
          </div>
        </section>

        <aside className="health-card readiness-command">
          <div className="health-section-heading">
            <div><span className="eyebrow">NATIONAL CAPACITY</span><h3>국가 대응 역량</h3></div>
          </div>
          <div className="health-meter-list">
            <HealthMeter label="사전 대비" value={state.preparedness} detail="비축·훈련·계획의 종합 수준" tone="green" />
            <HealthMeter label="감시·탐지" value={state.surveillance} detail="유행을 더 작을 때 포착하는 능력" tone="blue" />
            <HealthMeter label="의료 수용력" value={state.medicalCapacity} detail="중증 환자 생존과 병상 과부하 완화" tone="amber" />
            <HealthMeter label="공공 신뢰" value={state.publicTrust} detail="강한 조치의 지속 가능성과 순응도" tone={state.publicTrust < 40 ? 'red' : 'blue'} />
          </div>
          <div className="health-risk-factors">
            <strong>다음 주 확률의 증감 근거</strong>
            {riskFactors.map((factor) => (
              <span key={factor.id} className={factor.contribution < 0 ? 'protective' : 'hazard'}>
                <b>{factor.label}</b><em>{factor.contribution >= 0 ? '+' : ''}{(factor.contribution * 100).toFixed(2)}%p</em><small>{factor.detail}</small>
              </span>
            ))}
            <small>표시된 확률은 현재 상태에서 다음 한 주에 새 유행이 포착될 게임 내 확률입니다.</small>
          </div>
        </aside>
      </div>

      <section className="health-card investment-command">
        <div className="health-section-heading">
          <div><span className="eyebrow">CAPACITY BUILDING</span><h3>영구 보건 역량 사업</h3></div>
          <span className="health-code">국고 {formatNumber(game.treasury)} · 정치력 {game.politicalPower}</span>
        </div>
        <div className="health-investment-grid">
          {publicHealthInvestments.map((investment) => {
            const complete = state.completedInvestments.includes(investment.id);
            const affordable = canFundPublicHealthInvestment(state, investment.id, game);
            const knowledge = state.activeOutbreak?.knowledge ?? 0;
            const lockedByKnowledge = (investment.requiredKnowledge ?? 0) > knowledge;
            return (
              <article key={investment.id} className={`health-investment ${complete ? 'complete' : ''}`}>
                <div className="health-investment-icon">{investment.id === 'laboratory-network' ? <Microscope /> : investment.id === 'field-hospitals' ? <Stethoscope /> : investment.id === 'protective-stockpile' ? <ShieldCheck /> : <FlaskConical />}</div>
                <div><strong>{investment.name}</strong><p>{investment.description}</p></div>
                <span>{investment.effectLabel}</span>
                <small>국고 {investment.treasuryCost}{investment.politicalPowerCost ? ` · 정치 ${investment.politicalPowerCost}` : ''}{investment.steelCost ? ` · 강철 ${investment.steelCost}` : ''}{investment.manpowerCost ? ` · 인력 ${investment.manpowerCost}K` : ''}</small>
                <button className={complete ? 'complete' : 'primary'} disabled={complete || !affordable} onClick={() => onInvestment(investment.id)}>
                  {complete ? <><CheckCircle2 size={15} /> 구축 완료</> : lockedByKnowledge ? `지식 ${investment.requiredKnowledge}% 필요` : affordable ? '사업 승인' : '자원 부족'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="health-card scenario-command">
        <div className="health-section-heading">
          <div><span className="eyebrow">HISTORICAL SCENARIO LIBRARY</span><h3>확률 발병 시나리오</h3></div>
          <span className="health-code"><BookOpenCheck size={14} /> 사료 기반 · 대체역사 구분 표시</span>
        </div>
        <div className="health-scenario-note">
          <RadioTower size={20} />
          <p><strong>시대 고증 원칙</strong>SARS형과 COVID형은 1940년대에 실제 SARS-CoV·SARS-CoV-2가 있었다는 설정이 아닙니다. 후대 유행에서 확인된 역학·대응 양상을 토대로 만든 가상 신종 코로나바이러스이며 게임 안에서도 대체역사로 명시됩니다.</p>
        </div>
        <div className="health-profile-grid">
          {outbreakTemplates.map((profile) => (
            <article key={profile.id} className={profile.id === outbreak?.templateId ? 'active' : ''}>
              <div><span className={`health-profile-family ${profile.family}`}>{profile.family === 'respiratory' ? '호흡기' : profile.family === 'vector' ? '매개체' : '수인성'}</span>{profile.alternateHistory && <span className="health-alt-badge">대체역사</span>}</div>
              <strong>{profile.name}</strong>
              <small>{profile.historicalAnalogue} · {profile.historicalYear}</small>
              <p>{profile.historicalNote}</p>
              <dl><div><dt>기초 R</dt><dd>{profile.reproductionNumber.toFixed(2)}</dd></div><div><dt>등장 가중치</dt><dd>{profile.baseWeight}</dd></div><div><dt>치명률 모형</dt><dd>{(profile.fatalityRate * 100).toFixed(1)}%</dd></div></dl>
              <a href={profile.sourceUrl} target="_blank" rel="noreferrer">{profile.sourceLabel}<ExternalLink size={13} /></a>
            </article>
          ))}
        </div>
      </section>

      {state.history.length > 0 && (
        <section className="health-card outbreak-archive">
          <div className="health-section-heading"><div><span className="eyebrow">AFTER ACTION RECORDS</span><h3>종결된 유행 기록</h3></div></div>
          <div className="health-history-list">
            {[...state.history].reverse().map((record) => (
              <article key={record.id}><CheckCircle2 size={18} /><span><strong>{record.codeName} · {getOutbreakTemplate(record.templateId).shortName}</strong><small>W{record.detectedWeek + 1}–W{record.resolvedWeek + 1}</small></span><span>사례 {formatNumber(record.cases)}</span><span>사망 {formatNumber(record.deaths)}</span><em>{record.outcome === 'contained' ? '조기 억제' : record.outcome === 'managed' ? '관리 종결' : '국가적 재난'}</em></article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
