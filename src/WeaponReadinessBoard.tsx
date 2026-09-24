import { useId, useState } from 'react';
import {
  AlertTriangle,
  Atom,
  Boxes,
  CheckCircle2,
  CircleGauge,
  ClipboardList,
  Crosshair,
  Factory,
  Gauge,
  Layers3,
  PackageOpen,
  Plane,
  Radar,
  RotateCcw,
  Shield,
  Ship,
  Target,
  Truck,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { canResearchEquipment, equipmentCategoryLabels, equipmentNodes, getDevelopedEquipment } from './equipment';
import {
  assessWeaponCapabilityFamilies,
  getWeaponReadinessAdvice,
  weaponCategoryOrder,
  weaponMaintenanceDoctrineDefinitions,
  weaponPriorityLabels,
  weaponReplacementPolicyDefinitions,
  weaponWorkOrderDefinitions,
} from './weaponReadiness';
import type {
  EquipmentCategory,
  EquipmentDevelopmentState,
  GameState,
  NationId,
  WeaponMaintenanceDoctrine,
  WeaponModernizationPriority,
  WeaponReplacementPolicy,
  WeaponWorkOrderType,
} from './types';

interface WeaponReadinessBoardProps {
  nationId: NationId;
  development: EquipmentDevelopmentState;
  game: GameState;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onSetMaintenanceDoctrine: (doctrine: WeaponMaintenanceDoctrine) => void;
  onSetReplacementPolicy: (policy: WeaponReplacementPolicy) => void;
  onSetPriority: (category: EquipmentCategory, priority: WeaponModernizationPriority) => void;
  onStartWorkOrder: (category: EquipmentCategory, type: WeaponWorkOrderType) => void;
}

const categoryIcons: Record<EquipmentCategory, typeof Crosshair> = {
  infantry: Crosshair,
  artillery: Target,
  armor: Shield,
  aircraft: Plane,
  naval: Ship,
  logistics: Truck,
  systems: Radar,
  strategic: Atom,
};

const statusLabels = {
  ready: '전투 준비',
  watch: '관찰 필요',
  strained: '정비 압박',
  grounded: '작전불가 위험',
};

const metricDefinitions = [
  { id: 'operationalAvailability' as const, label: '가동률', icon: Gauge, suffix: '%' },
  { id: 'materialCondition' as const, label: '장비 상태', icon: Shield, suffix: '' },
  { id: 'sparePartsDays' as const, label: '예비부품', icon: Boxes, suffix: '일' },
  { id: 'ammunitionDays' as const, label: '탄약·소모품', icon: PackageOpen, suffix: '일' },
  { id: 'crewProficiency' as const, label: '운용 숙련', icon: UsersRound, suffix: '' },
  { id: 'standardization' as const, label: '규격 통일', icon: Factory, suffix: '' },
  { id: 'fieldConfidence' as const, label: '실전 신뢰', icon: Crosshair, suffix: '' },
  { id: 'repairBacklog' as const, label: '수리 적체', icon: Wrench, suffix: '', inverse: true },
];

const priorityCycle: WeaponModernizationPriority[] = ['critical', 'standard', 'monitor'];

export function WeaponReadinessBoard({
  nationId,
  development,
  game,
  formatMoney,
  onSetMaintenanceDoctrine,
  onSetReplacementPolicy,
  onSetPriority,
  onStartWorkOrder,
}: WeaponReadinessBoardProps) {
  const titleId = useId();
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory>('armor');
  const readiness = development.readiness;
  const selected = readiness.categories[selectedCategory];
  const currentEquipment = getDevelopedEquipment(selected.equipmentId ?? undefined, development);
  const scores = weaponCategoryOrder.map((category) => readiness.categories[category].readinessScore);
  const averageReadiness = Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
  const groundedCount = weaponCategoryOrder.filter((category) => readiness.categories[category].status === 'grounded').length;
  const totalBacklog = Math.round(weaponCategoryOrder.reduce((total, category) => total + readiness.categories[category].repairBacklog, 0) / weaponCategoryOrder.length);
  const activeOrders = readiness.workOrders.filter((order) => order.status === 'active');
  const categoryModels = [
    ...development.unlockedIds.map((id) => getDevelopedEquipment(id, development)).filter((equipment) => equipment?.category === selectedCategory),
    ...development.prototypes.filter((prototype) => prototype.category === selectedCategory),
  ].filter((equipment, index, models) => equipment && models.findIndex((candidate) => candidate?.id === equipment.id) === index);
  const reserveEquipment = categoryModels
    .filter((equipment) => equipment?.id !== selected.equipmentId)
    .sort((left, right) => ((right?.stats.reliability ?? 0) + (right?.stats.production ?? 0)) - ((left?.stats.reliability ?? 0) + (left?.stats.production ?? 0)))[0];
  const successor = equipmentNodes.find((node) => node.category === selectedCategory && canResearchEquipment(node, development, nationId));
  const capabilityAssessments = assessWeaponCapabilityFamilies(selectedCategory, selected, currentEquipment?.stats);

  const cyclePriority = () => {
    const currentIndex = priorityCycle.indexOf(readiness.priorities[selectedCategory]);
    onSetPriority(selectedCategory, priorityCycle[(currentIndex + 1) % priorityCycle.length]);
  };

  return (
    <section className="weapon-readiness-board" aria-labelledby={titleId}>
      <header className="weapon-readiness-heading">
        <div>
          <span>ARSENAL SQUAD PLANNER · 채택 이후의 전투력</span>
          <h3 id={titleId}>병기 수명주기 본부</h3>
          <p>현재 제식·예비 장비·후계 사업을 비교하고 가동률, 수리, 탄약, 부품, 숙련을 같은 화면에서 관리합니다.</p>
        </div>
        <div className={`weapon-readiness-verdict ${groundedCount > 0 ? 'danger' : averageReadiness < 58 ? 'warning' : 'ready'}`}>
          <CircleGauge />
          <span><small>전군 병기 준비도</small><strong>{averageReadiness}</strong></span>
          <em>{groundedCount > 0 ? `${groundedCount}개 분야 즉시 조치` : averageReadiness < 58 ? '지속 작전 한계 접근' : '계획된 작전 수행 가능'}</em>
        </div>
      </header>

      <div className="weapon-readiness-kpis">
        <span><Wrench /><small>평균 수리 적체</small><strong>{totalBacklog}</strong></span>
        <span><ClipboardList /><small>진행 작업지시</small><strong>{activeOrders.length}/3</strong></span>
        <span><RotateCcw /><small>정비 원칙</small><strong>{weaponMaintenanceDoctrineDefinitions[readiness.maintenanceDoctrine].label}</strong></span>
        <span><PackageOpen /><small>보충 원칙</small><strong>{weaponReplacementPolicyDefinitions[readiness.replacementPolicy].label}</strong></span>
      </div>

      <div className="weapon-category-planner" role="tablist" aria-label="병기 분야별 준비도">
        {weaponCategoryOrder.map((category) => {
          const categoryReadiness = readiness.categories[category];
          const Icon = categoryIcons[category];
          const equipment = getDevelopedEquipment(categoryReadiness.equipmentId ?? undefined, development);
          return (
            <button
              type="button"
              role="tab"
              id={`${titleId}-tab-${category}`}
              aria-controls={`${titleId}-panel`}
              aria-selected={selectedCategory === category}
              className={`${categoryReadiness.status} ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              key={category}
            >
              <Icon />
              <span><small>{equipmentCategoryLabels[category]}</small><strong>{equipment?.name ?? '제식 미지정'}</strong></span>
              <b>{categoryReadiness.readinessScore}</b>
              <em>{statusLabels[categoryReadiness.status]} · {categoryReadiness.trend >= 0 ? '+' : ''}{categoryReadiness.trend}</em>
            </button>
          );
        })}
      </div>

      <div className="weapon-readiness-detail" role="tabpanel" id={`${titleId}-panel`} aria-labelledby={`${titleId}-tab-${selectedCategory}`}>
        <section className="weapon-depth-chart">
          <header>
            <div><span>{equipmentCategoryLabels[selectedCategory]} DEPTH CHART</span><strong>현재·예비·후계 전력계획</strong></div>
            <button type="button" className={readiness.priorities[selectedCategory]} onClick={cyclePriority}>
              우선순위 · {weaponPriorityLabels[readiness.priorities[selectedCategory]]}
            </button>
          </header>
          <div>
            <article className="first-choice"><i>1</i><span><small>현행 제식</small><strong>{currentEquipment?.name ?? '미지정'}</strong><em>복무 {selected.weeksInService}주 · 신뢰 {currentEquipment?.stats.reliability ?? '—'}</em></span></article>
            <article><i>2</i><span><small>예비·대체</small><strong>{reserveEquipment?.name ?? '예비 장비 없음'}</strong><em>{reserveEquipment ? `생산성 ${reserveEquipment.stats.production} · 신뢰 ${reserveEquipment.stats.reliability}` : '혼용 손실을 줄이려면 검증 장비를 남겨두십시오.'}</em></span></article>
            <article><i>3</i><span><small>후계 사업</small><strong>{successor?.name ?? '현 세대 유지'}</strong><em>{successor ? `연구 ${successor.researchCost} · ${successor.doctrineEffect}` : '다음 시대 또는 선행 연구를 기다리는 중'}</em></span></article>
          </div>
          <aside className={selected.status}><AlertTriangle /><span><strong>참모 평가</strong><small>{getWeaponReadinessAdvice(selected)}</small></span></aside>
        </section>

        <section className="weapon-metric-panel">
          <header><span>MISSION CAPABLE</span><strong>{statusLabels[selected.status]} · 준비도 {selected.readinessScore}</strong></header>
          <div>
            {metricDefinitions.map((metric) => {
              const Icon = metric.icon;
              const value = selected[metric.id];
              const fill = metric.inverse ? 100 - Math.min(100, value) : Math.min(100, value);
              return (
                <div className={metric.inverse && value >= 55 ? 'danger' : fill < 45 ? 'warning' : ''} key={metric.id}>
                  <Icon /><span><small>{metric.label}</small><strong>{value}{metric.suffix}</strong></span>
                  <i><b style={{ width: `${Math.max(0, fill)}%` }} /></i>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="weapon-capability-families" aria-label={`${equipmentCategoryLabels[selectedCategory]} 세부 임무 능력`}>
        <header>
          <Layers3 />
          <div><span>32 MISSION FAMILIES · 분야별 4개</span><strong>{equipmentCategoryLabels[selectedCategory]} 세부 임무 능력</strong></div>
          <p>현행 장비 성능과 실제 가동률·숙련·부품·탄약을 함께 반영합니다.</p>
        </header>
        <div>
          {capabilityAssessments.map((capability) => (
            <article className={capability.status} key={capability.id}>
              <span><strong>{capability.label}</strong><b>{capability.score}</b></span>
              <p>{capability.role}</p>
              <i><em style={{ width: `${capability.score}%` }} /></i>
              <small>{capability.bottleneck}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="weapon-policy-row">
        <section>
          <header><Wrench /><span><small>누가·어디서 고칠 것인가</small><strong>정비 교리</strong></span></header>
          <div>{Object.entries(weaponMaintenanceDoctrineDefinitions).map(([id, definition]) => (
            <button type="button" className={readiness.maintenanceDoctrine === id ? 'active' : ''} onClick={() => onSetMaintenanceDoctrine(id as WeaponMaintenanceDoctrine)} key={id}>
              <strong>{definition.label}</strong><small>{definition.tradeoff}</small>
            </button>
          ))}</div>
        </section>
        <section>
          <header><RotateCcw /><span><small>누가 신형을 먼저 받을 것인가</small><strong>보충·세대교체 원칙</strong></span></header>
          <div>{Object.entries(weaponReplacementPolicyDefinitions).map(([id, definition]) => (
            <button type="button" className={readiness.replacementPolicy === id ? 'active' : ''} onClick={() => onSetReplacementPolicy(id as WeaponReplacementPolicy)} key={id}>
              <strong>{definition.label}</strong><small>{definition.summary}</small>
            </button>
          ))}</div>
        </section>
      </div>

      <section className="weapon-work-orders">
        <header>
          <div><ClipboardList /><span><small>{equipmentCategoryLabels[selectedCategory]} · 최대 3개 병행</small><strong>정비·시험 작업지시</strong></span></div>
          <p>즉시 수치를 사는 버튼이 아니라, 시간·예산·지휘력을 투입하고 주간 결산에서 결과를 검증하는 사업입니다.</p>
        </header>
        <div className="weapon-work-order-grid">
          {(Object.entries(weaponWorkOrderDefinitions) as Array<[WeaponWorkOrderType, (typeof weaponWorkOrderDefinitions)[WeaponWorkOrderType]]>).map(([type, definition]) => {
            const alreadyActive = activeOrders.some((order) => order.category === selectedCategory && order.type === type);
            const affordable = game.treasury >= definition.treasuryCost && game.politicalPower >= definition.politicalCost && game.commandPoints >= definition.commandCost;
            return (
              <button
                type="button"
                disabled={alreadyActive || activeOrders.length >= 3 || !affordable}
                title={alreadyActive ? '같은 분야에서 이미 진행 중입니다.' : activeOrders.length >= 3 ? '작업지시 3개가 모두 사용 중입니다.' : !affordable ? '재정·정치력·지휘점수가 부족합니다.' : definition.expected}
                onClick={() => onStartWorkOrder(selectedCategory, type)}
                key={type}
              >
                <span><strong>{definition.label}</strong><em>{definition.durationWeeks}주</em></span>
                <small>{definition.summary}</small>
                <b>{formatMoney(definition.treasuryCost)} · {definition.politicalCost}PP · 지휘 {definition.commandCost}</b>
                <i>{definition.expected}</i>
              </button>
            );
          })}
        </div>
        {activeOrders.length > 0 ? (
          <div className="active-weapon-orders">
            {activeOrders.map((order) => {
              const definition = weaponWorkOrderDefinitions[order.type];
              const progress = Math.round((order.totalWeeks - order.remainingWeeks) / order.totalWeeks * 100);
              return <span key={order.id}><CheckCircle2 /><b>{equipmentCategoryLabels[order.category]} · {definition.label}</b><i><em style={{ width: `${progress}%` }} /></i><small>{order.remainingWeeks}주 남음</small></span>;
            })}
          </div>
        ) : <p className="weapon-orders-empty">진행 중인 작업지시가 없습니다. 가장 낮은 준비도 수치부터 한 가지를 선택하십시오.</p>}
      </section>

      {readiness.history.length > 0 ? (
        <details className="weapon-readiness-history">
          <summary><ClipboardList /> 최근 정비·시험 검증 결과 {Math.min(8, readiness.history.length)}건</summary>
          <div>{readiness.history.slice(-8).reverse().map((entry) => <span className={entry.outcome} key={entry.id}><b>{entry.week + 1}주 · {entry.title}</b><small>{entry.summary}</small></span>)}</div>
        </details>
      ) : null}
    </section>
  );
}
