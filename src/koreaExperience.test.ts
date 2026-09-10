import { describe, expect, it } from 'vitest';
import { assessKoreaLiberationReadiness, deriveKoreaLiberationTracks, getKoreaRoleGuide } from './koreaExperience';
import type { Territory } from './types';

const homeland = (controller: Territory['controller']): Territory => ({
  id: 'korea', name: '일제강점기 조선', region: '한반도', x: 70, y: 33,
  controller, ownerId: 'japan', value: 9, supply: 76, terrain: '산악', neighbors: ['manchuria'], theater: 'asia',
});

describe('Korea campaign experience', () => {
  it('separates diplomatic, clandestine, military and homecoming readiness', () => {
    const tracks = deriveKoreaLiberationTracks({
      politicalPower: 74,
      stability: 57,
      warSupport: 68,
      intelNetwork: 78,
      averageStrength: 72,
      averageSupply: 64,
      objectiveProgress: 22,
      territories: [homeland('axis')],
    });

    expect(tracks.map((track) => track.id)).toEqual(['recognition', 'network', 'force', 'return']);
    expect(tracks.find((track) => track.id === 'network')).toMatchObject({ value: 78, state: '진전', tab: 'intelligence' });
    expect(tracks.find((track) => track.id === 'return')?.detail).toContain('일제 점령');
  });

  it('updates the homeland explanation after liberation', () => {
    const tracks = deriveKoreaLiberationTracks({
      politicalPower: 80, stability: 75, warSupport: 80, intelNetwork: 85,
      averageStrength: 80, averageSupply: 80, objectiveProgress: 90,
      territories: [homeland('allies')],
    });
    expect(tracks.find((track) => track.id === 'return')?.detail).toContain('한반도 거점을 확보');
  });

  it('gives each Korean career branch a distinct first destination and authority boundary', () => {
    expect(getKoreaRoleGuide('politics').destination).toBe('diplomacy');
    expect(getKoreaRoleGuide('military').destination).toBe('army');
    expect(getKoreaRoleGuide('intelligence').destination).toBe('intelligence');
    expect(getKoreaRoleGuide('military').authorityBoundary).toContain('정치 지도부');
  });

  it('blocks a premature state transition and explains the missing liberation tracks', () => {
    const assessment = assessKoreaLiberationReadiness({
      politicalPower: 44,
      stability: 50,
      warSupport: 48,
      intelNetwork: 36,
      averageStrength: 48,
      averageSupply: 41,
      objectiveProgress: 18,
      victoryScore: 22,
      battleVictories: 1,
      relationAverage: 47,
      weeksElapsed: 52,
      territories: [homeland('axis')],
    });

    expect(assessment.eligible).toBe(false);
    expect(assessment.outcome).toBe('contested-transition');
    expect(assessment.blockedTrackIds).toContain('return');
    expect(assessment.partitionRisk).toBeGreaterThan(55);
  });

  it('rewards combined diplomacy, organization, armed force and homecoming preparation', () => {
    const assessment = assessKoreaLiberationReadiness({
      politicalPower: 92,
      stability: 82,
      warSupport: 86,
      intelNetwork: 84,
      averageStrength: 86,
      averageSupply: 82,
      objectiveProgress: 84,
      victoryScore: 88,
      battleVictories: 8,
      relationAverage: 76,
      weeksElapsed: 182,
      territories: [homeland('allies')],
    });

    expect(assessment.eligible).toBe(true);
    expect(assessment.blockedTrackIds).toEqual([]);
    expect(assessment.outcome).not.toBe('contested-transition');
    expect(assessment.partitionRisk).toBeLessThan(35);
  });
});
