#!/usr/bin/env node

/**
 * Simple Database Test Script
 * Tests basic Supabase connection and looks for any existing tables
 */

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
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.log('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleTest() {
  console.log('🚀 Simple Database Connection Test');
  console.log('==================================');
  console.log(`🔗 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
  console.log('');

  // Test with some common table names that might exist
  const testTables = [
    'profiles',
    'users', 
    'achievements',
    'milestones',
    'user_profiles',
    'user_achievements',
    'recovery_data',
    'progress',
    'streaks',
    'focus_sessions',
    'blocked_apps'
  ];

  console.log('🔍 Testing access to common table names...');
  
  let accessibleTables = [];
  let totalRows = 0;

  for (const tableName of testTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);

      if (!error) {
        accessibleTables.push(tableName);
        const rowCount = count || 0;
        totalRows += rowCount;
        console.log(`  ✅ ${tableName} - ${rowCount} rows`);
        
        // Show sample data structure if available
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`     Columns: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
        }
      }
    } catch (error) {
      // Table doesn't exist or no access
    }
  }

  console.log('');
  console.log('📊 Results:');
  console.log('===========');
  
  if (accessibleTables.length > 0) {
    console.log(`✅ Found ${accessibleTables.length} accessible tables`);
    console.log(`📋 Total rows across all tables: ${totalRows}`);
    console.log('');
    console.log('🎯 Accessible tables:');
    accessibleTables.forEach(table => console.log(`  - ${table}`));
    
    if (totalRows > 0) {
      console.log('');
      console.log('🎉 Great! You have existing data that can potentially be migrated.');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Apply the migration SQL script to create new system tables');
      console.log('2. Run migration test with a real user ID');
      console.log('');
      console.log('🔗 Apply migration script here:');
      console.log('   https://supabase.com/dashboard/project/uikrxtokvqelmndkinuc/sql');
    }
  } else {
    console.log('⚠️ No accessible tables found');
    console.log('');
    console.log('This could mean:');
    console.log('1. No tables exist yet (new database)');
    console.log('2. RLS policies prevent access with anon key');
    console.log('3. Tables have different names than expected');
    console.log('');
    console.log('💡 Try:');
    console.log('1. Check your Supabase dashboard for existing tables');
    console.log('2. Apply the migration SQL script first');
    console.log('3. Verify your anon key has proper permissions');
  }
}

// Run the test
simpleTest().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});