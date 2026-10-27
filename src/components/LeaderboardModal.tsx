import React, { useState } from 'react';
import { Trophy, X, Flame, Gauge, Compass, Medal, Play } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  currentPlayerName: string;
  currentPlayerScore: number;
  onClose: () => void;
  onPlayNow: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  currentPlayerName,
  currentPlayerScore,
  onClose,
  onPlayNow,
}) => {
  const [tab, setTab] = useState<'all' | 'today'>('all');

  const filteredEntries = tab === 'today'
    ? entries.filter((e) => e.date === 'Today' || e.date === 'Just now')
    : entries;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 select-none animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Rankings
              </span>
              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-wider">
                LIVE HIGHWAY LEADERBOARD
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              tab === 'all'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All-Time Records
          </button>
          <button
            onClick={() => setTab('today')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              tab === 'today'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Today's Speed Kings
          </button>
        </div>

        {/* Leaderboard Table List */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[50vh] scrollbar-thin">
          {filteredEntries.map((entry, idx) => {
            const isSelf =
              entry.isCurrentPlayer ||
              entry.name.toLowerCase() === currentPlayerName.toLowerCase();
            const rank = idx + 1;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isSelf
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Rank & Rider */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-sm ${
                      rank === 1
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                        : rank === 2
                        ? 'bg-slate-300 text-black'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm ${isSelf ? 'text-amber-300' : 'text-white'}`}>
                        {entry.name}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-500 text-black font-extrabold rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{entry.bikeName}</span>
                  </div>
                </div>

                {/* Right: Stats & Score */}
                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Top Speed</span>
                    <span className="text-xs font-bold font-mono-numbers text-sky-400">
                      {entry.topSpeedKmh} KM/H
                    </span>
                  </div>

                  <div className="hidden sm:flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Distance</span>
                    <span className="text-xs font-bold font-mono-numbers text-slate-300">
                      {entry.distanceKm.toFixed(1)} KM
                    </span>
                  </div>

                  <div className="flex flex-col min-w-[70px]">
                    <span className="text-[10px] text-amber-400 uppercase font-extrabold tracking-wider">
                      Score
                    </span>
                    <span className="text-base font-black font-mono-numbers text-amber-300">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Your Best Score</span>
            <span className="text-lg font-black font-mono-numbers text-amber-400">
              {currentPlayerScore.toLocaleString()} PTS
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onPlayNow();
            }}
            className="py-3 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-display font-black text-sm tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>GAADI CHALAO ▶</span>
          </button>
        </div>
      </div>
    </div>
  );
};
