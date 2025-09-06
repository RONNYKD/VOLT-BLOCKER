#!/usr/bin/env node

/**
 * Quick Migration Test Script
 * A simple script to quickly test migration with your Supabase database
 */

// This script can be run directly without building
// It uses the environment variables from your .env file

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
let supabaseUrl, supabaseKey;
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const envLines = envContent.split('\n');
  for (const line of envLines) {
    if (line.startsWith('SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.log('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  console.log('🚀 Quick Migration Test');
  console.log('======================');
  console.log(`🔗 Connecting to: ${supabaseUrl}`);
  console.log('');

  try {
    // Test 1: Check connection
    console.log('📡 Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (connectionError) {
      console.log('⚠️ Could not query information_schema, but connection might still work');
    } else {
      console.log('✅ Supabase connection successful');
    }
    console.log('');

    // Test 2: Discover tables
    console.log('🔍 Discovering existing tables...');
    const commonTableNames = [
      'achievements',
      'user_achievements', 
      'milestones',
      'user_milestones',
      'profiles',
      'user_profiles',
      'recovery_data',
      'progress',
      'user_progress',
      'streaks',
      'recovery_streaks',
      // New system tables
      'user_recovery_profiles',
      'milestone_records',
      'daily_check_ins',
      'ai_interaction_logs'
    ];

    const existingTables = [];
    const tableCounts = {};

    for (const tableName of commonTableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          existingTables.push(tableName);
          tableCounts[tableName] = count || 0;
          console.log(`  ✅ ${tableName} (${count || 0} rows)`);
        }
      } catch (error) {
        // Table doesn't exist
      }
    }

    if (existingTables.length === 0) {
      console.log('  ❌ No tables found - check your database permissions');
    } else {
      console.log(`  📊 Found ${existingTables.length} accessible tables`);
    }
    console.log('');

    // Test 3: Check for users in auth.users (if accessible)
    console.log('👥 Checking for users...');
    try {
      const { count: userCount, error: userError } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true });

      if (!userError) {
        console.log(`  ✅ Found ${userCount || 0} users in auth.users`);
      } else {
        console.log('  ⚠️ Cannot access auth.users (this is normal for anon key)');
      }
    } catch (error) {
      console.log('  ⚠️ Cannot access auth.users (this is normal for anon key)');
    }
    console.log('');

    // Test 4: Sample data check
    console.log('📋 Checking for sample data...');
    const legacyTables = existingTables.filter(name => 
      name.includes('achievement') || name.includes('milestone') || name.includes('profile')
    );

    if (legacyTables.length > 0) {
      console.log('  🎯 Legacy tables found:');
      for (const table of legacyTables) {
        console.log(`    - ${table}: ${tableCounts[table]} rows`);
      }
    }

    const newTables = existingTables.filter(name => 
      ['user_recovery_profiles', 'milestone_records', 'daily_check_ins', 'ai_interaction_logs'].includes(name)
    );

    if (newTables.length > 0) {
      console.log('  🆕 New system tables found:');
      for (const table of newTables) {
        console.log(`    - ${table}: ${tableCounts[table]} rows`);
      }
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log('===========');
    console.log(`✅ Connection: Working`);
    console.log(`📋 Total tables: ${existingTables.length}`);
    console.log(`🎯 Legacy tables: ${legacyTables.length}`);
    console.log(`🆕 New system tables: ${newTables.length}`);
    
    if (legacyTables.length > 0 && newTables.length > 0) {
      console.log('');
      console.log('🎉 Ready for migration!');
      console.log('You can now test with a real user ID:');
      console.log('  npm run migration:test <user-id>');
    } else if (legacyTables.length > 0) {
      console.log('');
      console.log('⚠️ Legacy data found but new system tables missing');
      console.log('Please run the migration SQL script first:');
      console.log('  Apply the contents of apply-migration.sql to your Supabase database');
    } else if (newTables.length > 0) {
      console.log('');
      console.log('ℹ️ New system ready, no legacy data found');
      console.log('This is normal for new installations');
    } else {
      console.log('');
      console.log('⚠️ No relevant tables found');
      console.log('Please check your database setup and permissions');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
quickTest().catch(console.error);