import React, { useState } from 'react';
import { X, Lock, Star, ChevronLeft, ChevronRight, Zap, Trophy, Compass, Clock, Flame } from 'lucide-react';
import { getCareerLevelConfig, TOTAL_CAREER_LEVELS } from '../game/CareerLevels';

interface LevelSelectModalProps {
  currentLevel: number;
  maxUnlockedLevel: number;
  careerStars: Record<number, number>;
  onSelectLevel: (level: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevel,
  maxUnlockedLevel,
  careerStars,
  onSelectLevel,
  onClose,
}) => {
  // Current active chapter (1 to 10, each chapter has 50 levels)
  const [selectedChapter, setSelectedChapter] = useState<number>(() =>
    Math.min(10, Math.floor((currentLevel - 1) / 50) + 1)
  );

  const [searchLevelInput, setSearchLevelInput] = useState<string>('');

  const startLevel = (selectedChapter - 1) * 50 + 1;
  const endLevel = Math.min(TOTAL_CAREER_LEVELS, selectedChapter * 50);
  const chapterLevels: number[] = [];
  for (let l = startLevel; l <= endLevel; l++) {
    chapterLevels.push(l);
  }

  // Calculate total stars earned across all 500 levels
  const totalStarsEarned = Object.values(careerStars).reduce((sum, s) => sum + s, 0);

  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(searchLevelInput.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= TOTAL_CAREER_LEVELS) {
      if (parsed <= maxUnlockedLevel) {
        onSelectLevel(parsed);
      } else {
        // Jump to the chapter containing that level
        setSelectedChapter(Math.floor((parsed - 1) / 50) + 1);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-slate-950 fill-black" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-wider">
                  CAREER LEVELS (1 - {TOTAL_CAREER_LEVELS})
                </h2>
                <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/50 rounded-full text-[11px] font-extrabold text-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{totalStarsEarned} Stars</span>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                Unlocked: Level {maxUnlockedLevel} / {TOTAL_CAREER_LEVELS} · Distance & Traffic Speed scale as you advance!
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter Navigation Tabs */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedChapter((c) => Math.max(1, c - 1))}
            disabled={selectedChapter === 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((ch) => {
              const chStart = (ch - 1) * 50 + 1;
              const chEnd = ch * 50;
              const isUnlocked = maxUnlockedLevel >= chStart;
              const isActive = selectedChapter === ch;

              return (
                <button
                  key={ch}
                  onClick={() => setSelectedChapter(ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                      : isUnlocked
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60'
                      : 'bg-slate-950/60 text-slate-500 border border-slate-800/40 opacity-60'
                  }`}
                >
                  {!isUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
                  <span>Ch.{ch}</span>
                  <span className="text-[10px] opacity-80">({chStart}-{chEnd})</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedChapter((c) => Math.min(10, c + 1))}
            disabled={selectedChapter === 10}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter Title & Quick Jump Bar */}
        <div className="px-5 py-2.5 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
              {getCareerLevelConfig(startLevel).chapterTitle}
            </span>
          </div>

          <form onSubmit={handleQuickJump} className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={TOTAL_CAREER_LEVELS}
              value={searchLevelInput}
              onChange={(e) => setSearchLevelInput(e.target.value)}
              placeholder="Jump to Level (1-500)"
              className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 w-36 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition"
            >
              GO
            </button>
          </form>
        </div>

        {/* 50 Level Cards Grid for Active Chapter */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {chapterLevels.map((lvl) => {
            const config = getCareerLevelConfig(lvl);
            const isUnlocked = lvl <= maxUnlockedLevel;
            const isCurrent = lvl === currentLevel;
            const stars = careerStars[lvl] || 0;

            return (
              <button
                key={lvl}
                disabled={!isUnlocked}
                onClick={() => onSelectLevel(lvl)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition relative overflow-hidden select-none ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                    : isUnlocked
                    ? 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-700/80 text-white cursor-pointer active:scale-95 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                {/* Level Number & Status */}
                <div className="flex items-start justify-between w-full mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">LVL</span>
                    <span
                      className={`text-xl font-display font-black leading-none ${
                        isCurrent ? 'text-amber-300' : isUnlocked ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {lvl}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>

                {/* Level Environment & Weather Badge */}
                <div className="flex items-center gap-1 text-[10px] text-slate-300 font-semibold mb-1.5">
                  <span>{config.weather === 'rain' ? '🌧️' : config.timeOfDay === 'night' ? '🌙' : '☀️'}</span>
                  <span className="capitalize">{config.environment}</span>
                  {config.twoWay && (
                    <span className="ml-auto text-[8px] px-1 py-0.2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded font-black">
                      2-WAY
                    </span>
                  )}
                </div>

                {/* Target Specs */}
                <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Compass className="w-2.5 h-2.5 text-sky-400" />
                      <span>{config.targetDistanceMeters}m</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono-numbers text-amber-300 font-bold">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{config.timeLimitSeconds}s</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] mt-0.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 text-orange-400" />
                      <span>{config.minOvertakes} Close</span>
                    </span>
                    <span className="text-emerald-400 font-bold font-mono-numbers">
                      +${config.rewardCash}
                    </span>
                  </div>
                </div>

                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    CURRENT
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Speed & Traffic scale with distance covered!</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
