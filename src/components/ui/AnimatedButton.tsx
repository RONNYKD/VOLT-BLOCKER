/**
 * Animated Button Component - "Calm Authority" Theme
 * Professional button with gentle micro-animations and haptic feedback
 * Builds user trust through smooth, responsive interactions
 */
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  Animated,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { animationPresets, animationTiming, easingCurves, hapticPatterns } from '../../theme/animations';

interface AnimatedButtonProps {
  // Content
  title: string;
  subtitle?: string;
  
  // Behavior
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  
  // Styling
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  
  // Animation
  enableHaptics?: boolean;
  animationIntensity?: 'subtle' | 'normal' | 'strong';
  
  // Custom styles
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  subtitle,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  enableHaptics = true,
  animationIntensity = 'normal',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, textStyles, spacing, utils } = useAppTheme();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  // Update animations when disabled/loading state changes
  useEffect(() => {
    if (disabled || loading) {
      Animated.timing(opacityAnim, {
        toValue: 0.6,
        duration: animationTiming.fast,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: animationTiming.fast,
        useNativeDriver: true,
      }).start();
    }
  }, [disabled, loading, opacityAnim]);

  // Animation intensity multipliers
  const getIntensityMultiplier = () => {
    switch (animationIntensity) {
      case 'subtle': return 0.5;
      case 'strong': return 1.5;
      default: return 1;
    }
  };

  // Handle press in - gentle scale down
  const handlePressIn = () => {
    if (disabled || loading) return;

    const intensity = getIntensityMultiplier();
    const scaleValue = 1 - (0.02 * intensity); // Subtle scale down

    // Haptic feedback
    if (enableHaptics) {
      Vibration.vibrate(30); // Light vibration for press
    }

    // Scale animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: scaleValue,
        duration: animationTiming.instant,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: -2 * intensity,
        duration: animationTiming.instant,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Handle press out - return to normal
  const handlePressOut = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: animationTiming.quick,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Handle press - execute action with feedback
  const handlePress = () => {
    if (disabled || loading) return;

    // Success haptic feedback
    if (enableHaptics) {
      Vibration.vibrate(50); // Medium vibration for success
    }

    // Brief success animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animationTiming.quick,
        useNativeDriver: true,
      }),
    ]).start();

    // Execute the action
    onPress();
  };

  // Get button style based on variant
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...utils.getShadow('sm'),
    };

    // Size-based padding
    const sizeStyles = {
      small: {
        paddingVertical: spacing.component.button.paddingVerticalSmall,
        paddingHorizontal: spacing.component.button.paddingHorizontalSmall,
      },
      medium: {
        paddingVertical: spacing.component.button.paddingVertical,
        paddingHorizontal: spacing.component.button.paddingHorizontal,
      },
      large: {
        paddingVertical: spacing.component.button.paddingVerticalLarge,
        paddingHorizontal: spacing.component.button.paddingHorizontalLarge,
      },
    };

    // Variant-based colors
    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
      },
      secondary: {
        backgroundColor: colors.secondary,
      },
      accent: {
        backgroundColor: colors.accent,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      },
      danger: {
        backgroundColor: colors.error,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      width: fullWidth ? '100%' : undefined,
    };
  };

  // Get text style based on variant and size
  const getTextStyle = (): TextStyle => {
    const baseStyle = size === 'large' ? textStyles.buttonLarge : textStyles.button;
    
    const variantTextColors = {
      primary: colors.textInverse,
      secondary: colors.textInverse,
      accent: colors.textInverse,
      ghost: colors.text,
      danger: colors.textInverse,
    };

    return {
      ...baseStyle,
      color: variantTextColors[variant],
      ...textStyle,
    };
  };

  // Get loading indicator color
  const getLoadingColor = () => {
    return variant === 'ghost' ? colors.text : colors.textInverse;
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1} // We handle opacity with animations
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      <Animated.View
        style={[
          getButtonStyle(),
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            // Removed animated shadowOffset to avoid native driver conflict
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={getLoadingColor()}
            style={{ marginRight: title ? spacing.sm : 0 }}
          />
        ) : null}
        
        <Text style={getTextStyle()}>
          {title}
        </Text>
        
        {subtitle && (
          <Text
            style={[
              getTextStyle(),
              {
                fontSize: textStyles.caption.fontSize,
                opacity: 0.8,
                marginTop: 2,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedButton;