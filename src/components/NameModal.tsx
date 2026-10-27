import React, { useState } from 'react';
import { User, Play, Sparkles, Check } from 'lucide-react';

interface NameModalProps {
  initialName: string;
  initialAvatar: string;
  onSaveAndPlay: (name: string, avatar: string) => void;
  onCancel?: () => void;
}

const AVATARS = ['🏍️', '⚡', '🔥', '👑', '🚀', '💀', '🐯', '🦅', '🏆', '💎'];

export const NameModal: React.FC<NameModalProps> = ({
  initialName,
  initialAvatar,
  onSaveAndPlay,
  onCancel,
}) => {
  const [name, setName] = useState(initialName || '');
  const [avatar, setAvatar] = useState(initialAvatar || '🏍️');
  const [error, setError] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your rider name / Apna naam daalein');
      return;
    }
    if (trimmed.length > 16) {
      setError('Max 16 characters allowed');
      return;
    }
    onSaveAndPlay(trimmed, avatar);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 shadow-2xl shadow-amber-500/20 flex flex-col gap-5 text-center">
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/40 mb-2">
            {avatar}
          </div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            Rider Registration
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-wider mt-0.5">
            APNA NAAM DAALEIN
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Apna racer name select karke highway leaderboard aur score par claim karein!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col text-left gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Rider Name / Naam:</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. CreepyBlood, Falcon99..."
              autoFocus
              maxLength={16}
              className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-white font-bold text-base outline-none transition placeholder:text-slate-600"
            />
            {error && <span className="text-xs text-rose-400 font-semibold">{error}</span>}
          </div>

          {/* Avatar Selector */}
          <div className="flex flex-col text-left gap-1.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Choose Emblem / Avatar:</span>
            </span>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center transition active:scale-95 border ${
                    avatar === av
                      ? 'bg-amber-500/30 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Play CTA Button */}
          <button
            type="submit"
            className="w-full mt-2 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 text-slate-950 font-display font-black text-xl tracking-wider rounded-2xl shadow-xl shadow-orange-500/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>GAADI CHALAO / START RIDE ▶</span>
          </button>
        </form>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 underline transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
