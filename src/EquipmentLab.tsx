import { useEffect, useMemo, useState } from 'react';
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
import type {
  Division,
  EquipmentCategory,
  EquipmentDevelopmentState,
  EquipmentModuleSlot,
  EquipmentPrototype,
  GameState,
  NationId,
  ProductionLine,
} from './types';

interface EquipmentLabProps {
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
}: EquipmentLabProps) {
  const [category, setCategory] = useState<EquipmentCategory>('armor');
  const unlockedCategoryNodes = useMemo(
    () => equipmentNodes.filter((node) => node.category === category && development.unlockedIds.includes(node.id)),
    [category, development.unlockedIds],
  );
  const [baseNodeId, setBaseNodeId] = useState('');
  const [prototypeName, setPrototypeName] = useState('');
  const [selectedModules, setSelectedModules] = useState<Partial<Record<EquipmentModuleSlot, string>>>({});
  const [selectedRoute, setSelectedRoute] = useState<AcquisitionRoute>(() => getNationArmsProfile(nationId).preferredRoutes[0]);

  useEffect(() => {
    setSelectedRoute(getNationArmsProfile(nationId).preferredRoutes[0]);
  }, [nationId]);

  useEffect(() => {
    if (!unlockedCategoryNodes.some((node) => node.id === baseNodeId)) {
      setBaseNodeId(unlockedCategoryNodes[unlockedCategoryNodes.length - 1]?.id ?? '');
      setSelectedModules({});
    }
  }, [baseNodeId, unlockedCategoryNodes]);

  const categoryNodes = equipmentNodes.filter((node) => node.category === category && (node.nationIds === 'all' || node.nationIds.includes(nationId)));
  const baseNode = getEquipmentNode(baseNodeId);
  const moduleIds = Object.values(selectedModules).filter((id): id is string => Boolean(id));
  const preview = baseNode ? calculatePrototype(baseNode.id, moduleIds, prototypeName, game.week) : null;
  const activeNode = development.activeProjectId ? getEquipmentNode(development.activeProjectId) : null;
  const progressPercent = activeNode ? Math.min(100, development.progress / activeNode.researchCost * 100) : 0;
  const currentFieldedId = development.fieldedByCategory[category];
  const currentFielded = currentFieldedId ? getEquipmentNode(currentFieldedId) ?? development.prototypes.find((prototype) => prototype.id === currentFieldedId) : null;
  const relevantPrototypes = development.prototypes.filter((prototype) => prototype.category === category);
  const nextResearchNode = categoryNodes.find((node) => canResearchEquipment(node, development, nationId));
  const currentProductionLine = production.find((line) => line.equipmentId === currentFieldedId);
  const categoryDivisions = productionCategories.includes(category)
    ? divisions.filter((division) => (division.type === 'armor' ? 'armor' : 'infantry') === category)
    : [];
  const assignedDivisionCount = categoryDivisions.filter((division) => (
    development.divisionAssignments[division.id]
      ?? development.fieldedByCategory[division.type === 'armor' ? 'armor' : 'infantry']
  ) === currentFieldedId).length;
  const activeCategoryProject = activeNode?.category === category ? activeNode : null;
  const currentYear = 1942 + Math.floor(game.week / 52);
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
    setSelectedModules((current) => ({ ...current, [slot]: moduleId }));
  };

  return (
    <section className="equipment-lab deck-section">
      <div className="deck-section-heading equipment-lab-heading">
        <div><span className="eyebrow">ARSENAL EVOLUTION · 1942 → OPEN FUTURE</span><h3>통합 장비 개발국</h3></div>
        <div className="equipment-program-status">
          {activeNode ? <><FlaskConical size={14} /><span><strong>{activeNode.name}</strong><small>{Math.round(progressPercent)}% · {Math.ceil((activeNode.researchCost - development.progress) / weeklyResearchGain)}주 예상</small></span></> : <><Wrench size={14} /><span><strong>개발 슬롯 대기</strong><small>계보에서 다음 사업을 선택하십시오</small></span></>}
        </div>
      </div>

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
            {stagePrograms.map((program) => (
              <button type="button" className={category === program.category ? 'active' : ''} aria-pressed={category === program.category} onClick={() => setCategory(program.category)} key={program.id}>
                <i>{categoryIcons[program.category]}</i>
                <span><small>{equipmentCategoryLabels[program.category]}</small><strong>{program.title}</strong></span>
                <em>전력 +{program.capabilityGain}</em>
              </button>
            ))}
          </div>
          <footer>
            <span><strong>{selectedProgram.title}</strong>{selectedProgram.summary}</span>
            <a href={selectedProgram.sourceUrl} target="_blank" rel="noreferrer"><Link2 size={11} /> {selectedProgram.sourceLabel} 근거</a>
          </footer>
        </div>
      </section>

      <section className="procurement-route-planner" aria-label={`${equipmentCategoryLabels[category]} 조달 경로 비교`}>
        <header>
          <div><span>ACQUISITION MARKET · 경로를 직접 선택</span><strong>{equipmentCategoryLabels[category]} 조달·주권 계획</strong></div>
          <p>도입가만이 아니라 정비권, 제재 충격, 규격 혼합과 5년 교체비까지 비교합니다.</p>
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
            <summary><PackageCheck size={13} /> 최근 조달 결정과 실제 누적 결과 {Math.min(6, armsPortfolio.history.length)}건</summary>
            <div>{armsPortfolio.history.slice(-6).reverse().map((record) => (
              <span key={record.id}><b>{record.year} · {record.title}</b><small>{record.summary}</small></span>
            ))}</div>
          </details>
        )}
      </section>

      <section className="equipment-workflow" aria-label={`${equipmentCategoryLabels[category]} 장비 운용 흐름`}>
        <header>
          <div><span>처음이라면 여기부터</span><strong>{equipmentCategoryLabels[category]} 개발·배치 5단계</strong></div>
          <p><b>지금 할 일</b> {activeCategoryProject
            ? `${activeCategoryProject.name} 연구를 ${Math.round(progressPercent)}% 진행 중입니다. 주간 진행으로 완료하십시오.`
            : nextResearchNode
              ? `아래 기술 계보에서 ${nextResearchNode.name} 연구를 시작할 수 있습니다.`
              : currentFielded
                ? `${currentFielded.name}의 생산 효율과 부대 배치를 확인하십시오.`
                : '아래 기술 계보에서 사용 가능한 장비를 먼저 선택하십시오.'}</p>
        </header>
        <ol>
          <li className={activeCategoryProject ? 'active' : nextResearchNode ? 'ready' : 'complete'}><i>1</i><span><strong>기술 연구</strong><small>{activeCategoryProject ? `${Math.round(progressPercent)}% · 주당 +${weeklyResearchGain}` : nextResearchNode ? `${nextResearchNode.name} 선택 가능` : '현재 계보 연구 완료'}</small></span><ArrowRight size={13} /></li>
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
            <span><strong>시제품 위험</strong><small>고급 모듈이 많을수록 제작 비용과 실패 위험이 커집니다.</small></span>
          </div>
        </details>
      </section>

      <div className="equipment-category-tabs" role="tablist" aria-label="장비 연구 분야">
        {(Object.keys(equipmentCategoryLabels) as EquipmentCategory[]).map((item) => (
          <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
            <i>{categoryIcons[item]}</i><span>{equipmentCategoryLabels[item]}</span>
          </button>
        ))}
      </div>

      <div className="equipment-era-legend">
        {equipmentEraOrder.map((era) => <span key={era} className={era}><i />{equipmentEraLabels[era]}</span>)}
        <em><ShieldCheck size={12} /> 실제·파생·가상 데이터가 명확히 분리됩니다</em>
      </div>

      <div className="equipment-tech-tree">
        {equipmentEraOrder.map((era) => {
          const nodes = categoryNodes.filter((node) => node.era === era);
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
                      {unlocked ? <button className={fielded ? 'selected' : ''} disabled={fielded || !adoptionQuote.available || game.politicalPower < 6 || game.treasury < adoptionCost} title={fielded ? '현재 제식 장비입니다.' : adoptionQuote.unavailableReason ?? `${acquisitionRouteLabels[selectedRoute]} · 정치력 6 · 재정 ${formatMoney(adoptionCost)}`} onClick={() => onFieldEquipment(node.id, selectedRoute)}>{fielded ? <Check size={11} /> : <PackageCheck size={11} />}{fielded ? '현행 장비' : !adoptionQuote.available ? '경로 전환 필요' : `채택 6PP · ${formatMoney(adoptionCost)}`}</button> : <button disabled={!available || Boolean(development.activeProjectId) || game.politicalPower < 5} title="개발 착수 승인에는 정치력 5가 필요합니다." onClick={() => onStartResearch(node.id)}>{active ? '개발 진행 중' : available ? `연구 ${node.researchCost} · 5PP` : '선행 연구 필요'}</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="prototype-workshop">
        <div className="prototype-heading">
          <div><span>FREEFORM PROTOTYPE DESIGNER</span><h3>실험 장비 설계실</h3><p>해금한 장비를 기반으로 6개 모듈을 조합합니다. 시대가 앞선 모듈일수록 비용과 실패 위험이 커집니다.</p></div>
          <em>{equipmentModules.filter((module) => canUseModule(module, development)).length}/30 모듈 사용 가능 · 최대 15,625개 조합</em>
        </div>
        <div className="prototype-builder">
          <div className="prototype-inputs">
            <label><span>기반 장비</span><select value={baseNodeId} onChange={(event) => { setBaseNodeId(event.target.value); setSelectedModules({}); }}>
              {unlockedCategoryNodes.map((node) => <option value={node.id} key={node.id}>{equipmentEraLabels[node.era]} · {node.name}</option>)}
            </select></label>
            <label><span>시제 명칭</span><input value={prototypeName} onChange={(event) => setPrototypeName(event.target.value)} placeholder={baseNode ? `${baseNode.name} 실험형` : '기반 장비를 선택하십시오'} /></label>
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
            <button className="build-prototype" disabled={!selectedQuote.available || !baseNode || moduleIds.length < 2 || development.prototypes.length >= 8 || game.politicalPower < 8 || game.treasury < prototypeTreasuryCost} title={selectedQuote.unavailableReason} onClick={() => baseNode && onCreatePrototype(baseNode.id, moduleIds, prototypeName, selectedRoute)}><Plus size={14} /> {!selectedQuote.available ? '현지 정비·면허 전환 필요' : `${acquisitionRouteLabels[selectedRoute]} 시제 제작 · 8PP · ${formatMoney(prototypeTreasuryCost)}`}</button>
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
        {relevantPrototypes.length > 0 && <div className="prototype-roster">
          {relevantPrototypes.map((prototype) => {
            const prototypeQuote = getEquipmentProcurementQuote(
              nationId,
              currentYear,
              prototype.category,
              Math.max(30, Math.round(prototype.industrialCost * 1.2)),
              completedDecisions,
              selectedRoute,
              armsPortfolio,
            );
            return <PrototypeCard key={prototype.id} prototype={prototype} adoptionCost={prototypeQuote.treasuryCost} available={prototypeQuote.available} unavailableReason={prototypeQuote.unavailableReason} routeLabel={acquisitionRouteLabels[selectedRoute]} fielded={currentFieldedId === prototype.id} game={game} formatMoney={formatMoney} onField={() => onFieldEquipment(prototype.id, selectedRoute)} />;
          })}
        </div>}
      </div>

      <div className="equipment-deployment">
        <div className="equipment-deployment-summary"><Factory size={15} /><span><small>현행 {equipmentCategoryLabels[category]}</small><strong>{currentFielded?.name ?? '미채택'}</strong></span><em>{production.find((line) => line.equipmentId === currentFieldedId)?.efficiency ?? '—'}% 생산 효율</em></div>
        <div className="division-equipment-list">
          {divisions.map((division) => {
            const requiredCategory: EquipmentCategory = division.type === 'armor' ? 'armor' : 'infantry';
            const assignedId = development.divisionAssignments[division.id] ?? development.fieldedByCategory[requiredCategory] ?? '';
            const options = [
              ...development.unlockedIds.map(getEquipmentNode).filter((node) => node?.category === requiredCategory),
              ...development.prototypes.filter((prototype) => prototype.category === requiredCategory),
            ];
            return <label key={division.id}><span><strong>{division.name}</strong><small>{division.type} · 전투력 {division.strength}</small></span><select value={assignedId} onChange={(event) => onAssignDivisionEquipment(division.id, event.target.value)}>{options.map((option) => option && <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
          })}
        </div>
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
      <button disabled={fielded || !available || game.politicalPower < 6 || game.treasury < adoptionCost} title={unavailableReason ?? `${routeLabel} · 정치력 6 · 재정 ${formatMoney(adoptionCost)}`} onClick={onField}>{fielded ? <Check size={11} /> : <PackageCheck size={11} />}{fielded ? '현행 채택' : !available ? '경로 전환 필요' : `채택 6PP · ${formatMoney(adoptionCost)}`}</button>
    </article>
  );
}
