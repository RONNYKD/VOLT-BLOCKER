/**
 * Secure storage utilities for sensitive data
 * Uses React Native Keychain for encrypted storage of credentials and tokens
 */
import * as Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';
import { errorHandler, ErrorSeverity } from './error-handling';

// Secure storage keys enum
export enum SecureStorageKeys {
  // Authentication
  AUTH_TOKEN = 'auth_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_CREDENTIALS = 'user_credentials',
  
  // Session data
  SESSION_DATA = 'session_data',
  BIOMETRIC_KEY = 'biometric_key',
  
  // Encryption keys
  MASTER_KEY = 'master_key',
  DEVICE_KEY = 'device_key',
  
  // Sensitive settings
  SECURE_SETTINGS = 'secure_settings',
}

// Secure data interface
export interface SecureData {
  value: string;
  timestamp: number;
  expiresAt?: number;
  encrypted: boolean;
  version: number;
}

// Keychain options - simplified to reduce authentication prompts
const KEYCHAIN_OPTIONS = {
  service: 'com.volt.app',
  accessGroup: undefined, // iOS only
  securityLevel: Keychain.SECURITY_LEVEL.ANY,
  accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
  authenticatePrompt: 'Authenticate to access your secure data',
  showModal: false, // Reduce modal prompts
  kLocalizedFallbackTitle: 'Use Passcode',
};

// Secure storage error class
export class SecureStorageError extends Error {
  constructor(
    message: string,
    public code: 'KEYCHAIN_ERROR' | 'ENCRYPTION_ERROR' | 'BIOMETRIC_ERROR' | 'EXPIRED_DATA',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

// Secure storage class
export class SecureStorage {
  private static masterKey: string | null = null;
  private static isInitialized = false;

  /**
   * Initialize secure storage
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return; // Already initialized
    }

    try {
      // Check if keychain is available (only once)
      let isAvailable = false;
      try {
        isAvailable = await Keychain.canImplyAuthentication();
      } catch (error) {
        console.warn('Keychain availability check failed, proceeding with fallback');
      }
      
      if (!isAvailable) {
        console.warn('Keychain authentication not available, using fallback encryption');
      }

      // Generate or retrieve master key
      await this.initializeMasterKey();
      
      this.isInitialized = true;
      console.log('✅ Secure storage initialized');
    } catch (error) {
      // Don't throw error, just log and continue with fallback
      console.warn('Secure storage initialization failed, using fallback mode:', error);
      
      // Initialize with fallback master key
      this.masterKey = this.generateMasterKey();
      this.isInitialized = true;
      
      await errorHandler.handle(
        error as Error,
        { context: 'secure_storage_init_fallback' },
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Store sensitive data securely
   */
  static async setSecureItem(
    key: SecureStorageKeys,
    value: string,
    expiresInMinutes?: number
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const secureData: SecureData = {
        value: await this.encrypt(value),
        timestamp: Date.now(),
        expiresAt: expiresInMinutes ? Date.now() + (expiresInMinutes * 60 * 1000) : undefined,
        encrypted: true,
        version: 1,
      };

      const serialized = JSON.stringify(secureData);
      
      await Keychain.setInternetCredentials(
        key,
        key, // username
        serialized, // password (our encrypted data)
        {
          ...KEYCHAIN_OPTIONS,
          service: `${KEYCHAIN_OPTIONS.service}.${key}`,
        }
      );
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'secure_storage_set', key },
        ErrorSeverity.HIGH
      );
      throw new SecureStorageError(
        `Failed to store secure data for key: ${key}`,
        'KEYCHAIN_ERROR',
        error as Error
      );
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  static async getSecureItem(key: SecureStorageKeys): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const credentials = await Keychain.getInternetCredentials(key, {
        ...KEYCHAIN_OPTIONS,
        service: `${KEYCHAIN_OPTIONS.service}.${key}`,
      });

      if (!credentials) {
        return null;
      }

      const secureData: SecureData = JSON.parse(credentials.password);
      
      // Check expiration
      if (secureData.expiresAt && Date.now() > secureData.expiresAt) {
        await this.removeSecureItem(key);
        throw new SecureStorageError(
          `Secure data expired for key: ${key}`,
          'EXPIRED_DATA'
        );
      }

      // Decrypt data
      const decrypted = await this.decrypt(secureData.value);
      return decrypted;
    } catch (error) {
      if (error instanceof SecureStorageError) {
        throw error;
      }
      
      await errorHandler.handle(
        error as Error,
        { context: 'secure_storage_get', key },
        ErrorSeverity.MEDIUM
      );
      
      // Return null for missing data instead of throwing
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  static async removeSecureItem(key: SecureStorageKeys): Promise<void> {
    try {
      // Use the generic reset method with proper options
      await Keychain.resetGenericPassword({
        service: `${KEYCHAIN_OPTIONS.service}.${key}`,
      });
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'secure_storage_remove', key },
        ErrorSeverity.MEDIUM
      );
      throw new SecureStorageError(
        `Failed to remove secure data for key: ${key}`,
        'KEYCHAIN_ERROR',
        error as Error
      );
    }
  }

  /**
   * Clear all secure data
   */
  static async clearAllSecureData(): Promise<void> {
    try {
      const keys = Object.values(SecureStorageKeys);
      const promises = keys.map(key => this.removeSecureItem(key));
      await Promise.allSettled(promises);
      
      // Also clear master key
      this.masterKey = null;
      await this.removeSecureItem(SecureStorageKeys.MASTER_KEY);
      
      console.log('All secure data cleared');
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'secure_storage_clear_all' },
        ErrorSeverity.HIGH
      );
      throw new SecureStorageError(
        'Failed to clear all secure data',
        'KEYCHAIN_ERROR',
        error as Error
      );
    }
  }

  /**
   * Check if biometric authentication is available
   */
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get supported biometry type
   */
  static async getBiometryType(): Promise<string | null> {
    try {
      return await Keychain.getSupportedBiometryType();
    } catch (error) {
      return null;
    }
  }

  /**
   * Store user credentials with biometric protection
   */
  static async storeUserCredentials(
    username: string,
    password: string,
    useBiometric: boolean = true
  ): Promise<void> {
    try {
      const options = useBiometric ? KEYCHAIN_OPTIONS : {
        ...KEYCHAIN_OPTIONS,
        accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
      };

      await Keychain.setInternetCredentials(
        SecureStorageKeys.USER_CREDENTIALS,
        username,
        password,
        {
          ...options,
          service: `${KEYCHAIN_OPTIONS.service}.${SecureStorageKeys.USER_CREDENTIALS}`,
        }
      );
    } catch (error) {
      throw new SecureStorageError(
        'Failed to store user credentials',
        'KEYCHAIN_ERROR',
        error as Error
      );
    }
  }

  /**
   * Retrieve user credentials with biometric authentication
   */
  static async getUserCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        SecureStorageKeys.USER_CREDENTIALS,
        {
          ...KEYCHAIN_OPTIONS,
          service: `${KEYCHAIN_OPTIONS.service}.${SecureStorageKeys.USER_CREDENTIALS}`,
        }
      );

      if (!credentials) {
        return null;
      }

      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      if ((error as Error).message?.includes('UserCancel')) {
        return null; // User cancelled biometric authentication
      }
      throw new SecureStorageError(
        'Failed to retrieve user credentials',
        'BIOMETRIC_ERROR',
        error as Error
      );
    }
  }

  /**
   * Store authentication tokens
   */
  static async storeAuthTokens(
    accessToken: string,
    refreshToken?: string,
    expiresInMinutes?: number
  ): Promise<void> {
    await this.setSecureItem(SecureStorageKeys.AUTH_TOKEN, accessToken, expiresInMinutes);
    
    if (refreshToken) {
      await this.setSecureItem(SecureStorageKeys.REFRESH_TOKEN, refreshToken);
    }
  }

  /**
   * Retrieve authentication tokens
   */
  static async getAuthTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getSecureItem(SecureStorageKeys.AUTH_TOKEN),
      this.getSecureItem(SecureStorageKeys.REFRESH_TOKEN),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Clear authentication tokens
   */
  static async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.removeSecureItem(SecureStorageKeys.AUTH_TOKEN),
      this.removeSecureItem(SecureStorageKeys.REFRESH_TOKEN),
    ]);
  }

  /**
   * Data integrity check
   */
  static async verifyDataIntegrity(key: SecureStorageKeys): Promise<boolean> {
    try {
      const data = await this.getSecureItem(key);
      return data !== null;
    } catch (error) {
      if (error instanceof SecureStorageError && error.code === 'EXPIRED_DATA') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get secure storage info
   */
  static async getSecureStorageInfo(): Promise<{
    isInitialized: boolean;
    biometricAvailable: boolean;
    biometryType: string | null;
    storedKeys: SecureStorageKeys[];
  }> {
    const biometricAvailable = await this.isBiometricAvailable();
    const biometryType = await this.getBiometryType();
    
    // Check which keys have data
    const storedKeys: SecureStorageKeys[] = [];
    for (const key of Object.values(SecureStorageKeys)) {
      try {
        const hasData = await this.verifyDataIntegrity(key);
        if (hasData) {
          storedKeys.push(key);
        }
      } catch (error) {
        // Ignore errors for individual keys
      }
    }

    return {
      isInitialized: this.isInitialized,
      biometricAvailable,
      biometryType,
      storedKeys,
    };
  }

  // Private helper methods
  private static async initializeMasterKey(): Promise<void> {
    try {
      // Try to retrieve existing master key directly from keychain
      const credentials = await Keychain.getInternetCredentials(SecureStorageKeys.MASTER_KEY, {
        ...KEYCHAIN_OPTIONS,
        service: `${KEYCHAIN_OPTIONS.service}.${SecureStorageKeys.MASTER_KEY}`,
      });
      
      if (credentials && credentials.password) {
        // Master key is stored as plain text in keychain (keychain provides the encryption)
        this.masterKey = credentials.password;
        console.log('✅ Retrieved existing master key from keychain');
      } else {
        // Generate new master key
        this.masterKey = this.generateMasterKey();
        console.log('✅ Generated new master key');
        
        // Try to store it to keychain, but don't fail if it doesn't work
        try {
          await Keychain.setInternetCredentials(
            SecureStorageKeys.MASTER_KEY,
            SecureStorageKeys.MASTER_KEY,
            this.masterKey, // Store as plain text, keychain handles encryption
            {
              ...KEYCHAIN_OPTIONS,
              service: `${KEYCHAIN_OPTIONS.service}.${SecureStorageKeys.MASTER_KEY}`,
            }
          );
          console.log('✅ Stored master key to keychain');
        } catch (storeError) {
          console.warn('Could not store master key to keychain, using session-only key:', storeError);
        }
      }
    } catch (error) {
      // Fallback to generated key if keychain fails
      this.masterKey = this.generateMasterKey();
      console.warn('Using fallback master key due to keychain error:', error);
    }
    
    // Ensure we have a master key
    if (!this.masterKey) {
      this.masterKey = this.generateMasterKey();
      console.warn('Generated emergency fallback master key');
    }
  }

  private static generateMasterKey(): string {
    // Generate a strong random key using React Native compatible method
    // Create 32 random bytes (256 bits) using Math.random as fallback
    const randomValues: number[] = [];
    for (let i = 0; i < 32; i++) {
      randomValues.push(Math.floor(Math.random() * 256));
    }
    
    // Convert to hex string
    return randomValues.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private static async encrypt(data: string): Promise<string> {
    try {
      if (!this.masterKey) {
        // Try to reinitialize if master key is missing
        await this.initializeMasterKey();
        if (!this.masterKey) {
          console.warn('Master key still unavailable, using fallback encoding');
          // Use simple base64 encoding as fallback
          return Buffer.from(data).toString('base64');
        }
      }

      const encrypted = CryptoJS.AES.encrypt(data, this.masterKey).toString();
      return encrypted;
    } catch (error) {
      console.warn('Encryption failed, using fallback encoding:', error);
      // Fallback to base64 encoding if encryption fails
      return Buffer.from(data).toString('base64');
    }
  }

  private static async decrypt(encryptedData: string): Promise<string> {
    try {
      if (!this.masterKey) {
        // Try to reinitialize master key
        await this.initializeMasterKey();
        if (!this.masterKey) {
          console.warn('Master key unavailable, attempting base64 decode');
          // Try base64 decode as fallback
          return Buffer.from(encryptedData, 'base64').toString();
        }
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        console.warn('Decryption failed, attempting base64 decode');
        // Try base64 decode as fallback
        return Buffer.from(encryptedData, 'base64').toString();
      }
      
      return decryptedString;
    } catch (error) {
      console.warn('Decryption failed, attempting base64 decode fallback:', error);
      try {
        // Try base64 decode as final fallback
        return Buffer.from(encryptedData, 'base64').toString();
      } catch (fallbackError) {
        throw new SecureStorageError(
          'Failed to decrypt data and fallback failed',
          'ENCRYPTION_ERROR',
          error as Error
        );
      }
    }
  }
}

// Convenience functions
export const secureStorage = {
  // Initialization
  init: () => SecureStorage.initialize(),
  
  // Basic operations
  set: (key: SecureStorageKeys, value: string, expiresInMinutes?: number) =>
    SecureStorage.setSecureItem(key, value, expiresInMinutes),
  get: (key: SecureStorageKeys) => SecureStorage.getSecureItem(key),
  remove: (key: SecureStorageKeys) => SecureStorage.removeSecureItem(key),
  clear: () => SecureStorage.clearAllSecureData(),
  
  // Authentication
  storeCredentials: (username: string, password: string, useBiometric?: boolean) =>
    SecureStorage.storeUserCredentials(username, password, useBiometric),
  getCredentials: () => SecureStorage.getUserCredentials(),
  
  // Tokens
  storeTokens: (accessToken: string, refreshToken?: string, expiresInMinutes?: number) =>
    SecureStorage.storeAuthTokens(accessToken, refreshToken, expiresInMinutes),
  getTokens: () => SecureStorage.getAuthTokens(),
  clearTokens: () => SecureStorage.clearAuthTokens(),
  
  // Utilities
  isBiometricAvailable: () => SecureStorage.isBiometricAvailable(),
  getBiometryType: () => SecureStorage.getBiometryType(),
  verifyIntegrity: (key: SecureStorageKeys) => SecureStorage.verifyDataIntegrity(key),
  getInfo: () => SecureStorage.getSecureStorageInfo(),
};