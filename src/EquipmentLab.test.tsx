import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EquipmentLab, confirmEquipmentLabOrder, reviewEquipmentLabOrder, type EquipmentLabOrder, type EquipmentLabProps, type EquipmentLabView } from './EquipmentLab';
import { calculatePrototype, canResearchEquipment, canUseModule, createEquipmentDevelopment, equipmentModules, equipmentNodes, getEquipmentNode } from './equipment';
import { createArmsPortfolioState, getEquipmentProcurementQuote } from './strategicArmsDiplomacy';
import { createCampaignDivisions, createCampaignProduction, nations } from './campaign';
import { getCampaignYearForWeek } from './campaignCalendar';
import type { GameState } from './types';

const game: GameState = { week: 100, manpower: 1200, politicalPower: 80, fuel: 70, steel: 100, factories: 30, stability: 75, warSupport: 62, commandPoints: 50, treasury: 5000, victoryScore: 75, airPower: 60, navalPower: 58, intelNetwork: 55, enemyPressure: 20 };

function fixture(overrides: Partial<EquipmentLabProps> = {}): EquipmentLabProps {
  const nation = nations.find((item) => item.id === 'britain')!;
  return {
    nationId: 'britain', game: { ...game }, development: createEquipmentDevelopment('britain'),
    production: createCampaignProduction(nation), divisions: createCampaignDivisions(nation),
    weeklyResearchGain: 14, completedDecisions: [], armsPortfolio: createArmsPortfolioState('britain'),
    formatMoney: (value) => `국가화폐 ${value}`,
    onStartResearch: vi.fn(), onCreatePrototype: vi.fn(), onFieldEquipment: vi.fn(),
    onAssignDivisionEquipment: vi.fn(), onSetMaintenanceDoctrine: vi.fn(), onSetReplacementPolicy: vi.fn(),
    onSetReadinessPriority: vi.fn(), onStartWeaponWorkOrder: vi.fn(),
    ...overrides,
  };
}

function researchOrder(props: EquipmentLabProps): EquipmentLabOrder {
  return { kind: 'research', nodeId: equipmentNodes.find((node) => node.category === 'armor' && canResearchEquipment(node, props.development, props.nationId))!.id };
}

function prototypeOrder(props: EquipmentLabProps): Extract<EquipmentLabOrder, { kind: 'prototype' }> {
  return { kind: 'prototype', baseNodeId: props.development.fieldedByCategory.armor!, moduleIds: ['platform', 'powerplant'].map((slot) => equipmentModules.find((module) => module.slot === slot && canUseModule(module, props.development))!.id), name: '검토용 시제', route: 'indigenous' };
}

function adoptionFixture() {
  const props = fixture();
  const draft = prototypeOrder(props);
  const prototype = calculatePrototype(draft.baseNodeId, draft.moduleIds, draft.name, props.game.week)!;
  props.development = { ...props.development, prototypes: [prototype] };
  const order: EquipmentLabOrder = { kind: 'adopt', equipmentId: prototype.id, route: 'indigenous' };
  return { props, order, prototype };
}

describe('equipment lab focused workspaces', () => {
  it('opens with active work, actual blockers and next actions rather than every tool at once', () => {
    const props = fixture({ game: { ...game, politicalPower: 0 } });
    const html = renderToStaticMarkup(<EquipmentLab {...props} />);
    expect(html).toContain('현재 장비 연구와 다음 행동');
    expect(html).toContain('개발 슬롯이 비어 있습니다');
    expect(html).toContain('현재 재정 또는 정치력이 부족합니다');
    expect(html).toContain('장비 연구 대상 검토');
    expect(html).toContain('제식·배치·정비 확인');
    expect(html).not.toContain('class="equipment-node ');
    expect(html).not.toContain('class="prototype-workshop"');
    expect(html).not.toContain('class="weapon-readiness-board"');
    expect(html).not.toContain('class="procurement-route-grid"');
  });

  it.each([0, -1, Number.NaN])('shows a hold instead of an invented completion date at research gain %s', (weeklyResearchGain) => {
    const props = fixture({ weeklyResearchGain });
    const order = researchOrder(props);
    if (order.kind !== 'research') throw new Error('research fixture');
    props.development = { ...props.development, activeProjectId: order.nodeId, progress: 12 };
    const html = renderToStaticMarkup(<EquipmentLab {...props} />);
    expect(html).toContain(getEquipmentNode(order.nodeId)!.name);
    expect(html).toContain('진행 보류 · 기간 미정');
    expect(html).not.toContain('Infinity');
    expect(html).not.toContain('NaN');
  });

  it('shows exactly one research node while keeping all category choices and historical references', () => {
    const props = fixture({ initialView: 'research' });
    const html = renderToStaticMarkup(<EquipmentLab {...props} />);
    expect(html.match(/class="equipment-node /g)).toHaveLength(1);
    expect(html).toContain('검토할 장비 계보');
    expect(html).toContain('value="strategic"');
    expect(html).toContain('선행 필요');
    expect(html).toContain('실제·파생·가상 데이터가 명확히 분리');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('프로그램 참고 전력');
    expect(html).toContain('선택만으로 적용되지 않음');
    expect(html).toContain('경로 비교용 기준 견적');
    expect(html).not.toContain('class="prototype-workshop"');
    expect(html).not.toContain('class="weapon-readiness-board"');
  });

  it('keeps module creation and only one selected saved prototype in its own workspace', () => {
    const { props, prototype } = adoptionFixture();
    props.development = { ...props.development, prototypes: [prototype, { ...prototype, id: 'second-prototype', name: '두 번째 시제' }] };
    const html = renderToStaticMarkup(<EquipmentLab {...props} initialView="prototype" />);
    expect(html).toContain('class="prototype-workshop"');
    expect(html).toContain('검토할 보유 시제품');
    expect(html).toContain('두 번째 시제');
    expect(html).toContain('시제 제작 검토');
    expect(html).toContain('채택 검토 6PP');
    expect(html.match(/<article/g)).toHaveLength(1);
    expect(html).not.toContain('class="equipment-node ');
    expect(html).not.toContain('class="weapon-readiness-board"');
  });

  it('supports controlled external entry to deployment and retains all readiness actions', () => {
    const props = fixture({ initialView: 'overview', view: 'deployment', onViewChange: vi.fn() });
    const html = renderToStaticMarkup(<EquipmentLab {...props} />);
    expect(html).toContain('class="weapon-readiness-board"');
    expect(html).toContain('정비·시험 작업지시');
    expect(html).toContain('정비 교리');
    expect(html).toContain('보충·세대교체 원칙');
    expect(html).toContain('제식 후보 검토');
    expect(html).toContain('제식 변경을 자동으로 승인하지 않습니다');
    expect(html).toContain('검토할 편제');
    const assignment = html.split('<div class="division-equipment-list">')[1].split('</div>')[0];
    expect(assignment.match(/<label/g)).toHaveLength(1);
    expect(html).not.toContain('장비 개발 슬롯이 비어 있습니다');
    expect(props.onViewChange).not.toHaveBeenCalled();
  });

  it.each<EquipmentLabView>(['overview', 'research', 'prototype', 'deployment'])('does not send commands or mutate inputs while rendering %s', (initialView) => {
    const props = fixture({ initialView });
    const before = JSON.stringify(props);
    renderToStaticMarkup(<EquipmentLab {...props} />);
    expect(JSON.stringify(props)).toBe(before);
    for (const [key, value] of Object.entries(props)) if (key.startsWith('on') && typeof value === 'function') expect(value).not.toHaveBeenCalled();
  });
});

describe('equipment lab unexecuted order review', () => {
  it('previews research without subtracting political power or unlocking the node', () => {
    const props = fixture();
    const before = JSON.stringify(props);
    const { review, reason } = reviewEquipmentLabOrder(props, researchOrder(props));
    expect(review).toMatchObject({ politicalCost: 5, treasuryCost: 0, treasuryAfter: game.treasury });
    expect(reason).toContain('작업을 승인하세요');
    expect(review?.detail).toContain('착수는 완료·해금이 아닙니다');
    expect(JSON.stringify(props)).toBe(before);
    expect(props.onStartResearch).not.toHaveBeenCalled();
  });

  it('rejects locked research, occupied slots and insufficient political power', () => {
    const props = fixture();
    const order = researchOrder(props);
    const locked = equipmentNodes.find((node) => node.category === 'armor' && node.era === 'cold-war')!;
    expect(reviewEquipmentLabOrder(props, { kind: 'research', nodeId: locked.id }).review).toBeNull();
    expect(reviewEquipmentLabOrder({ ...props, development: { ...props.development, activeProjectId: 'existing' } }, order).reason).toContain('이미 사용 중');
    expect(reviewEquipmentLabOrder({ ...props, game: { ...game, politicalPower: 4 } }, order).review).toBeNull();
  });

  it('uses the same calendar-sensitive procurement quote as prototype execution', () => {
    const props = fixture();
    const order = prototypeOrder(props);
    const before = JSON.stringify(props);
    const prototype = calculatePrototype(order.baseNodeId, order.moduleIds, order.name, props.game.week)!;
    const quote = getEquipmentProcurementQuote(props.nationId, getCampaignYearForWeek(props.game.week), prototype.category, Math.max(45, Math.round(prototype.industrialCost * 1.6)), props.completedDecisions, order.route, props.armsPortfolio);
    const { review } = reviewEquipmentLabOrder(props, order);
    expect(review).toMatchObject({ politicalCost: 8, treasuryCost: quote.treasuryCost, treasuryAfter: game.treasury - quote.treasuryCost });
    expect(review?.warnings.join(' ')).toContain('전망을 실제 도착·작업 완료로 판정하지 않습니다');
    expect(JSON.stringify(props)).toBe(before);
    expect(props.development.prototypes).toHaveLength(0);
  });

  it('preserves the two-distinct-slots rule, module unlocks, prototype cap and affordability', () => {
    const props = fixture();
    const order = prototypeOrder(props);
    expect(reviewEquipmentLabOrder(props, { ...order, moduleIds: [order.moduleIds[0]] }).review).toBeNull();
    expect(reviewEquipmentLabOrder(props, { ...order, moduleIds: [order.moduleIds[0], order.moduleIds[0]] }).review).toBeNull();
    const lockedModule = equipmentModules.find((module) => !canUseModule(module, props.development))!;
    expect(reviewEquipmentLabOrder(props, { ...order, moduleIds: [order.moduleIds[0], lockedModule.id] }).review).toBeNull();
    const prototype = calculatePrototype(order.baseNodeId, order.moduleIds, order.name, props.game.week)!;
    expect(reviewEquipmentLabOrder({ ...props, development: { ...props.development, prototypes: Array(8).fill(prototype) } }, order).reason).toContain('한도 8개');
    expect(reviewEquipmentLabOrder({ ...props, game: { ...game, treasury: 0 } }, order).review).toBeNull();
  });

  it('quotes adoption without a stockpile grant or production write and rejects an already fielded model', () => {
    const { props, order, prototype } = adoptionFixture();
    const before = JSON.stringify(props);
    const { review } = reviewEquipmentLabOrder(props, order);
    const quote = getEquipmentProcurementQuote(props.nationId, getCampaignYearForWeek(game.week), prototype.category, Math.max(30, Math.round(prototype.industrialCost * 1.2)), [], 'indigenous', props.armsPortfolio);
    expect(review).toMatchObject({ politicalCost: 6, treasuryCost: quote.treasuryCost });
    expect(review?.detail).toContain('즉시 비축 장비가 지급되는 명령은 아닙니다');
    expect(JSON.stringify(props)).toBe(before);
    expect(reviewEquipmentLabOrder({ ...props, development: { ...props.development, fieldedByCategory: { ...props.development.fieldedByCategory, armor: prototype.id } } }, order).reason).toContain('이미 현재 제식');
    expect(reviewEquipmentLabOrder(props, { kind: 'adopt', equipmentId: 'not-a-model', route: 'indigenous' }).review).toBeNull();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('blocks non-finite financial inputs (%s)', (treasury) => {
    const props = fixture({ game: { ...game, treasury } });
    expect(reviewEquipmentLabOrder(props, researchOrder(props)).review).toBeNull();
  });
});

describe('equipment lab explicit confirm gate', () => {
  it.each(['research', 'prototype', 'adopt'] as const)('sends %s to its existing callback once and never claims completion', (kind) => {
    const adoption = adoptionFixture();
    const props = kind === 'adopt' ? adoption.props : fixture();
    const order = kind === 'research' ? researchOrder(props) : kind === 'prototype' ? prototypeOrder(props) : adoption.order;
    const { review } = reviewEquipmentLabOrder(props, order);
    expect(review).not.toBeNull();
    const before = JSON.stringify(props);
    const gate = { lastFingerprint: null as string | null };
    const result = confirmEquipmentLabOrder(review!, props, props, gate);
    expect(result.status).toBe('sent');
    expect(result.reason).toContain('전송만으로 작업 완료를 확정하지 않습니다');
    expect(result.reason).toContain('반영 결과를 확인');
    expect(confirmEquipmentLabOrder(review!, props, props, gate).status).toBe('blocked');
    const callback = kind === 'research' ? props.onStartResearch : kind === 'prototype' ? props.onCreatePrototype : props.onFieldEquipment;
    expect(callback).toHaveBeenCalledTimes(1);
    if (order.kind === 'research') expect(callback).toHaveBeenCalledWith(order.nodeId);
    else if (order.kind === 'prototype') expect(callback).toHaveBeenCalledWith(order.baseNodeId, order.moduleIds, order.name, order.route);
    else expect(callback).toHaveBeenCalledWith(order.equipmentId, order.route);
    expect(JSON.stringify(props)).toBe(before);
  });

  it.each(['week', 'cash', 'politicalPower', 'development', 'production', 'portfolio', 'decisions', 'nation'] as const)('requires re-review after external %s changes', (changed) => {
    const props = fixture();
    const { review } = reviewEquipmentLabOrder(props, prototypeOrder(props));
    const next = { ...props };
    if (changed === 'week') next.game = { ...props.game, week: props.game.week + 1 };
    if (changed === 'cash') next.game = { ...props.game, treasury: props.game.treasury + 1 };
    if (changed === 'politicalPower') next.game = { ...props.game, politicalPower: props.game.politicalPower - 1 };
    if (changed === 'development') next.development = { ...props.development, progress: props.development.progress + 1 };
    if (changed === 'production') next.production = props.production.map((line, index) => index ? line : { ...line, efficiency: line.efficiency + 1 });
    if (changed === 'portfolio') next.armsPortfolio = { ...props.armsPortfolio, autonomy: props.armsPortfolio.autonomy + 1 };
    if (changed === 'decisions') next.completedDecisions = [...props.completedDecisions, 'new-agreement'];
    if (changed === 'nation') next.nationId = 'usa';
    const gate = { lastFingerprint: null };
    expect(confirmEquipmentLabOrder(review!, next, props, gate).status).toBe('stale');
    expect(gate.lastFingerprint).toBeNull();
    expect(props.onCreatePrototype).not.toHaveBeenCalled();
  });
});
