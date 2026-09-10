import type { NationId, ProductionLine, WarEvent } from './types';

export function selectLivingWorldRecords(events: WarEvent[], nationId: NationId) {
  // Newest-first campaign journal; an international transfer starts a new service.
  const transferIndex = events.findIndex((event) => event.title.startsWith('국제 경력 이동 — '));
  const currentService = (transferIndex < 0 ? events : events.slice(0, transferIndex)).filter((event) => event.nationId === nationId);
  return {
    lastOrder: currentService.find((event) => event.title.startsWith('생산 역량 전환 — ')),
    lastSettlement: currentService.find((event) => event.title === '민생 공급 결산'),
  };
}

/** One factory is a national capacity unit, not a geolocated individual building. */
export function reallocateFactory(
  production: ProductionLine[], capacity: number, lineId: string, amount: number, authorized: boolean,
): ProductionLine[] | null {
  if (!authorized || !Number.isFinite(capacity) || (amount !== -1 && amount !== 1)) return null;
  const line = production.find((item) => item.id === lineId);
  if (!line || !Number.isFinite(line.assigned) || line.assigned < 0) return null;
  const used = production.reduce((sum, item) => sum + item.assigned, 0);
  if (!Number.isFinite(used) || (amount > 0 && used + 1 > capacity) || (amount < 0 && line.assigned < 1)) return null;
  return production.map((item) => item.id === lineId ? {
    ...item,
    assigned: item.assigned + amount,
    efficiency: amount < 0 ? Math.max(15, item.efficiency - 4) : item.efficiency,
  } : item);
}

export const formatSupplyContribution = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
