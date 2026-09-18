import { Chunk, CHUNK_SIZE, Item, ItemType, MineralType, Plant, Tile, TileType } from '../types';
import { elevationNoise, mineralNoise, moistureNoise, plantDensityNoise } from '../utils/noise';

export class WorldManager {
  private chunks: Map<string, Chunk> = new Map();
  public plants: Map<string, Plant> = new Map();
  public items: Map<string, Item> = new Map();
  public minerals: Map<string, { x: number; y: number; mineral: MineralType }> = new Map();

  public getChunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  public hasChunk(cx: number, cy: number): boolean {
    return this.chunks.has(this.getChunkKey(cx, cy));
  }

  public getChunk(cx: number, cy: number): Chunk {
    const key = this.getChunkKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = this.generateChunk(cx, cy);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  public generateChunk(cx: number, cy: number): Chunk {
    const tiles: Tile[][] = [];
    const key = this.getChunkKey(cx, cy);

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      tiles[lx] = [];
      for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        const wx = cx * CHUNK_SIZE + lx;
        const wy = cy * CHUNK_SIZE + ly;

        // Noise values (0 to 1)
        const elev = elevationNoise.fbm2D(wx * 0.04, wy * 0.04, 3);
        const moist = moistureNoise.fbm2D(wx * 0.03, wy * 0.03, 3);
        const minVal = mineralNoise.noise2D(wx * 0.12, wy * 0.12);

        let type: TileType = 'soil';
        let walkable = true;
        let fertility = 1.0;
        let mineral: MineralType | undefined = undefined;
        let mineralHp: number | undefined = undefined;

        if (elev > 0.72) {
          // Rock Mountain
          type = 'stone_rough';
          walkable = false;
          fertility = 0;
          mineralHp = 250;

          // Mineral Veins
          if (minVal > 0.88) {
            mineral = 'components';
            mineralHp = 220;
          } else if (minVal > 0.82) {
            mineral = 'uranium';
            mineralHp = 350;
          } else if (minVal > 0.74) {
            mineral = 'plasteel';
            mineralHp = 320;
          } else if (minVal > 0.65) {
            mineral = 'gold';
            mineralHp = 180;
          } else if (minVal > 0.52) {
            mineral = 'steel';
            mineralHp = 200;
          }
        } else if (elev > 0.65) {
          type = 'gravel';
          fertility = 0.7;
        } else if (moist > 0.70 && elev < 0.35) {
          type = 'marsh';
          walkable = true;
          fertility = 0.3;
        } else if (moist > 0.62) {
          type = 'rich_soil';
          fertility = 1.4;
        } else if (moist < 0.25) {
          type = 'sand';
          fertility = 0.4;
        } else {
          type = 'soil';
          fertility = 1.0;
        }

        tiles[lx][ly] = {
          x: wx,
          y: wy,
          type,
          walkable,
          fertility,
          mineral,
          mineralHp,
        };

        if (mineral) {
          this.minerals.set(`${wx},${wy}`, { x: wx, y: wy, mineral });
        }

        // Procedural wild plants in suitable soils (not mountain rocks)
        if (walkable && fertility > 0.6 && !mineral) {
          const plantVal = plantDensityNoise.noise2D(wx * 0.25, wy * 0.25);
          const plantKey = `${wx},${wy}`;
          if (plantVal > 0.85) {
            // Wild Psychoid or Healroot
            const isHealroot = plantVal > 0.92;
            this.plants.set(plantKey, {
              id: `wild_plant_${wx}_${wy}`,
              type: isHealroot ? 'healroot' : 'psychoid',
              x: wx,
              y: wy,
              growth: 0.6 + Math.random() * 0.4,
              maxGrowthTime: isHealroot ? 24 : 20,
              yieldItem: isHealroot ? 'healroot' : 'psychoid_leaves',
              yieldCount: isHealroot ? 2 : 6,
              hp: 20,
            });
          }
        }
      }
    }

    return {
      cx,
      cy,
      tiles,
      key,
    };
  }

  public getTile(x: number, y: number): Tile {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.tiles[lx][ly];
  }

  public setTile(x: number, y: number, newTile: Partial<Tile>) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.tiles[lx][ly] = { ...chunk.tiles[lx][ly], ...newTile };

    const key = `${x},${y}`;
    if (newTile.mineral) {
      this.minerals.set(key, { x, y, mineral: newTile.mineral });
    } else if (newTile.mineral === undefined && 'mineral' in newTile) {
      this.minerals.delete(key);
    }
  }

  public getNearestMineral(px: number, py: number, maxDist: number = 30): { x: number; y: number; mineral: MineralType } | null {
    let closest: { x: number; y: number; mineral: MineralType } | null = null;
    let minDist = maxDist;
    for (const m of this.minerals.values()) {
      const dist = Math.hypot(m.x - px, m.y - py);
      if (dist < minDist) {
        minDist = dist;
        closest = m;
      }
    }
    return closest;
  }

  /**
   * Viewport Culling: Get list of chunks intersecting the visible camera area
   */
  public getVisibleChunks(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): Chunk[] {
    const minCx = Math.floor(minX / CHUNK_SIZE) - 1;
    const maxCx = Math.floor(maxX / CHUNK_SIZE) + 1;
    const minCy = Math.floor(minY / CHUNK_SIZE) - 1;
    const maxCy = Math.floor(maxY / CHUNK_SIZE) + 1;

    const visible: Chunk[] = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        visible.push(this.getChunk(cx, cy));
      }
    }
    return visible;
  }

  public isWalkable(x: number, y: number, buildingsMap: Map<string, any>): boolean {
    const tile = this.getTile(x, y);
    if (!tile.walkable) return false;

    // Check if impassable building sits on this cell
    for (const b of buildingsMap.values()) {
      if (!b.isConstructed) continue;
      if (b.type.startsWith('wall_')) {
        if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
          return false;
        }
      }
    }
    return true;
  }

  public spawnItem(x: number, y: number, type: ItemType, count: number): Item {
    // Check if an item of the same type already exists at the same coordinate
    const roundedX = Math.round(x * 10) / 10;
    const roundedY = Math.round(y * 10) / 10;
    for (const item of this.items.values()) {
      if (item.type === type && Math.hypot(item.x - roundedX, item.y - roundedY) < 0.8) {
        item.count += count;
        return item;
      }
    }

    const newItem: Item = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      count,
      x: roundedX,
      y: roundedY,
    };
    this.items.set(newItem.id, newItem);
    return newItem;
  }

  public getItemNear(x: number, y: number, radius: number = 0.9): Item | null {
    let closest: Item | null = null;
    let minDist = radius;
    for (const item of this.items.values()) {
      const dist = Math.hypot(item.x - x, item.y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = item;
      }
    }
    return closest;
  }

  public getNearestItem(px: number, py: number, maxDist: number = 40): Item | null {
    let closest: Item | null = null;
    let minDist = maxDist;
    for (const item of this.items.values()) {
      const dist = Math.hypot(item.x - px, item.y - py);
      if (dist < minDist) {
        minDist = dist;
        closest = item;
      }
    }
    return closest;
  }

  public removeItem(id: string): boolean {
    return this.items.delete(id);
  }

  public clearAll() {
    this.chunks.clear();
    this.plants.clear();
    this.items.clear();
    this.minerals.clear();
  }
}

export const worldManager = new WorldManager();
