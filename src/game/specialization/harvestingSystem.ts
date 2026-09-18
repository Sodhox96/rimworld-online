import { ItemType } from '../types';

// Specialized refining processes
export type RefiningProcess = 
  | 'refinery_base'
  | 'lab_base' 
  | 'smelter_base';

// Refining process data
export interface RefiningProcessSpec {
  process: RefiningProcess;
  name: string;
  description: string;
  requiredResources: ItemType[];
  outputResource: ItemType;
  efficiencyMultiplier: number;
  powerConsumption: number;
  specializedWorkers: string[];
}

export const REFINING_PROCESSES: Record<RefiningProcess, RefiningProcessSpec> = {
  refinery_base: {
    process: 'refinery_base',
    name: 'The Refinery Base',
    description: 'Converts raw crude/chemfuel into Plasteel Resins',
    requiredResources: ['chemfuel', 'crude_oil'],
    outputResource: 'plasteel_resins',
    efficiencyMultiplier: 3,
    powerConsumption: 500,
    specializedWorkers: ['refinery_engineer', 'chemical_specialist']
  },
  lab_base: {
    process: 'lab_base',
    name: 'The Lab Base',
    description: 'Synthesizes raw crops into High-Grade Neuro-Trainers',
    requiredResources: ['neutroamine', 'psychoid_leaves'],
    outputResource: 'neuro_trainers',
    efficiencyMultiplier: 2.5,
    powerConsumption: 400,
    specializedWorkers: ['biochemist', 'neuro_specialist']
  },
  smelter_base: {
    process: 'smelter_base',
    name: 'The Smelter Base',
    description: 'Turns low-grade iron ore into Reinforced Structural Slabs',
    requiredResources: ['iron_ore', 'coal'],
    outputResource: 'reinforced_structural_slabs',
    efficiencyMultiplier: 3,
    powerConsumption: 600,
    specializedWorkers: ['metallurgist', 'foundry_worker']
  }
};

// Resource chain dependencies
export const RESOURCE_CHAINS = {
  raw_to_refined: {
    chain: ['raw_ore', 'refined_metal'],
    dependencies: ['smelter_base', 'refinery_base'],
    efficiencyBoost: 3
  },
  crop_to_high_grade: {
    chain: ['raw_crops', 'high_grade_neuro_trainers'],
    dependencies: ['lab_base'],
    efficiencyBoost: 2.5
  }
};