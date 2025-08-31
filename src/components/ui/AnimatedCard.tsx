/**
 * Animated Card Component - "Calm Authority" Theme
 * Professional card with gentle elevation animations and smooth interactions
 * Creates trust through subtle, responsive visual feedback
 */
import React, { useRef, ReactNode } from 'react';
import {
  TouchableOpacity,
  View,
  Animated,
  ViewStyle,
  Vibration,
} from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { animationTiming } from '../../theme/animations';

interface AnimatedCardProps {
  // Content
  children: ReactNode;
  
  // Behavior
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  
  // Styling
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  // Animation
  enableHoverAnimation?: boolean;
  enablePressAnimation?: boolean;
  enableHaptics?: boolean;
  animationIntensity?: 'subtle' | 'normal' | 'strong';
  
  // Custom styles
  style?: ViewStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  variant = 'default',
  padding = 'medium',
  enableHoverAnimation = true,
  enablePressAnimation = true,
  enableHaptics = true,
  animationIntensity = 'normal',
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  const { colors, spacing, utils } = useAppTheme();
  
  // Animation values
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0.1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Animation intensity multipliers
  const getIntensityMultiplier = () => {
    switch (animationIntensity) {
      case 'subtle': return 0.5;
      case 'strong': return 1.5;
      default: return 1;
    }
  };

  // Handle press in - gentle press effect
  const handlePressIn = () => {
    if (disabled || !enablePressAnimation) return;

    const intensity = getIntensityMultiplier();

    // Light haptic feedback
    if (enableHaptics) {
      Vibration.vibrate(30); // Light vibration for press
    }

    // Press animation - subtle scale and shadow reduction
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1 - (0.01 * intensity), // Very subtle scale down
        duration: animationTiming.instant,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 1 * intensity, // Slight downward movement
        duration: animationTiming.instant,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.05,
        duration: animationTiming.instant,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Handle press out - return to hover state or normal
  const handlePressOut = () => {
    if (disabled) return;

    const intensity = getIntensityMultiplier();

    // Return to elevated state (hover effect)
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: enableHoverAnimation ? -2 * intensity : 0,
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: enableHoverAnimation ? 0.15 : 0.1,
        duration: animationTiming.quick,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Handle press - execute action with feedback
  const handlePress = () => {
    if (disabled || !onPress) return;

    // Medium haptic feedback for successful interaction
    if (enableHaptics) {
      Vibration.vibrate(50); // Medium vibration for success
    }

    // Brief success animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.005, // Very subtle scale up
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  // Handle long press
  const handleLongPress = () => {
    if (disabled || !onLongPress) return;

    // Strong haptic feedback for long press
    if (enableHaptics) {
      Vibration.vibrate(100); // Strong vibration for long press
    }

    onLongPress();
  };

  // Get card style based on variant
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing.borderRadius.md,
      overflow: 'hidden',
    };

    // Padding styles
    const paddingStyles = {
      none: {},
      small: { padding: spacing.component.card.padding / 2 },
      medium: { padding: spacing.component.card.padding },
      large: { padding: spacing.component.card.paddingLarge },
    };

    // Variant styles
    const variantStyles = {
      default: {
        backgroundColor: colors.surface,
      },
      elevated: {
        backgroundColor: colors.surface,
      },
      outlined: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      filled: {
        backgroundColor: colors.surfaceVariant,
      },
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...variantStyles[variant],
    };
  };

  // Get shadow style based on variant
  const getShadowStyle = () => {
    if (variant === 'outlined') {
      return {}; // No shadow for outlined cards
    }

    return {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    };
  };

  // Render as touchable if onPress is provided
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled}
        activeOpacity={1} // We handle opacity with animations
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled }}
      >
        <Animated.View
          style={[
            getCardStyle(),
            getShadowStyle(),
            {
              transform: [
                { translateY: translateYAnim },
                { scale: scaleAnim },
              ],
              opacity: disabled ? 0.6 : opacityAnim,
              shadowOpacity: shadowOpacityAnim,
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Render as static view if no onPress
  return (
    <Animated.View
      style={[
        getCardStyle(),
        getShadowStyle(),
        {
          opacity: disabled ? 0.6 : 1,
          shadowOpacity: 0.1,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedCard;