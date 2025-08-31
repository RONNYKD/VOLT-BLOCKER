/**
 * VOLT - Digital Wellness App
 * Main Application Component
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { logger } from './src/utils/logger';
import { ThemeProvider, useAppTheme } from './src/theme';
import { RootNavigator } from './src/navigation';
import { initializeApp, type AppInitializationResult } from './src/services/app-initialization';
import { appLifecycleManager } from './src/utils/app-lifecycle';

// Inner App component that uses theme
const AppContent: React.FC = () => {
  const { isDark, colors } = useAppTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationResult, setInitializationResult] = useState<AppInitializationResult | null>(null);

  useEffect(() => {
    // Initialize the app lifecycle manager
    appLifecycleManager.initialize();

    const initializeApplication = async () => {
      const startTime = performance.now();
      logger.info('🚀 Starting VOLT App initialization...');
      
      try {
        // Initialize all app services
        const result = await initializeApp();
        setInitializationResult(result);
        setIsInitialized(true);
        
        logger.info('✅ VOLT App initialization completed', {
          success: result.success,
          duration: result.duration,
          supabaseReady: result.supabaseReady,
          nativeServicesReady: result.nativeServicesReady,
          blockingPermissions: result.blockingPermissions,
        });
        
        if (result.errors.length > 0) {
          logger.error('App initialization errors:', result.errors);
        }
        
        if (result.warnings.length > 0) {
          logger.warn('App initialization warnings:', result.warnings);
        }
        
        logger.logPerformance('App initialization', startTime);
      } catch (error) {
        logger.error('💥 Critical app initialization failure:', error);
        setIsInitialized(true); // Still show the app even if initialization fails
      }
    };

    initializeApplication();

    // Cleanup on unmount
    return () => {
      appLifecycleManager.cleanup();
    };
  }, []);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: '#000' 
          }}>
            <ActivityIndicator size="large" color="#00d4aa" />
            <Text style={{ 
              color: '#fff', 
              marginTop: 16, 
              fontSize: 16 
            }}>
              Initializing VOLT...
            </Text>
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
