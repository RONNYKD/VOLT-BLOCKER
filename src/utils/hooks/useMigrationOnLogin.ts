/**
 * Migration on Login Hook
 * React hook to handle data migration when users log in
 */
import { useState, useEffect } from 'react';
import { userLoginMigrationService, LoginMigrationResult } from '../../services/supabase/UserLoginMigrationService';

export interface UseMigrationOnLoginResult {
  migrationResult: LoginMigrationResult | null;
  isLoading: boolean;
  error: string | null;
  triggerMigration: (userId: string) => Promise<void>;
  clearResult: () => void;
}

export const useMigrationOnLogin = (): UseMigrationOnLoginResult => {
  const [migrationResult, setMigrationResult] = useState<LoginMigrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerMigration = async (userId: string) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔐 Triggering migration for user login: ${userId}`);
      const result = await userLoginMigrationService.handleUserLogin(userId);
      setMigrationResult(result);
      
      if (result.migrationPerformed && result.migrationResult?.success) {
        console.log(`✅ Migration successful: ${result.migrationResult.achievementsMigrated} achievements restored`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Migration failed';
      setError(errorMessage);
      console.error('❌ Migration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => {
    setMigrationResult(null);
    setError(null);
  };

  return {
    migrationResult,
    isLoading,
    error,
    triggerMigration,
    clearResult
  };
};

/**
 * Auto Migration Hook - automatically triggers migration when user ID changes
 */
export const useAutoMigrationOnLogin = (userId: string | null): UseMigrationOnLoginResult => {
  const migrationHook = useMigrationOnLogin();

  useEffect(() => {
    if (userId && !migrationHook.isLoading && !migrationHook.migrationResult) {
      console.log(`🔄 Auto-triggering migration for user: ${userId}`);
      migrationHook.triggerMigration(userId);
    }
  }, [userId]);

  return migrationHook;
};

/**
 * Migration Status Hook - checks migration status without performing migration
 */
export const useMigrationStatus = (userId: string | null) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await userLoginMigrationService.checkMigrationStatus(userId);
      setStatus(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      checkStatus();
    }
  }, [userId]);

  return {
    status,
    isLoading,
    error,
    refresh: checkStatus
  };
};