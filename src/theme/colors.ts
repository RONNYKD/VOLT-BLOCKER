/**
 * Color system for VOLT app - "Calm Authority" Theme
 * Research-based color psychology for digital wellness apps
 * Combines trust (blue), wellness (green), and warmth (amber)
 */

export const colors = {
  // Primary: Deep Trust Blue (conveys security, professionalism, reliability)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main primary - trustworthy blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',  // Deep trust blue for headers
    900: '#1e3a8a',  // Darkest for emphasis
    950: '#172554',
  },

  // Secondary: Calm Sage Green (wellness, growth, balance, nature)
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',  // Main secondary - wellness green
    600: '#059669',  // Deep wellness green
    700: '#047857',  // Darker for focus states
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  // Neutral colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Accent: Warm Amber (progress, achievement, warmth, optimism)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',  // Light highlights
    400: '#fbbf24',
    500: '#f59e0b',  // Main accent - warm amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Success colors (aligned with secondary green)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',  // Matches secondary for consistency
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  // Warning colors (aligned with accent amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Matches accent for consistency
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Special colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Opal-inspired color palette
export const opalColors = {
  // Deep black background like Opal
  background: '#000000',
  surface: '#111111',
  surfaceVariant: '#1a1a1a',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  
  // Accent colors inspired by Opal
  accent: {
    cyan: '#00ffff',
    teal: '#00d4aa',
    green: '#00ff88',
    orange: '#ff6b35',
    red: '#ff4757',
    purple: '#a55eea',
  },
  
  // Borders and dividers
  border: '#333333',
  borderFocus: '#00ffff',
  
  // Shadows and effects
  shadow: '#000000',
  glow: 'rgba(0, 255, 255, 0.3)',
};

// "Calm Authority" Theme Mappings
export const lightThemeColors = {
  // Backgrounds - Clean and professional
  background: colors.neutral[50],        // Soft white background
  surface: colors.white,                 // Pure white cards/surfaces
  surfaceVariant: colors.neutral[100],   // Subtle gray for secondary surfaces
  surfaceElevated: colors.white,         // Elevated surfaces (modals, etc.)
  
  // Text hierarchy - Clear and readable
  text: colors.neutral[900],             // Primary text - deep gray
  textSecondary: colors.neutral[600],    // Secondary text - medium gray
  textMuted: colors.neutral[400],        // Muted text - light gray
  textInverse: colors.white,             // White text on dark backgrounds
  
  // Interactive elements
  primary: colors.primary[500],          // Main brand blue
  primaryHover: colors.primary[600],     // Hover state
  primaryPressed: colors.primary[700],   // Pressed state
  primaryDisabled: colors.primary[300],  // Disabled state
  
  secondary: colors.secondary[500],      // Wellness green
  secondaryHover: colors.secondary[600], // Hover state
  secondaryPressed: colors.secondary[700], // Pressed state
  
  accent: colors.accent[500],            // Warm amber for highlights
  accentHover: colors.accent[600],       // Hover state
  accentLight: colors.accent[100],       // Light accent backgrounds
  
  // Semantic colors
  success: colors.success[500],          // Success green
  successLight: colors.success[50],      // Success background
  warning: colors.warning[500],          // Warning amber
  warningLight: colors.warning[50],      // Warning background
  error: colors.error[500],              // Error red
  errorLight: colors.error[50],          // Error background
  
  // Borders and dividers
  border: colors.neutral[200],           // Default borders
  borderLight: colors.neutral[100],      // Light borders
  borderFocus: colors.primary[500],      // Focus borders
  borderError: colors.error[300],        // Error borders
  
  // Shadows and effects
  shadow: 'rgba(0, 0, 0, 0.1)',        // Subtle shadows
  shadowMedium: 'rgba(0, 0, 0, 0.15)',  // Medium shadows
  shadowStrong: 'rgba(0, 0, 0, 0.25)',  // Strong shadows
  overlay: 'rgba(0, 0, 0, 0.5)',        // Modal overlays
};

export const darkThemeColors = {
  // Backgrounds - Sophisticated dark theme
  background: colors.neutral[950],       // Deep dark background
  surface: colors.neutral[900],          // Dark cards/surfaces
  surfaceVariant: colors.neutral[800],   // Secondary dark surfaces
  surfaceElevated: colors.neutral[800],  // Elevated surfaces
  
  // Text hierarchy - High contrast for readability
  text: colors.neutral[50],              // Light text
  textSecondary: colors.neutral[300],    // Secondary light text
  textMuted: colors.neutral[400],        // Muted text
  textInverse: colors.neutral[900],      // Dark text on light backgrounds
  
  // Interactive elements - Adjusted for dark theme
  primary: colors.primary[400],          // Lighter blue for dark theme
  primaryHover: colors.primary[300],     // Hover state
  primaryPressed: colors.primary[500],   // Pressed state
  primaryDisabled: colors.primary[700],  // Disabled state
  
  secondary: colors.secondary[400],      // Lighter green for dark theme
  secondaryHover: colors.secondary[300], // Hover state
  secondaryPressed: colors.secondary[500], // Pressed state
  
  accent: colors.accent[400],            // Lighter amber for dark theme
  accentHover: colors.accent[300],       // Hover state
  accentLight: colors.accent[900],       // Dark accent backgrounds
  
  // Semantic colors - Dark theme variants
  success: colors.success[400],          // Success green
  successLight: colors.success[900],     // Success background
  warning: colors.warning[400],          // Warning amber
  warningLight: colors.warning[900],     // Warning background
  error: colors.error[400],              // Error red
  errorLight: colors.error[900],         // Error background
  
  // Borders and dividers
  border: colors.neutral[700],           // Default borders
  borderLight: colors.neutral[800],      // Light borders
  borderFocus: colors.primary[400],      // Focus borders
  borderError: colors.error[600],        // Error borders
  
  // Shadows and effects
  shadow: 'rgba(0, 0, 0, 0.3)',        // Stronger shadows for dark theme
  shadowMedium: 'rgba(0, 0, 0, 0.4)',   // Medium shadows
  shadowStrong: 'rgba(0, 0, 0, 0.6)',   // Strong shadows
  overlay: 'rgba(0, 0, 0, 0.7)',        // Modal overlays
};