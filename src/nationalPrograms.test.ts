import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  getNationalProgramMilestoneMarker,
  getNationalProgramProgress,
  getNationalProgramPulse,
  getNationalProgramReviewMarker,
  getNationalProgramStartedWeek,
  getNationalProgramStartMarker,
} from './nationalPrograms';

describe('national programs', () => {
  it('gives every playable nation three competing programs with distinct tones', () => {
    nations.forEach((nation) => {
      expect(nation.paths).toHaveLength(3);
      expect(new Set(nation.paths.map((path) => path.id)).size).toBe(3);
      expect(new Set(nation.paths.map((path) => path.tone))).toEqual(new Set(['reform', 'hardline', 'international']));
    });
  });

  it('tracks a selected program through 6, 13 and 26 week milestones', () => {
    const nation = nations[0];
    const program = nation.paths[0];
    const decisions = [getNationalProgramStartMarker(program.id, 4)];
    expect(getNationalProgramStartedWeek(program.id, decisions)).toBe(4);
    expect(getNationalProgramProgress(nation, program.id, decisions, 10)?.nextMilestone?.week).toBe(13);
    expect(getNationalProgramProgress(nation, program.id, decisions, 30)?.progress).toBe(100);
    expect(getNationalProgramProgress(nation, program.id, decisions, 30)?.phase).toBe('institutional');
    expect(getNationalProgramProgress(nation, program.id, decisions, 30)?.weeksUntilReview).toBe(13);
    expect(getNationalProgramProgress(nation, program.id, decisions, 30)?.nextReviewWeek).toBe(43);
  });

  it('applies cadence and prevents the same milestone from resolving twice', () => {
    const program = nations[0].paths.find((path) => path.tone === 'international');
    expect(program).toBeDefined();
    const sixthWeek = getNationalProgramPulse(program, 2, 8, []);
    expect(sixthWeek.milestone?.week).toBe(6);
    expect(sixthWeek.gameDelta.intelNetwork).toBe(4);
    const resolved = getNationalProgramPulse(program, 2, 8, [
      getNationalProgramMilestoneMarker(program!.id, 6),
    ]);
    expect(resolved.milestone).toBeNull();
  });

  it('reviews institutional programs every 13 weeks without duplicating rewards', () => {
    const program = nations[0].paths.find((path) => path.tone === 'reform');
    expect(program).toBeDefined();
    const review = getNationalProgramPulse(program, 2, 41, []);
    expect(review.review).toMatchObject({ week: 39, cycle: 1 });
    expect(review.gameDelta.stability).toBe(1);
    expect(review.gameDelta.treasury).toBe(-8);
    const resolved = getNationalProgramPulse(program, 2, 41, [
      getNationalProgramReviewMarker(program!.id, 39),
    ]);
    expect(resolved.review).toBeNull();
    expect(getNationalProgramPulse(program, 2, 54, []).review).toMatchObject({ week: 52, cycle: 2 });
  });
});
