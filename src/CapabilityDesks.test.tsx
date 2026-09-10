import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ResearchDesk, assessResearchAction, getResearchDeskSelection, getResearchSlotTarget, getResearchWeeks } from './ResearchDesk';
import { ProductionDesk, assessFactoryDraft, createFactoryDraft } from './ProductionDesk';
import { LandForceRoster, getLandDivisionSelectionId } from './LandForceRoster';
import { reallocateFactory } from './livingWorld';
import type { Division, ProductionLine, ResearchProject, Stockpile } from './types';

const project = (id: string, overrides: Partial<ResearchProject> = {}): ResearchProject => ({ id, name: id, branch: '산업', description: '선택한 국가 연구', progress: 20, duration: 100, active: false, complete: false, icon: 'test', minimumYear: 1942, ...overrides });
const lines: ProductionLine[] = [{ id: 'rifle', name: '보병 생산선', category: '보병', assigned: 2, efficiency: 60, output: 100, icon: 'rifle' }];
const stocks: Stockpile = { infantryEquipment: 500, tanks: 1, aircraft: 2, convoys: 3, artillery: 4, trucks: 5 };
const factoryInput = () => ({ nationId: 'britain', week: 8, production: structuredClone(lines), factories: 4, busy: false });

describe('national research desk', () => {
  it('reading renders selection and explicit action separately without toggling', () => {
    const onToggle = vi.fn(); const research = [project('암호 연구', { active: true }), project('생산 공정')]; const before = JSON.stringify(research);
    const html = renderToStaticMarkup(<ResearchDesk research={research} currentYear={1942} week={0} weeklyGain={10} onToggle={onToggle} />);
    expect(html).toContain('연구 과제 선택'); expect(html).toContain('이 연구 일시 중지'); expect(html).toContain('약 8주');
    expect(onToggle).not.toHaveBeenCalled(); expect(JSON.stringify(research)).toBe(before);
  });
  it('blocks starting a third slot while permitting explicit pause', () => {
    const research = [project('a', { active: true }), project('b', { active: true }), project('c')];
    expect(assessResearchAction(research[2], research, 1942).allowed).toBe(false);
    expect(assessResearchAction(research[0], research, 1942).allowed).toBe(true);
  });
  it('never exposes a selected project action outside the current filter or search', () => {
    const research = [project('암호 연구', { active: true }), project('완료 연구', { active: false, complete: true }), project('생산 공정')];
    const before = JSON.stringify(research);
    for (const selection of [
      { filter: 'complete' as const, query: '', selectedId: '암호 연구' },
      { filter: 'available' as const, query: '생산', selectedId: '암호 연구' },
      { filter: 'active' as const, query: '존재하지 않는 이름', selectedId: '암호 연구' },
      { filter: 'active' as const, query: '', selectedId: '퇴역한 과제' },
    ]) {
      const result = getResearchDeskSelection(research, 1942, selection);
      expect(result.selected).toBeUndefined();
      expect(assessResearchAction(result.selected, research, 1942).allowed).toBe(false);
    }
    expect(getResearchDeskSelection(research, 1942, { filter: 'available', query: '생산', selectedId: '생산 공정' }).selected).toBe(research[2]);
    expect(JSON.stringify(research)).toBe(before);
  });
  it('slot navigation clears search and targets only that active project without starting research', () => {
    const research = [project('첫 연구', { active: true }), project('두 번째 연구', { active: true }), project('미배정 연구')];
    const before = JSON.stringify(research);
    const target = getResearchSlotTarget(research, 1);
    expect(target).toEqual({ filter: 'active', query: '', selectedId: '두 번째 연구' });
    expect(getResearchDeskSelection(research, 1942, target).selected).toBe(research[1]);
    const emptyTarget = getResearchSlotTarget(research.slice(0, 1), 1);
    expect(emptyTarget).toEqual({ filter: 'available', query: '', selectedId: '' });
    expect(getResearchDeskSelection(research, 1942, emptyTarget).selected).toBeUndefined();
    expect(JSON.stringify(research)).toBe(before);
  });
  it('never calls future, prerequisite-locked or completed projects available', () => {
    for (const p of [project('future', { minimumYear: 1960 }), project('dependent', { prerequisites: ['missing'] }), project('done', { complete: true })]) expect(assessResearchAction(p, [p], 1942).allowed).toBe(false);
    expect(assessResearchAction(undefined, [], 1942).allowed).toBe(false);
    expect(assessResearchAction(project('a'), [], 1942, true).allowed).toBe(false);
  });
  it('does not display infinity as a finish date when progress is halted', () => {
    for (const gain of [0, -1, NaN, Infinity]) expect(getResearchWeeks(project('a'), gain)).toBeNull();
    expect(getResearchWeeks(project('a', { progress: 100 }), 10)).toBe(0);
  });
  it('represents a missing catalogue safely and treats liaison as historical context', () => {
    const html = renderToStaticMarkup(<ResearchDesk research={[]} currentYear={2060} week={6000} weeklyGain={0} onToggle={vi.fn()} liaison={{ name: '연락 인물', office: '출발 직책', bonus: '+2' }} />);
    expect(html).toContain('조건에 맞는 과제가 없습니다'); expect(html).toContain('현시점의 실제 재직 참모나 추가 보상을 뜻하지 않습니다');
    expect(html).not.toContain('Infinity');
  });
});
describe('factory review matches existing allocation engine', () => {
  it('previews the real efficiency penalty with no mutation', () => {
    const input = factoryInput(); const before = JSON.stringify(input); const draft = createFactoryDraft(input, 'rifle', -1); const result = assessFactoryDraft(draft, input);
    expect(result.allowed).toBe(true); expect(result.next).toEqual(reallocateFactory(input.production, 4, 'rifle', -1, true));
    expect(result.next![0]).toMatchObject({ assigned: 1, efficiency: 56 }); expect(JSON.stringify(input)).toBe(before);
  });
  it.each(['week', 'nation', 'factories', 'line', 'busy'] as const)('rejects a stale %s context', (change) => {
    const input = factoryInput(); const draft = createFactoryDraft(input, 'rifle', -1);
    if (change === 'week') input.week += 1;
    if (change === 'nation') input.nationId = 'korea';
    if (change === 'factories') input.factories += 1;
    if (change === 'line') input.production[0].efficiency += 1;
    if (change === 'busy') input.busy = true;
    expect(assessFactoryDraft(draft, input).allowed).toBe(false);
  });
  it('rejects replay, no capacity, empty line and forged amount', () => {
    const input = factoryInput(); const draft = createFactoryDraft(input, 'rifle', 1);
    expect(assessFactoryDraft(draft, { ...input, production: reallocateFactory(input.production, 4, 'rifle', 1, true)! }).allowed).toBe(false);
    const full = { ...input, factories: 2 };
    expect(assessFactoryDraft(createFactoryDraft(full, 'rifle', 1), full).allowed).toBe(false);
    expect(assessFactoryDraft(createFactoryDraft(input, 'missing', -1), input).allowed).toBe(false);
    expect(assessFactoryDraft({ ...draft, delta: 20 as 1 }, input).allowed).toBe(false);
  });
  it('shows supplied authoritative weekly projection, not a week-one recomputation', () => {
    const onAdjust = vi.fn(); const html = renderToStaticMarkup(<ProductionDesk {...factoryInput()} stockpile={stocks} weeklyGains={{ ...stocks, infantryEquipment: 12345 }} onAdjust={onAdjust} />);
    expect(html).toContain('12,345'); expect(html).toContain('공장 1개 회수안'); expect(html).toContain('제9주'); expect(html).not.toContain('배정 변경 승인'); expect(onAdjust).not.toHaveBeenCalled();
  });
  it('renders empty production without inferring or creating a line', () => {
    const onAdjust = vi.fn(); const html = renderToStaticMarkup(<ProductionDesk {...factoryInput()} production={[]} stockpile={stocks} weeklyGains={stocks} onAdjust={onAdjust} />);
    expect(html).toContain('아직 배정할 생산선이 없습니다'); expect(onAdjust).not.toHaveBeenCalled();
  });
});
describe('land roster selection is a read-only command boundary', () => {
  it('rejects placeholder, removed and filtered-out IDs without choosing the first division', () => {
    const visible = [{ id: 'second' }];
    expect(getLandDivisionSelectionId(visible, '')).toBeNull();
    expect(getLandDivisionSelectionId(visible, 'first')).toBeNull();
    expect(getLandDivisionSelectionId(visible, 'removed')).toBeNull();
    expect(getLandDivisionSelectionId([], 'second')).toBeNull();
    expect(getLandDivisionSelectionId(visible, 'second')).toBe('second');
  });
  it('labels upper-command units without exposing mutation controls', () => {
    const divisions = [{ id: 'own', name: '제1사단', type: 'infantry', status: 'ready', strength: 80, commanderId: 'a', territoryId: 'a' }, { id: 'other', name: '제2사단', type: 'armor', status: 'combat', strength: 50, commanderId: 'b', territoryId: 'b' }] as Division[];
    const onSelect = vi.fn(); const html = renderToStaticMarkup(<LandForceRoster divisions={divisions} commanders={[]} territories={[]} selectedId="own" commandableIds={new Set(['own'])} scope={{ label: '사단', detail: '예하 한 개' }} onSelect={onSelect} />);
    expect(html).toContain('사단 선택'); expect(html).toContain('제2사단 · 상급 관할'); expect(html).not.toContain('공세 명령'); expect(onSelect).not.toHaveBeenCalled();
    expect(html).toMatch(/<option value="" disabled="">사단을 선택하세요<\/option>/);
  });
});
