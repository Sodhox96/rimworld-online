import React, { useState } from 'react';
import { X, ArrowRightLeft, Check, Coins } from 'lucide-react';
import { ITEM_INFO } from '../game/constants';
import { simulation } from '../game/simulation';
import { sound } from '../utils/audio';
import { ItemType } from '../types';

interface TradeModalProps {
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ onClose }) => {
  const [colonyTrade, setColonyTrade] = useState<Record<string, number>>({});
  const [traderBuy, setTraderBuy] = useState<Record<string, number>>({});

  // Trader inventory stock available for purchase
  const traderStock: { type: ItemType; price: number; available: number }[] = [
    { type: 'neutroamine', price: 16, available: 20 },
    { type: 'medicine', price: 20, available: 12 },
    { type: 'component', price: 36, available: 15 },
    { type: 'plasteel', price: 14, available: 40 },
    { type: 'simple_meal', price: 16, available: 25 },
  ];

  // Colony goods that can be sold
  const colonySellable: ItemType[] = [
    'smokeleaf_joint',
    'yayo',
    'flake',
    'psychite_tea',
    'smokeleaf_leaves',
    'psychoid_leaves',
    'wood',
    'steel',
  ];

  // Calculate Silver Net Change
  let totalEarnings = 0;
  Object.entries(colonyTrade).forEach(([type, count]) => {
    const item = ITEM_INFO[type as ItemType];
    if (item && count > 0) {
      totalEarnings += item.value * count;
    }
  });

  let totalCost = 0;
  Object.entries(traderBuy).forEach(([type, count]) => {
    const stock = traderStock.find((s) => s.type === type);
    if (stock && count > 0) {
      totalCost += stock.price * count;
    }
  });

  const netSilver = totalEarnings - totalCost;
  const currentSilver = simulation.resources.silver || 0;
  const canAfford = currentSilver + netSilver >= 0;

  const handleSellChange = (type: ItemType, change: number) => {
    const cur = colonyTrade[type] || 0;
    const max = simulation.resources[type] || 0;
    const next = Math.max(0, Math.min(max, cur + change));
    setColonyTrade((prev) => ({ ...prev, [type]: next }));
  };

  const handleBuyChange = (type: ItemType, change: number) => {
    const stock = traderStock.find((s) => s.type === type);
    if (!stock) return;
    const cur = traderBuy[type] || 0;
    const next = Math.max(0, Math.min(stock.available, cur + change));
    setTraderBuy((prev) => ({ ...prev, [type]: next }));
  };

  const handleExecuteTrade = () => {
    if (!canAfford) return;
    sound.playClick();

    // Deduct sold goods
    Object.entries(colonyTrade).forEach(([type, count]) => {
      if (count > 0) {
        simulation.resources[type as ItemType] -= count;
      }
    });

    // Add bought goods
    Object.entries(traderBuy).forEach(([type, count]) => {
      if (count > 0) {
        simulation.resources[type as ItemType] = (simulation.resources[type as ItemType] || 0) + count;
      }
    });

    // Apply silver balance
    simulation.resources.silver += netSilver;

    simulation.addLog(
      `Trade completed with Outlander Caravan. Silver change: ${netSilver >= 0 ? `+${netSilver}` : netSilver}.`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>Trade Caravan Market</span>
            </h2>
            <p className="text-xs text-slate-400">
              Sell high-value manufactured drugs (Smokeleaf, Yayo) to amass Silver and purchase synthetic chemicals & tech components.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Trade Table */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Left Column: Sell Colony Products */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-emerald-400 mb-3 flex items-center justify-between">
              <span>Sell Colony Goods (Drugs & Crops)</span>
              <span className="text-slate-400 font-mono">Total: +{totalEarnings} Silver</span>
            </h3>

            <div className="space-y-2">
              {colonySellable.map((type) => {
                const info = ITEM_INFO[type];
                const owned = simulation.resources[type] || 0;
                const selling = colonyTrade[type] || 0;

                return (
                  <div
                    key={type}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{info.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Owned: {owned} • Price: {info.value} Silver/ea
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={selling <= 0}
                        onClick={() => handleSellChange(type, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-semibold text-emerald-400">{selling}</span>
                      <button
                        disabled={selling >= owned}
                        onClick={() => handleSellChange(type, 1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Buy Merchant Supplies */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-sky-400 mb-3 flex items-center justify-between">
              <span>Buy Trader Supplies (Neutroamine & Parts)</span>
              <span className="text-slate-400 font-mono">Total: -{totalCost} Silver</span>
            </h3>

            <div className="space-y-2">
              {traderStock.map((stock) => {
                const info = ITEM_INFO[stock.type];
                const buying = traderBuy[stock.type] || 0;

                return (
                  <div
                    key={stock.type}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{info.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Available: {stock.available} • Price: {stock.price} Silver/ea
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={buying <= 0}
                        onClick={() => handleBuyChange(stock.type, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-semibold text-sky-400">{buying}</span>
                      <button
                        disabled={buying >= stock.available}
                        onClick={() => handleBuyChange(stock.type, 1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with Balance & Confirmation */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Current Silver: </span>
              <span className="font-bold text-amber-400">{currentSilver}</span>
            </div>
            <div>
              <span className="text-slate-400">Net Balance: </span>
              <span
                className={`font-bold ${
                  netSilver > 0 ? 'text-emerald-400' : netSilver < 0 ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {netSilver >= 0 ? `+${netSilver}` : netSilver} Silver
              </span>
            </div>
          </div>

          <button
            disabled={!canAfford || (totalEarnings === 0 && totalCost === 0)}
            onClick={handleExecuteTrade}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Execute Trade</span>
          </button>
        </div>
      </div>
    </div>
  );
};
