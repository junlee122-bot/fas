import { describe, expect, it } from 'vitest';
import { deriveUXActions, normalizeUXPreferences } from './ux';
import type { ActionCenterInput } from './ux';

const baseInput: ActionCenterInput = {
  factories: 12,
  production: [{ id: 'rifle', name: '소총', category: '장비', assigned: 7, efficiency: 60, output: 10, icon: 'R' }],
  research: [{ id: 'radar', name: '레이더', branch: '전자', description: '', progress: 0, duration: 100, active: false, complete: false, icon: 'R' }],
  selectedPolicies: [],
  divisions: [{ id: 'division', name: '시험 사단', type: 'infantry', strength: 90, organization: 80, experience: 50, supply: 70, territoryId: 'home', commanderId: 'general', status: 'ready' }],
  orders: [],
  commanderDevelopment: [{ commanderId: 'general', xp: 22, battles: 1, victories: 1, fatigue: 20, skills: [] }],
};

describe('user experience guidance', () => {
  it('surfaces urgent blockers before recommended actions', () => {
    const actions = deriveUXActions(baseInput);
    expect(actions.slice(0, 3).map((action) => action.id)).toEqual(['commander-skill', 'research-slot', 'idle-factories']);
    expect(actions.every((action, index) => index === 0 || actions[index - 1].priority !== 'recommended' || action.priority !== 'urgent')).toBe(true);
  });

  it('removes resolved recommendations from the action center', () => {
    const actions = deriveUXActions({
      ...baseInput,
      production: [{ ...baseInput.production[0], assigned: 12 }],
      research: [
        { ...baseInput.research[0], active: true },
        { ...baseInput.research[0], id: 'code', active: true },
      ],
      selectedPolicies: ['economy', 'doctrine', 'society', 'diplomacy'],
      orders: [{ divisionId: 'division', fromId: 'home', targetId: 'front', startedWeek: 1 }],
      commanderDevelopment: [{ ...baseInput.commanderDevelopment[0], skills: ['operational-planner'] }],
    });
    expect(actions).toHaveLength(0);
  });

  it('migrates partial interface preferences safely', () => {
    expect(normalizeUXPreferences({ highContrast: true })).toEqual({
      soundOn: true,
      highContrast: true,
      readableUI: true,
      largeMapLabels: false,
      reducedMotion: false,
    });
  });
});
