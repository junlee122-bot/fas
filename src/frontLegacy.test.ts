import { describe, expect, it } from 'vitest';
import { strategicFronts } from './strategicMapData';
import {
  assessBattleRecognition,
  deriveFrontStandouts,
  getDecorationOptions,
  getHistoricalFrontFigures,
  recognizeBattle,
} from './frontLegacy';
import type { BattleReport, Commander, Division } from './types';

const report: BattleReport = {
  id: 'battle-1',
  week: 12,
  divisionId: 'division-1',
  divisionName: '제1시험사단',
  commanderId: 'commander-1',
  commanderName: '시험 지휘관',
  targetId: 'target-1',
  targetName: '카시노·수도원 고지',
  targetValue: 10,
  frontId: 'italian-peninsula',
  terrain: '산악 요새',
  stance: 'balanced',
  victory: true,
  margin: 18,
  phases: [] as unknown as BattleReport['phases'],
  attackerStrengthLoss: 5,
  defenderStrengthLoss: 19,
  organizationLoss: 12,
  supplySpent: 11,
  summary: '돌파 성공',
};

describe('front legacy and recognition', () => {
  it('provides a historical baseline for every declared front', () => {
    strategicFronts.forEach((front) => {
      expect(getHistoricalFrontFigures(front.id).length, front.id).toBeGreaterThanOrEqual(2);
    });
  });

  it('unlocks battle naming and an appropriate decoration ceiling after a major success', () => {
    const assessment = assessBattleRecognition(report);
    expect(assessment.eligible).toBe(true);
    expect(assessment.maximumTier).toBe('supreme');
    expect(assessment.suggestedBattleName).toBe('카시노 전투');
    expect(getDecorationOptions('britain', 1942, assessment.maximumTier).map((item) => item.id))
      .toEqual(['uk-mid', 'uk-mc', 'uk-dso']);
  });

  it('records the player-approved battle name, medal and citation', () => {
    const recognized = recognizeBattle(report, {
      nationId: 'britain',
      year: 1942,
      battleName: '수도원 고지 전투',
      decorationId: 'uk-dso',
      citation: '불리한 지형에서 예비대를 적시에 투입해 돌파구를 확보함.',
    });
    expect(recognized.battleName).toBe('수도원 고지 전투');
    expect(recognized.decoration).toMatchObject({ name: '수훈장', tier: 'supreme' });
  });

  it('ranks actual campaign performers above merely deployed commanders', () => {
    const commanders: Commander[] = [
      { id: 'commander-1', name: '시험 지휘관', rank: '중장', initials: 'TC', color: '#000', command: 70, attack: 70, defense: 70, logistics: 70, trait: '시험', specialty: '시험', fatigue: 0, loyalty: 80 },
      { id: 'commander-2', name: '배치 지휘관', rank: '소장', initials: 'DC', color: '#111', command: 65, attack: 65, defense: 65, logistics: 65, trait: '시험', specialty: '시험', fatigue: 0, loyalty: 80 },
    ];
    const divisions: Division[] = [{ id: 'division-2', name: '제2시험사단', type: 'infantry', strength: 90, organization: 80, experience: 40, supply: 70, territoryId: 'target-1', commanderId: 'commander-2', status: 'ready' }];
    const recognized = recognizeBattle(report, { nationId: 'britain', year: 1942, decorationId: 'uk-dso' });
    const standouts = deriveFrontStandouts('italian-peninsula', [recognized], commanders, divisions, ['target-1']);

    expect(standouts[0]).toMatchObject({ name: '시험 지휘관', victories: 1, decorations: 1 });
    expect(standouts[1]).toMatchObject({ name: '배치 지휘관', battles: 0 });
  });
});
