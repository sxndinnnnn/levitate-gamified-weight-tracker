import { UserProfile, WeightLog } from '../types';
import { DEFAULT_USER } from '../constants';

const USER_KEY = 'levitate_user_v1';
const LOGS_KEY = 'levitate_logs_v1';

export const storageService = {
  getUser: (): UserProfile => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : DEFAULT_USER;
    } catch (e) {
      console.error("Failed to load user", e);
      return DEFAULT_USER;
    }
  },

  saveUser: (user: UserProfile) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getLogs: (): WeightLog[] => {
    try {
      const data = localStorage.getItem(LOGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveLogs: (logs: WeightLog[]) => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  },

  clearAll: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LOGS_KEY);
  }
};