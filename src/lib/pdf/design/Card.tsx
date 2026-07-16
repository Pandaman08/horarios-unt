import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { Colors, Spacing, FontSizes } from '../styles';
import { Text } from './Typography';

interface CardProps {
  children: React.ReactNode;
  style?: any;
}

export const Card = ({ children, style }: CardProps) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

interface SummaryCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export const SummaryCard = ({ 
  label, 
  value, 
  color = Colors.PRIMARY 
}: SummaryCardProps) => {
  return (
    <Card style={styles.summaryCard}>
      <Text size={FontSizes.XXXL} weight="bold" color={color}>
        {value}
      </Text>
      <Text size={FontSizes.SM} color={Colors.TEXT_LIGHT}>
        {label}
      </Text>
    </Card>
  );
};

interface SummaryCardsProps {
  items: { label: string; value: string | number; color?: string }[];
}

export const SummaryCards = ({ items }: SummaryCardsProps) => {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <SummaryCard 
          key={index} 
          label={item.label} 
          value={item.value} 
          color={item.color} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: 8,
    padding: Spacing.MD,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.LG,
    marginHorizontal: Spacing.XS,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.LG,
  },
});
