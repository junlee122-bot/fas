import { advanceRegionalTransportWeek, attributeRegionalIndustryReceipt, reserveAutomaticRegionalShipmentWeek } from './regionalIndustry';
import type { RegionalIndustryContext, RegionalIndustrySourceReceipt, RegionalIndustryState } from './regionalIndustry';
import type { EquipmentCategory, Stockpile } from './types';
import type { PostwarIndustryReport } from './postwarIndustry';
import { postwarStockpileKeys } from './postwarIndustry';

export function combineStockpileDeltas(...deltas: Stockpile[]): Stockpile {
  return Object.fromEntries(postwarStockpileKeys.map((key) => [key, deltas.reduce((sum, delta) => sum + delta[key], 0)])) as unknown as Stockpile;
}

/** Existing transit, new output attribution, then opt-in next-departure reservation. No same-tick transport of new output. */
export function settleRegionalIndustryDelivery(state: RegionalIndustryState, context: RegionalIndustryContext, source?: RegionalIndustrySourceReceipt) {
  const transport = advanceRegionalTransportWeek(state, context);
  const attribution = source ? attributeRegionalIndustryReceipt(transport.state, source, context) : null;
  const settledState = attribution?.state ?? transport.state;
  const automaticReservation = transport.applied || attribution?.applied ? reserveAutomaticRegionalShipmentWeek(settledState, context) : null;
  const empty = Object.fromEntries(postwarStockpileKeys.map((key) => [key, 0])) as unknown as Stockpile;
  return {
    state: automaticReservation?.state ?? settledState,
    availableDelta: combineStockpileDeltas(transport.stockpileDelta, attribution?.stockpileDelta ?? empty),
    stagedDelta: Object.fromEntries(postwarStockpileKeys.map((key) => [key,
      attribution?.applied && source ? Math.max(0, source.stockpileDelta[key] - attribution.stockpileDelta[key]) : 0,
    ])) as unknown as Stockpile,
    transport,
    attribution,
    automaticReservation,
  };
}

/** Staged equipment is not a spare-parts contribution until it actually reaches usable reserves. */
export function regionalEquipmentProductionCoverage(report: PostwarIndustryReport | null, availableDelta: Stockpile): Partial<Record<EquipmentCategory, number>> {
  const mapping = { infantry: 'infantryEquipment', armor: 'tanks', aircraft: 'aircraft', naval: 'convoys', artillery: 'artillery', logistics: 'trucks' } as const;
  return Object.fromEntries(Object.entries(mapping).map(([category, key]) => [category,
    report && report.potentialDelivery[key] > 0 ? Math.max(0, Math.min(1, availableDelta[key] / report.potentialDelivery[key])) : 0,
  ]));
}
