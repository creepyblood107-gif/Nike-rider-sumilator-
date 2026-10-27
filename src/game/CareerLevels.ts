import { EnvironmentType, TimeOfDay, WeatherType } from '../types';

export interface CareerLevelConfig {
  level: number;
  title: string;
  subtitle: string;
  chapter: number;
  chapterTitle: string;
  environment: EnvironmentType;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  twoWay: boolean;
  targetDistanceMeters: number;
  timeLimitSeconds: number;
  minOvertakes: number;
  rewardCash: number;
  trafficDensity: number;
  trafficSpeedMultiplier: number;
  oncomingSpeedMultiplier: number;
  laneChangeAggressiveness: number;
}

export const TOTAL_CAREER_LEVELS = 500;

const CHAPTER_NAMES = [
  'Chapter 1: Suburban Highway Sprint',
  'Chapter 2: Mojave Desert Overdrive',
  'Chapter 3: Tokyo Midnight Expressway',
  'Chapter 4: Alpine Glacier Passes',
  'Chapter 5: Monsoon Thunderstorm Highway',
  'Chapter 6: Red Rock Canyon Velocity',
  'Chapter 7: Neon City Gauntlet',
  'Chapter 8: Supersonic Midnight Blitz',
  'Chapter 9: Apex Storm Demon Trials',
  'Chapter 10: Grandmaster Apex Legends',
];

const LEVEL_SUBTITLES = [
  'Full Throttle Weave',
  'High-Speed Overtake',
  'Heavy Truck Convoys',
  'Opposite Lane Rush',
  'Near Miss Challenge',
  'Midnight Velocity',
  'Storm Chaser',
  'Asphalt Inferno',
  'Blink-and-Miss Gauntlet',
  'Supersonic Survival',
];

/**
 * Returns procedural, finely-tuned configuration for any level from 1 to 500.
 */
export function getCareerLevelConfig(level: number): CareerLevelConfig {
  const safeLevel = Math.max(1, Math.min(TOTAL_CAREER_LEVELS, Math.round(level)));
  const chapterIdx = Math.min(9, Math.floor((safeLevel - 1) / 50));
  const chapterTitle = CHAPTER_NAMES[chapterIdx];

  // Environment rotation per chapter
  const envMap: EnvironmentType[] = [
    'suburban',
    'desert',
    'city',
    'winter',
    'city',
    'desert',
    'suburban',
    'city',
    'winter',
    'city',
  ];
  const environment = envMap[chapterIdx];

  // Time of Day rotation
  const todCycle: TimeOfDay[] = ['day', 'sunset', 'night'];
  const timeOfDay = todCycle[(safeLevel - 1) % 3];

  // Weather: Monsoon chapter 5 is always rain; other chapters rain on storm levels
  const isMonsoonChapter = chapterIdx === 4;
  const weather: WeatherType =
    isMonsoonChapter || safeLevel % 4 === 0 ? 'rain' : 'clear';

  // Two-way traffic kicks in early and becomes frequent
  const twoWay =
    safeLevel >= 3 &&
    (safeLevel % 3 === 0 || safeLevel % 5 === 0 || chapterIdx >= 6);

  // Target Distance scaling (Level 1: 650m, Level 500: 12,000m)
  const targetDistanceMeters = Math.round(
    600 + Math.pow(safeLevel, 1.21) * 6.2
  );

  // Time Limit: tight countdown demanding fast speeds (Level 1 requires ~75 km/h average, Level 500 requires ~230 km/h)
  const requiredSpeedKmh = 72 + Math.min(160, safeLevel * 0.35);
  const requiredSpeedMs = (requiredSpeedKmh * 1000) / 3600;
  const baseTimeSec = targetDistanceMeters / requiredSpeedMs;
  const timeLimitSeconds = Math.max(
    28,
    Math.round(baseTimeSec + Math.max(3, 8 - safeLevel * 0.015))
  );

  // Target close calls / overtakes
  let minOvertakes = 1;
  if (safeLevel >= 400) minOvertakes = 18;
  else if (safeLevel >= 300) minOvertakes = 14;
  else if (safeLevel >= 200) minOvertakes = 10;
  else if (safeLevel >= 100) minOvertakes = 7;
  else if (safeLevel >= 50) minOvertakes = 5;
  else if (safeLevel >= 20) minOvertakes = 4;
  else if (safeLevel >= 10) minOvertakes = 3;
  else if (safeLevel >= 4) minOvertakes = 2;

  // Reward cash scales with level
  const rewardCash = Math.round(200 + safeLevel * 45);

  // Traffic density scales from 12 cars up to 22 cars
  const trafficDensity = Math.min(22, 12 + Math.floor(safeLevel / 45));

  // Traffic speed multipliers
  const trafficSpeedMultiplier = 1.0 + (safeLevel / TOTAL_CAREER_LEVELS) * 0.45;
  const oncomingSpeedMultiplier = 1.15 + (safeLevel / TOTAL_CAREER_LEVELS) * 0.75;
  const laneChangeAggressiveness =
    0.0022 + (safeLevel / TOTAL_CAREER_LEVELS) * 0.0065;

  const subtitle = LEVEL_SUBTITLES[(safeLevel - 1) % LEVEL_SUBTITLES.length];
  const title = `Level ${safeLevel}`;

  return {
    level: safeLevel,
    title,
    subtitle,
    chapter: chapterIdx + 1,
    chapterTitle,
    environment,
    timeOfDay,
    weather,
    twoWay,
    targetDistanceMeters,
    timeLimitSeconds,
    minOvertakes,
    rewardCash,
    trafficDensity,
    trafficSpeedMultiplier,
    oncomingSpeedMultiplier,
    laneChangeAggressiveness,
  };
}
