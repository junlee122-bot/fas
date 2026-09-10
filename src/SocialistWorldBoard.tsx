import { getCampaignYearForWeek } from './campaignCalendar';
import { useId, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, BookOpenText, Building2, Factory, Globe2, Landmark, Scale, Sprout, Users, Vote } from 'lucide-react';
import {
  calculateSocialistModelOutlooks,
  getSocialistModelDefinition,
  getSocialistSettlementDefinition,
  getSocialistSettlementsForStage,
  previewSocialistTransitionMethod,
  type SocialistModelId,
  type SocialistSettlementId,
  type SocialistTransitionMethodId,
  type SocialistTransitionSponsor,
  type SocialistWorldContext,
  type SocialistWorldState,
} from './socialistWorld';
import type { StaffMember } from './types';

interface SocialistWorldBoardProps {
  state: SocialistWorldState;
  context: SocialistWorldContext;
  staff: StaffMember[];
  compact?: boolean;
  onStart: (modelId: SocialistModelId, sponsor: SocialistTransitionSponsor) => void;
  onSettlement: (settlementId: SocialistSettlementId) => void;
  onMethod: (methodId: SocialistTransitionMethodId) => void;
}

const stageLabels = ['혁명 연합', '소유권 재편', '권력의 형태', '세계질서 선택'];
const departmentLabels: Record<string, string> = { operations: '작전', logistics: '보급', armaments: '군수', personnel: '인사', political: '정치', science: '과학', economy: '경제' };
const modelIcons: Record<SocialistModelId, typeof Users> = {
  'popular-front': Vote,
  'council-commonwealth': Users,
  'central-plan': Factory,
  'peasant-commune': Sprout,
  'self-management': Building2,
  'market-socialism': Scale,
  'international-commonwealth': Globe2,
};

function Meter({ value, danger = false }: { value: number; danger?: boolean }) {
  return <span className={`socialist-meter ${danger ? 'danger' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function sponsorFrom(member: StaffMember): SocialistTransitionSponsor {
  return { id: member.id, name: member.name, department: member.department, ability: member.ability, loyalty: member.loyalty };
}

export function SocialistWorldBoard({ state, context, staff, compact = false, onStart, onSettlement, onMethod }: SocialistWorldBoardProps) {
  const titleId = useId();
  const sponsorId = useId();
  const outlooks = calculateSocialistModelOutlooks(state, context);
  const firstSelectable = outlooks.find((outlook) => outlook.available) ?? outlooks[0];
  const [selectedModelId, setSelectedModelId] = useState<SocialistModelId>(firstSelectable.definition.id);
  const selectedOutlook = outlooks.find((outlook) => outlook.definition.id === selectedModelId) ?? firstSelectable;
  const selectedDefinition = selectedOutlook.definition;
  const eligibleStaff = useMemo(() => [...staff]
    .sort((left, right) => {
      const leftFit = selectedDefinition.preferredDepartments.includes(left.department) ? 18 : 0;
      const rightFit = selectedDefinition.preferredDepartments.includes(right.department) ? 18 : 0;
      return right.ability + right.loyalty * .2 + rightFit - (left.ability + left.loyalty * .2 + leftFit);
    })
    .slice(0, 8), [selectedDefinition, staff]);
  const [selectedSponsorId, setSelectedSponsorId] = useState('');
  const selectedSponsor = eligibleStaff.find((member) => member.id === selectedSponsorId) ?? eligibleStaff[0] ?? null;
  const active = state.active;
  const activeDefinition = active ? getSocialistModelDefinition(active.targetModelId) : null;
  const stageSettlements = active ? getSocialistSettlementsForStage(active.stageIndex) : [];
  const adoptedSettlement = active?.settlementId ? getSocialistSettlementDefinition(active.settlementId) : null;
  const methodPreviews = active ? (['constitutional', 'mass-mobilization', 'party-command'] as SocialistTransitionMethodId[])
    .map((methodId) => previewSocialistTransitionMethod(state, methodId, context))
    .filter((preview): preview is NonNullable<typeof preview> => Boolean(preview)) : [];
  const currentDefinition = state.currentModelId ? getSocialistModelDefinition(state.currentModelId) : null;

  return (
    <section className={`nation-surface socialist-world-board ${compact ? 'compact' : ''}`} aria-labelledby={titleId}>
      <header>
        <div>
          <span>SOCIAL ORDER · 선택이 축적되는 사회주의 가능세계</span>
          <h3 id={titleId}>{activeDefinition?.name ?? currentDefinition?.name ?? '혁명·개혁·연립의 갈림길'}</h3>
        </div>
        <div className="socialist-world-status">
          <span className={state.currentModelId ? 'established' : ''}>{state.currentModelId ? '체제 성립' : '기존 혼합질서'}</span>
          <b>{state.stage === 'latent' ? '잠재 경쟁' : state.stage === 'consolidated' ? '제도화' : state.stage === 'fractured' ? '전환 위기' : '전환 진행'}</b>
        </div>
      </header>

      <div className="socialist-pressure-strip">
        {[
          ['계급 압력', state.classPressure, state.classPressure >= 70],
          ['노동 조직', state.workerOrganization, false],
          ['농촌 동원', state.peasantMobilization, false],
          ['당 통제', state.partyControl, state.partyControl >= 75],
          ['평의회 권력', state.councilPower, false],
          ['사회적 소유', state.socialOwnership, false],
          ['시장 허용', state.marketAllowance, false],
          ['강제력', state.coercion, state.coercion >= 65],
        ].map(([label, value, danger]) => <span key={label as string}><small>{label as string}</small><strong>{Math.round(Number(value))}</strong><Meter value={Number(value)} danger={Boolean(danger)} /></span>)}
      </div>
      <div className="socialist-system-risk-strip" aria-label="체제 전환과 장기 운영 위험">
        {[
          ['자본·인력 유출', state.capitalFlight, state.capitalFlight >= 65],
          ['국제 압력', state.foreignPressure, state.foreignPressure >= 70],
          ['반혁명 위험', state.counterrevolutionRisk, state.counterrevolutionRisk >= 70],
          ['관료 포획', state.bureaucraticCapture, state.bureaucraticCapture >= 72],
          ['협동조합 부문', state.cooperativeSector, false],
          ['생산 민주성', state.productiveDemocracy, false],
        ].map(([label, value, danger]) => <span key={label as string} className={Boolean(danger) ? 'danger' : ''}><small>{label as string}</small><strong>{Math.round(Number(value))}</strong></span>)}
      </div>

      {active && activeDefinition ? (
        <div className="socialist-transition-room">
          <div className="socialist-stage-rail" aria-label="사회체제 전환 단계">
            {stageLabels.map((label, index) => <span key={label} className={index < active.stageIndex ? 'done' : index === active.stageIndex ? 'active' : ''}><b>{index + 1}</b><small>{label}</small></span>)}
          </div>
          <div className="socialist-transition-summary">
            <article>
              <span>{activeDefinition.doctrine}</span>
              <h4>{stageLabels[active.stageIndex]}</h4>
              <p>{active.stageIndex === 0 ? '노동자·농민·당·시민·민족해방 세력 중 누가 전환의 주체이며 누가 거부권을 갖는지 결정합니다.' : active.stageIndex === 1 ? '토지·은행·대기업·중소재산의 소유와 보상, 운영권을 구체적으로 나눕니다.' : active.stageIndex === 2 ? '당·의회·평의회·지역·사법기관 사이의 최종 결정권과 소환 규칙을 정합니다.' : '혁명 수출·블록 동맹·비동맹·평화공존·공동계획 중 외부 세계와의 관계를 정합니다.'}</p>
              <div className="socialist-progress-row"><span>전환 진척</span><Meter value={active.progress} /><b>{Math.round(active.progress)}</b></div>
              <div className="socialist-progress-row"><span>내부 모순</span><Meter value={active.contradiction} danger /><b>{Math.round(active.contradiction)}</b></div>
              <div className="socialist-transition-facts"><span>대중 위임 {Math.round(active.mandate)}</span><span>후퇴 {active.setbacks}</span><span>책임자 {active.sponsor.name}</span></div>
              {active.settlements.length > 0 ? <div className="socialist-settlement-path" aria-label="채택한 제도 합의">{active.settlements.map((settlementId, index) => <span key={settlementId}><b>{index + 1}</b>{getSocialistSettlementDefinition(settlementId).shortName}</span>)}</div> : null}
            </article>
            <aside>
              <strong>목표 체제의 약속</strong><p>{activeDefinition.promise}</p>
              <strong>역사적으로 확인된 위험</strong><p>{activeDefinition.danger}</p>
              {active.scars.length > 0 ? <div className="socialist-scars">{active.scars.map((scar) => <span key={scar}>{scar}</span>)}</div> : null}
            </aside>
          </div>
          {active.settlementId === null ? (
            <div className="socialist-settlement-section">
              <header><span>INSTITUTIONAL SETTLEMENT</span><strong>{stageLabels[active.stageIndex]}의 제도 합의</strong><p>목표 이념이 같아도 이 선택이 실제 소유권·거부권·국제관계와 장기 위험을 결정합니다.</p></header>
              <div className="socialist-settlement-grid">
                {stageSettlements.map((settlement) => (
                  <button type="button" key={settlement.id} onClick={() => onSettlement(settlement.id)} disabled={context.politicalPower < settlement.politicalCost || context.treasury < settlement.treasuryCost}>
                    <span className={`profile ${settlement.profile}`}>{settlement.profile === 'plural' ? '다원' : settlement.profile === 'centralized' ? '집중' : settlement.profile === 'participatory' ? '자치' : '혼합'}</span>
                    <strong>{settlement.name}</strong>
                    <p>{settlement.description}</p>
                    <small>{settlement.consequence}</small>
                    <em>{settlement.historicalBasis}</em>
                    <footer><b>정치력 {settlement.politicalCost} · 국고 {settlement.treasuryCost}</b><span>진척 {settlement.progressModifier >= 0 ? '+' : ''}{settlement.progressModifier} · 모순 {settlement.contradictionModifier >= 0 ? '+' : ''}{settlement.contradictionModifier}</span></footer>
                  </button>
                ))}
              </div>
            </div>
          ) : active.methodId === null ? (
            <>
              <div className="socialist-adopted-settlement"><span><b>{adoptedSettlement?.name}</b><small>{adoptedSettlement?.consequence}</small></span>{adoptedSettlement ? <a href={adoptedSettlement.sourceUrl} target="_blank" rel="noreferrer">{adoptedSettlement.sourceLabel}</a> : null}</div>
            <div className="socialist-method-grid">
              {methodPreviews.map((preview) => (
                <button type="button" key={preview.id} onClick={() => onMethod(preview.id)} disabled={context.politicalPower < preview.politicalCost || context.treasury < preview.treasuryCost}>
                  <span>{preview.id === 'constitutional' ? <Vote /> : preview.id === 'mass-mobilization' ? <Users /> : <Landmark />}</span>
                  <strong>{preview.name}</strong>
                  <p>{preview.description}</p>
                  <div><b>진척 +{preview.weeklyProgress}/주</b><em>모순 +{preview.weeklyContradiction}/주</em></div>
                  <small>{preview.forecast}</small>
                  <footer>정치력 {preview.politicalCost} · 국고 {preview.treasuryCost}</footer>
                </button>
              ))}
            </div>
            </>
          ) : (
            <div className="socialist-running-method"><span><strong>{adoptedSettlement?.shortName} · {methodPreviews.find((preview) => preview.id === active.methodId)?.name} 진행 중</strong><small>제도 합의와 집행 방법이 함께 계산됩니다. 다음 단계에서는 둘 다 다시 선택할 수 있으며 내부 모순이 먼저 100에 닿으면 상처가 남습니다.</small></span></div>
          )}
          {!compact && active.turningPoints.length > 0 ? <details className="socialist-chronicle"><summary><BookOpenText /> 전환 연대기 {active.turningPoints.length}건</summary><div>{active.turningPoints.slice(0, 8).map((point) => <article key={`${point.week}-${point.title}`} className={point.tone}><span>{getCampaignYearForWeek(point.week)}년</span><strong>{point.title}</strong><p>{point.detail}</p></article>)}</div></details> : null}
        </div>
      ) : (
        <div className="socialist-model-room">
          <div className="socialist-model-rail" role="tablist" aria-label="사회주의 가능세계 모델">
            {outlooks.map((outlook) => {
              const Icon = modelIcons[outlook.definition.id];
              return <button type="button" role="tab" aria-selected={selectedDefinition.id === outlook.definition.id} key={outlook.definition.id} className={`${selectedDefinition.id === outlook.definition.id ? 'active' : ''} ${state.currentModelId === outlook.definition.id ? 'current' : ''}`} onClick={() => setSelectedModelId(outlook.definition.id)}><Icon /><span><strong>{outlook.definition.shortName}</strong><small>성립 가능성 {Math.round(outlook.viability)}</small></span></button>;
            })}
          </div>
          <div className="socialist-model-detail">
            <div>
              <span>{selectedDefinition.doctrine}</span>
              <h4>{selectedDefinition.name}</h4>
              <p>{selectedDefinition.premise}</p>
              <dl>
                <div><dt>소유</dt><dd>{selectedDefinition.ownership}</dd></div>
                <div><dt>권력</dt><dd>{selectedDefinition.government}</dd></div>
                <div><dt>경제</dt><dd>{selectedDefinition.economy}</dd></div>
                <div><dt>세계</dt><dd>{selectedDefinition.international}</dd></div>
              </dl>
              <div className="socialist-historical-basis"><BookOpenText /><span><strong>역사적 기반</strong><p>{selectedDefinition.historicalBasis}</p><a href={selectedDefinition.sourceUrl} target="_blank" rel="noreferrer">{selectedDefinition.sourceLabel}</a></span></div>
            </div>
            <aside>
              <div className="socialist-viability"><span>현재 성립 가능성</span><strong>{Math.round(selectedOutlook.viability)}</strong><Meter value={selectedOutlook.viability} /><p>{selectedOutlook.projected}</p></div>
              {selectedOutlook.strengths.length > 0 ? <div className="socialist-strengths"><b>현재 기반</b>{selectedOutlook.strengths.map((strength) => <span key={strength}>{strength}</span>)}</div> : null}
              {selectedOutlook.blockers.length > 0 ? <div className="socialist-blockers"><b>취약점</b>{selectedOutlook.blockers.map((blocker) => <span key={blocker}>{blocker}</span>)}</div> : null}
              <label htmlFor={sponsorId}>전환 책임자</label>
              <select id={sponsorId} value={selectedSponsor?.id ?? ''} onChange={(event) => setSelectedSponsorId(event.target.value)}>{eligibleStaff.map((member) => <option key={member.id} value={member.id}>{member.name} · {departmentLabels[member.department]} · 역량 {member.ability}{selectedDefinition.preferredDepartments.includes(member.department) ? ' · 적합' : ''}</option>)}</select>
              <button type="button" className="socialist-start-button" disabled={!selectedOutlook.available || !selectedSponsor || context.politicalPower < 8 || context.treasury < 10} onClick={() => selectedSponsor && onStart(selectedDefinition.id, sponsorFrom(selectedSponsor))}>{state.currentModelId ? '체제개혁·노선전환 회의 소집' : '사회체제 전환회의 소집'} <ArrowRight /></button>
              {!selectedOutlook.available ? <small className="socialist-lock-note">{state.currentModelId === selectedDefinition.id ? '현재 운용 중인 체제입니다.' : context.week < state.reformCooldownUntil ? `개혁 평가까지 ${state.reformCooldownUntil - context.week}주` : selectedOutlook.blockers[0] ?? '권력·노동·사회 조건이 아직 부족합니다.'}</small> : null}
            </aside>
          </div>
        </div>
      )}

      {!compact && state.history.length > 0 ? <details className="socialist-history"><summary><BookOpenText /> 성립·개혁된 사회주의 세계 {state.history.length}건</summary><div>{state.history.slice(0, 6).map((record) => <article key={record.id} className={record.outcome}><span>{record.outcome === 'plural' ? '다원적' : record.outcome === 'centralized' ? '중앙집중' : '경합적'}</span><strong>{record.modelName}</strong><p>{record.summary}</p><small>{record.constitutionalProfile} · {record.sponsorName} · {record.resolvedWeek - record.startedWeek}주</small></article>)}</div></details> : null}
      <p className="socialist-system-note"><AlertTriangle /> 이 체계는 공산주의를 단일 보너스나 필연적 결말로 취급하지 않습니다. 생산·복지·평등의 성과와 강제·부족·관료화·분열의 비용이 같은 규칙에서 함께 계산됩니다.</p>
    </section>
  );
}
