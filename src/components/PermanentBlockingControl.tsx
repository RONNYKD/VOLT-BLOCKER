import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Clock, Shield, ShieldOff, AlertTriangle, X } from 'lucide-react-native';
import { appBlockingService, DisableStatus } from '../services/native/AppBlockingService';
import { notificationService } from '../services/notifications/NotificationService';

interface PermanentBlockingControlProps {
  isBlocking: boolean;
  onBlockingChange?: (isBlocking: boolean) => void;
}

export const PermanentBlockingControl: React.FC<PermanentBlockingControlProps> = ({
  isBlocking,
  onBlockingChange,
}) => {
  const [disableStatus, setDisableStatus] = useState<DisableStatus>({
    isPending: false,
    canDisableNow: false,
    remainingMinutes: 0,
    status: 'no_request'
  });
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Refresh disable status every 30 seconds when there's a pending request
  useEffect(() => {
    if (disableStatus.isPending && disableStatus.status === 'waiting') {
      const interval = setInterval(refreshDisableStatus, 30000); // 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [disableStatus.isPending, disableStatus.status]);

  // Initial load
  useEffect(() => {
    refreshDisableStatus();
  }, []);

  const refreshDisableStatus = async () => {
    try {
      const status = await appBlockingService.getDisableStatus();
      setDisableStatus(status);
    } catch (error) {
      console.error('Failed to refresh disable status:', error);
    }
  };

  const handleRequestDisable = async () => {
    try {
      // Show warning dialog first
      const confirmed = await appBlockingService.showDisableDelayWarning();
      if (!confirmed) return;

      setLoading(true);
      const result = await appBlockingService.requestDisableBlocking();
      
      if (result.success) {
        // Start countdown notification service
        const endTime = Date.now() + (2 * 60 * 60 * 1000); // 2 hours from now
        await notificationService.startCountdownNotification(endTime);
        
        Alert.alert(
          'Disable Request Started',
          '⏰ Blocking will be disabled in 2 hours.\n\nThis delay helps you overcome urges. You can cancel this request anytime during the wait period.\n\n📱 You\'ll see a countdown notification in your notification panel.',
          [{ text: 'OK' }]
        );
        await refreshDisableStatus();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Failed to request disable:', error);
      Alert.alert('Error', 'Failed to request disable blocking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDisable = async () => {
    try {
      setLoading(true);
      const result = await appBlockingService.cancelDisableRequest();
      
      if (result.success) {
        // Stop countdown notification service
        await notificationService.stopCountdownNotification();
        
        Alert.alert(
          'Request Canceled',
          '✅ Disable request has been canceled. Blocking will continue.\n\n📱 Countdown notification has been removed.',
          [{ text: 'OK' }]
        );
        await refreshDisableStatus();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Failed to cancel disable:', error);
      Alert.alert('Error', 'Failed to cancel disable request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDisable = async () => {
    try {
      // Final confirmation
      Alert.alert(
        'Confirm Disable Blocking',
        '⚠️ Are you sure you want to disable blocking?\n\nThis will stop all app and website blocking until you manually re-enable it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable Blocking',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const result = await appBlockingService.confirmDisableBlocking();
              
              if (result.success) {
                // Stop countdown notification service
                await notificationService.stopCountdownNotification();
                
                Alert.alert(
                  'Blocking Disabled',
                  '🔓 Blocking has been disabled successfully.\n\n📱 Countdown notification has been removed.',
                  [{ text: 'OK' }]
                );
                await refreshDisableStatus();
                onBlockingChange?.(false);
              } else {
                Alert.alert('Error', result.message);
              }
              setLoading(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to confirm disable:', error);
      Alert.alert('Error', 'Failed to disable blocking');
      setLoading(false);
    }
  };

  const renderBlockingStatus = () => {
    if (isBlocking) {
      return (
        <View className="flex-row items-center mb-4">
          <Shield size={24} color="#10b981" />
          <Text className="ml-2 text-lg font-semibold text-green-600 dark:text-green-400">
            Blocking Active
          </Text>
        </View>
      );
    } else {
      return (
        <View className="flex-row items-center mb-4">
          <ShieldOff size={24} color="#ef4444" />
          <Text className="ml-2 text-lg font-semibold text-red-600 dark:text-red-400">
            Blocking Disabled
          </Text>
        </View>
      );
    }
  };

  const renderDisableControls = () => {
    if (!isBlocking) {
      return (
        <Text className="text-gray-600 dark:text-gray-400 text-center">
          Blocking is currently disabled. You can re-enable it anytime from the Blocks screen.
        </Text>
      );
    }

    // No pending request - show disable button
    if (disableStatus.status === 'no_request') {
      return (
        <TouchableOpacity
          onPress={handleRequestDisable}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 py-4 px-6 rounded-lg flex-row items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <AlertTriangle size={20} color="white" />
              <Text className="ml-2 text-white font-semibold text-lg">
                Disable Blocking (2-Hour Delay)
              </Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // Waiting period - show countdown and cancel option
    if (disableStatus.status === 'waiting') {
      return (
        <View className="space-y-4">
          {/* Countdown Display */}
          <View className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <View className="flex-row items-center justify-center mb-2">
              <Clock size={24} color="#f97316" />
              <Text className="ml-2 text-lg font-bold text-orange-600 dark:text-orange-400">
                Disable Request Pending
              </Text>
            </View>
            
            <Text className="text-center text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {disableStatus.remainingTimeDisplay || appBlockingService.formatRemainingTime(disableStatus.remainingMinutes)}
            </Text>
            
            <Text className="text-center text-sm text-orange-700 dark:text-orange-300">
              Blocking will be disabled when the countdown reaches zero.
              This delay helps you overcome urges and make thoughtful decisions.
            </Text>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleCancelDisable}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 py-3 px-6 rounded-lg flex-row items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <X size={20} color="white" />
                <Text className="ml-2 text-white font-semibold">
                  Cancel Disable Request
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // Ready to disable - show final confirmation
    if (disableStatus.status === 'ready_to_disable') {
      return (
        <View className="space-y-4">
          {/* Ready Notice */}
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <View className="flex-row items-center justify-center mb-2">
              <AlertTriangle size={24} color="#ef4444" />
              <Text className="ml-2 text-lg font-bold text-red-600 dark:text-red-400">
                Ready to Disable
              </Text>
            </View>
            
            <Text className="text-center text-sm text-red-700 dark:text-red-300">
              The 2-hour delay has elapsed. You can now disable blocking if you still want to.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleConfirmDisable}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 py-3 px-6 rounded-lg flex-row items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <ShieldOff size={20} color="white" />
                  <Text className="ml-2 text-white font-semibold">
                    Confirm Disable Blocking
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancelDisable}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 py-3 px-6 rounded-lg flex-row items-center justify-center"
            >
              <Text className="text-white font-semibold">
                Keep Blocking Active
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
        Permanent Blocking Control
      </Text>
      
      {renderBlockingStatus()}
      
      <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
        {renderDisableControls()}
      </View>
      
      {/* Help Text */}
      <View className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 The 2-hour delay helps prevent impulsive decisions during urges.
          This feature is designed to support your digital wellness goals.
        </Text>
      </View>
    </View>
  );
};

export default PermanentBlockingControl;