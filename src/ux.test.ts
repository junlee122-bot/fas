import { describe, expect, it } from 'vitest';
import { deriveOnboardingSteps, deriveUXActions, getInitialNavigationCollapsed, normalizeUXPreferences } from './ux';
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

  it('separates an operating deficit and inflation warning from headline borrowing', () => {
    const actions = deriveUXActions({
      ...baseInput,
      economyOperatingBalance: -72.4,
      economyInflation: 19.2,
      economyDebt: 1240,
    });
    expect(actions.find((action) => action.id === 'economy-operating-deficit')).toMatchObject({ priority: 'urgent', tab: 'economy' });
    expect(actions.find((action) => action.id === 'economy-inflation')).toMatchObject({ priority: 'urgent', tab: 'economy' });
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

  it('starts with navigation closed on compact screens without overriding desktop preference', () => {
    expect(getInitialNavigationCollapsed(null, 390)).toBe(true);
    expect(getInitialNavigationCollapsed('false', 1440)).toBe(false);
    expect(getInitialNavigationCollapsed('true', 1440)).toBe(true);
  });

  it('derives a live first-week checklist from campaign state', () => {
    const steps = deriveOnboardingSteps({
      factories: baseInput.factories,
      production: baseInput.production,
      research: baseInput.research,
      selectedPolicies: baseInput.selectedPolicies,
      orders: baseInput.orders,
    });
    expect(steps).toHaveLength(5);
    expect(steps.every((step) => !step.complete)).toBe(true);
  });

  it('marks onboarding complete only when the corresponding systems are configured', () => {
    const steps = deriveOnboardingSteps({
      factories: 12,
      production: [{ ...baseInput.production[0], assigned: 12 }],
      research: [
        { ...baseInput.research[0], active: true },
        { ...baseInput.research[0], id: 'code', active: true },
      ],
      selectedPolicies: ['economy', 'doctrine', 'society', 'diplomacy'],
      orders: [{ divisionId: 'division', fromId: 'home', targetId: 'front', startedWeek: 1 }],
    });
    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
