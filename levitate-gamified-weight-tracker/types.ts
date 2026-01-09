export interface WeightLog {
  id: string;
  date: string; // ISO string
  weight: number;
  mood: string; // Emoji
  note: string;
}

export interface UserProfile {
  name: string;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  height: number; // cm
  unit: 'kg' | 'lbs';
  motivation: string; // The "Why"
  level: number;
  currentXP: number;
  streak: number;
  lastLogDate: string | null;
  onboardingComplete: boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXP: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LOG = 'LOG',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS'
}