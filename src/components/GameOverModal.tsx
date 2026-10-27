import React from 'react';
import {
  RotateCcw,
  Wrench,
  Home,
  Trophy,
  Gauge,
  Compass,
  Flame,
  Clock,
  Star,
  ChevronRight,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface GameOverModalProps {
  playerName: string;
  stats: {
    score: number;
    cash: number;
    distanceMeters: number;
    closeOvertakes: number;
    maxSpeedKmh: number;
    highSpeedSeconds: number;
    isCareer?: boolean;
    careerWon?: boolean;
    careerStars?: number;
    careerLevelNumber?: number;
    failReason?: 'crashed' | 'timeout';
    targetDistanceMeters?: number;
    targetOvertakes?: number;
    rewardCash?: number;
  };
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onNextLevel?: () => void;
  onSelectLevel?: () => void;
  onOpenLeaderboard: () => void;
  onGarage: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  playerName,
  stats,
  isNewHighScore,
  onPlayAgain,
  onNextLevel,
  onSelectLevel,
  onOpenLeaderboard,
  onGarage,
  onHome,
}) => {
  const km = (stats.distanceMeters / 1000).toFixed(2);
  const isCareer = stats.isCareer;
  const isWon = isCareer && stats.careerWon;

  const targetDist = stats.targetDistanceMeters || 1000;
  const distanceRemaining = Math.max(0, targetDist - stats.distanceMeters);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-6 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4 text-center">
        {/* Banner */}
        <div className="flex flex-col items-center">
          {isCareer ? (
            isWon ? (
              <div className="flex flex-col items-center">
                <div className="px-4 py-1 bg-emerald-500/20 border border-emerald-400/60 rounded-full text-emerald-300 text-xs font-black tracking-widest uppercase mb-1 flex items-center gap-1.5 shadow-lg">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VICTORY · LEVEL {stats.careerLevelNumber} PASSED!</span>
                </div>
                <h2 className="text-3xl font-display font-black text-white tracking-wider">
                  MISSION ACCOMPLISHED
                </h2>

                {/* Star Ratings */}
                <div className="flex items-center gap-2 my-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`p-2 rounded-2xl border transition transform ${
                        s <= (stats.careerStars || 1)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-400 scale-110 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-950/50 border-slate-800 text-slate-700'
                      }`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= (stats.careerStars || 1) ? 'fill-amber-400' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="px-4 py-1 bg-rose-500/20 border border-rose-500/60 rounded-full text-rose-300 text-xs font-black tracking-widest uppercase mb-1 flex items-center gap-1.5 shadow-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    LEVEL {stats.careerLevelNumber} FAILED ·{' '}
                    {stats.failReason === 'timeout' ? 'OUT OF TIME' : 'CRASHED'}
                  </span>
                </div>
                <h2 className="text-3xl font-display font-black text-white tracking-wider">
                  TRY AGAIN
                </h2>
                <span className="text-xs text-rose-400 font-bold mt-1">
                  {distanceRemaining > 0
                    ? `Only ${Math.round(distanceRemaining)}m left to finish line!`
                    : 'Target overtakes not met!'}
                </span>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center">
              <div className="px-4 py-1 bg-rose-500/20 border border-rose-500/50 rounded-full text-rose-400 text-xs font-black tracking-widest uppercase mb-1">
                CRASHED · {playerName}
              </div>
              <h2 className="text-3xl font-display font-black text-white tracking-wider">
                RACE FINISHED
              </h2>
              {isNewHighScore && (
                <div className="mt-1 px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 font-extrabold text-xs rounded-lg animate-bounce">
                  🏆 NEW HIGH SCORE!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score & Cash Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Score
            </span>
            <span className="text-2xl md:text-3xl font-black font-mono-numbers text-amber-400 mt-0.5">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-emerald-900/60 rounded-2xl p-3.5 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              {isWon ? 'Cash Reward' : 'Cash Earned'}
            </span>
            <span className="text-2xl md:text-3xl font-black font-mono-numbers text-emerald-400 mt-0.5">
              +${stats.cash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3.5 grid grid-cols-2 gap-y-2.5 gap-x-4 text-left">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold">
                Distance
              </span>
              <span className="text-sm font-bold font-mono-numbers text-white">
                {km} KM
                {stats.targetDistanceMeters && (
                  <span className="text-xs text-slate-400 font-normal">
                    {' '}/ {(stats.targetDistanceMeters / 1000).toFixed(2)} KM
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold">
                Close Calls
              </span>
              <span className="text-sm font-bold font-mono-numbers text-white">
                {stats.closeOvertakes}
                {stats.targetOvertakes ? (
                  <span className="text-xs text-slate-400 font-normal">
                    {' '}/ {stats.targetOvertakes} Req
                  </span>
                ) : null}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-rose-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold">
                Top Speed
              </span>
              <span className="text-sm font-bold font-mono-numbers text-white">
                {stats.maxSpeedKmh} KM/H
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold">
                Time &gt; 100 km/h
              </span>
              <span className="text-sm font-bold font-mono-numbers text-white">
                {stats.highSpeedSeconds}s
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {isCareer && isWon && onNextLevel ? (
            <button
              onClick={onNextLevel}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-display font-black text-xl tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>NEXT LEVEL (LEVEL {(stats.careerLevelNumber || 1) + 1})</span>
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={onPlayAgain}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 text-slate-950 font-display font-black text-xl tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-6 h-6 stroke-[3]" />
              <span>
                {isCareer ? `RETRY LEVEL ${stats.careerLevelNumber}` : 'PLAY AGAIN / DUBARA CHALAO'}
              </span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 mt-0.5">
            {isCareer && onSelectLevel ? (
              <button
                onClick={onSelectLevel}
                className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-black text-xs tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-1 shadow-md"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>LEVELS</span>
              </button>
            ) : (
              <button
                onClick={onOpenLeaderboard}
                className="py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-1 shadow-md"
              >
                <Trophy className="w-3.5 h-3.5 fill-black" />
                <span>RANKS</span>
              </button>
            )}

            <button
              onClick={onGarage}
              className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={onHome}
              className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-1"
            >
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span>MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
