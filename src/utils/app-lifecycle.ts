/**
 * App Lifecycle Manager
 * Handles app state changes safely without crashes
 */
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AppLifecycleManager {
  private currentState: AppStateStatus = AppState.currentState;
  private subscription: any = null;

  async initialize() {
    try {
      // Set up app state listener
      this.subscription = AppState.addEventListener('change', this.handleAppStateChange);
      console.log('App lifecycle manager initialized');
    } catch (error) {
      console.warn('Failed to initialize app lifecycle manager:', error);
    }
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    try {
      const previousState = this.currentState;
      this.currentState = nextAppState;

      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('App resumed from background');
        await this.handleAppResume();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        console.log('App going to background');
        await this.handleAppPause();
      }
    } catch (error) {
      console.warn('App state change failed:', error);
    }
  };

  private async handleAppResume() {
    try {
      // Restore any paused timers or refresh data
      console.log('Handling app resume...');
    } catch (error) {
      console.warn('App resume handling failed:', error);
    }
  }

  private async handleAppPause() {
    try {
      // Save current state and pause timers
      console.log('Handling app pause...');
      
      // Save app state to prevent data loss
      await AsyncStorage.setItem('app_last_pause', new Date().toISOString());
    } catch (error) {
      console.warn('App pause handling failed:', error);
    }
  }

  cleanup() {
    if (this.subscription) {
      this.subscription.remove();
    }
  }
}

export const appLifecycleManager = new AppLifecycleManager();