/**
 * FormContainer component - Wrapper for forms with consistent styling
 */
import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Card } from '../ui/Card';

interface FormContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  showCard?: boolean;
  isDark?: boolean;
  style?: ViewStyle;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  scrollable = false,
  showCard = true,
  isDark = false,
  style,
}) => {
  const content = (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );

  const wrappedContent = showCard ? (
    <Card variant="outlined" padding="lg" isDark={isDark}>
      {content}
    </Card>
  ) : content;

  if (scrollable) {
    return (
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {wrappedContent}
      </ScrollView>
    );
  }

  return wrappedContent;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
});