import React from 'react';
import { 
  X, 
  Target, 
  Heart, 
  Zap, 
  Coffee, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Beaker
} from 'lucide-react';
import { DRUG_RECIPES, ITEM_INFO } from '../game/constants';
import { simulation } from '../game/simulation';
import { sound } from '../utils/audio';
import { ItemType } from '../types';

interface InspectorProps {
  entity: any | null;
  onClose: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({ entity, onClose }) => {
  if (!entity) return null;

  const isPawn = Boolean(entity.needs);
  const isBuilding = Boolean(entity.type && !entity.needs);

  const handleIngestDrug = (drugType: ItemType) => {
    simulation.consumeDrug(entity, drugType);
  };

  const handleAddBill = (recipeId: string) => {
    if (!entity.bills) entity.bills = [];
    entity.bills.push({
      id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      recipeId,
      targetCount: 5,
      currentCompleted: 0,
      isInfinite: true,
      active: true,
    });
    sound.playClick();
    simulation.addLog(`Added manufacturing bill to ${entity.type}.`, 'drug');
  };

  const handleRemoveBill = (billId: string) => {
    if (entity.bills) {
      entity.bills = entity.bills.filter((b: any) => b.id !== billId);
      sound.playClick();
    }
  };

  return (
    <div className="absolute top-16 right-4 w-96 max-h-[calc(100vh-130px)] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-30 p-5 text-slate-200 select-none">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            {isPawn ? entity.name : entity.type.replace(/_/g, ' ').toUpperCase()}
          </h3>
          <p className="text-xs text-slate-400 capitalize">
            {isPawn ? `Colonist (${entity.nickname})` : `Structure (HP: ${entity.hp}/${entity.maxHp})`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pawn Inspector */}
      {isPawn && (
        <div className="mt-4 space-y-4 text-xs">
          {/* Player Character Commander Banner */}
          {entity.isPlayerCharacter && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                  ★ Your Character (Commander)
                </span>
                <button
                  onClick={() => {
                    entity.manualControl = !entity.manualControl;
                    sound.playClick();
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                    entity.manualControl
                      ? 'bg-amber-500/30 text-amber-200 border-amber-500/60'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {entity.manualControl ? 'Manual Only' : 'Auto Work Enabled'}
                </button>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Use <kbd className="px-1 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">W A S D</kbd> to walk, and <strong>Right-Click</strong> on tiles, plants, minerals, or blueprints to direct your actions immediately.
              </p>
            </div>
          )}

          {/* Combat & Drafting Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <div>
              <div className="font-semibold text-slate-200">{entity.weapon.name}</div>
              <div className="text-[11px] text-slate-400">
                Damage: {entity.weapon.damage} • Range: {entity.weapon.range} tiles
              </div>
            </div>
            <button
              onClick={() => {
                entity.isDrafted = !entity.isDrafted;
                sound.playDraft();
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                entity.isDrafted
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{entity.isDrafted ? 'Drafted' : 'Draft'}</span>
            </button>
          </div>

          {/* Needs Bars */}
          <div>
            <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Needs & Wellbeing</span>
              {entity.needs.mood < 30 && (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Break Risk
                </span>
              )}
            </div>

            <div className="space-y-2">
              {/* Mood */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Mood</span>
                  <span>{Math.round(entity.needs.mood)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      entity.needs.mood > 60 ? 'bg-emerald-400' : entity.needs.mood > 35 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${entity.needs.mood}%` }}
                  />
                </div>
              </div>

              {/* Hunger */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Food / Hunger</span>
                  <span>{Math.round(entity.needs.hunger)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${entity.needs.hunger}%` }} />
                </div>
              </div>

              {/* Rest */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Rest / Energy</span>
                  <span>{Math.round(entity.needs.rest)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400" style={{ width: `${entity.needs.rest}%` }} />
                </div>
              </div>

              {/* Chemical */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Chemical / Recreation</span>
                  <span>{Math.round(entity.needs.chemical)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: `${entity.needs.chemical}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Active Drug Highs & Drug Administering */}
          <div>
            <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Drug Ingestion & Highs</span>
            </div>

            {/* Active highs */}
            {entity.health.highs.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {entity.health.highs.map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[11px] flex items-center gap-1"
                  >
                    <span>{ITEM_INFO[h.type as ItemType]?.name}</span>
                    <span className="text-emerald-400 font-mono">({h.timeLeft}s)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic mb-2">No active drug highs.</p>
            )}

            {/* Ingest buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                disabled={simulation.resources.smokeleaf_joint <= 0}
                onClick={() => handleIngestDrug('smokeleaf_joint')}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-[11px] flex items-center justify-between"
              >
                <span>Smokeleaf Joint</span>
                <span className="font-mono text-emerald-400">x{simulation.resources.smokeleaf_joint || 0}</span>
              </button>

              <button
                disabled={simulation.resources.psychite_tea <= 0}
                onClick={() => handleIngestDrug('psychite_tea')}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-[11px] flex items-center justify-between"
              >
                <span>Psychite Tea</span>
                <span className="font-mono text-teal-400">x{simulation.resources.psychite_tea || 0}</span>
              </button>

              <button
                disabled={simulation.resources.yayo <= 0}
                onClick={() => handleIngestDrug('yayo')}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-[11px] flex items-center justify-between"
              >
                <span>Yayo</span>
                <span className="font-mono text-sky-300">x{simulation.resources.yayo || 0}</span>
              </button>

              <button
                disabled={simulation.resources.go_juice <= 0}
                onClick={() => handleIngestDrug('go_juice')}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-[11px] flex items-center justify-between"
              >
                <span>Go-Juice</span>
                <span className="font-mono text-rose-400">x{simulation.resources.go_juice || 0}</span>
              </button>
            </div>
          </div>

          {/* Colonist Skills */}
          <div>
            <div className="font-semibold text-slate-300 mb-1.5">Skills</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between p-1.5 rounded bg-slate-800/60 border border-slate-800">
                <span className="text-slate-400">Plants (Farming):</span>
                <span className="font-bold text-emerald-400">{entity.skills.plants}</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-800/60 border border-slate-800">
                <span className="text-slate-400">Crafting / Drugs:</span>
                <span className="font-bold text-purple-400">{entity.skills.crafting}</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-800/60 border border-slate-800">
                <span className="text-slate-400">Shooting:</span>
                <span className="font-bold text-amber-400">{entity.skills.shooting}</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-800/60 border border-slate-800">
                <span className="text-slate-400">Construction:</span>
                <span className="font-bold text-sky-400">{entity.skills.construction}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Building Inspector (Drug Lab & Production Bills) */}
      {isBuilding && (
        <div className="mt-4 space-y-4 text-xs">
          {entity.type === 'drug_lab' || entity.type === 'crafting_spot' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Beaker className="w-4 h-4 text-emerald-400" />
                  <span>Drug Manufacturing Bills</span>
                </span>
              </div>

              {/* Active Bills */}
              <div className="space-y-2 mb-4">
                {entity.bills && entity.bills.length > 0 ? (
                  entity.bills.map((bill: any) => {
                    const recipe = DRUG_RECIPES.find((r) => r.id === bill.recipeId);
                    return (
                      <div
                        key={bill.id}
                        className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{recipe?.name || bill.recipeId}</div>
                          <div className="text-[11px] text-emerald-400 font-mono">
                            Produces: {recipe?.producedCount}x {ITEM_INFO[recipe?.producedItem as ItemType]?.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {recipe?.ingredients.map((ing) => `${ing.count} ${ITEM_INFO[ing.item]?.name}`).join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => (bill.active = !bill.active)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold ${
                              bill.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {bill.active ? 'Active' : 'Suspended'}
                          </button>
                          <button
                            onClick={() => handleRemoveBill(bill.id)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 italic">No manufacturing bills set. Colonists will remain idle.</p>
                )}
              </div>

              {/* Add Bill dropdown list */}
              <div>
                <span className="text-[11px] text-slate-400 font-semibold mb-1.5 block">Add New Drug Recipe:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {DRUG_RECIPES.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleAddBill(recipe.id)}
                      className="w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/70 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{recipe.name}</div>
                        <div className="text-[10px] text-slate-400">{recipe.effectsSummary}</div>
                      </div>
                      <Plus className="w-4 h-4 text-emerald-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-400">
                {entity.isConstructed ? 'Operational structure.' : 'Blueprint under construction.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
