/**
 * Modal component for dialogs and overlays
 */
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Card } from './Card';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  isDark?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isVisible,
  onClose,
  title,
  children,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  isDark = false,
}) => {
  const getModalStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    };

    const positionStyles: Record<string, ViewStyle> = {
      center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      top: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 60,
        padding: 20,
      },
      bottom: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
        padding: 20,
      },
    };

    return {
      ...baseStyle,
      ...positionStyles[position],
    };
  };

  const getContentStyle = (): ViewStyle => {
    const sizeStyles: Record<string, ViewStyle> = {
      sm: { width: '80%', maxWidth: 300 },
      md: { width: '85%', maxWidth: 400 },
      lg: { width: '90%', maxWidth: 500 },
      xl: { width: '95%', maxWidth: 600 },
      full: { width: '100%', height: '100%' },
    };

    return {
      width: '100%',
      maxHeight: '80%',
      ...sizeStyles[size],
    };
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={getModalStyle()}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={getContentStyle()}>
              <Card
                variant="elevated"
                padding="lg"
                borderRadius="lg"
                isDark={isDark}
                style={{ width: '100%' }}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <View style={styles.header}>
                    {title && (
                      <Text style={[
                        styles.title,
                        { color: isDark ? '#FFFFFF' : '#000000' }
                      ]}>
                        {title}
                      </Text>
                    )}
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                      >
                        <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Content */}
                <View style={styles.content}>
                  {children}
                </View>
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
});