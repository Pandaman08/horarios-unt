import React from 'react';
import { Page as PDFPage, StyleSheet, View } from '@react-pdf/renderer';
import { Colors, Spacing } from '../styles';

interface PageProps {
  children: React.ReactNode;
  orientation?: 'portrait' | 'landscape';
  size?: 'A4' | 'LETTER';
}

export const Page = ({ 
  children, 
  orientation = 'portrait', 
  size = 'A4' 
}: PageProps) => {
  return (
    <PDFPage 
      size={size} 
      orientation={orientation} 
      style={styles.page}
    >
      <View style={styles.content}>
        {children}
      </View>
    </PDFPage>
  );
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: Colors.WHITE,
    paddingTop: Spacing.PAGE_MARGIN,
    paddingBottom: Spacing.PAGE_MARGIN,
    paddingLeft: Spacing.PAGE_MARGIN,
    paddingRight: Spacing.PAGE_MARGIN,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
});
