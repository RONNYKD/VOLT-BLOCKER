/**
 * Theme Demo Component - "Calm Authority" Theme Showcase
 * Demonstrates the new color palette, typography, and spacing system
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAppTheme } from '../theme/nativewind-setup';

export const ThemeDemo: React.FC = () => {
  const { colors, textStyles, spacing, utils } = useAppTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg }}>
        
        {/* Header Section */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={utils.getTextStyle('displayMedium', 'text')}>
            🎨 Calm Authority Theme
          </Text>
          <Text style={utils.getTextStyle('body', 'textSecondary')}>
            Professional, trustworthy, and calming design system
          </Text>
        </View>

        {/* Color Palette */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={utils.getTextStyle('h2', 'text')}>Color Palette</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
            
            {/* Primary Colors */}
            <View style={utils.getCardStyle()}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: colors.primary, 
                borderRadius: spacing.borderRadius.md,
                marginBottom: spacing.sm 
              }} />
              <Text style={utils.getTextStyle('caption', 'text')}>Primary</Text>
              <Text style={utils.getTextStyle('caption', 'textMuted')}>Trust Blue</Text>
            </View>

            {/* Secondary Colors */}
            <View style={utils.getCardStyle()}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: colors.secondary, 
                borderRadius: spacing.borderRadius.md,
                marginBottom: spacing.sm 
              }} />
              <Text style={utils.getTextStyle('caption', 'text')}>Secondary</Text>
              <Text style={utils.getTextStyle('caption', 'textMuted')}>Wellness Green</Text>
            </View>

            {/* Accent Colors */}
            <View style={utils.getCardStyle()}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: colors.accent, 
                borderRadius: spacing.borderRadius.md,
                marginBottom: spacing.sm 
              }} />
              <Text style={utils.getTextStyle('caption', 'text')}>Accent</Text>
              <Text style={utils.getTextStyle('caption', 'textMuted')}>Warm Amber</Text>
            </View>
          </View>
        </View>

        {/* Typography */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={utils.getTextStyle('h2', 'text')}>Typography</Text>
          <View style={utils.getCardStyle()}>
            <Text style={utils.getTextStyle('displayLarge', 'text')}>Display Large</Text>
            <Text style={utils.getTextStyle('h1', 'text')}>Heading 1</Text>
            <Text style={utils.getTextStyle('h2', 'text')}>Heading 2</Text>
            <Text style={utils.getTextStyle('h3', 'text')}>Heading 3</Text>
            <Text style={utils.getTextStyle('body', 'text')}>Body text - readable and comfortable</Text>
            <Text style={utils.getTextStyle('bodySmall', 'textSecondary')}>Small body text</Text>
            <Text style={utils.getTextStyle('caption', 'textMuted')}>Caption text</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={utils.getTextStyle('h2', 'text')}>Button Variants</Text>
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            
            <TouchableOpacity style={utils.getButtonStyle('primary')}>
              <Text style={{ color: colors.textInverse, ...textStyles.button }}>
                Primary Button
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={utils.getButtonStyle('secondary')}>
              <Text style={{ color: colors.textInverse, ...textStyles.button }}>
                Secondary Button
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={utils.getButtonStyle('accent')}>
              <Text style={{ color: colors.textInverse, ...textStyles.button }}>
                Accent Button
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={utils.getButtonStyle('ghost')}>
              <Text style={{ color: colors.text, ...textStyles.button }}>
                Ghost Button
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards with Shadows */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={utils.getTextStyle('h2', 'text')}>Card Elevations</Text>
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            
            <View style={{
              ...utils.getCardStyle(),
              ...utils.getShadow('sm')
            }}>
              <Text style={utils.getTextStyle('h4', 'text')}>Small Shadow</Text>
              <Text style={utils.getTextStyle('body', 'textSecondary')}>
                Subtle elevation for cards
              </Text>
            </View>

            <View style={{
              ...utils.getCardStyle(),
              ...utils.getShadow('md')
            }}>
              <Text style={utils.getTextStyle('h4', 'text')}>Medium Shadow</Text>
              <Text style={utils.getTextStyle('body', 'textSecondary')}>
                Standard elevation for interactive elements
              </Text>
            </View>

            <View style={{
              ...utils.getCardStyle(),
              ...utils.getShadow('lg')
            }}>
              <Text style={utils.getTextStyle('h4', 'text')}>Large Shadow</Text>
              <Text style={utils.getTextStyle('body', 'textSecondary')}>
                Strong elevation for modals and overlays
              </Text>
            </View>
          </View>
        </View>

        {/* Status Colors */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={utils.getTextStyle('h2', 'text')}>Status Colors</Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            
            <View style={{
              backgroundColor: colors.successLight,
              padding: spacing.md,
              borderRadius: spacing.borderRadius.md,
              borderLeftWidth: 4,
              borderLeftColor: colors.success,
            }}>
              <Text style={{ color: colors.success, ...textStyles.button }}>
                ✅ Success Message
              </Text>
              <Text style={utils.getTextStyle('body', 'text')}>
                Everything is working perfectly
              </Text>
            </View>

            <View style={{
              backgroundColor: colors.warningLight,
              padding: spacing.md,
              borderRadius: spacing.borderRadius.md,
              borderLeftWidth: 4,
              borderLeftColor: colors.warning,
            }}>
              <Text style={{ color: colors.warning, ...textStyles.button }}>
                ⚠️ Warning Message
              </Text>
              <Text style={utils.getTextStyle('body', 'text')}>
                Please pay attention to this
              </Text>
            </View>

            <View style={{
              backgroundColor: colors.errorLight,
              padding: spacing.md,
              borderRadius: spacing.borderRadius.md,
              borderLeftWidth: 4,
              borderLeftColor: colors.error,
            }}>
              <Text style={{ color: colors.error, ...textStyles.button }}>
                ❌ Error Message
              </Text>
              <Text style={utils.getTextStyle('body', 'text')}>
                Something went wrong
              </Text>
            </View>
          </View>
        </View>

        {/* Emotional Impact Section */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={utils.getTextStyle('h2', 'text')}>Emotional Design</Text>
          
          {/* Trust Section */}
          <View style={{
            ...utils.getCardStyle(),
            ...utils.getShadow('md'),
            backgroundColor: utils.withOpacity(colors.primary, 0.05),
            borderColor: colors.primary,
            borderWidth: 1,
            marginTop: spacing.md,
          }}>
            <Text style={utils.getTextStyle('h3', 'primary')}>
              🛡️ Trustworthy & Secure
            </Text>
            <Text style={utils.getTextStyle('body', 'text')}>
              Deep blue colors convey reliability and professionalism, 
              making users feel confident in the app's security.
            </Text>
          </View>

          {/* Calm Section */}
          <View style={{
            ...utils.getCardStyle(),
            ...utils.getShadow('md'),
            backgroundColor: utils.withOpacity(colors.secondary, 0.05),
            borderColor: colors.secondary,
            borderWidth: 1,
            marginTop: spacing.md,
          }}>
            <Text style={utils.getTextStyle('h3', 'secondary')}>
              🧘‍♀️ Calm & Balanced
            </Text>
            <Text style={utils.getTextStyle('body', 'text')}>
              Sage green promotes wellness and balance, creating a 
              peaceful environment for digital wellness.
            </Text>
          </View>

          {/* Progress Section */}
          <View style={{
            ...utils.getCardStyle(),
            ...utils.getShadow('md'),
            backgroundColor: utils.withOpacity(colors.accent, 0.05),
            borderColor: colors.accent,
            borderWidth: 1,
            marginTop: spacing.md,
          }}>
            <Text style={utils.getTextStyle('h3', 'accent')}>
              ⭐ Progress & Achievement
            </Text>
            <Text style={utils.getTextStyle('body', 'text')}>
              Warm amber highlights achievements and progress, 
              providing positive reinforcement for healthy habits.
            </Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
};

export default ThemeDemo;