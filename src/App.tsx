/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/GameEngine';
import {
  BikeData,
  BikeId,
  BonusNotification,
  EnvironmentType,
  GameMode,
  GameTelemetry,
  LeaderboardEntry,
  PlayerStats,
  TimeOfDay,
  WeatherType,
} from './types';
import { MOTORBIKES } from './data/bikes';
import { soundEngine } from './audio/SoundEffects';
import { getLeaderboard, saveLeaderboardScore } from './data/leaderboard';
import { CockpitOverlay } from './components/CockpitOverlay';
import { TitleScreen } from './components/TitleScreen';
import { GarageScreen } from './components/GarageScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { NameModal } from './components/NameModal';
import { LeaderboardModal } from './components/LeaderboardModal';

const STATS_STORAGE_KEY = 'traffic_rider_3d_stats_v3';

const DEFAULT_STATS: PlayerStats = {
  playerName: '',
  playerAvatar: '🏍️',
  cash: 800,
  highScore: 0,
  selectedBikeId: 'sport', // Start with exciting Kawasaki Lime Green sportbike by default
  unlockedBikes: ['scooter', 'sport'],
  bikeColors: {
    scooter: '#f8fafc',
    cruiser: '#18181b',
    sport: '#22c55e',
    superbike: '#ffffff',
  },
  selectedEnvironment: 'suburban',
  selectedMode: 'endless-oneway',
  timeOfDay: 'day',
  weather: 'clear',
  audioMuted: false,
  completedMissions: [],
};

export default function App() {
  // Screen state: 'title' | 'garage' | 'playing' | 'paused' | 'gameover'
  const [screen, setScreen] = useState<'title' | 'garage' | 'playing' | 'paused' | 'gameover'>('title');

  // Player Stats with localStorage persistence
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignored
    }
    return DEFAULT_STATS;
  });

  // Name prompt modal visible if no name registered yet, or if user clicks change name
  const [showNameModal, setShowNameModal] = useState<boolean>(() => !playerStats.playerName);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard());

  // Save stats when changed
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(playerStats));
    } catch {
      // Ignored
    }
  }, [playerStats]);

  // Current active bike data
  const currentBike = MOTORBIKES.find((b) => b.id === playerStats.selectedBikeId) || MOTORBIKES[2];
  const currentBikeColor = playerStats.bikeColors[currentBike.id] || currentBike.color;

  // Telemetry state throttled from Three.js engine
  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speedKmh: 0,
    rpmRatio: 0,
    gear: 1,
    distanceMeters: 0,
    score: 0,
    cashEarned: 0,
    closeOvertakes: 0,
    timeRemaining: 60,
    isWheelie: false,
    isBraking: false,
    isHornActive: false,
    oncomingLane: false,
    comboCount: 0,
  });

  const [activeBonuses, setActiveBonuses] = useState<BonusNotification[]>([]);
  const [lastGameStats, setLastGameStats] = useState<{
    score: number;
    cash: number;
    distanceMeters: number;
    closeOvertakes: number;
    maxSpeedKmh: number;
    highSpeedSeconds: number;
  }>({
    score: 0,
    cash: 0,
    distanceMeters: 0,
    closeOvertakes: 0,
    maxSpeedKmh: 0,
    highSpeedSeconds: 0,
  });
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Dedicated container ref for WebGL Canvas
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Synchronize audio mute state
  useEffect(() => {
    soundEngine.setMuted(playerStats.audioMuted);
  }, [playerStats.audioMuted]);

  // Helper to initialize or re-initialize 3D game engine
  const initEngine = (startDrivingNow: boolean = false) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.dispose();
      gameEngineRef.current = null;
    }

    if (canvasMountRef.current) {
      canvasMountRef.current.innerHTML = '';

      const engine = new GameEngine({
        canvasMount: canvasMountRef.current,
        bike: currentBike,
        bikeColorHex: currentBikeColor,
        environmentType: playerStats.selectedEnvironment,
        gameMode: playerStats.selectedMode,
        timeOfDay: playerStats.timeOfDay || 'day',
        weather: playerStats.weather || 'clear',
        onTelemetry: (t) => {
          setTelemetry(t);
        },
        onBonus: (bonus) => {
          setActiveBonuses((prev) => [...prev.slice(-3), bonus]);
          setTimeout(() => {
            setActiveBonuses((prev) => prev.filter((b) => b.id !== bonus.id));
          }, 2000);
        },
        onGameOver: (finalStats) => {
          setLastGameStats(finalStats);
          const beatHigh = finalStats.score > playerStats.highScore;
          setIsNewHighScore(beatHigh);

          // Update player stats
          setPlayerStats((prev) => ({
            ...prev,
            cash: prev.cash + finalStats.cash,
            highScore: Math.max(prev.highScore, finalStats.score),
          }));

          // Save score to leaderboard
          const updatedEntries = saveLeaderboardScore(
            playerStats.playerName || 'Rider',
            finalStats.score,
            finalStats.distanceMeters / 1000,
            finalStats.maxSpeedKmh,
            currentBike.name
          );
          setLeaderboardEntries(updatedEntries);

          setScreen('gameover');
        },
      });

      gameEngineRef.current = engine;

      if (!startDrivingNow) {
        // Scene renders bike and road for title screen background
      }
    }
  };

  // Mount 3D engine on startup so road and bike are IMMEDIATELY visible!
  useEffect(() => {
    initEngine(false);
    return () => {
      gameEngineRef.current?.dispose();
    };
  }, []);

  // When bike or environment changes, re-init engine
  useEffect(() => {
    if (screen === 'title' || screen === 'playing') {
      initEngine(screen === 'playing');
    }
  }, [
    playerStats.selectedBikeId,
    playerStats.selectedEnvironment,
    playerStats.selectedMode,
    currentBikeColor,
  ]);

  // Start active race
  const startRace = () => {
    soundEngine.playClick();
    setShowNameModal(false);
    setShowLeaderboard(false);
    initEngine(true);
    setScreen('playing');
  };

  // Save Name and directly Start Racing
  const handleSaveNameAndPlay = (name: string, avatar: string) => {
    soundEngine.playClick();
    setPlayerStats((prev) => ({
      ...prev,
      playerName: name,
      playerAvatar: avatar,
    }));
    setShowNameModal(false);
    startRace();
  };

  // Keyboard navigation for Start / Pause / Play again
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (showNameModal || showLeaderboard) return;

      if (screen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          if (!playerStats.playerName) {
            setShowNameModal(true);
          } else {
            startRace();
          }
        }
      } else if (screen === 'playing') {
        if (e.code === 'Escape') {
          e.preventDefault();
          gameEngineRef.current?.pause();
          setScreen('paused');
        }
      } else if (screen === 'paused') {
        if (e.code === 'Escape') {
          e.preventDefault();
          gameEngineRef.current?.resume();
          setScreen('playing');
        }
      } else if (screen === 'gameover') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startRace();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [screen, showNameModal, showLeaderboard, playerStats, currentBike, currentBikeColor]);

  const handlePause = () => {
    soundEngine.playClick();
    gameEngineRef.current?.pause();
    setScreen('paused');
  };

  const handleResume = () => {
    soundEngine.playClick();
    gameEngineRef.current?.resume();
    setScreen('playing');
  };

  const handleRestart = () => {
    soundEngine.playClick();
    startRace();
  };

  const handleGoHome = () => {
    soundEngine.playClick();
    soundEngine.setRainSound(false);
    gameEngineRef.current?.pause();
    setScreen('title');
  };

  const handleGoGarage = () => {
    soundEngine.playClick();
    soundEngine.setRainSound(false);
    gameEngineRef.current?.pause();
    setScreen('garage');
  };

  const handleToggleCamera = () => {
    soundEngine.playClick();
    gameEngineRef.current?.toggleCamera();
  };

  const handleToggleAudio = () => {
    const nextMuted = !playerStats.audioMuted;
    soundEngine.setMuted(nextMuted);
    setPlayerStats((prev) => ({ ...prev, audioMuted: nextMuted }));
  };

  const handleToggleTimeOfDay = () => {
    soundEngine.playClick();
    const cycle: Record<TimeOfDay, TimeOfDay> = {
      day: 'sunset',
      sunset: 'night',
      night: 'day',
    };
    const nextTod = cycle[playerStats.timeOfDay || 'day'];
    setPlayerStats((prev) => ({ ...prev, timeOfDay: nextTod }));
    gameEngineRef.current?.setTimeOfDay(nextTod);
  };

  const handleToggleWeather = () => {
    soundEngine.playClick();
    const nextWeather: WeatherType = playerStats.weather === 'rain' ? 'clear' : 'rain';
    setPlayerStats((prev) => ({ ...prev, weather: nextWeather }));
    gameEngineRef.current?.setWeather(nextWeather);
    soundEngine.setRainSound(nextWeather === 'rain');
  };

  const handleBuyBike = (bikeId: BikeId, price: number): boolean => {
    if (playerStats.cash >= price) {
      setPlayerStats((prev) => ({
        ...prev,
        cash: prev.cash - price,
        unlockedBikes: [...prev.unlockedBikes, bikeId],
        selectedBikeId: bikeId,
      }));
      return true;
    }
    return false;
  };

  const handleSelectBike = (bikeId: BikeId) => {
    setPlayerStats((prev) => ({
      ...prev,
      selectedBikeId: bikeId,
    }));
  };

  const handleUpdateBikeColor = (bikeId: BikeId, colorHex: string) => {
    setPlayerStats((prev) => ({
      ...prev,
      bikeColors: {
        ...prev.bikeColors,
        [bikeId]: colorHex,
      },
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WEBGL HIGHWAY & MOTORBIKE CANVAS CONTAINER */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
      />

      {/* SCREEN OVERLAYS */}
      {screen === 'title' && !showNameModal && !showLeaderboard && (
        <TitleScreen
          playerStats={playerStats}
          currentBike={currentBike}
          onStartGame={() => {
            if (!playerStats.playerName) {
              setShowNameModal(true);
            } else {
              startRace();
            }
          }}
          onOpenGarage={() => {
            soundEngine.playClick();
            setScreen('garage');
          }}
          onOpenLeaderboard={() => {
            soundEngine.playClick();
            setLeaderboardEntries(getLeaderboard());
            setShowLeaderboard(true);
          }}
          onOpenNameModal={() => {
            soundEngine.playClick();
            setShowNameModal(true);
          }}
          onSelectMode={(mode) => {
            soundEngine.playClick();
            setPlayerStats((prev) => ({ ...prev, selectedMode: mode }));
          }}
          onSelectEnvironment={(env) => {
            soundEngine.playClick();
            setPlayerStats((prev) => ({ ...prev, selectedEnvironment: env }));
          }}
          onSelectTimeOfDay={(tod) => {
            soundEngine.playClick();
            setPlayerStats((prev) => ({ ...prev, timeOfDay: tod }));
            gameEngineRef.current?.setTimeOfDay(tod);
          }}
          onSelectWeather={(weather) => {
            soundEngine.playClick();
            setPlayerStats((prev) => ({ ...prev, weather }));
            gameEngineRef.current?.setWeather(weather);
            soundEngine.setRainSound(weather === 'rain');
          }}
          onToggleAudio={handleToggleAudio}
        />
      )}

      {screen === 'garage' && (
        <GarageScreen
          playerStats={playerStats}
          onSelectBike={handleSelectBike}
          onBuyBike={handleBuyBike}
          onUpdateBikeColor={handleUpdateBikeColor}
          onBack={() => {
            soundEngine.playClick();
            setScreen('title');
          }}
          onTestRide={startRace}
        />
      )}

      {screen === 'playing' && (
        <CockpitOverlay
          playerName={playerStats.playerName || 'Rider'}
          playerAvatar={playerStats.playerAvatar || '🏍️'}
          telemetry={telemetry}
          activeBonuses={activeBonuses}
          gameMode={playerStats.selectedMode}
          timeOfDay={playerStats.timeOfDay || 'day'}
          weather={playerStats.weather || 'clear'}
          onToggleTimeOfDay={handleToggleTimeOfDay}
          onToggleWeather={handleToggleWeather}
          onPause={handlePause}
          onToggleCamera={handleToggleCamera}
          onOpenLeaderboard={() => {
            soundEngine.playClick();
            gameEngineRef.current?.pause();
            setLeaderboardEntries(getLeaderboard());
            setShowLeaderboard(true);
          }}
          onMuteToggle={handleToggleAudio}
          isMuted={playerStats.audioMuted}
          onThrottle={(active) => gameEngineRef.current?.setThrottle(active)}
          onBrake={(active) => gameEngineRef.current?.setBrake(active)}
          onSteer={(val) => gameEngineRef.current?.setSteer(val)}
          onWheelie={(active) => gameEngineRef.current?.setWheelie(active)}
          onHorn={(active) => gameEngineRef.current?.triggerHorn(active)}
          wheelieCapable={currentBike.wheelieCapable}
        />
      )}

      {screen === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onGarage={handleGoGarage}
          onHome={handleGoHome}
          onToggleCamera={handleToggleCamera}
          onToggleAudio={handleToggleAudio}
          isMuted={playerStats.audioMuted}
        />
      )}

      {screen === 'gameover' && (
        <GameOverModal
          playerName={playerStats.playerName || 'Rider'}
          stats={lastGameStats}
          isNewHighScore={isNewHighScore}
          onPlayAgain={handleRestart}
          onOpenLeaderboard={() => {
            soundEngine.playClick();
            setLeaderboardEntries(getLeaderboard());
            setShowLeaderboard(true);
          }}
          onGarage={handleGoGarage}
          onHome={handleGoHome}
        />
      )}

      {/* RIDER NAME ENTRY MODAL */}
      {showNameModal && (
        <NameModal
          initialName={playerStats.playerName}
          initialAvatar={playerStats.playerAvatar}
          onSaveAndPlay={handleSaveNameAndPlay}
          onCancel={() => setShowNameModal(false)}
        />
      )}

      {/* LIVE HIGHWAY RANKINGS MODAL */}
      {showLeaderboard && (
        <LeaderboardModal
          entries={leaderboardEntries}
          currentPlayerName={playerStats.playerName || 'Rider'}
          currentPlayerScore={playerStats.highScore}
          onClose={() => setShowLeaderboard(false)}
          onPlayNow={() => {
            setShowLeaderboard(false);
            startRace();
          }}
        />
      )}
    </div>
  );
}
