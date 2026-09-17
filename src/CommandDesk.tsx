import { ArrowRight, ArrowUpRight, Check, Circle, FileText, ShieldCheck } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { RoleFocusBriefing } from './RoleFocusBriefing';
import type { GameTab } from './types';
import { getCommandDeskArtwork } from './commandDeskArt';
import { isCommandDeskActionVisible, isCommandDeskFocusTab } from './commandDeskAccess';
import './CommandDesk.css';

type Props = ComponentProps<typeof RoleFocusBriefing> & {
  nationName: string;
  dateLabel: string;
  year?: number;
  nextLabel: string;
  recentEvents: ReadonlyArray<{ id: string; title: string; week: number; tone: string }>;
  activities: ReadonlyArray<{ id: string; label: string; value: number; detail: string; tab: GameTab }>;
  onActivity: (id: string, tab: GameTab) => void;
  onOpenBriefing: () => void;
};

/** A working desk, not a second simulation. Reading it never completes an objective. */
export function CommandDesk(props: Props) {
  const { role, mandates, tabs, actions, commandState, commandChain, operationalScope, onNavigate, onAction, onNextWeek } = props;
  const queue = actions.filter((action) => isCommandDeskActionVisible(role, mandates, action));
  const primary = queue[0]?.id === 'idle-formations' && operationalScope.level !== 'national'
    ? { ...queue[0], title: `예하 ${operationalScope.divisionIds.length}개 부대의 준비 상태 점검`, detail: `${operationalScope.label} 안에서 직접 지휘하는 부대만 명령하거나 훈련할 수 있습니다.` } : queue[0];
  const objective = commandState.objective;
  const completed = objective.tasks.filter((task) => task.done).length;
  const quickTabs = tabs.filter((tab) => tab.id !== 'command' && mandates[tab.id].mode === 'direct' && isCommandDeskFocusTab(role, tab.id)).slice(0, 5);
  const artwork = getCommandDeskArtwork(role.branch, props.year);
  const pendingTasks = objective.tasks.filter((task) => !task.done).length;
  return <section className="command-desk" aria-labelledby="command-desk-title">
    <header className="command-desk-header">
      <div><p className="command-desk-kicker">{props.nationName}<span>{props.dateLabel}</span></p><h1 id="command-desk-title">{role.title}</h1><p>{role.expectation}</p></div>
      <button type="button" className="command-desk-briefing" onClick={props.onOpenBriefing}><FileText size={20} /><span>주간 브리핑</span><ArrowUpRight size={17} /></button>
    </header>
    <section className="command-desk-scope" aria-label="현재 지휘 권한 요약">
      <div><ShieldCheck size={17} aria-hidden="true" /><span>권한 범위</span><strong>{operationalScope.label}</strong></div>
      <div><span>상급 결재선</span><strong>{commandChain.superior}</strong></div>
      <div className="command-desk-pending"><span>직접 처리 대기</span><strong>{queue.length ? `${queue.length}건` : '없음'}</strong></div>
    </section>
    <div className="command-desk-main">
      <div className="command-desk-work">
      <section className={`command-desk-decision ${primary?.priority ?? 'clear'}`} aria-labelledby="desk-decision-title">
        <div className="command-desk-paper-heading"><span>이번 주 결정</span><span>{primary?.priority === 'urgent' ? '우선 검토' : primary ? '권장 업무' : '준비 완료'}</span></div>
        <div className={`command-desk-decision-layout${artwork ? ' has-art' : ''}`}>
        <div className="command-desk-decision-copy">
        <h2 id="desk-decision-title">{primary?.title ?? '다음 장을 준비할 시간입니다.'}</h2>
        <p>{primary?.detail ?? '즉시 처리할 직접 결재 안건은 없습니다. 진행 중인 일과 주간 결과를 확인하고 시간을 진행할 수 있습니다.'}</p>
        {primary?.resolution ? <div className="command-desk-checkpoint"><span>확인 시점</span><strong>{primary.resolution}</strong></div> : null}
        <button type="button" className="command-desk-primary" onClick={() => primary ? onAction(primary) : onNextWeek()}>{primary?.label ?? props.nextLabel}<ArrowRight size={19} /></button>
        </div>
        {artwork ? <figure className="command-desk-art"><img src={artwork.src} alt="" width="640" height="426" decoding="async" /><figcaption>{artwork.label}<span>분위기 삽화 · 실제 사건 기록 아님</span></figcaption></figure> : null}
        </div>
        <div className="command-desk-paper-footer"><ShieldCheck size={16} /><span>{primary ? mandates[primary.tab].label : '결과 확인 후 진행'} · {role.title}의 업무</span></div>
      </section>
      <section className="command-desk-inbox" aria-labelledby="desk-inbox-title"><header><h2 id="desk-inbox-title">이어서 검토할 안건</h2><span>{Math.max(0, queue.length - 1)}건 대기</span></header>{queue.slice(1, 4).map((action) => <button type="button" key={action.id} onClick={() => onAction(action)}><span className={`command-desk-inbox-priority ${action.priority}`}>{action.priority === 'urgent' ? '우선' : '검토'}</span><span><strong>{action.title}</strong><small>{tabs.find((tab) => tab.id === action.tab)?.label} · {action.label}</small></span><ArrowUpRight size={17} /></button>)}{queue.length < 2 ? <p className="command-desk-empty">대기 중인 추가 직접 결재 안건이 없습니다.</p> : null}<nav aria-label="내 담당 업무 바로가기">{quickTabs.map((tab) => <button type="button" key={tab.id} onClick={() => onNavigate(tab.id)}>{tab.label}<ArrowUpRight size={13} /></button>)}</nav></section>
      <section className="command-desk-progress-work" aria-labelledby="desk-work-title"><header><h2 id="desk-work-title">진행 중인 업무</h2><span>현재 기록</span></header><nav className="command-desk-activities" aria-label="진행 중인 업무">{props.activities.map((activity) => <button type="button" key={activity.id} onClick={() => props.onActivity(activity.id, activity.tab)}><strong>{activity.value}<em>건</em></strong><span><b>{activity.label}</b><small>{activity.detail}</small></span><ArrowUpRight size={17} /></button>)}</nav>{props.activities.length === 0 ? <p className="command-desk-empty">현재 보직에서 직접 관리하는 업무가 없습니다.</p> : null}</section>
      </div>
      <aside className="command-desk-rail" aria-label="임무와 결과 기록">
      <section className="command-desk-objective" aria-labelledby="desk-objective-title">
        <header><span>나의 임무</span><b>{completed}<small> / {objective.tasks.length}</small></b></header>
        <h2 id="desk-objective-title">{objective.title}</h2>
        <div className="command-desk-progress" role="progressbar" aria-label="주간 임무 진행" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={objective.tasks.length}><i style={{ width: `${objective.tasks.length ? completed / objective.tasks.length * 100 : 0}%` }} /></div>
        <p className="command-desk-mission-state">{pendingTasks ? `${pendingTasks}개 항목 남음` : '체크 항목 확인 완료'}<span>성과·보상은 실제 조치 기록으로 검증</span></p>
        <div className="command-desk-task-list">{objective.tasks.map((task) => {
          const content = <>{task.done ? <Check size={17} /> : <Circle size={17} />}<span>{task.label}</span>{task.kind === 'visit' && task.tab ? <ArrowUpRight size={16} /> : null}</>;
          return task.kind === 'visit' && task.tab ? <button key={task.id} type="button" className={task.done ? 'done' : ''} onClick={() => onNavigate(task.tab!)}>{content}</button> : <div className={task.done ? 'done' : ''} key={task.id}>{content}</div>;
        })}</div>
        <details><summary>평가 조건과 지휘계통</summary><p>{objective.summary}</p><p>{objective.actionEvidence.length ? `성과 근거: ${objective.actionEvidence.map((item) => item.description).join(' · ')}` : '화면 방문만으로 보상이 지급되지는 않습니다. 실제 조치의 성공 기록이 필요합니다.'}</p><p>{commandChain.accountability}</p><p>감독: {commandChain.superior}</p><p>평가 보상: {objective.reward}</p></details>
      </section>
      <section className="command-desk-journal" aria-labelledby="desk-journal-title"><header><h2 id="desk-journal-title">최근 기록</h2><button type="button" onClick={props.onOpenBriefing}>브리핑 <ArrowUpRight size={14} /></button></header>{props.recentEvents.slice(0, 3).map((event) => <div key={event.id}><span>제{event.week + 1}주</span><p>{event.title}</p></div>)}{props.recentEvents.length === 0 ? <p className="command-desk-empty">아직 기록이 없습니다.</p> : null}<details><summary>현재 세계선</summary><p>{props.worldlineTitle}</p></details></section>
      </aside>
    </div>
  </section>;
}
