import { describe, expect, it } from 'vitest';
import { strategicPolicies } from './choices';
import { deriveEmergentHistory } from './emergentHistory';
import type { GameState } from './types';

const game: GameState = {
  week: 18,
  manpower: 900,
  politicalPower: 70,
  fuel: 80,
  steel: 90,
  factories: 30,
  stability: 66,
  warSupport: 70,
  commandPoints: 50,
  treasury: 600,
  victoryScore: 40,
  airPower: 55,
  navalPower: 50,
  intelNetwork: 58,
  enemyPressure: 48,
};

describe('emergent history trajectory', () => {
  it('derives a deterministic direction from concrete campaign actions', () => {
    const input = {
      doctrine: 'coalition' as const,
      roleBranch: 'politics' as const,
      game,
      selectedPolicies: strategicPolicies.filter((policy) => ['society-autonomy', 'diplomacy-aid'].includes(policy.id)),
      completedDecisions: ['world-flashpoint:world-organization:assembly:17'],
      events: [],
      research: [],
      operations: [],
      relations: [{ id: 'ally', name: '동맹', code: 'ALY', value: 82, status: '우호', color: '#fff' }],
    };
    const first = deriveEmergentHistory(input);
    const second = deriveEmergentHistory(input);
    expect(first).toEqual(second);
    expect(first.forces.diplomacy).toBeGreaterThan(first.forces.military);
    expect(first.forces.liberation).toBeGreaterThan(20);
    expect(first.metricMomentum.multipolarity).toBeGreaterThan(0);
    expect(first.resolvedChoiceCount).toBe(1);
  });

  it('moves toward militarization when the player repeatedly chooses military levers', () => {
    const profile = deriveEmergentHistory({
      doctrine: 'maneuver',
      roleBranch: 'military',
      game: { ...game, warSupport: 92, airPower: 80, navalPower: 75 },
      selectedPolicies: strategicPolicies.filter((policy) => ['doctrine-firepower', 'society-mobilization'].includes(policy.id)),
      events: [{
        id: 1,
        week: 17,
        title: '전선 공세 명령',
        detail: '예비대를 전선 돌파에 투입했습니다.',
        tone: 'good',
        trace: {
          domain: 'operations',
          decision: '전면 공세를 승인했습니다.',
          trigger: '전선 교착',
          factors: [],
          effects: [],
          ongoing: ['동원과 군 지휘부의 영향이 커집니다.'],
          nextActions: [],
          certainty: 'confirmed',
        },
      }],
    });
    expect(profile.dominantForce).toBe('military');
    expect(profile.metricMomentum.deterrence).toBeGreaterThan(0);
  });
});
