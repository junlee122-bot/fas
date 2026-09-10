import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { careerRoles, nations } from './campaign';
import { createEconomyState } from './economy';
import { createNationManagementState } from './nationManagement';
import { deriveInstitutionAgenda, InstitutionAgendaDesk } from './InstitutionAgendaDesk';
import { getVacantJudicialOffices } from './constitutionalJudiciary';
import { openJusticeCase, getAvailableJusticeCaseTemplates, type JusticeContext } from './justiceSystem';
import type { GameState } from './types';

const game: GameState = { week: 12, politicalPower: 150, treasury: 900, manpower: 800, factories: 20, fuel: 70, steel: 60, commandPoints: 40, stability: 75, warSupport: 80, victoryScore: 40, airPower: 60, navalPower: 60, intelNetwork: 70, enemyPressure: 40 };
function setup() {
  const role = careerRoles.find((r) => r.nationId === 'britain' && r.tier === 1 && r.branch === 'politics')!;
  const state = createNationManagementState('britain', game, createEconomyState('britain'), 2, 'victory');
  // Empty-ledger fixture: the campaign factory normally includes an introductory case.
  state.justice = { ...state.justice, cases: [], pendingDecision: null, activeCaseId: null, history: [] };
  return { state, role, week: game.week };
}
function withCase() {
  const input = setup();
  const context: JusticeContext = { ...game, year: 1943, phase: 'war', nationId: 'britain', role: input.role, legitimacy: 70, unrest: 20, institutionalCapacity: 60, mediaFreedom: 65, pressTrust: 65, activeElection: false, strategyId: 'reconstruction' };
  input.state.justice = openJusticeCase(input.state.justice, getAvailableJusticeCaseTemplates(1943)[0].id, context)!.state;
  return input;
}
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => { if (isValidElement<Record<string, unknown>>(child)) { result.push(child); result.push(...elements(child.props.children as ReactNode)); } });
  return result;
}

describe('institution itinerary and safe routing', () => {
  it('derives the existing vacant offices and no fabricated cases or deadlines', () => {
    const input = setup(); const before = structuredClone(input);
    const agenda = deriveInstitutionAgenda(input);
    expect(agenda.valid).toBe(true);
    expect(agenda.vacancies).toBe(getVacantJudicialOffices(input.state.constitutionalJudiciary, input.week).length);
    expect(agenda.openCases).toBe(0); expect(agenda.pendingVerifications).toBe(0);
    expect(agenda.items).toHaveLength(1); expect(agenda.items[0].dueWeek).toBeNull();
    expect(input).toEqual(before);
  });
  it('prioritizes a real pending case and explains its actual response deadline', () => {
    const input = withCase(); const agenda = deriveInstitutionAgenda(input);
    const item = agenda.items[0];
    expect(item.id).toBe(`justice:${input.state.justice.pendingDecision!.id}`);
    expect(item.detail).toContain(input.state.justice.cases[0].title);
    expect(item.detail).toContain('유죄 확정이 아닙니다');
    expect(item.dueWeek).toBe(input.state.justice.pendingDecision!.deadlineWeek);
    expect(item.timing).toContain('3주 남음'); expect(item.mode).toBe('decision');
  });
  it.each([0, 2])('does not invent a successful response when a deadline has passed by %d weeks', (late) => {
    const input = withCase(); input.week = input.state.justice.pendingDecision!.deadlineWeek + late;
    expect(deriveInstitutionAgenda(input).items[0].timing).toContain(late ? '기한 2주 경과' : '이번 주 응답 기한');
  });
  it('flags a missing case linkage instead of describing a different selected case', () => {
    const input = withCase(); input.state.justice.pendingDecision!.caseId = 'missing-case';
    const item = deriveInstitutionAgenda(input).items.find((row) => row.destination === 'justice')!;
    expect(item.mode).toBe('review'); expect(item.detail).toContain('대상 사건의 연결');
  });
  it('keeps nomination waiting and confirmation separate from taking office', () => {
    const input = setup(); const candidate = input.state.constitutionalJudiciary.candidates[0];
    input.state.constitutionalJudiciary.activeNomination = { id: 'nom-qa', candidateId: candidate.id, officeId: 'supreme-chief', stage: 'vetting', openedWeek: 12, nextReviewWeek: 14, hearingSupport: 70, vettingScore: 75, concern: '검증 중' };
    const waiting = deriveInstitutionAgenda(input).items.find((item) => item.id === 'nomination:nom-qa')!;
    expect(waiting.mode).toBe('waiting'); expect(waiting.entry).toBe('procedure'); expect(waiting.timing).toContain('2주 남음');
    input.state.constitutionalJudiciary.activeNomination.stage = 'confirmation';
    const deciding = deriveInstitutionAgenda(input).items[0];
    expect(deciding.mode).toBe('decision'); expect(deciding.detail).toContain('지명과 취임은 다릅니다');
  });
  it('uses the earliest unresolved power record, without mutating its outcome or sorting the source', () => {
    const input = setup();
    const record = { week: 10, powerId: 'address-and-counsel' as const, title: '국정 연설', detail: '실제 행사', status: 'express' as const, targetName: null, resolved: false, outcome: null };
    input.state.sovereignPowers.history = [{ ...record, id: 'later', verificationWeek: 25 }, { ...record, id: 'done', verificationWeek: 11, resolved: true, outcome: '검증 완료' }, { ...record, id: 'first', verificationWeek: 15 }];
    const before = structuredClone(input.state.sovereignPowers);
    const agenda = deriveInstitutionAgenda(input);
    expect(agenda.pendingVerifications).toBe(2);
    expect(agenda.items.find((item) => item.destination === 'sovereign')).toMatchObject({ id: 'power:first', dueWeek: 15, mode: 'waiting', entry: 'records' });
    expect(input.state.sovereignPowers).toEqual(before);
  });
  it.each(nations.map((nation) => [nation.id] as const))('does not turn lower %s office into a constitution-making authority', (nationId) => {
    const role = careerRoles.find((r) => r.nationId === nationId && r.tier === 3)!;
    const state = createNationManagementState(nationId, game, createEconomyState(nationId), 2, 'victory');
    const agenda = deriveInstitutionAgenda({ state, role, week: game.week });
    expect(agenda.valid).toBe(true); expect(agenda.items.find((item) => item.id === 'constitution:draft')?.mode).toBe('restricted');
  });
  it.each([-1, NaN, Infinity, 2.5])('rejects malformed current week %s', (week) => {
    expect(deriveInstitutionAgenda({ ...setup(), week }).valid).toBe(false);
  });
  it('rejects mixed-country records and role context', () => {
    const input = setup(); input.state.justice.nationId = 'korea';
    expect(deriveInstitutionAgenda(input).valid).toBe(false);
    const other = setup(); other.role = { ...other.role, nationId: 'usa' };
    expect(deriveInstitutionAgenda(other).valid).toBe(false);
  });
  it('shows no fabricated urgent work when all saved procedures have ended', () => {
    const input = setup(); input.state.constitutionalJudiciary.status = 'enacted';
    const onOpen = vi.fn();
    const html = renderToStaticMarkup(<InstitutionAgendaDesk {...input} onOpen={onOpen} busy />);
    expect(html).toContain('현재 저장된 결재·인사 심사·권한 검증 일정이 없습니다');
    expect(html).toContain('기간 진행 중'); expect(onOpen).not.toHaveBeenCalled();
  });
  it('routes to a real pending procedure without executing it', () => {
    const input = withCase(); const before = structuredClone(input); const onOpen = vi.fn();
    const tree = InstitutionAgendaDesk({ ...input, onOpen });
    expect(onOpen).not.toHaveBeenCalled();
    const target = elements(tree).find((element) => element.type === 'button' && renderToStaticMarkup(element).includes('대상 사건과 결재 확인'))!;
    (target.props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('justice', undefined);
    expect(input).toEqual(before);
  });
});
