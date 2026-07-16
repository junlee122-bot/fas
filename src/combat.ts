import type { BattlePhase, BattleReport, BattleStance, Commander, Division, Territory } from './types';

export interface BattleInput {
  week: number;
  division: Division;
  commander: Commander;
  target: Territory;
  stance: BattleStance;
  enemyPressure: number;
  intelNetwork: number;
  doctrineBonus: number;
  policyAttackBonus: number;
  priorityBonus: number;
  randomRolls: [number, number, number, number];
}

export type ForecastConfidence = 'low' | 'medium' | 'high';
export type ForecastRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface BattleForecast {
  stance: BattleStance;
  successChance: number;
  successRange: [number, number];
  confidence: ForecastConfidence;
  risk: ForecastRisk;
  attackerPower: number;
  defenderPower: number;
  expectedMargin: number;
  strengthLoss: [number, number];
  organizationLoss: [number, number];
  supplySpent: number;
}

export type BattleForecastInput = Omit<BattleInput, 'randomRolls'>;

const terrainDefense: Record<string, number> = {
  평야: 2,
  해양: 10,
  해안: 10,
  도서: 13,
  사막: 7,
  구릉: 10,
  강변: 13,
  고원: 11,
  삼림: 12,
  정글: 17,
  산악: 20,
  도시: 16,
  요새: 25,
  해군기지: 20,
};

const stanceModifiers: Record<BattleStance, { recon: number; approach: number; engagement: number; exploitation: number; loss: number; supply: number }> = {
  cautious: { recon: 6, approach: 5, engagement: -7, exploitation: -3, loss: .72, supply: 8 },
  balanced: { recon: 0, approach: 0, engagement: 0, exploitation: 0, loss: 1, supply: 11 },
  aggressive: { recon: -2, approach: -4, engagement: 11, exploitation: 9, loss: 1.28, supply: 16 },
};

const phaseTitles: Record<BattlePhase['id'], string> = {
  reconnaissance: '정찰과 기만',
  approach: '접근과 전개',
  engagement: '주력 교전',
  exploitation: '돌파와 추격',
};

const phaseNarratives: Record<BattlePhase['id'], { advantage: string; contested: string; setback: string }> = {
  reconnaissance: {
    advantage: '적 예비대와 화력 거점을 먼저 파악해 작전 주도권을 확보했습니다.',
    contested: '양측 정찰대가 충돌했고 정보 우위는 어느 쪽에도 기울지 않았습니다.',
    setback: '적의 기만에 노출되어 방어선의 실제 중심을 늦게 식별했습니다.',
  },
  approach: {
    advantage: '선두 부대와 보급 종대가 계획된 시간표에 맞춰 공격개시선에 도착했습니다.',
    contested: '지형과 교통 혼잡으로 전개가 지연됐지만 대형은 유지했습니다.',
    setback: '포격과 수송 장애로 일부 부대가 분리되어 전투 투입 순서가 흔들렸습니다.',
  },
  engagement: {
    advantage: '집중 화력과 지휘 통제가 적 주저항선을 압도했습니다.',
    contested: '주저항선에서 소모전이 이어지며 양측 모두 예비대를 투입했습니다.',
    setback: '적 방어 화력에 공세 축선이 고착되고 조직력이 빠르게 소진됐습니다.',
  },
  exploitation: {
    advantage: '기동 예비대가 돌파구를 넓혀 적의 퇴로와 후방 보급선을 위협했습니다.',
    contested: '국지 돌파에는 성공했지만 예비대 부족으로 깊은 추격은 제한됐습니다.',
    setback: '적의 반격과 보급 부족으로 선두 부대가 출발선 부근까지 철수했습니다.',
  },
};

const clampRoll = (value: number) => Math.max(0, Math.min(1, value));
const clampMomentum = (value: number) => Math.max(-18, Math.min(18, value));

function makePhase(id: BattlePhase['id'], attackerScore: number, defenderScore: number): BattlePhase {
  const roundedAttacker = Math.round(attackerScore);
  const roundedDefender = Math.round(defenderScore);
  const delta = roundedAttacker - roundedDefender;
  const tone = delta >= 7 ? 'advantage' : delta <= -7 ? 'setback' : 'contested';
  return {
    id,
    title: phaseTitles[id],
    attackerScore: roundedAttacker,
    defenderScore: roundedDefender,
    delta,
    tone,
    narrative: phaseNarratives[id][tone],
  };
}

export function resolveBattle({
  week,
  division,
  commander,
  target,
  stance,
  enemyPressure,
  intelNetwork,
  doctrineBonus,
  policyAttackBonus,
  priorityBonus,
  randomRolls,
}: BattleInput): BattleReport {
  const terrain = terrainDefense[target.terrain] ?? 8;
  const modifiers = stanceModifiers[stance];
  const rolls = randomRolls.map(clampRoll) as [number, number, number, number];
  const mobilityBonus = division.type === 'armor' ? 10 : division.type === 'airborne' || division.type === 'marine' ? 6 : 2;

  const reconnaissance = makePhase(
    'reconnaissance',
    intelNetwork * .42 + commander.command * .32 + division.experience * .2 + modifiers.recon + rolls[0] * 13,
    38 + enemyPressure * .34 + terrain * .45 + (1 - rolls[0]) * 11,
  );
  let momentum = clampMomentum(reconnaissance.delta * .45);

  const approach = makePhase(
    'approach',
    division.organization * .28 + division.supply * .34 + commander.logistics * .25 + division.strength * .1 + modifiers.approach + priorityBonus + momentum + rolls[1] * 10,
    42 + enemyPressure * .25 + terrain * .9 + target.value * 1.25 + (1 - rolls[1]) * 8,
  );
  momentum = clampMomentum(momentum + approach.delta * .38);

  const engagement = makePhase(
    'engagement',
    division.strength * .36 + division.organization * .23 + commander.attack * .24 + division.experience * .12 + doctrineBonus + policyAttackBonus + modifiers.engagement + momentum + rolls[2] * 12,
    50 + enemyPressure * .29 + terrain + target.value * 1.8 + (1 - rolls[2]) * 10,
  );
  momentum = clampMomentum(momentum + engagement.delta * .46);

  const exploitation = makePhase(
    'exploitation',
    division.strength * .19 + division.supply * .19 + commander.command * .2 + commander.attack * .14 + mobilityBonus + modifiers.exploitation + priorityBonus + momentum + rolls[3] * 11,
    40 + enemyPressure * .27 + terrain * .72 + target.value * 1.35 + (1 - rolls[3]) * 9,
  );

  const phases: BattleReport['phases'] = [reconnaissance, approach, engagement, exploitation];
  const rawMargin = phases.reduce((total, phase) => total + phase.delta, 0) / phases.length;
  const margin = Math.round(rawMargin);
  const victory = margin >= 0 && engagement.delta > -15;
  const attackerStrengthLoss = Math.max(2, Math.min(24, Math.round(((victory ? 5 : 10) + Math.max(0, -margin) * .12 + rolls[3] * 5) * modifiers.loss)));
  const defenderStrengthLoss = Math.max(2, Math.min(28, Math.round((victory ? 9 : 4) + Math.max(0, margin) * .16 + rolls[2] * 5)));
  const organizationLoss = Math.max(8, Math.min(34, Math.round((victory ? 13 : 21) + Math.max(0, -margin) * .18)));
  const supplySpent = Math.min(24, modifiers.supply + Math.round(terrain / 5));
  const summary = victory
    ? (exploitation.tone === 'advantage' ? '전술적 돌파가 작전적 추격으로 이어져 적 방어 체계가 붕괴했습니다.' : '목표 지역은 확보했지만 예비대와 보급을 재정비해야 합니다.')
    : (engagement.tone === 'setback' ? '주력 교전에서 손실이 누적되어 공세를 중단하고 재편에 들어갔습니다.' : '국지적 성과는 있었으나 돌파구를 유지하지 못해 출발선으로 철수했습니다.');

  return {
    id: `battle-${week}-${division.id}-${target.id}`,
    week,
    divisionId: division.id,
    divisionName: division.name,
    commanderName: commander.name,
    targetId: target.id,
    targetName: target.name,
    terrain: target.terrain,
    stance,
    victory,
    margin,
    phases,
    attackerStrengthLoss,
    defenderStrengthLoss,
    organizationLoss,
    supplySpent,
    summary,
  };
}

const clampPercentage = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function likelyRange(values: number[]): [number, number] {
  const sorted = [...values].sort((left, right) => left - right);
  return [sorted[Math.floor(sorted.length * .2)], sorted[Math.floor(sorted.length * .8)]];
}

export function forecastBattle(input: BattleForecastInput): BattleForecast {
  const sampleRolls = [.15, .5, .85];
  const outcomes: BattleReport[] = [];

  for (const reconnaissance of sampleRolls) {
    for (const approach of sampleRolls) {
      for (const engagement of sampleRolls) {
        for (const exploitation of sampleRolls) {
          outcomes.push(resolveBattle({
            ...input,
            randomRolls: [reconnaissance, approach, engagement, exploitation],
          }));
        }
      }
    }
  }

  const expected = resolveBattle({ ...input, randomRolls: [.5, .5, .5, .5] });
  const rawSuccessChance = outcomes.filter((report) => report.victory).length / outcomes.length * 100;
  const successChance = Math.max(4, Math.min(96, Math.round(rawSuccessChance)));
  const confidence: ForecastConfidence = input.intelNetwork >= 75 ? 'high' : input.intelNetwork >= 50 ? 'medium' : 'low';
  const uncertainty = confidence === 'high' ? 6 : confidence === 'medium' ? 11 : 17;
  const strengthLoss = likelyRange(outcomes.map((report) => report.attackerStrengthLoss));
  const organizationLoss = likelyRange(outcomes.map((report) => report.organizationLoss));
  const attackerPower = Math.round(expected.phases.reduce((total, phase) => total + phase.attackerScore, 0) / expected.phases.length);
  const defenderPower = Math.round(expected.phases.reduce((total, phase) => total + phase.defenderScore, 0) / expected.phases.length);
  const risk: ForecastRisk = successChance >= 72 && strengthLoss[1] <= 10
    ? 'low'
    : successChance >= 52 && strengthLoss[1] <= 16
      ? 'moderate'
      : successChance >= 30
        ? 'high'
        : 'critical';

  return {
    stance: input.stance,
    successChance,
    successRange: [clampPercentage(successChance - uncertainty), clampPercentage(successChance + uncertainty)],
    confidence,
    risk,
    attackerPower,
    defenderPower,
    expectedMargin: expected.margin,
    strengthLoss,
    organizationLoss,
    supplySpent: expected.supplySpent,
  };
}
