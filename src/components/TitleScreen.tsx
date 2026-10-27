/**
 * Atmospheric Title Screen for Traffic Rider 3D.
 * Prominently features the Rider Profile, Live Leaderboard button,
 * Game Mode, Environment, Day/Night and Weather selectors, and big unmissable "GAADI CHALAO / PLAY NOW" CTA.
 */

import React from 'react';
import {
  Play,
  Wrench,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  MapPin,
  Clock,
  ShieldAlert,
  Sun,
  Sunset,
  Moon,
  CloudRain,
} from 'lucide-react';
import { EnvironmentType, GameMode, PlayerStats, BikeData, TimeOfDay, WeatherType } from '../types';

interface TitleScreenProps {
  playerStats: PlayerStats;
  currentBike: BikeData;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  onOpenNameModal: () => void;
  onSelectMode: (mode: GameMode) => void;
  onSelectEnvironment: (env: EnvironmentType) => void;
  onSelectTimeOfDay: (tod: TimeOfDay) => void;
  onSelectWeather: (weather: WeatherType) => void;
  onToggleAudio: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  playerStats,
  currentBike,
  onStartGame,
  onOpenGarage,
  onOpenLeaderboard,
  onOpenNameModal,
  onSelectMode,
  onSelectEnvironment,
  onSelectTimeOfDay,
  onSelectWeather,
  onToggleAudio,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-6 bg-slate-950/75 select-none overflow-y-auto">
      {/* Top Header: Player Profile, Leaderboard, Balance & Audio */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto gap-2">
        {/* Rider Name & Avatar Button */}
        <button
          onClick={onOpenNameModal}
          className="flex items-center gap-2.5 px-3 py-1.5 md:px-4 md:py-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-500/70 rounded-2xl shadow-lg transition active:scale-95 text-left cursor-pointer"
          title="Click to Change Rider Name"
        >
          <span className="text-xl md:text-2xl">{playerStats.playerAvatar || '🏍️'}</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Rider Profile (Edit)
            </span>
            <span className="text-sm md:text-base font-black text-white leading-tight">
              {playerStats.playerName || 'Rider'}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Live Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-display font-black text-xs md:text-sm tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>LEADERBOARD</span>
          </button>

          {/* Cash Balance */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-950/90 border border-emerald-600/70 rounded-2xl shadow-lg">
            <span className="text-emerald-400 font-extrabold text-lg">$</span>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Cash</span>
              <span className="text-sm font-bold font-mono-numbers text-white leading-none">
                {playerStats.cash.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleAudio}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-2xl text-slate-200 transition active:scale-95 shadow-lg cursor-pointer"
            title="Toggle Sound"
          >
            {playerStats.audioMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Center: Title & Big Start CTA */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-4xl mx-auto py-2">
        {/* Title Lockup */}
        <div className="relative mb-2">
          <svg
            className="w-full max-w-[500px] h-auto drop-shadow-[0_10px_25px_rgba(245,158,11,0.35)]"
            viewBox="0 0 600 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="45%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="60"
              textAnchor="middle"
              className="font-display font-black text-6xl tracking-widest italic"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="8"
            >
              TRAFFIC RIDER
            </text>
            <text
              x="50%"
              y="60"
              textAnchor="middle"
              className="font-display font-black text-6xl tracking-widest italic"
              fill="url(#titleGrad)"
            >
              TRAFFIC RIDER
            </text>
            <rect x="230" y="75" width="140" height="24" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text
              x="300"
              y="91"
              textAnchor="middle"
              className="font-display font-bold text-xs tracking-widest fill-amber-300"
            >
              HIGHWAY RACING 3D
            </text>
          </svg>
        </div>

        {/* Selected Bike Display & Garage CTA */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 mb-3 shadow-xl">
          <div
            className="w-3.5 h-10 rounded-full"
            style={{ backgroundColor: playerStats.bikeColors[currentBike.id] || currentBike.color }}
          />
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">
              Selected Bike
            </span>
            <span className="text-base font-bold text-white leading-tight">
              {currentBike.name}
            </span>
            <span className="text-[11px] text-slate-400">
              Max {currentBike.topSpeedKmh} KM/H · {currentBike.category}
            </span>
          </div>

          <button
            onClick={onOpenGarage}
            className="ml-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>GARAGE / SKINS</span>
          </button>
        </div>

        {/* Game Mode Selector */}
        <div className="flex flex-col gap-1.5 w-full max-w-lg mb-3">
          <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 text-left pl-1">
            Highway Traffic Mode:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: 'endless-oneway' as GameMode,
                name: 'One-Way',
                desc: 'Classic Highway Flow',
                icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
              },
              {
                id: 'endless-twoway' as GameMode,
                name: 'Two-Way',
                desc: 'Oncoming Traffic Thrill',
                icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
              },
              {
                id: 'time-attack' as GameMode,
                name: 'Time Attack',
                desc: 'Survive the Clock',
                icon: <Clock className="w-3.5 h-3.5 text-sky-400" />,
              },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition active:scale-95 cursor-pointer ${
                  playerStats.selectedMode === m.id
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  {m.icon}
                  <span>{m.name}</span>
                </div>
                <span className="text-[9px] text-slate-400 leading-none">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Day-Night System & Weather (Barish) Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mb-4">
          {/* Time of Day */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 text-left pl-1 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Time of Day:</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'day' as TimeOfDay, name: 'Day', icon: '☀️' },
                { id: 'sunset' as TimeOfDay, name: 'Sunset', icon: '🌅' },
                { id: 'night' as TimeOfDay, name: 'Night', icon: '🌙' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTimeOfDay(t.id)}
                  className={`py-1.5 px-1 rounded-xl border text-center font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                    playerStats.timeOfDay === t.id
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Weather System (Barish) */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-400 text-left pl-1 flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-sky-400" />
              <span>Weather (Mausam):</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'clear' as WeatherType, name: 'Clear Sky', icon: '🌤️' },
                { id: 'rain' as WeatherType, name: 'Barish (Rain)', icon: '🌧️' },
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => onSelectWeather(w.id)}
                  className={`py-1.5 px-1 rounded-xl border text-center font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                    playerStats.weather === w.id
                      ? 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-sm'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span>{w.icon}</span>
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MASSIVE UNMISSABLE START / GAADI CHALAO CTA */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-md">
          <button
            onClick={onStartGame}
            className="w-full py-4 px-8 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 border-2 border-yellow-300 text-slate-950 font-display font-black text-2xl md:text-3xl tracking-wider rounded-2xl shadow-2xl shadow-orange-500/50 transition active:scale-95 flex items-center justify-center gap-3 cursor-pointer animate-pulse"
          >
            <Play className="w-8 h-8 fill-slate-950" />
            <span>GAADI CHALAO / PLAY ▶</span>
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Keyboard: Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">Enter</kbd> to Start
          </span>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="text-center text-xs text-slate-400 tracking-wider">
        <span className="text-slate-300 font-semibold">W / ↑</span> Gas ·{' '}
        <span className="text-slate-300 font-semibold">S / ↓</span> Brake ·{' '}
        <span className="text-slate-300 font-semibold">A / D</span> Steer ·{' '}
        <span className="text-slate-300 font-semibold">Space</span> Wheelie ·{' '}
        <span className="text-slate-300 font-semibold">H</span> Horn
      </div>
    </div>
  );
};
