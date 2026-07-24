import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Eye,
  FileWarning,
  Fingerprint,
  Gauge,
  History,
  Landmark,
  MessageSquareMore,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Split,
  UserRoundCog,
  X,
} from 'lucide-react';
import { nations } from './campaign';
import {
  clandestineIncidentResponseLabels,
  getClandestineIncidentForecast,
  getClandestineMissionForecast,
  clandestinePostureLabels,
  clandestineResponseLabels,
  clandestineStatusLabels,
} from './clandestineCareer';
import type {
  ClandestineCareerState,
  ClandestineIncidentResponse,
  ClandestineMission,
  ClandestineMissionResponse,
  ClandestinePosture,
} from './clandestineCareer';
import { NationFlag } from './NationFlag';
import type { CareerRole } from './types';

interface ClandestineCareerCenterProps {
  state: ClandestineCareerState | null;
  role: CareerRole;
  week: number;
  intelNetwork: number;
  exposure: number;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  initialMissionId?: string | null;
  onMissionResponse: (missionId: string, response: ClandestineMissionResponse) => void;
  onIncidentResponse: (response: ClandestineIncidentResponse) => void;
  onPostureChange: (posture: ClandestinePosture) => void;
}

type ClandestineView = 'desk' | 'missions' | 'record';

const domainLabels: Record<ClandestineMission['domain'], string> = {
  military: '군사',
  diplomacy: '외교',
  technology: '기술',
  logistics: '군수',
  personnel: '인사',
  politics: '정치',
};

const responseIcons: Record<ClandestineMissionResponse, typeof Eye> = {
  'comply-full': FileWarning,
  'comply-selective': Eye,
  disinform: Split,
  'controlled-double': ShieldCheck,
  refuse: X,
};

function Metric({
  label,
  value,
  detail,
  inverse = false,
}: {
  label: string;
  value: number;
  detail: string;
  inverse?: boolean;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  const risky = inverse ? normalized >= 65 : normalized < 38;
  const healthy = inverse ? normalized < 38 : normalized >= 65;
  return (
    <div className={`clandestine-metric ${risky ? 'bad' : healthy ? 'good' : ''}`}>
      <span>{label}</span>
      <strong>{Math.round(normalized)}</strong>
      <i><b style={{ width: `${normalized}%` }} /></i>
      <small>{detail}</small>
    </div>
  );
}

function LockedClandestineDesk() {
  return (
    <div className="clandestine-locked">
      <Fingerprint size={38} />
      <span className="eyebrow">NO ACTIVE FOREIGN HANDLER</span>
      <h2>현재 비밀 소속이 없습니다</h2>
      <p>외국의 기밀 거래·비밀 고문·이중공작 제안을 수락하거나 직접 이중간첩 역제안을 보내면 이 화면에 핸들러·임무·양측 신뢰·방첩 조사가 생성됩니다.</p>
      <div className="clandestine-flow-strip">
        <span><b>1</b> 포섭·계약</span><ArrowRight size={14} />
        <span><b>2</b> 검증 임무</span><ArrowRight size={14} />
        <span><b>3</b> 진위 선택</span><ArrowRight size={14} />
        <span><b>4</b> 양측 반응</span><ArrowRight size={14} />
        <span><b>5</b> 조사·탈출·역포섭</span>
      </div>
    </div>
  );
}

export function ClandestineCareerCenter({
  state,
  role,
  week,
  intelNetwork,
  exposure,
  formatMoney,
  initialMissionId,
  onMissionResponse,
  onIncidentResponse,
  onPostureChange,
}: ClandestineCareerCenterProps) {
  const pendingMissions = useMemo(
    () => state?.missions.filter((mission) => mission.status === 'offered' || mission.status === 'in-progress') ?? [],
    [state?.missions],
  );
  const [view, setView] = useState<ClandestineView>(state?.incident ? 'desk' : pendingMissions.length > 0 ? 'missions' : 'desk');
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    initialMissionId ?? pendingMissions[0]?.id ?? state?.missions[0]?.id ?? null,
  );

  useEffect(() => {
    if (state?.incident) {
      setView('desk');
      return;
    }
    if (!initialMissionId) return;
    setSelectedMissionId(initialMissionId);
    setView('missions');
  }, [initialMissionId, state?.incident?.id]);

  if (!state) return <LockedClandestineDesk />;

  const homeNation = nations.find((nation) => nation.id === state.homeNationId) ?? nations[0];
  const handlerNation = nations.find((nation) => nation.id === state.handlerNationId) ?? nations[0];
  const selectedMission = state.missions.find((mission) => mission.id === selectedMissionId)
    ?? pendingMissions[0]
    ?? state.missions[0]
    ?? null;
  const canRespond = selectedMission?.status === 'offered' && !state.incident;

  return (
    <section className="clandestine-center" aria-label="비밀 소속 운영">
      <header className="clandestine-command-strip">
        <div className="clandestine-identity">
          <span className="eyebrow">TWO MASTERS · COMPARTMENTED CAREER</span>
          <strong>{state.coverName}</strong>
          <small>{role.title}의 공개 권한을 유지한 채 {handlerNation.shortName} 연락선과 연결됨</small>
          <em>{state.careerChapters[0]?.eraLabel ?? '비밀 경력 첫 장'} · 장기 경력 장부</em>
        </div>
        <div className="clandestine-allegiance">
          <NationFlag nationId={homeNation.id} decorative />
          <span><small>공개 소속</small><strong>{homeNation.shortName}</strong></span>
          <Split size={18} />
          <NationFlag nationId={handlerNation.id} decorative />
          <span><small>비밀 핸들러</small><strong>{handlerNation.shortName}</strong></span>
        </div>
        <div className={`clandestine-status status-${state.status}`}>
          <Radio size={15} />
          <span><small>현재 단계</small><strong>{clandestineStatusLabels[state.status]}</strong></span>
        </div>
      </header>

      <div className="clandestine-metrics" aria-label="비밀 신분 핵심 지표">
        <Metric label="본국 신뢰" value={state.homeTrust} detail="현 소속의 신임·보안인가" />
        <Metric label="핸들러 신뢰" value={state.handlerTrust} detail="외국의 보호·임무·보상 수준" />
        <Metric label="위장 강도" value={state.coverStrength} detail="공개 직무와 비밀 행동의 일관성" />
        <Metric label="접근권" value={state.accessLevel} detail="현재 보직에서 얻을 수 있는 정보 수준" />
        <Metric label="발각 위험" value={exposure} detail="누적된 방첩 단서와 접촉 흔적" inverse />
        <Metric label="심리 압박" value={state.stress} detail="판단 실패·강제 사건 발생 가능성" inverse />
      </div>

      <nav className="clandestine-tabs" aria-label="비밀 소속 세부 화면">
        <button className={view === 'desk' ? 'active' : ''} onClick={() => setView('desk')}><CircleGauge size={15} /> 이중생활 현황 {state.incident && <em>긴급</em>}</button>
        <button className={view === 'missions' ? 'active' : ''} onClick={() => setView('missions')}><BriefcaseBusiness size={15} /> 핸들러 임무 <em>{pendingMissions.length}</em></button>
        <button className={view === 'record' ? 'active' : ''} onClick={() => setView('record')}><History size={15} /> 비밀 기록 <em>{state.messages.length}</em></button>
      </nav>

      {view === 'desk' && (
        <div className="clandestine-desk">
          {state.incident && (
            <section className="clandestine-incident" aria-label="긴급 방첩 사건">
              <header>
                <ShieldAlert size={22} />
                <div><span>URGENT COUNTERINTELLIGENCE DECISION</span><h2>{state.incident.title}</h2><p>{state.incident.detail}</p></div>
                <em>시간 정지</em>
              </header>
              <ul>{state.incident.stakes.map((stake) => <li key={stake}><AlertTriangle size={13} /> {stake}</li>)}</ul>
              <div className="clandestine-incident-actions">
                {(Object.keys(clandestineIncidentResponseLabels) as ClandestineIncidentResponse[]).map((response) => {
                  const forecast = getClandestineIncidentForecast(state, response);
                  return (
                    <button key={response} onClick={() => onIncidentResponse(response)}>
                      <strong>{clandestineIncidentResponseLabels[response].title}</strong>
                      <small>{clandestineIncidentResponseLabels[response].detail}</small>
                      <span className="clandestine-action-forecast">
                        <b>노출 {forecast.exposureDelta >= 0 ? '+' : ''}{forecast.exposureDelta}</b>
                        <b>본국 {forecast.homeTrustDelta >= 0 ? '+' : ''}{forecast.homeTrustDelta}</b>
                        <b>{forecast.cooldownWeeks}주 안정화</b>
                      </span>
                      <em>{forecast.outcome}</em>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="clandestine-desk-grid">
            <section className="clandestine-handler-card">
              <header><MessageSquareMore size={18} /><div><span>FOREIGN CASE OFFICER</span><h3>{state.handlerAlias}</h3></div></header>
              <p>접촉은 게임 안에서 추상화된 비밀 연락망으로 처리됩니다. 구체적인 현실 공작 절차 대신 신뢰·압박·보호 약속과 정보 진위만 관리합니다.</p>
              <dl>
                <div><dt>주간 비밀수당</dt><dd>{formatMoney(Math.max(1, Math.round(3 + state.handlerTrust / 18)))}</dd></div>
                <div><dt>누적 비밀자금</dt><dd>{formatMoney(state.totalEarnings)}</dd></div>
                <div><dt>탈출 준비</dt><dd>{Math.round(state.extractionReadiness)}%</dd></div>
                <div><dt>완료 임무</dt><dd>{state.completedMissions}건</dd></div>
                <div><dt>실패·거부</dt><dd>{state.failedMissions}건</dd></div>
                <div><dt>경력 장</dt><dd>{state.careerChapters.length}개</dd></div>
              </dl>
              <div className="clandestine-handler-note">
                <Clock3 size={14} />
                {week < state.incidentCooldownUntilWeek ? (
                  <span>방첩 안정화 기간<strong>{state.incidentCooldownUntilWeek - week}주 뒤 사건 재평가</strong></span>
                ) : (
                  <span>다음 요구 예상<strong>제 {Math.max(week + 1, state.nextMissionWeek + 1)}주 전후</strong></span>
                )}
              </div>
            </section>

            <section className="clandestine-posture-panel">
              <header><UserRoundCog size={18} /><div><span>LONG-TERM DOCTRINE</span><h3>비밀 활동 기본 태세</h3></div></header>
              <p>매주 위장 회복·핸들러 압박·기만 성공·탈출 준비에 적용됩니다. 임무별 진위 선택과는 별개입니다.</p>
              <div className="clandestine-posture-grid">
                {(Object.keys(clandestinePostureLabels) as ClandestinePosture[]).map((posture) => (
                  <button
                    key={posture}
                    className={state.posture === posture ? 'active' : ''}
                    onClick={() => onPostureChange(posture)}
                    disabled={state.status === 'closed'}
                  >
                    <strong>{clandestinePostureLabels[posture].title}</strong>
                    <small>{clandestinePostureLabels[posture].detail}</small>
                    {state.posture === posture && <CheckCircle2 size={15} />}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <section className="clandestine-week-flow">
            <header><Activity size={17} /><div><span>WEEKLY PLAY LOOP</span><h3>한 주가 진행될 때 계산되는 것</h3></div></header>
            <ol>
              <li><b>1</b><span><strong>공개 직무 수행</strong><small>보직 성과·승진·참모 관계가 평소처럼 진행됩니다.</small></span></li>
              <li><b>2</b><span><strong>비밀 태세 적용</strong><small>위장·압박·스트레스·탈출 준비와 수당이 갱신됩니다.</small></span></li>
              <li><b>3</b><span><strong>임무 결과 검증</strong><small>접근권·진위 선택·상대 신뢰·방첩망으로 성공 여부를 계산합니다.</small></span></li>
              <li><b>4</b><span><strong>양국 자원 반영</strong><small>전황·정보망·정치력·지도부 신임에 실제 효과가 생깁니다.</small></span></li>
              <li><b>5</b><span><strong>새 요구·조사 판정</strong><small>누적 노출이 높으면 감사·충성심사·탈출 통보가 시간을 멈춥니다.</small></span></li>
            </ol>
          </section>
        </div>
      )}

      {view === 'missions' && (
        <div className="clandestine-mission-workspace">
          <aside className="clandestine-mission-list" aria-label="핸들러 임무 목록">
            {state.missions.map((mission) => (
              <button
                key={mission.id}
                className={`${selectedMission?.id === mission.id ? 'active' : ''} status-${mission.status}`}
                onClick={() => setSelectedMissionId(mission.id)}
              >
                <i>{mission.status === 'offered' ? <Radio size={15} /> : mission.status === 'in-progress' ? <Clock3 size={15} /> : mission.status === 'resolved' ? <CheckCircle2 size={15} /> : <FileWarning size={15} />}</i>
                <span><strong>{mission.codename}</strong><small>{mission.title}</small></span>
                <em>{mission.status === 'offered' ? `${Math.max(0, mission.deadlineWeek - week)}주` : mission.status === 'in-progress' ? '진행' : mission.status === 'resolved' ? '완료' : '종료'}</em>
              </button>
            ))}
            {state.missions.length === 0 && <div className="clandestine-list-empty">아직 도착한 핸들러 임무가 없습니다.</div>}
          </aside>

          <section className="clandestine-mission-detail">
            {selectedMission ? (
              <>
                <header>
                  <div className="clandestine-file-icon"><BookOpenCheck size={22} /></div>
                  <div><span>{selectedMission.eraLabel} · {domainLabels[selectedMission.domain]} · EYES ONLY · {selectedMission.codename}</span><h2>{selectedMission.title}</h2><p>{selectedMission.historicalPattern}</p></div>
                  <em>{selectedMission.status === 'offered' ? `제 ${selectedMission.deadlineWeek + 1}주 마감` : selectedMission.status === 'in-progress' ? `제 ${(selectedMission.resolutionWeek ?? week) + 1}주 검증` : selectedMission.resultTitle ?? '기록 종료'}</em>
                </header>

                <article className="clandestine-request">
                  <span><MessageSquareMore size={14} /> 핸들러 요구</span>
                  <strong>{selectedMission.objective}</strong>
                  <p>{selectedMission.handlerRationale}</p>
                </article>

                <div className="clandestine-mission-stats">
                  <Metric label="요구 접근권" value={selectedMission.accessRequired} detail={`현재 접근권 ${Math.round(state.accessLevel)}`} inverse />
                  <Metric label="본국 피해" value={selectedMission.dangerToHome} detail="진짜 정보 제공 시 전략적 피해" inverse />
                  <Metric label="핸들러 가치" value={selectedMission.handlerValue} detail="상대가 평가한 임무 중요도" />
                  <Metric label="위장 부담" value={selectedMission.coverRisk} detail="수행 과정의 추가 노출" inverse />
                </div>

                <ul className="clandestine-previews">
                  {selectedMission.previews.map((preview) => <li key={preview}><ArrowRight size={13} /> {preview}</li>)}
                </ul>

                {canRespond ? (
                  <div className="clandestine-response-grid">
                    {(Object.keys(clandestineResponseLabels) as ClandestineMissionResponse[]).map((response) => {
                      const Icon = responseIcons[response];
                      const disabled = response === 'controlled-double' && state.homeTrust < 25;
                      const forecast = getClandestineMissionForecast(state, selectedMission, response, { intelNetwork, exposure });
                      return (
                        <button key={response} onClick={() => onMissionResponse(selectedMission.id, response)} disabled={disabled}>
                          <Icon size={17} />
                          <span>
                            <strong>{clandestineResponseLabels[response].title}</strong>
                            <small>{disabled ? '본국 신뢰 25 이상 필요' : clandestineResponseLabels[response].detail}</small>
                            <i className="clandestine-action-forecast">
                              <b>{forecast.successChance === null ? '즉시 종료' : `성공 ${Math.round(forecast.successChance)}%`}</b>
                              <b>노출 {forecast.exposureDelta >= 0 ? '+' : ''}{forecast.exposureDelta}</b>
                              <b>본국 {forecast.homeTrustDelta >= 0 ? '+' : ''}{forecast.homeTrustDelta}</b>
                              <b>{forecast.riskLabel}</b>
                            </i>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : selectedMission.status === 'in-progress' ? (
                  <div className="clandestine-in-progress"><Clock3 size={17} /><span><strong>{clandestineResponseLabels[selectedMission.response ?? 'comply-selective'].title} 수행 중</strong><small>제 {(selectedMission.resolutionWeek ?? week) + 1}주에 결과·양측 신뢰·국가 피해가 확정됩니다.</small></span></div>
                ) : (
                  <div className={`clandestine-result result-${selectedMission.status}`}>
                    {selectedMission.status === 'resolved' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span><strong>{selectedMission.resultTitle ?? '임무 종료'}</strong><small>{selectedMission.resultDetail ?? '이 임무는 더 이상 대응할 수 없습니다.'}</small></span>
                  </div>
                )}
              </>
            ) : (
              <div className="clandestine-list-empty">임무를 선택하십시오.</div>
            )}
          </section>
        </div>
      )}

      {view === 'record' && (
        <div className="clandestine-record">
          <header>
            <div><span className="eyebrow">COMPARTMENTED RECORD</span><h3>핸들러·본국 방첩·결과 기록</h3></div>
            <div><span>진짜 정보</span><strong>{state.genuineLeaks}</strong><span>기만 성공</span><strong>{state.deceptionReports}</strong></div>
          </header>
          <section className="clandestine-chapter-ledger" aria-label="시대별 비밀 경력 장부">
            <header><History size={17} /><div><span>LONG CAREER LEDGER</span><h3>시대별 비밀 경력</h3></div></header>
            <div>
              {state.careerChapters.map((chapter, index) => (
                <article className={index === 0 ? 'active' : ''} key={chapter.id}>
                  <time>{1942 + Math.floor(chapter.startedWeek / 52)}년{chapter.endedWeek === null ? '–현재' : `–${1942 + Math.floor(chapter.endedWeek / 52)}년`}</time>
                  <strong>{chapter.eraLabel}</strong>
                  <p>{chapter.summary}</p>
                  <span>성공 {chapter.missionsResolved} · 실패·거부 {chapter.missionsFailed} · 방첩 위기 {chapter.incidents}</span>
                </article>
              ))}
            </div>
          </section>
          {state.messages.map((message) => (
            <article className={`tone-${message.tone}`} key={message.id}>
              <i>{message.sender === 'handler' ? <Radio size={15} /> : message.sender === 'home-counterintelligence' ? <Landmark size={15} /> : <Gauge size={15} />}</i>
              <time>제 {message.week + 1}주</time>
              <div><span>{message.sender === 'handler' ? `${handlerNation.shortName} 핸들러` : message.sender === 'home-counterintelligence' ? `${homeNation.shortName} 방첩기관` : '비밀 경력 시스템'}</span><strong>{message.title}</strong><p>{message.detail}</p></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
