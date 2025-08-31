/**
 * Card component for consistent layout containers
 */
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isDark?: boolean;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  margin = 'none',
  borderRadius = 'md',
  isDark = false,
  style,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
      },
      elevated: {
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
      outlined: {
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isDark ? '#4B5563' : '#E5E7EB',
      },
    };

    // Padding styles
    const paddingStyles: Record<string, ViewStyle> = {
      none: { padding: 0 },
      sm: { padding: 8 },
      md: { padding: 16 },
      lg: { padding: 24 },
      xl: { padding: 32 },
    };

    // Margin styles
    const marginStyles: Record<string, ViewStyle> = {
      none: { margin: 0 },
      sm: { margin: 8 },
      md: { margin: 16 },
      lg: { margin: 24 },
      xl: { margin: 32 },
    };

    // Border radius styles
    const borderRadiusStyles: Record<string, ViewStyle> = {
      none: { borderRadius: 0 },
      sm: { borderRadius: 4 },
      md: { borderRadius: 8 },
      lg: { borderRadius: 12 },
      xl: { borderRadius: 16 },
      full: { borderRadius: 9999 },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...paddingStyles[padding],
      ...marginStyles[margin],
      ...borderRadiusStyles[borderRadius],
      ...style,
    };
  };

  return <View style={getCardStyle()}>{children}</View>;
};