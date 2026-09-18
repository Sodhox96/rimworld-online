import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  Globe, 
  Users, 
  Sliders, 
  Coins, 
  Save, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Sun, 
  Thermometer, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { simulation } from '../game/simulation';
import { sound } from '../utils/audio';
import { ITEM_INFO } from '../game/constants';
import { ItemType } from '../types';

interface TopBarProps {
  onOpenWorkTab: () => void;
  onOpenWorldMap: () => void;
  onOpenTrade: () => void;
  onOpenMultiplayer: () => void;
  onOpenSaveLoad: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenWorkTab,
  onOpenWorldMap,
  onOpenTrade,
  onOpenMultiplayer,
  onOpenSaveLoad,
  soundEnabled,
  onToggleSound,
}) => {
  const time = simulation.time;
  const res = simulation.resources;
  const weather = simulation.weather;

  const keyResources: ItemType[] = [
    'silver',
    'wood',
    'steel',
    'component',
    'medicine',
    'simple_meal',
    'smokeleaf_leaves',
    'smokeleaf_joint',
    'psychoid_leaves',
    'yayo',
    'go_juice',
  ];

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/70 z-20 px-4 flex items-center justify-between text-slate-200 select-none shadow-lg">
      {/* Left: Colony Title & Critical Resources */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-sm tracking-wide text-amber-300">
            {simulation.colonyName}
          </span>
        </div>

        {/* Resources Badges */}
        <div className="hidden lg:flex items-center gap-2.5 overflow-x-auto py-1 max-w-2xl">
          {keyResources.map((type) => {
            const info = ITEM_INFO[type];
            const count = res[type] || 0;
            return (
              <div
                key={type}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-mono"
                title={`${info.name}: ${info.description} (Value: ${info.value} Silver)`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-slate-400 font-sans text-[11px]">{info.name.split(' ')[0]}:</span>
                <span className={`font-semibold ${count > 0 ? 'text-slate-100' : 'text-slate-500'}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: In-Game Time & Diurnal/Speed Controls */}
      <div className="flex items-center gap-3">
        {/* Weather & Temp */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
          {weather.type === 'rain' ? (
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{weather.temperature}°C</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 capitalize">{weather.type}</span>
        </div>

        {/* Clock */}
        <div className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
          <span className="text-amber-400 font-semibold">Day {time.day}</span>
          <span className="text-slate-400">, </span>
          <span>{String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}h</span>
        </div>

        {/* Time Speeds */}
        <div className="flex items-center bg-slate-800 rounded border border-slate-700 p-0.5">
          <button
            onClick={() => {
              simulation.time.speed = 0;
              sound.playClick();
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              time.speed === 0 ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-100'
            }`}
            title="Pause (Space / 0)"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              simulation.time.speed = 1;
              sound.playClick();
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              time.speed === 1 ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-100'
            }`}
            title="1x Normal Speed (1)"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              simulation.time.speed = 2;
              sound.playClick();
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              time.speed === 2 ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-100'
            }`}
            title="2x Fast Speed (2)"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              simulation.time.speed = 3;
              sound.playClick();
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              time.speed === 3 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-100'
            }`}
            title="3x Ultra Speed (3)"
          >
            <span className="text-xs font-bold font-mono">3x</span>
          </button>
        </div>
      </div>

      {/* Right: Modal & Management Hub Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenWorkTab}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 transition-colors"
          title="Work Priorities (1-4 Priority Grid)"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Work</span>
        </button>

        <button
          onClick={onOpenTrade}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 transition-colors"
          title="Trade Caravan Market - Sell Manufactured Drugs"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Trade</span>
        </button>

        <button
          onClick={onOpenWorldMap}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 transition-colors"
          title="World Map & Faction Bases"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">World</span>
        </button>

        <button
          onClick={onOpenMultiplayer}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 transition-colors"
          title="SignalR Co-op Multiplayer Hub"
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Multiplayer</span>
        </button>

        <button
          onClick={onOpenSaveLoad}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 transition-colors"
          title="Game Saves & Mock Firebase State Persistence"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={onToggleSound}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      </div>
    </header>
  );
};
