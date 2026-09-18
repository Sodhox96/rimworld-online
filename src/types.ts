/**
 * RimColony - Type Definitions
 */

export type TileType = 
  | 'soil' 
  | 'rich_soil' 
  | 'gravel' 
  | 'sand' 
  | 'marsh' 
  | 'stone_rough' 
  | 'stone_smooth';

export type MineralType = 
  | 'steel' 
  | 'plasteel' 
  | 'uranium' 
  | 'gold' 
  | 'components';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  mineral?: MineralType;
  mineralHp?: number; // mining durability
  walkable: boolean;
  fertility: number; // 0.7 for gravel, 1.0 for soil, 1.4 for rich_soil
}

export const CHUNK_SIZE = 16;

export interface Chunk {
  cx: number;
  cy: number;
  tiles: Tile[][];
  key: string;
}

export type ItemType = 
  // Base raw materials
  | 'silver'
  | 'wood'
  | 'steel'
  | 'plasteel'
  | 'uranium'
  | 'component'
  | 'medicine'
  | 'raw_food'
  | 'simple_meal'
  // Agricultural & Chemical Crops
  | 'smokeleaf_leaves'
  | 'psychoid_leaves'
  | 'healroot'
  | 'neutroamine'
  // Manufactured Drugs
  | 'smokeleaf_joint'
  | 'psychite_tea'
  | 'flake'
  | 'yayo'
  | 'go_juice'
  | 'wake_up';

export interface Item {
  id: string;
  type: ItemType;
  count: number;
  x: number;
  y: number;
}

export type CropType = 'potato' | 'smokeleaf' | 'psychoid' | 'healroot';

export interface Plant {
  id: string;
  type: CropType;
  x: number;
  y: number;
  growth: number; // 0.0 to 1.0
  maxGrowthTime: number; // in game hours
  yieldItem: ItemType;
  yieldCount: number;
  hp: number;
}

export type BuildingType = 
  | 'wall_wood'
  | 'wall_stone'
  | 'wall_steel'
  | 'door'
  | 'bed'
  | 'hospital_bed'
  | 'table_dining'
  | 'chair'
  | 'solar_panel'
  | 'fueled_generator'
  | 'battery'
  | 'drug_lab'
  | 'crafting_spot'
  | 'hydroponics'
  | 'barricade'
  | 'standing_lamp';

export interface DrugRecipe {
  id: string;
  name: string;
  producedItem: ItemType;
  producedCount: number;
  workRequired: number; // ticks
  ingredients: { item: ItemType; count: number }[];
  description: string;
  effectsSummary: string;
}

export interface Bill {
  id: string;
  recipeId: string;
  targetCount: number; // repeat count
  currentCompleted: number;
  isInfinite: boolean;
  active: boolean;
}

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  powerRequired?: number;
  powerProduced?: number;
  isConstructed: boolean;
  constructionWorkLeft?: number;
  bills?: Bill[];
  fuel?: number; // for fueled generator
  maxFuel?: number;
  ownerPawnId?: string; // for bed
}

export type ZoneType = 'stockpile' | 'dumping' | 'growing';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  cells: { x: number; y: number }[];
  color: string;
  cropType?: CropType; // For growing zones
  allowedItems?: ItemType[]; // For stockpiles
}

export type WorkType = 
  | 'firefight'
  | 'patient'
  | 'doctor'
  | 'bed_rest'
  | 'farming'
  | 'crafting' // drug synthesis & crafting
  | 'mining'
  | 'construction'
  | 'hauling'
  | 'cleaning'
  | 'guarding';

export interface PawnSkills {
  plants: number;
  crafting: number;
  medicine: number;
  construction: number;
  shooting: number;
  mining: number;
}

export interface DrugTolerance {
  smokeleaf: number; // 0 to 1
  psychite: number;
  goJuice: number;
}

export interface DrugHigh {
  type: ItemType;
  timeLeft: number; // in seconds/ticks
  moodBonus: number;
  painFactor: number; // e.g. 0.7 for 30% reduction
  speedMultiplier: number;
  hungerRateMultiplier: number;
}

export interface PawnNeeds {
  hunger: number; // 0 (starving) to 100 (full)
  rest: number; // 0 (exhausted) to 100 (rested)
  mood: number; // 0 to 100
  recreation: number; // 0 to 100
  chemical: number; // 0 to 100 (drug craving)
}

export interface PawnHealth {
  hp: number;
  maxHp: number;
  bleeding: number; // rate
  consciousness: number; // 0 to 100%
  highs: DrugHigh[];
  tolerances: DrugTolerance;
  addictions: ItemType[];
  wounds: { name: string; severity: number; treated: boolean }[];
}

export type PawnJobType = 
  | 'idle'
  | 'moving'
  | 'sleeping'
  | 'eating'
  | 'recreation'
  | 'harvesting'
  | 'sowing'
  | 'mining'
  | 'building'
  | 'hauling'
  | 'crafting_drug'
  | 'fighting'
  | 'fleeing';

export interface PawnJob {
  type: PawnJobType;
  targetX?: number;
  targetY?: number;
  targetEntityId?: string;
  duration?: number;
  workProgress?: number;
  carriedItem?: { type: ItemType; count: number };
  extraData?: any;
}

export interface Pawn {
  id: string;
  name: string;
  nickname: string;
  faction: 'player' | 'pirates' | 'traders';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  facing: 'north' | 'south' | 'east' | 'west';
  color: string;
  hairColor: string;
  isDrafted: boolean;
  isPlayerCharacter?: boolean;
  manualControl?: boolean;
  weapon: {
    name: string;
    range: number;
    damage: number;
    cooldown: number;
    currentCooldown: number;
  };
  skills: PawnSkills;
  workPriorities: Record<WorkType, number>; // 1-4, or 0 for off
  needs: PawnNeeds;
  health: PawnHealth;
  inventory: { type: ItemType; count: number }[];
  currentJob: PawnJob;
  thoughts: { name: string; moodOffset: number; duration: number }[];
}

export type WeatherType = 'clear' | 'rain' | 'fog' | 'heatwave' | 'coldsnap';

export interface WorldTime {
  day: number;
  hour: number;
  minute: number;
  speed: number; // 0 = pause, 1 = normal, 2 = fast, 3 = ultra
  quadrum: 'Aprimay' | 'Jugust' | 'Septober' | 'Decembary';
  year: number;
}

export interface FactionSettlement {
  id: string;
  name: string;
  faction: string;
  type: 'friendly' | 'neutral' | 'hostile';
  worldX: number;
  worldY: number;
  relations: number; // -100 to 100
  defenseRating: number;
  isOverthrown: boolean;
  lootEstimatedSilver: number;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  damage: number;
  shooterId: string;
  color: string;
  speed?: number; // tiles per second
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number; // 0 to 1
}

export interface MultiplayerPeer {
  id: string;
  name: string;
  status: 'connected' | 'syncing' | 'idle';
  color: string;
  cursorX?: number;
  cursorY?: number;
  lastPing: number;
}

export interface GameLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success' | 'drug';
}
