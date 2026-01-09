import { LevelInfo } from './types';

export const LEVEL_THRESHOLDS: LevelInfo[] = [
  { level: 1, title: "Couch Commando", minXP: 0 },
  { level: 2, title: "Neighborhood Walker", minXP: 100 },
  { level: 3, title: "Weekend Hiker", minXP: 300 },
  { level: 4, title: "Consistent Cruiser", minXP: 600 },
  { level: 5, title: "Fitness Enthusiast", minXP: 1000 },
  { level: 6, title: "Gym Regular", minXP: 1500 },
  { level: 7, title: "Wellness Warrior", minXP: 2200 },
  { level: 8, title: "Health Hero", minXP: 3000 },
  { level: 9, title: "Titan of Tenacity", minXP: 4000 },
  { level: 10, title: "Legendary Lifter", minXP: 5500 },
];

export const MOODS = ['😎', '😤', '😴', '🥳', '😭', '🤢', '🤩', '😐'];

export const XP_PER_LOG = 20;
export const XP_STREAK_BONUS = 5;

// Safety fallback
export const DEFAULT_USER = {
  name: 'User',
  startWeight: 0,
  currentWeight: 0,
  goalWeight: 0,
  height: 0,
  unit: 'kg' as const,
  motivation: '',
  level: 1,
  currentXP: 0,
  streak: 0,
  lastLogDate: null,
  onboardingComplete: false,
};