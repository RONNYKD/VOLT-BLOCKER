/**
 * Focus store using Zustand
 * Manages focus sessions and timer state
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appBlockingService } from '../services/native';
import { notificationService } from '../services/notifications/NotificationService';
import { requestNotificationPermissions } from '../services/permissions';
import { focusSyncService } from '../services/focus-sync';

export interface FocusSession {
  id: string;
  userId?: string;
  duration: number; // in minutes
  actualDuration?: number; // actual time spent in minutes
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  blockedApps: string[]; // array of app package names
  blockedWebsites: string[]; // array of website domains
  pausedAt?: string;
  pauseDuration: number; // total pause time in seconds
  createdAt: string;
  updatedAt: string;
}

export interface FocusStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number; // in minutes
  longestSession: number; // in minutes
  currentStreak: number; // consecutive days with completed sessions
  lastSessionDate?: string;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number; // in seconds
  totalTime: number; // in seconds
  startedAt?: string;
  pausedAt?: string;
}

export interface FocusState {
  // Current session state
  currentSession: FocusSession | null;
  timer: TimerState;
  
  // Session history and stats
  sessions: FocusSession[];
  stats: FocusStats;
  
  // UI state
  isLoading: boolean;
  selectedDuration: number; // in minutes
  selectedApps: string[];
  selectedWebsites: string[];
  
  // Timer interval reference
  timerInterval: NodeJS.Timeout | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setSelectedDuration: (duration: number) => void;
  setSelectedApps: (apps: string[]) => void;
  setSelectedWebsites: (websites: string[]) => void;
  
  // Session management
  startSession: (duration: number, blockedApps?: string[], blockedWebsites?: string[]) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  completeSession: () => void;
  
  // Timer management
  updateTimer: () => void;
  resetTimer: () => void;
  
  // Session history
  addSession: (session: FocusSession) => void;
  updateSession: (sessionId: string, updates: Partial<FocusSession>) => void;
  deleteSession: (sessionId: string) => void;
  clearSessions: () => void;
  
  // Statistics
  calculateStats: () => void;
  setStats: (stats: FocusStats) => void;
  getSessionsForDate: (date: string) => FocusSession[];
  getSessionsForDateRange: (startDate: string, endDate: string) => FocusSession[];
  
  // Utility
  getCurrentSessionProgress: () => number; // percentage 0-100
  getFormattedTime: (seconds: number) => string;
  
  // App state management
  pauseTimerForBackground: () => void;
  resumeTimerForForeground: () => void;
  cleanup: () => void;
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const initialTimerState: TimerState = {
  isRunning: false,
  isPaused: false,
  remainingTime: 0,
  totalTime: 0,
};

const initialStats: FocusStats = {
  totalSessions: 0,
  completedSessions: 0,
  totalFocusTime: 0,
  averageSessionLength: 0,
  longestSession: 0,
  currentStreak: 0,
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      timer: initialTimerState,
      sessions: [],
      stats: initialStats,
      isLoading: false,
      selectedDuration: 25, // Default 25 minutes
      selectedApps: [],
      selectedWebsites: [],
      timerInterval: null,
      
      // Basic actions
      setLoading: (isLoading) => set({ isLoading }),
      setSelectedDuration: (selectedDuration) => set({ selectedDuration }),
      setSelectedApps: (selectedApps) => set({ selectedApps }),
      setSelectedWebsites: (selectedWebsites) => set({ selectedWebsites }),
      
      // Session management
      startSession: async (duration, blockedApps = [], blockedWebsites = []) => {
        // Request notification permissions before starting session
        try {
          const hasPermission = await requestNotificationPermissions();
          if (!hasPermission) {
            console.log('⚠️ Notification permission denied, session will start without notifications');
          }
        } catch (error) {
          console.error('Failed to request notification permissions:', error);
        }

        const now = new Date().toISOString();
        const newSession: FocusSession = {
          id: generateId(),
          duration,
          startTime: now,
          status: 'active',
          blockedApps,
          blockedWebsites,
          pauseDuration: 0,
          createdAt: now,
          updatedAt: now,
        };
        
        const timerState: TimerState = {
          isRunning: true,
          isPaused: false,
          remainingTime: duration * 60, // convert to seconds
          totalTime: duration * 60,
          startedAt: now,
        };
        
        // Start native focus session and notifications (non-blocking)
        Promise.all([
          appBlockingService.startFocusSession(duration, blockedApps).catch(error => {
            console.error('Failed to start native focus session:', error);
          }),
          appBlockingService.showSessionStartNotification().catch(error => {
            console.error('Failed to show session start notification:', error);
          }),
          notificationService.startFocusSessionNotification(
            newSession.id,
            duration,
            blockedApps.length,
            blockedWebsites.length
          ).catch(error => {
            console.error('Failed to start focus session notification:', error);
          })
        ]).then(() => {
          console.log('Native focus session started with notifications');
        }).catch(error => {
          console.error('Some native services failed to start:', error);
        });
        
        // Start timer interval to update every second
        const interval = setInterval(() => {
          get().updateTimer();
        }, 1000);

        set({
          currentSession: newSession,
          timer: timerState,
          timerInterval: interval,
        });
      },
      
      pauseSession: () => {
        const { currentSession, timer, timerInterval } = get();
        if (!currentSession || !timer.isRunning) return;
        
        // Clear timer interval when pausing
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        
        const now = new Date().toISOString();
        const updatedSession = {
          ...currentSession,
          status: 'paused' as const,
          pausedAt: now,
          updatedAt: now,
        };
        
        const updatedTimer = {
          ...timer,
          isRunning: false,
          isPaused: true,
          pausedAt: now,
        };
        
        set({
          currentSession: updatedSession,
          timer: updatedTimer,
          timerInterval: null,
        });
      },
      
      resumeSession: () => {
        const { currentSession, timer } = get();
        if (!currentSession || !timer.isPaused) return;
        
        const now = new Date().toISOString();
        const pauseStart = timer.pausedAt ? new Date(timer.pausedAt).getTime() : 0;
        const pauseDuration = pauseStart ? (Date.now() - pauseStart) / 1000 : 0;
        
        const updatedSession = {
          ...currentSession,
          status: 'active' as const,
          pauseDuration: currentSession.pauseDuration + pauseDuration,
          updatedAt: now,
        };
        
        const updatedTimer = {
          ...timer,
          isRunning: true,
          isPaused: false,
          pausedAt: undefined,
        };
        
        // Restart timer interval when resuming
        const interval = setInterval(() => {
          get().updateTimer();
        }, 1000);
        
        set({
          currentSession: updatedSession,
          timer: updatedTimer,
          timerInterval: interval,
        });
      },
      
      stopSession: async () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const now = new Date().toISOString();
        const actualDuration = (Date.now() - new Date(currentSession.startTime).getTime()) / (1000 * 60);
        
        const updatedSession = {
          ...currentSession,
          status: 'cancelled' as const,
          endTime: now,
          actualDuration: Math.round(actualDuration),
          updatedAt: now,
        };
        
        // Clear timer interval
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
        }

        // Stop native focus session and notifications
        try {
          await appBlockingService.stopFocusSession();
          
          // Show session end notification (cancelled)
          await appBlockingService.showSessionEndNotification(false);
          
          // Stop focus session notification service
          await notificationService.stopFocusSessionNotification();
          console.log('Native focus session stopped with end notification');
        } catch (error) {
          console.error('Failed to stop native focus session:', error);
        }
        
        set((state) => ({
          currentSession: null,
          timer: initialTimerState,
          timerInterval: null,
          sessions: [...state.sessions, updatedSession],
        }));
        
        get().calculateStats();
      },
      
      completeSession: async () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const now = new Date().toISOString();
        const actualDuration = (Date.now() - new Date(currentSession.startTime).getTime()) / (1000 * 60);
        
        const updatedSession = {
          ...currentSession,
          status: 'completed' as const,
          endTime: now,
          actualDuration: Math.round(actualDuration),
          updatedAt: now,
        };
        
        // Clear timer interval
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
        }

        // Stop native focus session and notifications
        try {
          await appBlockingService.stopFocusSession();
          
          // Show session end notification (completed)
          await appBlockingService.showSessionEndNotification(true);
          
          // Stop focus session notification service
          await notificationService.stopFocusSessionNotification();
          console.log('Native focus session completed with success notification');
        } catch (error) {
          console.error('Failed to complete native focus session:', error);
        }
        
        set((state) => ({
          currentSession: null,
          timer: initialTimerState,
          timerInterval: null,
          sessions: [...state.sessions, updatedSession],
        }));
        
        get().calculateStats();

        // Sync completed session to remote (non-blocking)
        focusSyncService.saveSessionToRemote(updatedSession).catch(error => {
          console.error('Failed to sync completed session to remote:', error);
        });
      },
      
      // Timer management
      updateTimer: () => {
        try {
          const { timer, currentSession, timerInterval } = get();
          if (!timer.isRunning || !currentSession) {
            // Clear interval if timer is not running
            if (timerInterval) {
              clearInterval(timerInterval);
              set({ timerInterval: null });
            }
            return;
          }
          
          const now = Date.now();
          const startTime = new Date(currentSession.startTime).getTime();
          const elapsed = Math.floor((now - startTime) / 1000) - currentSession.pauseDuration;
          const remaining = Math.max(0, timer.totalTime - elapsed);
          
          if (remaining === 0) {
            // Clear interval before completing session
            if (timerInterval) {
              clearInterval(timerInterval);
              set({ timerInterval: null });
            }
            // Complete session asynchronously to prevent blocking
            setTimeout(() => {
              get().completeSession().catch(error => {
                console.error('Failed to complete session:', error);
              });
            }, 0);
            return;
          }
          
          set((state) => ({
            timer: {
              ...state.timer,
              remainingTime: remaining,
            },
          }));
        } catch (error) {
          console.error('Timer update error:', error);
          // Clear timer on error to prevent further issues
          const { timerInterval } = get();
          if (timerInterval) {
            clearInterval(timerInterval);
            set({ timerInterval: null });
          }
        }
      },
      
      resetTimer: () => {
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        set({ 
          timer: initialTimerState,
          timerInterval: null 
        });
      },

      // App state management methods
      pauseTimerForBackground: () => {
        try {
          console.log('Pausing timer for background...');
          const { timerInterval, currentSession } = get();
          
          if (timerInterval) {
            clearInterval(timerInterval);
            set({ timerInterval: null });
          }

          // Save current state to prevent data loss
          if (currentSession) {
            const now = new Date().toISOString();
            const updatedSession = {
              ...currentSession,
              updatedAt: now,
            };
            
            set({ currentSession: updatedSession });
          }
          
          console.log('Timer paused for background successfully');
        } catch (error) {
          console.error('Error pausing timer for background:', error);
        }
      },

      resumeTimerForForeground: () => {
        try {
          console.log('Resuming timer for foreground...');
          const { timer, currentSession } = get();
          
          if (timer.isRunning && currentSession && !get().timerInterval) {
            const interval = setInterval(() => {
              get().updateTimer();
            }, 1000);
            set({ timerInterval: interval });
            console.log('Timer resumed for foreground successfully');
          }
        } catch (error) {
          console.error('Error resuming timer for foreground:', error);
        }
      },
      
      // Session history
      addSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session],
        }));
        get().calculateStats();
      },
      
      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, ...updates, updatedAt: new Date().toISOString() }
              : session
          ),
        }));
        get().calculateStats();
      },
      
      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter(session => session.id !== sessionId),
        }));
        get().calculateStats();
      },
      
      clearSessions: () => {
        set({
          sessions: [],
          stats: initialStats,
        });
      },
      
      // Statistics
      calculateStats: () => {
        const { sessions } = get();
        const completedSessions = sessions.filter(s => s.status === 'completed');
        
        const totalFocusTime = completedSessions.reduce((total, session) => 
          total + (session.actualDuration || session.duration), 0
        );
        
        const averageSessionLength = completedSessions.length > 0 
          ? totalFocusTime / completedSessions.length 
          : 0;
        
        const longestSession = completedSessions.reduce((max, session) => 
          Math.max(max, session.actualDuration || session.duration), 0
        );
        
        // Calculate current streak (simplified - consecutive days with completed sessions)
        const today = new Date().toDateString();
        const recentSessions = completedSessions
          .filter(s => new Date(s.startTime).toDateString() === today)
          .length;
        
        const stats: FocusStats = {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          totalFocusTime: Math.round(totalFocusTime),
          averageSessionLength: Math.round(averageSessionLength),
          longestSession: Math.round(longestSession),
          currentStreak: recentSessions > 0 ? 1 : 0, // Simplified calculation
          lastSessionDate: sessions.length > 0 ? sessions[sessions.length - 1].startTime : undefined,
        };
        
        set({ stats });
      },

      setStats: (stats) => {
        set({ stats });
      },
      
      getSessionsForDate: (date) => {
        const { sessions } = get();
        const targetDate = new Date(date).toDateString();
        return sessions.filter(session => 
          new Date(session.startTime).toDateString() === targetDate
        );
      },
      
      getSessionsForDateRange: (startDate, endDate) => {
        const { sessions } = get();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return sessions.filter(session => {
          const sessionTime = new Date(session.startTime).getTime();
          return sessionTime >= start && sessionTime <= end;
        });
      },
      
      // Utility
      getCurrentSessionProgress: () => {
        const { timer } = get();
        if (timer.totalTime === 0) return 0;
        return Math.round(((timer.totalTime - timer.remainingTime) / timer.totalTime) * 100);
      },
      
      getFormattedTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      },

      // Cleanup all timers and intervals
      cleanup: () => {
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        set({ 
          timerInterval: null,
          timer: initialTimerState 
        });
      },
    }),
    {
      name: 'volt-focus',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist timer state or loading states
      partialize: (state) => ({
        sessions: state.sessions,
        stats: state.stats,
        selectedDuration: state.selectedDuration,
        selectedApps: state.selectedApps,
        selectedWebsites: state.selectedWebsites,
      }),
    }
  )
);

