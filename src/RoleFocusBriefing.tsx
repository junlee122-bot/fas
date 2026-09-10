import { ArrowRight, CheckCircle2, ChevronDown, Circle, ClipboardCheck, ShieldCheck } from 'lucide-react';
import type { CareerRole, GameTab } from './types';
import type { RoleTabMandate } from './roleMandate';
import type { UXAction } from './ux';
import { withJosa } from './koreanGrammar';
import type { RoleCommandChainProfile, RoleCommandState, RoleOperationalScope } from './roleCommand';

interface RoleFocusBriefingProps {
  role: CareerRole;
  mandates: Record<GameTab, RoleTabMandate>;
  tabs: { id: GameTab; label: string }[];
  actions: UXAction[];
  worldlineTitle: string;
  expanded: boolean;
  commandState: RoleCommandState;
  commandChain: RoleCommandChainProfile;
  operationalScope: RoleOperationalScope;
  onNavigate: (tab: GameTab) => void;
  onAction: (action: UXAction) => void;
  onToggleExpanded: () => void;
  onNextWeek: () => void;
}

export function RoleFocusBriefing({ role, mandates, tabs, actions, worldlineTitle, expanded, commandState, commandChain, operationalScope, onNavigate, onAction, onToggleExpanded, onNextWeek }: RoleFocusBriefingProps) {
  const directTabs = tabs.filter((tab) => mandates[tab.id].mode === 'direct' && tab.id !== 'command').slice(0, 4);
  const roleActionTabs: Record<CareerRole['branch'], GameTab[]> = {
    military: ['army', 'map', 'industry', 'research', 'organization'],
    politics: ['governance', 'economy', 'diplomacy', 'health', 'industry', 'research', 'organization'],
    intelligence: ['intelligence', 'map', 'diplomacy', 'research', 'organization'],
  };
  const matchedPrimaryAction = actions.find((action) => mandates[action.tab].mode === 'direct'
    && roleActionTabs[role.branch].includes(action.tab)
    && (action.id !== 'national-policy' || role.branch === 'politics' || role.archetype === 'head-of-state')
    && (action.id !== 'political-crisis' || role.branch !== 'military' || role.tier <= 2));
  const primaryAction = matchedPrimaryAction?.id === 'idle-formations' && operationalScope.level !== 'national'
    ? { ...matchedPrimaryAction, title: `명령 대기 중인 예하 준비부대 ${operationalScope.divisionIds.length}개`, detail: `${operationalScope.label} 안에서 직접 지휘하는 부대만 명령하거나 훈련할 수 있습니다.` }
    : matchedPrimaryAction;
  const completedObjectiveTasks = commandState.objective.tasks.filter((task) => task.done).length;
  const activeDelegations = commandState.requests.filter((request) => request.status === 'approved');
  return (
    <section className="role-focus-briefing" aria-labelledby="role-focus-title">
      <header>
        <span className="role-focus-icon"><ShieldCheck size={23} /></span>
        <span><small>MY DESK · 이번 주 보직 브리핑</small><h2 id="role-focus-title">{withJosa(role.title, '으로/로')}서 무엇을 할 것인가</h2><p>{role.expectation}</p></span>
        <em>{worldlineTitle}</em>
      </header>
      <div className="role-focus-grid">
        <section className={`role-primary-order ${primaryAction?.priority ?? 'clear'}`}>
          <small>01 · 가장 먼저 처리할 일</small>
          {primaryAction ? <><strong>{primaryAction.title}</strong><p>{primaryAction.detail}</p><button type="button" onClick={() => onAction(primaryAction)}>{primaryAction.label}<ArrowRight size={14} /></button></> : <><strong>즉시 결재할 위기 없음</strong><p>내 권한 업무를 검토하거나 다음 주로 진행할 수 있습니다.</p><button type="button" onClick={onNextWeek}>다음 주 진행<ArrowRight size={14} /></button></>}
        </section>
        <section className="role-direct-duties">
          <small>02 · 직접 지휘 가능한 화면</small>
          <div>{directTabs.map((tab) => <button type="button" key={tab.id} onClick={() => onNavigate(tab.id)}><CheckCircle2 size={14} /><span>{tab.label}</span><ArrowRight size={13} /></button>)}</div>
        </section>
        <section className="role-boundary-summary">
          <small>03 · 권한 경계</small>
          <strong>직접 {Object.values(mandates).filter((item) => item.mode === 'direct').length} · 상신 {Object.values(mandates).filter((item) => item.mode === 'request').length} · 보고 {Object.values(mandates).filter((item) => item.mode === 'report').length}</strong>
          <p>{role.branch === 'military' ? `${operationalScope.label} · ${operationalScope.detail} ` : ''}보직 밖 국가 업무는 대신 결재하지 않습니다. 보고를 읽고 담당자를 설득하거나 상부에 상신하십시오.</p>
        </section>
        <section className="role-weekly-objective">
          <div className="role-objective-heading"><span><small>04 · 보직별 주간 임무</small><strong>{commandState.objective.title}</strong><p>{commandState.objective.summary}</p></span><em>{completedObjectiveTasks}/{commandState.objective.tasks.length}</em></div>
          <div className="role-objective-tasks">
            {commandState.objective.tasks.map((task) => task.kind === 'visit' && task.tab ? (
              <button type="button" key={task.id} className={task.done ? 'done' : ''} onClick={() => onNavigate(task.tab!)}>
                {task.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}<span><strong>{task.label}</strong><small>{tabs.find((tab) => tab.id === task.tab)?.label ?? task.detail} · {task.detail.replace(`${task.tab} 지휘실`, '현황판')}</small></span><ArrowRight size={13} />
              </button>
            ) : (
              <div key={task.id} className={task.done ? 'done' : ''}>{task.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}<span><strong>{task.label}</strong><small>{task.detail}</small></span></div>
            ))}
          </div>
          {commandState.objective.actionEvidence.length > 0 ? <p>성과 근거 · {commandState.objective.actionEvidence.map((evidence) => evidence.description).join(' · ')}</p> : <p>화면 방문과 보고만으로는 보상이 지급되지 않습니다. 실제 조치가 성공하면 성과 근거가 기록됩니다.</p>}
          <footer><span>완료 보상 · {commandState.objective.reward}</span><em>{commandState.objective.completed ? '다음 주 평가에서 지급' : '진행 중'}</em></footer>
        </section>
        <section className="role-command-chain">
          <small>05 · 실제 지휘계통</small>
          <ol><li><span>감독</span><strong>{commandChain.superior}</strong></li><li className="current"><span>나</span><strong>{commandChain.current}</strong></li><li><span>예하</span><strong>{commandChain.subordinates}</strong></li></ol>
          <p>{commandChain.accountability}</p>
          <div><span>상급자 호의 <b>{Math.round(commandState.officialFavor)}</b></span><span>불복 기록 <b>{Math.round(commandState.defiance)}</b></span></div>
          {activeDelegations.length ? <em>{activeDelegations.map((request) => `${request.tabLabel} ${request.route === 'defiant' ? '월권' : '위임'} ~ 제${(request.delegationUntilWeek ?? request.decisionWeek) + 1}주`).join(' · ')}</em> : <em>현재 추가 위임 없음</em>}
        </section>
      </div>
      <button type="button" className="command-detail-toggle" aria-expanded={expanded} onClick={onToggleExpanded}><ClipboardCheck size={15} />{expanded ? '상세 상황판 접기' : '전황·국가 분석 전체 펼치기'}<ChevronDown size={15} /></button>
    </section>
  );
}
