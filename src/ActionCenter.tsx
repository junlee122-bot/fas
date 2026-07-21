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

const fallbackGuidance: Record<UXActionPriority, { reason: string; ifIgnored: string; resolution: string }> = {
  urgent: {
    reason: '핵심 지표가 위험 임계치를 넘어 즉시 판단 대상으로 지정됐습니다.',
    ifIgnored: '다음 주 판정에서 위험이 현실화되거나 대응 비용이 커질 수 있습니다.',
    resolution: '담당 화면에서 조정 · 다음 주 결산에서 검증',
  },
  recommended: {
    reason: '현재 자원이나 기회를 더 효율적으로 사용할 수 있습니다.',
    ifIgnored: '즉시 실패하지는 않지만 이번 주의 성장·준비 기회를 놓칩니다.',
    resolution: '담당 화면에서 조정 · 다음 주 변화량에서 확인',
  },
  info: {
    reason: '현재 진행 중인 상태를 지휘부에 보고합니다.',
    ifIgnored: '자동 진행되지만 이후 결재의 조건이 달라질 수 있습니다.',
    resolution: '상태 확인 · 이후 주간 보고에서 추적',
  },
};

export function ActionCenter({ actions, onNavigate, onClose }: ActionCenterProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const urgentCount = actions.filter((action) => action.priority === 'urgent').length;
  const recommendedCount = actions.filter((action) => action.priority === 'recommended').length;
  const infoCount = actions.filter((action) => action.priority === 'info').length;

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
          <div>
            <strong>{urgentCount > 0 ? '지휘부의 즉각적인 판단이 필요합니다.' : recommendedCount > 0 ? '필수 준비는 끝났고 권장 조정이 남았습니다.' : '상태 보고만 확인하면 다음 주로 진행할 수 있습니다.'}</strong>
            <span>항목을 선택하면 담당 화면에 추적되고, 해결된 지시는 완료 확인서로 바뀝니다.</span>
          </div>
          <div className="action-center-counts" aria-label="행동 우선순위별 건수">
            <span className="urgent"><small>긴급</small><strong>{urgentCount}</strong></span>
            <span className="recommended"><small>권장</small><strong>{recommendedCount}</strong></span>
            <span className="info"><small>보고</small><strong>{infoCount}</strong></span>
          </div>
          <div className="action-center-flow" aria-label="결재 처리 흐름">
            <span><b>1</b> 원인 확인</span><ChevronRight size={12} />
            <span><b>2</b> 담당 화면에서 조정</span><ChevronRight size={12} />
            <span><b>3</b> 다음 주 결과 확인</span>
          </div>
        </div>

        <div className="action-center-list">
          {actions.length > 0 ? actions.map((action) => {
            const meta = priorityMeta[action.priority];
            const guidance = fallbackGuidance[action.priority];
            return (
              <button key={action.id} data-action-id={action.id} className={action.priority} onClick={() => onNavigate(action)}>
                <i>{meta.icon}</i>
                <span className="action-center-card-copy">
                  <em>{meta.label}</em><strong>{action.title}</strong><small>{action.detail}</small>
                  <span className="action-center-impact">
                    <span><b>발생 이유</b><small>{action.reason ?? guidance.reason}</small></span>
                    <span><b>미처리 시</b><small>{action.ifIgnored ?? guidance.ifIgnored}</small></span>
                    <span><b>결과 확인</b><small>{action.resolution ?? guidance.resolution}</small></span>
                  </span>
                </span>
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
