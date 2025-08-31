import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { appBlockingService, InstalledAppNative, AppCategory } from '../../services/native/AppBlockingService';

interface AppListTestProps {
  onClose?: () => void;
}

const AppListTest: React.FC<AppListTestProps> = ({ onClose }) => {
  const [apps, setApps] = useState<InstalledAppNative[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'system' | 'distracting'>('all');

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      await appBlockingService.initialize();
      const installedApps = await appBlockingService.getInstalledApps(false); // Don't use cache
      setApps(installedApps);
      console.log('Loaded apps:', installedApps.length);
    } catch (error) {
      console.error('Failed to load apps:', error);
      Alert.alert('Error', 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApps = () => {
    switch (filter) {
      case 'system':
        return apps.filter(app => app.isSystemApp);
      case 'distracting':
        return apps.filter(app => app.isRecommendedForBlocking);
      default:
        return apps;
    }
  };

  const getCategoryColor = (category: AppCategory) => {
    switch (category) {
      case AppCategory.SYSTEM_DISTRACTING:
        return '#ff6b6b'; // Red for distracting
      case AppCategory.SYSTEM_UTILITY:
        return '#ffa726'; // Orange for utility
      case AppCategory.USER_APP:
        return '#4fc3f7'; // Blue for user apps
      default:
        return '#9e9e9e'; // Gray for others
    }
  };

  const testAppBlocking = async (app: InstalledAppNative) => {
    try {
      const validation = await appBlockingService.validateAppForBlocking(app.packageName);
      
      let message = `App: ${app.appName}\n`;
      message += `Package: ${app.packageName}\n`;
      message += `Category: ${app.categoryDisplay}\n`;
      message += `Can Block: ${validation.canBlock ? 'Yes' : 'No'}\n`;
      
      if (validation.warningMessage) {
        message += `Warning: ${validation.warningMessage}\n`;
      }
      
      if (!validation.canBlock && validation.reason) {
        message += `Reason: ${validation.reason}\n`;
      }

      Alert.alert('App Details', message);
    } catch (error) {
      console.error('Failed to validate app:', error);
      Alert.alert('Error', 'Failed to validate app');
    }
  };

  const renderApp = ({ item }: { item: InstalledAppNative }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white dark:bg-gray-800 mb-2 rounded-lg shadow-sm"
      onPress={() => testAppBlocking(item)}
    >
      {item.icon && (
        <Image
          source={{ uri: `data:image/png;base64,${item.icon}` }}
          className="w-12 h-12 rounded-lg mr-3"
        />
      )}
      
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          {item.appName}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {item.packageName}
        </Text>
        <View className="flex-row items-center mt-1">
          <View
            className="px-2 py-1 rounded-full mr-2"
            style={{ backgroundColor: getCategoryColor(item.category) }}
          >
            <Text className="text-xs text-white font-medium">
              {item.categoryDisplay}
            </Text>
          </View>
          {item.isRecommendedForBlocking && (
            <View className="px-2 py-1 bg-red-100 dark:bg-red-900 rounded-full">
              <Text className="text-xs text-red-800 dark:text-red-200 font-medium">
                Distracting
              </Text>
            </View>
          )}
          {item.requiresWarning && (
            <View className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded-full ml-1">
              <Text className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                Warning
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredApps = getFilteredApps();
  const systemAppsCount = apps.filter(app => app.isSystemApp).length;
  const distractingAppsCount = apps.filter(app => app.isRecommendedForBlocking).length;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Loading apps...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 p-4 shadow-sm">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            App List Test
          </Text>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
            >
              <Text className="text-gray-700 dark:text-gray-300">Close</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Stats */}
        <View className="flex-row justify-between mt-3">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Total: {apps.length}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            System: {systemAppsCount}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Distracting: {distractingAppsCount}
          </Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View className="flex-row p-4 space-x-2">
        <TouchableOpacity
          onPress={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' 
              ? 'bg-blue-500' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <Text className={`font-medium ${
            filter === 'all' 
              ? 'text-white' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            All ({apps.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setFilter('system')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'system' 
              ? 'bg-blue-500' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <Text className={`font-medium ${
            filter === 'system' 
              ? 'text-white' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            System ({systemAppsCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setFilter('distracting')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'distracting' 
              ? 'bg-blue-500' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <Text className={`font-medium ${
            filter === 'distracting' 
              ? 'text-white' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            Distracting ({distractingAppsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* App List */}
      <FlatList
        data={filteredApps}
        renderItem={renderApp}
        keyExtractor={(item) => item.packageName}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-lg text-gray-500 dark:text-gray-400">
              No apps found
            </Text>
          </View>
        }
      />

      {/* Refresh Button */}
      <View className="p-4">
        <TouchableOpacity
          onPress={loadApps}
          className="bg-blue-500 py-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">
            Refresh Apps
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AppListTest;