import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import { getCampaignYearForWeek } from './campaignCalendar';
import { applyDiplomaticAgendaReward, getDiplomaticAgenda, getDiplomaticAgendaOutcome } from './diplomacy';
import { formatDiplomacyFeedbackEffects, getArmsPolicyFeedback, getEmergencyStockpileFeedback, getSummitFeedback } from './diplomacyFeedback';
import { applyStrategicPolicyRelations, applyStrategicPolicyReward, applyStrategicPolicyToPortfolio, armsDiplomacyPolicies, createArmsPortfolioState, fundEmergencyArmsStockpile, getStageDiplomaticPolicies } from './strategicArmsDiplomacy';
import type { DiplomaticRelation, GameState } from './types';

const game: GameState = { week: 30, treasury: 900, politicalPower: 200, commandPoints: 50, manpower: 400, factories: 20, fuel: 80, steel: 80, stability: 99, warSupport: 99, victoryScore: 40, enemyPressure: 50, intelNetwork: 99, airPower: 99, navalPower: 99 };
const relations: DiplomaticRelation[] = [
  { id: 'usa', name: '미국', value: 97, status: '협력', code: 'US', color: '#fff' },
  { id: 'china', name: '중국', value: 50, status: '협력', code: 'CN', color: '#fff' },
  { id: 'korea', name: '한국', value: 100, status: '협력', code: 'KR', color: '#fff' },
];

describe('actual diplomacy feedback without changing engine rules', () => {
  it('matches all 30 policy callbacks for all 13 nations and preserves input objects', () => {
    for (const nation of nations) {
      for (const policy of armsDiplomacyPolicies) {
        const portfolio = createArmsPortfolioState(nation.id);
        const before = JSON.stringify([game, relations, portfolio, policy]);
        const feedback = getArmsPolicyFeedback(game, relations, portfolio, policy);
        expect(feedback.game).toEqual({ ...applyStrategicPolicyReward(game, policy), politicalPower: Math.max(0, game.politicalPower - policy.politicalCost) });
        expect(feedback.relations).toEqual(applyStrategicPolicyRelations(relations, policy));
        expect(feedback.portfolio).toEqual(applyStrategicPolicyToPortfolio(portfolio, policy, game.week, getCampaignYearForWeek(game.week)));
        expect(JSON.stringify([game, relations, portfolio, policy])).toBe(before);
        // No changed numeric field can disappear behind a top-four display limit.
        for (const key of Object.keys(game) as (keyof GameState)[]) {
          if (key === 'week' || game[key] === feedback.game[key]) continue;
          expect(feedback.changes.find((item) => item.id === `game.${key}`)).toMatchObject({ before: game[key], after: feedback.game[key], delta: feedback.game[key] - game[key] });
        }
        for (const [key, value] of Object.entries(portfolio)) {
          if (key === 'version' || typeof value !== 'number') continue;
          const next = feedback.portfolio![key as keyof typeof portfolio];
          if (value === next) continue;
          expect(feedback.changes.find((item) => item.id === `portfolio.${key}`)).toMatchObject({ before: value, after: next });
        }
      }
    }
  });

  it('shows real diminishing gains and relationship averages instead of nominal bonuses', () => {
    const portfolio = { ...createArmsPortfolioState('britain'), capability: 97 };
    const policy = getStageDiplomaticPolicies('total-war').find((item) => item.id === 'emergency-aid')!;
    const feedback = getArmsPolicyFeedback(game, relations, portfolio, policy);
    const capability = feedback.changes.find((item) => item.id === 'portfolio.capability')!;
    expect(capability.after).toBeCloseTo(98.98); expect(capability.delta).toBeCloseTo(1.98);
    const average = feedback.changes.find((item) => item.id === 'relations.average')!;
    expect(average.before).toBeCloseTo(247 / 3); expect(average.after).toBeCloseTo(255 / 3); expect(average.detail).toBe('2/3개국 변화');
    expect(formatDiplomacyFeedbackEffects(feedback)).toContainEqual({ label: '군비 전력', value: '97 → 98.98 (+1.98)', tone: 'positive' });
    expect(formatDiplomacyFeedbackEffects(feedback).some((item) => item.value === '+11')).toBe(false);
    expect(feedback.portfolio!.history.at(-1)?.summary).toContain('기본 설계값(상한·체감 적용 전');
  });

  it('includes hidden-by-old-top-four side effects and treats risk increases as negative', () => {
    const portfolio = { ...createArmsPortfolioState('britain'), escalation: 40, proliferation: 40, covertExposure: 40 };
    const policy = armsDiplomacyPolicies.find((item) => item.route === 'covert')!;
    const feedback = getArmsPolicyFeedback(game, relations, portfolio, policy);
    expect(feedback.changes.length).toBeGreaterThan(4);
    expect(feedback.changes.find((item) => item.id === 'portfolio.covertExposure')).toMatchObject({ before: 40, after: 48, tone: 'negative' });
    for (const id of ['portfolio.escalation', 'portfolio.proliferation', 'game.enemyPressure']) {
      const item = feedback.changes.find((entry) => entry.id === id);
      if (item && item.delta > 0) expect(item.tone).toBe('negative');
    }
    const aid = getArmsPolicyFeedback(game, relations, portfolio, getStageDiplomaticPolicies('total-war')[0]);
    expect(aid.changes.find((item) => item.id === 'portfolio.covertExposure')).toMatchObject({ before: 40, after: 38, tone: 'positive' });
    expect(aid.changes.find((item) => item.id === 'portfolio.autonomy')?.tone).toBe('negative');
  });

  it.each([0, 97, 100])('does not invent policy gains at a bounded portfolio value of %s', (value) => {
    const portfolio = { ...createArmsPortfolioState('britain'), capability: value, supplySecurity: value, treatyCompliance: value, emergencyStockpile: value };
    const policy = getStageDiplomaticPolicies('total-war')[0];
    const feedback = getArmsPolicyFeedback(game, [], portfolio, policy);
    const actual = applyStrategicPolicyToPortfolio(portfolio, policy, game.week, getCampaignYearForWeek(game.week));
    expect(feedback.portfolio).toEqual(actual);
    expect(feedback.changes.every((item) => Number.isFinite(item.before) && Number.isFinite(item.after))).toBe(true);
    if (value === 100) expect(feedback.changes.some((item) => item.id === 'portfolio.capability')).toBe(false);
    expect(feedback.changes.find((item) => item.id === 'relations.average')).toMatchObject({ before: 0, after: 0, detail: '0/0개국 변화' });
  });

  it.each(nations)('matches the one-charge summit callback and capped reward for $id', (nation) => {
    const agenda = getDiplomaticAgenda(nation.id); const outcome = getDiplomaticAgendaOutcome(nation.id);
    const partnerRelations = [{ ...relations[0], id: agenda.partnerNationId, value: 100 }];
    const before = JSON.stringify([game, partnerRelations]);
    const feedback = getSummitFeedback(game, partnerRelations, nation.id);
    expect(feedback.game).toEqual(applyDiplomaticAgendaReward({ ...game, politicalPower: game.politicalPower - outcome.cost }, outcome.reward));
    expect(feedback.game.politicalPower).toBe(game.politicalPower - outcome.cost);
    expect(feedback.changes.find((item) => item.id === `relations.${agenda.partnerNationId}`)).toMatchObject({ before: 100, after: 100, delta: 0, tone: 'neutral' });
    expect(JSON.stringify([game, partnerRelations])).toBe(before);
    if (nation.id === 'britain') expect(feedback.changes.find((item) => item.id === 'game.warSupport')).toMatchObject({ before: 99, after: 100, delta: 1 });
  });

  it('shows a stockpile gain of eleven and security gain of 1.08 with one original charge', () => {
    const portfolio = { ...createArmsPortfolioState('britain'), supplySecurity: 97, emergencyStockpile: 89 };
    const before = JSON.stringify([game, portfolio]);
    const feedback = getEmergencyStockpileFeedback(game, portfolio);
    expect(feedback.game).toEqual({ ...game, politicalPower: 196, treasury: 845 });
    expect(feedback.portfolio).toEqual(fundEmergencyArmsStockpile(portfolio, game.week, getCampaignYearForWeek(game.week)));
    expect(feedback.changes.find((item) => item.id === 'portfolio.emergencyStockpile')).toMatchObject({ before: 89, after: 100, delta: 11 });
    expect(feedback.changes.find((item) => item.id === 'portfolio.supplySecurity')?.delta).toBeCloseTo(1.08);
    expect(formatDiplomacyFeedbackEffects(feedback)).toContainEqual({ label: '공급 안보', value: '97 → 98.08 (+1.08)', tone: 'positive' });
    expect(JSON.stringify([game, portfolio])).toBe(before);
  });

  it('uses the existing money formatter while retaining exact numeric deltas in feedback', () => {
    const feedback = getEmergencyStockpileFeedback(game, createArmsPortfolioState('britain'));
    const effects = formatDiplomacyFeedbackEffects(feedback, (value, options) => `${options?.signed && value > 0 ? '+' : ''}${value} 국고`);
    expect(effects.find((item) => item.label === '국고')).toEqual({ label: '국고', value: '900 국고 → 845 국고 (-55 국고)', tone: 'negative' });
    expect(effects.filter((item) => item.label === '정치력')).toHaveLength(1);
  });
});
