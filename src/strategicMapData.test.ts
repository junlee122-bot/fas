import { describe, expect, it } from 'vitest';
import {
  deriveStrategicFrontChronology,
  getPeriodAppropriateTerritory,
  getStrategicFrontTimeState,
  strategicFronts,
} from './strategicMapData';
import type { StrategicFrontDefinition } from './strategicMapData';
import type { Territory } from './types';

const testFront: StrategicFrontDefinition = {
  id: 'test-front',
  name: '시험 전선',
  theater: 'europe',
  commandArea: '갑–을',
  historicalWindow: '1943–1944',
  sourceUrl: 'https://example.com',
};

const makeTerritories = (memberController: Territory['controller'] = 'allies', neighborController: Territory['controller'] = 'allies'): Territory[] => [
  { id: 'member', name: '갑', region: '시험', x: 1, y: 1, controller: memberController, value: 5, supply: 60, terrain: '평야', neighbors: ['neighbor'], frontId: testFront.id, siteType: 'front' },
  { id: 'neighbor', name: '을', region: '시험', x: 2, y: 1, controller: neighborController, value: 5, supply: 60, terrain: '평야', neighbors: ['member'], siteType: 'region' },
];

describe('strategic map chronology', () => {
  it('does not expose a future front before its historical opening', () => {
    const italy = strategicFronts.find((front) => front.id === 'italian-peninsula')!;
    const kursk = strategicFronts.find((front) => front.id === 'kursk-orel')!;
    expect(getStrategicFrontTimeState(italy, 1942)).toBe('not-formed');
    expect(getStrategicFrontTimeState(italy, 1943)).toBe('historical-window');
    expect(getStrategicFrontTimeState(kursk, 1942)).toBe('not-formed');
    expect(getStrategicFrontTimeState(kursk, 1943)).toBe('historical-window');
  });

  it('renames future battle labels and detaches their front in 1942', () => {
    const territory = getPeriodAppropriateTerritory({
      id: 'anzio', name: '안치오 교두보', region: '이탈리아 전선', x: 1, y: 1,
      controller: 'axis', value: 6, supply: 50, terrain: '해안', neighbors: [],
      frontId: 'italian-peninsula', siteType: 'front',
    }, 1942);
    expect(territory.name).toBe('안치오 항구');
    expect(territory.frontId).toBeUndefined();
    expect(territory.siteType).toBe('region');
  });

  it('keeps an untouched future front scheduled and invisible', () => {
    const territories = makeTerritories();
    const [entry] = deriveStrategicFrontChronology([testFront], {
      year: 1942,
      phase: 'war',
      territories,
      baselineTerritories: territories,
    });
    expect(entry.state).toBe('scheduled');
    expect(entry.visible).toBe(false);
    expect(entry.yearsUntil).toBe(1);
  });

  it('forms a future front early after a campaign control change', () => {
    const baseline = makeTerritories('allies', 'allies');
    const territories = makeTerritories('axis', 'allies');
    const [entry] = deriveStrategicFrontChronology([testFront], {
      year: 1942,
      phase: 'war',
      territories,
      baselineTerritories: baseline,
    });
    expect(entry.state).toBe('diverged-early');
    expect(entry.visible).toBe(true);
    expect(entry.activeContactCount).toBe(1);
  });

  it('continues an expired front only while conflict or changed control remains', () => {
    const peaceful = makeTerritories('allies', 'allies');
    const hostile = makeTerritories('allies', 'axis');
    const [dormant] = deriveStrategicFrontChronology([testFront], {
      year: 1945,
      phase: 'war',
      territories: peaceful,
      baselineTerritories: peaceful,
    });
    const [continuing] = deriveStrategicFrontChronology([testFront], {
      year: 1945,
      phase: 'war',
      territories: hostile,
      baselineTerritories: hostile,
    });
    expect(dormant.state).toBe('dormant');
    expect(dormant.visible).toBe(false);
    expect(continuing.state).toBe('alternate-continuation');
    expect(continuing.visible).toBe(true);
  });

  it('archives wartime fronts after the campaign enters national administration', () => {
    const territories = makeTerritories('allies', 'axis');
    const [entry] = deriveStrategicFrontChronology([testFront], {
      year: 1950,
      phase: 'nation',
      territories,
      baselineTerritories: territories,
    });
    expect(entry.state).toBe('postwar-legacy');
    expect(entry.visible).toBe(false);
  });

  it('uses the dynamic visibility set when detaching a dormant front marker', () => {
    const territory = makeTerritories()[0];
    const periodTerritory = getPeriodAppropriateTerritory(territory, 1945, [testFront], new Set());
    expect(periodTerritory.frontId).toBeUndefined();
    expect(periodTerritory.siteType).toBe('region');
  });
});
