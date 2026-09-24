import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { createJointForcesState, getAvailableJointOperationTemplates, getJointOperationObjectives } from './jointOperations';
import { getJointMapContext } from './jointMapContext';

const territory = (id: string) => {
  const result = territories.find((item) => item.id === id);
  if (!result) throw new Error('Missing map fixture ' + id);
  return result;
};

describe('map to joint command navigation', () => {
  it.each([
    ['channel', 'channel-air-zone', 'fighter-sweep'],
    ['atlantic', 'north-atlantic-route', 'atlantic-lifeline'],
    ['malta', 'mediterranean-route', 'atlantic-lifeline'],
    ['normandy', 'normandy-landing-sector', 'amphibious-cover'],
    ['truk', 'truk-rabaul-bases', 'carrier-strike'],
    ['leyte', 'philippines-landing-sector', 'amphibious-cover'],
    ['port_moresby', 'solomons-air-zone', 'fighter-sweep'],
  ])('preserves %s and preselects its documented objective only', (id, objectiveId, templateId) => {
    const state = createJointForcesState('britain');
    const before = structuredClone(state);
    const result = getJointMapContext(territory(id), state);
    expect(result).toMatchObject({ territoryId: id, territoryName: territory(id).name, objectiveId, templateId });
    expect(result.explanation).toContain('승인 전까지 변경되지 않습니다');
    expect(state).toEqual(before);
  });

  it('does not pretend that Singapore, Korea or an unregistered crossing is a Philippines landing objective', () => {
    const state = createJointForcesState('korea');
    for (const id of ['singapore', 'korea', 'coral_sea']) {
      const result = getJointMapContext(territory(id), state);
      expect(result.territoryId).toBe(id);
      expect(result.theater).toBe('asia');
      expect(result.objectiveId).toBeUndefined();
      expect(result.templateId).toBeUndefined();
      expect(result.explanation).toContain('이 전구 전체');
    }
  });

  it('falls back explicitly when a linked objective has been removed or assigned to another theater', () => {
    const state = createJointForcesState('britain');
    state.objectives.europe = [];
    expect(getJointMapContext(territory('channel'), state).objectiveId).toBeUndefined();
    const wrongTheater = { ...territory('truk'), theater: 'europe' as const };
    expect(getJointMapContext(wrongTheater, state).objectiveId).toBeUndefined();
  });

  it('uses current posture eligibility instead of proposing amphibious attack against a secure friendly objective', () => {
    const state = createJointForcesState('japan');
    const result = getJointMapContext(territory('leyte'), state);
    expect(result.objectiveId).toBe('philippines-landing-sector');
    expect(result.templateId).toBe('close-air-support');
  });

  it('does not invent a Pacific convoy-escort template when none exists in the engine', () => {
    const result = getJointMapContext(territory('hawaii'), createJointForcesState('usa'));
    expect(result.objectiveId).toBe('south-pacific-route');
    expect(result.templateId).toBe('armed-reconnaissance');
  });

  it('every returned template/target pair is supported by the current engine for every playable nation', () => {
    for (const nation of ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'] as const) {
      const state = createJointForcesState(nation);
      for (const point of territories) {
        const result = getJointMapContext(point, state);
        if (!result.templateId) continue;
        const template = getAvailableJointOperationTemplates(result.theater).find((item) => item.id === result.templateId)!;
        expect(template).toBeDefined();
        expect(getJointOperationObjectives(state, result.theater, template.kind).some((item) => item.id === result.objectiveId)).toBe(true);
      }
    }
  });
});
