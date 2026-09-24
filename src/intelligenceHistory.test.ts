import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  createEmergentIntelligenceCandidates,
  getEmergentIntelligenceFigures,
  intelligenceFigures,
  intelligenceOrganizations,
  resolveIntelligenceHistory,
} from './intelligenceHistory';
import { intelligenceWorldHistoryEvents } from './intelligenceWorldHistory';

describe('historical intelligence institutions and people', () => {
  it('models a broad, sourced and internally linked institution catalog', () => {
    expect(intelligenceOrganizations.length).toBeGreaterThanOrEqual(35);
    expect(intelligenceFigures.length).toBeGreaterThanOrEqual(40);
    expect(new Set(intelligenceOrganizations.map((organization) => organization.id)).size).toBe(intelligenceOrganizations.length);
    expect(new Set(intelligenceFigures.map((figure) => figure.id)).size).toBe(intelligenceFigures.length);

    const organizationIds = new Set(intelligenceOrganizations.map((organization) => organization.id));
    const eventIds = new Set(intelligenceWorldHistoryEvents.map((event) => event.id));
    intelligenceOrganizations.forEach((organization) => {
      expect(organization.sourceUrl.startsWith('https://')).toBe(true);
      expect(eventIds.has(organization.formationEventId), organization.id).toBe(true);
      [...organization.predecessorIds, ...organization.successorIds].forEach((id) => expect(organizationIds.has(id), `${organization.id} -> ${id}`).toBe(true));
    });
    intelligenceFigures.forEach((figure) => {
      expect(figure.sourceUrl.startsWith('https://')).toBe(true);
      expect(figure.organizationIds.length).toBeGreaterThan(0);
      figure.organizationIds.forEach((id) => expect(organizationIds.has(id), `${figure.id} -> ${id}`).toBe(true));
    });
  });

  it('gives every playable country at least one relevant historical network', () => {
    nations.forEach((nation) => {
      expect(intelligenceOrganizations.some((organization) => organization.nationIds.includes(nation.id)), nation.id).toBe(true);
      expect(intelligenceFigures.some((figure) => figure.accessNations.includes(nation.id)), nation.id).toBe(true);
    });
  });

  it('unlocks people by year and never makes modeled perpetrators recruitable', () => {
    const india1942 = getEmergentIntelligenceFigures('india', 1942);
    const india1947 = getEmergentIntelligenceFigures('india', 1947);
    expect(india1942.some((figure) => figure.id === 'rn-kao')).toBe(false);
    expect(india1947.some((figure) => figure.id === 'rn-kao')).toBe(true);

    const allCandidates = nations.flatMap((nation) => createEmergentIntelligenceCandidates(nation.id, 1975));
    const perpetratorIds = new Set(intelligenceFigures.filter((figure) => figure.role === 'perpetrator').map((figure) => `intel-${figure.id}`));
    expect(allCandidates.every((candidate) => !perpetratorIds.has(candidate.personId))).toBe(true);
  });

  it('preserves the COI to OSS to SSU to CIG to CIA lineage and postwar timing', () => {
    const organizations = new Map(resolveIntelligenceHistory([]).map((organization) => [organization.id, organization]));
    expect(organizations.get('coi')?.successorIds).toContain('oss');
    expect(organizations.get('oss')?.successorIds).toContain('ssu');
    expect(organizations.get('ssu')?.successorIds).toContain('cig');
    expect(organizations.get('cig')?.successorIds).toContain('cia');
    expect(organizations.get('cia')?.appearanceYear).toBe(1947);
    expect(organizations.get('cia')?.predecessorIds).toEqual(['cig']);
  });
});
