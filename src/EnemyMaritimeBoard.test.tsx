import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EnemyMaritimeBoard, getEnemyMaritimeIntel } from './EnemyMaritimeBoard';
import { advanceEnemyMaritimeWeek, createEnemyMaritimeState, type EnemyMaritimeContext } from './enemyMaritime';
import { createJointForcesState } from './jointOperations';
import { createFleetNavigation } from './navalNavigation';
import { createSeaTransportState } from './seaTransport';
import type { Territory } from './types';

function enemyContext(_kind?: string): EnemyMaritimeContext {
  const jointForces = createJointForcesState('britain');
  const fleet = { ...jointForces.opponent.fleets[0], kind: 'surface' as const, location: 'hamburg' }; fleet.navigation = createFleetNavigation(fleet);
  jointForces.opponent.fleets = [fleet];
  const site = (id: string, patch: Partial<Territory> = {}): Territory => ({ id, name: id, region: '', x: 0, y: 0, controller: 'axis', ownerId: 'germany', supply: 80, value: 10, terrain: '해안', siteType: 'port', theater: 'europe', neighbors: ['northsea'], ...patch });
  return { week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war', divisions: [], jointForces, seaTransport: createSeaTransportState(),
    territories: [site('hamburg'), site('northsea', { siteType: 'sea', neighbors: ['hamburg', 'britain'] }), site('britain', { controller: 'allies', ownerId: 'britain', supply: 20 })] };
}

describe('enemy maritime intelligence board', () => {
  it('does not leak hidden plans, destination, fleet name or true stock levels', () => {
    const context = enemyContext('landing'); const state = advanceEnemyMaritimeWeek(createEnemyMaritimeState('britain'), context).state;
    state.operations[0].fleetName = 'SECRET FLEET'; state.operations[0].targetId = 'SECRET TARGET';
    expect(getEnemyMaritimeIntel(state, context)).toEqual([]);
    const html = renderToStaticMarkup(<EnemyMaritimeBoard state={state} context={context} />);
    expect(html).toContain('확인된 적 해상 움직임이 없습니다'); expect(html).not.toContain('SECRET'); expect(html).not.toContain('남은 수송선');
  });
  it('uses the last observed node and stage, not a hidden live position', () => {
    const context = enemyContext('landing'); context.week = 8;
    const state = advanceEnemyMaritimeWeek(createEnemyMaritimeState('britain'), { ...context, week: 0 }).state;
    Object.assign(state.operations[0], { detected: true, confidence: 82, lastKnownNodeId: 'hamburg', lastKnownStage: 'preparing', currentNodeId: 'northsea', stage: 'sailing', lastObservedWeek: 4, detectedWeek: 4 });
    const intel = getEnemyMaritimeIntel(state, context)[0]; expect(intel.locationName).toBe('hamburg'); expect(intel.stage).toBe('승선·집결'); expect(intel.targetName).toBeUndefined();
    const html = renderToStaticMarkup(<EnemyMaritimeBoard state={state} context={context} />);
    expect(html).toContain('4주 전 관측'); expect(html).toContain('현재 위치나 진행 단계가 아닙니다'); expect(html).toContain('목적지 미확인');
  });
  it('labels high-confidence recent destinations as estimates with counterplay advice', () => {
    const context = enemyContext('landing'); const state = advanceEnemyMaritimeWeek(createEnemyMaritimeState('britain'), context).state;
    Object.assign(state.operations[0], { detected: true, confidence: 82, lastKnownNodeId: 'northsea', lastKnownStage: 'sailing', lastObservedWeek: 0, detectedWeek: 0 });
    const html = renderToStaticMarkup(<EnemyMaritimeBoard state={state} context={context} onOpenLocation={() => undefined} onOpenJointOperations={() => undefined} />);
    expect(html).toContain('예상 목적지'); expect(html).toContain('britain'); expect(html).toContain('마지막 관측 지점 보기'); expect(html).toContain('해공군 대응 계획'); expect(html).toContain('상륙은 도착 즉시 점령되지 않습니다');
  });
  it('clearly explains the peace stand-down without claiming all enemy fleets disappeared', () => {
    const context = enemyContext(); context.phase = 'nation';
    const html = renderToStaticMarkup(<EnemyMaritimeBoard state={createEnemyMaritimeState('britain')} context={context} />);
    expect(html).toContain('새 적 전투 작전은 중지'); expect(html).toContain('귀항·급유');
  });
});
