/**
 * FormField component - Wrapper for form inputs with consistent styling
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  isDark?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  isRequired = false,
  isDark = false,
  children,
}) => {
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[
          styles.label,
          { color: hasError ? '#EF4444' : isDark ? '#FFFFFF' : '#374151' }
        ]}>
          {label}
          {isRequired && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      {children}
      
      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          { color: hasError ? '#EF4444' : isDark ? '#9CA3AF' : '#6B7280' }
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});