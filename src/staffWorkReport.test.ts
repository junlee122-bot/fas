import { describe, expect, it } from 'vitest';
import { createStaffRoster } from './campaign';
import { advanceStaffRosterWeek, getStaffContractWeeks, getStaffMorale, getStaffRoleSatisfaction } from './staffManagement';
import { attachStaffWorkReports, getStaffWorkReport, normalizeStaffWorkReport } from './staffWorkReport';
import type { StaffWorkReport, StaffWorkSnapshot } from './staffWorkReport';
import type { StaffMember } from './types';

function member(overrides: Partial<StaffMember> = {}): StaffMember {
  return { ...createStaffRoster('britain', 'britain-tier1')[0], workload: 50, development: 30,
    morale: 70, roleSatisfaction: 70, loyalty: 70, delegated: false, contractWeeksRemaining: 100,
    joinedWeek: 0, ...overrides };
}

const context = { nationId: 'britain' as const, fromWeek: 4, week: 5 };
const keys: Array<keyof StaffWorkSnapshot> = ['workload', 'development', 'morale', 'loyalty', 'roleSatisfaction', 'contractWeeks'];

function measured(staff: StaffMember): StaffWorkSnapshot {
  return { workload: staff.workload, development: staff.development, morale: getStaffMorale(staff),
    loyalty: staff.loyalty, roleSatisfaction: getStaffRoleSatisfaction(staff), contractWeeks: getStaffContractWeeks(staff) };
}

function settled(overrides: Partial<StaffMember> = {}) {
  const before = [member(overrides)];
  const afterWork = advanceStaffRosterWeek(before, before[0].id);
  const after = afterWork.map((staff) => ({ ...staff, workload: staff.workload + 5, morale: getStaffMorale(staff) - 8,
    loyalty: staff.loyalty - 6, roleSatisfaction: getStaffRoleSatisfaction(staff) - 8, delegated: false }));
  const result = attachStaffWorkReports(before, afterWork, after, { ...context, developmentFocusId: before[0].id });
  return { before, afterWork, after, result, report: result[0].lastWorkReport! };
}

describe('confirmed staff weekly work reports', () => {
  it('captures the actual work and narrative snapshots, not forecasted or repeated bonuses', () => {
    const { before, afterWork, after, result, report } = settled({ workPriority: 'urgent', delegated: true });
    expect(report).toMatchObject({ version: 1, nationId: 'britain', staffId: before[0].id, personId: before[0].personId,
      joinedWeek: 0, personName: before[0].name, departmentBefore: before[0].department, fromWeek: 4, week: 5,
      basis: { priority: 'urgent', delegated: true, focused: true, weeklyCost: before[0].weeklyCost }, delegatedAfter: false });
    expect(report.before).toEqual(measured(before[0]));
    expect(report.afterWork).toEqual(measured(afterWork[0]));
    expect(report.after).toEqual(measured(after[0]));
    for (const key of keys) {
      const workDelta = report.afterWork[key] - report.before[key];
      const narrativeDelta = report.after[key] - report.afterWork[key];
      expect(workDelta + narrativeDelta).toBeCloseTo(report.after[key] - report.before[key]);
    }
    expect(report.after.workload - report.afterWork.workload).toBe(5);
    expect(report.after.morale - report.afterWork.morale).toBe(-8);
    const { lastWorkReport: receipt, ...unchanged } = result[0];
    expect(unchanged).toEqual(after[0]);
    expect(receipt).toBe(report);
  });

  it('does not mutate inputs and owns independent snapshot values', () => {
    const before = Object.freeze([Object.freeze(member())]);
    const afterWork = Object.freeze(advanceStaffRosterWeek(before).map((staff) => Object.freeze(staff)));
    const after = Object.freeze(afterWork.map((staff) => Object.freeze({ ...staff })));
    const result = attachStaffWorkReports(before, afterWork, after, context);
    expect(before[0].lastWorkReport).toBeUndefined();
    expect(after[0].lastWorkReport).toBeUndefined();
    expect(result[0]).not.toBe(after[0]);
    result[0].workload = 2;
    expect(result[0].lastWorkReport?.after.workload).toBe(after[0].workload);
    expect(result[0].lastWorkReport?.before).not.toBe(before[0]);
  });

  it('keeps only one latest report and captures the next real settlement', () => {
    const { result } = settled();
    const next = advanceStaffRosterWeek(result);
    const attached = attachStaffWorkReports(result, next, next, { ...context, fromWeek: 5, week: 6 });
    expect(attached[0].lastWorkReport?.week).toBe(6);
    expect(attached[0].lastWorkReport?.before).toEqual(measured(result[0]));
    expect(attached[0].lastWorkReport).not.toHaveProperty('lastWorkReport');
    expect(attached[0].lastWorkReport?.before).not.toHaveProperty('lastWorkReport');
    expect(result[0].lastWorkReport?.week).toBe(5);
  });

  it('reports the actual capped change instead of a nominal priority bonus', () => {
    const before = [member({ workload: 100, development: 100, workPriority: 'urgent' })];
    const next = advanceStaffRosterWeek(before, before[0].id);
    const [attached] = attachStaffWorkReports(before, next, next, context);
    expect(attached.lastWorkReport?.afterWork.development).toBe(100);
    expect(attached.lastWorkReport!.afterWork.development - attached.lastWorkReport!.before.development).toBe(0);
    expect(attached.development).toBe(next[0].development);
  });

  it('uses the same legacy defaults as the engine without fabricating prior reports', () => {
    const legacy = member({ joinedWeek: undefined, workPriority: undefined, morale: undefined,
      roleSatisfaction: undefined, contractWeeksRemaining: undefined });
    expect(getStaffWorkReport(legacy, 'britain', 4)).toEqual({ status: 'missing' });
    const next = advanceStaffRosterWeek([legacy]);
    const [attached] = attachStaffWorkReports([legacy], next, next, context);
    expect(attached.lastWorkReport?.before).toEqual(measured(legacy));
    expect(attached.lastWorkReport?.basis.priority).toBe('normal');
    expect(attached.lastWorkReport).not.toHaveProperty('joinedWeek');
    expect(getStaffWorkReport(attached, 'britain', 5).status).toBe('available');
  });

  it('preserves fractional actual loyalty and workload rather than rounding the receipt', () => {
    const before = [member({ delegated: true, loyalty: 70.25, workload: 50.25 })];
    const next = advanceStaffRosterWeek(before);
    const [attached] = attachStaffWorkReports(before, next, next, context);
    expect(attached.lastWorkReport?.before.loyalty).toBe(70.25);
    expect(attached.lastWorkReport?.after.loyalty).toBe(next[0].loyalty);
    expect(attached.lastWorkReport?.after.workload).toBe(next[0].workload);
  });

  it('round-trips JSON with strict normalization and no additional engine changes', () => {
    const { result } = settled();
    const loaded = JSON.parse(JSON.stringify(result[0])) as StaffMember;
    const normalized = normalizeStaffWorkReport(loaded.lastWorkReport, loaded, 'britain', 5);
    expect(normalized).toEqual(result[0].lastWorkReport);
    expect(normalized).not.toBe(loaded.lastWorkReport);
    expect(normalized?.after).not.toBe(loaded.lastWorkReport?.after);
    expect(getStaffWorkReport(loaded, 'britain', 5)).toMatchObject({ status: 'available', ageWeeks: 0, instructionChanged: false });
    expect(loaded).toEqual(result[0]);
  });

  it('accepts unchanged snapshots as a confirmed zero-change settlement', () => {
    const unchanged = [member()];
    const [attached] = attachStaffWorkReports(unchanged, unchanged, unchanged, context);
    expect(attached.lastWorkReport?.before).toEqual(attached.lastWorkReport?.after);
    expect(attached.lastWorkReport?.before).not.toBe(attached.lastWorkReport?.after);
  });

  it('keeps historical snapshots when later same-week meetings change current stats', () => {
    const { result, report } = settled();
    const current = { ...result[0], morale: 99, workload: 3, weeklyCost: 200 };
    const view = getStaffWorkReport(current, 'britain', 8);
    expect(view).toMatchObject({ status: 'available', ageWeeks: 3, instructionChanged: false, report });
    expect(view.status === 'available' && view.report.after.morale).not.toBe(current.morale);
    expect(view.status === 'available' && view.report.basis.weeklyCost).toBe(report.basis.weeklyCost);
  });

  it('compares instructions to ending delegation and separately flags reassignment, priority and focus', () => {
    const before = [member({ delegated: true, contractWeeksRemaining: 1 })];
    const next = advanceStaffRosterWeek(before, before[0].id);
    const [attached] = attachStaffWorkReports(before, next, next, { ...context, developmentFocusId: before[0].id });
    expect(attached.delegated).toBe(false);
    expect(getStaffWorkReport(attached, 'britain', 5, attached.id)).toMatchObject({ status: 'available', instructionChanged: false });
    for (const change of [{ delegated: true }, { workPriority: 'recovery' as const }, { department: 'science' as const }]) {
      expect(getStaffWorkReport({ ...attached, ...change }, 'britain', 5, attached.id)).toMatchObject({ status: 'available', instructionChanged: true });
    }
    expect(getStaffWorkReport(attached, 'britain', 5, null)).toMatchObject({ status: 'available', instructionChanged: true });
    expect(getStaffWorkReport(attached, 'britain', 5)).toMatchObject({ status: 'available', instructionChanged: false });
  });
});

describe('staff work report identity and save boundary', () => {
  const corruptions: Array<[string, (report: StaffWorkReport) => unknown]> = [
    ['version', (report) => ({ ...report, version: 2 })],
    ['foreign nation', (report) => ({ ...report, nationId: 'japan' })],
    ['wrong seat', (report) => ({ ...report, staffId: 'another-seat' })],
    ['wrong person', (report) => ({ ...report, personId: 'another-person' })],
    ['rehire tenure', (report) => ({ ...report, joinedWeek: 1 })],
    ['missing tenure', (report) => ({ ...report, joinedWeek: undefined })],
    ['future', (report) => ({ ...report, fromWeek: 5, week: 6 })],
    ['nonconsecutive', (report) => ({ ...report, fromWeek: 2 })],
    ['fractional week', (report) => ({ ...report, fromWeek: 3.5, week: 4.5 })],
    ['negative week', (report) => ({ ...report, fromWeek: -1, week: 0 })],
    ['missing name', (report) => ({ ...report, personName: '' })],
    ['unknown department', (report) => ({ ...report, departmentBefore: 'unknown' })],
    ['missing basis', (report) => ({ ...report, basis: undefined })],
    ['invalid priority', (report) => ({ ...report, basis: { ...report.basis, priority: 'never' } })],
    ['negative cost', (report) => ({ ...report, basis: { ...report.basis, weeklyCost: -1 } })],
    ['infinite cost', (report) => ({ ...report, basis: { ...report.basis, weeklyCost: Infinity } })],
    ['invalid focus', (report) => ({ ...report, basis: { ...report.basis, focused: 1 } })],
    ['invalid delegation', (report) => ({ ...report, delegatedAfter: 'false' })],
    ['missing snapshot', (report) => ({ ...report, afterWork: undefined })],
    ['missing stat', (report) => ({ ...report, before: { ...report.before, loyalty: undefined } })],
    ['nonfinite stat', (report) => ({ ...report, after: { ...report.after, morale: NaN } })],
    ['over cap stat', (report) => ({ ...report, after: { ...report.after, workload: 101 } })],
    ['under cap stat', (report) => ({ ...report, after: { ...report.after, development: -1 } })],
    ['negative contract', (report) => ({ ...report, after: { ...report.after, contractWeeks: -1 } })],
  ];

  it.each(corruptions)('rejects a saved report with %s', (_label, corrupt) => {
    const { result, report } = settled();
    const value = corrupt(report);
    expect(normalizeStaffWorkReport(value, result[0], 'britain', 5)).toBeUndefined();
    expect(getStaffWorkReport({ ...result[0], lastWorkReport: value as StaffWorkReport }, 'britain', 5)).toEqual({ status: 'invalid' });
  });

  it.each([null, false, 1, [], 'legacy text'])('rejects non-object receipt %s without throwing', (value) => {
    expect(normalizeStaffWorkReport(value, member(), 'britain', 5)).toBeUndefined();
  });

  it('does not inherit a replaced person or rehired tenure, including undefined legacy tenure', () => {
    const { result } = settled();
    for (const replacement of [{ personId: 'replacement' }, { id: 'new-seat' }, { joinedWeek: 5 }]) {
      expect(getStaffWorkReport({ ...result[0], ...replacement }, 'britain', 6)).toEqual({ status: 'invalid' });
    }
    const legacy = member({ joinedWeek: undefined });
    const [attached] = attachStaffWorkReports([legacy], [legacy], [legacy], context);
    expect(getStaffWorkReport({ ...attached, joinedWeek: 5 }, 'britain', 6)).toEqual({ status: 'invalid' });
    expect(getStaffWorkReport(attached, 'japan', 6)).toEqual({ status: 'invalid' });
  });

  it('rejects future tenures and invalid current week', () => {
    const future = member({ joinedWeek: 5 });
    expect(attachStaffWorkReports([future], [future], [future], context)[0].lastWorkReport).toBeUndefined();
    const { result, report } = settled();
    for (const week of [4, -1, NaN, Infinity, 5.5]) expect(normalizeStaffWorkReport(report, result[0], 'britain', week)).toBeUndefined();
  });

  it('rejects duplicate seat or person identity in any settlement stage', () => {
    const { result } = settled();
    const base = result[0];
    for (const duplicate of [{ ...base }, { ...base, id: 'different-seat' }]) {
      for (const stage of [0, 1, 2]) {
        const arrays = [[base], [base], [base]];
        arrays[stage] = [base, duplicate];
        const attached = attachStaffWorkReports(arrays[0], arrays[1], arrays[2], { ...context, fromWeek: 5, week: 6 });
        expect(attached.every((staff) => staff.lastWorkReport === undefined)).toBe(true);
      }
    }
  });

  it('does not attribute a settlement to identities replaced between stages', () => {
    const { result } = settled();
    const base = result[0];
    for (const stage of [0, 1, 2]) {
      const arrays = [[base], [base], [base]];
      arrays[stage] = [{ ...base, personId: 'replacement' }];
      expect(attachStaffWorkReports(arrays[0], arrays[1], arrays[2], { ...context, fromWeek: 5, week: 6 })[0].lastWorkReport).toBeUndefined();
    }
  });

  it('does not record incomplete or nonfinite measurements as zero', () => {
    const { result } = settled();
    for (const invalid of [{ workload: NaN }, { development: undefined }, { morale: Infinity }, { roleSatisfaction: NaN },
      { contractWeeksRemaining: Infinity }, { weeklyCost: -1 }, { loyalty: 101 }]) {
      const broken = { ...result[0], ...invalid } as StaffMember;
      expect(attachStaffWorkReports([broken], [broken], [broken], { ...context, fromWeek: 5, week: 6 })[0].lastWorkReport).toBeUndefined();
    }
  });

  it.each([
    { morale: -1 }, { morale: 150 }, { roleSatisfaction: -5 }, { roleSatisfaction: 101 },
    { contractWeeksRemaining: -9 }, { contractWeeksRemaining: 1.5 },
  ])('rejects explicit out-of-range optional measurements before getter clamping: %j', (invalid) => {
    const { result } = settled();
    for (const stage of [0, 1, 2]) {
      const arrays = [[result[0]], [result[0]], [result[0]]];
      arrays[stage] = [{ ...result[0], ...invalid }];
      const [attached] = attachStaffWorkReports(arrays[0], arrays[1], arrays[2], { ...context, fromWeek: 5, week: 6 });
      expect(attached.lastWorkReport).toBeUndefined();
    }
  });

  it('refuses skipped weeks rather than labeling multiweek changes as one week', () => {
    const { result } = settled();
    expect(attachStaffWorkReports(result, result, result, { ...context, fromWeek: 5, week: 8 })[0].lastWorkReport).toBeUndefined();
    expect(attachStaffWorkReports([], [], result, context)[0].lastWorkReport).toBeUndefined();
  });
});
