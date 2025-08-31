/**
 * Animation system for VOLT app - "Calm Authority" Theme
 * Gentle, purposeful animations that build trust and emotional connection
 * Based on research for digital wellness apps
 */

// Animation timing constants - Gentle and reassuring
export const animationTiming = {
  // Micro-interactions - Immediate feedback
  instant: 100,     // Button press feedback
  quick: 150,       // Toggle switches, small state changes
  fast: 200,        // Hover effects, focus states
  
  // Standard animations - Smooth and natural
  normal: 300,      // Card animations, modal slides
  medium: 400,      // Page transitions, larger movements
  slow: 500,        // Loading states, progress animations
  
  // Emotional animations - Satisfying and memorable
  satisfying: 600,  // Achievement animations, completion states
  celebration: 800, // Success celebrations, milestone animations
  gentle: 1000,     // Breathing animations, calm pulsing
};

// Easing curves - Natural and organic feeling
export const easingCurves = {
  // Standard easing - Smooth and professional
  easeOut: 'ease-out',           // Most button interactions
  easeIn: 'ease-in',             // Disappearing elements
  easeInOut: 'ease-in-out',      // Balanced transitions
  
  // Custom curves for emotional impact
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',      // Gentle, calming
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',    // Playful feedback
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',              // Material Design
  organic: 'cubic-bezier(0.25, 0.1, 0.25, 1)',         // Natural feeling
};

// Animation presets for common interactions
export const animationPresets = {
  // Button animations - Trustworthy and responsive
  button: {
    press: {
      scale: 0.98,
      duration: animationTiming.instant,
      easing: easingCurves.easeOut,
    },
    hover: {
      scale: 1.02,
      duration: animationTiming.fast,
      easing: easingCurves.gentle,
    },
    disabled: {
      opacity: 0.6,
      duration: animationTiming.fast,
      easing: easingCurves.easeOut,
    },
  },

  // Card animations - Professional elevation
  card: {
    hover: {
      translateY: -2,
      shadowOpacity: 0.15,
      duration: animationTiming.fast,
      easing: easingCurves.gentle,
    },
    press: {
      translateY: 0,
      shadowOpacity: 0.05,
      duration: animationTiming.quick,
      easing: easingCurves.easeOut,
    },
  },

  // Toggle animations - Satisfying state changes
  toggle: {
    switch: {
      duration: animationTiming.fast,
      easing: easingCurves.smooth,
    },
    color: {
      duration: animationTiming.normal,
      easing: easingCurves.gentle,
    },
  },

  // Modal animations - Smooth and non-jarring
  modal: {
    slideUp: {
      translateY: { from: 100, to: 0 },
      opacity: { from: 0, to: 1 },
      duration: animationTiming.normal,
      easing: easingCurves.smooth,
    },
    fadeIn: {
      opacity: { from: 0, to: 1 },
      scale: { from: 0.95, to: 1 },
      duration: animationTiming.medium,
      easing: easingCurves.gentle,
    },
  },

  // Loading animations - Calming and patient
  loading: {
    pulse: {
      opacity: { from: 0.6, to: 1 },
      duration: animationTiming.gentle,
      easing: easingCurves.easeInOut,
      repeat: true,
    },
    shimmer: {
      translateX: { from: -100, to: 100 },
      duration: animationTiming.celebration,
      easing: easingCurves.easeInOut,
      repeat: true,
    },
  },

  // Progress animations - Emotionally satisfying
  progress: {
    fill: {
      width: { animated: true },
      duration: animationTiming.satisfying,
      easing: easingCurves.smooth,
    },
    countdown: {
      strokeDashoffset: { animated: true },
      duration: animationTiming.medium,
      easing: easingCurves.easeOut,
    },
  },

  // Success animations - Celebratory but calm
  success: {
    checkmark: {
      scale: { from: 0, to: 1 },
      opacity: { from: 0, to: 1 },
      duration: animationTiming.satisfying,
      easing: easingCurves.bounce,
    },
    celebration: {
      scale: { from: 1, to: 1.05, to: 1 },
      duration: animationTiming.celebration,
      easing: easingCurves.gentle,
    },
  },

  // Focus session animations - Calming and meditative
  focus: {
    breathing: {
      scale: { from: 1, to: 1.1, to: 1 },
      opacity: { from: 0.8, to: 1, to: 0.8 },
      duration: 4000, // 4 second breathing cycle
      easing: easingCurves.easeInOut,
      repeat: true,
    },
    timer: {
      rotation: { from: 0, to: 360 },
      duration: 60000, // 1 minute rotation
      easing: 'linear',
      repeat: true,
    },
  },
};

// Animation state management
export const animationStates = {
  // Button states
  buttonStates: {
    idle: { scale: 1, opacity: 1 },
    hover: { scale: 1.02, opacity: 1 },
    pressed: { scale: 0.98, opacity: 0.9 },
    disabled: { scale: 1, opacity: 0.6 },
    loading: { scale: 1, opacity: 0.8 },
  },

  // Card states
  cardStates: {
    idle: { translateY: 0, shadowOpacity: 0.1 },
    hover: { translateY: -2, shadowOpacity: 0.15 },
    pressed: { translateY: 0, shadowOpacity: 0.05 },
    selected: { translateY: -1, shadowOpacity: 0.2 },
  },

  // Toggle states
  toggleStates: {
    off: { translateX: 0, backgroundColor: '#e5e7eb' },
    on: { translateX: 20, backgroundColor: '#10b981' },
  },
};

// Haptic feedback patterns (for React Native Haptics)
export const hapticPatterns = {
  // Light feedback for subtle interactions
  light: 'light',
  
  // Medium feedback for important actions
  medium: 'medium',
  
  // Heavy feedback for critical actions
  heavy: 'heavy',
  
  // Success feedback for achievements
  success: 'notificationSuccess',
  
  // Warning feedback for cautions
  warning: 'notificationWarning',
  
  // Error feedback for mistakes
  error: 'notificationError',
  
  // Selection feedback for toggles
  selection: 'selection',
  
  // Impact feedback for button presses
  impact: 'impactMedium',
};

// Animation utility functions
export const animationUtils = {
  // Create a spring animation config
  createSpring: (tension = 300, friction = 30) => ({
    type: 'spring',
    tension,
    friction,
    useNativeDriver: true,
  }),

  // Create a timing animation config
  createTiming: (duration: number, easing = easingCurves.easeOut) => ({
    type: 'timing',
    duration,
    easing,
    useNativeDriver: true,
  }),

  // Create a sequence of animations
  createSequence: (animations: any[]) => ({
    type: 'sequence',
    animations,
  }),

  // Create parallel animations
  createParallel: (animations: any[]) => ({
    type: 'parallel',
    animations,
  }),

  // Create a loop animation
  createLoop: (animation: any, iterations = -1) => ({
    type: 'loop',
    animation,
    iterations,
  }),

  // Interpolate values for smooth transitions
  interpolate: (
    inputRange: number[],
    outputRange: number[] | string[],
    extrapolate = 'clamp'
  ) => ({
    inputRange,
    outputRange,
    extrapolate,
  }),
};

// Performance optimization settings
export const animationPerformance = {
  // Use native driver when possible for 60fps animations
  useNativeDriver: true,
  
  // Reduce motion for accessibility
  respectReducedMotion: true,
  
  // Optimize for battery life
  pauseAnimationsOnBackground: true,
  
  // Memory management
  cleanupOnUnmount: true,
};

export default {
  timing: animationTiming,
  easing: easingCurves,
  presets: animationPresets,
  states: animationStates,
  haptics: hapticPatterns,
  utils: animationUtils,
  performance: animationPerformance,
};