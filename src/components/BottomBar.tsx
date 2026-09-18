import React, { useState } from 'react';
import { 
  Hammer, 
  ShieldAlert, 
  Layers, 
  Zap, 
  Bed, 
  Beaker, 
  Sprout, 
  Box, 
  X,
  Target
} from 'lucide-react';
import { BUILDING_DEFS, CROP_DEFS } from '../game/constants';
import { simulation } from '../game/simulation';
import { sound } from '../utils/audio';
import { BuildingType, CropType, ZoneType } from '../types';

interface BottomBarProps {
  selectedBuilding: BuildingType | null;
  onSelectBuilding: (b: BuildingType | null) => void;
  selectedZone: ZoneType | null;
  onSelectZone: (z: ZoneType | null) => void;
  selectedCropForZone: CropType | null;
  onSelectCropForZone: (c: CropType | null) => void;
  selectedEntity: any | null;
  onSelectEntity: (e: any | null) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  selectedBuilding,
  onSelectBuilding,
  selectedZone,
  onSelectZone,
  selectedCropForZone,
  onSelectCropForZone,
  selectedEntity,
  onSelectEntity,
}) => {
  const [activeTab, setActiveTab] = useState<'none' | 'structure' | 'production' | 'power' | 'furniture' | 'security' | 'zones'>('none');
  const pawns = Array.from(simulation.pawns.values()).filter((p) => p.faction === 'player');
  const recentLogs = simulation.logs.slice(0, 3);

  const handleSelectBuildingType = (type: BuildingType) => {
    sound.playClick();
    onSelectBuilding(type);
    onSelectZone(null);
  };

  const handleSelectZoneType = (type: ZoneType, crop?: CropType) => {
    sound.playClick();
    onSelectZone(type);
    onSelectBuilding(null);
    if (crop) onSelectCropForZone(crop);
  };

  const toggleDraft = (pawn: any) => {
    pawn.isDrafted = !pawn.isDrafted;
    sound.playDraft();
    simulation.addLog(`${pawn.nickname} is ${pawn.isDrafted ? 'DRAFTED for combat!' : 'undrafted (automated work resumed).'}`);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none select-none flex flex-col justify-end">
      {/* 1. Colonist Roster Bar (Centered on Top of Bottom Bar) */}
      <div className="pointer-events-auto flex items-center justify-center gap-2 mb-2 px-4">
        {pawns.map((pawn) => {
          const isSelected = selectedEntity?.id === pawn.id;
          const moodPercent = pawn.needs.mood;
          const isHungry = pawn.needs.hunger < 30;
          const isTired = pawn.needs.rest < 20;

          return (
            <div
              key={pawn.id}
              onClick={() => {
                sound.playClick();
                onSelectEntity(pawn);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md cursor-pointer border transition-all shadow-md ${
                isSelected
                  ? pawn.isPlayerCharacter
                    ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50'
                    : 'bg-slate-800/95 border-sky-400 ring-2 ring-sky-400/40'
                  : pawn.isPlayerCharacter
                  ? 'bg-amber-950/20 border-amber-500/50 hover:bg-amber-950/30'
                  : 'bg-slate-900/80 border-slate-700/70 hover:bg-slate-800/80'
              }`}
            >
              {/* Pawn Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-slate-900 border border-slate-950 relative shadow"
                style={{ backgroundColor: pawn.color }}
              >
                {pawn.nickname.substring(0, 1)}
                {pawn.isPlayerCharacter && (
                  <div className="absolute -top-1.5 -left-1 text-[11px] text-amber-300 drop-shadow">
                    ★
                  </div>
                )}
                {pawn.isDrafted && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-slate-950 animate-ping" />
                )}
              </div>

              {/* Name & Mood */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${pawn.isPlayerCharacter ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                    {pawn.nickname}
                  </span>
                  {pawn.isPlayerCharacter && (
                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      YOU
                    </span>
                  )}
                  {pawn.isDrafted && (
                    <span className="text-[10px] px-1 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                      DRAFT
                    </span>
                  )}
                </div>

                {/* Mood Bar */}
                <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full ${
                      moodPercent > 60 ? 'bg-emerald-400' : moodPercent > 35 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${moodPercent}%` }}
                  />
                </div>

                <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                  {pawn.isPlayerCharacter && pawn.manualControl
                    ? 'Player walking'
                    : pawn.isDrafted
                    ? 'Standing ground'
                    : pawn.currentJob.type === 'crafting_drug'
                    ? 'Synthesizing'
                    : pawn.currentJob.type === 'harvesting'
                    ? 'Harvesting'
                    : pawn.currentJob.type === 'eating'
                    ? 'Eating meal'
                    : pawn.currentJob.type === 'sleeping'
                    ? 'Resting'
                    : 'Working'}
                </span>
              </div>

              {/* Quick Draft Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDraft(pawn);
                }}
                className={`ml-1 p-1 rounded transition-colors ${
                  pawn.isDrafted
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700'
                }`}
                title={pawn.isDrafted ? 'Undraft (Resume Work)' : 'Draft Colonist (Combat Stance)'}
              >
                <Target className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. Submenu Tray for Active Architect Tab */}
      {activeTab !== 'none' && (
        <div className="pointer-events-auto mx-4 mb-2 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {activeTab === 'structure' && (
              <>
                {(['wall_wood', 'wall_stone', 'wall_steel', 'door'] as BuildingType[]).map((type) => {
                  const def = BUILDING_DEFS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectBuildingType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedBuilding === type
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span>{def.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({def.cost.map((c) => `${c.count} ${c.item}`).join(', ')})
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {activeTab === 'production' && (
              <>
                {(['drug_lab', 'crafting_spot', 'hydroponics'] as BuildingType[]).map((type) => {
                  const def = BUILDING_DEFS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectBuildingType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedBuilding === type
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Beaker className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{def.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({def.cost.map((c) => `${c.count} ${c.item}`).join(', ') || 'Free'})
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {activeTab === 'power' && (
              <>
                {(['solar_panel', 'fueled_generator', 'battery'] as BuildingType[]).map((type) => {
                  const def = BUILDING_DEFS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectBuildingType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedBuilding === type
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{def.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({def.cost.map((c) => `${c.count} ${c.item}`).join(', ')})
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {activeTab === 'furniture' && (
              <>
                {(['bed', 'hospital_bed', 'table_dining', 'chair', 'standing_lamp'] as BuildingType[]).map((type) => {
                  const def = BUILDING_DEFS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectBuildingType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedBuilding === type
                          ? 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Bed className="w-3.5 h-3.5 text-blue-400" />
                      <span>{def.name}</span>
                    </button>
                  );
                })}
              </>
            )}

            {activeTab === 'security' && (
              <>
                {(['barricade'] as BuildingType[]).map((type) => {
                  const def = BUILDING_DEFS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectBuildingType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedBuilding === type
                          ? 'bg-red-500/20 text-red-300 border-red-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      <span>{def.name}</span>
                    </button>
                  );
                })}
              </>
            )}

            {activeTab === 'zones' && (
              <>
                <button
                  onClick={() => handleSelectZoneType('stockpile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                    selectedZone === 'stockpile'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-blue-400" />
                  <span>Stockpile Zone</span>
                </button>

                {(['smokeleaf', 'psychoid', 'potato', 'healroot'] as CropType[]).map((crop) => {
                  const cropDef = CROP_DEFS[crop];
                  return (
                    <button
                      key={crop}
                      onClick={() => handleSelectZoneType('growing', crop)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedZone === 'growing' && selectedCropForZone === crop
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Grow {cropDef.name}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          <button
            onClick={() => setActiveTab('none')}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Main Bottom Architect & Log Bar */}
      <div className="pointer-events-auto h-14 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/80 px-4 flex items-center justify-between shadow-2xl">
        {/* Architect Category Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab(activeTab === 'structure' ? 'none' : 'structure')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'structure'
                ? 'bg-sky-500/20 text-sky-400 border-sky-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Structure</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'production' ? 'none' : 'production')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'production'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Beaker className="w-3.5 h-3.5" />
            <span>Drug Lab & Work</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'power' ? 'none' : 'power')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'power'
                ? 'bg-amber-500/20 text-amber-400 border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Power</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'furniture' ? 'none' : 'furniture')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'furniture'
                ? 'bg-blue-500/20 text-blue-400 border-blue-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>Furniture</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'security' ? 'none' : 'security')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'security'
                ? 'bg-red-500/20 text-red-400 border-red-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'zones' ? 'none' : 'zones')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'zones'
                ? 'bg-purple-500/20 text-purple-400 border-purple-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Zones & Farming</span>
          </button>
        </div>

        {/* Live Event Log Ticker */}
        <div className="hidden md:flex items-center gap-2 max-w-md overflow-hidden text-xs text-slate-400">
          {recentLogs[0] && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono text-slate-500 text-[11px]">{recentLogs[0].timestamp}:</span>
              <span
                className={`truncate ${
                  recentLogs[0].type === 'danger'
                    ? 'text-rose-400 font-semibold'
                    : recentLogs[0].type === 'drug'
                    ? 'text-emerald-300'
                    : recentLogs[0].type === 'success'
                    ? 'text-sky-300'
                    : 'text-slate-300'
                }`}
              >
                {recentLogs[0].message}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
