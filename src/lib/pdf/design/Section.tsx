import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { Colors, Spacing, FontSizes } from '../styles';
import { Text } from './Typography';

interface SectionProps {
  title: string;
  rightLabel?: string;
  children: React.ReactNode;
  breakBefore?: boolean;
}

export const Section = ({ title, rightLabel, children, breakBefore = false }: SectionProps) => {
  const containerStyle = [styles.container];
  if (breakBefore) {
    containerStyle.push({ breakBefore: 'page' } as any);
  }
  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <Text size={FontSizes.LG} weight="bold" color={Colors.WHITE}>
          {title}
        </Text>
        {rightLabel && (
          <Text size={FontSizes.MD} weight="bold" color={Colors.WHITE}>
            {rightLabel}
          </Text>
        )}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.XL,
  },
  header: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    paddingTop: Spacing.MD,
  },
});
