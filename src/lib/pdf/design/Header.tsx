import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { Colors, Spacing, FontSizes } from '../styles';
import { Text, H1, H2, H3 } from './Typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showUniversityInfo?: boolean;
}

export const Header = ({ 
  title, 
  subtitle,
  showUniversityInfo = true
}: HeaderProps) => {
  return (
    <View style={styles.container}>
      {showUniversityInfo && (
        <View style={styles.universityInfo}>
          <H1 align="center">UNIVERSIDAD NACIONAL DE TRUJILLO</H1>
          <H2 align="center">FACULTAD DE INGENIERÍA</H2>
          <H3 align="center">ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS</H3>
        </View>
      )}

      <View style={styles.titleBar}>
        <Text align="center" size={FontSizes.XL} weight="bold" color={Colors.WHITE}>
          {title.toUpperCase()}
        </Text>
      </View>

      {subtitle && (
        <View style={styles.subtitleContainer}>
          <Text align="center" size={FontSizes.MD} color={Colors.TEXT_LIGHT}>
            {subtitle}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.XL,
  },
  universityInfo: {
    marginBottom: Spacing.LG,
  },
  titleBar: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: 8,
    marginBottom: Spacing.MD,
  },
  subtitleContainer: {
    paddingHorizontal: Spacing.MD,
  },
});
