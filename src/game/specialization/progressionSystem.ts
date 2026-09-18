// Tiered progression system
export type ProgressionTier = 1 | 2 | 3 | 4;

// Technology progression data
export interface TechProgression {
  tier: ProgressionTier;
  name: string;
  description: string;
  unlocks: string[]; // Feature or building unlocks
  requirements: {
    resources: { item: string; amount: number }[];
    tech: string[];
    cooperation: boolean;
  };
  escalationEvents: string[];
}

export const PROGRESSION_TIER_SYSTEM: Record<ProgressionTier, TechProgression> = {
  1: {
    tier: 1,
    name: 'Local Survival & Manual Caravans',
    description: 'Basic regional trade posts and manual pack mule caravans',
    unlocks: ['basic_trade_posts', 'manual_caravans'],
    requirements: {
      resources: [],
      tech: [],
      cooperation: false
    },
    escalationEvents: ['local_hostile_patrols']
  },
  2: {
    tier: 2,
    name: 'Regional Automation & Industrial Refining',
    description: 'Automated supply caravans and regional power grids',
    unlocks: ['automated_supply_lines', 'regional_power_grids'],
    requirements: {
      resources: [],
      tech: ['tier_1_completion'],
      cooperation: true
    },
    escalationEvents: ['pollution_and_environmental_decay']
  },
  3: {
    tier: 3,
    name: 'Continental Infrastructure & Orbital Link',
    description: 'Sub-orbital drop pods and global radio networks',
    unlocks: ['sub_orbital_drop_pods', 'global_radio_networks'],
    requirements: {
      resources: [],
      tech: ['tier_2_completion'],
      cooperation: true
    },
    escalationEvents: ['mechanoid_hive_incursions']
  },
  4: {
    tier: 4,
    name: 'Planetary Superstructures & Megaprojects',
    description: 'Orbital elevator and atmospheric shields',
    unlocks: ['orbital_elevator', 'atmospheric_shields'],
    requirements: {
      resources: [],
      tech: ['tier_3_completion'],
      cooperation: true
    },
    escalationEvents: ['planetary_cataclysms']
  }
};

// Diminishing returns system
export const DIMINISHING_RETURNS = {
  penaltyThreshold: 75,
  penaltyPercentage: 0.75,
  researchSpeedPenalty: (isSolo: boolean) => isSolo ? 0.25 : 1.0
};

// Guild tax system
export interface GuildTaxRequirement {
  item: string;
  amount: number;
  maintenanceCost: number;
  requiredBiome: string;
}

export const GUILD_TAX_REQUIREMENTS: Record<string, GuildTaxRequirement> = {
  'power_shields': {
    item: 'ignis_coolant',
    amount: 10,
    maintenanceCost: 5,
    requiredBiome: 'volcanic'
  }
};