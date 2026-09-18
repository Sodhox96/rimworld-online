import { BuildingType, CropType, DrugRecipe, ItemType } from '../types';

export const ITEM_INFO: Record<ItemType, { name: string; value: number; category: string; description: string; color: string }> = {
  silver: { name: 'Silver', value: 1, category: 'Currency', description: 'Universal currency in the Rim.', color: '#E2E8F0' },
  wood: { name: 'Wood', value: 2, category: 'Resource', description: 'Felled tree lumber for construction and fueling.', color: '#B45309' },
  steel: { name: 'Steel', value: 3, category: 'Resource', description: 'Essential refined metal for industry and weapons.', color: '#94A3B8' },
  plasteel: { name: 'Plasteel', value: 12, category: 'Resource', description: 'Ultra-durable advanced spacer alloy.', color: '#38BDF8' },
  uranium: { name: 'Uranium', value: 20, category: 'Resource', description: 'Dense radioisotope for reactors and heavy blunt maces.', color: '#4ADE80' },
  component: { name: 'Component', value: 32, category: 'Resource', description: 'Microelectronic and mechanical circuitry.', color: '#F59E0B' },
  medicine: { name: 'Medicine', value: 18, category: 'Medical', description: 'Sterile industrial pharmaceuticals for surgeries.', color: '#3B82F6' },
  raw_food: { name: 'Raw Berries/Meat', value: 1, category: 'Food', description: 'Nutritious if cooked or eaten raw in desperation.', color: '#EF4444' },
  simple_meal: { name: 'Simple Meal', value: 15, category: 'Food', description: 'A warm cooked meal that restores nourishment.', color: '#F97316' },

  // Farm Crops & Reagents
  smokeleaf_leaves: { name: 'Smokeleaf Leaves', value: 4, category: 'Plant Reagent', description: 'Harvested aromatic leaves used for rolling joints.', color: '#22C55E' },
  psychoid_leaves: { name: 'Psychoid Leaves', value: 5, category: 'Plant Reagent', description: 'Harvested leaves of the psychoid shrub.', color: '#10B981' },
  healroot: { name: 'Healroot Herb', value: 8, category: 'Medical', description: 'Wild medicinal herb used for field medicine.', color: '#14B8A6' },
  neutroamine: { name: 'Neutroamine', value: 14, category: 'Precursor', description: 'Synthetic chemical precursor for advanced drugs.', color: '#A855F7' },

  // Manufactured Drugs
  smokeleaf_joint: { name: 'Smokeleaf Joint', value: 12, category: 'Drug (Social)', description: 'Rolled smokeleaf. Mood +15, Pain -30%, hunger +30%.', color: '#86EFAC' },
  psychite_tea: { name: 'Psychite Tea', value: 10, category: 'Drug (Social)', description: 'Mild brewed psychite drink. Mood +12, safe daily relaxant.', color: '#6EE7B7' },
  flake: { name: 'Flake', value: 14, category: 'Drug (Hard)', description: 'Cheap, intense psychite crystal. Mood +35, highly addictive!', color: '#E0E7FF' },
  yayo: { name: 'Yayo', value: 25, category: 'Drug (Hard)', description: 'Refined psychite powder. Mood +35, Moving +15%, luxury trade drug.', color: '#F8FAFC' },
  go_juice: { name: 'Go-Juice', value: 55, category: 'Drug (Combat)', description: 'Military stimulant. Mood +50, Moving +20%, Pain -90%.', color: '#F43F5E' },
  wake_up: { name: 'Wake-Up', value: 35, category: 'Drug (Worker)', description: 'Instant rest restoration and +20% work speed booster.', color: '#FBBF24' },
};

export const DRUG_RECIPES: DrugRecipe[] = [
  {
    id: 'roll_smokeleaf',
    name: 'Roll Smokeleaf Joint',
    producedItem: 'smokeleaf_joint',
    producedCount: 1,
    workRequired: 80,
    ingredients: [{ item: 'smokeleaf_leaves', count: 4 }],
    description: 'Prepare and roll dried leaves into a relaxing herbal joint.',
    effectsSummary: 'Mood +15, Pain -30%, Consciousness -10%, Hunger Rate +30%',
  },
  {
    id: 'brew_psychite_tea',
    name: 'Brew Psychite Tea',
    producedItem: 'psychite_tea',
    producedCount: 1,
    workRequired: 90,
    ingredients: [{ item: 'psychoid_leaves', count: 4 }],
    description: 'Boil psychoid leaves into a mild, warm stimulating tea.',
    effectsSummary: 'Mood +12, Rest Recovery +15%, Safe Daily Drug',
  },
  {
    id: 'make_flake',
    name: 'Produce Flake',
    producedItem: 'flake',
    producedCount: 1,
    workRequired: 110,
    ingredients: [{ item: 'psychoid_leaves', count: 4 }],
    description: 'Extract crude psychite into smokeable addictive crystals.',
    effectsSummary: 'Mood +35, Pain -50%, Extremely Addictive!',
  },
  {
    id: 'synthesize_yayo',
    name: 'Synthesize Yayo',
    producedItem: 'yayo',
    producedCount: 1,
    workRequired: 160,
    ingredients: [{ item: 'psychoid_leaves', count: 8 }],
    description: 'Chemically refine psychoid leaves into pure white powder.',
    effectsSummary: 'Mood +35, Moving +15%, High Trade Profit Margin',
  },
  {
    id: 'synthesize_go_juice',
    name: 'Synthesize Go-Juice',
    producedItem: 'go_juice',
    producedCount: 1,
    workRequired: 220,
    ingredients: [
      { item: 'yayo', count: 1 },
      { item: 'neutroamine', count: 2 },
    ],
    description: 'Formulate hyper-potent military combat stimulant injection.',
    effectsSummary: 'Mood +50, Moving +20%, Pain -90%, Overdose Hazard',
  },
  {
    id: 'synthesize_wake_up',
    name: 'Synthesize Wake-Up',
    producedItem: 'wake_up',
    producedCount: 1,
    workRequired: 180,
    ingredients: [{ item: 'neutroamine', count: 2 }],
    description: 'Synthesize synthetic alertness stimulator pill.',
    effectsSummary: 'Rest set to 100%, Global Work Speed +20%',
  },
];

export const BUILDING_DEFS: Record<BuildingType, {
  name: string;
  cost: { item: ItemType; count: number }[];
  hp: number;
  width: number;
  height: number;
  powerRequired?: number;
  powerProduced?: number;
  description: string;
  category: 'Structure' | 'Production' | 'Furniture' | 'Power' | 'Security';
}> = {
  wall_wood: {
    name: 'Wood Wall',
    cost: [{ item: 'wood', count: 5 }],
    hp: 120,
    width: 1,
    height: 1,
    category: 'Structure',
    description: 'Cheap wooden perimeter barrier. Flammable.',
  },
  wall_stone: {
    name: 'Stone Wall',
    cost: [{ item: 'steel', count: 5 }],
    hp: 300,
    width: 1,
    height: 1,
    category: 'Structure',
    description: 'Durable stone masonry wall. Impassable & fireproof.',
  },
  wall_steel: {
    name: 'Steel Wall',
    cost: [{ item: 'steel', count: 6 }],
    hp: 250,
    width: 1,
    height: 1,
    category: 'Structure',
    description: 'Sturdy reinforced steel wall.',
  },
  door: {
    name: 'Colony Door',
    cost: [{ item: 'wood', count: 20 }],
    hp: 100,
    width: 1,
    height: 1,
    category: 'Structure',
    description: 'Allows colonists through while sealing rooms.',
  },
  barricade: {
    name: 'Sandbag Barricade',
    cost: [{ item: 'steel', count: 10 }],
    hp: 180,
    width: 1,
    height: 1,
    category: 'Security',
    description: 'Provides 65% combat cover for drafted defenders.',
  },
  bed: {
    name: 'Colonist Bed',
    cost: [{ item: 'wood', count: 35 }],
    hp: 140,
    width: 1,
    height: 2,
    category: 'Furniture',
    description: 'Comfortable sleeping spot for pawns to restore rest.',
  },
  hospital_bed: {
    name: 'Hospital Bed',
    cost: [{ item: 'steel', count: 40 }, { item: 'medicine', count: 2 }],
    hp: 200,
    width: 1,
    height: 2,
    category: 'Furniture',
    description: 'Improves surgery success and patient wound healing rate.',
  },
  table_dining: {
    name: 'Dining Table',
    cost: [{ item: 'wood', count: 30 }],
    hp: 120,
    width: 2,
    height: 2,
    category: 'Furniture',
    description: 'Prevents the infamous "Ate without table -3" mood debuff.',
  },
  chair: {
    name: 'Dining Chair',
    cost: [{ item: 'wood', count: 15 }],
    hp: 80,
    width: 1,
    height: 1,
    category: 'Furniture',
    description: 'Comfortable seating for eating and working.',
  },
  standing_lamp: {
    name: 'Standing Lamp',
    cost: [{ item: 'steel', count: 15 }],
    hp: 50,
    width: 1,
    height: 1,
    powerRequired: 20,
    category: 'Furniture',
    description: 'Illuminates rooms to remove darkness mood penalties.',
  },
  drug_lab: {
    name: 'Drug Synthesis Lab',
    cost: [{ item: 'steel', count: 50 }, { item: 'component', count: 3 }],
    hp: 250,
    width: 3,
    height: 2,
    powerRequired: 100,
    category: 'Production',
    description: 'Equipped with chemical distillation glassware for manufacturing Flake, Yayo, Go-Juice, and Wake-Up.',
  },
  crafting_spot: {
    name: 'Crafting Spot',
    cost: [],
    hp: 50,
    width: 1,
    height: 1,
    category: 'Production',
    description: 'A clear patch of floor for rolling Smokeleaf joints and brewing tea.',
  },
  hydroponics: {
    name: 'Hydroponics Basin',
    cost: [{ item: 'steel', count: 60 }, { item: 'component', count: 1 }],
    hp: 150,
    width: 4,
    height: 1,
    powerRequired: 70,
    category: 'Production',
    description: 'Accelerates crop growth to 280% indoors regardless of season.',
  },
  solar_panel: {
    name: 'Solar Generator',
    cost: [{ item: 'steel', count: 80 }, { item: 'component', count: 3 }],
    hp: 200,
    width: 3,
    height: 3,
    powerProduced: 250,
    category: 'Power',
    description: 'Produces abundant clean electricity during daytime.',
  },
  fueled_generator: {
    name: 'Fueled Generator',
    cost: [{ item: 'steel', count: 75 }, { item: 'component', count: 2 }],
    hp: 250,
    width: 2,
    height: 2,
    powerProduced: 350,
    category: 'Power',
    description: 'Burns wood to produce steady 24/7 electrical power.',
  },
  battery: {
    name: 'Power Battery',
    cost: [{ item: 'steel', count: 50 }, { item: 'component', count: 2 }],
    hp: 100,
    width: 1,
    height: 2,
    category: 'Power',
    description: 'Stores surplus solar electrical charge for nighttime usage.',
  },
};

export const CROP_DEFS: Record<CropType, {
  name: string;
  growHours: number;
  yieldItem: ItemType;
  yieldCount: number;
  minFertility: number;
  description: string;
  color: string;
}> = {
  potato: {
    name: 'Potatoes',
    growHours: 12,
    yieldItem: 'raw_food',
    yieldCount: 10,
    minFertility: 0.6,
    description: 'Hardy caloric crop that grows reliably in poor soil.',
    color: '#D97706',
  },
  smokeleaf: {
    name: 'Smokeleaf Plant',
    growHours: 16,
    yieldItem: 'smokeleaf_leaves',
    yieldCount: 8,
    minFertility: 0.8,
    description: 'Fragrant broadleaf plant. Leaves are dried and rolled into joints.',
    color: '#16A34A',
  },
  psychoid: {
    name: 'Psychoid Shrub',
    growHours: 20,
    yieldItem: 'psychoid_leaves',
    yieldCount: 8,
    minFertility: 0.9,
    description: 'Tough chemical shrub whose leaves produce psychite tea, flake, and yayo.',
    color: '#059669',
  },
  healroot: {
    name: 'Healroot Herb',
    growHours: 24,
    yieldItem: 'healroot',
    yieldCount: 2,
    minFertility: 1.0,
    description: 'Slow-growing wild medicinal root with natural antiseptic qualities.',
    color: '#0D9488',
  },
};
