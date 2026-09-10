import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StaffMeetingRoom, StaffMeetingDecisionPreview } from './StaffMeetingRoom';
import { createStaffRoster } from './campaign';
import { advanceStaffNarrativeWeek, createStaffNarrativeState, getStaffNarrativeOptions, resolveStaffNarrativeDecision } from './staffNarrative';
import { deriveStaffMeetingPreview } from './staffMeeting';
import type { StaffMeetingContext } from './staffMeeting';

function fixture(solo = false): StaffMeetingContext {
  const staff = createStaffRoster('britain', 'britain-tier1');
  const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [{ id: 'real-report-2', week: 2, kind: 'battle-victory', description: '실제 전투 보고의 제한된 요약', staffIds: solo ? [staff[0].id] : [staff[0].id, staff[1].id] }] });
  return { state: opened.state, staff: opened.staff, week: 3, politicalPower: 50, manageableStaffIds: new Set(staff.map((member) => member.id)), organizationMandate: { tab: 'organization', mode: 'direct', label: '직접 결재', reason: '담당 보직', authorityRoute: '기존 상신 경로' } };
}

function render(context = fixture()) {
  const onResolve = vi.fn(() => true);
  const onOpenAuthority = vi.fn();
  const before = JSON.stringify(context);
  const html = renderToStaticMarkup(<StaffMeetingRoom {...context} onResolve={onResolve} onOpenAuthority={onOpenAuthority} />);
  expect(JSON.stringify(context)).toBe(before);
  expect(onResolve).not.toHaveBeenCalled();
  expect(onOpenAuthority).not.toHaveBeenCalled();
  return html;
}

describe('staff meeting room presentation contract', () => {
  it('shows only actual participants, source ID and explicitly reconstructed gameplay opinions', () => {
    const context = fixture();
    const html = render(context);
    expect(html).toContain('참모 회의장');
    expect(html.match(/class="staff-meeting-seat"/g)).toHaveLength(2);
    expect(html).toContain(context.staff[0].name);
    expect(html).toContain(context.staff[1].name);
    expect(html).not.toContain(context.staff[2].name);
    expect(html).toContain('근거 ID: real-report-2');
    expect(html).toContain('실제 전투 보고의 제한된 요약');
    expect(html).toContain('게임 상황에 맞춘 재구성 의견 · 역사적 인용 아님');
    expect(html).not.toContain('<blockquote');
    expect(html).not.toContain('<img');
    expect(html).toContain('비공개 원문이나 추가 정보는 조회하지 않습니다');
  });

  it('does not fabricate a second seat or a vacant cast member for solo/empty agendas', () => {
    expect(render(fixture(true)).match(/class="staff-meeting-seat"/g)).toHaveLength(1);
    const context = fixture();
    context.state.activeStorylines = [];
    const html = render(context);
    expect(html).toContain('지금 검토할 활성 현안이 없습니다');
    expect(html).not.toContain('class="staff-meeting-seat"');
    expect(html).not.toContain('이 내용으로 결재');
  });

  it('disables out-of-scope options and describes command-chain navigation without claiming approval', () => {
    const context = fixture();
    context.manageableStaffIds = new Set();
    const html = render(context);
    expect(html).toContain('당사자 모두 현재 보직의 직접 인사 관리 범위 밖');
    expect(html).toContain('보직·지휘계통 확인');
    expect(html).toContain('이 화면 이동은 권한 위임이나 안건 승인이 아닙니다');
    expect(html).not.toContain('기존 권한 상신·보고 경로');
    expect(html.match(/aria-pressed="false"[^>]*disabled=""/g)).toHaveLength(3);
    context.organizationMandate = { ...context.organizationMandate, mode: 'report' };
    expect(render(context)).toContain('조직 업무의 직접 결재권이 없습니다');
  });

  it('does not seat a replacement or attribute the original participant opinion to them', () => {
    const context = fixture();
    context.staff = context.staff.map((person, index) => index === 0 ? { ...person, personId: 'replacement', name: '새 후임자' } : person);
    const html = render(context);
    expect(html).not.toContain('새 후임자');
    expect(html).toContain('퇴임·교체 또는 중복 식별');
    expect(html.match(/class="staff-meeting-seat"/g)).toHaveLength(1);
  });

  it('contains labelled keyboard tabs, panels, agenda selection and a no-mutation postpone action', () => {
    const html = render();
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(2);
    expect(html).toContain('aria-selected="true" tabindex="0"');
    expect(html).toContain('aria-selected="false" tabindex="-1"');
    expect(html).toContain('aria-label="회의 자료"');
    expect(html).toContain('검토할 안건');
    expect(html).toContain('지금은 보류 · 현안 유지');
    expect(html).toContain('입장·열람·보류에는 비용이나 주간 성과 보상이 없습니다');
    expect(html).not.toContain('이 내용으로 결재');
  });

  it('shows a confirmation preview as unapplied, with only one PP charge and a future verification week', () => {
    const context = fixture();
    const story = context.state.activeStorylines[0];
    const preview = deriveStaffMeetingPreview(context, story.id, 'mediate')!;
    const html = renderToStaticMarkup(<StaffMeetingDecisionPreview preview={preview} />);
    expect(html).toContain('결재 전 확인 · 아직 적용되지 않음');
    expect(html).toContain('필요 정치력 3 · 정치력 50 → 47');
    expect(html).toContain('제6주 후속 확인 예정');
    expect(html).toContain('별도 회의비는 없습니다');
    expect(html).not.toContain('이행 완료했습니다');
  });

  it('displays only actual history verification and preserves former names without current attribution', () => {
    const context = fixture();
    const story = context.state.activeStorylines[0];
    const result = resolveStaffNarrativeDecision(context.state, context.staff, story.id, getStaffNarrativeOptions(story)[0].id, 3)!;
    const beforeCheck = render({ ...context, state: result.state, staff: result.staff, week: 5 });
    expect(beforeCheck).toContain('주간 처리 기록 대기');
    expect(beforeCheck).not.toContain('후속 확인 기록 있음');
    const checked = advanceStaffNarrativeWeek({ ...result.state, nextStoryWeek: 10000 }, result.staff, 5);
    const html = render({ ...context, state: checked.state, staff: [], week: 8 });
    expect(html).toContain('제6주 후속 확인 기록 있음');
    expect(html).toContain('당시 확인 사기');
    expect(html).toContain(result.staff[0].name);
    expect(html).toContain(`원 안건 ID: ${story.id}`);
    expect(html).toContain('원 결정의 발생 근거 다시 읽기');
  });

  it('rounds presentation-only floating point noise without changing the original preview', () => {
    const context = fixture();
    const preview = deriveStaffMeetingPreview(context, context.state.activeStorylines[0].id, 'mediate')!;
    preview.people[0].effects[0].before = 91.74999999999997;
    const html = renderToStaticMarkup(<StaffMeetingDecisionPreview preview={preview} />);
    expect(html).toContain('91.7');
    expect(html).not.toContain('91.74999999999997');
    expect(preview.people[0].effects[0].before).toBe(91.74999999999997);
  });

  it('labels legacy unidentified history void even when an old verifiedWeek exists', () => {
    const context = fixture();
    const story = context.state.activeStorylines[0];
    const result = resolveStaffNarrativeDecision(context.state, context.staff, story.id, 'mediate', 3)!;
    result.state.history[0] = { ...result.state.history[0], participants: undefined, verifiedWeek: 5 };
    const html = render({ ...context, state: result.state, week: 8 });
    expect(html).toContain('검증 불가 · 후임자에게 책임을 넘기지 않음');
    expect(html).not.toContain('후속 확인 기록 있음');
  });

});
