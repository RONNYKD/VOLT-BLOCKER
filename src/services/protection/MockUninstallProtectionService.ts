/**
 * Mock Uninstall Protection Service
 * Provides mock implementations for development when native module is not available
 */
import { Alert } from 'react-native';
import {
  ProtectionStatus,
  ProtectionResult,
  SetupResult,
  IntegrityResult,
  HealthCheckResult,
  OverrideResult,
  Permission,
} from './types';

export class MockUninstallProtectionService {
  private mockPassword = 'test123';
  private mockProtectionEnabled = false;
  private mockDeviceAdminEnabled = false;
  private mockEmergencyOverrideRequested = false;
  private mockEmergencyOverrideTime = 0;

  /**
   * Initialize the mock service
   */
  async initialize(): Promise<boolean> {
    console.log('🔧 Mock UninstallProtectionService initialized');
    return true;
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return true; // Mock is always available
  }

  // ============ CORE PROTECTION METHODS ============

  /**
   * Enable uninstall protection
   */
  async enableProtection(): Promise<ProtectionResult> {
    console.log('🛡️ Mock: Enabling uninstall protection...');
    
    if (!this.mockDeviceAdminEnabled) {
      return {
        success: false,
        message: 'Device administrator privileges required. Please enable device admin first.',
        errors: ['Device admin not enabled']
      };
    }

    this.mockProtectionEnabled = true;
    
    return {
      success: true,
      message: 'Mock protection enabled successfully',
      errors: []
    };
  }

  /**
   * Disable uninstall protection
   */
  async disableProtection(): Promise<ProtectionResult> {
    console.log('🔓 Mock: Disabling uninstall protection...');
    
    this.mockProtectionEnabled = false;
    this.mockEmergencyOverrideRequested = false;
    this.mockEmergencyOverrideTime = 0;
    
    return {
      success: true,
      message: 'Mock protection disabled successfully',
      errors: []
    };
  }

  /**
   * Check if protection is currently active
   */
  async isProtectionActive(): Promise<boolean> {
    return this.mockProtectionEnabled && this.mockDeviceAdminEnabled;
  }

  // ============ PERMISSION AND SETUP METHODS ============

  /**
   * Check all required permissions
   */
  async checkPermissions(): Promise<Permission[]> {
    return [
      {
        name: 'Device Administrator',
        description: 'Required to prevent unauthorized app uninstallation',
        granted: this.mockDeviceAdminEnabled,
        required: true
      }
    ];
  }

  /**
   * Request device administrator privileges
   */
  async requestDeviceAdmin(): Promise<boolean> {
    console.log('📱 Mock: Requesting device admin privileges...');
    
    // Simulate user granting permission
    return new Promise((resolve) => {
      Alert.alert(
        'Mock Device Admin Request',
        'This is a mock request for device administrator privileges. Grant permission?',
        [
          { text: 'Deny', onPress: () => resolve(false) },
          { 
            text: 'Grant', 
            onPress: () => {
              this.mockDeviceAdminEnabled = true;
              resolve(true);
            }
          }
        ]
      );
    });
  }

  /**
   * Set up protection layers
   */
  async setupProtectionLayers(): Promise<SetupResult> {
    const completedSteps: string[] = [];
    const failedSteps: string[] = [];

    // Check device admin
    if (this.mockDeviceAdminEnabled) {
      completedSteps.push('device-admin');
    } else {
      failedSteps.push('device-admin');
    }

    // Check password
    if (this.mockPassword) {
      completedSteps.push('password-setup');
    } else {
      failedSteps.push('password-setup');
    }

    return {
      success: failedSteps.length === 0,
      completedSteps,
      failedSteps,
      message: failedSteps.length === 0 
        ? 'All protection layers set up successfully' 
        : 'Some protection layers need setup'
    };
  }

  // ============ STATUS AND MONITORING METHODS ============

  /**
   * Get detailed protection status
   */
  async getProtectionStatus(): Promise<ProtectionStatus> {
    const now = new Date();
    
    return {
      isActive: this.mockProtectionEnabled && this.mockDeviceAdminEnabled,
      layers: {
        deviceAdmin: { 
          enabled: this.mockDeviceAdminEnabled, 
          healthy: this.mockDeviceAdminEnabled, 
          lastCheck: now 
        },
        packageMonitor: { 
          enabled: this.mockProtectionEnabled, 
          healthy: this.mockProtectionEnabled, 
          lastCheck: now 
        },
        passwordAuth: { 
          enabled: !!this.mockPassword, 
          healthy: !!this.mockPassword, 
          lastCheck: now 
        },
        accessibilityService: { 
          enabled: false, 
          healthy: false, 
          lastCheck: now 
        }
      },
      lastHealthCheck: now,
      emergencyOverrideActive: this.mockEmergencyOverrideRequested,
      focusSessionEnforced: this.mockProtectionEnabled
    };
  }

  /**
   * Verify protection integrity
   */
  async verifyProtectionIntegrity(): Promise<IntegrityResult> {
    const compromisedLayers: string[] = [];
    
    if (!this.mockDeviceAdminEnabled) {
      compromisedLayers.push('deviceAdmin');
    }
    
    if (!this.mockPassword) {
      compromisedLayers.push('passwordAuth');
    }

    return {
      isIntact: compromisedLayers.length === 0,
      compromisedLayers,
      recommendations: compromisedLayers.length === 0 
        ? ['All protection layers are working correctly']
        : ['Enable missing protection layers'],
      severity: compromisedLayers.length === 0 ? 'low' : 'medium'
    };
  }

  /**
   * Run health check
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    const layerResults: Record<string, { status: string; message: string }> = {
      deviceAdmin: {
        status: this.mockDeviceAdminEnabled ? 'healthy' : 'error',
        message: this.mockDeviceAdminEnabled ? 'Device admin is active' : 'Device admin not active'
      },
      packageMonitor: {
        status: this.mockProtectionEnabled ? 'healthy' : 'info',
        message: this.mockProtectionEnabled ? 'Protection is enabled' : 'Protection is disabled'
      },
      passwordAuth: {
        status: this.mockPassword ? 'healthy' : 'warning',
        message: this.mockPassword ? 'Protection password is set' : 'No protection password set'
      },
      accessibilityService: {
        status: 'info',
        message: 'Accessibility service not implemented (mock)'
      }
    };

    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (!this.mockDeviceAdminEnabled) {
      overallHealth = 'critical';
    } else if (!this.mockPassword) {
      overallHealth = 'degraded';
    }

    const recommendations: string[] = [];
    if (!this.mockDeviceAdminEnabled) {
      recommendations.push('Enable device administrator privileges');
    }
    if (!this.mockPassword) {
      recommendations.push('Set up protection password');
    }
    if (recommendations.length === 0) {
      recommendations.push('All protection layers are working correctly');
    }

    return {
      overallHealth,
      layerResults,
      recommendations,
      lastCheck: new Date()
    };
  }

  // ============ AUTHENTICATION METHODS ============

  /**
   * Set up protection password
   */
  async setupProtectionPassword(password: string): Promise<boolean> {
    console.log('🔐 Mock: Setting up protection password...');
    
    if (!password || password.trim().length === 0) {
      return false;
    }
    
    this.mockPassword = password;
    return true;
  }

  /**
   * Verify protection password
   */
  async verifyProtectionPassword(password: string): Promise<boolean> {
    console.log('🔍 Mock: Verifying protection password...');
    return password === this.mockPassword;
  }

  /**
   * Check if protection password is set
   */
  async hasProtectionPassword(): Promise<boolean> {
    return !!this.mockPassword;
  }

  /**
   * Authenticate with password (legacy method)
   */
  async authenticateWithPassword(password: string): Promise<boolean> {
    return this.verifyProtectionPassword(password);
  }

  /**
   * Authenticate with PIN
   */
  async authenticateWithPIN(pin: string): Promise<boolean> {
    console.log('📱 Mock: Authenticating with PIN...');
    return pin === '1234'; // Mock PIN
  }

  /**
   * Set up PIN
   */
  async setupPIN(pin: string): Promise<boolean> {
    console.log('📱 Mock: Setting up PIN...');
    return true; // Always succeeds in mock
  }

  // ============ FOCUS SESSION INTEGRATION ============

  /**
   * Enable protection for focus session
   */
  async enableForFocusSession(): Promise<boolean> {
    const result = await this.enableProtection();
    return result.success;
  }

  /**
   * Disable protection after focus session
   */
  async disableAfterFocusSession(): Promise<boolean> {
    const result = await this.disableProtection();
    return result.success;
  }

  // ============ EMERGENCY OVERRIDE METHODS ============

  /**
   * Request emergency override
   */
  async requestEmergencyOverride(): Promise<OverrideResult> {
    console.log('🚨 Mock: Requesting emergency override...');
    
    this.mockEmergencyOverrideRequested = true;
    this.mockEmergencyOverrideTime = Date.now();
    
    return {
      success: true,
      message: 'Mock emergency override requested. You can disable protection after 24 hours cooling-off period.'
    };
  }

  /**
   * Process emergency override
   */
  async processEmergencyOverride(token: string): Promise<boolean> {
    console.log('🚨 Mock: Processing emergency override...');
    
    if (!this.mockEmergencyOverrideRequested) {
      return false;
    }
    
    // Check if 24 hours have passed (for demo, use 10 seconds)
    const currentTime = Date.now();
    const timeDiff = currentTime - this.mockEmergencyOverrideTime;
    const cooldownPeriod = 10 * 1000; // 10 seconds for demo
    
    if (timeDiff >= cooldownPeriod) {
      this.mockProtectionEnabled = false;
      this.mockEmergencyOverrideRequested = false;
      this.mockEmergencyOverrideTime = 0;
      return true;
    }
    
    return false;
  }

  // ============ UTILITY METHODS ============

  /**
   * Show error dialog
   */
  showErrorDialog(title: string, message: string, actions?: Array<{text: string, onPress?: () => void}>) {
    Alert.alert(title, message, actions || [{ text: 'OK' }]);
  }

  /**
   * Show setup explanation
   */
  showSetupExplanation(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🛡️ Mock Uninstall Protection',
        'This is a mock implementation of uninstall protection for development.\n\n' +
        '• Simulates device administrator privileges\n' +
        '• Uses mock password authentication\n' +
        '• Provides realistic status updates\n' +
        '• Includes emergency override simulation\n\n' +
        'Would you like to set up mock protection now?',
        [
          { text: 'Not Now', onPress: () => resolve(false) },
          { text: 'Set Up Mock Protection', onPress: () => resolve(true) }
        ]
      );
    });
  }
}