/**
 * Garage & Motorbike Showroom for Traffic Rider 3D.
 * Allows browsing bikes, comparing top speed, acceleration, handling, and braking,
 * customizing paint swatches, purchasing new bikes, and selecting active ride.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Lock,
  Zap,
  Gauge,
  Sliders,
  Shield,
  Palette,
  Play,
} from 'lucide-react';
import { BikeData, BikeId, PlayerStats } from '../types';
import { MOTORBIKES } from '../data/bikes';
import { soundEngine } from '../audio/SoundEffects';

interface GarageScreenProps {
  playerStats: PlayerStats;
  onSelectBike: (bikeId: BikeId) => void;
  onBuyBike: (bikeId: BikeId, price: number) => boolean;
  onUpdateBikeColor: (bikeId: BikeId, colorHex: string) => void;
  onBack: () => void;
  onTestRide: () => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  playerStats,
  onSelectBike,
  onBuyBike,
  onUpdateBikeColor,
  onBack,
  onTestRide,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const idx = MOTORBIKES.findIndex((b) => b.id === playerStats.selectedBikeId);
    return idx >= 0 ? idx : 0;
  });

  const bike = MOTORBIKES[selectedIdx];
  const isUnlocked = playerStats.unlockedBikes.includes(bike.id);
  const isSelected = playerStats.selectedBikeId === bike.id;
  const currentColor = playerStats.bikeColors[bike.id] || bike.color;

  const handleNextBike = () => {
    soundEngine.playClick();
    setSelectedIdx((prev) => (prev + 1) % MOTORBIKES.length);
  };

  const handlePrevBike = () => {
    soundEngine.playClick();
    setSelectedIdx((prev) => (prev - 1 + MOTORBIKES.length) % MOTORBIKES.length);
  };

  const handleColorPick = (hex: string) => {
    soundEngine.playClick();
    onUpdateBikeColor(bike.id, hex);
  };

  const handleAction = () => {
    if (isUnlocked) {
      soundEngine.playClick();
      onSelectBike(bike.id);
    } else {
      const success = onBuyBike(bike.id, bike.price);
      if (success) {
        soundEngine.playChime(880, 0.25);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 bg-slate-950/95 text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition active:scale-95 text-sm font-bold shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="px-5 py-2 bg-emerald-950/90 border border-emerald-600/70 rounded-2xl flex items-center gap-2 shadow-lg">
            <span className="text-emerald-400 font-extrabold text-xl">$</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Your Cash</span>
              <span className="text-lg font-bold font-mono-numbers text-white leading-none">
                {playerStats.cash.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Garage Stage */}
      <div className="flex flex-col items-center justify-center max-w-5xl w-full mx-auto my-auto gap-6">
        {/* Bike Title & Tagline with Carousel Arrows */}
        <div className="flex items-center justify-between w-full max-w-2xl px-4">
          <button
            onClick={handlePrevBike}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 flex items-center justify-center text-xl text-slate-200 transition active:scale-95 shadow-xl"
          >
            ◀
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              {bike.category} · {selectedIdx + 1} of {MOTORBIKES.length}
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-wider mt-1">
              {bike.name}
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-md">{bike.tagline}</p>
          </div>

          <button
            onClick={handleNextBike}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 flex items-center justify-center text-xl text-slate-200 transition active:scale-95 shadow-xl"
          >
            ▶
          </button>
        </div>

        {/* 3D Visual Centerpiece Representation (Showroom Pedestal) */}
        <div className="relative w-full max-w-md h-40 flex items-center justify-center">
          {/* Radial Showroom Floor Light */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-colors duration-500"
            style={{ backgroundColor: currentColor }}
          />

          {/* Bike Silhouette Representation */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className="w-48 h-20 rounded-3xl border-4 shadow-2xl flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: currentColor,
                borderColor: '#ffffff',
                boxShadow: `0 0 40px ${currentColor}88`,
              }}
            >
              <span className="font-display font-black text-2xl tracking-widest text-black/90">
                {bike.name.split(' ')[0]}
              </span>
            </div>
            {/* Showroom Platform */}
            <div className="w-64 h-3 bg-gradient-to-r from-transparent via-slate-500/80 to-transparent rounded-full mt-3 blur-xs" />
          </div>
        </div>

        {/* Specifications Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
          {/* Top Speed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span>Top Speed</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono-numbers text-sky-400">{bike.topSpeedKmh}</span>
              <span className="text-xs text-slate-400 font-bold">KM/H</span>
            </div>
            {/* Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full"
                style={{ width: `${(bike.topSpeedKmh / 300) * 100}%` }}
              />
            </div>
          </div>

          {/* Acceleration */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Acceleration</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono-numbers text-amber-400">
                {(bike.accelerationFactor * 10).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-bold">PTS</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${(bike.accelerationFactor / 2.2) * 100}%` }}
              />
            </div>
          </div>

          {/* Handling */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Handling</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono-numbers text-emerald-400">
                {(bike.handlingFactor * 10).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-bold">PTS</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${(bike.handlingFactor / 1.5) * 100}%` }}
              />
            </div>
          </div>

          {/* Braking */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>Braking</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono-numbers text-rose-400">
                {(bike.brakingFactor * 10).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-bold">PTS</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full"
                style={{ width: `${(bike.brakingFactor / 1.6) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Paint Customizer Swatches */}
        <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Paint Finish:</span>
          </div>
          <div className="flex items-center gap-2.5">
            {bike.availableColors.map((colorHex) => (
              <button
                key={colorHex}
                onClick={() => handleColorPick(colorHex)}
                style={{ backgroundColor: colorHex }}
                className={`w-7 h-7 rounded-full border-2 transition active:scale-90 flex items-center justify-center ${
                  currentColor === colorHex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                }`}
              >
                {currentColor === colorHex && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons (Unlock / Select & Test Ride) */}
        <div className="flex items-center gap-4 w-full max-w-md">
          {isUnlocked ? (
            <button
              onClick={handleAction}
              className={`flex-1 py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wider transition active:scale-95 shadow-xl flex items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-emerald-600 text-white border border-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-5 h-5 text-white stroke-[3]" />
                  <span>SELECTED BIKE</span>
                </>
              ) : (
                <span>SELECT BIKE</span>
              )}
            </button>
          ) : (
            <button
              onClick={handleAction}
              disabled={playerStats.cash < bike.price}
              className={`flex-1 py-4 px-6 rounded-2xl font-display font-black text-lg tracking-wider transition active:scale-95 shadow-xl flex items-center justify-center gap-2 ${
                playerStats.cash >= bike.price
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-yellow-300'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>BUY FOR ${bike.price.toLocaleString()}</span>
            </button>
          )}

          {/* Test Ride Button */}
          <button
            onClick={() => {
              if (isUnlocked) onSelectBike(bike.id);
              onTestRide();
            }}
            className="py-4 px-6 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white font-display font-black text-lg tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RIDE</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Upgrade your fleet and challenge high-speed traffic runs with the Falcon Hayabusa 1300!
      </div>
    </div>
  );
};
