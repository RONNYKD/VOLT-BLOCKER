/**
 * Blocking store using Zustand
 * Manages app and website blocking state and methods
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appBlockingService, websiteBlockingService, type InstalledApp, type AppUsageStats } from '../services/native';

// App category types for cooldown management
export type AppCategory = 'emergency' | 'critical' | 'regular';

export interface BlockedApp {
    id: string;
    packageName: string;
    appName: string;
    iconUrl?: string;
    isBlocked: boolean;
    category?: string; // Legacy field - kept for backwards compatibility
    appCategory: AppCategory; // New field for emergency/critical/regular categorization
    cooldownMinutes?: number; // Optional override for specific cooldown duration
    addedAt: string;
    updatedAt: string;
}

export interface BlockedWebsite {
    id: string;
    url: string;
    domain: string;
    title?: string;
    isBlocked: boolean;
    category?: string;
    addedAt: string;
    updatedAt: string;
}

export interface BlockingRule {
    id: string;
    type: 'app' | 'website';
    targetId: string; // References BlockedApp.id or BlockedWebsite.id
    isActive: boolean;
    schedule?: {
        startTime: string; // HH:MM format
        endTime: string; // HH:MM format
        days: number[]; // 0-6, Sunday to Saturday
    };
    createdAt: string;
    updatedAt: string;
}

export interface BlockingState {
    // State
    blockedApps: BlockedApp[];
    blockedWebsites: BlockedWebsite[];
    blockingRules: BlockingRule[];
    isBlockingActive: boolean;
    installedApps: any[]; // Will be populated by native module
    isLoading: boolean;

    // Actions
    setBlockingActive: (active: boolean) => void;
    setInstalledApps: (apps: any[]) => void;
    setLoading: (loading: boolean) => void;

    // App blocking actions
    addBlockedApp: (app: Omit<BlockedApp, 'id' | 'addedAt' | 'updatedAt'>) => void;
    removeBlockedApp: (appId: string) => void;
    updateBlockedApp: (appId: string, updates: Partial<BlockedApp>) => void;
    toggleAppBlocking: (appId: string) => void;

    // Website blocking actions
    addBlockedWebsite: (website: Omit<BlockedWebsite, 'id' | 'addedAt' | 'updatedAt'>) => void;
    removeBlockedWebsite: (websiteId: string) => void;
    updateBlockedWebsite: (websiteId: string, updates: Partial<BlockedWebsite>) => void;
    toggleWebsiteBlocking: (websiteId: string) => void;

    // Blocking rule actions
    addBlockingRule: (rule: Omit<BlockingRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
    removeBlockingRule: (ruleId: string) => void;
    updateBlockingRule: (ruleId: string, updates: Partial<BlockingRule>) => void;

    // Native service integration
    initializeNativeService: () => Promise<boolean>;
    requestPermissions: () => Promise<boolean>;
    loadInstalledApps: () => Promise<void>;
    syncWithNativeService: () => Promise<void>;
    
    // Website blocking native integration
    initializeWebsiteBlocking: () => Promise<boolean>;
    syncWebsitesWithNative: () => Promise<void>;

    // Utility actions
    getActiveBlockedApps: () => BlockedApp[];
    getActiveBlockedWebsites: () => BlockedWebsite[];
    isAppBlocked: (packageName: string) => boolean;
    isWebsiteBlocked: (url: string) => boolean;
    clearAllBlocking: () => void;
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const useBlockingStore = create<BlockingState>()(
    persist(
        (set, get) => ({
            // Initial state
            blockedApps: [],
            blockedWebsites: [],
            blockingRules: [],
            isBlockingActive: false,
            installedApps: [],
            isLoading: false,

            // Basic actions
            setBlockingActive: (isBlockingActive) => set({ isBlockingActive }),
            setInstalledApps: (installedApps) => set({ installedApps }),
            setLoading: (isLoading) => set({ isLoading }),

            // App blocking actions
            addBlockedApp: (appData) => {
                // Auto-categorize app if not provided
                const category = appData.appCategory ?? appBlockingService.categorizeApp(appData.packageName);
                const cooldownMinutes = appData.cooldownMinutes ?? appBlockingService.getCooldownForCategory(category);
                
                const newApp: BlockedApp = {
                    ...appData,
                    appCategory: category,
                    cooldownMinutes,
                    id: generateId(),
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    blockedApps: [...state.blockedApps, newApp],
                }));
            },

            removeBlockedApp: (appId) => {
                set((state) => ({
                    blockedApps: state.blockedApps.filter(app => app.id !== appId),
                    blockingRules: state.blockingRules.filter(rule =>
                        !(rule.type === 'app' && rule.targetId === appId)
                    ),
                }));
            },

            updateBlockedApp: (appId, updates) => {
                set((state) => ({
                    blockedApps: state.blockedApps.map(app =>
                        app.id === appId
                            ? { ...app, ...updates, updatedAt: new Date().toISOString() }
                            : app
                    ),
                }));
            },

            toggleAppBlocking: (appId) => {
                const { blockedApps } = get();
                const app = blockedApps.find(a => a.id === appId);
                if (app) {
                    get().updateBlockedApp(appId, { isBlocked: !app.isBlocked });
                    
                    // Trigger sync with native service after state update
                    setTimeout(() => {
                        get().syncWithNativeService().catch(error => {
                            console.error('Failed to sync after app toggle:', error);
                        });
                    }, 100);
                }
            },

            // Website blocking actions
            addBlockedWebsite: (websiteData) => {
                const newWebsite: BlockedWebsite = {
                    ...websiteData,
                    id: generateId(),
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    blockedWebsites: [...state.blockedWebsites, newWebsite],
                }));
            },

            removeBlockedWebsite: (websiteId) => {
                set((state) => ({
                    blockedWebsites: state.blockedWebsites.filter(website => website.id !== websiteId),
                    blockingRules: state.blockingRules.filter(rule =>
                        !(rule.type === 'website' && rule.targetId === websiteId)
                    ),
                }));
            },

            updateBlockedWebsite: (websiteId, updates) => {
                set((state) => ({
                    blockedWebsites: state.blockedWebsites.map(website =>
                        website.id === websiteId
                            ? { ...website, ...updates, updatedAt: new Date().toISOString() }
                            : website
                    ),
                }));
            },

            toggleWebsiteBlocking: (websiteId) => {
                const { blockedWebsites } = get();
                const website = blockedWebsites.find(w => w.id === websiteId);
                if (website) {
                    get().updateBlockedWebsite(websiteId, { isBlocked: !website.isBlocked });
                    
                    // Trigger sync with native service after state update
                    setTimeout(() => {
                        get().syncWebsitesWithNative().catch(error => {
                            console.error('Failed to sync after website toggle:', error);
                        });
                    }, 100);
                }
            },

            // Blocking rule actions
            addBlockingRule: (ruleData) => {
                const newRule: BlockingRule = {
                    ...ruleData,
                    id: generateId(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    blockingRules: [...state.blockingRules, newRule],
                }));
            },

            removeBlockingRule: (ruleId) => {
                set((state) => ({
                    blockingRules: state.blockingRules.filter(rule => rule.id !== ruleId),
                }));
            },

            updateBlockingRule: (ruleId, updates) => {
                set((state) => ({
                    blockingRules: state.blockingRules.map(rule =>
                        rule.id === ruleId
                            ? { ...rule, ...updates, updatedAt: new Date().toISOString() }
                            : rule
                    ),
                }));
            },

            // Utility actions
            getActiveBlockedApps: () => {
                const { blockedApps } = get();
                return blockedApps.filter(app => app.isBlocked);
            },

            getActiveBlockedWebsites: () => {
                const { blockedWebsites } = get();
                return blockedWebsites.filter(website => website.isBlocked);
            },

            isAppBlocked: (packageName: string) => {
                const { blockedApps } = get();
                const app = blockedApps.find(a => a.packageName === packageName);
                return app ? app.isBlocked : false;
            },

            isWebsiteBlocked: (url: string) => {
                const { blockedWebsites } = get();
                try {
                    const domain = new URL(url).hostname;
                    const website = blockedWebsites.find(w =>
                        w.domain === domain || w.url === url
                    );
                    return website ? website.isBlocked : false;
                } catch {
                    return false;
                }
            },

            clearAllBlocking: () => set({
                blockedApps: [],
                blockedWebsites: [],
                blockingRules: [],
                isBlockingActive: false,
            }),

            // Native service integration
            initializeNativeService: async () => {
                try {
                    set({ isLoading: true });
                    const success = await appBlockingService.initialize();
                    console.log('Native service initialized:', success);
                    return success;
                } catch (error) {
                    console.error('Failed to initialize native service:', error);
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            requestPermissions: async () => {
                try {
                    const hasUsageStats = await appBlockingService.hasUsageStatsPermission();
                    const hasAccessibility = await appBlockingService.hasAccessibilityPermission();
                    
                    if (hasUsageStats && hasAccessibility) {
                        return true;
                    }
                    
                    // Request missing permissions
                    const usageStatsGranted = hasUsageStats || await appBlockingService.requestUsageStatsPermission();
                    const accessibilityGranted = hasAccessibility || await appBlockingService.requestAccessibilityPermission();
                    
                    return usageStatsGranted && accessibilityGranted;
                } catch (error) {
                    console.error('Failed to request permissions:', error);
                    return false;
                }
            },

            loadInstalledApps: async () => {
                try {
                    set({ isLoading: true });
                    const apps = await appBlockingService.getInstalledApps();
                    set({ installedApps: apps });
                    console.log('Loaded installed apps:', apps.length);
                } catch (error) {
                    console.error('Failed to load installed apps:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            syncWithNativeService: async () => {
                try {
                    const { isBlockingActive } = get();
                    const activeApps = get().getActiveBlockedApps();
                    
                    if (isBlockingActive && activeApps.length > 0) {
                        const packageNames = activeApps.map(app => app.packageName);
                        await appBlockingService.startBlocking(packageNames);
                        console.log('Synced blocking with native service:', packageNames);
                    } else {
                        await appBlockingService.stopBlocking();
                        console.log('Stopped blocking in native service');
                    }
                } catch (error) {
                    console.error('Failed to sync with native service:', error);
                }
            },

            // Website blocking native integration
            initializeWebsiteBlocking: async () => {
                try {
                    set({ isLoading: true });
                    const success = await websiteBlockingService.initialize();
                    console.log('Website blocking service initialized:', success);
                    return success;
                } catch (error) {
                    console.error('Failed to initialize website blocking service:', error);
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            syncWebsitesWithNative: async () => {
                try {
                    const { isBlockingActive } = get();
                    const activeWebsites = get().getActiveBlockedWebsites();
                    
                    if (isBlockingActive && activeWebsites.length > 0) {
                        // Convert to native format
                        const websitesForNative = activeWebsites.map(website => ({
                            domain: website.domain,
                            url: website.url,
                            title: website.title || website.domain,
                            isBlocked: website.isBlocked,
                        }));
                        
                        await websiteBlockingService.updateBlockedWebsites(websitesForNative);
                        await websiteBlockingService.startWebsiteBlocking();
                        console.log('Synced website blocking with native service:', websitesForNative.length);
                    } else {
                        await websiteBlockingService.stopWebsiteBlocking();
                        console.log('Stopped website blocking in native service');
                    }
                } catch (error) {
                    console.error('Failed to sync websites with native service:', error);
                }
            },
        }),
        {
            name: 'volt-blocking',
            version: 2, // Increment version for emergency cooldown feature
            storage: createJSONStorage(() => AsyncStorage),
            migrate: (persistedState: any, version: number) => {
                console.log('Migrating blocking store from version:', version);
                
                // Migration from v1 to v2: Add appCategory and cooldownMinutes to existing blocked apps
                if (version < 2) {
                    console.log('Migrating to v2: Adding app categories and cooldown support');
                    
                    if (persistedState.blockedApps) {
                        persistedState.blockedApps = persistedState.blockedApps.map((app: any) => {
                            // Skip if already migrated
                            if (app.appCategory) return app;
                            
                            // Categorize based on package name
                            const appCategory = appBlockingService.categorizeApp(app.packageName || '');
                            const cooldownMinutes = appBlockingService.getCooldownForCategory(appCategory);
                            
                            return {
                                ...app,
                                appCategory,
                                cooldownMinutes,
                            };
                        });
                    }
                    
                    // Initialize disable requests map if not present
                    if (!persistedState.disableRequests) {
                        persistedState.disableRequests = {};
                    }
                }
                
                return persistedState;
            },
            // Don't persist loading states or installed apps
            partialize: (state) => ({
                blockedApps: state.blockedApps,
                blockedWebsites: state.blockedWebsites,
                blockingRules: state.blockingRules,
                isBlockingActive: state.isBlockingActive,
            }),
        }
    )
);