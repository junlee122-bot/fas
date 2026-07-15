import type { Commander, Division, Faction, ProductionLine, Territory, TheaterId } from './types';

export interface ProductionGains {
  infantryEquipment: number;
  tanks: number;
  aircraft: number;
  convoys: number;
  artillery: number;
  trucks: number;
}

function lineOutput(production: ProductionLine[], id: string) {
  const line = production.find((item) => item.id === id);
  if (!line) return 0;
  return Math.round(line.output * line.assigned / 5);
}

export function calculateProductionGains(production: ProductionLine[], nextWeek: number): ProductionGains {
  return {
    tanks: lineOutput(production, 'sherman'),
    aircraft: lineOutput(production, 'spitfire'),
    infantryEquipment: lineOutput(production, 'rifle'),
    convoys: Math.max(0, lineOutput(production, 'convoy') - (nextWeek % 2 === 0 ? 4 : 1)),
    artillery: 72,
    trucks: 110,
  };
}

export function selectThreatenedTerritory(
  territories: Territory[],
  divisions: Division[],
  excludedTargetId?: string,
  defendedFaction: Exclude<Faction, 'neutral'> = 'allies',
  theater: TheaterId = 'europe',
) {
  return territories
    .filter((territory) => territory.controller === defendedFaction && territory.id !== excludedTargetId)
    .filter((territory) => (territory.theater ?? 'europe') === theater)
    .filter((territory) => territory.neighbors.some((neighborId) => {
      const neighbor = territories.find((item) => item.id === neighborId);
      return neighbor?.controller !== defendedFaction && neighbor?.controller !== 'neutral';
    }))
    .sort((left, right) => {
      const leftDefense = divisions.filter((division) => division.territoryId === left.id).reduce((sum, division) => sum + division.strength, 0) + left.supply;
      const rightDefense = divisions.filter((division) => division.territoryId === right.id).reduce((sum, division) => sum + division.strength, 0) + right.supply;
      return leftDefense - rightDefense;
    })[0];
}

export function calculateDefensivePower(
  territory: Territory,
  divisions: Division[],
  commanders: Commander[],
) {
  const defender = divisions
    .filter((division) => division.territoryId === territory.id)
    .sort((left, right) => right.strength - left.strength)[0];
  const defenderCommander = commanders.find((commander) => commander.id === defender?.commanderId);
  const power = defender
    ? defender.strength * 0.48 + defender.organization * 0.28 + (defenderCommander?.defense ?? 60) * 0.2 + territory.supply * 0.12
    : territory.value * 4 + territory.supply * 0.18;

  return { defender, power };
}

export function calculateEnemyPower(enemyPressure: number, territoryValue: number, randomRoll: number) {
  return enemyPressure * 0.7 + territoryValue * 2.4 + Math.max(0, Math.min(1, randomRoll)) * 26;
}
