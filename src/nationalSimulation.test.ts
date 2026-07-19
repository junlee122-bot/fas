import { describe, expect, it } from 'vitest';
import { createEconomyState } from './economy';
import { createNationManagementState } from './nationManagement';
import { deriveNationalSimulation, type NationalSimulationInput } from './nationalSimulation';
import { createPoliticalCrisisState, getNationPoliticalProfile } from './politicalCrisis';
import { createPublicHealthState } from './publicHealth';
import type { Division, GameState, ProductionLine, ResearchProject, Stockpile } from './types';

const game: GameState = {
  week: 0,
  manpower: 1280,
  politicalPower: 86,
  fuel: 74,
  steel: 112,
  factories: 30,
  stability: 78,
  warSupport: 84,
  commandPoints: 42,
  treasury: 920,
  victoryScore: 38,
  airPower: 57,
  navalPower: 52,
  intelNetwork: 64,
  enemyPressure: 68,
};

const stockpile: Stockpile = {
  infantryEquipment: 48200,
  tanks: 1284,
  aircraft: 2106,
  convoys: 624,
  artillery: 3840,
  trucks: 12600,
};

const divisions: Division[] = [
  { id: 'division-a', name: '제1사단', type: 'infantry', strength: 82, organization: 78, experience: 54, supply: 76, territoryId: 'home', commanderId: 'commander-a', status: 'ready' },
  { id: 'division-b', name: '제2사단', type: 'armor', strength: 78, organization: 72, experience: 60, supply: 68, territoryId: 'front', commanderId: 'commander-b', status: 'combat' },
];

const production: ProductionLine[] = [
  { id: 'rifles', name: '소총', category: '보병 장비', assigned: 8, efficiency: 84, output: 1200, icon: 'factory' },
  { id: 'trucks', name: '트럭', category: '수송', assigned: 6, efficiency: 76, output: 160, icon: 'truck' },
];

const research: ResearchProject[] = [
  { id: 'radio', name: '무선 통신', branch: '통신', description: '지휘 연결', progress: 100, duration: 100, active: false, complete: true, icon: 'radio' },
  { id: 'medicine', name: '대량 의약품', branch: '의학', description: '의료 공급', progress: 40, duration: 100, active: true, complete: false, icon: 'health' },
];

function createInput(overrides: Partial<NationalSimulationInput> = {}): NationalSimulationInput {
  const economy = createEconomyState('britain');
  const nationManagement = createNationManagementState('britain', game, economy, 1, 'negotiated');
  const leadingFaction = getNationPoliticalProfile('britain').factions[0];
  return {
    nationId: 'britain',
    phase: 'war',
    game,
    economy,
    stockpile,
    production,
    divisions,
    research,
    publicHealth: createPublicHealthState(42),
    selectedPolicies: [],
    politicalState: createPoliticalCrisisState('britain'),
    coupRisk: {
      score: 18,
      tier: 'stable',
      weeklyChance: 0,
      triggers: [],
      leadingFaction,
      weakestRelation: { pair: 'civil-military', value: 48 },
    },
    nationManagement,
    ...overrides,
  };
}

describe('national simulation spine', () => {
  it('normalizes population shares and political clout', () => {
    const snapshot = deriveNationalSimulation(createInput());
    expect(snapshot.populationGroups).toHaveLength(6);
    expect(snapshot.populationGroups.reduce((sum, group) => sum + group.share, 0)).toBeCloseTo(100, 4);
    expect(snapshot.powerBlocs.reduce((sum, bloc) => sum + bloc.clout, 0)).toBeCloseTo(100, 4);
    expect(snapshot.goods).toHaveLength(6);
    expect(snapshot.institutions).toHaveLength(5);
    expect(snapshot.pressures).toHaveLength(3);
  });

  it('turns a fuel collapse into a visible supply pressure', () => {
    const snapshot = deriveNationalSimulation(createInput({
      game: { ...game, fuel: 1 },
    }));
    const fuel = snapshot.goods.find((good) => good.id === 'fuel');
    expect(fuel?.status).toBe('critical');
    expect(snapshot.pressures.some((pressure) => pressure.id === 'market-fuel')).toBe(true);
  });

  it('surfaces a dangerous power struggle as a national pressure', () => {
    const input = createInput();
    const snapshot = deriveNationalSimulation({
      ...input,
      coupRisk: { ...input.coupRisk, score: 82, tier: 'critical', weeklyChance: 18.5 },
    });
    expect(snapshot.pressures.some((pressure) => pressure.id === 'power-struggle' && pressure.severity === 'critical')).toBe(true);
    expect(snapshot.socialCohesion).toBeLessThan(70);
  });

  it('is deterministic for the same campaign state', () => {
    const input = createInput();
    expect(deriveNationalSimulation(input)).toEqual(deriveNationalSimulation(input));
  });
});
