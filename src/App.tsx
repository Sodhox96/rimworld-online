/**
 * RimColony: Frontier Simulator - Main Application
 */
import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TopBar } from './components/TopBar';
import { BottomBar } from './components/BottomBar';
import { Inspector } from './components/Inspector';
import { WorkTab } from './components/WorkTab';
import { TradeModal } from './components/TradeModal';
import { WorldMapModal } from './components/WorldMapModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { simulation } from './game/simulation';
import { sound } from './utils/audio';
import { BuildingType, CropType, ZoneType } from './types';

export default function App() {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>(null);
  const [selectedCropForZone, setSelectedCropForZone] = useState<CropType | null>('smokeleaf');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Modals state
  const [showWorkTab, setShowWorkTab] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.isSoundEnabled());

  const handleClearTool = () => {
    setSelectedBuilding(null);
    setSelectedZone(null);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  // Keyboard Shortcuts (Space for Pause, 1-3 for speed, R for Draft, Esc to Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName?.toLowerCase())) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        simulation.time.speed = simulation.time.speed === 0 ? 1 : 0;
        sound.playClick();
      } else if (e.key === '1') {
        simulation.time.speed = 1;
        sound.playClick();
      } else if (e.key === '2') {
        simulation.time.speed = 2;
        sound.playClick();
      } else if (e.key === '3') {
        simulation.time.speed = 3;
        sound.playClick();
      } else if (e.key === 'Escape') {
        handleClearTool();
        setSelectedEntity(null);
        setShowWorkTab(false);
        setShowTradeModal(false);
        setShowWorldMap(false);
        setShowMultiplayer(false);
        setShowSaveLoad(false);
      } else if (e.key.toLowerCase() === 'r' && selectedEntity && selectedEntity.needs) {
        selectedEntity.isDrafted = !selectedEntity.isDrafted;
        sound.playDraft();
        simulation.addLog(
          `${selectedEntity.nickname} is ${selectedEntity.isDrafted ? 'DRAFTED for combat!' : 'undrafted.'}`
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Main Viewport & Canvas Renderer */}
      <GameCanvas
        selectedBuilding={selectedBuilding}
        selectedZone={selectedZone}
        selectedCropForZone={selectedCropForZone}
        selectedEntity={selectedEntity}
        onSelectEntity={setSelectedEntity}
        onClearTool={handleClearTool}
      />

      {/* 2. Top HUD Navigation */}
      <TopBar
        onOpenWorkTab={() => setShowWorkTab(true)}
        onOpenWorldMap={() => setShowWorldMap(true)}
        onOpenTrade={() => setShowTradeModal(true)}
        onOpenMultiplayer={() => setShowMultiplayer(true)}
        onOpenSaveLoad={() => setShowSaveLoad(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* 3. Bottom HUD Architect & Colonists Bar */}
      <BottomBar
        selectedBuilding={selectedBuilding}
        onSelectBuilding={setSelectedBuilding}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        selectedCropForZone={selectedCropForZone}
        onSelectCropForZone={setSelectedCropForZone}
        selectedEntity={selectedEntity}
        onSelectEntity={setSelectedEntity}
      />

      {/* 4. Entity Inspector (Colonist Health & Needs, Drug Lab Bills) */}
      {selectedEntity && (
        <Inspector entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
      )}

      {/* 5. Modals */}
      {showWorkTab && <WorkTab onClose={() => setShowWorkTab(false)} />}
      {showTradeModal && <TradeModal onClose={() => setShowTradeModal(false)} />}
      {showWorldMap && <WorldMapModal onClose={() => setShowWorldMap(false)} />}
      {showMultiplayer && <MultiplayerModal onClose={() => setShowMultiplayer(false)} />}
      {showSaveLoad && <SaveLoadModal onClose={() => setShowSaveLoad(false)} />}
    </div>
  );
}
