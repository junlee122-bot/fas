// Isolated partial-engine verification. No player saves or browser persistence.
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { StaffDeliveryPledgeBoard } from '../src/StaffDeliveryPledgeBoard';
import { createStaffRoster, getRole } from '../src/campaign';
import { advancePostwarIndustryWeek, createPostwarIndustryState, forecastPostwarIndustry } from '../src/postwarIndustry';
import type { PostwarIndustryInput, PostwarIndustryState } from '../src/postwarIndustry';
import { configureRegionalIndustry, createRegionalIndustryState, deriveRegionalOwnedStockpile, getRegionalIndustryAccount, planRegionalShipment } from '../src/regionalIndustry';
import type { RegionalIndustryContext, RegionalIndustryState } from '../src/regionalIndustry';
import { combineStockpileDeltas, settleRegionalIndustryDelivery } from '../src/regionalIndustrySettlement';
import { getRoleTabMandates } from '../src/roleMandate';
import { advanceStaffDeliveryPledges, buildStaffDeliveryReceipts, createStaffDeliveryPledge, createStaffDeliveryPledgeState, getStaffDeliveryPledgeQuantity } from '../src/staffDeliveryPledges';
import type { StaffDeliveryPledgeContext, StaffDeliveryPledgeState } from '../src/staffDeliveryPledges';
import type { ProductionLine, Stockpile, Territory } from '../src/types';

const nationId = 'britain' as const;
const startingWeek = 100;
const staff = createStaffRoster(nationId, 'britain-tier1').map((member) => ({ ...member, joinedWeek: 0 }));
const owner = staff.find((member) => member.department === 'armaments') ?? staff[0];
const production: ProductionLine[] = [{ id: 'rifle', name: '보병 장비 생산선', category: '보병', assigned: 5, efficiency: 100, output: 40, icon: 'factory' }];
const territories: Territory[] = ['fixture-origin', 'fixture-destination'].map((id, index) => ({
  id, name: index ? '검증 도착 거점' : '검증 집하 창고', x: 10 + index * 20, y: 40, region: '검증용 추상 지역',
  controller: 'allies', ownerId: nationId, value: 1, supply: 80, terrain: '평야', siteType: 'city',
  neighbors: [index ? 'fixture-origin' : 'fixture-destination'],
}));
const stock = (values: Partial<Stockpile> = {}): Stockpile => ({ infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0, ...values });

interface FixtureState {
  week: number;
  game: PostwarIndustryInput['game'];
  stockpile: Stockpile;
  industry: PostwarIndustryState;
  regional: RegionalIndustryState;
  pledges: StaffDeliveryPledgeState;
  routeBlocked: boolean;
  authorityLocked: boolean;
  reserveSequence: number;
  settlements: number;
  notices: string[];
}
function industryInput(run: FixtureState, week = run.week + 1): PostwarIndustryInput {
  return { nationId, week, production, game: run.game, stockpile: run.stockpile, spendingLevel: 100, securityBudgetPercent: 100 };
}
function regionalContext(run: FixtureState, week = run.week): RegionalIndustryContext {
  return { nationId, week, territories, playableTerritoryIds: run.routeBlocked ? ['fixture-origin'] : territories.map((territory) => territory.id),
    factories: run.game.factories, authorized: !run.authorityLocked, controllingFaction: 'allies' };
}
function pledgeContext(run: FixtureState, week = run.week): StaffDeliveryPledgeContext {
  const mandate = getRoleTabMandates(getRole('britain-tier1', nationId)).industry;
  return { nationId, week, phase: 'nation', staff, production, manageableDepartments: staff.map((member) => member.department),
    industryMandate: run.authorityLocked ? { ...mandate, mode: 'report', label: '검증: 열람 전용', reason: '검증 입력으로 산업 결재권을 잠갔습니다.' } : mandate,
    lineEquipment: [{ lineId: 'rifle', equipmentKey: 'infantryEquipment' }] };
}
function withNotice(run: FixtureState, message: string): FixtureState { return { ...run, notices: [message, ...run.notices].slice(0, 16) }; }
function settle(run: FixtureState): FixtureState {
  const week = run.week + 1;
  const industry = advancePostwarIndustryWeek(run.industry, industryInput(run, week));
  const regional = settleRegionalIndustryDelivery(run.regional, regionalContext(run, week), industry.applied ? {
    id: `fixture-industry:${nationId}:${week}`, nationId, week, stockpileDelta: industry.stockpileDelta,
  } : undefined);
  const receipts = buildStaffDeliveryReceipts({ nationId, week, industryApplied: industry.applied, industryReport: industry.report,
    nationalDirectDelta: regional.attribution?.applied ? regional.attribution.stockpileDelta : null, deliveries: regional.transport.deliveries });
  const pledges = advanceStaffDeliveryPledges(run.pledges, pledgeContext(run, week), receipts);
  return withNotice({ ...run, week, industry: industry.state, regional: regional.state, pledges: pledges.state,
    game: { ...run.game, fuel: run.game.fuel + industry.gameDelta.fuel, steel: run.game.steel + industry.gameDelta.steel, treasury: run.game.treasury + industry.gameDelta.treasury },
    stockpile: combineStockpileDeltas(run.stockpile, regional.availableDelta), settlements: run.settlements + 1 },
    `제${week + 1}주 부분 결산: 생산 완료 ${industry.applied ? industry.stockpileDelta.infantryEquipment : 0}개 · 창고 집하 ${regional.stagedDelta.infantryEquipment}개 · 실제 국가 가용 편입 ${regional.availableDelta.infantryEquipment}개 · 약속 확정 ${pledges.completed.length}건. 생산·지역 물류·약속만 실행했습니다.`);
}
function reserve(run: FixtureState): FixtureState {
  const sequence = run.reserveSequence + 1;
  const result = planRegionalShipment(run.regional, { id: `fixture-shipment:${nationId}:${sequence}`, quantity: 20 }, regionalContext(run));
  return withNotice({ ...run, reserveSequence: sequence, regional: result.state }, `20개 출발 예약 요청: ${result.reason}`);
}
function initialState(): FixtureState {
  let run: FixtureState = { week: startingWeek, game: { factories: 10, fuel: 500, steel: 500, treasury: 1000 }, stockpile: stock({ infantryEquipment: 100 }),
    industry: createPostwarIndustryState(nationId, startingWeek), regional: createRegionalIndustryState(nationId, startingWeek), pledges: createStaffDeliveryPledgeState(),
    routeBlocked: false, authorityLocked: false, reserveSequence: 0, settlements: 0, notices: [] };
  const configured = configureRegionalIndustry(run.regional, { mode: 'pilot', originTerritoryId: 'fixture-origin', destinationTerritoryId: 'fixture-destination',
    equipmentKey: 'infantryEquipment', allocatedFactories: 2, dispatch: { mode: 'manual', maxItemsPerWeek: 20, minimumWarehouse: 0 } }, regionalContext(run));
  if (!configured.applied) throw new Error(`Fixture route setup failed: ${configured.reason}`);
  run = { ...run, regional: configured.state };
  const created = createStaffDeliveryPledge(run.pledges, { id: 'fixture-pledge:britain:availability', expectedWeek: startingWeek,
    staffId: owner.id, personId: owner.personId, lineId: 'rifle', metric: 'national-available', targetQuantity: 20, durationWeeks: 4 }, pledgeContext(run));
  if (!created.applied) throw new Error(`Fixture pledge setup failed: ${created.reason}`);
  run = reserve(settle({ ...run, pledges: created.state }));
  return withNotice(run, '검증 초기 상태: 제101주에 4주/20개 국가 가용 약속을 기록하고, 실제 1회 생산 결산 뒤 20개를 출발 예약했습니다. 기존 국가 비축 100개는 약속 실적에서 제외됩니다.');
}

function Verification() {
  const [run, setRun] = useState(initialState);
  const [pastView, setPastView] = useState(false);
  const [hideDeliveredDetail, setHideDeliveredDetail] = useState(false);
  const [navigation, setNavigation] = useState<unknown>(null);
  const [navigationCount, setNavigationCount] = useState(0);
  const context = pledgeContext(run, pastView ? Math.max(0, run.week - 2) : run.week);
  const regionalViewContext = regionalContext(run, context.week);
  const account = getRegionalIndustryAccount(run.regional, nationId, run.week);
  const visibleRegional = hideDeliveredDetail ? { ...run.regional, accounts: { ...run.regional.accounts, [nationId]: {
    ...account, shipments: account.shipments.filter((shipment) => shipment.status !== 'delivered'), lastDelivery: null,
  } } } : run.regional;
  const owned = deriveRegionalOwnedStockpile(run.regional, nationId, run.stockpile);
  const reserved = account.shipments.filter((shipment) => shipment.status === 'reserved').reduce((total, shipment) => total + shipment.quantity, 0);
  const transit = account.shipments.filter((shipment) => shipment.status === 'in-transit').reduce((total, shipment) => total + shipment.quantity, 0);
  const currentGoal = run.pledges.pledges.find((pledge) => pledge.id === 'fixture-pledge:britain:availability');
  const reset = () => { setRun(initialState()); setPastView(false); setHideDeliveredDetail(false); setNavigation(null); setNavigationCount(0); };

  return <main className="delivery-fixture">
    <header><h1>생산 → 수송 → 도착 → 약속 검증</h1>
      <p>실제 게임 컴포넌트와 생산·지역 수송·납품 약속 엔진만 사용하는 격리 검증입니다. 국가 전체의 세금·전투·참모 성장 결산은 실행하지 않습니다. 참모에게 실적 보상이나 벌점도 주지 않습니다.</p>
      <p>사용자 저장을 읽거나 바꾸지 않으며 새로고침하면 초기화됩니다. 시작부터 보유한 100개와 새로 생산한 물량을 구분합니다. 아래 거점은 검증용 추상 인접 지역이며 실제 역사적 공장 위치가 아닙니다.</p>
    </header>
    <div className="delivery-fixture-tools" aria-label="부분 엔진 검증 제어">
      <button type="button" disabled={pastView} onClick={() => setRun(settle)}>1주 부분 결산 · 생산/수송/약속</button>
      <button type="button" disabled={pastView || run.authorityLocked} onClick={() => setRun(reserve)}>현재 창고에서 20개 출발 예약</button>
      <button type="button" onClick={reset}>검증 초기화</button>
      <label><input type="checkbox" checked={run.routeBlocked} onChange={(event) => {
        const routeBlocked = event.target.checked;
        setRun((previous) => withNotice({ ...previous, routeBlocked }, routeBlocked ? '검증 입력: 도착 거점을 활성 지도에서 제외했습니다. 다음 결산은 실제 경로 검증에 따라 보류하며 물량은 유지합니다.' : '검증 입력: 도착 거점을 복구했습니다. 보류 기록 해제·진행은 다음 결산에서 확정됩니다.'));
      }} />검증: 경로 차단</label>
      <label><input type="checkbox" checked={run.authorityLocked} onChange={(event) => { const authorityLocked = event.target.checked; setRun((previous) => ({ ...previous, authorityLocked })); }} />검증: 결재권 잠금</label>
      <label><input type="checkbox" checked={pastView} onChange={(event) => setPastView(event.target.checked)} />검증: 2주 이전 시점 열람</label>
      <label><input type="checkbox" checked={hideDeliveredDetail} onChange={(event) => setHideDeliveredDetail(event.target.checked)} />검증: 도착한 원배송 상세만 숨김</label>
    </div>
    <output className="delivery-fixture-status" role="status">{pastView ? `읽기 전용 과거 보기: 제${context.week + 1}주 기준입니다. 미래 실적을 현재 성과로 표시하면 안 됩니다. 아래 원자료와 상단 수량은 실제 최신 상태입니다.` : hideDeliveredDetail ? '보관 한도 검증: 표시용 복사본에서 도착한 배송 상세만 제외했습니다. 약속 영수증과 실제 원본 재고·수송 상태는 유지합니다.' : run.notices[0]}</output>
    <dl className="delivery-fixture-metrics">
      <div><dt>실제 최신 주차</dt><dd data-testid="delivery-fixture-week">제{run.week + 1}주</dd></div>
      <div><dt>국가 즉시 가용 · 기존 100 포함</dt><dd data-testid="delivery-fixture-available">{run.stockpile.infantryEquipment}</dd></div>
      <div><dt>출발 창고 · 미예약</dt><dd>{account.warehouse.infantryEquipment}</dd></div>
      <div><dt>예약 / 운송 중</dt><dd>{reserved} / {transit}</dd></div>
      <div><dt>총보유 · 보존 확인</dt><dd>{owned.infantryEquipment}</dd></div>
      <div><dt>약속에 집계된 실제 새 편입</dt><dd data-testid="delivery-fixture-goal">{currentGoal ? getStaffDeliveryPledgeQuantity(currentGoal) : 0} / 20</dd></div>
    </dl>
    <StaffDeliveryPledgeBoard state={run.pledges} context={context} forecast={forecastPostwarIndustry(industryInput(run))}
      routedEquipmentKey="infantryEquipment" initialView="records" regional={{ state: visibleRegional, context: regionalViewContext }}
      onCreate={(command) => {
        if (pastView) return false;
        const result = createStaffDeliveryPledge(run.pledges, command, pledgeContext(run));
        setRun((previous) => withNotice({ ...previous, pledges: result.state }, result.reason));
        return result.applied;
      }}
      onNavigateGoal={(target: unknown) => { setNavigation(target); setNavigationCount((count) => count + 1); }} />
    <section className="delivery-fixture-audit" aria-label="정확한 대상 이동 검증">
      <h2>화면 이동 요청 · {navigationCount}회</h2>
      <p>링크는 이 격리 화면 밖으로 이동하지 않습니다. 요청의 국가·약속·생산선·배송·인물 ID를 그대로 표시하며 엔진 명령은 실행하지 않습니다.</p>
      <pre data-testid="delivery-fixture-navigation">{navigation === null ? '아직 이동 요청 없음' : JSON.stringify(navigation, null, 2)}</pre>
    </section>
    <details className="delivery-fixture-audit"><summary>실제 원자료 · 표시용 숨김 전의 메모리 상태</summary>
      <pre data-testid="delivery-fixture-source">{JSON.stringify({ week: run.week, settlements: run.settlements, game: run.game, stockpile: run.stockpile,
        industry: run.industry, regional: run.regional, pledges: run.pledges }, null, 2)}</pre>
    </details>
    <details className="delivery-fixture-audit"><summary>부분 결산과 명령 기록 · 최근 {run.notices.length}건</summary><ol>{run.notices.map((message, index) => <li key={index}>{message}</li>)}</ol></details>
  </main>;
}

const root = (import.meta.hot?.data.deliveryGoalsRoot as Root | undefined) ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.deliveryGoalsRoot = root;
root.render(<Verification />);
