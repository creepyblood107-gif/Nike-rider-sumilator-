/**
 * Cockpit HUD Overlay for Traffic Rider 3D.
 * World-matched, low-occlusion UI keeping >85% of viewport clear.
 * Displays rider name, digital speed, distance, combo multipliers, close-call popups,
 * Day/Night and Weather toggles, and ergonomic on-screen mobile/touch pedals.
 */

import React, { useState } from 'react';
import {
  Pause,
  Camera,
  Volume2,
  VolumeX,
  Trophy,
  Flame,
  Clock,
  Compass,
} from 'lucide-react';
import { GameTelemetry, BonusNotification, GameMode, TimeOfDay, WeatherType } from '../types';

interface CockpitOverlayProps {
  playerName: string;
  playerAvatar: string;
  telemetry: GameTelemetry;
  activeBonuses: BonusNotification[];
  gameMode: GameMode;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  onToggleTimeOfDay: () => void;
  onToggleWeather: () => void;
  onPause: () => void;
  onToggleCamera: () => void;
  onOpenLeaderboard: () => void;
  onMuteToggle: () => void;
  isMuted: boolean;
  onThrottle: (active: boolean) => void;
  onBrake: (active: boolean) => void;
  onSteer: (val: number) => void;
  onWheelie: (active: boolean) => void;
  onHorn: (active: boolean) => void;
  wheelieCapable: boolean;
}

export const CockpitOverlay: React.FC<CockpitOverlayProps> = ({
  playerName,
  playerAvatar,
  telemetry,
  activeBonuses,
  gameMode,
  timeOfDay,
  weather,
  onToggleTimeOfDay,
  onToggleWeather,
  onPause,
  onToggleCamera,
  onOpenLeaderboard,
  onMuteToggle,
  isMuted,
  onThrottle,
  onBrake,
  onSteer,
  onWheelie,
  onHorn,
  wheelieCapable,
}) => {
  const [steerState, setSteerState] = useState<'left' | 'right' | null>(null);

  const handleSteerPress = (dir: 'left' | 'right') => {
    setSteerState(dir);
    onSteer(dir === 'left' ? -1 : 1);
  };

  const handleSteerRelease = () => {
    setSteerState(null);
    onSteer(0);
  };

  const km = (telemetry.distanceMeters / 1000).toFixed(2);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-4 select-none">
      {/* TOP PERIMETER HUD BAR */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Rider Profile & Score */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Rider Name Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/85 border border-slate-700/80 rounded-xl shadow-lg">
            <span className="text-base">{playerAvatar || '🏍️'}</span>
            <span className="text-xs font-bold text-amber-300">{playerName}</span>
          </div>

          {/* Score Counter */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
              <span className="text-lg font-bold font-mono-numbers text-white leading-tight">
                {telemetry.score.toLocaleString()}
              </span>
            </div>
            {telemetry.comboCount > 1 && (
              <div className="ml-1.5 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 rounded-md text-[10px] font-black text-black tracking-wider animate-bounce flex items-center gap-1">
                <Flame className="w-3 h-3 fill-black" />
                x{telemetry.comboCount}
              </div>
            )}
          </div>

          {/* Cash counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-700/50 rounded-lg text-emerald-400 text-xs font-bold font-mono-numbers w-fit">
            <span>$</span>
            <span>+{telemetry.cashEarned}</span>
          </div>
        </div>

        {/* Center: Close Call / Bonus Banner Popups & Career / Time Attack Progress */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
          {gameMode === 'career' && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-display font-black text-xs md:text-sm rounded-full shadow-lg tracking-wider">
                  LEVEL {telemetry.careerLevel || 1} / 500
                </div>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-lg font-mono-numbers text-xs md:text-sm font-black ${
                    telemetry.timeRemaining <= 10
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-slate-900/90 border-amber-500/60 text-amber-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{telemetry.timeRemaining}s</span>
                </div>
              </div>

              {/* Progress bar towards finish line */}
              {telemetry.targetDistance && (
                <div className="flex flex-col items-center w-48 md:w-56 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1 shadow-lg">
                  <div className="flex items-center justify-between w-full text-[9px] font-bold text-slate-300 font-mono-numbers mb-0.5">
                    <span>{Math.min(telemetry.targetDistance, Math.round(telemetry.distanceMeters))}m</span>
                    <span className="text-amber-400 font-extrabold">{telemetry.targetDistance}m FINISH</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-150"
                      style={{
                        width: `${Math.min(
                          100,
                          (telemetry.distanceMeters / telemetry.targetDistance) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  {telemetry.targetOvertakes ? (
                    <span
                      className={`text-[8px] font-bold mt-0.5 ${
                        telemetry.closeOvertakes >= telemetry.targetOvertakes
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {telemetry.closeOvertakes >= telemetry.targetOvertakes ? '✓ ' : ''}
                      {telemetry.closeOvertakes} / {telemetry.targetOvertakes} Close Calls
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {gameMode === 'time-attack' && (
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-lg font-mono-numbers text-lg font-black ${
                telemetry.timeRemaining <= 10
                  ? 'bg-rose-950/90 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-900/80 border-amber-500/60 text-amber-300'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{telemetry.timeRemaining}s</span>
            </div>
          )}

          {/* Bonus notifications feed */}
          <div className="flex flex-col items-center gap-1.5 mt-1 min-h-[4rem]">
            {activeBonuses.slice(-2).map((b) => (
              <div
                key={b.id}
                className="animate-bonus px-4 py-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 border border-yellow-300 text-slate-950 rounded-xl font-display font-black text-xs md:text-sm tracking-wider uppercase shadow-xl flex items-center gap-2"
              >
                <span>{b.text}</span>
                <span className="bg-black/80 text-amber-300 px-2 py-0.5 rounded text-xs">
                  +{b.pts}
                </span>
                {b.timeBonus && (
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs">
                    +{b.timeBonus}s
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Distance & Live Controls (Day/Night, Rain, Leaderboard, Camera, Audio, Pause) */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Distance Meter */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg">
            <Compass className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Distance</span>
              <span className="text-lg font-bold font-mono-numbers text-sky-400 leading-tight">
                {km} <span className="text-xs text-slate-300">KM</span>
              </span>
            </div>
          </div>

          {/* Weather & Time Controls */}
          <div className="flex items-center gap-1.5">
            {/* Time of Day Cycle */}
            <button
              onClick={onToggleTimeOfDay}
              title={`Time: ${timeOfDay.toUpperCase()} (Tap to toggle)`}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/60 text-amber-300 transition active:scale-95 text-xs font-bold flex items-center gap-1 shadow-lg cursor-pointer"
            >
              <span>{timeOfDay === 'day' ? '☀️' : timeOfDay === 'sunset' ? '🌅' : '🌙'}</span>
              <span className="text-[10px] font-extrabold uppercase">{timeOfDay}</span>
            </button>

            {/* Weather Rain Toggle */}
            <button
              onClick={onToggleWeather}
              title={`Weather: ${weather.toUpperCase()} (Tap to toggle rain)`}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-lg cursor-pointer ${
                weather === 'rain'
                  ? 'bg-blue-950/90 border-blue-400 text-blue-300 shadow-blue-500/30'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <span>{weather === 'rain' ? '🌧️' : '🌤️'}</span>
              <span className="text-[10px] font-extrabold uppercase">{weather === 'rain' ? 'Rain' : 'Clear'}</span>
            </button>
          </div>

          {/* Action Buttons: Leaderboard, Audio, Camera, Pause */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenLeaderboard}
              title="Open Leaderboard"
              className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/70 text-amber-400 hover:bg-slate-800 transition active:scale-95"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              onClick={onMuteToggle}
              title="Toggle Audio"
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onToggleCamera}
              title="Toggle Camera POV (C)"
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
            >
              <Camera className="w-4 h-4 text-sky-400" />
            </button>
            <button
              onClick={onPause}
              title="Pause Game (Esc)"
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
            >
              <Pause className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER ACCELERATION HINT WHEN STOPPED */}
      {telemetry.speedKmh < 5 && !telemetry.isBraking && (
        <div className="flex flex-col items-center justify-center mt-2 mb-auto pointer-events-none">
          <div className="px-4 py-2 bg-slate-900/85 border border-emerald-400/80 rounded-2xl shadow-2xl text-center flex items-center gap-2.5 backdrop-blur-xs">
            <span className="text-xl animate-bounce">⚡</span>
            <div className="flex flex-col text-left">
              <span className="font-display font-black text-emerald-300 text-sm tracking-wide">
                PRESS 'GAS' OR 'W' / '↑' TO DRIVE
              </span>
              <span className="text-[10px] text-slate-300 font-semibold">
                Gaadi aage badhane ke liye GAS dabayein!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CENTER STATUS ALERTS */}
      <div className="flex justify-between items-center w-full px-4 pointer-events-none">
        {telemetry.speedKmh >= 100 ? (
          <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-300 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>HIGH SPEED BONUS</span>
          </div>
        ) : <div />}

        {telemetry.oncomingLane && (
          <div className="px-3 py-1 bg-rose-500/25 border border-rose-500/60 rounded-lg text-rose-300 text-xs font-bold tracking-wider uppercase animate-pulse flex items-center gap-1.5">
            <span>⚠ ONCOMING TRAFFIC LANE</span>
          </div>
        )}
      </div>

      {/* BOTTOM TOUCH CONTROLS CLUSTER (Ergonomic, low-profile, never occludes handlebars/gauges) */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-end w-full px-2 pb-1">
          {/* Left Controls: Steering & Horn */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Steer Left */}
            <button
              onPointerDown={() => handleSteerPress('left')}
              onPointerUp={handleSteerRelease}
              onPointerLeave={handleSteerRelease}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition active:scale-90 shadow-xl select-none ${
                steerState === 'left'
                  ? 'bg-sky-500 border-sky-300 text-white shadow-sky-500/50'
                  : 'bg-slate-900/85 border-slate-700/80 text-slate-200 active:bg-sky-600'
              }`}
            >
              <span className="text-xl leading-none">◀</span>
              <span className="text-[8px] uppercase font-extrabold tracking-wider mt-0.5">LEFT</span>
            </button>

            {/* Steer Right */}
            <button
              onPointerDown={() => handleSteerPress('right')}
              onPointerUp={handleSteerRelease}
              onPointerLeave={handleSteerRelease}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition active:scale-90 shadow-xl select-none ${
                steerState === 'right'
                  ? 'bg-sky-500 border-sky-300 text-white shadow-sky-500/50'
                  : 'bg-slate-900/85 border-slate-700/80 text-slate-200 active:bg-sky-600'
              }`}
            >
              <span className="text-xl leading-none">▶</span>
              <span className="text-[8px] uppercase font-extrabold tracking-wider mt-0.5">RIGHT</span>
            </button>

            {/* Horn Button */}
            <button
              onPointerDown={() => onHorn(true)}
              onPointerUp={() => onHorn(false)}
              onPointerLeave={() => onHorn(false)}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center text-xs font-black border-2 transition active:scale-90 shadow-xl select-none ${
                telemetry.isHornActive
                  ? 'bg-amber-500 border-yellow-300 text-slate-950 shadow-amber-500/50'
                  : 'bg-slate-900/85 border-slate-700/80 text-amber-400'
              }`}
            >
              <span className="text-sm leading-none">📢</span>
              <span className="text-[8px] tracking-wider mt-0.5">HORN</span>
            </button>
          </div>

          {/* Right Controls: Brake, Wheelie, Gas */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Brake Pedal */}
            <button
              onPointerDown={() => onBrake(true)}
              onPointerUp={() => onBrake(false)}
              onPointerLeave={() => onBrake(false)}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition active:scale-90 shadow-xl select-none ${
                telemetry.isBraking
                  ? 'bg-rose-600 border-rose-300 text-white shadow-rose-600/50'
                  : 'bg-slate-900/85 border-rose-900/70 text-rose-400 active:bg-rose-700'
              }`}
            >
              <span className="text-base leading-none">🛑</span>
              <span className="text-[9px] uppercase font-black tracking-wider mt-0.5">BRAKE</span>
            </button>

            {/* Wheelie Button */}
            {wheelieCapable && (
              <button
                onPointerDown={() => onWheelie(true)}
                onPointerUp={() => onWheelie(false)}
                onPointerLeave={() => onWheelie(false)}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center text-[9px] font-black border-2 transition active:scale-90 shadow-xl select-none ${
                  telemetry.isWheelie
                    ? 'bg-purple-600 border-purple-300 text-white shadow-purple-600/50'
                    : 'bg-slate-900/85 border-purple-800/60 text-purple-400'
                }`}
              >
                <span className="text-sm leading-none">⚡</span>
                <span className="text-[8px] tracking-wider mt-0.5">WHEELIE</span>
              </button>
            )}

            {/* GAS / ACCELERATOR PEDAL */}
            <button
              onPointerDown={() => onThrottle(true)}
              onPointerUp={() => onThrottle(false)}
              onPointerLeave={() => onThrottle(false)}
              className="w-18 h-18 md:w-22 md:h-22 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-t from-emerald-600 to-teal-400 active:from-emerald-700 active:to-teal-500 border-2 border-emerald-200 text-white font-black shadow-xl shadow-emerald-500/30 transition active:scale-90 cursor-pointer select-none"
            >
              <span className="text-2xl leading-none">⚡</span>
              <span className="text-[11px] md:text-xs tracking-wider uppercase font-extrabold mt-0.5">
                GAS
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Keyboard Controls Footer */}
        <div className="hidden md:flex justify-center items-center py-1 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 tracking-wider">
          <span className="font-semibold text-slate-300">W / ↑</span> Gas ·{' '}
          <span className="font-semibold text-slate-300">S / ↓</span> Brake ·{' '}
          <span className="font-semibold text-slate-300">A / D</span> Steer ·{' '}
          <span className="font-semibold text-slate-300">Space</span> Wheelie ·{' '}
          <span className="font-semibold text-slate-300">H</span> Horn ·{' '}
          <span className="font-semibold text-slate-300">C</span> Camera ·{' '}
          <span className="font-semibold text-slate-300">Esc</span> Pause
        </div>
      </div>
    </div>
  );
};
