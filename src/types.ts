export type GameMode = 'endless-oneway' | 'endless-twoway' | 'time-attack' | 'career';

export type EnvironmentType = 'suburban' | 'desert' | 'city' | 'winter';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export type WeatherType = 'clear' | 'rain';

export type BikeId = 'scooter' | 'cruiser' | 'sport' | 'superbike';

export interface BikeData {
  id: BikeId;
  name: string;
  category: string;
  tagline: string;
  topSpeedKmh: number;
  accelerationFactor: number;
  brakingFactor: number;
  handlingFactor: number;
  price: number;
  color: string;
  availableColors: string[];
  gears: number;
  wheelieCapable: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: 'overtakes' | 'distance' | 'highSpeedSeconds' | 'reachSpeed';
  reward: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  distanceKm: number;
  topSpeedKmh: number;
  bikeName: string;
  date: string;
  isCurrentPlayer?: boolean;
}

export interface PlayerStats {
  playerName: string;
  playerAvatar: string;
  cash: number;
  highScore: number;
  selectedBikeId: BikeId;
  unlockedBikes: BikeId[];
  bikeColors: Record<BikeId, string>;
  selectedEnvironment: EnvironmentType;
  selectedMode: GameMode;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  audioMuted: boolean;
  completedMissions: string[];
  careerLevel: number;
  maxUnlockedCareerLevel: number;
  careerStars: Record<number, number>;
}

export interface BonusNotification {
  id: number;
  type: 'close-overtake' | 'high-speed' | 'opposite' | 'wheelie' | 'combo';
  text: string;
  pts: number;
  cashBonus?: number;
  timeBonus?: number;
}

export interface GameTelemetry {
  speedKmh: number;
  rpmRatio: number; // 0 to 1
  gear: number;
  distanceMeters: number;
  score: number;
  cashEarned: number;
  closeOvertakes: number;
  timeRemaining: number;
  isWheelie: boolean;
  isBraking: boolean;
  isHornActive: boolean;
  oncomingLane: boolean;
  comboCount: number;
  // Career mode specific
  isCareer?: boolean;
  careerLevel?: number;
  targetDistance?: number;
  targetOvertakes?: number;
}
