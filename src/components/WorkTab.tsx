import React from 'react';
import { X, Check } from 'lucide-react';
import { simulation } from '../game/simulation';
import { sound } from '../utils/audio';
import { WorkType } from '../types';

interface WorkTabProps {
  onClose: () => void;
}

const WORK_COLUMNS: { key: WorkType; label: string; desc: string }[] = [
  { key: 'firefight', label: 'Firefight', desc: 'Extinguish fires immediately' },
  { key: 'patient', label: 'Patient', desc: 'Go to bed when injured' },
  { key: 'doctor', label: 'Doctor', desc: 'Treat wounded colonists' },
  { key: 'bed_rest', label: 'Bed Rest', desc: 'Recover health in bed' },
  { key: 'crafting', label: 'Drug Synth', desc: 'Produce joints, yayo, flake at Drug Lab' },
  { key: 'farming', label: 'Farming', desc: 'Sow and harvest smokeleaf & crops' },
  { key: 'construction', label: 'Construct', desc: 'Build walls and facilities' },
  { key: 'mining', label: 'Mining', desc: 'Extract steel and minerals' },
  { key: 'hauling', label: 'Hauling', desc: 'Transport items to stockpiles' },
  { key: 'cleaning', label: 'Cleaning', desc: 'Clean filth and blood' },
  { key: 'guarding', label: 'Guarding', desc: 'Stand guard against raids' },
];

export const WorkTab: React.FC<WorkTabProps> = ({ onClose }) => {
  const pawns = Array.from(simulation.pawns.values()).filter((p) => p.faction === 'player');
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const cyclePriority = (pawn: any, work: WorkType) => {
    sound.playClick();
    const cur = pawn.workPriorities[work] || 0;
    // Cycle 1 -> 2 -> 3 -> 4 -> 0 -> 1
    const next = cur === 0 ? 1 : cur >= 4 ? 0 : cur + 1;
    pawn.workPriorities[work] = next;
    forceUpdate();
  };

  const getPriorityBadge = (val: number) => {
    if (val === 1) return <span className="text-emerald-400 font-bold">1</span>;
    if (val === 2) return <span className="text-amber-400 font-bold">2</span>;
    if (val === 3) return <span className="text-sky-400 font-semibold">3</span>;
    if (val === 4) return <span className="text-slate-400 font-normal">4</span>;
    return <span className="text-slate-600">-</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Work Priorities Matrix (Manual Automation)
            </h2>
            <p className="text-xs text-slate-400">
              Set priority numbers: <span className="text-emerald-400 font-bold">1</span> = Urgent (Highest),{' '}
              <span className="text-amber-400 font-bold">2</span> = High,{' '}
              <span className="text-sky-400 font-semibold">3</span> = Normal,{' '}
              <span className="text-slate-400">4</span> = Low, <span className="text-slate-600">-</span> = Disabled.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Colonist</th>
                {WORK_COLUMNS.map((col) => (
                  <th key={col.key} className="py-2.5 px-2 text-center font-medium" title={col.desc}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {pawns.map((pawn) => (
                <tr key={pawn.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pawn.color }}
                    />
                    <span>{pawn.name}</span>
                  </td>
                  {WORK_COLUMNS.map((col) => {
                    const priority = pawn.workPriorities[col.key] || 0;
                    return (
                      <td key={col.key} className="py-2 px-2 text-center">
                        <button
                          onClick={() => cyclePriority(pawn, col.key)}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                            priority === 1
                              ? 'bg-emerald-500/20 border-emerald-500/60'
                              : priority === 2
                              ? 'bg-amber-500/20 border-amber-500/60'
                              : priority === 3
                              ? 'bg-sky-500/20 border-sky-500/60'
                              : priority === 4
                              ? 'bg-slate-800 border-slate-700'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {getPriorityBadge(priority)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Apply Work Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
};
