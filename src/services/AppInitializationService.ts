/**
 * App Initialization Service
 * Handles app startup, Supabase connection, and user data sync
 */
import { supabase } from './supabase';
import { RecoveryDataSyncService } from './RecoveryDataSyncService';
import { errorHandler, ErrorSeverity } from '../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppInitializationResult {
  success: boolean;
  supabaseConnected: boolean;
  userDataSynced: boolean;
  userId?: string;
  error?: string;
}

export class AppInitializationService {
  private static isInitialized = false;

  /**
   * Initialize the app with Supabase and user data sync
   */
  static async initializeApp(): Promise<AppInitializationResult> {
    console.log('🚀 Initializing VOLT app...');

    try {
      let supabaseConnected = false;
      let userDataSynced = false;
      let userId: string | undefined;

      // 1. Initialize Supabase connection
      try {
        console.log('🔗 Connecting to Supabase...');
        supabaseConnected = await RecoveryDataSyncService.initializeSupabase();
        
        if (supabaseConnected) {
          console.log('✅ Supabase connected successfully');
        } else {
          console.warn('⚠️ Supabase connection failed, app will work in offline mode');
        }
      } catch (error) {
        console.error('❌ Supabase initialization error:', error);
        supabaseConnected = false;
      }

      // 2. Check for existing user session
      if (supabaseConnected) {
        try {
          console.log('👤 Checking for existing user session...');
          const currentUser = await supabase.getCurrentUser();
          
          if (currentUser) {
            userId = currentUser.id;
            console.log(`✅ User session found: ${userId.substring(0, 8)}...`);

            // 3. Sync user recovery data
            try {
              console.log('🔄 Syncing user recovery data...');
              const syncResult = await RecoveryDataSyncService.syncUserRecoveryData(userId);
              
              if (syncResult.success) {
                userDataSynced = true;
                console.log(`✅ User data synced: ${syncResult.achievementCount} achievements restored`);
              } else {
                console.warn('⚠️ User data sync failed:', syncResult.error);
              }
            } catch (syncError) {
              console.error('❌ User data sync error:', syncError);
              // Don't fail app initialization for sync errors
            }
          } else {
            console.log('ℹ️ No user session found');
          }
        } catch (error) {
          console.error('❌ Error checking user session:', error);
        }
      }

      // 4. Mark app as initialized
      this.isInitialized = true;
      await AsyncStorage.setItem('app_initialized', 'true');
      await AsyncStorage.setItem('app_initialization_time', Date.now().toString());

      const result: AppInitializationResult = {
        success: true,
        supabaseConnected,
        userDataSynced,
        userId
      };

      console.log('🎉 App initialization completed:', result);
      return result;

    } catch (error) {
      console.error('❌ App initialization failed:', error);
      
      await errorHandler.handle(
        error as Error,
        { context: 'app_initialization' },
        ErrorSeverity.CRITICAL
      );

      return {
        success: false,
        supabaseConnected: false,
        userDataSynced: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Handle user login and sync their data
   */
  static async handleUserLogin(userId: string): Promise<boolean> {
    console.log('👤 Handling user login:', userId.substring(0, 8) + '...');

    try {
      // Check if Supabase is connected
      if (!supabase.isReady()) {
        console.warn('⚠️ Supabase not ready, attempting to reconnect...');
        const connected = await RecoveryDataSyncService.initializeSupabase();
        
        if (!connected) {
          console.error('❌ Failed to connect to Supabase for user login');
          return false;
        }
      }

      // Sync user recovery data
      console.log('🔄 Syncing recovery data for logged in user...');
      const syncResult = await RecoveryDataSyncService.syncUserRecoveryData(userId);

      if (syncResult.success) {
        console.log(`✅ Login data sync successful: ${syncResult.achievementCount} achievements restored`);
        
        // Show user a notification about restored data
        if (syncResult.achievementCount > 0) {
          await this.showDataRestoredNotification(syncResult.achievementCount);
        }
        
        return true;
      } else {
        console.error('❌ Login data sync failed:', syncResult.error);
        return false;
      }

    } catch (error) {
      console.error('❌ Error handling user login:', error);
      
      await errorHandler.handle(
        error as Error,
        { context: 'handle_user_login', userId },
        ErrorSeverity.HIGH
      );
      
      return false;
    }
  }

  /**
   * Handle user logout and cleanup
   */
  static async handleUserLogout(): Promise<void> {
    console.log('👋 Handling user logout...');

    try {
      // Clear user-specific cached data
      const keys = await AsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(key => 
        key.includes('recovery_profile_') ||
        key.includes('milestone_') ||
        key.includes('recent_checkins_') ||
        key.includes('recovery_data_sync_status_')
      );

      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log(`✅ Cleared ${userDataKeys.length} user data entries`);
      }

      console.log('✅ User logout handled successfully');
    } catch (error) {
      console.error('❌ Error handling user logout:', error);
      
      await errorHandler.handle(
        error as Error,
        { context: 'handle_user_logout' },
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Check if app is initialized
   */
  static isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get app initialization status
   */
  static async getInitializationStatus(): Promise<{
    initialized: boolean;
    initializationTime?: number;
    supabaseConnected: boolean;
  }> {
    try {
      const initialized = await AsyncStorage.getItem('app_initialized');
      const initTime = await AsyncStorage.getItem('app_initialization_time');
      
      return {
        initialized: initialized === 'true',
        initializationTime: initTime ? parseInt(initTime) : undefined,
        supabaseConnected: supabase.isReady()
      };
    } catch (error) {
      console.error('Error getting initialization status:', error);
      return {
        initialized: false,
        supabaseConnected: false
      };
    }
  }

  /**
   * Force re-initialization (useful for troubleshooting)
   */
  static async forceReinitialize(): Promise<AppInitializationResult> {
    console.log('🔄 Force re-initializing app...');
    
    // Clear initialization flags
    await AsyncStorage.removeItem('app_initialized');
    await AsyncStorage.removeItem('app_initialization_time');
    this.isInitialized = false;

    return await this.initializeApp();
  }

  /**
   * Show notification about restored data
   */
  private static async showDataRestoredNotification(achievementCount: number): Promise<void> {
    try {
      // Store notification data for the UI to display
      const notification = {
        type: 'data_restored',
        title: 'Welcome Back!',
        message: `Your ${achievementCount} achievement${achievementCount > 1 ? 's have' : ' has'} been restored.`,
        timestamp: Date.now(),
        shown: false
      };

      await AsyncStorage.setItem('pending_notification', JSON.stringify(notification));
      console.log('📱 Data restored notification queued');
    } catch (error) {
      console.error('Error queuing notification:', error);
    }
  }

  /**
   * Get and clear pending notifications
   */
  static async getPendingNotifications(): Promise<any[]> {
    try {
      const notificationJson = await AsyncStorage.getItem('pending_notification');
      if (notificationJson) {
        const notification = JSON.parse(notificationJson);
        await AsyncStorage.removeItem('pending_notification');
        return [notification];
      }
      return [];
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Test Supabase connection
   */
  static async testSupabaseConnection(): Promise<{
    connected: boolean;
    error?: string;
    tables?: string[];
  }> {
    try {
      if (!supabase.isReady()) {
        return {
          connected: false,
          error: 'Supabase not initialized'
        };
      }

      const client = supabase.getClient();
      
      // Test connection by querying a simple table
      const { data, error } = await client
        .from('user_recovery_profiles')
        .select('count')
        .limit(1);

      if (error) {
        return {
          connected: false,
          error: error.message
        };
      }

      return {
        connected: true,
        tables: ['user_recovery_profiles', 'milestone_records', 'daily_check_ins']
      };

    } catch (error) {
      return {
        connected: false,
        error: (error as Error).message
      };
    }
  }
}