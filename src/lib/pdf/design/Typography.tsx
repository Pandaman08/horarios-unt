import React from 'react';
import { Text as PDFText, StyleSheet } from '@react-pdf/renderer';
import { Colors, FontSizes, FontFamilies } from '../styles';

interface TextProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  size?: number;
  weight?: 'normal' | 'bold';
  style?: any;
}

export const Text = ({
  children,
  align = 'left',
  color = Colors.TEXT,
  size = FontSizes.MD,
  weight = 'normal',
  style,
}: TextProps) => {
  return (
    <PDFText
      style={[
        styles.base,
        { textAlign: align, color, fontSize: size, fontWeight: weight },
        style,
      ]}
    >
      {children}
    </PDFText>
  );
};

export const H1 = (props: Omit<TextProps, 'size' | 'weight'>) => (
  <Text size={FontSizes.H1} weight="bold" color={Colors.PRIMARY} {...props} />
);

export const H2 = (props: Omit<TextProps, 'size' | 'weight'>) => (
  <Text size={FontSizes.H2} weight="bold" color={Colors.TEXT} {...props} />
);

export const H3 = (props: Omit<TextProps, 'size' | 'weight'>) => (
  <Text size={FontSizes.H3} weight="bold" color={Colors.TEXT} {...props} />
);

export const Small = (props: Omit<TextProps, 'size'>) => (
  <Text size={FontSizes.SM} color={Colors.TEXT_LIGHT} {...props} />
);

export const Label = (props: Omit<TextProps, 'size' | 'weight'>) => (
  <Text size={FontSizes.XS} weight="bold" color={Colors.TEXT_LIGHT} {...props} />
);

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamilies.HELVETICA,
  },
});
