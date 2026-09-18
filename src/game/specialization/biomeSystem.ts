import { ItemType } from '../types';

// Biome-specific resource types
export type BiomeType = 'volcanic' | 'jungle' | 'boreal' | 'desert' | 'tundra';

// Specialized resources for each biome
export interface BiomeResource {
  type: ItemType;
  name: string;
  description: string;
  requiredFor: string[];
}

// Biome-specific resources
export const BIOME_RESOURCES: Record<BiomeType, BiomeResource[]> = {
  volcanic: [
    {
      type: 'ignis_sulfur',
      name: 'Ignis-Sulfur',
      description: 'Required for explosive ammo and advanced power cells',
      requiredFor: ['explosives', 'advanced_power_cells']
    }
  ],
  jungle: [
    {
      type: 'neutro_flora',
      name: 'Neutro-Flora',
      description: 'Base plant needed for medicine and combat stimulants',
      requiredFor: ['medicine', 'combat_stimulants']
    }
  ],
  boreal: [
    {
      type: 'thrumbo_husk_yak',
      name: 'Thrumbo-Husk Yak',
      description: 'Provides thermal-insulated leather for environmental suits',
      requiredFor: ['thermal_insulated_leather', 'environmental_suits']
    }
  ],
  desert: [
    {
      type: 'focused_quartz_lens',
      name: 'Focused Quartz Lens',
      description: 'Used in satellite lasers and precision optics',
      requiredFor: ['satellite_lasers', 'precision_optics']
    }
  ],
  tundra: [
    {
      type: 'cryo_superconductor',
      name: 'Cryo-Superconductor',
      description: 'Essential for energy transfer in cold environments',
      requiredFor: ['energy_transfer', 'cold_environment_systems']
    }
  ]
};

// Location-specific compounds that require multiple biomes
export const LOCATION_COMPOUNDS = {
  mid_tier_shield: {
    name: 'Mid-Tier Space-Capable Base Shield',
    requiredIngredients: ['ignis_sulfur', 'neutro_flora', 'thrumbo_husk_yak'],
    description: 'Requires items from all three biomes'
  },
  advanced_refinement: {
    name: 'Advanced Refinement Compound',
    requiredIngredients: ['ignis_sulfur', 'neutro_flora', 'cryo_superconductor'],
    description: 'Combines volcanic and jungle elements with cryogenic properties'
  }
};