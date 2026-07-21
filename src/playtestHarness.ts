import { careerRoles, createCampaignDivisions, createCampaignProduction, createCareerCommanders, createStaffRoster, nations } from './campaign';
import { initialResearch } from './data';
import { commanderSkills, createCommanderDevelopment, getAvailableSkillPoints, unlockCommanderSkill } from './development';
import { advanceEconomyWeek, calculateEconomyLedger, createEconomyState } from './economy';
import { advancePublicHealthWeek, createPublicHealthSeed, createPublicHealthState, recommendPublicHealthPolicy } from './publicHealth';
import type { CommanderDevelopment, GameState, Order, ProductionLine, ResearchProject } from './types';
import { deriveOnboardingSteps, deriveUXActions, deriveWeeklyCommandCycle } from './ux';

export type PlaytestProfile = 'guided' | 'rushed' | 'military' | 'state-builder' | 'completionist';

export interface PlaytestSessionResult {
  id: number;
  nationId: string;
  roleId: string;
  roleTier: number;
  roleBranch: string;
  profile: PlaytestProfile;
  weeksPlayed: number;
  actionPrompts: number;
  urgentPromptWeeks: number;
  recommendedPromptWeeks: number;
  reviewVisits: number;
  briefingVisits: number;
  prematureAdvanceAttempts: number;
  decisionInteractions: number;
  onboardingCompletedWeek: number | null;
  onboardingRemaining: string[];
  outbreakWeeks: number;
  outbreakCount: number;
  economicEventCount: number;
  deficitWeeks: number;
  inflationWarningWeeks: number;
  repeatedActionRuns: Record<string, number>;
  finalTreasury: number;
  finalDebt: number;
  finalInflation: number;
  finalStability: number;
}

export interface PlaytestAggregate {
  sessionCount: number;
  totalWeeks: number;
  nationCoverage: number;
  roleCoverage: number;
  tierCoverage: number;
  branchCoverage: number;
  profileCoverage: number;
  actionPrompts: number;
  actionPromptsPerWeek: number;
  reviewVisits: number;
  briefingVisits: number;
  navigationVisits: number;
  decisionInteractions: number;
  navigationToDecisionRatio: number;
  prematureAdvanceAttempts: number;
  urgentPromptWeeks: number;
  urgentWeekRate: number;
  recommendedPromptWeeks: number;
  recommendedWeekRate: number;
  onboardingCompletionRate: number;
  medianOnboardingWeek: number | null;
  outbreakSessions: number;
  deficitSessionRate: number;
  inflationWarningSessionRate: number;
  topRepeatedActions: Array<{ id: string; sessions: number; weeks: number }>;
  byProfile: Record<PlaytestProfile, {
    sessions: number;
    decisionInteractions: number;
    navigationVisits: number;
    onboardingCompletionRate: number;
    urgentPromptWeeks: number;
  }>;
}

export interface PlaytestRun {
  generatedAt: string;
  methodology: string;
  sessions: PlaytestSessionResult[];
  aggregate: PlaytestAggregate;
}

const profiles: PlaytestProfile[] = ['guided', 'rushed', 'military', 'state-builder', 'completionist'];

const baseGame: GameState = {
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

const clamp = (value: number, minimum = 0, maximum = Number.POSITIVE_INFINITY) => Math.min(maximum, Math.max(minimum, value));

function applyGameDelta(game: GameState, delta: Partial<Record<keyof GameState, number>>) {
  const next = { ...game };
  for (const [key, value] of Object.entries(delta) as Array<[keyof GameState, number]>) {
    next[key] = clamp(next[key] + value, 0) as never;
  }
  next.stability = clamp(next.stability, 0, 100);
  next.warSupport = clamp(next.warSupport, 0, 100);
  next.enemyPressure = clamp(next.enemyPressure, 0, 100);
  return next;
}

function completeFactories(production: ProductionLine[], factories: number) {
  const assigned = production.reduce((sum, line) => sum + line.assigned, 0);
  const idle = Math.max(0, factories - assigned);
  if (idle === 0 || production.length === 0) return production;
  return production.map((line, index) => index === 0 ? { ...line, assigned: line.assigned + idle } : line);
}

function fillResearchSlots(research: ResearchProject[]) {
  let active = research.filter((project) => project.active && !project.complete).length;
  return research.map((project) => {
    if (active >= 2 || project.active || project.complete) return project;
    active += 1;
    return { ...project, active: true };
  });
}

function progressResearch(research: ResearchProject[]) {
  return research.map((project) => {
    if (!project.active || project.complete) return project;
    const progress = project.progress + 13;
    if (progress < project.duration) return { ...project, progress };
    return { ...project, progress: project.duration, active: false, complete: true };
  });
}

function unlockAvailableSkills(records: CommanderDevelopment[]) {
  return records.map((record) => {
    let next = record;
    for (const skill of commanderSkills) {
      if (getAvailableSkillPoints(next) <= 0) break;
      next = unlockCommanderSkill(next, skill.id);
    }
    return next;
  });
}

function shouldResolve(profile: PlaytestProfile, actionId: string) {
  if (profile === 'rushed') return false;
  if (profile === 'completionist' || profile === 'guided') return true;
  if (profile === 'military') return ['commander-skill', 'research-slot', 'idle-factories', 'idle-formations', 'recovering-formations'].includes(actionId);
  return ['public-health-crisis', 'public-health-readiness', 'economy-operating-deficit', 'economy-inflation', 'research-slot', 'idle-factories', 'national-policy'].includes(actionId);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function runPlaytestSession(id: number, weeksPlayed = 104): PlaytestSessionResult {
  const nation = nations[id % nations.length];
  const nationRoles = careerRoles.filter((role) => role.nationId === nation.id);
  const role = nationRoles[Math.floor(id / nations.length) % nationRoles.length];
  const profile = profiles[id % profiles.length];
  let game: GameState = { ...baseGame, ...nation.modifiers };
  let production = createCampaignProduction(nation);
  let research = initialResearch.map((project) => ({ ...project }));
  const divisions = createCampaignDivisions(nation);
  const commanders = createCareerCommanders(nation, role);
  let commanderDevelopment = createCommanderDevelopment(commanders);
  const staff = createStaffRoster(nation.id, role.id);
  const staffWeeklyCost = staff.reduce((sum, member) => sum + member.weeklyCost, 0);
  const economyAdvisor = staff.find((member) => member.department === 'economy');
  const economyAdvisorBonus = economyAdvisor?.delegated ? economyAdvisor.ability / 13 : 0;
  let economy = createEconomyState(nation.id);
  let publicHealth = createPublicHealthState(createPublicHealthSeed(nation.id, role.id));
  let selectedPolicies: string[] = [];
  let orders: Order[] = [];
  let decisionInteractions = 0;
  let actionPrompts = 0;
  let urgentPromptWeeks = 0;
  let recommendedPromptWeeks = 0;
  let reviewVisits = 0;
  let briefingVisits = 0;
  let prematureAdvanceAttempts = 0;
  let onboardingCompletedWeek: number | null = null;
  let outbreakWeeks = 0;
  let outbreakCount = 0;
  let economicEventCount = 0;
  let deficitWeeks = 0;
  let inflationWarningWeeks = 0;
  let previousOutbreakId: string | null = null;
  const currentActionRun: Record<string, number> = {};
  const longestActionRun: Record<string, number> = {};

  for (let week = 0; week < weeksPlayed; week += 1) {
    game.week = week;
    const ledger = calculateEconomyLedger(economy, { week, nationId: nation.id, game, staffWeeklyCost, economyAdvisorBonus });
    const economyOperatingBalance = ledger.operatingRevenue - ledger.totalExpenses;
    if (economyOperatingBalance < -20) deficitWeeks += 1;
    if (economy.inflation >= 10) inflationWarningWeeks += 1;

    let actions = deriveUXActions({
      factories: game.factories,
      production,
      research,
      selectedPolicies,
      divisions,
      orders,
      commanderDevelopment,
      publicHealth,
      economyOperatingBalance,
      economyInflation: economy.inflation,
      economyDebt: economy.debt,
    });
    actionPrompts += actions.length;
    if (actions.some((action) => action.priority === 'urgent')) urgentPromptWeeks += 1;
    if (actions.some((action) => action.priority === 'recommended')) recommendedPromptWeeks += 1;

    const activeActionIds = new Set(actions.map((action) => action.id));
    for (const actionId of new Set([...Object.keys(currentActionRun), ...activeActionIds])) {
      currentActionRun[actionId] = activeActionIds.has(actionId) ? (currentActionRun[actionId] ?? 0) + 1 : 0;
      longestActionRun[actionId] = Math.max(longestActionRun[actionId] ?? 0, currentActionRun[actionId]);
    }

    if (week > 0) {
      const cycle = deriveWeeklyCommandCycle({
        week,
        hasCurrentWeekResults: true,
        resultsReviewed: false,
        weeklyUnread: true,
        urgentCount: actions.filter((action) => action.priority === 'urgent').length,
        recommendedCount: actions.filter((action) => action.priority === 'recommended').length,
        activeOrders: orders.length,
        activeResearch: research.filter((project) => project.active && !project.complete).length,
      });
      if (cycle.currentStage === 'review') reviewVisits += 1;
      const afterReview = deriveWeeklyCommandCycle({
        week,
        hasCurrentWeekResults: true,
        resultsReviewed: true,
        weeklyUnread: true,
        urgentCount: actions.filter((action) => action.priority === 'urgent').length,
        recommendedCount: actions.filter((action) => action.priority === 'recommended').length,
        activeOrders: orders.length,
        activeResearch: research.filter((project) => project.active && !project.complete).length,
      });
      if (afterReview.currentStage === 'briefing') briefingVisits += 1;
      if (profile === 'rushed') prematureAdvanceAttempts += 1;
    }

    const allowed = actions.filter((action) => shouldResolve(profile, action.id));
    const attempts = profile === 'guided' ? allowed.slice(0, 1) : allowed;
    for (const action of attempts) {
      decisionInteractions += 1;
      if (action.id === 'idle-factories') production = completeFactories(production, game.factories);
      if (action.id === 'research-slot') research = fillResearchSlots(research);
      if (action.id === 'national-policy' && selectedPolicies.length < 4) selectedPolicies = [...selectedPolicies, `policy-${selectedPolicies.length + 1}`];
      if (action.id === 'idle-formations' && orders.length === 0) {
        orders = [{ divisionId: divisions[0].id, fromId: divisions[0].territoryId, targetId: nation.strategicTargets[0] ?? divisions[0].territoryId, startedWeek: week, stance: 'balanced' }];
      }
      if (action.id === 'commander-skill') commanderDevelopment = unlockAvailableSkills(commanderDevelopment);
      if (action.id === 'economy-operating-deficit') economy = { ...economy, taxPolicy: 'total-war', bondProgram: 'institutional' };
      if (action.id === 'economy-inflation') economy = { ...economy, priceControl: 'comprehensive', bondProgram: 'none' };
      if (action.id === 'public-health-crisis' || action.id === 'public-health-readiness') {
        economy = { ...economy };
        publicHealth = { ...publicHealth, policyId: recommendPublicHealthPolicy(publicHealth, game).policyId };
      }
    }

    const onboarding = deriveOnboardingSteps({ factories: game.factories, production, research, selectedPolicies, orders });
    if (onboardingCompletedWeek === null && onboarding.every((step) => step.complete)) onboardingCompletedWeek = week + 1;

    const economyResult = advanceEconomyWeek(economy, { week, nationId: nation.id, game, staffWeeklyCost, economyAdvisorBonus });
    economy = economyResult.state;
    game = applyGameDelta(game, economyResult.gameDelta);
    if (economyResult.event) economicEventCount += 1;

    const averageSupply = divisions.reduce((sum, division) => sum + division.supply, 0) / Math.max(1, divisions.length);
    const healthResult = advancePublicHealthWeek(publicHealth, {
      week,
      nationId: nation.id,
      theater: nation.defaultTheater,
      enemyPressure: game.enemyPressure,
      stability: game.stability,
      averageSupply,
      scienceBonus: economyAdvisor?.ability ? economyAdvisor.ability / 25 : 0,
    });
    publicHealth = healthResult.state;
    game = applyGameDelta(game, healthResult.gameDelta);
    if (publicHealth.activeOutbreak) outbreakWeeks += 1;
    const outbreakId = publicHealth.activeOutbreak?.id ?? null;
    if (outbreakId && outbreakId !== previousOutbreakId) outbreakCount += 1;
    previousOutbreakId = outbreakId;

    research = progressResearch(research);
    commanderDevelopment = commanderDevelopment.map((record) => ({ ...record, xp: Math.min(155, record.xp + (orders.length > 0 ? 7 : 3)) }));
    orders = [];
    game = applyGameDelta(game, {
      manpower: 18,
      politicalPower: 3,
      fuel: 8 - game.factories * 0.18,
      steel: 9,
      commandPoints: 6,
      enemyPressure: week > 0 && week % 4 === 0 ? 2 : 0,
      stability: week > 0 && week % 5 === 0 ? -1 : 0,
    });
  }

  const finalOnboarding = deriveOnboardingSteps({ factories: game.factories, production, research, selectedPolicies, orders });
  return {
    id,
    nationId: nation.id,
    roleId: role.id,
    roleTier: role.tier,
    roleBranch: role.branch,
    profile,
    weeksPlayed,
    actionPrompts,
    urgentPromptWeeks,
    recommendedPromptWeeks,
    reviewVisits,
    briefingVisits,
    prematureAdvanceAttempts,
    decisionInteractions,
    onboardingCompletedWeek,
    onboardingRemaining: finalOnboarding.filter((step) => !step.complete).map((step) => step.id),
    outbreakWeeks,
    outbreakCount,
    economicEventCount,
    deficitWeeks,
    inflationWarningWeeks,
    repeatedActionRuns: longestActionRun,
    finalTreasury: Number(game.treasury.toFixed(1)),
    finalDebt: Number(economy.debt.toFixed(1)),
    finalInflation: Number(economy.inflation.toFixed(1)),
    finalStability: Number(game.stability.toFixed(1)),
  };
}

export function runPlaytestMatrix(sessionCount = 225, weeksPlayed = 104): PlaytestRun {
  const sessions = Array.from({ length: sessionCount }, (_, index) => runPlaytestSession(index, weeksPlayed));
  const totalWeeks = sessions.reduce((sum, session) => sum + session.weeksPlayed, 0);
  const actionPrompts = sessions.reduce((sum, session) => sum + session.actionPrompts, 0);
  const navigationVisits = sessions.reduce((sum, session) => sum + session.reviewVisits + session.briefingVisits, 0);
  const decisionInteractions = sessions.reduce((sum, session) => sum + session.decisionInteractions, 0);
  const urgentPromptWeeks = sessions.reduce((sum, session) => sum + session.urgentPromptWeeks, 0);
  const recommendedPromptWeeks = sessions.reduce((sum, session) => sum + session.recommendedPromptWeeks, 0);
  const repeated = new Map<string, { sessions: number; weeks: number }>();
  for (const session of sessions) {
    for (const [id, weeks] of Object.entries(session.repeatedActionRuns)) {
      if (weeks < 2) continue;
      const aggregate = repeated.get(id) ?? { sessions: 0, weeks: 0 };
      aggregate.sessions += 1;
      aggregate.weeks += weeks;
      repeated.set(id, aggregate);
    }
  }
  const completedOnboarding = sessions.filter((session) => session.onboardingCompletedWeek !== null);
  const byProfile = Object.fromEntries(profiles.map((profile) => {
    const matches = sessions.filter((session) => session.profile === profile);
    const completed = matches.filter((session) => session.onboardingCompletedWeek !== null);
    return [profile, {
      sessions: matches.length,
      decisionInteractions: matches.reduce((sum, session) => sum + session.decisionInteractions, 0),
      navigationVisits: matches.reduce((sum, session) => sum + session.reviewVisits + session.briefingVisits, 0),
      onboardingCompletionRate: Number((completed.length / Math.max(1, matches.length) * 100).toFixed(1)),
      urgentPromptWeeks: matches.reduce((sum, session) => sum + session.urgentPromptWeeks, 0),
    }];
  })) as PlaytestAggregate['byProfile'];
  return {
    generatedAt: new Date().toISOString(),
    methodology: `${sessionCount} deterministic sessions × ${weeksPlayed} weeks; nations, roles and five behavior profiles are rotated through the production game engines.`,
    sessions,
    aggregate: {
      sessionCount,
      totalWeeks,
      nationCoverage: new Set(sessions.map((session) => session.nationId)).size,
      roleCoverage: new Set(sessions.map((session) => session.roleId)).size,
      tierCoverage: new Set(sessions.map((session) => session.roleTier)).size,
      branchCoverage: new Set(sessions.map((session) => session.roleBranch)).size,
      profileCoverage: new Set(sessions.map((session) => session.profile)).size,
      actionPrompts,
      actionPromptsPerWeek: Number((actionPrompts / Math.max(1, totalWeeks)).toFixed(2)),
      reviewVisits: sessions.reduce((sum, session) => sum + session.reviewVisits, 0),
      briefingVisits: sessions.reduce((sum, session) => sum + session.briefingVisits, 0),
      navigationVisits,
      decisionInteractions,
      navigationToDecisionRatio: Number((navigationVisits / Math.max(1, decisionInteractions)).toFixed(2)),
      prematureAdvanceAttempts: sessions.reduce((sum, session) => sum + session.prematureAdvanceAttempts, 0),
      urgentPromptWeeks,
      urgentWeekRate: Number((urgentPromptWeeks / Math.max(1, totalWeeks) * 100).toFixed(1)),
      recommendedPromptWeeks,
      recommendedWeekRate: Number((recommendedPromptWeeks / Math.max(1, totalWeeks) * 100).toFixed(1)),
      onboardingCompletionRate: Number((completedOnboarding.length / Math.max(1, sessions.length) * 100).toFixed(1)),
      medianOnboardingWeek: median(completedOnboarding.map((session) => session.onboardingCompletedWeek as number)),
      outbreakSessions: sessions.filter((session) => session.outbreakCount > 0).length,
      deficitSessionRate: Number((sessions.filter((session) => session.deficitWeeks > 0).length / Math.max(1, sessions.length) * 100).toFixed(1)),
      inflationWarningSessionRate: Number((sessions.filter((session) => session.inflationWarningWeeks > 0).length / Math.max(1, sessions.length) * 100).toFixed(1)),
      topRepeatedActions: [...repeated.entries()]
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.weeks - a.weeks)
        .slice(0, 10),
      byProfile,
    },
  };
}
