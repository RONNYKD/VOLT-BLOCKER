/**
 * Supabase client configuration and initialization
 * Handles authentication and database operations
 */
// Import polyfill first to fix module resolution issues
import '../utils/supabase-polyfill';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, SecureStorageKeys, errorHandler, ErrorSeverity } from '../utils';

// Supabase configuration interface
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

// Database types (will be expanded as we add more tables)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      blocked_apps: {
        Row: {
          id: string;
          user_id: string;
          package_name: string;
          app_name: string;
          icon_url: string | null;
          is_blocked: boolean;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_name: string;
          app_name: string;
          icon_url?: string | null;
          is_blocked?: boolean;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_name?: string;
          app_name?: string;
          icon_url?: string | null;
          is_blocked?: boolean;
          category?: string | null;
          updated_at?: string;
        };
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          duration: number;
          actual_duration: number | null;
          start_time: string;
          end_time: string | null;
          status: 'active' | 'paused' | 'completed' | 'cancelled';
          blocked_apps: string[];
          blocked_websites: string[];
          pause_duration: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration: number;
          actual_duration?: number | null;
          start_time: string;
          end_time?: string | null;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
          blocked_apps?: string[];
          blocked_websites?: string[];
          pause_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          duration?: number;
          actual_duration?: number | null;
          start_time?: string;
          end_time?: string | null;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
          blocked_apps?: string[];
          blocked_websites?: string[];
          pause_duration?: number;
          updated_at?: string;
        };
      };
    };
  };
}

// Supabase client class
export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient<Database> | null = null;
  private config: SupabaseConfig | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Initialize Supabase client
   */
  async initialize(config: SupabaseConfig): Promise<void> {
    try {
      this.config = config;
      
      // Create Supabase client with AsyncStorage for session persistence
      this.client = createClient<Database>(config.url, config.anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'volt-mobile-app',
          },
        },
      });

      // Set up auth state change listener
      this.setupAuthStateListener();

      this.isInitialized = true;
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'supabase_initialization', config: { url: config.url } },
        ErrorSeverity.CRITICAL
      );
      throw new Error(`Failed to initialize Supabase: ${error}`);
    }
  }

  /**
   * Get Supabase client instance
   */
  getClient(): SupabaseClient<Database> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Check if Supabase is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    if (!this.client) return null;
    
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'get_current_session' },
        ErrorSeverity.MEDIUM
      );
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.client) return null;
    
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'get_current_user' },
        ErrorSeverity.MEDIUM
      );
      return null;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: { username?: string }): Promise<{
    user: User | null;
    session: Session | null;
    error: Error | null;
  }> {
    if (!this.client) {
      console.log('Supabase:ERROR - Client not initialized');
      return { user: null, session: null, error: new Error('Supabase not initialized') };
    }

    try {
      console.log(`Supabase:INFO - Attempting signup for ${email}`);
      
      // Simple signup without automatic profile creation
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
          emailRedirectTo: 'volt://auth/callback',
        },
      });

      if (error) {
        console.log(`Supabase:ERROR - Signup failed: ${error.message}`);
        throw error;
      }

      console.log(`Supabase:INFO - Signup successful for user: ${data.user?.id}`);

      // Store session securely if successful
      if (data.session) {
        console.log('Supabase:INFO - Session available, storing securely');
        await this.storeSessionSecurely(data.session);
      } else {
        console.log('Supabase:INFO - No session in response, email confirmation may be required');
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.log(`Supabase:ERROR - Signup exception: ${(error as Error).message}`);
      await errorHandler.handle(
        error as Error,
        { context: 'supabase_signup', email },
        ErrorSeverity.HIGH
      );
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{
    user: User | null;
    session: Session | null;
    error: Error | null;
  }> {
    if (!this.client) {
      return { user: null, session: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store session securely if successful
      if (data.session) {
        await this.storeSessionSecurely(data.session);
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'supabase_signin', email },
        ErrorSeverity.HIGH
      );
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;

      // Clear stored session
      await this.clearStoredSession();

      return { error: null };
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'supabase_signout' },
        ErrorSeverity.MEDIUM
      );
      return { error: error as Error };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: 'volt://reset-password', // Deep link for mobile app
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'supabase_reset_password', email },
        ErrorSeverity.MEDIUM
      );
      return { error: error as Error };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'supabase_update_password' },
        ErrorSeverity.MEDIUM
      );
      return { error: error as Error };
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<{ session: Session | null; error: Error | null }> {
    if (!this.client) {
      return { session: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { data, error } = await this.client.auth.refreshSession();
      if (error) throw error;

      // Store refreshed session securely
      if (data.session) {
        await this.storeSessionSecurely(data.session);
      }

      return { session: data.session, error: null };
    } catch (error) {
      await errorHandler.handle(
        error as Error,
        { context: 'supabase_refresh_session' },
        ErrorSeverity.MEDIUM
      );
      return { session: null, error: error as Error };
    }
  }

  /**
   * Set up auth state change listener
   */
  private setupAuthStateListener(): void {
    if (!this.client) return;

    this.client.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              await this.storeSessionSecurely(session);
              console.log('User signed in, session stored securely');
            }
            break;
          case 'SIGNED_OUT':
            await this.clearStoredSession();
            console.log('User signed out, session cleared');
            break;
          case 'TOKEN_REFRESHED':
            if (session) {
              await this.storeSessionSecurely(session);
              console.log('Token refreshed, session updated');
            }
            break;
          case 'USER_UPDATED':
            console.log('User updated');
            break;
        }
      } catch (error) {
        await errorHandler.handle(
          error as Error,
          { context: 'auth_state_change', event },
          ErrorSeverity.MEDIUM
        );
      }
    });
  }

  /**
   * Store session securely
   */
  private async storeSessionSecurely(session: Session): Promise<void> {
    try {
      // Initialize secure storage if not already done
      await secureStorage.init();
      
      // Calculate token expiration time
      const expiresInMinutes = session.expires_in ? Math.floor(session.expires_in / 60) : undefined;
      
      // Store tokens securely
      await secureStorage.storeTokens(
        session.access_token,
        session.refresh_token,
        expiresInMinutes
      );

      // Store session data
      await secureStorage.set(
        SecureStorageKeys.SESSION_DATA,
        JSON.stringify({
          user: session.user,
          expires_at: session.expires_at,
          token_type: session.token_type,
        })
      );
    } catch (error) {
      console.warn('Failed to store session securely, continuing without secure storage:', error);
      await errorHandler.handle(
        error as Error,
        { context: 'store_session_securely' },
        ErrorSeverity.MEDIUM // Reduced severity since app can continue
      );
    }
  }

  /**
   * Clear stored session
   */
  private async clearStoredSession(): Promise<void> {
    try {
      // Initialize secure storage if not already done
      await secureStorage.init();
      
      await secureStorage.clearTokens();
      await secureStorage.remove(SecureStorageKeys.SESSION_DATA);
    } catch (error) {
      console.warn('Failed to clear stored session, continuing:', error);
      await errorHandler.handle(
        error as Error,
        { context: 'clear_stored_session' },
        ErrorSeverity.LOW // Reduced severity since clearing is not critical
      );
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isInitialized: boolean;
    hasValidConfig: boolean;
    url?: string;
  } {
    return {
      isInitialized: this.isInitialized,
      hasValidConfig: this.config !== null,
      url: this.config?.url,
    };
  }
}

// Export singleton instance
export const supabase = SupabaseService.getInstance();