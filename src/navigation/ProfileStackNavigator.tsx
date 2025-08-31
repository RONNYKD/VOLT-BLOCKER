/**
 * Profile Stack Navigator - Handles profile and settings screens
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppTheme } from '../theme/nativewind-setup';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UninstallProtectionScreen } from '../screens/settings/UninstallProtectionScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  UninstallProtection: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UninstallProtection"
        component={UninstallProtectionScreen}
        options={{
          title: 'Uninstall Protection',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};