import { describe, expect, it } from 'vitest';
import { deriveCommandReadiness, deriveOnboardingSteps, deriveUXActions, deriveWeeklyCommandCycle, getInitialNavigationCollapsed, normalizeUXPreferences } from './ux';
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
  it('blocks the weekly preflight when an urgent command task remains', () => {
    const readiness = deriveCommandReadiness(deriveUXActions(baseInput));
    expect(readiness).toMatchObject({
      state: 'blocked',
      urgentCount: 3,
      recommendedCount: 2,
    });
    expect(readiness.title).toContain('긴급 판단 3건');
  });

  it('clears the weekly preflight when no command task remains', () => {
    const readiness = deriveCommandReadiness([]);
    expect(readiness).toMatchObject({
      state: 'clear',
      urgentCount: 0,
      recommendedCount: 0,
      infoCount: 0,
    });
  });

  it('surfaces urgent blockers before recommended actions', () => {
    const actions = deriveUXActions(baseInput);
    expect(actions.slice(0, 3).map((action) => action.id)).toEqual(['commander-skill', 'research-slot', 'idle-factories']);
    expect(actions.every((action, index) => index === 0 || actions[index - 1].priority !== 'recommended' || action.priority !== 'urgent')).toBe(true);
    expect(actions.every((action) => action.reason && action.ifIgnored && action.resolution)).toBe(true);
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

  it('guides a new week from result review through briefing and urgent decisions', () => {
    const review = deriveWeeklyCommandCycle({
      week: 3,
      hasCurrentWeekResults: true,
      resultsReviewed: false,
      weeklyUnread: true,
      urgentCount: 2,
      recommendedCount: 3,
      activeOrders: 1,
      activeResearch: 2,
    });
    expect(review).toMatchObject({ currentStage: 'review', primaryDestination: 'journal', readyToAdvance: false });
    expect(review.steps.map((step) => step.state)).toEqual(['current', 'waiting', 'waiting', 'waiting']);

    const briefing = deriveWeeklyCommandCycle({
      week: 3,
      hasCurrentWeekResults: true,
      resultsReviewed: true,
      weeklyUnread: true,
      urgentCount: 2,
      recommendedCount: 3,
      activeOrders: 1,
      activeResearch: 2,
    });
    expect(briefing).toMatchObject({ currentStage: 'briefing', primaryDestination: 'weekly' });
  });

  it('keeps recommended adjustments optional once mandatory weekly checks are complete', () => {
    const cycle = deriveWeeklyCommandCycle({
      week: 4,
      hasCurrentWeekResults: true,
      resultsReviewed: true,
      weeklyUnread: false,
      urgentCount: 0,
      recommendedCount: 2,
      activeOrders: 0,
      activeResearch: 2,
    });
    expect(cycle).toMatchObject({ currentStage: 'advance', primaryDestination: 'advance', readyToAdvance: true });
    expect(cycle.steps.find((step) => step.id === 'decisions')?.state).toBe('optional');
    expect(cycle.primaryLabel).toBe('다음 주 진행');
  });
});
