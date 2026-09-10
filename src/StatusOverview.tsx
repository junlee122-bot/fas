import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock3, LayoutDashboard, ShieldCheck, X } from 'lucide-react';
import { GameIcon } from './GameIcon';
import type { GameIconName, GameIconTone } from './GameIcon';
import { deriveCommandReadiness } from './ux';
import type { UXAction } from './ux';

export interface StatusResource {
  id: string;
  label: string;
  value: string;
  delta?: string;
  detail: string;
  icon: GameIconName;
  tone: GameIconTone;
  priority?: boolean;
}

export interface StatusMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warning' | 'danger' | 'neutral';
  icon: GameIconName;
}

export interface StatusProjection {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warning' | 'danger' | 'neutral';
  icon: GameIconName;
}

interface StatusOverviewProps {
  nationName: string;
  roleTitle: string;
  date: string;
  phaseLabel: string;
  resources: StatusResource[];
  metrics: StatusMetric[];
  projections: StatusProjection[];
  actions: UXAction[];
  primaryActionLabel: string;
  onNavigate: (action: UXAction) => void;
  onContinue: () => void;
  onClose: () => void;
}

const priorityLabels = {
  urgent: '긴급',
  recommended: '권장',
  info: '보고',
};

export function StatusOverview({ nationName, roleTitle, date, phaseLabel, resources, metrics, projections, actions, primaryActionLabel, onNavigate, onContinue, onClose }: StatusOverviewProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const readiness = deriveCommandReadiness(actions);
  const visibleActions = actions.slice(0, 4);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  return (
    <div className="ux-backdrop status-overview-backdrop" onClick={onClose}>
      <section className="status-overview" role="dialog" aria-modal="true" aria-labelledby="status-overview-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="status-overview-mark"><LayoutDashboard size={22} /></div>
          <div><span>COMMAND STATUS</span><h2 id="status-overview-title">지휘 현황판</h2><small>{nationName} · {roleTitle}</small></div>
          <div className="status-overview-date"><small>{phaseLabel}</small><strong>{date}</strong></div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="지휘 현황판 닫기"><X size={17} /></button>
        </header>

        <div className={`status-readiness ${readiness.state}`} role="status">
          <i>{readiness.state === 'blocked' ? <AlertTriangle size={21} /> : <ShieldCheck size={21} />}</i>
          <span><small>NEXT WEEK PREFLIGHT</small><strong>{readiness.title}</strong><p>{readiness.detail}</p></span>
          <div><b>{readiness.urgentCount}</b><small>긴급</small><b>{readiness.recommendedCount}</b><small>권장</small></div>
        </div>

        <div className="status-overview-body">
          <div className="status-overview-primary">
            <section className="status-panel status-resources-panel">
              <header><span><GameIcon name="treasury" size={16} tone="gold" /><strong>핵심 자원</strong></span><em>현재값 · 주간 변화 · 용도</em></header>
              <div className="status-resource-grid">
                {resources.map((resource) => (
                  <article className={`${resource.tone} ${resource.priority ? 'priority' : ''}`} key={resource.id}>
                    <GameIcon name={resource.icon} size={18} tone={resource.tone} framed />
                    <span><small>{resource.label}</small><strong>{resource.value}</strong><em>{resource.detail}</em></span>
                    {resource.delta && <b>{resource.delta}</b>}
                  </article>
                ))}
              </div>
            </section>

            <section className="status-panel status-projection-panel">
              <header><span><Clock3 size={15} /><strong>다음 주 예상 결산</strong></span><em>현재 명령·배정 기준 · 확률 사건 제외</em></header>
              <div className="status-projection-grid">
                {projections.map((projection) => (
                  <article className={projection.tone} key={projection.id}>
                    <GameIcon name={projection.icon} size={17} tone={projection.tone === 'danger' ? 'red' : projection.tone === 'warning' ? 'gold' : projection.tone === 'good' ? 'green' : 'blue'} framed />
                    <span><small>{projection.label}</small><strong>{projection.value}</strong><em>{projection.detail}</em></span>
                  </article>
                ))}
              </div>
            </section>

            <section className="status-panel status-metrics-panel">
              <header><span><GameIcon name="command" size={16} tone="blue" /><strong>국가·전쟁 상태</strong></span><em>위험부터 정렬</em></header>
              <div className="status-metric-grid">
                {metrics.map((metric) => (
                  <article className={metric.tone} key={metric.id}>
                    <GameIcon name={metric.icon} size={17} tone={metric.tone === 'danger' ? 'red' : metric.tone === 'warning' ? 'gold' : metric.tone === 'good' ? 'green' : 'blue'} />
                    <span><small>{metric.label}</small><strong>{metric.value}</strong><em>{metric.detail}</em></span>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="status-priority-panel">
            <header><span><Clock3 size={15} /><strong>지금 처리할 일</strong></span><em>{actions.length}건</em></header>
            <div>
              {visibleActions.map((action, index) => (
                <button className={action.priority} key={action.id} onClick={() => onNavigate(action)}>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                  <span>
                    <small>{priorityLabels[action.priority]}</small><strong>{action.title}</strong><em>{action.detail}</em>
                    {action.ifIgnored && <p className="status-priority-risk"><AlertTriangle size={11} /> 이월 시 · {action.ifIgnored}</p>}
                  </span>
                  <b>{action.label}<ChevronRight size={13} /></b>
                </button>
              ))}
              {!visibleActions.length && <div className="status-priority-clear"><CheckCircle2 size={30} /><strong>처리할 핵심 업무가 없습니다</strong><span>다음 주 진행 전에 저장하거나 장기 목표를 검토할 수 있습니다.</span></div>}
            </div>
            {actions.length > visibleActions.length && <small className="status-more-actions">추가 업무 {actions.length - visibleActions.length}건은 행동 센터에서 확인할 수 있습니다.</small>}
          </aside>
        </div>

        <footer>
          <span><kbd>H</kbd> 현황판 · <kbd>G</kbd> 행동 센터 · <kbd>Esc</kbd> 닫기</span>
          <div><button onClick={onClose}>돌아가기</button><button className={readiness.state === 'blocked' ? 'warning' : 'primary'} onClick={onContinue}><Clock3 size={14} /> {primaryActionLabel}</button></div>
        </footer>
      </section>
    </div>
  );
}
