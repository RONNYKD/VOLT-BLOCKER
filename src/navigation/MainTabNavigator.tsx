/**
 * Main Tab Navigator - Bottom tabs for Focus, Blocks, Profile
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Focus, Shield, User, Bot } from 'lucide-react-native';
import { useAppTheme } from '../theme/nativewind-setup';
import type { MainTabParamList } from './types';

// Import screens
import { FocusScreen } from '../screens/focus/FocusScreen';
import { BlocksScreen } from '../screens/blocks/BlocksScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { AICoachScreen } from '../screens/ai/AICoachScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { isDark } = useAppTheme();

  return (
    <Tab.Navigator
      initialRouteName="Focus"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Focus"
        component={FocusScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Focus size={size} color={color} />
          ),
          tabBarLabel: 'Focus',
        }}
      />
      <Tab.Screen
        name="Blocks"
        component={BlocksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Shield size={size} color={color} />
          ),
          tabBarLabel: 'Blocks',
        }}
      />
      <Tab.Screen
        name="AICoach"
        component={AICoachScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Bot size={size} color={color} />
          ),
          tabBarLabel: 'AI Coach',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
          tabBarLabel: 'Profile',
        }}
      />

    </Tab.Navigator>
  );
};