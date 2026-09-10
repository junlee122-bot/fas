import { getCampaignYearForWeek } from './campaignCalendar';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, CircleHelp, Factory, FlaskConical, Link2, LockKeyhole, PackageCheck, Plus, ShieldCheck, Wrench } from 'lucide-react';
import {
  calculatePrototype,
  canResearchEquipment,
  canUseModule,
  equipmentCategoryLabels,
  equipmentEraLabels,
  equipmentEraOrder,
  equipmentModules,
  equipmentNodes,
  getEquipmentNode,
  getEquipmentModule,
  getDevelopedEquipment,
} from './equipment';
import {
  acquisitionRouteLabels,
  getAvailableAcquisitionRoutes,
  getEquipmentProcurementQuote,
  getNationArmsProfile,
  getStageWeaponPrograms,
  getStrategicStage,
  type AcquisitionRoute,
  type ArmsPortfolioState,
} from './strategicArmsDiplomacy';
import { WeaponReadinessBoard } from './WeaponReadinessBoard';
import type {
  Division,
  EquipmentCategory,
  EquipmentDevelopmentState,
  EquipmentModuleSlot,
  EquipmentPrototype,
  GameState,
  NationId,
  ProductionLine,
  WeaponMaintenanceDoctrine,
  WeaponModernizationPriority,
  WeaponReplacementPolicy,
  WeaponWorkOrderType,
} from './types';
import './EquipmentLab.css';

export type EquipmentLabView = 'overview' | 'research' | 'prototype' | 'deployment';
export interface EquipmentLabProps {
  nationId: NationId;
  game: GameState;
  development: EquipmentDevelopmentState;
  production: ProductionLine[];
  divisions: Division[];
  weeklyResearchGain: number;
  completedDecisions: string[];
  armsPortfolio: ArmsPortfolioState;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onStartResearch: (nodeId: string) => void;
  onCreatePrototype: (baseNodeId: string, moduleIds: string[], name: string, route: AcquisitionRoute) => void;
  onFieldEquipment: (equipmentId: string, route: AcquisitionRoute) => void;
  onAssignDivisionEquipment: (divisionId: string, equipmentId: string) => void;
  onSetMaintenanceDoctrine: (doctrine: WeaponMaintenanceDoctrine) => void;
  onSetReplacementPolicy: (policy: WeaponReplacementPolicy) => void;
  onSetReadinessPriority: (category: EquipmentCategory, priority: WeaponModernizationPriority) => void;
  onStartWeaponWorkOrder: (category: EquipmentCategory, type: WeaponWorkOrderType) => void;
  initialView?: EquipmentLabView;
  view?: EquipmentLabView;
  onViewChange?: (view: EquipmentLabView) => void;
}

export type EquipmentLabOrder = { kind: 'research'; nodeId: string }
  | { kind: 'prototype'; baseNodeId: string; moduleIds: string[]; name: string; route: AcquisitionRoute }
  | { kind: 'adopt'; equipmentId: string; route: AcquisitionRoute };
type EquipmentReviewInput = Pick<EquipmentLabProps, 'nationId' | 'game' | 'development' | 'production' | 'divisions' | 'weeklyResearchGain' | 'completedDecisions' | 'armsPortfolio'>;
type EquipmentOrderCallbacks = Pick<EquipmentLabProps, 'onStartResearch' | 'onCreatePrototype' | 'onFieldEquipment'>;
export interface EquipmentLabReview { order: EquipmentLabOrder; fingerprint: string; title: string; politicalCost: number; treasuryCost: number; treasuryAfter: number; detail: string; warnings: string[]; }
const equipmentReviewFingerprint = (input: EquipmentReviewInput, order: EquipmentLabOrder) => JSON.stringify([input.nationId, input.game, input.development, input.production, input.divisions, input.weeklyResearchGain, input.completedDecisions, input.armsPortfolio, order]);

/** Mirrors the existing App command preconditions; procurement values come from its same quote helper. */
export function reviewEquipmentLabOrder(input: EquipmentReviewInput, order: EquipmentLabOrder): { review: EquipmentLabReview | null; reason: string } {
  const { game, development, nationId } = input;
  const blocked = (reason: string) => ({ review: null, reason });
  if (!Number.isSafeInteger(game.week) || game.week < 0 || !Number.isFinite(game.treasury) || !Number.isFinite(game.politicalPower)) return blocked('현재 주차·재정·정치력 조건을 확인할 수 없습니다.');
  let title = ''; let politicalCost = 0; let treasuryCost = 0; let detail = ''; let warnings: string[] = [];
  if (order.kind === 'research') {
    const node = getEquipmentNode(order.nodeId);
    if (!node || !canResearchEquipment(node, development, nationId)) return blocked('선행 장비 계보 또는 국가별 연구 조건을 먼저 충족해야 합니다.');
    if (development.activeProjectId) return blocked('통합 장비 개발 슬롯이 이미 사용 중입니다. 기존 사업의 완료를 기다리십시오.');
    politicalCost = 5;
    title = `${node.name} 연구 착수`;
    detail = `연구량 ${node.researchCost} · 현재 주당 진척 ${Number.isFinite(input.weeklyResearchGain) ? Math.max(0, input.weeklyResearchGain) : 0}. 착수는 완료·해금이 아닙니다.`;
    warnings = ['정치력 5는 승인된 착수 처리에서 한 번 차감합니다. 연구 완료는 후속 주간 결산에서 검증합니다.'];
  } else {
    let equipment;
    let baseCost: number;
    if (order.kind === 'prototype') {
      const base = getEquipmentNode(order.baseNodeId);
      const modules = order.moduleIds.map(getEquipmentModule);
      if (!base || !development.unlockedIds.includes(base.id) || modules.some((module) => !module || !canUseModule(module, development))) return blocked('해금한 기반 장비와 현재 사용할 수 있는 모듈만 선택하십시오.');
      if (order.moduleIds.length < 2 || new Set(modules.map((module) => module?.slot)).size !== modules.length) return blocked('서로 다른 모듈 슬롯을 두 개 이상 선택하십시오.');
      if (development.prototypes.length >= 8) return blocked('시제품 보관 한도 8개에 도달했습니다.');
      equipment = calculatePrototype(base.id, [...order.moduleIds], order.name, game.week);
      if (!equipment) return blocked('시제 계산을 완료할 수 없습니다.');
      politicalCost = 8;
      title = `${equipment.name} 시제 제작`;
      baseCost = Math.max(45, Math.round(equipment.industrialCost * 1.6));
      detail = `모듈 ${order.moduleIds.length}개 · 설계 위험 ${equipment.risk}%. 제작 요청은 제식 채택·실제 장비 납품과 별개입니다.`;
    } else {
      equipment = getDevelopedEquipment(order.equipmentId, development);
      if (!equipment || (!development.unlockedIds.includes(equipment.id) && !development.prototypes.some((prototype) => prototype.id === equipment!.id))) return blocked('해금한 장비 또는 실제 저장된 시제품만 채택할 수 있습니다.');
      if (development.fieldedByCategory[equipment.category] === equipment.id) return blocked('이미 현재 제식으로 채택한 장비입니다.');
      politicalCost = 6;
      title = `${equipment.name} 제식 채택`;
      baseCost = Math.max(30, Math.round(equipment.industrialCost * 1.2));
      detail = '제식·생산 표준을 변경하는 요청입니다. 연결된 기존 생산라인은 전환 과정에서 효율이 낮아질 수 있으며, 즉시 비축 장비가 지급되는 명령은 아닙니다.';
    }
    if (!getAvailableAcquisitionRoutes(nationId).includes(order.route)) return blocked('현재 국가에 제공되는 조달 경로를 선택하십시오.');
    const quote = getEquipmentProcurementQuote(nationId, getCampaignYearForWeek(game.week), equipment.category, baseCost, input.completedDecisions, order.route, input.armsPortfolio);
    if (!quote.available) return blocked(quote.unavailableReason ?? '현재 조달 경로를 사용할 수 없습니다.');
    treasuryCost = quote.treasuryCost;
    warnings = [quote.explanation, ...quote.warnings, `조달 전망: 성공 ${quote.successChance}% · 납기 ${quote.deliveryWeeks}주 · 현지화 ${quote.localContent}%. 전망을 실제 도착·작업 완료로 판정하지 않습니다.`];
  }
  if (!Number.isFinite(treasuryCost) || treasuryCost < 0 || game.treasury < treasuryCost || game.politicalPower < politicalCost) return blocked(`현재 재정 또는 정치력이 부족합니다. 정치력 ${politicalCost}와 조달 견적의 재정이 필요합니다.`);
  return { review: { order: order.kind === 'prototype' ? { ...order, moduleIds: [...order.moduleIds] } : { ...order }, fingerprint: equipmentReviewFingerprint(input, order), title, politicalCost, treasuryCost, treasuryAfter: game.treasury - treasuryCost, detail, warnings }, reason: '아직 집행하지 않았습니다. 조건을 검토하고 작업을 승인하세요.' };
}

export function confirmEquipmentLabOrder(review: EquipmentLabReview, input: EquipmentReviewInput, callbacks: EquipmentOrderCallbacks, gate: { lastFingerprint: string | null }): { status: 'sent' | 'stale' | 'blocked'; reason: string } {
  if (review.fingerprint !== equipmentReviewFingerprint(input, review.order)) return { status: 'stale', reason: '검토 이후 주차·자원·개발·생산 또는 조달 조건이 달라졌습니다. 최신 조건으로 재검토하십시오.' };
  if (gate.lastFingerprint === review.fingerprint) return { status: 'blocked', reason: '같은 검토안의 요청을 이미 전달했습니다. 실제 게임 기록을 확인하십시오.' };
  const current = reviewEquipmentLabOrder(input, review.order);
  if (!current.review) return { status: 'blocked', reason: current.reason };
  gate.lastFingerprint = review.fingerprint;
  const order = review.order;
  if (order.kind === 'research') callbacks.onStartResearch(order.nodeId);
  else if (order.kind === 'prototype') callbacks.onCreatePrototype(order.baseNodeId, [...order.moduleIds], order.name, order.route);
  else callbacks.onFieldEquipment(order.equipmentId, order.route);
  return { status: 'sent', reason: '요청을 전달했습니다. 전송만으로 작업 완료를 확정하지 않습니다. 실제 연구·시제품·제식 기록과 잔고에서 반영 결과를 확인하십시오.' };
}

const categoryIcons: Record<EquipmentCategory, string> = {
  infantry: '╂', artillery: '◉', armor: '▰', aircraft: '✦', naval: '≋', logistics: '▣', systems: '⌁', strategic: '◎',
};

const authenticityLabels = {
  documented: '실물·문서 고증',
  derived: '역사 발전 계보',
  speculative: '가상 실험 기술',
};

const moduleSlotLabels: Record<EquipmentModuleSlot, string> = {
  platform: '플랫폼', powerplant: '동력계', weapon: '주 효과기', protection: '방호', sensors: '감지·사격통제', mission: '임무 패키지',
};

const productionCategories: EquipmentCategory[] = ['infantry', 'artillery', 'armor', 'aircraft', 'naval', 'logistics'];

function StatBar({ label, value, preview }: { label: string; value: number; preview?: number }) {
  const display = preview ?? value;
  return (
    <div className="equipment-stat">
      <span>{label}</span><strong>{display}</strong>
      <i><b style={{ width: `${Math.max(0, Math.min(100, display))}%` }} /></i>
      {preview !== undefined && preview !== value && <em className={preview > value ? 'good' : 'bad'}>{preview > value ? '+' : ''}{preview - value}</em>}
    </div>
  );
}

export function EquipmentLab({
  nationId,
  game,
  development,
  production,
  divisions,
  weeklyResearchGain,
  completedDecisions,
  armsPortfolio,
  formatMoney,
  onStartResearch,
  onCreatePrototype,
  onFieldEquipment,
  onAssignDivisionEquipment,
  onSetMaintenanceDoctrine,
  onSetReplacementPolicy,
  onSetReadinessPriority,
  onStartWeaponWorkOrder,
  initialView = 'overview',
  view: controlledView,
  onViewChange,
}: EquipmentLabProps) {
  const [localView, setLocalView] = useState<EquipmentLabView>(initialView);
  const view = controlledView ?? localView;
  const [review, setReview] = useState<EquipmentLabReview | null>(null);
  const [orderMessage, setOrderMessage] = useState('');
  const reviewRef = useRef<HTMLElement | null>(null);
  const submissionGate = useRef<{ lastFingerprint: string | null }>({ lastFingerprint: null });
  const contentId = useId();
  useEffect(() => { if (review) reviewRef.current?.focus(); }, [review]);
  const changeView = (next: EquipmentLabView) => { setLocalView(next); onViewChange?.(next); setReview(null); setOrderMessage(''); };
  const [category, setCategory] = useState<EquipmentCategory>('armor');
  const unlockedCategoryNodes = useMemo(
    () => equipmentNodes.filter((node) => node.category === category && development.unlockedIds.includes(node.id)),
    [category, development.unlockedIds],
  );
  const [baseChoice, setBaseNodeId] = useState('');
  const baseNodeId = unlockedCategoryNodes.some((node) => node.id === baseChoice) ? baseChoice : unlockedCategoryNodes.at(-1)?.id ?? '';
  const [prototypeName, setPrototypeName] = useState('');
  const [moduleDraft, setModuleDraft] = useState<{ nationId: NationId; baseNodeId: string; modules: Partial<Record<EquipmentModuleSlot, string>> } | null>(null);
  const selectedModules = moduleDraft?.nationId === nationId && moduleDraft.baseNodeId === baseNodeId ? moduleDraft.modules : {};
  const [routeDraft, setRouteDraft] = useState<{ nationId: NationId; route: AcquisitionRoute } | null>(null);
  const selectedRoute = routeDraft?.nationId === nationId ? routeDraft.route : getNationArmsProfile(nationId).preferredRoutes[0];
  const setSelectedRoute = (route: AcquisitionRoute) => { setRouteDraft({ nationId, route }); setReview(null); };
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [selectedPrototypeId, setSelectedPrototypeId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');

  const categoryNodes = equipmentNodes.filter((node) => node.category === category && (node.nationIds === 'all' || node.nationIds.includes(nationId)));
  const baseNode = getEquipmentNode(baseNodeId);
  const moduleIds = Object.values(selectedModules).filter((id): id is string => Boolean(id));
  const preview = baseNode ? calculatePrototype(baseNode.id, moduleIds, prototypeName, game.week) : null;
  const activeNode = development.activeProjectId ? getEquipmentNode(development.activeProjectId) : null;
  const displayedResearchGain = Number.isFinite(weeklyResearchGain) ? Math.max(0, weeklyResearchGain) : 0;
  const progressPercent = activeNode ? Math.min(100, development.progress / activeNode.researchCost * 100) : 0;
  const remainingResearchWeeks = activeNode && displayedResearchGain > 0 ? Math.max(0, Math.ceil((activeNode.researchCost - development.progress) / displayedResearchGain)) : null;
  const currentFieldedId = development.fieldedByCategory[category];
  const currentFielded = currentFieldedId ? getEquipmentNode(currentFieldedId) ?? development.prototypes.find((prototype) => prototype.id === currentFieldedId) : null;
  const relevantPrototypes = development.prototypes.filter((prototype) => prototype.category === category);
  const nextResearchNode = categoryNodes.find((node) => canResearchEquipment(node, development, nationId));
  const selectedNode = categoryNodes.find((node) => node.id === selectedNodeId) ?? categoryNodes.find((node) => node.id === development.activeProjectId) ?? nextResearchNode ?? categoryNodes.at(-1);
  const selectedPrototype = relevantPrototypes.find((prototype) => prototype.id === selectedPrototypeId) ?? relevantPrototypes.at(-1);
  const selectedDivision = divisions.find((division) => division.id === selectedDivisionId) ?? divisions[0];
  const currentProductionLine = production.find((line) => line.equipmentId === currentFieldedId);
  const categoryDivisions = productionCategories.includes(category)
    ? divisions.filter((division) => (division.type === 'armor' ? 'armor' : 'infantry') === category)
    : [];
  const assignedDivisionCount = categoryDivisions.filter((division) => (
    development.divisionAssignments[division.id]
      ?? development.fieldedByCategory[division.type === 'armor' ? 'armor' : 'infantry']
  ) === currentFieldedId).length;
  const activeCategoryProject = activeNode?.category === category ? activeNode : null;
  const currentYear = getCampaignYearForWeek(game.week);
  const strategicStage = getStrategicStage(currentYear);
  const nationArmsProfile = getNationArmsProfile(nationId);
  const stagePrograms = getStageWeaponPrograms(strategicStage.id);
  const selectedProgram = stagePrograms.find((program) => program.category === category)!;
  const availableRoutes = getAvailableAcquisitionRoutes(nationId);
  const quoteBaseCost = Math.max(45, Math.round((currentFielded?.industrialCost ?? 80) * 1.2));
  const routeQuotes = availableRoutes.map((route) => getEquipmentProcurementQuote(
    nationId,
    currentYear,
    category,
    quoteBaseCost,
    completedDecisions,
    route,
    armsPortfolio,
  ));
  const selectedQuote = getEquipmentProcurementQuote(
    nationId,
    currentYear,
    category,
    quoteBaseCost,
    completedDecisions,
    selectedRoute,
    armsPortfolio,
  );
  const prototypeTreasuryCost = getEquipmentProcurementQuote(
    nationId,
    currentYear,
    category,
    Math.max(45, Math.round((preview?.industrialCost ?? 0) * 1.6)),
    completedDecisions,
    selectedRoute,
    armsPortfolio,
  ).treasuryCost;

  const changeModule = (slot: EquipmentModuleSlot, moduleId: string) => {
    setModuleDraft({ nationId, baseNodeId, modules: { ...selectedModules, [slot]: moduleId } });
    setReview(null);
  };
  const reviewInput = { nationId, game, development, production, divisions, weeklyResearchGain, completedDecisions, armsPortfolio };
  const reviewStale = Boolean(review && review.fingerprint !== equipmentReviewFingerprint(reviewInput, review.order));
  const reviewOrder = (order: EquipmentLabOrder) => { const next = reviewEquipmentLabOrder(reviewInput, order); setReview(next.review); setOrderMessage(next.reason); };
  const confirmOrder = () => {
    if (!review) return;
    const result = confirmEquipmentLabOrder(review, reviewInput, { onStartResearch, onCreatePrototype, onFieldEquipment }, submissionGate.current);
    setOrderMessage(result.reason);
    if (result.status === 'sent') setReview(null);
  };
  const nextResearchReview = nextResearchNode ? reviewEquipmentLabOrder(reviewInput, { kind: 'research', nodeId: nextResearchNode.id }) : null;
  const researchProblem = activeNode ? remainingResearchWeeks === null ? '주간 연구 진척이 0이거나 확인되지 않아 완료 기간을 확정할 수 없습니다.' : '개발 슬롯이 사용 중입니다. 기존 연구를 주간 결산으로 진행하십시오.'
    : nextResearchReview ? nextResearchReview.review ? null : nextResearchReview.reason
      : '현재 선택 분야에서 새로 착수할 수 있는 선행 계보가 없습니다. 다른 분야 또는 이미 해금한 장비를 확인하십시오.';

  return (
    <section className="equipment-lab equipment-lab-v2 deck-section">
      <div className="deck-section-heading equipment-lab-heading">
        <div><span className="eyebrow">ARSENAL EVOLUTION · 1942 → OPEN FUTURE</span><h3>통합 장비 개발국</h3></div>
        <div className="equipment-program-status">
          {activeNode ? <><FlaskConical size={14} /><span><strong>{activeNode.name}</strong><small>{Math.round(progressPercent)}% · {remainingResearchWeeks === null ? '진행 보류 · 기간 미정' : `${remainingResearchWeeks}주 예상`}</small></span></> : <><Wrench size={14} /><span><strong>개발 슬롯 대기</strong><small>계보에서 다음 사업을 선택하십시오</small></span></>}
        </div>
      </div>

      <nav className="equipment-workviews" aria-label="장비 개발국 작업보기">{([['overview', '요약'], ['research', '장비 연구'], ['prototype', '시제 설계'], ['deployment', '배치·정비']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} aria-controls={contentId} onClick={() => changeView(id)}>{label}</button>)}</nav>
      {review ? <section className="equipment-order-review" aria-label="장비 작업 미집행 검토" tabIndex={-1} ref={reviewRef}><small>REVIEW / 아직 미집행</small><h3>{review.title}</h3><p>정치력 {review.politicalCost} · 재정 {formatMoney(review.treasuryCost)} · 집행 직후 예상 국고 {formatMoney(review.treasuryAfter)}</p><p>{review.detail}</p><ul>{review.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><p>비용은 승인된 작업에서 한 번만 처리합니다. 검토만으로 장비·보상·연구 진척이 지급되지는 않습니다.</p>{reviewStale ? <p role="alert">검토 후 자원이나 개발 상태가 바뀌었습니다. 최신 조건으로 다시 검토하세요.</p> : null}<div className="equipment-order-actions"><button className="equipment-primary" type="button" disabled={reviewStale} onClick={confirmOrder}>작업 승인</button>{reviewStale ? <button type="button" onClick={() => reviewOrder(review.order)}>최신 조건으로 재검토</button> : null}<button type="button" onClick={() => { setReview(null); setOrderMessage('검토를 취소했습니다. 실행 요청은 보내지 않았습니다.'); }}>검토 취소</button></div></section> : null}
      <p role="status" aria-live="polite" className="equipment-order-message">{orderMessage || '장비 연구·시제 제작·제식 채택은 검토 후 확정합니다. 열람·대상 선택만으로는 집행하지 않습니다.'}</p>
      <div id={contentId}>
      {view === 'overview' ? <section className="equipment-overview" aria-label="현재 장비 연구와 다음 행동"><small>THIS WEEK / 개발 우선순위</small><h3>{activeNode ? activeNode.name : '장비 개발 슬롯이 비어 있습니다'}</h3><p>{activeNode ? remainingResearchWeeks === null ? '현재 주간 연구 진척으로 완료 시점을 계산할 수 없습니다.' : `실제 진행 ${development.progress}/${activeNode.researchCost} · 현재 조건 유지 시 ${remainingResearchWeeks}주 예상` : nextResearchNode ? `${nextResearchNode.name}의 선행 계보 조건을 충족했습니다. 착수 비용과 빈 슬롯은 검토 단계에서 다시 확인합니다.` : '선택 분야의 연구·제식·정비 상태를 확인하십시오.'}</p>{researchProblem ? <p className="equipment-blocked">{researchProblem}</p> : null}<div className="equipment-overview-actions"><button type="button" onClick={() => { if (activeNode) { setCategory(activeNode.category); setSelectedNodeId(activeNode.id); } else if (nextResearchNode) setSelectedNodeId(nextResearchNode.id); changeView('research'); }}>{activeNode ? '진행 연구와 계보 보기' : '장비 연구 대상 검토'}</button><button type="button" onClick={() => changeView('prototype')}>해금 장비로 시제 설계</button><button type="button" onClick={() => changeView('deployment')}>제식·배치·정비 확인</button></div><p>보유 시제품 {development.prototypes.length}/8 · 진행 정비 작업 {development.readiness.workOrders.filter((order) => order.status === 'active').length}건 · 현재 국고 {formatMoney(game.treasury)}</p></section> : null}
      {view !== 'overview' ? <div className="equipment-target-picker"><label>장비 분야<select value={category} onChange={(event) => { setCategory(event.target.value as EquipmentCategory); setReview(null); }}>{(Object.keys(equipmentCategoryLabels) as EquipmentCategory[]).map((item) => <option key={item} value={item}>{equipmentCategoryLabels[item]}</option>)}</select></label>{view === 'research' ? <label>검토할 장비 계보<select value={selectedNode?.id ?? ''} onChange={(event) => { setSelectedNodeId(event.target.value); setReview(null); }}>{categoryNodes.map((node) => <option value={node.id} key={node.id}>{equipmentEraLabels[node.era]} · {node.name} · {development.unlockedIds.includes(node.id) ? '해금' : node.id === development.activeProjectId ? '연구 중' : canResearchEquipment(node, development, nationId) ? '선행 충족' : '선행 필요'}</option>)}</select></label> : null}</div> : null}
      {view !== 'overview' ? <details className="equipment-procurement-details"><summary>국가 산업 진단·선택 분야 프로그램·획득 경로 비교 · {selectedQuote.routeLabel}</summary>
      <section className="equipment-strategic-brief" aria-label={`${strategicStage.shortLabel} 국가 무기체계 전략`}>
        <div className="equipment-capability-dossier">
          <header><span>{strategicStage.shortLabel}</span><strong>국가 조달·산업 진단</strong></header>
          <p>{nationArmsProfile.historicalAnchor}</p>
          <div>
            <span>산업<strong>{nationArmsProfile.industrialBase}</strong></span>
            <span>과학<strong>{nationArmsProfile.scienceBase}</strong></span>
            <span>수입 의존<strong>{nationArmsProfile.importDependence}</strong></span>
            <span>제재 회복<strong>{nationArmsProfile.sanctionsResilience}</strong></span>
          </div>
          <aside>
            <small>선택 조달 경로</small>
            <strong>{selectedQuote.routeLabel} · 비용 ×{selectedQuote.multiplier.toFixed(2)}</strong>
            <span>{selectedQuote.riskLabel} · 성공 {selectedQuote.successChance}% · 현지화 {selectedQuote.localContent}% · {selectedQuote.deliveryWeeks}주</span>
          </aside>
        </div>
        <div className="equipment-stage-programs">
          <header><div><span>8-DOMAIN PROGRAM BOARD</span><strong>{strategicStage.label}</strong></div><p>{strategicStage.pressure}</p></header>
          <div>
            {stagePrograms.filter((program) => program.category === category).map((program) => (
              <button type="button" className={category === program.category ? 'active' : ''} aria-pressed={category === program.category} onClick={() => setCategory(program.category)} key={program.id}>
                <i>{categoryIcons[program.category]}</i>
                <span><small>{equipmentCategoryLabels[program.category]}</small><strong>{program.title}</strong></span>
                <em>프로그램 참고 전력 +{program.capabilityGain} · 선택만으로 적용되지 않음</em>
              </button>
            ))}
          </div>
          <footer>
            <span><strong>{selectedProgram.title}</strong>{selectedProgram.summary}</span>
            <a href={selectedProgram.sourceUrl} target="_blank" rel="noreferrer"><Link2 size={11} /> {selectedProgram.sourceLabel} 근거</a>
          </footer>
          <p>{selectedProgram.historicalAnchor}</p>
        </div>
      </section>

      <section className="procurement-route-planner" aria-label={`${equipmentCategoryLabels[category]} 조달 경로 비교`}>
        <header>
          <div><span>ACQUISITION MARKET · 경로를 직접 선택</span><strong>{equipmentCategoryLabels[category]} 조달·주권 계획</strong></div>
          <p>경로 비교용 기준 견적입니다. 정비권·제재 충격·5년 교체비를 비교하되, 실제 선택 장비와 시제 모듈의 집행 비용은 미집행 검토에서 다시 산출합니다.</p>
        </header>
        <div className="procurement-portfolio-strip">
          <span><small>통합 전력</small><strong>{Math.round(armsPortfolio.capability)}</strong></span>
          <span><small>공급 안보</small><strong>{Math.round(armsPortfolio.supplySecurity)}</strong></span>
          <span><small>조달 자율</small><strong>{Math.round(armsPortfolio.autonomy)}</strong></span>
          <span><small>상호운용</small><strong>{Math.round(armsPortfolio.interoperability)}</strong></span>
          <span><small>비상 비축</small><strong>{Math.round(armsPortfolio.emergencyStockpile)}</strong></span>
          <span className={armsPortfolio.escalation >= 65 ? 'danger' : ''}><small>군비 긴장</small><strong>{Math.round(armsPortfolio.escalation)}</strong></span>
        </div>
        <div className="procurement-route-grid">
          {routeQuotes.map((quote) => (
            <button type="button" key={quote.route} className={selectedRoute === quote.route ? 'active' : ''} disabled={!quote.available} title={quote.unavailableReason} onClick={() => setSelectedRoute(quote.route)} aria-pressed={selectedRoute === quote.route}>
              <span><strong>{quote.routeLabel}</strong><em>{quote.available ? quote.riskLabel : '전환 필요'}</em></span>
              <b>{formatMoney(quote.treasuryCost)}</b>
              <small>{quote.available ? `성공 ${quote.successChance}% · 유지 ${formatMoney(quote.annualSustainmentCost)}/년` : quote.unavailableReason}</small>
            </button>
          ))}
        </div>
        <div className="procurement-decision-brief">
          <div className="procurement-outcome-chain">
            <header><strong>{selectedQuote.routeLabel} 결과 예측</strong><span>{selectedQuote.explanation}</span></header>
            <div>
              <span>초기 도입<strong>{formatMoney(selectedQuote.treasuryCost)}</strong><small>{selectedQuote.deliveryWeeks}주 예상</small></span>
              <span>현지 정비<strong>{selectedQuote.localContent}%</strong><small>공급안보 {selectedQuote.supplySecurityEffect > 0 ? '+' : ''}{selectedQuote.supplySecurityEffect}</small></span>
              <span>세대 교체<strong>{formatMoney(selectedQuote.replacementCost)}</strong><small>자율 {selectedQuote.autonomyEffect > 0 ? '+' : ''}{selectedQuote.autonomyEffect}</small></span>
              <span>외교 파급<strong>{selectedQuote.escalationEffect > 0 ? '+' : ''}{selectedQuote.escalationEffect}</strong><small>상호운용 {selectedQuote.interoperabilityEffect > 0 ? '+' : ''}{selectedQuote.interoperabilityEffect}</small></span>
            </div>
            {(selectedQuote.benefits.length > 0 || selectedQuote.warnings.length > 0) && (
              <ul>
                {selectedQuote.benefits.map((item) => <li className="benefit" key={item}><ShieldCheck size={11} />{item}</li>)}
                {selectedQuote.warnings.map((item) => <li className="warning" key={item}><AlertTriangle size={11} />{item}</li>)}
              </ul>
            )}
          </div>
          <div className="procurement-forecast">
            <header><span>같은 카드에서 확인</span><strong>1·3·5년 전망</strong></header>
            {selectedQuote.forecast.map((forecast) => (
              <div key={forecast.years}>
                <b>{forecast.years}년</b>
                <span><small>전력</small>{forecast.readiness}</span>
                <span><small>공급</small>{forecast.supplySecurity}</span>
                <span><small>자율</small>{forecast.autonomy}</span>
                <strong>{formatMoney(forecast.cumulativeCost)}</strong>
                <em>{forecast.note}</em>
              </div>
            ))}
          </div>
        </div>
        {armsPortfolio.history.length > 0 && (
          <details className="procurement-ledger">
            <summary><PackageCheck size={13} /> 최근 조달 결정 기록 {Math.min(6, armsPortfolio.history.length)}건 · 실제 장비 납품과 별도</summary>
            <div>{armsPortfolio.history.slice(-6).reverse().map((record) => (
              <span key={record.id}><b>{record.year} · {record.title}</b><small>{record.summary}</small></span>
            ))}</div>
          </details>
        )}
      </section></details> : null}

      {view === 'overview' ? <details className="equipment-workflow-guide"><summary>연구에서 배치까지 5단계 안내와 전투 수치 설명</summary><section className="equipment-workflow" aria-label={`${equipmentCategoryLabels[category]} 장비 운용 흐름`}>
        <header>
          <div><span>처음이라면 여기부터</span><strong>{equipmentCategoryLabels[category]} 개발·배치 5단계</strong></div>
          <p><b>지금 할 일</b> {activeCategoryProject
            ? `${activeCategoryProject.name} 연구를 ${Math.round(progressPercent)}% 진행 중입니다. 주간 진행으로 완료하십시오.`
            : nextResearchNode
              ? `장비 연구 보기에서 ${nextResearchNode.name}의 착수 조건을 검토하십시오.`
              : currentFielded
                ? `${currentFielded.name}의 생산 효율과 부대 배치를 확인하십시오.`
                : '아래 기술 계보에서 사용 가능한 장비를 먼저 선택하십시오.'}</p>
        </header>
        <ol>
          <li className={activeCategoryProject ? 'active' : nextResearchNode ? 'ready' : 'complete'}><i>1</i><span><strong>기술 연구</strong><small>{activeCategoryProject ? `${Math.round(progressPercent)}% · 주당 +${displayedResearchGain}` : nextResearchNode ? `${nextResearchNode.name} 선택 가능` : '현재 계보 연구 완료'}</small></span><ArrowRight size={13} /></li>
          <li className={relevantPrototypes.length ? 'complete' : 'optional'}><i>2</i><span><strong>시제품 설계</strong><small>{relevantPrototypes.length ? `${relevantPrototypes.length}종 보유` : '선택 단계 · 모듈 2개 이상'}</small></span><ArrowRight size={13} /></li>
          <li className={currentFielded ? 'complete' : 'ready'}><i>3</i><span><strong>제식 채택</strong><small>{currentFielded?.name ?? '6PP와 채택 비용 필요'}</small></span><ArrowRight size={13} /></li>
          <li className={currentProductionLine ? 'complete' : productionCategories.includes(category) ? 'ready' : 'automatic'}><i>4</i><span><strong>양산 전환</strong><small>{currentProductionLine ? `${currentProductionLine.name} · 효율 ${currentProductionLine.efficiency}%` : productionCategories.includes(category) ? '제식 채택 시 생산라인 전환' : '국가 체계에 자동 반영'}</small></span><ArrowRight size={13} /></li>
          <li className={assignedDivisionCount ? 'complete' : categoryDivisions.length ? 'ready' : 'automatic'}><i>5</i><span><strong>부대 배치</strong><small>{categoryDivisions.length ? `${assignedDivisionCount}/${categoryDivisions.length}개 편제 적용` : '국가·전략 효과로 적용'}</small></span></li>
        </ol>
        <details className="equipment-glossary">
          <summary><CircleHelp size={14} /> 수치가 실제 전투에 어떻게 반영되는지 보기</summary>
          <div>
            <span><strong>화력 + 방호</strong><small>편제 전력 보정: (합계−100)÷22, −4~+10</small></span>
            <span><strong>신뢰성 + 작전반경</strong><small>조직력 보정: (합계−100)÷34, −3~+6</small></span>
            <span><strong>생산성 + 기동</strong><small>보급 보정: (합계−100)÷35, −3~+6</small></span>
            <span><strong>시제품 위험</strong><small>모듈의 비용·설계 위험 지수를 반영합니다. 시제 제작 버튼이 즉시 성공·실패 추첨을 실행한다는 뜻은 아닙니다.</small></span>
          </div>
        </details>
      </section></details> : null}

      {view === 'deployment' ? <section className="equipment-overview" aria-label="제식 변경과 정비의 다음 행동">
        <h3>제식 변경과 운용 정비</h3>
        <p>제식·생산 표준을 바꾸려면 장비 연구 또는 보유 시제품에서 후보를 검토하십시오. 아래 정비 본부의 분야 선택은 준비도·작업지시용이며, 제식 변경을 자동으로 승인하지 않습니다.</p>
        <div className="equipment-overview-actions">
          <button type="button" onClick={() => changeView('research')}>{equipmentCategoryLabels[category]} 제식 후보 검토</button>
          <button type="button" onClick={() => changeView('prototype')}>보유 시제품과 시제 설계 보기</button>
        </div>
      </section> : null}
      {view === 'deployment' ? <WeaponReadinessBoard
        nationId={nationId}
        development={development}
        game={game}
        formatMoney={formatMoney}
        onSetMaintenanceDoctrine={onSetMaintenanceDoctrine}
        onSetReplacementPolicy={onSetReplacementPolicy}
        onSetPriority={onSetReadinessPriority}
        onStartWorkOrder={onStartWeaponWorkOrder}
      /> : null}

      {view === 'research' ? <><div className="equipment-era-legend">
        {equipmentEraOrder.map((era) => <span key={era} className={era}><i />{equipmentEraLabels[era]}</span>)}
        <em><ShieldCheck size={12} /> 실제·파생·가상 데이터가 명확히 분리됩니다</em>
      </div>

      <div className="equipment-tech-tree">
        {equipmentEraOrder.filter((era) => era === selectedNode?.era).map((era) => {
          const nodes = categoryNodes.filter((node) => node.id === selectedNode?.id);
          return (
            <div className={`equipment-era-column ${era}`} key={era}>
              <header><span>{equipmentEraLabels[era]}</span><em>{era === 'historical' ? '국가별 실장비' : era === 'speculative' ? '대체역사 설계' : '공통 발전 계보'}</em></header>
              {nodes.length === 0 && <div className="empty-equipment-era"><LockKeyhole size={14} /> 선행 시대 연구 필요</div>}
              {nodes.map((node) => {
                const unlocked = development.unlockedIds.includes(node.id);
                const active = development.activeProjectId === node.id;
                const available = canResearchEquipment(node, development, nationId);
                const fielded = currentFieldedId === node.id;
                const adoptionQuote = getEquipmentProcurementQuote(
                  nationId,
                  currentYear,
                  node.category,
                  Math.max(30, Math.round(node.industrialCost * 1.2)),
                  completedDecisions,
                  selectedRoute,
                  armsPortfolio,
                );
                const adoptionCost = adoptionQuote.treasuryCost;
                return (
                  <article className={`equipment-node ${unlocked ? 'unlocked' : ''} ${active ? 'active' : ''} ${fielded ? 'fielded' : ''}`} key={node.id}>
                    <div className="equipment-node-flags"><span className={node.authenticity}>{authenticityLabels[node.authenticity]}</span><em>{node.year ?? '가상 연도'}</em></div>
                    <h4>{node.name}</h4>
                    <p>{node.summary}</p>
                    <small>{node.historicalNote}</small>
                    <div className="equipment-node-stats"><span title="방호와 함께 편제 전력을 결정합니다.">화력 {node.stats.firepower}</span><span title="생산성과 함께 편제 보급을 결정합니다.">기동 {node.stats.mobility}</span><span title="화력과 함께 편제 전력을 결정합니다.">방호 {node.stats.protection}</span><span title="작전반경과 함께 편제 조직력을 결정합니다.">신뢰 {node.stats.reliability}</span><span title="신뢰성과 함께 편제 조직력을 결정합니다.">반경 {node.stats.range}</span><span title="기동과 함께 편제 보급을 결정합니다.">생산 {node.stats.production}</span></div>
                    {active && <div className="equipment-progress"><i><b style={{ width: `${progressPercent}%` }} /></i><span>{Math.round(progressPercent)}%</span></div>}
                    {node.sourceUrl && <a href={node.sourceUrl} target="_blank" rel="noreferrer"><Link2 size={10} /> {node.sourceLabel}</a>}
                    <div className="equipment-node-actions">
                      {unlocked ? <button className={fielded ? 'selected' : ''} disabled={fielded || !adoptionQuote.available || game.politicalPower < 6 || game.treasury < adoptionCost} title={fielded ? '현재 제식 장비입니다.' : adoptionQuote.unavailableReason ?? `${acquisitionRouteLabels[selectedRoute]} · 정치력 6 · 재정 ${formatMoney(adoptionCost)}`} onClick={() => reviewOrder({ kind: 'adopt', equipmentId: node.id, route: selectedRoute })}>{fielded ? <Check size={11} /> : <PackageCheck size={11} />}{fielded ? '현행 장비' : !adoptionQuote.available ? '경로 전환 필요' : `채택 검토 6PP · ${formatMoney(adoptionCost)}`}</button> : <button disabled={!available || Boolean(development.activeProjectId) || game.politicalPower < 5} title="개발 착수 승인에는 정치력 5가 필요합니다." onClick={() => reviewOrder({ kind: 'research', nodeId: node.id })}>{active ? '개발 진행 중' : available ? `연구 검토 ${node.researchCost} · 5PP` : '선행 연구 필요'}</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div></> : null}

      {view === 'prototype' ? <div className="prototype-workshop">
        <div className="prototype-heading">
          <div><span>FREEFORM PROTOTYPE DESIGNER</span><h3>실험 장비 설계실</h3><p>해금한 장비를 기반으로 6개 모듈을 조합합니다. 비용·설계 위험을 검토하고 제작 요청을 확정하십시오. 시제품 저장과 실제 장비 납품은 별개입니다.</p></div>
          <em>{equipmentModules.filter((module) => canUseModule(module, development)).length}/30 모듈 사용 가능 · 최대 15,625개 조합</em>
        </div>
        <div className="prototype-builder">
          <div className="prototype-inputs">
            <label><span>기반 장비</span><select value={baseNodeId} onChange={(event) => { setBaseNodeId(event.target.value); setModuleDraft(null); setReview(null); }}>
              {unlockedCategoryNodes.map((node) => <option value={node.id} key={node.id}>{equipmentEraLabels[node.era]} · {node.name}</option>)}
            </select></label>
            <label><span>시제 명칭</span><input value={prototypeName} onChange={(event) => { setPrototypeName(event.target.value); setReview(null); }} placeholder={baseNode ? `${baseNode.name} 실험형` : '기반 장비를 선택하십시오'} /></label>
            <div className="module-selector-grid">
              {(Object.keys(moduleSlotLabels) as EquipmentModuleSlot[]).map((slot) => {
                const modules = equipmentModules.filter((module) => module.slot === slot && canUseModule(module, development));
                return (
                  <label key={slot}><span>{moduleSlotLabels[slot]}</span><select value={selectedModules[slot] ?? ''} onChange={(event) => changeModule(slot, event.target.value)}>
                    <option value="">선택 안 함</option>
                    {modules.map((module) => <option key={module.id} value={module.id}>{equipmentEraLabels[module.minimumEra]} · {module.name}</option>)}
                  </select></label>
                );
              })}
            </div>
            <button className="build-prototype" disabled={!selectedQuote.available || !baseNode || moduleIds.length < 2 || development.prototypes.length >= 8 || game.politicalPower < 8 || game.treasury < prototypeTreasuryCost} title={selectedQuote.unavailableReason} onClick={() => baseNode && reviewOrder({ kind: 'prototype', baseNodeId: baseNode.id, moduleIds, name: prototypeName, route: selectedRoute })}><Plus size={14} /> {!selectedQuote.available ? '현지 정비·면허 전환 필요' : `${acquisitionRouteLabels[selectedRoute]} 시제 제작 검토 · 8PP · ${formatMoney(prototypeTreasuryCost)}`}</button>
            <small>최소 2개 모듈 · 최대 8개 시제품 보관 · 선택한 조달 경로의 현지화·정비·제재 조건이 함께 누적됩니다.</small>
          </div>
          <div className="prototype-preview">
            <header><span>설계 예측</span><strong>{preview?.name ?? '모듈을 선택하십시오'}</strong></header>
            {baseNode && <div className="prototype-stat-grid">
              <StatBar label="화력" value={baseNode.stats.firepower} preview={preview?.stats.firepower} />
              <StatBar label="기동" value={baseNode.stats.mobility} preview={preview?.stats.mobility} />
              <StatBar label="방호" value={baseNode.stats.protection} preview={preview?.stats.protection} />
              <StatBar label="작전반경" value={baseNode.stats.range} preview={preview?.stats.range} />
              <StatBar label="신뢰성" value={baseNode.stats.reliability} preview={preview?.stats.reliability} />
              <StatBar label="생산성" value={baseNode.stats.production} preview={preview?.stats.production} />
            </div>}
            <div className="prototype-risk"><AlertTriangle size={14} /><span><small>개발 위험</small><strong>{preview?.risk ?? 0}%</strong></span><span><small>산업 비용</small><strong>{preview?.industrialCost ?? 0}</strong></span></div>
          </div>
        </div>
        {relevantPrototypes.length > 0 && <div className="prototype-roster"><label className="equipment-saved-prototype-picker">검토할 보유 시제품<select value={selectedPrototype?.id ?? ''} onChange={(event) => { setSelectedPrototypeId(event.target.value); setReview(null); }}>{relevantPrototypes.map((prototype) => <option key={prototype.id} value={prototype.id}>{prototype.name}</option>)}</select></label>
          {(selectedPrototype ? [selectedPrototype] : []).map((prototype) => {
            const prototypeQuote = getEquipmentProcurementQuote(
              nationId,
              currentYear,
              prototype.category,
              Math.max(30, Math.round(prototype.industrialCost * 1.2)),
              completedDecisions,
              selectedRoute,
              armsPortfolio,
            );
            return <PrototypeCard key={prototype.id} prototype={prototype} adoptionCost={prototypeQuote.treasuryCost} available={prototypeQuote.available} unavailableReason={prototypeQuote.unavailableReason} routeLabel={acquisitionRouteLabels[selectedRoute]} fielded={currentFieldedId === prototype.id} game={game} formatMoney={formatMoney} onField={() => reviewOrder({ kind: 'adopt', equipmentId: prototype.id, route: selectedRoute })} />;
          })}
        </div>}
      </div> : null}

      {view === 'deployment' ? <div className="equipment-deployment">
        <div className="equipment-deployment-summary"><Factory size={15} /><span><small>현행 {equipmentCategoryLabels[category]}</small><strong>{currentFielded?.name ?? '미채택'}</strong></span><em>{production.find((line) => line.equipmentId === currentFieldedId)?.efficiency ?? '—'}% 생산 효율</em></div>
        <label className="equipment-division-picker">검토할 편제<select value={selectedDivision?.id ?? ''} onChange={(event) => setSelectedDivisionId(event.target.value)}>{divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}</select></label>{divisions.length === 0 ? <p>장비를 배치할 편제가 없습니다.</p> : null}
        <div className="division-equipment-list">
          {(selectedDivision ? [selectedDivision] : []).map((division) => {
            const requiredCategory: EquipmentCategory = division.type === 'armor' ? 'armor' : 'infantry';
            const assignedId = development.divisionAssignments[division.id] ?? development.fieldedByCategory[requiredCategory] ?? '';
            const options = [
              ...development.unlockedIds.map(getEquipmentNode).filter((node) => node?.category === requiredCategory),
              ...development.prototypes.filter((prototype) => prototype.category === requiredCategory),
            ];
            return <label key={division.id}><span><strong>{division.name}</strong><small>{division.type} · 전투력 {division.strength}</small></span><select value={assignedId} onChange={(event) => onAssignDivisionEquipment(division.id, event.target.value)}>{options.map((option) => option && <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
          })}
        </div>
      </div> : null}
      </div>
    </section>
  );
}

function PrototypeCard({ prototype, adoptionCost, available, unavailableReason, routeLabel, fielded, game, formatMoney, onField }: { prototype: EquipmentPrototype; adoptionCost: number; available: boolean; unavailableReason?: string; routeLabel: string; fielded: boolean; game: GameState; formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string; onField: () => void }) {
  return (
    <article className={fielded ? 'fielded' : ''}>
      <span>시제 {prototype.createdWeek + 1}주차 · 위험 {prototype.risk}%</span>
      <strong>{prototype.name}</strong>
      <small>화력 {prototype.stats.firepower} · 기동 {prototype.stats.mobility} · 방호 {prototype.stats.protection} · 신뢰 {prototype.reliability}</small>
      <button type="button" disabled={fielded || !available || game.politicalPower < 6 || game.treasury < adoptionCost} title={unavailableReason ?? `${routeLabel} · 정치력 6 · 재정 ${formatMoney(adoptionCost)}`} onClick={onField}>{fielded ? <Check size={11} /> : <PackageCheck size={11} />}{fielded ? '현행 채택' : !available ? '경로 전환 필요' : `채택 검토 6PP · ${formatMoney(adoptionCost)}`}</button>
    </article>
  );
}
