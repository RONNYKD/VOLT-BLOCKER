/**
 * Input component with validation and error handling
 */
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  isDisabled?: boolean;
  isDark?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  size = 'md',
  isRequired = false,
  isDisabled = false,
  isDark = false,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const isPassword = secureTextEntry;

  const getContainerStyle = () => {
    const baseStyle = {
      marginBottom: 16,
      opacity: isDisabled ? 0.6 : 1,
    };
    return baseStyle;
  };

  const getInputContainerStyle = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      borderRadius: 8,
      borderWidth: variant === 'outlined' ? 1 : 0,
    };

    const sizeStyles = {
      sm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 40 },
      md: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
      lg: { paddingHorizontal: 20, paddingVertical: 16, minHeight: 56 },
    };

    const variantStyles = {
      default: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      filled: {
        backgroundColor: isDark ? '#374151' : '#F3F4F6',
        borderColor: 'transparent',
      },
      outlined: {
        backgroundColor: 'transparent',
        borderColor: hasError 
          ? '#EF4444' 
          : isFocused 
            ? '#2563EB' 
            : isDark ? '#4B5563' : '#D1D5DB',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getInputStyle = () => {
    const baseStyle = {
      flex: 1,
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
      color: isDark ? '#FFFFFF' : '#000000',
      paddingVertical: 0, // Remove default padding
    };
    return baseStyle;
  };

  const getLabelStyle = () => {
    return {
      fontSize: 14,
      fontWeight: '500' as const,
      marginBottom: 6,
      color: hasError ? '#EF4444' : isDark ? '#FFFFFF' : '#374151',
    };
  };

  const getHelperTextStyle = () => {
    return {
      fontSize: 12,
      marginTop: 4,
      color: hasError ? '#EF4444' : isDark ? '#9CA3AF' : '#6B7280',
    };
  };

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
          {isRequired && <Text style={{ color: '#EF4444' }}> *</Text>}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={{ marginRight: 12 }}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={getInputStyle()}
          secureTextEntry={isPassword && !isPasswordVisible}
          editable={!isDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ marginLeft: 12 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            ) : (
              <Eye size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            )}
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <View style={{ marginLeft: 12 }}>
            {rightIcon}
          </View>
        )}
        
        {hasError && (
          <View style={{ marginLeft: 12 }}>
            <AlertCircle size={20} color="#EF4444" />
          </View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={getHelperTextStyle()}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};