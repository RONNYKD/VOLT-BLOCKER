/**
 * Secure Key Manager - Handles secure storage and retrieval of API keys
 * Uses React Native Keychain for secure storage
 */
import * as Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

export interface KeyManagerConfig {
  service: string;
  accessGroup?: string;
  touchID?: boolean;
  showModal?: boolean;
}

export interface StoredKey {
  key: string;
  createdAt: Date;
  lastUsed: Date;
  isValid: boolean;
}

class SecureKeyManager {
  private readonly SERVICE_NAME = 'VOLT_AI_KEYS';
  private readonly GEMINI_KEY_ID = 'gemini_api_key';
  private config: KeyManagerConfig;

  constructor() {
    this.config = {
      service: this.SERVICE_NAME,
      touchID: false,
      showModal: false,
    };
  }

  /**
   * Store Gemini API key securely
   */
  async storeGeminiKey(apiKey: string): Promise<boolean> {
    try {
      if (!this.validateApiKey(apiKey)) {
        throw new Error('Invalid API key format');
      }

      const keyData: StoredKey = {
        key: apiKey,
        createdAt: new Date(),
        lastUsed: new Date(),
        isValid: true,
      };

      const success = await Keychain.setInternetCredentials(
        this.GEMINI_KEY_ID,
        this.GEMINI_KEY_ID,
        JSON.stringify(keyData),
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          accessGroup: this.config.accessGroup,
          service: this.config.service,
        }
      );

      if (success) {
        console.log('Secure Key Manager: Gemini API key stored successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Secure Key Manager: Error storing Gemini key:', error);
      return false;
    }
  }

  /**
   * Retrieve Gemini API key
   */
  async getGeminiKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.GEMINI_KEY_ID, {
        authenticationPrompt: {
          title: 'Authenticate',
          subtitle: 'Access AI features',
          description: 'Please authenticate to access AI rehabilitation features',
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
        },
        service: this.config.service,
      });

      if (credentials && credentials.password) {
        const keyData: StoredKey = JSON.parse(credentials.password);
        
        // Update last used timestamp
        keyData.lastUsed = new Date();
        await this.updateKeyData(keyData);

        return keyData.key;
      }

      return null;
    } catch (error) {
      console.error('Secure Key Manager: Error retrieving Gemini key:', error);
      return null;
    }
  }

  /**
   * Check if Gemini API key exists
   */
  async hasGeminiKey(): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.GEMINI_KEY_ID, {
        service: this.config.service,
      });

      return !!(credentials && credentials.password);
    } catch (error) {
      console.error('Secure Key Manager: Error checking for Gemini key:', error);
      return false;
    }
  }

  /**
   * Remove Gemini API key
   */
  async removeGeminiKey(): Promise<boolean> {
    try {
      const success = await Keychain.resetInternetCredentials(this.GEMINI_KEY_ID, {
        service: this.config.service,
      });

      if (success) {
        console.log('Secure Key Manager: Gemini API key removed successfully');
      }

      return success;
    } catch (error) {
      console.error('Secure Key Manager: Error removing Gemini key:', error);
      return false;
    }
  }

  /**
   * Validate API key format
   */
  private validateApiKey(apiKey: string): boolean {
    // Basic validation for Gemini API key format
    // Gemini API keys typically start with 'AIza' and are 39 characters long
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Remove whitespace
    apiKey = apiKey.trim();

    // Check length and format
    if (apiKey.length < 20 || apiKey.length > 50) {
      return false;
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    const validPattern = /^[A-Za-z0-9_-]+$/;
    return validPattern.test(apiKey);
  }

  /**
   * Update key data in secure storage
   */
  private async updateKeyData(keyData: StoredKey): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        this.GEMINI_KEY_ID,
        this.GEMINI_KEY_ID,
        JSON.stringify(keyData),
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          accessGroup: this.config.accessGroup,
          service: this.config.service,
        }
      );
    } catch (error) {
      console.error('Secure Key Manager: Error updating key data:', error);
    }
  }

  /**
   * Get key metadata without exposing the actual key
   */
  async getKeyMetadata(): Promise<Omit<StoredKey, 'key'> | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.GEMINI_KEY_ID, {
        service: this.config.service,
      });

      if (credentials && credentials.password) {
        const keyData: StoredKey = JSON.parse(credentials.password);
        
        return {
          createdAt: keyData.createdAt,
          lastUsed: keyData.lastUsed,
          isValid: keyData.isValid,
        };
      }

      return null;
    } catch (error) {
      console.error('Secure Key Manager: Error getting key metadata:', error);
      return null;
    }
  }

  /**
   * Test API key validity (without making actual API calls)
   */
  async testKeyFormat(apiKey: string): Promise<{ valid: boolean; reason?: string }> {
    if (!apiKey) {
      return { valid: false, reason: 'API key is required' };
    }

    if (!this.validateApiKey(apiKey)) {
      return { valid: false, reason: 'Invalid API key format' };
    }

    // Additional format checks for Gemini API keys
    const trimmedKey = apiKey.trim();
    
    if (!trimmedKey.startsWith('AIza')) {
      return { valid: false, reason: 'Gemini API keys should start with "AIza"' };
    }

    if (trimmedKey.length !== 39) {
      return { valid: false, reason: 'Gemini API keys should be 39 characters long' };
    }

    return { valid: true };
  }

  /**
   * Generate a masked version of the API key for display
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }

    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(apiKey.length - 8);

    return `${start}${middle}${end}`;
  }

  /**
   * Clear all stored keys (for logout or reset)
   */
  async clearAllKeys(): Promise<boolean> {
    try {
      const success = await this.removeGeminiKey();
      
      if (success) {
        console.log('Secure Key Manager: All keys cleared successfully');
      }

      return success;
    } catch (error) {
      console.error('Secure Key Manager: Error clearing all keys:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error) {
      console.error('Secure Key Manager: Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get supported biometry type
   */
  async getBiometryType(): Promise<string | null> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType;
    } catch (error) {
      console.error('Secure Key Manager: Error getting biometry type:', error);
      return null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<KeyManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): KeyManagerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const secureKeyManager = new SecureKeyManager();