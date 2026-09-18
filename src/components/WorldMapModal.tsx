import React, { useState } from 'react';
import { X, Globe, Swords, Shield, Skull, CheckCircle } from 'lucide-react';
import { simulation } from '../game/simulation';
import { FactionSettlement } from '../types';

interface WorldMapModalProps {
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({ onClose }) => {
  const settlements = simulation.worldFactions;
  const [selectedSettlement, setSelectedSettlement] = useState<FactionSettlement | null>(settlements[0] || null);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Calculate Colony Combat Force
  let combatPower = 0;
  simulation.pawns.forEach((p) => {
    if (p.faction === 'player') {
      combatPower += p.skills.shooting * 10 + p.weapon.damage * 2;
    }
  });

  const handleLaunchAssault = (settlementId: string) => {
    simulation.launchExpedition(settlementId);
    forceUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>Planet World Map & Frontier Factions</span>
            </h2>
            <p className="text-xs text-slate-400">
              Form caravan squads to explore neighboring territories, conduct diplomacy, and overthrow hostile pirate outposts.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column: Map Sector Grid & Faction Inspector */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* World Sector Grid Representation */}
          <div className="md:col-span-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative h-80 overflow-hidden flex items-center justify-center">
            {/* World Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20 border border-slate-700 pointer-events-none">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-slate-800" />
              ))}
            </div>

            {/* Home Colony Marker */}
            <div
              className="absolute flex flex-col items-center cursor-pointer group"
              style={{ left: '48%', top: '48%' }}
            >
              <div className="w-4 h-4 rounded-full bg-sky-400 ring-4 ring-sky-400/30 animate-pulse" />
              <span className="text-[11px] font-bold text-sky-300 mt-1 bg-slate-900/80 px-1.5 py-0.5 rounded border border-sky-400/40">
                {simulation.colonyName} (Home)
              </span>
            </div>

            {/* Other Faction Settlement Markers */}
            {settlements.map((s) => {
              const posX = 48 + s.worldX * 2.2;
              const posY = 48 + s.worldY * 2.2;
              const isSelected = selectedSettlement?.id === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSettlement(s)}
                  className={`absolute flex flex-col items-center cursor-pointer transition-all ${
                    isSelected ? 'scale-110 z-10' : 'hover:scale-105'
                  }`}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      s.isOverthrown
                        ? 'bg-emerald-500 border-white'
                        : s.type === 'hostile'
                        ? 'bg-rose-500 border-rose-900 ring-2 ring-rose-500/40'
                        : s.type === 'friendly'
                        ? 'bg-sky-500 border-sky-900'
                        : 'bg-amber-500 border-amber-900'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded border backdrop-blur-sm ${
                      s.isOverthrown
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : s.type === 'hostile'
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Settlement Intel & Assault Dispatch */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between text-xs">
            {selectedSettlement ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Faction:</span>
                    <span
                      className={`font-semibold capitalize ${
                        selectedSettlement.type === 'hostile'
                          ? 'text-rose-400'
                          : selectedSettlement.type === 'friendly'
                          ? 'text-sky-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {selectedSettlement.type} ({selectedSettlement.faction})
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{selectedSettlement.name}</h3>
                </div>

                <div className="space-y-2 text-[11px] p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={selectedSettlement.isOverthrown ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                      {selectedSettlement.isOverthrown ? 'Overthrown & Pacified' : 'Active Fortification'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Defense Rating:</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      {selectedSettlement.defenseRating} Def
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plunder Loot:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      ~{selectedSettlement.lootEstimatedSilver} Silver
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="font-mono text-slate-400">
                      [{selectedSettlement.worldX}, {selectedSettlement.worldY}]
                    </span>
                  </div>
                </div>

                {/* Colony Expedition Power */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Our Colony Expedition Power:</div>
                  <div className="text-base font-mono font-bold text-sky-400">{combatPower} PWR</div>
                </div>

                {/* Overthrow Action */}
                {selectedSettlement.type === 'hostile' && !selectedSettlement.isOverthrown && (
                  <button
                    onClick={() => handleLaunchAssault(selectedSettlement.id)}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-colors"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Launch Assault Expedition</span>
                  </button>
                )}

                {selectedSettlement.isOverthrown && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-center font-semibold flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Base Overthrown & Claimed!</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 italic">Select a settlement on the world map to view military intel.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
