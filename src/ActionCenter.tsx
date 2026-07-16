import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, CircleAlert, Lightbulb, Menu, X } from 'lucide-react';
import type { UXAction, UXActionPriority } from './ux';

interface ActionCenterProps {
  actions: UXAction[];
  onNavigate: (action: UXAction) => void;
  onClose: () => void;
}

const priorityMeta: Record<UXActionPriority, { label: string; icon: React.ReactNode }> = {
  urgent: { label: '즉시 확인', icon: <AlertTriangle size={16} /> },
  recommended: { label: '권장 행동', icon: <Lightbulb size={16} /> },
  info: { label: '상황 보고', icon: <CircleAlert size={16} /> },
};

export function ActionCenter({ actions, onNavigate, onClose }: ActionCenterProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="ux-backdrop action-center-backdrop" onClick={onClose}>
      <aside className="action-center" role="dialog" aria-modal="true" aria-labelledby="action-center-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="action-center-mark"><Menu size={20} /></div>
          <div><span>COMMAND ASSISTANT</span><h2 id="action-center-title">행동 센터</h2><small>현재 상태에서 놓치기 쉬운 결정만 모았습니다.</small></div>
          <em>{actions.length}건</em>
          <button ref={closeButtonRef} onClick={onClose} aria-label="행동 센터 닫기"><X size={17} /></button>
        </header>

        <div className="action-center-summary">
          <strong>{actions.some((action) => action.priority === 'urgent') ? '지휘부의 즉각적인 판단이 필요합니다.' : '전선은 통제되고 있습니다.'}</strong>
          <span>항목을 선택하면 관련 화면으로 바로 이동합니다.</span>
        </div>

        <div className="action-center-list">
          {actions.length > 0 ? actions.map((action) => {
            const meta = priorityMeta[action.priority];
            return (
              <button key={action.id} className={action.priority} onClick={() => onNavigate(action)}>
                <i>{meta.icon}</i>
                <span><em>{meta.label}</em><strong>{action.title}</strong><small>{action.detail}</small></span>
                <b>{action.label}<ChevronRight size={14} /></b>
              </button>
            );
          }) : (
            <div className="action-center-clear">
              <CheckCircle2 size={31} />
              <strong>대기 중인 핵심 결정이 없습니다.</strong>
              <span>턴을 진행하거나 새로운 작전을 시작하면 이곳에 다음 행동이 표시됩니다.</span>
            </div>
          )}
        </div>

        <footer><kbd>G</kbd> 행동 센터 · <kbd>N</kbd> 다음 주 · <kbd>Space</kbd> 일시 정지/재개 · <kbd>Esc</kbd> 닫기</footer>
      </aside>
    </div>
  );
}
