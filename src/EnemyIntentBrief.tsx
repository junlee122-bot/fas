import { ChevronRight, Eye, Radar, ShieldAlert } from 'lucide-react';
import type { EnemyIntentReport } from './enemyStrategy';

interface EnemyIntentBriefProps {
  report: EnemyIntentReport;
  compact?: boolean;
  onOpenMap?: () => void;
  onFocusTarget?: () => void;
}

const threatLabels: Record<EnemyIntentReport['threatLevel'], string> = {
  low: '낮음', guarded: '감시', elevated: '고조', critical: '긴급',
};

export function EnemyIntentBrief({ report, compact = false, onOpenMap, onFocusTarget }: EnemyIntentBriefProps) {
  const mapAction = report.targetId && onFocusTarget ? onFocusTarget : onOpenMap;
  return (
    <section className={`enemy-intent-brief threat-${report.threatLevel}${compact ? ' compact' : ''}`} aria-label="적 작전 의도 분석">
      <header>
        <span className="enemy-intent-icon"><Radar size={17} /></span>
        <span><small>ENEMY INTENT · {report.classification}</small><strong>{report.title}</strong></span>
        <em>{threatLabels[report.threatLevel]}</em>
      </header>
      <p>{report.summary}</p>
      <div className="enemy-intent-kpis">
        <span><small>분석 신뢰도</small><strong>{report.confidence}%</strong><i><b style={{ width: `${report.confidence}%` }} /></i></span>
        <span><small>현재 단계</small><strong>{report.stageLabel}</strong></span>
        <span><small>예상 시점</small><strong>{report.etaLabel}</strong></span>
      </div>
      {report.active ? (
        <>
          <div className="enemy-intent-target">
            <ShieldAlert size={15} />
            <span><small>예상 목표 · {report.targetRegion}</small><strong>{report.targetName}</strong><em>{report.operationLabel} · 기만 위험 {report.deceptionRisk}</em></span>
            {mapAction ? <button type="button" onClick={mapAction}>{report.targetId ? '표적 보기' : '지도 열기'}<ChevronRight size={13} /></button> : null}
          </div>
          <div className="enemy-intent-reading">
            <span><Eye size={13} /> 포착 근거</span>
            <ul>{report.indicators.map((indicator) => <li key={indicator}>{indicator}</li>)}</ul>
          </div>
          {!compact ? (
            <div className="enemy-intent-counter">
              <span>권장 대응</span>
              <ol>{report.countermeasures.map((measure) => <li key={measure}>{measure}</li>)}</ol>
            </div>
          ) : null}
        </>
      ) : null}
      {report.sourceLabel && report.sourceUrl ? <footer><span>교리 사료 대조 완료</span><a href={report.sourceUrl} target="_blank" rel="noreferrer">{report.sourceLabel}<ChevronRight size={11} /></a></footer> : null}
    </section>
  );
}
