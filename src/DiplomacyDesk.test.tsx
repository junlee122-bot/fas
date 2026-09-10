import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DiplomacyDesk, confirmDiplomacyOrder, getSummitReadiness, reviewDiplomacyOrder, type DiplomacyDeskProps } from './DiplomacyDesk';
import { getNation, nations } from './campaign';
import { createArmsPortfolioState, fundEmergencyArmsStockpile, getStageDiplomaticPolicies, getStrategicDecisionId } from './strategicArmsDiplomacy';
import { initialRelations } from './data';
import { formatDiplomacyFeedbackEffects, getArmsPolicyFeedback, getSummitFeedback } from './diplomacyFeedback';
import { applyStrategicPolicyRelations, applyStrategicPolicyReward, applyStrategicPolicyToPortfolio } from './strategicArmsDiplomacy';
import { getCampaignYearForWeek } from './campaignCalendar';
import type { GameState } from './types';

const game: GameState = { week: 0, treasury: 900, politicalPower: 80, commandPoints: 50, manpower: 400, factories: 20, fuel: 80, steel: 80, stability: 75, warSupport: 80, victoryScore: 40, enemyPressure: 50, intelNetwork: 50, airPower: 60, navalPower: 60 };
function props(overrides: Partial<DiplomacyDeskProps> = {}): DiplomacyDeskProps {
  return { game: { ...game }, relations: structuredClone(initialRelations), nation: getNation('britain'), completedDecisions: [], armsPortfolio: createArmsPortfolioState('britain'), setGame: vi.fn(), setRelations: vi.fn(), notify: vi.fn(), onDecision: vi.fn(), onEnactArmsPolicy: vi.fn(), onFundStockpile: vi.fn(), onActionCompleted: vi.fn(), onRecord: vi.fn(), formatMoney: (n) => `${n} 국고`, ...overrides };
}
describe('diplomacy command desk', () => {
  it('renders a single country detail and separate workspaces without mutation', () => {
    const p = props(); const before = JSON.stringify([p.game, p.relations, p.armsPortfolio]);
    const html = renderToStaticMarkup(<DiplomacyDesk {...p} />);
    expect(html).toContain('외교 접촉 검토'); expect(html).toContain('회담 의제'); expect(html).toContain('군비·협약');
    expect(html).not.toContain('의제 준비도'); expect(html).not.toContain('90일 군수 공동비축');
    expect(p.setGame).not.toHaveBeenCalled(); expect(JSON.stringify([p.game, p.relations, p.armsPortfolio])).toBe(before);
  });
  it('keeps review read-only and caps exact relationship gain', () => {
    const p = props(); p.relations[0].value = 97;
    const result = reviewDiplomacyOrder(p, { kind: 'influence', id: p.relations[0].id });
    expect(result.review?.cost).toBe(8); expect(result.review?.effects[0]).toBe('관계 97 → 100');
    expect(p.setRelations).not.toHaveBeenCalled();
  });
  it('confirms the selected nation once, spends eight points and records the result', () => {
    const p = props(); const id = p.relations[1].id; const review = reviewDiplomacyOrder(p, { kind: 'influence', id }).review!;
    const gate = { current: null as string | null };
    expect(confirmDiplomacyOrder(review, p, gate).accepted).toBe(true);
    expect(confirmDiplomacyOrder(review, p, gate).accepted).toBe(false);
    const changeGame = vi.mocked(p.setGame).mock.calls[0][0] as (g: GameState) => GameState;
    const changeRelations = vi.mocked(p.setRelations).mock.calls[0][0] as (r: typeof p.relations) => typeof p.relations;
    expect(changeGame(p.game).politicalPower).toBe(72);
    expect(changeRelations(p.relations)[1].value).toBe(Math.min(100, p.relations[1].value + 7));
    expect(changeRelations(p.relations)[0]).toBe(p.relations[0]);
    expect(p.onRecord).toHaveBeenCalledTimes(1); expect(p.onActionCompleted).toHaveBeenCalledTimes(1);
  });
  it.each(['week', 'resources', 'relations', 'nation', 'busy', 'authority'] as const)('rejects stale %s before writes', (field) => {
    const p = props(); const review = reviewDiplomacyOrder(p, { kind: 'influence', id: p.relations[0].id }).review!;
    const changed = { ...p };
    if (field === 'week') changed.game = { ...p.game, week: 1 };
    if (field === 'resources') changed.game = { ...p.game, politicalPower: 70 };
    if (field === 'relations') changed.relations = [];
    if (field === 'nation') changed.nation = getNation('korea');
    if (field === 'busy') changed.busy = true;
    if (field === 'authority') changed.authorized = false;
    expect(confirmDiplomacyOrder(review, changed, { current: null }).accepted).toBe(false);
    expect(p.setGame).not.toHaveBeenCalled();
  });
  it('blocks insufficient resources, unknown targets and maximum relationship', () => {
    const p = props({ game: { ...game, politicalPower: 7 } });
    expect(reviewDiplomacyOrder(p, { kind: 'influence', id: p.relations[0].id }).review).toBeNull();
    expect(reviewDiplomacyOrder(props(), { kind: 'influence', id: 'missing' }).review).toBeNull();
    p.game.politicalPower = 100; p.relations[0].value = 100;
    expect(reviewDiplomacyOrder(p, { kind: 'influence', id: p.relations[0].id }).review).toBeNull();
  });
  it('checks summit date, partner, readiness and campaign completion for all nations', () => {
    for (const nation of nations) {
      const p = props({ nation, armsPortfolio: createArmsPortfolioState(nation.id) });
      const summit = getSummitReadiness(p);
      expect(reviewDiplomacyOrder(p, { kind: 'summit' }).review).toBeNull();
      p.game.week = 30; p.game.politicalPower = 200;
      p.relations = [{ id: summit.partner.id, name: summit.partner.name, value: 100, status: '협력', code: summit.partner.code, color: '#fff' }];
      expect(reviewDiplomacyOrder(p, { kind: 'summit' }).review).not.toBeNull();
      p.completedDecisions.push(summit.decisionId);
      expect(reviewDiplomacyOrder(p, { kind: 'summit' }).review).toBeNull();
    }
  });
  it('hands summit costs to the existing decision handler, not a second direct charge', () => {
    const p = props({ game: { ...game, week: 30, politicalPower: 200 } });
    p.relations = [{ id: 'usa', name: '미국', code: 'US', color: '', status: '협력', value: 100 }];
    const review = reviewDiplomacyOrder(p, { kind: 'summit' }).review!;
    expect(confirmDiplomacyOrder(review, p, { current: null }).accepted).toBe(true);
    expect(p.onDecision).toHaveBeenCalledWith('diplomatic-agenda-britain', review.title, review.cost, expect.any(Function));
    expect(p.setGame).not.toHaveBeenCalled();
  });
  it('blocks policies outside the era, duplicates and missing funds', () => {
    const p = props(); const policy = getStageDiplomaticPolicies('total-war').find((r) => r.effects.treasury < 0)!;
    expect(reviewDiplomacyOrder(p, { kind: 'policy', id: 'missing' }).review).toBeNull();
    p.completedDecisions = [getStrategicDecisionId(policy.id, policy.stageId)];
    expect(reviewDiplomacyOrder(p, { kind: 'policy', id: policy.id }).review).toBeNull();
    p.completedDecisions = []; p.game.treasury = 0;
    expect(reviewDiplomacyOrder(p, { kind: 'policy', id: policy.id }).review).toBeNull();
  });
  it('uses existing policy callbacks without a duplicate political or treasury charge', () => {
    const p = props(); const policy = getStageDiplomaticPolicies('total-war')[0];
    const review = reviewDiplomacyOrder(p, { kind: 'policy', id: policy.id }).review!;
    expect(review.timing).toContain(`${policy.reviewYears}년`);
    confirmDiplomacyOrder(review, p, { current: null });
    expect(p.onEnactArmsPolicy).toHaveBeenCalledExactlyOnceWith(policy); expect(p.setGame).not.toHaveBeenCalled();
  });
  it('previews stockpile with actual diminishing returns, no fake +6', () => {
    const p = props(); p.armsPortfolio.supplySecurity = 97;
    const before = JSON.stringify(p.armsPortfolio);
    const expected = fundEmergencyArmsStockpile(p.armsPortfolio, p.game.week, 1942);
    const review = reviewDiplomacyOrder(p, { kind: 'stockpile' }).review!;
    expect(review.cost).toBe(4); expect(review.treasuryDelta).toBe(-55);
    expect(expected.supplySecurity).toBeCloseTo(98.08);
    expect(review.effects).toContain('공급 안보 97 → 98.08 (+1.08)');
    expect(JSON.stringify(p.armsPortfolio)).toBe(before);
    confirmDiplomacyOrder(review, p, { current: null });
    expect(p.onFundStockpile).toHaveBeenCalledTimes(1); expect(p.setGame).not.toHaveBeenCalled();
  });
  it('blocks stockpile upper bound and mismatched national portfolio', () => {
    const p = props(); p.armsPortfolio.emergencyStockpile = 90;
    expect(reviewDiplomacyOrder(p, { kind: 'stockpile' }).review).toBeNull();
    p.armsPortfolio = createArmsPortfolioState('korea');
    expect(reviewDiplomacyOrder(p, { kind: 'stockpile' }).review).toBeNull();
  });

  it('uses capped summit rewards in the approval review and charges once through the actual callback contract', () => {
    const p = props({ game: { ...game, week: 30, politicalPower: 200, warSupport: 99 } });
    p.relations = [{ id: 'usa', name: '미국', code: 'US', color: '', status: '협력', value: 100 }];
    const expected = getSummitFeedback(p.game, p.relations, p.nation.id);
    const review = reviewDiplomacyOrder(p, { kind: 'summit' }).review!;
    expect(review.effects).toContain('전쟁 지지도 99 → 100 (+1)');
    expect(review.effects).toContain('미국 관계 100 → 100 (0)');
    expect(review.effects.some((effect) => effect.includes('지지도 +3'))).toBe(false);
    p.setGame = vi.fn((update) => { p.game = typeof update === 'function' ? update(p.game) : update; });
    p.setRelations = vi.fn((update) => { p.relations = typeof update === 'function' ? update(p.relations) : update; });
    p.onDecision = vi.fn((id, _title, cost, effect) => {
      p.setGame((current) => ({ ...current, politicalPower: current.politicalPower - cost }));
      p.completedDecisions = [...p.completedDecisions, id]; effect();
    });
    const gate = { current: null as string | null };
    expect(confirmDiplomacyOrder(review, p, gate).accepted).toBe(true);
    expect(p.game).toEqual(expected.game); expect(p.relations).toEqual(expected.relations);
    expect(p.game.politicalPower).toBe(184); expect(p.onDecision).toHaveBeenCalledTimes(1);
    expect(confirmDiplomacyOrder(review, p, gate).accepted).toBe(false);
    expect(p.game.politicalPower).toBe(184); expect(p.onDecision).toHaveBeenCalledTimes(1);
  });

  it('uses all actual policy deltas in review without spending during preview or double charging during dispatch', () => {
    const p = props(); p.armsPortfolio.capability = 97;
    const policy = getStageDiplomaticPolicies('total-war')[0];
    const before = JSON.stringify([p.game, p.relations, p.armsPortfolio]);
    const expected = getArmsPolicyFeedback(p.game, p.relations, p.armsPortfolio, policy);
    const review = reviewDiplomacyOrder(p, { kind: 'policy', id: policy.id }).review!;
    expect(review.effects).toContain('군비 전력 97 → 98.98 (+1.98)');
    for (const effect of formatDiplomacyFeedbackEffects(expected, p.formatMoney)) expect(review.effects).toContain(`${effect.label} ${effect.value}`);
    expect(review.effects.length).toBeGreaterThan(4);
    expect(JSON.stringify([p.game, p.relations, p.armsPortfolio])).toBe(before);
    expect(p.onEnactArmsPolicy).not.toHaveBeenCalled();
    p.onEnactArmsPolicy = vi.fn((selected) => {
      const current = p.game;
      p.game = { ...applyStrategicPolicyReward(current, selected), politicalPower: Math.max(0, current.politicalPower - selected.politicalCost) };
      p.relations = applyStrategicPolicyRelations(p.relations, selected);
      p.armsPortfolio = applyStrategicPolicyToPortfolio(p.armsPortfolio, selected, current.week, getCampaignYearForWeek(current.week));
      p.completedDecisions.push(getStrategicDecisionId(selected.id, selected.stageId));
    });
    const gate = { current: null as string | null };
    expect(confirmDiplomacyOrder(review, p, gate).accepted).toBe(true);
    expect(p.game).toEqual(expected.game); expect(p.relations).toEqual(expected.relations); expect(p.armsPortfolio).toEqual(expected.portfolio);
    expect(p.game.politicalPower).toBe(72); expect(p.game.treasury).toBe(970);
    expect(p.setGame).not.toHaveBeenCalled(); expect(p.onEnactArmsPolicy).toHaveBeenCalledTimes(1);
    expect(confirmDiplomacyOrder(review, p, gate).accepted).toBe(false);
    expect(p.onEnactArmsPolicy).toHaveBeenCalledTimes(1);
  });
});
