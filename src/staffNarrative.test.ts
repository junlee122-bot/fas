import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStaffRoster } from './campaign';
import { StaffNarrativeBoard } from './StaffNarrativeBoard';
import {
  advanceStaffNarrativeWeek,
  createStaffNarrativeState,
  getStaffNarrativeOptions,
  normalizeStaffNarrativeState,
  resolveStaffNarrativeDecision,
} from './staffNarrative';
import type { StaffNarrativeEvidence } from './staffNarrative';

describe('persistent FM-style staff narratives', () => {
  it('keeps pair relationships across save normalization', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const state = createStaffNarrativeState(staff, 0);
    const changed = { ...state, bonds: state.bonds.map((bond, index) => index === 0 ? { ...bond, affinity: 21, grievances: 4 } : bond) };
    const restored = normalizeStaffNarrativeState(changed, staff, 8);

    expect(restored.bonds[0].affinity).toBeLessThanOrEqual(22);
    expect(restored.bonds[0].grievances).toBeGreaterThanOrEqual(3);
  });

  it('starts a fresh relationship when a seat is filled by a different historical person', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const state = createStaffNarrativeState(staff, 0);
    const carried = { ...state, bonds: state.bonds.map((bond) => ({ ...bond, affinity: 12, grievances: 9 })) };
    const changedStaff = staff.map((member, index) => index === 0 ? { ...member, personId: 'replacement-person', name: '신임 인사' } : member);
    const restored = normalizeStaffNarrativeState(carried, changedStaff, 5);
    const changedBond = restored.bonds.find((bond) => bond.firstStaffId === changedStaff[0].id || bond.secondStaffId === changedStaff[0].id)!;

    expect(changedBond.affinity).toBeGreaterThan(12);
    expect(changedBond.grievances).toBe(0);
    expect([changedBond.firstPersonId, changedBond.secondPersonId]).toContain('replacement-person');
  });

  it('creates a named storyline on its scheduled week', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const state = createStaffNarrativeState(staff, 0);
    const result = advanceStaffNarrativeWeek(state, staff, 3);

    expect(result.state.activeStorylines).toHaveLength(1);
    const story = result.state.activeStorylines[0];
    expect(staff.some((member) => story.title.includes(member.name))).toBe(true);
    expect(result.events[0].title).toContain('참모진 현안');
  });

  it('keeps generated conflicts actionable inside a lower-ranked role\'s personnel authority', () => {
    const staff = createStaffRoster('britain', 'britain-tier5-military');
    const manageable = new Set([staff.find((member) => member.department === 'operations')!.id]);
    const result = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, manageable);
    const story = result.state.activeStorylines[0];

    expect([story.firstStaffId, story.secondStaffId]).toContain([...manageable][0]);
  });

  it('escalates an ignored private conflict into the cabinet and penalizes the people involved', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3);
    const story = opened.state.activeStorylines[0];
    const firstBefore = opened.staff.find((member) => member.id === story.firstStaffId)!;
    const escalated = advanceStaffNarrativeWeek(opened.state, opened.staff, story.deadlineWeek + 1);
    const firstAfter = escalated.staff.find((member) => member.id === story.firstStaffId)!;

    expect(escalated.state.activeStorylines[0].stage).toBe('cabinet');
    expect(firstAfter.morale).toBeLessThan(firstBefore.morale ?? 100);
    expect(escalated.events[0].title).toContain('각료회의');
    expect(escalated.events[0].detail).toContain('별도 언론 보도나 실제 유출 기록이 확인된 것은 아닙니다');
    const publicRisk = advanceStaffNarrativeWeek(escalated.state, escalated.staff, 9);
    expect(publicRisk.events.some((event) => event.title.startsWith('언론 노출 위험'))).toBe(true);
  });

  it('resolves a two-person dispute with forecasted effects and a later verification week', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3);
    const story = opened.state.activeStorylines[0];
    const option = getStaffNarrativeOptions(story)[0];
    const beforeBond = opened.state.bonds.find((bond) => bond.id === [story.firstStaffId, story.secondStaffId].filter(Boolean).sort().join(':'));
    const result = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, option.id, 3);

    expect(result).not.toBeNull();
    expect(result?.state.activeStorylines).toHaveLength(0);
    expect(result?.state.history[0].verificationWeek).toBe(3 + option.verifyAfterWeeks);
    if (story.secondStaffId && beforeBond) {
      expect(result?.state.bonds.find((bond) => bond.id === beforeBond.id)?.affinity).toBe(beforeBond.affinity + option.bondDelta);
    }
    expect(result?.event.nextActions).toHaveLength(2);
  });

  it('publishes a measured follow-up when a promised verification week arrives', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3);
    const story = opened.state.activeStorylines[0];
    const option = getStaffNarrativeOptions(story)[0];
    const decided = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, option.id, 3)!;
    const checked = advanceStaffNarrativeWeek(decided.state, decided.staff, 3 + option.verifyAfterWeeks);

    expect(checked.state.history[0].verifiedWeek).toBe(3 + option.verifyAfterWeeks);
    expect(checked.events.some((event) => event.title.startsWith('후속 검증'))).toBe(true);
  });

  it('sets a six-week handover instead of instantly deleting a resigning historical person', () => {
    const staff = createStaffRoster('britain', 'britain-tier1').map((member, index) => index === 0
      ? { ...member, workload: 96, morale: 25, roleSatisfaction: 30 }
      : member);
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3);
    const story = opened.state.activeStorylines[0];
    expect(story.kind).toBe('resignation-threat');
    const result = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, 'handover', 3);
    const resigning = result?.staff.find((member) => member.id === story.firstStaffId);

    expect(resigning?.contractWeeksRemaining).toBe(6);
    expect(resigning?.delegated).toBe(false);
  });

  it('prioritizes a real battle record and stores its identity, week and exact explanation', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const evidence: StaffNarrativeEvidence = { id: 'battle-report-2', week: 2, kind: 'battle-victory', description: '제2주 전투 보고: 방어전 승리', staffIds: [staff[0].id, staff[1].id] };
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [evidence] });
    const story = opened.state.activeStorylines[0];
    expect(story.kind).toBe('credit-dispute');
    expect(story.firstStaffId).toBe(staff[0].id);
    expect(story.secondStaffId).toBe(staff[1].id);
    expect(story.cause).toEqual({ source: 'verified-event', evidenceId: evidence.id, week: 2, description: evidence.description, eventKind: 'battle-victory' });
    expect(opened.events[0].factors.some((factor) => factor.includes(evidence.id))).toBe(true);
    const option = getStaffNarrativeOptions(story)[0];
    const resolved = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, option.id, 3)!;
    expect(resolved.state.history[0].cause).toEqual(story.cause);
  });

  it('uses only a directly linked person when a record has no verified second participant', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    for (const kind of ['battle-defeat', 'mission-failure', 'personnel-change'] as const) {
      const evidence: StaffNarrativeEvidence = { id: `source-${kind}`, week: 2, kind, description: '확인된 원본 기록', staffIds: [staff[0].id] };
      const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [evidence] });
      const story = opened.state.activeStorylines[0];
      expect(story.cause.evidenceId).toBe(evidence.id);
      expect(story.firstStaffId).toBe(staff[0].id);
      expect(story.secondStaffId).toBeUndefined();
      expect(story.title).not.toContain(staff[1].name);
      expect(story.summary).toContain('기록되지 않은 비난·사임·유출 발언을 뜻하지 않습니다');
      expect(getStaffNarrativeOptions(story).every((option) => !option.forecast.includes('상대 사기') && !option.forecast.includes('관계 +') && option.bondDelta === 0)).toBe(true);
    }
  });

  it('rechecks a claimed broken promise against the current appointment terms', () => {
    const staff = createStaffRoster('britain', 'britain-tier1').map((member) => ({ ...member, appointmentAuthority: undefined, appointmentPromise: undefined, promisedDepartment: undefined }));
    const evidence: StaffNarrativeEvidence = { id: 'promise-record-2', week: 2, kind: 'broken-promise', description: '독립 권한 약속을 회수함', staffIds: [staff[0].id] };
    const unverified = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [evidence] });
    expect(unverified.state.activeStorylines[0].cause.source).toBe('internal-state');
    const violated = staff.map((member, index) => index === 0 ? { ...member, appointmentAuthority: 'autonomous' as const, delegated: false } : member);
    const confirmed = advanceStaffNarrativeWeek(createStaffNarrativeState(violated, 0), violated, 3, undefined, { evidence: [evidence] });
    expect(confirmed.state.activeStorylines[0].kind).toBe('confidence-crisis');
    expect(confirmed.state.activeStorylines[0].cause.evidenceId).toBe(evidence.id);
  });

  it('does not substitute unrelated staff when linked people are missing or outside authority', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const evidence: StaffNarrativeEvidence = { id: 'outside-record', week: 2, kind: 'battle-defeat', description: '관리 권한 밖 전투 결과', staffIds: [staff[1].id, 'missing-person'] };
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, new Set([staff[0].id]), { evidence: [evidence] });
    expect(opened.state.activeStorylines[0].cause.source).toBe('internal-state');
    expect(opened.state.consumedEvidenceIds).not.toContain(evidence.id);
  });

  it('rejects future, stale and empty evidence rather than presenting it as observed gameplay', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const base: StaffNarrativeEvidence = { id: 'source', week: 19, kind: 'battle-victory', description: '기록된 전투 결과', staffIds: [staff[0].id] };
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 20, undefined, { evidence: [
      { ...base, id: 'future', week: 21 },
      { ...base, id: 'stale', week: 11 },
      { ...base, id: 'empty', description: ' ' },
      { ...base, id: '', week: 19 },
    ] });
    expect(opened.state.activeStorylines[0].cause.source).toBe('internal-state');
    expect(opened.state.consumedEvidenceIds).toEqual([]);
  });

  it('consumes an event only once across resolution, repeated updates and save reloads', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const evidence: StaffNarrativeEvidence = { id: 'battle-once', week: 2, kind: 'battle-victory', description: '한 번 발생한 방어전 승리', staffIds: [staff[0].id] };
    const context = { evidence: [evidence, evidence] };
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, context);
    const repeated = advanceStaffNarrativeWeek(opened.state, opened.staff, 3, undefined, context);
    expect(repeated.state.activeStorylines).toHaveLength(1);
    expect(repeated.events).toHaveLength(0);
    const story = opened.state.activeStorylines[0];
    const resolved = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, getStaffNarrativeOptions(story)[0].id, 3)!;
    const restored = normalizeStaffNarrativeState(JSON.parse(JSON.stringify(resolved.state)), resolved.staff, 3);
    expect(advanceStaffNarrativeWeek(restored, resolved.staff, 4, undefined, context).state.activeStorylines).toHaveLength(0);
    const later = advanceStaffNarrativeWeek(restored, resolved.staff, restored.nextStoryWeek, undefined, context);
    expect(later.state.activeStorylines[0]?.cause.evidenceId).not.toBe(evidence.id);
    expect(later.state.consumedEvidenceIds.filter((id) => id === evidence.id)).toHaveLength(1);
  });

  it('keeps different recent records available for later story windows', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const evidence: StaffNarrativeEvidence[] = [
      { id: 'older-record', week: 2, kind: 'personnel-change', description: '확인된 신규 임명', staffIds: [staff[0].id] },
      { id: 'newer-record', week: 3, kind: 'battle-defeat', description: '확인된 전투 패배', staffIds: [staff[1].id] },
    ];
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence });
    const story = opened.state.activeStorylines[0];
    expect(story.cause.evidenceId).toBe('newer-record');
    const resolved = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, getStaffNarrativeOptions(story)[0].id, 3)!;
    const next = advanceStaffNarrativeWeek(resolved.state, resolved.staff, resolved.state.nextStoryWeek, undefined, { evidence });
    expect(next.state.activeStorylines[0].cause.evidenceId).toBe('older-record');
  });

  it('retains provenance through ignored-conflict closure and does not assign it to a replacement person', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const evidence: StaffNarrativeEvidence = { id: 'battle-provenance', week: 2, kind: 'battle-defeat', description: '당시 지휘관의 전투 패배 보고', staffIds: [staff[0].id] };
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [evidence] });
    const story = opened.state.activeStorylines[0];
    const cabinet = advanceStaffNarrativeWeek(opened.state, opened.staff, 6);
    const publicStage = advanceStaffNarrativeWeek(cabinet.state, cabinet.staff, 9);
    const closed = advanceStaffNarrativeWeek(publicStage.state, publicStage.staff, 11);
    expect(closed.state.history.find((record) => record.storylineId === story.id)?.cause).toEqual(story.cause);
    const replacement = staff.map((member, index) => index === 0 ? { ...member, personId: 'successor-person', name: '후임자' } : member);
    const restored = normalizeStaffNarrativeState(opened.state, replacement, 3);
    expect(restored.activeStorylines).toHaveLength(0);
    expect(restored.consumedEvidenceIds).toContain(evidence.id);
  });

  it('migrates legacy narratives and labels context-free stories as internal state checks', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3);
    expect(opened.state.activeStorylines[0].cause.source).toBe('internal-state');
    expect(['leak-suspicion', 'credit-dispute']).not.toContain(opened.state.activeStorylines[0].kind);
    const legacy = JSON.parse(JSON.stringify(opened.state));
    delete legacy.consumedEvidenceIds;
    delete legacy.activeStorylines[0].cause;
    const restored = normalizeStaffNarrativeState(legacy, staff, 3);
    expect(restored.activeStorylines[0].cause.source).toBe('internal-state');
    expect(restored.consumedEvidenceIds).toEqual([]);
    const render = (state: typeof restored) => renderToStaticMarkup(createElement(StaffNarrativeBoard, { state, staff, week: 3, politicalPower: 50, manageableStaffIds: new Set(staff.map((member) => member.id)), onResolve: () => {}, onMeet: () => {} }));
    expect(render(restored)).toContain('발생 근거 · 자동 내부사정');
    const verified = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [{ id: 'ui-evidence', week: 2, kind: 'battle-victory', description: '원본 전투 보고 설명', staffIds: [staff[0].id] }] });
    const html = render(verified.state);
    expect(html).toContain('발생 근거 · 플레이 기록 연결');
    expect(html).toContain('근거 ID: ui-evidence');
    expect(html).toContain('원본 전투 보고 설명');
  });

  it('stores historical participant identities and measurements in the single original follow-up record', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3);
    const story = opened.state.activeStorylines[0];
    const decided = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, getStaffNarrativeOptions(story)[0].id, 3)!;
    const record = decided.state.history[0];
    expect(record.participants?.map((person) => person.personId)).toEqual(record.staffIds.map((id) => staff.find((person) => person.id === id)!.personId));
    const due = record.verificationWeek;
    const waiting = advanceStaffNarrativeWeek({ ...decided.state, nextStoryWeek: 10000 }, decided.staff, due - 1);
    expect(waiting.state.history[0].verifiedWeek).toBeUndefined();
    const checked = advanceStaffNarrativeWeek(waiting.state, waiting.staff, due);
    expect(checked.state.history[0].verificationStatus).toBe('verified');
    expect(checked.state.history[0].verificationMeasurements).toHaveLength(record.staffIds.length);
    expect(checked.staff).toEqual(decided.staff);
    const repeated = advanceStaffNarrativeWeek(JSON.parse(JSON.stringify(checked.state)), checked.staff, due);
    expect(repeated.events.filter((event) => event.title.startsWith('후속 검증'))).toHaveLength(0);
    expect(repeated.staff).toEqual(checked.staff);
    const departed = normalizeStaffNarrativeState(checked.state, [], due + 1);
    expect(departed.history[0].verificationStatus).toBe('verified');
    expect(departed.history[0].verificationMeasurements).toEqual(checked.state.history[0].verificationMeasurements);
  });

  it('voids pending verification when either participant leaves and never measures or penalizes a successor', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [{ id: 'pair', kind: 'battle-victory', week: 2, description: '두 지휘관의 확인된 성과', staffIds: [staff[0].id, staff[1].id] }] });
    const story = opened.state.activeStorylines[0];
    const decided = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, 'mediate', 3)!;
    for (const replacedId of [story.firstStaffId, story.secondStaffId!]) {
      const successor = decided.staff.map((member) => member.id === replacedId ? { ...member, personId: 'successor', name: '후임자', morale: 100, loyalty: 100 } : member);
      const checked = advanceStaffNarrativeWeek({ ...decided.state, nextStoryWeek: 10000 }, successor, decided.state.history[0].verificationWeek);
      expect(checked.state.history[0].verificationStatus).toBe('void');
      expect(checked.state.history[0].verifiedWeek).toBeUndefined();
      expect(checked.state.history[0].verificationMeasurements).toBeUndefined();
      expect(checked.state.history[0].verificationReason).toContain('퇴임·교체');
      expect(checked.staff).toEqual(successor);
      expect(checked.events.filter((event) => event.title.startsWith('후속 검증'))).toHaveLength(0);
      expect(checked.state.history[0].participants?.some((person) => person.name === '후임자')).toBe(false);
    }
    const allDeparted = normalizeStaffNarrativeState(decided.state, [], 4);
    expect(allDeparted.history).toHaveLength(1);
    expect(allDeparted.history[0].verificationStatus).toBe('void');
    expect(allDeparted.history[0].outcome).toBe(decided.state.history[0].outcome);
  });

  it('preserves legacy history but never infers its people or retroactively verifies it', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3);
    const story = opened.state.activeStorylines[0];
    const decided = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, getStaffNarrativeOptions(story)[0].id, 3)!;
    const legacy = JSON.parse(JSON.stringify(decided.state));
    delete legacy.history[0].participants;
    legacy.history[0].verifiedWeek = 5;
    const restored = normalizeStaffNarrativeState(legacy, staff, 9);
    expect(restored.history).toHaveLength(1);
    expect(restored.history[0].participants).toBeUndefined();
    expect(restored.history[0].verificationStatus).toBe('void');
    expect(restored.history[0].verifiedWeek).toBeUndefined();
    expect(restored.history[0].verificationReason).toContain('구 기록');
    const repeated = advanceStaffNarrativeWeek({ ...restored, nextStoryWeek: 10000 }, staff, 10);
    expect(repeated.state.history[0].verificationStatus).toBe('void');
    expect(repeated.events).toHaveLength(0);
  });

  it('archives unavailable active people/evidence without choices, costs, or resurrected decisions', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [{ id: 'valid-source', kind: 'battle-victory', week: 2, description: '확인된 결과', staffIds: [staff[0].id] }] });
    const story = opened.state.activeStorylines[0];
    for (const changed of [{ ...story, firstPersonId: undefined }, { ...story, cause: { ...story.cause, evidenceId: '' } }, { ...story, cause: { ...story.cause, week: 4 } }]) {
      const state = { ...opened.state, activeStorylines: [changed] };
      expect(resolveStaffNarrativeDecision(state, opened.staff, story.id, 'mediate', 3)).toBeNull();
      const normalized = normalizeStaffNarrativeState(state, opened.staff, 3);
      expect(normalized.activeStorylines).toHaveLength(0);
      expect(normalized.history[0].verificationStatus).toBe('void');
      expect(normalized.history[0].decision).toContain('집행 없음');
      const again = normalizeStaffNarrativeState(normalized, opened.staff, 3);
      expect(again.history).toHaveLength(1);
    }
    const resolved = resolveStaffNarrativeDecision(opened.state, opened.staff, story.id, 'mediate', 3)!;
    const stale = { ...resolved.state, activeStorylines: [story] };
    expect(resolveStaffNarrativeDecision(stale, resolved.staff, story.id, 'mediate', 3)).toBeNull();
  });

  it('preserves a partial saved roster by closing the missing participant agenda without restoring a historical person', () => {
    const staff = createStaffRoster('britain', 'britain-tier1');
    const opened = advanceStaffNarrativeWeek(createStaffNarrativeState(staff, 0), staff, 3, undefined, { evidence: [{ id: 'partial-roster-evidence', kind: 'battle-victory', week: 2, description: '당시 두 인사의 실제 성과 기록', staffIds: [staff[0].id, staff[1].id] }] });
    const story = opened.state.activeStorylines[0];
    for (const departedId of [story.firstStaffId, story.secondStaffId!]) {
      const savedRoster = opened.staff.filter((person) => person.id !== departedId);
      const savedSnapshot = JSON.stringify(savedRoster);
      const normalized = normalizeStaffNarrativeState(JSON.parse(JSON.stringify(opened.state)), savedRoster, 3);
      expect(normalized.activeStorylines).toHaveLength(0);
      expect(normalized.history).toHaveLength(1);
      expect(normalized.history[0]).toMatchObject({ storylineId: story.id, decision: '검토 종료 · 집행 없음', verificationStatus: 'void', cause: story.cause });
      expect(normalized.history[0].staffIds).toContain(departedId);
      expect(normalized.consumedEvidenceIds).toContain('partial-roster-evidence');
      expect(JSON.stringify(savedRoster)).toBe(savedSnapshot);
      const again = normalizeStaffNarrativeState(JSON.parse(JSON.stringify(normalized)), savedRoster, 3);
      expect(again.history).toHaveLength(1);
      expect(again.activeStorylines).toHaveLength(0);
      expect(resolveStaffNarrativeDecision(again, savedRoster, story.id, 'mediate', 3)).toBeNull();
    }
  });
});
