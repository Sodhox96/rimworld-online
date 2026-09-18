// Multiplayer cooperative systems
export interface PlayerSpecialization {
  playerId: string;
  biome: string;
  livestockSpecialty: string;
  harvestingSpecialty: string;
  researchFocus: string;
  contributionScore: number;
}

// Server-wide cooperative systems
export interface CooperativeProgression {
  serverTier: ProgressionTier;
  sharedResources: { item: string; amount: number }[];
  globalEvents: string[];
  cooperativeBonuses: {
    [key: string]: number;
  };
  achievementProgress: {
    [achievement: string]: number;
  };
}

// Megaproject event system
export interface MegaprojectEvent {
  id: string;
  name: string;
  description: string;
  phase: 'preparation' | 'activation' | 'escalation' | 'completion';
  requiredResources: { item: string; amount: number }[];
  progress: number; // 0-100
  participants: string[]; // Player IDs
  eventStatus: 'active' | 'completed' | 'failed';
}

// Orbital Aegis Array event implementation
export const ORBITAL_AEGIS_ARRAY: MegaprojectEvent = {
  id: 'orbital_aegis_array',
  name: 'The Orbital Aegis Array',
  description: 'A massive satellite grid anchored by four regional Ground Beacons',
  phase: 'preparation',
  requiredResources: [
    { item: 'ignis_coolant_core', amount: 50 },
    { item: 'bio_polymer_resin', amount: 75 },
    { item: 'superconductor', amount: 60 },
    { item: 'focused_quartz_lens', amount: 30 }
  ],
  progress: 0,
  participants: [],
  eventStatus: 'active'
};

// Dynamic escalation risks
export interface EscalationRisk {
  regionId: string;
  combinedWealth: number;
  techScore: number;
  raidScaling: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export const ESCALATION_SYSTEM = {
  riskCalculation: (wealth: number, techScore: number) => {
    return Math.min(100, (wealth + techScore) / 2);
  },
  raidScaling: {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    extreme: 2.0
  }
};