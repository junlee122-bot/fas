import { describe, expect, it } from 'vitest';
import {
  careerRoles,
  createCampaignDivisions,
  createCampaignProduction,
  createCareerState,
  createDiplomaticRelations,
  getNation,
  nations,
} from './campaign';
import { territories } from './data';
import { selectThreatenedTerritory } from './engine';

describe('alternate-history career setup', () => {
  it('offers nine playable nations and three appointment tiers per nation', () => {
    expect(nations).toHaveLength(9);
    expect(careerRoles).toHaveLength(27);
    nations.forEach((nation) => {
      expect(careerRoles.filter((role) => role.nationId === nation.id).map((role) => role.tier).sort()).toEqual([1, 2, 3]);
    });
  });

  it('creates nation-specific formations and production lines', () => {
    nations.forEach((nation) => {
      const divisions = createCampaignDivisions(nation);
      expect(divisions).toHaveLength(3);
      divisions.forEach((division) => {
        const territory = territories.find((item) => item.id === division.territoryId);
        expect(territory, division.territoryId).toBeDefined();
        expect(territory?.controller).toBe(nation.alignment);
      });
      expect(createCampaignProduction(nation)[0].name).toBe(nation.equipment[0]);
      expect(createDiplomaticRelations(nation.id)).toHaveLength(8);
    });
  });

  it('starts lower-tier careers with a meaningful promotion ladder', () => {
    const career = createCareerState('china', 'china-tier3');
    expect(career.experience).toBeLessThan(100);
    expect(career.reputation).toBeLessThan(createCareerState('china', 'china-tier1').reputation);
  });
});

describe('Asia-Pacific theater', () => {
  it('adds a large connected Asian theater', () => {
    const asia = territories.filter((territory) => territory.theater === 'asia');
    expect(asia).toHaveLength(23);
    asia.forEach((territory) => {
      territory.neighbors.forEach((neighborId) => expect(territories.some((item) => item.id === neighborId), neighborId).toBe(true));
    });
  });

  it('lets the opposing AI evaluate an Axis player from the correct perspective', () => {
    const japan = getNation('japan');
    const target = selectThreatenedTerritory(territories, createCampaignDivisions(japan), undefined, 'axis', 'asia');
    expect(target).toBeDefined();
    expect(target?.controller).toBe('axis');
    expect(target?.neighbors.some((neighborId) => territories.find((item) => item.id === neighborId)?.controller === 'allies')).toBe(true);
  });
});
