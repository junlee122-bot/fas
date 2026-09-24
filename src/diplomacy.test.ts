import { describe, expect, it } from 'vitest';
import { applyDiplomaticAgendaReward, calculateAgendaReadiness, diplomaticAgendaOutcomes, diplomaticAgendas } from './diplomacy';
import { nations } from './campaign';

describe('nation-specific diplomatic agendas', () => {
  it('provides a historically anchored agenda for every playable entity', () => {
    expect(Object.keys(diplomaticAgendas)).toHaveLength(nations.length);
    nations.forEach((nation) => {
      const agenda = diplomaticAgendas[nation.id];
      expect(agenda.nationId).toBe(nation.id);
      expect(agenda.partnerNationId).not.toBe(nation.id);
      expect(agenda.initialWeeksUntil).toBeGreaterThan(0);
      expect(agenda.historicalAnchor.length).toBeGreaterThan(20);
    });
  });

  it('gives every agenda a distinct, achievable one-time decision outcome', () => {
    expect(Object.keys(diplomaticAgendaOutcomes)).toHaveLength(nations.length);
    nations.forEach((nation) => {
      const outcome = diplomaticAgendaOutcomes[nation.id];
      expect(outcome.cost).toBeGreaterThan(0);
      expect(outcome.requiredRelation).toBeGreaterThanOrEqual(50);
      expect(outcome.requiredReadiness).toBeGreaterThanOrEqual(60);
      expect(outcome.relationGain).toBeGreaterThan(0);
      expect(outcome.effectLabel.length).toBeGreaterThan(12);
      expect(Object.keys(outcome.reward).length).toBeGreaterThan(0);
    });
  });

  it('applies agenda rewards without allowing percentage resources above 100', () => {
    const game = {
      week: 3, manpower: 100, politicalPower: 30, fuel: 20, steel: 20, factories: 5,
      stability: 98, warSupport: 99, commandPoints: 10, treasury: 50, victoryScore: 0,
      airPower: 99, navalPower: 98, intelNetwork: 97, enemyPressure: 10,
    };
    const rewarded = applyDiplomaticAgendaReward(game, { manpower: 35, stability: 6, warSupport: 3, airPower: 3, navalPower: 3, intelNetwork: 8 });
    expect(rewarded.manpower).toBe(135);
    expect(rewarded.stability).toBe(100);
    expect(rewarded.warSupport).toBe(100);
    expect(rewarded.airPower).toBe(100);
    expect(rewarded.navalPower).toBe(100);
    expect(rewarded.intelNetwork).toBe(100);
    expect(game.manpower).toBe(100);
  });

  it('derives readiness from current relations and political power', () => {
    const weak = calculateAgendaReadiness([{ id: 'usa', name: '미국', code: 'US', value: 20, status: '경색', color: '#000' }], 10, 'usa');
    const strong = calculateAgendaReadiness([{ id: 'usa', name: '미국', code: 'US', value: 90, status: '동맹', color: '#000' }], 90, 'usa');
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeLessThanOrEqual(100);
  });

  it('uses the selected summit partner instead of hostile-country averages', () => {
    const relations = [
      { id: 'usa', name: '미국', code: 'US', value: 88, status: '동맹', color: '#000' },
      { id: 'germany', name: '독일', code: 'DE', value: 4, status: '적대', color: '#000' },
    ];
    expect(calculateAgendaReadiness(relations, 50, 'usa')).toBeGreaterThan(calculateAgendaReadiness(relations, 50, 'germany'));
  });
});
