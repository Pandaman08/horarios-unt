import React from 'react';
import { View, StyleSheet, Text } from '@react-pdf/renderer';
import { Colors, Spacing, FontSizes } from '../styles';

interface FooterProps {
  generatedAt?: Date;
}

export const Footer = ({ generatedAt = new Date() }: FooterProps) => {
  const formattedDate = generatedAt.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container} fixed>
      <View style={styles.divider} />
      <View style={styles.content}>
        <Text style={styles.text}>
          Sistema de Gestión de Horarios UNT
        </Text>
        <Text style={styles.text}>
          Generado el {formattedDate}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.PAGE_MARGIN - Spacing.SM,
    left: Spacing.PAGE_MARGIN,
    right: Spacing.PAGE_MARGIN,
    paddingTop: Spacing.SM,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
    marginBottom: Spacing.SM,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    fontFamily: 'Helvetica',
    fontSize: FontSizes.XS,
    color: Colors.TEXT_LIGHT,
  },
});
