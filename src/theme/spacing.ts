/**
 * Spacing system for VOLT app - "Calm Authority" Theme
 * Consistent spacing scale for professional and calming layouts
 * Based on 8px grid system for pixel-perfect alignment
 */

// Base spacing unit - 8px grid system
const BASE_UNIT = 8;

export const spacing = {
  // Micro spacing - For fine adjustments
  micro: {
    xs: 2,   // 2px - Tiny adjustments
    sm: 4,   // 4px - Small adjustments
  },
  
  // Standard spacing scale - 8px grid
  xs: BASE_UNIT * 0.5,      // 4px
  sm: BASE_UNIT * 1,        // 8px
  md: BASE_UNIT * 2,        // 16px
  lg: BASE_UNIT * 3,        // 24px
  xl: BASE_UNIT * 4,        // 32px
  '2xl': BASE_UNIT * 5,     // 40px
  '3xl': BASE_UNIT * 6,     // 48px
  '4xl': BASE_UNIT * 8,     // 64px
  '5xl': BASE_UNIT * 10,    // 80px
  '6xl': BASE_UNIT * 12,    // 96px
  
  // Component-specific spacing
  component: {
    // Button spacing
    button: {
      paddingVertical: BASE_UNIT * 1.5,    // 12px
      paddingHorizontal: BASE_UNIT * 3,    // 24px
      paddingVerticalLarge: BASE_UNIT * 2, // 16px
      paddingHorizontalLarge: BASE_UNIT * 4, // 32px
      paddingVerticalSmall: BASE_UNIT,     // 8px
      paddingHorizontalSmall: BASE_UNIT * 2, // 16px
    },
    
    // Card spacing
    card: {
      padding: BASE_UNIT * 2,              // 16px
      paddingLarge: BASE_UNIT * 3,         // 24px
      margin: BASE_UNIT * 2,               // 16px
      gap: BASE_UNIT * 1.5,                // 12px
    },
    
    // Input field spacing
    input: {
      paddingVertical: BASE_UNIT * 1.5,    // 12px
      paddingHorizontal: BASE_UNIT * 2,    // 16px
      marginBottom: BASE_UNIT * 2,         // 16px
    },
    
    // List item spacing
    listItem: {
      paddingVertical: BASE_UNIT * 2,      // 16px
      paddingHorizontal: BASE_UNIT * 2,    // 16px
      gap: BASE_UNIT * 1.5,                // 12px
    },
    
    // Modal spacing
    modal: {
      padding: BASE_UNIT * 3,              // 24px
      margin: BASE_UNIT * 2,               // 16px
    },
    
    // Screen spacing
    screen: {
      paddingHorizontal: BASE_UNIT * 2.5,  // 20px
      paddingVertical: BASE_UNIT * 2,      // 16px
      headerHeight: BASE_UNIT * 7,         // 56px
      tabBarHeight: BASE_UNIT * 8,         // 64px
    },
  },
  
  // Touch targets - Accessibility-friendly sizes
  touchTarget: {
    minimum: 44,    // iOS minimum touch target
    comfortable: 48, // Comfortable touch target
    large: 56,      // Large touch target
  },
  
  // Border radius - Consistent rounded corners
  borderRadius: {
    none: 0,
    xs: 2,          // Subtle rounding
    sm: 4,          // Small rounding
    md: 8,          // Default rounding - friendly but professional
    lg: 12,         // Large rounding
    xl: 16,         // Extra large rounding
    '2xl': 24,      // Very large rounding
    full: 9999,     // Fully rounded (pills, circles)
  },
  
  // Shadows - Elevation system
  shadow: {
    none: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    
    xl: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    
    // Special shadow for floating elements
    floating: {
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

// Layout helpers - Common layout patterns
export const layout = {
  // Flex layouts
  flex: {
    center: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    
    centerVertical: {
      justifyContent: 'center' as const,
    },
    
    centerHorizontal: {
      alignItems: 'center' as const,
    },
    
    spaceBetween: {
      justifyContent: 'space-between' as const,
    },
    
    spaceAround: {
      justifyContent: 'space-around' as const,
    },
    
    spaceEvenly: {
      justifyContent: 'space-evenly' as const,
    },
  },
  
  // Common dimensions
  dimensions: {
    // Header heights
    headerHeight: spacing.component.screen.headerHeight,
    tabBarHeight: spacing.component.screen.tabBarHeight,
    
    // Common widths
    buttonWidth: {
      small: 80,
      medium: 120,
      large: 160,
      full: '100%' as const,
    },
    
    // Icon sizes
    iconSize: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      '2xl': 40,
    },
  },
  
  // Safe areas and insets
  safeArea: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.component.screen.paddingHorizontal,
  },
};

// Utility functions for spacing calculations
export const spacingUtils = {
  // Calculate spacing based on multiplier
  multiply: (size: keyof typeof spacing, multiplier: number): number => {
    const baseValue = spacing[size as keyof typeof spacing];
    return typeof baseValue === 'number' ? baseValue * multiplier : BASE_UNIT * multiplier;
  },
  
  // Get responsive spacing based on screen size
  responsive: (small: number, large: number, isLargeScreen: boolean): number => {
    return isLargeScreen ? large : small;
  },
  
  // Create consistent gaps for flex layouts
  gap: (size: keyof typeof spacing): { gap: number } => ({
    gap: spacing[size as keyof typeof spacing] as number,
  }),
  
  // Create padding objects
  padding: {
    all: (size: keyof typeof spacing) => ({
      padding: spacing[size as keyof typeof spacing] as number,
    }),
    
    horizontal: (size: keyof typeof spacing) => ({
      paddingHorizontal: spacing[size as keyof typeof spacing] as number,
    }),
    
    vertical: (size: keyof typeof spacing) => ({
      paddingVertical: spacing[size as keyof typeof spacing] as number,
    }),
    
    top: (size: keyof typeof spacing) => ({
      paddingTop: spacing[size as keyof typeof spacing] as number,
    }),
    
    bottom: (size: keyof typeof spacing) => ({
      paddingBottom: spacing[size as keyof typeof spacing] as number,
    }),
    
    left: (size: keyof typeof spacing) => ({
      paddingLeft: spacing[size as keyof typeof spacing] as number,
    }),
    
    right: (size: keyof typeof spacing) => ({
      paddingRight: spacing[size as keyof typeof spacing] as number,
    }),
  },
  
  // Create margin objects
  margin: {
    all: (size: keyof typeof spacing) => ({
      margin: spacing[size as keyof typeof spacing] as number,
    }),
    
    horizontal: (size: keyof typeof spacing) => ({
      marginHorizontal: spacing[size as keyof typeof spacing] as number,
    }),
    
    vertical: (size: keyof typeof spacing) => ({
      marginVertical: spacing[size as keyof typeof spacing] as number,
    }),
    
    top: (size: keyof typeof spacing) => ({
      marginTop: spacing[size as keyof typeof spacing] as number,
    }),
    
    bottom: (size: keyof typeof spacing) => ({
      marginBottom: spacing[size as keyof typeof spacing] as number,
    }),
    
    left: (size: keyof typeof spacing) => ({
      marginLeft: spacing[size as keyof typeof spacing] as number,
    }),
    
    right: (size: keyof typeof spacing) => ({
      marginRight: spacing[size as keyof typeof spacing] as number,
    }),
  },
};

export default spacing;