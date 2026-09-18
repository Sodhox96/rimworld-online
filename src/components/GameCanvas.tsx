import React, { useEffect, useRef, useState } from 'react';
import { BUILDING_DEFS, CROP_DEFS, ITEM_INFO } from '../game/constants';
import { simulation } from '../game/simulation';
import { worldManager } from '../game/world';
import { BuildingType, CropType, ZoneType } from '../types';

interface GameCanvasProps {
  selectedBuilding: BuildingType | null;
  selectedZone: ZoneType | null;
  selectedCropForZone: CropType | null;
  selectedEntity: any | null;
  onSelectEntity: (entity: any | null) => void;
  onClearTool: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedBuilding,
  selectedZone,
  selectedCropForZone,
  selectedEntity,
  onSelectEntity,
  onClearTool,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera and Control state
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 42 }); // pixels per world tile
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [controlMode, setControlMode] = useState<'character' | 'camera'>('character');
  const [followPlayer, setFollowPlayer] = useState<boolean>(true);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const cameraRef = useRef(camera);
  const keysDownRef = useRef(new Set<string>());
  const controlModeRef = useRef(controlMode);
  const followPlayerRef = useRef(followPlayer);

  // Props ref to avoid tearing down render loop on state updates
  const propsRef = useRef({
    selectedBuilding,
    selectedZone,
    selectedCropForZone,
    selectedEntity,
  });

  useEffect(() => {
    propsRef.current = {
      selectedBuilding,
      selectedZone,
      selectedCropForZone,
      selectedEntity,
    };
  }, [selectedBuilding, selectedZone, selectedCropForZone, selectedEntity]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    controlModeRef.current = controlMode;
  }, [controlMode]);

  useEffect(() => {
    followPlayerRef.current = followPlayer;
  }, [followPlayer]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation & Control Modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysDownRef.current.add(k);

      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(k)) {
        e.preventDefault();
      }

      // Hotkey 'c': Center on Player Character
      if (k === 'c') {
        const player = simulation.getPlayerCharacter();
        if (player) {
          setCamera((prev) => ({ ...prev, x: player.x, y: player.y }));
        }
      }

      // Hotkey 'tab' or 'z': Toggle Walk vs Camera Pan
      if (k === 'tab' || k === 'z') {
        e.preventDefault();
        setControlMode((prev) => (prev === 'character' ? 'camera' : 'character'));
      }

      // Hotkey 'escape': Clear tool
      if (k === 'escape') {
        onClearTool();
        onSelectEntity(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onClearTool, onSelectEntity]);

  // Main Render Loop (Butter Smooth 60 FPS Single Effect)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      // Handle Continuous Keyboard Movement
      const keys = keysDownRef.current;
      if (keys.size > 0) {
        let dx = 0;
        let dy = 0;
        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          const ndx = dx / len;
          const ndy = dy / len;
          const isSprinting = keys.has('shift');

          if (controlModeRef.current === 'character') {
            const sprintMultiplier = isSprinting ? 1.6 : 1.0;
            simulation.movePlayerDirect(ndx, ndy, dt * sprintMultiplier);

            // Smooth camera tracking to player
            if (followPlayerRef.current) {
              const player = simulation.getPlayerCharacter();
              if (player) {
                cameraRef.current.x += (player.x - cameraRef.current.x) * 0.14;
                cameraRef.current.y += (player.y - cameraRef.current.y) * 0.14;
              }
            }
          } else {
            // Free Camera Pan
            const panSpeed = (isSprinting ? 30 : 16) / (cameraRef.current.zoom / 40);
            cameraRef.current.x += ndx * panSpeed * dt * 4;
            cameraRef.current.y += ndy * panSpeed * dt * 4;
          }
        }
      } else if (followPlayerRef.current && controlModeRef.current === 'character') {
        // Subtle resting camera follow
        const player = simulation.getPlayerCharacter();
        if (player) {
          const dist = Math.hypot(player.x - cameraRef.current.x, player.y - cameraRef.current.y);
          if (dist > 0.05) {
            cameraRef.current.x += (player.x - cameraRef.current.x) * 0.08;
            cameraRef.current.y += (player.y - cameraRef.current.y) * 0.08;
          }
        }
      }

      // Update game simulation logic
      simulation.update(dt);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, canvas.width, canvas.height, time);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number, timeMs: number) => {
    ctx.clearRect(0, 0, width, height);

    const curCam = cameraRef.current;
    const halfW = width / 2;
    const halfH = height / 2;
    const zoom = curCam.zoom;

    const { selectedBuilding, selectedZone, selectedCropForZone, selectedEntity } = propsRef.current;

    // Helper: World to Screen coords
    const toScreen = (wx: number, wy: number) => ({
      x: halfW + (wx - curCam.x) * zoom,
      y: halfH + (wy - curCam.y) * zoom,
    });

    // Determine visible world bounding box for chunk culling
    const minWx = curCam.x - halfW / zoom - 2;
    const maxWx = curCam.x + halfW / zoom + 2;
    const minWy = curCam.y - halfH / zoom - 2;
    const maxWy = curCam.y + halfH / zoom + 2;

    const visibleChunks = worldManager.getVisibleChunks(minWx, minWy, maxWx, maxWy);

    // 1. Draw Terrain Tiles
    visibleChunks.forEach((chunk) => {
      for (let lx = 0; lx < 16; lx++) {
        for (let ly = 0; ly < 16; ly++) {
          const tile = chunk.tiles[lx][ly];
          if (tile.x < minWx || tile.x > maxWx || tile.y < minWy || tile.y > maxWy) continue;

          const s = toScreen(tile.x, tile.y);

          // Tile Base Color
          if (tile.type === 'stone_rough') {
            ctx.fillStyle = '#475569';
          } else if (tile.type === 'stone_smooth') {
            ctx.fillStyle = '#64748B';
          } else if (tile.type === 'rich_soil') {
            ctx.fillStyle = '#452A18'; // Dark nutrient-rich soil
          } else if (tile.type === 'soil') {
            ctx.fillStyle = '#5A3D28'; // Standard earth
          } else if (tile.type === 'sand') {
            ctx.fillStyle = '#D4B982';
          } else if (tile.type === 'gravel') {
            ctx.fillStyle = '#78716C';
          } else if (tile.type === 'marsh') {
            ctx.fillStyle = '#3F5643';
          } else {
            ctx.fillStyle = '#524335';
          }

          ctx.fillRect(Math.floor(s.x), Math.floor(s.y), Math.ceil(zoom), Math.ceil(zoom));

          // Subtle RimWorld grid outline
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.floor(s.x), Math.floor(s.y), Math.ceil(zoom), Math.ceil(zoom));

          // Mineral Vein textures
          if (tile.mineral) {
            ctx.fillStyle =
              tile.mineral === 'steel'
                ? '#94A3B8'
                : tile.mineral === 'plasteel'
                ? '#38BDF8'
                : tile.mineral === 'uranium'
                ? '#4ADE80'
                : tile.mineral === 'gold'
                ? '#FBBF24'
                : '#F97316';

            // Mineral vein speckles
            ctx.fillRect(s.x + zoom * 0.2, s.y + zoom * 0.2, zoom * 0.6, zoom * 0.6);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.max(9, zoom * 0.22)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(tile.mineral.substring(0, 2).toUpperCase(), s.x + zoom / 2, s.y + zoom * 0.65);
          }
        }
      }
    });

    // 2. Draw Zones (Stockpiles & Growing Zones)
    simulation.zones.forEach((zone) => {
      ctx.fillStyle = zone.color;
      zone.cells.forEach((cell) => {
        const s = toScreen(cell.x, cell.y);
        ctx.fillRect(s.x, s.y, zoom, zoom);
      });
    });

    // 3. Draw Crops & Wild Plants
    worldManager.plants.forEach((plant) => {
      const s = toScreen(plant.x, plant.y);
      const cropDef = CROP_DEFS[plant.type];
      const radius = (zoom * 0.15 + (zoom * 0.25 * plant.growth));

      ctx.fillStyle = cropDef ? cropDef.color : '#22C55E';
      ctx.beginPath();
      ctx.arc(s.x + zoom / 2, s.y + zoom / 2, radius, 0, Math.PI * 2);
      ctx.fill();

      // Leaves / plant icon
      if (plant.growth >= 1.0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s.x + zoom / 2, s.y + zoom / 2 - radius * 0.5, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Small growth progress bar
      if (plant.growth < 1.0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(s.x + zoom * 0.2, s.y + zoom * 0.82, zoom * 0.6, zoom * 0.1);
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(s.x + zoom * 0.2, s.y + zoom * 0.82, zoom * 0.6 * plant.growth, zoom * 0.1);
      }
    });

    // 3.5. Draw Ground Items & Spoils of War
    worldManager.items.forEach((item) => {
      const s = toScreen(item.x, item.y);
      const ix = s.x + zoom / 2;
      const iy = s.y + zoom / 2;

      // Skip rendering if outside viewport
      if (s.x < -zoom * 2 || s.x > width + zoom * 2 || s.y < -zoom * 2 || s.y > height + zoom * 2) {
        return;
      }

      ctx.save();
      // Drop Shadow on ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ix, iy + zoom * 0.22, zoom * 0.26, zoom * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();

      const sz = zoom * 0.42;
      const hsz = sz / 2;

      if (item.type === 'silver') {
        // Shimmering gold/silver coins
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(ix - sz * 0.2, iy, sz * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FDE68A';
        ctx.beginPath();
        ctx.arc(ix + sz * 0.15, iy - sz * 0.1, sz * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.stroke();
      } else if (item.type === 'medicine') {
        // Medicine kit with cross
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(ix - hsz, iy - hsz, sz, sz, 4);
        ctx.fill();
        ctx.strokeStyle = '#0284C7';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.fillRect(ix - sz * 0.1, iy - sz * 0.32, sz * 0.2, sz * 0.64);
        ctx.fillRect(ix - sz * 0.32, iy - sz * 0.1, sz * 0.64, sz * 0.2);
      } else if (item.type === 'go_juice') {
        // High-tech red injector ampoule
        ctx.fillStyle = '#E11D48';
        ctx.beginPath();
        ctx.roundRect(ix - hsz * 0.6, iy - hsz, sz * 0.6, sz, 3);
        ctx.fill();
        ctx.fillStyle = '#FDA4AF';
        ctx.fillRect(ix - hsz * 0.4, iy - hsz + 2, sz * 0.4, sz * 0.35);
      } else if (item.type === 'yayo') {
        // Refined stimulant powder pouch
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.roundRect(ix - hsz, iy - hsz * 0.8, sz, sz * 0.8, 3);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', ix, iy + 3);
      } else if (item.type === 'smokeleaf_joint' || item.type === 'smokeleaf_leaves') {
        // Green herbal pack / joint
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.roundRect(ix - hsz, iy - hsz * 0.8, sz, sz * 0.8, 4);
        ctx.fill();
        ctx.strokeStyle = '#15803D';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (item.type === 'component') {
        // Microelectronics component chip
        ctx.fillStyle = '#0F766E';
        ctx.beginPath();
        ctx.roundRect(ix - hsz, iy - hsz, sz, sz, 3);
        ctx.fill();
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(ix - sz * 0.2, iy - sz * 0.2, sz * 0.4, sz * 0.4);
      } else if (item.type === 'steel' || item.type === 'plasteel') {
        // Metal ingots
        ctx.fillStyle = item.type === 'steel' ? '#64748B' : '#0284C7';
        ctx.beginPath();
        ctx.roundRect(ix - hsz * 1.2, iy - hsz * 0.6, sz * 1.2, sz * 0.7, 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // General storage pack
        ctx.fillStyle = '#B45309';
        ctx.beginPath();
        ctx.roundRect(ix - hsz, iy - hsz, sz, sz, 3);
        ctx.fill();
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Quantity badge
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(9, Math.round(zoom * 0.24))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`x${item.count}`, ix, iy + zoom * 0.45);
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    // 4. Draw Buildings
    simulation.buildings.forEach((b) => {
      const s = toScreen(b.x, b.y);
      const bw = b.width * zoom;
      const bh = b.height * zoom;

      ctx.save();
      if (!b.isConstructed) {
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x + 2, s.y + 2, bw - 4, bh - 4);
      }

      if (b.type.startsWith('wall_')) {
        ctx.fillStyle = b.type === 'wall_wood' ? '#78350F' : b.type === 'wall_steel' ? '#64748B' : '#334155';
        ctx.fillRect(s.x, s.y, bw, bh);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x, s.y, bw, bh);
      } else if (b.type === 'door') {
        ctx.fillStyle = '#92400E';
        ctx.fillRect(s.x + zoom * 0.15, s.y + zoom * 0.15, bw - zoom * 0.3, bh - zoom * 0.3);
        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x + zoom * 0.15, s.y + zoom * 0.15, bw - zoom * 0.3, bh - zoom * 0.3);
      } else if (b.type === 'drug_lab') {
        // High-tech Chemical Lab
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(s.x + 2, s.y + 2, bw - 4, bh - 4);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x + 2, s.y + 2, bw - 4, bh - 4);

        // Lab Flask & Glassware glyphs
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(s.x + bw * 0.3, s.y + bh * 0.5, zoom * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(s.x + bw * 0.7, s.y + bh * 0.5, zoom * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(10, zoom * 0.26)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('DRUG LAB', s.x + bw / 2, s.y + bh * 0.85);
      } else if (b.type === 'table_dining') {
        ctx.fillStyle = '#9A3412';
        ctx.fillRect(s.x + 4, s.y + 4, bw - 8, bh - 8);
        ctx.strokeStyle = '#C2410C';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x + 4, s.y + 4, bw - 8, bh - 8);
      } else if (b.type === 'chair') {
        ctx.fillStyle = '#B45309';
        ctx.fillRect(s.x + zoom * 0.2, s.y + zoom * 0.2, bw * 0.6, bh * 0.6);
      } else if (b.type === 'bed' || b.type === 'hospital_bed') {
        ctx.fillStyle = b.type === 'hospital_bed' ? '#0284C7' : '#475569';
        ctx.fillRect(s.x + 2, s.y + 2, bw - 4, bh - 4);
        // Pillow
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(s.x + 4, s.y + 4, bw - 8, zoom * 0.4);
      } else if (b.type === 'solar_panel') {
        ctx.fillStyle = '#0369A1';
        ctx.fillRect(s.x + 4, s.y + 4, bw - 8, bh - 8);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x + 4, s.y + 4, bw - 8, bh - 8);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SOLAR', s.x + bw / 2, s.y + bh / 2 + 4);
      } else if (b.type === 'barricade') {
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(s.x + 2, s.y + 4, bw - 4, bh - 8);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(s.x + 2, s.y + 4, bw - 4, bh - 8);
      } else {
        ctx.fillStyle = '#334155';
        ctx.fillRect(s.x + 2, s.y + 2, bw - 4, bh - 4);
      }
      ctx.restore();
    });

    // 5. Draw Pawns (Iconic RimWorld "Bean" Silhouette)
    simulation.pawns.forEach((pawn) => {
      const s = toScreen(pawn.x, pawn.y);
      const px = s.x + zoom / 2;
      const py = s.y + zoom / 2;

      ctx.save();

      // Selected ring
      if (selectedEntity?.id === pawn.id) {
        ctx.strokeStyle = pawn.isPlayerCharacter ? '#F59E0B' : '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, zoom * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(px, py + zoom * 0.3, zoom * 0.3, zoom * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // SPECIAL: Player Character Halo & Command Ring
      if (pawn.isPlayerCharacter) {
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py + zoom * 0.15, zoom * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Draw destination line if moving to target
        if (pawn.targetX !== undefined && pawn.targetY !== undefined) {
          const ts = toScreen(pawn.targetX, pawn.targetY);
          ctx.save();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(ts.x + zoom / 2, ts.y + zoom / 2);
          ctx.stroke();

          // Target reticle
          ctx.setLineDash([]);
          ctx.strokeStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(ts.x + zoom / 2, ts.y + zoom / 2, 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Torso (Bean Capsule shape)
      ctx.fillStyle = pawn.color;
      ctx.beginPath();
      ctx.roundRect(px - zoom * 0.22, py - zoom * 0.15, zoom * 0.44, zoom * 0.45, [zoom * 0.2, zoom * 0.2, zoom * 0.1, zoom * 0.1]);
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Head (Floating Oval)
      ctx.fillStyle = '#FED7AA'; // skin tone
      ctx.beginPath();
      ctx.arc(px, py - zoom * 0.25, zoom * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.stroke();

      // Hair
      ctx.fillStyle = pawn.hairColor;
      ctx.beginPath();
      ctx.arc(px, py - zoom * 0.3, zoom * 0.18, Math.PI, Math.PI * 2);
      ctx.fill();

      // Weapon in hand
      if (pawn.weapon) {
        ctx.fillStyle = '#1E293B';
        const weaponOffset = pawn.facing === 'east' ? zoom * 0.28 : -zoom * 0.28;
        ctx.fillRect(px + weaponOffset - 2, py - zoom * 0.05, 5, zoom * 0.3);
      }

      // Drafted Star / Target Aura
      if (pawn.isDrafted) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(px, py - zoom * 0.55, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Name & Activity Badge
      if (pawn.isPlayerCharacter) {
        // Player Star Badge
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', px, py - zoom * 0.72);

        ctx.fillStyle = '#FDE68A';
        ctx.font = `bold ${Math.max(10, zoom * 0.24)}px sans-serif`;
        ctx.fillText(pawn.nickname, px, py - zoom * 0.52);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(10, zoom * 0.24)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(pawn.nickname, px, py - zoom * 0.52);
      }

      // Health bar if wounded
      if (pawn.health.hp < pawn.health.maxHp) {
        const hpPercent = pawn.health.hp / pawn.health.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(px - zoom * 0.35, py - zoom * 0.7, zoom * 0.7, 4);
        ctx.fillStyle = hpPercent > 0.5 ? '#22C55E' : '#EF4444';
        ctx.fillRect(px - zoom * 0.35, py - zoom * 0.7, zoom * 0.7 * hpPercent, 4);
      }

      // Drug High Glow Aura
      if (pawn.health.highs.length > 0) {
        ctx.strokeStyle = '#86EFAC';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(px, py, zoom * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });

    // 6. Projectiles - Smooth High-Velocity Tracer Rounds
    simulation.projectiles.forEach((p) => {
      const curX = p.startX + (p.targetX - p.startX) * p.progress;
      const curY = p.startY + (p.targetY - p.startY) * p.progress;
      const head = toScreen(curX, curY);

      // Trailing tail calculation for tracer effect
      const tailProgress = Math.max(0, p.progress - 0.12);
      const tailX = p.startX + (p.targetX - p.startX) * tailProgress;
      const tailY = p.startY + (p.targetY - p.startY) * tailProgress;
      const tail = toScreen(tailX, tailY);

      const hx = head.x + zoom / 2;
      const hy = head.y + zoom / 2;
      const tx = tail.x + zoom / 2;
      const ty = tail.y + zoom / 2;

      ctx.save();
      // Tracer tail line
      const grad = ctx.createLinearGradient(tx, ty, hx, hy);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, p.color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      // Glowing bullet head
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. Floating Combat/Resource Texts
    simulation.floatingTexts.forEach((ft) => {
      const s = toScreen(ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, s.x + zoom / 2, s.y);
      ctx.globalAlpha = 1.0;
    });

    // 8. Day/Night Lighting Ambient Overlay
    const nightAlpha = Math.max(0, 0.75 - simulation.weather.light * 0.75);
    if (nightAlpha > 0.05) {
      ctx.fillStyle = `rgba(15, 23, 42, ${nightAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 9. Rain Weather Particles
    if (simulation.weather.type === 'rain') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.lineWidth = 1.5;
      const dropCount = 40;
      for (let i = 0; i < dropCount; i++) {
        const rx = (Math.sin(timeMs * 0.005 + i * 99) * 0.5 + 0.5) * width;
        const ry = ((timeMs * 0.4 + i * 25) % height);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 12);
        ctx.stroke();
      }
    }

    // 10. Hover Ground Loot Tooltip
    if (hoverTile && !selectedBuilding && !selectedZone) {
      const hoveredItem = worldManager.getItemNear(hoverTile.x, hoverTile.y, 0.85);
      if (hoveredItem) {
        const s = toScreen(hoveredItem.x, hoveredItem.y);
        const itemName = ITEM_INFO[hoveredItem.type]?.name || hoveredItem.type;
        const label = `${hoveredItem.count}x ${itemName} [Right-click: Haul]`;

        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        const textWidth = ctx.measureText(label).width;
        const tipX = s.x + zoom / 2;
        const tipY = s.y - 12;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tipX - textWidth / 2 - 8, tipY - 14, textWidth + 16, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE68A';
        ctx.textAlign = 'center';
        ctx.fillText(label, tipX, tipY);
        ctx.restore();
      }
    }

    // 11. Ghost Placement Cursor (Building or Zone blueprint)
    if (hoverTile && (selectedBuilding || selectedZone)) {
      const s = toScreen(hoverTile.x, hoverTile.y);
      ctx.save();
      if (selectedBuilding) {
        const bDef = BUILDING_DEFS[selectedBuilding];
        const bw = (bDef?.width || 1) * zoom;
        const bh = (bDef?.height || 1) * zoom;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.fillRect(s.x, s.y, bw, bh);
        ctx.strokeRect(s.x, s.y, bw, bh);
      } else if (selectedZone) {
        ctx.fillStyle = selectedZone === 'growing' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.4)';
        ctx.fillRect(s.x, s.y, zoom, zoom);
      }
      ctx.restore();
    }
  };

  // Mouse / Pointer handlers for Pan, Zoom, and Entity Selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2 || (!selectedBuilding && !selectedZone && e.button === 0 && e.shiftKey)) {
      // Pan drag
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camX: camera.x,
        camY: camera.y,
      };
      return;
    }

    // Left Click action
    if (e.button === 0 && hoverTile) {
      if (selectedBuilding) {
        // Place building blueprint
        const bDef = BUILDING_DEFS[selectedBuilding];
        // Deduct materials
        let canAfford = true;
        for (const cost of bDef.cost) {
          if ((simulation.resources[cost.item] || 0) < cost.count) {
            canAfford = false;
            break;
          }
        }

        if (canAfford) {
          bDef.cost.forEach((cost) => {
            simulation.resources[cost.item] -= cost.count;
          });
          const newId = `b_${selectedBuilding}_${Date.now()}`;
          simulation.buildings.set(newId, {
            id: newId,
            type: selectedBuilding,
            x: hoverTile.x,
            y: hoverTile.y,
            width: bDef.width,
            height: bDef.height,
            hp: bDef.hp,
            maxHp: bDef.hp,
            powerRequired: bDef.powerRequired,
            powerProduced: bDef.powerProduced,
            isConstructed: false, // Colonists construct it!
            constructionWorkLeft: 30,
            bills: selectedBuilding === 'drug_lab' ? [
              { id: `bill_${Date.now()}`, recipeId: 'roll_smokeleaf', targetCount: 10, currentCompleted: 0, isInfinite: true, active: true },
            ] : undefined,
          });
          simulation.addLog(`Placed blueprint for ${bDef.name}. Colonists assigned to construct.`, 'info');
        } else {
          simulation.addLog(`Cannot afford ${bDef.name}! Insufficient resources.`, 'warning');
        }
        return;
      }

      if (selectedZone) {
        // Add cell to active or create new zone
        const existingZone = Array.from(simulation.zones.values()).find((z) => z.type === selectedZone);
        if (existingZone) {
          if (!existingZone.cells.some((c) => c.x === hoverTile.x && c.y === hoverTile.y)) {
            existingZone.cells.push({ x: hoverTile.x, y: hoverTile.y });
          }
        } else {
          const zoneId = `z_${selectedZone}_${Date.now()}`;
          simulation.zones.set(zoneId, {
            id: zoneId,
            name: selectedZone === 'growing' ? 'Cultivation Zone' : 'Storage Zone',
            type: selectedZone,
            cells: [{ x: hoverTile.x, y: hoverTile.y }],
            color: selectedZone === 'growing' ? 'rgba(34, 197, 94, 0.28)' : 'rgba(59, 130, 246, 0.25)',
            cropType: selectedCropForZone || 'smokeleaf',
          });
        }
        return;
      }

      // Check if clicked on a Pawn
      let clickedPawn: any = null;
      simulation.pawns.forEach((p) => {
        const dist = Math.hypot(p.x - hoverTile.x, p.y - hoverTile.y);
        if (dist < 0.9) {
          clickedPawn = p;
        }
      });

      if (clickedPawn) {
        onSelectEntity(clickedPawn);
        return;
      }

      // Check if clicked on Building
      let clickedBuilding: any = null;
      simulation.buildings.forEach((b) => {
        if (
          hoverTile.x >= b.x &&
          hoverTile.x < b.x + b.width &&
          hoverTile.y >= b.y &&
          hoverTile.y < b.y + b.height
        ) {
          clickedBuilding = b;
        }
      });

      if (clickedBuilding) {
        onSelectEntity(clickedBuilding);
        return;
      }

      // If drafted pawn selected and clicked on ground: move drafted pawn!
      if (selectedEntity && selectedEntity.faction === 'player' && selectedEntity.isDrafted) {
        simulation.movePawnTowards(selectedEntity, hoverTile.x, hoverTile.y);
        simulation.addFloatingText('Moving', hoverTile.x, hoverTile.y, '#38BDF8');
        return;
      }

      onSelectEntity(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / cameraRef.current.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / cameraRef.current.zoom;
      setCamera((prev) => ({
        ...prev,
        x: dragStartRef.current.camX - dx,
        y: dragStartRef.current.camY - dy,
      }));
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const curCam = cameraRef.current;
    const wx = Math.floor((mx - canvas.width / 2) / curCam.zoom + curCam.x);
    const wy = Math.floor((my - canvas.height / 2) / curCam.zoom + curCam.y);

    setHoverTile({ x: wx, y: wy });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setCamera((prev) => ({
      ...prev,
      zoom: Math.max(18, Math.min(80, prev.zoom * zoomFactor)),
    }));
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (selectedBuilding || selectedZone) {
      onClearTool();
      return;
    }

    if (hoverTile) {
      // If a drafted pawn other than the player character is selected:
      if (selectedEntity && selectedEntity.faction === 'player' && selectedEntity.isDrafted && !selectedEntity.isPlayerCharacter) {
        simulation.movePawnTowards(selectedEntity, hoverTile.x, hoverTile.y);
        simulation.addFloatingText('Moving Order', hoverTile.x, hoverTile.y, '#38BDF8');
        return;
      }

      // Otherwise: Order Commander Character Noah (You) to interact or walk!
      simulation.commandPlayerInteract(hoverTile.x, hoverTile.y);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      {/* Coordinate & Controls Over The Top (COT) HUD Overlay */}
      <div className="absolute bottom-16 right-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-center gap-3 shadow-2xl">
        {/* Walk / Camera Pan Toggle */}
        <button
          onClick={() => setControlMode((prev) => (prev === 'character' ? 'camera' : 'character'))}
          className={`px-2.5 py-1 rounded-lg font-semibold border transition-all flex items-center gap-1.5 ${
            controlMode === 'character'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
              : 'bg-sky-500/20 text-sky-300 border-sky-500/50 hover:bg-sky-500/30'
          }`}
          title="Press Tab or Z to toggle control mode"
        >
          {controlMode === 'character' ? '🚶 Walk Noah (WASD)' : '📷 Pan Camera (WASD)'}
        </button>

        {/* Lock View Toggle */}
        <button
          onClick={() => setFollowPlayer((prev) => !prev)}
          className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
            followPlayer
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Camera smoothly follows character when walking"
        >
          {followPlayer ? '🔒 View Locked' : '🔓 Free View'}
        </button>

        {/* Center on Player button */}
        <button
          onClick={() => {
            const player = simulation.getPlayerCharacter();
            if (player) {
              setCamera((prev) => ({ ...prev, x: player.x, y: player.y }));
            }
          }}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
          title="Center view on your character (Hotkey C)"
        >
          Center (C)
        </button>

        <span className="text-slate-600">|</span>
        <span className="font-mono text-slate-300">[{hoverTile ? `${hoverTile.x}, ${hoverTile.y}` : '--'}]</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 font-mono">{Math.round((camera.zoom / 42) * 100)}%</span>
      </div>
    </div>
  );
};
