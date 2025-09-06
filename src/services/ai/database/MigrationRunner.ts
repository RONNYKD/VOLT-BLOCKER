/**
 * Database Migration Runner
 * Handles running SQL migrations for the AI rehabilitation system
 */
import { supabase } from '../../supabase';

export interface Migration {
  id: string;
  name: string;
  sql: string;
  version: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  error?: any;
}

class MigrationRunner {
  private client = supabase.getClient();

  /**
   * Check if migrations table exists and create if not
   */
  private async ensureMigrationsTable(): Promise<void> {
    try {
      const { error } = await this.client.rpc('create_migrations_table_if_not_exists');
      
      if (error) {
        // If RPC doesn't exist, create table directly
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS migrations (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            version INTEGER NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        const { error: createError } = await this.client.rpc('execute_sql', {
          query: createTableSQL,
        });
        
        if (createError) {
          console.warn('Could not create migrations table:', createError);
        }
      }
    } catch (error) {
      console.warn('Could not ensure migrations table exists:', error);
    }
  }

  /**
   * Check if migration has been executed
   */
  private async isMigrationExecuted(migrationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('migrations')
        .select('id')
        .eq('id', migrationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error checking migration status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.warn('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Record migration as executed
   */
  private async recordMigration(migration: Migration): Promise<void> {
    try {
      const { error } = await this.client
        .from('migrations')
        .insert({
          id: migration.id,
          name: migration.name,
          version: migration.version,
        });

      if (error) {
        console.warn('Could not record migration:', error);
      }
    } catch (error) {
      console.warn('Could not record migration:', error);
    }
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration: Migration): Promise<MigrationResult> {
    try {
      console.log(`Executing migration: ${migration.name}`);

      // Check if already executed
      const isExecuted = await this.isMigrationExecuted(migration.id);
      if (isExecuted) {
        return {
          success: true,
          message: `Migration ${migration.name} already executed`,
        };
      }

      // Execute migration SQL
      const { error } = await this.client.rpc('execute_sql', {
        query: migration.sql,
      });

      if (error) {
        return {
          success: false,
          message: `Failed to execute migration ${migration.name}`,
          error,
        };
      }

      // Record migration as executed
      await this.recordMigration(migration);

      return {
        success: true,
        message: `Migration ${migration.name} executed successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error executing migration ${migration.name}`,
        error,
      };
    }
  }

  /**
   * Execute multiple migrations in order
   */
  async executeMigrations(migrations: Migration[]): Promise<MigrationResult[]> {
    await this.ensureMigrationsTable();

    const results: MigrationResult[] = [];
    
    // Sort migrations by version
    const sortedMigrations = migrations.sort((a, b) => a.version - b.version);

    for (const migration of sortedMigrations) {
      const result = await this.executeMigration(migration);
      results.push(result);

      if (!result.success) {
        console.error(`Migration failed: ${migration.name}`, result.error);
        break; // Stop on first failure
      }
    }

    return results;
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(): Promise<Array<{ id: string; name: string; version: number; executed_at: string }>> {
    try {
      const { data, error } = await this.client
        .from('migrations')
        .select('*')
        .order('version', { ascending: true });

      if (error) {
        console.warn('Could not get executed migrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Could not get executed migrations:', error);
      return [];
    }
  }

  /**
   * Check database schema status
   */
  async checkSchemaStatus(): Promise<{
    tablesExist: boolean;
    missingTables: string[];
    migrationTableExists: boolean;
  }> {
    const requiredTables = [
      'user_recovery_profiles',
      'daily_check_ins',
      'milestone_records',
      'ai_interaction_logs',
      'risk_assessment_records',
      'recovery_insights',
      'recovery_goals',
      'coping_strategies',
      'crisis_intervention_records',
      'educational_content',
      'user_educational_progress',
    ];

    const missingTables: string[] = [];
    let migrationTableExists = false;

    try {
      // Check if migrations table exists
      const { error: migrationError } = await this.client
        .from('migrations')
        .select('id')
        .limit(1);

      migrationTableExists = !migrationError;

      // Check each required table
      for (const table of requiredTables) {
        try {
          const { error } = await this.client
            .from(table)
            .select('*')
            .limit(1);

          if (error && error.code === '42P01') {
            // Table does not exist
            missingTables.push(table);
          }
        } catch (error) {
          missingTables.push(table);
        }
      }

      return {
        tablesExist: missingTables.length === 0,
        missingTables,
        migrationTableExists,
      };
    } catch (error) {
      console.error('Error checking schema status:', error);
      return {
        tablesExist: false,
        missingTables: requiredTables,
        migrationTableExists: false,
      };
    }
  }

  /**
   * Initialize AI rehabilitation database schema
   */
  async initializeSchema(): Promise<MigrationResult> {
    try {
      console.log('Initializing AI rehabilitation database schema...');

      const schemaStatus = await this.checkSchemaStatus();
      
      if (schemaStatus.tablesExist) {
        return {
          success: true,
          message: 'Database schema already initialized',
        };
      }

      // Load the main migration SQL
      const migrationSQL = `
        -- This would contain the full SQL from 001_ai_rehabilitation_schema.sql
        -- For now, we'll create a basic structure
        
        -- Enable UUID extension if not already enabled
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Create basic user recovery profiles table
        CREATE TABLE IF NOT EXISTS user_recovery_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          recovery_start_date DATE NOT NULL,
          current_stage VARCHAR(20) NOT NULL DEFAULT 'early',
          days_since_last_setback INTEGER NOT NULL DEFAULT 0,
          total_recovery_days INTEGER NOT NULL DEFAULT 0,
          personal_triggers TEXT[] DEFAULT '{}',
          coping_strategies TEXT[] DEFAULT '{}',
          support_contacts TEXT[] DEFAULT '{}',
          recovery_goals TEXT[] DEFAULT '{}',
          privacy_settings JSONB NOT NULL DEFAULT '{}',
          ai_coaching_enabled BOOLEAN NOT NULL DEFAULT true,
          crisis_intervention_enabled BOOLEAN NOT NULL DEFAULT true,
          milestone_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          CONSTRAINT unique_user_recovery_profile UNIQUE (user_id)
        );
        
        -- Enable RLS
        ALTER TABLE user_recovery_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own recovery profile" ON user_recovery_profiles FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert their own recovery profile" ON user_recovery_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their own recovery profile" ON user_recovery_profiles FOR UPDATE USING (auth.uid() = user_id);
      `;

      const migration: Migration = {
        id: '001_ai_rehabilitation_basic',
        name: 'AI Rehabilitation Basic Schema',
        version: 1,
        sql: migrationSQL,
      };

      const result = await this.executeMigration(migration);

      if (result.success) {
        console.log('✅ AI rehabilitation database schema initialized');
      } else {
        console.error('❌ Failed to initialize AI rehabilitation database schema');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Error initializing database schema',
        error,
      };
    }
  }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner();