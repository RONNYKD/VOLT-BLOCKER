/**
 * App Blocking Service
 * Handles native app blocking functionality for Android with system app support
 */
import { NativeModules, Alert } from 'react-native';

// Define the native module interface
interface AppBlockingModule {
  // Permission methods
  hasUsageStatsPermission(): Promise<boolean>;
  requestUsageStatsPermission(): Promise<boolean>;
  hasAccessibilityPermission(): Promise<boolean>;
  requestAccessibilityPermission(): Promise<boolean>;
  
  // App management
  getInstalledApps(): Promise<InstalledAppNative[]>;
  getDistractingApps(): Promise<DistractingAppNative[]>;
  validateAppForBlocking(packageName: string): Promise<AppValidationResult>;
  getAppUsageStats(startTime: number, endTime: number): Promise<AppUsageStatsNative[]>;
  
  // Blocking control
  startBlocking(packageNames: string[]): Promise<boolean>;
  stopBlocking(): Promise<boolean>;
  isBlocking(): Promise<boolean>;
  addBlockedApp(packageName: string): Promise<boolean>;
  removeBlockedApp(packageName: string): Promise<boolean>;
  
  // Focus session methods
  startFocusSession(duration: number, blockedApps: string[]): Promise<boolean>;
  stopFocusSession(): Promise<boolean>;
  pauseFocusSession(): Promise<boolean>;
  resumeFocusSession(): Promise<boolean>;
  
  // Notification methods
  showBlockingNotification(packageName: string): Promise<void>;
  showFocusSessionNotification(duration: number, remainingTime: number): Promise<void>;
  hideFocusSessionNotification(): Promise<void>;
  
  // Countdown service methods
  startCountdownService(endTimeMs: number): Promise<boolean>;
  stopCountdownService(): Promise<boolean>;
  isCountdownServiceRunning(): Promise<boolean>;
  
  // Permanent blocking control methods
  enablePermanentBlocking(): Promise<PermanentBlockingResult>;
  disablePermanentBlocking(): Promise<PermanentBlockingResult>;
  isPermanentBlockingActive(): Promise<boolean>;
  
  // Permanent blocking with 2-hour delay methods
  requestDisableBlocking(): Promise<DisableBlockingResult>;
  cancelDisableRequest(): Promise<DisableBlockingResult>;
  getDisableStatus(): Promise<DisableStatus>;
  confirmDisableBlocking(): Promise<DisableBlockingResult>;
}

// TypeScript interfaces for app data
export interface InstalledAppNative {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
  category: AppCategory;
  categoryDisplay: string;
  isRecommendedForBlocking: boolean;
  requiresWarning: boolean;
  installTime: number;
  lastUpdateTime: number;
  versionName: string;
  versionCode: number;
  icon?: string; // Base64 encoded icon
}

export interface DistractingAppNative {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
  isRecommended: boolean;
}

export interface AppUsageStatsNative {
  packageName: string;
  appName: string;
  totalTimeInForeground: number;
  firstTimeStamp: number;
  lastTimeStamp: number;
  lastTimeUsed: number;
}

export interface AppValidationResult {
  canBlock: boolean;
  reason?: string;
  message?: string;
  category?: string;
  requiresWarning?: boolean;
  warningMessage?: string;
}

export enum AppCategory {
  USER_APP = 'USER_APP',
  SYSTEM_DISTRACTING = 'SYSTEM_DISTRACTING',
  SYSTEM_ESSENTIAL = 'SYSTEM_ESSENTIAL',
  SYSTEM_UTILITY = 'SYSTEM_UTILITY'
}

// Enhanced app interface for UI
export interface EnhancedApp extends InstalledAppNative {
  usageStats?: AppUsageStatsNative;
  isBlocked?: boolean;
  canBlock?: boolean;
  blockingWarning?: string;
}

export interface AppBlockingStatus {
  isActive: boolean;
  blockedApps: string[];
  totalAppsAvailable: number;
  systemAppsIncluded: number;
}

// Permanent Blocking Control Interfaces
export interface PermanentBlockingResult {
  success: boolean;
  message: string;
}

// 2-Hour Delay System Interfaces
export interface DisableBlockingResult {
  success: boolean;
  message: string;
  disableTime?: number;
}

export interface DisableStatus {
  isPending: boolean;
  canDisableNow: boolean;
  remainingMinutes: number;
  remainingTimeDisplay?: string;
  disableTime?: number;
  status: 'no_request' | 'waiting' | 'ready_to_disable';
}

class AppBlockingService {
  private nativeModule: AppBlockingModule | null = null;
  private isInitialized = false;
  private cachedApps: InstalledAppNative[] = [];
  private lastCacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Try to get the native module
    console.log('Available NativeModules:', Object.keys(NativeModules));
    this.nativeModule = NativeModules.VoltAppBlocking || null;
    
    if (!this.nativeModule) {
      console.warn('VoltAppBlocking native module not found. Available modules:', Object.keys(NativeModules));
      console.warn('App blocking features will be limited.');
    } else {
      console.log('✅ VoltAppBlocking native module found!');
    }
  }

  /**
   * Initialize the app blocking service
   */
  async initialize(): Promise<boolean> {
    if (!this.nativeModule) {
      console.warn('Native app blocking module not available');
      return false;
    }

    try {
      // Check permissions
      const hasUsageStats = await this.nativeModule.hasUsageStatsPermission();
      const hasAccessibility = await this.nativeModule.hasAccessibilityPermission();
      
      console.log('App blocking service initialized. Permissions:', {
        usageStats: hasUsageStats,
        accessibility: hasAccessibility
      });
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AppBlockingService:', error);
      return false;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.nativeModule !== null;
  }

  // ============ PERMISSION METHODS ============

  /**
   * Check if usage stats permission is granted
   */
  async hasUsageStatsPermission(): Promise<boolean> {
    if (!this.nativeModule) return false;
    
    try {
      return await this.nativeModule.hasUsageStatsPermission();
    } catch (error) {
      console.error('Failed to check usage stats permission:', error);
      return false;
    }
  }

  /**
   * Request usage stats permission
   */
  async requestUsageStatsPermission(): Promise<boolean> {
    if (!this.nativeModule) return false;
    
    try {
      return await this.nativeModule.requestUsageStatsPermission();
    } catch (error) {
      console.error('Failed to request usage stats permission:', error);
      return false;
    }
  }

  /**
   * Check if accessibility permission is granted
   */
  async hasAccessibilityPermission(): Promise<boolean> {
    if (!this.nativeModule) return false;
    
    try {
      return await this.nativeModule.hasAccessibilityPermission();
    } catch (error) {
      console.error('Failed to check accessibility permission:', error);
      return false;
    }
  }

  /**
   * Request accessibility permission
   */
  async requestAccessibilityPermission(): Promise<boolean> {
    if (!this.nativeModule) return false;
    
    try {
      return await this.nativeModule.requestAccessibilityPermission();
    } catch (error) {
      console.error('Failed to request accessibility permission:', error);
      return false;
    }
  }

  // ============ APP MANAGEMENT METHODS ============

  /**
   * Get all installed apps (including system apps)
   */
  async getInstalledApps(useCache: boolean = true): Promise<InstalledAppNative[]> {
    if (!this.nativeModule) {
      return this.getMockInstalledApps();
    }

    // Check cache
    if (useCache && this.cachedApps.length > 0 && 
        Date.now() - this.lastCacheTime < this.CACHE_DURATION) {
      console.log('Returning cached apps:', this.cachedApps.length);
      return this.cachedApps;
    }

    try {
      const apps = await this.nativeModule.getInstalledApps();
      
      // Update cache
      this.cachedApps = apps;
      this.lastCacheTime = Date.now();
      
      console.log('Retrieved installed apps:', apps.length);
      return apps;
    } catch (error) {
      console.error('Failed to get installed apps:', error);
      return this.getMockInstalledApps();
    }
  }

  /**
   * Get commonly distracting apps (quick selection)
   */
  async getDistractingApps(): Promise<DistractingAppNative[]> {
    if (!this.nativeModule) {
      return this.getMockDistractingApps();
    }

    try {
      const apps = await this.nativeModule.getDistractingApps();
      console.log('Retrieved distracting apps:', apps.length);
      return apps;
    } catch (error) {
      console.error('Failed to get distracting apps:', error);
      return this.getMockDistractingApps();
    }
  }

  /**
   * Validate if an app can be blocked
   */
  async validateAppForBlocking(packageName: string): Promise<AppValidationResult> {
    if (!this.nativeModule) {
      return { canBlock: true };
    }

    try {
      const result = await this.nativeModule.validateAppForBlocking(packageName);
      return result;
    } catch (error) {
      console.error('Failed to validate app for blocking:', error);
      return { canBlock: false, reason: 'VALIDATION_ERROR', message: 'Failed to validate app' };
    }
  }

  /**
   * Get app usage statistics
   */
  async getAppUsageStats(startTime?: number, endTime?: number): Promise<AppUsageStatsNative[]> {
    if (!this.nativeModule) {
      return this.getMockUsageStats();
    }

    // Default to last 24 hours if not specified
    const now = Date.now();
    const start = startTime || (now - 24 * 60 * 60 * 1000);
    const end = endTime || now;

    try {
      const stats = await this.nativeModule.getAppUsageStats(start, end);
      console.log('Retrieved usage stats:', stats.length);
      return stats;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return this.getMockUsageStats();
    }
  }

  // ============ ENHANCED APP METHODS ============

  /**
   * Get enhanced app list with usage stats and blocking info
   */
  async getEnhancedApps(): Promise<EnhancedApp[]> {
    try {
      const [apps, usageStats] = await Promise.all([
        this.getInstalledApps(),
        this.getAppUsageStats()
      ]);

      // Create usage stats map for quick lookup
      const usageMap = new Map<string, AppUsageStatsNative>();
      usageStats.forEach(stat => {
        usageMap.set(stat.packageName, stat);
      });

      // Enhance apps with usage stats and validation
      const enhancedApps: EnhancedApp[] = [];
      
      for (const app of apps) {
        const validation = await this.validateAppForBlocking(app.packageName);
        
        const enhancedApp: EnhancedApp = {
          ...app,
          usageStats: usageMap.get(app.packageName),
          canBlock: validation.canBlock,
          blockingWarning: validation.warningMessage
        };
        
        enhancedApps.push(enhancedApp);
      }

      return enhancedApps;
    } catch (error) {
      console.error('Failed to get enhanced apps:', error);
      return [];
    }
  }

  /**
   * Get apps filtered by category
   */
  async getAppsByCategory(category: AppCategory): Promise<InstalledAppNative[]> {
    const apps = await this.getInstalledApps();
    return apps.filter(app => app.category === category);
  }

  /**
   * Search apps by name or package name
   */
  async searchApps(query: string): Promise<InstalledAppNative[]> {
    const apps = await this.getInstalledApps();
    const lowerQuery = query.toLowerCase();
    
    return apps.filter(app => 
      app.appName.toLowerCase().includes(lowerQuery) ||
      app.packageName.toLowerCase().includes(lowerQuery)
    );
  }

  // ============ BLOCKING CONTROL METHODS ============

  /**
   * Start blocking specified apps
   */
  async startBlocking(packageNames: string[]): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Starting blocking for', packageNames.length, 'apps');
      return true;
    }

    try {
      const success = await this.nativeModule.startBlocking(packageNames);
      if (success) {
        console.log('Successfully started blocking', packageNames.length, 'apps');
      }
      return success;
    } catch (error) {
      console.error('Failed to start blocking:', error);
      return false;
    }
  }

  /**
   * Stop all blocking
   */
  async stopBlocking(): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Stopping all blocking');
      return true;
    }

    try {
      const success = await this.nativeModule.stopBlocking();
      if (success) {
        console.log('Successfully stopped all blocking');
      }
      return success;
    } catch (error) {
      console.error('Failed to stop blocking:', error);
      return false;
    }
  }

  /**
   * Check if blocking is currently active
   */
  async isBlocking(): Promise<boolean> {
    if (!this.nativeModule) {
      return false;
    }

    try {
      return await this.nativeModule.isBlocking();
    } catch (error) {
      console.error('Failed to check blocking status:', error);
      return false;
    }
  }

  /**
   * Get current blocking status with details
   */
  async getBlockingStatus(): Promise<AppBlockingStatus> {
    try {
      const [isActive, apps] = await Promise.all([
        this.isBlocking(),
        this.getInstalledApps()
      ]);

      const systemApps = apps.filter(app => app.isSystemApp);

      return {
        isActive,
        blockedApps: [], // TODO: Get actual blocked apps list
        totalAppsAvailable: apps.length,
        systemAppsIncluded: systemApps.length
      };
    } catch (error) {
      console.error('Failed to get blocking status:', error);
      return {
        isActive: false,
        blockedApps: [],
        totalAppsAvailable: 0,
        systemAppsIncluded: 0
      };
    }
  }

  // ============ FOCUS SESSION METHODS ============

  /**
   * Start a focus session with specified apps blocked
   */
  async startFocusSession(duration: number, blockedApps: string[]): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Starting focus session:', duration, 'minutes');
      return true;
    }

    try {
      const success = await this.nativeModule.startFocusSession(duration, blockedApps);
      if (success) {
        console.log('Successfully started focus session:', duration, 'minutes');
      }
      return success;
    } catch (error) {
      console.error('Failed to start focus session:', error);
      return false;
    }
  }

  /**
   * Stop current focus session
   */
  async stopFocusSession(): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Stopping focus session');
      return true;
    }

    try {
      const success = await this.nativeModule.stopFocusSession();
      if (success) {
        console.log('Successfully stopped focus session');
      }
      return success;
    } catch (error) {
      console.error('Failed to stop focus session:', error);
      return false;
    }
  }

  // ============ PERMANENT BLOCKING CONTROL METHODS ============

  /**
   * Enable permanent blocking mode
   * When enabled, users cannot disable blocking without the 2-hour delay
   */
  async enablePermanentBlocking(): Promise<PermanentBlockingResult> {
    if (!this.nativeModule) {
      console.log('Mock: Enabling permanent blocking mode');
      return {
        success: true,
        message: 'Mock: Permanent blocking mode enabled'
      };
    }

    try {
      const result = await this.nativeModule.enablePermanentBlocking();
      console.log('Permanent blocking enabled:', result);
      return result;
    } catch (error) {
      console.error('Failed to enable permanent blocking:', error);
      return {
        success: false,
        message: 'Failed to enable permanent blocking'
      };
    }
  }

  /**
   * Disable permanent blocking mode
   * This removes all permanent blocking restrictions
   */
  async disablePermanentBlocking(): Promise<PermanentBlockingResult> {
    if (!this.nativeModule) {
      console.log('Mock: Disabling permanent blocking mode');
      return {
        success: true,
        message: 'Mock: Permanent blocking mode disabled'
      };
    }

    try {
      const result = await this.nativeModule.disablePermanentBlocking();
      console.log('Permanent blocking disabled:', result);
      return result;
    } catch (error) {
      console.error('Failed to disable permanent blocking:', error);
      return {
        success: false,
        message: 'Failed to disable permanent blocking'
      };
    }
  }

  /**
   * Check if permanent blocking mode is currently active
   */
  async isPermanentBlockingActive(): Promise<boolean> {
    if (!this.nativeModule) {
      return false; // Mock: permanent blocking not active
    }

    try {
      const isActive = await this.nativeModule.isPermanentBlockingActive();
      console.log('Permanent blocking active:', isActive);
      return isActive;
    } catch (error) {
      console.error('Failed to check permanent blocking status:', error);
      return false;
    }
  }

  // ============ NOTIFICATION METHODS ============

  /**
   * Show notification when an app is blocked
   */
  async showBlockingNotification(packageName: string): Promise<void> {
    if (!this.nativeModule) {
      console.log('Mock: Showing blocking notification for', packageName);
      return;
    }

    try {
      await this.nativeModule.showBlockingNotification(packageName);
      console.log('Blocking notification shown for:', packageName);
    } catch (error) {
      console.error('Failed to show blocking notification:', error);
    }
  }

  /**
   * Show persistent notification for focus session
   */
  async showFocusSessionNotification(duration: number, remainingTime: number): Promise<void> {
    if (!this.nativeModule) {
      console.log('Mock: Showing focus session notification:', duration, 'minutes,', remainingTime, 'remaining');
      return;
    }

    try {
      await this.nativeModule.showFocusSessionNotification(duration, remainingTime);
      console.log('Focus session notification shown');
    } catch (error) {
      console.error('Failed to show focus session notification:', error);
    }
  }

  /**
   * Show session start notification
   */
  async showSessionStartNotification(): Promise<void> {
    // Use the uninstall protection module for notifications since it has the methods
    const { VoltUninstallProtection } = require('react-native').NativeModules;
    
    if (!VoltUninstallProtection) {
      console.log('Mock: Showing session start notification');
      return;
    }

    try {
      await VoltUninstallProtection.showSessionStartNotification();
      console.log('Session start notification shown');
    } catch (error) {
      console.error('Failed to show session start notification:', error);
    }
  }

  /**
   * Show session end notification
   */
  async showSessionEndNotification(completed: boolean = false): Promise<void> {
    // Use the uninstall protection module for notifications since it has the methods
    const { VoltUninstallProtection } = require('react-native').NativeModules;
    
    if (!VoltUninstallProtection) {
      console.log('Mock: Showing session end notification, completed:', completed);
      return;
    }

    try {
      await VoltUninstallProtection.showSessionEndNotification(completed);
      console.log('Session end notification shown, completed:', completed);
    } catch (error) {
      console.error('Failed to show session end notification:', error);
    }
  }

  /**
   * Hide focus session notification
   */
  async hideFocusSessionNotification(): Promise<void> {
    if (!this.nativeModule) {
      console.log('Mock: Hiding focus session notification');
      return;
    }

    try {
      await this.nativeModule.hideFocusSessionNotification();
      console.log('Focus session notification hidden');
    } catch (error) {
      console.error('Failed to hide focus session notification:', error);
    }
  }

  // ============ COUNTDOWN SERVICE METHODS ============

  /**
   * Start countdown service for permanent blocking disable delay
   */
  async startCountdownService(endTimeMs: number): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Starting countdown service until', new Date(endTimeMs));
      return true;
    }

    try {
      const success = await this.nativeModule.startCountdownService(endTimeMs);
      if (success) {
        console.log('Countdown service started until:', new Date(endTimeMs));
      }
      return success;
    } catch (error) {
      console.error('Failed to start countdown service:', error);
      return false;
    }
  }

  /**
   * Stop countdown service
   */
  async stopCountdownService(): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Stopping countdown service');
      return true;
    }

    try {
      const success = await this.nativeModule.stopCountdownService();
      if (success) {
        console.log('Countdown service stopped');
      }
      return success;
    } catch (error) {
      console.error('Failed to stop countdown service:', error);
      return false;
    }
  }

  /**
   * Check if countdown service is running
   */
  async isCountdownServiceRunning(): Promise<boolean> {
    if (!this.nativeModule) {
      return false;
    }

    try {
      return await this.nativeModule.isCountdownServiceRunning();
    } catch (error) {
      console.error('Failed to check countdown service status:', error);
      return false;
    }
  }

  // ============ 2-HOUR DELAY PERMANENT BLOCKING METHODS ============

  /**
   * Request to disable blocking with 2-hour delay
   * This starts a 2-hour countdown before blocking can be disabled
   */
  async requestDisableBlocking(): Promise<DisableBlockingResult> {
    if (!this.nativeModule) {
      console.log('Mock: Requesting disable blocking with 2-hour delay');
      return {
        success: true,
        message: 'Mock: Blocking will be disabled in 2 hours',
        disableTime: Date.now() + (2 * 60 * 60 * 1000)
      };
    }

    try {
      const result = await this.nativeModule.requestDisableBlocking();
      console.log('Disable blocking requested:', result);
      return result;
    } catch (error) {
      console.error('Failed to request disable blocking:', error);
      return {
        success: false,
        message: 'Failed to request disable blocking'
      };
    }
  }

  /**
   * Cancel the pending disable request
   * User can cancel anytime during the 2-hour wait period
   */
  async cancelDisableRequest(): Promise<DisableBlockingResult> {
    if (!this.nativeModule) {
      console.log('Mock: Canceling disable request');
      return {
        success: true,
        message: 'Mock: Disable request canceled'
      };
    }

    try {
      const result = await this.nativeModule.cancelDisableRequest();
      console.log('Disable request canceled:', result);
      return result;
    } catch (error) {
      console.error('Failed to cancel disable request:', error);
      return {
        success: false,
        message: 'Failed to cancel disable request'
      };
    }
  }

  /**
   * Get current status of disable request
   * Returns remaining time, whether it's ready, etc.
   */
  async getDisableStatus(): Promise<DisableStatus> {
    if (!this.nativeModule) {
      // Mock data for development
      return {
        isPending: false,
        canDisableNow: false,
        remainingMinutes: 0,
        status: 'no_request'
      };
    }

    try {
      const status = await this.nativeModule.getDisableStatus();
      console.log('Disable status:', status);
      return status;
    } catch (error) {
      console.error('Failed to get disable status:', error);
      return {
        isPending: false,
        canDisableNow: false,
        remainingMinutes: 0,
        status: 'no_request'
      };
    }
  }

  /**
   * Confirm disabling blocking after 2-hour delay has elapsed
   * Only works if the 2-hour delay period has passed
   */
  async confirmDisableBlocking(): Promise<DisableBlockingResult> {
    if (!this.nativeModule) {
      console.log('Mock: Confirming disable blocking');
      return {
        success: true,
        message: 'Mock: Blocking disabled successfully'
      };
    }

    try {
      const result = await this.nativeModule.confirmDisableBlocking();
      console.log('Blocking disable confirmed:', result);
      return result;
    } catch (error) {
      console.error('Failed to confirm disable blocking:', error);
      return {
        success: false,
        message: 'Failed to disable blocking'
      };
    }
  }

  /**
   * Helper method to format remaining time for display
   */
  formatRemainingTime(remainingMinutes: number): string {
    if (remainingMinutes <= 0) return '0m';
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = Math.floor(remainingMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Show 2-hour delay warning dialog
   */
  async showDisableDelayWarning(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Disable Blocking?',
        '⚠️ This will start a 2-hour countdown before blocking is disabled.\n\nThis delay helps you overcome urges and make thoughtful decisions.\n\nYou can cancel this request anytime during the 2 hours.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Start 2-Hour Delay',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  // ============ UI HELPER METHODS ============

  /**
   * Show system app blocking warning
   */
  async showSystemAppWarning(appName: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Block System App?',
        `"${appName}" is a system app. Blocking it may affect device functionality. Are you sure you want to block it?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Block Anyway',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  /**
   * Show permission request dialog
   */
  async showPermissionInfo(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        'Permissions Required',
        'VOLT needs Usage Stats and Accessibility permissions to block apps effectively.\n\n• Usage Stats: Monitor app usage\n• Accessibility: Detect when blocked apps are opened',
        [
          {
            text: 'Got it',
            onPress: () => resolve(),
          },
        ]
      );
    });
  }

  // ============ MOCK DATA FOR DEVELOPMENT ============

  private getMockInstalledApps(): InstalledAppNative[] {
    return [
      {
        packageName: 'com.android.chrome',
        appName: 'Chrome',
        isSystemApp: true,
        category: AppCategory.SYSTEM_DISTRACTING,
        categoryDisplay: 'System App (Distracting)',
        isRecommendedForBlocking: true,
        requiresWarning: false,
        installTime: Date.now() - 86400000,
        lastUpdateTime: Date.now() - 3600000,
        versionName: '91.0.4472.120',
        versionCode: 447212052
      },
      {
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        isSystemApp: true,
        category: AppCategory.SYSTEM_DISTRACTING,
        categoryDisplay: 'System App (Distracting)',
        isRecommendedForBlocking: true,
        requiresWarning: false,
        installTime: Date.now() - 86400000,
        lastUpdateTime: Date.now() - 3600000,
        versionName: '16.20.35',
        versionCode: 1620350000
      }
    ];
  }

  private getMockDistractingApps(): DistractingAppNative[] {
    return [
      {
        packageName: 'com.android.chrome',
        appName: 'Chrome',
        isSystemApp: true,
        isRecommended: true
      },
      {
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        isSystemApp: true,
        isRecommended: true
      }
    ];
  }

  private getMockUsageStats(): AppUsageStatsNative[] {
    return [
      {
        packageName: 'com.android.chrome',
        appName: 'Chrome',
        totalTimeInForeground: 3600000, // 1 hour
        firstTimeStamp: Date.now() - 86400000,
        lastTimeStamp: Date.now() - 3600000,
        lastTimeUsed: Date.now() - 3600000
      }
    ];
  }
}

// Export singleton instance
export const appBlockingService = new AppBlockingService();
export default AppBlockingService;