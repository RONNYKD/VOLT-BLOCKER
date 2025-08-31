/**
 * Uninstall Protection Store
 * Zustand store for managing protection state across the application
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ProtectionStatus,
  ProtectionConfig,
  SetupStep,
  Permission,
  AuthMethod,
  ProtectionEvent
} from './types';
import { uninstallProtectionService } from './UninstallProtectionService';

export interface UninstallProtectionState {
  // Protection state
  isEnabled: boolean;
  isActive: boolean;
  protectionStatus: ProtectionStatus | null;
  protectionConfig: ProtectionConfig | null;
  
  // Setup state
  isSetupComplete: boolean;
  setupStep: SetupStep;
  requiredPermissions: Permission[];
  
  // UI state
  showSetupWizard: boolean;
  showPasswordOverlay: boolean;
  showStatusDashboard: boolean;
  isLoading: boolean;
  
  // Event logging
  recentEvents: ProtectionEvent[];
  
  // Actions - Protection Management
  enableProtection: () => Promise<boolean>;
  disableProtection: () => Promise<boolean>;
  toggleProtection: () => Promise<boolean>;
  
  // Actions - Setup and Configuration
  startSetupWizard: () => void;
  completeSetupStep: (step: SetupStep) => void;
  finishSetup: () => void;
  updatePermissions: (permissions: Permission[]) => void;
  
  // Actions - Status Management
  updateProtectionStatus: (status: ProtectionStatus) => void;
  refreshProtectionStatus: () => Promise<void>;
  runHealthCheck: () => Promise<void>;
  
  // Actions - UI State
  setLoading: (loading: boolean) => void;
  showSetupWizardModal: () => void;
  hideSetupWizardModal: () => void;
  showPasswordOverlayModal: () => void;
  hidePasswordOverlayModal: () => void;
  
  // Actions - Event Management
  addEvent: (event: Omit<ProtectionEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  
  // Actions - Focus Session Integration
  enableForFocusSession: () => Promise<boolean>;
  disableAfterFocusSession: () => Promise<boolean>;
  
  // Actions - Emergency Override
  requestEmergencyOverride: () => Promise<boolean>;
  
  // Utility Actions
  initialize: () => Promise<void>;
  reset: () => void;
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const createInitialProtectionStatus = (): ProtectionStatus => ({
  isActive: false,
  layers: {
    deviceAdmin: { enabled: false, healthy: false, lastCheck: new Date() },
    packageMonitor: { enabled: false, healthy: false, lastCheck: new Date() },
    passwordAuth: { enabled: false, healthy: false, lastCheck: new Date() },
    accessibilityService: { enabled: false, healthy: false, lastCheck: new Date() }
  },
  lastHealthCheck: new Date(),
  emergencyOverrideActive: false,
  focusSessionEnforced: false
});

export const useUninstallProtectionStore = create<UninstallProtectionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isEnabled: false,
      isActive: false,
      protectionStatus: null,
      protectionConfig: null,
      
      // Setup state
      isSetupComplete: false,
      setupStep: 'introduction',
      requiredPermissions: [],
      
      // UI state
      showSetupWizard: false,
      showPasswordOverlay: false,
      showStatusDashboard: false,
      isLoading: false,
      
      // Event logging
      recentEvents: [],

      // ============ PROTECTION MANAGEMENT ACTIONS ============

      enableProtection: async () => {
        try {
          set({ isLoading: true });
          
          const result = await uninstallProtectionService.enableProtection();
          
          if (result.success) {
            set({ 
              isEnabled: true,
              isActive: true
            });
            
            // Add success event
            get().addEvent({
              type: 'enable',
              details: { source: 'user-action' },
              resolved: true
            });
            
            // Refresh status
            await get().refreshProtectionStatus();
            
            console.log('✅ Protection enabled successfully');
            return true;
          } else {
            console.error('❌ Failed to enable protection:', result.message);
            
            // Add failure event
            get().addEvent({
              type: 'enable',
              details: { 
                source: 'user-action',
                errorMessage: result.message
              },
              resolved: false
            });
            
            return false;
          }
        } catch (error) {
          console.error('Failed to enable protection:', error);
          
          get().addEvent({
            type: 'enable',
            details: { 
              source: 'user-action',
              errorMessage: String(error)
            },
            resolved: false
          });
          
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      disableProtection: async () => {
        try {
          set({ isLoading: true });
          
          const result = await uninstallProtectionService.disableProtection();
          
          if (result.success) {
            set({ 
              isEnabled: false,
              isActive: false
            });
            
            // Add success event
            get().addEvent({
              type: 'disable',
              details: { source: 'user-action' },
              resolved: true
            });
            
            // Refresh status
            await get().refreshProtectionStatus();
            
            console.log('✅ Protection disabled successfully');
            return true;
          } else {
            console.error('❌ Failed to disable protection:', result.message);
            
            // Add failure event
            get().addEvent({
              type: 'disable',
              details: { 
                source: 'user-action',
                errorMessage: result.message
              },
              resolved: false
            });
            
            return false;
          }
        } catch (error) {
          console.error('Failed to disable protection:', error);
          
          get().addEvent({
            type: 'disable',
            details: { 
              source: 'user-action',
              errorMessage: String(error)
            },
            resolved: false
          });
          
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      toggleProtection: async () => {
        const { isEnabled } = get();
        
        if (isEnabled) {
          return await get().disableProtection();
        } else {
          return await get().enableProtection();
        }
      },

      // ============ SETUP AND CONFIGURATION ACTIONS ============

      startSetupWizard: () => {
        set({ 
          showSetupWizard: true,
          setupStep: 'introduction'
        });
      },

      completeSetupStep: (step: SetupStep) => {
        const steps: SetupStep[] = ['introduction', 'device-admin', 'accessibility', 'password-setup', 'confirmation'];
        const currentIndex = steps.indexOf(step);
        const nextStep = steps[currentIndex + 1];
        
        set({ 
          setupStep: nextStep || 'confirmation'
        });
      },

      finishSetup: () => {
        set({ 
          isSetupComplete: true,
          showSetupWizard: false,
          setupStep: 'introduction'
        });
      },

      updatePermissions: (permissions: Permission[]) => {
        set({ requiredPermissions: permissions });
      },

      // ============ STATUS MANAGEMENT ACTIONS ============

      updateProtectionStatus: (status: ProtectionStatus) => {
        set({ 
          protectionStatus: status,
          isActive: status.isActive
        });
      },

      refreshProtectionStatus: async () => {
        try {
          const status = await uninstallProtectionService.getProtectionStatus();
          get().updateProtectionStatus(status);
        } catch (error) {
          console.error('Failed to refresh protection status:', error);
        }
      },

      runHealthCheck: async () => {
        try {
          set({ isLoading: true });
          
          const healthResult = await uninstallProtectionService.runHealthCheck();
          
          // Update status based on health check
          const currentStatus = get().protectionStatus || createInitialProtectionStatus();
          const updatedStatus: ProtectionStatus = {
            ...currentStatus,
            lastHealthCheck: healthResult.lastCheck
          };
          
          get().updateProtectionStatus(updatedStatus);
          
          // Add health check event
          get().addEvent({
            type: 'layer-failure',
            details: { 
              source: 'health-check',
              errorMessage: `Health: ${healthResult.overallHealth}`
            },
            resolved: healthResult.overallHealth === 'healthy'
          });
          
        } catch (error) {
          console.error('Failed to run health check:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // ============ UI STATE ACTIONS ============

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      showSetupWizardModal: () => {
        set({ showSetupWizard: true });
      },

      hideSetupWizardModal: () => {
        set({ showSetupWizard: false });
      },

      showPasswordOverlayModal: () => {
        set({ showPasswordOverlay: true });
      },

      hidePasswordOverlayModal: () => {
        set({ showPasswordOverlay: false });
      },

      // ============ EVENT MANAGEMENT ACTIONS ============

      addEvent: (event: Omit<ProtectionEvent, 'id' | 'timestamp'>) => {
        const newEvent: ProtectionEvent = {
          ...event,
          id: generateId(),
          timestamp: new Date()
        };
        
        set(state => ({
          recentEvents: [newEvent, ...state.recentEvents].slice(0, 50) // Keep last 50 events
        }));
      },

      clearEvents: () => {
        set({ recentEvents: [] });
      },

      // ============ FOCUS SESSION INTEGRATION ============

      enableForFocusSession: async () => {
        try {
          const success = await uninstallProtectionService.enableForFocusSession();
          
          if (success) {
            set({ 
              isEnabled: true,
              isActive: true
            });
            
            // Update status to reflect focus session enforcement
            const currentStatus = get().protectionStatus || createInitialProtectionStatus();
            get().updateProtectionStatus({
              ...currentStatus,
              focusSessionEnforced: true
            });
            
            get().addEvent({
              type: 'enable',
              details: { source: 'focus-session' },
              resolved: true
            });
          }
          
          return success;
        } catch (error) {
          console.error('Failed to enable protection for focus session:', error);
          return false;
        }
      },

      disableAfterFocusSession: async () => {
        try {
          const success = await uninstallProtectionService.disableAfterFocusSession();
          
          if (success) {
            // Update status to remove focus session enforcement
            const currentStatus = get().protectionStatus || createInitialProtectionStatus();
            get().updateProtectionStatus({
              ...currentStatus,
              focusSessionEnforced: false
            });
            
            get().addEvent({
              type: 'disable',
              details: { source: 'focus-session-end' },
              resolved: true
            });
          }
          
          return success;
        } catch (error) {
          console.error('Failed to disable protection after focus session:', error);
          return false;
        }
      },

      // ============ EMERGENCY OVERRIDE ============

      requestEmergencyOverride: async () => {
        try {
          const result = await uninstallProtectionService.requestEmergencyOverride();
          
          if (result.success) {
            // Update status to reflect emergency override
            const currentStatus = get().protectionStatus || createInitialProtectionStatus();
            get().updateProtectionStatus({
              ...currentStatus,
              emergencyOverrideActive: true
            });
            
            get().addEvent({
              type: 'emergency-override',
              details: { source: 'user-request' },
              resolved: false
            });
          }
          
          return result.success;
        } catch (error) {
          console.error('Failed to request emergency override:', error);
          return false;
        }
      },

      // ============ UTILITY ACTIONS ============

      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Initialize the service
          const serviceAvailable = await uninstallProtectionService.initialize();
          
          if (serviceAvailable) {
            // Check current protection status
            await get().refreshProtectionStatus();
            
            // Check permissions
            const permissions = await uninstallProtectionService.checkPermissions();
            get().updatePermissions(permissions);
            
            // Check if setup is complete
            const allPermissionsGranted = permissions.every(p => p.granted || !p.required);
            set({ isSetupComplete: allPermissionsGranted });
          }
          
          console.log('✅ Uninstall protection store initialized');
        } catch (error) {
          console.error('Failed to initialize protection store:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => {
        set({
          isEnabled: false,
          isActive: false,
          protectionStatus: null,
          protectionConfig: null,
          isSetupComplete: false,
          setupStep: 'introduction',
          requiredPermissions: [],
          showSetupWizard: false,
          showPasswordOverlay: false,
          showStatusDashboard: false,
          isLoading: false,
          recentEvents: []
        });
      }
    }),
    {
      name: 'volt-uninstall-protection',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist UI state and loading states
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        isSetupComplete: state.isSetupComplete,
        protectionConfig: state.protectionConfig,
        recentEvents: state.recentEvents.slice(0, 10) // Only persist last 10 events
      }),
    }
  )
);