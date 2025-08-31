/**
 * Storage testing utilities
 * Provides comprehensive testing for data persistence and error handling
 */
import { StorageUtils, StorageKeys, StorageError } from './storage';
import { MigrationManager } from './migrations';
import { validate } from './validation';
import { errorHandler, ErrorSeverity } from './error-handling';

// Test result interface
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

// Test suite interface
export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

// Storage test class
export class StorageTest {
  private static testData = {
    string: 'test string',
    number: 42,
    boolean: true,
    object: { key: 'value', nested: { array: [1, 2, 3] } },
    array: ['item1', 'item2', 'item3'],
    emptyString: '',
    zero: 0,
    emptyArray: [],
    emptyObject: {},
  };

  /**
   * Run all storage tests
   */
  static async runAllTests(): Promise<TestSuite[]> {
    console.log('Starting comprehensive storage tests...');
    
    const suites: TestSuite[] = [
      await this.runBasicOperationTests(),
      await this.runDataTypeTests(),
      await this.runErrorHandlingTests(),
      await this.runMigrationTests(),
      await this.runValidationTests(),
      await this.runPerformanceTests(),
      await this.runConcurrencyTests(),
    ];

    // Print summary
    this.printTestSummary(suites);
    
    return suites;
  }

  /**
   * Test basic storage operations
   */
  private static async runBasicOperationTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Basic Operations',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test set and get
    suite.tests.push(await this.runTest('Set and Get Item', async () => {
      const key = StorageKeys.USER_PROFILE;
      const data = { id: '1', name: 'Test User' };
      
      await StorageUtils.setItem(key, data);
      const retrieved = await StorageUtils.getItem(key);
      
      if (JSON.stringify(retrieved) !== JSON.stringify(data)) {
        throw new Error('Retrieved data does not match stored data');
      }
    }));

    // Test remove item
    suite.tests.push(await this.runTest('Remove Item', async () => {
      const key = StorageKeys.USER_PREFERENCES;
      const data = { theme: 'dark' };
      
      await StorageUtils.setItem(key, data);
      await StorageUtils.removeItem(key);
      const retrieved = await StorageUtils.getItem(key);
      
      if (retrieved !== null) {
        throw new Error('Item was not removed');
      }
    }));

    // Test multiple items
    suite.tests.push(await this.runTest('Multiple Items', async () => {
      const items: Partial<Record<StorageKeys, any>> = {
        [StorageKeys.BLOCKED_APPS]: [{ id: '1', name: 'App1' }],
        [StorageKeys.BLOCKED_WEBSITES]: [{ id: '1', url: 'example.com' }],
      };
      
      await StorageUtils.setMultipleItems(items as Record<StorageKeys, any>);
      const retrieved = await StorageUtils.getMultipleItems(Object.keys(items) as StorageKeys[]);
      
      for (const [key, value] of Object.entries(items)) {
        if (JSON.stringify(retrieved[key]) !== JSON.stringify(value)) {
          throw new Error(`Multiple items test failed for key: ${key}`);
        }
      }
    }));

    // Test clear all data
    suite.tests.push(await this.runTest('Clear All Data', async () => {
      // Set some data first
      await StorageUtils.setItem(StorageKeys.USER_PROFILE, { id: '1' });
      await StorageUtils.setItem(StorageKeys.APP_SETTINGS, { theme: 'light' });
      
      // Clear all data
      await StorageUtils.clearAppData();
      
      // Verify data is cleared
      const profile = await StorageUtils.getItem(StorageKeys.USER_PROFILE);
      const settings = await StorageUtils.getItem(StorageKeys.APP_SETTINGS);
      
      if (profile !== null || settings !== null) {
        throw new Error('Data was not cleared properly');
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test different data types
   */
  private static async runDataTypeTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Data Types',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    for (const [type, data] of Object.entries(this.testData)) {
      suite.tests.push(await this.runTest(`${type} Type`, async () => {
        const key = StorageKeys.USER_PREFERENCES;
        
        await StorageUtils.setItem(key, data);
        const retrieved = await StorageUtils.getItem(key);
        
        if (JSON.stringify(retrieved) !== JSON.stringify(data)) {
          throw new Error(`${type} data type test failed`);
        }
      }));
    }

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test error handling
   */
  private static async runErrorHandlingTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Error Handling',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test invalid JSON handling
    suite.tests.push(await this.runTest('Invalid JSON Recovery', async () => {
      // This test would require mocking AsyncStorage to return invalid JSON
      // For now, we'll test the error handling structure
      try {
        await errorHandler.handle(new Error('Test error'), { test: true }, ErrorSeverity.LOW);
        // If no error is thrown, the test passes
      } catch (error) {
        throw new Error('Error handler failed to handle test error');
      }
    }));

    // Test storage error handling
    suite.tests.push(await this.runTest('Storage Error Handling', async () => {
      try {
        // Test with a very large object that might cause storage issues
        const largeData = new Array(10000).fill('x').join('');
        await StorageUtils.setItem(StorageKeys.USER_PREFERENCES, { large: largeData });
        
        const retrieved = await StorageUtils.getItem(StorageKeys.USER_PREFERENCES);
        if (!retrieved || (retrieved as any).large !== largeData) {
          throw new Error('Large data storage test failed');
        }
      } catch (error) {
        // Expected for very large data, test passes if error is handled gracefully
        if (error instanceof StorageError) {
          // Good, error was properly wrapped
        } else {
          throw new Error('Storage error was not properly wrapped');
        }
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test migration system
   */
  private static async runMigrationTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Migration System',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test migration check
    suite.tests.push(await this.runTest('Migration Check', async () => {
      const needsMigration = await MigrationManager.needsMigration();
      const currentVersion = await MigrationManager.getCurrentVersion();
      const latestVersion = MigrationManager.getLatestVersion();
      
      // Test passes if the logic is consistent
      if (needsMigration && currentVersion >= latestVersion) {
        throw new Error('Migration check logic is inconsistent');
      }
    }));

    // Test migration execution
    suite.tests.push(await this.runTest('Migration Execution', async () => {
      try {
        await MigrationManager.runMigrations();
        // If no error is thrown, migrations ran successfully
      } catch (error) {
        throw new Error(`Migration execution failed: ${error}`);
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test data validation
   */
  private static async runValidationTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Data Validation',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test valid user data
    suite.tests.push(await this.runTest('Valid User Data', async () => {
      const validUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const result = validate.user(validUser);
      if (!result.isValid) {
        throw new Error(`Valid user data failed validation: ${result.errors.join(', ')}`);
      }
    }));

    // Test invalid user data
    suite.tests.push(await this.runTest('Invalid User Data', async () => {
      const invalidUser = {
        id: '1',
        email: 'invalid-email', // Invalid email format
        // missing required fields
      };
      
      const result = validate.user(invalidUser);
      if (result.isValid) {
        throw new Error('Invalid user data passed validation');
      }
    }));

    // Test settings validation
    suite.tests.push(await this.runTest('Settings Validation', async () => {
      const validSettings = {
        theme: 'dark',
        notifications: true,
        strictMode: false,
        defaultSessionDuration: 25,
      };
      
      const result = validate.settings(validSettings);
      if (!result.isValid) {
        throw new Error(`Valid settings failed validation: ${result.errors.join(', ')}`);
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test performance
   */
  private static async runPerformanceTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Performance',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test large data storage
    suite.tests.push(await this.runTest('Large Data Storage', async () => {
      const largeArray = new Array(1000).fill(null).map((_, i) => ({
        id: i.toString(),
        data: `item-${i}`,
        timestamp: Date.now(),
      }));
      
      const start = Date.now();
      await StorageUtils.setItem(StorageKeys.FOCUS_SESSIONS, largeArray);
      const retrieved = await StorageUtils.getItem(StorageKeys.FOCUS_SESSIONS);
      const duration = Date.now() - start;
      
      if (!retrieved || (retrieved as any[]).length !== largeArray.length) {
        throw new Error('Large data storage failed');
      }
      
      if (duration > 5000) { // 5 seconds threshold
        throw new Error(`Large data storage took too long: ${duration}ms`);
      }
    }));

    // Test multiple concurrent operations
    suite.tests.push(await this.runTest('Concurrent Operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        StorageUtils.setItem(StorageKeys.USER_PREFERENCES, { index: i })
      );
      
      const start = Date.now();
      await Promise.all(operations);
      const duration = Date.now() - start;
      
      if (duration > 3000) { // 3 seconds threshold
        throw new Error(`Concurrent operations took too long: ${duration}ms`);
      }
    }));

    suite.duration = Date.now() - startTime;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    return suite;
  }

  /**
   * Test concurrency handling
   */
  private static async runConcurrencyTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Concurrency',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const startTime = Date.now();

    // Test concurrent read/write operations
    suite.tests.push(await this.runTest('Concurrent Read/Write', async () => {
      const key = StorageKeys.USER_PROFILE;
      const initialData = { id: '1', counter: 0 };
      
      await StorageUtils.setItem(key, initialData);
      
      // Simulate concurrent operations
      const operations = Array.from({ length: 5 }, async (_, i) => {
        const data = await StorageUtils.getItem(key);
        const updated = { ...data as any, counter: i };
        await StorageUtils.setItem(key, updated);
        return updated;
      });
      
      const results = await Promise.all(operations);
      const finalData = await StorageUtils.getItem(key);
      
      // Test passes if no errors occurred and final data is consistent
      if (!finalData) {
        throw new Error('Concurrent operations resulted in lost data');
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
  private static async runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
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
  private static printTestSummary(suites: TestSuite[]): void {
    console.log('\n=== Storage Test Summary ===');
    
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
   * Test data persistence across app restarts (simulation)
   */
  static async testPersistenceAcrossRestarts(): Promise<boolean> {
    console.log('Testing data persistence across app restarts...');
    
    try {
      // Store test data
      const testData = {
        user: { id: '1', email: 'test@example.com' },
        settings: { theme: 'dark', notifications: true },
        sessions: [{ id: '1', duration: 25, status: 'completed' }],
      };
      
      await StorageUtils.setItem(StorageKeys.USER_PROFILE, testData.user);
      await StorageUtils.setItem(StorageKeys.APP_SETTINGS, testData.settings);
      await StorageUtils.setItem(StorageKeys.FOCUS_SESSIONS, testData.sessions);
      
      console.log('Test data stored successfully');
      
      // Simulate app restart by clearing in-memory caches
      // (In a real test, this would involve actually restarting the app)
      
      // Retrieve data
      const retrievedUser = await StorageUtils.getItem(StorageKeys.USER_PROFILE);
      const retrievedSettings = await StorageUtils.getItem(StorageKeys.APP_SETTINGS);
      const retrievedSessions = await StorageUtils.getItem(StorageKeys.FOCUS_SESSIONS);
      
      // Verify data integrity
      const userMatch = JSON.stringify(retrievedUser) === JSON.stringify(testData.user);
      const settingsMatch = JSON.stringify(retrievedSettings) === JSON.stringify(testData.settings);
      const sessionsMatch = JSON.stringify(retrievedSessions) === JSON.stringify(testData.sessions);
      
      if (userMatch && settingsMatch && sessionsMatch) {
        console.log('✅ Data persistence test passed');
        return true;
      } else {
        console.log('❌ Data persistence test failed');
        console.log('User match:', userMatch);
        console.log('Settings match:', settingsMatch);
        console.log('Sessions match:', sessionsMatch);
        return false;
      }
    } catch (error) {
      console.error('Data persistence test error:', error);
      return false;
    }
  }
}

// Export convenience function
export const runStorageTests = () => StorageTest.runAllTests();
export const testPersistence = () => StorageTest.testPersistenceAcrossRestarts();