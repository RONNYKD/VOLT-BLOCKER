/**
 * Loading component with different variants
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  variant?: 'spinner' | 'overlay' | 'inline';
  isDark?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color,
  text,
  variant = 'spinner',
  isDark = false,
}) => {
  const getColor = () => {
    if (color) return color;
    return isDark ? '#FFFFFF' : '#2563EB';
  };

  const getTextColor = () => {
    return isDark ? '#FFFFFF' : '#374151';
  };

  if (variant === 'overlay') {
    return (
      <View style={styles.overlay}>
        <View style={[
          styles.overlayContent,
          { backgroundColor: isDark ? '#374151' : '#FFFFFF' }
        ]}>
          <ActivityIndicator size={size} color={getColor()} />
          {text && (
            <Text style={[styles.overlayText, { color: getTextColor() }]}>
              {text}
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size={size} color={getColor()} />
        {text && (
          <Text style={[styles.inlineText, { color: getTextColor() }]}>
            {text}
          </Text>
        )}
      </View>
    );
  }

  // Default spinner variant
  return (
    <View style={styles.spinner}>
      <ActivityIndicator size={size} color={getColor()} />
      {text && (
        <Text style={[styles.spinnerText, { color: getTextColor() }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  spinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinnerText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
  },
});