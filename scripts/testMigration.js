#!/usr/bin/env node

/**
 * Command Line Migration Test Script
 * Run this to test the migration functionality from command line
 */

const { testUserMigration, discoverLegacyData, forceMigration } = require('../dist/src/services/supabase/testMigration');

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const userId = args[1];

async function main() {
  console.log('🚀 VOLT Migration Test Tool');
  console.log('===========================');
  
  try {
    switch (command) {
      case 'discover':
        console.log('🔍 Discovering legacy tables...');
        const tables = await discoverLegacyData();
        console.log(`\n✅ Found ${tables.length} tables`);
        break;
        
      case 'test':
        if (!userId) {
          console.log('❌ Please provide a user ID');
          console.log('Usage: node scripts/testMigration.js test <user-id>');
          process.exit(1);
        }
        console.log(`🧪 Testing migration for user: ${userId}`);
        const testResult = await testUserMigration(userId);
        console.log('\n✅ Test completed:', testResult);
        break;
        
      case 'force':
        if (!userId) {
          console.log('❌ Please provide a user ID');
          console.log('Usage: node scripts/testMigration.js force <user-id>');
          process.exit(1);
        }
        console.log(`🔄 Force migrating data for user: ${userId}`);
        const forceResult = await forceMigration(userId);
        console.log('\n✅ Force migration completed:', forceResult);
        break;
        
      default:
        console.log('📖 Available commands:');
        console.log('  discover              - Discover legacy tables in database');
        console.log('  test <user-id>        - Test migration for specific user');
        console.log('  force <user-id>       - Force migration for specific user');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/testMigration.js discover');
        console.log('  node scripts/testMigration.js test abc123-def456-ghi789');
        console.log('  node scripts/testMigration.js force abc123-def456-ghi789');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main();