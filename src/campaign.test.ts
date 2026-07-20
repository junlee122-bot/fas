import { describe, expect, it } from 'vitest';
import {
  careerRoles,
  createCampaignDivisions,
  createCampaignProduction,
  createCareerState,
  createCareerCommanders,
  createDiplomaticRelations,
  createStaffRoster,
  createStaffCandidates,
  getNation,
  getNationCommandTerritoryId,
  getCareerStarCount,
  getPromotionThreshold,
  nations,
} from './campaign';
import { historicalPersonnel, historicalSupplementalPersonnel } from './historicalPersonnel';
import { getNationHistoricalEquipment } from './equipment';
import { territories } from './data';
import { selectThreatenedTerritory } from './engine';

describe('alternate-history career setup', () => {
  it('offers thirteen playable political entities and a five-tier career pyramid per nation', () => {
    expect(nations).toHaveLength(13);
    expect(careerRoles).toHaveLength(169);
    nations.forEach((nation) => {
      const roles = careerRoles.filter((role) => role.nationId === nation.id);
      expect(roles.map((role) => role.tier).sort()).toEqual([1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
      expect(roles.filter((role) => role.branch === 'politics')).toHaveLength(5);
      expect(roles.filter((role) => role.branch === 'military')).toHaveLength(4);
      expect(roles.filter((role) => role.branch === 'intelligence')).toHaveLength(4);
      expect(new Set(roles.map((role) => role.historicalHolderId)).size).toBe(13);
    });
    expect(getCareerStarCount(1)).toBe(5);
    expect(getCareerStarCount(5)).toBe(1);
    expect(getPromotionThreshold(5)).toBeLessThan(getPromotionThreshold(2));
  });

  it('creates nation-specific formations and production lines', () => {
    nations.forEach((nation) => {
      const divisions = createCampaignDivisions(nation);
      expect(divisions).toHaveLength(3);
      divisions.forEach((division) => {
        const territory = territories.find((item) => item.id === division.territoryId);
        expect(territory, division.territoryId).toBeDefined();
        if (nation.status === 'sovereign') expect(territory?.controller).toBe(nation.alignment);
      });
      const production = createCampaignProduction(nation);
      expect(production).toHaveLength(6);
      expect(production.reduce((total, line) => total + line.assigned, 0)).toBeLessThanOrEqual(nation.modifiers.factories ?? 29);
      expect(production[0].equipmentId).toBe(getNationHistoricalEquipment(nation.id).find((node) => node.category === 'armor')?.id);
      expect(createDiplomaticRelations(nation.id)).toHaveLength(nations.length - 1);
    });
  });

  it('starts lower-tier careers with a meaningful promotion ladder', () => {
    const career = createCareerState('china', 'china-tier3');
    expect(career.experience).toBeLessThan(100);
    expect(career.reputation).toBeLessThan(createCareerState('china', 'china-tier1').reputation);
  });

  it('separates the Korean government-in-exile command seat from the occupied homeland', () => {
    const korea = getNation('korea');
    expect(korea.capitalTerritoryId).toBe('korea');
    expect(getNationCommandTerritoryId(korea)).toBe('china_interior');
    expect(korea.operationalHeadquarters?.label).toContain('충칭');
    expect(territories.find((territory) => territory.id === korea.capitalTerritoryId)?.controller).toBe('axis');
    expect(territories.find((territory) => territory.id === getNationCommandTerritoryId(korea))?.controller).toBe('allies');
  });

  it('displaces the exact real person attached to newly expanded intelligence roles', () => {
    const role = careerRoles.find((item) => item.id === 'korea-intelligence-director')!;
    const candidates = createStaffCandidates('korea', role.id);
    const staff = createStaffRoster('korea', role.id);
    expect(candidates[0].personId).toBe(role.historicalHolderId);
    expect(candidates[0].availability).toBe('displaced');
    expect(staff.every((member) => member.personId !== role.historicalHolderId)).toBe(true);
  });

  it('builds a complete nation-specific backroom staff team', () => {
    nations.forEach((nation) => {
      const staff = createStaffRoster(nation.id);
      expect(staff).toHaveLength(7);
      expect(new Set(staff.map((member) => member.department)).size).toBe(7);
      expect(staff.some((member) => member.department === 'science')).toBe(true);
      expect(staff.some((member) => member.department === 'economy')).toBe(true);
      staff.forEach((member) => {
        expect(member.personId.length).toBeGreaterThan(3);
        expect(member.historicalOffice.length).toBeGreaterThan(2);
        expect(member.potential).toBeGreaterThanOrEqual(member.ability);
        expect(member.loyalty).toBeGreaterThan(0);
      });
      const candidates = createStaffCandidates(nation.id, nation.id + '-tier2');
      expect(candidates.length, nation.id).toBeGreaterThanOrEqual(8);
      expect(new Set(candidates.map((candidate) => candidate.personId)).size).toBe(candidates.length);
      expect(candidates.some((candidate) => candidate.department === 'science')).toBe(true);
      expect(candidates.some((candidate) => candidate.department === 'economy')).toBe(true);
      expect(candidates[0].personId).toBe(careerRoles.find((role) => role.id === nation.id + '-tier2')?.historicalHolderId);
      candidates.forEach((candidate) => {
        expect(candidate.knowledge).toBeLessThan(100);
        expect(candidate.historicalOffice.length).toBeGreaterThan(2);
      });
    });
  });

  it('uses real historical people for every modeled senior personnel slot', () => {
    nations.forEach((nation) => {
      const roster = historicalPersonnel[nation.id];
      const people = [...roster.roleHolders, ...roster.staff, ...roster.market, ...historicalSupplementalPersonnel[nation.id]];
      expect(people).toHaveLength(15);
      expect(new Set(people.map((person) => person.id)).size).toBe(15);
      expect(new Set(people.map((person) => person.name)).size).toBe(15);
      careerRoles.filter((role) => role.nationId === nation.id).forEach((role) => {
        expect(people.some((person) => person.id === role.historicalHolderId)).toBe(true);
      });
      const commanders = createCareerCommanders(nation, careerRoles.find((role) => role.id === nation.id + '-tier2')!);
      expect(commanders).toHaveLength(3);
      expect(commanders.slice(1).every((commander) => !commander.name.includes('참모단'))).toBe(true);
    });
    expect(Object.values(historicalSupplementalPersonnel).flat()).toHaveLength(26);
  });
});

describe('Asia-Pacific theater', () => {
  it('adds a large connected Asian theater', () => {
    const asia = territories.filter((territory) => territory.theater === 'asia');
    expect(asia).toHaveLength(110);
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
