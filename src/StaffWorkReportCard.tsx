import { useId } from 'react';
import { ArrowRight, ClipboardCheck, History, Info } from 'lucide-react';
import { getStaffSeatDefinition } from './staffOrganization';
import { getStaffWorkReport, type StaffWorkReport } from './staffWorkReport';
import { staffWorkPriorities } from './staffWork';
import type { NationId, StaffMember } from './types';
import './StaffWorkReportCard.css';

export interface StaffWorkReportCardProps {
  member: StaffMember;
  nationId: NationId;
  week: number;
  developmentFocusId?: string | null;
  formatMoney: (value: number) => string;
  onOpenBriefing?: () => void;
}
const metrics: { key: keyof StaffWorkReport['before']; label: string; suffix?: string }[] = [
  { key: 'workload', label: '업무 부담' }, { key: 'development', label: '성장도' }, { key: 'morale', label: '사기' },
  { key: 'loyalty', label: '충성도' }, { key: 'roleSatisfaction', label: '역할 만족' }, { key: 'contractWeeks', label: '남은 계약', suffix: '주' },
];
export const formatStaffWorkValue = (value: number) => (Math.round(value * 100) / 100).toLocaleString('ko-KR');
export const formatStaffWorkDelta = (value: number) => Math.abs(value) < .005 ? '변화 없음' : `${value > 0 ? '+' : '−'}${formatStaffWorkValue(Math.abs(value))}`;
function tone(key: keyof StaffWorkReport['before'], delta: number) {
  if (Math.abs(delta) < .005 || key === 'contractWeeks') return 'neutral';
  return (key === 'workload' ? delta < 0 : delta > 0) ? 'good' : 'warning';
}

/** Displays captured settlement snapshots only; never reruns weekly growth or pays wages. */
export function StaffWorkReportCard(props: StaffWorkReportCardProps) {
  const id = useId();
  const result = getStaffWorkReport(props.member, props.nationId, props.week, props.developmentFocusId);
  if (result.status !== 'available') return <section className="staff-work-report staff-work-report--empty" aria-labelledby={id}>
    <h4 id={id}><ClipboardCheck size={17} aria-hidden="true" />최근 주간 결산</h4>
    <strong>{result.status === 'invalid' ? '이 인물의 결산 기록을 확인할 수 없습니다' : '아직 기록된 주간 결산이 없습니다'}</strong>
    <p>{result.status === 'invalid' ? '소속·인물·주차 또는 저장 자료가 맞지 않아 결과를 대신 추정하지 않습니다.' : '첫 결산 전이거나 개인 기록이 없는 이전 저장입니다. 현재 수치로 과거 성과를 만들어내지 않습니다.'}</p>
    <small>다음 주간 결산부터 실제 변화가 기록됩니다. ‘이번 주 업무’의 예상 수치와는 별개입니다.</small>
  </section>;
  const { report, ageWeeks, instructionChanged } = result;
  const priority = staffWorkPriorities.find(option => option.id === report.basis.priority)!;
  return <section className="staff-work-report" aria-labelledby={id} data-report-week={report.week}>
    <header className="staff-work-report-heading"><div><span>ACTUAL / 확정 기록</span><h4 id={id}><ClipboardCheck size={17} aria-hidden="true" />최근 주간 결산</h4></div><span className="staff-work-report-week">제{report.week + 1}주</span></header>
    <p className="staff-work-report-period">제{report.fromWeek + 1}주 → 제{report.week + 1}주 · {report.personName}{ageWeeks > 0 ? ` · ${ageWeeks}주 전 보관 기록` : ' · 최근 결산 확정'}</p>
    <dl className="staff-work-report-summary">{metrics.slice(0, 3).map(metric => {
      const delta = report.after[metric.key] - report.before[metric.key];
      return <div key={metric.key} data-tone={tone(metric.key, delta)}><dt>{metric.label}</dt><dd>{formatStaffWorkDelta(delta)}<small>{formatStaffWorkValue(report.before[metric.key])} → {formatStaffWorkValue(report.after[metric.key])}</small></dd></div>;
    })}</dl>
    <div className="staff-work-report-basis"><strong>당시 맡긴 업무</strong><p>{getStaffSeatDefinition(report.departmentBefore).label} · {priority.label}</p><span>{report.basis.delegated ? '책임 위임' : '위임 안 함'} · {report.basis.focused ? '집중 육성 대상' : '일반 육성'}</span></div>
    {instructionChanged ? <p className="staff-work-report-notice"><History size={16} aria-hidden="true" />이후 보직·방침·위임·육성 설정이 달라졌습니다. 이 결과는 당시 설정의 기록이며 현재 설정의 성과가 아닙니다.</p> : null}
    {report.after.contractWeeks === 0 ? <p className="staff-work-report-notice"><Info size={16} aria-hidden="true" />결산 시점 계약 0주{!report.delegatedAfter && report.basis.delegated ? ' · 위임 해제 확인' : ''}. 현재 계약과 재계약 필요 여부는 인물 정보에서 확인하십시오.</p> : null}
    <details className="staff-work-report-details"><summary>어떤 과정에서 달라졌나요?</summary>
      <p>업무·계약·기본관계 정산 후, 조직 사건을 반영한 최종 값입니다. 아래 두 변화는 합계의 구성요소이며 추가 효과가 아닙니다.</p>
      <dl>{metrics.map(metric => {
        const workDelta = report.afterWork[metric.key] - report.before[metric.key];
        const storyDelta = report.after[metric.key] - report.afterWork[metric.key];
        return <div key={metric.key} className="staff-work-report-metric"><dt>{metric.label}</dt><dd><strong>{formatStaffWorkValue(report.before[metric.key])}{metric.suffix} → {formatStaffWorkValue(report.after[metric.key])}{metric.suffix}</strong><span data-tone={tone(metric.key, workDelta + storyDelta)}>합계 {formatStaffWorkDelta(workDelta + storyDelta)}</span></dd><dd className="staff-work-report-components"><span>업무·계약·기본관계 {formatStaffWorkDelta(workDelta)}</span><span>조직 사건 {formatStaffWorkDelta(storyDelta)}</span></dd></div>;
      })}</dl>
      <p>기록 범위는 이 참모의 상태 변화입니다. 국가 생산·연구·전투 성과 전체를 이 사람의 공적으로 계산하지 않습니다.</p>
      <p className="staff-work-report-cost"><strong>당시 주급 기준액 {props.formatMoney(report.basis.weeklyCost)}</strong><small>현재 표시 통화 기준. 국가 결산의 인건비 산정에 쓰인 기준액이며, 별도 지출·개인 지급 완료 증빙이 아닙니다.</small></p>
    </details>
    <p className="staff-work-report-scope">개인 상태 결산입니다. 결산 후 면담·인사조치로 현재 수치는 달라질 수 있습니다.</p>
    {props.onOpenBriefing ? <button type="button" className="staff-work-report-briefing" onClick={props.onOpenBriefing}>전체 주간 브리핑<ArrowRight size={15} aria-hidden="true" /></button> : null}
  </section>;
}
