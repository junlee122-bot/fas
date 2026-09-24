import { describe, expect, it } from 'vitest';
import { acknowledgeUXActions, decorateUXActions, deriveCommandReadiness, deriveOnboardingSteps, deriveUXActions, deriveWeeklyCommandCycle, getInitialNavigationCollapsed, isTrackedActionResolved, markUXActionsForVerification, normalizeUXActionLifecycle, normalizeUXPreferences, reconcileUXActionLifecycle, startUXAction } from './ux';
import type { ActionCenterInput } from './ux';
import { getRoleTabMandates } from './roleMandate';
import { createCivilianCareerState, civilianOrigins } from './civilianCareer';

const baseInput: ActionCenterInput = {
  factories: 12,
  production: [{ id: 'rifle', name: '소총', category: '장비', assigned: 7, efficiency: 60, output: 10, icon: 'R' }],
  research: [{ id: 'radar', name: '레이더', branch: '전자', description: '', progress: 0, duration: 100, active: false, complete: false, icon: 'R' }],
  selectedPolicies: [],
  divisions: [{ id: 'division', name: '시험 사단', type: 'infantry', strength: 90, organization: 80, experience: 50, supply: 70, territoryId: 'home', commanderId: 'general', status: 'ready' }],
  orders: [],
  commanderDevelopment: [{ commanderId: 'general', xp: 22, battles: 1, victories: 1, fatigue: 20, skills: [] }],
};

const militaryOnboarding = {
  role: { branch: 'military' as const, tier: 2 as const, scope: '전구 작전과 예하 사단 지휘' },
  week: 0,
  briefingRead: false,
  visitedTabs: [] as Array<'command' | 'organization' | 'army' | 'industry' | 'research'>,
  milestones: [] as string[],
};

describe('user experience guidance', () => {
  it('blocks the weekly preflight when an urgent command task remains', () => {
    const readiness = deriveCommandReadiness(deriveUXActions(baseInput));
    expect(readiness).toMatchObject({
      state: 'blocked',
      urgentCount: 2,
      recommendedCount: 2,
    });
    expect(readiness.title).toContain('긴급 판단 2건');
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
    expect(actions.slice(0, 2).map((action) => action.id)).toEqual(['commander-skill', 'research-slot']);
    expect(actions.find((action) => action.id === 'idle-factories')).toMatchObject({ priority: 'info', title: '민수 공급 여력 5개' });
    expect(actions.every((action, index) => index === 0 || actions[index - 1].priority !== 'recommended' || action.priority !== 'urgent')).toBe(true);
    expect(actions.every((action) => action.reason && action.ifIgnored && action.resolution && action.instruction)).toBe(true);
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

  it('does not create an impossible research alert after every project is complete', () => {
    const actions = deriveUXActions({
      ...baseInput,
      research: baseInput.research.map((project) => ({ ...project, progress: project.duration, active: false, complete: true })),
    });
    expect(actions.some((action) => action.id === 'research-slot')).toBe(false);
  });

  it('only reports research capacity that can still be assigned', () => {
    const actions = deriveUXActions({
      ...baseInput,
      research: [
        { ...baseInput.research[0], id: 'complete', progress: 100, complete: true },
        { ...baseInput.research[0], id: 'available' },
      ],
    });
    expect(actions.find((action) => action.id === 'research-slot')).toMatchObject({
      title: '연구가 중단됨',
      reason: '활성 연구 0/2 · 배정 가능 과제 1개',
    });
  });

  it('marks a tracked order complete only after its action leaves the queue', () => {
    const actions = deriveUXActions(baseInput);
    expect(isTrackedActionResolved('idle-factories', actions)).toBe(false);
    expect(isTrackedActionResolved('idle-factories', actions.filter((action) => action.id !== 'idle-factories'))).toBe(true);
    expect(isTrackedActionResolved(null, actions)).toBe(false);
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
      ...militaryOnboarding,
      factories: baseInput.factories,
      production: baseInput.production,
      research: baseInput.research,
      selectedPolicies: baseInput.selectedPolicies,
      orders: baseInput.orders,
    });
    expect(steps).toHaveLength(6);
    expect(steps.every((step) => !step.complete)).toBe(true);
    expect(steps.map((step) => step.id)).toContain('military-action');
  });

  it('marks onboarding complete only when the corresponding systems are configured', () => {
    const steps = deriveOnboardingSteps({
      ...militaryOnboarding,
      week: 1,
      briefingRead: true,
      visitedTabs: ['command', 'organization', 'army', 'industry', 'research'],
      milestones: ['military-action'],
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

  it('changes onboarding duties and authority language by branch and rank', () => {
    const sharedState = {
      factories: baseInput.factories,
      production: baseInput.production,
      research: baseInput.research,
      selectedPolicies: baseInput.selectedPolicies,
      orders: baseInput.orders,
      week: 0,
      briefingRead: false,
      visitedTabs: [] as Array<'command'>,
      milestones: [] as string[],
    };
    const political = deriveOnboardingSteps({ ...sharedState, role: { branch: 'politics', tier: 2, scope: '내각 정책 결재' } });
    const intelligenceJunior = deriveOnboardingSteps({ ...sharedState, role: { branch: 'intelligence', tier: 5, scope: '현장 정보 수집' } });
    expect(political.some((step) => step.id === 'political-action')).toBe(true);
    expect(political.some((step) => step.id === 'military-action')).toBe(false);
    expect(intelligenceJunior.find((step) => step.id === 'intelligence-action')).toMatchObject({ tab: 'organization', title: '후보 조사 또는 관심 명단 검토' });
    expect(intelligenceJunior.find((step) => step.id === 'authority')?.title).toContain('TIER 5');
  });

  it('uses actual portfolio mandates rather than calling every tier-three politician a fiscal decision maker', () => {
    const role = { branch: 'politics' as const, tier: 3 as const, title: '정치 조직 담당', scope: '정무 조직 운영' };
    const steps = deriveOnboardingSteps({ ...baseInput, ...militaryOnboarding, role });
    expect(steps.find((step) => step.id === 'political-economy')).toMatchObject({ tab: 'economy', title: '재정 현황과 권한 상신 검토', complete: false });
    expect(steps.find((step) => step.id === 'political-economy')?.detail).toContain('상신 필요');
    const mandates = getRoleTabMandates(role);
    mandates.economy = { ...mandates.economy, mode: 'direct', label: '직접 지휘' };
    const delegated = deriveOnboardingSteps({ ...baseInput, ...militaryOnboarding, role, mandates });
    expect(delegated.find((step) => step.id === 'political-economy')?.title).toBe('재정 정책의 예상 결과 확인');
  });

  it('keeps junior military commands within their remit without mandating research-slot filling', () => {
    for (const research of [[], baseInput.research.map((project) => ({ ...project, complete: true }))]) {
      const steps = deriveOnboardingSteps({ ...baseInput, ...militaryOnboarding, role: { ...militaryOnboarding.role, tier: 5 }, research });
      expect(steps.find((step) => step.id === 'military-action')?.title).toBe('지휘 범위 안에서 첫 명령 검토');
      expect(steps.find((step) => step.id === 'military-support')).toMatchObject({ tab: 'organization', title: '지원 부서와 권한 확인' });
      expect(steps.some((step) => step.tab === 'research')).toBe(false);
      expect(steps.at(-1)?.id).toBe('advance');
    }
  });

  it('gives civilians a personal-career checklist and does not treat browsing as an actual action', () => {
    const civilian = createCivilianCareerState('scientist', civilianOrigins[0].id);
    const input = { ...baseInput, ...militaryOnboarding, startMode: 'civilian' as const, civilian, visitedTabs: ['command'] as const };
    const before = JSON.stringify(input);
    const steps = deriveOnboardingSteps(input);
    expect(steps).toHaveLength(4);
    expect(steps.every((step) => step.tab === 'command')).toBe(true);
    expect(steps.some((step) => step.id.startsWith('military-') || step.id === 'authority')).toBe(false);
    expect(steps.find((step) => step.id === 'civilian-review')?.complete).toBe(true);
    expect(steps.find((step) => step.id === 'civilian-action')?.complete).toBe(false);
    expect(steps.at(-1)?.complete).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
    expect(deriveOnboardingSteps({ ...input, milestones: ['civilian-action'] }).find((step) => step.id === 'civilian-action')?.complete).toBe(true);
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
    expect(review).toMatchObject({ currentStage: 'review', primaryDestination: 'briefing', primaryLabel: '주간 브리핑 확인', readyToAdvance: false });
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
    expect(briefing).toMatchObject({ currentStage: 'briefing', primaryDestination: 'briefing' });
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

  it('moves an action through detection, acknowledgement, work and verification', () => {
    const action = deriveUXActions(baseInput).find((item) => item.id === 'idle-factories')!;
    const detected = reconcileUXActionLifecycle([], [action], 2);
    expect(detected[0]).toMatchObject({ status: 'detected', firstDetectedWeek: 2 });

    const acknowledged = acknowledgeUXActions(detected, [action.id], 2);
    expect(acknowledged[0]).toMatchObject({ status: 'acknowledged', acknowledgedWeek: 2 });

    const working = startUXAction(acknowledged, action.id, 2);
    expect(working[0]).toMatchObject({ status: 'in-progress', actionWeek: 2 });

    const verifying = markUXActionsForVerification(working, 2);
    expect(verifying[0]).toMatchObject({ status: 'verifying', verificationWeek: 3 });
    expect(decorateUXActions([action], verifying)[0]).toMatchObject({ priority: 'info', lifecycleStatus: 'verifying', label: '검증 현황' });
  });

  it('resolves a verified action when its trigger disappears and reopens only after recurrence', () => {
    const action = deriveUXActions(baseInput).find((item) => item.id === 'idle-factories')!;
    const verifying = markUXActionsForVerification(startUXAction(reconcileUXActionLifecycle([], [action], 0), action.id, 0), 0);
    const resolved = reconcileUXActionLifecycle(verifying, [], 1);
    expect(resolved[0]).toMatchObject({ status: 'resolved', resolvedWeek: 1 });

    const recurred = reconcileUXActionLifecycle(resolved, [{ ...action, signalValue: (action.signalValue ?? 0) + 2 }], 3);
    expect(recurred[0]).toMatchObject({ status: 'detected', recurrenceCount: 1 });
  });

  it('keeps an unchanged warning in verification instead of making it urgent every week', () => {
    const action = deriveUXActions({ ...baseInput, economyOperatingBalance: -70 }).find((item) => item.id === 'economy-operating-deficit')!;
    const verifying = markUXActionsForVerification(startUXAction(reconcileUXActionLifecycle([], [action], 0), action.id, 0), 0);
    const nextWeek = reconcileUXActionLifecycle(verifying, [{ ...action }], 1);
    expect(nextWeek[0].status).toBe('verifying');
    expect(decorateUXActions([action], nextWeek)[0].priority).toBe('info');
  });

  it('normalizes saved lifecycle data without trusting malformed records', () => {
    expect(normalizeUXActionLifecycle([null, { actionId: 'broken' }])).toEqual([]);
  });
});
