export type Faction = 'allies' | 'axis' | 'neutral';
export type DivisionType = 'infantry' | 'armor' | 'airborne' | 'marine';
export type GameTab = 'command' | 'governance' | 'map' | 'organization' | 'economy' | 'health' | 'army' | 'industry' | 'research' | 'diplomacy' | 'intelligence';
export type MapLayer = 'political' | 'supply' | 'weather' | 'intelligence';
export type TheaterId = 'europe' | 'asia';
export type StrategicSiteType = 'capital' | 'city' | 'port' | 'fortress' | 'front' | 'island' | 'sea' | 'region';
export type NationId = 'britain' | 'usa' | 'ussr' | 'germany' | 'japan' | 'china' | 'india' | 'freefrance' | 'italy' | 'korea' | 'vietnam' | 'indonesia' | 'philippines';
export type CareerBranch = 'military' | 'politics' | 'intelligence';
export type CareerTier = 1 | 2 | 3 | 4 | 5;
export type CareerArchetype = 'head-of-state' | 'cabinet-minister' | 'bureau-director' | 'regional-command' | 'organizer' | 'theater-command' | 'service-director' | 'field-command' | 'unit-command' | 'agent' | 'resistance';
export type NationStatus = 'sovereign' | 'government-in-exile' | 'colonized' | 'occupied-commonwealth' | 'resistance-coalition';
export type SupplyPolicy = 'balanced' | 'frontline' | 'reserve';
export type StaffDepartment = 'operations' | 'logistics' | 'armaments' | 'personnel' | 'political' | 'science' | 'economy';
export type PersonnelAvailability = 'available' | 'poachable' | 'opposition' | 'displaced';
export type PersonnelDiscipline = 'military' | 'science' | 'engineering' | 'medicine' | 'economics' | 'industry' | 'intelligence' | 'diplomacy' | 'social-science';
export type PolicyDomain = 'economy' | 'doctrine' | 'society' | 'diplomacy';
export type BattleStance = 'cautious' | 'balanced' | 'aggressive';
export type BattlePhaseTone = 'advantage' | 'contested' | 'setback';
export type CommanderSkillId = 'operational-planner' | 'breakthrough-specialist' | 'defense-in-depth' | 'master-logistician';
export type EquipmentCategory = 'infantry' | 'artillery' | 'armor' | 'aircraft' | 'naval' | 'logistics' | 'systems' | 'strategic';
export type EquipmentEra = 'historical' | 'late-war' | 'cold-war' | 'modern' | 'speculative';
export type EquipmentAuthenticity = 'documented' | 'derived' | 'speculative';
export type EquipmentModuleSlot = 'platform' | 'powerplant' | 'weapon' | 'protection' | 'sensors' | 'mission';

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
  siteType?: StrategicSiteType;
  frontId?: string;
  labelTier?: 1 | 2 | 3;
  historicalNote?: string;
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
  status: NationStatus;
  historicalBasis: string;
  capitalTerritoryId: string;
  operationalHeadquarters?: {
    territoryId: string;
    label: string;
  };
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
  archetype: CareerArchetype;
  scope: string;
  authority: number;
  expectation: string;
  historicalHolderId: string;
  historicalHolderName: string;
  historicalOffice: string;
  historicalBasis: string;
  coverIdentity: string;
  replacementEffect: string;
}

export interface CareerState {
  nationId: NationId;
  roleId: string;
  reputation: number;
  councilTrust: number;
  experience: number;
  legacy: number;
  alternatePathId: string | null;
  replacedPersonId: string;
}

export interface HistoricalPerson {
  id: string;
  nationId: NationId;
  name: string;
  office: string;
  affiliation: string;
  summary: string;
  department: StaffDepartment;
  ability: number;
  potential: number;
  loyalty: number;
  influence: number;
  interest: number;
  availability: PersonnelAvailability;
  sourceLabel?: string;
  sourceUrl?: string;
  command?: Pick<Commander, 'rank' | 'command' | 'attack' | 'defense' | 'logistics' | 'trait' | 'specialty'>;
}

export interface StaffMember {
  id: string;
  personId: string;
  name: string;
  candidateName: string;
  role: string;
  historicalOffice: string;
  affiliation: string;
  summary: string;
  department: StaffDepartment;
  ability: number;
  potential: number;
  loyalty: number;
  workload: number;
  weeklyCost: number;
  specialty: string;
  influence: number;
  delegated: boolean;
  grade: 1 | 2 | 3;
  development: number;
  morale?: number;
  roleSatisfaction?: number;
  contractWeeksRemaining?: number;
  contractTermWeeks?: number;
  joinedWeek?: number;
  promisedDepartment?: StaffDepartment;
  squadStatus?: 'key' | 'regular' | 'rotation' | 'development';
  appointmentAuthority?: 'advisor' | 'executive' | 'autonomous';
  appointmentPromise?: 'none' | 'resources' | 'succession' | 'security';
  lastMeetingWeek?: number;
  discipline?: PersonnelDiscipline;
  birthYear?: number;
  nationality?: string;
  wartimeLocation?: string;
  historicalConstraint?: string;
  expertise?: string[];
  networks?: string[];
  friction?: string;
  appointmentEffect?: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

export type StaffCandidateStatus = 'unscouted' | 'scouting' | 'shortlisted' | 'signed' | 'lost';

export interface StaffCandidate {
  id: string;
  personId: string;
  name: string;
  role: string;
  historicalOffice: string;
  affiliation: string;
  summary: string;
  department: StaffDepartment;
  ability: number;
  potential: number;
  loyalty: number;
  weeklyCost: number;
  signingCost: number;
  interest: number;
  knowledge: number;
  status: StaffCandidateStatus;
  specialty: string;
  influence: number;
  relationship: number;
  rivalInterest: number;
  availability: PersonnelAvailability;
  lastApproachWeek: number | null;
  discipline?: PersonnelDiscipline;
  birthYear?: number;
  nationality?: string;
  wartimeLocation?: string;
  historicalConstraint?: string;
  expertise?: string[];
  networks?: string[];
  friction?: string;
  appointmentEffect?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  historicalEra?: 'wartime' | 'postwar' | 'cold-war' | 'late-century' | 'contemporary';
  marketEntryYear?: number;
  generationUnlockYear?: number;
  alternateHistoryEntry?: boolean;
}

export interface StrategicPolicy {
  id: string;
  domain: PolicyDomain;
  title: string;
  description: string;
  effect: string;
  attackBonus?: number;
  defenseBonus?: number;
  productionMultiplier?: number;
  supplyRecovery?: number;
  gameDelta: Partial<Record<keyof GameState, number>>;
}

export interface CouncilChoiceEffect {
  gameDelta?: Partial<Record<keyof GameState, number>>;
  divisionSupply?: number;
  divisionOrganization?: number;
  productionEfficiency?: number;
  relationChange?: number;
  careerReputation?: number;
  careerTrust?: number;
  enemyTerritorySupply?: number;
}

export interface CouncilChoice {
  id: string;
  title: string;
  description: string;
  result: string;
  effect: CouncilChoiceEffect;
}

export interface CouncilEvent {
  id: string;
  title: string;
  category: string;
  briefing: string;
  stakes: string;
  nationIds?: NationId[];
  roleBranches?: CareerBranch[];
  historicalYear?: number;
  historicalBasis?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  choices: [CouncilChoice, CouncilChoice, CouncilChoice];
}

export interface BattlePhase {
  id: 'reconnaissance' | 'approach' | 'engagement' | 'exploitation';
  title: string;
  attackerScore: number;
  defenderScore: number;
  delta: number;
  tone: BattlePhaseTone;
  narrative: string;
}

export interface BattleReport {
  id: string;
  week: number;
  divisionId: string;
  divisionName: string;
  commanderName: string;
  targetId: string;
  targetName: string;
  terrain: string;
  stance: BattleStance;
  victory: boolean;
  margin: number;
  phases: [BattlePhase, BattlePhase, BattlePhase, BattlePhase];
  attackerStrengthLoss: number;
  defenderStrengthLoss: number;
  organizationLoss: number;
  supplySpent: number;
  commanderXpGained?: number;
  battleHonor?: string;
  summary: string;
}

export interface CommanderDevelopment {
  commanderId: string;
  xp: number;
  battles: number;
  victories: number;
  fatigue: number;
  skills: CommanderSkillId[];
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
  battleHonors?: string[];
  equipmentPackageId?: string;
}

export interface EquipmentStats {
  firepower: number;
  mobility: number;
  protection: number;
  range: number;
  reliability: number;
  production: number;
}

export interface EquipmentNode {
  id: string;
  name: string;
  category: EquipmentCategory;
  era: EquipmentEra;
  year: number | null;
  authenticity: EquipmentAuthenticity;
  nationIds: NationId[] | 'all';
  summary: string;
  historicalNote: string;
  researchCost: number;
  industrialCost: number;
  doctrineEffect: string;
  stats: EquipmentStats;
  sourceLabel?: string;
  sourceUrl?: string;
}

export interface EquipmentModule {
  id: string;
  name: string;
  slot: EquipmentModuleSlot;
  minimumEra: EquipmentEra;
  summary: string;
  statDelta: Partial<EquipmentStats>;
  industrialCost: number;
  risk: number;
}

export interface EquipmentPrototype {
  id: string;
  name: string;
  baseNodeId: string;
  category: EquipmentCategory;
  moduleIds: string[];
  stats: EquipmentStats;
  industrialCost: number;
  risk: number;
  reliability: number;
  createdWeek: number;
}

export interface EquipmentDevelopmentState {
  unlockedIds: string[];
  activeProjectId: string | null;
  progress: number;
  prototypes: EquipmentPrototype[];
  fieldedByCategory: Partial<Record<EquipmentCategory, string>>;
  divisionAssignments: Record<string, string>;
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
  equipmentId?: string;
  reliability?: number;
  unitCost?: number;
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

export type WarEventDomain = 'operations' | 'management' | 'diplomacy' | 'history';

export interface WarEventEffect {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface WarEventTrace {
  domain: WarEventDomain;
  decision: string;
  trigger: string;
  factors: string[];
  effects: WarEventEffect[];
  ongoing: string[];
  nextActions: string[];
  certainty: 'confirmed' | 'developing' | 'forecast';
}

export interface WarEvent {
  id: number;
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  trace?: WarEventTrace;
}

export interface Order {
  divisionId: string;
  fromId: string;
  targetId: string;
  startedWeek: number;
  stance?: BattleStance;
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
