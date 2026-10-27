import { LeaderboardEntry } from '../types';

const LEADERBOARD_STORAGE_KEY = 'traffic_rider_3d_leaderboard_v1';

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    name: 'PhantomRider 👑',
    score: 84250,
    distanceKm: 18.4,
    topSpeedKmh: 282,
    bikeName: 'Falcon Hayabusa',
    date: 'Today',
  },
  {
    id: 'lb-2',
    name: 'SpeedQueen_99',
    score: 62100,
    distanceKm: 14.1,
    topSpeedKmh: 275,
    bikeName: 'Falcon Hayabusa',
    date: 'Today',
  },
  {
    id: 'lb-3',
    name: 'HighwayGhost',
    score: 48900,
    distanceKm: 11.2,
    topSpeedKmh: 215,
    bikeName: 'Ninja ZX-400R',
    date: 'Yesterday',
  },
  {
    id: 'lb-4',
    name: 'RedlineRacer',
    score: 36750,
    distanceKm: 8.9,
    topSpeedKmh: 210,
    bikeName: 'Ninja ZX-400R',
    date: '2d ago',
  },
  {
    id: 'lb-5',
    name: 'ThunderBobber',
    score: 22400,
    distanceKm: 6.5,
    topSpeedKmh: 154,
    bikeName: 'Iron Bobber 883',
    date: '3d ago',
  },
  {
    id: 'lb-6',
    name: 'NitroScoot',
    score: 11200,
    distanceKm: 3.8,
    topSpeedKmh: 95,
    bikeName: 'Vespa Sprint 150',
    date: '3d ago',
  },
];

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return INITIAL_LEADERBOARD;
}

export function saveLeaderboardScore(
  playerName: string,
  score: number,
  distanceKm: number,
  topSpeedKmh: number,
  bikeName: string
): LeaderboardEntry[] {
  const current = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    id: `lb-${Date.now()}`,
    name: playerName || 'Rider',
    score,
    distanceKm,
    topSpeedKmh,
    bikeName,
    date: 'Just now',
    isCurrentPlayer: true,
  };

  // Remove previous entry of the same player if score is lower
  const filtered = current.filter(
    (e) => e.name.toLowerCase() !== playerName.toLowerCase() || e.score > score
  );

  const updated = [...filtered, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignored
  }

  return updated;
}
