import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Newspaper,
  Trophy,
} from 'lucide-react';
import { achievementCategoryDestinations, achievementCategoryLabels } from './achievements';
import type { AchievementDefinition, AchievementProgress } from './achievements';
import { calculateProductionGains } from './engine';
import { getEquipmentNode } from './equipment';
import { GameIcon } from './GameIcon';
import { NationFlag } from './NationFlag';
import { NationalSimulationOverview } from './NationalSimulationOverview';
import type { NationalSimulationSnapshot } from './nationalSimulation';
import { formatOutbreakPhase } from './publicHealth';
import type { PublicHealthState } from './publicHealth';
import type {
  CareerRole,
  CareerState,
  Division,
  EquipmentDevelopmentState,
  Faction,
  GameState,
  GameTab,
  NationProfile,
  Order,
  ProductionLine,
  ResearchProject,
  StaffCandidate,
  StaffMember,
  Stockpile,
  Territory,
  TheaterId,
  WarEvent,
} from './types';
import type { UXAction } from './ux';
import type { WorldWeeklyIssue } from './worldWeeklyEngine';

type PortalFilter = 'all' | 'tasks' | 'reports';

interface CommandDashboardProps {
  nation: NationProfile;
  role: CareerRole;
  career: CareerState;
  game: GameState;
  activeTheater: TheaterId;
  playerFaction: Exclude<Faction, 'neutral'>;
  territories: Territory[];
  divisions: Division[];
  orders: Order[];
  production: ProductionLine[];
  stockpile: Stockpile;
  research: ResearchProject[];
  equipmentDevelopment: EquipmentDevelopmentState;
  staff: StaffMember[];
  candidates: StaffCandidate[];
  events: WarEvent[];
  actions: UXAction[];
  publicHealth: PublicHealthState;
  nationalSimulation: NationalSimulationSnapshot;
  weeklyIssue: WorldWeeklyIssue | null;
  weeklyUnread: boolean;
  objectiveProgress: number;
  achievement?: AchievementDefinition;
  achievementProgress?: AchievementProgress;
  achievementTracked?: boolean;
  onNavigate: (tab: GameTab) => void;
  onAction: (action: UXAction) => void;
  onOpenActionCenter: () => void;
  onOpenJournal: () => void;
  onOpenWorldWeekly: () => void;
  onOpenAchievements: () => void;
  onNextWeek: () => void;
}

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));

const priorityLabels = {
  urgent: '즉시 결재',
  recommended: '권장 업무',
  info: '상황 보고',
};

export function CommandDashboard({
  nation,
  role,
  career,
  game,
  activeTheater,
  playerFaction,
  territories,
  divisions,
  orders,
  production,
  stockpile,
  research,
  equipmentDevelopment,
  staff,
  candidates,
  events,
  actions,
  publicHealth,
  nationalSimulation,
  weeklyIssue,
  weeklyUnread,
  objectiveProgress,
  achievement,
  achievementProgress,
  achievementTracked = false,
  onNavigate,
  onAction,
  onOpenActionCenter,
  onOpenJournal,
  onOpenWorldWeekly,
  onOpenAchievements,
  onNextWeek,
}: CommandDashboardProps) {
  const [filter, setFilter] = useState<PortalFilter>('all');
  const theaterTerritories = useMemo(
    () => territories.filter((territory) => (territory.theater ?? 'europe') === activeTheater),
    [activeTheater, territories],
  );
  const frontTerritories = useMemo(() => theaterTerritories.filter((territory) => (
    territory.controller === playerFaction
    && territory.neighbors.some((neighborId) => {
      const controller = territories.find((candidate) => candidate.id === neighborId)?.controller;
      return controller !== undefined && controller !== playerFaction && controller !== 'neutral';
    })
  )).sort((left, right) => left.supply - right.supply), [playerFaction, territories, theaterTerritories]);

  const usedFactories = production.reduce((total, line) => total + line.assigned, 0);
  const activeResearch = research.filter((project) => project.active && !project.complete);
  const readyDivisions = divisions.filter((division) => division.status === 'ready').length;
  const averageSupply = divisions.reduce((total, division) => total + division.supply, 0) / Math.max(1, divisions.length);
  const averageStrength = divisions.reduce((total, division) => total + division.strength, 0) / Math.max(1, divisions.length);
  const overloadedStaff = staff.filter((member) => member.workload >= 80).length;
  const recruitmentLeads = candidates.filter((candidate) => candidate.status === 'shortlisted' || candidate.status === 'scouting').length;
  const activeEquipment = getEquipmentNode(equipmentDevelopment.activeProjectId ?? '');
  const weeklyProduction = calculateProductionGains(production, game.week + 1);
  const readiness = Math.round((game.stability + game.warSupport + averageSupply + averageStrength + game.victoryScore) / 5);
  const urgentCount = actions.filter((action) => action.priority === 'urgent').length;
  const controlledCount = theaterTerritories.filter((territory) => territory.controller === playerFaction).length;
  const opponentCount = theaterTerritories.filter((territory) => territory.controller !== playerFaction && territory.controller !== 'neutral').length;
  const readinessStyle = useMemo(() => ({ '--readiness': `${readiness * 3.6}deg` }) as CSSProperties, [readiness]);
  const primaryAction = actions[0];
  const weeklyLead = weeklyIssue?.articles.find((article) => article.id === weeklyIssue.leadArticleId) ?? weeklyIssue?.articles[0];
  const achievementDestination = achievement ? achievementCategoryDestinations[achievement.category] : null;
  const weeklyDecisionState = urgentCount > 0 ? `${urgentCount}건의 긴급 결재가 전황 진행을 막고 있습니다.` : actions.length > 0 ? `${actions.length}건의 지휘 판단을 검토할 수 있습니다.` : '즉시 처리할 지휘 사안이 없습니다.';

  return (
    <div className="command-portal" data-tour="command-dashboard">
      <section className="portal-hero">
        <div className="portal-hero-copy">
          <span className="eyebrow">WEEK {game.week + 1} · EXECUTIVE BRIEFING</span>
          <h2>{role.title}, 결재할 사안부터 확인하십시오.</h2>
          <p>{nation.shortName}의 전선·조직·생산·연구를 한 화면에 요약했습니다. 세부 조정은 각 카드에서 담당 부서로 바로 이동할 수 있습니다.</p>
          <div className="portal-brief-metrics" aria-label="국가 준비도 산정 요소">
            <span className={game.stability < 50 ? 'warning' : ''}><small>안정도</small><strong>{game.stability}</strong></span>
            <span className={game.warSupport < 50 ? 'warning' : ''}><small>전쟁 지지</small><strong>{game.warSupport}</strong></span>
            <span className={averageSupply < 55 ? 'warning' : ''}><small>평균 보급</small><strong>{Math.round(averageSupply)}</strong></span>
            <span className={averageStrength < 55 ? 'warning' : ''}><small>평균 전력</small><strong>{Math.round(averageStrength)}</strong></span>
            <span className={game.victoryScore < 45 ? 'warning' : ''}><small>승리 점수</small><strong>{game.victoryScore}</strong></span>
          </div>
          <div className="portal-hero-actions">
            <button className="primary" data-tour="next-week" onClick={onNextWeek}><GameIcon name="advance" size={17} tone="steel" /> 다음 주 진행 <kbd>N</kbd></button>
            <button onClick={() => onNavigate('map')}><GameIcon name="map" size={17} tone="blue" /> 전황 지도 열기</button>
          </div>
        </div>
        <div className="readiness-gauge" style={readinessStyle} role="meter" aria-label="국가 준비도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness}>
          <div><strong>{readiness}</strong><span>국가 준비도</span></div>
          <small className={urgentCount > 0 ? 'warning' : ''}>{urgentCount > 0 ? `긴급 결재 ${urgentCount}건` : '즉시 결재 없음'}</small>
        </div>
        <div className="portal-identity">
          <NationFlag nationId={nation.id} size="large" decorative />
          <span>{nation.code} · TIER {role.tier}</span>
          <strong>{nation.shortName}</strong>
          <small>{role.scope}</small>
          <div><span>평판 {career.reputation}</span><span>지도부 신임 {career.councilTrust}</span></div>
        </div>
      </section>

      <button className={`portal-health-pulse ${publicHealth.activeOutbreak ? 'crisis' : ''}`} onClick={() => onNavigate('health')}>
        <GameIcon name="health" size={24} tone={publicHealth.activeOutbreak ? 'red' : 'green'} framed active={Boolean(publicHealth.activeOutbreak)} />
        <span>
          <small>{publicHealth.activeOutbreak ? `보건 비상 · ${formatOutbreakPhase(publicHealth.activeOutbreak.phase)}` : '국가 보건 감시'}</small>
          <strong>{publicHealth.activeOutbreak ? `${publicHealth.activeOutbreak.codeName} · 주간 ${formatNumber(publicHealth.activeOutbreak.weeklyCases)}건` : `다음 주 발병 위험 ${(publicHealth.weeklyRisk * 100).toFixed(2)}%`}</strong>
          <em>{publicHealth.activeOutbreak ? `R ${publicHealth.activeOutbreak.rEffective.toFixed(2)} · 병상 ${Math.round(publicHealth.activeOutbreak.hospitalLoad)}%` : `대비 ${Math.round(publicHealth.preparedness)} · 감시 ${Math.round(publicHealth.surveillance)} · 의료 ${Math.round(publicHealth.medicalCapacity)}`}</em>
        </span>
        <b>{publicHealth.activeOutbreak ? '위기 대응' : '대비 본부'}<ChevronRight size={15} /></b>
      </button>

      <button data-tour="world-weekly" className={`portal-weekly-brief ${weeklyUnread ? 'unread' : ''}`} onClick={onOpenWorldWeekly}>
        <span className="portal-weekly-icon"><Newspaper size={23} /></span>
        <span className="portal-weekly-copy">
          <small>{weeklyUnread ? 'NEW EDITION · 새 호 발행' : 'THE WORLD WIRE · 세계 주보'}</small>
          <strong>{weeklyLead?.headline ?? '캠페인 시작과 함께 세계선 창간호가 발행됩니다.'}</strong>
          <em>{weeklyIssue ? `${weeklyIssue.dateRange} · 사건 ${weeklyIssue.metrics.eventCount}건 · 활성 전선 ${weeklyIssue.metrics.activeFronts}곳` : '선택한 국가·보직·세계선의 전선·외교·경제·사회·과학·정보를 한 호에 정리합니다.'}</em>
        </span>
        <b>{weeklyIssue ? `제 ${weeklyIssue.edition}호 읽기` : '발행 안내'}<ChevronRight size={15} /></b>
      </button>

      {achievement && achievementDestination && (
        <section className="portal-achievement-track" aria-label="추천 도전과제 추적">
          <span className="portal-achievement-icon"><Trophy size={22} /></span>
          <span className="portal-achievement-copy">
            <small>{achievementTracked ? 'TRACKED CHALLENGE' : 'NEXT CHALLENGE'} · {achievementCategoryLabels[achievement.category]}</small>
            <strong>{achievement.title}</strong>
            <em>{achievementProgress?.detail ?? achievement.condition}</em>
          </span>
          <span className="portal-achievement-meter" role="meter" aria-label={`${achievement.title} 진행률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={achievementProgress?.percent ?? 0}>
            <span><small>{achievement.condition}</small><strong>{achievementProgress?.percent ?? 0}%</strong></span>
            <i><b style={{ width: `${achievementProgress?.percent ?? 0}%` }} /></i>
          </span>
          <span className="portal-achievement-actions">
            <button type="button" onClick={() => onNavigate(achievementDestination.tab)}>{achievementDestination.label}<ChevronRight size={14} /></button>
            <button type="button" onClick={onOpenAchievements}>기록실</button>
          </span>
        </section>
      )}

      <section className="command-triage" aria-label="이번 주 지휘 순서">
        <div className={`triage-step situation ${urgentCount > 0 ? 'urgent' : ''}`}>
          <span className="triage-number">01</span>
          <GameIcon name={urgentCount > 0 ? 'alert' : 'report'} size={24} tone={urgentCount > 0 ? 'red' : 'green'} framed />
          <div><small>상황 파악</small><strong>{urgentCount > 0 ? '긴급 결재 필요' : '지휘 상황 안정'}</strong><p>{weeklyDecisionState}</p></div>
        </div>
        <button className={`triage-step decision ${primaryAction?.priority ?? 'clear'}`} onClick={() => primaryAction ? onAction(primaryAction) : onOpenActionCenter()}>
          <span className="triage-number">02</span>
          <GameIcon name="command" size={24} tone="gold" framed active />
          <div><small>지금 할 일</small><strong>{primaryAction?.title ?? '새로운 결재 없음'}</strong><p>{primaryAction?.detail ?? '전황과 생산 예측을 확인한 뒤 다음 주로 진행하십시오.'}</p></div>
          <em>{primaryAction?.label ?? '행동 센터'}<ChevronRight size={15} /></em>
        </button>
        <div className="triage-step forecast">
          <span className="triage-number">03</span>
          <GameIcon name="time" size={24} tone="blue" framed />
          <div><small>진행 전 결과</small><strong>생산·명령·연구 동시 해결</strong><p>보병 장비 +{formatNumber(weeklyProduction.infantryEquipment)} · 작전 명령 {orders.length}건 · 연구 {activeResearch.length}/2</p></div>
        </div>
      </section>

      <NationalSimulationOverview snapshot={nationalSimulation} phase="war" onNavigate={onNavigate} />

      <div className="command-portal-grid">
        <section className="portal-card portal-inbox">
          <header>
            <div><span className="eyebrow">COMMAND PORTAL</span><h3>지휘 업무함</h3></div>
            <button onClick={onOpenActionCenter}>전체 업무 {actions.length}<ChevronRight size={14} /></button>
          </header>
          <div className="portal-filters" role="group" aria-label="지휘 업무함 필터">
            <button className={filter === 'all' ? 'active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>전체</button>
            <button className={filter === 'tasks' ? 'active' : ''} aria-pressed={filter === 'tasks'} onClick={() => setFilter('tasks')}>결재 필요 <em>{actions.length}</em></button>
            <button className={filter === 'reports' ? 'active' : ''} aria-pressed={filter === 'reports'} onClick={() => setFilter('reports')}>보고 <em>{Math.min(4, events.length)}</em></button>
          </div>
          <div className="portal-feed">
            {(filter === 'all' || filter === 'tasks') && actions.slice(0, filter === 'tasks' ? 6 : 3).map((action) => (
              <button className={`portal-task ${action.priority}`} key={action.id} onClick={() => onAction(action)}>
                <i><GameIcon name={action.priority === 'urgent' ? 'alert' : action.priority === 'recommended' ? 'command' : 'report'} size={16} tone={action.priority === 'urgent' ? 'red' : action.priority === 'recommended' ? 'gold' : 'blue'} /></i>
                <span><em>{priorityLabels[action.priority]}</em><strong>{action.title}</strong><small>{action.detail}</small></span>
                <b>{action.label}<ChevronRight size={14} /></b>
              </button>
            ))}
            {(filter === 'all' || filter === 'reports') && events.slice(0, filter === 'reports' ? 6 : 2).map((event) => (
              <button className={`portal-report ${event.tone}`} key={event.id} onClick={onOpenJournal}>
                <i><GameIcon name={event.tone === 'bad' ? 'alert' : 'report'} size={15} tone={event.tone === 'bad' ? 'red' : 'blue'} /></i>
                <span><em>{event.week + 1}주차 보고</em><strong>{event.title}</strong><small>{event.detail}</small></span>
                <ChevronRight size={14} />
              </button>
            ))}
            {((filter === 'all' && actions.length === 0 && events.length === 0) || (filter === 'tasks' && actions.length === 0) || (filter === 'reports' && events.length === 0)) && (
              <div className="portal-feed-empty"><CheckCircle2 size={25} /><strong>처리할 항목이 없습니다.</strong><span>다음 주를 진행하면 새 보고가 도착합니다.</span></div>
            )}
          </div>
        </section>

        <section className="portal-card portal-front">
          <header><div><span className="eyebrow">THEATER SNAPSHOT</span><h3>{activeTheater === 'asia' ? '아시아·태평양' : '유럽·지중해'} 전황</h3></div><button onClick={() => onNavigate('map')}>지도 보기<ArrowRight size={14} /></button></header>
          <div className="front-balance">
            <div><span>아군 통제</span><strong>{controlledCount}</strong></div>
            <i><b style={{ width: `${controlledCount / Math.max(1, controlledCount + opponentCount) * 100}%` }} /></i>
            <div><span>적 통제</span><strong>{opponentCount}</strong></div>
          </div>
          <div className="front-kpis">
            <div><GameIcon name="army" size={18} tone="blue" /><span><small>준비 사단</small><strong>{readyDivisions}/{divisions.length}</strong></span></div>
            <div><GameIcon name="supply" size={18} tone="green" /><span><small>평균 보급</small><strong>{Math.round(averageSupply)}%</strong></span></div>
            <div><GameIcon name="objective" size={18} tone="gold" /><span><small>승리 점수</small><strong>{game.victoryScore}</strong></span></div>
          </div>
          <div className="front-watchlist">
            <span>취약 전선</span>
            {frontTerritories.slice(0, 3).map((territory) => <button key={territory.id} onClick={() => onNavigate('map')}><i className={territory.supply < 45 ? 'critical' : ''} /><strong>{territory.name}</strong><small>보급 {territory.supply}% · 가치 {territory.value}</small><ChevronRight size={13} /></button>)}
            {frontTerritories.length === 0 && <p>현재 전구에 직접 접촉 중인 아군 전선이 없습니다.</p>}
          </div>
        </section>

        <section className="portal-card portal-operation">
          <header><div><span className="eyebrow">PRIMARY OBJECTIVE</span><h3>{nation.majorOperation}</h3></div><em>D-{Math.max(0, 14 - game.week)}</em></header>
          <p>{nation.majorOperationDetail}</p>
          <div className="operation-progress"><i><b style={{ width: `${objectiveProgress}%` }} /></i><strong>{objectiveProgress}%</strong></div>
          <ul>
            {nation.strategicTargets.map((targetId) => {
              const target = territories.find((territory) => territory.id === targetId);
              const complete = target?.controller === playerFaction;
              return <li key={targetId} className={complete ? 'complete' : ''}>{complete ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}<span><strong>{target?.name ?? targetId}</strong><small>{complete ? '목표 확보' : '작전 준비 필요'}</small></span></li>;
            })}
          </ul>
          <a href="#command-council">전쟁 내각 검토<ChevronRight size={14} /></a>
        </section>

        <section className="portal-card portal-departments">
          <header><div><span className="eyebrow">ORGANIZATION PULSE</span><h3>조직·편제 상태</h3></div><button onClick={() => onNavigate('organization')}>조직 운영<ArrowRight size={14} /></button></header>
          <div className="department-health-grid">
            <button onClick={() => onNavigate('organization')}><GameIcon name="organization" size={19} tone="blue" /><span><small>참모 과부하</small><strong className={overloadedStaff > 0 ? 'warning' : ''}>{overloadedStaff}명</strong><em>{overloadedStaff > 0 ? '업무 재배분 필요' : '정상'}</em></span></button>
            <button onClick={() => onNavigate('organization')}><GameIcon name="manpower" size={19} tone="gold" /><span><small>영입 진행</small><strong>{recruitmentLeads}건</strong><em>시장 후보 {candidates.length}명</em></span></button>
            <button onClick={() => onNavigate('army')}><GameIcon name="army" size={19} tone="red" /><span><small>작전 명령</small><strong>{orders.length}건</strong><em>준비 사단 {readyDivisions}개</em></span></button>
            <button onClick={() => onNavigate('organization')}><GameIcon name="command" size={19} tone="green" /><span><small>지도부 신임</small><strong>{career.councilTrust}</strong><em>평판 {career.reputation}</em></span></button>
          </div>
        </section>

        <section className="portal-card portal-production">
          <header><div><span className="eyebrow">NEXT WEEK FORECAST</span><h3>생산·연구 예측</h3></div><em>결과 미리보기</em></header>
          <div className="production-capacity"><span>군수 공장</span><strong>{usedFactories}/{game.factories}</strong><i><b style={{ width: `${usedFactories / Math.max(1, game.factories) * 100}%` }} /></i></div>
          <div className="production-preview-grid">
            <button onClick={() => onNavigate('industry')}><GameIcon name="industry" size={19} tone="steel" /><span><small>다음 주 주요 생산</small><strong>보병 +{formatNumber(weeklyProduction.infantryEquipment)}</strong><em>전차 +{formatNumber(weeklyProduction.tanks)} · 항공기 +{formatNumber(weeklyProduction.aircraft)}</em></span></button>
            <button onClick={() => onNavigate('research')}><GameIcon name="research" size={19} tone="blue" /><span><small>일반 연구 슬롯</small><strong>{activeResearch.length}/2 진행</strong><em>{activeResearch.map((project) => project.name).join(' · ') || '배정 필요'}</em></span></button>
            <button onClick={() => onNavigate('research')}><GameIcon name="supply" size={19} tone="gold" /><span><small>장비 개발국</small><strong>{activeEquipment?.name ?? '개발 슬롯 대기'}</strong><em>{activeEquipment ? `${Math.round(equipmentDevelopment.progress / activeEquipment.researchCost * 100)}% 진행` : `${equipmentDevelopment.unlockedIds.length}개 계보 해금`}</em></span></button>
          </div>
          <div className="stockpile-strip"><span>비축</span><em>보병 {formatNumber(stockpile.infantryEquipment)}</em><em>전차 {formatNumber(stockpile.tanks)}</em><em>항공 {formatNumber(stockpile.aircraft)}</em><em>트럭 {formatNumber(stockpile.trucks)}</em></div>
        </section>

        <section className="portal-card portal-shortcuts">
          <header><div><span className="eyebrow">QUICK ACCESS</span><h3>담당 부서</h3></div></header>
          <div>
            <button onClick={() => onNavigate('map')}><GameIcon name="map" size={20} tone="blue" framed /><span><strong>전황 지도</strong><small>전선·보급·정보</small></span><ChevronRight size={14} /></button>
            <button onClick={() => onNavigate('army')}><GameIcon name="army" size={20} tone="red" framed /><span><strong>육군</strong><small>사단·지휘관·공세</small></span><ChevronRight size={14} /></button>
            <button onClick={() => onNavigate('organization')}><GameIcon name="organization" size={20} tone="gold" framed /><span><strong>조직 운영</strong><small>참모·영입·원칙</small></span><ChevronRight size={14} /></button>
            <button onClick={() => onNavigate('economy')}><GameIcon name="treasury" size={20} tone="green" framed /><span><strong>전시 재무성</strong><small>세입·국채·기업지분</small></span><ChevronRight size={14} /></button>
            <button onClick={() => onNavigate('industry')}><GameIcon name="industry" size={20} tone="steel" framed /><span><strong>군수 생산</strong><small>공장·비축·효율</small></span><ChevronRight size={14} /></button>
            <button onClick={() => onNavigate('research')}><GameIcon name="research" size={20} tone="blue" framed /><span><strong>연구 개발</strong><small>기술·장비 계보</small></span><ChevronRight size={14} /></button>
            <button onClick={() => onNavigate('health')}><GameIcon name="health" size={20} tone={publicHealth.activeOutbreak ? 'red' : 'green'} framed /><span><strong>보건 위기</strong><small>감시·격리·의료</small></span><ChevronRight size={14} /></button>
            <button onClick={onOpenJournal}><GameIcon name="report" size={20} tone="green" framed /><span><strong>진행 결과</strong><small>선택·계산·영향 분석</small></span><ChevronRight size={14} /></button>
          </div>
        </section>
      </div>
    </div>
  );
}
