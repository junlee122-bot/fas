export type StrategicAdvanceWeeks = 4 | 13 | 26 | 52;

export type StrategicTempo = 'crisis' | 'watch' | 'managed' | 'stable';

export interface NationAdvanceEvent {
  id: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface NationAdvanceSignals {
  researchCompleted?: boolean;
  researchUnlocked?: boolean;
  publicHealthCrisis?: boolean;
  authorityLost?: boolean;
  requiresDecision?: boolean;
}

/** Routine quarterly reporting does not cancel an otherwise safe delegation. */
export function shouldInterruptNationAdvance(
  events: readonly NationAdvanceEvent[],
  signals: NationAdvanceSignals = {},
): boolean {
  if (signals.researchCompleted || signals.researchUnlocked || signals.publicHealthCrisis
    || signals.authorityLost || signals.requiresDecision) return true;
  return events.some((event) => {
    if (event.tone === 'bad') return true;
    // Only these explicitly routine reports are safe to collect for the final digest.
    // Unknown events still stop so a new decision system cannot silently be skipped.
    return !event.id.startsWith('civic-review-') && !event.id.startsWith('productivity-boom-');
  });
}

export interface TimeCadenceContext {
  year: number;
  unrest: number;
  activeElection: boolean;
  publicHealthPressure: number;
  activeStrategicOperation: boolean;
  activeNationalPlan: boolean;
}

export interface TimeCadenceOption {
  weeks: StrategicAdvanceWeeks;
  label: string;
  detail: string;
  recommended: boolean;
  disabled: boolean;
  reason: string | null;
}

export interface TimeCadenceAssessment {
  tempo: StrategicTempo;
  label: string;
  summary: string;
  recommendedWeeks: StrategicAdvanceWeeks;
  maximumWeeks: StrategicAdvanceWeeks;
  reviewIntervalWeeks: number;
  riskSignals: string[];
  stopConditions: string[];
}

export interface StrategicAdvanceSnapshot {
  week: number;
  treasury: number;
  stability: number;
  mandate: number;
  unrest: number;
  nationalScore: number;
  publicConfidence: number;
  inflation: number;
}

export interface StrategicAdvanceSession {
  id: string;
  totalWeeks: StrategicAdvanceWeeks;
  startedWeek: number;
  targetWeek: number;
  snapshot: StrategicAdvanceSnapshot;
  assessment: TimeCadenceAssessment;
}

export interface StrategicAdvanceMetric {
  id: 'treasury' | 'stability' | 'mandate' | 'unrest' | 'nationalScore' | 'publicConfidence' | 'inflation';
  label: string;
  before: number;
  after: number;
  delta: number;
  inverse?: boolean;
}

export interface StrategicAdvanceReport {
  id: string;
  startedWeek: number;
  endedWeek: number;
  targetWeek: number;
  elapsedWeeks: number;
  requestedWeeks: StrategicAdvanceWeeks;
  completed: boolean;
  stopReason: string;
  headline: string;
  summary: string;
  metrics: StrategicAdvanceMetric[];
}

export function assessStrategicCadence(context: TimeCadenceContext): TimeCadenceAssessment {
  const riskSignals: string[] = [];
  if (context.unrest >= 65) riskSignals.push(`사회 불안 ${Math.round(context.unrest)} · 즉시 점검`);
  else if (context.unrest >= 45) riskSignals.push(`사회 불안 ${Math.round(context.unrest)} · 관찰 필요`);
  if (context.publicHealthPressure >= 55) riskSignals.push(`보건 압력 ${Math.round(context.publicHealthPressure)} · 위기 대응`);
  else if (context.publicHealthPressure >= 30) riskSignals.push(`보건 압력 ${Math.round(context.publicHealthPressure)} · 감시 강화`);
  if (context.activeElection) riskSignals.push('선거·국민투표 일정 진행 중');

  const hasLongProgram = context.activeNationalPlan || context.activeStrategicOperation;
  const highRisk = context.unrest >= 65 || context.publicHealthPressure >= 55;
  const mediumRisk = context.unrest >= 45 || context.publicHealthPressure >= 30 || context.activeElection;
  const tempo: StrategicTempo = highRisk
    ? 'crisis'
    : mediumRisk
      ? 'watch'
      : context.year >= 1950 && hasLongProgram
        ? 'stable'
        : 'managed';
  const recommendedWeeks: StrategicAdvanceWeeks = tempo === 'crisis'
    ? 4
    : tempo === 'watch' || context.year < 1946
      ? 13
      : tempo === 'managed' || !hasLongProgram
        ? 26
        : 52;
  const maximumWeeks: StrategicAdvanceWeeks = highRisk
    ? 4
    : mediumRisk || context.year < 1946
      ? 13
      : context.year < 1950 || !hasLongProgram
        ? 26
        : 52;
  const labels: Record<StrategicTempo, { label: string; summary: string; review: number }> = {
    crisis: { label: '위기 지휘', summary: '주간 판단을 유지하고 한 달 안에 반드시 재검토해야 합니다.', review: 4 },
    watch: { label: '집중 관찰', summary: '정책은 위임할 수 있지만 선거·불안·보건 신호를 분기 전에 확인해야 합니다.', review: 4 },
    managed: { label: '관리 국면', summary: '부처에 집행을 위임하고 월간·분기 성과를 중심으로 판단할 수 있습니다.', review: 13 },
    stable: { label: '장기 전략', summary: '국가계획을 기준선으로 삼아 연간 진행하되 분기 감사에서 자동 점검합니다.', review: 13 },
  };
  const meta = labels[tempo];

  return {
    tempo,
    label: meta.label,
    summary: meta.summary,
    recommendedWeeks,
    maximumWeeks,
    reviewIntervalWeeks: meta.review,
    riskSignals: riskSignals.length > 0 ? riskSignals : ['즉시 개입이 필요한 국가 위험 없음'],
    stopConditions: [
      '쿠데타·전쟁·외교 위기 또는 비밀 접촉',
      '선거·국민투표·헌정 및 사법 결재',
      '감염병 확산·전략사업 중간평가',
      `정기 성과검토는 최대 ${meta.review}주 간격으로 기록 · 위험·결재 발생 시 정지`,
    ],
  };
}

export function getStrategicTimeAdvanceOptions(context: TimeCadenceContext): TimeCadenceOption[] {
  const assessment = assessStrategicCadence(context);
  const highRisk = assessment.tempo === 'crisis';
  const mediumRisk = assessment.tempo === 'watch';
  const annualUnlocked = context.year >= 1950;
  const halfYearUnlocked = context.year >= 1946;
  const hasLongProgram = context.activeNationalPlan || context.activeStrategicOperation;

  return [
    {
      weeks: 4,
      label: '1개월',
      detail: '4주 결산',
      recommended: assessment.recommendedWeeks === 4,
      disabled: false,
      reason: null,
    },
    {
      weeks: 13,
      label: '1분기',
      detail: '13주 정책 주기',
      recommended: assessment.recommendedWeeks === 13,
      disabled: highRisk,
      reason: highRisk ? '사회·보건 위험이 높아 월 단위 점검이 필요합니다.' : null,
    },
    {
      weeks: 26,
      label: '반기',
      detail: '26주 전략 주기',
      recommended: assessment.recommendedWeeks === 26,
      disabled: !halfYearUnlocked || highRisk || mediumRisk,
      reason: !halfYearUnlocked ? '전시 직후인 1946년부터 사용할 수 있습니다.' : highRisk || mediumRisk ? '선거·불안·보건 위험으로 장기 위임이 제한됩니다.' : null,
    },
    {
      weeks: 52,
      label: '1년',
      detail: hasLongProgram ? '장기 계획 자동집행' : '연간 국정 위임',
      recommended: assessment.recommendedWeeks === 52,
      disabled: !annualUnlocked || highRisk || mediumRisk || !hasLongProgram,
      reason: !annualUnlocked
        ? '1950년 이후의 평시 체제에서 열립니다.'
        : highRisk || mediumRisk
          ? '선거·불안·보건 위험으로 분기 이하 진행만 가능합니다.'
          : !hasLongProgram
            ? '진행 중인 국가계획 또는 전략작전이 있어야 연간 위임할 수 있습니다.'
            : null,
    },
  ];
}

export function createStrategicAdvanceSession(
  weeks: StrategicAdvanceWeeks,
  snapshot: StrategicAdvanceSnapshot,
  assessment: TimeCadenceAssessment,
): StrategicAdvanceSession {
  return {
    id: `strategic-advance-${snapshot.week}-${weeks}`,
    totalWeeks: weeks,
    startedWeek: snapshot.week,
    targetWeek: snapshot.week + weeks,
    snapshot,
    assessment,
  };
}

export function buildStrategicAdvanceReport(
  session: StrategicAdvanceSession,
  snapshot: StrategicAdvanceSnapshot,
  stopReason: string,
): StrategicAdvanceReport {
  const completed = snapshot.week >= session.targetWeek;
  const metricDefinitions: Array<Pick<StrategicAdvanceMetric, 'id' | 'label' | 'inverse'>> = [
    { id: 'treasury', label: '국고' },
    { id: 'stability', label: '안정도' },
    { id: 'mandate', label: '국민 위임' },
    { id: 'unrest', label: '사회 불안', inverse: true },
    { id: 'nationalScore', label: '국가 성과' },
    { id: 'publicConfidence', label: '경제 신뢰' },
    { id: 'inflation', label: '물가', inverse: true },
  ];
  const metrics = metricDefinitions.map((definition) => ({
    ...definition,
    before: session.snapshot[definition.id],
    after: snapshot[definition.id],
    delta: Number((snapshot[definition.id] - session.snapshot[definition.id]).toFixed(2)),
  }));
  const improved = metrics.filter((metric) => metric.delta !== 0 && (metric.inverse ? metric.delta < 0 : metric.delta > 0)).length;
  const worsened = metrics.filter((metric) => metric.delta !== 0 && (metric.inverse ? metric.delta > 0 : metric.delta < 0)).length;
  const elapsedWeeks = Math.max(0, snapshot.week - session.startedWeek);

  return {
    id: `${session.id}-${snapshot.week}`,
    startedWeek: session.startedWeek,
    endedWeek: snapshot.week,
    targetWeek: session.targetWeek,
    elapsedWeeks,
    requestedWeeks: session.totalWeeks,
    completed,
    stopReason,
    headline: completed ? `${session.totalWeeks}주 위임 집행 완료` : `${elapsedWeeks}주차에 자동 정지`,
    summary: `${session.assessment.label} 기준으로 ${elapsedWeeks}주를 집행했습니다. 개선 ${improved}개 · 악화 ${worsened}개 지표를 다음 결정의 기준선으로 남깁니다.`,
    metrics,
  };
}

export function normalizeStrategicAdvanceReport(value: unknown): StrategicAdvanceReport | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StrategicAdvanceReport>;
  if (typeof candidate.id !== 'string'
    || typeof candidate.startedWeek !== 'number'
    || typeof candidate.endedWeek !== 'number'
    || typeof candidate.targetWeek !== 'number'
    || ![4, 13, 26, 52].includes(candidate.requestedWeeks ?? 0)
    || typeof candidate.stopReason !== 'string'
    || !Array.isArray(candidate.metrics)) return null;
  const metricIds = new Set<StrategicAdvanceMetric['id']>(['treasury', 'stability', 'mandate', 'unrest', 'nationalScore', 'publicConfidence', 'inflation']);
  const metrics = candidate.metrics.filter((metric): metric is StrategicAdvanceMetric => Boolean(
    metric
    && typeof metric === 'object'
    && metricIds.has(metric.id)
    && typeof metric.label === 'string'
    && typeof metric.before === 'number'
    && typeof metric.after === 'number'
    && typeof metric.delta === 'number',
  ));
  if (metrics.length !== 7) return null;
  const elapsedWeeks = Math.max(0, candidate.endedWeek - candidate.startedWeek);
  return {
    id: candidate.id,
    startedWeek: candidate.startedWeek,
    endedWeek: candidate.endedWeek,
    targetWeek: candidate.targetWeek,
    elapsedWeeks,
    requestedWeeks: candidate.requestedWeeks as StrategicAdvanceWeeks,
    completed: candidate.endedWeek >= candidate.targetWeek,
    stopReason: candidate.stopReason,
    headline: typeof candidate.headline === 'string' ? candidate.headline : `${elapsedWeeks}주 지휘 주기 결산`,
    summary: typeof candidate.summary === 'string' ? candidate.summary : `${elapsedWeeks}주 동안의 국가 지표 변화를 복원했습니다.`,
    metrics,
  };
}
