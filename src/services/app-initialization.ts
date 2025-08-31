/**
 * App initialization service
 * Handles startup initialization for Supabase, storage, and authentication
 */
import { supabase } from './supabase';
import { appBlockingService } from './native';
import { getSupabaseConfig, validateSupabaseConfig } from '../config/supabase.config';
import { initializeStorage } from '../utils';
import { useAuthStore, useBlockingStore } from '../store';
import { errorHandler, ErrorSeverity } from '../utils';
import { notificationPermissionService } from './permissions/NotificationPermissionService';
import { focusSyncService } from './focus-sync';

// Initialization result interface
export interface AppInitializationResult {
  success: boolean;
  supabaseReady: boolean;
  storageReady: boolean;
  authReady: boolean;
  nativeServicesReady: boolean;
  blockingPermissions: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

// App initialization class
export class AppInitializer {
  private static isInitialized = false;
  private static initPromise: Promise<AppInitializationResult> | null = null;

  /**
   * Initialize the entire app
   */
  static async initialize(): Promise<AppInitializationResult> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  /**
   * Check if app is initialized
   */
  static isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Force re-initialization (for testing or recovery)
   */
  static async reinitialize(): Promise<AppInitializationResult> {
    this.isInitialized = false;
    this.initPromise = null;
    return this.initialize();
  }

  /**
   * Perform the actual initialization
   */
  private static async performInitialization(): Promise<AppInitializationResult> {
    const startTime = Date.now();
    const result: AppInitializationResult = {
      success: false,
      supabaseReady: false,
      storageReady: false,
      authReady: false,
      nativeServicesReady: false,
      blockingPermissions: false,
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      console.log('🚀 Starting app initialization...');

      // Step 1: Initialize storage system
      try {
        console.log('📦 Initializing storage system...');
        const storageResult = await initializeStorage();
        result.storageReady = storageResult.success;
        
        if (!storageResult.success) {
          result.errors.push(...storageResult.errors);
        }
        if (storageResult.warnings.length > 0) {
          result.warnings.push(...storageResult.warnings);
        }
        
        console.log(`✅ Storage system initialized: ${result.storageReady}`);
        
        // Initialize secure storage (non-blocking)
        try {
          console.log('🔐 Initializing secure storage...');
          const { secureStorage } = await import('../utils');
          await secureStorage.init();
          console.log('✅ Secure storage initialized');
        } catch (secureError) {
          result.warnings.push(`Secure storage initialization failed: ${secureError}`);
          console.warn('⚠️ Secure storage initialization failed, continuing without it:', secureError);
        }
      } catch (error) {
        result.errors.push(`Storage initialization failed: ${error}`);
        await errorHandler.handle(
          error as Error,
          { context: 'app_init_storage' },
          ErrorSeverity.HIGH
        );
      }

      // Step 2: Initialize Supabase
      try {
        console.log('🔗 Initializing Supabase...');
        const config = getSupabaseConfig();
        const validation = validateSupabaseConfig(config);
        
        if (!validation.isValid) {
          result.errors.push(...validation.errors);
          result.warnings.push(...validation.warnings);
          console.warn('⚠️ Supabase configuration issues:', validation.errors);
        } else {
          await supabase.initialize(config);
          result.supabaseReady = supabase.isReady();
          console.log(`✅ Supabase initialized: ${result.supabaseReady}`);
        }
        
        if (validation.warnings.length > 0) {
          result.warnings.push(...validation.warnings);
        }
      } catch (error) {
        result.errors.push(`Supabase initialization failed: ${error}`);
        await errorHandler.handle(
          error as Error,
          { context: 'app_init_supabase' },
          ErrorSeverity.HIGH
        );
      }

      // Step 3: Initialize authentication
      try {
        console.log('🔐 Initializing authentication...');
        
        if (result.supabaseReady) {
          // Initialize auth store with Supabase
          await useAuthStore.getState().initialize();
          result.authReady = useAuthStore.getState().isInitialized;
          console.log(`✅ Authentication initialized: ${result.authReady}`);
        } else {
          result.warnings.push('Authentication skipped due to Supabase initialization failure');
          console.warn('⚠️ Authentication initialization skipped');
        }
      } catch (error) {
        result.errors.push(`Authentication initialization failed: ${error}`);
        await errorHandler.handle(
          error as Error,
          { context: 'app_init_auth' },
          ErrorSeverity.HIGH
        );
      }

      // Step 4: Initialize native services
      try {
        console.log('📱 Initializing native services...');
        
        // Initialize app blocking service
        const blockingInitialized = await appBlockingService.initialize();
        result.nativeServicesReady = blockingInitialized;
        
        if (blockingInitialized) {
          console.log('✅ Native app blocking service initialized');
          
          // Check permissions (don't require them immediately)
          const hasUsageStats = await appBlockingService.hasUsageStatsPermission();
          const hasAccessibility = await appBlockingService.hasAccessibilityPermission();
          const hasPermissions = hasUsageStats && hasAccessibility;
          result.blockingPermissions = hasPermissions;
          
          if (!hasPermissions) {
            result.warnings.push('App blocking permissions not granted. Some features may be limited.');
            console.log('⚠️ App blocking permissions not granted');
          } else {
            console.log('✅ App blocking permissions granted');
          }

          // Initialize blocking store
          const blockingStore = useBlockingStore.getState();
          await blockingStore.initializeNativeService();
          
          // Load installed apps if permissions are available
          if (hasPermissions) {
            await blockingStore.loadInstalledApps();
            console.log('✅ Installed apps loaded');
          }
        } else {
          result.warnings.push('Native app blocking service not available. Using mock implementation.');
          console.log('⚠️ Native app blocking service not available');
        }
      } catch (error) {
        result.warnings.push(`Native services initialization failed: ${error}`);
        await errorHandler.handle(
          error as Error,
          { context: 'app_init_native' },
          ErrorSeverity.MEDIUM
        );
        console.error('⚠️ Native services initialization failed:', error);
      }

      // Step 5: Initialize focus sync service (if authenticated)
      try {
        console.log('🔄 Initializing focus sync service...');
        
        if (result.authReady && result.supabaseReady) {
          await focusSyncService.initialize();
          console.log('✅ Focus sync service initialized');
        } else {
          result.warnings.push('Focus sync skipped - authentication or Supabase not ready');
          console.log('⚠️ Focus sync service skipped');
        }
      } catch (error) {
        result.warnings.push(`Focus sync initialization failed: ${error}`);
        console.error('⚠️ Focus sync initialization failed:', error);
      }

      // Step 5.5: Check for crashed sessions and recover
      try {
        console.log('🔄 Checking for session recovery...');
        
        // Import focus store dynamically to avoid circular dependencies
        const { useFocusStore } = await import('../store/focus-store');
        const focusStore = useFocusStore.getState();
        
        if (!focusStore) {
          console.log('Focus store not available, skipping session recovery');
          return;
        }
        
        const { currentSession } = focusStore;
        
        if (currentSession && currentSession.status === 'active') {
          console.log('Found active session from previous app run, checking if recovery needed...');
          
          try {
            // Check if session should have completed by now
            const now = Date.now();
            const startTime = new Date(currentSession.startTime).getTime();
            const sessionDuration = currentSession.duration * 60 * 1000; // convert to ms
            
            if (now > startTime + sessionDuration) {
              console.log('Session should have completed, marking as completed...');
              // Session should have completed, mark it as completed
              if (typeof focusStore.completeSession === 'function') {
                focusStore.completeSession();
              } else {
                console.warn('Complete session method not available');
              }
            } else {
              console.log('Session is still valid, resuming timer...');
              // Session is still valid, resume timer
              if (typeof focusStore.resumeTimerForForeground === 'function') {
                focusStore.resumeTimerForForeground();
              } else {
                console.warn('Resume timer method not available');
              }
            }
          } catch (sessionError) {
            console.warn('Failed to process session recovery:', sessionError);
          }
        } else {
          console.log('No active session found, recovery not needed');
        }
        
        console.log('✅ Session recovery check completed');
      } catch (error) {
        result.warnings.push(`Session recovery failed: ${error}`);
        console.warn('⚠️ Session recovery failed:', error);
      }

      // Step 6: Check notification permissions (non-blocking)
      try {
        console.log('🔔 Checking notification permissions...');
        
        const notificationStatus = await notificationPermissionService.checkNotificationPermission();
        
        if (notificationStatus.granted) {
          console.log('✅ Notification permissions granted');
        } else {
          result.warnings.push('Notification permissions not granted. Focus session and countdown notifications will not work.');
          console.log('⚠️ Notification permissions not granted');
        }
      } catch (error) {
        result.warnings.push(`Notification permission check failed: ${error}`);
        console.error('⚠️ Notification permission check failed:', error);
      }

      // Step 5: Final validation
      result.success = result.storageReady && (result.supabaseReady || result.warnings.length > 0);
      result.duration = Date.now() - startTime;
      this.isInitialized = result.success;

      // Log final result
      if (result.success) {
        console.log(`🎉 App initialization completed successfully in ${result.duration}ms`);
      } else {
        console.error(`❌ App initialization failed in ${result.duration}ms`);
        console.error('Errors:', result.errors);
      }

      if (result.warnings.length > 0) {
        console.warn('⚠️ Initialization warnings:', result.warnings);
      }

      return result;
    } catch (error) {
      result.errors.push(`App initialization failed: ${error}`);
      result.success = false;
      result.duration = Date.now() - startTime;

      await errorHandler.handle(
        error as Error,
        { context: 'app_initialization' },
        ErrorSeverity.CRITICAL
      );

      console.error('💥 Critical app initialization failure:', error);
      return result;
    }
  }

  /**
   * Get initialization status
   */
  static getInitializationStatus(): {
    isInitialized: boolean;
    supabaseStatus: any;
    storageStatus: any;
    authStatus: any;
  } {
    return {
      isInitialized: this.isInitialized,
      supabaseStatus: supabase.getConnectionStatus(),
      storageStatus: {
        // Will be implemented when storage status is available
        isReady: true,
      },
      authStatus: {
        isInitialized: useAuthStore.getState().isInitialized,
        isAuthenticated: useAuthStore.getState().isAuthenticated,
      },
    };
  }



  /**
   * Request app blocking permissions
   */
  static async requestBlockingPermissions(): Promise<boolean> {
    try {
      console.log('🔐 Requesting app blocking permissions...');
      
      const blockingStore = useBlockingStore.getState();
      const granted = await blockingStore.requestPermissions();
      
      if (granted) {
        console.log('✅ Blocking permissions granted');
        // Load installed apps now that we have permissions
        await blockingStore.loadInstalledApps();
      } else {
        console.log('❌ Blocking permissions denied');
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request blocking permissions:', error);
      return false;
    }
  }

  /**
   * Get detailed service status for debugging
   */
  static async getDetailedStatus() {
    const hasPermissions = await appBlockingService.hasRequiredPermissions();
    const isBlocking = await appBlockingService.isBlocking();
    
    return {
      initialization: {
        isInitialized: this.isInitialized,
        duration: 0, // Could track this
      },
      supabase: {
        initialized: supabase.isReady(),
        connectionStatus: supabase.getConnectionStatus(),
      },
      nativeBlocking: {
        available: !!appBlockingService,
        hasPermissions,
        isBlocking,
      },
      stores: {
        blocking: {
          isActive: useBlockingStore.getState().isBlockingActive,
          installedAppsCount: useBlockingStore.getState().installedApps.length,
          blockedAppsCount: useBlockingStore.getState().blockedApps.length,
        },
        auth: {
          isInitialized: useAuthStore.getState().isInitialized,
          isAuthenticated: useAuthStore.getState().isAuthenticated,
        },
      },
    };
  }

  /**
   * Emergency recovery (for critical failures)
   */
  static async emergencyRecovery(): Promise<void> {
    console.warn('🚨 Performing emergency recovery...');
    
    try {
      // Clear all data and reinitialize
      this.isInitialized = false;
      this.initPromise = null;
      
      // Clear auth state
      useAuthStore.getState().clearAuth();
      
      // Reinitialize
      await this.initialize();
      
      console.log('✅ Emergency recovery completed');
    } catch (error) {
      console.error('💥 Emergency recovery failed:', error);
      throw error;
    }
  }
}

// Export convenience functions
export const initializeApp = () => AppInitializer.initialize();
export const isAppReady = () => AppInitializer.isAppInitialized();
export const getAppStatus = () => AppInitializer.getInitializationStatus();
export const getDetailedStatus = () => AppInitializer.getDetailedStatus();
export const requestBlockingPermissions = () => AppInitializer.requestBlockingPermissions();
// handleAppStateChange removed - now handled by appStateManager
export const emergencyRecovery = () => AppInitializer.emergencyRecovery();