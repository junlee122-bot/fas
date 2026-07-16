import type {
  BattleReport,
  BattleStance,
  Commander,
  CommanderDevelopment,
  CommanderSkillId,
  DivisionType,
} from './types';

export interface CommanderSkillDefinition {
  id: CommanderSkillId;
  title: string;
  description: string;
  effect: string;
}

export const commanderSkills: CommanderSkillDefinition[] = [
  { id: 'operational-planner', title: '작전 설계자', description: '정보와 참모 절차를 결합해 전투의 첫 수를 선점합니다.', effect: '지휘 +6' },
  { id: 'breakthrough-specialist', title: '돌파 전문가', description: '화력 집중과 기동 예비대로 주저항선을 무너뜨립니다.', effect: '공격 +7 · 기갑 추가 +2' },
  { id: 'defense-in-depth', title: '종심 방어가', description: '전초 손실을 감수하고 예비대 반격으로 전선을 복원합니다.', effect: '방어 +8' },
  { id: 'master-logistician', title: '군수의 대가', description: '수송·정비·배분을 통합해 작전 지속 능력을 높입니다.', effect: '군수 +8' },
];

const levelThresholds = [0, 18, 50, 95, 155] as const;

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function createCommanderDevelopment(commanders: Commander[]): CommanderDevelopment[] {
  return commanders.map((commander) => ({
    commanderId: commander.id,
    xp: 0,
    battles: 0,
    victories: 0,
    fatigue: commander.fatigue,
    skills: [],
  }));
}

export function getCommanderRecord(records: CommanderDevelopment[], commander: Commander): CommanderDevelopment {
  return records.find((record) => record.commanderId === commander.id) ?? {
    commanderId: commander.id,
    xp: 0,
    battles: 0,
    victories: 0,
    fatigue: commander.fatigue,
    skills: [],
  };
}

export function getCommanderLevel(xp: number) {
  return levelThresholds.reduce((level, threshold, index) => xp >= threshold ? index + 1 : level, 1);
}

export function getCommanderLevelProgress(xp: number) {
  const level = getCommanderLevel(xp);
  const current = levelThresholds[level - 1];
  const next = levelThresholds[level] ?? current;
  const percent = level >= levelThresholds.length ? 100 : (xp - current) / (next - current) * 100;
  return { level, current, next, percent: clamp(percent) };
}

export function getAvailableSkillPoints(record: CommanderDevelopment) {
  return Math.max(0, getCommanderLevel(record.xp) - 1 - record.skills.length);
}

export function applyCommanderDevelopment(
  commander: Commander,
  record: CommanderDevelopment,
  divisionType?: DivisionType,
): Commander {
  const fatiguePenalty = Math.max(0, Math.floor((record.fatigue - 40) / 8));
  const has = (skill: CommanderSkillId) => record.skills.includes(skill);
  return {
    ...commander,
    command: clamp(commander.command + (has('operational-planner') ? 6 : 0) - fatiguePenalty),
    attack: clamp(commander.attack + (has('breakthrough-specialist') ? 7 + (divisionType === 'armor' ? 2 : 0) : 0) - fatiguePenalty),
    defense: clamp(commander.defense + (has('defense-in-depth') ? 8 : 0) - fatiguePenalty),
    logistics: clamp(commander.logistics + (has('master-logistician') ? 8 : 0) - Math.floor(fatiguePenalty / 2)),
    fatigue: record.fatigue,
  };
}

export function recordBattleExperience(
  record: CommanderDevelopment,
  report: BattleReport,
  stance: BattleStance,
) {
  const xpGained = 10 + (report.victory ? 12 : 5) + Math.min(8, Math.floor(Math.abs(report.margin) / 3));
  const fatigueGained = stance === 'cautious' ? 4 : stance === 'balanced' ? 7 : 11;
  const previousLevel = getCommanderLevel(record.xp);
  const updated: CommanderDevelopment = {
    ...record,
    xp: Math.min(levelThresholds[levelThresholds.length - 1], record.xp + xpGained),
    battles: record.battles + 1,
    victories: record.victories + (report.victory ? 1 : 0),
    fatigue: clamp(record.fatigue + fatigueGained),
  };
  return { record: updated, xpGained, leveledUp: getCommanderLevel(updated.xp) > previousLevel };
}

export function unlockCommanderSkill(record: CommanderDevelopment, skillId: CommanderSkillId) {
  if (record.skills.includes(skillId) || getAvailableSkillPoints(record) <= 0) return record;
  return { ...record, skills: [...record.skills, skillId] };
}

export function recoverCommanderFatigue(records: CommanderDevelopment[]) {
  return records.map((record) => ({ ...record, fatigue: Math.max(0, record.fatigue - 3) }));
}

export function restCommander(record: CommanderDevelopment) {
  return { ...record, fatigue: Math.max(0, record.fatigue - 22) };
}

export function getBattleHonor(report: BattleReport) {
  if (!report.victory) return undefined;
  if (report.margin >= 16) return `${report.targetName} 돌파장`;
  if (report.margin >= 8) return `${report.targetName} 전공장`;
  return `${report.targetName} 종군장`;
}
