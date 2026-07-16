import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { Colors, Spacing, FontSizes } from '../styles';
import { Text } from './Typography';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'muted' | 'success' | 'danger';
  style?: any;
}

export const Badge = ({ 
  children, 
  variant = 'primary', 
  style 
}: BadgeProps) => {
  const variantStyles = {
    primary: { backgroundColor: Colors.PRIMARY, color: Colors.WHITE },
    secondary: { backgroundColor: Colors.SECONDARY, color: Colors.WHITE },
    muted: { backgroundColor: Colors.BACKGROUND, color: Colors.TEXT_LIGHT },
    success: { backgroundColor: Colors.SUCCESS, color: Colors.WHITE },
    danger: { backgroundColor: Colors.DANGER, color: Colors.WHITE },
  };

  const currentStyle = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: currentStyle.backgroundColor }, style]}>
      <Text size={FontSizes.XS} weight="bold" color={currentStyle.color}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: Spacing.XS,
    paddingHorizontal: Spacing.SM,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});
