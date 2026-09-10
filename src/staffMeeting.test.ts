import { describe, expect, it } from 'vitest';
import { createStaffRoster } from './campaign';
import { createStaffNarrativeState, resolveStaffNarrativeDecision, advanceStaffNarrativeWeek, normalizeStaffNarrativeState } from './staffNarrative';
import type { StaffStoryline } from './staffNarrative';
import { deriveStaffMeetingAgenda, deriveStaffMeetingEvidence, deriveStaffMeetingHistory, deriveStaffMeetingPreview } from './staffMeeting';
import type { StaffMeetingContext } from './staffMeeting';

export function meetingFixture(two = true): StaffMeetingContext {
  const staff = createStaffRoster('britain', 'britain-tier1').slice(0, 3).map((member, index) => ({ ...member, joinedWeek: 0, morale: index === 0 ? 98 : 60, roleSatisfaction: index === 0 ? 99 : 60, workload: index === 0 ? 6 : 60 }));
  const story: StaffStoryline = {
    id: 'staff-story-event:actual-battle-2', kind: 'policy-feud', stage: 'private',
    title: '확인된 전투 보고의 책임 검토', summary: '원본 전투 결과를 바탕으로 책임을 검토합니다.',
    question: '책임을 어떻게 나눌까요?', trigger: '실제 방어전 보고', stakes: '업무 조정의 필요',
    firstStaffId: staff[0].id, firstPersonId: staff[0].personId,
    ...(two ? { secondStaffId: staff[1].id, secondPersonId: staff[1].personId } : {}),
    createdWeek: 3, deadlineWeek: 5, publicRisk: 30, escalationCount: 0,
    cause: { source: 'verified-event', evidenceId: 'actual-battle-2', week: 2, description: '확인된 방어전 승리 기록', eventKind: 'battle-victory' },
  };
  const state = createStaffNarrativeState(staff, 3);
  state.activeStorylines = [story];
  state.nextStoryWeek = 10000;
  return { state, staff, week: 3, politicalPower: 30, manageableStaffIds: new Set(staff.map((person) => person.id)), organizationMandate: { tab: 'organization', mode: 'direct', label: '직접 결재', reason: '보직 권한', authorityRoute: '기존 조직 경로' } };
}

describe('staff meeting read-only projections', () => {
  it('permits either actual participant inside managed scope, not every direct-tab user', () => {
    const context = meetingFixture();
    for (const member of context.staff.slice(0, 2)) expect(deriveStaffMeetingAgenda({ ...context, manageableStaffIds: new Set([member.id]) }, context.state.activeStorylines[0].id).canResolve).toBe(true);
    expect(deriveStaffMeetingAgenda({ ...context, manageableStaffIds: new Set([context.staff[2].id]) }, context.state.activeStorylines[0].id).canResolve).toBe(false);
    for (const mode of ['request', 'report', 'locked'] as const) expect(deriveStaffMeetingAgenda({ ...context, organizationMandate: { ...context.organizationMandate, mode } }, context.state.activeStorylines[0].id).canResolve).toBe(false);
    expect(deriveStaffMeetingAgenda({ ...context, organizationMandate: { ...context.organizationMandate, tab: 'industry' } }, context.state.activeStorylines[0].id).canResolve).toBe(false);
  });

  it('never adds a second participant to a solo story or uses names to resolve identity', () => {
    const context = meetingFixture(false);
    const sameNames = context.staff.map((member) => ({ ...member, name: '동명이인' }));
    const result = deriveStaffMeetingAgenda({ ...context, staff: sameNames }, context.state.activeStorylines[0].id);
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].member.personId).toBe(context.staff[0].personId);
    expect(result.options.every((option) => option.bondDelta === 0)).toBe(true);
  });

  it('blocks departed, replaced, ambiguous and unidentified participants without seating successors', () => {
    const context = meetingFixture();
    const id = context.state.activeStorylines[0].id;
    for (const staff of [context.staff.slice(1), context.staff.map((member, i) => i === 0 ? { ...member, personId: 'new-person', name: '후임자' } : member), [...context.staff, context.staff[0]]]) {
      const result = deriveStaffMeetingAgenda({ ...context, staff }, id);
      expect(result.canResolve).toBe(false);
      expect(result.participants.some((person) => person.member.name === '후임자')).toBe(false);
    }
    context.state.activeStorylines[0].firstPersonId = undefined;
    expect(deriveStaffMeetingAgenda(context, id).canResolve).toBe(false);
  });

  it('labels internal and historical evidence honestly and rejects future/invalid provenance', () => {
    const context = meetingFixture();
    const story = context.state.activeStorylines[0];
    const old = deriveStaffMeetingEvidence(story.cause, 3, 30);
    expect(old.valid).toBe(true);
    expect(old.warning).toContain('과거 사건');
    expect(deriveStaffMeetingEvidence(undefined, 3, 3)).toMatchObject({ source: 'internal-state', evidenceId: null });
    story.cause = { ...story.cause, week: 4 };
    expect(deriveStaffMeetingAgenda(context, story.id).canResolve).toBe(false);
    expect(deriveStaffMeetingPreview(context, story.id, 'mediate')?.canConfirm).toBe(false);
    story.cause = { ...story.cause, week: 2, evidenceId: '' };
    expect(deriveStaffMeetingAgenda(context, story.id).canResolve).toBe(false);
  });

  it('uses the existing resolver for capped immediate changes, single cost and verification timing', () => {
    const context = meetingFixture();
    const id = context.state.activeStorylines[0].id;
    const preview = deriveStaffMeetingPreview(context, id, 'mediate')!;
    expect(preview.canConfirm).toBe(true);
    expect(preview.politicalPowerAfter).toBe(27);
    expect(preview.gameDelta).toEqual({ politicalPower: -3 });
    expect(preview.verificationWeek).toBe(5);
    expect(preview.people[0].effects).toEqual(expect.arrayContaining([{ label: '사기', before: 98, after: 100 }, { label: '역할 만족', before: 99, after: 100 }, { label: '업무량', before: 6, after: 5 }]));
    expect(deriveStaffMeetingPreview(context, id, 'nonexistent')).toBeNull();
    const applied = resolveStaffNarrativeDecision(context.state, context.staff, id, 'mediate', 3)!;
    expect(preview.gameDelta).toEqual(applied.gameDelta);
    expect(preview.verificationWeek).toBe(applied.state.history[0].verificationWeek);
  });

  it('shows a six-week handover, not the internal -999 implementation sentinel', () => {
    const context = meetingFixture(false);
    context.state.activeStorylines[0].kind = 'resignation-threat';
    const preview = deriveStaffMeetingPreview(context, context.state.activeStorylines[0].id, 'handover')!;
    expect(preview.people[0].effects.find((effect) => effect.label === '잔여 계약(주)')?.after).toBe(6);
    expect(JSON.stringify(preview.people)).not.toContain('-999');
  });

  it('requires re-review after PP, authority, week, people or source changes', () => {
    const context = meetingFixture();
    const id = context.state.activeStorylines[0].id;
    const original = deriveStaffMeetingPreview(context, id, 'mediate')!;
    const insufficient = deriveStaffMeetingPreview({ ...context, politicalPower: 2 }, id, 'mediate')!;
    expect(insufficient.canConfirm).toBe(false);
    expect(insufficient.reviewToken).not.toBe(original.reviewToken);
    expect(deriveStaffMeetingPreview({ ...context, week: 4 }, id, 'mediate')?.reviewToken).not.toBe(original.reviewToken);
    expect(deriveStaffMeetingPreview({ ...context, manageableStaffIds: new Set() }, id, 'mediate')?.canConfirm).toBe(false);
    expect(deriveStaffMeetingPreview({ ...context, politicalPower: Number.NaN }, id, 'mediate')?.canConfirm).toBe(false);
  });

  it('does not re-execute handled agendas even when a stale active copy still exists', () => {
    const context = meetingFixture();
    const id = context.state.activeStorylines[0].id;
    const applied = resolveStaffNarrativeDecision(context.state, context.staff, id, 'mediate', 3)!;
    const stale = { ...context, state: { ...context.state, history: applied.state.history } };
    expect(deriveStaffMeetingAgenda(stale, id).status).toBe('handled');
    expect(deriveStaffMeetingPreview(stale, id, 'mediate')).toBeNull();
    expect(resolveStaffNarrativeDecision(stale.state, stale.staff, id, 'mediate', 3)).toBeNull();
  });

  it('renders a due week as pending until the original week processor records verification', () => {
    const context = meetingFixture();
    const applied = resolveStaffNarrativeDecision(context.state, context.staff, context.state.activeStorylines[0].id, 'mediate', 3)!;
    const record = applied.state.history[0];
    expect(deriveStaffMeetingHistory(record, applied.staff, 4).status).toBe('waiting');
    expect(deriveStaffMeetingHistory(record, applied.staff, 5).status).toBe('due');
    expect(deriveStaffMeetingHistory(record, applied.staff, 20).status).toBe('due');
    const checked = advanceStaffNarrativeWeek(applied.state, applied.staff, 5);
    expect(deriveStaffMeetingHistory(checked.state.history[0], checked.staff, 5).status).toBe('verified');
  });

  it('never attributes legacy history to current occupants, and preserves named former participants', () => {
    const context = meetingFixture();
    const applied = resolveStaffNarrativeDecision(context.state, context.staff, context.state.activeStorylines[0].id, 'mediate', 3)!;
    const record = applied.state.history[0];
    const legacy = { ...record, participants: undefined };
    expect(deriveStaffMeetingHistory(legacy, context.staff, 9).status).toBe('void');
    expect(deriveStaffMeetingHistory(legacy, context.staff, 9).participantNote).toContain('당시 인물 ID가 기록에 없어');
    const former = deriveStaffMeetingHistory(record, [], 9);
    expect(former.status).toBe('void');
    expect(former.participantNote).toContain(context.staff[0].name);
  });

  it('reading, previewing and save round trips do not duplicate gameplay state or costs', () => {
    const context = meetingFixture();
    const before = JSON.stringify({ state: context.state, staff: context.staff });
    for (let i = 0; i < 5; i += 1) {
      deriveStaffMeetingAgenda(context, context.state.activeStorylines[0].id);
      deriveStaffMeetingPreview(context, context.state.activeStorylines[0].id, 'mediate');
    }
    expect(JSON.stringify({ state: context.state, staff: context.staff })).toBe(before);
    const restored = normalizeStaffNarrativeState(JSON.parse(JSON.stringify(context.state)), context.staff, 3);
    expect(deriveStaffMeetingPreview({ ...context, state: restored }, restored.activeStorylines[0].id, 'mediate')?.politicalPowerAfter).toBe(27);
  });
});
