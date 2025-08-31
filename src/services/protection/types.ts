/**
 * Uninstall Protection Types
 * Core TypeScript interfaces and types for the protection system
 */

// Core protection status and configuration
export interface ProtectionStatus {
  isActive: boolean;
  layers: {
    deviceAdmin: LayerStatus;
    packageMonitor: LayerStatus;
    passwordAuth: LayerStatus;
    accessibilityService: LayerStatus;
  };
  lastHealthCheck: Date;
  emergencyOverrideActive: boolean;
  focusSessionEnforced: boolean;
}

export interface LayerStatus {
  enabled: boolean;
  healthy: boolean;
  lastCheck: Date;
  error?: string;
}

// Protection operation results
export interface ProtectionResult {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export interface SetupResult {
  success: boolean;
  completedSteps: SetupStep[];
  failedSteps: SetupStep[];
  nextStep?: SetupStep;
  message: string;
}

export interface IntegrityResult {
  isIntact: boolean;
  compromisedLayers: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealthCheckResult {
  overallHealth: 'healthy' | 'degraded' | 'critical';
  layerResults: Record<string, LayerHealthResult>;
  recommendations: string[];
  lastCheck: Date;
}

export interface LayerHealthResult {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface OverrideResult {
  success: boolean;
  overrideToken?: string;
  cooldownEndsAt?: Date;
  message: string;
}

// Setup and configuration types
export type SetupStep = 
  | 'introduction'
  | 'device-admin'
  | 'accessibility'
  | 'password-setup'
  | 'confirmation';

export type AuthMethod = 'account-password' | 'pin' | 'both';

export interface Permission {
  name: string;
  granted: boolean;
  required: boolean;
  description: string;
  setupInstructions?: string;
}

// Protection configuration
export interface ProtectionConfig {
  id: string;
  userId: string;
  isEnabled: boolean;
  enabledAt: Date;
  lastModified: Date;
  
  // Layer configuration
  deviceAdminEnabled: boolean;
  packageMonitorEnabled: boolean;
  passwordAuthEnabled: boolean;
  accessibilityServiceEnabled: boolean;
  
  // Authentication settings
  authMethod: AuthMethod;
  pinHash?: string;
  pinSalt?: string;
  
  // Focus session integration
  enforceInFocusSessions: boolean;
  autoEnableWithFocus: boolean;
  
  // Emergency override
  emergencyOverrideRequested: boolean;
  emergencyOverrideRequestedAt?: Date;
  emergencyOverrideCooldownHours: number;
}

// Event logging
export interface ProtectionEvent {
  id: string;
  timestamp: Date;
  type: 'enable' | 'disable' | 'uninstall-attempt' | 'auth-success' | 'auth-failure' | 'layer-failure' | 'emergency-override';
  details: {
    source?: string;
    layerAffected?: string;
    authMethod?: string;
    errorMessage?: string;
  };
  resolved: boolean;
}

// Native module interfaces
export interface NativeUninstallProtection {
  // Core protection management
  enableProtection(): Promise<ProtectionResult>;
  disableProtection(): Promise<ProtectionResult>;
  isProtectionActive(): Promise<boolean>;
  
  // Permission and setup management
  checkPermissions(): Promise<Permission[]>;
  requestDeviceAdmin(): Promise<boolean>;
  setupProtectionLayers(): Promise<SetupResult>;
  
  // Status and monitoring
  getProtectionStatus(): Promise<ProtectionStatus>;
  verifyProtectionIntegrity(): Promise<IntegrityResult>;
  runHealthCheck(): Promise<HealthCheckResult>;
  
  // Password authentication
  setupProtectionPassword(password: string): Promise<ProtectionResult>;
  verifyProtectionPassword(password: string): Promise<boolean>;
  hasProtectionPassword(): Promise<boolean>;
  
  // Emergency and recovery
  requestEmergencyOverride(): Promise<OverrideResult>;
  processEmergencyOverride(token: string): Promise<boolean>;
}

// UI component props
export interface SetupWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  initialStep?: SetupStep;
}

export interface StatusCardProps {
  status: ProtectionStatus;
  onHealthCheck: () => void;
  onToggleProtection: () => void;
  onEmergencyOverride?: () => void;
}

export interface ProtectionToggleProps {
  isEnabled: boolean;
  isLoading: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
  disabled?: boolean;
  showExplanation?: boolean;
}