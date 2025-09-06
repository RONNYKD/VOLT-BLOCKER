/**
 * Navigation type definitions for VOLT app
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator (handles auth flow)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Authentication Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator (after authentication)
export type MainTabParamList = {
  Focus: undefined;
  Blocks: undefined;
  AICoach: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  ProfileMain: undefined;
  UninstallProtection: undefined;
};

// Navigation prop types for screens
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: any;
  route: any;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = {
  navigation: any;
  route: any;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  navigation: any;
  route: any;
};

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = {
  navigation: any;
  route: any;
};

// Declare global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}