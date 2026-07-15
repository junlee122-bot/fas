export type Faction = 'allies' | 'axis' | 'neutral';
export type DivisionType = 'infantry' | 'armor' | 'airborne' | 'marine';
export type GameTab = 'command' | 'army' | 'industry' | 'research' | 'diplomacy' | 'intelligence';

export interface Territory {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
  controller: Faction;
  value: number;
  supply: number;
  terrain: string;
  neighbors: string[];
}

export interface Commander {
  id: string;
  name: string;
  rank: string;
  initials: string;
  color: string;
  command: number;
  attack: number;
  defense: number;
  logistics: number;
  trait: string;
  specialty: string;
  fatigue: number;
  loyalty: number;
}

export interface Division {
  id: string;
  name: string;
  type: DivisionType;
  strength: number;
  organization: number;
  experience: number;
  supply: number;
  territoryId: string;
  commanderId: string;
  status: 'ready' | 'moving' | 'combat' | 'recovering';
}

export interface ResearchProject {
  id: string;
  name: string;
  branch: string;
  description: string;
  progress: number;
  duration: number;
  active: boolean;
  complete: boolean;
  icon: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  category: string;
  assigned: number;
  efficiency: number;
  output: number;
  icon: string;
}

export interface WarEvent {
  id: number;
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface Order {
  divisionId: string;
  fromId: string;
  targetId: string;
  startedWeek: number;
}

export interface GameState {
  week: number;
  manpower: number;
  politicalPower: number;
  fuel: number;
  steel: number;
  factories: number;
  stability: number;
  warSupport: number;
  commandPoints: number;
  treasury: number;
  victoryScore: number;
}
