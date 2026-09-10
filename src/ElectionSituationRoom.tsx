import { useState, type CSSProperties } from 'react';
import { BadgeDollarSign, BarChart3, Building2, CalendarDays, CheckCircle2, Landmark, MapPinned, Megaphone, Radio, Scale, ShieldCheck, Users, Vote } from 'lucide-react';
import {
  canUseElectionAction,
  electionCampaignActions,
  getElectionActionPresentation,
  getElectionEraProfile,
  getCampaignStageName,
  getElectionTypeName,
  getExecutiveModelName,
  getVotingSystemName,
  referendumDefinitions,
  type ElectionCampaignActionId,
  type ElectoralPoliticsState,
  type ReferendumTopicId,
} from './electoralPolitics';
import type { EconomyState } from './economy';
import type { NationManagementState } from './nationManagement';
import type { CareerRole, GameState } from './types';

interface ElectionSituationRoomProps {
  state: ElectoralPoliticsState;
  nation: NationManagementState;
  game: GameState;
  economy: EconomyState;
  role: CareerRole;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onCampaignAction: (actionId: ElectionCampaignActionId, regionId: string | null) => void;
  onLaunchReferendum: (topicId: ReferendumTopicId) => void;
}

const actionIcons: Record<ElectionCampaignActionId, typeof Megaphone> = {
  'mass-rally': Megaphone,
  'radio-address': Radio,
  'policy-manifesto': Landmark,
  'public-debate': Users,
  'fundraising-drive': BadgeDollarSign,
  'coalition-pact': Scale,
  'local-endorsement': MapPinned,
  'integrity-commission': ShieldCheck,
};

export function ElectionSituationRoom({ state, nation, game, economy, role, formatMoney, onCampaignAction, onLaunchReferendum }: ElectionSituationRoomProps) {
  const [targetRegionId, setTargetRegionId] = useState(state.regions[0]?.id ?? '');
  const campaign = state.activeCampaign;
  const targetRegion = state.regions.find((region) => region.id === targetRegionId) ?? state.regions[0];
  const latestResult = state.campaignHistory[0] ?? null;
  const latestLocalResult = state.campaignHistory.find((result) => result.type === 'local') ?? null;
  const totalElectors = state.regions.reduce((sum, region) => sum + region.electors, 0);
  const totalSeats = state.regions.reduce((sum, region) => sum + region.seats, 0);
  const weeksToNational = Math.max(0, Math.min(state.nextPresidentialWeek, state.nextParliamentaryWeek) - game.week);
  const weeksToLocal = Math.max(0, state.nextLocalWeek - game.week);
  const electionEra = getElectionEraProfile(game.week);

  return (
    <section className="nation-surface election-situation-room">
      <header>
        <div><span>선거·국민투표 상황실</span><h3>누가, 어디에서, 어떤 위임을 얻는가</h3></div>
        <small>{getExecutiveModelName(state.executiveModelId)} · {getVotingSystemName(state.votingSystemId)}<br />{electionEra.name}</small>
      </header>

      <div className="election-system-strip">
        <article><Landmark /><span>행정부 구성</span><strong>{getExecutiveModelName(state.executiveModelId)}</strong><small>국가체제와 국민투표로 변경 가능</small></article>
        <article><Vote /><span>득표 환산</span><strong>{getVotingSystemName(state.votingSystemId)}</strong><small>선거인 {totalElectors} · 의석 {totalSeats}</small></article>
        <article><CalendarDays /><span>전국 선거</span><strong>{weeksToNational}주 후</strong><small>지방·시장 선거 {weeksToLocal}주 후</small></article>
        <article><ShieldCheck /><span>선거 신뢰</span><strong>{state.electoralIntegrity.toFixed(1)}</strong><small>참여 {state.participation.toFixed(1)} · 정당 분산 {state.partyFragmentation.toFixed(1)}</small></article>
      </div>

      {campaign ? (
        <>
          <div className="election-campaign-hero">
            <div>
              <span>{getElectionTypeName(campaign.type)} · {campaign.round === 2 ? '결선' : '본선'} · 제{campaign.electionWeek + 1}주 투표</span>
              <h4>{getCampaignStageName(campaign.stage)}</h4>
              <p>남은 {Math.max(0, campaign.electionWeek - game.week)}주 동안 지역 판세·후보 기세·투표율·선거 신뢰가 최종 득표, 선거인단, 의석과 시장 당선을 결정합니다.</p>
              <p className="election-era-note"><b>{electionEra.period} · {electionEra.dominantChannel}</b> {electionEra.description} 위험: {electionEra.trustRisk}.</p>
            </div>
            <div className="election-campaign-metrics">
              <span><small>예상 투표율</small><strong>{campaign.turnoutProjection.toFixed(1)}%</strong></span>
              <span><small>절차 신뢰</small><strong>{campaign.integrity.toFixed(1)}</strong></span>
              <span><small>유세 자금</small><strong>{formatMoney(campaign.campaignFunds)}</strong></span>
              <span><small>양극화</small><strong>{campaign.polarization.toFixed(1)}</strong></span>
            </div>
          </div>

          {campaign.type === 'referendum' ? (
            <div className="referendum-live-card">
              <Vote />
              <div><small>국민투표 문안</small><strong>{referendumDefinitions.find((topic) => topic.id === campaign.referendumTopicId)?.question}</strong><p>찬성 진영 기세 {(campaign.momentum.yes ?? 0).toFixed(1)} · 반대 진영 기세 {(campaign.momentum.no ?? 0).toFixed(1)}</p></div>
            </div>
          ) : (
            <div className="candidate-poll-grid">
              {campaign.candidateIds.map((candidateId) => {
                const candidate = state.candidates.find((item) => item.id === candidateId);
                if (!candidate) return null;
                const momentum = campaign.momentum[candidate.id] ?? candidate.baseSupport;
                const governing = candidate.id === campaign.playerCandidateId;
                return (
                  <article key={candidate.id} className={governing ? 'player' : ''} style={{ '--candidate-color': candidate.color } as CSSProperties}>
                    <div><span>{candidate.party}</span>{governing && <em>플레이 진영</em>}</div>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.ideology} · {candidate.historicalOffice}</small>
                    <div className="candidate-momentum"><i style={{ width: `${Math.min(100, momentum)}%` }} /><b>{momentum.toFixed(1)}</b></div>
                    <p>연설 {candidate.charisma} · 조직 {candidate.organization} · 정책 {candidate.policy} · 청렴 {candidate.integrity}</p>
                  </article>
                );
              })}
            </div>
          )}

          <div className="election-action-layout">
            <div className="election-region-target">
              <label htmlFor="election-target-region">집중 유세 지역</label>
              <select id="election-target-region" value={targetRegion?.id ?? ''} onChange={(event) => setTargetRegionId(event.target.value)}>
                {state.regions.map((region) => <option key={region.id} value={region.id}>{region.name} · {region.principalCity} · 선거인 {region.electors} · 의석 {region.seats}</option>)}
              </select>
              {targetRegion && <p>유권자 {(targetRegion.electorate / 1_000_000).toFixed(2)}M · 도시화 {targetRegion.urbanity} · 노동조직 {targetRegion.laborStrength} · 기성조직 {targetRegion.establishmentStrength}</p>}
            </div>
            <div className="election-action-grid">
              {electionCampaignActions.map((action) => {
                const presentation = getElectionActionPresentation(action, game.week);
                const Icon = actionIcons[action.id];
                const allowed = canUseElectionAction(role, action);
                const needsRegion = action.id === 'mass-rally' || action.id === 'local-endorsement';
                const affordable = game.politicalPower >= action.politicalCost && game.treasury >= action.treasuryCost;
                const repetitions = campaign.actions.filter((record) => record.actionId === action.id).length;
                return (
                  <button key={action.id} disabled={!allowed || !affordable || (needsRegion && !targetRegion)} onClick={() => onCampaignAction(action.id, needsRegion ? targetRegion?.id ?? null : null)}>
                    <Icon />
                    <span><strong>{presentation.name}</strong><small>{presentation.description}</small></span>
                    <em>정치 {action.politicalCost} · {action.treasuryCost ? formatMoney(action.treasuryCost) : '국고 0'}{repetitions ? ` · ${repetitions}회 시행` : ''}</em>
                    <b>{allowed ? `${action.effect} · ${electionEra.name}` : `${role.title} 권한 밖`}</b>
                  </button>
                );
              })}
            </div>
          </div>

          {campaign.actions.length > 0 && <div className="campaign-action-log"><h4>이번 선거운동 기록</h4>{[...campaign.actions].reverse().slice(0, 8).map((record) => <article key={record.id}><span>제{record.week + 1}주</span><strong>{record.detail}</strong><small>기세 {record.momentumDelta >= 0 ? '+' : ''}{record.momentumDelta} · 신뢰 {record.integrityDelta >= 0 ? '+' : ''}{record.integrityDelta} · 투표율 {record.turnoutDelta >= 0 ? '+' : ''}{record.turnoutDelta}</small></article>)}</div>}
        </>
      ) : (
        <div className="election-idle-state"><CheckCircle2 /><div><strong>현재 진행 중인 전국 투표가 없습니다</strong><p>다음 법정 선거 8주 전 자동으로 후보 등록이 시작됩니다. 그 전에는 아래에서 헌정·자치·참정권·전후조약 국민투표를 발의할 수 있습니다.</p></div></div>
      )}

      <div className="referendum-launcher">
        <div className="referendum-launcher-heading"><Vote /><div><span>국민투표 발의</span><h4>헌정과 국가의 장기 진로를 직접 표결</h4></div><small>정치 보직 2단계 이상 · 진행 중 선거가 없어야 함</small></div>
        <div>
          {referendumDefinitions.map((topic) => {
            const completed = state.passedReferendums.includes(topic.id);
            const allowed = !campaign && !completed && role.branch === 'politics' && role.tier <= 2 && nation.legitimacy >= topic.minimumLegitimacy && game.politicalPower >= topic.politicalCost && game.treasury >= topic.treasuryCost;
            return <button key={topic.id} disabled={!allowed} onClick={() => onLaunchReferendum(topic.id)}><span>{topic.name}</span><strong>{topic.question}</strong><p>{topic.description}</p><small>정치 {topic.politicalCost} · {formatMoney(topic.treasuryCost)} · 정통성 {topic.minimumLegitimacy}+</small><em>{completed ? '통과·헌정 반영 완료' : campaign ? '현재 투표 종료 뒤 발의 가능' : allowed ? '6주 국민투표 발의' : '권한 또는 자원 부족'}</em></button>;
          })}
        </div>
      </div>

      {latestResult && (
        <div className="election-results-ledger">
          <div className="election-result-heading"><BarChart3 /><div><span>최근 확정 결과 · 제{latestResult.week + 1}주</span><h4>{latestResult.title}</h4><p>{latestResult.summary} · 신뢰 {latestResult.integrity.toFixed(1)}</p></div><strong>{latestResult.winnerName}</strong></div>
          {latestResult.referendum ? (
            <div className="referendum-result"><span><b>찬성 {latestResult.referendum.yesShare.toFixed(1)}%</b><i style={{ width: `${latestResult.referendum.yesShare}%` }} /></span><span><b>반대 {(100 - latestResult.referendum.yesShare).toFixed(1)}%</b><i style={{ width: `${100 - latestResult.referendum.yesShare}%` }} /></span><p>{latestResult.consequence}</p></div>
          ) : (
            <>
              <div className="candidate-result-table">
                {latestResult.candidateResults.map((result, index) => <article key={result.candidateId} className={index === 0 ? 'winner' : ''}><span>{index + 1}</span><div><strong>{result.name}</strong><small>{result.party}</small></div><b>{result.voteShare.toFixed(2)}%</b><em>{state.votingSystemId === 'electoral-college' ? `선거인 ${result.electors}` : latestResult.type === 'parliamentary' ? `의석 ${result.seats}` : `${result.votes.toLocaleString()}표`}</em></article>)}
              </div>
              <div className="regional-result-grid">
                {latestResult.regionalResults.map((region) => <article key={region.regionId}><MapPinned /><span><strong>{region.regionName}</strong><small>{region.principalCity} · 투표율 {region.turnout.toFixed(1)}%</small></span><b>{region.winnerParty}</b><em>격차 {region.margin.toFixed(1)}%p</em></article>)}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mayor-results-board">
        <div><Building2 /><span><small>지방 권력</small><strong>주요 도시 시장 선거 결과</strong></span></div>
        {latestLocalResult ? <div>{latestLocalResult.mayorResults.map((mayor) => <article key={mayor.city} className={mayor.alignment}><span>{mayor.city}</span><strong>{mayor.winnerName}</strong><small>{mayor.voteShare.toFixed(1)}% · 투표율 {mayor.turnout.toFixed(1)}%</small><em>{mayor.alignment === 'government' ? '정부 협력' : mayor.alignment === 'opposition' ? '야권 견제' : '무소속'}</em></article>)}</div> : <p>첫 지방·시장 선거는 {weeksToLocal}주 뒤 실시됩니다. 전국 선거의 지역 유세와 시장 후보 공동유세가 이 결과에도 누적됩니다.</p>}
      </div>

      <footer className="election-causality-note"><span>현재 국정 변수</span><p>국민 위임 {nation.mandateScore} · 정통성 {Math.round(nation.legitimacy)} · 사회 불안 {Math.round(nation.unrest)} · 물가 {economy.inflation.toFixed(1)}% · 제도 역량 {Math.round(nation.institutionalCapacity)}. 이 값들이 유세 행동과 함께 지역별 득표·투표율·선거 불복 위험에 반영됩니다.</p></footer>
    </section>
  );
}
