import React from 'react';
import { Play, RotateCcw, Wrench, Home, Camera, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onGarage: () => void;
  onHome: () => void;
  onToggleCamera: () => void;
  onToggleAudio: () => void;
  isMuted: boolean;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onGarage,
  onHome,
  onToggleCamera,
  onToggleAudio,
  isMuted,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-none select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">Game Paused</span>
          <h2 className="text-3xl font-display font-black text-white tracking-wider mt-1">
            TRAFFIC RIDER 3D
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-lg tracking-wider rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME (ESC)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>RESTART RACE</span>
          </button>

          <button
            onClick={onToggleCamera}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span>TOGGLE CAMERA (C)</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={onGarage}
              className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={onHome}
              className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4 text-sky-400" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center pt-2 border-t border-slate-800">
          <button
            onClick={onToggleAudio}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>Sound: {isMuted ? 'Muted' : 'Enabled'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
