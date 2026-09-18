import React, { useState, useEffect } from 'react';
import { X, Users, MessageSquare, Send, Wifi, Radio, ShieldCheck } from 'lucide-react';
import { signalRService, CoOpEvent } from '../services/signalr';
import { MultiplayerPeer } from '../types';

interface MultiplayerModalProps {
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({ onClose }) => {
  const [roomInput, setRoomInput] = useState(signalRService.getRoomCode());
  const [chatText, setChatText] = useState('');
  const [peers, setPeers] = useState<MultiplayerPeer[]>(signalRService.getPeers());
  const [events, setEvents] = useState<CoOpEvent[]>(signalRService.getEventHistory());

  useEffect(() => {
    const unsubPeers = signalRService.onPeersChange((newPeers) => {
      setPeers(newPeers);
    });

    const unsubEvents = signalRService.onEvent((_newEvent) => {
      setEvents([...signalRService.getEventHistory()]);
    });

    return () => {
      unsubPeers();
      unsubEvents();
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    signalRService.broadcastEvent({
      type: 'chat_message',
      payload: { text: chatText.trim() },
    });

    setChatText('');
  };

  const handleJoinRoom = () => {
    if (roomInput.trim()) {
      signalRService.setRoomCode(roomInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-400" />
              <span>SignalR Co-op Multiplayer Hub</span>
            </h2>
            <p className="text-xs text-slate-400">
              Synchronize colony blueprints, shared drug synthesis jobs, and defense operations across real-time SignalR rooms.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Frequency Controls & Status */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sector Channel:</span>
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-sky-400 focus:outline-none focus:border-sky-400 uppercase w-36"
            />
            <button
              onClick={handleJoinRoom}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium"
            >
              Switch Room
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-600/40">
            <Wifi className="w-3.5 h-3.5" />
            <span>SignalR Hub Connected</span>
          </div>
        </div>

        {/* 2-Column: Connected Overseers & Live Event Stream */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Overseers Roster */}
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Active Overseers ({peers.length})</span>
            </h3>

            <div className="space-y-2">
              {peers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-medium text-slate-200">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Sync OK</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Co-op Event Stream & Chat */}
          <div className="md:col-span-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex flex-col h-72">
            <h3 className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Real-Time Co-Op Feed & Comms</span>
            </h3>

            {/* Event Log list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
              {events.length > 0 ? (
                events.map((ev) => (
                  <div key={ev.id} className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-500">[{ev.timestamp}] </span>
                    <span className="font-semibold text-sky-400">{ev.senderName}: </span>
                    <span className="text-slate-300">
                      {ev.type === 'chat_message'
                        ? ev.payload.text
                        : ev.type === 'drug_crafted'
                        ? `Synthesized drug [${ev.payload.drug}]`
                        : `Issued co-op action [${ev.type}]`}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic p-2">No messages in sector frequency yet.</p>
              )}
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Broadcast co-op message or directive..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
