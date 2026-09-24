// Local Vite verification fixture. Not imported by the game's production entry.
// Uses real settlement/command functions; never reads or writes player saves.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RegionalLogisticsScene, type RegionalLogisticsView } from '../src/RegionalLogisticsScene';
import { RegionalIndustryBoard } from '../src/RegionalIndustryBoard';
import { advanceRegionalTransportWeek, attributeRegionalIndustryReceipt, cancelRegionalReservedShipment, configureRegionalIndustry, createRegionalIndustryState, planRegionalShipment, type RegionalIndustryContext } from '../src/regionalIndustry';
import type { Stockpile, Territory } from '../src/types';
const territories: Territory[] = [
  { id: 'london', name: '런던 집하 창고', x: 10, y: 20, neighbors: ['portsmouth'], region: '영국', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
  { id: 'portsmouth', name: '포츠머스 물류 거점', x: 30, y: 25, neighbors: ['london'], region: '영국', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
];
const initialContext: RegionalIndustryContext = { nationId: 'britain', week: 100, factories: 10, authorized: true, territories, playableTerritoryIds: ['london', 'portsmouth'] };
const empty: Stockpile = { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 };
function initialState() {
  const configured = configureRegionalIndustry(createRegionalIndustryState('britain', 99), { mode: 'pilot', originTerritoryId: 'london', destinationTerritoryId: 'portsmouth', equipmentKey: 'infantryEquipment', allocatedFactories: 1 }, { ...initialContext, week: 99 }).state;
  const staged = attributeRegionalIndustryReceipt(configured, { id: 'fixture-intake', nationId: 'britain', week: 100, stockpileDelta: { ...empty, infantryEquipment: 35 } }, initialContext).state;
  return planRegionalShipment(staged, { id: 'fixture-shipment', quantity: 12 }, initialContext).state;
}
function Verification() {
  const [state, setState] = useState(initialState);
  const [week, setWeek] = useState(100);
  const [blocked, setBlocked] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [stock, setStock] = useState(empty);
  const [request, setRequest] = useState<{ nationId: 'britain'; view: RegionalLogisticsView; shipmentId?: string; sequence: number } | null>(null);
  const context = { ...initialContext, week, authorized, playableTerritoryIds: blocked ? ['london'] : initialContext.playableTerritoryIds };
  const advance = () => {
    const result = advanceRegionalTransportWeek(state, { ...context, week: week + 1 });
    setState(result.state); setWeek(week + 1);
    setStock((previous) => ({ ...previous, infantryEquipment: previous.infantryEquipment + result.stockpileDelta.infantryEquipment }));
  };
  return <main style={{ maxWidth: 1700, margin: 'auto', padding: 28 }}>
    <header style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}><h1 style={{ fontSize: 22 }}>격리된 물류 검증</h1><button onClick={advance}>다음 결산</button><button onClick={() => setBlocked(!blocked)}>{blocked ? '경로 복구' : '경로 차단'}</button><button onClick={() => setAuthorized(!authorized)}>{authorized ? '열람 권한으로' : '집행 권한으로'}</button><button onClick={() => setRequest(null)}>관제판으로</button><output>제{week + 1}주 · 실제 도착 비축 {stock.infantryEquipment}개</output></header>
    {request ? <RegionalIndustryBoard key={request.sequence} state={state} context={context} nationalStockpile={stock} initialRequest={request}
      onConfigure={(configuration) => { const result = configureRegionalIndustry(state, configuration, context); setState(result.state); return result.applied; }}
      onPlanShipment={(quantity) => { const result = planRegionalShipment(state, { id: `fixture-${week}-${state.accounts.britain!.shipments.length}`, quantity }, context); setState(result.state); return result.applied; }}
      onCancelReserved={(id) => { const result = cancelRegionalReservedShipment(state, id, context); setState(result.state); return result.applied; }} />
      : <RegionalLogisticsScene state={state} context={context} onOpen={(view, shipmentId) => setRequest((previous) => ({ nationId: 'britain', view, shipmentId, sequence: (previous?.sequence ?? 0) + 1 }))} />}
  </main>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Verification />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
