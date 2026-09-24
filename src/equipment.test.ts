import { describe, expect, it } from 'vitest';
import { createCampaignDivisions, createCampaignProduction, nations } from './campaign';
import { calculateProductionGains } from './engine';
import {
  applyEquipmentToDivision,
  calculatePrototype,
  canResearchEquipment,
  createEquipmentDevelopment,
  equipmentModules,
  equipmentNodes,
  getNationHistoricalEquipment,
  normalizeEquipmentDevelopment,
} from './equipment';

describe('historical equipment database', () => {
  it('provides seven documented 1942-era starting systems for every playable nation', () => {
    expect(equipmentNodes).toHaveLength(nations.length * 7 + 32);
    nations.forEach((nation) => {
      const equipment = getNationHistoricalEquipment(nation.id);
      expect(equipment).toHaveLength(7);
      expect(new Set(equipment.map((node) => node.category)).size).toBe(7);
      expect(equipment.every((node) => node.authenticity === 'documented' && node.era === 'historical')).toBe(true);
    });
  });

  it('separates derived development paths from explicitly speculative technology', () => {
    const speculative = equipmentNodes.filter((node) => node.era === 'speculative');
    expect(speculative).toHaveLength(8);
    expect(speculative.every((node) => node.authenticity === 'speculative' && node.year === null)).toBe(true);
    expect(equipmentNodes.filter((node) => node.era === 'late-war')).toHaveLength(8);
  });
});

describe('equipment development lifecycle', () => {
  it('requires each category to move through its era chain', () => {
    const development = createEquipmentDevelopment('britain');
    const lateWarArmor = equipmentNodes.find((node) => node.category === 'armor' && node.era === 'late-war')!;
    const coldWarArmor = equipmentNodes.find((node) => node.category === 'armor' && node.era === 'cold-war')!;
    expect(canResearchEquipment(lateWarArmor, development, 'britain')).toBe(true);
    expect(canResearchEquipment(coldWarArmor, development, 'britain')).toBe(false);
    development.unlockedIds.push(lateWarArmor.id);
    expect(canResearchEquipment(coldWarArmor, development, 'britain')).toBe(true);
  });

  it('combines one module per slot into a bounded prototype with meaningful tradeoffs', () => {
    const base = getNationHistoricalEquipment('usa').find((node) => node.category === 'armor')!;
    const modules = ['platform', 'powerplant', 'weapon', 'protection', 'sensors', 'mission'].map((slot) => equipmentModules.find((module) => module.slot === slot && module.minimumEra === 'historical')!.id);
    const prototype = calculatePrototype(base.id, modules, 'M4 실험 전투체계', 12)!;
    expect(prototype.name).toBe('M4 실험 전투체계');
    expect(prototype.moduleIds).toHaveLength(6);
    Object.values(prototype.stats).forEach((value) => expect(value).toBeGreaterThanOrEqual(5));
    Object.values(prototype.stats).forEach((value) => expect(value).toBeLessThanOrEqual(100));
    expect(prototype.industrialCost).toBeGreaterThan(base.industrialCost);
    expect(calculatePrototype(base.id, [modules[0], modules[0]], '잘못된 설계', 12)).toBeNull();
  });

  it('migrates older saves while preserving national starting equipment', () => {
    const normalized = normalizeEquipmentDevelopment({ unlockedIds: ['missing-node'], progress: -10 }, 'japan');
    expect(normalized.unlockedIds).toHaveLength(7);
    expect(normalized.unlockedIds).not.toContain('missing-node');
    expect(normalized.progress).toBe(0);
  });

  it('turns assigned equipment quality into actual formation readiness', () => {
    const development = createEquipmentDevelopment('germany');
    const division = createCampaignDivisions(nations.find((nation) => nation.id === 'germany')!)[0];
    const armor = getNationHistoricalEquipment('germany').find((node) => node.category === 'armor')!;
    development.divisionAssignments[division.id] = armor.id;
    const equipped = applyEquipmentToDivision(division, development);
    expect(equipped.equipmentPackageId).toBe(armor.id);
    expect(equipped.strength).toBeGreaterThan(division.strength);
  });

  it('uses all six historically named production lines for weekly stockpile gains', () => {
    const production = createCampaignProduction(nations.find((nation) => nation.id === 'china')!);
    expect(production).toHaveLength(6);
    expect(production.every((line) => Boolean(line.equipmentId) && Boolean(line.reliability))).toBe(true);
    const gains = calculateProductionGains(production, 3);
    expect(gains.artillery).toBeGreaterThan(0);
    expect(gains.trucks).toBeGreaterThan(0);
  });
});
