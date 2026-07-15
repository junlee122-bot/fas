import { describe, expect, it } from 'vitest';
import { commanders, initialDivisions, initialProduction, territories } from './data';
import { calculateDefensivePower, calculateEnemyPower, calculateProductionGains, selectThreatenedTerritory } from './engine';

describe('weekly production', () => {
  it('converts assigned factories into deterministic stockpile gains', () => {
    expect(calculateProductionGains(initialProduction, 1)).toEqual({
      tanks: 189,
      aircraft: 408,
      infantryEquipment: 9576,
      convoys: 11,
      artillery: 72,
      trucks: 110,
    });
    expect(calculateProductionGains(initialProduction, 2).convoys).toBe(8);
  });
});

describe('Axis counteroffensive AI', () => {
  it('targets the weakest exposed Allied territory', () => {
    expect(selectThreatenedTerritory(territories, initialDivisions)?.id).toBe('caucasus');
  });

  it('honors the active player operation exclusion', () => {
    expect(selectThreatenedTerritory(territories, initialDivisions, 'caucasus')?.id).not.toBe('caucasus');
  });

  it('raises defensive power when a capable division is present', () => {
    const caucasus = territories.find((territory) => territory.id === 'caucasus');
    expect(caucasus).toBeDefined();
    if (!caucasus) return;

    const emptyDefense = calculateDefensivePower(caucasus, initialDivisions, commanders).power;
    const reinforcedDivisions = initialDivisions.map((division, index) => index === 0 ? { ...division, territoryId: 'caucasus' } : division);
    const reinforcedDefense = calculateDefensivePower(caucasus, reinforcedDivisions, commanders).power;

    expect(reinforcedDefense).toBeGreaterThan(emptyDefense);
  });

  it('clamps random pressure rolls to a stable range', () => {
    expect(calculateEnemyPower(68, 10, -1)).toBe(calculateEnemyPower(68, 10, 0));
    expect(calculateEnemyPower(68, 10, 2)).toBe(calculateEnemyPower(68, 10, 1));
  });
});
