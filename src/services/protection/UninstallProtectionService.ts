/**
 * Uninstall Protection Service
 * Main service class that manages all protection operations and serves as the bridge
 * between React Native and native Android code
 */
import { NativeModules, Alert } from 'react-native';
import {
  ProtectionStatus,
  ProtectionResult,
  SetupResult,
  IntegrityResult,
  HealthCheckResult,
  OverrideResult,
  Permission,
  AuthMethod,
  NativeUninstallProtection
} from './types';
import { MockUninstallProtectionService } from './MockUninstallProtectionService';

// Native module interface
interface UninstallProtectionModule extends NativeUninstallProtection {
  // Additional native methods
  authenticateWithPassword(password: string): Promise<boolean>;
  authenticateWithPIN(pin: string): Promise<boolean>;
  setupPIN(pin: string): Promise<boolean>;
  clearPIN(): Promise<boolean>;
}

class UninstallProtectionService {
  private nativeModule: UninstallProtectionModule | null = null;
  private mockService: MockUninstallProtectionService | null = null;
  private isInitialized = false;

  constructor() {
    // Try to get the native module
    this.nativeModule = NativeModules.VoltUninstallProtection || null;
    
    if (!this.nativeModule) {
      console.warn('VoltUninstallProtection native module not found. Using mock implementation.');
      this.mockService = new MockUninstallProtectionService();
    } else {
      console.log('✅ VoltUninstallProtection native module found!');
    }
  }

  /**
   * Initialize the protection service
   */
  async initialize(): Promise<boolean> {
    if (this.mockService) {
      return await this.mockService.initialize();
    }

    if (!this.nativeModule) {
      console.warn('Native uninstall protection module not available');
      return false;
    }

    try {
      // Check if protection is already active
      const isActive = await this.nativeModule.isProtectionActive();
      console.log('Uninstall protection service initialized. Active:', isActive);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize UninstallProtectionService:', error);
      return false;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.nativeModule !== null || this.mockService !== null;
  }

  // ============ CORE PROTECTION METHODS ============

  /**
   * Enable uninstall protection with all configured layers
   */
  async enableProtection(): Promise<ProtectionResult> {
    if (this.mockService) {
      return await this.mockService.enableProtection();
    }

    if (!this.nativeModule) {
      return {
        success: false,
        message: 'Native protection module not available',
        errors: ['Native module not found']
      };
    }

    try {
      console.log('🛡️ Enabling uninstall protection...');
      const result = await this.nativeModule.enableProtection();
      
      if (result.success) {
        console.log('✅ Uninstall protection enabled successfully');
      } else {
        console.error('❌ Failed to enable uninstall protection:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to enable protection:', error);
      return {
        success: false,
        message: 'Failed to enable protection',
        errors: [String(error)]
      };
    }
  }

  /**
   * Disable uninstall protection and clean up all layers
   */
  async disableProtection(): Promise<ProtectionResult> {
    if (this.mockService) {
      return await this.mockService.disableProtection();
    }

    if (!this.nativeModule) {
      return {
        success: false,
        message: 'Native protection module not available',
        errors: ['Native module not found']
      };
    }

    try {
      console.log('🔓 Disabling uninstall protection...');
      const result = await this.nativeModule.disableProtection();
      
      if (result.success) {
        console.log('✅ Uninstall protection disabled successfully');
      } else {
        console.error('❌ Failed to disable uninstall protection:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to disable protection:', error);
      return {
        success: false,
        message: 'Failed to disable protection',
        errors: [String(error)]
      };
    }
  }

  /**
   * Check if protection is currently active
   */
  async isProtectionActive(): Promise<boolean> {
    if (this.mockService) {
      return await this.mockService.isProtectionActive();
    }

    if (!this.nativeModule) {
      return false;
    }

    try {
      return await this.nativeModule.isProtectionActive();
    } catch (error) {
      console.error('Failed to check protection status:', error);
      return false;
    }
  }

  // ============ PERMISSION AND SETUP METHODS ============

  /**
   * Check all required permissions for protection layers
   */
  async checkPermissions(): Promise<Permission[]> {
    if (this.mockService) {
      return await this.mockService.checkPermissions();
    }

    if (!this.nativeModule) {
      return [];
    }

    try {
      return await this.nativeModule.checkPermissions();
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return [];
    }
  }

  /**
   * Request device administrator privileges
   */
  async requestDeviceAdmin(): Promise<boolean> {
    if (this.mockService) {
      return await this.mockService.requestDeviceAdmin();
    }

    if (!this.nativeModule) {
      console.log('Mock: Requesting device admin privileges');
      return false;
    }

    try {
      const granted = await this.nativeModule.requestDeviceAdmin();
      console.log('Device admin request result:', granted);
      return granted;
    } catch (error) {
      console.error('Failed to request device admin:', error);
      return false;
    }
  }

  /**
   * Set up all protection layers with guided process
   */
  async setupProtectionLayers(): Promise<SetupResult> {
    if (!this.nativeModule) {
      return {
        success: false,
        completedSteps: [],
        failedSteps: ['introduction', 'device-admin', 'accessibility', 'password-setup'],
        message: 'Native module not available'
      };
    }

    try {
      return await this.nativeModule.setupProtectionLayers();
    } catch (error) {
      console.error('Failed to setup protection layers:', error);
      return {
        success: false,
        completedSteps: [],
        failedSteps: ['introduction', 'device-admin', 'accessibility', 'password-setup'],
        message: 'Setup failed: ' + String(error)
      };
    }
  }

  // ============ STATUS AND MONITORING METHODS ============

  /**
   * Get detailed protection status for all layers
   */
  async getProtectionStatus(): Promise<ProtectionStatus> {
    if (this.mockService) {
      return await this.mockService.getProtectionStatus();
    }

    if (!this.nativeModule) {
      // Return mock status for development
      return {
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
      };
    }

    try {
      return await this.nativeModule.getProtectionStatus();
    } catch (error) {
      console.error('Failed to get protection status:', error);
      throw error;
    }
  }

  /**
   * Verify protection system integrity
   */
  async verifyProtectionIntegrity(): Promise<IntegrityResult> {
    if (!this.nativeModule) {
      return {
        isIntact: false,
        compromisedLayers: ['all'],
        recommendations: ['Install native protection module'],
        severity: 'critical'
      };
    }

    try {
      return await this.nativeModule.verifyProtectionIntegrity();
    } catch (error) {
      console.error('Failed to verify protection integrity:', error);
      return {
        isIntact: false,
        compromisedLayers: ['unknown'],
        recommendations: ['Check system logs', 'Restart protection service'],
        severity: 'high'
      };
    }
  }

  /**
   * Run comprehensive health check on all protection layers
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    if (!this.nativeModule) {
      return {
        overallHealth: 'critical',
        layerResults: {
          deviceAdmin: { status: 'error', message: 'Native module not available' },
          packageMonitor: { status: 'error', message: 'Native module not available' },
          passwordAuth: { status: 'error', message: 'Native module not available' },
          accessibilityService: { status: 'error', message: 'Native module not available' }
        },
        recommendations: ['Install native protection module'],
        lastCheck: new Date()
      };
    }

    try {
      return await this.nativeModule.runHealthCheck();
    } catch (error) {
      console.error('Failed to run health check:', error);
      return {
        overallHealth: 'critical',
        layerResults: {},
        recommendations: ['Check system logs', 'Restart app'],
        lastCheck: new Date()
      };
    }
  }

  // ============ FOCUS SESSION INTEGRATION ============

  /**
   * Enable protection for focus session
   */
  async enableForFocusSession(): Promise<boolean> {
    try {
      const result = await this.enableProtection();
      if (result.success) {
        console.log('✅ Protection enabled for focus session');
        return true;
      } else {
        console.error('❌ Failed to enable protection for focus session');
        return false;
      }
    } catch (error) {
      console.error('Failed to enable protection for focus session:', error);
      return false;
    }
  }

  /**
   * Disable protection after focus session (if not manually enabled)
   */
  async disableAfterFocusSession(): Promise<boolean> {
    try {
      // Check if protection was manually enabled before session
      // This would require storing session state
      const result = await this.disableProtection();
      if (result.success) {
        console.log('✅ Protection disabled after focus session');
        return true;
      } else {
        console.error('❌ Failed to disable protection after focus session');
        return false;
      }
    } catch (error) {
      console.error('Failed to disable protection after focus session:', error);
      return false;
    }
  }

  // ============ AUTHENTICATION METHODS ============

  /**
   * Set up protection password
   */
  async setupProtectionPassword(password: string): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Setting up protection password');
      return true;
    }

    try {
      const result = await this.nativeModule.setupProtectionPassword(password);
      console.log('Password setup result:', result);
      
      // Handle both object and boolean responses for backward compatibility
      if (typeof result === 'object' && result !== null) {
        return result.success === true;
      } else {
        return result === true;
      }
    } catch (error) {
      console.error('Failed to setup protection password:', error);
      return false;
    }
  }

  /**
   * Verify protection password
   */
  async verifyProtectionPassword(password: string): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Verifying protection password');
      return password === 'test123'; // Mock authentication
    }

    try {
      return await this.nativeModule.verifyProtectionPassword(password);
    } catch (error) {
      console.error('Failed to verify protection password:', error);
      return false;
    }
  }

  /**
   * Check if protection password is set
   */
  async hasProtectionPassword(): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Checking if protection password is set');
      return true;
    }

    try {
      return await this.nativeModule.hasProtectionPassword();
    } catch (error) {
      console.error('Failed to check protection password:', error);
      return false;
    }
  }

  /**
   * Authenticate user with account password (legacy method)
   */
  async authenticateWithPassword(password: string): Promise<boolean> {
    // Use the new protection password verification
    return await this.verifyProtectionPassword(password);
  }

  /**
   * Authenticate user with PIN
   */
  async authenticateWithPIN(pin: string): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Authenticating with PIN');
      return pin === '1234'; // Mock authentication
    }

    try {
      return await this.nativeModule.authenticateWithPIN(pin);
    } catch (error) {
      console.error('Failed to authenticate with PIN:', error);
      return false;
    }
  }

  /**
   * Set up PIN for protection authentication
   */
  async setupPIN(pin: string): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Setting up PIN');
      return true;
    }

    try {
      return await this.nativeModule.setupPIN(pin);
    } catch (error) {
      console.error('Failed to setup PIN:', error);
      return false;
    }
  }

  // ============ EMERGENCY OVERRIDE METHODS ============

  /**
   * Request emergency override to disable protection
   */
  async requestEmergencyOverride(): Promise<OverrideResult> {
    if (!this.nativeModule) {
      return {
        success: false,
        message: 'Native module not available'
      };
    }

    try {
      return await this.nativeModule.requestEmergencyOverride();
    } catch (error) {
      console.error('Failed to request emergency override:', error);
      return {
        success: false,
        message: 'Failed to request emergency override: ' + String(error)
      };
    }
  }

  /**
   * Process emergency override with token
   */
  async processEmergencyOverride(token: string): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Processing emergency override');
      return false;
    }

    try {
      return await this.nativeModule.processEmergencyOverride(token);
    } catch (error) {
      console.error('Failed to process emergency override:', error);
      return false;
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Show user-friendly error dialog
   */
  showErrorDialog(title: string, message: string, actions?: Array<{text: string, onPress?: () => void}>) {
    Alert.alert(
      title,
      message,
      actions || [{ text: 'OK' }]
    );
  }

  /**
   * Show protection setup explanation
   */
  showSetupExplanation(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🛡️ Uninstall Protection',
        'This feature prevents you from uninstalling VOLT during focus sessions, helping you stay committed to your digital wellness goals.\n\n' +
        '• Requires device administrator privileges\n' +
        '• Uses password authentication for security\n' +
        '• Can be disabled when not needed\n' +
        '• Includes emergency override options\n\n' +
        'Would you like to set up protection now?',
        [
          { text: 'Not Now', onPress: () => resolve(false) },
          { text: 'Set Up Protection', onPress: () => resolve(true) }
        ]
      );
    });
  }
}

// Export singleton instance
export const uninstallProtectionService = new UninstallProtectionService();