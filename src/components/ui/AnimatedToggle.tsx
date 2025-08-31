/**
 * Animated Toggle Switch - "Calm Authority" Theme
 * Satisfying toggle with smooth animations and haptic feedback
 * Perfect for app/website blocking controls
 */
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  ViewStyle,
  Vibration,
} from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { animationTiming, easingCurves } from '../../theme/animations';

interface AnimatedToggleProps {
  // State
  value: boolean;
  onValueChange: (value: boolean) => void;
  
  // Behavior
  disabled?: boolean;
  
  // Styling
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  
  // Animation
  enableHaptics?: boolean;
  animationDuration?: number;
  
  // Custom styles
  style?: ViewStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'medium',
  variant = 'default',
  enableHaptics = true,
  animationDuration = animationTiming.fast,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, spacing } = useAppTheme();
  
  // Animation values
  const translateXAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const backgroundColorAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Update animations when value changes
  useEffect(() => {
    const toValue = value ? 1 : 0;
    
    // Separate native and non-native animations to avoid conflicts
    Animated.parallel([
      // Native driver animation for transform
      Animated.timing(translateXAnim, {
        toValue,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      // Non-native driver animation for background color
      Animated.timing(backgroundColorAnim, {
        toValue,
        duration: animationDuration,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, translateXAnim, backgroundColorAnim, animationDuration]);

  // Get size-based dimensions
  const getSizeDimensions = () => {
    const dimensions = {
      small: {
        width: 40,
        height: 20,
        thumbSize: 16,
        padding: 2,
      },
      medium: {
        width: 50,
        height: 26,
        thumbSize: 22,
        padding: 2,
      },
      large: {
        width: 60,
        height: 32,
        thumbSize: 28,
        padding: 2,
      },
    };
    
    return dimensions[size];
  };

  // Get variant colors
  const getVariantColors = () => {
    const variants = {
      default: {
        activeColor: colors.primary,
        inactiveColor: colors.border,
      },
      success: {
        activeColor: colors.success,
        inactiveColor: colors.border,
      },
      warning: {
        activeColor: colors.warning,
        inactiveColor: colors.border,
      },
      danger: {
        activeColor: colors.error,
        inactiveColor: colors.border,
      },
    };
    
    return variants[variant];
  };

  // Handle press
  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback based on new state
    if (enableHaptics) {
      // Use simple vibration for feedback
      Vibration.vibrate(50); // 50ms vibration
    }

    // Brief scale animation for feedback (applied to the entire toggle)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: animationTiming.instant,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle the value
    onValueChange(!value);
  };

  const dimensions = getSizeDimensions();
  const variantColors = getVariantColors();
  const thumbTranslateX = dimensions.width - dimensions.thumbSize - (dimensions.padding * 2);

  // Interpolate background color
  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [variantColors.inactiveColor, variantColors.activeColor],
  });

  // Interpolate thumb position
  const thumbTranslateXValue = translateXAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, thumbTranslateX],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      {/* Outermost scale container - completely separate from other animations */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Background container - uses non-native driver for backgroundColor */}
        <Animated.View
          style={[
            {
              width: dimensions.width,
              height: dimensions.height,
              borderRadius: dimensions.height / 2,
              padding: dimensions.padding,
              justifyContent: 'center',
              opacity: disabled ? 0.6 : 1,
              backgroundColor, // Non-native animation
            },
            style,
          ]}
        >
          {/* Thumb - uses native driver for translateX */}
          <Animated.View
            style={{
              width: dimensions.thumbSize,
              height: dimensions.thumbSize,
              borderRadius: dimensions.thumbSize / 2,
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
              transform: [{ translateX: thumbTranslateXValue }],
            }}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedToggle;