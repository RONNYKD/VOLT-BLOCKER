/**
 * Test Migration Script
 * Use this to test the legacy data migration functionality
 */
import { userLoginMigrationService } from './UserLoginMigrationService';
import { legacyDataMigrationService } from './LegacyDataMigrationService';

/**
 * Test migration for a specific user
 */
export async function testUserMigration(userId: string) {
  console.log('🧪 Testing migration for user:', userId);
  console.log('=====================================');
  
  try {
    // Step 1: Discover available tables
    console.log('📋 Step 1: Discovering legacy tables...');
    const tables = await legacyDataMigrationService.discoverLegacyTables();
    console.log('Found tables:', tables);
    console.log('');

    // Step 2: Check migration status
    console.log('🔍 Step 2: Checking migration status...');
    const status = await userLoginMigrationService.checkMigrationStatus(userId);
    console.log('Migration status:', status);
    console.log('');

    // Step 3: Get migration summary
    console.log('📊 Step 3: Getting migration summary...');
    const summary = await legacyDataMigrationService.getMigrationSummary(userId);
    console.log('Migration summary:', summary);
    console.log('');

    // Step 4: Perform login migration if needed
    console.log('🔐 Step 4: Simulating user login...');
    const loginResult = await userLoginMigrationService.handleUserLogin(userId);
    console.log('Login result:', loginResult);
    console.log('');

    // Step 5: Get final data summary
    console.log('📈 Step 5: Getting final data summary...');
    const finalSummary = await userLoginMigrationService.getUserDataSummary(userId);
    console.log('Final summary:', {
      hasProfile: !!finalSummary.profile,
      totalMilestones: finalSummary.totalMilestones,
      recentMilestones: finalSummary.recentMilestones.length,
      migrationStatus: finalSummary.migrationStatus
    });
    console.log('');

    console.log('✅ Migration test completed successfully!');
    console.log('=====================================');
    
    return {
      success: true,
      tablesFound: tables.length,
      migrationPerformed: loginResult.migrationPerformed,
      achievementsMigrated: loginResult.migrationResult?.achievementsMigrated || 0,
      finalMilestones: finalSummary.totalMilestones
    };
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    console.log('=====================================');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test migration for multiple users
 */
export async function testMultipleUserMigrations(userIds: string[]) {
  console.log('🧪 Testing migration for multiple users:', userIds);
  console.log('==========================================');
  
  const results = [];
  
  for (const userId of userIds) {
    console.log(`\n🔄 Testing user: ${userId}`);
    console.log('-------------------');
    
    const result = await testUserMigration(userId);
    results.push({ userId, ...result });
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Summary of all migrations:');
  console.log('==============================');
  
  results.forEach(result => {
    console.log(`User ${result.userId}:`, {
      success: result.success,
      migrated: result.achievementsMigrated || 0,
      finalMilestones: result.finalMilestones || 0
    });
  });
  
  return results;
}

/**
 * Discover and display all legacy tables
 */
export async function discoverLegacyData() {
  console.log('🔍 Discovering legacy data structure...');
  console.log('=======================================');
  
  try {
    const tables = await legacyDataMigrationService.discoverLegacyTables();
    
    console.log(`📋 Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`  - ${table}`));
    
    return tables;
  } catch (error) {
    console.error('❌ Error discovering legacy data:', error);
    return [];
  }
}

/**
 * Force migration for a user (bypass checks)
 */
export async function forceMigration(userId: string) {
  console.log(`🔄 Force migrating data for user: ${userId}`);
  console.log('=====================================');
  
  try {
    const result = await userLoginMigrationService.forceMigration(userId);
    console.log('Migration result:', result);
    
    if (result.success) {
      console.log(`✅ Successfully migrated ${result.achievementsMigrated} achievements`);
    } else {
      console.log('❌ Migration failed:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Force migration failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Example usage functions (uncomment to test):

/*
// Test with a specific user ID
testUserMigration('your-user-id-here');

// Discover what tables exist
discoverLegacyData();

// Force migration for a user
forceMigration('your-user-id-here');

// Test multiple users
testMultipleUserMigrations(['user1', 'user2', 'user3']);
*/