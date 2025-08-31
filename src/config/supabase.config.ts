/**
 * Supabase configuration
 * Environment-specific settings for Supabase connection
 */

// Environment configuration interface
export interface SupabaseEnvironmentConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  environment: 'development' | 'staging' | 'production';
}

// Default configuration (will be overridden by environment variables)
const defaultConfig: SupabaseEnvironmentConfig = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here',
  environment: 'development',
};

/**
 * Get Supabase configuration from environment or defaults
 */
export function getSupabaseConfig(): SupabaseEnvironmentConfig {
  let config: SupabaseEnvironmentConfig;
  
  try {
    // Try to import the keys file (if it exists)
    const { SUPABASE_CONFIG } = require('./supabase-keys');
    config = {
      url: SUPABASE_CONFIG.url,
      anonKey: SUPABASE_CONFIG.anonKey,
      serviceRoleKey: __DEV__ ? SUPABASE_CONFIG.serviceRoleKey : undefined,
      environment: __DEV__ ? 'development' : 'production',
    };
  } catch (error) {
    // Fallback to default configuration if keys file doesn't exist
    console.warn('⚠️ Supabase keys file not found, using default configuration');
    config = {
      url: __DEV__ 
        ? 'https://your-dev-project.supabase.co' 
        : 'https://your-prod-project.supabase.co',
      anonKey: __DEV__
        ? 'your-dev-anon-key-here'
        : 'your-prod-anon-key-here',
      serviceRoleKey: __DEV__
        ? 'your-dev-service-role-key-here'
        : undefined,
      environment: __DEV__ ? 'development' : 'production',
    };
  }

  // Validate configuration
  if (!config.url || config.url.includes('your-project')) {
    console.warn('⚠️ Supabase URL not configured properly');
  }
  
  if (!config.anonKey || config.anonKey.includes('your-anon-key')) {
    console.warn('⚠️ Supabase anonymous key not configured properly');
  }

  return config;
}

/**
 * Validate Supabase configuration
 */
export function validateSupabaseConfig(config: SupabaseEnvironmentConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!config.url) {
    errors.push('Supabase URL is required');
  } else if (!config.url.startsWith('https://')) {
    errors.push('Supabase URL must start with https://');
  } else if (config.url.includes('your-project')) {
    errors.push('Supabase URL appears to be a placeholder');
  }

  if (!config.anonKey) {
    errors.push('Supabase anonymous key is required');
  } else if (config.anonKey.includes('your-anon-key')) {
    errors.push('Supabase anonymous key appears to be a placeholder');
  }

  // Check warnings
  if (config.environment === 'production' && config.serviceRoleKey) {
    warnings.push('Service role key should not be used in production mobile apps');
  }

  if (config.environment === 'development' && !config.serviceRoleKey) {
    warnings.push('Service role key not provided for development environment');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get database URL for direct connections (if needed)
 */
export function getDatabaseUrl(config: SupabaseEnvironmentConfig): string {
  return config.url.replace('https://', 'postgresql://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres');
}

/**
 * Get API URL for REST operations
 */
export function getApiUrl(config: SupabaseEnvironmentConfig): string {
  return `${config.url}/rest/v1`;
}

/**
 * Get Auth URL for authentication operations
 */
export function getAuthUrl(config: SupabaseEnvironmentConfig): string {
  return `${config.url}/auth/v1`;
}

/**
 * Get Storage URL for file operations
 */
export function getStorageUrl(config: SupabaseEnvironmentConfig): string {
  return `${config.url}/storage/v1`;
}

// Export default configuration
export const supabaseConfig = getSupabaseConfig();