import { getCampaignYearForWeek } from './campaignCalendar';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, BookOpenText, BrainCircuit, CheckCircle2, Clock3, Crown, Gauge, Landmark, Route, ShieldAlert, Sparkles, Users } from 'lucide-react';
import {
  getStrategicSagaDefinition,
  previewSagaApproach,
  strategicSagaDefinitions,
  type SagaApproachId,
  type SagaChampion,
  type StrategicSagaContext,
  type StrategicSagaState,
} from './strategicSaga';
import type { StaffMember } from './types';

interface StrategicSagaBoardProps {
  state: StrategicSagaState;
  context: StrategicSagaContext;
  staff: StaffMember[];
  compact?: boolean;
  onStart: (definitionId: string, champion: SagaChampion) => void;
  onApproach: (approachId: SagaApproachId) => void;
  onReserve: () => void;
}

const departmentLabels: Record<string, string> = {
  operations: '작전', logistics: '보급', armaments: '군수', personnel: '인사', political: '정치', science: '과학', economy: '경제', intelligence: '정보',
};

const domainLabels: Record<string, string> = {
  war: '군사·병참', diplomacy: '외교·세계질서', economy: '경제·통화', science: '과학·기술', society: '사회·건국', health: '보건·재난', environment: '환경·전환', intelligence: '정보·통신',
};

function Progress({ value, danger = false }: { value: number; danger?: boolean }) {
  return <span className={`saga-progress ${danger ? 'danger' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function championFrom(member: StaffMember): SagaChampion {
  return { id: member.id, name: member.name, department: member.department, ability: member.ability, loyalty: member.loyalty };
}

export function StrategicSagaBoard({ state, context, staff, compact = false, onStart, onApproach, onReserve }: StrategicSagaBoardProps) {
  const [selectedOfferId, setSelectedOfferId] = useState(state.offers[0] ?? '');
  const selectedDefinition = getStrategicSagaDefinition(state.offers.includes(selectedOfferId) ? selectedOfferId : state.offers[0] ?? strategicSagaDefinitions[0].id);
  const eligibleStaff = useMemo(() => [...staff]
    .sort((left, right) => {
      const leftFit = selectedDefinition.preferredDepartments.includes(left.department) ? 20 : 0;
      const rightFit = selectedDefinition.preferredDepartments.includes(right.department) ? 20 : 0;
      return right.ability + right.loyalty * .2 + rightFit - (left.ability + left.loyalty * .2 + leftFit);
    })
    .slice(0, 8), [selectedDefinition, staff]);
  const [selectedChampionId, setSelectedChampionId] = useState('');
  const selectedChampion = eligibleStaff.find((member) => member.id === selectedChampionId) ?? eligibleStaff[0] ?? null;
  const active = state.active;
  const activeDefinition = active ? getStrategicSagaDefinition(active.definitionId) : null;
  const activeAct = active && activeDefinition ? activeDefinition.acts[active.actIndex] : null;
  const previews = active ? (['command', 'coalition', 'innovation'] as SagaApproachId[]).map((id) => previewSagaApproach(active, id, context)) : [];
  const currentPreview = active?.approachId ? previews.find((preview) => preview.id === active.approachId) ?? null : null;

  if (compact && !active && state.offers.length === 0) return null;

  return (
    <section className={`nation-surface strategic-saga-board ${compact ? 'compact' : ''}`} aria-labelledby="strategic-saga-title">
      <header>
        <div>
          <span>PLAYABLE ERA ARC · 장기 선택과 후유증</span>
          <h3 id="strategic-saga-title">{activeDefinition?.title ?? '다음 시대를 정의할 전략 서사'}</h3>
        </div>
        <div className="saga-header-status">
          <span><Crown size={15} /> 유산 {state.legacyMarks}</span>
          <span><BookOpenText size={15} /> 완결 {state.history.length}</span>
        </div>
      </header>

      {active && activeDefinition && activeAct ? (
        <>
          <div className="saga-active-summary">
            <div className="saga-act-sequence" aria-label="전략 서사 단계">
              {activeDefinition.acts.map((act, index) => (
                <span key={act.title} className={index < active.actIndex ? 'done' : index === active.actIndex ? 'current' : ''}>
                  <b>{index + 1}</b><small>{act.title}</small>
                </span>
              ))}
            </div>
            <div className="saga-active-grid">
              <article className="saga-current-act">
                <span>{activeDefinition.era} · {domainLabels[activeDefinition.domain]}</span>
                <h4>{activeAct.title}</h4>
                <p>{activeAct.question}</p>
                <div className="saga-meter-row"><span><Route size={15} /> 진척</span><Progress value={active.progress} /><strong>{Math.round(active.progress)}</strong></div>
                <div className="saga-meter-row"><span><ShieldAlert size={15} /> 압력</span><Progress value={active.pressure} danger /><strong>{Math.round(active.pressure)}</strong></div>
                <div className="saga-momentum">
                  <span><Gauge size={15} /> 기세 {active.momentum >= 0 ? '+' : ''}{Math.round(active.momentum)}</span>
                  <span><Clock3 size={15} /> 장기 시한 {Math.max(0, active.deadlineWeek - context.week)}주</span>
                  <span className={active.setbacks > 0 ? 'warning' : ''}><AlertTriangle size={15} /> 후퇴 {active.setbacks}</span>
                </div>
              </article>
              <article className="saga-champion-card">
                <span>책임 참모</span>
                <strong>{active.champion.name}</strong>
                <small>{departmentLabels[active.champion.department] ?? active.champion.department} · 역량 {active.champion.ability} · 신뢰 {active.champion.loyalty}</small>
                <p>{activeDefinition.preferredDepartments.includes(active.champion.department) ? '이 국면과 전문 분야가 맞아 매주 역량 보너스를 받습니다.' : '비전문 부서 배치로 조정 비용이 발생합니다.'}</p>
                {active.scars.length > 0 && <div className="saga-scars"><b>남은 상처</b>{active.scars.map((scar) => <span key={scar}>{scar}</span>)}</div>}
              </article>
            </div>
          </div>

          {!active.approachId ? (
            <div className="saga-decision-room">
              <div className="saga-decision-heading"><BrainCircuit /><span><strong>이번 막의 대응 원칙을 선택하십시오</strong><small>선택 전에는 국면 진척이 멈춥니다. 수치에는 현재 참모·국가 역량·권력연합이 반영됩니다.</small></span></div>
              <div className="saga-approach-grid">
                {previews.map((preview) => (
                  <button key={preview.id} onClick={() => onApproach(preview.id)} disabled={context.politicalPower < preview.politicalCost || context.treasury < preview.treasuryCost}>
                    <span>{preview.id === 'command' ? <Landmark /> : preview.id === 'coalition' ? <Users /> : <Sparkles />}</span>
                    <strong>{preview.name}</strong>
                    <p>{preview.doctrine}</p>
                    <div><b>예상 +{preview.weeklyProgress}/주</b><em>압력 +{preview.weeklyPressure}/주</em></div>
                    <small>{preview.forecast}</small>
                    <footer>정치력 {preview.politicalCost} · 국고 {preview.treasuryCost}</footer>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="saga-running-order">
              <div>
                <CheckCircle2 />
                <span><strong>{currentPreview?.name} 진행 중</strong><small>{currentPreview?.forecast} · 다음 막에서는 다시 선택할 수 있습니다.</small></span>
              </div>
              <button onClick={onReserve} disabled={active.reserveCommitted || context.politicalPower < 3 || context.treasury < 10}>
                {active.reserveCommitted ? '예비자원 투입 완료' : '예비자원 투입'} <small>진척 +12 · 압력 +5</small>
              </button>
            </div>
          )}

          {!compact && active.turningPoints.length > 0 && (
            <details className="saga-chronicle">
              <summary><BookOpenText size={16} /> 인과관계 연대기 {active.turningPoints.length}건</summary>
              <div>{active.turningPoints.slice(0, 8).map((point) => <article key={`${point.week}-${point.title}`} className={point.tone}><span>{getCampaignYearForWeek(point.week)}년</span><strong>{point.title}</strong><p>{point.detail}</p></article>)}</div>
            </details>
          )}
        </>
      ) : state.offers.length > 0 ? (
        <div className="saga-offer-room">
          <div className="saga-offer-tabs" role="tablist" aria-label="시대 국면 선택">
            {state.offers.map((id) => {
              const definition = getStrategicSagaDefinition(id);
              return <button key={id} className={definition.id === selectedDefinition.id ? 'active' : ''} onClick={() => setSelectedOfferId(id)}><span>{domainLabels[definition.domain]}</span><strong>{definition.shortTitle}</strong></button>;
            })}
          </div>
          <div className="saga-offer-detail">
            <div>
              <span>{selectedDefinition.era} · {selectedDefinition.earliestYear}–{selectedDefinition.latestYear}</span>
              <h4>{selectedDefinition.title}</h4>
              <p>{selectedDefinition.premise}</p>
              <blockquote>{selectedDefinition.historicalPattern}</blockquote>
              <div className="saga-stakes"><AlertTriangle /><span><strong>위험과 약속</strong><small>{selectedDefinition.stakes}</small><b>유산 · {selectedDefinition.legacy}</b></span></div>
            </div>
            <aside>
              <label htmlFor="saga-champion">책임 참모</label>
              <select id="saga-champion" value={selectedChampion?.id ?? ''} onChange={(event) => setSelectedChampionId(event.target.value)}>
                {eligibleStaff.map((member) => <option key={member.id} value={member.id}>{member.name} · {departmentLabels[member.department]} · 역량 {member.ability}{selectedDefinition.preferredDepartments.includes(member.department) ? ' · 적합' : ''}</option>)}
              </select>
              {selectedChampion ? <div className="saga-champion-preview"><strong>{selectedChampion.role}</strong><small>{selectedChampion.specialty}</small><span>역량 {selectedChampion.ability} · 신뢰 {selectedChampion.loyalty} · 잠재 {selectedChampion.potential}</span></div> : <p className="saga-no-champion">임명 가능한 참모가 없습니다. 조직 운영에서 먼저 참모를 영입하십시오.</p>}
              <ol>{selectedDefinition.acts.map((item, index) => <li key={item.title}><b>{index + 1}</b><span><strong>{item.title}</strong><small>{item.question}</small></span></li>)}</ol>
              <button className="saga-start-button" disabled={!selectedChampion || context.politicalPower < 4 || context.treasury < 4} onClick={() => selectedChampion && onStart(selectedDefinition.id, championFrom(selectedChampion))}>이 국면을 국가 과제로 채택 <ArrowRight /></button>
            </aside>
          </div>
        </div>
      ) : (
        <div className="saga-empty"><CheckCircle2 /><span><strong>현재 장기 국면 없음</strong><small>{Math.max(0, state.nextOfferWeek - context.week)}주 안에 세계 조건을 반영한 새 국면이 열립니다.</small></span></div>
      )}

      {!compact && state.history.length > 0 && (
        <details className="saga-legacy-ledger">
          <summary><Crown size={16} /> 완결된 시대 유산 {state.history.length}건</summary>
          <div>{state.history.slice(0, 6).map((record) => <article key={record.id} className={record.outcome}><span>{record.outcome === 'transformative' ? '전환적' : record.outcome === 'contested' ? '타협적' : '상처 입음'}</span><strong>{record.title}</strong><p>{record.summary}</p><small>책임자 {record.championName} · {record.resolvedWeek - record.startedWeek}주</small></article>)}</div>
        </details>
      )}
    </section>
  );
}
