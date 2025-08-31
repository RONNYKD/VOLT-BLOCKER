/**
 * Animated Progress Component - "Calm Authority" Theme
 * Emotionally satisfying progress indicators for countdowns and achievements
 * Provides visual feedback that builds user engagement
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  ViewStyle,
  Text,
} from 'react-native';
import { useAppTheme } from '../../theme/nativewind-setup';
import { animationTiming, easingCurves } from '../../theme/animations';

interface AnimatedProgressProps {
  // Progress state
  progress: number; // 0 to 1
  
  // Styling
  variant?: 'linear' | 'circular' | 'ring';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  
  // Content
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  
  // Animation
  animated?: boolean;
  animationDuration?: number;
  
  // Custom styles
  style?: ViewStyle;
  
  // Accessibility
  accessibilityLabel?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  variant = 'linear',
  size = 'medium',
  color = 'primary',
  showPercentage = false,
  showLabel = false,
  label,
  animated = true,
  animationDuration = animationTiming.satisfying,
  style,
  accessibilityLabel,
}) => {
  const { colors, textStyles, spacing, utils } = useAppTheme();
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update progress animation
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, progressAnim, animated, animationDuration]);

  // Pulse animation for active progress
  useEffect(() => {
    if (progress > 0 && progress < 1) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [progress, pulseAnim]);

  // Get color based on variant
  const getProgressColor = () => {
    const colorMap = {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };
    return colorMap[color];
  };

  // Get size dimensions
  const getSizeDimensions = () => {
    const dimensions = {
      small: {
        height: 4,
        borderRadius: 2,
        circularSize: 40,
        strokeWidth: 3,
      },
      medium: {
        height: 6,
        borderRadius: 3,
        circularSize: 60,
        strokeWidth: 4,
      },
      large: {
        height: 8,
        borderRadius: 4,
        circularSize: 80,
        strokeWidth: 5,
      },
    };
    return dimensions[size];
  };

  const dimensions = getSizeDimensions();
  const progressColor = getProgressColor();
  const percentage = Math.round(progress * 100);

  // Linear progress bar
  if (variant === 'linear') {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
      extrapolate: 'clamp',
    });

    return (
      <View style={[{ width: '100%' }, style]}>
        {(showLabel && label) && (
          <Text style={[utils.getTextStyle('caption', 'textSecondary'), { marginBottom: spacing.xs }]}>
            {label}
          </Text>
        )}
        
        <View
          style={{
            height: dimensions.height,
            backgroundColor: colors.border,
            borderRadius: dimensions.borderRadius,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: progressColor,
              borderRadius: dimensions.borderRadius,
              width: progressWidth,
              transform: [{ scale: pulseAnim }],
            }}
          />
        </View>
        
        {showPercentage && (
          <Text style={[utils.getTextStyle('caption', 'textMuted'), { marginTop: spacing.xs, textAlign: 'right' }]}>
            {percentage}%
          </Text>
        )}
      </View>
    );
  }

  // Circular progress (simplified version)
  if (variant === 'circular') {
    const circumference = 2 * Math.PI * (dimensions.circularSize / 2 - dimensions.strokeWidth);
    const strokeDashoffset = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [circumference, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={[{ alignItems: 'center' }, style]}>
        {(showLabel && label) && (
          <Text style={[utils.getTextStyle('caption', 'textSecondary'), { marginBottom: spacing.sm }]}>
            {label}
          </Text>
        )}
        
        <View
          style={{
            width: dimensions.circularSize,
            height: dimensions.circularSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Background circle */}
          <View
            style={{
              position: 'absolute',
              width: dimensions.circularSize,
              height: dimensions.circularSize,
              borderRadius: dimensions.circularSize / 2,
              borderWidth: dimensions.strokeWidth,
              borderColor: colors.border,
            }}
          />
          
          {/* Progress circle (simplified - would need SVG for proper implementation) */}
          <Animated.View
            style={{
              position: 'absolute',
              width: dimensions.circularSize,
              height: dimensions.circularSize,
              borderRadius: dimensions.circularSize / 2,
              borderWidth: dimensions.strokeWidth,
              borderColor: progressColor,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: progress > 0.5 ? progressColor : 'transparent',
              borderLeftColor: progress > 0.25 ? progressColor : 'transparent',
              transform: [
                { rotate: '-90deg' },
                { scale: pulseAnim },
              ],
            }}
          />
          
          {/* Center content */}
          <View style={{ alignItems: 'center' }}>
            {showPercentage && (
              <Text style={utils.getTextStyle('h4', 'text')}>
                {percentage}%
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Ring progress (similar to circular but thinner)
  if (variant === 'ring') {
    return (
      <View style={[{ alignItems: 'center' }, style]}>
        {(showLabel && label) && (
          <Text style={[utils.getTextStyle('caption', 'textSecondary'), { marginBottom: spacing.sm }]}>
            {label}
          </Text>
        )}
        
        <View
          style={{
            width: dimensions.circularSize,
            height: dimensions.circularSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Background ring */}
          <View
            style={{
              position: 'absolute',
              width: dimensions.circularSize,
              height: dimensions.circularSize,
              borderRadius: dimensions.circularSize / 2,
              borderWidth: 2,
              borderColor: colors.border,
            }}
          />
          
          {/* Progress ring */}
          <Animated.View
            style={{
              position: 'absolute',
              width: dimensions.circularSize,
              height: dimensions.circularSize,
              borderRadius: dimensions.circularSize / 2,
              borderWidth: 2,
              borderColor: 'transparent',
              borderTopColor: progressColor,
              transform: [
                { rotate: '-90deg' },
                { scale: pulseAnim },
              ],
            }}
          />
          
          {/* Center content */}
          <View style={{ alignItems: 'center' }}>
            {showPercentage && (
              <Text style={utils.getTextStyle('bodySmall', 'text')}>
                {percentage}%
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  return null;
};

export default AnimatedProgress;