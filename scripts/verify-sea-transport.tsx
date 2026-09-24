// Isolated local fixture: real engine transitions, no player save reads or writes.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SeaTransportScene, type SeaTransportSceneRequest } from '../src/SeaTransportScene';
import { SeaTransportBoard, createInitialSeaTransportSelection, type SeaTransportSelection } from '../src/SeaTransportBoard';
import { createJointForcesState } from '../src/jointOperations';
import { advanceSeaTransportWeek, createSeaTransportState, launchSeaTransport, launchSeaTransportRescue, requestSeaTransportReturn, dispatchSeaTransportEscortRelief, type SeaTransportContext, type SeaTransportResult } from '../src/seaTransport';
import type { Territory } from '../src/types';
const site = (id: string, name: string, neighbors: string[], controller: Territory['controller'] = 'allies', sea = false): Territory => ({ id, name, neighbors, controller, x: 0, y: 0, value: 5, supply: 80, region: '검증 전구', terrain: '해안', siteType: sea ? 'sea' : 'port', theater: 'europe' });
function initial(landing = false) {
  const context: SeaTransportContext = { week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war', commandableDivisionIds: new Set(['marine']), orders: [],
    divisions: [{ id: 'marine', name: '제1 해상원정사단', type: 'marine', territoryId: 'britain', status: 'ready', strength: 95, organization: 95, supply: 95, experience: 60, commanderId: 'general' }],
    territories: [site('britain', '영국 출발항', ['channel']), site('channel', '영불해협', ['britain', 'belfast', 'normandy'], 'allies', true), site('belfast', '벨파스트', ['channel']), site('normandy', '노르망디 해안', ['channel'], 'axis')],
    game: { week: 0, manpower: 400, politicalPower: 100, fuel: 100, steel: 50, factories: 10, stability: 70, warSupport: 70, commandPoints: 100, treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 60, enemyPressure: 50 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 100, artillery: 20, trucks: 10 }, jointForces: createJointForcesState('britain') };
  context.jointForces.theaterControl.europe = { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 };
  return apply(context, launchSeaTransport(createSeaTransportState(), { divisionId: 'marine', fromId: 'britain', targetId: landing ? 'normandy' : 'belfast' }, context));
}
function apply(context: SeaTransportContext, result: SeaTransportResult) {
  const game = { ...context.game, week: context.week };
  for (const [key, value] of Object.entries(result.gameDelta)) game[key as keyof typeof game] += value;
  return { state: result.state, context: { ...context, game, stockpile: { ...context.stockpile, convoys: context.stockpile.convoys + result.convoyDelta, aircraft: context.stockpile.aircraft + (result.aircraftDelta ?? 0) },
    divisions: context.divisions.map(unit => result.divisionUpdates.find(update => update.id === unit.id) ?? unit),
    territories: context.territories.map(site => [...result.territoryUpdates].reverse().find(update => update.id === site.id) ?? site),
    jointForces: { ...context.jointForces, fleets: context.jointForces.fleets.map(fleet => [...(result.fleetUpdates ?? [])].reverse().find(update => update.id === fleet.id) ?? fleet), airGroups: context.jointForces.airGroups.map(group => [...(result.airGroupUpdates ?? [])].reverse().find(update => update.id === group.id) ?? group) } } };
}
function Verification() {
  const [run, setRun] = useState(() => initial());
  const [selection, setSelection] = useState<SeaTransportSelection | null>(null);
  const [location, setLocation] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const context = { ...run.context, commandableDivisionIds: readOnly ? new Set<string>() : run.context.commandableDivisionIds };
  const step = () => { const next = { ...run.context, week: run.context.week + 1 }; setRun(apply(next, advanceSeaTransportWeek(run.state, next))); };
  const open = (request: SeaTransportSceneRequest) => setSelection({ ...createInitialSeaTransportSelection({ state: run.state, context }), ...request });
  return <main style={{ maxWidth: 1740, margin: 'auto', padding: 28 }}>
    <header style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}><h1 style={{ fontSize: 20 }}>격리 해상 수송 검증</h1><button onClick={step}>다음 결산</button><button onClick={() => { setRun(initial()); setSelection(null); }}>아군항 수송 초기화</button><button onClick={() => { setRun(initial(true)); setSelection(null); }}>상륙작전 초기화</button><button onClick={() => setReadOnly(!readOnly)}>{readOnly ? '지휘 권한으로' : '열람 권한으로'}</button><button onClick={() => setSelection(null)}>관제판으로</button><output>제{run.context.week + 1}주 · 가용 수송선 {run.context.stockpile.convoys}척 · 실제 부대 위치 {run.context.divisions[0].territoryId}</output></header>
    <output aria-label="지도 이동 요청">{location}</output>
    {selection ? <SeaTransportBoard state={run.state} context={context} selection={selection} onSelectionChange={patch => setSelection(current => ({ ...current!, ...patch }))}
      onLaunch={plan => setRun(apply(context, launchSeaTransport(run.state, plan, context)))} onReturn={id => setRun(current => ({ ...current, state: requestSeaTransportReturn(current.state, id, context.week) }))}
      onRescue={(id, fleet) => setRun(apply(context, launchSeaTransportRescue(run.state, id, context, fleet)))} onEscortRelief={(id, fleet) => setRun(apply(context, dispatchSeaTransportEscortRelief(run.state, id, fleet, context)))} onOpenLocation={setLocation} />
      : <SeaTransportScene state={run.state} context={context} onOpen={open} onOpenLocation={setLocation} />}
  </main>;
}
const root = createRoot(document.getElementById('root')!); root.render(<Verification />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
