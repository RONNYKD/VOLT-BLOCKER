/**
 * Root Navigator - Main navigation container for VOLT app
 */
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../store';
import { initializeApp } from '../services';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize the app when the navigator mounts
    const initApp = async () => {
      try {
        // Initialize the entire app (storage, Supabase, auth)
        await initializeApp();
        
        // Initialize auth store if not already initialized
        if (!isInitialized) {
          await initialize();
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        // Continue anyway - the app should still work with limited functionality
      }
    };

    initApp();
  }, [initialize, isInitialized]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#2d2d2d']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View style={{ alignItems: 'center' }}>
          {/* VOLT Logo */}
          <LinearGradient
            colors={['#00d4aa', '#00ffff']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#000' }}>V</Text>
          </LinearGradient>
          
          <Text style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#fff', 
            marginBottom: 8,
            letterSpacing: 2 
          }}>
            VOLT
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            color: '#00d4aa', 
            marginBottom: 32 
          }}>
            Digital Wellness
          </Text>
          
          <ActivityIndicator size="large" color="#00d4aa" />
          
          <Text style={{ 
            fontSize: 14, 
            color: '#666', 
            marginTop: 16 
          }}>
            Initializing...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};