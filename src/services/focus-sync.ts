/**
 * Focus Session Sync Service
 * Handles synchronization of focus sessions with Supabase
 */
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth-store';
import { useFocusStore, type FocusSession } from '../store/focus-store';
import { logger } from '../utils/logger';
import { errorHandler, ErrorSeverity } from '../utils';

export interface RemoteFocusSession {
  id: string;
  user_id: string;
  duration: number;
  actual_duration?: number;
  start_time: string;
  end_time?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  blocked_apps: string[];
  blocked_websites: string[];
  paused_at?: string;
  pause_duration: number;
  created_at: string;
  updated_at: string;
}

export interface FocusStats {
  user_id: string;
  total_sessions: number;
  completed_sessions: number;
  total_focus_time: number;
  average_session_length: number;
  longest_session: number;
  current_streak: number;
  last_session_date?: string;
  updated_at: string;
}

class FocusSyncService {
  private isOnline = true;
  private syncQueue: FocusSession[] = [];
  private lastSyncTime: string | null = null;

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing focus sync service...');
      
      // Check if user is authenticated
      const { isAuthenticated, user } = useAuthStore.getState();
      if (!isAuthenticated || !user) {
        logger.info('User not authenticated, focus sync will initialize when user logs in');
        return;
      }

      // Check if Supabase is ready
      if (!supabase.isReady()) {
        logger.info('Supabase not ready, focus sync will initialize when Supabase is ready');
        return;
      }

      // Test database connection first
      try {
        const client = supabase.getClient();
        if (!client) {
          logger.warn('Supabase client not available, skipping sync initialization');
          return;
        }

        // Simple connection test
        const { error: testError } = await client.from('focus_sessions').select('id').limit(1);
        if (testError) {
          logger.warn('Database connection test failed, skipping sync initialization:', testError.message);
          return;
        }
      } catch (connectionError) {
        logger.warn('Database connection test failed, skipping sync initialization:', connectionError);
        return;
      }

      // Sync local sessions to remote (non-blocking)
      this.syncLocalToRemote().catch(error => {
        logger.warn('Failed to sync local to remote during init, will retry later:', error);
      });
      
      // Sync remote sessions to local (non-blocking)
      this.syncRemoteToLocal().catch(error => {
        logger.warn('Failed to sync remote to local during init, will retry later:', error);
      });
      
      logger.info('Focus sync service initialized successfully');
    } catch (error) {
      logger.warn('Focus sync service initialization failed, will retry later:', error);
      await errorHandler.handle(
        error as Error,
        { context: 'focus_sync_init' },
        ErrorSeverity.LOW // Reduced severity since sync is not critical for app function
      );
      // Don't throw error to prevent app crashes
    }
  }

  /**
   * Sync local sessions to Supabase
   */
  async syncLocalToRemote(): Promise<void> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        logger.info('User not authenticated, skipping local to remote sync');
        return;
      }

      const { sessions } = useFocusStore.getState();
      const unsyncedSessions = sessions.filter(session => !session.userId);

      if (unsyncedSessions.length === 0) {
        logger.info('No local sessions to sync');
        return;
      }

      logger.info(`Syncing ${unsyncedSessions.length} local sessions to remote`);

      // Check if Supabase is ready
      if (!supabase.isReady()) {
        logger.info('Supabase not ready, queuing sessions for later sync');
        this.syncQueue.push(...unsyncedSessions);
        return;
      }

      for (const session of unsyncedSessions) {
        try {
          const remoteSession: Omit<RemoteFocusSession, 'id'> = {
            user_id: user.id,
            duration: session.duration,
            actual_duration: session.actualDuration,
            start_time: session.startTime,
            end_time: session.endTime,
            status: session.status,
            blocked_apps: session.blockedApps,
            blocked_websites: session.blockedWebsites,
            paused_at: session.pausedAt,
            pause_duration: session.pauseDuration,
            created_at: session.createdAt,
            updated_at: session.updatedAt,
          };

          const client = supabase.getClient();
          if (!client) {
            logger.info('Supabase client not available, queuing session for later');
            this.syncQueue.push(session);
            continue;
          }

          const { data, error } = await client
            .from('focus_sessions')
            .insert(remoteSession)
            .select()
            .single();

          if (error) {
            logger.info('Failed to sync session to remote, queuing for later:', error.message);
            this.syncQueue.push(session);
            continue;
          }

          // Update local session with user ID
          try {
            useFocusStore.getState().updateSession(session.id, {
              userId: user.id
            });
            logger.info(`Session ${session.id} synced to remote successfully`);
          } catch (updateError) {
            logger.warn('Failed to update local session after remote sync:', updateError);
          }
        } catch (error) {
          logger.info(`Failed to sync session ${session.id}, queuing for later:`, error);
          this.syncQueue.push(session);
        }
      }

      // Update stats after sync (non-blocking)
      this.syncStatsToRemote().catch(error => {
        logger.info('Failed to sync stats to remote, will retry later:', error);
      });
      
    } catch (error) {
      logger.info('Failed to sync local sessions to remote, will retry later:', error);
      // Don't throw error to prevent app crashes
    }
  }

  /**
   * Sync remote sessions to local
   */
  async syncRemoteToLocal(): Promise<void> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        logger.info('User not authenticated, skipping remote sync');
        return;
      }

      logger.info('Syncing remote sessions to local');

      // Check if Supabase is ready
      if (!supabase.isReady()) {
        logger.info('Supabase not ready, skipping remote sync');
        return;
      }

      const client = supabase.getClient();
      if (!client) {
        logger.info('Supabase client not available, skipping remote sync');
        return;
      }

      const { data: remoteSessions, error } = await client
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.info('Failed to fetch remote sessions, will retry later:', error.message);
        // Don't throw error, just return
        return;
      }

      if (!remoteSessions || remoteSessions.length === 0) {
        logger.info('No remote sessions found');
        return;
      }

      const { sessions: localSessions } = useFocusStore.getState();
      const localSessionIds = new Set(localSessions.map(s => s.id));

      // Convert remote sessions to local format
      const newSessions: FocusSession[] = remoteSessions
        .filter(remote => !localSessionIds.has(remote.id))
        .map(remote => ({
          id: remote.id,
          userId: remote.user_id,
          duration: remote.duration,
          actualDuration: remote.actual_duration,
          startTime: remote.start_time,
          endTime: remote.end_time,
          status: remote.status,
          blockedApps: remote.blocked_apps || [],
          blockedWebsites: remote.blocked_websites || [],
          pausedAt: remote.paused_at,
          pauseDuration: remote.pause_duration || 0,
          createdAt: remote.created_at,
          updatedAt: remote.updated_at,
        }));

      if (newSessions.length > 0) {
        // Add new sessions to local store
        const focusStore = useFocusStore.getState();
        newSessions.forEach(session => {
          focusStore.addSession(session);
        });

        logger.info(`Synced ${newSessions.length} remote sessions to local`);
      }

      // Sync stats from remote (non-blocking)
      this.syncStatsFromRemote().catch(error => {
        logger.info('Failed to sync stats from remote, will retry later:', error);
      });

    } catch (error) {
      logger.info('Failed to sync remote sessions to local, will retry later:', error);
      // Don't throw error to prevent app crashes
    }
  }

  /**
   * Sync stats to remote
   */
  async syncStatsToRemote(): Promise<void> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      const { stats } = useFocusStore.getState();

      const remoteStats: Omit<FocusStats, 'user_id'> = {
        total_sessions: stats.totalSessions,
        completed_sessions: stats.completedSessions,
        total_focus_time: stats.totalFocusTime,
        average_session_length: stats.averageSessionLength,
        longest_session: stats.longestSession,
        current_streak: stats.currentStreak,
        last_session_date: stats.lastSessionDate,
        updated_at: new Date().toISOString(),
      };

      // Check if Supabase is ready
      if (!supabase.isReady()) {
        logger.warn('Supabase not ready, skipping stats sync');
        return;
      }

      const client = supabase.getClient();
      if (!client) {
        logger.error('Supabase client not available');
        return;
      }

      const { error } = await client
        .from('focus_stats')
        .upsert({
          user_id: user.id,
          ...remoteStats
        });

      if (error) {
        logger.error('Failed to sync stats to remote:', error);
        throw error;
      }

      logger.info('Stats synced to remote successfully');
    } catch (error) {
      logger.error('Failed to sync stats to remote:', error);
      throw error;
    }
  }

  /**
   * Sync stats from remote
   */
  async syncStatsFromRemote(): Promise<void> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      // Check if Supabase is ready
      if (!supabase.isReady()) {
        logger.warn('Supabase not ready, skipping stats sync from remote');
        return;
      }

      const client = supabase.getClient();
      if (!client) {
        logger.error('Supabase client not available');
        return;
      }

      const { data: remoteStats, error } = await client
        .from('focus_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        logger.error('Failed to fetch remote stats:', error);
        throw error;
      }

      if (remoteStats) {
        // Update local stats with remote data
        const focusStore = useFocusStore.getState();
        const localStats = {
          totalSessions: remoteStats.total_sessions,
          completedSessions: remoteStats.completed_sessions,
          totalFocusTime: remoteStats.total_focus_time,
          averageSessionLength: remoteStats.average_session_length,
          longestSession: remoteStats.longest_session,
          currentStreak: remoteStats.current_streak,
          lastSessionDate: remoteStats.last_session_date,
        };

        // Manually update stats (assuming we add this method)
        focusStore.setStats?.(localStats);

        logger.info('Stats synced from remote successfully');
      }
    } catch (error) {
      logger.error('Failed to sync stats from remote:', error);
      throw error;
    }
  }

  /**
   * Save session to remote immediately (non-blocking)
   */
  async saveSessionToRemote(session: FocusSession): Promise<boolean> {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        logger.warn('User not authenticated, queuing session for later sync');
        this.syncQueue.push(session);
        return false;
      }

      const remoteSession: Omit<RemoteFocusSession, 'id'> = {
        user_id: user.id,
        duration: session.duration,
        actual_duration: session.actualDuration,
        start_time: session.startTime,
        end_time: session.endTime,
        status: session.status,
        blocked_apps: session.blockedApps,
        blocked_websites: session.blockedWebsites,
        paused_at: session.pausedAt,
        pause_duration: session.pauseDuration,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      };

      // Check if Supabase is ready
      if (!supabase.isReady()) {
        logger.warn('Supabase not ready, queuing session for later sync');
        this.syncQueue.push(session);
        return false;
      }

      const client = supabase.getClient();
      if (!client) {
        logger.error('Supabase client not available');
        this.syncQueue.push(session);
        return false;
      }

      const { error } = await client
        .from('focus_sessions')
        .insert(remoteSession);

      if (error) {
        logger.error('Failed to save session to remote:', error);
        this.syncQueue.push(session);
        return false;
      }

      // Update local session with user ID
      try {
        useFocusStore.getState().updateSession(session.id, {
          userId: user.id
        });
      } catch (updateError) {
        logger.warn('Failed to update local session with user ID:', updateError);
      }

      logger.info(`Session ${session.id} saved to remote successfully`);
      return true;
    } catch (error) {
      logger.error('Failed to save session to remote:', error);
      this.syncQueue.push(session);
      return false;
    }
  }

  /**
   * Process sync queue (for offline sessions)
   */
  async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    logger.info(`Processing sync queue with ${this.syncQueue.length} sessions`);

    const sessionsToSync = [...this.syncQueue];
    this.syncQueue = [];

    for (const session of sessionsToSync) {
      try {
        await this.saveSessionToRemote(session);
      } catch (error) {
        // Re-queue failed sessions
        this.syncQueue.push(session);
      }
    }
  }

  /**
   * Handle app coming to foreground (non-blocking)
   */
  async onAppForeground(): Promise<void> {
    try {
      logger.info('App came to foreground, syncing focus data');
      
      // Process any queued sessions (non-blocking)
      this.processSyncQueue().catch(error => {
        logger.error('Failed to process sync queue:', error);
      });
      
      // Sync remote changes (non-blocking)
      this.syncRemoteToLocal().catch(error => {
        logger.error('Failed to sync remote to local:', error);
      });
      
    } catch (error) {
      logger.error('Failed to sync on app foreground:', error);
      // Don't throw error to prevent app crashes
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queuedSessions: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
    };
  }
}

export const focusSyncService = new FocusSyncService();