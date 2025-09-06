import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { appBlockingService } from '../services/native';
import type { AppCategory } from '../store/blocking-store';

interface SampleApp {
  packageName: string;
  appName: string;
  category?: AppCategory;
  cooldownMinutes?: number;
}

export const EmergencyAppDemo: React.FC = () => {
  // Sample apps to demonstrate the categorization
  const sampleApps: SampleApp[] = [
    { packageName: 'com.android.phone', appName: 'Phone' },
    { packageName: 'com.android.mms', appName: 'Messages' },
    { packageName: 'com.google.android.apps.maps', appName: 'Google Maps' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp' },
    { packageName: 'com.uber.app', appName: 'Uber' },
    { packageName: 'com.instagram.android', appName: 'Instagram' },
    { packageName: 'com.twitter.android', appName: 'Twitter' },
    { packageName: 'com.facebook.katana', appName: 'Facebook' },
    { packageName: 'com.tiktok.musically', appName: 'TikTok' },
  ];

  // Categorize each app and add cooldown information
  const categorizedApps = sampleApps.map(app => {
    const category = appBlockingService.categorizeApp(app.packageName);
    const cooldownMinutes = appBlockingService.getCooldownForCategory(category);
    const displayName = appBlockingService.getCategoryDisplayName(category);
    const description = appBlockingService.getCategoryDescription(category);
    
    return {
      ...app,
      category,
      cooldownMinutes,
      displayName,
      description,
    };
  });

  const getCategoryColor = (category: AppCategory) => {
    switch (category) {
      case 'emergency':
        return '#dc2626'; // Red
      case 'critical':
        return '#d97706'; // Amber
      case 'regular':
      default:
        return '#6b7280'; // Gray
    }
  };

  const getCategoryIcon = (category: AppCategory) => {
    switch (category) {
      case 'emergency':
        return '🚨';
      case 'critical':
        return '⚡';
      case 'regular':
      default:
        return '📱';
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🆕 Emergency App Cooldown Demo
        </Text>
        <Text className="text-gray-600 dark:text-gray-300 mb-4">
          Apps are now automatically categorized with different unblock cooldown periods:
        </Text>
        
        {/* Legend */}
        <View className="mb-6">
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <Text className="font-bold text-lg text-gray-900 dark:text-white mb-3">Legend:</Text>
            
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">🚨</Text>
                <Text className="font-semibold text-red-600">Emergency Apps</Text>
                <Text className="ml-2 text-sm text-gray-600 dark:text-gray-300">(1 minute cooldown)</Text>
              </View>
              
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">⚡</Text>
                <Text className="font-semibold text-amber-600">Critical Apps</Text>
                <Text className="ml-2 text-sm text-gray-600 dark:text-gray-300">(1 minute cooldown)</Text>
              </View>
              
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">📱</Text>
                <Text className="font-semibold text-gray-600">Regular Apps</Text>
                <Text className="ml-2 text-sm text-gray-600 dark:text-gray-300">(2 hour cooldown)</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* App List */}
      <View className="space-y-3">
        {categorizedApps.map((app, index) => (
          <View 
            key={index} 
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <Text className="text-lg mr-3">{getCategoryIcon(app.category)}</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white text-lg">
                    {app.appName}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {app.packageName}
                  </Text>
                </View>
              </View>
              
              <View 
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: getCategoryColor(app.category) + '20' }}
              >
                <Text 
                  className="text-xs font-bold"
                  style={{ color: getCategoryColor(app.category) }}
                >
                  {app.displayName}
                </Text>
              </View>
            </View>
            
            <View className="mt-2">
              <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                {app.description}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Cooldown: {app.cooldownMinutes === 1 ? '1 minute' : `${app.cooldownMinutes} minutes`}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Feature Info */}
      <View className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <Text className="font-bold text-blue-900 dark:text-blue-100 mb-2">
          ✨ How it works:
        </Text>
        <Text className="text-sm text-blue-800 dark:text-blue-200">
          • Emergency apps (Phone, Maps) get 1-minute cooldown for true emergencies{'\n'}
          • Critical apps (Messages, Emergency contacts) get 1-minute for urgent communication{'\n'}
          • Regular apps (Social media, games) keep the full 2-hour cooldown{'\n'}
          • Apps are automatically categorized when you add them to your block list
        </Text>
      </View>
    </ScrollView>
  );
};

export default EmergencyAppDemo;
