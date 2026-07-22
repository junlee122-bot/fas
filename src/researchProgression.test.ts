import { describe, expect, it } from 'vitest';
import { initialResearch } from './data';
import { advanceResearchProjects, fillOpenResearchSlots, getResearchAvailability, normalizeResearchProjects } from './researchProgression';

describe('long-horizon research progression', () => {
  it('locks future generations behind both year and prerequisite conditions', () => {
    const transistor = initialResearch.find((item) => item.id === 'transistor')!;
    expect(getResearchAvailability(transistor, initialResearch, 1949)).toMatchObject({ available: false, yearReady: false });
    expect(getResearchAvailability(transistor, initialResearch, 1950)).toMatchObject({ available: false, yearReady: true, prerequisitesReady: false });
    const completedRadar = initialResearch.map((item) => item.id === 'radar' ? { ...item, complete: true } : item);
    expect(getResearchAvailability(transistor, completedRadar, 1950).available).toBe(true);
  });

  it('fills only available slots and advances active research deterministically', () => {
    const idle = initialResearch.map((item) => ({ ...item, active: false }));
    const assigned = fillOpenResearchSlots(idle, 1942);
    expect(assigned.filter((item) => item.active)).toHaveLength(2);
    expect(assigned.filter((item) => item.active).every((item) => (item.minimumYear ?? 1942) <= 1942)).toBe(true);
    const advanced = advanceResearchProjects(assigned, 25, 1942);
    expect(advanced.filter((item) => item.active).every((item) => item.progress > 0)).toBe(true);
  });

  it('appends newly introduced projects when loading an old six-project save', () => {
    const oldSave = initialResearch.slice(0, 6).map((item) => ({ ...item, progress: 77 }));
    const restored = normalizeResearchProjects(oldSave, initialResearch);
    expect(restored).toHaveLength(initialResearch.length);
    expect(restored.find((item) => item.id === 'radar')?.progress).toBe(77);
    expect(restored.some((item) => item.id === 'pandemic-readiness')).toBe(true);
  });
});
