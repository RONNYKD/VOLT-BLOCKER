/**
 * Button component with React Native styling
 */
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      width: '75%',
    };
    
    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: '#2563eb' },
      secondary: { backgroundColor: '#7c3aed' },
      outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2563eb' },
      danger: { backgroundColor: '#dc2626' },
    };
    
    const sizeStyles: Record<string, ViewStyle> = {
      sm: { paddingHorizontal: 12, paddingVertical: 8 },
      md: { paddingHorizontal: 16, paddingVertical: 12 },
      lg: { paddingHorizontal: 24, paddingVertical: 16 },
    };
    
    const disabledStyle: ViewStyle = disabled || loading ? { opacity: 0.5 } : {};
    
    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...disabledStyle,
    };
  };
  
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '500',
      textAlign: 'center',
    };
    
    const variantStyles: Record<string, TextStyle> = {
      primary: { color: '#ffffff' },
      secondary: { color: '#ffffff' },
      outline: { color: '#2563eb' },
      danger: { color: '#ffffff' },
    };
    
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };
    
    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size],
    };
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? '#2563eb' : '#ffffff'} 
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={getTextStyle()}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};