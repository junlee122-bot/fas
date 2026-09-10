import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { NationManagementPanel, type NationManagementPanelProps } from './NationManagementPanel';
import { getNationDeskSections, type NationDeskView } from './NationDesk';
import { careerRoles, getNation } from './campaign';
import { createEconomyState } from './economy';
import { createNationManagementState } from './nationManagement';
import { deriveNationalSimulation } from './nationalSimulation';
import { createPoliticalCrisisState, getNationPoliticalProfile } from './politicalCrisis';
import { createPublicHealthState } from './publicHealth';
import { getGovernmentForm } from './dynasticPolitics';
import type { GameState, NationId } from './types';

const game: GameState = { week: 48, manpower: 1200, politicalPower: 82, fuel: 70, steel: 108, factories: 34, stability: 72, warSupport: 78, commandPoints: 48, treasury: 860, victoryScore: 66, airPower: 61, navalPower: 56, intelNetwork: 64, enemyPressure: 42 };
function setup(nationId: NationId = 'britain', initialView: NationDeskView = 'overview') {
  const nation = getNation(nationId);
  const role = careerRoles.find((item) => item.nationId === nationId && item.branch === 'politics' && item.tier === 1)!;
  const economy = createEconomyState(nationId);
  const state = createNationManagementState(nationId, game, economy, 3, 'victory');
  const onMutation = vi.fn();
  const callbacks = {
    onTransition: onMutation, onBudgetChange: onMutation, onTaxChange: onMutation, onSpendingChange: onMutation,
    onStrategyChange: onMutation, onNationAgendaChoice: onMutation, onGovernmentFormChange: onMutation,
    onGrantTitle: onMutation, onRevokeTitle: onMutation, onArrangeMarriage: onMutation, onSuccessionLawChange: onMutation,
    onConfigurePersonalLife: onMutation, onStartPersonalRelationship: onMutation, onFormalizeRelationship: onMutation,
    onFamilyLawChange: onMutation, onPersonalLifeAction: onMutation, onFamilyPlanChange: onMutation,
    onMediaLawChange: onMutation, onRequestMediaInterview: onMutation, onAnswerMediaInterview: onMutation,
    onAnswerExposure: onMutation, onOpenJusticeCase: onMutation, onJusticeDecision: onMutation,
    onActivateConstitution: onMutation, onConstitutionClauseSelect: onMutation, onConstitutionRatify: onMutation,
    onJudicialNominate: onMutation, onJudicialNominationDecision: onMutation, onSovereignPowerExercise: onMutation,
    onLeadershipPrinciplesChange: onMutation, onPowerBlocPromise: onMutation, onLegacyPathChange: onMutation,
    onRivalAction: onMutation, onPowerOpportunityChoice: onMutation, onStrategicSagaStart: onMutation,
    onStrategicSagaApproach: onMutation, onStrategicSagaReserve: onMutation, onSocialistTransitionStart: onMutation,
    onSocialistSettlement: onMutation, onSocialistTransitionMethod: onMutation, onElectionCampaignAction: onMutation,
    onLaunchReferendum: onMutation, onLaunchStrategicOperation: onMutation, onLaunchNationalPlan: onMutation,
    onAdvancePeriod: onMutation, onCancelPeriodAdvance: onMutation, onNavigate: onMutation,
    onEnactCivilization: onMutation, onNextWeek: onMutation,
  };
  const nationalSimulation = deriveNationalSimulation({
    nationId, phase: 'nation', game, economy, nationManagement: state,
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 10, artillery: 10, trucks: 10 },
    production: [], divisions: [], research: [], publicHealth: createPublicHealthState(game.week), selectedPolicies: [],
    politicalState: createPoliticalCrisisState(nationId), coupRisk: {
      score: 18, tier: 'stable', weeklyChance: 0, triggers: [], leadingFaction: getNationPoliticalProfile(nationId).factions[0],
      weakestRelation: { pair: 'civil-military', value: 48 }, crisisLabel: '헌정 비상전환',
    },
  });
  const props: NationManagementPanelProps = {
    ...callbacks, initialView, phase: 'nation', state, game, economy, nation, role, staff: [], territories: [], relations: [],
    nationalSimulation, completedDecisions: [], completedResearch: 3, publicHealthPressure: 0, worldlineTitle: '검증 세계선',
    formatMoney: (value) => '금액 ' + value.toFixed(1), periodAdvanceRemaining: 0,
    readiness: { score: 42, eligible: false, threshold: 52, stabilityFloor: 38, earliestWeek: 150,
      transitionLabel: '검증된 전환 조건', transitionDescription: '전후 계승 조건 검토', blockedReasons: ['준비도 10점 부족'],
      pillars: { security: 40, legitimacy: 50, finance: 45, industry: 60, diplomacy: 30, sovereignty: 45 } },
  };
  return { props, onMutation };
}

describe('national management conditional workspaces', () => {
  it.each(['war', 'nation'] as const)('lands on one readable desk rather than mounting every specialist board in %s', (phase) => {
    const { props, onMutation } = setup();
    const before = JSON.stringify({ state: props.state, game: props.game, economy: props.economy });
    const html = renderToStaticMarkup(<NationManagementPanel {...props} phase={phase} />);
    expect(html).toContain('data-nation-view="overview"');
    expect(html).toContain('이번 주 정책 결정');
    expect(html).toContain('예상 영향');
    expect(html).toContain('검증 시점');
    expect(html).toContain('이번 주 국정 상태');
    expect(html).toContain('첫 결산 전');
    if (phase === 'nation') { expect(html).toContain('운영 참고선'); expect(html).toContain('동시 달성만으로 승리·종결·보상이 확정되지 않'); }
    for (const className of ['national-agenda-board', 'dynastic-politics-board', 'personal-life-board', 'wartime-media-desk', 'media-relations-board', 'strategic-saga-board', 'socialist-world-board', 'nation-budget-editor']) expect(html).not.toContain(className);
    expect(onMutation).not.toHaveBeenCalled();
    expect(JSON.stringify({ state: props.state, game: props.game, economy: props.economy })).toBe(before);
  });

  it.each(getNationDeskSections('nation').flatMap((section) => section.items.map((item) => [item.id] as const)))('retains and safely renders the national %s workspace without side effects', (view) => {
    const { props, onMutation } = setup('britain', view);
    const html = renderToStaticMarkup(<NationManagementPanel {...props} />);
    expect(html).toContain('data-nation-view="' + view + '"');
    expect(html.includes('aria-label="이번 주 국정 요약"')).toBe(view === 'overview');
    expect(html.includes('class="nation-surface nation-budget-editor"')).toBe(view === 'budget');
    expect(html.includes('class="nation-surface dynastic-politics-board"')).toBe(view === 'dynasty');
    expect(html.includes('class="nation-surface personal-life-board"')).toBe(view === 'personal');
    expect(html.includes('class="nation-surface media-relations-board"')).toBe(view === 'media');
    expect(onMutation).not.toHaveBeenCalled();
  });

  it.each(getNationDeskSections('war').flatMap((section) => section.items.map((item) => [item.id] as const)))('retains the wartime %s workspace without creating a postwar government', (view) => {
    const { props, onMutation } = setup('korea', view);
    const html = renderToStaticMarkup(<NationManagementPanel {...props} phase="war" />);
    expect(html).toContain('data-nation-view="' + view + '"');
    expect(html).not.toContain('nation-budget-editor');
    expect(html.includes('nation-transition-hero')).toBe(view === 'transition');
    expect(html.includes('wartime-media-desk')).toBe(view === 'media');
    expect(onMutation).not.toHaveBeenCalled();
  });

  it.each(['britain', 'usa', 'korea'] as const)('preserves the actual %s government form and monarchy/republic controls', (nationId) => {
    const { props, onMutation } = setup(nationId, 'dynasty');
    const form = getGovernmentForm(props.state.dynasty.formId);
    const html = renderToStaticMarkup(<NationManagementPanel {...props} />);
    expect(html).toContain(form.name);
    expect(html).toContain('국가체제, 작위, 영지와 왕위계승');
    expect(html.includes('작위와 영지 서임')).toBe(form.monarchy);
    expect(html.includes('왕실 운영은 왕정 체제 전환 뒤 열립니다')).toBe(!form.monarchy);
    expect(onMutation).not.toHaveBeenCalled();
  });

  it('offers direct budget entry while keeping the historical callback contract and explicit delegation boundary', () => {
    const { props, onMutation } = setup('britain', 'budget');
    const html = renderToStaticMarkup(<NationManagementPanel {...props} budgetAuthority={false} />);
    expect(html).toContain('data-nation-view="budget"');
    expect(html).toContain('배분을 비교한 뒤 명시적으로 승인합니다');
    expect(html).toContain('예산 배분을 열람만 할 수 있습니다');
    expect(html.match(/aria-label="(?:조세 부담|공공지출) 5 (?:낮추기|높이기)" disabled=""/g)).toHaveLength(4);
    expect(html).toContain('조세·총지출의 ±5 버튼은 기존 정책 설정을 즉시 변경합니다');
    expect(onMutation).not.toHaveBeenCalled();
  });

  it('shows an honest empty receipt view and falls back from an unavailable phase-specific workspace', () => {
    const { props } = setup('britain', 'records');
    expect(renderToStaticMarkup(<NationManagementPanel {...props} />)).toContain('아직 확정된 국정 결산이 없습니다');
    expect(renderToStaticMarkup(<NationManagementPanel {...props} phase="war" initialView="budget" />)).toContain('data-nation-view="overview"');
  });
});
