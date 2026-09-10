import { describe, expect, it } from 'vitest';
import { careerRoles, getRole, nations } from './campaign';
import {
  CIVILIAN_POSSIBILITY_BASE,
  advanceCivilianCareerWeek,
  civilianActions,
  civilianOrigins,
  civilianProfessions,
  createCivilianCareerState,
  enterCivilianInstitution,
  getCivilianCareerSignature,
  getCivilianInstitutionReadiness,
  getCivilianRoleId,
  resolveCivilianAction,
} from './civilianCareer';

describe('civilian career', () => {
  it('keeps civilian starts separate from the 169 historical office roles', () => {
    expect(careerRoles).toHaveLength(169);
    expect(civilianProfessions).toHaveLength(12);
    expect(civilianOrigins).toHaveLength(4);
    expect(civilianActions).toHaveLength(6);
    expect(CIVILIAN_POSSIBILITY_BASE).toBe(864);

    nations.forEach((nation) => {
      civilianProfessions.forEach((profession) => {
        const role = getRole(getCivilianRoleId(nation.id, profession.id), nation.id);
        expect(role.title).toBe(profession.name);
        expect(role.authority).toBe(12);
        expect(role.historicalHolderId).toBe('civilian-self');
      });
    });
  });

  it('creates at least 144 distinct profession, origin and life-principle openings', () => {
    const signatures = new Set<string>();
    const doctrines = ['coalition', 'methodical', 'maneuver'];
    civilianProfessions.forEach((profession) => {
      civilianOrigins.forEach((origin) => {
        doctrines.forEach((doctrine) => {
          const state = createCivilianCareerState(profession.id, origin.id);
          signatures.add(`${doctrine}:${getCivilianCareerSignature(state)}`);
        });
      });
    });
    expect(signatures.size).toBe(144);
  });

  it('turns repeated civilian choices into career growth and an earned institutional route', () => {
    let state = createCivilianCareerState('intellectual', 'university-network');
    const actionSequence = [
      'publish-public-work',
      'build-professional-circle',
      'serve-local-community',
      'secure-independent-funding',
      'launch-public-campaign',
      'publish-public-work',
    ];

    actionSequence.forEach((actionId, index) => {
      const week = index * 14;
      const resolution = resolveCivilianAction(state, actionId, week);
      expect(resolution).not.toBeNull();
      state = resolution!.state;
      state = advanceCivilianCareerWeek(state);
    });

    const readiness = getCivilianInstitutionReadiness(state);
    expect(readiness.ready).toBe(true);
    expect(state.actionHistory).toHaveLength(actionSequence.length);
    expect(state.worldInfluences.length).toBeGreaterThan(2);

    const target = careerRoles.find((role) => role.nationId === 'korea' && role.tier === 5 && readiness.branches.includes(role.branch));
    expect(target).toBeDefined();
    const entered = enterCivilianInstitution(state, target!.id);
    expect(entered.stage).toBe('institutional-insider');
    expect(entered.enteredOfficeRoleId).toBe(target!.id);
    expect(getCivilianCareerSignature(entered)).toContain(target!.id);
  });
});
