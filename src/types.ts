export type Faction = 'allies' | 'axis' | 'neutral';
export type DivisionType = 'infantry' | 'armor' | 'airborne' | 'marine';
export type GameTab = 'command' | 'army' | 'industry' | 'research' | 'diplomacy' | 'intelligence';
export type MapLayer = 'political' | 'supply' | 'weather' | 'intelligence';
export type TheaterId = 'europe' | 'asia';
export type NationId = 'britain' | 'usa' | 'ussr' | 'germany' | 'japan' | 'china' | 'india' | 'freefrance' | 'italy';
export type CareerBranch = 'military' | 'politics' | 'intelligence';
export type CareerTier = 1 | 2 | 3;

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
  theater?: TheaterId;
  ownerId?: NationId;
}

export interface AlternatePath {
  id: string;
  title: string;
  summary: string;
  effect: string;
  tone: 'reform' | 'hardline' | 'international';
}

export interface NationProfile {
  id: NationId;
  name: string;
  shortName: string;
  code: string;
  alignment: Exclude<Faction, 'neutral'>;
  color: string;
  accent: string;
  defaultTheater: TheaterId;
  capitalTerritoryId: string;
  strategicTargets: string[];
  summary: string;
  challenge: string;
  majorOperation: string;
  majorOperationDetail: string;
  formations: [string, string, string];
  equipment: [string, string, string, string];
  modifiers: Partial<GameState>;
  paths: AlternatePath[];
}

export interface CareerRole {
  id: string;
  nationId: NationId;
  title: string;
  branch: CareerBranch;
  tier: CareerTier;
  scope: string;
  authority: number;
  expectation: string;
}

export interface CareerState {
  nationId: NationId;
  roleId: string;
  reputation: number;
  councilTrust: number;
  experience: number;
  legacy: number;
  alternatePathId: string | null;
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

export interface Stockpile {
  infantryEquipment: number;
  tanks: number;
  aircraft: number;
  convoys: number;
  artillery: number;
  trucks: number;
}

export interface DiplomaticRelation {
  id: string;
  name: string;
  code: string;
  value: number;
  status: string;
  color: string;
}

export interface CovertOperation {
  id: string;
  name: string;
  region: string;
  risk: number;
  progress: number;
  active: boolean;
  icon: 'radio' | 'eye' | 'crosshair';
}

export type CampaignOutcome = 'victory' | 'defeat' | null;

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
  airPower: number;
  navalPower: number;
  intelNetwork: number;
  enemyPressure: number;
}
