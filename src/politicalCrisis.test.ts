import { describe, expect, it } from 'vitest';
import { getRole, nations } from './campaign';
import { createEconomyState } from './economy';
import { createNationManagementState } from './nationManagement';
import {
  advancePoliticalCrisisWeek,
  applyCoupPrevention,
  assessCoupRisk,
  canUsePoliticalAction,
  createPoliticalCrisisState,
  getNationPoliticalProfile,
  normalizePoliticalCrisisState,
  resolveCoupAttempt,
} from './politicalCrisis';
import type { CoupIncident, PoliticalCrisisContext } from './politicalCrisis';
import type { GameState, NationId } from './types';

const stableGame: GameState = {
  week: 12,
  manpower: 1200,
  politicalPower: 90,
  fuel: 76,
  steel: 110,
  factories: 32,
  stability: 82,
  warSupport: 78,
  commandPoints: 60,
  treasury: 900,
  victoryScore: 66,
  airPower: 58,
  navalPower: 54,
  intelNetwork: 76,
  enemyPressure: 35,
};

function context(nationId: NationId, weak = false): PoliticalCrisisContext {
  const economy = createEconomyState(nationId);
  const game = weak ? {
    ...stableGame,
    stability: 14,
    warSupport: 18,
    treasury: 45,
    victoryScore: 12,
    intelNetwork: 18,
    enemyPressure: 94,
    politicalPower: 90,
    commandPoints: 60,
  } : stableGame;
  const nation = createNationManagementState(nationId, game, economy, 2, 'negotiated');
  return {
    week: game.week,
    phase: weak ? 'nation' : 'war',
    game,
    economy: weak ? { ...economy, debt: 2100, inflation: 28, publicConfidence: 18 } : economy,
    nation: weak ? { ...nation, unrest: 88, legitimacy: 18, mandateScore: 20 } : nation,
    averageSupply: weak ? 24 : 82,
    staffLoyalty: weak ? 31 : 84,
    staffOverload: weak ? 91 : 36,
    councilTrust: weak ? 22 : 78,
    reputation: weak ? 20 : 72,
  };
}

describe('all-nation political profiles', () => {
  it('defines three distinct power blocs and a constitutional center for every playable nation', () => {
    nations.forEach((nation) => {
      const profile = getNationPoliticalProfile(nation.id);
      expect(profile.nationId).toBe(nation.id);
      expect(profile.constitutionalCenter.length).toBeGreaterThan(0);
      expect(profile.factions).toHaveLength(3);
      expect(new Set(profile.factions.map((faction) => faction.id)).size).toBe(3);
    });
  });

  it('normalizes old saves while retaining valid government history', () => {
    const original = { ...createPoliticalCrisisState('italy'), governmentName: '국왕 임명 비상내각', generation: 2 };
    const restored = normalizePoliticalCrisisState(original, 'italy');
    const rejected = normalizePoliticalCrisisState(original, 'japan');
    expect(restored.governmentName).toBe('국왕 임명 비상내각');
    expect(restored.generation).toBe(2);
    expect(rejected.nationId).toBe('japan');
    expect(rejected.generation).toBe(0);
  });
});

describe('coup risk simulation', () => {
  it('keeps a well supplied, trusted and stable government below the attempt threshold', () => {
    const assessment = assessCoupRisk(createPoliticalCrisisState('britain'), context('britain'));
    expect(assessment.tier).toBe('stable');
    expect(assessment.weeklyChance).toBe(0);
  });

  it('turns simultaneous military, fiscal, social and elite failures into critical risk', () => {
    const assessment = assessCoupRisk(createPoliticalCrisisState('korea'), context('korea', true));
    expect(assessment.tier).toBe('critical');
    expect(assessment.score).toBeGreaterThanOrEqual(70);
    expect(assessment.weeklyChance).toBeGreaterThan(8);
    expect(assessment.crisisLabel).toBe('건국 주도권 분열');
    expect(assessment.triggers[0].contribution).toBeGreaterThan(0);
  });

  it('can escalate a critical government into a deterministic coup incident over repeated weeks', () => {
    let state = createPoliticalCrisisState('japan');
    let incident: CoupIncident | null = null;
    for (let week = 6; week < 160 && !incident; week += 1) {
      const result = advancePoliticalCrisisWeek(state, { ...context('japan', true), week });
      state = result.state;
      incident = result.incident;
    }
    expect(incident).not.toBeNull();
    expect(state.attempts).toBe(1);
    expect(incident?.leadingFactionId).toBeTruthy();
  });
});

describe('office authority and crisis outcomes', () => {
  it('lets a head of state use every branch but limits lower offices to their own branch', () => {
    const head = getRole('britain-tier1', 'britain');
    const commander = getRole('britain-tier2', 'britain');
    const agent = getRole('britain-tier3', 'britain');
    expect(canUsePoliticalAction(head, 'intelligence')).toBe(true);
    expect(canUsePoliticalAction(commander, 'military')).toBe(true);
    expect(canUsePoliticalAction(commander, 'politics')).toBe(false);
    expect(canUsePoliticalAction(agent, 'intelligence')).toBe(true);
  });

  it('applies only one preventive action per week and lowers the leading bloc grievance', () => {
    const crisisContext = context('china', true);
    const role = getRole('china-tier1', 'china');
    const state = createPoliticalCrisisState('china');
    const leadingId = assessCoupRisk(state, crisisContext).leadingFaction.id;
    const result = applyCoupPrevention(state, crisisContext, role, 'faction-dialogue');
    expect(result).not.toBeNull();
    expect(result!.state.factionStandings[leadingId].grievance).toBeLessThan(state.factionStandings[leadingId].grievance);
    expect(applyCoupPrevention(result!.state, crisisContext, role, 'public-relief')).toBeNull();
  });

  it('continues the campaign under a successor government when coup suppression fails', () => {
    const nationId: NationId = 'italy';
    const crisisContext = context(nationId, true);
    const role = getRole('italy-tier1', nationId);
    const baseState = createPoliticalCrisisState(nationId);
    const leadingFactionId = assessCoupRisk(baseState, crisisContext).leadingFaction.id;
    let successful = null as ReturnType<typeof resolveCoupAttempt>;
    for (let index = 0; index < 100 && successful?.outcome !== 'successful'; index += 1) {
      const incident: CoupIncident = {
        id: `forced-coup-${index}`,
        week: 20,
        nationId,
        kind: 'regime-struggle',
        crisisLabel: '왕실·정당·군 권력투쟁',
        title: '권력 장악 시도',
        leadingFactionId,
        riskScore: 100,
        weeklyChance: 46,
        detected: false,
        briefing: '시험',
        historicalEcho: '시험',
      };
      successful = resolveCoupAttempt(baseState, incident, role, crisisContext, 'constitutional-appeal');
    }
    expect(successful?.outcome).toBe('successful');
    expect(successful?.state.generation).toBe(1);
    expect(successful?.state.governmentName).not.toBe(baseState.governmentName);
    expect(successful?.detail).toContain('캠페인은 끝나지 않으며');
  });
});
