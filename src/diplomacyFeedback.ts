import { getCampaignYearForWeek } from './campaignCalendar';
import { applyDiplomaticAgendaReward, getDiplomaticAgenda, getDiplomaticAgendaOutcome } from './diplomacy';
import { applyStrategicPolicyRelations, applyStrategicPolicyReward, applyStrategicPolicyToPortfolio, fundEmergencyArmsStockpile, type ArmsDiplomacyPolicy, type ArmsPortfolioState } from './strategicArmsDiplomacy';
import type { DiplomaticRelation, GameState, NationId, WarEventEffect } from './types';

/** Derived feedback only: these helpers do not spend resources or persist records. */
export interface DiplomacyFeedbackChange {
  id: string;
  label: string;
  before: number;
  after: number;
  delta: number;
  tone: WarEventEffect['tone'];
  detail?: string;
}
export interface DiplomacyFeedback {
  game: GameState;
  relations: DiplomaticRelation[];
  portfolio?: ArmsPortfolioState;
  changes: DiplomacyFeedbackChange[];
}
type NumericGameKey = Exclude<keyof GameState, 'week'>;
const gameLabels: Record<NumericGameKey, string> = {
  treasury: '국고', politicalPower: '정치력', commandPoints: '지휘력', manpower: '인력',
  factories: '공장', fuel: '연료', steel: '강철', stability: '안정도', warSupport: '전쟁 지지도',
  victoryScore: '승리 점수', enemyPressure: '적 압력', intelNetwork: '정보망', airPower: '공군력 지표', navalPower: '해군력 지표',
};
const portfolioLabels = {
  capability: '군비 전력', autonomy: '조달 자율성', interoperability: '상호운용', supplySecurity: '공급 안보',
  escalation: '군비 긴장', proliferation: '확산 위험', treatyCompliance: '규범 신뢰', emergencyStockpile: '공동 비축', covertExposure: '비공식 노출',
} as const;

function change(id: string, label: string, before: number, after: number, lowerIsBetter = false, detail?: string): DiplomacyFeedbackChange {
  const delta = after - before;
  return { id, label, before, after, delta, tone: delta === 0 ? 'neutral' : (delta > 0) !== lowerIsBetter ? 'positive' : 'negative', ...(detail ? { detail } : {}) };
}
function gameChanges(before: GameState, after: GameState) {
  return (Object.keys(gameLabels) as NumericGameKey[])
    .filter((key) => before[key] !== after[key])
    .map((key) => change(`game.${key}`, gameLabels[key], before[key], after[key], key === 'enemyPressure'));
}
function portfolioChanges(before: ArmsPortfolioState, after: ArmsPortfolioState) {
  return (Object.keys(portfolioLabels) as (keyof typeof portfolioLabels)[])
    .filter((key) => before[key] !== after[key])
    .map((key) => change(`portfolio.${key}`, portfolioLabels[key], before[key], after[key], ['escalation', 'proliferation', 'covertExposure'].includes(key)));
}
function relationSummary(before: DiplomaticRelation[], after: DiplomaticRelation[]): DiplomacyFeedbackChange {
  const average = (relations: DiplomaticRelation[]) => relations.length ? relations.reduce((sum, relation) => sum + relation.value, 0) / relations.length : 0;
  const changed = before.filter((relation, index) => relation.value !== after[index]?.value).length;
  return change('relations.average', '외교 관계 평균', average(before), average(after), false, `${changed}/${before.length}개국 변화`);
}

export function getArmsPolicyFeedback(game: GameState, relations: DiplomaticRelation[], portfolio: ArmsPortfolioState, policy: ArmsDiplomacyPolicy): DiplomacyFeedback {
  // Match App's policy callback: reward first, then its one political charge.
  const nextGame = { ...applyStrategicPolicyReward(game, policy), politicalPower: Math.max(0, game.politicalPower - policy.politicalCost) };
  const nextRelations = applyStrategicPolicyRelations(relations, policy);
  const nextPortfolio = applyStrategicPolicyToPortfolio(portfolio, policy, game.week, getCampaignYearForWeek(game.week));
  return { game: nextGame, relations: nextRelations, portfolio: nextPortfolio, changes: [...gameChanges(game, nextGame), ...portfolioChanges(portfolio, nextPortfolio), relationSummary(relations, nextRelations)] };
}

export function getSummitFeedback(game: GameState, relations: DiplomaticRelation[], nationId: NationId): DiplomacyFeedback {
  const agenda = getDiplomaticAgenda(nationId);
  const outcome = getDiplomaticAgendaOutcome(nationId);
  // Match enactDecision's charge followed by its agenda reward callback.
  const nextGame = applyDiplomaticAgendaReward({ ...game, politicalPower: game.politicalPower - outcome.cost }, outcome.reward);
  const nextRelations = relations.map((relation) => relation.id === agenda.partnerNationId ? { ...relation, value: Math.min(100, relation.value + outcome.relationGain) } : relation);
  const partner = relations.find((relation) => relation.id === agenda.partnerNationId);
  const nextPartner = nextRelations.find((relation) => relation.id === agenda.partnerNationId);
  const relationChanges = partner && nextPartner
    ? [change(`relations.${partner.id}`, `${partner.name} 관계`, partner.value, nextPartner.value)]
    : [relationSummary(relations, nextRelations)];
  return { game: nextGame, relations: nextRelations, changes: [...gameChanges(game, nextGame), ...relationChanges] };
}

export function getEmergencyStockpileFeedback(game: GameState, portfolio: ArmsPortfolioState): DiplomacyFeedback {
  const nextGame = { ...game, politicalPower: game.politicalPower - 4, treasury: game.treasury - 55 };
  const nextPortfolio = fundEmergencyArmsStockpile(portfolio, game.week, getCampaignYearForWeek(game.week));
  return { game: nextGame, relations: [], portfolio: nextPortfolio, changes: [...gameChanges(game, nextGame), ...portfolioChanges(portfolio, nextPortfolio)] };
}

export const diplomacyFeedbackPrecisionNote = '현재 상태에 상한·체감을 적용한 변화입니다. 소수는 둘째 자리까지 반올림하며, 변하지 않은 지표는 생략합니다.';
const number = (value: number) => Number(value.toFixed(2)).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
export function formatDiplomacyFeedbackEffects(feedback: DiplomacyFeedback, formatMoney?: (value: number, options?: { signed?: boolean; exact?: boolean }) => string): WarEventEffect[] {
  return feedback.changes.map((item) => {
    const money = item.id === 'game.treasury' && formatMoney;
    const before = money ? formatMoney(item.before, { exact: true }) : number(item.before);
    const after = money ? formatMoney(item.after, { exact: true }) : number(item.after);
    const delta = money ? formatMoney(item.delta, { signed: true, exact: true }) : `${item.delta > 0 ? '+' : ''}${number(item.delta)}`;
    return { label: item.label, value: `${before} → ${after} (${delta})${item.detail ? ` · ${item.detail}` : ''}`, tone: item.tone };
  });
}
