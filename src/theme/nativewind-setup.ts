/**
 * NativeWind theme setup and integration - "Calm Authority" Theme
 * Enhanced theme hook with typography, spacing, and color systems
 */
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settings';
import { colors, lightThemeColors, darkThemeColors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, layout, spacingUtils } from './spacing';

export const useAppTheme = () => {
  const systemColorScheme = useColorScheme();
  const { theme: userTheme } = useSettingsStore();

  // Determine the actual theme to use
  const isDark = userTheme === 'system'
    ? systemColorScheme === 'dark'
    : userTheme === 'dark';

  const theme = isDark ? 'dark' : 'light';
  const themeColors = isDark ? darkThemeColors : lightThemeColors;

  return {
    // Theme state
    isDark,
    theme,
    colorScheme: systemColorScheme,
    userTheme,

    // Color system
    colors: themeColors,
    rawColors: colors,

    // Typography system
    typography,
    textStyles,

    // Spacing system
    spacing,
    layout,
    spacingUtils,

    // Utility functions
    utils: {
      // Get color with opacity
      withOpacity: (color: string, opacity: number) => {
        if (color.startsWith('rgba')) return color;
        if (color.startsWith('#')) {
          const hex = color.slice(1);
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
      },

      // Get shadow style based on elevation
      getShadow: (elevation: keyof typeof spacing.shadow) => ({
        ...spacing.shadow[elevation],
        shadowColor: themeColors.shadow,
      }),

      // Get text style with theme colors
      getTextStyle: (style: keyof typeof textStyles, color?: keyof typeof themeColors) => ({
        ...textStyles[style],
        color: color ? themeColors[color] : themeColors.text,
      }),

      // Get spacing value
      getSpacing: (size: keyof typeof spacing) => spacing[size as keyof typeof spacing] as number,

      // Create consistent button style
      getButtonStyle: (variant: 'primary' | 'secondary' | 'accent' | 'ghost' = 'primary') => {
        const baseStyle = {
          paddingVertical: spacing.component.button.paddingVertical,
          paddingHorizontal: spacing.component.button.paddingHorizontal,
          borderRadius: spacing.borderRadius.md,
          ...textStyles.button,
        };

        switch (variant) {
          case 'primary':
            return {
              ...baseStyle,
              backgroundColor: themeColors.primary,
              color: themeColors.textInverse,
            };
          case 'secondary':
            return {
              ...baseStyle,
              backgroundColor: themeColors.secondary,
              color: themeColors.textInverse,
            };
          case 'accent':
            return {
              ...baseStyle,
              backgroundColor: themeColors.accent,
              color: themeColors.textInverse,
            };
          case 'ghost':
            return {
              ...baseStyle,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: themeColors.border,
              color: themeColors.text,
            };
          default:
            return baseStyle;
        }
      },

      // Create consistent card style
      getCardStyle: () => ({
        backgroundColor: themeColors.surface,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.component.card.padding,
        ...spacing.shadow.sm,
        shadowColor: themeColors.shadow,
      }),
    },
  };
};

// NativeWind class helper for dynamic theming
export const tw = (className: string, isDark?: boolean) => {
  if (isDark === undefined) return className;

  // Add dark: prefix for dark mode classes
  const darkClasses = className
    .split(' ')
    .map(cls => isDark && !cls.startsWith('dark:') ? `dark:${cls}` : cls)
    .join(' ');

  return darkClasses;
};