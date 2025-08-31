/**
 * Typography system for VOLT app - "Calm Authority" Theme
 * Professional, readable, and trustworthy typography hierarchy
 * Optimized for digital wellness and user trust
 */

export const typography = {
  // Font families - System fonts for reliability and performance
  fontFamily: {
    // Primary font stack - Clean and professional
    sans: 'System', // React Native default system font
    // Alternative: 'Roboto' on Android, 'SF Pro' on iOS
    
    // Monospace for code/technical content
    mono: 'Courier New',
  },

  // Font sizes - Carefully scaled for readability and hierarchy
  fontSize: {
    // Display sizes - For hero sections and major headings
    display: {
      large: 40,   // Hero text
      medium: 32,  // Major section headers
      small: 28,   // Sub-headers
    },
    
    // Heading sizes - Clear hierarchy
    heading: {
      h1: 24,      // Main page titles
      h2: 20,      // Section titles
      h3: 18,      // Subsection titles
      h4: 16,      // Card titles
    },
    
    // Body text - Optimized for readability
    body: {
      large: 18,   // Important body text
      medium: 16,  // Default body text
      small: 14,   // Secondary body text
    },
    
    // UI elements - Interface text
    ui: {
      button: 16,  // Button text
      input: 16,   // Input field text
      label: 14,   // Form labels
      caption: 12, // Captions and metadata
      tiny: 10,    // Fine print
    },
  },

  // Font weights - Semantic naming for consistency
  fontWeight: {
    light: '300',     // Light text for subtle elements
    regular: '400',   // Default body text
    medium: '500',    // Slightly emphasized text
    semibold: '600',  // Important text, buttons
    bold: '700',      // Headings, strong emphasis
    extrabold: '800', // Hero text, major emphasis
  },

  // Line heights - Optimized for readability
  lineHeight: {
    tight: 1.2,    // Headings and compact text
    normal: 1.4,   // Default body text
    relaxed: 1.6,  // Comfortable reading
    loose: 1.8,    // Very comfortable, accessible
  },

  // Letter spacing - Subtle adjustments for professionalism
  letterSpacing: {
    tight: -0.5,   // Large headings
    normal: 0,     // Default
    wide: 0.5,     // Buttons and labels
    wider: 1,      // All caps text
  },
};

// Pre-defined text styles for common use cases
export const textStyles = {
  // Display styles - Hero sections
  displayLarge: {
    fontSize: typography.fontSize.display.large,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  displayMedium: {
    fontSize: typography.fontSize.display.medium,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },

  // Heading styles - Clear hierarchy
  h1: {
    fontSize: typography.fontSize.heading.h1,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  h2: {
    fontSize: typography.fontSize.heading.h2,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  h3: {
    fontSize: typography.fontSize.heading.h3,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  h4: {
    fontSize: typography.fontSize.heading.h4,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Body text styles - Readable and comfortable
  bodyLarge: {
    fontSize: typography.fontSize.body.large,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  body: {
    fontSize: typography.fontSize.body.medium,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  bodySmall: {
    fontSize: typography.fontSize.body.small,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // UI element styles - Interface components
  button: {
    fontSize: typography.fontSize.ui.button,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  buttonLarge: {
    fontSize: typography.fontSize.body.large,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  input: {
    fontSize: typography.fontSize.ui.input,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  label: {
    fontSize: typography.fontSize.ui.label,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  caption: {
    fontSize: typography.fontSize.ui.caption,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Special styles - Emotional impact
  hero: {
    fontSize: typography.fontSize.display.large,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  // Trustworthy and professional
  professional: {
    fontSize: typography.fontSize.body.medium,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // Calming and supportive
  supportive: {
    fontSize: typography.fontSize.body.medium,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // Achievement and progress
  achievement: {
    fontSize: typography.fontSize.heading.h3,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.normal,
  },
};

// Utility function to create text style objects
export const createTextStyle = (
  size: keyof typeof typography.fontSize.body | number,
  weight: keyof typeof typography.fontWeight,
  lineHeight?: keyof typeof typography.lineHeight,
  letterSpacing?: keyof typeof typography.letterSpacing
) => ({
  fontSize: typeof size === 'number' ? size : typography.fontSize.body[size],
  fontWeight: typography.fontWeight[weight],
  lineHeight: lineHeight ? typography.lineHeight[lineHeight] : typography.lineHeight.normal,
  letterSpacing: letterSpacing ? typography.letterSpacing[letterSpacing] : typography.letterSpacing.normal,
});

// Export for easy access
export default typography;