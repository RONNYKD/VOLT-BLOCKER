/**
 * Test Supabase Connection and Recovery Data Sync
 * Use this script to test if Supabase is working and data sync is functioning
 */
import { supabase } from '../services/supabase';
import { RecoveryDataSyncService } from '../services/RecoveryDataSyncService';
import { AppInitializationService } from '../services/AppInitializationService';

export interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  data?: any;
}

export class SupabaseConnectionTester {
  /**
   * Run all Supabase connection tests
   */
  static async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Supabase connection tests...');
    
    const results: TestResult[] = [];

    // Test 1: Supabase Initialization
    results.push(await this.testSupabaseInitialization());

    // Test 2: Database Connection
    results.push(await this.testDatabaseConnection());

    // Test 3: Table Existence
    results.push(await this.testTableExistence());

    // Test 4: Authentication Test (if user is logged in)
    results.push(await this.testAuthentication());

    // Test 5: Recovery Data Sync Test
    results.push(await this.testRecoveryDataSync());

    // Print summary
    this.printTestSummary(results);

    return results;
  }

  /**
   * Test Supabase initialization
   */
  private static async testSupabaseInitialization(): Promise<TestResult> {
    try {
      const isReady = supabase.isReady();
      
      if (!isReady) {
        // Try to initialize
        const initialized = await RecoveryDataSyncService.initializeSupabase();
        
        return {
          testName: 'Supabase Initialization',
          success: initialized,
          message: initialized ? 'Supabase initialized successfully' : 'Failed to initialize Supabase'
        };
      }

      return {
        testName: 'Supabase Initialization',
        success: true,
        message: 'Supabase already initialized'
      };
    } catch (error) {
      return {
        testName: 'Supabase Initialization',
        success: false,
        message: `Initialization failed: ${error}`
      };
    }
  }

  /**
   * Test database connection
   */
  private static async testDatabaseConnection(): Promise<TestResult> {
    try {
      if (!supabase.isReady()) {
        return {
          testName: 'Database Connection',
          success: false,
          message: 'Supabase not initialized'
        };
      }

      const client = supabase.getClient();
      
      // Simple query to test connection
      const { data, error } = await client
        .from('user_recovery_profiles')
        .select('count')
        .limit(1);

      if (error) {
        return {
          testName: 'Database Connection',
          success: false,
          message: `Database query failed: ${error.message}`
        };
      }

      return {
        testName: 'Database Connection',
        success: true,
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        testName: 'Database Connection',
        success: false,
        message: `Connection test failed: ${error}`
      };
    }
  }

  /**
   * Test table existence
   */
  private static async testTableExistence(): Promise<TestResult> {
    try {
      if (!supabase.isReady()) {
        return {
          testName: 'Table Existence',
          success: false,
          message: 'Supabase not initialized'
        };
      }

      const client = supabase.getClient();
      const requiredTables = [
        'user_recovery_profiles',
        'milestone_records',
        'daily_check_ins',
        'ai_interaction_logs'
      ];

      const tableResults = [];

      for (const table of requiredTables) {
        try {
          const { error } = await client
            .from(table)
            .select('count')
            .limit(1);

          tableResults.push({
            table,
            exists: !error,
            error: error?.message
          });
        } catch (err) {
          tableResults.push({
            table,
            exists: false,
            error: (err as Error).message
          });
        }
      }

      const allTablesExist = tableResults.every(t => t.exists);
      const existingTables = tableResults.filter(t => t.exists).map(t => t.table);
      const missingTables = tableResults.filter(t => !t.exists).map(t => t.table);

      return {
        testName: 'Table Existence',
        success: allTablesExist,
        message: allTablesExist 
          ? `All required tables exist: ${existingTables.join(', ')}`
          : `Missing tables: ${missingTables.join(', ')}. Existing: ${existingTables.join(', ')}`,
        data: tableResults
      };
    } catch (error) {
      return {
        testName: 'Table Existence',
        success: false,
        message: `Table check failed: ${error}`
      };
    }
  }

  /**
   * Test authentication
   */
  private static async testAuthentication(): Promise<TestResult> {
    try {
      if (!supabase.isReady()) {
        return {
          testName: 'Authentication',
          success: false,
          message: 'Supabase not initialized'
        };
      }

      const currentUser = await supabase.getCurrentUser();
      const currentSession = await supabase.getCurrentSession();

      if (currentUser && currentSession) {
        return {
          testName: 'Authentication',
          success: true,
          message: `User authenticated: ${currentUser.email}`,
          data: {
            userId: currentUser.id,
            email: currentUser.email,
            sessionValid: !!currentSession.access_token
          }
        };
      } else {
        return {
          testName: 'Authentication',
          success: true,
          message: 'No user currently authenticated (this is normal if not logged in)'
        };
      }
    } catch (error) {
      return {
        testName: 'Authentication',
        success: false,
        message: `Authentication check failed: ${error}`
      };
    }
  }

  /**
   * Test recovery data sync
   */
  private static async testRecoveryDataSync(): Promise<TestResult> {
    try {
      if (!supabase.isReady()) {
        return {
          testName: 'Recovery Data Sync',
          success: false,
          message: 'Supabase not initialized'
        };
      }

      const currentUser = await supabase.getCurrentUser();
      
      if (!currentUser) {
        return {
          testName: 'Recovery Data Sync',
          success: true,
          message: 'No user authenticated - sync test skipped'
        };
      }

      // Test sync for current user
      const syncResult = await RecoveryDataSyncService.syncUserRecoveryData(currentUser.id);

      return {
        testName: 'Recovery Data Sync',
        success: syncResult.success,
        message: syncResult.success 
          ? `Sync successful: ${syncResult.achievementCount} achievements, profile: ${syncResult.profileSynced}, milestones: ${syncResult.milestonesSynced}`
          : `Sync failed: ${syncResult.error}`,
        data: syncResult
      };
    } catch (error) {
      return {
        testName: 'Recovery Data Sync',
        success: false,
        message: `Sync test failed: ${error}`
      };
    }
  }

  /**
   * Print test summary
   */
  private static printTestSummary(results: TestResult[]): void {
    console.log('\n🧪 Supabase Connection Test Summary');
    console.log('=====================================');
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.message}`);
    });
    
    console.log(`\n📊 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Supabase connection is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the messages above for details.');
    }
  }

  /**
   * Quick connection test (just check if Supabase is working)
   */
  static async quickTest(): Promise<boolean> {
    try {
      console.log('🔍 Running quick Supabase connection test...');
      
      const connectionTest = await AppInitializationService.testSupabaseConnection();
      
      if (connectionTest.connected) {
        console.log('✅ Quick test passed: Supabase is connected');
        return true;
      } else {
        console.log('❌ Quick test failed:', connectionTest.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Quick test error:', error);
      return false;
    }
  }
}