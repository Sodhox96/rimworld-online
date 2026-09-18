import React, { useState, useEffect } from 'react';
import { X, Save, Download, Upload, Trash2, Cloud, CheckCircle } from 'lucide-react';
import { exportGameToJson, importGameFromJson, mockFirestore } from '../services/storage';
import { simulation } from '../game/simulation';
import { sound } from '../utils/audio';

interface SaveLoadModalProps {
  onClose: () => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ onClose }) => {
  const [saveName, setSaveName] = useState(`${simulation.colonyName}-Day${simulation.time.day}`);
  const [saves, setSaves] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving'>('synced');

  const refreshSaves = () => {
    setSaves(mockFirestore.listSaves());
  };

  useEffect(() => {
    refreshSaves();
  }, []);

  const handleCreateSave = async () => {
    sound.playClick();
    setSyncStatus('saving');

    const saveData = {
      id: `save_${Date.now()}`,
      version: 1,
      colonyName: simulation.colonyName,
      savedAt: new Date().toLocaleString(),
      time: simulation.time,
      resources: simulation.resources,
      pawns: Array.from(simulation.pawns.values()),
      buildings: Array.from(simulation.buildings.values()),
      zones: Array.from(simulation.zones.values()),
      logs: simulation.logs,
      worldFactions: simulation.worldFactions,
    };

    await mockFirestore.setDoc('saves', saveData.id, saveData);
    setSyncStatus('synced');
    simulation.addLog(`Game state saved to slot [${saveName}].`, 'success');
    refreshSaves();
  };

  const handleLoadSave = async (saveId: string) => {
    sound.playClick();
    const data = await mockFirestore.getDoc('saves', saveId);
    if (!data) return;

    // Restore state
    simulation.colonyName = data.colonyName || simulation.colonyName;
    simulation.time = data.time || simulation.time;
    simulation.resources = data.resources || simulation.resources;

    simulation.pawns.clear();
    (data.pawns || []).forEach((p: any) => simulation.pawns.set(p.id, p));

    simulation.buildings.clear();
    (data.buildings || []).forEach((b: any) => simulation.buildings.set(b.id, b));

    simulation.zones.clear();
    (data.zones || []).forEach((z: any) => simulation.zones.set(z.id, z));

    simulation.logs = data.logs || simulation.logs;
    simulation.worldFactions = data.worldFactions || simulation.worldFactions;

    simulation.addLog(`Colony loaded successfully from slot [${data.colonyName}].`, 'info');
    onClose();
  };

  const handleDeleteSave = (saveId: string) => {
    mockFirestore.deleteSave(saveId);
    sound.playClick();
    refreshSaves();
  };

  const handleExport = () => {
    const saveData: any = {
      id: `save_${Date.now()}`,
      version: 1,
      colonyName: simulation.colonyName,
      savedAt: new Date().toLocaleString(),
      time: simulation.time,
      resources: simulation.resources,
      pawns: Array.from(simulation.pawns.values()),
      buildings: Array.from(simulation.buildings.values()),
      zones: Array.from(simulation.zones.values()),
      logs: simulation.logs,
      worldFactions: simulation.worldFactions,
    };
    exportGameToJson(saveData);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importGameFromJson(file);
      await mockFirestore.setDoc('saves', data.id, data);
      handleLoadSave(data.id);
    } catch (err: any) {
      alert(err.message || 'Error importing save file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-400" />
              <span>State Persistence & Mock Firebase Cloud</span>
            </h2>
            <p className="text-xs text-slate-400">
              Save/load colony states locally or sync through the mocked Firebase Firestore document engine.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Mock Firebase Firestore:</span>
            <span className="font-mono text-emerald-400 font-semibold">Active & Synced</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export JSON</span>
            </button>
            <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* New Save Input */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
            placeholder="Save Slot Name..."
          />
          <button
            onClick={handleCreateSave}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Create Save</span>
          </button>
        </div>

        {/* Existing Saves List */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 text-xs pr-1">
          {saves.length > 0 ? (
            saves.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-200">{s.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Day {s.day} • {s.colonistCount} Colonists • {s.date}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoadSave(s.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteSave(s.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                    title="Delete Save"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic p-3 text-center">No saved game states recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
