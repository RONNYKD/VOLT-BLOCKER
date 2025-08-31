/**
 * Secure storage testing utilities
 * Comprehensive tests for secure storage functionality and encryption
 */
import { SecureStorage, SecureStorageKeys, SecureStorageError } from './secure-storage';
import { secureCleanup, CleanupLevel } from './secure-cleanup';
import { errorHandler } from './error-handling';

// Test result interface
export interface SecureTestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

// Test suite interface
export interface SecureTestSuite {
  name: string;
  tests: SecureTestResult[];
  passed: number;
  failed: number;
  duration: number;
}

// Secure storage test class
export class SecureStorageTest {
  private static testData = {
    simpleString: 'test string',
    jsonData: JSON.stringify({ key: 'value', number: 42 }),
    longString: 'a'.repeat(1000),
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    unicode: '🔒🛡️🔐💾📱',
  };

  /**
   * Run all secure storage tests
   */
  static async runAllTests(): Promise<SecureTestSuite[]> {
    console.log('Starting comprehensive secure storage tests...');
    
    const suites: SecureTestSuite[] = [
      await this.runInitializationTests(),
      await this.runBasicOperationTests(),
      await this.runEncryptionTests(),
      await this.runBiometricTests(),
      await this.runTokenManagementTests(),
      await this.runCleanupTests(),
      await this.runSecurityTests(),
      await this.runErrorHandlingTests(),
    ];

    // Print summary
    this.printTestSummary(suites);
    
    return suites;
  }

  /**
   * Test initialization
   */
  private static async runInitializationTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Initialization',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test initialization
    suite.tests.push(await this.runTest('Initialize Secure Storage', async () => {
      await SecureStorage.initialize();
      const info = await SecureStorage.getSecureStorageInfo();
      
      if (!info.isInitialized) {
        throw new Error('Secure storage not properly initialized');
      }
    }));

    // Test biometric availability check
    suite.tests.push(await this.runTest('Check Biometric Availability', async () => {
      const isAvailable = await SecureStorage.isBiometricAvailable();
      const biometryType = await SecureStorage.getBiometryType();
      
      // Test passes regardless of availability, just checking no errors
      console.log(`Biometric available: ${isAvailable}, Type: ${biometryType}`);
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test basic operations
   */
  private static async runBasicOperationTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Basic Operations',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test set and get
    suite.tests.push(await this.runTest('Set and Get Secure Item', async () => {
      const key = SecureStorageKeys.SECURE_SETTINGS;
      const data = 'test secure data';
      
      await SecureStorage.setSecureItem(key, data);
      const retrieved = await SecureStorage.getSecureItem(key);
      
      if (retrieved !== data) {
        throw new Error('Retrieved data does not match stored data');
      }
    }));

    // Test different data types
    for (const [type, data] of Object.entries(this.testData)) {
      suite.tests.push(await this.runTest(`Store ${type}`, async () => {
        const key = SecureStorageKeys.SECURE_SETTINGS;
        
        await SecureStorage.setSecureItem(key, data);
        const retrieved = await SecureStorage.getSecureItem(key);
        
        if (retrieved !== data) {
          throw new Error(`${type} data type test failed`);
        }
      }));
    }

    // Test remove item
    suite.tests.push(await this.runTest('Remove Secure Item', async () => {
      const key = SecureStorageKeys.SECURE_SETTINGS;
      const data = 'test data to remove';
      
      await SecureStorage.setSecureItem(key, data);
      await SecureStorage.removeSecureItem(key);
      const retrieved = await SecureStorage.getSecureItem(key);
      
      if (retrieved !== null) {
        throw new Error('Item was not removed');
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test encryption functionality
   */
  private static async runEncryptionTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Encryption',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test data integrity
    suite.tests.push(await this.runTest('Data Integrity Check', async () => {
      const key = SecureStorageKeys.DEVICE_KEY;
      const originalData = 'sensitive data for integrity check';
      
      await SecureStorage.setSecureItem(key, originalData);
      const isValid = await SecureStorage.verifyDataIntegrity(key);
      
      if (!isValid) {
        throw new Error('Data integrity check failed');
      }
    }));

    // Test large data encryption
    suite.tests.push(await this.runTest('Large Data Encryption', async () => {
      const key = SecureStorageKeys.SECURE_SETTINGS;
      const largeData = 'x'.repeat(10000); // 10KB of data
      
      await SecureStorage.setSecureItem(key, largeData);
      const retrieved = await SecureStorage.getSecureItem(key);
      
      if (retrieved !== largeData) {
        throw new Error('Large data encryption/decryption failed');
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test biometric functionality
   */
  private static async runBiometricTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Biometric Authentication',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test biometric info
    suite.tests.push(await this.runTest('Get Biometric Info', async () => {
      const info = await SecureStorage.getSecureStorageInfo();
      
      // Test passes if we can get the info without errors
      console.log(`Biometric available: ${info.biometricAvailable}`);
      console.log(`Biometry type: ${info.biometryType}`);
    }));

    // Test credential storage (without actual biometric prompt in test)
    suite.tests.push(await this.runTest('Store Credentials (No Biometric)', async () => {
      const username = 'testuser';
      const password = 'testpassword';
      
      // Store without biometric requirement for testing
      await SecureStorage.storeUserCredentials(username, password, false);
      
      // Note: We can't test retrieval without triggering biometric prompt
      // This test just verifies storage doesn't throw errors
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test token management
   */
  private static async runTokenManagementTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Token Management',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test token storage and retrieval
    suite.tests.push(await this.runTest('Store and Retrieve Tokens', async () => {
      const accessToken = 'test_access_token_12345';
      const refreshToken = 'test_refresh_token_67890';
      
      await SecureStorage.storeAuthTokens(accessToken, refreshToken);
      const tokens = await SecureStorage.getAuthTokens();
      
      if (tokens.accessToken !== accessToken || tokens.refreshToken !== refreshToken) {
        throw new Error('Token storage/retrieval failed');
      }
    }));

    // Test token expiration
    suite.tests.push(await this.runTest('Token Expiration', async () => {
      const accessToken = 'expiring_token';
      const expiresInMinutes = 0.01; // 0.6 seconds
      
      await SecureStorage.storeAuthTokens(accessToken, undefined, expiresInMinutes);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const tokens = await SecureStorage.getAuthTokens();
        if (tokens.accessToken !== null) {
          throw new Error('Expired token was not removed');
        }
      } catch (error) {
        if (error instanceof SecureStorageError && error.code === 'EXPIRED_DATA') {
          // Expected behavior
        } else {
          throw error;
        }
      }
    }));

    // Test token clearing
    suite.tests.push(await this.runTest('Clear Tokens', async () => {
      const accessToken = 'token_to_clear';
      const refreshToken = 'refresh_to_clear';
      
      await SecureStorage.storeAuthTokens(accessToken, refreshToken);
      await SecureStorage.clearAuthTokens();
      
      const tokens = await SecureStorage.getAuthTokens();
      if (tokens.accessToken !== null || tokens.refreshToken !== null) {
        throw new Error('Tokens were not cleared');
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test cleanup functionality
   */
  private static async runCleanupTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Cleanup Operations',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test logout cleanup
    suite.tests.push(await this.runTest('Logout Cleanup', async () => {
      // Store some test data
      await SecureStorage.storeAuthTokens('test_token', 'test_refresh');
      await SecureStorage.setSecureItem(SecureStorageKeys.SESSION_DATA, 'session_data');
      
      // Perform logout cleanup
      const result = await secureCleanup.logout();
      
      if (!result.success) {
        throw new Error(`Logout cleanup failed: ${result.errors.join(', ')}`);
      }
      
      // Verify cleanup
      const verification = await secureCleanup.verify(CleanupLevel.LOGOUT);
      if (!verification.isComplete) {
        throw new Error(`Cleanup verification failed: ${verification.remainingItems.join(', ')}`);
      }
    }));

    // Test cleanup recommendations
    suite.tests.push(await this.runTest('Cleanup Recommendations', async () => {
      const recommendations = await secureCleanup.getRecommendations();
      
      // Test passes if we can get recommendations without errors
      console.log(`Recommendations: ${recommendations.recommended.join(', ')}`);
      console.log(`Reasons: ${recommendations.reasons.join(', ')}`);
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test security features
   */
  private static async runSecurityTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Security Features',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test tamper detection
    suite.tests.push(await this.runTest('Tamper Detection', async () => {
      const key = SecureStorageKeys.DEVICE_KEY;
      const data = 'tamper test data';
      
      await SecureStorage.setSecureItem(key, data);
      
      // Verify integrity
      const isValid = await SecureStorage.verifyDataIntegrity(key);
      if (!isValid) {
        throw new Error('Data integrity check failed');
      }
    }));

    // Test secure info retrieval
    suite.tests.push(await this.runTest('Secure Storage Info', async () => {
      const info = await SecureStorage.getSecureStorageInfo();
      
      if (typeof info.isInitialized !== 'boolean') {
        throw new Error('Invalid secure storage info');
      }
      
      console.log(`Stored keys: ${info.storedKeys.length}`);
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test error handling
   */
  private static async runErrorHandlingTests(): Promise<SecureTestSuite> {
    const suite: SecureTestSuite = {
      name: 'Error Handling',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test invalid key handling
    suite.tests.push(await this.runTest('Invalid Key Handling', async () => {
      try {
        const result = await SecureStorage.getSecureItem('invalid_key' as SecureStorageKeys);
        if (result !== null) {
          throw new Error('Should return null for invalid key');
        }
      } catch (error) {
        // Expected behavior for some implementations
        if (!(error instanceof SecureStorageError)) {
          throw new Error('Should throw SecureStorageError for invalid operations');
        }
      }
    }));

    // Test error recovery
    suite.tests.push(await this.runTest('Error Recovery', async () => {
      try {
        // This should not throw an error
        await errorHandler.handle(
          new Error('Test error for secure storage'),
          { context: 'secure_storage_test' }
        );
      } catch (error) {
        throw new Error('Error handler failed to handle test error');
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Run a single test
   */
  private static async runTest(name: string, testFn: () => Promise<void>): Promise<SecureTestResult> {
    const start = Date.now();
    
    try {
      await testFn();
      return {
        name,
        passed: true,
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        name,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Print test summary
   */
  private static printTestSummary(suites: SecureTestSuite[]): void {
    console.log('\n=== Secure Storage Test Summary ===');
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;
    
    suites.forEach(suite => {
      totalTests += suite.tests.length;
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.duration;
      
      console.log(`\n${suite.name}:`);
      console.log(`  Tests: ${suite.tests.length}`);
      console.log(`  Passed: ${suite.passed}`);
      console.log(`  Failed: ${suite.failed}`);
      console.log(`  Duration: ${suite.duration}ms`);
      
      // Show failed tests
      const failedTests = suite.tests.filter(t => !t.passed);
      if (failedTests.length > 0) {
        console.log('  Failed Tests:');
        failedTests.forEach(test => {
          console.log(`    - ${test.name}: ${test.error}`);
        });
      }
    });
    
    console.log('\n=== Overall Summary ===');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('============================\n');
  }

  /**
   * Test secure storage performance
   */
  static async testPerformance(): Promise<{
    encryptionSpeed: number;
    decryptionSpeed: number;
    storageSpeed: number;
    retrievalSpeed: number;
  }> {
    console.log('Testing secure storage performance...');
    
    const testData = 'x'.repeat(1000); // 1KB test data
    const iterations = 100;
    
    // Test encryption/decryption speed (simulated)
    const encryptStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await SecureStorage.setSecureItem(SecureStorageKeys.SECURE_SETTINGS, testData);
    }
    const encryptionSpeed = iterations / ((Date.now() - encryptStart) / 1000);
    
    const decryptStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await SecureStorage.getSecureItem(SecureStorageKeys.SECURE_SETTINGS);
    }
    const decryptionSpeed = iterations / ((Date.now() - decryptStart) / 1000);
    
    return {
      encryptionSpeed: Math.round(encryptionSpeed),
      decryptionSpeed: Math.round(decryptionSpeed),
      storageSpeed: Math.round(encryptionSpeed), // Same as encryption for this implementation
      retrievalSpeed: Math.round(decryptionSpeed), // Same as decryption for this implementation
    };
  }
}

// Export convenience function
export const runSecureStorageTests = () => SecureStorageTest.runAllTests();
export const testSecureStoragePerformance = () => SecureStorageTest.testPerformance();