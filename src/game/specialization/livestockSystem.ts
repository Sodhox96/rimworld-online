import { ItemType } from '../types';

// Livestock breeds with specializations
export type LivestockBreed = 
  | 'chem_boar'
  | 'silk_spider' 
  | 'scale_oxen';

// Livestock specialization data
export interface LivestockSpecialty {
  breed: LivestockBreed;
  name: string;
  description: string;
  primaryResource: ItemType;
  resourcePerDay: number;
  specialTrait: string;
  crossbreedPenalty: number; // Percentage reduction if crossed
  relocationCost: number; // Cost multiplier for moving outside biome
}

export const LIVESTOCK_SPECIALTIES: Record<LivestockBreed, LivestockSpecialty> = {
  chem_boar: {
    breed: 'chem_boar',
    name: 'Chem-Boar',
    description: 'Extracts high-yield Chemfuel daily, but eats double rations',
    primaryResource: 'chemfuel',
    resourcePerDay: 20,
    specialTrait: 'High-yield fuel extraction',
    crossbreedPenalty: 50,
    relocationCost: 200
  },
  silk_spider: {
    breed: 'silk_spider',
    name: 'Silk-Spider',
    description: 'Produces high-tier hyperweave thread for lightweight armor',
    primaryResource: 'hyperweave_thread',
    resourcePerDay: 15,
    specialTrait: 'High-quality fiber production',
    crossbreedPenalty: 40,
    relocationCost: 150
  },
  scale_oxen: {
    breed: 'scale_oxen',
    name: 'Scale-Oxen',
    description: 'Heavy beasts of burden that double caravan carry limits',
    primaryResource: 'heavy_beast_hauling',
    resourcePerDay: 10,
    specialTrait: 'Increased carrying capacity',
    crossbreedPenalty: 30,
    relocationCost: 100
  }
};

// Livestock breeding requirements
export const LIVESTOCK_BREEDING_REQUIREMENTS = {
  chem_boar: {
    requiredBiome: 'volcanic',
    specialEquipment: 'high_temperature_stable',
    maintenanceCost: 15
  },
  silk_spider: {
    requiredBiome: 'jungle',
    specialEquipment: 'humidity_control',
    maintenanceCost: 12
  },
  scale_oxen: {
    requiredBiome: 'boreal',
    specialEquipment: 'cold_resistant_enclosure',
    maintenanceCost: 18
  }
};