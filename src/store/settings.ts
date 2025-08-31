/**
 * Settings store using Zustand
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  
  // Notification settings
  notifications: boolean;
  
  // App behavior settings
  strictMode: boolean;
  
  // Focus session defaults
  defaultSessionDuration: number; // in minutes
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setNotifications: (enabled: boolean) => void;
  setStrictMode: (enabled: boolean) => void;
  setDefaultSessionDuration: (duration: number) => void;
  resetSettings: () => void;
}

const initialState = {
  theme: 'system' as const,
  notifications: true,
  strictMode: false,
  defaultSessionDuration: 25, // 25 minutes (Pomodoro default)
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setTheme: (theme) => set({ theme }),
      
      setNotifications: (notifications) => set({ notifications }),
      
      setStrictMode: (strictMode) => set({ strictMode }),
      
      setDefaultSessionDuration: (defaultSessionDuration) => 
        set({ defaultSessionDuration }),
      
      resetSettings: () => set(initialState),
    }),
    {
      name: 'volt-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);