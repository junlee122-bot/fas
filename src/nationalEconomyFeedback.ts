import type { EconomyState } from './economy';
import type { CampaignPhase, NationManagementState } from './nationManagement';
import type { NationalSimulationSnapshot } from './nationalSimulation';
import type { GameState } from './types';

export interface NationalEconomyFeedbackContext {
  phase: CampaignPhase;
  game: Pick<GameState, 'stability'>;
  economy: Pick<EconomyState, 'inflation' | 'publicConfidence'>;
  nationManagement: Pick<NationManagementState, 'unrest' | 'employment'>;
}

export interface NationalEconomyFeedbackGood {
  id: string;
  name: string;
  availability: number;
  pressure: number;
}

export interface NationalEconomyFeedback {
  status: 'balanced' | 'shortage' | 'recovering';
  shortagePressure: number;
  affectedGoods: NationalEconomyFeedbackGood[];
  gameDelta: Pick<GameState, 'stability'>;
  economyDelta: Pick<EconomyState, 'inflation' | 'publicConfidence'>;
  nationDelta: Pick<NationManagementState, 'unrest' | 'employment'>;
  summary: string;
}

export const NATIONAL_ECONOMY_FEEDBACK_CAPS = Object.freeze({
  inflation: 0.08,
  publicConfidence: 0.12,
  stability: 0.06,
  unrest: 0.12,
  employment: 0.08,
});

// Do not replay medical losses or fiscal flows: the health and tax engines own them.
const supplyWeights = [
  { id: 'consumer', weight: 0.4 },
  { id: 'food', weight: 0.25 },
  { id: 'fuel', weight: 0.15 },
  { id: 'steel', weight: 0.1 },
  { id: 'transport', weight: 0.1 },
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Number(value.toFixed(4));

function approach(current: number, target: number, cap: number, direction: 'up' | 'down'): number {
  if (!Number.isFinite(current)) return 0;
  const distance = target - clamp(current, 0, 100);
  if ((direction === 'up' && distance <= 0) || (direction === 'down' && distance >= 0)) return 0;
  // A deadband avoids endless tiny deltas; the target prevents repeated fixed penalties
  // from grinding an otherwise unchanged country down to a boundary over 118 years.
  if (Math.abs(distance) < 0.02) return 0;
  return round(clamp(distance * 0.04, -cap, cap));
}

/**
 * One week's additional civilian-supply contribution, derived without mutation.
 * Apply once after the phase's ordinary fiscal/health simulation. No calendar,
 * future forecast, accumulated penalty counter, tax, revenue or treasury is used.
 */
export function deriveNationalEconomyFeedback(
  snapshot: Pick<NationalSimulationSnapshot, 'goods'>,
  context: NationalEconomyFeedbackContext,
): NationalEconomyFeedback {
  const observed = supplyWeights.flatMap(({ id, weight }) => {
    const good = snapshot.goods.find((candidate) => candidate.id === id);
    if (!good || !Number.isFinite(good.availability)) return [];
    const availability = clamp(good.availability, 0, 100);
    return [{ id, name: good.name, availability, pressure: Math.max(0, (52 - availability) / 52) * weight }];
  });
  const pressure = clamp(observed.reduce((sum, good) => sum + good.pressure, 0), 0, 1);
  const affectedGoods = observed.filter((good) => good.pressure > 0)
    .map((good) => ({ ...good, pressure: round(good.pressure * 100) }));
  const suppliesRecovered = observed.length === supplyWeights.length && observed.every((good) => good.availability >= 60);
  const gameDelta = { stability: 0 };
  const economyDelta = { inflation: 0, publicConfidence: 0 };
  const nationDelta = { unrest: 0, employment: 0 };
  const normalInflation = context.phase === 'war' ? 6 : 4;
  const caps = NATIONAL_ECONOMY_FEEDBACK_CAPS;

  if (pressure > 0) {
    const intensity = Math.min(1, pressure * 3);
    economyDelta.inflation = approach(context.economy.inflation, normalInflation + pressure * 8, caps.inflation * intensity, 'up');
    economyDelta.publicConfidence = approach(context.economy.publicConfidence, 60 - pressure * 18, caps.publicConfidence * intensity, 'down');
    gameDelta.stability = approach(context.game.stability, 70 - pressure * 18, caps.stability * intensity, 'down');
    nationDelta.unrest = approach(context.nationManagement.unrest, 25 + pressure * 20, caps.unrest * intensity, 'up');
    nationDelta.employment = approach(context.nationManagement.employment, 65 - pressure * 15, caps.employment * intensity, 'down');
  } else if (suppliesRecovered) {
    economyDelta.inflation = approach(context.economy.inflation, normalInflation, caps.inflation / 2, 'down');
    economyDelta.publicConfidence = approach(context.economy.publicConfidence, 60, caps.publicConfidence / 2, 'up');
    gameDelta.stability = approach(context.game.stability, 70, caps.stability / 2, 'up');
    nationDelta.unrest = approach(context.nationManagement.unrest, 25, caps.unrest / 2, 'down');
    nationDelta.employment = approach(context.nationManagement.employment, 65, caps.employment / 2, 'up');
  }

  const hasDelta = [...Object.values(gameDelta), ...Object.values(economyDelta), ...Object.values(nationDelta)].some((value) => value !== 0);
  const status = pressure > 0 ? 'shortage' : hasDelta ? 'recovering' : 'balanced';
  return {
    status,
    shortagePressure: round(pressure * 100),
    affectedGoods,
    gameDelta,
    economyDelta,
    nationDelta,
    summary: status === 'shortage'
      ? `${affectedGoods.map((good) => good.name).join('·')} 공급 부족이 물가·신뢰·고용·사회 안정에 제한된 추가 압력을 줍니다.`
      : status === 'recovering'
        ? '민생 공급 회복이 물가·신뢰·고용·사회 안정을 정상 구간으로 완만하게 되돌립니다.'
        : '민생 공급 경로의 추가 변화는 없습니다. 세금·보건 등 다른 경로의 계산은 별도로 유지됩니다.',
  };
}
