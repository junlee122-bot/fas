import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createStaffRoster } from './campaign';
import { attachStaffWorkReports } from './staffWorkReport';
import { StaffWorkReportCard, formatStaffWorkDelta } from './StaffWorkReportCard';
import type { StaffWorkReportCardProps } from './StaffWorkReportCard';

function fixture(): StaffWorkReportCardProps {
  const member = { ...createStaffRoster('britain', 'britain-tier1')[0], workload: 60, development: 20, morale: 70,
    loyalty: 80, roleSatisfaction: 75, contractWeeksRemaining: 20, delegated: true, workPriority: 'urgent' as const, joinedWeek: 0 };
  const work = { ...member, workload: 66.5, development: 28, morale: 71, contractWeeksRemaining: 19 };
  const final = { ...work, morale: 67, loyalty: 78 };
  const [recorded] = attachStaffWorkReports([member], [work], [final], { nationId: 'britain', fromWeek: 8, week: 9 });
  return { member: recorded, nationId: 'britain', week: 9, developmentFocusId: null,
    formatMoney: amount => `${amount} 파운드`, onOpenBriefing: vi.fn() };
}

describe('captured staff work report card', () => {
  it('renders actual deltas and the two recorded settlement stages without invoking actions', () => {
    const props = fixture(); const before = JSON.stringify(props.member);
    const html = renderToStaticMarkup(<StaffWorkReportCard {...props} />);
    expect(html).toContain('ACTUAL / 확정 기록'); expect(html).toContain('제9주 → 제10주');
    expect(html).toContain('+6.5'); expect(html).toContain('60 → 66.5'); expect(html).toContain('70 → 67');
    expect(html).toContain('업무·계약·기본관계 +1'); expect(html).toContain('조직 사건 −4');
    expect(html).toContain('합계 −3'); expect(html).toContain('추가 효과가 아닙니다');
    expect(html).toContain('전체 주간 브리핑'); expect(props.onOpenBriefing).not.toHaveBeenCalled();
    expect(JSON.stringify(props.member)).toBe(before);
  });
  it('does not invent a report for an old save or before the first settlement', () => {
    const props = fixture(); delete props.member.lastWorkReport;
    const html = renderToStaticMarkup(<StaffWorkReportCard {...props} />);
    expect(html).toContain('아직 기록된 주간 결산이 없습니다'); expect(html).toContain('과거 성과를 만들어내지 않습니다');
    expect(html).not.toContain('ACTUAL / 확정 기록'); expect(html).not.toContain('data-report-week');
  });
  it.each(['person', 'nation', 'future'] as const)('hides a mismatched %s record instead of presenting a success', reason => {
    const props = fixture();
    if (reason === 'person') props.member.personId = 'successor';
    if (reason === 'nation') props.nationId = 'korea';
    if (reason === 'future') props.week = 8;
    const html = renderToStaticMarkup(<StaffWorkReportCard {...props} />);
    expect(html).toContain('이 인물의 결산 기록을 확인할 수 없습니다');
    expect(html).not.toContain('ACTUAL / 확정 기록'); expect(html).not.toContain('60 → 66.5');
  });
  it('keeps the historical instruction when current priority and current stats have changed', () => {
    const props = fixture(); props.member.workPriority = 'recovery'; props.member.workload = 12;
    const html = renderToStaticMarkup(<StaffWorkReportCard {...props} />);
    expect(html).toContain('집중 업무'); expect(html).toContain('현재 설정의 성과가 아닙니다');
    expect(html).toContain('60 → 66.5'); expect(html).not.toContain('60 → 12');
  });
  it('labels an old receipt without claiming that it belongs to the most recent week', () => {
    const props = fixture(); props.week = 12;
    const html = renderToStaticMarkup(<StaffWorkReportCard {...props} />);
    expect(html).toContain('3주 전 보관 기록'); expect(html).not.toContain('최근 결산 확정');
  });
  it('presents the salary as a reference, not an additional expense or proof of payment', () => {
    const props = fixture();
    const html = renderToStaticMarkup(<StaffWorkReportCard {...props} />);
    expect(html).toContain(`당시 주급 기준액 ${props.member.lastWorkReport!.basis.weeklyCost} 파운드`);
    expect(html).toContain('현재 표시 통화 기준'); expect(html).toContain('개인 지급 완료 증빙이 아닙니다');
    expect(html).toContain('국가 생산·연구·전투 성과 전체를 이 사람의 공적으로 계산하지 않습니다');
  });
  it('distinguishes an expired contract from a later user instruction', () => {
    const props = fixture(); const report = props.member.lastWorkReport!;
    report.before.contractWeeks = 1; report.afterWork.contractWeeks = 0; report.after.contractWeeks = 0;
    report.delegatedAfter = false; props.member.delegated = false; props.member.contractWeeksRemaining = 0;
    const html = renderToStaticMarkup(<StaffWorkReportCard {...props} />);
    expect(html).toContain('계약 0주 · 위임 해제 확인'); expect(html).not.toContain('이후 보직·방침');
  });
  it('does not offer a dead-end briefing action when no navigation callback exists', () => {
    const props = fixture(); delete props.onOpenBriefing;
    expect(renderToStaticMarkup(<StaffWorkReportCard {...props} />)).not.toContain('<button');
  });
  it('rounds small deltas consistently and never shows negative zero', () => {
    expect(formatStaffWorkDelta(0)).toBe('변화 없음'); expect(formatStaffWorkDelta(-.00001)).toBe('변화 없음');
    expect(formatStaffWorkDelta(6.49999999)).toBe('+6.5'); expect(formatStaffWorkDelta(-2)).toBe('−2');
  });
});
