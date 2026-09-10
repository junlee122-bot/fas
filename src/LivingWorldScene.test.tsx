import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LivingWorldScene, type LivingWorldSceneProps } from './LivingWorldScene';
import { createEconomyState } from './economy';
import { createNationManagementState } from './nationManagement';
import { deriveNationalSimulation, type NationalSimulationInput } from './nationalSimulation';
import { createPoliticalCrisisState, getNationPoliticalProfile } from './politicalCrisis';
import { createPublicHealthState } from './publicHealth';
import type { RoleAccessMode, RoleTabMandate } from './roleMandate';
import type { GameState } from './types';

function createInput(): NationalSimulationInput {
  const game: GameState = {
    week: 2, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112,
    factories: 30, stability: 78, warSupport: 84, commandPoints: 42,
    treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52,
    intelNetwork: 64, enemyPressure: 68,
  };
  const economy = createEconomyState('britain');
  return {
    nationId: 'britain', phase: 'war', game, economy,
    stockpile: { infantryEquipment: 48200, tanks: 1284, aircraft: 2106, convoys: 624, artillery: 3840, trucks: 12600 },
    production: [{ id: 'rifle', name: '소총', category: '보병 장비', assigned: 8, efficiency: 84, output: 1200, icon: 'factory' }],
    divisions: [], research: [], selectedPolicies: [],
    publicHealth: createPublicHealthState(42),
    politicalState: createPoliticalCrisisState('britain'),
    coupRisk: {
      score: 18, tier: 'stable', weeklyChance: 0, triggers: [],
      leadingFaction: getNationPoliticalProfile('britain').factions[0],
      weakestRelation: { pair: 'civil-military', value: 48 }, crisisLabel: '헌정 비상전환',
    },
    nationManagement: createNationManagementState('britain', game, economy, 0, 'negotiated'),
  };
}

function render(input = createInput(), mode: RoleAccessMode = 'direct', records: Pick<LivingWorldSceneProps, 'lastOrder' | 'lastSettlement' | 'postwarInput' | 'routedEquipmentKey'> = {}) {
  const mandate: RoleTabMandate = { tab: 'industry', mode, label: mode, reason: '시험 보직의 실제 권한 사유', authorityRoute: '담당 기관 결재' };
  const onReallocate = vi.fn();
  const html = renderToStaticMarkup(<LivingWorldScene
    nationName="영국" input={input} snapshot={deriveNationalSimulation(input)}
    industryMandate={mandate} staffIssues={2} onNavigate={vi.fn()}
    onReallocate={onReallocate} onOpenBriefing={vi.fn()}
    {...records}
  />);
  return { html, onReallocate };
}

describe('living world scene honesty and authority', () => {
  it('shows a four-place national schematic, not a literal city or building count', () => {
    const { html } = render();
    expect(html).toContain('국가 집계 기반 모식도');
    expect(html).toContain('실제 도시 위치나 개별 건물 수를 나타내지 않습니다');
    expect(html.match(/aria-controls="living-world-detail"/g)).toHaveLength(4);
    expect(html).toContain('군수 8 · 민수 여력 22');
    expect(html).toContain('대화할 현안 2건');
    expect(html).toContain('제3주');
  });

  it('previews one real withdrawal without executing it or claiming settlement', () => {
    const input = createInput();
    const original = structuredClone(input);
    const { html, onReallocate } = render(input);
    expect(html).toContain('결재 전 예상 · 아직 적용 안 됨');
    expect(html).toContain('소비재 공급 54.2 → 55 / 100');
    expect(html).toContain('소총 기본 생산력 1613 → 1344 / 주');
    expect(html).toContain('첫 검증은 다음 주');
    expect(html).not.toContain('배치는 적용됐고');
    expect(onReallocate).not.toHaveBeenCalled();
    expect(input).toEqual(original);
  });

  it.each(['request', 'report', 'locked'] as const)('does not expose direct production orders for %s authority', (mode) => {
    const { html, onReallocate } = render(createInput(), mode);
    expect(html).toContain('직접 결재 불가');
    expect(html).toContain('시험 보직의 실제 권한 사유');
    expect(html).not.toContain('공장 전환 결재');
    expect(html).not.toContain('조정할 생산 라인');
    expect(html).not.toContain('결재 전 예상');
    expect(html).toContain(mode === 'request' ? '생산 조정 상신하기' : '권한과 보고 확인');
    expect(onReallocate).not.toHaveBeenCalled();
  });

  it('disables confirmation for zero factories and an empty production line', () => {
    const input = createInput();
    input.game.factories = 0;
    input.production[0].assigned = 0;
    const { html } = render(input);
    expect(html).toContain('군수 0 · 민수 여력 0');
    expect(html).toMatch(/class="living-world-primary" disabled=""/);
    expect(html).not.toContain('결재 전 예상');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });

  it('rejects confirmation for invalid capacity or missing production lines', () => {
    const input = createInput();
    input.game.factories = Number.NaN;
    expect(render(input).html).toMatch(/class="living-world-primary" disabled=""/);
    input.game.factories = 30;
    input.production = [];
    const { html } = render(input);
    expect(html).toMatch(/class="living-world-primary" disabled=""/);
    expect(html).not.toContain('결재 전 예상');
  });

  it('does not invent a nation delivery forecast when no budget context was provided', () => {
    const input = createInput();
    input.phase = 'nation';
    const { html } = render(input);
    expect(html).toContain('군수 배치 8 → 7');
    expect(html).toContain('납품 전망 확인 필요');
    expect(html).toContain('국정 납품은 승인된 방침·예산·연료·강철을 반영합니다');
    expect(html).not.toContain('기본 생산력');
    expect(html).not.toContain('/ 주');
  });

  it('shows constrained postwar delivery instead of nominal factory output', () => {
    const input = createInput();
    input.phase = 'nation';
    const postwarInput = { nationId: input.nationId, week: input.game.week + 1, production: input.production, stockpile: input.stockpile, game: { ...input.game, fuel: 0 }, spendingLevel: 50, securityBudgetPercent: 20 };
    const { html, onReallocate } = render(input, 'direct', { postwarInput });
    expect(html).toContain('소총 다음 주 입고 0 → 0');
    expect(html).not.toContain('기본 생산력');
    expect(html).toContain('국정 군수 납품 지휘실');
    expect(onReallocate).not.toHaveBeenCalled();
  });

  it('shows staged production separately from national receipt only for the selected pilot item', () => {
    const input = createInput(); input.phase = 'nation';
    const postwarInput = { nationId: input.nationId, week: input.game.week + 1, production: input.production, stockpile: input.stockpile, game: input.game, spendingLevel: 50, securityBudgetPercent: 20 };
    const { html, onReallocate } = render(input, 'direct', { postwarInput, routedEquipmentKey: 'infantryEquipment' });
    expect(html).toContain('소총 다음 주 집하창고 생산 완료');
    expect(html).toContain('집하창고 생산 완료 → 수송 후 가용');
    expect(html).toContain('창고·수송 중 물량은 국가 가용 비축이 아니며 실제 도착 후 편입');
    expect(html).not.toContain('소총 다음 주 입고');
    expect(onReallocate).not.toHaveBeenCalled();
    const unrelated = render(input, 'direct', { postwarInput, routedEquipmentKey: 'tanks' }).html;
    expect(unrelated).toContain('소총 다음 주 입고');
    expect(unrelated).toContain('새 납품은 국가 직접 입고');
    expect(unrelated).not.toContain('집하창고 생산 완료 → 수송 후 가용');
  });

  it('requires a persisted approval record and a later settlement before describing verification', () => {
    const input = createInput();
    const lastOrder = { id: 1, week: 2, title: '생산 역량 전환 — 소총', detail: '민수로 한 개 전환', tone: 'neutral' as const };
    const sameWeekSettlement = { id: 2, week: 2, title: '민생 공급 결산', detail: '이번 주 시작 때 확정된 기여분', tone: 'neutral' as const };
    const approved = render(input, 'direct', { lastOrder, lastSettlement: sameWeekSettlement }).html;
    expect(approved).toContain('최근 승인 기록: 생산 역량 전환 — 소총');
    expect(approved).toContain('제4주 결산에서 사회 반응을 검증합니다');
    expect(approved).not.toContain('이후 주간 결산이 있습니다');

    input.game.week = 3;
    const savedRecords = JSON.parse(JSON.stringify({ lastOrder, lastSettlement: { ...sameWeekSettlement, week: 3 } }));
    const verified = render(input, 'direct', savedRecords).html;
    expect(verified).toContain('이후 주간 결산이 있습니다');
    expect(verified).toContain('제4주 확정 기록');
    expect(verified).not.toContain('배치는 적용됐고');
    expect(render(input).html).not.toContain('최근 승인 기록');
  });
});
