/**
 * Emergency App Test Screen
 * Demonstrates the emergency app categorization and 1-minute cooldown feature
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/nativewind-setup';
import { EmergencyAppDemo } from '../../components';
import type { MainTabScreenProps } from '../../navigation/types';

// Note: This would normally be part of MainTabScreenProps, but for demo purposes we'll use a simple type
type Props = {
  navigation: any;
  route: any;
};

export const EmergencyAppTestScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Emergency App Demo
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Test the new emergency app categorization feature
        </Text>
      </View>

      <EmergencyAppDemo />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default EmergencyAppTestScreen;
