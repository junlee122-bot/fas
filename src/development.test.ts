import { describe, expect, it } from 'vitest';
import type { BattleReport, Commander, CommanderDevelopment } from './types';
import {
  applyCommanderDevelopment,
  getAvailableSkillPoints,
  getBattleHonor,
  getCommanderLevel,
  recordBattleExperience,
  recoverCommanderFatigue,
  restCommander,
  unlockCommanderSkill,
} from './development';

const commander: Commander = {
  id: 'test', name: '시험 지휘관', rank: '중장', initials: 'TC', color: '#000', command: 70,
  attack: 68, defense: 72, logistics: 66, trait: '시험', specialty: '시험', fatigue: 20, loyalty: 90,
};

const record: CommanderDevelopment = { commanderId: 'test', xp: 0, battles: 0, victories: 0, fatigue: 20, skills: [] };

const report = {
  victory: true,
  margin: 12,
  targetName: '알제리',
} as BattleReport;

describe('commander development', () => {
  it('turns a battle victory into experience, a level, and a skill point', () => {
    const result = recordBattleExperience(record, report, 'balanced');
    expect(result.xpGained).toBeGreaterThanOrEqual(22);
    expect(result.record.victories).toBe(1);
    expect(getCommanderLevel(result.record.xp)).toBe(2);
    expect(getAvailableSkillPoints(result.record)).toBe(1);
  });

  it('unlocks only skills paid for with earned points', () => {
    const veteran = { ...record, xp: 55 };
    const first = unlockCommanderSkill(veteran, 'operational-planner');
    const second = unlockCommanderSkill(first, 'master-logistician');
    const blocked = unlockCommanderSkill(second, 'defense-in-depth');
    expect(blocked.skills).toEqual(['operational-planner', 'master-logistician']);
  });

  it('applies skill bonuses and high-fatigue penalties to effective attributes', () => {
    const developed = applyCommanderDevelopment(commander, {
      ...record,
      fatigue: 72,
      skills: ['operational-planner', 'breakthrough-specialist'],
    }, 'armor');
    expect(developed.command).toBe(72);
    expect(developed.attack).toBe(73);
    expect(developed.fatigue).toBe(72);
  });

  it('awards battle honors only after victories', () => {
    expect(getBattleHonor(report)).toBe('알제리 전공장');
    expect(getBattleHonor({ ...report, victory: false })).toBeUndefined();
  });

  it('recovers fatigue weekly and never lets rest fall below zero', () => {
    expect(recoverCommanderFatigue([{ ...record, fatigue: 2 }])[0].fatigue).toBe(0);
    expect(restCommander({ ...record, fatigue: 16 }).fatigue).toBe(0);
  });
});
