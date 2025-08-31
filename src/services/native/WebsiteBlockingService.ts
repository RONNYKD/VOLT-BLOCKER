/**
 * Website Blocking Service
 * Handles native website blocking functionality for Android
 */
import { NativeModules, Alert } from 'react-native';

// Define the native module interface
interface WebsiteBlockingModule {
  // Website management
  addBlockedWebsite(domain: string, url: string, title: string): Promise<boolean>;
  removeBlockedWebsite(domain: string): Promise<boolean>;
  updateBlockedWebsites(websites: BlockedWebsiteInput[]): Promise<boolean>;
  getBlockedWebsites(): Promise<BlockedWebsiteNative[]>;
  
  // Website blocking control
  startWebsiteBlocking(): Promise<boolean>;
  stopWebsiteBlocking(): Promise<boolean>;
  isWebsiteBlockingActive(): Promise<boolean>;
  
  // Browser monitoring
  getSupportedBrowsers(): Promise<BrowserInfo[]>;
  getCurrentBrowserUrl(): Promise<string | null>;
}

export interface BlockedWebsiteInput {
  domain: string;
  url: string;
  title?: string;
  isBlocked?: boolean;
}

export interface BlockedWebsiteNative {
  domain: string;
  url: string;
  title: string;
  isBlocked: boolean;
}

export interface BrowserInfo {
  packageName: string;
  appName: string;
  urlExtractionMethod: string;
  isSupported: boolean;
}

export interface WebsiteBlockingStatus {
  isActive: boolean;
  blockedWebsites: string[];
  supportedBrowsers: string[];
}

class WebsiteBlockingService {
  private nativeModule: WebsiteBlockingModule | null = null;
  private isInitialized = false;

  constructor() {
    // Try to get the native module
    console.log('Available NativeModules:', Object.keys(NativeModules));
    this.nativeModule = NativeModules.VoltWebsiteBlocking || null;
    
    if (!this.nativeModule) {
      console.warn('VoltWebsiteBlocking native module not found. Available modules:', Object.keys(NativeModules));
      console.warn('Website blocking features will be limited.');
    } else {
      console.log('✅ VoltWebsiteBlocking native module found!');
    }
  }

  /**
   * Initialize the website blocking service
   */
  async initialize(): Promise<boolean> {
    if (!this.nativeModule) {
      console.warn('Native website blocking module not available');
      return false;
    }

    try {
      // Check if website blocking is currently active
      const isActive = await this.nativeModule.isWebsiteBlockingActive();
      console.log('Website blocking service initialized. Active:', isActive);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize WebsiteBlockingService:', error);
      return false;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.nativeModule !== null;
  }

  // ============ WEBSITE MANAGEMENT METHODS ============

  /**
   * Add a website to the blocked list
   */
  async addBlockedWebsite(url: string, title?: string): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Adding blocked website:', url);
      return true;
    }

    try {
      // Extract domain from URL
      const domain = this.extractDomainFromUrl(url);
      if (!domain) {
        throw new Error('Invalid URL: Cannot extract domain');
      }

      const websiteTitle = title || domain;
      const success = await this.nativeModule.addBlockedWebsite(domain, url, websiteTitle);
      
      if (success) {
        console.log('Successfully added blocked website:', domain);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to add blocked website:', error);
      return false;
    }
  }

  /**
   * Remove a website from the blocked list
   */
  async removeBlockedWebsite(domain: string): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Removing blocked website:', domain);
      return true;
    }

    try {
      const success = await this.nativeModule.removeBlockedWebsite(domain);
      
      if (success) {
        console.log('Successfully removed blocked website:', domain);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to remove blocked website:', error);
      return false;
    }
  }

  /**
   * Update the entire blocked websites list
   */
  async updateBlockedWebsites(websites: BlockedWebsiteInput[]): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Updating blocked websites:', websites.length);
      return true;
    }

    try {
      const success = await this.nativeModule.updateBlockedWebsites(websites);
      
      if (success) {
        console.log('Successfully updated blocked websites:', websites.length);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to update blocked websites:', error);
      return false;
    }
  }

  /**
   * Get all blocked websites
   */
  async getBlockedWebsites(): Promise<BlockedWebsiteNative[]> {
    if (!this.nativeModule) {
      // Return mock data for development
      return this.getMockBlockedWebsites();
    }

    try {
      const websites = await this.nativeModule.getBlockedWebsites();
      return websites;
    } catch (error) {
      console.error('Failed to get blocked websites:', error);
      return this.getMockBlockedWebsites();
    }
  }

  // ============ WEBSITE BLOCKING CONTROL METHODS ============

  /**
   * Start website blocking
   */
  async startWebsiteBlocking(): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Starting website blocking');
      return true;
    }

    try {
      const success = await this.nativeModule.startWebsiteBlocking();
      
      if (success) {
        console.log('Successfully started website blocking');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to start website blocking:', error);
      return false;
    }
  }

  /**
   * Stop website blocking
   */
  async stopWebsiteBlocking(): Promise<boolean> {
    if (!this.nativeModule) {
      console.log('Mock: Stopping website blocking');
      return true;
    }

    try {
      const success = await this.nativeModule.stopWebsiteBlocking();
      
      if (success) {
        console.log('Successfully stopped website blocking');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to stop website blocking:', error);
      return false;
    }
  }

  /**
   * Check if website blocking is currently active
   */
  async isWebsiteBlockingActive(): Promise<boolean> {
    if (!this.nativeModule) {
      return false;
    }

    try {
      return await this.nativeModule.isWebsiteBlockingActive();
    } catch (error) {
      console.error('Failed to check website blocking status:', error);
      return false;
    }
  }

  // ============ BROWSER MONITORING METHODS ============

  /**
   * Get list of supported browsers
   */
  async getSupportedBrowsers(): Promise<BrowserInfo[]> {
    if (!this.nativeModule) {
      return this.getMockSupportedBrowsers();
    }

    try {
      const browsers = await this.nativeModule.getSupportedBrowsers();
      return browsers;
    } catch (error) {
      console.error('Failed to get supported browsers:', error);
      return this.getMockSupportedBrowsers();
    }
  }

  /**
   * Get current browser URL (if available)
   */
  async getCurrentBrowserUrl(): Promise<string | null> {
    if (!this.nativeModule) {
      return null;
    }

    try {
      return await this.nativeModule.getCurrentBrowserUrl();
    } catch (error) {
      console.error('Failed to get current browser URL:', error);
      return null;
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Extract domain from URL string
   */
  private extractDomainFromUrl(url: string): string | null {
    try {
      // Add protocol if missing
      let normalizedUrl = url.trim();
      if (!normalizedUrl.match(/^https?:\/\//)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const urlObj = new URL(normalizedUrl);
      let domain = urlObj.hostname.toLowerCase();

      // Remove www. prefix
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }

      return domain;
    } catch (error) {
      console.error('Failed to extract domain from URL:', url, error);
      return null;
    }
  }

  /**
   * Validate URL format
   */
  validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || url.trim().length === 0) {
      return { isValid: false, error: 'URL cannot be empty' };
    }

    const domain = this.extractDomainFromUrl(url);
    if (!domain) {
      return { isValid: false, error: 'Invalid URL format' };
    }

    // Basic domain validation
    if (domain.length < 3 || !domain.includes('.')) {
      return { isValid: false, error: 'Invalid domain format' };
    }

    return { isValid: true };
  }

  /**
   * Show website blocking permission dialog
   */
  async showWebsiteBlockingInfo(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        'Website Blocking',
        'Website blocking monitors your browser activity to block access to distracting websites during focus sessions.\n\nThis feature works with most popular browsers including Chrome, Firefox, and Samsung Internet.',
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

  private getMockBlockedWebsites(): BlockedWebsiteNative[] {
    return [
      {
        domain: 'facebook.com',
        url: 'https://facebook.com',
        title: 'Facebook',
        isBlocked: true,
      },
      {
        domain: 'twitter.com',
        url: 'https://twitter.com',
        title: 'Twitter',
        isBlocked: true,
      },
      {
        domain: 'instagram.com',
        url: 'https://instagram.com',
        title: 'Instagram',
        isBlocked: true,
      },
    ];
  }

  private getMockSupportedBrowsers(): BrowserInfo[] {
    return [
      {
        packageName: 'com.android.chrome',
        appName: 'Chrome',
        urlExtractionMethod: 'address_bar_node',
        isSupported: true,
      },
      {
        packageName: 'org.mozilla.firefox',
        appName: 'Firefox',
        urlExtractionMethod: 'url_bar_node',
        isSupported: true,
      },
      {
        packageName: 'com.sec.android.app.sbrowser',
        appName: 'Samsung Internet',
        urlExtractionMethod: 'address_bar_node',
        isSupported: true,
      },
    ];
  }
}

// Export singleton instance
export const websiteBlockingService = new WebsiteBlockingService();
export default WebsiteBlockingService;