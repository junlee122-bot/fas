import { describe, expect, it } from 'vitest';
import type { GeneratedWorldEvent, WorldHistoryEvent } from './worldHistory';
import { worldHistoryEvents } from './worldHistory';
import {
  deriveWorldFlashpointEffects,
  forecastNextWorldFlashpoint,
  getHistoricalHorizon,
  getWorldFlashpointDecisionId,
  selectNextWorldFlashpoint,
} from './worldFlashpoints';

function timelineEntry(event: WorldHistoryEvent): GeneratedWorldEvent {
  return {
    event,
    variant: event.variants[0],
    year: event.historicalYear,
    actor: '테스트 세계선 행위자',
    isPlayerChoice: false,
    causalFactors: ['테스트 조건'],
  };
}

function eventById(id: string) {
  const event = worldHistoryEvents.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`Missing world-history fixture: ${id}`);
  return event;
}

describe('in-campaign world flashpoints', () => {
  it('waits for the first quarterly decision window', () => {
    const atomic = timelineEntry(eventById('atomic-program'));
    expect(selectNextWorldFlashpoint([atomic], 12, [])).toBeNull();
    expect(selectNextWorldFlashpoint([atomic], 13, [])?.entry.event.id).toBe('atomic-program');
  });

  it('selects historically due crises first and never repeats a resolved event', () => {
    const atomic = timelineEntry(eventById('atomic-program'));
    const berlin = timelineEntry(eventById('berlin-crisis'));
    const first = selectNextWorldFlashpoint([berlin, atomic], 13, []);
    expect(first?.entry.event.id).toBe('atomic-program');
    const resolved = [getWorldFlashpointDecisionId('atomic-program', 'authority', 13)];
    expect(selectNextWorldFlashpoint([berlin, atomic], 13, resolved)).toBeNull();
  });

  it('forecasts the next quarterly decision and skips years with no eligible crisis', () => {
    const berlin = timelineEntry(eventById('berlin-crisis'));
    const forecast = forecastNextWorldFlashpoint([berlin], 0, []);
    expect(forecast?.entry.event.id).toBe('berlin-crisis');
    expect(forecast?.decisionWeek).toBe(312);
    expect(forecast?.weeksUntil).toBe(312);
    expect(forecast?.campaignYear).toBe(1948);
  });

  it('accelerates later institutions as the player resolves alternate-history crises', () => {
    const hormuz = timelineEntry(eventById('hormuz-tanker-war'));
    const priorDecisions = Array.from({ length: 23 }, (_, index) => `world-flashpoint:prior-${index}:historical:${index}`);
    const selection = selectNextWorldFlashpoint([hormuz], 52, priorDecisions);
    expect(selection?.entry.event.id).toBe('hormuz-tanker-war');
    expect(selection?.campaignYear).toBe(1943);
    expect(selection?.historicalHorizon).toBe(1989);
    expect(selection?.accelerated).toBe(true);
    expect(getHistoricalHorizon(52, priorDecisions)).toBe(1989);
  });

  it('makes Hormuz choices visibly affect fuel, convoys, naval pressure and diplomacy', () => {
    const hormuz = eventById('hormuz-tanker-war');
    const institutional = deriveWorldFlashpointEffects('hormuz-tanker-war', hormuz.category, hormuz.variants[1]);
    const blockade = deriveWorldFlashpointEffects('hormuz-tanker-war', hormuz.category, hormuz.variants[2]);
    expect(institutional.gameDelta.fuel).toBeGreaterThan(0);
    expect(institutional.stockpileDelta.convoys).toBeGreaterThan(0);
    expect(institutional.relationChange).toBeGreaterThan(0);
    expect(blockade.gameDelta.fuel).toBeLessThan(0);
    expect(blockade.stockpileDelta.convoys).toBeLessThan(0);
    expect(blockade.gameDelta.enemyPressure).toBeGreaterThan(0);
  });
});
