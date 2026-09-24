import { useState } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Factory,
  Handshake,
  Landmark,
  Megaphone,
  Scale,
  Shield,
  Swords,
  Target,
  TimerReset,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  calculateCoalitionSupport,
  getLegacyPathDefinition,
  getPowerBlocDefinition,
  leadershipPrinciples,
  legacyPathDefinitions,
  powerBlocDefinitions,
  previewRivalAction,
  rivalActionDefinitions,
  type LeadershipPrincipleId,
  type LegacyPathId,
  type OpportunityChoiceId,
  type PowerBlocId,
  type PowerNetworkContext,
  type PowerNetworkState,
  type RivalActionId,
} from './powerNetwork';
import type { StaffMember } from './types';

interface PowerNetworkBoardProps {
  state: PowerNetworkState;
  context: PowerNetworkContext;
  staff: StaffMember[];
  compact?: boolean;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onPrinciplesChange: (principles: LeadershipPrincipleId[]) => void;
  onPromise: (blocId: PowerBlocId) => void;
  onLegacyChange: (pathId: LegacyPathId) => void;
  onRivalAction: (actionId: RivalActionId) => void;
  onOpportunityChoice: (choiceId: OpportunityChoiceId) => void;
}

const blocIcons: Record<PowerBlocId, typeof Users> = {
  'armed-forces': Swords,
  'civil-service': Landmark,
  labor: Users,
  industry: Factory,
  intelligentsia: BrainCircuit,
  regions: Building2,
  security: Shield,
  civic: Megaphone,
};

const stageLabels = ['방향 선언', '기반 형성', '제도 정착', '세대 전환', '역사적 유산'];

function Meter({ value, danger = false }: { value: number; danger?: boolean }) {
  return <span className={`power-meter ${danger ? 'danger' : ''}`} aria-label={`${Math.round(value)}점`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function signed(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}

export function PowerNetworkBoard({
  state,
  context,
  staff,
  compact = false,
  formatMoney,
  onPrinciplesChange,
  onPromise,
  onLegacyChange,
  onRivalAction,
  onOpportunityChoice,
}: PowerNetworkBoardProps) {
  const [draftPrinciples, setDraftPrinciples] = useState<LeadershipPrincipleId[]>(state.principles);
  const coalitionSupport = calculateCoalitionSupport(state);
  const activeLegacy = getLegacyPathDefinition(state.legacy.activePathId);
  const activePromiseBloc = state.activePromise ? getPowerBlocDefinition(state.activePromise.blocId) : null;
  const rivalBloc = getPowerBlocDefinition(state.rival.blocId);
  const visibleBlocs = compact
    ? [...state.blocs].sort((left, right) => right.influence * right.grievance - left.influence * left.grievance).slice(0, 4)
    : state.blocs;
  const togglePrinciple = (principleId: LeadershipPrincipleId) => {
    setDraftPrinciples((current) => current.includes(principleId)
      ? current.filter((id) => id !== principleId)
      : current.length < 3 ? [...current, principleId] : current);
  };

  return (
    <section className={`nation-surface power-network-board ${compact ? 'compact' : ''}`} aria-labelledby={`power-network-title-${compact ? 'compact' : 'full'}`}>
      <header>
        <div><span>{compact ? '전시 권력 생태계' : '권력 생태계·살아 있는 정치'}</span><h3 id={`power-network-title-${compact ? 'compact' : 'full'}`}>세력은 결정을 기억하고, 경쟁자는 빈틈을 이용합니다</h3></div>
        <small>{context.role.title} · {context.role.tier}급 권한 · {context.year}년</small>
      </header>

      <div className="power-network-kpis">
        <article><Handshake /><span>연정 지지</span><strong>{coalitionSupport}</strong><Meter value={coalitionSupport} danger={coalitionSupport < 40} /></article>
        <article><BadgeCheck /><span>공약 신뢰</span><strong>{Math.round(state.promiseReliability)}</strong><Meter value={state.promiseReliability} danger={state.promiseReliability < 40} /></article>
        <article className={state.rival.pressure >= 65 ? 'warning' : ''}><Target /><span>경쟁자 압력</span><strong>{Math.round(state.rival.pressure)}</strong><Meter value={state.rival.pressure} danger /></article>
        <article><BookOpenCheck /><span>{activeLegacy.name}</span><strong>{Math.round(state.legacy.progress)}%</strong><Meter value={state.legacy.progress} /></article>
      </div>

      {state.activeOpportunity ? (
        <div className="power-opportunity" role="region" aria-label="결재가 필요한 정치적 기회">
          <div className="power-opportunity-heading">
            <span><TrendingUp /><b>POLITICAL OPPORTUNITY</b></span>
            <em>제{state.activeOpportunity.expiresWeek + 1}주까지 · {Math.max(0, state.activeOpportunity.expiresWeek - context.week)}주 남음</em>
          </div>
          <h4>{state.activeOpportunity.title}</h4>
          <p>{state.activeOpportunity.briefing}</p>
          <blockquote>{state.activeOpportunity.stakes}</blockquote>
          <small>{state.activeOpportunity.historicalPattern}</small>
          <div className="power-opportunity-choices">
            {state.activeOpportunity.choices.map((choice) => {
              const canAfford = context.politicalPower + choice.politicalPower >= 0 && context.treasury + choice.treasury >= 0;
              return (
                <button type="button" key={choice.id} disabled={!canAfford} onClick={() => onOpportunityChoice(choice.id)}>
                  <span>{choice.label}</span>
                  <strong>{choice.description}</strong>
                  <p>{choice.forecast}</p>
                  <small>정치력 {signed(choice.politicalPower)} · 국고 {formatMoney(choice.treasury, { signed: true })} · 정통성 {signed(choice.legitimacy)} · 불안 {signed(choice.unrest)}</small>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="power-next-opportunity"><TimerReset /><span><strong>다음 정치적 기회까지 {Math.max(0, state.nextOpportunityWeek - context.week)}주</strong><small>기회는 현재 세력 관계와 경제·전쟁·언론 조건에서 생성되며, 무응답도 하나의 선택으로 기록됩니다.</small></span></div>
      )}

      <div className="power-bloc-section">
        <div className="power-section-heading"><div><Users /><span><small>POWER BLOCS</small><strong>고정된 정체성, 변하는 지지와 동원</strong></span></div><em>영향력 × 불만 × 동원이 실제 위기 강도를 결정</em></div>
        <div className="power-bloc-grid">
          {visibleBlocs.map((bloc) => {
            const definition = getPowerBlocDefinition(bloc.id);
            const Icon = blocIcons[bloc.id];
            const champion = staff
              .filter((member) => definition.championDepartments.includes(member.department))
              .sort((left, right) => right.influence + right.ability - left.influence - left.ability)[0];
            const canPromise = !state.activePromise && context.politicalPower >= 3;
            return (
              <article key={bloc.id} className={`${bloc.support < 38 || bloc.grievance >= 65 ? 'warning' : ''} ${state.activePromise?.blocId === bloc.id ? 'promised' : ''}`}>
                <div className="power-bloc-title"><Icon /><span><strong>{definition.name}</strong><small>{definition.identity}</small></span><b>{Math.round(bloc.influence)}</b></div>
                <div className="power-bloc-metrics">
                  <span><em>지지</em><b className={bloc.trend >= 0 ? 'positive' : 'negative'}>{Math.round(bloc.support)} · {bloc.trend >= 0 ? '▲' : '▼'} {Math.abs(bloc.trend).toFixed(1)}</b></span>
                  <Meter value={bloc.support} danger={bloc.support < 38} />
                  <span><em>불만 / 동원</em><b>{Math.round(bloc.grievance)} / {Math.round(bloc.mobilization)}</b></span>
                </div>
                <p>{bloc.lastReason}</p>
                <small><b>핵심 이해</b> {definition.interest} · <b>금지선</b> {definition.redLine}</small>
                <div className="power-bloc-footer"><span>{champion ? `연결 인물 · ${champion.name}` : '연결 인물 · 공석'}</span><button type="button" disabled={!canPromise} onClick={() => onPromise(bloc.id)}>{state.activePromise?.blocId === bloc.id ? '공약 진행 중' : '공약 협상'}</button></div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="power-operations-grid">
        <section className={`power-promise-card ${state.activePromise ? 'active' : ''}`}>
          <div className="power-section-heading"><div><BadgeCheck /><span><small>PROMISE</small><strong>{state.activePromise ? `${activePromiseBloc?.shortName}과 ${state.activePromise.title}` : '지금은 공개 공약이 없습니다'}</strong></span></div>{state.activePromise && <em>제{state.activePromise.deadlineWeek + 1}주까지</em>}</div>
          {state.activePromise ? (
            <>
              <p>{state.activePromise.requirement}</p>
              <div className="power-promise-progress"><Meter value={state.activePromise.progress} danger={state.activePromise.progress < 45} /><strong>{Math.round(state.activePromise.progress)}%</strong></div>
              <div className="power-promise-outcomes"><span><b>이행</b>{state.activePromise.reward}</span><span><b>파기</b>{state.activePromise.failure}</span></div>
              <small>조건을 일찍 충족하면 즉시 이행 처리됩니다. 기한까지 기다릴 필요가 없습니다.</small>
            </>
          ) : (
            <p>세력 카드에서 하나의 공약만 선택할 수 있습니다. 예산과 실제 성과가 자동으로 진척을 계산하며, 말뿐인 약속은 장기 신뢰를 훼손합니다.</p>
          )}
          {state.promiseHistory.length > 0 && <div className="power-mini-history">{state.promiseHistory.slice(0, 3).map((record) => <span key={`${record.id}-${record.resolvedWeek}`} className={record.status}><b>{record.status === 'fulfilled' ? '이행' : '파기'}</b>{record.title}<em>제{record.resolvedWeek + 1}주</em></span>)}</div>}
        </section>

        <section className={`power-rival-card ${state.rival.pressure >= 65 ? 'danger' : ''}`}>
          <div className="power-section-heading"><div><Target /><span><small>POLITICAL RIVAL</small><strong>{state.rival.name} · {state.rival.title}</strong></span></div><em>{rivalBloc.shortName} 기반</em></div>
          <p>{state.rival.ambition}</p>
          <div className="power-rival-meters">
            <span><em>압력</em><b>{Math.round(state.rival.pressure)}</b><Meter value={state.rival.pressure} danger /></span>
            <span><em>존중</em><b>{Math.round(state.rival.respect)}</b><Meter value={state.rival.respect} /></span>
            <span><em>지렛대</em><b>{Math.round(state.rival.leverage)}</b><Meter value={state.rival.leverage} danger /></span>
          </div>
          <blockquote>{state.rival.latestMove}</blockquote>
          <div className="power-rival-actions">
            {rivalActionDefinitions.map((action) => {
              const preview = previewRivalAction(state, action.id, context);
              return <button type="button" key={action.id} disabled={!preview.allowed} onClick={() => onRivalAction(action.id)} title={!preview.allowed ? `필요: ${action.minimumTier}급 권한 · 정치력 ${action.politicalCost} · 국고 ${formatMoney(action.treasuryCost)} · 냉각기간` : action.approach}><strong>{action.name}</strong><span>성공 예상 {preview.chance}%</span><small>정치력 {action.politicalCost} · {formatMoney(action.treasuryCost)}</small></button>;
            })}
          </div>
        </section>
      </div>

      {!compact ? (
        <>
          <div className="power-principles">
            <div className="power-section-heading"><div><Scale /><span><small>MANAGER PRINCIPLES</small><strong>말과 행동을 비교하는 세 가지 지도 원칙</strong></span></div><em>{draftPrinciples.length}/3 선택</em></div>
            <div>{leadershipPrinciples.map((principle) => <button type="button" key={principle.id} className={draftPrinciples.includes(principle.id) ? 'active' : ''} aria-pressed={draftPrinciples.includes(principle.id)} onClick={() => togglePrinciple(principle.id)}><strong>{principle.name}</strong><span>{principle.promise}</span></button>)}</div>
            <button type="button" className="power-commit-principles" disabled={draftPrinciples.length !== 3 || draftPrinciples.every((principle) => state.principles.includes(principle)) || context.politicalPower < 4} onClick={() => onPrinciplesChange(draftPrinciples)}>정치력 4 · 원칙 재선언</button>
          </div>

          <div className="power-legacy-section">
            <div className="power-section-heading"><div><BookOpenCheck /><span><small>LEGACY PATH</small><strong>점수가 아니라 당신의 시대가 남길 국가 유산</strong></span></div><em>{stageLabels[state.legacy.stage]} · 최고 {Math.round(state.legacy.highWaterMark)}%</em></div>
            <div className="power-legacy-grid">
              {legacyPathDefinitions.map((path) => {
                const active = path.id === state.legacy.activePathId;
                const canChange = !active && context.week >= state.legacy.focusChangedWeek + 26 && context.politicalPower >= 6;
                return (
                  <button type="button" key={path.id} className={active ? 'active' : ''} disabled={!active && !canChange} onClick={() => onLegacyChange(path.id)}>
                    <span>{path.doctrine}</span><strong>{path.name}</strong><p>{path.description}</p><small>성과: {path.success}</small><em>{active ? `${Math.round(state.legacy.progress)}% · ${stageLabels[state.legacy.stage]}` : canChange ? '정치력 6 · 장기 노선 전환' : `전환까지 ${Math.max(0, state.legacy.focusChangedWeek + 26 - context.week)}주`}</em>
                  </button>
                );
              })}
            </div>
          </div>

          {state.memories.length > 0 && <div className="power-memory-ledger"><h4>세력이 기억하는 결정</h4>{state.memories.slice(0, 8).map((memory) => <article key={memory.id} className={memory.tone}><span><strong>{memory.title}</strong><small>{memory.detail}</small></span><b>제{memory.week + 1}주</b><ChevronRight /></article>)}</div>}
        </>
      ) : null}
    </section>
  );
}
