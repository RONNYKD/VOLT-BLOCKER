/**
 * Theme barrel file - "Calm Authority" Theme System
 * Export all theme utilities and configurations for VOLT app
 */

// Core theme components
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './animations';
export * from './ThemeProvider';
export * from './nativewind-setup';

// Re-export commonly used theme utilities
export { colors, lightThemeColors, darkThemeColors } from './colors';
export { typography, textStyles, createTextStyle } from './typography';
export { spacing, layout, spacingUtils } from './spacing';
export { 
  animationTiming, 
  easingCurves, 
  animationPresets, 
  animationStates,
  hapticPatterns,
  animationUtils 
} from './animations';