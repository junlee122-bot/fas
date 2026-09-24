import { describe, expect, it } from 'vitest';
import { careerRoles, nations } from './campaign';
import {
  advanceElectoralPoliticsWeek,
  applyElectionCampaignAction,
  createElectoralPoliticsState,
  electionCampaignActions,
  getElectionActionPresentation,
  getElectionEraProfile,
  launchReferendum,
  normalizeElectoralPoliticsState,
  type ElectoralContext,
} from './electoralPolitics';

const leader = careerRoles.find((role) => role.nationId === 'korea' && role.tier === 1)!;
const baseContext: ElectoralContext = {
  week: 10,
  role: leader,
  politicalPower: 120,
  treasury: 900,
  stability: 70,
  legitimacy: 68,
  mandateScore: 62,
  unrest: 28,
  education: 58,
  institutionalCapacity: 61,
  inflation: 5,
  publicConfidence: 66,
};

describe('electoral politics engine', () => {
  it('creates historical candidate fields and six mayoral regions for every nation', () => {
    nations.forEach((nation) => {
      const state = createElectoralPoliticsState(nation.id, 0);
      expect(state.candidates).toHaveLength(3);
      expect(state.candidates.every((candidate) => candidate.name.length >= 2 && candidate.historicalOffice.length > 1)).toBe(true);
      expect(state.regions).toHaveLength(6);
      expect(state.activeCampaign?.electionWeek).toBe(8);
    });
  });

  it('applies campaign actions with regional targeting and diminishing repeats', () => {
    const state = createElectoralPoliticsState('korea', 2);
    const regionId = state.regions[0].id;
    const first = applyElectionCampaignAction(state, 'mass-rally', regionId, { ...baseContext, week: 3 })!;
    const second = applyElectionCampaignAction(first.state, 'mass-rally', regionId, { ...baseContext, week: 4 })!;
    expect(first.state.activeCampaign?.regionalBoosts[regionId]).toBeGreaterThan(0);
    expect(second.state.activeCampaign?.actions).toHaveLength(2);
    expect(second.state.activeCampaign!.actions[1].momentumDelta).toBeLessThan(first.state.activeCampaign!.actions[0].momentumDelta);
  });

  it('resolves a two-round presidential election through a runoff when nobody wins a majority', () => {
    let state = createElectoralPoliticsState('korea', 0);
    const firstRound = advanceElectoralPoliticsWeek(state, { ...baseContext, week: 8 });
    expect(firstRound.state.activeCampaign?.stage).toBe('runoff');
    expect(firstRound.state.activeCampaign?.candidateIds).toHaveLength(2);
    state = firstRound.state;
    const finalRound = advanceElectoralPoliticsWeek(state, { ...baseContext, week: 11 });
    expect(finalRound.state.activeCampaign).toBeNull();
    expect(finalRound.state.campaignHistory[0].candidateResults).toHaveLength(2);
    expect(finalRound.state.campaignHistory[0].regionalResults).toHaveLength(6);
  });

  it('records six named mayor winners in a local election', () => {
    const initial = createElectoralPoliticsState('britain', 0);
    const localCampaign = { ...initial.activeCampaign!, id: 'local-test', type: 'local' as const, electionWeek: 4 };
    const state = { ...initial, activeCampaign: localCampaign };
    const result = advanceElectoralPoliticsWeek(state, { ...baseContext, week: 4 });
    expect(result.state.campaignHistory[0].mayorResults).toHaveLength(6);
    expect(result.state.campaignHistory[0].mayorResults[0].winnerName).toContain('후보');
  });

  it('launches and resolves a constitutional referendum with an auditable result', () => {
    const initial = { ...createElectoralPoliticsState('korea', 0), activeCampaign: null };
    const launched = launchReferendum(initial, 'presidential-constitution', baseContext)!;
    expect(launched.state.activeCampaign?.type).toBe('referendum');
    const resolved = advanceElectoralPoliticsWeek(launched.state, { ...baseContext, week: baseContext.week + 6 });
    const result = resolved.state.campaignHistory[0];
    expect(result.referendum?.question).toContain('대통령');
    expect(result.summary).toContain('투표율');
  });

  it('migrates old saves with a complete election calendar', () => {
    const restored = normalizeElectoralPoliticsState(undefined, 'italy', 44);
    expect(restored.nationId).toBe('italy');
    expect(restored.activeCampaign?.startedWeek).toBe(44);
    expect(restored.nextLocalWeek).toBe(70);
  });

  it('changes campaign language and effect multipliers across media eras', () => {
    const radioAction = getElectionActionPresentation(
      electionCampaignActions.find((action) => action.id === 'radio-address')!,
      0,
    );
    const platformAction = getElectionActionPresentation(
      electionCampaignActions.find((action) => action.id === 'radio-address')!,
      (2008 - 1942) * 52,
    );
    expect(radioAction.name).toContain('라디오');
    expect(platformAction.name).toContain('플랫폼');
    expect(getElectionEraProfile((2040 - 1942) * 52).id).toBe('synthetic-trust');
    expect(getElectionEraProfile((1990 - 1942) * 52).momentumMultiplier).not.toBe(getElectionEraProfile(0).momentumMultiplier);
  });
});
