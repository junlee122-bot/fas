import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Pause,
  ShieldCheck,
  TimerReset,
  X,
} from 'lucide-react';
import type {
  StrategicAdvanceReport,
  StrategicAdvanceSession,
  StrategicAdvanceWeeks,
  TimeCadenceAssessment,
  TimeCadenceOption,
} from './timeCadence';

interface TimeCommandCenterProps {
  assessment: TimeCadenceAssessment;
  options: TimeCadenceOption[];
  currentWeek: number;
  currentDate: string;
  targetDate: string | null;
  remainingWeeks: number;
  session: StrategicAdvanceSession | null;
  report: StrategicAdvanceReport | null;
  onAdvanceWeek: () => void;
  onStart: (weeks: StrategicAdvanceWeeks) => void;
  onCancel: () => void;
  onClose: () => void;
}

const tempoLabels: Record<TimeCadenceAssessment['tempo'], string> = {
  crisis: '주간 직접 지휘 권고',
  watch: '월간 확인 권고',
  managed: '분기 위임 가능',
  stable: '연간 전략 위임 가능',
};

function formatMetricValue(id: StrategicAdvanceReport['metrics'][number]['id'], value: number) {
  if (id === 'treasury') return `${value.toFixed(1)}M`;
  if (id === 'inflation') return `${value.toFixed(1)}%`;
  return `${Math.round(value)}`;
}

export function TimeCommandCenter({
  assessment,
  options,
  currentWeek,
  currentDate,
  targetDate,
  remainingWeeks,
  session,
  report,
  onAdvanceWeek,
  onStart,
  onCancel,
  onClose,
}: TimeCommandCenterProps) {
  const elapsedWeeks = session ? Math.max(0, currentWeek - session.startedWeek) : 0;
  const progress = session ? Math.min(100, elapsedWeeks * 100 / session.totalWeeks) : 0;

  return (
    <div className="time-command-backdrop" role="dialog" aria-modal="true" aria-labelledby="time-command-title">
      <section className="time-command-center">
        <header>
          <div>
            <span><CalendarClock size={15} /> STRATEGIC TIME COMMAND</span>
            <h2 id="time-command-title">지휘 주기 설정</h2>
            <p>평시는 빠르게 넘기고, 직접 판단이 필요한 순간에는 자동으로 멈춥니다.</p>
          </div>
          <button type="button" aria-label="지휘 주기 설정 닫기" onClick={onClose}><X size={18} /></button>
        </header>

        <div className={`time-command-assessment ${assessment.tempo}`}>
          <span><ShieldCheck size={19} /><small>현재 권고</small><strong>{assessment.label}</strong></span>
          <div><b>{tempoLabels[assessment.tempo]}</b><p>{assessment.summary}</p></div>
          <em>최대 {assessment.maximumWeeks}주</em>
        </div>

        {session ? (
          <section className="time-command-running" aria-live="polite">
            <div className="time-command-running-copy">
              <span><Clock3 size={17} /><small>AUTO-DELEGATION ACTIVE</small><strong>{session.totalWeeks}주 지휘 위임 실행 중</strong></span>
              <em>{remainingWeeks}주 남음</em>
            </div>
            <div className="time-command-progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="time-command-route">
              <span><small>출발</small><strong>제 {session.startedWeek + 1}주</strong></span>
              <b>{elapsedWeeks}/{session.totalWeeks}주 집행</b>
              <span><small>목표</small><strong>{targetDate ?? `제 ${session.targetWeek + 1}주`}</strong></span>
            </div>
            <button type="button" onClick={onCancel}><Pause size={15} /> 지금 멈추고 중간결산</button>
          </section>
        ) : (
          <section className="time-command-options" aria-label="진행 기간 선택">
            <button type="button" className="direct-week" onClick={onAdvanceWeek}>
              <span><Clock3 size={17} /><small>직접 지휘</small><strong>1주</strong></span>
              <p>모든 주간 결과를 직접 확인합니다.</p>
            </button>
            {options.map((option) => (
              <button
                type="button"
                key={option.weeks}
                className={option.recommended ? 'recommended' : ''}
                disabled={option.disabled}
                onClick={() => onStart(option.weeks)}
                title={option.reason ?? `${option.weeks}주 동안 부처에 집행을 위임합니다.`}
              >
                {option.recommended ? <em>현재 추천</em> : null}
                <span><CalendarClock size={17} /><small>{option.detail}</small><strong>{option.label}</strong></span>
                <p>{option.reason ?? `제 ${currentWeek + option.weeks + 1}주까지 자동 집행`}</p>
              </button>
            ))}
          </section>
        )}

        <div className="time-command-guardrails">
          <section>
            <header><AlertTriangle size={15} /><strong>자동 정지 조건</strong></header>
            {assessment.stopConditions.map((condition) => <span key={condition}>{condition}</span>)}
          </section>
          <section>
            <header><ShieldCheck size={15} /><strong>현재 감시 신호</strong></header>
            {assessment.riskSignals.map((signal) => <span key={signal}>{signal}</span>)}
          </section>
        </div>

        {report ? (
          <section className={`time-command-report ${report.completed ? 'completed' : 'interrupted'}`}>
            <header>
              <span>{report.completed ? <CheckCircle2 size={17} /> : <TimerReset size={17} />}<small>LAST DELEGATION REVIEW</small><strong>{report.headline}</strong></span>
              <em>{report.stopReason}</em>
            </header>
            <p>{report.summary}</p>
            <div>
              {report.metrics.map((metric) => {
                const favorable = metric.delta === 0 ? null : metric.inverse ? metric.delta < 0 : metric.delta > 0;
                return (
                  <article key={metric.id} className={favorable === null ? 'neutral' : favorable ? 'positive' : 'negative'}>
                    <small>{metric.label}</small>
                    <strong>{formatMetricValue(metric.id, metric.before)} → {formatMetricValue(metric.id, metric.after)}</strong>
                    <em>{metric.delta > 0 ? '+' : ''}{metric.delta.toFixed(metric.id === 'treasury' || metric.id === 'inflation' ? 1 : 0)}</em>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <footer><span>{currentDate}</span><p>장기 진행 중에도 실제 주간 엔진은 모두 계산되며 선택·사건·성과 기록은 생략되지 않습니다.</p></footer>
      </section>
    </div>
  );
}
