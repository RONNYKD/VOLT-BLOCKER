/**
 * Authentication store using Zustand with Supabase integration
 * Manages user authentication state and methods
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageUtils, StorageKeys, errorHandler, ErrorSeverity, secureStorage } from '../utils';
import { supabase } from '../services/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false,
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setSession: (session) => set({ 
        session,
        isAuthenticated: !!session
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Add timeout for network requests
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 10000)
          );
          
          // Check if we have a stored session with timeout
          const sessionPromise = supabase.getCurrentSession();
          const userPromise = supabase.getCurrentUser();
          
          const [currentSession, currentUser] = await Promise.race([
            Promise.all([sessionPromise, userPromise]),
            timeoutPromise
          ]) as [any, any];
          
          if (currentSession && currentUser) {
            // Convert Supabase user to our User interface
            const user: User = {
              id: currentUser.id,
              email: currentUser.email || '',
              username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0],
              avatar_url: currentUser.user_metadata?.avatar_url,
              created_at: currentUser.created_at,
              updated_at: currentUser.updated_at || currentUser.created_at,
            };
            
            set({
              user,
              session: currentSession,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (error) {
          console.warn('Auth initialization failed, continuing offline:', error);
          // Don't throw error, just continue offline
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
        }
      },
      
      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user: supabaseUser, session, error } = await supabase.signIn(email, password);
          
          if (error) {
            throw error;
          }
          
          if (supabaseUser && session) {
            // Convert Supabase user to our User interface
            const user: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0],
              avatar_url: supabaseUser.user_metadata?.avatar_url,
              created_at: supabaseUser.created_at,
              updated_at: supabaseUser.updated_at || supabaseUser.created_at,
            };
            
            set({ 
              user, 
              session,
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            throw new Error('Sign in failed: No user or session returned');
          }
        } catch (error) {
          await errorHandler.handle(
            error as Error,
            { context: 'auth_store_signin', email },
            ErrorSeverity.HIGH
          );
          set({ isLoading: false });
          throw error;
        }
      },
      
      signUp: async (email: string, password: string, username?: string) => {
        set({ isLoading: true });
        try {
          const { user: supabaseUser, session, error } = await supabase.signUp(
            email, 
            password, 
            { username }
          );
          
          if (error) {
            throw error;
          }
          
          if (supabaseUser) {
            // Convert Supabase user to our User interface
            const user: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              username: username || supabaseUser.email?.split('@')[0],
              avatar_url: supabaseUser.user_metadata?.avatar_url,
              created_at: supabaseUser.created_at,
              updated_at: supabaseUser.updated_at || supabaseUser.created_at,
            };
            
            set({ 
              user, 
              session,
              isAuthenticated: !!session, // May be null if email confirmation is required
              isLoading: false 
            });
          } else {
            throw new Error('Sign up failed: No user returned');
          }
        } catch (error) {
          await errorHandler.handle(
            error as Error,
            { context: 'auth_store_signup', email },
            ErrorSeverity.HIGH
          );
          set({ isLoading: false });
          throw error;
        }
      },
      
      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.signOut();
          
          if (error) {
            throw error;
          }
          
          // Clear secure storage
          await secureStorage.clearTokens();
          
          set({ 
            user: null, 
            session: null,
            isAuthenticated: false,
            isLoading: false 
          });
        } catch (error) {
          await errorHandler.handle(
            error as Error,
            { context: 'auth_store_signout' },
            ErrorSeverity.MEDIUM
          );
          set({ isLoading: false });
          throw error;
        }
      },
      
      resetPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.resetPassword(email);
          
          if (error) {
            throw error;
          }
          
          set({ isLoading: false });
        } catch (error) {
          await errorHandler.handle(
            error as Error,
            { context: 'auth_store_reset_password', email },
            ErrorSeverity.MEDIUM
          );
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) throw new Error('No user to update');
        
        set({ isLoading: true });
        try {
          // Update user metadata in Supabase
          const client = supabase.getClient();
          const { error } = await client.auth.updateUser({
            data: {
              username: updates.username,
              avatar_url: updates.avatar_url,
            }
          });
          
          if (error) {
            throw error;
          }
          
          const updatedUser = { 
            ...user, 
            ...updates, 
            updated_at: new Date().toISOString() 
          };
          
          set({ 
            user: updatedUser,
            isLoading: false 
          });
        } catch (error) {
          await errorHandler.handle(
            error as Error,
            { context: 'auth_store_update_profile' },
            ErrorSeverity.MEDIUM
          );
          set({ isLoading: false });
          throw error;
        }
      },
      
      refreshSession: async () => {
        try {
          const { session, error } = await supabase.refreshSession();
          
          if (error) {
            throw error;
          }
          
          if (session) {
            set({ session });
          }
        } catch (error) {
          await errorHandler.handle(
            error as Error,
            { context: 'auth_store_refresh_session' },
            ErrorSeverity.MEDIUM
          );
          // If refresh fails, sign out the user
          get().signOut();
        }
      },
      
      clearAuth: () => set({ 
        user: null, 
        session: null, 
        isAuthenticated: false,
        isLoading: false 
      }),
    }),
    {
      name: 'volt-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and session, not loading states
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);