import { DRUG_RECIPES, ITEM_INFO } from './constants';
import { worldManager } from './world';
import { sound } from '../utils/audio';
import { 
  Building, 
  DrugRecipe, 
  FactionSettlement, 
  FloatingText, 
  GameLog, 
  Item, 
  ItemType, 
  Pawn, 
  PawnJob, 
  Plant, 
  Projectile, 
  WeatherType, 
  WorkType, 
  WorldTime, 
  Zone 
} from '../types';

export class ColonySimulation {
  public colonyName: string = 'New Hope Outpost';
  public time: WorldTime = {
    day: 1,
    hour: 8,
    minute: 0,
    speed: 1,
    quadrum: 'Aprimay',
    year: 5500,
  };

  public weather: {
    type: WeatherType;
    temperature: number; // in Celsius
    light: number; // 0 to 1
  } = {
    type: 'clear',
    temperature: 21,
    light: 0.9,
  };

  public resources: Record<ItemType, number> = {
    silver: 450,
    wood: 120,
    steel: 180,
    plasteel: 25,
    uranium: 10,
    component: 12,
    medicine: 8,
    raw_food: 40,
    simple_meal: 15,
    smokeleaf_leaves: 24,
    psychoid_leaves: 20,
    healroot: 4,
    neutroamine: 8,
    smokeleaf_joint: 6,
    psychite_tea: 4,
    flake: 0,
    yayo: 2,
    go_juice: 1,
    wake_up: 2,
  };

  public pawns: Map<string, Pawn> = new Map();
  public buildings: Map<string, Building> = new Map();
  public zones: Map<string, Zone> = new Map();
  public projectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];
  public logs: GameLog[] = [];

  public worldFactions: FactionSettlement[] = [
    {
      id: 'fac_bloodhounds',
      name: 'Bloodhound Pirates',
      faction: 'Pirates',
      type: 'hostile',
      worldX: 18,
      worldY: -12,
      relations: -100,
      defenseRating: 65,
      isOverthrown: false,
      lootEstimatedSilver: 1200,
    },
    {
      id: 'fac_outlanders',
      name: 'Union of Free Settlers',
      faction: 'Outlander',
      type: 'friendly',
      worldX: -14,
      worldY: 8,
      relations: 55,
      defenseRating: 80,
      isOverthrown: false,
      lootEstimatedSilver: 2400,
    },
    {
      id: 'fac_tribal',
      name: 'Red River Tribe',
      faction: 'Tribal',
      type: 'neutral',
      worldX: 6,
      worldY: 22,
      relations: 10,
      defenseRating: 45,
      isOverthrown: false,
      lootEstimatedSilver: 800,
    },
  ];

  private tickAccumulator: number = 0;
  private nextRaidHour: number = 18;

  constructor() {
    this.initDefaultColony();
  }

  public initDefaultColony() {
    this.pawns.clear();
    this.buildings.clear();
    this.zones.clear();
    this.projectiles = [];
    this.floatingTexts = [];
    this.logs = [];
    worldManager.clearAll();

    // 1. Generate starting initial base structures around (0, 0)
    // Drug Lab & Workshop
    this.buildings.set('b_drug_lab', {
      id: 'b_drug_lab',
      type: 'drug_lab',
      x: 3,
      y: 1,
      width: 3,
      height: 2,
      hp: 250,
      maxHp: 250,
      isConstructed: true,
      bills: [
        {
          id: 'bill_smokeleaf_repeat',
          recipeId: 'roll_smokeleaf',
          targetCount: 10,
          currentCompleted: 0,
          isInfinite: true,
          active: true,
        },
        {
          id: 'bill_yayo_profit',
          recipeId: 'synthesize_yayo',
          targetCount: 5,
          currentCompleted: 0,
          isInfinite: false,
          active: true,
        },
      ],
    });

    // Crafting Spot
    this.buildings.set('b_crafting_spot', {
      id: 'b_crafting_spot',
      type: 'crafting_spot',
      x: 7,
      y: 2,
      width: 1,
      height: 1,
      hp: 50,
      maxHp: 50,
      isConstructed: true,
      bills: [
        {
          id: 'bill_tea_safe',
          recipeId: 'brew_psychite_tea',
          targetCount: 5,
          currentCompleted: 0,
          isInfinite: true,
          active: true,
        },
      ],
    });

    // Dining table & Chairs
    this.buildings.set('b_table', {
      id: 'b_table',
      type: 'table_dining',
      x: -3,
      y: 2,
      width: 2,
      height: 2,
      hp: 120,
      maxHp: 120,
      isConstructed: true,
    });
    this.buildings.set('b_chair1', {
      id: 'b_chair1',
      type: 'chair',
      x: -3,
      y: 1,
      width: 1,
      height: 1,
      hp: 80,
      maxHp: 80,
      isConstructed: true,
    });

    // Colonist Beds
    this.buildings.set('b_bed1', {
      id: 'b_bed1',
      type: 'bed',
      x: -6,
      y: 1,
      width: 1,
      height: 2,
      hp: 140,
      maxHp: 140,
      isConstructed: true,
    });
    this.buildings.set('b_bed2', {
      id: 'b_bed2',
      type: 'bed',
      x: -8,
      y: 1,
      width: 1,
      height: 2,
      hp: 140,
      maxHp: 140,
      isConstructed: true,
    });
    this.buildings.set('b_bed3', {
      id: 'b_bed3',
      type: 'bed',
      x: -10,
      y: 1,
      width: 1,
      height: 2,
      hp: 140,
      maxHp: 140,
      isConstructed: true,
    });

    // Power Generation: Solar & Battery
    this.buildings.set('b_solar', {
      id: 'b_solar',
      type: 'solar_panel',
      x: -2,
      y: -6,
      width: 3,
      height: 3,
      hp: 200,
      maxHp: 200,
      powerProduced: 250,
      isConstructed: true,
    });
    this.buildings.set('b_battery', {
      id: 'b_battery',
      type: 'battery',
      x: 2,
      y: -5,
      width: 1,
      height: 2,
      hp: 100,
      maxHp: 100,
      isConstructed: true,
    });

    // Protective Barricades
    for (let bx = -4; bx <= 4; bx += 2) {
      this.buildings.set(`b_barricade_${bx}`, {
        id: `b_barricade_${bx}`,
        type: 'barricade',
        x: bx,
        y: 8,
        width: 1,
        height: 1,
        hp: 180,
        maxHp: 180,
        isConstructed: true,
      });
    }

    // 2. Add Stockpile Zone
    const stockpileCells: { x: number; y: number }[] = [];
    for (let sx = 2; sx <= 6; sx++) {
      for (let sy = 5; sy <= 7; sy++) {
        stockpileCells.push({ x: sx, y: sy });
      }
    }
    this.zones.set('z_stockpile_main', {
      id: 'z_stockpile_main',
      name: 'Main Stockpile',
      type: 'stockpile',
      cells: stockpileCells,
      color: 'rgba(59, 130, 246, 0.25)',
    });

    // 3. Add Growing Zones for Smokeleaf & Psychoid
    const smokeleafCells: { x: number; y: number }[] = [];
    for (let gx = -8; gx <= -5; gx++) {
      for (let gy = 6; gy <= 8; gy++) {
        smokeleafCells.push({ x: gx, y: gy });
      }
    }
    this.zones.set('z_growing_smokeleaf', {
      id: 'z_growing_smokeleaf',
      name: 'Smokeleaf Plantation',
      type: 'growing',
      cropType: 'smokeleaf',
      cells: smokeleafCells,
      color: 'rgba(34, 197, 94, 0.28)',
    });

    const psychoidCells: { x: number; y: number }[] = [];
    for (let px = -8; px <= -5; px++) {
      for (let py = 10; py <= 12; py++) {
        psychoidCells.push({ x: px, y: py });
      }
    }
    this.zones.set('z_growing_psychoid', {
      id: 'z_growing_psychoid',
      name: 'Psychoid Shrub Field',
      type: 'growing',
      cropType: 'psychoid',
      cells: psychoidCells,
      color: 'rgba(16, 185, 129, 0.28)',
    });

    // Populate crops in growing zones
    smokeleafCells.forEach((c, idx) => {
      worldManager.plants.set(`${c.x},${c.y}`, {
        id: `crop_smokeleaf_${idx}`,
        type: 'smokeleaf',
        x: c.x,
        y: c.y,
        growth: 0.4 + (idx % 5) * 0.15,
        maxGrowthTime: 16,
        yieldItem: 'smokeleaf_leaves',
        yieldCount: 8,
        hp: 25,
      });
    });

    psychoidCells.forEach((c, idx) => {
      worldManager.plants.set(`${c.x},${c.y}`, {
        id: `crop_psychoid_${idx}`,
        type: 'psychoid',
        x: c.x,
        y: c.y,
        growth: 0.3 + (idx % 6) * 0.14,
        maxGrowthTime: 20,
        yieldItem: 'psychoid_leaves',
        yieldCount: 8,
        hp: 30,
      });
    });

    // 4. Starting Player Character & Colonists
    this.createPawn({
      id: 'pawn_player',
      name: 'Commander Noah (You)',
      nickname: 'Noah (You)',
      faction: 'player',
      isPlayerCharacter: true,
      manualControl: true,
      x: 0,
      y: 1,
      facing: 'south',
      color: '#F59E0B',
      hairColor: '#E2E8F0',
      weapon: {
        name: 'Survival Carbine',
        range: 12,
        damage: 18,
        cooldown: 3,
        currentCooldown: 0,
      },
      skills: {
        crafting: 10,
        plants: 8,
        medicine: 8,
        construction: 8,
        shooting: 9,
        mining: 7,
      },
      workPriorities: {
        firefight: 1,
        patient: 1,
        doctor: 1,
        bed_rest: 1,
        crafting: 1,
        farming: 2,
        mining: 2,
        construction: 2,
        hauling: 3,
        cleaning: 3,
        guarding: 1,
      },
    });

    this.createPawn({
      id: 'pawn_val',
      name: 'Valerie "Val" Cross',
      nickname: 'Val',
      faction: 'player',
      x: 0,
      y: 3,
      facing: 'south',
      color: '#38BDF8',
      hairColor: '#F59E0B',
      weapon: {
        name: 'Bolt-Action Rifle',
        range: 12,
        damage: 18,
        cooldown: 4,
        currentCooldown: 0,
      },
      skills: {
        crafting: 8,
        plants: 6,
        medicine: 7,
        construction: 5,
        shooting: 8,
        mining: 4,
      },
      workPriorities: {
        firefight: 1,
        patient: 1,
        doctor: 1,
        bed_rest: 2,
        crafting: 1, // master drug synthesizer
        farming: 2,
        mining: 3,
        construction: 3,
        hauling: 3,
        cleaning: 4,
        guarding: 2,
      },
    });

    this.createPawn({
      id: 'pawn_sam',
      name: 'Samuel "Sammy" Stone',
      nickname: 'Sammy',
      faction: 'player',
      x: -4,
      y: 5,
      facing: 'east',
      color: '#4ADE80',
      hairColor: '#78350F',
      weapon: {
        name: 'Autopistol',
        range: 8,
        damage: 10,
        cooldown: 25,
        currentCooldown: 0,
      },
      skills: {
        crafting: 4,
        plants: 9, // expert grower
        medicine: 3,
        construction: 6,
        shooting: 5,
        mining: 7,
      },
      workPriorities: {
        firefight: 1,
        patient: 1,
        doctor: 3,
        bed_rest: 2,
        crafting: 3,
        farming: 1, // priority farm
        mining: 2,
        construction: 2,
        hauling: 2,
        cleaning: 3,
        guarding: 3,
      },
    });

    this.createPawn({
      id: 'pawn_reaper',
      name: 'Marcus "Reaper" Vance',
      nickname: 'Reaper',
      faction: 'player',
      x: 2,
      y: 6,
      facing: 'west',
      color: '#FB7185',
      hairColor: '#1E293B',
      weapon: {
        name: 'Pump Shotgun',
        range: 6,
        damage: 22,
        cooldown: 45,
        currentCooldown: 0,
      },
      skills: {
        crafting: 5,
        plants: 3,
        medicine: 4,
        construction: 9, // master builder
        shooting: 9,
        mining: 8,
      },
      workPriorities: {
        firefight: 1,
        patient: 1,
        doctor: 4,
        bed_rest: 2,
        crafting: 4,
        farming: 4,
        mining: 2,
        construction: 1, // priority builder
        hauling: 2,
        cleaning: 3,
        guarding: 1,
      },
    });

    this.addLog('Colony founded. 3 survivors landed with survival packages, seeds, and weapon loadouts.', 'info');
    this.addLog('Val started automated work: Crafting drugs at the Drug Synthesis Lab.', 'drug');
  }

  public createPawn(config: Partial<Pawn> & { id: string; name: string; nickname: string; faction: 'player' | 'pirates' | 'traders' }): Pawn {
    const pawn: Pawn = {
      id: config.id,
      name: config.name,
      nickname: config.nickname,
      faction: config.faction,
      x: config.x ?? 0,
      y: config.y ?? 0,
      facing: config.facing ?? 'south',
      color: config.color ?? '#60A5FA',
      hairColor: config.hairColor ?? '#92400E',
      isDrafted: false,
      isPlayerCharacter: config.isPlayerCharacter ?? false,
      manualControl: config.manualControl ?? false,
      weapon: config.weapon ?? {
        name: 'Survival Rifle',
        range: 10,
        damage: 14,
        cooldown: 35,
        currentCooldown: 0,
      },
      skills: config.skills ?? {
        plants: 5,
        crafting: 5,
        medicine: 5,
        construction: 5,
        shooting: 5,
        mining: 5,
      },
      workPriorities: config.workPriorities ?? {
        firefight: 1,
        patient: 1,
        doctor: 2,
        bed_rest: 2,
        farming: 2,
        crafting: 2,
        mining: 2,
        construction: 2,
        hauling: 3,
        cleaning: 4,
        guarding: 3,
      },
      needs: {
        hunger: 85,
        rest: 90,
        mood: 78,
        recreation: 70,
        chemical: 100,
      },
      health: {
        hp: 100,
        maxHp: 100,
        bleeding: 0,
        consciousness: 100,
        highs: [],
        tolerances: {
          smokeleaf: 0.05,
          psychite: 0.02,
          goJuice: 0,
        },
        addictions: [],
        wounds: [],
      },
      inventory: [],
      currentJob: { type: 'idle' },
      thoughts: [
        { name: 'New Colony Hope', moodOffset: 10, duration: 200 },
        { name: 'Comfortable Environment', moodOffset: 4, duration: 150 },
      ],
    };

    this.pawns.set(pawn.id, pawn);
    return pawn;
  }

  public addLog(message: string, type: 'info' | 'warning' | 'danger' | 'success' | 'drug' = 'info') {
    const timeStr = `Day ${this.time.day}, ${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
    this.logs.unshift({
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: timeStr,
      message,
      type,
    });
    if (this.logs.length > 60) {
      this.logs.pop();
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#FFFFFF') {
    this.floatingTexts.push({
      id: `float_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      life: 1.0,
    });
  }

  /**
   * Main Simulation Loop Tick
   */
  public update(deltaTime: number) {
    if (this.time.speed === 0) return; // Paused

    const timeMultiplier = this.time.speed === 1 ? 1 : this.time.speed === 2 ? 2.5 : 5.0;
    const clampedDelta = Math.min(deltaTime, 0.1);
    const effectiveDelta = clampedDelta * timeMultiplier;

    this.tickAccumulator += effectiveDelta;

    // Advance in-game clock (cap ticks per frame to 4 to prevent spiral of death)
    let ticks = 0;
    while (this.tickAccumulator >= 0.5 && ticks < 4) {
      this.tickAccumulator -= 0.5;
      ticks++;
      this.advanceTime();
      this.simulationTick();
    }
    if (this.tickAccumulator > 1.0) {
      this.tickAccumulator = 0;
    }

    // Smooth movement and projectile interpolations
    this.interpolateEntities(effectiveDelta);
  }

  private advanceTime() {
    this.time.minute += 1;
    if (this.time.minute >= 60) {
      this.time.minute = 0;
      this.time.hour += 1;

      // Hourly events
      this.onHourPassed();

      if (this.time.hour >= 24) {
        this.time.hour = 0;
        this.time.day += 1;
        this.onDayPassed();
      }
    }

    // Calculate dynamic ambient lighting (Day/Night cycle)
    const hour = this.time.hour + this.time.minute / 60;
    if (hour >= 6 && hour <= 18) {
      // Daytime
      const middayDist = Math.abs(12 - hour);
      this.weather.light = 0.95 - (middayDist / 6) * 0.3;
    } else {
      // Nighttime
      this.weather.light = 0.28;
    }

    // Weather temperature diurnal swing
    this.weather.temperature = Math.round(18 + Math.sin((hour - 8) * (Math.PI / 12)) * 6);
  }

  private onHourPassed() {
    // 1. Advance plant growth in growing zones & wild flora
    worldManager.plants.forEach((plant) => {
      if (plant.growth < 1.0) {
        const growthSpeed = 1 / plant.maxGrowthTime;
        plant.growth = Math.min(1.0, plant.growth + growthSpeed * 0.25);
      }
    });

    // 2. Check for dynamic Pirate Raids
    if (this.time.day >= 1 && this.time.hour === this.nextRaidHour) {
      this.triggerPirateRaid();
      this.nextRaidHour = (this.nextRaidHour + 20 + Math.floor(Math.random() * 16)) % 24;
    }

    // 3. Check for Visiting Friendly Caravan
    if (this.time.hour === 10 && Math.random() < 0.2) {
      this.triggerCaravanArrival();
    }
  }

  private onDayPassed() {
    this.addLog(`Day ${this.time.day} begins. Temperature: ${this.weather.temperature}°C. Weather: ${this.weather.type.toUpperCase()}.`, 'info');

    // Weather change chance
    const weathers: WeatherType[] = ['clear', 'rain', 'fog', 'heatwave'];
    this.weather.type = weathers[Math.floor(Math.random() * weathers.length)];
  }

  public triggerPirateRaid() {
    sound.playAlarm();
    this.addLog('ALARM: Hostile Bloodhound Pirates have launched an armed raid!', 'danger');

    const spawnSide = Math.random() < 0.5 ? -15 : 15;
    const enemyCount = 2 + Math.floor(this.time.day * 0.5);

    for (let i = 0; i < enemyCount; i++) {
      const pirate = this.createPawn({
        id: `pirate_${Date.now()}_${i}`,
        name: `Pirate Raider ${i + 1}`,
        nickname: `Raider #${i + 1}`,
        faction: 'pirates',
        x: spawnSide + (Math.random() * 4 - 2),
        y: 12 + i * 2,
        color: '#EF4444',
        hairColor: '#000000',
        weapon: {
          name: i % 2 === 0 ? 'Assault Rifle' : 'Heavy Club',
          range: i % 2 === 0 ? 10 : 1.5,
          damage: i % 2 === 0 ? 16 : 14,
          cooldown: i % 2 === 0 ? 4 : 2,
          currentCooldown: 0,
        },
      });
      pirate.currentJob = { type: 'fighting' };
    }
  }

  public triggerCaravanArrival() {
    this.addLog('A friendly Outlander Trading Caravan has arrived! Check the Trade menu.', 'success');
    const trader = this.createPawn({
      id: `trader_${Date.now()}`,
      name: 'Trader Marcus',
      nickname: 'Marcus',
      faction: 'traders',
      x: 14,
      y: 0,
      color: '#FBBF24',
      hairColor: '#3B82F6',
      weapon: {
        name: 'Heavy SMG',
        range: 8,
        damage: 12,
        cooldown: 3,
        currentCooldown: 0,
      },
    });
    trader.currentJob = { type: 'idle', duration: 200 };
  }

  /**
   * Simulation Tick: Pawns AI, needs, work, combat, drug processing
   */
  private simulationTick() {
    // Update Pawns logic, needs, and combat state
    this.pawns.forEach((pawn) => {
      this.updatePawnNeeds(pawn);
      this.updatePawnHealthAndDrugs(pawn);
      this.updatePawnCombat(pawn);
      this.updatePawnAI(pawn);
    });
  }

  private updatePawnNeeds(pawn: Pawn) {
    // Deplete hunger and rest gradually
    pawn.needs.hunger = Math.max(0, pawn.needs.hunger - 0.08);
    pawn.needs.rest = Math.max(0, pawn.needs.rest - 0.05);

    // Recreation
    pawn.needs.recreation = Math.max(0, pawn.needs.recreation - 0.06);

    // Chemical need if addicted
    if (pawn.health.addictions.length > 0) {
      pawn.needs.chemical = Math.max(0, pawn.needs.chemical - 0.12);
    }

    // Calculate Mood from base + thoughts + drug highs
    let moodSum = 50; // baseline
    pawn.thoughts.forEach((t) => (moodSum += t.moodOffset));
    pawn.health.highs.forEach((h) => (moodSum += h.moodBonus));

    // Starvation / exhaustion debuffs
    if (pawn.needs.hunger < 20) moodSum -= 20;
    if (pawn.needs.rest < 15) moodSum -= 18;
    if (pawn.needs.chemical < 20 && pawn.health.addictions.length > 0) moodSum -= 25;

    pawn.needs.mood = Math.min(100, Math.max(0, moodSum));
  }

  private updatePawnHealthAndDrugs(pawn: Pawn) {
    // Decrement active drug highs
    for (let i = pawn.health.highs.length - 1; i >= 0; i--) {
      const high = pawn.health.highs[i];
      high.timeLeft -= 1;
      if (high.timeLeft <= 0) {
        this.addLog(`${pawn.nickname}'s ${ITEM_INFO[high.type].name} high has worn off.`, 'info');
        pawn.health.highs.splice(i, 1);
      }
    }

    // Bleeding wounds damage hp
    if (pawn.health.bleeding > 0) {
      pawn.health.hp = Math.max(0, pawn.health.hp - pawn.health.bleeding * 0.1);
    }
  }

  private updatePawnCombat(pawn: Pawn) {
    if (pawn.weapon.currentCooldown > 0) {
      pawn.weapon.currentCooldown -= 1;
    }

    // Enemy targeting & firing
    if (pawn.faction === 'player' && pawn.isDrafted) {
      // Find nearest hostile
      const target = this.findNearestHostile(pawn, pawn.weapon.range);
      if (target && pawn.weapon.currentCooldown <= 0) {
        this.fireWeapon(pawn, target);
      }
    } else if (pawn.faction === 'pirates') {
      // Attack nearest player pawn within range or advance
      const targetInRange = this.findNearestPlayerPawn(pawn, pawn.weapon.range);
      const nearestPlayer = this.findNearestPlayerPawn(pawn, 999);

      if (targetInRange && pawn.weapon.currentCooldown <= 0) {
        this.fireWeapon(pawn, targetInRange);
      } else if (!targetInRange && nearestPlayer) {
        // Aggressively hunt down closest player pawn
        this.movePawnTowards(pawn, nearestPlayer.x, nearestPlayer.y);
      } else if (!targetInRange) {
        // Advance towards colony base center
        this.movePawnTowards(pawn, 0, 0);
      }
    }
  }

  private fireWeapon(shooter: Pawn, target: Pawn) {
    sound.playShoot();
    shooter.weapon.currentCooldown = shooter.weapon.cooldown;

    this.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      startX: shooter.x,
      startY: shooter.y,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      damage: shooter.weapon.damage,
      shooterId: shooter.id,
      color: shooter.faction === 'player' ? '#38BDF8' : '#EF4444',
      speed: 26,
    });
  }

  private checkProjectileHit(p: Projectile) {
    this.pawns.forEach((target) => {
      if (target.id === p.shooterId) return;
      const dist = Math.hypot(target.x - p.targetX, target.y - p.targetY);
      if (dist < 0.9) {
        // Apply damage
        target.health.hp = Math.max(0, target.health.hp - p.damage);
        this.addFloatingText(`-${p.damage}`, target.x, target.y - 0.5, '#EF4444');

        if (target.health.hp <= 0) {
          if (target.faction === 'pirates') {
            this.onPirateKilled(target);
          } else {
            this.addLog(`${target.name} was downed in combat!`, 'danger');
          }
        }
      }
    });
  }

  private onPirateKilled(pirate: Pawn) {
    this.addLog(`ENEMY DOWN: ${pirate.name} was eliminated! Combat loot dropped on the battlefield.`, 'success');
    sound.playDraft();

    // 1. Shimmering Silver loot drop
    const silverAmt = 25 + Math.floor(Math.random() * 40);
    worldManager.spawnItem(pirate.x, pirate.y, 'silver', silverAmt);
    this.addFloatingText(`+${silverAmt} Silver`, pirate.x, pirate.y, '#FBBF24');

    // 2. High chance of combat contraband / drug drop
    const drugRoll = Math.random();
    if (drugRoll < 0.35) {
      worldManager.spawnItem(pirate.x + 0.4, pirate.y - 0.3, 'go_juice', 1);
      this.addFloatingText('+1 Go-Juice', pirate.x + 0.4, pirate.y - 0.3, '#F43F5E');
    } else if (drugRoll < 0.65) {
      worldManager.spawnItem(pirate.x + 0.4, pirate.y - 0.3, 'yayo', 2);
      this.addFloatingText('+2 Yayo', pirate.x + 0.4, pirate.y - 0.3, '#F8FAFC');
    } else if (drugRoll < 0.85) {
      worldManager.spawnItem(pirate.x + 0.4, pirate.y - 0.3, 'smokeleaf_joint', 3);
      this.addFloatingText('+3 Smokeleaf', pirate.x + 0.4, pirate.y - 0.3, '#86EFAC');
    }

    // 3. Components, medicine, or industrial steel supplies
    const matRoll = Math.random();
    if (matRoll < 0.35) {
      worldManager.spawnItem(pirate.x - 0.4, pirate.y + 0.3, 'component', 2);
      this.addFloatingText('+2 Components', pirate.x - 0.4, pirate.y + 0.3, '#38BDF8');
    } else if (matRoll < 0.7) {
      worldManager.spawnItem(pirate.x - 0.4, pirate.y + 0.3, 'medicine', 2);
      this.addFloatingText('+2 Medicine', pirate.x - 0.4, pirate.y + 0.3, '#60A5FA');
    } else {
      worldManager.spawnItem(pirate.x - 0.4, pirate.y + 0.3, 'steel', 30);
      this.addFloatingText('+30 Steel', pirate.x - 0.4, pirate.y + 0.3, '#94A3B8');
    }

    // Remove pirate from active simulation pawns
    this.pawns.delete(pirate.id);
  }

  private findNearestHostile(pawn: Pawn, maxRange: number): Pawn | null {
    let bestDist = maxRange;
    let bestTarget: Pawn | null = null;
    this.pawns.forEach((other) => {
      if (other.faction === 'pirates' && other.health.hp > 0) {
        const dist = Math.hypot(other.x - pawn.x, other.y - pawn.y);
        if (dist <= bestDist) {
          bestDist = dist;
          bestTarget = other;
        }
      }
    });
    return bestTarget;
  }

  private findNearestPlayerPawn(pawn: Pawn, maxRange: number): Pawn | null {
    let bestDist = maxRange;
    let bestTarget: Pawn | null = null;
    this.pawns.forEach((other) => {
      if (other.faction === 'player' && other.health.hp > 0) {
        const dist = Math.hypot(other.x - pawn.x, other.y - pawn.y);
        if (dist <= bestDist) {
          bestDist = dist;
          bestTarget = other;
        }
      }
    });
    return bestTarget;
  }

  /**
   * Autonomous Pawn AI: Work priority matrix & decision state machine
   */
  private updatePawnAI(pawn: Pawn) {
    if (pawn.faction !== 'player' || pawn.isDrafted) return;

    // Player character under manual direct control
    if (pawn.isPlayerCharacter && pawn.manualControl) {
      if (pawn.currentJob.duration && pawn.currentJob.duration > 0) {
        const isNear = pawn.currentJob.targetX === undefined ||
          Math.hypot(pawn.x - pawn.currentJob.targetX, pawn.y - (pawn.currentJob.targetY || 0)) <= 1.8;
        if (isNear) {
          pawn.currentJob.duration -= 1;
          if (pawn.currentJob.duration <= 0) {
            this.finishPawnJob(pawn);
          }
        } else {
          this.movePawnTowards(pawn, pawn.currentJob.targetX!, pawn.currentJob.targetY!);
        }
      }
      return;
    }

    // 1. Critical Needs First: Eat if starving
    if (pawn.needs.hunger < 35 && pawn.currentJob.type !== 'eating') {
      if (this.resources.simple_meal > 0 || this.resources.raw_food > 0) {
        pawn.currentJob = { type: 'eating', duration: 30, targetX: -3, targetY: 2 };
        this.movePawnTowards(pawn, -3, 2); // Table location
        return;
      }
    }

    // 2. Critical Needs: Sleep if exhausted
    if (pawn.needs.rest < 25 && pawn.currentJob.type !== 'sleeping') {
      pawn.currentJob = { type: 'sleeping', duration: 120, targetX: -6, targetY: 1 };
      this.movePawnTowards(pawn, -6, 1); // Bed location
      return;
    }

    // 3. Chemical Need / Recreational ingestion
    if ((pawn.needs.chemical < 30 || pawn.needs.mood < 35) && pawn.currentJob.type !== 'recreation') {
      if (this.resources.smokeleaf_joint > 0) {
        this.consumeDrug(pawn, 'smokeleaf_joint');
        return;
      } else if (this.resources.psychite_tea > 0) {
        this.consumeDrug(pawn, 'psychite_tea');
        return;
      }
    }

    // 4. If already performing a timed job, advance progress only when at target location
    if (pawn.currentJob.duration && pawn.currentJob.duration > 0) {
      const isNearTarget = pawn.currentJob.targetX === undefined ||
        Math.hypot(pawn.x - pawn.currentJob.targetX, pawn.y - (pawn.currentJob.targetY || 0)) <= 1.8;

      if (isNearTarget) {
        pawn.currentJob.duration -= 1;
        if (pawn.currentJob.duration <= 0) {
          this.finishPawnJob(pawn);
        }
      } else {
        // Keep walking towards destination
        this.movePawnTowards(pawn, pawn.currentJob.targetX!, pawn.currentJob.targetY!);
      }
      return;
    }

    // 5. Check Work Priorities for available jobs
    this.assignNextWorkJob(pawn);
  }

  private assignNextWorkJob(pawn: Pawn) {
    const priorities: [WorkType, number][] = Object.entries(pawn.workPriorities) as [WorkType, number][];
    // Sort by priority (1 is highest, 4 is lowest, 0 is disabled)
    priorities.sort((a, b) => a[1] - b[1]);

    for (const [workType, priority] of priorities) {
      if (priority === 0) continue;

      // Work: Crafting / Drug Lab & Production spots
      if (workType === 'crafting') {
        for (const building of this.buildings.values()) {
          if (!building.isConstructed || !building.bills || building.bills.length === 0) continue;
          if (building.type !== 'drug_lab' && building.type !== 'crafting_spot') continue;

          for (const bill of building.bills) {
            if (!bill.active) continue;
            const recipe = DRUG_RECIPES.find((r) => r.id === bill.recipeId);
            if (!recipe || !this.canCraftRecipe(recipe)) continue;

            // Prevent two colonists from claiming the same bill simultaneously
            const isClaimed = Array.from(this.pawns.values()).some(
              (other) => other.id !== pawn.id && other.currentJob.type === 'crafting_drug' && other.currentJob.extraData?.billId === bill.id
            );
            if (isClaimed) continue;

            pawn.currentJob = {
              type: 'crafting_drug',
              targetX: building.x + 1,
              targetY: building.y + 1,
              duration: recipe.workRequired || 40,
              extraData: { recipe, billId: bill.id, buildingId: building.id },
            };
            this.movePawnTowards(pawn, building.x + 1, building.y + 1);
            return;
          }
        }
      }

      // Work: Farming (Harvest ripe crops)
      if (workType === 'farming') {
        let ripePlant: Plant | null = null;
        for (const p of worldManager.plants.values()) {
          if (p.growth >= 1.0) {
            // Check if already claimed
            const isClaimed = Array.from(this.pawns.values()).some(
              (other) => other.id !== pawn.id && other.currentJob.type === 'harvesting' && other.currentJob.extraData?.plantId === p.id
            );
            if (!isClaimed) {
              ripePlant = p;
              break;
            }
          }
        }
        if (ripePlant) {
          pawn.currentJob = {
            type: 'harvesting',
            targetX: ripePlant.x,
            targetY: ripePlant.y,
            duration: 25,
            extraData: { plantId: ripePlant.id },
          };
          this.movePawnTowards(pawn, ripePlant.x, ripePlant.y);
          return;
        }
      }

      // Work: Construction (Unbuilt blueprints)
      if (workType === 'construction') {
        for (const b of this.buildings.values()) {
          if (!b.isConstructed) {
            pawn.currentJob = {
              type: 'building',
              targetX: b.x,
              targetY: b.y,
              duration: 35,
              extraData: { buildingId: b.id },
            };
            this.movePawnTowards(pawn, b.x, b.y);
            return;
          }
        }
      }

      // Work: Mining (Fast cached mineral search)
      if (workType === 'mining') {
        const mineTarget = worldManager.getNearestMineral(pawn.x, pawn.y, 25);
        if (mineTarget) {
          pawn.currentJob = {
            type: 'mining',
            targetX: mineTarget.x,
            targetY: mineTarget.y,
            duration: 35,
            extraData: { x: mineTarget.x, y: mineTarget.y, mineral: mineTarget.mineral },
          };
          this.movePawnTowards(pawn, mineTarget.x, mineTarget.y);
          return;
        }
      }

      // Work: Hauling (Collect dropped enemy loot and ground items)
      if (workType === 'hauling') {
        const itemTarget = worldManager.getNearestItem(pawn.x, pawn.y, 35);
        if (itemTarget) {
          const isClaimed = Array.from(this.pawns.values()).some(
            (other) => other.id !== pawn.id && other.currentJob.type === 'hauling' && other.currentJob.extraData?.itemId === itemTarget.id
          );
          if (!isClaimed) {
            pawn.currentJob = {
              type: 'hauling',
              targetX: itemTarget.x,
              targetY: itemTarget.y,
              duration: 15,
              extraData: { itemId: itemTarget.id, itemType: itemTarget.type, count: itemTarget.count },
            };
            this.movePawnTowards(pawn, itemTarget.x, itemTarget.y);
            return;
          }
        }
      }
    }

    // Default Idle / Wandering
    pawn.currentJob = { type: 'idle', duration: 15 };
    if (Math.random() < 0.25) {
      const rx = pawn.x + Math.floor(Math.random() * 5 - 2);
      const ry = pawn.y + Math.floor(Math.random() * 5 - 2);
      this.movePawnTowards(pawn, rx, ry);
    }
  }

  private canCraftRecipe(recipe: DrugRecipe): boolean {
    for (const ing of recipe.ingredients) {
      if ((this.resources[ing.item] || 0) < ing.count) {
        return false;
      }
    }
    return true;
  }

  private finishPawnJob(pawn: Pawn) {
    const job = pawn.currentJob;

    if (job.type === 'eating') {
      if (this.resources.simple_meal > 0) {
        this.resources.simple_meal -= 1;
        pawn.needs.hunger = 100;
        this.addFloatingText('+Ate Meal', pawn.x, pawn.y, '#10B981');
      } else if (this.resources.raw_food > 0) {
        this.resources.raw_food = Math.max(0, this.resources.raw_food - 5);
        pawn.needs.hunger = 80;
        this.addFloatingText('+Ate Raw Food', pawn.x, pawn.y, '#F59E0B');
      }
    } else if (job.type === 'sleeping') {
      pawn.needs.rest = 100;
      this.addFloatingText('Well Rested', pawn.x, pawn.y, '#38BDF8');
    } else if (job.type === 'crafting_drug' && job.extraData) {
      const recipe: DrugRecipe = job.extraData.recipe;
      if (this.canCraftRecipe(recipe)) {
        // Deduct ingredients safely
        recipe.ingredients.forEach((ing) => {
          this.resources[ing.item] = Math.max(0, (this.resources[ing.item] || 0) - ing.count);
        });
        // Add finished drug
        this.resources[recipe.producedItem] = (this.resources[recipe.producedItem] || 0) + recipe.producedCount;
        sound.playDrug();
        this.addFloatingText(`+${recipe.producedCount} ${ITEM_INFO[recipe.producedItem].name}`, pawn.x, pawn.y, '#86EFAC');
        this.addLog(`${pawn.nickname} produced ${ITEM_INFO[recipe.producedItem].name} at the Drug Lab.`, 'drug');

        // Update bill tracking
        if (job.extraData.buildingId && job.extraData.billId) {
          const b = this.buildings.get(job.extraData.buildingId);
          const bill = b?.bills?.find((bl) => bl.id === job.extraData.billId);
          if (bill) {
            bill.currentCompleted += 1;
            if (!bill.isInfinite && bill.currentCompleted >= bill.targetCount) {
              bill.active = false;
              this.addLog(`Manufacturing bill for ${recipe.name} completed.`, 'success');
            }
          }
        }
      }
    } else if (job.type === 'harvesting' && job.extraData) {
      const plantKey = `${job.targetX},${job.targetY}`;
      const plant = worldManager.plants.get(plantKey);
      if (plant) {
        sound.playHarvest();
        this.resources[plant.yieldItem] = (this.resources[plant.yieldItem] || 0) + plant.yieldCount;
        this.addFloatingText(`+${plant.yieldCount} ${ITEM_INFO[plant.yieldItem].name}`, pawn.x, pawn.y, '#22C55E');
        plant.growth = 0.1; // Reseed
      }
    } else if (job.type === 'building' && job.extraData) {
      const b = this.buildings.get(job.extraData.buildingId);
      if (b) {
        sound.playBuild();
        b.isConstructed = true;
        this.addFloatingText('Completed!', b.x, b.y, '#3B82F6');
        this.addLog(`${pawn.nickname} finished constructing ${b.type}.`, 'info');
      }
    } else if (job.type === 'mining' && job.extraData) {
      const { x, y, mineral } = job.extraData;
      sound.playBuild();
      if (mineral) {
        const yieldCount = mineral === 'steel' ? 35 : mineral === 'plasteel' ? 15 : mineral === 'components' ? 4 : 8;
        const itemKey = mineral === 'components' ? 'component' : (mineral as ItemType);
        this.resources[itemKey] = (this.resources[itemKey] || 0) + yieldCount;
        this.addFloatingText(`+${yieldCount} ${mineral.toUpperCase()}`, x, y, '#94A3B8');
        this.addLog(`${pawn.nickname} mined vein of ${mineral}.`, 'info');
      }
      worldManager.setTile(x, y, { type: 'stone_smooth', walkable: true, mineral: undefined });
    } else if (job.type === 'hauling' && job.extraData) {
      const { itemId, itemType, count } = job.extraData;
      worldManager.removeItem(itemId);
      const validItemType = itemType as ItemType;
      this.resources[validItemType] = (this.resources[validItemType] || 0) + (count || 1);
      sound.playPickup();
      const itemName = ITEM_INFO[validItemType]?.name || validItemType;
      this.addFloatingText(`+${count || 1} ${itemName}`, pawn.x, pawn.y, '#FBBF24');
      this.addLog(`${pawn.nickname} hauled ${count || 1}x ${itemName} to colony storage.`, 'info');
    }

    pawn.currentJob = { type: 'idle' };
  }

  public consumeDrug(pawn: Pawn, drugType: ItemType) {
    if (this.resources[drugType] <= 0) return;

    this.resources[drugType] -= 1;
    sound.playDrug();

    if (drugType === 'smokeleaf_joint') {
      pawn.health.highs.push({
        type: 'smokeleaf_joint',
        timeLeft: 60,
        moodBonus: 15,
        painFactor: 0.7,
        speedMultiplier: 0.9,
        hungerRateMultiplier: 1.3,
      });
      pawn.needs.chemical = 100;
      this.addFloatingText('High on Smokeleaf (+15)', pawn.x, pawn.y, '#86EFAC');
      this.addLog(`${pawn.nickname} smoked a Smokeleaf joint. Feels relaxed.`, 'drug');
    } else if (drugType === 'psychite_tea') {
      pawn.health.highs.push({
        type: 'psychite_tea',
        timeLeft: 50,
        moodBonus: 12,
        painFactor: 0.9,
        speedMultiplier: 1.05,
        hungerRateMultiplier: 1.0,
      });
      pawn.needs.chemical = 90;
      pawn.needs.rest = Math.min(100, pawn.needs.rest + 15);
      this.addFloatingText('Drank Psychite Tea (+12)', pawn.x, pawn.y, '#6EE7B7');
    } else if (drugType === 'yayo') {
      pawn.health.highs.push({
        type: 'yayo',
        timeLeft: 90,
        moodBonus: 35,
        painFactor: 0.5,
        speedMultiplier: 1.15,
        hungerRateMultiplier: 1.0,
      });
      pawn.needs.chemical = 100;
      pawn.health.tolerances.psychite = Math.min(1.0, pawn.health.tolerances.psychite + 0.15);
      this.addFloatingText('Yayo High (+35)', pawn.x, pawn.y, '#F8FAFC');
      this.addLog(`${pawn.nickname} snorted pure Yayo! Energy surges through their veins.`, 'drug');
    } else if (drugType === 'go_juice') {
      pawn.health.highs.push({
        type: 'go_juice',
        timeLeft: 120,
        moodBonus: 50,
        painFactor: 0.1,
        speedMultiplier: 1.25,
        hungerRateMultiplier: 1.1,
      });
      pawn.needs.chemical = 100;
      this.addFloatingText('GO-JUICE RUSH (+50)', pawn.x, pawn.y, '#F43F5E');
      this.addLog(`${pawn.nickname} injected Go-Juice! Pain neutralized, combat senses sharpened.`, 'danger');
    } else if (drugType === 'wake_up') {
      pawn.needs.rest = 100;
      pawn.health.highs.push({
        type: 'wake_up',
        timeLeft: 80,
        moodBonus: 10,
        painFactor: 1.0,
        speedMultiplier: 1.15,
        hungerRateMultiplier: 1.0,
      });
      this.addFloatingText('Wide Awake (100% Rest)', pawn.x, pawn.y, '#FBBF24');
    }
  }

  public getPlayerCharacter(): Pawn | undefined {
    return Array.from(this.pawns.values()).find((p) => p.isPlayerCharacter);
  }

  public movePlayerDirect(dx: number, dy: number, dt: number = 0.05) {
    const player = this.getPlayerCharacter();
    if (!player) return;

    const speed = 4.5 * dt;
    const nx = player.x + dx * speed;
    const ny = player.y + dy * speed;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? 'east' : 'west';
    } else if (Math.abs(dy) > 0) {
      player.facing = dy > 0 ? 'south' : 'north';
    }

    if (worldManager.isWalkable(Math.round(nx), Math.round(ny), this.buildings)) {
      player.x = nx;
      player.y = ny;
    } else if (worldManager.isWalkable(Math.round(nx), Math.round(player.y), this.buildings)) {
      player.x = nx;
    } else if (worldManager.isWalkable(Math.round(player.x), Math.round(ny), this.buildings)) {
      player.y = ny;
    }

    player.targetX = undefined;
    player.targetY = undefined;
  }

  public commandPlayerWalkTo(targetX: number, targetY: number) {
    const player = this.getPlayerCharacter();
    if (!player) return;
    this.movePawnTowards(player, targetX, targetY);
    sound.playDraft();
    this.addFloatingText('Move here', targetX, targetY, '#FBBF24');
  }

  public commandPlayerInteract(x: number, y: number): boolean {
    const player = this.getPlayerCharacter();
    if (!player) return false;

    // Check if right-clicking on ground loot item
    const groundItem = worldManager.getItemNear(x, y, 1.2);
    if (groundItem) {
      player.currentJob = {
        type: 'hauling',
        targetX: groundItem.x,
        targetY: groundItem.y,
        duration: 10,
        extraData: { itemId: groundItem.id, itemType: groundItem.type, count: groundItem.count },
      };
      this.movePawnTowards(player, groundItem.x, groundItem.y);
      const itemName = ITEM_INFO[groundItem.type]?.name || groundItem.type;
      this.addFloatingText(`Hauling ${itemName}...`, groundItem.x, groundItem.y, '#FBBF24');
      return true;
    }

    // Check if right-clicking on a hostile pirate to target them
    for (const pawn of this.pawns.values()) {
      if (pawn.faction === 'pirates' && pawn.health.hp > 0) {
        if (Math.hypot(pawn.x - x, pawn.y - y) <= 1.2) {
          this.fireWeapon(player, pawn);
          this.addFloatingText('Targeting!', pawn.x, pawn.y, '#EF4444');
          return true;
        }
      }
    }

    // Check if right-clicking on a building
    for (const b of this.buildings.values()) {
      if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
        if (!b.isConstructed) {
          player.currentJob = {
            type: 'building',
            targetX: b.x,
            targetY: b.y,
            duration: 35,
            extraData: { buildingId: b.id },
          };
          this.movePawnTowards(player, b.x, b.y);
          this.addFloatingText('Constructing...', b.x, b.y, '#38BDF8');
          return true;
        } else if (b.type === 'drug_lab' || b.type === 'crafting_spot') {
          if (b.bills && b.bills.length > 0) {
            for (const bill of b.bills) {
              if (!bill.active) continue;
              const recipe = DRUG_RECIPES.find((r) => r.id === bill.recipeId);
              if (recipe && this.canCraftRecipe(recipe)) {
                player.currentJob = {
                  type: 'crafting_drug',
                  targetX: b.x + 1,
                  targetY: b.y + 1,
                  duration: recipe.workRequired || 40,
                  extraData: { recipe, billId: bill.id, buildingId: b.id },
                };
                this.movePawnTowards(player, b.x + 1, b.y + 1);
                this.addFloatingText(`Synthesizing ${recipe.name}...`, b.x, b.y, '#34D399');
                return true;
              }
            }
          }
        }
      }
    }

    // Check if right-clicking on a ripe plant
    const plant = worldManager.plants.get(`${x},${y}`);
    if (plant && plant.growth >= 0.8) {
      player.currentJob = {
        type: 'harvesting',
        targetX: plant.x,
        targetY: plant.y,
        duration: 25,
        extraData: { plantId: plant.id },
      };
      this.movePawnTowards(player, plant.x, plant.y);
      this.addFloatingText('Harvesting...', plant.x, plant.y, '#4ADE80');
      return true;
    }

    // Check if right-clicking on a mineral rock
    const tile = worldManager.getTile(x, y);
    if (tile && tile.mineral) {
      player.currentJob = {
        type: 'mining',
        targetX: x,
        targetY: y,
        duration: 35,
        extraData: { x, y, mineral: tile.mineral },
      };
      this.movePawnTowards(player, x, y);
      this.addFloatingText(`Mining ${tile.mineral}...`, x, y, '#CBD5E1');
      return true;
    }

    // Standard walk order
    this.commandPlayerWalkTo(x, y);
    return false;
  }

  public movePawnTowards(pawn: Pawn, tx: number, ty: number) {
    pawn.targetX = tx;
    pawn.targetY = ty;
    if (tx > pawn.x) pawn.facing = 'east';
    else if (tx < pawn.x) pawn.facing = 'west';
    else if (ty > pawn.y) pawn.facing = 'south';
    else if (ty < pawn.y) pawn.facing = 'north';
  }

  private interpolateEntities(dt: number) {
    const speed = 2.5 * dt;

    // Smooth movement interpolation for pawns
    this.pawns.forEach((pawn) => {
      if (pawn.targetX !== undefined && pawn.targetY !== undefined) {
        const dx = pawn.targetX - pawn.x;
        const dy = pawn.targetY - pawn.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.1) {
          pawn.x += (dx / dist) * Math.min(dist, speed);
          pawn.y += (dy / dist) * Math.min(dist, speed);
        } else {
          pawn.x = pawn.targetX;
          pawn.y = pawn.targetY;
          pawn.targetX = undefined;
          pawn.targetY = undefined;
        }
      }
    });

    // High-performance smooth projectile advancement (60 FPS)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dist = Math.hypot(p.targetX - p.startX, p.targetY - p.startY);
      const bulletSpeed = p.speed || 26;
      const progressDelta = dist > 0 ? (bulletSpeed * dt) / dist : 1.0;
      p.progress += progressDelta;

      if (p.progress >= 1.0) {
        p.progress = 1.0;
        this.checkProjectileHit(p);
        this.projectiles.splice(i, 1);
      }
    }

    // Smooth floating text animation (60 FPS)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.7 * dt;
      ft.life -= 0.6 * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Direct Character Auto-Pickup when walking over loot
    const player = this.getPlayerCharacter();
    if (player) {
      const nearbyItem = worldManager.getItemNear(player.x, player.y, 0.75);
      if (nearbyItem) {
        worldManager.removeItem(nearbyItem.id);
        const itemType = nearbyItem.type;
        this.resources[itemType] = (this.resources[itemType] || 0) + nearbyItem.count;
        sound.playPickup();
        const itemName = ITEM_INFO[itemType]?.name || itemType;
        this.addFloatingText(`+${nearbyItem.count} ${itemName}`, player.x, player.y - 0.4, '#FBBF24');
        this.addLog(`Collected ${nearbyItem.count}x ${itemName} from ground.`, 'info');
      }
    }
  }

  /**
   * Overthrow hostile settlement via world expedition
   */
  public launchExpedition(settlementId: string): boolean {
    const settlement = this.worldFactions.find((f) => f.id === settlementId);
    if (!settlement || settlement.isOverthrown) return false;

    // Check player military strength
    let playerCombatScore = 0;
    this.pawns.forEach((p) => {
      if (p.faction === 'player') playerCombatScore += p.skills.shooting * 10;
    });

    if (playerCombatScore >= settlement.defenseRating * 0.7) {
      settlement.isOverthrown = true;
      settlement.relations = 100;
      this.resources.silver += settlement.lootEstimatedSilver;
      this.resources.plasteel += 40;
      this.resources.component += 10;
      sound.playAlarm();
      this.addLog(`VICTORY: Your expedition successfully captured and overthrew ${settlement.name}! Plundered ${settlement.lootEstimatedSilver} Silver and valuable tech components.`, 'success');
      return true;
    } else {
      this.addLog(`EXPEDITION FAILED: ${settlement.name}'s fortifications repelled our attack. Colonists retreated with minor wounds.`, 'danger');
      return false;
    }
  }
}

export const simulation = new ColonySimulation();
