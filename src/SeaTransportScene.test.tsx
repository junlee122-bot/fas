import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SeaTransportScene } from './SeaTransportScene';
import { advanceSeaTransportWeek, createSeaTransportState, launchSeaTransport, requestSeaTransportReturn, type SeaTransportContext } from './seaTransport';
import { createJointForcesState } from './jointOperations';
import type { Territory } from './types';
const site = (id: string, neighbors: string[], sea = false): Territory => ({ id, name: id === 'britain' ? '영국항' : id === 'channel' ? '영불해협' : '벨파스트', neighbors, controller: 'allies', x: 0, y: 0, value: 5, supply: 80, region: '검증 전구', terrain: '해안', siteType: sea ? 'sea' : 'port', theater: 'europe' });
function fixture() {
  const context: SeaTransportContext = { week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war', commandableDivisionIds: new Set(['marine']), orders: [],
    divisions: [{ id: 'marine', name: '해상원정사단', type: 'marine', territoryId: 'britain', status: 'ready', strength: 95, organization: 95, supply: 95, experience: 60, commanderId: 'general' }],
    territories: [site('britain', ['channel']), site('channel', ['britain', 'belfast'], true), site('belfast', ['channel'])],
    game: { week: 0, manpower: 400, politicalPower: 100, fuel: 100, steel: 50, factories: 10, stability: 70, warSupport: 70, commandPoints: 100, treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 60, enemyPressure: 50 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 100, artillery: 20, trucks: 10 }, jointForces: createJointForcesState('britain') };
  const result = launchSeaTransport(createSeaTransportState(), { divisionId: 'marine', fromId: 'britain', targetId: 'belfast' }, context);
  expect(result.accepted).toBe(true);
  return { state: result.state, context, onOpen: vi.fn(), onOpenLocation: vi.fn() };
}
describe('sea transport scene', () => {
  it('shows the real reservation without dispatching, advancing or modifying state', () => {
    const props = fixture(); const before = structuredClone(props.state);
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).toContain('해상 수송 관제판'); expect(html).toContain('영국항 → 벨파스트');
    expect(html).toContain('승선 준비'); expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('최소 1회 결산'); expect(html).toContain('정밀 해도가 아닙니다');
    expect(html).toContain('호위 함대의 귀항·급유 완료는 별개');
    expect(props.state).toEqual(before); expect(props.onOpen).not.toHaveBeenCalled(); expect(props.onOpenLocation).not.toHaveBeenCalled();
  });
  it('moves the stage only when the weekly engine advances', () => {
    const props = fixture(); const context = { ...props.context, week: 1 };
    const result = advanceSeaTransportWeek(props.state, context);
    const html = renderToStaticMarkup(<SeaTransportScene {...props} context={context} state={result.state} />);
    expect(html).toContain('현재 단계 / 해상 항해');
    expect(html).toMatch(/aria-current="step"[^]*?<strong>해상 항해<\/strong>/);
    expect(html).toContain('하선·재편'); expect(html).not.toContain('하선·재편 완료');
  });
  it('shows accepted recall as pending, not an instant return or refund', () => {
    const props = fixture(); props.state = requestSeaTransportReturn(props.state, props.state.operations[0].id, 0);
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).toContain('철회 요청 접수'); expect(html).toContain('일정 확정 불가');
    expect(html).not.toContain('철회·귀환 완료');
  });
  it('shows stranded transport as requiring rescue rather than completed landing', () => {
    const props = fixture(); props.state.operations[0] = { ...props.state.operations[0], stage: 'waiting-return', convoysRemaining: 0 };
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).toContain('구조선 파견 검토'); expect(html).toContain('일정 확정 불가');
    expect(html).not.toContain('data-status="complete"');
  });
  it('offers report navigation, never direct commands, outside authority', () => {
    const props = fixture(); props.context.commandableDivisionIds = new Set();
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).toContain('이 수송의 보고·권한 확인'); expect(html).toContain('직접 명령할 수 없는 수송');
    expect(html).not.toContain('최종 승인'); expect(props.onOpen).not.toHaveBeenCalled();
  });
  it('separates the current return port from the originally planned destination', () => {
    const props = fixture(); props.state.operations[0] = { ...props.state.operations[0], stage: 'returning', returnTargetId: 'britain', returnRouteIds: ['belfast', 'channel', 'britain'], returnWeeks: 2 };
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).toContain('이번 귀환 목적지: <strong>영국항</strong>'); expect(html).toContain('귀환 목적지 지도');
    expect(html).toContain('아직 도착한 것은 아닙니다');
  });
  it('does not expose foreign or future launches', () => {
    const props = fixture(); props.state.operations.push({ ...props.state.operations[0], id: 'foreign', nationId: 'japan', divisionName: 'foreign-secret' }, { ...props.state.operations[0], id: 'future', startedWeek: 5, divisionName: 'future-secret' });
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).not.toContain('foreign-secret'); expect(html).not.toContain('future-secret'); expect(html).toContain('진행 중<strong>1건');
  });
  it('distinguishes unavailable future settlement data from zero activity', () => {
    const props = fixture(); props.state.lastProcessedWeek = 8;
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).toContain('관제 자료 확인 필요'); expect(html).not.toContain('진행 중<strong>0건');
  });
  it('has an honest empty state and no fictional ship movement', () => {
    const props = fixture(); props.state = createSeaTransportState();
    const html = renderToStaticMarkup(<SeaTransportScene {...props} />);
    expect(html).toContain('진행 중인 해상 수송이 없습니다'); expect(html).not.toContain('aria-current="step"');
    expect(html).toContain('수송 계획·권한 확인'); expect(html).not.toContain('progressbar');
  });
});
